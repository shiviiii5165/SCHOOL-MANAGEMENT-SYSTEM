export function SkeletonMessage({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        animate-pulse h-10 rounded-2xl
        ${isOwn ? 'bg-blue-100 rounded-br-sm w-[60%]' : 'bg-gray-200 rounded-bl-sm w-[40%]'}
      `} />
    </div>
  )
}
