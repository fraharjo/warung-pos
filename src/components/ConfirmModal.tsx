"use client";

import { useEffect, useId } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            tone === "danger"
              ? "bg-red-50 border-red-200"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 ${
                tone === "danger" ? "text-red-700" : "text-blue-700"
              }`}
              aria-hidden="true"
            />
            <h2
              id={titleId}
              className={`font-bold text-sm truncate ${
                tone === "danger" ? "text-red-900" : "text-slate-900"
              }`}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
              loading
                ? "bg-slate-200 text-slate-600 cursor-not-allowed"
                : tone === "danger"
                ? "bg-red-700 hover:bg-red-800 text-white cursor-pointer"
                : "bg-blue-700 hover:bg-blue-800 text-white cursor-pointer"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
