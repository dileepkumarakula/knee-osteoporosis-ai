"""PyTorch-free model inference through ONNX Runtime."""
from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path
from threading import Lock

import numpy as np
import onnxruntime as ort
from PIL import Image


EXPECTED_CLASSES = ["Normal", "Osteopenia", "Osteoporosis"]
IMAGENET_MEAN = np.asarray((0.485, 0.456, 0.406), dtype=np.float32)
IMAGENET_STD = np.asarray((0.229, 0.224, 0.225), dtype=np.float32)


class ModelUnavailable(RuntimeError):
    pass


class Predictor:
    def __init__(self, model_path: Path):
        if not model_path.is_file():
            raise ModelUnavailable(f"ONNX model is missing: {model_path}")
        try:
            options = ort.SessionOptions()
            options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            self.session = ort.InferenceSession(
                str(model_path), sess_options=options, providers=["CPUExecutionProvider"]
            )
            metadata = self.session.get_modelmeta().custom_metadata_map
            self.classes = metadata.get("classes", ",".join(EXPECTED_CLASSES)).split(",")
            if self.classes != EXPECTED_CLASSES:
                raise ModelUnavailable(f"ONNX class ordering is {self.classes!r}; expected {EXPECTED_CLASSES!r}.")
            self.image_size = int(metadata.get("image_size", "224"))
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name
            input_shape = self.session.get_inputs()[0].shape
            if len(input_shape) != 4 or input_shape[1:] != [3, self.image_size, self.image_size]:
                raise ModelUnavailable(f"Unexpected ONNX model input shape: {input_shape!r}.")
        except ModelUnavailable:
            raise
        except Exception as exc:
            raise ModelUnavailable("The ONNX model could not be loaded by ONNX Runtime.") from exc
        self.lock = Lock()

    def _prepare(self, image: Image.Image) -> np.ndarray:
        resized = image.convert("RGB").resize(
            (self.image_size, self.image_size), Image.Resampling.BILINEAR
        )
        pixels = np.asarray(resized, dtype=np.float32) / 255.0
        normalized = (pixels - IMAGENET_MEAN) / IMAGENET_STD
        return np.ascontiguousarray(normalized.transpose(2, 0, 1)[None, ...], dtype=np.float32)

    def _logits(self, batch: np.ndarray) -> np.ndarray:
        return self.session.run([self.output_name], {self.input_name: batch})[0]

    @staticmethod
    def _softmax(logits: np.ndarray) -> np.ndarray:
        values = logits.astype(np.float64)
        values -= values.max(axis=1, keepdims=True)
        exps = np.exp(values)
        return exps / exps.sum(axis=1, keepdims=True)

    @staticmethod
    def _data_url(image: Image.Image) -> str:
        output = BytesIO()
        image.save(output, format="PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(output.getvalue()).decode("ascii")

    def _occlusion_data(self, original: Image.Image, tensor: np.ndarray,
                        class_index: int, base_probability: float) -> dict:
        # Mask each cell with normalized zero (the ImageNet mean color), then
        # measure the change in the predicted class score using the ONNX model.
        rows = columns = 4
        height = width = self.image_size
        cell_h, cell_w = height // rows, width // columns
        batch = np.repeat(tensor, rows * columns, axis=0)
        for index in range(rows * columns):
            row, column = divmod(index, columns)
            y0, x0 = row * cell_h, column * cell_w
            batch[index, :, y0:min(y0 + cell_h, height), x0:min(x0 + cell_w, width)] = 0.0

        probabilities = self._softmax(self._logits(batch))[:, class_index]
        sensitivity = np.maximum(base_probability - probabilities, 0).reshape(rows, columns)
        peak = float(sensitivity.max())
        if peak < 1e-4:
            return {
                "available": False,
                "method": "Occlusion sensitivity",
                "caption": "The model did not show a clear score change for the coarse masked regions.",
            }

        grid = (sensitivity / peak * 255).astype(np.uint8)
        small = Image.fromarray(grid, mode="L")
        preview = original.convert("RGB")
        preview.thumbnail((900, 900), Image.Resampling.LANCZOS)
        heat = np.asarray(
            small.resize(preview.size, Image.Resampling.BICUBIC), dtype=np.float32
        ) / 255.0
        red = np.clip(1.5 - np.abs(4 * heat - 3), 0, 1)
        green = np.clip(1.5 - np.abs(4 * heat - 2), 0, 1)
        blue = np.clip(1.5 - np.abs(4 * heat - 1), 0, 1)
        colors = (255 * np.stack((red, green, blue), axis=-1)).astype(np.uint8)
        blended = (
            np.asarray(preview, dtype=np.float32) * 0.60 + colors.astype(np.float32) * 0.40
        ).clip(0, 255).astype(np.uint8)
        overlay = Image.fromarray(blended, mode="RGB")
        return {
            "available": True,
            "method": "Occlusion sensitivity",
            "original_image": self._data_url(preview),
            "gradcam_overlay": self._data_url(overlay),
            "caption": "Warmer regions indicate areas where masking lowered the model score. This coarse sensitivity map is not Grad-CAM, a lesion location, or clinical proof.",
        }

    def predict(self, image: Image.Image) -> dict:
        tensor = self._prepare(image)
        with self.lock:
            logits = self._logits(tensor)
            scores = self._softmax(logits)[0]
            class_index = int(scores.argmax())
            probabilities = {
                label: round(float(scores[index] * 100), 2)
                for index, label in enumerate(self.classes)
            }
            try:
                explanation = self._occlusion_data(
                    image, tensor, class_index, float(scores[class_index])
                )
            except Exception:
                explanation = {
                    "available": False,
                    "method": "Occlusion sensitivity",
                    "caption": "A model-sensitivity image could not be generated for this inference.",
                }

        predicted = self.classes[class_index]
        return {
            "prediction": predicted,
            "highest_model_probability": probabilities[predicted],
            "probabilities": probabilities,
            "inference_status": "completed",
            "device": "CPU (ONNX Runtime)",
            "explanation": explanation,
        }
