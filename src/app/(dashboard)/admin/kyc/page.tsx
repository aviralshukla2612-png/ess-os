"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  CreditCard,
  Building2,
  User,
  Camera,
  FileText,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Download,
} from "lucide-react";

interface EmployeeKycItem {
  id: string;
  employeeCode: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  avatarUrl?: string;
  activeRole: string;
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  kyc: {
    id?: string;
    status: string;
    aadharNumber?: string | null;
    aadharFrontUrl?: string | null;
    aadharBackUrl?: string | null;
    panNumber?: string | null;
    panCardUrl?: string | null;
    passportPhotoUrl?: string | null;
    selfieUrl?: string | null;
    bankName?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    bankProofUrl?: string | null;
    rejectionReason?: string | null;
    submittedAt?: string | null;
    reviewedAt?: string | null;
  };
}

export default function AdminKycPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeKycItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    notSubmitted: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Selected Employee Modal for Verification
  const [selectedEmp, setSelectedEmp] = useState<EmployeeKycItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchKycRecords();
  }, [statusFilter, departmentFilter]);

  const fetchKycRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (departmentFilter !== "ALL") params.append("department", departmentFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/crmtesting/api/admin/kyc?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setEmployees(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
      } else {
        showToast(json.error || "Failed to fetch KYC records", "error");
      }
    } catch {
      showToast("Error loading KYC data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKycRecords();
  };

  const handleReviewAction = async (action: "APPROVE" | "REJECT", customReason?: string) => {
    if (!selectedEmp) return;

    try {
      setActionLoading(true);
      const res = await fetch("/crmtesting/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          action,
          rejectionReason: customReason || rejectionReason,
        }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(action === "APPROVE" ? `Verified and Approved KYC for ${selectedEmp.name}` : `Rejected KYC for ${selectedEmp.name}`, "success");
        setRejectionModalOpen(false);
        setRejectionReason("");
        setSelectedEmp(null);
        fetchKycRecords();
      } else {
        showToast(json.error || "Failed to update KYC", "error");
      }
    } catch {
      showToast("Error updating KYC record", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastReminder = async () => {
    try {
      setBroadcasting(true);
      const res = await fetch("/crmtesting/api/admin/kyc/broadcast-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: "23 September" }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(json.message || "Broadcasted KYC deadline reminder (23 Sept) to all staff!", "success");
      } else {
        showToast(json.error || "Failed to broadcast reminder", "error");
      }
    } catch {
      showToast("Error sending broadcast reminder", "error");
    } finally {
      setBroadcasting(false);
    }
  };

  // Restrict view if user is not OWNER
  if (session && session.user?.role !== "OWNER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Only the organization Owner / Primary Administrator has permissions to view and verify employee KYC and financial documents.
        </p>
      </div>
    );
  }

  const departments = Array.from(new Set(employees.map((e) => e.department))).filter(Boolean);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Employee KYC & Verification Management"
          description="Verify employee identity documents, Aadhaar, PAN card, and official bank accounts for payroll."
          badge="ADMIN COMPLIANCE PORTAL"
          icon={<FileCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
        />
        <button
          onClick={handleBroadcastReminder}
          disabled={broadcasting}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 flex-shrink-0"
        >
          {broadcasting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>📢</span>}
          <span>Broadcast Reminder (23 Sept)</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* ALL STAFF */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
            statusFilter === "ALL"
              ? "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/60 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">All Staff</span>
            {statusFilter === "ALL" && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{metrics.total}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Roster</span>
        </div>

        {/* PENDING REVIEW */}
        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
            statusFilter === "PENDING"
              ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/15"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pending Review</span>
            <Clock className={`w-4 h-4 text-amber-500 ${statusFilter === "PENDING" ? "animate-spin" : ""}`} />
          </div>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-300 mt-2">{metrics.pending}</p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-medium">Action Required</span>
        </div>

        {/* APPROVED */}
        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
            statusFilter === "APPROVED"
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/60 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/15"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-300 mt-2">{metrics.approved}</p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-medium">Verified Identity</span>
        </div>

        {/* REJECTED */}
        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
            statusFilter === "REJECTED"
              ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/60 ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/15"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Rejected</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-300 mt-2">{metrics.rejected}</p>
          <span className="text-[10px] text-rose-700 dark:text-rose-400/80 font-medium">Needs Correction</span>
        </div>

        {/* NOT SUBMITTED */}
        <div
          onClick={() => setStatusFilter("NOT_SUBMITTED")}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
            statusFilter === "NOT_SUBMITTED"
              ? "bg-slate-800/60 dark:bg-slate-800/90 border-slate-500 ring-2 ring-slate-500/40 shadow-lg"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Not Submitted</span>
            {statusFilter === "NOT_SUBMITTED" && <span className="w-2 h-2 rounded-full bg-slate-400" />}
          </div>
          <p className="text-3xl font-black text-slate-700 dark:text-slate-300 mt-2">{metrics.notSubmitted}</p>
          <span className="text-[10px] text-slate-400 font-medium">Uninitialized</span>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, code, Aadhaar, PAN, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Dept:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NOT_SUBMITTED">Not Submitted</option>
            </select>
          </div>

          <button
            onClick={fetchKycRecords}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* EMPLOYEE LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department / Role</th>
                <th className="px-6 py-4">Aadhaar Status</th>
                <th className="px-6 py-4">PAN Card</th>
                <th className="px-6 py-4">Bank Details</th>
                <th className="px-6 py-4">KYC Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    No employee records match the filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const hasAadhaar = emp.kyc.aadharNumber || (emp.kyc.aadharFrontUrl && emp.kyc.aadharBackUrl);
                  const hasPan = emp.kyc.panNumber || emp.kyc.panCardUrl;
                  const hasBank = emp.kyc.accountNumber && emp.kyc.ifscCode;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 overflow-hidden flex-shrink-0">
                            {emp.kyc.passportPhotoUrl ? (
                              <img src={emp.kyc.passportPhotoUrl} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{emp.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{emp.employeeCode} • {emp.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.department}</p>
                        <p className="text-[11px] text-slate-500">{emp.designation}</p>
                      </td>

                      <td className="px-6 py-4">
                        {emp.kyc.aadharNumber ? (
                          <div>
                            <p className="font-mono font-semibold text-slate-900 dark:text-slate-100">{emp.kyc.aadharNumber}</p>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {emp.kyc.aadharFrontUrl && emp.kyc.aadharBackUrl ? "✓ Front & Back Attached" : "Partial Images"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {emp.kyc.panNumber ? (
                          <div>
                            <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{emp.kyc.panNumber}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              {emp.kyc.panCardUrl ? "✓ Photo Attached" : "No Photo"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {emp.kyc.accountNumber ? (
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{emp.kyc.bankName || "Bank"}</p>
                            <p className="text-[11px] font-mono text-slate-500">A/C: {emp.kyc.accountNumber}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {emp.status === "APPROVED" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        )}
                        {emp.status === "PENDING" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                        {emp.status === "REJECTED" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        )}
                        {emp.status === "NOT_SUBMITTED" && (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            Not Submitted
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedEmp(emp)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect & Verify</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL INSPECTION & VERIFICATION MODAL */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center overflow-hidden border border-indigo-200 dark:border-indigo-500/20">
                  {selectedEmp.kyc.passportPhotoUrl ? (
                    <img src={selectedEmp.kyc.passportPhotoUrl} alt={selectedEmp.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedEmp.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {selectedEmp.name}
                    <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {selectedEmp.employeeCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedEmp.designation} • {selectedEmp.department} • {selectedEmp.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Documents Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Live Selfie Verification */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-500" />
                      Live Selfie Photo
                    </span>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">Face Match</span>
                  </div>
                  {selectedEmp.kyc.selfieUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.selfieUrl!, title: `Live Selfie - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.selfieUrl} alt="Live Selfie" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No Selfie Uploaded
                    </div>
                  )}
                </div>

                {/* Passport Photo */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-500" />
                      Passport Photo
                    </span>
                    <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">Profile ID</span>
                  </div>
                  {selectedEmp.kyc.passportPhotoUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.passportPhotoUrl!, title: `Passport Photo - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.passportPhotoUrl} alt="Passport Photo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No Photo Uploaded
                    </div>
                  )}
                </div>

                {/* Aadhaar Front */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aadhaar Front</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{selectedEmp.kyc.aadharNumber || "No number"}</span>
                  </div>
                  {selectedEmp.kyc.aadharFrontUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.aadharFrontUrl!, title: `Aadhaar Front - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.aadharFrontUrl} alt="Aadhaar Front" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No Front Image Uploaded
                    </div>
                  )}
                </div>

                {/* Aadhaar Back */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Aadhaar Back</span>
                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">Address Proof</span>
                  </div>
                  {selectedEmp.kyc.aadharBackUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.aadharBackUrl!, title: `Aadhaar Back - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.aadharBackUrl} alt="Aadhaar Back" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No Back Image Uploaded
                    </div>
                  )}
                </div>

                {/* PAN Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">PAN Card Photo</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedEmp.kyc.panNumber || "No PAN"}</span>
                  </div>
                  {selectedEmp.kyc.panCardUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.panCardUrl!, title: `PAN Card - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.panCardUrl} alt="PAN Card" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No PAN Image Uploaded
                    </div>
                  )}
                </div>

                {/* Passbook Proof */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Passbook Proof</span>
                    <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Account Proof</span>
                  </div>
                  {selectedEmp.kyc.bankProofUrl ? (
                    <div
                      onClick={() => setPreviewImage({ url: selectedEmp.kyc.bankProofUrl!, title: `Bank Proof - ${selectedEmp.name}` })}
                      className="relative group rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <img src={selectedEmp.kyc.bankProofUrl} alt="Bank Proof" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400 italic">
                      No Bank Proof Uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Details Table */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  Bank Account Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Bank Name</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.kyc.bankName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Holder</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.kyc.accountHolderName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Account Number</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.kyc.accountNumber || "—"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">IFSC Code</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedEmp.kyc.ifscCode || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Remarks if already rejected */}
              {selectedEmp.kyc.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
                  <p className="font-bold">Previous Rejection Remarks:</p>
                  <p className="mt-0.5">{selectedEmp.kyc.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40">
              <div className="text-xs text-slate-500">
                Current Status: <strong className="uppercase text-slate-900 dark:text-slate-100">{selectedEmp.status}</strong>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRejectionModalOpen(true)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Reject with Remarks</span>
                </button>
                <button
                  onClick={() => handleReviewAction("APPROVE")}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                  <span>Approve All Documents</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REMARKS MODAL */}
      {rejectionModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Provide Rejection Reason for {selectedEmp.name}
            </h3>
            <p className="text-xs text-slate-500">
              This message will be shown directly to the employee so they can correct their documents.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Aadhaar back photo is blurry. Please upload clear copy with readable address."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewAction("REJECT", rejectionReason)}
                disabled={!rejectionReason.trim() || actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ENLARGE IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white">
              <h3 className="font-bold text-sm">{previewImage.title}</h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-[75vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
