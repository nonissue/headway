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

function DepartureRow({
    departure,
    now,
    hero = false,
    recent = false,
    nextService = false,
}: {
    departure: ProcessedDeparture;
    now: number;
    hero?: boolean;
    recent?: boolean;
    nextService?: boolean;
}) {
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
            className="group/row grid min-h-11 grid-cols-[minmax(0,1fr)_var(--clock-column)_var(--countdown-column)] items-center gap-2.5 border-b px-(--board-gutter) data-hero:min-h-14 data-recent:min-h-9 data-recent:text-muted-foreground"
            data-hero={hero || undefined}
            data-recent={recent || undefined}
            data-next-service={nextService || undefined}
        >
            <span
                className="min-w-0 py-2 text-[15px] leading-[1.2] font-medium tracking-[-0.25px] wrap-anywhere group-data-hero/row:text-[18px] group-data-hero/row:font-bold group-data-hero/row:tracking-[-0.3px] group-data-recent/row:text-[14px] group-data-recent/row:font-normal"
                title={departure.displayHeadsign}
            >
                {destination}
                <LineBadge
                    line={departure.line}
                    className="ml-2 inline-flex align-[1px] group-data-recent/row:opacity-45"
                />
            </span>
            <time
                className="flex items-center justify-end font-mono text-[15px] leading-[1.2] font-normal tracking-normal whitespace-nowrap text-foreground tabular-nums group-data-hero/row:text-[16px] group-data-hero/row:font-medium group-data-next-service/row:font-medium group-data-recent/row:text-[12px] group-data-recent/row:font-normal group-data-recent/row:tracking-normal group-data-recent/row:text-muted-foreground"
                dateTime={departure.scheduled_at ?? departure.displayTime}
            >
                {departure.displayTime.slice(0, 5)}
            </time>
            <span
                className="flex items-center justify-end font-mono text-[15px] leading-[1.2] font-semibold tracking-normal whitespace-nowrap tabular-nums group-data-hero/row:text-[16px] group-data-hero/row:font-medium group-data-next-service/row:font-medium group-data-next-service/row:tracking-normal group-data-recent/row:text-[12px] group-data-recent/row:font-normal group-data-recent/row:tracking-normal group-data-recent/row:text-muted-foreground"
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
                <span className="inline-flex items-baseline gap-0">
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
                className="h-full p-6 md:p-6 [&_[data-slot=empty-description]]:text-[12px] [&_[data-slot=empty-title]]:text-[16px]"
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
                            className="flex min-h-0 flex-1 flex-col [--board-gutter:18px] [--clock-column:48px] [--countdown-column:68px] has-[[data-next-service]]:[--countdown-column:96px] [&+section]:border-t-2 [&+section]:border-foreground [@media(max-width:360px)]:[--board-gutter:12px]"
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
                                <ol>
                                    {group.recent && (
                                        <DepartureRow
                                            key={`${group.recent.trip_id}-${group.recent.scheduled_at ?? group.recent.departure_time}`}
                                            departure={group.recent}
                                            now={now}
                                            recent
                                        />
                                    )}
                                    {group.upcoming.map((departure, row) => (
                                        <DepartureRow
                                            key={`${departure.trip_id}-${departure.scheduled_at ?? departure.departure_time}`}
                                            departure={departure}
                                            now={now}
                                            hero={row === 0}
                                            nextService={Boolean(nextServiceAt)}
                                        />
                                    ))}
                                </ol>
                                {!group.upcoming.length && (
                                    <Empty className="h-full p-6 md:p-6 [&_[data-slot=empty-description]]:text-[12px] [&_[data-slot=empty-title]]:text-[16px]">
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
