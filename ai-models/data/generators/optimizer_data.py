"""
📊 Synthetic Data Generator — Kaggle-Quality Optimizer Training Data
Generates 20,000 consumption profiles with Kaggle-realistic distributions:
  - Seasonal patterns (summer/winter)
  - Weather-correlated consumption
  - Appliance-specific signatures
  - Labeled anomalies with realistic injection rates
  - Optimal schedules based on tariff arbitrage
"""

import random
import math
import numpy as np

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config


def _seeded_rng(seed: int) -> random.Random:
    return random.Random(seed)


# ── Kaggle-realistic demand curves ───────────────────────────────────

RESIDENTIAL_CURVE = np.array([
    0.20, 0.15, 0.12, 0.11, 0.10, 0.12, 0.25, 0.55,
    0.70, 0.62, 0.50, 0.45, 0.42, 0.40, 0.42, 0.48,
    0.55, 0.75, 0.92, 0.95, 0.88, 0.70, 0.50, 0.32,
])

COMMERCIAL_CURVE = np.array([
    0.10, 0.08, 0.07, 0.07, 0.07, 0.08, 0.15, 0.40,
    0.70, 0.88, 0.92, 0.95, 0.90, 0.88, 0.85, 0.82,
    0.78, 0.70, 0.50, 0.30, 0.20, 0.15, 0.12, 0.10,
])

INDUSTRIAL_CURVE = np.array([
    0.75, 0.72, 0.70, 0.68, 0.70, 0.72, 0.80, 0.88,
    0.92, 0.95, 0.95, 0.93, 0.90, 0.88, 0.90, 0.92,
    0.95, 0.93, 0.88, 0.85, 0.82, 0.80, 0.78, 0.76,
])

CURVES = {
    "residential": RESIDENTIAL_CURVE,
    "commercial": COMMERCIAL_CURVE,
    "industrial": INDUSTRIAL_CURVE,
}

# Seasonal factors by month (0=Jan ... 11=Dec)
SEASONAL_FACTORS = [0.80, 0.82, 0.90, 1.00, 1.15, 1.30,
                    1.35, 1.30, 1.20, 1.00, 0.90, 0.85]

# Base consumption by connection type (kWh per hour)
BASE_CONSUMPTION = {
    "residential": 1.2,
    "commercial": 3.5,
    "industrial": 12.0,
}


def generate(count: int = None) -> list[dict]:
    """Generate Kaggle-quality optimizer training profiles."""
    if count is None:
        count = config.OPTIMIZER_PROFILES_COUNT

    profiles = []
    np_rng = np.random.RandomState(42)

    for i in range(count):
        rng = _seeded_rng(i * 7919 + 42)
        conn_type = config.CONNECTION_TYPES[i % len(config.CONNECTION_TYPES)]
        catalog = config.APPLIANCE_CATALOG[conn_type]

        # Variable appliance count
        app_count = min(3 + rng.randint(0, len(catalog) - 3), len(catalog))
        appliances = [
            {"name": a["name"], "type": a["type"], "wattage": a["wattage"]}
            for a in catalog[:app_count]
        ]

        # Determine user characteristics
        month = rng.randint(0, 11)
        day_of_week = rng.randint(0, 6)
        is_weekend = day_of_week >= 5
        seasonal = SEASONAL_FACTORS[month]

        # Temperature proxy (Celsius)
        base_temp = 15 + 15 * math.sin(2 * math.pi * (month - 3) / 12)
        temperature = base_temp + np_rng.normal(0, 3)

        # Total appliance wattage affects base load
        total_wattage = sum(a["wattage"] for a in appliances)
        wattage_factor = total_wattage / 5000  # normalised

        base_kwh = BASE_CONSUMPTION[conn_type]
        curve = CURVES[conn_type]

        # Generate 24h consumption
        hourly = []
        for h in range(24):
            load = (
                base_kwh
                * curve[h]
                * seasonal
                * wattage_factor
                * (0.88 if is_weekend and conn_type == "commercial" else 1.0)
                * (1.0 + max(0, temperature - 25) * 0.02)  # cooling load
                + np_rng.normal(0, base_kwh * 0.08)  # noise
            )
            load = max(0.01, load)

            # Anomaly injection (~5%)
            is_anomaly = rng.random() > 0.95
            if is_anomaly:
                anomaly_type = rng.choice(["spike", "drop"])
                if anomaly_type == "spike":
                    load *= 2.5 + rng.random() * 2.0
                else:
                    load *= 0.05 + rng.random() * 0.1

            hourly.append({
                "hour": h,
                "kwh": round(load, 4),
                "is_anomaly": is_anomaly,
                "is_peak": config.PEAK_HOURS["start"] <= h < config.PEAK_HOURS["end"],
            })

        # Optimal schedule recommendations
        optimal_schedule = []
        for app in appliances:
            shift = config.SHIFTABILITY.get(app["type"], 0.5)
            if shift > 0.5:
                peak_cost = app["wattage"] / 1000 * config.TARIFF_RATES["peak"] * 5  # 5 peak hours
                off_peak_cost = app["wattage"] / 1000 * config.TARIFF_RATES["off_peak"] * 5
                saving = round(peak_cost - off_peak_cost, 2)
                optimal_schedule.append({
                    "appliance": app["name"],
                    "type": app["type"],
                    "recommended_hours": "0:00–6:00" if shift > 0.8 else "6:00–10:00",
                    "avoid_hours": f"{config.PEAK_HOURS['start']}:00–{config.PEAK_HOURS['end']}:00",
                    "shiftability": shift,
                    "daily_saving_rupees": saving,
                    "estimated_saving_pct": round(shift * 25, 1),
                })

        avg_daily = round(sum(h["kwh"] for h in hourly), 2)
        peak_consumption = round(sum(h["kwh"] for h in hourly if h["is_peak"]), 2)
        off_peak_consumption = round(sum(h["kwh"] for h in hourly if h["hour"] < 6), 2)

        profiles.append({
            "profile_id": f"OPT-{i + 1:06d}",
            "conn_type": conn_type,
            "appliances": appliances,
            "hourly_consumption": hourly,
            "optimal_schedule": optimal_schedule,
            "metadata": {
                "month": month,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "temperature": round(temperature, 1),
                "seasonal_factor": seasonal,
            },
            "summary": {
                "avg_daily_kwh": avg_daily,
                "peak_consumption_kwh": peak_consumption,
                "off_peak_consumption_kwh": off_peak_consumption,
                "peak_to_avg_ratio": round(peak_consumption / (avg_daily / 24 * 5) if avg_daily > 0 else 0, 3),
                "anomaly_count": sum(1 for h in hourly if h["is_anomaly"]),
                "total_appliance_wattage": total_wattage,
            },
        })

    return profiles
