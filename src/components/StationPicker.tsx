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
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'border-border/90 text-card-foreground hover:text-accent-foreground hover:border-primary/40 bg-background/50 hover:bg-background max-w-full justify-between border backdrop-blur-none transition-all duration-300',
                        className
                    )}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                        <MapPin className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <span className="min-w-0 truncate font-mono text-sm tracking-wider uppercase">
                            {selectedStation?.stop_name || 'Select station...'}
                        </span>
                    </div>
                    <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="border-border/50 bg-popover/90 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0 shadow-xl backdrop-blur-xl backdrop-saturate-150"
                align="center"
                sideOffset={4}
            >
                <Command className="bg-transparent" shouldFilter={true}>
                    <CommandInput
                        placeholder="Search stations..."
                        className="text-popover-foreground placeholder-muted-foreground [&>svg]:text-muted-foreground h-10 border-none bg-transparent text-base"
                        autoFocus={false}
                        tabIndex={-1}
                    />
                    <CommandList className="bg-transparent">
                        {loading ? (
                            <div className="text-muted-foreground p-2 text-sm">
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
                                            className="text-popover-foreground hover:bg-accent/20 hover:text-accent-foreground data-[selected=true]:bg-accent/30 data-[selected=true]:text-accent-foreground flex min-w-0 items-center justify-between font-mono text-sm tracking-wide uppercase backdrop-blur-sm transition-all duration-200"
                                        >
                                            <span className="min-w-0 flex-1 truncate">
                                                {station.stop_name}
                                            </span>
                                            <Check
                                                className={cn(
                                                    'text-muted-foreground ml-auto h-4 w-4',
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
