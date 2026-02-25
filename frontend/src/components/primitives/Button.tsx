import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
    {
        variants: {
            variant: {
                primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
                secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200',
                ghost: 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
                danger: 'bg-error-600 text-white hover:bg-error-700 shadow-sm',
                success: 'bg-success-600 text-white hover:bg-success-700 shadow-sm',
            },
            size: {
                sm: 'h-8 px-3 text-xs',
                md: 'h-10 px-4 text-sm',
                lg: 'h-12 px-6 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, leftIcon, rightIcon, children, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
                {leftIcon}
                {children}
                {rightIcon}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
