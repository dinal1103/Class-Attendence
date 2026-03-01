import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { CircularProgress } from '@/components/primitives/CircularProgress';
import api from '@/api/axios';

interface Department {
    _id: string;
    name: string;
    code: string;
}

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    faculty_id?: { name: string; email: string };
    students: string[];
}

interface ClassAttendance {
    classId: string;
    rate: number;
}

export default function AdminDepartmentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [dept, setDept] = useState<Department | null>(null);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get(`/departments/${id}`).then(r => setDept(r.data)),
            api.get('/classes/available').then(r => {
                const all: ClassItem[] = r.data;
                setClasses(all.filter((c: any) =>
                    c.department_id?._id === id || c.department_id === id
                ));
            }),
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => [])
        ]).catch(() => { }).finally(() => setLoading(false));
    }, [id]);

    const getClassRate = (classId: string) => {
        const found = classAttendance.find(ca => ca.classId === classId);
        return found?.rate ?? 0;
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    if (!dept) {
        return <EmptyState icon="clipboard" title="Department not found" description="The department you're looking for doesn't exist." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                <div>
                    <h1 className="text-xl font-bold text-surface-900">{dept.name}</h1>
                    <p className="text-sm text-surface-500">Code: {dept.code} · {classes.length} classes</p>
                </div>
            </div>

            {/* Classes Grid */}
            {classes.length === 0 ? (
                <EmptyState icon="clipboard" title="No classes" description="No classes have been created in this department yet." />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <Card key={cls._id} className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                            onClick={() => navigate(`/admin/classes/${cls._id}`)}>
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
                                        <p className="text-xs text-surface-400">
                                            Faculty: {cls.faculty_id?.name || 'Unassigned'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Users className="w-3 h-3 text-primary-500" />
                                            <p className="text-xs text-primary-600 font-medium">{cls.students?.length || 0} students</p>
                                        </div>
                                    </div>
                                    <CircularProgress value={getClassRate(cls._id)} size={44} strokeWidth={4} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
