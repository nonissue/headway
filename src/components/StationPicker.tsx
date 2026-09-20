import * as React from 'react';
import { ChevronDown, Search, Star, TrainFront, X, MapPin } from 'lucide-react';
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
    DrawerClose,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
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
    // Vaul offsets are viewport-relative: 92vh - 17vh gives the 75vh resting sheet.
    const [snap, setSnap] = React.useState<number | string | null>(0.83);
    const [favourites, setFavourites] = React.useState(readFavouriteStations);
    const [saveError, setSaveError] = React.useState(false);
    const searchRef = React.useRef<HTMLInputElement>(null);
    const closeRef = React.useRef<HTMLButtonElement>(null);
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
    const savedStations = favourites
        .map((id) => stations.find((station) => station.stop_id === id))
        .filter((station): station is Station => !!station);

    function changeOpen(next: boolean) {
        setOpen(next);
        if (next) {
            setQuery('');
            setSnap(0.83);
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
                className="station-picker-row"
                data-current={current || undefined}
            >
                <Button
                    variant="ghost"
                    className="station-picker-select"
                    aria-label={`Select ${station.stop_name}${current ? ', current station' : ''}`}
                    aria-current={current ? 'true' : undefined}
                    onClick={() => select(station)}
                >
                    <span className="station-picker-lines" aria-hidden="true">
                        {station.lines?.length ? (
                            station.lines.map((line) => (
                                <Badge
                                    key={line}
                                    variant="outline"
                                    className="station-line"
                                    data-line={line.toLowerCase()}
                                >
                                    {line.charAt(0)}
                                </Badge>
                            ))
                        ) : (
                            <TrainFront />
                        )}
                    </span>
                    <span className="station-picker-name-block">
                        <span className="station-picker-name">
                            {stationName(station)}
                        </span>
                        <span className="station-picker-detail">
                            {current
                                ? 'Current station'
                                : station.lines?.join(' · ') || 'LRT station'}
                        </span>
                    </span>
                    {distance !== undefined && (
                        <span className="station-picker-distance">
                            {formatStationDistance(distance)}
                            <span>away</span>
                        </span>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="station-picker-star"
                    aria-label={`${saved ? 'Remove' : 'Add'} ${station.stop_name} ${saved ? 'from' : 'to'} favourites`}
                    aria-pressed={saved}
                    onClick={() => toggleFavourite(station.stop_id)}
                >
                    <Star data-icon="inline-start" />
                </Button>
            </li>
        );
    }
    const Title = desktop ? DialogTitle : DrawerTitle;
    const Description = desktop ? DialogDescription : DrawerDescription;
    const Close = desktop ? DialogClose : DrawerClose;
    const body = (
        <>
            <div className="station-picker-header">
                <div className="station-picker-heading">
                    <Close asChild>
                        <Button
                            ref={closeRef}
                            variant="ghost"
                            className="station-picker-close"
                        >
                            Close
                        </Button>
                    </Close>
                    <Title>Stations</Title>
                </div>
                <Description className="sr-only">
                    Choose a station to see its departures. Save favourites for
                    quick access.
                </Description>
                <InputGroup className="station-picker-search">
                    <InputGroupInput
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
            </div>
            <div className="station-picker-scroll" data-vaul-no-drag>
                {saveError && (
                    <p role="status" className="station-picker-note">
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
                                    className="station-picker-section"
                                >
                                    <Star aria-hidden="true" /> Favourites
                                </h3>
                                <ul>{savedStations.map(row)}</ul>
                            </section>
                        )}
                        <section aria-labelledby={`${headingId}-stations`}>
                            <h3
                                id={`${headingId}-stations`}
                                className="station-picker-section"
                            >
                                {normalized
                                    ? 'Search results'
                                    : location
                                      ? 'By distance'
                                      : 'All stations'}
                                <span>
                                    {normalized ? (
                                        `${results.length} found`
                                    ) : location ? (
                                        <>
                                            <MapPin aria-hidden="true" /> Near
                                            you
                                        </>
                                    ) : (
                                        `${stations.length} stations`
                                    )}
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
                        <p className="station-picker-note">
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
            variant="ghost"
            className={cn('station-picker-trigger', className)}
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
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent
                    className="station-picker station-picker-dialog"
                    showCloseButton={false}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        searchRef.current?.focus();
                    }}
                >
                    {body}
                </DialogContent>
            </Dialog>
        );
    return (
        <Drawer
            open={open}
            onOpenChange={changeOpen}
            snapPoints={[0.83, 1]}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
            fadeFromIndex={0}
            fixed
            autoFocus
        >
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent
                className="station-picker station-picker-drawer"
                data-expanded={snap === 1}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    closeRef.current?.focus();
                }}
            >
                {body}
            </DrawerContent>
        </Drawer>
    );
}
