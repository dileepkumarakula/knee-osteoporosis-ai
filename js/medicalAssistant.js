"use strict";

(function initializeMedicalAssistant() {
  const form = document.getElementById("medicalForm");
  const input = document.getElementById("medicalQuestion");
  const messages = document.getElementById("medicalMessages");
  const sendButton = form.querySelector("button[type='submit']");
  const askResultButton = document.getElementById("askResultButton");
  const assistantPanel = document.getElementById("medicalAssistant");
  const refresh = document.getElementById("medicalAssistantRefresh");
  let latestPrediction = null;
  let isSending = false;
  let lastFailedMessage = "";

  function appendMessage(text, kind, extraClass = "") {
    const message = document.createElement("div");
    message.className = `assistant-message ${kind === "user" ? "assistant-user" : "assistant-reply"} ${extraClass}`.trim();
    if (kind === "assistant" && !extraClass.includes("is-pending") && !extraClass.includes("assistant-send-error")) {
      window.renderAssistantMarkdown(message, text);
    } else {
      message.textContent = text;
    }
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
  }

  function setSending(sending) {
    isSending = sending;
    input.disabled = sending;
    sendButton.disabled = sending;
    askResultButton.disabled = sending;
    sendButton.setAttribute("aria-busy", String(sending));
  }

  async function send(message) {
    const cleanMessage = message.trim();
    if (!cleanMessage || isSending || !latestPrediction) return;
    lastFailedMessage = cleanMessage;
    appendMessage(cleanMessage, "user");
    const pending = appendMessage("The medical assistant is replying…", "assistant", "is-pending");
    setSending(true);
    try {
      const result = await window.KneeOsteoMedicalApi.sendMedicalMessage({
        message: cleanMessage,
        assistant: "result",
        prediction: latestPrediction
      });
      pending.remove();
      appendMessage(result.reply, "assistant");
      lastFailedMessage = "";
    } catch (_error) {
      pending.remove();
      const error = appendMessage("Sorry, I couldn't get a response right now. Please try again.", "assistant", "assistant-send-error");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "assistant-retry";
      retry.textContent = "Retry";
      retry.addEventListener("click", () => send(lastFailedMessage));
      error.append(" ", retry);
    } finally {
      setSending(false);
      input.focus();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value;
    if (!message.trim() || isSending) return;
    input.value = "";
    send(message);
  });

  refresh?.addEventListener("click", () => {
    if (isSending || !latestPrediction) return;
    window.KneeOsteoMedicalApi.resetMedicalSession("result");
    messages.replaceChildren();
    appendMessage("You can ask about this result or a related medical question. This AI-assisted prediction is not a clinical diagnosis.", "assistant");
  });

  askResultButton.addEventListener("click", () => {
    send("Explain my X-ray result in simple terms.");
  });

  window.addEventListener("kneeosteo:prediction-ready", (event) => {
    const detail = event.detail || {};
    if (typeof detail.prediction !== "string" || !Number.isFinite(Number(detail.confidence))) return;
    latestPrediction = {
      label: detail.prediction,
      confidence: Number(detail.confidence)
    };
    window.KneeOsteoMedicalApi.resetMedicalSession("result");
    messages.replaceChildren();
    appendMessage("You can ask about this result or a related medical question. This AI-assisted prediction is not a clinical diagnosis.", "assistant");
    assistantPanel.setAttribute("aria-label", `X-ray result assistant for ${latestPrediction.label}`);
  });

  window.addEventListener("kneeosteo:prediction-cleared", () => {
    latestPrediction = null;
    messages.replaceChildren();
    appendMessage("Analyze an X-ray to ask questions about its result.", "assistant");
  });
})();
