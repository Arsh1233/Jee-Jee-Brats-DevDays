const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const mockData = require('./services/mockDataService');
const { bus: deviceBus } = require('./services/deviceBroker');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

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

// Health check — enhanced for admin topbar
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

// ── Serve uploaded flyer images ─────────────────────────────────
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// ── Serve Web Admin portal ──────────────────────────────────
const adminDist = path.join(__dirname, '../../web-admin/dist');
app.use('/admin', express.static(adminDist));
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDist, 'index.html'));
});

// ── Serve Mobile Web App (fallback) ─────────────────────────
const mobileDist = path.join(__dirname, '../../mobile/dist');
app.use(express.static(mobileDist));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(mobileDist, 'index.html'));
});

// ── WebSocket — Real-time meter data ────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.send(JSON.stringify({ type: 'READING', ...mockData.generateReading() }));
    ws.on('close', () => console.log('[WS] Client disconnected'));
});

// Push device state changes to all WS clients
deviceBus.on('deviceUpdate', ({ userId, device }) => {
    const payload = JSON.stringify({ type: 'DEVICE_UPDATE', userId, device });
    wss.clients.forEach(client => {
        if (client.readyState === 1) client.send(payload);
    });
});

// Broadcast a new reading every 3 seconds
setInterval(() => {
    const reading = { type: 'READING', ...mockData.generateReading() };
    const payload = JSON.stringify(reading);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(payload);
    });
}, 3000);

// ── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ⚡ PowerPilot Backend running on http://0.0.0.0:${PORT}
  📱 Mobile App hosted at http://0.0.0.0:${PORT}
  💻 Web Admin Portal hosted at http://0.0.0.0:${PORT}/admin
  📡 WebSocket at ws://0.0.0.0:${PORT}/ws
  📊 API: /api/health, /api/meters/current, /api/appliances
  `);
});
