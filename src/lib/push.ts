// Web Push notification helper (VAPID).
// Fans out a notification to every registered device for a given user.
// Designed to be called fire-and-forget from service layer functions —
// callers do not need to await the result or handle errors.
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
  // Push is optional — silently skip if VAPID keys are not configured (e.g. local dev without .env).
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  // setVapidDetails must be called before each send because this module may be loaded in
  // a fresh serverless function context with no persistent in-memory state.
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@coachsync.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  // allSettled so a failed delivery to one device (e.g. an expired subscription)
  // doesn't prevent notifications from reaching the user's other devices.
  await Promise.allSettled(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );
}
