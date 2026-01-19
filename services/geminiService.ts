import { GoogleGenAI, Type } from "@google/genai";
import { DrugInfo, DiagnosisInfo, Language } from "../types";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const drugInfoSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Drug Generic Name (Brand Name). If unrecognized, return '未识别' (ZH) or 'Unrecognized' (EN)." },
    indications: { type: Type.STRING, description: "Detailed list of indications." },
    dosage: { type: Type.STRING, description: "Detailed dosage and usage (adults, children, special groups)." },
    contraindications: { type: Type.STRING, description: "Detailed contraindications." },
    storage: { type: Type.STRING, description: "Specific storage methods." },
    sideEffects: { type: Type.STRING, description: "Common and rare side effects." },
    usage_tips: { type: Type.STRING, description: "3-5 practical, life-friendly tips." },
    summary: { type: Type.STRING, description: "A 150-word warm, easy-to-understand summary suitable for voice playback." },
  },
  required: ["name", "indications", "dosage", "contraindications", "storage", "sideEffects", "usage_tips", "summary"],
};

const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    urgency: { type: Type.STRING, description: "Urgency level: 'Low', 'Medium', or 'High'" },
    urgency_reason: { type: Type.STRING, description: "Reason for urgency assessment." },
    summary: { type: Type.STRING, description: "A 100-word professional yet caring summary for voice playback." },
    potential_conditions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Condition Name" },
          probability: { type: Type.STRING, description: "Probability (e.g., High, Medium, Low)" },
          explanation: { type: Type.STRING, description: "Why this condition? Combine symptom and visual analysis." },
          medications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "OTC Medications" },
          treatments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Physical treatments or advice" },
        },
        required: ["name", "probability", "explanation", "medications", "treatments"]
      }
    },
    lifestyle_advice: { type: Type.STRING, description: "General diet/rest/exercise advice." },
  },
  required: ["urgency", "urgency_reason", "summary", "potential_conditions", "lifestyle_advice"],
};

// --- Helpers ---

const getSystemInstruction = (lang: Language, type: 'DRUG' | 'DIAGNOSIS') => {
  if (type === 'DRUG') {
    return `You are a senior clinical pharmacist with 20 years of experience. 
    Based on the user's input (drug name or image), generate an extremely detailed and professional drug instruction manual.
    **CRITICAL**: Respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}** only.`;
  } else {
    return `You are an experienced General Practitioner. 
    Perform a differential diagnosis based on symptoms and visual input.
    **CRITICAL**: Respond in **${lang === 'zh' ? 'SIMPLIFIED CHINESE' : 'ENGLISH'}** only.
    **DISCLAIMER**: Your response is for reference only.`;
  }
};

// --- API Methods ---

export const getDrugInfoFromText = async (query: string, lang: Language): Promise<DrugInfo> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: lang === 'zh' ? `查询药品：${query}` : `Identify drug: ${query}`,
    config: {
      systemInstruction: getSystemInstruction(lang, 'DRUG'),
      responseMimeType: "application/json",
      responseSchema: drugInfoSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error(lang === 'zh' ? "AI 未返回内容" : "No response from AI");

  try {
    const data = JSON.parse(text) as DrugInfo;
    if (data.name.includes("未识别") || data.name.includes("Unrecognized")) {
       throw new Error(lang === 'zh' ? "无法识别该药品" : "Drug not recognized");
    }
    return data;
  } catch (e) {
    console.error(e);
    throw new Error(lang === 'zh' ? "解析数据失败" : "Failed to parse data");
  }
};

export const getDrugInfoFromImage = async (base64Image: string, lang: Language): Promise<DrugInfo> => {
  const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image format");
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: lang === 'zh' ? "精准识别这张图片中的药品" : "Identify the drug in this image" },
      ],
    },
    config: {
      systemInstruction: getSystemInstruction(lang, 'DRUG'),
      responseMimeType: "application/json",
      responseSchema: drugInfoSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error(lang === 'zh' ? "AI 未返回内容" : "No response from AI");

  try {
    const data = JSON.parse(text) as DrugInfo;
    if (data.name.includes("未识别") || data.name.includes("Unrecognized")) {
       throw new Error(lang === 'zh' ? "无法识别该药品" : "Drug not recognized");
    }
    return data;
  } catch (e) {
    console.error(e);
    throw new Error(lang === 'zh' ? "解析数据失败" : "Failed to parse data");
  }
};

export const analyzeSymptoms = async (symptoms: string, base64Image: string | undefined, lang: Language): Promise<DiagnosisInfo> => {
  const parts: any[] = [];
  if (base64Image) {
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (matches) {
      parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }
  parts.push({ text: lang === 'zh' ? `我的症状：${symptoms || "(仅图片)"}` : `My symptoms: ${symptoms || "(Image only)"}` });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Use Pro for reasoning
    contents: { parts },
    config: {
      systemInstruction: getSystemInstruction(lang, 'DIAGNOSIS'),
      responseMimeType: "application/json",
      responseSchema: diagnosisSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error(lang === 'zh' ? "AI 未返回内容" : "No response from AI");

  try {
    return JSON.parse(text) as DiagnosisInfo;
  } catch (e) {
    console.error(e);
    throw new Error(lang === 'zh' ? "解析数据失败" : "Failed to parse data");
  }
};

export const askFollowUpQuestion = async (context: string, question: string, lang: Language): Promise<string> => {
  const systemPrompt = lang === 'zh' 
    ? "你是一位友善、专业的医疗助手。请根据提供的[诊断信息/药品信息]上下文，回答用户的追问。回答要简洁明了（100字以内），安抚用户情绪，并给出实用的建议。"
    : "You are a friendly and professional medical assistant. Based on the provided [Diagnosis/Drug Info] context, answer the user's follow-up question. Keep the answer concise (under 100 words), reassuring, and practical.";

  const content = `
    Context:
    ${context}

    User Question:
    ${question}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: content,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  return response.text || (lang === 'zh' ? "抱歉，我无法回答。" : "Sorry, I cannot answer.");
};
