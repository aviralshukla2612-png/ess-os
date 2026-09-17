"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { requestForToken, onMessageListener } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  Play,
  LogIn,
  LogOut,
  Clock,
  Sparkles,
  Calendar,
  Utensils,
  AlertCircle,
  X,
  ExternalLink,
  Bell,
  CheckCircle2,
} from "lucide-react";

function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay restrictions may silence sound if no interaction yet
  }
}

function showDesktopAlert(title: string, message: string, linkUrl?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const iconUrl = `${window.location.origin}/crmtesting/ess-logo.png`;
  const resolvedLink = linkUrl
    ? linkUrl.startsWith("/crmtesting")
      ? linkUrl
      : `/crmtesting${linkUrl.startsWith("/") ? "" : "/"}${linkUrl}`
    : "/crmtesting/attendance";

  // Flash browser tab title
  if (typeof document !== "undefined" && document.hidden) {
    const originalTitle = document.title;
    let count = 0;
    const interval = setInterval(() => {
      document.title = count % 2 === 0 ? `🔔 ${title}` : originalTitle;
      count++;
      if (count > 20 || !document.hidden) {
        clearInterval(interval);
        document.title = originalTitle;
      }
    }, 1000);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(title, {
          body: message,
          icon: iconUrl,
          badge: iconUrl,
          requireInteraction: true,
          tag: `ess-alert-${Date.now()}`,
          renotify: true,
          data: { url: resolvedLink },
        } as any);
      })
      .catch(() => fallbackWindowNotification());
  } else {
    fallbackWindowNotification();
  }

  function fallbackWindowNotification() {
    try {
      const notif = new Notification(title, {
        body: message,
        icon: iconUrl,
        badge: iconUrl,
        requireInteraction: true,
        tag: `ess-alert-${Date.now()}`,
      });
      notif.onclick = () => {
        window.focus();
        window.location.href = resolvedLink;
      };
    } catch (e) {
      console.debug("Window notification error:", e);
    }
  }
}

interface LiveToastNotification {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  type?: string;
  createdAt?: string;
}

export function NotificationListener() {
  const { data: session } = useSession();
  const router = useRouter();

  const [liveToast, setLiveToast] = useState<LiveToastNotification | null>(null);
  const registeredTokenRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLiveAlert = (notif: LiveToastNotification) => {
    // Clear any existing dismiss timer
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    playNotificationChime();
    showDesktopAlert(notif.title, notif.message, notif.linkUrl);
    setLiveToast(notif);

    // Auto-dismiss floating toast after 7 seconds
    dismissTimerRef.current = setTimeout(() => {
      setLiveToast(null);
    }, 7000);
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    // 1. Request FCM Token and register with backend
    const setupFCM = async () => {
      try {
        const token = await requestForToken();
        if (token && token !== registeredTokenRef.current) {
          registeredTokenRef.current = token;

          try {
            await fetch("/crmtesting/api/users/fcm-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
          } catch {
            await fetch("/api/users/fcm-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
          }
        }
      } catch (err) {
        console.error("FCM Setup Failed", err);
      }
    };

    setupFCM();

    // 2. Listen for foreground FCM push messages
    onMessageListener((payload: any) => {
      if (payload?.notification || payload?.data) {
        const title = payload.notification?.title || payload.data?.title || "ESS OS Notification";
        const message = payload.notification?.body || payload.data?.message || "";
        const linkUrl = payload.data?.linkUrl || "/attendance";
        const type = payload.data?.type || "";
        const id = payload.messageId || Date.now().toString();

        if (!seenIdsRef.current.has(id)) {
          seenIdsRef.current.add(id);
          triggerLiveAlert({ id, title, message, linkUrl, type });
        }
      }
    });
  }, [session?.user?.id]);

  // 3. Real-Time Fast Polling (3 seconds) + Window Focus check
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkNotifications = async () => {
      try {
        const res = await fetch("/crmtesting/api/notifications/unread");
        if (!res.ok) return;
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const unreadList: any[] = json.data;

          // On initial page load/mount:
          // Just record the existing unread IDs so we DO NOT throw annoying popup modals on site open!
          if (isInitialMountRef.current) {
            unreadList.forEach((n) => seenIdsRef.current.add(n.id));
            isInitialMountRef.current = false;
            return;
          }

          // On subsequent live polls: detect ANY brand new notification that arrived
          const brandNew = unreadList.filter((n) => !seenIdsRef.current.has(n.id));
          if (brandNew.length > 0) {
            // Add all to seen set
            brandNew.forEach((n) => seenIdsRef.current.add(n.id));

            // Display the newest incoming notification as a live floating alert
            const newest = brandNew[0];
            triggerLiveAlert({
              id: newest.id,
              title: newest.title,
              message: newest.message,
              linkUrl: newest.linkUrl,
              type: newest.urgency || "ATTENDANCE",
            });
          }
        }
      } catch (error) {
        // Silently ignore network interruptions/offline states
      }
    };

    // Immediate check on mount
    checkNotifications();

    // Fast poll every 3 seconds for instant response when employee punches/breaks
    const interval = setInterval(checkNotifications, 3000);

    // Also trigger immediate check when user focuses the tab or window
    const handleFocus = () => checkNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkNotifications();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [session?.user?.id]);

  const dismissToast = async (markRead = true) => {
    if (!liveToast) return;
    const target = liveToast;
    setLiveToast(null);

    if (markRead) {
      try {
        await fetch("/crmtesting/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [target.id] }),
        });
      } catch (e) {
        console.error("Failed to mark read:", e);
      }
    }
  };

  const handleToastClick = async () => {
    if (!liveToast) return;
    const linkUrl = liveToast.linkUrl;
    await dismissToast(true);

    if (linkUrl) {
      const cleanPath = linkUrl.replace(/^\/crmtesting/, "") || "/attendance";
      router.push(cleanPath);
    }
  };

  // Helper to determine theme and icon based on notification content
  const getThemeAndIcon = (notif: LiveToastNotification) => {
    const text = (notif.title + " " + notif.message).toLowerCase();

    if (text.includes("break start") || text.includes("coffee")) {
      return {
        icon: <Coffee className="w-5 h-5 text-amber-400" />,
        badgeBg: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        barColor: "bg-amber-500",
        label: "Break Started",
      };
    }
    if (text.includes("lunch")) {
      return {
        icon: <Utensils className="w-5 h-5 text-orange-400" />,
        badgeBg: "bg-orange-500/20 border-orange-500/40 text-orange-300",
        barColor: "bg-orange-500",
        label: "Lunch Break",
      };
    }
    if (text.includes("work resumed") || text.includes("break end")) {
      return {
        icon: <Play className="w-5 h-5 text-emerald-400" />,
        badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        barColor: "bg-emerald-500",
        label: "Work Resumed",
      };
    }
    if (text.includes("punch-in") || text.includes("punched in")) {
      return {
        icon: <LogIn className="w-5 h-5 text-emerald-400" />,
        badgeBg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        barColor: "bg-emerald-500",
        label: "Punch In",
      };
    }
    if (text.includes("punch-out request")) {
      return {
        icon: <Clock className="w-5 h-5 text-purple-400" />,
        badgeBg: "bg-purple-500/20 border-purple-500/40 text-purple-300",
        barColor: "bg-purple-500",
        label: "Early Punch-Out Request",
      };
    }
    if (text.includes("punch-out")) {
      return {
        icon: <LogOut className="w-5 h-5 text-rose-400" />,
        badgeBg: "bg-rose-500/20 border-rose-500/40 text-rose-300",
        barColor: "bg-rose-500",
        label: "Punch Out",
      };
    }
    if (text.includes("leave")) {
      return {
        icon: <Calendar className="w-5 h-5 text-sky-400" />,
        badgeBg: "bg-sky-500/20 border-sky-500/40 text-sky-300",
        barColor: "bg-sky-500",
        label: "Leave Application",
      };
    }
    if (text.includes("lead")) {
      return {
        icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
        badgeBg: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
        barColor: "bg-indigo-500",
        label: "New Lead",
      };
    }

    return {
      icon: <Bell className="w-5 h-5 text-blue-400" />,
      badgeBg: "bg-blue-500/20 border-blue-500/40 text-blue-300",
      barColor: "bg-blue-500",
      label: "Activity Alert",
    };
  };

  return (
    <AnimatePresence>
      {liveToast && (
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-5 right-4 z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-auto"
        >
          {(() => {
            const { icon, badgeBg, barColor, label } = getThemeAndIcon(liveToast);
            return (
              <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 shadow-2xl shadow-slate-950/40 text-slate-100 backdrop-blur-xl p-4 space-y-3">
                {/* Accent top bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${barColor}`} />

                {/* Header row */}
                <div className="flex items-start justify-between gap-2.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
                      {icon}
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {label}
                      </span>
                      <h4 className="text-xs font-bold text-white tracking-tight mt-1 line-clamp-1">
                        {liveToast.title}
                      </h4>
                    </div>
                  </div>

                  {/* Close button (does not redirect) */}
                  <button
                    onClick={() => dismissToast(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Message body */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {liveToast.message}
                </p>

                {/* Action footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">Just now</span>
                  <button
                    onClick={handleToastClick}
                    className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>View Attendance</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

