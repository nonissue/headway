// src/main.tsx
import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// import { AnimatedBackground } from './components/AnimatedBackground';
import { DeparturesTable } from './components/DeparturesTable';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ThemeProvider } from './components/theme-provider';
import './globals.css';
import { useDeparturesApp } from './hooks/useDeparturesApp';
import { Loader2 } from 'lucide-react';

const ANALYTICS_SCRIPT_ID = 'headway-analytics';
const UMAMI_WEBSITE_ID = 'aac8d5e9-5e2d-4107-8844-f484b9e45eb2';

function App() {
    const {
        animationKey,
        clearError,
        error,
        hasError,
        isLoading,
        lastUpdated,
        processedDepartures,
        refresh,
        selectedStation,
        selectStation,
        userLocation,
    } = useDeparturesApp();

    useEffect(() => {
        if (document.getElementById(ANALYTICS_SCRIPT_ID)) {
            return;
        }

        const script = document.createElement('script');
        script.id = ANALYTICS_SCRIPT_ID;
        script.defer = true;
        script.src = '/stats.js';
        script.dataset.websiteId = UMAMI_WEBSITE_ID;
        document.head.appendChild(script);
    }, []);

    return (
        <main className="relative flex h-dvh w-full flex-col items-center justify-start overflow-hidden overscroll-none font-display text-foreground sm:min-h-screen sm:overflow-visible sm:overscroll-none">
            {/* <AnimatedBackground /> */}

            <div className="relative z-10 flex h-full w-full max-w-xl flex-col px-0 sm:my-8 sm:h-auto">
                {/* Unified container with all components */}
                <div
                    className="relative flex h-full flex-col overflow-hidden border-0 border-border shadow-2xl ring-2 ring-border/40 backdrop-blur-3xl backdrop-saturate-150 sm:rounded-md sm:border-2"
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
                    {/* <div className="pointer-events-none absolute -top-1/2 -right-1/2 h-[200vh] w-[200vw] animate-[morph_24s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-10 blur-sm dark:opacity-10"></div> */}
                    {/* <div className="pointer-events-none absolute -bottom-1/2 -left-1/2 h-[100vh] w-[100vw] animate-[morph_24s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-10 blur-sm dark:opacity-10"></div> */}
                    {/* <div className="pointer-events-none absolute top-0 -right-1/6 h-[100vh] w-[100vw] scale-100 rounded-full bg-gradient-to-br from-blue-400/20 to-sky-500/10 opacity-20 blur-2xl dark:opacity-10"></div> */}
                    {/* <div className="pointer-events-none absolute -bottom-1/2 left-0 h-[200vh] w-[200vw] animate-[morph_24s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-400/50 to-indigo-400/50 opacity-40 blur-2xl dark:opacity-20"></div> */}

                    <Header
                        selectedStation={selectedStation}
                        onStationSelect={selectStation}
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
                                    <div className="absolute inset-0 h-10 w-10 rounded-full"></div>
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
                                onRefresh={refresh}
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
