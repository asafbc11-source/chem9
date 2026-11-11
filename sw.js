// Offline support. Everything is fetched fresh when online (so fixes arrive right away)
// and served from the cache when offline. Only same-origin GET requests are handled.
const VERSION = 'chem9-v3';
const FONTS = ['400-hebrew','400-latin','500-hebrew','500-latin','600-hebrew','600-latin','700-hebrew','700-latin'].map(f => './fonts/plex-hebrew-' + f + '.woff2')
  .concat(['./fonts/plex-mono-500-latin.woff2', './fonts/plex-mono-600-latin.woff2']);
const CORE = ['./', './index.html', './styles.css', './data.js', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'].concat(FONTS);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('chem9-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function keep(key, res) {
  if (res && res.ok && res.type === 'basic') {
    const copy = res.clone();
    caches.open(VERSION).then(c => c.put(key, copy));
  }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => keep('./index.html', res)).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(req).then(res => keep(req, res)).catch(() => caches.match(req, {ignoreSearch: true})));
});
