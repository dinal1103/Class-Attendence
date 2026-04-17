import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Loader2, FileText, X, Archive, Calendar, Users, Percent, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/api/axios';

interface AuditLog {
    _id: string;
    type: string;
    class_id: any;
    performedBy: any;
    createdAt: string;
    details: any;
}

export default function HodAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        api.get('/audit-logs')
            .then(res => setLogs(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <PageHeader title="Audit Logs" description="Department-wide class archival and audit trail" />
            
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : logs.length === 0 ? (
                <EmptyState icon="folder" title="No logs" description="Audit log entries will be shown here." />
            ) : (
                <div className="space-y-4">
                    {logs.map(log => (
                        <Card key={log._id}>
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center shrink-0">
                                        {log.type === 'class_archived' ? <Archive className="w-5 h-5 text-surface-600" /> : <FileText className="w-5 h-5 text-surface-600" />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-surface-900">
                                            {log.type === 'class_archived' ? `Class Archived: ${log.class_id?.name || 'Unknown Class'}` : log.type}
                                        </h3>
                                        <p className="text-xs text-surface-500 mt-1">
                                            Performed by <span className="font-medium">{log.performedBy?.name || 'System'}</span> on {new Date(log.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="secondary" size="sm" onClick={() => setSelectedLog(log)}>
                                    View Report
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Report Viewer Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-surface-900">Archival Report</h2>
                                <p className="text-sm text-surface-500">
                                    {selectedLog.class_id?.name} ({selectedLog.class_id?.code})
                                </p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 text-surface-400 hover:text-surface-600 rounded-full hover:bg-surface-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <div className="bg-primary-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <Users className="w-6 h-6 text-primary-600 mb-2" />
                                    <p className="text-2xl font-bold text-primary-900">{selectedLog.details?.totalStudents || 0}</p>
                                    <p className="text-xs font-medium text-primary-700 uppercase tracking-wider">Total Students</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <Calendar className="w-6 h-6 text-green-600 mb-2" />
                                    <p className="text-2xl font-bold text-green-900">{selectedLog.details?.totalSessions || 0}</p>
                                    <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Classes Held</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <Percent className="w-6 h-6 text-purple-600 mb-2" />
                                    <p className="text-2xl font-bold text-purple-900">
                                        {selectedLog.details?.students?.length > 0 
                                            ? Math.round(selectedLog.details.students.reduce((acc: number, s: any) => acc + (s.attendancePercentage || 0), 0) / selectedLog.details.students.length)
                                            : 0}%
                                    </p>
                                    <p className="text-xs font-medium text-purple-700 uppercase tracking-wider">Avg Attendance</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-4">Detailed Attendance History</h3>
                            
                            {(!selectedLog.details?.students || selectedLog.details.students.length === 0) ? (
                                <p className="text-sm text-surface-500 py-4 text-center bg-surface-50 rounded-lg">No student data available.</p>
                            ) : (
                                <div className="border border-surface-200 rounded-xl overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-surface-50 border-b border-surface-200 text-surface-600">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold sticky left-0 bg-surface-50 z-10 border-r border-surface-200 min-w-[150px]">Student Name</th>
                                                    <th className="px-3 py-3 font-bold text-center">ID</th>
                                                    <th className="px-3 py-3 font-bold text-center border-r border-surface-100 italic">%</th>
                                                    {selectedLog.details.sessionDates?.map((date: string, idx: number) => (
                                                        <th key={idx} className="px-2 py-3 font-medium text-center min-w-[60px] border-r border-surface-100">
                                                            <div className="flex flex-col items-center">
                                                                <span>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                                <span className="text-[10px] text-surface-400 font-normal">{new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-surface-100">
                                                {selectedLog.details.students.map((student: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-surface-50/50">
                                                        <td className="px-4 py-3 font-semibold text-surface-900 sticky left-0 bg-white group-hover:bg-surface-50 z-10 border-r border-surface-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                            <div className="truncate w-[130px]">{student.name}</div>
                                                        </td>
                                                        <td className="px-3 py-3 text-surface-500 text-center font-mono text-[10px]">{student.enrollmentId}</td>
                                                        <td className={`px-3 py-3 text-center border-r border-surface-100 font-bold ${
                                                            student.attendancePercentage >= 75 ? 'text-green-600' :
                                                            student.attendancePercentage >= 50 ? 'text-yellow-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {student.attendancePercentage}%
                                                        </td>
                                                        {student.attendanceStatuses?.map((status: string, sIdx: number) => (
                                                            <td key={sIdx} className="px-2 py-3 text-center border-r border-surface-100">
                                                                {status === 'present' || status === 'flagged' ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4 text-surface-200 mx-auto" />
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between text-[10px] text-surface-500 font-medium italic">
                                        <span>* Scroll horizontally to view all session dates</span>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> Present</div>
                                            <div className="flex items-center gap-1.5"><XCircle className="w-3 h-3 text-surface-300" /> Absent</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
