self.addEventListener("push", (event) => {
  let payload = {
    title: "Athena Pro",
    body: "You have a new update.",
    href: "/dashboard/staff/profile"
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon.png",
      badge: "/apple-icon.png",
      data: { href: payload.href }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/dashboard/staff/profile";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));

      if (existing) {
        existing.focus();
        existing.navigate(href);
        return;
      }

      return self.clients.openWindow(href);
    })
  );
});
