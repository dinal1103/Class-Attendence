import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Shield, Users, FileCheck, Loader2, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { StatCard } from '@/components/composite/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/primitives/Card';
import { EmptyState } from '@/components/composite/EmptyState';
import { CircularProgress } from '@/components/primitives/CircularProgress';
import { listVariants } from '@/lib/animations';
import api from '@/api/axios';

interface WeeklyData {
    date: string;
    day: string;
    present: number;
    absent: number;
    total: number;
}

interface ClassAttendance {
    classId: string;
    className: string;
    classCode: string;
    totalSessions: number;
    rate: number;
}

export default function HodDashboard() {
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [classAttendance, setClassAttendance] = useState<ClassAttendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/stats/hod/weekly').then(r => setWeeklyData(r.data)).catch(() => []),
            api.get('/stats/class-attendance').then(r => setClassAttendance(r.data)).catch(() => [])
        ]).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-surface-900">HOD Dashboard</h1>
                <p className="text-surface-500 text-sm mt-1">Departmental oversight and attendance analytics</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <motion.div variants={listVariants} initial="initial" animate="animate"
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard title="Total Classes" value={classAttendance.length} icon={<ClipboardList className="w-6 h-6" />}
                            iconBgColor="#FFFBEB" iconColor="#D97706" />
                        <StatCard title="Avg Attendance"
                            value={classAttendance.length > 0
                                ? `${Math.round(classAttendance.reduce((sum, c) => sum + c.rate, 0) / classAttendance.length)}%`
                                : '0%'}
                            icon={<Shield className="w-6 h-6" />}
                            iconBgColor="#EFF6FF" iconColor="#2563EB" />
                        <StatCard title="This Week Present"
                            value={weeklyData.reduce((sum, d) => sum + d.present, 0)}
                            icon={<Users className="w-6 h-6" />}
                            iconBgColor="#F0FDF4" iconColor="#16A34A" />
                        <StatCard title="This Week Absent"
                            value={weeklyData.reduce((sum, d) => sum + d.absent, 0)}
                            icon={<FileCheck className="w-6 h-6" />}
                            iconBgColor="#FEF2F2" iconColor="#DC2626" />
                    </motion.div>

                    {/* Weekly Attendance Bar Chart */}
                    <Card>
                        <CardHeader><CardTitle>Weekly Department Attendance</CardTitle></CardHeader>
                        <CardContent>
                            {weeklyData.length === 0 || weeklyData.every(d => d.total === 0) ? (
                                <EmptyState icon="calendar" title="No attendance data" description="Attendance data for this week will appear here once sessions are completed." compact />
                            ) : (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyData} barGap={4}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    fontSize: '13px',
                                                }}
                                                cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                                            <Bar dataKey="present" name="Present" fill="#10B981" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Classes with Attendance % */}
                    <div>
                        <h2 className="text-lg font-bold text-surface-900 mb-4">Department Classes</h2>
                        {classAttendance.length === 0 ? (
                            <EmptyState icon="clipboard" title="No classes" description="Classes in your department will appear here." compact />
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {classAttendance.map(ca => (
                                    <Card key={ca.classId}>
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                                            <BookOpen className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-surface-900 truncate">{ca.className}</p>
                                                            <p className="text-xs text-surface-500">{ca.classCode}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-surface-400">{ca.totalSessions} sessions</p>
                                                </div>
                                                <CircularProgress value={ca.rate} size={44} strokeWidth={4} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
