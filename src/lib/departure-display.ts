import type {
    DepartureGroup,
    ProcessedDeparture,
} from '../types/departures.js';

interface HeadsignColorClasses {
    border: string;
    bg: string;
    bgBadge: string;
    text: string;
}

const HEADSIGN_COLOR_CLASSES: HeadsignColorClasses[] = [
    {
        border: 'border-headsign-1',
        bg: 'bg-headsign-1',
        bgBadge: 'bg-headsign-1-bg',
        text: 'text-headsign-1',
    },
    {
        border: 'border-headsign-2',
        bg: 'bg-headsign-2',
        bgBadge: 'bg-headsign-2-bg',
        text: 'text-headsign-2',
    },
    {
        border: 'border-headsign-3',
        bg: 'bg-headsign-3',
        bgBadge: 'bg-headsign-3-bg',
        text: 'text-headsign-3',
    },
    {
        border: 'border-headsign-4',
        bg: 'bg-headsign-4',
        bgBadge: 'bg-headsign-4-bg',
        text: 'text-headsign-4',
    },
    {
        border: 'border-headsign-5',
        bg: 'bg-headsign-5',
        bgBadge: 'bg-headsign-5-bg',
        text: 'text-headsign-5',
    },
    {
        border: 'border-headsign-6',
        bg: 'bg-headsign-6',
        bgBadge: 'bg-headsign-6-bg',
        text: 'text-headsign-6',
    },
    {
        border: 'border-headsign-7',
        bg: 'bg-headsign-7',
        bgBadge: 'bg-headsign-7-bg',
        text: 'text-headsign-7',
    },
    {
        border: 'border-headsign-8',
        bg: 'bg-headsign-8',
        bgBadge: 'bg-headsign-8-bg',
        text: 'text-headsign-8',
    },
];

const NORTHBOUND_DESTINATIONS = ['NAIT', 'Clareview', 'Gorman'];
const SOUTHBOUND_DESTINATIONS = [
    'Century Park',
    'Mill Woods',
    'Health Sciences',
];

function hashValue(value: string): number {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
}

export function getHeadsignColorClasses(
    headsign: string
): HeadsignColorClasses {
    return HEADSIGN_COLOR_CLASSES[hashValue(headsign) % HEADSIGN_COLOR_CLASSES.length];
}

export function getUniqueDestinations(
    departures: ProcessedDeparture[]
): string[] {
    return [...new Set(departures.map((departure) => departure.displayHeadsign))];
}

export function getPlatformHeading(destinations: string[]): string {
    if (destinations.length === 0) {
        return 'Platform';
    }

    const hasNorthbound = destinations.some((destination) =>
        NORTHBOUND_DESTINATIONS.some((candidate) =>
            destination.includes(candidate)
        )
    );
    const hasSouthbound = destinations.some((destination) =>
        SOUTHBOUND_DESTINATIONS.some((candidate) =>
            destination.includes(candidate)
        )
    );

    if (hasNorthbound) {
        return 'Northbound';
    }

    if (hasSouthbound) {
        return 'Southbound';
    }

    return destinations.join(', ');
}

export function createDepartureGroups(
    processedDepartures: ProcessedDeparture[][]
): DepartureGroup[] {
    return processedDepartures
        .filter((group) => group.length > 0)
        .map((departures) => {
            const destinations = getUniqueDestinations(departures);

            return {
                heading: getPlatformHeading(destinations),
                destinations,
                departures,
            };
        });
}
