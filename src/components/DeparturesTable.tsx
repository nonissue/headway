import { Alert, AlertTitle } from '@/components/ui/alert';
import { DEFAULT_TIMEZONE } from '../config';
import {
    ArrowUp,
    ArrowDown,
    ArrowRight,
    ArrowLeft,
    TrainFront,
} from 'lucide-react';
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

const directionIcons = new Map([
    ['Northbound', ArrowUp],
    ['Southbound', ArrowDown],
    ['Eastbound', ArrowRight],
    ['Westbound', ArrowLeft],
]);

function DepartureRow({
    departure,
    now,
    hero = false,
    recent = false,
    nextService = false,
    direction,
}: {
    departure: ProcessedDeparture;
    now: number;
    hero?: boolean;
    recent?: boolean;
    nextService?: boolean;
    direction?: string;
}) {
    const DirectionIcon = direction ? directionIcons.get(direction) : undefined;
    const minutes = departureMinutes(departure, now);
    const age = recent
        ? Math.floor((now - Date.parse(departure.scheduled_at!)) / 60000)
        : 0;
    const recentLabel = age === 0 ? 'Just now' : `${age} min ago`;
    return (
        <li
            className="departure-row"
            data-hero={hero || undefined}
            data-recent={recent || undefined}
            data-next-service={nextService || undefined}
        >
            <LineBadge line={departure.line} />
            <span
                className="departure-destination"
                title={departure.displayHeadsign}
            >
                {departure.displayHeadsign}
                {DirectionIcon && (
                    <DirectionIcon
                        className="departure-direction"
                        role="img"
                        aria-label={direction}
                    />
                )}
            </span>
            <time
                className="departure-clock"
                dateTime={departure.scheduled_at ?? departure.displayTime}
            >
                {departure.displayTime.slice(0, 5)}
            </time>
            <span
                className="departure-countdown"
                aria-label={
                    recent
                        ? `Scheduled ${recentLabel.toLowerCase()}`
                        : minutes === undefined
                          ? 'Countdown unavailable'
                          : minutes === 0
                            ? 'Due now'
                            : `In ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
                }
            >
                <span className="departure-relative-time">
                    <span>
                        {recent
                            ? recentLabel
                            : minutes === undefined
                              ? '—'
                              : minutes === 0
                                ? 'Due'
                                : nextService
                                  ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
                                  : minutes}
                    </span>
                    {!recent &&
                        !nextService &&
                        minutes !== 0 &&
                        minutes !== undefined && (
                            <span className="departure-unit" aria-hidden="true">
                                min
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
            <Empty className="departures-empty" role="status">
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
                <Alert role="status" className="departures-service-notice">
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
            <div className="departure-board" aria-label="Scheduled departures">
                {groups.map((group, index) => {
                    const headingId = `direction-${index}`;
                    return (
                        <section
                            className="departure-pane"
                            key={`${index}-${group.heading}`}
                            aria-labelledby={headingId}
                        >
                            <h2 id={headingId} className="sr-only">
                                {group.heading}
                            </h2>
                            <ScrollArea
                                className="departure-scroll"
                                key={lineFilter}
                            >
                                <ol className="departure-list">
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
                                            direction={
                                                row === 0
                                                    ? group.heading
                                                    : undefined
                                            }
                                            nextService={Boolean(nextServiceAt)}
                                        />
                                    ))}
                                </ol>
                                {!group.upcoming.length && (
                                    <Empty className="departures-empty">
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
