import type {
    Departure,
    DeparturesResponse,
    ProcessedDeparture,
    Station,
} from './types/departures';
// src/main.tsx
import { useCallback, useMemo, useState, useTransition } from 'react';
import ReactDOM from 'react-dom/client';
import { DeparturesTable } from './components/DeparturesTable';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ThemeProvider } from './components/theme-provider';
import { useApiRequest } from './hooks/useApiRequest';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useLocationManager } from './hooks/useLocationManager';
import { convertServiceTimeToClockTime } from './lib/time-utils.js';
import './globals.css';

function App() {
    const [status, setStatus] = useState('Requesting location');

    const [departures, setDepartures] = useState<Departure[][]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStation, setSelectedStation] = useState<
        Station | undefined
    >();
    const [userLocation, setUserLocation] = useState<
        { lat: number; lon: number } | undefined
    >();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [departuresKey, setDeparturesKey] = useState(0);
    const [isRefreshing, startRefreshTransition] = useTransition();

    const { error, clearError, hasError } = useErrorHandler();
    const { fetchDepartures, fetchStationDepartures } = useApiRequest();

    const handleFetchDepartures = useCallback(
        async (latitude: number, longitude: number, isRefresh = false) => {
            try {
                if (!isRefresh) {
                    setLoading(true);
                }
                clearError();
                setUserLocation({ lat: latitude, lon: longitude });

                const data: DeparturesResponse = await fetchDepartures(
                    latitude,
                    longitude
                );

                setSelectedStation(data.closestStation);
                setDepartures(data.departures);
                if (isRefresh) {
                    setDeparturesKey((prev) => prev + 1);
                }
                setLastUpdated(new Date());
                setStatus('');
            } catch (error) {
                setStatus('Failed to load departures.');
                console.error(error);
            } finally {
                if (!isRefresh) {
                    setLoading(false);
                }
            }
        },
        [fetchDepartures, clearError]
    );

    const handleFetchDeparturesForStation = useCallback(
        async (station: Station) => {
            try {
                setIsTransitioning(true);
                clearError();
                setStatus('Loading departures for selected station...');

                const data = await fetchStationDepartures(station.stop_id);

                setSelectedStation(station);
                setDepartures(data.departures);
                setDeparturesKey((prev) => prev + 1);
                setLastUpdated(new Date());
                setStatus('');
            } catch (error) {
                setStatus('Failed to load departures.');
                console.error(error);
            } finally {
                setIsTransitioning(false);
            }
        },
        [fetchStationDepartures, clearError]
    );

    const { getUserLocationAndFetch } = useLocationManager({
        onLocationSuccess: handleFetchDepartures,
        onStatusChange: setStatus,
    });

    const handleRefresh = useCallback(() => {
        startRefreshTransition(() => {
            getUserLocationAndFetch(true);
        });
    }, [getUserLocationAndFetch, startRefreshTransition]);

    const processedDepartures = useMemo((): ProcessedDeparture[][] => {
        return departures.map((group) =>
            group.map((dep) => ({
                ...dep,
                displayTime: convertServiceTimeToClockTime(dep.departure_time),
            }))
        );
    }, [departures]);

    return (
        <main className="relative flex min-h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none px-4 font-display text-foreground sm:min-h-screen sm:overflow-visible sm:overscroll-none">
            {/* Animated background elements */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 scale-200 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-foreground/10 via-transparent to-accent/10 blur-3xl"></div>
                <div className="absolute right-1/4 bottom-1/4 h-80 w-80 scale-200 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-l from-accent/5 to-primary/5 blur-3xl delay-200"></div>
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 scale-[400%] transform animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-muted/10 to-primary/10 blur-2xl delay-500"></div>
            </div>

            <div className="relative z-10 my-6 w-full max-w-xl animate-in px-4 duration-500 blur-in-20 sm:my-8">
                {/* Unified container with all components */}
                <div className="relative overflow-hidden rounded-lg border-2 border-border/70 bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur-xl backdrop-saturate-150">
                    {/* Glass effect overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/5 via-transparent to-muted/20"></div>

                    {/* Refresh indicator overlay */}
                    {isRefreshing && (
                        <div className="absolute top-2 right-2 z-20 rounded-md bg-blue-500/90 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
                            🔄 Refreshing...
                        </div>
                    )}

                    <Header
                        selectedStation={selectedStation}
                        onStationSelect={handleFetchDeparturesForStation}
                        userLocation={userLocation}
                    />
                    {hasError && (
                        <div className="relative border-l-4 border-red-500 bg-red-50 p-4 text-center text-blue-400 dark:bg-red-900/20">
                            <div className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                                {error?.message}
                            </div>
                            <button
                                type="button"
                                onClick={clearError}
                                className="text-xs text-red-600 underline hover:text-red-400 hover:no-underline dark:text-red-400"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {loading || isTransitioning ? (
                        <div className="relative min-h-96 p-8 text-center">
                            <div className="text-sm text-muted-foreground">
                                {status
                                    ? 'Loading closest departures...'
                                    : 'Loading departures...'}
                            </div>
                        </div>
                    ) : (
                        <>
                            <DeparturesTable
                                processedDepartures={processedDepartures}
                                departuresKey={departuresKey}
                                isTransitioning={isTransitioning}
                                isRefreshing={isRefreshing}
                            />
                            <Footer
                                lastUpdated={lastUpdated}
                                onRefresh={handleRefresh}
                            />
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
