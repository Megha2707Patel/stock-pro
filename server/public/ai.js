// server/public/ai.js

// Expected HTML on your page (e.g., ai.html):
// <form id="ai-form">
//   <textarea id="ai-question" rows="3" placeholder="Ask the AI about a stock..."></textarea>
//   <button id="ai-submit" type="submit">Ask</button>
// </form>
// <div id="ai-output"></div>
// <script src="ai.js" defer></script>

(function () {
  const form = document.getElementById("ai-form");
  const input = document.getElementById("ai-question");
  const submitBtn = document.getElementById("ai-submit");
  const output = document.getElementById("ai-output");

  if (!form || !input || !submitBtn || !output) {
    console.warn("[ai.js] Missing DOM elements (ai-form, ai-question, ai-submit, ai-output).");
    return;
  }

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "Thinking..." : "Ask";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = (input.value || "").trim();
    if (!question) {
      output.innerHTML = `<div class="error">Please type a question.</div>`;
      return;
    }

    setBusy(true);
    output.innerHTML = `<div class="loading">🤖 generating answer…</div>`;

    try {
      const r = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${r.status})`);
      }

      const data = await r.json();
      const answer = data?.answer || "No answer.";
      output.innerHTML = `<div class="answer">${escapeHtml(answer).replace(/\n/g, "<br>")}</div>`;
    } catch (err) {
      output.innerHTML = `<div class="error">AI error: ${escapeHtml(err.message || String(err))}</div>`;
    } finally {
      setBusy(false);
    }
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
