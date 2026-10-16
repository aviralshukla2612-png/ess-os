"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { RoleContext } from "@/lib/auth";
import { TimeReminders } from "@/components/ui/TimeReminders";
import { NotificationListener } from "@/components/ui/NotificationListener";
import { KycReminderPopup } from "@/components/ui/KycReminderPopup";
import { AttendanceAiAssistant } from "@/components/attendance/AttendanceAiAssistant";
import { Sparkles, Bot, MessageSquare } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  // If on login page, render full viewport without app shell
  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  const currentRole = (session?.user?.role || "EMPLOYEE") as RoleContext;

  return (
    <div className="bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-sans transition-colors relative">
      <TimeReminders />
      <NotificationListener />
      <KycReminderPopup />
      <TopLoadingBar />

      {/* Header */}
      <Header
        currentUser={{
          email: session?.user?.email || "",
          name: session?.user?.name || "User",
          role: currentRole,
          designation: "Employee",
          employeeId: session?.user?.employeeId || undefined,
          icon: null,
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogout={() => signOut({ callbackUrl: "/crmtesting/login" })}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Sidebar (Rendered outside to fix stacking context issues) */}
      {isMobileMenuOpen && (
        <Sidebar
          role={currentRole}
          isMobileOpen={true}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Body Layout: Desktop Fixed Sidebar + Main Scrollable Workspace */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <Sidebar
          role={currentRole}
          isMobileOpen={false}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-8">
          {children}
        </main>
      </div>

      {/* Floating CRM AI Assistant Bot Bubble (Visible on All Pages) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white font-bold text-xs rounded-full shadow-2xl shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-indigo-400/40 group"
          title="Ask CRM & Attendance AI"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-100 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse"></span>
          </div>
          <span className="tracking-tight font-semibold text-[13px]">Ask CRM AI</span>
        </button>
      </div>

      {/* Slide-out CRM & Attendance AI Assistant Drawer */}
      <AttendanceAiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
}
