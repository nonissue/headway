# CLAUDE.md

This repository contains Headway, a Vite + React + Hono app that shows upcoming Edmonton LRT departures based on GTFS schedule data.

## Current Architecture

- `src/main.tsx`: App shell and analytics script injection.
- `src/hooks/useDeparturesApp.ts`: App controller hook for geolocation, fetches, refresh, loading, and error state.
- `src/server.ts`: Hono server, static asset serving, `/stats.js` proxy, and startup-time GTFS DB bootstrap.
- `src/api/departures.ts` and `src/api/stations.ts`: API route handlers that map server/domain data into shared response DTOs.
- `src/types/departures.ts`: Shared client/server API response shapes.
- `src/lib/stop-utils.ts` and `src/lib/time-utils.ts`: GTFS stop queries and time conversion logic.

## Commands

- `npm run dev`: Start the Hono server and Vite client.
- `npm run build`: Build the client and server.
- `npm run preview`: Build and run the compiled server locally.
- `npm run test`: Run Vitest.
- `npm run test:coverage`: Run Vitest with coverage.
- `npm run db:update`: Import GTFS data and rebuild the slim DB.
- `npm run db:import`: Import GTFS data into SQLite.
- `npm run db:slim`: Build the slim LRT-only SQLite database.

## Notes

- Deployment target is Fly.io.
- GTFS config is read from `app-config.json`.
- The server opens the GTFS SQLite DB once at startup and reuses it for requests.
- Geolocation falls back to `TEST_COORDS` from `src/config.ts` if the browser lookup fails.
- PWA support is managed by `vite-plugin-pwa`; do not add a second manual service worker.
- Historical notes were condensed after the hook/API refactor so this file stays aligned with the current code.
