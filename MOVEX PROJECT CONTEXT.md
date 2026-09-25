# 🎯 MOVEX — PROJECT CONTEXT & MEMORY

> **Trigger word:** `MoveX`
> **Repo:** https://github.com/rupampatil19/MoveX
> **Last updated:** 2026-09-26
> **Purpose:** Paste this file at the start of a new chat to restore full project context.

---

## 🧭 1. PROJECT IDENTITY

MoveX is a **fitness + gamified geographic living world** app for India.

**Tagline (sidebar):** *Move More. Evolve Together.*
**Tagline (marketing):** *Move, Compete and Grow Together.*

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

⚠️ **IMPORTANT:** The User model uses `accountType`, NOT `athleteMode`. Use `accountType` everywhere.

---

## 🏗️ 2. TECH STACK

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Leaflet + react-leaflet, lucide-react, axios, canvas-confetti, html-to-image, react-markdown |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT via `x-auth-token` header, Socket.IO |
| Database | MongoDB Atlas (cloud) — Mongoose schemas |
| Auth | JWT. Token + user stored in `localStorage` as `movex_token` and `movex_user` |
| Maps | Leaflet + OpenStreetMap tiles. GeoJSON for India states. |
| AI | Google Gemini via `@google/genai` SDK. Model: `gemini-3.5-flash-lite` |
| Styling | Tailwind utility classes. Primary accent: **#2563EB** |

---

## 🚀 3. DEPLOYMENT (LIVE)

| Service | Platform | URL |
|---|---|---|
| Frontend | Render Static Site | https://movex-1.onrender.com |
| Backend | Render Web Service | https://movex-zkgd.onrender.com |
| Database | MongoDB Atlas | (cloud cluster) |

### Critical Deployment Config

**Backend (`server.js`) — DNS workaround for Windows Node:**
```javascript
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
This MUST be at the very top of server.js, before any other requires.

Backend Render environment variables:

MONGO_URI = MongoDB Atlas connection string

JWT_SECRET = (secret)

GEMINI_API_KEY = (from .env)

GEMINI_MODEL = gemini-3.5-flash-lite

PORT = 10000 (Render sets this automatically)

Frontend Render environment variables:

VITE_API_URL = https://movex-zkgd.onrender.com/api (⚠️ must include /api)

Frontend Render rewrite rule (essential for React Router):

Source: /*

Destination: /index.html

Action: Rewrite

Auto-deploy: Both services deploy automatically on git push to main.

Free tier caveat: Backend sleeps after 15 min inactivity. Use UptimeRobot to ping https://movex-zkgd.onrender.com/api/health every 14 min.

📁 4. CRITICAL FILE MAP
Frontend (single-root frontend/)
text
frontend/src/
├── api.js                     ← axios client, attaches x-auth-token, handles 401
├── App.jsx                    ← routes + inline auth state (no AuthContext)
├── main.jsx
├── data/
│   ├── regionConfig.js        ← ~48 city region arrays + CITY_REGIONS + progression
│   ├── geoHierarchy.js        ← STATES + CITIES catalogs + getCityForRegion etc.
│   └── hubAssets.js           ← level_1..5.webp mapping
├── services/
│   └── aiCoachApi.js          ← NEW: AI Coach conversation API wrapper
├── utils/
│   └── regionUtils.js         ← Voronoi/wedge polygon generator
├── components/
│   ├── layout/
│   │   ├── TopHeader.jsx
│   │   ├── Sidebar.jsx
│   │   ├── BottomNavigation.jsx
│   │   └── DashboardLayout.jsx
│   ├── map/
│   │   ├── IndiaLayer.jsx
│   │   ├── StateBoundariesLayer.jsx
│   │   ├── IndiaOutlineLayer.jsx
│   │   ├── MaharashtraLayer.jsx
│   │   ├── CityStationsLayer.jsx
│   │   ├── CityCollectiveHub.jsx
│   │   ├── StateHubsLayer.jsx
│   │   ├── MapZoomWatcher.jsx
│   │   └── MapCenterWatcher.jsx
│   ├── rewards/
│   │   ├── TrophyBalanceHeader.jsx
│   │   ├── RewardCard.jsx
│   │   ├── RewardFilters.jsx
│   │   ├── NextRewardProgress.jsx
│   │   ├── RedemptionSuccessModal.jsx
│   │   ├── MyRewardsList.jsx
│   │   └── RedemptionHistory.jsx
│   └── DashboardMap.jsx
├── context/
│   └── TrophyContext.jsx      ← single source of truth for trophy balance
└── pages/
    ├── Login.jsx, Register.jsx (Pro Athlete Flow = ₹99 now, was ₹299)
    ├── BeginnerDashboard.jsx
    ├── ProDashboard.jsx
    ├── Dashboard.jsx
    ├── StartActivityPage.jsx
    ├── ActivityResultPage.jsx
    ├── ActivityHistoryPage.jsx
    ├── AnalyticsPage.jsx
    ├── MapPage.jsx
    ├── RewardsPage.jsx
    ├── Leaderboard.jsx
    ├── QuestsPage.jsx
    ├── Profile.jsx
    ├── ClanPage.jsx
    └── AICoachPage.jsx        ← REWRITTEN: ChatGPT-style persistent chat
Backend
text
backend/
├── server.js                  ← MUST start with dns.setServers([...])
├── data/
│   └── regionHierarchy.js
├── models/
│   ├── User.js                ← uses accountType, NOT athleteMode
│   ├── Activity.js
│   ├── Community.js
│   ├── RegionalContribution.js
│   ├── Reward.js
│   ├── RewardInventory.js
│   ├── RewardRedemption.js
│   ├── TrophyTransaction.js
│   ├── Clan.js, ClanMember.js
│   ├── ClanEnergyTransaction.js
│   ├── ClanXPTransaction.js
│   ├── ClanChatMessage.js
│   ├── MoveXMoment.js
│   ├── AICoachProfile.js
│   └── AIConversation.js      ← UPDATED: adds title, accountType, index
├── routes/
│   ├── auth.js
│   ├── activity.js
│   ├── verification.js
│   ├── community.js
│   ├── rewards.js
│   ├── leaderboard.js
│   ├── geo.js
│   ├── clans.js
│   ├── aiCoach.js             ← REWRITTEN: + conversation CRUD + AI titles
│   └── ... (others)
├── services/
│   ├── avsEngine.js
│   └── notificationService.js
├── scripts/
│   ├── backfillTrophyPoints.js
│   ├── backfillGeoHierarchy.js
│   ├── fixBrokenCommunities.js
│   ├── inspectBrokenCommunities.js
│   ├── mergeMumbaiCities.js
│   ├── testHierarchy.js
│   ├── testAggregate.js
│   └── testAggregateApi.js
└── seedRewards.js
✅ 5. WHAT'S BUILT — FEATURE STATUS
✅ Core Systems
☑ JWT auth with movex_token + movex_user in localStorage
☑ Registration with cascading State → City → Region dropdowns
☑ Backend registration validation via isValidCombination()
☑ accountType separation (BEGINNER / PRO)
✅ MoveX Living Map
☑ Hierarchical map: India → State → City → Region
☑ Zoom-based layer switching (zoom ≤6 / 7-8 / 9-10 / ≥11)
☑ State colors, user's home state = #2563EB
☑ State boundaries (soft gray), India outline (black, z=465)
☑ City auto-detect by nearest map center
☑ Auto-focus on user's registered city
☑ Nationwide coverage: 23 states, 51 cities, ~370 regions
✅ MoveX Bazaar & Rewards
☑ Trophy economy: trophyPoints numeric field
☑ TrophyContext.jsx — single source of truth
☑ 18 seeded rewards
☑ Atomic redemption + idempotency
☑ Boost activation (24h/48h)
☑ My Rewards + equip cosmetics + redemption history
☑ 2-column mobile grid for reward cards
✅ Activity Flow
☑ StartActivityPage (Running / Walking / Cycling / Indoor)
☑ Live timer, pause/resume, finish
☑ POST /activity → POST /verification/run/:id
☑ AVS validation (identity, motion, GPS, timing, sensors)
☑ Full report popup
☑ Energy / XP / Trophy / Streak updates
✅ Leaderboard
☑ Geo-scoped: ?scope=region|city|state|global
☑ Tabs: Top Athletes, Regions Ranking, Global
☑ Sorted by Level → Energy → XP
✅ Quests
☑ 2-column mobile grid, compact cards
☑ All filters (ALL/DAILY/WEEKLY/COMMUNITY/REGIONAL/ATHLETE)
✅ MoveX Moment
☑ Shareable achievement card (1080×1920 + 1080×1080)
☑ html-to-image export + native share sheet
✅ AI Coach — ChatGPT-Style Persistent Chat (NEW)
☑ Backend AIConversation model with embedded messages
☑ Auto-generated short titles using Gemini (2-4 words)
☑ Fallback deterministic title if AI fails
☑ Ownership enforced on every endpoint
☑ Endpoints:
GET /api/ai-coach/conversations

POST /api/ai-coach/conversations

GET /api/ai-coach/conversations/:id

POST /api/ai-coach/conversations/:id/messages

PATCH /api/ai-coach/conversations/:id (rename)

DELETE /api/ai-coach/conversations/:id

☑ Multi-turn memory (last 20 messages sent to Gemini)
☑ User message persisted BEFORE AI call (survives AI failure)
☑ AI reply + AI title run in parallel (Promise.all) — zero added latency
☑ Desktop: 2-panel layout (sidebar + chat)
☑ Mobile: collapsible drawer
☑ Grouped history: Today / Yesterday / Previous 7 Days / Older
☑ Three-dot menu per conversation: Rename / Delete
☑ Delete confirmation modal
☑ Rename modal (60-char limit)
☑ Typing indicator (3 animated dots)
☑ Retry banner on AI failure
☑ Quick prompt chips on empty chat
☑ Stat cards (Energy/Streak/Weekly/Trophies) REMOVED from AI Coach page
☑ Lazy conversation creation (no duplicate empty "New Chat" rows)
☑ /chat legacy endpoint preserved
✅ Geographic Data
23 states supported:
Maharashtra (12 cities), Madhya Pradesh (8), Rajasthan (8), Uttar Pradesh (Lucknow), Bihar (Patna), Jharkhand (Ranchi), Odisha (Bhubaneswar), Chhattisgarh (Raipur), Andhra Pradesh (Visakhapatnam), Haryana (Gurugram), Kerala (Kochi), Punjab (Ludhiana), Jammu & Kashmir (Srinagar), Himachal Pradesh (Shimla), Uttarakhand (Dehradun), Assam (Guwahati), Sikkim (Gangtok), Karnataka (Bengaluru), Delhi, Telangana (Hyderabad), Tamil Nadu (Chennai), West Bengal (Kolkata), Gujarat (Ahmedabad).

🔧 6. KNOWN FIXES APPLIED
#	Bug	Fix
1	hier is not defined in verification.js	Added const hier = getHierarchy(user.region);
2	Backend returns .error, frontend reads .msg	Backend returns both; frontend reads both
3	Trophy balance out of sync	TrophyContext.jsx
4	Rewards showed 0 while header showed 2	Backfilled trophyPoints + TrophyContext
5	State borders all black	Softened to #94A3B8
6	India had no black outer border	Added IndiaOutlineLayer
7	Region polygons overlapped in Bengaluru	Fixed wedge algorithm
8	Mumbai regions extended into Arabian Sea	Added oceanRanges
9	Chennai regions extended into Bay of Bengal	Same
10	Map defaulted to India instead of user's city	initialCity memo
11	Duplicate StateHubsLayer crashed DashboardMap	Removed duplicate line
12	Registration showed only Pune regions	Cascading State → City → Region
13	querySrv ECONNREFUSED on Windows Node	dns.setServers(['1.1.1.1', '8.8.8.8']) at top of server.js
14	MongoNetworkError ECONNRESET from Render	Whitelisted Render IPs in MongoDB Atlas Network Access
15	Frontend couldn't reach backend on Render	VITE_API_URL env var must include /api suffix
16	React Router 404 on refresh (Render)	Added /* → /index.html rewrite rule
17	AI conversations didn't persist	New AIConversation model + endpoints
18	Every chat titled "New Chat"	AI title generation via Gemini
19	Multiple empty "New Chat" rows	Lazy creation + handleNewChat clears state only
20	AI Coach showed stat cards below chat	Removed from page
⚠️ 7. CRITICAL CONVENTIONS & GOTCHAS
Conventions
All IDs lowercase: pune, mumbai, gangtok, navi-mumbai

Field name = snake or camel per file, be consistent

Backend Mongoose: camelCase (trophyPoints, accountType) — ⚠️ NOT athleteMode

Frontend configs: camelCase (regionIds)

Colors: primary #2563EB, secondary #1D4ED8, hover #188AD8, success #20C9A6

Card radius: rounded-2xl (cards), rounded-3xl (hero)

Spacing: space-y-5, gap-4, page wrapper pt-2 pb-28 px-3 sm:px-4

Gotchas
❌ Never use ?? in PowerShell 5.1 — use if (-not $x)

❌ Never run node -e "..." in PowerShell if code has $ — write to .js file

❌ Never use dir /s /b in PowerShell — use Get-ChildItem -Recurse

❌ Never assume AuthContext exists — inline auth in App.jsx + localStorage

❌ Never full-file replace a file I haven't seen — always ask first

❌ Never paste JS into PowerShell. Wrong shell.

⚠️ The AI Coach page uses accountType, not athleteMode — check User model

✅ Backend scripts live in backend/scripts/ and run from backend/

✅ Vite cache clear: Remove-Item -Recurse -Force node_modules\.vite

✅ India GeoJSON at frontend/public/geojson/india-states.geojson (~22MB, NAME_1 property)

✅ Hub images at frontend/public/assets/hubs/level_1.webp … level_5.webp

✅ Gemini SDK: @google/genai — ai.models.generateContent({...})

✅ Gemini model: gemini-3.5-flash-lite (valid, confirmed)

🚀 8. HOW TO RUN
Terminal 1 — Backend
powershell
cd C:\Users\Rupam\MoveX\backend
npm run dev
Terminal 2 — Frontend
powershell
cd C:\Users\Rupam\MoveX\frontend
npm run dev
🎯 9. HOW TO ADD A NEW STATE + CITY
Given a state like "Goa" + city "Panaji":

frontend/src/data/regionConfig.js — add PANAJI_REGIONS array (5-7 regions) + register in CITY_REGIONS

frontend/src/data/geoHierarchy.js — import PANAJI_REGIONS, add { id: 'GA', name: 'Goa' } to STATES, add Panaji to CITIES, add to getRegionsForCity map

backend/data/regionHierarchy.js — add each region to REGION_HIERARCHY, CITY_HIERARCHY, STATE_HIERARCHY, PUBLIC_STATES

backend/models/User.js — append region names to enum

backend/routes/community.js — append to ALL_REGIONS

frontend/src/pages/MapPage.jsx — import + add to CITIES + STATES objects

frontend/src/components/DashboardMap.jsx — repeat step 6

🔮 10. PENDING / IN-PROGRESS
⏳ Speed up activity report generation (stamp logs added; Promise.all DB writes pending)

⏳ Full verification.js refactor

⏳ Post-activity "Share MoveX Moment" button

⏳ Rewards carousel → 2-col grid migration cleanup

⏳ State hub size tuning on India map

🐛 AI Coach: + New Chat doesn't visually clear when old empty "New Chat" rows exist

Patch provided: handleNewChat should just clear state (lazy creation)

Diagnostic in progress

🐛 AI Coach: verify AI-generated titles work (Gemini 3.5-flash-lite confirmed valid)

📌 11. QUICK REFERENCE — KEY COORDINATES
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
💬 12. COMMUNICATION RULES FOR AI
Trigger: when user says MoveX — assume this context.

Never guess at file contents. If you haven't seen a file, ask the user to paste it.

Never do full-file replacements of existing files — use targeted patches with exact "find this / replace with this".

Never use PowerShell-breaking syntax (??, backtick escapes, $variable in node -e).

Always prefer surgical patches over rewrites. When full rewrite is needed, tell the user why.

When given a list of requirements, deliver ONE step at a time with a test at each step.

Response length limit — a single reply can hold ~1 large file. Split across messages if needed.

Test commands belong at the end of each patch, not buried mid-reply.

Never send huge blind patches to debug issues — ask for terminal output, console errors, or network status codes first.

Before writing code, verify field names (e.g., accountType vs athleteMode).