"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  Settings,
  Save,
  Sparkles,
  Sliders,
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─── Inline Input Component ───────────────────────────────────────────────────
function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  rightElement,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed pr-10"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

// ─── Password Field with Show/Hide ────────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rightElement={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border ${
        isSuccess
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
          : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();

  // Company settings
  const [companyName, setCompanyName] = useState("MDZ Company");
  const [companySaved, setCompanySaved] = useState(false);

  const playbooks = [
    { name: "E-Commerce Website Playbook", stages: 6, code: "ECOM_WEB" },
    { name: "Custom SaaS Web Application Playbook", stages: 7, code: "SAAS_APP" },
    { name: "Mobile Application Playbook", stages: 5, code: "MOBILE_APP" },
    { name: "AI Workflow Automation Playbook", stages: 4, code: "AI_AUTO" },
  ];

  // ── Change Email ──
  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    setEmailLoading(true);

    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          currentPassword: emailForm.currentPassword,
          newValue: emailForm.newEmail,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setEmailStatus({ type: "success", msg: data.message });
        showToast("✅ Email updated! Please log in again.", "success");
        setEmailForm({ currentPassword: "", newEmail: "" });
        // Sign out so user re-authenticates with new email
        setTimeout(() => signOut({ callbackUrl: "/mdz-crm/login" }), 2500);
      } else {
        setEmailStatus({ type: "error", msg: data.error || "Failed to update email." });
      }
    } catch {
      setEmailStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Change Password ──
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          currentPassword: pwForm.currentPassword,
          newValue: pwForm.newPassword,
          confirmValue: pwForm.confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setPwStatus({ type: "success", msg: data.message });
        showToast("🔐 Password updated successfully!", "success");
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwStatus({ type: "error", msg: data.error || "Failed to update password." });
      }
    } catch {
      setPwStatus({ type: "error", msg: "Network error. Please try again." });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Settings"
        description="Manage your account credentials, company configuration, and project templates."
        badge="SYSTEM CONFIG"
        icon={<Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      {/* ── Account Credentials Section ────────────────────────────────────── */}
      <div>
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Account Credentials
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Logged in as{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {session?.user?.email || "you"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Change Email Card ─────────────────────────────────────────── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                Change Email Address
              </h3>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                IDENTITY
              </span>
            </div>

            <form onSubmit={handleEmailChange} className="space-y-4">
              <PasswordField
                label="Current Password"
                value={emailForm.currentPassword}
                onChange={(v) => setEmailForm((f) => ({ ...f, currentPassword: v }))}
                placeholder="Enter your current password"
              />
              <Field
                label="New Email Address"
                type="email"
                value={emailForm.newEmail}
                onChange={(v) => setEmailForm((f) => ({ ...f, newEmail: v }))}
                placeholder="new.email@company.com"
              />

              {emailStatus && <StatusBanner type={emailStatus.type} message={emailStatus.msg} />}

              <button
                type="submit"
                disabled={emailLoading || !emailForm.currentPassword || !emailForm.newEmail}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {emailLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Email…</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Update Email Address</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                You will be signed out automatically after updating your email.
              </p>
            </form>
          </div>

          {/* ── Change Password Card ──────────────────────────────────────── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xl dark:shadow-2xl">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 mb-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-violet-500" />
                Change Password
              </h3>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                SECURITY
              </span>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <PasswordField
                label="Current Password"
                value={pwForm.currentPassword}
                onChange={(v) => setPwForm((f) => ({ ...f, currentPassword: v }))}
                placeholder="Enter your current password"
              />
              <PasswordField
                label="New Password"
                value={pwForm.newPassword}
                onChange={(v) => setPwForm((f) => ({ ...f, newPassword: v }))}
                placeholder="Enter new password (min. 4 chars)"
              />
              <PasswordField
                label="Confirm New Password"
                value={pwForm.confirmPassword}
                onChange={(v) => setPwForm((f) => ({ ...f, confirmPassword: v }))}
                placeholder="Re-enter new password"
              />

              {/* Password match indicator */}
              {pwForm.newPassword && pwForm.confirmPassword && (
                <div
                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                    pwForm.newPassword === pwForm.confirmPassword
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500 dark:text-rose-400"
                  }`}
                >
                  {pwForm.newPassword === pwForm.confirmPassword ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {pwForm.newPassword === pwForm.confirmPassword
                    ? "Passwords match"
                    : "Passwords do not match"}
                </div>
              )}

              {pwStatus && <StatusBanner type={pwStatus.type} message={pwStatus.msg} />}

              <button
                type="submit"
                disabled={
                  pwLoading ||
                  !pwForm.currentPassword ||
                  !pwForm.newPassword ||
                  !pwForm.confirmPassword
                }
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {pwLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                Your session remains active after a password change.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ── Company & Playbooks ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Identity */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Company Identity
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              TENANT CONTROL
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCompanySaved(true);
              showToast("✓ Company settings saved successfully", "success");
              setTimeout(() => setCompanySaved(false), 2000);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Company Name:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Default Currency:
              </label>
              <input
                type="text"
                value="INR (₹)"
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 dark:text-slate-400 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{companySaved ? "Settings Saved!" : "Save Company Settings"}</span>
            </button>
          </form>
        </div>

        {/* Playbooks Template */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Standardized Project Playbooks
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              4 TEMPLATES
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {playbooks.map((pb) => (
              <div
                key={pb.code}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-xs dark:shadow-lg hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {pb.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Code: {pb.code} • {pb.stages} Execution Stages
                  </div>
                </div>
                <button
                  onClick={() => showToast(`✏️ Editing playbook template ${pb.code}`, "info")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Edit Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
