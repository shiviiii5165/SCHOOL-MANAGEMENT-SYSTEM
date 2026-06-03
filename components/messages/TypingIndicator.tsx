import { motion } from 'framer-motion'

export function TypingIndicator({ users }: { users: string[] }) {
  if (!users || users.length === 0) return null
  
  const text = users.length === 1 
    ? "Someone is typing..." 
    : `${users.length} people are typing...`

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 w-fit">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-400">{text}</span>
    </div>
  )
}
