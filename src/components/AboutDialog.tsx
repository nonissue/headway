import {
    type ComponentPropsWithRef,
    useState,
    useSyncExternalStore,
} from 'react';
import {
    ExternalLink,
    Github,
    Globe,
    Info,
    Mail,
    Smartphone,
    TramFront,
} from 'lucide-react';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';

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

const DESKTOP_BREAKPOINT = '(min-width: 640px)';
const DEFAULT_NOTE =
    'Built from ETS GTFS schedule data and trimmed down to the rail service the app actually needs.';

interface AboutLink {
    label: string;
    href: string;
    icon: typeof Mail;
    external?: boolean;
}

function getDesktopMatch() {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia(DESKTOP_BREAKPOINT).matches;
}

function subscribeToDesktopMatch(callback: () => void) {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
    }

    const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT);
    const listener = () => callback();

    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);

        return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);

    return () => mediaQuery.removeListener(listener);
}

function useIsDesktop() {
    return useSyncExternalStore(
        subscribeToDesktopMatch,
        getDesktopMatch,
        () => false
    );
}

function AboutFacts({ name, years }: { name: string; years: string }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    Built By
                </p>
                <p className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
                    {name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Running since {years}.
                </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                    Coverage
                </p>
                <p className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground">
                    Edmonton LRT
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Rail-only GTFS data, intentionally slimmed down.
                </p>
            </div>
        </div>
    );
}

function AboutLinks({ links }: { links: AboutLink[] }) {
    if (links.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3">
            {links.map((link) => {
                const Icon = link.icon;

                return (
                    <a
                        key={link.label}
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noreferrer' : undefined}
                        className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 hover:text-accent-foreground"
                    >
                        <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-primary" />
                            <span>{link.label}</span>
                        </span>
                        {link.external ? (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        ) : null}
                    </a>
                );
            })}
        </div>
    );
}

function AboutSideNote() {
    return (
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-center gap-2 text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Install Tip</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                On iPhone, use Safari&apos;s Share menu and choose Add to Home
                Screen for a cleaner app-like launch.
            </p>
        </div>
    );
}

function AboutTrigger({
    triggerLabel,
    className,
    type = 'button',
    'aria-label': ariaLabel,
    ref,
    ...props
}: ComponentPropsWithRef<'button'> & {
    triggerLabel: string;
}) {
    return (
        <button
            ref={ref}
            type={type}
            {...props}
            className={cn(
                'relative flex items-center gap-x-2 px-3 py-2 tracking-wide text-foreground uppercase transition-all duration-300',
                className
            )}
            aria-label={ariaLabel ?? 'Show app information'}
        >
            <Info className="h-4 w-4 text-primary transition-colors duration-300" />
            <span className="hidden font-mono text-xs font-medium text-foreground sm:block">
                {triggerLabel}
            </span>
        </button>
    );
}

function AboutDialogBody({
    name,
    years,
    note,
    links,
}: {
    name: string;
    years: string;
    note: string;
    links: AboutLink[];
}) {
    return (
        <div className="grid gap-0 md:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)]">
            <div className="space-y-6 p-6 sm:p-8">
                <DialogHeader className="gap-4 text-left">
                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl border border-border/60 bg-primary p-3">
                            <TramFront className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-[0.65rem] font-medium tracking-[0.35em] text-muted-foreground uppercase">
                            Headway
                        </p>
                    </div>
                    <div className="space-y-3">
                        <DialogTitle className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                            Fast LRT departures without the bus-feed noise.
                        </DialogTitle>
                        <DialogDescription className="max-w-xl text-base leading-relaxed text-muted-foreground">
                            {note}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <AboutFacts name={name} years={years} />
            </div>

            <div className="space-y-6 border-t border-border/60 bg-muted/20 p-6 sm:p-8 md:border-t-0 md:border-l">
                <div className="space-y-3">
                    <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                        Links
                    </p>
                    <AboutLinks links={links} />
                </div>
                <AboutSideNote />
            </div>
        </div>
    );
}

function AboutDrawerBody({
    name,
    years,
    note,
    links,
}: {
    name: string;
    years: string;
    note: string;
    links: AboutLink[];
}) {
    return (
        <div className="mx-auto w-full max-w-xl overflow-y-auto">
            <DrawerHeader className="gap-4 px-5 pb-0 text-left">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border/60 bg-primary/10 p-3">
                        <TramFront className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-[0.65rem] font-medium tracking-[0.35em] text-muted-foreground uppercase">
                        Headway
                    </p>
                </div>
                <div className="space-y-3">
                    <DrawerTitle className="font-display text-2xl font-semibold tracking-tight">
                        Fast LRT departures without the bus-feed noise.
                    </DrawerTitle>
                    <DrawerDescription className="text-sm leading-relaxed text-muted-foreground">
                        {note}
                    </DrawerDescription>
                </div>
            </DrawerHeader>

            <div className="space-y-6 px-5 py-5">
                <AboutFacts name={name} years={years} />
                <div className="space-y-3">
                    <p className="text-[0.65rem] font-medium tracking-[0.25em] text-muted-foreground uppercase">
                        Links
                    </p>
                    <AboutLinks links={links} />
                </div>
                <AboutSideNote />
            </div>

            <DrawerFooter className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <DrawerClose asChild>
                    <Button variant="outline">Close</Button>
                </DrawerClose>
            </DrawerFooter>
        </div>
    );
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
    const [open, setOpen] = useState(false);
    const isDesktop = useIsDesktop();
    const year = new Date().getFullYear();
    const years =
        startYear && startYear < year ? `${startYear}-${year}` : `${year}`;
    const description = note?.trim() || DEFAULT_NOTE;
    const links: AboutLink[] = [
        ...(email
            ? [{ label: 'Email', href: `mailto:${email}`, icon: Mail }]
            : []),
        ...(website
            ? [
                  {
                      label: 'Website',
                      href: website,
                      icon: Globe,
                      external: true,
                  },
              ]
            : []),
        ...(github
            ? [
                  {
                      label: 'GitHub',
                      href: github,
                      icon: Github,
                      external: true,
                  },
              ]
            : []),
    ];

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <AboutTrigger
                        triggerLabel={triggerLabel}
                        className={className}
                    />
                </DialogTrigger>

                <DialogContent className="overflow-hidden border-border/60 bg-card/95 p-0 text-card-foreground backdrop-blur-xl sm:max-w-2xl">
                    <AboutDialogBody
                        name={name}
                        years={years}
                        note={description}
                        links={links}
                    />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <AboutTrigger
                    triggerLabel={triggerLabel}
                    className={className}
                />
            </DrawerTrigger>

            <DrawerContent className="border-border/60 bg-card/98 text-card-foreground">
                <AboutDrawerBody
                    name={name}
                    years={years}
                    note={description}
                    links={links}
                />
            </DrawerContent>
        </Drawer>
    );
}
