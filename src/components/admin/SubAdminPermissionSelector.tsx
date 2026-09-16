"use client";

import React from "react";
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  Users, 
  FolderKanban, 
  UserCheck, 
  Clock, 
  IndianRupee, 
  ShieldAlert, 
  Settings, 
  Check, 
  CheckSquare, 
  Square,
  Shield
} from "lucide-react";
import { SUB_ADMIN_MODULES, SubAdminModuleItem } from "@/lib/subAdminModules";

interface SubAdminPermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export function SubAdminPermissionSelector({
  selectedPermissions,
  onChange,
}: SubAdminPermissionSelectorProps) {
  const getModuleIcon = (id: string) => {
    switch (id) {
      case "overview":
        return <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case "leads":
        return <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case "quotes":
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "clients":
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "projects":
        return <FolderKanban className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case "employees":
        return <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "attendance":
        return <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case "attendance-requests":
        return <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "leave-requests":
        return <UserCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
      case "finance":
        return <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "audit":
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "settings":
        return <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      default:
        return <Shield className="w-4 h-4 text-indigo-600" />;
    }
  };

  const handleToggle = (id: string) => {
    if (selectedPermissions.includes(id)) {
      onChange(selectedPermissions.filter((p) => p !== id));
    } else {
      onChange([...selectedPermissions, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(SUB_ADMIN_MODULES.map((m) => m.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isAllSelected = selectedPermissions.length === SUB_ADMIN_MODULES.length;

  return (
    <div className="space-y-3 pt-2">
      {/* Header & Quick Action Toggles */}
      <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Admin Module Permissions</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-800">
                {selectedPermissions.length} of {SUB_ADMIN_MODULES.length} active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select which Admin sidebar sides & tasks this Sub-Admin can manage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={isAllSelected ? handleClearAll : handleSelectAll}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of 12 Selectable Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
        {SUB_ADMIN_MODULES.map((mod) => {
          const isSelected = selectedPermissions.includes(mod.id);

          return (
            <div
              key={mod.id}
              onClick={() => handleToggle(mod.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 relative ${
                isSelected
                  ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 shadow-xs ring-1 ring-indigo-500/20"
                  : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
              }`}
            >
              {/* Checkbox Icon */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Icon & Label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="shrink-0">{getModuleIcon(mod.id)}</div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {mod.title}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {mod.description}
                </p>
                <span className="inline-block mt-1 font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                  {mod.href}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
