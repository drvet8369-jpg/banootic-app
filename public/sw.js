// This is a basic service worker.
// It's currently empty but can be extended for offline caching, push notifications, etc.

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // We are not caching anything for now, just passing the request through.
  event.respondWith(fetch(event.request));
});
