import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, LogOut, X, FolderKanban } from "lucide-react";

interface PremiumReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "LUNCH" | "PUNCH_OUT" | "PROJECT_ASSIGNMENT";
  title: string;
  message: string;
}

export function PremiumReminderModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: PremiumReminderModalProps) {
  const isLunch = type === "LUNCH";
  const isProject = type === "PROJECT_ASSIGNMENT";
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
          />

          {/* Premium Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white dark:bg-[#0B1120] shadow-2xl dark:shadow-[0_0_80px_-15px_rgba(79,70,229,0.3)] ring-1 ring-slate-200 dark:ring-slate-800"
          >
            {/* Glowing Accent Top Bar */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${isProject ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500' : isLunch ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} />

            <div className="p-8 pb-10">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon Container with Glow */}
              <div className="flex justify-center mb-6">
                <div className={`relative flex items-center justify-center w-20 h-20 rounded-3xl ${
                  isProject
                    ? 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20'
                    : isLunch 
                    ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20' 
                    : 'bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20'
                }`}>
                  <div className={`absolute inset-0 blur-xl opacity-50 ${
                    isProject ? 'bg-cyan-400' : isLunch ? 'bg-orange-400' : 'bg-indigo-400'
                  }`} />
                  {isProject ? (
                    <FolderKanban className="w-10 h-10 text-cyan-600 dark:text-cyan-400 relative z-10" strokeWidth={1.5} />
                  ) : isLunch ? (
                    <Coffee className="w-10 h-10 text-orange-500 dark:text-orange-400 relative z-10" strokeWidth={1.5} />
                  ) : (
                    <LogOut className="w-10 h-10 text-indigo-600 dark:text-indigo-400 relative z-10" strokeWidth={1.5} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"
                >
                  {title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm"
                >
                  {message}
                </motion.p>
              </div>

              {/* Action Button */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex justify-center"
              >
                <button
                  onClick={onClose}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                    isProject
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/25'
                      : isLunch 
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:shadow-orange-500/25' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/25'
                  }`}
                >
                  {isProject ? 'Open Workspace' : isLunch ? 'Got it, taking a break!' : 'Got it, wrapping up!'}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
