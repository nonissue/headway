import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import * as Sentry from '@sentry/node';
import { Hono } from 'hono';

import { departures } from './api/departures.js';
import { stations } from './api/stations.js';
import { getServerContext } from './lib/server-context.js';

Sentry.init({
    dsn: 'https://07484d1f244886b5aba802227c2608d8@o4509785629786112.ingest.us.sentry.io/4509785630048256',

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

// Fail fast if the machine cannot read config or open the GTFS database.
await getServerContext();

const app = new Hono();

// Path setup for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, '../dist/client');

app.get('/stats.js', async (c) => {
    const upstream = await fetch('https://cloud.umami.is/script.js');

    if (!upstream.ok || !upstream.body) {
        return c.text('Failed to load analytics script', 502);
    }

    const contentType =
        upstream.headers.get('content-type') ??
        'application/javascript; charset=utf-8';

    c.header('Content-Type', contentType);
    c.header('Cache-Control', 'public, max-age=3600');

    return c.body(upstream.body);
});

// Serve static files from Vite build
app.use(
    '*',
    serveStatic({
        root: clientPath,
        rewriteRequestPath: (p) => (p === '/' ? '/index.html' : p),
    })
);

// Add cache-control headers for API endpoints
app.use('/api/*', async (c, next) => {
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');
    await next();
});

// Health check endpoint for Fly.io
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// mount the /api/departures router under /api
app.route('/api', departures);
app.route('/api', stations);

app.notFound((c) => {
    return c.text(`Route not found ${c.req.path}`, 404);
});

app.onError((err, c) => {
    console.error(`${err}`);
    return c.text('Custom Error Message', 500);
});

const PORT = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`🚆 Server is running at http://localhost:${PORT}`);
});
