// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DepartureGroup, ProcessedDeparture } from '../types/departures';
vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({ children }: { children: ReactNode }) => (
        <div data-testid="scroll-area">{children}</div>
    ),
}));
import { DeparturesTable } from './DeparturesTable';
const now = Date.parse('2026-09-19T14:00:00Z');
const train = (
    line: string,
    minutes: number,
    headsign: string
): ProcessedDeparture => ({
    stop_id: line,
    trip_id: String(minutes),
    stop_headsign: headsign,
    displayHeadsign: headsign,
    departure_time: `08:${minutes}:00`,
    displayTime: `08:${String(minutes).padStart(2, '0')}:00`,
    line,
    scheduled_at: new Date(now + minutes * 60000).toISOString(),
});
const groups: DepartureGroup[] = [
    {
        heading: 'Northbound',
        destinations: [],
        departures: [
            train('Capital', -1, 'Gone'),
            train('Capital', 10, 'Clareview'),
            train('Metro', 13, 'NAIT Blatchford Market'),
        ],
    },
    {
        heading: 'Southbound',
        destinations: [],
        departures: [
            train('Capital', 3, 'Century Park'),
            train('Metro', 10, 'Health Sciences'),
        ],
    },
];
afterEach(cleanup);
describe('DeparturesTable', () => {
    it('renders two scrollable directions with upcoming countdowns and HH:mm times', () => {
        render(<DeparturesTable departureGroups={groups} now={now} />);
        expect(
            screen.getByRole('heading', { name: 'Northbound' })
        ).toBeTruthy();
        expect(
            screen.getByRole('heading', { name: 'Southbound' })
        ).toBeTruthy();
        expect(screen.getAllByTestId('scroll-area')).toHaveLength(2);
        expect(screen.getByText('08:03')).toBeTruthy();
        expect(screen.getByLabelText('In 3 minutes')).toBeTruthy();
        expect(screen.getByText('Gone').closest('li')?.dataset.recent).toBe(
            'true'
        );
        expect(
            screen.getByText('Gone').closest('li')?.dataset.hero
        ).toBeUndefined();
        expect(screen.getByLabelText('Scheduled 1 min ago')).toBeTruthy();
        expect(screen.getByText('Clareview').closest('li')?.dataset.hero).toBe(
            'true'
        );
    });
    it('filters both panes and promotes the first matching departure', () => {
        render(
            <DeparturesTable
                departureGroups={groups}
                now={now}
                lineFilter="Metro"
            />
        );
        expect(screen.queryByText('Clareview')).toBeNull();
        expect(screen.queryByText('Century Park')).toBeNull();
        for (const name of ['NAIT Blatchford Market', 'Health Sciences'])
            expect(screen.getByText(name).closest('li')?.dataset.hero).toBe(
                'true'
            );
    });
    it('shows one board-level empty state when neither direction matches', () => {
        render(
            <DeparturesTable
                departureGroups={groups}
                now={now}
                lineFilter="Valley"
            />
        );
        expect(
            screen.getByText('No upcoming Valley Line departures')
        ).toBeTruthy();
        expect(screen.getAllByRole('status')).toHaveLength(1);
        expect(screen.queryAllByTestId('scroll-area')).toHaveLength(0);
    });
    it('keeps a single empty direction alongside a populated one', () => {
        render(
            <DeparturesTable
                departureGroups={[groups[0], { ...groups[1], departures: [] }]}
                now={now}
            />
        );
        expect(screen.getByText('No upcoming trains')).toBeTruthy();
        expect(screen.getByText('Clareview')).toBeTruthy();
        expect(screen.getAllByTestId('scroll-area')).toHaveLength(2);
    });
    it('expires the recent row without losing upcoming trains', () => {
        const { rerender } = render(
            <DeparturesTable departureGroups={groups} now={now} />
        );
        rerender(
            <DeparturesTable departureGroups={groups} now={now + 120001} />
        );
        expect(screen.queryByText('Gone')).toBeNull();
        expect(screen.getByText('Clareview')).toBeTruthy();
    });
    it('offers a recovery path when there are no departures', () => {
        render(<DeparturesTable departureGroups={[]} />);
        expect(screen.getByText('No upcoming departures')).toBeTruthy();
        expect(
            screen.getByText('Try refreshing, or choose another station.')
        ).toBeTruthy();
    });
});
