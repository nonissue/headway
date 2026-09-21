import { cn } from '@/components/lib/utils';
import { TrainFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LineBadge({
    line,
    hero = false,
    className,
}: {
    line?: string;
    hero?: boolean;
    className?: string;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'flex size-4.5 items-center justify-center rounded-full border-0 bg-muted p-0 text-[11px] leading-none font-bold text-foreground data-hero:size-5.5 data-hero:text-[13px] data-[line=capital]:bg-line-capital data-[line=capital]:text-line-on-colour data-[line=metro]:bg-line-metro data-[line=metro]:text-line-on-amber data-[line=valley]:bg-line-valley data-[line=valley]:text-line-on-colour [&_svg]:size-3.5',
                className
            )}
            data-line={line?.toLowerCase()}
            data-hero={hero || undefined}
            aria-label={line ? `${line} Line` : 'LRT'}
        >
            {line ? line.charAt(0) : <TrainFront aria-hidden="true" />}
        </Badge>
    );
}
