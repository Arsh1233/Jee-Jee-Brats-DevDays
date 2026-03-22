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
router.post('/voice', (req, res) => proxyToAI(req, res, 'POST', '/voice', req.body));
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
