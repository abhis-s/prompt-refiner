const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  const models = await openai.models.list();
  models.data.forEach(model => console.log(model.id));
})();