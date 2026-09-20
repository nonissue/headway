import { RefreshCw } from 'lucide-react';
import { AboutDialog } from './AboutDialog';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { DEFAULT_TIMEZONE } from '../config';

interface FooterProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
    isRefreshing?: boolean;
}

export function Footer({
    lastUpdated,
    onRefresh,
    isRefreshing = false,
}: FooterProps) {
    return (
        <footer className="departures-footer">
            <AboutDialog
                name="Andy Williams"
                email="andy@nonissue.org"
                website="https://andy.ws"
                github="https://github.com/nonissue/next-departures"
                note="Scheduled departures from ETS GTFS data. Live delays are not included."
                triggerLabel="About"
            />
            <div className="schedule-status" role="status">
                <span>Scheduled times</span>
                {lastUpdated && (
                    <time dateTime={lastUpdated.toISOString()}>
                        Updated{' '}
                        {lastUpdated.toLocaleTimeString('en-CA', {
                            timeZone: DEFAULT_TIMEZONE,
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        })}
                    </time>
                )}
            </div>
            <ThemeToggle />
            <Button
                variant="plain"
                size="icon"
                className="footer-icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh departures"
                title="Refresh departures"
            >
                <RefreshCw
                    data-icon="inline-start"
                    className={isRefreshing ? 'animate-spin' : undefined}
                />
            </Button>
        </footer>
    );
}
