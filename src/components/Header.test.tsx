// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
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
        expect(screen.getByText('theme-toggle')).toBeTruthy();
    });

    it('renders loading chrome instead of the theme toggle while the app is loading', () => {
        render(
            <Header
                stations={stations}
                selectedStation={stations[0]}
                isStationsLoading={true}
                onStationSelect={vi.fn()}
                isLoading={true}
            />
        );

        expect(screen.getByText('picker:Central Station:1:loading')).toBeTruthy();
        expect(screen.queryByText('theme-toggle')).toBeNull();
    });

    it('renders the skeleton state when no station is selected', () => {
        const { container } = render(
            <Header
                stations={stations}
                selectedStation={undefined}
                isStationsLoading={false}
                onStationSelect={vi.fn()}
            />
        );

        expect(container.textContent).not.toContain('picker:');
        expect(screen.getByText('theme-toggle')).toBeTruthy();
    });
});
