
        const isShabbat = displayDate.getDay() === 6 || includesAny(["Shabbat", "שבת"]) || (liveNow.getDay() === 5 && liveSunset && liveNow >= liveSunset);
        const isRoshChodesh = includesAny(["Rosh Chodesh", "ראש חודש"]);
        const isChanukah = includesAny(["Chanukah", "Hanukkah", "חנוכה"]);
        const isPurim = includesAny(["Purim", "פורים"]);
        const isPesach = includesAny(["Pesach", "Passover", "פסח"]);
        const isShavuot = includesAny(["Shavuot", "שבועות"]);
        const isSukkot = includesAny(["Sukkot", "סוכות", "Shemini Atzeret", "שמיני עצרת", "Simchat Torah", "שמחת תורה"]);
        const isYomKippur = includesAny(["Yom Kippur", "יום כיפור"]);
        const isRoshHaShana = includesAny(["Rosh Hashana", "ראש השנה"]);
        const isYamimNoraim = includesAny(["Rosh Hashana", "ראש השנה", "Yom Kippur", "יום כיפור"]);

        // ── Summer/Winter for mashiv haruach/morid hatal (SA OC 114) ──
        // Winter: Musaf Shemini Atzeret → Musaf 1st Pesach
        // Summer: Musaf 1st Pesach → Musaf Shemini Atzeret
        // Simplified: use Hebrew month. Tishrei 22+ through Nisan 14 = winter.
        const hebInfo = getHebrewSeasonInfo();
        const hMonth = hebInfo.month;
        const hDay = hebInfo.day;
        // Winter months: after Tishrei 22 (Shemini Atzeret), Cheshvan, Kislev, Tevet, Shevat, Adar, until Nisan 14
        const winterMonths = ['חשוון', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א', 'אדר ב'];
        const isTishriWinter = hMonth.includes('תשרי') && hDay >= 22;
        const isNisanPrePesach = hMonth.includes('ניסן') && hDay <= 14;
        const isWinterMonth = winterMonths.some(m => hMonth.includes(m));
        const isWinter = isTishriWinter || isWinterMonth || isNisanPrePesach;
        const isSummer = !isWinter;

        // ── Fast day detection (minor fasts) ──
        // Tzom Gedaliah: 3 Tishrei, Asara B'Tevet: 10 Tevet,
        // Ta'anit Esther: 13 Adar, 17 Tammuz: 17 Tammuz, Tisha B'Av: 9 Av
        const isTaanit = includesAny(["Fast", "Taanit", "Ta'anit", "Tzom", "צום", "תענית", "Tisha", "תשעה באב"]) ||
          (hMonth.includes('תשרי') && hDay === 3) ||
          (hMonth.includes('טבת') && hDay === 10) ||
          (hMonth.includes('אדר') && hDay === 13) ||
          (hMonth.includes('תמוז') && hDay === 17) ||
          (hMonth.includes('אב') && hDay === 9);

        // ── Tisha B'Av specifically ──
        const isTishaBeAv = includesAny(["Tisha", "תשעה באב"]) ||
          (hMonth.includes('אב') && hDay === 9);

        // ── Chol HaMoed ──
        const isCholHamoed = includesAny(["Chol HaMoed", "חול המועד"]) ||
          (isPesach && hDay >= 16 && hDay <= 20) ||
          (isSukkot && hDay >= 16 && hDay <= 21);

        // ── Yom Tov (any festival/holiday) ──
        const isYomTov = isPesach || isShavuot || isSukkot || isRoshHaShana || isYomKippur;

        // ── Extended calendar flags for explicit supplement rules ──

        // Aseret Yemei Teshuva: Tishrei 1–10 (inclusive)
        const isAseretYemeiTeshuva = hMonth.includes('תשרי') && hDay >= 1 && hDay <= 10;

        // Chol HaMoed specific: Pesach vs Sukkot
        const isCholHamoedPesach = isCholHamoed && (includesAny(["Pesach", "פסח"]) || (hMonth.includes('ניסן') && hDay >= 16 && hDay <= 20));
        const isCholHamoedSukkot = isCholHamoed && (includesAny(["Sukkot", "סוכות"]) || (hMonth.includes('תשרי') && hDay >= 16 && hDay <= 21));

        // Moadim = any festival context (Pesach, Shavuot, Sukkot, RH, YK)
        const isMoadim = isPesach || isShavuot || isSukkot || isRoshHaShana || isYomKippur;

        // Motzaei Shabbat: Saturday night (after sunset)
        // Detection: current day is Saturday and past sunset, OR Sunday very early hours
        const isMotzaeiShabbat = (() => {
          const dow = liveNow.getDay();
          if (dow === 6 && liveSunset && liveNow >= liveSunset) return true; // Sat after sunset
          if (dow === 0 && liveNow.getHours() < 3) return true; // Sun before 3am (still motzaei)
          return false;
        })();

        // Motzaei Yom Tov: night after a Yom Tov ends
        // Approximation: if yesterday was Yom Tov in events data and now is after sunset or early next day
        const isMotzaeiYomTov = (() => {
          if (isMotzaeiShabbat && isYomTov) return true; // If YT falls on Shabbat
          // Check if events mention end of holiday or if previous day context included YT
          return false; // Conservative default — can be refined with previous-day data
        })();

        // Leil Rosh Chodesh: the night of Rosh Chodesh
        // In practice, this is the evening that begins the 1st day of the month,
        // or the evening that begins the 30th day of the previous month (when RC is 2 days)
        const isLeilRoshChodesh = (() => {
          if (!isRoshChodesh) return false;
          // If it's currently after sunset or evening hours, this is leil RC
          if (liveSunset && liveNow >= liveSunset) return true;
          if (liveNow.getHours() >= 18) return true; // After 6pm as fallback
          if (liveNow.getHours() < 6) return true; // Before 6am = still night
          return false;
        })();

        return {
          displayDate, events,
          isShabbat, isRoshChodesh, isChanukah, isPurim, isPesach, isShavuot, isSukkot,
          isYomKippur, isRoshHaShana, isYamimNoraim,
          isSummer, isWinter, isTaanit, isTishaBeAv, isCholHamoed, isYomTov,
          // Extended flags
          isAseretYemeiTeshuva, isCholHamoedPesach, isCholHamoedSukkot,
          isMoadim, isMotzaeiShabbat, isMotzaeiYomTov, isLeilRoshChodesh,
        };
      }

      function buildPrayerQueries(key, context, nusachLabel) {
        const def = PRAYER_QUERY_DEFS[key];
        if (!def) return [];
        const variant = context.isShabbat && def.shabbat ? def.shabbat : def.weekday;
        return [
          `${variant} ${nusachLabel}`,
          `${nusachLabel} ${variant}`,
          `סידור ${nusachLabel} ${variant}`,
        ];
      }

      async function fetchSefariaTextRef(ref) {
        const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?lang=he&context=0&commentary=0`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Sefaria ${response.status} for ${ref}`);
        }
        const data = await response.json();
        const flatten = (value) => {
          if (Array.isArray(value)) return value.flatMap(flatten);
          if (typeof value === "string") return [value];
          return [];
        };
        const segments = flatten(data?.he || []);
        if (!segments.length) {
          throw new Error(`No Sefaria text for ${ref}`);
        }
        return {
          html: `<div class="prayer-richtext">${segments.map((segment) => `<p>${segment}</p>`).join("")}</div>`,
          sourceLabel: "Sefaria",
          sourceUrl: `https://www.sefaria.org/${encodeURIComponent(ref).replace(/%2C/g, ",")}?lang=he`,
        };
      }

      function cleanWikisourceHtml(rawHtml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, "text/html");
        doc.querySelectorAll("script,style,table,.mw-editsection,.navbox,.toc,.metadata,.noprint,sup.reference,span.mw-editsection,div.sistersitebox").forEach((node) => node.remove());
        doc.querySelectorAll("a").forEach((anchor) => {
          const span = doc.createElement("span");
          span.innerHTML = anchor.innerHTML;
          anchor.replaceWith(span);
        });
        const body = doc.body;
        return `<div class="prayer-richtext">${body.innerHTML}</div>`;
      }

      async function fetchWikisourcePrayer(query) {
        const searchUrl = `https://he.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchData = await fetch(searchUrl).then((response) => response.json());
        const title = searchData?.query?.search?.[0]?.title;
        if (!title) throw new Error(`No Wikisource result for ${query}`);
        const parseUrl = `https://he.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&formatversion=2&format=json&origin=*`;
        const parseData = await fetch(parseUrl).then((response) => response.json());
        const html = parseData?.parse?.text;
        if (!html) throw new Error(`No Wikisource HTML for ${title}`);
        return {
          html: cleanWikisourceHtml(html),
          sourceLabel: "ויקיטקסט",
          sourceUrl: `https://he.wikisource.org/wiki/${encodeURIComponent(title).replace(/%2F/g, "/")}`,
        };
      }

      function resolveSeasonalPrayerAdditions(key, context) {
        const blocks = [];
        const tefillahLike = ["shacharit", "mincha", "maariv"].includes(key);
        if (tefillahLike && context.isRoshChodesh) {
          blocks.push(`<div class="seasonal-block"><strong>ראש חודש:</strong><div>מוסיפים בתפילת העמידה ובברכת המזון את "יעלה ויבוא", ובשחרית אומרים הלל.</div></div>`);
        }
        if (tefillahLike && (context.isChanukah || context.isPurim)) {
          blocks.push(`<div class="seasonal-block"><strong>${context.isChanukah ? "חנוכה" : "פורים"}:</strong><div>מוסיפים "על הנסים" בהודאה. בחנוכה אומרים הלל שלם, ובפורים קוראים את המגילה במקומה.</div></div>`);
        }
        if (tefillahLike && (context.isPesach || context.isShavuot || context.isSukkot)) {
          blocks.push(`<div class="seasonal-block"><strong>יום טוב:</strong><div>זהו יום טוב. משתמשים בנוסח יום טוב המתאים ליום ומוסיפים "יעלה ויבוא" וכן הלל/מוסף לפי המועד.</div></div>`);
        }
        if (tefillahLike && context.isYamimNoraim) {
          blocks.push(`<div class="seasonal-block"><strong>ימים נוראים:</strong><div>מוסיפים בעמידה "זכרנו לחיים", "מי כמוך", "וכתוב לחיים" ו"בספר חיים" לפי מנהג הנוסח.</div></div>`);
        }
        if (key === "birkat-hamazon" && context.isShabbat) {
          blocks.push(`<div class="seasonal-block"><strong>שבת:</strong><div>מוסיפים בברכת המזון "רצה והחליצנו".</div></div>`);
        }
        if (key === "birkat-hamazon" && context.isRoshChodesh) {
          blocks.push(`<div class="seasonal-block"><strong>ראש חודש:</strong><div>מוסיפים בברכת המזון "יעלה ויבוא".</div></div>`);
        }
        if (key === "al-hamichya" && context.isShabbat) {
          blocks.push(`<div class="seasonal-block"><strong>שבת:</strong><div>בברכת מעין שלוש מוסיפים "ורצה והחליצנו ביום השבת הזה".</div></div>`);
        }
        if (key === "kiddush-levana") {
          blocks.push(`<div class="seasonal-block"><strong>ברכת הלבנה:</strong><div>מברכים כשהלבנה נראית ובמנהג רוב הקהילות לא בשבת ויום טוב. יש להעדיף אמירה מתוך שמחה ובלבוש מכובד.</div></div>`);
        }
        if (key === "tikkun-chatzot" && (context.isShabbat || context.isRoshHaShana || context.isYomKippur || context.isPesach || context.isShavuot || context.isSukkot)) {
          blocks.push(`<div class="seasonal-block"><strong>היום:</strong><div>ברוב הקהילות אין אומרים תיקון חצות בשבת, ימים טובים וימים שאין אומרים בהם תחנון מסוג זה.</div></div>`);
        }
        return blocks.join("");
      }

      function buildPrayerDbPayload(key, fallbackEntry) {
        if (!fallbackEntry) return null;
        const raw = fallbackEntry.nusach?.[CURRENT_NUSACH] || fallbackEntry.nusach?.mizrahi || fallbackEntry.nusach?.all || "";
        if (!raw || !raw.trim()) return null;
        if (key === "tikkun-haklali") {
          const normalized = raw.replace(/\r\n/g, "\n").trim();
          const firstChapterIndex = normalized.search(/^פרק /m);
          const afterTehillimIndex = normalized.indexOf("\nלאחר אמירת תהלים אומרים את הפסוקים:");
          const intro = firstChapterIndex >= 0 ? normalized.slice(0, firstChapterIndex).trim() : normalized;
          const chaptersText = firstChapterIndex >= 0
            ? normalized.slice(firstChapterIndex, afterTehillimIndex >= 0 ? afterTehillimIndex : normalized.length).trim()
            : "";
          const closing = afterTehillimIndex >= 0 ? normalized.slice(afterTehillimIndex).trim() : "";
          const renderParagraphBlocks = (text) => text
            .split(/\n{2,}/)
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .map((chunk) => `<p>${chunk.replace(/\n/g, "<br>")}</p>`)
            .join("");
          const chaptersHtml = chaptersText
            ? chaptersText
                .split(/\n(?=פרק )/g)
                .map((chapter, index) => `${index > 0 ? '<hr class="prayer-divider">' : ""}<p>${chapter.trim().replace(/\n/g, "<br>")}</p>`)
                .join("")
            : "";
          const introHtml = intro ? `<div class="prayer-supplement">${renderParagraphBlocks(intro)}</div>` : '';
          const closingHtml = closing ? `<div class="prayer-supplement">${renderParagraphBlocks(closing)}</div>` : '';
          return {
            html: `<div class="prayer-richtext">${introHtml}${chaptersHtml}${closingHtml}</div>`,
            sourceLabel: "מאגר פנימי",
            sourceUrl: fallbackEntry.extraLink || "",
          };
        }
        const html = raw
          .split(/\n{2,}/)
          .map((chunk) => chunk.trim())
          .filter(Boolean)
          .map((chunk) => `<p>${chunk.replace(/\n/g, "<br>")}</p>`)
          .join("");
        return {
          html: `<div class="prayer-richtext">${html}</div>`,
          sourceLabel: "מאגר פנימי",
          sourceUrl: fallbackEntry.extraLink || "",
        };
      }

      function buildAlHamichyaPayload() {
        const sections = [
          {
            title: "על המחיה",
            text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל הַמִּחְיָה. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל הַמִּחְיָה.`
          },
          {
            title: "על הגפן",
            text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַגֶּפֶן וְעַל פְּרִי הַגֶּפֶן וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל פְּרִי הַגֶּפֶן. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל פְּרִי הַגֶּפֶן.`
          },
          {
            title: "על הפירות",
            text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הָעֵץ וְעַל פְּרִי הָעֵץ וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל הַפֵּרוֹת. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל הַפֵּרוֹת.`
          },
        ];

        return {
          html: `<div class="prayer-richtext">${sections.map((section) => `
            <section style="margin-bottom:1.25rem;padding:0.9rem 1rem;border:1px solid rgba(96,165,250,0.18);border-radius:1rem;background:rgba(255,255,255,0.6);">
              <h3 style="margin-top:0;">${section.title}</h3>
              <p>${section.text}</p>
            </section>
          `).join("")}</div>`,
          sourceLabel: "מאגר פנימי מורחב",
          sourceUrl: "",
        };
      }

      function stripPrayerHtml(html) {
        const probe = document.createElement("div");
        probe.innerHTML = html || "";
        return (probe.textContent || probe.innerText || "").replace(/[\u0591-\u05C7]/g, "").replace(/\s+/g, " ").trim();
      }

      const PRAYER_INVALID_PATTERNS = {
        shacharit: [
          "דף זה מציג סידור כללי",
          "וחלקי בינתיים",
          "ראה גם",
          "נוסח המזרח באתר",
          "ראה פרק",
          "כמו שחרית",
          "המשך",
        ],
        maariv: [
          "דף זה מציג סידור כללי",
          "וחלקי בינתיים",
          "ראה גם",
          "נוסח המזרח באתר",
          "ראה פרק",
          "ראה פרק שמע ישראל",
          "כמו שחרית",
          "עמידה כמו שחרית",
        ],
        mincha: [
          "דף זה מציג סידור כללי",
          "וחלקי בינתיים",
          "ראה גם",
          "נוסח המזרח באתר",
        ],
      };

      const PRAYER_REQUIRED_MARKERS = {
        shacharit: [
          "מודה אני",
          "ברוך שאמר",
          "שמע ישראל",
          "אדני שפתי תפתח",
          "אשרי",
          "עלינו לשבח",
        ],
        maariv: [
          "מעריב ערבים",
          "שמע ישראל",
          "תשמעו אלמצותי",
          "ויאמר",
          "השכיבנו",
          "אתה חונן",
          "אדני שפתי תפתח",
          "עלינו לשבח",
        ],
        mincha: [
          "אדני שפתי תפתח",
          "עלינו לשבח",
        ],
        "birchot-hashachar": [
          "מודה אני",
        ],
        "kiddush-levana": [
          "ברכת הלבנה",
        ],
        "tikkun-chatzot": [
          "תיקון רחל",
        ],
        "birkat-hamazon": [
          "ברוך אתה",
          "הזן את הכל",
        ],
      };

      function prayerHasRequiredFlow(key, html) {
        const text = stripPrayerHtml(html);
        if (!text) return false;
        const invalidPatterns = PRAYER_INVALID_PATTERNS[key] || [];
        if (invalidPatterns.some((pattern) => text.includes(pattern))) return false;
        const requiredMarkers = PRAYER_REQUIRED_MARKERS[key] || [];
        return requiredMarkers.every((marker) => text.includes(marker));
      }

      async function fetchComposedSefariaPrayer(key, nusachKey) {
        const refs = FULL_PRAYER_SECTION_REFS[key]?.[nusachKey] || FULL_PRAYER_SECTION_REFS[key]?.mizrahi || [];
        if (!refs.length) throw new Error(`No composed refs for ${key}`);

        const sections = [];
        const failedRefs = [];
        for (const ref of refs) {
          try {
            const payload = await fetchSefariaTextRef(ref);
            if (payload?.html) sections.push(payload);
          } catch (error) {
            failedRefs.push({ ref, message: error?.message || String(error) });
            console.warn(`[prayer] composed ref failed for ${key}: ${ref}`, error);
          }
        }
        if (!sections.length) throw new Error(`No composed Sefaria sections for ${key}`);
        if (failedRefs.length) {
          console.warn(`[prayer] partial compose for ${key}`, failedRefs);
        }

        const combinedHtml = `<div class="prayer-richtext">${sections.map((section) => {
          const inner = section.html.replace(/^<div class="prayer-richtext">/, "").replace(/<\/div>$/, "");
          return inner;
        }).join("")}</div>`;

        if (!prayerHasRequiredFlow(key, combinedHtml)) {
          throw new Error(`Composed prayer still incomplete for ${key}`);
        }

        return {
          html: combinedHtml,
          sourceLabel: "Sefaria",
          sourceUrl: `https://www.sefaria.org/${encodeURIComponent(refs[0]).replace(/%2C/g, ",")}?lang=he`,
        };
      }

      /**
       * Post-process prayer HTML to wrap supplement/addition text in .prayer-supplement
       *
       * CORE RULE: Only actual prayer/bracha/Tehillim liturgical text remains primary.
       *            Everything else (instructions, intros, conditionals, minhag notes,
       *            zimun, holiday insertions, explanations) → .prayer-supplement
       *
       * SAFETY: Does NOT modify text content, reorder DOM, or remove nodes.
       *         Only adds the 'prayer-supplement' class to detected elements.
       *
       * SOURCE VERIFICATION: Detection rules verified against Sefaria, Chabad.org,
       *         Wikipedia liturgical references, and standard siddur structure.
       */
      function markPrayerSupplements(html, key) {
        if (!html) return html;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        // ══════════════════════════════════════════════════════════
        // FALSE-POSITIVE GUARD: Lines that must NEVER be supplement
        // ══════════════════════════════════════════════════════════
        function isCoreExclusion(text, el) {
          // Any line containing the bracha formula is core prayer
          if (/בָּרוּךְ אַתָּה|ברוך אתה/.test(text) && text.length > 30) return true;
          // Core Shema paragraphs
          if (/^שְׁמַע יִשְׂרָאֵל|^שמע ישראל|^וְאָהַבְתָּ|^וְהָיָה אִם|^וַיֹּאמֶר יְהֹוָה/.test(text)) return true;
          // Core Modeh Ani
          if (/^מוֹדֶה אֲנִי|^מודה אני/.test(text) && text.length > 20) return true;
          // Amidah core opening
          if (/^אֲדֹנָי שְׂפָתַי|^אדני שפתי/.test(text)) return true;
          // Psalm body text (starts with Hebrew letter + verse marker)
          if (/^[א-ת]{1,2}\s/.test(text) && /[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/.test(text)) return true;
          return false;
        }

        // ══════════════════════════════════════════════════════════
        // SUPPLEMENT DETECTION — Layered approach
        // Layer 1: Prayer-specific rules (most precise)
        // Layer 2: Universal text-pattern rules
        // ══════════════════════════════════════════════════════════
        function isSupplementText(text, el, prayerKey) {
          if (!text) return false;

          // ── LAYER 0: FALSE-POSITIVE GUARD ──
          if (isCoreExclusion(text, el)) return false;

          // ══════════════════════════════════════════
          // LAYER 1: PRAYER-SPECIFIC RULES
          // ══════════════════════════════════════════

          // ── BIRKAT HAMAZON ──
          // Source: Sefaria, Chabad.org — Structure: Shir Hamaalot → Zimun → 4 Brachot → Harachaman
          if (prayerKey === 'birkat-hamazon') {
            // Shir Hamaalot is a preamble psalm, not part of the 4 core brachot
            if (/^שִׁיר הַמַּעֲלוֹת|^שיר המעלות/.test(text)) return true;
            // Full Zimun block: leader + responses (NOT part of core 4 brachot)
            if (/^רַבּוֹתַי נְבָרֵךְ|^רבותי נברך/.test(text)) return true;
            if (/^יְהִי שֵׁם|^יהי שם/.test(text)) return true;
            if (/^בִּרְשׁוּת|^ברשות/.test(text)) return true;
            if (/^נְבָרֵךְ.*שֶׁאָכַלְנוּ|^נברך.*שאכלנו/.test(text)) return true;
            // Guest blessing
            if (/^ברכת האורח|^יְהִי רָצוֹן שֶׁלֹּא יֵבוֹשׁ/.test(text)) return true;
            // Zimun label
            if (/^זימון/.test(text)) return true;
            // Bold section titles in local DB text: "ברכה ראשונה — הזן:", etc.
            if (el && el.querySelector && el.querySelector('strong')) {
              const sText = el.querySelector('strong').textContent.trim();
              if (/^בְּרָכָה|^ברכה\s/.test(sText)) return true;
            }
            // Conditional holiday additions text
            if (/^אם המסובים|^יטול מים/.test(text)) return true;
            // "על הנסים" insertion instruction (not the actual text)
            if (/^על הנסים.*אומרים|^בחנוכה מוסיפים|^בפורים מוסיפים/.test(text)) return true;
          }

          // ── KIDDUSH LEVANA ──
          // Source: Sefaria Sanhedrin 42a, Chabad.org — Core: the bracha "ברוך אתה...מחדש חדשים"
          // Everything after the closing bracha is post-bracha additions/customs (supplement).
          // This includes: siman tov, shalom aleichem, david melech, leaping declaration, protection verses.
          if (prayerKey === 'kiddush-levana') {
            // Siman Tov (post-bracha custom, repeated 3x) — both local DB and Sefaria variants
            if (/^סִימָן טוֹב|^סימן טוב|^בְּסִימָן טוֹב|^בסימן טוב/.test(text)) return true;
            // Shalom Aleichem greeting (post-bracha custom)
            if (/^שָׁלוֹם עֲלֵיכֶם|^שלום עליכם/.test(text)) return true;
            // David Melech Yisrael (post-bracha custom)
            if (/^דָּוִד מֶלֶךְ|^דוד מלך/.test(text)) return true;
            // Leaping/dancing declaration (post-bracha custom)
            if (/^כְּשֵׁם שֶׁאֲנִי|^כשם שאני/.test(text)) return true;
            // Protection verse — Tippol (post-bracha custom)
            if (/^תִּפֹּל עֲלֵיהֶם|^תפול עליהם/.test(text)) return true;
            // Nusach-specific additions after bracha
            if (/^תהלים קמח|^\[עדות המזרח/.test(text)) return true;
            // Direction markers for repetitions
            if (/^\(ג['׳] פעמים\)|^ג['׳] פעמים/.test(text)) return true;
            // "כונניהו: שתי פעמים" instruction line
            if (/^כוננ|^שתי פעמים/.test(text)) return true;
            // Aleinu closing (some nusachim)
            if (/^עָלֵינוּ לְשַׁבֵּחַ|^עלינו לשבח/.test(text)) return true;
            // Sefaria intro text — rabbinical preface (not the prayer)
            if (/^רַבּוֹתֵינוּ זִכְרוֹנָם|^רבותינו זכרונם/.test(text)) return true;
            // Post-bracha declarations (Baruch Yotzreich etc.)
            if (/^בָּרוּךְ יוֹצְרִיךְ|^ברוך יוצריך/.test(text)) return true;
          }

          // ── TEFILLAT HADERECH ──
          // Source: Berachot 29b, standard siddurim — Core: the single bracha from יהי רצון to שומע תפלה
          // Supplements: repetition instructions, parenthetical conditionals, post-bracha verses
          if (prayerKey === 'tefillat-haderech') {
            // Parenthetical conditional within the prayer
            if (/^\(אִם חוֹזֵר|^\(אם חוזר|^\(ג['׳] פעמים\)/.test(text)) return true;
            // Repetition instruction for verses after the bracha
            if (/^ג['׳] פעמים/.test(text)) return true;
          }

          // ── TIKKUN CHATZOT ──
          // Source: Siddur Edot HaMizrach — Section headers are supplements
          if (prayerKey === 'tikkun-chatzot') {
            if (/^תיקון רחל \(|^תיקון לאה \(/.test(text)) return true;
            if (/^\*\*תיקון רחל|^\*\*תיקון לאה/.test(text)) return true;
          }

          // ══════════════════════════════════════════
          // LAYER 2: UNIVERSAL TEXT-PATTERN RULES
          // ══════════════════════════════════════════

          // ─── Bracket instructions ───
          // [בשבת], [עונים], [נוסח אשכנז...], [קיץ:], [חורף:], [לאישה:]
          if (/^\[/.test(text)) return true;

          // ─── Leshem Yichud / preparation / pre-prayer text ───
          if (/^לְשֵׁם יִחוּד|^לשם י[יי]חוד/.test(text)) return true;
          if (/^הנני מוכן|^הריני מזמן|^הריני מקשר|^הריני מוכן|^הֲרֵינִי/.test(text)) return true;
          if (/^לפני אמירת|^לאחר אמירת|^תפילה קצרה לאמרה/.test(text)) return true;

          // ─── Conditional instructions ───
          if (/^אם חל |^אם המסובים|^אם דעתו|^אם שכח|^אם שכחה/.test(text)) return true;
          if (/^בתענית אומרים|^בתענית מוסיפים/.test(text)) return true;

          // ─── Custom / minhag text ───
          if (/^יש נוהגים|^נהגו|^יש אומרים|^יש מוסיפים|^יש מקומות/.test(text)) return true;

          // ─── Explanations / commentary ───
          if (/^הסבר|^פירוש|^ביאור|^הערה:|^הע'/.test(text)) return true;

          // ─── Introduction labels ───
          if (/^הקדמה|^פתיחה|^מבוא/.test(text)) return true;

          // ─── Nusach references ───
          if (/^נוסח אשכנז|^נוסח ספרד|^נוסח עדות המזרח|^נוסח אחר/.test(text)) return true;
          if (/^ההבדל|^שאר הנוסח|^המשך —|^\[המשך/.test(text)) return true;

          // ─── Cross-references ───
          if (/^ראה פרק|^ראה גם|^עיין/.test(text)) return true;

          // ─── Direction / instruction lines (TIGHTENED — require colon or specific phrasing) ───
          if (/^אומרים שלוש|^אומרים שלש|^אומרים ג['׳]/.test(text)) return true;
          if (/^(בשבת|בראש חודש|ביום טוב|בחנוכה|בפורים|קיץ|חורף):/.test(text)) return true;
          if (/^(בימות החמה|בימות הגשמים|בימי החול|בימי חול|בעשרת ימי תשובה):/.test(text)) return true;
          // Sefaria-format liturgical directives (zimun leader/responder, gender variants, guest)
          if (/^יאמר המזמן|^והמסובים עונים|^והמזמן עונה|^האשה אומרת|^ואומר המזמן|^אורח אומר/.test(text)) return true;
          if (/^כשיאמר|^לפני הברכה יאמר|^בשבת אומרים|^ביו[''״"]{1,2}ט$|^בשבת$|^בראש חודש$/.test(text)) return true;
          // Seasonal insertion instructions (Sefaria format)
          if (/^בחנוכה ופורים|^בחנוכה אומרים|^בפורים אומרים|^ביום טוב מוסיפים|^בראש חודש מוסיפים/.test(text)) return true;

          // ─── Emoji / symbol instruction lines ───
          if (/^📌|^📜|^📖|^⚠️|^🔔/.test(text)) return true;

          // ─── Source references that are ONLY citations (short, parenthetical) ───
          if (/^\((?:תהלים|איכה|משלי|בראשית|שמות|ויקרא|במדבר|דברים|ישעיהו|ירמיהו|יחזקאל)\s/.test(text) && text.length < 80) return true;

          // ─── Bold-only section titles (structural headers, not prayer body) ───
          if (el && el.querySelector && el.querySelector('strong')) {
            const strong = el.querySelector('strong');
            const afterStrong = strong.nextSibling;
            const hasOnlyStrong = !afterStrong || (afterStrong.nodeType === 3 && !afterStrong.textContent.trim());
            if (hasOnlyStrong && text.length < 60) {
              if (/^ברכה\s|^חצי קדיש|^עמידה\s|^קדיש\s|^פסוקי דזמרה|^קריאת שמע\s|^ברכו\s|^ברכות קריאת/.test(text)) return true;
              if (/^הלל\s|^מוסף\s|^תחנון\s|^עלינו\s|^קבלת שבת|^ברכות השחר|^סדר\s/.test(text)) return true;
            }
          }

          // ─── Warning / note blocks ───
          if (/^⚠️|^הערה:|^שים לב:|^חשוב:/.test(text)) return true;

          // ─── Chapter/psalm reference lines in brackets ───
          if (/^\[תהלים\s/.test(text)) return true;

          return false;
        }

        // ── Process block-level elements inside .prayer-richtext ──
        const richTextContainers = wrapper.querySelectorAll('.prayer-richtext');
        const targetSelector = 'p, div:not(.prayer-richtext):not(.seasonal-block):not(.prayer-supplement), section';

        const containers = richTextContainers.length > 0
          ? richTextContainers
          : (wrapper.classList.contains('prayer-richtext') ? [wrapper] : [wrapper]);

        containers.forEach(container => {
          const elements = container.querySelectorAll(targetSelector);
          elements.forEach(el => {
            const text = el.textContent.trim();
            if (!text) return;

            // Skip if already wrapped in supplement or seasonal
            if (el.closest('.prayer-supplement') || el.closest('.seasonal-block')) return;
            if (el.classList.contains('prayer-supplement') || el.classList.contains('seasonal-block')) return;
            if (el.classList.contains('prayer-richtext')) return;

            if (isSupplementText(text, el, key)) {
              el.classList.add('prayer-supplement');
            }
          });
        });

        return wrapper.innerHTML;
      }

      /**
       * filterDateDependentContent(html, context)
       *
       * REMOVES date-dependent supplement content that is NOT relevant to today.
       * KEEPS date-dependent content that IS relevant (stays as supplement).
       *
       * This runs AFTER markPrayerSupplements() has already classified supplements.
       * It inspects elements with .prayer-supplement and elements containing
       * date-conditional markers, then removes those not matching today's context.
       *
       * Also handles inline seasonal markers within core paragraphs (e.g. [קיץ:] / [חורף:])
       * by surgically removing only the irrelevant line from within the paragraph.
       */
      function filterDateDependentContent(html, context) {
        if (!html) return html;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        // ── Single-element date conditions ──
        const DATE_CONDITIONS = [
          { pattern: /^\[בשבת\]|\[שבת\]|\[בשבת:/, flag: 'isShabbat' },
          { pattern: /^\[בראש חודש\]|\[ראש חודש\]/, flag: 'isRoshChodesh' },
          { pattern: /^\[ביום טוב\]|\[יום טוב\]/, flag: 'isYomTov' },
          { pattern: /^\[בחנוכה\]/, flag: 'isChanukah' },
          { pattern: /^\[בפורים\]/, flag: 'isPurim' },
          { pattern: /^\[בחול המועד\]/, flag: 'isCholHamoed' },
          { pattern: /^\[בתענית\]/, flag: 'isTaanit' },
          { pattern: /^\[קיץ:\]/, flag: 'isSummer' },
          { pattern: /^\[חורף:\]/, flag: 'isWinter' },
          { pattern: /^📌 שבת:/, flag: 'isShabbat' },
          { pattern: /^📌 ראש חודש:/, flag: 'isRoshChodesh' },
          { pattern: /^📌 חנוכה:/, flag: 'isChanukah' },
          { pattern: /^📌 פורים:/, flag: 'isPurim' },
          { pattern: /^📌 חנוכה\/פורים:/, flag: '_chanukahOrPurim' },
          { pattern: /^📌 פסח:/, flag: 'isPesach' },
          { pattern: /^📌 סוכות:/, flag: 'isSukkot' },
          { pattern: /^📌 שבועות:/, flag: 'isShavuot' },
          { pattern: /^📌 יום טוב:/, flag: 'isYomTov' },
          { pattern: /^📌 ימים נוראים:/, flag: 'isYamimNoraim' },
          { pattern: /^📌 מוצאי שבת:/, flag: 'isShabbat' },
          { pattern: /^📌 ערב יום כיפור:/, flag: 'isYomKippur' },
          { pattern: /^בשבת:/, flag: 'isShabbat' },
          { pattern: /^בראש חודש:/, flag: 'isRoshChodesh' },
          { pattern: /^ביום טוב:/, flag: 'isYomTov' },
          { pattern: /^בחנוכה:/, flag: 'isChanukah' },
          { pattern: /^בפורים:/, flag: 'isPurim' },
          { pattern: /^בתענית /, flag: 'isTaanit' },
          { pattern: /^בחנוכה ופורים/, flag: '_chanukahOrPurim' },
          { pattern: /^בחנוכה אומרים/, flag: 'isChanukah' },
          { pattern: /^בפורים אומרים/, flag: 'isPurim' },
          { pattern: /^ביום טוב מוסיפים/, flag: 'isYomTov' },
          { pattern: /^בראש חודש מוסיפים/, flag: 'isRoshChodesh' },
          { pattern: /^בחול המועד/, flag: 'isCholHamoed' },
          { pattern: /^קיץ:/, flag: 'isSummer' },
          { pattern: /^חורף:/, flag: 'isWinter' },
          { pattern: /^בימות החמה:/, flag: 'isSummer' },
          { pattern: /^בימות הגשמים:/, flag: 'isWinter' },
          { pattern: /^בעשרת ימי תשובה:/, flag: 'isYamimNoraim' },
          { pattern: /^אם חל בשבת/, flag: 'isShabbat' },
          { pattern: /^אם חל ביום טוב/, flag: 'isYomTov' },
          { pattern: /^אם חל בראש חודש/, flag: 'isRoshChodesh' },
        ];

        // ── Sefaria block headers (start multi-paragraph insertion blocks) ──
        const BLOCK_HEADERS = [
          { pattern: /^בשבת אומרים|^בשבת$|^שבת$/, flag: 'isShabbat' },
          { pattern: /^בראש חודש ובחג|^בראש חודש וביום טוב/, flag: '_roshChodeshOrYomTov' },
          { pattern: /^בראש חודש אומרים|^בראש חודש$|^בר[''״"]{1,2}ח$/, flag: 'isRoshChodesh' },
          { pattern: /^בחנוכה ובפורים|^בחנוכה ופורים מוסיפים|^בחנוכה ופורים אומרים/, flag: '_chanukahOrPurim' },
          { pattern: /^ביום טוב אומרים|^ביו[''״"]{1,2}ט$/, flag: 'isYomTov' },
          { pattern: /^בתענית אומרים|^בתענית מוסיפים|^בתענית$/, flag: 'isTaanit' },
          { pattern: /^בעשרת ימי תשובה אומרים|^בעשרת ימי תשובה$/, flag: 'isYamimNoraim' },
          { pattern: /^בר[''״"]{1,2}ה$|^ברה[''״"]{1,2}ש$/, flag: '_roshHashana' },
        ];

        function isDateRelevant(flagName) {
          if (flagName === '_chanukahOrPurim') return context.isChanukah || context.isPurim;
          if (flagName === '_roshChodeshOrYomTov') return context.isRoshChodesh || context.isYomTov;
          if (flagName === '_roshHashana') return context.isRoshHashana || false;
          return !!context[flagName];
        }

        function getDateCondition(text) {
          for (const c of DATE_CONDITIONS) { if (c.pattern.test(text)) return c; }
          return null;
        }

        function getBlockHeader(text) {
          for (const b of BLOCK_HEADERS) { if (b.pattern.test(text)) return b; }
          return null;
        }

        // Detect if a paragraph signals core prayer text resumes
        function isCoreResumeSignal(text) {
          if (/בָּרוּךְ אַתָּה|ברוך אתה/.test(text) && text.length > 30) return true;
          if (/^וְעַל הַכֹּל|^ועל הכל/.test(text)) return true;
          if (/^רַחֵם|^רחם/.test(text) && text.length > 30) return true;
          if (/^הָרַחֲמָן|^הרחמן/.test(text)) return true;
          if (/^עוֹשֶׂה שָׁלוֹם|^עושה שלום/.test(text)) return true;
          if (/^אורח אומר/.test(text)) return true;
          return false;
        }

        // ── Process elements with block-aware state machine ──
        const richText = wrapper.querySelector('.prayer-richtext') || wrapper;
        const allElements = Array.from(richText.querySelectorAll('p, div:not(.prayer-richtext):not(.seasonal-block), section'));

        let blockRemoveFlag = null;
        let blockRemoveCount = 0; // tracks paragraphs removed in current block

        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          const text = el.textContent.trim();
          if (!text) continue;
          if (el.closest('.seasonal-block') || el.classList.contains('seasonal-block')) {
            blockRemoveFlag = null;
            continue;
          }

          // Check for Sefaria block header
          const bh = getBlockHeader(text);
          if (bh) {
            if (!isDateRelevant(bh.flag)) {
              blockRemoveFlag = bh.flag;
              blockRemoveCount = 0;
              el.remove();
              continue;
            } else {
              blockRemoveFlag = null;
              if (!el.classList.contains('prayer-supplement')) el.classList.add('prayer-supplement');
              continue;
            }
          }

          // If in block removal mode
          if (blockRemoveFlag !== null) {
            const newBh = getBlockHeader(text);
            const newCond = getDateCondition(text);
            if (newBh || newCond) {
              blockRemoveFlag = null;
              // Fall through to process this element normally
            } else if (isCoreResumeSignal(text)) {
              // A core resume signal was found.
              // If we haven't removed any content paragraphs yet (just the header),
              // remove this one too — it's the content paired with the short header
              if (blockRemoveCount === 0) {
                el.remove();
                blockRemoveCount++;
                blockRemoveFlag = null; // Done with this block
                continue;
              }
              // Otherwise, core resumes — stop removal
              blockRemoveFlag = null;
              // Fall through
            } else {
              el.remove();
              blockRemoveCount++;
              continue;
            }
          }

          // Single-element date condition
          const cond = getDateCondition(text);
          if (cond) {
            if (!isDateRelevant(cond.flag)) {
              el.remove();
            } else {
              if (!el.classList.contains('prayer-supplement')) el.classList.add('prayer-supplement');
            }
            continue;
          }

          // Inline seasonal markers within paragraphs
          const innerHtml = el.innerHTML;
          if (/\[קיץ:\]|\[חורף:\]/.test(innerHtml)) {
            const lines = innerHtml.split(/<br\s*\/?>/i);
            const filteredLines = lines.filter(line => {
              const lt = line.replace(/<[^>]+>/g, '').trim();
              if (/^\[קיץ:\]/.test(lt)) return context.isSummer;
              if (/^\[חורף:\]/.test(lt)) return context.isWinter;
              return true;
            });
            if (filteredLines.length < lines.length) {
              el.innerHTML = filteredLines.join('<br>');
              el.innerHTML = el.innerHTML.replace(/^(<br\s*\/?>)+|(<br\s*\/?>)+$/gi, '');
            }
          }

          // ── Inline parenthetical holiday insertions (Sefaria Zimun format) ──
          // Sefaria wraps keywords in <b> tags: "(<b>בשבת</b> ובִרְשׁוּת...)"
          // Must check textContent for detection, then remove from innerHTML
          if (el.textContent) {
            const plainText = el.textContent;
            let html2 = el.innerHTML;
            let changed = false;

            // Helper: remove parenthetical from innerHTML given the keyword
            // Handles: (<b>keyword</b> content...) and (keyword content...)
            function removeParenthetical(keyword) {
              // Match opening paren, optional tags, keyword, anything up to closing paren
              const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const re = new RegExp('\\(<[^>]*>\\s*' + escaped + '[\\s\\S]*?\\)\\s*', 'g');
              const re2 = new RegExp('\\(' + escaped + '[^)]*\\)\\s*', 'g');
              const before = html2;
              html2 = html2.replace(re, '').replace(re2, '');
              return html2 !== before;
            }

            // Shabbat: (בשבת ...) or (כשבת ...)
            if (!context.isShabbat && /\([כב]שבת/.test(plainText)) {
              if (removeParenthetical('בשבת') || removeParenthetical('כשבת')) changed = true;
            }
            // Yom Tov: (ביו"ט ...) or (ביו''ט ...)
            if (!context.isYomTov && /\(ביו/.test(plainText)) {
              if (removeParenthetical('ביו')) changed = true;
            }
            // Sukkot: (בסוכה ...)
            if (!context.isSukkot && /\(בסוכה/.test(plainText)) {
              if (removeParenthetical('בסוכה')) changed = true;
            }
            // Rosh Chodesh: (בראש חודש ...)
            if (!context.isRoshChodesh && /\(בראש חודש/.test(plainText)) {
              if (removeParenthetical('בראש חודש')) changed = true;
            }
            // Chanukah: (בחנוכה ...)
            if (!context.isChanukah && /\(בחנוכה/.test(plainText)) {
              if (removeParenthetical('בחנוכה')) changed = true;
            }

            if (changed) {
              el.innerHTML = html2.replace(/\s{2,}/g, ' ').trim();
            }
          }
        }

        // Clean up empty elements
        wrapper.querySelectorAll('p, div').forEach(el => {
          if (!el.textContent.trim() && !el.querySelector('img, hr') && !el.classList.contains('prayer-divider')) {
            el.remove();
          }
        });

        return wrapper.innerHTML;
      }

      // ═══════════════════════════════════════════════════════════════
      // EXPLICIT SUPPLEMENT RULES — FINAL OVERRIDE LAYER
      // User-defined מלבן (always-boxed) and תאריך (date-dependent) rules.
      // This runs AFTER markPrayerSupplements + filterDateDependentContent.
      // ═══════════════════════════════════════════════════════════════

      function normalizeHebrew(text) {
        return (text || '').replace(/\u05BE/g, ' ').replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
      }

      const EXPLICIT_SUPPLEMENT_RULES = {
        'birkat-hamazon': [
          { type: 'melaben', startMatch: 'למנצח בנגינת מזמור שיר', endMatch: 'זה השלחן אשר לפני' },
          { type: 'melaben', startMatch: 'אם המסובים שלושה', endMatch: 'שאכלנו משלו ובטובו חיינו' },
          { type: 'date', flag: 'isSukkot', startMatch: 'הרחמן הוא יזכנו לישב בסכת', endMatch: 'סכת דוד הנופלת' },
          { type: 'date', flag: 'isMoadim', startMatch: 'הרחמן הוא יגיענו למועדים אחרים' },
          // להוריד — remove labels
          { type: 'remove', startMatch: 'בסוכות', singleLineOnly: true, startExact: true },
          { type: 'remove', startMatch: 'במועדים', singleLineOnly: true, startExact: true },
        ],
        'shacharit': [
          { type: 'melaben', startMatch: 'קדושה', endMatch: 'הללויה', startExact: true },
          { type: 'melaben', startMatch: 'מודים דרבנן', endMatch: 'ברוך אל ההודאות' },
          // ברכת כהנים — Mizrachi/Wikisource (has header + extended אלהינו block)
          { type: 'melaben', startMatch: 'ברכת כהנים', endMatch: 'וברך את עמך את ישראל' },
          // ברכת כהנים — Ashkenaz/Sefaria fallback (explanatory text → verses)
          { type: 'melaben', startMatch: 'הטעם שתקנו לברך את ישראל', endMatch: 'וישם לך שלום' },
          // ברכת כהנים — catches chazan prayer when no header present
          { type: 'melaben', startMatch: 'אלהינו ואלהי אבותינו ברכנו בברכה', endMatch: 'וישם לך שלום' },
          // רבון העולמים dream prayer (after ברכת כהנים, if present in nusach)
          { type: 'melaben', startMatch: 'רבון העולמים אני שלך', endMatch: 'ותרצני' },
          { type: 'melaben', startMatch: 'יש אומרים תפילת רב', endMatch: 'לטובה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'זכרנו לחיים מלך חפץ בחיים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'מי כמוך אב הרחמן', singleLineOnly: true },
          { type: 'date', flag: 'isSummer', startMatch: 'מוריד הטל', singleLineOnly: true },
          { type: 'date', flag: 'isWinter', startMatch: 'משיב הרוח ומוריד הגשם', singleLineOnly: true },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך הקדוש', singleLineOnly: true },
          { type: 'date', flag: 'isTaanit', startMatch: 'עננו אבינו עננו ביום צום התענית הזה', endMatch: 'העונה לעמו ישראל בעת צרה' },
          { type: 'date-nobox', flag: 'isSummer', startMatch: 'ברכנו יהוה אלהינו בכל מעשי ידינו', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isWinter', startMatch: 'ברך עלינו יהוה אלהינו את השנה', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך המשפט', singleLineOnly: true },
          { type: 'date', flag: 'isTaanit', startMatch: 'נוסח עננו בג', endMatch: 'פודה ומציל ועונה ומרחם בכל עת צרה וצוקה' },
          { type: 'date', flag: '_roshChodeshOrCholHamoed', startMatch: 'יעלה ויבא ויגיע ויראה', endMatch: 'כי אל מלך חנון ורחום אתה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'וכתב לחיים טובים כל בני בריתך' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'ובספר חיים ברכה ושלום' },
          { type: 'date', flag: 'isLeilRoshChodesh', startMatch: 'בליל ראש חודש יש הנוהגים' },
          { type: 'date', flag: '_motzaeiShabbatOrYomTov', startMatch: 'אתה חוננתנו יהוה אלהינו מדע', endMatch: 'המתרגשות לבא בעולם' },
          { type: 'date', flag: '_motzaeiShabbatOrYomTov', startMatch: 'לפני "שובה" יש נוהגים', endMatch: 'כל המיחלים ליהוה' },
          { type: 'date', flag: 'isTaanit', startMatch: 'ביום תענית יאמר', endMatch: 'ותרצני' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'בעשרת ימי תשובה אומר: השלום' },
          // כתב שחסר — inject missing Amidah texts if not present
          { type: 'inject', anchorMatch: 'המלך הקדוש', position: 'after', injectText: 'אתה קדוש ושמך קדוש וקדושים בכל יום יהללוך סלה. ברוך אתה יהוה האל הקדוש.', checkNotExists: 'אתה קדוש ושמך קדוש' },
          { type: 'inject', anchorMatch: 'ברוך אל ההודאות', position: 'after', injectText: 'ועל כולם יתברך ויתרומם שמך מלכנו תמיד לעולם ועד.', checkNotExists: 'ועל כולם יתברך' },
          { type: 'inject', anchorMatch: 'יהיו לרצון אמרי פי', position: 'after', injectText: 'עושה שלום במרומיו הוא יעשה שלום עלינו ועל כל ישראל ואמרו אמן.', checkNotExists: 'עושה שלום במרומיו' },
          // להוריד — remove labels
          { type: 'remove', startMatch: 'בקיץ:', singleLineOnly: true },
          { type: 'remove', startMatch: 'בחורף:', singleLineOnly: true },
        ],
        'mincha': [
          { type: 'melaben', startMatch: 'קדושה', endMatch: 'הללויה', startExact: true },
          { type: 'melaben', startMatch: 'מודים דרבנן', endMatch: 'ברוך אל ההודאות' },
          // ברכת כהנים — Mizrachi/Wikisource (has header + extended אלהינו block)
          { type: 'melaben', startMatch: 'ברכת כהנים', endMatch: 'וברך את עמך את ישראל' },
          // ברכת כהנים — Ashkenaz/Sefaria fallback (explanatory text → verses)
          { type: 'melaben', startMatch: 'הטעם שתקנו לברך את ישראל', endMatch: 'וישם לך שלום' },
          // ברכת כהנים — catches chazan prayer when no header present
          { type: 'melaben', startMatch: 'אלהינו ואלהי אבותינו ברכנו בברכה', endMatch: 'וישם לך שלום' },
          // רבון העולמים dream prayer (after ברכת כהנים, if present in nusach)
          { type: 'melaben', startMatch: 'רבון העולמים אני שלך', endMatch: 'ותרצני' },
          { type: 'melaben', startMatch: 'לשם יחוד קודשא בריך הוא', endMatch: 'כוננהו' },
          { type: 'melaben', startMatch: 'הרוצה להתענות תענית יחיד', endMatch: 'שומע תפלה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'זכרנו לחיים מלך חפץ בחיים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'מי כמוך אב הרחמן', singleLineOnly: true },
          { type: 'date', flag: 'isSummer', startMatch: 'מוריד הטל', singleLineOnly: true },
          { type: 'date', flag: 'isWinter', startMatch: 'משיב הרוח ומוריד הגשם', singleLineOnly: true },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך הקדוש', singleLineOnly: true },
          { type: 'date', flag: 'isTaanit', startMatch: 'עננו אבינו עננו ביום צום התענית הזה', endMatch: 'העונה לעמו ישראל בעת צרה' },
          { type: 'date-nobox', flag: 'isSummer', startMatch: 'ברכנו יהוה אלהינו בכל מעשי ידינו', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isWinter', startMatch: 'ברך עלינו יהוה אלהינו את השנה', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך המשפט', singleLineOnly: true },
          { type: 'date', flag: 'isTaanit', startMatch: 'נוסח עננו בג', endMatch: 'פודה ומציל ועונה ומרחם בכל עת צרה וצוקה' },
          { type: 'date', flag: '_roshChodeshOrCholHamoed', startMatch: 'יעלה ויבא ויגיע ויראה', endMatch: 'כי אל מלך חנון ורחום אתה' },
          { type: 'date', flag: 'isTishaBeAv', startMatch: 'נחם יהוה אלהינו', endMatch: 'בונה ירושלים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'וכתב לחיים טובים כל בני בריתך' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'ובספר חיים ברכה ושלום' },
          { type: 'date', flag: 'isTaanit', startMatch: 'ביום תענית יאמר', endMatch: 'ותרצני' },
          { type: 'date', flag: 'isTaanit', startMatch: 'תפילה לעני כי יעטף', endMatch: 'הללויה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'בעשרת ימי תשובה אומר: השלום' },
          // כתב שחסר — inject missing Amidah texts if not present
          { type: 'inject', anchorMatch: 'המלך הקדוש', position: 'after', injectText: 'אתה קדוש ושמך קדוש וקדושים בכל יום יהללוך סלה. ברוך אתה יהוה האל הקדוש.', checkNotExists: 'אתה קדוש ושמך קדוש' },
          { type: 'inject', anchorMatch: 'ברוך אל ההודאות', position: 'after', injectText: 'ועל כולם יתברך ויתרומם שמך מלכנו תמיד לעולם ועד.', checkNotExists: 'ועל כולם יתברך' },
          { type: 'inject', anchorMatch: 'יהיו לרצון אמרי פי', position: 'after', injectText: 'עושה שלום במרומיו הוא יעשה שלום עלינו ועל כל ישראל ואמרו אמן.', checkNotExists: 'עושה שלום במרומיו' },
          // להוריד — remove labels
          { type: 'remove', startMatch: 'קדושה', singleLineOnly: true, startExact: true },
          { type: 'remove', startMatch: 'בקיץ:', singleLineOnly: true },
          { type: 'remove', startMatch: 'בחורף:', singleLineOnly: true },
        ],
        'maariv': [
          { type: 'melaben', startMatch: 'לשם יחוד קודשא בריך הוא', endMatch: 'ביום קראנו' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'זכרנו לחיים מלך חפץ בחיים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'מי כמוך אב הרחמן', singleLineOnly: true },
          { type: 'date', flag: 'isSummer', startMatch: 'מוריד הטל', singleLineOnly: true },
          { type: 'date', flag: 'isWinter', startMatch: 'משיב הרוח ומוריד הגשם', singleLineOnly: true },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך הקדוש', singleLineOnly: true },
          { type: 'date-nobox', flag: 'isSummer', startMatch: 'ברכנו יהוה אלהינו בכל מעשי ידינו', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isWinter', startMatch: 'ברך עלינו יהוה אלהינו את השנה', endMatch: 'מברך השנים' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'המלך המשפט', singleLineOnly: true },
          { type: 'date', flag: '_roshChodeshOrCholHamoed', startMatch: 'יעלה ויבא ויגיע ויראה', endMatch: 'כי אל מלך חנון ורחום אתה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'וכתב לחיים טובים כל בני בריתך' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'ובספר חיים ברכה ושלום' },
          { type: 'date', flag: '_motzaeiShabbatOrYomTov', startMatch: 'אתה חוננתנו יהוה אלהינו מדע', endMatch: 'המתרגשות לבא בעולם' },
          { type: 'date', flag: '_motzaeiShabbatOrYomTov', startMatch: 'במוצאי שבת ויום טוב אומרים', endMatch: 'המתרגשות לבא בעולם' },
          { type: 'date', flag: '_motzaeiShabbatOrYomTov', startMatch: 'לפני "שובה" יש נוהגים', endMatch: 'כל המיחלים ליהוה' },
          // ברכי נפשי — full psalm 104 for leil Rosh Chodesh
          { type: 'date', flag: 'isLeilRoshChodesh', startMatch: 'בליל ראש חודש יש הנוהגים', endMatch: 'הללויה' },
          { type: 'date', flag: 'isLeilRoshChodesh', startMatch: 'ברכי נפשי את יהוה', endMatch: 'הללויה' },
          { type: 'date', flag: 'isTishaBeAv', startMatch: 'עננו אבינו עננו ביום צום התענית הזה', endMatch: 'העונה לעמו ישראל בעת צרה' },
          { type: 'date', flag: 'isAseretYemeiTeshuva', startMatch: 'בעשרת ימי תשובה אומר: השלום' },
          // כתב שחסר — inject missing Amidah texts if not present
          { type: 'inject', anchorMatch: 'המלך הקדוש', position: 'after', injectText: 'אתה קדוש ושמך קדוש וקדושים בכל יום יהללוך סלה. ברוך אתה יהוה האל הקדוש.', checkNotExists: 'אתה קדוש ושמך קדוש' },
          { type: 'inject', anchorMatch: 'ובספר חיים ברכה ושלום', position: 'after', injectText: 'ועל כולם יתברך ויתרומם שמך מלכנו תמיד לעולם ועד.', checkNotExists: 'ועל כולם יתברך' },
          { type: 'inject', anchorMatch: 'יהיו לרצון אמרי פי', position: 'after', injectText: 'עושה שלום במרומיו הוא יעשה שלום עלינו ועל כל ישראל ואמרו אמן.', checkNotExists: 'עושה שלום במרומיו' },
          // להוריד — remove labels
          { type: 'remove', startMatch: 'בקיץ:', singleLineOnly: true },
          { type: 'remove', startMatch: 'בחורף:', singleLineOnly: true },
        ],
        'kiddush-levana': [
          { type: 'melaben', startMatch: 'לפני הברכה יאמר', endMatch: 'שתי פעמים' },
          { type: 'melaben', startMatch: 'לשם יחוד קודשא בריך הוא', endMatch: 'כוננהו' },
        ],
        'tikkun-chatzot': [
          { type: 'melaben', startMatch: 'אין אומרים תיקון חצות בליל שבת', endMatch: 'אומרים תיקון רחל' },
          { type: 'melaben', startMatch: 'לשם יחוד קודשא בריך הוא', endMatch: 'כוננהו' },
        ],
      };

      function applyExplicitRules(html, key, context) {
        if (!html) return html;
        const rules = EXPLICIT_SUPPLEMENT_RULES[key];
        if (!rules || rules.length === 0) return html;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        const richText = wrapper.querySelector('.prayer-richtext') || wrapper;
        const allEls = Array.from(richText.querySelectorAll('p, div:not(.prayer-richtext):not(.seasonal-block), section'));
        const elTexts = allEls.map(el => normalizeHebrew(el.textContent));

        function resolveFlag(flag) {
          if (flag === '_roshChodeshOrCholHamoed') return context.isRoshChodesh || context.isCholHamoed;
          if (flag === '_motzaeiShabbatOrYomTov') return context.isMotzaeiShabbat || context.isMotzaeiYomTov;
          if (flag === '_chanukahOrPurim') return context.isChanukah || context.isPurim;
          if (flag === '_roshChodeshOrYomTov') return context.isRoshChodesh || context.isYomTov;
          return !!context[flag];
        }

        function findElIndex(substring, fromIndex) {
          const norm = normalizeHebrew(substring);
          for (let i = (fromIndex || 0); i < elTexts.length; i++) {
            if (elTexts[i].includes(norm)) return i;
          }
          return -1;
        }

        function findExactElIndex(substring, fromIndex) {
          const norm = normalizeHebrew(substring);
          for (let i = (fromIndex || 0); i < elTexts.length; i++) {
            if (elTexts[i] === norm) return i;
          }
          return -1;
        }

        for (const rule of rules) {
          // Handle inject rules: insert missing text after an anchor element
          if (rule.type === 'inject') {
            const checkNorm = normalizeHebrew(rule.checkNotExists || rule.injectText);
            const alreadyExists = elTexts.some(t => t.includes(checkNorm));
            if (!alreadyExists) {
              const anchorIdx = rule.anchorExact ? findExactElIndex(rule.anchorMatch) : findElIndex(rule.anchorMatch);
              if (anchorIdx !== -1) {
                const anchor = allEls[anchorIdx];
                if (anchor && anchor.parentNode) {
                  const newEl = document.createElement('p');
                  newEl.textContent = rule.injectText;
                  if (rule.position === 'before') {
                    anchor.parentNode.insertBefore(newEl, anchor);
                  } else {
                    anchor.parentNode.insertBefore(newEl, anchor.nextSibling);
                  }
                }
              }
            }
            continue;
          }

          let startIdx = rule.startExact ? findExactElIndex(rule.startMatch) : findElIndex(rule.startMatch);
          if (startIdx === -1) continue;

          let endIdx = startIdx;
          if (rule.endMatch && !rule.singleLineOnly) {
            const foundEnd = findElIndex(rule.endMatch, startIdx);
            if (foundEnd !== -1) endIdx = foundEnd;
          }

          const isRelevant = rule.type === 'melaben' || resolveFlag(rule.flag);

          for (let i = startIdx; i <= endIdx; i++) {
            const el = allEls[i];
            if (!el || !el.parentNode) continue;

            if (rule.type === 'melaben') {
              if (!el.classList.contains('prayer-supplement')) el.classList.add('prayer-supplement');
            } else if (rule.type === 'date') {
              if (isRelevant) {
                if (!el.classList.contains('prayer-supplement')) el.classList.add('prayer-supplement');
              } else {
                el.remove();
              }
            } else if (rule.type === 'date-nobox') {
              if (!isRelevant) {
                el.remove();
              }
              // When relevant: leave as regular text (no supplement class)
            } else if (rule.type === 'remove') {
              el.remove();
            }
          }
        }

        // Clean up empty elements
        wrapper.querySelectorAll('p, div').forEach(el => {
          if (!el.textContent.trim() && !el.querySelector('img, hr') && !el.classList.contains('prayer-divider')) {
            el.remove();
          }
        });

        return wrapper.innerHTML;
      }

      async function getFullPrayerContent(key) {
        const nusach = resolveSelectedNusach();
        const context = resolveSeasonalPrayerContext();
        const cacheKey = JSON.stringify({ key, nusach: nusach.key, shabbat: context.isShabbat, flags: context.events });
        if (PRAYER_HTML_CACHE.has(cacheKey)) return PRAYER_HTML_CACHE.get(cacheKey);

        const fallbackEntry = PRAYER_DB[key];
        const sourcePriority = PRAYER_SOURCE_PRIORITY[key] || "wikisource-first";
        const attempts = [];
        if (key === "al-hamichya") {
          attempts.push(() => buildAlHamichyaPayload());
        }
        if (sourcePriority === "full-sefaria-compose") {
          attempts.push(() => fetchComposedSefariaPrayer(key, nusach.key));
        }
        if (sourcePriority === "local-first") {
          attempts.push(() => buildPrayerDbPayload(key, fallbackEntry));
        }

        const refs = SEFARIA_PRAYER_REFS[key]?.[nusach.key]?.weekday || SEFARIA_PRAYER_REFS[key]?.mizrahi?.weekday || [];
        const pushSefariaRefs = () => {
          refs.forEach((ref) => {
            attempts.push(() => fetchSefariaTextRef(ref));
          });
        };
        const pushWikisourceQueries = () => {
          buildPrayerQueries(key, context, nusach.label).forEach((query) => {
            attempts.push(() => fetchWikisourcePrayer(query));
          });
        };

        if (sourcePriority === "full-sefaria-compose") {
          pushSefariaRefs();
          pushWikisourceQueries();
        } else if (sourcePriority === "sefaria-first") {
          pushSefariaRefs();
          pushWikisourceQueries();
        } else if (sourcePriority !== "local-first" && key !== "al-hamichya") {
          pushWikisourceQueries();
          pushSefariaRefs();
        } else {
          pushWikisourceQueries();
          pushSefariaRefs();
        }

        if (sourcePriority !== "local-first" && key !== "al-hamichya") {
          attempts.push(() => buildPrayerDbPayload(key, fallbackEntry));
        }
        let result = null;
        for (const attempt of attempts) {
          try {
            result = await attempt();
            if (result?.html) {
              if ((key === "shacharit" || key === "maariv") && !prayerHasRequiredFlow(key, result.html)) {
                continue;
              }
              break;
            }
          } catch (error) {}
        }

        if (!result && sourcePriority === "local-first") {
          result = buildPrayerDbPayload(key, fallbackEntry);
        }

        if (!result) {
          throw new Error(`Prayer source unavailable for ${key}`);
        }

        const payload = {
          ...result,
          html: applyExplicitRules(filterDateDependentContent(markPrayerSupplements(result.html, key), context), key, context),
          nusachLabel: nusach.label,
          seasonalHtml: resolveSeasonalPrayerAdditions(key, context),
        };
        PRAYER_HTML_CACHE.set(cacheKey, payload);
        return payload;
      }

      // --- Font Size Controls for Prayers/Modals ---
      const FONT_SIZE_KEY = 'moadim_prayer_font_size';
      let _prayerFontSize = parseInt(localStorage.getItem(FONT_SIZE_KEY) || '100', 10);

      function createFontSizeBar(targetSelector) {
        const bar = document.createElement('div');
        bar.className = 'font-size-bar';
        bar.style.cssText = 'position:sticky;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:0.6rem 1rem;background:rgba(250,249,246,0.95);backdrop-filter:blur(8px);border-top:1px solid rgba(0,0,0,0.08);z-index:10;flex-shrink:0;';
        bar.innerHTML = `
          <button onclick="changePrayerFontSize(-10, '${targetSelector}')" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);background:rgba(0,0,0,0.04);color:#334155;font-size:1.2rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="הקטן כתב">−</button>
          <span class="font-size-label" style="font-size:0.78rem;font-weight:700;color:#64748b;min-width:3rem;text-align:center;">${_prayerFontSize}%</span>
          <button onclick="changePrayerFontSize(10, '${targetSelector}')" style="width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);background:rgba(0,0,0,0.04);color:#334155;font-size:1.2rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="הגדל כתב">+</button>
        `;
        return bar;
      }

      function changePrayerFontSize(delta, targetSelector) {
        _prayerFontSize = Math.max(70, Math.min(180, _prayerFontSize + delta));
        localStorage.setItem(FONT_SIZE_KEY, _prayerFontSize);
        applyPrayerFontSize(targetSelector);
        // Update label
        document.querySelectorAll('.font-size-label').forEach(el => { el.textContent = _prayerFontSize + '%'; });
      }

      function applyPrayerFontSize(targetSelector) {
        const targets = document.querySelectorAll(targetSelector);
        targets.forEach(el => {
          el.style.fontSize = (_prayerFontSize / 100) + 'em';
        });
      }

      function closePrayerModal() {
        const el = document.getElementById('prayer-modal');
        if (el) el.remove();
        unlockBodyScroll();
        if (_activeModals[_activeModals.length - 1] === 'prayer-modal') {
          _activeModals.pop();
          history.back();
        }
      }
      function closeTehillimModal() {
        const el = document.getElementById('tehillim-modal');
        if (el) el.remove();
        unlockBodyScroll();
        if (_activeModals[_activeModals.length - 1] === 'tehillim-modal') {
          _activeModals.pop();
          history.back();
        }
      }

      function renderPrayerModalShell(title, isPopup) {
        let existing = document.getElementById("prayer-modal");
        if (existing) existing.remove();
        const modal = document.createElement("div");
        modal.id = "prayer-modal";
        if (isPopup) {
          modal.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;";
          modal.innerHTML = `
            <div class="modal-inner" style="background:#faf9f6;border:1px solid rgba(0,0,0,0.1);border-radius:2rem;padding:1.5rem;width:100%;max-width:760px;max-height:min(88vh,980px);margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.2);text-align:right;direction:rtl;display:flex;flex-direction:column;overflow:hidden;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                <h3 class="modal-title" style="color:#000000;font-size:1.4rem;font-weight:900;margin:0;">${title}</h3>
                <button class="modal-close" onclick="closePrayerModal()" style="background:rgba(0,0,0,0.06);border:none;color:#64748b;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
              </div>
              <div id="prayer-modal-meta" style="color:#64748b;font-size:0.75rem;margin-bottom:1rem;">טוען נוסח מלא…</div>
              <div id="prayer-modal-body" class="prayer-modal-body-mobile" style="background:rgba(0,0,0,0.02);border-radius:1rem;min-height:240px;flex:1;overflow:hidden;display:flex;flex-direction:column;">
                <div style="text-align:center;padding:2rem;color:#94a3b8;">טוען טקסט מלא ממקור זמין…</div>
              </div>
            </div>`;
          modal.addEventListener("click", (event) => {
            if (event.target === modal) closePrayerModal();
          });
        } else {
          modal.style.cssText = "position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;overflow:hidden;background:#faf9f6;";
          modal.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem 0.75rem;border-bottom:1px solid rgba(0,0,0,0.08);flex-shrink:0;background:#faf9f6;">
              <div>
                <h2 style="color:#1a1a1a;font-size:1.3rem;font-weight:900;margin:0;">${title}</h2>
                <div id="prayer-modal-meta" style="color:#64748b;font-size:0.75rem;margin-top:0.15rem;">טוען נוסח מלא…</div>
              </div>
              <button onclick="closePrayerModal()" style="background:rgba(0,0,0,0.06);border:none;color:#64748b;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.1rem;flex-shrink:0;">✕</button>
            </div>
            <div id="prayer-modal-body" class="prayer-modal-body-mobile" style="flex:1;overflow-y:auto;background:#faf9f6;text-align:right;direction:rtl;">
              <div style="text-align:center;padding:2rem;color:#94a3b8;">טוען טקסט מלא ממקור זמין…</div>
            </div>`;
        }
        document.body.appendChild(modal);
        // Add font size bar to full-screen modals
        if (!isPopup) {
          modal.appendChild(createFontSizeBar('.holy-text-style'));
          applyPrayerFontSize('.holy-text-style');
        }
        return modal;
      }

      // --- First-time Nusach Selection ---
      const NUSACH_CHOSEN_KEY = 'moadim_nusach_chosen';
      function showNusachSelectionPopup(callback) {
        let existing = document.getElementById("nusach-selection-modal");
        if (existing) existing.remove();
        const overlay = document.createElement("div");
        overlay.id = "nusach-selection-modal";
        overlay.style.cssText = "position:fixed;inset:0;z-index:250;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
        const nusachOptions = Object.entries(NUSACH_LABELS).map(([k, v]) =>
          `<button onclick="window._selectNusachAndContinue('${k}')" style="width:100%;padding:0.85rem 1rem;border-radius:0.9rem;border:2px solid ${k === CURRENT_NUSACH ? '#2563eb' : 'rgba(0,0,0,0.1)'};background:${k === CURRENT_NUSACH ? 'rgba(37,99,235,0.08)' : 'rgba(0,0,0,0.02)'};color:#1a1a1a;font-size:1.05rem;font-weight:800;cursor:pointer;transition:all 0.15s;">${v}</button>`
        ).join("");
        overlay.innerHTML = `
          <div style="background:#faf9f6;border-radius:1.5rem;padding:1.8rem 1.5rem;width:100%;max-width:380px;box-shadow:0 25px 60px rgba(0,0,0,0.25);text-align:center;direction:rtl;">
            <div style="font-size:2rem;margin-bottom:0.5rem;">🕎</div>
            <h3 style="color:#1a1a1a;font-size:1.25rem;font-weight:900;margin:0 0 0.4rem;">בחירת נוסח תפילה</h3>
            <p style="color:#64748b;font-size:0.85rem;margin:0 0 1.2rem;line-height:1.5;">בחר את הנוסח שלך. ניתן לשנות בכל עת בהגדרות.</p>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">${nusachOptions}</div>
          </div>`;
        window._selectNusachAndContinue = (nusach) => {
          CURRENT_NUSACH = nusach;
          localStorage.setItem("moadim_nusach", nusach);
          localStorage.setItem(NUSACH_CHOSEN_KEY, "true");
          // Update settings dropdown if visible
          const nusachEl = document.getElementById("nusach-select");
          if (nusachEl) nusachEl.value = nusach;
          overlay.remove();
          if (callback) callback();
        };
        document.body.appendChild(overlay);
      }

      function ensureNusachChosen(callback) {
        if (localStorage.getItem(NUSACH_CHOSEN_KEY)) {
          callback();
        } else {
          showNusachSelectionPopup(callback);
        }
      }

      openPrayer = async function(key, heLabel, enLabel) {
        const doOpen = async () => {
        window._currentPrayerKey = key; // Track active prayer key for MutationObserver
        const entry = PRAYER_DB[key] || { title: heLabel || enLabel || key };
        const isPopup = false;
        renderPrayerModalShell(entry.title || heLabel || enLabel || key, isPopup);
        lockBodyScroll();
        pushModalState('prayer-modal');
        try {
          const content = await getFullPrayerContent(key);
          const meta = document.getElementById("prayer-modal-meta");
          const body = document.getElementById("prayer-modal-body");
          if (meta) {
            if (isPopup) {
              meta.innerHTML = `נוסח: <strong>${content.nusachLabel}</strong> · מקור: <strong>${content.sourceLabel}</strong>${content.sourceUrl ? ` · <a href="${content.sourceUrl}" target="_blank" style="color:#1d4ed8;">פתיחת המקור</a>` : ""}`;
            } else {
              meta.innerHTML = `נוסח: <strong>${content.nusachLabel}</strong> · מקור: <strong>${content.sourceLabel}</strong>${content.sourceUrl ? ` · <a href="${content.sourceUrl}" target="_blank" style="color:#3b82f6;">פתיחת המקור</a>` : ""}`;
            }
          }
          if (body) {
            if (isPopup) {
              body.innerHTML = `
                <div style="display:flex;flex-direction:column;min-height:0;max-height:100%;height:100%;">
                  <div class="holy-text-style" style="flex:1;min-height:0;overflow-y:auto;padding-inline-end:0.35rem;padding-bottom:0.35rem;direction:rtl;text-align:right;">
                    ${content.seasonalHtml}
                    ${content.html}
                  </div>
                  <div style="border-top:1px solid rgba(0,0,0,0.08);margin-top:0.85rem;padding-top:0.75rem;color:#94a3b8;font-size:0.72rem;text-align:center;">
                    מקור התוכן: <strong>${content.sourceLabel}</strong>${content.sourceUrl ? ` · <a href="${content.sourceUrl}" target="_blank" style="color:#1d4ed8;">קישור למקור</a>` : ""}
                  </div>
                </div>`;
            } else {
              body.innerHTML = `
                <div class="holy-text-style" style="direction:rtl;text-align:right;">
                  ${content.seasonalHtml ? '<div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.18);border-radius:0.75rem;padding:0.7rem 0.85rem;margin-bottom:1.25rem;font-size:0.82em;color:#1e40af;line-height:1.65;border-right:3px solid rgba(37,99,235,0.4);">' + content.seasonalHtml + '</div>' : ''}
                  ${content.html}
                </div>
                <div style="border-top:1px solid rgba(0,0,0,0.08);margin-top:1.5rem;padding-top:0.75rem;color:#94a3b8;font-size:0.72rem;text-align:center;">
                  מקור התוכן: <strong>${content.sourceLabel}</strong>${content.sourceUrl ? ` · <a href="${content.sourceUrl}" target="_blank" style="color:#3b82f6;">קישור למקור</a>` : ""}
                </div>`;
            }
          }
        } catch (error) {
          const body = document.getElementById("prayer-modal-body");
          const meta = document.getElementById("prayer-modal-meta");
          if (meta) {
            meta.textContent = "לא הצלחתי לטעון נוסח מלא כעת.";
          }
          if (body) {
            body.innerHTML = `<div class="prayer-richtext"><p>אירעה שגיאה בטעינת התפילה. אפשר לנסות שוב בעוד רגע.</p></div>`;
          }
        }
        };
        ensureNusachChosen(doOpen);
      };

      // ── MutationObserver: re-run supplement detection on dynamically loaded content ──
      (function initPrayerSupplementObserver() {
        const OBSERVED_IDS = ['prayer-modal-body', 'sefaria-modal-content'];
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type !== 'childList' || !mutation.addedNodes.length) continue;
            const target = mutation.target;
            // Only process if inside one of the observed containers
            const container = OBSERVED_IDS.some(id => {
              const el = document.getElementById(id);
              return el && (el === target || el.contains(target));
            });
            if (!container) continue;
            // Find .prayer-richtext elements in added nodes and re-process
            mutation.addedNodes.forEach(node => {
              if (node.nodeType !== 1) return; // Element nodes only
              const rtContainers = node.classList && node.classList.contains('prayer-richtext')
                ? [node]
                : (node.querySelectorAll ? node.querySelectorAll('.prayer-richtext') : []);
              rtContainers.forEach(rt => {
                // Determine prayer key from closest modal context (best-effort)
                const currentKey = window._currentPrayerKey || '';
                const ctx = resolveSeasonalPrayerContext();
                let processed = markPrayerSupplements(rt.outerHTML, currentKey);
                processed = filterDateDependentContent(processed, ctx);
                processed = applyExplicitRules(processed, currentKey, ctx);
                if (processed !== rt.outerHTML) {
                  const temp = document.createElement('div');
                  temp.innerHTML = processed;
                  const newRt = temp.firstElementChild;
                  if (newRt) rt.replaceWith(newRt);
                }
              });
            });
          }
        });
        // Start observing once DOM is ready
        const startObserving = () => {
          OBSERVED_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el, { childList: true, subtree: true });
          });
          // Also observe body for when these containers are dynamically created
          observer.observe(document.body, { childList: true, subtree: false });
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', startObserving);
        } else {
          startObserving();
        }
        // Re-attach observers when modals are created
        const bodyObserver = new MutationObserver(() => {
          OBSERVED_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.dataset.supplementObserved) {
              observer.observe(el, { childList: true, subtree: true });
              el.dataset.supplementObserved = 'true';
            }
          });
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
      })();

      function toHebrewPsalmNumber(num) {
        const numerals = [
          [400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"],
          [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"],
          [40, "מ"], [30, "ל"], [20, "כ"], [10, "י"], [9, "ט"], [8, "ח"],
          [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"],
        ];
        let n = num;
        let out = "";
        numerals.forEach(([value, letter]) => {
          while (n >= value) {
            out += letter;
            n -= value;
          }
        });
        return out || String(num);
      }

      openTehillimPage = function() {
        const dayPlans = [
          { day: "ראשון", chapters: Array.from({ length: 29 }, (_, index) => index + 1) },
          { day: "שני", chapters: Array.from({ length: 21 }, (_, index) => index + 30) },
          { day: "שלישי", chapters: Array.from({ length: 22 }, (_, index) => index + 51) },
          { day: "רביעי", chapters: Array.from({ length: 17 }, (_, index) => index + 73) },
          { day: "חמישי", chapters: Array.from({ length: 17 }, (_, index) => index + 90) },
          { day: "שישי", chapters: Array.from({ length: 13 }, (_, index) => index + 107) },
          { day: "שבת", chapters: Array.from({ length: 31 }, (_, index) => index + 120) },
        ];
        const todayIndex = new Date().getDay();
        let activeIndex = todayIndex;
        let existing = document.getElementById("tehillim-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "tehillim-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:200;background:#faf9f6;display:flex;flex-direction:column;overflow:hidden;";

        const renderDay = (index) => {
          activeIndex = index;
          const plan = dayPlans[index];
          const rangeLabel = `${toHebrewPsalmNumber(plan.chapters[0])}-${toHebrewPsalmNumber(plan.chapters[plan.chapters.length - 1])}`;
          modal.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem 0.75rem;border-bottom:1px solid rgba(0,0,0,0.08);flex-shrink:0;background:#faf9f6;">
              <div>
                <h2 style="color:#000000;font-size:1.3rem;font-weight:900;margin:0;">ספר תהילים</h2>
                <p style="color:#1d4ed8;font-size:0.82rem;font-weight:700;margin:0.15rem 0 0;">יום ${plan.day} · פרקים ${rangeLabel}</p>
              </div>
              <button onclick="closeTehillimModal()" style="background:rgba(0,0,0,0.06);border:none;color:#64748b;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.1rem;">✕</button>
            </div>
            <div style="display:flex;gap:0.4rem;padding:0.75rem 1.25rem;overflow-x:auto;flex-shrink:0;background:#faf9f6;">
              ${dayPlans.map((item, itemIndex) => {
                const itemRange = `${toHebrewPsalmNumber(item.chapters[0])}-${toHebrewPsalmNumber(item.chapters[item.chapters.length - 1])}`;
                return `<button onclick="window._tehillimSwitchDay(${itemIndex})" style="padding:0.38rem 0.72rem;border-radius:999px;font-size:0.75rem;font-weight:700;border:1px solid ${itemIndex === index ? "#2563eb" : "rgba(0,0,0,0.12)"};background:${itemIndex === index ? "#2563eb" : "transparent"};color:${itemIndex === index ? "#fff" : "#64748b"};cursor:pointer;white-space:nowrap;">${item.day} · ${itemRange}</button>`;
              }).join("")}
            </div>
            <div style="padding:0 1.25rem 1.25rem;overflow-y:auto;flex:1;background:#faf9f6;">
              <div style="color:#94a3b8;font-size:0.74rem;margin:0 0 0.75rem;">מקור התהילים: <strong style="color:#1e40af;">Sefaria.org</strong></div>
              <p style="color:#64748b;font-size:0.76rem;margin:0 0 0.9rem;">לחיצה על פרק תפתח את הטקסט המלא של אותו פרק.</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:0.55rem;">
                ${plan.chapters.map((chapter) => `<button onclick="window._tehillimOpenPsalm(${chapter})" style="background:rgba(0,0,0,0.03);border:1px solid rgba(0,0,0,0.1);border-radius:0.9rem;padding:0.7rem 0.6rem;font-size:0.82rem;font-weight:800;color:#000000;cursor:pointer;">פרק ${toHebrewPsalmNumber(chapter)}</button>`).join("")}
              </div>
            </div>
            <div id="psalm-content-pane" style="display:none;position:absolute;inset:0;background:#faf9f6;z-index:10;flex-direction:column;overflow:hidden;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid rgba(0,0,0,0.08);background:#faf9f6;">
                <button onclick="document.getElementById('psalm-content-pane').style.display='none'" style="background:rgba(0,0,0,0.06);border:none;color:#64748b;padding:0.4rem 0.8rem;border-radius:999px;cursor:pointer;font-size:0.8rem;font-weight:700;">חזרה</button>
                <h3 id="psalm-title" style="color:#000000;font-size:1rem;font-weight:900;margin:0;">תהילים</h3>
                <div style="width:60px;"></div>
              </div>
              <div id="psalm-text-area" class="holy-text-style" style="padding:1.25rem;overflow-y:auto;flex:1;text-align:right;direction:rtl;"></div>
              <div id="tehillim-font-bar" class="flex items-center justify-center gap-3 py-2 px-4 flex-shrink-0" style="background:rgba(250,249,246,0.95);border-top:1px solid rgba(0,0,0,0.08);">
                <button onclick="changePrayerFontSize(-10, '#psalm-text-area')" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);background:rgba(0,0,0,0.04);color:#334155;font-size:1.1rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="הקטן כתב">−</button>
                <span class="font-size-label" style="font-size:0.78rem;font-weight:700;color:#64748b;min-width:3rem;text-align:center;">${_prayerFontSize}%</span>
                <button onclick="changePrayerFontSize(10, '#psalm-text-area')" style="width:34px;height:34px;border-radius:50%;border:1px solid rgba(0,0,0,0.15);background:rgba(0,0,0,0.04);color:#334155;font-size:1.1rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="הגדל כתב">+</button>
              </div>
              <div style="border-top:1px solid rgba(0,0,0,0.08);padding:0.7rem 1.25rem;color:#94a3b8;font-size:0.74rem;line-height:1.6;flex-shrink:0;background:#faf9f6;">מקור הטקסט: <strong style="color:#1e40af;">Sefaria.org</strong> · ספר תהילים</div>
            </div>
          `;
        };

        window._tehillimSwitchDay = (index) => renderDay(index);
        window._tehillimLoadedChapters = new Set();
        window._tehillimCurrentChapter = 1;

        async function loadPsalmChapter(chapter, area, prepend) {
          if (chapter < 1 || chapter > 150 || window._tehillimLoadedChapters.has(chapter)) return;
          window._tehillimLoadedChapters.add(chapter);
          const chapterDiv = document.createElement("div");
          chapterDiv.id = `psalm-chapter-${chapter}`;
          chapterDiv.style.cssText = "margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(0,0,0,0.08);";
          chapterDiv.innerHTML = `<h4 style="color:#1e40af;font-size:1.1rem;font-weight:900;margin-bottom:0.75rem;text-align:center;">תהילים פרק ${toHebrewPsalmNumber(chapter)}</h4><p style="color:#94a3b8;text-align:center;">טוען...</p>`;
          if (prepend && area.firstChild) {
            area.insertBefore(chapterDiv, area.firstChild);
          } else {
            area.appendChild(chapterDiv);
          }
          try {
            const response = await fetch(`https://www.sefaria.org/api/texts/Psalms.${chapter}?lang=he&context=0`);
            const data = await response.json();
            const verses = (data.he || []).map((verse, index) => `<p style="margin:0.3rem 0;color:#000000;"><strong style="color:#1d4ed8;font-size:0.75rem;">(${index + 1})</strong> ${verse}</p>`).join("");
            chapterDiv.innerHTML = `<h4 style="color:#1e40af;font-size:1.1rem;font-weight:900;margin-bottom:0.75rem;text-align:center;">תהילים פרק ${toHebrewPsalmNumber(chapter)}</h4>${verses || '<p>לא נמצא טקסט.</p>'}`;
          } catch (error) {
            chapterDiv.innerHTML = `<h4 style="color:#1e40af;font-size:1.1rem;font-weight:900;margin-bottom:0.75rem;text-align:center;">תהילים פרק ${toHebrewPsalmNumber(chapter)}</h4><p style="color:#ef4444;">לא הצלחתי לטעון פרק זה.</p>`;
          }
        }

        window._tehillimOpenPsalm = async (chapter) => {
          const pane = document.getElementById("psalm-content-pane");
          const title = document.getElementById("psalm-title");
          const area = document.getElementById("psalm-text-area");
          if (!pane || !title || !area) return;
          pane.style.display = "flex";
          window._tehillimLoadedChapters = new Set();
          window._tehillimCurrentChapter = chapter;
          title.textContent = `תהילים פרק ${toHebrewPsalmNumber(chapter)}`;
          area.innerHTML = "";
          area.style.cssText = "padding:1.25rem;overflow-y:auto;flex:1;font-family:'Frank Ruhl Libre','David Libre',serif;font-size:25px;font-weight:700;line-height:1.7;color:#000000;text-align:right;direction:rtl;";
          applyPrayerFontSize('#psalm-text-area');
          // Load current chapter and neighbors
          if (chapter > 1) await loadPsalmChapter(chapter - 1, area, false);
          await loadPsalmChapter(chapter, area, false);
          if (chapter < 150) await loadPsalmChapter(chapter + 1, area, false);
          // Scroll to current chapter
          const currentEl = document.getElementById(`psalm-chapter-${chapter}`);
          if (currentEl) currentEl.scrollIntoView({ block: "start" });
          // Infinite scroll: load more chapters on scroll
          area.onscroll = async function() {
            const scrollTop = area.scrollTop;
            const scrollHeight = area.scrollHeight;
            const clientHeight = area.clientHeight;
            // Near bottom: load next chapter
            if (scrollHeight - scrollTop - clientHeight < 200) {
              const maxLoaded = Math.max(...window._tehillimLoadedChapters);
              if (maxLoaded < 150) await loadPsalmChapter(maxLoaded + 1, area, false);
            }
            // Near top: load previous chapter
            if (scrollTop < 200) {
              const minLoaded = Math.min(...window._tehillimLoadedChapters);
              if (minLoaded > 1) {
                const prevScrollHeight = area.scrollHeight;
                await loadPsalmChapter(minLoaded - 1, area, true);
                // Maintain scroll position after prepending
                area.scrollTop += (area.scrollHeight - prevScrollHeight);
              }
            }
            // Update title based on visible chapter
            const chapters = area.querySelectorAll("[id^='psalm-chapter-']");
            for (const ch of chapters) {
              const rect = ch.getBoundingClientRect();
              const areaRect = area.getBoundingClientRect();
              if (rect.top >= areaRect.top - 50 && rect.top < areaRect.top + 150) {
                const num = parseInt(ch.id.replace("psalm-chapter-", ""));
                if (num && title) title.textContent = `תהילים פרק ${toHebrewPsalmNumber(num)}`;
                break;
              }
            }
          };
        };

        renderDay(activeIndex);
        document.body.appendChild(modal);
        lockBodyScroll();
        pushModalState('tehillim-modal');
      };

      // Patch render() to trigger animations after render
      const _origRender = render;
      window.render = function(filter, search) {
        _origRender(filter, search);
        requestAnimationFrame(setupCardObserver);
      };

      // Patch showDashboard to start countdown once data is ready
      const _origShowDashboard = showDashboard;
      window.showDashboard = function() {
        _origShowDashboard();
        setTimeout(() => {
          startShabbatCountdown();
          if (CURRENT_OMER_DAY > 0) updateOmerRing(CURRENT_OMER_DAY);
        }, 600);
      };

      // Patch renderZmanimGrid to update day bar
      const _origRenderZmanim = renderZmanimGrid;
      window.renderZmanimGrid = function(zData) {
        _origRenderZmanim(zData);
        if (zData && zData.times) {
          updateDayProgressBar(zData.times.sunrise, zData.times.sunset);
        }
      };

      // Replace native alerts with toasts
      const _nativeAlert = window.alert.bind(window);
      window.alert = function(msg) {
        if (typeof msg === 'string') {
          const isError = msg.includes('חסומות') || msg.includes('אינו תומך') || msg.includes('לא הצלחנו') || msg.includes('אינטרנט');
          showToast(msg, isError ? 'error' : 'info');
        } else {
          _nativeAlert(msg);
        }
      };

      // Kick off card observer on initial load via idle callback for better perf
      window.addEventListener('load', () => {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => setupCardObserver(), { timeout: 800 });
        } else {
          setTimeout(() => setupCardObserver(), 800);
        }
      }, { once: true });

      // ═══════════════════════════════════════════════════════
      // ✦  OMER SEFIROT (Kabbalistic attribute for each day)
      // ═══════════════════════════════════════════════════════
      const sefirotHeb = ['חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];
      const sefirotColors = ['#f59e0b','#ef4444','#22c55e','#3b82f6','#a855f7','#14b8a6','#ec4899'];

      function getOmerSefirotText(day) {
        if (!day || day < 1 || day > 49) return '';
        const weekIdx = Math.floor((day - 1) / 7);
        const dayIdx  = (day - 1) % 7;
        const daySefirah  = sefirotHeb[dayIdx];
        const weekSefirah = sefirotHeb[weekIdx];
        return `${daySefirah} שב${weekSefirah}`;
      }

      function updateOmerSefirot(day) {
        const el = document.getElementById('omer-sefirot-text');
        if (!el || !day) return;
        const weekIdx = Math.floor((day - 1) / 7);
        const dayIdx  = (day - 1) % 7;
        el.textContent = getOmerSefirotText(day);
        el.style.color = sefirotColors[dayIdx];
        el.style.background = sefirotColors[dayIdx] + '20';
      }

      // Patch the omer display to include sefirot
      const _origFetchLive = fetchLiveCalendarData;
      // We hook into the DOM update instead — after omer-day-num is set
      const _origUpdateOmerRing = updateOmerRing;
      window.updateOmerRing = function(day) {
        _origUpdateOmerRing(day);
        updateOmerSefirot(day);
      };

      // ═══════════════════════════════════════════════════════
      // ✦  WHATSAPP SHARE
      // ═══════════════════════════════════════════════════════
      function shareEventWhatsApp(name, dateStr, heb) {
        const d = new Date(dateStr);
        const dateFmt = d.toLocaleDateString(getCurrentLocale(), { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        const text = `${name}\n📅 ${dateFmt}\n🗓️ ${heb}\n\nסנכרן מהלוח היהודי: ${SITE_URL}`;
        if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
          navigator.share({ title: name, text, url: SITE_URL }).catch(() => {
            window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
          });
        } else {
          window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        }
      }

      // Patch render() to inject WhatsApp button into each card
      const _origRenderForWA = window.render;
      window.render = function(filter, search) {
        _origRenderForWA(filter, search);
        // Inject WhatsApp button into each card after render
        document.querySelectorAll('.event-card').forEach(card => {
          if (card.querySelector('.wa-btn')) return; // already added
          const btnRow = card.querySelector('.flex.md\\:flex-col');
          if (!btnRow) return;
          const downloadBtn = btnRow.querySelector('button[onclick^="downloadICS"]');
          if (!downloadBtn) return;
          // Extract event data from the ICS button's onclick attribute
          const match = downloadBtn.getAttribute('onclick').match(/downloadICS\('(.+)'\)/);
          if (!match) return;
          try {
            const e = JSON.parse(decodeURIComponent(match[1]));
            const waBtn = document.createElement('button');
            waBtn.className = 'wa-btn flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold uppercase tracking-wider transition-all bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700/50 mt-1 w-full justify-center';
            waBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.