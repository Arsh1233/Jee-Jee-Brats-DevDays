/**
 * Smart Tariff Nudge Engine
 * ─────────────────────────
 * Generates real-time, context-aware, appliance-specific tariff recommendations.
 * 
 * Examples:
 *   "Run washing machine after 10 PM to save ₹20"
 *   "⚡ Peak tariff starts in 30 min — pre-cool your AC now"
 *   "Your geyser used ₹35 today in peak hours — schedule it for 5 AM"
 * 
 * Integrates with: ToD tariffs, appliance usage, DISCOM tariff APIs,
 *                  weather, and user consumption history.
 */

const optimizer = require('./tariffOptimizer');

// ── Appliance usage patterns (typical hours + duration) ──────────
const USAGE_PATTERNS = {
    'Washing Machine': { typicalHours: [10, 11, 15, 16], durationHrs: 1.5, interruptible: true },
    'Dishwasher': { typicalHours: [13, 14, 20], durationHrs: 1, interruptible: true },
    'Water Heater': { typicalHours: [6, 7, 18, 19], durationHrs: 0.5, interruptible: true },
    'Geyser': { typicalHours: [6, 7, 18, 19], durationHrs: 0.5, interruptible: true },
    'EV Charger': { typicalHours: [18, 19, 20], durationHrs: 4, interruptible: true },
    'AC': { typicalHours: [12, 13, 14, 15, 16, 17, 22, 23], durationHrs: 6, interruptible: false },
    'Air Conditioner': { typicalHours: [12, 13, 14, 15, 16, 17, 22, 23], durationHrs: 6, interruptible: false },
    'Iron': { typicalHours: [9, 10, 17, 18], durationHrs: 0.5, interruptible: true },
    'Microwave': { typicalHours: [8, 12, 19, 20], durationHrs: 0.25, interruptible: true },
    'Water Pump': { typicalHours: [7, 8, 17, 18], durationHrs: 1, interruptible: true },
};

// ── Best off-peak windows ────────────────────────────────────────
function findBestWindow(durationHrs) {
    const forecast = optimizer.getTariffForecast();
    const windowSize = Math.ceil(durationHrs);
    let bestStart = 0;
    let bestCost = Infinity;

    for (let i = 0; i <= forecast.length - windowSize; i++) {
        const windowCost = forecast.slice(i, i + windowSize)
            .reduce((s, f) => s + f.ratePerUnit, 0);
        if (windowCost < bestCost) {
            bestCost = windowCost;
            bestStart = i;
        }
    }

    return {
        startHour: forecast[bestStart].hour,
        endHour: forecast[Math.min(bestStart + windowSize - 1, forecast.length - 1)].hour,
        avgRate: bestCost / windowSize,
        label: forecast[bestStart].label,
    };
}

// ── Nudge generation ─────────────────────────────────────────────
function generateNudges(user) {
    if (!user || !user.appliances) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const currentTariff = optimizer.getCurrentTariff();
    const forecast = optimizer.getTariffForecast();
    const peak = 8.0;
    const offPeak = 4.0;
    const nudges = [];

    // 1. ⏰ Upcoming tariff change alerts
    const nextSlotIdx = forecast.findIndex((f, i) => i > 0 && f.ratePerUnit !== forecast[0].ratePerUnit);
    if (nextSlotIdx > 0 && nextSlotIdx <= 2) {
        const next = forecast[nextSlotIdx];
        if (next.ratePerUnit > currentTariff.ratePerUnit) {
            nudges.push({
                id: 'nudge-tariff-rise',
                type: 'tariff_alert',
                icon: '⚡',
                priority: 'high',
                title: `Peak tariff starts in ${nextSlotIdx}h`,
                message: `Rate will jump from ₹${currentTariff.ratePerUnit}/kWh to ₹${next.ratePerUnit}/kWh at ${next.label}. Pre-cool your AC and finish laundry now!`,
                savings: null,
                color: '#ef4444',
                actionLabel: 'View Forecast',
                actionRoute: 'Optimizer',
            });
        } else if (next.ratePerUnit < currentTariff.ratePerUnit) {
            nudges.push({
                id: 'nudge-tariff-drop',
                type: 'tariff_alert',
                icon: '💚',
                priority: 'medium',
                title: `Off-Peak starts in ${nextSlotIdx}h — save ${Math.round((1 - next.ratePerUnit / currentTariff.ratePerUnit) * 100)}%`,
                message: `Tariff drops to ₹${next.ratePerUnit}/kWh at ${next.label}. Delay heavy appliances to save big!`,
                savings: null,
                color: '#22c55e',
                actionLabel: 'Schedule Now',
                actionRoute: 'Optimizer',
            });
        }
    }

    // 2. 🏠 Per-appliance dynamic nudges
    user.appliances.forEach(appliance => {
        const pattern = USAGE_PATTERNS[appliance.name] || null;
        const kw = appliance.wattage / 1000;
        const duration = pattern?.durationHrs || 2;

        // Find best off-peak window for this appliance
        const bestWindow = findBestWindow(duration);
        const currentCost = kw * duration * currentTariff.ratePerUnit;
        const bestCost = kw * duration * bestWindow.avgRate;
        const dailySavings = currentCost - bestCost;

        if (dailySavings > 1 && pattern?.interruptible) {
            // "Run washing machine after 10 PM to save ₹20"
            const startLabel = `${String(bestWindow.startHour).padStart(2, '0')}:00`;
            const endLabel = `${String((bestWindow.endHour + 1) % 24).padStart(2, '0')}:00`;

            nudges.push({
                id: `nudge-shift-${appliance.id}`,
                type: 'shift_recommendation',
                icon: '🔄',
                priority: dailySavings > 10 ? 'high' : 'medium',
                title: `Run ${appliance.name} after ${startLabel} to save ₹${Math.round(dailySavings * 30)}/month`,
                message: `Your ${appliance.name} (${appliance.wattage}W) costs ₹${currentCost.toFixed(0)}/use at current rates. Shifting to ${startLabel}–${endLabel} saves ₹${dailySavings.toFixed(0)} every time.`,
                savings: {
                    perUse: parseFloat(dailySavings.toFixed(1)),
                    perMonth: parseFloat((dailySavings * 30).toFixed(0)),
                    currentRate: currentTariff.ratePerUnit,
                    bestRate: bestWindow.avgRate,
                },
                color: '#3b82f6',
                appliance: appliance.name,
                applianceId: appliance.id,
                suggestedWindow: { start: startLabel, end: endLabel },
                actionLabel: 'Auto-Schedule',
                actionRoute: 'Optimizer',
            });
        }

        // 3. 🔥 Currently running in peak warning
        if (appliance.isOn && currentTariff.ratePerUnit >= peak) {
            const peakCostPerHr = kw * peak;
            nudges.push({
                id: `nudge-peak-warn-${appliance.id}`,
                type: 'peak_warning',
                icon: '🔥',
                priority: 'high',
                title: `${appliance.name} is costing ₹${peakCostPerHr.toFixed(0)}/hr right now`,
                message: `You're on Peak tariff (₹${peak}/kWh). Your ${appliance.name} at ${appliance.wattage}W is burning ₹${peakCostPerHr.toFixed(0)}/hr. Turn off or wait for Off-Peak at ${bestWindow.label}.`,
                savings: { perHour: parseFloat(peakCostPerHr.toFixed(1)) },
                color: '#ef4444',
                appliance: appliance.name,
                actionLabel: 'Turn Off',
                actionRoute: 'Devices',
            });
        }
    });

    // 4. 🌙 Overnight scheduling nudge (between 8–10 PM)
    if (currentHour >= 20 && currentHour <= 22) {
        const heavyAppliances = user.appliances.filter(a =>
            a.wattage >= 1000 && !a.schedule && (USAGE_PATTERNS[a.name]?.interruptible ?? true)
        );
        if (heavyAppliances.length > 0) {
            const totalSavings = heavyAppliances.reduce((s, a) => {
                const kw = a.wattage / 1000;
                return s + kw * 2 * (peak - offPeak);
            }, 0);
            nudges.push({
                id: 'nudge-overnight-batch',
                type: 'overnight_schedule',
                icon: '🌙',
                priority: 'medium',
                title: `Schedule ${heavyAppliances.length} appliances overnight — save ₹${Math.round(totalSavings * 30)}/month`,
                message: `${heavyAppliances.map(a => a.name).join(', ')} can run at ₹${offPeak}/kWh between 10 PM–6 AM instead of ₹${peak}/kWh during peak.`,
                savings: { perMonth: Math.round(totalSavings * 30) },
                color: '#8b5cf6',
                actionLabel: 'Schedule All',
                actionRoute: 'Optimizer',
            });
        }
    }

    // 5. ☀️ Solar window nudge (10 AM – 2 PM for solar users)
    if (currentHour >= 9 && currentHour <= 12 && user.connType === 'residential') {
        nudges.push({
            id: 'nudge-solar-window',
            type: 'solar_tip',
            icon: '☀️',
            priority: 'low',
            title: 'Solar generation peak — run appliances now for free',
            message: 'If you have rooftop solar, 10 AM–2 PM is the best window. Run washing machines, water pumps, and charging during this peak solar window.',
            savings: null,
            color: '#f59e0b',
            actionLabel: 'Learn More',
            actionRoute: 'Environment',
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    nudges.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

    return nudges;
}

// ── Summary stats for nudge dashboard ────────────────────────────
function getNudgeSummary(user) {
    const nudges = generateNudges(user);
    const totalMonthlySavings = nudges
        .filter(n => n.savings?.perMonth)
        .reduce((s, n) => s + n.savings.perMonth, 0);

    const currentTariff = optimizer.getCurrentTariff();
    const forecast = optimizer.getTariffForecast();

    // Find next cheapest window
    const cheapest = forecast.reduce((best, f) => (!best || f.ratePerUnit < best.ratePerUnit) ? f : best, null);

    return {
        nudges,
        totalNudges: nudges.length,
        highPriority: nudges.filter(n => n.priority === 'high').length,
        potentialMonthlySavings: totalMonthlySavings,
        currentTariff: {
            name: currentTariff.name,
            rate: currentTariff.ratePerUnit,
            gridLoad: currentTariff.gridLoad,
        },
        cheapestWindow: cheapest ? {
            hour: cheapest.hour,
            label: cheapest.label,
            rate: cheapest.ratePerUnit,
        } : null,
    };
}

module.exports = { generateNudges, getNudgeSummary, findBestWindow };
