import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface Dispute {
    _id: string;
    reason: string;
    status: string;
    createdAt: string;
    reviewNote?: string;
    session_id?: { createdAt: string };
}

export default function StudentDisputes() {
    const [searchParams] = useSearchParams();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);

    // Pre-filled dispute form from query params
    const sessionId = searchParams.get('sessionId');
    const recordId = searchParams.get('recordId');
    const [showRaiseForm, setShowRaiseForm] = useState(!!sessionId && !!recordId);
    const [reason, setReason] = useState('');
    const [raising, setRaising] = useState(false);
    const [message, setMessage] = useState('');

    const fetchDisputes = () => {
        api.get('/disputes')
            .then(r => setDisputes(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDisputes(); }, []);

    const handleRaise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionId || !recordId) return;
        setRaising(true);
        setMessage('');
        try {
            await api.post('/disputes', { sessionId, recordId, reason });
            setMessage('Dispute raised successfully.');
            setShowRaiseForm(false);
            setReason('');
            fetchDisputes();
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Failed to raise dispute.');
        } finally {
            setRaising(false);
        }
    };

    const statusIcon = (status: string) => {
        if (status === 'accepted') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-yellow-500" />;
    };

    const statusColors = (status: string) => {
        if (status === 'accepted') return 'bg-green-50 text-green-700';
        if (status === 'rejected') return 'bg-red-50 text-red-700';
        return 'bg-yellow-50 text-yellow-700';
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="My Disputes" description="Track your attendance dispute records" />

            {/* Raise Dispute Form (only shown when navigated from an attendance record) */}
            {showRaiseForm && (
                <Card>
                    <CardContent className="p-5">
                        <h3 className="text-sm font-bold text-surface-900 mb-3">Raise a Dispute</h3>
                        <form onSubmit={handleRaise} className="space-y-3">
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Explain why you are disputing this attendance record..."
                                className="w-full h-24 rounded-lg border border-surface-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                required
                            />
                            {message && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-error-50 text-error-700'}`}>
                                    {message}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" disabled={raising}>
                                    {raising ? 'Submitting...' : 'Submit Dispute'}
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={() => setShowRaiseForm(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Disputes List */}
            {disputes.length === 0 ? (
                <EmptyState icon="clipboard" title="No disputes" description="You haven't raised any disputes yet. You can dispute an attendance record from the Attendance page." />
            ) : (
                <div className="space-y-3">
                    {disputes.map(d => (
                        <Card key={d._id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {statusIcon(d.status)}
                                        <div>
                                            <p className="text-sm font-medium text-surface-900">{d.reason}</p>
                                            <p className="text-xs text-surface-400 mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                                            {d.reviewNote && <p className="text-xs text-surface-500 mt-1">Review: {d.reviewNote}</p>}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors(d.status)}`}>
                                        {d.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
