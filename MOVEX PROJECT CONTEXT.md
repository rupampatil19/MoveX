# 🎯 MOVEX — PROJECT CONTEXT & MEMORY

> **Trigger word:** `MoveX`  
> **Repo:** https://github.com/rupampatil19/MoveX  
> **Last updated:** 2026-09-14  
> **Purpose:** Paste this file at the start of a new chat to restore full project context.

---

## 🧭 1. PROJECT IDENTITY

MoveX is a **fitness + gamified geographic living world** app for India.

**Tagline:** *Move More. Evolve Together.*

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

**Two ecosystems — kept strictly separate via `athleteMode`:**
- **BEGINNER** — personal fitness journey
- **PRO** — community & competition

All data, activities, leaderboards, rewards, hubs, and leaderboards must be filtered by `athleteMode`. Backend enforces; frontend filters.

---

## 🏗️ 2. TECH STACK

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Leaflet + react-leaflet, lucide-react, axios, canvas-confetti, html-to-image |
| Backend | Node.js, Express, MongoDB (Mongoose), JWT via `x-auth-token` header |
| Database | MongoDB (native, no ORM besides Mongoose) — Mongoose schemas |
| Auth | JWT. Token + user stored in `localStorage` as `movex_token` and `movex_user` |
| Maps | Leaflet + OpenStreetMap tiles. GeoJSON for India states. |
| Styling | Tailwind utility classes. Primary accent: **#2563EB** |

---

## 📁 3. CRITICAL FILE MAP

### Frontend (single-root `frontend/` OR split — as of last check, single-root)
frontend/src/
├── api.js ← axios client, attaches x-auth-token, handles 401
├── App.jsx ← routes + inline auth state (no AuthContext)
├── main.jsx
├── data/
│ ├── regionConfig.js ← ~48 city region arrays + CITY_REGIONS + progression
│ ├── geoHierarchy.js ← STATES + CITIES catalogs + getCityForRegion etc.
│ └── hubAssets.js ← level_1..5.webp mapping
├── utils/
│ └── regionUtils.js ← Voronoi/wedge polygon generator (center override)
├── components/
│ ├── layout/
│ │ ├── TopHeader.jsx ← real header (uses useTrophy for balance)
│ │ ├── Sidebar.jsx
│ │ ├── BottomNavigation.jsx
│ │ └── DashboardLayout.jsx
│ ├── map/
│ │ ├── IndiaLayer.jsx ← state fills + colors per user's home state
│ │ ├── StateBoundariesLayer.jsx ← gray internal borders (z=450)
│ │ ├── IndiaOutlineLayer.jsx ← black India national outline (z=465)
│ │ ├── MaharashtraLayer.jsx
│ │ ├── CityStationsLayer.jsx ← city hubs at state zoom
│ │ ├── CityCollectiveHub.jsx ← single big city hub at zoom 9-10
│ │ ├── StateHubsLayer.jsx ← state hubs (all) / active state
│ │ ├── MapZoomWatcher.jsx
│ │ └── MapCenterWatcher.jsx
│ ├── rewards/
│ │ ├── TrophyBalanceHeader.jsx
│ │ ├── RewardCard.jsx ← 2-col mobile grid, compact
│ │ ├── RewardFilters.jsx
│ │ ├── NextRewardProgress.jsx
│ │ ├── RedemptionSuccessModal.jsx
│ │ ├── MyRewardsList.jsx
│ │ └── RedemptionHistory.jsx
│ └── DashboardMap.jsx ← mini map on dashboard
├── context/
│ └── TrophyContext.jsx ← single source of truth for trophy balance
└── pages/
├── Login.jsx, Register.jsx ← cascading State → City → Region dropdowns
├── BeginnerDashboard.jsx ← 5 cards: Energy/Trophies/Streak/Level/My Clan
├── ProDashboard.jsx
├── Dashboard.jsx
├── StartActivityPage.jsx ← full activity flow + report popup
├── ActivityResultPage.jsx
├── ActivityHistoryPage.jsx
├── AnalyticsPage.jsx
├── MapPage.jsx ← main living map
├── RewardsPage.jsx ← MoveX Bazaar
├── Leaderboard.jsx ← geo-scoped, tabbed
├── QuestsPage.jsx ← 2-col mobile grid
├── Profile.jsx
├── ClanPage.jsx
└── ... (other pages unchanged)

### Backend
backend/
├── server.js
├── data/
│ └── regionHierarchy.js ← REGION_HIERARCHY + CITY_HIERARCHY + STATE_HIERARCHY
│ + getRegionsForCity/State + getHierarchy
│ + PUBLIC_STATES/CITIES + isValidCombination
├── models/
│ ├── User.js ← region enum (~370 regions), trophyPoints, stateId, cityId, countryId
│ ├── Activity.js ← full schema, verification, rewards
│ ├── Community.js ← region + accountType + city + state + country
│ ├── RegionalContribution.js
│ ├── Reward.js
│ ├── RewardInventory.js
│ ├── RewardRedemption.js ← idempotencyKey
│ ├── TrophyTransaction.js ← audit ledger
│ ├── Clan.js, ClanMember.js
│ ├── ClanEnergyTransaction.js
│ ├── ClanXPTransaction.js
│ ├── MoveXMoment.js
│ └── ... (others unchanged)
├── routes/
│ ├── auth.js ← /register validates hierarchy, /me returns publicUser
│ ├── activity.js ← POST / , GET /mine
│ ├── verification.js ← POST /run/:id — full AVS pipeline
│ ├── community.js ← /all, /:region, /:region/leaderboard, /aggregate
│ ├── rewards.js ← /catalog, /redeem, /my-rewards, /history, /equip, /activate-boost, /balance
│ ├── leaderboard.js ← /, /regions, /region/:region — geo-aware
│ ├── geo.js ← /hierarchy
│ ├── clans.js
│ └── ... (others unchanged)
├── services/
│ ├── avsEngine.js ← activity validation (identity, motion, GPS, timing, sensors)
│ └── notificationService.js ← createNotification
├── scripts/
│ ├── backfillTrophyPoints.js
│ ├── backfillGeoHierarchy.js
│ ├── fixBrokenCommunities.js
│ ├── inspectBrokenCommunities.js
│ ├── mergeMumbaiCities.js
│ ├── testHierarchy.js
│ ├── testAggregate.js
│ └── testAggregateApi.js
└── seedRewards.js

---

## ✅ 4. WHAT'S BUILT — FEATURE STATUS

### ✅ Core Systems
- [x] JWT auth with `movex_token` + `movex_user` in localStorage
- [x] Registration with cascading **State → City → Region** dropdowns
- [x] Backend registration validation via `isValidCombination()`
- [x] `athleteMode` separation (BEGINNER / PRO) enforced backend + frontend

### ✅ MoveX Living Map
- [x] Hierarchical map: **India → State → City → Region**
- [x] **Zoom-based layer switching**:
  - zoom ≤ 6 → India states + state hubs
  - zoom 7–8 → active state outline + city hubs
  - zoom 9–10 → City Collective Hub
  - zoom ≥ 11 → regional polygons + regional hubs
- [x] **State colors**: each state gets deterministic color from a curated 20-color palette
- [x] **User's home state** always `#2563EB` (MoveX blue)
- [x] **State boundaries**: `StateBoundariesLayer` — soft gray (`#94A3B8`, weight 0.9, opacity 0.55)
- [x] **India national outline**: `IndiaOutlineLayer` — black (`#000000`, weight 1.6), z-index 465
- [x] **City auto-detect** by nearest map center — panning auto-switches city
- [x] **Auto-focus on user's registered city** on `/map` load (reads `localStorage.movex_user.region`)
- [x] **Dashboard mini map** mirrors all the above at smaller scale
- [x] **Nationwide coverage**: 23 states, 51 cities, ~370 regions

### ✅ MoveX Bazaar & Rewards
- [x] **Trophy economy**: `trophyPoints` numeric field (separate from legacy `trophies: [String]` badge array)
- [x] **Single source of truth**: `TrophyContext.jsx` — used by Header, Rewards, Dashboard
- [x] **Reward catalog**: cosmetics, boosts, partner vouchers, clan perks, experiences
- [x] **Atomic redemption RPC**: `redeem_reward` with row locking + idempotency
- [x] **Boost activation**: 24h/48h timers, expiresAt enforcement
- [x] **My Rewards** inventory + equip cosmetics
- [x] **Redemption history**
- [x] **Next Reward progress** widget
- [x] **2-column mobile grid** for reward cards
- [x] **18 seeded rewards** (Poseidon's Trident Frame, Regional Energy Surge, XP Surge, Streak Shield, etc.)

### ✅ Activity Flow
- [x] `StartActivityPage` — Running / Walking / Cycling / Indoor Workout
- [x] Live timer, pause/resume, finish
- [x] POST /activity → POST /verification/run/:id pipeline
- [x] AVS validation (identity, motion, GPS, timing, sensors)
- [x] Full report popup with verification breakdown
- [x] Energy / XP / Trophy / Streak update
- [x] Regional / City / State / India contribution
- [x] **Fixed**: `hier is not defined` bug in `verification.js` (added `const hier = getHierarchy(user.region);`)
- [x] **Error visibility**: frontend now reads `.msg || .error || err.message`
- [x] Better loading UX (full-screen spinner with progress text)

### ✅ Leaderboard
- [x] Geo-scoped: `?scope=region|city|state|global`
- [x] Tabs: Top Athletes, Regions Ranking, Global
- [x] Sorted by Level → Energy → XP
- [x] Region/city pills only shown on Top Athletes tab
- [x] Backend endpoints `/`, `/regions`, `/region/:region`
- [x] Full-width mobile table with `table-fixed` + truncate

### ✅ Quests
- [x] 2-column mobile grid
- [x] Compact cards matching Rewards style
- [x] All filters (ALL/DAILY/WEEKLY/COMMUNITY/REGIONAL/ATHLETE) preserved

### ✅ MoveX Moment
- [x] Shareable achievement card
- [x] 1080×1920 Story + 1080×1080 Square formats
- [x] `html-to-image` export
- [x] Native share sheet (Web Share API) for Instagram
- [x] Copy caption
- [x] Reusable config-driven (MOVE_10_ACTIVITIES, STREAK_7, etc.)

### ✅ Geographic Data
**23 states currently supported:**
Maharashtra (12 cities), Madhya Pradesh (8), Rajasthan (8), Uttar Pradesh (Lucknow), Bihar (Patna), Jharkhand (Ranchi), Odisha (Bhubaneswar), Chhattisgarh (Raipur), Andhra Pradesh (Visakhapatnam), Haryana (Gurugram), Kerala (Kochi), Punjab (Ludhiana), Jammu & Kashmir (Srinagar), Himachal Pradesh (Shimla), Uttarakhand (Dehradun), Assam (Guwahati), Sikkim (Gangtok), Karnataka (Bengaluru), Delhi, Telangana (Hyderabad), Tamil Nadu (Chennai), West Bengal (Kolkata), Gujarat (Ahmedabad).

---

## 🔧 5. KNOWN FIXES APPLIED

| # | Bug | Fix |
|---|---|---|
| 1 | `hier is not defined` in `verification.js` | Added `const hier = getHierarchy(user.region);` |
| 2 | Backend returns `.error`, frontend reads `.msg` | Backend now returns both; frontend reads both |
| 3 | Trophy balance out of sync (header vs rewards) | `TrophyContext.jsx` — single source |
| 4 | Rewards showed `0` while header showed `2` | Backfilled `trophyPoints` + `TrophyContext` |
| 5 | State borders all black (too strong) | Softened to `#94A3B8` |
| 6 | India had no black outer border | Added `IndiaOutlineLayer` |
| 7 | Region polygons overlapped in Bengaluru | Fixed wedge algorithm neighbor unwrap |
| 8 | Mumbai regions extended into Arabian Sea | Added `oceanRanges` polygon option |
| 9 | Chennai regions extended into Bay of Bengal | Same |
| 10 | Map defaulted to India instead of user's city | Added `initialCity` memo reading `localStorage.movex_user` |
| 11 | Duplicate `StateHubsLayer` import crashed DashboardMap | Removed duplicate line |
| 12 | Registration showed only Pune regions | Replaced with cascading State→City→Region |

---

## ⚠️ 6. CRITICAL CONVENTIONS & GOTCHAS

### Conventions
- **All IDs lowercase**: `pune`, `mumbai`, `gangtok`, `navi-mumbai`
- **Field name = snake or camel per file, be consistent**
  - Backend Mongoose: camelCase (`trophyPoints`, `accountType`)
  - Frontend configs: camelCase (`regionIds`, `athleteMode`)
- **Colors**: primary `#2563EB`, secondary `#1D4ED8`, hover `#188AD8`, success `#20C9A6`
- **Card radius**: `rounded-2xl` (1rem) for cards, `rounded-3xl` for hero
- **Spacing**: `space-y-5`, `gap-4`, page wrapper uses `pt-2 pb-28 px-3 sm:px-4`

### Gotchas
- ❌ **Never use `??` in PowerShell 5.1** — it's PS7+ only. Use `if (-not $x)`.
- ❌ **Never run `node -e "..."` in PowerShell** if the code has `$` — always write to a `.js` file.
- ❌ **Never use `dir /s /b`** in PowerShell — use `Get-ChildItem -Recurse`.
- ❌ **Never assume `AuthContext` exists** — MoveX uses inline auth in `App.jsx` + localStorage.
- ❌ **Never full-file replace a file I haven't seen** — always ask for the file first.
- ❌ **Never paste JS into PowerShell.** Wrong shell.
- ✅ **Backend scripts live in `backend/scripts/`** and are run from `backend/`.
- ✅ **Vite cache clear**: `Remove-Item -Recurse -Force node_modules\.vite`
- ✅ **India GeoJSON** is at `frontend/public/geojson/india-states.geojson` (~22MB, GADM format, `NAME_1` property)
- ✅ **Hub images** at `frontend/public/assets/hubs/level_1.webp` … `level_5.webp`

---

## 🚀 7. HOW TO RUN

### Terminal 1 — Backend
```powershell
cd C:\Users\Rupam\MoveX\backend
npm run dev
Terminal 2 — Frontend
cd C:\Users\Rupam\MoveX\frontend
npm run dev

🎯 8. HOW TO ADD A NEW STATE + CITY (repeatable pattern)
Given a state like "Goa" + city "Panaji":

frontend/src/data/regionConfig.js — add PANAJI_REGIONS array (5–7 regions with {id, center: [lat,lng], color}) and register in CITY_REGIONS

frontend/src/data/geoHierarchy.js — import PANAJI_REGIONS, add { id: 'GA', name: 'Goa' } to STATES, add { id: 'panaji', name: 'Panaji', stateId: 'GA', regionIds: [...] } to CITIES, and add to getRegionsForCity map

backend/data/regionHierarchy.js — add each region to REGION_HIERARCHY, add panaji: { state: 'GA', ... } to CITY_HIERARCHY, add GA to STATE_HIERARCHY + PUBLIC_STATES

backend/models/User.js — append region names to region enum

backend/routes/community.js — append region names to ALL_REGIONS

frontend/src/pages/MapPage.jsx — import PANAJI_REGIONS, add city to CITIES object, add state to STATES object

frontend/src/components/DashboardMap.jsx — repeat step 6

No other code changes needed — the map, hubs, and aggregation are generic.

🔮 9. PENDING / IN-PROGRESS WORK
⏳ Speed up activity report generation — added stamp() timing logs; fire-and-forget notifications patch pending; Promise.all DB writes pending

⏳ Full verification.js refactor — waiting for current file to be pasted before rewriting

⏳ Post-activity "Share MoveX Moment" button — popup has room but not wired yet

⏳ Rewards carousel → 2-column grid migration — done for reward cards, still pending cleanup of reward-carousel CSS class

⏳ State hub size tuning on India map — currently size={28} (MapPage) / size={18} (DashboardMap); may need further adjustment

📌 10. QUICK REFERENCE — KEY COORDINATES
City	Center	Regions
Pune	[18.56, 73.85]	7
Mumbai	[19.076, 72.8777]	19 (incl. Thane + Navi Mumbai)
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
💬 11. COMMUNICATION RULES FOR AI
Trigger: when user says MoveX — assume this context.

Never guess at file contents. If you haven't seen a file, ask the user to paste it.

Never do full-file replacements of existing files — use targeted patches with exact "find this / replace with this."

Never use PowerShell-breaking syntax (??, backtick escapes, $variable in node -e).

Always prefer surgical patches over rewrites. When a full rewrite IS needed, tell the user why.

When given a list of requirements, deliver ONE step at a time with a test at each step. Do not batch 10 changes.

Response length limit — a single reply can hold ~1 large file. If multiple full files are needed, split across messages.

Test commands belong at the end of each patch, not buried mid-reply.

---

## 🎯 How to Use This

### Save the file
```powershell
cd C:\Users\Rupam\MoveX
notepad MOVEX_CONTEXT.md
# paste everything above, save