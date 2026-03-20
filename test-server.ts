import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/qwen/text", (req, res) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  res.json({ success: true });
});

const server = app.listen(3001, async () => {
  try {
    const res = await fetch('http://localhost:3001/api/qwen/text', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });
    console.log("Response:", await res.json());
  } catch (e) {
    console.error(e);
  } finally {
    server.close();
  }
});