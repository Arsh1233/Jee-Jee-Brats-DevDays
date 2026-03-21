"""
🚨 Alert Job — Anomaly detection & alerting.
Scans synthetic consumption data for anomalies and queues alerts.
"""

import random
import math
import time
from datetime import datetime, timezone

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config
from optimizer.engine import score_anomalies

_alert_log: list[dict] = []


def run():
    """Job entry point — scan readings and generate alerts."""
    global _alert_log

    # Generate synthetic consumption readings
    readings = []
    for i in range(48):
        base = 1.2 + math.sin(i / 4) * 0.6
        spike = (3.0 + random.random() * 2.0) if random.random() > 0.92 else 0
        readings.append(round(base + spike + random.random() * 0.3, 4))

    report = score_anomalies(readings)

    new_alerts = []
    for a in report["anomalies"]:
        alert_type = "CRITICAL" if a["value"] > report["mean"] * 2 else "WARNING"
        new_alerts.append({
            "id": f"ALERT-{int(time.time() * 1000)}-{a['index']}",
            "type": alert_type,
            "message": (f"Anomalous consumption detected: {a['value']:.2f} kWh "
                        f"(z-score: {a['z_score']}) at interval {a['index']}"),
            "value": a["value"],
            "z_score": a["z_score"],
            "threshold": config.ANOMALY_Z_THRESHOLD,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "acknowledged": False,
        })

    if new_alerts:
        _alert_log.extend(new_alerts)
        # Keep only last 100 alerts
        _alert_log = _alert_log[-100:]
        print(f"[AlertJob] 🚨 {len(new_alerts)} anomaly alert(s) generated")
    else:
        print("[AlertJob] ✅ No anomalies detected")

    return {
        "scanned": len(readings),
        "anomalies_found": len(report["anomalies"]),
        "alerts_generated": len(new_alerts),
        "mean": report["mean"],
        "std_dev": report["std_dev"],
    }


def get_alerts(limit: int = 20) -> list[dict]:
    return list(reversed(_alert_log[-limit:]))


def acknowledge_alert(alert_id: str) -> bool:
    for alert in _alert_log:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return True
    return False
