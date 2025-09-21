import { StationPicker } from './StationPicker';
import { ThemeToggle } from './theme-toggle';

interface Station {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
}

interface HeaderProps {
    selectedStation: Station | undefined;
    onStationSelect: (station: Station) => void;
    userLocation: { lat: number; lon: number } | undefined;
}

export const Header = ({ selectedStation, onStationSelect, userLocation }: HeaderProps) => {
    return (
        <div className="border-border/30 from-background/50 to-background/10 relative flex items-center gap-3 border-b bg-gradient-to-r p-4">
            <div className="min-w-0 flex-1 overflow-hidden">
                {selectedStation ? (
                    <StationPicker
                        selectedStation={selectedStation}
                        onStationSelect={onStationSelect}
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
    );
};