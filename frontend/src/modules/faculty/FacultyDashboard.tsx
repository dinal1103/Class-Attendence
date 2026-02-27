import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CalendarCheck, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';
import useAuthStore from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import api from '@/api/axios';

interface FacultyStats {
    myClasses: number;
    totalStudents: number;
    sessionsToday: number;
    pendingDisputes: number;
}

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    students: string[];
    department_id?: { name: string; code: string };
    schedule?: string;
}

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<FacultyStats | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/stats/faculty').then(r => setStats(r.data)).catch(() => null),
            api.get('/classes').then(r => setClasses(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                    Welcome, {user?.name?.split(' ')[0] || 'Faculty'}
                </h1>
                <p className="text-surface-500 text-sm mt-1">Manage your classes and attendance sessions</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <>
                    <motion.div variants={listVariants} initial="initial" animate="animate"
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard title="My Classes" value={stats?.myClasses ?? 0} icon={<LayoutDashboard className="w-6 h-6" />}
                            iconBgColor="#EFF6FF" iconColor="#2563EB" />
                        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={<Users className="w-6 h-6" />}
                            iconBgColor="#F0FDF4" iconColor="#16A34A" />
                        <StatCard title="Sessions Today" value={stats?.sessionsToday ?? 0} icon={<CalendarCheck className="w-6 h-6" />}
                            iconBgColor="#FFFBEB" iconColor="#D97706" />
                        <StatCard title="Pending Disputes" value={stats?.pendingDisputes ?? 0} icon={<AlertCircle className="w-6 h-6" />}
                            iconBgColor="#FEF2F2" iconColor="#DC2626" />
                    </motion.div>

                    {/* My Classes List */}
                    <Card>
                        <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
                        <CardContent>
                            {classes.length === 0 ? (
                                <EmptyState icon="clipboard" title="No classes" description="Create a class from the Classes page to get started." compact />
                            ) : (
                                <div className="divide-y divide-surface-100">
                                    {classes.map(cls => (
                                        <div key={cls._id}
                                            className="flex items-center justify-between py-3 px-2 hover:bg-surface-50 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => navigate(`/faculty/classes/${cls._id}`)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-surface-900">{cls.name}</p>
                                                    <p className="text-xs text-surface-500">Code: {cls.code} · {cls.department_id?.name || ''}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-surface-700">{cls.students?.length || 0}</p>
                                                <p className="text-xs text-surface-400">students</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
