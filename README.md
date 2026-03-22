# ⚡ PowerPilot — Smart Energy Management System

> An AI-powered full-stack energy management platform for smart homes and DISCOMs. PowerPilot combines a **React Native mobile app**, a **Node.js backend**, a **Python Flask ML engine**, and a **React web admin portal** into one unified system.


## 📱 Mobile App — Screenshots

<div align="center">

| Login | Dashboard | Home Menu |
|-------|-----------|-----------|
| ![WhatsApp Image 2026-03-22 at 10 48 13 AM](https://github.com/user-attachments/assets/72df4de5-b96f-42e2-9976-a1222d607ee5) | ![WhatsApp Image 2026-03-22 at 10 48 14 AM](https://github.com/user-attachments/assets/099b4fce-6487-4198-a1bc-270d754ef956) | ![WhatsApp Image 2026-03-22 at 10 48 40 AM (1)](https://github.com/user-attachments/assets/267d8735-7414-4c26-8c51-0cb0601a87bd)|

| Live Devices | Add Device |
|--------------|------------|
| ![WhatsApp Image 2026-03-22 at 10 48 15 AM](https://github.com/user-attachments/assets/22d0ea8a-5357-431a-8d48-2f7d3616b813) | ![WhatsApp Image 2026-03-22 at 10 48 15 AM (1)](https://github.com/user-attachments/assets/fcde3dc3-dacf-4581-b7d9-953eb6160419)|

</div>

---

## 🏗️ Architecture

<img src="https://github.com/user-attachments/assets/fe6ca8b3-f7ad-470a-8fd1-125624b58b97" width="100%"/>

```
Mobile App  ─┐
             ├──► Netlify Backend (Node.js/Express) ──► Render AI Engine (Python/Flask)
Web Admin   ─┘              │
                     PostgreSQL / In-memory DB
```

---

## 📁 Repository Structure

```
PowerPilot/
├── backend/          ← Node.js + Express API + WebSocket
├── mobile/           ← React Native / Expo mobile app
├── ai-models/        ← Python Flask ML engine (6 models)
├── web-admin/        ← React + Vite admin portal
└── render.yaml       ← Render deploy config (AI engine)
```

---

## 🔧 Backend (`/backend`)

**Stack:** Node.js · Express · WebSocket (`ws`) · serverless-http (Netlify Functions)

### REST API Routes

| Prefix | Description |
|--------|-------------|
| `/api/meters` | Live meter readings + history |
| `/api/appliances` | Virtual appliance CRUD, toggle, schedule |
| `/api/tariffs` | Time-of-Day tariff + 24h forecast |
| `/api/users` | Login, user profile, admin CRUD |
| `/api/devices` | Real IoT device control (6 protocols) |
| `/api/optimizer` | AI shift suggestions + savings |
| `/api/bill` | Bill history, monthly summary |
| `/api/notifications` | Alerts, power-cut notices |
| `/api/complaints` | File + track + resolve complaints |
| `/api/flyers` | Promo flyer CRUD + image upload |
| `/api/ai` | Proxy → Python AI Engine |
| `/api/integrations` | DISCOM / OEM / HomeKit adapters |

### IoT Device Protocols
`simulated` · `shelly` · `http` · `tuya` · `kasa` · `androidtv`

### WebSocket (`ws://host:4000/ws`)
- Pushes **live meter readings** every 3 seconds
- Broadcasts `DEVICE_UPDATE` events on state changes

### Smart Nudge Engine
AI-powered tariff nudges:
- ⚡ Peak hour warnings (₹8/kWh)
- 🌙 Overnight shift recommendations (save up to ₹1,488/month)
- ☀️ Solar window tips (10 AM–2 PM)
- 🔔 Pre-peak alerts (≤2h before rate changes)

---

## 📱 Mobile App (`/mobile`)

**Stack:** React Native 0.83 · Expo SDK 55 · React Navigation 7 · Axios

### Key Screens (16 total)

| Screen | Features |
|--------|----------|
| **Login** | Email + BP number + password auth |
| **Dashboard** | Live KPIs, sparkline chart, PowerBot chatbot, voice assistant, flyer carousel, smart nudges |
| **Live Devices** | Real IoT device list, toggle via WebSocket, live wattage |
| **Add Device** | Protocol selection (Shelly, Tuya, Kasa, ADB, HTTP, Simulated) |
| **Appliances** | Virtual appliance management + ToD-aware scheduling |
| **Optimizer** | AI shift suggestions + one-tap apply + savings forecast |
| **Bill History** | Monthly bills, trends, comparisons |
| **Voice AI** | Speech recording → intent classification → action |
| **Carbon Tracker** | CO₂ savings + achievement badges (🌱→🌍 Planet Guardian) |
| **Complaints** | File + track complaints by category |
| **AI Insights** | Live stats for all 6 ML models |

### Test Credentials
```
Email:    rohit0001@powerpilot.io
BP No:    BP-1000001
Password: Pass@1000
```

---

## 🤖 AI Engine (`/ai-models`)

**Stack:** Python 3.11 · Flask 3.0 · scikit-learn 1.3 · Render (free tier)

### 6 Trained ML Models

| Model | Algorithm | Accuracy |
|-------|-----------|----------|
| 🎙️ Intent Classifier | TF-IDF + SVM | **99.94%** |
| 💬 Query Classifier | TF-IDF + Random Forest | **94.00%** |
| 📈 Demand Forecaster | Gradient Boosting | R² = **0.984** |
| 📊 Consumption Predictor | Gradient Boosting | R² = **0.802** |
| 🔍 Anomaly Detector | Isolation Forest | 5% contamination |
| 👥 User Segmenter | K-Means (5 clusters) | — |

### Flask API Endpoints
```
GET  /api/ai/health          → Service health + model load status
POST /api/ai/chat            → ML chatbot (NLU + response generation)
POST /api/ai/voice           → Voice intent classification + action
GET  /api/ai/forecast        → 24h demand + tariff forecast
GET  /api/ai/models/stats    → All 6 model metrics + file sizes
```

> ⚠️ **Free tier cold start:** First request after 15min idle takes ~50s to wake up.

---

## 🖥️ Web Admin Portal (`/web-admin`)

**Stack:** React 18 · Vite 5 · React Router 6 · Recharts · Axios

### Admin Pages (11 total)

| Page | Description |
|------|-------------|
| **Dashboard** | System KPIs: users, complaints, devices, AI health |
| **User Management** | Full CRUD for 1,000+ users |
| **Complaints** | Queue: pending → in-progress → resolved |
| **Notifications** | Broadcast alerts + power-cut notices |
| **Tariff Management** | Set peak/off-peak ToD slabs |
| **Optimizer** | AI suggestion stats + savings analytics |
| **AI Models** | Live accuracy, F1, RMSE for all 6 models |
| **Flyers** | Create/manage marketing flyers with image upload |
| **Integrations** | DISCOM / OEM / HomeKit status |
| **Environment** | Carbon footprint + environmental impact |

---

## ⚙️ Setup & Running Locally

### 1. Backend
```bash
cd backend
npm install
node src/index.js          # runs on port 4000
```

### 2. Mobile App
```bash
cd mobile
npm install
npx expo start             # scan QR with Expo Go
# or for web:
npx expo start --web
```

### 3. AI Engine
```bash
cd ai-models
pip install -r requirements.txt
python api_server.py       # runs on port 5000
```

### 4. Web Admin
```bash
cd web-admin
npm install
npm run dev                # runs on port 5173
```

---

## 🌍 Environment Variables

### Backend (Netlify)
| Variable | Description |
|----------|-------------|
| `AI_API_HOST` | Render AI engine URL (`https://powerpilot-ai-yoj0.onrender.com`) |

### Mobile (`mobile/src/services/api.js`)
| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Production backend (`https://powerpilot-backend.netlify.app`) |

### Web Admin (`web-admin/src/config.js`)
| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Production backend URL |

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.83 + Expo SDK 55 |
| Backend | Node.js + Express + serverless-http |
| AI Engine | Python 3.11 + Flask + scikit-learn |
| Web Admin | React 18 + Vite 5 + Recharts |
| Hosting | Netlify (backend, mobile, web-admin) + Render (AI) |
| Real-time | WebSocket (`ws` library) |
| IoT | Shelly, Tuya, Kasa, ADB, HTTP |
| Auth | BP number + email + password (JWT-ready) |

---

## 📊 AI Model Performance

See [`ai-models/MODEL_STATS.md`](ai-models/MODEL_STATS.md) for full training metrics, per-intent breakdowns, feature importances, and cluster analysis.

---

*Built for INSTINCTS 4.0 Hackathon — Team Hesignbugs #403*
