"""
💬 Chatbot Flows — Complaint filing & status
"""

COMPLAINTS_FLOW = {
    "entry": {
        "message": "📝 I can help you file or track a complaint. What do you need?",
        "options": [
            {"label": "File new complaint",    "next": "new_complaint"},
            {"label": "Track existing",        "next": "track"},
            {"label": "Escalate",              "next": "escalate"},
        ],
    },
    "new_complaint": {
        "message": "What type of issue are you experiencing?",
        "options": [
            {"label": "Power outage",          "next": "outage"},
            {"label": "Voltage fluctuation",   "next": "voltage"},
            {"label": "Meter issue",           "next": "meter"},
            {"label": "Billing error",         "next": "billing_error"},
            {"label": "Other",                 "next": "other"},
        ],
    },
    "track": {
        "message": "Please provide your complaint ticket ID (e.g. CMP-12345).",
        "options": [
            {"label": "I don't have my ticket ID", "next": "find_ticket"},
            {"label": "Go back",                   "next": "entry"},
        ],
    },
    "escalate": {
        "message": "I'll escalate your complaint to a senior representative. "
                   "Expected response time: 4 hours.",
        "options": [
            {"label": "Confirm escalation",    "next": "escalated"},
            {"label": "Cancel",                "next": "entry"},
        ],
    },
}


def get_flow():
    return COMPLAINTS_FLOW
