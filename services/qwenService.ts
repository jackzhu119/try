import { DrugInfo, DiagnosisInfo, Language } from "../types";

const API_KEY = process.env.API_KEY;

// Use proxy paths configured in vite.config.ts / vercel.json to avoid CORS
const TEXT_API_URL = "/api/qwen/text"; 
const VL_API_URL = "/api/qwen/multimodal";

// Helper to call Qwen API
const callQwen = async (messages: any[], model: string = 'qwen-plus') => {
  if (!API_KEY) throw new Error("API Key is missing");

  try {
    const response = await fetch(TEXT_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: { messages: messages },
        parameters: { result_format: 'message' } // simplified return
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Qwen API Error");
    }

    const data = await response.json();
    return data.output.choices[0].message.content;
  } catch (error) {
    console.error("Qwen Service Error:", error);
    throw error;
  }
};

// Helper to call Qwen VL API
const callQwenVL = async (messages: any[]) => {
    if (!API_KEY) throw new Error("API Key is missing");
  
    try {
      const response = await fetch(VL_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-WorkSpace': 'modal'
        },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          input: { messages: messages },
          parameters: {}
        })
      });
  
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Qwen VL API Error");
      }
  
      const data = await response.json();
      return data.output.choices[0].message.content[0].text;
    } catch (error) {
      console.error("Qwen VL Service Error:", error);
      throw error;
    }
  };

// --- Prompts ---

const getSystemPrompt = (lang: Language, type: 'DRUG' | 'DIAGNOSIS') => {
    if (type === 'DRUG') {
      return `You are a senior clinical pharmacist. 
      Based on the user's input, generate a detailed drug instruction manual in JSON format.
      JSON Schema:
      {
        "name": "Drug Name",
        "indications": "Indications",
        "dosage": "Dosage",
        "contraindications": "Contraindications",
        "storage": "Storage",
        "sideEffects": "Side Effects",
        "usage_tips": "3-5 tips",
        "summary": "150-word summary"
      }
      If unrecognized, set name to "Unrecognized".
      Respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}** only. Return ONLY JSON.`;
    } else {
      return `You are a General Practitioner. 
      Perform a differential diagnosis based on symptoms/images.
      JSON Schema:
      {
        "urgency": "Low/Medium/High",
        "urgency_reason": "Reason",
        "summary": "100-word summary",
        "potential_conditions": [
          { "name": "Condition", "probability": "High/Med/Low", "explanation": "Why?", "medications": ["Meds"], "treatments": ["Advice"] }
        ],
        "lifestyle_advice": "Advice"
      }
      Respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}** only. Return ONLY JSON.`;
    }
};

const extractJSON = (text: string) => {
    // Try to find JSON block if wrapped in markdown code blocks
    const jsonMatch = text.match(/```json\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    
    // Try to find raw JSON object
    const rawMatch = text.match(/\{[\s\S]*\}/);
    if (rawMatch) return JSON.parse(rawMatch[0]);
    
    return JSON.parse(text);
};

// --- API Methods ---

export const getDrugInfoFromText = async (query: string, lang: Language): Promise<DrugInfo> => {
    const prompt = getSystemPrompt(lang, 'DRUG');
    const messages = [
        { role: 'system', content: prompt },
        { role: 'user', content: lang === 'zh' ? `查询药品：${query}` : `Identify drug: ${query}` }
    ];

    const text = await callQwen(messages);
    return extractJSON(text) as DrugInfo;
};

export const getDrugInfoFromImage = async (base64Image: string, lang: Language): Promise<DrugInfo> => {
    const prompt = getSystemPrompt(lang, 'DRUG');
    const messages = [
        {
            role: 'user',
            content: [
                { image: base64Image }, // DashScope supports data URI now
                { text: prompt + (lang === 'zh' ? "\n识别图中的药品" : "\nIdentify the drug") }
            ]
        }
    ];

    const text = await callQwenVL(messages);
    return extractJSON(text) as DrugInfo;
};

export const analyzeSymptoms = async (symptoms: string, base64Image: string | undefined, lang: Language): Promise<DiagnosisInfo> => {
    const prompt = getSystemPrompt(lang, 'DIAGNOSIS');
    
    if (base64Image) {
        const messages = [
            {
                role: 'user',
                content: [
                    { image: base64Image },
                    { text: prompt + `\n${lang === 'zh' ? "我的症状：" : "My symptoms: "}${symptoms || "None"}` }
                ]
            }
        ];
        const text = await callQwenVL(messages);
        return extractJSON(text) as DiagnosisInfo;
    } else {
        const messages = [
            { role: 'system', content: prompt },
            { role: 'user', content: lang === 'zh' ? `我的症状：${symptoms}` : `My symptoms: ${symptoms}` }
        ];
        const text = await callQwen(messages);
        return extractJSON(text) as DiagnosisInfo;
    }
};

export const askFollowUpQuestion = async (context: string, question: string, lang: Language): Promise<string> => {
    const systemPrompt = lang === 'zh' 
      ? "你是一位友善、专业的医疗助手。请根据提供的上下文回答追问。回答要简洁（100字以内），安抚用户情绪。"
      : "You are a friendly, professional medical assistant. Answer based on context. Keep it concise (under 100 words) and reassuring.";
  
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
    ];
  
    return await callQwen(messages);
};
