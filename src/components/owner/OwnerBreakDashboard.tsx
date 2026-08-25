"use client";

import React, { useEffect, useState } from "react";
import { Coffee, Clock, CheckCircle2 } from "lucide-react";

export function OwnerBreakDashboard() {
  const [breaks, setBreaks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreaks = async () => {
      try {
        const res = await fetch("/ess-crm/api/attendance/breaks/today");
        const json = await res.json();
        if (json.success && json.data) {
          setBreaks(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchBreaks();
    const interval = setInterval(fetchBreaks, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Coffee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Today's Employee Breaks
        </h2>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Live Tracking
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading break data...</div>
      ) : breaks.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-xl text-center text-slate-500">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No Breaks Yet</h3>
          <p>No employees have taken a break today.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {breaks.map((b) => {
            const name = b.employee?.user?.name || "Unknown Employee";
            const type = b.statusType || "Break";
            const reason = b.notes || "No reason provided";
            const started = new Date(b.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const ended = b.endedAt ? new Date(b.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
            
            let durationStr = "Ongoing";
            if (b.endedAt) {
              const startMs = new Date(b.startedAt).getTime();
              const endMs = new Date(b.endedAt).getTime();
              const mins = Math.round((endMs - startMs) / 60000);
              durationStr = `${mins} min`;
            }

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    ended 
                      ? "bg-slate-50 dark:bg-slate-800 text-slate-500" 
                      : "bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"
                  }`}>
                    {ended ? <CheckCircle2 className="w-6 h-6" /> : <Coffee className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{name}</h4>
                      {!ended && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                          Active Now
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{type}</span> • {reason}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {durationStr}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                    {started} {ended ? `- ${ended}` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
