# SL Dashboard

A personal real-time dashboard for Stockholm public transit (SL — Storstockholms Lokaltrafik), built as a fully static React app hosted on GitHub Pages.

## Features

- **Departures** — Live departures for your selected bus stop, auto-refreshing every 60 seconds with animated row removal
- **Deviations** — Service disruption status for monitored commuter train, metro, and bus lines; click an orange icon to read the details
- **Route planner** — On-demand trip planner from your current location to your home stop, using browser geolocation

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [Axios](https://axios-http.com/) (HTTP client)
- SL public integration APIs via [Trafiklab](https://www.trafiklab.se/api/our-apis/sl/) — no API key required

## Getting started

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build    # Type-check + production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Deployment

The app is deployed automatically to GitHub Pages via GitHub Actions on every push to `main`. It is a fully static site — all SL API calls are made directly from the browser with no backend.

## Configuration

On first load the app prompts you to select a home stop. The selected stop and its name are persisted to `localStorage`. Other users can pick their own stop from the settings.

The deviation pane monitors a fixed set of lines (commuter trains 43/44, bus 117, metro 17/18/19). These are hardcoded in `src/communication/constant.ts`.