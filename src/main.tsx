// src/main.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import CreatorBadgeInline from './components/features/CreatorBadgePopover';
import { StationPicker } from './components/StationPicker';
import { ThemeProvider } from './components/theme-provider';
import { ThemeToggle } from './components/theme-toggle';
import './globals.css';
import { convertServiceTimeToClockTime } from './lib/time-utils.js';
import {
    DEFAULT_STOP_COUNT_LIMIT,
    TEST_COORDS,
    TEST_COORDS_FAR,
} from './config.js';
import { History, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/components/lib/utils';

interface Departure {
    stop_id: string;
    trip_id: string;
    stop_headsign: string;
    departure_time: string;
    departure_timestamp: number;
}

interface Station {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
}

const App = () => {
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

    const fetchDepartures = useCallback(
        async (latitude: number, longitude: number) => {
            try {
                setLoading(true);
                setUserLocation({ lat: latitude, lon: longitude });
                // setStatus('Finding nearest station...');
                const res = await fetch(
                    `/api/departures/nearby?lat=${latitude}&lon=${longitude}`
                );

                const data = await res.json();

                setSelectedStation(data.closestStation);

                setDepartures(data.departures);

                setLastUpdated(new Date());

                setStatus('');
            } catch (error) {
                setStatus('Failed to load departures.');
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const fetchDeparturesForStation = useCallback(async (station: Station) => {
        if (!station.stop_lat || !station.stop_lon) {
            setStatus('Station coordinates not available.');
            return;
        }

        try {
            setIsTransitioning(true);
            setStatus('Loading departures for selected station...');

            const res = await fetch(
                `/api/departures/nearby?lat=${station.stop_lat}&lon=${station.stop_lon}`
            );

            const data = await res.json();

            setSelectedStation(station);
            setDepartures(data.departures);
            setDeparturesKey((prev) => prev + 1); // Trigger animation
            setLastUpdated(new Date());
            setStatus('');
        } catch (error) {
            setStatus('Failed to load departures.');
        } finally {
            setIsTransitioning(false);
        }
    }, []);

    // Check location permission status
    const checkLocationPermission = useCallback(async () => {
        if (!navigator.permissions) {
            return null;
        }

        try {
            const permission = await navigator.permissions.query({
                name: 'geolocation',
            });
            return permission.state;
        } catch (error) {
            console.warn('Could not query geolocation permission:', error);
            return null;
        }
    }, []);

    const getUserLocationAndFetch = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('Geolocation is not supported by your browser.');
            return;
        }

        // Set timeout for geolocation request to avoid hanging
        const options = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0, // Always get fresh location
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.warn(
                    'main.tsx: using users location (position.coords)'
                );
                // fetchDepartures(TEST_COORDS_FAR.lat, TEST_COORDS_FAR.lon);
                fetchDepartures(latitude, longitude);
            },
            (error) => {
                console.warn('Geolocation error:', error.message);
                setStatus('Unable to retrieve your location.');
                console.warn(
                    'main.tsx: using TEST_COORDS (navigator.geolocation failed?)'
                );
                fetchDepartures(TEST_COORDS.lat, TEST_COORDS.lon);
            },
            options
        );
    }, [fetchDepartures]);

    useEffect(() => {
        const initializeLocation = async () => {
            // Check permission first
            const permissionState = await checkLocationPermission();

            if (permissionState === 'granted') {
                setStatus('Location access granted');
                getUserLocationAndFetch();
            } else if (permissionState === 'denied') {
                setStatus('Location access denied - using default location');
                fetchDepartures(TEST_COORDS.lat, TEST_COORDS.lon);
            } else {
                // prompt or not determined - try to get location
                getUserLocationAndFetch();
            }
        };

        // Initialize location on first load
        initializeLocation();

        // Refresh location when PWA becomes visible/focused
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('App became visible - refreshing location');
                initializeLocation();
            }
        };

        const handleFocus = () => {
            console.log('App focused - refreshing location');
            initializeLocation();
        };

        // Listen for visibility and focus changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
            window.removeEventListener('focus', handleFocus);
        };
    }, [getUserLocationAndFetch, checkLocationPermission, fetchDepartures]);

    // Memoize processed departures to avoid recomputing time conversions on every render
    const processedDepartures = useMemo(() => {
        return departures.map((group) =>
            group.map((dep) => ({
                ...dep,
                displayTime: convertServiceTimeToClockTime(dep.departure_time),
            }))
        );
    }, [departures]);

    return (
        <main className="text-foreground font-display relative flex min-h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none px-4 sm:min-h-screen sm:overflow-visible sm:overscroll-none">
            {/* Animated background elements */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="from-foreground/10 to-accent/10 absolute top-1/4 left-1/4 h-96 w-96 scale-200 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-r via-transparent blur-3xl"></div>
                <div className="from-accent/5 to-primary/5 absolute right-1/4 bottom-1/4 h-80 w-80 scale-200 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-l blur-3xl delay-200"></div>
                <div className="from-muted/10 to-primary/10 absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 scale-[400%] transform animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-gradient-to-br blur-2xl delay-500"></div>
            </div>

            <div className="animate-in blur-in-20 relative z-10 my-6 w-full max-w-xl px-4 duration-500 sm:my-8">
                {/* Unified container with all components */}
                <div className="border-border/70 bg-card/80 shadow-primary/5 relative overflow-hidden rounded-lg border-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150">
                    {/* Glass effect overlay */}
                    <div className="from-background/5 to-muted/20 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent"></div>

                    {/* Header section */}
                    <div className="border-border/30 from-background/50 to-background/10 relative flex items-center gap-3 border-b bg-gradient-to-r p-4">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            {selectedStation ? (
                                <StationPicker
                                    selectedStation={selectedStation}
                                    onStationSelect={fetchDeparturesForStation}
                                    userLocation={userLocation}
                                    className="w-full"
                                />
                            ) : (
                                <div className="bg-muted/20 flex h-8 w-full animate-pulse items-center justify-center rounded-lg">
                                    <div className="bg-muted/40 h-4 w-32 rounded"></div>
                                </div>
                            )}
                        </div>
                        <ThemeToggle />
                    </div>
                    {loading || isTransitioning ? (
                        <div className="relative">
                            {/* Enhanced loading skeleton */}
                            <div className="divide-border/20 relative space-y-0 divide-y">
                                {[...Array(2)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="relative flex w-full items-stretch"
                                    >
                                        <div className="border-border/20 from-primary/5 to-accent/5 relative flex min-h-32 w-10 flex-col items-center justify-center border-r border-b-0 border-solid bg-gradient-to-b">
                                            <span className="text-accent/60 rotate-[-90deg] text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase">
                                                Platform {i + 1}
                                            </span>
                                        </div>
                                        <div className="divide-border/10 flex-1 divide-y divide-dotted">
                                            <div className="text-accent from-primary/10 grid grid-cols-3 gap-2 bg-gradient-to-r to-transparent px-4 py-2 text-xs font-bold tracking-wider uppercase">
                                                <span className="text-primary font-black">
                                                    Time
                                                </span>
                                                <span className="text-accent col-span-2 font-black">
                                                    Destination
                                                </span>
                                            </div>
                                            {[
                                                ...Array(
                                                    DEFAULT_STOP_COUNT_LIMIT
                                                ),
                                            ].map((_, n) => (
                                                <div
                                                    key={`${i}-${n}`}
                                                    className="grid grid-cols-3 gap-1 px-4 py-2 text-sm"
                                                >
                                                    <div className="from-muted/40 to-muted/20 my-auto h-4 animate-pulse rounded-md bg-gradient-to-r"></div>
                                                    <div className="from-muted/30 to-muted/10 col-span-2 my-auto h-4 animate-pulse rounded-md bg-gradient-to-r"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer section - integrated */}
                            <div className="border-border/30 from-muted/30 to-accent/10 relative z-10 flex items-center justify-between border-t bg-gradient-to-r p-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm">
                                        <Info className="text-primary h-3.5 w-3.5" />
                                        <span className="text-foreground hidden text-xs font-medium sm:inline">
                                            About
                                        </span>
                                    </div>
                                </div>

                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <History className="text-accent h-3.5 w-3.5" />
                                    <div className="bg-muted/40 h-4 w-16 rounded-md"></div>
                                </div>

                                <button
                                    onClick={getUserLocationAndFetch}
                                    className="from-muted/50 to-accent/20 text-foreground hover:from-accent/30 hover:to-accent/40 flex items-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-bold tracking-wider uppercase backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                                >
                                    <RefreshCw className="text-accent h-3.5 w-3.5" />
                                    <span className="font-bold">Refresh</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            key={departuresKey}
                            className={cn(
                                'relative transition-all duration-500 ease-in-out',
                                isTransitioning
                                    ? 'scale-[1] opacity-50 blur-[0px]'
                                    : 'blur-0 animate-in fade-in-0 scale-100 opacity-100 duration-700'
                            )}
                        >
                            {/* Main content area - Actual departures */}
                            <div className="divide-foreground/20 relative space-y-0 divide-y border-y">
                                {processedDepartures.map((group, idx) =>
                                    group.length == 0 ? (
                                        <></>
                                    ) : (
                                        <div
                                            key={`${departuresKey}-${idx}`}
                                            className="animate-in blur-in-0 relative flex w-full items-stretch"
                                            style={{
                                                animationDelay: `${idx * 1}ms`,
                                            }}
                                        >
                                            {/* Label column */}
                                            <div className="border-border/100 relative flex min-h-32 w-10 flex-col items-center justify-center border-r border-b-0 border-solid">
                                                <span className="text-muted-foreground rotate-[-90deg] text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase drop-shadow-xs">
                                                    Platform {idx + 1}
                                                </span>
                                            </div>

                                            {/* Content column */}
                                            <div className="divide-foreground/20 flex-1 divide-y divide-dotted">
                                                <div className="text-foreground grid grid-cols-3 gap-2 bg-transparent px-4 py-2 text-xs font-bold tracking-wider uppercase">
                                                    <span className="text-muted-foreground font-[500]">
                                                        Time
                                                    </span>
                                                    <span className="text-muted-foreground col-span-2 font-[500]">
                                                        Destination
                                                    </span>
                                                </div>
                                                {group.map((dep, i) => (
                                                    <div
                                                        key={`${departuresKey}-${idx}-${i}`}
                                                        className={cn(
                                                            'group animate-fade-in-up animate-duration-300 animate-ease-out grid grid-cols-3 gap-1 px-4 py-2 text-sm transition-all duration-200 ease-in-out',
                                                            'hover:bg-accent/20 hover:text-accent-foreground hover:cursor-pointer'
                                                        )}
                                                        style={{
                                                            animationDelay: `${idx * 100 + i * 50}ms`,
                                                        }}
                                                    >
                                                        <div className="text-primary/90 group-hover:text-accent-foreground my-auto font-mono text-xs font-[400] tracking-wider sm:text-sm">
                                                            {dep.displayTime}
                                                        </div>
                                                        <div className="text-chart-3 group-hover:text-accent-foreground font-display col-span-2 truncate text-sm font-[400] tracking-widest uppercase sm:text-base">
                                                            {dep.stop_headsign}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Footer section - integrated */}
                            {lastUpdated && (
                                <div className="border-border/30 from-muted/30 to-accent/10 relative z-10 flex items-center justify-between border-t bg-gradient-to-r p-3">
                                    {/* About button */}
                                    <div className="relative">
                                        <CreatorBadgeInline
                                            name="Andy Williams"
                                            email="andy@nonissue.org"
                                            website="https://andy.ws"
                                            github="https://github.com/nonissue/next-departures"
                                            note="Built with GTFS data; times are estimates and may change."
                                            startYear={2025}
                                            triggerLabel="About"
                                            className="bg-muted/50 rounded-lg border-0 px-3 py-2 backdrop-blur-sm"
                                        />
                                    </div>

                                    {/* Updated-at text */}
                                    <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                                        <History className="text-muted-foreground h-3.5 w-3.5" />
                                        <span className="text-primary font-mono font-[500]">
                                            {lastUpdated?.toLocaleTimeString(
                                                [],
                                                {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false,
                                                }
                                            )}
                                        </span>
                                    </div>

                                    {/* Refresh button */}
                                    <button
                                        onClick={getUserLocationAndFetch}
                                        className="from-muted/50 to-accent/20 text-foreground hover:from-accent/30 hover:to-accent/40 flex items-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-bold tracking-wider uppercase backdrop-blur-sm transition-all duration-300"
                                    >
                                        <RefreshCw className="text-accent-foreground h-3.5 w-3.5 transition-transform duration-300 hover:rotate-180" />
                                        <span className="font-[500]">
                                            Refresh
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
