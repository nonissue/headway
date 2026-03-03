import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../types/global.js';

const config: Config = {
    sqlitePath: 'db/gtfs.db',
    agencies: [{ path: 'agency.zip' }],
};

async function loadSubject(options?: {
    getConfigImpl?: () => Promise<Config>;
    loadDbImpl?: () => Promise<{ name: string }>;
}) {
    vi.resetModules();

    const closeDb = vi.fn();
    const getConfig = vi
        .fn()
        .mockImplementation(
            options?.getConfigImpl ?? (async () => config)
        );
    const loadDb = vi
        .fn()
        .mockImplementation(
            options?.loadDbImpl ?? (async () => ({ name: 'db' }))
        );
    const shutdownHandlers = new Map<string, () => void>();

    vi.doMock('gtfs', () => ({
        closeDb,
    }));
    vi.doMock('./file-utils.js', () => ({
        getConfig,
    }));
    vi.doMock('./db-utils.js', () => ({
        loadDb,
    }));

    const processOnceSpy = vi
        .spyOn(process, 'once')
        .mockImplementation(((event: string, handler: () => void) => {
            shutdownHandlers.set(event, handler);
            return process;
        }) as typeof process.once);

    const subject = await import('./server-context.js');

    return {
        closeDb,
        getConfig,
        loadDb,
        processOnceSpy,
        shutdownHandlers,
        subject,
    };
}

describe('server-context', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('caches the bootstrapped context and only registers shutdown hooks once', async () => {
        const { getConfig, loadDb, processOnceSpy, subject } =
            await loadSubject();

        const firstPromise = subject.getServerContext();
        const secondPromise = subject.getServerContext();
        const [first, second] = await Promise.all([firstPromise, secondPromise]);

        expect(firstPromise).toBe(secondPromise);
        expect(first).toBe(second);
        expect(getConfig).toHaveBeenCalledTimes(1);
        expect(loadDb).toHaveBeenCalledTimes(1);
        expect(processOnceSpy).toHaveBeenCalledTimes(3);
    });

    it('closes the shared database only once across multiple shutdown signals', async () => {
        const { closeDb, shutdownHandlers, subject } = await loadSubject({
            loadDbImpl: async () => ({ name: 'shared-db' }),
        });

        await subject.getServerContext();

        shutdownHandlers.get('SIGTERM')?.();
        shutdownHandlers.get('exit')?.();
        shutdownHandlers.get('SIGINT')?.();

        expect(closeDb).toHaveBeenCalledTimes(1);
        expect(closeDb).toHaveBeenCalledWith({ name: 'shared-db' });
    });

    it('clears the cached promise when bootstrap fails so the next call can retry', async () => {
        let attempts = 0;
        const { getConfig, loadDb, subject } = await loadSubject({
            loadDbImpl: async () => {
                attempts += 1;
                if (attempts === 1) {
                    throw new Error('db offline');
                }

                return { name: 'db' };
            },
        });

        await expect(subject.getServerContext()).rejects.toThrow('db offline');
        await expect(subject.getServerContext()).resolves.toEqual({
            config,
            db: { name: 'db' },
        });

        expect(getConfig).toHaveBeenCalledTimes(2);
        expect(loadDb).toHaveBeenCalledTimes(2);
    });
});
