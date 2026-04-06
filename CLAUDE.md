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

**`Main.tsx`** renders the main page (`/`). It derives `settingsData` from `user.settings` when logged in, or `DEFAULT_SETTINGS` otherwise. It also manages `settingsOpen` state, listens for the `openSettings` window event, and provides `InDebugModeContext` to the debug mode button and panes.

### Login states and visible content

| State | Navbar right | Panes shown |
|---|---|---|
| Loading | "Logga in" (disabled) | Departures only |
| Not logged in | "Logga in" (active) | Departures + LoginTeaser |
| Logged in | Hamburger menu | Departures + Routes + Deviations |

`LoginTeaser` (`src/components/pane/login-teaser/`) is a card shown below Departures when not logged in. It contains a teaser text and a link to the GDPR page.

### Navbar (`src/components/navbar/`)

`Navbar` is a fixed top bar. It shows the SL logo, the current page heading from `PageTitleContext`, and either a login button (not logged in) or `NavMenu` (logged in).

`NavMenu` (`src/components/navbar/nav-menu/`) is the hamburger dropdown for logged-in users:
- Admin-only items at top: "Väntande användare" (with badge for pending count), "Användare"
- "Mitt konto" — navigates to `/my-account`
- "Inställningar" — dispatches `openSettings` window event (handled by `Main.tsx`)
- "Logga ut"

The hamburger icon shows a red badge when there are pending access requests. The count is fetched on mount and on every menu open.

### Views and routes

| View | Route | Auth | Description |
|---|---|---|---|
| `Main` | `/` | Any | Main dashboard with panes |
| `MyAccount` | `/my-account` | Logged in | Delete account + GDPR link |
| `PendingUsers` | `/admin/pending` | Admin | Approve/reject access requests |
| `ExistingUsers` | `/admin/users` | Admin | List and delete allowed users |
| `Gdpr` | `/gdpr` | Any | GDPR info page |
| `Denied` | `/denied` | — | Shown when access is denied during OAuth2 |

All routes except `/denied` are rendered inside `Layout`, which wraps them with `Navbar` and an `ErrorBoundary`.

### Three main panes

| Component | What it does |
|-----------|-------------|
| `src/components/pane/departures/` | Polls SL departures API every 60s for the selected stop. Animates departing rows before removing them. Shows a legend modal and (in debug mode) raw JSON. |
| `src/components/pane/deviations/` | Fetches deviation messages for hardcoded lines: trains 43/44, bus 117, metro 17/18/19. Shows colored transport icons (orange = has deviations). |
| `src/components/pane/routes/` | On-demand route planner. Gets browser geolocation, then calls the SL journey planner API to find trips to the selected stop. User picks max walk time (15 or 60 min). |

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
- **`DeviationWrapper`** (`src/components/common/deviation-wrapper/`) wraps departure display text to show deviation indicators inline.
- **`useUserLoginState` / `useUser`** (`src/hook/use-user.ts`): Custom hooks for consuming `UserContext`. `useUserLoginState()` returns a `UserLoginState` enum (`Loading` | `NotLoggedIn` | `LoggedIn`) derived from the `user` value (`undefined` = loading, `null` = not logged in, `User` object = logged in). `useUser()` returns the full context including `login`, `logout`, and `updateSettings` actions. Prefer these hooks over calling `useContext(UserContext)` directly.

### Type files

- `src/types/sl-responses.ts` — types for the departures API (`Departure`, `Line`, `Journey`, `SlDeparturesResponse`)
- `src/types/sl-journeyplaner-responses.ts` — types for the journey planner API (`Journey` as trips, `Leg`, `Transportation`)
- `src/types/deviations.ts` — types for the deviations API
- `src/types/common.d.ts` — global ambient types (`SettingsData`)
- `src/types/backend.ts` — types for the backend API (`User`, `UserSettings`)

### Settings architecture

Settings (selected stop point) are only available to logged-in users:
- **Logged-in users**: stored in the backend database. `GET /api/auth/me` always returns a non-null `settings` object (backend defaults to Skogslöparvägen if none saved). Saved via `PUT /api/protected/settings`. After a successful save, `updateSettings(data)` patches the local `UserContext` state without a round trip.
- **Non-logged-in users**: always use `DEFAULT_SETTINGS`. The Settings modal is not rendered for non-logged-in users.

`DEFAULT_SETTINGS` and `URL_BACKEND_SETTINGS` are defined in `src/communication/constant.ts`. `saveSettings()` is in `src/communication/backend.ts`.

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
| `"openSettings"` | `NavMenu` (Inställningar menu item) | `Main` | Opens the settings modal |
| `"deviationHidden"` | `deviation-modal/index.tsx` (after successful hide) | `Departures`, `Deviations`, `Routes` panes | Removes the hidden deviation (by `detail.id`) from each pane's local state |

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
                      
Z - FE, Stable launch experience.

Z1 - FE, localStorage stop hint.
- Define a `STOP_HINT_KEY` constant in `constant.ts` for the localStorage key.
- Add `loadStopHint(): SettingsData | null` and `saveStopHint(settings: SettingsData): void` helpers in a new
  `src/util/stop-hint.ts` file. `saveStopHint` writes `stopPointId`, `stopPointName` and `useAiInterpretation` to
  localStorage. `loadStopHint` reads and parses them, returning null if absent or malformed.
- In `App.tsx`, write the hint in two places (before panes re-render, not inside a component):
  - When `checkLoginStatus` resolves with a logged-in user: save hint from `user.settings`.
  - When `updateSettings` is called: save hint from the new settings.

Z2 - FE, Use hint in departures pane.
- In `Main.tsx`, derive `settingsData` with the priority chain: backend settings (logged-in user) →
  `loadStopHint()` → `DEFAULT_SETTINGS`. This replaces the current fallback that goes straight to `DEFAULT_SETTINGS`
  for non-logged-in / loading states.
- No changes needed inside the `Departures`, `Routes`, or `Deviations` components themselves.

Z3 - FE, Navbar spinner during auth loading.
- In `Navbar` (or wherever the login button / `NavMenu` is rendered), show a small neutral spinner in place of
  the login button while `loginState === UserLoginState.Loading`.
- Once state is known, render the login button or `NavMenu` as normal — no layout shift.


A - Better info when deviations are fetched. Now the UI just looks silly.

B - FE, Same goes for login. Usually things just happen in the background, assume communication going with google, Add spinner.

C - FE/BE, Improve GUI for trips and deviations

C1 - FE, Better GUI for trips

D - FE/BE, More work, not broken down yet
D0 - Add a periodical check for new deviations to BE to speed up future use
D1 - FE Examine how deviations work for buses, Do I handle lines correctly?
D2 - FE how to handle long list of departures
D3 - FE, the installingar dlg is a bit awkward, type sundbyb, select search, click list, clisk spara.
D4 - FE, How to handle filter by routes and stops. Should this be moved to backend, especialy if w have some kind of schedule based be handling
D5 - FE, the deviation modal, make some kind of line between different deviations, the

E - Reset hidden

F - Bulletin board

G - Preload deviations

H - FE/BE, Map support for trips and online maps for moving buses.

## Future Enhancements

Ideas that are not currently needed but should be remembered if the need arises.

### Frontend cache for deviation interpretations
Cache backend interpretation results in a `Map<string, BackendInterpretationResult>` keyed by deviation text for the lifetime of the page session. On each SL refresh cycle, check the cache before sending texts to the backend — only send uncached texts, then merge cached and fresh results before enrichment.

Deferred because the backend already caches by SHA-256 hash, so repeated calls skip the Claude API and are just a fast DB lookup. Add only if round-trip latency to the backend becomes noticeable.

### Deviation context in AI prompt
Short departure-level deviation texts (e.g. "Inställd", "Försenad") are handled by the hardcoded map in A4.1.
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