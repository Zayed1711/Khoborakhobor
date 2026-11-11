// Browser-side helpers for the installed app: service worker, offline pages, notifications.

export function pwaSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

export function pushSupported(): boolean {
  return pwaSupported() && "PushManager" in window && "Notification" in window;
}

/** True when opened from the home-screen icon / the APK, not a browser tab. */
export function isInstalledApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.startsWith("android-app://")
  );
}

/** Remove pages saved for offline reading (called on logout: they may hold personal notes). */
export function clearOfflinePages(): void {
  try {
    if (pwaSupported()) navigator.serviceWorker.controller?.postMessage("kk-clear-pages");
  } catch {
    // nothing saved, nothing to clear
  }
}

function keyToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushResult = "on" | "denied" | "unsupported" | "error";

/**
 * Ask permission (if not asked yet) and register this device for notifications.
 * Must be called from a tap/click, or browsers ignore the permission prompt.
 */
export async function enablePush(reminderHour?: number): Promise<PushResult> {
  if (!pushSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const res = await fetch("/api/push", { cache: "no-store" });
      const { publicKey } = (await res.json()) as { publicKey?: string | null };
      if (!publicKey) return "error";
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) });
    }
    const saved = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), reminderHour }),
    });
    return saved.ok ? "on" : "error";
  } catch {
    return "error";
  }
}

export async function disablePush(): Promise<boolean> {
  if (!pushSupported()) return true;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    return await sub.unsubscribe();
  } catch {
    return false;
  }
}

/** Whether this device currently gets notifications. */
export async function pushIsOn(): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(await reg?.pushManager.getSubscription());
  } catch {
    return false;
  }
}
