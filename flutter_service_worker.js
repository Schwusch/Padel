'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "favicon.png": "a99b6503b85104313bb5f47e06df9a62",
"assets/assets/fonts/Raleway-Medium.ttf": "430a0518f5ff3b6c8968b759a29b36e2",
"assets/assets/fonts/Raleway-Regular.ttf": "580d0778ad254335be45bf58bb449f43",
"assets/assets/fonts/Quicksand-Medium.ttf": "0c64233241ead44bffbec54eb9d1d164",
"assets/assets/fonts/Quicksand_Bold.otf": "c3bf00e585782373e1b601c07b513d85",
"assets/assets/images/match_icon.webp": "0b2601561ede6f5a48e355eb7a75b77b",
"assets/assets/images/padel.gif": "436f68925a29cad41b616b7b5f8ca69e",
"assets/assets/images/racket.webp": "f2a4df5081b0182e6d8257f56d14321f",
"assets/assets/images/pade_ball_1.webp": "65fc5daca4fdcd5d551a22a4cb69e9ed",
"assets/assets/images/patreon_logo_white.png": "2d214e28c1c456285b1b06affaf4553e",
"assets/assets/images/ball.webp": "3f4f7d702320cc81a90462aeef7df2d0",
"assets/assets/images/icon.png": "4b8bc777ffc1b309ece21714ae06b9e9",
"assets/assets/images/padel_anim.gif": "6935f639f13c8adf1d01fa80eb63aee6",
"assets/assets/images/patreon_wordmark_white.png": "c08703418366a2ae310465b84906e834",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/NOTICES": "e392716f27d6c22566206eb2caa3a808",
"assets/FontManifest.json": "67d558ec264bc2595484d1ad16955e0d",
"assets/packages/flutter_markdown/assets/logo.png": "67642a0b80f3d50277c44cde8f450e50",
"assets/packages/material_design_icons_flutter/lib/fonts/materialdesignicons-webfont.ttf": "c1242726c7eac4eb5e843d826f78fb1b",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "b14fcf3ee94e3ace300b192e9e7c8c5d",
"assets/AssetManifest.json": "adce5b322dbbb9276ad4fb57b423e5f5",
"manifest.json": "5eff2e25fcc2914b3e8ac53bcc276f64",
"main.dart.js": "a2edc32564f3dffce66b9d3ade516e27",
"loading.css": "2d2480cfa9b5d95fa1d8ff3ba1865b8d",
"version.json": "3c92df60723865d07ba975cd11eeffb9",
"index.html": "222909278fbc17e89ec2fda0fe6b9eaf",
"/": "222909278fbc17e89ec2fda0fe6b9eaf",
"icons/Icon-192.png": "8969ee02af735088a5c9222d3e88d1b3"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
