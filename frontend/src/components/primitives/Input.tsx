import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-surface-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            'flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm',
                            'placeholder:text-surface-400',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            'transition-colors duration-200',
                            leftIcon && 'pl-10',
                            error && 'border-error-500 focus:ring-error-500',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-error-600">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
