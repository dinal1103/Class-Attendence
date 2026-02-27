/**
 * App.tsx — Root component with role-based routing.
 */
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

// Layout
import AppLayout from '@/layout/AppLayout';
import PrivateRoute from './PrivateRoute';

// Auth
import LoginPage from '@/auth/LoginPage';
import RegisterPage from '@/auth/RegisterPage';

// Student
import StudentDashboard from '@/modules/student/StudentDashboard';
import StudentClasses from '@/modules/student/StudentClasses';
import StudentAttendance from '@/modules/student/StudentAttendance';
import StudentFaceEnroll from '@/modules/student/StudentFaceEnroll';
import StudentDisputes from '@/modules/student/StudentDisputes';
import StudentClassDetail from '@/modules/student/StudentClassDetail';

// Faculty
import FacultyDashboard from '@/modules/faculty/FacultyDashboard';
import FacultyClasses from '@/modules/faculty/FacultyClasses';
import FacultyAttendance from '@/modules/faculty/FacultyAttendance';
import FacultyDisputes from '@/modules/faculty/FacultyDisputes';
import FacultyClassDetail from '@/modules/faculty/FacultyClassDetail';

// Admin
import AdminDashboard from '@/modules/admin/AdminDashboard';
import AdminEnrollments from '@/modules/admin/AdminEnrollments';
import AdminOverrides from '@/modules/admin/AdminOverrides';
import AdminReports from '@/modules/admin/AdminReports';

// HOD
import HodDashboard from '@/modules/hod/HodDashboard';
import HodApprovals from '@/modules/hod/HodApprovals';
import HodAuditLogs from '@/modules/hod/HodAuditLogs';
import HodOverrides from '@/modules/hod/HodOverrides';

export default function App() {
    const initialize = useAuthStore((s) => s.initialize);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Student Routes */}
            <Route element={<PrivateRoute allowedRoles={['student']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/student" element={<StudentDashboard />} />
                    <Route path="/student/classes" element={<StudentClasses />} />
                    <Route path="/student/classes/:id" element={<StudentClassDetail />} />
                    <Route path="/student/attendance" element={<StudentAttendance />} />
                    <Route path="/student/face-enroll" element={<StudentFaceEnroll />} />
                    <Route path="/student/disputes" element={<StudentDisputes />} />
                </Route>
            </Route>

            {/* Faculty Routes */}
            <Route element={<PrivateRoute allowedRoles={['faculty']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/faculty" element={<FacultyDashboard />} />
                    <Route path="/faculty/classes" element={<FacultyClasses />} />
                    <Route path="/faculty/classes/:id" element={<FacultyClassDetail />} />
                    <Route path="/faculty/attendance" element={<FacultyAttendance />} />
                    <Route path="/faculty/disputes" element={<FacultyDisputes />} />
                </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/enrollments" element={<AdminEnrollments />} />
                    <Route path="/admin/overrides" element={<AdminOverrides />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                </Route>
            </Route>

            {/* HOD Routes */}
            <Route element={<PrivateRoute allowedRoles={['hod']} />}>
                <Route element={<AppLayout />}>
                    <Route path="/hod" element={<HodDashboard />} />
                    <Route path="/hod/approvals" element={<HodApprovals />} />
                    <Route path="/hod/audit" element={<HodAuditLogs />} />
                    <Route path="/hod/overrides" element={<HodOverrides />} />
                </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-surface-300 mb-4">403</h1>
                <p className="text-lg text-surface-600 mb-6">Access Denied</p>
                <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm underline">
                    Return to Login
                </a>
            </div>
        </div>
    );
}
