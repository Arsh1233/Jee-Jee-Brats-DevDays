"""
💬 Chatbot Flows — Usage analysis conversations
"""

USAGE_FLOW = {
    "entry": {
        "message": "📊 Let's look at your energy usage. What would you like to explore?",
        "options": [
            {"label": "Today's usage",         "next": "today"},
            {"label": "This week",             "next": "this_week"},
            {"label": "Monthly comparison",    "next": "comparison"},
            {"label": "Peak hours analysis",   "next": "peak"},
        ],
    },
    "today": {
        "message": "Here's your real-time usage breakdown for today.",
        "options": [
            {"label": "By appliance",         "next": "by_appliance"},
            {"label": "By hour",              "next": "by_hour"},
            {"label": "Go back",              "next": "entry"},
        ],
    },
    "comparison": {
        "message": "I'll compare your monthly usage. Which months?",
        "options": [
            {"label": "This vs last month",   "next": "this_vs_last"},
            {"label": "Last 6 months trend",  "next": "six_month_trend"},
            {"label": "Year over year",       "next": "yoy"},
        ],
    },
    "peak": {
        "message": "Peak hour analysis shows your highest consumption windows.",
        "options": [
            {"label": "Show top consumers",   "next": "top_consumers"},
            {"label": "Shift recommendations","next": "shift_recs"},
            {"label": "Go back",              "next": "entry"},
        ],
    },
}


def get_flow():
    return USAGE_FLOW
