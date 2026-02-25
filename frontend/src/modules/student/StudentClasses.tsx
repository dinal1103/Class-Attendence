import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function StudentClasses() {
    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" description="Classes you are enrolled in" />
            <EmptyState icon="clipboard" title="No classes yet" description="You'll see your enrolled classes here once assigned." />
        </div>
    );
}
