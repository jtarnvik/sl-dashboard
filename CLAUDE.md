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

A1 - BE, Set up download of static GTFS data. Scheduled at 05:00 daily so the file is ready before the family
starts using the app. The Samtrafiken feed is published daily between 03:00–07:00, so 05:00 is within that window.
Downloads are strictly limited (50/month on Bronze), so the tracking table is the primary guard against wasted calls.

**Database tracking table** (`gtfs_download_log`), one row per calendar date (upserted, not appended):
- `date` — the calendar date this row covers (primary key / unique)
- `status` — enum: `DOWNLOAD_START`, `DOWNLOAD_DONE`, `UNZIP_START`, `UNZIP_DONE`, `PARSE_START`, `PARSE_DONE`,
  `FAILED` — tracks the last reached phase; useful for diagnosing where a failure occurred
- `error_message` — populated on `FAILED`, null otherwise
- `download_start_time`, `unzip_start_time`, `parse_start_time` — one timestamp per phase start, to measure
  how long each phase takes (important for evaluating whether the Render free tier can handle the workload)
- `end_time` — single timestamp written when the full pipeline completes successfully

The table retains the last 30 days. A nightly cleanup job (separate `@Scheduled` bean) deletes rows older than 30 days.

**Working directory:** `/tmp/sl-gtfs-cache`. Deleted and recreated at the start of each download to ensure a clean state.

**Download guard logic** (checked on both startup and scheduled trigger):
1. If a row exists for today in `gtfs_download_log` (any status, including `FAILED`), skip — one download attempt
   per day maximum. Later-phase errors (unzip, parse) are retryable via manual initiation (a future step), but
   the download itself is not retried automatically.
2. If running in the `local` profile and the count of rows in the last 30 days exceeds 15, skip — protects the
   monthly quota during local development.
3. Otherwise, proceed with download.

**Scope of this step:** implement the download only (status transitions: `DOWNLOAD_START` → `DOWNLOAD_DONE` or
`FAILED`). Unzip and parse phases are added in later steps — the status enum and timestamp columns are created now
so the schema does not need to change.

Mark the scheduled download bean with `@Profile("!test")` so it does not run during integration tests.
  
A2 - BE send pushover notificaton on error

A3 - FE/BE - Create front end view for downaload state.

A4 - FE/BE - In the local profile, at least during development, we need to be able to some kind of retry,
of parsing the GTFS data, I assume it will be a few attempts before we get it right to 100%. How to handle.

A10 - BE, Parse and cache static GTFS data on startup. Download `sl.zip` from Samtrafiken and parse it using
`ZipInputStream` to avoid holding the full file in memory — stream CSV rows one at a time, keep only what
matches the monitored lines, discard the rest.

The zip entry order (verified) is: `trips.txt`, `calendar_dates.txt`, `stop_times.txt`, `calendar.txt`,
`attributions.txt`, `transfers.txt`, `routes.txt`, `stops.txt`, `feed_info.txt`, `agency.txt`, `shapes.txt`.
`trips.txt` comes before `routes.txt`, so a single forward pass cannot filter trips by route — the route ID
set isn't known yet when trips.txt is encountered.

**Download and parse strategy**
When a fresh download is needed, download `sl.zip` to `/tmp` and unzip it there. Reading individual unzipped
files means they can be opened in any order — the two-pass ZipInputStream problem disappears entirely. Parse
order: `routes.txt` first to build the `route_id` set, then `trips.txt`, `stops.txt`, `shapes.txt`. Once
parsed, serialize the filtered in-memory maps to JSON and store in the DB. The `/tmp` files are then
disposable — they are just a working area for the one-time parse, not a durable cache.

**Caching strategy — DB is the durable cache, /tmp is the working area**
Do NOT store the raw zip in the database — at 51 MB it would consume 10% of Supabase's free 500 MB quota
and risk hitting Supavisor transaction size limits. Store only the parsed/filtered JSON (a few MB for 6 lines).

Samtrafiken publishes a new static zip **daily**, typically between 03:00–07:00 (confirmed from API docs).
The Bronze API key (50 calls/month) allows barely 1.6 downloads/day with no margin for restarts — the DB
cache is therefore essential, not optional. A Silver/Gold key upgrade could be requested, but it looks like it wont  be needed

Store `feed_version` (the publish date from `feed_info.txt`) in the DB row for observability.

Startup sequence:
1. Check the DB for a cached GTFS payload for today's date. If present, deserialize directly into the in-memory
   maps — no download needed. Log the loaded `feed_version`. Restarts and redeploys are free.
2. If missing, download `sl.zip` to `/tmp`, unzip, parse the relevant files, build the in-memory
   maps, serialize to JSON, upsert the DB row (including `feed_version` and `downloaded_at`), then serve
   from memory. The `/tmp` files can be left for the OS to clean up.

The same sequence works identically in local development — the local MySQL DB acts as the cache, so quota
is only consumed once per day locally as well.

Additional notes from API documentation:
- `calendar.txt` defines validity periods only — actual service dates are exclusively in `calendar_dates.txt`.
- When both `route_long_name` and `route_short_name` are present, `route_long_name` is the correct display name.
- `route_type` uses extended GTFS types (confirmed: `100` = Railway, `700` = Bus, `900` = Tram). Metro type code
  has not been verified — do not assume `401`. Verify against `routes.txt` before filtering. Also filter by
  `agency_id` to avoid collisions with other operators using the same `route_short_name` (e.g. Waxholmsbolaget
  also has a line "17").

Expose a simple internal service that resolves `trip_id` → route short name and `stop_id` → stop name.

A11 - BE, Vehicle position endpoint. Fetch `VehiclePositions.pb` from Samtrafiken, parse the GTFS-RT feed,
filter to vehicles on the monitored routes, and return a JSON list of vehicle positions (lat, lon, bearing,
speed, route short name, current status). Cache the result for ~15 seconds so concurrent client requests
don't each trigger a new upstream fetch.

A12 - FE, Map view. Add a new pane or route that renders vehicle positions on a map (library TBD — Leaflet or
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