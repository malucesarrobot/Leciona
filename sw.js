/* Leciona — service worker (offline básico) */
const CACHE = 'leciona-v2';
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Nunca cachear API da Anthropic, Firebase ou Wikimedia (sempre rede)
  if (/anthropic\.com|firebaseio\.com|googleapis\.com|wikimedia\.org|gstatic\.com/.test(url.host)) {
    return; // deixa o navegador lidar (rede)
  }

  // App shell e CDNs de libs: cache-first com atualização em segundo plano
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && (url.origin === location.origin || /jsdelivr|gstatic/.test(url.host))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
