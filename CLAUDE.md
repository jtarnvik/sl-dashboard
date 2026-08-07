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
| `LiveTrafficView` | `/live-traffic` | Logged in | Aktuell trafik — route group selector and focus toggle, both remembered per user; schematic vehicle view (`live-traffic-graph`), polled every 8s. Accepts `?mode=&group=` to preselect a line, used by the departures pane |
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

**The live traffic view remembers itself** — route group and focus switch, stored per user in three
`user_settings` columns (changeset 041) and delivered inside `SettingsResponse.liveTrafficView`, so the view
restores without a fetch of its own. Saved on every change via `PUT /api/protected/settings/live-traffic-view`,
deliberately a separate endpoint from `PUT /settings`: that one is the settings dialog's and requires a stop
point the live view does not own, and disjoint columns mean neither can clobber the other.

- **`focused` null is not false.** Null means the switch has never been operated, so the group's own default
  (focused-on wherever a window exists) still applies. A locked group — the metro, forced on; the buses, no
  window — sends null so that merely *selecting* it cannot overwrite the flag a group with an operable switch
  is relying on. Both `persistView()` in the view and `saveLiveTrafficView()` in the service apply that rule.
- **One global focus flag, not one per group.** Only the train group is adjustable today, so the two are
  indistinguishable; revisit if a second adjustable group is ever configured.
- The stored group is matched against the groups the backend currently serves. A line dropped from
  `gtfs_monitored_route`, or a failed parse, leaves it matching nothing and `DEFAULT_GROUP_DISPLAY_NAME`
  ('117') takes over — which is why that constant is still there.
- The view reads the stored value through a **ref**, not from `user` in the fetch effect. Saving patches the
  user context, so a dependency on it would re-run the effect, refetch the route groups, reset the selection
  and save again.
- **That effect is not a mount effect, whatever it looks like.** `setError` is a plain function declared in
  `App`'s body, so it is a new value on every `App` render and the effect re-runs with it. Two consequences,
  both fixed and both easy to reintroduce: the promise needs a `cancelled` guard, or a reply arriving after
  the user has left will run `navigate('/live-traffic', { replace: true })` and replace the page they went to
  — which is what made the navbar logo need two clicks; and `initialParamsRef` has to be emptied once
  consumed, since the ref outlives the run that read it and a re-run would re-apply the arrival over a
  selection made since. Memoizing `setError` in `App` would remove the cause rather than the symptoms, but it
  touches every effect in the app that lists it.

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

## GTFS and live traffic

The backend mechanics — services, tables, phase timings, the RT field-availability table — are in
`publicbackend`'s `CLAUDE.md`, which this file includes. This chapter holds what is not derivable from the
code: the feed's quirks, and the reasoning behind the live model and the schematic.

### Data sources and quotas

- **Static:** `https://opendata.samtrafiken.se/gtfs/sl/sl.zip`, published daily 03:00–07:00. Bronze tier,
  **50 calls/month** — which is why the DB is the durable cache and one download per day is a hard rule.
- **Realtime:** `https://opendata.samtrafiken.se/gtfs-rt/sl/VehiclePositions.pb`. Upgraded July 2026 to
  **2,000,000 calls per rolling 30 days** — the two feeds have separate keys and separate tiers. Requires an
  `Accept-Encoding: gzip` header or the API returns 406.
- The realtime quota is effectively a non-constraint: ≈46 calls/minute sustained, against the 12/minute a
  5-second poll interval uses. Request-driven polling — nothing runs when nobody is watching — came from the
  old Bronze limits and is kept for other reasons: CPU, and good manners toward a free API.
- `GtfsPipelineService.verifyRealtimeFeed()` fetches once at the end of each static run and discards the
  result, to keep the API exercised and to surface credential/quota/format problems in a log that is being
  read anyway.

### What the feed does and does not give you

- `/tmp` is the working area for parsing; the DB is the durable store.
- Files that matter: `routes.txt` (line names/types), `trips.txt` (trip→route join), `stops.txt`
  (names/coords), `stop_times.txt` (stop sequences), `shapes.txt` (polylines, for a future real map).
- Lookup chain from the realtime feed: `trip_id` → `trips.txt` → `route_id` → `routes.txt`. The RT feed never
  populates `route_id`, `current_stop_sequence` or `stop_id`, so stop placement has to be geometric.
- What varies daily is which trips are active, controlled by `calendar_dates.txt`. `calendar.txt` holds
  validity periods only and is unused by Samtrafiken.
- **`gtfs_stop` includes parent stations** (`9021001…`, `location_type=1`) as well as platform stops
  (`9022001…`). Two-pass parse: the first collects platform stops and their `parentStation` ids, the second
  retains those parent rows. Parent stations are the direction-neutral reference points the schematic is drawn
  from.
- Startup runs `validateRouteGroupConsistency()` twice — once via the pipeline, once from
  `GtfsAccessService.onApplicationReady()`. Cheap and in-memory; the duplicate `rebuildDataset()` that used to
  accompany it is guarded by an `isEmpty()` early return.

### Monitored routes and focus windows

**`gtfs_monitored_route` is the source of truth for which lines are tracked.** Seeded via Liquibase: 43/44
(TRAIN), 112/117 (BUS), 17/18/19 (METRO). 112 exists to exercise route presentation logic and is not shown in
the deviation pane. Variant matching (e.g. 43X) is a uniform regex rule in `GtfsNameUtil`, not a per-row flag.

`focus_start` / `focus_end` (nullable) bound the sub-corridor shown on the schematic; `only_focused` hides the
full route for branching lines. The ids must be **parent stations**, because that is what `LiveStop` resolves
to — platform ids would never match — and must be in **chain order** (start nearer `stops[0]`); nothing sorts
them.

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

### The live route model (`model/gtfs/livetraffic/`)

**The core problem it solves:** a route group contains hundreds of trips per day that differ in stop count
(short turns, forks, depot runs). The schematic needs *one* canonical stop chain per group, not hundreds. The
design picks a single **identity trip** — the one trip that traverses the whole line — and treats every other
trip as a variation on it.

**`GtfsDataset.organizeRoutes()`** groups `tripInfoById.values()` by `GtfsTripInfo.getGroupKey()`, resolves a
selector per group, and stores the result in `Map<GroupKey, LiveTrip> liveTrips`. Built in the constructor; a
`GtfsLiveException` is caught and logged as a warning so a bad group cannot prevent the dataset from loading at
all. `hasLiveSupport()` reports whether any group produced a `LiveTrip`. It is a plain `for` loop over the
grouped entries rather than a stream, so that `GtfsLiveException` could stay checked.

**`GroupKey`** — `record (TransportMode, int routeGroup)`, the same pair the frontend sends to `/route-data`.
`GtfsAccessService` still declares two *local* `GroupKey` records of its own (in `getMonitoredRouteGroups()`
and `validateRouteGroupConsistency()`) — candidates for consolidation onto this type.

**`GtfsTripInfoSelector`** (abstract) — per-line strategy holding an expected `stationCount` and a start
terminus (`ParentStopIdentifier`). `findIdTrip()` scans the group for the trip matching both. Subclasses
`Train43`, `Bus112`, `Bus117`, `MetroGreen` are registered in a static map in `GtfsTripInfoSelectorFactory`
keyed by each class's `getGroupKey()`; an unregistered group throws
`GtfsNoRegisteredSelectorForGroupKeyException`.

*Why hardcoded station counts and termini:* the GTFS feed has no field that says "this is the full line". Trip
length plus start station is the only reliable discriminator, and both are stable per line. The cost is that a
permanent line extension means editing the selector — deliberate, since such a change needs a look at the
schematic anyway.

**`LiveTrip`** — the canonical chain for one group: `direction`, `stopHeading`, `List<LiveStop>`, plus
`Map<Integer, RouteVariant> edgeVariants` (terminus per direction) and `List<RouteVariant> routeVariants`.
`reverseTrip()` flips the chain in place, recomputing `shapeDistTraveled` from the total so distances still run
from zero at the new start.

**`LiveStop`** always resolves the **parent station**, never the platform — the schematic is direction-neutral.
It implements `GeoPosition`, so it feeds straight into `GtfsGeometryUtil.locateOnRoute()`. A missing parent or
stop throws (`GtfsNoParentForStopException` / `GtfsNoStopInfoException`) rather than silently placing a stop at
the wrong coordinates.

**`variations/`** — `RouteVariant` (abstract) with three kinds: `EndStopRouteVariant` (expected terminus per
direction), `RouteForkVariant` (a branch as a `List<LiveForkStop>`), `AtypicalRouteVariant` (a stop plus an
info message). `MetroGreen` declares its forks as `ForkPart(start, end, length)` records — Skärmarbrink →
Farsta strand (9) and Skärmarbrink → Skarpnäck (6) — resolved by `getRouteForkVariant()` scanning trips for a
matching sub-sequence. The variant classes currently only hold data; no behaviour yet.

**`GtfsUtil`** (`livetraffic/util/`) — `getParent()` / `getSafeParent()` / `getParentId()` /
`getReverseDirection()`. Distinct from `service/util/GtfsNameUtil`, which does line-name matching.

### Locating a vehicle

`GtfsGeometryUtil.locateOnRoute()` returns `VehicleLocation(int segIdx, double t)`:
- `segIdx` — zero-based index of the first stop in the closest segment (the vehicle is between `stops[segIdx]`
  and `stops[segIdx+1]`)
- `t` — fraction [0,1] along the **straight line** between those two stops (dot-product projection + cosLat
  correction), **not** a route-distance fraction

`GtfsStopTimeInfo.shapeDistTraveled` is cumulative metres along the route shape polyline from trip start.
Combined with `t`, vehicle position as a percentage of total trip distance:

```java
double dStart = stopTimes.get(segIdx).getShapeDistTraveled();
double dEnd   = stopTimes.get(segIdx + 1).getShapeDistTraveled();
double dTotal = stopTimes.get(stopTimes.size() - 1).getShapeDistTraveled();
double pct    = (dStart + t * (dEnd - dStart)) / dTotal * 100.0;
```

For short inter-stop segments the difference between the straight-line and the true route-distance fraction is
negligible; over longer segments with significant bends it drifts, but stays good enough for the schematic.

### Serving the live view

`GtfsRealtimeCache` (inner class in `GtfsRealtimeService`) is a request-driven poll loop on a virtual thread:
5-second interval, 5-minute **sliding** window renewed by each request, so a long viewing session never hits a
mid-session blocking fetch and polling stops promptly when the user leaves.

`getRouteData()` resolves the group's `LiveTrip` first, so a misconfigured group cannot trigger an upstream
call. It then locates every vehicle against the **full** chain and crops afterwards — geometry never depends on
which view was asked for. When focused, the chain is a cropped copy and vehicle `segIdx` values are rebased
onto it, so the frontend always receives a self-contained picture. `onlyFocused` groups are forced focused
server-side rather than trusting the caller. Vehicles outside the window are dropped and counted in
`RouteFocus` — **approaching only**, since a vehicle that has already left tells the viewer nothing about when
the next one arrives.

### The schematic (`live-traffic-graph`)

A vertical axis at `AXIS_X_PERCENT` — one constant drives the axis, the stop rows and both label lanes. Stop
names hug the left edge with a flexbox leader dash that fills the remaining space and ends on the axis, so
names of any length line up with no measuring. Triangles ride 8px off the axis (▼ right / ▲ left) so opposing
vehicles never overlap; destination labels sit in lanes either side, approaching counts further out in a muted
pill. Truncated ends get a ⋮ at the very end of the axis with the stops inset by `TRUNCATION_INSET`.

- **Equal (schematic) stop spacing, not proportional.** `stopY(i) = i / (n-1)`. Proportional fails badly on
  line 43: 74 km over 20 stops puts inner-city stations ~8px apart in a 600px box. Consequence: screen speed no
  longer reflects real speed, and `shapeDistTraveled` is not consulted at all. Both position functions are pure
  and swappable if a to-scale mode is ever wanted.
- **Positioned divs, not SVG.** Everything here is axis-aligned lines plus text, which divs do well — and SVG
  `<text>` has no wrapping or ellipsis, which long Swedish station names need. Switch to SVG when branches
  (metro forks), rotation, or curves arrive.
- Responses are stored with a `requestKey` (group + focused) and ignored if they no longer match the selection
  — a late reply for a previous line would otherwise paint the wrong vehicles onto the new chain.
- `LiveVehicle.getDestination()` reads the vehicle's **own** trip (`stop_headsign`, falling back to its last
  stop's parent station). Deriving destination from the chain's end was wrong for short turns, which are
  routine on the metro and on 117 at rush hour.
- Focus toggle state is derived from the group: train enabled and defaulting on, metro locked on, buses locked
  off (no window). Switching group resets the flag to that group's default.

### Vehicle selection and stop times

Clicking a vehicle dims the rest and writes a countdown on each leader dash from that vehicle onwards. The
component is split: `LiveTrafficGraph` holds the guard returns, `Schematic` holds every hook — the guards run
before any hook, so they cannot sit in one component.

- **`selectedTripId` lives in the view, not the schematic**, so it survives the poll replacing `routeData`
  every 8s. It is cleared in the listbox and focus handlers — never in an effect watching the data, which
  would fight the poll loop. The selected vehicle is *derived* (`vehicles.find(...)`), so a vehicle missing
  from one response shows no times and comes back on the next rather than clearing the selection.
- **Dimmed vehicles keep their triangle but lose their destination label.** Not only decluttering: the upward
  label lane is anchored at `right: calc(35% + 1.25rem)`, exactly where the leader dashes are, so leaving them
  up would cover the countdowns the selection exists to show.
- Both the triangle and the label are click targets with `p-2 -m-2` padding — the triangle is a 10px glyph and
  is unhittable on a phone without it. The container deselects on click, so the buttons stop propagation.
- **The countdown clock ticks unconditionally** (10s), rather than only while something is selected. Gating it
  would mean seeding a fresh `now` when a selection starts, which is a `setState` inside an effect — the rule
  the improvements list wants driven back to zero — and the saving is nothing beside the 8s poll.

### Resolving a departure row to a vehicle (`GtfsTripMatchUtil`)

Clicking an en-route departure opens the live view with that vehicle already selected. SL's `journey.id` and
GTFS `trip_id` share no namespace, so the two are joined on **content**: line, stop, timetabled second and
destination. All four verified against a live SL feed and the same day's static extract.

- **`stop_area.id` is the national stop area number**, so the stop leg is an exact id join, not a name match:
  `9021001` + the six-digit area number + `000`. Skogslöparvägen 12273 → `9021001012273000`, Kungsängen 6081,
  Älvsjö 5141, Åkeshov 1241. Every one of the 7231 parent stations in the feed follows the format. It is the
  *site* id (`9091001000003715`) that is foreign and unconvertible — the one the departures URL is built
  from. Because the encoding is inferred rather than documented, `stopAreaName` rides along as a fallback.
- **The scheduled times agree to the second** — 09:52:52, 10:08:18, 10:11:30 all identical on both sides.
  Both come out of the same SL planning system. So does `destination` against `stop_headsign`, including
  metro short turns (Alvik, Åkeshov). The 30s tolerance in the util is slack against a future rounding
  change, not something any observed data needs.
- **Destination is required, not a tiebreaker.** At Älvsjö two line 43 departures leave at exactly 10:00:00,
  for Västerhaninge and for Kungsängen. Line, stop and time alone match both. That collision is what
  `GtfsTripMatchUtilTest` is built around.
- **The search runs over live vehicles, not the timetable** — a few dozen against thousands of trips per
  group per service day, and a trip with no vehicle behind it cannot be pointed at on a schematic anyway.
- Resolving goes through `getContinously()` on purpose, renewing the poll window: the caller is on their way
  into the live view, so warming the loop makes their first route-data request a cache hit.
- **SL sends `scheduled` with no offset** (`2026-08-07T10:21:01`). The endpoint therefore takes a
  `LocalDateTime` and `GtfsTimeUtil.toInstant` applies Europe/Stockholm. An `Instant` parameter would have
  400'd every real request while passing every hand-written test — `ResolveTripEndpointTest` uses the raw SL
  string for exactly that reason.
- **`@Validated` must not go on the controller class.** It routes parameter constraints through an AOP proxy,
  which throws `ConstraintViolationException` → 500; Spring 6.1+ built-in method validation gives 400 for the
  same `@NotBlank` when the class is left unannotated.

**Only en-route rows are clickable.** `isTrackableJourney` in `util/journey-state.ts` requires one of the four
`*PROGRESS` states and rejects `prediction_state` of `LOSTCONTACT`/`UNRELIABLE` — SL saying it still shows the
journey as moving while admitting it cannot see the vehicle, which is exactly when a search comes back empty.
A "Planerad" row has no vehicle in the realtime feed, so there would be nothing on the schematic to point at.
That module also owns the styling classification `Destination` uses, so the click rule and the grey-text rule
cannot drift apart. Observed hit rates: 1 of 6 rows en route at Skogslöparvägen, 24 of 42 at Älvsjö, 19 of 26
at Medborgarplatsen — at a bus stop on a 15-minute headway only the imminent departure qualifies, which is
the one worth clicking.

**Failure is a note, never an error.** The view opens on the line regardless; `resolve=<outcome>` in the url
becomes one dismissible amber line. The "matched but not drawn" case is *not* answered by the backend — the
pane cannot know what focus the view will use — so the view derives it after its first poll: selected trip
absent from `vehicles` while `focus` reports truncation. Requiring actual truncation is what stops it firing
on the ordinary gap where a vehicle misses one poll. `handleShowWholeLine` deliberately keeps the selection
that `handleFocusChange` drops, since here the selection is the whole reason for widening.

### Predicted times (`GtfsPredictionUtil`, `GtfsTimeUtil`)

**Only VehiclePositions is fetched — there is no TripUpdates feed, so no delay or predicted time ever arrives
from upstream.** A raw scheduled time would be wrong by exactly however late the vehicle is, which is when
someone is looking. The delay is instead derived from the one thing the feed does give, position:
`GtfsGeometryUtil.locateOnRoute()` is run a second time against the vehicle's **own** trip, the scheduled time
at that point is interpolated, and the gap from the position report's timestamp is added to every remaining
stop. Two guards stop a bad match producing a confident wrong number — a projection over 1000 m off the trip
falls back to the plain timetable, and the delay is clamped to ±30 min.

- **GTFS times are not clock times.** Hours run past 24, and the instant is built as *noon minus twelve hours*
  on the service date rather than midnight — that is the spec's definition and it is what survives a DST
  changeover, where the two differ by an hour.
- The service day is resolved by trying yesterday/today/tomorrow and keeping whichever scheduled span sits
  closest to the observation. Deliberately independent of `calendar_dates.txt`: the vehicle is on the road, so
  the question is not whether the service runs but which midnight its times count from.
- The chain counts in **parent stations**, the trip's stop times in **platforms** — joined via
  `GtfsUtil.getParentId()`. A chain stop the trip never calls at (short turn, `43X` variant) yields nothing,
  which is the normal case, not a fault.
- Predictions are computed against the full chain and filtered in `rebase()`, the same rule the geometry
  follows. Sent for **every** vehicle each poll so selection costs no round trip; absolute epoch seconds, not
  minutes, so the browser counts down between polls.

### Favourite stops

Stored per user as JSON in `user_settings.favourite_stops` (changeset 040) and delivered on `GET /api/auth/me`
inside `SettingsResponse`, so the live traffic view needs no fetch of its own.

**There are two ways in, and they are not interchangeable.** The settings dialog owns the whole list; the
schematic toggles one stop at a time by a tap on its name, through
`PUT /api/protected/settings/favourite-stops`.

- **Bold is the only marker, and the name is the whole hit target.** A star on every row does not fit a
  chain of 20 stops in a phone-height box. `StopRow`'s padding widens the touch target and must stay
  symmetric — the row is centred by `-translate-y-1/2`, which halves the padded box, the same constraint
  the vehicle triangle carries.
- **The toggle must `stopPropagation`.** `Schematic`'s root clears the vehicle selection on any click, so
  without it every favourite toggle would also wipe the countdowns drawn on those same rows.
- **Its own endpoint, for the reason `live-traffic-view` has one:** the live view does not own
  `stopPointId` / `useAiInterpretation`, and echoing them back on every tap would overwrite a stop changed
  in the dialog meanwhile. Unlike `/settings`, a null list is a 400 — no cached-bundle callers to indulge.
- **The cap is refused client-side**, in the amber notice bar at top priority. The backend truncates
  silently, so leaving it to decide would leave the eleventh stop bold until the next reload.
- The save is optimistic and reverts on failure, and unlike `saveLiveTrafficView` it does surface an error:
  the user asked for this change and will look for it again later.
- **The dialog is still the only way to remove an orphaned favourite** — a stop outside every focus window,
  or one that has left the timetable, is on no schematic to be tapped.

- **The stored `stopName` is load-bearing, not cosmetic.** The stop catalogue is empty whenever a parse has
  failed or a stop has left the timetable, and the stored name is then the only way the dialog can render an
  existing selection. Hence the "Valda (ej i aktuell trafikdata)" section, which is what lets such a favourite
  still be removed.
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
- The dialog uses local error state, not `ErrorContext` — `Layout` renders no `ErrorHandler`, so a global error
  would be invisible behind the modal backdrop.

### Open question — FAILED vs ERROR_IN_PARSE

`FAILED` is set when the pipeline catches an exception in any phase (`GtfsDownloadService` or
`GtfsParseService.handlePipelineFailure()`), and an `errorMessage` is saved. `ERROR_IN_PARSE` is set by
`GtfsDownloadService.recoverIfNeeded()` at startup when the status is stuck at `PARSE_START` — the parse died
without anything catching it, so there is no message.

The behavioural difference is in `GtfsAccessService.rebuildDataset()`: `isErrorState()` covers only
`ERROR_IN_PARSE`, which forces an empty dataset and leaves live traffic unavailable, while `FAILED` proceeds
normally and loads yesterday's rows from the DB. The reasoning was that a caught exception means the
transaction rolled back cleanly, whereas a crash left the DB state uncertain.

**To review:** OOM is a `java.lang.Error` and `@Transactional` does roll back on `Error`, so the tables are in
fact safe after a crash too. The forced-empty dataset is conservative rather than necessary — decide whether to
keep it.

## Planned Improvements

Committed follow-ups, to be done in sequence.

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

---

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

**1 - FE/BE, Bus tracking with push notification.** The most personally useful of these.
A schematic of bus 117 — which now exists — where the user marks a specific bus as the one they intend to catch,
and the backend sends a push notification when it passes a designated trigger stop. The use case is knowing when
to leave for the stop, six minutes' walk away.
- Everything needed is already in place: `vehicleId` and `tripId` are in the response, stop sequences are in the
  dataset, and Pushover is integrated for error notifications. This is additive rather than blocked.
- The one design question: a tracked bus has to survive the backend forgetting it. The poll loop shuts down five
  minutes after the last request, so a "notify me" registration must outlive it and drive its own polling.

**2 - FE, Journey planner route map.**
Show the routes suggested by the route planner pane on a map — the whole journey and each individual leg. The
coordinates are already in the journey planner API response, so no GTFS realtime data is involved. Choosing and
integrating a map library (Leaflet or MapLibre) is part of this goal; the frontend has none today.
- Unlike the schematic, this one genuinely needs a map. It also touches no GTFS data at all, so it is the one
  goal here that depends on nothing else in this file.

---

## Completed

The design notes worth keeping from these live in the GTFS chapter above. The rest is in the code.

- **A/B — BE, GTFS pipeline and in-memory dataset.** Nightly download → unzip → parse → rebuild dataset →
  verify realtime feed. Five DB tables on natural GTFS keys; transaction design and the
  `entityManager.detach(entry)` lock-avoidance pattern are in the `GtfsParseService` class Javadoc.
- **C — BE/FE, Live traffic view.** `/live-traffic`: a schematic of the selected route group with live vehicles
  on it, polled every 8 seconds.
- **D — BE/FE, Favourite stops.** Up to 10 stops per user, marked in the settings dialog, rendered bold on the
  schematic.
- **F — BE/FE, Vehicle selection and arrival times.** Click a vehicle on the schematic: the others dim and
  every stop ahead of it gets a countdown on its leader dash. A departure row for a monitored line opens the
  view on that line. Design notes are in "Vehicle selection and stop times" and "Predicted times" above; the
  one thing to remember without reading them is that **the times are the timetable corrected by an observed
  delay, because there is no TripUpdates feed to ask.**
- **G — BE/FE, Resolve a departure row to a specific vehicle.** Clicking an en-route departure opens the live
  view with that vehicle selected, matched on content rather than id via
  `GET /api/protected/gtfs/resolve-trip`. Design notes are in "Resolving a departure row to a vehicle" above;
  the two things to remember without reading them are that **`stop_area.id` converts straight to a GTFS
  parent station id** — the goal was written assuming no id bridge existed, and that turned out to be true
  only of the *site* id — and that **rows that are not moving are not clickable**, because a planned
  departure has no vehicle in the realtime feed to point at.

- **E — BE/infra, Backend moved from Render to the home Mac Mini (August 2026).** `sl.tarnvik.com` now talks to
  `api2.tarnvik.com`; the application code was unchanged, only where it runs. Render and Supabase are gone and
  there is no rollback target. Live traffic works in production for the first time — Render's 512 MB cap was
  why it did not. The deployment itself is documented in `publicbackend`'s `CLAUDE.md`.

  Two lessons that outlived the move, because both are reusable:
  - **A parked deployment is not an idle one.** Render kept downloading `sl.zip` daily to the very end: the
    profile gate that suppressed the in-memory dataset sat inside `rebuildDataset()` rather than around the
    download, and the per-date guard is a DB row, so two backends never coordinated — roughly 62 calls against
    a 50-calls-per-month quota. Gate the *work*, not where the result is stored.
  - **Rollback insurance decays on its own.** Once the old OAuth redirect URI was dropped and the old database
    went a day stale, "roll back to Render" was no longer one commit and would have discarded everything since
    cutover. Decide when the insurance stops existing rather than assuming it still does.

---

## Issues

No current issues.
