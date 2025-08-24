// npx tsx ./src/lib/db/build-lrt-only.ts --source ./db/gtfs.db --out ./data/gtfs_lrt_only.db --force

/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const CANONICAL_URL =
    process.env.LRT_CANONICAL_URL ??
    'https://data.edmonton.ca/resource/fhxi-cnhe.json';

type CanonicalStop = {
    lrt_stop_number?: string;
    lrt_stop_description?: string;
    latitude?: string | number;
    longitude?: string | number;
};

type CliArgs = {
    source: string; // path to original gtfs.db
    out: string; // path to new slim db, e.g. ./data/lrt_only.db
    url?: string; // optional override for canonical URL
};

function parseArgs(): CliArgs {
    const argv = process.argv.slice(2);
    const args: Record<string, string | boolean> = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith('--')) {
            const key = a.replace(/^--/, '');
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                args[key] = next;
                i++;
            } else {
                args[key] = true;
            }
        }
    }
    if (!args.source || !args.out) {
        console.error(
            'Usage: tsx scripts/build-lrt-only.ts --source ./db/gtfs.db --out ./data/lrt_only.db [--url <canonical_json_url>]'
        );
        process.exit(1);
    }
    return {
        source: String(args.source),
        out: String(args.out),
        url: args.url ? String(args.url) : undefined,
    };
}

async function fetchCanonicalStops(url: string): Promise<string[]> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Failed to fetch canonical stops: ${res.status} ${res.statusText}`
        );
    }
    const data = (await res.json()) as CanonicalStop[];
    const ids = new Set(
        data
            .map((r) => (r.lrt_stop_number ?? '').toString().trim())
            .filter((v) => v.length > 0)
    );
    if (ids.size === 0) {
        throw new Error('Canonical list contained zero stop numbers.');
    }
    return [...ids];
}

function tableExists(
    db: Database.Database,
    name: string,
    schema = 'main'
): boolean {
    const row = db
        .prepare(
            `SELECT name FROM ${schema}.sqlite_master WHERE type='table' AND name = ? LIMIT 1`
        )
        .get(name);
    return Boolean(row);
}

function columnExists(
    db: Database.Database,
    table: string,
    column: string,
    schema = 'main'
): boolean {
    const pragma = db
        .prepare(`PRAGMA ${schema}.table_info(${table})`)
        .all() as { name: string }[];
    return pragma.some((c) => c.name === column);
}

// Always create a brand-new empty output file before ATTACH
function ensureFreshOutput(outPath: string) {
    try {
        if (fs.existsSync(outPath)) fs.rmSync(outPath);
        const dir = path.dirname(outPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        // Create an empty file so ATTACH never complains
        fs.closeSync(fs.openSync(outPath, 'w'));
    } catch (e) {
        console.error(`Failed to prepare fresh output at ${outPath}:`, e);
        process.exit(1);
    }
}

async function main() {
    const { source, out, url } = parseArgs();
    ensureFreshOutput(out);

    const canonicalUrl = url ?? CANONICAL_URL;
    console.log(`Fetching canonical LRT stops from: ${canonicalUrl}`);
    const canonicalStopRefs = await fetchCanonicalStops(canonicalUrl);
    console.log(`Canonical LRT stop count: ${canonicalStopRefs.length}`);

    // Open source DB (read-only is fine; ATTACH target is a separate file)
    const db = new Database(source, { fileMustExist: true, readonly: false });
    db.pragma('journal_mode = WAL');

    // Attach the new slim DB file
    db.exec(`ATTACH DATABASE '${out.replaceAll("'", "''")}' AS slim;`);

    db.exec('BEGIN IMMEDIATE;');

    try {
        // Provenance / meta
        db.exec(`
      CREATE TABLE slim.__meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
        db.prepare(`INSERT INTO slim.__meta(key, value) VALUES (?, ?)`).run(
            'source_path',
            path.resolve(source)
        );
        db.prepare(`INSERT INTO slim.__meta(key, value) VALUES (?, ?)`).run(
            'generated_at',
            new Date().toISOString()
        );
        db.prepare(`INSERT INTO slim.__meta(key, value) VALUES (?, ?)`).run(
            'canonical_url',
            canonicalUrl
        );

        // Canonical refs in temp
        db.exec(`CREATE TEMP TABLE canonical_refs (ref TEXT PRIMARY KEY);`);
        const insertCanon = db.prepare(
            `INSERT OR IGNORE INTO canonical_refs(ref) VALUES (?)`
        );
        const insertMany = db.transaction((vals: string[]) => {
            for (const v of vals) insertCanon.run(v);
        });
        insertMany(canonicalStopRefs);

        if (!tableExists(db, 'stops'))
            throw new Error("Source DB missing 'stops' table.");
        if (!tableExists(db, 'stop_times'))
            throw new Error("Source DB missing 'stop_times' table.");
        if (!tableExists(db, 'trips'))
            throw new Error("Source DB missing 'trips' table.");

        const hasStopCode = columnExists(db, 'stops', 'stop_code');
        const hasParent = columnExists(db, 'stops', 'parent_station');

        // Match by stop_id OR stop_code
        db.exec(`
      CREATE TEMP TABLE matched_stops AS
      SELECT s.*
      FROM main.stops s
      WHERE s.stop_id IN (SELECT ref FROM canonical_refs)
         ${hasStopCode ? 'OR s.stop_code IN (SELECT ref FROM canonical_refs)' : ''}
    ;`);

        // Include parent stations if present
        if (hasParent) {
            db.exec(`
        CREATE TEMP TABLE parent_station_ids AS
        SELECT DISTINCT parent_station as stop_id
        FROM main.stops
        WHERE parent_station IS NOT NULL AND parent_station <> ''
          AND stop_id IN (SELECT stop_id FROM matched_stops)
      `);
            db.exec(`
        CREATE TABLE slim.stops AS
        SELECT * FROM main.stops
        WHERE stop_id IN (
          SELECT stop_id FROM matched_stops
          UNION
          SELECT stop_id FROM parent_station_ids
        );
      `);
        } else {
            db.exec(`CREATE TABLE slim.stops AS SELECT * FROM matched_stops;`);
        }

        // Trips that serve those stops
        db.exec(`
      CREATE TEMP TABLE trip_ids AS
      SELECT DISTINCT st.trip_id
      FROM main.stop_times st
      WHERE st.stop_id IN (SELECT stop_id FROM slim.stops)
    `);

        db.exec(`
      CREATE TABLE slim.trips AS
      SELECT * FROM main.trips WHERE trip_id IN (SELECT trip_id FROM trip_ids)
    `);

        // stop_times for those trips
        db.exec(`
      CREATE TABLE slim.stop_times AS
      SELECT st.*
      FROM main.stop_times st
      WHERE st.trip_id IN (SELECT trip_id FROM trip_ids)
    `);

        // routes used by those trips
        db.exec(
            `CREATE TEMP TABLE route_ids AS SELECT DISTINCT route_id FROM slim.trips;`
        );
        if (tableExists(db, 'routes')) {
            db.exec(`
        CREATE TABLE slim.routes AS
        SELECT * FROM main.routes
        WHERE route_id IN (SELECT route_id FROM route_ids)
      `);
        }

        // services (calendar & calendar_dates), if present
        const hasServiceId = columnExists(db, 'trips', 'service_id');
        if (hasServiceId) {
            db.exec(
                `CREATE TEMP TABLE service_ids AS SELECT DISTINCT service_id FROM slim.trips;`
            );

            if (tableExists(db, 'calendar')) {
                db.exec(`
          CREATE TABLE slim.calendar AS
          SELECT * FROM main.calendar
          WHERE service_id IN (SELECT service_id FROM service_ids)
        `);
            }
            if (tableExists(db, 'calendar_dates')) {
                db.exec(`
          CREATE TABLE slim.calendar_dates AS
          SELECT * FROM main.calendar_dates
          WHERE service_id IN (SELECT service_id FROM service_ids)
        `);
            }
        }

        // shapes used by those trips
        if (
            columnExists(db, 'trips', 'shape_id') &&
            tableExists(db, 'shapes')
        ) {
            db.exec(`
        CREATE TEMP TABLE shape_ids AS
        SELECT DISTINCT shape_id FROM slim.trips WHERE shape_id IS NOT NULL
      `);
            db.exec(`
        CREATE TABLE slim.shapes AS
        SELECT * FROM main.shapes
        WHERE shape_id IN (SELECT shape_id FROM shape_ids)
      `);
        }

        // small tables: copy whole
        if (tableExists(db, 'agency'))
            db.exec(`CREATE TABLE slim.agency AS SELECT * FROM main.agency;`);
        if (tableExists(db, 'feed_info'))
            db.exec(
                `CREATE TABLE slim.feed_info AS SELECT * FROM main.feed_info;`
            );
        if (tableExists(db, 'attributions'))
            db.exec(
                `CREATE TABLE slim.attributions AS SELECT * FROM main.attributions;`
            );

        // Indexes for perf
        db.exec(`
      CREATE INDEX IF NOT EXISTS slim.idx_stop_times_trip_seq ON stop_times (trip_id, stop_sequence);
      CREATE INDEX IF NOT EXISTS slim.idx_stop_times_stop     ON stop_times (stop_id);
      CREATE INDEX IF NOT EXISTS slim.idx_trips_route         ON trips (route_id);
      CREATE INDEX IF NOT EXISTS slim.idx_stops_stop_id       ON stops (stop_id);
    `);

        db.exec('COMMIT;');
        console.log(`✅ Created slim LRT-only DB at: ${out}`);
    } catch (err) {
        db.exec('ROLLBACK;');
        console.error('❌ Failed to create slim DB:', err);
        process.exit(1);
    } finally {
        db.close();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
