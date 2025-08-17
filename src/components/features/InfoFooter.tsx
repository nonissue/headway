import React from 'react';

type CreatorInfoProps = {
    name: string;
    email?: string; // "me@example.com"
    website?: string; // "https://example.com"
    github?: string; // "https://github.com/you"
    note?: string; // short tagline or project note
    startYear?: number; // if omitted, uses current year only
    className?: string; // allow overrides
};

export default function CreatorInfo({
    name,
    email,
    website,
    github,
    note,
    startYear,
    className,
}: CreatorInfoProps) {
    const year = new Date().getFullYear();
    const years =
        startYear && startYear < year ? `${startYear}–${year}` : `${year}`;

    return (
        <footer
            className={[
                'mt-6 rounded-sm border border-zinc-800 bg-zinc-900/70 p-4 text-xs text-zinc-300',
                'backdrop-blur supports-[backdrop-filter]:bg-zinc-900/50',
                'shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_8px_30px_rgba(0,0,0,0.4)]',
                className ?? '',
            ].join(' ')}
            role="contentinfo"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                    <div className="font-semibold text-orange-200">
                        © {years} <a href="">{name}</a>
                    </div>
                    <br />
                    {note && <div className="text-zinc-400">{note}</div>}
                </div>

                <ul className="mt-2 flex flex-wrap items-center gap-3 sm:mt-0">
                    {email && (
                        <li className="">
                            <a
                                href={`mailto:${email}`}
                                className="rounded px-0 py-0 underline decoration-dotted underline-offset-4 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                Email
                            </a>
                        </li>
                    )}
                    {website && (
                        <li>
                            <a
                                href={website}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded px-0 py-0 underline decoration-dotted underline-offset-4 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                Website
                            </a>
                        </li>
                    )}
                    {github && (
                        <li>
                            <a
                                href={github}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded px-0 py-0 underline decoration-dotted underline-offset-4 hover:bg-zinc-800 hover:text-amber-200"
                            >
                                GitHub
                            </a>
                        </li>
                    )}
                </ul>
            </div>
        </footer>
    );
}
