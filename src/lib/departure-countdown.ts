import type { Departure } from '../types/departures.js';

export function departureMinutes(
    departure: Departure,
    now: number
): number | undefined {
    if (!departure.scheduled_at) return undefined;
    const instant = Date.parse(departure.scheduled_at);
    if (!Number.isFinite(instant)) return undefined;
    return instant < now ? -1 : Math.ceil((instant - now) / 60000);
}

/** Keep departures whose scheduled time has not passed, after line filtering. */
export function getUpcomingDepartures<T extends Departure>(
    departures: T[],
    now: number,
    lineFilter = 'all'
): T[] {
    return departures.filter(
        (departure) =>
            (lineFilter === 'all' || departure.line === lineFilter) &&
            (departureMinutes(departure, now) ?? 0) >= 0
    );
}
