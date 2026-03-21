"""
🎙️ AI Voice Assistant — Command Handlers
Each handler processes a specific intent and returns a structured response.
"""

import random
from datetime import datetime

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config


def _sim_kwh(period: str = "today") -> float:
    """Simulate consumption for a time period."""
    base = {"today": 8, "yesterday": 9, "this_week": 52,
            "last_week": 55, "this_month": 210, "last_month": 230}
    return round(base.get(period, 8) * (0.85 + random.random() * 0.3), 2)


def _sim_bill() -> dict:
    return {
        "amount": round(800 + random.random() * 600, 2),
        "due_date": "20th March 2026",
        "units": round(150 + random.random() * 100),
        "arrears": round(random.random() * 50, 2) if random.random() > 0.7 else 0,
    }


# ── Handlers ─────────────────────────────────────────────────────────

def handle_check_usage(entities: dict) -> dict:
    period = entities.get("time_period") or "today"
    kwh = _sim_kwh(period)
    cost = round(kwh * config.TARIFF_RATES["standard"], 2)
    return {
        "text": f"📊 Your {period.replace('_', ' ')} consumption is {kwh} kWh, "
                f"costing approximately ₹{cost}.",
        "data": {"period": period, "kwh": kwh, "cost_rupees": cost},
        "suggestions": ["Compare with last month", "Get saving tips", "Check my bill"],
    }


def handle_check_bill(entities: dict) -> dict:
    bill = _sim_bill()
    status = "⚠️ Overdue" if random.random() > 0.8 else "✅ On time"
    return {
        "text": f"💰 Your latest bill is ₹{bill['amount']:.0f} for {bill['units']} units. "
                f"Due: {bill['due_date']}. Status: {status}.",
        "data": bill,
        "suggestions": ["Pay now", "View bill history", "Download bill PDF"],
    }


def handle_control_device(entities: dict) -> dict:
    appliances = entities.get("appliances", [])
    if not appliances:
        return {
            "text": "🔌 Which device would you like to control? "
                    "You can say something like 'Turn off the AC'.",
            "data": {"available": [a["name"] for a in config.APPLIANCE_CATALOG["residential"]]},
            "suggestions": ["Turn off AC", "Turn on fan", "Switch off water heater"],
        }
    device = appliances[0].title()
    # Detect intended action from entities or default to toggle
    raw_action = entities.get("action", "toggle")
    if raw_action in ("on", "turn_on", "switch_on", "activate", "enable", "start"):
        action = "on"
        action_text = "turned on"
    elif raw_action in ("off", "turn_off", "switch_off", "deactivate", "disable", "stop"):
        action = "off"
        action_text = "turned off"
    else:
        action = "toggle"
        action_text = "toggled"
    return {
        "text": f"✅ {device} has been {action_text} successfully.",
        "data": {"device": device, "action": action, "timestamp": datetime.now().isoformat()},
        "suggestions": ["Check usage now", "Set a schedule", "Control another device"],
    }


def handle_get_tips(entities: dict) -> dict:
    tips = [
        "💡 Run your washing machine during off-peak hours (12 AM–6 AM) to save up to ₹15/day.",
        "❄️ Set your AC to 24°C instead of 20°C — saves ~30% cooling energy.",
        "🔥 Use a timer on your water heater — 15 mins is enough for a shower.",
        "🌙 Switch off standby appliances at night — saves ₹200–500/month.",
        "⚡ Replace old appliances with 5-star rated ones for long-term savings.",
        "🕐 Pre-cool your home before peak hours (5–10 PM) when tariff is highest.",
    ]
    selected = random.sample(tips, min(3, len(tips)))
    return {
        "text": "Here are some personalised energy-saving tips:\n\n" + "\n".join(selected),
        "data": {"tips": selected},
        "suggestions": ["More tips", "Apply suggestions", "Check my savings"],
    }


def handle_file_complaint(entities: dict) -> dict:
    ticket_id = f"CMP-{random.randint(10000, 99999)}"
    return {
        "text": f"📝 I've initiated a complaint for you. "
                f"Ticket ID: {ticket_id}. "
                f"Our team will respond within 24 hours.",
        "data": {"ticket_id": ticket_id, "status": "open",
                 "created_at": datetime.now().isoformat()},
        "suggestions": ["Track complaint", "Call support", "Check status"],
    }


def handle_compare_usage(entities: dict) -> dict:
    this_month = _sim_kwh("this_month")
    last_month = _sim_kwh("last_month")
    diff = round(this_month - last_month, 2)
    pct = round(diff / last_month * 100, 1) if last_month else 0
    trend = "📈 increased" if diff > 0 else "📉 decreased"
    return {
        "text": f"This month: {this_month} kWh vs Last month: {last_month} kWh. "
                f"Your usage has {trend} by {abs(pct)}%.",
        "data": {"this_month": this_month, "last_month": last_month,
                 "difference": diff, "percent_change": pct},
        "suggestions": ["Why did usage increase?", "Get saving tips", "View daily breakdown"],
    }


def handle_check_tariff(entities: dict) -> dict:
    rates = config.TARIFF_RATES
    return {
        "text": f"⚡ Current tariff rates:\n"
                f"  • Off-peak (12 AM–6 AM): ₹{rates['off_peak']}/kWh\n"
                f"  • Standard (6 AM–5 PM, 10 PM–12 AM): ₹{rates['standard']}/kWh\n"
                f"  • Peak (5 PM–10 PM): ₹{rates['peak']}/kWh",
        "data": rates,
        "suggestions": ["When is the cheapest time?", "Compare my usage", "Get tips"],
    }


def handle_greet(entities: dict) -> dict:
    hour = datetime.now().hour
    greeting = "Good morning" if hour < 12 else "Good afternoon" if hour < 17 else "Good evening"
    return {
        "text": f"{greeting}! 👋 I'm your PowerPilot AI assistant. "
                f"How can I help you today?",
        "data": {},
        "suggestions": ["Check my usage", "View my bill", "Get saving tips"],
    }


def handle_goodbye(entities: dict) -> dict:
    return {
        "text": "Goodbye! 👋 Have a great day. I'm always here if you need help "
                "with your energy management.",
        "data": {},
        "suggestions": [],
    }


def handle_general_query(entities: dict) -> dict:
    return {
        "text": "🤔 I'm not sure I understood that. I can help you with:\n"
                "  • Checking your energy usage\n"
                "  • Viewing your bills\n"
                "  • Controlling your devices\n"
                "  • Getting saving tips\n"
                "  • Filing complaints",
        "data": {},
        "suggestions": ["Check my usage", "View my bill", "Get tips"],
    }


# ── Handler registry ─────────────────────────────────────────────────

HANDLER_MAP = {
    "check_usage": handle_check_usage,
    "check_bill": handle_check_bill,
    "control_device": handle_control_device,
    "get_tips": handle_get_tips,
    "file_complaint": handle_file_complaint,
    "compare_usage": handle_compare_usage,
    "check_tariff": handle_check_tariff,
    "greet": handle_greet,
    "goodbye": handle_goodbye,
    "general_query": handle_general_query,
}
