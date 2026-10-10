"""Basic file and image-quality gate; it does not verify knee anatomy."""
from dataclasses import dataclass
from io import BytesIO

import numpy as np
from PIL import Image, UnidentifiedImageError


MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG"}


class ImageRejected(ValueError):
    def __init__(self, message: str, checks: dict | None = None):
        super().__init__(message)
        self.checks = checks or {}


@dataclass
class ValidatedImage:
    image: Image.Image
    report: dict


def _laplacian_variance(gray: np.ndarray) -> float:
    padded = np.pad(gray, 1, mode="edge")
    lap = (
        padded[:-2, 1:-1] + padded[2:, 1:-1]
        + padded[1:-1, :-2] + padded[1:-1, 2:]
        - 4 * padded[1:-1, 1:-1]
    )
    return float(lap.var())


def validate_image(raw: bytes, filename: str) -> ValidatedImage:
    if not raw:
        raise ImageRejected("The uploaded file is empty.")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ImageRejected("Image is larger than the 10 MB limit.")

    try:
        with Image.open(BytesIO(raw)) as probe:
            image_format = (probe.format or "").upper()
            if image_format not in ALLOWED_FORMATS:
                raise ImageRejected("Unsupported format. Upload a JPG, JPEG, or PNG image.")
            width, height = probe.size
            if width < 128 or height < 128:
                raise ImageRejected("Image resolution is too small. Upload an image at least 128 × 128 pixels.")
            if width * height > 20_000_000:
                raise ImageRejected("Image resolution is too large to process safely.")
            probe.verify()
        with Image.open(BytesIO(raw)) as decoded:
            width, height = decoded.size
            if width * height > 20_000_000:
                raise ImageRejected("Image resolution is too large to process safely.")
            image = decoded.convert("RGB")
    except ImageRejected:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise ImageRejected("Image could not be read. Upload a valid JPG or PNG knee X-ray.") from exc

    # Sample the image for low-level quality cues. These checks do not classify anatomy.
    sample = image.copy()
    sample.thumbnail((512, 512))
    rgb = np.asarray(sample, dtype=np.float32)
    gray = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    mean_luma = float(gray.mean())
    contrast = float(gray.std())
    blur_score = _laplacian_variance(gray)
    chroma = float((
        np.abs(rgb[:, :, 0] - rgb[:, :, 1]).mean()
        + np.abs(rgb[:, :, 1] - rgb[:, :, 2]).mean()
        + np.abs(rgb[:, :, 0] - rgb[:, :, 2]).mean()
    ) / 3)

    checks = {
        "readable": True,
        "format": image_format,
        "dimensions": {"width": width, "height": height},
        "brightness": round(mean_luma, 1),
        "contrast": round(contrast, 1),
        "blur_score": round(blur_score, 2),
        "grayscale_like": chroma <= 48,
        "knee_anatomy_verified": False,
    }
    failures = []
    if np.percentile(gray, 95) < 35:
        failures.append("image is extremely dark")
    if np.percentile(gray, 5) > 225:
        failures.append("image is extremely bright")
    if contrast < 13:
        failures.append("image has very low contrast")
    if blur_score < 2.2:
        failures.append("image appears very blurred")
    if chroma > 48:
        failures.append("image is strongly coloured rather than grayscale-like")
    if failures:
        raise ImageRejected(
            "Unsupported or unsuitable image (" + ", ".join(failures) + "). Please upload a clear knee X-ray.",
            checks,
        )

    return ValidatedImage(
        image=image,
        report={
            "status": "Passed basic image and quality checks",
            "checks": checks,
            "notice": "These checks cannot verify that the image contains a knee. Knee anatomy was not medically verified.",
            "filename": filename,
        },
    )
