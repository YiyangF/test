import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const handler = async (event) => {
  try {
    // ✅ 兼容前端请求和控制台测试
    let body = {};
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else {
      body = event.body || {};
    }

    console.log("Parsed request body:", body);

    const { recipient, platform, date, incidentTypes, notes } = body;

    if (!recipient || !platform || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: recipient, platform, or date." }),
      };
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

    console.log("Prompt to Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response text:", text);

    return {
      statusCode: 200,
      body: JSON.stringify({ result: text }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
