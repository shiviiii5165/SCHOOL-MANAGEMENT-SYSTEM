'use client';

import { useChat } from '@ai-sdk/react';
import { useChatStore } from '@/store/chatStore';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { DefaultChatTransport } from 'ai';

export const ChatWidget = () => {
  const { isOpen, toggleChat } = useChatStore();
  const { messages = [], sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' })
  }) as any;

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({
      messages: [...messages, { role: 'user', content: input }]
    });
    setInput('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-primary text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <h3 className="font-semibold">EduCore AI</h3>
            </div>
            <button onClick={toggleChat} className="hover:bg-primary/80 p-1 rounded-md">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-auto">
                <Bot size={48} className="mx-auto mb-2 opacity-50" />
                <p>Hello! How can I help you today?</p>
              </div>
            ) : (
              messages.map((m: any) => (
                <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                    {/* Render tool invocations */}
                    {m.toolInvocations?.map((toolInvocation: any) => (
                      <div key={toolInvocation.toolCallId} className="mt-2 text-xs opacity-75 bg-black/5 p-2 rounded">
                        {toolInvocation.state === 'result' ? (
                          <span className="text-green-600 font-semibold">✓ Fetched data</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Fetching data...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-gray-50 border-t border-gray-100">
            <div className="flex relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="w-full bg-white border border-gray-300 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 hover:bg-primary/90 transition-all ml-auto"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
};
