// server.mjs
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ✅ CORS 设置（允许前端如 localhost:5173 调用）
app.use(cors({
  origin: "*", // 你也可以改为 ["http://localhost:5173", "https://yourfrontend.com"]
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// ✅ 显式处理预检请求（OPTIONS）
app.options("/generate-report", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204); // 成功预检
});

// 🔐 Google Gemini API 初始化
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// ✅ 主接口：生成报告
app.post("/generate-report", async (req, res) => {
  try {
    const { recipient, platform, date, incidentTypes, notes } = req.body;

    if (!recipient || !platform || !date) {
      return res.status(400).json({ error: "Missing required fields: recipient, platform, or date." });
    }

    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

    const prompt = `
Please generate a professional and empathetic incident report notification based on the following details:

- Recipient: ${recipient}
- Platform Involved: ${platform}
- Type(s) of Incident: ${incidentTypes?.join(", ") || "N/A"}
- Date of Incident: ${date}
- Additional Notes: ${notes || "None"}

Format it as a short report suitable for sending to a school or authority figure and keep the response brief (max 100 words), concise, and emotionally supportive.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.setHeader("Access-Control-Allow-Origin", "*"); // 保险起见，POST 响应也带上
    res.status(200).json({ result: text });
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检测接口
app.get("/", (req, res) => {
  res.send("✅ Gemini Report Server is running.");
});

// 启动服务
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
