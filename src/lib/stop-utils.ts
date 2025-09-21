import type { Stop } from 'gtfs';
import type { ClockTime, GeoCoordinate } from '../types/global.js';
import type { StopQuery } from '../types/gtfs.js';
import { getStops, getStoptimes } from 'gtfs';
import {
  DEFAULT_LOOK_AHEAD_IN_MINS,
  DEFAULT_STOP_COUNT_LIMIT,

  DEFAULT_TIMEZONE,
  SERVICE_DAY_START_HOUR,

} from '../config.js';
import {
  convertServiceTimeToClockTime,
  getGtfsServiceTime,
  getServiceDate,
} from '../lib/time-utils.js';

/**
 * Retrieves all LRT stations from GTFS stops.
 * A "station" is a stop with `location_type=1`
 * If coordinates are provided, sorts by distance automatically via GTFS library.
 *
 * @returns Promise<Stop[]> - an array of LRT station objects.
 */
export async function getAllStations(coordinates?: GeoCoordinate): Promise<Stop[]> {
  const query: StopQuery = { location_type: 1 };

  // If coordinates provided, add them to query for distance-based sorting
  if (coordinates?.lat && coordinates?.lon) {
    query.stop_lat = coordinates.lat;
    query.stop_lon = coordinates.lon;
  }

  const stations = await getStops(
    query,
    [],
    [],
    { bounding_box_side_m: 999999999 },
  );

  // Only sort alphabetically if no coordinates provided (GTFS handles distance sorting)
  if (!coordinates?.lat || !coordinates?.lon) {
    return stations.sort((a, b) =>
      (a.stop_name || '').localeCompare(b.stop_name || ''),
    );
  }

  return stations;
}

/**
 * Retrieves closest "station" from GTFS stops.
 * A "station" is a stop with `location_type=1`
 *
 * @returns Promise<Stop[]> - an array of stop objects representing transit stations.
 */
export async function getClosestStation({
  lat,
  lon,
}: GeoCoordinate = {}): Promise<Stop> {
  const nearbyStations = await getStops(
    {
      location_type: 1,
      // stop_lat: TEST_COORDS_SUPER_FAR.lat,
      // stop_lon: TEST_COORDS_SUPER_FAR.lon,
      stop_lat: lat,
      stop_lon: lon,
    },
    [],
    [],
    { bounding_box_side_m: 999999999 },
    // stop_lat: lat,
    // stop_lon: lon,
  );

  return nearbyStations[0];
}

export function getStopsForParentStation(parent_station_id: string): Stop[] {
  const platforms = getStops({
    parent_station: parent_station_id,
  });

  return [...platforms];
}

export interface StopDepartures {
  stop_id: string;
  trip_id: string;
  stop_headsign: string | null;
  departure_time: string; // GTFS service time, may be >= 24:00:00
  departure_timestamp?: number; // present in some imports
}

export interface GetDeparturesForStopOptions {
  stopId: string | number;
  clockTime?: ClockTime; // "HH:mm:ss" (0–23h)
  baseTime?: Date; // default: now
  calendarDate?: string | number | Date;
  lookaheadMins?: number; // default: DEFAULT_LOOK_AHEAD_IN_MINS
  limit?: number; // default: DEFAULT_STOP_COUNT_LIMIT
  tz?: string; // default: DEFAULT_TIMEZONE
  serviceDayStartHour?: number; // default: 3
  debug?: boolean;
}

/**
 * Returns upcoming departures for a stop within a time window.
 * Uses GTFS "service date" and "service time" (times may exceed 24:00:00).
 */
export async function getDeparturesForStop({
  stopId,
  clockTime,
  baseTime = new Date(),
  calendarDate,
  lookaheadMins = DEFAULT_LOOK_AHEAD_IN_MINS,
  limit = DEFAULT_STOP_COUNT_LIMIT,
  tz = DEFAULT_TIMEZONE,
  serviceDayStartHour = SERVICE_DAY_START_HOUR,
  debug = false,
}: GetDeparturesForStopOptions): Promise<StopDepartures[]> {
  const id = String(stopId).trim();

  if (!id)
    throw new Error('getDeparturesForStop: stopId is required');

  // --- Build service window from a single source of truth ---
  const startServiceTime = clockTime
    ? getGtfsServiceTime({ clockTime, tz, serviceDayStartHour })
    : getGtfsServiceTime({ baseTime, tz, serviceDayStartHour });

  const endServiceTime = clockTime
    ? getGtfsServiceTime({
        clockTime,
        tz,
        serviceDayStartHour,
        offsetMins: lookaheadMins,
      })
    : getGtfsServiceTime({
        baseTime,
        tz,
        serviceDayStartHour,
        offsetMins: lookaheadMins,
      });

  // Service date decision uses *clock* time (0–23h)
  const startClockTime = convertServiceTimeToClockTime(startServiceTime);
  const serviceDate = getServiceDate({
    calendarDate: calendarDate ?? (clockTime ? undefined : baseTime),
    targetTime: startClockTime,
    tz,
    serviceDayStartHour,
  });

  if (debug) {
    console.warn(
      JSON.stringify(
        {
          stopId: id,
          serviceDate,
          startServiceTime,
          endServiceTime,
          lookaheadMins,
          limit,
          tz,
          serviceDayStartHour,
        },
        null,
        2,
      ),
    );
  }

  const rows = getStoptimes(
    {
      stop_id: id,
      date: serviceDate, // e.g., 20250801 (number or "YYYYMMDD")
      start_time: startServiceTime, // "HH:mm:ss", may be >= 24h
      end_time: endServiceTime, // "HH:mm:ss", may be >= 24h
    },
    [
      'stop_id',
      'trip_id',
      'stop_headsign',
      'departure_time',
      'departure_timestamp',
    ],
    [['departure_time', 'ASC']],
  ) as StopDepartures[];

  // Filter out terminating trips where headsign matches the current station
  const filteredRows = rows.filter((row) => {
    const headsign = row.stop_headsign?.toLowerCase() || '';
    // Get the stop's parent station name to check if this is a terminating trip
    const stopInfo = getStops({ stop_id: id })[0];
    if (stopInfo?.parent_station) {
      const parentStation = getStops({
        stop_id: stopInfo.parent_station,
      })[0];
      const stationName = parentStation?.stop_name?.toLowerCase() || '';
      // Filter out trips where headsign contains the station name (terminating trips)
      if (stationName && headsign.includes(stationName.split(' ')[0])) {
        return false;
      }
    }
    return true;
  });

  // Defensive: ensure sorted (some feeds return same-second ties)
  filteredRows.sort((a, b) => {
    // Prefer numeric timestamp if present; fallback to string time
    if (a.departure_timestamp != null && b.departure_timestamp != null) {
      return a.departure_timestamp - b.departure_timestamp;
    }
    return a.departure_time.localeCompare(b.departure_time);
  });

  return filteredRows.slice(0, Math.max(1, limit));
}
