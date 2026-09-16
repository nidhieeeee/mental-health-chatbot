"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Smile, Loader2, MessageSquare, Heart, BookHeart, Frown, Meh, Angry } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hey! I'm here for you. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // LocalStorage state
  const [moods, setMoods] = useState([]);
  const [journals, setJournals] = useState([]);
  const [journalInput, setJournalInput] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const storedMoods = localStorage.getItem('mindmate_moods');
    const storedJournals = localStorage.getItem('mindmate_journals');
    if (storedMoods) setMoods(JSON.parse(storedMoods));
    if (storedJournals) setJournals(JSON.parse(storedJournals));
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    localStorage.setItem('mindmate_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('mindmate_journals', JSON.stringify(journals));
  }, [journals]);

  const scrollToBottom = () => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const getRecentContext = () => {
    const recentMood = moods.length > 0 ? moods[0] : null; // Assuming sorted newest first
    const recentJournal = journals.length > 0 ? journals[0] : null;
    return {
      mood: recentMood,
      journal: recentJournal
    };
  };

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
        body: JSON.stringify({ 
          messages: newMessages,
          context: getRecentContext()
        }),
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

  const handleMoodSelect = (moodLabel) => {
    const newMood = {
      id: Date.now().toString(),
      label: moodLabel,
      timestamp: new Date().toISOString()
    };
    setMoods([newMood, ...moods]);
  };

  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (!journalInput.trim()) return;
    
    const newEntry = {
      id: Date.now().toString(),
      content: journalInput.trim(),
      timestamp: new Date().toISOString()
    };
    setJournals([newEntry, ...journals]);
    setJournalInput('');
  };

  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-smooth pb-32">
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

      <div className="p-4 sm:p-6 bg-white border-t border-violet-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] fixed bottom-16 sm:bottom-[72px] left-0 right-0 z-20">
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
      </div>
    </div>
  );

  const renderMood = () => (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-violet-100 text-center space-y-6">
          <h2 className="text-2xl font-semibold text-violet-900">How are you feeling?</h2>
          <div className="flex justify-center gap-4 sm:gap-8 flex-wrap">
            {[
              { label: 'Happy', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-100', hover: 'hover:bg-pink-200' },
              { label: 'Calm', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-100', hover: 'hover:bg-emerald-200' },
              { label: 'Neutral', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-100', hover: 'hover:bg-amber-200' },
              { label: 'Sad', icon: Frown, color: 'text-blue-500', bg: 'bg-blue-100', hover: 'hover:bg-blue-200' },
              { label: 'Angry', icon: Angry, color: 'text-red-500', bg: 'bg-red-100', hover: 'hover:bg-red-200' },
            ].map((mood) => (
              <button
                key={mood.label}
                onClick={() => handleMoodSelect(mood.label)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${mood.bg} ${mood.hover}`}
              >
                <mood.icon className={`w-10 h-10 ${mood.color}`} strokeWidth={2} />
                <span className={`font-medium ${mood.color}`}>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-violet-800 px-2">Recent Moods</h3>
          {moods.length === 0 ? (
            <p className="text-violet-500 px-2">No moods recorded yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {moods.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-violet-100 flex items-center justify-between">
                  <span className="font-semibold text-violet-900">{m.label}</span>
                  <span className="text-sm text-violet-400">
                    {new Date(m.timestamp).toLocaleDateString()} at {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderJournal = () => (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32">
      <div className="max-w-3xl mx-auto space-y-8">
        <form onSubmit={handleJournalSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-violet-100 space-y-4">
          <h2 className="text-2xl font-semibold text-violet-900">Journal Entry</h2>
          <textarea
            value={journalInput}
            onChange={(e) => setJournalInput(e.target.value)}
            placeholder="Write your thoughts here..."
            className="w-full h-32 bg-violet-50/50 border border-violet-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-violet-400/50 text-violet-900 placeholder:text-violet-400 resize-none transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!journalInput.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6 py-2.5 font-medium disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              Save Entry
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-violet-800 px-2">Past Entries</h3>
          {journals.length === 0 ? (
            <p className="text-violet-500 px-2">No entries yet. Start writing!</p>
          ) : (
            <div className="space-y-4">
              {journals.map((j) => (
                <div key={j.id} className="bg-white p-5 rounded-2xl shadow-sm border border-violet-100 space-y-2">
                  <div className="text-sm text-violet-400 font-medium">
                    {new Date(j.timestamp).toLocaleDateString()} at {new Date(j.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <p className="text-violet-900 whitespace-pre-wrap leading-relaxed">{j.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="flex h-screen flex-col bg-violet-50 font-sans relative">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-violet-200 bg-white flex items-center gap-4 z-10 shadow-sm sticky top-0">
        <div className="bg-fuchsia-100 p-2.5 rounded-2xl text-fuchsia-700 shadow-sm border border-fuchsia-200">
          <Smile size={28} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-violet-900 tracking-tight">MindMate</h1>
          <p className="text-sm text-violet-500 mt-0.5">Your safe space to talk and reflect.</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col pt-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'mood' && renderMood()}
        {activeTab === 'journal' && renderJournal()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-violet-200 pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 sm:h-[72px] max-w-md mx-auto px-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'chat' ? 'text-violet-600' : 'text-violet-400 hover:text-violet-500'}`}
          >
            <MessageSquare size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'mood' ? 'text-fuchsia-600' : 'text-violet-400 hover:text-violet-500'}`}
          >
            <Heart size={24} strokeWidth={activeTab === 'mood' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Mood</span>
          </button>
          
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'journal' ? 'text-blue-600' : 'text-violet-400 hover:text-violet-500'}`}
          >
            <BookHeart size={24} strokeWidth={activeTab === 'journal' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Journal</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
