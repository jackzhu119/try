import { GoogleGenAI, Type } from "@google/genai";
import { DrugInfo } from "../types";

// Initialize the Google GenAI client with the API key from the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for the drug information response.
const drugInfoSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "药品通用名 (商品名) - 英文名" },
    indications: { type: Type.STRING, description: "详细列出适应症，请尽量全面。" },
    dosage: { type: Type.STRING, description: "详细的用法用量（包括成人、儿童、特殊人群），请分点描述。" },
    contraindications: { type: Type.STRING, description: "详细的禁忌症，包括特定人群和疾病。" },
    storage: { type: Type.STRING, description: "具体的贮藏方式（温度、避光等）。" },
    sideEffects: { type: Type.STRING, description: "详细列出常见和罕见的不良反应。" },
    usage_tips: { type: Type.STRING, description: "这是非常重要的一部分。请给出3-5条生活化的温馨提示，例如：服药期间能不能喝酒？饭前还是饭后吃？吃药期间忌口什么？如果漏服了怎么办？" },
    summary: { type: Type.STRING, description: "一段约150字的通俗易懂的总结，语气亲切温暖，适合语音播报，概括核心功效和最关键的注意事项。" },
  },
  required: ["name", "indications", "dosage", "contraindications", "storage", "sideEffects", "usage_tips", "summary"],
};

// System instruction for the model.
const SYSTEM_INSTRUCTION = `
你是一位拥有20年经验的资深临床药剂师。请根据用户的输入（药品名称或药品图片），生成一份**极其详尽且专业**的药品说明书。
如果无法识别出药品，请在 name 字段返回 "未识别"。
`;

export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `请详细查询药品：${query}，并提供全面的用药指导。`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: drugInfoSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI 未返回内容");
  }

  try {
    const drugInfo = JSON.parse(text) as DrugInfo;
    if (drugInfo.name === "未识别") {
      throw new Error("无法识别该药品，请确保名称正确。");
    }
    return drugInfo;
  } catch (e) {
    console.error("Parse error", e);
    throw new Error("解析 AI 返回数据失败");
  }
};

export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  // Extract mimeType and base64 data from the data URL.
  // Format: data:[<mediatype>][;base64],<data>
  const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid image format");
  }
  const mimeType = matches[1];
  const data = matches[2];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: data,
          },
        },
        {
          text: "请精准识别这张图片中的药品，提取所有文字信息，并生成详细的说明书和用药建议。",
        },
      ],
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: drugInfoSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI 未返回内容");
  }

  try {
    const drugInfo = JSON.parse(text) as DrugInfo;
    if (drugInfo.name === "未识别") {
      throw new Error("无法识别该药品，请确保图片清晰。");
    }
    return drugInfo;
  } catch (e) {
    console.error("Parse error", e);
    throw new Error("解析 AI 返回数据失败");
  }
};