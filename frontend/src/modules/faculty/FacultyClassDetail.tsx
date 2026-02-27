import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Users, ArrowLeft, CheckCircle, XCircle, Clock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface Student {
    _id: string;
    name: string;
    email: string;
    enrollmentId?: string;
}

interface ClassDetail {
    _id: string;
    name: string;
    code: string;
    faculty_id?: { name: string; email: string };
    department_id?: { name: string; code: string };
    students: Student[];
    schedule?: string;
}

interface Session {
    _id: string;
    status: string;
    createdAt: string;
}

interface AttendanceRecord {
    _id: string;
    student_id: { name: string; email: string };
    status: string;
    confidenceScore: number;
}

export default function FacultyClassDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cls, setCls] = useState<ClassDetail | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get(`/classes/${id}`).then(r => setCls(r.data)),
            api.get(`/attendance/sessions?classId=${id}`).then(r => setSessions(r.data))
        ]).catch(() => { }).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    if (!cls) {
        return <EmptyState icon="clipboard" title="Class not found" description="The class you're looking for doesn't exist." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                <div>
                    <h1 className="text-xl font-bold text-surface-900">{cls.name}</h1>
                    <p className="text-sm text-surface-500">Code: {cls.code} · {cls.department_id?.name || ''}</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div>
                        <div>
                            <p className="text-xs text-surface-500">Students</p>
                            <p className="text-lg font-bold text-surface-900">{cls.students?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-green-600" /></div>
                        <div>
                            <p className="text-xs text-surface-500">Sessions</p>
                            <p className="text-lg font-bold text-surface-900">{sessions.length}</p>
                        </div>
                    </CardContent>
                </Card>
                {cls.schedule && (
                    <Card>
                        <CardContent className="p-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-600" /></div>
                            <div>
                                <p className="text-xs text-surface-500">Schedule</p>
                                <p className="text-sm font-medium text-surface-900">{cls.schedule}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Enrolled Students */}
            <Card>
                <CardHeader><CardTitle>Enrolled Students ({cls.students?.length || 0})</CardTitle></CardHeader>
                <CardContent>
                    {(!cls.students || cls.students.length === 0) ? (
                        <EmptyState icon="folder" title="No students" description="No students have joined this class yet." compact />
                    ) : (
                        <div className="divide-y divide-surface-100 max-h-64 overflow-y-auto">
                            {cls.students.map((s, i) => (
                                <div key={s._id} className="flex items-center gap-3 py-2.5 px-2">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                                        {i + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-surface-900 truncate">{s.name}</p>
                                        <p className="text-xs text-surface-400 truncate">{s.email}{s.enrollmentId ? ` · ${s.enrollmentId}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Sessions */}
            <Card>
                <CardHeader><CardTitle>Attendance Sessions</CardTitle></CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <EmptyState icon="calendar" title="No sessions" description="Start an attendance session from the Attendance page." compact />
                    ) : (
                        <div className="space-y-2">
                            {sessions.map(s => (
                                <SessionRow key={s._id} session={s} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SessionRow({ session }: { session: Session }) {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggle = () => {
        if (!expanded && records.length === 0) {
            setLoading(true);
            api.get(`/attendance/sessions/${session._id}/records`)
                .then(r => setRecords(r.data))
                .catch(() => { })
                .finally(() => setLoading(false));
        }
        setExpanded(!expanded);
    };

    return (
        <div className="border border-surface-100 rounded-lg">
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-50 transition-colors" onClick={toggle}>
                <p className="text-sm font-medium text-surface-900">{new Date(session.createdAt).toLocaleString()}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-50 text-green-700' :
                        session.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-surface-100 text-surface-600'
                    }`}>{session.status}</span>
            </div>
            {expanded && (
                <div className="px-3 pb-3 border-t border-surface-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
                    ) : records.length === 0 ? (
                        <p className="text-xs text-surface-400 py-2">No records for this session.</p>
                    ) : (
                        <div className="space-y-1.5 mt-2">
                            {records.map(r => (
                                <div key={r._id} className="flex items-center justify-between py-2 px-2 bg-surface-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {r.status === 'present' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        <span className="text-sm text-surface-700">{r.student_id?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === 'present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {r.status}
                                        </span>
                                        <span className="text-xs text-surface-400">{Math.round(r.confidenceScore * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
