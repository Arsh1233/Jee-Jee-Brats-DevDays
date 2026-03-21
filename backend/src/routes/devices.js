const router = require('express').Router();
const { listDevices, addDevice, removeDevice, toggleDevice, getDeviceStatus } = require('../services/deviceBroker');

// GET /api/devices?userId=...
router.get('/', (req, res) => {
    const { userId = 'USR000001' } = req.query;
    const devs = listDevices(userId);
    res.json(devs);
});

// POST /api/devices  — register a new device
// Body: { userId, name, type, protocol, ip, onUrl, offUrl, deviceId, localKey }
router.post('/', (req, res) => {
    const { userId = 'USR000001', ...opts } = req.body;
    if (!opts.name) return res.status(400).json({ error: 'name is required' });
    const device = addDevice(userId, opts);
    res.status(201).json(device);
});

// DELETE /api/devices/:id?userId=...
router.delete('/:id', (req, res) => {
    const { userId = 'USR000001' } = req.query;
    const ok = removeDevice(userId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Device not found' });
    res.json({ ok: true });
});

// POST /api/devices/:id/toggle?userId=...
router.post('/:id/toggle', async (req, res) => {
    const { userId = 'USR000001' } = req.query;
    try {
        const device = await toggleDevice(userId, req.params.id);
        res.json(device);
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

// GET /api/devices/:id/status?userId=...
router.get('/:id/status', async (req, res) => {
    const { userId = 'USR000001' } = req.query;
    try {
        const status = await getDeviceStatus(userId, req.params.id);
        res.json(status);
    } catch (e) {
        res.status(404).json({ error: e.message });
    }
});

module.exports = router;
