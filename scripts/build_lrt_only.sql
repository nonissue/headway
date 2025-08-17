-- ========= settings for sqlite3 CLI output (safe to leave in) =========
.headers on
.mode column
.echo off
.bail on
.timer on

.print \n=== Creating LRT-only copy without modifying source ===
-- Ensure output directory exists before running (e.g., `mkdir -p db`)

-- 0) Attach a fresh target db and clear any old copies
ATTACH 'file:data/gtfs_lrt_only.db?mode=rwc' AS slim;

-- Drop target tables if they exist (re-runs safe)
DROP TABLE IF EXISTS slim.routes;
DROP TABLE IF EXISTS slim.trips;
DROP TABLE IF EXISTS slim.stop_times;
DROP TABLE IF EXISTS slim.stops;
DROP TABLE IF EXISTS slim.calendar;   
DROP TABLE IF EXISTS slim.calendar_dates;
DROP TABLE IF EXISTS slim.agency;
DROP TABLE IF EXISTS slim.feed_info;
DROP TABLE IF EXISTS slim.transfers;
DROP TABLE IF EXISTS slim.shapes;

-- 1) Build keep-sets in TEMP (lives in memory, fast)
.print --- Building keep sets (routes/trips/stops/services) ---
CREATE TEMP TABLE keep_routes AS
SELECT route_id, agency_id
FROM main.routes
WHERE route_type IN (0, 2, 109);  -- 0=Tram/Light Rail, 2=Rail, 109=Light Rail (extended)

CREATE TEMP TABLE keep_trips AS
SELECT trip_id, route_id, service_id, shape_id
FROM main.trips
WHERE route_id IN (SELECT route_id FROM keep_routes);

CREATE TEMP TABLE used_stops AS
SELECT DISTINCT st.stop_id
FROM main.stop_times st
WHERE st.trip_id IN (SELECT trip_id FROM keep_trips);

CREATE TEMP TABLE keep_stops AS
SELECT stop_id FROM used_stops
UNION
SELECT DISTINCT s.parent_station AS stop_id
FROM main.stops s
JOIN used_stops u ON u.stop_id = s.stop_id
WHERE s.parent_station IS NOT NULL;

CREATE TEMP TABLE keep_services AS
SELECT DISTINCT service_id FROM keep_trips;

-- Optional sets (only created if needed later)
CREATE TEMP TABLE keep_shapes AS
SELECT DISTINCT shape_id FROM keep_trips WHERE shape_id IS NOT NULL;

-- 2) Copy filtered tables into the target db
.print --- Copying filtered tables into slim db ---
CREATE TABLE slim.routes      AS SELECT * FROM main.routes
 WHERE route_id IN (SELECT route_id FROM keep_routes);

CREATE TABLE slim.trips       AS SELECT * FROM main.trips
 WHERE trip_id IN (SELECT trip_id FROM keep_trips);

CREATE TABLE slim.stop_times  AS SELECT * FROM main.stop_times
 WHERE trip_id IN (SELECT trip_id FROM keep_trips);

CREATE TABLE slim.stops       AS SELECT * FROM main.stops
 WHERE stop_id IN (SELECT stop_id FROM keep_stops);

CREATE TABLE slim.calendar_dates AS SELECT * FROM main.calendar_dates
 WHERE service_id IN (SELECT service_id FROM keep_services);

 -- --- NEW: ensure a calendar table exists in the slim DB ---
-- Create an empty GTFS-compatible schema (works even if source has no calendar)
CREATE TABLE slim.calendar (
  service_id TEXT,
  monday INTEGER, tuesday INTEGER, wednesday INTEGER,
  thursday INTEGER, friday INTEGER, saturday INTEGER, sunday INTEGER,
  start_date TEXT, end_date TEXT
);

-- Keep agency/feed_info (lightweight metadata; adjust if you want stricter)
CREATE TABLE slim.agency      AS SELECT * FROM main.agency;
CREATE TABLE slim.feed_info   AS SELECT * FROM main.feed_info;

-- Optional: transfers between kept stops only (uncomment if you want them)
-- CREATE TABLE slim.transfers AS
-- SELECT * FROM main.transfers
-- WHERE from_stop_id IN (SELECT stop_id FROM keep_stops)
--   AND to_stop_id   IN (SELECT stop_id FROM keep_stops);

-- Optional: shapes referenced by kept trips (uncomment if you use shapes)
-- CREATE TABLE slim.shapes AS
-- SELECT * FROM main.shapes
-- WHERE shape_id IN (SELECT shape_id FROM keep_shapes);

-- 3) Helpful indexes in the slim db
.print --- Creating indexes in slim db ---
CREATE INDEX IF NOT EXISTS slim.idx_stop_times_stop  ON stop_times(stop_id);
CREATE INDEX IF NOT EXISTS slim.idx_stop_times_trip  ON stop_times(trip_id);
CREATE INDEX IF NOT EXISTS slim.idx_trips_route      ON trips(route_id);
CREATE INDEX IF NOT EXISTS slim.idx_trips_service    ON trips(service_id);


-- 4) Progress & counts
.print \n--- Source vs Slim counts (rows) ---
SELECT 'routes' AS entity,
       (SELECT COUNT(*) FROM main.routes) AS source_rows,
       (SELECT COUNT(*) FROM slim.routes) AS slim_rows
UNION ALL
SELECT 'trips',
       (SELECT COUNT(*) FROM main.trips),
       (SELECT COUNT(*) FROM slim.trips)
UNION ALL
SELECT 'stop_times',
       (SELECT COUNT(*) FROM main.stop_times),
       (SELECT COUNT(*) FROM slim.stop_times)
UNION ALL
SELECT 'stops',
       (SELECT COUNT(*) FROM main.stops),
       (SELECT COUNT(*) FROM slim.stops)
UNION ALL
SELECT 'calendar_dates',
       COALESCE((SELECT COUNT(*) FROM main.calendar_dates),0),
       COALESCE((SELECT COUNT(*) FROM slim.calendar_dates),0);


.print \n--- Calendar table presence ---
SELECT 'main.calendar exists' AS metric,
       (SELECT COUNT(*) FROM main.sqlite_master WHERE type='table' AND name='calendar') AS value
UNION ALL
SELECT 'slim.calendar rows',
       (SELECT COUNT(*) FROM slim.calendar);

.print \n--- Orphan check in slim (should be 0) ---
SELECT COUNT(*) AS slim_orphan_stop_times
FROM slim.stop_times st
LEFT JOIN slim.stops s ON s.stop_id = st.stop_id
WHERE s.stop_id IS NULL;

-- 5) Compact the slim db only (does not touch source)
.print \n--- Vacuuming slim db ---
VACUUM slim;
ANALYZE slim;

.print \n=== Done. New file at data/gtfs_lrt_only.db?mode=rwc ===\n
