"use client";

import { useEffect, useRef } from "react";
import { X, MessageSquarePlus, Loader2 } from "lucide-react";

/**
 * Reusable Confirmation Dialog Component
 * 
 * Accessible, responsive, animated confirmation modal matching MindMap design system.
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Start a New Chat?",
  description = "Are you sure you want to start a new chat? This will clear your current conversation history..",
  confirmText = "Start New Chat",
  cancelText = "Cancel",
  icon: Icon = MessageSquarePlus,
  variant = "primary", // 'primary' | 'danger'
  isLoading = false,
  note = null,
}) {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock background scrolling while dialog is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const isDanger = variant === "danger";

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-violet-100 relative overflow-hidden transition-all animate-in zoom-in-95 duration-200"
      >
        {/* Header & Icon */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isDanger
                  ? "bg-rose-100 text-rose-600"
                  : "bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="confirmation-dialog-title"
                className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
              >
                {title}
              </h2>
              <span className="inline-block text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md mt-0.5">
                MindMap Conversation
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description Body */}
        <div className="mt-4">
          <p
            id="confirmation-dialog-description"
            className="text-slate-600 text-sm sm:text-base leading-relaxed"
          >
            {description}
          </p>

          {note && (
            <div className="mt-3.5 p-3 rounded-2xl bg-violet-50/70 border border-violet-100 text-violet-900 text-xs leading-relaxed">
              {note}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="mt-6 pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-2xl font-semibold text-sm text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-2xl font-semibold text-sm text-white transition-all shadow-md hover:shadow-lg active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-violet-200"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

