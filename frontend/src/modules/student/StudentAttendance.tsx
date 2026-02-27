import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
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
    createdAt: string;
}

interface AttendanceRow {
    className: string;
    status: string;
    date: string;
    time: string;
    rawDate: string;
}

export default function StudentAttendance() {
    const [rows, setRows] = useState<AttendanceRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sessRes = await api.get('/attendance/sessions');
                const sessions: Session[] = sessRes.data;

                // Fetch records for all sessions in parallel
                const allRows: AttendanceRow[] = [];
                await Promise.all(
                    sessions.map(async (session) => {
                        try {
                            const recRes = await api.get(`/attendance/sessions/${session._id}/records`);
                            const records: AttendanceRecord[] = recRes.data;
                            records.forEach((rec) => {
                                const d = new Date(rec.createdAt || session.createdAt);
                                allRows.push({
                                    className: session.class_id?.name
                                        ? `${session.class_id.name} (${session.class_id.code})`
                                        : 'Unknown',
                                    status: rec.status,
                                    date: d.toLocaleDateString(),
                                    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    rawDate: d.toISOString(),
                                });
                            });
                        } catch {
                            // skip failed sessions
                        }
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

    const columns: Column<AttendanceRow>[] = [
        {
            key: 'className',
            label: 'Class Name',
            sortable: true,
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (value) => {
                const s = value as string;
                return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s === 'present'
                        ? 'bg-green-50 text-green-700'
                        : s === 'absent'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}>
                        {s === 'present' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
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
            <PageHeader title="Attendance History" description="View your day-by-day attendance records" />
            <DataTable
                columns={columns}
                data={rows}
                searchKey="className"
                searchPlaceholder="Search by class name…"
                dateKey="rawDate"
                pageSize={10}
                exportFileName="student-attendance"
            />
        </div>
    );
}
