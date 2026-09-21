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
        <header className="flex min-h-16 shrink-0 items-stretch border-b-2 border-foreground">
            <StationPicker
                selectedStation={selectedStation}
                stations={stations}
                isLoading={isStationsLoading}
                onStationSelect={onStationSelect}
                location={location}
                className="max-w-full min-w-0 flex-1 rounded-none px-4.5 py-3 has-[>svg]:px-4.5 [@media(max-width:360px)]:px-3 [@media(max-width:360px)]:text-[22px] [@media(max-width:360px)]:has-[>svg]:px-3"
            />
            {lines.length > 0 && (
                <ToggleGroup
                    className="group/filters shrink-0 items-stretch gap-0 rounded-none"
                    variant="board"
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
                            className="h-auto min-h-12 w-12 p-0"
                            aria-label={`${line} Line`}
                            title={
                                lineFilter === line
                                    ? 'Show all lines'
                                    : `Show only ${line} Line`
                            }
                        >
                            <LineBadge
                                line={line}
                                hero
                                className="group-has-[[aria-pressed=true]]/filters:in-[[aria-pressed=false]]:opacity-40"
                            />
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            )}
        </header>
    );
}
