import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, CalendarCheck, AlertCircle, Loader2, BookOpen, Plus, X } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { EmptyState } from '@/components/composite/EmptyState';
import { CircularProgress } from '@/components/primitives/CircularProgress';
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

interface ClassAttendance {
    classId: string;
    className: string;
    classCode: string;
    totalSessions: number;
    rate: number;
}

export default function FacultyDashboard() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<FacultyStats | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    // Create class modal state
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formName, setFormName] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        Promise.all([
            api.get('/stats/faculty').then(r => setStats(r.data)).catch(() => null),
            api.get('/classes').then(r => setClasses(r.data)).catch(() => []),
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    }, []);

    const getClassRate = (classId: string) => {
        const found = classAttendance.find(ca => ca.classId === classId);
        return found?.rate ?? 0;
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setFormError('');
        try {
            await api.post('/classes', {
                name: formName,
                departmentId: user?.department_id,
                facultyId: user?.id,
            });
            setShowModal(false);
            setFormName('');
            // Re-fetch classes
            api.get('/classes').then(r => setClasses(r.data)).catch(() => { });
            api.get('/stats/faculty').then(r => setStats(r.data)).catch(() => { });
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => { });
        } catch (err: any) {
            setFormError(err.response?.data?.error || 'Failed to create class.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Welcome + Create Class */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                        Welcome, {user?.name?.split(' ')[0] || 'Faculty'}
                    </h1>
                    <p className="text-surface-500 text-sm mt-1">Manage your classes and attendance sessions</p>
                </div>
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowModal(true)}>Create Class</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <motion.div variants={listVariants} initial="initial" animate="animate"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard title="My Classes" value={stats?.myClasses ?? 0} icon={<LayoutDashboard className="w-6 h-6" />}
                            iconBgColor="#EFF6FF" iconColor="#2563EB" />
                        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={<Users className="w-6 h-6" />}
                            iconBgColor="#F0FDF4" iconColor="#16A34A" />
                        <StatCard title="Sessions Today" value={stats?.sessionsToday ?? 0} icon={<CalendarCheck className="w-6 h-6" />}
                            iconBgColor="#FFFBEB" iconColor="#D97706" />
                        <StatCard title="Pending Disputes" value={stats?.pendingDisputes ?? 0} icon={<AlertCircle className="w-6 h-6" />}
                            iconBgColor="#FEF2F2" iconColor="#DC2626" />
                    </motion.div>

                    {/* My Classes — Card Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">My Classes</h2>
                        {classes.length === 0 ? (
                            <EmptyState icon="clipboard" title="No classes" description="Create a class from the Classes page to get started." compact />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(cls => (
                                    <Card key={cls._id}
                                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                        onClick={() => navigate(`/faculty/classes/${cls._id}`)}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                                            <BookOpen className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-surface-900 truncate">{cls.name}</p>
                                                            <p className="text-xs text-surface-500">{cls.code}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-surface-400">{cls.department_id?.name || ''}</p>
                                                    <p className="text-xs text-primary-600 font-medium mt-1">{cls.students?.length || 0} students</p>
                                                </div>
                                                <CircularProgress value={getClassRate(cls._id)} size={44} strokeWidth={4} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Create Class Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Create New Class</h2>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <Input label="Class Name" placeholder="e.g. Data Structures" value={formName}
                                onChange={e => setFormName(e.target.value)} required />
                            <p className="text-xs text-surface-400">A unique class code will be automatically generated.</p>
                            {formError && <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">{formError}</div>}
                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? 'Creating...' : 'Create Class'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
