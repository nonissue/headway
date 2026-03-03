import { Hono } from 'hono';
import { getAllStations, getDeparturesForStation } from '../lib/stop-utils.js';
import {
    createTimestamp,
    toPlatformDto,
    toStationDto,
} from '../lib/api-mappers.js';
import type {
    ApiErrorResponse,
    StationDeparturesResponse,
    StationsResponse,
} from '../types/departures.js';

export const stations = new Hono().basePath('/stations');

/**
 * GET /api/stations
 * Get all stations, optionally sorted by distance if coordinates provided
 */
stations.get('/', async (c) => {
    try {
        const lat = c.req.query('lat');
        const lon = c.req.query('lon');

        let coordinates;
        if (lat && lon) {
            coordinates = {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
            };

            if (
                Number.isNaN(coordinates.lat) ||
                Number.isNaN(coordinates.lon)
            ) {
                const response: ApiErrorResponse = {
                    error: 'Invalid latitude or longitude',
                    timestamp: createTimestamp(),
                };

                return c.json(response, 400);
            }
        }

        const allStations = await getAllStations(coordinates);
        const response: StationsResponse = {
            stations: allStations.map(toStationDto),
            timestamp: createTimestamp(),
        };

        return c.json(response);
    } catch (err) {
        console.error('Error in /api/stations:', err);

        const response: ApiErrorResponse = {
            error: 'Failed to fetch stations',
            timestamp: createTimestamp(),
        };

        return c.json(response, 500);
    }
});

/**
 * GET /api/stations/:stationId/departures
 * Get departures for a specific station
 */
stations.get('/:stationId/departures', async (c) => {
    try {
        const stationId = c.req.param('stationId');

        if (!stationId) {
            const response: ApiErrorResponse = {
                error: 'Station ID is required',
                timestamp: createTimestamp(),
            };

            return c.json(response, 400);
        }

        const { station, platforms } = await getDeparturesForStation(stationId);
        const response: StationDeparturesResponse = {
            station: toStationDto(station),
            platforms: platforms.map(toPlatformDto),
            timestamp: createTimestamp(),
        };

        return c.json(response);
    } catch (err) {
        console.error(
            `Error in /api/stations/${c.req.param('stationId')}/departures:`,
            err
        );

        const response: ApiErrorResponse = {
            error: 'Failed to fetch departures for station',
            timestamp: createTimestamp(),
        };

        return c.json(response, 500);
    }
});
