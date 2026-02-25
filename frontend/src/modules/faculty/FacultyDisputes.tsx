import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function FacultyDisputes() {
    return (
        <div className="space-y-6">
            <PageHeader title="Student Disputes" description="Review and resolve attendance disputes" />
            <EmptyState icon="clipboard" title="No disputes" description="Student disputes requiring review will appear here." />
        </div>
    );
}
