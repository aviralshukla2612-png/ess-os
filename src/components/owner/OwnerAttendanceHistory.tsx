"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Trash2,
  Coffee,
  ArrowUpRight,
  Filter,
  FileDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AttendanceAiAssistant } from "@/components/attendance/AttendanceAiAssistant";

export function OwnerAttendanceHistory({ inspectedEmployee = "ALL" }: { inspectedEmployee?: string }) {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedBreaks, setSelectedBreaks] = useState<any[]>([]);
  const [isBreakSheetOpen, setIsBreakSheetOpen] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [inspectedEmployee, startDate, endDate, department, statusFilter]);

  // Fetch history when filters or page changes
  useEffect(() => {
    if (!startDate || !endDate) return;

    const controller = new AbortController();

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (inspectedEmployee && inspectedEmployee !== "ALL") {
          queryParams.append("employeeId", inspectedEmployee);
        }
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        if (department && department !== "ALL") queryParams.append("departmentId", department);
        if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter);
        queryParams.append("page", page.toString());
        queryParams.append("limit", limit.toString());

        const res = await fetch(`/crmtesting/api/attendance?${queryParams.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setAttendanceRecords(json.data);
          if (json.pagination) {
            setTotalPages(json.pagination.totalPages || 1);
            setTotalRecords(json.pagination.total || json.data.length);
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
        console.error("Attendance history fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      controller.abort();
    };
  }, [inspectedEmployee, startDate, endDate, department, statusFilter, page, limit]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return;

    try {
      const res = await fetch(`/crmtesting/api/attendance/history/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceRecords((prev) => prev.filter((record) => record.id !== id));
      } else {
        alert("Failed to delete record: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting record");
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (inspectedEmployee && inspectedEmployee !== "ALL") params.append("employeeId", inspectedEmployee);
      if (department && department !== "ALL") params.append("departmentId", department);

      const url = `/crmtesting/api/attendance/reports/pdf?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `attendance-report-${startDate || "all"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error downloading attendance PDF report.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Workforce Attendance & Audit History
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {totalRecords} Total Shifts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time verified punch logs, work durations, and break timelines.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Assistant</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 font-bold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-500" />
            <span>{downloadingPdf ? "Exporting PDF..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Design">Design</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Management">Management</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late Arrivals</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="HALF_DAY">Half Day</option>
            </select>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <CalendarDatePicker
            startDate={startDate}
            endDate={endDate}
            align="right"
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="p-3 font-semibold">Employee</th>
              <th className="p-3 font-semibold">Department</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Punch In</th>
              <th className="p-3 font-semibold">Punch Out</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Work Hours</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium animate-pulse">
                  Loading verified attendance records...
                </td>
              </tr>
            ) : attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                  <div className="max-w-xs mx-auto space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>No attendance records found matching this criteria.</div>
                    <p className="text-[11px] text-slate-400">Try adjusting the date range or filters above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record) => {
                const empName = record.employeeName || record.employee?.user?.name || "Unknown";
                const empCode = record.employeeCode || record.employee?.employeeIdCode || "";
                const dept = record.department || record.employee?.user?.department || "General";

                return (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <Link
                        href={`/employees/${record.employeeId || record.employee?.id}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors inline-flex items-center gap-1.5"
                      >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {empName[0]}
                        </div>
                        <div>
                          <div>{empName}</div>
                          {empCode && <div className="text-[10px] font-mono text-slate-400">{empCode}</div>}
                        </div>
                      </Link>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {dept}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {record.punchIn || "--:--"}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {record.punchOut || "--:--"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          record.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : record.status === "LATE" || record.isLate
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {record.isLate && record.status === "PRESENT" ? "LATE" : record.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {record.workHours || `${Math.floor((record.totalMinutes || 0) / 60)}h ${(record.totalMinutes || 0) % 60}m`}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedBreaks(record.breakEvents || []);
                            setSelectedEmployeeName(empName);
                            setIsBreakSheetOpen(true);
                          }}
                          className="p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded transition-colors"
                          title="View Break Details"
                        >
                          <Coffee className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div>
          Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{page}</span> of{" "}
          <span className="font-bold text-slate-800 dark:text-slate-200">{totalPages}</span> ({totalRecords} records)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Break Details Sheet */}
      <BottomSheet
        isOpen={isBreakSheetOpen}
        onClose={() => setIsBreakSheetOpen(false)}
        title="Break Details"
        subtitle={`Breaks for ${selectedEmployeeName}`}
      >
        <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
          {selectedBreaks.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs">
              No breaks recorded for this day.
            </div>
          ) : (
            selectedBreaks.map((b) => {
              const formatTime = (dateStr: string) =>
                dateStr
                  ? new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "--";
              const duration = b.endedAt
                ? Math.round((new Date(b.endedAt).getTime() - new Date(b.startedAt).getTime()) / 60000)
                : "Ongoing";
              return (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {b.statusType.toLowerCase()}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono">
                      {formatTime(b.startedAt)} - {formatTime(b.endedAt)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {duration} {typeof duration === "number" ? "mins" : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>

      {/* AI Assistant Modal Drawer */}
      <AttendanceAiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
}
