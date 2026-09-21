import { describe, expect, it } from 'vitest';
import { departureMinutes, getDepartureWindow } from './departure-countdown';
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

describe('getDepartureWindow', () => {
    const now = Date.parse(train.scheduled_at!);
    const at = (offset: number, line = 'Capital'): Departure => ({
        ...train,
        line,
        trip_id: String(offset),
        scheduled_at: new Date(now + offset).toISOString(),
    });
    it('retains only the latest past departure, after applying the line filter', () => {
        const capital = at(-120000);
        const metro = at(-60000, 'Metro');
        const next = at(300000);
        const departures = [capital, metro, at(-150000), next];
        expect(getDepartureWindow(departures, now)).toEqual({
            recent: metro,
            upcoming: [next],
        });
        expect(getDepartureWindow(departures, now, 'Capital')).toEqual({
            recent: capital,
            upcoming: [next],
        });
    });
    it('keeps an exact due time upcoming, then moves it to recent', () => {
        expect(getDepartureWindow([train], now)).toEqual({
            recent: undefined,
            upcoming: [train],
        });
        expect(getDepartureWindow([train], now + 1)).toEqual({
            recent: train,
            upcoming: [],
        });
    });
    it('includes the ten-minute boundary and expires immediately after it', () => {
        expect(getDepartureWindow([train], now + 600000).recent).toBe(train);
        expect(
            getDepartureWindow([train], now + 600001).recent
        ).toBeUndefined();
    });
    it('never invents a recent departure from missing or invalid timestamps', () => {
        const invalid = [
            { ...train, scheduled_at: undefined },
            { ...train, scheduled_at: 'invalid' },
        ];
        expect(getDepartureWindow(invalid, now)).toEqual({
            recent: undefined,
            upcoming: invalid,
        });
    });
});
