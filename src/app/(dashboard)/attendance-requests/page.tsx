"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckCircle, Clock, Power, ShieldAlert, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AttendanceRequestsPage() {
  const { showToast } = useToast();
  const [pendingPunchOuts, setPendingPunchOuts] = useState<any[]>([]);
  const [resolvedPunchOuts, setResolvedPunchOuts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingPunchOuts();
  }, []);

  const fetchPendingPunchOuts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/pending-punch-outs");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPendingPunchOuts(json.data.filter((req: any) => req.punchOutRequestStatus === "PENDING"));
        setResolvedPunchOuts(json.data.filter((req: any) => req.punchOutRequestStatus !== "PENDING"));
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch pending requests", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReject = async (attendanceId: string, action: "APPROVE" | "REJECT") => {
    setProcessingIds(prev => new Set(prev).add(attendanceId));
    try {
      const res = await fetch("/crmtesting/api/attendance/admin/approve-punch-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, action, adminId: "EMP-001" }), // Mock admin id
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Punch out request ${action.toLowerCase()}d.`, "success");
        fetchPendingPunchOuts();
      } else {
        showToast(json.error || "Action failed", "error");
      }
    } catch (e) {
      showToast("Error processing request", "error");
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <PageHeader
        title="Early Punch-Out Requests"
        description="Review and approve early departure requests from employees."
        badge="ADMIN"
        icon={<Power className="w-7 h-7 text-orange-600 dark:text-orange-400" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Pending Approvals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Employees requesting to end shift before 8 hours.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
            {pendingPunchOuts.length} PENDING
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-500 text-sm font-semibold">Loading requests...</div>
        ) : pendingPunchOuts.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
               <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-500" />
             </div>
             <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No pending punch out requests at this time.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPunchOuts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                      URGENT
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Early Punch Out: {p.employee?.user?.name || "Employee"}</h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <strong>Reason:</strong> {p.punchOutReason}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                    <span>Requested: {new Date(p.punchOutRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {processingIds.has(p.id) ? (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Issue Addressed
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApproveReject(p.id, "APPROVE")}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleApproveReject(p.id, "REJECT")}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Requests Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Resolved Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Past early punch-out requests you have addressed.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {resolvedPunchOuts.length} RESOLVED
          </span>
        </div>

        {resolvedPunchOuts.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
             <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No resolved requests yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedPunchOuts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg opacity-80"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                      p.punchOutRequestStatus === "APPROVED" 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                    }`}>
                      {p.punchOutRequestStatus}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.employee?.user?.name || "Employee"}</h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <strong>Reason:</strong> {p.punchOutReason}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                    <span>Requested: {new Date(p.punchOutRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
