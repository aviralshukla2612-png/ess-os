import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  LogOut, 
  X, 
  FolderKanban, 
  LogIn, 
  Play, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Utensils, 
  Briefcase 
} from "lucide-react";

export type ReminderType = 
  | "LUNCH" 
  | "PUNCH_OUT" 
  | "PROJECT_ASSIGNMENT"
  | "PUNCH_IN"
  | "BREAK_START"
  | "BREAK_END"
  | "PUNCH_OUT_REQUEST"
  | "PUNCH_OUT_APPROVED"
  | "PUNCH_OUT_REJECTED"
  | "LEAVE_REQUEST"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "MASS_LUNCH"
  | "MASS_RESUME"
  | "LEAD_CREATED"
  | "GENERAL";

interface PremiumReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: ReminderType | string;
  title: string;
  message: string;
}

export function PremiumReminderModal({
  isOpen,
  onClose,
  type = "GENERAL",
  title,
  message,
}: PremiumReminderModalProps) {
  // Determine color scheme and icon
  const isPunchIn = type === "PUNCH_IN";
  const isBreakStart = type === "BREAK_START" || type === "LUNCH";
  const isBreakEnd = type === "BREAK_END";
  const isPunchOut = type === "PUNCH_OUT";
  const isPunchOutReq = type === "PUNCH_OUT_REQUEST";
  const isPunchOutApproved = type === "PUNCH_OUT_APPROVED";
  const isPunchOutRejected = type === "PUNCH_OUT_REJECTED";
  const isLeaveRequest = type === "LEAVE_REQUEST";
  const isLeaveApproved = type === "LEAVE_APPROVED";
  const isLeaveRejected = type === "LEAVE_REJECTED";
  const isMassLunch = type === "MASS_LUNCH";
  const isMassResume = type === "MASS_RESUME";
  const isProject = type === "PROJECT_ASSIGNMENT";
  const isLead = type === "LEAD_CREATED";

  const getTheme = () => {
    if (isPunchIn) {
      return {
        bar: "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500",
        iconBox: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20",
        glow: "bg-emerald-400",
        btn: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/25",
        btnLabel: "Acknowledge Punch-In",
        icon: <LogIn className="w-10 h-10 text-emerald-600 dark:text-emerald-400 relative z-10" strokeWidth={2} />,
      };
    }
    if (isBreakStart) {
      return {
        bar: "bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500",
        iconBox: "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20",
        glow: "bg-orange-400",
        btn: "bg-gradient-to-r from-orange-500 to-rose-500 hover:shadow-orange-500/25",
        btnLabel: "Acknowledge Break",
        icon: <Coffee className="w-10 h-10 text-orange-500 dark:text-orange-400 relative z-10" strokeWidth={1.8} />,
      };
    }
    if (isBreakEnd) {
      return {
        bar: "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500",
        iconBox: "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20",
        glow: "bg-blue-400",
        btn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25",
        btnLabel: "View Activity",
        icon: <Play className="w-10 h-10 text-blue-600 dark:text-blue-400 relative z-10 ml-0.5" strokeWidth={2} />,
      };
    }
    if (isPunchOut) {
      return {
        bar: "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500",
        iconBox: "bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-500/20 dark:to-red-500/20",
        glow: "bg-rose-400",
        btn: "bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-rose-500/25",
        btnLabel: "Dismiss",
        icon: <LogOut className="w-10 h-10 text-rose-600 dark:text-rose-400 relative z-10" strokeWidth={2} />,
      };
    }
    if (isPunchOutReq) {
      return {
        bar: "bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500",
        iconBox: "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20",
        glow: "bg-purple-400",
        btn: "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/25",
        btnLabel: "Review Request",
        icon: <AlertCircle className="w-10 h-10 text-purple-600 dark:text-purple-400 relative z-10" strokeWidth={2} />,
      };
    }
    if (isPunchOutApproved || isLeaveApproved) {
      return {
        bar: "bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500",
        iconBox: "bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20",
        glow: "bg-emerald-400",
        btn: "bg-gradient-to-r from-emerald-500 to-green-600 hover:shadow-emerald-500/25",
        btnLabel: "Great!",
        icon: <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 relative z-10" strokeWidth={2} />,
      };
    }
    if (isPunchOutRejected || isLeaveRejected) {
      return {
        bar: "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500",
        iconBox: "bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-500/20 dark:to-red-500/20",
        glow: "bg-rose-400",
        btn: "bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-rose-500/25",
        btnLabel: "Understood",
        icon: <XCircle className="w-10 h-10 text-rose-600 dark:text-rose-400 relative z-10" strokeWidth={2} />,
      };
    }
    if (isLeaveRequest) {
      return {
        bar: "bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500",
        iconBox: "bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/20",
        glow: "bg-violet-400",
        btn: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-violet-500/25",
        btnLabel: "Review Leave Request",
        icon: <Calendar className="w-10 h-10 text-violet-600 dark:text-violet-400 relative z-10" strokeWidth={1.8} />,
      };
    }
    if (isMassLunch) {
      return {
        bar: "bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500",
        iconBox: "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20",
        glow: "bg-amber-400",
        btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-amber-500/25",
        btnLabel: "Enjoy Lunch!",
        icon: <Utensils className="w-10 h-10 text-amber-600 dark:text-amber-400 relative z-10" strokeWidth={1.8} />,
      };
    }
    if (isMassResume) {
      return {
        bar: "bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500",
        iconBox: "bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-500/20 dark:to-blue-500/20",
        glow: "bg-sky-400",
        btn: "bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-500/25",
        btnLabel: "Resume Work",
        icon: <Briefcase className="w-10 h-10 text-sky-600 dark:text-sky-400 relative z-10" strokeWidth={1.8} />,
      };
    }
    if (isProject) {
      return {
        bar: "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500",
        iconBox: "bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-500/20 dark:to-blue-500/20",
        glow: "bg-cyan-400",
        btn: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-cyan-500/25",
        btnLabel: "Open Workspace",
        icon: <FolderKanban className="w-10 h-10 text-cyan-600 dark:text-cyan-400 relative z-10" strokeWidth={1.8} />,
      };
    }
    if (isLead) {
      return {
        bar: "bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500",
        iconBox: "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20",
        glow: "bg-teal-400",
        btn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-teal-500/25",
        btnLabel: "View Pipeline",
        icon: <Sparkles className="w-10 h-10 text-teal-600 dark:text-teal-400 relative z-10" strokeWidth={1.8} />,
      };
    }

    return {
      bar: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
      iconBox: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20",
      glow: "bg-indigo-400",
      btn: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-indigo-500/25",
      btnLabel: "Got it",
      icon: <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400 relative z-10" strokeWidth={1.8} />,
    };
  };

  const theme = getTheme();
  
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
            <div className={`absolute top-0 left-0 w-full h-1.5 ${theme.bar}`} />

            <div className="p-8 pb-10">
              <div className="flex items-center justify-between mb-4">
                {/* Brand Badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                  <img src="/crmtesting/ess-logo.png" alt="ESS OS" className="w-4 h-4 object-contain rounded" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  <span className="text-[11px] font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">ESS OS Alert</span>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Icon Container with Glow */}
              <div className="flex justify-center mb-6">
                <div className={`relative flex items-center justify-center w-20 h-20 rounded-3xl ${theme.iconBox}`}>
                  <div className={`absolute inset-0 blur-xl opacity-50 ${theme.glow}`} />
                  {theme.icon}
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white"
                >
                  {title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm font-medium"
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
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${theme.btn}`}
                >
                  {theme.btnLabel}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
