export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface p-6 rounded-xl shadow-card border border-border animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-24 bg-border rounded mb-2"></div>
              <div className="h-8 w-16 bg-border rounded"></div>
            </div>
            <div className="w-12 h-12 rounded-full bg-border"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-4 bg-border rounded-full"></div>
            <div className="h-3 w-32 bg-border rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border h-full animate-pulse">
      <div className="h-6 w-32 bg-border rounded mb-6"></div>
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-border shrink-0 mt-1"></div>
            <div className="w-full">
              <div className="h-4 w-3/4 bg-border rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-border rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-border rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisciplineCenterSkeleton() {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border animate-pulse">
      <div className="h-6 w-40 bg-border rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-border"></div>
              <div>
                <div className="h-4 w-24 bg-border rounded mb-2"></div>
                <div className="h-4 w-16 bg-border rounded"></div>
              </div>
            </div>
            <div className="h-3 w-12 bg-border rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeeDefaultersSkeleton() {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border animate-pulse">
      <div className="h-6 w-32 bg-border rounded mb-4"></div>
      <div className="space-y-4 mt-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="h-4 w-28 bg-border rounded mb-1"></div>
              <div className="h-3 w-16 bg-border rounded"></div>
            </div>
            <div className="h-4 w-20 bg-border rounded"></div>
            <div className="h-4 w-16 bg-border rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
