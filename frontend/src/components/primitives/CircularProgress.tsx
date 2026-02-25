import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
    value: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function CircularProgress({
    value,
    size = 64,
    strokeWidth = 6,
    className,
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    // Determine color based on threshold
    const getColor = (v: number) => {
        if (v >= 85) return 'text-success-500';
        if (v >= 75) return 'text-warning-500';
        return 'text-error-500';
    };

    return (
        <div
            className={cn('relative flex items-center justify-center', className)}
            style={{ width: size, height: size }}
        >
            <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
                {/* Background circle */}
                <circle
                    className="text-surface-100"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <motion.circle
                    className={cn('transition-colors duration-500', getColor(value))}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            {/* Value text center */}
            <span className="absolute text-sm font-bold text-surface-900">
                {Math.round(value)}%
            </span>
        </div>
    );
}
