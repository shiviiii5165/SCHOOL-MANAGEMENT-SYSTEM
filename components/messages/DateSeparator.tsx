export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex justify-center my-6">
      <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
        {date}
      </span>
    </div>
  )
}
