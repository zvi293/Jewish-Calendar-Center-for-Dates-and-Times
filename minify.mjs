// ══════════════════════════════════════════════════════════════════════
// minify.mjs — מיזעור קוד ה-JS בזמן הבילד של Netlify (הריפו נשאר קריא).
//
// רץ אחרי build-year.mjs ו-Tailwind (ראו package.json). מצב שמרני במכוון:
//   - minifyWhitespace + minifySyntax בלבד (הסרת הערות, רווחים וקיצורי תחביר).
//   - ללא minifyIdentifiers! עשרות onclick= ב-HTML קוראים לפונקציות גלובליות
//     בשמן (openSefariaModal, downloadICS...) — שינוי שמות היה שובר אותן.
//   - charset utf8 — העברית נשארת כמות שהיא (הקבצים מוגשים כ-UTF-8).
//
// עיקרון בטיחות (כמו build-year.mjs): כל כשל ⇒ אזהרה בלבד, הקובץ נשאר
// כמות שהוא וה-exit code הוא 0 — דיפלוי לעולם לא נשבר בגלל המיזעור.
// בדיקת תקינות: הפלט חייב לעבור new Function() (פרסינג) לפני הכתיבה.
// ══════════════════════════════════════════════════════════════════════

import { transform } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";

for (const f of ["script.js", "lux.js"]) {
  try {
    const url = new URL("./" + f, import.meta.url);
    const src = readFileSync(url, "utf8");
    const out = await transform(src, {
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: false,
      charset: "utf8",
      legalComments: "none",
    });
    if (!out.code || out.code.length < src.length / 10) {
      throw new Error("suspicious output size: " + (out.code || "").length);
    }
    // אימות פרסינג — פלט שאינו JS תקין לא ייכתב לעולם
    new Function(out.code);
    writeFileSync(url, out.code);
    console.log(
      `[minify] ${f}: ${(src.length / 1024).toFixed(0)}KB → ${(out.code.length / 1024).toFixed(0)}KB`,
    );
  } catch (e) {
    console.warn(`[minify] skipped ${f} (build continues):`, e.message);
  }
}
