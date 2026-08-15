"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastContainer = mounted ? (
    <div className="fixed bottom-16 md:bottom-6 right-4 z-[120] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl animate-slide-up transition-all ${
            toast.type === "success"
              ? "bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200"
              : toast.type === "error"
              ? "bg-rose-950/95 text-white border-rose-800/80"
              : "bg-slate-900/95 text-white border-slate-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === "info" && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 transition-colors ml-2 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted && toastContainer && createPortal(toastContainer, document.body)}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg: string) => console.log(msg) };
  }
  return context;
}
