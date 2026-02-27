import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
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

                        try {
                            const recRes = await api.get(`/attendance/sessions/${session._id}/records`);
                            const records: AttendanceRecord[] = recRes.data;
                            totalPresent = records.filter(r => r.status === 'present').length;
                            totalAbsent = records.filter(r => r.status === 'absent').length;
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
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

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
                exportFileName="faculty-attendance"
            />
        </div>
    );
}
