const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/db.js",
    "/styles.css",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/index.js",
    "/manifest.webmanifest"
  ];
  
  const CACHE_NAME = "budget-cache-v1";
  const DATA_CACHE_NAME = "data-cache-v1";
  
  // install
  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Files pre-cached");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
    self.skipWaiting();
  });
  
  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Old cache data removed", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    self.clients.claim();
  });
  
  // fetch
  self.addEventListener("fetch", function (event) {
    if (event.request.url.includes("/api")) {
      event.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              return cache.match(event.request);
            });
        }).catch(err => console.log(err))
      );
      return;
    }
  
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(res => {
          if (res) {
            return res
          }
          else if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/");
          }
        });
      })
    );
  });