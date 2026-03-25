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

The app is hosted on GitHub Pages and built via GitHub Actions. It is a fully static site — there is no backend, and SL APIs are called directly from the browser. This is intentional and should be preserved unless there is a strong reason to introduce a backend.

## Architecture

This is a React 19 + TypeScript + Vite + Tailwind CSS dashboard for Stockholm public transit (SL — Storstockholms Lokaltrafik). The UI is in Swedish. It calls SL's public integration APIs directly from the browser — no backend, no API keys required.

### App structure (`src/`)

**`App.tsx`** is the root. It manages:
- `SettingsData` (persisted to localStorage via `use-local-storage-state`) containing the selected stop point ID (16-char SL format) and name
- Three React contexts: `ErrorContext` (global error string), `InDebugModeContext` (debug mode toggle), and `UserContext` (logged-in user, login/logout functions)

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
- **`useUserLoginState` / `useUser`** (`src/hook/use-user.ts`): Custom hooks for consuming `UserContext`. `useUserLoginState()` returns a `UserLoginState` enum (`Loading` | `NotLoggedIn` | `LoggedIn`) derived from the `user` value (`undefined` = loading, `null` = not logged in, `User` object = logged in). `useUser()` returns the full context including `login` and `logout` actions. Prefer these hooks over calling `useContext(UserContext)` directly.

### Type files

- `src/types/sl-responses.ts` — types for the departures API (`Departure`, `Line`, `Journey`, `SlDeparturesResponse`)
- `src/types/sl-journeyplaner-responses.ts` — types for the journey planner API (`Journey` as trips, `Leg`, `Transportation`)
- `src/types/deviations.ts` — types for the deviations API
- `src/types/common.d.ts` — global ambient types (`SettingsData`)
- `src/types/common-constants.ts` — `SETTINGS_KEY` for localStorage

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

### Component conventions

- All components use **named exports**, not default exports (`App.tsx` is the only exception).
- Each component lives in its own directory with an `index.tsx` entry point.

## File management

When a new file is created and the user has approved it, stage it in git with `git add <file>`.

## Code Style

- Prefer readability over brevity.
- Prefer maintainability over performance.
- Prefer simplicity over complexity.
- If statements and all other constrol flow constructs should use curly braces even if they are followed by just a single statement.
- I prefer the imports section sorted in the following order:
  - React
  - Third-party
  - Local
  - css files.

## Future plans

This front end react application (including its accompanion backend project), 
is to be considered a learning tool first (both for technologies and how to work with an AI helper), 
which means that the focus is not on
quickly shipping features but for me to experiment with and learn new technologies as we go.
This means that this plan is broken up into small steps, perhaps more steps than is
strictly neccessary, but which will help me understand both the proposed changes better and improve my 
AI cooperation skills.

Regarding the actual planned steps:
Where a preferred approach is given, use it unless there is a clearly better alternative — in that case, 
propose it before implementing. I may default to Java-style patterns without realizing it, so
this especially applies to TypeScript and React idioms. 

Implement only the current step unless told otherwise. Future steps may be read for context and direction, but 
treat them as provisional — they may change. If the current step requires an implementation decision that a future 
step would influence, use that step as guidance.
   
FE - means frontend
BE - means backend
ME - Stuff for me to do, remind me if this gets to number 1.

Implementation Steps

1. Discuss/Decide — Should rejected access request users be notified?

When an admin rejects an `AccessRequest`, the record is silently deleted. Decide:
- Should the user receive any notification (e.g. email, or a message shown on next visit)?
- If yes, what channel and what message?
- If no, is silently ignoring the right UX?
- Similarly, should accpted users be notified?

---

2. BE — Scheduled cleanup of stale pending login attempts.

**Context:** `PendingUser` records are created automatically when a user attempts to log in but is not in `AllowedUser` and has not submitted an `AccessRequest`. These records are informational (used for Pushover notifications) and should be periodically purged.

- Add a scheduled Spring job that deletes `PendingUser` rows where `lastLoginAttempt` is older than 7 days.
- The job should run once per day (e.g. at midnight).
- Use Spring's `@Scheduled` annotation. Ensure `@EnableScheduling` is active.
- Classes marked with `@Scheduled` should be treated as incoming requests and located in `port/incoming/scheduled`, on the same level as `port/incoming/rest`. Add this instruction to the backend CLAUDE.md.

---

3. Investigate/Discuss: When/If shall the Google login be changed from test mode.

---

4. BE — Should the API types be sorted into their own folder by type?

---

5. Design/Discuss — API authorization strategy.

We now have three different types of APIs:
- Completely open (e.g. `/ping`)
- Open to logged-in users (e.g. `/api/protected/**`)
- Open to logged-in users with a specific role (e.g. `/api/admin/**`)

Should the APIs be sorted by type into different URL namespaces enforced in `SecurityConfig`:
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.requestMatchers("/api/protected/**").hasRole("USER")
```
Or is per-method annotation better:
```java
@PreAuthorize("hasRole('ADMIN')")
```
Or a combination of both?

---

6. FE/BE — Logged-in users should have their settings stored in the database.

How transparent can this be made relative to the current localStorage-based approach?

7. FE/BE Design/Discuss: I now have two Claude files, one in FE and one in BE. These files have started to take on different roles.
One role is project descriprion and one is codestyle choices. Should I split this into three files
- One project description for backend,
- One project description for frontend,
- One codestyle choices file for frontend and backend. Can be used for future projects with ease.
Where should such a new file be placed? In its own gitrepo?

## Issues

No current issues.

## About me

I have been a programmer for more than 30 years, the last 20 of them programming i Java. I mostly work with 
microservices using spring boot. I have also some experiance with writing React web applications.
I have been creating web application for 7 years using React and Typescript for about 50% of my 
time at work. But I have probably approached the React/Typescript worlds from the Java/Spring boot
way of doing things so it is very possible I write web apps more in a java way. I dont mind pointers
when that is the case.

I work in a enterprice environment and this project is mostly for my personal use, including for a few friends. The front
end at work is quite restrictive and I want to play around with more new technologies, programing-for-fun if you will. 
This is also an attempt at learning to code with AI assistance. I am quite convinced that I could solve all issues on 
my own, but it would take some time and effort.