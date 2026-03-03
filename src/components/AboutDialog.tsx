import { Github, Globe, Info, Mail, TramFront } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface AboutDialogProps {
    name: string;
    email?: string;
    website?: string;
    github?: string;
    note?: string;
    startYear?: number;
    triggerLabel?: string;
    className?: string;
}

export function AboutDialog({
    name,
    email,
    website,
    github,
    note,
    startYear,
    triggerLabel = 'About',
    className,
}: AboutDialogProps) {
    const year = new Date().getFullYear();
    const years =
        startYear && startYear < year ? `${startYear}-${year}` : `${year}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'relative flex items-center gap-x-3 border-r border-border/30 px-6 py-4',
                        'tracking-wide text-foreground uppercase transition-all duration-300',
                        className
                    )}
                    aria-label="Show app information"
                >
                    <Info className="h-4 w-4 text-primary transition-colors duration-300" />
                    <span className="hidden font-mono text-xs font-medium text-foreground">
                        {triggerLabel}
                    </span>
                </button>
            </DialogTrigger>

            <DialogContent
                className={cn(
                    'overflow-hidden rounded-2xl border border-border/50 bg-card/90 text-card-foreground backdrop-blur-xl backdrop-saturate-150 sm:max-w-[28rem]',
                    'shadow-xl shadow-background/20'
                )}
            >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-transparent"></div>

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-row items-center gap-x-2 font-sans text-lg font-bold text-foreground">
                        <TramFront className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <DialogTitle>Headway</DialogTitle>
                        <span className="rounded bg-foreground/10 px-1 py-0.5 text-xs font-medium text-muted-foreground">
                            By {name}
                        </span>
                        <span className="rounded bg-foreground/10 px-1 py-0.5 text-xs font-medium text-muted-foreground">
                            {years}
                        </span>
                    </div>

                    {note ? (
                        <DialogDescription className="leading-relaxed text-foreground/90">
                            {note}
                        </DialogDescription>
                    ) : null}

                    <p className="text-xs leading-relaxed text-blue-600 saturate-50 dark:text-blue-300">
                        On iOS, this site can be added to your homescreen as a
                        progressive web app.
                    </p>

                    <div className="flex flex-wrap items-center justify-around gap-2 font-display font-semibold">
                        {email ? (
                            <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
                            >
                                <Mail className="h-4 w-4" />
                                Email
                            </a>
                        ) : null}
                        {website ? (
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
                            >
                                <Globe className="h-4 w-4" />
                                Website
                            </a>
                        ) : null}
                        {github ? (
                            <a
                                href={github}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
