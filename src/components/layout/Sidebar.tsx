"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
  ShieldAlert,
  Settings,
  BookOpen,
  PhoneCall,
  FileText,
  Sparkles,
} from "lucide-react";

interface Props {
  role: RoleContext;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id?: string;
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  sectionHeader?: string;
}

export function Sidebar({ role, isMobileOpen = false, onCloseMobile }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchStr, setSearchStr] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setSearchStr(window.location.search);
    }
  }, [pathname]);

  const getNavItems = (): NavItem[] => {
    const ownerItems: NavItem[] = [
      { id: "overview", title: "Overview", href: "/owner", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "leads", title: "Sales & Leads", href: "/leads", icon: <Target className="w-4 h-4" /> },
      { id: "quotes", title: "Proposals / Quotes", href: "/quotes", icon: <FileText className="w-4 h-4" /> },
      { id: "clients", title: "Clients", href: "/clients", icon: <Users className="w-4 h-4" /> },
      { id: "projects", title: "Projects", href: "/projects", icon: <FolderKanban className="w-4 h-4" /> },
      { id: "employees", title: "Team", href: "/employees", icon: <UserCheck className="w-4 h-4" /> },
      { id: "attendance", title: "Attendance", href: "/attendance", icon: <Clock className="w-4 h-4" /> },
      { id: "attendance-requests", title: "Punch Out Requests", href: "/attendance-requests", icon: <Clock className="w-4 h-4" /> },
      { id: "leave-requests", title: "Leave Applications", href: "/leave-requests", icon: <UserCheck className="w-4 h-4" /> },
      { id: "finance", title: "Finance", href: "/finance", icon: <IndianRupee className="w-4 h-4" /> },
      { id: "audit", title: "Activity", href: "/audit", icon: <ShieldAlert className="w-4 h-4" /> },
      { id: "settings", title: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
    ];

    switch (role) {
      case "OWNER":
        return ownerItems;

      case "SUB_ADMIN": {
        const userPerms = (session?.user?.permissions as string[]) || [];

        // Delegated Admin permissions granted by Owner
        const delegatedAdminPerms: NavItem[] = [
          { id: "overview", title: "Overview", href: "/owner", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "leads", title: "Sales & Leads", href: "/leads", icon: <Target className="w-4 h-4" /> },
          { id: "quotes", title: "Proposals / Quotes", href: "/quotes", icon: <FileText className="w-4 h-4" /> },
          { id: "clients", title: "Clients", href: "/clients", icon: <Users className="w-4 h-4" /> },
          { id: "employees", title: "Team", href: "/employees", icon: <UserCheck className="w-4 h-4" /> },
          { id: "attendance", title: "Team Attendance", href: "/attendance?view=team", icon: <Clock className="w-4 h-4" /> },
          { id: "attendance-requests", title: "Punch Out Requests", href: "/attendance-requests", icon: <Clock className="w-4 h-4" /> },
          { id: "leave-requests", title: "Leave Approvals", href: "/leave-requests", icon: <UserCheck className="w-4 h-4" /> },
          { id: "finance", title: "Finance", href: "/finance", icon: <IndianRupee className="w-4 h-4" /> },
          { id: "audit", title: "Activity", href: "/audit", icon: <ShieldAlert className="w-4 h-4" /> },
        ];

        const grantedAdminItems = delegatedAdminPerms.filter((item) => item.id && userPerms.includes(item.id));

        const adminSection: NavItem[] = grantedAdminItems.map((item, idx) => ({
          ...item,
          sectionHeader: idx === 0 ? "DELEGATED CONTROLS" : undefined,
        }));

        // Personal employee tools (as requested: My Desk, My Projects, My Work Sessions, Leave Applications, Documentation, Settings)
        const personalItems: NavItem[] = [
          { title: "My Desk", href: "/employee", icon: <LayoutDashboard className="w-4 h-4" />, sectionHeader: grantedAdminItems.length > 0 ? "MY WORKSPACE" : undefined },
          { title: "My Projects", href: "/projects", icon: <FolderKanban className="w-4 h-4" /> },
          { title: "My Work Sessions", href: "/attendance?view=personal", icon: <Clock className="w-4 h-4" /> },
          { title: "Leave Applications", href: "/attendance/leave", icon: <UserCheck className="w-4 h-4" /> },
          { title: "Documentation", href: "/docs", icon: <BookOpen className="w-4 h-4" /> },
          { title: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
        ];

        return [...adminSection, ...personalItems];
      }

      case "SALES":
        return [
          { title: "Sales Overview", href: "/sales", icon: <LayoutDashboard className="w-4 h-4" /> },
          { title: "My Work Sessions", href: "/attendance", icon: <Clock className="w-4 h-4" /> },
          { title: "Leave Applications", href: "/attendance/leave", icon: <UserCheck className="w-4 h-4" /> },
          { title: "Lead Pipeline", href: "/leads", icon: <Target className="w-4 h-4" /> },
          { title: "Proposals / Quotes", href: "/quotes", icon: <FileText className="w-4 h-4" /> },
          { title: "Follow-ups Today", href: "/sales/followups", icon: <PhoneCall className="w-4 h-4" /> },
          { title: "Clients Directory", href: "/clients", icon: <Users className="w-4 h-4" /> },
          { title: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
        ];

      case "EMPLOYEE":
        return [
          { title: "My Desk", href: "/employee", icon: <LayoutDashboard className="w-4 h-4" /> },
          { title: "My Projects", href: "/projects", icon: <FolderKanban className="w-4 h-4" /> },
          { title: "My Work Sessions", href: "/attendance", icon: <Clock className="w-4 h-4" /> },
          { title: "Leave Applications", href: "/attendance/leave", icon: <UserCheck className="w-4 h-4" /> },
          { title: "Documentation", href: "/docs", icon: <BookOpen className="w-4 h-4" /> },
          { title: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
        ];

      case "CLIENT":
        return [
          { title: "Project Overview", href: "/portal/demo-token-abc", icon: <FolderKanban className="w-4 h-4" /> },
          { title: "Scope & Milestones", href: "/portal/demo-token-abc", icon: <UserCheck className="w-4 h-4" /> },
          { title: "Published Updates", href: "/portal/demo-token-abc", icon: <BookOpen className="w-4 h-4" /> },
          { title: "Payments & Invoices", href: "/portal/demo-token-abc", icon: <IndianRupee className="w-4 h-4" /> },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Find the most specific active item
  const activeItem = navItems.reduce((best, item) => {
    const [itemPath, itemQuery] = item.href.split("?");
    const isPathMatch =
      pathname === itemPath ||
      (itemPath !== "/" && itemPath !== "/owner" && pathname.startsWith(itemPath + "/"));

    if (isPathMatch) {
      if (itemQuery) {
        if (searchStr.includes(itemQuery)) return item;
      } else {
        if (!best) return item;
      }
    }
    return best;
  }, null as NavItem | null);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md z-40 md:hidden"
        />
      )}

      <aside
        className={`w-64 bg-white/90 dark:bg-[#090F1D]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-4 select-none transition-all duration-300 shrink-0 h-full overflow-y-auto ${
          isMobileOpen
            ? "fixed inset-y-0 left-0 shadow-2xl z-50 flex md:hidden animate-slide-right"
            : "hidden md:flex z-30"
        }`}
      >
        <div className="space-y-6">
          {/* Navigation Group Header */}
          <div className="px-3 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <span className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase font-mono">
              {role === "SUB_ADMIN" ? "SUB-ADMIN" : role} WORKSPACE
            </span>
            {isMobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Items with Active Indicator Bar */}
          <nav className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = activeItem?.href === item.href;

              return (
                <React.Fragment key={item.href + index}>
                  {item.sectionHeader && (
                    <div className="pt-3 pb-1 px-3">
                      <div className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase font-mono border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                        {item.sectionHeader}
                      </div>
                    </div>
                  )}
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs dark:shadow-lg border border-indigo-200 dark:border-indigo-500/30 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-indigo-600 dark:before:bg-indigo-500 before:rounded-r-full"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-400"}>{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Footer Banner */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 backdrop-blur-xl shadow-xs dark:shadow-xl">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span>ESS Smart OS</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Project-Centered architecture with immutable audit history.
          </p>
        </div>
      </aside>
    </>
  );
}
