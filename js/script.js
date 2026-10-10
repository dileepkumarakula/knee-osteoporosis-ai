"use strict";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);
const ALLOWED_EXTENSIONS = /\.(jpe?g|png)$/i;

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const dropContent = document.getElementById("dropContent");
const previewContent = document.getElementById("previewContent");
const imagePreview = document.getElementById("imagePreview");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const fileError = document.getElementById("fileError");
const analyzeButton = document.getElementById("analyzeButton");
const resultsArea = document.getElementById("resultsArea");
const scanProgress = document.getElementById("scanProgress");

let selectedFile = null;
let previewUrl = null;
let isAnalyzing = false;

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showError(message) {
  fileError.querySelector("span").textContent = message;
  fileError.classList.remove("d-none");
}

function clearError() {
  fileError.classList.add("d-none");
  fileError.querySelector("span").textContent = "";
}

function clearPreviewUrl() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
}

function acceptFile(file) {
  clearError();
  if (!file || isAnalyzing) return;

  const validType = ALLOWED_TYPES.has(file.type) || (!file.type && ALLOWED_EXTENSIONS.test(file.name));
  if (!validType || !ALLOWED_EXTENSIONS.test(file.name)) {
    showError("Unsupported file type. Please choose a JPG, JPEG, or PNG image.");
    fileInput.value = "";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showError("This image is larger than 10 MB. Please choose a smaller file.");
    fileInput.value = "";
    return;
  }
  if (file.size === 0) {
    showError("This file is empty. Please choose another image.");
    fileInput.value = "";
    return;
  }

  clearPreviewUrl();
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  imagePreview.src = previewUrl;
  fileName.textContent = file.name;
  fileName.title = file.name;
  fileSize.textContent = formatFileSize(file.size);
  dropContent.classList.add("d-none");
  previewContent.classList.remove("d-none");
  analyzeButton.disabled = false;
  resultsArea.classList.add("d-none");
  scanProgress.classList.add("d-none");
  window.dispatchEvent(new CustomEvent("kneeosteo:prediction-cleared"));
}

function clearSelection() {
  if (isAnalyzing) return;
  clearPreviewUrl();
  selectedFile = null;
  fileInput.value = "";
  imagePreview.removeAttribute("src");
  dropContent.classList.remove("d-none");
  previewContent.classList.add("d-none");
  analyzeButton.disabled = true;
  resultsArea.classList.add("d-none");
  scanProgress.classList.add("d-none");
  window.dispatchEvent(new CustomEvent("kneeosteo:prediction-cleared"));
  clearError();
}

async function analyzeImage() {
  if (!selectedFile || isAnalyzing) return;
  isAnalyzing = true;
  setLoading(true);
  resultsArea.classList.add("d-none");
  scanProgress.classList.remove("d-none");
  document.getElementById("scanStatus").textContent = "Checking image quality, running the model, and preparing its explanation...";
  document.getElementById("scanProgressBar").classList.add("is-active");

  try {
    const formData = new FormData();
    formData.append("image", selectedFile, selectedFile.name);
    const response = await fetch("/predict", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The local analysis request failed.");

    renderResults(result);
    scanProgress.classList.add("d-none");
    resultsArea.classList.remove("d-none");
    window.setTimeout(() => resultsArea.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  } catch (error) {
    const message = error instanceof TypeError
      ? "Could not reach the local AI service. Start it with run_backend.bat, then reload this page."
      : error.message;
    showError(message);
    scanProgress.classList.add("d-none");
  } finally {
    isAnalyzing = false;
    setLoading(false);
  }
}

function setLoading(loading) {
  analyzeButton.disabled = loading || !selectedFile;
  document.getElementById("removeButton").disabled = loading;
  fileInput.disabled = loading;
  analyzeButton.querySelector(".spinner-border").classList.toggle("d-none", !loading);
  analyzeButton.querySelector(".button-label").textContent = loading ? "Analyzing..." : "Analyze image";
  analyzeButton.querySelector(".button-arrow").classList.toggle("d-none", loading);
}

function renderExplanation(explanation) {
  const imageContainer = document.getElementById("explanationImages");
  imageContainer.replaceChildren();
  const caption = document.getElementById("xaiCaption");
  caption.textContent = explanation.caption || "No explanation details were returned.";
  if (!explanation.available) return;

  [
    ["Original X-ray", explanation.original_image],
    ["Occlusion-sensitivity overlay", explanation.gradcam_overlay]
  ].forEach(([label, source]) => {
    const figure = document.createElement("figure");
    figure.className = "xai-figure";
    const image = document.createElement("img");
    image.src = source;
    image.alt = label;
    const figcaption = document.createElement("figcaption");
    figcaption.textContent = label;
    figure.append(image, figcaption);
    imageContainer.append(figure);
  });
}

function renderResults(result) {
  const prediction = result.prediction;
  document.getElementById("predictionLabel").textContent = prediction.toUpperCase();
  document.getElementById("modelProbabilityValue").textContent = `${Number(result.highest_model_probability).toFixed(1)}%`;
  document.querySelector(".confidence-line i").style.width = `${result.highest_model_probability}%`;
  document.querySelectorAll(".prob-row").forEach((row) => {
    const probability = Number(result.probabilities[row.dataset.class] || 0);
    row.querySelector("b").textContent = `${probability.toFixed(1)}%`;
    row.querySelector(".prob-track i").style.setProperty("--prob", `${probability}%`);
  });
  renderExplanation(result.explanation || {});
  window.dispatchEvent(new CustomEvent("kneeosteo:prediction-ready", {
    detail: {
      prediction,
      confidence: Number(result.highest_model_probability)
    }
  }));
}

document.getElementById("browseButton").addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});
dropZone.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  if (!selectedFile) fileInput.click();
});
dropZone.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && !selectedFile) {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener("change", (event) => acceptFile(event.target.files[0]));
document.getElementById("removeButton").addEventListener("click", clearSelection);
document.getElementById("resetButton").addEventListener("click", () => {
  clearSelection();
  document.getElementById("analyze").scrollIntoView({ behavior: "smooth", block: "start" });
});
analyzeButton.addEventListener("click", analyzeImage);

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("drag-over");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");
  });
}
dropZone.addEventListener("drop", (event) => acceptFile(event.dataTransfer.files[0]));

const observerOptions = { threshold: 0.14 };
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  const visionTrack = document.getElementById("visionTrack");
  const visionObserver = new IntersectionObserver(([entry], observer) => {
    if (entry.isIntersecting) {
      visionTrack.classList.add("is-visible");
      observer.disconnect();
    }
  }, { threshold: 0.28 });
  visionObserver.observe(visionTrack);

  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const number = entry.target;
      const target = Number(number.dataset.count);
      const decimals = Number.isInteger(target) ? 0 : 2;
      const start = performance.now();
      const countFrame = (time) => {
        const progress = Math.min((time - start) / 1000, 1);
        number.textContent = (target * (1 - Math.pow(1 - progress, 3))).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
      observer.unobserve(number);
    });
  }, { threshold: 0.7 });
  document.querySelectorAll(".snapshot-stat strong").forEach((number) => metricObserver.observe(number));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  document.getElementById("visionTrack").classList.add("is-visible");
}

document.querySelectorAll("#mainNav .nav-link, #mainNav .btn-nav").forEach((link) => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("mainNav");
    if (menu.classList.contains("show") && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});

window.addEventListener("beforeunload", clearPreviewUrl);

fetch("/health")
  .then((response) => response.json().then((state) => ({ response, state })))
  .then(({ response, state }) => {
    const status = document.getElementById("connectionState");
    const note = document.getElementById("connectionNote");
    status.textContent = response.ok && state.model_loaded ? "MODEL READY" : "SETUP REQUIRED";
    note.textContent = response.ok ? "Research prototype" : "See local setup instructions";
  })
  .catch(() => {
    document.getElementById("connectionState").textContent = "SERVICE OFFLINE";
    document.getElementById("connectionNote").textContent = "Start run_backend.bat";
  });
