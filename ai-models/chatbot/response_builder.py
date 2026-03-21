"""
💬 AI Chatbot — Response Builder
Formats raw data into rich text responses with emoji and structured output.
"""


def _format_dict(d: dict, indent: int = 0) -> str:
    """Pretty-format a dict as bullet points."""
    lines = []
    prefix = "  " * indent
    for k, v in d.items():
        if k in ("type",):
            continue
        label = k.replace("_", " ").title()
        if isinstance(v, dict):
            lines.append(f"{prefix}• {label}:")
            lines.append(_format_dict(v, indent + 1))
        elif isinstance(v, list):
            items = ", ".join(str(i) for i in v)
            lines.append(f"{prefix}• {label}: {items}")
        else:
            lines.append(f"{prefix}• {label}: {v}")
    return "\n".join(lines)


# ── Response templates by query type ─────────────────────────────────

RESPONSE_TEMPLATES = {
    "usage": lambda d: (
        f"📊 **Energy Usage Report**\n"
        f"Period: {d.get('period', 'N/A').replace('_', ' ').title()}\n"
        f"Consumption: {d.get('consumption_kwh', 0)} kWh\n"
        f"Estimated Cost: ₹{d.get('cost_rupees', 0)}\n"
        f"Rate: ₹{d.get('unit_rate', 0)}/kWh"
    ),

    "comparison": lambda d: (
        f"📈 **Usage Comparison**\n"
        f"This Month: {d.get('this_month_kwh', 0)} kWh\n"
        f"Last Month: {d.get('last_month_kwh', 0)} kWh\n"
        f"Change: {d.get('difference_kwh', 0)} kWh "
        f"({'📈 up' if d.get('trend') == 'up' else '📉 down'} {abs(d.get('percent_change', 0))}%)"
    ),

    "bill_analysis": lambda d: (
        f"💰 **Bill Analysis**\n"
        f"Current Bill: ₹{d.get('current_bill', 0):.0f}\n"
        f"Previous Bill: ₹{d.get('previous_bill', 0):.0f}\n"
        f"\n🔍 **Primary Reasons:**\n" +
        "\n".join(f"  • {r}" for r in d.get("primary_reasons", []))
    ),

    "peak_analysis": lambda d: (
        f"⚡ **Peak Usage Analysis**\n"
        f"Peak Hours: {d.get('peak_hours', 'N/A')}\n"
        f"Peak Consumption: {d.get('peak_consumption_kwh', 0)} kWh\n"
        f"Peak Tariff: ₹{d.get('peak_tariff', 0)}/kWh\n"
        f"Top Consumers: {', '.join(d.get('top_appliances', []))}"
    ),

    "tariff": lambda d: (
        f"💡 **Tariff Information**\n"
        f"Off-Peak ({d.get('off_peak_hours', '')}): ₹{d.get('rates', {}).get('off_peak', 0)}/kWh\n"
        f"Standard: ₹{d.get('rates', {}).get('standard', 0)}/kWh\n"
        f"Peak ({d.get('peak_hours', '')}): ₹{d.get('rates', {}).get('peak', 0)}/kWh"
    ),

    "live_status": lambda d: (
        f"🔴 **Live Status**\n"
        f"Current Load: {d.get('current_load_kw', 0)} kW\n"
        f"Active Appliances: {d.get('active_appliances', 0)}\n"
        f"Tariff: ₹{d.get('current_tariff', 0)}/kWh\n"
        f"Grid: {d.get('grid_status', 'unknown').upper()}"
    ),

    "optimization": lambda d: (
        f"🧠 **Optimisation Tips**\n" +
        "\n".join(f"  💡 {t}" for t in d.get("tips", []))
    ),

    "forecast": lambda d: (
        f"🔮 **Forecast**\n"
        f"{d.get('message', '')}\n"
        f"Best Time for Heavy Loads: {d.get('best_time', '')}\n"
        f"Avoid: {d.get('worst_time', '')}"
    ),

    "complaint": lambda d: (
        f"📝 **Complaint Registered**\n"
        f"Ticket: {d.get('ticket_id', '')}\n"
        f"Status: {d.get('status', '').upper()}"
    ),

    "history": lambda d: (
        f"📚 **Usage History**\n"
        f"Data available for: {d.get('months_available', 0)} months\n"
        f"Latest: {d.get('latest_month', 'N/A')}"
    ),
}


def build_response(query_result: dict) -> dict:
    """
    Build a rich text response from query engine output.
    Args:
        query_result: output from query_engine.execute_query()
    Returns:
        dict with formatted_text, raw_data, suggestions
    """
    data = query_result.get("result", {})
    qtype = data.get("type", "general")

    template = RESPONSE_TEMPLATES.get(qtype)
    if template:
        formatted_text = template(data)
    else:
        formatted_text = f"ℹ️ {data.get('message', 'Here is what I found:')}\n\n{_format_dict(data)}"

    # Contextual suggestions
    suggestions_map = {
        "usage":         ["Compare with last month", "Get saving tips", "View peak hours"],
        "comparison":    ["Why did usage change?", "Get optimisation tips", "View daily breakdown"],
        "bill_analysis": ["Get saving tips", "Compare months", "File complaint"],
        "peak_analysis": ["Shift appliance schedules", "Check tariff", "View forecast"],
        "tariff":        ["When is cheapest?", "Check my usage", "Get tips"],
        "live_status":   ["View forecast", "Check bill", "Control device"],
        "optimization":  ["Apply suggestions", "Check savings", "Compare usage"],
        "forecast":      ["View tariff rates", "Check usage", "Optimise schedule"],
        "complaint":     ["Track complaint", "Contact support", "View status"],
        "history":       ["View this month", "Compare periods", "Download report"],
    }

    return {
        "formatted_text": formatted_text,
        "raw_data": data,
        "suggestions": suggestions_map.get(qtype, ["Check usage", "View bill", "Get tips"]),
    }
