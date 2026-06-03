"use client";

import { Bell, Search, Menu } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

const getPageTitle = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return "Dashboard";
  
  const lastPart = parts[parts.length - 1];
  return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
};

export default function Topbar({ 
  user, 
  onOpenMobileDrawer 
}: { 
  user: { name: string; role: string; avatar?: string };
  onOpenMobileDrawer?: () => void;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3">
        {onOpenMobileDrawer && (
          <button 
            onClick={onOpenMobileDrawer}
            className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-display font-bold text-text-primary truncate max-w-[150px] sm:max-w-xs">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <NotificationBell role={user.role} />

          <div className="h-8 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-text-primary leading-tight">{user.name}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm mt-0.5 ${
                user.role === 'ADMIN' ? 'bg-role-admin text-white' :
                user.role === 'TEACHER' ? 'bg-role-teacher text-white' :
                user.role === 'STUDENT' ? 'bg-role-student text-white' :
                'bg-role-parent text-white'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-border flex items-center justify-center overflow-hidden border-2 border-surface shadow-sm relative shrink-0">
              {user.avatar ? (
                <Image src={user.avatar} alt="Avatar" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="font-bold text-text-secondary text-sm sm:text-base">{user.name.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
