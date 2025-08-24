// src/main.tsx
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import CreatorBadgeInline from './components/features/CreatorBadgePopover';
import './style.css';
import { convertServiceTimeToClockTime } from './lib/time-utils.js';
import { DEFAULT_STOP_COUNT_LIMIT, TEST_COORDS } from './config.js';
import { History, RefreshCw } from 'lucide-react';

interface Departure {
    stop_id: string;
    trip_id: string;
    stop_headsign: string;
    departure_time: string;
    departure_timestamp: number;
}

const App = () => {
    const [status, setStatus] = useState('Requesting location');

    const [stationName, setStationName] = useState('');
    const [departures, setDepartures] = useState<Departure[][]>([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchDepartures = async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            // setStatus('Finding nearest station...');
            const res = await fetch(
                `/api/departures/nearby?lat=${latitude}&lon=${longitude}`
            );

            const data = await res.json();

            setStationName(data.closestStation.stop_name);

            setDepartures(data.departures);

            setLastUpdated(new Date());

            setStatus('');
        } catch (error) {
            setStatus('Failed to load departures.');
        } finally {
            setLoading(false);
        }
    };

    const getUserLocationAndFetch = () => {
        if (!navigator.geolocation) {
            setStatus('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.warn(
                    'main.tsx: using users location (position.coords)'
                );
                fetchDepartures(latitude, longitude);
                // fetchDepartures(TEST_COORDS.lat, TEST_COORDS.lon);
            },
            () => {
                setStatus('Unable to retrieve your location.');
                console.warn(
                    'main.tsx: using TEST_COORDS (navigator.geolocation failed?)'
                );
                fetchDepartures(TEST_COORDS.lat, TEST_COORDS.lon);
            }
        );
    };

    useEffect(() => {
        getUserLocationAndFetch();
    }, []);

    return (
        <main className="flex min-h-dvh w-full flex-col items-center justify-start overflow-y-auto overscroll-none bg-gradient-to-bl from-zinc-950 via-zinc-950 to-zinc-950 px-4 font-mono text-white sm:min-h-screen sm:overflow-visible sm:overscroll-auto">
            <div className="my-10 w-full max-w-xl px-4">
                <div className={`${loading && 'animate-pulse'}`}>
                    <div className="rounded-xs border-2 border-b-0 border-zinc-700 bg-zinc-800/70 p-4">
                        <div className="flex flex-col gap-y-1 text-center sm:gap-y-1">
                            <span className="relative bg-gradient-to-r from-gray-700/0 via-zinc-700/0 to-gray-800/0 text-xs tracking-widest text-orange-300 uppercase">
                                {stationName ? 'Closest Station: ' : 'Loading'}
                            </span>

                            <div className="font-mono text-xl font-semibold tracking-wider text-orange-200 uppercase drop-shadow-lg sm:text-xl">
                                {stationName ? stationName : 'Loading'}
                            </div>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="animate-pulse">
                        <div className="space-y-0 divide-y-2 divide-orange-400/50 border-2 border-orange-400/50 bg-orange-100/10">
                            {[...Array(2)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex w-full items-stretch divide-y divide-dotted divide-orange-300/30"
                                >
                                    <div className="relative flex min-h-40 w-8 flex-col items-center justify-center border-r border-b-0 border-solid border-zinc-800">
                                        <span className="sm:text-md rotate-[-90deg] text-xs font-light tracking-widest whitespace-nowrap text-amber-100/90 uppercase">
                                            Platform {i + 1}
                                        </span>
                                    </div>
                                    <div className="flex-1 divide-y divide-dotted divide-orange-100/20 bg-zinc-950/70 text-orange-300">
                                        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-orange-300 uppercase sm:text-sm">
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
                                                className="grid grid-cols-3 gap-1 px-4 py-1 text-sm transition-all duration-150 ease-in-out hover:cursor-pointer hover:bg-zinc-900 hover:text-black sm:py-2 sm:text-sm"
                                            >
                                                <div className="my-auto h-5 bg-zinc-700/50 font-mono tracking-wide text-orange-100"></div>
                                                <div className="col-span-2 h-5 truncate bg-zinc-700/50 font-normal tracking-wide text-orange-100 uppercase"></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-0 sm:px-0">
                            <div className="flex items-center justify-between rounded-b-xs border-2 border-t-0 border-zinc-700 bg-zinc-900 text-orange-100/90">
                                <span className="w-full text-center text-xs font-semibold uppercase sm:px-4 sm:text-left sm:text-sm">
                                    <div className="h-5 bg-zinc-600/50 font-normal text-orange-100/70"></div>
                                </span>
                                <button
                                    onClick={getUserLocationAndFetch}
                                    className="flex items-center gap-x-3 border-l-0 border-zinc-700 bg-zinc-800 px-4 py-2 text-xs tracking-wide text-orange-300 uppercase transition hover:cursor-pointer hover:bg-orange-500 hover:text-black sm:py-3 sm:text-base"
                                >
                                    <RefreshCw className="h-3.5 w-3.5 text-amber-300" />
                                    <span className="text-amber-200">
                                        Refresh
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in-5 duration-[0.1s]">
                        <div className="space-y-0 divide-y-2 divide-orange-400/50 border-2 border-orange-400/50 bg-orange-100/10">
                            {departures.map((group, idx) =>
                                group.length == 0 ? (
                                    <></>
                                ) : (
                                    <div
                                        key={idx}
                                        className="flex w-full items-stretch divide-y divide-dotted divide-orange-300/30"
                                    >
                                        {/* Label column */}
                                        <div className="relative flex min-h-40 w-8 flex-col items-center justify-center border-r border-b-0 border-solid border-zinc-800">
                                            <span className="sm:text-md rotate-[-90deg] text-xs font-light tracking-widest whitespace-nowrap text-amber-100/90 uppercase">
                                                Platform {idx + 1}
                                            </span>
                                        </div>

                                        {/* Content column */}
                                        <div className="flex-1 divide-y divide-dotted divide-orange-100/20 bg-zinc-950/70 text-orange-300">
                                            <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-orange-300 uppercase sm:text-sm">
                                                <span>Time</span>
                                                <span className="col-span-2">
                                                    Destination
                                                </span>
                                            </div>
                                            {group.map((dep, i) => (
                                                <div
                                                    key={`${idx}-${i}`}
                                                    className="grid grid-cols-3 gap-1 px-4 py-1 text-sm transition-all duration-150 ease-in-out hover:cursor-pointer hover:bg-zinc-900 hover:text-black sm:py-2 sm:text-sm"
                                                >
                                                    <div className="my-auto font-mono tracking-wide text-orange-100">
                                                        {convertServiceTimeToClockTime(
                                                            dep.departure_time
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 truncate font-normal tracking-wide text-orange-100 uppercase">
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
                                <div className="flex w-full items-stretch justify-between rounded-b-xs border-2 border-t-0 border-zinc-700 bg-zinc-900 tracking-wide text-orange-100/90">
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
                                        <History className="h-3.5 w-3.5 text-zinc-400" />

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
                                        className="flex items-center gap-x-3 border-l border-zinc-700 bg-zinc-800 px-4 py-2 tracking-wide text-orange-300 uppercase transition hover:bg-orange-500 hover:text-black"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 text-amber-100" />
                                        <span className="text-amber-200">
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

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
