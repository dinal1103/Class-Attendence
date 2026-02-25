import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { listItemVariants } from '@/lib/animations';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBgColor: string;
    iconColor: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    trendLabel?: string;
}

export function StatCard({
    title,
    value,
    icon,
    iconBgColor,
    iconColor,
    trend = 'neutral',
    trendValue,
    trendLabel,
}: StatCardProps) {
    return (
        <motion.div
            variants={listItemVariants}
            className="bg-white rounded-xl border border-surface-100 shadow-soft p-5 hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-surface-500">{title}</p>
                    <p className="text-2xl font-bold text-surface-900">{value}</p>
                    {(trendValue || trendLabel) && (
                        <div className="flex items-center gap-1.5">
                            {trendValue && (
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        trend === 'up' && 'text-success-600',
                                        trend === 'down' && 'text-error-600',
                                        trend === 'neutral' && 'text-surface-500'
                                    )}
                                >
                                    {trendValue}
                                </span>
                            )}
                            {trendLabel && <span className="text-xs text-surface-400">{trendLabel}</span>}
                        </div>
                    )}
                </div>
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBgColor, color: iconColor }}
                >
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
