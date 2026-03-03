import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/get-nearby-departures.js', () => ({
    getNearbyDepartures: vi.fn(),
}));

vi.mock('../lib/stop-utils.js', () => ({
    getDeparturesForStop: vi.fn(),
}));

import { departures } from './departures.js';
import { getNearbyDepartures } from '../lib/get-nearby-departures.js';
import { getDeparturesForStop } from '../lib/stop-utils.js';

function createApp() {
    const app = new Hono();
    app.route('/api', departures);
    return app;
}

describe('departures routes', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-03T12:34:56.000Z'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns nearby departures with shared DTO mapping', async () => {
        vi.mocked(getNearbyDepartures).mockResolvedValue({
            station: {
                stop_id: 'station-1',
                stop_name: 'Central Station',
                stop_lat: 53.5,
                stop_lon: -113.5,
            },
            platforms: [
                {
                    stop: {
                        stop_id: 'platform-1',
                        stop_name: 'Platform 1',
                    },
                    departures: [
                        {
                            stop_id: 'platform-1',
                            trip_id: 'trip-1',
                            stop_headsign: 'NAIT',
                            departure_time: '08:15:00',
                            departure_timestamp: 1,
                        },
                    ],
                },
            ],
        });

        const response = await createApp().request(
            '/api/departures/nearby?lat=53.5&lon=-113.5'
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            station: {
                stop_id: 'station-1',
                stop_name: 'Central Station',
                stop_lat: 53.5,
                stop_lon: -113.5,
            },
            platforms: [
                {
                    stop: {
                        stop_id: 'platform-1',
                        stop_name: 'Platform 1',
                        stop_lat: undefined,
                        stop_lon: undefined,
                    },
                    departures: [
                        {
                            stop_id: 'platform-1',
                            trip_id: 'trip-1',
                            stop_headsign: 'NAIT',
                            departure_time: '08:15:00',
                            departure_timestamp: 1,
                        },
                    ],
                },
            ],
            timestamp: '2026-03-03T12:34:56.000Z',
        });
        expect(getNearbyDepartures).toHaveBeenCalledWith({
            lat: 53.5,
            lon: -113.5,
        });
    });

    it('returns 400 when nearby coordinates are invalid', async () => {
        const response = await createApp().request(
            '/api/departures/nearby?lat=bad&lon=-113.5'
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'Invalid latitude or longitude',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });

    it('returns 500 when nearby departures lookup fails', async () => {
        vi.mocked(getNearbyDepartures).mockRejectedValue(new Error('boom'));

        const response = await createApp().request(
            '/api/departures/nearby?lat=53.5&lon=-113.5'
        );

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: 'Failed to fetch departures',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });

    it('returns stop departures with null headsign normalization', async () => {
        vi.mocked(getDeparturesForStop).mockResolvedValue([
            {
                stop_id: 'platform-2',
                trip_id: 'trip-2',
                stop_headsign: undefined,
                departure_time: '25:30:00',
            },
        ]);

        const response = await createApp().request(
            '/api/departures/platform-2'
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            stopId: 'platform-2',
            departures: [
                {
                    stop_id: 'platform-2',
                    trip_id: 'trip-2',
                    stop_headsign: null,
                    departure_time: '25:30:00',
                    departure_timestamp: undefined,
                },
            ],
            timestamp: '2026-03-03T12:34:56.000Z',
        });
        expect(getDeparturesForStop).toHaveBeenCalledWith({
            stopId: 'platform-2',
            clockTime: '08:00:00',
            lookaheadMins: 200,
            limit: 100,
        });
    });

    it('returns 500 when stop departures lookup fails', async () => {
        vi.mocked(getDeparturesForStop).mockRejectedValue(new Error('boom'));

        const response = await createApp().request(
            '/api/departures/platform-2'
        );

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: 'Failed to fetch departures for stop',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });
});
