import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DashScope-WorkSpace"
      } as Record<string, string>,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: {
        "Access-Control-Allow-Origin": "*"
      } as Record<string, string>,
      body: "Method Not Allowed" 
    };
  }

  try {
    let body = event.body || "";
    if (event.isBase64Encoded) {
      body = Buffer.from(body, 'base64').toString('utf-8');
    }

    let isMultimodal = event.path.includes("multimodal");
    try {
      const parsedBody = JSON.parse(body);
      if (parsedBody.model && parsedBody.model.includes("vl")) {
        isMultimodal = true;
      }
    } catch {
      // ignore parse error here
    }
    
    const targetUrl = isMultimodal 
      ? "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const apiKey = process.env.QWEN_API_KEY || process.env.API_KEY || "sk-e5e7b33d1f684e66be3cd51e52ae0bab";
    const finalAuth = authHeader && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader !== "Bearer " 
      ? authHeader 
      : `Bearer ${apiKey}`;

    const headers: Record<string, string> = {
      "Authorization": finalAuth,
      "Content-Type": "application/json",
    };
    
    const workspaceHeader = event.headers["x-dashscope-workspace"] || event.headers["X-DashScope-WorkSpace"];
    if (workspaceHeader) {
      headers["X-DashScope-WorkSpace"] = workspaceHeader;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const data = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: data
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
