"use client";

import { MessageSquare, Heart, BookHeart, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { id: "chat", label: "AI Companion", icon: MessageSquare, color: "text-violet-600" },
  { id: "mood", label: "Mood & Trends", icon: Heart, color: "text-pink-600" },
  { id: "journal", label: "Reflections", icon: BookHeart, color: "text-blue-600" },
  { id: "tools", label: "Coping Tools", icon: Sparkles, color: "text-emerald-600" },
];

export function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="sm:hidden shrink-0 bg-white border-t border-violet-100 pb-safe z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 w-16 transition-all ${
                isActive ? `${item.color} font-bold scale-105` : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function SidebarNav({ activeTab, setActiveTab }) {
  return (
    <aside className="hidden sm:flex flex-col w-64 bg-white border-r border-violet-100 p-4 shrink-0 shadow-xs justify-between">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Wellness Suite
          </div>
        </div>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-violet-50 text-violet-900 border border-violet-200/60 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    isActive ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs space-y-2">
        <div className="font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> MindMate Philosophy
        </div>
        <p className="text-violet-100 leading-relaxed text-[11px]">
          Empathetic dialogue combined with somatic regulation leads to sustainable emotional wellbeing.
        </p>
      </div>
    </aside>
  );
}
