"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { CalendarDatePicker } from "@/components/ui/CalendarDatePicker";

export function OwnerAttendanceHistory() {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(true);

  // Fetch employee list once
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/crmtesting/api/employees");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // data contains { id, name, employeeId, ... }
          setEmployees(json.data);
        }
      } catch (e) {
        console.error("Failed to fetch employees", e);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch history when filters change
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        let url = `/crmtesting/api/attendance/history?employeeId=${selectedEmployee}`;
        
        if (startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setAttendanceRecords(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedEmployee, startDate, endDate]);

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 gap-4">
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Global Attendance History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">View past punch records for the entire team.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {/* Employee Filter */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="ALL">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* Date Picker */}
          <CalendarDatePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="p-3 font-semibold rounded-l-xl">Employee</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Punch In</th>
              <th className="p-3 font-semibold">Punch Out</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold rounded-r-xl">Total Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500 font-medium animate-pulse">
                  Loading records...
                </td>
              </tr>
            ) : attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No attendance records found for this criteria.
                </td>
              </tr>
            ) : (
              attendanceRecords.map((record) => {
                const formatTime = (isoString: string) => {
                  if (!isoString) return "--";
                  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                };
                const formatDate = (isoString: string) => {
                  return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                };
                const formatMins = (mins: number) => {
                  if (!mins) return "--";
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return `${h}h ${m}m`;
                };
                return (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {record.employee?.user?.name || "Unknown"}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(record.date)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {formatTime(record.punchIn)}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                      {formatTime(record.punchOut)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        record.status === "PRESENT" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        record.status === "LATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {record.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatMins(record.totalMinutes)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
