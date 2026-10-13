const CACHE_NAME = 'devgym-pwa-v2.0.0';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.jpeg'
];

// Definir el scope de nuestro dominio
const APP_ORIGIN = self.location.origin;

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRÍTICO: Solo interceptar requests de NUESTRO dominio
  if (url.origin !== APP_ORIGIN) {
    return;
  }

  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }

  // NO cachear API ni landings públicas dinámicas
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/box/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Estrategia Network First con fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas válidas
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        console.log('[SW] Fallo de red, buscando en caché:', event.request.url);
        return caches.match(event.request);
      })
  );
});