// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DepartureGroup } from '../types/departures.js';

vi.mock('@/components/ui/scroll-area', () => ({
    ScrollArea: ({
        children,
        className,
    }: {
        children: unknown;
        className?: string;
    }) => (
        <div data-testid="scroll-area" className={className}>
            {children}
        </div>
    ),
}));

import { DeparturesTable } from './DeparturesTable';

const departureGroups: DepartureGroup[] = [
    {
        heading: 'Northbound',
        destinations: ['NAIT', 'Clareview'],
        departures: [
            {
                stop_id: 'platform-1',
                trip_id: 'trip-1',
                stop_headsign: 'NAIT',
                departure_time: '08:10:00',
                displayHeadsign: 'NAIT',
                displayTime: '08:10:00',
            },
        ],
    },
    {
        heading: 'Southbound',
        destinations: ['Mill Woods'],
        departures: [
            {
                stop_id: 'platform-2',
                trip_id: 'trip-2',
                stop_headsign: 'Mill Woods',
                departure_time: '08:15:00',
                displayHeadsign: 'Mill Woods',
                displayTime: '08:15:00',
            },
        ],
    },
];

describe('DeparturesTable', () => {
    it('renders platform headings, destination badges, and departure rows', () => {
        render(
            <DeparturesTable departureGroups={departureGroups} animationKey={3} />
        );

        expect(screen.getByText('Northbound')).toBeTruthy();
        expect(screen.getByText('Southbound')).toBeTruthy();
        expect(screen.getAllByText('NAIT').length).toBeGreaterThan(0);
        expect(screen.getByText('Clareview')).toBeTruthy();
        expect(screen.getAllByText('Mill Woods').length).toBeGreaterThan(0);
        expect(screen.getByText('08:10:00')).toBeTruthy();
        expect(screen.getByText('08:15:00')).toBeTruthy();
        expect(screen.getAllByTestId('scroll-area')).toHaveLength(2);
    });

    it('renders nothing when there are no departure groups', () => {
        const { container } = render(<DeparturesTable departureGroups={[]} />);

        expect(container.textContent).toBe('');
    });
});
