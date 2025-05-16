import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// ✅ 开启 CORS —— 特别重要
app.use(cors({
  origin: "*", // 或写成 ["http://localhost:5173", "你的正式前端地址"]
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

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

    res.status(200).json({ result: text });
  } catch (error) {
    console.error("❌ Internal Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Server is running.");
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
