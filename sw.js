/**
 * MAHALLA TIZIMI — SERVICE WORKER v2.0
 * Offline qo'llab-quvvatlash + Push Notifications
 */

const CACHE_NAME = 'mahalla-v2';

const PRECACHE = [
  '/',
  '/rais.html',
  '/admin.html',
  '/css/main.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/api.js',
  '/js/rais.js',
  '/js/admin.js',
];

// ============================================================
// INSTALL
// ============================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE
// ============================================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============================================================
// FETCH — Network first, kesh fallback
// ============================================================
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ============================================================
// PUSH NOTIFICATION — Topshiriq kelganda
// ============================================================
self.addEventListener('push', event => {
  let data = { title: 'Mahalla Tizimi', body: 'Yangi bildirishnoma', icon: '/icons/icon-192.png' };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch {}
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon  || '/icons/icon-192.png',
      badge:   data.badge || '/icons/icon-192.png',
      tag:     data.tag   || 'mahalla-push',
      vibrate: [200, 100, 200],
      data:    data.data  || { url: '/rais.html' },
      actions: [
        { action: 'open',    title: "Ko'rish" },
        { action: 'dismiss', title: 'Yopish' },
      ],
    })
  );
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/rais.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(url));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
