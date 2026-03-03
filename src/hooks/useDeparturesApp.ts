import { useCallback, useEffect, useMemo, useState } from 'react';
import { TEST_COORDS } from '../config.js';
import { convertServiceTimeToClockTime } from '../lib/time-utils.js';
import type {
    ApiErrorResponse,
    Departure,
    DeparturesResponse,
    LocationCoordinates,
    ProcessedDeparture,
    Station,
    StationDeparturesResponse,
} from '../types/departures.js';

interface AppError {
    message: string;
    code?: string;
}

interface FetchOptions {
    timeoutMs?: number;
}

const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 0,
} satisfies PositionOptions;

function normalizeError(error: unknown): AppError {
    if (error instanceof Error) {
        return {
            message: error.message,
            code: error.name,
        };
    }

    return {
        message: 'Unexpected error',
    };
}

async function fetchJson<T>(
    url: string,
    { timeoutMs = 15000 }: FetchOptions = {}
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as
            | T
            | ApiErrorResponse
            | null;

        if (!response.ok) {
            const message =
                payload &&
                typeof payload === 'object' &&
                'error' in payload &&
                typeof payload.error === 'string'
                    ? payload.error
                    : `Request failed (${response.status})`;

            throw new Error(message);
        }

        return payload as T;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out');
        }

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function getFallbackLocation(): LocationCoordinates {
    return {
        lat: TEST_COORDS.lat,
        lon: TEST_COORDS.lon,
    };
}

function getCurrentLocation(): Promise<LocationCoordinates> {
    if (!navigator.geolocation) {
        return Promise.reject(
            new Error('Geolocation is not supported by your browser.')
        );
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            reject,
            GEOLOCATION_OPTIONS
        );
    });
}

export function useDeparturesApp() {
    const [departures, setDepartures] = useState<Departure[][]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStation, setSelectedStation] = useState<Station>();
    const [userLocation, setUserLocation] = useState<LocationCoordinates>();
    const [animationKey, setAnimationKey] = useState(0);
    const [error, setError] = useState<AppError | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const applyDeparturesResponse = useCallback(
        (
            response: DeparturesResponse | StationDeparturesResponse,
            options: {
                refresh?: boolean;
                location?: LocationCoordinates;
            } = {}
        ) => {
            setSelectedStation(response.station);
            setDepartures(
                response.platforms.map((platform) => platform.departures)
            );
            setLastUpdated(new Date(response.timestamp));

            if (options.location) {
                setUserLocation(options.location);
            }

            if (options.refresh) {
                setAnimationKey((current) => current + 1);
            }
        },
        []
    );

    const loadNearbyDepartures = useCallback(
        async (
            location: LocationCoordinates,
            options: { refresh?: boolean } = {}
        ) => {
            const { refresh = false } = options;

            if (!refresh) {
                setIsLoading(true);
            }

            clearError();

            try {
                const response = await fetchJson<DeparturesResponse>(
                    `/api/departures/nearby?lat=${location.lat}&lon=${location.lon}`
                );

                applyDeparturesResponse(response, {
                    refresh,
                    location,
                });
            } catch (error) {
                setError(normalizeError(error));
            } finally {
                if (!refresh) {
                    setIsLoading(false);
                }
            }
        },
        [applyDeparturesResponse, clearError]
    );

    const resolveLocation =
        useCallback(async (): Promise<LocationCoordinates> => {
            try {
                return await getCurrentLocation();
            } catch {
                return getFallbackLocation();
            }
        }, []);

    const selectStation = useCallback(
        async (station: Station) => {
            setIsLoading(true);
            clearError();

            try {
                const response = await fetchJson<StationDeparturesResponse>(
                    `/api/stations/${station.stop_id}/departures`,
                    {
                        timeoutMs: 10000,
                    }
                );

                applyDeparturesResponse(response);
            } catch (error) {
                setError(normalizeError(error));
            } finally {
                setIsLoading(false);
            }
        },
        [applyDeparturesResponse, clearError]
    );

    const refresh = useCallback(async () => {
        const location = await resolveLocation();
        await loadNearbyDepartures(location, { refresh: true });
    }, [loadNearbyDepartures, resolveLocation]);

    useEffect(() => {
        let ignore = false;

        void (async () => {
            const location = await resolveLocation();

            if (ignore) {
                return;
            }

            await loadNearbyDepartures(location);
        })();

        return () => {
            ignore = true;
        };
    }, [loadNearbyDepartures, resolveLocation]);

    const processedDepartures = useMemo((): ProcessedDeparture[][] => {
        return departures.map((group) =>
            group.map((departure) => ({
                ...departure,
                displayTime: convertServiceTimeToClockTime(
                    departure.departure_time
                ),
                displayHeadsign:
                    departure.stop_headsign?.trim() || 'Unknown destination',
            }))
        );
    }, [departures]);

    return {
        animationKey,
        clearError,
        error,
        hasError: error !== null,
        isLoading,
        lastUpdated,
        processedDepartures,
        refresh,
        selectedStation,
        selectStation,
        userLocation,
    };
}
