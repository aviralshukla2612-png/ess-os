"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, subtitle, children }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in z-[101]"
      />

      {/* Sheet Container */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[102] animate-slide-up max-h-[90vh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile handle pill */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all touch-target"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
