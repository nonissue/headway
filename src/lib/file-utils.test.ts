import { readFile } from 'fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../types/global.js';

vi.mock('fs/promises', () => ({
    readFile: vi.fn(),
}));

import { getConfig, validateConfigForImport } from './file-utils.js';

const validConfig: Config = {
    sqlitePath: 'db/gtfs.db',
    agencies: [{ path: 'https://example.com/gtfs.zip' }],
};

describe('file-utils', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('validateConfigForImport', () => {
        it('returns the config when agencies and sqlite path are present', () => {
            expect(validateConfigForImport(validConfig)).toBe(validConfig);
        });

        it('throws when agencies are missing', () => {
            expect(() =>
                validateConfigForImport({
                    sqlitePath: 'db/gtfs.db',
                    agencies: [],
                })
            ).toThrow('No `agencies` specified in config');
        });

        it('throws when an agency is missing both url and path', () => {
            expect(() =>
                validateConfigForImport({
                    sqlitePath: 'db/gtfs.db',
                    agencies: [{}],
                })
            ).toThrow(
                'No Agency `url` or `path` specified in config for agency index 0.'
            );
        });

        it('throws when sqlitePath is missing', () => {
            expect(() =>
                validateConfigForImport({
                    agencies: [{ path: 'agency.zip' }],
                })
            ).toThrow('No sqlitePath provided!');
        });
    });

    describe('getConfig', () => {
        it('reads and parses app-config.json', async () => {
            vi.mocked(readFile).mockResolvedValue(JSON.stringify(validConfig));

            await expect(getConfig()).resolves.toEqual(validConfig);
            expect(readFile).toHaveBeenCalledWith(
                expect.stringContaining('app-config.json'),
                'utf-8'
            );
        });

        it('wraps non-Error read failures in an Error', async () => {
            vi.mocked(readFile).mockRejectedValue('missing config');

            await expect(getConfig()).rejects.toThrow('missing config');
        });
    });
});
