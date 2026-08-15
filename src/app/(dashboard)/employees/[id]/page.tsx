"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePrototypeStore } from "@/lib/prototypeStore";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  ArrowLeft,
  UserCheck,
  Clock,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Mail,
  Phone,
  Building,
  Sparkles,
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { employees, getEmployeeById, projects } = usePrototypeStore();
  const { showToast } = useToast();

  const employee = getEmployeeById(params.id) || employees[3]; // Default Dev Patel
  const assignedProjs = projects.filter((p) => employee.assignedProjects.includes(p.id));

  const [activeTab, setActiveTab] = useState<"timeline" | "projects" | "attendance" | "help">("timeline");

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Directory</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {employee.employeeId}
        </span>
      </div>

      {/* Employee Hero Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
              {employee.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {employee.role}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {employee.department}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {employee.name}
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {employee.designation} • {employee.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {employee.punchedIn ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>● Working · Punched In at {employee.punchInTime}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                Not Punched In Today
              </span>
            )}
          </div>
        </div>

        {/* Current Active Focus Pill */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300">
            <span>CURRENT FOCUS TASK</span>
            <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-400">{employee.currentProject}</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            "{employee.currentTask}"
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "timeline", label: `Today Work History (${employee.todayTimeline.length})` },
          { id: "projects", label: `Assigned Projects (${assignedProjs.length})` },
          { id: "attendance", label: `Attendance Records (${employee.attendanceRecord.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Today Work History Timeline ("Who worked on what, when, and for how long?") */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Granular Work Execution Log</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              TODAY'S TOTAL: 4h 15m
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {employee.todayTimeline.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.timeRange}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.project}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.activity}</div>
                </div>

                <div className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 text-center sm:text-right">
                  ⏱️ {item.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Projects */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedProjs.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">{p.id}</span>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{p.name}</h4>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">🏢 {p.clientName}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress: <strong className="text-slate-800 dark:text-slate-200 font-mono">{p.progress}%</strong></span>
                <Link
                  href={`/projects/${p.id}`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Open Project Workspace
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Attendance Records */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance & Punch Log</h3>
          <div className="space-y-2 text-xs">
            {employee.attendanceRecord.map((rec, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{rec.date}</span>
                  <span className="text-slate-400 ml-3">In: {rec.punchIn} • Out: {rec.punchOut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.workHours}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
