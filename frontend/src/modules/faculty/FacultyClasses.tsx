import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, BookOpen, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Card, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { CircularProgress } from '@/components/primitives/CircularProgress';
import api from '@/api/axios';
import useAuthStore from '@/store/authStore';

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    students: string[];
    department_id?: { name: string; code: string };
    faculty_id?: { name: string; email: string };
    schedule?: string;
}

interface ClassAttendance {
    classId: string;
    rate: number;
}

export default function FacultyClasses() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '' });

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get('/classes').then(r => setClasses(r.data)).catch(() => setClasses([])),
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const getClassRate = (classId: string) => {
        const found = classAttendance.find(ca => ca.classId === classId);
        return found?.rate ?? 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            await api.post('/classes', {
                name: form.name,
                departmentId: user?.department_id,
                facultyId: user?.id,
            });
            setShowModal(false);
            setForm({ name: '' });
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create class.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" description="Classes assigned to you"
                actions={<Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Class</Button>} />

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : classes.length === 0 ? (
                <EmptyState icon="clipboard" title="No classes" description="Click 'Add Class' to create your first class." />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <Card key={cls._id} className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
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
                                                <p className="text-xs text-surface-500">Code: {cls.code}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-surface-400">{cls.department_id?.name || ''}</p>
                                        {cls.schedule && <p className="text-xs text-surface-400 mt-0.5">{cls.schedule}</p>}
                                        <p className="text-xs text-primary-600 font-medium mt-1">{cls.students?.length || 0} students</p>
                                    </div>
                                    <CircularProgress value={getClassRate(cls._id)} size={44} strokeWidth={4} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input label="Class Name" placeholder="e.g. Data Structures" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <p className="text-xs text-surface-400">A unique class code will be automatically generated.</p>
                            {error && <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">{error}</div>}
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
