import { useEffect, useState, useRef } from 'react';
import { Camera, Loader2, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import api from '@/api/axios';

interface ClassItem {
    _id: string;
    name: string;
    code: string;
}

interface Session {
    _id: string;
    class_id: { name: string; code: string } | null;
    status: string;
    createdAt: string;
}

export default function FacultyAttendance() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        Promise.all([
            api.get('/classes').then(r => setClasses(r.data)),
            api.get('/attendance/sessions').then(r => setSessions(r.data))
        ]).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleUpload = async () => {
        if (!selectedClass) { setMessage('Please select a class first.'); return; }
        const files = fileRef.current?.files;
        if (!files || files.length === 0) { setMessage('Please select at least one photo.'); return; }

        setUploading(true);
        setMessage('');
        const formData = new FormData();
        formData.append('classId', selectedClass);
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        try {
            const res = await api.post('/attendance/sessions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(res.data.message || 'Session created successfully!');
            // Refresh sessions
            const sessRes = await api.get('/attendance/sessions');
            setSessions(sessRes.data);
            if (fileRef.current) fileRef.current.value = '';
        } catch (err: any) {
            setMessage(err.response?.data?.error || 'Failed to create session.');
        } finally {
            setUploading(false);
        }
    };

    const statusIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'pending' || status === 'processing') return <Clock className="w-4 h-4 text-yellow-500" />;
        return <XCircle className="w-4 h-4 text-red-500" />;
    };

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Attendance Sessions" description="Start or review attendance sessions" />

            {/* Start Session */}
            <Card>
                <CardHeader><CardTitle>Start New Session</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700">Select Class</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">— Choose a class —</option>
                            {classes.map(cls => (
                                <option key={cls._id} value={cls._id}>{cls.name} ({cls.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-surface-700">Upload Classroom Photos</label>
                        <input type="file" ref={fileRef} accept="image/*" multiple
                            className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                    </div>
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('created') ? 'bg-green-50 text-green-700' : 'bg-error-50 text-error-700'}`}>
                            {message}
                        </div>
                    )}
                    <Button onClick={handleUpload} disabled={uploading} leftIcon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}>
                        {uploading ? 'Uploading...' : 'Start Session'}
                    </Button>
                </CardContent>
            </Card>

            {/* Past Sessions */}
            <Card>
                <CardHeader><CardTitle>Past Sessions</CardTitle></CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <EmptyState icon="calendar" title="No sessions" description="Start a new attendance session above." compact />
                    ) : (
                        <div className="divide-y divide-surface-100">
                            {sessions.map(s => (
                                <div key={s._id} className="flex items-center justify-between py-3 px-2">
                                    <div className="flex items-center gap-3">
                                        {statusIcon(s.status)}
                                        <div>
                                            <p className="text-sm font-medium text-surface-900">{s.class_id?.name || 'Unknown'} ({s.class_id?.code || ''})</p>
                                            <p className="text-xs text-surface-400">{new Date(s.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.status === 'completed' ? 'bg-green-50 text-green-700' :
                                            s.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                'bg-red-50 text-red-700'
                                        }`}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
