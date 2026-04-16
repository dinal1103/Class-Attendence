import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Users, ArrowLeft, CheckCircle, XCircle, Clock, CalendarCheck, Upload, Camera, Copy, X, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/primitives/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { CameraCapture } from '@/components/composite/CameraCapture';
import { AttendanceVisualizer } from './components/AttendanceVisualizer';
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
    const [codeCopied, setCodeCopied] = useState(false);

    // Attendance modal state
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [sessionTime, setSessionTime] = useState(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    const [showCamera, setShowCamera] = useState(false);
    const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
    const [visualizingSessionId, setVisualizingSessionId] = useState<string | null>(null);

    const fetchData = () => {
        Promise.all([
            api.get(`/classes/${id}`).then(r => setCls(r.data)),
            api.get(`/attendance/sessions?classId=${id}`).then(r => setSessions(r.data))
        ]).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [id]);

    const copyCode = () => {
        if (cls?.code) {
            navigator.clipboard.writeText(cls.code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const handleUpload = async () => {
        const inputFiles = fileRef.current?.files ? Array.from(fileRef.current.files) : [];
        const allFiles = [...inputFiles, ...capturedFiles];

        if (allFiles.length === 0) {
            setUploadMessage('Please select or capture at least one photo.');
            return;
        }

        setUploading(true);
        setUploadMessage('');
        const formData = new FormData();
        formData.append('classId', id!);
        formData.append('sessionDate', `${sessionDate}T${sessionTime}:00`);
        
        allFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            const res = await api.post('/attendance/sessions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadMessage(res.data.message || 'Session created successfully!');
            if (fileRef.current) fileRef.current.value = '';
            setCapturedFiles([]);
            const sessRes = await api.get(`/attendance/sessions?classId=${id}`);
            setSessions(sessRes.data);
            setTimeout(() => { setShowAttendanceModal(false); setUploadMessage(''); }, 1500);
        } catch (err: any) {
            setUploadMessage(err.response?.data?.error || 'Failed to create session.');
        } finally {
            setUploading(false);
        }
    };

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
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-surface-900">{cls.name}</h1>
                    <p className="text-sm text-surface-500">{cls.department_id?.name || ''}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyCode}
                    leftIcon={codeCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}>
                    {codeCopied ? 'Copied!' : `Copy Code: ${cls.code}`}
                </Button>
            </div>

            {/* Quick Stats + Add Attendance Button */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div>
                        <div>
                            <p className="text-xs text-surface-500">Students</p>
                            <p className="text-lg font-bold text-surface-900">{cls.students?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-green-600" /></div>
                        <div>
                            <p className="text-xs text-surface-500">Sessions</p>
                            <p className="text-lg font-bold text-surface-900">{sessions.length}</p>
                        </div>
                    </CardContent>
                </Card>
                {cls.schedule && (
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-600" /></div>
                            <div>
                                <p className="text-xs text-surface-500">Schedule</p>
                                <p className="text-sm font-medium text-surface-900">{cls.schedule}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Add Attendance Button Card */}
                <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-2 border-dashed border-primary-300 bg-primary-50/30"
                    onClick={() => setShowAttendanceModal(true)}>
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 h-full">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><Plus className="w-5 h-5 text-primary-600" /></div>
                        <p className="text-xs font-semibold text-primary-700">Add Attendance</p>
                    </CardContent>
                </Card>
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
                        <EmptyState icon="calendar" title="No sessions" description="Click 'Add Attendance' to start a session." compact />
                    ) : (
                        <div className="space-y-2">
                            {sessions.map(s => (
                                <SessionRow key={s._id} session={s} onVerify={() => setVisualizingSessionId(s._id)} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Attendance Modal */}
            {showAttendanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => { setShowAttendanceModal(false); setUploadMessage(''); }}
                            className="absolute top-4 right-4 text-surface-400 hover:text-surface-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Add Attendance</h2>
                        <p className="text-sm text-surface-500 mb-5">Select the date and time, then upload classroom photos for face recognition.</p>

                        <div className="space-y-4">
                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Date</label>
                                    <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-1">Time</label>
                                    <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)}
                                        className="w-full h-10 px-3 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                </div>
                            </div>

                            {/* Photo Selection/Capture */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-surface-700">Classroom Photos</label>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        className="h-20 flex-col gap-2 border-dashed border-2 bg-surface-50/50 hover:bg-surface-50"
                                        onClick={() => setShowCamera(true)}
                                    >
                                        <Camera className="w-5 h-5 text-primary-600" />
                                        <span className="text-xs font-semibold">Take Photo</span>
                                    </Button>

                                    <div className="relative group">
                                        <input
                                            type="file"
                                            ref={fileRef}
                                            accept="image/*"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <Button 
                                            type="button" 
                                            variant="secondary" 
                                            className="h-20 w-full flex-col gap-2 border-dashed border-2 bg-surface-50/50 hover:bg-surface-50"
                                        >
                                            <Upload className="w-5 h-5 text-surface-500" />
                                            <span className="text-xs font-semibold text-surface-600">Upload Photos</span>
                                        </Button>
                                    </div>
                                </div>

                                {capturedFiles.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 py-2">
                                        {capturedFiles.map((file, idx) => (
                                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-surface-200">
                                                <img src={URL.createObjectURL(file)} alt="capture" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => setCapturedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <p className="text-xs text-surface-400">Capture or select up to 10 classroom photos. Ensure all student faces are visible.</p>
                            </div>

                            {uploadMessage && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${uploadMessage.includes('success') || uploadMessage.includes('created') || uploadMessage.includes('Processing')
                                    ? 'bg-green-50 text-green-700' : 'bg-error-50 text-error-700'}`}>
                                    {uploadMessage}
                                </div>
                            )}

                            <Button onClick={handleUpload} disabled={uploading} className="w-full"
                                leftIcon={uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}>
                                {uploading ? 'Uploading…' : 'Upload & Start Session'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showCamera && (
                <CameraCapture 
                    onCapture={(file) => setCapturedFiles(prev => [...prev, file])} 
                    onClose={() => setShowCamera(false)} 
                />
            )}
            {visualizingSessionId && (
                <AttendanceVisualizer 
                    sessionId={visualizingSessionId} 
                    onClose={() => setVisualizingSessionId(null)} 
                />
            )}
        </div>
    );
}

function SessionRow({ session, onVerify }: { session: any, onVerify: () => void }) {
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
                <div className="flex items-center gap-2">
                    {session.status === 'completed' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onVerify(); }}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Verify recognition"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronDown className={cn("w-4 h-4 text-surface-400 transition-transform", expanded && "rotate-180")} />
                </div>
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
