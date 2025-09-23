import { History, RefreshCw } from 'lucide-react';
import CreatorBadgeInline from './features/CreatorBadgePopover';

interface FooterProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
}

export function Footer({ lastUpdated, onRefresh }: FooterProps) {
    if (!lastUpdated) return null;

    return (
        <div className="relative z-0 flex items-center justify-between border-t border-border/30 bg-transparent px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
            <div className="relative">
                <CreatorBadgeInline
                    name="Andy Williams"
                    email="andy@nonissue.org"
                    website="https://andy.ws"
                    github="https://github.com/nonissue/next-departures"
                    note="Built with GTFS data; times are estimates and may change."
                    startYear={2025}
                    triggerLabel="About"
                    className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-secondary-foreground hover:ring-2 hover:ring-foreground"
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
                className="group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold tracking-wider text-primary uppercase transition-all duration-300 hover:cursor-pointer hover:ring-2 hover:ring-foreground"
            >
                <RefreshCw className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:rotate-180" />
                <span className="hidden font-[500]">Refresh</span>
            </button>
        </div>
    );
}
