import { describe, expect, it } from 'vitest';
import { departureMinutes, getUpcomingDepartures } from './departure-countdown';
import type { Departure } from '../types/departures';

const train: Departure = {
    stop_id: '1',
    trip_id: '1',
    stop_headsign: 'Clareview',
    departure_time: '24:01:00',
    scheduled_at: '2026-09-20T06:01:00Z',
};
describe('departureMinutes', () => {
    it('rounds up upcoming minutes across midnight', () => {
        expect(
            departureMinutes(train, Date.parse('2026-09-20T05:59:30Z'))
        ).toBe(2);
    });
    it('marks the exact departure due and removes it once past', () => {
        expect(departureMinutes(train, Date.parse(train.scheduled_at!))).toBe(
            0
        );
        expect(
            departureMinutes(train, Date.parse(train.scheduled_at!) + 1)
        ).toBe(-1);
    });
    it('does not invent a countdown from an ambiguous clock time', () => {
        expect(
            departureMinutes({ ...train, scheduled_at: undefined }, Date.now())
        ).toBeUndefined();
        expect(
            departureMinutes({ ...train, scheduled_at: 'invalid' }, Date.now())
        ).toBeUndefined();
    });
});

describe('getUpcomingDepartures', () => {
    const now = Date.parse(train.scheduled_at!);
    const at = (offset: number, line = 'Capital'): Departure => ({
        ...train,
        line,
        trip_id: String(offset),
        scheduled_at: new Date(now + offset).toISOString(),
    });
    it('excludes all past departures and applies the line filter', () => {
        const capital = at(-120000);
        const metro = at(-60000, 'Metro');
        const next = at(300000);
        const nextMetro = at(360000, 'Metro');
        const departures = [capital, metro, at(-150000), next, nextMetro];
        expect(getUpcomingDepartures(departures, now)).toEqual([
            next,
            nextMetro,
        ]);
        expect(getUpcomingDepartures(departures, now, 'Capital')).toEqual([
            next,
        ]);
        expect(getUpcomingDepartures(departures, now, 'Metro')).toEqual([
            nextMetro,
        ]);
    });
    it('keeps an exact due time and removes it immediately once past', () => {
        expect(getUpcomingDepartures([train], now)).toEqual([train]);
        expect(getUpcomingDepartures([train], now + 1)).toEqual([]);
    });
    it('returns no departures when every scheduled time has passed', () => {
        expect(
            getUpcomingDepartures([at(-1), at(-60000), at(-180000)], now)
        ).toEqual([]);
    });
    it('preserves departures with unknown timestamps without guessing their age', () => {
        const invalid = [
            { ...train, scheduled_at: undefined },
            { ...train, scheduled_at: 'invalid' },
        ];
        expect(getUpcomingDepartures(invalid, now)).toEqual(invalid);
    });
});
