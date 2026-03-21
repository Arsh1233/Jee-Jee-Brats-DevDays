"""
⚡ PowerPilot AI Engine — Master Entry Point
Starts all AI subsystems: optimizer, scheduler, voice assistant, chatbot.
Run: python main.py
"""

import sys
import os
import time

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(__file__))

import config
from optimizer.engine import run_diagnostic, get_status as optimizer_status
from scheduler.scheduler import Scheduler
from scheduler.jobs import optimizer_job, forecast_job, alert_job
from voice_assistant.assistant import process_voice_command
from chatbot.chatbot import process_query


def main():
    print(f"""
╔══════════════════════════════════════════════════════════╗
║           ⚡ {config.APP_NAME} v{config.VERSION}           ║
║        Autonomous AI for Energy Management              ║
╠══════════════════════════════════════════════════════════╣
║  Subsystems:                                            ║
║    🧠 AI Optimizer Engine                               ║
║    ⏰ Autonomous Job Scheduler                          ║
║    🎙️  AI Voice Assistant                               ║
║    💬 AI Chatbot                                        ║
╚══════════════════════════════════════════════════════════╝
    """)

    # ── 1. Run Optimizer Diagnostic ──────────────────────────────
    print("[1/4] Running optimizer diagnostic...")
    diag = run_diagnostic()
    print(f"  Status: {diag['status'].upper()}")
    print(f"  Suggestions generated: {diag['suggestions_generated']}")
    print(f"  Strategy used: {diag['strategy_used']}")
    print(f"  Peak windows detected: {diag['peak_windows_detected']}")
    print(f"  Anomalies detected: {diag['anomalies_detected']}")
    print()

    # ── 2. Start Scheduler ───────────────────────────────────────
    print("[2/4] Starting autonomous scheduler...")
    scheduler = Scheduler()
    scheduler.register("optimizer_sweep", optimizer_job.run, config.OPTIMIZER_INTERVAL_SEC)
    scheduler.register("tariff_forecast", forecast_job.run, config.FORECAST_INTERVAL_SEC)
    scheduler.register("anomaly_alerts", alert_job.run, config.ALERT_INTERVAL_SEC)
    scheduler.start_all()
    print()

    # ── 3. Test Voice Assistant ──────────────────────────────────
    print("[3/4] Testing voice assistant...")
    test_commands = [
        "Hello",
        "What's my usage today?",
        "Turn off the AC",
        "Give me saving tips",
    ]
    for cmd in test_commands:
        result = process_voice_command(cmd)
        print(f"  🎙️  \"{cmd}\"")
        print(f"     → Intent: {result['intent']} (confidence: {result['confidence']})")
        print(f"     → {result['response']['text'][:80]}...")
        print()

    # ── 4. Test Chatbot ──────────────────────────────────────────
    print("[4/4] Testing chatbot...")
    test_queries = [
        "What is my usage this month?",
        "Why is my bill so high?",
        "What are the tariff rates?",
        "Compare my usage with last month",
    ]
    for q in test_queries:
        result = process_query(q)
        print(f"  💬  \"{q}\"")
        print(f"     → Type: {result['query_classification']}")
        lines = result['formatted_text'].split('\n')
        for line in lines[:3]:
            print(f"     {line}")
        if len(lines) > 3:
            print(f"     ...")
        print()

    # ── Status Report ────────────────────────────────────────────
    print("=" * 60)
    print("  ✅ All subsystems running!")
    sched_status = scheduler.get_status()
    print(f"  📊 Scheduler: {sched_status['total_jobs']} jobs active")
    for name, info in sched_status["jobs"].items():
        print(f"     • {name}: every {info['interval_human']}, "
              f"runs: {info['runs_completed']}, "
              f"last: {info['last_duration_ms']}ms")
    print(f"\n  Press Ctrl+C to stop.\n")

    # Keep alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n[Shutdown] Stopping scheduler...")
        scheduler.stop_all()
        print("[Shutdown] ⚡ PowerPilot AI Engine stopped.\n")


if __name__ == "__main__":
    main()
