import { DrugInfo } from "../types";

// ==========================================
// 阿里千问 API 配置
// ==========================================
const API_KEY = "sk-f100fa7f93ca4dedba220d52f923e3ab"; 

const API_URL = "/api/qwen-chat"; 

/**
 * 核心：调用千问 API 的通用函数
 */
async function callQwenApi(model: string, messages: any[]): Promise<DrugInfo> {
  // 定义系统提示词，要求更详尽的内容
  const systemPrompt = `
  你是一位拥有20年经验的资深临床药剂师。请根据用户的输入（药品名称或药品图片），生成一份**极其详尽且专业**的药品说明书。
  
  必须严格输出纯 JSON 格式，不要包含 Markdown。
  JSON 结构如下：
  {
    "name": "药品通用名 (商品名) - 英文名",
    "indications": "详细列出适应症，请尽量全面。",
    "dosage": "详细的用法用量（包括成人、儿童、特殊人群），请分点描述。",
    "contraindications": "详细的禁忌症，包括特定人群和疾病。",
    "storage": "具体的贮藏方式（温度、避光等）。",
    "sideEffects": "详细列出常见和罕见的不良反应。",
    "usage_tips": "这是非常重要的一部分。请给出3-5条生活化的温馨提示，例如：服药期间能不能喝酒？饭前还是饭后吃？吃药期间忌口什么？如果漏服了怎么办？",
    "summary": "一段约150字的通俗易懂的总结，语气亲切温暖，适合语音播报，概括核心功效和最关键的注意事项。"
  }
  如果无法识别出药品，请在 name 字段返回 "未识别"。
  `;

  const payload = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    response_format: { type: "json_object" } 
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI 未返回内容");
    }

    const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const drugInfo: DrugInfo = JSON.parse(cleanJson);
      if (drugInfo.name === "未识别") {
        throw new Error("无法识别该药品，请确保图片清晰或名称正确。");
      }
      return drugInfo;
    } catch (e) {
      console.error("JSON Parse Error:", content);
      throw new Error("AI 返回的数据格式有误，请重试。");
    }

  } catch (error: any) {
    console.error("Qwen API Call Failed:", error);
    if (error.message.includes("Failed to fetch") || error.message.includes("API 请求失败")) {
       throw new Error("网络请求失败。请检查网络连接。");
    }
    throw error;
  }
}

export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  const messages = [
    { role: "user", content: `请详细查询药品：${query}，并提供全面的用药指导。` }
  ];
  return callQwenApi("qwen-plus", messages);
};

export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: "请精准识别这张图片中的药品，提取所有文字信息，并生成详细的说明书和用药建议。" },
        { type: "image_url", image_url: { url: base64Image } }
      ]
    }
  ];
  return callQwenApi("qwen-vl-max", messages);
};