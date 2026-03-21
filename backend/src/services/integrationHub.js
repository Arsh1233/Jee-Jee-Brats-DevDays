/**
 * DISCOM / OEM / Home-Automation Integration Layer
 * ─────────────────────────────────────────────────
 * Scalable service abstraction for integrating with:
 *   1. DISCOMs (Distribution Companies) — tariff feeds, outage APIs, billing
 *   2. Appliance OEMs — device telemetry, firmware updates, diagnostics
 *   3. Home Automation Platforms — Google Home, Alexa, Apple HomeKit
 *
 * This PoC uses simulated adapters. Each adapter follows a standard interface,
 * making it trivial to swap in real API integrations for production.
 */

// ═══════════════════════════════════════════════════════════════════
//  1. DISCOM Integration Layer
// ═══════════════════════════════════════════════════════════════════

class DISCOMAdapter {
    constructor(config) {
        this.provider = config.provider || 'BSES Rajdhani';
        this.region = config.region || 'Delhi';
        this.apiBase = config.apiBase || null;
        this.apiKey = config.apiKey || null;
    }

    /** Fetch real-time ToD tariff from DISCOM API */
    async fetchRealTimeTariff() {
        // PoC: Simulated tariff feed matching DERC ToD structure
        const hour = new Date().getHours();
        const isWinter = [11, 12, 1, 2].includes(new Date().getMonth() + 1);

        const slabs = {
            residential: [
                { range: '0–200', rate: 3.0 },
                { range: '201–400', rate: 4.5 },
                { range: '401–800', rate: 6.5 },
                { range: '800+', rate: 7.0 },
            ],
            commercial: [
                { range: '0–100', rate: 6.0 },
                { range: '100+', rate: 8.5 },
            ],
            industrial: [
                { range: '0–500', rate: 5.5 },
                { range: '500+', rate: 7.5 },
            ],
        };

        // ToD multipliers (DERC-style)
        let todMultiplier = 1.0;
        let todPeriod = 'Normal';
        if (hour >= 14 && hour < 17) { todMultiplier = 1.2; todPeriod = 'Peak'; }
        else if (hour >= 22 || hour < 6) { todMultiplier = 0.9; todPeriod = 'Off-Peak'; }
        else if (hour >= 17 && hour < 22) { todMultiplier = 1.1; todPeriod = 'Shoulder'; }

        return {
            provider: this.provider,
            region: this.region,
            fetchedAt: new Date().toISOString(),
            todPeriod,
            todMultiplier,
            slabs,
            surcharges: {
                electricDuty: 0.05,    // 5%
                pensionTrust: 0.01,    // 1%
                fuelAdjustment: isWinter ? -0.15 : 0.25,
            },
            demandCharges: {
                residential: 125,    // ₹ per kVA/month
                commercial: 275,
                industrial: 350,
            },
            nextRevisionDate: '2026-04-01',
        };
    }

    /** Fetch planned outage schedule */
    async fetchOutageSchedule() {
        return {
            provider: this.provider,
            planned: [
                {
                    id: 'OUT-2026-0312-001',
                    area: 'Sector 14, Dwarka',
                    startTime: '2026-03-13T09:00:00+05:30',
                    endTime: '2026-03-13T14:00:00+05:30',
                    reason: 'Scheduled transformer maintenance',
                    affectedFeeders: ['F14-A', 'F14-B'],
                },
                {
                    id: 'OUT-2026-0315-002',
                    area: 'Janakpuri B-Block',
                    startTime: '2026-03-15T10:00:00+05:30',
                    endTime: '2026-03-15T16:00:00+05:30',
                    reason: 'Underground cable replacement',
                    affectedFeeders: ['F22-C'],
                },
            ],
            unplanned: [],
        };
    }

    /** Submit meter reading to DISCOM */
    async submitMeterReading(meterId, reading) {
        return {
            success: true,
            meterId,
            reading,
            submittedAt: new Date().toISOString(),
            acknowledgementId: `ACK-${Date.now()}`,
            nextBillDate: '2026-04-01',
        };
    }

    /** Fetch billing details from DISCOM */
    async fetchBillingDetails(bpNumber) {
        return {
            bpNumber,
            provider: this.provider,
            connectionType: 'LT-1 Domestic',
            sanctionedLoad: '5 kW',
            currentBill: {
                billNo: `${this.provider.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-8)}`,
                billDate: '2026-03-01',
                dueDate: '2026-03-20',
                amount: 2450,
                consumption: 320,
                todBreakdown: {
                    peak: { units: 120, rate: 8.0, amount: 960 },
                    shoulder: { units: 100, rate: 6.0, amount: 600 },
                    offPeak: { units: 100, rate: 4.0, amount: 400 },
                },
                surcharges: 245,
                total: 2695,
            },
            paymentOptions: ['UPI', 'Net Banking', 'BHIM', 'Bill Desk', 'Paytm'],
        };
    }
}

// ═══════════════════════════════════════════════════════════════════
//  2. OEM Device Integration Layer
// ═══════════════════════════════════════════════════════════════════

class OEMAdapter {
    constructor(config) {
        this.manufacturer = config.manufacturer || 'Generic';
        this.protocol = config.protocol || 'mqtt';
    }

    /** Register a new OEM device */
    async registerDevice(deviceInfo) {
        return {
            deviceId: `OEM-${this.manufacturer.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`,
            manufacturer: this.manufacturer,
            model: deviceInfo.model,
            type: deviceInfo.type,
            protocol: this.protocol,
            capabilities: this.getCapabilities(deviceInfo.type),
            registeredAt: new Date().toISOString(),
            status: 'online',
        };
    }

    /** Get device telemetry */
    async getDeviceTelemetry(deviceId) {
        return {
            deviceId,
            manufacturer: this.manufacturer,
            timestamp: new Date().toISOString(),
            metrics: {
                powerDraw: Math.round(50 + Math.random() * 2000),
                voltage: 220 + Math.round(Math.random() * 20 - 10),
                current: parseFloat((0.5 + Math.random() * 8).toFixed(2)),
                temperature: Math.round(25 + Math.random() * 15),
                runtime: Math.round(Math.random() * 720),
                efficiency: parseFloat((85 + Math.random() * 10).toFixed(1)),
            },
            health: {
                status: 'good',
                lastMaintenance: '2026-01-15',
                nextService: '2026-07-15',
                warrantyExpiry: '2027-03-12',
            },
            firmware: {
                current: '2.4.1',
                latest: '2.5.0',
                updateAvailable: true,
            },
        };
    }

    /** Get device capabilities based on type */
    getCapabilities(type) {
        const caps = {
            'ac': ['on_off', 'temperature', 'mode', 'fan_speed', 'timer', 'energy_report'],
            'washing_machine': ['on_off', 'cycle_select', 'timer', 'energy_report', 'water_level'],
            'refrigerator': ['temperature', 'mode', 'energy_report', 'door_alert'],
            'geyser': ['on_off', 'temperature', 'timer', 'energy_report'],
            'ev_charger': ['on_off', 'charge_rate', 'timer', 'energy_report', 'schedule'],
            'smart_plug': ['on_off', 'energy_report', 'timer', 'schedule'],
            'light': ['on_off', 'brightness', 'color', 'schedule'],
        };
        return caps[type] || ['on_off', 'energy_report'];
    }

    /** Send command to OEM device */
    async sendCommand(deviceId, command) {
        return {
            deviceId,
            command: command.action,
            params: command.params,
            status: 'executed',
            executedAt: new Date().toISOString(),
            responseTime: Math.round(50 + Math.random() * 200),
        };
    }

    /** Request firmware update */
    async requestFirmwareUpdate(deviceId) {
        return {
            deviceId,
            updateId: `FW-${Date.now()}`,
            fromVersion: '2.4.1',
            toVersion: '2.5.0',
            status: 'downloading',
            estimatedTime: '5 minutes',
        };
    }
}

// ═══════════════════════════════════════════════════════════════════
//  3. Home Automation Platform Integration
// ═══════════════════════════════════════════════════════════════════

class HomeAutomationAdapter {
    constructor(config) {
        this.platform = config.platform || 'google_home';
        this.userId = config.userId;
    }

    /** Sync devices with home automation platform */
    async syncDevices(devices) {
        const mapped = devices.map(d => ({
            id: d.id,
            name: d.name,
            type: this.mapDeviceType(d.type),
            traits: this.getTraits(d.type),
            willReportState: true,
            attributes: {
                maxWattage: d.wattage,
                manufacturer: d.manufacturer || 'PowerPilot',
            },
        }));

        return {
            platform: this.platform,
            syncedDevices: mapped.length,
            devices: mapped,
            syncedAt: new Date().toISOString(),
        };
    }

    /** Map internal device types to platform types */
    mapDeviceType(type) {
        const mapping = {
            google_home: {
                'ac': 'action.devices.types.AC_UNIT',
                'light': 'action.devices.types.LIGHT',
                'fan': 'action.devices.types.FAN',
                'washing_machine': 'action.devices.types.WASHER',
                'geyser': 'action.devices.types.WATERHEATER',
                'smart_plug': 'action.devices.types.OUTLET',
                'ev_charger': 'action.devices.types.CHARGER',
            },
            alexa: {
                'ac': 'THERMOSTAT',
                'light': 'LIGHT',
                'fan': 'FAN',
                'washing_machine': 'WASHER',
                'geyser': 'WATER_HEATER',
                'smart_plug': 'SMARTPLUG',
                'ev_charger': 'CHARGER',
            },
            homekit: {
                'ac': 'Thermostat',
                'light': 'Lightbulb',
                'fan': 'Fan',
                'smart_plug': 'Outlet',
            },
        };
        return mapping[this.platform]?.[type] || 'UNKNOWN';
    }

    /** Get traits/capabilities for platform */
    getTraits(type) {
        const traits = {
            'ac': ['OnOff', 'TemperatureSetting', 'FanSpeed', 'Modes', 'EnergyStorage'],
            'light': ['OnOff', 'Brightness', 'ColorSetting'],
            'fan': ['OnOff', 'FanSpeed'],
            'washing_machine': ['OnOff', 'StartStop', 'RunCycle', 'Modes'],
            'geyser': ['OnOff', 'TemperatureSetting', 'Timer'],
            'smart_plug': ['OnOff', 'EnergyStorage'],
            'ev_charger': ['OnOff', 'EnergyStorage', 'StartStop'],
        };
        return traits[type] || ['OnOff'];
    }

    /** Create automation rule */
    async createAutomation(rule) {
        return {
            automationId: `AUTO-${Date.now()}`,
            platform: this.platform,
            trigger: rule.trigger,
            conditions: rule.conditions || [],
            actions: rule.actions,
            enabled: true,
            createdAt: new Date().toISOString(),
        };
    }

    /** Get supported platforms */
    static getSupportedPlatforms() {
        return [
            { id: 'google_home', name: 'Google Home', icon: '🏠', status: 'supported' },
            { id: 'alexa', name: 'Amazon Alexa', icon: '🔵', status: 'supported' },
            { id: 'homekit', name: 'Apple HomeKit', icon: '🍎', status: 'beta' },
            { id: 'smartthings', name: 'Samsung SmartThings', icon: '🔷', status: 'planned' },
            { id: 'tuya', name: 'Tuya / Smart Life', icon: '🟢', status: 'supported' },
            { id: 'matter', name: 'Matter (CSA)', icon: '⚪', status: 'planned' },
        ];
    }
}

// ═══════════════════════════════════════════════════════════════════
//  4. Integration Registry & Factory
// ═══════════════════════════════════════════════════════════════════

const DISCOM_REGISTRY = {
    'BSES_RAJDHANI': new DISCOMAdapter({ provider: 'BSES Rajdhani', region: 'Delhi' }),
    'BSES_YAMUNA': new DISCOMAdapter({ provider: 'BSES Yamuna', region: 'Delhi' }),
    'TATA_POWER_DELHI': new DISCOMAdapter({ provider: 'Tata Power Delhi', region: 'Delhi' }),
    'MSEDCL': new DISCOMAdapter({ provider: 'MSEDCL', region: 'Maharashtra' }),
    'BESCOM': new DISCOMAdapter({ provider: 'BESCOM', region: 'Karnataka' }),
    'CESC': new DISCOMAdapter({ provider: 'CESC', region: 'West Bengal' }),
    'TNEB': new DISCOMAdapter({ provider: 'TANGEDCO', region: 'Tamil Nadu' }),
    'UHBVN': new DISCOMAdapter({ provider: 'UHBVN', region: 'Haryana' }),
};

const OEM_REGISTRY = {
    'DAIKIN': new OEMAdapter({ manufacturer: 'Daikin', protocol: 'mqtt' }),
    'LG': new OEMAdapter({ manufacturer: 'LG', protocol: 'mqtt' }),
    'SAMSUNG': new OEMAdapter({ manufacturer: 'Samsung', protocol: 'wifi' }),
    'VOLTAS': new OEMAdapter({ manufacturer: 'Voltas', protocol: 'mqtt' }),
    'HAVELLS': new OEMAdapter({ manufacturer: 'Havells', protocol: 'zigbee' }),
    'CROMPTON': new OEMAdapter({ manufacturer: 'Crompton', protocol: 'ble' }),
    'ORIENT': new OEMAdapter({ manufacturer: 'Orient', protocol: 'wifi' }),
    'BAJAJ': new OEMAdapter({ manufacturer: 'Bajaj', protocol: 'mqtt' }),
    'TATA_POWER_EZ': new OEMAdapter({ manufacturer: 'Tata Power EZ Home', protocol: 'mqtt' }),
};

function getDISCOM(id) { return DISCOM_REGISTRY[id] || Object.values(DISCOM_REGISTRY)[0]; }
function getOEM(id) { return OEM_REGISTRY[id] || Object.values(OEM_REGISTRY)[0]; }

module.exports = {
    DISCOMAdapter, OEMAdapter, HomeAutomationAdapter,
    DISCOM_REGISTRY, OEM_REGISTRY,
    getDISCOM, getOEM,
};
