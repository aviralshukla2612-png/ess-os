import { prisma } from "./prisma";
import { firebaseAdmin } from "./firebaseAdmin";

export async function createAndSendNotification({
  recipientId,
  title,
  message,
  urgency = "MEDIUM",
  linkUrl,
}: {
  recipientId: string;
  title: string;
  message: string;
  urgency?: string;
  linkUrl?: string;
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
      await firebaseAdmin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title,
          body: message,
        },
        data: {
          linkUrl: linkUrl || "",
        },
      });
    } catch (error) {
      console.error("Failed to send FCM push notification", error);
    }
  }

  return notification;
}
