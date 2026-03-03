import { useRef, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import {
    DeparturesResponse,
    StationDeparturesResponse,
} from '../types/departures';

interface RequestOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

export const useApiRequest = () => {
    const activeRequests = useRef(new Map<string, Promise<unknown>>());
    const { handleApiError, handleNetworkError } = useErrorHandler();

    const makeRequest = useCallback(
        async <T>(
            key: string,
            requestFn: () => Promise<Response>,
            options: RequestOptions = {}
        ): Promise<T> => {
            const { timeout = 10000, retries = 1, retryDelay = 1000 } = options;

            // Return existing request if one is already in progress
            if (activeRequests.current.has(key)) {
                return activeRequests.current.get(key) as Promise<T>;
            }

            const executeRequest = async (): Promise<T> => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                try {
                    const response = await requestFn();
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        handleApiError(response);
                        throw new Error(
                            `HTTP ${response.status}: ${response.statusText}`
                        );
                    }

                    const data: T = await response.json();
                    return data;
                } catch (error) {
                    clearTimeout(timeoutId);

                    if (error instanceof Error) {
                        if (error.name === 'AbortError') {
                            throw new Error('Request timeout');
                        }
                        handleNetworkError(error);
                    }
                    throw error;
                }
            };

            const requestWithRetry = async (
                attemptsLeft: number
            ): Promise<T> => {
                try {
                    return await executeRequest();
                } catch (error) {
                    if (attemptsLeft > 0) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay)
                        );
                        return requestWithRetry(attemptsLeft - 1);
                    }
                    throw error;
                }
            };

            const promise = requestWithRetry(retries);
            activeRequests.current.set(key, promise);

            try {
                const result = await promise;
                activeRequests.current.delete(key);
                return result;
            } catch (error) {
                activeRequests.current.delete(key);
                throw error;
            }
        },
        [handleApiError, handleNetworkError]
    );

    const fetchDepartures = useCallback(
        async (lat: number, lon: number): Promise<DeparturesResponse> => {
            const key = `departures-${lat}-${lon}`;
            return makeRequest<DeparturesResponse>(
                key,
                () => fetch(`/api/departures/nearby?lat=${lat}&lon=${lon}`),
                { timeout: 15000, retries: 2 }
            );
        },
        [makeRequest]
    );

    const fetchStationDepartures = useCallback(
        async (stationId: string): Promise<StationDeparturesResponse> => {
            const key = `station-departures-${stationId}`;
            return makeRequest<StationDeparturesResponse>(
                key,
                () => fetch(`/api/stations/${stationId}/departures`),
                { timeout: 10000, retries: 1 }
            );
        },
        [makeRequest]
    );

    const cancelAllRequests = useCallback(() => {
        activeRequests.current.clear();
    }, []);

    return {
        makeRequest,
        fetchDepartures,
        fetchStationDepartures,
        cancelAllRequests,
        activeRequestCount: () => activeRequests.current.size,
    };
};
