import React, {
    createContext,
    use,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = Exclude<Theme, 'system'>;

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
    undefined
);

function canUseBrowserThemeApis(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.localStorage !== 'undefined' &&
        typeof window.matchMedia === 'function'
    );
}

function isTheme(value: string | null): value is Theme {
    return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
    if (!canUseBrowserThemeApis()) {
        return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : defaultTheme;
}

export function getSystemTheme(): ResolvedTheme {
    if (!canUseBrowserThemeApis()) {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
    return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() =>
        readStoredTheme(storageKey, defaultTheme)
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        const actualTheme = resolveTheme(theme);

        root.classList.add(actualTheme);
    }, [theme]);

    const handleSetTheme = useCallback(
        (nextTheme: Theme) => {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storageKey, nextTheme);
            }

            setTheme(nextTheme);
        },
        [storageKey]
    );

    const value = useMemo(
        () => ({
            theme,
            setTheme: handleSetTheme,
        }),
        [handleSetTheme, theme]
    );

    return (
        <ThemeProviderContext value={value}>{children}</ThemeProviderContext>
    );
}

export const useTheme = () => {
    const context = use(ThemeProviderContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
};
