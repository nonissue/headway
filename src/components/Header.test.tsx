// @vitest-environment jsdom

import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Station } from '../types/departures.js';

vi.mock('./StationPicker', () => ({
    StationPicker: ({
        selectedStation,
        stations,
        isLoading,
    }: {
        selectedStation?: Station;
        stations: Station[];
        isLoading?: boolean;
    }) => (
        <div>
            picker:{selectedStation?.stop_name ?? 'none'}:{stations.length}:
            {isLoading ? 'loading' : 'ready'}
        </div>
    ),
}));

vi.mock('./theme-toggle', () => ({
    ThemeToggle: () => <div>theme-toggle</div>,
}));

import { Header } from './Header';

const stations: Station[] = [
    {
        stop_id: 'station-1',
        stop_name: 'Central Station',
    },
];

describe('Header', () => {
    it('filters by the actual lines available at the station', () => {
        const onLineFilterChange = vi.fn();
        render(
            <Header
                stations={stations}
                selectedStation={stations[0]}
                isStationsLoading={false}
                onStationSelect={vi.fn()}
                lines={['Capital', 'Metro']}
                lineFilter="all"
                onLineFilterChange={onLineFilterChange}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Metro Line' }));
        expect(onLineFilterChange).toHaveBeenCalledWith('Metro');
    });
    it('toggles an isolated line off to restore all lines and switches directly between lines', () => {
        function FilterHarness() {
            const [lineFilter, setLineFilter] = useState('all');
            return (
                <Header
                    stations={stations}
                    onStationSelect={vi.fn()}
                    lines={['Capital', 'Metro']}
                    lineFilter={lineFilter}
                    onLineFilterChange={setLineFilter}
                />
            );
        }
        render(<FilterHarness />);
        const capital = screen.getByRole('button', { name: 'Capital Line' });
        const metro = screen.getByRole('button', { name: 'Metro Line' });
        expect(screen.queryByRole('button', { name: 'All lines' })).toBeNull();
        expect(capital.getAttribute('aria-pressed')).toBe('false');
        expect(metro.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(metro);
        expect(metro.getAttribute('aria-pressed')).toBe('true');
        fireEvent.click(capital);
        expect(capital.getAttribute('aria-pressed')).toBe('true');
        expect(metro.getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(capital);
        expect(capital.getAttribute('aria-pressed')).toBe('false');
        expect(metro.getAttribute('aria-pressed')).toBe('false');
    });
    afterEach(() => {
        cleanup();
    });

    it('renders the station picker when a station is selected', () => {
        render(
            <Header
                stations={stations}
                selectedStation={stations[0]}
                isStationsLoading={false}
                onStationSelect={vi.fn()}
            />
        );

        expect(screen.getByText('picker:Central Station:1:ready')).toBeTruthy();
    });

    it('passes station-list loading state to the picker', () => {
        render(
            <Header
                stations={stations}
                selectedStation={stations[0]}
                isStationsLoading={true}
                onStationSelect={vi.fn()}
                isLoading={true}
            />
        );

        expect(
            screen.getByText('picker:Central Station:1:loading')
        ).toBeTruthy();
        expect(screen.queryByText('theme-toggle')).toBeNull();
    });

    it('keeps station selection available when no station is selected', () => {
        const { container } = render(
            <Header
                stations={stations}
                selectedStation={undefined}
                isStationsLoading={false}
                onStationSelect={vi.fn()}
            />
        );

        expect(container.textContent).toContain('picker:none:1:ready');
    });
});
