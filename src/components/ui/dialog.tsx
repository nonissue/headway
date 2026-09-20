'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

type StyledProps<T extends React.ElementType> = Omit<
    React.ComponentProps<T>,
    'className'
> & { className?: string };
import { XIcon } from 'lucide-react';

import { cn } from '@/components/lib/utils';

function Dialog({
    ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Root>, 'children'> & {
    children?: React.ReactNode;
}) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
    className,
    ...props
}: StyledProps<typeof DialogPrimitive.Backdrop>) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="dialog-overlay"
            className={cn(
                'fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0',
                className
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: StyledProps<typeof DialogPrimitive.Popup> & {
    showCloseButton?: boolean;
}) {
    return (
        <DialogPortal data-slot="dialog-portal">
            <DialogOverlay />
            <DialogPrimitive.Popup
                data-slot="dialog-content"
                className={cn(
                    'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg transition-[opacity,scale] duration-200 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:max-w-lg',
                    className
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <DialogPrimitive.Close
                        data-slot="dialog-close"
                        className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-open:bg-accent data-open:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                    >
                        <XIcon />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn(
                'flex flex-col gap-2 text-center sm:text-left',
                className
            )}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
                className
            )}
            {...props}
        />
    );
}

function DialogTitle({
    className,
    ...props
}: StyledProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn('text-lg leading-none font-semibold', className)}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: StyledProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
