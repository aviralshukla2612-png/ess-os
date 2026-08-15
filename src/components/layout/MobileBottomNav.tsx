"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RoleContext } from "@/lib/auth";
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
  UserCheck,
  Clock,
  HelpCircle,
  IndianRupee,
  PhoneCall,
  Menu,
} from "lucide-react";
import { useWorkClock } from "@/lib/workClockContext";

interface Props {
  role: RoleContext;
  onOpenMoreMenu?: () => void;
}

export function MobileBottomNav({ role, onOpenMoreMenu }: Props) {
  const pathname = usePathname();
  const { status } = useWorkClock();

  const getWorkLabel = () => {
    if (status === "WORKING") return "● Work";
    if (status === "ON_BREAK") return "◐ Break";
    return "Work";
  };

  const getMobileItems = () => {
    switch (role) {
      case "EMPLOYEE":
        return [
          { label: "Home", href: "/employee", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Projects", href: "/projects", icon: <FolderKanban className="w-5 h-5" /> },
          { label: getWorkLabel(), href: "/attendance", icon: <Clock className="w-5 h-5" /> },
          { label: "Help", href: "/employee/help", icon: <HelpCircle className="w-5 h-5" /> },
        ];
      case "SALES":
        return [
          { label: "Home", href: "/sales", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Pipeline", href: "/leads", icon: <Target className="w-5 h-5" /> },
          { label: "Calls", href: "/sales/followups", icon: <PhoneCall className="w-5 h-5" /> },
          { label: "Clients", href: "/clients", icon: <Users className="w-5 h-5" /> },
        ];
      case "OWNER":
        return [
          { label: "Overview", href: "/owner", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Sales", href: "/leads", icon: <Target className="w-5 h-5" /> },
          { label: "Projects", href: "/projects", icon: <FolderKanban className="w-5 h-5" /> },
          { label: "Team", href: "/employees", icon: <UserCheck className="w-5 h-5" /> },
        ];
      case "CLIENT":
        return [
          { label: "Portal", href: "/portal/demo-token-abc", icon: <FolderKanban className="w-5 h-5" /> },
          { label: "Scope", href: "/portal/demo-token-abc", icon: <UserCheck className="w-5 h-5" /> },
          { label: "Invoices", href: "/portal/demo-token-abc", icon: <IndianRupee className="w-5 h-5" /> },
        ];
    }
  };

  const items = getMobileItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-lg transition-colors">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/owner" && item.href !== "/employee" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all touch-target ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? "bg-indigo-50 dark:bg-indigo-950/60" : ""}`}>
              {item.icon}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      {/* More Menu Trigger */}
      {onOpenMoreMenu && (
        <button
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium touch-target"
        >
          <div className="p-1">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      )}
    </nav>
  );
}
