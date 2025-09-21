import { cn } from '@/components/lib/utils';
import { ProcessedDeparture } from '../types/departures';

interface DeparturesTableProps {
    processedDepartures: ProcessedDeparture[][];
    departuresKey: number;
    isTransitioning: boolean;
}

export const DeparturesTable = ({
    processedDepartures,
    departuresKey,
    isTransitioning
}: DeparturesTableProps) => {
    return (
        <div
            key={departuresKey}
            className={cn(
                'relative transition-all duration-500 ease-in-out',
                isTransitioning
                    ? 'scale-[1] opacity-50 blur-[0px]'
                    : 'blur-0 animate-in fade-in-0 scale-100 opacity-100 duration-700'
            )}
        >
            <div className="divide-foreground/20 relative space-y-0 divide-y border-y">
                {processedDepartures.map((group, idx) =>
                    group.length == 0 ? (
                        <></>
                    ) : (
                        <div
                            key={`${departuresKey}-${idx}`}
                            className="animate-in blur-in-0 relative flex w-full items-stretch"
                            style={{
                                animationDelay: `${idx * 1}ms`,
                            }}
                        >
                            <div className="border-border/100 relative flex min-h-32 w-10 flex-col items-center justify-center border-r border-b-0 border-solid">
                                <span className="text-muted-foreground rotate-[-90deg] text-xs font-bold tracking-[0.2em] whitespace-nowrap uppercase drop-shadow-xs">
                                    Platform {idx + 1}
                                </span>
                            </div>

                            <div className="divide-foreground/20 flex-1 divide-y divide-dotted">
                                <div className="text-foreground grid grid-cols-3 gap-2 bg-transparent px-4 py-2 text-xs font-bold tracking-wider uppercase">
                                    <span className="text-muted-foreground font-[500]">
                                        Time
                                    </span>
                                    <span className="text-muted-foreground col-span-2 font-[500]">
                                        Destination
                                    </span>
                                </div>
                                {group.map((dep, i) => (
                                    <div
                                        key={`${departuresKey}-${idx}-${i}`}
                                        className={cn(
                                            'group animate-fade-in-up animate-duration-300 animate-ease-out grid grid-cols-3 gap-1 px-4 py-2 text-sm transition-all duration-200 ease-in-out',
                                            'hover:bg-accent/20 hover:text-accent-foreground hover:cursor-pointer'
                                        )}
                                        style={{
                                            animationDelay: `${idx * 100 + i * 50}ms`,
                                        }}
                                    >
                                        <div className="text-primary/90 group-hover:text-accent-foreground my-auto font-mono text-xs font-[400] tracking-wider sm:text-sm">
                                            {dep.displayTime}
                                        </div>
                                        <div className="text-chart-3 group-hover:text-accent-foreground font-display col-span-2 truncate text-sm font-[400] tracking-widest uppercase sm:text-base">
                                            {dep.stop_headsign}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};