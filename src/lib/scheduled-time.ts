import { DEFAULT_TIMEZONE } from '../config.js';

/** GTFS times are elapsed from local noon minus 12 hours on the service date.
 * https://gtfs.org/documentation/schedule/reference/#field-types
 * Using the agency timezone also handles 24+ hour trips and DST service days.
 */
export function scheduledDepartureTime(
    serviceDate: number,
    serviceTime: string,
    timeZone = DEFAULT_TIMEZONE
): string {
    const date = String(serviceDate);
    const [hours, minutes, seconds] = serviceTime.split(':').map(Number);
    const noonUtc = Date.UTC(
        +date.slice(0, 4),
        +date.slice(4, 6) - 1,
        +date.slice(6, 8),
        12
    );
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        timeZoneName: 'longOffset',
    });
    const offsetAt = (instant: number) => {
        const name =
            formatter
                .formatToParts(instant)
                .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
        const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
        return match
            ? (match[1] === '+' ? 1 : -1) * (+match[2] * 60 + +match[3]) * 60000
            : 0;
    };
    const estimatedNoon = noonUtc - offsetAt(noonUtc);
    const localNoon = noonUtc - offsetAt(estimatedNoon);
    return new Date(
        localNoon + (hours * 3600 + minutes * 60 + seconds - 43200) * 1000
    ).toISOString();
}

/** Display the same instant used by countdowns, including repeated DST hours. */
export function departureClockTime(
    departure: { scheduled_at?: string; departure_time: string },
    timeZone = DEFAULT_TIMEZONE
): string {
    const instant = Date.parse(departure.scheduled_at ?? '');
    if (Number.isFinite(instant)) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).format(instant);
    }
    // Legacy responses without an absolute timestamp cannot resolve DST folds.
    const [hours, minutes, seconds] = departure.departure_time.split(':');
    return `${String(Number(hours) % 24).padStart(2, '0')}:${minutes}:${seconds}`;
}
