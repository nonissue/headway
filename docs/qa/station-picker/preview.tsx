// Development-only preview: real picker, fixed example location near Corona.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/globals.css';
import { StationPicker } from '../../../src/components/StationPicker';
import { ThemeProvider } from '../../../src/components/theme-provider';
import { Footer } from '../../../src/components/Footer';
import { TEST_COORDS } from '../../../src/config';
import type { Station, StationsResponse } from '../../../src/types/departures';

function Preview() {
    const [stations, setStations] = useState<Station[]>([]);
    const [selected, setSelected] = useState<Station>();
    const [error, setError] = useState(false);

    async function loadStations() {
        setError(false);
        try {
            const response = await fetch('/api/stations');
            if (!response.ok) throw new Error('Could not load stations');
            const data: StationsResponse = await response.json();
            setStations(data.stations);
            setSelected(
                (current) =>
                    current ??
                    data.stations.find((station) => station.stop_id === 'Q7007')
            );
        } catch {
            setError(true);
        }
    }

    useEffect(() => {
        void loadStations();
    }, []);

    return (
        <main className="mx-auto flex h-full max-w-160 flex-col bg-background text-foreground sm:border-x">
            <header className="border-b-2 border-foreground px-4.5 py-3">
                <StationPicker
                    stations={stations}
                    selectedStation={selected}
                    isLoading={!stations.length && !error}
                    onStationSelect={setSelected}
                    location={TEST_COORDS}
                />
            </header>
            <div className="flex-1 px-4.5 py-6 text-sm text-muted-foreground">
                <p>Station picker preview</p>
                <p className="mt-2">
                    Tap the station name to open. Distances use a fixed example
                    location near Corona.
                </p>
                {error && (
                    <p role="alert" className="mt-2">
                        Could not load stations. Use refresh to retry.
                    </p>
                )}
            </div>
            <Footer onRefresh={loadStations} />
        </main>
    );
}

createRoot(document.getElementById('root')!).render(
    <ThemeProvider
        defaultTheme="light"
        storageKey="headway-picker-preview-theme"
    >
        <Preview />
    </ThemeProvider>
);
