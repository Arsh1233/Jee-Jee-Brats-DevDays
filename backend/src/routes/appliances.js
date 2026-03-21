const express = require('express');
const router = express.Router();
const mockData = require('../services/mockDataService');

// GET /api/appliances — list all appliances with states
router.get('/', (req, res) => {
    res.json(mockData.getAppliances());
});

// GET /api/appliances/:id — single appliance
router.get('/:id', (req, res) => {
    const a = mockData.getApplianceById(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Appliance not found' });
    res.json(a);
});

// POST /api/appliances/:id/toggle — switch on/off
router.post('/:id/toggle', (req, res) => {
    const a = mockData.toggleAppliance(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Appliance not found' });
    res.json(a);
});

// POST /api/appliances/:id/schedule — set a schedule
router.post('/:id/schedule', (req, res) => {
    const { startHour, endHour } = req.body;
    const a = mockData.setSchedule(parseInt(req.params.id), startHour, endHour);
    if (!a) return res.status(404).json({ error: 'Appliance not found' });
    res.json(a);
});

// POST /api/appliances — add a new device
router.post('/', (req, res) => {
    const { name, type, wattage } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const a = mockData.addAppliance(name, type || 'general', wattage || 100);
    res.status(201).json(a);
});

// DELETE /api/appliances/:id — remove a device
router.delete('/:id', (req, res) => {
    const a = mockData.deleteAppliance(parseInt(req.params.id));
    if (!a) return res.status(404).json({ error: 'Appliance not found' });
    res.json({ deleted: true, appliance: a });
});

module.exports = router;
