var cacheName = "cache-0"

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        'lex_fridman_podcast_quotes.json.gz',
        'script.js',
        'pako.min.js',
        'style.css',
        'loading_animation.gif'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
