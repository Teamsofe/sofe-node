// Sofe Node Service Worker
// Strategy: stale-while-revalidate for static assets, network-first for HTML pages
// Bump CACHE_VERSION whenever you want to force users to fetch latest assets

const CACHE_VERSION = 'sofe-v1.0.1';
const STATIC_CACHE  = 'sofe-static-' + CACHE_VERSION;
const RUNTIME_CACHE = 'sofe-runtime-' + CACHE_VERSION;

// Files cached on install — the app shell needed for offline browsing
const APP_SHELL = [
  '/',
  '/index.html',
  '/academy.html',
  '/about.html',
  '/bie.html',
  '/manifest.json',
  '/css/login.css',
  '/css/signup.css',
  '/js/sofe-navbar.js',
  '/firebase.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/apple-touch-icon.png',
  '/offline.html',
];

// URL patterns that should ALWAYS go to the network (never cached)
// These are auth-sensitive or change frequently
const NETWORK_ONLY = [
  /\/login(\.html)?($|\?)/,
  /\/signup(\.html)?($|\?)/,
  /\/admin/,
  /firestore\.googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebasestorage\.googleapis\.com/,
  /accounts\.google\.com/,
  /apis\.google\.com/,
  /paystack\.com/,
  /paystack\.co/,
];

// ── INSTALL ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        // Add files individually so one missing file doesn't fail the whole install
        return Promise.all(
          APP_SHELL.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Skip cache for', url, err.message))
          )
        );
      })
      .then(() => self.skipWaiting())  // Activate new SW immediately
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith('sofe-') && name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())  // Take over open pages immediately
  );
});

// ── FETCH ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // BAIL OUT EARLY on requests we should never touch.
  // This prevents the SW from interfering with auth, Firestore, Paystack, etc.
  // We do this BEFORE any other logic so there's zero chance of crashing the request.

  // Skip non-GET requests (POST/PUT/DELETE — auth endpoints use POST, Firestore uses POST too)
  if (req.method !== 'GET') return;

  // Parse URL safely
  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return; // Invalid URL — let browser handle
  }

  // Skip non-http(s) protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip Chrome extensions, dev tools, etc.
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost') {
    // localhost only skipped for non-asset requests; static assets still cached on prod
  }

  // Skip cross-origin requests entirely except for explicitly cached fonts/CDN
  // This is the critical fix: anything going to *.googleapis.com, *.paystack.com, etc.
  // is left COMPLETELY ALONE by the service worker.
  if (url.origin !== self.location.origin) {
    // Only handle a small allow-list of known-safe cross-origin assets (fonts)
    const safeFontHosts = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    if (!safeFontHosts.includes(url.hostname)) {
      return; // Let browser handle natively, no SW involvement
    }
  }

  // Now that we know the request is same-origin (or safe font), apply caching strategy

  // HTML navigation — network first, fallback to cache, fallback to offline page
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          if (response && response.ok) {
            const cloned = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(req, cloned)).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          return caches.match(req)
            .then(cached => cached || caches.match('/offline.html'))
            .then(resp => resp || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }));
        })
    );
    return;
  }

  // Static assets (CSS, JS, images, fonts) — stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(response => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const cloned = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(req, cloned)).catch(() => {});
          }
          return response;
        })
        .catch(err => {
          console.warn('[SW] Fetch failed for', req.url, err.message);
          // CRITICAL: must return a Response, not null/undefined
          return cached || new Response('', { status: 504, statusText: 'Gateway Timeout' });
        });

      // Return cache immediately if available, otherwise wait for network
      return cached || fetchPromise;
    }).catch(err => {
      // Last resort — must return a Response
      console.warn('[SW] Cache match failed for', req.url, err.message);
      return new Response('', { status: 504 });
    })
  );
});

// ── MESSAGES ─────────────────────────────────────────────────────────
// Allow page to send a message to skip waiting (force update)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
