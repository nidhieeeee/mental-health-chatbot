"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, User, Smile, Loader2, MessageSquare, Heart, BookHeart, Frown, Meh, Angry, LogOut, PlusCircle } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore state
  const [moods, setMoods] = useState([]);
  const [journals, setJournals] = useState([]);
  const [journalInput, setJournalInput] = useState('');

  useEffect(() => {
    let unsubMessages;
    let unsubMoods;
    let unsubJournals;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Listen to messages (last 10 = 5 interactions)
        const messagesQuery = query(
          collection(db, 'users', currentUser.uid, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
          const msgs = snapshot.docs.map(doc => doc.data()).reverse();
          if (msgs.length === 0) {
            setMessages([{ role: 'model', content: "Hey! I'm here for you. What's on your mind today?" }]);
          } else {
            setMessages(msgs);
          }
        });

        // Listen to moods
        const moodsQuery = query(
          collection(db, 'users', currentUser.uid, 'moods'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        unsubMoods = onSnapshot(moodsQuery, (snapshot) => {
          setMoods(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Listen to journals
        const journalsQuery = query(
          collection(db, 'users', currentUser.uid, 'journals'),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        unsubJournals = onSnapshot(journalsQuery, (snapshot) => {
          setJournals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      } else {
        setMessages([]);
        setMoods([]);
        setJournals([]);
        if (unsubMessages) unsubMessages();
        if (unsubMoods) unsubMoods();
        if (unsubJournals) unsubJournals();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubMessages) unsubMessages();
      if (unsubMoods) unsubMoods();
      if (unsubJournals) unsubJournals();
    };
  }, []);

  const scrollToBottom = () => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTab]);

  const getRecentContext = () => {
    const recentMood = moods.length > 0 ? moods[0] : null; 
    const recentJournal = journals.length > 0 ? journals[0] : null;
    return {
      mood: recentMood,
      journal: recentJournal
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Add user message to Firestore
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'user',
        content: userContent,
        timestamp: Date.now()
      });

      // Optimistically update local state to avoid waiting for snapshot
      const userMsg = { role: 'user', content: userContent };
      const newMessagesForApi = [...messages, userMsg];

      // 2. Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: newMessagesForApi,
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

      // 3. Add bot response to Firestore
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'model',
        content: data.text,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to start a new chat? This will clear your current conversation history.")) return;
    
    setIsLoading(true);
    try {
      const msgsQuery = query(collection(db, 'users', user.uid, 'messages'));
      const snapshot = await getDocs(msgsQuery);
      
      const deletePromises = snapshot.docs.map(document => 
        deleteDoc(doc(db, 'users', user.uid, 'messages', document.id))
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      signOut(auth);
    }
  };

  const handleMoodSelect = async (moodLabel) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'moods'), {
        label: moodLabel,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error saving mood:", error);
    }
  };

  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!journalInput.trim() || !user) return;
    
    try {
      await addDoc(collection(db, 'users', user.uid, 'journals'), {
        content: journalInput.trim(),
        timestamp: Date.now()
      });
      setJournalInput('');
    } catch (error) {
      console.error("Error saving journal:", error);
    }
  };

  const renderChat = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 scroll-smooth">
        <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 pb-4">
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

      <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-violet-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-8">
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
                    {m.timestamp ? new Date(m.timestamp).toLocaleDateString() + ' at ' + new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-8">
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
                    {j.timestamp ? new Date(j.timestamp).toLocaleDateString() + ' at ' + new Date(j.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-violet-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-violet-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-violet-100 text-center max-w-md w-full">
          <div className="bg-fuchsia-100 p-4 rounded-3xl text-fuchsia-700 shadow-sm border border-fuchsia-200 inline-block mb-6">
            <Smile size={48} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-violet-900 mb-2">MindMate</h1>
          <p className="text-violet-500 mb-8">Your safe space to talk and reflect.</p>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-violet-200 hover:bg-violet-50 text-violet-900 font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.5 10.73 22.38 10H12V14.51H17.92C17.67 15.93 16.89 17.13 15.68 17.94V20.87H19.25C21.34 18.94 22.56 16 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.25 20.87L15.68 17.94C14.71 18.59 13.46 19 12 19C9.17 19 6.77 17.09 5.91 14.52H2.23V17.37C4.04 20.97 7.72 23 12 23Z" fill="#34A853"/>
              <path d="M5.91 14.52C5.69 13.87 5.56 13.19 5.56 12.5C5.56 11.81 5.69 11.13 5.91 10.48V7.63H2.23C1.49 9.1 1.07 10.76 1.07 12.5C1.07 14.24 1.49 15.9 2.23 17.37L5.91 14.52Z" fill="#FBBC05"/>
              <path d="M12 6C13.62 6 15.08 6.56 16.22 7.65L19.33 4.54C17.45 2.79 14.97 1.8 12 1.8C7.72 1.8 4.04 3.83 2.23 7.63L5.91 10.48C6.77 7.91 9.17 6 12 6Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-violet-50 font-sans relative overflow-hidden">
      {/* Header */}
      <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-violet-200 bg-white flex items-center gap-4 z-10 shadow-sm sticky top-0">
        <div className="bg-fuchsia-100 p-2.5 rounded-2xl text-fuchsia-700 shadow-sm border border-fuchsia-200">
          <Smile size={28} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-violet-900 tracking-tight">MindMate</h1>
          <p className="text-sm text-violet-500 mt-0.5">Your safe space to talk and reflect.</p>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {activeTab === 'chat' && (
            <button onClick={handleNewChat} className="flex items-center gap-1 p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded-full sm:rounded-xl transition-colors" title="New Chat">
              <PlusCircle size={20} />
              <span className="hidden sm:inline font-medium text-sm">New Chat</span>
            </button>
          )}
          {user.photoURL && (
            <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-violet-200 ml-1" />
          )}
          <button onClick={handleLogout} className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded-full transition-colors" title="Sign Out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col pt-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'mood' && renderMood()}
        {activeTab === 'journal' && renderJournal()}
      </div>

      {/* Bottom Navigation */}
      <nav className="shrink-0 bg-white border-t border-violet-200 pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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
