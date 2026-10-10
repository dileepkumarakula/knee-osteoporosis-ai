"""One-time exporter for the supplied PyTorch checkpoint.

The deployed backend does not import PyTorch; it runs the exported ONNX model
with ONNX Runtime. Run this script only when regenerating the ONNX artifact.
"""
from pathlib import Path

import onnx
import torch

from backend.model_architecture import DenseNetTransformerFusion


ROOT = Path(__file__).resolve().parents[1]
CHECKPOINT = ROOT / "models" / "densenet_transformer_fusion.pt"
OUTPUT = ROOT / "models" / "densenet_transformer_fusion.onnx"
EXPECTED_CLASSES = ["Normal", "Osteopenia", "Osteoporosis"]


def main() -> None:
    checkpoint = torch.load(CHECKPOINT, map_location="cpu", weights_only=True)
    classes = checkpoint.get("classes")
    if classes != EXPECTED_CLASSES:
        raise ValueError(f"Unexpected checkpoint class order: {classes!r}")

    model = DenseNetTransformerFusion(num_classes=len(classes))
    model.load_state_dict(checkpoint["model_state_dict"], strict=True)
    model.eval()
    image_size = int(checkpoint.get("image_size", 224))
    sample = torch.zeros(1, 3, image_size, image_size, dtype=torch.float32)
    torch.onnx.export(
        model,
        (sample,),
        OUTPUT,
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=18,
        do_constant_folding=True,
        dynamo=False,
    )
    exported = onnx.load(OUTPUT)
    properties = {item.key: item.value for item in exported.metadata_props}
    properties.update({"classes": ",".join(classes), "image_size": str(image_size)})
    del exported.metadata_props[:]
    for key, value in properties.items():
        item = exported.metadata_props.add()
        item.key = key
        item.value = value
    onnx.save(exported, OUTPUT)
    exported = onnx.load(OUTPUT)
    onnx.checker.check_model(exported)
    print(f"Exported {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
    print(f"Image size: {image_size}; classes: {', '.join(classes)}")


if __name__ == "__main__":
    main()
