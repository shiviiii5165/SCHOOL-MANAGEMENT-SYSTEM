import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Top Section - Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-6 h-[130px]">
            <div className="flex justify-between items-start">
              <div className="space-y-3 w-1/2">
                <div className="h-4 bg-border rounded w-full"></div>
                <div className="h-8 bg-border rounded w-2/3"></div>
              </div>
              <div className="w-12 h-12 bg-border rounded-xl"></div>
            </div>
            <div className="mt-4 h-3 bg-border rounded w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Chart Skeleton */}
          <div className="bg-surface p-6 rounded-xl border border-border h-[400px]">
            <div className="h-6 bg-border rounded w-1/4 mb-6"></div>
            <div className="h-[300px] bg-border/50 rounded-lg w-full"></div>
          </div>
        </div>
        <div className="lg:col-span-1">
          {/* List Skeleton */}
          <div className="bg-surface p-6 rounded-xl border border-border h-[400px]">
            <div className="h-6 bg-border rounded w-1/3 mb-6"></div>
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 bg-border rounded-full flex-shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-border rounded w-3/4"></div>
                    <div className="h-3 bg-border rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-surface p-6 rounded-xl border border-border h-[300px]">
            <div className="h-6 bg-border rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-16 bg-border/50 rounded-lg w-full"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
