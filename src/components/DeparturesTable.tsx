import { cn } from '@/components/lib/utils';
import { ProcessedDeparture } from '../types/departures';

interface DeparturesTableProps {
    processedDepartures: ProcessedDeparture[][];
    departuresKey: number;
    isTransitioning: boolean;
    isRefreshing?: boolean;
}

export const DeparturesTable = ({
    processedDepartures,
    departuresKey,
    isTransitioning,
    isRefreshing = false,
}: DeparturesTableProps) => {
    return (
        <div
            key={departuresKey}
            className={cn(
                'relative transition-all ease-in-out',
                isTransitioning
                    ? 'scale-[1] opacity-0 blur-[10px]'
                    : isRefreshing
                      ? 'animate-in duration-700 ease-out slide-in-from-right-8'
                      : 'scale-100 animate-in duration-500 fade-in-100'
            )}
        >
            <div className="relative space-y-0 divide-y divide-foreground/20 border-y">
                {processedDepartures.map((group, idx) =>
                    group.length == 0 ? (
                        // eslint-disable-next-line @eslint-react/no-missing-key
                        <></>
                    ) : (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={`${departuresKey}-${idx}`}
                            className="relative flex w-full animate-in items-stretch blur-in-0"
                            style={{
                                animationDelay: `${idx * 1}ms`,
                            }}
                        >
                            <div className="relative flex min-h-32 w-10 flex-col items-center justify-center border-r border-b-0 border-solid border-border/100">
                                <span className="rotate-[-90deg] text-xs font-bold tracking-[0.2em] whitespace-nowrap text-muted-foreground uppercase drop-shadow-xs">
                                    Platform {idx + 1}
                                </span>
                            </div>

                            <div className="flex-1 divide-y divide-dotted divide-foreground/20">
                                <div className="grid grid-cols-3 gap-2 bg-transparent px-4 py-2 text-xs font-bold tracking-wider text-foreground uppercase">
                                    <span className="font-[500] text-muted-foreground">
                                        Time
                                    </span>
                                    <span className="col-span-2 font-[500] text-muted-foreground">
                                        Destination
                                    </span>
                                </div>
                                {group.map((dep, i) => (
                                    <div
                                        // eslint-disable-next-line @eslint-react/no-array-index-key
                                        key={`${departuresKey}-${idx}-${i}`}
                                        className={cn(
                                            'group grid animate-in grid-cols-3 gap-1 px-4 py-2 text-sm opacity-0 duration-200 direction-reverse fade-in-100 fill-mode-forwards',
                                            'hover:cursor-pointer hover:bg-accent/20 hover:text-accent-foreground'
                                        )}
                                        style={{
                                            animationDelay: `${idx * 100 + i * 50}ms`,
                                        }}
                                    >
                                        <div className="my-auto font-mono text-xs font-[400] tracking-wider text-primary/90 group-hover:text-accent-foreground sm:text-sm">
                                            {dep.displayTime}
                                        </div>
                                        <div className="col-span-2 truncate font-display text-sm font-[600] tracking-widest text-chart-3 uppercase group-hover:text-accent-foreground sm:text-base">
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
