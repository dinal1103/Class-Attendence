import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';
export default function HodAuditLogs() {
    return (<div className="space-y-6">
        <PageHeader title="Audit Logs" description="Department-wide audit trail" />
        <EmptyState icon="folder" title="No logs" description="Audit log entries will be shown here." />
    </div>);
}
