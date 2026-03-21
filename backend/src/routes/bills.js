const express = require('express');
const router = express.Router();
const { usersByBP, users } = require('../db/seedData');

/** Resolve userId → user, or fall back to a random user for demo */
function resolve(req) {
    const { userId, bpNumber } = req.query;
    if (bpNumber) return usersByBP.get(bpNumber);
    if (userId) return users.find(u => u.userId === userId);
    return users[0]; // fallback
}

/**
 * GET /api/bill/history?userId=USR000001
 * Returns the 22-month bill history for the authenticated user
 */
router.get('/history', (req, res) => {
    const user = resolve(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.billHistory);
});

/**
 * GET /api/bill/consumption?userId=USR000001&days=30
 * Returns hourly consumption profile (720 points for 30 days)
 */
router.get('/consumption', (req, res) => {
    const user = resolve(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const days = Math.min(parseInt(req.query.days) || 30, 30);
    const hours = days * 24;
    res.json(user.consumptionProfile.slice(-hours));
});

/**
 * GET /api/bill/summary?userId=USR000001
 * Returns aggregated summary: total paid, avg monthly, ytd, etc.
 */
router.get('/summary', (req, res) => {
    const user = resolve(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const bills = user.billHistory;
    const totalPaid = bills.filter(b => b.paid).reduce((s, b) => s + b.total, 0);
    const totalDue = bills.filter(b => !b.paid).reduce((s, b) => s + b.total, 0);
    const avgMonthly = Math.round(bills.reduce((s, b) => s + b.total, 0) / bills.length);
    const avgKwh = Math.round(bills.reduce((s, b) => s + b.consumption, 0) / bills.length);
    const ytdBills = bills.slice(0, 9); // Apr-25 to Dec-25
    const ytdAmount = ytdBills.reduce((s, b) => s + b.total, 0);
    res.json({ totalPaid, totalDue, avgMonthly, avgKwh, ytdAmount, billCount: bills.length });
});

module.exports = router;
