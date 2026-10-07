const STATIC_CACHE = "moadim-static-v161";
// מטמון ריצה: תשובות API וקבצים חיצוניים (ספריא, hebcal, פונטים, ספריות CDN)
// נשמרים אחרי הצפייה הראשונה — כך האתר, התפילות והספרים עובדים גם בלי אינטרנט.
const RUNTIME_CACHE = "moadim-runtime-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/synagogues.html",
  "/site.webmanifest",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/icon-192.png",
  // icon-512 אינו בשימוש בזמן ריצה (רק במניפסט/התקנה) — לא מורידים 97KB בכל התקנת SW
  // קוד ועיצוב — נדרשים כדי שהאתר באמת יעבוד אופליין כבר אחרי ביקור אחד.
  // חשוב: ה-?v= כאן חייב להיות זהה לזה שב-index.html — כך ההתקנה נענית
  // מ-HTTP cache (בלי הורדה כפולה של ~3MB) והבקשות מהדף פוגעות במטמון
  // בדיוק; סטייה עתידית מכוסה ע"י ה-fallback עם ignoreSearch.
  "/script.js?v=105",
  "/lux.js?v=87",
  "/sky.js?v=8",
  "/style.css?v=109",
  "/tailwind.css?v=2",
  "/fonts.css?v=1",
  "/fonts/assistant-hebrew.woff2",
  "/fonts/frank-ruhl-libre-hebrew.woff2",
  // תת-הקבוצה הלטינית = גם הספרות והפיסוק (U+0000-00FF) — נטענת בכל דף ממילא; בלעדיה
  // אופליין במכשיר שה-SW שלו חדש התקבל net::ERR_FAILED בקונסול (09/2026)
  "/fonts/assistant-latin.woff2",
  "/fonts/frank-ruhl-libre-latin.woff2",
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
const isTileUrl = (url) =>
  url.hostname === "tile.openstreetmap.org" || url.hostname.endsWith(".tile.openstreetmap.org");
function isRuntimeCacheable(url) {
  return RUNTIME_CACHE_ORIGINS.includes(url.origin) || isTileUrl(url);
}

// אריחי המפה שנצפו נשמרים לפתיחה מהירה/אופליין — אבל עם תקרה (~600 אריחים ≈ 10MB),
// כדי שגלילה במפה לא תמלא את האחסון. put מעביר רשומה קיימת לסוף הרשימה, ולכן
// הוותיקות ביותר (לפי סדר המפתחות) הן אלו שלא נצפו הכי הרבה זמן — הן נמחקות.
const TILE_CACHE_MAX = 600;
let tileTrimPending = null;
let tilesSinceTrim = 0;
function trimTileCache() {
  // מסך מפה אחד = עשרות אריחים — בודקים את הגודל פעם ב-25 אריחים, לא על כל אחד
  if (++tilesSinceTrim < 25) return Promise.resolve();
  tilesSinceTrim = 0;
  if (tileTrimPending) return tileTrimPending;
  tileTrimPending = caches
    .open(RUNTIME_CACHE)
    .then((cache) =>
      cache.keys().then((keys) => {
        const tiles = keys.filter((req) => isTileUrl(new URL(req.url)));
        const extra = tiles.length - TILE_CACHE_MAX;
        if (extra > 0) return Promise.all(tiles.slice(0, extra).map((req) => cache.delete(req)));
      }),
    )
    .catch(() => {})
    .then(() => {
      tileTrimPending = null;
    });
  return tileTrimPending;
}

// מאגר המקומות (places/*.json?v=<חותמת תוכן>): אותה כתובת = אותו תוכן ⇒ מהמטמון מיד
// (גם ברשת איטית/אופליין), ורק גרסה חדשה יורדת מהרשת. גרסאות קודמות של אותו קובץ נמחקות.
function placesResponse(request, url) {
  return caches.open(RUNTIME_CACHE).then((cache) =>
    cache.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          cache
            .put(request, copy)
            .then(() => cache.keys())
            .then((keys) =>
              Promise.all(
                keys
                  .filter((req) => {
                    const u = new URL(req.url);
                    return u.origin === url.origin && u.pathname === url.pathname && u.search !== url.search;
                  })
                  .map((req) => cache.delete(req)),
              ),
            )
            .catch(() => {});
        }
        return response;
      });
    }),
  );
}

// ── רשת חלשה / אין רשת (09/2026) ──────────────────────────────────────────
// עיקרון: האתר תמיד נפתח מיד. כשיש עותק שמור, הרשת מקבלת "חלון" קצר בלבד —
// איטית מזה, עונים מהעותק השמור והבקשה לרשת ממשיכה ברקע ומעדכנת את המטמון
// לפתיחה הבאה (כך גם גרסה חדשה של האתר נקלטת בביקור הבא, בלי להיתקע על ישנה).
// בלי עותק שמור — מחכים לרשת כרגיל. אופליין מוצהר (navigator.onLine) — מיד מהמטמון.
// "הרשת ענתה" = התשובה הגיעה במלואה (bodyReady), לא רק הכותרות: ברשת חלשה הכותרות
// מגיעות תוך שבריר שנייה והגוף זורם עשרות שניות — מרוץ על הכותרות השאיר את הדף
// "נטען" בלי סוף למרות שעותק זהה חיכה במטמון (תוקן 29/09/2026).
const NAV_NET_WINDOW_MS = 1500; // דף ה-HTML (ניווט) — כולל נכסי הקוד שהוא מפנה אליהם
const CODE_NET_WINDOW_MS = 1200; // סקריפטים/עיצוב שאינם ממוסמכים (tailwind.css)
const RUNTIME_NET_WINDOW_MS = 4000; // hebcal/ספריא/קבצים חיצוניים ובקשות GET אחרות

// התשובה אחרי שכל הגוף ירד (עותק tee — הגוף של התשובה עצמה נשאר קריא ומגיע מיד).
// opaque (no-cors) — אין גוף קריא, מוכנה עם הכותרות.
function bodyReady(response) {
  if (!response || response.type === "opaque") return Promise.resolve(response);
  return response.clone().arrayBuffer().then(() => response);
}

// נכס קוד ממוסמך — אותה כתובת = אותו תוכן לתמיד: ?v= או גרסה בשם הקובץ
// (kosher-zmanim-0.9.0.min.js, vendor/leaflet-1.9.4). tailwind.css נבנה מחדש בכל
// דיפלוי תחת ?v=2 קבוע — ולכן אינו ממוסמך באמת.
const MUTABLE_VERSIONED = ["/tailwind.css"];
function isVersionedAsset(url) {
  if (MUTABLE_VERSIONED.includes(url.pathname)) return false;
  return url.searchParams.has("v") || /\d+\.\d+\.\d+/.test(url.pathname);
}

// נכסי הקוד הממוסמכים (?v=) שדף HTML מפנה אליהם
function versionedRefs(html) {
  const refs = new Set();
  const re = /["'(]\/?([\w.\-/]+\.(?:js|css)\?v=[\w.-]+)["')]/g;
  let m;
  while ((m = re.exec(html))) refs.add("/" + m[1]);
  return [...refs];
}
function fetchCodeToCache(ref) {
  return fetch(ref, { cache: "no-cache" }).then((response) => {
    if (!response || !response.ok) throw response;
    return caches.open(STATIC_CACHE).then((cache) => cache.put(ref, response));
  });
}
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
    .then((html) =>
      Promise.all(versionedRefs(html).map((ref) => caches.match(ref))).then((hits) => {
        if (hits.some((hit) => !hit)) return;
        return caches.open(STATIC_CACHE).then((cache) => cache.put(key, response));
      }),
    )
    .catch(() => {});
}

// הדף מהרשת "מוכן" (כשיש עותק שמור להתחרות בו): ה-HTML ירד במלואו, וכל נכסי
// הקוד שלו במטמון — או שירדו עכשיו (גרסה חדשה). אז הוא נשמר כעותק ומוצג; ברשת
// איטית העותק השמור מוצג מיד כשהחלון פוקע, וההורדה ממשיכה ברקע ומכינה את הגרסה
// החדשה (עקבית: דף + קוד) לפתיחה הבאה. 5xx — נדחית (העותק השמור עדיף); 404 מוצג.
function networkShellReady(network, key) {
  return network.then((response) => {
    if (!response || response.status >= 500) throw response;
    if (!response.ok) return response;
    const forCache = response.clone();
    return response
      .clone()
      .text()
      .then((html) =>
        Promise.all(
          versionedRefs(html).map((ref) => caches.match(ref).then((hit) => hit || fetchCodeToCache(ref))),
        ),
      )
      .then(() => caches.open(STATIC_CACHE).then((cache) => cache.put(key, forCache)))
      .then(() => response);
  });
}

// דף "אין חיבור" — רק כשאין במכשיר שום עותק של האתר (פתיחה ראשונה בלי אינטרנט). בעיצוב
// האתר (שמי לילה, מגן דוד בזהב), עם "נסו שוב" ובדיקה אוטומטית: כשהחיבור חוזר הדף נטען לבד.
// הבדיקה ב-HEAD — ה-SW לא מטפל בבקשות שאינן GET, כך שהיא תמיד יוצאת לרשת ולא נענית
// מהמטמון (ולא נשמרת בו). סטטוס 200: באפליקציה (TWA) כרום בודק שכתובת הפתיחה נטענת.
function offlinePage() {
  const html =
    '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<meta name="theme-color" content="#0b1530"><title>הלוח היהודי · אין חיבור</title><style>' +
    "html,body{margin:0;min-height:100%}" +
    "body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px 16px;box-sizing:border-box;" +
    'font-family:"Assistant",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;color:#f8fafc;text-align:center;' +
    "background:radial-gradient(1px 1px at 12% 18%,#fff9 50%,transparent 51%),radial-gradient(1.6px 1.6px at 78% 12%,#fffb 50%,transparent 51%)," +
    "radial-gradient(1px 1px at 64% 34%,#fff8 50%,transparent 51%),radial-gradient(1.3px 1.3px at 30% 62%,#fff7 50%,transparent 51%)," +
    "radial-gradient(1px 1px at 88% 74%,#fff9 50%,transparent 51%),radial-gradient(1.2px 1.2px at 45% 86%,#fff6 50%,transparent 51%)," +
    "linear-gradient(180deg,#0b1530 0%,#14224a 58%,#2a2f5c 100%)}" +
    ".card{max-width:370px;width:100%;padding:28px 22px 24px;border-radius:24px;background:rgba(255,255,255,.07);" +
    "border:1px solid rgba(242,217,138,.45);box-shadow:0 14px 44px rgba(0,0,0,.38)}" +
    "svg{width:64px;height:64px;margin-bottom:8px}" +
    "h1{font-size:1.5rem;margin:.2rem 0 .7rem;color:#f2d98a}" +
    "p{margin:.4rem 0;line-height:1.65;font-size:1rem;color:#e2e8f0}.sub{font-size:.9rem;color:#cbd5e1}" +
    "button{margin-top:18px;font:inherit;font-weight:800;font-size:1.05rem;padding:.75rem 2.4rem;border-radius:999px;" +
    "border:1px solid #f2d98a;background:linear-gradient(180deg,#f6e3a1,#d4af37);color:#1e1b4b;cursor:pointer}" +
    "#st{margin-top:12px;font-size:.84rem;color:#a5b4cf;min-height:1.3em}" +
    '</style></head><body><main class="card">' +
    '<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#f2d98a" stroke-width="5" stroke-linejoin="round">' +
    '<path d="M50 8 86 70H14Z"/><path d="M50 92 14 30H86Z"/></g></svg>' +
    "<h1>אין חיבור לאינטרנט</h1>" +
    "<p>בפתיחה הראשונה הלוח היהודי צריך חיבור, כדי לשמור במכשיר את הלוח, הזמנים והתפילות.</p>" +
    '<p class="sub">מאותו רגע הוא נפתח גם בלי אינטרנט.</p>' +
    '<button id="r" type="button">נסו שוב</button>' +
    '<div id="st" aria-live="polite">כשהחיבור יחזור, הדף ייטען מעצמו.</div>' +
    "</main><script>(function(){var busy=false,st=document.getElementById('st');" +
    "function check(m){if(busy)return;busy=true;" +
    "fetch('/',{method:'HEAD',cache:'no-store'}).then(function(r){if(r&&r.status<500)location.reload();else throw 0})" +
    ".catch(function(){if(m)st.textContent='עדיין אין חיבור — נמשיך לבדוק לבד.'}).then(function(){busy=false})}" +
    "document.getElementById('r').onclick=function(){st.textContent='בודק חיבור…';check(true)};" +
    "addEventListener('online',function(){setTimeout(check,500)});setInterval(check,6000)})();</script></body></html>";
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
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
          .then(() => (isTileUrl(url) ? trimTileCache() : undefined))
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
            network.then((r) => (r && (r.ok || r.type === "opaque") ? bodyReady(r) : Promise.reject(r))),
            cached,
            RUNTIME_NET_WINDOW_MS,
            null,
            false,
          );
        }),
    );
    return;
  }

  if (url.pathname.startsWith("/places/") && url.search) {
    event.respondWith(placesResponse(request, url));
    return;
  }

  if (request.mode === "navigate") {
    // ניווט: הדף מהרשת מנצח רק אם הגיע במלואו (עם הקוד שלו) בתוך 1.5 שניות; רשת
    // איטית/נפולה — הדף השמור מוצג, והרשת ממשיכה ברקע ומעדכנת לפתיחה הבאה.
    const key = navCacheKey(url);
    let release;
    event.waitUntil(new Promise((resolve) => (release = resolve)));
    const network = fetch(request);
    event.respondWith(
      caches
        .match(key)
        .catch(() => null)
        .then((cached) => {
          if (cached) {
            const ready = networkShellReady(network, key);
            ready.then(release, release);
            return raceNetworkWithCached(ready, cached, NAV_NET_WINDOW_MS);
          }
          // אין עותק שמור (ביקור ראשון): רשת כרגיל. רק תשובה תקינה נשמרת כעותק
          // האופליין, ורק אם הקוד שלה כבר במטמון — 404/5xx לא דורסים עותק טוב
          network
            .then((r) => (r && r.ok ? cacheShellIfConsistent(key, r.clone()) : null))
            .catch(() => {})
            .then(release);
          return network.catch(() =>
            caches
              .match("/index.html")
              // גם הרשת נפלה וגם המטמון ריק (התקנה ראשונה אופליין / שרת פיתוח
              // באמצע רענון): בלי Response תקין respondWith זורק
              // "Failed to convert value to 'Response'" — מחזירים דף שגיאה מסודר
              .then((fallback) => fallback || offlinePage()),
          );
        })
        .catch((err) => {
          release();
          throw err;
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
            network.then((r) => (r && r.ok ? bodyReady(r) : Promise.reject(r))),
            cached,
            RUNTIME_NET_WINDOW_MS,
          );
        }),
    );
    return;
  }

  // סקריפטים ועיצוב: ממוסמכים (?v=) — מהמטמון מיד; לא ממוסמכים (tailwind.css) —
  // רשת בחלון קצר עם גיבוי מטמון. שאר הנכסים (תמונות/גופנים) — מהמטמון תחילה.
  // גרסה חדשה של האתר תמיד מגיעה עם ?v= חדש, כך שאין "תקיעה על גרסה ישנה".
  const isCodeAsset =
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "worker";

  if (isCodeAsset && isVersionedAsset(url)) {
    // נכס ממוסמך (?v= / גרסה בשם הקובץ) — אותה כתובת = אותו תוכן, לכן כשיש עותק
    // במטמון עונים ממנו מיד, בלי רשת בכלל (script.js ≈ 900KB דחוס: ברשת חלשה המרוץ
    // הישן נתן לרשת לנצח על הכותרות, והדף המתין לגוף עשרות שניות). גרסה חדשה = ?v=
    // חדש = כתובת חדשה → מהרשת, ונשמרת. אחרי דיפלוי ה-SW החדש (STATIC_CACHE חדש)
    // מוריד את כל הנכסים מחדש בהתקנה, והמטמון הישן נמחק בהפעלה.
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request, { cache: "no-cache" }).then(
          (response) => {
            if (response && response.ok) {
              const copy = response.clone();
              event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {}));
            }
            return response;
          },
          () => caches.match(request, { ignoreSearch: true }).then((alt) => alt || Response.error()),
        );
      }),
    );
    return;
  }

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
            network.then((r) => (r && r.ok ? bodyReady(r) : Promise.reject(r))),
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

// לחיצה על התראה מקומית (אישור הפעלת התראות העומר — script.js → _showLocalNotif;
// פוש התזכורת עצמו מטופל ב-worker של OneSignal ופותח את /?open=omer):
// מביאים לחזית חלון פתוח של האתר, ואם אין — פותחים אותו.
// כשהקובץ הזה רץ בתוך OneSignalSDKWorker.js (מי שהפעיל התראות) — ה-handler של OneSignal
// כבר מטפל בכל לחיצה; שני handlers היו פותחים/ממקדים שני חלונות.
if (!self.__jcOneSignal) self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
