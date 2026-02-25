import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function AdminOverrides() {
    return (
        <div className="space-y-6">
            <PageHeader title="Attendance Overrides" description="Manual attendance override records" />
            <EmptyState icon="clipboard" title="No overrides" description="Manual attendance overrides will show here." />
        </div>
    );
}
