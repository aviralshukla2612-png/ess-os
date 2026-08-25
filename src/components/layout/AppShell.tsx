"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { TopLoadingBar } from "@/components/ui/TopLoadingBar";
import { RoleContext } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If on login page, render full viewport without app shell
  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  const currentRole = (session?.user?.role || "EMPLOYEE") as RoleContext;

  return (
    <div className="bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-sans transition-colors relative">
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
        onLogout={() => signOut({ callbackUrl: "https://www.millionairedizital.com/ess-crm/login" })}
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
      <div className="flex flex-1 h-[calc(100vh-3.5rem)] relative">
        <Sidebar
          role={currentRole}
          isMobileOpen={false}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile App Bottom Navigation Bar */}
      <MobileBottomNav
        role={currentRole}
        onOpenMoreMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
