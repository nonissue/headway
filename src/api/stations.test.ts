import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/stop-utils.js', () => ({
    getAllStations: vi.fn(),
    getDeparturesForStation: vi.fn(),
}));

import { stations } from './stations.js';
import {
    getAllStations,
    getDeparturesForStation,
} from '../lib/stop-utils.js';

function createApp() {
    const app = new Hono();
    app.route('/api', stations);
    return app;
}

describe('stations routes', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-03T12:34:56.000Z'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns stations and forwards parsed coordinates', async () => {
        vi.mocked(getAllStations).mockResolvedValue([
            {
                stop_id: 'station-1',
                stop_name: 'Central Station',
                stop_lat: 53.5,
                stop_lon: -113.5,
            },
        ]);

        const response = await createApp().request(
            '/api/stations?lat=53.5&lon=-113.5'
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            stations: [
                {
                    stop_id: 'station-1',
                    stop_name: 'Central Station',
                    stop_lat: 53.5,
                    stop_lon: -113.5,
                },
            ],
            timestamp: '2026-03-03T12:34:56.000Z',
        });
        expect(getAllStations).toHaveBeenCalledWith({
            lat: 53.5,
            lon: -113.5,
        });
    });

    it('returns 400 when station coordinates are invalid', async () => {
        const response = await createApp().request(
            '/api/stations?lat=53.5&lon=bad'
        );

        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: 'Invalid latitude or longitude',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });

    it('returns 500 when station list lookup fails', async () => {
        vi.mocked(getAllStations).mockRejectedValue(new Error('boom'));

        const response = await createApp().request('/api/stations');

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: 'Failed to fetch stations',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });

    it('returns station departures with mapped platform data', async () => {
        vi.mocked(getDeparturesForStation).mockResolvedValue({
            station: {
                stop_id: 'station-2',
                stop_name: 'Health Sciences',
            },
            platforms: [
                {
                    stop: {
                        stop_id: 'station-2-platform',
                        stop_name: 'Platform A',
                    },
                    departures: [
                        {
                            stop_id: 'station-2-platform',
                            trip_id: 'trip-3',
                            stop_headsign: 'Mill Woods',
                            departure_time: '08:45:00',
                        },
                    ],
                },
            ],
        });

        const response = await createApp().request(
            '/api/stations/station-2/departures'
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            station: {
                stop_id: 'station-2',
                stop_name: 'Health Sciences',
                stop_lat: undefined,
                stop_lon: undefined,
            },
            platforms: [
                {
                    stop: {
                        stop_id: 'station-2-platform',
                        stop_name: 'Platform A',
                        stop_lat: undefined,
                        stop_lon: undefined,
                    },
                    departures: [
                        {
                            stop_id: 'station-2-platform',
                            trip_id: 'trip-3',
                            stop_headsign: 'Mill Woods',
                            departure_time: '08:45:00',
                            departure_timestamp: undefined,
                        },
                    ],
                },
            ],
            timestamp: '2026-03-03T12:34:56.000Z',
        });
        expect(getDeparturesForStation).toHaveBeenCalledWith('station-2');
    });

    it('returns 500 when station departures lookup fails', async () => {
        vi.mocked(getDeparturesForStation).mockRejectedValue(new Error('boom'));

        const response = await createApp().request(
            '/api/stations/station-2/departures'
        );

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({
            error: 'Failed to fetch departures for station',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });
});
