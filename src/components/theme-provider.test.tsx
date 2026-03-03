// @vitest-environment jsdom

import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './theme-provider';
import { ThemeToggle } from './theme-toggle';

function ThemeState() {
    const { theme } = useTheme();
    return <div>theme:{theme}</div>;
}

function mockMatchMedia(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
            matches,
            media: '(prefers-color-scheme: dark)',
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

describe('theme provider', () => {
    beforeEach(() => {
        const storage = new Map<string, string>();

        document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
        document.documentElement.className = '';
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: {
                getItem: (key: string) => storage.get(key) ?? null,
                setItem: (key: string, value: string) => {
                    storage.set(key, value);
                },
                removeItem: (key: string) => {
                    storage.delete(key);
                },
                clear: () => {
                    storage.clear();
                },
            },
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('reads the stored theme and applies document classes', async () => {
        mockMatchMedia(false);
        window.localStorage.setItem('vite-ui-theme', 'dark');

        render(
            <ThemeProvider>
                <ThemeState />
            </ThemeProvider>
        );

        expect(screen.getByText('theme:dark')).toBeTruthy();

        await waitFor(() => {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
        });
        expect(
            document
                .querySelector('meta[name="theme-color"]')
                ?.getAttribute('content')
        ).toBe('#1f1f23');
    });

    it('toggles from system to dark and persists the new theme', async () => {
        mockMatchMedia(false);

        render(
            <ThemeProvider defaultTheme="system">
                <ThemeToggle />
                <ThemeState />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));

        await waitFor(() => {
            expect(screen.getByText('theme:dark')).toBeTruthy();
        });
        expect(window.localStorage.getItem('vite-ui-theme')).toBe('dark');
    });
});
