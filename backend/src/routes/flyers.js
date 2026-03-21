const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { load, save } = require('../services/persist');

// ── Multer storage ───────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `flyer_${Date.now()}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'));
    },
});

// ── In-memory flyer store ────────────────────────────────────────
const DEFAULT_FLYERS = [
    {
        id: 'f1',
        title: '⚠️ साइबर सुरक्षा',
        subtitle: 'Official App Alert',
        body: 'Download the PowerPilot app only from Google Play Store or Apple App Store. Never install APKs from unknown links.',
        badge: '🛡️ Security',
        bgColor: '#b71c1c',
        accentColor: '#ef5350',
        textColor: '#ffffff',
        imageUrl: '',
        linkUrl: '',
        active: true,
        order: 1,
    },
    {
        id: 'f2',
        title: '💡 Energy Saving Tip',
        subtitle: 'Save up to ₹500/month',
        body: 'Run your heavy appliances — washing machine, geyser, AC — during off-peak hours (10 PM – 6 AM) at just ₹5/unit.',
        badge: '🌿 Eco Tip',
        bgColor: '#1b5e20',
        accentColor: '#43a047',
        textColor: '#ffffff',
        imageUrl: '',
        linkUrl: '',
        active: true,
        order: 2,
    },
    {
        id: 'f3',
        title: '📱 New Feature!',
        subtitle: 'Achievement Badges are Live',
        body: 'Earn CO₂ badges for reducing your carbon footprint. Visit the Environment screen to see your progress and share your achievements!',
        badge: '🏆 Update',
        bgColor: '#0d47a1',
        accentColor: '#1976d2',
        textColor: '#ffffff',
        imageUrl: '',
        linkUrl: '',
        active: true,
        order: 3,
    },
];

let flyers = load('flyers', DEFAULT_FLYERS);
let nextId = flyers.length ? Math.max(...flyers.map(f => parseInt(f.id.replace('f', '')) || 0)) + 1 : 4;

// POST /api/flyers/upload — image upload
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// GET /api/flyers — public (mobile app)
router.get('/', (req, res) => {
    const active = flyers
        .filter(f => f.active)
        .sort((a, b) => a.order - b.order);
    res.json(active);
});

// GET /api/flyers/all — admin (includes inactive)
router.get('/all', (req, res) => {
    res.json(flyers.sort((a, b) => a.order - b.order));
});

// POST /api/flyers — create
router.post('/', (req, res) => {
    const { title, subtitle, body, badge, bgColor, accentColor, textColor, imageUrl, linkUrl } = req.body;
    const flyer = {
        id: `f${nextId++}`,
        title, subtitle: subtitle || '',
        body, badge: badge || '',
        bgColor: bgColor || '#1a237e',
        accentColor: accentColor || '#3949ab',
        textColor: textColor || '#ffffff',
        imageUrl: imageUrl || '',
        linkUrl: linkUrl || '',
        active: true,
        order: flyers.length + 1,
    };
    flyers.push(flyer);
    save('flyers', flyers);
    res.status(201).json(flyer);
});

// PUT /api/flyers/:id — update
router.put('/:id', (req, res) => {
    const idx = flyers.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Flyer not found' });
    flyers[idx] = { ...flyers[idx], ...req.body, id: req.params.id };
    save('flyers', flyers);
    res.json(flyers[idx]);
});

// DELETE /api/flyers/:id — remove
router.delete('/:id', (req, res) => {
    const flyer = flyers.find(f => f.id === req.params.id);
    if (!flyer) return res.status(404).json({ error: 'Flyer not found' });
    // Clean up image file if present
    if (flyer.imageUrl) {
        const filePath = path.join(uploadsDir, path.basename(flyer.imageUrl));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    flyers = flyers.filter(f => f.id !== req.params.id);
    save('flyers', flyers);
    res.json({ success: true });
});

module.exports = router;
