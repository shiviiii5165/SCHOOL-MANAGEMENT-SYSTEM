'use client';

import { useChatStore } from '@/store/chatStore';
import { Bot, X, Send, Loader2, Sparkles, BookOpen, Calendar, CreditCard, ClipboardList, Bell, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

const QUICK_ACTIONS = [
  { label: '📊 My Attendance', message: 'What is my attendance summary?' },
  { label: '💰 My Fees', message: 'What are my pending fees?' },
  { label: '📝 Assignments', message: 'Show my pending assignments' },
  { label: '📅 Timetable', message: 'Show my timetable for this week' },
  { label: '🏆 Exam Results', message: 'Show my exam results' },
  { label: '📢 Notices', message: 'Are there any current notices?' },
];

const TOOL_DISPLAY_NAMES: Record<string, { label: string; icon: string }> = {
  get_attendance_summary: { label: 'Attendance Summary', icon: '📊' },
  get_attendance_history: { label: 'Attendance History', icon: '📋' },
  get_fees: { label: 'Fee Dashboard', icon: '💰' },
  get_pending_fees: { label: 'Pending Fees', icon: '💳' },
  get_upcoming_exams: { label: 'Upcoming Exams', icon: '📅' },
  get_exam_results: { label: 'Exam Results', icon: '🏆' },
  get_notices: { label: 'Notices', icon: '📢' },
  get_timetable: { label: 'Timetable', icon: '🗓️' },
  get_pending_assignments: { label: 'Assignments', icon: '📝' },
};

export const ChatWidget = () => {
  const { isOpen, toggleChat } = useChatStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = { id: Date.now().toString(), role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let aiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', toolInvocations: [] as any[] };
      setMessages([...newMessages, aiMessage]);
      let isProtocolStream = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!aiMessage.content && aiMessage.toolInvocations.length === 0) {
              aiMessage.content = "⚠️ The AI service is currently unavailable. Please try again later.";
              setMessages([...newMessages, { ...aiMessage }]);
            }
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          
          if (!isProtocolStream && chunk.includes('data: {"type":')) {
            isProtocolStream = true;
          }

          if (isProtocolStream) {
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              if (line.trim() === 'data: [DONE]') continue;
              try {
                const event = JSON.parse(line.substring(6));
                if (event.type === 'text-delta') {
                  aiMessage.content += event.delta;
                } else if (event.type === 'tool-call' || event.type === 'tool-input-start') {
                  const existing = aiMessage.toolInvocations.find((t: any) => t.toolCallId === event.toolCallId);
                  if (!existing) {
                    aiMessage.toolInvocations.push({
                      state: 'call',
                      toolCallId: event.toolCallId,
                      toolName: event.toolName,
                      args: event.args || {}
                    });
                  }
                } else if (event.type === 'tool-result' || event.type === 'tool-output-available') {
                  const invocation = aiMessage.toolInvocations.find((t: any) => t.toolCallId === event.toolCallId);
                  if (invocation) {
                    invocation.state = 'result';
                    invocation.result = event.result || event.output;
                  }
                }
              } catch (err) {
                // Ignore parse errors for incomplete chunks
              }
            }
          } else {
            aiMessage.content += chunk;
          }
          
          setMessages([...newMessages, { ...aiMessage }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(input);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Deduplicate tool invocations for display
  const getUniqueTools = (toolInvocations: any[]) => {
    const seen = new Set();
    return toolInvocations.filter((t: any) => {
      const key = t.toolCallId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div
          className="mb-4 w-[380px] h-[560px] rounded-3xl flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.08)',
          }}
        >
          {/* Header with Gradient */}
          <div
            className="p-4 flex justify-between items-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}>
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px] leading-tight tracking-tight">EduCore AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-300 animate-pulse' : 'bg-emerald-300'}`} />
                  <p className="text-[11px] text-white/80 font-medium">
                    {isLoading ? 'Thinking...' : 'Online'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="relative z-10 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-2">
                {/* Welcome Section */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.1)',
                }}>
                  <Sparkles size={28} className="text-blue-500" />
                </div>
                <h4 className="text-gray-800 font-semibold text-base mb-1">Hi there! 👋</h4>
                <p className="text-gray-500 text-xs text-center mb-5 leading-relaxed">
                  I can help with attendance, fees, exams,<br/>assignments, timetable & notices.
                </p>
                
                {/* Quick Action Grid */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.message)}
                      className="text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        color: '#4b5563',
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 ${
                    m.role === 'user' 
                      ? 'rounded-2xl rounded-br-md text-white text-sm' 
                      : 'rounded-2xl rounded-bl-md text-gray-700 text-sm'
                  }`} style={
                    m.role === 'user'
                      ? { background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }
                      : { background: '#f1f5f9', border: '1px solid #e2e8f0' }
                  }>
                    {/* Typing indicator */}
                    {m.role === 'assistant' && !m.content && (!m.toolInvocations || m.toolInvocations.length === 0) && (
                      <div className="flex gap-1.5 items-center h-5 py-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    
                    {/* Message content */}
                    {m.content && (
                      <div className="prose prose-sm break-words max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Tool invocations - clean pills */}
                    {m.toolInvocations && getUniqueTools(m.toolInvocations).map((toolInvocation: any) => {
                      const toolInfo = TOOL_DISPLAY_NAMES[toolInvocation.toolName] || { label: toolInvocation.toolName, icon: '🔧' };
                      return (
                        <div
                          key={toolInvocation.toolCallId}
                          className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{
                            background: toolInvocation.state === 'result'
                              ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
                              : 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
                            border: toolInvocation.state === 'result'
                              ? '1px solid rgba(16, 185, 129, 0.2)'
                              : '1px solid rgba(59, 130, 246, 0.2)',
                            color: toolInvocation.state === 'result' ? '#059669' : '#3b82f6',
                          }}
                        >
                          {toolInvocation.state === 'result' ? (
                            <>
                              <span>{toolInfo.icon}</span>
                              <span>✓ {toolInfo.label}</span>
                            </>
                          ) : (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Fetching {toolInfo.label}...</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 border-t" style={{ borderColor: '#e8edf5', background: '#fafbff' }}>
            <div className="flex relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-white rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none transition-all duration-200"
                style={{
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#818cf8';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: (!isLoading && input.trim())
                    ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                    : '#cbd5e1',
                }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ml-auto"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
          boxShadow: isOpen
            ? '0 8px 25px -4px rgba(239, 68, 68, 0.5)'
            : '0 8px 25px -4px rgba(99, 102, 241, 0.5)',
        }}
      >
        {isOpen ? (
          <X size={22} className="text-white" />
        ) : (
          <Sparkles size={22} className="text-white" />
        )}
      </button>
    </div>
  );
};
