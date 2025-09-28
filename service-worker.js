
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('regn-cache').then(function(cache) {
      return cache.addAll([
        '/regn/index.html',
        '/regn/favicon.png',
        '/regn/manifest.json'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
