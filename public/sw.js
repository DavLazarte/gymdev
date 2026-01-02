const CACHE_NAME = 'vertice-gym-v1.5'; // Incrementa esto en cada deploy
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.jpeg'
];

// Instalación: Guardar recursos básicos y saltar espera
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Abriendo caché:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Fuerza a que sea el SW activo de inmediato
  );
});

// Activación: Limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de todas las pestañas abiertas
  );
});

// Estrategia de red: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET y evitar cachear API o recursos externos innecesarios
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Ignorar llamadas a la API (backend) para evitar problemas de memoria y datos viejos
  if (url.pathname.startsWith('/api') || url.pathname.includes('/devVentas/')) return;

  // Ignorar esquemas no soportados (chrome-extension, etc)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar la respuesta para guardarla en caché si es válida
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla, intentar buscar en caché
        return caches.match(event.request);
      })
  );
});
