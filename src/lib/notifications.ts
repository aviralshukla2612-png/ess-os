import { prisma } from "./prisma";
import { firebaseAdmin } from "./firebaseAdmin";

/**
 * Format any date into Indian Standard Time (IST - UTC + 5:30)
 * Uses explicit offset arithmetic so it is 100% fail-safe even on minimal UTC Linux/Docker servers.
 */
export function formatToIST(dateInput: Date | string | number = new Date()): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    // Indian Standard Time is strictly UTC + 5 hours 30 minutes
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istTime = new Date(d.getTime() + istOffsetMs);

    let hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour should be 12
    const minStr = minutes < 10 ? "0" + minutes : String(minutes);

    return `${hours}:${minStr} ${ampm}`;
  } catch {
    return new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
  }
}

export async function createAndSendNotification({
  recipientId,
  title,
  message,
  urgency = "MEDIUM",
  linkUrl,
  type = "GENERAL",
}: {
  recipientId: string;
  title: string;
  message: string;
  urgency?: string;
  linkUrl?: string;
  type?: string;
}) {
  // 1. Save to database
  const notification = await prisma.notification.create({
    data: {
      recipientId,
      title,
      message,
      urgency,
      linkUrl,
    },
  });

  // 2. Fetch user's FCM tokens
  const tokens = await prisma.userFcmToken.findMany({
    where: { userId: recipientId },
  });

  const fcmTokens = tokens.map((t) => t.token);

  // 3. Send Push Notification if tokens exist
  if (fcmTokens.length > 0) {
    try {
      const resolvedLink = linkUrl
        ? linkUrl.startsWith("/crmtesting")
          ? linkUrl
          : `/crmtesting${linkUrl.startsWith("/") ? "" : "/"}${linkUrl}`
        : "/crmtesting/attendance";

      await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title,
          body: message,
        },
        data: {
          title,
          message,
          type,
          linkUrl: resolvedLink,
          icon: "/crmtesting/ess-logo.png",
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title,
            body: message,
            icon: "/crmtesting/ess-logo.png",
            badge: "/crmtesting/ess-logo.png",
            requireInteraction: true,
            tag: `ess-user-${Date.now()}`,
          },
          fcmOptions: {
            link: resolvedLink,
          },
        },
      });
    } catch (error) {
      console.error("Failed to send FCM push notification", error);
    }
  }

  return notification;
}

/**
 * Dispatch real-time notifications to all system Admins/Owners
 * Creates database records and broadcasts FCM push alerts.
 */
export async function notifyAdmins({
  title,
  message,
  urgency = "MEDIUM",
  linkUrl = "/attendance",
  type = "ATTENDANCE",
  metadata = {},
}: {
  title: string;
  message: string;
  urgency?: string;
  linkUrl?: string;
  type?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // 1. Find all active admins/owners/sub-admins
    const allAdmins = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { activeRole: "OWNER" },
          { activeRole: "ADMIN" },
          { activeRole: "SUB_ADMIN" },
          { userRoles: { some: { role: { code: { in: ["OWNER", "ADMIN"] } } } } },
        ],
      },
      select: { id: true, activeRole: true, subAdminPermissions: true },
    });

    // Filter sub-admins based on relevant module permission
    const adminUsers = allAdmins.filter((admin) => {
      if (admin.activeRole !== "SUB_ADMIN") return true;
      let perms: string[] = [];
      try {
        perms = typeof admin.subAdminPermissions === "string" ? JSON.parse(admin.subAdminPermissions) : (admin.subAdminPermissions || []);
      } catch {
        perms = [];
      }
      if (!Array.isArray(perms) || perms.length === 0) return true; // Full access if not restricted
      const upperType = (type || "").toUpperCase();
      if (upperType.includes("BREAK") || upperType.includes("PUNCH") || upperType === "ATTENDANCE") {
        return perms.includes("attendance") || perms.includes("attendance-requests") || perms.includes("overview");
      }
      if (upperType.includes("LEAVE")) {
        return perms.includes("leave-requests") || perms.includes("overview");
      }
      if (upperType.includes("LEAD")) {
        return perms.includes("leads") || perms.includes("overview");
      }
      return true;
    });

    if (adminUsers.length === 0) return;

    // 2. Create DB notifications for all eligible admins
    await prisma.notification.createMany({
      data: adminUsers.map((admin) => ({
        recipientId: admin.id,
        title,
        message,
        urgency,
        linkUrl,
      })),
    });

    // 3. Find all FCM device tokens for admins
    const adminIds = adminUsers.map((a) => a.id);
    const tokens = await prisma.userFcmToken.findMany({
      where: { userId: { in: adminIds } },
      select: { token: true },
    });

    const fcmTokens = tokens.map((t) => t.token).filter(Boolean);

    // 4. Send FCM Multicast push notification
    if (fcmTokens.length > 0) {
      const stringifiedMetadata = Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k, String(v)])
      );

      const resolvedLink = linkUrl
        ? linkUrl.startsWith("/crmtesting")
          ? linkUrl
          : `/crmtesting${linkUrl.startsWith("/") ? "" : "/"}${linkUrl}`
        : "/crmtesting/attendance";

      await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title,
          body: message,
        },
        data: {
          title,
          message,
          type,
          linkUrl: resolvedLink,
          icon: "/crmtesting/ess-logo.png",
          ...stringifiedMetadata,
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title,
            body: message,
            icon: "/crmtesting/ess-logo.png",
            badge: "/crmtesting/ess-logo.png",
            requireInteraction: true,
            tag: `ess-admin-${Date.now()}`,
          },
          fcmOptions: {
            link: resolvedLink,
          },
        },
      });
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
