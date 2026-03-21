"""
🧠 Pluggable Optimization Strategies
Each strategy scores appliances differently and generates tailored actions.

Strategies:
 - PeakShaving:      Shift heavy loads out of peak hours
 - LoadBalancing:     Spread consumption evenly across the day
 - CostMinimization: Maximise usage during cheapest tariff windows
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


# ── Base Strategy ────────────────────────────────────────────────────

class BaseStrategy:
    def __init__(self, name: str):
        self.name = name

    def score(self, appliance: dict, shiftability: float,
              peak_overlap: float, patterns: dict) -> float:
        raise NotImplementedError

    def get_action(self, appliance: dict, patterns: dict) -> str:
        raise NotImplementedError


# ── Peak Shaving ─────────────────────────────────────────────────────

class PeakShaving(BaseStrategy):
    """Shift heavy loads out of peak hours."""

    def __init__(self):
        super().__init__("peak_shaving")

    def score(self, appliance, shiftability, peak_overlap, patterns):
        """Score = (wattage / 1000) × peakOverlap × shiftability × 1.5"""
        kw = appliance["wattage"] / 1000
        return kw * peak_overlap * shiftability * 1.5

    def get_action(self, appliance, patterns):
        ps = config.PEAK_HOURS["start"]
        pe = config.PEAK_HOURS["end"]
        os_ = config.OFF_PEAK_HOURS["start"]
        oe = config.OFF_PEAK_HOURS["end"]

        atype = appliance.get("type", "")
        name = appliance["name"]

        if atype in ("heating", "appliance"):
            saving = int(appliance["wattage"] / 1000 * 5)
            return (f"Shift {name} usage from peak hours ({ps}:00–{pe}:00) "
                    f"to off-peak ({os_}:00–{oe}:00). Estimated daily saving: ₹{saving}")
        if atype == "cooling":
            return (f"Pre-cool with {name} before {ps}:00 and use timer mode "
                    f"during peak. Reduce runtime by ~30%.")
        return (f"Reduce {name} usage during peak hours ({ps}:00–{pe}:00) "
                f"when tariff is ₹{config.TARIFF_RATES['peak']}/kWh.")


# ── Load Balancing ───────────────────────────────────────────────────

class LoadBalancing(BaseStrategy):
    """Spread consumption evenly across the day."""

    def __init__(self):
        super().__init__("load_balancing")

    def score(self, appliance, shiftability, peak_overlap, patterns):
        """Score = (wattage / 1000) × shiftability × (1 + peakSeverity)"""
        kw = appliance["wattage"] / 1000
        pws = patterns.get("peak_windows", [])
        peak_severity = (
            sum(p["severity"] for p in pws) / len(pws)
            if pws else 1.0
        )
        return kw * shiftability * (1 + peak_severity * 0.3)

    def get_action(self, appliance, patterns):
        avg_load = patterns.get("avg_load", 1)
        name = appliance["name"]
        idle = patterns.get("idle_periods", [])

        if appliance["wattage"] / 1000 > avg_load * 2:
            idle_str = ", ".join(f"{p['hour']}:00" for p in idle) or "early morning"
            return (f"Stagger {name} start times to avoid simultaneous load spikes. "
                    f"Consider running during idle periods ({idle_str}).")

        ratio = round(patterns.get("max_load", 1) / avg_load, 1) if avg_load else 1
        return (f"Distribute {name} usage more evenly across the day to reduce "
                f"demand charges. Current peak-to-average ratio: {ratio}x.")


# ── Cost Minimization ────────────────────────────────────────────────

class CostMinimization(BaseStrategy):
    """Maximise usage during cheapest tariff windows."""

    def __init__(self):
        super().__init__("cost_minimization")

    def score(self, appliance, shiftability, peak_overlap, patterns):
        """Score = (wattage / 1000) × shiftability × tariffDelta × 2"""
        kw = appliance["wattage"] / 1000
        tariff_delta = config.TARIFF_RATES["peak"] - config.TARIFF_RATES["off_peak"]
        return kw * shiftability * tariff_delta * 2

    def get_action(self, appliance, patterns):
        os_ = config.OFF_PEAK_HOURS["start"]
        oe = config.OFF_PEAK_HOURS["end"]
        name = appliance["name"]
        saving = int(appliance["wattage"] / 1000 *
                     (config.TARIFF_RATES["peak"] - config.TARIFF_RATES["off_peak"]) * 4)

        if appliance.get("type") in ("motor", "machinery"):
            return (f"Schedule {name} for off-peak operation ({os_}:00–{oe}:00) "
                    f"where possible. Potential weekly saving: ₹{saving * 7}. "
                    f"Consider batch processing during nights.")
        return (f"Move {name} runtime to off-peak tariff window "
                f"({os_}:00–{oe}:00, ₹{config.TARIFF_RATES['off_peak']}/kWh vs "
                f"₹{config.TARIFF_RATES['peak']}/kWh). Weekly saving: ~₹{saving * 7}.")
