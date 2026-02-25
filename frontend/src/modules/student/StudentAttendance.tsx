import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';

export default function StudentAttendance() {
    return (
        <div className="space-y-6">
            <PageHeader title="Attendance History" description="View your day-by-day attendance records" />
            <EmptyState icon="calendar" title="No attendance records" description="Your attendance will be tracked automatically once sessions begin." />
        </div>
    );
}
