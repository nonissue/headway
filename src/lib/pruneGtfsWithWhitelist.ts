// scripts/pruneGtfsWithWhitelist.ts
//
// Usage:
//   npx tsx scripts/pruneGtfsWithWhitelist.ts --db ./data/gtfs.sqlite --radius 200
//
// What it does:
//   1) Fetch ETS canonical LRT station list (Socrata JSON).
//   2) Save into lrt_whitelist table.
//   3) Find nearest GTFS parent station for each whitelist row (within radius m).
//   4) Keep one platform per direction that’s served by LRT trips.
//   5) Prune GTFS tables to the LRT-only, station+platform subset.
//
// Notes:
//   - Assumes standard GTFS tables: routes, trips, stop_times, stops, calendar, calendar_dates.
//   - route_type=2 identifies LRT routes in Edmonton.
//   - Parent stops are taken from stops where location_type in (1,2) OR has children.
//   - If multiple GTFS parents are near a whitelist station, pick the closest.
//   - Platforms are stops with location_type=0 and parent_station = chosen parent.
//
// Requires Node 18+ (global fetch) and better-sqlite3.
//   npm i -D tsx
//   npm i better-sqlite3
//
// Then run:
//   npx tsx scripts/pruneGtfsWithWhitelist.ts --db ./data/gtfs.sqlite

import Database from 'better-sqlite3';

const DATA_URL = 'https://data.edmonton.ca/resource/fhxi-cnhe.json';

type Args = {
    dbPath: string;
    radius: number; // meters
};

function parseArgs(): Args {
    const a = process.argv.slice(2);
    let dbPath = './gtfs.sqlite';
    let radius = 200;
    for (let i = 0; i < a.length; i++) {
        const k = a[i];
        if (k === '--db' && a[i + 1]) dbPath = a[++i];
        else if (k === '--radius' && a[i + 1]) radius = Number(a[++i]);
    }
    return { dbPath, radius };
}

type WhitelistRow = {
    name: string;
    lat: number;
    lon: number;
    raw?: any;
};

type StopRow = {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
    location_type: number | null;
    parent_station: string | null;
};

type ParentCandidate = {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
};

function toNumber(x: any): number | null {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
}

function normName(s: string | null | undefined): string {
    return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function haversineMeters(
    aLat: number,
    aLon: number,
    bLat: number,
    bLon: number
): number {
    const R = 6371000; // m
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const la1 = toRad(aLat);
    const la2 = toRad(bLat);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchWhitelist(): Promise<WhitelistRow[]> {
    const res = await fetch(DATA_URL);

    console.log('FEtching');

    console.log(res);

    if (!res.ok)
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const data = (await res.json()) as any[];
    console.log(data);

    const rows: WhitelistRow[] = [];

    for (const r of data) {
        const name =
            r.lrt_stop_description ??
            r.stop ??
            r.station_stop ??
            r.name ??
            r['Station'] ??
            r['Stop'] ??
            null;
        // Socrata "location" often contains latitude/longitude
        const loc = r.location || r.location_1 || {};
        const lat = toNumber(loc.latitude ?? r.latitude ?? r.lat);
        const lon = toNumber(loc.longitude ?? r.longitude ?? r.lon);
        if (name && lat != null && lon != null) {
            rows.push({ name: String(name), lat, lon, raw: r });
        }
    }
    return rows;
}

function ensureWhitelistTables(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS lrt_whitelist (
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      raw_json TEXT,
      PRIMARY KEY (name, lat, lon)
    );
    CREATE INDEX IF NOT EXISTS idx_lrt_whitelist_name ON lrt_whitelist(name);
  `);
}

function upsertWhitelist(db: Database.Database, rows: WhitelistRow[]) {
    const up = db.prepare(`
    INSERT INTO lrt_whitelist (name, lat, lon, raw_json)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name, lat, lon) DO UPDATE SET raw_json=excluded.raw_json
  `);
    const tx = db.transaction((items: WhitelistRow[]) => {
        for (const r of items)
            up.run(r.name, r.lat, r.lon, JSON.stringify(r.raw ?? null));
    });
    tx(rows);
}

function loadStops(db: Database.Database): StopRow[] {
    const rows = db
        .prepare<[], StopRow>(
            `
      SELECT
        stop_id, stop_name,
        stop_lat, stop_lon,
        COALESCE(location_type, 0) AS location_type,
        parent_station
      FROM stops
    `
        )
        .all();
    return rows;
}

function pickParents(stops: StopRow[]): ParentCandidate[] {
    // Parent stations: explicit station/entrance or anything with children
    const hasChild = new Set<string>();
    for (const s of stops) {
        if (s.parent_station) hasChild.add(s.parent_station);
    }
    const parents: ParentCandidate[] = [];
    for (const s of stops) {
        const lt = s.location_type ?? 0;
        if (lt === 1 || lt === 2 || hasChild.has(s.stop_id)) {
            parents.push({
                stop_id: s.stop_id,
                stop_name: s.stop_name,
                stop_lat: s.stop_lat,
                stop_lon: s.stop_lon,
            });
        }
    }
    return parents;
}

function nearestParentForWhitelist(
    wl: WhitelistRow[],
    parents: ParentCandidate[],
    radiusMeters: number
): Map<string, ParentCandidate> {
    // Map by whitelist "name" (lowercased) to the closest parent within radius.
    const out = new Map<string, ParentCandidate>();
    for (const w of wl) {
        const key = normName(w.name);
        let best: ParentCandidate | null = null;
        let bestD = Infinity;
        for (const p of parents) {
            const d = haversineMeters(w.lat, w.lon, p.stop_lat, p.stop_lon);
            if (d < bestD) {
                bestD = d;
                best = p;
            }
        }
        if (best && bestD <= radiusMeters) {
            out.set(key, best);
        }
    }
    return out;
}

function getLrtTripsPerDirection(db: Database.Database) {
    // route_type=2 → LRT
    // We return a set of (trip_id → direction_id) and a set of route_id
    const lrtRoutes = db
        .prepare(`SELECT route_id FROM routes WHERE route_type = 2`)
        .all() as { route_id: string }[];
    const routeIds = new Set(lrtRoutes.map((r) => String(r.route_id)));

    const trips = db
        .prepare(
            `
      SELECT trip_id, route_id, COALESCE(direction_id, -1) as direction_id
      FROM trips
      WHERE route_id IN (SELECT route_id FROM routes WHERE route_type = 2)
    `
        )
        .all() as { trip_id: string; route_id: string; direction_id: number }[];

    const tripDir = new Map<string, number>();
    for (const t of trips) tripDir.set(String(t.trip_id), t.direction_id);

    return { routeIds, tripDir };
}

function choosePlatforms(
    db: Database.Database,
    parentsByName: Map<string, ParentCandidate>,
    stops: StopRow[],
    lrtTripsDir: Map<string, number>
) {
    // For each parent, find its child platforms that are actually used by LRT trips.
    // Then pick the single best platform per direction (by stop_times count).
    type Usage = { stop_id: string; direction_id: number; hits: number };
    const stopTimes = db
        .prepare(
            `
      SELECT trip_id, stop_id
      FROM stop_times
      WHERE trip_id IN (SELECT trip_id FROM trips WHERE route_id IN (SELECT route_id FROM routes WHERE route_type=2))
    `
        )
        .all() as { trip_id: string; stop_id: string }[];

    const stopById = new Map(stops.map((s) => [s.stop_id, s]));
    // Build per stop usage counts by direction
    const usageMap = new Map<string, Map<number, number>>(); // stop_id -> (direction_id -> hits)
    for (const st of stopTimes) {
        const dir = lrtTripsDir.get(String(st.trip_id));
        if (dir == null) continue;
        const srow = stopById.get(String(st.stop_id));
        if (!srow) continue;
        if ((srow.location_type ?? 0) !== 0) continue; // only platforms
        const perDir = usageMap.get(srow.stop_id) ?? new Map<number, number>();
        perDir.set(dir, (perDir.get(dir) ?? 0) + 1);
        usageMap.set(srow.stop_id, perDir);
    }

    // Parent lookup by id -> name-key (so we can keep only chosen parent candidates)
    const nameKeyByParentId = new Map<string, string>();
    for (const [nameKey, p] of parentsByName.entries()) {
        nameKeyByParentId.set(p.stop_id, nameKey);
    }

    // Group platforms by (parent, direction) → pick best by hits then by stop_id
    const byParentDir = new Map<string, Map<number, Usage>>();
    for (const [stop_id, perDir] of usageMap.entries()) {
        const s = stopById.get(stop_id)!;
        const parent = s.parent_station;
        if (!parent) continue;
        const nameKey = nameKeyByParentId.get(parent);
        if (!nameKey) continue; // parent not selected as canonical for any whitelist station

        for (const [dir, hits] of perDir.entries()) {
            const bucketKey = `${parent}`;
            const curMap =
                byParentDir.get(bucketKey) ?? new Map<number, Usage>();
            const current = curMap.get(dir);
            const cand: Usage = { stop_id, direction_id: dir, hits };
            if (!current) {
                curMap.set(dir, cand);
            } else {
                if (
                    cand.hits > current.hits ||
                    (cand.hits === current.hits &&
                        cand.stop_id < current.stop_id)
                ) {
                    curMap.set(dir, cand);
                }
            }
            byParentDir.set(bucketKey, curMap);
        }
    }

    // Result: sets of kept parent_ids and platform stop_ids
    const keptParents = new Set<string>();
    const keptPlatforms = new Set<string>();

    for (const p of parentsByName.values()) {
        keptParents.add(p.stop_id);
    }

    for (const [parent, dirMap] of byParentDir.entries()) {
        // keep the best platform per direction
        for (const u of dirMap.values()) {
            keptPlatforms.add(u.stop_id);
        }
    }

    return { keptParents, keptPlatforms };
}

function pruneGtfs(
    db: Database.Database,
    keptParents: Set<string>,
    keptPlatforms: Set<string>
) {
    const keptStops = new Set<string>([...keptParents, ...keptPlatforms]);

    const qMarks = (n: number) =>
        Array.from({ length: n }, () => '?').join(',');

    const runIn = (sql: string, ids: string[]) => {
        if (ids.length === 0) return;
        db.prepare(sql.replace('{{in}}', qMarks(ids.length))).run(...ids);
    };

    const keptStopsArr = [...keptStops];

    const tx = db.transaction(() => {
        // 1) Prune stop_times first (keeps referential integrity)
        // keep stop_times where stop_id in keptStops AND trip is LRT (route_type=2)
        runIn(
            `
      DELETE FROM stop_times
      WHERE stop_id NOT IN ({{in}})
      `,
            keptStopsArr
        );

        // 2) Prune trips: keep trips that are LRT and have at least one remaining stop_time
        db.exec(`
      DELETE FROM trips
      WHERE route_id NOT IN (SELECT route_id FROM routes WHERE route_type = 2)
         OR trip_id NOT IN (SELECT DISTINCT trip_id FROM stop_times)
    `);

        // 3) Prune routes: keep only routes with remaining trips (and type=2)
        db.exec(`
      DELETE FROM routes
      WHERE route_type <> 2
         OR route_id NOT IN (SELECT DISTINCT route_id FROM trips)
    `);

        // 4) Prune stops: keep only parents+platforms we chose
        runIn(
            `
      DELETE FROM stops
      WHERE stop_id NOT IN ({{in}})
      `,
            keptStopsArr
        );

        // 5) Optional: prune calendars to those referenced by remaining trips
        if (tableExists(db, 'calendar')) {
            db.exec(`
        DELETE FROM calendar
        WHERE service_id NOT IN (SELECT DISTINCT service_id FROM trips)
      `);
        }
        if (tableExists(db, 'calendar_dates')) {
            db.exec(`
        DELETE FROM calendar_dates
        WHERE service_id NOT IN (SELECT DISTINCT service_id FROM trips)
      `);
        }
        // (Shapes, frequencies, transfers, pathways, attributions, feed_info…) prune similarly if present.
        if (tableExists(db, 'shapes')) {
            db.exec(`
        DELETE FROM shapes
        WHERE shape_id NOT IN (SELECT DISTINCT shape_id FROM trips WHERE shape_id IS NOT NULL)
      `);
        }
    });

    tx();
}

function tableExists(db: Database.Database, name: string): boolean {
    const r = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(name) as { name?: string } | undefined;
    return !!r;
}

async function main() {
    const { dbPath, radius } = parseArgs();
    console.log(`Using DB: ${dbPath}`);
    console.log(`Whitelist radius: ${radius} m`);

    const whitelist = await fetchWhitelist();

    if (whitelist.length === 0) {
        throw new Error('No rows fetched from ETS whitelist endpoint.');
    }

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    ensureWhitelistTables(db);
    upsertWhitelist(db, whitelist);

    // Load GTFS stops & choose parent candidates
    const stops = loadStops(db);
    const parents = pickParents(stops);

    // Map whitelist stations → nearest GTFS parent (within radius)
    const byName = new Map<string, WhitelistRow[]>();
    for (const w of whitelist) {
        const key = normName(w.name);
        const arr = byName.get(key) ?? [];
        arr.push(w);
        byName.set(key, arr);
    }

    // Deduplicate perms: pick the "center" (median) if multiple whitelist points per name
    const wlCollapsed: WhitelistRow[] = [];
    for (const [nameKey, arr] of byName.entries()) {
        if (arr.length === 1) {
            wlCollapsed.push(arr[0]);
        } else {
            // simple centroid average (good enough here)
            const lat = arr.reduce((s, r) => s + r.lat, 0) / arr.length;
            const lon = arr.reduce((s, r) => s + r.lon, 0) / arr.length;
            wlCollapsed.push({ name: arr[0].name, lat, lon });
        }
    }

    const parentsByName = nearestParentForWhitelist(
        wlCollapsed,
        parents,
        radius
    );
    if (parentsByName.size === 0) {
        throw new Error(
            'No canonical parents matched within radius — consider increasing --radius.'
        );
    }

    // LRT trips by direction
    const { tripDir } = getLrtTripsPerDirection(db);

    // Choose platforms (one per direction) that are actually used by LRT trips
    const { keptParents, keptPlatforms } = choosePlatforms(
        db,
        parentsByName,
        stops,
        tripDir
    );

    console.log(
        `Keeping parents: ${keptParents.size}, platforms: ${keptPlatforms.size}`
    );

    // Prune the GTFS DB to just these
    pruneGtfs(db, keptParents, keptPlatforms);

    console.log('Prune complete ✅');

    db.exec('VACUUM;');
    db.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
