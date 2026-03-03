// @vitest-environment jsdom

import type React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Station } from '../types/departures.js';

vi.mock('@/components/ui/button', () => ({
    Button: ({
        children,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    PopoverContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/components/ui/command', () => ({
    Command: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    CommandInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
        <input {...props} />
    ),
    CommandList: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    CommandEmpty: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    CommandGroup: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    CommandItem: ({
        children,
        onSelect,
        value,
    }: {
        children: React.ReactNode;
        onSelect?: (value: string) => void;
        value: string;
    }) => (
        <button type="button" onClick={() => onSelect?.(value)}>
            {children}
        </button>
    ),
}));

import { StationPicker } from './StationPicker';

const stations: Station[] = [
    {
        stop_id: 'station-1',
        stop_name: 'Central Station',
    },
    {
        stop_id: 'station-2',
        stop_name: 'Health Sciences',
    },
];

describe('StationPicker', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the selected station and available options', () => {
        render(
            <StationPicker
                selectedStation={stations[0]}
                stations={stations}
                onStationSelect={vi.fn()}
            />
        );

        expect(screen.getByRole('combobox')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search stations...')).toBeTruthy();
        expect(screen.getAllByText('Central Station').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Health Sciences').length).toBeGreaterThan(0);
    });

    it('shows loading feedback and placeholder text when no station is selected', () => {
        render(
            <StationPicker
                stations={stations}
                isLoading={true}
                onStationSelect={vi.fn()}
            />
        );

        expect(screen.getByRole('combobox')).toBeTruthy();
        expect(screen.getByText('Select station...')).toBeTruthy();
        expect(screen.getByText('Loading stations...')).toBeTruthy();
    });

    it('forwards selected stations to the callback', () => {
        const onStationSelect = vi.fn();

        render(
            <StationPicker
                selectedStation={stations[0]}
                stations={stations}
                onStationSelect={onStationSelect}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /Health Sciences/i }));

        expect(onStationSelect).toHaveBeenCalledWith(stations[1]);
    });
});
