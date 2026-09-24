import { cn } from '@/components/lib/utils';
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
    getUpcomingDepartures,
} from '../lib/departure-countdown';
import type { DepartureGroup, ProcessedDeparture } from '../types/departures';

interface DeparturesTableProps {
    departureGroups: DepartureGroup[];
    animationKey?: number;
    lineFilter?: string;
    now?: number;
    nextServiceAt?: string;
}

type RowEmphasis = 'next' | 'regular';

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
    const destination = /^NAIT[\s-]+Blatchford Market$/i.test(
        departure.displayHeadsign
    )
        ? 'NAIT / Blatchford'
        : departure.displayHeadsign;
    const minutes = departureMinutes(departure, now);
    const isNow = minutes === 0;
    return (
        <li
            className="group/row col-span-3 grid min-h-14 grid-cols-subgrid items-center gap-3 border-b px-(--board-gutter) text-lg leading-tight font-medium"
            data-emphasis={emphasis}
        >
            <span
                className="flex min-w-0 items-center gap-2 py-3 tracking-tight"
                title={departure.displayHeadsign}
            >
                <span className="flex w-6 shrink-0 items-center justify-center">
                    <LineBadge line={departure.line} proportional />
                </span>
                <span className="min-w-0 truncate">{destination}</span>
            </span>
            <time
                className="text-right font-mono text-sm leading-tight font-normal whitespace-nowrap text-muted-foreground tabular-nums"
                dateTime={departure.scheduled_at ?? departure.displayTime}
            >
                {departure.displayTime.slice(0, 5)}
            </time>
            <span
                className={cn(
                    'text-right text-base leading-tight font-normal whitespace-nowrap tabular-nums group-data-[emphasis=next]/row:font-medium',
                    isNow ? 'font-sans' : 'font-mono'
                )}
                aria-label={
                    minutes === undefined
                        ? 'Countdown unavailable'
                        : minutes === 0
                          ? 'Due now'
                          : `In ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
                }
            >
                <span className="inline-flex items-baseline">
                    <span>
                        {minutes === undefined
                            ? '—'
                            : minutes === 0
                              ? 'Now'
                              : nextService
                                ? `${Math.floor(minutes / 60)}h ${minutes % 60}mins`
                                : minutes}
                    </span>
                    {!nextService && minutes !== 0 && minutes !== undefined && (
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
        upcoming: getUpcomingDepartures(group.departures, now, lineFilter),
    }));
    const hasVisibleDepartures = groups.some((group) => group.upcoming.length);
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
                                className="min-h-0 min-w-0 flex-1"
                                viewportClassName="scroll-fade-b scroll-fade-8 overscroll-none motion-reduce:scroll-fade-none"
                                key={lineFilter}
                            >
                                <ol className="grid grid-cols-[minmax(0,1fr)_max-content_max-content]">
                                    {group.upcoming.map((departure, row) => (
                                        <DepartureRow
                                            key={`${departure.trip_id}-${departure.scheduled_at ?? departure.departure_time}`}
                                            departure={departure}
                                            now={now}
                                            emphasis={
                                                row === 0 ? 'next' : 'regular'
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
