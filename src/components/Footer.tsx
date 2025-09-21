import { History, RefreshCw } from 'lucide-react';
import CreatorBadgeInline from './features/CreatorBadgePopover';

interface FooterProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
}

export const Footer = ({ lastUpdated, onRefresh }: FooterProps) => {
    if (!lastUpdated) return null;

    return (
        <div className="border-border/30 from-muted/30 to-accent/10 relative z-10 flex items-center justify-between border-t bg-gradient-to-r p-3">
            <div className="relative">
                <CreatorBadgeInline
                    name="Andy Williams"
                    email="andy@nonissue.org"
                    website="https://andy.ws"
                    github="https://github.com/nonissue/next-departures"
                    note="Built with GTFS data; times are estimates and may change."
                    startYear={2025}
                    triggerLabel="About"
                    className="bg-muted/50 rounded-lg border-0 px-3 py-2 backdrop-blur-sm"
                />
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                <History className="text-muted-foreground h-3.5 w-3.5" />
                <span className="text-primary font-mono font-[500]">
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
                className="from-muted/50 to-accent/20 text-foreground hover:from-accent/30 hover:to-accent/40 flex items-center gap-2 rounded-lg bg-gradient-to-r px-3 py-2 text-xs font-bold tracking-wider uppercase backdrop-blur-sm transition-all duration-300"
            >
                <RefreshCw className="text-accent-foreground h-3.5 w-3.5 transition-transform duration-300 hover:rotate-180" />
                <span className="font-[500]">Refresh</span>
            </button>
        </div>
    );
};