import { motion } from 'framer-motion';
import { Users, Building2, BarChart3, Shield } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';

export default function AdminDashboard() {
    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">Admin Dashboard</h1>
                <p className="text-surface-500 text-sm mt-1">Manage enrollments, view reports, and system overview</p>
            </div>
            <motion.div variants={listVariants} initial="initial" animate="animate"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Total Users" value={0} icon={<Users className="w-6 h-6" />}
                    iconBgColor="#EFF6FF" iconColor="#2563EB" />
                <StatCard title="Departments" value={0} icon={<Building2 className="w-6 h-6" />}
                    iconBgColor="#F0FDF4" iconColor="#16A34A" />
                <StatCard title="Active Classes" value={0} icon={<BarChart3 className="w-6 h-6" />}
                    iconBgColor="#FFFBEB" iconColor="#D97706" />
                <StatCard title="Overrides" value={0} icon={<Shield className="w-6 h-6" />}
                    iconBgColor="#FEF2F2" iconColor="#DC2626" />
            </motion.div>
            <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                    <EmptyState icon="folder" title="No activity" description="System activity will be logged here." compact />
                </CardContent>
            </Card>
        </div>
    );
}
