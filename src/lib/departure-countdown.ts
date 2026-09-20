import { RECENT_DEPARTURE_MINS } from '../config.js';
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

/** Keep one recent scheduled departure as context, never as a catchable train. */
export function getDepartureWindow<T extends Departure>(
    departures: T[],
    now: number,
    lineFilter = 'all'
): { upcoming: T[]; recent?: T } {
    const matching = departures.filter(
        (departure) => lineFilter === 'all' || departure.line === lineFilter
    );
    const upcoming = matching.filter(
        (departure) => (departureMinutes(departure, now) ?? 0) >= 0
    );
    const recent = matching.reduce<T | undefined>((latest, departure) => {
        const instant = Date.parse(departure.scheduled_at ?? '');
        const age = now - instant;
        if (!(age > 0 && age <= RECENT_DEPARTURE_MINS * 60000)) return latest;
        return !latest || instant > Date.parse(latest.scheduled_at!)
            ? departure
            : latest;
    }, undefined);
    return { upcoming, recent };
}
