import { DrugInfo, DiagnosisInfo, Language } from "../types";

// Helper to clean JSON string
function cleanJsonString(str: string): string {
  if (!str) return "";
  let cleaned = str.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "");
  return cleaned.trim();
}

// --- Drug Info Prompts ---

const getDrugSystemPrompt = (lang: Language) => `
You are a senior clinical pharmacist with 20 years of experience. Based on the user's input (drug name or image), generate an extremely detailed and professional drug instruction manual.

**CRITICAL INSTRUCTION**: You must respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE (简体中文)' : 'ENGLISH'}** only.

Please return a valid JSON object. Do not include Markdown formatting. Schema:
{
  "name": "Drug Generic Name (Brand Name) ${lang === 'zh' ? '- English Name' : ''}. If unrecognized, return '${lang === 'zh' ? '未识别' : 'Unrecognized'}'",
  "indications": "Detailed list of indications.",
  "dosage": "Detailed dosage and usage (adults, children, special groups).",
  "contraindications": "Detailed contraindications.",
  "storage": "Specific storage methods.",
  "sideEffects": "Common and rare side effects.",
  "usage_tips": "3-5 practical, life-friendly tips (alcohol? with food? missed dose?).",
  "summary": "A 150-word warm, easy-to-understand summary suitable for voice playback."
}
`;

// --- Diagnosis Prompts ---

const getDiagnosisSystemPrompt = (lang: Language) => `
You are an experienced General Practitioner. The user will describe symptoms and may provide an image.
Perform a differential diagnosis, analyzing 2-3 most likely causes.

**CRITICAL INSTRUCTION**: You must respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE (简体中文)' : 'ENGLISH'}** only.
**DISCLAIMER**: Your response is for reference only.

Please return a valid JSON object. Schema:
{
  "urgency": "Low" | "Medium" | "High",
  "urgency_reason": "Reason for urgency assessment.",
  "summary": "A 100-word professional yet caring summary for voice playback.",
  "potential_conditions": [
    {
      "name": "Condition Name",
      "probability": "${lang === 'zh' ? '高/中/低' : 'High/Medium/Low'}",
      "explanation": "Why this condition? Combine symptom and visual analysis.",
      "medications": ["Medication 1 (OTC)", "Medication 2"],
      "treatments": ["Physical therapy 1", "Rest advice"]
    }
  ],
  "lifestyle_advice": "General diet/rest/exercise advice applicable to all possibilities."
}
`;

async function callQwenApi(messages: any[], model: string, jsonMode: boolean = true): Promise<any> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API Key.");
  }

  const endpoint = "/api/qwen/chat/completions";

  const body: any = {
    model: model,
    messages: messages,
    temperature: 0.5,
  };

  if (jsonMode) {
      body.response_format = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`AI Service Unavailable (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content returned from AI");
  }

  if (jsonMode) {
    try {
        const cleanedJson = cleanJsonString(content);
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("Failed to parse AI response");
    }
  }
  
  return content;
}

export const getDrugInfoFromText = async (query: string, lang: Language): Promise<DrugInfo> => {
  const messages = [
    { role: "system", content: getDrugSystemPrompt(lang) },
    { role: "user", content: lang === 'zh' ? `查询药品：${query}` : `Identify drug: ${query}` }
  ];
  const result = await callQwenApi(messages, "qwen-turbo");
  if (result.name.includes("未识别") || result.name.includes("Unrecognized")) {
      throw new Error(lang === 'zh' ? "无法识别该药品" : "Drug not recognized");
  }
  return result as DrugInfo;
};

export const getDrugInfoFromImage = async (base64Image: string, lang: Language): Promise<DrugInfo> => {
  const messages = [
    { role: "system", content: getDrugSystemPrompt(lang) },
    { 
      role: "user", 
      content: [
        { type: "text", text: lang === 'zh' ? "识别图片中的药品" : "Identify the drug in this image" },
        { type: "image_url", image_url: { url: base64Image } }
      ] 
    }
  ];
  const result = await callQwenApi(messages, "qwen-vl-max");
  if (result.name.includes("未识别") || result.name.includes("Unrecognized")) {
      throw new Error(lang === 'zh' ? "无法识别该药品" : "Drug not recognized");
  }
  return result as DrugInfo;
};

export const analyzeSymptoms = async (symptoms: string, base64Image: string | undefined, lang: Language): Promise<DiagnosisInfo> => {
  let messages;
  let model = "qwen-plus";

  const userText = lang === 'zh' 
    ? `我的症状：${symptoms || "(仅图片)"}` 
    : `My symptoms: ${symptoms || "(Image only)"}`;

  if (base64Image) {
    model = "qwen-vl-max";
    messages = [
      { role: "system", content: getDiagnosisSystemPrompt(lang) },
      { 
        role: "user", 
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: base64Image } }
        ] 
      }
    ];
  } else {
    messages = [
      { role: "system", content: getDiagnosisSystemPrompt(lang) },
      { role: "user", content: userText }
    ];
  }

  const result = await callQwenApi(messages, model);
  return result as DiagnosisInfo;
};

// --- Follow-up Chat ---

export const askFollowUpQuestion = async (
    context: string, 
    question: string, 
    lang: Language
): Promise<string> => {
    const systemPrompt = lang === 'zh' 
        ? "你是一位友善、专业的医疗助手。请根据提供的[诊断信息/药品信息]上下文，回答用户的追问。回答要简洁明了（100字以内），安抚用户情绪，并给出实用的建议。"
        : "You are a friendly and professional medical assistant. Based on the provided [Diagnosis/Drug Info] context, answer the user's follow-up question. Keep the answer concise (under 100 words), reassuring, and practical.";

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Context Info:\n${context}` },
        { role: "user", content: question }
    ];

    // Using non-JSON mode for chat
    const result = await callQwenApi(messages, "qwen-turbo", false);
    return result as string;
}
