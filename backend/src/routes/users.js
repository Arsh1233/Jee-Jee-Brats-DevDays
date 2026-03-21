const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { usersByBP, usersByEmail } = require('../db/seedData');

// Ensure avatars directory exists
const AVATAR_DIR = path.join(__dirname, '..', '..', 'public', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

// Simple multipart parser for avatar uploads
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => cb(null, `${req.params.userId}${path.extname(file.originalname || '.jpg')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Easy demo account ──────────────────────────────────────────
const DEMO_USER = {
    userId: 'USR000001', bpNumber: 'BP-1000001',
    email: 'demo@powerpilot.io', name: 'Demo User',
    phone: '+91 9000000000', city: 'Delhi',
    connType: 'residential', sanctionedLoad: 5,
    meterId: 'MTR00000001', isActive: true, autoOptimize: true,
};

/**
 * POST /api/users/login
 * Body: { email, bpNumber, password }
 * Returns: { user (safe), token }
 */
router.post('/login', (req, res) => {
    const { email, bpNumber, password } = req.body;

    if (!email || !bpNumber || !password) {
        return res.status(400).json({ error: 'Email, BP number and password are required.' });
    }

    // ── Demo shortcut ──────────────────────────────────────────
    if (email.trim().toLowerCase() === 'demo@powerpilot.io' && password === 'demo123') {
        return res.json({ token: `tok_demo_${Date.now()}`, user: DEMO_USER });
    }

    // Find user by BP number
    const user = usersByBP.get(bpNumber.trim().toUpperCase());
    if (!user) {
        return res.status(401).json({ error: 'Invalid BP Number.' });
    }

    // Verify email
    if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
        return res.status(401).json({ error: 'Email does not match BP Number.' });
    }

    // Verify password (plain text for PoC)
    if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Account is inactive. Contact support.' });
    }

    // Return safe user object (no password)
    const { password: _pw, billHistory, consumptionProfile, appliances, ...safeUser } = user;
    res.json({
        token: `tok_${user.userId}_${Date.now()}`,
        user: safeUser,
    });
});

/**
 * GET /api/users — list all users (admin)
 */
router.get('/', (req, res) => {
    const { usersByBP: _bp, usersByEmail: _em, users } = require('../db/seedData');
    const list = users.map(u => ({
        userId: u.userId, bpNumber: u.bpNumber, name: u.name, email: u.email,
        phone: u.phone, city: u.city, connType: u.connType,
        sanctionedLoad: u.sanctionedLoad, meterId: u.meterId,
        isActive: u.isActive, autoOptimize: u.autoOptimize,
        lastBill: u.billHistory[0],
    }));
    res.json(list);
});

/**
 * GET /api/users/:userId — single user profile
 */
router.get('/:userId', (req, res) => {
    const { users } = require('../db/seedData');
    const user = users.find(u => u.userId === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _pw, billHistory, consumptionProfile, appliances, ...safe } = user;
    // Add avatar path if file exists
    const avatarFile = fs.readdirSync(AVATAR_DIR).find(f => f.startsWith(req.params.userId));
    if (avatarFile) safe.avatar = `/avatars/${avatarFile}`;
    res.json(safe);
});

/**
 * PUT /api/users/:userId/profile — update editable profile fields
 */
router.put('/:userId/profile', (req, res) => {
    const { users } = require('../db/seedData');
    const user = users.find(u => u.userId === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, phone, city, address } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (address !== undefined) user.address = address;

    const { password: _pw, billHistory, consumptionProfile, appliances, ...safe } = user;
    res.json(safe);
});

/**
 * POST /api/users/:userId/avatar — upload profile picture
 */
router.post('/:userId/avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ avatar: `/avatars/${req.file.filename}` });
});

module.exports = router;
