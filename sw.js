// sw.js - Service Worker for Joyo Kanji Dictionary

const CACHE_NAME = 'joyo-kanji-v1';

// Install event - cache assets individually (more robust)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Try to cache each file individually
        const urls = [
          '/joyo-kanji/',
          '/joyo-kanji/index.html',
          '/joyo-kanji/manifest.json',
          '/joyo-kanji/css/joyo.css',
          '/joyo-kanji/js/joyo-core.js',
          '/joyo-kanji/js/N5-Joyo.js',
          '/joyo-kanji/js/N4-Joyo.js',
          '/joyo-kanji/js/N3-Joyo.js'
        ];
        
        // Use addAll with a catch for each file
        return Promise.all(
          urls.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              // Continue with other files
            });
          })
        );
      })
      .catch(err => {
        console.error('Cache failed:', err);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          return new Response('Offline - please connect to the internet');
        });
      })
  );
});