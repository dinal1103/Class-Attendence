/**
 * PageHeader — Reusable page header with title, description, and optional action buttons.
 */

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">{title}</h1>
                {description && <p className="text-sm text-surface-500 mt-1">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
    );
}
