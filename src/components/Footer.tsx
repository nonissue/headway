import { History, RefreshCw } from 'lucide-react';
import CreatorBadgeInline from './features/CreatorBadgePopover';

interface FooterProps {
    lastUpdated: Date | null;
    onRefresh: () => void;
}

export function Footer({ lastUpdated, onRefresh }: FooterProps) {
    if (!lastUpdated) return null;

    return (
        <div className="relative z-0 flex items-center justify-between border-t border-l-4 border-border/50 border-l-foreground/20 bg-gradient-to-t from-foreground/[8%] via-foreground/[5%] to-foreground/[2%] px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-sm backdrop-blur-md sm:p-4 sm:pb-4">
            <div className="relative">
                <CreatorBadgeInline
                    name="Andy Williams"
                    email="andy@nonissue.org"
                    website="https://andy.ws"
                    github="https://github.com/nonissue/next-departures"
                    note="Built with GTFS data; times are estimates and may change. "
                    startYear={2025}
                    triggerLabel="About"
                    className="cursor-pointer rounded-lg border border-border/50 bg-gradient-to-r from-foreground/[6%] to-foreground/[3%] px-3 py-2 font-display text-xs font-semibold tracking-wider text-foreground uppercase shadow-sm transition-all duration-300 hover:border-primary/40 hover:from-foreground/[8%] hover:to-foreground/[5%]"
                />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-gradient-to-r from-foreground/[6%] to-foreground/[3%] px-3 py-1.5 shadow-sm">
                <History className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs font-semibold tracking-wider text-foreground">
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
                className="group flex items-center gap-2 rounded-lg border border-border/50 bg-gradient-to-r from-foreground/[6%] to-foreground/[3%] px-3 py-2 font-display text-xs font-semibold tracking-wider text-foreground uppercase shadow-sm transition-all duration-300 hover:cursor-pointer hover:border-primary/40 hover:from-foreground/[8%] hover:to-foreground/[5%] active:scale-95 active:border-primary/60 active:from-foreground/[12%] active:to-foreground/[8%]"
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <RefreshCw className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:rotate-180 group-active:rotate-180" />
                <span className="hidden font-[500]">Refresh</span>
            </button>
        </div>
    );
}
