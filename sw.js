const CACHE = 'setas-v3';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'draw.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  // Apaga os caches de versões anteriores para não servir arquivos velhos.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Responde na hora com o que está salvo e atualiza em segundo plano,
// para funcionar sem internet e ainda receber as novas versões do site.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fresh = fetch(event.request).then((response) => {
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      });
      if (!cached) return fresh;
      event.waitUntil(fresh.catch(() => {}));
      return cached;
    }),
  );
});
