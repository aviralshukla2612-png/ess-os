"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Calendar,
  CreditCard,
  Building2,
  User,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

export function KycReminderPopup() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only check for authenticated employees/sub-admins when not already on KYC page or login
    if (
      status !== "authenticated" ||
      !session?.user ||
      pathname?.includes("/kyc") ||
      pathname?.includes("/login")
    ) {
      return;
    }

    // Check if dismissed in this browser session
    const isDismissed = sessionStorage.getItem("kyc_deadline_reminder_dismissed");
    if (isDismissed === "true") return;

    // Fetch user's KYC status
    const checkKycStatus = async () => {
      try {
        const res = await fetch("/crmtesting/api/kyc");
        const json = await res.json();
        if (json.success && json.data) {
          // If status is not approved, show the urgent reminder popup
          if (json.data.status === "NOT_SUBMITTED" || json.data.status === "REJECTED") {
            // Small delay for smooth entrance
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 1200);
            return () => clearTimeout(timer);
          }
        }
      } catch {
        // Ignored
      }
    };

    checkKycStatus();
  }, [session, status, pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("kyc_deadline_reminder_dismissed", "true");
  };

  const handleGoToKyc = () => {
    setIsOpen(false);
    sessionStorage.setItem("kyc_deadline_reminder_dismissed", "true");
    router.push("/kyc");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-amber-500 rounded-b-full shadow-lg shadow-amber-500/50" />

        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Urgency Tag */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Calendar className="w-3.5 h-3.5" />
            <span>MANDATORY DEADLINE: 23 SEPTEMBER</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            Action Required: Submit Your KYC Details
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md">
            As per organizational compliance and payroll policies, all team members are required to upload their identification and bank documents before <strong>23 September</strong>.
          </p>
        </div>

        {/* Required Documents Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Required Submissions:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <CreditCard className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Aadhaar Front & Back</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <CreditCard className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>PAN Card Document</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span>Passport Size Photo</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Bank A/C & Passbook Proof</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
          >
            Remind Me Later
          </button>
          <button
            onClick={handleGoToKyc}
            className="w-full sm:w-2/3 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Complete KYC Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
