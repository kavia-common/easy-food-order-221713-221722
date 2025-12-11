 /* Minimal service worker for push notifications (festival offers).
  * This includes a basic push handler and is safe if Push is not used.
  * Note: In a real app, integrate subscription and VAPID setup.
  */
self.addEventListener('install', (event) => {
  // Activate immediately on install
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Basic push handler
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback if not JSON
    // @ts-ignore
    data = { title: 'Festival Offer', body: (event.data && event.data.text && event.data.text()) || 'Special offer inside!' };
  }

  // @ts-ignore
  const title = data.title || 'Special Festival Offer';
  // @ts-ignore
  const body = data.body || 'Check out limited-time deals near you!';
  // @ts-ignore
  const icon = data.icon || '/favicon.ico';
  // @ts-ignore
  const tag = data.tag || 'festival-offer';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // @ts-ignore
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-clicked' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
