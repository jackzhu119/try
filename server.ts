import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.post("/api/qwen/text", async (req, res) => {
    try {
      let authHeader = req.headers.authorization;
      if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null' || authHeader === 'Bearer ') {
        authHeader = `Bearer ${process.env.QWEN_API_KEY || "sk-e5e7b33d1f684e66be3cd51e52ae0bab"}`;
      }
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          ...(req.headers['x-dashscope-workspace'] ? { 'X-DashScope-WorkSpace': req.headers['x-dashscope-workspace'] as string } : {})
        },
        body: JSON.stringify(req.body)
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(response.status).json({ message: `Non-JSON response from DashScope: ${text.substring(0, 100)}` });
      }
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/qwen/multimodal", async (req, res) => {
    try {
      let authHeader = req.headers.authorization;
      if (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null' || authHeader === 'Bearer ') {
        authHeader = `Bearer ${process.env.QWEN_API_KEY || "sk-e5e7b33d1f684e66be3cd51e52ae0bab"}`;
      }
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          ...(req.headers['x-dashscope-workspace'] ? { 'X-DashScope-WorkSpace': req.headers['x-dashscope-workspace'] as string } : {})
        },
        body: JSON.stringify(req.body)
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(response.status).json({ message: `Non-JSON response from DashScope: ${text.substring(0, 100)}` });
      }
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
