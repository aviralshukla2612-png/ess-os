"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  CheckCheck, 
  LogIn, 
  Coffee, 
  Play, 
  LogOut, 
  AlertCircle, 
  FolderKanban, 
  Sparkles,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import { requestForToken } from "@/lib/firebase";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  urgency?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPushPermission, setHasPushPermission] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check browser push notification permission status
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPushPermission(Notification.permission === "granted");
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/crmtesting/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount ?? (json.data || []).filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.debug("Failed to fetch notification list:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Request browser permission
  const handleEnablePush = async () => {
    try {
      const token = await requestForToken();
      if (token) {
        setHasPushPermission(true);
        await fetch("/crmtesting/api/users/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    } catch (e) {
      console.error("Push permission request failed", e);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      await fetch("/crmtesting/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all read", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark single as read & navigate
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      try {
        await fetch("/crmtesting/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notif.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error("Failed to mark item as read", e);
      }
    }

    setIsOpen(false);
    if (notif.linkUrl) {
      const target = notif.linkUrl.startsWith("/crmtesting") 
        ? notif.linkUrl 
        : `/crmtesting${notif.linkUrl.startsWith("/") ? "" : "/"}${notif.linkUrl}`;
      router.push(target);
    }
  };

  // Format relative timestamp
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // Icon per notification
  const getNotificationIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("punch-in")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <LogIn className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes("break start") || t.includes("coffee") || t.includes("lunch")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Coffee className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes("work resumed") || t.includes("break end")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Play className="w-4 h-4 ml-0.5" />
        </div>
      );
    }
    if (t.includes("punch-out request")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes("punch-out")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <LogOut className="w-4 h-4" />
        </div>
      );
    }
    if (t.includes("project") || t.includes("task")) {
      return (
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <FolderKanban className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        title="View Notifications"
        className={`relative flex items-center justify-center p-2 rounded-xl transition-all active:scale-95 touch-target ${
          isOpen
            ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
            : "bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800/80"
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge & Pulse */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-gradient-to-r from-rose-500 to-red-600 text-[9px] font-black text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          </>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[90vw] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Push permission callout if not granted */}
          {!hasPushPermission && (
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 truncate">
                  Desktop alerts disabled
                </span>
              </div>
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold shrink-0 transition-colors shadow-xs"
              >
                Enable
              </button>
            </div>
          )}

          {/* List of Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</div>
                <div className="text-[11px] text-slate-400">No new notifications at this time.</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors relative ${
                    !notif.isRead ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                  }`}
                >
                  {/* Type Icon */}
                  {getNotificationIcon(notif.title)}

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${!notif.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/crmtesting/attendance");
              }}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
            >
              <span>View Attendance Log</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
