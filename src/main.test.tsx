// @vitest-environment jsdom

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    DepartureGroup,
    Station,
} from './types/departures.js';

vi.mock('./hooks/useDeparturesApp', () => ({
    useDeparturesApp: vi.fn(),
}));

vi.mock('./components/Header', () => ({
    Header: ({
        selectedStation,
        isLoading,
    }: {
        selectedStation?: Station;
        isLoading?: boolean;
    }) => (
        <div>
            Header:{selectedStation?.stop_name ?? 'none'}:
            {isLoading ? 'loading' : 'ready'}
        </div>
    ),
}));

vi.mock('./components/DeparturesTable', () => ({
    DeparturesTable: ({
        departureGroups,
        animationKey,
    }: {
        departureGroups: DepartureGroup[];
        animationKey?: number;
    }) => (
        <div>
            Departures:{departureGroups.length}:key:{animationKey ?? 0}
        </div>
    ),
}));

vi.mock('./components/Footer', () => ({
    Footer: ({
        lastUpdated,
        onRefresh,
    }: {
        lastUpdated: Date | null;
        onRefresh: () => void;
    }) => (
        <button type="button" onClick={onRefresh}>
            Footer:{lastUpdated ? 'dated' : 'empty'}
        </button>
    ),
}));

vi.mock('./components/theme-provider', () => ({
    ThemeProvider: ({ children }: { children: unknown }) => children,
}));

import { App, mountApp } from './main.js';
import { useDeparturesApp } from './hooks/useDeparturesApp';

const baseStation: Station = {
    stop_id: 'station-1',
    stop_name: 'Central Station',
};

const baseDepartureGroups: DepartureGroup[] = [
    {
        heading: 'Northbound',
        destinations: ['NAIT'],
        departures: [
            {
                stop_id: 'platform-1',
                trip_id: 'trip-1',
                stop_headsign: 'NAIT',
                departure_time: '08:15:00',
                displayTime: '08:15:00',
                displayHeadsign: 'NAIT',
            },
        ],
    },
];

function mockHookState(
    overrides: Partial<ReturnType<typeof useDeparturesApp>> = {}
) {
    const clearError = vi.fn();
    const refresh = vi.fn();
    const selectStation = vi.fn();

    vi.mocked(useDeparturesApp).mockReturnValue({
        animationKey: 0,
        clearError,
        error: null,
        hasError: false,
        isLoading: false,
        isStationsLoading: false,
        lastUpdated: new Date('2026-03-03T12:34:56.000Z'),
        departureGroups: baseDepartureGroups,
        refresh,
        selectedStation: baseStation,
        selectStation,
        stations: [baseStation],
        userLocation: { lat: 53.5, lon: -113.5 },
        ...overrides,
    });

    return {
        clearError,
        refresh,
        selectStation,
    };
}

describe('App', () => {
    beforeEach(() => {
        document.head.innerHTML = '';
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders the loading state', () => {
        mockHookState({
            isLoading: true,
            lastUpdated: null,
            selectedStation: undefined,
            departureGroups: [],
            stations: [],
        });

        render(<App />);

        expect(screen.getByText('Loading')).toBeTruthy();
        expect(screen.getByText('Header:none:loading')).toBeTruthy();
    });

    it('renders departures, error state, and wires actions', () => {
        const clearError = vi.fn();
        const refresh = vi.fn();
        mockHookState({
            clearError,
            refresh,
            hasError: true,
            error: {
                message: 'Something went wrong',
                code: 'ERR',
            },
            animationKey: 7,
        });

        render(<App />);

        expect(screen.getByText('Header:Central Station:ready')).toBeTruthy();
        expect(screen.getByText('Departures:1:key:7')).toBeTruthy();
        expect(screen.getByText('Something went wrong')).toBeTruthy();

        fireEvent.click(screen.getByText('Dismiss'));
        fireEvent.click(screen.getByText('Footer:dated'));

        expect(clearError).toHaveBeenCalledTimes(1);
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('injects the analytics script only once', () => {
        mockHookState();

        const { rerender } = render(<App />);

        rerender(<App />);

        const scripts = document.head.querySelectorAll(
            'script#headway-analytics'
        );

        expect(scripts).toHaveLength(1);
        expect(scripts[0]?.getAttribute('src')).toBe('/stats.js');
        expect(scripts[0]?.getAttribute('data-website-id')).toBe(
            'aac8d5e9-5e2d-4107-8844-f484b9e45eb2'
        );
    });

    it('mounts the app into a provided root element', async () => {
        mockHookState();

        const rootElement = document.createElement('div');
        document.body.appendChild(rootElement);

        mountApp(rootElement);

        await waitFor(() => {
            expect(rootElement.textContent).toContain('Header:Central Station:ready');
            expect(rootElement.textContent).toContain('Departures:1:key:0');
        });
    });

    it('does nothing when mountApp is called without a root element', () => {
        const beforeMount = document.body.innerHTML;

        mountApp(null);

        expect(document.body.innerHTML).toBe(beforeMount);
    });
});
