/**
 * AppLayout — Responsive layout wrapper.
 * Desktop: Sidebar + Topbar
 * Mobile: MobileHeader + BottomNav
 */
import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { routeTransitionVariants } from '@/lib/animations';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';

export default function AppLayout() {
    const location = useLocation();
    const isDesktop = useIsDesktop();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-surface-50">
            {/* Desktop: Sidebar + Topbar */}
            {isDesktop ? (
                <>
                    <Sidebar
                        isCollapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                        mobileOpen={false}
                        onMobileClose={() => { }}
                    />
                    <div
                        className={cn(
                            'transition-all duration-300 ease-in-out',
                            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
                        )}
                    >
                        <Topbar onMenuClick={() => { }} />
                        <main className="p-6 lg:p-8 min-h-[calc(100vh-64px)]">
                            <div className="max-w-[1400px] mx-auto">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={location.pathname}
                                        variants={routeTransitionVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                        className="w-full"
                                    >
                                        <Outlet />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </main>
                    </div>
                </>
            ) : (
                /* Mobile: MobileHeader + BottomNav */
                <>
                    <Sidebar
                        isCollapsed={false}
                        onToggleCollapse={() => { }}
                        mobileOpen={mobileSidebarOpen}
                        onMobileClose={() => setMobileSidebarOpen(false)}
                    />
                    <MobileHeader />
                    <main className="p-4 pb-20 min-h-[calc(100vh-56px-64px)]">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={location.pathname}
                                variants={routeTransitionVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <BottomNav />
                </>
            )}
        </div>
    );
}
