const CACHE_NAME = 'vertice-gym-v1.6'; // IMPORTANTE: Cambiar versión
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.jpeg'
];

// Definir el scope de nuestro dominio
const APP_ORIGIN = self.location.origin;

// Instalación
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v1.6');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Abriendo caché:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando v1.6');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Borrando caché antiguo:', cacheName);
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
    console.log('[SW] Ignorando dominio externo:', url.origin);
    return; // Esto está OK porque es dominio externo
  }

  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    console.log('[SW] Ignorando método:', event.request.method);
    return fetch(event.request); // ← FIX: Devolver el fetch
  }

  // NO cachear API (pero sí hacer el fetch)
  if (url.pathname.startsWith('/api') || url.pathname.includes('/devVentas/')) {
    console.log('[SW] Request API, no cachear:', url.pathname);
    event.respondWith(fetch(event.request)); // ← FIX: Hacer el fetch
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