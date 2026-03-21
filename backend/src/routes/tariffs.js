const express = require('express');
const router = express.Router();
const optimizer = require('../services/tariffOptimizer');

router.get('/', (req, res) => res.json(optimizer.getAllTariffs()));
router.get('/current', (req, res) => res.json(optimizer.getCurrentTariff()));
router.get('/forecast', (req, res) => res.json(optimizer.getTariffForecast()));

router.put('/:id', (req, res) => {
    const t = optimizer.updateTariff(parseInt(req.params.id), req.body);
    if (!t) return res.status(404).json({ error: 'Tariff not found' });
    res.json(t);
});

module.exports = router;
