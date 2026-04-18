/**
 * PowerPilot Backend — Express App (serverless-compatible)
 * This file exports the configured Express app WITHOUT starting the server.
 * Used by: Netlify Functions (api.js) and the local server (index.js).
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── REST API Routes ─────────────────────────────────────────
app.use('/api/meters', require('./routes/meters'));
app.use('/api/appliances', require('./routes/appliances'));
app.use('/api/tariffs', require('./routes/tariffs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/optimizer', require('./routes/optimizer'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bill', require('./routes/bills'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/flyers', require('./routes/flyers'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/integrations', require('./routes/integrations'));

// ── Serve uploaded flyer images ─────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    const { users } = require('./db/seedData');
    res.json({
        status: 'ok',
        ts: new Date().toISOString(),
        uptime: process.uptime(),
        users: users.length,
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    });
});

module.exports = app;
