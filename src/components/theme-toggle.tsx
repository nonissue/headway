import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('light');
        } else {
            // system - go to the opposite of what system currently shows
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light';
            setTheme(systemTheme === 'dark' ? 'light' : 'dark');
        }
    };

    const getIcon = () => {
        if (theme === 'light') {
            return <Sun className="h-4 w-4 text-primary" />;
        } else if (theme === 'dark') {
            return <Moon className="h-4 w-4 text-primary" />;
        } else {
            // system - show based on actual preference
            const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light';
            return systemTheme === 'dark' ? (
                <Moon className="h-4 w-4 text-primary" />
            ) : (
                <Sun className="h-4 w-4 text-primary" />
            );
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="border border-border/50 bg-gradient-to-r from-foreground/[8%] to-foreground/[4%] shadow-sm transition-all duration-300 hover:border-primary/40 hover:from-foreground/[10%] hover:to-foreground/[6%]"
        >
            {getIcon()}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
