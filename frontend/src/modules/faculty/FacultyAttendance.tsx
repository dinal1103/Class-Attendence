import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/composite/EmptyState';
import { Camera } from 'lucide-react';

export default function FacultyAttendance() {
    return (
        <div className="space-y-6">
            <PageHeader title="Attendance Sessions" description="Start or review attendance sessions"
                actions={<Button leftIcon={<Camera className="w-4 h-4" />}>Start Session</Button>} />
            <EmptyState icon="calendar" title="No sessions" description="Start a new attendance session to capture classroom photos." />
        </div>
    );
}
