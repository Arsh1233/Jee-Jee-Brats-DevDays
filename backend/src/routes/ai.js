/**
 * AI Engine Proxy Routes
 * Forwards /api/ai/* requests from Node.js backend to the Python Flask AI API server.
 */

const express = require('express');
const http = require('http');
const router = express.Router();

const AI_API_HOST = process.env.AI_API_HOST || 'localhost';
const AI_API_PORT = process.env.AI_API_PORT || 5000;

/**
 * Proxy a request to the Python AI API server.
 */
function proxyToAI(req, res, method, path, body = null) {
    const options = {
        hostname: AI_API_HOST,
        port: AI_API_PORT,
        path: `/api/ai${path}`,
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
    };

    const proxyReq = http.request(options, (proxyRes) => {
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
        console.error(`[AI Proxy] Error connecting to AI server: ${err.message}`);
        res.status(503).json({
            error: 'AI Engine unavailable',
            message: 'The Python AI API server is not running. Start it with: python ai-models/api_server.py',
            details: err.message,
        });
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        res.status(504).json({ error: 'AI Engine timeout' });
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
        hostname: AI_API_HOST,
        port: AI_API_PORT,
        path: '/api/ai/transcribe',
        method: 'POST',
        headers: {
            ...req.headers,
            host: `${AI_API_HOST}:${AI_API_PORT}`,
        },
        timeout: 30000,
    };
    const proxyReq = http.request(options, (proxyRes) => {
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
