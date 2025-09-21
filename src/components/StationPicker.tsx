import * as React from 'react';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Station {
    stop_id: string;
    stop_name: string;
    stop_lat?: number;
    stop_lon?: number;
}

interface StationPickerProps {
    selectedStation?: Station;
    onStationSelect: (station: Station) => void;
    userLocation?: { lat: number; lon: number };
    className?: string;
}

export function StationPicker({
    selectedStation,
    onStationSelect,
    userLocation,
    className,
}: StationPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [stations, setStations] = React.useState<Station[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStations = async () => {
            try {
                setLoading(true);

                // Build URL with optional coordinates for distance-based sorting
                let url = '/api/stations';
                if (userLocation && userLocation.lat && userLocation.lon) {
                    url += `?lat=${userLocation.lat}&lon=${userLocation.lon}`;
                }

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setStations(data.stations || []);
            } catch (error) {
                console.error('Failed to fetch stations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    }, [userLocation]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'justify-between bg-card border-border text-card-foreground hover:bg-accent hover:text-accent-foreground',
                        className
                    )}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono text-sm font-semibold tracking-wider uppercase">
                            {selectedStation?.stop_name || 'Select station...'}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] border-border bg-popover p-0"
                align="center"
                sideOffset={0}
            >
                <Command className="bg-popover">
                    <CommandInput
                        placeholder="Search stations..."
                        className="h-9 border-none bg-popover text-popover-foreground placeholder-muted-foreground [&>svg]:text-muted-foreground"
                    />
                    <CommandList className="bg-popover">
                        {loading ? (
                            <div className="p-2 text-sm text-muted-foreground">
                                Loading stations...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="text-muted-foreground">
                                    No station found.
                                </CommandEmpty>
                                <CommandGroup>
                                    {stations.map((station) => (
                                        <CommandItem
                                            key={station.stop_id}
                                            value={station.stop_name}
                                            onSelect={() => {
                                                onStationSelect(station);
                                                setOpen(false);
                                            }}
                                            className="font-mono text-sm tracking-wide text-popover-foreground uppercase hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                                        >
                                            {station.stop_name}
                                            <Check
                                                className={cn(
                                                    'ml-auto h-4 w-4 text-muted-foreground',
                                                    selectedStation?.stop_id ===
                                                        station.stop_id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
