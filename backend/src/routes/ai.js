/**
 * AI Engine Proxy Routes
 * Forwards /api/ai/* requests from Node.js backend to the Python Flask AI API server.
 * Supports both local HTTP (http://localhost:5000) and remote HTTPS (https://render.onrender.com).
 */

const express = require('express');
const http = require('http');
const https = require('https');
const router = express.Router();

// AI_API_HOST can be a full URL (https://powerpilot-ai-yoj0.onrender.com)
// or just a hostname (localhost). We parse it so http/https both work correctly.
const AI_API_HOST_RAW = process.env.AI_API_HOST || 'http://localhost:5000';
const AI_BASE_URL = AI_API_HOST_RAW.startsWith('http')
    ? AI_API_HOST_RAW.replace(/\/$/, '')          // full URL — strip trailing slash
    : `http://${AI_API_HOST_RAW}:${process.env.AI_API_PORT || 5000}`;  // bare hostname

const parsedUrl = new URL(AI_BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const agent = isHttps ? https : http;
const AI_HOSTNAME = parsedUrl.hostname;
const AI_PORT = parsedUrl.port || (isHttps ? 443 : 80);

/**
 * Proxy a request to the Python AI API server.
 */
function proxyToAI(req, res, method, path, body = null) {
    const options = {
        hostname: AI_HOSTNAME,
        port: AI_PORT,
        path: `/api/ai${path}`,
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,   // 60s — Render free tier can take ~50s to wake up
    };

    const proxyReq = agent.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            try {
                res.status(proxyRes.statusCode).json(JSON.parse(data));
            } catch {
                res.status(proxyRes.statusCode).send(data);
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.error(`[AI Proxy] Error connecting to AI server at ${AI_BASE_URL}: ${err.message}`);
        res.status(503).json({
            error: 'AI Engine unavailable',
            message: 'The Python AI API server is not reachable.',
            details: err.message,
        });
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.status(504).json({ error: 'AI Engine timeout — it may be warming up, please retry in 30s' });
    });

    if (body) {
        proxyReq.write(JSON.stringify(body));
    }
    proxyReq.end();
}

// ── GET endpoints ───────────────────────────────────────────────
router.get('/health', (req, res) => proxyToAI(req, res, 'GET', '/health'));
router.get('/models/stats', (req, res) => proxyToAI(req, res, 'GET', '/models/stats'));
router.get('/forecast', (req, res) => proxyToAI(req, res, 'GET', '/forecast'));
router.get('/optimizer/status', (req, res) => proxyToAI(req, res, 'GET', '/optimizer/status'));

// ── POST endpoints ──────────────────────────────────────────────
router.post('/chat', (req, res) => proxyToAI(req, res, 'POST', '/chat', req.body));
router.post('/voice', (req, res) => {
    // Proxy to Python AI server first for intent classification
    const voiceOptions = {
        hostname: AI_HOSTNAME,
        port: AI_PORT,
        path: '/api/ai/voice',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
    };
    const voiceReq = agent.request(voiceOptions, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', async () => {
            try {
                const aiResult = JSON.parse(data);

                // ── Intercept control_device intent → actually toggle real device ──
                if (aiResult.intent === 'control_device' && aiResult.data && aiResult.data.device) {
                    try {
                        const broker = require('../services/deviceBroker');
                        const userId = req.body.userId || 'USR000001';
                        const deviceName = aiResult.data.device.toLowerCase();
                        const action = aiResult.data.action; // "on", "off", or "toggle"

                        // Find the matching device by name (fuzzy match)
                        const allDevices = broker.listDevices(userId);
                        const normalize = s => s.toLowerCase().replace(/s$/, '').trim();
                        const normName = normalize(deviceName);
                        const match = allDevices.find(d => {
                            const dn = normalize(d.name);
                            const dt = normalize(d.type);
                            return dn === normName || dt === normName ||
                                   dn.includes(normName) || normName.includes(dn) ||
                                   dt.includes(normName) || normName.includes(dt);
                        });

                        if (match) {
                            const targetState = action === 'on' ? true : (action === 'off' ? false : !match.isOn);
                            const updated = await broker.setDeviceState(userId, match.id, targetState);
                            
                            console.log(`[Voice→Device] ${match.name} → ${updated.isOn ? 'ON' : 'OFF'} ✓`);
                            aiResult.data.actual_device = updated;
                            aiResult.data.hardware_controlled = true;
                            aiResult.response = `✅ ${match.name} is now ${updated.isOn ? 'on' : 'off'}.`;
                        } else {
                            console.log(`[Voice→Device] No matching device found for "${deviceName}"`);
                        }
                    } catch (deviceErr) {
                        console.error('[Voice→Device] Error:', deviceErr.message);
                    }
                }

                res.status(proxyRes.statusCode).json(aiResult);
            } catch {
                res.status(proxyRes.statusCode).send(data);
            }
        });
    });
    voiceReq.on('error', (err) => {
        console.error(`[AI Proxy] Error connecting to AI server: ${err.message}`);
        res.status(503).json({ error: 'AI Engine unavailable', details: err.message });
    });
    voiceReq.on('timeout', () => {
        voiceReq.destroy();
        res.status(504).json({ error: 'AI Engine timeout' });
    });
    voiceReq.write(JSON.stringify(req.body));
    voiceReq.end();
});
router.post('/optimizer/analyze', (req, res) => proxyToAI(req, res, 'POST', '/optimizer/analyze', req.body));

// ── Transcription (file upload — raw pipe to AI server) ─────────
router.post('/transcribe', (req, res) => {
    const options = {
        hostname: AI_HOSTNAME,
        port: AI_PORT,
        path: '/api/ai/transcribe',
        method: 'POST',
        headers: {
            ...req.headers,
            host: AI_HOSTNAME,
        },
        timeout: 30000,
    };
    const proxyReq = agent.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            try { res.status(proxyRes.statusCode).json(JSON.parse(data)); }
            catch { res.status(proxyRes.statusCode).send(data); }
        });
    });
    proxyReq.on('error', (err) => {
        res.status(503).json({ error: 'AI Engine unavailable', details: err.message });
    });
    proxyReq.on('timeout', () => { proxyReq.destroy(); res.status(504).json({ error: 'Timeout' }); });
    req.pipe(proxyReq);
});

module.exports = router;
