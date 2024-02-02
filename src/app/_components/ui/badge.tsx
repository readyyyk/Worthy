import * as React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-fit',
    {
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {
    removable?: boolean;
}

function Badge({
                   className,
                   variant,
                   children,
                   removable = false,
                   ...props
               }: BadgeProps) {
    return (
        <div
            className={cn(
                badgeVariants({ variant }),
                removable && 'ps-1 text-sm',
                className,
            )}
            {...props}
        >
            {removable && (
                <XIcon className={'mr-1 h-4 w-fit rounded-full bg-slate-500'} />
            )}
            {children}
        </div>
    );
}

export { Badge, badgeVariants };
