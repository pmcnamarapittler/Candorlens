import os
import json
from glob import glob
from typing import List, Tuple

import torch
from torch import nn, optim
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import models, transforms
from PIL import Image


def load_labels(labels_path: str):
    with open(labels_path, "r") as f:
        labels = json.load(f)
    if not isinstance(labels, list):
        raise ValueError("labels.json must be a list of {id, name} objects")
    id_to_index = {lbl["id"]: i for i, lbl in enumerate(labels)}
    return labels, id_to_index


class SimpleDarkPatternDataset(Dataset):
    def __init__(self, items: List[Tuple[str, str]], id_to_index: dict, transform=None):
        """
        items: list of (image_path, label_id)
        """
        self.items = items
        self.id_to_index = id_to_index
        self.transform = transform
        self.num_labels = len(id_to_index)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        img_path, label_id = self.items[idx]
        image = Image.open(img_path).convert("RGB")

        if self.transform:
            image = self.transform(image)

        # Multi-hot vector (even though we're using 1 label per image for now)
        target = torch.zeros(self.num_labels, dtype=torch.float32)
        label_index = self.id_to_index[label_id]
        target[label_index] = 1.0

        return image, target


def build_items(data_root: str) -> List[Tuple[str, str]]:
    """
    Build a simple list of (image_path, label_id) pairs from your current folder structure.
    - All amazon/benign images => BENIGN
    - All dark/forced_action images => FRC_FORCED_ACTION
    """
    items: List[Tuple[str, str]] = []

    benign_pattern = os.path.join(data_root, "benign", "amazon", "*.png")
    dark_pattern = os.path.join(data_root, "dark", "forced_action", "*.png")

    benign_images = sorted(glob(benign_pattern))
    dark_images = sorted(glob(dark_pattern))

    for path in benign_images:
        items.append((path, "BENIGN"))

    for path in dark_images:
        items.append((path, "FRC_FORCED_ACTION"))

    if not items:
        raise RuntimeError(
            f"No images found under {data_root}. "
            f"Checked patterns: {benign_pattern}, {dark_pattern}"
        )

    print("Found images for training:")
    for p, lid in items:
        print(f"  {lid:>18}  ->  {p}")

    return items


def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


def train():
    # --- 1. Load config ---
    cfg_path = os.path.join("ml", "training", "config_v1.json")
    with open(cfg_path, "r") as f:
        cfg = json.load(f)

    labels_path = cfg["labels_path"]
    data_root = cfg["data_root"]
    output_dir = cfg.get("output_dir", "ml/models")
    batch_size = cfg.get("batch_size", 2)
    num_epochs = cfg.get("num_epochs", 3)
    lr = cfg.get("learning_rate", 1e-4)
    val_fraction = cfg.get("val_fraction", 0.2)

    os.makedirs(output_dir, exist_ok=True)

    # --- 2. Labels ---
    labels, id_to_index = load_labels(labels_path)
    num_labels = len(labels)
    print("Loaded labels:", labels)
    print("id_to_index:", id_to_index)

    # --- 3. Build item list ---
    items = build_items(data_root)

    # --- 4. Train/val split ---
    n_total = len(items)
    n_val = max(1, int(n_total * val_fraction)) if n_total > 1 else 0
    n_train = n_total - n_val
    if n_train <= 0:
        raise RuntimeError("Not enough samples to create a train split.")

    full_dataset = SimpleDarkPatternDataset(
        items=items,
        id_to_index=id_to_index,
        transform=transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        ),
    )

    train_dataset, val_dataset = random_split(full_dataset, [n_train, n_val])
    print(f"Train samples: {len(train_dataset)}, Val samples: {len(val_dataset)}, Labels: {num_labels}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size)

    # --- 5. Model ---
    device = get_device()
    print(f"Training on {device} for {num_epochs} epochs…")

    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    in_feats = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(in_feats, 128),
        nn.ReLU(),
        nn.Linear(128, num_labels),
        nn.Sigmoid(),  # multi-label-ish output
    )
    model.to(device)

    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # --- 6. Training loop ---
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0.0

        for images, targets in train_loader:
            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)

        avg_train_loss = total_loss / len(train_dataset) if len(train_dataset) > 0 else 0.0

        # Validation
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for images, targets in val_loader:
                images = images.to(device)
                targets = targets.to(device)
                outputs = model(images)
                loss = criterion(outputs, targets)
                val_loss += loss.item() * images.size(0)

        avg_val_loss = val_loss / len(val_dataset) if len(val_dataset) > 0 else 0.0

        print(
            f"Epoch {epoch+1}/{num_epochs} – "
            f"train_loss: {avg_train_loss:.4f}, val_loss: {avg_val_loss:.4f}"
        )

    # --- 7. Save ---
    labels_out_path = os.path.join(output_dir, "labels_v1.json")
    model_out_path = os.path.join(output_dir, "model_v1.pt")

    torch.save(model.state_dict(), model_out_path)
    with open(labels_out_path, "w") as f:
        json.dump(labels, f, indent=2)

    print(f"\n✅ Training complete.")
    print(f"  Model saved to:   {model_out_path}")
    print(f"  Labels saved to:  {labels_out_path}")


if __name__ == "__main__":
    train()