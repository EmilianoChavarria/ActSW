const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const ASSETS = [
  './',
  './index.html',
  './calendario.html',
  './formulario.html',
  './main.js',
];

// Recursos CDN a cachear dinámicamente
const CDN_KEYWORDS = [
  'cdn.jsdelivr.net',
  'fullcalendar',
  'select2',
];

// --- INSTALACIÓN ---
self.addEventListener('install', event => {
  console.log('🛠 Instalando Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async cache => {
        for (const asset of ASSETS) {
          try {
            await cache.add(asset);
            console.log(`✅ Cacheado: ${asset}`);
          } catch (err) {
            console.warn(`⚠️ No se pudo cachear ${asset}`, err);
          }
        }
      })
  );
});


// --- FETCH ---
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  const isCDN = CDN_KEYWORDS.some(keyword => url.includes(keyword));

  if (isCDN) {
    // 🔄 Estrategia de caché dinámico
    event.respondWith(
      caches.match(request)
        .then(cacheResponse => {
          if (cacheResponse) {
            console.log(`📦 [Cache] ${url}`);
            return cacheResponse;
          }

          console.log(`🌐 [Red] Cacheando dinámicamente ${url}`);
          return fetch(request)
            .then(networkResponse => {
              const clone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
              return networkResponse;
            })
            .catch(() => {
              console.warn(`⚠️ Falló red y caché: ${url}`);
            });
        })
    );
  } else {
    // ⚙️ Estrategia de caché estático para los archivos de tu app
    event.respondWith(
      caches.match(request)
        .then(cacheResponse => {
          // Si existe en cache, lo devolvemos
          if (cacheResponse) {
            console.log(`📦 [AppShell Cache] ${url}`);
            return cacheResponse;
          }

          // Si no, tratamos de obtenerlo de la red (por ejemplo, nuevas páginas)
          return fetch(request)
            .catch(() => caches.match('./index.html')); // fallback si está offline
        })
    );
  }
});
