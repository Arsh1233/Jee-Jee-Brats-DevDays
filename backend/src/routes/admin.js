const express = require('express');
const router = express.Router();
const optimizer = require('../services/tariffOptimizer');

// GET /api/admin/dashboard — global overview stats from 1000-user dataset
router.get('/dashboard', (req, res) => {
    const { users } = require('../db/seedData');

    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = total - active;
    const autoOpt = users.filter(u => u.autoOptimize && u.isActive).length;

    // Connection type breakdown
    const byType = { residential: 0, commercial: 0, industrial: 0 };
    users.forEach(u => { if (byType[u.connType] !== undefined) byType[u.connType]++; });

    // Defaulters = users with unpaid most recent bill
    const defaulters = users.filter(u => u.billHistory?.[0] && !u.billHistory[0].paid).length;

    // Aggregate today's consumption (last 24 hours of each user's profile)
    let totalKwh24h = 0;
    users.forEach(u => {
        const today = u.consumptionProfile?.slice(-24) ?? [];
        totalKwh24h += today.reduce((s, p) => s + p.kwh, 0);
    });

    // Revenue this month = sum of all latest bills
    const revenueThisMonth = users.reduce((s, u) => {
        const bill = u.billHistory?.[0];
        return s + (bill?.paid ? bill.total : 0);
    }, 0);

    // Outstanding dues
    const outstandingDues = users.reduce((s, u) => {
        const bill = u.billHistory?.[0];
        return s + (!bill?.paid ? bill?.total ?? 0 : 0);
    }, 0);

    // Monthly consumption timeseries — last 6 months average across all users
    const monthlyConsumption = [];
    const refBills = users[0]?.billHistory ?? [];
    refBills.slice(0, 6).reverse().forEach((_, idx) => {
        const monthLabel = users[0]?.billHistory?.[idx]?.month ?? `M${idx + 1}`;
        const avg = users.reduce((s, u) => s + (u.billHistory?.[idx]?.consumption ?? 0), 0) / total;
        monthlyConsumption.push({ month: monthLabel, avgKwh: parseFloat(avg.toFixed(1)) });
    });

    res.json({
        totalUsers: total,
        activeUsers: active,
        inactiveUsers: inactive,
        defaulters,
        autoOptUsers: autoOpt,
        byType,
        totalKwh24h: parseFloat(totalKwh24h.toFixed(1)),
        revenueThisMonth: Math.round(revenueThisMonth),
        outstandingDues: Math.round(outstandingDues),
        currentTariff: optimizer.getCurrentTariff(),
        optimizerStatus: optimizer.getAutonomousStatus(),
        monthlyConsumption,
    });
});

// GET /api/admin/environment — fleet-wide carbon & sustainability aggregates
router.get('/environment', (req, res) => {
    const { users } = require('../db/seedData');
    const { getSuggestions, getCurrentTariff } = require('../services/tariffOptimizer');
    const carbonPerKwh = 0.82;

    let totalFootprintKg = 0;
    let totalSavedKg = 0;
    let totalKwhSaved = 0;
    let totalDailyKwh = 0;

    users.forEach(u => {
        // Monthly kWh from last bill
        const monthlyKwh = u.billHistory?.[0]?.consumption ?? 300;
        const footprint = monthlyKwh * carbonPerKwh;
        totalFootprintKg += footprint;

        // Saved via optimizer suggestions
        const suggestions = getSuggestions(u);
        const rate = getCurrentTariff().ratePerUnit || 6;
        const kwhSaved = suggestions.reduce((s, sg) => s + sg.savingsPerMonth, 0) / rate;
        totalKwhSaved += kwhSaved;
        totalSavedKg += kwhSaved * carbonPerKwh;

        // Daily kWh
        const today = u.consumptionProfile?.slice(-24) ?? [];
        totalDailyKwh += today.reduce((s, p) => s + p.kwh, 0);
    });

    const treesSavedMonthly = totalSavedKg / (22 / 12);
    const offsetPercent = ((totalSavedKg / totalFootprintKg) * 100);

    res.json({
        totalUsers: users.length,
        carbonFootprintKg: parseFloat(totalFootprintKg.toFixed(0)),
        carbonSavedKg: parseFloat(totalSavedKg.toFixed(0)),
        kwhSavedMonthly: parseFloat(totalKwhSaved.toFixed(0)),
        dailyKwh: parseFloat(totalDailyKwh.toFixed(0)),
        treesSavedMonthly: parseFloat(treesSavedMonthly.toFixed(0)),
        treesSavedYearly: parseFloat((treesSavedMonthly * 12).toFixed(0)),
        offsetPercent: parseFloat(offsetPercent.toFixed(1)),
        equivalents: {
            lightBulbHours: Math.round(totalSavedKg / 0.01),
            phoneCharges: Math.round(totalSavedKg * 83),
            drivingKmAvoided: parseFloat((totalSavedKg / 0.12).toFixed(0)),
            carsOffRoad: parseFloat((totalSavedKg / (4600 / 12)).toFixed(1)), // avg car 4600kg CO2/year
        },
    });
});

module.exports = router;
