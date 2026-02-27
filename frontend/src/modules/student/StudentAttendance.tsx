import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface Session {
    _id: string;
    class_id: { name: string; code: string } | null;
    status: string;
    createdAt: string;
}

interface Record {
    _id: string;
    session_id: string;
    status: string;
    confidenceScore: number;
    createdAt: string;
}

export default function StudentAttendance() {
    const navigate = useNavigate();
    const [records, setRecords] = useState<Record[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all sessions the student might have records in
        api.get('/attendance/sessions')
            .then(r => setSessions(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const statusIcon = (status: string) => {
        if (status === 'present') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'absent') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-yellow-500" />;
    };

    const statusBadge = (status: string) => {
        const colors = status === 'present' ? 'bg-green-50 text-green-700' :
            status === 'absent' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700';
        return <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors}`}>{status}</span>;
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Attendance History" description="View your day-by-day attendance records" />

            {sessions.length === 0 ? (
                <EmptyState icon="calendar" title="No attendance records"
                    description="Your attendance will be tracked automatically once sessions begin." />
            ) : (
                <div className="space-y-3">
                    {sessions.map(s => (
                        <SessionCard key={s._id} session={s} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SessionCard({ session }: { session: { _id: string; class_id: { name: string; code: string } | null; status: string; createdAt: string } }) {
    const [records, setRecords] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loadingRecords, setLoadingRecords] = useState(false);

    const toggleExpand = () => {
        if (!expanded && records.length === 0) {
            setLoadingRecords(true);
            api.get(`/attendance/sessions/${session._id}/records`)
                .then(r => setRecords(r.data))
                .catch(() => { })
                .finally(() => setLoadingRecords(false));
        }
        setExpanded(!expanded);
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpand}>
                    <div>
                        <p className="text-sm font-semibold text-surface-900">{session.class_id?.name || 'Unknown'} ({session.class_id?.code || ''})</p>
                        <p className="text-xs text-surface-400">{new Date(session.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${session.status === 'completed' ? 'bg-green-50 text-green-700' :
                            session.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-red-50 text-red-700'
                        }`}>{session.status}</span>
                </div>
                {expanded && (
                    <div className="mt-3 pt-3 border-t border-surface-100">
                        {loadingRecords ? (
                            <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
                        ) : records.length === 0 ? (
                            <p className="text-xs text-surface-400">No records found for this session.</p>
                        ) : (
                            <div className="space-y-2">
                                {records.map((r: any) => (
                                    <div key={r._id} className="flex items-center justify-between py-2 px-2 bg-surface-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {r.status === 'present' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                            <span className="text-sm text-surface-700">{r.student_id?.name || 'You'} — {r.status}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-surface-400">{Math.round(r.confidenceScore * 100)}%</span>
                                            <Button size="sm" variant="secondary"
                                                leftIcon={<AlertCircle className="w-3 h-3 text-error-500" />}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    // Navigate to disputes with pre-filled data
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
            </CardContent>
        </Card>
    );
}
