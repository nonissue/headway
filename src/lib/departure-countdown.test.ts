import { describe, expect, it } from 'vitest';
import { departureMinutes } from './departure-countdown';
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
