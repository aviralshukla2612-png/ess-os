/**
 * Timezone and Date Utilities for ESS OS Attendance
 * Standardized on Asia/Kolkata (IST: UTC+5:30)
 */

export const IST_TIMEZONE = "Asia/Kolkata";
export const STANDARD_SHIFT_START_HOUR = 9;
export const STANDARD_SHIFT_START_MINUTE = 30; // 09:30 AM IST grace period

/**
 * Returns YYYY-MM-DD formatted string in IST
 */
export function getISTDateString(d: Date = new Date()): string {
  // Using Intl format to get year, month, day in Asia/Kolkata
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
}

/**
 * Given a date string (YYYY-MM-DD) or Date object,
 * returns UTC Date objects for start of day (00:00:00.000 IST) and end of day (23:59:59.999 IST).
 */
export function getISTDayRange(input?: string | Date): { startOfDay: Date; endOfDay: Date } {
  let dateStr: string;
  if (!input) {
    dateStr = getISTDateString(new Date());
  } else if (typeof input === "string") {
    // If input is YYYY-MM-DD
    dateStr = input.trim().split("T")[0];
  } else {
    dateStr = getISTDateString(input);
  }

  // Parse YYYY-MM-DD
  const parts = dateStr.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // In IST, offset is +05:30 -> UTC is -5 hours 30 mins
  // 00:00:00 IST is previous day 18:30:00 UTC
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - (5 * 3600000 + 30 * 60000));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5 * 3600000 + 30 * 60000));

  return { startOfDay, endOfDay };
}

/**
 * Returns UTC range for an entire month in IST.
 * month is 1-indexed (1 = Jan, 12 = Dec).
 */
export function getISTMonthRange(year: number, month: number): { startOfMonth: Date; endOfMonth: Date; totalDays: number } {
  const totalDays = new Date(year, month, 0).getDate();
  const startOfDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - (5 * 3600000 + 30 * 60000));
  const endOfDay = new Date(Date.UTC(year, month - 1, totalDays, 23, 59, 59, 999) - (5 * 3600000 + 30 * 60000));

  return { startOfMonth: startOfDay, endOfMonth: endOfDay, totalDays };
}

/**
 * Format a Date object to "hh:mm A" string in IST.
 */
export function formatTimeIST(d: Date | null | undefined): string {
  if (!d) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

/**
 * Checks if a punch-in timestamp is considered late arrival (after 09:30 AM IST).
 */
export function isLateArrival(punchIn: Date, cutoffHour = STANDARD_SHIFT_START_HOUR, cutoffMinute = STANDARD_SHIFT_START_MINUTE): boolean {
  const istTimeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).format(new Date(punchIn));

  const [hours, minutes] = istTimeStr.split(":").map(Number);
  if (hours > cutoffHour) return true;
  if (hours === cutoffHour && minutes > cutoffMinute) return true;
  return false;
}
