"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { getNavItems } from "@/lib/navItems";

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

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} prefetch={true} className="flex-1">
              <div className="flex flex-col items-center justify-center h-full space-y-1 w-full min-h-[44px]">
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted"}`} />
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
