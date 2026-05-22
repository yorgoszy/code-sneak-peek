// Service worker push handler. Loaded via vite-plugin-pwa workbox.importScripts.
// Handles 'push' events to display notifications and 'notificationclick' to open deep links.
/* eslint-disable */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Hyperkids', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Hyperkids';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { deep_link: data.deep_link || '/' },
    tag: data.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.deep_link) || '/';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const u = new URL(client.url);
        if (u.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) { await client.navigate(url); }
          return;
        }
      } catch {}
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
