require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const { basePrompt, vaguePrompt, structuredPrompt } = require("./prompts");

const app = express();
app.use(express.json());
app.use(cors()); // enable requests from your frontend

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate-code", async (req, res) => {
  const { prompt, model, mode } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const modeVal = mode || "structured";
    const systemPrompt = `${basePrompt}\n${modeVal === "structured" ? structuredPrompt : vaguePrompt}`;
    const completion = await openai.chat.completions.create({
      model: model || "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    const code = completion.choices[0].message.content.trim();
    res.json({ code, model: model || "gpt-4o" });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "Failed to generate code." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Code generation server running at http://localhost:${PORT}`);
});