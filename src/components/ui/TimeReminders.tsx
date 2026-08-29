"use client";

import React, { useEffect, useState } from "react";
import { PremiumReminderModal } from "./PremiumReminderModal";
import { useWorkClock } from "@/lib/workClockContext";
import { useSession } from "next-auth/react";

export function TimeReminders() {
  const { status } = useWorkClock();
  const { data: session } = useSession();
  
  const [showLunchReminder, setShowLunchReminder] = useState(false);
  const [showPunchOutReminder, setShowPunchOutReminder] = useState(false);

  useEffect(() => {
    // Only apply to employees who are currently punched in
    if (status === "NOT_PUNCHED_IN" || status === "DAY_COMPLETE") return;
    
    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      const todayDateStr = now.toDateString();
      const employeeId = session?.user?.employeeId || "unknown";
      
      const lunchKey = `lunch_reminder_${employeeId}_${todayDateStr}`;
      const punchOutKey = `punch_out_reminder_${employeeId}_${todayDateStr}`;
      
      // 1:10 PM = 13:10
      if (hours === 13 && minutes === 10) {
        if (!localStorage.getItem(lunchKey)) {
          if (status === "WORKING") { // Only show if they haven't already taken a break
            setShowLunchReminder(true);
            localStorage.setItem(lunchKey, "true");
          }
        }
      }
      
      // 6:45 PM = 18:45
      if (hours === 18 && minutes === 45) {
        if (!localStorage.getItem(punchOutKey)) {
          if (status === "WORKING" || status === "ON_BREAK") {
             setShowPunchOutReminder(true);
             localStorage.setItem(punchOutKey, "true");
          }
        }
      }
    };

    const interval = setInterval(checkTime, 30000); // Check every 30 seconds
    checkTime(); // Check immediately on mount/status change

    return () => clearInterval(interval);
  }, [status, session?.user?.employeeId]);

  return (
    <>
      <PremiumReminderModal
        isOpen={showLunchReminder}
        onClose={() => setShowLunchReminder(false)}
        type="LUNCH"
        title="Time for Lunch Break 🍽️"
        message="It's 1:10 PM! Please take your scheduled lunch break to recharge."
      />
      
      <PremiumReminderModal
        isOpen={showPunchOutReminder}
        onClose={() => setShowPunchOutReminder(false)}
        type="PUNCH_OUT"
        title="Punch Out Reminder 🕔"
        message="It's 6:45 PM! Please wrap up your tasks and prepare to punch out for the day."
      />
    </>
  );
}
