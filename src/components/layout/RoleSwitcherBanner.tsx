"use client";

import React from "react";
import { RoleContext } from "@/lib/auth";

export interface DemoUser {
  email: string;
  name: string;
  role: RoleContext;
  designation: string;
  icon: string | null;
}

const DEMO_USERS: DemoUser[] = [
  { email: "owner@emperorsmart.com", name: "Rahul Emperor", role: "OWNER", designation: "Founder & CEO (Owner Command Center)", icon: "👑" },
  { email: "karan@emperorsmart.com", name: "Karan Verma", role: "SALES", designation: "Head of Sales (CRM Pipeline)", icon: "💼" },
  { email: "meet.lead@emperorsmart.com", name: "Meet Shah", role: "EMPLOYEE", designation: "Tech Lead (TM for Project ABC)", icon: "🚀" },
  { email: "dev.patel@emperorsmart.com", name: "Dev Patel", role: "EMPLOYEE", designation: "Full-Stack Dev (Member for Project ABC)", icon: "💻" },
  { email: "priya.ux@emperorsmart.com", name: "Priya Desai", role: "EMPLOYEE", designation: "UI/UX Lead", icon: "🎨" },
  { email: "rajesh@abcretailers.com", name: "Rajesh Mehta", role: "CLIENT", designation: "Client CEO (Isolated Safe Portal)", icon: "🔒" },
];

interface Props {
  activeEmail: string;
  onSwitchUser: (user: DemoUser) => void;
}

export function RoleSwitcherBanner({ activeEmail, onSwitchUser }: Props) {
  const currentUser = DEMO_USERS.find((u) => u.email === activeEmail) || DEMO_USERS[0];

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-3 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          DEMO SWITCHER
        </span>
        <span className="text-slate-400 font-medium">
          Active Identity: <strong className="text-white">{currentUser.name}</strong> ({currentUser.designation})
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {DEMO_USERS.map((user) => {
          const isActive = user.email === activeEmail;
          return (
            <button
              key={user.email}
              onClick={() => onSwitchUser(user)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              }`}
            >
              <span>{user.name}</span>
              <span className="opacity-60 text-[9px]">({user.role})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
