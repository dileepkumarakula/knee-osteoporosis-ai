"use strict";

(function exposeMedicalApi() {
  const WEBHOOK_URL = "https://dileep-roy.app.n8n.cloud/webhook/medical-assistant";
  function getMedicalSessionId(assistant = "health") {
    const SESSION_KEY = `kneeOsteo-${assistant}AssistantSessionId`;
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      const uniquePart = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionId = `${assistant}-assistant-${uniquePart}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  function resetMedicalSession(assistant = "result") {
    sessionStorage.removeItem(`kneeOsteo-${assistant}AssistantSessionId`);
    return getMedicalSessionId(assistant);
  }

  async function sendMedicalMessage({ message, assistant = "health", prediction }) {
    const sessionId = getMedicalSessionId(assistant);
    const body = { message, sessionId };
    if (assistant === "result" && prediction && typeof prediction.label === "string") {
      body.aiPrediction = `Prediction: ${prediction.label}, Confidence: ${Number(prediction.confidence).toFixed(1)}%`;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("Medical assistant unavailable");
      const payload = await response.json();
      if (!payload || typeof payload.reply !== "string" || !payload.reply.trim()) {
        throw new Error("Medical assistant response unavailable");
      }
      return { reply: payload.reply.trim(), sessionId };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  window.KneeOsteoMedicalApi = { sendMedicalMessage, getMedicalSessionId, resetMedicalSession };
})();
