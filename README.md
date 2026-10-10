<div align="center">



\# MoveX



\### Move More. Evolve Together.



\*\*A gamified fitness platform for India, where every activity you log powers your region.\*\*



\[!\[Live Demo](https://img.shields.io/badge/Live%20Demo-movex--1.onrender.com-success?style=for-the-badge)](https://movex-1.onrender.com)

\[!\[API Health](https://img.shields.io/badge/API%20Status-Healthy-blue?style=for-the-badge)](https://movex-zkgd.onrender.com/api/health)



\[!\[React](https://img.shields.io/badge/React-19-61DAFB?logo=react\&logoColor=white)](#tech-stack)

\[!\[Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite\&logoColor=white)](#tech-stack)

\[!\[Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js\&logoColor=white)](#tech-stack)

\[!\[Express](https://img.shields.io/badge/Express-4-000000?logo=express\&logoColor=white)](#tech-stack)

\[!\[MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb\&logoColor=white)](#tech-stack)

\[!\[TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-MoveNet-FF6F00?logo=tensorflow\&logoColor=white)](#ai-features)

\[!\[Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google\&logoColor=white)](#ai-features)

\[!\[TinyFish](https://img.shields.io/badge/TinyFish-Search%20API-FF6B6B)](#ai-features)

\[!\[PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa\&logoColor=white)](#tech-stack)

\[!\[License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)



\*\*\[Live Demo](https://movex-1.onrender.com)\*\* · \*\*\[API Health](https://movex-zkgd.onrender.com/api/health)\*\*



</div>



\---



\## Table of Contents



\- \[What is MoveX?](#what-is-movex)

\- \[AI Features](#ai-features)

\- \[Live Demo](#live-demo)

\- \[Screenshots](#screenshots)

\- \[Tech Stack](#tech-stack)

\- \[Architecture](#architecture)

\- \[Project Structure](#project-structure)

\- \[Local Setup](#local-setup)

\- \[Environment Variables](#environment-variables)

\- \[API Highlights](#api-highlights)

\- \[Testing](#testing)

\- \[Deployment](#deployment)

\- \[Built With AI](#built-with-ai)

\- \[Roadmap](#roadmap)

\- \[License](#license)

\- \[Author](#author)



\---



\## What is MoveX?



MoveX is a \*\*gamified, geographically alive fitness platform\*\* built for India. Athletes log real activities — runs, walks, cycles, and AR workouts — and every minute of movement contributes to their Region, City, State, and India-wide progress on a hierarchical living map.



\*\*The core loop:\*\*

```

Athlete → Region → City → State → India

&#x20;     → Energy earned → Hub levels up

&#x20;     → Leaderboards, Trophies, Rewards

```



\*\*Two account modes:\*\*



| Mode | For | Unlocks |

|---|---|---|

| \*\*BEGINNER\*\* | Personal fitness | Quests, AI Coach, streaks, rewards bazaar |

| \*\*PRO ATHLETE\*\* (₹99) | Competitive athletes | Clans, State Hub, Athlete analytics, Web Bluetooth band, geo-scoped leaderboards |



\### Why it is different



\- \*\*Movement has geography.\*\* Your run today makes your neighbourhood level up — not a solo counter, but a living map of India that responds to real activity.

\- \*\*Verification-first.\*\* An AVS (Activity Verification Score) engine checks motion patterns, GPS consistency, timing, and speed plausibility before awarding rewards. Cheating is expensive.

\- \*\*AI where it matters.\*\* An AI Coach that remembers your context. AR workouts with real-time pose detection. Live gear prices and hyper-local event discovery via TinyFish.

\- \*\*Built for the Indian market.\*\* Rupee-based rewards, hierarchical region model (India → State → City → Region) that matches how Indians think about place.



\---



\## AI Features



MoveX integrates AI as a \*\*core product capability\*\*, not a marketing label.



\### 1. AI Coach — Google Gemini



Powered by `@google/genai` with model `gemini-3.5-flash-lite`.



\- Persistent multi-turn conversations stored in MongoDB

\- AI-generated short conversation titles

\- Full markdown rendering for structured answers

\- Floating chat button (FAB) accessible from every page

\- Defaults to a fresh chat on mount — no stale context

\- Multi-turn memory across sessions



\*\*Where:\*\* `backend/routes/aiCoach.js`, `frontend/src/pages/AICoachPage.jsx`



\### 2. AR Workouts — TensorFlow.js MoveNet



Real-time pose detection running entirely in the browser.



\- Model: \*\*MoveNet SINGLEPOSE\_LIGHTNING\*\*

\- Live skeleton overlay on camera feed

\- Rep counting via a 4-state machine (standing → descending → bottom → ascending)

\- Form rules per exercise (squat, push-up, and more)

\- Enhanced post-workout report with rep accuracy and partials

\- Works offline after first load (PWA cached)



\*\*Where:\*\* `frontend/src/lib/ar/`, `frontend/src/hooks/usePoseEngine.js`, `frontend/src/components/ar/ARWorkoutScreen.jsx`



\### 3. Live Gear Search — TinyFish Search API



Real-time price comparison across Flipkart, Amazon India, and Decathlon.



\- Query is site-scoped for accuracy: `site:flipkart.com OR site:amazon.in OR site:decathlon.in`

\- Extracts the lowest plausible price from each listing snippet (regex-based)

\- Filters by user-set max price, sorts ascending

\- 8 live results in under 2 seconds



\*\*Where:\*\* `backend/services/tinyfishService.js`, `backend/routes/gear.js`, `frontend/src/components/gear/GearSearch.jsx`



\### 4. Dynamic Regional Quests — TinyFish Search API



A weekly cron generates hyper-local fitness events per city.



\- Monday 6 AM IST, iterates over major Indian cities

\- Discovers real marathons, cyclothons, and fitness events

\- Stored as `DynamicEvent` documents in MongoDB (auto-expiring)

\- Users can manually refresh to pull the latest events for their city



\*\*Where:\*\* `backend/services/dynamicQuestCron.js`, `backend/routes/dynamicQuests.js`



\### 5. AVS — Activity Verification Score (rule-based, not ML)



A 10-step verification pipeline that assigns a 0–100 confidence score to every activity:



\- Identity check, device calibration, sensor quality

\- Raw data collection, preprocessing, activity classification

\- Motion pattern verification, GPS validation, timing validation

\- Speed analysis, route analysis, heart rate validation



\*\*Where:\*\* `backend/services/avsEngine.js`



> \*\*Note:\*\* AVS is deliberately rule-based. It is not ML, and it is not called AI in any user-facing text.



\### 6. Athlonia / APEX BLE Band



Web Bluetooth integration for a custom ESP32-S3 wearable.



\- 12-byte legacy Athlonia protocol + 50-byte APEX protocol, auto-dispatched by length

\- Live heart rate, steps, cadence, calories, distance, speed, training load, HRV

\- Multi-subscriber singleton service (connection survives route changes)

\- Data captured during activity and attached to `rawData.band`



\*\*Where:\*\* `frontend/src/services/athloniaBandService.js`, `frontend/src/hooks/useAthloniaBand.js`



\---



\## Live Demo



| Service | URL | Notes |

|---|---|---|

| \*\*Frontend (PWA)\*\* | https://movex-1.onrender.com | Installable. Auto-updates on deploy. |

| \*\*Backend API\*\* | https://movex-zkgd.onrender.com | Health: `/api/health` |

| \*\*Database\*\* | MongoDB Atlas | Cloud cluster |



> The backend runs on Render free tier and sleeps after 15 minutes of inactivity. The first request after sleep may take \~20 seconds to wake. UptimeRobot pings `/api/health` every 14 minutes to keep it warm.



\*\*To test Web Bluetooth and AR features:\*\* use Chrome on Android or Chrome/Edge on desktop. Web Bluetooth is not supported on iOS Safari or Firefox.



\---



\## Screenshots



<!-- Replace these placeholders with real screenshots -->



| Dashboard | Living Map |

|---|---|

| !\[Dashboard](docs/screenshots/dashboard.png) | !\[Living Map](docs/screenshots/map.png) |



| AR Workout | AI Coach |

|---|---|

| !\[AR Workout](docs/screenshots/ar-workout.png) | !\[AI Coach](docs/screenshots/ai-coach.png) |



| Gear Deals (TinyFish) | Local Events (TinyFish) |

|---|---|

| !\[Gear Deals](docs/screenshots/gear-deals.png) | !\[Local Events](docs/screenshots/local-events.png) |



> To add screenshots: create `docs/screenshots/` and drop `.png` files with the names above.



\---



\## Tech Stack



\### Frontend



| Layer | Technology |

|---|---|

| Framework | React 19 |

| Build | Vite 8 |

| Styling | Tailwind CSS v3 + custom glass utilities |

| Animation | Framer Motion |

| Maps | Leaflet + react-leaflet, `india-states.geojson` |

| Charts | Recharts |

| Icons | lucide-react |

| HTTP | axios |

| PWA | Workbox (auto-update on deploy, 5 MB precache limit) |

| PDF export | jspdf |

| Share cards | html-to-image + canvas-confetti |

| Markdown | react-markdown |



\### Backend



| Layer | Technology |

|---|---|

| Runtime | Node.js 20 |

| Framework | Express 4 |

| Database | MongoDB Atlas + Mongoose |

| Auth | JWT (`x-auth-token` header) |

| Realtime | Socket.IO |

| Security | helmet, express-rate-limit, strict CORS |

| Scheduling | node-cron |



\### AI / ML



| Purpose | Technology |

|---|---|

| Pose detection | TensorFlow.js + `@tensorflow-models/pose-detection` (MoveNet) |

| Coach chat | Google Gemini via `@google/genai` |

| Live web data | TinyFish Search API |

| AVS engine | Custom rule-based (no ML) |



\### Hardware



| Feature | API |

|---|---|

| Band pairing | Web Bluetooth |

| Location | Geolocation API |

| Motion | Accelerometer / Gyroscope / Magnetometer |



\---



\## Architecture



```

&#x20;                       +----------------------------+

&#x20;                       |        Frontend            |

&#x20;                       |  React 19 + Vite (PWA)     |

&#x20;                       |  http://localhost:5173     |

&#x20;                       +--------------+-------------+

&#x20;                                      |

&#x20;                                      | REST + WebSocket

&#x20;                                      | (JWT in x-auth-token)

&#x20;                                      v

&#x20;                       +----------------------------+

&#x20;                       |       Backend              |

&#x20;                       |  Express + Socket.IO       |

&#x20;                       |  http://localhost:5000     |

&#x20;                       +--+-------+-------+---------+

&#x20;                          |       |       |

&#x20;             +------------+       |       +--------------+

&#x20;             |                    |                      |

&#x20;             v                    v                      v

&#x20;    +-----------------+   +-----------------+   +---------------------+

&#x20;    |  MongoDB Atlas  |   |  Google Gemini  |   |  TinyFish Search    |

&#x20;    |  (Mongoose)     |   |  (AI Coach)     |   |  (gear + quests)    |

&#x20;    +-----------------+   +-----------------+   +---------------------+



&#x20;             Client-side AI (no server round-trip):

&#x20;             +--------------------------------------------+

&#x20;             |  TensorFlow.js MoveNet (pose detection)    |

&#x20;             |  Web Bluetooth (Athlonia / APEX band)      |

&#x20;             +--------------------------------------------+

```



\*\*Design principles:\*\*



1\. \*\*AI keys never touch the frontend.\*\* Every Gemini and TinyFish call is proxied through the backend.

2\. \*\*Graceful degradation.\*\* Missing sensors, dead GPS, unsupported browsers — each degrades to a working path.

3\. \*\*Idempotent patches.\*\* Backend scripts are re-runnable without duplication.

4\. \*\*Rule-based where ML is overkill.\*\* AVS is deterministic and auditable — no black-box scoring.

5\. \*\*Geographic hierarchy is the schema.\*\* Regions, cities, states are first-class collections, not strings.



\---



\## Project Structure



```

MoveX/

├── backend/

│   ├── server.js                     # DNS workaround + helmet + rate limiters + cron

│   ├── models/                       # User, Activity, Community, Clan, Penalty, AIConversation, DynamicEvent

│   ├── routes/                       # auth, activity, verification, rewards, leaderboard, geo,

│   │                                 # clans, analytics, aiCoach, penalties, gear, dynamicQuests

│   ├── services/

│   │   ├── avsEngine.js              # Activity Verification Score (rule-based)

│   │   ├── penaltyEngine.js          # Inactivity ladder + consistency grace

│   │   ├── tinyfishService.js        # TinyFish Search API wrapper

│   │   ├── dynamicQuestCron.js       # Weekly event discovery

│   │   ├── notificationService.js

│   │   └── questEngine.js

│   └── data/regionHierarchy.js

│

├── frontend/

│   ├── vite.config.js                # @mediapipe/pose alias -> stub

│   ├── tailwind.config.cjs           # MUST be .cjs

│   ├── postcss.config.cjs            # MUST be .cjs

│   ├── public/

│   │   ├── geojson/india-states.geojson

│   │   └── assets/hubs/level\_1..5.webp

│   └── src/

│       ├── App.jsx

│       ├── api.js

│       ├── services/                 # athloniaBandService, sensorService, penaltyApi

│       ├── lib/ar/                   # AR logic (geometry, repCounter, formRules, analyzers)

│       ├── hooks/                    # usePoseEngine, useAthloniaBand

│       ├── components/

│       │   ├── ui/                   # MoveXCard, Button, MoveXGlassPanel, SectionHeader

│       │   ├── layout/               # Sidebar, TopHeader, BottomNavigation, DashboardLayout

│       │   ├── band/                 # AthloniaBandWidget

│       │   ├── gear/                 # GearSearch (TinyFish)

│       │   ├── ar/                   # ARWorkoutScreen

│       │   ├── penalties/            # FriendlyNudge, StrikeIndicator, WinBackBanner

│       │   └── rewards/

│       └── pages/                    # ProDashboard, BeginnerDashboard, AICoachPage,

│                                     # RewardsPage, QuestsPage, Leaderboard, MapPage, ...

│

├── docs/

│   ├── DEVELOPMENT\_NOTES.md          # architecture, conventions, gotchas

│   └── screenshots/                  # README images

│

├── .github/workflows/                # CI (lint + build)

├── LICENSE

└── README.md

```



\---



\## Local Setup



\### Prerequisites



\- \*\*Node.js\*\* 20 or higher

\- \*\*MongoDB\*\* (local install or free Atlas cluster)

\- \*\*Chrome\*\* (required for Web Bluetooth + AR features)



\### 1. Clone the repository



```bash

git clone https://github.com/rupampatil19/MoveX.git

cd MoveX

```



\### 2. Backend setup



```bash

cd backend

cp .env.example .env

npm install

npm run dev

```



Wait for:

```

Server running on port 5000

MongoDB connected

\[DynamicQuestCron] scheduler armed (Mon 06:00 IST)

```



\### 3. Frontend setup



Open a \*\*second terminal\*\*:



```bash

cd frontend

cp .env.example .env

npm install

npm run dev

```



Open http://localhost:5173 in Chrome.



\### 4. Test Web Bluetooth and AR



Web Bluetooth requires HTTPS or localhost. On a local network, Chrome blocks it by default. Use `chrome://flags/#unsafely-treat-insecure-origin-as-secure` or test against the live HTTPS deploy.



\### Common issues



| Symptom | Fix |

|---|---|

| `429 Too Many Requests` in dev | Rate limiters skip when `NODE\_ENV=development`. Ensure it is set. |

| Port 5000 busy | `taskkill /F /IM node.exe` (Windows) or `killall node` (macOS/Linux) |

| `postcss.config.js` not found | Must be `.cjs`, not `.js` |

| Vite cache stale | `rm -rf node\_modules/.vite` then `npm run dev` |

| PWA precache fails | Check `workbox.maximumFileSizeToCacheInBytes` is set to 5 MB |



\---



\## Environment Variables



\### `backend/.env`



```env

MONGO\_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=MoveX

JWT\_SECRET=change\_me\_to\_a\_long\_random\_string

PORT=5000

NODE\_ENV=development

GEMINI\_API\_KEY=your\_gemini\_api\_key

GEMINI\_MODEL=gemini-3.5-flash-lite

TINYFISH\_API\_KEY=sk-tinyfish-xxxxxxxxxxxxxxxxxxxxxxxx

BACKEND\_URL=http://localhost:5000

CORS\_ORIGIN=http://localhost:5173

```



\### `frontend/.env`



```env

VITE\_API\_URL=http://localhost:5000/api

```



> \*\*Security note:\*\* API keys live only in `backend/.env`. The frontend never receives them.



\---



\## API Highlights



\### Auth



| Method | Endpoint | Purpose |

|---|---|---|

| POST | `/api/auth/register` | Register (State → City → Region cascade) |

| POST | `/api/auth/login` | Login, returns JWT |

| GET | `/api/auth/me` | Current user |



\### Activities



| Method | Endpoint | Purpose |

|---|---|---|

| POST | `/api/activity` | Log activity with `rawData` (GPS + motion + optional band) |

| GET | `/api/activity/mine` | List own activities |

| POST | `/api/verification/run/:id` | Run AVS on an activity |



\### Rewards \& Gear (TinyFish)



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/rewards/catalog` | Trophy catalog |

| POST | `/api/rewards/redeem` | Redeem with idempotency key |

| GET | `/api/gear/search?q=...\&maxPrice=...` | Live prices from Flipkart / Amazon / Decathlon |



\### Quests (TinyFish)



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/quests` | Active quests for the user |

| POST | `/api/quests/:id/claim` | Claim reward |

| GET | `/api/dynamic-quests/events?city=Pune` | Stored local events |

| POST | `/api/dynamic-quests/generate` | Manually trigger live event search |



\### AI Coach



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/ai-coach/conversations` | List conversations |

| POST | `/api/ai-coach/conversations` | Start a new conversation |

| POST | `/api/ai-coach/conversations/:id/messages` | Send a message (Gemini) |



\---



\## Testing



```bash

cd backend \&\& npm test

cd frontend \&\& npm test



cd backend \&\& npm run lint

cd frontend \&\& npm run lint

```



CI runs on every push via `.github/workflows/ci.yml` — install, lint, and build for both packages.



\---



\## Deployment



\### Backend (Render Web Service)



\- Build: `npm install`

\- Start: `node server.js`

\- Health check: `/api/health`



\### Frontend (Render Static Site)



\- Build: `npm install \&\& npm run build`

\- Publish: `dist`

\- Rewrite rule: `/\* → /index.html` (SPA fallback)



\### Database (MongoDB Atlas)



\- Cluster: free tier M0

\- Network access: allow `0.0.0.0/0` (Render IPs are dynamic)



\### Auto-deploy



`git push origin main` triggers both services to redeploy in about 1–3 minutes.



\---



\## Built With AI



\*\*What is human-authored:\*\*



\- All product design, feature specs, and user flows

\- Data models (`User`, `Activity`, `Community`, `Clan`, `Penalty`, `DynamicEvent`)

\- The AVS (Activity Verification Score) engine and its 10-step rule set

\- The penalty state machine (grace ladder, strikes, win-back)

\- The Web Bluetooth decoder for the custom 12-byte and 50-byte packet formats

\- Backend architecture: routing, service layer, cron orchestration

\- Every API contract, header, and error path

\- All debugging, deployment, and production hardening



\*\*Where AI assistants were used:\*\*



\- Boilerplate generation for React components and Express routes

\- Debugging runtime errors (CORS, rate limits, PWA precache, MediaPipe UMD)

\- Iterating on Tailwind styling and layout composition

\- Writing and refining this README



\*\*Transparency commitment:\*\* every AI-assisted file is subject to human review, and the architectural decisions — what to build, how to structure it, and why — are human. See \[`docs/DEVELOPMENT\_NOTES.md`](docs/DEVELOPMENT\_NOTES.md).



\---



\## Roadmap



\- \[x] GPS activity tracking with Haversine distance

\- \[x] Hierarchical living map (India → State → City → Region)

\- \[x] Geo-scoped leaderboards and trophy economy

\- \[x] AI Coach with persistent conversations (Gemini)

\- \[x] AR workouts with pose detection (TensorFlow MoveNet)

\- \[x] Athlonia / APEX Web Bluetooth band integration

\- \[x] TinyFish live gear search

\- \[x] TinyFish dynamic regional quests

\- \[x] Penalty and win-back system

\- \[x] PWA with auto-update

\- \[ ] TypeScript migration

\- \[ ] Test coverage on backend services

\- \[ ] Sentry error tracking

\- \[ ] Athlonia Phase 4: AVS integration with band HR + cadence signals



\---



\## License



MIT — see \[LICENSE](LICENSE).



\---



\## Author



\*\*Rupam Patil\*\*



\- GitHub: \[@rupampatil19](https://github.com/rupampatil19)

\- Project: \[github.com/rupampatil19/MoveX](https://github.com/rupampatil19/MoveX)



\---



<div align="center">



\*\*Move More. Evolve Together.\*\*



If this project helped or inspired you, consider giving it a star.



</div>

