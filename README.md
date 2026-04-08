# SL Dashboard

A personal real-time dashboard for Stockholm public transit (SL — Storstockholms Lokaltrafik),
built as a static React app hosted on GitHub Pages. Used by the developer and a small group of friends.

## Live

- **Frontend:** https://jtarnvik.github.io/sl-dashboard/
- **Backend:** https://tarnvik.onrender.com

## What it does

- **Departures** — Live departures for your selected stop, auto-refreshing every 60 seconds
- **Deviations** — Service disruption status for a set of monitored commuter train, metro, and bus
  lines; AI-interpreted and colour-coded by severity
- **Route planner** — On-demand trip planner from your current location to your home stop, using
  browser geolocation; deviations on individual legs are highlighted inline
- **Shared routes** — Save and share a planned journey via a short link (requires login)
- **Settings** — Logged-in users can select their home stop; it is synced to the backend and
  remembered across devices

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build tool)
- [Tailwind CSS](https://tailwindcss.com/) (styling)
- [Axios](https://axios-http.com/) (HTTP client)
- SL public integration APIs via [Trafiklab](https://www.trafiklab.se/api/our-apis/sl/) — no API key required
- Companion backend for authentication, settings, and AI deviation interpretation

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

Deployed automatically to GitHub Pages via GitHub Actions on every push to `main`.
All SL API calls are made directly from the browser — no API key required.
