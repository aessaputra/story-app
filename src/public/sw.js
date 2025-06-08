const CACHE_NAME = 'story-app-cache-v1.5';
const DICODING_API_DOMAIN = 'story-api.dicoding.dev';
const UNPKG_DOMAIN = 'unpkg.com';

const STATIC_ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS_TO_PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName.startsWith('story-app-cache')
            ) {
              return caches.delete(cacheName);
            }
            return null;
          })
        )
      )
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.hostname === DICODING_API_DOMAIN) {
    if (url.pathname.includes('/stories')) {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            JSON.stringify({
              error: true,
              message: 'Offline. Data cerita tidak bisa diambil dari API.',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503,
            }
          );
        })
      );
    } else {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            JSON.stringify({
              error: true,
              message: 'Offline. Request ke API tidak bisa diproses.',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );
    }
    return;
  }

  if (url.hostname === UNPKG_DOMAIN) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return networkResponse;
            })
            .catch(() => {})
        );
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          return (
            cachedResponse ||
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return networkResponse;
            })
          );
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Resource not available offline.', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
          });
        })
    );
    return;
  }
});

self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Story App Pemberitahuan',
    options: {
      body: 'Anda mendapatkan pemberitahuan baru!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData.title = payload.title || notificationData.title;
      if (payload.options) {
        notificationData.options = {
          ...notificationData.options,
          ...payload.options,
        };
        if (payload.options.data && payload.options.data.url) {
          notificationData.options.data.url = payload.options.data.url;
        }
      }
    } catch {
      notificationData.options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  clickedNotification.close();

  const urlToOpen =
    clickedNotification.data && clickedNotification.data.url
      ? clickedNotification.data.url
      : '/';
  const absoluteUrlToOpen = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        let clientIsFound = false;
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === absoluteUrlToOpen && 'focus' in client) {
            client.focus();
            clientIsFound = true;
            break;
          }
        }
        if (!clientIsFound && clients.openWindow) {
          return clients.openWindow(absoluteUrlToOpen);
        }
      })
      .catch(() => {})
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || !event.data.type) return;

  switch (event.data.type) {
    case 'GET_REGISTRATION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(self.registration);
      }
      break;
    case 'SUBSCRIBE_PUSH':
      self.registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        .then((subscription) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              success: true,
              subscription: subscription.toJSON(),
            });
          }
        })
        .catch((error) => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              success: false,
              error: error.message,
            });
          }
        });
      break;
    case 'SIMULATE_PUSH':
      const { title, options } = event.data.payload;
      if (title && options) {
        self.registration.showNotification(title, options);
      }
      break;
    default:
      break;
  }
});
