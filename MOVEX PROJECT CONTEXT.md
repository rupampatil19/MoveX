# 🎯 MOVEX — PROJECT CONTEXT & MEMORY

> **Trigger word:** `MoveX`
> **Repo:** https://github.com/rupampatil19/MoveX
> **Last updated:** 2026-10-09
> **Purpose:** Paste this file at the start of a new chat to restore full project context.

---

## 🧭 1. PROJECT IDENTITY

MoveX is a **fitness + gamified geographic living world** app for India.

**Taglines:**
- Sidebar: *Move More. Evolve Together.*
- Marketing: *Move, Compete and Grow Together.*

**Core loop:** Athlete → Region → City → State → India → Energy earned → Hub levels up → Leaderboards, Trophies, Rewards

**Two ecosystems via `accountType`:** **BEGINNER** (personal) / **PRO** (community & competition)

⚠️ **User model field is `accountType`, NOT `athleteMode`.**

---

## 🏗️ 2. TECH STACK

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, Tailwind v3, Framer Motion, Leaflet, lucide-react, axios, canvas-confetti, html-to-image, react-markdown, recharts, jspdf |
| AR / Pose | TensorFlow MoveNet (`@tensorflow-models/pose-detection`, `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`) |
| Sensors | Web Bluetooth (Athlonia band), Geolocation (GPS), Accelerometer/Gyroscope/Magnetometer APIs |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT (`x-auth-token`), Socket.IO, helmet, express-rate-limit |
| AI Coach | Google Gemini via `@google/genai`. Model: `gemini-3.5-flash-lite` |
| Styling | Tailwind + glass utilities. Primary: **#2563EB** |

---

## 🚀 3. DEPLOYMENT (LIVE)

| Service | Platform | URL |
|---|---|---|
| Frontend | Render Static Site | https://movex-1.onrender.com |
| Backend | Render Web Service | https://movex-zkgd.onrender.com |
| Database | MongoDB Atlas | (cloud cluster) |

**Backend `server.js` — DNS workaround (MUST be very first line):**
```javascript
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
Backend env vars: MONGO_URI, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL=gemini-3.5-flash-lite, CORS_ORIGIN=https://movex-1.onrender.com, CRON_SECRET

Frontend env vars: VITE_API_URL=https://movex-zkgd.onrender.com/api (⚠️ must include /api)

Frontend Render rewrite rule: /* → /index.html → Rewrite

Security headers on Render:

Path	Header	Value
/*	X-Frame-Options	DENY
/*	X-Content-Type-Options	nosniff
/*	Referrer-Policy	strict-origin-when-cross-origin
/*	Permissions-Policy	geolocation=(self), microphone=(), camera=(self), bluetooth=(self)
/*	Strict-Transport-Security	max-age=31536000; includeSubDomains
⚠️ Permissions-Policy must allow camera=(self) and bluetooth=(self) for AR + band

Auto-deploy: git push to main redeploys both services in ~1–3 min.

Free tier: Backend sleeps after 15 min. UptimeRobot pinging /api/health every 14 min.

PWA: Auto-updates on deploy. Workbox precache limit bumped to 5 MB (TF.js bundle).

📁 4. CRITICAL FILE MAP
Frontend
text
frontend/
├── tailwind.config.cjs          ← MUST be .cjs
├── postcss.config.cjs           ← MUST be .cjs
├── vite.config.js               ← has @mediapipe/pose alias → mediapipe-stub.js
├── public/
│   ├── icon-192.png, icon-512.png
│   ├── geojson/india-states.geojson
│   ├── assets/hubs/level_1..5.webp
│   └── models/squat.fbx, pushup.fbx   ← 1.9 MB each (unused, reserved for future 3D trainer)
└── src/
    ├── api.js                    ← axios, x-auth-token, 401 handler
    ├── App.jsx                   ← routes + inline auth (no AuthContext)
    ├── main.jsx
    ├── index.css                 ← Tailwind + glass + clean-surface utilities
    ├── data/ (regionConfig, geoHierarchy, hubAssets)
    ├── services/
    │   ├── aiCoachApi.js
    │   ├── bandService.js        ← OLD MoveX-protocol band (20-byte packets, unused)
    │   ├── athloniaBandService.js ← ⭐ NEW Athlonia 12-byte protocol
    │   ├── sensorService.js      ← GPS + motion
    │   ├── penaltyApi.js
    │   └── arActivityApi.js      ← submit AR workout → MoveX activity
    ├── lib/ar/                    ← AR LOGIC (ported from ARFit-v6)
    │   ├── geometry.js, repCounter.js, formRules.js
    │   ├── analyzers.js, exercises.js, history.js
    │   └── mediapipe-stub.js     ← stubs @mediapipe/pose (UMD workaround)
    ├── hooks/
    │   ├── usePoseEngine.js       ← TensorFlow MoveNet wrapper
    │   └── useAthloniaBand.js     ← ⭐ NEW Athlonia React hook
    ├── utils/regionUtils.js
    ├── components/
    │   ├── ui/                    ← MoveXCard, Button, MoveXGlassPanel, SectionHeader, EmptyState, LoadingSkeleton
    │   ├── layout/                ← Sidebar (no AR/AI Coach), TopHeader, BottomNavigation (no AR/AI Coach in More), DashboardLayout
    │   ├── penalties/             ← FriendlyNudge, StrikeIndicator, WinBackBanner
    │   ├── map/
    │   ├── rewards/
    │   ├── ar/                    ← ARWorkoutScreen
    │   ├── band/                  ← ⭐ NEW AthloniaBandWidget
    │   ├── AICoachFAB.jsx         ← ⭐ NEW floating AI Coach button (z-8000)
    │   ├── MoveXMoment.jsx
    │   ├── DashboardMap.jsx
    │   └── Logo.jsx
    ├── context/TrophyContext.jsx
    └── pages/
        ├── Login.jsx, Register.jsx (Pro Athlete Flow = ₹99)
        ├── BeginnerDashboard.jsx, ProDashboard.jsx (+ AthloniaBandWidget), Dashboard.jsx (legacy)
        ├── StartActivityPage.jsx       ← Indoor Workout → /ar, has AR Camera badge
        ├── ActivityResultPage.jsx, ActivityHistoryPage.jsx
        ├── AnalyticsPage.jsx, MapPage.jsx, RewardsPage.jsx, QuestsPage.jsx
        ├── Leaderboard.jsx, Profile.jsx, ClanPage.jsx, PenaltiesPage.jsx
        ├── **ARSection.jsx**            ← AR picker / history
        └── AICoachPage.jsx             ← defaults to new chat on mount
Backend
text
backend/
├── server.js                    ← dns.setServers + helmet + rate limiters + /internal/cron/daily
├── data/regionHierarchy.js
├── models/
│   ├── User.js (accountType), Activity.js, Community.js, RegionalContribution.js
│   ├── Reward*.js, TrophyTransaction.js
│   ├── Clan*.js
│   ├── MoveXMoment.js, AICoachProfile.js, AIConversation.js, VerificationResult.js
│   └── Penalty System: Penalty.js, Strike.js, StreakFreeze.js, PenaltyNotification.js, WinBackState.js
├── routes/
│   ├── auth.js, activity.js, verification.js (AR-aware), community.js
│   ├── rewards.js, leaderboard.js, geo.js, clans.js, analytics.js
│   ├── aiCoach.js, penalties.js
├── services/
│   ├── avsEngine.js             ← AR-aware (isAR branch) + standard GPS
│   ├── penaltyEngine.js, winBackService.js, cron.js
│   ├── notificationService.js, questEngine.js
└── scripts/
✅ 5. WHAT'S BUILT
✅ Core
JWT auth, register cascade (State→City→Region)

accountType separation

Deployed on Render + MongoDB Atlas

Security: helmet, rate limiters (dev skip), strict CORS, security headers, DNS workaround

PWA auto-update

✅ Living Map
Hierarchical: India → State → City → Region

Zoom-based layer switching (≤6 / 7-8 / 9-10 / ≥11)

Home state #2563EB; others from palette

Dynamic title

Hub sizes: 32px state, 64px active, 36px city stations

✅ Activity Flow (GPS)
Real GPS tracking, Haversine distance, accuracy filter

Manual distance fallback

Premium report: status pill, rewards, impact, AVS, sensor evidence

MoveX Moment shareable card

✅ MoveX Bazaar & Rewards
Trophy economy + TrophyContext

Atomic redemption + idempotency

2-column mobile grid

Rewards Gate (7-day unlock for win-back users)

✅ Leaderboard, Quests, Analytics
Geo-scoped leaderboard with medal-style badges

2-col mobile quest grid with color-coded category badges

Analytics with charts + PDF export

✅ AI Coach (ChatGPT-style)
Persistent conversations

AI-generated short titles (Gemini)

Multi-turn memory

Rename + delete

Defaults to a fresh new chat on mount

Floating FAB (bottom-right, z-8000) opens AI Coach from anywhere

FAB hidden on /ai-coach page itself

✅ Penalty System
5 models, penaltyEngine.js, winBackService.js, cron.js

11 endpoints at /api/penalties/*

Friendly nudge, strike indicator, win-back banner, standing page

✅ Sensor Integration (Phone)
sensorService.js — GPS + Accel + Gyro + Mag

Permission gate modal

Sensor evidence panel

✅ AR Workouts
7 logic files ported from ARFit-v6

usePoseEngine.js (MoveNet + camera + countdown + rep counting)

ARWorkoutScreen.jsx (fullscreen camera + skeleton + HUD + enhanced report)

ARSection.jsx (picker + history)

Rewards integrated (Energy/XP/Trophy/Streak)

AVS pipeline for AR

Indoor Workout on /start navigates to /ar with "AR Camera" badge

✅ Athlonia Band Integration (NEW — Phase 1-2 Complete)
Protocol: 12-byte packets, little-endian, 10 Hz, 0xAA header

Device: Athlonia_Band (ESP32-S3)

Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b

Notify Char: beb5483e-36e1-4688-b7f5-ea07361b26a8

Data: HR, Steps, Cadence, Quality, Battery, Sequence

Decoder logic: bit 7 of byte 8 = HR valid flag, lower 7 bits = quality

Files:

src/services/athloniaBandService.js — BLE client + decoder

src/hooks/useAthloniaBand.js — React state wrapper

src/components/band/AthloniaBandWidget.jsx — Pro dashboard widget

Widget mounted ONLY on Pro Dashboard

Beginner dashboard untouched — verified isolation

Android Chrome only (Web Bluetooth unsupported on iOS/Firefox)

✅ Navigation Cleanup
Removed AR + AI Coach entries from Sidebar (desktop)

Removed AR + AI Coach entries from BottomNavigation "More" (mobile)

AI Coach accessible via floating FAB (bottom-right corner)

AR accessible via Indoor Workout in /start

✅ UI Design System
MoveXCard variants: default / premium / metric / bento / hero / glass

MoveXGlassPanel (floating overlays only)

Button variants: primary / premium / secondary / ghost / danger

EmptyState, LoadingSkeleton (shimmer)

Gradient icon tiles (flat single-color)

🎨 6. Z-INDEX HIERARCHY
Element	z-index	File
Map info panel / legend	z-[1000]	MapPage.jsx
AI Coach FAB	z-[8000]	AICoachFAB.jsx
Bottom nav pill	z-[9000]	BottomNavigation.jsx
Nav drawer overlay	z-[9990]	BottomNavigation.jsx
Nav drawer	z-[9999]	BottomNavigation.jsx
⚠️ Reason: Leaflet map panes use z-index 400-1000 internally. Anything fixed-position must be above 1000 to sit on top of the map.

📡 7. ATHLONIA BAND PROTOCOL REFERENCE
12-byte packet layout (little-endian)
Byte	Field	Type	Notes
0	Header	uint8	Always 0xAA
1	Version	uint8	0x01
2	Packet Type	uint8	0x01 = telemetry
3	Sequence	uint8	Rolling 0-255
4	Heart Rate	uint8	0 = invalid (use quality byte)
5	Steps Low	uint8	Low byte
6	Steps High	uint8	High byte
7	Cadence	uint8	Steps per minute
8	Quality / Valid	uint8	bit 7 = HR valid, bits 0-6 = quality
9	Battery	uint8	0-100%
10	CRC Low	uint8	
11	CRC High	uint8	
Decoding
javascript
const hrValid = (bytes[8] & 0x80) > 0;
const quality = bytes[8] & 0x7F;
const steps = bytes[5] | (bytes[6] << 8);
const hr = hrValid ? bytes[4] : 0;
Service API
javascript
import { AthloniaBandService } from '../services/athloniaBandService';
AthloniaBandService.isSupported()
new AthloniaBandService()
band.connect()                     // → { deviceName, deviceId }
band.disconnect()
band.getLatest()
band.getPackets()
band.getAverageHR(30)              // avg over last 30s
band.getMaxHR(60)                  // max over last 60s
band.resetBuffer()
band.onPacket = (packet) => {...}
band.onConnect = (info) => {...}
band.onDisconnect = () => {...}
📊 8. PENALTY SYSTEM REFERENCE
Inactivity Ladder
Days	Stage	Notification	Penalty	Duration
0–2	Grace	(silent)	—	—
3–4	Nudge	"Hey, we miss you!"	—	—
5–6	Last Chance	"Save my streak"	—	—
7–9	Strike 1	"Streak at risk"	-10% Energy	3 days
10–13	Strike 2	"Energy bonus paused"	-20% + Shield off	5 days
14–17	Strike 3	"Restricted mode"	-30% + Chat lock	5 days
18–29	Restricted	"One activity resets all"	Activity-only	Until active
30+	Dormant → Win-Back	"Welcome back!"	No ban	—
Consistency Grace
Last 7 days	Grace
7/7	7 days
5–6/7	5 days
3–4/7	3 days
1–2/7	3 days
0/7	2 days
New user (<14d)	7 days
Long streak (>14d)	7 days
Win-Back (30+ days)
Day 30: mark dormant, welcome armed

Day 40: clan nudge

Day 55: progress-safe reminder

Day 75: silent archive

Welcome Kit: +100 Energy, +50 Trophies, +1 Freeze, 2× XP ×3 activities

Rewards Gate: 7 consecutive active days to reopen Bazaar

🔧 9. KNOWN FIXES APPLIED
#	Bug	Fix
1-30	(see prior versions)	unchanged
31-42	(see prior versions)	unchanged
43	MediaPipe UMD import	Alias @mediapipe/pose → mediapipe-stub.js
44	PWA precache failed (2.94 MB > 2 MB)	workbox.maximumFileSizeToCacheInBytes: 5 MB
45	Duplicate handleActivityClick	Deduped by line number
46	AR workouts INVALID	avsEngine.js + verification.js branch on rawData.source === 'ar'
47	AR AVS returns 0 Energy	Dedicated AR reward formula
48	Profile.jsx import block mangled	Prepend missing React imports
49	429 Too Many Requests in dev	Added IS_DEV + skip: skipLimiter to all 4 rate limiters in server.js
50	Mobile nav showed AI Coach + AR	Removed from BottomNavigation.jsx More menu
51	Drawer behind map	Bumped z-index on drawer + FAB + overlay above Leaflet's 1000
52	Duplicate AR Camera badge	Deduped on StartActivityPage.jsx
53	AI Coach auto-opened last chat	Changed mount effect to stay on fresh welcome screen
54	AI Coach had extra bottom space	Container height 100dvh-200px → 100dvh-155px on mobile
⚠️ 10. CRITICAL CONVENTIONS & GOTCHAS
Conventions
All IDs lowercase

Backend Mongoose: camelCase (trophyPoints, accountType)

Colors: primary #2563EB, hover #1D4ED8

Radius: rounded-card (16px), rounded-panel (20px), rounded-hero (24px)

Layout: Sidebar md:ml-[17.5rem], bottom padding pb-28

Page title: text-2xl sm:text-3xl font-bold text-ink-900

Always use MoveXCard, SectionHeader, Button, EmptyState, LoadingSkeleton

Gotchas — File Writing (CRITICAL)
❌ Never use Add-Content or Set-Content for source files — PowerShell writes UTF-16LE with BOM

❌ Never use non-ASCII chars in source files via PowerShell (mojibake)

❌ Never use regex on import blocks with [\s\S]*? — matches from first import {

❌ Never Resolve-Path on files that don't exist — use absolute paths

❌ Never nest backticks in PowerShell double-quoted strings

✅ Safe way: Node.js fs.writeFileSync(path, content, "utf8") via .cjs script

✅ Safe way: @'...'@ here-string + [System.IO.File]::WriteAllText("abs-path", $c, UTF8-no-BOM)

✅ For JSX edits, always use Node.js, never PowerShell here-strings

✅ Always check for idempotency — verify marker isn't already present before insert

⚠️ Code blocks starting with import, const, function, export are JAVASCRIPT — paste into files, never run in PowerShell

Gotchas — Vite / Config
✅ postcss.config.cjs + tailwind.config.cjs MUST be .cjs

✅ Vite cache: Remove-Item -Recurse -Force node_modules\.vite

✅ MediaPipe workaround: resolve.alias['@mediapipe/pose'] → mediapipe-stub.js

Gotchas — Runtime
❌ Never assume AuthContext exists

❌ Never full-file replace a file not yet seen

❌ Never use ?? in PowerShell 5.1

❌ Never run node -e "require('./foo')" from wrong directory

✅ Backend and frontend in SEPARATE terminals

✅ If port 5000 busy → taskkill /F /IM node.exe

✅ Camera + TensorFlow + Web Bluetooth require HTTPS or localhost

✅ Web Bluetooth only works on Chrome Android + desktop Chrome/Edge — not iOS Safari, not Firefox

Gotchas — AR / TensorFlow
✅ Bundle is ~2.95 MB (TF.js included)

✅ Workbox precache limit 5 MB

✅ MoveNet SINGLEPOSE_LIGHTNING model

✅ Analyzer state machine: standing → descending → bottom → ascending

Gotchas — Athlonia Band
✅ 10 Hz packet rate — expect 600 packets per 60s in buffer

✅ Packet must start with 0xAA — discard any non-matching packet

✅ HR valid flag is bit 7 of byte 8 — always check before displaying HR

✅ steps uses little-endian — low | (high << 8)

✅ Service file uses MAX_BUFFER = 600 to cap memory (60s rolling window)

⚠️ Do NOT change the existing bandService.js — it uses a different 20-byte protocol

🚀 11. HOW TO RUN (LOCAL)
Three separate terminals:

powershell
# Terminal 1 — Backend
cd C:\Users\Rupam\MoveX\backend
npm run dev

# Terminal 2 — Frontend
cd C:\Users\Rupam\MoveX\frontend
npm run dev

# Terminal 3 (temporary) — One-off scripts
cd C:\Users\Rupam\MoveX\backend
node script.cjs
Access: http://localhost:5173

AR + band only work on localhost or HTTPS

If port 5000 busy: taskkill /F /IM node.exe

🔮 12. PENDING / IN-PROGRESS
⏳ Athlonia Phase 3: Collect band data during activity → send as rawData.band to backend

⏳ Athlonia Phase 4: AVS integration — HR + cadence signal boosts verification score

⏳ Athlonia Phase 5: Show band connection status on Start Activity page

⏳ Lazy-load AR so TF.js is in its own chunk (main bundle 2.95 MB → ~550 KB)

⏳ AVS enhancement to score rawData.phone.motionSamples

⏳ Backend rewards gate enforcement on /rewards/redeem

⏳ Automated cron (manual trigger only)

⏳ Extract shared CITIES/STATES to utils/mapConfig.js

⏳ Socket.IO URL still hardcoded to http://localhost:5000 in NotificationBell.jsx

⏳ 3D Mixamo trainer (2D skeleton in place; .fbx models + three installed, unused)

⏳ Forgiveness tokens (penalty system Phase 2)

📌 13. QUICK REFERENCE — CITY COORDINATES
City	Center	Regions
Pune	[18.56, 73.85]	7
Mumbai	[19.076, 72.8777]	19
Bengaluru	[12.9716, 77.5946]	5
Delhi	[28.6139, 77.2090]	7
Hyderabad	[17.3850, 78.4867]	7
Chennai	[13.0827, 80.2707]	6
Kolkata	[22.5726, 88.3639]	6
Ahmedabad	[23.0225, 72.5714]	5
Lucknow	[26.8467, 80.9462]	7
Patna	[25.5941, 85.1376]	7
Ranchi	[23.3441, 85.3096]	7
Bhubaneswar	[20.2961, 85.8245]	7
Raipur	[21.2514, 81.6296]	7
Visakhapatnam	[17.6868, 83.2185]	7
Gurugram	[28.4595, 77.0266]	7
Kochi	[9.9312, 76.2673]	7
Ludhiana	[30.9010, 75.8573]	7
Srinagar	[34.0837, 74.7973]	7
Shimla	[31.1048, 77.1734]	6
Dehradun	[30.3165, 78.0322]	7
Guwahati	[26.1445, 91.7362]	7
Gangtok	[27.3389, 88.6065]	7
💬 14. COMMUNICATION RULES FOR AI
Trigger: User says MoveX → assume this context.

Never guess at file contents. Ask user to paste.

Never full-file replace a file not yet seen.

Never use PowerShell-breaking syntax (??, backticks, $var in node -e).

Never use Add-Content/Set-Content for source files → use Node.js or Notepad UTF-8.

NEVER use regex on import blocks with [\s\S]*?

NEVER nest backticks in PowerShell here-strings

NEVER Resolve-Path on files that don't exist

ALWAYS check for idempotency — verify marker isn't already present before insert

Prefer surgical patches over rewrites.

Deliver ONE step at a time with a test at each step.

Test commands belong at the end of each patch.

Never send huge blind patches to debug. Ask for terminal output first.

Verify field names (accountType, not athleteMode).

Verify config extensions (.cjs for postcss + tailwind).

Always cd backend before running backend scripts.

Backend and frontend in separate terminals.

For JSX edits, use Node.js scripts, never PowerShell.

Escaping JSX: use @'...'@ here-strings, [System.IO.File]::WriteAllText(), absolute paths.

JavaScript vs PowerShell: if a code block starts with import, const, let, function, or export, it's JS — do NOT run it in PowerShell. Label such blocks clearly as "for a file" not "to run".