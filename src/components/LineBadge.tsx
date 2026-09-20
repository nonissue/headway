import { TrainFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LineBadge({
    line,
    hero = false,
}: {
    line?: string;
    hero?: boolean;
}) {
    return (
        <Badge
            variant="outline"
            className="line-badge"
            data-line={line?.toLowerCase()}
            data-hero={hero || undefined}
            aria-label={line ? `${line} Line` : 'LRT'}
        >
            {line ? line.charAt(0) : <TrainFront aria-hidden="true" />}
        </Badge>
    );
}
