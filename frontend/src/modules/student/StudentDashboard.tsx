import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, Camera, Loader2, Plus, X } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
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

interface ClassAttendance {
    classId: string;
    className: string;
    classCode: string;
    totalSessions: number;
    rate: number;
}

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    // Join class modal state
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [joinSuccess, setJoinSuccess] = useState('');

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get('/stats/student').then(r => setStats(r.data)).catch(() => null),
            api.get('/classes').then(r => setClasses(r.data)).catch(() => []),
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const getClassRate = (classId: string) => {
        const found = classAttendance.find(ca => ca.classId === classId);
        return found?.rate ?? 0;
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError('');
        setJoinSuccess('');
        setJoining(true);
        try {
            const res = await api.post('/classes/join', { code: classCode });
            setJoinSuccess(`Joined "${res.data.name}" successfully!`);
            setClassCode('');
            fetchData();
            setTimeout(() => { setShowJoinModal(false); setJoinSuccess(''); }, 1500);
        } catch (err: any) {
            setJoinError(err.response?.data?.error || 'Failed to join class.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Welcome + Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-surface-900">
                        Welcome back, {user?.name?.split(' ')[0] || 'Student'}
                    </h1>
                    <p className="text-surface-500 text-sm mt-1">Here's your attendance overview</p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowJoinModal(true)}>Join Class</Button>
                    <Button size="sm" leftIcon={<Camera className="w-4 h-4" />}
                        onClick={() => navigate(ROUTES.STUDENT.FACE_ENROLL)}>Face Enroll</Button>
                </div>
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

                    {/* Enrolled Classes — Card Grid */}
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">My Classes</h2>
                        {classes.length === 0 ? (
                            <EmptyState icon="clipboard" title="No classes yet" description="Click 'Join Class' to get started." compact />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(cls => (
                                    <Card key={cls._id}
                                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                                        onClick={() => navigate(`/student/classes/${cls._id}`)}>
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
                                                    <p className="text-xs text-surface-400 truncate">{cls.faculty_id?.name || 'TBD'}</p>
                                                    <p className="text-xs text-surface-400 truncate">{cls.department_id?.name || ''}</p>
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

            {/* Join Class Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => { setShowJoinModal(false); setJoinError(''); setJoinSuccess(''); }}
                            className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Join a Class</h2>
                        <p className="text-sm text-surface-500 mb-4">Enter the class code shared by your faculty.</p>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Input label="Class Code" placeholder="e.g. CS201" value={classCode}
                                onChange={e => setClassCode(e.target.value)} required />
                            {joinError && <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">{joinError}</div>}
                            {joinSuccess && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">{joinSuccess}</div>}
                            <Button type="submit" className="w-full" disabled={joining}>
                                {joining ? 'Joining...' : 'Join Class'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
