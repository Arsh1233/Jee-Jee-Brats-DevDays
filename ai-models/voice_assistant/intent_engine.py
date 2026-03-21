"""
🎙️ AI Voice Assistant — Intent Engine
TF-IDF-inspired intent classifier trained on keyword patterns.
Classifies user transcripts into intents and extracts entities.
"""

import re
from collections import defaultdict

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

# ── Intent keyword patterns (weighted) ───────────────────────────────

INTENT_KEYWORDS: dict[str, list[tuple[str, float]]] = {
    "check_usage": [
        ("usage", 1.0), ("consumption", 1.0), ("how much", 0.8), ("power", 0.7),
        ("energy", 0.7), ("electricity", 0.6), ("used", 0.6), ("kwh", 0.9),
        ("units", 0.7), ("meter", 0.5), ("reading", 0.5), ("today", 0.4),
        ("this month", 0.4), ("last month", 0.4), ("yesterday", 0.4),
    ],
    "check_bill": [
        ("bill", 1.0), ("billing", 0.9), ("payment", 0.8), ("due", 0.7),
        ("amount", 0.7), ("rupees", 0.6), ("cost", 0.6), ("charge", 0.5),
        ("invoice", 0.8), ("pay", 0.6), ("pending", 0.5), ("arrears", 0.7),
    ],
    "control_device": [
        ("turn on", 1.0), ("turn off", 1.0), ("switch on", 1.0), ("switch off", 1.0),
        ("start", 0.6), ("stop", 0.6), ("activate", 0.8), ("deactivate", 0.8),
        ("enable", 0.7), ("disable", 0.7), ("set", 0.4), ("temperature", 0.5),
    ],
    "get_tips": [
        ("tips", 1.0), ("advice", 0.9), ("suggest", 0.9), ("recommendation", 0.9),
        ("save", 0.7), ("saving", 0.8), ("reduce", 0.7), ("optimize", 0.8),
        ("improve", 0.6), ("efficient", 0.7), ("help me", 0.5), ("how can i", 0.5),
    ],
    "file_complaint": [
        ("complaint", 1.0), ("complain", 1.0), ("issue", 0.7), ("problem", 0.7),
        ("outage", 0.9), ("not working", 0.8), ("broken", 0.7), ("fault", 0.7),
        ("report", 0.6), ("grievance", 0.8), ("power cut", 0.9), ("blackout", 0.8),
    ],
    "compare_usage": [
        ("compare", 1.0), ("comparison", 1.0), ("vs", 0.8), ("versus", 0.8),
        ("difference", 0.7), ("more than", 0.6), ("less than", 0.6), ("increased", 0.7),
        ("decreased", 0.7), ("trend", 0.6), ("month", 0.4), ("week", 0.4),
    ],
    "check_tariff": [
        ("tariff", 1.0), ("rate", 0.8), ("price", 0.7), ("per unit", 0.8),
        ("cost per", 0.7), ("peak", 0.6), ("off-peak", 0.7), ("slab", 0.8),
    ],
    "greet": [
        ("hello", 1.0), ("hi", 1.0), ("hey", 0.9), ("good morning", 1.0),
        ("good evening", 1.0), ("good afternoon", 1.0), ("howdy", 0.8), ("namaste", 1.0),
    ],
    "goodbye": [
        ("bye", 1.0), ("goodbye", 1.0), ("see you", 0.9), ("later", 0.6),
        ("thanks", 0.5), ("thank you", 0.6), ("that's all", 0.8), ("exit", 0.7),
    ],
    "general_query": [
        ("what", 0.3), ("how", 0.3), ("when", 0.3), ("where", 0.3),
        ("why", 0.3), ("tell me", 0.4), ("explain", 0.4), ("info", 0.5),
    ],
}

# ── Entity patterns ──────────────────────────────────────────────────

APPLIANCE_NAMES = set()
for cat in config.APPLIANCE_CATALOG.values():
    for app in cat:
        APPLIANCE_NAMES.add(app["name"].lower())

# Common aliases → canonical catalog name
APPLIANCE_ALIASES = {
    "light": "lights",
    "lamp": "lights",
    "bulb": "lights",
    "kitchen light": "lights",
    "bedroom light": "lights",
    "bathroom light": "lights",
    "hall light": "lights",
    "tube light": "lights",
    "tubelight": "lights",
    "fridge": "refrigerator",
    "air conditioner": "ac",
    "air conditioning": "ac",
    "a.c.": "ac",
    "a.c": "ac",
    "television": "tv",
    "tele": "tv",
    "geyser": "water heater",
    "boiler": "water heater",
    "heater": "water heater",
    "oven": "microwave",
    "grinder": "mixer/grinder",
    "mixer": "mixer/grinder",
    "washer": "washing machine",
    "washing": "washing machine",
    "ceiling fan": "fan",
    "table fan": "fan",
    "press": "iron",
}

TIME_PATTERNS = {
    "today": r"\btoday\b",
    "yesterday": r"\byesterday\b",
    "this_week": r"\bthis\s+week\b",
    "last_week": r"\blast\s+week\b",
    "this_month": r"\bthis\s+month\b",
    "last_month": r"\blast\s+month\b",
}


def extract_entities(text: str) -> dict:
    """Extract appliance names, time references, and device actions from text."""
    lower = text.lower()
    entities = {"appliances": [], "time_period": None, "action": None}

    # Appliance extraction — check multi-word aliases first (longest match wins)
    matched_appliance = None

    # 1) Try aliases first, sorted longest-first to avoid partial matches
    for alias in sorted(APPLIANCE_ALIASES.keys(), key=len, reverse=True):
        if re.search(r'\b' + re.escape(alias) + r'\b', lower):
            matched_appliance = APPLIANCE_ALIASES[alias]
            break

    # 2) If no alias matched, try exact catalog names (word-boundary match)
    if not matched_appliance:
        for name in sorted(APPLIANCE_NAMES, key=len, reverse=True):
            if re.search(r'\b' + re.escape(name) + r'\b', lower):
                matched_appliance = name
                break

    if matched_appliance:
        entities["appliances"].append(matched_appliance)

    # Time extraction
    for period, pattern in TIME_PATTERNS.items():
        if re.search(pattern, lower):
            entities["time_period"] = period
            break

    # Action extraction for device control
    if re.search(r'\b(turn\s*off|switch\s*off|shut\s*off|deactivate|disable|stop)\b', lower):
        entities["action"] = "off"
    elif re.search(r'\b(turn\s*on|switch\s*on|activate|enable|start)\b', lower):
        entities["action"] = "on"

    return entities


def classify_intent(text: str) -> dict:
    """
    Classify a user transcript into an intent with confidence score.
    Uses ML classifier as primary; falls back to keyword matching.
    Returns:
        dict with intent, confidence, entities, all_scores, method
    """
    # ── Try ML classifier first ──────────────────────────────────
    try:
        from voice_assistant.ml_intent_classifier import IntentClassifier
        ml_clf = IntentClassifier()
        if ml_clf.load():
            ml_result = ml_clf.predict(text)
            if ml_result["confidence"] >= config.CONFIDENCE_THRESHOLD:
                entities = extract_entities(text)
                return {
                    "intent": ml_result["intent"],
                    "confidence": round(ml_result["confidence"], 3),
                    "entities": entities,
                    "all_scores": ml_result["all_scores"],
                    "method": "ml_svm",
                }
    except Exception:
        pass  # Fall through to keyword matching

    # ── Keyword fallback ─────────────────────────────────────────
    lower = text.lower().strip()
    scores: dict[str, float] = defaultdict(float)

    for intent, keywords in INTENT_KEYWORDS.items():
        for keyword, weight in keywords:
            if keyword in lower:
                scores[intent] += weight

    # Normalise scores
    max_score = max(scores.values()) if scores else 0
    if max_score > 0:
        for intent in scores:
            scores[intent] = round(scores[intent] / max_score, 3)

    # Pick top intent
    if scores:
        best_intent = max(scores, key=scores.get)
        confidence = scores[best_intent]
    else:
        best_intent = "general_query"
        confidence = 0.1

    # Apply threshold
    if confidence < config.CONFIDENCE_THRESHOLD:
        best_intent = "general_query"

    # Extract entities
    entities = extract_entities(text)

    return {
        "intent": best_intent,
        "confidence": round(confidence, 3),
        "entities": entities,
        "all_scores": dict(scores),
        "method": "keyword",
    }
