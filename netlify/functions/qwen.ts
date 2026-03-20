import { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-DashScope-WorkSpace",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const isMultimodal = url.pathname.includes("multimodal");
    
    const targetUrl = isMultimodal 
      ? "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
      : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    const body = await req.text();
    const authHeader = req.headers.get("Authorization");
    const apiKey = process.env.QWEN_API_KEY || process.env.API_KEY || "sk-e5e7b33d1f684e66be3cd51e52ae0bab";
    const finalAuth = authHeader && authHeader !== "Bearer undefined" && authHeader !== "Bearer null" && authHeader !== "Bearer " 
      ? authHeader 
      : `Bearer ${apiKey}`;

    const headers: Record<string, string> = {
      "Authorization": finalAuth,
      "Content-Type": "application/json",
    };
    
    const workspaceHeader = req.headers.get("X-DashScope-WorkSpace");
    if (workspaceHeader) {
      headers["X-DashScope-WorkSpace"] = workspaceHeader;
    }

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
};

export const config: Config = {
  path: "/api/qwen/*",
};
