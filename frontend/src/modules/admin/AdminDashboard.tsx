import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, BarChart3, Shield, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';
import api from '@/api/axios';

interface AdminStats {
    totalUsers: number;
    departments: number;
    activeClasses: number;
    overrides: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/stats/admin')
            .then(res => setStats(res.data))
            .catch(() => setStats({ totalUsers: 0, departments: 0, activeClasses: 0, overrides: 0 }))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">Admin Dashboard</h1>
                <p className="text-surface-500 text-sm mt-1">Manage enrollments, view reports, and system overview</p>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <motion.div variants={listVariants} initial="initial" animate="animate"
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<Users className="w-6 h-6" />}
                        iconBgColor="#EFF6FF" iconColor="#2563EB" />
                    <StatCard title="Departments" value={stats?.departments ?? 0} icon={<Building2 className="w-6 h-6" />}
                        iconBgColor="#F0FDF4" iconColor="#16A34A" />
                    <StatCard title="Active Classes" value={stats?.activeClasses ?? 0} icon={<BarChart3 className="w-6 h-6" />}
                        iconBgColor="#FFFBEB" iconColor="#D97706" />
                    <StatCard title="Overrides" value={stats?.overrides ?? 0} icon={<Shield className="w-6 h-6" />}
                        iconBgColor="#FEF2F2" iconColor="#DC2626" />
                </motion.div>
            )}
            <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent>
                    <EmptyState icon="folder" title="No activity" description="System activity will be logged here." compact />
                </CardContent>
            </Card>
        </div>
    );
}
