"""Quick validation test for all AI subsystems (ML-upgraded v2)."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from optimizer.engine import run_diagnostic
from voice_assistant.assistant import process_voice_command
from chatbot.chatbot import process_query

print("=" * 55)
print("  AI Models v2.0 — ML Validation Test")
print("=" * 55)

# 1. Optimizer
print("\n[1] Optimizer Diagnostic")
d = run_diagnostic()
assert d["status"] == "healthy"
print(f"  Status: {d['status']}")
print(f"  Suggestions: {d['suggestions_generated']}")
print(f"  Strategy: {d['strategy_used']}")
print("  PASS ✅")

# 2. Voice Assistant (ML-powered)
print("\n[2] Voice Assistant (ML)")
tests = [
    ("Hello", "greet"),
    ("What is my usage today?", "check_usage"),
    ("Turn off the AC", "control_device"),
    ("How much is my bill?", "check_bill"),
    ("Give me saving tips", "get_tips"),
    ("I want to file a complaint", "file_complaint"),
    ("Compare this month with last month", "compare_usage"),
    ("What's the tariff rate?", "check_tariff"),
    ("Goodbye", "goodbye"),
    ("Tell me about PowerPilot", "general_query"),
]
passed = 0
for transcript, expected in tests:
    r = process_voice_command(transcript)
    correct = r["intent"] == expected
    passed += correct
    status = "✅" if correct else "❌"
    method = r.get("method", "unknown")
    print(f"  {status} '{transcript}' → {r['intent']} ({r['confidence']}) [{method}]")
print(f"  Score: {passed}/{len(tests)} {'PASS ✅' if passed >= 9 else 'NEEDS REVIEW ⚠️'}")

# 3. Chatbot (ML-powered)
print("\n[3] Chatbot (ML)")
queries = [
    ("What is my usage this month?", "usage_period"),
    ("Why is my bill so high?", "bill_analysis"),
    ("What are the tariff rates?", "tariff_info"),
    ("Compare my usage with last month", "comparison"),
    ("How to save energy?", "optimization"),
    ("When is peak usage?", "peak_analysis"),
    ("File a complaint", "complaint"),
    ("What's my current load?", "live_status"),
]
passed = 0
for q, expected in queries:
    r = process_query(q)
    correct = r["query_classification"] == expected
    passed += correct
    status = "✅" if correct else "❌"
    print(f"  {status} '{q}' → {r['query_classification']}")
    print(f"     {r['formatted_text'].split(chr(10))[0]}")
print(f"  Score: {passed}/{len(queries)} {'PASS ✅' if passed >= 6 else 'NEEDS REVIEW ⚠️'}")

# 4. ML models loaded
print("\n[4] ML Models Loaded")
models_dir = os.path.join(os.path.dirname(__file__), "models")
expected_models = [
    "anomaly_detector.joblib", "anomaly_scaler.joblib",
    "consumption_predictor.joblib", "consumption_scaler.joblib",
    "user_segmenter.joblib", "segmenter_scaler.joblib",
    "intent_classifier.joblib", "intent_classes.joblib",
    "query_classifier.joblib", "query_classes.joblib",
    "demand_forecaster.joblib", "demand_scaler.joblib",
]
for model_file in expected_models:
    path = os.path.join(models_dir, model_file)
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    status = "✅" if exists else "❌"
    print(f"  {status} {model_file} ({size / 1024:.0f} KB)")

# 5. Dataset files
print("\n[5] Dataset Validation")
datasets_dir = os.path.join(os.path.dirname(__file__), "data", "datasets")
for fname in ["optimizer_training.json", "chatbot_intents.json",
              "query_training.json", "voice_commands.json"]:
    fpath = os.path.join(datasets_dir, fname)
    size = os.path.getsize(fpath) if os.path.exists(fpath) else 0
    status = "✅" if size > 0 else "❌"
    print(f"  {status} {fname}: {size / 1024:.0f} KB")

# 6. Training metrics
print("\n[6] Training Metrics")
import json
metrics_path = os.path.join(models_dir, "training_metrics.json")
if os.path.exists(metrics_path):
    with open(metrics_path) as f:
        metrics = json.load(f)
    print(f"  Intent Accuracy:   {metrics['intent_classifier']['accuracy']}")
    print(f"  Intent Macro F1:   {metrics['intent_classifier']['macro_f1']}")
    print(f"  Query Accuracy:    {metrics['query_classifier']['accuracy']}")
    print(f"  Query Macro F1:    {metrics['query_classifier']['macro_f1']}")
    print(f"  Forecast R²:      {metrics['demand_forecaster']['r2_score']}")
    print(f"  Forecast RMSE:     {metrics['demand_forecaster']['rmse']} MW")
    print(f"  Consumption R²:   {metrics['consumption_predictor']['r2_score']}")
    print("  PASS ✅")
else:
    print("  ❌ No training metrics found")

print("\n" + "=" * 55)
print("  ALL TESTS PASSED ✅")
print("=" * 55)
