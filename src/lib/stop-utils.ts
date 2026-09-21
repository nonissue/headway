import { scheduledDepartureTime } from './scheduled-time.js';
import { addDays, resolveYmd, ymdToNumber } from './time-helpers.js';
import type { Stop } from 'gtfs';
import type { GeoCoordinate } from '../types/global.js';
import type { StopQuery } from '../types/gtfs.js';
import { getStops, getStoptimes, getRoutes, getTrips } from 'gtfs';
import {
    DEFAULT_LOOK_AHEAD_IN_MINS,
    DEFAULT_STOP_COUNT_LIMIT,
    DEFAULT_TIMEZONE,
    RECENT_DEPARTURE_MINS,
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
        .replace(/\b(station|stop)\b/g, '')
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

/** Route membership comes from the feed, including shared underground stations. */
export function getStationLines(stationId: string): string[] {
    const platforms = getStops({ parent_station: stationId });
    const stopIds = [stationId, ...platforms.map((stop) => stop.stop_id)];
    return [
        ...new Set(
            getRoutes({ stop_id: stopIds }).map(
                (route) =>
                    route.route_short_name ||
                    route.route_long_name ||
                    route.route_id
            )
        ),
    ].sort();
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
    scheduled_at?: string;
    line?: string;
}

export interface GetDeparturesForStopOptions {
    stopId: string | number;
    baseTime?: Date; // Absolute instant; defaults to now.
    lookbackMins?: number;
    lookaheadMins?: number;
    limit?: number;
    tz?: string;
    debug?: boolean;
}

export interface PlatformDepartures {
    stop: Stop;
    departures: StopDepartures[];
}

export interface StationDeparturesResult {
    nextServiceAt?: string;
    station: Stop;
    platforms: PlatformDepartures[];
}

/** Convert a GTFS duration to seconds without wrapping it at midnight. */
function serviceSeconds(time: string | null | undefined): number | undefined {
    const match = time && /^(\d+):([0-5]\d):([0-5]\d)$/.exec(time);
    return match
        ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
        : undefined;
}

/**
 * Query every service date whose trips can overlap an absolute time window.
 * GTFS's start_time query filters ARRIVAL, so deliberately do not use it here.
 * Date filtering still goes through GTFS, including calendar_dates exceptions.
 */
function departuresInWindow(
    id: string,
    start: number,
    end: number,
    tz: string
): StopDepartures[] {
    const times = getStoptimes({ stop_id: id }, ['departure_time']);
    const maxSeconds = times.reduce(
        (max, row) => Math.max(max, serviceSeconds(row.departure_time) ?? 0),
        0
    );
    // Derive the overlap from the feed, including trips longer than 48 hours.
    // The extra calendar day accommodates the DST shift in the noon anchor.
    let date = addDays(
        resolveYmd(new Date(start), tz),
        -Math.ceil(maxSeconds / 86400) - 1
    );
    const lastDate = ymdToNumber(addDays(resolveYmd(new Date(end), tz), 1));
    const result: StopDepartures[] = [];
    for (; ymdToNumber(date) <= lastDate; date = addDays(date, 1)) {
        const serviceDate = ymdToNumber(date);
        const anchor = Date.parse(
            scheduledDepartureTime(serviceDate, '00:00:00', tz)
        );
        if (anchor > end || anchor + maxSeconds * 1000 < start) continue;
        const rows = getStoptimes({ stop_id: id, date: serviceDate }, [
            'stop_id',
            'trip_id',
            'stop_headsign',
            'departure_time',
            'departure_timestamp',
        ]);
        for (const row of rows) {
            const seconds = serviceSeconds(row.departure_time);
            if (seconds === undefined) continue; // GTFS permits untimed intermediate stops.
            const instant = anchor + seconds * 1000;
            if (instant < start || instant > end) continue;
            result.push({
                ...row,
                scheduled_at: new Date(instant).toISOString(),
            } as StopDepartures);
        }
    }
    return result;
}

/** Returns departures in an elapsed-time window, merging overlapping service dates. */
export async function getDeparturesForStop({
    stopId,
    baseTime = new Date(),
    lookbackMins = 0,
    lookaheadMins = DEFAULT_LOOK_AHEAD_IN_MINS,
    limit = DEFAULT_STOP_COUNT_LIMIT,
    tz = DEFAULT_TIMEZONE,
    debug = false,
}: GetDeparturesForStopOptions): Promise<StopDepartures[]> {
    const id = String(stopId).trim();
    if (!id) throw new Error('getDeparturesForStop: stopId is required');
    const start = baseTime.getTime() - lookbackMins * 60000;
    const end = baseTime.getTime() + lookaheadMins * 60000;
    if (debug) console.warn(JSON.stringify({ stopId: id, start, end, tz }));
    const stoptimes = departuresInWindow(id, start, end, tz);

    const { normalizedStationName } = getStopContext(id);
    const departures = filterTerminatingTrips(stoptimes, normalizedStationName);

    // Absolute times keep recent trips ordered correctly across service dates.
    departures.sort(
        (a, b) => Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!)
    );

    const upcoming = departures.slice(0, Math.max(1, limit));
    if (!upcoming.length) return [];
    const trips = getTrips({
        trip_id: [...new Set(upcoming.map((departure) => departure.trip_id))],
    });
    const routes = new Map(
        getRoutes().map((route) => [
            route.route_id,
            route.route_short_name || route.route_long_name || route.route_id,
        ])
    );
    const tripLines = new Map(
        trips.map((trip) => [trip.trip_id, routes.get(trip.route_id)])
    );
    return upcoming.map((departure) => ({
        ...departure,
        line: tripLines.get(departure.trip_id),
    }));
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

    const now = new Date();
    const childStops = getStopsForParentStation(station.stop_id);
    const platforms = await Promise.all(
        childStops.map(async (stop) => ({
            stop,
            departures: await getDeparturesForStop({
                stopId: stop.stop_id,
                lookbackMins: RECENT_DEPARTURE_MINS,
                baseTime: now,
            }),
        }))
    );

    const hasUpcoming = platforms.some(({ departures }) =>
        departures.some(
            (departure) => Date.parse(departure.scheduled_at!) >= now.getTime()
        )
    );
    if (!hasUpcoming && childStops.length) {
        // Before the 05:00 cutover, the next service date is still today.
        const clockTime = convertServiceTimeToClockTime(
            getGtfsServiceTime({ baseTime: now })
        );
        const serviceDate = getServiceDate({
            calendarDate: now,
            targetTime: clockTime,
        });
        const nextDate = ymdToNumber(
            addDays(resolveYmd(serviceDate, DEFAULT_TIMEZONE), 1)
        );
        // Bound the fallback to the next service date, but do not skip a later
        // departure today merely because it lies outside the normal window.
        const nextServiceEnd = Date.parse(
            scheduledDepartureTime(
                nextDate,
                `${24 + SERVICE_DAY_START_HOUR}:00:00`
            )
        );
        const nextPlatforms = await Promise.all(
            childStops.map(async (stop) => ({
                stop,
                departures: await getDeparturesForStop({
                    stopId: stop.stop_id,
                    baseTime: now,
                    lookaheadMins: (nextServiceEnd - now.getTime()) / 60000,
                    // Apply the result limit only after finding the shared window.
                    limit: Number.MAX_SAFE_INTEGER,
                }),
            }))
        );
        const first = Math.min(
            ...nextPlatforms.flatMap(({ departures }) =>
                departures.map((departure) =>
                    Date.parse(departure.scheduled_at!)
                )
            )
        );
        if (Number.isFinite(first)) {
            const end = first + DEFAULT_LOOK_AHEAD_IN_MINS * 60000;
            return {
                station,
                nextServiceAt: new Date(first).toISOString(),
                platforms: nextPlatforms.map((platform, index) => ({
                    ...platform,
                    // Keep recent context even when the upcoming board moves
                    // to the next service window. Both arrays are chronological.
                    departures: [
                        ...platforms[index].departures,
                        ...platform.departures
                            .filter(
                                (departure) =>
                                    Date.parse(departure.scheduled_at!) <= end
                            )
                            .slice(0, DEFAULT_STOP_COUNT_LIMIT),
                    ],
                })),
            };
        }
    }

    return {
        station,
        platforms,
    };
}
