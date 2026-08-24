"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
export default function EmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [empName, setEmpName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("EMPLOYEE");

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-os/api/employees");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/mdz-os/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: empName, email, password, designation, role }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Employee profile for "${empName || 'New Employee'}" created`, "success");
        fetchEmployees();
        setIsAddOpen(false);
        setEmpName("");
        setEmail("");
        setPassword("");
        setDesignation("");
        setRole("EMPLOYEE");
      } else {
        if (res.status === 409) {
          showToast("Email already exists in the system", "error");
        } else {
          showToast(json.error || "Failed to create employee", "error");
        }
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Employees & HR Directory"
        description="Company workforce, designations, active task focus, and work logs."
        badge="WORKFORCE HUB"
        icon={<UserCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        }
      />
      {/* Employees Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading employee directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 flex flex-col justify-between group"
          >
            <Link href={`/employees/${emp.id}`} className="space-y-3 block">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-indigo-600/25">
                    {emp.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {emp.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {emp.employeeId}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {emp.designation} • {emp.department}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {emp.email}
                    </div>
                  </div>
                </div>

                {emp.punchedIn ? (
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>WORKING</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    OFFLINE
                  </span>
                )}
              </div>

              {/* Current Active Focus */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CURRENT FOCUS</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{emp.currentTask}</div>
              </div>
            </Link>

            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Assigned: <strong className="text-slate-800 dark:text-slate-200">{emp.assignedProjects.length} Projects</strong>
              </span>

              <Link
                href={`/employees/${emp.id}`}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all group-hover:translate-x-0.5"
              >
                <span>Employee 360°</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </Link>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Add Employee Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Employee Profile"
        subtitle="Provision employee ID and role context."
      >
        <form onSubmit={handleAddEmployee} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              placeholder="e.g. Ankit Sharma"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@mdzcompany.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Temporary Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Secure temporary password"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Designation</label>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Backend Developer"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">System Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
            >
              <option value="EMPLOYEE">Standard Employee</option>
              <option value="SALES">Sales Representative</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Create Employee Profile
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
