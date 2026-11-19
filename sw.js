// ============================================================
// Service Worker - Joyo Kanji Dictionary
// ============================================================

// Bump this when files change: it is what makes a returning visitor pick up new code.
const CACHE_NAME = 'joyo-kanji-v2';

// The app shell: everything needed to open the dictionary and start a quiz offline.
// SVG stroke/animation files are NOT listed here (1000+ files); they are cached on
// first use by the fetch handler instead.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',

  './css/joyo.css',
  './css/quiz.css',

  './js/N5-Joyo.js',
  './js/N4-Joyo.js',
  './js/N3-Joyo.js',
  './js/joyo-core.js',

  './js/quiz/quiz-sounds.js',
  './js/quiz/quiz-mastery.js',
  './js/quiz/quiz-progress.js',
  './js/quiz/quiz-data.js',
  './js/quiz/quiz-core.js',
  './js/quiz/quiz-ui.js',

  './js/N5-Quiz-Sentences.js',
  './js/N4-Quiz-Sentences.js',
  './js/N3-Quiz-Sentences.js',

  './images/icons/icon-48x48.png',
  './images/icons/icon-72x72.png',
  './images/icons/icon-96x96.png',
  './images/icons/icon-144x144.png',
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png',
  './images/icons/antonio-mark.png',
  './images/icons/antonio-mark-64.png',
];

// Install: cache the shell. Each file is cached independently so one 404 cannot
// abort the whole install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch((err) => console.warn('Not cached:', url, err)),
        ),
      ),
    ).then(() => self.skipWaiting()),
  );
});

// Activate: drop old caches and take over open pages straight away.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: cache-first, then network. Same-origin GETs that were not precached
// (kanji SVGs, icons) are stored on first use so they work offline afterwards.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const url = new URL(request.url);
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          request.mode === 'navigate'
            ? caches.match('./index.html')
            : new Response('Offline - please connect to the internet', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
              }),
        );
    }),
  );
});
