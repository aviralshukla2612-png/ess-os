import { prisma } from "./prisma";
import { firebaseAdmin } from "./firebaseAdmin";

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
    // 1. Find all active admins/owners
    const adminUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { activeRole: "OWNER" },
          { userRoles: { some: { role: { code: "OWNER" } } } },
        ],
      },
      select: { id: true },
    });

    if (adminUsers.length === 0) return;

    // 2. Create DB notifications for all admins
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
