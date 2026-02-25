import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';
export default function HodOverrides() {
    return (<div className="space-y-6">
        <PageHeader title="Overrides" description="Manual attendance overrides in your department" />
        <EmptyState icon="clipboard" title="No overrides" description="Override records will appear here." />
    </div>);
}
