/**
 * PowerPilot Backend — Netlify Serverless Function
 * Wraps the Express app with serverless-http for AWS Lambda / Netlify Functions.
 *
 * All /api/* requests are routed here via netlify.toml redirects.
 * WebSocket connections are NOT supported in serverless mode.
 */

const serverless = require('serverless-http');
const app = require('../../src/app');

module.exports.handler = serverless(app);
