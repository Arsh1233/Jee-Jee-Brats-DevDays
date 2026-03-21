"""
📊 Synthetic Data Generator — Kaggle-Quality Chatbot Training Data
Generates 5,000+ intent-utterance pairs across 10 intents
with richer variation, typos, and colloquial language.
Also generates query-type training data for the chatbot query classifier.
"""

import random
import re

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config

# ── Extended utterance templates per intent (3x more variety) ────────

TEMPLATES = {
    "check_usage": [
        "What is my usage {period}?",
        "How much power did I use {period}?",
        "Show me my consumption {period}",
        "How many units have I consumed {period}?",
        "What's my electricity usage {period}?",
        "Tell me my energy consumption {period}",
        "How much kWh did I use {period}?",
        "Can you show my meter reading {period}?",
        "What's the power consumption {period}?",
        "I want to know my usage {period}",
        "Check my electricity units {period}",
        "Display my energy usage {period}",
        "My power usage {period}?",
        "Usage report {period}",
        "My electricity consumption {period}?",
        "How much electricity was consumed {period}?",
        "Total units used {period}",
        "Energy used {period}",
        "What did I consume {period}?",
        "How heavy was my usage {period}?",
        "Kitna bijli use hua {period}?",
        "Bhai {period} ka usage batao",
        "What was my reading {period}?",
        "Show energy report {period}",
    ],
    "check_bill": [
        "What's my bill amount?",
        "How much do I owe?",
        "Show me my latest bill",
        "When is my bill due?",
        "What's my pending payment?",
        "Check my electricity bill",
        "How much is this month's bill?",
        "Do I have any arrears?",
        "Show my billing details",
        "What's the total amount due?",
        "Bill summary please",
        "My invoice details",
        "Current bill status",
        "Payment due date?",
        "What do I need to pay?",
        "How much is outstanding?",
        "My due amount?",
        "Latest bill details",
        "Show me how much I owe",
        "What's pending on my bill?",
        "Mera bill kitna hai?",
        "Bill ka amount batao",
        "How much am I being charged?",
        "Give me the bill breakdown",
    ],
    "control_device": [
        "Turn {action} the {appliance}",
        "{action} the {appliance}",
        "Switch {action} my {appliance}",
        "Can you {action} the {appliance}?",
        "Please {action} the {appliance}",
        "I want to {action} the {appliance}",
        "{action} {appliance}",
        "Set {appliance} to {action}",
        "Could you {action} the {appliance} for me?",
        "Help me {action} the {appliance}",
        "Make the {appliance} {action}",
        "Is the {appliance} on? {action} it",
        "{appliance} ko {action} karo",
        "Please switch {action} {appliance}",
    ],
    "get_tips": [
        "Give me energy saving tips",
        "How can I reduce my bill?",
        "Tips to save electricity",
        "Suggest ways to save power",
        "What can I do to lower my usage?",
        "Energy saving recommendations",
        "How to optimize my consumption?",
        "Help me save on electricity",
        "Advice for reducing power costs",
        "Best practices for energy efficiency",
        "Ways to cut my electricity bill",
        "Power saving suggestions",
        "How to be more energy efficient?",
        "Reduce my electricity expenses",
        "What changes can save energy?",
        "Top suggestions for saving power",
        "How to bring down my power bill?",
        "Tips for lowering energy consumption",
        "Give me ideas to save energy",
        "What's the best way to save electricity?",
        "Bijli bachane ke tips do",
        "How to cut power costs?",
        "Recommend some energy saving tricks",
        "Smart ways to reduce electricity use",
    ],
    "file_complaint": [
        "I want to file a complaint",
        "There's a power outage in my area",
        "Report a power cut",
        "My electricity is not working",
        "I have a billing issue",
        "File a grievance",
        "Report a voltage fluctuation",
        "My meter is not working properly",
        "Complain about power quality",
        "Register a complaint about outage",
        "There's been a blackout since morning",
        "Report faulty meter reading",
        "I need to file an issue",
        "Power cut hogya hai",
        "Bijli nahi aa rahi",
        "Meter kharab hai",
        "Low voltage problem",
        "The power keeps going out",
        "There's a fault in my connection",
        "I want to report a problem",
    ],
    "compare_usage": [
        "Compare my usage this month vs last month",
        "How does my usage compare to last week?",
        "Is my consumption higher than usual?",
        "Show me the trend in my usage",
        "Compare this week with last week",
        "Has my usage increased or decreased?",
        "Usage comparison between months",
        "Am I using more power than before?",
        "Month over month comparison",
        "Show me usage differences",
        "How is my consumption trending?",
        "Is my usage going up or down?",
        "Week over week consumption change",
        "Give me a comparison of my usage",
        "Trend analysis of my electricity",
        "Any change in my usage pattern?",
    ],
    "check_tariff": [
        "What are the current tariff rates?",
        "How much per unit?",
        "What's the peak hour rate?",
        "Tell me about off-peak pricing",
        "Current electricity rate?",
        "What's the price per kWh?",
        "Slab rates for electricity",
        "Tariff schedule",
        "Rate per unit in peak hours?",
        "What are the different rate slabs?",
        "How much does electricity cost?",
        "Per unit price now?",
        "Ki rate chal raha hai?",
        "What's the cheapest time?",
        "Show me the rate card",
        "How are tariffs calculated?",
    ],
    "greet": [
        "Hello", "Hi there", "Hey", "Good morning",
        "Good afternoon", "Good evening", "Hi",
        "Namaste", "Howdy", "What's up",
        "Hey there!", "Morning!", "Yo", "Hiya",
        "Hello PowerPilot", "Hi assistant",
        "Good day", "Greetings",
    ],
    "goodbye": [
        "Bye", "Goodbye", "See you later", "Thanks, bye",
        "That's all", "Thank you", "Exit", "I'm done",
        "Good night", "Bye bye", "Later", "Take care",
        "That's it for now", "Thanks for the help",
        "All done", "Nothing else", "See ya",
    ],
    "general_query": [
        "What can you do?",
        "How does this work?",
        "Tell me about PowerPilot",
        "What services do you offer?",
        "Explain smart metering",
        "What is peak pricing?",
        "How do you calculate my bill?",
        "What appliances use the most power?",
        "Information about solar panels",
        "Tell me about renewable energy",
        "How do smart meters work?",
        "What is time-of-day pricing?",
        "What features do you have?",
        "Help me understand my dashboard",
        "How does demand response work?",
    ],
}

PERIODS = [
    "today", "yesterday", "this week", "last week",
    "this month", "last month", "this year", "last 3 months",
    "in January", "in February", "last weekend",
]
ACTIONS_ON = ["turn on", "switch on", "start", "activate", "enable"]
ACTIONS_OFF = ["turn off", "switch off", "stop", "deactivate", "disable"]

APPLIANCE_NAMES = []
for cat in config.APPLIANCE_CATALOG.values():
    for a in cat:
        APPLIANCE_NAMES.append(a["name"].lower())

# Augmentation transforms
TYPO_MAP = {
    "electricity": ["electricty", "electrcity", "elctricity"],
    "consumption": ["consumtion", "comsumption", "consumpiton"],
    "usage": ["usge", "usagee", "ussage"],
    "tariff": ["tarrif", "tarif", "tarriff"],
    "appliance": ["appliance", "appliancee", "applince"],
}


def _augment_text(text: str, rng: random.Random) -> str:
    """Apply random augmentations to create more natural variation."""
    # Random prefix
    if rng.random() > 0.7:
        prefix = rng.choice(["Hey, ", "Umm ", "So ", "Okay ", "Please ", "Can you ", ""])
        text = prefix + text[0].lower() + text[1:]

    # Random suffix
    if rng.random() > 0.8:
        suffix = rng.choice([" please", " thanks", " asap", " quickly", "?", "!!"])
        text = text.rstrip("?.!") + suffix

    # Random typo
    if rng.random() > 0.85:
        for word, typos in TYPO_MAP.items():
            if word in text.lower():
                text = text.lower().replace(word, rng.choice(typos), 1)
                break

    # Random case
    r = rng.random()
    if r > 0.8:
        text = text.lower()
    elif r > 0.95:
        text = text.upper()

    return text.strip()


def generate(count: int = None) -> list[dict]:
    """Generate enriched chatbot/voice training data."""
    if count is None:
        count = config.CHATBOT_INTENTS_COUNT

    data = []
    rng = random.Random(42)
    intents = list(TEMPLATES.keys())

    for i in range(count):
        intent = intents[i % len(intents)]
        templates = TEMPLATES[intent]
        template = templates[rng.randint(0, len(templates) - 1)]
        entities = {}

        # Fill placeholders
        if "{period}" in template:
            period = PERIODS[rng.randint(0, len(PERIODS) - 1)]
            template = template.replace("{period}", period)
            entities["time_period"] = period

        if "{appliance}" in template:
            appliance = APPLIANCE_NAMES[rng.randint(0, len(APPLIANCE_NAMES) - 1)]
            template = template.replace("{appliance}", appliance)
            entities["appliance"] = appliance

        if "{action}" in template:
            if rng.random() > 0.5:
                action = ACTIONS_ON[rng.randint(0, len(ACTIONS_ON) - 1)]
            else:
                action = ACTIONS_OFF[rng.randint(0, len(ACTIONS_OFF) - 1)]
            template = template.replace("{action}", action)
            entities["action"] = action

        # Apply augmentation
        template = _augment_text(template, rng)

        data.append({
            "id": f"CB-{i + 1:06d}",
            "intent": intent,
            "utterance": template,
            "entities": entities,
        })

    return data


# ── Query-type training data for chatbot classifier ─────────────────

QUERY_TEMPLATES = {
    "usage_period": [
        "What is my usage {period}?", "Show consumption {period}",
        "How much power used {period}?", "Energy consumed {period}",
        "My kWh {period}", "Units consumed {period}",
        "How much electricity {period}?", "Usage {period}",
        "Check my reading {period}", "Power report {period}",
        "Consumption details {period}", "Electricity used {period}",
    ],
    "comparison": [
        "Compare this month vs last month", "Usage comparison",
        "Is my usage increasing?", "Show me the trend",
        "Week over week change", "How does this compare to before?",
        "Am I using more than last month?", "Consumption trend",
        "Month over month difference", "Usage going up or down?",
        "Percentage change in consumption", "Compare periods",
    ],
    "bill_analysis": [
        "Why is my bill so high?", "Bill seems too much",
        "Reason for high bill", "What caused the bill increase?",
        "My bill is unusually high", "Why did my charges go up?",
        "Explain my high bill", "What's driving my costs up?",
        "Why am I being charged more?", "Bill spike reason",
        "What caused the increase?", "High electricity bill why?",
    ],
    "peak_analysis": [
        "When is my peak usage?", "What's the highest usage hour?",
        "Peak consumption time", "When do I use most power?",
        "Show peak hours", "Maximum usage period",
        "Which hours have highest consumption?", "Peak demand time",
        "When is demand highest?", "Top usage hours",
    ],
    "forecast": [
        "What will my usage be tomorrow?", "Forecast for next week",
        "Predict my consumption", "Expected usage tomorrow",
        "What should I expect next month?", "Future consumption estimate",
        "Demand forecast", "What will the tariff be tomorrow?",
        "Next 24 hours prediction", "Upcoming demand",
    ],
    "tariff_info": [
        "What are the tariff rates?", "Per unit cost?",
        "Current electricity price", "Rate slabs?",
        "What's the peak rate?", "Off-peak pricing?",
        "How much per kWh?", "Tariff schedule",
        "Price per unit?", "Rate card",
        "How are tariffs structured?", "Cost per unit now?",
    ],
    "optimization": [
        "How to save energy?", "Reduce my bill tips",
        "Ways to optimize usage", "Energy saving advice",
        "How to cut electricity costs?", "Efficiency tips",
        "Save power suggestions", "Lower my consumption",
        "Best time to run appliances?", "Optimal usage schedule",
        "Smart energy saving", "Reduce wastage",
    ],
    "complaint": [
        "Power outage report", "No electricity since morning",
        "File a complaint", "Meter not working",
        "Report a problem", "Power cut",
        "Voltage fluctuation issue", "Billing error complaint",
        "Service complaint", "Connection problem",
        "Register a grievance", "Report outage",
    ],
    "live_status": [
        "What's my current usage?", "Live consumption now",
        "Real-time power draw", "Current load?",
        "What's running right now?", "Active appliances?",
        "Present consumption", "Right now usage",
        "Current status", "Live reading",
    ],
    "history": [
        "Show my usage history", "Past consumption records",
        "Previous bills", "Historical data",
        "Last year's usage", "Usage over time",
        "Show past readings", "Consumption history",
        "Previous months data", "Old bills",
    ],
    "general": [
        "What can you do?", "Help",
        "How does this work?", "What services?",
        "Tell me about yourself", "What features?",
        "Explain smart metering", "What is PowerPilot?",
        "How do I use this?", "Information",
    ],
}


def generate_query_training_data(count: int = 3000) -> list[dict]:
    """Generate training data for chatbot query classifier."""
    data = []
    rng = random.Random(77)
    query_types = list(QUERY_TEMPLATES.keys())

    for i in range(count):
        qtype = query_types[i % len(query_types)]
        templates = QUERY_TEMPLATES[qtype]
        template = templates[rng.randint(0, len(templates) - 1)]

        if "{period}" in template:
            period = PERIODS[rng.randint(0, len(PERIODS) - 1)]
            template = template.replace("{period}", period)

        template = _augment_text(template, rng)

        data.append({
            "id": f"QRY-{i + 1:06d}",
            "query": template,
            "query_type": qtype,
        })

    return data
