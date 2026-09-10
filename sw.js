// Guarda o roteiro no aparelho para abrir sem internet.
const CACHE = "roteiro-set-2026-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

const timeout = ms => new Promise((_, reject) => setTimeout(reject, ms));

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Página: tenta a versão mais nova por 3 segundos; sem sinal, abre a guardada.
  if (req.mode === "navigate") {
    event.respondWith(
      Promise.race([fetch(req), timeout(3000)])
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Ícones e fontes: usa o que já está guardado e guarda o que for novo.
  event.respondWith(
    caches.match(req).then(hit =>
      hit ||
      fetch(req).then(res => {
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
    )
  );
});
