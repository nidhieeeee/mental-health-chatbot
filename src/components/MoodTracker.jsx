"use client";

import { useState } from "react";
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  Angry, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  Tag, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

const MOOD_OPTIONS = [
  { label: "Overjoyed", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-300", value: 5 },
  { label: "Happy", icon: Heart, color: "text-pink-500", bg: "bg-pink-100", border: "border-pink-300", value: 4 },
  { label: "Calm", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-300", value: 4 },
  { label: "Neutral", icon: Meh, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-300", value: 3 },
  { label: "Anxious", icon: AlertCircle, color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-300", value: 2 },
  { label: "Sad", icon: Frown, color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-300", value: 2 },
  { label: "Overwhelmed", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-100", border: "border-orange-300", value: 1 },
  { label: "Angry", icon: Angry, color: "text-rose-500", bg: "bg-rose-100", border: "border-rose-300", value: 1 },
];

const COMMON_TAGS = ["Work", "Sleep", "Relationships", "Health", "Studies", "Family", "Finances", "Exercise"];

export default function MoodTracker({ moods, onAddMood, journals = [] }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Insights State
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  const handleLogMood = async (e) => {
    e.preventDefault();
    if (!selectedMood) return;

    setIsSubmitting(true);
    try {
      await onAddMood({
        label: selectedMood.label,
        tag: selectedTag || "General",
        note: moodNote.trim(),
        value: selectedMood.value,
        timestamp: Date.now()
      });
      setSelectedMood(null);
      setSelectedTag("");
      setMoodNote("");
    } catch (err) {
      console.error("Failed to log mood:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moods, journals }),
      });
      const data = await res.json();
      setAiInsights(data);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Compute analytics
  const totalLogs = moods.length;
  const moodCounts = moods.reduce((acc, curr) => {
    acc[curr.label] = (acc[curr.label] || 0) + 1;
    return acc;
  }, {});

  const mostFrequentMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b, 
    moods[0]?.label || "None"
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Check-In Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-violet-100 space-y-6">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-violet-950">How are you feeling right now?</h2>
            <p className="text-sm text-violet-600 mt-1">
              Tracking your emotional fluctuations builds self-awareness and helps MindMate tailor its support.
            </p>
          </div>

          <form onSubmit={handleLogMood} className="space-y-6">
            {/* Mood Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood?.label === mood.label;
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 text-center ${
                      isSelected
                        ? `${mood.bg} ${mood.border} scale-102 shadow-sm font-bold`
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/70 text-slate-700"
                    }`}
                  >
                    <Icon className={`w-8 h-8 ${mood.color}`} strokeWidth={2} />
                    <span className="text-xs sm:text-sm">{mood.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Optional Details if mood is selected */}
            {selectedMood && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-violet-600" /> What influenced this feeling? (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          selectedTag === tag
                            ? "bg-violet-600 text-white shadow-sm"
                            : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    placeholder="Briefly describe what's happening (optional note)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm Check-In
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Analytics & Patterns Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Check-Ins</div>
              <div className="text-2xl font-bold text-violet-950 mt-0.5">{totalLogs}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dominant Emotion</div>
              <div className="text-xl font-bold text-violet-950 mt-0.5 capitalize">{mostFrequentMood}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-violet-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Pattern Synthesis</div>
              <div className="text-sm font-medium text-slate-600 mt-1">Discover deeper emotional trends</div>
            </div>
            <button
              onClick={fetchAIInsights}
              disabled={insightsLoading || moods.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {insightsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Synthesize
            </button>
          </div>
        </div>

        {/* AI Insights Card if generated */}
        {aiInsights && (
          <div className="bg-gradient-to-br from-fuchsia-50 via-purple-50 to-violet-50 p-6 sm:p-8 rounded-3xl border border-purple-200/80 shadow-sm space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-200 text-purple-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-purple-950">
                MindMate Weekly Emotional Synthesis
              </h3>
            </div>
            <p className="text-sm text-purple-900 leading-relaxed whitespace-pre-line">
              {aiInsights.summary}
            </p>
            {aiInsights.highlights && aiInsights.highlights.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2">Key Takeaways:</div>
                <ul className="space-y-1.5">
                  {aiInsights.highlights.map((h, i) => (
                    <li key={i} className="text-xs sm:text-sm text-purple-900 flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recent Mood History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-violet-900">Recent Emotional History</h3>
            <span className="text-xs text-violet-500 font-medium">Last 10 Logs</span>
          </div>

          {moods.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-violet-100 text-center text-slate-400">
              No moods recorded yet. Select how you feel above to log your first entry!
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {moods.map((m) => {
                const match = MOOD_OPTIONS.find((opt) => opt.label.toLowerCase() === m.label.toLowerCase()) || MOOD_OPTIONS[3];
                const Icon = match.icon;
                return (
                  <div
                    key={m.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-violet-100 flex items-center justify-between gap-3 hover:border-violet-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${match.bg} ${match.color} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm sm:text-base">{m.label}</span>
                          {m.tag && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700">
                              {m.tag}
                            </span>
                          )}
                        </div>
                        {m.note && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                            &ldquo;{m.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 font-medium">
                      {m.timestamp ? new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
