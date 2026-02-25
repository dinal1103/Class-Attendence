import * as React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Card Container                                                      */
/* ------------------------------------------------------------------ */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'interactive';
    padding?: 'sm' | 'md' | 'lg' | 'none';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'none', ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'rounded-xl bg-white border border-surface-100 shadow-soft',
                variant === 'interactive' && 'hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
                padding === 'sm' && 'p-4',
                padding === 'md' && 'p-5',
                padding === 'lg' && 'p-6',
                className
            )}
            {...props}
        />
    )
);
Card.displayName = 'Card';

/* ------------------------------------------------------------------ */
/* Card Sub-components                                                 */
/* ------------------------------------------------------------------ */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('px-6 py-4 border-b border-surface-100', className)} {...props} />
    )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('text-base font-semibold text-surface-900', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-surface-500 mt-1', className)} {...props} />
    )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
    )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
