import axios from 'axios';
import { Platform } from 'react-native';

// ── Backend URL config ────────────────────────────────────────────
// For native (Android/iOS): use tunnel or local IP
// For web (Netlify): use the deployed backend URL
const USE_TUNNEL = false;
const NGROK_URL = 'https://powerpilot-api.loca.lt';
const LOCAL_URL = 'http://10.52.93.224:4000';
const PROD_URL = 'https://powerpilot-backend.netlify.app';
// ─────────────────────────────────────────────────────────────────

export const API_BASE = Platform.OS === 'web'
    ? PROD_URL  // Always use the deployed backend when running as web app
    : (USE_TUNNEL ? NGROK_URL : LOCAL_URL);

const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

// â”€â”€ Meters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchCurrentMeter = () => api.get('/api/meters/current').then(r => r.data);
export const fetchMeterHistory = (count = 72) => api.get(`/api/meters/history?count=${count}`).then(r => r.data);

// â”€â”€ Appliances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchAppliances = () => api.get('/api/appliances').then(r => r.data);
export const toggleAppliance = (id) => api.post(`/api/appliances/${id}/toggle`).then(r => r.data);
export const addAppliance = (name, type, wattage) =>
    api.post('/api/appliances', { name, type, wattage }).then(r => r.data);
export const deleteAppliance = (id) => api.delete(`/api/appliances/${id}`).then(r => r.data);
export const setSchedule = (id, startHour, endHour) =>
    api.post(`/api/appliances/${id}/schedule`, { startHour, endHour }).then(r => r.data);

// â”€â”€ Tariffs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchTariffs = () => api.get('/api/tariffs').then(r => r.data);
export const fetchCurrentTariff = () => api.get('/api/tariffs/current').then(r => r.data);

// â”€â”€ Optimizer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchSuggestions = (userId) => api.get(`/api/optimizer/suggestions?userId=${userId}`).then(r => r.data);
export const applySuggestion = (suggestionId, userId) => api.post('/api/optimizer/apply', { suggestionId, userId }).then(r => r.data);
export const fetchSavings = (userId) => api.get(`/api/optimizer/savings?userId=${userId}`).then(r => r.data);
export const fetchEnvironment = (userId) => api.get(`/api/optimizer/environment?userId=${userId}`).then(r => r.data);
export const fetchTariffForecast = () => api.get('/api/tariffs/forecast').then(r => r.data);

// â”€â”€ Bill History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchBillHistory = (userId) => api.get(`/api/bill/history?userId=${userId}`).then(r => r.data);
export const fetchBillSummary = (userId) => api.get(`/api/bill/summary?userId=${userId}`).then(r => r.data);
export const fetchConsumption = (userId, days = 30) => api.get(`/api/bill/consumption?userId=${userId}&days=${days}`).then(r => r.data);

// â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchNotifications = () => api.get('/api/notifications').then(r => r.data);
export const fetchPowerCutAlerts = () => api.get('/api/notifications/powercuts').then(r => r.data);
export const markNotificationRead = (id) => api.patch(`/api/notifications/${id}/read`).then(r => r.data);

// ── Complaints ──────────────────────────────────────────────────────────────
export const fetchComplaints = (userId) => api.get(`/api/complaints?userId=${userId}`).then(r => r.data);
export const submitComplaint = (data) => api.post('/api/complaints', data).then(r => r.data);

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchUsers = () => api.get('/api/users').then(r => r.data);
export const loginUser = (email, bpNumber, password) =>
    api.post('/api/users/login', { email, bpNumber, password }).then(r => r.data);

// â”€â”€ Real Devices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchDevices = (userId) => api.get(`/api/devices?userId=${userId}`).then(r => r.data);
export const addDevice = (userId, opts) => api.post('/api/devices', { userId, ...opts }).then(r => r.data);
export const deleteDevice = (deviceId, userId) => api.delete(`/api/devices/${deviceId}?userId=${userId}`).then(r => r.data);
export const toggleDevice = (deviceId, userId) => api.post(`/api/devices/${deviceId}/toggle?userId=${userId}`).then(r => r.data);
export const fetchDeviceStatus = (deviceId, userId) => api.get(`/api/devices/${deviceId}/status?userId=${userId}`).then(r => r.data);

// ── Flyers ────────────────────────────────────────────────────────────────────
export const fetchFlyers = () => api.get('/api/flyers').then(r => r.data);

// ── Arduino Hardware ────────────────────────────────────────────────────────
export const listArduinoPorts = async () => [];
export const testArduinoConnection = async () => ({ success: false, error: 'Not implemented' });
export const sendArduinoCommand = async () => ({ success: false });

// ── AI Engine ─────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, session_id = 'mobile') =>
    api.post('/api/ai/chat', { message, session_id }).then(r => r.data);
export const sendVoiceCommand = (transcript, session_id = 'mobile') =>
    api.post('/api/ai/voice', { transcript, session_id }).then(r => r.data);
export const transcribeAudio = (fileUri) => {
    const formData = new FormData();
    // Android needs file:// prefix; iOS already has it
    const uri = Platform.OS === 'android' && !fileUri.startsWith('file://') 
        ? `file://${fileUri}` 
        : fileUri;
    formData.append('audio', { uri, name: 'recording.m4a', type: 'audio/mp4' });
    return api.post('/api/ai/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
        transformRequest: (data) => data,  // prevent Axios from serializing FormData
    }).then(r => r.data);
};
export const fetchAIForecast = () => api.get('/api/ai/forecast').then(r => r.data);
export const fetchAIModelStats = () => api.get('/api/ai/models/stats').then(r => r.data);
export const fetchAIHealth = () => api.get('/api/ai/health').then(r => r.data);

// ── Smart Nudges & Integrations ──────────────────────────────────
export const fetchSmartNudges = () => api.get('/api/integrations/nudges').then(r => r.data);
export const fetchDISCOMTariff = (provider) => api.get(`/api/integrations/discom/tariff?provider=${provider || ''}`).then(r => r.data);
export const fetchDISCOMOutages = (provider) => api.get(`/api/integrations/discom/outages?provider=${provider || ''}`).then(r => r.data);
export const fetchDISCOMProviders = () => api.get('/api/integrations/discom/providers').then(r => r.data);
export const fetchOEMTelemetry = (deviceId, mfr) => api.get(`/api/integrations/oem/telemetry?deviceId=${deviceId}&manufacturer=${mfr}`).then(r => r.data);
export const fetchHomePlatforms = () => api.get('/api/integrations/home/platforms').then(r => r.data);

// WebSocket URL (used by LiveDevicesScreen)
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

export default api;
