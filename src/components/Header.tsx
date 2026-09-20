import { LineBadge } from './LineBadge';
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
                    spacing={0}
                    value={lineFilter === 'all' ? [] : [lineFilter]}
                    onValueChange={(values) =>
                        onLineFilterChange?.(String(values[0] ?? 'all'))
                    }
                    aria-label="Filter departures by line"
                >
                    {lines.map((line) => (
                        <ToggleGroupItem
                            key={line}
                            value={line}
                            aria-label={`${line} Line`}
                            title={
                                lineFilter === line
                                    ? 'Show all lines'
                                    : `Show only ${line} Line`
                            }
                        >
                            <LineBadge line={line} />
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            )}
        </header>
    );
}
