"""
💬 Chatbot Flows — Optimization Q&A
"""

OPTIMIZATION_FLOW = {
    "entry": {
        "message": "🧠 Let me help you optimize your energy usage. What interests you?",
        "options": [
            {"label": "Personalised tips",         "next": "tips"},
            {"label": "Schedule optimisation",      "next": "schedule"},
            {"label": "Appliance efficiency",       "next": "efficiency"},
            {"label": "Solar/renewable options",    "next": "renewable"},
        ],
    },
    "tips": {
        "message": "Based on your usage patterns, here are your top 3 savings opportunities.",
        "options": [
            {"label": "Apply all suggestions",    "next": "apply_all"},
            {"label": "Tell me more",             "next": "details"},
            {"label": "Go back",                  "next": "entry"},
        ],
    },
    "schedule": {
        "message": "I can create an optimal appliance schedule based on tariff rates. "
                   "Shall I generate one?",
        "options": [
            {"label": "Yes, generate schedule",   "next": "gen_schedule"},
            {"label": "Show tariff windows",      "next": "tariff_windows"},
            {"label": "Go back",                  "next": "entry"},
        ],
    },
    "efficiency": {
        "message": "I'll rate your appliances by energy efficiency and suggest replacements.",
        "options": [
            {"label": "Show ratings",             "next": "show_ratings"},
            {"label": "Replacement suggestions",  "next": "replacements"},
            {"label": "Go back",                  "next": "entry"},
        ],
    },
    "renewable": {
        "message": "Based on your location and consumption, here are renewable options.",
        "options": [
            {"label": "Rooftop solar estimate",   "next": "solar"},
            {"label": "Green tariff plans",        "next": "green_plans"},
            {"label": "Go back",                   "next": "entry"},
        ],
    },
}


def get_flow():
    return OPTIMIZATION_FLOW
