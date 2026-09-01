// ══════════════════════════════════════════════════════════════════════
// minify.mjs — מיזעור קוד ה-JS וה-CSS בזמן הבילד של Netlify (הריפו נשאר קריא).
//
// רץ אחרי build-year.mjs ו-Tailwind (ראו package.json). מצב שמרני במכוון:
//   JS  - minifyWhitespace + minifySyntax בלבד (הסרת הערות, רווחים וקיצורי תחביר).
//         ללא minifyIdentifiers! עשרות onclick= ב-HTML קוראים לפונקציות גלובליות
//         בשמן (openSefariaModal, downloadICS...) — שינוי שמות היה שובר אותן.
//       - מפת מקור (script.js.map / lux.js.map): נטענת רק כש-DevTools פתוח,
//         מאפשרת דיבוג בפרודקשן ומסירה את אזהרת Lighthouse "missing source map".
//   CSS - style.css ממוזער ע"י esbuild (רווחים/הערות/קיצורי ערכים בלבד; ללא
//         שינוי סדר כללים או מחיקת כללים) — ~12KB פחות בהעברה.
//   charset utf8 — העברית נשארת כמות שהיא (הקבצים מוגשים כ-UTF-8).
//
// עיקרון בטיחות (כמו build-year.mjs): כל כשל ⇒ אזהרה בלבד, הקובץ נשאר
// כמות שהוא וה-exit code הוא 0 — דיפלוי לעולם לא נשבר בגלל המיזעור.
// בדיקת תקינות JS: הפלט חייב לעבור new Function() (פרסינג) לפני הכתיבה.
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
      sourcemap: "external",
      sourcefile: f,
    });
    if (!out.code || out.code.length < src.length / 10) {
      throw new Error("suspicious output size: " + (out.code || "").length);
    }
    // אימות פרסינג — פלט שאינו JS תקין לא ייכתב לעולם
    new Function(out.code);
    let code = out.code;
    if (out.map) {
      try {
        writeFileSync(new URL("./" + f + ".map", import.meta.url), out.map);
        code += "\n//# sourceMappingURL=" + f + ".map\n";
      } catch (e) {
        console.warn(`[minify] ${f}: source map skipped:`, e.message);
      }
    }
    writeFileSync(url, code);
    console.log(
      `[minify] ${f}: ${(src.length / 1024).toFixed(0)}KB → ${(code.length / 1024).toFixed(0)}KB`,
    );
  } catch (e) {
    console.warn(`[minify] skipped ${f} (build continues):`, e.message);
  }
}

try {
  const url = new URL("./style.css", import.meta.url);
  const src = readFileSync(url, "utf8");
  const out = await transform(src, {
    loader: "css",
    minify: true,
    charset: "utf8",
    legalComments: "none",
  });
  if (!out.code || out.code.length < src.length / 10) {
    throw new Error("suspicious output size: " + (out.code || "").length);
  }
  // אזהרות של esbuild על CSS (תחביר חשוד) — לא ממזערים, שלא נאבד כלל בטעות
  if (out.warnings && out.warnings.length) {
    throw new Error(out.warnings.length + " css warnings: " + out.warnings[0].text);
  }
  writeFileSync(url, out.code);
  console.log(
    `[minify] style.css: ${(src.length / 1024).toFixed(0)}KB → ${(out.code.length / 1024).toFixed(0)}KB`,
  );
} catch (e) {
  console.warn(`[minify] skipped style.css (build continues):`, e.message);
}
