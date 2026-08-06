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
| `LiveTrafficView` | `/live-traffic` | Logged in | Aktuell trafik — route group selector and focus toggle; schematic vehicle view (`live-traffic-graph`), polled every 8s |
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

Work is organised as a short ordered list of goals. A goal is broken into steps only when it is started; steps
are intentionally small to aid understanding and AI collaboration.

When discussing or designing a goal or step, read the relevant source files first before asking clarifying
questions or proposing steps. Design suggestions based on assumptions about the code rather than the actual code
produce steps that may be subtly wrong. If it is unclear which files are relevant, identify and read them before
starting the discussion.

When rewriting a goal, a step or a completed entry, preserve the motivating context — the "why" behind design
choices that are not obvious from the code — as inline notes where a non-obvious constraint or decision was
made. Do not remove existing "why" notes when rewriting. Conversely, remove planning text once it has been
carried out: what is left should be what helps future work, not a record of how the work was scheduled.

## Goals, in order

These three are the current plan. Everything below them is either finished or deferred until they are done.

**1 - FE/BE, Arrival times on the schematic** *(was A-Goal-2)*.
The train map shows where each train is and which stations it is between, but not "its probable arrival time at
the next station", which the original goal asked for and which is what makes the view actionable.
- Worth knowing before starting: the scheduled times are not merely unsent, they are absent from the live model
  entirely. `LiveStop` carries no times, so the chain the frontend receives has no time information anywhere.
  `GtfsStopTimeInfo.arrivalTime` / `departureTime` are the source; plumbing them into `LiveStop` is step one.
- The alternative source is dead reckoning from `shapeDistTraveled` plus vehicle speed. Note that `speed` is
  populated for buses but is always 0.0 or noise for trains, so schedule-based is the only option that works
  for both.

**2 - FE/BE, Bus tracking with push notification** *(was A-Goal-3)*. The most personally useful of these.
A schematic of bus 117 — which now exists — where the user marks a specific bus as the one they intend to catch,
and the backend sends a push notification when it passes a designated trigger stop. The use case is knowing when
to leave for the stop, six minutes' walk away.
- Everything needed is already in place: `vehicleId` and `tripId` are in the response, stop sequences are in the
  dataset, and Pushover is integrated for error notifications. This is additive rather than blocked.
- The one design question: a tracked bus has to survive the backend forgetting it. The poll loop shuts down five
  minutes after the last request, so a "notify me" registration must outlive it and drive its own polling.

**3 - FE, Journey planner route map** *(was A-Goal-1 / D1)*.
Show the routes suggested by the route planner pane on a map — the whole journey and each individual leg. The
coordinates are already in the journey planner API response, so no GTFS realtime data is involved. Choosing and
integrating a map library (Leaflet or MapLibre) is part of this goal; the frontend has none today.
- Unlike the schematic, this one genuinely needs a map. It also touches no GTFS data at all, so it is the one
  goal here that is independent of everything in the E-block.

---

## Completed

**E - DONE - BE/infra, Backend moved from Render to the home Mac Mini (August 2026).**
`sl.tarnvik.com` now talks to `api2.tarnvik.com` on a Mac Mini instead of `api.tarnvik.com` on Render.
The application code is unchanged — only where it runs and what it talks to.

*Why it was worth doing.* Render's free tier forced most of the compromises in the reference notes below:
512 MB RAM, which is why the in-memory GTFS dataset was disabled outside `local` (I5), why the nightly parse
was OOM-killed (I1), and why a long GC pause could fail a 5-second health check (I4). All three are gone.
**Live traffic now works in production for the first time** — the C-block schematic was previously usable
only on `local`, which defeated the point of building it.

*What the first nightly parse on the Mini measured (2026-08-06).* The whole pipeline ran in **54 seconds**:
5.0s download (64.6 MB zip), 0.95s unzip, **47.1s parse**, 0.67s commit, 4ms dataset rebuild, 134ms realtime
verify. The same parse took roughly 47 *minutes* on Render — same number, different unit. Peak parse heap was
**293 MB against a 2048 MB max**, sawtoothing normally; on Render the heap ceiling was 371 MB with ~200 MB of
non-heap beside it, which is I1 in a single line. Idle old-gen sat flat at 147 MB for the five hours before
the parse, so there is no leak.
- **`stop_times` is 43.7s of the 47s, and the cost is MySQL, not file reading.** Every 10k-row block takes
  ~2.32s regardless of how much file it scanned; the last 68% of the 140 MB file — which matches no monitored
  trip — is scanned in 0.76s. So the parser reads at ~125 MB/s and writes at ~4,300 rows/s. Any future
  speedup has to come from JDBC batching, not from the CSV side. There is no early exit in `parseStopTimes`;
  the "% of file read" figure only looks like one because the retained rows sit in the first third of the file.
- **Old-gen reads 242 MB right after a parse, then creeps.** That is region *occupancy*, not live set: at 16%
  heap usage G1 never runs a mixed collection, so the discarded previous dataset is never swept. Do not read
  it as growth. `jcmd <pid> GC.run` before the next monitor line gives the real figure if it is ever wanted.

*What runs where.* Cloudflare (DNS + proxy) → Caddy on :443 with a Cloudflare origin certificate →
Spring Boot on :8081, profile `production`. GoDNS keeps the `api2` A record pointed at the home IP.
The database is **MySQL in Docker** (`mysql-mini`, schema `commuter_prod`) — the same engine as the `local`
profile, not the PostgreSQL that Supabase provided. Consequence: the `dbms="postgresql"` changesets (row
level security, 002's BYTEA fix) no longer apply in production, and MySQL takes the LONGBLOB path instead.

*The one thing that broke twice, both times silently.* `FRONTEND_URL` and `ALLOWED_ORIGINS` must **both**
name the deployed frontend origin, and they fail differently: a wrong `FRONTEND_URL` lands the user on the
wrong host after login, while a wrong `ALLOWED_ORIGINS` gives every API call a bare `403 Invalid CORS
request` from Spring's `CorsFilter` — which runs *before* the security chain, so nothing reaches a
controller and the backend reads as dead rather than misconfigured. It hides from local testing because
`localhost:5173` is on the allowlist, so a passing `npm run dev` proves nothing about the deployed origin.
The verification curl and the full explanation are in `publicbackend`'s `deployment/publicbackend.env.example`.

*Deliberate trade-offs, so they are not re-litigated:*
- **The backend runs in a foreground terminal via `just start`, with no launchd service.** Accepted: the
  Mini is stable, and a manual restart after a power cut is fine for a personal dashboard. The database
  is not left to the same treatment — Docker Desktop starts at login and `mysql-mini` is set to
  `--restart unless-stopped`, so MySQL is back before anyone touches the machine. After a power cut the
  backend is therefore the single manual step, not a two-part recovery.
- **Render and Supabase are gone (August 2026), and there is no rollback target.** `local_host` was held
  back from `main` while Render built `main` and would have reloaded the dataset it could not hold (I5);
  with Render switched off that gate lifted and the branch was merged. Two things are worth keeping from
  how the decommissioning was decided, because both are reusable: the insurance decayed on its own — once
  the `api.tarnvik.com` OAuth redirect URI was dropped and Supabase's data went a day stale, "roll back to
  Render" was no longer one commit and would have discarded everything since cutover. And the *cost* was
  not zero: Render kept downloading `sl.zip` daily into Supabase to the end, because the I5 gate sat inside
  `rebuildDataset()` and never stopped the download or the parse — two backends against a 50-calls-per-month
  Bronze quota is roughly 62. A parked deployment is not an idle one; check what it still does on a timer.
- **The infrastructure manual is local-only, not in git.** `publicbackend` is a *public* repo, and the
  manual records the home WAN IP, the UniFi port-forward rule and the Cloudflare account id. The WAN IP is
  the one that matters: the `api2` record is proxied precisely so the origin stays hidden. Gitignored there,
  with the reasoning in the `.gitignore` comment.

**A/B - DONE - BE, GTFS pipeline and in-memory dataset.**
`GtfsDownloadJob` fires at 05:00 and on `ApplicationReadyEvent`; `GtfsPipelineService.runPipeline()` orchestrates
download → unzip → parse → rebuild dataset → verify realtime feed. Five DB tables (`gtfs_route`, `gtfs_trip`,
`gtfs_stop_time`, `gtfs_stop`, `gtfs_calendar_date`) use natural GTFS keys — no synthetic IDs, no timestamp
columns. Full transaction design and the critical `entityManager.detach(entry)` lock-avoidance pattern are in the
`GtfsParseService` class Javadoc.

**Package layout:** JPA entities in `model/domain/entity/`; in-memory models (`GtfsDataset`, `GtfsRouteInfo`,
`GtfsTripInfo`, `GtfsStopInfo`, `GtfsStopTimeInfo`, `GtfsVehiclePosition`, `GeoPosition`, `ParentStopIdentifier`)
in `model/gtfs/`, checked exceptions in `model/gtfs/exception/`, and the live route model in
`model/gtfs/livetraffic/` (see I3). Name-variant matching (e.g. 43X) lives in `GtfsNameUtil`, shared by the parse
and access services.

**`gtfs_stop` includes parent stations** (`9021001…`, `location_type=1`) as well as platform stops (`9022001…`).
Two-pass parse: the first collects platform stops and their `parentStation` ids, the second retains those parent
rows. Parent stations are the direction-neutral reference points the schematic is drawn from.

**`gtfs_monitored_route` focus window columns:** `focus_start` / `focus_end` (nullable **parent station**
`stop_id`) bound the sub-corridor shown on the schematic; `only_focused` hides the full route for branching
lines. The ids must be parent stations because that is what `LiveStop` resolves to — platform ids would never
match — and must be in **chain order** (start nearer `stops[0]`); nothing sorts them.

Seeded values (changesets 036–039, updated by `transport_mode` so a group cannot diverge):

| Group | focus_start | focus_end | only_focused |
|---|---|---|---|
| TRAIN 43/44 | Kungsängen `9021001006081000` | Älvsjö `9021001005141000` | false |
| METRO 17/18/19 | Åkeshov `9021001001241000` | Medborgarplatsen `9021001001511000` | **true** |
| BUS 112, 117 | — | — | false |

*Why the metro window ends before Gullmarsplan:* Gullmarsplan is the last station all three green lines share —
19 branches to Hagsätra right after it, 17/18 continue via Skärmarbrink. Ending at or before it keeps the whole
window on common track, so no vehicle can be projected onto a branch that is not drawn. Medborgarplatsen, two
stations earlier, was chosen purely to fit fewer stations on screen — that part is preference, the
at-or-before-Gullmarsplan part is a constraint. `only_focused` is set for the metro because the unfocused view
would have to render a fork the schematic cannot draw.

`GtfsAccessService.validateRouteGroupConsistency()` enforces three rules at startup, aborting with
`IllegalStateException` (all violations are logged before the abort, so one startup shows the full picture):
1. All rows in a group carry identical focus config.
2. Both ends of the window are set, or neither.
3. `only_focused` requires a complete window.

**`gtfs_monitored_route` is the source of truth for which lines are tracked.** Seeded via Liquibase: 43/44
(TRAIN), 112/117 (BUS), 17/18/19 (METRO). 112 exists to exercise route presentation logic and is not shown in
the deviation pane.

**C - DONE - BE/FE, Live traffic view.** `/live-traffic` shows a schematic of the selected route group with live
vehicles on it, polled every 8 seconds.

*Backend.* `GtfsRealtimeCache` (inner class in `GtfsRealtimeService`) is a request-driven poll loop on a virtual
thread: 5-second interval, 5-minute **sliding** window renewed by each request, so a long viewing session never
hits a mid-session blocking fetch and polling stops promptly when the user leaves. Nothing polls when nobody is
watching. `getRouteData()` resolves the group's `LiveTrip` first (so a misconfigured group cannot trigger an
upstream call), locates every vehicle against the **full** chain, then crops — geometry never depends on which
view was asked for. When focused, the chain is a cropped copy and vehicle `segIdx` values are rebased onto it,
so the frontend always receives a self-contained picture. `onlyFocused` groups are forced focused server-side
rather than trusting the caller. Vehicles outside the window are dropped and counted in `RouteFocus` —
**approaching only**, since a vehicle that has already left tells the viewer nothing about when the next arrives.

*Frontend.* `live-traffic-graph` draws a vertical axis at `AXIS_X_PERCENT` (one constant drives axis, stop rows
and both label lanes). Stop names hug the left edge with a flexbox leader dash that fills the remaining space and
ends on the axis — no measuring, names of any length line up. Triangles ride 8px off the axis (▼ right / ▲ left)
so opposing vehicles never overlap; destination labels sit in lanes either side, approaching counts further out
in a muted pill. Truncated ends get a ⋮ at the very end of the axis with the stops inset by `TRUNCATION_INSET`.

- **Equal (schematic) stop spacing, not proportional.** `stopY(i) = i / (n-1)`. Proportional fails badly on line
  43: 74 km over 20 stops puts inner-city stations ~8px apart in a 600px box. Consequence: screen speed no longer
  reflects real speed, and `shapeDistTraveled` is not consulted at all. Both position functions are pure and
  swappable if a to-scale mode is ever wanted.
- **Positioned divs, not SVG.** Everything here is axis-aligned lines plus text, which divs do well — and SVG
  `<text>` has no wrapping or ellipsis, which long Swedish station names need. Switch to SVG when branches
  (metro forks), rotation, or curves arrive.
- Responses are stored with a `requestKey` (group + focused) and ignored if they no longer match the selection —
  a late reply for a previous line would otherwise paint the wrong vehicles onto the new chain.
- `LiveVehicle.getDestination()` reads the vehicle's **own** trip (`stop_headsign`, falling back to its last
  stop's parent station). Deriving destination from the chain's end was wrong for short turns, which are routine
  on the metro and on 117 at rush hour.
- Focus toggle state is derived from the group: train enabled and defaulting on, metro locked on, buses locked
  off (no window). Switching group resets the flag to that group's default.

**D - DONE - BE/FE, Favourite stops.** A user marks up to 10 stops in the settings dialog; their names render
bold on the live traffic schematic. Stored per user as JSON in `user_settings.favourite_stops` (changeset 040),
delivered on `GET /api/auth/me` inside `SettingsResponse` — no separate fetch on the live traffic view.

- **The stored `stopName` is load-bearing, not cosmetic.** It was written when the GTFS dataset was empty
  outside `local` (I5) and the catalogue endpoint therefore returned nothing in production, making the stored
  name the only way the dialog could render an existing selection. That gate is gone, but the reasoning
  survives it: the catalogue is also empty whenever a parse has failed or a stop has left the timetable.
  Hence the "Valda (ej i aktuell trafikdata)" section, which is what lets such a favourite still be removed.
- **`favouriteStops: null` in `PUT /settings` means "leave unchanged"**, `[]` means clear. The frontend is a
  static bundle on GitHub Pages, so a user on a cached older bundle sends no such field — with `@NotNull` their
  entire settings save would 400 and they could no longer even change their stop. Elements are unvalidated for
  the same reason; the service drops blanks, dedupes by id and truncates to 10 silently.
- **Two id namespaces.** `FavouriteStop.stopId` is a GTFS parent station id (`9021001…`), matching
  `LiveStop.stopId`. `UserSettings.stopPointId` / `RecentStop` use SL journey planner site ids — never
  interchangeable, which is why `FavouriteStop` is its own type rather than a reuse of `RecentStop`.
- `GET /api/protected/gtfs/route-group-stops` serves the catalogue, deliberately separate from `/route-groups`
  (fetched on every live view mount, would grow ~30× for data it never uses) and fetched lazily when the dialog
  opens. Stops are **not** deduplicated across groups — Alvik is on the green line and is the 112 terminus, and
  seeing it under both is how a user looks for it; selection is by id so both checkboxes tick together, and the
  cap counts unique ids.
- The whole chain is offered, not just the drawable focus window: favouriting a stop outside a window simply
  never shows, and widening a window later does not orphan anything already chosen.
- **Fixed along the way:** `updateSettings` in `App.tsx` replaced `user.settings` wholesale, dropping
  `recentStops` on every save. It now merges a `Partial<UserSettings>`. The bug was invisible because
  `StopAutocomplete` seeds its state with a lazy initialiser at mount; favourites would not have hidden it.
- The dialog uses local error state, not `ErrorContext` — `Layout` renders no `ErrorHandler`, so a global error
  would be invisible behind the modal backdrop.

---

## Reference notes

**GTFS data sources (Samtrafiken, key-based)**
- Static: `https://opendata.samtrafiken.se/gtfs/sl/sl.zip` — published daily 03:00–07:00. Bronze: 50 calls/month,
  so the DB cache is essential. No upgrade applied for; one download per day fits comfortably.
- Realtime: `https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb`. **Upgraded tier (July 2026):
  2,000,000 calls per rolling 30 days** — the two feeds have separate keys and separate tiers. Requires an
  `Accept-Encoding: gzip` header or the API returns 406.
- 2,000,000/30 days ≈ 66,700/day ≈ 46 calls/minute sustained. The quota is effectively a non-constraint: the
  5-second poll interval is 12 calls/minute, about a quarter of the budget even running 24/7. The design that
  came from the old Bronze limits — request-driven polling, nothing running when nobody watches — is kept for
  other reasons: CPU, and good manners toward a free API.
- `GtfsPipelineService.verifyRealtimeFeed()` fetches once at the end of each static pipeline run and discards
  the result, to keep the API exercised and to surface credential/quota/format problems in a log that is being
  read anyway.

**Static GTFS file notes**
- DB is the durable cache; `/tmp` is the working area for parsing.
- Relevant files: `routes.txt` (line names/types), `trips.txt` (trip→route join), `stops.txt` (names/coords),
  `shapes.txt` (polylines, for a future real map), `stop_times.txt` (stop sequences — needed for geometric
  placement since `current_stop_sequence` is never populated in the RT feed).
- Lookup chain from the realtime feed: `trip_id` → `trips.txt` → `route_id` → `routes.txt`.
- What varies daily is which trips are active, controlled by `calendar_dates.txt` (`calendar.txt` is validity
  periods only and is unused by Samtrafiken).

**Render free tier constraints** *(historical only — Render was decommissioned in August 2026. Kept because
I1, I4 and I5 below are unreadable without it.)*
- 512 MB RAM, 0.1 CPU (shared), no persistent disk. UptimeRobot pinged `/ping` every 5 min to prevent the
  15-minute inactivity sleep — those pings were load-bearing, not monitoring. UptimeRobot now points at
  `api2.tarnvik.com/ping` on the Mini, where nothing sleeps, so it is monitoring for the first time. That
  matters more here than it looks: the backend runs in a foreground terminal with no supervisor, so
  UptimeRobot is the only thing that will tell you it went down.

**G1 - BE - Startup double-load, mostly resolved.** `rebuildDataset()` used to run twice on startup — once via
the pipeline and once from `GtfsAccessService.onApplicationReady()`. The second call is now guarded by an
`isEmpty()` early return. What still runs twice is `validateRouteGroupConsistency()`, which is cheap and
in-memory.

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

**Parse-time spike — closed by the E-block move (August 2026).** The nightly 05:00 pipeline runs on a JVM
that already holds the full in-memory dataset, and on Render a second crash occurred during the trip
batch-save phase; after the successful re-parse old-gen settled at ~129MB (up from ~61MB). Root cause was
never confirmed — candidates were Hibernate session cache growth during the parse, which on Render took
roughly **47 minutes**, and the larger `GtfsTripInfo` object graph from the new `stopTimes` list. It stopped
mattering rather than being solved: the same parse takes **47 seconds** on the Mini with a peak heap of
293 MB against 2048 MB (measured figures in the E-block above). The headroom is now ~7× the peak, so a spike
of this size has nowhere to do damage.

**Parse memory logging (kept):** `GtfsParseService.logMemory(label)` emits `MEM [label]` lines at
`parse-start`, `post-trips`, `stop_times-N` (every 10k rows), `post-stop_times`, `post-calendar_dates`.
It is what made the 2026-08-06 measurement possible with no extra instrumentation, which is reason enough to
keep it even though the constraint it was written for is gone.

**Related:** G1 (double `rebuildDataset()` on startup). It no longer has a memory motive — the second load is
guarded by an `isEmpty()` early return and the peak it would have added is irrelevant at this heap size.
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

I5 - BE - **The in-memory GTFS dataset profile gate — removed (August 2026)**
--
`GtfsAccessService.rebuildDataset()` used to return immediately unless the `local` profile was active, so on
Render the dataset stayed empty: `/route-groups` returned an empty list, `/status` reported
`staticDataAvailable: false`, and live traffic did not work in production.

**Why it existed:** a temporary mitigation for the I1 OOM kills (commit "Temporary removal of static
dataset"). The dataset is the largest single allocation in the JVM and holding it left too little headroom
under Render's 512MB cap during the nightly parse.

**Why it could go:** the Mac Mini has no 512MB cap, so the constraint the gate existed for is gone. The gate
was removed on the `local_host` branch, which was then held back from `main` for as long as Render built
`main` — merging early would have loaded the dataset there and brought the I1 OOM kills back. Render was
decommissioned in August 2026 and the branch has been merged; the constraint is fully discharged and no
longer restricts anything.

**One thing the gate did not do, which cost a quota:** it lived inside `rebuildDataset()`, so it suppressed
only the in-memory load. `GtfsDownloadJob` is `@Profile("!test")` and ran on Render throughout, downloading
and parsing `sl.zip` into Supabase every night for nothing. The per-date guard is a `gtfs_download_log` row,
which is per-database, so the two deployments never coordinated. If a gate is ever added again to save
memory, put it where the *work* is, not where the result is stored.

The dataset now loads under every profile, including `test`. `GtfsParseService` keeps a separate `local`
check for something unrelated — the future `PARSE_DONE` placeholder rows that suppress downloads to stay
inside the static feed's 50-calls-per-month Bronze quota. That one stays local-only.
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
