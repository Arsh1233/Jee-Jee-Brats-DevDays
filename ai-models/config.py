"""
AI Models — Shared Configuration
All constants, thresholds, and tuning knobs live here.
This module is standalone — no imports from backend/ or mobile/.
"""

APP_NAME = "PowerPilot AI Engine"
VERSION = "2.0.0"

# ── Optimizer ────────────────────────────────────────────────────────

ANOMALY_Z_THRESHOLD = 2.0
TOP_SUGGESTIONS = 5
BATCH_SIZE = 50
STRATEGIES = ["peak_shaving", "load_balancing", "cost_minimization"]

TARIFF_RATES = {
    "off_peak":  3.5,   # ₹/kWh  (00:00–06:00)
    "standard":  5.5,   # ₹/kWh  (06:00–17:00, 22:00–00:00)
    "peak":      8.5,   # ₹/kWh  (17:00–22:00)
}

PEAK_HOURS     = {"start": 17, "end": 22}
OFF_PEAK_HOURS = {"start": 0,  "end": 6}

SHIFTABILITY = {
    "heating":       0.95,
    "cooling":       0.75,
    "appliance":     0.85,
    "motor":         0.60,
    "lighting":      0.40,
    "entertainment": 0.30,
    "office":        0.20,
    "machinery":     0.50,
}

# ── Scheduler ────────────────────────────────────────────────────────

OPTIMIZER_INTERVAL_SEC  = 5 * 60      # 5 minutes
FORECAST_INTERVAL_SEC   = 60 * 60     # 1 hour
ALERT_INTERVAL_SEC      = 2 * 60      # 2 minutes

# ── Voice Assistant ──────────────────────────────────────────────────

INTENTS = [
    "check_usage", "check_bill", "control_device",
    "get_tips", "file_complaint", "general_query",
    "compare_usage", "check_tariff", "greet", "goodbye",
]
CONFIDENCE_THRESHOLD = 0.35

# ── Chatbot ──────────────────────────────────────────────────────────

MAX_CONTEXT_TURNS   = 10
SESSION_TIMEOUT_SEC = 30 * 60   # 30 minutes

# ── Synthetic Data Generation ────────────────────────────────────────

OPTIMIZER_PROFILES_COUNT = 20_000
CHATBOT_INTENTS_COUNT    = 5_000
VOICE_COMMANDS_COUNT     = 3_000
QUERY_TRAINING_COUNT     = 3_000

CONNECTION_TYPES = ["residential", "commercial", "industrial"]

APPLIANCE_CATALOG = {
    "residential": [
        {"name": "Refrigerator",    "type": "cooling",       "wattage": 150},
        {"name": "AC",              "type": "cooling",       "wattage": 1500},
        {"name": "Fan",             "type": "cooling",       "wattage": 75},
        {"name": "TV",              "type": "entertainment", "wattage": 120},
        {"name": "Washing Machine", "type": "appliance",     "wattage": 500},
        {"name": "Water Heater",    "type": "heating",       "wattage": 2000},
        {"name": "Microwave",       "type": "appliance",     "wattage": 800},
        {"name": "Lights",          "type": "lighting",      "wattage": 60},
        {"name": "Iron",            "type": "appliance",     "wattage": 1000},
        {"name": "Mixer/Grinder",   "type": "appliance",     "wattage": 750},
    ],
    "commercial": [
        {"name": "HVAC System",     "type": "cooling",   "wattage": 5000},
        {"name": "Computers",       "type": "office",    "wattage": 800},
        {"name": "Server Rack",     "type": "office",    "wattage": 1200},
        {"name": "Lighting Array",  "type": "lighting",  "wattage": 400},
        {"name": "Elevator",        "type": "appliance", "wattage": 7500},
        {"name": "Coffee Machine",  "type": "appliance", "wattage": 1000},
    ],
    "industrial": [
        {"name": "Motor Drive 1",   "type": "motor",     "wattage": 15000},
        {"name": "Motor Drive 2",   "type": "motor",     "wattage": 12000},
        {"name": "Compressor",      "type": "motor",     "wattage": 8000},
        {"name": "Press Machine",   "type": "machinery", "wattage": 20000},
        {"name": "HVAC Industrial", "type": "cooling",   "wattage": 10000},
        {"name": "Lighting Grid",   "type": "lighting",  "wattage": 2000},
    ],
}
