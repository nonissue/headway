import React, { createContext, use, useEffect, useMemo, useState } from 'react';

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
        const themeColor = actualTheme === 'dark' ? '#1f1f23' : '#ffffff';
        themeColorMetas.forEach((meta) => {
            meta.setAttribute('content', themeColor);
        });

    }, [theme]);

    // const value = {
    //     theme,
    //     setTheme: (theme: Theme) => {
    //         localStorage.setItem(storageKey, theme);
    //         setTheme(theme);
    //     },
    // };

    // resolves:
    // A/an 'object expression' passed as the value prop to the context provider should not be constructed. It will change on every render. Consider wrapping it in a useMemo hook.
    const value = useMemo(
        () => ({
            theme,
            setTheme: (theme: Theme) => {
                localStorage.setItem(storageKey, theme);
                setTheme(theme);
            },
        }),
        [storageKey, theme]
    );

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
