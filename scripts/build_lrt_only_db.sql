-- IMPROVED: Build LRT-only database with operational stop filtering
--
-- This script creates a slim LRT-only database while excluding:
-- 1. Operational stops (tail tracks, garages, maintenance facilities)
-- 2. Non-passenger infrastructure
--
-- Operational stops identified:
-- - Health Sciences Tail (20191, QHTT)
-- - Andrews Garage Platform (79171, 79172)

-- ========= settings for sqlite3 CLI output (safe to leave in) =========
.headers on
.mode column
.echo off
.bail on
.timer on

.print \n=== Creating LRT-only copy without modifying source (with operational stop filtering) ===
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
WHERE route_type IN (0, 2);  -- ETS LRT routes currently import as 0=Tram/Light Rail, 2=Rail

CREATE TEMP TABLE keep_trips AS
SELECT trip_id, route_id, service_id, shape_id
FROM main.trips
WHERE route_id IN (SELECT route_id FROM keep_routes);

-- NEW: Define operational stops to exclude (non-passenger infrastructure)
CREATE TEMP TABLE operational_stops AS
SELECT stop_id FROM main.stops WHERE
    stop_name LIKE '%Tail%' OR
    stop_name LIKE '%Track%' OR
    stop_name LIKE '%Garage%' OR
    stop_name LIKE '%Yard%' OR
    stop_name LIKE '%Depot%' OR
    stop_name LIKE '%Shop%' OR
    stop_name LIKE '%Maintenance%' OR
    -- Specific known operational stops
    stop_id IN ('20191', 'QHTT', '79171', '79172');

CREATE TEMP TABLE used_stops AS
SELECT DISTINCT st.stop_id
FROM main.stop_times st
WHERE st.trip_id IN (SELECT trip_id FROM keep_trips)
  -- NEW: Exclude operational stops
  AND st.stop_id NOT IN (SELECT stop_id FROM operational_stops);

CREATE TEMP TABLE keep_stops AS
SELECT stop_id FROM used_stops
UNION
SELECT DISTINCT s.parent_station AS stop_id
FROM main.stops s
JOIN used_stops u ON u.stop_id = s.stop_id
WHERE s.parent_station IS NOT NULL
  -- NEW: Exclude operational parent stations
  AND s.parent_station NOT IN (SELECT stop_id FROM operational_stops);

-- Optional sets (only created if needed later)
CREATE TEMP TABLE keep_shapes AS
SELECT DISTINCT shape_id FROM keep_trips WHERE shape_id IS NOT NULL;

-- NEW: Filter trips to exclude those that only serve operational stops
CREATE TEMP TABLE passenger_trips AS
SELECT DISTINCT kt.trip_id
FROM keep_trips kt
JOIN main.stop_times st ON kt.trip_id = st.trip_id
WHERE st.stop_id IN (SELECT stop_id FROM keep_stops);

CREATE TEMP TABLE keep_services AS
SELECT DISTINCT kt.service_id
FROM keep_trips kt
JOIN passenger_trips pt ON pt.trip_id = kt.trip_id;

-- 2) Copy filtered tables into the target db
.print --- Copying filtered tables into slim db ---
CREATE TABLE slim.routes      AS SELECT * FROM main.routes
 WHERE route_id IN (SELECT route_id FROM keep_routes);

-- NEW: Only keep trips that serve passenger stops
CREATE TABLE slim.trips       AS SELECT * FROM main.trips
 WHERE trip_id IN (SELECT trip_id FROM passenger_trips);

-- NEW: Only keep stop_times for passenger trips and passenger stops
CREATE TABLE slim.stop_times  AS SELECT * FROM main.stop_times
 WHERE trip_id IN (SELECT trip_id FROM passenger_trips)
   AND stop_id IN (SELECT stop_id FROM keep_stops);

CREATE TABLE slim.stops       AS SELECT * FROM main.stops
 WHERE stop_id IN (SELECT stop_id FROM keep_stops);

CREATE TABLE slim.calendar_dates AS SELECT * FROM main.calendar_dates
 WHERE service_id IN (SELECT service_id FROM keep_services);

-- Preserve recurring service rows if the feed ever starts using calendar.txt again.
CREATE TABLE slim.calendar AS SELECT * FROM main.calendar
 WHERE service_id IN (SELECT service_id FROM keep_services);

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

-- NEW: Show excluded operational stops
.print \n--- Excluded operational stops ---
SELECT 'operational_stops_excluded' AS metric,
       (SELECT COUNT(*) FROM operational_stops) AS value;

.print \n--- Operational stops that were excluded ---
SELECT s.stop_id, s.stop_name, s.location_type
FROM main.stops s
WHERE s.stop_id IN (SELECT stop_id FROM operational_stops)
ORDER BY s.stop_name;

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

.print \n=== Done. New file at data/gtfs_lrt_only.db with operational stops filtered ===\n
