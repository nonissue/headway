// Development-only fixture: fixed schedule and now, independent of device time.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/globals.css';
import { DeparturesTable } from '../../../src/components/DeparturesTable';
const now = Date.parse('2026-09-22T04:05:00Z');
function train(line: string, minutes: number, name: string) {
    const scheduled_at = new Date(now + minutes * 60000).toISOString();
    return {
        stop_id: 'qa',
        trip_id: line + minutes,
        stop_headsign: name,
        displayHeadsign: name,
        line,
        scheduled_at,
        departure_time: '22:00:00',
        displayTime: new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Edmonton',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(scheduled_at)),
    };
}
const groups = [
    {
        heading: 'Northbound',
        destinations: [],
        departures: [
            train('Capital', 9, 'Clareview'),
            train('Metro', 13, 'NAIT Blatchford Market'),
            train('Capital', 24, 'Clareview'),
            train('Metro', 28, 'NAIT Blatchford Market'),
            train('Capital', 39, 'Clareview'),
            train('Metro', 43, 'NAIT Blatchford Market'),
            train('Capital', 109, 'Clareview'),
        ],
    },
    {
        heading: 'Southbound',
        destinations: [],
        departures: [
            train('Metro', 3, 'Health Sciences'),
            train('Capital', 7, 'Century Park'),
            train('Metro', 18, 'Health Sciences'),
            train('Capital', 22, 'Century Park'),
            train('Metro', 33, 'Health Sciences'),
            train('Capital', 37, 'Century Park'),
        ],
    },
];
createRoot(document.getElementById('root')!).render(
    <main className="mx-auto flex h-full max-w-160 flex-col bg-background text-foreground">
        <header className="flex h-16 shrink-0 items-center border-b-2 border-foreground px-4.5 text-2xl font-bold">
            Corona
        </header>
        <DeparturesTable departureGroups={groups} now={now} />
        <footer className="h-14 shrink-0 border-t-2 border-foreground px-4.5 py-3 text-sm">
            Mixed departures · fixed-time preview
        </footer>
    </main>
);
