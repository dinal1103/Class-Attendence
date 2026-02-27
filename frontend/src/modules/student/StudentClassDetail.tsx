import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, AlertCircle, CheckCircle, XCircle, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface ClassDetail {
    _id: string;
    name: string;
    code: string;
    faculty_id?: { name: string; email: string };
    department_id?: { name: string; code: string };
    students: { _id: string; name: string; email: string; enrollmentId?: string }[];
    schedule?: string;
}

interface Session {
    _id: string;
    status: string;
    createdAt: string;
}

interface AttendanceRecord {
    _id: string;
    session_id: string;
    student_id: { name: string };
    status: string;
    confidenceScore: number;
}

export default function StudentClassDetail() {
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
            {/* Back button & Header */}
            <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
                <div>
                    <h1 className="text-xl font-bold text-surface-900">{cls.name}</h1>
                    <p className="text-sm text-surface-500">Code: {cls.code} · {cls.department_id?.name || ''}</p>
                </div>
            </div>

            {/* Class Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-surface-500">Faculty</p>
                                <p className="text-sm font-medium text-surface-900">{cls.faculty_id?.name || 'TBD'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-surface-500">Students</p>
                                <p className="text-sm font-medium text-surface-900">{cls.students?.length || 0} enrolled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance Sessions for this Class */}
            <Card>
                <CardHeader><CardTitle>Attendance Sessions</CardTitle></CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <EmptyState icon="calendar" title="No sessions yet" description="Attendance sessions for this class will appear here." compact />
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
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-surface-50" onClick={toggle}>
                <div>
                    <p className="text-sm font-medium text-surface-900">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-50 text-green-700' :
                        session.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-red-50 text-red-700'
                    }`}>{session.status}</span>
            </div>
            {expanded && (
                <div className="px-3 pb-3 border-t border-surface-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
                    ) : records.length === 0 ? (
                        <p className="text-xs text-surface-400 py-2">No records.</p>
                    ) : (
                        <div className="space-y-2 mt-2">
                            {records.map(r => (
                                <div key={r._id} className="flex items-center justify-between py-2 px-2 bg-surface-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {r.status === 'present' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        <span className="text-sm text-surface-700">{r.status}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-surface-400">{Math.round(r.confidenceScore * 100)}%</span>
                                        <Button size="sm" variant="secondary"
                                            leftIcon={<AlertCircle className="w-3 h-3 text-error-500" />}
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                window.location.href = `/student/disputes?sessionId=${session._id}&recordId=${r._id}`;
                                            }}>
                                            Dispute
                                        </Button>
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
