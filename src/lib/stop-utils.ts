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

function normalizeStopLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/\bstation\b/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

interface StopContext {
    platformStop?: Stop;
    parentStation?: Stop;
    normalizedStationName: string | null;
}

function getStopContext(stopId: string): StopContext {
    const platformStop = getStops({ stop_id: stopId })[0];
    const parentStation =
        platformStop?.parent_station != null
            ? getStops({ stop_id: platformStop.parent_station })[0]
            : undefined;
    const rawName = parentStation?.stop_name ?? platformStop?.stop_name ?? null;

    return {
        platformStop,
        parentStation,
        normalizedStationName: rawName ? normalizeStopLabel(rawName) : null,
    };
}

function filterTerminatingTrips(
    stoptimes: StopDepartures[],
    normalizedStationName: string | null
): StopDepartures[] {
    if (!normalizedStationName) return stoptimes;

    return stoptimes.filter((departure) => {
        if (!departure.stop_headsign) return true;
        const normalizedHeadsign = normalizeStopLabel(departure.stop_headsign);
        return normalizedHeadsign !== normalizedStationName;
    });
}

/**
 * Retrieves all LRT stations from GTFS stops.
 * A "station" is a stop with `location_type=1`
 * If coordinates are provided, sorts by distance automatically via GTFS library.
 *
 * @returns Promise<Stop[]> - an array of LRT station objects.
 */
export async function getAllStations(
    coordinates?: GeoCoordinate
): Promise<Stop[]> {
    const query: StopQuery = { location_type: 1 };

    // If coordinates provided, add them to query for distance-based sorting
    if (coordinates?.lat != null && coordinates?.lon != null) {
        query.stop_lat = coordinates.lat;
        query.stop_lon = coordinates.lon;
    }

    const stations = await getStops(query, [], [], {
        bounding_box_side_m: 999999999,
    });

    // Only sort alphabetically if no coordinates provided (GTFS handles distance sorting)
    if (coordinates?.lat == null || coordinates?.lon == null) {
        return stations.sort((a, b) =>
            (a.stop_name || '').localeCompare(b.stop_name || '')
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
            stop_lat: lat,
            stop_lon: lon,
        },
        [],
        [],
        { bounding_box_side_m: 999999999 }
    );

    return nearbyStations[0];
}

export function getStopsForParentStation(parentStationId: string): Stop[] {
    const platforms = getStops({
        parent_station: parentStationId,
    });

    return [...platforms];
}

export interface StopDepartures {
    stop_id: string;
    trip_id: string;
    stop_headsign: string | null | undefined;
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

export interface PlatformDepartures {
    stop: Stop;
    departures: StopDepartures[];
}

export interface StationDeparturesResult {
    station: Stop;
    platforms: PlatformDepartures[];
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

    if (!id) throw new Error('getDeparturesForStop: stopId is required');

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
                2
            )
        );
    }

    const stoptimes = getStoptimes(
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
        [['departure_time', 'ASC']]
    ) as StopDepartures[];

    const { normalizedStationName } = getStopContext(id);
    const departures = filterTerminatingTrips(stoptimes, normalizedStationName);

    // Defensive: ensure sorted (feeds occasionally return identical timestamps)
    departures.sort((a, b) => {
        if (a.departure_timestamp != null && b.departure_timestamp != null) {
            return a.departure_timestamp - b.departure_timestamp;
        }
        return a.departure_time.localeCompare(b.departure_time);
    });

    return departures.slice(0, Math.max(1, limit));
}

export async function getDeparturesForStation(
    stationOrId: Stop | string | number
): Promise<StationDeparturesResult> {
    const station =
        typeof stationOrId === 'object'
            ? stationOrId
            : getStops({ stop_id: String(stationOrId).trim() })[0];

    if (!station) {
        throw new Error('getDeparturesForStation: station not found');
    }

    const childStops = getStopsForParentStation(station.stop_id);
    const platforms = await Promise.all(
        childStops.map(async (stop) => ({
            stop,
            departures: await getDeparturesForStop({ stopId: stop.stop_id }),
        }))
    );

    return {
        station,
        platforms,
    };
}
