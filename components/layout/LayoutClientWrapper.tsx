"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";

export default function LayoutClientWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: string; avatar?: string };
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isMessagesPage = pathname.includes('/messages');

  // Bottom nav is used for Teacher, Student, Parent on mobile
  const hasBottomNav = user.role !== "ADMIN";

  const mainHeightClass = isMessagesPage
    ? (hasBottomNav ? 'h-[calc(100dvh-128px)] md:h-[calc(100dvh-64px)]' : 'h-[calc(100dvh-64px)]')
    : '';

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <div className={`bg-background flex w-full relative overflow-x-hidden ${isMessagesPage ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}>
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar 
        user={user} 
        isOpenMobile={isMobileDrawerOpen} 
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out w-full ${isMessagesPage ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'}`}
        style={{
          marginLeft: 0,
          paddingBottom: hasBottomNav ? 'calc(4rem + env(safe-area-inset-bottom, 0px))' : undefined,
        }}
      >
        {/* Push content right on md+ screens based on sidebar width */}
        <style>{`@media (min-width: 768px) { .layout-main-shift { margin-left: ${sidebarWidth}px !important; } }`}</style>
        <div className="layout-main-shift flex-1 flex flex-col transition-all duration-300 ease-in-out">
          <Topbar 
            user={user} 
            onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)} 
          />
          <main className={`flex-1 w-full mx-auto max-w-content overflow-x-hidden flex flex-col ${isMessagesPage ? `p-0 ${mainHeightClass}` : 'p-3 xs:p-4 sm:p-6'}`}>
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navigation for Non-Admins on Mobile */}
      {hasBottomNav && <BottomNav user={user} onOpenMore={() => setIsMobileDrawerOpen(true)} />}
    </div>
  );
}

