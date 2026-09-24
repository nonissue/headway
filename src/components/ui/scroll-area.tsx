import * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import { cn } from '@/components/lib/utils';

const ScrollArea = ({
    className,
    viewportClassName,
    children,
    ...props
}: Omit<ScrollAreaPrimitive.Root.Props, 'className'> & {
    className?: string;
    viewportClassName?: string;
}) => (
    <ScrollAreaPrimitive.Root
        className={cn('relative overflow-hidden', className)}
        {...props}
    >
        <ScrollAreaPrimitive.Viewport
            data-slot="scroll-area-viewport"
            className={cn('h-full w-full rounded-[inherit]', viewportClassName)}
        >
            <ScrollAreaPrimitive.Content>
                {children}
            </ScrollAreaPrimitive.Content>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = ({
    className,
    orientation = 'vertical',
    ...props
}: Omit<ScrollAreaPrimitive.Scrollbar.Props, 'className'> & {
    className?: string;
}) => (
    <ScrollAreaPrimitive.Scrollbar
        orientation={orientation}
        className={cn(
            'flex touch-none opacity-0 transition-opacity select-none data-hovering:opacity-100 data-scrolling:opacity-100',
            orientation === 'vertical' &&
                'h-full w-2.5 border-l border-l-transparent p-[1px]',
            orientation === 'horizontal' &&
                'h-2.5 flex-col border-t border-t-transparent p-[1px]',
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.Thumb className="relative rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
);
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName;

export { ScrollArea, ScrollBar };
