import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function AdminReports() {
    return (
        <div className="space-y-6">
            <PageHeader title="Reports" description="Attendance reports and analytics" />
            <EmptyState icon="folder" title="No reports" description="Attendance analytics and reports will appear here." />
        </div>
    );
}
