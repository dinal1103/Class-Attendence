import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, BarChart3, Loader2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { listVariants } from '@/lib/animations';
import api from '@/api/axios';

interface AdminStats {
    totalUsers: number;
    departments: number;
    activeClasses: number;
    overrides: number;
}

interface Department {
    _id: string;
    name: string;
    code: string;
}

interface ClassItem {
    _id: string;
    name: string;
    code: string;
    department_id?: { _id: string; name: string; code: string };
    faculty_id?: { name: string; email: string };
    students: string[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            api.get('/stats/admin').then(r => setStats(r.data)).catch(() => null),
            api.get('/departments').then(r => setDepartments(r.data)).catch(() => []),
            api.get('/classes/available').then(r => setClasses(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    }, []);

    const getClassesForDept = (deptId: string) => {
        return classes.filter(c => c.department_id?._id === deptId);
    };

    const toggleDept = (deptId: string) => {
        setExpandedDept(prev => prev === deptId ? null : deptId);
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">Admin Dashboard</h1>
                <p className="text-surface-500 text-sm mt-1">College overview — departments, classes, and users</p>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <>
                    {/* Stats Grid — no overrides */}
                    <motion.div variants={listVariants} initial="initial" animate="animate"
                        className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={<Users className="w-6 h-6" />}
                            iconBgColor="#EFF6FF" iconColor="#2563EB" />
                        <StatCard title="Departments" value={stats?.departments ?? 0} icon={<Building2 className="w-6 h-6" />}
                            iconBgColor="#F0FDF4" iconColor="#16A34A" />
                        <StatCard title="Active Classes" value={stats?.activeClasses ?? 0} icon={<BarChart3 className="w-6 h-6" />}
                            iconBgColor="#FFFBEB" iconColor="#D97706" />
                    </motion.div>

                    {/* Departments with nested classes */}
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">College Departments</h2>
                        {departments.length === 0 ? (
                            <EmptyState icon="clipboard" title="No departments" description="Create departments to organize your college." compact />
                        ) : (
                            <div className="space-y-3">
                                {departments.map(dept => {
                                    const deptClasses = getClassesForDept(dept._id);
                                    const isExpanded = expandedDept === dept._id;
                                    return (
                                        <Card key={dept._id}>
                                            <CardContent className="p-0">
                                                {/* Department header */}
                                                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                                                    onClick={() => toggleDept(dept._id)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-surface-900">{dept.name}</p>
                                                            <p className="text-xs text-surface-500">Code: {dept.code} · {deptClasses.length} classes</p>
                                                        </div>
                                                    </div>
                                                    {isExpanded
                                                        ? <ChevronDown className="w-5 h-5 text-surface-400" />
                                                        : <ChevronRight className="w-5 h-5 text-surface-400" />}
                                                </div>

                                                {/* Nested classes */}
                                                {isExpanded && (
                                                    <div className="border-t border-surface-100 px-4 pb-4">
                                                        {deptClasses.length === 0 ? (
                                                            <p className="text-xs text-surface-400 py-3">No classes in this department.</p>
                                                        ) : (
                                                            <div className="space-y-2 mt-3">
                                                                {deptClasses.map(cls => (
                                                                    <div key={cls._id} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-surface-200">
                                                                                <BookOpen className="w-4 h-4 text-primary-600" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-surface-900">{cls.name}</p>
                                                                                <p className="text-xs text-surface-500">Code: {cls.code}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-xs text-surface-500">Faculty: {cls.faculty_id?.name || 'Unassigned'}</p>
                                                                            <p className="text-xs text-surface-400">{cls.students?.length || 0} students</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
