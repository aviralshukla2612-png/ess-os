"use client";

import React, { useEffect, useState, useRef } from "react";
import { PremiumReminderModal, ReminderType } from "./PremiumReminderModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { requestForToken, onMessageListener } from "@/lib/firebase";

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
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay restrictions may silently prevent playback
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

  // Flash browser tab title if on another tab
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

  // 1. Prefer ServiceWorker.showNotification (works 100% reliably in background tabs & other windows)
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
          data: {
            url: resolvedLink,
          },
        } as any);
      })
      .catch(() => {
        fallbackWindowNotification();
      });
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

export function NotificationListener() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [activeNotification, setActiveNotification] = useState<any | null>(null);
  const registeredTokenRef = useRef<string | null>(null);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Request FCM Token and send to backend
    const setupFCM = async () => {
      try {
        const token = await requestForToken();
        if (token && token !== registeredTokenRef.current) {
          registeredTokenRef.current = token;

          // Attempt to save token under /crmtesting/api basePath first, fallback to /api
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

    // Listen for foreground FCM push messages
    onMessageListener((payload: any) => {
      if (payload?.notification || payload?.data) {
        const title = payload.notification?.title || payload.data?.title || "ESS OS Notification";
        const message = payload.notification?.body || payload.data?.message || "";
        const linkUrl = payload.data?.linkUrl || "/attendance";
        const type = payload.data?.type || "";

        playNotificationChime();

        // Always trigger desktop/OS notification (pops up even if in another tab)
        showDesktopAlert(title, message, linkUrl);

        // Show in-app glassmorphic modal
        setActiveNotification((prev: any) => {
          if (prev) return prev; // don't override active modal
          return {
            id: payload.messageId || Date.now().toString(),
            title,
            message,
            linkUrl,
            type,
          };
        });
      }
    });
  }, [session?.user?.id, router]);

  // Polling fallback to ensure offline/missed DB notifications are delivered
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const checkNotifications = async () => {
      try {
        const res = await fetch("/crmtesting/api/notifications/unread");
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success && json.data && json.data.length > 0) {
          const first = json.data[0];

          // If we haven't already notified for this ID on desktop
          if (!notifiedIdsRef.current.has(first.id)) {
            notifiedIdsRef.current.add(first.id);
            playNotificationChime();
            showDesktopAlert(first.title, first.message, first.linkUrl);
          }

          // Show in-app modal if no active modal is currently open
          if (!activeNotification) {
            setActiveNotification(first);
          }
        }
      } catch (error) {
        console.error("Failed to check notifications", error);
      }
    };

    const interval = setInterval(checkNotifications, 10000); // Check every 10s
    checkNotifications(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [session?.user?.id, activeNotification]);

  const handleClose = async () => {
    if (!activeNotification) return;
    
    try {
      // Mark as read in the DB so it doesn't show again
      await fetch("/crmtesting/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [activeNotification.id] }),
      });
      
      const linkUrl = activeNotification.linkUrl;
      setActiveNotification(null);
      
      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
      setActiveNotification(null); // Close it anyway
    }
  };

  if (!activeNotification) return null;

  // Resolve modal reminder type
  const resolveType = (notif: any): ReminderType => {
    if (notif?.type) return notif.type as ReminderType;
    const title = (notif?.title || "").toLowerCase();
    if (title.includes("punch-in")) return "PUNCH_IN";
    if (title.includes("break start") || title.includes("coffee")) return "BREAK_START";
    if (title.includes("work resumed") || title.includes("break end")) return "BREAK_END";
    if (title.includes("punch-out request")) return "PUNCH_OUT_REQUEST";
    if (title.includes("punch-out")) return "PUNCH_OUT";
    if (title.includes("project")) return "PROJECT_ASSIGNMENT";
    if (title.includes("lunch")) return "LUNCH";
    return "GENERAL";
  };

  return (
    <PremiumReminderModal
      isOpen={!!activeNotification}
      onClose={handleClose}
      type={resolveType(activeNotification)}
      title={activeNotification.title}
      message={activeNotification.message}
    />
  );
}
