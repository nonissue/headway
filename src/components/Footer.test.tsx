// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./AboutDialog', () => ({
    AboutDialog: () => <div>about-dialog</div>,
}));

import { Footer } from './Footer';

describe('Footer', () => {
    it('renders nothing when no last-updated time is available', () => {
        const { container } = render(
            <Footer lastUpdated={null} onRefresh={vi.fn()} />
        );

        expect(container.innerHTML).toBe('');
    });

    it('renders the about trigger, timestamp, and refresh action', () => {
        const onRefresh = vi.fn();
        const lastUpdated = new Date('2026-03-03T12:34:56.000Z');
        const expectedTime = lastUpdated.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        render(<Footer lastUpdated={lastUpdated} onRefresh={onRefresh} />);

        expect(screen.getByText('about-dialog')).toBeTruthy();
        expect(screen.getByText(expectedTime)).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Refresh departures' })
        );

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });
});
