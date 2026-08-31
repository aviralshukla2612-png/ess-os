"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { UserCheck, Calendar, Clock, Plus, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";
import { useSession } from "next-auth/react";

export default function EmployeeLeavePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const employeeId = session?.user?.employeeId;

  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [leaveType, setLeaveType] = useState("SICK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (e >= s) {
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays.toString());
      } else {
        setDays("0");
      }
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaves();
    }
  }, [employeeId]);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/crmtesting/api/attendance/leave?employeeId=${employeeId}`);
      const json = await res.json();
      if (json.success) {
        setLeaves(json.data.leaves);
        setBalances(json.data.balances);
      }
    } catch (e) {
      showToast("Failed to fetch leaves", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason || !days) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          leaveType,
          startDate,
          endDate,
          days,
          reason,
        }),
      });
      const json = await res.json();

      if (json.success) {
        showToast("Leave request submitted successfully", "success");
        fetchLeaves(); // Refresh the list
        setReason("");
      } else {
        showToast(json.error || "Failed to submit leave request", "error");
      }
    } catch (e) {
      showToast("Error submitting leave request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <PageHeader
        title="Leave Applications"
        description="Apply for leave and view your leave balances."
        icon={<UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* Balances Section */}
      {balances && (
        <div className="grid grid-cols-2 gap-4">
          <BalanceCard 
            title="Sick Leave" 
            used={balances.sickLeaveUsed} 
            total={balances.sickLeaveTotal} 
            colorClass="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" 
          />
          <BalanceCard 
            title="Casual Leave" 
            used={balances.casualLeaveUsed} 
            total={balances.casualLeaveTotal} 
            colorClass="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-indigo-500" /> New Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      calculateDays(e.target.value, endDate);
                    }}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      calculateDays(startDate, e.target.value);
                    }}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Days</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="e.g. 1 or 0.5"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason for leave..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Submit Request"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6 min-h-full">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" /> Past Requests
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-slate-500 text-sm font-semibold">Loading history...</div>
            ) : leaves.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                 <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No leave requests found.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {leaves.map((l) => (
                  <div key={l.id} className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                          l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                          'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                        }`}>
                          {l.status}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{l.leaveType} LEAVE</h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()} ({l.days} days)
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Reason: {l.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceCard({ title, used, total, colorClass }: { title: string, used: number, total: number, colorClass: string }) {
  const remaining = total - used;
  return (
    <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-3 shadow-sm ${colorClass}`}>
      <div className="font-bold text-sm">{title}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold">{remaining}</span>
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Left</span>
      </div>
      <div className="text-xs font-semibold opacity-80 pt-2 border-t border-current/10 flex justify-between">
        <span>Used: {used}</span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
}
