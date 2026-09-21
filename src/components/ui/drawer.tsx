'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';

import { cn } from '@/components/lib/utils';

type StyledProps<T extends React.ElementType> = Omit<
    React.ComponentProps<T>,
    'className'
> & { className?: string };

// Headway uses bottom sheets only. Keep the existing wrapper's visual contract.
function Drawer({
    children,
    ...props
}: Omit<DrawerPrimitive.Root.Props, 'children' | 'swipeDirection'> & {
    children?: React.ReactNode;
}) {
    return (
        <DrawerPrimitive.Root swipeDirection="down" {...props}>
            <DrawerPrimitive.VirtualKeyboardProvider>
                {children}
            </DrawerPrimitive.VirtualKeyboardProvider>
        </DrawerPrimitive.Root>
    );
}

function DrawerTrigger({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
    className,
    ...props
}: StyledProps<typeof DrawerPrimitive.Backdrop>) {
    return (
        <DrawerPrimitive.Backdrop
            data-slot="drawer-overlay"
            className={cn(
                'fixed inset-0 z-50 min-h-dvh bg-background/25 backdrop-blur-md transition-opacity duration-300 data-ending-style:opacity-0 data-ending-style:duration-200 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute dark:bg-background/75',
                className
            )}
            {...props}
        />
    );
}

function DrawerContent({
    className,
    children,
    ...props
}: StyledProps<typeof DrawerPrimitive.Popup>) {
    return (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Viewport
                data-slot="drawer-viewport"
                className="fixed inset-0 z-50 flex touch-none items-end justify-center"
            >
                <DrawerPrimitive.Popup
                    data-slot="drawer-content"
                    className={cn(
                        'relative flex max-h-[92dvh] min-h-0 w-full [transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))] flex-col rounded-t-[1.5rem] border bg-background transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none data-ending-style:[transform:translateY(calc(100%+2px))] data-ending-style:duration-200 data-starting-style:[transform:translateY(calc(100%+2px))] data-swiping:duration-0',
                        className
                    )}
                    {...props}
                >
                    <div
                        aria-hidden="true"
                        data-slot="drawer-handle"
                        className="mx-auto mt-3 h-1.5 w-14 shrink-0 rounded-full bg-muted"
                    />
                    <DrawerPrimitive.Content className="contents">
                        {children}
                    </DrawerPrimitive.Content>
                </DrawerPrimitive.Popup>
            </DrawerPrimitive.Viewport>
        </DrawerPortal>
    );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="drawer-header"
            className={cn('flex flex-col gap-2 text-center', className)}
            {...props}
        />
    );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="drawer-footer"
            className={cn('mt-auto flex flex-col gap-2 p-4', className)}
            {...props}
        />
    );
}

function DrawerTitle({
    className,
    ...props
}: StyledProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn('text-lg font-semibold tracking-tight', className)}
            {...props}
        />
    );
}

function DrawerDescription({
    className,
    ...props
}: StyledProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger,
};
