import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function AdminEnrollments() {
    return (
        <div className="space-y-6">
            <PageHeader title="Enrollment Management" description="Review and manage student enrollments" />
            <EmptyState icon="clipboard" title="No enrollments" description="Student enrollment requests will appear here." />
        </div>
    );
}
