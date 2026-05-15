const CACHE = 'meeks-quoter-v12';
const ASSETS = [
    '/',
    '/index.html',
    '/favicon.svg',
    '/manifest.json'
];

self.addEventListener('install', e => {
    // Do NOT skipWaiting — let the update banner control activation
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

// Banner taps send SKIP_WAITING → activates new SW → page reloads
self.addEventListener('message', e => {
    if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // Cache-first for same-origin, network-first for Google Fonts / CDN
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return res;
        }))
    );
});
