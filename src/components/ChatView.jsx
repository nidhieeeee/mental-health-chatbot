"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Send, 
  User, 
  Smile, 
  Loader2, 
  PlusCircle, 
  ShieldAlert, 
  Sparkles, 
  Trash2,
  PhoneCall
} from "lucide-react";
import { containsCrisisSignals } from "@/lib/safety";

const STARTER_PROMPTS = [
  "I'm feeling overwhelmed with work and need a safe place to vent.",
  "Help me gently reframe a recurring anxious thought.",
  "I'm feeling lonely and disconnected today.",
  "Guide me through a quick calming exercise."
];

export default function ChatView({
  messages,
  onSendMessage,
  isLoading,
  streamingMessage,
  onNewChat,
  onOpenCrisisModal,
  recentContext
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [showLocalCrisisAlert, setShowLocalCrisisAlert] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    if (containsCrisisSignals(text)) {
      setShowLocalCrisisAlert(true);
    }
    setInput("");
    onSendMessage(text);
  };

  const handlePromptClick = (prompt) => {
    if (isLoading) return;
    if (containsCrisisSignals(prompt)) {
      setShowLocalCrisisAlert(true);
    }
    onSendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">
        <div className="max-w-4xl mx-auto w-full space-y-6 pb-4">
          
          {/* Recent Context Capsule Indicator */}
          {recentContext?.mood && (
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/70 border border-violet-200/80 text-violet-800 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Active Context: Feeling <strong>{recentContext.mood.label}</strong></span>
              </div>
            </div>
          )}

          {/* In-chat Crisis Alert Banner if triggered */}
          {showLocalCrisisAlert && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-200 text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Need immediate, confidential support?</div>
                  <div className="text-xs text-rose-800">
                    Free crisis counselors are available 24/7. Call or text <strong>988</strong>.
                  </div>
                </div>
              </div>
              <button
                onClick={onOpenCrisisModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm self-end sm:self-auto"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Crisis Directory
              </button>
            </div>
          )}

          {/* Render All Messages */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                    isUser
                      ? "bg-violet-600 text-white"
                      : "bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700"
                  }`}
                >
                  {isUser ? (
                    <User size={18} strokeWidth={2} />
                  ) : (
                    <Smile size={18} strokeWidth={2} />
                  )}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-3xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-sm ${
                    isUser
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-white text-slate-900 rounded-tl-sm border border-violet-100/80"
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="prose prose-violet prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-violet-950 prose-a:text-violet-600 prose-blockquote:border-l-violet-400 prose-blockquote:bg-violet-50/50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:rounded-r-lg">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live Streaming Response Bubble */}
          {isLoading && streamingMessage && (
            <div className="flex gap-3 sm:gap-4 flex-row animate-in fade-in duration-200">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700 shadow-sm">
                <Smile size={18} strokeWidth={2} />
              </div>
              <div className="max-w-[85%] sm:max-w-[78%] rounded-3xl px-5 sm:px-6 py-3.5 sm:py-4 bg-white text-slate-900 rounded-tl-sm border border-violet-100 shadow-sm">
                <div className="prose prose-violet prose-sm sm:prose-base max-w-none prose-p:leading-relaxed">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator if waiting for initial stream chunk */}
          {isLoading && !streamingMessage && (
            <div className="flex gap-3 sm:gap-4 flex-row animate-in fade-in duration-200">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-700 shadow-sm">
                <Smile size={18} strokeWidth={2} />
              </div>
              <div className="max-w-[80%] rounded-3xl px-5 py-3.5 sm:px-6 sm:py-4 bg-white rounded-tl-sm border border-violet-100 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
                <span className="text-violet-500 text-xs sm:text-sm font-medium">
                  MindMate is thinking...
                </span>
              </div>
            </div>
          )}

          {/* Conversation Starter Chips (when conversation is short) */}
          {messages.length <= 1 && (
            <div className="pt-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                Need a starting point?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(prompt)}
                    disabled={isLoading}
                    className="p-3 text-left rounded-2xl bg-white hover:bg-violet-50/70 border border-violet-100 text-xs sm:text-sm text-slate-700 hover:text-violet-900 transition-all shadow-sm hover:border-violet-300 active:scale-98"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="shrink-0 p-3 sm:p-5 bg-white border-t border-violet-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what's on your mind... (MindMate is here to listen)"
            disabled={isLoading}
            className="flex-1 bg-violet-50/50 border border-violet-200/80 rounded-full px-5 sm:px-6 py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-violet-400/50 text-slate-800 placeholder:text-violet-400 disabled:opacity-50 transition-all text-sm sm:text-base shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500/50 flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={18} strokeWidth={2} className={input.trim() && !isLoading ? "ml-0.5" : ""} />
          </button>
        </form>
        <div className="text-[11px] text-center text-slate-400 mt-2">
          MindMate provides supportive wellness reflection and is not a substitute for clinical medical advice.
        </div>
      </div>
    </div>
  );
}
