import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./stop-utils.js', () => ({
    getClosestStation: vi.fn(),
    getDeparturesForStation: vi.fn(),
}));

import { getNearbyDepartures } from './get-nearby-departures.js';
import {
    getClosestStation,
    getDeparturesForStation,
} from './stop-utils.js';

describe('getNearbyDepartures', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('throws when coordinates are missing', async () => {
        await expect(getNearbyDepartures()).rejects.toThrow(
            'lat & lon are required to find nearby departures'
        );
    });

    it('returns the closest station and its platforms', async () => {
        const station = {
            stop_id: 'station-1',
            stop_name: 'Central Station',
        };
        const platforms = [
            {
                stop: {
                    stop_id: 'platform-1',
                    stop_name: 'Platform 1',
                },
                departures: [],
            },
        ];

        vi.mocked(getClosestStation).mockResolvedValue(station);
        vi.mocked(getDeparturesForStation).mockResolvedValue({
            station,
            platforms,
        });

        await expect(
            getNearbyDepartures({ lat: 53.5, lon: -113.5 })
        ).resolves.toEqual({
            station,
            platforms,
        });
        expect(getClosestStation).toHaveBeenCalledWith({
            lat: 53.5,
            lon: -113.5,
        });
        expect(getDeparturesForStation).toHaveBeenCalledWith(station);
    });
});
