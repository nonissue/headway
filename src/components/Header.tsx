import { Circle } from 'lucide-react';
import { StationPicker } from './StationPicker';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { LocationCoordinates, Station } from '../types/departures';

interface HeaderProps {
    stations: Station[];
    selectedStation?: Station;
    isStationsLoading?: boolean;
    onStationSelect: (station: Station) => void;
    isLoading?: boolean;
    location?: LocationCoordinates;
    lines?: string[];
    lineFilter?: string;
    onLineFilterChange?: (line: string) => void;
}

export function Header({
    stations,
    selectedStation,
    isStationsLoading,
    onStationSelect,
    location,
    lines = [],
    lineFilter = 'all',
    onLineFilterChange,
}: HeaderProps) {
    return (
        <header className="departures-header">
            <StationPicker
                selectedStation={selectedStation}
                stations={stations}
                isLoading={isStationsLoading}
                onStationSelect={onStationSelect}
                location={location}
                className="max-w-full min-w-0"
            />
            {lines.length > 0 && (
                <ToggleGroup
                    className="line-filters"
                    variant="outline"
                    spacing={1}
                    value={[lineFilter]}
                    onValueChange={(values) =>
                        onLineFilterChange?.(String(values[0] ?? 'all'))
                    }
                    aria-label="Filter departures by line"
                >
                    <ToggleGroupItem value="all" aria-label="All lines">
                        All
                    </ToggleGroupItem>
                    {lines.map((line) => (
                        <ToggleGroupItem
                            key={line}
                            value={line}
                            aria-label={`${line} Line`}
                            title={`${line} Line`}
                        >
                            <Circle
                                className="line-filter-dot"
                                data-line={line.toLowerCase()}
                                aria-hidden="true"
                            />
                            {line.charAt(0)}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            )}
        </header>
    );
}
