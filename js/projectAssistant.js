"use strict";

(function initializeProjectAssistant() {
  const form = document.getElementById("projectForm");
  const input = document.getElementById("projectQuestion");
  const messages = document.getElementById("projectMessages");
  const refresh = document.getElementById("projectAssistantRefresh");
  const info = window.KneeOsteoProjectInfo;
  if (!form || !input || !messages || !info) return;

  const sessionKey = "kneeOsteo-projectAssistantSessionId";
  let lastPerson = null;
  function newSession() {
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(sessionKey, `project-assistant-${id}`);
    lastPerson = null;
  }
  if (!sessionStorage.getItem(sessionKey)) newSession();

  const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])\1{2,}/g, "$1$1").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const has = (text, ...terms) => terms.some((term) => text.includes(term));
  function append(text, kind) {
    const node = document.createElement("p");
    node.className = `assistant-message ${kind === "user" ? "assistant-user" : "assistant-reply"}`;
    node.textContent = text;
    messages.append(node);
    messages.scrollTop = messages.scrollHeight;
  }
  function contactAnswer(person, method, explicitMobile) {
    const data = info.contact[person];
    const name = person === "dileep" ? "Dileep Kumar Akula" : "Devendra Prasad R";
    const role = person === "dileep" ? "Team Lead" : "Team Member";
    if (explicitMobile) return data.mobile ? `${name}'s mobile number is ${data.mobile}.` : `A mobile number for ${name} is not available in the verified project information.`;
    if (method === "linkedin") return `${name}'s LinkedIn: ${data.linkedin}`;
    if (method === "email") return `${name}'s email: ${data.email}`;
    if (method === "instagram") return data.instagram ? `${name}'s Instagram: ${data.instagram}` : `An Instagram account for ${name} is not listed in the project information.`;
    return `${name} — ${role}\nLinkedIn: ${data.linkedin}\nEmail: ${data.email}${data.instagram ? `\nInstagram: ${data.instagram}` : ""}`;
  }
  function answer(raw) {
    const q = normalize(raw);
    const explicitMobile = has(q, "phone", "mobile", "contact number", "cell number");
    const asksContact = has(q, "contact", "linkedin", "email", "instagram", "phone", "mobile");
    const namesDileep = has(q, "dileep", "dileeps", "team lead", "lead developer");
    const namesDevendra = has(q, "devendra", "team member");
    const greetingWords = new Set(["hi", "hii", "hello", "helo", "hey", "heyy", "there", "good", "morning", "afternoon", "evening", "how", "are", "you", "r", "u"]);
    const isGreeting = ["hi", "hii", "hello", "helo", "hey", "heyy", "hi there", "hello there", "hey hii", "hey hi", "good morning", "good afternoon", "good evening", "how are you", "how r u"].includes(q)
      || (q.split(" ").length > 1 && q.split(" ").every((word) => greetingWords.has(word)));
    if (isGreeting) {
      if (q === "hello" || q === "helo") return "Hi! How can I help you with the Knee Osteo AI project?";
      if (q === "hi" || q === "hii") return "Hi! I’m the Project Assistant. Ask me anything about the project, team, model, or website.";
      return "Hi! I’m the Project Assistant. You can ask me about the project, team, model architecture, website, or developers.";
    }
    if (!asksContact && !namesDileep && !namesDevendra) lastPerson = null;
    if (asksContact) {
      if (!namesDileep && !namesDevendra && has(q, "team contact", "team contacts", "developer contact", "contact developers")) return `${contactAnswer("dileep", null, false)}\n\n${contactAnswer("devendra", null, false)}`;
      if (!namesDileep && !namesDevendra && !lastPerson) return "Which team member’s contact information do you need: Dileep Kumar Akula or Devendra Prasad R?";
      const person = namesDileep ? "dileep" : namesDevendra ? "devendra" : lastPerson;
      lastPerson = person;
      const method = has(q, "linkedin") ? "linkedin" : has(q, "email") ? "email" : has(q, "instagram") ? "instagram" : null;
      return contactAnswer(person, method, explicitMobile);
    }
    if (namesDileep && !has(q, "team", "developer", "who", "contact", "role", "about")) {
      lastPerson = "dileep";
      return "Dileep Kumar Akula is the Team Lead of the project.";
    }
    if (namesDevendra && !has(q, "team", "developer", "who", "contact", "role", "about")) {
      lastPerson = "devendra";
      return "Devendra Prasad R is a Project Team Member. You can ask me about his role or public contact information.";
    }
    if (has(q, "team lead", "lead developer", "who is dileep", "dileep role")) {
      lastPerson = "dileep";
      return "Dileep Kumar Akula is the Team Lead of the project.";
    }
    if (has(q, "team", "developer", "who developed", "who created", "who made", "made this", "project members", "people behind")) return "The project team consists of Dileep Kumar Akula (Team Lead) and Devendra Prasad R (Team Member).";
    if (has(q, "devendra", "team member")) { lastPerson = "devendra"; return "Devendra Prasad R is a Project Team Member."; }
    if (has(q, "dileep")) { lastPerson = "dileep"; return "Dileep Kumar Akula is the Team Lead of the project."; }
    if (has(q, "project", "what is this", "explain", "overview", "what does this")) return "Knee Osteo AI is an AI-assisted medical imaging application developed as part of the academic project ‘A Multimodel Deep Learning Framework for Osteoporosis Detection.’\n\nIt analyzes knee X-ray images and classifies them into Normal, Osteopenia, or Osteoporosis. The architecture uses DenseNet121 for visual feature extraction followed by a Single-Token Transformer.\n\nThe website supports X-ray upload, AI-assisted classification, prediction and model confidence display, model-architecture exploration, and general medical questions through the Health Assistant. It is an academic/research prototype and does not replace professional medical diagnosis.";
    if (has(q, "mentor", "guide", "supervisor", "avinash")) return "The project mentor is Dr. J. Avinash, Associate Professor, Department of CSE (AI&ML).";
    if (has(q, "college", "rgmcet", "institution", "where developed")) return "RGM College of Engineering and Technology (RGMCET), Nandyal.";
    if (has(q, "department", "branch")) return "The department is CSE (Artificial Intelligence & Machine Learning).";
    if (has(q, "class", "categories", "labels", "prediction types", "what can it detect", "what diseases", "diseases")) return "Normal, Osteopenia, and Osteoporosis.";
    if (has(q, "densenet", "transformer", "architecture", "model", "cnn", "deep learning model")) return "DenseNet121 is used for visual feature extraction, followed by a Feature Projection layer and a Single-Token Transformer for processing the learned representation.";
    if (has(q, "accuracy", "results", "macro f1", "performance", "f1 score")) return "Latest approved results: test accuracy 84.28%, test macro F1 84.10%, validation accuracy 88.52%, and validation macro F1 88.46%. Class F1: Normal 85.39%, Osteopenia 86.34%, and Osteoporosis 80.57%.";
    if (has(q, "dataset", "training", "trained", "source", "how many images")) return "Dataset source, size, and training details are not currently available in the verified project information.";
    if (has(q, "technology", "tech stack", "website", "built with", "programming")) return "The existing site uses HTML, CSS, and JavaScript, with a Python/Flask local inference service and ONNX Runtime for model execution.";
    if (has(q, "objective", "purpose", "goal", "aim", "problem")) return "The project aims to classify knee X-ray images into Normal, Osteopenia, or Osteoporosis using an AI-assisted research prototype.";
    if (has(q, "future", "limitation", "limitation")) return "Known limitation: this is an academic/research prototype, not a diagnostic device. Other project-specific limitations and future-scope details are not currently available in the verified information.";
    if (has(q, "yeah", "yes", "okay", "ok", "sure", "thanks", "thank you")) return "Sure. What would you like to know about the academic project, team, model, or website?";
    const item = info.knowledge.find((entry) => entry.topics.some((topic) => q.includes(normalize(topic))));
    return item?.answer || "That specific information is not currently available in the verified project information. You can ask about the project, team, mentor, college, model, classes, or latest results.";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    append(text, "user");
    append(answer(text), "assistant");
    input.value = "";
    input.focus();
  });
  if (refresh) refresh.addEventListener("click", () => {
    newSession();
    messages.replaceChildren();
    append("Hello! I can answer from the verified project information available here. What would you like to know?", "assistant");
  });
})();
