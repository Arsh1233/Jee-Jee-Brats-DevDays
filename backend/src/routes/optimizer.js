const express = require('express');
const router = express.Router();
const optimizer = require('../services/tariffOptimizer');
const { users, usersByBP } = require('../db/seedData');

function resolveUser(req) {
    const { userId, bpNumber } = req.query;
    if (bpNumber) return usersByBP.get(bpNumber);
    if (userId) return users.find(u => u.userId === userId);
    return users[0];
}

// GET /api/optimizer/suggestions?userId=USR000001
router.get('/suggestions', (req, res) => {
    const user = resolveUser(req);
    res.json(optimizer.getSuggestions(user));
});

// GET /api/optimizer/savings?userId=USR000001
router.get('/savings', (req, res) => {
    const user = resolveUser(req);
    res.json(optimizer.getSavingsSummary(user));
});

// GET /api/optimizer/environment?userId=USR000001
router.get('/environment', (req, res) => {
    const user = resolveUser(req);
    res.json(optimizer.getEnvironmentData(user));
});

// POST /api/optimizer/apply — { suggestionId, userId }
router.post('/apply', (req, res) => {
    const user = resolveUser(req);
    const result = optimizer.applySuggestion(req.body.suggestionId, user);
    if (!result) return res.status(404).json({ error: 'Suggestion not found' });
    res.json(result);
});

// GET /api/optimizer/status — autonomous engine status (admin)
router.get('/status', (req, res) => res.json(optimizer.getAutonomousStatus()));

// POST /api/optimizer/run — trigger manual autonomous run (admin)
router.post('/run', (req, res) => {
    optimizer.runAutonomousOptimizer();
    res.json({ message: 'Optimizer run triggered', ...optimizer.getAutonomousStatus() });
});

module.exports = router;
