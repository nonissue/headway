import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import * as Sentry from '@sentry/node';
import { Hono } from 'hono';

import { departures } from './api/departures.js';
import { stations } from './api/stations.js';

/*
causes fly error?
YES, the code below definitely caused a fly error. It deployed caused an error

2025-08-24T03:18:21.188 app[2874247be2e328] sea [info] 2025/08/24 03:18:21 INFO SSH listening listen_address=[fdaa:24:936e:a7b:1a8:8381:e739:2]:22
2025-08-24T03:18:22.508 app[2874247be2e328] sea [info] file:///app/dist/server.js:7
2025-08-24T03:18:22.508 app[2874247be2e328] sea [info] if ('serviceWorker' in navigator) {
2025-08-24T03:18:22.508 app[2874247be2e328] sea [info] ^
2025-08-24T03:18:22.508 app[2874247be2e328] sea [info] ReferenceError: navigator is not defined
2025-08-24T03:18:22.508 app[2874247be2e328] sea [info] at file:///app/dist/server.js:7:24
2025-08-24T03:18:22.515 app[2874247be2e328] sea [info] Node.js v20.19.4
2025-08-24T03:18:22.837 app[2874247be2e328] sea [info] INFO Main child exited normally with code: 1

Not even sure why i added it...

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('Service worker detected');
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}

*/

// Import with `import * as Sentry from "@sentry/node"` if you are using ESM

Sentry.init({
    dsn: 'https://07484d1f244886b5aba802227c2608d8@o4509785629786112.ingest.us.sentry.io/4509785630048256',

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
});

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
