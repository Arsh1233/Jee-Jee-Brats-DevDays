/**
 * PowerPilot Backend — Local server entry point
 * Imports the Express app from app.js and adds WebSocket support.
 * For serverless (Netlify Functions), see netlify/functions/api.js instead.
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./app');
const mockData = require('./services/mockDataService');
const { bus: deviceBus } = require('./services/deviceBroker');

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

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
  📡 WebSocket at ws://0.0.0.0:${PORT}/ws
  📊 API: /api/health, /api/meters/current, /api/appliances
  `);
});
