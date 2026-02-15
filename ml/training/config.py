from pathlib import Path

# ── Paths (all relative to repo root) ──
REPO_ROOT = Path(__file__).resolve().parents[2]
EVENTS_JSONL = REPO_ROOT / "data" / "annotated" / "events.jsonl"
SPLITS_DIR = REPO_ROOT / "ml" / "data" / "splits"
MODELS_DIR = REPO_ROOT / "ml" / "models"

# ── Label mapping (alphabetical → deterministic) ──
LABEL_MAP = {
    "false_urgency": 0,
    "fear_based_threat": 1,
    "forced_continuity": 2,
}
ID_TO_LABEL = {v: k for k, v in LABEL_MAP.items()}
NUM_LABELS = len(LABEL_MAP)

# ── Split config ──
TEST_SIZE = 0.2
RANDOM_SEED = 42

# ── Training hyperparameters ──
MODEL_NAME = "bert-base-uncased"
MAX_SEQ_LENGTH = 128
LEARNING_RATE = 3e-5
NUM_EPOCHS = 10
BATCH_SIZE = 8
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.1
FREEZE_LAYERS = 8  # freeze first 10 of 12 encoder layers to reduce overfitting
