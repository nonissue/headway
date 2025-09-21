import { Hono } from 'hono';
import { closeDb } from 'gtfs';
import { getAllStations } from '../lib/stop-utils.js';
import { getConfig } from '../lib/file-utils.js';
import { loadDb } from '../lib/db-utils.js';
import { Config } from '../types/global.js';

export const stations = new Hono().basePath('/stations');

/**
 * GET /api/stations?lat=...&lon=...
 */
stations.get('/', async (c) => {
    console.log('🚉 Stations API called:', c.req.path, 'Query:', c.req.query());
    let db;

    try {
        const config: Config = await getConfig();
        db = await loadDb(config);

        // Get optional coordinates from query params for distance-based sorting
        const lat = c.req.query('lat');
        const lon = c.req.query('lon');

        let coordinates = undefined;
        if (lat && lon) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
                coordinates = { lat: latitude, lon: longitude };
                console.log('🚉 Using coordinates for sorting:', coordinates);
            }
        } else {
            console.log('🚉 No coordinates provided, using alphabetical sorting');
        }

        const allStations = await getAllStations(coordinates);
        console.log('🚉 Retrieved', allStations.length, 'stations');

        return c.json({ stations: allStations });
    } catch (err) {
        console.error('❌ Error in /api/stations:', err);
        return c.json({ error: 'Failed to fetch stations' }, 500);
    } finally {
        if (db) closeDb(db);
    }
});