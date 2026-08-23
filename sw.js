const STATIC_CACHE = "moadim-static-v65";
// מטמון ריצה: תשובות API וקבצים חיצוניים (ספריא, hebcal, פונטים, ספריות CDN)
// נשמרים אחרי הצפייה הראשונה — כך האתר, התפילות והספרים עובדים גם בלי אינטרנט.
const RUNTIME_CACHE = "moadim-runtime-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/synagogues.html",
  "/widget.html",
  "/site.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  // קוד ועיצוב — נדרשים כדי שהאתר באמת יעבוד אופליין כבר אחרי ביקור אחד.
  // חשוב: ה-?v= כאן חייב להיות זהה לזה שב-index.html — כך ההתקנה נענית
  // מ-HTTP cache (בלי הורדה כפולה של ~3MB) והבקשות מהדף פוגעות במטמון
  // בדיוק; סטייה עתידית מכוסה ע"י ה-fallback עם ignoreSearch.
  "/script.js?v=40",
  "/lux.js?v=38",
  "/style.css?v=44",
  "/tailwind.css?v=2",
];

// מקורות חיצוניים שמותר לשמור במטמון הריצה — רשימה סגורה.
// שירותי proxy (corsproxy/allorigins/codetabs) ו-Overpass במכוון לא כאן:
// אין לשמר לאופליין תוכן שמקורו בשירותי תיווך שאינם בשליטתנו,
// וחיפוש בתי הכנסת ממילא דורש חיבור.
const RUNTIME_CACHE_ORIGINS = [
  "https://www.sefaria.org",
  "https://www.sefaria.org.il",
  "https://www.hebcal.com",
  "https://hebcal.com",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://unpkg.com",
  "https://cdn.jsdelivr.net",
  "https://cdn.onesignal.com",
  "https://he.wikisource.org",
  "https://nominatim.openstreetmap.org",
  "https://www.toratemetfreeware.com",
];
function isRuntimeCacheable(url) {
  return (
    RUNTIME_CACHE_ORIGINS.includes(url.origin) ||
    url.hostname === "tile.openstreetmap.org" ||
    url.hostname.endsWith(".tile.openstreetmap.org")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ── בקשות חוצות-מקור: רשת תחילה, מטמון כגיבוי אופליין ──
  // (טקסטים מספריא, אירועים מ-hebcal, פונטים של גוגל, kosher-zmanim מ-CDN)
  if (url.origin !== self.location.origin) {
    // מקור שאינו ברשימה — נותנים לדפדפן לטפל כרגיל, בלי לשמור במטמון
    if (!isRuntimeCacheable(url)) return;
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            // גם תשובות opaque (no-cors: פונטים/סקריפטים) נשמרות לאופליין
            if (response && (response.ok || response.type === "opaque")) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() =>
            cache
              .match(request, { ignoreVary: true })
              .then((cached) => cached || Response.error()),
          ),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/index.html"))
            // גם הרשת נפלה וגם המטמון ריק (התקנה ראשונה אופליין / שרת פיתוח
            // באמצע רענון): בלי Response תקין respondWith זורק
            // "Failed to convert value to 'Response'" — מחזירים דף שגיאה מסודר
            .then(
              (cached) =>
                cached ||
                new Response(
                  '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>אין חיבור</title><body style="font-family:sans-serif;text-align:center;padding:3rem;"><h1>📡 אין חיבור לאינטרנט</h1><p>בדקו את החיבור ונסו שוב.</p></body></html>',
                  { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
                ),
            ),
        ),
    );
    return;
  }

  const isStaticAsset =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "worker" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "manifest";

  if (!isStaticAsset) {
    // בקשות GET אחרות מאותו המקור — רשת עם גיבוי מטמון לאופליין
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request).then((cached) => cached || Response.error())),
      ),
    );
    return;
  }

  // Network-first for scripts & styles: users always get the newest code
  // when online (fixes "stuck on old version for weeks"); cache is only a
  // fallback for offline. Other static assets (images/fonts) stay cache-first.
  const isCodeAsset =
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "worker";

  if (isCodeAsset) {
    // cache:"no-cache" forces revalidation against the server even when an
    // intermediate HTTP cache holds a stale copy — the SW cache remains the
    // offline fallback only.
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(request, { ignoreSearch: true }))
            .then((cached) => cached || Response.error()),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        // רשת נפלה: fallback עם ignoreSearch — "/icon-192.png?v=3" נענה מהרשומה
        // "/icon-192.png" שבהתקנה. בלי Response תקין respondWith(undefined)
        // מתפוצץ כ-net::ERR_FAILED בקונסול — לכן תמיד מחזירים Response.
        .catch(() =>
          cached ||
          caches
            .match(request, { ignoreSearch: true })
            .then((alt) => alt || Response.error()),
        );

      return cached || networkFetch;
    }),
  );
});
