import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn('animate-pulse-glow rounded-md bg-surface-200/60', className)}
            {...props}
        />
    );
}
