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
   • ממשק: window.__luxSky = { start, stop, setTime, state }.
     דגלי URL לדמו (כמו ?erev=): ?sky=HH:MM (שעה קבועה) · ?sky=play (יממה ב-60 שניות).
   • ל-CSS של השלב הבא (חלונות/פופאפים): html[data-sky=night|dawn|day|dusk],
     --sky-zen / --sky-hor (צבעי הרקיע הנוכחיים, "r,g,b"), --sky-glass
     (אטימות זכוכית מומלצת 0.36–0.64), --sky-day (0..1), והאירוע "lux-sky".
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
    "    col+=vec3(1.,.95,.85)*smoothstep(2.2*uPix,0.,d)*smoothstep(hd-.16,hd,pr)*uMetA*uStars;\n" +
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
    "    col+=uSunD*ray*exp(-rr*2.4)*uRays*.42*(1.-cloudD*.85);\n" +
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
    "  if(uLights>.01){\n" +
    "    vec2 g=vec2(azD*uLc.x,degrees(el)*uLc.y);vec2 gi=floor(g),gf=fract(g)-.5;float r=h12(gi+.7);\n" +
    "    float cl=smoothstep(.38,.62,fbm1(azD*.13+2.));\n" +
    "    float pr=(el>hn-1.8*D2R?.3:.22*exp(-depth*1.2)*(.3+cl))*cityM+.03*(1.-cityM)*cl;\n" +
    "    if(r<pr){\n" +
    "      vec3 lc=mix(vec3(1.,.68,.34),vec3(1.,.93,.8),step(pr*.55,r));\n" +
    "      nearC+=lc*smoothstep(.32,0.,length(gf*vec2(1.,1.3)))*uLights*(.75+.25*sin(uTime*1.7+r*90.));\n" +
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
    "  col=min(col,vec3(1.));\n" +
    // קריאות: הכהיה כללית ביום, ויניטה, והחשכה רכה באזור הכותרת (כמו ה-scrim בדמו)
    "  col*=1.-uDim;\n" +
    "  vec2 vq=uv-.5;col*=1.-.22*dot(vq,vq);\n" +
    "  vec2 sq=(uv-vec2(.5,.8))/vec2(.78,.42);\n" +
    "  col=mix(col,vec3(.016,.035,.094),smoothstep(.85,0.,length(sq))*uScrim);\n" +
    "  col+=(h12(gl_FragCoord.xy+fract(uTime*.37)*91.)-.5)/160.;\n" +
    "  gl_FragColor=vec4(col,1.);\n" +
    "}";

  /* ── WebGL ── */
  var cv = null, gl = null, ext = null, prog = null, lutProg = null, fb = null, lutTex = null, U = {}, UL = {};
  var glReady = false, nogl = false, started = false;
  function makeShader(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  function makeProg(fs) {
    var p = gl.createProgram();
    gl.attachShader(p, makeShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, makeShader(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "p");
    gl.linkProgram(p);
    return p;
  }
  function initGL() {
    try {
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
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
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
      "uLow", "uMoonV", "uMoonF", "uStars", "uNight", "uLights", "uDay", "uTime", "uCover", "uLST", "uLat", "uMetA", "uScrim", "uDim", "uRays", "uStar3", "uMill", "uMet", "uPlane"
    ].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    lastLut = null;
    return true;
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
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    drawn++; if (drawn === 1) firstDrawMs = Math.round(performance.now() - startedAt);
    if (!fadedIn) { fadedIn = true; cv.classList.add("lux-sky-on"); }
    // סנכרון ל-DOM: 4 פעמים בשנייה בזמן תנועה, פעם בשנייה בזמן אמת
    if (t - lastDomT > (mode === "live" ? 1000 : 250)) { lastDomT = t; syncDom(sp.alt, eve, zen, hs, day); }
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
    // דגלי דמו: ?sky=HH:MM · ?sky=play
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
    html.classList.remove("lux-sky-nogl");
    html.removeAttribute("data-sky");
    ["--sky-zen", "--sky-hor", "--sky-glass", "--sky-day"].forEach(function (p) { html.style.removeProperty(p); });
  }
  // זמני היום של האתר חושבו/התעדכנו (עיר חדשה, GPS) — מעגנים מחדש
  window.addEventListener("lux-zmanim", function () { readLoc(); buildAnchors(true); });

  window.__luxSky = {
    start: start,
    stop: stop,
    // setTime(ms) מקבע את השמיים לזמן נתון (דמו/בדיקות); setTime(null) חוזר לזמן אמת
    setTime: function (ms) { fixedMs = ms === null || ms === undefined ? null : +ms; play = null; tw = null; mode = "live"; if (started) startLoop(); },
    state: function () { return { started: started, running: running, drawn: drawn, firstDrawMs: firstDrawMs, frameCpuMs: Math.round(frameCpuMs * 100) / 100, nogl: nogl, mode: mode, sim: sim, astro: warp(sim), anchors: anchors, milestones: milestones, lat: LAT, lng: LNG, scale: scale, size: [RW, RH] }; }
  };
  if (html.classList.contains("lux-sky")) start();
})();
