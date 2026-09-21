import { cn } from '@/components/lib/utils';
import { TrainFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LineBadge({
    line,
    hero = false,
    proportional = false,
    className,
}: {
    line?: string;
    hero?: boolean;
    proportional?: boolean;
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'flex shrink-0 items-center justify-center rounded-full border-0 bg-muted p-0 leading-none font-bold tracking-normal text-foreground data-[line=capital]:bg-line-capital data-[line=capital]:text-line-on-colour data-[line=metro]:bg-line-metro data-[line=metro]:text-line-on-amber data-[line=valley]:bg-line-valley data-[line=valley]:text-line-on-colour',
                proportional
                    ? 'line-badge-proportional'
                    : 'size-4.5 text-[11px] data-hero:size-5.5 data-hero:text-[13px] [&_svg]:size-3.5',
                className
            )}
            data-line={line?.toLowerCase()}
            data-hero={hero || undefined}
            aria-label={line ? `${line} Line` : 'LRT'}
        >
            {line ? (
                <span>{line.charAt(0)}</span>
            ) : (
                <TrainFront aria-hidden="true" />
            )}
        </Badge>
    );
}
