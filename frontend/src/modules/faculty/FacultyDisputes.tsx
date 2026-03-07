import { useEffect, useState } from 'react';
import { Loader2, Check, X, Clock, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Badge } from '@/components/primitives/Badge';
import { EmptyState } from '@/components/composite/EmptyState';
import DataTable from '@/components/composite/DataTable';
import type { Column } from '@/components/composite/DataTable';
import api from '@/api/axios';

interface Dispute {
    _id: string;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    originalConfidence: number;
    student_id: {
        _id: string;
        name: string;
        email: string;
        enrollmentId: string;
    };
    session_id: {
        _id: string;
        createdAt: string;
        class_id: {
            name: string;
            code: string;
        };
    };
}

export default function FacultyDisputes() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const fetchDisputes = () => {
        setLoading(true);
        api.get('/disputes')
            .then(r => setDisputes(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const handleResolve = async (id: string, status: 'accepted' | 'rejected') => {
        setResolvingId(id);
        try {
            const note = prompt(`Enter a brief note for the ${status} decision (optional):`);
            if (note === null) {
                setResolvingId(null);
                return;
            }
            await api.put(`/disputes/${id}/resolve`, { status, reviewNote: note });
            fetchDisputes();
        } catch (err) {
            alert('Failed to resolve dispute.');
        } finally {
            setResolvingId(null);
        }
    };

    const columns: Column<Dispute>[] = [
        {
            key: 'student_id' as any,
            label: 'Student',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-surface-900">{row.student_id?.name || 'Unknown Student'}</p>
                    <p className="text-xs text-surface-500">{row.student_id?.enrollmentId || 'N/A'}</p>
                </div>
            )
        },
        {
            key: 'session_id' as any,
            label: 'Class/Session',
            render: (_, row) => (
                <div>
                    <p className="font-medium text-surface-900">{row.session_id?.class_id?.name || 'Unknown Class'}</p>
                    <p className="text-xs text-surface-500">{row.session_id?.createdAt ? new Date(row.session_id.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
            )
        },
        {
            key: 'reason' as any,
            label: 'Reason',
            render: (val: any) => (
                <p className="text-sm text-surface-600 max-w-xs truncate" title={String(val)}>{String(val)}</p>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (val: any) => {
                const colors: Record<string, any> = {
                    pending: 'warning',
                    accepted: 'success',
                    rejected: 'error'
                };
                return <Badge variant={colors[String(val)] || 'default'}>{String(val).toUpperCase()}</Badge>;
            }
        },
        {
            key: '_id' as any,
            label: 'Actions',
            render: (_, row) => {
                if (row.status !== 'pending') return <span className="text-xs text-surface-400 italic">Resolved</span>;
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="primary"
                            disabled={!!resolvingId}
                            onClick={() => handleResolve(row._id, 'accepted')}
                            leftIcon={<Check className="w-3 h-3" />}
                        >
                            Approve
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100"
                            disabled={!!resolvingId}
                            onClick={() => handleResolve(row._id, 'rejected')}
                            leftIcon={<X className="w-3 h-3" />}
                        >
                            Reject
                        </Button>
                    </div>
                );
            }
        }
    ];

    if (loading && disputes.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Student Disputes"
                description="Review and resolve attendance disputes raised by students"
            />

            {disputes.length === 0 ? (
                <EmptyState
                    icon="clipboard"
                    title="No disputes found"
                    description="Student disputes requiring review will appear here."
                />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <DataTable
                            columns={columns}
                            data={disputes}
                            searchKey="reason"
                            searchPlaceholder="Search by reason..."
                            dateKey="createdAt"
                            exportFileName="student-disputes"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
