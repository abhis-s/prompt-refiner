// --- Begin extracted client-side JavaScript from index.html ---
function checkEnableButtons() {
  const vague = document.getElementById("vaguePrompt").value.trim();
  const fn = document.getElementById("functionName").value.trim();
  const enable = vague !== "" || fn !== "";
  document.getElementById("generateBtnTop").disabled = !enable;
  document.getElementById("generateBtnBtm").disabled = !enable;
}

// Listen for input on vague prompt and function name (textarea now)
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("vaguePrompt")
    .addEventListener("input", checkEnableButtons);
  document
    .getElementById("functionName")
    .addEventListener("input", checkEnableButtons);
  checkEnableButtons();
});
// Toggle between Structured and Vague Mode
document.addEventListener("DOMContentLoaded", function () {
  // The mode toggle pill is now in the header, so listeners must attach to those radios
  document
    .getElementById("vagueMode")
    .addEventListener("change", updateModeToggle);
  document
    .getElementById("structuredMode")
    .addEventListener("change", updateModeToggle);
  function updateModeToggle() {
    const isStructured = document.getElementById("structuredMode").checked;
    document.querySelectorAll(".structured-section").forEach((section) => {
      section.style.display = isStructured ? "block" : "none";
    });
    document.getElementById("vaguePromptContainer").style.display = isStructured
      ? "none"
      : "block";
  }
  window.updateModeToggle = updateModeToggle;
  updateModeToggle();
});
// Collapsible Refined Prompt Section
let refinedPromptVisible = true;
function toggleRefinedPrompt() {
  refinedPromptVisible = !refinedPromptVisible;
  const section = document.getElementById("refinedOutput");
  const label = document.querySelector("#refinedPromptContainer label");
  section.style.display = refinedPromptVisible ? "block" : "none";
  label.innerText = refinedPromptVisible
    ? "Generated Refined Prompt ▼"
    : "Generated Refined Prompt ▶";
}

// Collapsible Recommendations Section
let recommendationsVisible = true;
function toggleRecommendations() {
  recommendationsVisible = !recommendationsVisible;
  const section = document.getElementById("recommendationsBox");
  const label = document.querySelector("#recommendationsContainer label");
  section.style.display = recommendationsVisible ? "block" : "none";
  label.innerText = recommendationsVisible
    ? "Recommendations, Suggestions, and Comments ▼"
    : "Recommendations, Suggestions, and Comments ▶";
}

// Collapsible Markdown Output Section
let markdownVisible = true;
function toggleMarkdown() {
  markdownVisible = !markdownVisible;
  const section = document.getElementById("markdownBox");
  const label = document.querySelector("#markdownContainer label");
  section.style.display = markdownVisible ? "block" : "none";
  label.innerText = markdownVisible ? "Markdown Output ▼" : "Markdown Output ▶";
}

let lastGeneratedCode = "";

// Enhanced Markdown to HTML for recommendations (headings, lists, blockquotes, links, etc.)
function simpleMarkdownToHTML(text) {
  if (!text) return "";

  return text
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>") // code block
    .replace(/^### (.*$)/gim, "<h3>$1</h3>") // h3
    .replace(/^## (.*$)/gim, "<h2>$1</h2>") // h2
    .replace(/^# (.*$)/gim, "<h1>$1</h1>") // h1
    .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>") // blockquote
    .replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>") // bold
    .replace(/\*([^\*]+)\*/g, "<em>$1</em>") // italic
    .replace(/`([^`]+)`/g, "<code>$1</code>") // inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>') // links
    .replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>") // list item
    .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>") // wrap in ul
    .replace(/^\s*---\s*$/gm, "<hr>") // horizontal rule
    .replace(/\n/g, "<br>"); // line breaks
}

async function generatePrompt() {
  const isStructured = document.getElementById("structuredMode").checked;
  const language = document.getElementById("languageSelect").value;
  const langClass =
    document.getElementById("languageSelect").selectedOptions[0].dataset
      .highlight || "plaintext";

  let result = "";
  if (isStructured) {
    const fnName = document.getElementById("functionName").value;
    const args = document.getElementById("arguments").value;
    const returnType = document.getElementById("returnType").value;
    const constraints = document.getElementById("constraints").value;
    const edgeCases = document.getElementById("edgeCases").value;
    const expected = document.getElementById("expectedBehavior").value;
    const examples = document.getElementById("examples").value;
    result = `Language: ${language}
Function: ${fnName || "[unspecified]"}
Arguments: ${args}
Return: ${returnType}

Constraints:
${constraints}

Edge Cases:
${edgeCases}

Expected Behavior:
${expected}

Examples:
${examples}`;
  } else {
    const vaguePrompt = document.getElementById("vaguePrompt").value;
    result = `Language: ${language}
Objective:
${vaguePrompt}`;
  }

  document.getElementById("refinedOutput").innerText = result;
  const outputContainer = document.getElementById("output-container");
  if (outputContainer) {
    outputContainer.scrollIntoView({ behavior: "smooth" });
  }
  document.querySelector('.copy-button[onclick*="refinedOutput"]').disabled =
    !result.trim();
  // Always show refined prompt section if new prompt is generated
  if (!refinedPromptVisible) {
    toggleRefinedPrompt();
  }
  // Focus and scroll refinedOutput into view after populating
  document
    .getElementById("refinedOutput")
    .scrollIntoView({ behavior: "smooth", block: "center" });

  // Show loading message for recommendations with animated dots
  const loadingMsg =
    'Code Generation in Progress<span class="dot-animate"><span>.</span><span>.</span><span>.</span></span>';
  document.getElementById("recommendationsBox").innerHTML = loadingMsg;
  document.getElementById("recommendationsContainer").style.display = "block";
  document.getElementById("markdownBox").innerHTML = loadingMsg;
  document.getElementById("markdownContainer").style.display = "block";

  try {
    const model = document.getElementById("modelSelect").value;
    const response = await fetch("http://localhost:3001/generate-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: result,
        model,
        mode: isStructured ? "structured" : "vague",
      }),
    });
    const data = await response.json();
    const fullText = data.code || "No code generated.";
    // Extract code blocks and recommendations using updated logic
    let codeBlocks = [...fullText.matchAll(/```(\w+)\s*([\s\S]*?)\s*```/g)];
    let code = "",
      recommendations = fullText;
    if (codeBlocks.length > 0) {
      code = codeBlocks
        .map((match) =>
          match[2]
            .split("\n")
            .filter((line) => line.trim() !== "")
            .join("\n")
            .trim()
        )
        .join("\n\n")
        .trim();
      for (const match of codeBlocks) {
        recommendations = recommendations.replace(match[0], "");
      }
      recommendations = recommendations.trim();
    }
    lastGeneratedCode = code;
    // Insert code only in markdown preview
    const markdownBox = document.getElementById("markdownBox");
    markdownBox.innerHTML = code
      ? `
        <div class="markdown-preview">
          <div class="markdown-header">${language.toLowerCase()}</div>
          <pre class="markdown-code line-numbers"><code class="${langClass}">${code}</code></pre>
        </div>`
      : "No code block detected.";
    // Enable/disable the copy button for markdownBox based on code
    document.querySelector('.copy-button[onclick*="markdownBox"]').disabled =
      !code;
    // Highlight.js highlight code after inserting
    if (window.hljs) {
      const codeBlocks = markdownBox.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        window.hljs.highlightElement(block);
      });
    }

    document.getElementById("recommendationsBox").innerHTML =
      simpleMarkdownToHTML(recommendations || "No recommendations provided.");
    document.querySelector(
      '.copy-button[onclick*="recommendationsBox"]'
    ).disabled = !recommendations;

    // Show the Run Code button if code is present
    document.getElementById("runCodeBtn").style.display = "inline-block";
    // Collapse refined prompt after generation
    if (refinedPromptVisible) {
      toggleRefinedPrompt();
    }

    // --- Save to localStorage as promptCache ---
    const cacheKey = "promptCache";
    const cacheData = {
      mode: isStructured ? "structured" : "vague",
      model: model,
      sample: document.getElementById("sampleSelect").value,
      output: fullText,
      recommendations: recommendations,
      refinedPrompt: result,
    };
    if (isStructured) {
      cacheData.functionName = document.getElementById("functionName").value;
      cacheData.arguments = document.getElementById("arguments").value;
      cacheData.returnType = document.getElementById("returnType").value;
      cacheData.constraints = document.getElementById("constraints").value;
      cacheData.edgeCases = document.getElementById("edgeCases").value;
      cacheData.expectedBehavior =
        document.getElementById("expectedBehavior").value;
      cacheData.examples = document.getElementById("examples").value;
    } else {
      cacheData.vaguePrompt = document.getElementById("vaguePrompt").value;
    }
    localStorage.setItem("promptCache", JSON.stringify(cacheData));
    // Ensure delete cache button is enabled after saving cache
    document.getElementById("delete-cache-button").disabled = false;
    // Ensure Load Cache button is enabled after saving cache
    document.getElementById("loadCacheBtn").disabled = false;
    // Show delete cache wrapper after saving cache
    document.getElementById("delete-cache-wrapper").style.display = "block";
    // Call updateCacheButtons if available
    if (window.updateCacheButtons) window.updateCacheButtons();
    // --- End localStorage save ---
  } catch (err) {
    const markdownBox = document.getElementById("markdownBox");
    markdownBox.innerHTML = "Error: " + err.message;
    document.getElementById("runCodeBtn").style.display = "none";
  }
}

// --- Pyodide Integration ---
let pyodideReady = false;
let pyodide = null;

async function executeGeneratedCode() {
  if (!pyodideReady) {
    alert("Python environment is still loading...");
    return;
  }

  const markdownBox = document.getElementById("markdownBox");
  let code = "";
  const codeElem = markdownBox.querySelector("code");
  if (codeElem) {
    code = codeElem.textContent.trim();
  }

  const outputElement = document.getElementById("executionResult");
  outputElement.innerText = "";
  outputElement.style.display = "block";

  try {
    const wrappedCode = `
import sys
import io
stdout = sys.stdout
sys.stdout = io.StringIO()
try:
${code
  .split("\n")
  .map((line) => "    " + line)
  .join("\n")}
    output = sys.stdout.getvalue()
finally:
    sys.stdout = stdout
output
                `;
    const result = await pyodide.runPythonAsync(wrappedCode);
    outputElement.innerText =
      result.trim() || "(Code executed successfully, no output)";
  } catch (err) {
    outputElement.innerText = "Python Error:\n" + err;
  }
}

function populateFields(sample) {
  if (sample === "sort") {
    document.getElementById("vaguePrompt").value = "sort a list";
    document.getElementById("functionName").value = "sort_list";
    document.getElementById("arguments").value = "input_list: List[int]";
    document.getElementById("returnType").value = "List[int]";
    document.getElementById("constraints").value =
      "Do not use built-in sort() or sorted().\nThe solution should run in O(n log n) time.\nUse merge sort or quick sort algorithm.";
    document.getElementById("edgeCases").value =
      "Handle an empty list\nHandle lists with duplicate values\nHandle lists with a single element";
    document.getElementById("expectedBehavior").value =
      "Sort the input list in ascending order using a custom sorting algorithm and return the sorted list.\nDo not modify the input in place.";
    document.getElementById("examples").value =
      "input: [3, 1, 2] → output: [1, 2, 3]\ninput: [] → output: []\ninput: [5, 5, 2] → output: [2, 5, 5]";
  } else if (sample === "email") {
    document.getElementById("vaguePrompt").value = "validate an email";
    document.getElementById("functionName").value = "validate_email";
    document.getElementById("arguments").value = "email: str";
    document.getElementById("returnType").value = "bool";
    document.getElementById("constraints").value =
      "Do not use regular expressions.";
    document.getElementById("edgeCases").value =
      "Handle missing '@' or domain\nSupport empty string";
    document.getElementById("expectedBehavior").value =
      "Return True if email format is valid, otherwise False.";
    document.getElementById("examples").value =
      "input: 'abc@example.com' → output: True\ninput: 'abc@' → output: False\ninput: '' → output: False";
  } else if (sample === "blank" || sample === "") {
    document.getElementById("vaguePrompt").value = "";
    document.getElementById("functionName").value = "";
    document.getElementById("arguments").value = "";
    document.getElementById("returnType").value = "";
    document.getElementById("constraints").value = "";
    document.getElementById("edgeCases").value = "";
    document.getElementById("expectedBehavior").value = "";
    document.getElementById("examples").value = "";
  }
  // Enable or disable the green arrow button depending on sample selection
  document.getElementById("generateBtnTop").disabled = sample === "";
  checkEnableButtons();
}

function detectSystemTheme() {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const appDark = document.body.classList.contains("dark-mode");
  // Removed theme notice display logic as theme notice is removed
}

// Update theme notice on toggle and sync checkbox state
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  document.querySelector(".switch input").checked = isDark;
  detectSystemTheme();
  updateHighlightTheme();
}

// Highlight.js theme toggler for dark/light mode
function updateHighlightTheme() {
  const isDark = document.body.classList.contains("dark-mode");
  document.getElementById("hljs-light").disabled = isDark;
  document.getElementById("hljs-dark").disabled = !isDark;
}

// Check system theme match on load, apply system theme and initialize checkbox
window.onload = () => {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    document.body.classList.add("dark-mode");
    document.querySelector(".switch input").checked = true;
  } else {
    document.body.classList.remove("dark-mode");
    document.querySelector(".switch input").checked = false;
  }
  detectSystemTheme();
  updateHighlightTheme();
};

function copyToClipboard(id) {
  let el = document.getElementById(id);
  let text = "";

  if (id === "markdownBox") {
    text = lastGeneratedCode.trim();
  } else {
    text = el.innerText.trim();
  }

  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  });
}

// Highlight.js: syntax highlight for static code blocks on initial load
document.addEventListener("DOMContentLoaded", function () {
  if (window.hljs) {
    document.querySelectorAll("pre code").forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }
  // --- Enable/Disable Load Cache button and update class depending on cache presence ---
  const loadCacheButton = document.getElementById("loadCacheBtn");
  const hasCache = localStorage.getItem("promptCache") !== null;
  loadCacheButton.disabled = !hasCache;
  if (!hasCache) {
    loadCacheButton.classList.add("disabled");
    loadCacheButton.innerHTML = "<strong>No Cache</strong>";
  } else {
    loadCacheButton.classList.remove("disabled");
    loadCacheButton.innerHTML = "<strong>Load Cache</strong>";
  }
});
function enableMarkdownEdit() {
  const codeElement = document.querySelector(
    "#markdownBox .markdown-code code"
  );
  if (codeElement) {
    codeElement.setAttribute("contenteditable", "true");
    codeElement.focus();
  }
}

// --- Load Cache Button & Handler ---
document.addEventListener("DOMContentLoaded", function () {
  // On load, update delete-cache-button enabled state based on cache presence
  const deleteCacheButton = document.getElementById("delete-cache-button");
  function updateDeleteCacheButtonState() {
    const cachedData = localStorage.getItem("promptCache");
    if (cachedData) {
      deleteCacheButton.disabled = false;
      document.getElementById("delete-cache-wrapper").style.display = "block";
    } else {
      deleteCacheButton.disabled = true;
      document.getElementById("delete-cache-wrapper").style.display = "none";
    }
  }
  updateDeleteCacheButtonState();

  document.getElementById("loadCacheBtn").addEventListener("click", () => {
    const cached = localStorage.getItem("promptCache");
    if (cached) {
      const data = JSON.parse(cached);
      // Set sample
      if (data.sample !== undefined) {
        document.getElementById("sampleSelect").value = data.sample;
      }
      // Set model
      if (data.model) {
        document.getElementById("modelSelect").value = data.model;
      }
      // Set mode
      if (data.mode === "structured") {
        document.getElementById("structuredMode").checked = true;
        document.getElementById("vaguePromptContainer").style.display = "none";
        document.querySelectorAll(".structured-section").forEach((section) => {
          section.style.display = "block";
        });
        document.getElementById("functionName").value = data.functionName || "";
        document.getElementById("arguments").value = data.arguments || "";
        document.getElementById("returnType").value = data.returnType || "";
        document.getElementById("constraints").value = data.constraints || "";
        document.getElementById("edgeCases").value = data.edgeCases || "";
        document.getElementById("expectedBehavior").value =
          data.expectedBehavior || "";
        document.getElementById("examples").value = data.examples || "";
        document.getElementById("vaguePrompt").value = "";
      } else {
        document.getElementById("vagueMode").checked = true;
        document.getElementById("vaguePromptContainer").style.display = "block";
        document.querySelectorAll(".structured-section").forEach((section) => {
          section.style.display = "none";
        });
        document.getElementById("vaguePrompt").value = data.vaguePrompt || "";
        document.getElementById("functionName").value = "";
        document.getElementById("arguments").value = "";
        document.getElementById("returnType").value = "";
        document.getElementById("constraints").value = "";
        document.getElementById("edgeCases").value = "";
        document.getElementById("expectedBehavior").value = "";
        document.getElementById("examples").value = "";
      }
      // Set refined prompt output
      document.getElementById("refinedOutput").innerText =
        data.refinedPrompt || "";
      // Set recommendations
      document.getElementById("recommendationsBox").innerHTML =
        simpleMarkdownToHTML(data.recommendations || "");
      // Set code output (markdown)
      const language = document.getElementById("languageSelect").value;
      const langClass =
        document.getElementById("languageSelect").selectedOptions[0].dataset
          .highlight || "plaintext";
      let code = "";
      if (data.output) {
        let codeBlocks = [
          ...data.output.matchAll(/```(\w+)\s*([\s\S]*?)\s*```/g),
        ];
        if (codeBlocks.length > 0) {
          code = codeBlocks
            .map((match) =>
              match[2]
                .split("\n")
                .filter((line) => line.trim() !== "")
                .join("\n")
                .trim()
            )
            .join("\n\n")
            .trim();
        }
      }
      lastGeneratedCode = code;
      const markdownBox = document.getElementById("markdownBox");
      markdownBox.innerHTML = code
        ? `<div class="markdown-preview">
          <div class="markdown-header">${language.toLowerCase()}</div>
          <pre class="markdown-code line-numbers"><code class="${langClass}">${code}</code></pre>
        </div>`
        : "No code block detected.";
      if (window.hljs) {
        const codeBlocks = markdownBox.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
          window.hljs.highlightElement(block);
        });
      }
      // Enable/disable copy buttons
      document.querySelector(
        '.copy-button[onclick*="refinedOutput"]'
      ).disabled = !(data.refinedPrompt && data.refinedPrompt.trim());
      document.querySelector(
        '.copy-button[onclick*="recommendationsBox"]'
      ).disabled = !(data.recommendations && data.recommendations.trim());
      document.querySelector('.copy-button[onclick*="markdownBox"]').disabled =
        !code;
      // Show containers
      document.getElementById("recommendationsContainer").style.display =
        "block";
      document.getElementById("markdownContainer").style.display = "block";
      // Show Run Code button if code is present
      document.getElementById("runCodeBtn").style.display = code
        ? "inline-block"
        : "none";
      // Update mode toggle UI
      if (typeof updateModeToggle === "function") updateModeToggle();
      checkEnableButtons();
      // After loading cache, ensure delete button enabled
      updateDeleteCacheButtonState();
      // Show delete cache wrapper after loading cache
      document.getElementById("delete-cache-wrapper").style.display = "block";
    }
  });

  // Attach to window so other scripts can call
  window.updateDeleteCacheButtonState = updateDeleteCacheButtonState;
});

// --- Delete Cache Button & Handler ---
document.addEventListener("DOMContentLoaded", function () {
  const deleteCacheButton = document.getElementById("delete-cache-button");
  deleteCacheButton.addEventListener("click", () => {
    localStorage.removeItem("promptCache");
    // After removal, disable the button
    document.getElementById("delete-cache-button").disabled = true;
    // Also disable Load Cache button
    document.getElementById("loadCacheBtn").disabled = true;
    // Hide delete cache wrapper
    document.getElementById("delete-cache-wrapper").style.display = "none";
    alert("Cache cleared!");
  });
});

// On page load and after cache changes, update delete-cache-button state
document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.updateDeleteCacheButtonState === "function") {
    window.updateDeleteCacheButtonState();
  }
});
// --- End extracted client-side JavaScript ---
