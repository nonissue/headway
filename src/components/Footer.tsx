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
        <footer className="grid min-h-[58px] shrink-0 grid-cols-[104px_minmax(0,1fr)_48px_48px] border-t-2 border-b border-t-foreground [@media(max-width:360px)]:grid-cols-[90px_minmax(0,1fr)_48px_48px]">
            <AboutDialog
                name="Andy Williams"
                email="andy@nonissue.org"
                website="https://andy.ws"
                github="https://github.com/nonissue/next-departures"
                note="Scheduled departures from ETS GTFS data. Live delays are not included."
                triggerLabel="About"
            />
            <div
                className="flex min-w-0 flex-col justify-center gap-[3px] border-l px-3 py-2 text-xs leading-normal tabular-nums"
                role="status"
            >
                <span className="text-[9px] font-bold tracking-[0.7px] text-muted-foreground uppercase">
                    Scheduled times
                </span>
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
                className="size-full min-h-12 cursor-pointer rounded-none border-0 border-l bg-transparent p-0 text-foreground shadow-none focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-ring focus-visible:outline-solid"
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
