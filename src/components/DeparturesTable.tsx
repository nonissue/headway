import { cva } from 'class-variance-authority';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { DEFAULT_TIMEZONE } from '../config';
import { TrainFront } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
} from '@/components/ui/empty';
import { LineBadge } from './LineBadge';
import {
    departureMinutes,
    getDepartureWindow,
} from '../lib/departure-countdown';
import type { DepartureGroup, ProcessedDeparture } from '../types/departures';

interface DeparturesTableProps {
    departureGroups: DepartureGroup[];
    animationKey?: number;
    lineFilter?: string;
    now?: number;
    nextServiceAt?: string;
}

// The row owns the type scale; clocks sit one step below the countdowns.
const rowVariants = cva(
    'group/row col-span-3 grid grid-cols-subgrid items-center gap-3 border-b px-(--board-gutter) leading-tight',
    {
        variants: {
            emphasis: {
                next: 'min-h-16 text-xl font-bold',
                second: 'min-h-14 text-lg font-semibold',
                third: 'min-h-14 text-lg font-medium',
                regular: 'min-h-13 text-base font-medium',
                recent: 'min-h-10 text-sm font-medium text-foreground/80',
            },
        },
    }
);
const upcomingEmphasis = ['next', 'second', 'third'] as const;
type RowEmphasis = (typeof upcomingEmphasis)[number] | 'regular' | 'recent';

function DepartureRow({
    departure,
    now,
    emphasis = 'regular',
    nextService = false,
}: {
    departure: ProcessedDeparture;
    now: number;
    emphasis?: RowEmphasis;
    nextService?: boolean;
}) {
    const recent = emphasis === 'recent';
    const destination = /^NAIT[\s-]+Blatchford Market$/i.test(
        departure.displayHeadsign
    )
        ? 'NAIT / Blatchford'
        : departure.displayHeadsign;
    const minutes = departureMinutes(departure, now);
    const age = recent
        ? Math.floor((now - Date.parse(departure.scheduled_at!)) / 60000)
        : 0;
    const recentLabel =
        age === 0 ? 'Now' : `-${age} ${age === 1 ? 'min' : 'mins'}`;
    return (
        <li
            className={rowVariants({ emphasis })}
            data-emphasis={emphasis}
            data-recent={recent || undefined}
        >
            <span
                className="flex min-w-0 items-center gap-2 py-3 tracking-tight"
                title={departure.displayHeadsign}
            >
                <span className="flex w-6 shrink-0 items-center justify-center">
                    <LineBadge
                        line={departure.line}
                        proportional
                        className="group-data-recent/row:opacity-70"
                    />
                </span>
                <span className="min-w-0 truncate">{destination}</span>
            </span>
            <time
                className="text-right font-mono text-sm leading-tight font-normal whitespace-nowrap text-muted-foreground tabular-nums group-data-recent/row:text-xs group-data-recent/row:text-foreground/80 group-data-[emphasis=next]/row:text-lg group-data-[emphasis=second]/row:text-base group-data-[emphasis=third]/row:text-base"
                dateTime={departure.scheduled_at ?? departure.displayTime}
            >
                {departure.displayTime.slice(0, 5)}
            </time>
            <span
                className="text-right font-mono font-normal whitespace-nowrap tabular-nums group-data-[emphasis=next]/row:font-medium group-data-[emphasis=second]/row:font-medium"
                aria-label={
                    recent
                        ? age === 0
                            ? 'Scheduled less than a minute ago'
                            : `Scheduled ${age} ${age === 1 ? 'minute' : 'minutes'} ago`
                        : minutes === undefined
                          ? 'Countdown unavailable'
                          : minutes === 0
                            ? 'Due now'
                            : `In ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
                }
            >
                <span className="inline-flex items-baseline">
                    <span>
                        {recent
                            ? recentLabel
                            : minutes === undefined
                              ? '—'
                              : minutes === 0
                                ? 'Now'
                                : nextService
                                  ? `${Math.floor(minutes / 60)}h ${minutes % 60}mins`
                                  : minutes}
                    </span>
                    {!recent &&
                        !nextService &&
                        minutes !== 0 &&
                        minutes !== undefined && (
                            <span className="font-normal" aria-hidden="true">
                                mins
                            </span>
                        )}
                </span>
            </span>
        </li>
    );
}

export function DeparturesTable({
    departureGroups,
    lineFilter = 'all',
    now = Date.now(),
    nextServiceAt,
}: DeparturesTableProps) {
    const groups = departureGroups.map((group) => ({
        ...group,
        ...getDepartureWindow(group.departures, now, lineFilter),
    }));
    const hasVisibleDepartures = groups.some(
        (group) => group.upcoming.length || group.recent
    );
    if (!hasVisibleDepartures)
        return (
            <Empty
                className="h-full p-6 md:p-6 [&_[data-slot=empty-description]]:text-xs [&_[data-slot=empty-title]]:text-base"
                role="status"
            >
                <EmptyHeader>
                    <TrainFront aria-hidden="true" />
                    <EmptyTitle>
                        {lineFilter === 'all'
                            ? 'No upcoming departures'
                            : `No upcoming ${lineFilter} Line departures`}
                    </EmptyTitle>
                    <EmptyDescription>
                        {lineFilter === 'all'
                            ? 'Try refreshing, or choose another station.'
                            : 'Try another line, or refresh to check the latest schedule.'}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    return (
        <>
            {nextServiceAt && (
                <Alert
                    role="status"
                    className="shrink-0 rounded-none border-0 border-b px-4.5"
                >
                    <AlertTitle>
                        Next service ·{' '}
                        {new Intl.DateTimeFormat('en-CA', {
                            timeZone: DEFAULT_TIMEZONE,
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                        }).format(new Date(nextServiceAt))}
                    </AlertTitle>
                </Alert>
            )}
            <div
                className="flex min-h-0 flex-1 flex-col"
                aria-label="Scheduled departures"
            >
                {groups.map((group, index) => {
                    const headingId = `direction-${index}`;
                    return (
                        <section
                            className="flex min-h-0 flex-1 flex-col [--board-gutter:--spacing(4.5)] max-[360px]:[--board-gutter:--spacing(3)] [&+section]:border-t-2 [&+section]:border-foreground"
                            key={`${index}-${group.heading}`}
                            aria-labelledby={headingId}
                        >
                            <h2 id={headingId} className="sr-only">
                                {group.heading}
                            </h2>
                            <ScrollArea
                                className="departure-scroll min-h-0 min-w-0 flex-1"
                                key={lineFilter}
                            >
                                <ol className="grid grid-cols-[minmax(0,1fr)_max-content_max-content]">
                                    {group.recent && (
                                        <DepartureRow
                                            key={`${group.recent.trip_id}-${group.recent.scheduled_at ?? group.recent.departure_time}`}
                                            departure={group.recent}
                                            now={now}
                                            emphasis="recent"
                                        />
                                    )}
                                    {group.upcoming.map((departure, row) => (
                                        <DepartureRow
                                            key={`${departure.trip_id}-${departure.scheduled_at ?? departure.departure_time}`}
                                            departure={departure}
                                            now={now}
                                            emphasis={
                                                upcomingEmphasis[row] ??
                                                'regular'
                                            }
                                            nextService={Boolean(nextServiceAt)}
                                        />
                                    ))}
                                </ol>
                                {!group.upcoming.length && (
                                    <Empty className="h-full p-6 md:p-6 [&_[data-slot=empty-description]]:text-xs [&_[data-slot=empty-title]]:text-base">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                No upcoming trains
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                {lineFilter === 'all'
                                                    ? 'Refresh to check the latest schedule.'
                                                    : `No upcoming ${lineFilter} Line departures in this direction.`}
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                )}
                            </ScrollArea>
                        </section>
                    );
                })}
            </div>
        </>
    );
}
