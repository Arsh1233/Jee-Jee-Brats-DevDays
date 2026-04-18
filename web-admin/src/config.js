// In dev mode: empty string → requests go via relative URL → Vite proxy forwards to backend
// In production (Netlify): use the live backend URL
const BACKEND_URL = import.meta.env.VITE_API_URL || '';
export default BACKEND_URL;
