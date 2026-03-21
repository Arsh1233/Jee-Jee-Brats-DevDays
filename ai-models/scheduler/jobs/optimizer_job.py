"""
🔄 Optimizer Job — Periodic full-fleet optimisation sweep.
Generates synthetic user profiles and runs the AI optimizer on them.
"""

import random
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
import config
from optimizer.engine import run_autonomous_batch


def _generate_batch_profiles(batch_size: int = 10) -> list[dict]:
    """Generate a small batch of synthetic user profiles for autonomous processing."""
    profiles = []
    for i in range(batch_size):
        conn_type = config.CONNECTION_TYPES[i % len(config.CONNECTION_TYPES)]
        catalog = config.APPLIANCE_CATALOG[conn_type]
        count = min(3 + random.randint(0, len(catalog) - 3), len(catalog))
        appliances = catalog[:count]

        hourly = []
        for h in range(24):
            base = (5 + random.random() * 8 if conn_type == "industrial"
                    else 1.5 + random.random() * 3 if conn_type == "commercial"
                    else 0.5 + random.random() * 2)
            if 17 <= h <= 22:
                base *= 1.3 + random.random() * 0.5
            elif 1 <= h <= 5:
                base *= 0.2 + random.random() * 0.2
            hourly.append(round(base, 4))

        profiles.append({
            "user_id": f"AUTO-{i + 1:04d}",
            "conn_type": conn_type,
            "appliances": appliances,
            "hourly_consumption": hourly,
        })
    return profiles


def run():
    """Job entry point."""
    profiles = _generate_batch_profiles(config.BATCH_SIZE)
    result = run_autonomous_batch(profiles)
    stats = result["stats"]
    print(f"[OptimizerJob] Fleet sweep: {stats['users_processed']} users, "
          f"₹{stats['total_savings_generated']:.0f} total savings identified")
    return stats
