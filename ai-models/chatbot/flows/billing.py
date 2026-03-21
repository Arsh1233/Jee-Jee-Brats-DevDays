"""
💬 Chatbot Flows — Billing conversations
Pre-defined conversation tree for billing scenarios.
"""


BILLING_FLOW = {
    "entry": {
        "message": "💰 I can help you with billing. What would you like to know?",
        "options": [
            {"label": "View current bill",     "next": "current_bill"},
            {"label": "Bill history",           "next": "bill_history"},
            {"label": "Payment options",        "next": "payment"},
            {"label": "Dispute a charge",       "next": "dispute"},
        ],
    },
    "current_bill": {
        "message": "Your latest bill is for March 2026. Would you like details?",
        "options": [
            {"label": "Show full breakdown",    "next": "breakdown"},
            {"label": "Download PDF",           "next": "download"},
            {"label": "Go back",                "next": "entry"},
        ],
    },
    "bill_history": {
        "message": "I have your bills for the last 18 months. Which period?",
        "options": [
            {"label": "Last 3 months",          "next": "history_3m"},
            {"label": "Last 6 months",          "next": "history_6m"},
            {"label": "Full history",           "next": "history_all"},
        ],
    },
    "payment": {
        "message": "You can pay via UPI, net banking, or auto-debit. Set up auto-pay?",
        "options": [
            {"label": "Yes, set up auto-pay",   "next": "autopay_setup"},
            {"label": "Pay now",                "next": "pay_now"},
            {"label": "Go back",                "next": "entry"},
        ],
    },
    "dispute": {
        "message": "To dispute a charge, I'll need the bill month and the specific charge. "
                   "A support ticket will be created automatically.",
        "options": [
            {"label": "Dispute latest bill",    "next": "dispute_latest"},
            {"label": "Dispute older bill",     "next": "dispute_old"},
            {"label": "Cancel",                 "next": "entry"},
        ],
    },
}


def get_flow():
    return BILLING_FLOW
