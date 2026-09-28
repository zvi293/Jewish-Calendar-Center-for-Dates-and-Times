const STATIC_CACHE = "moadim-static-v89";
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
  // icon-512 אינו בשימוש בזמן ריצה (רק במניפסט/התקנה) — לא מורידים 97KB בכל התקנת SW
  // קוד ועיצוב — נדרשים כדי שהאתר באמת יעבוד אופליין כבר אחרי ביקור אחד.
  // חשוב: ה-?v= כאן חייב להיות זהה לזה שב-index.html — כך ההתקנה נענית
  // מ-HTTP cache (בלי הורדה כפולה של ~3MB) והבקשות מהדף פוגעות במטמון
  // בדיוק; סטייה עתידית מכוסה ע"י ה-fallback עם ignoreSearch.
  "/script.js?v=58",
  "/lux.js?v=57",
  "/style.css?v=62",
  "/tailwind.css?v=2",
  "/fonts.css?v=1",
  "/fonts/assistant-hebrew.woff2",
  "/fonts/frank-ruhl-libre-hebrew.woff2",
  // ספריית הזמנים מוגשת מאותו מקור (במקום unpkg) — הגרסה בשם הקובץ
  "/kosher-zmanim-0.9.0.min.js",
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
  // nominatim (גיאוקוד הפוך) במכוון לא כאן: ה-URL מכיל קואורדינטות מדויקות של
  // המשתמש ואין טעם לשמר אותן במטמון ללא תפוגה; החיפוש ממילא דורש חיבור.
  "https://www.toratemetfreeware.com",
];
function isRuntimeCacheable(url) {
  return (
    RUNTIME_CACHE_ORIGINS.includes(url.origin) ||
    url.hostname === "tile.openstreetmap.org" ||
    url.hostname.endsWith(".tile.openstreetmap.org")
  );
}

// ── רשת חלשה / אין רשת (09/2026) ──────────────────────────────────────────
// עיקרון: האתר תמיד נפתח מיד. כשיש עותק שמור, הרשת מקבלת "חלון" קצר בלבד —
// איטית מזה, עונים מהעותק השמור והבקשה לרשת ממשיכה ברקע ומעדכנת את המטמון
// לפתיחה הבאה (כך גם גרסה חדשה של האתר נקלטת בביקור הבא, בלי להיתקע על ישנה).
// בלי עותק שמור — מחכים לרשת כרגיל. אופליין מוצהר (navigator.onLine) — מיד מהמטמון.
const NAV_NET_WINDOW_MS = 2500; // דף ה-HTML (ניווט)
const CODE_NET_WINDOW_MS = 1200; // סקריפטים/עיצוב (ממוסמכים ב-?v=)
const RUNTIME_NET_WINDOW_MS = 4000; // hebcal/ספריא/קבצים חיצוניים ובקשות GET אחרות
// אחרי שחלון פקע (= הרשת איטית עכשיו) — במשך דקה כל מה שיש לו עותק שמור (דף, קוד,
// נתונים) נענה מיד, בלי לחכות שוב לחלון (מעבר בין דפים/רענון ברשת חלשה); העדכון
// מהרשת ממשיך ברקע כרגיל (בנכסי קוד ממוסמכים — אין צורך בו, ראו למטה)
const SLOW_NET_MEMORY_MS = 60000;
let slowNetUntil = 0;

function isOffline() {
  return !!(self.navigator && self.navigator.onLine === false);
}
function netLooksSlow() {
  return isOffline() || Date.now() < slowNetUntil;
}

// מרוץ בין הרשת לעותק השמור: הרשת מנצחת אם ענתה (תשובה שמישה) בתוך החלון,
// אחרת — העותק השמור (onLose נקרא כשהחלון פקע). network נדחית על תשובה לא שמישה.
// אופליין או רשת שזוהתה כאיטית בדקה האחרונה — העותק השמור מיד, בלי חלון.
// noteSlow=false (שרתים חיצוניים): חלון שפקע לא מסמן "רשת איטית" — שרת צד-ג'
// שמתעכב (ספריא מחשבת טקסט ארוך) אינו עדות לחיבור איטי אל האתר עצמו.
function raceNetworkWithCached(network, cached, windowMs, onLose, noteSlow = true) {
  if (netLooksSlow()) {
    network.catch(() => {}); // נכשלה ברקע — בלי "Uncaught (in promise)" בקונסול של ה-SW
    if (onLose) onLose();
    return Promise.resolve(cached);
  }
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (noteSlow) slowNetUntil = Date.now() + SLOW_NET_MEMORY_MS;
      if (onLose) onLose();
      resolve(cached);
    }, windowMs);
    network.then(
      (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(response);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(cached);
      },
    );
  });
}

// מפתח מטמון לדפים: הנתיב בלי פרמטרים ("/?open=zmanim" ו-"/" → "/index.html") —
// כל הווריאציות הן אותו HTML, כך שהעותק השמור תמיד הטרי ביותר ולא נצברות כפילויות
function navCacheKey(url) {
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  return url.origin + path;
}

// דף HTML נשמר כעותק האופליין רק אם כל נכסי הקוד הממוסמכים (?v=) שהוא מפנה אליהם
// כבר במטמון — כך העותק השמור תמיד עקבי. אחרת (גרסה חדשה שהסקריפטים שלה עוד לא
// ירדו) פתיחה ברשת חלשה הייתה מקבלת HTML חדש בלי הקוד שלו וממתינה לו עשרות שניות.
// גרסה חדשה נכנסת למטמון בשלמותה בהתקנת ה-SW החדש (addAll), או בניווט שאחרי
// שהדף עצמו כבר טען את הנכסים החדשים.
function cacheShellIfConsistent(key, response) {
  return response
    .clone()
    .text()
    .then((html) => {
      const refs = new Set();
      const re = /["'(]\/?([\w.\-/]+\.(?:js|css)\?v=[\w.-]+)["')]/g;
      let m;
      while ((m = re.exec(html))) refs.add("/" + m[1]);
      return Promise.all([...refs].map((ref) => caches.match(ref))).then((hits) => {
        if (hits.some((hit) => !hit)) return;
        return caches.open(STATIC_CACHE).then((cache) => cache.put(key, response));
      });
    })
    .catch(() => {});
}

function offlinePage() {
  return new Response(
    '<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>אין חיבור</title><body style="font-family:sans-serif;text-align:center;padding:3rem;"><h1>📡 אין חיבור לאינטרנט</h1><p>בדקו את החיבור ונסו שוב.</p></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
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
  // באג ידוע של כרום: only-if-cached שאינו same-origin נכשל ב-fetch — לא מתערבים
  if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;

  const url = new URL(request.url);

  // ── בקשות חוצות-מקור: רשת בחלון קצר, מטמון כגיבוי (אופליין / רשת איטית) ──
  // (טקסטים מספריא, אירועים מ-hebcal, פונטים של גוגל, kosher-zmanim מ-CDN)
  if (url.origin !== self.location.origin) {
    // מקור שאינו ברשימה — נותנים לדפדפן לטפל כרגיל, בלי לשמור במטמון
    if (!isRuntimeCacheable(url)) return;
    let stored = Promise.resolve();
    const network = fetch(request).then((response) => {
      // גם תשובות opaque (no-cors: פונטים/סקריפטים) נשמרות לאופליין
      if (response && (response.ok || response.type === "opaque")) {
        const copy = response.clone();
        stored = caches
          .open(RUNTIME_CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
      }
      return response;
    });
    // waitUntil — גם כשעונים מהמטמון, התשובה מהרשת ממשיכה ונכתבת למטמון
    event.waitUntil(network.then(() => stored, () => {}));
    event.respondWith(
      caches
        .open(RUNTIME_CACHE)
        .then((cache) => cache.match(request, { ignoreVary: true }))
        .catch(() => null)
        .then((cached) => {
          if (!cached) return network.catch(() => Response.error());
          return raceNetworkWithCached(
            network.then((r) => (r && (r.ok || r.type === "opaque") ? r : Promise.reject(r))),
            cached,
            RUNTIME_NET_WINDOW_MS,
            null,
            false,
          );
        }),
    );
    return;
  }

  if (request.mode === "navigate") {
    // ניווט: רשת תחילה בחלון של 2.5 שניות. רשת איטית/נפולה — הדף השמור מוצג מיד,
    // והתשובה מהרשת (כשתגיע) מעדכנת את העותק לפתיחה הבאה.
    const key = navCacheKey(url);
    let stored = Promise.resolve();
    const network = fetch(request).then((response) => {
      // רק תשובה תקינה נשמרת כעותק האופליין של הדף — 404/5xx לא דורסים עותק טוב
      if (response && response.ok) {
        stored = cacheShellIfConsistent(key, response.clone());
      }
      return response;
    });
    event.waitUntil(network.then(() => stored, () => {}));
    event.respondWith(
      caches
        .match(key)
        .catch(() => null)
        .then((cached) => {
          if (cached) {
            return raceNetworkWithCached(
              // שגיאת שרת (5xx) — עדיף העותק השמור; 404 אמיתי מוצג כמו שהוא
              network.then((r) => (r && r.status < 500 ? r : Promise.reject(r))),
              cached,
              NAV_NET_WINDOW_MS,
            );
          }
          return network.catch(() =>
            caches
              .match("/index.html")
              // גם הרשת נפלה וגם המטמון ריק (התקנה ראשונה אופליין / שרת פיתוח
              // באמצע רענון): בלי Response תקין respondWith זורק
              // "Failed to convert value to 'Response'" — מחזירים דף שגיאה מסודר
              .then((fallback) => fallback || offlinePage()),
          );
        }),
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
    // בקשות GET אחרות מאותו המקור — רשת בחלון קצר, גיבוי מטמון לאופליין/רשת איטית
    let stored = Promise.resolve();
    const network = fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        stored = caches
          .open(RUNTIME_CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
      }
      return response;
    });
    event.waitUntil(network.then(() => stored, () => {}));
    event.respondWith(
      caches
        .open(RUNTIME_CACHE)
        .then((cache) => cache.match(request))
        .catch(() => null)
        .then((cached) => {
          if (!cached) return network.catch(() => Response.error());
          return raceNetworkWithCached(
            network.then((r) => (r && r.ok ? r : Promise.reject(r))),
            cached,
            RUNTIME_NET_WINDOW_MS,
          );
        }),
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
    // תיקון FOUC (09/2026): ברשת איטית האימות-מול-שרת עיכב את ה-CSS בשניות והדף
    // נראה "HTML בלי עיצוב". ה-URL-ים ממוסמכים ב-?v= (אותו URL = אותו תוכן), לכן
    // כשיש עותק במטמון נותנים לרשת חלון קצר בלבד — איטית מזה, עונים מיידית
    // מהמטמון. רשת שכבר זוהתה כאיטית (חלון שפקע בדקה האחרונה) או אופליין — מהמטמון
    // מיד, בלי בקשת רשת בכלל (לא מבזבזים רוחב-פס של רשת חלשה).
    // עקביות (09/2026): נכתב למטמון רק מה שהדף עצמו קיבל מהרשת. בקשה שהפסידה
    // למטמון מבוטלת ולא נשמרת — אחרי דיפלוי השרת מגיש לכתובת הישנה (?v= ישן) את
    // הקובץ החדש, ושמירתו הייתה מצמידה לדף ה-HTML הישן שבמטמון קוד של גרסה אחרת.
    let release;
    event.waitUntil(new Promise((resolve) => (release = resolve)));
    const storeServed = (response) => {
      // רק תשובה תקינה נכנסת למטמון — 404/5xx רגעי לא דורס עותק עובד
      if (!response || !response.ok) return Promise.resolve();
      const copy = response.clone();
      return caches
        .open(STATIC_CACHE)
        .then((cache) => cache.put(request, copy))
        .catch(() => {});
    };
    event.respondWith(
      caches
        .match(request)
        .then((cached) => {
          if (cached && netLooksSlow()) {
            release();
            return cached;
          }
          const ctrl = typeof AbortController === "function" ? new AbortController() : null;
          const network = fetch(request, { cache: "no-cache", signal: ctrl ? ctrl.signal : undefined });
          if (!cached) {
            return network.then(
              (response) => {
                storeServed(response).then(release, release);
                return response;
              },
              () => {
                release();
                return caches
                  .match(request, { ignoreSearch: true })
                  .then((alt) => alt || Response.error());
              },
            );
          }
          return raceNetworkWithCached(
            network.then((r) => (r && r.ok ? r : Promise.reject(r))),
            cached,
            CODE_NET_WINDOW_MS,
            () => ctrl && ctrl.abort(),
          ).then((response) => {
            if (response !== cached) storeServed(response).then(release, release);
            else release();
            return response;
          });
        })
        .catch((err) => {
          release();
          throw err;
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          // תמונות/גופנים/מניפסט מאותו מקור: רק תשובות תקינות נכנסות למטמון (בלי 404 קבועים)
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
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
