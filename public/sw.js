// 锚点 OS · Service Worker
// 接收主线程调度的念头提醒，在指定时间触发系统通知

const timers = new Map(); // sparkId → timeoutId

self.addEventListener("message", (event) => {
  const { type, reminders } = event.data ?? {};
  if (type !== "SCHEDULE_REMINDERS") return;

  // 清掉旧计时器
  for (const tid of timers.values()) clearTimeout(tid);
  timers.clear();

  const now = Date.now();
  for (const r of reminders ?? []) {
    const delay = new Date(r.time).getTime() - now;
    if (delay <= 0) continue;

    const tid = setTimeout(() => {
      self.registration.showNotification("锚点 OS · 念头提醒", {
        body: r.content.length > 60 ? r.content.slice(0, 60) + "…" : r.content,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `spark-${r.id}`,
        requireInteraction: false,
        data: { url: "/spark" },
      });
      timers.delete(r.id);
    }, delay);

    timers.set(r.id, tid);
  }

  // 告知主线程已接收
  event.source?.postMessage({ type: "REMINDERS_SCHEDULED", count: timers.size });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(targetUrl));
        if (existing) return existing.focus();
        return clients.openWindow(targetUrl);
      }),
  );
});

// 激活后立刻接管所有页面
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
