"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ClockState = "NOT_PUNCHED_IN" | "WORKING" | "ON_BREAK" | "DAY_COMPLETE";

export interface TimelineEvent {
  id: string;
  time: string;
  type: "PUNCH_IN" | "WORK" | "BREAK" | "CALL" | "PUNCH_OUT";
  title: string;
  subtitle?: string;
  duration?: string;
  isCurrent?: boolean;
}

interface WorkClockContextType {
  status: ClockState;
  workSeconds: number;
  breakSeconds: number;
  breakType: string;
  breakReason: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  currentProject: string;
  currentTask: string;
  usedLunchSeconds: number;
  usedTeaSeconds: number;
  lunchAllowanceSeconds: number;
  teaAllowanceSeconds: number;
  locationVerified: boolean;
  deviceVerified: boolean;
  simulatedGeofenceError: boolean;
  simulatedDeviceError: boolean;
  timeline: TimelineEvent[];
  // Actions
  punchIn: () => void;
  startBreak: (type: string, reason?: string) => void;
  resumeWork: () => void;
  changeWork: (project: string, task: string) => void;
  punchOut: () => { success: boolean; requiresConfirmation: boolean; remainingSeconds: number };
  confirmPunchOutAnyway: () => void;
  toggleGeofenceError: () => void;
  toggleDeviceError: () => void;
  formatHMS: (sec: number) => string;
  formatHM: (sec: number) => string;
}

const WorkClockContext = createContext<WorkClockContextType | undefined>(undefined);

const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: "evt-1",
    time: "10:01 AM",
    type: "PUNCH_IN",
    title: "Punch In",
    subtitle: "Office Laptop (EMP-LT-004) • Location Verified (42m)",
  },
  {
    id: "evt-2",
    time: "10:05 AM – 11:22 AM",
    type: "WORK",
    title: "ABC E-Commerce Storefront",
    subtitle: "Razorpay Sandbox Payload Testing",
    duration: "1h 17m",
  },
  {
    id: "evt-3",
    time: "11:22 AM – 11:32 AM",
    type: "BREAK",
    title: "Tea Break",
    subtitle: "10m allowance used",
    duration: "10m",
  },
  {
    id: "evt-4",
    time: "11:32 AM – 01:10 PM",
    type: "WORK",
    title: "ABC E-Commerce Storefront",
    subtitle: "Checkout Gateway API Implementation",
    duration: "1h 38m",
  },
];

export function WorkClockProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ClockState>("WORKING");
  const [workSeconds, setWorkSeconds] = useState<number>(8200); // ~2h 16m
  const [breakSeconds, setBreakSeconds] = useState<number>(0);
  const [breakType, setBreakType] = useState<string>("Lunch");
  const [breakReason, setBreakReason] = useState<string>("");
  const [punchInTime, setPunchInTime] = useState<string | null>("10:01 AM");
  const [punchOutTime, setPunchOutTime] = useState<string | null>(null);

  const [currentProject, setCurrentProject] = useState<string>("ABC E-Commerce Storefront");
  const [currentTask, setCurrentTask] = useState<string>("Razorpay HMAC Webhook Signature Verification");

  const [usedLunchSeconds, setUsedLunchSeconds] = useState<number>(0);
  const [usedTeaSeconds, setUsedTeaSeconds] = useState<number>(600); // 10m tea used
  const lunchAllowanceSeconds = 45 * 60; // 45m
  const teaAllowanceSeconds = 10 * 60; // 10m

  const [locationVerified, setLocationVerified] = useState<boolean>(true);
  const [deviceVerified, setDeviceVerified] = useState<boolean>(true);
  const [simulatedGeofenceError, setSimulatedGeofenceError] = useState<boolean>(false);
  const [simulatedDeviceError, setSimulatedDeviceError] = useState<boolean>(false);

  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount (hydration safe)
  useEffect(() => {
    const saved = localStorage.getItem("emperor_work_clock_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.workSeconds !== undefined) setWorkSeconds(parsed.workSeconds);
        if (parsed.breakSeconds !== undefined) setBreakSeconds(parsed.breakSeconds);
        if (parsed.breakType) setBreakType(parsed.breakType);
        if (parsed.breakReason) setBreakReason(parsed.breakReason);
        if (parsed.punchInTime) setPunchInTime(parsed.punchInTime);
        if (parsed.punchOutTime) setPunchOutTime(parsed.punchOutTime);
        if (parsed.currentProject) setCurrentProject(parsed.currentProject);
        if (parsed.currentTask) setCurrentTask(parsed.currentTask);
        if (parsed.usedLunchSeconds !== undefined) setUsedLunchSeconds(parsed.usedLunchSeconds);
        if (parsed.usedTeaSeconds !== undefined) setUsedTeaSeconds(parsed.usedTeaSeconds);
        if (parsed.timeline) setTimeline(parsed.timeline);
      } catch (e) {
        console.error("Failed to parse work clock state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    const stateToSave = {
      status,
      workSeconds,
      breakSeconds,
      breakType,
      breakReason,
      punchInTime,
      punchOutTime,
      currentProject,
      currentTask,
      usedLunchSeconds,
      usedTeaSeconds,
      timeline,
    };
    localStorage.setItem("emperor_work_clock_state", JSON.stringify(stateToSave));
  }, [
    isLoaded,
    status,
    workSeconds,
    breakSeconds,
    breakType,
    breakReason,
    punchInTime,
    punchOutTime,
    currentProject,
    currentTask,
    usedLunchSeconds,
    usedTeaSeconds,
    timeline,
  ]);

  // Ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === "WORKING") {
      interval = setInterval(() => {
        setWorkSeconds((prev) => prev + 1);
      }, 1000);
    } else if (status === "ON_BREAK") {
      interval = setInterval(() => {
        setBreakSeconds((prev) => {
          const next = prev + 1;
          if (breakType === "Lunch") setUsedLunchSeconds((l) => l + 1);
          if (breakType === "Tea") setUsedTeaSeconds((t) => t + 1);
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, breakType]);

  const formatHMS = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, "0");
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${s}`;
  };

  const formatHM = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const punchIn = () => {
    const now = new Date();
    const formatted = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setPunchInTime(formatted);
    setWorkSeconds(0);
    setBreakSeconds(0);
    setStatus("WORKING");

    setTimeline([
      {
        id: `evt-${Date.now()}`,
        time: formatted,
        type: "PUNCH_IN",
        title: "Punch In",
        subtitle: "Office Laptop (EMP-LT-004) • Location Verified",
      },
    ]);
  };

  const startBreak = (type: string, reason?: string) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setBreakType(type);
    setBreakReason(reason || "");
    setBreakSeconds(0);
    setStatus("ON_BREAK");

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: type === "Client Call" ? "CALL" : "BREAK",
        title: `${type} Break`,
        subtitle: reason ? `Reason: ${reason}` : `Started at ${now}`,
      },
    ]);
  };

  const resumeWork = () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setStatus("WORKING");
    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: "WORK",
        title: currentProject,
        subtitle: currentTask,
      },
    ]);
  };

  const changeWork = (proj: string, task: string) => {
    setCurrentProject(proj);
    setCurrentTask(task);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: "WORK",
        title: proj,
        subtitle: task,
      },
    ]);
  };

  const REQUIRED_WORK_SECONDS = 8 * 3600; // 8 hours

  const punchOut = () => {
    if (workSeconds >= REQUIRED_WORK_SECONDS) {
      confirmPunchOutAnyway();
      return { success: true, requiresConfirmation: false, remainingSeconds: 0 };
    } else {
      const remainingSeconds = REQUIRED_WORK_SECONDS - workSeconds;
      return { success: false, requiresConfirmation: true, remainingSeconds };
    }
  };

  const confirmPunchOutAnyway = () => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setPunchOutTime(now);
    setStatus("DAY_COMPLETE");

    setTimeline((prev) => [
      ...prev,
      {
        id: `evt-${Date.now()}`,
        time: now,
        type: "PUNCH_OUT",
        title: "Punch Out",
        subtitle: `Day Complete at ${now}`,
      },
    ]);
  };

  const toggleGeofenceError = () => setSimulatedGeofenceError((prev) => !prev);
  const toggleDeviceError = () => setSimulatedDeviceError((prev) => !prev);

  return (
    <WorkClockContext.Provider
      value={{
        status,
        workSeconds,
        breakSeconds,
        breakType,
        breakReason,
        punchInTime,
        punchOutTime,
        currentProject,
        currentTask,
        usedLunchSeconds,
        usedTeaSeconds,
        lunchAllowanceSeconds,
        teaAllowanceSeconds,
        locationVerified,
        deviceVerified,
        simulatedGeofenceError,
        simulatedDeviceError,
        timeline,
        punchIn,
        startBreak,
        resumeWork,
        changeWork,
        punchOut,
        confirmPunchOutAnyway,
        toggleGeofenceError,
        toggleDeviceError,
        formatHMS,
        formatHM,
      }}
    >
      {children}
    </WorkClockContext.Provider>
  );
}

export function useWorkClock() {
  const context = useContext(WorkClockContext);
  if (!context) {
    throw new Error("useWorkClock must be used within a WorkClockProvider");
  }
  return context;
}
