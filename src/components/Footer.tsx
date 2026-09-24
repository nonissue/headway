import { RefreshCw } from 'lucide-react';
import { AboutDialog } from './AboutDialog';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';

interface FooterProps {
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export function Footer({ onRefresh, isRefreshing = false }: FooterProps) {
    return (
        <footer className="flex h-14 shrink-0 border-t-2 border-b border-t-foreground">
            <AboutDialog
                name="Andy Williams"
                email="andy@nonissue.org"
                website="https://andy.ws"
                github="https://github.com/nonissue/next-departures"
                note="Scheduled departures from ETS GTFS data. Live delays are not included."
            />
            <div className="flex-1" />
            <ThemeToggle />
            <Button
                variant="footer"
                size="footer-icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-busy={isRefreshing}
                aria-label="Refresh departures"
                title="Refresh departures"
            >
                <RefreshCw
                    data-icon="inline-start"
                    aria-hidden="true"
                    className={isRefreshing ? 'animate-spin' : undefined}
                />
            </Button>
        </footer>
    );
}
