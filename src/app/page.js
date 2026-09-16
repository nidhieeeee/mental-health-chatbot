"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Smile, Loader2 } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hey! I'm here for you. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, { role: 'model', content: data.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'model', content: "I'm sorry, I encountered an error and couldn't process your request. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen flex-col bg-violet-50 font-sans">
      <div className="w-full flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-violet-200 bg-white flex items-center gap-4 z-10 shadow-sm">
          <div className="bg-fuchsia-100 p-2.5 rounded-2xl text-fuchsia-700 shadow-sm border border-fuchsia-200">
            <Smile size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-violet-900 tracking-tight">My Buddy</h1>
            <p className="text-sm text-violet-500 mt-0.5">Your safe space to talk and reflect.</p>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-fuchsia-100 border-fuchsia-200 text-fuchsia-700 border'
              }`}>
                {msg.role === 'user' ? <User size={18} strokeWidth={2} /> : <Smile size={18} strokeWidth={2} />}
              </div>
              
              <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-white text-violet-900 rounded-tl-sm border border-violet-100'
              }`}>
                {msg.role === 'model' ? (
                  <div className="prose prose-violet prose-sm sm:prose-base max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700 shadow-sm">
                <Smile size={18} strokeWidth={2} />
              </div>
              <div className="max-w-[80%] rounded-3xl px-5 py-3.5 sm:px-6 sm:py-4 bg-white rounded-tl-sm border border-violet-100 shadow-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-fuchsia-600" />
                <span className="text-violet-500 text-sm font-medium">typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-violet-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <form 
            onSubmit={handleSubmit}
            className="flex gap-3 max-w-5xl mx-auto relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-1 bg-violet-50/50 border border-violet-200 rounded-full px-5 sm:px-6 py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-violet-400/50 text-violet-900 placeholder:text-violet-400 disabled:opacity-50 transition-all text-base shadow-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50 flex-shrink-0"
            >
              <Send size={20} strokeWidth={2} className={input.trim() && !isLoading ? 'ml-0.5 sm:ml-1' : ''} />
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Disclaimer: I'm a virtual buddy, not a medical professional. If you're in immediate danger, please contact emergency services (e.g. 911 or 988).
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
