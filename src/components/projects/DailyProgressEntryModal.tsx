"use client";

import React, { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  FolderKanban,
  FileText,
  ShieldAlert,
} from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  projectCode?: string;
  clientName?: string;
}

interface DailyProgressEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  fixedProject?: ProjectOption;
  availableProjects?: ProjectOption[];
}

export function DailyProgressEntryModal({
  isOpen,
  onClose,
  onSuccess,
  fixedProject,
  availableProjects = [],
}: DailyProgressEntryModalProps) {
  const { showToast } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    fixedProject?.id || (availableProjects.length > 0 ? availableProjects[0].id : "")
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blockers, setBlockers] = useState("");
  const [healthStatus, setHealthStatus] = useState<"ON_TRACK" | "AT_RISK" | "BLOCKED">("ON_TRACK");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBlockerInput, setShowBlockerInput] = useState(false);

  // Sync selected project if fixedProject or availableProjects change
  React.useEffect(() => {
    if (fixedProject?.id) {
      setSelectedProjectId(fixedProject.id);
    } else if (availableProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(availableProjects[0].id);
    }
  }, [fixedProject, availableProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjectId = fixedProject?.id || selectedProjectId;

    if (!targetProjectId) {
      showToast("Please select a project to post progress for", "error");
      return;
    }

    if (!title.trim()) {
      showToast("Please enter an update summary headline", "error");
      return;
    }

    if (!content.trim()) {
      showToast("Please enter detailed work notes", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/crmtesting/api/projects/${targetProjectId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          blockers: blockers.trim() || undefined,
          healthStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Daily progress report published & team notified", "success");
        setTitle("");
        setContent("");
        setBlockers("");
        setHealthStatus("ON_TRACK");
        setShowBlockerInput(false);
        onClose();
        onSuccess?.();
      } else {
        showToast(json.error || "Failed to post daily update", "error");
      }
    } catch (err) {
      showToast("An unexpected error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProjectName =
    fixedProject?.name ||
    availableProjects.find((p) => p.id === selectedProjectId)?.name ||
    "Project Workspace";

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Post Daily Progress Update"
      subtitle={`Submit your work summary and achievements for ${currentProjectName}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Project Selector (if not fixed) */}
        {!fixedProject && (
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Select Project Workspace *
            </label>
            <select
              required
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            >
              {availableProjects.length === 0 ? (
                <option value="">-- No Projects Available --</option>
              ) : (
                availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode ? `[${p.projectCode}] ` : ""}
                    {p.name} {p.clientName ? `(${p.clientName})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Health Status Pills */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-2">
            Execution Health Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setHealthStatus("ON_TRACK")}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                healthStatus === "ON_TRACK"
                  ? "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>On Track</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHealthStatus("AT_RISK");
                setShowBlockerInput(true);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                healthStatus === "AT_RISK"
                  ? "bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Minor Risk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHealthStatus("BLOCKED");
                setShowBlockerInput(true);
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                healthStatus === "BLOCKED"
                  ? "bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <span>Blocked</span>
            </button>
          </div>
        </div>

        {/* Update Headline */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
            Summary Headline *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Completed Checkout Webhook Integration & Fixed Cart Glitch"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Detailed Work Notes */}
        <div>
          <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
            Detailed Work Notes & Changelog *
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="• Built Stripe webhook endpoint handler&#10;• Refactored responsive layout in navbar&#10;• Tested edge-cases on mobile Safari"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono leading-relaxed text-[11px]"
          />
        </div>

        {/* Blockers & Flags Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Blockers / Dependencies (Optional)</span>
            </label>
            {!showBlockerInput && (
              <button
                type="button"
                onClick={() => setShowBlockerInput(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Add Blocker
              </button>
            )}
          </div>

          {showBlockerInput && (
            <textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="e.g. Awaiting client confirmation on payment gateway keys or Figma design approval..."
              className="w-full bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3 text-amber-900 dark:text-amber-200 outline-none focus:border-amber-500 transition-all text-[11px]"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <span>Publishing Report...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Publish Daily Report</span>
            </>
          )}
        </button>
      </form>
    </BottomSheet>
  );
}
