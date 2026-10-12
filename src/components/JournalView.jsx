"use client";

import { useState } from "react";
import { 
  BookHeart, 
  Sparkles, 
  Search, 
  Trash2, 
  Lock, 
  Calendar, 
  Plus, 
  ChevronRight,
  Loader2
} from "lucide-react";

const GUIDED_PROMPTS = [
  "What is one heavy thought you are carrying today that you can gently release?",
  "Name three small things that brought comfort or calm to your senses today.",
  "If your best friend spoke to you right now, what compassion would they offer you?",
  "What boundary do you need to honor this week to protect your emotional peace?",
  "What is something you learned about yourself during a tough moment recently?"
];

export default function JournalView({ journals, onAddJournal, onDeleteJournal }) {
  const [journalInput, setJournalInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePromptIdx, setActivePromptIdx] = useState(0);

  const handleUsePrompt = (promptText) => {
    setJournalInput((prev) => (prev ? `${prev}\n\nPrompt: ${promptText}\n` : `Prompt: ${promptText}\n`));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!journalInput.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddJournal(journalInput.trim());
      setJournalInput("");
    } catch (err) {
      console.error("Failed to add journal entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJournals = journals.filter((j) =>
    j.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* New Journal Entry Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-violet-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-violet-100 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-violet-950 flex items-center gap-2">
                <BookHeart className="w-6 h-6 text-violet-600" />
                Reflective Journaling
              </h2>
              <p className="text-sm text-violet-600 mt-1">
                Express your raw, unfiltered thoughts in a completely private space.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-500 self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Private & Authenticated</span>
            </div>
          </div>

          {/* Guided Prompt Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-fuchsia-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">Need inspiration?</span>
                <p className="text-xs sm:text-sm text-violet-900 font-medium mt-0.5">
                  &ldquo;{GUIDED_PROMPTS[activePromptIdx]}&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleUsePrompt(GUIDED_PROMPTS[activePromptIdx])}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors"
              >
                Insert Prompt
              </button>
              <button
                type="button"
                onClick={() => setActivePromptIdx((idx) => (idx + 1) % GUIDED_PROMPTS.length)}
                className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-xl transition-colors"
                title="Next Prompt"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder="What feels present in your mind right now? Let it flow without judgment..."
              className="w-full h-36 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none transition-all"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {journalInput.length} characters
              </span>
              <button
                type="submit"
                disabled={!journalInput.trim() || isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-md active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Entry
              </button>
            </div>
          </form>
        </div>

        {/* Past Journal Entries */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-violet-900">Your Journal Archive</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
                {journals.length}
              </span>
            </div>

            {/* Search Input */}
            {journals.length > 0 && (
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your reflections..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            )}
          </div>

          {filteredJournals.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-violet-100 text-center text-slate-400">
              {searchQuery ? "No entries match your search." : "No journal entries yet. Write your first reflection above!"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJournals.map((j) => (
                <div
                  key={j.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-violet-100 space-y-3 hover:border-violet-200 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5 font-medium text-violet-700">
                      <Calendar className="w-3.5 h-3.5" />
                      {j.timestamp ? new Date(j.timestamp).toLocaleDateString([], {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      }) + " at " + new Date(j.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </div>
                    {onDeleteJournal && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this journal entry?")) {
                            onDeleteJournal(j.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {j.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
