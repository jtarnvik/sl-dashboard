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

A - FE/BE, Improve GUI for trips and deviations.
The current layout stacks Routes and Deviations vertically, which wastes horizontal space on wider screens and buries deviations below the
(potentially long) routes pane. The goal is a side-by-side layout with the Routes pane forming an L-shape when expanded, keeping routes
and deviations simultaneously visible. The Routes controls section will also be redesigned: a simple one-click "Ta mig hem" (15 min walk),
plus a more flexible form for specifying a custom destination and departure time (default "now"). The expanded journey cards remain
largely unchanged initially.

Side-by-side layout for Routes and Deviations with L-shape expansion and redesigned Routes controls.

Layout: on mobile, stacked layout unchanged. On md+ (≥ 768px), Routes and Deviations appear side-by-side (Routes ~70% left, Deviations ~30%
right). When journeys are fetched, the Routes area expands downward to full width forming an L-shape — header left + full-width journey cards
below — styled as ONE continuous pane (single card background throughout the L). Deviations stays in the upper-right as its own distinct card.

Controls redesign (general intent, to be detailed in sub-steps):
- A simple "Ta mig hem" button (15 min walk time) — one click, no configuration.
- A more flexible form for specifying a custom destination stop and departure time (default "now").
  These replace the current "Ta mig hem / 15 min / 60 min" control layout.

Journey cards: no changes initially.

A1 - DONE - FE, replace the Symbols button in the Deviaions pane with a icon button. Select the circle icon with an 'i' centered
from the same icon package we use the warning icon from.

A2 - DONE - FE, Reorganize the deviations pane as a horisontal stack with 3 icons the the re-made info button from A1.

A3 - DONE - FE, L-shaped layout. Routes controls (Route 1) and Deviations side by side. When journeys load, Route 2 expands below at
full width, visually connected to Route 1 via shared background and bridged borders. Implemented using CSS Grid with an absolutely
positioned bridge element.

A4 - FE, Redesign the Route 1 controls area. Two-line layout: line 1 has a "Hem" button and an autocomplete stop input;
line 2 has a time selector (NOW default vs specific future time). Origin is always geolocation. Max walk time is fixed at 15 min
(the 60 min button is dropped; a future setting B9 will make it configurable). The 60 min button is removed in A4a.

A4a - DONE - FE, Replace current Route 1 controls with the two-line shell layout. Line 1: "Hem" button (triggers route with geolocation +
15 min walk to the settings stop) + a disabled placeholder input for the autocomplete stop. Line 2: two radio buttons — "Nu" (default,
selected) and a time input (disabled for now). Wire "Hem" to the existing `updateDepartures(15)` call. Drop the 60 min button.
No autocomplete or time logic yet — those come in A4b and A4c.

A4b - DONE - FE, Implement autocomplete for the stop input in Route 1. Use the `Combobox` component from `@headlessui/react` (already
installed) — it handles keyboard navigation, ARIA roles, and open/close state; styled with Tailwind to match the rest of the UI.
After 3+ characters are typed, query `URL_GET_STOP_POINT` with debouncing (300 ms) and abort-on-new-input. Show a dropdown of
matching stop names. Selecting a stop immediately triggers `updateDepartures(15)` toward that stop instead of
`settingsData.stopPointId` — no extra button needed, selection is the intent signal. A clear button resets the input and
restores the default "Hem" state (so the next "Hem" click goes back to the settings stop).
   
A4c - DONE - FE - Adjust the route  selection logic.
- The time selection and start of the search are slightly unintuitive. Lets make a specific search button to the right of the time selector.
The button should be just an icon  to fit. We should now have only three ways to start a route search
  x The "Hem" button
  x The new search button (only enabled when arrive/departure time is selected)
  x When a station is searched for in the dropdown
- Switchingtime mode clears the time selector and clears the routes if there has been a previous search.
- If a time before now is selected in the time selector that time is assumed to be tomorrow and tomorrows date shall be passed to the API
- The calc_in_direction parameter shal only be false (ie include on tripe before time) when the time selector is set to departure, nor wor arrival.


A4d - DONE - FE, Implement the time selector in Route 1 line 2. "Nu" radio is default and passes no time param to the API (current behaviour).
The second radio reveals a native `<input type="time">` (HH:MM) — no library needed, works well on mobile. When a future time is
selected, pass it to `URL_GET_TRAVEL_COORD_TO_v2` via the `itd_time` / `itd_trip_date_time_dep_arr` params (already in constant.ts
as commented-out placeholders). Only future times on today's date are supported for now.
   
A5 - FE/BE, Store and display the last 5 autocomplete stop selections per user as recent stops ("favourites").
Allows quick re-use of frequently searched stops without retyping.

Storage: add a nullable `recent_stops` TEXT/JSON column to the existing `user_settings` table (Liquibase changeset 022).
Stored as a JSON array of `{stopPointId, stopPointName}` objects, max 5 entries, always read and written as a whole unit.

BE changes:
- Include `recentStops` array in the existing `GET /api/auth/me` settings response (already the source of truth for settings on load).
- New `POST /api/protected/settings/recent-stops` — body `{stopPointId, stopPointName}`. Service prepends the entry,
  removes any existing duplicate with the same stopPointId, then trims to max 5. Returns the updated list.
- New `DELETE /api/protected/settings/recent-stops` — clears the list. Returns 204.

FE changes:
- When the autocomplete input is focused with fewer than 3 characters typed AND the user has recent stops: show a dropdown
  with the recent stops as selectable options, followed by a `<hr>` divider, followed by a "Rensa" item.
- Selecting a recent stop triggers a route search immediately (same as a normal autocomplete selection) and calls
  `POST /api/protected/settings/recent-stops` to move it to the top of the list.
- Selecting a stop from the normal autocomplete (≥3 chars) also calls `POST /api/protected/settings/recent-stops`.
- Clicking "Rensa" calls `DELETE /api/protected/settings/recent-stops` and clears recent stops from local state.
- Recent stops are loaded from the `recentStops` field already returned by `GET /api/auth/me` on login — no extra fetch needed.

B - FE/BE, More work, not broken down yet
B-2 - F2, Handle the message "No routes, are you already there?" Remove the text field. Maybe a popup? Or remove?
B-1 - FE, Store the last 4 stops searched for, show them as defaulst in the autocomplete until the first thre charshavebeen pressed-.
B0 - FE It the Journeys / Leg pane. In the "Gå till" Add the destination.
B1 - FE Examine how deviations work for buses, Do I handle lines correctly?
B2 - FE how to handle long list of departures
B3 - Make a better sorting of large departure boards. Group by type?
B4 - FE, the installingar dlg is a bit awkward, type sundbyb, select search, click list, clisk spara.
B5 - FE, How to handle filter by routes and stops. Should this be moved to backend, especialy if w have some kind of schedule based be handling
B6 - FE, the deviation modal, make some kind of line between different deviations, the
B7 - FE, Tooltip on the divaiations modal that shows importance och info/delay/cancel info.
B8 - Add a live scan line preview to the symboler modals, and an orange time and explain it is clickable and indicates a deviation.
B9 - FE/BE, Add a max walk time setting. Currently hardcoded to 15 min after A4a. Add a user setting (stored in backend alongside
stopPointId) so users can choose their preferred max walk time. Default 15 min. Exposed in the Settings dialog.
B10 - The user screen is not align correctly in columns. Look in production
B11 - Prova att routa til Norrvrå, lite många steg. Kanke byt ut mitten mot ...
B12 - Use the Autocomplete stop selection box in the settings dialog as well. Create separate component to reuse.
B13 - FE Deviations pane should have a little bit more padding at top and bottom. Make sure the route pane can handle it as well
B14 -  Treat time selection as next day of time before now.
B15 -  There is room for a thin grey line between the Now time and the journeys. Not all the way to the edge.
B16 - Setting how to handle deviations. Now its specific stops on green and the complete buss line, and some specific places for trains. Do better.
B17 - Add a "next trips" route to get more.

C - Bulletin board

D - Preload deviations
D1 - Add a periodical check for new deviations to BE to speed up future use

E - FE/BE, Map support for trips and online maps for moving buses.

## Future Enhancements

Ideas that are not currently needed but should be remembered if the need arises.

### Frontend cache for deviation interpretations
Cache backend interpretation results in a `Map<string, BackendInterpretationResult>` keyed by deviation text for the lifetime of the page session. On each SL refresh cycle, check the cache before sending texts to the backend — only send uncached texts, then merge cached and fresh results before enrichment.

Deferred because the backend already caches by SHA-256 hash, so repeated calls skip the Claude API and are just a fast DB lookup. Add only if round-trip latency to the backend becomes noticeable.

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

## Issues

No current issues.