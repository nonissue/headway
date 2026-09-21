// @vitest-environment jsdom
import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StationPicker } from './StationPicker';
import { FAVOURITES_KEY } from '../lib/station-picker';
import type { Station } from '../types/departures';

const stations: Station[] = [
    {
        stop_id: 'central',
        stop_name: 'Central Station',
        stop_lat: 53.54,
        stop_lon: -113.49,
        lines: ['Capital', 'Metro'],
    },
    {
        stop_id: 'health',
        stop_name: 'Health Sciences',
        stop_lat: 53.52,
        stop_lon: -113.52,
        lines: ['Capital'],
    },
];
function openPicker(
    props: Partial<React.ComponentProps<typeof StationPicker>> = {}
) {
    const select = vi.fn();
    render(
        <StationPicker
            selectedStation={stations[0]}
            stations={stations}
            onStationSelect={select}
            {...props}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: /Change station/ }));
    return select;
}

describe('StationPicker', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal(
            'matchMedia',
            vi.fn(() => ({
                matches: true,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }))
        );
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('opens a named dialog and selects a station in one tap', () => {
        const select = openPicker();
        expect(screen.getByRole('dialog', { name: 'Stations' })).toBeTruthy();
        fireEvent.click(
            screen.getByRole('button', { name: 'Select Health Sciences' })
        );
        expect(select).toHaveBeenCalledWith(stations[1]);
        expect(screen.queryByRole('dialog')).toBeNull();
    });
    it('filters case-insensitively, shows an empty state, and clears search', () => {
        openPicker();
        const input = screen.getByRole('searchbox');
        fireEvent.change(input, { target: { value: '  HEALTH  ' } });
        expect(
            screen.getByRole('button', { name: 'Select Health Sciences' })
        ).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: /Select Central/ })
        ).toBeNull();
        fireEvent.change(input, { target: { value: 'missing' } });
        expect(screen.getByText('No stations match')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
        expect(
            screen.getByRole('button', { name: /Select Central/ })
        ).toBeTruthy();
    });
    it('saves favourites without selecting or closing, then restores them on remount', () => {
        const select = openPicker();
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Health Sciences to favourites',
            })
        );
        expect(select).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog')).toBeTruthy();
        expect(JSON.parse(localStorage.getItem(FAVOURITES_KEY)!)).toEqual([
            'health',
        ]);
        cleanup();
        openPicker();
        const section = screen.getByRole('region', { name: 'Favourites' });
        expect(
            within(section).getByRole('button', {
                name: 'Select Health Sciences',
            })
        ).toBeTruthy();
        fireEvent.click(
            within(section).getByRole('button', {
                name: 'Remove Health Sciences from favourites',
            })
        );
        expect(screen.queryByRole('region', { name: 'Favourites' })).toBeNull();
    });
    it('sorts by real location and labels straight-line distances', () => {
        openPicker({ location: { lat: 53.52, lon: -113.52 } });
        expect(
            screen.getAllByRole('button', { name: /^Select / })[0].textContent
        ).toContain('Health Sciences');
        expect(
            screen.getByText(
                'Distances are straight-line estimates, not walking routes.'
            )
        ).toBeTruthy();
    });
    it('does not imply proximity without a device location', () => {
        openPicker();
        expect(screen.getByText('All stations')).toBeTruthy();
        expect(screen.queryByText('Near you')).toBeNull();
    });
    it('handles corrupt storage and loading stations', () => {
        localStorage.setItem(FAVOURITES_KEY, '{broken');
        openPicker({ isLoading: true });
        expect(screen.getByText('Loading stations…')).toBeTruthy();
    });
    it('keeps working and reports when storage is unavailable', () => {
        openPicker();
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('denied');
        });
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Add Health Sciences to favourites',
            })
        );
        expect(screen.getByText(/couldn’t be saved/)).toBeTruthy();
    });
    it('opens the mobile drawer without focusing search and expands on search focus', () => {
        vi.mocked(window.matchMedia).mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as MediaQueryList);
        openPicker();
        const dialog = screen.getByRole('dialog', { name: 'Stations' });
        expect(dialog.hasAttribute('data-expanded')).toBe(false);
        expect(document.activeElement).not.toBe(screen.getByRole('searchbox'));
        fireEvent.focus(screen.getByRole('searchbox'));
        expect(dialog.hasAttribute('data-expanded')).toBe(true);
    });
});
