// ============================================
// AVMS ABU ZARIA — SERVICE WORKER
// Minimal service worker to enable PWA install.
// Caches the shell on install, then serves
// network-first for everything else.
// ============================================

const CACHE_VERSION = 'avms-v1';
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/main.js',
    '/js/site-loader.js',
    '/manifest.json'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            // Best-effort precache — ignore individual failures
            return Promise.all(
                PRECACHE_URLS.map((url) =>
                    cache.add(url).catch(() => null)
                )
            );
        })
    );
    self.skipWaiting();
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ---------- FETCH ----------
// Network-first, fall back to cache. Never touch
// Supabase API calls (they need the network).
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only handle GET
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Skip cross-origin requests (Supabase, fonts, etc.)
    if (url.origin !== self.location.origin) return;

    // Skip CBT/admin/api paths — always hit network
    if (
        url.pathname.startsWith('/admin/') ||
        url.pathname.startsWith('/cbt/') ||
        url.pathname.startsWith('/api/')
    ) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Cache successful same-origin GETs for later
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(request, copy).catch(() => null);
                    });
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});
