"use client";

import { useState } from "react";
import { Bell, Search, Calendar, Pin, AlertCircle, ChevronRight } from "lucide-react";

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: "General" | "Academic" | "Event" | "Urgent";
  date: string;
  isPinned?: boolean;
  isNew?: boolean;
}

interface NoticeBoardProps {
  notices: Notice[];
  isAdmin?: boolean;
}

const categoryColors = {
  General: "bg-status-info-bg text-status-info-text border-status-info/20",
  Academic: "bg-primary-light text-primary border-primary/20",
  Event: "bg-status-success-bg text-status-success-text border-status-success/20",
  Urgent: "bg-status-danger-bg text-status-danger-text border-status-danger/20",
};

export default function NoticeBoard({ notices, isAdmin = false }: NoticeBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "General", "Academic", "Event", "Urgent"];

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || notice.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotices = filteredNotices.filter(n => n.isPinned);
  const regularNotices = filteredNotices.filter(n => !n.isPinned);

  const displayNotices = [...pinnedNotices, ...regularNotices];

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-background"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "bg-text-primary text-white"
                  : "bg-background text-text-secondary hover:bg-border/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {displayNotices.map((notice) => (
            <div 
              key={notice.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md group ${
                notice.isPinned 
                  ? "bg-status-warning-bg/30 border-status-warning/20" 
                  : notice.isNew 
                    ? "bg-primary-light/20 border-primary/20"
                    : "bg-surface border-transparent hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-status-warning-text bg-status-warning-bg px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  {notice.isNew && !notice.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2 py-0.5 rounded">
                      New
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${categoryColors[notice.category]}`}>
                    {notice.category}
                  </span>
                </div>
                <span className="text-xs text-text-muted flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-3 h-3" />
                  {new Date(notice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              
              <h4 className="text-sm font-semibold text-text-primary mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                {notice.title}
              </h4>
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                {notice.content}
              </p>
              
              {isAdmin && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs font-medium text-text-muted hover:text-primary transition-colors">Edit</button>
                  <button className="text-xs font-medium text-text-muted hover:text-status-danger-text transition-colors">Delete</button>
                </div>
              )}
            </div>
          ))}
          
          {displayNotices.length === 0 && (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-border-strong mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">No notices found</p>
              <p className="text-xs text-text-muted mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
