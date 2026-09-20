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
            className="footer-icon"
        >
            <Icon className="h-4 w-4 text-primary" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
