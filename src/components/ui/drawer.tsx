'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';

import { cn } from '@/components/lib/utils';

function Drawer({
    shouldScaleBackground = false,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
    return (
        <DrawerPrimitive.Root
            data-slot="drawer"
            shouldScaleBackground={shouldScaleBackground}
            {...props}
        />
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
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-black/5 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
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
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
    return (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                className={cn(
                    'fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[92dvh] flex-col rounded-t-[1.5rem] border bg-background data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=open]:slide-in-from-bottom',
                    className
                )}
                {...props}
            >
                <div className="mx-auto mt-3 h-1.5 w-14 shrink-0 rounded-full bg-muted" />
                {children}
            </DrawerPrimitive.Content>
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
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
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
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
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
