/**
 * Topbar — Desktop top navigation bar.
 */
import { Menu, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import useAuthStore from '@/store/authStore';
import { getInitials } from '@/lib/utils';

interface TopbarProps {
    onMenuClick: () => void;
    notificationCount?: number;
}

export function Topbar({ onMenuClick, notificationCount = 0 }: TopbarProps) {
    const { user, logout } = useAuthStore();

    return (
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-2xl border-b border-surface-100 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Left: Mobile hamburger */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-sm font-semibold text-surface-900">
                            {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)} Panel
                        </h2>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-100 transition-colors">
                        <Bell className="w-5 h-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {notificationCount}
                            </span>
                        )}
                    </button>

                    {/* Profile */}
                    <div className="flex items-center gap-3 ml-2 pl-3 border-l border-surface-200">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {getInitials(user?.name || 'U')}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name}</p>
                            <p className="text-xs text-surface-500 capitalize">{user?.role}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
