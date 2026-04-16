// PushToggle — controls Web Push subscription for the current browser/device.
// Renders nothing on browsers that don't support the Push API (e.g. Safari < 16,
// Firefox with push disabled) rather than showing a broken or misleading UI.
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

type PushState = "unsupported" | "loading" | "denied" | "enabled" | "disabled";

// VAPID public keys are URL-safe base64 (RFC 4648 §5); the Push API expects a
// standard base64 Uint8Array, so we must re-pad and swap - / _ → + /.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
}

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-public-key", { credentials: "include" });
    const json = await res.json();
    return json.data?.key ?? null;
  } catch {
    return null;
  }
}

async function subscribeOnServer(sub: PushSubscription): Promise<void> {
  const key = sub.getKey("p256dh");
  const auth = sub.getKey("auth");
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : "",
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : "",
    }),
  });
}

async function unsubscribeOnServer(endpoint: string): Promise<void> {
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ endpoint }),
  });
}

export function PushToggle() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") { setState("denied"); return; }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? "enabled" : "disabled");
      });
    });
  }, []);

  async function enable() {
    setState("loading");
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }

      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) { setError("Push not configured on server."); setState("disabled"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        // userVisibleOnly: true is required by the Push API spec; Chrome rejects false.
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await subscribeOnServer(sub);
      setState("enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable notifications");
      setState("disabled");
    }
  }

  async function disable() {
    setState("loading");
    setError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeOnServer(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("disabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable notifications");
      setState("enabled");
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">Push Notifications</p>

      {state === "denied" && (
        <p className="text-xs text-gray-400">
          Notifications are blocked in your browser. Enable them in browser settings.
        </p>
      )}

      {state !== "denied" && (
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={state === "enabled" ? disable : enable}
          disabled={state === "loading"}
        >
          {state === "enabled" ? (
            <><BellOff className="h-4 w-4" /> Disable notifications</>
          ) : (
            <><Bell className="h-4 w-4" /> {state === "loading" ? "Loading…" : "Enable notifications"}</>
          )}
        </Button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
