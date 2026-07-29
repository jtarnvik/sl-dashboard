# CLAUDE.md

@../publicbackend/CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session start

Before generating any TypeScript or React code, read `eslint.config.js` to avoid lint violations.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

There are no tests in this project.

## Purpose and general information

This is a personal project. It's main function is to give a quick dashbard for my personal bus stop and also make it easy
to return to that busstop when out and about. It is also used by a few close friends who are able to select different home bus stops.

The app is hosted on GitHub Pages and built via GitHub Actions. SL APIs are called directly from the browser — no API keys required. It has a companion backend (`publicbackend`) that handles Google OAuth2 login, user management, and settings persistence for logged-in users.

## Architecture

This is a React 19 + TypeScript + Vite + Tailwind CSS dashboard for Stockholm public transit (SL — Storstockholms Lokaltrafik). The UI is in Swedish. It calls SL's public integration APIs directly from the browser — no API keys required.

### App structure (`src/`)

**`App.tsx`** is the root. It manages:
- Authentication state (`user`: `undefined` = loading, `null` = not logged in, `User` object = logged in) and the `login` / `logout` / `updateSettings` functions.
- Three React contexts: `ErrorContext` (global error string + retry function), `UserContext` (auth state and actions), and `PageTitleContext` (current page heading shown in the navbar).

**`Main.tsx`** renders the main page (`/`). It derives `settingsData` with the priority chain: backend settings (logged-in) → `loadStopHint()` → `DEFAULT_SETTINGS`. It manages integer generation counters (`departuresGen`, `routesGen`, `deviationsGen`) used as `key` props on the panes — incrementing a counter forces a full remount and re-fetch of that pane.

**`Layout.tsx`** wraps all routes with `Navbar`, an `ErrorBoundary`, and the `Settings` modal. It owns `settingsOpen` state and listens for the `openSettings` window event so the modal can be opened from any route. It also owns `InDebugModeContext` — the provider lives here (not in `Main`) so that `Settings` and all pane components share the same context instance.

### Login states and visible content

| State | Navbar right | Panes shown |
|---|---|---|
| Loading | Spinner | Departures only |
| Not logged in | "Logga in" (active) | Departures + LoginTeaser |
| Logged in | Hamburger menu | Departures + Routes + Deviations |

`LoginTeaser` (`src/components/pane/login-teaser/`) is a card shown below Departures when not logged in. It contains a teaser text and a link to the GDPR page.

### Navbar (`src/components/navbar/`)

`Navbar` is a fixed top bar. The logo is clickable and navigates to `/`. It shows the current page heading from `PageTitleContext`, and on the right: a spinner while auth loads, a login button when not logged in, or `NavMenu` when logged in.

`NavMenu` (`src/components/navbar/nav-menu/`) is the hamburger dropdown for logged-in users:
- Admin-only items at top: "Väntande användare" (with badge for pending count), "Användare", "Statistik"
- "Mitt konto" — navigates to `/my-account`
- "Inställningar" — dispatches `openSettings` window event (handled by `Layout`)
- "Logga ut"

The hamburger icon shows a red badge when there are pending access requests. The count is fetched on mount and on every menu open.

### Views and routes

| View | Route | Auth | Description |
|---|---|---|---|
| `Main` | `/` | Any | Main dashboard with panes |
| `MyAccount` | `/my-account` | Logged in | Reset hidden deviations, delete account, GDPR link |
| `PendingUsers` | `/admin/pending` | Admin | Approve/reject access requests |
| `ExistingUsers` | `/admin/users` | Admin | List and delete allowed users |
| `Statistics` | `/admin/statistics` | Admin | Usage statistics (shared routes, AI queries, user count) |
| `SharedRouteView` | `/route/:id` | Any | View a shared journey; shows login teaser to non-logged-in users |
| `Gdpr` | `/gdpr` | Any | GDPR info page |
| `LiveTrafficView` | `/live-traffic` | Logged in | Aktuell trafik — route group selector and focus toggle; schematic vehicle view (`live-traffic-graph`), polled every 8s. A temporary "Text" button opens the same data as text (`live-traffic-overview`) |
| `Denied` | `/denied` | — | Shown when access is denied during OAuth2 |

All routes except `/denied` are rendered inside `Layout`, which wraps them with `Navbar` and an `ErrorBoundary`.

### Three main panes

| Component | What it does |
|-----------|-------------|
| `src/components/pane/departures/` | Polls SL departures API every 60s for the selected stop. Animates departing rows before removing them. Sends deviation texts to the backend for AI interpretation; rows with pending interpretations show a `ScanningUnderline` indicator. Shows a legend modal and (in debug mode) raw JSON. |
| `src/components/pane/deviations/` | Fetches deviation messages for hardcoded lines: trains 43/44, bus 117, metro 17/18/19. Sends texts to the backend for AI interpretation. Shows colored transport icons (orange = has deviations); a `ScanningUnderline` indicator appears under each icon while its interpretation is in flight. |
| `src/components/pane/routes/` | On-demand route planner. Gets browser geolocation, then calls the SL journey planner API to find trips to the selected stop. User picks max walk time (15 or 60 min). Journey cards show AI-interpreted deviation info: the duration text turns orange and opens a deviation modal via `DeviationWrapper`; per-leg warning icons in `SldBreadCrumbs` indicate which segment is affected. |

### SL API endpoints (`src/communication/constant.ts`)

- **Departures**: `https://transport.integration.sl.se/v1/sites/{4-char-stop-id}/departures`
- **Journey planner**: `https://journeyplanner.integration.sl.se/v2/trips`
- **Deviations**: `https://deviations.integration.sl.se/v1/messages`
- **Stop search**: `https://journeyplanner.integration.sl.se/v2/stop-finder`

Stop IDs come in multiple formats (4-char, 9-char, 16-char). The departures endpoint uses the last 4 chars of the 16-char ID.

Documentation for the SL APIs is available at https://www.trafiklab.se/api/our-apis/sl/.

### Key patterns

- **Axios + AbortController**: All API calls store the controller in a `useRef`. New requests abort the previous one. `isAbortError()` in `src/types/communication.ts` suppresses abort errors.
- **`useVisibility` hook** (`src/hook/use-visibility.ts`): Refreshes data when the browser tab becomes visible again.
- **`TransportationMode` enum** and `LineCommon` component (`src/components/common/line/`) are the central abstraction for rendering transport icons with line badges. Two variants exist: `LineJourney` (for departures, uses `sl-responses` types) and `LineTransportation` (for journey legs, uses `sl-journeyplaner-responses` types).
- **`DeviationWrapper`** (`src/components/common/deviation-wrapper/`) wraps any text or element to show deviation indicators inline and open a deviation modal on click. Used in both the departures pane (time cell) and the routes pane (journey duration).
- **`ScanningUnderline`** (`src/components/common/scanning-underline/`) wraps any element and shows an animated 8px scanning line beneath it when `active` is true. Used to indicate that AI interpretation of deviation texts is in flight. A `lineOffset` prop shifts the line down to clear icon background colors.
- **`useUserLoginState` / `useUser`** (`src/hook/use-user.ts`): Custom hooks for consuming `UserContext`. `useUserLoginState()` returns a `UserLoginState` enum (`Loading` | `NotLoggedIn` | `LoggedIn`) derived from the `user` value (`undefined` = loading, `null` = not logged in, `User` object = logged in). `useUser()` returns the full context including `login`, `logout`, and `updateSettings` actions. Prefer these hooks over calling `useContext(UserContext)` directly.

### Type files

- `src/types/sl-responses.ts` — types for the departures API (`Departure`, `Line`, `Journey`, `SlDeparturesResponse`)
- `src/types/sl-journeyplaner-responses.ts` — types for the journey planner API (`Journey` as trips, `Leg`, `Transportation`)
- `src/types/deviations.ts` — types for the deviations API
- `src/types/common.d.ts` — global ambient types (`SettingsData`)
- `src/types/backend.ts` — types for the backend API (`User`, `UserSettings`)

### Settings architecture

Settings (selected stop point) are only available to logged-in users:
- **Logged-in users**: stored in the backend database. `GET /api/auth/me` always returns a non-null `settings` object (backend defaults to Skogslöparvägen if none saved). Saved via `PUT /api/protected/settings`. After a successful save, `updateSettings(data)` patches the local `UserContext` state without a round trip, and also writes a localStorage hint via `saveStopHint()`.
- **Loading / not logged in**: `Main.tsx` uses the priority chain `loadStopHint() ?? DEFAULT_SETTINGS` so the app shows the last-known stop immediately rather than flashing the hardcoded default. The Settings modal is not rendered for non-logged-in users.

`DEFAULT_SETTINGS`, `URL_BACKEND_SETTINGS`, and `STOP_HINT_KEY` are defined in `src/communication/constant.ts`. `saveSettings()` is in `src/communication/backend.ts`. `loadStopHint()` / `saveStopHint()` are in `src/util/stop-hint.ts`.

### `Deviation` type name collision

Three different types are all named `Deviation` across three files:

| Name | Source file | Used for |
|------|-------------|----------|
| `Deviation` | `src/types/sl-responses.ts` | Inline deviations on a departure |
| `Deviation` | `src/types/deviations.ts` | Deviations from the deviations API |
| `DeviationInfo` | `src/components/common/deviation-modal/index.tsx` | Normalized internal type used for display |

When importing more than one of these in the same file, use `as` aliases (e.g. `import { Deviation as DeviationSearch } from "../../../types/deviations"`). The `DeviationInfo` interface in `deviation-modal` is the common format that both `convertDeviations()` and `convertInfoMessages()` produce.

### Hardcoded lines in the Deviations pane

The monitored lines in `src/components/pane/deviations/` are **not** driven by the user's selected stop. They are hardcoded in `src/communication/constant.ts`:
- Trains: 43, 44
- Bus: 117
- Metro: 17, 18, 19

### `ignoreDeviation` filter

`ignoreDeviation()` in `src/components/common/deviation-modal/index.tsx` silently drops elevator outage messages. Any new deviation source added to the app should pass messages through this filter before displaying them.

### CSS approach

Primarily Tailwind utility classes. Several components also have a companion `index.css` for things Tailwind can't express — for example the departure row removal animation (`departure-row-removing`), the custom CSS grid layout (`departures-grid`), and the tram badge pill shape (`tram-badge-bulge`). Check for a sibling `index.css` before adding workaround inline styles.

Two custom font classes are defined in `tailwind.config.js`:
- `font-signage` — Bitter (serif), used for line number badges to mimic real SL signage
- `font-sans` — Roboto, the default body font

**Typography conventions** — do not add explicit font-size classes without a reason; let elements inherit the
body default (Roboto, 16px). Specific patterns:
- Interactive labels and checkbox labels: `font-medium text-gray-700` (no size class)
- Card/pane body text: `text-gray-800` (no size class)
- Supplementary / helper text below a control: `text-sm text-gray-500`
- Error or status text inside a card: `text-sm text-gray-600`

### Responsive design

The app is mobile-first. Default styles target mobile (iPhone-sized screens). Use `md:` (≥ 768px) and larger breakpoints to adapt for tablet and desktop. Do not write desktop-only styles without a mobile baseline.

For simple spacing or visibility changes, Tailwind responsive prefixes (`md:`, `lg:`) are fine. For complex multi-column layouts where column alignment across rows matters, use `grid-template-areas` in a companion `index.css` file with plain CSS `@media` queries — Tailwind utility classes do not guarantee cross-row column alignment.

### Global window events

Custom events dispatched on `window` are used for cross-tree communication between components that have no natural parent-child relationship. When adding a new event, document it here.

| Event name | Dispatched by | Handled by | Purpose |
|---|---|---|---|
| `"unauthorized"` | `backend.ts` (Axios response interceptor) | `App.tsx` | Forces logout when any API call returns 401 |
| `"pendingCountChanged"` | `pending-users.tsx` (after approve/reject) | `NavMenu` | Refreshes the pending access request count badge |
| `"openSettings"` | `NavMenu` (Inställningar menu item) | `Layout` | Opens the settings modal |
| `"deviationHidden"` | `deviation-modal/index.tsx` (after successful hide) | `Departures`, `Deviations`, `Routes` panes | Removes the hidden deviation (by `detail.id`) from each pane's local state |
| `"hiddenDeviationsReset"` | `MyAccount` (after successful clear-all) | `Main` | Increments `departuresGen` and `deviationsGen` to force remount and re-fetch of both panes |
| `"backendOffline"` | `backend.ts` (Axios response interceptor) | `App.tsx` | Sets `backendOffline = true` and clears `user` when any API call gets no response (network failure). Triggers the yellow offline banner and reverts UI to the not-logged-in view. A 30s retry loop restores state when the backend comes back. |

### Component conventions

- All components use **named exports**, not default exports (`App.tsx` is the only exception).
- Each component lives in its own directory with an `index.tsx` entry point.

## Future plans

This project is a learning tool first — the focus is on experimenting with new technologies rather than quickly shipping features. Steps are intentionally small to aid understanding and AI collaboration skills.

I may default to Java-style patterns in TypeScript/React without realising it — feel free to point this out.

FE - means frontend
BE - means backend
ME - Stuff for me to do, remind me if this gets to number 1.

Prefer 125 character wide lines in this file where the format allows it.

Implementation Steps

There are a few large blocks of implementation. Each block has its own letter and each step within that block
has its own order by number.

When discussing or designing a block or step, read the relevant source files first before asking clarifying
questions or proposing steps. Design suggestions based on assumptions about the code rather than the actual code
produce steps that may be subtly wrong. If it is unclear which files are relevant, identify and read them before
starting the discussion.

When rewriting or detailing a block or step, preserve the motivating context — the "why" behind design choices
that are not obvious from the code. Capture this at the block level (the `X - ...` line) as a brief sentence or
two, and within steps as inline notes where a non-obvious constraint or decision was made. Do not remove existing
"why" notes when rewriting step details.

A - FE/BE, Live vehicle map. Three distinct map views, each serving a different use case. All share the same
backend GTFS data pipeline but differ in what they display and how. Steps are intentionally small — get the
data pipeline working first (A1–A2), then implement the views one at a time.

### Goals

**A-Goal-1: Route map for journey planner**
Show the suggested routes from the route planner pane on a map — both the complete suggested route and each
individual leg. The data is already in the journey planner API response (coordinates per leg), so no GTFS
realtime data is needed. No map library exists yet in the frontend — choosing and integrating one is part of
this goal.

**A-Goal-2: Schematic train map**
A schematic (not geographically accurate) map of the monitored commuter train lines (43, 44) showing
approximately where each train is, which station it is at or between, and its probable arrival time at the
next station. Scale and exact position are not important — the station sequence and relative position between
stations is what matters. Metro lines (17, 18, 19) are excluded — they run frequently enough that tracking
individual vehicles is not useful. Data sources: GTFS-RT vehicle positions + static stops/trips for station
names and sequence.

**A-Goal-3: Bus tracking with push notification**
A schematic map of bus line 117 showing each stop in sequence and the current position of the bus. The primary
use case is knowing when to leave for the bus stop (6 minutes walk). The user can mark a specific bus as the
one they intend to catch, and the backend sends a push notification when that bus passes a designated trigger
stop. All the required data appears to be available (GTFS-RT positions, static stop sequences, Pushover for
notifications — already integrated). This is the most complex goal but the most personally useful.

### Architecture decisions captured so far

**Data sources (Samtrafiken API, key-based)**
- Static GTFS: `https://opendata.samtrafiken.se/gtfs/sl/sl.zip` — published daily 03:00–07:00, contains routes,
  trips, stops, shapes. Bronze: 50 calls/month — DB cache is essential. No upgrade applied for; one download
  per day fits comfortably, so there has been no need. The July 2026 upgrade below covers the realtime feed
  only; the two feeds have separate keys and separate tiers.
- Realtime GTFS-RT: `https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb` — live vehicle positions.
  **Upgraded tier granted (July 2026): 2,000,000 calls per rolling 30 days.** Requires `Accept-Encoding: gzip`
  header or the API returns 406.

**Realtime rate limit analysis (2,000,000 per 30 days)**
2,000,000/30 days ≈ 66,700/day ≈ 46 calls/minute sustained around the clock. The monthly budget is effectively
a non-constraint: the implemented 5-second poll interval is 12 calls/minute, so even a loop running 24/7 uses
roughly a quarter of the budget. The interval could go below 2 seconds before the quota became the limiting
factor.

*Superseded:* the original Bronze tier was 50/min and 30,000/month (≈1,000/day), which made the budget the
dominant design constraint — it is what motivated the ~15s TTL and the "one call every 86 seconds" arithmetic
that earlier versions of this file were built around. Those numbers no longer apply; the design decisions they
produced (request-driven polling, nothing running when nobody is watching) are still worth keeping for other
reasons — Render's 0.1 CPU allocation and simple good manners toward a free API.

Remaining constraints, in order of relevance: the per-minute rate limit on the new tier (12/min is far below
any plausible value), and Render CPU. A client leaving the map view open overnight is no longer a quota
problem, but the frontend should still pause polling when the tab is hidden — `useVisibility`
(`src/hook/use-visibility.ts`) already does this for the departures pane; reuse it in the map view.

**Static GTFS loading strategy**
- DB is the durable cache; `/tmp` is the working area for parsing. See A1 for full detail.
- Relevant files: `routes.txt` (line names/types), `trips.txt` (trip→route join), `stops.txt` (stop names/coords),
  `shapes.txt` (route polylines for map), `stop_times.txt` (stop sequences per trip — needed for geometric vehicle placement
  since `current_stop_sequence` is never populated in the RT feed).
- Key lookup chain from realtime feed: `trip_id` → `trips.txt` → `route_id` → `routes.txt` → `route_long_name`.
- What varies daily is which trips are active, controlled by `calendar_dates.txt` (actual service dates — `calendar.txt`
  is validity periods only).

**Vehicle position polling strategy**
- Backend does NOT poll continuously on a schedule. `GtfsRealtimeCache` (inner class in `GtfsRealtimeService`)
  polls only while clients are asking: the first request fetches directly and starts a background loop that
  refreshes every 5 seconds; the loop shuts down 5 minutes after the last request (sliding window). If no
  clients are active, nothing polls. Now motivated by Render's 0.1 CPU rather than by API quota.
- Frontend requests positions only when the map view is active.

**Render free tier constraints**
- 512 MB RAM, 0.1 CPU (shared), no persistent disk, one server running 24/7 within monthly free hours.
- UptimeRobot pings `/ping` every 5 min to prevent the 15-minute inactivity sleep.
- In-memory static GTFS for 6 lines is a small fraction of the raw file sizes and fits comfortably in 512 MB.

**Backup hosting: home server (Mac Mini or Raspberry Pi 5)**
If Render's constraints (CPU, API quota, cold starts) become too limiting, self-hosting at home is a planned
alternative. A Mac Mini is the pragmatic choice — more capable hardware, straightforward Java/Spring Boot
deployment, and Time Machine backups. A Raspberry Pi 5 is the more fun tinkering option. Either way the
architecture is identical: same Spring Boot app, local PostgreSQL replaces Supabase, persistent disk makes
the GTFS zip cacheable indefinitely. Tradeoffs vs Render: depends on home network reliability and requires
a DDNS service for a stable external address.

B - DONE - BE, Parse unzipped GTFS files into the database and serve from an in-memory `GtfsDataset`.
`GtfsParseService` owns all parse logic; `GtfsPipelineService` orchestrates; `GtfsAccessService` holds the
`AtomicReference<GtfsDataset>`, rebuilt from DB on `ApplicationReadyEvent` so data survives restarts.
Five DB tables (`gtfs_route`, `gtfs_trip`, `gtfs_stop_time`, `gtfs_stop`, `gtfs_calendar_date`) use natural
GTFS keys — no synthetic IDs, no timestamp columns. Full transaction design and the critical
`entityManager.detach(entry)` lock-avoidance pattern are documented in `GtfsParseService` class-level Javadoc.

**Package layout:** JPA entities live in `model/domain/entity/`; in-memory models (`GtfsDataset`,
`GtfsRouteInfo`, `GtfsTripInfo`, `GtfsStopInfo`, `GtfsStopTimeInfo`, `GtfsVehiclePosition`, `GeoPosition`,
`ParentStopIdentifier`) live in `model/gtfs/`, with checked exceptions in `model/gtfs/exception/` and the
C-block live route model in `model/gtfs/livetraffic/` (see I3). `GtfsRouteInfo` wraps `GtfsRoute` + its
matching `GtfsMonitoredRoute`, giving C1 access to `transportMode` and `routeGroup`.
Name-variant matching (e.g. 43X) lives in `GtfsNameUtil` and is shared between parse and access services.

**`gtfs_stop` includes parent stations** (`9021001xxxxxxxxx`, `location_type=1`) as well as platform stops
(`9022001xxxxxxxxx`). Two-pass parse: first pass collects platform stops and their `parentStation` IDs; second
pass retains those parent rows. Parent stations are the direction-neutral reference points for the schematic map.

**`gtfs_monitored_route` focus window columns:** `focus_start` / `focus_end` (nullable **parent station**
`stop_id`, `9021001…`) bound the sub-corridor shown on the schematic; `only_focused BOOLEAN NOT NULL DEFAULT
FALSE` hides the full route for branching lines. The ids must be parent stations because that is what
`LiveStop` resolves to — platform ids (`9022001…`) would never match — and must be given in **chain order**
(start nearer `stops[0]`); nothing sorts them.

Seeded values (changesets 036–039, updated by `transport_mode` so a group cannot diverge):

| Group | focus_start | focus_end | only_focused |
|---|---|---|---|
| TRAIN 43/44 | Kungsängen `9021001006081000` | Älvsjö `9021001005141000` | false |
| METRO 17/18/19 | Åkeshov `9021001001241000` | Medborgarplatsen `9021001001511000` | **true** |
| BUS 112, 117 | — | — | false |

*Why the metro window ends before Gullmarsplan:* Gullmarsplan is the last station all three green lines share
— 19 branches to Hagsätra right after it, 17/18 continue via Skärmarbrink. Ending at or before it keeps the
whole window on common track, so no vehicle can be projected onto a branch that is not drawn.
Medborgarplatsen (changeset 039, two stations earlier than the original Gullmarsplan) was chosen purely to
fit fewer stations on screen. `only_focused` is set for the metro because the unfocused view would have to
render a fork the schematic cannot draw, and `locateOnRoute()` would place branch trains at stations they
never reach.

`GtfsAccessService.validateRouteGroupConsistency()` enforces three rules at startup, aborting with
`IllegalStateException` (all violations are logged before the abort, so one startup shows the full picture):
1. All rows in a group carry identical focus config.
2. Both ends of the window are set, or neither — a half-set window reads as "no window" in the frontend and
   silently disables the toggle.
3. `only_focused` requires a complete window, or the group is locked into a view that cannot be produced.

**RT provider:** `SamtrafikenProvider.fetchVehiclePositions()` streams `VehiclePositions.pb` in-memory,
no temp file. `current_stop_sequence`, `stop_id`, and `route_id` are never populated in the Samtrafiken
feed — vehicle placement uses `GtfsGeometryUtil.locateOnRoute()` (dot-product projection + Haversine).

**Route group selector:** `(transportMode, routeGroup)` uniquely identifies a group. C1 sends this pair back
to the backend to select which group to display. `GET /api/protected/gtfs/route-groups` serves the list.

**Pending:** `feed_version` column on `gtfs_download_log` — populate from `feed_info.txt` during parse.

C - BE/FE, Vehicle position endpoint and view. Create a view this will show a schematic representation of
the route and a live view of vehicles on that route. 

C1 - DONE - FE/BE, Route group selection view. `LiveTrafficView` (`src/views/live-traffic.tsx`) at `/live-traffic`
shows a Headless UI Listbox (with transport icons) to pick the route group and a Switch toggle for focus mode.
`MonitoredRouteGroupResponse` extended with `focusStart`, `focusEnd`, `onlyFocused` (converted from record to
`@Value @Builder`). `GtfsAccessService.validateRouteGroupConsistency()` validates that all routes in a group
share identical focus config at startup — throws `IllegalStateException` to abort on misconfiguration.
`GET /api/protected/gtfs/route-groups` serves the list; `fetchRouteGroups()` in `backend.ts` fetches it.

C2 - DONE - FE/BE, When a route group is selected in the traffic view, fetch the route information from the backend. This 
just sets up the basic FE -> BE flow. So, when a selection has been made in the front end (including the intial first line on
load) call en endpoint in the GtfsCOntroller with the routegroup and focus parameter as argument. 
- Set up the call and create the endpoint. 
- Call a service method int the GTFSRealtime service. 
- Create an empty return object, with (for now) no information other than a "OK" status string.
- 

C3 - DONE - BE, Live route model (`model/gtfs/livetraffic/`) and the realtime endpoint that serves it.
See I3 for the class-by-class detail and the design reasoning behind the model itself.

- `GtfsRealtimeCache.getContinously()` — request-driven poll loop on a virtual thread, 5s interval, 5-minute
  **sliding** window renewed by each request (so a long viewing session never hits a mid-session blocking
  fetch, and polling stops promptly when the user leaves). Interval and window are constants at the top of
  the inner class. Logs per-cycle timings (`fetch`, `join`, `sincePreviousCycle`).
- `GtfsRealtimeService.getRouteData()` — resolves the group's `LiveTrip` **first** (so a misconfigured group
  cannot trigger an upstream call), then locates every vehicle on that one shared chain via
  `GtfsGeometryUtil.locateOnRoute(liveTrip.getLiveStops(), vp)`. Placing all vehicles on one chain is the
  point: equal `segIdx` means genuinely between the same two stations.
- `RouteData` (domain) → `RouteDataMapper` → `RouteDataResponse` (wire). The chain is sent **once** per
  response, not per vehicle. Route/edge variants are deliberately not serialized yet.
- `LiveVehicle.getDestination()` reads the vehicle's **own** trip (`stop_headsign`, falling back to its last
  stop's parent station). Deriving destination from the chain's end was wrong for short turns, which are
  routine on the metro and on 117 at rush hour.
- Missing `LiveTrip` for a group is a loud `log.error` + `status: "No live trip for group"` — it is a
  configuration failure, not a data gap.
- `GtfsDataset.organizeRoutes()` now builds each group independently: one bad group no longer wipes out all
  live trips, and an unchecked `GtfsNoRegisteredSelectorForGroupKeyException` no longer escapes the
  constructor and kills the whole dataset. Summary line `Live trips built for N of M route groups`.
- Note: live traffic cannot be exercised on Render until the non-local dataset switch is lifted — see I5.

C4 - DONE - FE, Live traffic view. Types in `src/types/backend.ts` (`LiveStop`, `LiveTrip`, `LiveVehicle`,
`RouteData`); two components under `src/components/pane/`.

- `live-traffic-graph/` — the schematic. Vertical axis at `AXIS_X_PERCENT` (65%, one constant drives axis,
  stop rows and both label lanes). Stop names hug the left edge with a flexbox leader dash that fills the
  remaining space and ends on the axis — no measuring, names of any length line up. Triangles ride 8px off
  the axis (▼ right / ▲ left) so opposing vehicles never overlap; destination labels sit in lanes either
  side. `transition-[top]` slides vehicles between polls.
- **Equal (schematic) stop spacing, not proportional.** `stopY(i) = i / (n-1)`,
  `vehicleY(v) = (segIdx + segmentFraction) / (n-1)`. Proportional was tried on paper and fails badly on
  line 43: 74 km over 20 stops puts inner-city stations ~8px apart in a 600px box. Consequence: screen speed
  no longer reflects real speed, and `shapeDistTraveled` is not consulted at all (so its nullability is moot).
  Both position functions are pure and swappable if a to-scale mode is ever wanted.
- `live-traffic-overview/` — the text representation, now behind a temporary "Text" button in a modal.
  Marked TODO; remove when the graph fully replaces it. Reads the same `routeData`, so it updates live.
- **Drawing technique: positioned divs, not SVG.** Everything here is axis-aligned lines plus text, which
  divs do well — and SVG `<text>` has no wrapping or ellipsis, which long Swedish station names need. Switch
  to SVG when branches (metro forks), rotation, or curves arrive.
- Polling is 8s with a `document.visibilityState` check in the tick, plus `useVisibility` for an immediate
  refresh on return. Responses are stored with a `requestKey` (group + focused) and ignored if they no longer
  match the selection — a late reply for a previous line would otherwise paint the wrong vehicles onto the
  new chain.
- 117 is preselected via `DEFAULT_GROUP_DISPLAY_NAME`; without it the first group alphabetically wins, which
  is bus 112 (the test line).

C5 - IN PROGRESS - BE/FE, Honour the `focused` flag. Motivation: the metro and train chains carry many stops
in areas of no interest, and cropping also sidesteps the branch problem below.

**Done — configuration and GUI.** Focus values seeded (see the B-block table above), the three startup
validation rules added, and the view now derives the toggle's state from the group rather than hardcoding it.
Three predicates in `views/live-traffic.tsx` carry the rules:

| Group | focused on load | Switch |
|---|---|---|
| Train 43/44 | true | enabled — the only group where it can be turned off |
| Metro 17/18/19 | true | locked on (`onlyFocused`) |
| Bus 112/117 | false | locked off (no window) |

Switching group resets `focused` to that group's default rather than remembering the user's last choice —
less state for a preference the reasoning says is rarely changed. The lock is presentational only: `focused`
is still a plain request parameter, so `getRouteData()` should force it true for `onlyFocused` groups rather
than trusting the caller.

**Remaining — the actual cropping in `getRouteData()`**, which still accepts `focused` and ignores it.
Design decisions still open (to be settled before implementing):
- What focus crops. Trimming `liveTrip.stops` to the `focusStart`/`focusEnd` window is the obvious half;
  the question is what happens to vehicles outside the window — dropped, or kept and clamped to the ends so
  an approaching vehicle is still visible.
- Whether `segIdx` stays an index into the **returned** stop list. The frontend assumes it does. If the
  chain is cropped after location, the indices must be rebased or the drawing breaks silently.

**Related problem this fixes:** `locateOnRoute()` projects every vehicle onto the drawn chain, always
choosing the geometrically closest segment. Green-line trains on a branch the chain does not follow are
therefore projected onto the drawn leg and shown at stations they will never reach — silently plausible and
wrong. `distanceMetres` in the response is the tell; it goes large when a vehicle is not really on the chain.
The metro window ending at Gullmarsplan removes the case entirely, since everything inside it is on common
track. 117 and 43 are unaffected.

D1 - FE, Map view. Add a new pane or route that renders vehicle positions on a map (library TBD — Leaflet or
MapLibre are candidates). Poll the backend vehicle position endpoint while the view is active. Display vehicle
icons colour-coded by transport mode, oriented by bearing. Show route line shapes from static GTFS data.

G1 - MOSTLY RESOLVED - BE - `rebuildDataset()` used to run twice on startup — once via the pipeline in
`GtfsDownloadJob.onApplicationReady()` and once directly from `GtfsAccessService.onApplicationReady()`.
The second call is now guarded by an `if (!dataset.get().isEmpty())` early return, so the redundant DB
load is gone. What still runs twice is `validateRouteGroupConsistency()`, which is cheap and in-memory.

G2 - BE - `GtfsRealtimePollJob` is a temporary scheduled job (`port.incoming.scheduled`) that polls
`SamtrafikenProvider.fetchVehiclePositions()` every 5 minutes between 06:00 and 23:55 Stockholm time and
discards the result. Its sole purpose is to keep the Samtrafiken RT feed warm and verify that continuous
polling works within the API quota. Remove this job when the C-block schematic view starts consuming live
vehicle positions for real.

H1 - BE - Difference and handling of FAILED/ERROR_IN_PARSE
--
FAILED — set by GtfsDownloadService.handlePipelineFailure() (download/unzip phases) or GtfsParseService.handlePipelineFailure() (parse phase) when an exception is caught during the pipeline. An
errorMessage is saved. Can be set from any of the three phases.

ERROR_IN_PARSE — set by GtfsDownloadService.recoverIfNeeded() after a JVM crash. It fires at startup when the status is stuck at PARSE_START (the parse started but no exception was ever caught — the
process was killed). No errorMessage is available because nothing caught the crash.

The most significant behavioral difference is in GtfsAccessService.rebuildDataset():

private static boolean isErrorState(GtfsDownloadStatus status) {
return status == GtfsDownloadStatus.ERROR_IN_PARSE;
}

FAILED is not in isErrorState(). So:
- ERROR_IN_PARSE → forces an empty dataset, live traffic unavailable
- FAILED → rebuildDataset() proceeds normally and loads yesterday's data from the DB tables

That's intentional: a caught exception (FAILED) means the DB tables are definitely from yesterday's intact parse (the transaction rolled back cleanly). A crash (ERROR_IN_PARSE) means the DB state was
uncertain, hence the forced empty dataset for safety.

One thing worth noting: since OOM is a java.lang.Error and @Transactional does roll back on Error, the DB tables are actually safe after a crash too. The forced-empty-dataset for ERROR_IN_PARSE is
therefore a conservative safety measure rather than a strictly necessary one.
--
Review how this works and maybe better handle the last part.

I1 - BE - Render.com OOM kills — investigation and resolution (April 2026)
--
**Root cause:** JVM non-heap (Metaspace + JIT code cache, ~170MB) was invisible to the old heap-only monitor.
With heap max at 371MB (`-XX:MaxRAMPercentage=75.0` of ~495MB container RAM) + non-heap ~170MB, total RSS
exceeded Render's 512MB limit, causing silent process kills (logged as "exceeded memory allocation" in Render).

**Fix applied:**
- `Dockerfile` `-XX:MaxRAMPercentage` reduced from `75.0` → `50.0` (heap max ~247MB, freeing ~120MB for non-heap)
- `JvmMemoryMonitorJob` extended to log non-heap alongside heap:
  `JVM memory — heap: NNNmb / NNNmb (NN%) | non-heap: NNNmb / NNNmb committed | old-gen: NNNmb / NNNmb`

**Parse-time spike (ongoing concern as of this writing):** The nightly 05:00 GTFS pipeline runs on a JVM that
already holds the full in-memory dataset. A second crash occurred during the trip batch-save phase. After the
successful re-parse, old-gen settled at ~129MB (up from ~61MB before that run). Root cause not confirmed —
candidates: Hibernate session cache growth during the ~47-minute parse; increased `GtfsTripInfo` object graph
from the new `stopTimes` list. The next nightly parse may still spike if old-gen stays elevated.

**Parse memory logging added:** `GtfsParseService.logMemory(label)` emits `MEM [label]` lines at:
`parse-start`, `post-trips`, `stop_times-N` (every 10k rows), `post-stop_times`, `post-calendar_dates`.
Use these to pinpoint where the spike occurs, then target reductions (e.g. more aggressive `entityManager.clear()`
calls, triggering a GC before the pipeline runs, or reducing the in-memory model size).

**Related:** G1 (double `rebuildDataset()` on startup) — fixing it would eliminate one redundant dataset load
and slightly reduce peak startup memory. Consider fixing before the next parse if old-gen remains high.
--

I2 - BE - Vehicle position as trip percentage — shapeDistTraveled + VehicleLocation.t
--
`GtfsGeometryUtil.locateOnRoute()` returns `VehicleLocation(int segIdx, double t)`:
- `segIdx` — zero-based index of the first stop in the closest segment (vehicle is between `stops[segIdx]` and
  `stops[segIdx+1]`)
- `t` — fraction [0,1] along the **straight line** between those two stops (dot-product projection + cosLat
  correction), NOT a route-distance fraction

`GtfsStopTimeInfo.shapeDistTraveled` is cumulative metres along the route shape polyline from trip start.
Combined with `t`, vehicle position as a percentage of total trip distance:

```java
double dStart = stopTimes.get(segIdx).getShapeDistTraveled();
double dEnd   = stopTimes.get(segIdx + 1).getShapeDistTraveled();
double dTotal = stopTimes.get(stopTimes.size() - 1).getShapeDistTraveled();
double pct    = (dStart + t * (dEnd - dStart)) / dTotal * 100.0;
```

Note: `t` is a straight-line fraction. For short inter-stop segments the difference from true route-distance
fraction is negligible. For longer segments with significant bends the approximation drifts, but is good enough
for the schematic view.
--

I3 - BE - The live route model (`model/gtfs/livetraffic/`) — C-block context
--
The live traffic data model has moved out of `GtfsDataset` into its own package and is now implemented
(the "commented-out `organizeRoutes()`" state described here previously is gone). Nothing consumes it yet —
see C3 for what remains.

**The core problem it solves:** a route group contains hundreds of trips per day that differ in stop count
(short turns, forks, depot runs). The schematic needs *one* canonical stop chain per group, not hundreds.
The design picks a single **identity trip** — the one trip that traverses the whole line — and treats every
other trip as a variation on it.

**`GtfsDataset.organizeRoutes()`** groups `tripInfoById.values()` by `GtfsTripInfo.getGroupKey()`, resolves a
selector per group, and stores the result in `Map<GroupKey, LiveTrip> liveTrips`. Built in the constructor;
a `GtfsLiveException` is caught and logged as a warning so a bad group cannot prevent the dataset from
loading at all. `hasLiveSupport()` reports whether any group produced a `LiveTrip`.
The checked-exception-in-lambda problem noted earlier was solved by using a plain `for` loop over the
grouped entries — `GtfsLiveException` stayed checked.

**`GroupKey`** — `record (TransportMode, int routeGroup)`, promoted to its own top-level type in
`livetraffic/`. The same pair the frontend sends to `/route-data`. Note that `GtfsAccessService` still
declares two *local* `GroupKey` records of its own (in `getMonitoredRouteGroups()` and
`validateRouteGroupConsistency()`) — candidates for consolidation onto this type.

**`GtfsTripInfoSelector`** (abstract) — per-line strategy holding an expected `stationCount` and a start
terminus (`ParentStopIdentifier`). `findIdTrip()` scans the group for the trip matching both. Subclasses:
`Train43`, `Bus112`, `Bus117`, `MetroGreen`, registered in a static map in `GtfsTripInfoSelectorFactory`
keyed by each class's `getGroupKey()`. An unregistered group throws
`GtfsNoRegisteredSelectorForGroupKeyException`.

*Why hardcoded station counts and termini:* the GTFS feed has no field that says "this is the full line".
Trip length plus start station is the only reliable discriminator, and both are stable per line. The cost is
that a permanent line extension means editing the selector — deliberate, since such a change needs a look
at the schematic anyway.

**`LiveTrip`** — the canonical chain for one group: `direction`, `stopHeading`, `List<LiveStop>`, plus
`Map<Integer, RouteVariant> edgeVariants` (terminus per direction) and `List<RouteVariant> routeVariants`.
`reverseTrip()` flips the chain in place, recomputing `shapeDistTraveled` from the total so distances still
run from zero at the new start.

**`LiveStop`** — fully implemented (`stopId`, `stopName`, `shapeDistTraveled`, `shapeDistTraveledSinceLast`,
lat/lon; implements `GeoPosition` so it feeds straight into `GtfsGeometryUtil.locateOnRoute()`). It always
resolves the **parent station**, never the platform — the schematic is direction-neutral. Missing parent or
stop info throws (`GtfsNoParentForStopException` / `GtfsNoStopInfoException`) rather than silently placing a
stop at the wrong coordinates.

**`variations/`** — `RouteVariant` (abstract) with three kinds: `EndStopRouteVariant` (expected terminus per
direction), `RouteForkVariant` (a branch as a `List<LiveForkStop>`), `AtypicalRouteVariant` (a stop plus an
info message). `MetroGreen` declares its forks as `ForkPart(start, end, length)` records — Skärmarbrink →
Farsta strand (9) and Skärmarbrink → Skarpnäck (6) — resolved by `getRouteForkVariant()` scanning trips for
a matching sub-sequence. The variant classes currently only hold data; no behaviour yet.

**`GtfsUtil`** (`livetraffic/util/`) — `getParent()` / `getSafeParent()` / `getParentId()` /
`getReverseDirection()`. Distinct from `service/util/GtfsNameUtil` — that one does line-name matching.
--

I4 - BE - Render health check timeout (April 2026) — "en gång ingen gång"
--
**Symptom:** Render sent a "HTTP health check failed (timed out after 5 seconds)" alert, triggering an
automatic restart. This is distinct from the OOM kills in I1 — Render's message for OOM is "exceeded memory
allocation"; a health check timeout means the JVM was alive but unresponsive to HTTP requests.

**Likely cause:** A stop-the-world GC pause longer than 5 seconds. On Render's 0.1 CPU allocation, GC work
that takes ~1 second on a full machine can take 10× longer. A non-heap spike of +14MB in the interval before
the crash (170 → 184MB, likely JIT compilation from a new endpoint being hit) may have triggered a more
aggressive GC cycle shortly after. The `/ping` health check could not get a response while all threads were
frozen for GC.

**Decision:** Treat as a one-off ("en gång ingen gång") — memory metrics were healthy, Render flagged it as
transient, and the restart was automatic. No action taken.

**If it recurs:** Add a G1GC pause target to `Dockerfile`:
```
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=50.0", "-XX:+UseG1GC", "-XX:MaxGCPauseMillis=500", "-jar", "app.jar"]
```
`-XX:MaxGCPauseMillis=500` tells G1 to prefer more frequent short collections over infrequent long ones —
reduces the risk of a pause long enough to fail the 5-second health check.
--

I5 - BE - **The in-memory GTFS dataset is currently disabled outside the `local` profile**
--
`GtfsAccessService.rebuildDataset()` returns immediately unless the `local` profile is active:

```java
if (!environment.acceptsProfiles(Profiles.of("local"))) {
  log.info("GTFS in-memory dataset disabled in non-local profile — skipping load");
  return;
}
```

**Consequence:** on Render the dataset stays empty. `/route-groups` returns an empty list,
`/status` reports `staticDataAvailable: false`, and live traffic does not work in production. The nightly
pipeline still runs and still fills the DB tables — only the in-memory load is skipped.

**Why:** a temporary mitigation for the I1 OOM kills (commit "Temporary removal of static dataset"). The
dataset is the largest single allocation in the JVM and holding it left too little headroom under Render's
512MB cap during the nightly parse.

**Before lifting it:** the dataset has to fit alongside the parse-time peak, so this depends on the I1
parse-memory work (and possibly G1). Development of the C-block continues locally in the meantime.
--

## Planned Improvements

Prioritized improvement work, in order. Unlike the "Future Enhancements" ideas below, these are committed
follow-ups — do them in sequence.

1. **Add frontend tests.** The frontend has no tests today, which makes refactoring the effect-heavy panes
   risky — there is nothing to catch a silent regression. Add a test setup (Vitest + React Testing Library is
   the natural fit for Vite) and cover the panes and views that own non-trivial effect/fetch logic. This is
   step 1 specifically so that step 2 can be done safely.

2. **Learn, then fix `react-hooks/set-state-in-effect`.** The `eslint-plugin-react-hooks` 7.1 bump added this
   rule; it is currently downgraded to `warn` in `eslint.config.js`. Four sites trigger it: `views/shared-route.tsx`,
   `pane/departures`, `common/deviation-modal`, `admin/gtfs-status`. First understand *why* synchronous setState
   in an effect causes cascading renders, and which of the four are true positives versus conservative warnings
   (several set state after an `await`, which React considers acceptable). Then fix them deliberately, one at a
   time — ideally after (1) so the changes are covered by tests. Restore the rule to `error` once the sites are
   clean.

### Frontend cache for deviation interpretations
Cache backend interpretation results in a `Map<string, BackendInterpretationResult>` keyed by deviation text for the lifetime of the page session. On each SL refresh cycle, check the cache before sending texts to the backend — only send uncached texts, then merge cached and fresh results before enrichment.

Deferred because the backend already caches by SHA-256 hash, so repeated calls skip the Claude API and are just a fast DB lookup. Add only if round-trip latency to the backend becomes noticeable.

### Show more routes
The SL Journey Planner API caps `calc_number_of_trips` at 3 — passing a higher value is silently ignored. A "Visa fler" button
cannot simply request more results in one call.

Proposed workaround: when the user clicks "Visa fler", take the departure time of the last shown journey, add one minute, and
issue a second request using that time as the `itd_time` departure anchor. Merge the new results with the existing list,
deduplicating by journey ID. This would fetch trips starting just after the last known departure, effectively extending the list.

Not implemented because the user experience would be imperfect (slight overlap risk, no guarantee of continuity) and the gain
over the 3-trip default is modest for the typical use case.

### Deviation context in AI prompt
Short departure-level deviation texts (e.g. "Inställd", "Försenad") are handled by the hardcoded map in the backend.
For other ambiguous short texts where the hardcoded map has no entry, the AI still receives the text with no context
about whether it is departure-specific or line-wide. Adding a context preamble to the Claude prompt — e.g.
"Denna avvikelse gäller specifikt avgång 14:32 med linje 43" vs "Denna avvikelse gäller linje 43 generellt" —
would help the AI give a more accurate interpretation.

Key constraint: the context must NOT be part of the SHA-256 hash key used for DB caching. The hash must remain
based on the deviation text alone, so that "Inställd" on train 43 and "Inställd" on bus 117 hit the same cache
entry. The context is extra prompt enrichment only, not a cache discriminator.

Implementation sketch: pass a nullable context string alongside each deviation text to the backend; the service
appends it to the Claude prompt but excludes it from sha256(). The FE would derive context from the source
(departure line/stop info for the departures pane, journey leg info for the routes pane).

### Add line variants (e.g. 43X) to the deviation pane
The deviation pane URLs in `constant.ts` are hardcoded to the base line numbers (43, 44, 117, 17/18/19). Line
43X is not included. Once the monitored-lines config table exists (A5), the deviation pane URLs could be driven
by that table — or at minimum 43X should be added to the train deviation URL.

### Improve how deviations are handled
Currently trains use a specific list of focus stops, buses use no stop
filtering, and metro uses a specific list. Evaluate whether this is correct and improve the approach.
Should we have a line selection in the settings dialog which are used when fetching info for the deviations pane?

### Minor improvments
- Max walk time - Add a "max walk time" setting in the settings dialog.
- Bulltin board - With news?
- Should we preload deviations and pre parse them with AI. If this is done every 60 min most of the deviations will be cached?
  But if the APIs are quick enough, its proably not worth it.

## Issues

No current issues.
