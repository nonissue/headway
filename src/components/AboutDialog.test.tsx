// @vitest-environment jsdom

import { createElement, isValidElement, type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function withInjectedTriggerProps(
    children: ReactNode,
    injectedProps: Record<string, string>
) {
    if (!isValidElement(children)) {
        return children;
    }

    const childProps = (children.props ?? {}) as Record<string, unknown>;

    return createElement(children.type, {
        ...childProps,
        ...injectedProps,
    } as Record<string, unknown>);
}

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialogTrigger: ({ children }: { children: ReactNode }) =>
        withInjectedTriggerProps(children, {
            'data-trigger-probe': 'dialog',
        }),
    DialogContent: ({ children }: { children: ReactNode }) => (
        <div data-testid="dialog-content">{children}</div>
    ),
    DialogHeader: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DialogDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DrawerTrigger: ({ children }: { children: ReactNode }) =>
        withInjectedTriggerProps(children, {
            'data-trigger-probe': 'drawer',
        }),
    DrawerContent: ({ children }: { children: ReactNode }) => (
        <div data-testid="drawer-content">{children}</div>
    ),
    DrawerHeader: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DrawerFooter: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DrawerClose: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DrawerDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

import { AboutDialog } from './AboutDialog';

function mockMatchMedia(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
            matches,
            media: '(min-width: 640px)',
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

describe('AboutDialog', () => {
    beforeEach(() => {
        mockMatchMedia(true);
    });

    afterEach(() => {
        cleanup();
    });

    it('renders the current desktop dialog layout with metadata and links', () => {
        render(
            <AboutDialog
                name="Andy"
                email="andy@example.com"
                website="https://example.com"
                github="https://github.com/example/repo"
                note="Built with GTFS data."
                triggerLabel="Info"
            />
        );

        expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
        expect(
            screen
                .getByRole('button', { name: 'Info' })
                .getAttribute('data-trigger-probe')
        ).toBe('dialog');
        expect(screen.getByTestId('dialog-content')).toBeTruthy();
        expect(screen.queryByTestId('drawer-content')).toBeNull();
        expect(screen.getByText('Know when to go.')).toBeTruthy();
        expect(screen.getByText('Built with GTFS data.')).toBeTruthy();
        expect(screen.getByText('Andy')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: 'Email' }).getAttribute('href')
        ).toBe('mailto:andy@example.com');
        expect(
            screen.getByRole('link', { name: 'Website' }).getAttribute('href')
        ).toBe('https://example.com');
        expect(
            screen.getByRole('link', { name: 'GitHub' }).getAttribute('href')
        ).toBe('https://github.com/example/repo');
    });

    it('renders the drawer version on small viewports and omits optional links', () => {
        mockMatchMedia(false);

        render(<AboutDialog name="Andy" />);

        expect(screen.getByTestId('drawer-content')).toBeTruthy();
        expect(screen.queryByTestId('dialog-content')).toBeNull();
        expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
        expect(
            screen
                .getByRole('button', { name: 'About' })
                .getAttribute('data-trigger-probe')
        ).toBe('drawer');
        expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
        expect(screen.getByText('Headway')).toBeTruthy();
        expect(screen.getByText('Andy')).toBeTruthy();
        expect(screen.getByText('Install Tip')).toBeTruthy();
        expect(screen.queryByRole('link', { name: 'Email' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'Website' })).toBeNull();
        expect(screen.queryByRole('link', { name: 'GitHub' })).toBeNull();
    });
});
