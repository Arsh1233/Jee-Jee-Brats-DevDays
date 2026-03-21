"""
🏋️ PowerPilot AI — Master Training Pipeline
Generates data → Trains all ML models → Evaluates → Saves
Run: python train.py
"""

import sys
import os
import time
import json

sys.path.insert(0, os.path.dirname(__file__))

import config
from data.generators import optimizer_data, chatbot_data, voice_data
from optimizer.ml_models import AnomalyDetector, ConsumptionPredictor, UserSegmenter
from voice_assistant.ml_intent_classifier import IntentClassifier
from chatbot.ml_query_classifier import QueryClassifier
from scheduler.ml_forecaster import DemandForecaster

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def print_section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def print_metrics(metrics: dict, indent: int = 4):
    prefix = " " * indent
    for k, v in metrics.items():
        if isinstance(v, dict):
            print(f"{prefix}{k}:")
            print_metrics(v, indent + 4)
        elif isinstance(v, list):
            print(f"{prefix}{k}:")
            for item in v[:5]:
                if isinstance(item, dict):
                    print(f"{prefix}    {item}")
                else:
                    print(f"{prefix}    {item}")
        else:
            print(f"{prefix}{k}: {v}")


def main():
    print(f"""
╔══════════════════════════════════════════════════════════╗
║       🏋️  PowerPilot AI — Training Pipeline v{config.VERSION}       ║
║    scikit-learn ML Models for Energy Management         ║
╚══════════════════════════════════════════════════════════╝
    """)

    total_start = time.time()
    all_metrics = {}

    # ═══════════════════════════════════════════════════════════════
    # STEP 1: Generate Training Data
    # ═══════════════════════════════════════════════════════════════
    print_section("📊 Step 1: Generating Training Data")

    print(f"  Generating {config.OPTIMIZER_PROFILES_COUNT:,} optimizer profiles...")
    t0 = time.time()
    opt_profiles = optimizer_data.generate()
    print(f"  ✅ {len(opt_profiles):,} profiles in {time.time()-t0:.1f}s")

    print(f"  Generating {config.CHATBOT_INTENTS_COUNT:,} chatbot utterances...")
    t0 = time.time()
    cb_utterances = chatbot_data.generate()
    print(f"  ✅ {len(cb_utterances):,} utterances in {time.time()-t0:.1f}s")

    print(f"  Generating {config.QUERY_TRAINING_COUNT:,} query training samples...")
    t0 = time.time()
    query_samples = chatbot_data.generate_query_training_data(config.QUERY_TRAINING_COUNT)
    print(f"  ✅ {len(query_samples):,} query samples in {time.time()-t0:.1f}s")

    print(f"  Generating {config.VOICE_COMMANDS_COUNT:,} voice transcripts...")
    t0 = time.time()
    voice_transcripts = voice_data.generate()
    print(f"  ✅ {len(voice_transcripts):,} transcripts in {time.time()-t0:.1f}s")

    total_records = len(opt_profiles) + len(cb_utterances) + len(query_samples) + len(voice_transcripts)
    print(f"\n  📈 Total training records: {total_records:,}")

    # ═══════════════════════════════════════════════════════════════
    # STEP 2: Train Optimizer Models
    # ═══════════════════════════════════════════════════════════════
    print_section("🧠 Step 2: Training Optimizer Models")

    # 2a. Anomaly Detector (Isolation Forest)
    print("\n  [2a] Anomaly Detector (Isolation Forest)")
    print(f"       Training on {len(opt_profiles):,} profiles...")
    t0 = time.time()
    anomaly_det = AnomalyDetector()
    anomaly_metrics = anomaly_det.train(opt_profiles[:5000])  # Use subset for speed
    anomaly_det.save()
    print(f"       ✅ Trained in {time.time()-t0:.1f}s")
    print_metrics(anomaly_metrics)
    all_metrics["anomaly_detector"] = anomaly_metrics

    # 2b. Consumption Predictor (Gradient Boosting)
    print("\n  [2b] Consumption Predictor (Gradient Boosting)")
    print(f"       Training on {min(5000, len(opt_profiles)):,} profiles...")
    t0 = time.time()
    cons_pred = ConsumptionPredictor()
    cons_metrics = cons_pred.train(opt_profiles[:5000])
    cons_pred.save()
    print(f"       ✅ Trained in {time.time()-t0:.1f}s")
    print_metrics(cons_metrics)
    all_metrics["consumption_predictor"] = cons_metrics

    # 2c. User Segmenter (K-Means)
    print("\n  [2c] User Segmenter (K-Means)")
    print(f"       Clustering {min(10000, len(opt_profiles)):,} users...")
    t0 = time.time()
    segmenter = UserSegmenter()
    seg_metrics = segmenter.train(opt_profiles[:10000])
    segmenter.save()
    print(f"       ✅ Trained in {time.time()-t0:.1f}s")
    print_metrics(seg_metrics)
    all_metrics["user_segmenter"] = seg_metrics

    # ═══════════════════════════════════════════════════════════════
    # STEP 3: Train Voice Assistant Intent Classifier
    # ═══════════════════════════════════════════════════════════════
    print_section("🎙️ Step 3: Training Intent Classifier (TF-IDF + SVM)")

    # Combine chatbot utterances + voice transcripts for intent training
    intent_training = []
    for item in cb_utterances:
        intent_training.append({
            "utterance": item["utterance"],
            "intent": item["intent"],
        })
    for item in voice_transcripts:
        intent_training.append({
            "utterance": item["transcript"],
            "intent": item["intent"],
        })

    print(f"  Training on {len(intent_training):,} utterances across {len(set(i['intent'] for i in intent_training))} intents...")
    t0 = time.time()
    intent_clf = IntentClassifier()
    intent_metrics = intent_clf.train(intent_training)
    intent_clf.save()
    print(f"  ✅ Trained in {time.time()-t0:.1f}s")
    print(f"  Accuracy: {intent_metrics['accuracy']}")
    print(f"  Macro F1: {intent_metrics['macro_f1']}")
    print(f"  Weighted F1: {intent_metrics['weighted_f1']}")
    print(f"\n  Per-intent metrics:")
    for intent, m in intent_metrics.get("per_intent", {}).items():
        print(f"    {intent:20s} P={m['precision']:.3f}  R={m['recall']:.3f}  F1={m['f1']:.3f}  ({m['support']} samples)")
    all_metrics["intent_classifier"] = intent_metrics

    # ═══════════════════════════════════════════════════════════════
    # STEP 4: Train Chatbot Query Classifier
    # ═══════════════════════════════════════════════════════════════
    print_section("💬 Step 4: Training Query Classifier (TF-IDF + Random Forest)")

    print(f"  Training on {len(query_samples):,} queries across {len(set(q['query_type'] for q in query_samples))} types...")
    t0 = time.time()
    query_clf = QueryClassifier()
    query_metrics = query_clf.train(query_samples)
    query_clf.save()
    print(f"  ✅ Trained in {time.time()-t0:.1f}s")
    print(f"  Accuracy: {query_metrics['accuracy']}")
    print(f"  Macro F1: {query_metrics['macro_f1']}")
    print(f"  Weighted F1: {query_metrics['weighted_f1']}")
    print(f"\n  Per-type metrics:")
    for qtype, m in query_metrics.get("per_type", {}).items():
        print(f"    {qtype:20s} P={m['precision']:.3f}  R={m['recall']:.3f}  F1={m['f1']:.3f}  ({m['support']} samples)")
    all_metrics["query_classifier"] = query_metrics

    # ═══════════════════════════════════════════════════════════════
    # STEP 5: Train Demand Forecaster
    # ═══════════════════════════════════════════════════════════════
    print_section("📈 Step 5: Training Demand Forecaster (Gradient Boosting)")

    print(f"  Generating 365 days of hourly demand data (8,760 samples)...")
    t0 = time.time()
    forecaster = DemandForecaster()
    forecast_metrics = forecaster.train()
    forecaster.save()
    print(f"  ✅ Trained in {time.time()-t0:.1f}s")
    print_metrics(forecast_metrics)
    all_metrics["demand_forecaster"] = forecast_metrics

    # ═══════════════════════════════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════════════════════════════
    total_time = time.time() - total_start

    print(f"""
╔══════════════════════════════════════════════════════════╗
║              ✅ Training Complete!                       ║
╠══════════════════════════════════════════════════════════╣
║  Model Performance Summary                              ║
╠══════════════════════════════════════════════════════════╣""")

    print(f"║  🔍 Anomaly Detector                                    ║")
    print(f"║     Precision: {all_metrics['anomaly_detector'].get('precision', 'N/A')}                                    ║")
    print(f"║     F1 Score:  {all_metrics['anomaly_detector'].get('f1_score', 'N/A')}                                    ║")
    print(f"║  📊 Consumption Predictor                               ║")
    print(f"║     RMSE: {all_metrics['consumption_predictor']['rmse']} kWh                              ║")
    print(f"║     R² Score: {all_metrics['consumption_predictor']['r2_score']}                                   ║")
    print(f"║  👥 User Segmenter                                      ║")
    print(f"║     Clusters: {all_metrics['user_segmenter']['n_clusters']}                                         ║")
    print(f"║  🎙️ Intent Classifier                                   ║")
    print(f"║     Accuracy: {all_metrics['intent_classifier']['accuracy']}                                    ║")
    print(f"║     Macro F1: {all_metrics['intent_classifier']['macro_f1']}                                    ║")
    print(f"║  💬 Query Classifier                                    ║")
    print(f"║     Accuracy: {all_metrics['query_classifier']['accuracy']}                                    ║")
    print(f"║     Macro F1: {all_metrics['query_classifier']['macro_f1']}                                    ║")
    print(f"║  📈 Demand Forecaster                                   ║")
    print(f"║     RMSE: {all_metrics['demand_forecaster']['rmse']} MW                               ║")
    print(f"║     R² Score: {all_metrics['demand_forecaster']['r2_score']}                                   ║")

    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  ⏱  Total time: {total_time:.1f}s                                   ║")
    print(f"║  💾 Models saved: {MODELS_DIR}               ║")
    print(f"╚══════════════════════════════════════════════════════════╝")

    # Save metrics to file
    metrics_path = os.path.join(MODELS_DIR, "training_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"\n  📋 Full metrics → {metrics_path}")


if __name__ == "__main__":
    main()
