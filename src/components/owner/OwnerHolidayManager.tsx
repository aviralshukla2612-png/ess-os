"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, PartyPopper } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function OwnerHolidayManager() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await fetch("/crmtesting/api/holidays");
      const json = await res.json();
      if (json.success && json.data) {
        setHolidays(json.data);
      }
    } catch (e) {
      console.error("Fetch holidays error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      showToast("Please provide both Title and Date for the holiday.", "error");
      return;
    }

    try {
      const res = await fetch("/crmtesting/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, description }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Declared Holiday "${title}" successfully!`, "success");
        setTitle("");
        setDate("");
        setDescription("");
        setIsAdding(false);
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to declare holiday", "error");
      }
    } catch (e) {
      showToast("Network error while declaring holiday", "error");
    }
  };

  const handleDeleteHoliday = async (id: string, holidayTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${holidayTitle}"?`)) return;

    try {
      const res = await fetch(`/crmtesting/api/holidays?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast(`Holiday "${holidayTitle}" removed.`, "success");
        fetchHolidays();
      } else {
        showToast(json.error || "Failed to delete holiday", "error");
      }
    } catch (e) {
      showToast("Network error while deleting holiday", "error");
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Company Holidays Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Declare official company holidays. Declared holidays automatically reflect across all employee calendars.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? "Cancel" : "Declare New Holiday"}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddHoliday} className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-4 text-xs">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">Declare Official Holiday</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Holiday Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Independence Day, Diwali, New Year"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Description / Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. National holiday - Office Closed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            Save & Publish Holiday
          </button>
        </form>
      )}

      {loading ? (
        <div className="p-6 text-center text-slate-500 animate-pulse">Loading holidays...</div>
      ) : holidays.length === 0 ? (
        <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
          No declared holidays yet. Click "Declare New Holiday" above to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {holidays.map((h) => {
            const hDate = new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
            return (
              <div key={h.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-slate-900 dark:text-slate-100">{h.title}</span>
                  </div>
                  <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{hDate}</div>
                  {h.description && <div className="text-slate-500 dark:text-slate-400 text-[11px]">{h.description}</div>}
                </div>
                <button
                  onClick={() => handleDeleteHoliday(h.id, h.title)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Remove Holiday"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
