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
import { Station, LocationCoordinates } from '../types/departures';

interface StationPickerProps {
    selectedStation?: Station;
    onStationSelect: (station: Station) => void;
    userLocation?: LocationCoordinates;
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
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'max-w-full justify-between border border-border bg-background/50 text-card-foreground transition-all duration-1000 hover:border-primary/40 hover:bg-background hover:text-accent-foreground',
                        className
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="min-w-0 truncate font-mono text-sm tracking-wider uppercase">
                            {selectedStation?.stop_name || 'Select station...'}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] border-border/50 bg-popover/50 p-0 shadow-xl backdrop-blur-xl"
                align="center"
                sideOffset={4}
            >
                <Command className="bg-transparent" shouldFilter={true}>
                    <CommandInput
                        placeholder="Search stations..."
                        className="h-10 border-none bg-transparent font-mono text-base text-popover-foreground placeholder-muted-foreground [&>svg]:text-muted-foreground"
                        autoFocus={false}
                        tabIndex={-1}
                    />
                    <CommandList className="bg-transparent">
                        {loading ? (
                            <div className="p-2 text-sm text-muted-foreground">
                                Loading stations...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty className="p-2 font-mono text-sm tracking-wide text-muted-foreground uppercase">
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
                                            className={cn(
                                                "flex min-w-0 items-center justify-between font-mono text-sm tracking-wide text-popover-foreground uppercase transition-all duration-200",
                                                selectedStation?.stop_id === station.stop_id
                                                    ? "bg-primary/20 hover:bg-primary/30"
                                                    : "hover:bg-accent/20 hover:text-accent-foreground"
                                            )}
                                        >
                                            <span className="min-w-0 flex-1 truncate">
                                                {station.stop_name}
                                            </span>
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
