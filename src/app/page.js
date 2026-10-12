"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Smile, Loader2, Sparkles, ShieldCheck, HeartHandshake, Brain } from "lucide-react";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import Header from "@/components/Header";
import { SidebarNav, BottomNav } from "@/components/Navigation";
import ChatView from "@/components/ChatView";
import MoodTracker from "@/components/MoodTracker";
import JournalView from "@/components/JournalView";
import WellnessTools from "@/components/WellnessTools";
import CrisisModal from "@/components/CrisisModal";
import CrisisBanner from "@/components/CrisisBanner";
import { containsCrisisSignals } from "@/lib/safety";

export default function Home() {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'mood' | 'journal' | 'tools'
  
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore collections state
  const [messages, setMessages] = useState([]);
  const [moods, setMoods] = useState([]);
  const [journals, setJournals] = useState([]);

  // Chat streaming state
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Safety & Crisis Modals
  const [isCrisisModalOpen, setIsCrisisModalOpen] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  // Subscribe to user Firestore data on auth change
  useEffect(() => {
    let unsubMessages;
    let unsubMoods;
    let unsubJournals;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // 1. Listen to messages (last 30 messages)
        const messagesQuery = query(
          collection(db, "users", currentUser.uid, "messages"),
          orderBy("timestamp", "asc"),
          limit(30)
        );
        unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
          const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (msgs.length === 0) {
            setMessages([
              {
                role: "model",
                content:
                  "Welcome to MindMate. I'm your empathetic mental health and wellness companion. Whatever you are carrying today—stress, excitement, grief, or fatigue—this is your non-judgmental space to reflect. How are you feeling right now?",
              },
            ]);
          } else {
            setMessages(msgs);
          }
        });

        // 2. Listen to moods
        const moodsQuery = query(
          collection(db, "users", currentUser.uid, "moods"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        unsubMoods = onSnapshot(moodsQuery, (snapshot) => {
          setMoods(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // 3. Listen to journals
        const journalsQuery = query(
          collection(db, "users", currentUser.uid, "journals"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        unsubJournals = onSnapshot(journalsQuery, (snapshot) => {
          setJournals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  const getRecentContext = () => {
    const recentMood = moods.length > 0 ? moods[0] : null;
    const recentJournal = journals.length > 0 ? journals[0] : null;
    return {
      mood: recentMood,
      journal: recentJournal,
    };
  };

  // Streaming Chat Message Handler
  const handleSendMessage = async (userText) => {
    if (!userText || !userText.trim() || isLoading || !user) return;

    const trimmedText = userText.trim();

    // Check crisis triggers
    if (containsCrisisSignals(trimmedText)) {
      setShowCrisisBanner(true);
    }

    setIsLoading(true);
    setStreamingMessage("");

    // Optimistically create new messages array for API
    const userMsg = { role: "user", content: trimmedText, timestamp: Date.now() };
    const apiMessages = [...messages, userMsg];

    try {
      // 1. Persist user message to Firestore
      await addDoc(collection(db, "users", user.uid, "messages"), userMsg);

      // 2. Call streaming API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: getRecentContext(),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate response: ${response.statusText}`);
      }

      // Check server crisis header
      if (response.headers.get("X-Crisis-Detected") === "true") {
        setShowCrisisBanner(true);
      }

      // Read response stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setStreamingMessage(accumulatedText);
      }

      // 3. Persist complete model response to Firestore
      if (accumulatedText.trim()) {
        await addDoc(collection(db, "users", user.uid, "messages"), {
          role: "model",
          content: accumulatedText.trim(),
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Chat streaming error:", err);
      // Fallback message
      await addDoc(collection(db, "users", user.uid, "messages"), {
        role: "model",
        content:
          "I'm having a temporary moment connecting. Please take a gentle breath and try messaging again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    if (
      !window.confirm(
        "Are you sure you want to start a new chat? This will clear your current conversation history."
      )
    )
      return;

    setIsLoading(true);
    try {
      const msgsQuery = query(collection(db, "users", user.uid, "messages"));
      const snapshot = await getDocs(msgsQuery);
      const deletePromises = snapshot.docs.map((document) =>
        deleteDoc(doc(db, "users", user.uid, "messages", document.id))
      );
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Error clearing chat session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMood = async (moodData) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "moods"), moodData);
  };

  const handleAddJournal = async (content) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "journals"), {
      content,
      timestamp: Date.now(),
    });
  };

  const handleDeleteJournal = async (journalId) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "journals", journalId));
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut(auth);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-violet-50/60">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <span className="text-sm font-medium text-violet-700">Loading MindMate...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated Landing Screen
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 px-4 py-12">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-violet-100 text-center max-w-lg w-full space-y-6">
          <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-4 rounded-3xl text-white shadow-md inline-block">
            <Smile size={48} strokeWidth={2.5} />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              MindMate
            </h1>
            <p className="text-violet-600 font-medium text-sm mt-1">
              AI Mental Health & Somatic Wellness Companion
            </p>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            A safe, private haven engineered with Google Gemini 2.5 Flash, real-time AI streaming, somatic Box Breathing, and reflective cognitive reframing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Empathetic LLM</span>
                <span className="text-slate-500">Streaming active reflection & validation.</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
              <Brain className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Somatic Tools</span>
                <span className="text-slate-500">Box breathing & 5-4-3-2-1 grounding.</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-pink-50/70 border border-pink-100 flex items-start gap-2.5">
              <HeartHandshake className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Mood & Journals</span>
                <span className="text-slate-500">Contextual tracking & AI pattern synthesis.</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Crisis Guardrails</span>
                <span className="text-slate-500">Proactive safety signals & hotline links.</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-violet-200 hover:bg-violet-50/80 hover:border-violet-300 text-slate-800 font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-sm active:scale-98"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.5 10.73 22.38 10H12V14.51H17.92C17.67 15.93 16.89 17.13 15.68 17.94V20.87H19.25C21.34 18.94 22.56 16 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.25 20.87L15.68 17.94C14.71 18.59 13.46 19 12 19C9.17 19 6.77 17.09 5.91 14.52H2.23V17.37C4.04 20.97 7.72 23 12 23Z" fill="#34A853"/>
              <path d="M5.91 14.52C5.69 13.87 5.56 13.19 5.56 12.5C5.56 11.81 5.69 11.13 5.91 10.48V7.63H2.23C1.49 9.1 1.07 10.76 1.07 12.5C1.07 14.24 1.49 15.9 2.23 17.37L5.91 14.52Z" fill="#FBBC05"/>
              <path d="M12 6C13.62 6 15.08 6.56 16.22 7.65L19.33 4.54C17.45 2.79 14.97 1.8 12 1.8C7.72 1.8 4.04 3.83 2.23 7.63L5.91 10.48C6.77 7.91 9.17 6 12 6Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-[11px] text-slate-400">
            By continuing, you agree that MindMate is an AI support companion, not medical care.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated Main View
  return (
    <main className="flex h-screen flex-col bg-slate-50 font-sans relative overflow-hidden">
      {/* Crisis Modal Dialog */}
      <CrisisModal
        isOpen={isCrisisModalOpen}
        onClose={() => setIsCrisisModalOpen(false)}
      />

      {/* Safety Banner (Conditional) */}
      {showCrisisBanner && (
        <CrisisBanner
          onOpenResources={() => setIsCrisisModalOpen(true)}
          onDismiss={() => setShowCrisisBanner(false)}
        />
      )}

      {/* App Header */}
      <Header
        user={user}
        activeTab={activeTab}
        onNewChat={handleNewChat}
        onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Layout Area: Sidebar on Desktop + Content Area */}
      <div className="flex-1 overflow-hidden flex flex-row">
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="flex-1 overflow-hidden flex flex-col bg-slate-50">
          {activeTab === "chat" && (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              streamingMessage={streamingMessage}
              onNewChat={handleNewChat}
              onOpenCrisisModal={() => setIsCrisisModalOpen(true)}
              recentContext={getRecentContext()}
            />
          )}

          {activeTab === "mood" && (
            <MoodTracker
              moods={moods}
              onAddMood={handleAddMood}
              journals={journals}
            />
          )}

          {activeTab === "journal" && (
            <JournalView
              journals={journals}
              onAddJournal={handleAddJournal}
              onDeleteJournal={handleDeleteJournal}
            />
          )}

          {activeTab === "tools" && <WellnessTools />}
        </section>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </main>
  );
}
