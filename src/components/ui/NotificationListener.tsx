"use client";

import React, { useEffect, useState } from "react";
import { PremiumReminderModal } from "./PremiumReminderModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function NotificationListener() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [activeNotification, setActiveNotification] = useState<any | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const checkNotifications = async () => {
      // Don't fetch if we're already showing one to avoid overlapping modals
      if (activeNotification) return;

      try {
        const res = await fetch("/crmtesting/api/notifications/unread");
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success && json.data && json.data.length > 0) {
          // Show the first unread notification
          setActiveNotification(json.data[0]);
        }
      } catch (error) {
        console.error("Failed to check notifications", error);
      }
    };

    const interval = setInterval(checkNotifications, 15000); // Check every 15s
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

  // Determine type. Right now we only have PROJECT_ASSIGNMENT.
  const isProject = activeNotification?.title?.toLowerCase()?.includes("project");
  const type = isProject ? "PROJECT_ASSIGNMENT" : "LUNCH";

  return (
    <PremiumReminderModal
      isOpen={!!activeNotification}
      onClose={handleClose}
      type={type as any}
      title={activeNotification.title}
      message={activeNotification.message}
    />
  );
}
