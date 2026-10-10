"use strict";

(function initializeHealthAssistant() {
  const form = document.getElementById("healthForm");
  const input = document.getElementById("healthQuestion");
  const messages = document.getElementById("healthMessages");
  const refresh = document.getElementById("healthAssistantRefresh");
  const sendButton = form.querySelector("button[type='submit']");
  let sending = false;
  let lastFailedMessage = "";

  function append(text, kind, pending = false) {
    const message = document.createElement("div");
    message.className = `assistant-message ${kind === "user" ? "assistant-user" : "assistant-reply"}${pending ? " is-pending" : ""}`;
    if (kind === "assistant" && !pending) window.renderAssistantMarkdown(message, text);
    else message.textContent = text;
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function welcome() {
    append("Hello! I can help with general questions about osteoporosis, osteopenia, bone health, and related topics. What would you like to know?", "assistant");
  }
  refresh?.addEventListener("click", () => {
    if (sending) return;
    window.KneeOsteoMedicalApi.resetMedicalSession("health");
    messages.replaceChildren();
    welcome();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || sending) return;
    lastFailedMessage = message;
    append(message, "user");
    input.value = "";
    const pending = append("The health assistant is replying…", "assistant", true);
    sending = true;
    input.disabled = true;
    sendButton.disabled = true;
    try {
      const result = await window.KneeOsteoMedicalApi.sendMedicalMessage({ message, assistant: "health" });
      pending.remove();
      append(result.reply, "assistant");
      lastFailedMessage = "";
    } catch (_error) {
      pending.remove();
      const error = append("Sorry, I couldn't get a response right now. Please try again.", "assistant");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "assistant-retry";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => { error.remove(); input.value = lastFailedMessage; form.requestSubmit(); });
      error.append(" ", retry);
    } finally {
      sending = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  });
})();
