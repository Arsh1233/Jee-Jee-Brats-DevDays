"""
📊 Synthetic Data Generator — Voice Command Training Data (Upgraded)
3,000+ voice transcripts with:
  - Informal spoken language
  - Filler words/hesitations
  - Partial sentences
  - Regional language mixing (Hindi-English)
  - Multiple phrasing variations
"""

import random

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config

VOICE_TEMPLATES = {
    "check_usage": [
        "how much electricity did I use {period}",
        "what's my power consumption {period}",
        "tell me my usage {period}",
        "usage {period}",
        "my consumption {period}",
        "kWh used {period}",
        "show usage {period}",
        "how many units {period}",
        "electricity {period}",
        "power usage {period} please",
        "can you check my usage {period}",
        "tell me consumption {period}",
        "{period} ka usage batao",
        "kitna bijli laga {period}",
        "meter reading {period}",
        "how much energy {period}",
        "total units {period}",
        "get my usage for {period}",
    ],
    "check_bill": [
        "how much is my bill",
        "what do I owe",
        "bill amount",
        "my latest bill",
        "when is payment due",
        "show bill",
        "pending amount",
        "any dues",
        "what's the bill",
        "tell me my bill please",
        "bill kitna hai",
        "mera bill",
        "how much should I pay",
        "payment amount",
        "outstanding balance",
        "due amount",
        "total charges",
        "last bill amount",
    ],
    "control_device": [
        "{action} {appliance}",
        "{action} the {appliance}",
        "can you {action} {appliance}",
        "please {action} the {appliance}",
        "hey {action} my {appliance}",
        "I need to {action} the {appliance}",
        "could you {action} {appliance} for me",
        "{appliance} {action} karo",
        "{appliance} ko {action}",
        "just {action} the {appliance}",
        "quickly {action} {appliance}",
        "please {action} {appliance} now",
    ],
    "get_tips": [
        "how to save electricity",
        "give me some tips",
        "saving tips",
        "how to reduce my bill",
        "any suggestions to save power",
        "energy tips",
        "how can I cut costs",
        "tips please",
        "help me save",
        "what should I do to save",
        "bijli kaise bachaye",
        "energy saving ideas",
        "reduce power consumption",
        "efficient usage tips",
        "money saving tips for electricity",
        "how to lower usage",
    ],
    "file_complaint": [
        "there's no power",
        "power cut in my area",
        "no electricity since morning",
        "I want to complain",
        "register a complaint",
        "outage report",
        "power is gone",
        "light nahi aa rahi",
        "bijli gayi hui hai",
        "file complaint",
        "voltage bahut low hai",
        "meter not working",
        "transformer problem",
        "frequent power cuts",
        "no light since yesterday",
        "report a fault",
    ],
    "compare_usage": [
        "compare this month and last month",
        "is my usage going up",
        "usage trend",
        "compare",
        "more or less than last month",
        "how's the trend",
        "am I using more power now",
        "monthly comparison",
        "week to week change",
        "difference between months",
        "consumption increasing or decreasing",
        "usage badh raha hai ya kam",
    ],
    "check_tariff": [
        "what's the rate",
        "per unit cost",
        "tariff rate",
        "how much per kWh",
        "peak hour price",
        "what are the rates",
        "slab rate",
        "price per unit",
        "ek unit ka kitna",
        "rate kya hai abhi",
        "cheapest time for electricity",
        "rate card",
    ],
    "greet": [
        "hello", "hi", "hey there", "good morning",
        "good evening", "namaste", "yo", "hiya",
        "hey PowerPilot", "hi there assistant",
        "hello ji", "kya haal hai",
    ],
    "goodbye": [
        "bye", "thanks bye", "goodbye", "see ya",
        "that's it", "done", "thank you bye", "alright bye",
        "bas ho gaya", "theek hai bye", "chalo bye",
        "thanks for help bye",
    ],
    "general_query": [
        "what can you do",
        "help",
        "how does this work",
        "what are you",
        "explain",
        "tell me about this app",
        "what services",
        "how do I use this",
        "kya features hai",
        "ye kya karta hai",
    ],
}

PERIODS = [
    "today", "yesterday", "this week", "last week",
    "this month", "last month", "last 3 days",
    "this year", "since Monday", "past 7 days",
]
ACTIONS = [
    "turn on", "turn off", "switch on", "switch off",
    "start", "stop", "enable", "disable",
]

APPLIANCES = []
for cat in config.APPLIANCE_CATALOG.values():
    for a in cat:
        APPLIANCES.append(a["name"].lower())

FILLERS = ["", "", "", "umm ", "uh ", "hey ", "okay ", "so ", "well ",
           "actually ", "basically ", "like ", ""]


def generate(count: int = None) -> list[dict]:
    """Generate 3K+ voice command training transcripts."""
    if count is None:
        count = config.VOICE_COMMANDS_COUNT

    data = []
    rng = random.Random(99)
    intents = list(VOICE_TEMPLATES.keys())

    for i in range(count):
        intent = intents[i % len(intents)]
        templates = VOICE_TEMPLATES[intent]
        template = templates[rng.randint(0, len(templates) - 1)]
        entities = {}

        if "{period}" in template:
            period = PERIODS[rng.randint(0, len(PERIODS) - 1)]
            template = template.replace("{period}", period)
            entities["time_period"] = period

        if "{appliance}" in template:
            appliance = APPLIANCES[rng.randint(0, len(APPLIANCES) - 1)]
            template = template.replace("{appliance}", appliance)
            entities["appliance"] = appliance

        if "{action}" in template:
            action = ACTIONS[rng.randint(0, len(ACTIONS) - 1)]
            template = template.replace("{action}", action)
            entities["action"] = action

        # Voice-specific augmentation
        filler = FILLERS[rng.randint(0, len(FILLERS) - 1)]
        has_filler = bool(filler)
        transcript = filler + template

        # Partial sentence (~8%)
        is_partial = False
        if rng.random() > 0.92:
            words = transcript.split()
            if len(words) > 2:
                transcript = " ".join(words[:-1])
                is_partial = True

        # Repetition (~5%)
        has_repetition = False
        if rng.random() > 0.95:
            words = transcript.split()
            if len(words) > 1:
                idx = rng.randint(0, len(words) - 1)
                words.insert(idx, words[idx])
                transcript = " ".join(words)
                has_repetition = True

        # Case variation
        r = rng.random()
        if r > 0.6:
            transcript = transcript.lower()
        elif r > 0.92:
            transcript = transcript.upper()

        data.append({
            "id": f"VC-{i + 1:06d}",
            "transcript": transcript.strip(),
            "intent": intent,
            "entities": entities,
            "has_filler": has_filler,
            "is_partial": is_partial,
            "has_repetition": has_repetition,
        })

    return data
