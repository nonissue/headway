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
        const { container } = render(<Footer onRefresh={vi.fn()} />);

        expect(container.querySelector('time')).toBeNull();
        expect(screen.queryByText('Scheduled times')).toBeNull();
        expect(
            screen.getByRole('button', { name: 'Refresh departures' })
        ).toBeTruthy();
    });

    it('renders the about and theme controls and refresh action', () => {
        const onRefresh = vi.fn();

        render(<Footer onRefresh={onRefresh} />);

        expect(screen.getByText('about-dialog')).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Toggle theme' })
        ).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Refresh departures' })
        );

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('disables refresh while a request is running', () => {
        const onRefresh = vi.fn();
        render(<Footer onRefresh={onRefresh} isRefreshing />);
        const button = screen.getByRole('button', {
            name: 'Refresh departures',
        });
        expect(button.hasAttribute('disabled')).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        fireEvent.click(button);
        expect(onRefresh).not.toHaveBeenCalled();
    });
});
