import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import * as XLSX from 'xlsx';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Column<T> {
    key: keyof T & string;
    label: string;
    sortable?: boolean;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, any>> {
    columns: Column<T>[];
    data: T[];
    searchKey?: keyof T & string;
    searchPlaceholder?: string;
    dateKey?: keyof T & string;
    pageSize?: number;
    exportFileName?: string;
    onExport?: (filteredData: T[]) => void;
}

type SortDir = 'asc' | 'desc' | null;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    searchKey,
    searchPlaceholder = 'Search…',
    dateKey,
    pageSize = 10,
    exportFileName = 'export',
    onExport,
}: DataTableProps<T>) {
    /* ---------- local state ---------- */
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    /* ---------- filtering ---------- */
    const filtered = useMemo(() => {
        let rows = [...data];

        // text search
        if (search && searchKey) {
            const q = search.toLowerCase();
            rows = rows.filter((r) => String(r[searchKey]).toLowerCase().includes(q));
        }

        // date range
        if (dateKey) {
            if (dateFrom) {
                const from = new Date(dateFrom);
                rows = rows.filter((r) => new Date(r[dateKey] as string) >= from);
            }
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                rows = rows.filter((r) => new Date(r[dateKey] as string) <= to);
            }
        }

        // sort
        if (sortKey && sortDir) {
            rows.sort((a, b) => {
                const va = a[sortKey];
                const vb = b[sortKey];
                if (va == null) return 1;
                if (vb == null) return -1;
                if (typeof va === 'number' && typeof vb === 'number') {
                    return sortDir === 'asc' ? va - vb : vb - va;
                }
                return sortDir === 'asc'
                    ? String(va).localeCompare(String(vb))
                    : String(vb).localeCompare(String(va));
            });
        }

        return rows;
    }, [data, search, searchKey, dateFrom, dateTo, dateKey, sortKey, sortDir]);

    /* ---------- pagination ---------- */
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    /* ---------- sort toggle ---------- */
    const toggleSort = (key: string) => {
        if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc');
            else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    };

    const sortIcon = (key: string) => {
        if (sortKey !== key) return <ChevronsUpDown className="w-3.5 h-3.5 text-surface-300" />;
        if (sortDir === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-primary-600" />;
        return <ChevronDown className="w-3.5 h-3.5 text-primary-600" />;
    };

    /* ---------- export ---------- */
    const handleExport = () => {
        if (onExport) {
            onExport(filtered);
            return;
        }
        const exportData = filtered.map((row) => {
            const obj: Record<string, any> = {};
            columns.forEach((col) => {
                obj[col.label] = row[col.key];
            });
            return obj;
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, `${exportFileName}.xlsx`);
    };

    /* ---------- render ---------- */
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1 w-full">
                    {/* Search */}
                    {searchKey && (
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    )}

                    {/* Date Range */}
                    {dateKey && (
                        <div className="flex gap-2 items-center">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                className="h-9 px-2 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-xs text-surface-400">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="h-9 px-2 rounded-lg border border-surface-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    )}
                </div>

                {/* Export */}
                <Button size="sm" variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                    Export
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-surface-100">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-50 border-b border-surface-100">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-surface-600 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:bg-surface-100 transition-colors' : ''}`}
                                    onClick={() => col.sortable && toggleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50">
                        {paged.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-surface-400 text-sm">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            paged.map((row, i) => (
                                <tr key={i} className="hover:bg-surface-50/50 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-surface-700 whitespace-nowrap">
                                            {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-surface-500">
                <span>
                    Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                        let pageNum: number;
                        if (totalPages <= 5) { pageNum = idx + 1; }
                        else if (safePage <= 3) { pageNum = idx + 1; }
                        else if (safePage >= totalPages - 2) { pageNum = totalPages - 4 + idx; }
                        else { pageNum = safePage - 2 + idx; }
                        return (
                            <button key={pageNum} onClick={() => setPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${safePage === pageNum ? 'bg-primary-600 text-white' : 'hover:bg-surface-100 text-surface-600'}`}>
                                {pageNum}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
