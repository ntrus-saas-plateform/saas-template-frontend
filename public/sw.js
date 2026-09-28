/* Minimal service worker — required for Web Push subscribe in Chromium. */
self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return { title: "Notification", body: event.data?.text?.() ?? "" };
    }
  })();
  const title = data.title || "Notification";
  const options = {
    body: data.body || data.message || "",
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
