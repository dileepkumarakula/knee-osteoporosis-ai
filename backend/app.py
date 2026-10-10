"""Local Flask API and static-file server for KneeOsteo AI."""
from __future__ import annotations

from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import RequestEntityTooLarge

from .model_service import ModelUnavailable, Predictor
from .validation import ImageRejected, MAX_UPLOAD_BYTES, validate_image


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "densenet_transformer_fusion.onnx"
MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 256 * 1024

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_REQUEST_BYTES
_predictor = None
_predictor_lock = Lock()


@app.errorhandler(RequestEntityTooLarge)
def request_too_large(_error):
    return jsonify({"error": "Image is larger than the 10 MB limit."}), 413


def get_predictor() -> Predictor:
    global _predictor
    if _predictor is None:
        with _predictor_lock:
            if _predictor is None:
                _predictor = Predictor(MODEL_PATH)
    return _predictor


@app.get("/")
def home():
    return send_from_directory(PROJECT_ROOT, "index.html")


@app.get("/health")
def health():
    try:
        predictor = get_predictor()
        return jsonify({"status": "ready", "model_loaded": True, "classes": predictor.classes})
    except ModelUnavailable as exc:
        return jsonify({"status": "unavailable", "model_loaded": False, "error": str(exc)}), 503


@app.post("/predict")
def predict():
    upload = request.files.get("image")
    if upload is None:
        return jsonify({"error": "Choose a knee X-ray image to analyze."}), 400
    try:
        validated = validate_image(upload.read(MAX_UPLOAD_BYTES + 1), upload.filename or "image")
        predictor = get_predictor()
        prediction = predictor.predict(validated.image)
        result = {
            **prediction,
            "validation": validated.report,
            "research_prototype": True,
        }
        return jsonify(result)
    except ImageRejected as exc:
        return jsonify({"error": str(exc), "validation": {"checks": exc.checks}}), 422
    except ModelUnavailable as exc:
        return jsonify({"error": str(exc), "inference_status": "unavailable"}), 503
    except RequestEntityTooLarge:
        return jsonify({"error": "Image is larger than the 10 MB limit."}), 413
    except Exception:
        app.logger.exception("Prediction request failed")
        return jsonify({"error": "Analysis could not be completed. Check the local server log."}), 500


@app.get("/css/<path:asset_path>")
def css_asset(asset_path: str):
    return send_from_directory(PROJECT_ROOT / "css", asset_path)


@app.get("/js/<path:asset_path>")
def js_asset(asset_path: str):
    return send_from_directory(PROJECT_ROOT / "js", asset_path)


@app.get("/assets/<path:asset_path>")
def public_asset(asset_path: str):
    return send_from_directory(PROJECT_ROOT / "assets", asset_path)


if __name__ == "__main__":
    # Local-only server. Do not expose this development prototype to a public network.
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
