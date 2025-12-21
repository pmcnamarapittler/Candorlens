import argparse
import json
import os
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms
import json
from pathlib import Path
from PIL import Image
import argparse


# ---- Paths ----
ROOT = Path(__file__).resolve().parents[2]  # /Users/.../candorlens
LABELS_PATH = ROOT / "ml" / "labels.json"
MODEL_PATH = ROOT / "ml" / "models" / "darkpattern_resnet18_v1.pt"


# ---- Label loading ----
def load_labels():
    with open(LABELS_PATH, "r") as f:
        labels = json.load(f)

    id_to_index = {lbl["id"]: i for i, lbl in enumerate(labels)}
    index_to_id = {i: lbl["id"] for i, lbl in enumerate(labels)}
    index_to_name = {i: lbl["name"] for i, lbl in enumerate(labels)}
    return labels, id_to_index, index_to_id, index_to_name


# ---- Model ----
def build_model(num_labels):
    model = models.resnet18(weights=None)

    # Match the classifier head used during training
    model.fc = nn.Sequential(
        nn.Linear(model.fc.in_features, 128),
        nn.ReLU(),
        nn.Linear(128, num_labels)
    )

    # Load trained weights
    state_dict = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(state_dict)

    model.eval()
    return model


# ---- Preprocessing ----
transform = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        # Standard ImageNet normalization (matches ResNet expectations)
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)


def run_inference(image_path: str, threshold: float = 0.5) -> dict:
    # 1) Load labels + model
    labels, id_to_index, index_to_id, index_to_name = load_labels()
    model = build_model(num_labels=len(labels))

    # 2) Load and preprocess image
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0)  # shape: [1, 3, 224, 224]

    # 3) Forward pass
    with torch.no_grad():
        logits = model(tensor)  # [1, num_labels]
        probs = torch.sigmoid(logits)[0].tolist()  # -> list of floats

    # 4) Build prediction list
    predictions = []
    for idx, score in enumerate(probs):
        predictions.append(
            {
                "id": index_to_id[idx],
                "name": index_to_name[idx],
                "score": float(score),
            }
        )

    # Sort by score descending
    predictions.sort(key=lambda x: x["score"], reverse=True)

    # 5) Decide which labels are "on"
    active = [p for p in predictions if p["score"] >= threshold]
    if not active:
        # if nothing crosses threshold, just take top-1
        active = predictions[:1]

    result = {
        "image_path": os.path.relpath(image_path, ROOT),
        "predictions": predictions,
        "active_labels": [p["id"] for p in active],
    }
    return result


def main():
    parser = argparse.ArgumentParser(description="CandorLens v1 inference")
    parser.add_argument("image_path", help="Path to a UI screenshot (PNG/JPG)")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Confidence threshold for activating a label (default: 0.5)",
    )
    args = parser.parse_args()

    if not os.path.exists(args.image_path):
        raise FileNotFoundError(f"Image not found: {args.image_path}")

    result = run_inference(args.image_path, threshold=args.threshold)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()