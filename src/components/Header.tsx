import type { LocationCoordinates, Station } from '../types/departures';
import { StationPicker } from './StationPicker';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  selectedStation: Station | undefined;
  onStationSelect: (station: Station) => void;
  userLocation: LocationCoordinates | undefined;
}

export function Header({ selectedStation, onStationSelect, userLocation }: HeaderProps) {
  return (
    <div className=" relative flex items-center gap-3 border-b border-border/30 bg-gradient-to-r from-background/50 to-background/10 p-4">
      <div className="min-w-0 flex-1 overflow-hidden">
        {selectedStation
          ? (
              <StationPicker
                selectedStation={selectedStation}
                onStationSelect={onStationSelect}
                userLocation={userLocation}
                className="w-full"
              />
            )
          : (
              <div className=" flex h-8 w-full animate-pulse items-center justify-center rounded-lg bg-muted/20">
                <div className="h-4 w-32 rounded bg-muted/40"></div>
              </div>
            )}
      </div>
      <ThemeToggle />
    </div>
  );
}
