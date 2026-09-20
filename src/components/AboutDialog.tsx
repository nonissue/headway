import {
    type ComponentPropsWithRef,
    useState,
    useSyncExternalStore,
} from 'react';
import { ArrowUpRight } from 'lucide-react';
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
            variant="plain"
            className={cn('about-trigger', className)}
            aria-label={ariaLabel ?? triggerLabel}
        >
            <span>Headway</span>
            <span className="about-trigger-label">{triggerLabel}</span>
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
        <div className="about-body">
            <header className="about-heading">
                <div>
                    <p className="about-eyebrow">About</p>
                    <Title className="about-title">Headway</Title>
                    <p className="about-subtitle">Edmonton LRT</p>
                </div>
                <Button
                    variant="plain"
                    className="about-close"
                    onClick={onClose}
                >
                    Close
                </Button>
            </header>
            <dl className="about-facts">
                <div>
                    <dt>Service</dt>
                    <dd>
                        <Description className="about-description">
                            {note}
                        </Description>
                    </dd>
                </div>
                <div>
                    <dt>Made by</dt>
                    <dd>{name}</dd>
                </div>
            </dl>
            {links.length > 0 && (
                <nav className="about-links" aria-label="About Headway links">
                    {links.map((link) => (
                        <a
                            key={link.label}
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
            <div className="about-install">
                <h3>Install</h3>
                <p>
                    On iPhone, open Safari&apos;s Share menu and choose{' '}
                    <strong>Add to Home Screen.</strong>
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
    triggerLabel = 'About',
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
                    className="about-panel about-dialog"
                    showCloseButton={false}
                >
                    {body}
                </DialogContent>
            </Dialog>
        );
    }
    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{trigger}</DrawerTrigger>
            <DrawerContent className="about-panel about-drawer">
                {body}
            </DrawerContent>
        </Drawer>
    );
}
