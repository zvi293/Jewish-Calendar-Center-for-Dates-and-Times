/* ══════════════════════════════════════════════════════════════════════
   sky.js — "שמיים חיים" (10/2026): רקע האתר כשמיים אמיתיים שעוקבים אחרי
   השעון ההלכתי. נטען רק כשערכת השמיים פעילה (html.lux-sky); העיצוב הבהיר
   והכהה לא טוענים אותו בכלל. קנבס WebGL אחד (#lux-sky) קבוע מאחורי כל הדף —
   ושום רקע אחר לא מצויר במצב הזה (הבלוק "שמיים חיים" בסוף style.css מכבה
   את גרדיאנט ההירו, קנבס הכוכבים של ההירו, האורבים, הגל, ערב שבת/שבת/מועדים).

   מה כאן:
   • אסטרונומיה: שמש/ירח (נוסחאות suncalc), כוכבים לפי זמן כוכבים מקומי,
     פאזת ירח אמיתית, שביל החלב, מטאורים, עננים ברוח, נוף ירושלמי (חומות,
     מגדלים, ברושים) עם אורות שנדלקים אחרי השקיעה.
   • "השעון ההלכתי": ציר הזמן של השמיים מעוגן לזמני האתר (window._prayerZman —
     עלות, הנץ, חצות, שקיעה, צאת 7.083°, חצות הלילה, לפי העיר והשיטה שנבחרו).
     בין עוגן לעוגן הזמן האסטרונומי נמתח ליניארית (warp), כך שהאור הראשון
     מופיע בדיוק בעלות של האתר, השמש עולה בדיוק בהנץ, ושלושה כוכבים נדלקים
     בדיוק בצאת הכוכבים. לפני ש-script.js חישב זמנים (sky.js נטען לפניו) —
     עוגנים אסטרונומיים (-16.1°, -0.833°, -7.083°), ועם האירוע "lux-zmanim"
     העוגנים מתחלפים לזמני האתר.
   • אנימציית כניסה בכל טעינה: השמיים מתחילים שלושה זמנים אחורה (למשל חצות
     הלילה ← עלות השחר ← הנץ ← חצות היום) ונעים עד הרגע הנוכחי, מתוזמנים
     לדהיית מסך הפתיחה (#lux-splash מקבל lux-splash-out).
   • תנועה חיה: גלגל הכוכבים מסתובב (×120 מהמציאות — כחצי מעלה בשנייה; הנוף
     עצמו נשאר במקום), נצנוץ, מטאורים כל 4–11 שניות, מטוס לילי מהבהב, להבי
     טחנת הרוח מסתובבים, עננים ברוח, פרלקסה עדינה לגלילה (ולעכבר במחשב).
   • ביצועים: רזולוציית רינדור מופחתת (0.8 בטלפון, 0.9 במחשב, עד 1920px),
     30fps בטלפון, קומפילציית שיידרים במקביל (KHR_parallel_shader_compile),
     עצירה מלאה כשחלון פתוח (html.lux-modal-open) או כשהלשונית מוסתרת,
     הורדת רזולוציה אוטומטית כשהפריימים איטיים, prefers-reduced-motion =
     פריים סטטי שמתעדכן פעם בדקה, ו-failIfMajorPerformanceCaveat (בלי GPU
     אמיתי לא מריצים WebGL בתוכנה).
   • בלי WebGL (או בלי highp בשיידר): html.lux-sky-nogl + data-sky —
     גרדיאנט CSS לפי שלב היום (style.css).
   • שבתות וחגים (10/2026): מעלות השחר של ערב השבת/החג ועד צאתם השמיים עצמם
     לבושים לכבוד המועד — גוון, נרות בחלונות העיר, חלקיקים ועיטור. ראו "שבתות וחגים" למטה.
   • ממשק: window.__luxSky = { start, stop, setTime, state, fest }.
     דגלי URL לדמו (כמו ?erev=): ?sky=HH:MM (שעה קבועה) · ?sky=play (יממה ב-60 שניות) ·
     ?fest=shabbat (וכו' — ראו "שבתות וחגים").
   • ל-CSS של השלב הבא (חלונות/פופאפים): html[data-sky=night|dawn|day|dusk],
     --sky-zen / --sky-hor (צבעי הרקיע הנוכחיים, "r,g,b"), --sky-glass
     (אטימות זכוכית מומלצת 0.36–0.64), --sky-day (0..1), והאירוע "lux-sky".
     במועד: html[data-fest=shabbat|rh|...|av9] + data-fest-lvl=full|gentle|subdued.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__luxSky) return;
  var html = document.documentElement;
  var RAD = Math.PI / 180, TAU = Math.PI * 2;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function wrapPi(x) { return x - TAU * Math.floor((x + Math.PI) / TAU); }
  var reduce = false, mobile = false;
  try { reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { mobile = matchMedia("(max-width: 768px), (pointer: coarse)").matches; } catch (e) {}

  /* ── מיקום: GPS שאושר > עיר שנבחרה > פתח תקווה (אותם מפתחות כמו script.js) ── */
  var LAT = 32.08707, LNG = 34.88747, PHI = LAT * RAD, LW = -LNG * RAD;
  function readLoc() {
    var lat = null, lng = null;
    try {
      if (localStorage.getItem("moadim_city") === "GPS") {
        var g = JSON.parse(localStorage.getItem("moadim_gps") || "null");
        if (g && isFinite(g.lat) && isFinite(g.lon)) { lat = +g.lat; lng = +g.lon; }
      }
      if (lat === null) {
        var c = JSON.parse(localStorage.getItem("moadim_city_coords") || "null");
        if (c && isFinite(c.lat) && isFinite(c.lon)) { lat = +c.lat; lng = +c.lon; }
      }
    } catch (e) {}
    if (lat === null) { lat = 32.08707; lng = 34.88747; }
    var changed = lat !== LAT || lng !== LNG;
    LAT = lat; LNG = lng; PHI = LAT * RAD; LW = -LNG * RAD;
    return changed;
  }
  readLoc();

  /* ── אסטרונומיה (suncalc) ── */
  var J1970 = 2440588, J2000 = 2451545, E = RAD * 23.4397;
  function toDays(ms) { return ms / 864e5 - 0.5 + J1970 - J2000; }
  function ra_(l, b) { return Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l)); }
  function dec_(l, b) { return Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l)); }
  function sidereal(d) { return RAD * (280.16 + 360.9856235 * d) - LW; }
  function altAz(H, dec) {
    return {
      alt: Math.asin(Math.sin(PHI) * Math.sin(dec) + Math.cos(PHI) * Math.cos(dec) * Math.cos(H)),
      azS: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(PHI) - Math.tan(dec) * Math.cos(PHI))
    };
  }
  function sunC(d) {
    var M = RAD * (357.5291 + 0.98560028 * d);
    var C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + RAD * 102.9372 + Math.PI;
    return { dec: dec_(L, 0), ra: ra_(L, 0) };
  }
  function moonC(d) {
    var L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
    var l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
    return { ra: ra_(l, b), dec: dec_(l, b), dist: 385001 - 20905 * Math.cos(M) };
  }
  function sunPos(ms) { var d = toDays(ms), c = sunC(d); return altAz(sidereal(d) - c.ra, c.dec); }
  function moonPos(ms) { var d = toDays(ms), c = moonC(d); return altAz(sidereal(d) - c.ra, c.dec); }
  function moonIllum(ms) {
    var d = toDays(ms), s = sunC(d), m = moonC(d), sd = 149598000;
    var phi = Math.acos(Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
    var inc = Math.atan2(sd * Math.sin(phi), m.dist - sd * Math.cos(phi));
    return (1 + Math.cos(inc)) / 2;
  }
  function vec(alt, azS) { var a = azS + Math.PI; return [Math.sin(a) * Math.cos(alt), Math.sin(alt), Math.cos(a) * Math.cos(alt)]; }

  /* ── זמני יממה אסטרונומיים (סריקה כל 4 דקות + אינטרפולציה) ── */
  function dayStart(ms) { var d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function astroDay(day0) {
    var STEP = 4, n = 1440 / STEP, alts = new Array(n + 1), i, maxA = -9, maxI = 0;
    for (i = 0; i <= n; i++) { var a = sunPos(day0 + i * STEP * 60000).alt / RAD; alts[i] = a; if (a > maxA) { maxA = a; maxI = i; } }
    function up(t) { for (var k = 1; k <= n; k++) if (alts[k - 1] < t && alts[k] >= t) return day0 + ((k - 1) + (t - alts[k - 1]) / (alts[k] - alts[k - 1])) * STEP * 60000; return null; }
    function dn(t) { for (var k = n; k >= 1; k--) if (alts[k - 1] >= t && alts[k] < t) return day0 + ((k - 1) + (alts[k - 1] - t) / (alts[k - 1] - alts[k])) * STEP * 60000; return null; }
    var rise = up(-0.833), set = dn(-0.833), both = rise !== null && set !== null;
    var noon = both ? (rise + set) / 2 : day0 + maxI * STEP * 60000;
    var sh = both ? (set - rise) / 12 : 3600000;
    return {
      alot: up(-16.1), rise: rise, noon: noon,
      minchaK: rise !== null ? rise + 9.5 * sh : noon + 3 * 3600000,
      set: set, tzeit: dn(-7.083), midNext: noon + 43200000
    };
  }

  /* ── עוגנים הלכתיים מהאתר (script.js: _prayerZman על _lastZData / KosherZmanim) ── */
  var ZK = { alot: "alotHaShachar", rise: "sunrise", noon: "chatzot", minchaK: "minchaKetana", set: "sunset", tzeit: "tzeit7083deg", midNext: "chatzotNight" };
  function siteZman(day0, key) {
    try {
      if (typeof window._prayerZman !== "function") return null;
      var d = new Date(day0 + 43200000);
      var t = window._prayerZman(new Date(d.getFullYear(), d.getMonth(), d.getDate()), key);
      return t && !isNaN(t.getTime()) ? t.getTime() : null;
    } catch (e) { return null; }
  }
  var anchors = null, milestones = null, anchorsDay = 0, anchorsSite = false;
  function buildAnchors(force) {
    var now = Date.now(), d0 = dayStart(now);
    var haveSite = typeof window._prayerZman === "function" && !!window._lastZData;
    if (!force && anchors && anchorsDay === d0 && anchorsSite === haveSite) return;
    anchorsDay = d0; anchorsSite = haveSite;
    var pairs = [], mils = [], keys = ["alot", "rise", "noon", "minchaK", "set", "tzeit", "midNext"];
    for (var k = -1; k <= 1; k++) {
      var day0 = dayStart(d0 + k * 86400000 + 43200000);
      var A = astroDay(day0);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j], a = A[key];
        if (a === null || !isFinite(a)) continue;
        var h = haveSite ? siteZman(day0, ZK[key]) : null;
        // עוגן הלכתי רחוק מהאסטרונומי (שגיאה בנתונים) — לא מותחים את השמיים יותר משעתיים
        if (h === null || Math.abs(h - a) > 7200000) h = a;
        mils.push(h);
        if (key !== "minchaK") pairs.push([h, a]);
      }
    }
    pairs.sort(function (p, q) { return p[0] - q[0]; });
    var out = [];
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i], L = out[out.length - 1];
      if (!L || (p[0] > L[0] + 60000 && p[1] > L[1] + 60000)) out.push(p);
    }
    anchors = out;
    mils.sort(function (a, b) { return a - b; });
    var m2 = [];
    for (i = 0; i < mils.length; i++) if (!m2.length || mils[i] > m2[m2.length - 1] + 60000) m2.push(mils[i]);
    milestones = m2;
  }
  // זמן הלכתי → זמן אסטרונומי (מתיחה ליניארית בין עוגנים)
  function warp(t) {
    var A = anchors;
    if (!A || A.length < 2) return t;
    if (t <= A[0][0]) return t - A[0][0] + A[0][1];
    for (var i = 1; i < A.length; i++) {
      if (t <= A[i][0]) { var f = (t - A[i - 1][0]) / (A[i][0] - A[i - 1][0]); return A[i - 1][1] + f * (A[i][1] - A[i - 1][1]); }
    }
    var L = A[A.length - 1];
    return t - L[0] + L[1];
  }
  // נקודת ההתחלה של אנימציית הכניסה: שלושה זמנים אחורה מהזמן הנוכחי
  function introStart(now) {
    var M = milestones;
    if (!M || !M.length) return now - 6 * 3600000;
    var p = -1;
    for (var i = 0; i < M.length; i++) { if (M[i] <= now) p = i; else break; }
    return M[Math.max(0, p - 3)];
  }

  /* ══ שבתות וחגים (10/2026) — הרקע עצמו לבוש לכבוד המועד ══════════════════════
     בעל האתר (01/10): "גם בשבתות וחגים הרקע עצמו ישתנה לפי השבת או החג — מעלות השחר
     של אותו יום", במלוא העוצמה כבר מעלות השחר. רק הרקע: מצב ערב שבת של lux.js
     (§45 — הפאנל והכפתורים, 3 שעות לפני ההדלקה) נשאר כמו שהוא.
     • חלון הזמן: עלות השחר של ערב השבת/החג (זמן האתר) ← צאת השבת/החג (צאת 7.083°,
       כמו ההבדלה שהאתר מציג). שבת ויום טוב צמודים = בלוק רציף; הנושא מתחלף בשקיעה.
     • מה משתנה: גוון לכל מועד (צללים/אורות), הילת נרות חמה מהעיר, קרני אור לאורך
       היום, נרות שנדלקים חלון אחר חלון בזמן ההדלקה של האתר, חלקיקים (אבק זהב,
       ניצוצות, עלים, פרחים, קונפטי) ועיטור בראש הדף (סכך/דגלונים/זר) שנגלל עם הדף —
       הכול בתוך קנבס השמיים (שתי קריאות ציור קטנות אחרי השמיים), בלי שכבה מעליו.
     • חול המועד (כל הימים) — אותו נושא, מעט רך יותר (הסכך מלא); חנוכה (כל שמונת הימים) — חוטי
       נורות בראש הדף ובכל לילה עוד בתים עם נרות בחלון; פורים ושושן פורים (לכולם, מליל פורים —
       ביום י"ג תענית אסתר) — דגלונים וקונפטי מכל הצבעים; ל"ג בעומר — מדורות על הגבעות וגיצים;
       ט' באב — שמיים מאופקים, בלי שום חגיגיות.
     • מוצאי שבת/חג (בקשת בעל האתר) — מצאת השבת/החג ועד עלות השחר: לילה ספירי-כחול, להבת
       הבדלה חמה מהעיר שדועכת לגחלים, גיצים עולים, ואורות העיר "מתעוררים" לשבוע החדש.
     • דגל בדיקה: ?fest=shabbat|rh|yk|sukkot|st|pesach|pesach7|shavuot (היום = ערב המועד;
       &festday=1 — היום הוא המועד עצמו) · ?fest=chol-sukkot|chol-pesach|av9 ·
       ?fest=purim|lag (הלילה ליל פורים / מדורות; &festday=1 — היום) ·
       ?fest=motzei&sky=20:30 (היום שבת — מוצאי שבת הלילה) ·
       ?fest=chanuka&festday=N (היום הוא יום N; בלי festday — ערב חנוכה). עם ?sky=HH:MM.
     ════════════════════════════════════════════════════════════════════════ */
  var MIN = 60000;
  // shad/shadIn — גוון הצללים (לפני/אחרי כניסת המועד), high — האורות, glow — הילת הנרות
  var FEST = {
    shabbat: { shad: [.17, .06, .31], shadIn: [.12, .06, .13], high: [1, .8, .52], glow: [1, .62, .24], grade: .5, dust: [1, .84, .47], parts: [["dust", 64], ["spark", 16], ["orb", 6]] },
    rh: { shad: [.25, .04, .1], shadIn: [.17, .04, .08], high: [1, .8, .45], glow: [1, .55, .2], grade: .5, dust: [1, .78, .38], parts: [["dust", 44], ["ruby", 24], ["spark", 8]] },
    yk: { shad: [.07, .1, .21], shadIn: [.06, .08, .17], high: [.96, .97, 1], glow: [.86, .9, 1], grade: .42, dust: [.9, .93, 1], parts: [["orb", 26], ["dust", 18]] },
    sukkot: { shad: [.05, .15, .11], shadIn: [.05, .1, .08], high: [1, .86, .5], glow: [1, .66, .28], grade: .48, dust: [1, .84, .47], parts: [["dust", 36], ["leaf", 14]], deco: "sukkah" },
    st: { shad: [.05, .11, .34], shadIn: [.04, .08, .25], high: [1, .84, .5], glow: [1, .7, .3], grade: .5, dust: [1, .86, .5], parts: [["confetti", 56], ["dust", 18], ["spark", 8]], deco: "bunting" },
    pesach: { shad: [.2, .08, .23], shadIn: [.14, .06, .16], high: [1, .86, .78], glow: [1, .7, .55], grade: .45, dust: [1, .8, .67], parts: [["petal", 40], ["dust", 20]] },
    pesach7: { shad: [.06, .13, .27], shadIn: [.05, .09, .2], high: [1, .88, .76], glow: [1, .72, .5], grade: .45, dust: [.85, .93, 1], parts: [["petal", 26], ["dust", 22], ["orb", 8]] },
    shavuot: { shad: [.05, .15, .09], shadIn: [.04, .1, .07], high: [1, .93, .62], glow: [.98, .82, .42], grade: .45, dust: [1, .92, .63], parts: [["petal", 34], ["leaf", 8], ["dust", 18]], deco: "garland" },
    chanuka: { shad: [.06, .09, .28], shadIn: [.05, .07, .2], high: [1, .84, .5], glow: [1, .64, .26], grade: .46, dust: [1, .82, .45], parts: [["dust", 40], ["spark", 18]], deco: "lights" },
    purim: { shad: [.24, .07, .3], shadIn: [.18, .05, .22], high: [1, .85, .55], glow: [1, .6, .35], grade: .46, dust: [1, .85, .5], parts: [["confetti", 64], ["spark", 12]], deco: "bunting-purim" },
    // ל"ג בעומר: מדורות על הגבעות (בשיידר — uFire), גיצים עולים ואור כתום חם
    lag: { shad: [.16, .06, .05], shadIn: [.12, .05, .05], high: [1, .74, .42], glow: [1, .46, .14], grade: .46, dust: [1, .62, .3], parts: [["ember", 64], ["orb", 7], ["spark", 10]] },
    // מוצאי שבת/חג (מצאת ועד עלות השחר): לילה ספירי-כחול, להבת הבדלה כתומה מהעיר, גיצים עולים
    // כמו מנר ההבדלה, ניצוצות, ואורות העיר "מתעוררים" לשבוע החדש
    motzei: { shad: [.05, .08, .28], shadIn: [.05, .08, .28], high: [1, .82, .58], glow: [1, .5, .22], grade: .44, dust: [1, .62, .3], parts: [["ember", 42], ["spark", 14], ["orb", 5]] }
  };
  var FEST_DEMO = null;
  // תאריך עברי של יום אזרחי (חצות מקומית) — Intl, בלי רשת
  var HEBF = null, hebMemo = {};
  function hebOf(d0) {
    if (hebMemo[d0] !== undefined) return hebMemo[d0];
    var r = null;
    try {
      if (!HEBF) HEBF = new Intl.DateTimeFormat("en-u-ca-hebrew", { month: "long", day: "numeric" });
      var m = "", d = 0;
      HEBF.formatToParts(new Date(d0 + 43200000)).forEach(function (p) { if (p.type === "month") m = p.value; else if (p.type === "day") d = parseInt(p.value, 10); });
      if (m && d) r = { m: m, d: d };
    } catch (e) {}
    return (hebMemo[d0] = r);
  }
  // ימים טובים בארץ ישראל (יום אחד, חוץ מראש השנה)
  function ytOf(h) {
    if (!h) return null;
    if (h.m === "Tishri") return h.d === 1 || h.d === 2 ? "rh" : h.d === 10 ? "yk" : h.d === 15 ? "sukkot" : h.d === 22 ? "st" : null;
    if (h.m === "Nisan") return h.d === 15 ? "pesach" : h.d === 21 ? "pesach7" : null;
    return h.m === "Sivan" && h.d === 6 ? "shavuot" : null;
  }
  function dayFlags(d0) {
    var h = hebOf(d0), wd = new Date(d0 + 43200000).getDay(), yt = ytOf(h);
    var f = { d0: d0, wd: wd, holy: yt || (wd === 6 ? "shabbat" : null), chol: null, chan: 0, purim: false, lag: false, av9: false };
    if (!h) return f;
    if (!yt && h.m === "Tishri" && h.d >= 16 && h.d <= 21) f.chol = "sukkot";       // כולל הושענא רבה
    else if (!yt && h.m === "Nisan" && h.d >= 16 && h.d <= 20) f.chol = "pesach";
    // חנוכה: כ"ה בכסלו ושבעה ימים אחריו (סופרים ימים — כסלו לפעמים חסר)
    for (var k = 0; k < 8; k++) {
      var b = hebOf(dayStart(d0 - k * 86400000 + 43200000));
      if (b && b.m === "Kislev" && b.d === 25) { f.chan = k + 1; break; }
    }
    // פורים ושושן פורים — שני הימים לכולם (בקשת בעל האתר); בשנה מעוברת — אדר ב'
    f.purim = (h.m === "Adar" || h.m === "Adar II") && (h.d === 14 || h.d === 15);
    f.lag = h.m === "Iyar" && h.d === 18;                                          // ל"ג בעומר
    f.av9 = h.m === "Av" && ((h.d === 9 && wd !== 6) || (h.d === 10 && wd === 0));  // ט' באב שחל בשבת נדחה
    return f;
  }
  // דגל הבדיקה ?fest= — "היום" מקבל את תפקיד ערב המועד (או המועד עצמו), עם הזמנים האמיתיים של היום
  function demoFlags(D, iT) {
    D.forEach(function (f) { f.holy = null; f.chol = null; f.chan = 0; f.purim = false; f.lag = false; f.av9 = false; });
    var k = FEST_DEMO.key, n = FEST_DEMO.day, i;
    function at(o) { return D[iT + o]; }
    if (k === "motzei") at(0).holy = "shabbat";   // היום שבת — מוצאי שבת הלילה (עם ?sky=20:30)
    else if (k === "chol-sukkot" || k === "chol-pesach") { for (i = -1; i <= 1; i++) at(i).chol = k.slice(5); }
    else if (k === "chanuka") { for (i = 0; i < 8; i++) { var g = at((n ? 1 - n : 1) + i); if (g) g.chan = i + 1; } }
    else if (k === "purim") { for (i = 1; i <= 2; i++) { var p = at(i - Math.min(n, 2)); if (p) p.purim = true; } } // הלילה ליל פורים; festday=1/2 — היום פורים/שושן פורים
    else if (k === "lag") { var lg = at(n ? 0 : 1); if (lg) lg.lag = true; }                                     // הלילה מדורות ל"ג בעומר; festday=1 — היום
    else if (k === "av9") at(0).av9 = true;
    else {
      var len = k === "rh" ? 2 : 1, first = 1 - Math.min(n, len);
      for (i = 0; i < len; i++) { var f = at(first + i); if (f) f.holy = k; }
    }
  }
  // זמני יום אזרחי: של האתר (העיר והשיטה שנבחרו), ובלעדיהם אסטרונומיים
  var zMemo = {};
  function zOf(d0) {
    var key = d0 + "|" + LAT + "|" + LNG + "|" + (anchorsSite ? 1 : 0);
    if (zMemo[key]) return zMemo[key];
    var A = astroDay(d0);
    function pick(k, a) { var h = siteZman(d0, k); return h !== null && (a === null || Math.abs(h - a) < 7200000) ? h : a; }
    var z = { alot: pick("alotHaShachar", A.alot), set: pick("sunset", A.set), tzeit: pick("tzeit7083deg", A.tzeit), candle: null };
    var c = siteZman(d0, "candleLighting");
    z.candle = c !== null && z.set !== null && Math.abs(c - z.set) < 5400000 ? c : (z.set !== null ? z.set - 20 * MIN : null);
    return (zMemo[key] = z);
  }
  // ציר המועדים סביב היום: בלוקים של ימים קדושים + ימים "רכים" + לילות חנוכה
  var FT = null;
  function festBuild() {
    var base0 = dayStart(Date.now());
    var key = base0 + "|" + LAT + "|" + LNG + "|" + (anchorsSite ? 1 : 0) + "|" + (FEST_DEMO ? FEST_DEMO.key + ":" + FEST_DEMO.day : "");
    if (FT && FT.key === key) return FT;
    var D = [], segs = [], men = [], i, j, k;
    for (k = -4; k <= 4; k++) D.push(dayFlags(dayStart(base0 + k * 86400000 + 43200000)));
    if (FEST_DEMO) demoFlags(D, 4);
    // 1) שבת/יום טוב — ימים רצופים הם בלוק אחד, מעלות השחר של הערב ועד צאת היום האחרון
    for (i = 1; i < D.length; i++) {
      if (!D[i].holy || D[i - 1].holy) continue;
      j = i; while (j + 1 < D.length && D[j + 1].holy) j++;
      var ez = zOf(D[i - 1].d0), lz = zOf(D[j].d0);
      if (ez.alot !== null && lz.tzeit !== null) {
        var blk = { kind: "holy", from: ez.alot, to: lz.tzeit, inner: ez.set !== null ? ez.set : ez.alot + 12 * 3600000, days: [], candles: [] };
        for (k = i; k <= j; k++) {
          var pz = zOf(D[k - 1].d0), th = D[k].holy;
          if (th === "shabbat" && D[k].chol) th = D[k].chol;            // שבת חול המועד — בנושא החג, במלוא העוצמה
          blk.days.push({ at: k === i || pz.set === null ? blk.from : pz.set, th: th });
          // נרות: ערב הבלוק ושבת שאחרי יום טוב — לפני השקיעה; יום טוב שני / שאחרי שבת — אחרי צאת
          var c = k === i || D[k].wd === 6 ? pz.candle : pz.tzeit;
          if (c !== null) blk.candles.push(c);
        }
        segs.push(blk);
        // מוצאי השבת/החג: מצאת היום האחרון ועד עלות השחר שלמחרת
        var nz = j + 1 < D.length ? zOf(D[j + 1].d0) : null;
        segs.push({ kind: "after", th: "motzei", lv: 1, from: blk.to, to: nz && nz.alot !== null ? nz.alot : blk.to + 9 * 3600000 });
      }
      i = j;
    }
    // 2) חול המועד (עדין), חנוכה, פורים, ט' באב
    for (i = 1; i < D.length; i++) {
      var f = D[i];
      if (!f.chol && !f.chan && !f.purim && !f.lag && !f.av9) continue; // זמנים מחושבים רק לימים שצריכים אותם
      var pz2 = zOf(D[i - 1].d0), z2 = zOf(f.d0);
      if (z2.tzeit === null || pz2.tzeit === null) continue;
      var eveStart = D[i - 1].wd === 6 || pz2.set === null ? pz2.tzeit : pz2.set; // אחרי שבת — רק בצאתה
      if (f.chol) segs.push({ kind: "soft", th: f.chol, lv: .75, from: pz2.tzeit, to: z2.tzeit });
      if (f.chan) {
        segs.push({ kind: "soft", th: "chanuka", lv: 1, from: f.chan === 1 && pz2.alot !== null ? pz2.alot : pz2.tzeit, to: z2.tzeit });
        // נר חנוכה בערב שלפני היום: בשקיעה; בערב שבת — לפני נרות שבת; במוצאי שבת — אחרי צאתה
        var L = D[i - 1].wd === 5 ? (pz2.candle !== null ? pz2.candle - 10 * MIN : null) : eveStart;
        if (L !== null) men.push({ at: L, n: f.chan });
      }
      // פורים מליל פורים (שקיעת י"ג — ביום עצמו תענית אסתר) ועד צאת שושן פורים; ל"ג בעומר — מליל המדורות
      if (f.purim) segs.push({ kind: "day", th: "purim", lv: 1, from: D[i - 1].purim ? pz2.tzeit : eveStart, to: z2.tzeit });
      if (f.lag) segs.push({ kind: "day", th: "lag", lv: 1, from: eveStart, to: z2.tzeit });
      if (f.av9) segs.push({ kind: "sub", th: "av9", lv: 1, from: eveStart, to: z2.tzeit });
    }
    // ימים רצופים באותו נושא (חנוכה, חול המועד) — קטע אחד, בלי "שקע" בצאת שבין יום ליום
    segs.sort(function (a, b) { return a.from - b.from; });
    var merged = [];
    segs.forEach(function (s) {
      var P = merged[merged.length - 1];
      if (P && (s.kind === "soft" || s.kind === "day") && P.kind === s.kind && P.th === s.th && P.lv === s.lv && s.from <= P.to + MIN) P.to = Math.max(P.to, s.to);
      else merged.push(s);
    });
    FT = { key: key, segs: merged, men: men };
    return FT;
  }
  // מצב המועד ברגע נתון (זמן הלכתי). כניסה: רבע שעה עד עלות השחר — ובעלות כבר מלא;
  // יציאה: 10 דקות מהצאת, יחד עם כניסת רקע מוצאי שבת (שלושת הכוכבים נדלקים); בין יום ליום — מעבר רך סביב השקיעה
  var Fz = { on: 0, lv: 0, grade: 0, glow: 0, win: 0, winV: 0, men: 0, subdue: 0, wake: 0, fire: 0, rays: 0, parts: 0, deco: 0, th: "", decoK: "", shadC: [0, 0, 0], high: [0, 0, 0], glowC: [0, 0, 0] };
  function segW(s, t) { return smooth(s.from - 15 * MIN, s.from + 10 * MIN, t) * (1 - smooth(s.to, s.to + 25 * MIN, t)); }
  function festFrame(t, alt) {
    var F = Fz, T = festBuild(), S = T.segs, i, q, s, w, e;
    F.on = F.lv = F.grade = F.glow = F.win = F.men = F.subdue = F.wake = F.fire = F.rays = F.parts = F.deco = 0; F.th = ""; F.decoK = "";
    F.winV = smooth(6 * RAD, -3 * RAD, alt);
    for (i = 0; i < T.men.length; i++) {
      var mn = T.men[i];
      F.men = Math.max(F.men, (mn.n / 8) * smooth(mn.at - 5 * MIN, mn.at + 25 * MIN, t) * (1 - smooth(mn.at + 300 * MIN, mn.at + 420 * MIN, t)));
    }
    var acc = [], purW = 0, subW = 0, blkOn = 0, inner = 0, win = 0, pres = 0, aftW = 0, aftGlow = 0;
    for (i = 0; i < S.length; i++) {
      if (S[i].kind === "day") purW = Math.max(purW, segW(S[i], t));
      else if (S[i].kind === "sub") subW = Math.max(subW, segW(S[i], t));
    }
    for (i = 0; i < S.length; i++) {
      s = S[i];
      if (s.kind !== "holy" || t < s.from - 15 * MIN || t > s.to + 25 * MIN) continue;
      // יציאה מהירה בצאת (10 דק') — רקע מוצאי שבת נכנס מאותו רגע ומתחלף איתה
      w = smooth(s.from - 15 * MIN, s.from + 10 * MIN, t) * (1 - smooth(s.to, s.to + 10 * MIN, t));
      // פורים ביום שישי — פורים עד השקיעה ואז שבת
      if (purW > 0) w *= 1 - purW * (1 - smooth(s.inner - 20 * MIN, s.inner + 10 * MIN, t));
      if (w <= 0) continue;
      blkOn = Math.max(blkOn, w); pres = Math.max(pres, w);
      var d = s.days, cur = 0;
      for (q = 1; q < d.length; q++) if (t >= d[q].at - 20 * MIN) cur = q;
      var mx = cur ? smooth(d[cur].at - 20 * MIN, d[cur].at + 20 * MIN, t) : 1;
      if (cur && mx < 1) acc.push([d[cur - 1].th, w * (1 - mx), 1]);
      acc.push([d[cur].th, w * mx, 1]);
      inner = Math.max(inner, w * smooth(s.inner - 10 * MIN, s.inner + 30 * MIN, t) * (1 - smooth(s.to - 5 * MIN, s.to + 25 * MIN, t)));
      for (q = 0; q < s.candles.length; q++) {
        var c = s.candles[q];
        win = Math.max(win, w * smooth(c - 5 * MIN, c + 25 * MIN, t) * (1 - smooth(c + 250 * MIN, c + 330 * MIN, t)));
      }
    }
    // מוצאי שבת/חג: מצאת ועד עלות השחר (מתחלף ברכות עם השבת שיוצאת; מפנה מקום לט' באב ולליל פורים)
    for (i = 0; i < S.length; i++) {
      s = S[i];
      // מתחיל בדיוק בצאת ההלכתית של האתר (כמו כפתור "סדר מוצאי שבת וחג") ומתמלא תוך 10 דקות
      if (s.kind !== "after" || t < s.from || t > s.to) continue;
      w = smooth(s.from, s.from + 10 * MIN, t) * (1 - smooth(s.to - 25 * MIN, s.to, t)) * (1 - purW) * (1 - subW);
      if (w <= 0) continue;
      aftW = Math.max(aftW, w);
      aftGlow = Math.max(aftGlow, w * (.35 + .6 * (1 - smooth(s.from, s.from + 45 * MIN, t))));   // להבת ההבדלה בצאת, ואז גחלים חמות
      acc.push([s.th, w, 1]); pres = Math.max(pres, w);
    }
    pres = Math.max(pres, Math.min(1, blkOn + aftW)); // שבת שיוצאת + מוצאי שבת שנכנס — בלי "שקע" באמצע המעבר
    F.wake = aftW;
    for (i = 0; i < S.length; i++) {
      s = S[i];
      if (s.kind === "holy" || s.kind === "after" || t < s.from - 15 * MIN || t > s.to + 25 * MIN) continue;
      w = segW(s, t) * (1 - blkOn) * (s.kind === "soft" ? 1 - aftW : 1);
      if (w <= 0) continue;
      if (s.kind === "sub") F.subdue = Math.max(F.subdue, w);
      else { acc.push([s.th, w, s.lv]); pres = Math.max(pres, w); }
    }
    if (!acc.length) return F;
    var ws = 0, wl = 0, gr = 0, topW = -1, sh = [0, 0, 0], sI = [0, 0, 0], hi = [0, 0, 0], gc = [0, 0, 0];
    for (i = 0; i < acc.length; i++) {
      var a = acc[i], P = FEST[a[0]];
      if (!P || a[1] <= 0) continue;
      ws += a[1]; wl += a[1] * a[2]; gr += a[1] * a[2] * P.grade;
      for (e = 0; e < 3; e++) { sh[e] += a[1] * P.shad[e]; sI[e] += a[1] * P.shadIn[e]; hi[e] += a[1] * P.high[e]; gc[e] += a[1] * P.glow[e]; }
      if (a[1] * a[2] > topW) { topW = a[1] * a[2]; F.th = a[0]; }
      if (a[0] === "lag" && a[1] > F.fire) F.fire = a[1];   // מדורות ל"ג בעומר
    }
    if (ws <= 0) return F;
    F.on = Math.min(1, pres);   // נוכחות הקטע כולו — גם באמצע מעבר בין שני נושאים באותו בלוק
    var inn = Math.min(1, inner / Math.max(F.on, 1e-3));
    for (e = 0; e < 3; e++) { F.shadC[e] = (sh[e] + (sI[e] - sh[e]) * inn) / ws; F.high[e] = hi[e] / ws; F.glowC[e] = gc[e] / ws; }
    F.lv = wl / ws; F.grade = gr / ws;
    F.win = win;
    F.glow = Math.max(F.on * F.lv * (.38 + .62 * Math.max(win, inn * .55)), aftGlow);
    F.rays = F.on * F.lv * smooth(3 * RAD, 10 * RAD, alt) * (1 - smooth(38 * RAD, 52 * RAD, alt));
    F.parts = F.on * F.lv;
    F.decoK = FEST[F.th].deco || "";
    F.deco = F.decoK ? F.on * (F.lv > .6 ? 1 : .8) : 0;
    return F;
  }
  // אותו גוון ב-JS — לצבעי ה-CSS (--sky-zen/--sky-hor, theme-color) שיתאימו לשמיים
  function gradeJS(c, F) {
    if (F.on < .001 && F.subdue < .001) return c;
    var l = .299 * c[0] + .587 * c[1] + .114 * c[2], s = smooth(0, .8, l), g = F.on * F.grade;
    var o = c.map(function (v, i) { var tone = F.shadC[i] + (F.high[i] - F.shadC[i]) * s; return v + (tone * (.3 + 1.15 * l) + v * .15 - v) * g; });
    if (F.subdue > .001) o = o.map(function (v, i) { return (v + (l * [.9, .94, 1.02][i] - v) * F.subdue * .6) * (1 - .14 * F.subdue); });
    return o;
  }
  // data-fest ל-CSS (עם השהיה קלה כדי שלא יהבהב סביב הסף)
  var festAttr = "";
  function festDom(F) {
    var k = F.subdue > .5 ? "av9" : F.on > .5 ? F.th : festAttr && (F.on > .3 || F.subdue > .3) ? festAttr.split("|")[0] : "";
    var lv = !k ? "" : k === "av9" ? "subdued" : F.lv > .75 ? "full" : "gentle";
    var v = k ? k + "|" + lv : "";
    if (v === festAttr) return;
    festAttr = v;
    if (k) { html.setAttribute("data-fest", k); html.setAttribute("data-fest-lvl", lv); }
    else { html.removeAttribute("data-fest"); html.removeAttribute("data-fest-lvl"); }
  }

  /* ── אטמוספרה ב-JS (מראה של השיידר) — לתאורת עננים/נוף ולצבעים ל-CSS ── */
  var RP = 6371e3, RA = 6471e3, HR = 8e3, HM = 1.2e3, G = .758, KR = [5.5e-6, 13e-6, 22.4e-6], KO = [.65e-6, 1.881e-6, .085e-6], KM = 21e-6;
  function rsi(ox, oy, oz, dx, dy, dz, r) { var b = 2 * (dx * ox + dy * oy + dz * oz), c = ox * ox + oy * oy + oz * oz - r * r, q = b * b - 4 * c; if (q < 0) return null; var s = Math.sqrt(q); return [(-b - s) / 2, (-b + s) / 2]; }
  function ozone(h) { return Math.max(0, 1 - Math.abs(h - 25e3) / 15e3); }
  function atmo(d, s, IS, JS) {
    var oy = RP + 500, p = rsi(0, oy, 0, d[0], d[1], d[2], RA); if (!p) return [0, 0, 0];
    var x0 = Math.max(p[0], 0), x1 = p[1], g = rsi(0, oy, 0, d[0], d[1], d[2], RP); if (g && g[0] > 0) x1 = Math.min(x1, g[0]);
    var st = (x1 - x0) / IS, mu = d[0] * s[0] + d[1] * s[1] + d[2] * s[2], mm = mu * mu, gg = G * G;
    var pR = 3 / (16 * Math.PI) * (1 + mm), pM = 3 / (8 * Math.PI) * ((1 - gg) * (mm + 1)) / (Math.pow(1 + gg - 2 * mu * G, 1.5) * (2 + gg));
    var oR = 0, oM = 0, oO = 0, tR = [0, 0, 0], tM = [0, 0, 0];
    for (var i = 0; i < IS; i++) {
      var t = x0 + st * (i + .5), px = d[0] * t, py = oy + d[1] * t, pz = d[2] * t, h = Math.sqrt(px * px + py * py + pz * pz) - RP;
      var dR = Math.exp(-h / HR) * st, dM = Math.exp(-h / HM) * st; oR += dR; oM += dM; oO += ozone(h) * st;
      var sh = rsi(px, py, pz, s[0], s[1], s[2], RP); if (sh && sh[0] > 0) continue;
      var js = rsi(px, py, pz, s[0], s[1], s[2], RA)[1] / JS, jR = 0, jM = 0, jO = 0;
      for (var j = 0; j < JS; j++) { var tt = js * (j + .5), qx = px + s[0] * tt, qy = py + s[1] * tt, qz = pz + s[2] * tt, hh = Math.sqrt(qx * qx + qy * qy + qz * qz) - RP; jR += Math.exp(-hh / HR) * js; jM += Math.exp(-hh / HM) * js; jO += ozone(hh) * js; }
      for (var k = 0; k < 3; k++) { var at = Math.exp(-(KM * 1.1 * (oM + jM) + KR[k] * (oR + jR) + KO[k] * (oO + jO))); tR[k] += dR * at; tM[k] += dM * at; }
    }
    return [0, 1, 2].map(function (k) { return 22 * (pR * KR[k] * tR[k] + pM * KM * tM[k]); });
  }
  function transm(s, h0) {
    var oy = RP + h0, g = rsi(0, oy, 0, s[0], s[1], s[2], RP); if (g && g[0] > 0) return [0, 0, 0];
    var ex = rsi(0, oy, 0, s[0], s[1], s[2], RA)[1], n = 40, ds = ex / n, R = 0, M = 0, O = 0;
    for (var i = 0; i < n; i++) { var t = ds * (i + .5), px = s[0] * t, py = oy + s[1] * t, pz = s[2] * t, h = Math.sqrt(px * px + py * py + pz * pz) - RP; R += Math.exp(-h / HR) * ds; M += Math.exp(-h / HM) * ds; O += ozone(h) * ds; }
    return [0, 1, 2].map(function (k) { return Math.exp(-(KR[k] * R + KM * 1.1 * M + KO[k] * O)); });
  }
  function expo(alt) { return 1.7 + .3 * smooth(25 * RAD, 2 * RAD, alt) + 10 * smooth(2 * RAD, -9 * RAD, alt) + 28 * smooth(-9 * RAD, -16 * RAD, alt); }
  function tm(c, e) { var g = c.map(function (v) { return Math.pow(1 - Math.exp(-e * v), 1 / 2.2); }); var l = .2126 * g[0] + .7152 * g[1] + .0722 * g[2]; return g.map(function (v) { return clamp(l + (v - l) * 1.32, 0, 1); }); }

  /* ── שיידרים ── */
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  // טבלת צבעי רקיע (LUT 256×128): אזימוט × גובה, מחושבת מחדש רק כשהשמש זזה
  var LUT_FS = "precision highp float;\n" +
    "uniform vec3 uSun;uniform float uExp;\n" +
    "#define PI 3.141592653589793\n" +
    "const float RP=6371e3,RA=6471e3,HR=8e3,HM=1.2e3,G=.758,KM=21e-6;\n" +
    "const vec3 KR=vec3(5.5e-6,13.0e-6,22.4e-6),KO=vec3(.65e-6,1.881e-6,.085e-6);\n" +
    "vec2 rsi(vec3 o,vec3 d,float r){float b=2.*dot(d,o);float c=dot(o,o)-r*r;float q=b*b-4.*c;if(q<0.)return vec2(1e5,-1e5);q=sqrt(q);return vec2((-b-q)*.5,(-b+q)*.5);}\n" +
    "float oz(float h){return max(0.,1.-abs(h-25e3)/15e3);}\n" +
    "vec3 atmo(vec3 d){\n" +
    "  vec3 o=vec3(0.,RP+500.,0.);\n" +
    "  vec2 p=rsi(o,d,RA);if(p.x>p.y)return vec3(0.);\n" +
    "  p.x=max(p.x,0.);\n" +
    "  vec2 g=rsi(o,d,RP);if(g.x<g.y&&g.x>0.)p.y=min(p.y,g.x);\n" +
    "  float st=(p.y-p.x)/14.;\n" +
    "  float mu=dot(d,uSun),mm=mu*mu,gg=G*G;\n" +
    "  float pR=3./(16.*PI)*(1.+mm);\n" +
    "  float pM=3./(8.*PI)*((1.-gg)*(mm+1.))/(pow(1.+gg-2.*mu*G,1.5)*(2.+gg));\n" +
    "  vec3 tR=vec3(0.),tM=vec3(0.);float oR=0.,oM=0.,oO=0.;\n" +
    "  for(int i=0;i<14;i++){\n" +
    "    vec3 pos=o+d*(p.x+st*(float(i)+.5));\n" +
    "    float h=length(pos)-RP;\n" +
    "    float dR=exp(-h/HR)*st,dM=exp(-h/HM)*st;\n" +
    "    oR+=dR;oM+=dM;oO+=oz(h)*st;\n" +
    "    vec2 sh=rsi(pos,uSun,RP);\n" +
    "    if(sh.x<sh.y&&sh.x>0.)continue;\n" +
    "    float js=rsi(pos,uSun,RA).y/6.;\n" +
    "    float jR=0.,jM=0.,jO=0.;\n" +
    "    for(int j=0;j<6;j++){vec3 q=pos+uSun*(js*(float(j)+.5));float hh=length(q)-RP;jR+=exp(-hh/HR)*js;jM+=exp(-hh/HM)*js;jO+=oz(hh)*js;}\n" +
    "    vec3 at=exp(-(KM*1.1*(oM+jM)+KR*(oR+jR)+KO*(oO+jO)));\n" +
    "    tR+=dR*at;tM+=dM*at;\n" +
    "  }\n" +
    "  return 22.*(pR*KR*tR+pM*KM*tM);\n" +
    "}\n" +
    "void main(){\n" +
    "  vec2 uv=gl_FragCoord.xy/vec2(256.,128.);\n" +
    "  float az=uv.x*2.*PI;\n" +
    "  float el=-.2094+(PI*.5+.2094)*uv.y*uv.y;\n" +
    "  vec3 d=vec3(sin(az)*cos(el),sin(el),cos(az)*cos(el));\n" +
    "  vec3 c=pow(1.-exp(-uExp*atmo(d)),vec3(1./2.2));\n" +
    "  float l=dot(c,vec3(.2126,.7152,.0722));\n" +
    "  c=clamp(l+(c-l)*1.32,0.,1.);\n" +
    "  gl_FragColor=vec4(c,1.);\n" +
    "}";
  var MAIN_FS = "precision highp float;\n" +
    "uniform sampler2D uLUT;\n" +
    "uniform vec2 uRes,uWind,uLc,uSunUV;\n" +
    "uniform float uYaw,uPitch,uSpanX,uSpanY,uHorV,uPix,uCren;\n" +
    "uniform vec3 uSun,uSunC,uSunD,uMoon,uAmb,uLand;\n" +
    "uniform vec3 uS3[3];\n" +
    "uniform float uLow,uMoonV,uMoonF,uStars,uNight,uLights,uDay,uTime,uCover,uLST,uLat,uMetA,uScrim,uDim,uRays,uStar3,uMill;\n" +
    "uniform vec4 uMet,uPlane;\n" +
    // שבתות וחגים: uFest — נוכחות המועד (כפול עוצמה), uGrade — עוצמת הגוון, uGlowA — הילת הנרות,
    // uWin — התקדמות הדלקת הנרות (0..1), uWinV — נראות הנרות לפי החשכה, uMen — חלק הבתים עם נרות חנוכה
    "uniform float uFest,uGrade,uGlowA,uWin,uWinV,uMen,uSubdue,uWake,uFire;\n" +
    "uniform vec3 uShadC,uHighC,uGlowC;\n" +
    "#define PI 3.141592653589793\n" +
    "#define TAU 6.283185307179586\n" +
    "#define D2R 0.017453292519943295\n" +
    "float h12(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}\n" +
    "float h13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.zyx+31.32);return fract((p3.x+p3.y)*p3.z);}\n" +
    "vec4 h43(vec3 p){vec4 p4=fract(vec4(p.xyzx)*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}\n" +
    "float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1.,0.)),u.x),mix(h12(i+vec2(0.,1.)),h12(i+vec2(1.,1.)),u.x),u.y);}\n" +
    "float vn3(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);\n" +
    "  return mix(mix(mix(h13(i),h13(i+vec3(1.,0.,0.)),u.x),mix(h13(i+vec3(0.,1.,0.)),h13(i+vec3(1.,1.,0.)),u.x),u.y),\n" +
    "             mix(mix(h13(i+vec3(0.,0.,1.)),h13(i+vec3(1.,0.,1.)),u.x),mix(h13(i+vec3(0.,1.,1.)),h13(i+vec3(1.,1.,1.)),u.x),u.y),u.z);}\n" +
    "const mat2 RM=mat2(.8,.6,-.6,.8);\n" +
    "float fbm5(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=RM*p*2.02+17.1;a*=.5;}return s;}\n" +
    "float fbm3(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*vn(p);p=RM*p*2.02+17.1;a*=.5;}return s*1.107;}\n" +
    "float fbmS(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vn3(p);p=p*2.03+vec3(7.1,3.3,1.7);a*=.5;}return s;}\n" +
    "float n1(float x){float i=floor(x),f=fract(x);float u=f*f*(3.-2.*f);return mix(h12(vec2(i,1.3)),h12(vec2(i+1.,1.3)),u);}\n" +
    "float fbm1(float x){return .5*n1(x)+.25*n1(x*2.1+3.)+.125*n1(x*4.3+7.)+.0625*n1(x*8.7+1.);}\n" +
    "float wrapPi(float x){return x-TAU*floor((x+PI)/TAU);}\n" +
    "vec3 lut(float az,float el){float v=sqrt(clamp((el+.2094)/(PI*.5+.2094),0.,1.));return texture2D(uLUT,vec2(fract(az/TAU),v)).rgb;}\n" +
    "float tree(float a,float c,float w,float b,float h){float dx=abs(a-c)/w;return dx<1.?b+h*pow(1.-dx,.6):-9.;}\n" +
    "float roundT(float a,float c,float w,float b,float h){float dx=abs(a-c)/w;return dx<1.?b+h*sqrt(1.-dx*dx):-9.;}\n" +
    "float boxT(float a,float c,float w,float h){return abs(a-c)<w?h:-9.;}\n" +
    "float cren(float a,float f){return step(.5,fract(a*f));}\n" +
    "float wallBase(float a){return 1.35+.25*sin((a-185.)*.08);}\n" +
    // קו הרקיע הירושלמי (בלי כיפה — לבקשת בעל האתר): עיר רחוקה ונמוכה, חומות העיר העתיקה על גבעה
    // עם שיניות, מגדל דוד (רחב + צריח), מגדלי שער יפו, מגדלי פינה, טחנת הרוח של מונטיפיורי (הלהבים
    // מצוירים בנפרד ב-main ומסתובבים), ברושים, אורנים וזיתים. גשר המיתרים — בנפרד ב-main (שכבה רחוקה).
    "float cityH(float a){\n" +
    "  float h=-9.;\n" +
    "  if(a>124.&&a<252.){\n" +
    "    float hb=h12(vec2(floor(a*1.7),4.2));\n" +
    "    float e=smoothstep(124.,134.,a)*(1.-smoothstep(242.,252.,a));\n" +
    "    h=(.22+hb*.62+.3*fbm1(a*.06))*e;\n" +
    "    if(hb>.94)h+=.85*e;\n" +
    "  }\n" +
    "  float wb=wallBase(a);\n" +
    "  if(a>158.&&a<212.)h=max(h,wb+.1+cren(a,uCren)*.16);\n" +
    "  h=max(h,boxT(a,160.5,.8,wb+.95+cren(a,4.)*.18));\n" +
    "  h=max(h,boxT(a,172.,1.6,wb+2.0+cren(a,3.2)*.2));\n" +
    "  h=max(h,boxT(a,172.9,.32,wb+2.75+cren(a,8.)*.12));\n" +
    "  h=max(h,boxT(a,184.6,.42,wb+.8+cren(a,6.)*.14));\n" +
    "  h=max(h,boxT(a,187.,.42,wb+.8+cren(a,6.)*.14));\n" +
    "  h=max(h,boxT(a,196.,.7,wb+.65+cren(a,5.)*.16));\n" +
    "  h=max(h,boxT(a,206.,.9,wb+1.05+cren(a,4.)*.18));\n" +
    "  h=max(h,boxT(a,211.5,.6,wb+.6+cren(a,5.)*.14));\n" +
    "  float dw=abs(a-149.5);if(dw<.6)h=max(h,1.15+1.55*(1.-.35*dw/.6)+.35*(1.-dw/.6));\n" +
    "  h=max(h,tree(a,141.,.42,.4,2.3));h=max(h,tree(a,143.2,.36,.4,1.8));h=max(h,tree(a,156.,.4,.6,2.0));\n" +
    "  h=max(h,roundT(a,145.8,.9,.5,1.1));h=max(h,roundT(a,153.,.8,.5,.95));\n" +
    "  h=max(h,tree(a,214.5,.4,1.,2.1));h=max(h,tree(a,224.,.45,.5,2.4));h=max(h,tree(a,226.3,.35,.5,1.7));h=max(h,tree(a,238.,.4,.4,2.1));\n" +
    "  h=max(h,roundT(a,219.,1.1,.5,1.));h=max(h,roundT(a,231.,.9,.45,.9));\n" +
    "  return h*1.8*D2R;\n" +
    "}\n" +
    "void main(){\n" +
    "  vec2 uv=gl_FragCoord.xy/uRes;\n" +
    "  float az=uYaw+(uv.x-.5)*uSpanX;\n" +
    "  float el=(uv.y-uHorV)*uSpanY+uPitch;\n" +
    "  float ce=cos(el);\n" +
    "  vec3 dir=vec3(sin(az)*ce,sin(el),cos(az)*ce);\n" +
    "  float azD=mod(degrees(az),360.);\n" +
    "  vec3 L=lut(az,el);\n" +
    "  float lumL=dot(L,vec3(.3,.55,.15));\n" +
    "  float hz=exp(-max(el,0.)*4.);\n" +
    "  float cityM=smoothstep(110.,135.,azD)*(1.-smoothstep(240.,262.,azD));\n" +
    "  vec3 skyB=L+mix(vec3(.016,.03,.078),vec3(.05,.075,.15),hz)*uNight+vec3(.22,.11,.05)*exp(-max(el,0.)*16.)*cityM*uLights*.55;\n" +
    "  vec3 col=skyB;\n" +
    // כוכבים ושביל החלב (במערכת צירים שמיימית מסתובבת לפי uLST)
    "  if(uStars>.002&&el>-.03){\n" +
    "    float sL=sin(uLST),cL=cos(uLST);\n" +
    "    float X=dot(dir,vec3(0.,cos(uLat),-sin(uLat)));\n" +
    "    float Y=-dir.x;\n" +
    "    float Zc=dot(dir,vec3(0.,sin(uLat),cos(uLat)));\n" +
    "    vec3 c=vec3(cL*X+sL*Y,sL*X-cL*Y,Zc);\n" +
    "    float b=asin(clamp(dot(c,vec3(-.86766,-.19807,.45599)),-1.,1.));\n" +
    "    float core=dot(c,vec3(-.05487,-.87341,-.48383));\n" +
    "    float wid=.16+.15*smoothstep(.55,1.,core);\n" +
    "    float band=exp(-b*b/(wid*wid));\n" +
    "    vec3 mw=vec3(0.);\n" +
    "    if(band>.02){\n" +
    "      float n=fbmS(c*6.5);\n" +
    "      float du=fbmS(c*15.+4.);\n" +
    "      float lane=exp(-b*b/.0016)*smoothstep(.4,.68,du);\n" +
    "      float v=band*(.45+.8*n)*(.35+smoothstep(-.4,1.,core))-lane*band*.75;\n" +
    "      mw=mix(vec3(.5,.6,.9),vec3(1.,.82,.6),smoothstep(.35,1.,core))*max(v,0.)*.15;\n" +
    "    }\n" +
    "    float N=150.;\n" +
    "    vec3 q=c*N;vec3 id=floor(q);vec3 f=q-id;\n" +
    "    vec4 h=h43(id);\n" +
    "    vec3 sc=vec3(0.);\n" +
    "    if(h.w<.065){\n" +
    "      vec3 sp=.3+.4*h.xyz;\n" +
    "      float d=length(f-sp);\n" +
    "      float mag=pow(h13(id+3.7),5.);\n" +
    "      float r=uPix*N*(.75+1.25*mag);\n" +
    "      float s=smoothstep(r,r*.12,d)*(.18+2.4*mag+band*.3);\n" +
    "      s*=.6+.4*sin(uTime*(1.3+3.*h.y)+h.z*40.);\n" +
    "      sc=mix(vec3(.7,.8,1.),vec3(1.,.85,.66),h.x)*s;\n" +
    "    }\n" +
    "    col+=(sc+mw)*uStars*smoothstep(-.005,.2,el)*exp(-lumL*18.);\n" +
    "  }\n" +
    // שלושת הכוכבים הראשונים — נדלקים בצאת הכוכבים של האתר
    "  if(uStar3>.001&&el>0.){\n" +
    "    float s3=0.;\n" +
    "    for(int i=0;i<3;i++){\n" +
    "      float a=acos(clamp(dot(dir,uS3[i]),-1.,1.));\n" +
    "      float tw=.8+.2*sin(uTime*(2.1+float(i)*.7)+float(i)*2.);\n" +
    "      s3+=(smoothstep(uPix*4.5,0.,a)*2.4+exp(-a/.012)*.5)*tw;\n" +
    "    }\n" +
    "    col+=vec3(1.,.96,.86)*s3*uStar3*exp(-lumL*10.);\n" +
    "  }\n" +
    // מטאור
    "  if(uMetA>0.){\n" +
    "    vec2 p=vec2(wrapPi(az-uMet.x)*ce,el-uMet.y);\n" +
    "    vec2 dv=vec2(cos(uMet.z),sin(uMet.z));\n" +
    "    float hd=.32*uMet.w;\n" +
    "    float pr=dot(p,dv);\n" +
    "    float t=clamp(pr,hd-.16,hd);\n" +
    "    float d=length(p-dv*t);\n" +
    "    col+=mix(vec3(1.,.95,.85),vec3(1.,.84,.52),uFest)*smoothstep(2.2*uPix,0.,d)*smoothstep(hd-.16,hd,pr)*uMetA*uStars;\n" +
    "  }\n" +
    // מטוס לילי — נקודה זעירה שחוצה את השמיים עם פנסים מהבהבים (אדום + סטרוב לבן)
    "  if(uPlane.z>0.){\n" +
    "    vec2 pp=vec2(wrapPi(az-uPlane.x)*ce,el-uPlane.y);\n" +
    "    float pd=length(pp);\n" +
    "    float body=smoothstep(uPix*1.7,uPix*.4,pd);\n" +
    "    float blink=step(.88,fract(uTime*1.1)),strobe=step(.95,fract(uTime*1.1+.5));\n" +
    "    col+=(vec3(.85,.88,1.)*(.3+.9*strobe)+vec3(1.,.25,.2)*blink*.9)*body*uPlane.z*uStars;\n" +
    "  }\n" +
    // ירח עם מכתשים ופאזה
    "  float cm=dot(dir,uMoon);\n" +
    "  if(uMoonV>0.&&cm>.985){\n" +
    "    float R=.03;\n" +
    "    vec3 rg=cross(uMoon,vec3(0.,1.,0.));rg=length(rg)<1e-3?vec3(1.,0.,0.):normalize(rg);\n" +
    "    vec3 up=cross(rg,uMoon);\n" +
    "    vec3 dd=dir-uMoon*cm;\n" +
    "    float dx=dot(dd,rg)/R,dy=dot(dd,up)/R,rr=dx*dx+dy*dy;\n" +
    "    float ang=acos(clamp(cm,-1.,1.));\n" +
    "    col+=vec3(.7,.78,.92)*(exp(-max(ang-R,0.)/.06)*.16+exp(-max(ang-R,0.)/.014)*.22)*uMoonV*uMoonF*(1.-uDay*.9);\n" +
    "    if(rr<1.){\n" +
    "      float z=sqrt(1.-rr);\n" +
    "      vec3 n=normalize(rg*dx+up*dy-uMoon*z);\n" +
    "      float lit=smoothstep(-.04,.2,dot(n,uSun));\n" +
    "      vec2 mp=vec2(dx,dy);\n" +
    "      float alb=.62+.38*fbm3(mp*2.3+3.1);\n" +
    "      alb-=.2*smoothstep(.5,.66,fbm3(mp*1.2+8.7));\n" +
    "      vec3 mc=vec3(1.,.97,.9)*alb*(.78+.22*z)*(lit+.035);\n" +
    "      float aa=smoothstep(1.,.9,rr)*uMoonV;\n" +
    "      col=mix(col,col*mix(.12,1.,uDay)+mc*mix(1.05,.6,uDay),aa);\n" +
    "    }\n" +
    "  }\n" +
    // שמש
    "  float cs=dot(dir,uSun);float sa=acos(clamp(cs,-1.,1.));\n" +
    "  float SR=max(.012,uPix*6.);\n" +
    "  col+=uSunD*smoothstep(SR,SR*.82,sa)*(.55+.45*sqrt(max(1.-sa*sa/(SR*SR),0.)))*3.;\n" +
    "  col+=uSunD*(exp(-sa/.025)*.4+exp(-sa/.16)*.14);\n" +
    // עננים (fbm על מישור, מוארים מכיוון השמש)
    "  float cloudD=0.;\n" +
    "  if(dir.y>.012){\n" +
    "    float t=1./dir.y;\n" +
    "    vec2 qc=dir.xz*t*1.6+uWind;\n" +
    "    float n=fbm5(qc);\n" +
    "    float dens=smoothstep(uCover,uCover+.17,n);\n" +
    "    if(dens>.003){\n" +
    "      vec2 sd=normalize(uSun.xz+vec2(1e-4));\n" +
    "      float sh=smoothstep(uCover,uCover+.17,fbm3(qc+sd*.07))+smoothstep(uCover,uCover+.17,fbm3(qc+sd*.17))+smoothstep(uCover,uCover+.17,fbm3(qc+sd*.32));\n" +
    "      float lt=exp(-sh*.95);\n" +
    "      float mu=max(cs,0.);\n" +
    "      float ph=.55+2.4*pow(mu,10.)+.4*mu*mu;\n" +
    "      vec3 cc=uAmb*(1.-.3*dens)+uSunC*(lt*ph+uLow*(1.-.4*dens)*(.7+.6*pow(mu,3.)));\n" +
    "      cc+=vec3(.2,.1,.045)*exp(-dir.y*9.)*cityM*uLights*.8;\n" +
    "      cc=(1.-exp(-cc*1.9))*(1.-.12*uDay);\n" +
    "      cc=mix(cc,skyB,(1.-exp(-t*.07))*.8);\n" +
    "      float dm=dens*smoothstep(.012,.14,dir.y);\n" +
    "      cloudD=dm;\n" +
    "      col=mix(col,cc,dm*.95);\n" +
    "    }\n" +
    "  }\n" +
    // קרני אור סביב שמש נמוכה (זריחה/שקיעה), חלשות יותר דרך עננים
    "  if(uRays>.001&&dir.y>0.){\n" +
    "    vec2 dq=(uv-uSunUV)*vec2(uRes.x/uRes.y,1.);\n" +
    "    float an=atan(dq.y,dq.x),rr=length(dq);\n" +
    "    float ray=(.5+.5*sin(an*7.+uTime*.09))*(.55+.45*sin(an*17.-uTime*.06))*(.6+.4*sin(an*31.+2.1));\n" +
    "    col+=uSunD*mix(vec3(1.),uHighC*1.15,uFest)*ray*exp(-rr*2.4)*uRays*.42*(1.-cloudD*.85);\n" +
    "  }\n" +
    // נוף: רכס רחוק באובך, רכס קרוב עם קו הרקיע, קרקע קדמית
    "  float pix=uPix;\n" +
    "  vec3 haze=lut(az,max(el,-.05))+vec3(.03,.045,.09)*uNight;\n" +
    "  float hf=(.12+1.05*fbm1(azD*.045+2.3))*D2R;\n" +
    "  float mf=smoothstep(pix,-pix,el-hf);\n" +
    "  vec3 farC=mix(uLand*vec3(.5,.5,.47),haze,.6);\n" +
    "  if(uLights>.01){\n" +
    "    vec2 g=vec2(azD*uLc.x*.7,degrees(el)*uLc.y);vec2 gi=floor(g),gf=fract(g)-.5;float r=h12(gi+3.1);\n" +
    "    if(r<.06&&el<hf-.25*D2R)farC+=vec3(1.,.78,.5)*smoothstep(.35,0.,length(gf))*uLights*.6;\n" +
    "  }\n" +
    "  col=mix(col,farC,mf);\n" +
    // גשר המיתרים (רחוק, משמאל, על גבעה): תורן מתחדד ונטוי, סיפון קשתי עם מעקה, מניפת 13 כבלים
    // מהחלק העליון של התורן אל הסיפון; בלילה התורן מואר בלבן-כחלחל ונקודות אור לאורך הסיפון.
    // הרכס הקרוב מצויר אחריו ומסתיר את תחתיתו (הגשר רחוק).
    "  {\n" +
    "    float bx=wrapPi(az-132.5*D2R)*ce/D2R,by=el/D2R;\n" +
    "    if(abs(bx)<5.6&&by>2.6&&by<8.4){\n" +
    "      vec2 P=vec2(bx,by),A=vec2(3.7,3.4),B=vec2(1.3,7.7);\n" +
    "      vec2 AB=B-A;float tt=clamp(dot(P-A,AB)/dot(AB,AB),0.,1.);\n" +
    "      float lw=max(pix/D2R*1.1,.045);\n" +
    "      float mw=mix(.34,.07,tt);\n" +
    "      float dm=length(P-(A+AB*tt));\n" +
    "      float br=smoothstep(mw+lw,max(mw-lw*.3,0.),dm);\n" +
    "      float dy=by-(3.4+.22*(1.-bx*bx/23.));\n" +
    "      br=max(br,smoothstep(.16+lw,.16-lw*.5,abs(dy))*step(abs(bx),4.9));\n" +
    "      for(int i=0;i<13;i++){\n" +
    "        float fi=float(i)/12.;\n" +
    "        vec2 T=A+AB*(.55+.45*fi);\n" +
    "        float cx=-4.6+5.6*fi;\n" +
    "        vec2 C=vec2(cx,3.4+.22*(1.-cx*cx/23.));\n" +
    "        vec2 TC=C-T;float t2=clamp(dot(P-T,TC)/dot(TC,TC),0.,1.);\n" +
    "        br=max(br,smoothstep(lw*.9,lw*.2,length(P-(T+TC*t2)))*.9);\n" +
    "      }\n" +
    "      vec3 bc=mix(uLand*vec3(.5,.5,.47),haze,.45);\n" +
    "      bc+=vec3(.75,.85,1.)*uLights*(.12*smoothstep(mw+lw,0.,dm)+.05);\n" +
    "      float dl=smoothstep(.09,.03,abs(fract(bx*2.2)-.5)/2.2)*smoothstep(.12,.02,abs(dy-.17))*step(abs(bx),4.8);\n" +
    "      bc+=vec3(1.,.9,.7)*dl*uLights*.7;\n" +
    "      col=mix(col,bc,br);\n" +
    "    }\n" +
    "  }\n" +
    "  float hn=max((-.25+1.25*fbm1(azD*.07+11.))*D2R,cityH(azD));\n" +
    "  float hg=(-3.4+1.9*fbm1(azD*.09+5.3))*D2R;\n" +
    "  float mn=smoothstep(pix,-pix,el-hn);\n" +
    "  float depth=clamp((hn-el)/(4.*D2R),0.,1.);\n" +
    "  vec3 nearC=mix(uLand*vec3(.44,.4,.35),haze,.14*(1.-depth));\n" +
    "  nearC*=.9+.2*h12(floor(vec2(azD*2.6,degrees(el)*4.)));\n" +
    // החומות: אבן ירושלים ביום (זהובה בשקיעה), נדבכים, תאורת הצפה זהובה מלמטה ושער יפו מואר בלילה
    "  float wallB=smoothstep(157.,159.,azD)*(1.-smoothstep(211.,213.,azD));\n" +
    "  if(wallB>0.){\n" +
    "    float wf=clamp((hn-el)/(4.*D2R),0.,1.);\n" +
    "    nearC=mix(nearC,uLand*vec3(.86,.76,.58)*(.94+.12*h12(floor(vec2(azD*5.,degrees(el)*9.)))),wallB*.8);\n" +
    "    nearC*=1.-.07*wallB*step(.5,fract(degrees(el)*uLc.y*1.2));\n" +
    "    nearC+=vec3(1.,.8,.48)*wallB*uLights*(.12+.3*wf)*(1.-.4*depth);\n" +
    "    float gate=smoothstep(.8*D2R,0.,length(vec2(wrapPi(az-185.8*D2R)*ce,el-(wallBase(185.8)+.3)*1.8*D2R)));\n" +
    "    nearC+=vec3(1.,.85,.55)*gate*uLights*.7;\n" +
    "  }\n" +
    "  vec2 sh2=normalize(uSun.xz+vec2(1e-4));\n" +
    "  float back=pow(max(dot(normalize(dir.xz),sh2),0.),6.);\n" +
    "  nearC+=uSunD*smoothstep(2.5*pix,0.,hn-el)*back*.5;\n" +
    // חלונות העיר; בשבת/חג — נרות שנדלקים בית אחר בית (סף אקראי לכל בית) עם להבה כתומה מרצדת,
    // ובחנוכה — בכל לילה עוד בתים (uMen). הנרות נראים כבר בדמדומים, עוד לפני שאורות העיר נדלקים.
    // במוצאי שבת/חג (uWake) העיר "מתעוררת": עוד חלונות נדלקים באור לבן-חם של חשמל
    "  float candA=max(uWin,uMen)*uWinV;\n" +
    "  if(uLights>.01||candA>.01){\n" +
    "    vec2 g=vec2(azD*uLc.x,degrees(el)*uLc.y);vec2 gi=floor(g),gf=fract(g)-.5;float r=h12(gi+.7);\n" +
    "    float cl=smoothstep(.38,.62,fbm1(azD*.13+2.));\n" +
    "    float pr=(el>hn-1.8*D2R?.3:.22*exp(-depth*1.2)*(.3+cl))*cityM+.03*(1.-cityM)*cl;\n" +
    "    float prE=pr*(1.+.7*uWake);\n" +
    "    float prC=max(pr*(1.+.5*max(uWin,uMen)),prE);\n" +
    "    if(r<prC){\n" +
    "      float spt=smoothstep(.32,0.,length(gf*vec2(1.,1.3)));\n" +
    "      vec3 lc=mix(vec3(1.,.68,.34),vec3(1.,.93,.8),max(step(pr*.55,r),step(pr,r)));\n" +
    "      float kk=h12(gi+4.2);\n" +
    "      float cand=step(r,prC*.8)*max(smoothstep(kk*.8,kk*.8+.2,uWin),step(kk,uMen))*uWinV;\n" +
    "      float fl=.62+.38*sin(uTime*(6.+r*17.)+r*40.)*sin(uTime*2.3+r*11.);\n" +
    "      nearC+=lc*spt*uLights*step(r,prE)*(.75+.25*sin(uTime*1.7+r*90.))*(1.-cand)+vec3(1.,.6,.22)*spt*cand*fl*1.3;\n" +
    "    }\n" +
    "  }\n" +
    "  col=mix(col,nearC,mn);\n" +
    // להבי טחנת הרוח (מסתובבים לאט, uMill) — צללית מעל קו הרקיע
    "  {\n" +
    "    vec2 mp2=vec2(wrapPi(az-149.5*D2R)*ce,el-5.3*D2R);\n" +
    "    if(abs(mp2.x)<2.2*D2R&&abs(mp2.y)<2.2*D2R){\n" +
    "      float cm2=cos(uMill),sm2=sin(uMill);\n" +
    "      vec2 q=vec2(cm2*mp2.x-sm2*mp2.y,sm2*mp2.x+cm2*mp2.y);\n" +
    "      float L=1.9*D2R,w=max(pix*.9,.06*D2R);\n" +
    "      float bl=max(step(abs(q.x),w)*step(abs(q.y),L),step(abs(q.y),w)*step(abs(q.x),L));\n" +
    "      bl=max(bl,smoothstep(.3*D2R,.2*D2R,length(mp2)));\n" +
    "      col=mix(col,nearC*.92,bl*(1.-mn));\n" +
    "    }\n" +
    "  }\n" +
    "  float mg=smoothstep(pix,-pix,el-hg);\n" +
    "  if(mg>0.){\n" +
    "    float fd=clamp((hg-el)/(12.*D2R),0.,1.);\n" +
    "    vec3 fg=uLand*vec3(.27,.29,.2)*(1.-.5*fd);\n" +
    "    vec2 tg=vec2(azD*uLc.x*.3,degrees(el)*uLc.y*.22);vec2 ti=floor(tg),tf=fract(tg)-.5-(vec2(h12(ti+1.3),h12(ti+2.7))-.5)*.55;\n" +
    "    fg*=1.-.3*smoothstep(.3,.08,length(tf*vec2(1.,1.4)))*step(h12(ti+9.1),.4);\n" +
    "    fg+=uLand*vec3(.06,.06,.05)*smoothstep(3.*pix,0.,hg-el);\n" +
    "    if(uLights>.01){\n" +
    "      vec2 g=vec2(azD*uLc.x*.8,degrees(el)*uLc.y*.8);vec2 gi=floor(g),gf=fract(g)-.5;float r=h12(gi+5.3);\n" +
    "      float cl=smoothstep(.42,.66,fbm1(azD*.17+7.));\n" +
    "      if(r<(.015+.05*cityM)*(.2+cl*1.4))fg+=vec3(1.,.74,.42)*smoothstep(.34,0.,length(gf))*uLights*.85;\n" +
    "    }\n" +
    "    col=mix(col,fg,mg);\n" +
    "  }\n" +
    // שבת/חג: גוון קולנועי (צללים בצבע המועד, אורות זהב), הילת נרות חמה מהעיר וגוון עמוק בפינה העליונה;
    // ט' באב — שמיים מאופקים (פחות צבע, מעט כהים יותר)
    // מדורות ל"ג בעומר על הקרקע הקדמית (לפני העיר): ליבת להבה מרצדת והילה כתומה רחבה; רק ליד המדורות
    "  if(uFire>.01&&el<.05){\n" +
    "    for(int i=0;i<10;i++){\n" +
    "      float fi=float(i),fa=112.+fi*15.5+3.*sin(fi*7.3);\n" +
    "      float dA=wrapPi(az-fa*D2R)*ce/D2R,pd=degrees(uPix),hr=55.*pd;\n" +
    "      if(abs(dA)>2.2*hr)continue;\n" +
    "      float de=degrees(el)-(-3.4+1.9*fbm1(fa*.09+5.3)-.1);\n" +
    "      float fl=.74+.26*sin(uTime*(7.+fi)+fi*3.)*sin(uTime*3.1+fi*1.7);\n" +
    "      float fh=26.*pd*(.8+.35*fl),tt=clamp(de/fh,0.,1.);\n" +
    "      vec2 q=vec2(dA/(9.*pd*(1.-.75*tt)+.6*pd),(de-fh*.42)/(fh*.6));\n" +
    "      float core=smoothstep(1.,.25,length(q))*step(-.2*fh,de);\n" +
    "      float halo=exp(-(dA*dA+de*de*1.3)/(hr*hr*.5));\n" +
    "      col+=(vec3(1.,.48,.12)*halo*.45+vec3(1.,.82,.45)*core*1.6)*fl*uFire;\n" +
    "    }\n" +
    "  }\n" +
    "  if(uGrade>.001||uFest>.001){\n" +
    "    float lg=dot(col,vec3(.299,.587,.114));\n" +
    "    vec3 tone=mix(uShadC,uHighC,smoothstep(0.,.8,lg));\n" +
    // ביום הגוון מרוכז באופק ובנוף, והכחול נשמר במרום (בדמו כל הרקיע הפך ל"ספיה" אפורה בצהריים)
    "    col=mix(col,tone*(.3+1.15*lg)+col*.15,uGrade*mix(1.,.18+.82*hz,uDay));\n" +
    // ...ובמרום — הכחול נוטה לגוון המועד (בשבת: כחול-סגלגל מלכותי) במקום להתאפר
    "    vec3 vh=uShadC/max(max(uShadC.r,max(uShadC.g,uShadC.b)),.01);\n" +
    "    col=mix(col,col*mix(vec3(1.),vh*1.3,.55),uGrade*uDay*(1.-hz)*.7);\n" +
    "    col+=uHighC*.08*uDay*uFest*(.3+.7*hz);\n" +
    "    vec2 q1=(uv-vec2(.5,-.08))*vec2(1.,2.1);\n" +
    "    col+=uGlowC*exp(-dot(q1,q1)*2.4)*uGlowA*.42;\n" +
    "    vec2 q2=(uv-vec2(.06,1.05))*vec2(1.2,2.),q3=(uv-vec2(.94,1.05))*vec2(1.2,2.);\n" +
    "    col+=uShadC*(exp(-dot(q2,q2)*3.)+exp(-dot(q3,q3)*3.))*uFest*.38;\n" +
    "  }\n" +
    "  if(uSubdue>.001){float lg2=dot(col,vec3(.299,.587,.114));col=mix(col,vec3(lg2)*vec3(.9,.94,1.02),uSubdue*.6)*(1.-.14*uSubdue);}\n" +
    "  col=min(col,vec3(1.));\n" +
    // קריאות: הכהיה כללית ביום, ויניטה, והחשכה רכה באזור הכותרת (כמו ה-scrim בדמו; במועד — בגוון המועד)
    "  col*=1.-uDim;\n" +
    "  vec2 vq=uv-.5;col*=1.-.22*dot(vq,vq);\n" +
    "  vec2 sq=(uv-vec2(.5,.8))/vec2(.78,.42);\n" +
    "  col=mix(col,mix(vec3(.016,.035,.094),uShadC*.32,uFest*.7),smoothstep(.85,0.,length(sq))*uScrim);\n" +
    "  col+=(h12(gl_FragCoord.xy+fract(uTime*.37)*91.)-.5)/160.;\n" +
    "  gl_FragColor=vec4(col,1.);\n" +
    "}";

  /* ── שבתות וחגים: חלקיקים (נקודות GL, התנועה מחושבת כולה בשיידר — אפס עבודת CPU לחלקיק)
     ועיטור בראש הדף (טקסטורה שמצוירת פעם אחת ונגללת עם הדף). שניהם על אותו קנבס, אחרי השמיים.
     סוגים: 0 אבק זהב עולה · 1 ניצוץ (כוכב ארבע קרניים) · 2 בועת אור רכה · 3 רימון · 4 עלה ·
     5 עלה כותרת · 6 קונפטי. aS — ערכים אקראיים, aC — צבע + סוג. ── */
  var PART_VS = "attribute vec4 aS;attribute vec4 aC;\n" +
    "uniform float uT,uAmt,uDay,uPx,uLk;\n" +
    "varying vec4 vC;varying float vK,vRot,vSq;\n" +
    "void main(){\n" +
    "  float k=aC.w;vec4 s=aS;float x=s.x,y=s.y,sz=1.,a=1.,rot=0.,sq=1.;\n" +
    "  if(k<.5){y=fract(s.y+uT*(.008+.02*s.w));x=s.x+.012*sin(uT*.5+s.z*6.283);sz=(1.4+2.6*s.z*s.z)*uPx;\n" +
    "    a=(.55+.45*sin(uT*(1.+2.*s.w)+s.z*40.))*smoothstep(0.,.1,y)*smoothstep(1.,.8,y)*(.5+.5*(1.-uDay));}\n" +
    "  else if(k<1.5){y=.42+.56*s.y;sz=(7.+7.*s.z)*uPx;a=pow(max(0.,sin(uT*(.45+.8*s.w)+s.z*31.)),8.)*(1.-.85*uDay);}\n" +
    "  else if(k<2.5){y=fract(s.y+uT*(.004+.006*s.w));x=s.x+.02*sin(uT*.3+s.z*6.283);sz=(18.+28.*s.z)*uPx;a=.2*smoothstep(0.,.15,y)*smoothstep(1.,.75,y);}\n" +
    "  else if(k<3.5){y=fract(s.y+uT*(.01+.022*s.w));x=s.x+.015*sin(uT*.6+s.z*6.283);sz=(2.+2.4*s.z)*uPx;a=.9*smoothstep(0.,.1,y)*smoothstep(1.,.8,y);}\n" +
    "  else if(k<4.5){y=1.-fract(s.y+uT*(.016+.02*s.w));x=fract(s.x+.05*sin(uT*.9+s.z*6.283)+uT*.004);sz=(11.+7.*s.z)*uPx;\n" +
    "    rot=uT*(s.w-.5)*2.4+s.z*6.283;sq=cos(uT*(1.+s.w)+s.z*9.);a=.95*smoothstep(0.,.06,y)*smoothstep(1.,.94,y);}\n" +
    "  else if(k<5.5){y=1.-fract(s.y+uT*(.015+.02*s.w));x=fract(s.x+uT*(.006+.008*s.z)+.03*sin(uT*1.1+s.z*6.283));sz=(9.+6.*s.z)*uPx;\n" +
    "    rot=uT*(s.w-.5)*3.+s.z*6.283;sq=.55+.45*cos(uT*1.3*(1.+s.w)+s.z*9.);a=.92*smoothstep(0.,.06,y)*smoothstep(1.,.94,y);}\n" +
    "  else if(k<6.5){y=1.-fract(s.y+uT*(.035+.04*s.w));x=fract(s.x+.025*sin(uT*1.4+s.z*6.283));sz=(7.+5.*s.z)*uPx;\n" +
    "    rot=uT*(s.w-.5)*7.+s.z*6.283;sq=cos(uT*(2.+3.*s.w)+s.z*9.);a=.95*smoothstep(0.,.05,y)*smoothstep(1.,.95,y);}\n" +
    // גץ (מוצאי שבת): עולה מהר מהעיר, מתנדנד, מהבהב ודועך לפני שמגיע למעלה — כמו מנר ההבדלה
    "  else{y=fract(s.y+uT*(.03+.045*s.w));x=s.x+.025*sin(uT*1.7+s.z*6.283)+.01*sin(uT*5.3+s.w*9.);sz=(1.8+2.4*s.z)*uPx;\n" +
    "    a=(.55+.45*sin(uT*(7.+6.*s.w)+s.z*50.))*smoothstep(0.,.05,y)*(1.-smoothstep(.3+.35*s.z,.62+.3*s.z,y));}\n" +
    "  vK=k;vRot=rot;vSq=sq;\n" +
    "  vC=vec4(aC.rgb*(k>3.5?uLk:1.),a*uAmt);\n" +
    "  gl_Position=vec4(x*2.-1.,y*2.-1.,0.,1.);\n" +
    "  gl_PointSize=sz;\n" +
    "}";
  // אבק/ניצוצות/אור — מתווספים (alpha 0); עלים/קונפטי — ציור רגיל (premultiplied)
  var PART_FS = "precision mediump float;\n" +
    "varying vec4 vC;varying float vK,vRot,vSq;\n" +
    "void main(){\n" +
    "  vec2 p=gl_PointCoord*2.-1.;\n" +
    "  float c=cos(vRot),s=sin(vRot);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y);\n" +
    "  float d=length(p),a=0.,add=1.;vec3 rgb=vC.rgb;\n" +
    "  if(vK<.5||vK>6.5)a=exp(-d*d*6.)*.45+smoothstep(.34,.05,d);\n" +
    "  else if(vK<1.5)a=max(1.-abs(p.x)*7.,0.)*max(1.-abs(p.y),0.)+max(1.-abs(p.y)*7.,0.)*max(1.-abs(p.x),0.)+exp(-d*d*14.)*.8;\n" +
    "  else if(vK<2.5)a=exp(-d*d*3.2)*.55;\n" +
    "  else if(vK<3.5)a=exp(-d*d*6.)*.35+smoothstep(.32,.04,d);\n" +
    "  else if(vK<6.5){add=0.;\n" +
    "    if(vK<4.5){vec2 q=vec2(p.x,p.y/max(abs(vSq),.18));a=smoothstep(1.,.82,length(q*vec2(1.,2.2)));rgb*=.8+.2*step(.07,abs(q.y));}\n" +
    "    else if(vK<5.5){vec2 q=vec2(p.x,p.y/max(abs(vSq),.25));a=smoothstep(1.,.78,length(q*vec2(1.,1.5)));}\n" +
    "    else{vec2 q=vec2(p.x,p.y/max(abs(vSq),.12));a=smoothstep(.95,.8,abs(q.x))*smoothstep(.5,.36,abs(q.y));}\n" +
    "  }\n" +
    "  a*=vC.a;\n" +
    "  gl_FragColor=vec4(rgb*a,a*(1.-add));\n" +
    "}";
  // עיטור בראש הדף: מלבן ברוחב המסך שנגלל עם הדף; בלילה כהה וכחלחל, פנסי הסוכה זוהרים
  var DECO_VS = "attribute vec2 p;uniform float uTop,uH,uVH;varying vec2 vUV;\n" +
    "void main(){vUV=p;float yc=uTop+p.y*uH;gl_Position=vec4(p.x*2.-1.,1.-yc/uVH*2.,0.,1.);}";
  var DECO_FS = "precision mediump float;\n" +
    "uniform sampler2D uTex,uGlowT;uniform float uA,uL,uT,uGA;varying vec2 vUV;\n" +
    "void main(){\n" +
    "  vec2 uv=vUV;uv.x+=sin(uT*1.3+uv.x*37.)*.0014*uv.y;\n" +
    "  vec4 c=texture2D(uTex,uv);\n" +
    "  gl_FragColor=vec4(c.rgb*mix(vec3(.16,.18,.3),vec3(1.),clamp(uL,0.,1.)),c.a)*uA+vec4(texture2D(uGlowT,uv).rgb*uGA,0.);\n" +
    "}";
  var PK = { dust: 0, spark: 1, orb: 2, ruby: 3, leaf: 4, petal: 5, confetti: 6, ember: 7 };
  function partColor(th, kind, i) {
    var P = FEST[th];
    if (kind === "dust") return P.dust;
    if (kind === "ember") return [[1, .55, .2], [1, .72, .32], [1, .42, .16]][i % 3];
    if (kind === "spark") return [1, .95, .82];
    if (kind === "orb") return th === "yk" ? [.92, .95, 1] : th === "pesach7" ? [.8, .9, 1] : th === "motzei" ? [.62, .7, 1] : th === "lag" ? [1, .6, .28] : [1, .88, .66];
    if (kind === "ruby") return [.92, .22, .32];
    if (kind === "leaf") return i % 2 ? [.28, .47, .19] : [.59, .55, .24];
    if (kind === "petal") return (th === "shavuot" ? [[1, 1, 1], [.99, .9, .54], [.98, .81, .91]] : [[.98, .81, .91], [1, .96, .97], [.98, .66, .83]])[i % 3];
    var cf = th === "purim" ? [[.96, .45, .71], [.65, .55, .98], [.2, .83, .6], [.98, .75, .14], [.38, .65, .98]] : [[.23, .51, .96], [1, 1, 1], [.95, .85, .54], [.11, .3, .85], [.88, .72, .31]];
    return cf[i % cf.length];
  }
  // ציור העיטור (פעם אחת לכל מועד/גודל) — סכך עם קורות ונויי סוכה, דגלוני שמחת תורה, זר שבועות
  function decoCanvas(kind, FW, FH, k) {
    var hs = kind === "sukkah" ? Math.round(clamp(FH * .16, 80, 150)) : 0;
    var Hc = kind === "sukkah" ? Math.round(hs * 1.75 + 34) : kind === "garland" ? Math.round(Math.min(60, FH * .07) + 30) : kind === "lights" ? Math.round(Math.min(56, FH * .068) + 28) : Math.round(Math.min(66, FH * .078) + 34);
    var c = document.createElement("canvas"); c.width = Math.max(2, Math.round(FW * k)); c.height = Math.max(2, Math.round(Hc * k));
    var x = c.getContext("2d"), g = null, gx = null, sd = 11, i, xx, yy;
    x.scale(k, k);
    function R() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
    function rr(cx, X, Y, w, h, r) { cx.beginPath(); if (cx.roundRect) cx.roundRect(X, Y, w, h, r); else cx.rect(X, Y, w, h); }
    if (kind === "sukkah") {
      var n = Math.ceil(FW / 64) + 3;
      for (i = 0; i < n; i++) {
        var x0 = (i - 1) * FW / (n - 3) + (R() - .5) * 26, dir = R() < .5 ? -1 : 1, len = hs * (.7 + R() * .6);
        var ex = x0 + dir * (36 + R() * 70), ey = len, cx1 = x0 + dir * (8 + R() * 24), cy1 = len * .3, col = [[20, 48, 22], [28, 64, 28], [38, 80, 34]][Math.floor(R() * 3)];
        x.strokeStyle = "rgb(" + col + ")"; x.lineCap = "round";
        for (var kq = 0; kq <= 24; kq++) {
          var u = kq / 24, iu = 1 - u;
          var px = iu * iu * x0 + 2 * iu * u * cx1 + u * u * ex, py = iu * iu * (-10) + 2 * iu * u * cy1 + u * u * ey;
          var tx = 2 * iu * (cx1 - x0) + 2 * u * (ex - cx1), ty = 2 * iu * (cy1 + 10) + 2 * u * (ey - cy1), tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, L = (1 - u * .6) * (24 + R() * 9);
          for (var sg = -1; sg <= 1; sg += 2) {
            var lx = px + (-uy * sg + ux * .55) * L, ly = py + (ux * sg + uy * .55) * L + L * .28;
            x.lineWidth = 2.1 * (1 - u * .5); x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo((px + lx) / 2, (py + ly) / 2 + L * .12, lx, ly); x.stroke();
          }
        }
        x.lineWidth = 2.6; x.strokeStyle = "rgb(" + col.map(function (v) { return v * .8 | 0; }) + ")"; x.beginPath(); x.moveTo(x0, -10); x.quadraticCurveTo(cx1, cy1, ex, ey); x.stroke();
      }
      [[hs * .12, 10], [hs * .46, 8]].forEach(function (b) {
        var gr = x.createLinearGradient(0, b[0] - b[1] / 2, 0, b[0] + b[1] / 2);
        gr.addColorStop(0, "#5b3d18"); gr.addColorStop(.45, "#c79b5c"); gr.addColorStop(1, "#5f411b");
        x.fillStyle = gr; x.fillRect(0, b[0] - b[1] / 2, FW, b[1]);
        x.fillStyle = "rgba(60,38,14,.75)"; for (var nx = R() * 60; nx < FW; nx += 90 + R() * 60) x.fillRect(nx, b[0] - b[1] / 2, 3, b[1]);
      });
      // נויי סוכה תלויים (פנסים, רימונים, מגן דוד, אתרוגים); הפנסים זוהרים בלילה (טקסטורה נפרדת)
      g = document.createElement("canvas"); g.width = c.width; g.height = c.height; gx = g.getContext("2d"); gx.scale(k, k);
      var xs = FW < 760 ? [.06, .19, .81, .94] : [.05, .13, .22, .78, .87, .95], beamY = hs * .46;
      xs.forEach(function (f, ii) {
        var ax = f * FW, ln = hs * (.55 + ((ii * 37) % 10) / 10 * .6), ox = ax, oy = beamY + ln, type = ["lantern", "pom", "star", "etrog", "pom", "lantern"][ii % 6];
        x.strokeStyle = "rgba(230,220,190,.75)"; x.lineWidth = 1; x.beginPath(); x.moveTo(ax, beamY); x.lineTo(ox, oy); x.stroke();
        if (type === "lantern") {
          x.fillStyle = "#b8862f"; x.fillRect(ox - 6, oy, 12, 3); x.fillStyle = "rgba(255,214,140,.95)"; rr(x, ox - 8, oy + 3, 16, 20, 4); x.fill();
          x.strokeStyle = "#8a5a12"; x.lineWidth = 1.4; x.stroke(); x.fillStyle = "#b8862f"; x.fillRect(ox - 6, oy + 23, 12, 3);
          var gg = gx.createRadialGradient(ox, oy + 12, 0, ox, oy + 12, 48); gg.addColorStop(0, "rgba(255,190,90,.6)"); gg.addColorStop(1, "rgba(255,190,90,0)");
          gx.fillStyle = gg; gx.beginPath(); gx.arc(ox, oy + 12, 48, 0, 6.2832); gx.fill();
        } else if (type === "pom") {
          var gp = x.createRadialGradient(ox - 3, oy + 9, 1, ox, oy + 11, 11); gp.addColorStop(0, "#f87171"); gp.addColorStop(1, "#7f1d1d");
          x.fillStyle = gp; x.beginPath(); x.arc(ox, oy + 11, 9, 0, 6.2832); x.fill();
          x.fillStyle = "#7f1d1d"; x.beginPath(); x.moveTo(ox - 3, oy + 3); x.lineTo(ox - 4, oy - 1); x.lineTo(ox, oy + 2); x.lineTo(ox + 4, oy - 1); x.lineTo(ox + 3, oy + 3); x.fill();
        } else if (type === "star") {
          x.strokeStyle = "#e0b74f"; x.lineWidth = 2;
          for (var r0 = 0; r0 < 2; r0++) { x.beginPath(); for (var kk = 0; kk < 3; kk++) { var an = r0 * Math.PI + kk * 2.0944 - Math.PI / 2, sx = ox + Math.cos(an) * 11, sy = oy + 12 + Math.sin(an) * 11; if (kk) x.lineTo(sx, sy); else x.moveTo(sx, sy); } x.closePath(); x.stroke(); }
        } else {
          var ge = x.createRadialGradient(ox - 3, oy + 9, 1, ox, oy + 12, 13); ge.addColorStop(0, "#fef08a"); ge.addColorStop(1, "#ca8a04");
          x.fillStyle = ge; x.beginPath(); x.ellipse(ox, oy + 12, 8, 11, 0, 0, 6.2832); x.fill();
        }
      });
    } else if (kind === "garland") {
      var sag = Math.min(60, FH * .07), yAt = function (q) { return 6 + sag * (1 - Math.pow((q - FW / 2) / (FW / 2), 2)); };
      x.strokeStyle = "#3b6b2f"; x.lineWidth = 3; x.beginPath();
      for (xx = -10; xx <= FW + 10; xx += 6) { yy = yAt(xx); if (xx === -10) x.moveTo(xx, yy); else x.lineTo(xx, yy); }
      x.stroke();
      for (xx = 0, i = 0; xx < FW; xx += 11, i++) {
        yy = yAt(xx); var sl = Math.atan2(yAt(xx + 1) - yy, 1), sgn = i % 2 ? 1 : -1;
        x.save(); x.translate(xx, yy); x.rotate(sl + sgn * .75); x.fillStyle = sgn > 0 ? "#4f8a3c" : "#3f7a34"; x.beginPath(); x.ellipse(7, 0, 7, 3.1, 0, 0, 6.2832); x.fill(); x.restore();
      }
      var FC = [["#ffffff", "#facc15"], ["#fbcfe8", "#f59e0b"], ["#fde68a", "#d97706"]];
      for (xx = 24, i = 0; xx < FW; xx += 48, i++) {
        yy = yAt(xx) + 3; x.fillStyle = FC[i % 3][0];
        for (var a5 = 0; a5 < 5; a5++) { var an5 = a5 * 1.2566 + i; x.beginPath(); x.ellipse(xx + Math.cos(an5) * 4.6, yy + Math.sin(an5) * 4.6, 4.4, 2.9, an5, 0, 6.2832); x.fill(); }
        x.fillStyle = FC[i % 3][1]; x.beginPath(); x.arc(xx, yy, 2.4, 0, 6.2832); x.fill();
      }
    } else if (kind === "lights") {
      // חנוכה — חג האורים: שני חוטי נורות זעירות (כחול, לבן, זהב) לאורך ראש הדף; בלילה הן זוהרות (טקסטורה נפרדת)
      g = document.createElement("canvas"); g.width = c.width; g.height = c.height; gx = g.getContext("2d"); gx.scale(k, k);
      var LC = ["#60a5fa", "#f8fafc", "#fbbf24"], LG = ["96,165,250", "248,250,252", "251,191,36"];
      [[6, Math.min(34, FH * .045)], [-4, Math.min(56, FH * .068)]].forEach(function (row, ri) {
        var y0 = row[0], sg3 = row[1], yB = function (q) { return y0 + sg3 * (1 - Math.pow((q - FW / 2) / (FW / 2), 2)); };
        x.strokeStyle = "rgba(30,41,59,.85)"; x.lineWidth = 1.2; x.beginPath();
        for (xx = -10; xx <= FW + 10; xx += 8) { if (xx === -10) x.moveTo(xx, yB(xx)); else x.lineTo(xx, yB(xx)); }
        x.stroke();
        for (xx = 14 + ri * 13, i = ri; xx < FW; xx += 26, i++) {
          var by = yB(xx) + 5, ci = i % 3;
          x.fillStyle = "#334155"; x.fillRect(xx - 1.5, by - 6, 3, 3);
          var gb = x.createRadialGradient(xx - 1, by - 1, .5, xx, by, 4.2); gb.addColorStop(0, "#ffffff"); gb.addColorStop(.35, LC[ci]); gb.addColorStop(1, LC[ci]);
          x.fillStyle = gb; x.beginPath(); x.ellipse(xx, by, 3.2, 4.2, 0, 0, 6.2832); x.fill();
          var lgw = gx.createRadialGradient(xx, by, 0, xx, by, 16); lgw.addColorStop(0, "rgba(" + LG[ci] + ",.75)"); lgw.addColorStop(1, "rgba(" + LG[ci] + ",0)");
          gx.fillStyle = lgw; gx.beginPath(); gx.arc(xx, by, 16, 0, 6.2832); gx.fill();
        }
      });
    } else {
      // דגלונים — שמחת תורה בכחול, לבן וזהב; פורים בכל הצבעים
      var BC = kind === "bunting-purim" ? ["#ec4899", "#a855f7", "#14b8a6", "#f59e0b", "#3b82f6"] : ["#1d4ed8", "#f8fafc", "#e0b74f"];
      [[8, Math.min(40, FH * .05)], [-6, Math.min(66, FH * .078)]].forEach(function (row, ri) {
        var y0 = row[0], sg2 = row[1], yA = function (q) { return y0 + sg2 * (1 - Math.pow((q - FW / 2) / (FW / 2), 2)); };
        x.strokeStyle = "rgba(240,230,200,.85)"; x.lineWidth = 1.3; x.beginPath();
        for (xx = -10; xx <= FW + 10; xx += 8) { if (xx === -10) x.moveTo(xx, yA(xx)); else x.lineTo(xx, yA(xx)); }
        x.stroke();
        for (xx = ri * 17, i = ri; xx < FW; xx += 34, i++) {
          var x2 = xx + 34 * .78, y1 = yA(xx), y2 = yA(x2), mx = (xx + x2) / 2;
          x.fillStyle = BC[i % BC.length]; x.beginPath(); x.moveTo(xx, y1); x.lineTo(x2, y2); x.lineTo(mx, (y1 + y2) / 2 + 24); x.closePath(); x.fill();
          x.fillStyle = "rgba(0,0,0,.14)"; x.beginPath(); x.moveTo(mx, (y1 + y2) / 2); x.lineTo(x2, y2); x.lineTo(mx, (y1 + y2) / 2 + 24); x.closePath(); x.fill();
        }
      });
    }
    return { c: c, g: g, h: Hc };
  }

  /* ── WebGL ── */
  var cv = null, gl = null, ext = null, prog = null, lutProg = null, fb = null, lutTex = null, U = {}, UL = {}, triBuf = null;
  // משאבי המועד (נוצרים רק כשיש מועד — ביום חול לא מקמפלים כלום)
  var fP = null, fD = null, fUP = {}, fUD = {}, fBuf = null, fN = 0, fKey = "", quadBuf = null, dTex = null, dGlow = null, nullTex = null, dKey = "", dH = 0, fReady = false, festBroken = false;
  function festReset() { fP = fD = fBuf = quadBuf = dTex = dGlow = nullTex = null; fReady = false; fKey = dKey = ""; fN = 0; }
  var glReady = false, nogl = false, started = false;
  function makeShader(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  function makeProg(fs, vs, attrs) {
    var p = gl.createProgram();
    gl.attachShader(p, makeShader(gl.VERTEX_SHADER, vs || VS));
    gl.attachShader(p, makeShader(gl.FRAGMENT_SHADER, fs));
    (attrs || ["p"]).forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
    gl.linkProgram(p);
    return p;
  }
  function initGL() {
    try {
      festReset();
      gl = cv.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: mobile ? "low-power" : "high-performance", failIfMajorPerformanceCaveat: true });
      if (!gl) return false;
      var pf = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (!pf || !pf.precision) return false; // בלי highp חישובי האטמוספרה (רדיוס כדור הארץ) עולים על גדותיהם
      ext = gl.getExtension("KHR_parallel_shader_compile");
      lutProg = makeProg(LUT_FS);
      prog = makeProg(MAIN_FS);
      glReady = false;
      return true;
    } catch (e) { return false; }
  }
  function finishGL() {
    var b = triBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    lutTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 128, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, lutTex, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) return false;
    ["uSun", "uExp"].forEach(function (n) { UL[n] = gl.getUniformLocation(lutProg, n); });
    ["uLUT", "uRes", "uWind", "uLc", "uSunUV", "uYaw", "uPitch", "uSpanX", "uSpanY", "uHorV", "uPix", "uCren", "uSun", "uSunC", "uSunD", "uMoon", "uAmb", "uLand", "uS3",
      "uLow", "uMoonV", "uMoonF", "uStars", "uNight", "uLights", "uDay", "uTime", "uCover", "uLST", "uLat", "uMetA", "uScrim", "uDim", "uRays", "uStar3", "uMill", "uMet", "uPlane",
      "uFest", "uGrade", "uGlowA", "uWin", "uWinV", "uMen", "uSubdue", "uWake", "uFire", "uShadC", "uHighC", "uGlowC"
    ].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    lastLut = null;
    return true;
  }
  // תוכניות המועד — מקומפלות ברקע בפעם הראשונה שיש מועד, ומשמשות מהפריים שבו הקומפילציה הסתיימה
  function festGL() {
    if (fReady) return true;
    if (festBroken || !gl) return false;
    try {
      if (!fP) {
        fP = makeProg(PART_FS, PART_VS, ["aS", "aC"]);
        fD = makeProg(DECO_FS, DECO_VS, ["p"]);
        return false;
      }
      if (ext && (!gl.getProgramParameter(fP, ext.COMPLETION_STATUS_KHR) || !gl.getProgramParameter(fD, ext.COMPLETION_STATUS_KHR))) return false;
      if (!gl.getProgramParameter(fP, gl.LINK_STATUS) || !gl.getProgramParameter(fD, gl.LINK_STATUS)) {
        try { console.warn("[sky] fest shader link failed:", gl.getProgramInfoLog(fP) || gl.getProgramInfoLog(fD)); } catch (e) {}
        festBroken = true; return false;
      }
      ["uT", "uAmt", "uDay", "uPx", "uLk"].forEach(function (n) { fUP[n] = gl.getUniformLocation(fP, n); });
      ["uTop", "uH", "uVH", "uTex", "uGlowT", "uA", "uL", "uT", "uGA"].forEach(function (n) { fUD[n] = gl.getUniformLocation(fD, n); });
      fBuf = gl.createBuffer();
      quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
      nullTex = texOf(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
      fReady = true;
      return true;
    } catch (e) { festBroken = true; return false; }
  }
  // טקסטורה מקנבס דו-ממדי (premultiplied); בלי קנבס — פיקסל שקוף אחד
  function texOf(canvas, tex) {
    tex = tex || gl.createTexture();
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    if (canvas) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE0);
    return tex;
  }
  function buildParts(th) {
    var P = FEST[th], data = [], mul = mobile ? .6 : 1;
    (P ? P.parts : []).forEach(function (s) {
      for (var i = 0, n = Math.round(s[1] * mul); i < n; i++) {
        var c = partColor(th, s[0], i);
        data.push(Math.random(), Math.random(), Math.random(), Math.random(), c[0], c[1], c[2], PK[s[0]]);
      }
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, fBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.length ? data : [0, 0, 0, 0, 0, 0, 0, 0]), gl.STATIC_DRAW);
    fN = data.length / 8; fKey = th;
  }
  function buildDeco(kind) {
    dKey = kind + "|" + RW + "x" + RH;
    try {
      var d = decoCanvas(kind, W, H, RW / W);
      dTex = texOf(d.c, dTex); dGlow = d.g ? texOf(d.g, dGlow) : null; dH = d.h;
    } catch (e) { dTex = null; }
  }
  // אחרי ציור השמיים: עיטור בראש הדף ואז החלקיקים (שילוב premultiplied: ONE, ONE_MINUS_SRC_ALPHA)
  function festDraw(F, t, day) {
    if (!festGL()) return;
    var tt = reduce ? 3 : (t / 1000) % 100000;
    var L = .24 + .76 * day + .28 * F.glow;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (F.deco > .01 && F.decoK) {
      if (dKey !== F.decoK + "|" + RW + "x" + RH) buildDeco(F.decoK);
      var sy = 0; try { sy = window.scrollY || 0; } catch (e) {}
      if (dTex && sy < dH + 10) {
        gl.useProgram(fD);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, dTex); gl.uniform1i(fUD.uTex, 1);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, dGlow || nullTex); gl.uniform1i(fUD.uGlowT, 2);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1f(fUD.uTop, -sy); gl.uniform1f(fUD.uH, dH); gl.uniform1f(fUD.uVH, H);
        gl.uniform1f(fUD.uA, F.deco); gl.uniform1f(fUD.uL, L); gl.uniform1f(fUD.uT, tt); gl.uniform1f(fUD.uGA, F.deco * (1 - day) * .9);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
    if (F.parts > .01 && FEST[F.th] && FEST[F.th].parts.length) {
      if (fKey !== F.th) buildParts(F.th);
      if (fN) {
        gl.useProgram(fP);
        gl.bindBuffer(gl.ARRAY_BUFFER, fBuf);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
        gl.uniform1f(fUP.uT, tt); gl.uniform1f(fUP.uAmt, F.parts); gl.uniform1f(fUP.uDay, day); gl.uniform1f(fUP.uPx, RW / W); gl.uniform1f(fUP.uLk, .45 + .55 * Math.min(1, L));
        gl.drawArrays(gl.POINTS, 0, fN);
        gl.disableVertexAttribArray(1);
      }
    }
    gl.disable(gl.BLEND);
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  // הקומפילציה רצה ברקע (KHR_parallel_shader_compile); בודקים בכל פריים אם הסתיימה
  function glPoll() {
    if (glReady) return true;
    if (!gl) return false;
    try {
      if (ext && (!gl.getProgramParameter(lutProg, ext.COMPLETION_STATUS_KHR) || !gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR))) return false;
      if (!gl.getProgramParameter(lutProg, gl.LINK_STATUS) || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        try { console.warn("[sky] shader link failed:", gl.getProgramInfoLog(prog) || gl.getProgramInfoLog(lutProg)); } catch (e) {}
        failGL(); return false;
      }
      if (!finishGL()) { failGL(); return false; }
      glReady = true;
      return true;
    } catch (e) { failGL(); return false; }
  }
  function failGL() {
    nogl = true; glReady = false;
    try { if (gl) { var lc = gl.getExtension("WEBGL_lose_context"); if (lc) lc.loseContext(); } } catch (e) {}
    gl = null;
    if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
    cv = null;
    html.classList.add("lux-sky-nogl");
    stopLoop();
    noglStart();
  }

  /* ── גיאומטריית התצוגה ── */
  var scale = mobile ? 0.8 : 0.9, W = 0, H = 0, RW = 0, RH = 0, view = {};
  function layout() {
    if (!cv) return;
    W = cv.clientWidth || window.innerWidth; H = cv.clientHeight || window.innerHeight;
    if (!W || !H) return;
    var portrait = W / H < 0.9;
    var rw = Math.max(2, Math.round(Math.min(W * scale, 1920)));
    var rh = Math.max(2, Math.round(H * (rw / W)));
    if (cv.width !== rw || cv.height !== rh) { cv.width = rw; cv.height = rh; }
    RW = rw; RH = rh;
    var spanX = (portrait ? 78 : 150) * RAD;
    var spanY = clamp(spanX * H / W, 70 * RAD, (portrait ? 96 : 110) * RAD);
    view = { portrait: portrait, spanX: spanX, spanY: spanY, horV: portrait ? .3 : .32, K: portrait ? .78 : .6, KM: portrait ? .86 : .6, pix: spanY / rh };
    var pxDegX = rw / (spanX / RAD), pxDegY = rh / (spanY / RAD);
    view.cren = clamp(pxDegX / 5.5, .5, 2.2);
    view.lc = [clamp(pxDegX / 3.6, .6, 3.2), clamp(pxDegY / 2.1, 1.2, 6.5)];
  }
  var resizeT = 0;
  window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(layout, 150); });

  /* ── מצב הזמן ── */
  var mode = "live", sim = 0, tw = null, play = null, fixedMs = null;
  var wind = [Math.random() * 50, Math.random() * 50], prevAms = null, par = [0, 0], parT = [0, 0];
  var met = null, nextMet = 0, plane = null, nextPlane = 20000, frames = 0, acc = 0, lastLut = null, lastLight = null, LIT = null, cover = .56 + Math.random() * .06;
  var s3 = null, lastDraw = 0, lastDomT = 0, running = false, rafId = 0, oneShot = false, lastLiveSim = 0, fadedIn = false, drawn = 0, startedAt = 0, firstDrawMs = 0, frameCpuMs = 0;
  if (!mobile) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse" && W && H) parT = [(e.clientX / W - .5) * -.06, (e.clientY / H - .5) * .035];
    }, { passive: true });
  }

  /* ── סנכרון ל-DOM (שלב היום, צבעים ל-CSS, theme-color) — רק כשמשהו השתנה ── */
  var domKey = "";
  function q4(v) { return Math.round(clamp(v, 0, 1) * 63.75) * 4; }
  function syncDom(alt, eve, zen, hor, day) {
    var ph = alt > 8 * RAD ? "day" : alt > -7 * RAD ? (eve ? "dusk" : "dawn") : "night";
    var z = zen.map(q4).join(","), h = hor.map(q4).join(",");
    var glass = (0.36 + 0.28 * day).toFixed(2), dayS = day.toFixed(2);
    var key = ph + "|" + z + "|" + h + "|" + glass + "|" + dayS;
    if (key === domKey) return;
    domKey = key;
    if (html.dataset.sky !== ph) html.dataset.sky = ph;
    var st = html.style;
    st.setProperty("--sky-zen", z); st.setProperty("--sky-hor", h);
    st.setProperty("--sky-glass", glass); st.setProperty("--sky-day", dayS);
    try {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = "rgb(" + zen.map(function (v) { return Math.round(clamp(v * .8, 0, 1) * 255); }).join(",") + ")";
    } catch (e) {}
    try { window.dispatchEvent(new CustomEvent("lux-sky", { detail: { phase: ph, day: day } })); } catch (e) {}
  }

  /* ── פריים ── */
  function frame(t) {
    rafId = 0;
    if (!running) return;
    if (!oneShot) rafId = requestAnimationFrame(frame);
    if (!glReady && !glPoll()) return;
    var cpu0 = performance.now();
    if (!RW) layout();
    if (!RW) return;
    if (mobile && t - lastDraw < 30) return; // ~30fps בטלפון
    var dt = Math.min(80, lastDraw ? t - lastDraw : 16);
    lastDraw = t;

    // זמן (הלכתי): דמו קבוע / יממה ב-60 שניות / אנימציית כניסה / זמן אמת
    if (fixedMs !== null) sim = fixedMs;
    else if (play) sim = play.t0 + ((t - play.p0) / 60000) * 86400000;
    else if (tw) {
      if (tw.t0 === null) tw.t0 = t; // הספירה מתחילה בפריים המצויר הראשון, לא בזמן קומפילציית השיידר
      var k = clamp((t - tw.t0) / tw.dur, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      sim = tw.from + (tw.to - tw.from) * e;
      if (k >= 1) { tw = null; mode = "live"; }
    } else if (mode === "live") sim = Date.now();
    if (mode === "live") lastLiveSim = sim;
    buildAnchors(false);
    var ams = warp(sim);

    var sp = sunPos(ams), mp = moonPos(ams), sun = vec(sp.alt, sp.azS), moon = vec(mp.alt, mp.azS), illum = moonIllum(ams);
    var dSim = prevAms === null ? 0 : clamp(Math.abs(ams - prevAms) / 60000, 0, 720);
    prevAms = ams;
    if (!reduce) { wind[0] += (dt * .00045 + dSim * .012) * .8; wind[1] += (dt * .00045 + dSim * .012) * .6; }
    wind[0] %= 900; wind[1] %= 900;

    var ex = expo(sp.alt), day = smooth(-6 * RAD, 6 * RAD, sp.alt), stars = smooth(-4 * RAD, -12 * RAD, sp.alt);
    var night = smooth(2 * RAD, -10 * RAD, sp.alt), lights = smooth(-1 * RAD, -7 * RAD, sp.alt);
    var eve = sp.azS > 0;

    // טבלת הרקיע — רק כשהשמש זזה בפועל (כ-0.03°)
    var lk = Math.round(sp.alt * 2000) + "," + Math.round(sp.azS * 1200) + "," + ex.toFixed(3);
    if (lk !== lastLut) {
      lastLut = lk;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, 256, 128);
      gl.useProgram(lutProg); gl.uniform3fv(UL.uSun, sun); gl.uniform1f(UL.uExp, ex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // תאורה — תלויה רק בשמש ובירח; מחושבת מחדש רק כשהשמש זזה (אותו מפתח כמו ה-LUT) — חוסך ~3ms CPU לפריים
    var moonUp = smooth(-1 * RAD, 4 * RAD, mp.alt) * illum;
    var lightKey = lk + "|" + Math.round(moonUp * 50);
    if (lightKey !== lastLight) {
      lastLight = lightKey;
      var zen0 = tm(atmo([0, 1, 0], sun, 8, 4), ex), hs0 = tm(atmo(vec(4 * RAD, sp.azS), sun, 8, 4), ex);
      var tc = transm(sun, 4000), td0 = transm(sun, 500);
      var sinA = Math.max(Math.sin(sp.alt), 0);
      LIT = {
        zen: zen0, hs: hs0, td: td0,
        amb: [0, 1, 2].map(function (k) { return (zen0[k] * .75 + hs0[k] * .3) * 1.05 + [.02, .028, .05][k] * night + [.035, .045, .065][k] * moonUp * night; }),
        sunC: tc.map(function (v) { return v * .95; }),
        land: [0, 1, 2].map(function (k) { return zen0[k] * .6 + td0[k] * sinA * .9 + [.012, .016, .034][k] * night + [.03, .036, .046][k] * moonUp * night; })
      };
    }
    var zen = LIT.zen, hs = LIT.hs, td = LIT.td, amb = LIT.amb, sunC = LIT.sunC, land = LIT.land;

    // מצלמה: עוקבת אחרי השמש ביום ואחרי הירח בלילה, סחיפה איטית, פרלקסה לגלילה ולעכבר
    par[0] += (parT[0] - par[0]) * .04; par[1] += (parT[1] - par[1]) * .04;
    var relAz = Math.atan2(Math.sin(sp.azS), Math.cos(sp.azS));
    var follow = smooth(-20 * RAD, -5 * RAD, sp.alt);
    var mRel = Math.atan2(Math.sin(mp.azS), Math.cos(mp.azS)), mW = smooth(-2 * RAD, 8 * RAD, mp.alt) * (1 - follow);
    var drift = reduce ? 0 : .02 * Math.sin(t / 38000), pDrift = reduce ? 0 : .008 * Math.sin(t / 53000);
    var yaw = Math.PI + clamp(relAz * view.K, -.6, .6) * follow + clamp(mRel * view.KM, -.45, .45) * mW + par[0] + drift; // סיבוב מוגבל (עד ~34°/26°) — החומות המוארות נשארות בתצוגה גם כשהשמש/הירח בצד
    var sc = 0; try { sc = clamp((window.scrollY || 0) / H, 0, 3); } catch (e) {}
    var pitch = par[1] + pDrift - sc * .02;

    // שלושת הכוכבים הראשונים — ננעלים בשמיים (יחסית למצלמה) ברגע שמתחילים להופיע
    var star3 = smooth(-5.2 * RAD, -7.2 * RAD, sp.alt);
    if (sp.alt > 0) s3 = null;
    if (star3 > 0 && !s3) {
      var offs = [[-.42, .55], [.06, .72], [.4, .5]], arr = [];
      for (var i3 = 0; i3 < 3; i3++) { var a3 = yaw + offs[i3][0], e3 = offs[i3][1]; arr.push(Math.sin(a3) * Math.cos(e3), Math.sin(e3), Math.cos(a3) * Math.cos(e3)); }
      s3 = new Float32Array(arr);
    }
    // מטאורים
    if (!reduce && stars > .8 && t > nextMet && !met) {
      met = { az: yaw + (Math.random() - .5) * view.spanX * .7, el: (.35 + Math.random() * .4) * view.spanY * .8, ang: -Math.PI / 2 + (Math.random() < .5 ? -1 : 1) * (.55 + Math.random() * .45), t0: t };
      nextMet = t + 4000 + Math.random() * 7000;
    }
    var metA = 0, metP = 0;
    if (met) { metP = (t - met.t0) / 900; if (metP > 1) met = null; else metA = Math.sin(metP * Math.PI); }
    // טחנת הרוח — זווית רציפה (לא מ-uTime שמתאפס כל 1000 שניות)
    var mill = reduce ? 0 : ((t / 1000) * .12) % TAU;
    // מטוס לילי: כל 40–90 שניות, חוצה את השמיים ב-22–34 שניות
    if (!reduce && stars > .5 && t > nextPlane && !plane) {
      var dirP = Math.random() < .5 ? -1 : 1;
      plane = { az0: yaw - dirP * view.spanX * .55, el: (.3 + Math.random() * .35) * view.spanY * .9, dir: dirP, t0: t, dur: 22000 + Math.random() * 12000 };
      nextPlane = t + 40000 + Math.random() * 50000;
    }
    var plA = 0, plAz = 0, plEl = 0;
    if (plane) { var pp = (t - plane.t0) / plane.dur; if (pp > 1) plane = null; else { plA = Math.min(1, Math.sin(pp * Math.PI) * 3); plAz = plane.az0 + plane.dir * pp * view.spanX * 1.1; plEl = plane.el; } }
    // גלגל הכוכבים: זמן כוכבים אמיתי + סיבוב נראה לעין (×120 — כחצי מעלה בשנייה; הנוף נשאר במקום)
    var lst = sidereal(toDays(ams)) + (reduce ? 0 : t / 1000 * 8.7e-3);
    lst = (lst % TAU + TAU) % TAU;
    // קריאות: הכהיה ביום + scrim באזור הכותרת (לא בלילה — שהכוכבים יישארו חדים)
    var dim = .22 * day, scrim = (.3 + .42 * day) * (1 - night * .92);
    var rays = smooth(-3 * RAD, 2 * RAD, sp.alt) * smooth(14 * RAD, 4 * RAD, sp.alt);
    // שבת/חג: מצב המועד ברגע הזה (בזמן ההלכתי של השמיים — גם באנימציית הכניסה ובדמו)
    var F = festFrame(sim, sp.alt);
    if (F.rays > rays) rays = F.rays;
    var sunUV = [.5 + wrapPi(sp.azS + Math.PI - yaw) / view.spanX, view.horV + (sp.alt - pitch) / view.spanY];

    gl.viewport(0, 0, RW, RH); gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, lutTex); gl.uniform1i(U.uLUT, 0);
    gl.uniform2f(U.uRes, RW, RH); gl.uniform2f(U.uWind, wind[0], wind[1]); gl.uniform2f(U.uLc, view.lc[0], view.lc[1]); gl.uniform2f(U.uSunUV, sunUV[0], sunUV[1]);
    gl.uniform1f(U.uYaw, yaw); gl.uniform1f(U.uPitch, pitch); gl.uniform1f(U.uSpanX, view.spanX); gl.uniform1f(U.uSpanY, view.spanY); gl.uniform1f(U.uHorV, view.horV);
    gl.uniform1f(U.uPix, view.pix); gl.uniform1f(U.uCren, view.cren);
    gl.uniform3fv(U.uSun, sun); gl.uniform3fv(U.uSunC, sunC); gl.uniform3fv(U.uSunD, td); gl.uniform3fv(U.uMoon, moon); gl.uniform3fv(U.uAmb, amb); gl.uniform3fv(U.uLand, land);
    gl.uniform3fv(U.uS3, s3 || new Float32Array(9));
    gl.uniform1f(U.uLow, smooth(16 * RAD, 0, sp.alt)); gl.uniform1f(U.uMoonV, smooth(-2 * RAD, 1 * RAD, mp.alt)); gl.uniform1f(U.uMoonF, illum);
    gl.uniform1f(U.uStars, stars); gl.uniform1f(U.uNight, night); gl.uniform1f(U.uLights, lights); gl.uniform1f(U.uDay, day);
    gl.uniform1f(U.uTime, reduce ? 0 : (t / 1000) % 1000); gl.uniform1f(U.uCover, cover); gl.uniform1f(U.uLST, lst); gl.uniform1f(U.uLat, PHI);
    gl.uniform1f(U.uMetA, metA); gl.uniform1f(U.uScrim, scrim); gl.uniform1f(U.uDim, dim); gl.uniform1f(U.uRays, rays); gl.uniform1f(U.uStar3, star3);
    gl.uniform4f(U.uMet, met ? met.az : 0, met ? met.el : 0, met ? met.ang : 0, metP);
    gl.uniform1f(U.uMill, mill); gl.uniform4f(U.uPlane, plAz, plEl, plA, 0);
    gl.uniform1f(U.uFest, F.on * F.lv); gl.uniform1f(U.uGrade, F.on * F.grade); gl.uniform1f(U.uGlowA, F.glow);
    gl.uniform1f(U.uWin, F.win); gl.uniform1f(U.uWinV, F.winV); gl.uniform1f(U.uMen, F.men); gl.uniform1f(U.uSubdue, F.subdue); gl.uniform1f(U.uWake, F.wake); gl.uniform1f(U.uFire, F.fire * (.3 + .7 * (1 - day)));
    gl.uniform3fv(U.uShadC, F.shadC); gl.uniform3fv(U.uHighC, F.high); gl.uniform3fv(U.uGlowC, F.glowC);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (F.parts > .01 || F.deco > .01) festDraw(F, t, day);

    drawn++; if (drawn === 1) firstDrawMs = Math.round(performance.now() - startedAt);
    if (!fadedIn) { fadedIn = true; cv.classList.add("lux-sky-on"); }
    // סנכרון ל-DOM: 4 פעמים בשנייה בזמן תנועה, פעם בשנייה בזמן אמת
    if (t - lastDomT > (mode === "live" ? 1000 : 250)) { lastDomT = t; syncDom(sp.alt, eve, gradeJS(zen, F), gradeJS(hs, F), day); festDom(F); }
    // רזולוציה אדפטיבית: פריימים איטיים ⇒ מקטינים את משטח הציור
    frames++; acc += dt;
    if (frames === 45) { var avg = acc / frames; frames = 0; acc = 0; if (avg > (mobile ? 40 : 26) && scale > .4) { scale = Math.max(.4, scale - .12); layout(); } }
    frameCpuMs = frameCpuMs ? frameCpuMs * .9 + (performance.now() - cpu0) * .1 : performance.now() - cpu0; // ממוצע נע של עלות ה-CPU לפריים (אבחון)
    if (oneShot) running = false;
  }

  /* ── הרצה/עצירה ── */
  function shouldRun() { return started && !nogl && html.classList.contains("lux-sky") && !document.hidden && !html.classList.contains("lux-modal-open"); }
  function startLoop() {
    if (running || !shouldRun()) return;
    running = true; lastDraw = 0;
    // חזרה אחרי השהיה ארוכה (חלון שהיה פתוח דקות) — השמש "משלימה" את הדרך ברכות ולא קופצת
    if (mode === "live" && !tw && !play && fixedMs === null && lastLiveSim && Date.now() - lastLiveSim > 20000 && !reduce) {
      tw = { from: lastLiveSim, to: Date.now(), t0: null, dur: 1400 }; mode = "intro";
    }
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
  function tick() { if (shouldRun()) startLoop(); else stopLoop(); }
  document.addEventListener("visibilitychange", tick);
  try { new MutationObserver(tick).observe(html, { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
  var reduceTimer = 0;
  // prefers-reduced-motion: פריים אחד, ועוד אחד פעם בדקה (השמש זזה)
  if (reduce) { oneShot = true; reduceTimer = setInterval(function () { if (shouldRun()) { running = false; startLoop(); } }, 60000); }

  /* ── בלי WebGL: רק שלב היום ל-CSS ── */
  var noglTimer = 0;
  function noglStart() {
    function upd() {
      try {
        var sp = sunPos(warp(Date.now())), eve = sp.azS > 0;
        var ph = sp.alt > 8 * RAD ? "day" : sp.alt > -7 * RAD ? (eve ? "dusk" : "dawn") : "night";
        if (html.dataset.sky !== ph) html.dataset.sky = ph;
        html.style.setProperty("--sky-day", smooth(-6 * RAD, 6 * RAD, sp.alt).toFixed(2));
        html.style.setProperty("--sky-glass", (0.36 + 0.28 * smooth(-6 * RAD, 6 * RAD, sp.alt)).toFixed(2));
        festDom(festFrame(Date.now(), sp.alt)); // גם בלי WebGL — הגרדיאנט ב-CSS מקבל את גוון המועד
      } catch (e) {}
    }
    upd();
    clearInterval(noglTimer); noglTimer = setInterval(upd, 60000);
  }

  /* ── אנימציית הכניסה: ממתינה לדהיית מסך הפתיחה ── */
  function waitSplash(fn) {
    var s = document.getElementById("lux-splash"), done = false;
    function go() { if (done) return; done = true; fn(); }
    if (!s || !s.isConnected || s.classList.contains("lux-splash-out")) { go(); return; }
    try {
      var mo = new MutationObserver(function () {
        if (!s.isConnected || s.classList.contains("lux-splash-out")) { mo.disconnect(); go(); }
      });
      mo.observe(s, { attributes: true, attributeFilter: ["class"] });
      if (s.parentNode) mo.observe(s.parentNode, { childList: true });
    } catch (e) { go(); return; }
    setTimeout(go, 7000);
  }

  function start() {
    if (started) { tick(); return; }
    readLoc(); buildAnchors(true);
    started = true; fadedIn = false; s3 = null; prevAms = null; tw = null; mode = "live"; startedAt = performance.now(); firstDrawMs = 0; drawn = 0;
    // דגלי דמו: ?sky=HH:MM · ?sky=play · ?fest=shabbat[&festday=1]
    try {
      var fq = new URLSearchParams(location.search), fk = fq.get("fest");
      FEST_DEMO = fk && (FEST[fk] || fk === "av9" || fk === "chol-sukkot" || fk === "chol-pesach") ? { key: fk, day: clamp(parseInt(fq.get("festday"), 10) || 0, 0, 8) } : null;
    } catch (e) {}
    try {
      var q = new URLSearchParams(location.search).get("sky");
      if (q === "play") play = { t0: dayStart(Date.now()), p0: performance.now() };
      else if (q && /^\d{1,2}:\d{2}$/.test(q)) { var hm = q.split(":"); fixedMs = dayStart(Date.now()) + (+hm[0]) * 3600000 + (+hm[1]) * 60000; }
    } catch (e) {}
    if (nogl) { html.classList.add("lux-sky-nogl"); noglStart(); return; }
    if (!cv) {
      cv = document.createElement("canvas"); cv.id = "lux-sky"; cv.setAttribute("aria-hidden", "true");
      cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); glReady = false; stopLoop(); }, false);
      cv.addEventListener("webglcontextrestored", function () { if (initGL()) tick(); else failGL(); }, false);
      document.body.appendChild(cv);
      if (!initGL()) { failGL(); return; }
    }
    layout();
    if (!reduce && fixedMs === null && !play) {
      // שלושה זמנים אחורה; ממתינים בפריים הזה עד שמסך הפתיחה נעלם, ואז נעים עד עכשיו
      sim = introStart(Date.now()); mode = "intro";
      waitSplash(function () {
        if (!started || mode !== "intro") return;
        var to = Date.now(), span = clamp((to - sim) / 86400000, 0, 1);
        tw = { from: sim, to: to, t0: null, dur: 3800 + 2800 * span };
        startLoop();
      });
    }
    tick();
  }
  function stop() {
    started = false; stopLoop(); tw = null; play = null; mode = "live";
    clearInterval(noglTimer); noglTimer = 0;
    if (cv) {
      try { if (gl) { var lc = gl.getExtension("WEBGL_lose_context"); if (lc) lc.loseContext(); } } catch (e) {}
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    }
    cv = null; gl = null; glReady = false; RW = RH = 0; fadedIn = false; domKey = ""; lastLut = null; lastLight = null;
    festReset(); festAttr = "";
    html.classList.remove("lux-sky-nogl");
    html.removeAttribute("data-sky");
    html.removeAttribute("data-fest"); html.removeAttribute("data-fest-lvl");
    ["--sky-zen", "--sky-hor", "--sky-glass", "--sky-day"].forEach(function (p) { html.style.removeProperty(p); });
  }
  // זמני היום של האתר חושבו/התעדכנו (עיר חדשה, GPS) — מעגנים מחדש
  window.addEventListener("lux-zmanim", function () { readLoc(); buildAnchors(true); });

  window.__luxSky = {
    start: start,
    stop: stop,
    // setTime(ms) מקבע את השמיים לזמן נתון (דמו/בדיקות); setTime(null) חוזר לזמן אמת
    setTime: function (ms) { fixedMs = ms === null || ms === undefined ? null : +ms; play = null; tw = null; mode = "live"; if (started) startLoop(); },
    state: function () { return { started: started, running: running, drawn: drawn, firstDrawMs: firstDrawMs, frameCpuMs: Math.round(frameCpuMs * 100) / 100, nogl: nogl, mode: mode, sim: sim, astro: warp(sim), anchors: anchors, milestones: milestones, lat: LAT, lng: LNG, scale: scale, size: [RW, RH] }; },
    // אבחון שבתות וחגים: המועד הנוכחי והציר שסביב היום
    fest: function () {
      var F = Fz, T = FT, r = function (v) { return Math.round(v * 1000) / 1000; };
      return { th: F.th, on: r(F.on), lv: r(F.lv), grade: r(F.grade), win: r(F.win), men: r(F.men), subdue: r(F.subdue), parts: r(F.parts), deco: F.decoK, attr: festAttr, demo: FEST_DEMO, glReady: fReady, broken: festBroken,
        segs: T ? T.segs.map(function (s) { return { kind: s.kind, th: s.th || s.days.map(function (d) { return d.th; }).join("+"), from: new Date(s.from).toString().slice(0, 24), to: new Date(s.to).toString().slice(0, 24) }; }) : null };
    }
  };
  if (html.classList.contains("lux-sky")) start();
})();
