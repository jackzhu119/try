import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DrugInfo } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to ensure consistent medical data extraction
const DRUG_ANALYSIS_SYSTEM_PROMPT = `
You are a professional pharmacist assistant. 
Your goal is to extract medicine information and return it in a structured JSON format.
If the user provides an image, identify the medicine from the packaging text or barcode.
If the user provides text, look up the medicine details.
Always respond in Chinese (Simplified).
Return specific fields: name, indications, dosage, contraindications, sideEffects, storage, and a short 'summary' for reading aloud.
`;

/**
 * Identifies drug info from text query.
 */
export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Please provide the instruction leaflet details for the medicine: "${query}".`,
      config: {
        systemInstruction: DRUG_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Drug brand and generic name" },
            indications: { type: Type.STRING, description: "What it treats" },
            dosage: { type: Type.STRING, description: "How to take it" },
            contraindications: { type: Type.STRING, description: "Who should not take it" },
            sideEffects: { type: Type.STRING, description: "Common side effects" },
            storage: { type: Type.STRING, description: "Storage instructions" },
            summary: { type: Type.STRING, description: "A friendly, conversational summary (approx 50 words) suitable for reading aloud to a patient." },
          },
          required: ["name", "indications", "dosage", "summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return JSON.parse(text) as DrugInfo;
  } catch (error) {
    console.error("Gemini Text Error:", error);
    throw new Error("无法获取药品信息，请重试。");
  }
};

/**
 * Identifies drug info from an image (base64).
 */
export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  try {
    // Clean base64 string if it contains header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Identify this medicine. Read the name or barcode visible on the box. Provide the full instruction manual details."
          }
        ]
      },
      config: {
        systemInstruction: DRUG_ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            indications: { type: Type.STRING },
            dosage: { type: Type.STRING },
            contraindications: { type: Type.STRING },
            sideEffects: { type: Type.STRING },
            storage: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["name", "indications", "dosage", "summary"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return JSON.parse(text) as DrugInfo;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("无法识别图片中的药品，请确保图片清晰。");
  }
};

/**
 * Generates audio from text using Gemini TTS.
 */
export const generateDrugAudio = async (textToSay: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: textToSay }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually a calm voice
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data generated");
    }
    return audioData;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw new Error("语音生成失败");
  }
};