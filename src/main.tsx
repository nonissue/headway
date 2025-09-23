import type {
    Departure,
    DeparturesResponse,
    ProcessedDeparture,
    Station,
} from './types/departures';
// src/main.tsx
import { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
// import { AnimatedBackground } from './components/AnimatedBackground';
import { DeparturesTable } from './components/DeparturesTable';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ThemeProvider } from './components/theme-provider';
import './globals.css';
import { useApiRequest } from './hooks/useApiRequest';
import { useErrorHandler } from './hooks/useErrorHandler';
import { useLocationManager } from './hooks/useLocationManager';
import { convertServiceTimeToClockTime } from './lib/time-utils.js';
import { Loader2 } from 'lucide-react';

function App() {
    const [departures, setDepartures] = useState<Departure[][]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [selectedStation, setSelectedStation] = useState<
        Station | undefined
    >();
    const [userLocation, setUserLocation] = useState<
        { lat: number; lon: number } | undefined
    >();
    const [animationKey, setAnimationKey] = useState(0);

    const { error, clearError, hasError } = useErrorHandler();
    const { fetchDepartures, fetchStationDepartures } = useApiRequest();

    const handleFetchDepartures = useCallback(
        async (latitude: number, longitude: number, isRefresh = false) => {
            // Prevent multiple initial loads
            if (!isRefresh && hasInitialized) {
                return;
            }

            try {
                if (!isRefresh) {
                    setIsLoading(true);
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
                    setAnimationKey((prev) => prev + 1);
                }
                setLastUpdated(new Date());

                if (!hasInitialized) {
                    setHasInitialized(true);
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!isRefresh) {
                    setIsLoading(false);
                }
            }
        },
        [fetchDepartures, clearError, hasInitialized]
    );

    const handleFetchDeparturesForStation = useCallback(
        async (station: Station) => {
            try {
                setIsLoading(true);
                clearError();

                const data = await fetchStationDepartures(station.stop_id);

                setSelectedStation(station);
                setDepartures(data.departures);
                setLastUpdated(new Date());
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        },
        [fetchStationDepartures, clearError]
    );

    const { getUserLocationAndFetch } = useLocationManager({
        onLocationSuccess: handleFetchDepartures,
        onStatusChange: () => {},
    });

    const handleRefresh = useCallback(async () => {
        const startTime = Date.now();
        await getUserLocationAndFetch(true);

        // Ensure minimum 800ms for animation to be visible
        const elapsed = Date.now() - startTime;
        const minDuration = 800;
        if (elapsed < minDuration) {
            await new Promise((resolve) =>
                setTimeout(resolve, minDuration - elapsed)
            );
        }
    }, [getUserLocationAndFetch]);

    const processedDepartures = useMemo((): ProcessedDeparture[][] => {
        return departures.map((group) =>
            group.map((dep) => ({
                ...dep,
                displayTime: convertServiceTimeToClockTime(dep.departure_time),
            }))
        );
    }, [departures]);

    return (
        <main className="relative flex h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none font-display text-foreground sm:min-h-screen sm:overflow-visible sm:overscroll-none">
            {/* <AnimatedBackground /> */}

            <div className="relative z-10 flex h-full w-full max-w-xl animate-in flex-col px-0 duration-500 blur-in-0 sm:my-8 sm:h-auto">
                {/* Unified container with all components */}
                <div
                    className="relative flex h-full flex-col overflow-hidden border-2 border-border bg-card shadow-2xl ring-2 ring-border/40 backdrop-blur-3xl backdrop-saturate-150 sm:rounded-2xl"
                    style={{
                        boxShadow:
                            'var(--glass-shadow, 0 12px 40px rgba(0,0,0,0.15))',
                    }}
                >
                    {/* Frosted glass surface */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/5 via-foreground/5 to-foreground/5"></div>

                    {/* Inner glass reflection */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"></div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-foreground/5 to-transparent"></div>

                    {/* Liquid glass morphing highlight */}
                    <div className="pointer-events-none absolute -top-2 -right-2 h-32 w-32 animate-[morph_8s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/10 blur-2xl"></div>

                    <Header
                        selectedStation={selectedStation}
                        onStationSelect={handleFetchDeparturesForStation}
                        userLocation={userLocation}
                        isLoading={isLoading}
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

                    {isLoading ? (
                        <div className="relative flex min-h-96 items-center justify-center p-8">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="relative">
                                    <Loader2 className="h-10 w-10 animate-spin text-ring" />
                                    <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-ring/20"></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-sm font-medium text-foreground">
                                        {/* {status || 'Loading departures...'} */}
                                        Loading
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-hidden">
                                <DeparturesTable
                                    processedDepartures={processedDepartures}
                                    animationKey={animationKey}
                                />
                            </div>
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
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
