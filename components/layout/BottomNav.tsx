"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { getNavItems } from "@/lib/navItems";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BottomNav({ 
  user,
  onOpenMore
}: { 
  user: { name: string; role: string; avatar?: string };
  onOpenMore: () => void;
}) {
  const pathname = usePathname();
  const allNavItems = getNavItems(user.role);
  
  // Take up to 4 primary items for the bottom nav
  const primaryItems = allNavItems.slice(0, 4);
  const hasMore = allNavItems.length > 4;

  // Poll nav badges
  const { data: badgeData } = useSWR('/api/nav-badges', fetcher, {
    refreshInterval: 15000,
  });
  const badges = badgeData?.badges || {};

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const badgeCount = badges[item.href] || 0;
          
          return (
            <Link key={item.href} href={item.href} prefetch={true} className="flex-1">
              <div className="flex flex-col items-center justify-center h-full space-y-1 w-full min-h-[44px] relative">
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted"}`} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-status-danger text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-primary" : "text-text-muted"}`}>
                  {item.label.split(' ')[0]} {/* Use first word for compactness */}
                </span>
              </div>
            </Link>
          );
        })}
        
        {hasMore && (
          <button 
            onClick={onOpenMore}
            className="flex-1 flex flex-col items-center justify-center h-full space-y-1 w-full min-h-[44px]"
          >
            <Menu className="w-5 h-5 text-text-muted" />
            <span className="text-[10px] font-medium leading-none text-text-muted">
              More
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
