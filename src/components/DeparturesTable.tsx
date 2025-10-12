import { cn } from '@/components/lib/utils';
import { ProcessedDeparture } from '../types/departures';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeparturesTableProps {
    processedDepartures: ProcessedDeparture[][];
    animationKey?: number;
}

// Simple hash function to generate consistent colors for headsigns
const getHeadsignColorClasses = (
    headsign: string
): { border: string; bg: string } => {
    // 8 distinct colors for different destinations
    const colors = [
        { border: 'border-headsign-1', bg: 'bg-headsign-1' }, // Blue
        { border: 'border-headsign-2', bg: 'bg-headsign-2' }, // Red
        { border: 'border-headsign-3', bg: 'bg-headsign-3' }, // Green
        { border: 'border-headsign-4', bg: 'bg-headsign-4' }, // Purple
        { border: 'border-headsign-5', bg: 'bg-headsign-5' }, // Orange
        { border: 'border-headsign-6', bg: 'bg-headsign-6' }, // Cyan
        { border: 'border-headsign-7', bg: 'bg-headsign-7' }, // Yellow
        { border: 'border-headsign-8', bg: 'bg-headsign-8' }, // Pink
    ];

    // Simple hash based on headsign characters
    let hash = 0;
    for (let i = 0; i < headsign.length; i++) {
        hash = (hash << 5) - hash + headsign.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }

    return colors[Math.abs(hash) % colors.length];
};

// Determine platform direction based on common destinations
const getPlatformDirection = (departures: ProcessedDeparture[]): string => {
    if (!departures || departures.length === 0) return 'Platform';

    // Get unique destinations for this platform
    const destinations = [...new Set(departures.map((d) => d.stop_headsign))];

    // Common northbound/eastbound destinations
    const northbound = ['NAIT', 'Clareview', 'Gorman'];
    // Common southbound/westbound destinations
    const southbound = ['Century Park', 'Mill Woods', 'Health Sciences'];

    const hasNorthbound = destinations.some((dest) =>
        northbound.some((nb) => dest.includes(nb))
    );
    const hasSouthbound = destinations.some((dest) =>
        southbound.some((sb) => dest.includes(sb))
    );

    if (hasNorthbound) return `Northbound · ${destinations.join(', ')}`;
    if (hasSouthbound) return `Southbound · ${destinations.join(', ')}`;

    // Fallback: just show destinations
    return destinations.join(', ');
};

export const DeparturesTable = ({
    processedDepartures,
    animationKey = 0,
}: DeparturesTableProps) => {
    const nonEmptyGroups = processedDepartures.filter(
        (group) => group.length > 0
    );

    return (
        <div className="relative flex h-full max-w-xl flex-col">
            <div className="relative flex h-full flex-col">
                {nonEmptyGroups.map((group, platformIdx) => {
                    const direction = getPlatformDirection(group);
                    return (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={platformIdx}
                            className="relative flex w-full flex-1 items-stretch"
                            style={{
                                animationDelay: `${platformIdx * 1}ms`,
                            }}
                        >
                            <div
                                className="flex flex-1 flex-col"
                                style={{
                                    animationDelay: `${platformIdx * 100 + 1 * 10}ms`,
                                }}
                            >
                                <div className="relative border-b border-l-4 border-border/50 border-l-foreground/20 bg-gradient-to-b from-foreground/[8%] via-foreground/[5%] to-foreground/[2%] px-4 py-4 shadow-sm backdrop-blur-md">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="font-display text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                                            {direction.split(' · ')[0]}
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2 text-right">
                                            {[
                                                ...new Set(
                                                    group.map(
                                                        (d) => d.stop_headsign
                                                    )
                                                ),
                                            ].map((dest) => {
                                                const colorClasses =
                                                    getHeadsignColorClasses(
                                                        dest
                                                    );
                                                return (
                                                    <span
                                                        key={dest}
                                                        className={cn(
                                                            'max-w-32 truncate rounded-full border border-border bg-muted px-2.5 py-1 font-display text-xs font-semibold transition-all',
                                                            colorClasses.bg.replace(
                                                                'bg-',
                                                                'text-'
                                                            )
                                                        )}
                                                    >
                                                        {dest}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <ScrollArea className="h-0 flex-1 sm:min-h-[30dvh]">
                                    <div className="divide-y divide-dotted divide-foreground/10">
                                        <div
                                            className={cn(
                                                'absolute top-0 bottom-0 left-0 w-1 bg-foreground/20'
                                            )}
                                        />
                                        {group.map((dep, i) => {
                                            const colorClasses =
                                                getHeadsignColorClasses(
                                                    dep.stop_headsign
                                                );
                                            return (
                                                <div
                                                    // eslint-disable-next-line @eslint-react/no-array-index-key
                                                    key={`${animationKey}-${platformIdx}-${i}`}
                                                    className={cn(
                                                        'relative grid animate-in grid-cols-3 gap-1 py-2.5 pr-4 pl-4 text-sm opacity-0 duration-200 direction-reverse fade-in-100 fill-mode-forwards',
                                                        'hover:cursor-pointer hover:bg-accent/20 hover:text-accent-foreground'
                                                    )}
                                                    style={{
                                                        animationDelay: `${platformIdx * 100 + i * 75}ms`,
                                                    }}
                                                >
                                                    <div
                                                        className={cn(
                                                            'absolute top-0 bottom-0 left-0 w-1',
                                                            colorClasses.bg
                                                        )}
                                                    />
                                                    <div
                                                        className={cn(
                                                            'col-span-2 truncate font-display text-sm font-[600] tracking-wide brightness-75 group-hover:text-accent-foreground sm:text-base dark:brightness-100',
                                                            colorClasses.bg.replace(
                                                                'bg-',
                                                                'text-'
                                                            )
                                                        )}
                                                    >
                                                        {dep.stop_headsign}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'col-span-1 my-auto text-right font-mono text-sm opacity-90 group-hover:text-accent-foreground sm:text-sm'
                                                        )}
                                                    >
                                                        {dep.displayTime}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Bottom gradient mask */}
                                    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-background/70 to-transparent"></div>
                                </ScrollArea>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
