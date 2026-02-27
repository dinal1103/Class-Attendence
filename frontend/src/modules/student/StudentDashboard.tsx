import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Camera, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/composite/EmptyState';
import { CircularProgress } from '@/components/primitives/CircularProgress';
import useAuthStore from '@/store/authStore';
import { listVariants } from '@/lib/animations';
import { ROUTES } from '@/lib/constants';
import api from '@/api/axios';

interface StudentStats {
    totalLectures: number;
    present: number;
    absent: number;
    rate: number;
}

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    faculty_id?: { name: string };
    department_id?: { name: string; code: string };
    students: string[];
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/stats/student').then(r => setStats(r.data)).catch(() => null),
            api.get('/classes').then(r => setClasses(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                        Welcome back, {user?.name?.split(' ')[0] || 'Student'}
                    </h1>
                    <p className="text-surface-500 text-sm mt-1">Here's your attendance overview</p>
                </div>
                <Button size="sm" leftIcon={<Camera className="w-4 h-4" />}
                    onClick={() => navigate(ROUTES.STUDENT.FACE_ENROLL)}>Face Enroll</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <motion.div variants={listVariants} initial="initial" animate="animate"
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard title="Total Lectures" value={stats?.totalLectures ?? 0} icon={<BookOpen className="w-6 h-6" />}
                            iconBgColor="#EFF6FF" iconColor="#2563EB" />
                        <StatCard title="Present" value={stats?.present ?? 0} icon={<CheckCircle className="w-6 h-6" />}
                            iconBgColor="#ECFDF5" iconColor="#10B981" />
                        <StatCard title="Absent" value={stats?.absent ?? 0} icon={<XCircle className="w-6 h-6" />}
                            iconBgColor="#FEF2F2" iconColor="#EF4444" />

                        {/* Attendance Rate with Circular Progress */}
                        <motion.div variants={listVariants} className="bg-white rounded-xl border border-surface-100 shadow-soft p-5 flex items-center justify-between hover:shadow-soft-hover transition-all duration-300 hover:-translate-y-0.5">
                            <div>
                                <p className="text-sm font-medium text-surface-500">Rate</p>
                                <p className="text-xs text-surface-400 mt-2">min 75% required</p>
                            </div>
                            <CircularProgress value={stats?.rate ?? 0} size={56} strokeWidth={5} />
                        </motion.div>
                    </motion.div>

                    {/* Enrolled Classes */}
                    <Card>
                        <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
                        <CardContent>
                            {classes.length === 0 ? (
                                <EmptyState icon="clipboard" title="No classes yet" description="Join a class from the Classes page to get started." compact />
                            ) : (
                                <div className="divide-y divide-surface-100">
                                    {classes.map(cls => (
                                        <div key={cls._id}
                                            className="flex items-center justify-between py-3 px-2 hover:bg-surface-50 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => navigate(`/student/classes/${cls._id}`)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-surface-900">{cls.name}</p>
                                                    <p className="text-xs text-surface-500">Code: {cls.code} · {cls.faculty_id?.name || 'TBD'}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-primary-600 font-medium">View →</span>
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
