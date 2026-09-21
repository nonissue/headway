import * as React from 'react';
import { Check, ChevronDown, Search, Star, TrainFront, X } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
} from '@/components/ui/empty';
import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    FAVOURITES_KEY,
    readFavouriteStations,
    stationDistance,
    formatStationDistance,
    stationName,
} from '../lib/station-picker';
import type { Station, LocationCoordinates } from '../types/departures';

interface StationPickerProps {
    selectedStation?: Station;
    stations: Station[];
    isLoading?: boolean;
    onStationSelect: (station: Station) => void;
    className?: string;
    location?: LocationCoordinates;
}

function useDesktop() {
    const [desktop, setDesktop] = React.useState(
        () =>
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(min-width: 640px)').matches
    );
    React.useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;
        const media = window.matchMedia('(min-width: 640px)');
        const update = () => setDesktop(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);
    return desktop;
}

export function StationPicker({
    selectedStation,
    stations,
    isLoading = false,
    onStationSelect,
    className,
    location,
}: StationPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    // Base UI snap points describe the visible fraction of the viewport.
    const [snap, setSnap] = React.useState<number | string | null>(0.75);
    const [favourites, setFavourites] = React.useState(readFavouriteStations);
    const [saveError, setSaveError] = React.useState(false);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);
    const desktop = useDesktop();
    const headingId = React.useId();
    const normalized = query.trim().toLocaleLowerCase();
    const sorted = React.useMemo(
        () =>
            [...stations].sort((a, b) => {
                if (location)
                    return (
                        (stationDistance(a, location) ?? Infinity) -
                            (stationDistance(b, location) ?? Infinity) ||
                        a.stop_name.localeCompare(b.stop_name)
                    );
                return a.stop_name.localeCompare(b.stop_name);
            }),
        [stations, location]
    );
    const results = sorted.filter((station) =>
        station.stop_name.toLocaleLowerCase().includes(normalized)
    );
    const lines = [
        ...new Set(stations.flatMap((station) => station.lines ?? [])),
    ].sort();
    const savedStations = favourites
        .map((id) => stations.find((station) => station.stop_id === id))
        .filter((station): station is Station => !!station);

    function changeOpen(next: boolean) {
        setOpen(next);
        if (next) {
            setQuery('');
            setSnap(0.75);
        }
    }
    function toggleFavourite(id: string) {
        const next = favourites.includes(id)
            ? favourites.filter((value) => value !== id)
            : [...favourites, id];
        setFavourites(next);
        try {
            localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
            setSaveError(false);
        } catch {
            setSaveError(true);
        }
    }
    function select(station: Station) {
        onStationSelect(station);
        changeOpen(false);
    }
    function row(station: Station) {
        const current = station.stop_id === selectedStation?.stop_id;
        const saved = favourites.includes(station.stop_id);
        const distance = stationDistance(station, location);
        return (
            <li
                key={station.stop_id}
                className="flex items-stretch border-b px-4.5 data-current:bg-accent"
                data-current={current || undefined}
            >
                <Button
                    variant="plain"
                    className="h-auto min-h-16 min-w-0 flex-1 justify-start gap-3 rounded-none px-0 py-3 text-left whitespace-normal has-[>svg]:px-0"
                    aria-label={`Select ${station.stop_name}${current ? ', current station' : ''}`}
                    aria-description={station.lines?.join(', ')}
                    aria-current={current ? 'true' : undefined}
                    onClick={() => select(station)}
                >
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span className="text-base leading-[1.15] font-bold tracking-[-0.4px] wrap-anywhere">
                            {stationName(station)}
                            {current && (
                                <Check
                                    className="ml-1.5 inline-block align-[-2px] text-muted-foreground"
                                    aria-hidden="true"
                                />
                            )}
                        </span>
                        {distance !== undefined && (
                            <span className="text-[11px] leading-[1.3] font-medium text-muted-foreground">
                                {formatStationDistance(distance)} away
                            </span>
                        )}
                    </span>
                    <span
                        className="flex shrink-0 items-center justify-end gap-[5px]"
                        aria-hidden="true"
                    >
                        {station.lines?.length ? (
                            station.lines.map((line) => (
                                <Badge
                                    key={line}
                                    variant="outline"
                                    className="flex size-5.5 items-center justify-center rounded-full border-0 bg-muted p-0 text-xs font-bold text-foreground data-[line=capital]:bg-line-capital data-[line=capital]:text-line-on-colour data-[line=metro]:bg-line-metro data-[line=metro]:text-line-on-amber data-[line=valley]:bg-line-valley data-[line=valley]:text-line-on-colour"
                                    data-line={line.toLowerCase()}
                                >
                                    {line.charAt(0)}
                                </Badge>
                            ))
                        ) : (
                            <TrainFront />
                        )}
                    </span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 size-11 self-center rounded-none text-muted-foreground hover:text-muted-foreground aria-pressed:text-picker-gold aria-pressed:hover:text-picker-gold aria-pressed:[&_svg]:fill-current"
                    aria-label={`${saved ? 'Remove' : 'Add'} ${station.stop_name} ${saved ? 'from' : 'to'} favourites`}
                    aria-pressed={saved}
                    onClick={() => toggleFavourite(station.stop_id)}
                >
                    <Star data-icon="inline-start" className="size-[19px]" />
                </Button>
            </li>
        );
    }
    const Title = desktop ? DialogTitle : DrawerTitle;
    const Description = desktop ? DialogDescription : DrawerDescription;
    const body = (
        <>
            <div className="shrink-0 border-b px-4.5 py-4">
                <Title className="sr-only">Stations</Title>
                <Description className="sr-only">
                    Choose a station to see its departures. Save favourites for
                    quick access.
                </Description>
                <InputGroup className="h-12 min-w-0 flex-1 rounded-none bg-background shadow-none focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ring focus-within:outline-solid has-[[data-slot=input-group-control]:focus-visible]:ring-0 dark:bg-background">
                    <InputGroupInput
                        className="text-base font-medium md:text-base md:leading-[1.4285714286] [&::-webkit-search-cancel-button]:hidden"
                        ref={searchRef}
                        type="search"
                        aria-label="Search stations"
                        placeholder="Search stations"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setSnap(1)}
                        autoComplete="off"
                    />
                    <InputGroupAddon>
                        <Search aria-hidden="true" />
                    </InputGroupAddon>
                    {query && (
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                size="icon-sm"
                                className="size-11"
                                aria-label="Clear search"
                                onClick={() => {
                                    setQuery('');
                                    searchRef.current?.focus();
                                }}
                            >
                                <X />
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
                {lines.length > 0 && (
                    <ul
                        className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3"
                        aria-label="Transit lines"
                    >
                        {lines.map((line) => (
                            <li
                                className="flex items-center gap-1.5 text-[11px] leading-none font-medium text-muted-foreground"
                                key={line}
                            >
                                <Badge
                                    variant="outline"
                                    className="flex size-5.5 items-center justify-center rounded-full border-0 bg-muted p-0 text-xs font-bold text-foreground data-[line=capital]:bg-line-capital data-[line=capital]:text-line-on-colour data-[line=metro]:bg-line-metro data-[line=metro]:text-line-on-amber data-[line=valley]:bg-line-valley data-[line=valley]:text-line-on-colour"
                                    data-line={line.toLowerCase()}
                                    aria-hidden="true"
                                >
                                    {line.charAt(0)}
                                </Badge>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div
                className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] overflow-y-auto overscroll-contain pb-[max(24px,env(safe-area-inset-bottom))]"
                data-base-ui-swipe-ignore
            >
                {saveError && (
                    <p
                        role="status"
                        className="mx-4.5 mt-5 text-[11px] leading-normal text-muted-foreground"
                    >
                        Favourites are available for this visit, but couldn’t be
                        saved on this device.
                    </p>
                )}
                {isLoading ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>Loading stations…</EmptyTitle>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <>
                        {!normalized && savedStations.length > 0 && (
                            <section
                                aria-labelledby={`${headingId}-favourites`}
                            >
                                <h3
                                    id={`${headingId}-favourites`}
                                    className="flex min-h-[42px] items-center gap-1.5 border-b px-4.5 py-3 text-[10px] font-bold tracking-[1.2px] text-foreground uppercase [&_svg]:size-3 [&>span]:ml-auto [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-[9px] [&>span]:tracking-[1px]"
                                >
                                    <Star aria-hidden="true" /> Favourites
                                </h3>
                                <ul>{savedStations.map(row)}</ul>
                            </section>
                        )}
                        <section aria-labelledby={`${headingId}-stations`}>
                            <h3
                                id={`${headingId}-stations`}
                                className="flex min-h-[42px] items-center gap-1.5 border-b px-4.5 py-3 text-[10px] font-bold tracking-[1.2px] text-foreground uppercase [&_svg]:size-3 [&>span]:ml-auto [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:text-[9px] [&>span]:tracking-[1px]"
                            >
                                {normalized
                                    ? 'Search results'
                                    : location
                                      ? 'By distance'
                                      : 'All stations'}
                                <span>
                                    {normalized
                                        ? `${results.length} found`
                                        : `${stations.length} stations`}
                                </span>
                            </h3>
                            <span className="sr-only" role="status">
                                {normalized
                                    ? `${results.length} stations found`
                                    : ''}
                            </span>
                            {results.length > 0 ? (
                                <ul>{results.map(row)}</ul>
                            ) : (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyTitle>
                                            {normalized
                                                ? 'No stations match'
                                                : 'No stations available'}
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            {normalized
                                                ? 'Try another station name.'
                                                : 'Close the picker and refresh to try again.'}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )}
                        </section>
                        <p className="mx-4.5 mt-5 text-[11px] leading-normal text-muted-foreground">
                            {location
                                ? 'Distances are straight-line estimates, not walking routes.'
                                : 'Location unavailable. Stations are listed alphabetically.'}
                        </p>
                    </>
                )}
            </div>
        </>
    );
    const trigger = (
        <Button
            variant="plain"
            className={cn(
                'h-auto min-h-11 justify-start px-0 py-1 font-[Helvetica_Neue,Helvetica,Arial,sans-serif] text-2xl leading-[1.4285714286] font-bold tracking-[-0.8px] [&_svg]:text-muted-foreground',
                className
            )}
            aria-label={`Change station${selectedStation ? `, ${selectedStation.stop_name}` : ''}`}
        >
            <span className="truncate">
                {selectedStation
                    ? stationName(selectedStation)
                    : 'Select station'}
            </span>
            <ChevronDown data-icon="inline-end" />
        </Button>
    );
    if (desktop)
        return (
            <Dialog open={open} onOpenChange={changeOpen}>
                <DialogTrigger render={trigger} />
                <DialogContent
                    className='station-picker flex h-[min(720px,85dvh)] w-[min(480px,calc(100vw-32px))] flex-col gap-0 overflow-hidden rounded-none bg-background p-0 [font-feature-settings:"tnum"] text-foreground'
                    showCloseButton={false}
                    initialFocus={searchRef}
                >
                    {body}
                </DialogContent>
            </Dialog>
        );
    return (
        <Drawer
            open={open}
            onOpenChange={changeOpen}
            snapPoints={[0.75, 1]}
            snapPoint={snap}
            onSnapPointChange={setSnap}
        >
            <DrawerTrigger render={trigger} />
            <DrawerContent
                ref={drawerRef}
                tabIndex={-1}
                className='station-picker mt-0 h-[92dvh] max-h-[92dvh] pb-(--drawer-snap-point-offset) overflow-hidden rounded-none bg-background [font-feature-settings:"tnum"] text-foreground outline-none [&>[data-slot=drawer-handle]]:h-[3px] [&>[data-slot=drawer-handle]]:w-9 [&>[data-slot=drawer-handle]]:rounded-none [&>[data-slot=drawer-handle]]:bg-muted-foreground [&>[data-slot=drawer-handle]]:opacity-60'
                initialFocus={drawerRef}
            >
                {body}
            </DrawerContent>
        </Drawer>
    );
}
