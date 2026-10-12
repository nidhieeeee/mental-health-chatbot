"use client";

import { ShieldAlert, Phone, X } from "lucide-react";

export default function CrisisBanner({ onOpenResources, onDismiss }) {
  return (
    <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 sm:px-6 text-rose-900 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300 z-20">
      <div className="flex items-center gap-2.5 max-w-4xl">
        <span className="p-1 rounded-lg bg-rose-200/80 text-rose-700 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </span>
        <span className="font-medium text-rose-800">
          Experiencing intense thoughts or emotional distress? Free 24/7 help is right here:
        </span>
        <a
          href="tel:988"
          className="inline-flex items-center gap-1 font-bold text-rose-700 underline hover:text-rose-900 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" /> Call/Text 988
        </a>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenResources}
          className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
        >
          View Resources
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-rose-400 hover:text-rose-600 rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
