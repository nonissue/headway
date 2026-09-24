import {
    type ComponentPropsWithRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';

interface AboutDialogProps {
    name: string;
    email?: string;
    website?: string;
    github?: string;
    note?: string;
    triggerLabel?: string;
    className?: string;
}

const DESKTOP_BREAKPOINT = '(min-width: 640px)';
const DEFAULT_NOTE =
    'Scheduled departures from ETS GTFS data. Live delays are not included.';

interface AboutLink {
    label: string;
    href: string;
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

function AboutTrigger({
    triggerLabel,
    className,
    'aria-label': ariaLabel,
    ...props
}: ComponentPropsWithRef<typeof Button> & { triggerLabel: string }) {
    return (
        <Button
            {...props}
            variant="footer"
            size="footer-label"
            className={cn('border-r border-l-0', className)}
            aria-label={ariaLabel ?? triggerLabel}
            title={triggerLabel}
        >
            <span>Headway</span>
            <Info data-icon="inline-end" aria-hidden="true" />
        </Button>
    );
}

function AboutBody({
    name,
    note,
    links,
    isDesktop,
    onClose,
}: {
    name: string;
    note: string;
    links: AboutLink[];
    isDesktop: boolean;
    onClose: () => void;
}) {
    const Title = isDesktop ? DialogTitle : DrawerTitle;
    const Description = isDesktop ? DialogDescription : DrawerDescription;

    return (
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4.5 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
            <header className="flex items-start justify-between border-b-2 border-foreground pb-5">
                <div>
                    <p className="mb-2 text-[11px] font-bold tracking-[1px] uppercase">
                        About
                    </p>
                    <Title className="text-[34px] leading-none font-bold tracking-[-1.3px]">
                        Headway
                    </Title>
                    <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
                        Edmonton LRT
                    </p>
                </div>
                <Button
                    variant="plain"
                    className="min-h-11 rounded-none py-0 pr-0 pl-4 underline underline-offset-4"
                    onClick={onClose}
                >
                    Close
                </Button>
            </header>
            <dl>
                <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 py-4 [&+div]:border-t">
                    <dt className="text-xs leading-[21px] font-bold">
                        Service
                    </dt>
                    <dd className="text-sm leading-normal text-foreground">
                        <Description className="text-sm leading-normal text-foreground">
                            {note}
                        </Description>
                    </dd>
                </div>
                <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 py-4 [&+div]:border-t">
                    <dt className="text-xs leading-[21px] font-bold">
                        Made by
                    </dt>
                    <dd className="text-sm leading-normal text-foreground">
                        {name}
                    </dd>
                </div>
            </dl>
            {links.length > 0 && (
                <nav
                    className="grid auto-cols-fr grid-flow-col border-y"
                    aria-label="About Headway links"
                >
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className="flex min-h-12 items-center justify-between gap-1.5 px-3 text-[13px] font-bold first:pl-0 last:pr-0 hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid [&_svg]:size-4 [&+a]:border-l"
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noreferrer' : undefined}
                        >
                            {link.label}
                            {link.external && (
                                <ArrowUpRight aria-hidden="true" />
                            )}
                        </a>
                    ))}
                </nav>
            )}
            <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 pt-4">
                <h3 className="text-xs leading-[21px] font-bold">Install</h3>
                <p className="text-xs leading-normal text-muted-foreground">
                    On iPhone, open Safari&apos;s Share menu and choose{' '}
                    <strong className="font-medium text-foreground">
                        Add to Home Screen.
                    </strong>
                </p>
            </div>
        </div>
    );
}

export function AboutDialog({
    name,
    email,
    website,
    github,
    note,
    triggerLabel = 'About Headway',
    className,
}: AboutDialogProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useIsDesktop();
    const links: AboutLink[] = [
        ...(email ? [{ label: 'Email', href: `mailto:${email}` }] : []),
        ...(website
            ? [{ label: 'Website', href: website, external: true }]
            : []),
        ...(github ? [{ label: 'GitHub', href: github, external: true }] : []),
    ];
    const trigger = (
        <AboutTrigger triggerLabel={triggerLabel} className={className} />
    );
    const body = (
        <AboutBody
            name={name}
            note={note?.trim() || DEFAULT_NOTE}
            links={links}
            isDesktop={isDesktop}
            onClose={() => setOpen(false)}
        />
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={trigger} />
                <DialogContent
                    className="max-h-[85dvh] w-[min(480px,calc(100vw-32px))] gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground"
                    showCloseButton={false}
                >
                    {body}
                </DialogContent>
            </Dialog>
        );
    }
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger render={trigger} />
            <DrawerContent className="mt-0 max-h-[92dvh] gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground [&>[data-slot=drawer-handle]]:h-[3px] [&>[data-slot=drawer-handle]]:w-9 [&>[data-slot=drawer-handle]]:rounded-none [&>[data-slot=drawer-handle]]:bg-muted-foreground [&>[data-slot=drawer-handle]]:opacity-60">
                {body}
            </DrawerContent>
        </Drawer>
    );
}
