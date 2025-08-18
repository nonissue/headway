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
            {withBackdrop && (
                <button
                    aria-hidden={!open}
                    onClick={() => setOpen(false)}
                    className={cn(
                        'fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity duration-200',
                        open
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <button
                    aria-hidden={!open}
                    aria-label="Close info"
                    onClick={() => setOpen(false)}
                    className={cn(
                        'fixed inset-0 z-10', // below the badge (z-50 on container), above app
                        'bg-zinc-950/70 backdrop-blur-[4px]',
                        'transition-opacity duration-[400ms]',
                        open
                            ? 'pointer-events-auto opacity-100'
                            : 'pointer-events-none opacity-0'
                    )}
                />
                <DialogTrigger asChild>
                    {/* Match your Refresh button vibe */}
                    <button
                        type="button"
                        className={cn(
                            'flex items-center gap-x-3 border-r border-zinc-700 bg-zinc-800 px-4',
                            'tracking-wide text-orange-300 uppercase transition hover:bg-orange-500 hover:text-black',
                            className
                        )}
                        aria-label="Show creator info"
                    >
                        <Info className="h-3.5 w-3.5 text-sky-300" />
                        <span className="hidden font-mono text-sky-100 sm:inline">
                            {triggerLabel}
                        </span>
                        {/* <span className="text-amber-200">{triggerLabel}</span> */}
                    </button>
                </DialogTrigger>

                {/* Appears ABOVE the trigger, right-aligned */}
                <DialogContent
                    className={cn(
                        'rounded-sm border-zinc-800 bg-zinc-900 text-zinc-300 sm:max-w-[28rem]',
                        'shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_16px_40px_rgba(0,0,0,0.6)]'
                    )}
                >
                    <div className="mb-1 items-center justify-between">
                        <div className="flex flex-row items-center gap-x-2">
                            <div className="font-semibold text-orange-200">
                                {name}
                            </div>
                            <div className="text-zinc-400">© {years}</div>
                        </div>
                        {note && (
                            <div className="mt-1.5 text-zinc-400">{note}</div>
                        )}
                    </div>

                    <div className="mt-0 flex flex-wrap items-center gap-1.5">
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center gap-1 rounded-xs border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                            </a>
                        )}
                        {website && (
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-xs border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                <Globe className="h-3.5 w-3.5" />
                                Website
                            </a>
                        )}
                        {github && (
                            <a
                                href={github}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-xs border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                <Github className="h-3.5 w-3.5" />
                                GitHub
                            </a>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
