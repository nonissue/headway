import type { LocationCoordinates, Station } from '../types/departures';
import { StationPicker } from './StationPicker';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
    selectedStation: Station | undefined;
    onStationSelect: (station: Station) => void;
    userLocation: LocationCoordinates | undefined;
    isLoading?: boolean;
}

export function Header({
    selectedStation,
    onStationSelect,
    userLocation,
    isLoading = false,
}: HeaderProps) {
    return (
        <div className="relative flex items-center gap-3 border-b border-l-4 border-border/50 border-l-foreground/20 bg-gradient-to-b from-foreground/[8%] via-foreground/[5%] to-foreground/[2%] p-4 shadow-sm backdrop-blur-md">
            {/* <div className="flex h-full items-center justify-center rounded-md border border-foreground/10 bg-foreground/30 px-2 text-foreground shadow-xs">
                <TrainFrontTunnel className="h-4 w-4" />
                <span className="hidden sm:block"> Headway</span>
            </div> */}
            <div className="min-w-0 flex-1 overflow-hidden">
                {selectedStation ? (
                    <StationPicker
                        selectedStation={selectedStation}
                        onStationSelect={onStationSelect}
                        userLocation={userLocation}
                        className="w-full"
                    />
                ) : (
                    <div className="flex h-8 w-full animate-pulse items-center justify-center rounded-lg bg-muted/20">
                        <div className="h-4 w-32 rounded bg-muted/40"></div>
                    </div>
                )}
            </div>
            {isLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-md bg-muted/40"></div>
            ) : (
                <ThemeToggle />
            )}
        </div>
    );
}
