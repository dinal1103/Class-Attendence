import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-surface-100/80 text-surface-800 border border-surface-200',
                primary: 'bg-primary-100/80 text-primary-800 border border-primary-200',
                success: 'bg-success-100/80 text-success-800 border border-success-200',
                warning: 'bg-warning-100/80 text-warning-800 border border-warning-200',
                error: 'bg-error-100/80 text-error-800 border border-error-200',
            },
            size: {
                sm: 'px-2 py-0.5 text-xs',
                md: 'px-2.5 py-1 text-xs',
                lg: 'px-3 py-1 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

export function Badge({ className, variant, size, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}
