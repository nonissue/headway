# headway

(formerly next-departures)

- Shows upcoming departure times based on ETS GTFS Schedule data for geographically closest LRT station.
- View the app online at [next-departures](https://next-departures.fly.dev)
- Relies heavily on `node-gtfs` to parse and import GTFS CSV data into an sqlite database.

## Note to self (as of 25-10-06)

```
npx gtfs-import --configPath ./import-config.json
npm run db:slim-filtered
npm run deploy
```

## Warning: GTFS data not updated automatically

**The GTFS Schedule data will have to be manually updated periodically** — once a week should suffice.

I have not automated this process yet.

See "How to build and deploy" for instructions on how this is accomplished.

## How to get started with development

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:import` _(note: this can take a minute or two)_
3. Run `npm run dev`

## How to build and deploy

**Important**: For fast deployment, build locally first rather than letting Fly.io build remotely.

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:update` _(note: this can take a minute or two)_
    - fetches gtfs data and imports it into `db/gtfs.db`
    - creates new slim database from `db/gtfs.db` at `data/gtfs_lrt_only.db`
3. Run `npm run build:all` _(builds locally for faster deployment)_
4. Run `fly deploy` _(uses pre-built artifacts, much faster than remote build)_

### Quick Deploy Command

```bash
npm run deploy
```

This runs `npm run build:all && fly deploy` - builds everything locally then deploys.

## Project Initialization Commands

### Project DB Setup

See also `package.json` script `npm run db:import` described below.

```bash
# imports gtfs data into sqlite db './db/gtfs.db'
npx gtfs-import --configPath import-config.json

# creates a slim version of our `./db/gtfs.db` at `./db/gtfs_lrt_only.db`
# *should* leave original alone...
npx tsx ./src/lib/db/build-lrt-only.ts --source ./db/gtfs.db --out ./data/gtfs_lrt_only.db --force
```

### Alternative Database Scripts

_run this as of 25-09-19_

For creating the slim database with **operational stop filtering** (recommended):

```bash
# Creates filtered slim database excluding operational/maintenance stops
# Outputs to ./data/gtfs_lrt_only.db
npm run db:slim-filtered
```

Or run the SQL script directly:

```bash
sqlite3 db/gtfs.db < scripts/build_lrt_only_filtered.sql
```

The original (unfiltered) SQL script is also available but not recommended for production:

```bash
# creates a slim version of our `./db/gtfs.db` at `./db/gtfs_lrt_only.db`
# *should* leave original alone...
sqlite3 -batch db/gtfs.db < scripts/build_lrt_only.sql
```

### Deployment

```bash
# Builds and deploys our app to fly.io so it is live
# https://next-departures.fly.dev
fly deploy
```

### Package.json scripts

```bash
# 1. Fetches latest ETS transit data
# 2. Parses it into SQLite database initial Sqlite DB
# 3. Runs sql script to create our "slim" DB which is what our app uses
# and is what we deploy to production
npm run db:update

# Starts our express api server & vite ui at the same time
npm run dev

# Builds front end and API
npm run build:all

# Builds are project and runs our static entrypoint with node
npm run preview
```

### Firefox spoof Geolocation for testing

`about:config` -> `geo.provider.testing` -> `true`
`about:config` -> `geo.provider.network.url` -> `data:application/json,{"location": {"lat": 53.50584, "lng": -113.52845}, "accuracy": 27000.0}`
`about:config` -> `geo.wifi.uri` -> `data:application/json,{"location": {"lat": 53.50584, "lng": -113.52845}, "accuracy": 27000.0}`

https://security.stackexchange.com/questions/147166/how-can-you-fake-geolocation-in-firefox
