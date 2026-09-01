"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, LogOut, Coffee, Play, Power, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { BottomSheet } from "../ui/BottomSheet";
import { useWorkClock } from "@/lib/workClockContext";
import { useToast } from "@/components/ui/Toast";

interface Props {
  currentUser: {
    name: string;
    email: string;
    role: string;
    designation?: string;
    employeeId?: string;
    icon?: any;
  };
  onOpenSearch: () => void;
  onOpenHelpDrawer?: () => void;
  onToggleMobileMenu?: () => void;
  onLogout?: () => void;
}

export function Header({ currentUser, onOpenSearch, onToggleMobileMenu, onLogout }: Props) {
  const { status, workSeconds, breakSeconds, breakType, formatHMS, punchIn, startBreak, resumeWork, punchOut, confirmPunchOutAnyway, markPunchOutPending } = useWorkClock();
  const { showToast } = useToast();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBreakSheetOpen, setIsBreakSheetOpen] = useState(false);
  const [isPunchOutConfirmOpen, setIsPunchOutConfirmOpen] = useState(false);
  const [punchOutReason, setPunchOutReason] = useState("");
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const isPunchingInRef = React.useRef(false);

  // Track active breaks for owner notifications
  const knownBreakStarts = React.useRef<Set<string>>(new Set());
  const knownBreakEnds = React.useRef<Set<string>>(new Set());
  const initialFetchDone = React.useRef(false);

  React.useEffect(() => {
    if (currentUser.role !== "OWNER") return;
    const checkBreaks = async () => {
      try {
        const res = await fetch("/crmtesting/api/attendance/breaks/today");
        const json = await res.json();
        if (json.success && json.data) {
          json.data.forEach((b: any) => {
            const name = b.employee?.user?.name || "An employee";
            
            // Notification for break start
            if (initialFetchDone.current && !knownBreakStarts.current.has(b.id)) {
              showToast(`☕ ${name} just took a ${b.statusType || "break"}`, "info");
            }
            knownBreakStarts.current.add(b.id);

            // Notification for break end
            if (b.endedAt && initialFetchDone.current && !knownBreakEnds.current.has(b.id)) {
              const start = new Date(b.startedAt).getTime();
              const end = new Date(b.endedAt).getTime();
              const mins = Math.round((end - start) / 60000);
              showToast(`▶️ ${name} has resumed working (Break was ${mins} min)`, "success");
            }
            if (b.endedAt) {
              knownBreakEnds.current.add(b.id);
            }
          });
          initialFetchDone.current = true;
        }
      } catch (e) {}
    };
    // Initial fetch to populate known breaks without notifying
    checkBreaks();
    const interval = setInterval(checkBreaks, 10000); // Check every 10 seconds to be more responsive
    return () => clearInterval(interval);
  }, [currentUser.role, showToast]);

  const handlePunchInClick = async () => {
    if (isPunchingInRef.current) return;
    isPunchingInRef.current = true;
    setIsPunchingIn(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/punch-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.employeeId }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to punch in.", "error");
        setIsPunchingIn(false);
        return;
      }
      
      punchIn();
      showToast("✓ Punched In successfully!", "success");
    } catch (e) {
      showToast("Network error while punching in.", "error");
    } finally {
      isPunchingInRef.current = false;
      setIsPunchingIn(false);
    }
  };

  const handlePunchOutClick = async () => {
    const res = punchOut();
    if (res.requiresConfirmation) {
      setIsPunchOutConfirmOpen(true);
      setIsBreakSheetOpen(false); // close break sheet if open
    } else {
      try {
        await fetch("/crmtesting/api/attendance/punch-out-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: currentUser.employeeId, reason: "" }), // Assume 8+ hours
        });
      } catch (e) {}
      showToast("✓ Punched Out for today. Day complete!", "success");
    }
  };

  const handleConfirmPunchOutAnyway = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!punchOutReason.trim()) {
      showToast("Please provide a reason for leaving early.", "error");
      return;
    }
    
    try {
      const response = await fetch("/crmtesting/api/attendance/punch-out-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.employeeId, reason: punchOutReason }),
      });
      const data = await response.json();
      
      if (data.success) {
        markPunchOutPending();
        setIsPunchOutConfirmOpen(false);
        showToast("Punch out request submitted for admin approval.", "info");
      } else {
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch (e) {
      showToast("Error submitting request", "error");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090F1D]/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs dark:shadow-2xl transition-all shrink-0 h-16 w-full">
      {/* Left Brand Logo & Context */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Menu Toggle Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 touch-target"
            title="Toggle Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <Link href="/owner" className="flex items-center gap-3 select-none group">
          <img src="/crmtesting/ess-logo.png" alt="ESS Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-all" />
          <span className="font-extrabold text-base sm:text-lg tracking-wider text-slate-900 dark:text-slate-100 uppercase font-sans flex items-center gap-1.5">
            <span className="md:hidden">ESS</span>
            <span className="hidden md:inline font-bold">ESS <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">OS</span></span>
          </span>
        </Link>
      </div>

      {/* Center Search Shortcut (Desktop only - flexible container so it never overlaps controls) */}
      <button
        onClick={onOpenSearch}
        className="hidden lg:flex items-center justify-between max-w-xs xl:max-w-sm w-full mx-4 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-indigo-500/40 text-xs transition-all shadow-xs dark:shadow-lg group shrink"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          <span className="font-sans truncate">Search Leads, Projects, Employees...</span>
        </div>
        <kbd className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0 ml-2">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls & Live Work Session Stopwatch (Always shrink-0, never overlapped) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
        {/* Work Clock Controls Bar */}
        {currentUser.role !== "OWNER" && (
        <div className="flex items-center gap-2 shrink-0">
          {status === "WORKING" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsBreakSheetOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm dark:shadow-lg dark:shadow-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all touch-target shrink-0"
                title="Click for Break & Session Controls"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="font-mono text-xs">{formatHMS(workSeconds)}</span>
              </button>

              <button
                onClick={handlePunchOutClick}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-600/20 active:scale-95 transition-all touch-target shrink-0"
                title="Punch Out for Today"
              >
                <Power className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Punch Out</span>
              </button>
            </div>
          )}

          {status === "ON_BREAK" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsBreakSheetOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-xs font-bold text-violet-700 dark:text-violet-400 shadow-sm dark:shadow-lg dark:shadow-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 active:scale-95 transition-all touch-target shrink-0"
                title="Click for Break Controls"
              >
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                <span className="font-mono text-xs">{formatHMS(breakSeconds)}</span>
              </button>

              <button
                onClick={resumeWork}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-600/20 active:scale-95 transition-all touch-target shrink-0"
                title="Resume Work Session"
              >
                <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="hidden sm:inline">Resume</span>
              </button>
            </div>
          )}

          {status === "NOT_PUNCHED_IN" && (
            <button
              onClick={handlePunchInClick}
              disabled={isPunchingIn}
              className={`px-4 py-1.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all touch-target shrink-0 ${isPunchingIn ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
              title="Punch In to Work Clock"
            >
              <Play className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>{isPunchingIn ? "Punching In..." : "Punch In"}</span>
            </button>
          )}

          {status === "DAY_COMPLETE" && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-extrabold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/80 cursor-not-allowed shrink-0 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Shift Complete</span>
            </div>
          )}
        </div>
        )}

        {/* Global Notifications for Owner */}
        <div className="hidden md:block shrink-0">
          <ThemeToggle />
        </div>

        {/* User Profile Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 transition-all active:scale-95 touch-target"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.name[0]}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-2 z-50 text-xs space-y-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{currentUser.email}</div>
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  {currentUser.role} ROLE
                </div>
              </div>

              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 md:hidden flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Appearance</span>
                <ThemeToggle />
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Break & Punch Out Bottom Sheet */}
      <BottomSheet
        isOpen={isBreakSheetOpen}
        onClose={() => setIsBreakSheetOpen(false)}
        title="Live Work Session Controls"
        subtitle={`Current Status: ${status === 'WORKING' ? 'Working (Stopwatch Active)' : 'On Break'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {status === "WORKING" ? "Active Work Duration" : `Break Duration (${breakType})`}
            </div>
            <div className="text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {status === "WORKING" ? formatHMS(workSeconds) : formatHMS(breakSeconds)}
            </div>
          </div>

          {status === "WORKING" ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Take a Break:</span>
              <div className="grid grid-cols-2 gap-2">
                {["Lunch", "Tea", "Client Call", "Meeting"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      startBreak(type);
                      setIsBreakSheetOpen(false);
                    }}
                    className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-900 dark:text-violet-300 font-semibold text-xs border border-violet-200 dark:border-violet-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Coffee className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handlePunchOutClick}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all mt-2"
              >
                <Power className="w-4 h-4" />
                <span>Punch Out for Today</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                resumeWork();
                setIsBreakSheetOpen(false);
              }}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Work Session</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Early Punch Out Reason Sheet */}
      <BottomSheet
        isOpen={isPunchOutConfirmOpen}
        onClose={() => setIsPunchOutConfirmOpen(false)}
        title="Early Punch Out Request"
        subtitle="You are leaving before completing 8 hours. Please provide a reason for admin approval."
      >
        <form onSubmit={handleConfirmPunchOutAnyway} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for leaving early
            </label>
            <input
              type="text"
              required
              value={punchOutReason}
              onChange={(e) => setPunchOutReason(e.target.value)}
              placeholder="e.g. Doctor's appointment, family emergency"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Power className="w-4 h-4" />
            <span>Submit Punch Out Request</span>
          </button>
        </form>
      </BottomSheet>
    </header>
  );
}
