WITH lrt_routes AS (
  SELECT route_id
  FROM routes
  -- 0 = tram/light rail; 1 = subway/metro; 2 = rail (some agencies mislabel LRT)
  WHERE route_type IN (0,1,2)
     OR UPPER(COALESCE(route_desc,'')) LIKE '%LRT%'
     OR UPPER(COALESCE(route_long_name,'')) LIKE '%LRT%'
),
lrt_trips AS (
  SELECT trip_id
  FROM trips
  WHERE route_id IN (SELECT route_id FROM lrt_routes)
),
lrt_served_stops AS (
  SELECT DISTINCT st.stop_id
  FROM stop_times st
  WHERE st.trip_id IN (SELECT trip_id FROM lrt_trips)
),

/* Parents (stations) for those served stops */
lrt_parent_station_ids AS (
  SELECT DISTINCT
    COALESCE(s.parent_station, s.stop_id) AS station_id
  FROM stops s
  WHERE s.stop_id IN (SELECT stop_id FROM lrt_served_stops)
),

/* Keep only real stations (location_type=1) for parents */
lrt_stations AS (
  SELECT s.*
  FROM stops s
  WHERE s.stop_id IN (SELECT station_id FROM lrt_parent_station_ids)
    AND COALESCE(s.location_type, 1) = 1  -- treat NULL as station if your feed is sloppy
),

/* And the platform stops (children) under those stations */
lrt_platforms AS (
  SELECT s.*
  FROM stops s
  WHERE COALESCE(s.location_type, 0) = 0     -- 0 = stop/platform
    AND s.parent_station IN (SELECT stop_id FROM lrt_stations)
)

/* Final selection: stations + platforms only */
SELECT * FROM lrt_stations
UNION ALL
SELECT * FROM lrt_platforms
ORDER BY stop_name, location_type;
