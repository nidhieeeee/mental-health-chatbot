"use client";

import { Smile, ShieldAlert, LogOut, PlusCircle } from "lucide-react";

export default function Header({
  user,
  activeTab,
  onNewChat,
  onOpenCrisisModal,
  onLogout
}) {
  return (
    <header className="px-4 sm:px-8 py-3.5 sm:py-4 border-b border-violet-100 bg-white/90 backdrop-blur-md flex items-center justify-between gap-4 z-20 shadow-xs sticky top-0">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-2.5 rounded-2xl text-white shadow-sm flex items-center justify-center">
          <Smile size={24} strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">MindMate</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-100 text-violet-700">
              AI Companion
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            Your confidential space for empathetic reflection & somatic regulation.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Emergency SOS Button */}
        <button
          onClick={onOpenCrisisModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs"
          title="Crisis Hotlines"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span>Crisis Support</span>
        </button>

        {/* New Chat Button (only if active tab is chat) */}
        {activeTab === "chat" && (
          <button
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-full sm:rounded-xl transition-colors border border-slate-200"
            title="Start New Conversation"
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline font-medium text-xs">New Chat</span>
          </button>
        )}

        {/* User Avatar */}
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full border border-violet-200 shadow-xs object-cover"
          />
        )}

        {/* Sign Out */}
        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
