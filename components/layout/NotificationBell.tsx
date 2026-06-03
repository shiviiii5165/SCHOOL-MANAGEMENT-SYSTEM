"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { io } from "socket.io-client";
import { Bell, AlertTriangle, Calendar, CreditCard, BookOpen, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function useNotifications() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 30000,  // poll every 30s as fallback
  });

  useEffect(() => {
    // Only init socket if URL is configured
    if (!process.env.NEXT_PUBLIC_SOCKET_URL) return;
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      transports: ["websocket", "polling"]
    });
    
    socket.on('notification:new', () => mutate());
    
    return () => {
      socket.off('notification:new');
      socket.disconnect();
    };
  }, [mutate]);

  return { 
    notifications: data?.notifications ?? [], 
    unreadCount: data?.unreadCount ?? 0, 
    mutate 
  };
}

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationBell({ role }: { role: string }) {
  const { notifications, unreadCount, mutate } = useNotifications();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const TYPE_ICONS: Record<string, { icon: any, color: string }> = {
    DISCIPLINE: { icon: AlertTriangle, color: 'text-danger'  },
    ATTENDANCE: { icon: Calendar,      color: 'text-primary' },
    FEE:        { icon: CreditCard,    color: 'text-success' },
    ACADEMIC:   { icon: BookOpen,      color: 'text-violet-600' },
    SYSTEM:     { icon: Settings,      color: 'text-text-muted' },
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    mutate();
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    mutate();
  };

  const rolePrefix = role.toLowerCase();

  return (
    <div className="relative">
      <button 
        aria-label="Notifications"
        onClick={() => { setOpen(!open); if (!open) markAllRead() }}
        className="relative p-2.5 text-text-secondary hover:bg-surface-hover rounded-xl transition-all hover:text-text-primary"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-status-danger text-white text-[10px] font-bold flex items-center justify-center px-0.5 border-2 border-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-96 bg-surface border-t sm:border border-border sm:rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <span className="text-sm font-semibold text-text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-2 bg-status-danger text-white rounded px-1.5 py-0.5 text-[10px] font-bold">{unreadCount} new</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
              <button onClick={() => setOpen(false)} className="sm:hidden text-text-muted">
                ✕
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 sm:max-h-[420px] overflow-y-auto divide-y divide-border/50 pb-20 sm:pb-0">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={32} className="text-border mx-auto mb-2"/>
                <p className="text-sm text-text-muted">No notifications yet</p>
              </div>
            ) : notifications.map((n: any) => {
              const typeConfig = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM;
              const Icon = typeConfig.icon;
              
              return (
                <div key={n.id}
                  onClick={() => { markRead(n.id); setOpen(false); if(n.link) router.push(n.link); }}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors",
                    !n.isRead && "bg-primary-light/10"
                  )}>
                  {/* Icon circle */}
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    !n.isRead ? "bg-primary-light/50" : "bg-slate-100")}>
                    <Icon size={14} className={typeConfig.color}/>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm text-text-primary truncate",
                      !n.isRead && "font-semibold")}>{n.title}</p>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-xs text-text-muted mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {/* Unread dot */}
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"/>}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border text-center bg-background shrink-0 pb-[env(safe-area-inset-bottom)]">
            <Link onClick={() => setOpen(false)} href={`/${rolePrefix}/notifications`} className="text-xs text-primary font-medium hover:underline inline-block w-full py-2">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
