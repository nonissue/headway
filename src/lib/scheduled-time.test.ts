import { describe, expect, it } from 'vitest';
import { scheduledDepartureTime } from './scheduled-time';

describe('scheduledDepartureTime', () => {
    it('uses agency time, independent of the computer timezone', () => {
        expect(scheduledDepartureTime(20260919, '21:45:00')).toBe(
            '2026-09-20T03:45:00.000Z'
        );
        expect(scheduledDepartureTime(20260119, '21:45:00')).toBe(
            '2026-01-20T04:45:00.000Z'
        );
    });
    it('keeps after-midnight trips on their GTFS service date', () => {
        expect(scheduledDepartureTime(20260919, '25:10:00')).toBe(
            '2026-09-20T07:10:00.000Z'
        );
    });
    it('uses the GTFS noon-minus-twelve-hours anchor on DST change days', () => {
        expect(scheduledDepartureTime(20260308, '03:30:00')).toBe(
            '2026-03-08T09:30:00.000Z'
        );
        expect(scheduledDepartureTime(20261101, '03:30:00')).toBe(
            '2026-11-01T10:30:00.000Z'
        );
        expect(scheduledDepartureTime(20260919, '12:00:00', 'UTC')).toBe(
            '2026-09-19T12:00:00.000Z'
        );
    });
});
