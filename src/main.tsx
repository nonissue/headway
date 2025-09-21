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
import { History, RefreshCw } from 'lucide-react';

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
    const [selectedStation, setSelectedStation] = useState<Station | undefined>();
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | undefined>();

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

    const fetchDeparturesForStation = useCallback(
        async (station: Station) => {
            if (!station.stop_lat || !station.stop_lon) {
                setStatus('Station coordinates not available.');
                return;
            }

            try {
                setLoading(true);
                setStatus('Loading departures for selected station...');

                const res = await fetch(
                    `/api/departures/nearby?lat=${station.stop_lat}&lon=${station.stop_lon}`
                );

                const data = await res.json();

                setSelectedStation(station);

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
            document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        <main className="flex min-h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none bg-background px-4 font-mono text-foreground sm:min-h-screen sm:overflow-visible sm:overscroll-auto">
            <div className="my-10 w-full max-w-xl px-4 sm:my-12">
                <div className={`${loading && 'animate-pulse'}`}>
                    <div className="rounded-xs border-2 border-b-0 border-border bg-card p-4">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs tracking-widest text-muted-foreground uppercase">
                                {selectedStation ? 'Station:' : 'Loading'}
                            </span>
                            <ThemeToggle />
                        </div>

                        <div className="text-center">
                            {selectedStation ? (
                                <StationPicker
                                    selectedStation={selectedStation}
                                    onStationSelect={fetchDeparturesForStation}
                                    userLocation={userLocation}
                                    className="w-full"
                                />
                            ) : (
                                <div className="font-mono text-xl font-semibold tracking-wider text-foreground uppercase drop-shadow-lg sm:text-xl">
                                    Loading
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="animate-pulse">
                        {/* Loading skeleton */}
                        <div className="space-y-0 divide-y-2 divide-border border-2 border-border bg-muted/10">
                            {[...Array(2)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex w-full items-stretch divide-y divide-dotted divide-border/30"
                                >
                                    <div className="relative flex min-h-40 w-8 flex-col items-center justify-center border-r border-b-0 border-solid border-border">
                                        <span className="sm:text-md rotate-[-90deg] text-xs font-light tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                                            Platform {i + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 divide-y divide-dotted divide-border/20 bg-card/70 text-foreground">
                                        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-foreground uppercase sm:text-sm">
                                            <span>Time</span>
                                            <span className="col-span-2">
                                                Destination
                                            </span>
                                        </div>
                                        {[
                                            ...Array(DEFAULT_STOP_COUNT_LIMIT),
                                        ].map((_, n) => (
                                            <div
                                                key={`${n}-${n}`}
                                                className="grid grid-cols-3 gap-1 px-4 py-1 text-sm transition-all duration-150 ease-in-out hover:cursor-pointer hover:bg-accent hover:text-accent-foreground sm:py-2 sm:text-sm"
                                            >
                                                <div className="my-auto h-5 bg-muted/50 font-mono tracking-wide text-foreground"></div>
                                                <div className="col-span-2 h-5 truncate bg-muted/50 font-normal tracking-wide text-foreground uppercase"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-0 sm:px-0">
                            <div className="flex items-center justify-between rounded-b-xs border-2 border-t-0 border-border bg-card text-card-foreground">
                                <span className="w-full text-center text-xs font-semibold uppercase sm:px-4 sm:text-left sm:text-sm">
                                    <div className="h-5 bg-muted/50 font-normal text-muted-foreground"></div>
                                </span>
                                <button
                                    onClick={getUserLocationAndFetch}
                                    className="flex items-center gap-x-3 border-l-0 border-border bg-muted px-4 py-2 text-xs tracking-wide text-foreground uppercase transition hover:cursor-pointer hover:bg-accent hover:text-accent-foreground sm:py-3 sm:text-base"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-foreground">
                                        Refresh
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in-5 duration-[0.1s]">
                        <div className="space-y-0 divide-y-2 divide-border border-2 border-border bg-muted/10">
                            {processedDepartures.map((group, idx) =>
                                group.length == 0 ? (
                                    <></>
                                ) : (
                                    <div
                                        key={idx}
                                        className="flex w-full items-stretch divide-y divide-dotted divide-border/30"
                                    >
                                        {/* Label column */}
                                        <div className="relative flex min-h-40 w-8 flex-col items-center justify-center border-r border-b-0 border-solid border-border">
                                            <span className="sm:text-md rotate-[-90deg] text-xs font-light tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                                                Platform {idx + 1}
                                            </span>
                                        </div>

                                        {/* Content column */}
                                        <div className="flex-1 divide-y divide-dotted divide-border/20 bg-card/70 text-foreground">
                                            <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-foreground uppercase sm:text-sm">
                                                <span>Time</span>
                                                <span className="col-span-2">
                                                    Destination
                                                </span>
                                            </div>
                                            {group.map((dep, i) => (
                                                <div
                                                    key={`${idx}-${i}`}
                                                    className="grid grid-cols-3 gap-1 px-4 py-1 text-sm transition-all duration-150 ease-in-out hover:cursor-pointer hover:bg-accent hover:text-accent-foreground sm:py-2 sm:text-sm"
                                                >
                                                    <div className="my-auto font-mono tracking-wide text-foreground">
                                                        {dep.displayTime}
                                                    </div>
                                                    <div className="col-span-2 truncate font-normal tracking-wide text-foreground uppercase">
                                                        {dep.stop_headsign}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>

                        {/* LAST REFRESH TIME AND REFRESH BUTTON */}
                        <div className="flex flex-row text-xs sm:text-sm">
                            {lastUpdated && (
                                <div className="flex w-full items-stretch justify-between rounded-b-xs border-2 border-t-0 border-border bg-card tracking-wide text-card-foreground">
                                    {/* About button FIRST */}
                                    <CreatorBadgeInline
                                        name="Andy Williams"
                                        email="andy@nonissue.org"
                                        website="https://andy.ws"
                                        github="https://github.com/nonissue/next-departures"
                                        note="Built with GTFS data; times are estimates and may change."
                                        startYear={2025}
                                        triggerLabel="About"
                                        // withBackdrop
                                    />

                                    {/* Updated-at text in the middle */}
                                    {/* Center: Updated block fills space */}
                                    <div className="flex items-center justify-center gap-x-1.5 uppercase sm:px-4 sm:py-3">
                                        <History className="h-3.5 w-3.5 text-muted-foreground" />

                                        {lastUpdated?.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit', // remove if you want HH:mm
                                            hour12: false,
                                        })}
                                    </div>

                                    {/* Refresh button LAST */}
                                    <button
                                        onClick={getUserLocationAndFetch}
                                        className="flex items-center gap-x-3 border-l border-border bg-muted px-4 py-2 tracking-wide text-foreground uppercase transition hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 text-foreground" />
                                        <span className="text-foreground">
                                            Refresh
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
    </ThemeProvider>
);
