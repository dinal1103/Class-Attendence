/**
 * MobileHeader — Compact sticky header for mobile views.
 */
import { Link } from 'react-router-dom';
import { Bell, LogOut, Key } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { getInitials } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export function MobileHeader() {
    const { user, logout } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-surface-100 lg:hidden">
            <div className="flex items-center justify-between h-14 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 shadow-inner">
                        {getInitials(user?.name || 'U')}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-900 leading-tight truncate">{user?.name?.split(' ')[0]}</p>
                        <p className="text-[10px] text-surface-500 capitalize">{user?.role}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Link 
                        to={ROUTES.CHANGE_PASSWORD}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors"
                        title="Change Password"
                    >
                        <Key className="w-4 h-4" />
                    </Link>
                    <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100">
                        <Bell className="w-4.5 h-4.5" />
                    </button>
                    <button
                        onClick={logout}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100"
                    >
                        <LogOut className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
