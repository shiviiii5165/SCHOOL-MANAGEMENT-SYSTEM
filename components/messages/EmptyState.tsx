import { MessageSquarePlus } from "lucide-react"

export function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl" />
        <MessageSquarePlus className="w-10 h-10 text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold font-display text-slate-800 mb-2 tracking-tight">Your Messages</h3>
      <p className="text-[15px] text-slate-500 mb-8 max-w-sm leading-relaxed">
        Send a direct message to start a conversation, or select an existing chat from the sidebar.
      </p>
      <button 
        onClick={onNew}
        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[15px] font-semibold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
      >
        Start New Chat
      </button>
    </div>
  )
}
