// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_COORDS } from '../config.js';
import type {
    DepartureGroup,
    DeparturesResponse,
    Station,
    StationDeparturesResponse,
    StationsResponse,
} from '../types/departures.js';
import { useDeparturesApp } from './useDeparturesApp.js';

const GEOLOCATION_COORDS = {
    lat: 53.54321,
    lon: -113.49876,
};

const DEFAULT_TIMESTAMP = '2026-03-03T12:34:56.000Z';

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        ...init,
    });
}

function createNearbyResponse(
    overrides: Partial<DeparturesResponse> = {}
): DeparturesResponse {
    return {
        station: {
            stop_id: 'station-nearby',
            stop_name: 'Nearby Station',
        },
        platforms: [
            {
                stop: {
                    stop_id: 'platform-1',
                    stop_name: 'Platform 1',
                },
                departures: [
                    {
                        stop_id: 'platform-1',
                        trip_id: 'trip-1',
                        stop_headsign: null,
                        departure_time: '25:05:00',
                    },
                ],
            },
        ],
        timestamp: DEFAULT_TIMESTAMP,
        ...overrides,
    };
}

function createStationResponse(
    station: Station,
    overrides: Partial<StationDeparturesResponse> = {}
): StationDeparturesResponse {
    return {
        station,
        platforms: [
            {
                stop: {
                    stop_id: `${station.stop_id}-platform`,
                    stop_name: `${station.stop_name} Platform`,
                },
                departures: [
                    {
                        stop_id: `${station.stop_id}-platform`,
                        trip_id: 'trip-station',
                        stop_headsign: 'Clareview',
                        departure_time: '08:15:00',
                    },
                ],
            },
        ],
        timestamp: DEFAULT_TIMESTAMP,
        ...overrides,
    };
}

function createStationsResponse(
    overrides: Partial<StationsResponse> = {}
): StationsResponse {
    return {
        stations: [
            {
                stop_id: 'station-nearby',
                stop_name: 'Nearby Station',
            },
            {
                stop_id: 'station-alt',
                stop_name: 'Alternate Station',
            },
        ],
        timestamp: DEFAULT_TIMESTAMP,
        ...overrides,
    };
}

function mockGeolocationSuccess(
    coords: { lat: number; lon: number } = GEOLOCATION_COORDS
) {
    Object.defineProperty(window.navigator, 'geolocation', {
        configurable: true,
        value: {
            getCurrentPosition: vi.fn((success: PositionCallback) => {
                success({
                    coords: {
                        latitude: coords.lat,
                        longitude: coords.lon,
                        accuracy: 10,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                        toJSON: () => ({}),
                    },
                    timestamp: Date.now(),
                    toJSON: () => ({}),
                } as GeolocationPosition);
            }),
        },
    });
}

function mockGeolocationFailure(message = 'Permission denied') {
    Object.defineProperty(window.navigator, 'geolocation', {
        configurable: true,
        value: {
            getCurrentPosition: vi.fn(
                (success: PositionCallback, error?: PositionErrorCallback) => {
                    void success;
                    error?.({
                        code: 1,
                        message,
                        PERMISSION_DENIED: 1,
                        POSITION_UNAVAILABLE: 2,
                        TIMEOUT: 3,
                    } as GeolocationPositionError);
                }
            ),
        },
    });
}

describe('useDeparturesApp', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('loads nearby departures from geolocation on mount', async () => {
        mockGeolocationSuccess();
        vi.mocked(fetch)
            .mockResolvedValueOnce(createJsonResponse(createNearbyResponse()))
            .mockResolvedValueOnce(createJsonResponse(createStationsResponse()));

        const { result } = renderHook(() => useDeparturesApp());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isStationsLoading).toBe(false);
        });

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            `/api/departures/nearby?lat=${GEOLOCATION_COORDS.lat}&lon=${GEOLOCATION_COORDS.lon}`,
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            `/api/stations?lat=${GEOLOCATION_COORDS.lat}&lon=${GEOLOCATION_COORDS.lon}`,
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
        expect(result.current.selectedStation?.stop_id).toBe('station-nearby');
        expect(result.current.stations).toEqual(
            createStationsResponse().stations
        );
        expect(result.current.userLocation).toEqual(GEOLOCATION_COORDS);
        expect(result.current.departureGroups).toEqual<DepartureGroup[]>([
            {
                heading: 'Unknown destination',
                destinations: ['Unknown destination'],
                departures: [
                    expect.objectContaining({
                        displayTime: '01:05:00',
                        displayHeadsign: 'Unknown destination',
                    }),
                ],
            },
        ]);
    });

    it('falls back to test coordinates when geolocation fails', async () => {
        mockGeolocationFailure();
        vi.mocked(fetch)
            .mockResolvedValueOnce(createJsonResponse(createNearbyResponse()))
            .mockResolvedValueOnce(createJsonResponse(createStationsResponse()));

        const { result } = renderHook(() => useDeparturesApp());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isStationsLoading).toBe(false);
        });

        expect(fetch).toHaveBeenNthCalledWith(
            1,
            `/api/departures/nearby?lat=${TEST_COORDS.lat}&lon=${TEST_COORDS.lon}`,
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            `/api/stations?lat=${TEST_COORDS.lat}&lon=${TEST_COORDS.lon}`,
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
        expect(result.current.userLocation).toEqual({
            lat: TEST_COORDS.lat,
            lon: TEST_COORDS.lon,
        });
    });

    it('loads departures for a selected station', async () => {
        mockGeolocationSuccess();
        const selectedStation: Station = {
            stop_id: 'station-picked',
            stop_name: 'Picked Station',
        };

        vi.mocked(fetch)
            .mockResolvedValueOnce(createJsonResponse(createNearbyResponse()))
            .mockResolvedValueOnce(createJsonResponse(createStationsResponse()))
            .mockResolvedValueOnce(
                createJsonResponse(createStationResponse(selectedStation))
            );

        const { result } = renderHook(() => useDeparturesApp());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.selectStation(selectedStation);
        });

        await waitFor(() => {
            expect(result.current.selectedStation?.stop_id).toBe(
                selectedStation.stop_id
            );
        });

        expect(fetch).toHaveBeenNthCalledWith(
            3,
            `/api/stations/${selectedStation.stop_id}/departures`,
            expect.objectContaining({
                signal: expect.any(AbortSignal),
            })
        );
        expect(result.current.departureGroups[0].heading).toBe('Northbound');
        expect(result.current.departureGroups[0].departures[0].displayHeadsign).toBe(
            'Clareview'
        );
    });

    it('refreshes nearby departures and bumps the animation key', async () => {
        mockGeolocationSuccess();
        vi.mocked(fetch)
            .mockResolvedValueOnce(createJsonResponse(createNearbyResponse()))
            .mockResolvedValueOnce(createJsonResponse(createStationsResponse()))
            .mockResolvedValueOnce(createJsonResponse(createNearbyResponse()))
            .mockResolvedValueOnce(createJsonResponse(createStationsResponse()));

        const { result } = renderHook(() => useDeparturesApp());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.animationKey).toBe(0);

        await act(async () => {
            await result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.animationKey).toBe(1);
        });
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(4);
        });
    });

    it('surfaces API errors and clears them on demand', async () => {
        mockGeolocationSuccess();
        vi.mocked(fetch).mockResolvedValueOnce(
            createJsonResponse(
                {
                    error: 'Failed to fetch departures',
                    timestamp: DEFAULT_TIMESTAMP,
                },
                { status: 500 }
            )
        );

        const { result } = renderHook(() => useDeparturesApp());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error?.message).toBe(
            'Failed to fetch departures'
        );
        expect(result.current.hasError).toBe(true);

        act(() => {
            result.current.clearError();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.hasError).toBe(false);
    });
});
