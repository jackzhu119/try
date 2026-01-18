import { DrugInfo } from "../types";

// ==========================================
// 阿里千问 API 配置
// ==========================================
const API_KEY = "sk-f100fa7f93ca4dedba220d52f923e3ab"; // 您提供的 Key

// 使用 Vercel Rewrite 代理地址，避免前端直接调用产生的 CORS 跨域问题
// 如果在本地开发 (npm run dev)，需要配置 vite proxy，或者安装允许跨域的浏览器插件
// 生产环境 (Vercel) 会自动使用 vercel.json 中的 rewrite 规则
const API_URL = "/api/qwen-chat"; 

/**
 * 核心：调用千问 API 的通用函数
 */
async function callQwenApi(model: string, messages: any[]): Promise<DrugInfo> {
  // 定义系统提示词，强制要求返回 JSON
  const systemPrompt = `
  你是一位专业的药剂师助手。请根据用户的输入（药品名称或药品图片内容），生成详细的药品说明书。
  
  必须严格输出纯 JSON 格式，不要包含 Markdown 代码块（如 \`\`\`json），不要包含其他废话。
  JSON 结构如下：
  {
    "name": "药品通用名 (商品名)",
    "indications": "详细的适应症",
    "dosage": "详细的用法用量",
    "contraindications": "禁忌",
    "storage": "贮藏方式",
    "sideEffects": "不良反应",
    "summary": "一段约100字的通俗易懂的总结，语气亲切，适合语音播报，包含主要功效和注意事项。"
  }
  如果无法识别出药品，请在 name 字段返回 "未识别"。
  `;

  // 构建请求体
  const payload = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    // 强制 JSON 模式 (部分千问模型支持，若不支持则依赖 Prompt)
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
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI 未返回内容");
    }

    // 清理可能存在的 Markdown 标记
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
    // 如果是网络错误或跨域错误，给出一个友好的提示
    if (error.message.includes("Failed to fetch") || error.message.includes("API 请求失败")) {
       throw new Error("网络请求失败。如果您是在本地运行，请检查跨域设置；如果您在 Vercel，请检查 API 代理。");
    }
    throw error;
  }
}

/**
 * 通过文本查询 (使用 qwen-plus 模型，速度快且聪明)
 */
export const getDrugInfoFromText = async (query: string): Promise<DrugInfo> => {
  const messages = [
    { role: "user", content: `请查询药品：${query}` }
  ];
  return callQwenApi("qwen-plus", messages);
};

/**
 * 通过图片识别 (使用 qwen-vl-max 模型，支持视觉识别)
 */
export const getDrugInfoFromImage = async (base64Image: string): Promise<DrugInfo> => {
  // 确保 base64 格式正确
  // 这里的 base64Image 通常包含 "data:image/jpeg;base64," 前缀，千问 API 需要这样的完整 URL
  
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: "请识别这张图片中的药品，并提取其说明书信息。" },
        { type: "image_url", image_url: { url: base64Image } }
      ]
    }
  ];
  
  // Qwen-VL-Max 是阿里最强的视觉模型
  return callQwenApi("qwen-vl-max", messages);
};