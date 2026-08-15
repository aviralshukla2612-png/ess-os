"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, badge, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="text-[11px] font-semibold font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
