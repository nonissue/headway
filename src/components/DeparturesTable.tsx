import { cn } from '@/components/lib/utils';
import { getHeadsignColorClasses } from '../lib/departure-display.js';
import type { DepartureGroup } from '../types/departures';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeparturesTableProps {
    departureGroups: DepartureGroup[];
    animationKey?: number;
}

export const DeparturesTable = ({
    departureGroups,
    animationKey = 0,
}: DeparturesTableProps) => {
    return (
        <div className="relative flex h-full max-w-xl flex-col">
            <div className="relative flex h-full flex-col">
                {departureGroups.map((group, platformIdx) => {
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
                                        <div
                                            className={cn(
                                                'font-display text-xl font-bold transition-all sm:text-2xl'
                                            )}
                                        >
                                            {group.heading}
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2 text-right">
                                            {group.destinations.map((dest) => {
                                                const colorClasses =
                                                    getHeadsignColorClasses(
                                                        dest
                                                    );
                                                return (
                                                    <span
                                                        key={dest}
                                                        className={cn(
                                                            'max-w-24 truncate rounded-full border-0 px-3 py-1 font-display text-sm font-bold backdrop-blur-lg transition-all',
                                                            colorClasses.border,
                                                            colorClasses.bgBadge,
                                                            colorClasses.text
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
                                        {group.departures.map((dep, i) => {
                                            const colorClasses =
                                                getHeadsignColorClasses(
                                                    dep.displayHeadsign
                                                );
                                            return (
                                                <div
                                                    // eslint-disable-next-line @eslint-react/no-array-index-key
                                                    key={`${animationKey}-${platformIdx}-${i}`}
                                                    className={cn(
                                                        'relative grid animate-in grid-cols-3 gap-1 py-2.5 pr-4 pl-5 opacity-0 duration-200 direction-reverse fade-in-100 fill-mode-forwards',
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
                                                            'col-span-2 truncate font-display text-lg font-[600] tracking-wide brightness-100 group-hover:text-accent-foreground sm:text-lg dark:brightness-100',
                                                            colorClasses.bg.replace(
                                                                'bg-',
                                                                'text-'
                                                            )
                                                        )}
                                                    >
                                                        {dep.displayHeadsign}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'col-span-1 my-auto text-right font-mono text-base font-[500] opacity-90 brightness-75 saturate-50 group-hover:text-accent-foreground sm:text-lg dark:brightness-125'
                                                            // colorClasses.text
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
