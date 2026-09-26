# 🎯 MOVEX — PROJECT CONTEXT & MEMORY

> **Trigger word:** `MoveX`
> **Repo:** https://github.com/rupampatil19/MoveX
> **Last updated:** 2026-09-27
> **Purpose:** Paste this file at the start of a new chat to restore full project context.

---

## 🧭 1. PROJECT IDENTITY

MoveX is a **fitness + gamified geographic living world** app for India.

**Tagline (sidebar under logo):** *Move More. Evolve Together.*
**Tagline (marketing / dashboard hero):** *Move, Compete and Grow Together.*

**Core loop:**
Athlete → Region → City → State → India
↓
Activity verified → Energy earned
↓
Regional/City/State Hub levels up
↓
Hubs evolve across the map
↓
Leaderboards, Trophies, Rewards

**Two ecosystems — kept strictly separate via `accountType`:**
- **BEGINNER** — personal fitness journey
- **PRO** — community & competition

⚠️ **The User model field is `accountType`, NOT `athleteMode`.** All models and endpoints that filter by ecosystem use `accountType`.

---

## 🏗️ 2. TECH STACK

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 8, Tailwind v3, Framer Motion, Leaflet, lucide-react, axios, canvas-confetti, html-to-image, react-markdown |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT (`x-auth-token`), Socket.IO |
| Database | MongoDB Atlas (cloud) |
| Auth | JWT. Token + user in `localStorage` as `movex_token` and `movex_user` |
| AI | Google Gemini via `@google/genai` SDK. Model: `gemini-3.5-flash-lite` |
| Styling | Tailwind utility classes + custom glassmorphism CSS. Primary accent: **#2563EB** |

---

## 🚀 3. DEPLOYMENT (LIVE)

| Service | Platform | URL |
|---|---|---|
| Frontend | Render Static Site | https://movex-1.onrender.com |
| Backend | Render Web Service | https://movex-zkgd.onrender.com |
| Database | MongoDB Atlas | (cloud cluster) |

### Critical Deployment Config

**Backend `server.js` — DNS workaround (MUST be at very top, before any require):**
```javascript
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
Backend Render env vars:

MONGO_URI

JWT_SECRET

GEMINI_API_KEY

GEMINI_MODEL = gemini-3.5-flash-lite

PORT = 10000 (Render sets automatically)

Frontend Render env vars:

VITE_API_URL = https://movex-zkgd.onrender.com/api (⚠️ must include /api)

Frontend Render rewrite rule (essential for React Router refresh):

Source: /*

Destination: /index.html

Action: Rewrite

Auto-deploy: On git push to main, both services redeploy.

Free tier: Backend sleeps after 15 min inactivity. Use UptimeRobot pinging https://movex-zkgd.onrender.com/api/health every 14 min to keep it warm.

📁 4. CRITICAL FILE MAP
Frontend
text
frontend/
├── tailwind.config.cjs        ← MUST be .cjs (package.json is "type": "module")
├── postcss.config.cjs         ← MUST be .cjs
├── vite.config.js             ← Vite handles its own config as .js fine
├── public/
│   ├── icon-192.png, icon-512.png  ← PWA icons
│   ├── geojson/india-states.geojson (~22MB)
│   └── assets/hubs/level_1..5.webp
└── src/
    ├── api.js                 ← axios, x-auth-token, 401 handler, BASE_URL from VITE_API_URL
    ├── App.jsx                ← routes + inline auth (no AuthContext)
    ├── main.jsx               ← imports ./index.css
    ├── index.css              ← tailwind directives + GLASSMORPHISM SYSTEM
    ├── data/
    │   ├── regionConfig.js
    │   ├── geoHierarchy.js
    │   └── hubAssets.js
    ├── services/
    │   └── aiCoachApi.js      ← listConversations, createConversation, getConversation, sendMessage, deleteConversation, renameConversation
    ├── utils/regionUtils.js
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.jsx            ← FLOATING glass, left-3 top-1 bottom-3, rounded-3xl
    │   │   ├── TopHeader.jsx          ← FLOATING glass, sticky top-1 mx-3, rounded-2xl
    │   │   ├── BottomNavigation.jsx   ← FLOATING glass pill, bottom-3 left-3 right-3, rounded-2xl
    │   │   └── DashboardLayout.jsx    ← glass-page-bg wrapper, md:ml-[17.5rem], pb-28
    │   ├── map/ (IndiaLayer, StateBoundariesLayer, IndiaOutlineLayer, CityStationsLayer, CityCollectiveHub, StateHubsLayer, MapZoomWatcher, MapCenterWatcher, MaharashtraLayer)
    │   ├── rewards/ (TrophyBalanceHeader, RewardCard, RewardFilters, NextRewardProgress, RedemptionSuccessModal, MyRewardsList, RedemptionHistory)
    │   └── DashboardMap.jsx
    ├── context/TrophyContext.jsx
    └── pages/
        ├── Login.jsx, Register.jsx (Pro Athlete Flow = ₹99)
        ├── BeginnerDashboard.jsx, ProDashboard.jsx, Dashboard.jsx
        ├── StartActivityPage.jsx, ActivityResultPage.jsx, ActivityHistoryPage.jsx
        ├── AnalyticsPage.jsx, MapPage.jsx, RewardsPage.jsx
        ├── Leaderboard.jsx, QuestsPage.jsx, Profile.jsx, ClanPage.jsx
        └── AICoachPage.jsx   ← ChatGPT-style, sidebar+drawer, rename/delete
Backend
text
backend/
├── server.js                  ← STARTS WITH dns.setServers([...])
├── data/regionHierarchy.js
├── models/
│   ├── User.js                ← accountType: 'BEGINNER' | 'PRO'
│   ├── Activity.js, Community.js, RegionalContribution.js
│   ├── Reward.js, RewardInventory.js, RewardRedemption.js, TrophyTransaction.js
│   ├── Clan.js, ClanMember.js, ClanEnergyTransaction.js, ClanXPTransaction.js, ClanChatMessage.js
│   ├── MoveXMoment.js
│   ├── AICoachProfile.js
│   └── AIConversation.js      ← { userId, title, accountType, personality, messages[], createdAt, updatedAt }
├── routes/
│   ├── auth.js, activity.js, verification.js, community.js
│   ├── rewards.js, leaderboard.js, geo.js, clans.js
│   └── aiCoach.js             ← CRUD + AI title generation + legacy /chat
├── services/
│   ├── avsEngine.js
│   └── notificationService.js
└── scripts/ (backfill*, fix*, test*, merge*)
✅ 5. WHAT'S BUILT
✅ Core
☑ JWT auth (movex_token + movex_user)
☑ Registration: State → City → Region cascade
☑ Backend validation via isValidCombination()
☑ accountType separation (BEGINNER / PRO)
☑ Deployed on Render + MongoDB Atlas
☑ Auto-deploy on git push
✅ MoveX Living Map
☑ Hierarchical map (India → State → City → Region)
☑ Zoom-based layer switching (≤6 / 7-8 / 9-10 / ≥11)
☑ Home state = #2563EB, others from curated palette
☑ State boundaries (#94A3B8), India outline (black, z=465)
☑ Auto-focus on user's registered city
☑ 23 states, 51 cities, ~370 regions
✅ MoveX Bazaar & Rewards
☑ trophyPoints numeric + TrophyContext single source
☑ 18 seeded rewards
☑ Atomic redemption + idempotency
☑ Boost activation (24h/48h)
☑ My Rewards + equip + history
☑ 2-column mobile grid
✅ Activity Flow
☑ Running/Walking/Cycling/Indoor Workout
☑ Live timer, pause/resume, finish
☑ AVS verification pipeline
☑ Full report popup
☑ Energy / XP / Trophy / Streak updates
✅ Leaderboard
☑ Geo-scoped ?scope=region|city|state|global
☑ Sorted by Level → Energy → XP
✅ Quests
☑ 2-col mobile grid, all filters
✅ MoveX Moment
☑ 1080×1920 + 1080×1080 shareable cards
☑ Native share sheet
✅ AI Coach (ChatGPT-Style)
☑ Backend AIConversation with embedded messages
☑ Auto-generated short titles via Gemini (2-4 words, e.g. "Back Pain", "Running Stamina")
☑ Fallback deterministic title if AI fails
☑ Ownership enforced on every endpoint
☑ Endpoints:
GET /api/ai-coach/conversations

POST /api/ai-coach/conversations

GET /api/ai-coach/conversations/:id

POST /api/ai-coach/conversations/:id/messages

PATCH /api/ai-coach/conversations/:id

DELETE /api/ai-coach/conversations/:id

GET /api/ai-coach/context

POST /api/ai-coach/chat (legacy)

☑ Multi-turn memory (last 20 messages to Gemini)
☑ User message persisted BEFORE AI call (survives failure)
☑ AI reply + AI title run in parallel (Promise.all) — no added latency
☑ Desktop: 2-panel (sidebar + chat)
☑ Mobile: collapsible drawer
☑ Grouped: Today / Yesterday / Previous 7 Days / Older
☑ Three-dot menu: Rename / Delete
☑ Delete + Rename modals
☑ Typing indicator (3 dots)
☑ Retry banner on AI failure
☑ Quick prompts on empty chat
☑ Stat cards removed from AI Coach page
☑ Lazy conversation creation (no duplicate empty "New Chat")
✅ Glassmorphism UI (Phase 1-3 in progress)
☑ Glass CSS system in index.css (.glass, .glass-strong, .glass-subtle, .glass-nav, .glass-input, .glass-page-bg)
☑ Gradient page background (soft blue, single-color — no pink/green/purple)
☑ DashboardLayout uses glass-page-bg
☑ Sidebar floating glass (left-3 top-1 bottom-3 rounded-3xl)
☑ TopHeader floating glass (sticky top-1 mx-3 rounded-2xl)
☑ BottomNavigation floating glass pill (bottom-3 left-3 right-3 rounded-2xl)
☑ Center Start button has white ring border (border-4 border-white/70)
☑ AI Coach fully glassmorphic (chat panel, bubbles, inputs, modals)
□ Phase 3 Batch B: Login + Register glass
□ Phase 3 Batch C: Dashboard pages glass
□ Phase 3 Batch D: Rewards / Quests / Leaderboard glass
□ Phase 3 Batch E: Map / Analytics / Profile glass
🔧 6. KNOWN FIXES APPLIED
#	Bug	Fix
1-12	(see prior versions)	(unchanged)
13	querySrv ECONNREFUSED on Windows Node	dns.setServers(['1.1.1.1', '8.8.8.8']) at top of server.js
14	MongoNetworkError ECONNRESET from Render	Whitelisted IPs in MongoDB Atlas Network Access
15	Frontend couldn't reach backend on Render	VITE_API_URL env var MUST include /api suffix
16	React Router 404 on refresh (Render)	Added /* → /index.html rewrite rule
17	AI conversations didn't persist	New AIConversation model + endpoints
18	Every chat titled "New Chat"	Gemini generates 2-4 word titles in parallel with reply
19	Multiple empty "New Chat" rows	Lazy creation (conversation created on first message)
20	AI Coach showed stat cards below chat	Removed from page
21	Register.jsx showed ₹299	Changed to ₹99
22	Dashboard hero said "Move More. Earn More."	Changed to "Move, Compete and Grow Together"
23	PostCSS Unexpected token, expected "," from sucrase	Rename postcss.config.js → postcss.config.cjs and tailwind.config.js → tailwind.config.cjs. Rewrite with module.exports (CommonJS). Cause: package.json has "type": "module" which forces .js files to be ESM, but Tailwind v3 + PostCSS loaders expect CommonJS.
24	tailwind.config.js had __CONFIG__ placeholder	Replaced with real CommonJS config
⚠️ 7. CRITICAL CONVENTIONS & GOTCHAS
Conventions
All IDs lowercase (pune, navi-mumbai)

Backend Mongoose: camelCase (trophyPoints, accountType)

Frontend configs: camelCase (regionIds)

Colors: primary #2563EB, hover #1D4ED8, success #20C9A6

Radius: rounded-2xl (cards), rounded-3xl (hero, floating panels)

Floating layout offsets (desktop): Sidebar md:ml-[17.5rem] in layout; Bottom nav padding pb-28

Floating layout offsets (mobile): Bottom nav bottom-3 left-3 right-3

Gotchas — PowerShell & File Writing (CRITICAL)
❌ Never use Add-Content or Set-Content to write source files. PowerShell 5.1 writes UTF-16LE with BOM by default. Even -Encoding UTF8 adds a BOM. This corrupts .js, .jsx, .css files and breaks Vite's parser with misleading errors like Unexpected token, expected "," from sucrase.

❌ Never use non-ASCII characters (em-dash —, smart quotes "", ellipsis …, emojis) in source code comments when writing via PowerShell. Encoding mismatch turns them into mojibake like â€", ðŸ‘‹.

✅ Safe way to write files from PowerShell: Use Node.js with fs.writeFileSync(path, content, "utf8"). Node always writes clean UTF-8.

✅ Safe alternative: Open in Notepad → paste → File → Save As → Encoding: UTF-8 (plain, not "UTF-8 with BOM").

✅ Safest: Use VSCode or another editor that defaults to UTF-8 no BOM.

✅ For .cjs scripts: Any Node script inside a project with "type": "module" must use .cjs extension if it uses require().

❌ Never use .NET [System.IO.File]::ReadAllBytes("relative/path") — .NET uses the process working directory, not PowerShell's $PWD. Always use absolute paths or Join-Path $PWD "relative".

Gotchas — Vite / Config
✅ postcss.config.js and tailwind.config.js MUST be .cjs in this project (because package.json has "type": "module").

✅ vite.config.js stays .js — Vite handles its own config natively.

✅ sucrase errors in CSS files = ESM/CJS config conflict, not CSS syntax errors.

✅ Vite cache clear: Remove-Item -Recurse -Force node_modules\.vite

Gotchas — Runtime
❌ Never assume AuthContext exists — inline auth in App.jsx + localStorage

❌ Never full-file replace a file you haven't seen — ask first

❌ Never use ?? in PowerShell 5.1 — use if (-not $x)

❌ Never paste JS into PowerShell — write to a file first

✅ Backend scripts live in backend/scripts/ and run from backend/

✅ India GeoJSON at frontend/public/geojson/india-states.geojson (NAME_1 property)

✅ Hub images at frontend/public/assets/hubs/level_1..5.webp

✅ Gemini SDK: ai.models.generateContent({ model, contents, config })

✅ window.location.hostname on Render resolves to movex-1.onrender.com, so http://${hostname}:5000/api fallback resolves to a dead URL. VITE_API_URL must be set explicitly.

🎨 8. GLASSMORPHISM DESIGN SYSTEM
Defined in frontend/src/index.css. Utility classes:

Class	Use for	Opacity
.glass-page-bg	Page background (gradient mesh)	—
.glass	Standard cards, chat bubbles	55% white
.glass-strong	Floating panels, sidebar, modals	75% white
.glass-subtle	Chips, small pills, tags	35% white
.glass-nav	Fixed nav bars (legacy)	70% white
.glass-input	Form inputs	50% white, focus 75%
Design rules:

Never stack glass on glass (kills readability)

Blur radius: 14-30px (mobile-safe)

Border: 1px solid rgba(255,255,255,0.5-0.85) — visible white edge

Shadow: soft, tinted blue shadow-[#2563EB]/15

Primary buttons: bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] with glow shadow

Floating elements: rounded-2xl or rounded-3xl, offset from screen edges (top-1/top-3, bottom-3, left-3, right-3)

Background: single-color blue gradient (no rainbow). If user asks for more color, offer alternatives.

🚀 9. HOW TO RUN
Terminal 1 — Backend:

powershell
cd C:\Users\Rupam\MoveX\backend
npm run dev
Terminal 2 — Frontend:

powershell
cd C:\Users\Rupam\MoveX\frontend
npm run dev
🎯 10. HOW TO ADD A NEW STATE + CITY
Pattern (e.g., Goa / Panaji):

frontend/src/data/regionConfig.js — add PANAJI_REGIONS, register in CITY_REGIONS

frontend/src/data/geoHierarchy.js — import regions, add state to STATES, city to CITIES, register in getRegionsForCity

backend/data/regionHierarchy.js — add regions, city, state to hierarchies

backend/models/User.js — append regions to enum

backend/routes/community.js — append to ALL_REGIONS

frontend/src/pages/MapPage.jsx — import + add to objects

frontend/src/components/DashboardMap.jsx — repeat step 6

🔮 11. PENDING / IN-PROGRESS
⏳ Speed up activity report generation (stamp logs added; Promise.all DB writes pending)

⏳ Full verification.js refactor

⏳ Post-activity "Share MoveX Moment" button

⏳ Rewards carousel → 2-col grid cleanup

⏳ State hub size tuning on India map

🎨 Glassmorphism roll-out:

☑ Foundation (CSS utilities, background)
☑ AI Coach page
☑ Sidebar + TopHeader + BottomNavigation
□ Login + Register
□ Dashboard pages
□ Rewards / Quests / Leaderboard
□ Map / Analytics / Profile / Clan
🐛 AI Coach polish:

Verify Rename works end-to-end on live deploy

Verify AI-generated titles on live deploy (Back Pain, Running Stamina, etc.)

Test mobile drawer in production

📌 12. QUICK REFERENCE — CITY COORDINATES
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
💬 13. COMMUNICATION RULES FOR AI
Trigger: When user says MoveX, assume this context.

Never guess at file contents. Ask the user to paste.

Never do full-file replacements of files I haven't seen. Use targeted patches.

Never use PowerShell-breaking syntax (??, backticks, $var inside node -e).

Never use Add-Content/Set-Content for source files. Use Node.js or Notepad with UTF-8.

Prefer surgical patches over rewrites. Explain why a full rewrite is needed.

Deliver ONE step at a time with a test at each step.

Response length limit — one large file per reply. Split across messages.

Test commands belong at the end of each patch.

Never send huge blind patches to debug. Ask for terminal output, console errors, or network status first.

Before writing code, verify field names (accountType, not athleteMode).

Before sending a config change, check if the file is .js but should be .cjs.