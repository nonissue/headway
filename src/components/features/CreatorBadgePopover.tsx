// src/components/features/CreatorBadgeInline.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'; // npx shadcn@latest add popover
import { Info, Mail, Github, Globe } from 'lucide-react';
import { cn } from '@/components/lib/utils';

type Props = {
    name: string;
    email?: string;
    website?: string;
    github?: string;
    note?: string;
    startYear?: number;
    triggerLabel?: string; // defaults to "About"
    withBackdrop?: boolean; // optional dimmer
    className?: string;
};

export default function CreatorBadgeInline({
    name,
    email,
    website,
    github,
    note,
    startYear,
    triggerLabel = 'About',
    withBackdrop = false,
    className,
}: Props) {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const year = new Date().getFullYear();
    const years =
        startYear && startYear < year ? `${startYear}–${year}` : `${year}`;

    return (
        <>
            {/* OVERLAY IS SET IN DIALOG OVERLAY! */}
            {/* no idea what this does */}
            {withBackdrop && (
                <button
                    aria-hidden={!open}
                    onClick={() => setOpen(false)}
                    className={cn(
                        'bg-foreground fixed inset-0 z-40 backdrop-blur-[0px] transition-opacity duration-200',
                        open
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                {/* this seems to cover just the departures section? */}
                <button
                    aria-hidden={!open}
                    aria-label="Close info"
                    onClick={() => setOpen(false)}
                    className={cn(
                        'fixed inset-0 z-100', // below the badge (z-50 on container), above app
                        'bg-background/50 backdrop-blur-xl',
                        'transition-opacity duration-500',
                        open
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'border-border/30 from-muted/50 to-primary/10 relative flex items-center gap-x-3 border-r bg-gradient-to-r px-6 py-4',
                            'text-foreground hover:from-accent/30 hover:to-accent/20 hover:text-accent-foreground hover:bg-muted-foreground/20 tracking-wide uppercase backdrop-blur-sm transition-all duration-300',
                            className
                        )}
                        aria-label="Show creator info"
                    >
                        <Info className="text-primary h-4 w-4 transition-colors duration-300" />
                        <span className="text-foreground hidden font-mono text-xs font-medium sm:inline">
                            {triggerLabel}
                        </span>
                    </button>
                </DialogTrigger>

                {/* Appears ABOVE the trigger, right-aligned */}
                <DialogContent
                    className={cn(
                        'border-border/50 bg-card/90 text-card-foreground fixed overflow-hidden rounded-2xl border backdrop-blur-xl backdrop-saturate-150 sm:max-w-[28rem]',
                        'shadow-background/20 shadow-xl'
                    )}
                >
                    {/* Glass effect overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-transparent"></div>

                    <div className="relative z-10 mb-4 items-center justify-between">
                        <div className="flex flex-row items-center gap-x-3">
                            <div className="text-foreground text-lg font-semibold">
                                {name}
                            </div>
                            <div className="text-muted-foreground font-mono text-sm">
                                © {years}
                            </div>
                        </div>
                        {note && (
                            <div className="text-muted-foreground mt-2 leading-relaxed">
                                {note}
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 mt-0 flex flex-wrap items-center gap-2">
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="border-border/50 bg-muted/50 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-300"
                            >
                                <Mail className="h-4 w-4" />
                                Email
                            </a>
                        )}
                        {website && (
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="border-border/50 bg-muted/50 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-300"
                            >
                                <Globe className="h-4 w-4" />
                                Website
                            </a>
                        )}
                        {github && (
                            <a
                                href={github}
                                target="_blank"
                                rel="noreferrer"
                                className="border-border/50 bg-muted/50 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-300"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
