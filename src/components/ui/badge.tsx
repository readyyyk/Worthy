import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

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
                removable && 'text-sm ps-1',
                className,
            )}
            {...props}
        >
            {removable && (
                <XIcon className={'bg-slate-500 rounded-full h-4 w-fit mr-1'} />
            )}
            {children}
        </div>
    );
}

export { Badge, badgeVariants };
