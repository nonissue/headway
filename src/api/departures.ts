import { Hono } from 'hono';
import { closeDb } from 'gtfs';
import { getNearbyDepartures } from '../lib/get-nearby-departures.js';
import { getDeparturesForStop } from '../lib/stop-utils.js';
import { getConfig } from '../lib/file-utils.js';
import { loadDb } from '../lib/db-utils.js';
import { Config } from '../types/global.js';

export const departures = new Hono().basePath('/departures');

/**
 * GET /api/departures/nearby?lat=…&lon=…
 */
departures.get('/nearby', async (c) => {
    let db;

    try {
        const config: Config = await getConfig();
        db = await loadDb(config);

        const lat = parseFloat(c.req.query('lat') ?? '');
        const lon = parseFloat(c.req.query('lon') ?? '');

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return c.json({ error: 'Invalid latitude or longitude' }, 400);
        }

        const result = await getNearbyDepartures({ lat, lon });

        return c.json({
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Error in /api/departures:', err);

        return c.json({ error: 'Failed to fetch departures' }, 500);
    } finally {
        if (db) closeDb(db);
    }
});

/**
 * GET /api/departures/:stopId
 */
departures.get('/:stopId', async (c) => {
    let db;

    try {
        const config: Config = await getConfig();
        db = await loadDb(config);

        const stopId = c.req.param('stopId');

        const result = await getDeparturesForStop({
            stopId,
            clockTime: '08:00:00',
            lookaheadMins: 200,
            limit: 100,
        });

        return c.json(result);
    } catch (err) {
        console.error(
            `Error in /api/departures/${c.req.param('stopId')}:`,
            err
        );
        return c.json({ error: 'Failed to fetch departures for stop' }, 500);
    } finally {
        if (db) closeDb(db);
    }
});
