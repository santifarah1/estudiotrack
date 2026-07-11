/* Service Worker de EstudioTrack
   Cachea la app para que abra al instante y la interfaz ande sin conexión.
   (Las llamadas a la IA sí necesitan internet; el resto queda cacheado.) */

const CACHE = 'estudiotrack-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// instalar: guardar los archivos base
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

// activar: limpiar caches viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch: red primero para la navegación (así ves la última versión),
// cache como respaldo si no hay internet. No tocar llamadas a APIs externas.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // dejar pasar sin cachear: llamadas a la IA, al worker y a CDNs externos
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
