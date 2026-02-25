import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function FacultyClasses() {
    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" description="Classes assigned to you" />
            <EmptyState icon="clipboard" title="No classes" description="Your assigned classes will appear here." />
        </div>
    );
}
