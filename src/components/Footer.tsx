import { History, RefreshCw } from 'lucide-react';
import CreatorBadgeInline from './features/CreatorBadgePopover';

interface FooterProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
}

export function Footer({ lastUpdated, onRefresh }: FooterProps) {
    if (!lastUpdated) return null;

    return (
        <div className="relative z-10 flex items-center justify-between border-t border-border/30 bg-gradient-to-r from-muted/30 to-accent/10 p-3">
            <div className="relative">
                <CreatorBadgeInline
                    name="Andy Williams"
                    email="andy@nonissue.org"
                    website="https://andy.ws"
                    github="https://github.com/nonissue/next-departures"
                    note="Built with GTFS data; times are estimates and may change."
                    startYear={2025}
                    triggerLabel="About"
                    className="rounded-lg border-0 bg-muted/50 px-3 py-2 backdrop-blur-sm"
                />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono font-[500] text-primary">
                    {lastUpdated?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                    })}
                </span>
            </div>

            <button
                onClick={onRefresh}
                type="button"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-muted/50 to-accent/20 px-3 py-2 text-xs font-bold tracking-wider text-foreground uppercase backdrop-blur-sm transition-all duration-300 hover:from-accent/30 hover:to-accent/40"
            >
                <RefreshCw className="h-3.5 w-3.5 text-accent-foreground transition-transform duration-300 hover:rotate-180" />
                <span className="font-[500]">Refresh</span>
            </button>
        </div>
    );
}
