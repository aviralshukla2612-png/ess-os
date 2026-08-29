"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckCircle, ShieldAlert, XCircle, UserCheck, Sparkles, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function LeaveRequestsPage() {
  const { showToast } = useToast();
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [resolvedLeaves, setResolvedLeaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Leave Settings
  const [employeesLeaves, setEmployeesLeaves] = useState<any[]>([]);
  const [isLeavesLoading, setIsLeavesLoading] = useState(false);
  const [saveLoadingId, setSaveLoadingId] = useState<string | null>(null);

  // Global Leave Settings
  const [globalSick, setGlobalSick] = useState("10");
  const [globalCasual, setGlobalCasual] = useState("15");
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    setIsLeavesLoading(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/leave/balances");
      const json = await res.json();
      if (json.success) {
        setEmployeesLeaves(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLeavesLoading(false);
    }
  };

  const handleApplyGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/leave/balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sickLeaveTotal: globalSick, 
          casualLeaveTotal: globalCasual 
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Successfully updated balances for ${json.count} employees`, "success");
        fetchLeaveBalances(); // Refresh the list
      } else {
        showToast(json.error || "Failed to update", "error");
      }
    } catch (e) {
      showToast("Error updating global balances", "error");
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const handleUpdateLeaveBalance = async (employeeId: string, updates: any) => {
    setSaveLoadingId(employeeId);
    try {
      const res = await fetch("/crmtesting/api/attendance/leave/balances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, ...updates })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Leave balances updated", "success");
      } else {
        showToast(json.error || "Failed to update", "error");
      }
    } catch (e) {
      showToast("Error updating leave balances", "error");
    } finally {
      setSaveLoadingId(null);
    }
  };

  const updateLocalLeave = (empId: string, field: string, value: string) => {
    setEmployeesLeaves(prev => prev.map(e => e.id === empId ? { ...e, [field]: value } : e));
  };

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/crmtesting/api/attendance/leave");
      const json = await res.json();
      if (json.success && Array.isArray(json.data.leaves)) {
        setPendingLeaves(json.data.leaves.filter((req: any) => req.status === "PENDING"));
        setResolvedLeaves(json.data.leaves.filter((req: any) => req.status !== "PENDING"));
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch leave requests", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReject = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/crmtesting/api/attendance/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }), 
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Leave request ${action.toLowerCase()}d.`, "success");
        fetchLeaves();
        fetchLeaveBalances(); // Automatically refresh the balances down below
      } else {
        showToast(json.error || "Action failed", "error");
      }
    } catch (e) {
      showToast("Error processing request", "error");
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <PageHeader
        title="Leave Applications"
        description="Review and approve employee leave requests."
        badge="ADMIN"
        icon={<UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Pending Leave Approvals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Employees requesting time off.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
            {pendingLeaves.length} PENDING
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-500 text-sm font-semibold">Loading requests...</div>
        ) : pendingLeaves.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
             <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
               <ShieldAlert className="w-8 h-8 text-slate-400 dark:text-slate-500" />
             </div>
             <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No pending leave requests at this time.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                      {p.leaveType}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.employee?.user?.name || "Employee"}</h3>
                    {p.employee && (
                      <span className="text-[10px] ml-2 text-slate-500">
                        Balances: 
                        Sick ({p.employee.sickLeaveTotal - p.employee.sickLeaveUsed}) | 
                        Casual ({p.employee.casualLeaveTotal - p.employee.casualLeaveUsed})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <strong>Duration:</strong> {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()} ({p.days} days)<br/>
                    <strong>Reason:</strong> {p.reason}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                    <span>Requested: {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {processingIds.has(p.id) ? (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Processing...
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Past leave applications.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {resolvedLeaves.length} RESOLVED
          </span>
        </div>

        {resolvedLeaves.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
             <div className="text-slate-500 dark:text-slate-400 font-semibold text-sm">No resolved requests yet.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedLeaves.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg opacity-80"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                      p.status === "APPROVED" 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" 
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                    }`}>
                      {p.status}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.employee?.user?.name || "Employee"}</h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    <strong>Type:</strong> {p.leaveType} ({p.days} days) <br/>
                    <strong>Dates:</strong> {new Date(p.startDate).toLocaleDateString()} to {new Date(p.endDate).toLocaleDateString()}<br/>
                    <strong>Reason:</strong> {p.reason}
                  </p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                    <span>Requested: {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Configurations */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Employee Leave Balances (Total vs Used)
          </h2>
        </div>

        {/* Global Setter */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Set Global Allowances</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Apply the same total leave allowances to all employees at once.</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Sick</label>
                <input 
                  type="number" 
                  value={globalSick} 
                  onChange={(e) => setGlobalSick(e.target.value)}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-sm text-center outline-none focus:border-indigo-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Casual</label>
                <input 
                  type="number" 
                  value={globalCasual} 
                  onChange={(e) => setGlobalCasual(e.target.value)}
                  className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-sm text-center outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
          </div>
          <button 
            onClick={handleApplyGlobal}
            disabled={isGlobalLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGlobalLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Apply to All
          </button>
        </div>

        {isLeavesLoading ? (
          <div className="text-sm font-semibold text-slate-500">Loading leave data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {employeesLeaves.map(emp => (
              <div key={emp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{emp.user?.name} <span className="font-normal text-slate-500 text-xs">({emp.user?.email})</span></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Sick Leave</label>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="w-8">Tot:</span>
                      <input 
                        type="number" 
                        value={emp.sickLeaveTotal} 
                        onChange={(e) => updateLocalLeave(emp.id, 'sickLeaveTotal', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="w-8">Usd:</span>
                      <input 
                        type="number" 
                        value={emp.sickLeaveUsed} 
                        onChange={(e) => updateLocalLeave(emp.id, 'sickLeaveUsed', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Casual Leave</label>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="w-8">Tot:</span>
                      <input 
                        type="number" 
                        value={emp.casualLeaveTotal} 
                        onChange={(e) => updateLocalLeave(emp.id, 'casualLeaveTotal', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div className="flex gap-2 items-center text-xs">
                      <span className="w-8">Usd:</span>
                      <input 
                        type="number" 
                        value={emp.casualLeaveUsed} 
                        onChange={(e) => updateLocalLeave(emp.id, 'casualLeaveUsed', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleUpdateLeaveBalance(emp.id, { 
                    sickLeaveTotal: emp.sickLeaveTotal, 
                    casualLeaveTotal: emp.casualLeaveTotal, 
                    sickLeaveUsed: emp.sickLeaveUsed,
                    casualLeaveUsed: emp.casualLeaveUsed
                  })}
                  disabled={saveLoadingId === emp.id}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex justify-center gap-2 items-center disabled:opacity-50"
                >
                  {saveLoadingId === emp.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Balances
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
