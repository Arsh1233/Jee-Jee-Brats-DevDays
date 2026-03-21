"""
📊 PowerPilot AI — Master Data Generator
Run: python data/generate.py
Generates all training datasets and saves to data/datasets/
"""

import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from data.generators import optimizer_data, chatbot_data, voice_data
import config

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")


def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def main():
    print(f"\n{'='*60}")
    print(f"  📊 PowerPilot AI — Synthetic Data Generator v{config.VERSION}")
    print(f"{'='*60}\n")

    ensure_dir(DATASETS_DIR)

    # ── 1. Optimizer training data ────────────────────────────────
    print(f"[1/4] Generating {config.OPTIMIZER_PROFILES_COUNT:,} optimizer profiles...")
    t0 = time.time()
    opt_data = optimizer_data.generate()
    opt_path = os.path.join(DATASETS_DIR, "optimizer_training.json")
    with open(opt_path, "w", encoding="utf-8") as f:
        json.dump(opt_data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ {len(opt_data):,} profiles → {opt_path}")
    print(f"  ⏱  {time.time() - t0:.1f}s | {os.path.getsize(opt_path) / 1024 / 1024:.1f} MB")

    # ── 2. Chatbot intent training data ───────────────────────────
    print(f"\n[2/4] Generating {config.CHATBOT_INTENTS_COUNT:,} chatbot intents...")
    t0 = time.time()
    cb_data = chatbot_data.generate()
    cb_path = os.path.join(DATASETS_DIR, "chatbot_intents.json")
    with open(cb_path, "w", encoding="utf-8") as f:
        json.dump(cb_data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ {len(cb_data):,} intent-utterance pairs → {cb_path}")
    print(f"  ⏱  {time.time() - t0:.1f}s | {os.path.getsize(cb_path) / 1024:.1f} KB")

    # ── 3. Chatbot query training data ────────────────────────────
    print(f"\n[3/4] Generating {config.QUERY_TRAINING_COUNT:,} query training samples...")
    t0 = time.time()
    qry_data = chatbot_data.generate_query_training_data(config.QUERY_TRAINING_COUNT)
    qry_path = os.path.join(DATASETS_DIR, "query_training.json")
    with open(qry_path, "w", encoding="utf-8") as f:
        json.dump(qry_data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ {len(qry_data):,} query-type pairs → {qry_path}")
    print(f"  ⏱  {time.time() - t0:.1f}s | {os.path.getsize(qry_path) / 1024:.1f} KB")

    # ── 4. Voice command training data ────────────────────────────
    print(f"\n[4/4] Generating {config.VOICE_COMMANDS_COUNT:,} voice commands...")
    t0 = time.time()
    vc_data = voice_data.generate()
    vc_path = os.path.join(DATASETS_DIR, "voice_commands.json")
    with open(vc_path, "w", encoding="utf-8") as f:
        json.dump(vc_data, f, indent=2, ensure_ascii=False)
    print(f"  ✅ {len(vc_data):,} voice transcripts → {vc_path}")
    print(f"  ⏱  {time.time() - t0:.1f}s | {os.path.getsize(vc_path) / 1024:.1f} KB")

    # ── Summary ───────────────────────────────────────────────────
    total_records = len(opt_data) + len(cb_data) + len(qry_data) + len(vc_data)
    total_size = sum(os.path.getsize(os.path.join(DATASETS_DIR, f))
                     for f in os.listdir(DATASETS_DIR) if f.endswith(".json"))

    print(f"\n{'='*60}")
    print(f"  ✅ All datasets generated!")
    print(f"  📁 Output: {DATASETS_DIR}")
    print(f"  📈 Total records: {total_records:,}")
    print(f"  💾 Total size: {total_size / 1024 / 1024:.1f} MB")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
