// תזכורת ספירת העומר — פוש דרך OneSignal גם כשהאתר/האפליקציה סגורים (06/10/2026).
//
// פונקציה מתוזמנת של Netlify: רצה פעם ביום ב-06:45 UTC (09:45 בישראל). בימי העומר היא
// מתזמנת ב-OneSignal הודעה אחת לכל המנויים, לשעת צאת הכוכבים בירושלים (7.083°, כמו באתר)
// + 2 דקות, "לפי אזור הזמן של כל מנוי" (delayed_option: timezone): בארץ — בצאת הכוכבים;
// בחו"ל — באותה שעה לפי השעון המקומי. מי שהשעה כבר עברה אצלו מקבל אותה למחרת באותה שעה
// (תיעוד OneSignal) — ולכן השעה 06:45 UTC: מהוואי (UTC-10) ועד ניו זילנד (UTC+12) ההודעה
// נוחתת בערב הנכון.
// בליל שבת ובליל שביעי של פסח (יום טוב בארץ) — אין תזכורת. במוצאי שבת/יו"ט — רבע שעה
// מאוחר יותר. מחוץ לימי העומר — בדיקת תקינות בלבד: בקשה ל-OneSignal בלי נמענים (מאמתת את
// המפתח, לא שולחת לאף אחד), כדי שאפשר לבדוק עכשיו עם "Run now" בממשק של Netlify.
//
// המפתח: משתנה סביבה ONESIGNAL_REST_API_KEY בהגדרות האתר ב-Netlify (סוד — לא בקוד).

import { createHash } from "node:crypto";

export const config = { schedule: "45 6 * * *" };

const APP_ID = "eb49147f-b7e7-4173-894d-27872508b775";
const SITE = "https://jewishcalendar.co.il";
const TZ = "Asia/Jerusalem";
const JLM = { lat: 31.778, lon: 35.2354 };
const TZEIT_ZENITH = 90 + 7.083;
const DAY = 86400000;
const SEFIROT = ["חסד", "גבורה", "תפארת", "נצח", "הוד", "יסוד", "מלכות"];

// התאריך העברי של יום אזרחי (UTC בצהריים) — חודש באנגלית ויום
function hebOf(d) {
  let month = "", day = 0;
  new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: "UTC", month: "long", day: "numeric" })
    .formatToParts(d)
    .forEach((p) => {
      if (p.type === "month") month = p.value;
      if (p.type === "day") day = parseInt(p.value, 10);
    });
  return { month, day };
}

// ט"ז ניסן = 1 … ה' סיון = 49, אחרת 0 (אותה נוסחה כמו _omerCountOf ב-script.js)
function omerCountOf(d) {
  const { month, day } = hebOf(d);
  if (month === "Nisan" && day >= 16) return day - 15;
  if (month === "Iyar") return 15 + day;
  if (month === "Sivan" && day <= 5) return 44 + day;
  return 0;
}

// לילה קדוש (שבת או יום טוב בארץ ישראל בתוך העומר — שביעי של פסח) של היום האזרחי d
function isHolyDay(d) {
  const h = hebOf(d);
  return d.getUTCDay() === 6 || (h.month === "Nisan" && (h.day === 15 || h.day === 21));
}

// היום האזרחי בירושלים, כתאריך UTC בצהריים
function jlmToday(now) {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

// רגע שבו השמש יורדת ל-zenith בערב (אלגוריתם NOAA, דיוק של כדקה). dayNoonUTC = היום האזרחי
function sunsetAt(dayNoonUTC, zenith, { lat, lon }) {
  const rad = Math.PI / 180;
  const midnight = dayNoonUTC.getTime() - DAY / 2;
  let minutes = 720 - 4 * lon + 4 * 90; // הערכה ראשונה
  for (let i = 0; i < 4; i++) {
    const jd = (midnight + minutes * 60000) / DAY + 2440587.5;
    const T = (jd - 2451545) / 36525;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C =
      Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
      Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) +
      Math.sin(3 * M * rad) * 0.000289;
    const omega = 125.04 - 1934.136 * T;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * rad);
    const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad));
    const y = Math.tan((eps * rad) / 2) ** 2;
    const eqTime =
      (4 / rad) *
      (y * Math.sin(2 * L0 * rad) -
        2 * e * Math.sin(M * rad) +
        4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) -
        0.5 * y * y * Math.sin(4 * L0 * rad) -
        1.25 * e * e * Math.sin(2 * M * rad));
    const cosH = (Math.cos(zenith * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    const H = Math.acos(cosH) / rad;
    minutes = 720 - 4 * lon - eqTime + 4 * H;
  }
  return new Date(midnight + minutes * 60000);
}

function hhmm(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

// מפתח מניעת כפילות (UUID v3 קבוע לכל ערב) — ריצה חוזרת באותו יום לא תשלח שוב
function idemKey(name) {
  const h = createHash("md5").update(name).digest("hex").split("");
  h[12] = "3";
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// מה לשלוח היום (בלי רשת) — מיוצא לבדיקה מקומית
export function plan(now = new Date()) {
  const today = jlmToday(now);
  const tomorrow = new Date(today.getTime() + DAY);
  const count = omerCountOf(tomorrow);
  const date = today.toISOString().slice(0, 10);
  if (!count) return { date, skip: "not-omer" };
  if (isHolyDay(tomorrow)) return { date, count, skip: "shabbat-or-yomtov-night" };
  const tzeit = sunsetAt(today, TZEIT_ZENITH, JLM);
  const extra = isHolyDay(today) ? 17 : 2; // מוצאי שבת/יו"ט — רבע שעה מאוחר יותר
  const at = new Date(Math.ceil((tzeit.getTime() + extra * 60000) / 60000) * 60000);
  const sefira = SEFIROT[(count - 1) % 7] + " שב" + SEFIROT[Math.floor((count - 1) / 7)];
  return {
    date,
    count,
    time: hhmm(at),
    tzeit: hhmm(tzeit),
    title: "✨ ספירת העומר",
    body: `הלילה סופרים יום ${count} לעומר — ${sefira}. לחצו לנוסח הברכה והספירה`,
  };
}

async function oneSignal(key, payload) {
  const res = await fetch("https://api.onesignal.com/notifications?c=push", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Authorization: "Key " + key },
    body: JSON.stringify(Object.assign({ app_id: APP_ID, target_channel: "push" }, payload)),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {}
  return { status: res.status, json };
}

export default async () => {
  const key = process.env.ONESIGNAL_REST_API_KEY;
  if (!key) {
    console.error("[omer] ONESIGNAL_REST_API_KEY חסר בהגדרות Netlify");
    return new Response("missing key", { status: 500 });
  }
  const p = plan();

  if (p.skip) {
    if (p.skip === "not-omer") {
      // בדיקת תקינות בלבד: מסנן שאף מנוי לא עונה עליו — שום הודעה לא נשלחת
      const r = await oneSignal(key, {
        filters: [{ field: "tag", key: "omer_selfcheck_nobody", relation: "exists" }],
        contents: { en: "selfcheck" },
      });
      // מפתח תקין: 200 עם "All included players are not subscribed"; מפתח שגוי — 4xx
      const keyOk = r.status < 300;
      console.log(`[omer] ${p.date}: מחוץ לימי העומר. בדיקת מפתח: ${keyOk ? "תקין" : "נדחה"} (HTTP ${r.status})`, JSON.stringify(r.json));
      return new Response(keyOk ? "ok" : "key rejected", { status: keyOk ? 200 : 500 });
    }
    console.log(`[omer] ${p.date}: יום ${p.count} — ${p.skip}, אין שליחה`);
    return new Response("skip");
  }

  const r = await oneSignal(key, {
    included_segments: ["Total Subscriptions"],
    headings: { en: p.title, he: p.title },
    contents: { en: p.body, he: p.body },
    url: SITE + "/?open=omer",
    chrome_web_icon: SITE + "/icon-192.png",
    web_push_topic: "omer",
    delayed_option: "timezone",
    delivery_time_of_day: p.time,
    throttle_rate_per_minute: 0,
    idempotency_key: idemKey("omer-" + p.date),
  });
  console.log(`[omer] ${p.date}: יום ${p.count}, צאת ${p.tzeit}, שליחה ${p.time} — HTTP ${r.status}`, JSON.stringify(r.json));
  return new Response(r.status < 300 ? "ok" : "error", { status: r.status < 300 ? 200 : 500 });
};
