/**
 * PrivateRoute — Protects routes by role.
 */
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore, { type UserRole } from '@/store/authStore';

interface PrivateRouteProps {
    allowedRoles: UserRole[];
    children?: ReactNode;
}

export default function PrivateRoute({ allowedRoles, children }: PrivateRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
