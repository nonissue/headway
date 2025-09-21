import { Hono } from 'hono';
import { closeDb } from 'gtfs';
import { getDeparturesForStop, getStopsForParentStation, getAllStations } from '../lib/stop-utils.js';
import { getConfig } from '../lib/file-utils.js';
import { loadDb } from '../lib/db-utils.js';
import { Config } from '../types/global.js';

export const stations = new Hono().basePath('/stations');

/**
 * GET /api/stations
 * Get all stations, optionally sorted by distance if coordinates provided
 */
stations.get('/', async (c) => {
    let db;

    try {
        const config: Config = await getConfig();
        db = await loadDb(config);

        const lat = c.req.query('lat');
        const lon = c.req.query('lon');

        let coordinates;
        if (lat && lon) {
            coordinates = {
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            };

            if (Number.isNaN(coordinates.lat) || Number.isNaN(coordinates.lon)) {
                return c.json({ error: 'Invalid latitude or longitude' }, 400);
            }
        }

        const stations = await getAllStations(coordinates);

        return c.json({
            stations,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error in /api/stations:', err);

        return c.json({
            error: 'Failed to fetch stations'
        }, 500);
    } finally {
        if (db) closeDb(db);
    }
});

/**
 * GET /api/stations/:stationId/departures
 * Get departures for a specific station
 */
stations.get('/:stationId/departures', async (c) => {
    let db;

    try {
        const config: Config = await getConfig();
        db = await loadDb(config);

        const stationId = c.req.param('stationId');

        if (!stationId) {
            return c.json({ error: 'Station ID is required' }, 400);
        }

        // Get all stops for this parent station
        const stops = await getStopsForParentStation(stationId);

        // Get departures for each stop (platform)
        const departures = await Promise.all(
            stops.map((stop) => getDeparturesForStop({ stopId: stop.stop_id }))
        );

        return c.json({
            stationId,
            departures: departures,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`Error in /api/stations/${c.req.param('stationId')}/departures:`, err);

        return c.json({
            error: 'Failed to fetch departures for station',
            stationId: c.req.param('stationId')
        }, 500);
    } finally {
        if (db) closeDb(db);
    }
});