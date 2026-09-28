"use client";

/** Subscribe this browser to Web Push and return a JSON subscription token for enroll-push. */
export async function subscribeWebPush(): Promise<string> {
  const vapid =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  if (!vapid) {
    throw new Error(
      "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY (same value as server VAPID_PUBLIC_KEY).",
    );
  }
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service workers are not available in this browser.");
  }
  if (!("PushManager" in window)) {
    throw new Error("Web Push is not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration =
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.register("/sw.js").catch(async () => {
      // Minimal inline registration if no sw.js — use ready worker if any
      return navigator.serviceWorker.ready;
    }));

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    }));

  return JSON.stringify(subscription.toJSON());
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
