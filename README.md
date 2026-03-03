# headway

(formerly next-departures)

- Shows upcoming departure times based on ETS GTFS Schedule data for geographically closest LRT station.
- View the app online at:
    - **Primary URL**: [headway.andy.ws](https://headway.andy.ws)
    - **Fly.io URL**: [next-departures.fly.dev](https://next-departures.fly.dev)
- Best mobile experience is on iPhone when installed from Safari as a standalone PWA via **Share -> Add to Home Screen**.
- Relies heavily on `node-gtfs` to parse and import GTFS CSV data into an sqlite database.
- Analytics powered by [Umami](https://umami.is) (free cloud plan)

## Note to self (as of 25-10-10)

```bash
# npm run db:update performs the following:
# npx gtfs-import --configPath ./import-config.json
# sqlite3 db/gtfs.db < scripts/build_lrt_only_db.sql
npm run db:update

# npm run deploy
#   ↳ npm run build && fly deploy
# `npm run build` consists of:
#   ↳ npm run build:client
#   ↳ npm run build:server
npm run deploy
```

Other useful package.json scripts:

**Build and serve the build locally for evaluting:**

```bash
npm run preview
```

## Warning: GTFS data not updated automatically

**The GTFS Schedule data will have to be manually updated periodically** — once a week should suffice.

I have not automated this process yet.

See "How to build and deploy" for instructions on how this is accomplished.

## How to get started with development

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:update` _(note: this can take a minute or two)_
3. Run `npm run dev`

## How to build and deploy

**Important**: For fast deployment, build locally first rather than letting Fly.io build remotely.

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:update` _(note: this can take a minute or two)_
    - fetches gtfs data and imports it into `db/gtfs.db`
    - creates new slim database from `db/gtfs.db` at `data/gtfs_lrt_only.db`
3. Run `npm run build` _(builds the client and server locally)_
4. Run `fly deploy` _(uses pre-built artifacts, much faster than remote build)_

### Quick Deploy Command

```bash
npm run deploy
```

This runs `npm run build && fly deploy` - builds everything locally then deploys.

## Project Initialization Commands

### Project DB Setup

See also `package.json` script `npm run db:update` described below.

```bash
# imports gtfs data into sqlite db './db/gtfs.db'
# you can also run:
# npm run db:import
npx gtfs-import --configPath import-config.json

# creates a slim version of our `./db/gtfs.db` at `./db/gtfs_lrt_only.db`
# you can also run:
# npm run db:slim
sqlite3 db/gtfs.db < scripts/build_lrt_only_db.sql
```

### Deployment

```bash
# Builds and deploys our app to fly.io so it is live
# https://headway.andy.ws (primary)
# https://next-departures.fly.dev (fly.io)
fly deploy
```

**Custom Domain Setup:**
The app is accessible via both:

- `headway.andy.ws` - Custom domain with SSL certificate managed by Fly.io
- `next-departures.fly.dev` - Original Fly.io domain

DNS is configured with CNAME records pointing to Fly.io infrastructure. SSL certificates auto-renew via Let's Encrypt.

**Analytics:**
Privacy-friendly analytics powered by Umami (free cloud plan). The app injects the analytics script client-side and proxies it through `/stats.js`.

### Package.json scripts

```bash
# 1. Fetches latest ETS transit data
# 2. Parses it into SQLite database initial Sqlite DB
# 3. Runs sql script to create our "slim" DB which is what our app uses
# and is what we deploy to production
npm run db:update

# Starts the Hono API server and Vite client together
npm run dev

# Builds front end and API
npm run build

# Builds the project and runs the compiled server
npm run preview
```

## UI Notes

- The About surface uses a bottom drawer on smaller viewports and a dialog on larger screens.
- Safari/iOS shell styling is expected to follow the app's CSS theme tokens and page backgrounds; avoid reintroducing separate runtime browser-chrome color hacks unless there is a concrete regression.

### Firefox spoof Geolocation for testing

`about:config` -> `geo.provider.testing` -> `true`
`about:config` -> `geo.provider.network.url` -> `data:application/json,{"location": {"lat": 53.50584, "lng": -113.52845}, "accuracy": 27000.0}`
`about:config` -> `geo.wifi.uri` -> `data:application/json,{"location": {"lat": 53.50584, "lng": -113.52845}, "accuracy": 27000.0}`

https://security.stackexchange.com/questions/147166/how-can-you-fake-geolocation-in-firefox
