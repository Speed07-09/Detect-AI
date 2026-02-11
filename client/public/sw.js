self.addEventListener('install', (event) => {
  console.log('Service Worker installed for Detect AI');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});