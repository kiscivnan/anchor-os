import { SPARK_REMINDER_TYPE, SPARK_STATUS, type Spark } from "@/types";

export type NotificationSupport = "unsupported" | "default" | "granted" | "denied";

export function getNotificationPermission(): NotificationSupport {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.requestPermission();
}

export async function registerSW(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // SW 注册失败时静默，不影响应用功能
  }
}

export async function scheduleSparkReminders(sparks: Spark[]): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (Notification.permission !== "granted") return;

  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.ready;
  } catch {
    return;
  }

  if (!reg.active) return;

  const now = Date.now();
  const reminders = sparks
    .filter(
      (s) =>
        s.status === SPARK_STATUS.PENDING &&
        s.reminder_type === SPARK_REMINDER_TYPE.MANUAL_TIME &&
        s.reminder_time !== null &&
        new Date(s.reminder_time).getTime() > now,
    )
    .map((s) => ({ id: s.id, content: s.content, time: s.reminder_time! }));

  reg.active.postMessage({ type: "SCHEDULE_REMINDERS", reminders });
}
