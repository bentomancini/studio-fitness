"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  text: string;
  type: ToastType;
};

let toastListeners: ((toast: ToastMessage) => void)[] = [];

export function showToast(text: string, type: ToastType = "success") {
  const toast: ToastMessage = { id: Date.now(), text, type };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-top-4 duration-200 max-w-sm w-full ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-zinc-900/95 text-emerald-300 shadow-emerald-950/40"
              : toast.type === "error"
              ? "border-red-500/40 bg-zinc-900/95 text-red-300 shadow-red-950/40"
              : "border-white/15 bg-zinc-900/95 text-white shadow-black/60"
          }`}
        >
          {toast.type === "success" && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          {toast.type === "info" && (
            <Info className="h-4 w-4 shrink-0 text-blue-400" />
          )}

          <span className="flex-1">{toast.text}</span>

          <button
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className="text-zinc-500 hover:text-zinc-300 active:scale-90"
            aria-label="Fechar notificação"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
