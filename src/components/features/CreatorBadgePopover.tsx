// src/components/features/CreatorBadgeInline.tsx
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'; // npx shadcn@latest add popover
import { Info, Mail, Github, Globe, TramFront } from 'lucide-react';
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
                    type="button"
                    aria-hidden={!open}
                    onClick={() => setOpen(false)}
                    className={cn(
                        'fixed inset-0 z-40 bg-foreground transition-opacity duration-200',
                        open
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                {/* this seems to cover just the departures section? */}
                {open && (
                    <button
                        type="button"
                        aria-hidden={!open}
                        aria-label="Close info"
                        onClick={() => setOpen(false)}
                        className={cn(
                            'fixed inset-0 z-50', // below the badge (z-50 on container), above app
                            'bg-background/30 backdrop-blur-2xl',
                            'transition-opacity duration-500',
                            'pointer-events-auto opacity-100'
                        )}
                    />
                )}
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'relative flex items-center gap-x-3 border-r border-border/30 px-6 py-4',
                            'tracking-wide text-foreground uppercase transition-all duration-300',
                            className
                        )}
                        aria-label="Show creator info"
                    >
                        <Info className="h-4 w-4 text-primary transition-colors duration-300" />
                        <span className="hidden font-mono text-xs font-medium text-foreground">
                            {triggerLabel}
                        </span>
                    </button>
                </DialogTrigger>

                {/* Appears ABOVE the trigger, right-aligned */}
                <DialogContent
                    className={cn(
                        'fixed overflow-hidden rounded-2xl border border-border/50 bg-card/90 text-card-foreground backdrop-blur-xl backdrop-saturate-150 sm:max-w-[28rem]',
                        'shadow-xl shadow-background/20'
                    )}
                >
                    {/* Glass effect overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-transparent"></div>

                    <div className="relative z-10 mb-4 items-center justify-between">
                        <div className="flex flex-row items-center gap-x-1">
                            <div className="mr-2 flex flex-row items-center gap-x-2 font-sans text-lg font-bold text-foreground">
                                {/* {name} */}
                                <TramFront className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Headway
                            </div>
                            <div className="rounded bg-foreground/10 px-1 py-0.5 font-sans text-xs font-[500] text-muted-foreground">
                                By {name}
                            </div>
                            <div className="rounded bg-foreground/10 px-1 py-0.5 font-sans text-xs font-[500] text-muted-foreground">
                                © {years}
                            </div>
                        </div>
                        {note && (
                            <div className="my-4 leading-relaxed text-foreground/90">
                                {note}
                            </div>
                        )}
                        <div className="rounded text-xs leading-relaxed text-blue-600 saturate-50 dark:text-blue-300">
                            Note: On iOS, this website can be added to your
                            homescreen as a progressive web app (PWA).
                        </div>
                    </div>

                    <div className="relative z-10 mt-0 flex flex-wrap items-center justify-around gap-2 font-display font-[600]">
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
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
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
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
                                className="inline-flex items-center gap-2 rounded-lg border border-card-foreground/20 px-3 py-2 text-sm font-medium transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:text-accent-foreground"
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
