import { importGtfs, openDb } from 'gtfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../types/global.js';

vi.mock('gtfs', () => ({
    importGtfs: vi.fn(),
    openDb: vi.fn(),
}));

vi.mock('./file-utils.js', () => ({
    validateConfigForImport: vi.fn(),
}));

import { validateConfigForImport } from './file-utils.js';
import { importGtfsDataToDb, loadDb } from './db-utils.js';

const validConfig: Config = {
    sqlitePath: 'db/gtfs.db',
    agencies: [{ path: 'agency.zip' }],
};

describe('db-utils', () => {
    beforeEach(() => {
        vi.mocked(validateConfigForImport).mockImplementation(() => validConfig);
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'time').mockImplementation(() => {});
        vi.spyOn(console, 'timeEnd').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadDb', () => {
        it('validates config and opens the database', async () => {
            const db = { name: 'db' };
            vi.mocked(openDb).mockReturnValue(db as never);

            await expect(loadDb(validConfig)).resolves.toBe(db);
            expect(validateConfigForImport).toHaveBeenCalledWith(validConfig);
            expect(openDb).toHaveBeenCalledWith(validConfig);
        });

        it('throws when sqlitePath is missing after validation passes', async () => {
            await expect(
                loadDb({
                    agencies: [{ path: 'agency.zip' }],
                })
            ).rejects.toThrow(
                'To load and connect to an existing database, config.json must contain a valid `sqlitePath`'
            );
        });

        it('throws when no agencies are configured after validation passes', async () => {
            await expect(
                loadDb({
                    sqlitePath: 'db/gtfs.db',
                    agencies: [],
                })
            ).rejects.toThrow('No agency defined in `config.json`');
        });

        it('wraps sqlite open failures', async () => {
            vi.mocked(openDb).mockImplementation(() => {
                throw new Error('sqlite failed');
            });

            await expect(loadDb(validConfig)).rejects.toThrow(
                'Error opening database'
            );
            expect(console.error).toHaveBeenCalledTimes(2);
        });
    });

    describe('importGtfsDataToDb', () => {
        it('imports GTFS data into the opened database', async () => {
            const db = { name: 'db' };
            vi.mocked(openDb).mockReturnValue(db as never);
            vi.mocked(importGtfs).mockResolvedValue(undefined);

            await expect(importGtfsDataToDb(validConfig)).resolves.toBeUndefined();

            expect(importGtfs).toHaveBeenCalledWith({
                agencies: validConfig.agencies,
                db,
            });
            expect(console.time).toHaveBeenCalledWith('GTFS Import Duration');
            expect(console.timeEnd).toHaveBeenCalledWith(
                'GTFS Import Duration'
            );
        });

        it('rethrows load errors before import starts', async () => {
            vi.mocked(openDb).mockImplementation(() => {
                throw new Error('sqlite failed');
            });

            await expect(importGtfsDataToDb(validConfig)).rejects.toThrow(
                'Error opening database'
            );
            expect(importGtfs).not.toHaveBeenCalled();
        });

        it('logs import errors without swallowing the timer cleanup', async () => {
            const db = { name: 'db' };
            const error = new Error('import failed');

            vi.mocked(openDb).mockReturnValue(db as never);
            vi.mocked(importGtfs).mockRejectedValue(error);

            await expect(importGtfsDataToDb(validConfig)).resolves.toBeUndefined();

            expect(console.error).toHaveBeenCalledWith(error);
            expect(console.timeEnd).toHaveBeenCalledWith(
                'GTFS Import Duration'
            );
        });
    });
});
