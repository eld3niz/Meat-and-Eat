// Service Worker für Tile-Caching

const CACHE_NAME = 'map-tile-cache-v1';
const TILE_HOSTS = ['a.tile.openstreetmap.org', 'b.tile.openstreetmap.org', 'c.tile.openstreetmap.org'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle map tiles
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Try to get from cache first
        const cachedResponse = await cache.match(event.request);

        // 2. Start network request in parallel (Stale-While-Revalidate)
        const networkFetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (networkResponse && networkResponse.status === 200) {
              // Cache the new response
              cache.put(event.request, networkResponse.clone());
            }
            // Return the network response (needed for the promise chain)
            return networkResponse;
          })
          .catch((error) => {
            // Handle fetch errors gracefully (e.g., network offline)
            console.warn('Service Worker: Network fetch failed, serving stale content if available.', error);
            // Don't crash the SW. If cachedResponse exists, it was already returned.
            // If not, the browser will show a failed request based on the final return.
            // We need to return *something* if cachedResponse is null and network fails.
            // Re-throwing the error ensures the browser knows the fetch ultimately failed if nothing was cached.
            if (!cachedResponse) {
                throw error;
            }
            return new Response(null, { status: 503, statusText: 'Network Error' }); // Return dummy response if cache existed but network failed
          });

        // 3. Ensure SW stays alive for the fetch/cache operation.
        event.waitUntil(networkFetchPromise);

        // 4. Return cached response immediately if available,
        //    otherwise wait for the network fetch result (which might throw).
        return cachedResponse || networkFetchPromise;
      }).catch(error => {
          // Fallback for errors during cache open/match or re-thrown fetch errors
          console.error("Service Worker: Cache/Fetch handling error:", error);
          // Fallback to a simple network request if cache operations fail completely
          return fetch(event.request);
      })
    );
  }
  // For non-tile requests, let the browser handle them normally (implicit)
});
