# CLAUDE.md — הלוח היהודי (jewishcalendar.co.il)

קובץ הקשר לסשן חדש. עובדות יציבות בלבד; היסטוריית תיקונים מפורטת נמצאת בזיכרון האוטומטי של Claude ובהודעות הקומיט (בעברית).

## מה זה

- אתר PWA סטטי בעברית (RTL): לוח עברי-לועזי, זמני הלכה (KosherZmanim), תפילות בשלושה נוסחים, ספרייה תורנית מספריא, הדף היומי, תהילים, בתי כנסת/מקוואות/ציונים.
- Vanilla JS + CSS, **בלי פריימוורק ובלי bundler בפיתוח**. הקבצים בריפו הם המקור הקריא; המיזעור קורה רק בבילד של Netlify.
- ייצור: `https://jewishcalendar.co.il` (Netlify). ריפו: `zvi293/Jewish-Calendar-Center-for-Dates-and-Times`, ענף `main`.
- הדומיין הישן `jewishcalendar.netlify.app` נשאר חי **בלי 301** (הפניה ב-JS בלבד) — 301 שובר את ה-scope של PWA מותקנים.

## כללי עבודה (חובה)

- **עברית בלבד** בכל טקסט למשתמש — כולל משפטי מעבר קצרים בין כלים. קוד/שמות קבצים/פקודות נשארים באנגלית.
- **אין `git push` ואין פריסה בלי אישור מפורש.** push ל-`main` = בילד ופרסום אוטומטיים תוך כ-30 שניות.
- ביצוע קל: בלי צבא סוכנים ובודקים. בדיקה קלה בדפדפן המובנה מספיקה.
- שינוי עיצוב כלל-אתרי — קודם סקיצה/אישור על קטע אחד. עיצוב מחדש מלא נדחה בעבר.
- הודעות קומיט בעברית, שורה אחת תיאורית (ראו `git log`), עם טריילר Co-Authored-By.
- ייתכן סשן נוסף שעורך את הריפו במקביל — לפני עריכה לוודא ש-`git status`/mtime יציבים.
- **פרויקט האנגלית (i18n)**: התוכנית המאושרת, ההכרעות והמצב הנוכחי נמצאים ב-`docs/i18n-plan.md`. כל סשן שנוגע בזה מתחיל מקריאתו ומסיים בעדכון סעיף "מצב נוכחי" שבו. לא להתחיל שלב 0 לפני שהמשתמש אומר במפורש.

## מפת קבצים

| קובץ | תפקיד |
|---|---|
| `index.html` | דף הבית — כל האתר בדף אחד. טוען `script.js` ו-`lux.js` דינמית אחרי ה-paint הראשון (`addScript(...)`). |
| `script.js` (~4MB) | הלוגיקה הראשית: מטמון API, זמנים, `PRAYER_DB`, קוראי ספרים, הילולות, מוצ"ש, סדר לימוד, טקסטים מוטמעים (`_SN_LOCAL_TEXTS`). |
| `lux.js` (~500KB) | שכבת חוויה "רויאל" **תוספתית**: כל פיצ'ר עטוף `safe()`/try-catch, לא משנה לוגיקה ב-`script.js`. |
| `style.css` | העיצוב. בסוף הקובץ בלוק `html.dark` שדורס צבעים — לעדכן כשמשנים תבניות innerHTML של קוראים. |
| `tailwind.css` / `tailwind.input.css` / `tailwind.config.js` | נבנה בבילד. **לא לערוך את `tailwind.css` ידנית.** |
| `fonts.css`, `fonts/` | גופנים באחסון עצמי (Assistant, Frank Ruhl Libre). |
| `sw.js` | Service Worker. `STATIC_CACHE = "moadim-static-vNNN"`, רשימת `STATIC_ASSETS` עם `?v=`. |
| `docs/i18n-plan.md` | תוכנית פרויקט האנגלית + "מצב נוכחי" (מסמך העבודה בין סשנים). חסום מהגשה ב-netlify.toml. |
| `synagogues.html` | דף בתי כנסת/מקוואות/ציונים. Leaflet מ-`vendor/`, מאגר מקומי `places/*.json`, ואז Overpass ברקע. |
| `widget.html` | ווידג'טים למסך הבית (noindex). |
| `credits.html`, `privacy.html`, `terms.html`, `404.html` | דפים סטטיים. |
| `build-year.mjs` | גלגול שנה עברית אוטומטי בבילד (סמני `LUACH-AUTO:*` ב-`index.html`, `sitemap.xml`). |
| `build-places.mjs`, `places-src/` | בניית מאגר המקומות (data.gov.il + OSM + `tzaddikim.json` ידני). כותב `PLACES_VER` ל-`synagogues.html`. |
| `minify.mjs` | מיזעור בבילד בלבד. **בלי `minifyIdentifiers`** — עשרות `onclick=` ב-HTML קוראים לפונקציות גלובליות בשמן. |
| `netlify.toml` | כותרות אבטחה, מדיניות מטמון, פרוקסי `/sefaria-api/*`, חסימת קבצי בילד (וגם `CLAUDE.md` הזה) מהגשה לגולשים. |
| `llms.txt` | תיאור לסוכני AI. **רשימת החגים בו ידנית** — לעדכן לפני כל ראש השנה. |
| `kosher-zmanim-0.9.0.min.js` | ספריית זמנים באחסון עצמי (גרסה בשם הקובץ). |
| `.well-known/assetlinks.json` | קישור לאפליקציית Android TWA. תיקיית `android/` (keystore, gradle) **מחוץ ל-git**. |
| `.claude/launch.json` | שרתי preview (`http-server`). הראשי: `site` על פורט 8123. |

## חוק הזהב: גרסאות ומטמון

**כל שינוי ב-`script.js` / `lux.js` / `style.css` מחייב `?v=` חדש — גם לבדיקה מקומית**, אחרת ה-SW מגיש קוד ישן והשינוי "לא נראה".

1. `index.html`: `script.js` ו-`lux.js` מופיעים פעמיים כל אחד (`<link rel=preload>` + `addScript(...)`), `style.css` פעם אחת (`<link rel=stylesheet>`). להעלות בכל המופעים.
2. `sw.js`: אותו `?v=` ב-`STATIC_ASSETS` (חייב להיות זהה ל-`index.html`), ולהעלות את `STATIC_CACHE` ב-1.
3. `tailwind.css?v=2` קבוע (revalidate בכל בקשה) ו-`fonts.css?v=1` — לא נוגעים.

בדיקה מהירה של המצב הנוכחי:

```bash
grep -oE '(script|lux|style)\.(js|css)\?v=[0-9]+' index.html sw.js | sort | uniq -c; grep -n 'STATIC_CACHE = ' sw.js
```

## הרצה ובדיקה

- אין צעד בילד בפיתוח. `preview_start {name: "site"}` → `http://localhost:8123`.
- **לא להריץ `npm run build` מקומית** — `minify.mjs` דורס את `script.js`/`lux.js`/`style.css` במקום, ו-`build-places.mjs` פונה לרשת. הבילד שייך ל-Netlify בלבד. אם רץ בטעות — `git checkout -- script.js lux.js style.css tailwind.css` ולמחוק את `*.src.js` ו-`*.map` שנוצרו.
- אימות אחרי push: לפתוח את האתר החי ולוודא שה-`?v=` החדש נטען (Network) וש-SW חדש הותקן.
- דגלי URL לדמו: `?erev=` (מצב ערב שבת), `?omer=` (טבעת העומר), `?season=` (מצבי רוח עונתיים).
- בקשות hebcal חייבות לכלול `mf=on` ו-`i=on` (חוה"מ, תעניות ולוח ארץ-ישראל) — לא להסיר פרמטרים מה-URL.

## ארכיטקטורה בקצרה

- **טעינה**: HTML ראשון, CSS קריטי, ואז `script.js`+`lux.js` נטענים אחרי ה-paint הראשון. רינדור בבאצ'ים, שמירת מקום ל-CLS, `scrollbar-gutter: stable` + `rel=expect` (RTL). לא לרגרס.
- **נתונים**: מועדים/זמנים מ-hebcal (מטמון ב-localStorage, מפתחות `hebcal_cache_*`, `moadim_cached_events*`), טקסטים מספריא דרך `_sefariaJson` (ישיר → fallback `/sefaria-api/` דרך Netlify), זמנים מחושבים מקומית ב-KosherZmanim.
- **אופליין**: ה-SW פונה לרשת קודם (`cache: "no-cache"`) במרוץ מול העותק השמור עם חלון זמן (`raceNetworkWithCached`); `RUNTIME_CACHE` לרשימה סגורה של מקורות חיצוניים. `_orLocal` מגיש טקסט מקומי כשהרשת נופלת.
- **localStorage**: קידומות `moadim_*` (הגדרות/עיר/נוסח/התראות), `lux_*` (שכבת lux), `sn-*` (קוראי ספרים: סימניות, נושאי כלים), `daf_show*`, `pwa_install*`. כתיבה דרך `safeCacheSetItem` (מפנה מטמון ישן כשמלא).
- **חלונות (modals/popups)**: דפוס history-safe — `pushState` בפתיחה, סגירה דרך `popstate` (`_closePopupViaBack`). נעילת גלילה עם `history.scrollRestoration = "manual"` בנעילה ו-`auto` ב-`pagehide`.
- **ספריא**: refs בלי padding (pad=0), נרמול גרשיים/גרש (״ ׳) לפני הבקשה, טקסט ספריא ≠ NFC.

## מנגנוני הגנה — אסור להסיר

- **Scroll-lock watchdog** (קיפאון גלילה) ו-**ה-X האוניברסלי** ב-`lux.js` (הסורק שמזהה ✕ בראש פאנל ובודק חפיפה עם כפתורים לפני שהוא מזיז אותו).
- **Frozen-transition reveal watchdog** (`getAnimations()` force-reveal) — בלעדיו אלמנטים "נעלמים עד רענון".
- **`_revealModalNoFreeze`** — מודאלים בלי מעבר opacity ("לא נטען").
- **כוכב נופל בנייד רק על canvas** (`__luxCanvasShoot`) — לעולם לא אלמנט DOM/WAAPI בנייד (גרם לריצוד).
- **בלי פעימות `box-shadow` בנייד**, `will-change: opacity` קבוע על כרטיסים.
- **שדות `source:` בסיפורי הבעש"ט** מוסתרים מהתצוגה בכוונה — לא למחוק ולא להחזיר.
- **סדר `TAN_BOOKS`/`TAL_BOOKS`** ב-`lux.js` קפוא (סימניות ובחירות מרובות תלויות באינדקס).
- **מנוע הגלילה האוטומטית** (`_toggleAutoScroll` ב-`script.js`, יחיד לכל הקוראים): מיקום וירטואלי עשרוני (`state.pos`) + השלמת תת-פיקסל ב-`transform` על מיכל הגלילה (`applySub`). כרומיום מעגל `scrollTop` לפיקסל המסך הקרוב — בלי המיקום הווירטואלי המהירות מנופחת ודרגות מתמזגות, ובלי ההשלמה הכתב רועד. ערכי `SPEEDS` נקבעו ע"י המשתמש — לא לשנות בלי בקשה.

## מלכודות ידועות

- **עברית**: גרש U+2019 לעומת ׳; שמות אירועים עם `Parashat`/`Erev` דורשים סינון; `normalizeEventName` הוא נקודת הכניסה.
- **`displayDate` במוצאי שבת** — להשתמש ב-`isMotzaeiShabbatNow` (שעון בפועל), לא בתאריך המוצג.
- **`applyTranslations`** מוחק ילדים — גרם להיעלמות כפתורי זמנים. לא לקרוא לו על מיכלים דינמיים.
- **CRLF/SRI**: `vendor/**`, `*.min.js`, `places/*.json` מסומנים `-text` ב-`.gitattributes`. ב-worktrees חדשים לוודא שלא הומרו.
- **חוק ID ב-CSS**: לא לשים `display` בכלל שמזהה `#id` של כפתורים עגולים (FAB) — דורס מצבי הסתרה.
- **Nominatim**: לגאוקוד רק `countrycodes=il,ps`; לסנן `religion=jewish` בלבד.
- **פונט קריאה**: נבחר דרך CSS-attribute בלבד (מפתח אחד, בסיס 25px), `lux.js` מסתנכרן — לא לפצל.
- **SEO**: אסור Event schema לחגים; `widget.html` noindex; `og-image.png` נשאר לצד ה-jpg.

## איך מוצאים דברים ב-`script.js`

הקובץ ענק; לחפש לפי כותרות סעיפים ולא לקרוא ברצף:

```bash
grep -nE '^// ✦' script.js          # כותרות פיצ'רים ראשיות
grep -nE '^(//|/\*) *═{6,}' script.js   # בלוקי הסבר ארוכים (עם ההיסטוריה של הבאג)
```

עוגנים שימושיים: `safeCacheSetItem` / `_sefariaJson` (תחילת הקובץ), `PRAYER_DB`, `computeHolidayWindow`, `normalizeEventName`, `_closePopupViaBack`, `openPrayerNavPopup`, `_SN_LOCAL_TEXTS`, `initStars`. ב-`lux.js` הכול בתוך IIFE אחת; לחפש לפי שם הפיצ'ר בעברית בהערה.

## Android (TWA)

- ה-APK/AAB נבנה ידנית עם `gradlew` בתיקיית `android/` (מחוץ ל-git, במחיצה הראשית). `assetlinks.json` צריך גם את ה-SHA של חתימת Play.
- גרסה אחרונה שפורסמה: v6 / 1.0.5 (29/09/2026).
