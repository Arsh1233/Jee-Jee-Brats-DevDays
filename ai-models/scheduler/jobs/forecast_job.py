"""
📈 Forecast Job — 24h demand & tariff forecasting.
Generates hourly predictions using historical pattern analysis.
"""

import random
import math
from datetime import datetime, timezone, timedelta

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config

_latest_forecast = None

# Base demand curve by hour (normalised 0–1)
DEMAND_CURVE = [
    0.35, 0.30, 0.28, 0.27, 0.26, 0.28, 0.38, 0.55,
    0.68, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.85,
    0.88, 0.92, 0.95, 0.90, 0.82, 0.70, 0.55, 0.42,
]


def generate_forecast() -> dict:
    """Generate a 24-hour demand & tariff forecast."""
    global _latest_forecast
    now = datetime.now(timezone.utc)
    current_hour = now.hour

    entries = []
    for i in range(24):
        hour = (current_hour + i) % 24
        timestamp = (now + timedelta(hours=i)).isoformat()

        # Tariff period
        if config.PEAK_HOURS["start"] <= hour < config.PEAK_HOURS["end"]:
            tariff_rate = config.TARIFF_RATES["peak"]
            tariff_period = "peak"
        elif config.OFF_PEAK_HOURS["start"] <= hour < config.OFF_PEAK_HOURS["end"]:
            tariff_rate = config.TARIFF_RATES["off_peak"]
            tariff_period = "off_peak"
        else:
            tariff_rate = config.TARIFF_RATES["standard"]
            tariff_period = "standard"

        # Demand with noise
        base_demand = DEMAND_CURVE[hour] * 100  # MW
        noise = (random.random() - 0.5) * 8
        predicted_mw = round(base_demand + noise, 2)

        # Grid load
        grid_load = round(DEMAND_CURVE[hour] * 100 + (random.random() - 0.5) * 5, 1)

        # Renewable contribution (higher during day)
        renewable = (round(15 + random.random() * 20, 1) if 6 <= hour <= 18
                     else round(2 + random.random() * 5, 1))

        recommendation = (
            "Reduce consumption — high tariff period" if tariff_period == "peak"
            else "Ideal time for heavy loads — lowest tariff" if tariff_period == "off_peak"
            else "Standard rates — normal operations"
        )

        entries.append({
            "hour": hour,
            "timestamp": timestamp,
            "tariff_rate": tariff_rate,
            "tariff_period": tariff_period,
            "predicted_demand_mw": predicted_mw,
            "grid_load_percent": grid_load,
            "renewable_percent": renewable,
            "recommendation": recommendation,
        })

    _latest_forecast = {
        "generated_at": now.isoformat(),
        "horizon_hours": 24,
        "entries": entries,
    }
    return _latest_forecast


def run():
    """Job entry point."""
    forecast = generate_forecast()
    print(f"[ForecastJob] 📊 Generated 24h forecast starting at hour "
          f"{datetime.now().hour}:00")
    return forecast


def get_latest_forecast():
    return _latest_forecast
