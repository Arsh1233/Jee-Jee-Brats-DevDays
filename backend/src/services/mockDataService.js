/**
 * Mock Data Service
 * Simulates smart meter readings and appliance control for the PoC.
 * No real hardware — all data generated in-memory.
 */

// In-memory appliance state
const appliances = [
    { id: 1, name: 'Lamp', type: 'lighting', wattage: 40, isOn: true },
    { id: 2, name: 'Fan', type: 'cooling', wattage: 75, isOn: true },
    { id: 3, name: 'Heater', type: 'heating', wattage: 2000, isOn: false },
];

// Mock bill history (last 18 months)
const billHistory = [
    { month: 'Jan-26', consumption: 102, arrears: 68.9, total: 370, reading: 102 },
    { month: 'Dec-25', consumption: 133, arrears: 71.61, total: 500, reading: 52764 },
    { month: 'Nov-25', consumption: 171, arrears: 205.52, total: 1080, reading: 52631 },
    { month: 'Oct-25', consumption: 263, arrears: 109.44, total: 1490, reading: 52460 },
    { month: 'Sep-25', consumption: 399, arrears: 242.09, total: 2520, reading: 52197 },
    { month: 'Aug-25', consumption: 305, arrears: 4.47, total: 1900, reading: 51798 },
    { month: 'Jul-25', consumption: 579, arrears: 1.13, total: 2560, reading: 51493 },
    { month: 'Jun-25', consumption: 382, arrears: 0.0, total: 1150, reading: 50914 },
    { month: 'May-25', consumption: 556, arrears: 4.1, total: 2260, reading: 50532 },
    { month: 'Apr-25', consumption: 584, arrears: 3.57, total: 2570, reading: 49976 },
    { month: 'Mar-25', consumption: 495, arrears: 1.64, total: 2020, reading: 49392 },
    { month: 'Feb-25', consumption: 311, arrears: 1.69, total: 960, reading: 48897 },
];

// History buffer (last 24 hours of readings, generated on startup)
const history = [];

function initHistory() {
    const now = Date.now();
    for (let i = 288; i >= 0; i--) {          // every 5 min for 24 hrs
        const ts = new Date(now - i * 5 * 60 * 1000);
        const hour = ts.getHours();
        // Simulate usage pattern: low at night, peaks mid-day
        const base = hour >= 6 && hour <= 22
            ? 1.2 + Math.random() * 2.5
            : 0.3 + Math.random() * 0.5;
        history.push({
            timestamp: ts.toISOString(),
            kwh: parseFloat(base.toFixed(4)),
            watt: parseFloat((base * 1000).toFixed(2)),
        });
    }
}
initHistory();

/** Returns the current total wattage based on which appliances are ON */
function getCurrentWatt() {
    let total = appliances
        .filter(a => a.isOn)
        .reduce((sum, a) => sum + a.wattage, 0);
    // Add ±10 % random noise for realism
    total *= (0.9 + Math.random() * 0.2);
    return parseFloat(total.toFixed(2));
}

/** Generate a fresh meter reading */
function generateReading() {
    const watt = getCurrentWatt();
    const reading = {
        timestamp: new Date().toISOString(),
        kwh: parseFloat((watt / 1000).toFixed(4)),
        watt,
    };
    history.push(reading);
    if (history.length > 300) history.shift();
    return reading;
}

/** Get the last N history entries */
function getHistory(n = 288) {
    return history.slice(-n);
}

/** Get all appliance states */
function getAppliances() {
    return appliances.map(a => ({ ...a }));
}

/** Toggle an appliance on/off */
function toggleAppliance(id) {
    const appliance = appliances.find(a => a.id === id);
    if (!appliance) return null;
    appliance.isOn = !appliance.isOn;
    return { ...appliance };
}

/** Set a schedule for an appliance */
function setSchedule(id, startHour, endHour) {
    const appliance = appliances.find(a => a.id === id);
    if (!appliance) return null;
    appliance.schedule = { startHour, endHour, isAuto: true };
    return { ...appliance };
}

/** Get appliance by id */
function getApplianceById(id) {
    const a = appliances.find(a => a.id === id);
    return a ? { ...a } : null;
}

/** Add a new appliance */
function addAppliance(name, type, wattage) {
    const id = appliances.length ? Math.max(...appliances.map(a => a.id)) + 1 : 1;
    const appliance = { id, name, type, wattage: parseInt(wattage) || 100, isOn: false };
    appliances.push(appliance);
    return { ...appliance };
}

/** Delete an appliance */
function deleteAppliance(id) {
    const idx = appliances.findIndex(a => a.id === id);
    if (idx === -1) return null;
    return appliances.splice(idx, 1)[0];
}

/** Get bill history */
function getBillHistory() {
    return billHistory;
}

module.exports = {
    generateReading,
    getHistory,
    getAppliances,
    getApplianceById,
    toggleAppliance,
    setSchedule,
    addAppliance,
    deleteAppliance,
    getBillHistory,
};
