"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  FileText,

  Clock,
  FolderKanban,
  Send,
  Plus,
  Sparkles,
} from "lucide-react";

export default function EmployeeDeskPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name ? session.user.name.split(" ")[0] : "Employee";
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const [tasks, setTasks] = useState<any[]>([]);

  const [notes, setNotes] = useState<any[]>([]);



  const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");


  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const now = new Date();
    setNotes([
      {
        id: Date.now().toString(),
        text: newNoteText,
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...notes,
    ]);
    setNewNoteText("");
    setIsNoteSheetOpen(false);
  };



  const toggleTaskStatus = (id: string, newStatus: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Mobile-Optimized Executive Page Header */}
      <PageHeader
        title={`${getGreeting()}, ${userName}`}
        description="Here is your personal work stack across assigned ESS projects today."
        badge={session?.user?.designation || "EMPLOYEE"}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNoteSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 touch-target"
            >
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>+ Add Note</span>
            </button>
          </div>
        }
      />

      {/* Section 1: Active Work Status Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-600 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">CURRENT WORK SESSION</span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/60 border border-indigo-400/40">
            02:14:37 Live
          </span>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">ABC E-Commerce Storefront</h2>
          <p className="text-xs text-indigo-100 mt-0.5">Currently working on: Payment Gateway & Webhook Signature Integration</p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNoteSheetOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quick Log Note</span>
          </button>
        </div>
      </div>

      {/* Section 2: Today Task Stack */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">My Today Task Stack</h2>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {tasks.length} TASKS
          </span>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                      {task.project}
                    </span>
                    {task.status === "IN_PROGRESS" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {task.status !== "DONE" ? (
                    <button
                      onClick={() => toggleTaskStatus(task.id, "DONE")}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors touch-target"
                      title="Mark Complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">✓ Done</span>
                  )}
                </div>
              </div>

              {task.blockedReason && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{task.blockedReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Work Log Notes */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Work Log Notes</h2>
          <button
            onClick={() => setIsNoteSheetOpen(true)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + Add Note
          </button>
        </div>

        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
            >
              <div className="text-slate-800 dark:text-slate-200 leading-relaxed">{note.text}</div>
              <div className="text-[10px] font-mono text-slate-400">{note.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Sheet: Add Note */}
      <BottomSheet
        isOpen={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        title="Add Quick Work Note"
        subtitle="Saved to your project work history log."
      >
        <form onSubmit={handleAddNote} className="space-y-4">
          <textarea
            required
            rows={4}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type your work log, test findings, or update..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs touch-target"
          >
            <Send className="w-4 h-4" />
            <span>Save Work Note</span>
          </button>
        </form>
      </BottomSheet>


    </div>
  );
}
