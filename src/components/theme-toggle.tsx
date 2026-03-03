import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveTheme, useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const activeTheme = resolveTheme(theme);
    const Icon = activeTheme === 'dark' ? Moon : Sun;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
            className="border border-border/50 bg-gradient-to-r from-foreground/[8%] to-foreground/[4%] shadow-sm transition-all duration-300 hover:border-primary/40 hover:from-foreground/[10%] hover:to-foreground/[6%]"
        >
            <Icon className="h-4 w-4 text-primary" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
