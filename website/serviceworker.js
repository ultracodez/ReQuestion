const CACHE_NAME = "version-1";
const urlsToCache = [
  "index.html",
  "demo.html",
  "about.html",
  "extension.html",
  "roadmap.html",
  "analysis.html",
  "src/events.js"
  //"offline.html",
];

//alert("sv");

// Install the service worker and open the cache and add files mentioned in array to cache
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Listens to request from application.
self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) {
        console.log(response);
        // The requested file exists in cache so we return it from cache.
        return response;
      }

      // The requested file is not present in cache so we send it forward to the internet
      return fetch(event.request);
    })
  );
});

self.addEventListener("activate", function (event) {
  self.clients.claim();
  var cacheWhitelist = []; // add cache names which you do not want to delete
  cacheWhitelist.push(CACHE_NAME);
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
