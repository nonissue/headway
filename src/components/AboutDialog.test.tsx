// @vitest-environment jsdom

import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogTrigger: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DialogContent: ({ children }: { children: ReactNode }) => (
        <div data-testid="dialog-content">{children}</div>
    ),
    DialogDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

import { AboutDialog } from './AboutDialog';

describe('AboutDialog', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders the trigger, metadata, and available links', () => {
        render(
            <AboutDialog
                name="Andy"
                email="andy@example.com"
                website="https://example.com"
                github="https://github.com/example/repo"
                note="Built with GTFS data."
                startYear={2025}
                triggerLabel="Info"
            />
        );

        expect(
            screen.getByRole('button', { name: 'Show app information' })
        ).toBeTruthy();
        expect(screen.getByText('Headway')).toBeTruthy();
        expect(screen.getByText('By Andy')).toBeTruthy();
        expect(screen.getByText('2025-2026')).toBeTruthy();
        expect(screen.getByText('Built with GTFS data.')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: 'Email' }).getAttribute('href')
        ).toBe('mailto:andy@example.com');
        expect(
            screen.getByRole('link', { name: 'Website' }).getAttribute('href')
        ).toBe('https://example.com');
        expect(
            screen.getByRole('link', { name: 'GitHub' }).getAttribute('href')
        ).toBe(
            'https://github.com/example/repo'
        );
    });

    it('omits optional sections when contact props are not provided', () => {
        render(<AboutDialog name="Andy" />);

        expect(screen.queryByRole('link', { name: 'Email' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Website' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'GitHub' })).toBeNull();
        expect(screen.getByText('2026')).toBeTruthy();
    });
});
