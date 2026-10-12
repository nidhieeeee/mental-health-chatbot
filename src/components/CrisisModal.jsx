"use client";

import { X, Phone, MessageSquare, ExternalLink, ShieldAlert, HeartHandshake } from "lucide-react";
import { CRISIS_HOTLINES } from "@/lib/safety";

export default function CrisisModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crisis-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-rose-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 id="crisis-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900">
                You Are Not Alone
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">
                Confidential, free support is available 24 hours a day, 7 days a week.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close crisis resources dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Notice */}
        <div className="mt-5 p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-900 text-sm leading-relaxed flex items-start gap-3">
          <HeartHandshake className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-800">In immediate danger?</p>
            <p className="mt-0.5 text-rose-700">
              If you or someone else is in immediate physical danger, please call your local emergency services (such as 911 in the US/Canada, 999 in the UK, or 112 in Europe & India) immediately.
            </p>
          </div>
        </div>

        {/* Hotlines Directory */}
        <div className="mt-6 space-y-3.5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 px-1">
            Verified Crisis & Emotional Support Helplines
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {CRISIS_HOTLINES.map((hotline, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 hover:bg-rose-50/30 border border-slate-200/80 hover:border-rose-200 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                    {hotline.country}
                  </div>
                  <h4 className="font-bold text-slate-800 mt-0.5 text-base">
                    {hotline.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {hotline.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {hotline.contact}
                  </span>
                  {hotline.type === "call" ? (
                    <a
                      href={`tel:${hotline.contact.replace(/[^0-9]/g, "")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  ) : hotline.type === "text" ? (
                    <a
                      href={`sms:741741?body=HOME`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Text
                    </a>
                  ) : (
                    <a
                      href={hotline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-700 text-white hover:bg-slate-800 shadow-sm transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Visit
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calming reminders */}
        <div className="mt-6 p-4 rounded-2xl bg-violet-50/60 border border-violet-100 text-violet-900 text-xs sm:text-sm">
          <p className="font-semibold text-violet-950">Grounding reminder:</p>
          <p className="mt-1 text-violet-700 leading-relaxed">
            Take a deep breath right now. Drop your shoulders away from your ears, unclench your jaw, and feel the solid ground beneath your feet. You do not have to solve everything this minute; just take the very next breath.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-medium text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
