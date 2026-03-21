import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: API_BASE });

// ── Admin Dashboard ─────────────────────────────────────
export const fetchDashboard = () => api.get('/api/admin/dashboard').then(r => r.data);

// ── Meters ──────────────────────────────────────────────
export const fetchCurrentMeter = () => api.get('/api/meters/current').then(r => r.data);
export const fetchMeterHistory = (count = 288) => api.get(`/api/meters/history?count=${count}`).then(r => r.data);

// ── Appliances ──────────────────────────────────────────
export const fetchAppliances = () => api.get('/api/appliances').then(r => r.data);
export const toggleAppliance = (id) => api.post(`/api/appliances/${id}/toggle`).then(r => r.data);

// ── Tariffs ─────────────────────────────────────────────
export const fetchTariffs = () => api.get('/api/tariffs').then(r => r.data);
export const updateTariff = (id, data) => api.put(`/api/tariffs/${id}`, data).then(r => r.data);

// ── Users ───────────────────────────────────────────────
export const fetchUsers = () => api.get('/api/users').then(r => r.data);
export const fetchUserDevices = (id) => api.get(`/api/users/${id}/devices`).then(r => r.data);

// ── Optimizer ───────────────────────────────────────────
export const fetchSuggestions = () => api.get('/api/optimizer/suggestions').then(r => r.data);
export const fetchSavings = () => api.get('/api/optimizer/savings').then(r => r.data);
export const fetchEnvironment = () => api.get('/api/optimizer/environment').then(r => r.data);

// ── AI Engine ───────────────────────────────────────────
export const fetchAIHealth = () => api.get('/api/ai/health').then(r => r.data);
export const fetchAIModelStats = () => api.get('/api/ai/models/stats').then(r => r.data);
export const fetchAIForecast = () => api.get('/api/ai/forecast').then(r => r.data);
export const sendAIChat = (message, session_id = 'admin') =>
    api.post('/api/ai/chat', { message, session_id }).then(r => r.data);

export default api;
