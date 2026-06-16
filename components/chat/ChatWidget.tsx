'use client';

import { useChatStore } from '@/store/chatStore';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

export const ChatWidget = () => {
  const { isOpen, toggleChat } = useChatStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
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
            // Handle cases where the stream closes without any content (e.g. OpenAI quota exceeded)
            if (!aiMessage.content && aiMessage.toolInvocations.length === 0) {
              aiMessage.content = "⚠️ **Error:** The AI service is currently unavailable. This is usually because your API key has **exceeded its quota or run out of credits**. Please check your API billing details (OpenAI or Google Gemini).";
              setMessages([...newMessages, { ...aiMessage }]);
            }
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          
          if (!isProtocolStream && (chunk.startsWith('0:') || chunk.startsWith('9:'))) {
            isProtocolStream = true;
          }

          if (isProtocolStream) {
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                if (line.startsWith('0:')) {
                  const text = JSON.parse(line.substring(2));
                  aiMessage.content += text;
                } else if (line.startsWith('9:')) {
                  const toolCall = JSON.parse(line.substring(2));
                  aiMessage.toolInvocations.push({
                    state: 'call',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    args: toolCall.args
                  });
                } else if (line.startsWith('a:')) {
                  const toolResult = JSON.parse(line.substring(2));
                  const invocation = aiMessage.toolInvocations.find(t => t.toolCallId === toolResult.toolCallId);
                  if (invocation) {
                    invocation.state = 'result';
                    invocation.result = toolResult.result;
                  }
                }
              } catch (err) {
                console.warn('Failed to parse chunk:', line, err);
              }
            }
          } else {
            // Pure text stream (toTextStreamResponse)
            aiMessage.content += chunk;
          }
          
          setMessages([...newMessages, { ...aiMessage }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error connecting to the server.' }]);
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex items-center gap-3">
              <Image src="/educore-bot.png" alt="EduCore AI" width={36} height={36} className="object-contain drop-shadow-lg" />
              <div>
                <h3 className="font-semibold leading-tight">EduCore AI</h3>
                {isLoading && <p className="text-[10px] text-white/80 animate-pulse">Typing...</p>}
              </div>
            </div>
            <button onClick={toggleChat} className="hover:bg-primary/80 p-1 rounded-md">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-auto flex flex-col items-center">
                <Image src="/educore-bot.png" alt="EduCore AI" width={80} height={80} className="mb-4 object-contain drop-shadow-xl" />
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
                    {/* Render typing indicator if no content yet */}
                    {m.role === 'assistant' && !m.content && m.toolInvocations?.length === 0 && (
                      <div className="flex gap-1 items-center h-5 py-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    <div className="prose prose-sm break-words">
                      <ReactMarkdown>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Render tool invocations */}
                    {m.toolInvocations?.map((toolInvocation: any) => (
                      <div key={toolInvocation.toolCallId} className="mt-2 text-xs opacity-75 bg-black/5 p-2 rounded">
                        {toolInvocation.state === 'result' ? (
                          <span className="text-green-600 font-semibold flex items-center gap-1">✓ Using {toolInvocation.toolName} data</span>
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
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all ml-auto ${
          isOpen
            ? 'bg-primary text-white border-2 border-white'
            : 'bg-white border-2 border-gray-200 hover:shadow-xl'
        }`}
      >
        {isOpen ? <X size={24} /> : <Image src="/educore-bot.png" alt="Chat" width={40} height={40} className="object-contain rounded-full" />}
      </button>
    </div>
  );
};
