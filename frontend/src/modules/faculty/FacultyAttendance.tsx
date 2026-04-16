import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import DataTable from '@/components/composite/DataTable';
import type { Column } from '@/components/composite/DataTable';
import api from '@/api/axios';

interface Session {
    _id: string;
    class_id: { name: string; code: string } | null;
    status: string;
    createdAt: string;
}

interface AttendanceRecord {
    _id: string;
    session_id: string;
    status: string;
    confidenceScore: number;
}

interface SessionRow {
    className: string;
    totalPresent: number;
    totalAbsent: number;
    sessionStatus: string;
    date: string;
    time: string;
    rawDate: string;
    rawRecords?: any[];
}

export default function FacultyAttendance() {
    const [rows, setRows] = useState<SessionRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessRes = await api.get('/attendance/sessions');
                const sessions: Session[] = sessRes.data;

                const allRows: SessionRow[] = await Promise.all(
                    sessions.map(async (session) => {
                        let totalPresent = 0;
                        let totalAbsent = 0;
                        let sessionRecords: any[] = [];

                        try {
                            const recRes = await api.get(`/attendance/sessions/${session._id}/records`);
                            sessionRecords = recRes.data;
                            totalPresent = sessionRecords.filter(r => r.status === 'present').length;
                            totalAbsent = sessionRecords.filter(r => r.status === 'absent').length;
                        } catch {
                            // skip
                        }

                        const d = new Date(session.createdAt);
                        return {
                            className: session.class_id
                                ? `${session.class_id.name} (${session.class_id.code})`
                                : 'Unknown',
                            totalPresent,
                            totalAbsent,
                            sessionStatus: session.status,
                            date: d.toLocaleDateString(),
                            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            rawDate: d.toISOString(),
                            rawRecords: sessionRecords
                        };
                    })
                );

                // Sort newest first
                allRows.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
                setRows(allRows);
            } catch {
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const columns: Column<SessionRow>[] = [
        {
            key: 'className',
            label: 'Class Name',
            sortable: true,
        },
        {
            key: 'totalPresent',
            label: 'Total Present',
            sortable: true,
            render: (value) => (
                <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> {String(value)}
                </span>
            ),
        },
        {
            key: 'totalAbsent',
            label: 'Total Absent',
            sortable: true,
            render: (value) => (
                <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                    <XCircle className="w-3.5 h-3.5" /> {String(value)}
                </span>
            ),
        },
        {
            key: 'sessionStatus',
            label: 'Status',
            sortable: true,
            render: (value) => {
                const s = value as string;
                const colors = s === 'completed' ? 'bg-green-50 text-green-700'
                    : s === 'pending' || s === 'processing' ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-red-50 text-red-700';
                const Icon = s === 'completed' ? CheckCircle : s === 'pending' || s === 'processing' ? Clock : XCircle;
                return (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${colors}`}>
                        <Icon className="w-3 h-3" /> {s}
                    </span>
                );
            },
        },
        {
            key: 'date',
            label: 'Date',
            sortable: true,
        },
        {
            key: 'time',
            label: 'Time',
            sortable: true,
        },
        {
            key: 'rawDate',
            label: 'Export',
            sortable: false,
            render: (_val, row) => (
                <button 
                    onClick={() => handleExportDetails([row])}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Export this session"
                >
                    <Download className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const handleExportDetails = (filteredSessions: SessionRow[]) => {
        const exportData: any[] = [];
        filteredSessions.forEach(session => {
            if (session.rawRecords && session.rawRecords.length > 0) {
                // Remove flagged, keep logic clean
                session.rawRecords.forEach(r => {
                    exportData.push({
                        'Class Name': session.className,
                        'Date': session.date,
                        'Time': session.time,
                        'Student Name': r.student_id?.name || 'Unknown',
                        'Student Email': r.student_id?.email || '',
                        'Status': r.status.toUpperCase()
                    });
                });
            } else {
                exportData.push({
                    'Class Name': session.className,
                    'Date': session.date,
                    'Time': session.time,
                    'Student Name': 'No record available',
                    'Student Email': '',
                    'Status': ''
                });
            }
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        // Force column widths
        ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DetailedAttendance');
        XLSX.writeFile(wb, `detailed-attendance-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Attendance Sessions" description="View and export all attendance session records" />
            <DataTable
                columns={columns}
                data={rows}
                searchKey="className"
                searchPlaceholder="Search by class name…"
                dateKey="rawDate"
                pageSize={10}
                onExport={handleExportDetails}
            />
        </div>
    );
}
