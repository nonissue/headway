import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveTheme, useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const activeTheme = resolveTheme(theme);
    const Icon = activeTheme === 'dark' ? Moon : Sun;

    return (
        <Button
            variant="plain"
            size="icon"
            onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
            className="size-full min-h-12 cursor-pointer rounded-none border-0 border-l bg-transparent p-0 text-foreground shadow-none focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid"
        >
            <Icon className="h-4 w-4 text-primary" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
