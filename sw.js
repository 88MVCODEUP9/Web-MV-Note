const CACHE_NAME = "mv-note-v1"
const OFFLINE_URL = "/offline.html"

// Assets to cache for offline work
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/config.js",
  "/manifest.json",
  "/sw.js",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  void self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Remove old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    })
  )
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return
  }

  // For navigation requests, use network-first with cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response and cache it for offline
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // If all else fails, show offline page
            return caches.match(OFFLINE_URL)
          })
        })
    )
    return
  }

  // For other requests (API, assets), use stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Clone and cache the network response for next time
        const networkResponseClone = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponseClone)
        })
        return networkResponse
      })

      // Return cached version if available, otherwise wait for network
      if (cachedResponse) {
        return cachedResponse
      } else {
        return fetchPromise
      }
    })
  )
})