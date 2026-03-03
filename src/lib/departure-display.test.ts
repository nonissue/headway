import { describe, expect, it } from 'vitest';
import type { ProcessedDeparture } from '../types/departures.js';
import {
    createDepartureGroups,
    getHeadsignColorClasses,
    getPlatformHeading,
    getUniqueDestinations,
} from './departure-display.js';

function createDeparture(
    displayHeadsign: string,
    displayTime: string
): ProcessedDeparture {
    return {
        stop_id: `${displayHeadsign}-${displayTime}`,
        trip_id: `${displayHeadsign}-${displayTime}`,
        stop_headsign: displayHeadsign,
        departure_time: '08:00:00',
        displayHeadsign,
        displayTime,
    };
}

describe('departure-display', () => {
    it('derives unique destinations in original order', () => {
        expect(
            getUniqueDestinations([
                createDeparture('NAIT', '2 min'),
                createDeparture('NAIT', '5 min'),
                createDeparture('Clareview', '7 min'),
            ])
        ).toEqual(['NAIT', 'Clareview']);
    });

    it('classifies platform headings from common destination groups', () => {
        expect(getPlatformHeading(['NAIT'])).toBe('Northbound');
        expect(getPlatformHeading(['Mill Woods'])).toBe('Southbound');
        expect(getPlatformHeading(['Airport Shuttle'])).toBe('Airport Shuttle');
        expect(getPlatformHeading([])).toBe('Platform');
    });

    it('creates view groups from processed departures', () => {
        expect(
            createDepartureGroups([
                [
                    createDeparture('Clareview', '2 min'),
                    createDeparture('NAIT', '5 min'),
                ],
                [],
            ])
        ).toEqual([
            {
                heading: 'Northbound',
                destinations: ['Clareview', 'NAIT'],
                departures: [
                    createDeparture('Clareview', '2 min'),
                    createDeparture('NAIT', '5 min'),
                ],
            },
        ]);
    });

    it('returns stable color classes for the same headsign', () => {
        expect(getHeadsignColorClasses('NAIT')).toEqual(
            getHeadsignColorClasses('NAIT')
        );
    });
});
