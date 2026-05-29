const CACHE_NAME = 'jc-imob-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Instalar e fazer cache dos assets principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network first, fallback para cache
self.addEventListener('fetch', e => {
  // Deixar requisições para o Supabase passarem direto (sempre online)
  if (e.request.url.includes('supabase.co')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Salvar no cache se for sucesso
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: usar cache
        return caches.match(e.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
