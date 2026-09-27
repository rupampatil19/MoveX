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

**Two ecosystems via `accountType`:**
- **BEGINNER** — personal fitness journey
- **PRO** — community & competition

⚠️ **The User model field is `accountType`, NOT `athleteMode`.** All models and endpoints filter by `accountType`.

---

## 🏗️ 2. TECH STACK

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 8, Tailwind v3, Framer Motion, Leaflet, lucide-react, axios, canvas-confetti, html-to-image, react-markdown, recharts, jspdf |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT (`x-auth-token`), Socket.IO, helmet, express-rate-limit |
| Database | MongoDB Atlas |
| Auth | JWT. Token + user in `localStorage` as `movex_token` and `movex_user` |
| AI | Google Gemini via `@google/genai`. Model: `gemini-3.5-flash-lite` |
| Styling | Tailwind + custom glass + clean-surface utilities. Primary: **#2563EB** |

---

## 🚀 3. DEPLOYMENT (LIVE)

| Service | Platform | URL |
|---|---|---|
| Frontend | Render Static Site | https://movex-1.onrender.com |
| Backend | Render Web Service | https://movex-zkgd.onrender.com |
| Database | MongoDB Atlas | (cloud cluster) |

### Critical Deployment Config

**Backend `server.js` — DNS workaround (MUST be very first line):**
```javascript
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
Backend env vars (Render):

MONGO_URI

JWT_SECRET

GEMINI_API_KEY

GEMINI_MODEL = gemini-3.5-flash-lite

CORS_ORIGIN = https://movex-1.onrender.com

PORT = 10000 (Render sets automatically)

Frontend env vars (Render):

VITE_API_URL = https://movex-zkgd.onrender.com/api (⚠️ must include /api)

Frontend Render rewrite rule (React Router refresh fix):

Source: /* → Destination: /index.html → Action: Rewrite

Frontend Render security headers:

Path	Header	Value
/*	X-Frame-Options	DENY
/*	X-Content-Type-Options	nosniff
/*	Referrer-Policy	strict-origin-when-cross-origin
/*	Permissions-Policy	geolocation=(self), microphone=(), camera=()
/*	Strict-Transport-Security	max-age=31536000; includeSubDomains
Auto-deploy: git push to main triggers both services to redeploy in ~1-3 min.

Free tier: Backend sleeps after 15 min inactivity. UptimeRobot pinging https://movex-zkgd.onrender.com/api/health every 14 min keeps it warm.

PWA: Installed PWA auto-updates on git push + Render redeploy. No reinstall needed. registerType: 'autoUpdate' + registerSW({ immediate: true }) in main.jsx.

📁 4. CRITICAL FILE MAP
Frontend
text
frontend/
├── tailwind.config.cjs        ← MUST be .cjs (package.json is "type": "module")
├── postcss.config.cjs         ← MUST be .cjs
├── vite.config.js             ← Vite handles its own config as .js
├── public/ (icons, geojson, hubs)
└── src/
    ├── api.js                    ← axios, x-auth-token header, 401 handler, VITE_API_URL
    ├── App.jsx                   ← routes + inline auth (no AuthContext)
    ├── main.jsx                  ← imports index.css + registerSW
    ├── index.css                 ← Tailwind + GLASS + CLEAN SURFACE utilities
    ├── data/ (regionConfig, geoHierarchy, hubAssets)
    ├── services/aiCoachApi.js
    ├── utils/regionUtils.js
    ├── components/
    │   ├── ui/                   ← ⭐ SHARED DESIGN SYSTEM
    │   │   ├── MoveXCard.jsx
    │   │   ├── SectionHeader.jsx
    │   │   ├── Button.jsx
    │   │   ├── EmptyState.jsx
    │   │   └── LoadingSkeleton.jsx
    │   ├── layout/
    │   │   ├── Sidebar.jsx           ← floating glass, left-3 top-1 bottom-3, rounded-3xl
    │   │   ├── TopHeader.jsx         ← floating glass, sticky top-1 mx-3, rounded-2xl
    │   │   ├── BottomNavigation.jsx  ← floating glass pill, bottom-3 left-3 right-3
    │   │   └── DashboardLayout.jsx   ← glass-page-bg, md:ml-[17.5rem], pb-28
    │   ├── map/ (IndiaLayer, StateBoundariesLayer, IndiaOutlineLayer, CityStationsLayer, CityCollectiveHub, StateHubsLayer, MapZoomWatcher, MapCenterWatcher, MaharashtraLayer)
    │   ├── rewards/ (TrophyBalanceHeader, RewardCard, RewardFilters, NextRewardProgress, RedemptionSuccessModal, MyRewardsList, RedemptionHistory)
    │   ├── MoveXMoment.jsx          ← ⭐ 1080×1920 / 1080×1080 shareable card
    │   ├── DashboardMap.jsx
    │   ├── Logo.jsx
    │   └── NotificationBell.jsx
    ├── context/TrophyContext.jsx
    └── pages/
        ├── Login.jsx, Register.jsx (Pro Athlete Flow = ₹99)
        ├── BeginnerDashboard.jsx, ProDashboard.jsx, Dashboard.jsx (legacy dark)
        ├── StartActivityPage.jsx (real GPS tracking + report + MoveX Moment)
        ├── ActivityResultPage.jsx, ActivityHistoryPage.jsx
        ├── AnalyticsPage.jsx (charts + PDF)
        ├── MapPage.jsx (dynamic title)
        ├── RewardsPage.jsx, QuestsPage.jsx
        ├── Leaderboard.jsx
        ├── Profile.jsx
        ├── ClanPage.jsx
        └── AICoachPage.jsx (ChatGPT-style, sidebar + drawer + rename/delete)
Backend
text
backend/
├── server.js                  ← STARTS WITH dns.setServers([...])
│                                 HAS helmet + rate limiters + strict CORS
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
│   ├── auth.js (⚠️ login/register are rate-limited, /me is NOT)
│   ├── activity.js, verification.js, community.js, rewards.js, leaderboard.js, geo.js, clans.js
│   └── aiCoach.js             ← CRUD + AI title generation + legacy /chat
├── services/avsEngine.js, notificationService.js
└── scripts/ (backfill*, fix*, test*, merge*)
✅ 5. WHAT'S BUILT
✅ Core
☑ JWT auth (movex_token + movex_user)
☑ Registration: State → City → Region cascade
☑ accountType separation
☑ Deployed on Render + MongoDB Atlas
☑ Auto-deploy on git push
☑ Security: helmet, rate limiting (skipped in dev), strict CORS, security headers
✅ MoveX Living Map
☑ Hierarchical (India → State → City → Region)
☑ Zoom-based layer switching (≤6 / 7-8 / 9-10 / ≥11)
☑ Home state = #2563EB, others from curated palette
☑ State boundaries soft gray, India outline black z=465
☑ Dynamic title: India / Maharashtra / Pune / Kothrud Living Map
☑ Hub size hierarchy:
India-level state hubs: 32px

Active state hub: 64px

City stations: 36px

City collective hub: zoom 9-10

☑ 23 states, 51 cities, ~370 regions
✅ MoveX Bazaar & Rewards
☑ Trophy economy + TrophyContext single source of truth
☑ 18 seeded rewards
☑ Atomic redemption with idempotencyKey
☑ Boost activation (24h/48h)
☑ My Rewards + equip + history
☑ Mobile: 2-column card grid (no carousel)
☑ Loading → LoadingSkeleton grid, empty → EmptyState
✅ Activity Flow
☑ Real GPS tracking via navigator.geolocation.watchPosition
☑ Haversine distance calculation, accuracy-filtered (< 50m)
☑ GPS status: Acquiring / Active / Denied / Indoor
☑ Manual distance fallback when GPS fails
☑ Double-finish protection
☑ Premium report: status pill, rewards, impact, AVS pipeline
☑ MoveX Moment: 1080×1920 story + 1080×1080 square
☑ Download / Copy Caption / Native share sheet
☑ "View Activity" navigates to /activity (not /activity/result/:id)
✅ Leaderboard
☑ Geo-scoped: Global / State / City / Region
☑ Tabs styled consistently, no mojibake in headers
☑ Row for current user highlighted with [YOU] badge
☑ Mobile table: horizontal scroll only inside container
☑ Regions Ranking shows only current city's regions
✅ Quests
☑ 2-column grid on mobile
☑ "Track" button navigates to /start (was broken no-op)
☑ Progress bar blue while active, green when completed
☑ Uses MoveXCard + Button + EmptyState
✅ MoveX Moment (NEW)
☑ MoveXMoment.jsx — full-size 1080×1920 or 1080×1080 card export
☑ Brand gradient background, decorative circles
☑ Icon + activity type + distance + duration + energy + XP + streak + region
☑ html-to-image export
☑ Web Share API for mobile → native share sheet
☑ Copy caption with hashtags
✅ AI Coach (ChatGPT-Style)
☑ Backend AIConversation with embedded messages
☑ AI-generated 2-4 word titles via Gemini (e.g. "Back Pain", "Running Stamina")
☑ Fallback deterministic title if AI fails
☑ Ownership enforced on all endpoints
☑ Multi-turn memory (last 20 messages)
☑ User message persisted BEFORE AI call
☑ AI reply + AI title run in Promise.all (no added latency)
☑ Desktop: 2-panel (sidebar + chat)
☑ Mobile: collapsible drawer
☑ Grouped: Today / Yesterday / Previous 7 Days / Older
☑ Three-dot menu: Rename / Delete
☑ Typing indicator (3 dots), retry banner on failure
☑ Quick prompts on empty chat
☑ Lazy conversation creation (no duplicate empty "New Chat")
✅ Analytics
☑ Primary stats: Workouts, Distance, Energy, XP
☑ Secondary stats: Duration (rounded), Streak, Trophies
☑ Distance trend line chart (30 days)
☑ Workout types bar chart
☑ Recent activities timeline
☑ Generate Analysis PDF (preserved jsPDF logic)
✅ UI Design System (Phase 1-8 complete)
☑ MoveXCard — variants: elevated, hero, padded, to
☑ SectionHeader — title + subtitle + optional action link + icon
☑ Button — variants: primary / secondary / ghost / danger, sizes: sm / md / lg, loading state
☑ EmptyState — icon + title + message + optional action
☑ LoadingSkeleton — variants: line / metric / circle / card / chip
☑ Applied across: Dashboard, Activity, Map, Profile, Rewards, Quests, Leaderboard, Analytics, AI Coach
✅ Glassmorphism (fixed nav only)
☑ .glass-page-bg — soft single-color blue gradient
☑ .glass-strong — floating panels (sidebar, topheader, bottomnav, modals)
☑ .glass-subtle — small pills
☑ Content cards use clean white (MoveXCard), NOT glass (readability)
☑ Sidebar: fixed left-3 top-1 bottom-3 rounded-3xl
☑ TopHeader: sticky top-1 mx-3 rounded-2xl
☑ BottomNavigation: floating pill bottom-3 left-3 right-3 rounded-2xl
☑ Center Start button: white ring border-4 border-white/70
✅ Geographic Data
23 states: Maharashtra (12 cities), MP (8), Rajasthan (8), UP, Bihar, Jharkhand, Odisha, Chhattisgarh, AP, Haryana, Kerala, Punjab, J&K, HP, Uttarakhand, Assam, Sikkim, Karnataka, Delhi, Telangana, TN, WB, Gujarat

🔧 6. KNOWN FIXES APPLIED
#	Bug	Fix
1-20	(see prior versions)	(unchanged)
21	Register showed ₹299	Changed to ₹99
22	Dashboard hero copy	"Move, Compete and Grow Together"
23	PostCSS Unexpected token, expected "," from sucrase	Renamed postcss.config.js and tailwind.config.js → .cjs with module.exports
24	tailwind.config.js had __CONFIG__ placeholder	Replaced with real config
25	Em-dash mojibake in CSS comments	Rewrote index.css as pure ASCII
26	429 during dev	Rate limiter now skip: () => process.env.NODE_ENV !== 'production'
27	/auth/me counted against auth limiter	Auth limiter only applies to /login + /register
28	Profile trophies.length disagrees with header	Now uses TrophyContext.balance (single source)
29	SatelliteOff icon not in lucide	Swapped to WifiOff
30	require('react') in JSX	Used forwardRef import
31	Profile duration decimals (355.28000...)	Math.round(totalDuration)
32	MoveX Moment "View Activity" went to nonexistent route	Navigates to /activity
33	Quests "Track" button was no-op	navigate('/start')
34	Leaderboard headers showed âš¡ â­	Replaced with plain text ("Energy", "XP")
35	Hardcoded map title "MoveX Living Map"	Dynamic via mapTitle memo
36	India state hubs too large (50px)	Now 32px
37	Active state hub dominated (110px)	Now 64px
⚠️ 7. CRITICAL CONVENTIONS & GOTCHAS
Conventions
All IDs lowercase (pune, navi-mumbai)

Backend Mongoose: camelCase (trophyPoints, accountType) — ⚠️ NOT athleteMode

Frontend configs: camelCase (regionIds)

Colors: primary #2563EB, hover #1D4ED8, success #20C9A6

Radius: rounded-2xl (cards), rounded-3xl (hero, floating panels)

Floating layout offsets: Sidebar md:ml-[17.5rem], bottom padding pb-28

Card pattern: Always prefer MoveXCard over raw bg-white rounded-2xl

Title pattern: text-2xl sm:text-3xl font-bold text-gray-900

Section pattern: Always use SectionHeader component

Gotchas — File Writing (CRITICAL)
❌ Never use Add-Content or Set-Content for source files — PowerShell 5.1 writes UTF-16LE with BOM → breaks Vite parser with misleading errors

❌ Never use non-ASCII chars (em-dash, smart quotes, ellipsis) in source files via PowerShell

✅ Safe way: Node.js fs.writeFileSync(path, content, "utf8") via .cjs script

✅ Safe way: Notepad with UTF-8 (plain, not BOM)

✅ Safest: VSCode

✅ .cjs scripts required in project with "type": "module" if using require()

Gotchas — Vite / Config
✅ postcss.config.cjs + tailwind.config.cjs MUST be .cjs

✅ vite.config.js stays .js

✅ sucrase errors in .css = ESM/CJS config conflict

✅ Vite cache: Remove-Item -Recurse -Force node_modules\.vite

Gotchas — Runtime
❌ Never assume AuthContext exists — inline auth in App.jsx

❌ Never full-file replace a file you haven't seen

❌ Never use ?? in PowerShell 5.1

✅ window.location.hostname on Render is wrong — use VITE_API_URL

✅ NODE_ENV=production on Render → rate limiters active

✅ Local dev: rate limiters skipped via skip: () => IS_DEV

🎨 8. DESIGN SYSTEM REFERENCE
Spacing: Page uses pt-2 pb-28 px-3 sm:px-4 on mobile
Card: bg-white border border-gray-200/80 rounded-2xl + soft shadow
Hero gradient: bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-hero
Primary button: bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl h-11 px-4
Secondary button: bg-white border border-gray-200 text-gray-700

Typography hierarchy:

Page title: text-2xl sm:text-3xl font-bold text-gray-900

Section title: text-base font-semibold text-gray-900

Card title: text-sm font-medium

Body: text-sm text-gray-600

Meta: text-xs text-gray-500

Label: text-[10px] font-semibold uppercase tracking-wider text-gray-500

🚀 9. HOW TO RUN
powershell
# Terminal 1 — Backend
cd C:\Users\Rupam\MoveX\backend
npm run dev

# Terminal 2 — Frontend
cd C:\Users\Rupam\MoveX\frontend
npm run dev
Test on: http://localhost:5173

🎯 10. HOW TO ADD A NEW STATE + CITY
frontend/src/data/regionConfig.js — add regions array + register

frontend/src/data/geoHierarchy.js — add state, city, register in getRegionsForCity

backend/data/regionHierarchy.js — add all three hierarchy entries

backend/models/User.js — append regions to enum

backend/routes/community.js — append to ALL_REGIONS

frontend/src/pages/MapPage.jsx — add to CITIES + STATES

frontend/src/components/DashboardMap.jsx — repeat step 6

🔮 11. PENDING / IN-PROGRESS
⏳ Speed up activity report generation

⏳ Full verification.js refactor

⏳ Extract shared CITIES/STATES to utils/mapConfig.js (currently duplicated in MapPage + DashboardMap)

⏳ Remove legacy MaharashtraLayer (only renders for Maharashtra)

⏳ Remove legacy Dashboard.jsx (dark theme, not routed)

⏳ Socket.IO URL still hardcoded to http://localhost:5000 — needs env var fix

⏳ Rename conversation polish in AI Coach (currently works, could be refined)

🐛 Dev-only: Socket.IO reconnect loop when backend is down — harmless but noisy

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
Trigger: user says MoveX → assume this context.

Never guess at file contents. Ask user to paste.

Never full-file replace files not yet seen.

Never use PowerShell-breaking syntax (??, backticks, $var in node -e).

Never use Add-Content/Set-Content for source files → use Node.js or Notepad UTF-8.

Prefer surgical patches over rewrites.

Deliver ONE step at a time with a test at each step.

Test commands belong at the end of each patch.

Never send huge blind patches to debug. Ask for terminal output first.

Verify field names (accountType, not athleteMode).

Verify config extensions (.cjs for postcss + tailwind).

Prefer MoveXCard / SectionHeader / Button / EmptyState / LoadingSkeleton in all new code.

