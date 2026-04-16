/**
 * BottomNav — Mobile bottom tab bar navigation.
 * Renders based on user role with large, touch-friendly tabs.
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarCheck, Camera, AlertCircle, Users, BarChart3, ClipboardList, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore, { type UserRole } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

interface TabItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

const tabsByRole: Record<UserRole, TabItem[]> = {
    student: [
        { label: 'Home', path: ROUTES.STUDENT.DASHBOARD, icon: LayoutDashboard },
        { label: 'Classes', path: ROUTES.STUDENT.CLASSES, icon: BookOpen },
        { label: 'Enroll', path: ROUTES.STUDENT.FACE_ENROLL, icon: Camera },
        { label: 'Attend', path: ROUTES.STUDENT.ATTENDANCE, icon: CalendarCheck },
        { label: 'Disputes', path: ROUTES.STUDENT.DISPUTES, icon: AlertCircle },
    ],
    faculty: [
        { label: 'Home', path: ROUTES.FACULTY.DASHBOARD, icon: LayoutDashboard },
        { label: 'Classes', path: ROUTES.FACULTY.CLASSES, icon: BookOpen },
        { label: 'Attend', path: ROUTES.FACULTY.ATTENDANCE, icon: CalendarCheck },
        { label: 'Disputes', path: ROUTES.FACULTY.DISPUTES, icon: AlertCircle },
    ],
    admin: [
        { label: 'Home', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
        { label: 'Staff', path: ROUTES.ADMIN.STAFF, icon: Shield },
        { label: 'Reports', path: ROUTES.ADMIN.REPORTS, icon: BarChart3 },
    ],
    hod: [
        { label: 'Home', path: ROUTES.HOD.DASHBOARD, icon: LayoutDashboard },
        { label: 'Approve', path: ROUTES.HOD.APPROVALS, icon: ClipboardList },
        { label: 'Audit', path: ROUTES.HOD.AUDIT, icon: Shield },
    ],
};

export function BottomNav() {
    const { user } = useAuthStore();
    const role = user?.role || 'student';
    const tabs = tabsByRole[role];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-surface-100 lg:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        end={tab.label === 'Home'}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors',
                                isActive ? 'text-primary-600' : 'text-surface-400'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <tab.icon className={cn('w-5 h-5', isActive && 'text-primary-600')} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-0.5 rounded-b-full bg-primary-600" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
