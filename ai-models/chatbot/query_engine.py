"""
💬 AI Chatbot — Dynamic Query Engine
Parses natural-language queries into structured data lookups.
Supports: usage queries, billing, comparisons, peak analysis, optimization Q&A.
"""

import re
import random
from datetime import datetime

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


# ── Query type classification ────────────────────────────────────────

QUERY_PATTERNS = [
    (r"usage\s+(today|yesterday|this\s+week|last\s+week|this\s+month|last\s+month)",
     "usage_period"),
    (r"(compare|comparison|vs|versus).*(month|week|day)",
     "comparison"),
    (r"(why|reason).*(bill|high|increase|spike)",
     "bill_analysis"),
    (r"(peak|highest|maximum).*(hour|time|period|usage)",
     "peak_analysis"),
    (r"(forecast|predict|tomorrow|next\s+week)",
     "forecast"),
    (r"(tariff|rate|price|cost\s+per|slab)",
     "tariff_info"),
    (r"(save|saving|reduce|cut|lower).*(bill|cost|usage|power)",
     "optimization"),
    (r"(complaint|outage|problem|issue|report|power\s+cut)",
     "complaint"),
    (r"(status|current|now|live|real.?time)",
     "live_status"),
    (r"(history|past|record|previous|trend)",
     "history"),
]


def classify_query(text: str) -> dict:
    """Classify a text query into a query type. Uses ML when available."""
    # ── Try ML classifier first ──────────────────────────────────
    try:
        from chatbot.ml_query_classifier import QueryClassifier
        ml_clf = QueryClassifier()
        if ml_clf.load():
            ml_result = ml_clf.predict(text)
            if ml_result["confidence"] >= 0.3:
                return {
                    "query_type": ml_result["query_type"],
                    "match": None,
                    "raw": text,
                    "confidence": ml_result["confidence"],
                    "method": "ml_rf",
                }
    except Exception:
        pass  # Fall through to regex

    # ── Regex fallback ───────────────────────────────────────────
    lower = text.lower().strip()

    for pattern, qtype in QUERY_PATTERNS:
        match = re.search(pattern, lower)
        if match:
            return {"query_type": qtype, "match": match.group(), "raw": text, "method": "regex"}

    return {"query_type": "general", "match": None, "raw": text, "method": "regex"}


# ── Data simulators for each query type ──────────────────────────────

def _query_usage_period(period: str) -> dict:
    base = {"today": 8, "yesterday": 9, "this_week": 52,
            "last_week": 55, "this_month": 210, "last_month": 230}
    kwh = round(base.get(period, 8) * (0.85 + random.random() * 0.3), 2)
    cost = round(kwh * config.TARIFF_RATES["standard"], 2)
    return {
        "type": "usage",
        "period": period,
        "consumption_kwh": kwh,
        "cost_rupees": cost,
        "unit_rate": config.TARIFF_RATES["standard"],
    }


def _query_comparison() -> dict:
    this_m = round(210 * (0.85 + random.random() * 0.3), 2)
    last_m = round(230 * (0.85 + random.random() * 0.3), 2)
    diff = round(this_m - last_m, 2)
    pct = round(diff / last_m * 100, 1) if last_m else 0
    return {
        "type": "comparison",
        "this_month_kwh": this_m,
        "last_month_kwh": last_m,
        "difference_kwh": diff,
        "percent_change": pct,
        "trend": "up" if diff > 0 else "down",
    }


def _query_peak_analysis() -> dict:
    peak_hours = list(range(config.PEAK_HOURS["start"], config.PEAK_HOURS["end"]))
    peak_consumption = round(sum(1.5 + random.random() for _ in peak_hours), 2)
    return {
        "type": "peak_analysis",
        "peak_hours": f"{config.PEAK_HOURS['start']}:00–{config.PEAK_HOURS['end']}:00",
        "peak_consumption_kwh": peak_consumption,
        "peak_tariff": config.TARIFF_RATES["peak"],
        "top_appliances": ["AC", "Water Heater", "Washing Machine"][:2 + random.randint(0, 1)],
    }


def _query_tariff_info() -> dict:
    return {
        "type": "tariff",
        "rates": config.TARIFF_RATES,
        "peak_hours": f"{config.PEAK_HOURS['start']}:00–{config.PEAK_HOURS['end']}:00",
        "off_peak_hours": f"{config.OFF_PEAK_HOURS['start']}:00–{config.OFF_PEAK_HOURS['end']}:00",
    }


def _query_bill_analysis() -> dict:
    reasons = [
        "Your AC ran 4 hours longer than usual this week",
        "Water heater usage during peak hours increased by 35%",
        "Ambient temperature was 3°C higher, driving cooling load up",
        "Standby power drain from 6 devices averaged 180W overnight",
    ]
    return {
        "type": "bill_analysis",
        "current_bill": round(800 + random.random() * 600, 2),
        "previous_bill": round(700 + random.random() * 400, 2),
        "primary_reasons": random.sample(reasons, min(2, len(reasons))),
    }


def _query_live_status() -> dict:
    return {
        "type": "live_status",
        "current_load_kw": round(1.5 + random.random() * 3, 2),
        "active_appliances": random.randint(3, 8),
        "current_tariff": config.TARIFF_RATES["standard"],
        "grid_status": "normal",
    }


QUERY_EXECUTORS = {
    "usage_period":  lambda q: _query_usage_period(
        re.search(r"(today|yesterday|this\s+week|last\s+week|this\s+month|last\s+month)",
                  q["raw"].lower()).group().replace(" ", "_") if re.search(
            r"(today|yesterday|this\s+week|last\s+week|this\s+month|last\s+month)",
            q["raw"].lower()) else "today"),
    "comparison":    lambda q: _query_comparison(),
    "bill_analysis": lambda q: _query_bill_analysis(),
    "peak_analysis": lambda q: _query_peak_analysis(),
    "tariff_info":   lambda q: _query_tariff_info(),
    "live_status":   lambda q: _query_live_status(),
    "optimization":  lambda q: {"type": "optimization",
                                "tips": ["Shift heavy loads to off-peak hours",
                                         "Set AC to 24°C auto mode",
                                         "Use timer on water heater"]},
    "forecast":      lambda q: {"type": "forecast", "message": "24h forecast available",
                                "best_time": "2:00 AM–5:00 AM",
                                "worst_time": "6:00 PM–9:00 PM"},
    "complaint":     lambda q: {"type": "complaint",
                                "ticket_id": f"CMP-{random.randint(10000, 99999)}",
                                "status": "initiated"},
    "history":       lambda q: {"type": "history", "months_available": 18,
                                "latest_month": "Feb 2026"},
    "general":       lambda q: {"type": "general",
                                "message": "Ask about usage, bills, tariffs, or tips."},
}


def execute_query(text: str) -> dict:
    """Parse and execute a natural language query."""
    classification = classify_query(text)
    qtype = classification["query_type"]
    executor = QUERY_EXECUTORS.get(qtype, QUERY_EXECUTORS["general"])
    data = executor(classification)
    return {"query": text, "classification": classification, "result": data}
