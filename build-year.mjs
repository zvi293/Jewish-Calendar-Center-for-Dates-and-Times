// ══════════════════════════════════════════════════════════════════════
// build-year.mjs — גלגול שנה אוטומטי בזמן הבילד של Netlify
//
// רץ לפני קומפילציית Tailwind (ראו package.json). בכל דיפלוי:
//   1. מחשב את השנה העברית הנוכחית (Intl, לוח עברי).
//   2. מחליף בכל index.html + sitemap.xml את אזכורי השנה — "תשפ"ו 2026",
//      תשפ&quot;ו, תשפ\"ו — לתווית העדכנית (השנה האזרחית = שנת הסיום של
//      השנה העברית: תשפ"ו→2026, תשפ"ז→2027).
//   3. בונה מחדש את טבלת המועדים בין הסמנים LUACH-AUTO:TABLE:START/END
//      מנתוני Hebcal חיים (לוח ארץ-ישראל). כשראש השנה הבא קרוב (עד 75 יום)
//      הטבלה מציגה את השנה הנכנסת.
//   4. אם תוכן index.html השתנה — מעדכן את ה-lastmod של דף הבית ב-sitemap.
//
// עיקרון בטיחות: כל כשל (רשת, חג חסר, סמן חסר) ⇒ אזהרה בלבד, הקבצים
// נשארים כמות שהם וה-exit code הוא 0 — דיפלוי לעולם לא נשבר בגלל הסקריפט.
// ══════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from "node:fs";

const INDEX = new URL("./index.html", import.meta.url);
const SITEMAP = new URL("./sitemap.xml", import.meta.url);

/* ── עזרי תאריך עברי ── */
const hebYearFmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric", timeZone: "UTC" });
const hebDayFmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric", timeZone: "UTC" });
const hebMonthFmt = new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long", timeZone: "UTC" });

const noon = (iso) => new Date(iso + "T12:00:00Z");
const hebYearNumOf = (d) => parseInt(hebYearFmt.format(d), 10);
const hebDayNumOf = (d) => parseInt(hebDayFmt.format(d), 10);
// Intl מחזיר גרשיים טיפוגרפיים (אדר ב׳) — מיישרים לסגנון האתר (')
const hebMonthOf = (d) => hebMonthFmt.format(d).replace(/׳/g, "'").replace(/מרחשוון/g, "חשוון");

// 786 → תשפ"ו ; 787 → תשפ"ז ; 790 → תש"ץ ; 15 → ט"ו ; 1 → א'
function hebNumerals(n) {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  let s = hundreds[Math.floor(n / 100)] || "";
  const r = n % 100;
  if (r === 15) s += "טו";
  else if (r === 16) s += "טז";
  else s += tens[Math.floor(r / 10)] + ones[r % 10];
  if (s.length === 1) return s + "'";
  return s.slice(0, -1) + '"' + s.slice(-1);
}

/* ── שלב 1: השנה הנוכחית והתווית שלה ── */
// לבדיקות: LUACH_FAKE_TODAY=2026-09-20 node build-year.mjs
const today = process.env.LUACH_FAKE_TODAY
  ? noon(process.env.LUACH_FAKE_TODAY)
  : new Date();
const curHebYear = hebYearNumOf(today);
const curLabel = hebNumerals(curHebYear % 1000); // למשל תשפ"ו
const curCivil = curHebYear - 3760;              // שנת הסיום האזרחית

// ראש השנה הבא: היום הראשון שבו מספר השנה העברית עולה
function nextRoshHashana() {
  const start = new Date(today);
  for (let i = 1; i <= 400; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (hebYearNumOf(d) > curHebYear) return d;
  }
  return null;
}

/* ── שלב 2: החלפת אזכורי שנה בכל הקובץ ── */
// שלוש צורות קידוד של הגרשיים: " רגיל, &quot; במטא-תגים, \" בתוך JSON-LD
function replaceYearTokens(text, label, civil) {
  const QUOTES = ['"', "&quot;", '\\"'];
  for (const q of QUOTES) {
    const qEsc = q.replace(/[\\]/g, "\\\\").replace(/[&;]/g, "\\$&");
    const newHeb = label.replace('"', q);
    // צמד "תשפ"ו 2026" (או טווח 2026-2027) — מוחלף כיחידה
    text = text.replace(
      new RegExp(`תש[א-ת]?${qEsc}[א-ת] \\d{4}(?:[-–]\\d{4})?`, "g"),
      `${newHeb} ${civil}`,
    );
    // תווית שנה בודדת ללא שנה אזרחית צמודה
    text = text.replace(new RegExp(`תש[א-ת]?${qEsc}[א-ת]`, "g"), newHeb);
  }
  return text;
}

/* ── שלב 3: טבלת המועדים מ-Hebcal ── */
const WEEKDAY = (d) =>
  d.toLocaleDateString("he-IL", { weekday: "long", timeZone: "UTC" }).replace(/^יום /, "");
const GMONTH = (d) => d.toLocaleDateString("he-IL", { month: "long", timeZone: "UTC" });

function hebDateCell(a, b) {
  const da = hebNumerals(hebDayNumOf(a));
  if (!b || a.getTime() === b.getTime()) return `${da} ב${hebMonthOf(a)}`;
  const db = hebNumerals(hebDayNumOf(b));
  if (hebMonthOf(a) === hebMonthOf(b)) return `${da}–${db} ב${hebMonthOf(a)}`;
  return `${da} ב${hebMonthOf(a)} – ${db} ב${hebMonthOf(b)}`;
}
function gregDateCell(a, b) {
  const ya = a.getUTCFullYear();
  if (!b || a.getTime() === b.getTime()) return `${a.getUTCDate()} ב${GMONTH(a)} ${ya}`;
  const yb = b.getUTCFullYear();
  if (ya !== yb) return `${a.getUTCDate()} ב${GMONTH(a)} ${ya} – ${b.getUTCDate()} ב${GMONTH(b)} ${yb}`;
  if (GMONTH(a) === GMONTH(b)) return `${a.getUTCDate()}–${b.getUTCDate()} ב${GMONTH(a)} ${ya}`;
  return `${a.getUTCDate()} ב${GMONTH(a)} – ${b.getUTCDate()} ב${GMONTH(b)} ${ya}`;
}
function weekdayCell(a, b) {
  if (!b || a.getTime() === b.getTime()) return WEEKDAY(a);
  return `${WEEKDAY(a)}–${WEEKDAY(b)}`;
}

async function buildTable(tableHebYear, tableLabel) {
  const url =
    "https://www.hebcal.com/hebcal?v=1&cfg=json&year=" + tableHebYear +
    "&yt=H&maj=on&min=on&mod=on&i=on&lg=he&geo=none";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Hebcal HTTP " + res.status);
  const data = await res.json();
  // כותרות מנורמלות: גרשיים טיפוגרפיים → ASCII, להתאמה יציבה
  const items = (data.items || []).map((it) => ({
    t: (it.hebrew || it.title || "").replace(/[׳’]/g, "'").replace(/״/g, '"'),
    d: noon(it.date),
  }));
  const all = (pred) => items.filter(pred).map((x) => x.d).sort((a, b) => a - b);
  const one = (pred) => {
    const r = all(pred);
    if (!r.length) throw new Error("חג חסר בתשובת Hebcal");
    return r[0];
  };

  const rh = all((x) => x.t.startsWith("ראש השנה") && !x.t.includes("למעשר") && !x.t.startsWith("ערב"));
  if (rh.length < 2) throw new Error("ראש השנה חסר");
  const sukkot = all((x) => x.t.startsWith("סוכות"));
  if (sukkot.length < 7) throw new Error("סוכות חסר");
  const chan = all((x) => x.t.startsWith("חנוכה"));
  const firstCandle = one((x) => x.t.startsWith("חנוכה") && x.t.includes("א' נר"));
  const chanDay1 = new Date(firstCandle.getTime() + 86400000);
  const chanDay8 =
    all((x) => x.t.startsWith("חנוכה") && x.t.includes("יום ח"))[0] ||
    new Date(firstCandle.getTime() + 8 * 86400000);
  if (!chan.length) throw new Error("חנוכה חסר");
  const pesach = all((x) => x.t.startsWith("פסח") && !x.t.startsWith("ערב") && !x.t.includes("שני"));
  if (pesach.length < 7) throw new Error("פסח חסר");
  const purim = one((x) => x.t === "פורים");
  const shushan = all((x) => x.t === "שושן פורים")[0];

  const fcWd = WEEKDAY(firstCandle);
  const chanNote =
    ` (נר ראשון: יום ${fcWd} ${firstCandle.getUTCDate()}.${firstCandle.getUTCMonth() + 1}` +
    (fcWd === "שישי" ? ", לפני כניסת השבת)" : ")");
  const purimNote = shushan
    ? ` (שושן פורים: ${shushan.getUTCDate()}.${shushan.getUTCMonth() + 1})`
    : "";

  const rows = [
    { n: `ראש השנה ${tableLabel}`, a: rh[0], b: rh[rh.length - 1] },
    { n: "יום כיפור", a: one((x) => x.t.startsWith("יום כיפור") && !x.t.startsWith("ערב")) },
    { n: "סוכות", a: sukkot[0], b: sukkot[sukkot.length - 1] },
    { n: "שמיני עצרת ושמחת תורה", a: one((x) => x.t.startsWith("שמיני עצרת")) },
    { n: "חנוכה", a: chanDay1, b: chanDay8, gregSuffix: chanNote },
    { n: 'ט"ו בשבט', a: one((x) => x.t.includes("בשבט")) },
    { n: "פורים", a: purim, gregSuffix: purimNote },
    { n: "פסח", a: pesach[0], b: pesach[pesach.length - 1] },
    { n: "יום העצמאות", a: one((x) => x.t.startsWith("יום העצמאות")) },
    { n: 'ל"ג בעומר', a: one((x) => x.t.includes("בעומר") && x.t.startsWith("ל")) },
    { n: "שבועות", a: one((x) => x.t === "שבועות") },
    { n: "תשעה באב", a: one((x) => x.t.startsWith("תשעה באב") && !x.t.startsWith("ערב")) },
  ];

  const tr = rows
    .map((r, i) => {
      const border = i < rows.length - 1 ? ' class="border-b border-slate-100 dark:border-slate-800"' : "";
      return (
        `              <tr${border}><td class="py-2 pl-4 font-semibold">${r.n}</td>` +
        `<td class="py-2 pl-4">${hebDateCell(r.a, r.b)}</td>` +
        `<td class="py-2 pl-4">${gregDateCell(r.a, r.b)}${r.gregSuffix || ""}</td>` +
        `<td class="py-2">${weekdayCell(r.a, r.b)}</td></tr>`
      );
    })
    .join("\n");

  const gy = rh[0].getUTCFullYear();
  return `<div class="mt-8 overflow-x-auto">
          <h2 class="text-base font-black text-slate-600 dark:text-slate-300 mb-4">מועדי ישראל ${tableLabel} — תאריכים לועזיים</h2>
          <table class="w-full text-sm text-right text-slate-500 dark:text-slate-400 border-collapse">
            <caption class="sr-only">תאריכים לועזיים של מועדי ישראל בשנת ${tableLabel} (${gy}–${gy + 1})</caption>
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th scope="col" class="py-2 pl-4 font-bold">המועד</th>
                <th scope="col" class="py-2 pl-4 font-bold">תאריך עברי</th>
                <th scope="col" class="py-2 pl-4 font-bold">תאריך לועזי</th>
                <th scope="col" class="py-2 font-bold">יום בשבוע</th>
              </tr>
            </thead>
            <tbody>
${tr}
            </tbody>
          </table>
          <p class="mt-2 text-xs text-slate-400 dark:text-slate-500">התאריכים לפי הלוח הנהוג בארץ ישראל. ללוח המלא, לזמני החגים המדויקים ולייצוא ליומן — השתמשו בלוח האינטראקטיבי שבראש הדף.</p>
        </div>`;
}

/* ── הרצה ── */
try {
  let html = readFileSync(INDEX, "utf8");
  const original = html;

  // 1) אזכורי שנה
  html = replaceYearTokens(html, curLabel, curCivil);

  // 2) הטבלה: השנה הנכנסת כשראש השנה בעוד ≤75 יום, אחרת השנה הנוכחית
  const rhNext = nextRoshHashana();
  const daysToRH = rhNext ? Math.round((rhNext - today) / 86400000) : 999;
  const tableHebYear = daysToRH <= 75 ? curHebYear + 1 : curHebYear;
  const tableLabel = hebNumerals(tableHebYear % 1000);

  const START = "<!-- LUACH-AUTO:TABLE:START -->";
  const END = "<!-- LUACH-AUTO:TABLE:END -->";
  const si = html.indexOf(START);
  const ei = html.indexOf(END);
  if (si === -1 || ei === -1 || ei < si) throw new Error("סמני LUACH-AUTO לא נמצאו");
  const tableHtml = await buildTable(tableHebYear, tableLabel);
  html = html.slice(0, si + START.length) + "\n        " + tableHtml + "\n        " + html.slice(ei);

  if (html !== original) {
    writeFileSync(INDEX, html);
    // 3) lastmod של דף הבית ב-sitemap — רק כשהתוכן באמת השתנה
    try {
      let sm = readFileSync(SITEMAP, "utf8");
      sm = replaceYearTokens(sm, curLabel, curCivil);
      const iso = new Date().toISOString().slice(0, 10);
      sm = sm.replace(
        /(<loc>https:\/\/jewishcalendar\.co\.il\/<\/loc>\s*<lastmod>)[^<]+/,
        `$1${iso}`,
      );
      writeFileSync(SITEMAP, sm);
    } catch (e) {
      console.warn("[build-year] sitemap update skipped:", e.message);
    }
    console.log(
      `[build-year] updated: year=${curLabel} ${curCivil}, table=${tableLabel} (RH in ${daysToRH}d)`,
    );
  } else {
    console.log("[build-year] no changes needed");
  }
} catch (e) {
  // לעולם לא מפילים את הבילד — האתר יוצא עם התוכן הקיים
  console.warn("[build-year] skipped (build continues):", e.message);
}
