import * as React from 'react';
import { Check, ChevronDown, Search, Star, X } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
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
        [station.stop_name, stationName(station)].some((name) =>
            name.toLocaleLowerCase().includes(normalized)
        )
    );
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
    const listClassName = 'col-span-full grid grid-cols-subgrid';
    const sectionClassName =
        'col-span-full flex min-h-7 items-center border-b px-4.5 py-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase';

    function row(station: Station) {
        const current = station.stop_id === selectedStation?.stop_id;
        const saved = favourites.includes(station.stop_id);
        const distance = stationDistance(station, location);
        return (
            <li
                key={station.stop_id}
                className="group/station relative col-span-full grid min-w-0 grid-cols-subgrid items-center gap-x-3 border-b pr-1.5 pl-4.5 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1 data-current:before:bg-foreground"
                data-current={current || undefined}
            >
                <Button
                    variant="station"
                    size="station-row"
                    className="col-span-2 grid min-w-0 grid-cols-subgrid gap-x-3 text-left"
                    aria-label={`Select ${station.stop_name}${current ? ', current station' : ''}`}
                    aria-description={station.lines?.join(', ')}
                    aria-current={current ? 'true' : undefined}
                    title={station.stop_name}
                    onClick={() => select(station)}
                >
                    <span className="flex min-w-0 items-center gap-2 text-lg leading-tight font-medium group-data-current/station:font-semibold">
                        <span className="truncate">{stationName(station)}</span>
                        {current && <Check aria-hidden="true" />}
                    </span>
                    <span className="text-right font-mono text-sm font-normal whitespace-nowrap text-muted-foreground">
                        {distance !== undefined
                            ? formatStationDistance(distance)
                            : null}
                    </span>
                </Button>
                <Button
                    variant="station"
                    size="icon-lg"
                    aria-label={`${saved ? 'Remove' : 'Add'} ${station.stop_name} ${saved ? 'from' : 'to'} favourites`}
                    aria-pressed={saved}
                    onClick={() => toggleFavourite(station.stop_id)}
                >
                    <Star data-icon="inline-start" aria-hidden="true" />
                </Button>
            </li>
        );
    }
    const Title = desktop ? DialogTitle : DrawerTitle;
    const Description = desktop ? DialogDescription : DrawerDescription;
    const body = (
        <>
            <div className="shrink-0">
                <Title className="sr-only">Stations</Title>
                <Description className="sr-only">
                    Choose a station to see its departures. Save favourites for
                    quick access.
                </Description>
                <InputGroup variant="row">
                    <InputGroupInput
                        className="[&::-webkit-search-cancel-button]:hidden"
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
                                <X
                                    data-icon="inline-start"
                                    aria-hidden="true"
                                />
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
            </div>
            <div
                className="grid min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] grid-cols-[minmax(0,1fr)_max-content_2.75rem] content-start gap-x-3 overflow-y-auto overscroll-contain pb-[max(24px,env(safe-area-inset-bottom))]"
                data-base-ui-swipe-ignore
            >
                {saveError && (
                    <p
                        role="status"
                        className="col-span-full mx-4.5 mt-5 text-xs leading-normal text-muted-foreground"
                    >
                        Favourites are available for this visit, but couldn’t be
                        saved on this device.
                    </p>
                )}
                {isLoading ? (
                    <Empty className="col-span-full">
                        <EmptyHeader>
                            <EmptyTitle>Loading stations…</EmptyTitle>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <>
                        {!normalized && savedStations.length > 0 && (
                            <section
                                aria-labelledby={`${headingId}-favourites`}
                                className={listClassName}
                            >
                                <h3
                                    id={`${headingId}-favourites`}
                                    className={sectionClassName}
                                >
                                    Favourites
                                </h3>
                                <ul className={listClassName}>
                                    {savedStations.map(row)}
                                </ul>
                            </section>
                        )}
                        <section
                            aria-labelledby={`${headingId}-stations`}
                            className={listClassName}
                        >
                            <h3
                                id={`${headingId}-stations`}
                                className={cn(
                                    normalized ? 'sr-only' : sectionClassName
                                )}
                            >
                                {normalized
                                    ? 'Search results'
                                    : location
                                      ? 'By distance'
                                      : 'All stations'}
                            </h3>
                            <span className="sr-only" role="status">
                                {normalized
                                    ? `${results.length} stations found`
                                    : ''}
                            </span>
                            {results.length > 0 ? (
                                <ul className={listClassName}>
                                    {results.map(row)}
                                </ul>
                            ) : (
                                <Empty className="col-span-full">
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
                        <p className="col-span-full mx-4.5 mt-5 text-xs leading-normal text-muted-foreground">
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
                'h-auto min-h-11 justify-start px-0 py-1 font-sans text-2xl leading-[1.4285714286] font-bold tracking-[-0.8px] [&_svg]:text-muted-foreground',
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
                className='station-picker mt-0 h-[92dvh] max-h-[92dvh] overflow-hidden rounded-none bg-background pb-(--drawer-snap-point-offset) [font-feature-settings:"tnum"] text-foreground outline-none [&>[data-slot=drawer-handle]]:h-[3px] [&>[data-slot=drawer-handle]]:w-9 [&>[data-slot=drawer-handle]]:rounded-none [&>[data-slot=drawer-handle]]:bg-muted-foreground [&>[data-slot=drawer-handle]]:opacity-60'
                initialFocus={drawerRef}
            >
                {body}
            </DrawerContent>
        </Drawer>
    );
}
