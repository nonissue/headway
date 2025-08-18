# next-departures

- Shows upcoming departure times based on ETS GTFS Schedule data for geographically closest LRT station.
- View the app online at [next-departures](https://next-departures.fly.dev)
- Relies heavily on `node-gtfs` to parse and import GTFS CSV data into an sqlite database.

## Warning: GTFS data not updated automatically

**The GTFS Schedule data will have to be manually updated periodically** — once a week should suffice.

I have not automated this process yet.

See "How to build and deploy" for instructions on how this is accomplished.

## How to get started with development

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:import` _(note: this can take a minute or two)_
3. Run `npm run dev`

## How to build and deploy

1. Fill out `import-config.json` and `app-config.json`
2. Run `npm run db:import` _(note: this can take a minute or two)_
3. Run `npm run build:all`
4. Run `fly deploy`

## Project Initialization Commands

### Project DB Setup

See also `package.json` script `npm run db:import` described below.

```bash
# imports gtfs data into sqlite db './db/gtfs.db'
npx gtfs-import --configPath import-config.json

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
npm run db:import

# Starts our express api server & vite ui at the same time
npm run dev

# Builds front end and API
npm run build:all

# Builds are project and runs our static entrypoint with node
npm run preview
```
