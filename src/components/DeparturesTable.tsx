import { cn } from '@/components/lib/utils';
import { ProcessedDeparture } from '../types/departures';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RailSymbol } from 'lucide-react';

interface DeparturesTableProps {
    processedDepartures: ProcessedDeparture[][];
    animationKey?: number;
}

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
                {nonEmptyGroups.map((group, platformIdx) => (
                    <div
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={platformIdx}
                        className="relative flex w-full flex-1 items-stretch"
                        style={{
                            animationDelay: `${platformIdx * 1}ms`,
                        }}
                    >
                        {/* <div className="relative flex w-6 flex-col items-center justify-center bg-transparent sm:w-6">
                                <span className="absolute top-1/2 bg-gradient-to-r from-foreground/0 to-transparent px-1.5 py-0.5 font-mono text-xs font-[600] tracking-[0.2em] whitespace-nowrap text-foreground/70 uppercase">
                                    <span className="hidden">
                                        Platform {idx + 1}
                                    </span>
                                    <span>{idx + 1}</span>
                                </span>
                            </div> */}

                        <div
                            className="flex flex-1 flex-col"
                            style={{
                                animationDelay: `${platformIdx * 100 + 1 * 10}ms`,
                            }}
                        >
                            <div className="relative flex flex-col justify-center bg-foreground/[1%] text-sm backdrop-blur-md">
                                <div className="flex flex-row items-center justify-start px-4 py-2 text-xs font-[600] tracking-[0.1em] whitespace-nowrap text-foreground/70 uppercase">
                                    <div className="hidden w-1/3">
                                        Destination
                                    </div>
                                    <div className="flex w-1/3 flex-0 flex-row items-center gap-x-1 font-display text-sm font-semibold tracking-normal capitalize">
                                        <RailSymbol className="h-4 w-4" />
                                        Platform {platformIdx + 1}
                                    </div>
                                    <div className="hidden w-1/3 text-right">
                                        Time
                                    </div>
                                    {/* <span>{idx + 1}</span> */}
                                </div>
                            </div>
                            {/* <div className="grid grid-cols-2 gap-2 bg-transparent px-4 py-2 font-display text-xs tracking-[0.15em] text-foreground uppercase">
                                    <span className="font-[500] text-muted-foreground">
                                        Destination
                                    </span>
                                    <span className="text-right text-muted-foreground">
                                        Time
                                    </span>
                                </div> */}
                            <ScrollArea className="h-0 flex-1 sm:min-h-[30dvh]">
                                <div className="divide-y divide-dotted divide-foreground/5">
                                    {group.map((dep, i) => (
                                        <div
                                            // eslint-disable-next-line @eslint-react/no-array-index-key
                                            key={`${animationKey}-${platformIdx}-${i}`}
                                            className={cn(
                                                'grid animate-in grid-cols-3 gap-1 px-4 py-2 text-sm opacity-0 duration-200 direction-reverse fade-in-100 fill-mode-forwards',
                                                'hover:cursor-pointer hover:bg-accent/20 hover:text-accent-foreground'
                                            )}
                                            style={{
                                                animationDelay: `${platformIdx * 100 + i * 75}ms`,
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    'col-span-2 truncate font-display text-sm font-[600] tracking-wide group-hover:text-accent-foreground sm:text-base'
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
                                    ))}
                                </div>
                                {/* Bottom gradient mask */}
                                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-background/70 to-transparent"></div>
                            </ScrollArea>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
