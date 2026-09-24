// src/main.tsx
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DeparturesTable } from './components/DeparturesTable';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ThemeProvider } from './components/theme-provider';
import './globals.css';
import { useDeparturesApp } from './hooks/useDeparturesApp';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertAction } from './components/ui/alert';
import { Skeleton } from './components/ui/skeleton';
import { Button } from './components/ui/button';
import { useNow } from './hooks/useNow';
import { toast, Toaster } from './components/ui/toast';

const ANALYTICS_SCRIPT_ID = 'headway-analytics';
const UMAMI_WEBSITE_ID = 'aac8d5e9-5e2d-4107-8844-f484b9e45eb2';
const appRoots: WeakMap<HTMLElement, ReactDOM.Root> =
    import.meta.hot?.data?.appRoots ?? new WeakMap();
if (import.meta.hot?.data) import.meta.hot.data.appRoots = appRoots;

export function App() {
    const {
        nextServiceAt,
        animationKey,
        clearError,
        departureGroups,
        error,
        hasError,
        isLoading,
        isRefreshing,
        isStationsLoading,
        refresh,
        selectedStation,
        selectStation,
        stations,
        deviceLocation,
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

    const now = useNow();
    async function handleRefresh() {
        toast.close('departures-refresh');
        if (await refresh()) {
            toast.add({
                id: 'departures-refresh',
                title: 'Departures refreshed.',
                type: 'success',
                timeout: 3000,
            });
        }
    }
    const [filter, setFilter] = useState({ stationId: '', line: 'all' });
    const lines = [
        ...new Set([
            ...(stations.find(
                (station) => station.stop_id === selectedStation?.stop_id
            )?.lines ?? []),
            ...departureGroups.flatMap((group) =>
                group.departures.flatMap((departure) =>
                    departure.line ? [departure.line] : []
                )
            ),
        ]),
    ].sort();
    const lineFilter =
        filter.stationId === selectedStation?.stop_id &&
        lines.includes(filter.line)
            ? filter.line
            : 'all';

    return (
        <main className='mx-auto flex h-full w-full max-w-[640px] flex-col overflow-hidden bg-background [font-feature-settings:"tnum"] sm:border-x'>
            <Header
                stations={stations}
                selectedStation={selectedStation}
                isStationsLoading={isStationsLoading}
                onStationSelect={selectStation}
                isLoading={isLoading}
                location={deviceLocation}
                lines={lines}
                lineFilter={lineFilter}
                onLineFilterChange={(line) =>
                    setFilter({
                        stationId: selectedStation?.stop_id ?? '',
                        line,
                    })
                }
            />
            {hasError && (
                <Alert
                    variant="destructive"
                    className="shrink-0 rounded-none border-0 border-b"
                >
                    <AlertCircle aria-hidden="true" />
                    <AlertDescription>{error?.message}</AlertDescription>
                    <AlertAction>
                        <Button variant="plain" size="sm" onClick={clearError}>
                            Dismiss
                        </Button>
                    </AlertAction>
                </Alert>
            )}
            <div
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                aria-busy={isLoading}
            >
                {isLoading ? (
                    <div className="flex h-full flex-col" role="status">
                        <span className="sr-only">Loading departures</span>
                        {[0, 1].map((pane) => (
                            <div
                                className="flex flex-1 flex-col justify-start gap-[25px] py-7 pr-4.5 pl-[52px] [&+div]:border-t"
                                key={pane}
                                aria-hidden="true"
                            >
                                <Skeleton className="h-12 w-3/4" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-4/5" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <DeparturesTable
                        key={selectedStation?.stop_id}
                        departureGroups={departureGroups}
                        animationKey={animationKey}
                        lineFilter={lineFilter}
                        now={now}
                        nextServiceAt={nextServiceAt}
                    />
                )}
            </div>
            <Footer
                onRefresh={handleRefresh}
                isRefreshing={isLoading || isRefreshing}
            />
            <Toaster />
        </main>
    );
}

export function mountApp(rootElement = document.getElementById('root')) {
    if (!rootElement) {
        return;
    }

    let root = appRoots.get(rootElement);
    if (!root) {
        root = ReactDOM.createRoot(rootElement);
        appRoots.set(rootElement, root);
    }
    root.render(
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <App />
        </ThemeProvider>
    );
}

mountApp();
