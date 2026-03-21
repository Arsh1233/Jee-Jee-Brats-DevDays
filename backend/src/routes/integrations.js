const express = require('express');
const router = express.Router();
const { generateNudges, getNudgeSummary } = require('../services/smartNudgeEngine');
const { getDISCOM, getOEM, HomeAutomationAdapter, DISCOM_REGISTRY, OEM_REGISTRY } = require('../services/integrationHub');
const { users, usersByBP } = require('../db/seedData');

function resolveUser(req) {
    const { userId, bpNumber } = req.query;
    if (bpNumber) return usersByBP.get(bpNumber);
    if (userId) return users.find(u => u.userId === userId);
    return users[0];
}

// ═══════════════════════════════════════════════════════════════
//  Smart Nudges (Dynamic Tariff-Linked Recommendations)
// ═══════════════════════════════════════════════════════════════

/** GET /api/integrations/nudges?userId=USR000001 */
router.get('/nudges', (req, res) => {
    const user = resolveUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(getNudgeSummary(user));
});

/** GET /api/integrations/nudges/all?userId=USR000001 */
router.get('/nudges/all', (req, res) => {
    const user = resolveUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(generateNudges(user));
});

// ═══════════════════════════════════════════════════════════════
//  DISCOM Integration
// ═══════════════════════════════════════════════════════════════

/** GET /api/integrations/discom/providers */
router.get('/discom/providers', (req, res) => {
    const providers = Object.entries(DISCOM_REGISTRY).map(([id, adapter]) => ({
        id,
        provider: adapter.provider,
        region: adapter.region,
    }));
    res.json(providers);
});

/** GET /api/integrations/discom/tariff?provider=BSES_RAJDHANI */
router.get('/discom/tariff', async (req, res) => {
    const discom = getDISCOM(req.query.provider);
    const tariff = await discom.fetchRealTimeTariff();
    res.json(tariff);
});

/** GET /api/integrations/discom/outages?provider=BSES_RAJDHANI */
router.get('/discom/outages', async (req, res) => {
    const discom = getDISCOM(req.query.provider);
    const outages = await discom.fetchOutageSchedule();
    res.json(outages);
});

/** GET /api/integrations/discom/billing?bpNumber=BP-1000001 */
router.get('/discom/billing', async (req, res) => {
    const discom = getDISCOM(req.query.provider);
    const billing = await discom.fetchBillingDetails(req.query.bpNumber || 'BP-1000001');
    res.json(billing);
});

// ═══════════════════════════════════════════════════════════════
//  OEM Device Integration
// ═══════════════════════════════════════════════════════════════

/** GET /api/integrations/oem/manufacturers */
router.get('/oem/manufacturers', (req, res) => {
    const oems = Object.entries(OEM_REGISTRY).map(([id, adapter]) => ({
        id,
        manufacturer: adapter.manufacturer,
        protocol: adapter.protocol,
    }));
    res.json(oems);
});

/** GET /api/integrations/oem/telemetry?deviceId=xxx&manufacturer=DAIKIN */
router.get('/oem/telemetry', async (req, res) => {
    const oem = getOEM(req.query.manufacturer);
    const telemetry = await oem.getDeviceTelemetry(req.query.deviceId || 'DEV-001');
    res.json(telemetry);
});

/** POST /api/integrations/oem/command — { deviceId, manufacturer, action, params } */
router.post('/oem/command', async (req, res) => {
    const oem = getOEM(req.body.manufacturer);
    const result = await oem.sendCommand(req.body.deviceId, {
        action: req.body.action,
        params: req.body.params,
    });
    res.json(result);
});

// ═══════════════════════════════════════════════════════════════
//  Home Automation Platforms
// ═══════════════════════════════════════════════════════════════

/** GET /api/integrations/home/platforms */
router.get('/home/platforms', (req, res) => {
    res.json(HomeAutomationAdapter.getSupportedPlatforms());
});

/** POST /api/integrations/home/sync — { platform, userId } */
router.post('/home/sync', async (req, res) => {
    const user = resolveUser(req);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const adapter = new HomeAutomationAdapter({
        platform: req.body.platform || 'google_home',
        userId: user.userId,
    });
    const result = await adapter.syncDevices(user.appliances || []);
    res.json(result);
});

/** POST /api/integrations/home/automation — { platform, trigger, actions } */
router.post('/home/automation', async (req, res) => {
    const adapter = new HomeAutomationAdapter({
        platform: req.body.platform || 'google_home',
    });
    const result = await adapter.createAutomation({
        trigger: req.body.trigger,
        conditions: req.body.conditions,
        actions: req.body.actions,
    });
    res.json(result);
});

module.exports = router;
