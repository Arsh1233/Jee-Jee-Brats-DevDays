"""
⚡ PowerPilot AI Engine — REST API Server
Flask API exposing all 6 ML models for backend/mobile/web-admin integration.
Run: python api_server.py
"""

import sys
import os
import json
import time
from datetime import datetime, timezone
from typing import cast

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS

import config
from chatbot.chatbot import process_query
from voice_assistant.assistant import process_voice_command
from optimizer.engine import run_diagnostic, generate_recommendations, get_status as optimizer_status

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
START_TIME = time.time()


# ── Health Check ─────────────────────────────────────────────────────
@app.route('/api/ai/health', methods=['GET'])
def health():
    uptime_sec = int(time.time() - START_TIME)
    return jsonify({
        "status": "ok",
        "engine": config.APP_NAME,
        "version": config.VERSION,
        "uptime_seconds": uptime_sec,
        "uptime_human": f"{uptime_sec // 3600}h {(uptime_sec % 3600) // 60}m",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "models_loaded": _check_models_loaded(),
    })


# ── Chatbot ──────────────────────────────────────────────────────────
@app.route('/api/ai/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True)
    message = data.get('message', '').strip()
    session_id = data.get('session_id', 'default')

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        result = process_query(message, session_id)
        return jsonify({
            "response": result["formatted_text"],
            "query_type": result["query_classification"],
            "suggestions": result.get("suggestions", []),
            "session_id": result["session_id"],
            "turn_number": result["turn_number"],
            "raw_data": result.get("raw_data", {}),
            "powered_by": "ml",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Voice Assistant ──────────────────────────────────────────────────
@app.route('/api/ai/voice', methods=['POST'])
def voice():
    data = request.get_json(force=True)
    transcript = data.get('transcript', '').strip()
    session_id = data.get('session_id', 'default')

    if not transcript:
        return jsonify({"error": "transcript is required"}), 400

    try:
        result = process_voice_command(transcript, session_id)
        response_obj = result["response"]
        return jsonify({
            "intent": result["intent"],
            "confidence": result["confidence"],
            "entities": result.get("entities", {}),
            "response": response_obj.get("text", ""),
            "data": response_obj.get("data", {}),
            "suggestions": response_obj.get("suggestions", []),
            "session_id": result["session_id"],
            "turn_number": result["turn_number"],
            "powered_by": "ml",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Speech-to-Text Transcription ────────────────────────────────
@app.route('/api/ai/transcribe', methods=['POST'])
def transcribe():
    """Accept an audio file upload and return the transcribed text.
    Converts any audio format to WAV using pydub+ffmpeg before recognition."""
    import speech_recognition as sr
    import tempfile
    from pydub import AudioSegment

    if 'audio' not in request.files:
        return jsonify({"error": "audio file is required"}), 400

    audio_file = request.files['audio']
    filename = audio_file.filename or 'recording.m4a'
    ext = os.path.splitext(filename)[1] or '.m4a'

    try:
        # 1. Save the uploaded file as-is
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            audio_file.save(tmp.name)
            src_path = tmp.name

        file_size = os.path.getsize(src_path)
        print(f"[Transcribe] Received: {filename}, {file_size} bytes, ext={ext}")

        if file_size < 100:
            os.unlink(src_path)
            return jsonify({"error": "Audio file too small — recording may have failed"}), 400

        # 2. Convert to WAV (16kHz mono) using pydub + ffmpeg
        wav_path = src_path + '.wav'
        try:
            fmt = ext.lstrip('.').lower()
            if fmt in ('3gp', '3gpp'):
                fmt = '3gp'
            audio_seg = AudioSegment.from_file(src_path, format=fmt)
            audio_seg = audio_seg.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            audio_seg.export(wav_path, format='wav')
            print(f"[Transcribe] Converted to WAV: {os.path.getsize(wav_path)} bytes")
        except Exception as conv_err:
            print(f"[Transcribe] pydub conversion error: {conv_err}")
            # Fallback: try treating src directly as WAV
            wav_path = src_path

        # 3. Transcribe with speech_recognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        transcript = recognizer.recognize_google(audio_data)

        # Cleanup
        if os.path.exists(src_path):
            os.unlink(src_path)
        if wav_path != src_path and os.path.exists(wav_path):
            os.unlink(wav_path)

        return jsonify({
            "transcript": transcript,
            "confidence": 0.9,
            "engine": "google_speech",
        })
    except sr.UnknownValueError:
        return jsonify({"transcript": "", "error": "Could not understand audio"}), 200
    except sr.RequestError as e:
        return jsonify({"error": f"Speech service error: {str(e)}"}), 503
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Transcription error: {str(e)}"}), 500


# ── Optimizer ────────────────────────────────────────────────────────
@app.route('/api/ai/optimizer/analyze', methods=['POST'])
def optimizer_analyze():
    data = request.get_json(force=True)
    try:
        result = generate_recommendations(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/optimizer/status', methods=['GET'])
def optimizer_stat():
    try:
        diag = run_diagnostic()
        status = optimizer_status()
        return jsonify({
            "diagnostic": diag,
            "engine_status": status,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Demand Forecast (ML) ────────────────────────────────────────────
@app.route('/api/ai/forecast', methods=['GET'])
def forecast():
    try:
        from scheduler.ml_forecaster import DemandForecaster
        forecaster = DemandForecaster()
        loaded = forecaster.load()

        if not loaded:
            # Train on the fly if model not saved yet
            forecaster.train()
            forecaster.save()

        now = datetime.now()
        predictions = forecaster.predict_next_24h(
            current_hour=now.hour,
            month=now.month - 1,
            dow=now.weekday(),
            temperature=30.0,
        )

        return jsonify({
            "predictions": predictions,
            "model_trained": True,
            "training_metrics": forecaster.training_metrics,
            "generated_at": now.isoformat(),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Model Stats ──────────────────────────────────────────────────────

def _build_model_info(model_def: dict, training_metrics: dict):
    """Build a single model's info dict with file sizes and metrics.
    Extracted to its own function to give Pyre2 a clean type scope."""
    model_info: dict = {k: v for k, v in model_def.items() if k != "files"}
    file_sizes: dict = {}
    model_size: int = 0
    all_exist: bool = True
    for fname in model_def.get("files", []):
        fpath = os.path.join(MODELS_DIR, str(fname))
        if os.path.exists(fpath):
            sz: int = os.path.getsize(fpath)
            file_sizes[fname] = sz
            model_size += sz
        else:
            all_exist = False
            file_sizes[fname] = 0
    model_info["file_sizes"] = file_sizes
    model_info["total_size_kb"] = round(model_size / 1024, 1)
    model_info["loaded"] = all_exist
    metrics_val = training_metrics.get(str(model_def.get("id", "")))
    if metrics_val is not None:
        model_info["metrics"] = metrics_val
    return model_info, model_size


@app.route('/api/ai/models/stats', methods=['GET'])
def model_stats():
    try:
        stats = {
            "engine": config.APP_NAME,
            "version": config.VERSION,
            "total_models": 6,
            "models": [],
        }

        # Load training metrics if available
        metrics_path = os.path.join(MODELS_DIR, "training_metrics.json")
        training_metrics: dict = {}
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                training_metrics = json.load(f)

        # Define model info
        model_defs: list = [
            {
                "id": "intent_classifier",
                "name": "Intent Classifier",
                "icon": "🎙️",
                "description": "Voice Assistant + Chatbot NLU",
                "algorithm": "TF-IDF + CalibratedClassifierCV(LinearSVC)",
                "training_data": "8,000 utterances",
                "files": ["intent_classifier.joblib", "intent_classes.joblib"],
                "metric_type": "classification",
            },
            {
                "id": "query_classifier",
                "name": "Query Classifier",
                "icon": "💬",
                "description": "Chatbot query type routing",
                "algorithm": "TF-IDF + RandomForest (200 trees)",
                "training_data": "3,000 query samples",
                "files": ["query_classifier.joblib", "query_classes.joblib"],
                "metric_type": "classification",
            },
            {
                "id": "demand_forecaster",
                "name": "Demand Forecaster",
                "icon": "📈",
                "description": "24-hour grid demand prediction",
                "algorithm": "GradientBoosting (250 trees, depth 5)",
                "training_data": "8,760 hourly samples",
                "files": ["demand_forecaster.joblib", "demand_scaler.joblib"],
                "metric_type": "regression",
            },
            {
                "id": "consumption_predictor",
                "name": "Consumption Predictor",
                "icon": "📊",
                "description": "Per-user consumption forecasting",
                "algorithm": "GradientBoosting (300 trees, depth 6)",
                "training_data": "120,000 hourly readings",
                "files": ["consumption_predictor.joblib", "consumption_scaler.joblib"],
                "metric_type": "regression",
            },
            {
                "id": "anomaly_detector",
                "name": "Anomaly Detector",
                "icon": "🔍",
                "description": "Usage spike & drop detection",
                "algorithm": "IsolationForest (200 trees, 5% contamination)",
                "training_data": "120,000 hourly readings",
                "files": ["anomaly_detector.joblib", "anomaly_scaler.joblib"],
                "metric_type": "anomaly",
            },
            {
                "id": "user_segmenter",
                "name": "User Segmenter",
                "icon": "👥",
                "description": "Consumer behaviour clustering",
                "algorithm": "KMeans (5 clusters)",
                "training_data": "10,000 user profiles",
                "files": ["user_segmenter.joblib", "segmenter_scaler.joblib"],
                "metric_type": "clustering",
            },
        ]

        total_size: int = 0
        for model_def in model_defs:
            model_info, model_size = _build_model_info(model_def, training_metrics)
            total_size += model_size
            stats["models"].append(model_info)

        stats["total_size_mb"] = round(total_size / (1024 * 1024), 1)
        stats["training_metrics_available"] = bool(training_metrics)

        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _check_models_loaded():
    """Quick check if all model files exist."""
    required = [
        "intent_classifier.joblib", "query_classifier.joblib",
        "demand_forecaster.joblib", "consumption_predictor.joblib",
        "anomaly_detector.joblib", "user_segmenter.joblib",
    ]
    return all(
        os.path.exists(os.path.join(MODELS_DIR, f))
        for f in required
    )


if __name__ == '__main__':
    print("=" * 60)
    print(f"  {config.APP_NAME} - API Server")
    print("  REST API for ML Models")
    print("=" * 60)
    print("  POST /api/ai/chat         -- ML Chatbot")
    print("  POST /api/ai/voice        -- ML Voice Assistant")
    print("  GET  /api/ai/forecast     -- 24h Demand Forecast")
    print("  GET  /api/ai/models/stats -- Model Stats")
    print("  GET  /api/ai/health       -- Health Check")
    print("=" * 60)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

