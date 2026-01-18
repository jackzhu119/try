import { DrugInfo } from "../types";

// Helper to clean JSON string if it's wrapped in markdown code blocks
function cleanJsonString(str: string): string {
  if (!str) return "";
  // Remove ```json ... ``` or ``` ... ```
  let cleaned = str.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "");
  return cleaned.trim();
}

const SYSTEM_PROMPT = `
你是一位拥有20年经验的资深临床药剂师。请根据用户的输入（药品名称或药品图片），生成一份**极其详尽且专业**的药品说明书。

请务必返回合法的 JSON 格式，不要包含 Markdown 格式标记，Schema 如下：
{
  "name": "药品通用名 (商品名) - 英文名，如果无法识别或图片不清晰，请返回 '未识别'",
  "indications": "详细列出适应症，请尽量全面。",
  "dosage": "详细的用法用量（包括成人、儿童、特殊人群），请分点描述。",
  "contraindications": "详细的禁忌症，包括特定人群和疾病。",
  "storage": "具体的贮藏方式（温度、避光等）。",
  "sideEffects": "详细列出常见和罕见的不良反应。",
  "usage_tips": "这是非常重要的一部分。请给出3-5条生活化的温馨提示，例如：服药期间能不能喝酒？饭前还是饭后吃？吃药期间忌口什么？如果漏服了怎么办？",
  "summary": "一段约150字的通俗易懂的总结，语气亲切温暖，适合语音播报，概括核心功效和最关键的注意事项。"
}
`;

async function callQwenApi(messages: any[], model: string): Promise<DrugInfo> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Missing API Key. Please configure process.env.API_KEY.");
  }

  // Use the proxy endpoint we configured in vite.config.ts / vercel.json
  const endpoint = "/api/qwen/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.5,
      response_format: { type: "json_object" } // Qwen supports json mode hints
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Qwen API Error:", errorBody);
    throw new Error(`AI 服务暂时不可用 (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI 未返回有效内容");
  }

  try {
    const cleanedJson = cleanJsonString(content);
    const drugInfo = JSON.parse(cleanedJson) as DrugInfo;
    
    if (drugInfo.name === "未识别" || drugInfo.name.includes("未识别")) {
      throw new Error("无法识别该药品，请确保名称正确或图片清晰。");
    }
    
    return drugInfo;
  } catch (e) {
    console.error("JSON Parse Error:", e, "Content:", content);
    throw new Error("解析 AI 返回数据失败");
  }
}

export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `请详细查询药品：${query}，并提供全面的用药指导。` }
  ];
  // Using qwen-plus for high quality text generation
  return callQwenApi(messages, "qwen-plus");
};

export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { 
      role: "user", 
      content: [
        { type: "text", text: "请精准识别这张图片中的药品，提取所有文字信息，并生成详细的说明书和用药建议。" },
        { 
          type: "image_url", 
          image_url: { 
            url: base64Image // Pass full data URI directly
          } 
        }
      ] 
    }
  ];
  // Using qwen-vl-max for best image recognition
  return callQwenApi(messages, "qwen-vl-max");
};