import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/composite/EmptyState';
import { Card, CardContent } from '@/components/primitives/Card';
import { Button } from '@/components/primitives/Button';
import { Loader2, FileText, X, Archive, Calendar, Users, Percent } from 'lucide-react';
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

                            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider mb-4">Student Roster</h3>
                            
                            {(!selectedLog.details?.students || selectedLog.details.students.length === 0) ? (
                                <p className="text-sm text-surface-500 py-4 text-center bg-surface-50 rounded-lg">No student data available.</p>
                            ) : (
                                <div className="border border-surface-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-surface-50 border-b border-surface-200 text-surface-600">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Student Name</th>
                                                <th className="px-4 py-3 font-medium text-center">Classes Attended</th>
                                                <th className="px-4 py-3 font-medium text-right">Attendance %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-surface-100">
                                            {selectedLog.details.students.map((student: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-surface-50/50">
                                                    <td className="px-4 py-3 font-medium text-surface-900">{student.name}</td>
                                                    <td className="px-4 py-3 text-surface-600 text-center">{student.totalPresent} / {selectedLog.details.totalSessions}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            student.attendancePercentage >= 75 ? 'bg-green-100 text-green-800' :
                                                            student.attendancePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {student.attendancePercentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
