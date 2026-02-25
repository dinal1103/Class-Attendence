import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CalendarCheck, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';
import useAuthStore from '@/store/authStore';

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                    Welcome, {user?.name?.split(' ')[0] || 'Faculty'}
                </h1>
                <p className="text-surface-500 text-sm mt-1">Manage your classes and attendance sessions</p>
            </div>

            <motion.div variants={listVariants} initial="initial" animate="animate"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="My Classes" value={0} icon={<LayoutDashboard className="w-6 h-6" />}
                    iconBgColor="#EFF6FF" iconColor="#2563EB" />
                <StatCard title="Total Students" value={0} icon={<Users className="w-6 h-6" />}
                    iconBgColor="#F0FDF4" iconColor="#16A34A" />
                <StatCard title="Sessions Today" value={0} icon={<CalendarCheck className="w-6 h-6" />}
                    iconBgColor="#FFFBEB" iconColor="#D97706" />
                <StatCard title="Pending Disputes" value={0} icon={<AlertCircle className="w-6 h-6" />}
                    iconBgColor="#FEF2F2" iconColor="#DC2626" />
            </motion.div>

            <Card>
                <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
                <CardContent>
                    <EmptyState icon="calendar" title="No sessions yet" description="Start an attendance session from the Attendance page." compact />
                </CardContent>
            </Card>
        </div>
    );
}
