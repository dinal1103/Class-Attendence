import { motion } from 'framer-motion';
import { ClipboardList, Shield, Users, FileCheck } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';

export default function HodDashboard() {
    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">HOD Dashboard</h1>
                <p className="text-surface-500 text-sm mt-1">Departmental oversight and approvals</p>
            </div>
            <motion.div variants={listVariants} initial="initial" animate="animate"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Pending Approvals" value={0} icon={<ClipboardList className="w-6 h-6" />}
                    iconBgColor="#FFFBEB" iconColor="#D97706" />
                <StatCard title="Audit Logs" value={0} icon={<Shield className="w-6 h-6" />}
                    iconBgColor="#EFF6FF" iconColor="#2563EB" />
                <StatCard title="Faculty" value={0} icon={<Users className="w-6 h-6" />}
                    iconBgColor="#F0FDF4" iconColor="#16A34A" />
                <StatCard title="Overrides" value={0} icon={<FileCheck className="w-6 h-6" />}
                    iconBgColor="#FEF2F2" iconColor="#DC2626" />
            </motion.div>
            <Card>
                <CardHeader><CardTitle>Recent Approvals</CardTitle></CardHeader>
                <CardContent>
                    <EmptyState icon="clipboard" title="No pending approvals" description="Approval requests from faculty will appear here." compact />
                </CardContent>
            </Card>
        </div>
    );
}
