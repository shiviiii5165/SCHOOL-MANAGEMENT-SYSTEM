export function SkeletonConvItem() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 w-full border-b border-gray-50">
      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
        <div className="w-48 h-3 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="w-10 h-3 bg-gray-200 animate-pulse rounded" />
    </div>
  )
}
