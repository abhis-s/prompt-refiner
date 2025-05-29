# 🧠 Prompt Refinement Web App

An interactive web application for refining prompts and generating Python code using LLMs like GPT-4. Supports both structured and vague prompt modes, in-browser Python execution with Pyodide, and automatic session caching.

## 🚀 Features

- ✨ Dual Prompt Modes:
  - **Structured**: Define function name, arguments, return type, edge cases, etc.
  - **Vague**: Use a free-form prompt.
- 🧠 Language Model Integration (OpenAI API).
- 🧪 Runs Python code in-browser using **Pyodide**.
- 🧾 Syntax-highlighted code blocks.
- 💾 Session caching with browser localStorage.
- 🌗 Light and Dark themes.
- 🧩 Toggle UI elements based on selected mode.

## 📂 Project Structure

```bash
/project-root
├── index.html          # Main HTML interface
├── server.js           # Express-based backend server
├── prompts.js          # Prompt templates and helpers
├── style.css           # Styling for the app
├── .env                # MUST CREATE YOUR OWN
```

## 🛠️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/abhis-s/prompt-refiner.git
cd prompt-refiner
```

### 2. Create a .env File to Store Your OpenAI Key (Get it from [Open AI Platform](https://platform.openai.com/))

```bash
touch .env
echo -e "OPENAI_API_KEY=your_private_key_here\nPORT=3001" >> .env
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Server

```bash
node server.js
```

Open the HTML file in your browser.

## 🧪 How to Use

1. Choose **Prompt Mode**: Vague or Structured.
2. Fill in the fields or write your prompt.
3. Click **Generate Prompt** → View refined prompt.
4. Click **Submit to Model** → View generated code.
5. Use the **Run** button to execute Python code directly in-browser.
6. Optionally **Load Cache** to restore previous session.

## 📄 Notes

- Ensure that you configure your OpenAI API key on the server.
- Pyodide runs Python code securely in the browser sandbox.

## ⚖️ License

MIT License
