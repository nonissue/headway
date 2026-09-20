// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./AboutDialog', () => ({
    AboutDialog: () => <div>about-dialog</div>,
}));

import { Footer } from './Footer';

vi.mock('./theme-toggle', () => ({
    ThemeToggle: () => <button>Toggle theme</button>,
}));

afterEach(cleanup);

describe('Footer', () => {
    it('keeps controls available before the first successful load', () => {
        const { container } = render(
            <Footer lastUpdated={null} onRefresh={vi.fn()} />
        );

        expect(container.textContent).toContain('Scheduled times');
        expect(
            screen.getByRole('button', { name: 'Refresh departures' })
        ).toBeTruthy();
    });

    it('renders the about trigger, timestamp, and refresh action', () => {
        const onRefresh = vi.fn();
        const lastUpdated = new Date('2026-03-03T12:34:56.000Z');
        const expectedTime = lastUpdated.toLocaleTimeString('en-CA', {
            timeZone: 'America/Edmonton',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        render(<Footer lastUpdated={lastUpdated} onRefresh={onRefresh} />);

        expect(screen.getByText('about-dialog')).toBeTruthy();
        expect(screen.getByText(`Updated ${expectedTime}`)).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Refresh departures' })
        );

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });
});
