const express = require('express');
const router = express.Router();
const mockData = require('../services/mockDataService');

// GET /api/meters/current — latest reading
router.get('/current', (req, res) => {
    res.json(mockData.generateReading());
});

// GET /api/meters/history — last 24 hrs of readings
router.get('/history', (req, res) => {
    const count = parseInt(req.query.count) || 288;
    res.json(mockData.getHistory(count));
});

module.exports = router;
