# KneeOsteo AI

The existing HTML/CSS/JavaScript interface sends uploaded X-rays to a local Flask API. The supplied trained checkpoint is packaged as `models/densenet_transformer_fusion.onnx`; predictions run with ONNX Runtime on CPU. **The running app does not install or import PyTorch.** The original `.pt` checkpoint remains unchanged.

## Run locally (Windows)

1. Install Python 3.10 or newer.
2. Double-click `run_backend.bat`. It creates `.venv`, installs the small runtime dependencies in `requirements.txt`, and starts the local server.
3. Open <http://127.0.0.1:5000>, choose a JPG or PNG knee X-ray, and start the analysis.

The first install needs internet access for Flask and ONNX Runtime. The server binds to localhost only. Uploaded images are processed in memory and are not saved to disk.

## Assistants

- The always-open Project Information Assistant sits below the existing copy/buttons in the hero’s left column, beside the existing X-ray visual. It uses only `js/projectInfo.js`, a structured list of verified project facts, and does not call the medical assistant or read PDFs.
- The Health Assistant sits at the beginning of “From X-ray to insight,” beside the existing vision cards on wide screens and above them at narrower widths. It uses the existing n8n medical workflow and does not require an uploaded X-ray.
- The X-ray Result Assistant is nested in the hidden result section and appears after successful inference. It sends the current label and model confidence in `aiPrediction`; the X-ray image is never sent to n8n.
- `js/n8nApi.js` centralizes the existing webhook and keeps distinct persistent session IDs for the Health and Result assistants. `js/assistantMarkdown.js` renders a safe text-only Markdown subset.
- The current project is plain HTML/CSS/JavaScript with Flask, not a React/Vite app. `backend/knowledge.py` remains a separate source-attributed lookup used by the model report; it is not used by the Project Assistant.

## Model conversion and inference

- `tools/export_checkpoint_to_onnx.py` documents the one-time conversion from the supplied PyTorch checkpoint. The conversion environment is separate from the deployed app; it is not part of `requirements.txt` or the runtime.
- `backend/model_service.py` loads the ONNX model with ONNX Runtime, applies the prediction script's 224 × 224 RGB/ImageNet preprocessing, preserves checkpoint class order, and returns class probabilities.
- For a PyTorch-free explanation, the backend creates a coarse occlusion-sensitivity map by masking image regions and measuring score changes. It is not Grad-CAM and must not be interpreted as a lesion location.
- `backend/validation.py` checks file format, readability, size, brightness, contrast, blur, and grayscale-like appearance. These checks do **not** establish that an image contains a knee; no knee-validation model was supplied.
- `backend/knowledge.py` and `backend/data/medical_knowledge.json` provide source-attributed information paraphrased from the supplied medical files. Reference materials are not used to train or change the classifier.
- `backend/report.py` produces deterministic patient-friendly wording and a medical notice; no LLM generates clinical advice.

## Supplied model facts and limitations

The checkpoint class order is `Normal`, `Osteopenia`, `Osteoporosis`; its input size is 224. The model is a research/educational prototype, not a diagnostic device. It has no dedicated out-of-distribution or knee-view validator. A model probability is not a calibrated clinical risk. Clinical evaluation remains necessary. Performance metrics shown in the existing site remain the values previously supplied by the project owner; the included training script does not contain a saved evaluation report.
