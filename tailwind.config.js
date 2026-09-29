// Tailwind build configuration for the site.
// Netlify runs `npm run build` on every deploy, which recompiles tailwind.css
// from the classes actually used in the HTML files and script.js below.
// Add new pages here if you ever create more .html files.

// script.js builds a few class names dynamically (e.g. `bg-${color}-600` in the
// event-card renderer). The compiler cannot see those, so every concrete result
// must be listed in the safelist. `color` is one of these 5 values.
const dynColors = ["blue", "rose", "purple", "emerald", "slate"];
const safelist = [];
dynColors.forEach((c) => {
  safelist.push(
    `border-${c}-100`,
    `dark:border-${c}-500/20`,
    `hover:text-${c}-600`,
    `dark:hover:text-${c}-400`,
    `bg-${c}-600`,
    `bg-${c}-50`,
    `dark:bg-${c}-500/15`,
    `text-${c}-700`,
    `dark:text-${c}-300`,
    `hover:bg-${c}-50`,
    `dark:hover:bg-${c}-900/20`,
    `hover:border-${c}-200`,
    `dark:hover:border-${c}-700`,
  );
});

module.exports = {
  // hover: רק במכשירים שיש להם hover אמיתי (עכבר). בטלפון מצב hover "נדבק" אחרי נגיעה:
  // כפתור/כרטיס נשאר מודגש (טבעת, רקע) גם אחרי שהחלון שנפתח ממנו נסגר, ו"קופץ" חזרה רק
  // בנגיעה הבאה (09/2026). זו ברירת המחדל של Tailwind 4. אותו כלל ל-:hover ב-style.css.
  future: { hoverOnlyWhenSupported: true },
  darkMode: "class",
  content: [
    "./index.html",
    "./synagogues.html",
    "./credits.html",
    "./privacy.html",
    "./terms.html",
    "./script.js",
    "./lux.js",
  ],
  safelist,
  theme: { extend: {} },
  plugins: [],
};
