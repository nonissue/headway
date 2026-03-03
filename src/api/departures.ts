import { Hono } from 'hono';
import { getNearbyDepartures } from '../lib/get-nearby-departures.js';
import { getDeparturesForStop } from '../lib/stop-utils.js';
import {
    createTimestamp,
    toDepartureDto,
    toPlatformDto,
    toStationDto,
} from '../lib/api-mappers.js';
import type {
    ApiErrorResponse,
    DeparturesResponse,
    StopDeparturesResponse,
} from '../types/departures.js';

export const departures = new Hono().basePath('/departures');

/**
 * GET /api/departures/nearby?lat=…&lon=…
 */
departures.get('/nearby', async (c) => {
    try {
        const lat = parseFloat(c.req.query('lat') ?? '');
        const lon = parseFloat(c.req.query('lon') ?? '');

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            const response: ApiErrorResponse = {
                error: 'Invalid latitude or longitude',
                timestamp: createTimestamp(),
            };

            return c.json(response, 400);
        }

        const result = await getNearbyDepartures({ lat, lon });
        const response: DeparturesResponse = {
            station: toStationDto(result.station),
            platforms: result.platforms.map(toPlatformDto),
            timestamp: createTimestamp(),
        };

        return c.json(response);
    } catch (err) {
        console.error('Error in /api/departures:', err);

        const response: ApiErrorResponse = {
            error: 'Failed to fetch departures',
            timestamp: createTimestamp(),
        };

        return c.json(response, 500);
    }
});

/**
 * GET /api/departures/:stopId
 */
departures.get('/:stopId', async (c) => {
    try {
        const stopId = c.req.param('stopId');

        const departures = await getDeparturesForStop({
            stopId,
            clockTime: '08:00:00',
            lookaheadMins: 200,
            limit: 100,
        });
        const response: StopDeparturesResponse = {
            stopId,
            departures: departures.map(toDepartureDto),
            timestamp: createTimestamp(),
        };

        return c.json(response);
    } catch (err) {
        console.error(
            `Error in /api/departures/${c.req.param('stopId')}:`,
            err
        );
        const response: ApiErrorResponse = {
            error: 'Failed to fetch departures for stop',
            timestamp: createTimestamp(),
        };

        return c.json(response, 500);
    }
});
