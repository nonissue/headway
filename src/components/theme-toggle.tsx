import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveTheme, useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const activeTheme = resolveTheme(theme);
    const Icon = activeTheme === 'dark' ? Moon : Sun;

    return (
        <Button
            variant="footer"
            size="footer-icon"
            onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
        >
            <Icon data-icon="inline-start" aria-hidden="true" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
