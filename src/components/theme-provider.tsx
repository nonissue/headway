import React, { createContext, use, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
    theme: 'system',
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'vite-ui-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');

        let actualTheme = theme;
        if (theme === 'system') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)')
                .matches
                ? 'dark'
                : 'light';
        }

        root.classList.add(actualTheme);

        // Update all theme-color meta tags dynamically
        const themeColorMetas = document.querySelectorAll(
            'meta[name="theme-color"]'
        );
        const themeColor = actualTheme === 'dark' ? '#242424' : '#ffffff';
        themeColorMetas.forEach((meta) => {
            meta.setAttribute('content', themeColor);
        });

        // Prevent overscroll in PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        if (isPWA) {
            let lastTouchY = 0;

            const preventBounce = (e: TouchEvent) => {
                const touch = e.touches[0];
                const currentY = touch.clientY;

                // Don't prevent scrolling in popovers, dialogs, or other overlays
                const target = e.target as Element;
                if (
                    target.closest('[data-radix-popper-content-wrapper]') ||
                    target.closest('[role="dialog"]') ||
                    target.closest('[data-radix-popover-content]') ||
                    target.closest('.popover') ||
                    target.closest('[data-state="open"]')
                ) {
                    return;
                }

                // Get the main scrollable element
                const main = document.querySelector('main');
                if (!main) return;

                const { scrollTop, scrollHeight, clientHeight } = main;
                const isAtTop = scrollTop <= 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight;

                // Prevent overscroll bounce
                if (isAtTop && currentY > lastTouchY) {
                    e.preventDefault();
                } else if (isAtBottom && currentY < lastTouchY) {
                    e.preventDefault();
                }

                lastTouchY = currentY;
            };

            document.body.addEventListener('touchmove', preventBounce, {
                passive: false,
            });

            return () => {
                document.body.removeEventListener('touchmove', preventBounce);
            };
        }
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
    };

    return (
        <ThemeProviderContext {...props} value={value}>
            {children}
        </ThemeProviderContext>
    );
}

export const useTheme = () => {
    const context = use(ThemeProviderContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
