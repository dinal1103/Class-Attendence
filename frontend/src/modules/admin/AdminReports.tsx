import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import DataTable from '@/components/composite/DataTable';
import type { Column } from '@/components/composite/DataTable';
import api from '@/api/axios';

interface ReportRow {
    department: string;
    className: string;
    classCode: string;
    date: string;
    time: string;
    rawDate: string;
    totalAttendance: number;
    present: number;
    absent: number;
    percentage: number;
}

export default function AdminReports() {
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/stats/admin/report')
            .then(r => setRows(r.data))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    const columns: Column<ReportRow>[] = [
        { key: 'department', label: 'Department', sortable: true },
        { key: 'className', label: 'Class Name', sortable: true },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'time', label: 'Time', sortable: true },
        { key: 'totalAttendance', label: 'Total', sortable: true },
        {
            key: 'present', label: 'Present', sortable: true,
            render: (v) => <span className="text-green-700 font-medium">{String(v)}</span>
        },
        {
            key: 'absent', label: 'Absent', sortable: true,
            render: (v) => <span className="text-red-700 font-medium">{String(v)}</span>
        },
        {
            key: 'percentage', label: 'Percentage', sortable: true,
            render: (v) => {
                const pct = v as number;
                const color = pct >= 75 ? 'text-green-700 bg-green-50' : pct >= 50 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50';
                return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>{pct}%</span>;
            }
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
            <PageHeader title="College Attendance Reports" description="View and export attendance data across all departments" />
            <DataTable
                columns={columns}
                data={rows}
                searchKey="className"
                searchPlaceholder="Search by class name…"
                dateKey="rawDate"
                pageSize={15}
                exportFileName="college-attendance-report"
            />
        </div>
    );
}
