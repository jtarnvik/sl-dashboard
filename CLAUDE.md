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
- `SettingsData` for the selected stop point (ID in 16-char SL format and name). For logged-in users this comes from the backend; for non-logged-in users it is persisted to localStorage via `use-local-storage-state`.
- Three React contexts: `ErrorContext` (global error string), `InDebugModeContext` (debug mode toggle), and `UserContext` (logged-in user, login/logout/updateSettings functions)

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
- `src/types/common-constants.ts` — `SETTINGS_KEY` for localStorage
- `src/types/backend.ts` — types for the backend API (`User`, `UserSettings`)

### Settings architecture

Settings (selected stop point) are stored in two places depending on login state:
- **Logged-in users**: stored in the backend database. `GET /api/auth/me` always returns a non-null `settings` object (backend defaults to Skogslöparvägen if none saved). Saved via `PUT /api/protected/settings`. After a successful save, `updateSettings(data)` patches the local `UserContext` state without a round trip.
- **Non-logged-in users**: stored in localStorage via `use-local-storage-state` with `SETTINGS_KEY`. Removing the key resets to the default stop.

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

### Component conventions

- All components use **named exports**, not default exports (`App.tsx` is the only exception).
- Each component lives in its own directory with an `index.tsx` entry point.

## Future plans

This project is a learning tool first — the focus is on experimenting with new technologies rather than quickly shipping features. Steps are intentionally small to aid understanding and AI collaboration skills.

I may default to Java-style patterns in TypeScript/React without realising it — feel free to point this out.

FE - means frontend
BE - means backend
ME - Stuff for me to do, remind me if this gets to number 1.

Implementation Steps

There are a few large blocks of implementation. Each block has its own letter and each step within that block has its own order by number.

A - FE/BE, Activate login for all users and set up a proper non-logged-in view and GDPR page.

A1 - DONE - FE, Show the login button in production.
Removed the `VITE_FEATURE_LOGIN` feature flag from both env files and the navbar. Login/logout button now always visible.

A2 - DONE - FE, Show a nav menu for all user types, and define the non-logged-in experience.
- All logged-in users get a nav menu. Admins see user admin pages; non-admins do not.
- When not logged in: hide all panes except departures.
- Below the departures pane, show a teaser panel — something like "Logga in för att se avvikelseinformation och övriga funktioner. Helt gratis."

A3 - DONE - FE, Add a GDPR info page.
- For logged-in users: accessible via a small link at the bottom of the nav menu.
- For non-logged-in users: a small, muted link in the bottom-right corner of the LoginTeaser card.
- Rendered as a page (not a modal), styled with headings. The update date and the final legal paragraph should be in a smaller, greyed-out font.
- GDPR text to use:

  **Om din data**
  *Senast uppdaterad: april 2026*

  Den här tjänsten är ett litet hobbyprojekt för pendlingsinformation i Stockholm. Vi tar din integritet på allvar och samlar bara in det vi faktiskt behöver.

  **Vad vi lagrar**
  Vi lagrar ditt namn och din e-postadress. Dessa hämtas från ditt Google-konto när du loggar in och används enbart för att identifiera dig i tjänsten.

  **Varför vi lagrar det**
  Vi lagrar dina uppgifter för att du ska kunna logga in och använda tjänsten. Uppgifterna delas inte med någon utomstående och används inte i marknadsföringssyfte.

  **Var lagras det**
  Tjänsten körs på Render med servrar i Frankfurt och din data lagras i Supabase med servrar i Irland — båda inom EU. Data krypteras i vila och lämnar aldrig EU.

  **Dina rättigheter**
  Enligt GDPR har du rätt att få din data raderad. Du kan när som helst ta bort all din data via menyn i appen. Om du har frågor om hur dina uppgifter hanteras är du välkommen att kontakta oss direkt.

  *Den rättsliga grunden för behandlingen av dina personuppgifter är fullgörande av avtal (GDPR artikel 6.1 b) — det vill säga att vi behöver uppgifterna för att kunna tillhandahålla tjänsten du registrerat dig för.*

A4 - FE/BE, Add "Ta bort mitt konto" for GDPR compliance.
- Available in the user nav menu (non-admins and admins alike). In the backend, make an extra validation on the delete user that the last admin user cant be removed.
- Show a confirmation dialog ("Är du säker?") before proceeding.
- On confirm: call a new backend endpoint that deletes the user from all tables, then logs the user out and redirects to the default view.
- Backend: new DELETE endpoint at `/api/protected/account` — removes the user's row from `allowed_user` (cascade handles settings and hidden deviations), invalidates the session.

B - FE, Connect the deviations pane to the backend AI interpretation API.
Backend is complete: deviations are interpreted by Claude AI, cached in DB,
and returned with an action (SHOWN/HIDDEN_ACCESSIBILITY/HIDDEN_BY_USER/UNKNOWN) and importance (LOW/MEDIUM/HIGH/UNKNOWN).

B1 - FE, to be fleshed out later
- How to handle slow api
- how to show all
- How to show action

C - FE/BE, Improve GUI for trips and deviations

C1, FE Better GUI for trips

D - FE/BE, More work, not broken down yet


E - FE/BE map support for trips and online maps for moving buses.

## Issues

No current issues.