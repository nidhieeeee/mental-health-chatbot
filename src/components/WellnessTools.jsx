"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Wind, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Brain, 
  ArrowRight,
  ShieldCheck,
  Smile
} from "lucide-react";

export default function WellnessTools() {
  const [activeTool, setActiveTool] = useState("breathing"); // 'breathing' | 'grounding' | 'reframer'

  // --- Box Breathing State ---
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("Inhale"); // Inhale, Hold1, Exhale, Hold2
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  const phaseDetails = {
    Inhale: { label: "Inhale Slowly", desc: "Breathe in deeply through your nose...", scale: "scale-125", color: "from-teal-400 to-emerald-500" },
    Hold1: { label: "Hold Gently", desc: "Hold your breath calmly without tension...", scale: "scale-125", color: "from-blue-400 to-indigo-500" },
    Exhale: { label: "Exhale Fully", desc: "Release breath smoothly through your mouth...", scale: "scale-90", color: "from-violet-400 to-purple-500" },
    Hold2: { label: "Hold Calmly", desc: "Rest in the stillness before the next breath...", scale: "scale-90", color: "from-amber-400 to-orange-400" },
  };

  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathCountdown((prev) => {
          if (prev > 1) return prev - 1;

          // Transition to next phase
          if (breathPhase === "Inhale") {
            setBreathPhase("Hold1");
            return 4;
          } else if (breathPhase === "Hold1") {
            setBreathPhase("Exhale");
            return 4;
          } else if (breathPhase === "Exhale") {
            setBreathPhase("Hold2");
            return 4;
          } else {
            setBreathPhase("Inhale");
            setCompletedCycles((c) => c + 1);
            return 4;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  const handleResetBreathing = () => {
    setIsBreathingActive(false);
    setBreathPhase("Inhale");
    setBreathCountdown(4);
    setCompletedCycles(0);
  };

  // --- 5-4-3-2-1 Grounding State ---
  const groundingSteps = [
    { count: 5, sense: "Things You Can SEE", icon: "👀", prompt: "Notice 5 colors, shapes, or objects in the room right now." },
    { count: 4, sense: "Things You Can FEEL", icon: "✋", prompt: "Notice the chair against your back, the floor beneath your feet, or fabric on your skin." },
    { count: 3, sense: "Things You Can HEAR", icon: "👂", prompt: "Listen closely for distant traffic, a hum of an AC, or birds outside." },
    { count: 2, sense: "Things You Can SMELL", icon: "👃", prompt: "Identify a scent nearby, coffee, fresh air, or your own clothing." },
    { count: 1, sense: "Thing You Are GRATEFUL For", icon: "💖", prompt: "Name one small thing or person you are grateful for today." },
  ];

  const [completedSteps, setCompletedSteps] = useState([]);

  const toggleStep = (stepIdx) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIdx)
        ? prev.filter((i) => i !== stepIdx)
        : [...prev, stepIdx]
    );
  };

  // --- CBT Thought Reframer State ---
  const [unhelpfulThought, setUnhelpfulThought] = useState("");
  const [distortion, setDistortion] = useState("catastrophizing");
  const [reframedThought, setReframedThought] = useState("");
  const [savedReframes, setSavedReframes] = useState([]);

  const distortionsList = [
    { id: "catastrophizing", name: "Catastrophizing", desc: "Expecting the absolute worst-case scenario." },
    { id: "allornothing", name: "All-or-Nothing", desc: "Seeing things in black and white with no middle ground." },
    { id: "mindreading", name: "Mind Reading", desc: "Assuming you know others are judging or disliking you." },
    { id: "overgeneralization", name: "Overgeneralization", desc: "Treating a single negative event as an endless pattern." },
    { id: "emotionalreasoning", name: "Emotional Reasoning", desc: "Thinking that because I feel anxious, disaster must be true." },
  ];

  const handleSaveReframe = (e) => {
    e.preventDefault();
    if (!unhelpfulThought.trim() || !reframedThought.trim()) return;
    setSavedReframes([
      {
        id: Date.now(),
        thought: unhelpfulThought.trim(),
        distortion,
        reframed: reframedThought.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...savedReframes
    ]);
    setUnhelpfulThought("");
    setReframedThought("");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-violet-100">
          <div>
            <h2 className="text-2xl font-bold text-violet-950 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-fuchsia-600" />
              Somatic & Cognitive Coping Tools
            </h2>
            <p className="text-sm text-violet-600 mt-1">
              Evidence-based techniques to regulate your nervous system and calm anxiety in minutes.
            </p>
          </div>
          <div className="flex p-1 bg-violet-50 rounded-2xl border border-violet-150 self-start sm:self-auto">
            <button
              onClick={() => setActiveTool("breathing")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTool === "breathing"
                  ? "bg-white text-violet-900 shadow-sm"
                  : "text-violet-600 hover:text-violet-900"
              }`}
            >
              Box Breathing
            </button>
            <button
              onClick={() => setActiveTool("grounding")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTool === "grounding"
                  ? "bg-white text-violet-900 shadow-sm"
                  : "text-violet-600 hover:text-violet-900"
              }`}
            >
              5-4-3-2-1 Grounding
            </button>
            <button
              onClick={() => setActiveTool("reframer")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTool === "reframer"
                  ? "bg-white text-violet-900 shadow-sm"
                  : "text-violet-600 hover:text-violet-900"
              }`}
            >
              CBT Reframer
            </button>
          </div>
        </div>

        {/* TOOL 1: BOX BREATHING */}
        {activeTool === "breathing" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-violet-100 text-center space-y-8">
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Wind className="w-3.5 h-3.5" /> 4-4-4-4 Parasympathetic Nervous Reset
              </span>
              <h3 className="text-2xl font-bold text-slate-800">Box Breathing Practice</h3>
              <p className="text-sm text-slate-500">
                Used by clinicians and first responders to reduce cortisol and regain emotional balance.
              </p>
            </div>

            {/* Visual Breathing Circle */}
            <div className="py-10 flex flex-col items-center justify-center relative">
              <div
                className={`w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr ${
                  phaseDetails[breathPhase].color
                } shadow-2xl flex flex-col items-center justify-center text-white transition-all duration-1000 ease-in-out transform ${
                  phaseDetails[breathPhase].scale
                } opacity-95`}
              >
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight mb-1">
                  {breathCountdown}
                </div>
                <div className="text-lg sm:text-xl font-bold tracking-wide">
                  {phaseDetails[breathPhase].label}
                </div>
              </div>
              <p className="mt-8 text-sm font-medium text-slate-600 max-w-xs transition-opacity duration-300">
                {phaseDetails[breathPhase].desc}
              </p>
            </div>

            {/* Stats & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 border-t border-slate-100">
              <div className="text-sm text-slate-500 font-medium">
                Completed Cycles: <span className="text-violet-700 font-bold">{completedCycles}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md active:scale-95 ${
                    isBreathingActive
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  }`}
                >
                  {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  {isBreathingActive ? "Pause" : "Start Exercise"}
                </button>
                <button
                  onClick={handleResetBreathing}
                  className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOOL 2: 5-4-3-2-1 GROUNDING */}
        {activeTool === "grounding" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-violet-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-100 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Eye className="w-3.5 h-3.5" /> Sensory Anchoring Exercise
                </span>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">5-4-3-2-1 Sensory Grounding</h3>
                <p className="text-sm text-slate-500 mt-1">
                  When your thoughts are racing, connect directly to your physical senses in the present moment.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-violet-500 uppercase tracking-wider">Progress</div>
                <div className="text-xl font-bold text-violet-900">
                  {completedSteps.length} / 5 Done
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {groundingSteps.map((step, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      isDone
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                        : "bg-slate-50/70 hover:bg-violet-50/40 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl shrink-0 mt-0.5">{step.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base">
                          {step.count} - {step.sense}
                        </span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        {step.prompt}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {completedSteps.length === 5 && (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <Smile className="w-6 h-6 text-emerald-600" />
                  <span className="font-semibold text-sm">
                    Well done! Notice how your body feels right now compared to when you started.
                  </span>
                </div>
                <button
                  onClick={() => setCompletedSteps([])}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* TOOL 3: CBT THOUGHT REFRAMER */}
        {activeTool === "reframer" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-violet-100 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <Brain className="w-3.5 h-3.5" /> Cognitive Behavioral Therapy (CBT)
              </span>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">Automatic Thought Reframer</h3>
              <p className="text-sm text-slate-500 mt-1">
                Our thoughts are not always facts. Identify common cognitive distortions and rewrite them with compassionate truth.
              </p>
            </div>

            <form onSubmit={handleSaveReframe} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  1. What negative thought is troubling you?
                </label>
                <input
                  type="text"
                  value={unhelpfulThought}
                  onChange={(e) => setUnhelpfulThought(e.target.value)}
                  placeholder="e.g. 'I messed up one part of the interview, so they definitely think I am unqualified.'"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  2. Select the cognitive pattern / distortion:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {distortionsList.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDistortion(d.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs ${
                        distortion === d.id
                          ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold">{d.name}</div>
                      <div className={`text-[11px] mt-0.5 line-clamp-2 ${distortion === d.id ? "text-violet-100" : "text-slate-500"}`}>
                        {d.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  3. What is a balanced, compassionate, and realistic reframe?
                </label>
                <textarea
                  value={reframedThought}
                  onChange={(e) => setReframedThought(e.target.value)}
                  placeholder="e.g. 'One imperfect answer does not define my whole ability. I demonstrated strong knowledge in other questions, and making mistakes is human.'"
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!unhelpfulThought.trim() || !reframedThought.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  Save Reframed Thought
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {savedReframes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                  Recent Reframed Thoughts
                </h4>
                <div className="space-y-3">
                  {savedReframes.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-semibold text-rose-500 line-through">
                          {item.thought}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-medium">
                        ✨ {item.reframed}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
