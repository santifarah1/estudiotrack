/* Service Worker de EstudioTrack
   Cachea la app para que abra al instante y la interfaz ande sin conexión.
   (Las llamadas a la IA sí necesitan internet; el resto queda cacheado.)

   IMPORTANTE AL PUBLICAR UNA VERSIÓN NUEVA:
   Cambiá el número de VERSION de abajo. El navegador compara este archivo
   byte a byte: si no cambia, NUNCA se entera de que hay algo nuevo y la app
   queda pegada a la versión vieja. */

const VERSION = '2026-07-19-01';
const CACHE = 'estudiotrack-' + VERSION;

// El HTML NO va acá: se busca siempre en la red (ver fetch más abajo).
// Solo cacheamos lo que casi no cambia.
const ARCHIVOS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// instalar: guardar los archivos base.
// NO usamos skipWaiting acá: esperamos a que el usuario acepte actualizar.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).catch(() => {})
  );
});

// el usuario tocó "Actualizar" en el banner: activar esta versión ya mismo
self.addEventListener('message', (e) => {
  if (e.data && e.data.tipo === 'ACTIVAR_YA') {
    self.skipWaiting();
  }
});

// activar: limpiar caches viejos y tomar control
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch:
//  - HTML (navegación): SIEMPRE red primero. Así una versión nueva se ve enseguida.
//    Solo si no hay internet, se usa la copia cacheada.
//  - Resto: cache primero (rápido).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // dejar pasar sin tocar: llamadas a la IA y a CDNs externos
  if (url.origin !== self.location.origin) return;

  // El HTML nunca se sirve de cache si hay internet
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copia)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
