import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, BookOpen, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { Card, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    faculty_id?: { name: string; email: string };
    department_id?: { name: string; code: string };
    students: string[];
}

export default function StudentClasses() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [joining, setJoining] = useState(false);
    const [classCode, setClassCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchClasses = () => {
        setLoading(true);
        api.get('/classes')
            .then(r => setClasses(r.data))
            .catch(() => setClasses([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchClasses(); }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setJoining(true);
        try {
            const res = await api.post('/classes/join', { code: classCode });
            setSuccess(`Joined "${res.data.name}" successfully!`);
            setClassCode('');
            fetchClasses();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to join class.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Classes" description="Classes you are enrolled in"
                actions={<Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Join Class</Button>} />

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : classes.length === 0 ? (
                <EmptyState icon="clipboard" title="No classes yet" description="Click 'Join Class' and enter a class code to get started." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <Card key={cls._id} className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/student/classes/${cls._id}`)}>
                            <CardContent className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-surface-900 truncate">{cls.name}</p>
                                        <p className="text-xs text-surface-500 mt-0.5">Code: {cls.code}</p>
                                        <p className="text-xs text-surface-400 mt-0.5">Faculty: {cls.faculty_id?.name || 'TBD'}</p>
                                        <p className="text-xs text-surface-400">{cls.department_id?.name || ''}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Join Class Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => { setShowModal(false); setError(''); setSuccess(''); }}
                            className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Join a Class</h2>
                        <p className="text-sm text-surface-500 mb-4">Enter the class code shared by your faculty.</p>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <Input label="Class Code" placeholder="e.g. CS201" value={classCode}
                                onChange={e => setClassCode(e.target.value)} required />
                            {error && <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm font-medium">{error}</div>}
                            {success && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">{success}</div>}
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
