const express = require('express');
const router = express.Router();

// In-memory notification store
const notifications = [
    { id: 1, userId: 1, title: 'High Usage Alert', message: 'Your consumption exceeded 5 kWh today.', type: 'warning', isRead: false, createdAt: new Date().toISOString() },
    { id: 2, userId: 1, title: 'Tariff Change', message: 'Peak tariff starts at 2:00 PM today.', type: 'info', isRead: false, createdAt: new Date().toISOString() },
    { id: 3, userId: 1, title: 'Optimizer Tip', message: 'Schedule your Heater to off-peak hours to save ₹120/month.', type: 'tip', isRead: true, createdAt: new Date().toISOString() },
];

// GET /api/notifications — all notifications
router.get('/', (req, res) => {
    res.json(notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET /api/notifications/powercuts — active power cut alerts only
router.get('/powercuts', (req, res) => {
    const powercuts = notifications.filter(n => n.type === 'powercut');
    res.json(powercuts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/notifications — create notification (admin broadcasts power cut alerts here)
router.post('/', (req, res) => {
    const n = {
        id: notifications.length + 1,
        userId: req.body.userId || null, // null = broadcast to all
        title: req.body.title,
        message: req.body.message,
        type: req.body.type || 'info', // 'warning' | 'info' | 'tip' | 'powercut'
        isRead: false,
        createdAt: new Date().toISOString(),
        // Power-cut extra fields
        area: req.body.area || null,
        estimatedDuration: req.body.estimatedDuration || null,
        startTime: req.body.startTime || null,
    };
    notifications.push(n);
    res.status(201).json(n);
});

// PATCH /api/notifications/:id/read — mark as read
router.patch('/:id/read', (req, res) => {
    const id = parseInt(req.params.id);
    const n = notifications.find(x => x.id === id);
    if (!n) return res.status(404).json({ error: 'Not found.' });
    n.isRead = true;
    res.json(n);
});

// DELETE /api/notifications/:id — remove a notification (admin)
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = notifications.findIndex(x => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found.' });
    notifications.splice(idx, 1);
    res.json({ success: true });
});

module.exports = router;
