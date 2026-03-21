# ⚡ PowerPilot — Smart Energy Management System

> A full-stack AI-powered energy management platform designed for the modern smart home and grid. PowerPilot combines a React Native mobile app, a Node.js backend, a Flask ML engine, and a React web admin portal into a unified system that gives users real-time control over energy consumption, appliances, bills, and carbon footprint.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Module 1 — Backend API (`/backend`)](#4-module-1--backend-api-backend)
5. [Module 2 — Mobile App (`/mobile`)](#5-module-2--mobile-app-mobile)
6. [Module 3 — AI Engine (`/ai-models`)](#6-module-3--ai-engine-ai-models)
7. [Module 4 — Web Admin Portal (`/web-admin`)](#7-module-4--web-admin-portal-web-admin)
8. [API Reference](#8-api-reference)
9. [AI Models Reference](#9-ai-models-reference)
10. [IoT Device Protocols](#10-iot-device-protocols)
11. [Real-Time Features (WebSocket)](#11-real-time-features-websocket)
12. [Integration Layer](#12-integration-layer)
13. [Smart Nudge Engine](#13-smart-nudge-engine)
14. [Setup & Running](#14-setup--running)
15. [Configuration](#15-configuration)
16. [Data & Seed Data](#16-data--seed-data)
17. [Training the AI Models](#17-training-the-ai-models)
18. [Environment Variables & Networking](#18-environment-variables--networking)
19. [Tech Stack Summary](#19-tech-stack-summary)
20. [Known Notes & Limitations](#20-known-notes--limitations)

---

## 1. Project Overview

PowerPilot is a hackathon-grade full-stack application built for energy distribution companies (DISCOMs) and their customers. It provides:

- 📱 **Consumer Mobile App** (React Native / Expo) — Smart energy dashboard, AI assistant, device control, bill history, complaints, carbon tracker
- 🖥️ **Web Admin Portal** (React / Vite) — Full administrative back-office for managing users, tariffs, notifications, complaints, flyers, AI model stats, and integrations
- 🔧 **Backend API** (Node.js / Express) — REST API + WebSocket server powering all clients
- 🤖 **AI Engine** (Python / Flask / scikit-learn) — 6 trained ML models for intent classification, consumption prediction, anomaly detection, demand forecasting, and user segmentation

---

## 2. Architecture
<img width="3840" height="2160" alt="Team Details Team name Team leader name Problem Statement" src="https://github.com/user-attachments/assets/fe6ca8b3-f7ad-470a-8fd1-125624b58b97" />




**Communication:**
- Mobile ↔ Backend: `HTTP REST` + `WebSocket` at `ws://host:4000/ws`
- Web Admin ↔ Backend: `HTTP REST`
- Backend ↔ AI Engine: `HTTP` proxy through `/api/ai/*` routes (forwarded from Express to Flask on port 5000)
- Backend serves Mobile and Admin as static SPA builds from `mobile/dist` and `web-admin/dist`

---

## 3. Repository Structure

```
pjt/
├── README.md                     ← This file
├── package.json                  ← Root-level scripts (optional orchestration)
├── .gitignore
│
├── backend/                      ← Node.js / Express API + WebSocket server
│   ├── src/
│   │   ├── index.js              ← Entry point, server setup, WebSocket
│   │   ├── routes/               ← 13 Express routers
│   │   │   ├── admin.js
│   │   │   ├── ai.js             ← Proxy to Flask AI engine
│   │   │   ├── appliances.js
│   │   │   ├── bills.js
│   │   │   ├── complaints.js
│   │   │   ├── devices.js
│   │   │   ├── flyers.js
│   │   │   ├── integrations.js
│   │   │   ├── meters.js
│   │   │   ├── notifications.js
│   │   │   ├── optimizer.js
│   │   │   ├── tariffs.js
│   │   │   └── users.js
│   │   ├── services/             ← Core business logic
│   │   │   ├── deviceBroker.js   ← Multi-protocol IoT device control
│   │   │   ├── integrationHub.js ← DISCOM / OEM / HomeKit adapters
│   │   │   ├── mockDataService.js
│   │   │   ├── persist.js
│   │   │   ├── smartNudgeEngine.js ← AI-powered smart tariff nudges
│   │   │   └── tariffOptimizer.js
│   │   ├── db/
│   │   │   └── seedData.js       ← In-memory mock user / meter data
│   │   └── middleware/
│   ├── public/                   ← Static assets
│   └── uploads/                  ← Uploaded flyer images (multer)
│
├── mobile/                       ← React Native / Expo mobile app
│   ├── App.js                    ← Navigation setup (Bottom Tabs)
│   ├── app.json                  ← Expo config
│   ├── src/
│   │   ├── screens/              ← 16 screens
│   │   │   ├── DashboardScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── AIInsightsScreen.js
│   │   │   ├── AppliancesScreen.js
│   │   │   ├── ArduinoScreen.js
│   │   │   ├── BillHistoryScreen.js
│   │   │   ├── CarbonScreen.js
│   │   │   ├── ComplaintsScreen.js
│   │   │   ├── ConsumptionScreen.js
│   │   │   ├── LiveDevicesScreen.js
│   │   │   ├── NotificationsScreen.js
│   │   │   ├── OptimizerScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── SavingsScreen.js
│   │   │   ├── ServiceMapScreen.js
│   │   │   └── VoiceAssistantScreen.js
│   │   ├── services/
│   │   │   └── api.js            ← All API calls (axios)
│   │   ├── components/
│   │   │   └── MenuButton.js
│   │   ├── contexts/
│   │   ├── i18n/
│   │   └── theme.js
│   └── assets/
│
├── ai-models/                    ← Python / Flask AI engine
│   ├── api_server.py             ← Flask REST API (port 5000)
│   ├── config.py                 ← Shared settings & constants
│   ├── main.py                   ← CLI entry point
│   ├── train.py                  ← Training orchestrator for all 6 models
│   ├── test.py                   ← Model evaluation / smoke tests
│   ├── requirements.txt
│   ├── MODEL_STATS.md            ← Full training metrics report
│   ├── models/                   ← Trained .joblib files (12 files)
│   ├── data/                     ← Training datasets (.json)
│   ├── voice_assistant/          ← Voice intent classifier + handler chain
│   │   ├── assistant.py          ← Orchestrator
│   │   ├── intent_engine.py      ← ML + keyword fallback
│   │   ├── ml_intent_classifier.py
│   │   └── handlers/
│   │       └── all_handlers.py
│   ├── chatbot/                  ← Chatbot query classifier + response gen
│   ├── optimizer/                ← Consumption predictor, anomaly detector
│   └── scheduler/                ← Demand forecaster, user segmenter
│
└── web-admin/                    ← React / Vite admin SPA
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx               ← Router + sidebar layout
    │   ├── main.jsx
    │   ├── index.css             ← Global design system (dark theme)
    │   ├── pages/                ← 11 admin pages
    │   │   ├── Dashboard.jsx
    │   │   ├── UserManagement.jsx
    │   │   ├── Complaints.jsx
    │   │   ├── Notifications.jsx
    │   │   ├── TariffManagement.jsx
    │   │   ├── Optimizer.jsx
    │   │   ├── Appliances.jsx
    │   │   ├── AIModels.jsx
    │   │   ├── Flyers.jsx
    │   │   ├── Integrations.jsx
    │   │   └── Environment.jsx
    │   ├── components/
    │   └── services/
    └── dist/                     ← Production build output
```

---

## 4. Module 1 — Backend API (`/backend`)

### Technology Stack
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express 4.18 |
| Real-time | `ws` (WebSocketServer) |
| Database | In-memory (seed data) — PostgreSQL (`pg`) ready |
| File uploads | `multer` 2.x |
| Firebase | `firebase-admin` 13.x (push notifications) |
| CORS | `cors` |
| IoT (Android TV) | `@devicefarmer/adbkit` |

### Entry Point (`src/index.js`)

- HTTP server on **port 4000** (all interfaces `0.0.0.0`)
- Mounts 13 REST routers under `/api/`
- Serves Mobile SPA from `mobile/dist/` at root `/`
- Serves Admin SPA from `web-admin/dist/` at `/admin`
- Serves uploaded flyers (`multer`) under `/uploads/`
- WebSocket server on path `/ws`
  - Broadcasts real-time meter readings every **3 seconds**
  - Pushes `DEVICE_UPDATE` events to all connected clients when a device state changes

### REST Routes

| Route Prefix | File | Description |
|---|---|---|
| `/api/meters` | `meters.js` | Live meter reading & history |
| `/api/appliances` | `appliances.js` | Virtual appliance CRUD, toggle, schedule |
| `/api/tariffs` | `tariffs.js` | Current ToD tariff, forecast, tariff list |
| `/api/users` | `users.js` | Login, user profile, user CRUD |
| `/api/notifications` | `notifications.js` | Notification feed, power-cut alerts |
| `/api/complaints` | `complaints.js` | Submit, list, update & resolve complaints |
| `/api/optimizer` | `optimizer.js` | AI suggestions, apply, savings, environment |
| `/api/admin` | `admin.js` | Admin dashboard stats, seed data management |
| `/api/bill` | `bills.js` | Bill history, monthly summary, consumption chart |
| `/api/devices` | `devices.js` | Real IoT device CRUD + toggle (via DeviceBroker) |
| `/api/flyers` | `flyers.js` | Promo flyer CRUD + image upload |
| `/api/ai` | `ai.js` | Proxy to Flask AI engine |
| `/api/integrations` | `integrations.js` | DISCOM/OEM/HomeKit integration adapters |
| `/api/health` | (inline) | Health check: status, uptime, memory, users |

### Services

#### `deviceBroker.js` — Multi-Protocol IoT Controller
The DeviceBroker maintains an in-memory registry of all user devices and routes toggle/status commands to the appropriate protocol driver.

**Supported Protocols:**

| Protocol | Description | Setup |
|---|---|---|
| `simulated` | Default software-only simulation | None |
| `shelly` | Shelly Smart Plug (HTTP relay API) | Set device IP |
| `http` | Generic HTTP on/off URLs | Set `onUrl` / `offUrl` |
| `tuya` | Tuya/Smart Life plugs (tuyapi) | Set `deviceId`, `localKey`, `ip` |
| `kasa` | TP-Link Kasa plugs (tplink-smarthome-api) | Set device IP |
| `androidtv` | Android / OnePlus TV via ADB over TCP | Enable network debugging in TV settings |

**Simulated wattage model** — each device type has a base wattage with ±10% random jitter:
```
tv: 120W  |  ac: 1500W  |  fan: 75W  |  refrigerator: 150W
light: 15W  |  washing machine: 500W  |  laptop: 65W
microwave: 800W  |  water heater: 2000W  |  charger: 10W
```

**Demo Devices** (pre-seeded for `USR000001`):
- OnePlus TV (androidtv @ `192.168.29.158`)
- Bedroom AC (simulated)
- Ceiling Fan (simulated)
- Kitchen Light (simulated)
- Laptop Charger (simulated)
- Water Heater (simulated)

Events are emitted on `deviceBus` and broadcast via WebSocket to all connected clients with type `DEVICE_UPDATE`.

#### `tariffOptimizer.js` — ToD Tariff Engine
Implements a Time-of-Day (ToD) tariff model matching MSPDCL/DERC structures:
- **Peak** (9 AM–11 PM on weekdays): ₹8.0/kWh
- **Off-Peak** (11 PM–9 AM + weekends): ₹4.0/kWh
- Provides 24-hour tariff forecast with hourly slots
- Calculates savings estimates for appliance rescheduling

#### `smartNudgeEngine.js` — Intelligent Energy Nudges
Generates context-aware, appliance-specific nudges in real-time:
1. **Tariff Change Alerts** — warns ≤2h before rate changes (`⚡ Peak in 1h`)
2. **Shift Recommendations** — calculates per-use and monthly savings if an appliance runs off-peak
3. **Peak-Hour Warnings** — for appliances running during ₹8.0/kWh peak hours
4. **Overnight Scheduling** — between 8–10 PM, batches heavy appliances for overnight scheduling
5. **Solar Window Tips** — advises running appliances during 10 AM–2 PM solar peak
Nudges are sorted by priority: `high → medium → low`.

#### `integrationHub.js` — DISCOM / OEM / HomeKit Adapters
Provides pluggable adapter classes following a standard interface:
- **DISCOMAdapter**: Simulates DERC/MSPDCL-style ToD tariff feeds, outage data (with real API keys, swap the stub)
- **OEMAdapter**: Simulates device telemetry, firmware status for appliance OEMs (Voltas, Whirlpool, etc.)
- **HomeAutomationAdapter**: Google Home, Amazon Alexa, Apple HomeKit stubs — all follow the same interface for trivial production swap-in

#### `mockDataService.js`
Generates realistic mock smart meter readings:
- Wattage: 200–2000W with random variation
- Voltage: 225–235V
- Current derived from Watt/Volt
- Power factor: 0.90–0.98

---

## 5. Module 2 — Mobile App (`/mobile`)

### Technology Stack
| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.83.2 |
| Build system | Expo SDK 55 |
| Navigation | React Navigation 7 (Bottom Tabs) |
| HTTP client | Axios 1.6 |
| State | React hooks (useState / useEffect / useContext) |
| Storage | `@react-native-async-storage/async-storage` |
| Audio | `expo-av` (recording + playback) |
| Maps | `react-native-maps` |
| Location | `expo-location` |
| Sharing | `expo-sharing` |
| Camera/Picker | `expo-image-picker` |
| Gradient | `expo-linear-gradient` |
| WebView | `react-native-webview` |
| Screenshot | `react-native-view-shot` |

### Screens (16 total)

#### `LoginScreen.js`
- Email, BP number, and password login
- Persists `userId`, `userName`, `bpNumber` to `AsyncStorage`
![WhatsApp Image 2026-03-22 at 12 15 09 AM (1)](https://github.com/user-attachments/assets/3ace2be6-b167-4f67-9368-77e82f3f9d35)


#### `DashboardScreen.js` ⭐ (Main Hub)
![WhatsApp Image 2026-03-22 at 12 14 59 AM](https://github.com/user-attachments/assets/0e7ee495-92a6-4760-b7d6-f9343c8131ec)
![WhatsApp Image 2026-03-22 at 12 15 08 AM](https://github.com/user-attachments/assets/0bd4408c-0529-4baf-a056-0488f509417b)

The largest screen (1,081 lines). Features:
- **Live KPI cards** — real-time wattage, voltage, daily kWh, cost, CO2
- **Sparkline chart** — last 20 meter readings rendered as bar sparklines
- **Power Cut Banner** — automatically shown with outage alerts from backend
- **AI Chatbot Modal (PowerBot)** — ML-powered Q&A, quick-reply buttons, real-time typing indicator
- **Voice Assistant Modal** — speech recording using `expo-av`, mic permission flow, pulse animation while recording, transcription via `/api/ai/transcribe`, intent classification with confidence badge, auto-files complaints for `file_complaint` intent
- **Flyer Carousel** — 3D perspective card carousel with auto-scroll every 4s, scale/rotateY/opacity parallax
- **Smart Nudge Cards** — real-time tariff nudges from `SmartNudgeEngine`
- **MSPDCL-style icon grid** — 12 quick-access shortcuts across 3 categories (Energy, Devices & AI, Services)
- **Carbon badge** — shows eco achievement badge (🌱 Seedling → 🌍 Planet Guardian)
- Poll-refresh every 3 seconds for meter + history

#### `VoiceAssistantScreen.js`
- Full-page voice + text command interface
- Dedicated screen for advanced voice control (separate from Dashboard modal)
- Displays intent + confidence scores on each response bubble
- Mic button with pulse animation

#### `AIInsightsScreen.js`
- Model statistics dashboard (all 6 ML models)
- Accuracy, F1, RMSE metrics with per-model cards
- AI Engine health status
- Model file sizes

#### `AppliancesScreen.js`
- List all appliances with wattage, status, schedule
- Add new appliance (name, type, wattage)
- Toggle on/off
- Schedule appliance with start/end hours (ToD-aware)
- Delete appliance

#### `ArduinoScreen.js`
- Real IoT LED/device control panel (designed for Arduino integration)
- **Quick Turn ON / Turn OFF buttons** — explicitly pass `targetState` to avoid stale React state
- Connection status indicator
- Direct device toggle via backend DeviceBroker

#### `BillHistoryScreen.js`
- Monthly bill cards with amount, units, average daily
- Bill comparison trend

#### `CarbonScreen.js` (39.6 KB — largest screen)
- CO2 emissions tracking and savings calculation
- Environmental impact visualizations
- Achievement badge system (Seedling → Grove Protector → Forest Champion → Planet Guardian)
- Carbon offset certificates

#### `ComplaintsScreen.js`
- File new complaints (category, subject, description, contact)
- Track existing complaints with status badges (pending, in-progress, resolved)
- Realtime complaint ID after submission

#### `ConsumptionScreen.js`
- Hourly / daily / monthly consumption charts
- Peak vs off-peak breakdown

#### `LiveDevicesScreen.js`
- Real-time device list from DeviceBroker
- Add new smart devices (protocol selection: simulated, shelly, http, tuya, kasa, androidtv)
- Toggle devices — WebSocket sync
- Device wattage live readings

#### `NotificationsScreen.js`
- Notification feed (tariff alerts, outage notices, bill reminders)
- Mark as read

#### `OptimizerScreen.js`
- AI-generated suggestions to shift appliance usage
- One-tap "Apply" to schedule
- Projected savings (per-use and per-month)
- 24-hour tariff forecast chart

#### `ProfileScreen.js`
- User profile info, BP number, meter number
- Edit profile
- Connection type indicator
- Logout

#### `SavingsScreen.js`
- Cumulative savings from optimizer actions
- Monthly savings comparison

#### `ServiceMapScreen.js`
- Map-based DISCOM service center locator
- Uses `react-native-maps` + `expo-location`

### Navigation Structure
Bottom tab navigation (React Navigation 7):
- Main tabs: Dashboard, Appliances, Devices, Optimizer, Profile
- Stack screens accessible from Dashboard shortcuts

### API Layer (`src/services/api.js`)
All API calls through a single Axios instance to the configured backend URL.
Two modes (toggled by `USE_TUNNEL` flag):
- **Local WiFi**: `http://192.168.29.210:4000`
- **Tunnel**: `https://powerpilot-api.loca.lt` (localtunnel)
- **Web**: Auto-detects `window.location.port`, falls back to `http://localhost:4000`

Exported functions (30+ API helpers):
```
fetchCurrentMeter, fetchMeterHistory
fetchAppliances, toggleAppliance, addAppliance, deleteAppliance, setSchedule
fetchTariffs, fetchCurrentTariff, fetchTariffForecast
fetchSuggestions, applySuggestion, fetchSavings, fetchEnvironment
fetchBillHistory, fetchBillSummary, fetchConsumption
fetchNotifications, fetchPowerCutAlerts, markNotificationRead
fetchComplaints, submitComplaint
fetchUsers, loginUser
fetchDevices, addDevice, deleteDevice, toggleDevice, fetchDeviceStatus
fetchFlyers
sendChatMessage, sendVoiceCommand, transcribeAudio
fetchAIForecast, fetchAIModelStats, fetchAIHealth
fetchSmartNudges, fetchDISCOMTariff, fetchDISCOMOutages, ...
WS_URL  (for LiveDevicesScreen WebSocket)
```

---

## 6. Module 3 — AI Engine (`/ai-models`)

### Technology Stack
| Component | Technology |
|---|---|
| Runtime | Python 3.10+ |
| API Server | Flask 3.0 + flask-cors 4.0 |
| ML Framework | scikit-learn 1.3+ |
| Data | NumPy 1.24+, Pandas 2.0+, joblib 1.3+ |

Runs on **port 5000** (all interfaces).

### Flask API Endpoints (`api_server.py`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai/health` | GET | Health check, model load status |
| `/api/ai/chat` | POST | Chatbot query classification + response |
| `/api/ai/voice` | POST | Voice intent classification + action response |
| `/api/ai/transcribe` | POST | Audio file → transcript (stub, ready for STT API) |
| `/api/ai/forecast` | GET | 24-hour demand + tariff forecast |
| `/api/ai/predict` | POST | Per-user consumption prediction |
| `/api/ai/anomaly` | POST | Detect anomalies in hourly readings |
| `/api/ai/segment` | POST | Classify user into behavior segment |
| `/api/ai/optimize` | POST | Full optimization: prediction + anomaly + segment |
| `/api/ai/models/stats` | GET | All 6 model metadata, file sizes, training metrics |

### ML Models (6 Models — 11.8 MB total)

#### Model 1: 🎙️ Intent Classifier (Voice + Chatbot NLU)
```
Algorithm:    TF-IDF (1–3 ngrams, 8000 features) + CalibratedClassifierCV(LinearSVC)
Training:     8,000 utterances (5,000 chatbot + 3,000 voice)
Split:        80/20 stratified
Accuracy:     99.94%   |  Macro F1: 0.9994
Files:        intent_classifier.joblib (1,714 KB)
              intent_classes.joblib (1 KB)
```
**10 Intents (all ≥99.38% F1):**
`check_usage` · `check_bill` · `control_device` · `get_tips` · `file_complaint` · `compare_usage` · `check_tariff` · `greet` · `goodbye` · `general_query`

#### Model 2: 💬 Query Classifier (Chatbot Routing)
```
Algorithm:    TF-IDF (1–3 ngrams) + RandomForestClassifier (200 trees)
Training:     3,000 query-type samples
Split:        80/20 stratified
Accuracy:     94.00%   |  Macro F1: 0.9426
Files:        query_classifier.joblib (3,412 KB)
              query_classes.joblib (1 KB)
```
**11 Query Types:** `usage_period` · `comparison` · `bill_analysis` · `peak_analysis` · `forecast` · `tariff_info` · `optimization` · `complaint` · `live_status` · `history` · `general`

#### Model 3: 📈 Demand Forecaster
```
Algorithm:    GradientBoostingRegressor (250 trees, depth 5, lr 0.05)
Training:     8,760 hourly samples (365 days × 24h of grid demand)
Split:        80/20
RMSE:         3.70 MW   |  MAE: 2.93 MW   |  R²: 0.9839
Files:        demand_forecaster.joblib (1,129 KB)
              demand_scaler.joblib (1 KB)
```
**Top Features:** `prev_hour_demand` (85.6%) · `hour_cos` (8.1%) · `hour` (3.7%) · `temperature` (1.9%)

#### Model 4: 📊 Consumption Predictor
```
Algorithm:    GradientBoostingRegressor (300 trees, depth 6, lr 0.05)
Training:     120,000 hourly readings (5,000 user profiles × 24h)
Split:        80/20
RMSE:         31.03 kWh   |  MAE: 6.13 kWh   |  R²: 0.8020
Files:        consumption_predictor.joblib (2,145 KB)
              consumption_scaler.joblib (1 KB)
```
**Top Features:** `avg_hourly_kwh` (87.2%) · `prev_hour_kwh` (7.2%) · `hour_cos` (1.7%)

#### Model 5: 🔍 Anomaly Detector
```
Algorithm:    IsolationForest (200 trees, 5% contamination)
Training:     120,000 hourly readings (same as M4)
Anomalies:    5,996 detected (exactly 5.0%)
Files:        anomaly_detector.joblib (3,347 KB)
              anomaly_scaler.joblib (1 KB)
```
**Features:** `[kwh, hour, hour_sin, hour_cos, is_peak, rolling_mean_3h]`

#### Model 6: 👥 User Segmenter
```
Algorithm:    KMeans (5 clusters, n_init=10)
Training:     10,000 user profiles
Inertia:      8,763.93
Files:        user_segmenter.joblib (40 KB)
              segmenter_scaler.joblib (1 KB)
```
**5 Segments:**
| Segment | Users | Avg kWh/day |
|---|---|---|
| `low_usage` | 3,317 | 3.77 |
| `high_usage` | 3,349 | 0.60 |
| `peak_heavy` | 1,485 | 100.37 |
| `night_owl` | 991 | 127.74 |
| `moderate` | 858 | 161.73 |

### Training Datasets
| Dataset | Records | Size |
|---|---|---|
| `optimizer_training.json` | 20,000 | 94.3 MB |
| `chatbot_intents.json` | 5,000 | 702 KB |
| `query_training.json` | 3,000 | 328 KB |
| `voice_commands.json` | 3,000 | 662 KB |
| **Total** | **31,000** | **95.9 MB** |

Data characteristics:
- Kaggle-quality seasonal and weather-correlated distributions
- 3 connection types: `residential`, `commercial`, `industrial`
- 24 appliance types across 3 categories
- ~5% anomaly injection rate (spike + drop patterns)
- Hindi-English code-switching in voice/chatbot utterances
- Typo injection and filler words for realism

### Voice Assistant Pipeline
```
User Speech → transcribeAudio (audio file upload)
         ↓
  IntentEngine.classify()
    ├── ML Classifier (TF-IDF + SVM, 99.94% accuracy)
    └── Keyword Fallback (if ML fails)
         ↓
  intent → Handler routing
    ├── control_device      → DeviceControlHandler → DeviceBroker
    ├── check_usage         → UsageHandler → /api/meters
    ├── check_bill          → BillHandler → /api/bill
    ├── file_complaint      → ComplaintHandler → /api/complaints
    ├── get_tips            → TipsHandler (rule-based)
    ├── check_tariff        → TariffHandler → /api/tariffs
    ├── greet/goodbye       → GreetHandler
    └── general_query       → GeneralHandler
         ↓
  Response: { text, data, suggestions, intent, confidence }
```

### Chatbot Pipeline
```
User Message → QueryClassifier (TF-IDF + RF, 94% accuracy)
         ↓
  Query type → ChatbotResponseGenerator
    ├── usage_period / history  → consumption data
    ├── bill_analysis           → bill summary
    ├── tariff_info             → current + forecast tariff
    ├── optimization            → AI suggestions
    ├── complaint               → complaint routes
    └── general                → rule-based FAQ
         ↓
  Response: { response: { text, data, suggestions }, query_type }
```

---

## 7. Module 4 — Web Admin Portal (`/web-admin`)

### Technology Stack
| Component | Technology |
|---|---|
| Framework | React 18.3 |
| Build tool | Vite 5.4 |
| Routing | React Router 6.22 |
| Charts | Recharts 2.12 |
| HTTP | Axios 1.6 |
| Auth | Firebase 12.x |

### Admin Pages (11 total)

| Page | Description |
|---|---|
| **Dashboard** | System KPIs: active users, complaints, devices, model health, activity logs |
| **User Management** | Full user CRUD — create, view, edit, disable, reset password, connection type |
| **Complaints** | Complaint queue with status management (pending → in-progress → resolved) |
| **Notifications** | Broadcast notifications and power-cut alerts to users |
| **Tariff Management** | Set ToD tariff slabs, peak/off-peak rates, seasonal adjustments |
| **Optimizer** | View AI suggestion statistics, savings outcomes, per-user recommendation stats |
| **Appliances** | Manage appliance catalog (types, wattage references) |
| **AI Models** | Live model stats: accuracy, training metrics, file sizes, health status for all 6 models |
| **Flyers** | Create and manage marketing flyers — image upload, title, body, badge, link, bg/text/accent color |
| **Integrations** | View DISCOM/OEM/HomeKit integration status and configuration |
| **Environment** | System-wide carbon footprint and environmental impact dashboard |

### Serving
The web admin produces a static SPA build in `web-admin/dist/` which the backend serves at `/admin/*` with history-mode SPA fallback (`index.html` for all admin routes).

---

## 8. API Reference

### Health Check
```
GET /api/health
Response: { status, ts, uptime, users, memoryMB }
```

### Meters
```
GET  /api/meters/current       → { watt, voltage, current, powerFactor, kwh, ts }
GET  /api/meters/history?count=72  → array of readings
```

### Users
```
POST /api/users/login          → { userId, userName, email, bpNumber, token }
GET  /api/users                → array of all users (admin)
GET  /api/users/:id
PUT  /api/users/:id
DELETE /api/users/:id
```

### Appliances
```
GET    /api/appliances         → list of appliances for current user
POST   /api/appliances         → { name, type, wattage } → create
DELETE /api/appliances/:id
POST   /api/appliances/:id/toggle
POST   /api/appliances/:id/schedule  → { startHour, endHour }
```

### Tariffs
```
GET /api/tariffs               → all tariff slabs
GET /api/tariffs/current       → { name, ratePerUnit, label, gridLoad }
GET /api/tariffs/forecast      → 24-hour array of { hour, label, ratePerUnit, gridLoad }
```

### Devices (Real IoT)
```
GET    /api/devices?userId=X           → list devices
POST   /api/devices                    → { userId, name, type, protocol, ip, ... }
DELETE /api/devices/:id?userId=X
POST   /api/devices/:id/toggle?userId=X  → toggles via DeviceBroker
GET    /api/devices/:id/status?userId=X  → live status + wattage
```

### Optimizer
```
GET /api/optimizer/suggestions?userId=X  → AI-generated shift suggestions
POST /api/optimizer/apply               → { suggestionId, userId }
GET /api/optimizer/savings?userId=X     → cumulative savings
GET /api/optimizer/environment?userId=X → { carbonSavedKg, treesEquivalent, ... }
```

### Bill
```
GET /api/bill/history?userId=X         → monthly bill history
GET /api/bill/summary?userId=X         → current month summary
GET /api/bill/consumption?userId=X&days=30  → daily consumption array
```

### Notifications
```
GET   /api/notifications               → all notifications
GET   /api/notifications/powercuts     → power cut alerts
PATCH /api/notifications/:id/read
POST  /api/notifications               → create (admin)
```

### Complaints
```
GET  /api/complaints?userId=X          → user's complaints
POST /api/complaints                   → file new complaint
PUT  /api/complaints/:id               → update status (admin)
```

### Flyers
```
GET    /api/flyers                     → all active flyers
POST   /api/flyers                     → create (with optional image: multipart/form-data)
PUT    /api/flyers/:id
DELETE /api/flyers/:id
```

### AI Engine (proxied via backend)
```
GET  /api/ai/health
POST /api/ai/chat         → { message, session_id } → { response: { text, data, suggestions }, query_type }
POST /api/ai/voice        → { transcript, session_id } → { response: { text, data, suggestions }, intent, confidence }
POST /api/ai/transcribe   → multipart audio → { transcript }
GET  /api/ai/forecast     → demand + tariff forecast
POST /api/ai/predict      → consumption prediction
POST /api/ai/anomaly      → anomaly detection
POST /api/ai/segment      → user segmentation
POST /api/ai/optimize     → full optimization response
GET  /api/ai/models/stats → all 6 model stats + file sizes
```

### Integrations
```
GET /api/integrations/discom/providers
GET /api/integrations/discom/tariff?provider=X
GET /api/integrations/discom/outages?provider=X
GET /api/integrations/oem/telemetry?deviceId=X&manufacturer=Y
GET /api/integrations/home/platforms
GET /api/integrations/nudges
```

---

## 9. AI Models Reference

See [`ai-models/MODEL_STATS.md`](ai-models/MODEL_STATS.md) for complete training metrics, per-intent/per-class breakdowns, feature importances, and cluster analysis.

### Model File Inventory
| File | Size |
|---|---|
| `anomaly_detector.joblib` | 3,347 KB |
| `query_classifier.joblib` | 3,412 KB |
| `consumption_predictor.joblib` | 2,145 KB |
| `intent_classifier.joblib` | 1,714 KB |
| `demand_forecaster.joblib` | 1,129 KB |
| `user_segmenter.joblib` | 40 KB |
| Scalers × 4 + class files × 2 | ~6 KB total |
| `training_metrics.json` | 5 KB |
| **Total** | **~11.8 MB** |

---

## 10. IoT Device Protocols

### Adding a Real Device (via API or `LiveDevicesScreen`)
```json
{
  "userId": "USR000001",
  "name": "Living Room AC",
  "type": "ac",
  "protocol": "shelly",
  "ip": "192.168.1.105"
}
```

### Protocol Setup Guide

#### Shelly Smart Plug
1. Connect Shelly to same WiFi
2. Note Shelly IP (from Shelly app or router DHCP)
3. Add device with `protocol: "shelly"`, `ip: "192.168.x.x"`
4. Backend calls `http://<ip>/relay/0?turn=on|off`

#### Generic HTTP Toggle
1. Any device with an HTTP API for on/off
2. Add device with `protocol: "http"`, `onUrl: "..."`, `offUrl: "..."`

#### Tuya / Smart Life
1. Install: `npm i tuyapi` in `/backend`
2. Get `deviceId` and `localKey` from Tuya developer platform
3. Add device with `protocol: "tuya"`, `deviceId`, `localKey`, `ip`

#### TP-Link Kasa
1. Install: `npm i tplink-smarthome-api` in `/backend`
2. Add device with `protocol: "kasa"`, `ip: "192.168.x.x"`

#### Android TV / OnePlus TV (ADB)
1. On TV: **Settings → Device Preferences → Developer Options → Network debugging → ON**
2. Note TV's IP address
3. Add device with `protocol: "androidtv"`, `ip: "192.168.x.x"`
4. Backend uses `adbkit` to send `input keyevent 224` (wake) or `223` (sleep)

---

## 11. Real-Time Features (WebSocket)

The WebSocket server at `ws://host:4000/ws` pushes two event types:

```js
// Meter reading (every 3 seconds)
{ type: "READING", watt: 1234.5, voltage: 230, current: 5.37, powerFactor: 0.95, kwh: 12.4 }

// Device state change (on toggle)
{ type: "DEVICE_UPDATE", userId: "USR000001", device: { id, name, type, isOn, wattage, ... } }
```

Client connection (from `LiveDevicesScreen.js`):
```js
const ws = new WebSocket(WS_URL); // WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws'
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'READING') updateMeter(msg);
  if (msg.type === 'DEVICE_UPDATE') syncDevice(msg.device);
};
```

---

## 12. Integration Layer

The `IntegrationHub` provides a clean abstraction layer for connecting real external services:

### DISCOM Integration
```
DISCOMAdapter supports:
  • fetchRealTimeTariff()  — ToD tariff structure (DERC/MSPDCL format)
  • fetchOutages()         — Planned/unplanned outage notifications
  • fetchBillingData()     — Consumer bill data
  • syncConsumerData()     — Real-time meter sync
```

Real DISCOM providers (India):
- **Delhi**: BSES Rajdhani, BSES Yamuna, TPDDL
- **Maharashtra**: MSEDCL (MSPDCL), Tata Power
- **Karnataka**: BESCOM
- Production swap: replace stub URLs with DISCOM REST API credentials in adapter constructor

### OEM Integration
```
OEMAdapter supports:
  • fetchTelemetry(deviceId)    — live power, temperature, runtime
  • fetchFirmwareStatus()       — update availability
  • fetchDiagnostics()          — device health
```

### Home Automation Integration
```
HomeAutomationAdapter supports:
  • listConnectedDevices()      — enumerate all paired devices
  • setDeviceState(id, state)   — cross-platform unified control
  • getDeviceState(id)          — current state
Platform stubs: Google Home, Amazon Alexa, Apple HomeKit
```

---

## 13. Smart Nudge Engine

`smartNudgeEngine.js` generates up to 5 types of real-time nudges per API call.

### Appliance Usage Patterns (Input Data)
```
Washing Machine: typical hours [10,11,15,16], 1.5h, interruptible
Dishwasher:      typical hours [13,14,20], 1h, interruptible
Water Heater:    typical hours [6,7,18,19], 0.5h, interruptible
EV Charger:      typical hours [18-20], 4h, interruptible
AC:              typical hours [12-17,22,23], 6h, NOT interruptible
Iron:            typical hours [9,10,17,18], 0.5h, interruptible
Microwave:       typical hours [8,12,19,20], 0.25h, interruptible
Water Pump:      typical hours [7,8,17,18], 1h, interruptible
```

### Nudge Calculation
For each interruptible appliance:
```
kW = wattage / 1000
bestWindow = findBestWindow(duration)  ← slides over 24h tariff forecast
currentCost = kW × duration × currentRate
bestCost    = kW × duration × bestWindow.avgRate
dailySavings = currentCost − bestCost

if dailySavings > ₹1: → generate shift recommendation nudge
  monthlySavings = dailySavings × 30
```

### Example Nudge Output
```json
{
  "id": "nudge-shift-APL001",
  "type": "shift_recommendation",
  "icon": "🔄",
  "priority": "high",
  "title": "Run Washing Machine after 22:00 to save ₹240/month",
  "message": "Your Washing Machine (500W) costs ₹8/use at current rates. Shifting to 22:00–00:00 saves ₹8 every time.",
  "savings": { "perUse": 8.0, "perMonth": 240, "currentRate": 8.0, "bestRate": 4.0 },
  "suggestedWindow": { "start": "22:00", "end": "00:00" },
  "actionLabel": "Auto-Schedule",
  "actionRoute": "Optimizer"
}
```

---

## 14. Setup & Running

### Prerequisites
- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** / physical Android device (for mobile)

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install AI Engine Dependencies
```bash
cd ai-models
pip install -r requirements.txt
```

### Step 3: Train AI Models (first-time only)
```bash
cd ai-models
python train.py
```
This trains all 6 models and saves `.joblib` files to `ai-models/models/`. Takes ~60 seconds.

### Step 4: Start AI Engine
```bash
cd ai-models
python api_server.py
# Running at http://0.0.0.0:5000
```

### Step 5: Start Backend
```bash
cd backend
npm start
# Running at http://0.0.0.0:4000
# WebSocket at ws://0.0.0.0:4000/ws
# Admin portal at http://0.0.0.0:4000/admin
```

### Step 6: Start Mobile App (Development)
```bash
cd mobile
npx expo start
# Then press 'a' for Android, 'i' for iOS, 'w' for Web
```

### Step 7: Start Web Admin (Development)
```bash
cd web-admin
npm install
npm run dev
# Running at http://localhost:5173
```

### Step 8: Build for Production (Optional)
```bash
# Build web admin
cd web-admin && npm run build   # outputs to web-admin/dist/

# Build mobile web
cd mobile && npx expo export --platform web   # outputs to mobile/dist/

# Now backend serves both at :4000
```

---

## 15. Configuration

### Backend (`backend/src/index.js`)
| Setting | Default | Notes |
|---|---|---|
| `PORT` | `4000` | `process.env.PORT` or 4000 |
| Admin SPA path | `../../web-admin/dist` | Built admin portal |
| Mobile SPA path | `../../mobile/dist` | Built mobile web app |
| Uploads dir | `../uploads/` | Flyer images |

### AI Engine (`ai-models/config.py`)
| Setting | Value |
|---|---|
| `APP_NAME` | `PowerPilot AI Engine` |
| `VERSION` | `2.0.0` |
| `MODELS_DIR` | `ai-models/models/` |
| `AI_PORT` | `5000` |
| Peak tariff rate | `₹8.0/kWh` |
| Off-peak rate | `₹4.0/kWh` |
| Peak hours | `9 AM – 11 PM` |

### Mobile (`mobile/src/services/api.js`)
| Setting | Description |
|---|---|
| `USE_TUNNEL` | `false` = local WiFi, `true` = tunnel URL |
| `LOCAL_URL` | `http://192.168.29.210:4000` ← **Change to your machine's IP** |
| `NGROK_URL` | `https://powerpilot-api.loca.lt` ← **Change to your tunnel URL** |

### Web Admin (`web-admin/vite.config.js`)
- Vite dev server on port `5173`
- Configure API proxy if running admin separately from backend

---

## 16. Data & Seed Data

### Mock User Accounts (from `backend/src/db/seedData.js`)
| User ID | Email | Password | BP Number |
|---|---|---|---|
| `USR000001` | `demo@powerpilot.in` | `demo123` | `BP000001` |
| Additional users | seeded at startup | — | — |

### Mock Data Generation
`mockDataService.js` generates realistic meter readings:
```js
generateReading() → {
  watt:        random 200–2000 W
  voltage:     random 225–235 V
  current:     watt / voltage
  powerFactor: random 0.90–0.98
  kwh:         cumulative (increments each call)
  ts:          new Date().toISOString()
}
```

### Persistence
`persist.js` provides lightweight in-memory persistence for development. No external database is required for the PoC. The backend is `pg`-ready (PostgreSQL driver installed) for production.

---

## 17. Training the AI Models

```bash
cd ai-models
python train.py
```

The training script:
1. Loads `data/chatbot_intents.json` + `data/voice_commands.json` → trains **Intent Classifier**
2. Loads `data/query_training.json` → trains **Query Classifier**
3. Generates synthetic 8,760-row time series → trains **Demand Forecaster**
4. Generates 120,000-row user profiles → trains **Consumption Predictor** + **Anomaly Detector** + **User Segmenter**
5. Saves all `.joblib` files to `models/`
6. Saves `models/training_metrics.json` (used by `/api/ai/models/stats`)

You can also run individual components:
```bash
python main.py            # Interactive CLI test
python test.py            # Smoke tests for all 6 models
```

---

## 18. Environment Variables & Networking

### Local Development (Same WiFi)
```
Backend:    http://192.168.x.x:4000   (find your IP: ipconfig/ifconfig)
AI Engine:  http://localhost:5000      (only needs to be reachable from backend)
Mobile:     Update LOCAL_URL in mobile/src/services/api.js
Admin:      http://localhost:5173      (dev) or http://192.168.x.x:4000/admin (built)
```

### Port Summary
| Service | Port | Protocol |
|---|---|---|
| Backend API | 4000 | HTTP + WebSocket |
| AI Engine | 5000 | HTTP |
| Web Admin (dev) | 5173 | HTTP |
| Mobile (Expo dev) | 8081 | HTTP |
| Android TV ADB | 5555 | TCP (ADB) |

### Sharing with Others (Tunnel)
```bash
# Using localtunnel
npx localtunnel --port 4000 --subdomain powerpilot-api
# Set USE_TUNNEL=true and update NGROK_URL in mobile/src/services/api.js
```

---

## 19. Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Mobile framework | React Native | 0.83.2 |
| Mobile build | Expo SDK | 55 |
| Mobile audio | expo-av | 16.x |
| Mobile maps | react-native-maps | 1.26 |
| Admin framework | React | 18.3 |
| Admin build | Vite | 5.4 |
| Admin charts | Recharts | 2.12 |
| Backend runtime | Node.js | 18+ |
| Backend framework | Express | 4.18 |
| Backend WebSocket | ws | 8.16 |
| Backend IoT | @devicefarmer/adbkit | 3.3 |
| Backend push | firebase-admin | 13.7 |
| Backend uploads | multer | 2.x |
| AI runtime | Python | 3.10+ |
| AI framework | Flask | 3.0 |
| ML core | scikit-learn | 1.3+ |
| ML data | pandas + numpy | 2.0+ / 1.24+ |
| ML serialization | joblib | 1.3+ |
| HTTP client (mobile) | axios | 1.6 |
| HTTP client (admin) | axios | 1.6 |
| Navigation | React Navigation | 7 |
| Auth | Firebase | 12.x (admin) |

---

## 20. Known Notes & Limitations

### AI Engine
- **Speech transcription** (`/api/ai/transcribe`) is stubbed and returns a placeholder. Integrate a real STT API (Google Speech-to-Text, Whisper, etc.) in `api_server.py` at the `/transcribe` endpoint.
- The AI engine must be running before the backend starts, or `/api/ai/*` calls will fail gracefully with a 503 error.
- Models are loaded lazily on first request. Cold start may take 1–2 seconds.

### Device Control
- `tuya` protocol requires `npm i tuyapi` in `/backend` (not in `package.json` by default — optional).
- `kasa` protocol requires `npm i tplink-smarthome-api` in `/backend` (optional).
- Android TV ADB control requires the TV to be on the same local network.

### Database
- All data is in-memory (no persistence between restarts). The backend is `pg`-ready — wire up a PostgreSQL connection in `seedData.js`/routes for production.

### Authentication
- Current login is mock (checks against seed data, no JWT expiry). Integrate Firebase Auth or a real JWT system for production.

### Mobile Network
- The `LOCAL_URL` in `api.js` must be updated to your machine's LAN IP for the mobile app to connect. Localhost does not work on a physical device.

### Expo Go vs Dev Build
- `expo-av` (audio recording) requires an Expo Development Build and does not work in Expo Go. Voice recording gracefully degrades: the mic button is hidden if `expo-av` is unavailable.

---

*PowerPilot — Built for the Smart Grid Era ⚡*
