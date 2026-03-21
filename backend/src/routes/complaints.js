const express = require('express');
const router = express.Router();
const { load, save } = require('../services/persist');

// Persistent store (loads from disk, falls back to defaults)
const DEFAULT_COMPLAINTS = [
    {
        id: 1,
        userId: 'USR000001',
        bpNumber: 'BP-1000001',
        name: 'Demo User',
        category: 'Billing',
        subject: 'Incorrect bill amount for January',
        description: 'My bill shows ₹3,200 but my actual consumption was much lower this month.',
        contact: 'user1@powerpilot.in',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 2,
        userId: 'USR000001',
        bpNumber: 'BP-1000001',
        name: 'Demo User',
        category: 'Power Cut',
        subject: 'Frequent power cuts in our area',
        description: 'We are experiencing power cuts almost daily between 6 PM and 9 PM for the past week.',
        contact: 'user1@powerpilot.in',
        status: 'Pending',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

let complaints = load('complaints', DEFAULT_COMPLAINTS);

// GET /api/complaints — user's complaints (filter by userId)
router.get('/', (req, res) => {
    const { userId } = req.query;
    const result = userId
        ? complaints.filter(c => c.userId === userId || c.bpNumber === userId)
        : complaints;
    res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET /api/complaints/all — admin: all complaints
router.get('/all', (req, res) => {
    const { status } = req.query;
    const result = status && status !== 'all'
        ? complaints.filter(c => c.status === status)
        : complaints;
    res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/complaints — submit a new complaint
router.post('/', (req, res) => {
    const { userId, bpNumber, name, category, subject, description, contact } = req.body;
    if (!category || !subject || !description) {
        return res.status(400).json({ error: 'category, subject and description are required.' });
    }
    const complaint = {
        id: complaints.length + 1,
        userId: userId || 'USR000001',
        bpNumber: bpNumber || 'BP-Unknown',
        name: name || 'User',
        category,
        subject,
        description,
        contact: contact || '',
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    complaints.push(complaint);
    save('complaints', complaints);
    res.status(201).json(complaint);
});

// PATCH /api/complaints/:id — admin: update status
router.patch('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Complaint not found.' });
    const { status, adminNote } = req.body;
    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }
    if (status) complaints[idx].status = status;
    if (adminNote !== undefined) complaints[idx].adminNote = adminNote;
    complaints[idx].updatedAt = new Date().toISOString();
    save('complaints', complaints);
    res.json(complaints[idx]);
});

// DELETE /api/complaints/:id — admin: remove a complaint
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found.' });
    complaints.splice(idx, 1);
    save('complaints', complaints);
    res.json({ success: true });
});

module.exports = router;
