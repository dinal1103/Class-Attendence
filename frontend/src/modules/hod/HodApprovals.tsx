import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';
export default function HodApprovals() {
    return (<div className="space-y-6">
        <PageHeader title="Approvals" description="Review pending departmental approvals" />
        <EmptyState icon="clipboard" title="No approvals" description="Pending approvals will appear here." />
    </div>);
}
