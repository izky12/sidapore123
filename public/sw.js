// Service worker Sidapore — offline-first untuk seluruh aplikasi.
// - Halaman penting (login, dashboard staff/admin, kasir) di-precache saat install.
// - Navigasi: network-first, fallback ke cache saat offline (tahan refresh tanpa internet).
// - Aset statis (_next/static, ikon, font): cache-first (jarang berubah per build).
// - Request lintas-domain (mis. Supabase) TIDAK disentuh SW ini — dibiarkan langsung ke jaringan
//   agar auth & data selalu aktual saat online, dan gagal alami saat offline (ditangani antrean lokal).

const VERSION = "v2";
const CACHE = `sidapore-${VERSION}`;

const SHELL = [
  "/",
  "/login",
  "/staff",
  "/staff/kasir",
  "/admin",
  "/admin/kos",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        SHELL.map((url) => cache.add(url).catch(() => {})) // jangan gagal total kalau 1 halaman butuh login
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return; // POST/PUT dsb (mis. ke Supabase) biar lewat apa adanya
  if (url.origin !== self.location.origin) return; // jangan cache API pihak ketiga

  // Aset statis build: cache-first, hemat kuota & cepat walau online
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Halaman/dokumen: network-first, fallback cache -> fallback shell saat offline total
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return (await caches.match(url.pathname)) || (await caches.match("/"));
        }
        return Response.error();
      })
  );
});

// Memungkinkan halaman memicu pembaruan SW segera (mis. setelah deploy baru)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
