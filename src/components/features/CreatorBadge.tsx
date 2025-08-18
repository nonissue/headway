'use client';

import * as React from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
    Info,
    ChevronUp,
    Mail,
    Github,
    Globe,
    Link as LinkIcon,
    Copy,
} from 'lucide-react';
import { cn } from '@/components/lib/utils';

type CreatorBadgeProps = {
    name: string;
    email?: string; // "you@example.com"
    website?: string; // "https://your-site.com"
    github?: string; // "https://github.com/your-handle"

    note?: string; // short tagline (1 line)
    startYear?: number; // shows 2023–2025 if provided
    defaultOpen?: boolean;
    className?: string; // override positioning if you don’t want fixed
};

export default function CreatorBadge({
    name,
    email,
    website,
    github,
    note,
    startYear,
    defaultOpen = false,
    className,
}: CreatorBadgeProps) {
    const [open, setOpen] = React.useState(defaultOpen);
    const [copied, setCopied] = React.useState(false);

    const year = new Date().getFullYear();
    const years =
        startYear && startYear < year ? `${startYear}–${year}` : `${year}`;

    const copyEmail = async () => {
        if (!email) return;
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // noop
        }
    };

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className={cn('fixed right-3 bottom-3 z-50', className)}
        >
            {/* Tiny pill trigger */}
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'group flex items-center gap-1 rounded-full border border-zinc-700/80',
                        'bg-zinc-900/70 px-3 py-1 text-[11px] text-zinc-300 shadow-sm backdrop-blur',
                        'hover:bg-zinc-800/80 hover:text-amber-200 focus-visible:outline-none',
                        'transition-colors focus-visible:ring-2 focus-visible:ring-amber-400/60'
                    )}
                    aria-label={
                        open ? 'Hide creator info' : 'Show creator info'
                    }
                >
                    <Info className="h-3.5 w-3.5 text-amber-300" />
                    <span className="hidden sm:inline">About</span>
                    <ChevronUp
                        className={cn(
                            'ml-0.5 h-3.5 w-3.5 transition-transform duration-200',
                            open ? 'rotate-0' : 'rotate-180'
                        )}
                    />
                </button>
            </CollapsibleTrigger>

            {/* Card */}
            <CollapsibleContent
                className={cn(
                    'mt-2 w-[min(92vw,28rem)] overflow-hidden',
                    'data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down'
                )}
            >
                <div
                    role="contentinfo"
                    className={cn(
                        'rounded-xs border border-zinc-800/90 bg-zinc-900/80 p-3 text-[12px] text-zinc-300',
                        'shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur'
                    )}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="truncate">
                            <div className="font-semibold text-orange-200">
                                {name}
                            </div>
                            {note && (
                                <div className="mt-0.5 line-clamp-1 text-zinc-400">
                                    {note}
                                </div>
                            )}
                        </div>
                        <div className="shrink-0 text-[11px] text-zinc-500">
                            © {years}
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {email && (
                            <a
                                href={`mailto:${email}`}
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
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
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
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
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 hover:border-zinc-700 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                <Github className="h-3.5 w-3.5" />
                                GitHub
                            </a>
                        )}
                        {email && (
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={copyEmail}
                                className={cn(
                                    'h-7 px-2 text-zinc-300 hover:text-amber-200',
                                    'hover:bg-zinc-800/60'
                                )}
                                aria-live="polite"
                            >
                                <Copy className="mr-1 h-3.5 w-3.5" />
                                {copied ? 'Copied' : 'Copy email'}
                            </Button>
                        )}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
