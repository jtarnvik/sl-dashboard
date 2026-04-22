# CLAUDE.md

@../publicbackend/CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
  trips, stops, shapes. Bronze: 50 calls/month — DB cache is essential. Silver upgrade requested.
- Realtime GTFS-RT: `https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb` — live vehicle positions.
  Bronze: 50 calls/minute, 30,000 calls/month. Requires `Accept-Encoding: gzip` header or the API returns 406.

**Realtime rate limit analysis (Bronze: 50/min, 30,000/month)**
30,000/month ≈ 1,000/day ≈ one upstream call every 86 seconds if spread evenly around the clock. This is enough
for normal use but not for aggressive continuous polling by multiple clients.

The backend caches the vehicle position response for ~15 seconds. With this cache, 10 simultaneous clients all
polling every 15 seconds generate only 4 upstream calls/minute — well within the 50/minute rate limit and
conservative on monthly budget.

Main risk: a client leaving the map view open overnight. Mitigation: pause polling when the browser tab is
hidden. The `useVisibility` hook already exists in the codebase (`src/hook/use-visibility.ts`) and is used by
the departures pane for exactly this purpose — reuse it in the map view.

**Static GTFS loading strategy**
- DB is the durable cache; `/tmp` is the working area for parsing. See A1 for full detail.
- Relevant files: `routes.txt` (line names/types), `trips.txt` (trip→route join), `stops.txt` (stop names/coords),
  `shapes.txt` (route polylines for map), `stop_times.txt` (stop sequences per trip — needed for geometric vehicle placement
  since `current_stop_sequence` is never populated in the RT feed).
- Key lookup chain from realtime feed: `trip_id` → `trips.txt` → `route_id` → `routes.txt` → `route_long_name`.
- What varies daily is which trips are active, controlled by `calendar_dates.txt` (actual service dates — `calendar.txt`
  is validity periods only).

**Vehicle position polling strategy**
- Backend does NOT poll continuously. Instead, it fetches and caches positions with a short TTL (~15 seconds)
  and only on client request. If no clients are active, nothing polls. This avoids burning API quota overnight
  and fits within the Render free tier's 0.1 CPU allocation.
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

A1 - DONE - BE, Daily GTFS zip download. Scheduled at 05:00 via `GtfsDownloadJob`. One download attempt per day
maximum, guarded by `gtfs_download_log` (one row per date). Local profile is additionally capped at 15 downloads
per 30 days to protect the Bronze quota. Working directory `/tmp/sl-gtfs-cache` is wiped and recreated on each run.
Job fires on `ApplicationReadyEvent` at startup and on the 05:00 cron. `@Profile("!test")` prevents it running
in integration tests.

A2 - DONE - BE, Unzip pipeline. Extracts `sl.zip` to `/tmp/sl-gtfs-cache/unzipped/` (subdirectory wiped before each
run to avoid stale files). Introduced `runPipeline()` as the happy-flow orchestrator and `GtfsDownloadException`
as the unchecked error type that stops the pipeline and is caught at the job level. `RestExceptionHandler`
(`@RestControllerAdvice`) returns HTTP 500 `{ "message": "..." }` for any `GtfsDownloadException` reaching a
controller. Each phase writes explicit start and end timestamps (`download_start_time` / `download_end_time`,
`unzip_start_time` / `unzip_end_time`); `parse_end_time` is reserved for B.

A4 - DONE - FE/BE, GTFS Status admin view at `/admin/gtfs-status`. Shows the most recent `gtfs_download_log` row:
date, status, per-phase durations derived from start/end timestamps, and error message on failure. "Reset to
DOWNLOAD_DONE" button calls `POST /api/admin/gtfs/reset` (guarded 409 if status ≤ `DOWNLOAD_DONE`; also deletes
the unzipped directory). When parse tables exist (B), the reset endpoint must also clear them.

A5 - DONE - BE, Monitored-lines config table `gtfs_monitored_line` (`route_short_name`, `transport_mode`).
Source of truth for B filtering. Seeded via Liquibase with 43/44 (TRAIN), 117/112 (BUS), 17/18/19 (METRO).
No `match_variants` flag — variant matching (e.g. 43X) is a uniform rule in B, not a per-row concern.
112 is not added to the deviation pane; it exists to exercise the route presentation logic.

A6 - DONE - BE, Pushover notification on GTFS pipeline failure. Sent from `GtfsDownloadService` at each
`updateFailed()` site (download and unzip phases). `parseIfReady()` (B) should follow the same pattern.
`sendGtfsPipelineErrorNotification(phase, message)` added to `PushoverProvider`.

B - BE, Parse unzipped GTFS files into the database and serve from an in-memory cache. `GtfsParseService`
owns all parse logic and runs as a single `@Transactional` boundary; `GtfsPipelineService` orchestrates;
`GtfsAccessService` holds the `AtomicReference<GtfsDataset>`. Five DB tables store the filtered subset of the
regional feed: `gtfs_route`, `gtfs_trip`, `gtfs_stop_time`, `gtfs_stop`, `gtfs_calendar_date`. All use natural
GTFS keys (`@Id` / `@EmbeddedId`) — no synthetic IDs, no timestamp columns. Parse order is dependency-driven:
agency → routes → trips → stop_times → stops → calendar_dates. Status updates use `REQUIRES_NEW`; the DB is
the durable store and the `AtomicReference` is swapped only after each full parse commit. Full architecture,
transaction design, and the critical `detach(entry)` lock-avoidance pattern are documented in the
`GtfsParseService` class-level Javadoc.

**Pending:** `feed_version` column on `gtfs_download_log` (populate from `feed_info.txt` during parse, show
in the GTFS status view) — not yet implemented.

B1 - DONE - BE - Set up code flow for parse logic. `GtfsDataset` plain data holder in `model/gtfs`;
`GtfsAccessService` with `AtomicReference<GtfsDataset>`, `getDataset()` / `rebuildDataset()`. Loads from DB
on `ApplicationReadyEvent` so data survives restarts without a re-parse.

B2 - DONE - BE - Create `GtfsParseService`, parse `agency.txt` + `routes.txt`. SL `agency_id` resolved by
name ("AB Storstockholms Lokaltrafik") — not hardcoded, it may change. Three-condition filter: agency + route
type (TRAIN=100, BUS=700, METRO=401) + name regex `^{base}[A-Za-z]?$` (captures 43X variants).

B3 - DONE - BE - Parse `trips.txt`, persist `gtfs_trip`. `TripParseResult` record carries both `tripIds` and
`serviceIds` for downstream steps. `entityManager.detach(entry)` immediately after `markParseStart()` is
critical — without it, subsequent `flush()` calls lock the `gtfs_download_log` row and block the
`REQUIRES_NEW` `markParseDone()` after ~50 s (MySQL lock timeout).

B4 - DONE - BE - Parse `stop_times.txt` (~140 MB, 90,720 filtered rows), persist `gtfs_stop_time`. Times
stored as String — GTFS allows values > 24:00:00 for overnight trips. `shapeDistTraveled` (meters along
route) enables proportional vehicle placement since `current_stop_sequence` is never set in the RT feed.
Batch insert: 500 rows, `flush()` + `clear()` per batch; `rewriteBatchedStatements=true` needed in MySQL
JDBC URL for true multi-row inserts.

B5 - DONE - BE - Parse `stops.txt`, persist `gtfs_stop`. ~250 platform-level stops (`9022001xxxxxxxxx`).
Parent stations (`9021001xxxxxxxxx`) are excluded — they are not in the `stopIds` set from B4. Two stops with
the same name and parent but different platform IDs are the two road-sides of a bidirectional bus stop.

B6 - DONE - BE - Parse `calendar_dates.txt`, persist `gtfs_calendar_date`. Sole scheduling source —
`calendar.txt` is all-zeros in the Samtrafiken feed. Only `exception_type=1` rows stored (service runs that
day); type-2 cancellations are irrelevant with no base schedule. Dates parsed from `YYYYMMDD` to `LocalDate`
via `DateTimeFormatter.BASIC_ISO_DATE`; column named `service_date` (not `date` — SQL reserved word).

B7 - DONE - BE - Integration test for `GtfsParseService` using synthetic GTFS files. The real feed files are too
large (~140 MB for `stop_times.txt`) to ship as test resources. Instead, hand-crafted minimal CSV files in
`src/test/resources/gtfs/` cover the same filtering logic at negligible size.

**Making `UNZIP_DIR` configurable:**
Change the hardcoded `private static final Path UNZIP_DIR` constant in `GtfsParseService` to an injected
`@Value("${gtfs.unzip-dir:/tmp/sl-gtfs-cache/unzipped}") private Path unzipDir` (non-final, so
`@RequiredArgsConstructor` skips it and Spring injects it via field injection). The default preserves
production behaviour. The test overrides it via `@DynamicPropertySource`.

**Synthetic test files (`src/test/resources/gtfs/`):**
Six CSV files, a few KB total, designed to exercise every filter condition:

| File | Retained | Excluded |
|---|---|---|
| `agency.txt` | SL agency | one foreign agency |
| `routes.txt` | train 43, 43X (variant), bus 117 | non-monitored bus 999, foreign-agency train |
| `trips.txt` | 4 trips across retained routes (service IDs svc-A/B/C) | trips for excluded routes |
| `stop_times.txt` | 9 rows; one with `25:30:00` (>24h, must survive as String) | rows for excluded trips |
| `stops.txt` | 5 platform stops; one with blank `shape_dist_traveled` | excluded bus stop; a parent station (not referenced by stop_times) |
| `calendar_dates.txt` | 4 rows (svc-A/B/C, exception_type=1) | exception_type=2 row; rows for non-monitored service IDs |

**Test class (`GtfsParseServiceTest`):**
- `@SpringBootTest @ActiveProfiles("test")`; `@MockitoBean PushoverProvider` to suppress notifications
- `@DynamicPropertySource` resolves `gtfs/` from classpath and sets `gtfs.unzip-dir`
- `@BeforeEach` inserts a `GtfsDownloadLog` row with status `UNZIP_DONE` for today
- `@AfterEach` deletes all GTFS table rows and the log row (do NOT touch `gtfs_monitored_line` — seeded by Liquibase)
- One `@Test` calls `gtfsParseService.parseIfReady()` and asserts:
  - `gtfsRouteRepository.count()` = 3; short names are {43, 43X, 117}; route-999 absent
  - `gtfsTripRepository.count()` = 4; trip-43x-1 present; trip-999-1 absent
  - `gtfsStopTimeRepository.count()` = 9; the `25:30:00` arrival time stored intact as String
  - `gtfsStopRepository.count()` = 5; excluded stop and parent station absent
  - `gtfsCalendarDateRepository.count()` = 4; exception_type=2 row absent; non-monitored service ID absent
  - Log status for today = `PARSE_DONE`

B8 - DONE - BE - Comprehensive class-level Javadoc written for `GtfsParseService` covering parse order,
transaction architecture, delete strategy, batch insert design, and the `detach(entry)` lock-avoidance
pattern.

B9 - DONE - BE - Populate `GtfsDataset` and wire `GtfsAccessService.rebuildDataset()`. `GtfsDataset` is
immutable — all-args constructor, no setters, maps and lists wrapped in `Collections.unmodifiableMap/List`.
Holds `List<GtfsMonitoredLine>` + five maps: `routesById`, `tripsById`, `stopsById`, `stopTimesByTripId`
(sorted by `stopSequence`), `activeServiceIdsByDate`. Exposes only `isEmpty()` — public query API deferred
to C1. `rebuildDataset()` loads all six repositories, assembles the maps, and atomically swaps the
`AtomicReference`. Empty repositories yield an empty dataset; callers guard with `isEmpty()`.

B10 - DONE - BE - Realtime GTFS-RT provider. Create `SamtrafikenProvider` in
`port.outgoing.rest.samtrafiken` (provider convention: hides implementation, exposes logical API only).
Single public method: `List<GtfsVehiclePosition> fetchVehiclePositions()`. Streams the protobuf feed
in-memory — no temp file. Pass the API key as a query parameter `?key=...` the same way as static
download. Return only entities that have a `VehiclePosition` (`entity.hasVehicle()`). No caching or
TTL in the provider — that is the service layer's responsibility (C1).

**`GtfsVehiclePosition` class** (in `model/gtfs` package — a plain data holder, not a JPA entity).
Use `@Data @Builder` from Lombok. Fields:

```java
// Always present — primary join key to static data
private String tripId;

// Always present
private float latitude;
private float longitude;

// Always present — IN_TRANSIT_TO, STOPPED_AT, INCOMING_AT
private VehicleStopStatus currentStatus;

// Always present — Unix timestamp of the position report
private long timestamp;

// Sometimes present — 0.0f means absent
private float bearing;

// Sometimes present — 0.0f means absent
private float speed;

// Not reliably present in RT feed — derive direction from static data instead
private int directionId;

// Never populated by Samtrafiken — always 0, do not use
private int currentStopSequence;

// Never populated by Samtrafiken — always empty, do not use
private String stopId;

// Never populated by Samtrafiken — route_id is always empty in the RT feed
private String routeId;

// Reliability unknown — included for completeness, may be cleaned up later
private String vehicleId;    // vehicle.id
private String vehicleLabel; // vehicle.label
```

`VehicleStopStatus` is the enum from `com.google.transit.realtime.GtfsRealtime.VehiclePosition` — import
it directly or define a local mirror. Use the protobuf enum value directly.

**Implementation notes:**
- Open an `HttpURLConnection` to `${samtrafiken.gtfs-realtime-url}?key=${samtrafiken.gtfs-realtime-api-key}`
- Set `Accept-Encoding: gzip` header; wrap the response stream in `GZIPInputStream` if the response is gzip-encoded
- Parse with `FeedMessage.parseFrom(inputStream)` directly from the (possibly decompressed) stream
- Inject the URL and key via `@Value` constructor parameters (same pattern as `GtfsDownloadService`)
- Log the entity count and how many had vehicle positions at INFO level

B11 - BE - Move static GTFS download to SamtrafikenProvider. Currently `GtfsDownloadService` opens
`HttpURLConnection` directly. This should move into `SamtrafikenProvider` in
`port.outgoing.rest.samtrafiken` alongside the realtime method. Discuss the method signature before
implementing.


C1 - BE, Vehicle position endpoint. Fetch `VehiclePositions.pb` from Samtrafiken, parse the GTFS-RT feed,
filter to vehicles on the monitored routes, and return a JSON list of vehicle positions (lat, lon, bearing,
speed, route short name, current status). Cache the result for ~15 seconds so concurrent client requests
don't each trigger a new upstream fetch.

D1 - FE, Map view. Add a new pane or route that renders vehicle positions on a map (library TBD — Leaflet or
MapLibre are candidates). Poll the backend vehicle position endpoint while the view is active. Display vehicle
icons colour-coded by transport mode, oriented by bearing. Show route line shapes from static GTFS data.
            
AH is used for A (block) H (Hypothesis) verification
AH1 - FE/BE - POC: prove that the backend can download `sl.zip`, unzip it to `/tmp`, and read the results.
Most of this code will be discarded afterwards, though the download logic may survive into A1. Keep all new
code isolated: a dedicated BE controller and a dedicated FE view/route.

**Backend**
- Add `samtrafiken.api-key` and `samtrafiken.gtfs-url` to application properties, following the same pattern
  as `anthropic.api-key`. The actual key value goes in `application-local.properties` (never committed) and
  as a Render environment variable. Inject via constructor parameter in the new controller.
- Remove `ExperimentController` — it has served its purpose and the API key is now in properties.
- New controller `GtfsPocController` at `/api/admin/gtfs-poc` (admin-only, `@PreAuthorize("hasRole('ADMIN')")`).
  Three endpoints:
  - `POST /download` — check if `/tmp/sl.zip` already exists; if so return immediately with file size and
    a note that it was skipped. If not, download from Samtrafiken, save to `/tmp/sl.zip`, return file size
    and download duration in milliseconds.
  - `POST /unzip` — unzip `/tmp/sl.zip` to `/tmp/sl/`. Return a list of all extracted files with their sizes
    and total unzip duration in milliseconds.
  - `GET /files` — list files in `/tmp/sl/` (GTFS files only, not all of `/tmp`). Return file names and sizes.

**Frontend**
- New admin-only view at `/gtfs-poc` (`GtfsPoc` component in `src/components/admin/gtfs-poc/`).
- Add an admin-only menu item "GTFS POC" to `NavMenu` alongside the existing admin items.
- The view shows three buttons: "Ladda ner", "Packa upp", "Lista filer". Each button calls its respective
  backend endpoint and displays the returned status info below it. Buttons are independent — no forced
  sequencing in the UI, but the backend will naturally fail gracefully if called out of order (e.g. unzip
  before download returns an appropriate error).
- Keep the component simple — no shared state management, just local `useState` per button result.

## Future Enhancements

Ideas that are not currently needed but should be remembered if the need arises.

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