import { ArrowBigUp, ArrowBigDown, TrainFront } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
} from '@/components/ui/empty';
import { LineBadge } from './LineBadge';
import { departureMinutes } from '../lib/departure-countdown';
import type { DepartureGroup } from '../types/departures';

interface DeparturesTableProps {
    departureGroups: DepartureGroup[];
    animationKey?: number;
    lineFilter?: string;
    now?: number;
}

export function DeparturesTable({
    departureGroups,
    lineFilter = 'all',
    now = Date.now(),
}: DeparturesTableProps) {
    if (!departureGroups.length)
        return (
            <Empty className="departures-empty">
                <EmptyHeader>
                    <TrainFront aria-hidden="true" />
                    <EmptyTitle>No upcoming departures</EmptyTitle>
                    <EmptyDescription>
                        Try refreshing, or choose another station.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    return (
        <div className="departure-board" aria-label="Scheduled departures">
            {departureGroups.map((group, index) => {
                const trains = group.departures.filter(
                    (departure) =>
                        (lineFilter === 'all' ||
                            departure.line === lineFilter) &&
                        (departureMinutes(departure, now) ?? 0) >= 0
                );
                const DirectionIcon =
                    group.heading === 'Northbound'
                        ? ArrowBigUp
                        : group.heading === 'Southbound'
                          ? ArrowBigDown
                          : TrainFront;
                const headingId = `direction-${index}`;
                return (
                    <section
                        className="departure-pane"
                        key={`${index}-${group.heading}`}
                        aria-labelledby={headingId}
                    >
                        <div className="direction-rail">
                            <DirectionIcon aria-hidden="true" />
                            <h2 id={headingId}>{group.heading}</h2>
                        </div>
                        <ScrollArea
                            className="departure-scroll"
                            key={lineFilter}
                        >
                            {trains.length ? (
                                <ol className="departure-list">
                                    {trains.map((departure, row) => {
                                        const minutes = departureMinutes(
                                            departure,
                                            now
                                        );
                                        const hero = row === 0;
                                        return (
                                            <li
                                                className="departure-row"
                                                data-hero={hero || undefined}
                                                key={`${departure.stop_id}-${departure.trip_id}-${departure.departure_time}`}
                                            >
                                                <LineBadge
                                                    line={departure.line}
                                                    hero={hero}
                                                />
                                                <span
                                                    className="departure-destination"
                                                    title={
                                                        departure.displayHeadsign
                                                    }
                                                >
                                                    {departure.displayHeadsign}
                                                </span>
                                                <time
                                                    className="departure-clock"
                                                    dateTime={
                                                        departure.scheduled_at ??
                                                        departure.displayTime
                                                    }
                                                >
                                                    {departure.displayTime.slice(
                                                        0,
                                                        5
                                                    )}
                                                </time>
                                                <span
                                                    className="departure-countdown"
                                                    aria-label={
                                                        minutes === undefined
                                                            ? 'Countdown unavailable'
                                                            : minutes === 0
                                                              ? 'Due now'
                                                              : `In ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
                                                    }
                                                >
                                                    <span>
                                                        {minutes === undefined
                                                            ? '—'
                                                            : minutes === 0
                                                              ? 'Due'
                                                              : minutes}
                                                    </span>
                                                    {minutes !== 0 &&
                                                        minutes !==
                                                            undefined && (
                                                            <span
                                                                className="departure-unit"
                                                                aria-hidden="true"
                                                            >
                                                                m
                                                            </span>
                                                        )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            ) : (
                                <Empty className="departures-empty">
                                    <EmptyHeader>
                                        <EmptyTitle>
                                            No upcoming trains
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            {lineFilter === 'all'
                                                ? 'Refresh to check the latest schedule.'
                                                : `No ${lineFilter} Line departures in this direction within the loaded schedule.`}
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )}
                        </ScrollArea>
                    </section>
                );
            })}
        </div>
    );
}
