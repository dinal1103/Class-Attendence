/**
 * Sidebar — Desktop left-side navigation.
 * Collapsible between icon-only (72px) and full (260px) modes.
 */
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    CalendarCheck,
    Camera,
    AlertCircle,
    Users,
    FileCheck,
    BarChart3,
    Shield,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuthStore, { type UserRole } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
}

const navByRole: Record<UserRole, NavItem[]> = {
    student: [
        { label: 'Dashboard', path: ROUTES.STUDENT.DASHBOARD, icon: LayoutDashboard },
        { label: 'My Classes', path: ROUTES.STUDENT.CLASSES, icon: BookOpen },
        { label: 'Attendance', path: ROUTES.STUDENT.ATTENDANCE, icon: CalendarCheck },
        { label: 'Face Enroll', path: ROUTES.STUDENT.FACE_ENROLL, icon: Camera },
        { label: 'Disputes', path: ROUTES.STUDENT.DISPUTES, icon: AlertCircle },
    ],
    faculty: [
        { label: 'Dashboard', path: ROUTES.FACULTY.DASHBOARD, icon: LayoutDashboard },
        { label: 'My Classes', path: ROUTES.FACULTY.CLASSES, icon: BookOpen },
        { label: 'Attendance', path: ROUTES.FACULTY.ATTENDANCE, icon: CalendarCheck },
        { label: 'Disputes', path: ROUTES.FACULTY.DISPUTES, icon: AlertCircle },
    ],
    admin: [
        { label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD, icon: LayoutDashboard },
        { label: 'Staff Management', path: ROUTES.ADMIN.STAFF, icon: Shield },
        { label: 'Audit Logs', path: ROUTES.ADMIN.AUDIT, icon: ClipboardList },
    ],
    hod: [
        { label: 'Dashboard', path: ROUTES.HOD.DASHBOARD, icon: LayoutDashboard },
        { label: 'Audit Logs', path: ROUTES.HOD.AUDIT, icon: Shield },
    ],
};

export function Sidebar({ isCollapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    const { user } = useAuthStore();
    const location = useLocation();
    const role = user?.role || 'student';
    const items = navByRole[role];

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100 flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-bold text-surface-900 text-sm whitespace-nowrap overflow-hidden"
                        >
                            Smart Attendance
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto relative">
                {items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onMobileClose}
                            className={cn(
                                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors z-10',
                                isActive
                                    ? 'text-primary-700'
                                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebarActiveIndicator"
                                    className="absolute inset-0 bg-primary-50 rounded-lg -z-10"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                />
                            )}
                            <item.icon className={cn('w-5 h-5 flex-shrink-0 relative z-10 transition-colors duration-300', isActive && 'text-primary-600')} />
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="whitespace-nowrap overflow-hidden relative z-10"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Collapse Toggle (desktop only) */}
            <div className="hidden lg:flex items-center justify-center py-3 border-t border-surface-100">
                <button
                    onClick={onToggleCollapse}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Change Password Link */}
            <div className="px-3 pb-4">
                <NavLink
                    to={ROUTES.CHANGE_PASSWORD}
                    onClick={onMobileClose}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === ROUTES.CHANGE_PASSWORD
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                    )}
                >
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Change Password</span>}
                </NavLink>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col bg-white border-r border-surface-100 z-40 transition-all duration-300',
                    isCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
                )}
            >
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={onMobileClose}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 lg:hidden shadow-xl"
                        >
                            <button
                                onClick={onMobileClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
