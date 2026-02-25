import { ClipboardList, Calendar, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { cn } from '@/lib/utils';

const icons = {
    clipboard: ClipboardList,
    calendar: Calendar,
    folder: FolderOpen,
    search: Search,
};

interface EmptyStateProps {
    icon?: keyof typeof icons;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    compact?: boolean;
}

export function EmptyState({ icon = 'folder', title, description, actionLabel, onAction, compact }: EmptyStateProps) {
    const Icon = icons[icon];

    return (
        <div className={cn(
            'flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 transition-all duration-300 hover:border-surface-300',
            compact ? 'py-8 px-4' : 'py-16 px-6'
        )}>
            <div className={cn(
                'rounded-2xl bg-white shadow-soft flex items-center justify-center mb-5',
                compact ? 'w-12 h-12 rounded-xl' : 'w-16 h-16'
            )}>
                <Icon className={cn('text-primary-500', compact ? 'w-6 h-6' : 'w-8 h-8')} />
            </div>
            <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
            <p className="text-sm text-surface-500 max-w-sm">{description}</p>
            {actionLabel && onAction && (
                <Button variant="secondary" size="sm" className="mt-5" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
