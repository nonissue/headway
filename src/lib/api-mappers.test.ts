import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createTimestamp,
    toDepartureDto,
    toPlatformDto,
    toStationDto,
} from './api-mappers.js';

describe('api mappers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-03T12:34:56.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('maps a stop into a station dto', () => {
        expect(
            toStationDto({
                stop_id: 'station-1',
                stop_name: 'Central Station',
                stop_lat: 53.5,
                stop_lon: -113.5,
            })
        ).toEqual({
            stop_id: 'station-1',
            stop_name: 'Central Station',
            stop_lat: 53.5,
            stop_lon: -113.5,
        });
    });

    it('falls back to stop id when stop name is missing', () => {
        expect(
            toStationDto({
                stop_id: 'station-2',
                stop_name: undefined,
                stop_lat: undefined,
                stop_lon: undefined,
            })
        ).toEqual({
            stop_id: 'station-2',
            stop_name: 'station-2',
            stop_lat: undefined,
            stop_lon: undefined,
        });
    });

    it('normalizes nullable departure headsigns', () => {
        expect(
            toDepartureDto({
                stop_id: 'platform-1',
                trip_id: 'trip-1',
                stop_headsign: undefined,
                departure_time: '25:05:00',
            })
        ).toEqual({
            stop_id: 'platform-1',
            trip_id: 'trip-1',
            stop_headsign: null,
            departure_time: '25:05:00',
            departure_timestamp: undefined,
        });
    });

    it('maps a platform and nested departures', () => {
        expect(
            toPlatformDto({
                stop: {
                    stop_id: 'platform-2',
                    stop_name: 'Platform 2',
                },
                departures: [
                    {
                        stop_id: 'platform-2',
                        trip_id: 'trip-2',
                        stop_headsign: 'NAIT',
                        departure_time: '08:00:00',
                        departure_timestamp: 123,
                    },
                ],
            })
        ).toEqual({
            stop: {
                stop_id: 'platform-2',
                stop_name: 'Platform 2',
                stop_lat: undefined,
                stop_lon: undefined,
            },
            departures: [
                {
                    stop_id: 'platform-2',
                    trip_id: 'trip-2',
                    stop_headsign: 'NAIT',
                    departure_time: '08:00:00',
                    departure_timestamp: 123,
                },
            ],
        });
    });

    it('creates timestamps from the current clock', () => {
        expect(createTimestamp()).toBe('2026-03-03T12:34:56.000Z');
    });
});
