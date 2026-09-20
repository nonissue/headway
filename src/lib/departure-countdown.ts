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
