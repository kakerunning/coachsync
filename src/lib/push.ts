import webpush from "web-push";
import { db } from "@/lib/db";

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: NotificationPayload
): Promise<void> {
  await webpush.sendNotification(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    JSON.stringify(payload)
  );
}

export async function notifyUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@coachsync.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );
}
