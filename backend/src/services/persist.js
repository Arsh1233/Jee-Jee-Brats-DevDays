/**
 * Simple JSON file persistence for in-memory data stores.
 * Saves/loads data to/from D:\pjt\backend\data\*.json
 */
const fs = require('fs');
const path = require('path');

const IS_SERVERLESS = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = IS_SERVERLESS
    ? '/tmp/powerpilot-data'
    : path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Load data from a JSON file. Returns defaultData if file doesn't exist.
 */
function load(filename, defaultData) {
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    try {
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            console.log(`[Persist] ✓ Loaded ${filename} from disk`);
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error(`[Persist] Error loading ${filename}:`, e.message);
    }
    return defaultData;
}

/**
 * Save data to a JSON file. Debounced to avoid excessive writes.
 */
const _timers = {};
function save(filename, data, debounceMs = 500) {
    if (_timers[filename]) clearTimeout(_timers[filename]);
    _timers[filename] = setTimeout(() => {
        const filePath = path.join(DATA_DIR, `${filename}.json`);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (e) {
            console.error(`[Persist] Error saving ${filename}:`, e.message);
        }
    }, debounceMs);
}

module.exports = { load, save };
