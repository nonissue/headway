import type { Station } from '../types/departures';
import { StationPicker } from './StationPicker';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
    stations: Station[];
    selectedStation: Station | undefined;
    isStationsLoading: boolean;
    onStationSelect: (station: Station) => void;
    isLoading?: boolean;
}

export function Header({
    stations,
    selectedStation,
    isStationsLoading,
    onStationSelect,
    isLoading = false,
}: HeaderProps) {
    return (
        <div className="relative flex items-center gap-3 border-b border-l-4 border-border/50 border-l-foreground/10 bg-gradient-to-t from-foreground/[8%] via-foreground/[5%] to-foreground/[2%] p-4 shadow-sm backdrop-blur-md sm:bg-gradient-to-b sm:from-foreground/[8%] sm:via-foreground/[5%] sm:to-foreground/[2%] dark:border-b-muted-foreground/30">
            {/* <div className="flex h-full items-center justify-center rounded-md border border-foreground/10 bg-foreground/30 px-2 text-foreground shadow-xs">
                <TrainFrontTunnel className="h-4 w-4" />
                <span className="hidden sm:block"> Headway</span>
            </div> */}
            <div className="min-w-0 flex-1 overflow-hidden">
                {selectedStation ? (
                    <StationPicker
                        selectedStation={selectedStation}
                        stations={stations}
                        isLoading={isStationsLoading}
                        onStationSelect={onStationSelect}
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
