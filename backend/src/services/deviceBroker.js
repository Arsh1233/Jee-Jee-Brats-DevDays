/**
 * DeviceBroker — Multi-protocol IoT device control service
 * Supports: simulated, http, shelly, tuya, kasa, androidtv
 *
 * To add a REAL device:
 *   • OnePlus/Android TV: protocol='androidtv', ip='192.168.x.x'
 *     → Enable: Settings → Device Preferences → Developer Options → Network debugging
 *   • Shelly plug:  protocol='shelly', ip='192.168.x.x'
 *   • HTTP toggle:  protocol='http',   onUrl='http://...', offUrl='http://...'
 *   • Tuya plug:    protocol='tuya',   deviceId='...', localKey='...',  ip='192.168.x.x'
 *   • Kasa plug:    protocol='kasa',   ip='192.168.x.x'
 */

const { EventEmitter } = require('events');

// ── In-memory device registry ──────────────────────────────────────
// Maps userId → Map(deviceId → device object)
const registry = new Map();

// Event bus — emit 'deviceUpdate' when state changes
const bus = new EventEmitter();
bus.setMaxListeners(50);

// ── Helper: generate device ID ──────────────────────────────────────
let _seq = 1;
function nextId() { return `dev${String(_seq++).padStart(4, '0')}`; }

// ── Simulated wattage model ─────────────────────────────────────────
const WATTAGE_MAP = {
    tv: 120, ac: 1500, fan: 75, refrigerator: 150,
    light: 15, 'washing machine': 500, laptop: 65,
    microwave: 800, 'water heater': 2000, charger: 10,
    default: 100,
};
function simWattage(type, isOn) {
    if (!isOn) return 0;
    const base = WATTAGE_MAP[type?.toLowerCase()] ?? WATTAGE_MAP.default;
    return parseFloat((base * (0.9 + Math.random() * 0.2)).toFixed(1));
}

// ── Protocol drivers ────────────────────────────────────────────────

async function shellyToggle(device) {
    const state = !device.isOn;
    try {
        const url = `http://${device.ip}/relay/0?turn=${state ? 'on' : 'off'}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(4000) }).then(x => x.json());
        return { isOn: r.ison ?? state, wattage: r.power ?? simWattage(device.type, state) };
    } catch {
        // Device unreachable — fall back to simulated
        return { isOn: state, wattage: simWattage(device.type, state) };
    }
}

async function shellyStatus(device) {
    const r = await fetch(`http://${device.ip}/relay/0`, { signal: AbortSignal.timeout(3000) }).then(x => x.json());
    return { isOn: r.ison ?? false, wattage: r.power ?? 0 };
}

async function httpToggle(device) {
    const state = !device.isOn;
    try {
        // Support single toggleUrl (ESP8266-style) or separate onUrl/offUrl
        let url = device.toggleUrl
            ? device.toggleUrl
            : (state ? device.onUrl : device.offUrl);
        if (!url) throw new Error('No URL configured');

        // Ensure valid URL prefix
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }

        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        const body = await res.text();
        // Hall Light returns "ON" or "OFF" from /toggle
        if (body.trim() === 'ON') return { isOn: true, wattage: simWattage(device.type, true) };
        if (body.trim() === 'OFF') return { isOn: false, wattage: simWattage(device.type, false) };
    } catch (e) {
        console.warn(`[HTTP Toggle] Failed for ${device.name}:`, e.message);
        // Device unreachable or no URL — fall back to simulated
    }
    return { isOn: state, wattage: simWattage(device.type, state) };
}

async function httpStatus(device) {
    try {
        let url = device.statusUrl;
        if (!url) return { isOn: device.isOn, wattage: device.wattage };
        if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'http://' + url;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const body = await res.text();
        const isOn = body.trim() === 'ON';
        return { isOn, wattage: simWattage(device.type, isOn) };
    } catch {
        return { isOn: device.isOn, wattage: device.wattage };
    }
}

async function kasaToggle(device) {
    // tplink-smarthome-api — install if needed: npm i tplink-smarthome-api
    try {
        const { Client } = require('tplink-smarthome-api');
        const client = new Client();
        const plug = await client.getDevice({ host: device.ip });
        const state = !device.isOn;
        await plug.setPowerState(state);
        const info = await plug.getInfo();
        return { isOn: info.sysInfo.relay_state === 1, wattage: info.emeter?.realtime?.power ?? simWattage(device.type, state) };
    } catch {
        // fall back to simulated if library not installed
        const state = !device.isOn;
        return { isOn: state, wattage: simWattage(device.type, state) };
    }
}

async function tuyaToggle(device) {
    // tuyapi — install if needed: npm i tuyapi
    try {
        const TuyAPI = require('tuyapi');
        const dev = new TuyAPI({ id: device.deviceId, key: device.localKey, ip: device.ip });
        await dev.find(); await dev.connect();
        const state = !device.isOn;
        await dev.set({ set: state });
        await dev.disconnect();
        return { isOn: state, wattage: simWattage(device.type, state) };
    } catch {
        const state = !device.isOn;
        return { isOn: state, wattage: simWattage(device.type, state) };
    }
}

// ── Android TV (ADB over TCP/IP) ────────────────────────────────────
// Requires: Settings → Device Preferences → Developer Options → Network debugging = ON
// KEYCODE_WAKEUP = 224 (turns screen on)  |  KEYCODE_SLEEP = 223 (turns screen off)
const ADB_PORT = 5555;
async function androidtvToggle(device) {
    const state = !device.isOn;
    const ip = device.ip;
    if (!ip) {
        console.warn('[AndroidTV] No IP set — using simulated fallback');
        return { isOn: state, wattage: simWattage(device.type, state) };
    }
    try {
        const adb = require('@devicefarmer/adbkit');
        const client = adb.createClient();
        const serial = `${ip}:${ADB_PORT}`;
        await client.connect(ip, ADB_PORT);
        const device_ = await client.getDevice(serial);
        const keycode = state ? 224 : 223; // WAKEUP or SLEEP
        const stream = await device_.shell(`input keyevent ${keycode}`);
        await new Promise((res) => stream.on('end', res));
        await client.disconnect(ip, ADB_PORT);
        client.end();
        console.log(`[AndroidTV] ${ip} → ${state ? 'WAKEUP' : 'SLEEP'} sent ✓`);
        return { isOn: state, wattage: simWattage(device.type, state) };
    } catch (e) {
        console.error(`[AndroidTV] ${ip} — ${e.message}`);
        // Still flip the stored state — at minimum the app reflects intended state
        return { isOn: state, wattage: simWattage(device.type, state) };
    }
}


// ── Core API ────────────────────────────────────────────────────────


function getUserDevices(userId) {
    if (!registry.has(userId)) registry.set(userId, new Map());
    return registry.get(userId);
}

function listDevices(userId) {
    return Array.from(getUserDevices(userId).values());
}

function addDevice(userId, opts) {
    const devs = getUserDevices(userId);
    const id = opts.id ?? nextId();
    const device = {
        id,
        name: opts.name ?? 'New Device',
        type: (opts.type ?? 'default').toLowerCase(),
        protocol: opts.protocol ?? 'simulated',
        ip: opts.ip ?? null,
        onUrl: opts.onUrl ?? null,
        offUrl: opts.offUrl ?? null,
        toggleUrl: opts.toggleUrl ?? null,
        statusUrl: opts.statusUrl ?? null,
        deviceId: opts.deviceId ?? null,
        localKey: opts.localKey ?? null,
        isOn: opts.isOn ?? false,
        wattage: 0,
        addedAt: new Date().toISOString(),
        userId,
    };
    devs.set(id, device);
    return device;
}

function removeDevice(userId, deviceId) {
    const devs = getUserDevices(userId);
    const existed = devs.has(deviceId);
    devs.delete(deviceId);
    return existed;
}

async function toggleDevice(userId, deviceId) {
    const devs = getUserDevices(userId);
    const device = devs.get(deviceId);
    if (!device) throw new Error('Device not found');

    // Toggle logic: just flip the current known state
    return await setDeviceState(userId, deviceId, !device.isOn);
}

async function setDeviceState(userId, deviceId, targetState) {
    const devs = getUserDevices(userId);
    const device = devs.get(deviceId);
    if (!device) throw new Error('Device not found');

    let result;
    
    // For HTTP devices with statusUrl, verify actual state first to stay in sync
    if (device.protocol === 'http' && device.statusUrl) {
        try {
            const current = await httpStatus(device);
            device.isOn = current.isOn; // Sync internal state
            device.wattage = current.wattage;
            
            // If already in target state, just return
            if (device.isOn === targetState) {
                console.log(`[Sync Check] ${device.name} already ${targetState ? 'ON' : 'OFF'}, skipping hardware action`);
                return { ...device };
            }
        } catch (e) {
            console.warn(`[Sync Check] Failed for ${device.name}:`, e.message);
        }
    }

    console.log(`[Device Control] Setting ${device.name} to ${targetState ? 'ON' : 'OFF'}...`);

    switch (device.protocol) {
        case 'shelly': result = await shellyToggle(device); break;
        case 'http': result = await httpToggle(device); break;
        case 'kasa': result = await kasaToggle(device); break;
        case 'tuya': result = await tuyaToggle(device); break;
        case 'androidtv': result = await androidtvToggle(device); break;

        default:
            // simulated
            result = { isOn: targetState, wattage: simWattage(device.type, targetState) };
    }

    device.isOn = result.isOn;
    device.wattage = result.wattage;
    device.lastSeen = new Date().toISOString();

    bus.emit('deviceUpdate', { userId, device: { ...device } });
    return { ...device };
}

async function getDeviceStatus(userId, deviceId) {
    const devs = getUserDevices(userId);
    const device = devs.get(deviceId);
    if (!device) throw new Error('Device not found');

    let status;
    if (device.protocol === 'shelly') {
        try { status = await shellyStatus(device); } catch { status = { isOn: device.isOn, wattage: device.wattage }; }
    } else if (device.protocol === 'http' && device.statusUrl) {
        try { status = await httpStatus(device); } catch { status = { isOn: device.isOn, wattage: device.wattage }; }
    } else {
        // For simulated/kasa/tuya — return stored state + slight wattage jitter
        status = { isOn: device.isOn, wattage: simWattage(device.type, device.isOn) };
    }

    device.isOn = status.isOn;
    device.wattage = status.wattage;
    device.lastSeen = new Date().toISOString();
    return { ...device, ...status };
}

// Seed demo devices for the first demo user
const DEMO_DEVICES = [
    { name: 'OnePlus TV', type: 'tv', protocol: 'androidtv', ip: '192.168.29.158', isOn: false },
    { name: 'Hall Light', type: 'light', protocol: 'http', toggleUrl: 'http://10.52.93.21/toggle', statusUrl: 'http://10.52.93.21/state', isOn: false },
    { name: 'Bedroom AC', type: 'ac', protocol: 'simulated', isOn: false },
    { name: 'Ceiling Fan', type: 'fan', protocol: 'simulated', isOn: true },
    { name: 'Kitchen Light', type: 'light', protocol: 'simulated', isOn: true },
    { name: 'Laptop Charger', type: 'laptop', protocol: 'simulated', isOn: false },
    { name: 'Water Heater', type: 'water heater', protocol: 'simulated', isOn: false },
];

DEMO_DEVICES.forEach(d => addDevice('USR000001', { ...d, wattage: simWattage(d.type, d.isOn) }));

module.exports = { listDevices, addDevice, removeDevice, toggleDevice, setDeviceState, getDeviceStatus, bus };
