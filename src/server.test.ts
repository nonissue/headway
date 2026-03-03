import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface LoadedServerModule {
    appFetch: (request: Request) => Promise<Response>;
    fetchSpy: ReturnType<typeof vi.fn>;
    getServerContext: ReturnType<typeof vi.fn>;
    sentryInit: ReturnType<typeof vi.fn>;
    serve: ReturnType<typeof vi.fn>;
}

async function loadServerModule(port?: number): Promise<LoadedServerModule> {
    vi.resetModules();

    let appFetch: ((request: Request) => Promise<Response>) | null = null;

    const fetchSpy = vi.fn();
    const getServerContext = vi.fn().mockResolvedValue({
        config: {},
        db: {},
    });
    const sentryInit = vi.fn();
    const serve = vi.fn(
        (
            options: { fetch: (request: Request) => Promise<Response> },
            onListen?: () => void
        ) => {
            appFetch = options.fetch;
            onListen?.();
        }
    );
    const serveStatic = vi.fn(
        () => async (_c: unknown, next: () => Promise<void>) => {
            await next();
        }
    );

    vi.stubGlobal('fetch', fetchSpy);
    if (port == null) {
        vi.unstubAllEnvs();
    } else {
        vi.stubEnv('PORT', String(port));
    }

    vi.doMock('@hono/node-server', () => ({
        serve,
    }));
    vi.doMock('@hono/node-server/serve-static', () => ({
        serveStatic,
    }));
    vi.doMock('@sentry/node', () => ({
        init: sentryInit,
    }));
    vi.doMock('./lib/server-context.js', () => ({
        getServerContext,
    }));

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await import('./server.js');

    if (!appFetch) {
        throw new Error('Server did not register a fetch handler');
    }

    return {
        appFetch,
        fetchSpy,
        getServerContext,
        sentryInit,
        serve,
    };
}

describe('server bootstrap', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-03T12:34:56.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('initializes sentry, bootstraps the server context, and starts the server', async () => {
        const { getServerContext, sentryInit, serve } =
            await loadServerModule(4321);

        expect(sentryInit).toHaveBeenCalledTimes(1);
        expect(getServerContext).toHaveBeenCalledTimes(1);
        expect(serve).toHaveBeenCalledWith(
            expect.objectContaining({ port: 4321, fetch: expect.any(Function) }),
            expect.any(Function)
        );
        expect(console.log).toHaveBeenCalledWith(
            '🚆 Server is running at http://localhost:4321'
        );
    });

    it('serves the health endpoint with API no-cache headers', async () => {
        const { appFetch } = await loadServerModule();

        const response = await appFetch(
            new Request('http://localhost/api/health')
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toBe(
            'no-cache, no-store, must-revalidate'
        );
        expect(response.headers.get('Pragma')).toBe('no-cache');
        expect(response.headers.get('Expires')).toBe('0');
        await expect(response.json()).resolves.toEqual({
            status: 'ok',
            timestamp: '2026-03-03T12:34:56.000Z',
        });
    });

    it('proxies the analytics script and preserves content headers', async () => {
        const { appFetch, fetchSpy } = await loadServerModule();
        fetchSpy.mockResolvedValue(
            new Response('analytics', {
                status: 200,
                headers: {
                    'content-type': 'application/javascript; charset=utf-8',
                },
            })
        );

        const response = await appFetch(new Request('http://localhost/stats.js'));

        expect(fetchSpy).toHaveBeenCalledWith(
            'https://cloud.umami.is/script.js'
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe(
            'application/javascript; charset=utf-8'
        );
        expect(response.headers.get('Cache-Control')).toBe(
            'public, max-age=3600'
        );
        await expect(response.text()).resolves.toBe('analytics');
    });

    it('returns 502 when the analytics upstream is unavailable', async () => {
        const { appFetch, fetchSpy } = await loadServerModule();
        fetchSpy.mockResolvedValue(
            new Response('upstream error', {
                status: 500,
            })
        );

        const response = await appFetch(new Request('http://localhost/stats.js'));

        expect(response.status).toBe(502);
        await expect(response.text()).resolves.toBe(
            'Failed to load analytics script'
        );
    });

    it('uses the app error handler when the analytics proxy throws', async () => {
        const { appFetch, fetchSpy } = await loadServerModule();
        fetchSpy.mockRejectedValue(new Error('network down'));

        const response = await appFetch(new Request('http://localhost/stats.js'));

        expect(response.status).toBe(500);
        await expect(response.text()).resolves.toBe('Custom Error Message');
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('network down')
        );
    });

    it('returns the custom not-found response for unknown routes', async () => {
        const { appFetch } = await loadServerModule();

        const response = await appFetch(new Request('http://localhost/missing'));

        expect(response.status).toBe(404);
        await expect(response.text()).resolves.toBe('Route not found /missing');
    });
});
