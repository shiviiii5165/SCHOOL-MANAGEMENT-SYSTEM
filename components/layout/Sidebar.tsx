"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { getNavItems } from "@/lib/navItems";

export default function Sidebar({ 
  user, 
  isOpenMobile, 
  onCloseMobile 
}: { 
  user: { name: string; role: string; avatar?: string };
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const navItems = getNavItems(user.role);

  const roleColors: Record<string, string> = {
    ADMIN: "bg-role-admin",
    TEACHER: "bg-role-teacher",
    STUDENT: "bg-role-student",
    PARENT: "bg-role-parent",
  };

  // Close mobile drawer on route change
  useEffect(() => {
    if (isOpenMobile && onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // For non-admins, the sidebar is only used as a "More" drawer on mobile, 
  // or normally on desktop. Actually, let's keep desktop behavior 100% same.
  const hasBottomNav = user.role !== "ADMIN";
  const desktopClasses = hasBottomNav ? "hidden md:flex" : "hidden md:flex";

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="bg-primary p-2 rounded-lg flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="font-display font-bold text-lg text-text-primary">EduCore</span>}
        </div>
        {/* Mobile Close Button */}
        {isOpenMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-2 text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {user.avatar ? (
              <Image src={user.avatar} alt="Avatar" fill sizes="40px" className="object-cover" />
            ) : (
              <span className="font-semibold text-text-secondary">{user.name.charAt(0)}</span>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary truncate">{user.name}</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${roleColors[user.role]}`} />
                <span className="text-xs text-text-muted capitalize">{user.role.toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} prefetch={true}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden whitespace-nowrap ${
                  isActive
                    ? "bg-primary-light text-primary font-medium"
                    : "text-text-secondary hover:bg-background hover:text-text-primary"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                  />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary"}`} />
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {item.alert && !collapsed && (
                  <div className="w-2 h-2 rounded-full bg-status-warning mr-1" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-border flex flex-col gap-2 shrink-0 pb-[env(safe-area-inset-bottom,16px)]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-status-danger hover:bg-status-danger-bg transition-all whitespace-nowrap overflow-hidden`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle Sidebar"
          className="items-center justify-center h-10 w-full rounded-lg hover:bg-background text-text-muted transition-colors hidden md:flex"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ width: 240 }}
        animate={{ width: collapsed ? 72 : 240 }}
        className={`h-[100dvh] bg-surface border-r border-border flex-col fixed left-0 top-0 z-40 hidden md:flex`}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpenMobile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="h-[100dvh] w-64 bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-50 md:hidden overflow-hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
