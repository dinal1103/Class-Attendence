import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/composite/EmptyState';
import { Plus } from 'lucide-react';

export default function StudentDisputes() {
    return (
        <div className="space-y-6">
            <PageHeader title="My Disputes" description="Raise or track attendance disputes"
                actions={<Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>Raise Dispute</Button>} />
            <EmptyState icon="clipboard" title="No disputes" description="You haven't raised any disputes yet." />
        </div>
    );
}
