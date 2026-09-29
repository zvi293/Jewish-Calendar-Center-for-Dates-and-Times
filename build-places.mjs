// ══════════════════════════════════════════════════════════════════════
// build-places.mjs — מאגר מקומות מקומי לדף בתי הכנסת (places/*.json)
//
// הדף synagogues.html מציג קודם את המאגר המקומי (מיידי, גם אופליין), ורק אחר כך
// Overpass החי ברקע מוסיף מקומות שנוספו ל-OpenStreetMap מאז הבילד האחרון.
//
// מקורות:
//  • מקוואות — data.gov.il, המשרד לשירותי דת ("מקוואות טהרה"): ~650 מקוואות עם
//    שעות פתיחה, טלפון, נגישות, חדר כלה, גברים/כלים. אין במאגר קואורדינטות ⇒
//    המרת כתובת→מיקום דרך Nominatim (בקשה אחת לשנייה, לפי מדיניות השימוש שלו),
//    והתוצאות נשמרות ב-places-src/geocode-cache.json — רק כתובות חדשות נשלחות.
//    מקווה שמופה גם ב-OSM מקבל את המיקום המדויק משם. שם הבלנית במאגר לא נשמר.
//  • בתי כנסת — OpenStreetMap (שאילתה ארצית אחת בזמן הבילד, לא אצל המשתמש)
//    + מאגר בתי הכנסת של עיריית באר שבע (data.gov.il, כולל קואורדינטות).
//  • ציוני צדיקים — רשימה מאומתת ידנית: places-src/tzaddikim.json.
//
// רק מקומות יהודיים: religion=jewish בלבד; בלי קהילות משיחיות, קראיות ושומרוניות;
// בלי חורבות/אתרים ארכיאולוגיים (אין בהם תפילה); רק בתחומי ישראל, יהודה ושומרון והגולן.
//
// עיקרון בטיחות (כמו build-year.mjs): כשל של מקור ⇒ נשמרים הפריטים הקודמים של
// אותו מקור (הקבצים שבריפו); תוצאה חשודה (ירידה חדה בכמות) ⇒ כמו כשל. exit 0 תמיד.
// בסוף: חותמת תוכן נכתבת ל-PLACES_VER ב-synagogues.html (הפרמטר ?v= של הקבצים).
//
// שימוש:  node build-places.mjs                 (בילד מלא)
//         node build-places.mjs --no-osm        (בלי Overpass — רק מקוואות/באר שבע)
//         node build-places.mjs --geocode-limit=50
// ══════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = new URL("./", import.meta.url);
const OUT_DIR = new URL("./places/", import.meta.url);
const SRC_DIR = new URL("./places-src/", import.meta.url);
const GEOCODE_CACHE = new URL("./places-src/geocode-cache.json", import.meta.url);
const TZADDIKIM_SRC = new URL("./places-src/tzaddikim.json", import.meta.url);
const OSM_MIKVAOT_RAW = new URL("./places-src/osm-mikvaot.json", import.meta.url);
const PAGE = new URL("./synagogues.html", import.meta.url);

const args = process.argv.slice(2);
const NO_OSM = args.includes("--no-osm");
const argLimit = args.find((a) => a.startsWith("--geocode-limit="));
// בבילד של Netlify — מעט כתובות חדשות בכל פעם (המטמון בריפו מכסה את השאר)
const GEOCODE_LIMIT = argLimit ? +argLimit.split("=")[1] : process.env.NETLIFY ? 40 : Infinity;

const UA = "jewishcalendar.co.il-places-builder/1.0 (+https://jewishcalendar.co.il)";
// ישראל + יהודה ושומרון + הגולן; מה שנופל בשולי המלבן (ירדן/לבנון/סיני/עזה) מסונן בפוליגון
const BBOX = "29.45,34.2,33.36,35.92";
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const MIKVAOT_RESOURCE = "e80a5e59-3b0f-4be9-983a-dc0971907626"; // מקוואות טהרה — המשרד לשירותי דת
const CBS_LOCALITIES_RESOURCE = "d47a54ff-87f0-44b3-b33a-f284c0c38e5a"; // קובץ היישובים 2023 — הלמ"ס
const MIKVAOT_2018_RESOURCE = "9a939c58-d149-4c07-b37f-77dbf0d50e35"; // מקוואות טהרה 2018 — השלמה ליישובים החסרים
const BEERSHEBA_SHULS_RESOURCE = "40de91c6-1eb3-4f12-9cea-5c44484377d7"; // בתי כנסת — עיריית באר שבע

const log = (...a) => console.log("[places]", ...a);
const warn = (...a) => console.warn("[places] ⚠", ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round5 = (x) => Math.round(x * 1e5) / 1e5;

// ── גאומטריה ─────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}
function pointInPolygon(lat, lon, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// קו מתאר גס ונדיב של ישראל + יהודה ושומרון + הגולן (lat, lon) — הקו המערבי בים.
// מטרתו רק לחתוך את שולי ה-BBOX שבשטח ירדן, לבנון, סוריה ומצרים; נדיב במכוון ליד
// הגבול (מטולה, משגב עם, ניצנה, באר מילכה) — עדיף כפר לבנוני בלי בית כנסת בפנים
// מאשר יישוב ישראלי בחוץ.
const ISRAEL_POLY = [
  [33.12, 35.03], [33.1, 35.2], [33.11, 35.36], [33.1, 35.45], [33.2, 35.5], [33.3, 35.53],
  [33.35, 35.62], [33.34, 35.76], [33.28, 35.87], [33.0, 35.9], [32.72, 35.8], [32.66, 35.66],
  [32.62, 35.6], [32.3, 35.59], [31.9, 35.57], [31.7, 35.58], [31.4, 35.53], [31.1, 35.48],
  [30.85, 35.41], [30.5, 35.22], [30.0, 35.12], [29.6, 35.03], [29.47, 34.97], [29.49, 34.85],
  [29.9, 34.68], [30.4, 34.5], [30.9, 34.33], [31.2, 34.2], [31.6, 34.3], [32.2, 34.6], [32.9, 34.85],
];
// רצועת עזה — מוחרגת. הקו המזרחי בתוך הרצועה, כך שיישובי העוטף (כרם שלום, ניר עוז,
// כיסופים, נחל עוז, כפר עזה, נתיב העשרה) נשארים בחוץ לחיתוך
const GAZA_POLY = [
  [31.222, 34.262], [31.3, 34.345], [31.37, 34.37], [31.44, 34.41], [31.5, 34.47],
  [31.555, 34.53], [31.595, 34.54], [31.6, 34.49], [31.45, 34.3], [31.33, 34.19], [31.24, 34.2],
];
const inServiceArea = (lat, lon) => pointInPolygon(lat, lon, ISRAEL_POLY) && !pointInPolygon(lat, lon, GAZA_POLY);

// ── עזרי טקסט ────────────────────────────────────────────────────────
const clean = (s) =>
  String(s == null ? "" : s)
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function fetchWithTimeout(url, opts = {}, ms = 60000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

async function dataGovRecords(resourceId) {
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${resourceId}&limit=5000`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": UA } }, 60000);
  if (!res.ok) throw new Error("data.gov.il HTTP " + res.status);
  const j = await res.json();
  if (!j.success || !j.result || !Array.isArray(j.result.records)) throw new Error("data.gov.il: bad payload");
  return j.result.records;
}

// Overpass: כל השרתים במקביל, הראשון שמחזיר JSON תקין ומלא מנצח.
// בבילד של Netlify — תקציב של 90 שניות לשאילתה (שאילתת המקוואות הארצית לוקחת ~140
// שניות): חריגה ⇒ נשארים הנתונים שבריפו, והדיפלוי לא מתארך בשתי דקות בכל פעם.
// הרצה מקומית (node build-places.mjs) — בלי מגבלה, לרענון מלא.
const OVERPASS_TIMEOUT_MS = process.env.NETLIFY ? 60000 : 170000;
async function overpass(query, label) {
  const one = async (ep) => {
    const res = await fetchWithTimeout(
      ep,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
        body: "data=" + encodeURIComponent(query),
      },
      OVERPASS_TIMEOUT_MS,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status} (${ep})`);
    const j = await res.json();
    // שגיאת זמן ריצה בשרת מחזירה JSON חלקי עם remark — לא מקבלים תוצאה קטועה
    if (j.remark && /error|timed out|out of memory/i.test(j.remark)) throw new Error("partial: " + j.remark);
    if (!Array.isArray(j.elements)) throw new Error("no elements (" + ep + ")");
    return j.elements;
  };
  const t0 = Date.now();
  // בזמן בילד אין מרוץ: השרתים לפי הסדר — קודם הרשמיים. מראה משני (kumi) עלול להחזיר
  // נתונים ישנים (29/09: חסרו 150 בתי כנסת, בהם "בית הכנסת הגדול (חיפה)")
  let els = null;
  const errors = [];
  // בבילד של Netlify — רק שני השרתים הרשמיים (עד 2 דקות גם כשהם נופלים)
  for (const ep of process.env.NETLIFY ? OVERPASS_ENDPOINTS.slice(0, 2) : OVERPASS_ENDPOINTS) {
    try {
      els = await one(ep);
      break;
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (!els) throw new Error(label + ": " + errors.join(" | "));
  log(`Overpass ${label}: ${els.length} elements in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  return els;
}

const elLatLon = (el) =>
  el.lat != null ? [el.lat, el.lon] : el.center ? [el.center.lat, el.center.lon] : [null, null];
const osmName = (t) => clean(t["name:he"] || t.name || t["alt_name:he"] || t.alt_name || t["name:en"] || "");
function osmAddress(t) {
  let street = clean(t["addr:street"] || "");
  if (street && t["addr:housenumber"]) street += " " + clean(t["addr:housenumber"]);
  return street;
}
const osmCity = (t) => clean(t["addr:city:he"] || t["addr:city"] || "");

// ── סינון יהודי ──────────────────────────────────────────────────────
// מקום תפילה שאינו יהודי / קהילה משיחית / קראית / שומרונית — לעולם לא נכנס
const NON_JEWISH_NAME =
  /משיחי|ישוע|מָשִׁיחַ\s+יֵשׁוּעַ|Messianic|Yeshua|Jesus|Christ|Church|Chapel|כנסיי?ה|קפלה|מנזר|מסגד|Mosque|Masjid|شيخ|مسجد|كنيسة|Samaritan|שומרוני|Karaite/i;
const KARAITE_WORD = /(^|[\s\-־"'(])(קראי|קראים|הקראים)(?=$|[\s\-־"')])/;
const BAD_DENOMINATION = /messianic|karaite|samaritan|christian|catholic|orthodox_church|protestant|muslim|sunni|shia|druze|bahai/i;
const RUIN_NAME = /(^|\s)(חורבת|ח['׳]רבת|Horbat|Hurvat|Khirbet|Khirbat)(\s|$)/i;
const TOMB_NAME = /^(קבר|קברי|ציון קבר|מערת קבורה)\s|^(Tomb|Grave|Cave) of\s/i;

function isJewishShul(t, name) {
  if (t.religion && t.religion !== "jewish") return false;
  if (t.amenity && t.amenity !== "place_of_worship") return false;
  if (!t.religion && t.building !== "synagogue") return false;
  if (t.denomination && BAD_DENOMINATION.test(t.denomination)) return false;
  if (name && (NON_JEWISH_NAME.test(name) || KARAITE_WORD.test(name))) return false;
  const allNames = [t.name, t["name:en"], t["name:he"], t.alt_name, t.description].filter(Boolean).join(" ");
  if (NON_JEWISH_NAME.test(allNames)) return false;
  // חורבות ואתרים ארכיאולוגיים (בית כנסת עתיק בכפר נחום, ברעם...) — אין בהם תפילה.
  // גם לפי השם ("Horbat Kanaf Synagogue"), אבל לא "בית הכנסת החורבה" הפעיל בירושלים
  if (t.historic === "archaeological_site" || t.historic === "ruins" || t.ruins === "yes") return false;
  if (RUIN_NAME.test(allNames)) return false;
  // ציון/קבר צדיק שמסומן ב-OSM גם כמקום תפילה ("קבר רבי עקיבא") — שייך ללשונית ציוני
  // הצדיקים (שם הוא ברשימה המאומתת), לא לבתי הכנסת
  if (t.historic === "tomb" || t.historic === "memorial" || TOMB_NAME.test(name || "")) return false;
  if (t["disused:amenity"] || t["abandoned:amenity"] || t.disused === "yes" || t.abandoned === "yes") return false;
  return true;
}

const MIKVEH_NAME = /מקווה|מקוה|מקוואות|Mikve|Mikvah|Mikveh|Mikvaot/i;
// מתקנים שהשם שלהם מכיל "מקווה" אבל אינם מקווה (מקווה ישראל — כפר נוער וצומת)
const MIKVEH_FALSE_POSITIVE = /מקווה\s+ישראל|Mikve(h)?\s+Israel/i;
const MIKVEH_OK_AMENITY = new Set([
  "mikveh", "mikvah", "ritual_bath", "public_bath", "place_of_worship", "community_centre", "social_facility",
]);
function isJewishMikveh(t, name) {
  if (t.religion && t.religion !== "jewish") return false;
  if (NON_JEWISH_NAME.test(name || "")) return false;
  // מקווה עתיק באתר ארכיאולוגי (מצדה, קומראן...) — לא מקווה פעיל
  if (t.historic === "archaeological_site" || t.historic === "ruins" || t.ruins === "yes") return false;
  if (t["disused:amenity"] || t["abandoned:amenity"] || t.disused === "yes" || t.abandoned === "yes") return false;
  const tagged = /^(mikveh|mikvah|ritual_bath)$/.test(t.amenity || "") || /^(mikveh|mikvah)$/.test(t.building || "") || t.leisure === "mikveh";
  if (tagged) return true;
  if (!MIKVEH_NAME.test(name || "")) return false;
  if (MIKVEH_FALSE_POSITIVE.test(name) && !/טהרה/.test(name)) return false;
  if (t.amenity && !MIKVEH_OK_AMENITY.has(t.amenity)) return false;
  if (t.amenity === "public_bath" && t.religion !== "jewish" && !MIKVEH_NAME.test(name)) return false;
  // כביש / אזור / יישוב בשם "מקווה..." — לא מבנה
  if (t.highway || t.place || t.landuse === "residential" || t.boundary) return false;
  return true;
}

// ── מיזוג בלי כפילויות ────────────────────────────────────────────────
function addUnique(list, item, meters) {
  for (const x of list) {
    if (haversineKm(x.la, x.lo, item.la, item.lo) * 1000 <= meters) {
      // שומרים את השם האינפורמטיבי יותר (בית כנסת עם שם עדיף על "בית כנסת" סתמי)
      if ((!x.n || x.n === "בית כנסת") && item.n && item.n !== "בית כנסת") x.n = item.n;
      if (!x.a && item.a) x.a = item.a;
      if (!x.c && item.c) x.c = item.c;
      return false;
    }
  }
  list.push(item);
  return true;
}

// ── קבצים קודמים (גיבוי לכשל של מקור) ────────────────────────────────
function readJson(url, fallback) {
  try {
    return JSON.parse(readFileSync(url, "utf8"));
  } catch (e) {
    return fallback;
  }
}
const prevFile = (name) => readJson(new URL(name + ".json", OUT_DIR), { items: [] });
const prevBySrc = (prev, src) => (prev.items || []).filter((x) => x.s === src);
// תוצאה חדשה שקטנה מהקודמת ביותר מהסף — חשודה (שאילתה קטועה / שרת עם נתונים ישנים)
// ⇒ נשארים עם הקודמת. OSM ארצי כמעט רק גדל, לכן סף הדוק (3%); במאגר הממשלתי 30%.
function saneOrPrev(fresh, prev, label, maxDrop = 0.3) {
  if (prev.length >= 20 && fresh.length < prev.length * (1 - maxDrop)) {
    warn(`${label}: ${fresh.length} vs previous ${prev.length} (drop > ${maxDrop * 100}%) — keeping previous`);
    return prev;
  }
  return fresh;
}

// ══════════════ יישובים — קובץ היישובים של הלמ"ס (data.gov.il) ══════════════
// המקור הרשמי למרכזי היישובים ולרשימת "בחירת יישוב" בדף. רק יישובים יהודיים: "דת יישוב"
// 1 = יהודי, 4 = עיר מעורבת (ירושלים, חיפה, עכו, לוד, רמלה, נוף הגליל...); 2/3 (ערבי/נוצרי)
// לא נכללים. בלי קוד = אזור תעשייה/מחנה/מוסד בלי תושבים. קואורדינטות 12 ספרות = ITM במטרים
// (6+6); 10 ספרות = אזורים סטטיסטיים ("מ"א") — לא יישובים.
// Nominatim טעה במרכז של כמה יישובים (זמרת/ענב/גאולים — 65-146 ק"מ), ולכן מרכז היישוב
// נלקח מכאן, ו-Nominatim משמש רק לכתובות בתוך היישוב.
// ITM (EPSG:2039) → WGS84: היטל טרנסברסלי-מרקטור הפוך על GRS80 + הזזת דטום (Molodensky).
// אומת מול 330 מרכזי יישובים מ-Nominatim: חציון 110 מ'.
function itmToWgs84(E, N) {
  const a = 6378137, f = 1 / 298.257222101, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const k0 = 1.0000067, FE = 219529.584, FN = 626907.39;
  const lat0 = (31.7343936111 * Math.PI) / 180, lon0 = (35.2045169444 * Math.PI) / 180;
  const Mf = (p) =>
    a * ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * p -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * p) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * p) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * p));
  const mu = (Mf(lat0) + (N - FN) / k0) / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) + ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const s = Math.sin(p1), c = Math.cos(p1), t = Math.tan(p1);
  const C1 = ep2 * c * c, T1 = t * t, N1 = a / Math.sqrt(1 - e2 * s * s), R1 = (a * (1 - e2)) / Math.pow(1 - e2 * s * s, 1.5);
  const D = (E - FE) / (N1 * k0);
  let lat = p1 - ((N1 * t) / R1) * ((D * D) / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4) / 24 +
    ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6) / 720);
  let lon = lon0 + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5) / 120) / c;
  const dX = -48, dY = 55, dZ = 52, sl = Math.sin(lat), cl = Math.cos(lat), so = Math.sin(lon), co = Math.cos(lon);
  const Rn = a / Math.sqrt(1 - e2 * sl * sl), Rm = (a * (1 - e2)) / Math.pow(1 - e2 * sl * sl, 1.5);
  lat += (-dX * sl * co - dY * sl * so + dZ * cl) / Rm;
  lon += (-dX * so + dY * co) / (Rn * cl);
  return [(lat * 180) / Math.PI, (lon * 180) / Math.PI];
}
// מפתח השוואה לשמות יישובים: בלי גרשיים/מרכאות, מקף = רווח, וכיווץ יו"ד/וי"ו כפולות —
// כך "קרית שמונה"="קריית שמונה", "נהריה"="נהרייה", "פתח תקוה"="פתח תקווה",
// "נוה צוף"="נווה צוף", "תל אביב - יפו"="תל אביב-יפו" (המאגרים כותבים כל אחד אחרת)
const cityKey = (s) =>
  clean(s).replace(/["'׳״]/g, "").replace(/[\s\-־–]+/g, " ").replace(/יי/g, "י").replace(/וו/g, "ו").trim();
const cbsCities = new Map(); // cityKey → { name, la, lo, pop }
// שמות המועצות האזוריות — אינם יישוב ("מטה בנימין", "חבל מודיעין"); במאגר של 2018 הם
// מופיעים לפעמים בשדה היישוב, ו-Nominatim מחזיר עליהם את מרכז שטח המועצה (עד עשרות ק"מ)
const regionalCouncils = new Set();
async function loadCbsLocalities() {
  try {
    const recs = await dataGovRecords(CBS_LOCALITIES_RESOURCE);
    for (const r of recs) {
      const mun = clean(r["שם מעמד מונציפאלי"]);
      if (/^מועצה אזורית\s/.test(mun)) regionalCouncils.add(cityKey(mun.replace(/^מועצה אזורית\s+/, "")));
      const rel = r["דת יישוב"];
      const coord = String(r["קואורדינטות"] || "");
      const name = clean(r["שם יישוב"]).replace(/\s*-\s*/g, "-");
      if ((rel !== 1 && rel !== 4) || coord.length !== 12 || !name || /\*|מ["״]א/.test(name)) continue;
      const [la, lo] = itmToWgs84(+coord.slice(0, 6), +coord.slice(6));
      if (!inServiceArea(la, lo)) continue;
      // אוכלוסייה — לסדר ההצעות בחלונית "בחירת יישוב" (הקלדת "ב" ⇒ בני ברק, באר שבע קודם)
      const pop = +r["סך הכל אוכלוסייה 2023 - ארעי"] || 0;
      cbsCities.set(cityKey(name), { name, la: round5(la), lo: round5(lo), pop });
    }
    log(`CBS localities (Jewish + mixed): ${cbsCities.size}`);
  } catch (e) {
    warn("CBS localities failed — falling back to Nominatim / previous list:", e.message);
  }
}

// ══════════════ Geocoding (Nominatim, עם מטמון בריפו) ══════════════
const geoCache = readJson(GEOCODE_CACHE, {});
let geocodeCalls = 0;
let lastNominatim = 0;

function saveGeoCache() {
  try {
    // שורה לכל כתובת, ממוין — דיף קריא כשהמטמון מתעדכן
    const sorted = {};
    for (const k of Object.keys(geoCache).sort()) sorted[k] = geoCache[k];
    writeFileSync(GEOCODE_CACHE, JSON.stringify(sorted).replace(/},"/g, '},\n"') + "\n");
  } catch (e) {
    warn("could not save geocode cache:", e.message);
  }
}

async function nominatim(params) {
  const wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await sleep(wait);
  lastNominatim = Date.now();
  // ריצה ארוכה (הרצה ראשונה ~20 דק') — שמירת ביניים כדי שקריסה לא תמחק את העבודה
  if (++geocodeCalls % 25 === 0) saveGeoCache();
  // il,ps — ב-OSM יישובי יהודה ושומרון (ביתר עילית, מודיעין עילית, מעלה אדומים...) משויכים
  // לקוד ps; עם il בלבד הם לא נמצאו (או נמצא במקומם משהו אחר). השירות נחתך בכל מקרה בפוליגון.
  const qs = new URLSearchParams({ ...params, format: "jsonv2", countrycodes: "il,ps", limit: "1", addressdetails: "1" });
  const res = await fetchWithTimeout(
    "https://nominatim.openstreetmap.org/search?" + qs,
    { headers: { "User-Agent": UA, "Accept-Language": "he" } },
    30000,
  );
  if (!res.ok) throw new Error("nominatim HTTP " + res.status);
  const j = await res.json();
  return Array.isArray(j) && j.length ? j[0] : null;
}

// "תל אביב - יפו" → "תל אביב-יפו" (כך השם ב-OSM)
const normCity = (c) => clean(c).replace(/\s*-\s*/g, "-");
function normStreet(a) {
  return clean(a)
    .replace(/\([^)]*\)/g, " ")
    .replace(/(^|\s)רח(['׳]|וב)?\.?\s+/g, "$1")
    .replace(/(^|\s)שד(['׳]|\.)\s*/g, "$1שדרות ")
    .replace(/(^|\s)סמ(['׳]|\.)\s*/g, "$1סמטת ")
    .replace(/(^|\s)ככר\s+/g, "$1כיכר ")
    .replace(/[,;.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// תוצאה שהיא יישוב/שכונה — לא רחוב, עסק או משרד בשם דומה
const SETTLEMENT_TYPES = new Set([
  "city", "town", "village", "hamlet", "suburb", "neighbourhood", "quarter", "isolated_dwelling",
  "municipality", "borough", "city_district", "locality", "farm", "residential",
]);
const isSettlementResult = (r) =>
  !!r && (SETTLEMENT_TYPES.has(r.addresstype) || r.category === "place" || (r.category === "boundary" && r.type === "administrative"));

async function geocodeCity(city) {
  // מרכז היישוב הרשמי מהלמ"ס — עדיף על Nominatim (שטעה בכמה יישובים)
  const cbs = cbsCities.get(cityKey(city));
  if (cbs) return { la: cbs.la, lo: cbs.lo, q: 2 };
  const key = "city|" + city;
  if (geoCache[key]) return geoCache[key];
  if (geocodeCalls >= GEOCODE_LIMIT) return null;
  const ok = (r) => (r && isSettlementResult(r) && inServiceArea(+r.lat, +r.lon) ? r : null);
  let r = ok(await nominatim({ city: normCity(city) }));
  if (!r) r = ok(await nominatim({ q: normCity(city), featureType: "settlement" }));
  const v = r ? { la: round5(+r.lat), lo: round5(+r.lon), q: 2 } : { q: 3 };
  geoCache[key] = v;
  return v;
}

// שם היישוב במאגר הממשלתי מגיע לפעמים עם תוספות ("מושב לוזית", "מקוה כסלון",
// "כרם ביבנה (ישיבה)"), קטוע ("בת חפ") או אפילו כתובת במקום יישוב ("ליד סופר אופיר",
// "רחוב קטלב"). לכן: השם כפי שהוא, ואם לא נמצא — מועמדים מנוקים מהשם/שם המקווה/הכתובת.
const stripPlaceWords = (s) =>
  clean(s)
    .replace(/\([^)]*\)/g, " ")
    .replace(/["'׳״]/g, "")
    .replace(/^(מקו(ו)?ה|מושב|קיבוץ|ישוב|יישוב)\s+/, "")
    .replace(/\s+(מס['׳]?\s*)?\d+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
// יישובים שהשם שלהם במאגרי המקוואות שונה מהשם הרשמי בלמ"ס (נבדק מול קובץ הלמ"ס, 29/09/2026).
// המפתח עובר cityKey, כך שכתיב חסר/מלא ומקפים לא משנים.
const CITY_ALIASES_RAW = {
  "אורה עמינדב": "אורה",
  "תל אביב": "תל אביב-יפו",
  "נצרת עילית": "נוף הגליל",
  "מעלות": "מעלות-תרשיחא",
  "יקנעם": "יקנעם עילית",
  "ביתר": "ביתר עילית",
  "בנימינה": "בנימינה-גבעת עדה",
  "גבעת עדה": "בנימינה-גבעת עדה",
  "קרית ארבע חברון": "קריית ארבע",
  "טלז סטון": "קריית יערים",
  "חצור": "חצור הגלילית",
  "צור יגאל": "כוכב יאיר",
  "פקיעין": "פקיעין חדשה",
  "יהוד נוה מונסון": "יהוד-מונוסון",
  // במאגר העדכני: יישוב "מול בית מס 2", כתובת "מקווה גבעת ישעיהו 2"
  "מול בית מס 2": "גבעת ישעיהו",
  "קדימה": "קדימה-צורן",
  "זכר": "זכרון יעקב", // שם קטוע במאגר העדכני
};
// מילים כלליות שאינן שם יישוב — "מקווה דרום" (בזכרון יעקב) הפך ליישוב "דרום" ליד צפת
const NOT_A_PLACE = /^(דרום|צפון|מזרח|מערב|מרכז|מרכזי|חדש|חדשה|ותיק|ותיקה|ישן|ישנה|עליון|תחתון)$/;
const CITY_ALIASES = Object.fromEntries(Object.entries(CITY_ALIASES_RAW).map(([k, v]) => [cityKey(k), v]));
// ישיבה/מוסד שאינו יישוב ב-OSM — מיקום המוסד עצמו (Nominatim: amenity=college "כרם ביבנה")
const CITY_FIXED = { "כרם ביבנה": { la: 31.8179, lo: 34.7224, q: 2 } };
async function resolveCity(r) {
  const raw = clean(r.mikveCity);
  const fixed = CITY_FIXED[stripPlaceWords(raw)];
  if (fixed) return { name: stripPlaceWords(raw), geo: fixed };
  const cands = [];
  // הכתובת משמשת כמועמד רק כשאין בה מספר בית ("בת חפר", "מקוה כסלון") — "הדקל 10" אינו
  // שם יישוב, ו"הדקל" היה עלול להתאים ליישוב/שכונה אחרים לגמרי. המועצה הדתית — אחרונה.
  const addrRaw = clean(r.MikveAddress);
  const council = clean(r.council || r.counciName || "");
  const base = [
    CITY_ALIASES[cityKey(raw)], raw, stripPlaceWords(raw), CITY_ALIASES[cityKey(stripPlaceWords(raw))],
    stripPlaceWords(r.mikveName),
    /\d/.test(addrRaw) ? null : stripPlaceWords(addrRaw),
    council ? CITY_ALIASES[cityKey(council)] || stripPlaceWords(council) : null,
  ];
  for (const c of base) {
    // "ליד סופר אופיר" / "רחוב קטלב" — כתובת במקום יישוב; אבל "רחוב" לבדו הוא מושב בעמק בית שאן
    if (c && c.length >= 2 && !/\d/.test(c) && !/^(ליד|מול|רחוב|רח)\s/.test(c) && !cands.includes(c)) cands.push(c);
  }
  // כשהמועצה הדתית היא עיר (זכרון יעקב, קריית ארבע) — היישוב חייב להיות בטווח 15 ק"מ ממנה;
  // אחרת זה יישוב/שכונה באותו שם במקום אחר לגמרי
  const councilRef = council ? cbsCities.get(cityKey(CITY_ALIASES[cityKey(council)] || council)) : null;
  for (const c of cands) {
    if (NOT_A_PLACE.test(c)) continue;
    if (regionalCouncils.has(cityKey(c)) && !cbsCities.has(cityKey(c))) continue;
    const geo = await geocodeCity(c);
    if (geo && geo.la != null && councilRef && haversineKm(geo.la, geo.lo, councilRef.la, councilRef.lo) > 15) continue;
    // שם היישוב כפי שהוא בלמ"ס ("תל אביב-יפו", "נווה צוף") — אחיד עם רשימת היישובים
    if (geo && geo.la != null) return { name: (cbsCities.get(cityKey(c)) || { name: c }).name, geo };
  }
  return null;
}

// שכונה / שם המקווה ("ארנונה", "הר נוף", "רמות 02") — כשהכתובת לא נמצאה, עדיף בהרבה
// על מרכז העיר (בירושלים/בני ברק עשרות מקוואות היו נערמים על נקודה אחת)
const NB_STOP = /^(מרכזי|המרכזי|ישן|הישן|חדש|החדש|עירוני|העירוני|ציבורי|טהרה|נשים|גברים|כלים|גדול|קטן|[א-ת])$/;
function neighborhoodHint(r, city) {
  const n = stripPlaceWords(r.mikveName).replace(/\s+[א-ת]$/, "");
  if (!n || n.length < 3 || NB_STOP.test(n) || n === city || /\d/.test(n)) return "";
  if (stripPlaceWords(r.MikveAddress) === n) return ""; // השם הוא בעצם הכתובת
  return n;
}

async function geocodeAddress(addr, city, cityGeo, hint) {
  const near = (la, lo) => cityGeo && cityGeo.la != null && haversineKm(la, lo, cityGeo.la, cityGeo.lo) <= 8;
  const accept = (r, q) => {
    if (!r) return null;
    const la = +r.lat, lo = +r.lon;
    // תוצאה רחוקה ממרכז היישוב — כנראה רחוב באותו שם ביישוב אחר
    if (!inServiceArea(la, lo) || !near(la, lo)) return null;
    return { la: round5(la), lo: round5(lo), q: q != null ? q : r.address && r.address.house_number ? 0 : 1 };
  };
  // ניסיון מוטמן: ערך תקף שקרוב למרכז היישוב מוחזר; { ref } = נוסה ולא נמצא (לא חוזרים
  // עליו בכל בילד); ערך רחוק מהיישוב (מריצה עם יישוב שגוי) — נוסה מחדש
  const attempt = async (key, run) => {
    const hit = geoCache[key];
    if (hit && hit.la != null && near(hit.la, hit.lo)) return hit;
    if (hit && hit.ref) return null;
    if (geocodeCalls >= GEOCODE_LIMIT) return null;
    try {
      const v = await run();
      geoCache[key] = v || { ref: "city" };
      return v;
    } catch (e) {
      warn("geocode failed:", key, e.message);
      return null; // לא נשמר במטמון — ינוסה שוב בבילד הבא
    }
  };
  const street = normStreet(addr);
  if (street && street !== city && street !== normCity(city) && !/^מקו(ו)?ה(\s|$)/.test(street)) {
    const v = await attempt(city + "|" + street, async () =>
      accept(await nominatim({ street, city: normCity(city) })) ||
      accept(await nominatim({ q: street + ", " + normCity(city) })));
    if (v) return v;
  }
  if (hint) {
    const v = await attempt("nb|" + city + "|" + hint, async () => {
      const r = await nominatim({ q: hint + ", " + normCity(city) });
      return r && (isSettlementResult(r) || r.category === "highway") ? accept(r, 1) : null;
    });
    if (v) return v;
  }
  return cityGeo;
}

// ══════════════ מקוואות ══════════════
const usedCities = new Map(); // שם יישוב (אחרי ניקוי) → מרכז — לרשימת "בחירת יישוב" בדף
const yes = (v) => clean(v) === "כן";
function hoursText(v) {
  const s = clean(v);
  if (!s || /^\d{1,2}$/.test(s) || s === "-" || s === ".") return "";
  if (/^כנ["״]?ל\.?$/.test(s)) return "כמו בימות החול";
  return s;
}
function mikvehDisplayName(r, city) {
  const name = clean(r.mikveName);
  const addr = clean(r.MikveAddress);
  const dishesOnly = yes(r.mikveForDishesYesNo) && !yes(r.mikveForWomenYesNo) && !yes(r.mikveForMenYesNo);
  const base = dishesOnly ? "מקווה כלים" : "מקווה";
  if (!name || name === city || name === clean(r.mikveCity) || name === addr || /\d/.test(name) || /^רח/.test(name) ||
      stripPlaceWords(name) === city) return base + " " + city;
  if (/מקו(ו)?ה|מקוואות/.test(name)) return name.includes(city) ? name : name + " — " + city;
  return base + " " + name + (name.includes(city) ? "" : " — " + city);
}
function phoneText(v) {
  const s = clean(v).replace(/[^\d\-+ ,/]/g, "");
  return /\d{7,}/.test(s.replace(/\D/g, "")) ? s.split(/[,/]/)[0].trim() : "";
}

async function buildMikvaot(osmMikvehEls) {
  const prev = prevFile("mikvah");
  // אין רשימת OSM גולמית (places-src/osm-mikvaot.json) וגם OSM לא ענה — בנייה מחדש מתוך
  // הפלט הקודם הייתה משנה את ההתאמות בכל ריצה (המקוואות ש"נבלעו" בהתאמה כבר לא בו) ⇒
  // הקובץ הקודם נשאר כמו שהוא עד הרצה מקומית מוצלחת
  if (!osmMikvehEls && !existsSync(OSM_MIKVAOT_RAW) && prev.items && prev.items.length) {
    warn("no raw OSM mikvaot list yet — keeping previous mikvah.json unchanged");
    // היישובים של המקוואות — לרשימת "בחירת יישוב" (מקווה במיקום לפי יישוב = מרכז היישוב)
    for (const x of prev.items) {
      if ((x.s !== "g" && x.s !== "g18") || !x.c) continue;
      if (!usedCities.has(x.c) || x.q === 2) usedCities.set(x.c, { la: x.la, lo: x.lo });
    }
    return prev.items;
  }
  let gov = prevBySrc(prev, "g");
  try {
    const recs = await dataGovRecords(MIKVAOT_RESOURCE);
    log(`data.gov.il mikvaot: ${recs.length} records`);
    const fresh = [];
    let exact = 0, street = 0, cityLevel = 0, none = 0;
    for (const r of recs) {
      if (!clean(r.mikveCity) && !clean(r.mikveName)) continue;
      const rc = await resolveCity(r);
      if (!rc) { none++; warn("mikveh without a locatable settlement:", clean(r.mikveCity), "/", clean(r.mikveName)); continue; }
      const city = rc.name;
      usedCities.set(city, rc.geo);
      const addr = clean(r.MikveAddress);
      const g = await geocodeAddress(addr, city, rc.geo, neighborhoodHint(r, city));
      if (!g || g.la == null) { none++; continue; }
      g.q === 0 ? exact++ : g.q === 1 ? street++ : cityLevel++;
      const acc = clean(r.accessability);
      const shownAddr = normStreet(addr);
      const item = {
        n: mikvehDisplayName(r, city),
        a: shownAddr && shownAddr !== city && shownAddr !== clean(r.mikveCity) && !/^מקו(ו)?ה(\s|$)/.test(shownAddr) ? shownAddr : "",
        c: city,
        la: g.la,
        lo: g.lo,
        q: g.q,
        s: "g",
      };
      const h = [hoursText(r.activityHoursSummer), hoursText(r.activityHoursWinter), hoursText(r.activityHoursShabat)];
      if (h.some(Boolean)) item.h = h;
      const p = phoneText(r.mikvePhone);
      if (p) item.p = p;
      if (acc === "מלאה" || acc === "כן") item.acc = 2;
      else if (acc === "חלקית") item.acc = 1;
      // דגלים: W נשים · M גברים · K כלים · B חדר כלה · S ממוגן
      item.f =
        (yes(r.mikveForWomenYesNo) ? "W" : "") +
        (yes(r.mikveForMenYesNo) ? "M" : "") +
        (yes(r.mikveForDishesYesNo) ? "K" : "") +
        (yes(r.brideRoomYesNo) ? "B" : "") +
        (yes(r.armorYesNo) ? "S" : "");
      fresh.push(item);
    }
    log(`mikvaot geocoded: ${exact} exact · ${street} street · ${cityLevel} city-level · ${none} unplaced · ${geocodeCalls} Nominatim calls`);
    gov = saneOrPrev(fresh, gov, "mikvaot (gov)");
  } catch (e) {
    warn("mikvaot (gov) failed — keeping previous:", e.message);
  }

  // ── השלמה מהמאגר של 2018 — רק ליישובים שאין להם אף מקווה במאגר העדכני ──
  // המאגר העדכני חלקי (101 מועצות דתיות — חסרות חיפה, נתניה, אשדוד, טבריה, אילת, עפולה,
  // עכו...), והמאגר של 2018 (אותו משרד) כולל אותן. ביישוב שכן מופיע במאגר העדכני — הוא
  // קובע (מקווה שנעלם ממנו אולי נסגר), ולכן לא מערבבים. בדף: "מידע משנת 2018 — מומלץ
  // לוודא בטלפון". אין במאגר של 2018 גברים/כלים/חדר כלה — רק שעות, טלפון ונגישות.
  let gov18 = prevBySrc(prev, "g18");
  try {
    const recs = await dataGovRecords(MIKVAOT_2018_RESOURCE);
    const covered = new Set(gov.map((x) => cityKey(x.c)));
    const fresh = [];
    let skippedCovered = 0, none = 0;
    for (const r0 of recs) {
      // אותה צורה כמו רשומה של המאגר העדכני — כדי להשתמש באותם resolveCity/geocodeAddress
      const r = {
        mikveCity: clean(r0.City) || clean(r0.Religious_Council),
        mikveName: clean(r0.neighborhood),
        MikveAddress: clean(r0.Mikve_Address),
        council: clean(r0.Religious_Council),
      };
      if (!r.mikveCity) continue;
      const rc = await resolveCity(r);
      if (!rc) { none++; continue; }
      const city = rc.name;
      if (covered.has(cityKey(city))) { skippedCovered++; continue; }
      usedCities.set(city, rc.geo);
      const g = await geocodeAddress(r.MikveAddress, city, rc.geo, neighborhoodHint(r, city));
      if (!g || g.la == null) { none++; continue; }
      const shownAddr = normStreet(r.MikveAddress);
      const nb = r.mikveName && r.mikveName !== city ? r.mikveName.replace(/^מקו(ו)?ה\s+/, "") : "";
      const item = {
        n: nb ? "מקווה " + nb + " — " + city : "מקווה " + city,
        a: shownAddr && shownAddr !== city && !/^מקו(ו)?ה(\s|$)/.test(shownAddr) ? shownAddr : "",
        c: city,
        la: g.la,
        lo: g.lo,
        q: g.q,
        s: "g18",
      };
      const eve = hoursText(r0.Opening_Hours_Holiday_Eve_Shabat_Eve);
      const motz = hoursText(r0.Opening_Hours_Saturday_Night_Good_Day);
      const h = [
        hoursText(r0.Opening_Hours_Summer),
        hoursText(r0.Opening_Hours_Winter),
        [eve && "ערב שבת/חג: " + eve, motz && "מוצאי שבת/חג: " + motz].filter(Boolean).join(" · "),
      ];
      if (h.some(Boolean)) item.h = h;
      const p = phoneText(r0.Phone) || phoneText(r0.Notes);
      if (p) item.p = p;
      const acc = clean(r0.Accessibility);
      if (/חלק/.test(acc)) item.acc = 1;
      else if (/מלא|^כן|נגיש/.test(acc) && !/^(לא|ללא)/.test(acc)) item.acc = 2;
      item.f = "";
      fresh.push(item);
    }
    log(`mikvaot 2018 (gap-fill): ${fresh.length} added · ${skippedCovered} skipped (settlement covered by the current database) · ${none} unplaced`);
    gov18 = saneOrPrev(fresh, gov18, "mikvaot 2018");
  } catch (e) {
    warn("mikvaot 2018 failed — keeping previous:", e.message);
  }
  gov = [...gov, ...gov18];

  // OSM: מיקום מדויק למקוואות שהמאגר הממשלתי שם עליהם רק רחוב/יישוב; היתר נוספים כפריטים.
  // הרשימה הגולמית נשמרת ב-places-src/osm-mikvaot.json — כשהשאילתה נכשלת (תמיד בבילד של
  // Netlify) ההתאמה משוחזרת ממנה בדיוק. בלי זה, מקוואות שקיבלו מיקום מדויק מ-OSM איבדו אותו.
  const savedRaw = readJson(OSM_MIKVAOT_RAW, null);
  let osm = savedRaw && Array.isArray(savedRaw.items) ? savedRaw.items : prevBySrc(prev, "o");
  if (osmMikvehEls) {
    const fresh = [];
    for (const el of osmMikvehEls) {
      const t = el.tags || {};
      const name = osmName(t);
      const [la, lo] = elLatLon(el);
      if (la == null || !inServiceArea(la, lo)) continue;
      if (!isJewishMikveh(t, name)) continue;
      addUnique(fresh, { n: name || "מקווה", a: osmAddress(t), c: osmCity(t), la: round5(la), lo: round5(lo), s: "o" }, 25);
    }
    osm = saneOrPrev(fresh, osm, "mikvaot (OSM)");
    if (osm === fresh) writeFileSync(OSM_MIKVAOT_RAW, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), items: fresh }));
  }
  osm = osm.map((o) => ({ ...o })); // עותק — לא לשנות את הרשימה הגולמית
  // gov items are re-snapped from scratch each build (q comes from the geocode, not from a previous snap)
  const claimed = new Set();
  for (const g of gov) {
    if (g.q === 0) continue;
    const radiusKm = g.q === 1 ? 0.45 : 2.5;
    const near = osm.filter((o, i) => !claimed.has(i) && haversineKm(g.la, g.lo, o.la, o.lo) <= radiusKm);
    const govNear = gov.filter((x) => x !== g && haversineKm(g.la, g.lo, x.la, x.lo) <= radiusKm);
    // התאמה חד-משמעית בלבד: מקווה OSM אחד באזור ואין מקווה ממשלתי אחר שמתחרה עליו
    if (near.length === 1 && govNear.length === 0) {
      const idx = osm.indexOf(near[0]);
      claimed.add(idx);
      g.la = near[0].la;
      g.lo = near[0].lo;
      g.q = 0;
    }
  }
  const items = [...gov];
  osm.forEach((o, i) => {
    if (claimed.has(i)) return;
    // מקווה OSM שקרוב (≤120 מ') למקווה ממשלתי הוא אותו מקווה — הממשלתי עשיר יותר
    if (gov.some((g) => haversineKm(g.la, g.lo, o.la, o.lo) <= 0.12)) return;
    items.push(o);
  });
  return items;
}

// ══════════════ בתי כנסת ══════════════
async function buildShuls(osmShulEls) {
  const prev = prevFile("shul");
  // OSM לא ענה — הרשימה הקודמת נשארת בדיוק כמו שהיא. (בנייה מחדש מתוכה הייתה מאבדת את
  // השמות/כתובות שמוזגו מ-OSM לרשומות של עיריית באר שבע, ומשנה את החותמת בלי סיבה.)
  // (סינון השמות — קבר/ציון/חורבה — מוחל גם עליה, כדי שכלל חדש ייכנס גם בלי OSM)
  if (!osmShulEls && prev.items && prev.items.length) {
    return prev.items.filter((x) => !TOMB_NAME.test(x.n || "") && !RUIN_NAME.test(x.n || ""));
  }
  let osm = prevBySrc(prev, "o");
  if (osmShulEls) {
    const fresh = [];
    for (const el of osmShulEls) {
      const t = el.tags || {};
      const name = osmName(t);
      const [la, lo] = elLatLon(el);
      if (la == null || !inServiceArea(la, lo)) continue;
      if (!isJewishShul(t, name)) continue;
      addUnique(fresh, { n: name && !/^(the\s+)?synag?og(ue|e)$/i.test(name) ? name : "בית כנסת", a: osmAddress(t), c: osmCity(t), la: round5(la), lo: round5(lo), s: "o" }, 15);
    }
    osm = saneOrPrev(fresh, osm, "shuls (OSM)", 0.03);
  }
  let b7 = prevBySrc(prev, "b7");
  try {
    const recs = await dataGovRecords(BEERSHEBA_SHULS_RESOURCE);
    const fresh = [];
    for (const r of recs) {
      const la = +r.lat, lo = +r.lon;
      if (!la || !lo || !inServiceArea(la, lo)) continue;
      let name = clean(r.name);
      if (name && !/כנס|כניס/.test(name)) name = "בית כנסת " + name;
      const addr = clean(r.street) ? clean(r.street) + (r.HouseNumbe ? " " + r.HouseNumbe : "") : "";
      fresh.push({ n: name || "בית כנסת", a: addr, c: "באר שבע", la: round5(la), lo: round5(lo), s: "b7" });
    }
    log(`Beersheba shuls: ${fresh.length}`);
    b7 = saneOrPrev(fresh, b7, "shuls (Beersheba)");
  } catch (e) {
    warn("Beersheba shuls failed — keeping previous:", e.message);
  }
  const items = [];
  for (const x of b7) items.push({ ...x });
  // אותו בית כנסת בשני המקורות (≤40 מ') — פריט אחד; שם/כתובת נשלמים זה מזה
  for (const x of osm) addUnique(items, { ...x }, 40);
  return items;
}

// ══════════════ ציוני צדיקים ══════════════
function buildTzaddikim() {
  const src = readJson(TZADDIKIM_SRC, null);
  if (!src || !Array.isArray(src.items)) {
    warn("places-src/tzaddikim.json missing — keeping previous");
    return prevFile("tzaddik").items || [];
  }
  return src.items
    .filter((x) => x && x.n && isFinite(x.la) && isFinite(x.lo) && inServiceArea(x.la, x.lo))
    .map((x) => ({ n: clean(x.n), a: clean(x.a || ""), c: clean(x.c || ""), la: round5(x.la), lo: round5(x.lo), s: "t" }));
}

// ══════════════ ערים (חיפוש לפי יישוב, בלי הרשאת מיקום) ══════════════
// = כל היישובים היהודיים (והערים המעורבות) מקובץ הלמ"ס + יישובים עם מקווה שאינם בו
// (מאחזים חדשים). הלמ"ס לא נטען — הרשימה הקודמת נשארת (בלי לרדת לרשימת המקוואות בלבד).
function buildCities() {
  const prev = prevFile("cities").items || [];
  if (!cbsCities.size && prev.length > usedCities.size) return prev;
  const out = new Map();
  // [שם, lat, lon, אוכלוסייה] — אוכלוסייה 0 ליישוב שאינו בלמ"ס (מאחזים)
  for (const c of cbsCities.values()) out.set(cityKey(c.name), [c.name, c.la, c.lo, c.pop || 0]);
  for (const [name, g] of usedCities) {
    if (g && g.la != null && !out.has(cityKey(name))) out.set(cityKey(name), [name, g.la, g.lo, 0]);
  }
  // המקוואות לא נבנו מחדש בריצה הזו (נשמר הקובץ הקודם) — היישובים שהגיעו מהם (מאחזים
  // שאינם בלמ"ס) נלקחים מהרשימה הקודמת
  if (!usedCities.size) for (const c of prev) if (!out.has(cityKey(c[0]))) out.set(cityKey(c[0]), c);
  return [...out.values()].sort((a, b) => a[0].localeCompare(b[0], "he"));
}

// ══════════════ main ══════════════
const Q_SHUL = `[out:json][timeout:180];
(
  nwr["amenity"="place_of_worship"]["religion"="jewish"](${BBOX});
  nwr["building"="synagogue"](${BBOX});
);
out center tags;`;
const Q_MIKVEH = `[out:json][timeout:180];
(
  nwr["amenity"]["name"~"מקווה|מקוואות|מקוה"](${BBOX});
  nwr["amenity"]["name:he"~"מקווה|מקוואות|מקוה"](${BBOX});
  nwr["building"]["name"~"מקווה|מקוואות|מקוה"](${BBOX});
  nwr["building"]["name:he"~"מקווה|מקוואות|מקוה"](${BBOX});
  nwr["amenity"~"^(mikveh|mikvah|ritual_bath)$"](${BBOX});
  nwr["building"~"^(mikveh|mikvah)$"](${BBOX});
  nwr["leisure"="mikveh"](${BBOX});
  nwr["amenity"]["name"~"Mikve|Mikvah|Mikveh|Mikvaot",i](${BBOX});
);
out center tags;`;

async function main() {
  const t0 = Date.now();
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(SRC_DIR)) mkdirSync(SRC_DIR, { recursive: true });

  let shulEls = null, mikvehEls = null;
  if (!NO_OSM) {
    // שאילתת המקוואות הארצית (חיפוש לפי שם בכל הארץ) לוקחת ~140 שניות — בבילד של Netlify
    // מדלגים עליה (נשארים המקוואות מ-OSM שבריפו; העיקר ממילא מהמאגר הממשלתי)
    const [s, m] = await Promise.allSettled([
      overpass(Q_SHUL, "shuls"),
      process.env.NETLIFY ? Promise.reject(new Error("skipped in Netlify build")) : overpass(Q_MIKVEH, "mikvaot"),
    ]);
    if (s.status === "fulfilled") shulEls = s.value; else warn("OSM shuls failed — keeping previous:", s.reason.message);
    if (m.status === "fulfilled") mikvehEls = m.value; else warn("OSM mikvaot failed — keeping previous:", m.reason.message);
  }

  await loadCbsLocalities();
  const mikvaot = await buildMikvaot(mikvehEls);
  const shuls = await buildShuls(shulEls);
  const tzaddikim = buildTzaddikim();
  const cities = buildCities();

  const updated = new Date().toISOString().slice(0, 10);
  const write = (name, items, extra = {}) => {
    const prev = readJson(new URL(name + ".json", OUT_DIR), null);
    // תוכן זהה — לא נוגעים בקובץ (גם לא בתאריך), כדי שהחותמת לא תשתנה בלי סיבה
    if (prev && JSON.stringify(prev.items) === JSON.stringify(items)) return readFileSync(new URL(name + ".json", OUT_DIR), "utf8");
    const body = JSON.stringify({ updated, ...extra, items });
    writeFileSync(new URL(name + ".json", OUT_DIR), body);
    return body;
  };
  const bodies = [
    write("shul", shuls, { src: "OpenStreetMap (ODbL) · עיריית באר שבע (data.gov.il)" }),
    write("mikvah", mikvaot, { src: "המשרד לשירותי דת (data.gov.il) · OpenStreetMap (ODbL)" }),
    write("tzaddik", tzaddikim, { src: "רשימה מאומתת · OpenStreetMap (ODbL) · ויקיפדיה" }),
    write("cities", cities),
  ];
  saveGeoCache();

  // חותמת תוכן ⇒ ?v= בדף (אותו תוכן = אותה כתובת = מטמון תקף)
  const ver = createHash("sha1").update(bodies.join("\n")).digest("hex").slice(0, 10);
  try {
    const html = readFileSync(PAGE, "utf8");
    const next = html.replace(/const PLACES_VER = "[^"]*";/, `const PLACES_VER = "${ver}";`);
    if (next !== html) writeFileSync(PAGE, next);
    else if (!html.includes(`const PLACES_VER = "${ver}";`)) warn("PLACES_VER marker not found in synagogues.html");
  } catch (e) {
    warn("could not stamp synagogues.html:", e.message);
  }
  log(
    `done in ${((Date.now() - t0) / 1000).toFixed(0)}s — shuls ${shuls.length} · mikvaot ${mikvaot.length} · tzaddikim ${tzaddikim.length} · cities ${cities.length} · ver ${ver}`,
  );
}

main().catch((e) => {
  warn("build-places failed (build continues, previous data kept):", e && e.stack ? e.stack : e);
});
