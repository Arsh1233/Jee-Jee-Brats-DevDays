/**
 * Synthetic Dataset — 1 000 PowerPilot users
 * Generates deterministic, realistic data for the PoC demo.
 * Run once on server start; all data lives in memory.
 */

const TOTAL_USERS = 1000;
const CONNECTION_TYPES = ['residential', 'commercial', 'industrial'];
const FIRST_NAMES = ['Arsh', 'Priya', 'Raj', 'Neha', 'Amit', 'Sunita', 'Vikram', 'Deepa', 'Suresh', 'Kavya',
    'Rohit', 'Ananya', 'Sanjay', 'Pooja', 'Kiran', 'Meera', 'Ajay', 'Sneha', 'Anil', 'Divya',
    'Rahul', 'Nisha', 'Mahesh', 'Rekha', 'Gopal', 'Lata', 'Ravi', 'Uma', 'Vijay', 'Geeta',
    'Arun', 'Sonia', 'Mohan', 'Radha', 'Kishore', 'Sarla', 'Naresh', 'Shobha', 'Ramesh', 'Asha'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Yadav', 'Mehta', 'Shah',
    'Mishra', 'Chauhan', 'Pandey', 'Dubey', 'Tiwari', 'Rao', 'Reddy', 'Nair', 'Pillai', 'Menon',
    'Iyer', 'Agarwal', 'Bansal', 'Kapoor', 'Malhotra', 'Chopra', 'Khanna', 'Sinha', 'Bose', 'Das'];

const APPLIANCE_TEMPLATES = {
    residential: [
        { name: 'Refrigerator', type: 'cooling', wattage: 150, alwaysOn: true },
        { name: 'AC', type: 'cooling', wattage: 1500 },
        { name: 'Fan', type: 'cooling', wattage: 75 },
        { name: 'TV', type: 'entertainment', wattage: 120 },
        { name: 'Washing Machine', type: 'appliance', wattage: 500 },
        { name: 'Water Heater', type: 'heating', wattage: 2000 },
        { name: 'Microwave', type: 'appliance', wattage: 800 },
        { name: 'Lights', type: 'lighting', wattage: 60, alwaysOn: true },
    ],
    commercial: [
        { name: 'HVAC System', type: 'cooling', wattage: 5000, alwaysOn: true },
        { name: 'Computers', type: 'office', wattage: 800, alwaysOn: true },
        { name: 'Server Rack', type: 'office', wattage: 1200, alwaysOn: true },
        { name: 'Lighting Array', type: 'lighting', wattage: 400, alwaysOn: true },
        { name: 'Elevator', type: 'appliance', wattage: 7500 },
        { name: 'Coffee Machine', type: 'appliance', wattage: 1000 },
    ],
    industrial: [
        { name: 'Motor Drive 1', type: 'motor', wattage: 15000, alwaysOn: true },
        { name: 'Motor Drive 2', type: 'motor', wattage: 12000 },
        { name: 'Compressor', type: 'motor', wattage: 8000, alwaysOn: true },
        { name: 'Press Machine', type: 'machinery', wattage: 20000 },
        { name: 'HVAC Industrial', type: 'cooling', wattage: 10000, alwaysOn: true },
        { name: 'Lighting Grid', type: 'lighting', wattage: 2000, alwaysOn: true },
    ],
};

const BILL_MONTHS = ['Apr-24', 'May-24', 'Jun-24', 'Jul-24', 'Aug-24', 'Sep-24',
    'Oct-24', 'Nov-24', 'Dec-24', 'Jan-25', 'Feb-25', 'Mar-25',
    'Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25',
    'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26'];

/** Simple deterministic RNG seeded by a number */
function seededRand(seed) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

/** Generate 30-day hourly consumption profile (720 data points) */
function genConsumptionProfile(avgKwh, connType, rand) {
    const profile = [];
    const now = Date.now();
    for (let d = 29; d >= 0; d--) {
        for (let h = 0; h < 24; h++) {
            const ts = new Date(now - d * 86400000 + h * 3600000);
            let base;
            if (connType === 'residential') {
                // Morning peak 7-9, evening peak 18-22
                base = (h >= 7 && h <= 9) || (h >= 18 && h <= 22)
                    ? avgKwh * (1.4 + rand() * 0.4)
                    : (h >= 1 && h <= 5)
                        ? avgKwh * (0.2 + rand() * 0.15)
                        : avgKwh * (0.7 + rand() * 0.4);
            } else if (connType === 'commercial') {
                // Business hours 9-18 heavy, off-hours low
                base = (h >= 9 && h <= 18)
                    ? avgKwh * (1.2 + rand() * 0.6)
                    : avgKwh * (0.15 + rand() * 0.1);
            } else {
                // Industrial: 3 shifts
                base = avgKwh * (0.8 + rand() * 0.5);
            }
            profile.push({
                timestamp: ts.toISOString(),
                kwh: parseFloat(base.toFixed(4)),
                watt: parseFloat((base * 1000).toFixed(1)),
            });
        }
    }
    return profile;
}

/** Generate realistic bill history */
function genBillHistory(avgMonthlyKwh, connType, rand) {
    const tariffRate = connType === 'industrial' ? 6.5 : connType === 'commercial' ? 7.0 : 5.5;
    let reading = 10000 + Math.floor(rand() * 50000);
    return BILL_MONTHS.map((month, i) => {
        // Seasonal variation: summer (May-Sep) higher, winter lower
        const mIdx = i % 12;
        const seasonal = [0.8, 1.0, 1.3, 1.5, 1.4, 1.2, 0.9, 0.8, 0.7, 0.8, 0.9, 0.85][mIdx];
        const consumption = Math.round(avgMonthlyKwh * seasonal * (0.85 + rand() * 0.3));
        const amount = Math.round(consumption * tariffRate * (1 + rand() * 0.15));
        const arrears = rand() > 0.8 ? parseFloat((rand() * 200).toFixed(2)) : 0;
        const total = amount + arrears;
        const dueDate = new Date(2024, 3 + i, 20).toLocaleDateString('en-IN');
        reading += consumption;
        return {
            month,
            consumption,
            reading,
            amount,
            arrears,
            total,
            dueDate,
            paid: i < 20 ? (rand() > 0.05) : (rand() > 0.6),
        };
    }).reverse(); // most recent first
}

// ── Main generation ──────────────────────────────────────────────────
const users = [];
const usersByBP = new Map();
const usersByEmail = new Map();

console.log('[SeedData] Generating 1 000 users…');
for (let i = 0; i < TOTAL_USERS; i++) {
    const rand = seededRand(i * 7919 + 42);
    const fn = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const num = String(i + 1).padStart(4, '0');
    const connType = CONNECTION_TYPES[Math.floor(rand() * CONNECTION_TYPES.length)];
    const sanctionedLoad = connType === 'industrial' ? 50 + Math.floor(rand() * 150)
        : connType === 'commercial' ? 10 + Math.floor(rand() * 40)
            : 2 + Math.floor(rand() * 8);

    // Pick appliances for this user
    const templates = APPLIANCE_TEMPLATES[connType];
    const count = 2 + Math.floor(rand() * (templates.length - 1));
    const appliances = templates.slice(0, count).map((t, idx) => ({
        id: idx + 1,
        name: t.name,
        type: t.type,
        wattage: t.wattage,
        isOn: t.alwaysOn || rand() > 0.5,
        alwaysOn: !!t.alwaysOn,
    }));

    const avgMonthlyKwh = connType === 'industrial' ? 4000 + Math.floor(rand() * 6000)
        : connType === 'commercial' ? 800 + Math.floor(rand() * 1200)
            : 100 + Math.floor(rand() * 400);
    const avgHourlyKwh = avgMonthlyKwh / 720;

    const user = {
        userId: `USR${String(i + 1).padStart(6, '0')}`,
        bpNumber: `BP-10${String(i + 1).padStart(5, '0')}`,
        email: `${fn.toLowerCase()}${num}@powerpilot.io`,
        password: `Pass@${1000 + i}`,   // plain text for PoC; hash in prod
        name: `${fn} ${ln}`,
        phone: `+91 ${9000000000 + i}`,
        address: `${Math.floor(rand() * 999) + 1}, ${ln} Nagar, Block-${String.fromCharCode(65 + Math.floor(rand() * 6))}`,
        city: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'][Math.floor(rand() * 8)],
        connType,
        sanctionedLoad,
        meterId: `MTR${String(i + 1).padStart(8, '0')}`,
        billHistory: genBillHistory(avgMonthlyKwh, connType, rand),
        consumptionProfile: genConsumptionProfile(avgHourlyKwh, connType, rand),
        appliances,
        autoOptimize: rand() > 0.6,
        isActive: rand() > 0.03,
    };
    users.push(user);
    usersByBP.set(user.bpNumber, user);
    usersByEmail.set(user.email, user);
}
console.log(`[SeedData] ✓ Generated ${users.length} users`);

module.exports = { users, usersByBP, usersByEmail };
