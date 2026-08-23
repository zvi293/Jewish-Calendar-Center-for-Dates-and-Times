/* ═══════════════════════════════════════════════════════════════════
   lux.js — שכבת חוויה "רויאל" (Royal Night & Gold)
   קובץ עצמאי ותוספתי בלבד: אינו משנה לוגיקה קיימת ב-script.js.
   כל פיצ'ר עטוף try/catch — כשל בפיצ'ר אחד לא משפיע על האתר.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  document.documentElement.classList.add("lux-js");

  function safe(name, fn) {
    try { fn(); } catch (e) { try { console.warn("[lux] " + name + ":", e); } catch (_) {} }
  }

  /* ── 1. רקע הירו לפי שעת היום + נרות ערב שבת ─────────────────── */
  safe("timeOfDay", function () {
    var hero = document.getElementById("hero-section");
    if (!hero) return;
    function apply() {
      var h = new Date().getHours();
      hero.classList.remove("lux-t-dawn", "lux-t-day", "lux-t-dusk");
      if (h >= 5 && h < 8) hero.classList.add("lux-t-dawn");
      else if (h >= 8 && h < 16) hero.classList.add("lux-t-day");
      else if (h >= 16 && h < 19) hero.classList.add("lux-t-dusk");
      // ערב שבת — מהצהריים של יום שישי עד כניסת שבת
      var d = new Date();
      if (d.getDay() === 5 && d.getHours() >= 12) document.body.classList.add("lux-erev-shabbat");
      else document.body.classList.remove("lux-erev-shabbat");
    }
    apply();
    setInterval(apply, 10 * 60 * 1000);
  });

  /* ── 2. כוכב נופל מדי פעם בשמי ההירו ──────────────────────────── */
  safe("shootingStar", function () {
    var hero = document.getElementById("hero-section");
    if (!hero) return;
    // הכוכב פעיל גם בנייד (לבקשת המשתמש). מה שגרם להבהוב-מסך כל ~30ש' ב-PWA
    // היה ה-drop-shadow שלו (render-surface חדש מעל ההירו בכל הופעה) — הוסר
    // בנייד ב-style.css. בנוסף: יורים רק כשההירו באמת נראה על המסך — מחוץ
    // למסך ההופעה רק מציירת מאחורי התוכן שהמשתמש קורא.
    var heroOnScreen = true;
    try {
      new IntersectionObserver(function (entries) {
        // הרשומה האחרונה — batch יכול להכיל [יצא, חזר]
        heroOnScreen = entries[entries.length - 1].isIntersecting;
      }).observe(hero);
    } catch (e) {}
    // אלמנט קבוע אחד לכל חיי הדף — הוספה/הסרה של div בכל יריה בנתה מחדש את
    // עץ השכבות של ההירו (שמרכיב קנבס כוכבים + עיגולי blur) פעמיים בכל ~30ש',
    // מה שנראה בנייד כהבהוב של כל המסך. עכשיו רק מאתחלים את האנימציה מחדש.
    var star = null;
    function shoot() {
      if (!hero.classList.contains("gradient-bg")) return schedule();
      // מאחורי פופאפ/טאב מוסתר הכוכב רק מייצר repaint מתחת לשכבה — מדלגים
      if (document.hidden || document.documentElement.classList.contains("lux-modal-open")) return schedule();
      if (!heroOnScreen) return schedule();
      // reduced-motion: ה-CSS ממילא מבטל את האנימציה — אין טעם גם ב-DOM churn
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return schedule();
      if (!star || !star.isConnected) {
        star = document.createElement("div");
        star.className = "lux-shooting-star";
        // אנימציית ה-CSS מבוטלת — היריות רצות דרך WAAPI (למטה), ישירות על
        // ה-compositor. האלמנט מעוגן ב-(0,0) והמיקום האקראי נכנס ל-keyframes
        // עצמם — יריה לא כותבת אף style ולא מפעילה layout/paint מחוץ לשכבת הכוכב
        star.style.animation = "none";
        star.style.top = "0";
        star.style.right = "0";
        hero.appendChild(star); // הוספה חד-פעמית לכל חיי הדף
      }
      try {
        var hr = hero.getBoundingClientRect();
        var offY = Math.round(hr.height * (5 + Math.random() * 35) / 100);
        var offX = -Math.round(hr.width * (Math.random() * 40) / 100); // שמאלה מהקצה הימני
        var base = "translate(" + offX + "px," + offY + "px) rotate(200deg)";
        star.animate([
          { opacity: 0, transform: base + " translateX(0)" },
          { opacity: 1, offset: 0.12 },
          { opacity: 0, transform: base + " translateX(340px)" }
        ], { duration: 1300, easing: "ease-out" });
      } catch (e) {}
      schedule();
    }
    function schedule() { setTimeout(shoot, 18000 + Math.random() * 26000); }
    setTimeout(shoot, 6000 + Math.random() * 8000);
  });

  /* ── 3. ירח חי — פאזת הירח האמיתית; בלחיצה: פופאפ מצב הירח ואז ברכת הלבנה ── */
  safe("moonPhase", function () {
    var hero = document.getElementById("hero-section");
    if (!hero) return;
    var SYNODIC = 29.53058867;
    var REF_MOLAD = Date.UTC(2000, 0, 6, 18, 14); // מולד ידוע
    var faces = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    function moonNow() {
      var age = ((Date.now() - REF_MOLAD) / 86400000) % SYNODIC;
      if (age < 0) age += SYNODIC;
      var idx = Math.round(age / (SYNODIC / 8)) % 8;
      return { age: age, idx: idx, day: Math.floor(age) + 1, pct: Math.round((age / SYNODIC) * 100) };
    }
    var m0 = moonNow();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "lux-moon";
    btn.setAttribute("aria-label", "מצב הירח וברכת הלבנה");
    btn.title = "יום " + m0.day + " למולד · לחץ למצב הירח ולברכת הלבנה";
    btn.textContent = faces[m0.idx];
    function goLevana() {
      if (typeof window.openPrayer === "function")
        window.openPrayer("kiddush-levana", "ברכת לבנה", "Kiddush Levana");
    }
    btn.addEventListener("click", function () {
      var old = document.getElementById("lux-moon-pop");
      if (old) { old.remove(); return; }
      var m = moonNow();
      var pop = document.createElement("div");
      pop.id = "lux-moon-pop";
      pop.innerHTML =
        '<div class="lux-moon-pop-in">' +
          '<span class="lux-moon-pop-face">' + faces[m.idx] + "</span>" +
          "<h3>מראה הירח כעת בשמים</h3>" +
          '<p class="lux-moon-pop-day">🌙 יום <b>' + m.day + "</b> למולד הלבנה</p>" +
          '<div class="lux-moon-pop-track"><div class="lux-moon-pop-fill"></div></div>' +
          '<p class="lux-moon-pop-note">עוברים לברכת הלבנה בעוד רגע...</p>' +
          '<div class="lux-moon-pop-btns">' +
            '<button type="button" class="lux-moon-pop-go">🌙 לברכת הלבנה עכשיו</button>' +
            '<button type="button" class="lux-moon-pop-x" aria-label="סגירה">✕</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(pop);
      var timer = setTimeout(function () { pop.remove(); goLevana(); }, 4600);
      function closeOnly() { clearTimeout(timer); pop.remove(); }
      pop.querySelector(".lux-moon-pop-go").addEventListener("click", function () { closeOnly(); goLevana(); });
      pop.querySelector(".lux-moon-pop-x").addEventListener("click", closeOnly);
      pop.addEventListener("click", function (e) { if (e.target === pop) closeOnly(); });
    });
    hero.appendChild(btn);
  });

  /* ── 4. גלילה חושפת לכרטיסי אירועים ───────────────────────────── */
  safe("scrollReveal", function () {
    var grid = document.getElementById("resultsGrid");
    if (!grid || !("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("lux-js");
      return;
    }
    // WeakSet ולא class — הרינדור בונה את הכרטיסים מחדש (innerHTML),
    // ומחלקה הייתה "שורדת" את השכפול בזמן שה-observer מאבד את האלמנט.
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          el.style.transitionDelay = (el._luxIdx % 5) * 70 + "ms";
          el.classList.add("lux-in");
          io.unobserve(el);
          setTimeout(function () { el.style.transitionDelay = ""; }, 900);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    var pending = null;
    function watch() {
      pending = null;
      var cards = grid.querySelectorAll(".event-card");
      var i = 0;
      cards.forEach(function (c) {
        if (seen.has(c)) return;
        seen.add(c);
        c.classList.remove("lux-in");
        c._luxIdx = i++;
        // כרטיס שכבר על המסך — לחשוף מיד
        var r = c.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) c.classList.add("lux-in");
        else io.observe(c);
      });
    }
    watch();
    // debounce קצר — render() משרשר innerHTML += פר-כרטיס ומייצר עשרות מוטציות
    new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(watch, 80);
    }).observe(grid, { childList: true });
    // רשת ביטחון: חשיפה מבוססת גלילה גם אם ה-observer לא יורה
    var scrollTick = false;
    window.addEventListener("scroll", function () {
      if (scrollTick) return;
      scrollTick = true;
      setTimeout(function () {
        scrollTick = false;
        // אירוע הגלילה שנורה כשפופאפ נועל את הרקע (scrollY קורס ל-0) — לא סורקים מאחורי שכבה
        if (document.body.style.position === "fixed") return;
        grid.querySelectorAll(".event-card:not(.lux-in)").forEach(function (c) {
          if (c.getBoundingClientRect().top < window.innerHeight * 0.95)
            c.classList.add("lux-in");
        });
      }, 120);
    }, { passive: true });
    // רשת ביטחון אחרונה: סריקה מחזורית — שום כרטיס (והכפתורים שבו) לא
    // נשאר שקוף אחרי גלילה מעלה/מטה, גם אם אף אחד מהמנגנונים לא ירה.
    setInterval(function () {
      // הטאב ברקע — אין מה לסרוק; פופאפ פתוח (הגוף נעול בגלילה) — הכרטיסים
      // מוסתרים מאחוריו, וסריקות getBoundingClientRect/getComputedStyle כל
      // שנייה רק גורמות לריצוד בנייד. הסריקה מתחדשת מיד עם סגירת הפופאפ.
      if (document.hidden || document.documentElement.classList.contains("lux-modal-open")) return;
      grid.querySelectorAll(".event-card:not(.lux-in)").forEach(function (c) {
        var r = c.getBoundingClientRect();
        // כל כרטיס שנמצא בתחום המסך או מעליו — נחשף מיד
        if (r.top < window.innerHeight * 1.05) c.classList.add("lux-in");
      });
      // מעבר ה-opacity של .lux-in קופא כשהדפדפן משהה את ציר האנימציות
      // (רקע/מסך כבוי/הקפאת PWA) — כרטיס שנשאר שקוף שני מחזורים רצופים
      // מקבל חשיפה כפויה בלי מעבר, כדי שלא "ייעלם" עד רענון.
      // כרטיס שכבר אושר כגלוי (_luxOK) לא נבדק שוב — בדיקת getComputedStyle
      // על עשרות כרטיסים בכל שנייה גורמת לריצודים בנייד.
      grid.querySelectorAll(".event-card.lux-in").forEach(function (c) {
        if (c._luxForced || c._luxOK) return;
        if (parseFloat(getComputedStyle(c).opacity) < 0.9) {
          c._luxLowTicks = (c._luxLowTicks || 0) + 1;
          if (c._luxLowTicks >= 2) {
            c.style.opacity = "1";
            c.style.transform = "none";
            c.style.transition = "none";
            try {
              c.getAnimations().forEach(function (a) {
                try { a.finish(); } catch (e1) { try { a.cancel(); } catch (e2) {} }
              });
            } catch (e) {}
            c._luxForced = true;
          }
        } else {
          c._luxOK = true;
        }
      });
      // גם אלמנטי הבית (לוח היומי, זמנים, כפתורי התפילות, האייקונים) —
      // אותה הקפאת-מעבר, אותו תיקון: חשיפה כפויה אם נשארו שקופים.
      try { if (typeof window._forceRevealHeroEls === "function") window._forceRevealHeroEls(); } catch (e) {}
    }, 1000);
  });

  /* ── 5. גל אור (ripple) + רטט עדין במובייל ────────────────────── */
  safe("ripple", function () {
    var SEL = ".prayer-btn, .chip, .nav-action-btn, .nav-donate-btn, #lux-bottom-nav button, .zman-card";
    document.addEventListener("click", function (e) {
      var host = e.target.closest && e.target.closest(SEL);
      if (!host) return;
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (_) {} }
      var rect = host.getBoundingClientRect();
      var r = document.createElement("span");
      r.className = "lux-ripple";
      var size = Math.max(rect.width, rect.height) * 2.2;
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      host.appendChild(r);
      setTimeout(function () { r.remove(); }, 650);
    }, { passive: true });
  });

  /* ── 6. קונפטי זהב — פתיחת ספירת העומר ולחיצת "ברכתי" בלבנה ───── */
  function luxConfetti() {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      var wrap = document.createElement("div");
      wrap.className = "lux-confetti";
      var colors = ["#f2d98a", "#e0b74f", "#fdf3d0", "#c9993a", "#ffffff"];
      for (var i = 0; i < 26; i++) {
        var p = document.createElement("span");
        p.style.left = (8 + Math.random() * 84) + "%";
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.35) + "s";
        p.style.animationDuration = (1 + Math.random() * 0.9) + "s";
        p.style.setProperty("--lx", (Math.random() * 120 - 60) + "px");
        p.style.setProperty("--lr", (Math.random() * 540 - 270) + "deg");
        if (i % 3 === 0) p.style.borderRadius = "50%";
        wrap.appendChild(p);
      }
      document.body.appendChild(wrap);
      setTimeout(function () { wrap.remove(); }, 2600);
    } catch (e) {}
  }
  safe("celebrations", function () {
    if (typeof window.openOmerModal === "function") {
      var orig = window.openOmerModal;
      window.openOmerModal = function () {
        var out = orig.apply(this, arguments);
        // הקונפטי רק אחרי שמעבר הפתיחה (300ms) הסתיים — ביחד הם גרמו לריצוד פתיחה בנייד
        setTimeout(luxConfetti, 420);
        return out;
      };
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".levana-blessed-btn")) luxConfetti();
    }, { passive: true });
  });

  /* ── 7. פס התקדמות קריאה בקוראי הספרים ── */
  var READER_IDS = [
    "sefaria-modal", "chok-israel-modal", "tehillim-modal", "sn-modal",
    "ben-ish-hai-modal", "shir-hashirim-modal",
    // כל שאר הקוראים והתפילות — פס ההתקדמות מופיע בכולם
    "prayer-modal", "omer-modal", "motzei-shabbat-modal",
    "moad-torah-modal", "hilulot-modal", "lux-selichot-reader", "lux-track-reader"
  ];

  function enhanceReader(modal) {
    if (!modal || modal._luxDone) return;
    modal._luxDone = true;
    // פס התקדמות
    var bar = document.createElement("div");
    bar.className = "lux-progress";
    bar.innerHTML = "<div class='lux-progress-fill'></div>";
    modal.appendChild(bar);
    var fill = bar.firstChild;
    modal.addEventListener("scroll", function (e) {
      var t = e.target;
      if (!t || !t.scrollHeight) return;
      // גם כשהמודאל עצמו הוא הגליל (הילולות/דברי תורה) — מודדים אותו
      if (t === modal && modal.scrollHeight <= modal.clientHeight + 4) return;
      var max = t.scrollHeight - t.clientHeight;
      if (max < 40) return;
      // ריפוי-עצמי: אם תוכן המודאל צויר מחדש (innerHTML) והפס נמחק — מחזירים אותו
      if (!modal.contains(bar)) { modal.appendChild(bar); fill = bar.firstChild; }
      fill.style.width = Math.min(100, (t.scrollTop / max) * 100) + "%";
    }, true);
    // סרגל הגופן מקבל קלאס אחיד — משמש לגלישת שורות במובייל ולחישובי גובה
    var label = modal.querySelector(".font-btn-group") ||
                modal.querySelector(".font-size-label") ||
                modal.querySelector("#sn-fs-label") ||
                modal.querySelector("#bih-font-label");
    var hostBar = label ? label.parentElement : modal.querySelector(".lux-sel-foot");
    if (hostBar) hostBar.classList.add("lux-font-bar");
  }

  safe("readers", function () {
    // ניקוי מפתחות של מצבי לימוד/לילה שהוסרו מהאתר
    try {
      localStorage.removeItem("lux_reader_study");
      localStorage.removeItem("lux_reader_night");
    } catch (_) {}
    READER_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) enhanceReader(el);
    });
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1 && READER_IDS.indexOf(n.id) !== -1) enhanceReader(n);
        });
      });
    }).observe(document.body, { childList: true });
  });

  /* ── 7ב. מרקר אוניברסלי — סימון שורה בכל הספרים והתפילות ───────── */
  safe("universalMarker", function () {
    var KEY = "lux_marks_v1";
    var ON_KEY = "lux_marker_on";
    // כבוי כברירת מחדל — מופעל רק אם המשתמש הדליק במפורש בהגדרות
    function enabled() { try { return localStorage.getItem(ON_KEY) === "1"; } catch (e) { return false; } }
    // מטמון בזיכרון — JSON.parse כל 1.2 שניות בלולאת השחזור מיותר ומרצד בנייד
    var _marksCache = null;
    function loadAll() {
      if (_marksCache === null) _marksCache = jget(KEY, {});
      return _marksCache;
    }
    function saveAll(m) { _marksCache = m; jset(KEY, m); }
    // מזהה יציב לפסקה — תחילת הטקסט המנורמל (שורד רינדור מחדש של המודאל)
    function sig(el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t.length < 8) return null;
      return t.slice(0, 90);
    }
    // כל אזורי הקריאה באתר שבהם המרקר פעיל
    var AREAS = [
      "#sefaria-modal-content", "#chok-israel-modal-content", "#sn-reader-content",
      "#psalm-text-area", "#bih-content-area", "#shir-scroll-area",
      "#lux-sel-area", "#lux-tr-area", "#prayer-modal-body", "#lux-pl-area",
      "#prayer-modal .modal-body"
    ];
    // [id^='bih-h-'] — הלכות הבן איש חי מרונדרות כ-div ולא כפסקאות
    var BLOCK_SEL = "p, .lux-sel-para, .shmikra-verse, li, .lux-mline, [id^='bih-h-']";
    // תפילות מ-PRAYER_DB מוצגות כטקסט עם <br> בלי פסקאות —
    // עוטפים כל שורה ב-span כדי שאפשר יהיה לסמן אותה
    function wrapLines(host) {
      if (!host || host.getAttribute("data-lux-mwrapped")) return;
      if (host.querySelector("p, .lux-mline")) { host.setAttribute("data-lux-mwrapped", "1"); return; }
      if (!host.querySelector("br")) return;
      host.setAttribute("data-lux-mwrapped", "1");
      var kids = Array.prototype.slice.call(host.childNodes);
      var frag = document.createDocumentFragment();
      var cur = document.createElement("span");
      cur.className = "lux-mline";
      function flush() {
        if (cur.childNodes.length) frag.appendChild(cur);
        cur = document.createElement("span");
        cur.className = "lux-mline";
      }
      kids.forEach(function (n) {
        if (n.nodeType === 1 && n.tagName === "BR") { flush(); frag.appendChild(n); }
        else if (n.nodeType === 3 || (n.nodeType === 1 && ["STRONG", "B", "SPAN", "EM", "I"].indexOf(n.tagName) !== -1)) { cur.appendChild(n); }
        else { flush(); frag.appendChild(n); }
      });
      flush();
      host.innerHTML = "";
      host.appendChild(frag);
    }
    function areaOf(el) {
      for (var i = 0; i < AREAS.length; i++) {
        var host = el.closest(AREAS[i]);
        if (host) return { host: host, key: AREAS[i] };
      }
      return null;
    }
    /* ── סימון שורה ויזואלית מדויקת ────────────────────────────────────
       נשמר מזהה הפסקה (sig) + אינדקס התו שנלחץ; בכל תצוגה (נייד/מחשב,
       כל גודל כתב) מחשבים מחדש איזו שורת-טקסט מכילה את התו הזה ומדגישים
       רק אותה (CSS Custom Highlight API). בדפדפן ישן — נופלים לסימון הפסקה. */
    var HL_OK = !!(window.CSS && CSS.highlights && typeof Highlight === "function");
    var _hl = HL_OK ? new Highlight() : null;
    if (HL_OK) { try { CSS.highlights.set("lux-mark", _hl); } catch (e) { HL_OK = false; } }
    var _lineState = {}; // areaKey → { block, off, w, fs, range }
    function textNodes(block) {
      var out = [], w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      var n; while ((n = w.nextNode())) out.push(n);
      return out;
    }
    function posAt(nodes, off) {
      var acc = 0;
      for (var i = 0; i < nodes.length; i++) {
        var len = nodes[i].data.length;
        if (off <= acc + len) return { node: nodes[i], offset: Math.max(0, off - acc) };
        acc += len;
      }
      var last = nodes[nodes.length - 1];
      return last ? { node: last, offset: last.data.length } : null;
    }
    function topAt(nodes, off) {
      var p = posAt(nodes, off); if (!p) return null;
      var r = document.createRange(); r.setStart(p.node, p.offset); r.setEnd(p.node, p.offset);
      var rects = r.getClientRects(); var rc = rects.length ? rects[0] : r.getBoundingClientRect();
      return rc && (rc.height || rc.top) ? rc : null;
    }
    // גבולות השורה (במונחי אינדקס תו בפסקה) שמכילה את התו off
    function lineBounds(block, off) {
      var nodes = textNodes(block); if (!nodes.length) return null;
      var total = 0; nodes.forEach(function (n) { total += n.data.length; });
      if (!total) return null;
      off = Math.max(0, Math.min(total - 1, off));
      var rc = topAt(nodes, off); if (!rc) return null;
      var y = rc.top, tol = Math.max(2, rc.height * 0.5);
      function above(i) { var r = topAt(nodes, i); return r ? r.top < y - tol : false; }
      function below(i) { var r = topAt(nodes, i); return r ? r.top > y + tol : false; }
      // התחלה: האינדקס הקטן ביותר שאינו "מעל" השורה (גובהי השורות עולים עם הטקסט)
      var lo = 0, hi = off;
      while (lo < hi) { var m = (lo + hi) >> 1; if (above(m)) lo = m + 1; else hi = m; }
      var start = lo;
      lo = off; hi = total;
      while (lo < hi) { var m2 = (lo + hi) >> 1; if (below(m2)) hi = m2; else lo = m2 + 1; }
      var end = lo;
      if (end <= start) return null;
      var a = posAt(nodes, start), b = posAt(nodes, end);
      if (!a || !b) return null;
      var range = document.createRange(); range.setStart(a.node, a.offset); range.setEnd(b.node, b.offset);
      return { start: start, end: end, range: range, y: y };
    }
    // אינדקס התו שנלחץ בתוך הפסקה
    function offsetFromPoint(block, x, y) {
      var node = null, offset = 0;
      try {
        if (document.caretPositionFromPoint) { var cp = document.caretPositionFromPoint(x, y); if (cp) { node = cp.offsetNode; offset = cp.offset; } }
        else if (document.caretRangeFromPoint) { var cr = document.caretRangeFromPoint(x, y); if (cr) { node = cr.startContainer; offset = cr.startOffset; } }
      } catch (e) {}
      var nodes = textNodes(block);
      if (node && node.nodeType === 3 && block.contains(node)) {
        var acc = 0;
        for (var i = 0; i < nodes.length; i++) { if (nodes[i] === node) return acc + offset; acc += nodes[i].data.length; }
      }
      // נפילה: התו הראשון בשורה שמכילה את גובה הלחיצה
      var total = 0; nodes.forEach(function (n) { total += n.data.length; });
      var lo = 0, hi = Math.max(0, total - 1);
      while (lo < hi) { var m = (lo + hi + 1) >> 1; var r = topAt(nodes, m); if (r && r.top <= y) lo = m; else hi = m - 1; }
      return lo;
    }
    function clearArea(key) {
      var st = _lineState[key];
      if (st && st.range && _hl) { try { _hl.delete(st.range); } catch (e) {} }
      delete _lineState[key];
      var host = document.querySelector(key);
      if (host) host.querySelectorAll(".lux-mark-hl").forEach(function (x) { x.classList.remove("lux-mark-hl"); });
    }
    function paintLine(key, block, off) {
      clearArea(key);
      if (!HL_OK) { block.classList.add("lux-mark-hl"); _lineState[key] = { block: block, off: off }; return true; }
      var lb = lineBounds(block, off);
      if (!lb) { block.classList.add("lux-mark-hl"); _lineState[key] = { block: block, off: off }; return true; }
      try { _hl.add(lb.range); } catch (e) { block.classList.add("lux-mark-hl"); }
      _lineState[key] = { block: block, off: off, w: block.clientWidth, fs: getComputedStyle(block).fontSize, range: lb.range, start: lb.start, end: lb.end };
      return true;
    }
    document.addEventListener("click", function (e) {
      if (!enabled()) return;
      if (!e.target.closest) return;
      // לא מסמנים בלחיצה על כפתורים/קישורים/פירושים מוטמעים
      if (e.target.closest("button, a, input, select, textarea, label, [onclick], [class*='chok-rashi'], .daf-line")) return;
      var block = e.target.closest(BLOCK_SEL);
      if (!block) return;
      var ar = areaOf(block);
      if (!ar) return;
      // בדף יומי יש מנגנון סימון ייעודי משלו
      if (ar.key === "#sefaria-modal-content" && ar.host.querySelector(".daf-line")) return;
      var s = sig(block);
      if (!s) return;
      var marks = loadAll();
      var off = offsetFromPoint(block, e.clientX, e.clientY);
      var cur = _lineState[ar.key];
      var sameLine = !!(cur && cur.block === block && (
        (typeof cur.start === "number") ? (off >= cur.start && off < cur.end) : true));
      if (sameLine || (!HL_OK && block.classList.contains("lux-mark-hl"))) {
        clearArea(ar.key);
        delete marks[ar.key];
        saveAll(marks);
        if (typeof window.showToast === "function") window.showToast("🖍️ הסימון הוסר", "info", 1500);
        return;
      }
      marks[ar.key] = { s: s, off: off };
      saveAll(marks);
      paintLine(ar.key, block, off);
      if (typeof window.showToast === "function") window.showToast("🖍️ השורה סומנה — נשמר במכשיר זה", "success", 1800);
    });
    // פריסה השתנתה (סיבוב מסך / גודל כתב) — השורה מחושבת מחדש
    var _relayoutT = null;
    window.addEventListener("resize", function () { clearTimeout(_relayoutT); _relayoutT = setTimeout(function () { Object.keys(_lineState).forEach(function (k) { var st = _lineState[k]; if (st && st.block && st.block.isConnected) paintLine(k, st.block, st.off); }); }, 150); });
    // שחזור הסימון — גם אחרי שהמודאל נבנה מחדש (innerHTML)
    function restore() {
      if (!enabled() || document.hidden) return;
      // עטיפת שורות בקוראי התפילות (טקסט מבוסס <br>)
      document.querySelectorAll("#prayer-modal .modal-body").forEach(wrapLines);
      var marks = loadAll();
      if (!Object.keys(marks).length) return;
      AREAS.forEach(function (k) {
        var mk = marks[k];
        if (!mk) return;
        var host = document.querySelector(k);
        if (!host) return;
        var sg = typeof mk === "string" ? mk : mk.s;
        var off = typeof mk === "string" ? 0 : (mk.off || 0);
        var st = _lineState[k];
        if (st && st.block && st.block.isConnected && host.contains(st.block)) {
          // כבר מסומן — מציירים מחדש רק אם הפריסה השתנתה (רוחב/גודל כתב)
          if (HL_OK && st.range && (st.w !== st.block.clientWidth || st.fs !== getComputedStyle(st.block).fontSize)) paintLine(k, st.block, st.off);
          return;
        }
        if (!HL_OK && host.querySelector(".lux-mark-hl")) return;
        var blocks = host.querySelectorAll(BLOCK_SEL);
        for (var i = 0; i < blocks.length; i++) {
          if (sig(blocks[i]) === sg) { paintLine(k, blocks[i], off); return; }
        }
      });
    }
    setInterval(restore, 1200);

    /* ── כפתור 🖍️ בכותרת כל קורא — מראה/מכבה את המרקר בלי לצאת להגדרות ──
       מצב המרקר — נקודת אמת אחת: localStorage + מתג ההגדרות + כפתורי הקוראים + הסימונים ב-DOM */
    function setMarkerOn(on, quiet) {
      on = !!on;
      try { localStorage.setItem(ON_KEY, on ? "1" : "0"); } catch (e) {}
      if (on) {
        // צביעה מיידית של הסימון השמור (לא לחכות לטיק של 1.2 שניות)
        try { restore(); } catch (e) {}
      } else {
        // מראה בלבד — הסימונים השמורים (lux_marks_v1) נשארים, כמו במתג ההגדרות
        document.querySelectorAll(".lux-mark-hl").forEach(function (x) { x.classList.remove("lux-mark-hl"); });
        Object.keys(_lineState).forEach(clearArea);
      }
      var sw = document.querySelector("#lux-marker-toggle .lux-sw");
      if (sw) sw.classList.toggle("lux-sw-on", on);
      syncReaderBtns();
      if (quiet) return;
      if (on) {
        if (typeof window._btnToastOn === "function") window._btnToastOn("🖍️ מרקר");
        else if (typeof window.showToast === "function") window.showToast("🖍️ המרקר הופעל — לחיצה על שורה מסמנת אותה", "success", 2400);
      } else {
        if (typeof window._btnToastOff === "function") window._btnToastOff("🖍️ מרקר");
        else if (typeof window.showToast === "function") window.showToast("המרקר כובה", "success", 2400);
      }
    }
    function vis(el) {
      if (!el || !el.isConnected || el.offsetParent === null) return false;
      try { return getComputedStyle(el).display !== "none"; } catch (e) { return true; }
    }
    function removeBtns(scope, area) {
      if (!scope) return;
      scope.querySelectorAll('.lux-mk-btn[data-lux-mk="' + area + '"]').forEach(function (b) { b.remove(); });
    }
    // רישום כותרות הקוראים. resolve() מחזיר {row, ref, where[, style]} או null כשהתצוגה לא פתוחה.
    // dark=true → גרסה בהירה של הכפתור על כותרת כהה (.lux-sel-head).
    // המסמך RTL: הילד הראשון בשורת flex יושב בקצה הימני, האחרון בקצה השמאלי.
    // בקוראים שבהם מוזרק ה-X האוניברסלי (ספרים נוספים / בן איש חי / תהילים) הכפתור נכנס
    // כילד ראשון של קבוצת הכפתורים השמאלית — הרחוק ביותר מה-X, ו-ensureRoomForX ממשיך לעבוד.
    var HEADS = [
      // ספריא / שניים מקרא — [✕ ימין][כותרת שמאל]; הכפתור נצמד ל-✕ (margin-left:auto דוחף את הכותרת שמאלה)
      { area: "#sefaria-modal-content", resolve: function () {
          var m = document.getElementById("sefaria-modal");
          if (!m || m.classList.contains("hidden")) return null;
          var c = document.getElementById("sefaria-modal-content");
          if (c && c.querySelector(".daf-line")) { removeBtns(m, "#sefaria-modal-content"); return null; }   // דף יומי — מרקר ייעודי משלו
          var x = m.querySelector('button[onclick="closeSefariaModal()"]');
          return x ? { row: x.parentElement, ref: x, where: "afterend", style: "margin-left:auto;margin-right:0.5rem;" } : null;
        } },
      { area: "#chok-israel-modal-content", resolve: function () {
          var m = document.getElementById("chok-israel-modal");
          if (!m || m.classList.contains("hidden")) return null;
          var x = m.querySelector('button[onclick="closeChokLeIsraelModal()"]');
          return x ? { row: x.parentElement, ref: x, where: "afterend", style: "margin-left:auto;margin-right:0.5rem;" } : null;
        } },
      // תפילות — שתי הפריסות (popup/fullscreen): קבוצת [☰][✕] משמאל; המרקר ראשון (מימין ל-☰)
      { area: "#prayer-modal-body", resolve: function () {
          var x = document.querySelector('#prayer-modal button[onclick="closePrayerModal()"]');
          return x && x.parentElement ? { row: x.parentElement, ref: x.parentElement, where: "afterbegin" } : null;
        } },
      // תהילים — פאנל הפרק; הקבוצה [📌][📑] משמאל
      { area: "#psalm-text-area", resolve: function () {
          var pane = document.getElementById("psalm-content-pane");
          if (!vis(pane)) return null;
          var b = pane.querySelector("#th-psalm-bm-toggle-btn");
          return b && b.parentElement ? { row: b.parentElement, ref: b.parentElement, where: "afterbegin" } : null;
        } },
      // בן איש חי — כפתורי הכותרת ילדים ישירים; נכנס מיד אחרי הכותרת (מימין ל-📑)
      { area: "#bih-content-area", resolve: function () {
          var pane = document.getElementById("bih-reading-pane");
          if (!vis(pane)) return null;
          var t = pane.querySelector("#bih-reading-title");
          return t && t.parentElement ? { row: t.parentElement, ref: t, where: "afterend", style: "margin-left:0.35rem;" } : null;
        } },
      // ספרים נוספים — קבוצת [📑][🔖][📌][🔍] (#sn-reader-tools, או הורה של 🔖 בגרסה הישנה); המרקר ראשון
      { area: "#sn-reader-content", resolve: function () {
          var v = document.getElementById("sn-reader-view");
          if (!vis(v)) return null;
          var g = document.getElementById("sn-reader-tools");
          if (!g || !v.contains(g)) { var b = v.querySelector("#sn-reader-bm-btn"); g = b ? b.parentElement : null; }
          return g ? { row: g, ref: g, where: "afterbegin" } : null;
        } },
      // קוראי lux (סליחות / מסלולים / סדר לימוד) — [✕ ימין][כותרות flex:1]; המרקר בסוף = קצה שמאל
      { area: "#lux-sel-area", dark: true, resolve: function () { var h = document.querySelector("#lux-selichot-reader .lux-sel-head"); return h ? { row: h, ref: h, where: "beforeend" } : null; } },
      { area: "#lux-tr-area",  dark: true, resolve: function () { var h = document.querySelector("#lux-track-reader .lux-sel-head");    return h ? { row: h, ref: h, where: "beforeend" } : null; } },
      { area: "#lux-pl-area",  dark: true, resolve: function () { var h = document.querySelector("#lux-plan-reader .lux-sel-head");     return h ? { row: h, ref: h, where: "beforeend" } : null; } }
      // שיר השירים (#shir-scroll-area) הושמט בכוונה — הפסוקים הם span-ים בלי בלוקים, המרקר לא פעיל שם בפועל.
    ];
    function makeBtn(entry, spot) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lux-mk-btn" + (entry.dark ? " lux-mk-dark" : "");
      b.setAttribute("data-lux-mk", entry.area);        // מזהה אידמפוטנטיות + לאיזה אזור שייך
      // בלי המילים סגור/חזרה ובלי close ב-id/class — שלא ייחשב ככפתור סגירה ע"י universalCloseX
      b.setAttribute("aria-label", "מרקר סימון שורה");
      b.title = "מרקר — לחיצה על שורה צובעת אותה";
      b.textContent = "🖍️";
      var extra = (spot && spot.style) || entry.style;
      if (extra) b.style.cssText += extra;
      b.addEventListener("click", function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        setMarkerOn(!enabled());
      });
      return b;
    }
    // אידמפוטנטי — כפתור אחד לכל שורת כותרת (לפי data-lux-mk); קוראים שנבנים מחדש ב-innerHTML
    // מאבדים את הכפתור ומקבלים אותו שוב תוך ≤1.2 שניות (או ≤150ms כשנוסף צומת ל-body)
    function syncReaderBtns() {
      var on = enabled();
      HEADS.forEach(function (entry) {
        var spot = null;
        try { spot = entry.resolve(); } catch (e) { spot = null; }
        if (!spot || !spot.row || !spot.ref) return;
        var existing = spot.row.querySelector('.lux-mk-btn[data-lux-mk="' + entry.area + '"]');
        if (!existing) {
          existing = makeBtn(entry, spot);
          try { spot.ref.insertAdjacentElement(spot.where, existing); } catch (e) { return; }
        }
        existing.classList.toggle("lux-mk-on", on);
        existing.setAttribute("aria-pressed", on ? "true" : "false");
      });
      // מתג ההגדרות תמיד משקף את המפתח (גם אם שונה מתוך קורא)
      var sw = document.querySelector("#lux-marker-toggle .lux-sw");
      if (sw) sw.classList.toggle("lux-sw-on", on);
    }
    setInterval(function () { if (!document.hidden) syncReaderBtns(); }, 1200);
    var _mkPend = null;
    try {
      new MutationObserver(function () {
        if (_mkPend) return;
        _mkPend = setTimeout(function () { _mkPend = null; syncReaderBtns(); }, 150);
      }).observe(document.body, { childList: true });
    } catch (e) {}
    setTimeout(syncReaderBtns, 0);

    // מתג בהגדרות — כבוי כברירת מחדל, עם הסבר קצר מה המרקר עושה
    function injectToggle() {
      var anchor = document.getElementById("lux-dt-btn") || document.getElementById("lux-stories-auto-toggle") || document.getElementById("lux-tour-btn");
      if (!anchor || document.getElementById("lux-marker-toggle")) return;
      var host = anchor.closest("div");
      var on = enabled();
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-marker-toggle" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span style="text-align:right;flex:1;min-width:0;">' +
            '<span class="font-semibold text-sm" style="display:block;">🖍️ מרקר סימון שורה בספרים</span>' +
            '<small style="display:block;color:#94a3b8;font-size:0.72rem;font-weight:400;line-height:1.4;margin-top:2px;">כשהמרקר דולק, לחיצה על שורה בספרים ובתפילות צובעת אותה בצהוב — כמו מרקר על דף. הסימון נשמר לפעם הבאה; לחיצה נוספת מוחקת אותו. הכפתור 🖍️ נמצא גם בראש כל ספר ותפילה.</small>' +
          "</span>" +
          '<span class="lux-sw' + (on ? " lux-sw-on" : "") + '"><span class="lux-sw-dot"></span></span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-marker-toggle").addEventListener("click", function () {
        var sw = field.querySelector(".lux-sw");
        var nowOn = !sw.classList.contains("lux-sw-on");
        // נקודת אמת אחת (מפתח + מתג + כפתורי הקוראים + צביעה/ניקוי); הטוסט המפורט נשאר כאן
        setMarkerOn(nowOn, true);
        if (typeof window.showToast === "function") {
          window.showToast(nowOn ? "🖍️ המרקר הופעל — לחיצה על שורה מסמנת אותה" : "המרקר כובה", "success", 2400);
        }
      });
    }
    injectToggle();
    setTimeout(injectToggle, 3000);
    setTimeout(injectToggle, 5000);
  });

  /* ── 8. תמה רביעית: "זהב מלכותי" ──────────────────────────────── */
  safe("royalTheme", function () {
    // תמת ה"ים" הוסרה מהאתר — משתמשים שנשארו עליה מועברים לבהיר
    try {
      if (localStorage.getItem("moadim_theme") === "blue" && typeof window.applyTheme === "function") {
        window.applyTheme("light");
      }
    } catch (e) {}
    var row = document.getElementById("theme-circle-dark");
    if (!row || !row.parentElement) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "theme-circle-royal";
    btn.className = "theme-circle w-12 h-12 rounded-full border-2 border-slate-300 dark:border-slate-600 transition-all flex items-center justify-center shadow-md hover:scale-110";
    btn.style.background = "linear-gradient(135deg,#3d1230,#1a0812)";
    btn.title = "עיצוב זהב מלכותי";
    btn.setAttribute("aria-label", "עיצוב זהב מלכותי");
    btn.innerHTML = "<span style='font-size:1.15rem;filter:drop-shadow(0 0 4px rgba(232,193,90,0.7));'>👑</span>";
    row.parentElement.appendChild(btn);

    function setRoyal(on) {
      document.documentElement.classList.toggle("lux-royal", on);
      btn.classList.toggle("theme-circle-active", on);
      try { localStorage.setItem("lux_royal", on ? "1" : "0"); } catch (_) {}
      if (on && typeof window.applyTheme === "function") {
        window.applyTheme("dark");
        // הטבעת הפעילה שייכת לכתר, לא לעיגול הכהה
        var dark = document.getElementById("theme-circle-dark");
        if (dark) dark.classList.remove("theme-circle-active");
        btn.classList.add("theme-circle-active");
      }
    }
    btn.addEventListener("click", function () {
      setRoyal(!document.documentElement.classList.contains("lux-royal"));
    });
    // בחירת תמה רגילה מבטלת את המצב המלכותי
    ["light", "dark"].forEach(function (t) {
      var el = document.getElementById("theme-circle-" + t);
      if (el) el.addEventListener("click", function () {
        document.documentElement.classList.remove("lux-royal");
        btn.classList.remove("theme-circle-active");
        try { localStorage.setItem("lux_royal", "0"); } catch (_) {}
      });
    });
    try {
      if (localStorage.getItem("lux_royal") === "1") setRoyal(true);
    } catch (_) {}
  });

  /* ── 9. דפדוף חודשים בלוח השנה ────────────────────────────────── */
  safe("calendarFlip", function () {
    if (typeof window.changeMonth !== "function") return;
    var orig = window.changeMonth;
    window.changeMonth = function () {
      var g = document.getElementById("cal-days-grid");
      if (g) {
        g.classList.remove("lux-flip");
        void g.offsetWidth;
        g.classList.add("lux-flip");
      }
      return orig.apply(this, arguments);
    };
  });

  /* ── 10. כפתור גלילה למעלה במובייל — מעל הניווט התחתון ─────────── */
  safe("scrollTopLift", function () {
    var b = document.getElementById("scroll-top-btn");
    if (b) b.style.bottom = "5.6rem";
  });

  /* ── 11. ניווט תחתון מותאם אישית + עורך בהגדרות ────────────────── */
  safe("bottomNav", function () {
    var NAV_ITEMS = [
      { id: "calendar", icon: "📅", label: "לוח שנה", run: function () { if (typeof window.openCalendar === "function") window.openCalendar(); } },
      { id: "sefarim", icon: "📚", label: "ספרים נוספים", run: function () { if (typeof window.openSefarimNosafimPage === "function") window.openSefarimNosafimPage(); } },
      { id: "tefilot", icon: "🙏", label: "תפילות נוספות", run: function () { if (typeof window.openTefilotNosafotPage === "function") window.openTefilotNosafotPage(); } },
      { id: "tehillim", icon: "📖", label: "תהילים", run: function () { if (typeof window.openTehillimPage === "function") window.openTehillimPage(); } },
      { id: "plan", icon: "🎯", label: "סדר לימוד אישי", run: function () {
        // יש כבר תוכנית לימוד — פותחים את הקורא שלה; אחרת — אשף יצירת תוכנית
        var plans = jget("lux_study_plans_v1", []);
        if (Array.isArray(plans) && plans.length && plans[0] && plans[0].id && typeof window.luxOpenPlanReader === "function") window.luxOpenPlanReader(plans[0].id);
        else if (typeof window.luxOpenPlanWizard === "function") window.luxOpenPlanWizard();
      } },
      { id: "zmanim", icon: "⏰", label: "זמנים", run: function () { var z = document.getElementById("halacha-banner"); if (z) z.scrollIntoView({ behavior: "smooth", block: "center" }); } },
      { id: "settings", icon: "⚙️", label: "הגדרות", run: function () { if (typeof window.toggleSettings === "function") window.toggleSettings(); } },
      { id: "clock", icon: "🕰️", label: "שעון הלכתי", run: function () { if (typeof window.luxOpenHalachicClock === "function") window.luxOpenHalachicClock(); } },
      { id: "datetool", icon: "🔄", label: "המרת תאריכים", run: function () { if (typeof window.luxOpenDateTool === "function") window.luxOpenDateTool(); } },
      { id: "chok", icon: "📜", label: "חוק לישראל", run: function () { if (typeof window.openChokLeIsraelModal === "function") window.openChokLeIsraelModal(); } },
      { id: "daf", icon: "📘", label: "דף היומי", run: function () {
        // אין פונקציה גלובלית — הקישור בדף מקבל onclick אחרי טעינת נתוני Hebcal
        var l = document.getElementById("daf-yomi-link");
        if (l && l.dataset && l.dataset.ready === "1") l.click();
        else if (typeof window.showToast === "function") window.showToast("הדף היומי עדיין נטען — נסו שוב בעוד רגע", "info");
      } },
      { id: "shnayim", icon: "📖", label: "שניים מקרא", run: function () {
        var l = document.getElementById("shnayim-mikra-link");
        if (l && l.dataset && l.dataset.ready === "1") l.click();
        else if (typeof window.showToast === "function") window.showToast("פרשת השבוע עדיין נטענת — נסו שוב בעוד רגע", "info");
      } },
      { id: "wheel", icon: "🎡", label: "גלגל השנה", run: function () { if (typeof window.luxOpenYearWheel === "function") window.luxOpenYearWheel(); } },
      { id: "stories", icon: "✨", label: "סיפורי היום", run: function () { if (typeof window.luxOpenStories === "function") window.luxOpenStories(); } },
      { id: "shabbat", icon: "🕯️", label: "מידע שבת", run: function () { if (typeof window.openShabbatInfoModal === "function") window.openShabbatInfoModal(); } },
      { id: "halakhah", icon: "⚖️", label: "הלכה יומית", run: function () { if (typeof window.luxOpenTrack === "function") window.luxOpenTrack("halakhah"); } },
      { id: "shul", icon: "🕍", label: "בתי כנסת", run: function () { location.href = "synagogues.html"; } },
      { id: "shir", icon: "🌹", label: "שיר השירים", run: function () { if (typeof window.openShirHashirimPage === "function") window.openShirHashirimPage(); } },
      { id: "benish", icon: "📗", label: "בן איש חי", run: function () { if (typeof window.openBenIshHaiPage === "function") window.openBenIshHaiPage(); } },
      { id: "hilulot", icon: "🕯️", label: "הילולות", run: function () { if (typeof window.openHilulotModal === "function") window.openHilulotModal(); } },
      { id: "search", icon: "🔍", label: "חיפוש", run: function () { if (typeof window.openGlobalSmartSearch === "function") window.openGlobalSmartSearch(); } },
      { id: "compass", icon: "🧭", label: "מצפן", run: function () { if (typeof window.openCompass === "function") window.openCompass(); } }
    ];
    // הסדר במערך = הסדר בסרגל; ב-RTL הפריט הראשון מוצג בקצה הימני
    var DEFAULT_SEL = ["sefarim", "tefilot", "tehillim", "plan", "settings"];
    var MAX_ITEMS = 5;
    var STORE_KEY = "lux_bottom_nav_v2";
    var OLD_STORE_KEY = "lux_bottom_nav";
    // הגירה: מי שכבר התאים אישית את הסרגל (מפתח ישן) שומר על הבחירה שלו;
    // ברירת המחדל החדשה חלה רק על מי שמעולם לא ערך את הסרגל
    try {
      if (localStorage.getItem(STORE_KEY) === null) {
        var oldSel = localStorage.getItem(OLD_STORE_KEY);
        if (oldSel !== null) localStorage.setItem(STORE_KEY, oldSel);
      }
    } catch (e) {}

    function byId(id) {
      for (var i = 0; i < NAV_ITEMS.length; i++) if (NAV_ITEMS[i].id === id) return NAV_ITEMS[i];
      return null;
    }
    function getSel() {
      try {
        var s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        if (Array.isArray(s)) {
          var valid = s.filter(byId);
          if (valid.length) return valid.slice(0, MAX_ITEMS);
        }
      } catch (e) {}
      return DEFAULT_SEL.slice();
    }
    function saveSel(sel) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(sel)); } catch (e) {}
    }

    function renderNav() {
      var nav = document.getElementById("lux-bottom-nav");
      if (!nav) return;
      nav.innerHTML = "";
      var sel = getSel();
      sel.forEach(function (id) {
        var item = byId(id);
        if (!item) return;
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", item.label);
        b.innerHTML = "<span class='lbn-ico' aria-hidden='true'>" + item.icon + "</span><span class='lbn-label'>" + item.label + "</span>";
        b.addEventListener("click", item.run);
        nav.appendChild(b);
      });
      // כשההגדרות זמינות בסרגל — אין צורך בגלגל השיניים העליון במובייל
      document.body.classList.toggle("lux-nav-has-settings", sel.indexOf("settings") !== -1);
    }
    renderNav();

    /* ── העורך ── */
    function openNavEditor() {
      var existing = document.getElementById("lux-nav-editor");
      if (existing) {
        // ghost-tap בנייד: נגיעה כפולה מיד אחרי הפתיחה נסגרה מיידית ונראתה כהבהוב
        if (Date.now() - (existing.__luxOpenedAt || 0) < 600) return;
        luxModalClose("lux-nav-editor");
        return;
      }
      var working = getSel();
      var overlay = document.createElement("div");
      overlay.id = "lux-nav-editor";
      overlay.__luxOpenedAt = Date.now();
      // שני אזורים: (א) תצוגה מקדימה חיה של הסרגל — גרירה לסידור, נגיעה להסרה;
      //             (ב) קטלוג הפריטים — נגיעה מוסיפה לסוף הסרגל / מסירה ממנו.
      overlay.innerHTML =
        "<div class='lux-ne-inner'>" +
          "<h3 class='lux-ne-title'>📱 עריכת סרגל הניווט</h3>" +
          "<p class='lux-ne-note'>בחרו עד " + MAX_ITEMS + " פריטים · גררו בסרגל למעלה כדי לשנות את הסדר (הראשון מימין)</p>" +
          "<div class='lux-ne-bar' id='lux-ne-bar' aria-label='תצוגה מקדימה של הסרגל'></div>" +
          "<div class='lux-ne-grid'></div>" +
          "<div class='lux-ne-actions'>" +
            "<button type='button' class='lux-ne-save'>שמור</button>" +
            "<button type='button' class='lux-ne-reset'>ברירת מחדל</button>" +
            "<button type='button' class='lux-ne-cancel'>ביטול</button>" +
          "</div>" +
        "</div>";
      var bar = overlay.querySelector("#lux-ne-bar");
      var grid = overlay.querySelector(".lux-ne-grid");

      // אחרי גרירה אמיתית — הסדר החדש נקרא מסדר ה-DOM של הסרגל (כמו ב-_poSave)
      function syncFromBar() {
        working = Array.prototype.slice.call(bar.querySelectorAll(".po-tile"))
          .map(function (t) { return t.getAttribute("data-id"); })
          .filter(byId);
        drawChips();
      }

      /* אזור א' — הסרגל החי */
      function drawBar() {
        bar.innerHTML = "";
        working.forEach(function (id) {
          var item = byId(id);
          if (!item) return;
          var slot = document.createElement("div");
          slot.className = "po-tile lux-ne-slot";
          slot.setAttribute("data-id", id);
          slot.setAttribute("role", "button");
          slot.setAttribute("tabindex", "0");
          slot.setAttribute("aria-label", item.label);
          slot.setAttribute("title", "גרירה לסידור · נגיעה להסרה");
          // ה-✕ הוא span (לא button) בכוונה — כדי שסורק ה-X האוניברסלי לא יזהה אותו ככפתור סגירה
          slot.innerHTML =
            "<span class='lux-ne-rm' aria-hidden='true'>✕</span>" +
            "<span class='lbn-ico' aria-hidden='true'>" + item.icon + "</span>" +
            "<span class='lbn-label'>" + item.label + "</span>";
          slot.addEventListener("click", function () {
            // click שמגיע מיד אחרי גרירה (pointer capture) — לא הסרה
            if (Date.now() - (bar.__poDragEndAt || 0) < 350) return;
            var i = working.indexOf(id);
            if (i !== -1) working.splice(i, 1);
            drawAll();
          });
          slot.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); slot.click(); }
          });
          bar.appendChild(slot);
        });
        // משבצות פנויות — ממחישות כמה מקום נשאר (לא נגררות: בלי po-tile)
        for (var k = working.length; k < MAX_ITEMS; k++) {
          var empty = document.createElement("div");
          empty.className = "lux-ne-slot lux-ne-slot-empty";
          empty.setAttribute("aria-hidden", "true");
          empty.innerHTML = "<span class='lbn-ico'>＋</span><span class='lbn-label'>פנוי</span>";
          bar.appendChild(empty);
        }
        // מנוע הגרירה נקשר לאריחים בזמן החיבור — חייבים לחבר מחדש אחרי כל ציור
        if (typeof window._poAttachDrag === "function") {
          window._poAttachDrag(bar, { itemSel: ".po-tile", onDrop: syncFromBar });
        }
      }

      /* אזור ב' — קטלוג הפריטים */
      function drawChips() {
        grid.innerHTML = "";
        NAV_ITEMS.forEach(function (item) {
          var idx = working.indexOf(item.id);
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "lux-ne-chip" + (idx !== -1 ? " lux-ne-on" : "");
          chip.innerHTML =
            (idx !== -1 ? "<span class='lux-ne-num'>" + (idx + 1) + "</span>" : "") +
            "<span class='lux-ne-ico'>" + item.icon + "</span>" +
            "<span class='lux-ne-lbl'>" + item.label + "</span>";
          chip.addEventListener("click", function () {
            var i = working.indexOf(item.id);
            if (i !== -1) working.splice(i, 1);
            else if (working.length < MAX_ITEMS) working.push(item.id);
            else {
              chip.classList.add("lux-ne-shake");
              setTimeout(function () { chip.classList.remove("lux-ne-shake"); }, 400);
              return;
            }
            drawAll();
          });
          grid.appendChild(chip);
        });
      }
      function drawAll() { drawBar(); drawChips(); }
      drawAll();

      overlay.querySelector(".lux-ne-save").addEventListener("click", function () {
        if (working.length) saveSel(working);
        renderNav();
        luxModalClose("lux-nav-editor");
      });
      overlay.querySelector(".lux-ne-reset").addEventListener("click", function () {
        working = DEFAULT_SEL.slice();
        drawAll();
      });
      overlay.querySelector(".lux-ne-cancel").addEventListener("click", function () {
        luxModalClose("lux-nav-editor");
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) luxModalClose("lux-nav-editor");
      });
      document.body.appendChild(overlay);
      luxModalOpen("lux-nav-editor");

    }

    // הזרקת כפתור פתיחת העורך להגדרות — מתחת ל"סידור כפתורי התפילות"
    var anchor = document.querySelector('#settings-modal button[onclick="openPrayerOrderEditor()"]');
    if (anchor && anchor.parentElement) {
      var field = document.createElement("div");
      field.innerHTML =
        '<label class="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">סרגל הניווט התחתון (מובייל)</label>' +
        '<button type="button" id="lux-nav-edit-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3">' +
          '<span class="font-semibold text-sm">📱 עריכת סרגל הניווט</span>' +
          '<span class="text-slate-400 text-xs">עד ' + MAX_ITEMS + " פריטים · גרירה לסידור</span>" +
        "</button>";
      anchor.parentElement.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-nav-edit-btn").addEventListener("click", openNavEditor);
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     LUX 3 — קשת שמש, גלגל שנה, מצב שבת, פנינה, סיור, רצף, הדפסה
     ═══════════════════════════════════════════════════════════════ */

  /* ── עזרים משותפים ── */
  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return "--:--"; }
  }
  function getCachedEvents() {
    try {
      var s = JSON.parse(localStorage.getItem("moadim_cached_events_v3") || "null");
      if (Array.isArray(s)) return s;
    } catch (e) {}
    return null;
  }
  function isGraMethod() {
    try { return String(localStorage.getItem("moadim_method") || "MGA").toUpperCase() === "GRA"; } catch (e) { return false; }
  }
  // מדלגים על זמני השיטה שלא נבחרה בהגדרות; במג"א נופלים לגר"א רק אם אין נתון מג"א
  function skipByMethod(key, times) {
    if (isGraMethod()) return key === "sofZmanShmaMGA" || key === "sofZmanTfillaMGA";
    if (key === "sofZmanShma") return !!times.sofZmanShmaMGA;
    if (key === "sofZmanTfilla") return !!times.sofZmanTfillaMGA;
    return false;
  }

  /* ── 12. "הזמן הבא" — שורה קומפקטית מעל פס היום ────────────────── */
  safe("nextZman", function () {
    // כל זמני היום — הקרוב ביותר נבחר מתוך כולם (כולל זמני לילה)
    var KEYS = [
      { k: "alotHaShachar", l: "עלות השחר" },
      { k: "misheyakir", l: "משיכיר" },
      { k: "sunrise", l: "הנץ החמה" },
      { k: "sofZmanShmaMGA", l: "סו\"ז ק\"ש (מג\"א)" },
      { k: "sofZmanShma", l: "סו\"ז ק\"ש (גר\"א)" },
      { k: "sofZmanTfillaMGA", l: "סו\"ז תפילה (מג\"א)" },
      { k: "sofZmanTfilla", l: "סו\"ז תפילה" },
      { k: "chatzot", l: "חצות היום" },
      { k: "minchaGedola", l: "מנחה גדולה" },
      { k: "minchaKetana", l: "מנחה קטנה" },
      { k: "plagHaMincha", l: "פלג המנחה" },
      { k: "sunset", l: "שקיעה" },
      { k: "beinHaShmashos", l: "בין השמשות" },
      { k: "tzeit7083deg", l: "צאת הכוכבים" },
      { k: "chatzotNight", l: "חצות הלילה" }
    ];
    var el = null;
    function build() {
      var dayBar = document.getElementById("zmanim-day-bar");
      if (!dayBar || document.getElementById("lux-next-zman")) return false;
      el = document.createElement("p");
      el.id = "lux-next-zman";
      dayBar.parentElement.insertBefore(el, dayBar);
      return true;
    }
    function update() {
      var z = window._lastZData;
      if (!z || !z.times) return;
      if (!el && !build()) return;
      var now = Date.now();
      var next = null;
      KEYS.forEach(function (item) {
        if (skipByMethod(item.k, z.times)) return;
        var iso = z.times[item.k];
        if (!iso) return;
        var ms = new Date(iso).getTime();
        if (ms > now && (!next || ms < next.ms)) next = { ms: ms, l: item.l, iso: iso };
      });
      // אחרי 00:00 האזרחי הנתונים כבר מתייחסים ליום החדש, וחצות הלילה
      // המדווח שייך ללילה הבא — חצות של הלילה הנוכחי הוא 24 שעות קודם
      if (z.times.chatzotNight) {
        var cnPrev = new Date(z.times.chatzotNight).getTime() - 86400000;
        if (cnPrev > now && (!next || cnPrev < next.ms)) {
          next = { ms: cnPrev, l: "חצות הלילה", iso: new Date(cnPrev).toISOString() };
        }
      }
      if (next) {
        var d = next.ms - now;
        var hh = Math.floor(d / 3600000), mm = Math.floor((d % 3600000) / 60000);
        // פורמט קצר בשורה אחת: "עוד 4:27 שע'" או "עוד 27 דק'"
        var rem = hh > 0 ? hh + ":" + (mm < 10 ? "0" : "") + mm + " שע'" : mm + " דק'";
        // מבנה קבוע של שני spans — העדכון השוטף (פעם בדקה) נוגע רק בטקסט
        // של ה-span האחורי, בלי להרוס ולבנות מחדש את צמתי השורה (innerHTML)
        if (!el.__luxNzMain) {
          el.innerHTML = "⏳ <b></b><span></span>";
          el.__luxNzMain = el.querySelector("b");
          el.__luxNzRem = el.querySelector("span");
        }
        var mainTxt = next.l + " · " + fmtTime(next.iso);
        var remTxt = " · עוד " + rem;
        if (el.__luxNzMain.textContent !== mainTxt) el.__luxNzMain.textContent = mainTxt;
        if (el.__luxNzRem.textContent !== remTxt) el.__luxNzRem.textContent = remTxt;
      } else {
        if (el.textContent !== "") { el.textContent = ""; el.__luxNzMain = null; el.__luxNzRem = null; }
      }
    }
    setInterval(update, 30000);
    var tries = 0;
    var boot = setInterval(function () {
      tries++;
      update();
      if (el || tries > 40) clearInterval(boot);
    }, 1500);
  });

  /* ── 13. גלגל השנה היהודית ─────────────────────────────────────── */
  safe("yearWheel", function () {
    function heMonthOf(date) {
      try {
        return new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" }).format(date);
      } catch (e) { return ""; }
    }
    function openWheel() {
      var old = document.getElementById("lux-year-wheel");
      if (old) {
        // ghost-tap בנייד: נגיעה כפולה מיד אחרי הפתיחה נסגרה מיידית ונראתה כהבהוב
        if (Date.now() - (old.__luxOpenedAt || 0) < 600) return;
        luxModalClose("lux-year-wheel");
        return;
      }
      var rawEvents = (getCachedEvents() || []).filter(function (e) {
        // כל החגים, המועדים והצומות — לא רק החגים הגדולים
        if (["major", "minor", "fast"].indexOf(e.type) === -1) return false;
        var nm = e.name || "";
        if (nm.indexOf("ערב ") === 0) return false;   // ערבי חגים — החג עצמו על הגלגל
        if (nm.indexOf("שבת ") === 0) return false;   // שבתות מיוחדות — אינן חגים
        if (nm.indexOf("מברכים") !== -1) return false;
        // יום השואה ויום העצמאות — לא מוצגים על הגלגל (לבקשת בעל האתר; נשארים
        // בכל שאר האתר). בדיקה לפי הכותרת האנגלית של Hebcal וגם לפי השם העברי —
        // התאמה מדויקת בלבד, כדי לא לפסול בטעות "יום כיפור"/"יום הכיפורים".
        var ttl = String(e.titleStr || "").replace(/[‘’]/g, "'");
        if (/^Yom HaShoah$|^Yom HaAtzma'ut$/.test(ttl)) return false;
        if (/^יום (השואה|העצמאות)$/.test(nm) || /^יום (השואה|העצמאות)$/.test(String(e.heb || ""))) return false;
        var d = new Date(e.date);
        var diff = (d - new Date()) / 86400000;
        // עד 363 — שלא ייחתך חג שיושב ממש בתפר (תשעה באב של השנה הבאה)
        return diff > -2 && diff < 363;
      });
      // חגים רב-יומיים (סוכות, פסח, חנוכה, ראש השנה) — אייקון אחד ביום הראשון,
      // אחרת כל יום מצטייר כעיגול נפרד והחודש הופך למריחת אייקונים צפופה
      var baseOf = function (nm) {
        if (/^ראש השנה [אב]'/.test(nm)) return "ראש השנה";
        if (nm.indexOf("סוכות ") === 0) return "סוכות";
        if (nm.indexOf("חנוכה") === 0) return "חנוכה";
        if (/^פסח [אבגדהוז]׳/.test(nm)) return "פסח";
        return null;
      };
      var events = [], groupRep = {};
      rawEvents.forEach(function (e) {
        var base = baseOf(e.name || "");
        if (!base) { events.push(e); return; }
        if (groupRep[base]) {
          // חבר נוסף באותו חג — רק מרחיבים את טווח התאריכים לתצוגה
          if (e.date > groupRep[base].until) groupRep[base].until = e.date;
          return;
        }
        var rep = { name: base, date: e.date, until: e.date, icon: e.icon, type: e.type };
        groupRep[base] = rep;
        events.push(rep);
      });
      var hebYear = "";
      try {
        var yNum = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(new Date()), 10);
        if (yNum) {
          // גימטריה ללא האלפים: 5786 → תשפ"ו
          var n = yNum % 1000;
          var tbl = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [19, "יט"], [18, "יח"], [17, "יז"], [16, "טז"], [15, "טו"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
          var out = "";
          tbl.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
          hebYear = out.length > 1 ? out.slice(0, -1) + '"' + out.slice(-1) : out;
        }
      } catch (e) {}
      var overlay = document.createElement("div");
      overlay.id = "lux-year-wheel";
      overlay.__luxOpenedAt = Date.now();
      overlay.innerHTML =
        '<div class="lux-yw-inner">' +
          '<button type="button" class="lux-yw-close" aria-label="סגור">✕</button>' +
          '<h3 class="lux-yw-title">🎡 גלגל השנה</h3>' +
          '<p class="lux-yw-sub">מסע של שנה — לחץ על חג כדי לגלות אותו</p>' +
          '<svg id="lux-yw-svg" viewBox="0 0 340 340"></svg>' +
          '<div id="lux-yw-info">✨ בחר חג מהגלגל ✨</div>' +
        "</div>";
      var svg = overlay.querySelector("#lux-yw-svg");
      var CX = 170, CY = 170, R = 132, RL = 106;
      var parts = [
        // טבעת חיצונית מקווקוות מסתובבת לאט
        '<circle class="lux-yw-dashring" cx="170" cy="170" r="150"/>',
        '<circle class="lux-yw-ring" cx="170" cy="170" r="132"/>',
        '<circle class="lux-yw-ring" cx="170" cy="170" r="86" style="opacity:0.35"/>',
        // זוהר מרכזי
        '<circle cx="170" cy="170" r="62" fill="url(#lux-yw-glow)"/>',
        '<defs><radialGradient id="lux-yw-glow"><stop offset="0" stop-color="rgba(232,193,90,0.20)"/><stop offset="1" stop-color="rgba(232,193,90,0)"/></radialGradient></defs>'
      ];
      // חודשי השנה העבריים — קווים מפרידים + תוויות.
      // אוספים קודם את גבולות החודשים, ואז מתייגים כל מקטע באמצעו —
      // כולל המקטע הראשון (החודש הנוכחי, למשל אלול) שקודם לכן לא קיבל תווית.
      // הכול מעוגן לחצות המקומית של היום (T0) — עיגון לשעה הנוכחית גרם
      // לאייקוני חגים "לזלוג" מעבר לקו החודש (ראש השנה הופיע באלול)
      var todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      var T0 = todayMid.getTime();
      var monthBounds = [];   // אינדקסי ימים שבהם מתחיל חודש חדש
      var monthNames = [heMonthOf(new Date(T0 + 43200000))];
      var prevM = monthNames[0];
      for (var day = 1; day <= 364; day++) {
        var d = new Date(T0 + day * 86400000 + 43200000); // אמצע היום — יציב מול שעון קיץ
        var m = heMonthOf(d);
        if (m && m !== prevM) {
          monthBounds.push(day);
          monthNames.push(m);
          prevM = m;
        }
      }
      // קו מפריד גם בנקודת סגירת המעגל (מתחת לסמן "היום") — שם המקטע
      // האחרון (אב) נפגש עם החודש הנוכחי (אלול) ובלעדיו הם נראים מחוברים
      monthBounds.concat([0]).forEach(function (bday) {
        var ang = (bday / 365) * 2 * Math.PI - Math.PI / 2;
        var x1 = CX + 86 * Math.cos(ang), y1 = CY + 86 * Math.sin(ang);
        var x2 = CX + (R + 4) * Math.cos(ang), y2 = CY + (R + 4) * Math.sin(ang);
        parts.push('<line class="lux-yw-tick" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>');
      });
      var segStarts = [0].concat(monthBounds);
      segStarts.forEach(function (start, si) {
        var end = si < monthBounds.length ? monthBounds[si] : 365;
        if (end - start < 6) return; // מקטע קצרצר — אין מקום לתווית
        var mid = (((start + end) / 2) / 365) * 2 * Math.PI - Math.PI / 2;
        var lx = CX + RL * Math.cos(mid), ly = CY + RL * Math.sin(mid);
        parts.push('<text class="lux-yw-monthlabel" x="' + lx.toFixed(1) + '" y="' + (ly + 3.5).toFixed(1) + '" text-anchor="middle">' + monthNames[si] + "</text>");
      });
      // מרכז: השנה העברית + התאריך של היום
      parts.push('<text class="lux-yw-year" x="170" y="166" text-anchor="middle">' + (hebYear || "") + "</text>");
      var todayHeb = luxHebDateStr();
      parts.push('<text class="lux-yw-today" x="170" y="190" text-anchor="middle">' + (todayHeb || "היום") + "</text>");
      // סמן "היום" פועם על הטבעת
      parts.push('<circle class="lux-yw-now" cx="170" cy="38" r="5"><animate attributeName="r" values="4.5;6.5;4.5" dur="2.2s" repeatCount="indefinite"/></circle>');
      parts.push('<text class="lux-yw-monthlabel" x="170" y="24" text-anchor="middle" style="fill:#fff;font-weight:900;">היום</text>');
      svg.innerHTML = parts.join("");
      // ── זום חודשי: לחיצה על אייקון מרחפת ומגדילה את כל אייקוני אותו
      //    החודש (הם צפופים); לחיצה במקום אחר מחזירה אותם למקומם ──
      var zoomedMonth = null;
      var evNodes = []; // { g, month, x, y, ang }
      function unzoomAll() {
        if (!zoomedMonth) return;
        zoomedMonth = null;
        svg.classList.remove("lux-yw-zoommode");
        evNodes.forEach(function (n) {
          n.g.classList.remove("lux-yw-zoomed");
          n.g.style.transform = "";
        });
      }
      function zoomMonth(mk) {
        unzoomAll();
        zoomedMonth = mk;
        svg.classList.add("lux-yw-zoommode");
        var group = evNodes.filter(function (n) { return n.month === mk; })
          .sort(function (a, b) { return a.ang - b.ang; });
        // פריסה סביב מרכז הקבוצה — הקשת מוגבלת כדי שהאייקונים המוגדלים
        // יישארו בתחום החודש שלהם ולא "ינחתו" על חודשים אחרים
        var mid = group.reduce(function (s, n) { return s + n.ang; }, 0) / group.length;
        var big = group.length >= 5;
        var GAP = Math.min(0.30, group.length > 1 ? 0.9 / (group.length - 1) : 0.30);
        var SCALE = big ? 1.5 : 1.75;
        group.forEach(function (n, gi) {
          var na = group.length === 1 ? mid : mid + (gi - (group.length - 1) / 2) * GAP;
          // קבוצה גדולה — שתי טבעות לסירוגין, כך אין חפיפה גם כשהקשת צפופה
          var RZ = big ? (gi % 2 === 0 ? 150 : 114) : 138;
          var nx = CX + RZ * Math.cos(na), ny = CY + RZ * Math.sin(na);
          n.g.classList.add("lux-yw-zoomed");
          // מרימים את המוגדלים לסוף ה-SVG — ב-SVG סדר הציור קובע מי למעלה,
          // אחרת אייקון מעומעם של חודש אחר מצטייר מעל המוגדל וגונב את הלחיצה
          svg.appendChild(n.g);
          n.g.style.transform = "translate(" + (nx - n.x).toFixed(1) + "px," + (ny - n.y).toFixed(1) + "px) scale(" + SCALE + ")";
        });
      }
      // חגים — אייקון אמיתי של כל חג על הטבעת, עם הילה זהב
      events.forEach(function (ev, i) {
        var diff = (new Date(ev.date) - new Date()) / 86400000;
        // מיקום לפי אינדקס היום מחצות (+0.5 = מרכז התא היומי) — כך אייקון
        // של א' בחודש יושב בבירור בתוך החודש שלו ולא על קו הגבול
        var dayIdx = Math.round((new Date(ev.date).getTime() - T0) / 86400000);
        var ang = ((Math.max(0, dayIdx) + 0.5) / 365) * 2 * Math.PI - Math.PI / 2;
        var x = CX + R * Math.cos(ang), y = CY + R * Math.sin(ang);
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "lux-yw-evt");
        g.innerHTML =
          '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" class="lux-yw-halo"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 4.2).toFixed(1) + '" text-anchor="middle" font-size="12">' + (ev.icon || "✨") + "</text>";
        var evMonth = heMonthOf(new Date(ev.date));
        evNodes.push({ g: g, month: evMonth, x: x, y: y, ang: ang });
        var c = g;
        c.addEventListener("click", function (e) {
          e.stopPropagation();
          // לחיצה ראשונה על חודש צפוף — קודם מרחפים ומגדילים את כל אייקוני החודש
          if (zoomedMonth !== evMonth) { zoomMonth(evMonth); return; }
          var info = overlay.querySelector("#lux-yw-info");
          var dateStr = new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
          // חג רב-יומי מאוחד — מציגים את כל הטווח שלו
          if (ev.until && ev.until !== ev.date) {
            dateStr += " – " + new Date(ev.until).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
          }
          var heb = "";
          try { heb = typeof window.getHebrewDateString === "function" ? window.getHebrewDateString(new Date(ev.date)) : ""; } catch (e) {}
          info.innerHTML =
            '<div class="lux-yw-evname">' + (ev.icon || "✨") + " " + ev.name + "</div>" +
            '<div style="color:rgba(191,219,254,0.8);font-size:0.8rem;">' + dateStr + (heb ? " · " + heb : "") + " · בעוד " + Math.round(diff) + ' ימים</div>' +
            '<div class="lux-yw-ctas">' +
              '<button type="button" id="lux-yw-goto">פתח בלוח המועדים ↓</button>' +
              '<button type="button" id="lux-yw-cal">📅 פתח בלוח השנה</button>' +
            '</div>';
          // הנעה לפעולה שנייה: פתיחת הלוח החודשי בחודש של המועד + הדגשת היום.
          // חייבים לחכות שהגלגל באמת הוסר (הסגירה עוברת דרך history.back() אסינכרוני) —
          // פתיחת מודאל לפני שה-popstate הגיע הייתה גורמת לו להיסגר מיד.
          info.querySelector("#lux-yw-cal").addEventListener("click", function () {
            var dateStr = ev.date;
            luxModalClose("lux-year-wheel");
            var t0 = Date.now();
            (function waitGone() {
              if (document.getElementById("lux-year-wheel") && Date.now() - t0 < 1600) { setTimeout(waitGone, 40); return; }
              setTimeout(function () {
                if (typeof window.openCalendarAt === "function") window.openCalendarAt(dateStr, { openDay: true });
                else if (typeof window.openCalendar === "function") window.openCalendar();
              }, 80);
            })();
          });
          info.querySelector("#lux-yw-goto").addEventListener("click", function () {
            luxModalClose("lux-year-wheel");
            setTimeout(function () {
              var cards = document.querySelectorAll("#resultsGrid .event-card h3");
              for (var j = 0; j < cards.length; j++) {
                // חג מאוחד ("סוכות") מוצא את הכרטיס של יומו הראשון ("סוכות א׳")
                if (cards[j].textContent.trim().indexOf(ev.name) === 0) {
                  var card = cards[j].closest(".event-card");
                  card.classList.add("lux-in");
                  card.scrollIntoView({ behavior: "smooth", block: "center" });
                  card.classList.remove("lux-card-flash");
                  void card.offsetWidth;
                  card.classList.add("lux-card-flash");
                  break;
                }
              }
            }, 180);
          });
        });
        svg.appendChild(c);
      });
      overlay.querySelector(".lux-yw-close").addEventListener("click", function () { luxModalClose("lux-year-wheel"); });
      overlay.addEventListener("click", function (e) {
        // בזמן זום חודשי — לחיצה בכל מקום אחר קודם מחזירה את האייקונים למקומם
        if (zoomedMonth && !e.target.closest(".lux-yw-evt") && !e.target.closest("#lux-yw-info")) {
          unzoomAll();
          return;
        }
        if (e.target === overlay) luxModalClose("lux-year-wheel");
      });
      document.body.appendChild(overlay);
      // כפתור "חזור" בטלפון סוגר את הגלגל במקום לצאת מהאפליקציה
      luxModalOpen("lux-year-wheel");

    }
    // חשיפה גלובלית — פריט "גלגל השנה" בסרגל הניווט התחתון
    window.luxOpenYearWheel = openWheel;
    // כפתור בהירו — אחרי כפתור הלוח החודשי
    var calBtn = document.getElementById("btn-open-calendar");
    if (!calBtn) return;
    var b = document.createElement("button");
    b.type = "button";
    b.id = "lux-year-wheel-btn";
    b.innerHTML = "<span>🎡</span><span>גלגל השנה</span>";
    b.addEventListener("click", openWheel);
    calBtn.insertAdjacentElement("afterend", b);
    // מוסתר עד שהדשבורד נטען — כמו שאר הכפתורים
    b.style.display = "none";
    var vis = setInterval(function () {
      if (!calBtn.classList.contains("hidden") && calBtn.style.display !== "none") {
        b.style.display = "";
        clearInterval(vis);
      }
    }, 800);
  });

  /* ── 15. ברכת שלום חכמה ────────────────────────────────────────── */
  // התאריך העברי לתצוגה: היממה העברית מתחלפת בצאת הכוכבים, לא בחצות
  function luxHebDateStr() {
    var d = new Date();
    try {
      var z = window._lastZData;
      var tzeit = z && z.times && z.times.tzeit7083deg ? new Date(z.times.tzeit7083deg).getTime() : null;
      if (tzeit !== null) {
        if (Date.now() > tzeit) d = new Date(Date.now() + 86400000);
      } else if (d.getHours() >= 20) {
        // אין עדיין נתוני זמנים — קירוב: אחרי 20:00 כבר ודאי אחרי צאת הכוכבים בארץ
        d = new Date(Date.now() + 86400000);
      }
    } catch (e) {}
    try {
      return typeof window.getHebrewDateString === "function" ? window.getHebrewDateString(d) : "";
    } catch (e) { return ""; }
  }
  safe("greeting", function () {
    var h1 = document.querySelector("#hero-section h1");
    if (!h1) return;
    var h = new Date().getHours();
    var day = new Date().getDay();
    var greet = h >= 5 && h < 12 ? "☀️ בוקר טוב" : h >= 12 && h < 17 ? "🌤️ צהריים טובים" : h >= 17 && h < 21 ? "🌆 ערב טוב" : "🌙 לילה טוב";
    if (day === 5 && h >= 12) greet = "🕯️ שבת שלום";
    if (day === 6) greet = "✨ שבוע טוב";
    var el = document.createElement("div");
    el.id = "lux-greeting";
    function paint(force) {
      var heb = luxHebDateStr();
      var base = greet + (heb ? ' · <span class="lux-greet-date">' + heb + "</span>" : "");
      // ציור מחדש רק כשמשהו השתנה — כתיבת innerHTML זהה כל 1.5 שניות מרצדת בנייד
      if (!force && el.__luxGreetBase === base) return;
      el.__luxGreetBase = base;
      el.innerHTML = base;
      // עיטור השם האישי מוחל אחרי כל ציור מחדש (מוגדר בפיצ'ר personalName)
      if (window.__luxNameDecorate) window.__luxNameDecorate(el);
    }
    paint();
    h1.insertAdjacentElement("beforebegin", el);
    // ביטחון: אנימציית הכניסה (lux-rise) קופאת אם ציר האנימציות מושהה
    // (רקע/PWA מוקפא) והברכה נשארת שקופה — משלימים אותה ידנית אחרי החלון
    setTimeout(function () {
      if (parseFloat(getComputedStyle(el).opacity) < 0.95) {
        el.style.opacity = "1";
        el.style.animation = "none";
        try {
          el.getAnimations().forEach(function (a) {
            try { a.finish(); } catch (e1) { try { a.cancel(); } catch (e2) {} }
          });
        } catch (e) {}
      }
    }, 1300);
    window.addEventListener("lux-name-changed", function () { paint(true); });
    // עדכון כשנתוני הזמנים מגיעים (התאריך עשוי להתקדם ביום אחרי צאת הכוכבים)
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      paint();
      if ((window._lastZData && window._lastZData.times) || tries > 20) clearInterval(t);
    }, 1500);
    // ובכל רבע שעה — למקרה שצאת הכוכבים עוברת בזמן שהדף פתוח
    setInterval(paint, 15 * 60000);
  });

  /* ── 16. מצב שבת אוטומטי (הספירה לאחור נשארת!) ─────────────────── */
  safe("shabbatMode", function () {
    var banner = null;
    function ensureBanner() {
      if (banner) return;
      var wrap = document.getElementById("shabbat-countdown-wrap");
      if (!wrap) return;
      banner = document.createElement("div");
      banner.id = "lux-shabbat-banner";
      var isChag = /חג/.test((document.getElementById("countdown-event-type") || {}).textContent || "");
      banner.innerHTML =
        '<div class="lux-sb-candles">🕯️🕯️</div>' +
        '<div class="lux-sb-title">' + (isChag ? "חג שמח" : "שבת שלום") + "</div>";
      wrap.insertAdjacentElement("beforebegin", banner);
    }
    function check() {
      var disp = document.getElementById("countdown-display");
      var type = document.getElementById("countdown-event-type");
      if (!disp || !type) return;
      var txt = (disp.textContent || "").trim();
      var m = txt.match(/^(\d+):(\d{2}):(\d{2})$/);
      var isEntry = /כניסת/.test(type.textContent || "");
      var mins = m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
      var on = isEntry && mins !== null && mins < 30;
      if (on) ensureBanner();
      document.body.classList.toggle("lux-shabbat", !!on);
    }
    setInterval(check, 20000);
    setTimeout(check, 4000);
  });

  /* ── 17. פנינה יומית ───────────────────────────────────────────── */
  safe("dailyPearl", function () {
    var PEARLS = [
      { t: "אֵיזֶהוּ עָשִׁיר? הַשָּׂמֵחַ בְּחֶלְקוֹ", s: "פרקי אבות ד, א" },
      { t: "אִם אֵין אֲנִי לִי, מִי לִי? וּכְשֶׁאֲנִי לְעַצְמִי, מָה אֲנִי?", s: "פרקי אבות א, יד" },
      { t: "עַל שְׁלֹשָׁה דְבָרִים הָעוֹלָם עוֹמֵד: עַל הַתּוֹרָה וְעַל הָעֲבוֹדָה וְעַל גְּמִילוּת חֲסָדִים", s: "פרקי אבות א, ב" },
      { t: "אֵיזֶהוּ חָכָם? הַלּוֹמֵד מִכָּל אָדָם", s: "פרקי אבות ד, א" },
      { t: "אֵיזֶהוּ גִבּוֹר? הַכּוֹבֵשׁ אֶת יִצְרוֹ", s: "פרקי אבות ד, א" },
      { t: "וֶהֱוֵי מְקַבֵּל אֶת כָּל הָאָדָם בְּסֵבֶר פָּנִים יָפוֹת", s: "פרקי אבות א, טו" },
      { t: "לֹא עָלֶיךָ הַמְּלָאכָה לִגְמֹר, וְלֹא אַתָּה בֶן חוֹרִין לִבָּטֵל מִמֶּנָּה", s: "פרקי אבות ב, טז" },
      { t: "עוֹלָם חֶסֶד יִבָּנֶה", s: "תהילים פט, ג" },
      { t: "זֶה הַיּוֹם עָשָׂה ה' נָגִילָה וְנִשְׂמְחָה בוֹ", s: "תהילים קיח, כד" },
      { t: "טוֹב לְהֹדוֹת לַה' וּלְזַמֵּר לְשִׁמְךָ עֶלְיוֹן", s: "תהילים צב, ב" },
      { t: "אַל תִּסְתַּכֵּל בַּקַּנְקַן, אֶלָּא בְּמַה שֶּׁיֶּשׁ בּוֹ", s: "פרקי אבות ד, כ" },
      { t: "יְהִי כְבוֹד חֲבֵרְךָ חָבִיב עָלֶיךָ כְּשֶׁלָּךְ", s: "פרקי אבות ב, י" },
      { t: "בְּמָקוֹם שֶׁאֵין אֲנָשִׁים, הִשְׁתַּדֵּל לִהְיוֹת אִישׁ", s: "פרקי אבות ב, ה" },
      { t: "כָּל יִשְׂרָאֵל עֲרֵבִים זֶה בָּזֶה", s: "שבועות לט ע\"א" },
      { t: "גָּדוֹל הַשָּׁלוֹם, שֶׁכָּל הַתּוֹרָה נִתְּנָה לַעֲשׂוֹת שָׁלוֹם בָּעוֹלָם", s: "רמב\"ם, חנוכה ד, יד" },
      { t: "הַיּוֹם קָצָר וְהַמְּלָאכָה מְרֻבָּה... וּבַעַל הַבַּיִת דּוֹחֵק", s: "פרקי אבות ב, טו" },
      { t: "עֲשֵׂה לְךָ רַב, וּקְנֵה לְךָ חָבֵר", s: "פרקי אבות א, ו" },
      { t: "מִצְוָה גּוֹרֶרֶת מִצְוָה", s: "פרקי אבות ד, ב" },
      { t: "כָּל הַמְקַיֵּם נֶפֶשׁ אַחַת — כְּאִלּוּ קִיֵּם עוֹלָם מָלֵא", s: "סנהדרין ד, ה" },
      { t: "וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ", s: "ויקרא יט, יח" },
      { t: "טוֹב שֵׁם מִשֶּׁמֶן טוֹב", s: "קהלת ז, א" }
    ];
    var main = document.getElementById("main-content");
    var nav = main ? main.querySelector("nav") : null;
    if (!main || !nav) return;
    var start = new Date(new Date().getFullYear(), 0, 0);
    var doy = Math.floor((Date.now() - start) / 86400000);
    var p = PEARLS[doy % PEARLS.length];
    var el = document.createElement("aside");
    el.id = "lux-pearl";
    el.setAttribute("aria-label", "פנינה יומית");
    el.innerHTML =
      '<p class="lux-pearl-text">"' + p.t + '"</p>' +
      '<p class="lux-pearl-src">— ' + p.s + "</p>";
    nav.insertAdjacentElement("afterend", el);
  });

  /* ── 18. שיתוף זמני היום כתמונה ────────────────────────────────── */
  safe("shareZmanim", function () {
    var heading = document.querySelector('#halacha-banner h2[data-i18n-key="zmanim"]');
    if (!heading) return;
    var tools = document.createElement("span");
    tools.className = "lux-zmanim-tools";
    tools.innerHTML =
      '<button type="button" id="lux-share-zmanim">📤 שתף</button>' +
      '<button type="button" id="lux-print-zmanim">🖨️ הדפס</button>';
    heading.appendChild(tools);
    // ריפוי-עצמי: אם משהו ניתק את הכפתורים מהכותרת (בעבר applyTranslations של
    // script.js מחק את ילדי ה-h2 בכל רינדור של רשימת האירועים — "הכפתורים נעלמו
    // עד רענון") — מחברים מחדש את אותו צומת (המאזינים שלו נשמרים).
    var banner = document.getElementById("halacha-banner") || heading.parentElement;
    function ensureTools() {
      if (tools.isConnected) return;
      var h = document.querySelector('#halacha-banner h2[data-i18n-key="zmanim"]');
      if (h) h.appendChild(tools);
    }
    window.__luxEnsureZmanimTools = ensureTools;
    try {
      if (banner && window.MutationObserver) {
        new MutationObserver(function () { ensureTools(); }).observe(banner, { childList: true, subtree: true });
      }
    } catch (e) {}
    document.addEventListener("visibilitychange", function () { if (!document.hidden) ensureTools(); });
    setInterval(ensureTools, 3000);

    function collectZmanim() {
      var out = [];
      document.querySelectorAll("#zmanim-details > div[data-zman-key]").forEach(function (c) {
        var l = c.querySelector("span:first-child"), v = c.querySelector("span[dir='ltr']");
        if (l && v && v.textContent.trim() !== "--:--") out.push({ l: l.textContent.trim(), v: v.textContent.trim() });
      });
      return out;
    }
    function headerInfo() {
      var city = localStorage.getItem("moadim_city_name") || "";
      var heb = "";
      try { heb = typeof window.getHebrewDateString === "function" ? window.getHebrewDateString(new Date()) : ""; } catch (e) {}
      var greg = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
      return { city: city, heb: heb, greg: greg };
    }

    document.getElementById("lux-share-zmanim").addEventListener("click", function (ev) {
      ev.stopPropagation();
      var items = collectZmanim();
      if (!items.length) return;
      var info = headerInfo();
      var W = 1080, H = 1350;
      var cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      // רקע
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#050b1a"); g.addColorStop(0.55, "#0c1530"); g.addColorStop(1, "#16233f");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // זוהר זהב
      var rg = ctx.createRadialGradient(W / 2, 0, 60, W / 2, 0, 700);
      rg.addColorStop(0, "rgba(232,193,90,0.16)"); rg.addColorStop(1, "rgba(232,193,90,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      // מסגרת
      ctx.strokeStyle = "rgba(224,183,79,0.65)"; ctx.lineWidth = 5;
      ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.strokeStyle = "rgba(224,183,79,0.3)"; ctx.lineWidth = 1.5;
      ctx.strokeRect(56, 56, W - 112, H - 112);
      ctx.textAlign = "center"; ctx.direction = "rtl";
      // כותרות
      ctx.fillStyle = "#f2d98a";
      ctx.font = "900 76px 'Frank Ruhl Libre', serif";
      ctx.fillText("זמני היום", W / 2, 175);
      ctx.fillStyle = "#dbe7ff";
      ctx.font = "700 40px Assistant, sans-serif";
      ctx.fillText(info.heb, W / 2, 245);
      ctx.fillStyle = "rgba(191,219,254,0.75)";
      ctx.font = "600 32px Assistant, sans-serif";
      ctx.fillText(info.greg + (info.city ? " · " + info.city : ""), W / 2, 298);
      // קו
      ctx.strokeStyle = "rgba(224,183,79,0.5)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200, 340); ctx.lineTo(W - 200, 340); ctx.stroke();
      // זמנים
      var rows = items.slice(0, 14);
      var y0 = 410, rh = Math.min(64, (H - 520) / rows.length);
      rows.forEach(function (it, i) {
        var y = y0 + i * rh;
        ctx.textAlign = "right";
        ctx.fillStyle = "#e8eefc";
        ctx.font = "700 36px Assistant, sans-serif";
        ctx.fillText(it.l, W - 150, y);
        ctx.textAlign = "left";
        ctx.fillStyle = "#f2d98a";
        ctx.font = "800 38px Assistant, sans-serif";
        ctx.fillText(it.v, 150, y);
        ctx.strokeStyle = "rgba(148,180,255,0.12)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(150, y + rh / 3); ctx.lineTo(W - 150, y + rh / 3); ctx.stroke();
      });
      // פוטר
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(242,217,138,0.85)";
      ctx.font = "800 34px Assistant, sans-serif";
      ctx.fillText("✡ הלוח היהודי", W / 2, H - 130);
      ctx.fillStyle = "rgba(191,219,254,0.6)";
      ctx.font = "600 26px Assistant, sans-serif";
      ctx.fillText("jewishcalendar.co.il", W / 2, H - 85);

      cv.toBlob(function (blob) {
        if (!blob) return;
        var file = new File([blob], "zmanim.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: "זמני היום" }).catch(function () {});
        } else {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "zmanim.png";
          a.click();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        }
      }, "image/png");
    });

    /* ── 19. לוח זמנים להדפסה ── */
    document.getElementById("lux-print-zmanim").addEventListener("click", function (ev) {
      ev.stopPropagation();
      var items = collectZmanim();
      if (!items.length) return;
      var info = headerInfo();
      var old = document.getElementById("lux-print-sheet");
      if (old) old.remove();
      var sheet = document.createElement("div");
      sheet.id = "lux-print-sheet";
      var shabbatEnter = (document.getElementById("shabbat-enter") || {}).textContent || "";
      var shabbatExit = (document.getElementById("shabbat-exit") || {}).textContent || "";
      var extra = "";
      if (shabbatEnter && shabbatEnter !== "--:--") {
        extra = "<tr><td>🕯️ כניסת שבת</td><td>" + shabbatEnter + "</td></tr>" +
                "<tr><td>✨ יציאת שבת</td><td>" + shabbatExit + "</td></tr>";
      }
      sheet.innerHTML =
        '<div class="lux-pr-title">✡ זמני היום ✡</div>' +
        '<div class="lux-pr-sub">' + info.heb + " · " + info.greg + (info.city ? " · " + info.city : "") + "</div>" +
        "<table><tbody>" +
        items.map(function (it) { return "<tr><td>" + it.l + "</td><td>" + it.v + "</td></tr>"; }).join("") +
        extra +
        "</tbody></table>" +
        '<div class="lux-pr-foot">הופק ע"י הלוח היהודי · jewishcalendar.co.il</div>';
      document.body.appendChild(sheet);
      window.print();
    });
  });

  /* ── 20. משיכה לרענון במובייל ──────────────────────────────────── */
  safe("pullToRefresh", function () {
    if (!("ontouchstart" in window)) return;
    var ind = document.createElement("div");
    ind.id = "lux-ptr";
    ind.innerHTML = '<svg viewBox="0 0 512 512" fill="none"><path d="M256 112L371 312H141Z" stroke="#f2d98a" stroke-width="34" stroke-linejoin="round"/><path d="M256 400L371 200H141Z" stroke="#f2d98a" stroke-width="34" stroke-linejoin="round"/></svg>';
    document.body.appendChild(ind);
    var startY = null, pulling = false, THRESH = 95;
    // האם מותר למשוך-לרענון מנקודת המגע הזו?
    // חשוב: כשמודאל פתוח script.js נועל את הגוף (position:fixed) ואז
    // window.scrollY תמיד 0 — לכן חובה לבדוק את מצב הגוף ואת נתיב המגע.
    function ptrAllowed(target) {
      if (window.scrollY > 0) return false;
      var bs = document.body.style;
      if (bs.position === "fixed" || bs.overflow === "hidden") return false;
      // שכבות-על של lux שאינן נועלות את הגוף
      if (document.querySelector(".lux-sheet-overlay, #lux-year-wheel, #lux-nav-editor, #hilulot-modal, #hilulot-cal-modal, #moad-torah-modal, #shabbat-info-modal, #lux-selichot-reader, #lux-tour-overlay")) return false;
      // כל גלילה פנימית או שכבה קבועה בנתיב המגע — לא מרעננים
      var el = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.nodeType === 1) {
          var cs;
          try { cs = getComputedStyle(el); } catch (err) { cs = null; }
          if (cs) {
            if (el.scrollHeight > el.clientHeight + 4 &&
                (cs.overflowY === "auto" || cs.overflowY === "scroll")) return false;
            if (cs.position === "fixed") return false;
          }
        }
        el = el.parentElement;
      }
      return true;
    }
    document.addEventListener("touchstart", function (e) {
      if (ptrAllowed(e.target)) {
        startY = e.touches[0].clientY;
        pulling = true;
      } else pulling = false;
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (!pulling || startY === null) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 25 && window.scrollY <= 0) {
        ind.style.top = Math.min(28, -64 + dy * 0.55) + "px";
      }
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!pulling || startY === null) return;
      var dy = e.changedTouches[0].clientY - startY;
      if (dy > THRESH && window.scrollY <= 0) {
        ind.style.top = "28px";
        ind.classList.add("lux-ptr-spin");
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) {} }
        setTimeout(function () { location.reload(); }, 550);
      } else {
        ind.style.top = "-64px";
      }
      startY = null; pulling = false;
    }, { passive: true });
  });

  /* ── 21. רצף לימוד ─────────────────────────────────────────────── */
  safe("streak", function () {
    var KEY = "lux_streak";
    function today() { return new Date().toISOString().slice(0, 10); }
    function get() {
      try { return JSON.parse(localStorage.getItem(KEY) || "null") || { last: null, count: 0 }; } catch (e) { return { last: null, count: 0 }; }
    }
    function record() {
      var s = get();
      var t = today();
      if (s.last === t) return s;
      var y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      s.count = s.last === y ? s.count + 1 : 1;
      s.last = t;
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
      renderPill();
      if (s.count > 1 && s.count % 7 === 0) luxConfetti();
      return s;
    }
    function renderPill() {
      var s = get();
      var el = document.getElementById("lux-streak");
      if (s.count < 2) { if (el) el.remove(); return; }
      if (!el) {
        var host = document.querySelector("#halacha-banner .border-t");
        if (!host) return;
        el = document.createElement("div");
        el.id = "lux-streak";
        host.insertAdjacentElement("beforebegin", el);
      }
      el.innerHTML = "🔥 רצף לימוד: <b>" + s.count + " ימים</b>";
      el.title = "נכנסת ללימוד (תהילים / דף יומי / חוק לישראל) " + s.count + " ימים ברצף";
    }
    // מעקב: תהילים, ספרים, ודף יומי/חוק לישראל
    ["openTehillimPage", "openBenIshHaiPage", "openChokLeIsraelModal", "openSefarimNosafimPage"].forEach(function (fn) {
      if (typeof window[fn] === "function") {
        var orig = window[fn];
        window[fn] = function () { record(); return orig.apply(this, arguments); };
      }
    });
    var daf = document.getElementById("daf-yomi-link");
    if (daf) daf.addEventListener("click", record);
    setTimeout(renderPill, 3000);
  });

  /* ── 22. קיצורי PWA (?open=...) ────────────────────────────────── */
  safe("shortcuts", function () {
    var m = location.search.match(/[?&]open=(\w+)/);
    if (!m) return;
    var target = m[1];
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (tries > 30) { clearInterval(t); return; }
      var ready = document.getElementById("dashboard-state") && !document.getElementById("dashboard-state").classList.contains("hidden");
      if (!ready) return;
      clearInterval(t);
      setTimeout(function () {
        if (target === "tehillim" && typeof window.openTehillimPage === "function") window.openTehillimPage();
        else if (target === "calendar" && typeof window.openCalendar === "function") window.openCalendar();
        else if (target === "sefarim" && typeof window.openSefarimNosafimPage === "function") window.openSefarimNosafimPage();
        else if (target === "zmanim") {
          var z = document.getElementById("halacha-banner");
          if (z) z.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 600);
    }, 500);
  });

  /* ═══════════════════════════════════════════════════════════════
     LUX 4 — עזרי מודאל+היסטוריה, שם אישי, חיפוש-על, תזכורות, באנרים,
     מעקב תהילים, שמות לתפילה, יארצייטים, הישגים, נתוני ווידג'טים
     ═══════════════════════════════════════════════════════════════ */

  /* עזרי מודאל: שילוב עם ניהול כפתור "חזור" של האתר.
     luxModalOpen גם נועל את גלילת הרקע דרך המנגנון של script.js
     (position:fixed ששומר את מיקום הגלילה). האיזון מובטח: כל סגירה
     של פופאפ lux עוברת דרך popstate → removeModalById → unlockBodyScroll. */
  function luxModalOpen(id) {
    try { if (typeof window.pushModalState === "function") window.pushModalState(id); } catch (e) {}
    try { if (typeof window.lockBodyScroll === "function") window.lockBodyScroll(); } catch (e) {}
  }
  function luxModalClose(id) {
    try {
      if (typeof window._closePopupViaBack === "function") { window._closePopupViaBack(id); return; }
    } catch (e) {}
    var el = document.getElementById(id);
    if (el) el.remove();
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function jget(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "null");
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function jset(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) {}
    // האחסון מלא (בד"כ מטמון הספרים sn-cache-*) — מפנים מקום ומנסים שוב,
    // אחרת נתונים חשובים (סדרי לימוד, רצפים) נעלמים בשקט
    try {
      var doomed = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && (k.indexOf("sn-cache-") === 0 || k.indexOf("lux_sef_cal_") === 0)) doomed.push(k);
      }
      doomed.slice(0, 80).forEach(function (k) { localStorage.removeItem(k); });
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e2) {
      if (typeof window.showToast === "function") window.showToast("⚠️ האחסון המקומי מלא — לא ניתן לשמור", "error", 3500);
      return false;
    }
  }
  /* מודאל קלף גנרי — נסגר גם בכפתור "חזור" בטלפון */
  function luxSheet(id, innerHtml) {
    var old = document.getElementById(id);
    if (old) {
      // לחיצה כפולה מהירה (ghost-tap בנייד) — מתעלמים במקום לסגור-ולפתוח,
      // אחרת הפופאפ "מרצד" ונטען פעמיים
      if (Date.now() - (old.__luxOpenedAt || 0) < 600) return null;
      luxModalClose(id);
      return null;
    }
    var overlay = document.createElement("div");
    overlay.id = id;
    overlay.__luxOpenedAt = Date.now();
    overlay.className = "lux-sheet-overlay";
    overlay.innerHTML = '<div class="lux-sheet">' + innerHtml + "</div>";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) luxModalClose(id); });
    // כל יריעה מקבלת X עליון קבוע — מובנה, בלי לחכות לסורק האוניברסלי
    var ux = document.createElement("button");
    ux.type = "button";
    ux.className = "lux-ux";
    ux.setAttribute("aria-label", "סגירת החלון");
    ux.textContent = "✕";
    ux.addEventListener("click", function (e) { e.stopPropagation(); luxModalClose(id); });
    overlay.appendChild(ux);
    document.body.appendChild(overlay);
    luxModalOpen(id);

    return overlay;
  }

  /* ── 24. שם אישי בברכה ─────────────────────────────────────────── */
  safe("personalName", function () {
    // מעטר את שורת הברכה — נקרא מתוך paint() של הברכה אחרי כל ציור מחדש
    window.__luxNameDecorate = function (el) {
      var name = "";
      try { name = localStorage.getItem("lux_user_name") || ""; } catch (e) {}
      // בלי שם — הברכה נשארת נקייה; הגדרת השם נעשית רק דרך ⚙️ ההגדרות
      if (!name) return;
      var html = el.innerHTML;
      var sep = html.indexOf(" · ");
      el.innerHTML = sep !== -1
        ? html.slice(0, sep) + ", <b>" + esc(name) + "</b>" + html.slice(sep)
        : html + ", <b>" + esc(name) + "</b>";
    };
    // אם הברכה כבר צוירה לפני שהוגדרנו — מעטרים עכשיו
    var g0 = document.getElementById("lux-greeting");
    if (g0) window.__luxNameDecorate(g0);
    function askName() {
      var current = "";
      try { current = localStorage.getItem("lux_user_name") || ""; } catch (e) {}
      var ov = luxSheet("lux-name-modal",
        '<h3 class="lux-sheet-title">👋 נעים להכיר</h3>' +
        '<p class="lux-sheet-note">השם נשמר רק במכשיר שלך — לברכה אישית בכניסה</p>' +
        '<input type="text" id="lux-name-input" class="lux-sheet-input" maxlength="20" placeholder="השם שלך..." value="' + esc(current) + '">' +
        '<div class="lux-sheet-actions">' +
          '<button type="button" class="lux-sheet-primary" id="lux-name-save">שמור</button>' +
          (current ? '<button type="button" class="lux-sheet-secondary" id="lux-name-clear">הסר שם</button>' : "") +
          '<button type="button" class="lux-sheet-cancel">ביטול</button>' +
        "</div>");
      if (!ov) return;
      ov.querySelector("#lux-name-save").addEventListener("click", function () {
        var v = (ov.querySelector("#lux-name-input").value || "").trim().slice(0, 20);
        var isNew = v && !current;
        try { if (v) localStorage.setItem("lux_user_name", v); } catch (e) {}
        luxModalClose("lux-name-modal");
        setTimeout(function () { window.dispatchEvent(new Event("lux-name-changed")); }, 150);
        // בפעם הראשונה — מספרים איפה משנים את השם מעכשיו
        if (isNew && typeof window.showToast === "function") {
          setTimeout(function () {
            window.showToast("💾 השם נשמר! אפשר לשנות אותו בכל עת דרך ⚙️ ההגדרות", "success", 4000);
          }, 400);
        }
      });
      var clr = ov.querySelector("#lux-name-clear");
      if (clr) clr.addEventListener("click", function () {
        try { localStorage.removeItem("lux_user_name"); } catch (e) {}
        luxModalClose("lux-name-modal");
        setTimeout(function () { window.dispatchEvent(new Event("lux-name-changed")); }, 150);
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-name-modal"); });
    }
    // כפתור "שינוי שם" בהגדרות — הדרך הקבועה לשנות את השם אחרי הבחירה הראשונה
    function injectNameBtn() {
      var anchor = document.getElementById("lux-marker-toggle") || document.getElementById("lux-dt-btn") || document.getElementById("lux-tour-btn");
      if (!anchor || document.getElementById("lux-name-settings-btn")) return;
      var host = anchor.closest("div");
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-name-settings-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span class="font-semibold text-sm">✏️ השם שלי בברכה</span>' +
          '<span style="color:#94a3b8;font-size:0.8rem;">הוספה / שינוי / הסרה</span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-name-settings-btn").addEventListener("click", function () {
        if (typeof window.toggleSettings === "function") window.toggleSettings();
        setTimeout(askName, 250);
      });
    }
    injectNameBtn();
    setTimeout(injectNameBtn, 3000);
    setTimeout(injectNameBtn, 5500);
  });

  /* ── 25. חיפוש-על: תוצאות חכמות מתחת לתיבת החיפוש ──────────────── */
  safe("smartSearch", function () {
    var input = document.getElementById("mainSearch");
    if (!input) return;
    var CATALOG = [
      { t: "תפילת הדרך", i: "🚗", run: function () { window.openPrayer && window.openPrayer("tefillat-haderech", "תפילת הדרך", "Traveler's Prayer"); } },
      { t: "ברכת המזון", i: "🍞", run: function () { window.openPrayer && window.openPrayer("birkat-hamazon", "ברכת המזון", "Birkat Hamazon"); } },
      { t: "תיקון הכללי", i: "🔥", run: function () { window.openPrayer && window.openPrayer("tikkun-haklali", "תיקון הכללי", "Tikkun HaKlali"); } },
      { t: "תפילת שחרית", i: "🌅", run: function () { window.openPrayer && window.openPrayer("shacharit", "תפילת שחרית", "Shacharit"); } },
      { t: "תפילת מנחה", i: "🌤️", run: function () { window.openPrayer && window.openPrayer("mincha", "תפילת מנחה", "Mincha"); } },
      { t: "תפילת ערבית", i: "🌙", run: function () { window.openPrayer && window.openPrayer("maariv", "תפילת ערבית", "Maariv"); } },
      { t: "ברכות השחר", i: "☀️", run: function () { window.openPrayer && window.openPrayer("birchot-hashachar", "ברכות השחר", "Birchot HaShachar"); } },
      { t: "קריאת שמע", i: "✡️", run: function () { window.openPrayer && window.openPrayer("shema", "שמע ישראל", "Shema"); } },
      { t: "ברכת מעין שלוש", i: "🍇", run: function () { window.openPrayer && window.openPrayer("al-hamichya", "ברכת מעין שלוש", "Al HaMichya"); } },
      { t: "תיקון חצות", i: "🕛", run: function () { window.openPrayer && window.openPrayer("tikkun-chatzot", "תיקון חצות", "Tikkun Chatzot"); } },
      { t: "ברכת הלבנה", i: "🌙", run: function () { window.openPrayer && window.openPrayer("kiddush-levana", "ברכת לבנה", "Kiddush Levana"); } },
      { t: "תהילים", i: "📖", run: function () { window.openTehillimPage && window.openTehillimPage(); } },
      { t: "שיר השירים", i: "🌹", run: function () { window.openShirHashirimPage && window.openShirHashirimPage(); } },
      { t: "בן איש חי", i: "📗", run: function () { window.openBenIshHaiPage && window.openBenIshHaiPage(); } },
      { t: "ספרים נוספים", i: "📚", run: function () { window.openSefarimNosafimPage && window.openSefarimNosafimPage(); } },
      { t: "תפילות נוספות", i: "🙏", run: function () { window.openTefilotNosafotPage && window.openTefilotNosafotPage(); } },
      { t: "לוח שנה חודשי", i: "📅", run: function () { window.openCalendar && window.openCalendar(); } },
      { t: "גלגל השנה", i: "🎡", run: function () { var b = document.getElementById("lux-year-wheel-btn"); b && b.click(); } },
      { t: "סדר מוצאי שבת", i: "✨", run: function () { window.openMotzeiShabbatModal && window.openMotzeiShabbatModal(); } },
      { t: "הילולות צדיקים", i: "🕯️", run: function () { window.openHilulotModal && window.openHilulotModal(); } },
      { t: "בתי כנסת ומקוואות", i: "🕍", run: function () { location.href = "synagogues.html"; } },
      { t: "מצפן לירושלים", i: "🧭", run: function () { window.openCompass && window.openCompass(); } },
      { t: "הגדרות", i: "⚙️", run: function () { window.toggleSettings && window.toggleSettings(); } },
      { t: "סליחות", i: "🕊️", run: function () { window.luxOpenSelichot && window.luxOpenSelichot(); } },
      { t: "הסטוריז היומי", i: "✨", run: function () { window.luxOpenStories && window.luxOpenStories(); } },
      { t: "שעון הלכתי", i: "🕰️", run: function () { window.luxOpenHalachicClock && window.luxOpenHalachicClock(); } },
      { t: "כרטיס שנה טובה", i: "💌", run: function () { window.luxOpenShanaTova && window.luxOpenShanaTova(); } },
      { t: "המרת תאריכים", i: "🔄", run: function () { window.luxOpenDateTool && window.luxOpenDateTool(); } },
      { t: "הלכה יומית", i: "📘", run: function () { window.luxOpenTrack && window.luxOpenTrack("halakhah"); } },
      { t: "תניא יומי", i: "📗", run: function () { window.luxOpenTrack && window.luxOpenTrack("tanya"); } },
      { t: "רמב\"ם היומי", i: "📙", run: function () { window.luxOpenTrack && window.luxOpenTrack("rambam"); } },
      { t: "סיור מודרך", i: "🧭", run: function () { window.luxStartTour && window.luxStartTour(); } }
    ];
    var ZLABELS = {
      alotHaShachar: "עלות השחר", misheyakir: "משיכיר", sunrise: "הנץ החמה",
      sofZmanShma: 'סוף זמן ק"ש', sofZmanTfilla: "סוף זמן תפילה", chatzot: "חצות היום",
      minchaGedola: "מנחה גדולה", minchaKetana: "מנחה קטנה", plagHaMincha: "פלג המנחה",
      sunset: "שקיעה", tzeit7083deg: "צאת הכוכבים", chatzotNight: "חצות הלילה"
    };
    var panel = document.createElement("div");
    panel.id = "lux-search-panel";
    var wrapEl = input.closest(".relative") || input.parentElement;
    wrapEl.insertAdjacentElement("afterend", panel);

    function search(q) {
      q = (q || "").trim();
      if (q.length < 1) { panel.innerHTML = ""; panel.style.display = "none"; return; }
      var out = [];
      CATALOG.forEach(function (c) {
        if (c.t.indexOf(q) !== -1) out.push({ i: c.i, t: c.t, sub: "", run: c.run });
      });
      // זמנים
      var z = window._lastZData;
      if (z && z.times) {
        Object.keys(ZLABELS).forEach(function (k) {
          if (ZLABELS[k].indexOf(q) !== -1 && z.times[k]) {
            out.push({
              i: "🕐", t: ZLABELS[k], sub: "היום · " + fmtTime(z.times[k]),
              run: function () { var b = document.getElementById("halacha-banner"); b && b.scrollIntoView({ behavior: "smooth", block: "center" }); }
            });
          }
        });
      }
      if (!out.length) { panel.innerHTML = ""; panel.style.display = "none"; return; }
      panel.style.display = "block";
      panel.innerHTML = out.slice(0, 6).map(function (o, i) {
        return '<button type="button" class="lux-sp-item" data-i="' + i + '">' +
          '<span class="lux-sp-ico">' + o.i + "</span>" +
          '<span class="lux-sp-txt">' + esc(o.t) + (o.sub ? ' <small>' + esc(o.sub) + "</small>" : "") + "</span>" +
          '<span class="lux-sp-go">←</span></button>';
      }).join("");
      panel.querySelectorAll(".lux-sp-item").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var o = out[parseInt(btn.dataset.i, 10)];
          panel.innerHTML = "";
          panel.style.display = "none";
          if (o && o.run) o.run();
        });
      });
    }
    var deb = null;
    input.addEventListener("input", function () {
      clearTimeout(deb);
      var v = input.value;
      deb = setTimeout(function () { search(v); }, 140);
    });
    input.addEventListener("search", function () { if (!input.value) { panel.innerHTML = ""; panel.style.display = "none"; } });
  });

  /* ── 26. תזכורת זמן קריטי (סוף זמן ק"ש / תפילה) ────────────────── */
  safe("criticalZman", function () {
    var CRIT = [
      { k: "sofZmanShmaMGA", l: 'סוף זמן ק"ש (מג"א)' },
      { k: "sofZmanShma", l: 'סוף זמן ק"ש (גר"א)' },
      { k: "sofZmanTfillaMGA", l: 'סוף זמן תפילה (מג"א)' },
      { k: "sofZmanTfilla", l: "סוף זמן תפילה" },
      { k: "sunset", l: "שקיעת החמה" }
    ];
    function check() {
      var z = window._lastZData;
      if (!z || !z.times) return;
      var now = Date.now();
      var show = null;
      CRIT.forEach(function (c) {
        if (skipByMethod(c.k, z.times)) return;
        var iso = z.times[c.k];
        if (!iso) return;
        var ms = new Date(iso).getTime();
        var left = ms - now;
        if (left > 0 && left <= 30 * 60000 && (!show || ms < show.ms)) show = { ms: ms, l: c.l, k: c.k, iso: iso };
      });
      var el = document.getElementById("lux-crit-pill");
      if (!show) { if (el) el.remove(); return; }
      var dKey = "lux_crit_" + show.k + "_" + new Date().toISOString().slice(0, 10);
      try { if (sessionStorage.getItem(dKey)) return; } catch (e) {}
      var mins = Math.ceil((show.ms - now) / 60000);
      if (!el) {
        el = document.createElement("div");
        el.id = "lux-crit-pill";
        el.innerHTML = '<span class="lux-crit-txt"></span><button type="button" class="lux-crit-x" aria-label="סגור">✕</button>';
        document.body.appendChild(el);
        el.querySelector(".lux-crit-x").addEventListener("click", function () {
          try { sessionStorage.setItem(dKey, "1"); } catch (e) {}
          el.remove();
        });
      }
      var critTxt = "⏰ " + show.l + " בעוד " + mins + " דק' (" + fmtTime(show.iso) + ")";
      var critEl = el.querySelector(".lux-crit-txt");
      // כתיבה רק בשינוי — כתיבה זהה כל דקה מעירה observers ומייצרת עבודה מיותרת
      if (critEl && critEl.textContent !== critTxt) critEl.textContent = critTxt;
    }
    setInterval(check, 60000);
    setTimeout(check, 6000);
  });

  /* ── 27. באנר יום מיוחד (ראש חודש / צום / חג) ──────────────────── */
  safe("dayBanner", function () {
    var hero = document.querySelector("#hero-section .relative.z-10") || document.getElementById("hero-section");
    if (!hero) return;
    var todayKey = new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem("lux_banner_dismiss") === todayKey) return; } catch (e) {}
    var msg = null;
    // ראש חודש לפי התאריך העברי
    try {
      var dNum = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" }).format(new Date()), 10);
      var mHe = new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" }).format(new Date());
      if (dNum === 1) msg = "🌒 ראש חודש " + mHe + " — אומרים יעלה ויבוא בתפילה";
      else if (dNum === 30) msg = "🌒 א' דראש חודש — אומרים יעלה ויבוא בתפילה";
    } catch (e) {}
    // אירוע של היום מהמטמון (צום / חג)
    if (!msg) {
      var evs = getCachedEvents() || [];
      var today = new Date();
      var tStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      for (var i = 0; i < evs.length; i++) {
        if (evs[i].date === tStr) {
          if (evs[i].type === "fast") { msg = "🕯️ היום: " + evs[i].name + " — צום קל ומועיל"; break; }
          if (evs[i].type === "major") { msg = "✨ היום: " + evs[i].name + " — חג שמח!"; break; }
        }
      }
    }
    if (!msg) return;
    var el = document.createElement("div");
    el.id = "lux-day-banner";
    el.innerHTML = "<span>" + esc(msg) + '</span><button type="button" aria-label="סגור">✕</button>';
    el.querySelector("button").addEventListener("click", function () {
      try { localStorage.setItem("lux_banner_dismiss", todayKey); } catch (e) {}
      el.remove();
    });
    var greet = document.getElementById("lux-greeting");
    if (greet) greet.insertAdjacentElement("afterend", el);
    else hero.insertAdjacentElement("afterbegin", el);
  });

  /* ── 28. מעקב קריאת תהילים + חגיגת סיום הספר ───────────────────── */
  safe("tehillimTracker", function () {
    var READ_KEY = "lux_tehillim_read";
    function readSet() { return jget(READ_KEY, []); }
    function isRead(n) { return readSet().indexOf(n) !== -1; }
    function toggle(n) {
      var s = readSet();
      var i = s.indexOf(n);
      if (i === -1) s.push(n); else s.splice(i, 1);
      jset(READ_KEY, s);
      updateProgress();
      if (s.length >= 150) celebrate();
      return i === -1;
    }
    function updateProgress() {
      var bar = document.getElementById("lux-th-progress");
      if (!bar) return;
      var n = readSet().length;
      // כתיבה רק אם השתנה — כתיבה עיוורת מפעילה את ה-MutationObserver בלולאה אין-סופית
      var txtEl = bar.querySelector(".lux-thp-txt");
      var newTxt = "📖 נקראו " + n + " מתוך 150 פרקים" + (n ? " · לחיצה לפירוט" : "");
      if (txtEl.textContent !== newTxt) txtEl.textContent = newTxt;
      var fill = bar.querySelector(".lux-thp-fill");
      var newW = Math.min(100, (n / 150) * 100) + "%";
      if (fill.style.width !== newW) fill.style.width = newW;
    }
    function celebrate() {
      luxConfetti();
      var comp = jget("lux_tehillim_completions", 0) + 1;
      jset("lux_tehillim_completions", comp);
      var ov = luxSheet("lux-th-siyum",
        '<div style="font-size:2.6rem;margin-bottom:0.4rem;">🎉</div>' +
        '<h3 class="lux-sheet-title">סיימת את ספר התהילים!</h3>' +
        '<p class="lux-sheet-note">מזל טוב! זהו הסיום ה־' + comp + ' שלך.<br>"יְהִי רָצוֹן... שֶׁתְּהֵא אֲמִירַת תְּהִלִּים זוֹ חֲשׁוּבָה וּמְקֻבֶּלֶת לְפָנֶיךָ"</p>' +
        '<div class="lux-sheet-actions">' +
          '<button type="button" class="lux-sheet-primary" id="lux-th-restart">התחל ספר חדש 🌟</button>' +
          '<button type="button" class="lux-sheet-cancel">סגור</button>' +
        "</div>");
      if (!ov) return;
      ov.querySelector("#lux-th-restart").addEventListener("click", function () {
        jset(READ_KEY, []);
        luxModalClose("lux-th-siyum");
        setTimeout(function () {
          updateProgress();
          document.querySelectorAll(".lux-th-mark.lux-on").forEach(function (b) {
            b.classList.remove("lux-on");
            b.textContent = "◯ סמן שנקרא";
          });
        }, 150);
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-th-siyum"); });
    }
    function enhance(modal) {
      // פס התקדמות מתחת לכותרת
      if (!modal.querySelector("#lux-th-progress")) {
        var header = modal.firstElementChild;
        if (header) {
          var bar = document.createElement("div");
          bar.id = "lux-th-progress";
          bar.title = "לחיצה מציגה את כל הפרקים שנקראו";
          bar.setAttribute("role", "button");
          bar.innerHTML = '<div class="lux-thp-txt"></div><div class="lux-thp-track"><div class="lux-thp-fill"></div></div>';
          header.insertAdjacentElement("afterend", bar);
          updateProgress();
        }
      }
      // כפתור "סמן שנקרא" בסוף כל פרק.
      // הלחיצה מטופלת בהאזנה גלובלית (delegation) ולא בליסנר על הכפתור —
      // כי script.js מחליף את innerHTML של הפרק אחרי טעינת הטקסט מספריא,
      // מה שהיה מוחק את הליסנר והכפתור הפסיק להגיב.
      modal.querySelectorAll('[id^="psalm-chapter-"]').forEach(function (ch) {
        var m = ch.id.match(/psalm-chapter-(\d+)/);
        if (!m) return;
        var n = parseInt(m[1], 10);
        var existing = ch.querySelector(".lux-th-mark");
        if (existing) {
          // סנכרון מצב תצוגה אם הפרק צויר מחדש. כתיבה רק בשינוי! כתיבת textContent
          // זהה מחליפה את צומת הטקסט ומעירה שוב את ה-MutationObserver — לולאה אינסופית שריצדה את הפופאפ
          var on0 = isRead(n);
          existing.classList.toggle("lux-on", on0);
          var want0 = on0 ? "✓ נקרא" : "◯ סמן שנקרא";
          if (existing.textContent !== want0) existing.textContent = want0;
          return;
        }
        // לא מוסיפים כפתור לפרק שעדיין בטעינה — הטקסט יחליף אותו מיד
        if (/טוען\.\.\./.test(ch.textContent || "")) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "lux-th-mark" + (isRead(n) ? " lux-on" : "");
        b.setAttribute("data-lux-ch", String(n));
        b.textContent = isRead(n) ? "✓ נקרא" : "◯ סמן שנקרא";
        ch.appendChild(b);
      });
    }
    // לחיצה על פס ההתקדמות — רשימת כל הפרקים שנקראו
    function openReadList() {
      var s = readSet().slice().sort(function (a, b) { return a - b; });
      var toHe = typeof window.toHebrewPsalmNumber === "function"
        ? window.toHebrewPsalmNumber
        : function (n) { return n; };
      var body;
      if (!s.length) {
        body = '<p class="lux-sheet-note">עדיין לא סימנת פרקים כנקראו.<br>בסוף כל פרק מחכה כפתור "◯ סמן שנקרא".</p>';
      } else {
        body =
          '<p class="lux-sheet-note">נקראו <b>' + s.length + "</b> מתוך 150 · נותרו " + (150 - s.length) +
          "<br>לחיצה על פרק פותחת אותו לקריאה</p>" +
          '<div class="lux-th-readgrid">' +
          s.map(function (n) {
            return '<button type="button" class="lux-th-readchip" data-ch="' + n + '">' + toHe(n) + "</button>";
          }).join("") +
          "</div>";
      }
      var ov = luxSheet("lux-th-readlist",
        '<h3 class="lux-sheet-title">📖 הפרקים שקראתי</h3>' +
        body +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-th-readlist"); });
      ov.querySelectorAll(".lux-th-readchip").forEach(function (b) {
        b.addEventListener("click", function () {
          var n = parseInt(b.dataset.ch, 10);
          luxModalClose("lux-th-readlist");
          setTimeout(function () {
            if (typeof window._tehillimOpenPsalm === "function") window._tehillimOpenPsalm(n);
          }, 160);
        });
      });
    }
    document.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("#lux-th-progress")) openReadList();
    });

    // האזנה גלובלית אחת לכל כפתורי הסימון — שורדת כל ציור-מחדש של התוכן
    document.addEventListener("click", function (ev) {
      var b = ev.target.closest && ev.target.closest(".lux-th-mark");
      if (!b) return;
      var n = parseInt(b.getAttribute("data-lux-ch") || "0", 10);
      if (!n) return;
      var on = toggle(n);
      b.classList.toggle("lux-on", on);
      b.textContent = on ? "✓ נקרא" : "◯ סמן שנקרא";
      if (on && navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
      if (on && typeof window.showToast === "function") {
        window.showToast("📖 הפרק סומן כנקרא (" + readSet().length + "/150)", "success", 2000);
      }
    });
    // debounce — מריצים את ההעשרה לכל היותר פעם ב-200ms, לא על כל מוטציה
    var pendingEnh = null;
    new MutationObserver(function () {
      if (pendingEnh) return;
      pendingEnh = setTimeout(function () {
        pendingEnh = null;
        var modal = document.getElementById("tehillim-modal");
        if (modal) enhance(modal);
      }, 200);
    }).observe(document.body, { childList: true, subtree: true });
  });

  /* ── 29. שמות לתפילה ───────────────────────────────────────────── */
  safe("prayerNames", function () {
    var KEY = "lux_prayer_names";
    var PURPOSES = ["לרפואה שלמה", "לזיווג הגון", "לפרנסה טובה", "להצלחה", 'לעילוי נשמת', "לזרע של קיימא"];
    function names() { return jget(KEY, []); }
    function openEditor() {
      var ov = luxSheet("lux-names-editor",
        '<h3 class="lux-sheet-title">🙏 שמות לתפילה</h3>' +
        '<p class="lux-sheet-note">השמות מוצגים בפתיחת התהילים — נשמרים רק במכשיר שלך</p>' +
        '<div id="lux-names-list"></div>' +
        '<div class="lux-names-add">' +
          '<input type="text" id="lux-nm-name" class="lux-sheet-input" maxlength="40" placeholder="לדוגמה: רחל בת לאה">' +
          '<select id="lux-nm-purpose" class="lux-sheet-input">' + PURPOSES.map(function (p) { return "<option>" + p + "</option>"; }).join("") + "</select>" +
          '<button type="button" class="lux-sheet-primary" id="lux-nm-add">➕ הוסף</button>' +
        "</div>" +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      function drawList() {
        var list = ov.querySelector("#lux-names-list");
        var arr = names();
        list.innerHTML = arr.length
          ? arr.map(function (x, i) {
              return '<div class="lux-nm-row"><span>' + esc(x.n) + ' <small>(' + esc(x.p) + ')</small></span><button type="button" data-i="' + i + '" aria-label="מחק">🗑️</button></div>';
            }).join("")
          : '<p class="lux-sheet-note" style="opacity:0.7;">אין עדיין שמות ברשימה</p>';
        list.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () {
            var arr2 = names();
            arr2.splice(parseInt(b.dataset.i, 10), 1);
            jset(KEY, arr2);
            drawList();
            renderBanner();
          });
        });
      }
      drawList();
      ov.querySelector("#lux-nm-add").addEventListener("click", function () {
        var n = (ov.querySelector("#lux-nm-name").value || "").trim().slice(0, 40);
        if (!n) return;
        var arr = names();
        arr.push({ n: n, p: ov.querySelector("#lux-nm-purpose").value });
        jset(KEY, arr);
        ov.querySelector("#lux-nm-name").value = "";
        drawList();
        renderBanner();
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-names-editor"); });
    }
    function renderBanner() {
      var modal = document.getElementById("tehillim-modal");
      if (!modal) return;
      var old = modal.querySelector("#lux-names-banner");
      var arr = names();
      if (!arr.length) { if (old) old.remove(); return; }
      var txt = "🙏 מתפלל עבור: " + arr.map(function (x) { return esc(x.n) + " (" + esc(x.p) + ")"; }).join(" · ");
      // כתיבה רק אם השתנה — אחרת ה-observer נכנס ללולאה אין-סופית
      if (old) { if (old.innerHTML !== txt) old.innerHTML = txt; return; }
      var el = document.createElement("div");
      el.id = "lux-names-banner";
      el.innerHTML = txt;
      var prog = modal.querySelector("#lux-th-progress");
      if (prog) prog.insertAdjacentElement("afterend", el);
      else if (modal.firstElementChild) modal.firstElementChild.insertAdjacentElement("afterend", el);
    }
    // כפתור בכותרת התהילים + באנר — עם debounce נגד לולאות
    var pendingNames = null;
    new MutationObserver(function () {
      if (pendingNames) return;
      pendingNames = setTimeout(function () {
        pendingNames = null;
        var modal = document.getElementById("tehillim-modal");
        if (!modal) return;
        var bmBtn = modal.querySelector("#th-bm-toggle-btn");
        if (bmBtn && !modal.querySelector("#lux-names-btn")) {
          var b = document.createElement("button");
          b.id = "lux-names-btn";
          b.type = "button";
          b.title = "שמות לתפילה";
          b.setAttribute("style", bmBtn.getAttribute("style") || "");
          b.textContent = "🙏";
          b.addEventListener("click", openEditor);
          bmBtn.insertAdjacentElement("beforebegin", b);
        }
        renderBanner();
      }, 200);
    }).observe(document.body, { childList: true, subtree: true });
  });

  /* ── 30. יארצייטים ואזכרות ─────────────────────────────────────── */
  safe("yahrzeits", function () {
    var KEY = "lux_yahrzeits";
    var MONTHS = ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];
    function normM(s) {
      return String(s || "").replace(/[׳״'"]/g, "").replace("מרחשוון", "חשוון").replace("מר חשוון", "חשוון").replace("סיון", "סיוון").trim();
    }
    function hebDayNum(date) {
      try { return parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" }).format(date), 10); } catch (e) { return 0; }
    }
    function hebMonthName(date) {
      try { return new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" }).format(date); } catch (e) { return ""; }
    }
    function toHebDayStr(n) {
      var tbl = ["", "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', "כ'", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל'"];
      return tbl[n] || n;
    }
    // מציאת התאריך הלועזי הקרוב של יארצייט (סריקת 400 יום קדימה)
    function nextDate(item) {
      var exact = null, adarFallback = null;
      for (var i = 0; i < 400; i++) {
        var d = new Date(Date.now() + i * 86400000);
        if (hebDayNum(d) !== item.d) continue;
        var m = normM(hebMonthName(d));
        var target = normM(item.m);
        if (m === target && !exact) { exact = { date: d, days: i }; break; }
        if (target.indexOf("אדר") === 0 && m.indexOf("אדר") === 0 && !adarFallback) adarFallback = { date: d, days: i };
      }
      return exact || adarFallback;
    }
    function items() { return jget(KEY, []); }
    function openEditor() {
      var ov = luxSheet("lux-yz-editor",
        '<h3 class="lux-sheet-title">🕯️ יארצייטים ואזכרות</h3>' +
        '<p class="lux-sheet-note">תזכורת תוצג בדף הראשי בשבוע שלפני התאריך</p>' +
        '<div id="lux-yz-list"></div>' +
        '<div class="lux-names-add">' +
          '<input type="text" id="lux-yz-name" class="lux-sheet-input" maxlength="40" placeholder=\'לדוגמה: סבא יוסף ז"ל\'>' +
          '<div style="display:flex;gap:0.4rem;">' +
            '<select id="lux-yz-day" class="lux-sheet-input" style="flex:1;">' +
              Array.apply(null, Array(30)).map(function (_, i) { return '<option value="' + (i + 1) + '">' + toHebDayStr(i + 1) + "</option>"; }).join("") +
            "</select>" +
            '<select id="lux-yz-month" class="lux-sheet-input" style="flex:1.4;">' + MONTHS.map(function (m) { return "<option>" + m + "</option>"; }).join("") + "</select>" +
          "</div>" +
          '<button type="button" class="lux-sheet-primary" id="lux-yz-add">➕ הוסף</button>' +
        "</div>" +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      function drawList() {
        var list = ov.querySelector("#lux-yz-list");
        var arr = items();
        list.innerHTML = arr.length
          ? arr.map(function (x, i) {
              var nd = nextDate(x);
              var when = nd ? nd.date.toLocaleDateString("he-IL", { day: "numeric", month: "long" }) + " (בעוד " + nd.days + " ימים)" : "";
              return '<div class="lux-nm-row"><span>' + esc(x.n) + " — " + toHebDayStr(x.d) + " ב" + esc(x.m) + (when ? " <small>" + when + "</small>" : "") + '</span><button type="button" data-i="' + i + '" aria-label="מחק">🗑️</button></div>';
            }).join("")
          : '<p class="lux-sheet-note" style="opacity:0.7;">אין עדיין תאריכים שמורים</p>';
        list.querySelectorAll("button").forEach(function (b) {
          b.addEventListener("click", function () {
            var arr2 = items();
            arr2.splice(parseInt(b.dataset.i, 10), 1);
            jset(KEY, arr2);
            drawList();
            renderBanner();
          });
        });
      }
      drawList();
      ov.querySelector("#lux-yz-add").addEventListener("click", function () {
        var n = (ov.querySelector("#lux-yz-name").value || "").trim().slice(0, 40);
        if (!n) return;
        var arr = items();
        arr.push({ n: n, d: parseInt(ov.querySelector("#lux-yz-day").value, 10), m: ov.querySelector("#lux-yz-month").value });
        jset(KEY, arr);
        ov.querySelector("#lux-yz-name").value = "";
        drawList();
        renderBanner();
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-yz-editor"); });
    }
    function renderBanner() {
      var old = document.getElementById("lux-yz-banner");
      if (old) old.remove();
      var soon = [];
      items().forEach(function (x) {
        var nd = nextDate(x);
        if (nd && nd.days <= 7) soon.push({ x: x, nd: nd });
      });
      if (!soon.length) return;
      var el = document.createElement("div");
      el.id = "lux-yz-banner";
      el.innerHTML = soon.map(function (s) {
        var when = s.nd.days === 0 ? "היום" : s.nd.days === 1 ? "מחר" : "בעוד " + s.nd.days + " ימים";
        return "🕯️ יארצייט: <b>" + esc(s.x.n) + "</b> — " + toHebDayStr(s.x.d) + " ב" + esc(s.x.m) + " (" + when + ")";
      }).join("<br>");
      var banner = document.getElementById("lux-day-banner");
      var greet = document.getElementById("lux-greeting");
      if (banner) banner.insertAdjacentElement("afterend", el);
      else if (greet) greet.insertAdjacentElement("afterend", el);
    }
    // כפתור בהגדרות
    var anchor = document.getElementById("lux-nav-edit-btn");
    if (anchor && anchor.parentElement) {
      var field = document.createElement("div");
      field.innerHTML =
        '<label class="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">תזכורות אישיות</label>' +
        '<button type="button" id="lux-yz-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3">' +
          '<span class="font-semibold text-sm">🕯️ יארצייטים ואזכרות</span>' +
          '<span class="text-slate-400 text-xs">תזכורת אוטומטית</span>' +
        "</button>";
      anchor.parentElement.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-yz-btn").addEventListener("click", openEditor);
    }
    setTimeout(renderBanner, 2500);
  });

  /* ── 31. הישגים ────────────────────────────────────────────────── */
  safe("achievements", function () {
    // מונה ימי ביקור
    var v = jget("lux_visits", { count: 0, last: null });
    var todayStr = new Date().toISOString().slice(0, 10);
    if (v.last !== todayStr) { v.count++; v.last = todayStr; jset("lux_visits", v); }
    // סימון ברכת לבנה (להישג)
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".levana-blessed-btn")) jset("lux_levana_done", 1);
    }, { passive: true });

    function badges() {
      var streak = jget("lux_streak", { count: 0 }).count || 0;
      var read = jget("lux_tehillim_read", []).length;
      var comps = jget("lux_tehillim_completions", 0);
      var visits = jget("lux_visits", { count: 0 }).count;
      var levana = !!jget("lux_levana_done", 0);
      var namesCnt = jget("lux_prayer_names", []).length;
      return [
        { i: "🔥", t: "3 ימי לימוד ברצף", on: streak >= 3 },
        { i: "🔥", t: "שבוע לימוד ברצף", on: streak >= 7 },
        { i: "👑", t: "חודש לימוד ברצף", on: streak >= 30 },
        { i: "📖", t: "10 פרקי תהילים", on: read >= 10 || comps > 0 },
        { i: "📖", t: "50 פרקי תהילים", on: read >= 50 || comps > 0 },
        { i: "🏆", t: "סיום ספר תהילים", on: comps >= 1 },
        { i: "🌙", t: "ברכת הלבנה", on: levana },
        { i: "🙏", t: "מתפלל למען אחרים", on: namesCnt > 0 },
        { i: "⭐", t: "שבוע של ביקורים", on: visits >= 7 },
        { i: "💎", t: "30 ימי ביקור", on: visits >= 30 },
        { i: "✡️", t: "100 ימי ביקור", on: visits >= 100 }
      ].concat(window._luxStudyBadges ? window._luxStudyBadges() : []);
    }
    function openScreen() {
      var list = badges();
      var unlocked = list.filter(function (b) { return b.on; }).length;
      var ov = luxSheet("lux-achievements",
        '<h3 class="lux-sheet-title">🏆 ההישגים שלי</h3>' +
        '<p class="lux-sheet-note">נפתחו ' + unlocked + " מתוך " + list.length + " הישגים</p>" +
        '<div class="lux-ach-grid">' +
          list.map(function (b) {
            return '<div class="lux-ach' + (b.on ? " lux-ach-on" : "") + '"><span class="lux-ach-ico">' + b.i + '</span><span class="lux-ach-txt">' + b.t + "</span></div>";
          }).join("") +
        "</div>" +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-achievements"); });
    }
    // כפתור בהגדרות + לחיצה על תג הרצף
    var anchor = document.getElementById("lux-yz-btn") || document.getElementById("lux-nav-edit-btn");
    if (anchor) {
      var host = anchor.closest("div");
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-ach-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span class="font-semibold text-sm">🏆 ההישגים שלי</span>' +
          '<span class="text-slate-400 text-xs">תגי זהב</span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-ach-btn").addEventListener("click", openScreen);
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("#lux-streak")) openScreen();
    }, { passive: true });
  });

  /* ── 32. נתוני ווידג'טים — הכנה לאפליקציה ──────────────────────── */
  safe("widgetData", function () {
    // חלוקת תהילים חודשית (ל' ימים)
    var TH_MONTHLY = {
      1: "א-ט", 2: "י-יז", 3: "יח-כב", 4: "כג-כח", 5: "כט-לד", 6: "לה-לח",
      7: "לט-מג", 8: "מד-מח", 9: "מט-נד", 10: "נה-נט", 11: "ס-סה", 12: "סו-סח",
      13: "סט-עא", 14: "עב-עו", 15: "עז-עח", 16: "עט-פב", 17: "פג-פז", 18: "פח-פט",
      19: "צ-צו", 20: "צז-קג", 21: "קד-קה", 22: "קו-קז", 23: "קח-קיב", 24: "קיג-קיח",
      25: 'קיט (עד צ"ו)', 26: 'קיט (מצ"ז)', 27: "קכ-קלד", 28: "קלה-קלט", 29: "קמ-קמד", 30: "קמה-קנ"
    };
    function build() {
      try {
        var zmanim = [];
        document.querySelectorAll("#zmanim-details > div[data-zman-key]").forEach(function (c) {
          var l = c.querySelector("span:first-child"), vl = c.querySelector("span[dir='ltr']");
          if (l && vl && vl.textContent.trim() !== "--:--") zmanim.push({ l: l.textContent.trim(), v: vl.textContent.trim() });
        });
        var hebDay = 1;
        try { hebDay = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" }).format(new Date()), 10) || 1; } catch (e) {}
        var nz = document.getElementById("lux-next-zman");
        var data = {
          updated: Date.now(),
          city: localStorage.getItem("moadim_city_name") || "",
          hebDate: luxHebDateStr(),
          gregDate: new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }),
          parsha: (document.getElementById("stat-parasha") || {}).textContent || "",
          dafYomi: (document.getElementById("daf-yomi-text") || {}).textContent || "",
          shabbatEnter: ((document.getElementById("shabbat-enter") || {}).textContent || "").trim(),
          shabbatExit: ((document.getElementById("shabbat-exit") || {}).textContent || "").trim(),
          zmanim: zmanim.slice(0, 12),
          nextZman: nz ? nz.textContent.replace(/^⏳\s*/, "") : "",
          tehillimDaily: { day: hebDay, range: TH_MONTHLY[Math.min(hebDay, 30)] || "" },
          omerDay: (window.CURRENT_OMER_DAY || 0)
        };
        if (data.zmanim.length || data.hebDate) jset("lux_widget_data", data);
      } catch (e) {}
    }
    setTimeout(build, 6000);
    setInterval(build, 10 * 60000);
    // API פומבי — הווידג'טים של האפליקציה ישתמשו בו בהמשך
    window.LuxWidgetData = {
      get: function () { return jget("lux_widget_data", null); },
      refresh: build
    };
  });

  /* ═══════════════════════════════════════════════════════════════
     LUX 5 — זכירת מיקום, מצפן, החלקות מגע, סיור מודרך, סליחות
     ═══════════════════════════════════════════════════════════════ */

  /* ── 33. זכירת מיקום GPS — בלי לבקש אישור מחדש בכל כניסה ───────── */
  safe("geoMemory", function () {
    if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) return;
    var KEY = "lux_last_geo";
    var FRESH_MS = 30 * 24 * 60 * 60 * 1000; // אחרי חודש מנסים רענון אמיתי
    function readCache() {
      var c = jget(KEY, null);
      if (c && typeof c.lat === "number" && typeof c.lon === "number") return c;
      try {
        var g = JSON.parse(localStorage.getItem("moadim_gps") || "null");
        if (g && typeof g.lat === "number" && typeof g.lon === "number")
          return { lat: g.lat, lon: g.lon, ts: 0 };
      } catch (e) {}
      return null;
    }
    function fakePos(c) {
      return {
        coords: {
          latitude: c.lat, longitude: c.lon, accuracy: 300,
          altitude: null, altitudeAccuracy: null, heading: null, speed: null
        },
        timestamp: c.ts || Date.now()
      };
    }
    var orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    function realCall(success, error, opts) {
      orig(function (pos) {
        try {
          jset(KEY, { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() });
        } catch (e) {}
        if (success) success(pos);
      }, error, opts);
    }
    navigator.geolocation.getCurrentPosition = function (success, error, opts) {
      var cached = readCache();
      if (!cached) { realCall(success, error, opts); return; }
      var useCached = function () { if (success) success(fakePos(cached)); };
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: "geolocation" }).then(function (st) {
          if (st.state === "granted") {
            // ההרשאה קבועה — אין חלון; מרעננים באמת ונופלים למטמון בשגיאה
            realCall(success, function () { useCached(); }, opts);
          } else if (st.state === "prompt" && cached.ts && (Date.now() - cached.ts) > FRESH_MS) {
            // המיקום השמור ישן מאוד — שווה רענון אמיתי; בביטול חוזרים למטמון
            realCall(success, function () { useCached(); }, opts);
          } else {
            // משתמשים במיקום השמור מיד — בלי חלון אישור
            useCached();
          }
        }).catch(useCached);
      } else {
        useCached();
      }
    };

    // מצפן (iOS): דילוג אוטומטי על שלב "אישור חיישנים" אם אושר בעבר
    var CFLAG = "lux_compass_perm";
    if (typeof window.openCompass === "function" &&
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      var origCompass = window.openCompass;
      window.openCompass = function () {
        var out = origCompass.apply(this, arguments);
        try {
          if (localStorage.getItem(CFLAG) === "1") {
            DeviceOrientationEvent.requestPermission().then(function (res) {
              if (res === "granted") {
                var btn = document.getElementById("btn-compass-permission");
                if (btn) btn.classList.add("hidden");
                if (typeof window.bindCompass === "function") window.bindCompass();
              }
            }).catch(function () {});
          }
        } catch (e) {}
        return out;
      };
      document.addEventListener("click", function (ev) {
        if (!ev.target.closest || !ev.target.closest("#btn-compass-permission")) return;
        setTimeout(function () {
          var btn = document.getElementById("btn-compass-permission");
          if (btn && btn.classList.contains("hidden")) {
            try { localStorage.setItem(CFLAG, "1"); } catch (e) {}
          }
        }, 1200);
      }, { passive: true });
    }
  });

  /* ── 34. החלקת אצבע בקרוסלות (דברי תורה, הילולות, לוח שנה) ─────── */
  safe("swipeCarousels", function () {
    if (!("ontouchstart" in window)) return;
    // RTL: החלקה ימינה = קדימה (כמו דפדוף בספר עברי), החלקה שמאלה = אחורה
    var MAP = [
      { root: "#moad-torah-modal", next: "#moad-next", prev: "#moad-prev" },
      { root: "#hilulot-modal", next: "#hil-next", prev: "#hil-prev" },
      {
        root: "#calendar-modal",
        nextFn: function () { if (typeof window.changeMonth === "function") window.changeMonth(1); },
        prevFn: function () { if (typeof window.changeMonth === "function") window.changeMonth(-1); }
      },
      {
        root: "#hilulot-cal-modal",
        nextFn: function () { if (typeof window._hilCalNav === "function") window._hilCalNav(1); },
        prevFn: function () { if (typeof window._hilCalNav === "function") window._hilCalNav(-1); }
      },
      { root: "#lux-stories", next: ".lux-st-tap-next", prev: ".lux-st-tap-prev" },
      { root: "#lux-tour-overlay", next: ".lux-tour-next", prev: ".lux-tour-prev" }
    ];
    var sx = null, sy = null, entry = null;
    document.addEventListener("touchstart", function (e) {
      entry = null; sx = null; sy = null;
      for (var i = 0; i < MAP.length; i++) {
        var rootEl = document.querySelector(MAP[i].root);
        if (rootEl && !rootEl.classList.contains("hidden") && rootEl.contains(e.target)) {
          entry = MAP[i];
          break;
        }
      }
      if (!entry) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!entry || sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      var en = entry;
      entry = null; sx = null; sy = null;
      // תנועה אופקית מובהקת בלבד — לא מפריעים לגלילה אנכית
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      var fwd = dx > 0; // ימינה = הבא
      function clickBtn(sel) {
        var b = document.querySelector(sel);
        if (b && !b.disabled) b.click();
      }
      if (fwd) { if (en.nextFn) en.nextFn(); else clickBtn(en.next); }
      else { if (en.prevFn) en.prevFn(); else clickBtn(en.prev); }
      if (navigator.vibrate) { try { navigator.vibrate(6); } catch (err) {} }
    }, { passive: true });
  });

  /* ── 35. סיור מודרך בכל האתר ───────────────────────────────────── */
  safe("siteTour", function () {
    var STEPS = [
      { sel: "#lux-greeting", t: "ברכה אישית 👋", d: "ברכה לפי שעת היום עם התאריך העברי. אפשר להוסיף את שמכם דרך ⚙️ ההגדרות כדי שהאתר יברך אתכם בשמכם." },
      { sel: "#lux-moon", t: "הירח החי 🌙", d: "כך נראה הירח בשמים ממש עכשיו. לחיצה מציגה את יום המולד — וממשיכה לברכת הלבנה." },
      { sel: "#prayer-grid-wrap", t: "תפילות בלחיצה 🙏", d: "תפילת הדרך, ברכת המזון, תיקון הכללי ועוד — לחיצה אחת פותחת את הנוסח המלא. בכפתור \"תפילות נוספות\" מסתתרות עוד הרבה, כולל לוח ברכות הנהנין וסדר התרת נדרים." },
      { sel: "#lux-plan-row", t: "סדר לימוד אישי 🎯", d: "בוחרים ספר — תהילים, משנה, בן איש חי ועוד — קובעים קצב, והאתר מחלק את הלימוד לימים, מציג בכל יום את המנה, עוקב אחרי ההתקדמות ומעניק תגי התמדה." },
      { sel: "#shabbat-countdown-wrap", t: "ספירה לאחור לשבת 🕯️", d: "כמה זמן נשאר עד כניסת השבת או החג. לחיצה מציגה את כל פרטי השבת: הדלקת נרות, הבדלה ופרשת השבוע." },
      { sel: "#btn-open-calendar", t: "לוח שנה חודשי 📅", d: "לוח שנה עברי-לועזי מלא עם כל החגים, ראשי החודשים והפרשות. אפשר לדפדף בין חודשים גם בהחלקת אצבע." },
      { sel: "#lux-year-wheel-btn", t: "גלגל השנה 🎡", d: "מסע ויזואלי של שנה שלמה — כל החגים על גלגל מסתובב. לחצו על חג כדי לגלות מתי הוא ובעוד כמה ימים." },
      { sel: "#btn-shul-mikve", t: "בתי כנסת ומקוואות 🕍", d: "מציאת בתי כנסת, מקוואות וציוני צדיקים הקרובים אליכם — עם ניווט ישיר בוויז." },
      { sel: "#dashboard-state", t: "המבט היומי ✨", d: "התאריך העברי של היום, החג הקרוב, פרשת השבוע והדף היומי — הכל במבט אחד. לחיצה על כרטיס פותחת פרטים." },
      { sel: "#halacha-banner", t: "זמני היום 🕰️", d: "כל זמני ההלכה לפי המיקום שלכם: עלות השחר, זמני ק\"ש, שקיעה וצאת הכוכבים. אפשר גם לשתף כתמונה מעוצבת או להדפיס." },
      { sel: "#mainSearch", t: "חיפוש חכם 🔍", d: "הקלידו כל דבר — תפילה, ספר, זמן או חג — ותקבלו קפיצה ישירה אליו." },
      { sel: "#resultsGrid", t: "החגים הקרובים 🗓️", d: "כל המועדים הקרובים עם זמני כניסה ויציאה. בכל כרטיס: סנכרון ליומן, דבר תורה מיוחד ושיתוף בוואטסאפ." },
      { sel: "#lux-pearl", t: "פנינה יומית 💎", d: "ציטוט יומי מתחלף מפרקי אבות ומקורות ישראל — השראה קטנה לכל יום." },
      { sel: "#lux-bottom-nav", t: "ניווט מהיר 📱", d: "סרגל הניווט התחתון — ואפשר לבחור בהגדרות בדיוק אילו קיצורים יופיעו בו." },
      { sel: ".nav-action-btn", t: "הגדרות ⚙️", d: "נוסח התפילה, שיטת הזמנים, עיצוב, התראות, יארצייטים, הישגים, המרת תאריכים ומרקר סימון שורה בספרים — הכל מתאים את האתר בדיוק אליכם. סיור נעים! 🙌" }
    ];
    var idx = 0, overlay = null, hi = null, tip = null;

    function visible(el) {
      if (!el) return false;
      if (el.getClientRects().length === 0) return false;
      var r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    }
    function endTour() {
      if (overlay) overlay.remove();
      overlay = hi = tip = null;
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", placeSoon, true);
    }
    var placeT = null;
    function placeSoon() {
      if (placeT) return;
      placeT = setTimeout(function () { placeT = null; place(); }, 60);
    }
    function stepEl() {
      var s = STEPS[idx];
      return s ? document.querySelector(s.sel) : null;
    }
    function place() {
      if (!overlay) return;
      var el = stepEl();
      if (!el || !visible(el)) return;
      var r = el.getBoundingClientRect();
      var pad = 8;
      hi.style.top = (r.top - pad) + "px";
      hi.style.left = (r.left - pad) + "px";
      hi.style.width = (r.width + pad * 2) + "px";
      hi.style.height = (r.height + pad * 2) + "px";
      // מיקום הכרטיס: מתחת לאלמנט אם יש מקום, אחרת מעליו
      var tipH = tip.offsetHeight || 180;
      var below = r.bottom + pad + 14;
      var top = below + tipH < window.innerHeight - 12 ? below : Math.max(12, r.top - pad - tipH - 14);
      tip.style.top = top + "px";
    }
    function show() {
      // דילוג על שלבים שהאלמנט שלהם לא קיים/מוסתר
      var guard = 0;
      while (idx < STEPS.length && (!stepEl() || !visible(stepEl())) && guard < 30) { idx++; guard++; }
      if (idx >= STEPS.length) { endTour(); return; }
      var s = STEPS[idx];
      var el = stepEl();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      tip.innerHTML =
        '<div class="lux-tour-title">' + s.t + "</div>" +
        '<div class="lux-tour-desc">' + s.d + "</div>" +
        '<div class="lux-tour-dots">' + STEPS.map(function (_, i) {
          return '<span class="' + (i === idx ? "lux-td-on" : "") + '"></span>';
        }).join("") + "</div>" +
        '<div class="lux-tour-btns">' +
          '<button type="button" class="lux-tour-skip">דלג</button>' +
          (idx > 0 ? '<button type="button" class="lux-tour-prev">→ הקודם</button>' : "") +
          '<button type="button" class="lux-tour-next">' + (idx === STEPS.length - 1 ? "סיום 🎉" : "הבא ←") + "</button>" +
        "</div>";
      tip.querySelector(".lux-tour-next").addEventListener("click", function () {
        idx++;
        if (idx >= STEPS.length) { endTour(); luxConfetti(); return; }
        show();
      });
      var pv = tip.querySelector(".lux-tour-prev");
      if (pv) pv.addEventListener("click", function () { idx = Math.max(0, idx - 1); show(); });
      tip.querySelector(".lux-tour-skip").addEventListener("click", endTour);
      // ממתינים לגלילה ואז ממקמים
      setTimeout(place, 350);
      setTimeout(place, 750);
    }
    function startTour() {
      // סיור קודם שעדיין פתוח — סוגרים קודם (מונע שכבות כפולות)
      endTour();
      document.querySelectorAll("#lux-tour-overlay").forEach(function (o) { o.remove(); });
      // סוגרים הגדרות אם פתוחות
      try {
        var sm = document.getElementById("settings-modal");
        if (sm && !sm.classList.contains("hidden") && typeof window.toggleSettings === "function") window.toggleSettings();
      } catch (e) {}
      idx = 0;
      overlay = document.createElement("div");
      overlay.id = "lux-tour-overlay";
      overlay.innerHTML = '<div id="lux-tour-hi"></div><div id="lux-tour-tip"></div>';
      document.body.appendChild(overlay);
      hi = overlay.querySelector("#lux-tour-hi");
      tip = overlay.querySelector("#lux-tour-tip");
      window.addEventListener("resize", place);
      window.addEventListener("scroll", placeSoon, true);
      setTimeout(show, 250);
    }
    window.luxStartTour = startTour;

    // כפתור בהגדרות — מעל כפתור ההישגים
    function inject() {
      var anchor = document.getElementById("lux-ach-btn");
      if (!anchor || document.getElementById("lux-tour-btn")) return;
      var host = anchor.closest("div");
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-tour-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span class="font-semibold text-sm">🧭 סיור מודרך באתר</span>' +
          '<span class="text-slate-400 text-xs">הכירו את כל הפיצ\'רים</span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-tour-btn").addEventListener("click", startTour);
    }
    inject();
    setTimeout(inject, 2000);
  });

  /* ── 36. סליחות — כרטיס עונתי + קורא מלא לפי נוסח ──────────────── */
  safe("selichot", function () {
    function hebDayNum(d) {
      try { return parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" }).format(d), 10) || 0; } catch (e) { return 0; }
    }
    function hebMonthName(d) {
      try {
        return new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" }).format(d)
          .replace("מרחשוון", "חשוון").replace("סיון", "סיוון");
      } catch (e) { return ""; }
    }
    // עונת הסליחות: מא' באלול (מנהג עדות המזרח) ועד ערב יום כיפור (ט' תשרי)
    function seasonInfo() {
      var d = new Date();
      var m = hebMonthName(d), day = hebDayNum(d);
      if (m === "אלול") return { active: true, month: "אלול", day: day };
      if (m === "תשרי" && day <= 9) return { active: true, month: "תשרי", day: day };
      return { active: false };
    }
    var season = seasonInfo();
    if (!season.active) return;

    var NUSACH_MAP = {
      mizrahi: { label: "עדות המזרח", index: "Selichot Edot HaMizrach", byDay: false },
      sfard: { label: "ספרד", index: "Selichot Nusach Polin", byDay: true },
      ashkenaz: { label: "אשכנז (ליטא)", index: "Selichot Nusach Ashkenaz Lita", byDay: true }
    };
    var DAY_NODES = [
      { en: "First Day", he: "יום ראשון" },
      { en: "Second Day", he: "יום שני" },
      { en: "Third Day", he: "יום שלישי" },
      { en: "Fourth Day", he: "יום רביעי" },
      { en: "Fifth Day", he: "יום חמישי" },
      { en: "Sixth Day", he: "יום שישי" },
      { en: "Seventh Day", he: "יום שביעי" },
      { en: "Erev Rosh Hashana", he: "ערב ראש השנה" },
      { en: "Fast of Gedaliah", he: "צום גדליה" },
      { en: "Second Day of the Ten Days of Penitence", he: "ב' דעשי\"ת" },
      { en: "Third Day of the Ten Days of Penitence", he: "ג' דעשי\"ת" },
      { en: "Fourth Day of the Ten Days of Penitence", he: "ד' דעשי\"ת" },
      { en: "Fifth Day of the Ten Days of Penitence", he: "ה' דעשי\"ת" },
      { en: "Yom Kippur Eve", he: "ערב יום כיפור" }
    ];
    function currentNusach() {
      var n = "";
      try { n = localStorage.getItem("moadim_nusach") || "mizrahi"; } catch (e) {}
      return NUSACH_MAP[n] || NUSACH_MAP.mizrahi;
    }
    // מציאת התאריך הלועזי של ר"ה הקרוב (א' תשרי) — סריקה קדימה
    function nextRoshHashana() {
      for (var i = 0; i <= 60; i++) {
        var d = new Date(Date.now() + i * 86400000);
        if (hebMonthName(d) === "תשרי" && hebDayNum(d) === 1) {
          d.setHours(0, 0, 0, 0);
          return d;
        }
      }
      return null;
    }
    // אינדקס ברירת המחדל של "יום הסליחות" לנוסח אשכנז/פולין
    function defaultDayIdx() {
      if (season.month === "תשרי") {
        var t = season.day;
        if (t === 3) return 8;         // צום גדליה
        if (t === 4) return 9;
        if (t === 5) return 10;
        if (t === 6) return 11;
        if (t === 7 || t === 8) return 12;
        if (t === 9) return 13;        // ערב יום כיפור
        return 8;
      }
      // אלול: ימי הסליחות של אשכנז מתחילים ביום ראשון שלפני ר"ה (לפחות 4 ימים)
      var rh = nextRoshHashana();
      if (!rh) return 0;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (Math.round((rh - today) / 86400000) === 1) return 7; // ערב ר"ה
      var start = new Date(rh);
      var back = rh.getDay() === 0 ? 7 : rh.getDay(); // יום ראשון אחרון לפני ר"ה
      start.setDate(start.getDate() - back);
      if ((rh - start) / 86400000 < 4) start.setDate(start.getDate() - 7);
      var i = Math.round((today - start) / 86400000);
      if (i < 0) return 0;              // עוד לא התחילו — מציגים את יום ראשון
      return Math.max(0, Math.min(6, i));
    }

    /* ── טעינת טקסט מספריא עם מטמון מקומי ── */
    function fetchRef(ref, cb) {
      var ck = "lux_sel_cache_" + ref;
      var cached = jget(ck, null);
      if (cached && cached.length) { cb(cached); return; }
      // API v3 מחזיר את כל הפרקים של היום בבת אחת (הישן החזיר רק פרק ראשון)
      var url = "https://www.sefaria.org/api/v3/texts/" + encodeURIComponent(ref) + "?version=hebrew";
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var flat = [];
          var src = data && data.versions && data.versions[0] ? data.versions[0].text : null;
          (function walk(x) {
            if (x == null) return;
            if (typeof x === "string") { if (x.trim()) flat.push(x); return; }
            if (Array.isArray(x)) x.forEach(walk);
          })(src);
          if (flat.length) { try { jset(ck, flat); } catch (e) {} cb(flat); }
          else cb(null);
        })
        .catch(function () { cb(null); });
    }

    function renderText(area, paras) {
      if (!paras) {
        area.innerHTML = '<p style="text-align:center;color:#b45309;padding:2rem 1rem;">לא הצלחנו לטעון את הטקסט כעת.<br>בדקו את חיבור האינטרנט ונסו שוב.</p>';
        return;
      }
      area.innerHTML = paras.map(function (p) {
        return '<p class="lux-sel-para">' + p + "</p>";
      }).join("") +
      // קרדיט בתחתית — אחרי סיום הקריאה
      '<div class="lux-sel-credit">✦<br>המקור: ספריית Sefaria.org (רישיון פתוח)<br>תזכו למצוות 🙏</div>';
      area.scrollTop = 0;
    }

    function openReader() {
      var old = document.getElementById("lux-selichot-reader");
      if (old) {
        // ghost-tap בנייד: נגיעה כפולה מיד אחרי הפתיחה נסגרה מיידית ונראתה כהבהוב
        if (Date.now() - (old.__luxOpenedAt || 0) < 600) return;
        luxModalClose("lux-selichot-reader");
        return;
      }
      var nus = currentNusach();
      var ov = document.createElement("div");
      ov.id = "lux-selichot-reader";
      ov.__luxOpenedAt = Date.now();
      var chipsHtml = "";
      if (nus.byDay) {
        chipsHtml = '<div class="lux-sel-chips">' + DAY_NODES.map(function (n, i) {
          return '<button type="button" data-i="' + i + '" class="lux-sel-chip">' + n.he + "</button>";
        }).join("") + "</div>";
      }
      ov.innerHTML =
        '<div class="lux-sel-head">' +
          '<button type="button" class="lux-sel-close" aria-label="סגור">✕</button>' +
          '<div class="lux-sel-titles">' +
            '<h2>🕊️ סליחות</h2>' +
            '<p>נוסח ' + esc(nus.label) + "</p>" +
          "</div>" +
        "</div>" +
        chipsHtml +
        '<div id="lux-sel-area" class="lux-sel-area holy-text-style"><p style="text-align:center;color:#94a3b8;padding:2rem;">טוען את הסליחות...</p></div>' +
        '<div class="lux-sel-foot">' +
          '<button type="button" id="lux-sel-fminus" class="lux-sel-fbtn" aria-label="הקטן כתב">−</button>' +
          '<button type="button" id="lux-sel-fplus" class="lux-sel-fbtn" aria-label="הגדל כתב">+</button>' +
          '<span class="lux-sel-foot-sep"></span>' +
          '<button type="button" class="lux-sel-scroll-btn" onclick="window._toggleAutoScroll(\'#lux-sel-area\', this)" aria-label="התחל גלילה אוטומטית">▶</button>' +
          '<button type="button" class="auto-scroll-speed-btn lux-sel-speed" onclick="window._cycleAutoScrollSpeed(this)" aria-label="מהירות גלילה">1x</button>' +
        "</div>";
      document.body.appendChild(ov);
      luxModalOpen("lux-selichot-reader");

      var area = ov.querySelector(".lux-sel-area");
      // גודל גופן
      // גודל אחיד לכל האתר — אותו מפתח ואותו בסיס (25px ב-100%) כמו בכל הקוראים
      var fs = parseInt(localStorage.getItem("moadim_prayer_font_size") || "100", 10) || 100;
      if (fs < 60 || fs > 200) fs = 100;
      function applyFs() { area.style.setProperty("font-size", (fs / 100) * 25 + "px", "important"); try { localStorage.setItem("moadim_prayer_font_size", fs); } catch (_) {} if (window._btnToastVal && applyFs._user) window._btnToastVal("גודל כתב: " + fs + "%"); applyFs._user = false; }
      applyFs();
      ov.querySelector("#lux-sel-fplus").addEventListener("click", function () { fs = Math.min(200, fs + 10); applyFs._user = true; applyFs(); });
      ov.querySelector("#lux-sel-fminus").addEventListener("click", function () { fs = Math.max(60, fs - 10); applyFs._user = true; applyFs(); });
      ov.querySelector(".lux-sel-close").addEventListener("click", function () { luxModalClose("lux-selichot-reader"); });

      if (nus.byDay) {
        var chips = ov.querySelectorAll(".lux-sel-chip");
        var sel = defaultDayIdx();
        function pick(i) {
          chips.forEach(function (c, j) { c.classList.toggle("lux-sel-chip-on", j === i); });
          var chip = chips[i];
          if (chip && chip.scrollIntoView) { try { chip.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (e) {} }
          area.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">טוען את הסליחות...</p>';
          fetchRef(nus.index + ", " + DAY_NODES[i].en, function (paras) { renderText(area, paras); });
        }
        chips.forEach(function (c) {
          c.addEventListener("click", function () { pick(parseInt(c.dataset.i, 10)); });
        });
        pick(sel);
      } else {
        fetchRef(nus.index, function (paras) { renderText(area, paras); });
      }
    }
    window.luxOpenSelichot = openReader;

    /* ── הכרטיס בדף הראשי — מוצג רק בעונת הסליחות ── */
    function injectCard() {
      if (document.getElementById("lux-selichot-card")) return;
      var main = document.getElementById("main-content");
      var nav = main ? main.querySelector("nav") : null;
      if (!main || !nav) return;
      var nus = currentNusach();
      var hebToday = "";
      try { hebToday = luxHebDateStr(); } catch (e) {}
      var dayStr = season.month === "אלול"
        ? "היום: " + (hebToday || season.day + " באלול")
        : "עשרת ימי תשובה" + (hebToday ? " · " + hebToday : "");
      var el = document.createElement("section");
      el.id = "lux-selichot-card";
      el.innerHTML =
        '<div class="lux-selc-glow" aria-hidden="true"></div>' +
        '<div class="lux-selc-icon" aria-hidden="true">🕊️</div>' +
        '<div class="lux-selc-txt">' +
          "<h3>ימי הסליחות והרחמים</h3>" +
          "<p>נוסח " + esc(nus.label) + " · מא' באלול עד ערב יום כיפור</p>" +
          '<p class="lux-selc-day">' + esc(dayStr) + "</p>" +
        "</div>" +
        '<button type="button" id="lux-selc-open">לאמירת הסליחות ←</button>';
      nav.insertAdjacentElement("beforebegin", el);
      el.querySelector("#lux-selc-open").addEventListener("click", openReader);
      // לחיצה על כל הכרטיס פותחת גם היא
      el.addEventListener("click", function (e) {
        if (e.target.id !== "lux-selc-open") openReader();
      });
    }
    injectCard();
    setTimeout(injectCard, 2500);
  });

  /* ═══════════════════════════════════════════════════════════════
     LUX 6 — עיצוב עונתי, מצב שבת, סטוריז, שעון הלכתי, שנה טובה,
     המרת תאריכים, מסלולי לימוד יומיים
     ═══════════════════════════════════════════════════════════════ */

  /* עזרים עבריים משותפים — הפורמטרים נשמרים (יצירת Intl.DateTimeFormat יקרה בסריקות ארוכות) */
  var _luxHebFmtM = null, _luxHebFmtD = null, _luxHebFmtY = null;
  function luxHebMonth(d) {
    try {
      if (!_luxHebFmtM) _luxHebFmtM = new Intl.DateTimeFormat("he-u-ca-hebrew", { month: "long" });
      return _luxHebFmtM.format(d).replace("מרחשוון", "חשוון").replace("סיון", "סיוון");
    } catch (e) { return ""; }
  }
  function luxHebDay(d) {
    try {
      if (!_luxHebFmtD) _luxHebFmtD = new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" });
      return parseInt(_luxHebFmtD.format(d), 10) || 0;
    } catch (e) { return 0; }
  }
  function luxHebYear(d) {
    try {
      if (!_luxHebFmtY) _luxHebFmtY = new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" });
      return parseInt(_luxHebFmtY.format(d), 10) || 0;
    } catch (e) { return 0; }
  }

  /* ── 37. (הוסר) הסמלים העונתיים הצפים נמחקו לבקשת המשתמש ─────────── */

  /* ── 38. מצב שבת מלא — סצנת נרות חיה + הספירה לאחור נשארת ──────── */
  safe("shabbatScene", function () {
    function buildScene(isChag) {
      if (document.getElementById("lux-shabbat-scene")) return;
      var wrap = document.getElementById("shabbat-countdown-wrap");
      if (!wrap) return;
      try { if (sessionStorage.getItem("lux_sbs_dismiss")) return; } catch (e) {}
      var parsha = ((document.getElementById("stat-parasha") || {}).textContent || "").trim();
      var enter = ((document.getElementById("shabbat-enter") || {}).textContent || "").trim();
      var exit = ((document.getElementById("shabbat-exit") || {}).textContent || "").trim();
      var scene = document.createElement("div");
      scene.id = "lux-shabbat-scene";
      var candle =
        '<div class="lux-sbs-candle">' +
          '<div class="lux-sbs-glow"></div>' +
          '<div class="lux-sbs-flame"></div>' +
          '<div class="lux-sbs-wick"></div>' +
          '<div class="lux-sbs-body"></div>' +
        "</div>";
      scene.innerHTML =
        '<button type="button" class="lux-sbs-x" aria-label="הסתר">✕</button>' +
        '<div class="lux-sbs-dust" aria-hidden="true">' +
          Array.apply(null, Array(10)).map(function (_, i) {
            return '<i style="left:' + (5 + Math.random() * 90) + "%;animation-delay:" + (Math.random() * 5) + "s;animation-duration:" + (5 + Math.random() * 5) + 's;"></i>';
          }).join("") +
        "</div>" +
        '<div class="lux-sbs-candles">' + candle + candle + "</div>" +
        '<div class="lux-sbs-title">' + (isChag ? "חג שמח" : "שבת שלום") + "</div>" +
        (parsha && parsha !== "--" ? '<div class="lux-sbs-parsha">' + esc(parsha) + "</div>" : "") +
        ((enter && enter !== "--:--") ?
          '<div class="lux-sbs-times">🕯️ הדלקת נרות: <b>' + esc(enter) + "</b>" +
          ((exit && exit !== "--:--") ? ' · ✨ הבדלה: <b>' + esc(exit) + "</b>" : "") + "</div>" : "");
      wrap.insertAdjacentElement("beforebegin", scene);
      scene.querySelector(".lux-sbs-x").addEventListener("click", function () {
        try { sessionStorage.setItem("lux_sbs_dismiss", "1"); } catch (e) {}
        scene.remove();
        document.body.classList.remove("lux-shabbat-scene-on");
      });
      document.body.classList.add("lux-shabbat-scene-on");
    }
    function check() {
      var disp = document.getElementById("countdown-display");
      var type = document.getElementById("countdown-event-type");
      if (!disp || !type) return;
      var txt = (disp.textContent || "").trim();
      var mm = txt.match(/^(\d+):(\d{2}):(\d{2})$/);
      var typeTxt = type.textContent || "";
      var isEntry = /כניסת/.test(typeTxt);
      var isExit = /יציאת|צאת/.test(typeTxt);
      var mins = mm ? parseInt(mm[1], 10) * 60 + parseInt(mm[2], 10) : null;
      var isChag = /חג/.test(typeTxt);
      var d = new Date().getDay();
      var on = (isEntry && mins !== null && mins < 45) || (isExit && (d === 5 || d === 6));
      var scene = document.getElementById("lux-shabbat-scene");
      if (on && !scene) buildScene(isChag);
      else if (!on && scene) { scene.remove(); document.body.classList.remove("lux-shabbat-scene-on"); }
    }
    setInterval(check, 20000);
    setTimeout(check, 4500);
  });

  /* ── 39. סטוריז יומיים ─────────────────────────────────────────── */
  safe("stories", function () {
    var AUTO_KEY = "lux_stories_auto";      // "1" = פתיחה אוטומטית יומית (כבוי כברירת מחדל)
    var SEEN_KEY = "lux_stories_last";
    var TH_MONTHLY = {
      1: "א-ט", 2: "י-יז", 3: "יח-כב", 4: "כג-כח", 5: "כט-לד", 6: "לה-לח",
      7: "לט-מג", 8: "מד-מח", 9: "מט-נד", 10: "נה-נט", 11: "ס-סה", 12: "סו-סח",
      13: "סט-עא", 14: "עב-עו", 15: "עז-עח", 16: "עט-פב", 17: "פג-פז", 18: "פח-פט",
      19: "צ-צו", 20: "צז-קג", 21: "קד-קה", 22: "קו-קז", 23: "קח-קיב", 24: "קיג-קיח",
      25: 'קיט (עד צ"ו)', 26: 'קיט (מצ"ז)', 27: "קכ-קלד", 28: "קלה-קלט", 29: "קמ-קמד", 30: "קמה-קנ"
    };

    function buildSlides() {
      var slides = [];
      var h = new Date().getHours();
      var greet = h >= 5 && h < 12 ? "בוקר טוב" : h >= 12 && h < 17 ? "צהריים טובים" : h >= 17 && h < 21 ? "ערב טוב" : "לילה טוב";
      var name = "";
      try { name = localStorage.getItem("lux_user_name") || ""; } catch (e) {}
      var heb = luxHebDateStr();
      var greg = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
      slides.push({
        cls: "lux-st-cover",
        html: '<div class="lux-st-big">' + (h >= 21 || h < 5 ? "🌙" : "☀️") + "</div>" +
              '<h2>' + greet + (name ? ", " + esc(name) : "") + "</h2>" +
              (heb ? '<p class="lux-st-heb">' + esc(heb) + "</p>" : "") +
              '<p class="lux-st-sub">' + esc(greg) + "</p>"
      });
      var todayIso = new Date().toISOString().slice(0, 10);
      var day = new Date().getDay();
      var hd0 = luxHebDay(new Date());
      var todayEvents = (getCachedEvents() || []).filter(function (e) { return e.date === todayIso; });
      // חג או צום היום
      todayEvents.forEach(function (e) {
        if (e.type === "major") {
          slides.push({
            cls: "lux-st-holiday",
            html: '<div class="lux-st-big">' + (e.icon || "✨") + "</div><h2>" + esc(e.name) + "</h2>" +
                  '<p class="lux-st-line">היום! חג שמח ומבורך 🎉</p>'
          });
        } else if (e.type === "fast") {
          slides.push({
            cls: "lux-st-selichot",
            html: '<div class="lux-st-big">⚖️</div><h2>' + esc(e.name) + "</h2>" +
                  '<p class="lux-st-line">היום יום צום —<br>שיהיה צום קל ומועיל 🙏</p>'
          });
        }
      });
      // ראש חודש
      if (hd0 === 1 || hd0 === 30) {
        var rcMonth = luxHebMonth(hd0 === 30 ? new Date(Date.now() + 86400000) : new Date());
        slides.push({
          cls: "lux-st-zman",
          html: '<div class="lux-st-big">🌒</div><h2>ראש חודש ' + esc(rcMonth) + "</h2>" +
                '<p class="lux-st-line">חודש טוב ומבורך!<br>זוכרים לומר <b>יעלה ויבוא</b> בתפילה</p>'
        });
      }
      // ערב שבת / ערב חג — כניסה; שבת/חג — יציאה
      var enter = ((document.getElementById("shabbat-enter") || {}).textContent || "").trim();
      var exit = ((document.getElementById("shabbat-exit") || {}).textContent || "").trim();
      var parsha0 = ((document.getElementById("stat-parasha") || {}).textContent || "").trim();
      if (day === 5 && enter && enter !== "--:--") {
        slides.push({
          cls: "lux-st-cover",
          html: '<div class="lux-st-big">🕯️</div><h2>שבת מתקרבת</h2>' +
                '<p class="lux-st-line">הדלקת נרות: <b>' + esc(enter) + "</b></p>" +
                (parsha0 && parsha0 !== "--" ? '<p class="lux-st-sub">פרשת השבוע: ' + esc(parsha0) + "</p>" : "") +
                '<p class="lux-st-sub">שבת שלום ומבורך! ✨</p>'
        });
      } else if (day === 6 && exit && exit !== "--:--") {
        slides.push({
          cls: "lux-st-cover",
          html: '<div class="lux-st-big">✨</div><h2>מוצאי שבת הערב</h2>' +
                '<p class="lux-st-line">צאת השבת: <b>' + esc(exit) + "</b></p>" +
                '<p class="lux-st-sub">שבוע טוב ומבורך!</p>'
        });
      }
      // ערב חג (הדלקת נרות של חג מחושבת ע"י האתר)
      if (window.HOLIDAY_CANDLES_STR && window.HOLIDAY_NAME_HE && day !== 5 && day !== 6) {
        var hcd = window.HOLIDAY_CANDLES_TIME ? new Date(window.HOLIDAY_CANDLES_TIME) : null;
        if (hcd && (hcd - new Date()) > 0 && (hcd - new Date()) < 36 * 3600000) {
          slides.push({
            cls: "lux-st-holiday",
            html: '<div class="lux-st-big">🕯️</div><h2>' + esc(window.HOLIDAY_NAME_HE) + " בפתח</h2>" +
                  '<p class="lux-st-line">הדלקת נרות: <b>' + esc(window.HOLIDAY_CANDLES_STR) + "</b></p>" +
                  (window.HOLIDAY_HAVDALAH_STR ? '<p class="lux-st-sub">צאת החג: ' + esc(window.HOLIDAY_HAVDALAH_STR) + "</p>" : "") +
                  '<p class="lux-st-sub">חג שמח! 🎉</p>'
          });
        }
      }
      // ספירת העומר
      if (window.CURRENT_OMER_DAY && window.CURRENT_OMER_DAY > 0 && window.CURRENT_OMER_DAY <= 49) {
        slides.push({
          cls: "lux-st-zman",
          html: '<div class="lux-st-big">🌾</div><h2>ספירת העומר</h2>' +
                '<p class="lux-st-line">היום <b class="lux-st-range">' + window.CURRENT_OMER_DAY + '</b> ימים לעומר</p>' +
                '<p class="lux-st-sub">לא לשכוח לספור הערב! 🌙</p>'
        });
      }
      // זמנים
      var z = window._lastZData;
      if (z && z.times) {
        var nz = document.getElementById("lux-next-zman");
        var nextTxt = nz ? nz.textContent.replace(/^⏳\s*/, "") : "";
        var chips = [
          { k: "sunrise", l: "הנץ" }, { k: "sofZmanShma", l: 'סו"ז ק"ש' },
          { k: "chatzot", l: "חצות" }, { k: "sunset", l: "שקיעה" }, { k: "tzeit7083deg", l: "צאת" }
        ].filter(function (c) { return z.times[c.k]; }).map(function (c) {
          return '<span class="lux-st-chip">' + c.l + " · <b>" + fmtTime(z.times[c.k]) + "</b></span>";
        }).join("");
        slides.push({
          cls: "lux-st-zman",
          html: '<div class="lux-st-big">🕰️</div><h2>זמני היום</h2>' +
                (nextTxt ? '<p class="lux-st-next">⏳ ' + esc(nextTxt) + "</p>" : "") +
                '<div class="lux-st-chips">' + chips + "</div>"
        });
      }
      // פרשה ודף יומי — עם כפתורים ישירים ללימוד
      var parsha = ((document.getElementById("stat-parasha") || {}).textContent || "").trim();
      var daf = ((document.getElementById("daf-yomi-text") || {}).textContent || "").trim();
      if (parsha || daf) {
        slides.push({
          cls: "lux-st-torah",
          html: '<div class="lux-st-big">📖</div><h2>הלימוד היומי</h2>' +
                (parsha ? '<p class="lux-st-line">פרשת השבוע: <b>' + esc(parsha) + "</b></p>" : "") +
                (daf ? '<p class="lux-st-line">דף יומי: <b>' + esc(daf) + "</b></p>" : ""),
          ctas: [
            { label: "📖 לדף היומי של היום", run: function () {
                var el = document.getElementById("daf-yomi-link");
                if (el) el.click();
              } },
            { label: "📜 שניים מקרא ואחד תרגום", run: function () {
                var el = document.getElementById("shnayim-mikra-link");
                if (el) el.click();
              } },
            { label: "📚 חוק לישראל היומי", run: function () {
                if (typeof window.openChokLeIsraelModal === "function") window.openChokLeIsraelModal();
              } }
          ]
        });
      }
      // תהילים יומי
      var hd = luxHebDay(new Date()) || 1;
      var range = TH_MONTHLY[Math.min(hd, 30)] || "";
      var read = jget("lux_tehillim_read", []).length;
      slides.push({
        cls: "lux-st-tehillim",
        html: '<div class="lux-st-big">📖</div><h2>תהילים היומי</h2>' +
              '<p class="lux-st-line">החלוקה החודשית להיום:<br><b class="lux-st-range">פרקים ' + esc(range) + "</b></p>" +
              (read ? '<p class="lux-st-sub">סימנת עד כה ' + read + " פרקים מתוך 150 🌟</p>" : ""),
        cta: { label: "לקריאת התהילים ←", run: function () { if (typeof window.openTehillimPage === "function") window.openTehillimPage(); } }
      });
      // פנינה יומית
      var pearl = document.getElementById("lux-pearl");
      if (pearl) {
        var pt = pearl.querySelector(".lux-pearl-text"), ps = pearl.querySelector(".lux-pearl-src");
        slides.push({
          cls: "lux-st-pearl",
          html: '<div class="lux-st-big">💎</div><h2>פנינה יומית</h2>' +
                '<p class="lux-st-quote">' + (pt ? pt.innerHTML : "") + "</p>" +
                '<p class="lux-st-src">' + (ps ? ps.textContent : "") + "</p>"
        });
      }
      // סליחות בעונה
      var hm = luxHebMonth(new Date());
      if (hm === "אלול" || (hm === "תשרי" && hd <= 9)) {
        slides.push({
          cls: "lux-st-selichot",
          html: '<div class="lux-st-big">🕊️</div><h2>ימי הסליחות</h2>' +
                '<p class="lux-st-line">אנחנו בימי הרחמים והסליחות —<br>זמן מיוחד של קרבה ותשובה</p>',
          cta: { label: "לאמירת הסליחות ←", run: function () { if (window.luxOpenSelichot) window.luxOpenSelichot(); } }
        });
      }
      // החג הקרוב
      var evs = (getCachedEvents() || []).filter(function (e) {
        if (e.type !== "major" && e.type !== "fast") return false;
        var diff = (new Date(e.date) - new Date()) / 86400000;
        return diff > -0.5 && diff < 90;
      });
      if (evs.length) {
        var ev = evs[0];
        var days = Math.max(0, Math.ceil((new Date(ev.date) - new Date()) / 86400000));
        slides.push({
          cls: "lux-st-holiday",
          html: '<div class="lux-st-big">' + (ev.icon || "✨") + "</div><h2>" + esc(ev.name) + "</h2>" +
                '<p class="lux-st-line">' + (days === 0 ? "היום! 🎉" : "בעוד <b>" + days + "</b> ימים") + "</p>" +
                '<p class="lux-st-sub">' + new Date(ev.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" }) + "</p>"
        });
      }
      return slides;
    }

    var stIdx = 0, stTimer = null, stPaused = false;
    var DUR = 6000;

    function closeStories() {
      clearTimeout(stTimer);
      stTimer = null;
      var ov = document.getElementById("lux-stories");
      if (ov) ov.remove();
    }
    function openStories() {
      closeStories();
      try { localStorage.setItem(SEEN_KEY, new Date().toISOString().slice(0, 10)); } catch (e) {}
      var slides = buildSlides();
      if (!slides.length) return;
      stIdx = 0;
      var ov = document.createElement("div");
      ov.id = "lux-stories";
      ov.innerHTML =
        '<div class="lux-st-bars">' + slides.map(function () {
          return '<span class="lux-st-bar"><i></i></span>';
        }).join("") + "</div>" +
        '<button type="button" class="lux-st-x" aria-label="סגור">✕</button>' +
        '<div class="lux-st-slide"></div>' +
        '<div class="lux-st-tap lux-st-tap-next" aria-hidden="true"></div>' +
        '<div class="lux-st-tap lux-st-tap-prev" aria-hidden="true"></div>';
      document.body.appendChild(ov);
      luxModalOpen("lux-stories");

      ov.querySelector(".lux-st-x").addEventListener("click", function () { luxModalClose("lux-stories"); clearTimeout(stTimer); });

      function paint() {
        var s = slides[stIdx];
        var slideEl = ov.querySelector(".lux-st-slide");
        slideEl.className = "lux-st-slide " + s.cls;
        var ctas = s.ctas || (s.cta ? [s.cta] : []);
        slideEl.innerHTML = s.html +
          (ctas.length
            ? '<div class="lux-st-ctas">' + ctas.map(function (c, ci) {
                return '<button type="button" class="lux-st-cta" data-ci="' + ci + '">' + c.label + "</button>";
              }).join("") + "</div>"
            : "");
        slideEl.querySelectorAll(".lux-st-cta").forEach(function (btn) {
          btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var c = ctas[parseInt(btn.dataset.ci, 10)];
            if (!c) return;
            luxModalClose("lux-stories");
            clearTimeout(stTimer);
            setTimeout(c.run, 200);
          });
        });
        // פסי התקדמות
        ov.querySelectorAll(".lux-st-bar").forEach(function (b, i) {
          b.className = "lux-st-bar" + (i < stIdx ? " lux-st-done" : i === stIdx ? " lux-st-active" : "");
          var fill = b.firstChild;
          fill.style.animation = "none";
          void fill.offsetWidth;
          if (i === stIdx) fill.style.animation = "lux-st-fill " + (DUR / 1000) + "s linear forwards";
        });
        clearTimeout(stTimer);
        stTimer = setTimeout(next, DUR);
      }
      function next() {
        if (stIdx >= slides.length - 1) { luxModalClose("lux-stories"); clearTimeout(stTimer); return; }
        stIdx++;
        paint();
      }
      function prev() {
        if (stIdx > 0) stIdx--;
        paint();
      }
      // אזורי מגע: שמאל = הבא (כיוון קריאה עברי), ימין = הקודם
      ov.querySelector(".lux-st-tap-next").addEventListener("click", next);
      ov.querySelector(".lux-st-tap-prev").addEventListener("click", prev);
      // החזקה משהה את ההתקדמות
      var holdT = null;
      ov.addEventListener("touchstart", function () {
        holdT = setTimeout(function () {
          stPaused = true;
          clearTimeout(stTimer);
          ov.querySelectorAll(".lux-st-bar i").forEach(function (f) { f.style.animationPlayState = "paused"; });
        }, 220);
      }, { passive: true });
      ov.addEventListener("touchend", function () {
        clearTimeout(holdT);
        if (stPaused) {
          stPaused = false;
          paint(); // מתחיל את השקופית הנוכחית מחדש
        }
      }, { passive: true });
      // החלקה למטה סוגרת
      var sy = null;
      ov.addEventListener("touchstart", function (e) { sy = e.touches[0].clientY; }, { passive: true });
      ov.addEventListener("touchend", function (e) {
        if (sy !== null && e.changedTouches[0].clientY - sy > 90) { luxModalClose("lux-stories"); clearTimeout(stTimer); }
        sy = null;
      }, { passive: true });
      paint();
    }
    window.luxOpenStories = openStories;

    // כפתור בסרגל העליון — ליד השיתוף והמצפן (מובייל + מחשב)
    function injectRing() {
      if (document.getElementById("lux-story-ring")) return;
      var shareBtn = document.querySelector('button[onclick="shareApp()"]');
      var b = document.createElement("button");
      b.type = "button";
      b.id = "lux-story-ring";
      b.title = "הסטוריז היומי";
      b.setAttribute("aria-label", "הסטוריז היומי");
      b.innerHTML = '<span class="lux-sr-ring"><span class="lux-sr-inner">✨</span></span>';
      b.addEventListener("click", openStories);
      if (shareBtn && shareBtn.parentElement) {
        shareBtn.insertAdjacentElement("afterend", b);
      } else {
        var greet = document.getElementById("lux-greeting");
        if (greet) greet.insertAdjacentElement("beforebegin", b);
      }
    }
    injectRing();
    setTimeout(injectRing, 2500);

    // מתג בהגדרות: פתיחה אוטומטית פעם ביום (כבוי כברירת מחדל)
    function injectToggle() {
      var anchor = document.getElementById("lux-tour-btn");
      if (!anchor || document.getElementById("lux-stories-auto-toggle")) return;
      var host = anchor.closest("div");
      var on = false;
      try { on = localStorage.getItem(AUTO_KEY) === "1"; } catch (e) {}
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-stories-auto-toggle" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span class="font-semibold text-sm">✨ סטוריז אוטומטי בכניסה</span>' +
          '<span class="lux-sw' + (on ? " lux-sw-on" : "") + '"><span class="lux-sw-dot"></span></span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-stories-auto-toggle").addEventListener("click", function () {
        var sw = field.querySelector(".lux-sw");
        var nowOn = !sw.classList.contains("lux-sw-on");
        sw.classList.toggle("lux-sw-on", nowOn);
        try { localStorage.setItem(AUTO_KEY, nowOn ? "1" : "0"); } catch (e) {}
        if (typeof window.showToast === "function") {
          window.showToast(nowOn ? "✨ הסטוריז ייפתח אוטומטית פעם ביום" : "הפתיחה האוטומטית כובתה", "success", 2400);
        }
      });
    }
    injectToggle();
    setTimeout(injectToggle, 2600);

    // פתיחה אוטומטית — פעם ביום, רק אם המשתמש הפעיל זאת
    setTimeout(function () {
      try {
        if (localStorage.getItem(AUTO_KEY) !== "1") return;
        var today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(SEEN_KEY) === today) return;
        var ready = document.getElementById("dashboard-state") &&
          !document.getElementById("dashboard-state").classList.contains("hidden");
        if (ready) openStories();
      } catch (e) {}
    }, 3800);
  });

  /* ── 40. שעון הלכתי אנלוגי — שעות זמניות ───────────────────────── */
  safe("halachicClock", function () {
    var tickT = null;
    function heHour(n) {
      var t = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
      return t[n] || n;
    }
    function calc() {
      // שעות זמניות כדעת הבן איש חי (כשיטת המגן אברהם):
      // היום ההלכתי — מעמוד השחר עד צאת הכוכבים, חלקי 12.
      var z = window._lastZData;
      if (!z || !z.times || !z.times.sunrise || !z.times.sunset) return null;
      var now = Date.now();
      var dayStart = new Date(z.times.alotHaShachar || z.times.sunrise).getTime();
      var dayEnd = new Date(z.times.tzeit7083deg || z.times.sunset).getTime();
      var isDay = now >= dayStart && now < dayEnd;
      var start, end;
      if (isDay) { start = dayStart; end = dayEnd; }
      else if (now >= dayEnd) { start = dayEnd; end = dayStart + 86400000; } // לילה אחרי צאת הכוכבים
      else { start = dayEnd - 86400000; end = dayStart; }                    // לפנות בוקר, לפני עמוד השחר
      var hourMs = (end - start) / 12;
      var pos = (now - start) / hourMs; // 0..12
      return { isDay: isDay, hourMs: hourMs, pos: pos, start: start, end: end };
    }
    var NIGHT_STARS = null;
    // סימוני היום לפי שעות זמניות מעמוד השחר עד צאת הכוכבים (דעת הבן איש חי)
    var DAY_MARKS = [
      { at: 3, l: 'סו"ז ק"ש' },
      { at: 4, l: 'סו"ז תפילה' },
      { at: 6, l: "חצות" },
      { at: 6.5, l: "מנחה גדולה" },
      { at: 9.5, l: "מנחה קטנה" },
      { at: 10.75, l: "פלג המנחה" },
      { at: 12, l: "צאת הכוכבים" }
    ];
    // הנץ והשקיעה — ממוקמים דינמית לפי הזמן האמיתי שלהם בתוך היום ההלכתי
    function dayMarks(c) {
      var marks = DAY_MARKS.slice();
      try {
        var z = window._lastZData;
        ["sunrise", "sunset"].forEach(function (k) {
          var iso = z && z.times && z.times[k];
          if (!iso) return;
          var t = new Date(iso).getTime();
          if (t > c.start && t < c.end) {
            marks.push({ at: (t - c.start) / c.hourMs, l: k === "sunrise" ? "הנץ החמה" : "שקיעה" });
          }
        });
        marks.sort(function (a, b) { return a.at - b.at; });
      } catch (e) {}
      return marks;
    }
    // ── לוח כל זמני היום — מוצג מתחת לשעון בצורה ברורה ומסודרת ──
    var ALL_ZMANIM = [
      ["alotHaShachar", "עלות השחר", "🌌"],
      ["misheyakir", "משיכיר (טלית ותפילין)", "🌄"],
      ["sunrise", "הנץ החמה", "🌅"],
      ["sofZmanShmaMGA", 'סוף זמן ק"ש — מג"א', "📖"],
      ["sofZmanShma", 'סוף זמן ק"ש — גר"א', "📖"],
      ["sofZmanTfillaMGA", 'סוף זמן תפילה — מג"א', "🙏"],
      ["sofZmanTfilla", 'סוף זמן תפילה — גר"א', "🙏"],
      ["chatzot", "חצות היום", "☀️"],
      ["minchaGedola", "מנחה גדולה", "🕓"],
      ["minchaKetana", "מנחה קטנה", "🕔"],
      ["plagHaMincha", "פלג המנחה", "🌇"],
      ["sunset", "שקיעה", "🌆"],
      ["tzeit7083deg", "צאת הכוכבים", "✨"],
      ["chatzotNight", "חצות הלילה", "🌃"]
    ];
    function schedHtml() {
      var z = window._lastZData;
      if (!z || !z.times) return "";
      var now = Date.now();
      var rows = [], nextKey = null, nextDiff = Infinity;
      ALL_ZMANIM.forEach(function (it) {
        var iso = z.times[it[0]];
        if (!iso) return;
        var t = new Date(iso).getTime();
        var diff = t - now;
        if (diff > 0 && diff < nextDiff) { nextDiff = diff; nextKey = it[0]; }
        rows.push({ k: it[0], l: it[1], e: it[2], t: t, iso: iso });
      });
      if (!rows.length) return "";
      return '<div class="lux-hc-sched">' +
        '<h4 class="lux-hc-sched-title">📋 כל זמני היום</h4>' +
        '<div class="lux-hc-grid">' +
        rows.map(function (r) {
          var past = r.t <= now;
          var isNext = r.k === nextKey;
          var hm = new Date(r.iso).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
          var chip = "";
          if (isNext) {
            var lm = Math.max(0, Math.round((r.t - now) / 60000));
            chip = '<span class="lux-hc-zin">בעוד ' +
              (lm >= 60 ? Math.floor(lm / 60) + " שע' ו-" + (lm % 60) + " דק'" : lm + " דק'") +
              "</span>";
          }
          return '<div class="lux-hc-zrow' + (past ? " lux-hc-zpast" : "") + (isNext ? " lux-hc-znext" : "") + '">' +
            '<span class="lux-hc-zname"><span class="lux-hc-zemo">' + r.e + "</span> " + r.l + "</span>" +
            chip +
            '<span class="lux-hc-ztime">' + (past ? "✓ " : "") + hm + "</span>" +
          "</div>";
        }).join("") +
        "</div></div>";
    }

    // סימוני הלילה — הלילה ההלכתי: מצאת הכוכבים עד עמוד השחר
    function nightMarks(c) {
      var marks = [{ at: 6, l: "חצות הלילה" }, { at: 12, l: "עמוד השחר" }];
      return marks;
    }
    // ── בנייה סטטית של פני השעון — נבנית פעם אחת, לא כל שנייה ──
    // (בנייה מחדש כל שנייה מאתחלת את אנימציות ה-SVG וגורמת לריצוד בנייד)
    var faceSig = null, infoSig = null;
    function buildFace(svg, c, marks) {
      var CX = 170, CY = 170, TWO = 2 * Math.PI;
      var isDay = c.isDay;
      var parts = [];
      parts.push('<defs>' +
        '<radialGradient id="lux-hcf">' +
          (isDay
            ? '<stop offset="0" stop-color="#fff8e6"/><stop offset="0.7" stop-color="#f7e9c4"/><stop offset="1" stop-color="#e7d093"/>'
            : '<stop offset="0" stop-color="#1a2a4f"/><stop offset="0.7" stop-color="#0c1530"/><stop offset="1" stop-color="#060c1d"/>') +
        "</radialGradient>" +
        '<linearGradient id="lux-hch" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#f2d98a"/><stop offset="1" stop-color="#c9993a"/>' +
        "</linearGradient>" +
        '<filter id="lux-hcg" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      "</defs>");
      // טבעת חיצונית מקווקוות מסתובבת לאט
      parts.push('<g class="lux-hc-spin" style="transform-origin:170px 170px;"><circle cx="170" cy="170" r="160" fill="none" stroke="rgba(224,183,79,0.4)" stroke-width="1.6" stroke-dasharray="3 8"/></g>');
      parts.push('<circle cx="170" cy="170" r="148" fill="url(#lux-hcf)" stroke="#c9993a" stroke-width="3.5"/>');
      // לילה: שמי כוכבים מנצנצים · יום: קרני שמש עדינות
      if (!isDay) {
        if (!NIGHT_STARS) {
          NIGHT_STARS = [];
          for (var st = 0; st < 24; st++) {
            var a0 = Math.random() * TWO, rr = 34 + Math.random() * 96;
            NIGHT_STARS.push([
              170 + rr * Math.cos(a0), 170 + rr * Math.sin(a0),
              (0.5 + Math.random() * 1.3).toFixed(1), (1.8 + Math.random() * 3).toFixed(1)
            ]);
          }
        }
        NIGHT_STARS.forEach(function (s) {
          parts.push('<circle cx="' + s[0].toFixed(1) + '" cy="' + s[1].toFixed(1) + '" r="' + s[2] + '" fill="#dbe7ff"><animate attributeName="opacity" values="0.12;0.9;0.12" dur="' + s[3] + 's" repeatCount="indefinite"/></circle>');
        });
      } else {
        for (var ray = 0; ray < 24; ray++) {
          var ra = (ray / 24) * TWO;
          parts.push('<line x1="' + (170 + 118 * Math.cos(ra)).toFixed(1) + '" y1="' + (170 + 118 * Math.sin(ra)).toFixed(1) + '" x2="' + (170 + 132 * Math.cos(ra)).toFixed(1) + '" y2="' + (170 + 132 * Math.sin(ra)).toFixed(1) + '" stroke="rgba(224,183,79,0.16)" stroke-width="2.2"/>');
        }
      }
      // קשת ההתקדמות הזוהרת — האורך שלה מתעדכן כל שנייה ב-updateDynamic
      var CIRC = TWO * 140;
      parts.push('<circle cx="170" cy="170" r="140" fill="none" stroke="rgba(224,183,79,0.16)" stroke-width="7"/>');
      parts.push('<circle id="lux-hcd-arc" cx="170" cy="170" r="140" fill="none" stroke="url(#lux-hch)" stroke-width="7" stroke-linecap="round" stroke-dasharray="0.01 ' + CIRC.toFixed(1) + '" transform="rotate(-90 170 170)" filter="url(#lux-hcg)"/>');
      // ספרות ושנתות
      for (var h = 1; h <= 12; h++) {
        var ang = ((h - 0.5) / 12) * TWO - Math.PI / 2;
        var tx = CX + 108 * Math.cos(ang), ty = CY + 108 * Math.sin(ang);
        parts.push('<text x="' + tx.toFixed(1) + '" y="' + (ty + 5.5).toFixed(1) + '" text-anchor="middle" class="lux-hc-num' + (isDay ? "" : " lux-hc-num-n") + '">' + heHour(h) + "</text>");
        var ang2 = (h / 12) * TWO - Math.PI / 2;
        parts.push('<line x1="' + (CX + 124 * Math.cos(ang2)).toFixed(1) + '" y1="' + (CY + 124 * Math.sin(ang2)).toFixed(1) + '" x2="' + (CX + 132 * Math.cos(ang2)).toFixed(1) + '" y2="' + (CY + 132 * Math.sin(ang2)).toFixed(1) + '" class="lux-hc-tick"/>');
      }
      for (var q = 0; q < 48; q++) {
        if (q % 4 === 0) continue;
        var qa = (q / 48) * TWO - Math.PI / 2;
        parts.push('<line x1="' + (CX + 128 * Math.cos(qa)).toFixed(1) + '" y1="' + (CY + 128 * Math.sin(qa)).toFixed(1) + '" x2="' + (CX + 132 * Math.cos(qa)).toFixed(1) + '" y2="' + (CY + 132 * Math.sin(qa)).toFixed(1) + '" class="lux-hc-tick" style="opacity:0.4;stroke-width:1;"/>');
      }
      // סימוני זמני ההלכה עם שמות — תוויות צפופות משובצות לסירוגין בשני
      // רדיוסים (פנימי/חיצוני) כדי שלא יידרסו זו על זו, עם קו מוביל עדין
      var CLOSE = (TWO / 12) * 1.35; // זמנים קרובים מ~1.35 שעות זמניות — מדורגים
      var LBL_R = [70, 51];
      var placed = [], lastAng = null, lastLvl = 0;
      marks.forEach(function (mk) {
        var ang3 = (mk.at / 12) * TWO - Math.PI / 2;
        var lvl = 0;
        if (lastAng !== null && ang3 - lastAng < CLOSE) lvl = lastLvl === 0 ? 1 : 0;
        placed.push({ mk: mk, ang: ang3, lvl: lvl });
        lastAng = ang3; lastLvl = lvl;
      });
      // התפר בראש השעון: התווית הראשונה והאחרונה עלולות להתנגש מעבר ל-12
      if (placed.length > 2) {
        var pf = placed[0], pl = placed[placed.length - 1];
        if (pf.ang + TWO - pl.ang < CLOSE && pf.lvl === pl.lvl) pf.lvl = pf.lvl === 0 ? 1 : 0;
      }
      placed.forEach(function (pm) {
        var mk = pm.mk, ang3 = pm.ang;
        var mx = CX + 88 * Math.cos(ang3), my = CY + 88 * Math.sin(ang3);
        var past = c.pos >= mk.at;
        parts.push('<circle cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="3.6" class="' + (past ? "lux-hc-mark-past" : "lux-hc-mark") + '"' + (past ? "" : ' filter="url(#lux-hcg)"') + "/>");
        var lr = LBL_R[pm.lvl];
        if (pm.lvl === 1) {
          parts.push('<line x1="' + (CX + 83 * Math.cos(ang3)).toFixed(1) + '" y1="' + (CY + 83 * Math.sin(ang3)).toFixed(1) + '" x2="' + (CX + (lr + 6) * Math.cos(ang3)).toFixed(1) + '" y2="' + (CY + (lr + 6) * Math.sin(ang3)).toFixed(1) + '" class="lux-hc-leader"/>');
        }
        var lx = CX + lr * Math.cos(ang3), ly = CY + lr * Math.sin(ang3);
        parts.push('<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="middle" class="lux-hc-mklbl' + (isDay ? "" : " lux-hc-mklbl-n") + (past ? " lux-hc-mklbl-past" : "") + '">' + mk.l + "</text>");
      });
      // המחוג — עם שמש/ירח בקצהו (המיקום מתעדכן כל שנייה ב-updateDynamic)
      parts.push('<line id="lux-hcd-hand" x1="170" y1="170" x2="170" y2="74" class="lux-hc-hand" filter="url(#lux-hcg)"/>');
      parts.push('<circle id="lux-hcd-end" cx="170" cy="58" r="13" fill="' + (isDay ? "#fff6d8" : "#101a35") + '" stroke="#c9993a" stroke-width="2"><animate attributeName="r" values="12;14;12" dur="2.4s" repeatCount="indefinite"/></circle>');
      parts.push('<text id="lux-hcd-emoji" x="170" y="63" text-anchor="middle" font-size="14">' + (isDay ? "☀️" : "🌙") + "</text>");
      // מרכז: שעון דיגיטלי חי
      parts.push('<circle cx="170" cy="170" r="37" fill="' + (isDay ? "rgba(255,252,240,0.92)" : "rgba(6,12,29,0.88)") + '" stroke="rgba(201,153,58,0.7)" stroke-width="1.6"/>');
      parts.push('<text id="lux-hcd-dig" x="170" y="166" text-anchor="middle" class="lux-hc-dig' + (isDay ? "" : " lux-hc-dig-n") + '"></text>');
      parts.push('<text id="lux-hcd-hour" x="170" y="184" text-anchor="middle" class="lux-hc-sub2"></text>');
      svg.innerHTML = parts.join("");
    }
    // ── עדכון דינמי כל שנייה — נגיעה נקודתית במאפיינים, בלי לבנות DOM ──
    function updateDynamic(ov, c) {
      var CX = 170, CY = 170, TWO = 2 * Math.PI;
      var frac = Math.max(0, Math.min(1, c.pos / 12));
      var CIRC = TWO * 140;
      var arc = ov.querySelector("#lux-hcd-arc");
      if (arc) arc.setAttribute("stroke-dasharray", (frac > 0.005 ? (CIRC * frac).toFixed(1) : "0.01") + " " + CIRC.toFixed(1));
      var hAng = frac * TWO - Math.PI / 2;
      var hand = ov.querySelector("#lux-hcd-hand");
      if (hand) {
        hand.setAttribute("x2", (CX + 96 * Math.cos(hAng)).toFixed(1));
        hand.setAttribute("y2", (CY + 96 * Math.sin(hAng)).toFixed(1));
      }
      var ex = CX + 112 * Math.cos(hAng), ey = CY + 112 * Math.sin(hAng);
      var end = ov.querySelector("#lux-hcd-end");
      if (end) { end.setAttribute("cx", ex.toFixed(1)); end.setAttribute("cy", ey.toFixed(1)); }
      var emo = ov.querySelector("#lux-hcd-emoji");
      if (emo) { emo.setAttribute("x", ex.toFixed(1)); emo.setAttribute("y", (ey + 5).toFixed(1)); }
      var now = new Date();
      var dig = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") + ":" + String(now.getSeconds()).padStart(2, "0");
      var digEl = ov.querySelector("#lux-hcd-dig");
      if (digEl && digEl.textContent !== dig) digEl.textContent = dig;
      var whole = Math.min(12, Math.floor(c.pos) + 1);
      var hourStr = "שעה " + heHour(whole) + "׳";
      var hourEl = ov.querySelector("#lux-hcd-hour");
      if (hourEl && hourEl.textContent !== hourStr) hourEl.textContent = hourStr;
    }
    // ── פאנל המידע — נבנה מחדש רק כשהדקה מתחלפת ──
    function buildInfo(info, c, marks) {
      var isDay = c.isDay;
      var frac = Math.max(0, Math.min(1, c.pos / 12));
      var whole = Math.min(12, Math.floor(c.pos) + 1);
      var mins = Math.round(c.hourMs / 60000);
      var next = null;
      for (var mi = 0; mi < marks.length; mi++) {
        if (marks[mi].at > c.pos) { next = marks[mi]; break; }
      }
      var nextHtml = "";
      if (next) {
        var leftMin = Math.max(0, Math.round((next.at - c.pos) * c.hourMs / 60000));
        var leftStr = leftMin >= 60 ? Math.floor(leftMin / 60) + " שע' ו-" + (leftMin % 60) + " דק'" : leftMin + " דקות";
        nextHtml = '<div class="lux-hc-next">⏳ <b>' + next.l + "</b> בעוד " + leftStr + "</div>";
      }
      var pct = Math.round(frac * 100);
      info.innerHTML =
        nextHtml +
        '<div class="lux-hc-pbar"><div class="lux-hc-pfill" style="width:' + pct + '%;"></div></div>' +
        '<div class="lux-hc-pct">עברו ' + pct + "% מ" + (isDay ? "היום" : "הלילה") + " ההלכתי</div>" +
        '<div class="lux-hc-row"><span>אורך שעה זמנית ' + (isDay ? "ביום" : "בלילה") + ":</span><b>" + mins + " דקות</b></div>" +
        '<div class="lux-hc-row"><span>השעה הזמנית הנוכחית:</span><b>' + heHour(whole) + "׳ " + (isDay ? "של היום" : "של הלילה") + "</b></div>" +
        schedHtml() +
        '<div class="lux-hc-note">שעה זמנית — כדעת <b>הבן איש חי</b>: חלוקת ' + (isDay ? "היום (מעמוד השחר עד צאת הכוכבים)" : "הלילה (מצאת הכוכבים עד עמוד השחר)") + ' ל-12 חלקים שווים. כך נקבעים זמני ההלכה: סוף זמן ק"ש בסוף השעה השלישית, מנחה גדולה מחצי שעה אחר חצות, ועוד.</div>';
    }
    function render(ov) {
      var c = calc();
      var svg = ov.querySelector("#lux-hc-svg");
      var info = ov.querySelector("#lux-hc-info");
      if (!c) {
        info.innerHTML = '<p style="color:#b45309;">זמני היום עדיין נטענים — נסו שוב בעוד רגע.</p>';
        return;
      }
      var marks = c.isDay ? dayMarks(c) : nightMarks(c);
      // פני השעון נבנים מחדש רק כשמשהו מהותי משתנה: מעבר יום/לילה או זמן שחלף
      var fSig = (c.isDay ? "D" : "N") + "|" + c.start + "|" +
        marks.map(function (m) { return c.pos >= m.at ? "1" : "0"; }).join("");
      if (fSig !== faceSig) {
        faceSig = fSig;
        buildFace(svg, c, marks);
        var badge = ov.querySelector("#lux-hc-mode-badge");
        if (badge) {
          badge.textContent = c.isDay ? "☀️ היום ההלכתי" : "🌙 הלילה ההלכתי";
          badge.className = "lux-hc-badge" + (c.isDay ? "" : " lux-hc-badge-n");
        }
      }
      updateDynamic(ov, c);
      var iSig = fSig + "|" + Math.floor(Date.now() / 60000);
      if (iSig !== infoSig) {
        infoSig = iSig;
        buildInfo(info, c, marks);
      }
    }
    function openClock() {
      var ov = luxSheet("lux-hc-modal",
        '<h3 class="lux-sheet-title">🕰️ השעון ההלכתי</h3>' +
        '<div id="lux-hc-mode-badge" class="lux-hc-badge"></div>' +
        '<svg id="lux-hc-svg" viewBox="0 0 340 340" style="width:min(78vw,300px);height:auto;display:block;margin:0 auto;"></svg>' +
        '<div id="lux-hc-info"></div>' +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () {
        clearInterval(tickT);
        luxModalClose("lux-hc-modal");
      });
      faceSig = infoSig = null; // המודאל נבנה מחדש — פני השעון חייבים בנייה ראשונה
      render(ov);
      clearInterval(tickT);
      // שעון חי — מתעדכן כל שנייה (שניות רצות + מחוג + קשת ההתקדמות)
      tickT = setInterval(function () {
        var el = document.getElementById("lux-hc-modal");
        if (!el) { clearInterval(tickT); return; }
        render(el);
      }, 1000);
    }
    window.luxOpenHalachicClock = openClock;
    // כפתור ליד שיתוף/הדפסה של הזמנים
    function inject() {
      try { if (typeof window.__luxEnsureZmanimTools === "function") window.__luxEnsureZmanimTools(); } catch (e) {}
      var tools = document.querySelector(".lux-zmanim-tools");
      if (!tools || document.getElementById("lux-hc-btn")) return;
      var b = document.createElement("button");
      b.type = "button";
      b.id = "lux-hc-btn";
      b.textContent = "🕰️ שעון הלכתי";
      b.addEventListener("click", function (ev) { ev.stopPropagation(); openClock(); });
      tools.insertAdjacentElement("afterbegin", b);
    }
    inject();
    setTimeout(inject, 2500);
    setInterval(inject, 3000); // ריפוי-עצמי — אם הכפתור נותק אי-פעם, הוא חוזר
  });

  /* ── 41. מחולל כרטיסי שנה טובה ─────────────────────────────────── */
  safe("shanaTova", function () {
    var DESIGNS = [
      { id: "royal", l: "מלכותי", bg: ["#050b1a", "#0c1530", "#16233f"], ink: "#f2d98a", sub: "#dbe7ff", deco: "✡", emo: "🍎🍯" },
      { id: "pomegranate", l: "רימונים", bg: ["#fdf6e3", "#f8ecd0", "#f3e2b8"], ink: "#7c2d12", sub: "#a16207", deco: "❦", emo: "🍎🍯🍇" },
      { id: "sunset", l: "שקיעה", bg: ["#1e1b4b", "#7c2d5a", "#c2703d"], ink: "#fff7e0", sub: "#fde68a", deco: "🕊", emo: "🕊️✨" },
      { id: "minimal", l: "מינימלי", bg: ["#ffffff", "#faf7f0", "#f5f0e2"], ink: "#1a1408", sub: "#a1762a", deco: "─", emo: "🌿" },
      { id: "marble", l: "שיש וזהב", bg: ["#f8fafc", "#eef2f7", "#dde5ee"], ink: "#0f172a", sub: "#a1762a", deco: "✦", emo: "🕊️" },
      { id: "wine", l: "יין מלכות", bg: ["#2a0710", "#4a0d1f", "#6b1330"], ink: "#f8e7b3", sub: "#e8a0b4", deco: "❧", emo: "🍷" }
    ];
    /* פונטים עבריים מיוחדים לכרטיס — נטענים מ-Google Fonts בפתיחת המחולל */
    var CARD_FONTS = [
      { id: "frank", l: "קלאסי", fam: "'Frank Ruhl Libre', serif" },
      { id: "david", l: "דוד", fam: "'David Libre', serif" },
      { id: "suez", l: "שועז", fam: "'Suez One', serif" },
      { id: "secular", l: "מודרני", fam: "'Secular One', sans-serif" },
      { id: "amatic", l: "כתב יד", fam: "'Amatic SC', cursive" }
    ];
    var fontsInjected = false, cardFontsLoaded = false, cardFontsPromise = null;
    function injectCardFonts() {
      if (fontsInjected) return cardFontsPromise;
      fontsInjected = true;
      cardFontsPromise = new Promise(function (resolve) {
        var done = function () { cardFontsLoaded = true; resolve(); };
        try {
          var link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://fonts.googleapis.com/css2?family=David+Libre:wght@500;700&family=Suez+One&family=Secular+One&family=Amatic+SC:wght@700&display=swap";
          // מחכים שהגופנים באמת ייטענו (ה-link ואז הפונטים עצמם) — כדי לצייר מחדש פעם אחת בלבד
          link.onload = function () {
            try {
              Promise.all([
                document.fonts.load('700 56px "David Libre"'),
                document.fonts.load('56px "Suez One"'),
                document.fonts.load('56px "Secular One"'),
                document.fonts.load('700 56px "Amatic SC"'),
              ]).then(done, done);
            } catch (e) { done(); }
          };
          link.onerror = function () { resolve(); };
          document.head.appendChild(link);
          setTimeout(resolve, 4000); // רשת איטית — לא מחכים לנצח
        } catch (e) { resolve(); }
      });
      return cardFontsPromise;
    }
    /* מספרים "אקראיים" יציבים — כדי שהנצנוצים לא יקפצו בכל ציור מחדש */
    function seededRand(seed) {
      var s = seed % 2147483647;
      if (s <= 0) s += 2147483646;
      return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    }
    /* ערכות ברכה לכל חג — הכרטיס מופיע חודש לפני החג ועד סופו.
       ברכה היא מחרוזת (זהה לכל נוסח) או אובייקט {m,f,p} — זכר/נקבה/רבים */
    var THEMES = [
      { match: /ראש השנה/, dur: 2, title: "שנה טובה", yearLine: true, emo: "🍎🍯", entry: "כרטיס שנה טובה מעוצב", entrySub: "צרו ושתפו ברכה אישית לשנה החדשה",
        blessings: ["שנה טובה ומתוקה 🍎🍯", "כתיבה וחתימה טובה",
          { m: "תיכתב ותיחתם לשנה טובה ומתוקה", f: "תיכתבי ותיחתמי לשנה טובה ומתוקה", p: "תיכתבו ותיחתמו לשנה טובה ומתוקה" },
          "שנת בריאות, שמחה ופרנסה טובה", "תכלה שנה וקללותיה, תחל שנה וברכותיה"] },
      { match: /יום כיפור|יום הכיפורים/, dur: 1, title: "גמר חתימה טובה", emo: "🕊️", entry: "כרטיס גמר חתימה טובה", entrySub: "ברכה מעוצבת ליום הקדוש",
        blessings: ["גמר חתימה טובה!", "צום קל ומועיל וגמר חתימה טובה",
          { m: "שתיחתם בספר החיים, הבריאות והשמחה", f: "שתיחתמי בספר החיים, הבריאות והשמחה", p: "שתיחתמו בספר החיים, הבריאות והשמחה" }] },
      { match: /סוכות/, dur: 8, title: "חג סוכות שמח", emo: "🌿🍋", entry: "כרטיס ברכה לחג הסוכות", entrySub: "ברכה מעוצבת לחג",
        blessings: ["חג סוכות שמח!", "מועדים לשמחה!", "ישיבה נעימה בסוכה וחג שמח",
          { m: "שתזכה לשבת בצל האמונה — חג שמח", f: "שתזכי לשבת בצל האמונה — חג שמח", p: "שתזכו לשבת בצל האמונה — חג שמח" }] },
      { match: /שמחת תורה|שמיני עצרת/, dur: 1, title: "חג שמח", emo: "📜🎶", entry: "כרטיס ברכה לשמחת תורה", entrySub: "ברכה מעוצבת לחג",
        blessings: ["חג שמחת תורה שמח!", "מועדים לשמחה!", "שמחה גדולה עם התורה הקדושה",
          { m: "שתזכה לשמוח בתורה כל השנה", f: "שתזכי לשמוח בתורה כל השנה", p: "שתזכו לשמוח בתורה כל השנה" }] },
      { match: /חנוכה/, dur: 8, title: "חנוכה שמח", emo: "🕎✨", entry: "כרטיס ברכה לחנוכה", entrySub: "ברכה מעוצבת לחג האורים",
        blessings: ["חג אורים שמח!", "חנוכה שמח ומואר!", "נסים גדולים ואור גדול בכל הבית",
          { m: "שתזכה לנסים גדולים ואור גדול", f: "שתזכי לנסים גדולים ואור גדול", p: "שתזכו לנסים גדולים ואור גדול" }] },
      { match: /ט"ו בשבט|טו בשבט/, dur: 1, title: 'ט"ו בשבט שמח', emo: "🌳🌸", entry: 'כרטיס ברכה לט"ו בשבט', entrySub: "ברכה מעוצבת לראש השנה לאילנות",
        blessings: ['חג ט"ו בשבט שמח!', "שנה של צמיחה ופריחה",
          { m: "שתצמח ותפרח כמו אילן רענן", f: "שתצמחי ותפרחי כמו אילן רענן", p: "שתצמחו ותפרחו כמו אילן רענן" }] },
      { match: /פורים/, dur: 2, title: "פורים שמח", emo: "🎭🎉", entry: "כרטיס ברכה לפורים", entrySub: "ברכה מעוצבת ומשמחת",
        blessings: ["פורים שמח!", "ליהודים הייתה אורה ושמחה וששון ויקר", "פורים שמח ומשלוח מנות מתוק",
          { m: "שתהיה תמיד בשמחה — פורים שמח", f: "שתהיי תמיד בשמחה — פורים שמח", p: "שתהיו תמיד בשמחה — פורים שמח" }] },
      { match: /פסח/, dur: 7, title: "חג פסח שמח", emo: "🍷🌸", entry: "כרטיס ברכה לפסח", entrySub: "ברכה מעוצבת לחג החירות",
        blessings: ["חג פסח כשר ושמח!", "מועדים לשמחה!", "חג של חירות, משפחה ושמחה",
          { m: "שתזכה לחירות אמיתית — חג שמח", f: "שתזכי לחירות אמיתית — חג שמח", p: "שתזכו לחירות אמיתית — חג שמח" }] },
      { match: /ל"ג בעומר|לג בעומר/, dur: 1, title: 'ל"ג בעומר שמח', emo: "🔥🏹", entry: 'כרטיס ברכה לל"ג בעומר', entrySub: 'ברכה מעוצבת להילולת רשב"י',
        blessings: ['ל"ג בעומר שמח!', 'אור ההילולא של רבי שמעון בר יוחאי יאיר לכל השנה',
          { m: 'שתזכה לאורו הגדול של רשב"י', f: 'שתזכי לאורו הגדול של רשב"י', p: 'שתזכו לאורו הגדול של רשב"י' }] },
      { match: /שבועות/, dur: 2, title: "חג שבועות שמח", emo: "🌾📜", entry: "כרטיס ברכה לשבועות", entrySub: "ברכה מעוצבת לחג מתן תורה",
        blessings: ["חג שבועות שמח!", "חג מתן תורה שמח ומבורך", "מועדים לשמחה!",
          { m: "שתזכה לקבל את התורה בשמחה", f: "שתזכי לקבל את התורה בשמחה", p: "שתזכו לקבל את התורה בשמחה" }] }
    ];
    /* טקסט ברכה לפי נוסח נבחר */
    function blessTxt(b, form) {
      return typeof b === "string" ? b : (b[form] || b.p);
    }
    /* כל החגים שבחלון (חודש לפני ועד סוף החג) — ממוינים מהקרוב לרחוק */
    function activeThemes() {
      var evs = getCachedEvents() || [];
      var found = [];
      evs.forEach(function (e) {
        if (e.type !== "major" && e.type !== "minor" && e.type !== "fast") return;
        // Hebcal כותב גרשיים טיפוגרפיים (ל״ג) — מנרמלים כדי שההתאמות יתפסו
        var nm = String(e.name || "").replace(/[״]/g, '"').replace(/[׳’]/g, "'");
        // "ראש השנה למעשר בהמה" נתפס ברגקס של ראש השנה — לא חג לכרטיס
        if (nm.indexOf("למעשר") !== -1) return;
        var th = null;
        for (var i = 0; i < THEMES.length; i++) {
          if (THEMES[i].match.test(nm)) { th = THEMES[i]; break; }
        }
        if (!th) return;
        var days = Math.floor((new Date(e.date) - new Date()) / 86400000) + 1;
        if (days > 30 || days <= -(th.dur || 1)) return;
        var ex = null;
        for (var j = 0; j < found.length; j++) { if (found[j].theme === th) { ex = found[j]; break; } }
        if (!ex) found.push({ theme: th, days: days });
        else if (Math.abs(days) < Math.abs(ex.days)) ex.days = days;
      });
      found.sort(function (a, b) { return Math.abs(a.days) - Math.abs(b.days); });
      var list = found.map(function (x) { return x.theme; });
      // אלול — כרטיס שנה טובה זמין תמיד, גם אם מטמון האירועים ריק
      var m = luxHebMonth(new Date()), d = luxHebDay(new Date());
      if ((m === "אלול" || (m === "תשרי" && d <= 2)) && list.indexOf(THEMES[0]) === -1) list.unshift(THEMES[0]);
      return list;
    }
    function activeTheme() { return activeThemes()[0] || null; }
    var sel = 0;
    function hebNewYear() {
      // שנת היעד: השנה העברית הבאה (בגימטריה, בלי האלפים)
      var y = luxHebYear(new Date()) + 1;
      var n = y % 1000;
      var tbl = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [19, "יט"], [18, "יח"], [17, "יז"], [16, "טז"], [15, "טו"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
      var out = "";
      tbl.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
      return out.length > 1 ? out.slice(0, -1) + '"' + out.slice(-1) : out;
    }
    /* ציור פינה מעוטרת — קשתות זהב עדינות בכל פינת המסגרת */
    function drawCorner(ctx, x, y, sx, sy, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx, sy);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 58);
      ctx.quadraticCurveTo(0, 0, 58, 0);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(14, 78);
      ctx.quadraticCurveTo(14, 14, 78, 14);
      ctx.stroke();
      // יהלום קטן בפינה
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(30, 22); ctx.lineTo(38, 30); ctx.lineTo(30, 38); ctx.lineTo(22, 30);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function draw(cv, design, blessing, from, theme, fontFam, toName, dIdx, form) {
      var W = 1080, H = 1350;
      cv.width = W; cv.height = H;
      var ctx = cv.getContext("2d");
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, design.bg[0]); g.addColorStop(0.55, design.bg[1]); g.addColorStop(1, design.bg[2]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // זוהר עדין
      var rg = ctx.createRadialGradient(W / 2, 140, 40, W / 2, 140, 720);
      rg.addColorStop(0, "rgba(232,193,90,0.20)"); rg.addColorStop(1, "rgba(232,193,90,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      // נצנוצי זהב מפוזרים — יציבים בין ציורים (seed לפי העיצוב)
      var rnd = seededRand(97 + (dIdx || 0) * 13);
      for (var sp = 0; sp < 26; sp++) {
        var px = 90 + rnd() * (W - 180), py = 90 + rnd() * (H - 180), pr = 1.5 + rnd() * 3;
        ctx.globalAlpha = 0.10 + rnd() * 0.22;
        ctx.fillStyle = design.sub;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // אימוג'י דקורטיביים עדינים בשוליים — לפי אווירת החג
      var decoEmo = (theme.emo || design.emo || "✨").replace(/️/g, "");
      var decoChars = Array.from(decoEmo);
      var spots = [[130, 320, -0.35], [W - 130, 340, 0.3], [150, H - 320, 0.25], [W - 150, H - 300, -0.3]];
      spots.forEach(function (s, si) {
        var ch = decoChars[si % decoChars.length];
        if (!ch) return;
        ctx.save();
        ctx.translate(s[0], s[1]);
        ctx.rotate(s[2]);
        ctx.globalAlpha = 0.18;
        ctx.font = "64px serif";
        ctx.textAlign = "center";
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      // מסגרות כפולות + פינות מעוטרות
      ctx.strokeStyle = design.sub; ctx.lineWidth = 5;
      ctx.strokeRect(46, 46, W - 92, H - 92);
      ctx.strokeStyle = design.sub; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
      ctx.strokeRect(64, 64, W - 128, H - 128);
      ctx.globalAlpha = 1;
      drawCorner(ctx, 82, 82, 1, 1, design.sub);
      drawCorner(ctx, W - 82, 82, -1, 1, design.sub);
      drawCorner(ctx, 82, H - 82, 1, -1, design.sub);
      drawCorner(ctx, W - 82, H - 82, -1, -1, design.sub);
      ctx.textAlign = "center"; ctx.direction = "rtl";
      var FONT = fontFam || "'Frank Ruhl Libre', serif";
      // כתב-יד (Amatic) קטן פיזית — מקדם הגדלה לגדלים אחידים
      var fScale = FONT.indexOf("Amatic") !== -1 ? 1.35 : 1;
      // אימוג'י עליון — לפי החג
      ctx.font = "90px serif";
      ctx.fillText(theme.emo || design.emo, W / 2, 235);
      // כותרת — שם הברכה של החג, בהתאמת גודל לרוחב
      ctx.fillStyle = design.ink;
      var tSize = Math.round(118 * fScale);
      ctx.font = "900 " + tSize + "px " + FONT;
      while (ctx.measureText(theme.title).width > W - 200 && tSize > 56) {
        tSize -= 6;
        ctx.font = "900 " + tSize + "px " + FONT;
      }
      // צל עדין לכותרת
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 4;
      ctx.fillText(theme.title, W / 2, 420);
      ctx.restore();
      if (theme.yearLine) {
        ctx.font = "900 " + Math.round(74 * fScale) + "px " + FONT;
        ctx.fillStyle = design.sub;
        ctx.fillText("לשנת ה'" + hebNewYear(), W / 2, 530);
      }
      // קו מפריד עם יהלום מרכזי
      ctx.strokeStyle = design.sub; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(280, 590); ctx.lineTo(W / 2 - 28, 590); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 + 28, 590); ctx.lineTo(W - 280, 590); ctx.stroke();
      ctx.fillStyle = design.sub;
      ctx.save();
      ctx.translate(W / 2, 590);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-9, -9, 18, 18);
      ctx.restore();
      var y = 690;
      // לכבוד — שם המקבל
      if (toName) {
        ctx.font = "700 " + Math.round(46 * fScale) + "px " + FONT;
        ctx.fillStyle = design.sub;
        var hon = form === "m" ? "היקר" : form === "f" ? "היקרה" : "היקרים";
        ctx.fillText("לכבוד " + toName + " " + hon + " ✨", W / 2, y);
        y += 85;
      }
      // ברכה — שבירת שורות
      ctx.fillStyle = design.ink;
      var bSize = Math.round(52 * fScale);
      ctx.font = "700 " + bSize + "px " + FONT;
      var words = String(blessing || "").split(" ");
      var lines = [], line = "";
      words.forEach(function (w) {
        var t = line ? line + " " + w : w;
        if (ctx.measureText(t).width > W - 260) { lines.push(line); line = w; }
        else line = t;
      });
      if (line) lines.push(line);
      var lh = Math.round(78 * fScale);
      lines.forEach(function (l, i) { ctx.fillText(l, W / 2, y + 10 + i * lh); });
      y = y + 10 + lines.length * lh + 55;
      // מאחל/ת
      if (from) {
        ctx.font = "600 40px Assistant, sans-serif";
        ctx.fillStyle = design.sub;
        ctx.fillText("באהבה,", W / 2, y);
        ctx.font = "800 " + Math.round(56 * fScale) + "px " + FONT;
        ctx.fillStyle = design.ink;
        ctx.fillText(from, W / 2, y + 75);
      }
      // פוטר
      ctx.font = "700 30px Assistant, sans-serif";
      ctx.fillStyle = design.sub;
      ctx.fillText("✡ הלוח היהודי · jewishcalendar.co.il", W / 2, H - 105);
    }
    var selFont = 0;
    function openMaker() {
      var fontsP = injectCardFonts();
      var actives = activeThemes();
      if (!actives.length) actives = [THEMES[0]];
      var theme = actives[0];
      var selForm = "p"; // נוסח ברירת מחדל — משפחה/רבים
      var name = "";
      try { name = localStorage.getItem("lux_user_name") || ""; } catch (e) {}
      var ov = luxSheet("lux-shana-maker",
        '<h3 class="lux-sheet-title" id="lux-sn-title">💌 ' + esc(theme.entry) + "</h3>" +
        '<p class="lux-sheet-note">בחרו עיצוב ופונט, הוסיפו שמות וברכה — ושתפו עם מי שאוהבים</p>' +
        (actives.length > 1
          ? '<div class="lux-sn-lbl">🎉 כמה חגים קרובים — למי מהם הכרטיס?</div>' +
            '<div class="lux-sn-fonts">' + actives.map(function (t, i) {
              var em = Array.from(String(t.emo || "✨").replace(/️/g, ""))[0] || "✨";
              return '<button type="button" class="lux-sn-h' + (i === 0 ? " lux-sn-f-on" : "") + '" data-i="' + i + '">' + em + " " + esc(t.title) + "</button>";
            }).join("") + "</div>"
          : "") +
        '<div class="lux-sn-designs">' + DESIGNS.map(function (d, i) {
          return '<button type="button" class="lux-sn-d' + (i === 0 ? " lux-sn-d-on" : "") + '" data-i="' + i + '" style="background:linear-gradient(160deg,' + d.bg[0] + "," + d.bg[2] + ');color:' + d.ink + ';">' + d.l + "</button>";
        }).join("") + "</div>" +
        '<div class="lux-sn-fonts">' + CARD_FONTS.map(function (f, i) {
          return '<button type="button" class="lux-sn-f' + (i === 0 ? " lux-sn-f-on" : "") + '" data-i="' + i + '" style="font-family:' + f.fam + ';">' + f.l + "</button>";
        }).join("") + "</div>" +
        '<div class="lux-sn-lbl">✍️ נוסח הברכה — למי היא מיועדת?</div>' +
        '<div class="lux-sn-fonts">' +
          '<button type="button" class="lux-sn-g lux-sn-f-on" data-g="p">👨‍👩‍👧 משפחה / רבים</button>' +
          '<button type="button" class="lux-sn-g" data-g="m">👨 לגבר</button>' +
          '<button type="button" class="lux-sn-g" data-g="f">👩 לאישה</button>' +
        "</div>" +
        '<input type="text" id="lux-sn-to" class="lux-sheet-input" maxlength="30" placeholder="לכבוד... (למשל: משפחת לוי — אופציונלי)">' +
        '<input type="text" id="lux-sn-from" class="lux-sheet-input" maxlength="30" placeholder="השם שלכם (יופיע בכרטיס)" value="' + esc(name) + '">' +
        '<select id="lux-sn-bless" class="lux-sheet-input">' + theme.blessings.map(function (b) { return "<option>" + esc(blessTxt(b, selForm)) + "</option>"; }).join("") + "</select>" +
        '<input type="text" id="lux-sn-custom" class="lux-sheet-input" maxlength="120" placeholder="✍️ או כתבו ברכה אישית משלכם...">' +
        '<canvas id="lux-sn-canvas" style="width:100%;border-radius:1rem;box-shadow:0 10px 30px rgba(0,0,0,0.35);margin:0.6rem 0;"></canvas>' +
        '<div class="lux-sheet-actions">' +
          '<button type="button" class="lux-sheet-primary" id="lux-sn-share">📤 שיתוף</button>' +
          '<button type="button" class="lux-sheet-secondary" id="lux-sn-dl">⬇️ הורדה</button>' +
          '<button type="button" class="lux-sheet-secondary" id="lux-sn-copy">📋 העתקה</button>' +
          '<button type="button" class="lux-sheet-cancel">סגור</button>' +
        "</div>");
      if (!ov) return;
      var cv = ov.querySelector("#lux-sn-canvas");
      var blessSel = ov.querySelector("#lux-sn-bless");
      function currentBlessing() {
        var custom = (ov.querySelector("#lux-sn-custom").value || "").trim();
        return custom || blessSel.value;
      }
      function repaint() {
        draw(cv, DESIGNS[sel],
          currentBlessing(),
          (ov.querySelector("#lux-sn-from").value || "").trim().slice(0, 30),
          theme,
          CARD_FONTS[selFont].fam,
          (ov.querySelector("#lux-sn-to").value || "").trim().slice(0, 30),
          sel,
          selForm);
      }
      // בניית רשימת הברכות מחדש — אחרי החלפת חג או נוסח (שומר על הבחירה)
      function fillBless() {
        var idx = blessSel.selectedIndex;
        blessSel.innerHTML = theme.blessings.map(function (b) { return "<option>" + esc(blessTxt(b, selForm)) + "</option>"; }).join("");
        if (idx > 0 && idx < blessSel.options.length) blessSel.selectedIndex = idx;
      }
      ov.querySelectorAll(".lux-sn-h").forEach(function (b) {
        b.addEventListener("click", function () {
          var i = parseInt(b.dataset.i, 10);
          theme = actives[i] || theme;
          ov.querySelectorAll(".lux-sn-h").forEach(function (x, j) { x.classList.toggle("lux-sn-f-on", j === i); });
          var ti = ov.querySelector("#lux-sn-title");
          if (ti) ti.innerHTML = "💌 " + esc(theme.entry);
          fillBless();
          repaint();
        });
      });
      ov.querySelectorAll(".lux-sn-g").forEach(function (b) {
        b.addEventListener("click", function () {
          selForm = b.dataset.g || "p";
          ov.querySelectorAll(".lux-sn-g").forEach(function (x) { x.classList.toggle("lux-sn-f-on", x === b); });
          fillBless();
          repaint();
        });
      });
      ov.querySelectorAll(".lux-sn-d").forEach(function (b) {
        b.addEventListener("click", function () {
          sel = parseInt(b.dataset.i, 10);
          ov.querySelectorAll(".lux-sn-d").forEach(function (x, j) { x.classList.toggle("lux-sn-d-on", j === sel); });
          repaint();
        });
      });
      ov.querySelectorAll(".lux-sn-f").forEach(function (b) {
        b.addEventListener("click", function () {
          selFont = parseInt(b.dataset.i, 10);
          ov.querySelectorAll(".lux-sn-f").forEach(function (x, j) { x.classList.toggle("lux-sn-f-on", j === selFont); });
          repaint();
        });
      });
      ["#lux-sn-from", "#lux-sn-to", "#lux-sn-custom"].forEach(function (s) {
        ov.querySelector(s).addEventListener("input", repaint);
      });
      ov.querySelector("#lux-sn-bless").addEventListener("change", repaint);
      ov.querySelector("#lux-sn-share").addEventListener("click", function () {
        cv.toBlob(function (blob) {
          if (!blob) return;
          var file = new File([blob], "greeting-card.png", { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: theme.title,
              text: theme.title + " 💌 נוצר באתר הלוח היהודי — https://jewishcalendar.co.il"
            }).catch(function () {});
          } else {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "greeting-card.png";
            a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
          }
        }, "image/png");
      });
      ov.querySelector("#lux-sn-dl").addEventListener("click", function () {
        var a = document.createElement("a");
        a.href = cv.toDataURL("image/png");
        a.download = "greeting-card.png";
        a.click();
      });
      ov.querySelector("#lux-sn-copy").addEventListener("click", function () {
        cv.toBlob(function (blob) {
          if (!blob || !navigator.clipboard || !window.ClipboardItem) {
            if (typeof window.showToast === "function") window.showToast("ההעתקה אינה נתמכת בדפדפן זה — השתמשו בהורדה", "info", 2600);
            return;
          }
          navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]).then(function () {
            if (typeof window.showToast === "function") window.showToast("📋 הכרטיס הועתק — אפשר להדביק בכל מקום", "success", 2400);
          }).catch(function () {
            if (typeof window.showToast === "function") window.showToast("ההעתקה נכשלה — השתמשו בהורדה", "info", 2400);
          });
        }, "image/png");
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-shana-maker"); });
      // ציור ראשון מיד; ציור נוסף יחיד רק אם הגופנים נטענו אחרי הציור הראשון.
      // (ארבעה ציורי-קנבס בכל פתיחה — מיידי, fonts.ready ושני טיימרים — נראו כהבהוב בנייד)
      repaint();
      if (!cardFontsLoaded && fontsP) {
        fontsP.then(function () {
          if (document.getElementById("lux-shana-maker")) repaint();
        });
      }
    }
    window.luxOpenShanaTova = openMaker;
    // כניסה עונתית בדף הראשי — חודש לפני כל חג ועד סופו, בעיצוב של אותו החג
    function injectEntry() {
      if (document.getElementById("lux-shana-entry")) return;
      var theme = activeTheme();
      if (!theme) return;
      var anchor = document.getElementById("lux-selichot-card");
      var main = document.getElementById("main-content");
      var nav = main ? main.querySelector("nav") : null;
      var b = document.createElement("button");
      b.type = "button";
      b.id = "lux-shana-entry";
      b.innerHTML = '<span class="lux-se-emo">💌</span><span class="lux-se-txt"><b>' + esc(theme.entry) + "</b><small>" + esc(theme.entrySub || "צרו ושתפו ברכה מעוצבת") + "</small></span><span class='lux-se-go'>←</span>";
      b.addEventListener("click", openMaker);
      if (anchor) anchor.insertAdjacentElement("afterend", b);
      else if (nav) nav.insertAdjacentElement("beforebegin", b);
    }
    injectEntry();
    setTimeout(injectEntry, 2600);
  });

  /* ── 42. המרת תאריכים ומחשבון אירועים ──────────────────────────── */
  safe("dateTool", function () {
    var MONTHS = ["תשרי", "חשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳", "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול"];
    function normM(s) {
      return String(s || "").replace(/[׳״'"]/g, "").replace("מרחשוון", "חשוון").replace("מר חשוון", "חשוון").replace("סיון", "סיוון").trim();
    }
    function toHebDayStr(n) {
      var t = ["", "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', "כ'", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', "ל'"];
      return t[n] || n;
    }
    // עברי → לועזי: סריקה סביב השנה המבוקשת
    function hebToGreg(hYear, hMonth, hDay) {
      // ר"ה של שנה עברית Y חל בספטמבר של השנה הלועזית Y-3761,
      // לכן מתחילים לסרוק מאוגוסט של אותה שנה לועזית
      var gy = hYear - 3761;
      var start = new Date(gy, 7, 1);
      var target = normM(hMonth);
      for (var i = 0; i < 460; i++) {
        var d = new Date(start.getTime() + i * 86400000);
        if (luxHebYear(d) !== hYear) continue;
        if (luxHebDay(d) !== hDay) continue;
        if (normM(luxHebMonth(d)) === target) return d;
      }
      return null;
    }
    function fmtG(d) {
      return d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    function fmtH(d) {
      try { return typeof window.getHebrewDateString === "function" ? window.getHebrewDateString(d) : ""; } catch (e) { return ""; }
    }
    function isoDay(d) {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    // צ'יפ מרחק — "היום!", "בעוד X ימים", "לפני X ימים"
    function daysChip(d) {
      var t0 = new Date(); t0.setHours(0, 0, 0, 0);
      var t1 = new Date(d); t1.setHours(0, 0, 0, 0);
      var diff = Math.round((t1 - t0) / 86400000);
      if (diff === 0) return '<span class="lux-dt-chip lux-dt-chip-today">🎯 היום!</span>';
      if (diff === 1) return '<span class="lux-dt-chip">מחר</span>';
      if (diff === -1) return '<span class="lux-dt-chip lux-dt-chip-past">אתמול</span>';
      if (diff > 0) return '<span class="lux-dt-chip">בעוד ' + diff + " ימים</span>";
      return '<span class="lux-dt-chip lux-dt-chip-past">לפני ' + (-diff) + " ימים</span>";
    }
    // אירועי לוח (חגים, צומות...) שחלים בתאריך — מתוך המטמון של האתר
    function eventsOnDate(d) {
      var iso = isoDay(d);
      var evs = (getCachedEvents() || []).filter(function (e) { return e.date === iso; });
      if (!evs.length) return "";
      return '<div class="lux-dt-evs">' + evs.slice(0, 3).map(function (e) {
        return '<span class="lux-dt-ev">🎉 ' + esc(e.name || "") + "</span>";
      }).join("") + "</div>";
    }
    // הורדת קובץ יומן (ICS) לאירוע של יום שלם
    function downloadICS(title, d) {
      function ymd(x) { return x.getFullYear() + String(x.getMonth() + 1).padStart(2, "0") + String(x.getDate()).padStart(2, "0"); }
      var next = new Date(d.getTime() + 86400000);
      var ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//jewishcalendar.co.il//HE\r\nBEGIN:VEVENT\r\n" +
        "UID:" + ymd(d) + "-" + Date.now() + "@jewishcalendar.co.il\r\n" +
        "DTSTART;VALUE=DATE:" + ymd(d) + "\r\nDTEND;VALUE=DATE:" + ymd(next) + "\r\n" +
        "SUMMARY:" + String(title || "").replace(/[\r\n,;]/g, " ") + "\r\nEND:VEVENT\r\nEND:VCALENDAR";
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      a.download = "event.ics";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }
    function copyText(txt) {
      try {
        navigator.clipboard.writeText(txt).then(function () {
          if (typeof window.showToast === "function") window.showToast("📋 הועתק ללוח", "success", 1800);
        });
      } catch (e) {}
    }
    // המופעים הקרובים של תאריך עברי — עד maxN מופעים (סריקת ~6 שנים)
    function nextOccurrences(hMonth, hDay, maxN) {
      var target = normM(hMonth);
      var out = [];
      for (var i = 0; i < 2200 && out.length < maxN; i++) {
        var d = new Date(Date.now() + i * 86400000);
        if (luxHebDay(d) !== hDay) continue;
        var m = normM(luxHebMonth(d));
        if (m === target || (target.indexOf("אדר") === 0 && m.indexOf("אדר") === 0)) {
          out.push({ date: d, days: i });
          i += 300; // דילוג לשנה הבאה — אין שני מופעים באותה שנה (חוץ מאדר, וזה מספיק)
        }
      }
      return out;
    }
    function openTool() {
      var curY = luxHebYear(new Date());
      var yearOpts = "";
      for (var y = curY - 120; y <= curY + 121; y++) {
        yearOpts += '<option value="' + y + '"' + (y === curY ? " selected" : "") + ">" + y + "</option>";
      }
      var ov = luxSheet("lux-date-tool",
        '<h3 class="lux-sheet-title">🔄 המרת תאריכים</h3>' +
        '<p class="lux-sheet-note">עברי ↔ לועזי · יארצייט · בר/בת מצווה — פשוט, ברור ובמקום אחד</p>' +
        '<div class="lux-dt-sec"><h4>📅 מלועזי לעברי</h4>' +
          '<p class="lux-dt-help">בחרו תאריך רגיל (לועזי) — ומיד תראו איזה תאריך עברי חל בו, כולל חגים ומועדים שחלים באותו יום.</p>' +
          '<div style="display:flex;gap:0.4rem;align-items:center;">' +
            '<input type="date" id="lux-dt-g" class="lux-sheet-input" style="flex:1;">' +
            '<button type="button" id="lux-dt-today" class="lux-dt-mini" style="flex-shrink:0;">🎯 היום</button>' +
          "</div>" +
          '<div class="lux-dt-out" id="lux-dt-g-out"></div>' +
        "</div>" +
        '<div class="lux-dt-sec"><h4>✡️ מעברי ללועזי</h4>' +
          '<p class="lux-dt-help">בחרו יום, חודש ושנה עבריים — ותקבלו את התאריך הלועזי המדויק שבו הם חלים.</p>' +
          '<div style="display:flex;gap:0.4rem;">' +
            '<div style="flex:1;"><label class="lux-dt-lbl" for="lux-dt-hd">יום</label>' +
              '<select id="lux-dt-hd" class="lux-sheet-input" style="width:100%;">' +
                Array.apply(null, Array(30)).map(function (_, i) { return '<option value="' + (i + 1) + '">' + toHebDayStr(i + 1) + "</option>"; }).join("") +
              "</select></div>" +
            '<div style="flex:1.4;"><label class="lux-dt-lbl" for="lux-dt-hm">חודש</label>' +
              '<select id="lux-dt-hm" class="lux-sheet-input" style="width:100%;">' + MONTHS.map(function (m) { return "<option>" + m + "</option>"; }).join("") + "</select></div>" +
            '<div style="flex:1;"><label class="lux-dt-lbl" for="lux-dt-hy">שנה</label>' +
              '<select id="lux-dt-hy" class="lux-sheet-input" style="width:100%;">' + yearOpts + "</select></div>" +
          "</div>" +
          '<div class="lux-dt-out" id="lux-dt-h-out"></div>' +
        "</div>" +
        '<div class="lux-dt-sec"><h4>🕯️ מתי זה יוצא? — יארצייט ויום הולדת עברי</h4>' +
          '<p class="lux-dt-help">לפי היום והחודש העבריים שבחרתם למעלה — הנה חמשת המופעים הקרובים בלוח הרגיל. אפשר להעתיק או להוסיף ליומן בלחיצה.</p>' +
          '<div class="lux-dt-out" id="lux-dt-next-out"></div>' +
        "</div>" +
        '<div class="lux-dt-sec"><h4>🎉 מחשבון בר/בת מצווה וגיל עברי</h4>' +
          '<p class="lux-dt-help">הזינו תאריך לידה (לועזי), בחרו בר או בת מצווה — ותקבלו את התאריך המדויק לפי הלוח העברי, יחד עם הגיל העברי הנוכחי.</p>' +
          '<label class="lux-dt-lbl" for="lux-dt-birth">תאריך לידה (לועזי)</label>' +
          '<input type="date" id="lux-dt-birth" class="lux-sheet-input" title="תאריך לידה לועזי" style="width:100%;">' +
          '<div style="display:flex;gap:0.4rem;margin-top:0.4rem;">' +
            '<button type="button" class="lux-sheet-secondary" id="lux-dt-bar" style="flex:1;">👦 בר מצווה (13)</button>' +
            '<button type="button" class="lux-sheet-secondary" id="lux-dt-bat" style="flex:1;">👧 בת מצווה (12)</button>' +
          "</div>" +
          '<div class="lux-dt-out" id="lux-dt-bm-out"></div>' +
        "</div>" +
        '<div class="lux-sheet-actions"><button type="button" class="lux-sheet-cancel">סגור</button></div>');
      if (!ov) return;
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-date-tool"); });
      ov.querySelector("#lux-dt-today").addEventListener("click", function () {
        var gi = ov.querySelector("#lux-dt-g");
        gi.value = isoDay(new Date());
        gi.dispatchEvent(new Event("change"));
      });
      // האזנה מרוכזת לכפתורי העתקה/יומן שנוצרים דינמית בתוצאות
      ov.addEventListener("click", function (e) {
        var cp = e.target.closest ? e.target.closest("[data-copy]") : null;
        if (cp) { copyText(cp.getAttribute("data-copy")); return; }
        var ics = e.target.closest ? e.target.closest("[data-ics]") : null;
        if (ics) {
          var d = new Date(ics.getAttribute("data-ics") + "T12:00:00");
          downloadICS(ics.getAttribute("data-ics-title") || "אירוע", d);
        }
      });
      function resultActions(copyStr, icsDate, icsTitle) {
        var h = '<div class="lux-dt-actions">' +
          '<button type="button" class="lux-dt-mini" data-copy="' + esc(copyStr) + '">📋 העתקה</button>';
        if (icsDate) {
          h += '<button type="button" class="lux-dt-mini" data-ics="' + isoDay(icsDate) + '" data-ics-title="' + esc(icsTitle || "") + '">🗓️ ליומן</button>';
        }
        return h + "</div>";
      }
      // לועזי → עברי
      var gIn = ov.querySelector("#lux-dt-g");
      gIn.value = isoDay(new Date());
      function gOut() {
        var v = gIn.value;
        var out = ov.querySelector("#lux-dt-g-out");
        if (!v) { out.textContent = ""; return; }
        var d = new Date(v + "T12:00:00");
        var heb = fmtH(d) || "—";
        out.innerHTML =
          '<div class="lux-dt-big">📅 ' + heb + "</div>" +
          '<small>' + fmtG(d) + "</small> " + daysChip(d) +
          eventsOnDate(d) +
          resultActions(heb + " · " + fmtG(d), d, heb);
      }
      gIn.addEventListener("change", gOut);
      gOut();
      // עברי → לועזי + המופעים הקרובים
      function hOut() {
        var hd = parseInt(ov.querySelector("#lux-dt-hd").value, 10);
        var hm = ov.querySelector("#lux-dt-hm").value;
        var hy = parseInt(ov.querySelector("#lux-dt-hy").value, 10);
        var out = ov.querySelector("#lux-dt-h-out");
        var d = hebToGreg(hy, hm, hd);
        if (d) {
          var hebStr = toHebDayStr(hd) + " ב" + hm + " " + hy;
          out.innerHTML =
            '<div class="lux-dt-big">📅 ' + fmtG(d) + "</div>" +
            "<small>" + (fmtH(d) || hebStr) + "</small> " + daysChip(d) +
            eventsOnDate(d) +
            resultActions(fmtG(d) + " · " + hebStr, d, hebStr);
        } else {
          out.innerHTML = '<span style="color:#b45309;">התאריך לא קיים בשנה זו (למשל אדר ב׳ בשנה רגילה, או ל׳ בחודש חסר)</span>';
        }
        var nOut = ov.querySelector("#lux-dt-next-out");
        var occ = nextOccurrences(hm, hd, 5);
        nOut.innerHTML = occ.length
          ? '<div class="lux-dt-occ-list">' + occ.map(function (nx, i) {
              return '<div class="lux-dt-occ' + (i === 0 ? " lux-dt-occ-first" : "") + '">' +
                "<b>" + fmtG(nx.date) + "</b> " +
                (nx.days === 0 ? '<span class="lux-dt-chip lux-dt-chip-today">היום!</span>' : '<span class="lux-dt-chip">בעוד ' + nx.days + " ימים</span>") +
              "</div>";
            }).join("") + "</div>" +
            resultActions("המופע הקרוב: " + fmtG(occ[0].date), occ[0].date, toHebDayStr(hd) + " ב" + hm)
          : "";
      }
      ["#lux-dt-hd", "#lux-dt-hm", "#lux-dt-hy"].forEach(function (s) {
        ov.querySelector(s).addEventListener("change", hOut);
      });
      hOut();
      // בר/בת מצווה + גיל עברי נוכחי
      function bm(years) {
        var v = ov.querySelector("#lux-dt-birth").value;
        var out = ov.querySelector("#lux-dt-bm-out");
        if (!v) { out.innerHTML = '<span style="color:#b45309;">בחרו קודם תאריך לידה</span>'; return; }
        var birth = new Date(v + "T12:00:00");
        var bd = luxHebDay(birth), bm2 = luxHebMonth(birth), by = luxHebYear(birth);
        var age = curY - by;
        var target = hebToGreg(by + years, bm2, bd);
        // אדר בשנה מעוברת/רגילה — נסיון גיבוי
        if (!target && normM(bm2).indexOf("אדר") === 0) {
          target = hebToGreg(by + years, "אדר", bd) || hebToGreg(by + years, "אדר ב׳", bd);
        }
        if (!target && bd === 30) target = hebToGreg(by + years, bm2, 29);
        if (target) {
          var title = "ה" + (years === 13 ? "בר" : "בת") + " מצווה";
          out.innerHTML =
            "🎂 נולד/ה ב־<b>" + (fmtH(birth) || "") + "</b> · גיל עברי נוכחי: <b>" + age + "</b><br>" +
            '<div class="lux-dt-big">🎉 ' + title + ": " + fmtG(target) + "</div>" +
            "<small>" + (fmtH(target) || "") + "</small> " + daysChip(target) +
            resultActions(title + ": " + fmtG(target) + " (" + (fmtH(target) || "") + ")", target, title);
        } else {
          out.innerHTML = '<span style="color:#b45309;">לא הצלחנו לחשב — נסו תאריך אחר</span>';
        }
      }
      ov.querySelector("#lux-dt-bar").addEventListener("click", function () { bm(13); });
      ov.querySelector("#lux-dt-bat").addEventListener("click", function () { bm(12); });
    }
    window.luxOpenDateTool = openTool;
    // כפתור בהגדרות
    function inject() {
      var anchor = document.getElementById("lux-stories-auto-toggle") || document.getElementById("lux-tour-btn");
      if (!anchor || document.getElementById("lux-dt-btn")) return;
      var host = anchor.closest("div");
      var field = document.createElement("div");
      field.innerHTML =
        '<button type="button" id="lux-dt-btn" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-between gap-3" style="margin-top:0.75rem;">' +
          '<span class="font-semibold text-sm">🔄 המרת תאריכים</span>' +
          '<span class="text-slate-400 text-xs">עברי ↔ לועזי · בר מצווה</span>' +
        "</button>";
      host.insertAdjacentElement("afterend", field);
      field.querySelector("#lux-dt-btn").addEventListener("click", openTool);
    }
    inject();
    setTimeout(inject, 2700);
  });

  /* ── 43. מסלולי לימוד יומיים: הלכה, תניא, רמב"ם ────────────────── */
  safe("dailyTracks", function () {
    var TRACKS = [
      { key: "halakhah", title: "Halakhah Yomit", he: "הלכה יומית", icon: "📘", color: "#1d4ed8" },
      { key: "tanya", title: "Tanya Yomi", he: "תניא יומי", icon: "📗", color: "#047857" },
      { key: "rambam", title: "Daily Rambam", he: 'רמב"ם היומי', icon: "📙", color: "#b45309" }
    ];
    // תאריך מקומי (לא UTC) — כדי ש"היום" יתחלף בחצות המקומית
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function trackState(key) { return jget("lux_track_" + key, { last: null, streak: 0 }); }
    function yesterdayStr() {
      var yd = new Date(Date.now() - 86400000);
      return yd.getFullYear() + "-" + String(yd.getMonth() + 1).padStart(2, "0") + "-" + String(yd.getDate()).padStart(2, "0");
    }
    function markDone(key) {
      var s = trackState(key);
      var t = todayStr();
      if (s.last === t) return s;
      s.streak = s.last === yesterdayStr() ? s.streak + 1 : 1;
      s.last = t;
      jset("lux_track_" + key, s);
      return s;
    }
    // ביטול הסימון של היום — לחיצה שנייה על "סיימתי" מחזירה את המצב לאחור
    function unmarkDone(key) {
      var s = trackState(key);
      if (s.last !== todayStr()) return s;
      s.streak = Math.max(0, s.streak - 1);
      s.last = s.streak > 0 ? yesterdayStr() : null;
      jset("lux_track_" + key, s);
      return s;
    }
    function localDateKey(d) {
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    // dayOffset: 0 = היום, 1 = מחר (נחוץ לתניא — השיעור נגמר היכן שמחר מתחיל)
    function getCalendarsFor(dayOffset, cb) {
      var now = new Date(Date.now() + (dayOffset || 0) * 86400000);
      var todayKey = "lux_sef_cal_" + localDateKey(new Date());
      var ck = "lux_sef_cal_" + localDateKey(now);
      // ניקוי מטמונים של ימים קודמים — הלימוד מתחלף כל יום
      try {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var k = localStorage.key(i);
          if (k && k.indexOf("lux_sef_cal_") === 0 && k < todayKey) localStorage.removeItem(k);
        }
      } catch (e) {}
      var cached = jget(ck, null);
      if (cached) { cb(cached); return; }
      // תאריך מקומי מפורש — כדי שהלימוד יתחלף בחצות המקומית ולא לפי שעון השרת
      fetch("https://www.sefaria.org/api/calendars?diaspora=0&year=" + now.getFullYear() + "&month=" + (now.getMonth() + 1) + "&day=" + now.getDate())
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var items = (data && data.calendar_items) || [];
          var map = {};
          items.forEach(function (it) {
            if (it.title && it.title.en) map[it.title.en] = {
              ref: it.ref || (it.url ? it.url.replace(/_/g, " ") : ""),
              he: (it.displayValue && it.displayValue.he) || (it.displayValue && it.displayValue.en) || ""
            };
          });
          if (Object.keys(map).length) { jset(ck, map); cb(map); }
          else cb(null);
        })
        .catch(function () { cb(null); });
    }
    function getCalendars(cb) { getCalendarsFor(0, cb); }
    function fetchText(ref, cb) {
      var url = "https://www.sefaria.org/api/v3/texts/" + encodeURIComponent(ref) + "?version=hebrew";
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var flat = [];
          var src = data && data.versions && data.versions[0] ? data.versions[0].text : null;
          (function walk(x) {
            if (x == null) return;
            if (typeof x === "string") { if (x.trim()) flat.push(x); return; }
            if (Array.isArray(x)) x.forEach(walk);
          })(src);
          cb(flat.length ? flat : null);
        })
        .catch(function () { cb(null); });
    }
    // ── תניא יומי מלא ──
    // לוח ספריא מחזיר רק את סעיף ההתחלה של שיעור התניא (למשל "אגרת הקודש 10:13").
    // השיעור המלא נמשך עד תחילת השיעור של מחר, ולכן: מביאים את הפרק המלא,
    // חותכים מנקודת ההתחלה של היום עד נקודת ההתחלה של מחר (כולל מעבר בין פרקים).
    function parseTanyaRef(ref) {
      var m = /^(.*?)\s+(\d+)(?::(\d+))?$/.exec(String(ref || "").trim());
      if (!m) return null;
      return { prefix: m[1], chap: parseInt(m[2], 10), seg: m[3] ? parseInt(m[3], 10) : 1 };
    }
    function fetchTanyaPortion(item, cb) {
      var today = parseTanyaRef(item.ref);
      if (!today) { fetchText(item.ref, cb); return; }
      getCalendarsFor(1, function (tmap) {
        var titem = tmap && tmap["Tanya Yomi"];
        var tom = titem ? parseTanyaRef(titem.ref) : null;
        fetchText(today.prefix + " " + today.chap, function (segs) {
          if (!segs) { fetchText(item.ref, cb); return; }
          var startI = Math.min(Math.max(0, today.seg - 1), segs.length - 1);
          // מחר מתחיל באותו פרק — השיעור הוא הקטע שביניהם
          if (tom && tom.prefix === today.prefix && tom.chap === today.chap && tom.seg > today.seg) {
            cb(segs.slice(startI, tom.seg - 1));
            return;
          }
          // מחר בפרק אחר — קוראים עד סוף הפרק, ואם מחר לא מתחיל בסעיף א' מוסיפים גם את תחילת הפרק הבא
          var portion = segs.slice(startI);
          if (tom && tom.seg > 1 && !(tom.prefix === today.prefix && tom.chap === today.chap)) {
            fetchText(tom.prefix + " " + tom.chap, function (nsegs) {
              if (nsegs) portion = portion.concat(nsegs.slice(0, tom.seg - 1));
              cb(portion.length ? portion : segs);
            });
            return;
          }
          cb(portion.length ? portion : segs);
        });
      });
    }
    function openTrack(key) {
      var tr = null;
      TRACKS.forEach(function (t) { if (t.key === key) tr = t; });
      if (!tr) return;
      var old = document.getElementById("lux-track-reader");
      if (old) {
        // ghost-tap בנייד: נגיעה כפולה מיד אחרי הפתיחה נסגרה מיידית ונראתה כהבהוב
        if (Date.now() - (old.__luxOpenedAt || 0) < 600) return;
        luxModalClose("lux-track-reader");
        return;
      }
      var ov = document.createElement("div");
      ov.id = "lux-track-reader";
      ov.__luxOpenedAt = Date.now();
      ov.innerHTML =
        '<div class="lux-sel-head">' +
          '<button type="button" class="lux-sel-close" aria-label="סגור">✕</button>' +
          '<div class="lux-sel-titles">' +
            '<h2>' + tr.icon + " " + esc(tr.he) + "</h2>" +
            '<p id="lux-tr-ref">טוען את הלימוד של היום...</p>' +
          "</div>" +
        "</div>" +
        '<div id="lux-tr-area" class="lux-sel-area holy-text-style"><p style="text-align:center;color:#94a3b8;padding:2rem;">טוען...</p></div>' +
        '<div class="lux-sel-foot">' +
          '<button type="button" id="lux-tr-fminus" class="lux-sel-fbtn" aria-label="הקטן כתב">−</button>' +
          '<button type="button" id="lux-tr-fplus" class="lux-sel-fbtn" aria-label="הגדל כתב">+</button>' +
          '<span class="lux-sel-foot-sep"></span>' +
          '<button type="button" class="lux-sel-scroll-btn" onclick="window._toggleAutoScroll(\'#lux-tr-area\', this)" aria-label="התחל גלילה אוטומטית">▶</button>' +
          '<button type="button" class="auto-scroll-speed-btn lux-sel-speed" onclick="window._cycleAutoScrollSpeed(this)" aria-label="מהירות גלילה">1x</button>' +
          '<button type="button" id="lux-tr-done" class="lux-tr-done">✓ סיימתי להיום</button>' +
        "</div>";
      document.body.appendChild(ov);
      luxModalOpen("lux-track-reader");

      var area = ov.querySelector("#lux-tr-area");
      // גודל אחיד לכל האתר — אותו מפתח ואותו בסיס (25px ב-100%) כמו בכל הקוראים
      var fs = parseInt(localStorage.getItem("moadim_prayer_font_size") || "100", 10) || 100;
      if (fs < 60 || fs > 200) fs = 100;
      function applyFs() { area.style.setProperty("font-size", (fs / 100) * 25 + "px", "important"); try { localStorage.setItem("moadim_prayer_font_size", fs); } catch (_) {} if (window._btnToastVal && applyFs._user) window._btnToastVal("גודל כתב: " + fs + "%"); applyFs._user = false; }
      applyFs();
      ov.querySelector("#lux-tr-fplus").addEventListener("click", function () { fs = Math.min(200, fs + 10); applyFs._user = true; applyFs(); });
      ov.querySelector("#lux-tr-fminus").addEventListener("click", function () { fs = Math.max(60, fs - 10); applyFs._user = true; applyFs(); });
      ov.querySelector(".lux-sel-close").addEventListener("click", function () { luxModalClose("lux-track-reader"); });
      var doneBtn = ov.querySelector("#lux-tr-done");
      if (trackState(key).last === todayStr()) { doneBtn.classList.add("lux-tr-done-on"); doneBtn.textContent = "✓ הושלם היום"; }
      doneBtn.addEventListener("click", function () {
        // לחיצה שנייה מבטלת את הסימון של היום
        if (trackState(key).last === todayStr()) {
          unmarkDone(key);
          doneBtn.classList.remove("lux-tr-done-on");
          doneBtn.textContent = "✓ סיימתי להיום";
          if (typeof window.showToast === "function") {
            window.showToast("הסימון בוטל — אפשר לסמן שוב בכל עת", "info", 2200);
          }
          renderCards();
          return;
        }
        var s = markDone(key);
        doneBtn.classList.add("lux-tr-done-on");
        doneBtn.textContent = "✓ הושלם היום";
        luxConfetti();
        if (typeof window.showToast === "function") {
          window.showToast(tr.icon + " כל הכבוד! רצף " + tr.he + ": " + s.streak + " ימים 🔥", "success", 3000);
        }
        renderCards();
      });
      getCalendars(function (map) {
        var item = map && map[tr.title];
        if (!item || !item.ref) {
          area.innerHTML = '<p style="text-align:center;color:#b45309;padding:2rem;">לא הצלחנו לטעון את הלימוד של היום.<br>בדקו את החיבור ונסו שוב.</p>';
          return;
        }
        ov.querySelector("#lux-tr-ref").textContent = item.he || item.ref;
        var renderParas = function (paras) {
          if (!paras) {
            area.innerHTML = '<p style="text-align:center;color:#b45309;padding:2rem;">לא הצלחנו לטעון את הטקסט כעת.</p>';
            return;
          }
          area.innerHTML = paras.map(function (p) { return '<p class="lux-sel-para">' + p + "</p>"; }).join("") +
            '<div class="lux-sel-credit">✦<br>המקור: ספריית Sefaria.org (רישיון פתוח)</div>';
          area.scrollTop = 0;
        };
        // תניא — מביאים את השיעור היומי המלא, לא רק את סעיף הפתיחה
        if (key === "tanya") fetchTanyaPortion(item, renderParas);
        else fetchText(item.ref, renderParas);
      });
    }
    window.luxOpenTrack = openTrack;

    /* כרטיסי המסלולים בדף הראשי */
    function renderCards() {
      var row = document.getElementById("lux-tracks-row");
      if (!row) return;
      row.querySelectorAll(".lux-track-card").forEach(function (c) {
        var key = c.getAttribute("data-track");
        var s = trackState(key);
        var badge = c.querySelector(".lux-tc-badge");
        var done = s.last === todayStr();
        badge.textContent = done ? "✓ הושלם היום" : (s.streak > 1 ? "🔥 " + s.streak + " ימים" : "מחכה לך");
        badge.classList.toggle("lux-tc-done", done);
      });
    }
    function injectRow() {
      if (document.getElementById("lux-tracks-row")) return;
      var main = document.getElementById("main-content");
      var nav = main ? main.querySelector("nav") : null;
      if (!main || !nav) return;
      var row = document.createElement("section");
      row.id = "lux-tracks-row";
      row.innerHTML =
        '<h3 class="lux-tracks-title">📚 הלימוד היומי שלי</h3>' +
        '<div class="lux-tracks-grid">' +
        TRACKS.map(function (t) {
          return '<button type="button" class="lux-track-card" data-track="' + t.key + '" style="--tc:' + t.color + ';">' +
            '<span class="lux-tc-icon">' + t.icon + "</span>" +
            '<span class="lux-tc-name">' + esc(t.he) + "</span>" +
            '<span class="lux-tc-ref" data-ref-for="' + t.title + '">·</span>' +
            '<span class="lux-tc-badge">·</span>' +
          "</button>";
        }).join("") +
        "</div>";
      nav.insertAdjacentElement("beforebegin", row);
      row.querySelectorAll(".lux-track-card").forEach(function (c) {
        c.addEventListener("click", function () { openTrack(c.getAttribute("data-track")); });
      });
      renderCards();
      getCalendars(function (map) {
        if (!map) return;
        row.querySelectorAll(".lux-tc-ref").forEach(function (el) {
          var item = map[el.getAttribute("data-ref-for")];
          if (item && item.he) el.textContent = item.he;
        });
      });
    }
    injectRow();
    setTimeout(injectRow, 2500);
  });

  /* ── 44. סדר לימוד אישי — הספר שבחרתם, מחולק לימים לפי הקצב שלכם ── */
  safe("studyPlan", function () {
    var KEY = "lux_study_plans_v1";
    /* קטלוג — ספרים מהאתר עם מבנה פרקים ידוע ב-Sefaria.
       min = הערכת דקות לימוד ליחידה אחת (פרק/סימן/פרשה) */
    var SPD = {"bih1":[["בראשית","Bereshit"],["נח","Noach"],["לך לך","Lech Lecha"],["וירא","Vayera"],["חיי שרה","Chayei Sara"],["תולדות","Toldot"],["ויצא","Vayetzei"],["וישלח","Vayishlach"],["וישב","Vayeshev"],["חנוכה","Chanukah"],["מקץ","Miketz"],["ויגש","Vayigash"],["ויחי","Vayechi"],["שמות","Shemot"],["וארא","Vaera"],["בא","Bo"],["בשלח","Beshalach"],["יתרו","Yitro"],["משפטים","Mishpatim"],["תרומה","Terumah"],["תצוה","Tetzaveh"],["כי תשא","Ki Tisa"],["ויקהל","Vayakhel"],["פקודי","Pekudei"],["ויקרא","Vayikra"],["צו","Tzav"],["שמיני","Shmini"],["תזריע-מצורע","Tazria Metzora"],["אחרי-קדושים","Achrei Mot Kedoshim"],["אמור","Emor"],["בהר-בחקותי","Behar Bechukotai"],["במדבר","Bamidbar"],["נשא","Nasso"],["בהעלותך","Beha'alotcha"],["שלח","Sh'lach"],["קרח","Korach"],["חקת","Chukat"],["בלק","Balak"],["פינחס","Pinchas"],["מטות","Matot"],["מסעי","Masei"],["דברים","Devarim"],["ואתחנן","Vaetchanan"],["עקב","Eikev"],["ראה","Re'eh"],["שופטים","Shoftim"],["כי תצא","Ki Teitzei"],["כי תבוא","Ki Tavo"],["נצבים","Nitzavim"],["וילך","Vayeilech"],["האזינו","Ha'Azinu"],["וזאת הברכה","V'Zot HaBerachah"]],"bih2":[["בראשית","Bereshit"],["נח","Noach"],["לך לך","Lech Lecha"],["וירא","Vayera"],["חיי שרה","Chayei Sara"],["תולדות","Toldot"],["ויצא","Vayetzei"],["וישלח","Vayishlach"],["וישב","Vayeshev"],["מקץ","Miketz"],["ויגש","Vayigash"],["ויחי","Vayechi"],["שמות","Shemot"],["וארא","Vaera"],["בא","Bo"],["בשלח","Beshalach"],["יתרו","Yitro"],["משפטים","Mishpatim"],["תרומה","Terumah"],["תצוה","Tetzaveh"],["כי תשא","Ki Tisa"],["ויקהל","Vayakhel"],["פקודי","Pekudei"],["ויקרא","Vayikra"],["צו","Tzav"],["שמיני","Shmini"],["תזריע","Tazria"],["מצורע","Metzora"],["אחרי מות","Achrei Mot"],["קדושים","Kedoshim"],["אמור","Emor"],["בהר-בחקותי","Behar Bechukotai"],["נשא","Nasso"],["בהעלותך","Beha'alotcha"],["שלח","Sh'lach"],["קרח","Korach"],["חקת","Chukat"],["בלק","Balak"],["פינחס","Pinchas"],["מטות","Matot"],["מסעי","Masei"],["ואתחנן","Vaetchanan"],["עקב","Eikev"],["ראה","Re'eh"],["שופטים","Shoftim"],["כי תצא","Ki Teitzei"],["כי תבוא","Ki Tavo"]],"mishnah":[["ברכות","Mishnah Berakhot",9],["פאה","Mishnah Peah",8],["דמאי","Mishnah Demai",7],["כלאים","Mishnah Kilayim",9],["שביעית","Mishnah Sheviit",10],["תרומות","Mishnah Terumot",11],["מעשרות","Mishnah Maasrot",5],["מעשר שני","Mishnah Maaser Sheni",5],["חלה","Mishnah Challah",4],["ערלה","Mishnah Orlah",3],["ביכורים","Mishnah Bikkurim",4],["שבת","Mishnah Shabbat",24],["עירובין","Mishnah Eruvin",10],["פסחים","Mishnah Pesachim",10],["שקלים","Mishnah Shekalim",8],["יומא","Mishnah Yoma",8],["סוכה","Mishnah Sukkah",5],["ביצה","Mishnah Beitzah",5],["ראש השנה","Mishnah Rosh Hashanah",4],["תענית","Mishnah Ta'anit",4],["מגילה","Mishnah Megillah",4],["מועד קטן","Mishnah Moed Katan",3],["חגיגה","Mishnah Chagigah",3],["יבמות","Mishnah Yevamot",16],["כתובות","Mishnah Ketubot",13],["נדרים","Mishnah Nedarim",11],["נזיר","Mishnah Nazir",9],["סוטה","Mishnah Sotah",9],["גיטין","Mishnah Gittin",9],["קידושין","Mishnah Kiddushin",4],["בבא קמא","Mishnah Bava Kamma",10],["בבא מציעא","Mishnah Bava Metzia",10],["בבא בתרא","Mishnah Bava Batra",10],["סנהדרין","Mishnah Sanhedrin",11],["מכות","Mishnah Makkot",3],["שבועות","Mishnah Shevuot",8],["עדויות","Mishnah Eduyot",8],["עבודה זרה","Mishnah Avodah Zarah",5],["אבות","Pirkei Avot",6],["הוריות","Mishnah Horayot",3],["זבחים","Mishnah Zevachim",14],["מנחות","Mishnah Menachot",13],["חולין","Mishnah Chullin",12],["בכורות","Mishnah Bekhorot",9],["ערכין","Mishnah Arakhin",9],["תמורה","Mishnah Temurah",7],["כריתות","Mishnah Keritot",6],["מעילה","Mishnah Meilah",6],["תמיד","Mishnah Tamid",7],["מדות","Mishnah Middot",5],["קינים","Mishnah Kinnim",3],["כלים","Mishnah Kelim",30],["אהלות","Mishnah Oholot",18],["נגעים","Mishnah Negaim",14],["פרה","Mishnah Parah",12],["טהרות","Mishnah Tahorot",10],["מקואות","Mishnah Mikvaot",10],["נדה","Mishnah Niddah",10],["מכשירין","Mishnah Makhshirin",6],["זבים","Mishnah Zavim",5],["טבול יום","Mishnah Tevul Yom",4],["ידים","Mishnah Yadayim",4],["עוקצין","Mishnah Oktzin",3]],"midot":[["הקדמה","Introduction"],["הקדמה שניה","Second Introduction"],["אמת (א)","Truth, Part I"],["אמת (ב)","Truth, Part II"],["הכנסת אורחים (א)","Hospitality, Part I"],["הכנסת אורחים (ב)","Hospitality, Part II"],["אהבה (א)","Love, Part I"],["אהבה (ב)","Love, Part II"],["אמונה (א)","Faith, Part I"],["אמונה (ב)","Faith, Part II"],["אכילה (א)","Eating, Part I"],["אכילה (ב)","Eating, Part II"],["אלמן (א)","A Widower, Part I"],["אלמן (ב)","A Widower, Part II"],["ארץ ישראל (ב)","The Land of Israel, Part II"],["אבידה","Lost Objects"],["בנים (א)","Children, Part I"],["בנים (ב)","Children, Part II"],["בית (א)","A House, Part I"],["בית (ב)","A House, Part II"],["בושה","Embarrassment; Modesty"],["בגדים (א)","Clothing, Part I"],["בגדים (ב)","Clothing, Part II"],["בטחון (א)","Trust in God, Part I"],["בטחון (ב)","Trust in God, Part II"],["בשורה (א)","Tidings, Part I"],["בשורה (ב)","Tidings, Part II"],["ברכה","Blessing"],["בכייה","Crying"],["גאוה","Haughtiness"],["גניבה וגזילה (א)","Theft and Robbery, Part I"],["גניבה וגזילה (ב)","Theft and Robbery, Part II"],["דעת (א)","Knowledge of God, Part I"],["דעת (ב)","Knowledge of God, Part II"],["דרך (א)","Traveling, Part I"],["דרך (ב)","Traveling, Part II"],["דיין","A Judge"],["המתקת דין (א)","Mitigating Judgment, Part I"],["המתקת דין (ב)","Mitigating Judgment, Part II"],["התבודדות (א)","Seclusion, Part I"],["התבודדות (ב)","Seclusion, Part II"],["הרהורים (א)","Improper Thoughts, Part I"],["הרהורים (ב)","Improper Thoughts, Part II"],["התנשאות (א)","Prestige and Importance, Part I"],["התנשאות (ב)","Prestige and Importance, Part II"],["הצלחה (א)","Success and Prosperity, Part I"],["הצלחה (ב)","Success and Prosperity, Part II"],["הריון (א)","Conception; Pregnancy, Part I"],["הריון (ב)","Conception; Pregnancy, Part II"],["הוראה","Instruction"],["ודוי דברים","Confession"],["ותרן","Easygoing"],["זיפן","A Fraud"],["זכות אבות (א)","Ancestral Merit, Part I"],["זכות אבות (ב)","Ancestral Merit, Part II"],["זכירה","Memory"],["זקנים","Elders"],["זריזות","Zealousness"],["חלום (א)","Dreams, Part I"],["חלום (ב)","Dreams, Part II"],["חן (א)","Grace, Part I"],["חן (ב)","Grace, Part II"],["חנפה (א)","Flattery, Part I"],["חנפה (ב)","Flattery, Part II"],["חקירה","Philosophical Investigation"],["חדושין דאוריתא","Original Torah; Sights"],["חיתון","Marriage"],["טבע","Nature"],["טלטול","Wandering"],["טהרה","Purity"],["ישועה","Salvation and Miracles"],["יראה (א)","Fear of God, Part I"],["יראה (ב)","Fear of God, Part II"],["יחוס","Distinguished Ancestry"],["כבוד (א)","Honor and Respect, Part I"],["כבוד (ב)","Honor and Respect, Part II"],["כעס","Anger"],["כישוף","Sorcery"],["לימוד (א)","Torah Study, Part I"],["לימוד (ב)","Torah Study, Part II"],["לשון הרע (א)","Slander, Part I"],["לשון הרע (ב)","Slander, Part II"],["ליצנות","Derision and Mockery"],["מריבה (א)","Conflict and Strife, Part I"],["מריבה (ב)","Conflict and Strife, Part II"],["ממון (א)","Money, Part I"],["ממון (ב)","Money, Part II"],["מפלת (א)","Miscarriage, Part I"],["מפלת (ב)","Miscarriage, Part II"],["מסור","An Informer"],["משקה","Alcohol"],["משיח","The Messiah"],["מוהל","A Circumciser"],["מפורסם","Fame"],["ניאוף (א)","Immoral Behavior, Part I"],["ניאוף (ב)","Immoral Behavior, Part II"],["נדה (א)","Menstruation, Part I"],["נדה (ב)","Menstruation, Part II"],["נפילה (א)","A Fall, Part I"],["נפילה (ב)","A Fall, Part II"],["ניבול פה","Obscene Language"],["נהנה מאחרים (א)","Benefitting from Others, Part I"],["נהנה מאחרים (ב)","Benefitting from Others, Part II"],["נגינה","Song"],["ניסיון","A Test"],["נר תמיד","An Eternal Flame"],["ספירת העומר","Counting the Omer"],["סוד","Mysteries"],["ספר","A Holy Book"],["סגולה","A Divine Remedy"],["ענוה (א)","Humility, Part I"],["ענוה (ב)","Humility, Part II"],["עצבות (א)","Depression, Part I"],["עצבות (ב)","Depression, Part II"],["עצירות","Constipation"],["עבירה","Sin"],["עצלות","Laziness"],["עונש","Punishment"],["עצה","Advice"],["עזות (א)","Arrogance, Part I"],["עזות (ב)","Arrogance, Part II"],["פחד (א)","Fear, Part I"],["פחד (ב)","Fear, Part II"],["פדיון שבויים (א)","Redeeming Captives, Part I"],["פדיון שבויים (ב)","Redeeming Captives, Part II"],["פרישות","Abstinence"],["פוסק","Halakhic Codifiers"],["צדקה (א)","Charity, Part I"],["צדקה (ב)","Charity, Part II"],["צדיק (א)","A Righteous Person, Part I"],["צדיק (ב)","A Righteous Person, Part II"],["קללה (א)","A Curse, Part I"],["קללה (ב)","A Curse, Part II"],["קליפה (א)","Forces of Evil, Part I"],["קליפה (ב)","Forces of Evil, Part II"],["קנאה","Envy and Jealousy"],["קרי (א)","A Seminal Emission, Part I"],["קרי (ב)","A Seminal Emission, Part II"],["קשוי לילד","Difficulty in Childbirth"],["הרחקת רשעים (א)","Distancing the Wicked, Part I"],["הרחקת רשעים (ב)","Distancing the Wicked, Part II"],["רחמנות (א)","Compassion and Mercy, Part I"],["רחמנות (ב)","Compassion and Mercy, Part II"],["ראיה","Vision"],["רפואה","Healing"],["שמחה (א)","Joy and Happiness, Part I"],["שמחה (ב)","Joy and Happiness, Part II"],["שכרות (א)","Drunkenness, Part I"],["שכרות (ב)","Drunkenness, Part II"],["שרים","Public Officials"],["שוחד","Bribery"],["שלום","Peace"],["שבועה","Oaths"],["שבת","The Sabbath"],["שינה","Sleep"],["שוחט","A Ritual Slaughterer"],["תשובה (א)","Repentance, Part I"],["תשובה (ב)","Repentance, Part II"],["תוכחה (א)","Rebuke, Part I"],["תוכחה (ב)","Rebuke, Part II"],["תפילה (א)","Prayer, Part I"],["תפילה (ב)","Prayer, Part II"]],"kedushat":[["בראשית","Genesis, Bereshit"],["נח","Genesis, Noach"],["לך לך","Genesis, Lech Lecha"],["וירא","Genesis, Vayera"],["חיי שרה","Genesis, Chayei Sara"],["תולדות","Genesis, Toldot"],["ויצא","Genesis, Vayetzei"],["וישלח","Genesis, Vayishlach"],["וישב","Genesis, Vayeshev"],["מקץ","Genesis, Miketz"],["ויגש","Genesis, Vayigash"],["ויחי","Genesis, Vayechi"],["שמות","Exodus, Shemot"],["וארא","Exodus, Vaera"],["בא","Exodus, Bo"],["בשלח","Exodus, Beshalach"],["יתרו","Exodus, Yitro"],["משפטים","Exodus, Mishpatim"],["תרומה","Exodus, Terumah"],["תצוה","Exodus, Tetzaveh"],["כי תשא","Exodus, Ki Tisa"],["ויקהל","Exodus, Vayakhel"],["פקודי","Exodus, Pekudei"],["ויקרא","Leviticus, Vayikra"],["צו","Leviticus, Tzav"],["שמיני","Leviticus, Shemini"],["תזריע","Leviticus, Tazria"],["מצורע","Leviticus, Metzora"],["אחרי מות","Leviticus, Acharei Mot"],["קדושים","Leviticus, Kedoshim"],["אמור","Leviticus, Emor"],["בהר","Leviticus, Behar"],["בחוקותי","Leviticus, Bechukotai"],["במדבר","Numbers, Bamidbar"],["נשא","Numbers, Naso"],["בהעלותך","Numbers, Beha'alotcha"],["שלח","Numbers, Shelach"],["קרח","Numbers, Korach"],["חוקת","Numbers, Chukat"],["בלק","Numbers, Balak"],["פינחס","Numbers, Pinchas"],["מטות","Numbers, Matot"],["מסעי","Numbers, Masei"],["דברים","Deuteronomy, Devarim"],["ואתחנן","Deuteronomy, Vaetchanan"],["עקב","Deuteronomy, Eikev"],["ראה","Deuteronomy, Re'eh"],["שופטים","Deuteronomy, Shoftim"],["כי תצא","Deuteronomy, Ki Teitzei"],["כי תבוא","Deuteronomy, Ki Tavo"],["נצבים","Deuteronomy, Nitzavim"],["וילך","Deuteronomy, Vayeilech"],["האזינו","Deuteronomy, Ha'Azinu"],["וזאת הברכה","Deuteronomy, V'Zot HaBerachah"]],"noam":[["בראשית","Sefer Bereshit, Bereshit"],["נח","Sefer Bereshit, Noach"],["לך לך","Sefer Bereshit, Lech Lecha"],["וירא","Sefer Bereshit, Vayera"],["חיי שרה","Sefer Bereshit, Chayye Sara"],["תולדות","Sefer Bereshit, Toldot"],["ויצא","Sefer Bereshit, Vayetzei"],["וישלח","Sefer Bereshit, Vayishlach"],["וישב","Sefer Bereshit, Vayeshev"],["מקץ","Sefer Bereshit, Miketz"],["ויגש","Sefer Bereshit, Vayigash"],["ויחי","Sefer Bereshit, Vayechi"],["שמות","Sefer Shemot, Shemot"],["וארא","Sefer Shemot, Vaera"],["בא","Sefer Shemot, Bo"],["בשלח","Sefer Shemot, Beshalach"],["יתרו","Sefer Shemot, Yitro"],["משפטים","Sefer Shemot, Mishpatim"],["תרומה","Sefer Shemot, Terumah"],["תצוה","Sefer Shemot, Tetzaveh"],["כי תשא","Sefer Shemot, Ki Tisa"],["פקודי","Sefer Shemot, Pekudei"],["ויקרא","Sefer Vayikra, Vayikra"],["צו","Sefer Vayikra, Tzav"],["שמיני","Sefer Vayikra, Shmini"],["תזריע","Sefer Vayikra, Tazria"],["מצורע","Sefer Vayikra, Metzora"],["אחרי מות","Sefer Vayikra, Acharei Mot"],["קדושים","Sefer Vayikra, Kedoshim"],["אמור","Sefer Vayikra, Emor"],["בהר","Sefer Vayikra, Behar"],["בחוקתי","Sefer Vayikra, Bechukotai"],["במדבר","Sefer Bamidbar, Bamidbar"],["נשא","Sefer Bamidbar, Nasso"],["בהעלותך","Sefer Bamidbar, Beha'alotcha"],["שלח","Sefer Bamidbar, Sh'lach"],["קרח","Sefer Bamidbar, Korach"],["חקת","Sefer Bamidbar, Chukat"],["בלק","Sefer Bamidbar, Balak"],["פנחס","Sefer Bamidbar, Pinchas"],["מטות","Sefer Bamidbar, Matot"],["מסעי","Sefer Bamidbar, Masei"],["דברים","Sefer Devarim, Devarim"],["ואתחנן","Sefer Devarim, Vaetchanan"],["עקב","Sefer Devarim, Eikev"],["ראה","Sefer Devarim, Re'eh"],["שופטים","Sefer Devarim, Shoftim"],["כי תצא","Sefer Devarim, Ki Teitzei"],["כי תבוא","Sefer Devarim, Ki Tavo"],["האזינו","Sefer Devarim, Ha'Azinu"]],"menorat":[["פיוט","Piyyut"],["הקדמה","Introduction"],["א; פרק הצדקה","i; On Charity"],["תפילה","ii; On Prayer, Prayer"],["תפילה בבית הכנסת","ii; On Prayer, Prayer in the Synagogue"],["נטילת ידים","ii; On Prayer, Washing"],["ציצית","ii; On Prayer, Tzitzit"],["תפילין","ii; On Prayer, Tefillin"],["סדר מאה ברכות","ii; On Prayer, Hundred Berakhot"],["ענין שליח צבור","ii; On Prayer, Chazzan"],["קדיש","ii; On Prayer, Kaddish"],["שמע","ii; On Prayer, Shema"],["עמידה","ii; On Prayer, Amidah"],["סדר י\\\"ח ברכות","ii; On Prayer, Order of Amidah"],["ברכת כהנים","ii; On Prayer, Birkat Kohanim"],["נפילת אפים","ii; On Prayer, Tachanun"],["קריאת התורה","ii; On Prayer, Torah Reading"],["מנחה","ii; On Prayer, Mincha"],["תפילת ערבית","ii; On Prayer, Arvit"],["קריאת שמע על המיטה","ii; On Prayer, Bedtime Shema"],["תפילות של שבת","ii; On Prayer, Shabbat Prayers"],["הבדלה","ii; On Prayer, Havdalah"],["ראש חודש","ii; On Prayer, Rosh Chodesh"],["ברכת הלבנה","ii; On Prayer, Kiddush Levanah"],["חנוכה","ii; On Prayer, Chanukah"],["פורים","ii; On Prayer, Purim"],["בענין הגעלת הכלים","ii; On Prayer, Pesach, i"],["בענין בדיקת החמץ","ii; On Prayer, Pesach, ii"],["בענין יום ארבעה עשר","ii; On Prayer, Pesach, iii"],["בענין דברים שעוברין בפסח","ii; On Prayer, Pesach, iv"],["בענין לישת המצה","ii; On Prayer, Pesach, v"],["בענין איסור מלאכה","ii; On Prayer, Pesach, vi"],["בענין המלאכות המותרות בחול המועד","ii; On Prayer, Pesach, vii"],["בענין תפלות ימי החג וסדר ליל פסח","ii; On Prayer, Pesach, viii"],["סדר ספירת העומר","ii; On Prayer, Sefirat HaOmer"],["שבועות","ii; On Prayer, Shavuot"],["הלכות התעניות","ii; On Prayer, Fasts"],["בענין הגשמים","ii; On Prayer, Drought Relief"],["תענית יחיד","ii; On Prayer, Individual Fasts"],["מאורעות שאירעו לאבותינו","ii; On Prayer, Matters that Occurred to our Forefathers"],["הלכות תשעה באב","ii; On Prayer, Tisha BeAv"],["תיקון האשמורות","ii; On Prayer, Selichot"],["ראש השנה","ii; On Prayer, Rosh Hashanah"],["יום כיפור","ii; On Prayer, Yom Kippur"],["סוכות","ii; On Prayer, Sukkot"],["הלכות אתרוג והדס וערבה","ii; On Prayer, The Four Species"],["לולב","ii; On Prayer, Lulav"],["תפילות חג הסוכות","ii; On Prayer, Sukkot Prayers"],["הוספות","ii; On Prayer, Addenda"],["מעלת התשובה","iii; On Repentance, The Quality of Repentance"],["ענין הייסורין","iii; On Repentance, On Afflictions"],["כח התשובה","iii; On Repentance, The Power of Repentance"],["סבות התשובה וכלליה","iii; On Repentance, Incentives of Repentance"],["כיצד היא התשובה","iii; On Repentance, What is Repentance"],["מעלת בעל תשובה","iii; On Repentance, The Quality of the Repenter"],["מרגניתא דר' מאיר","iii; On Repentance, Marganita deRabbi Meir"],["זכיות ועברות","iii; On Repentance, Merits and Transgressions"],["סדר התשובה","iii; On Repentance, Order of Teshuvah"],["הלכות תשובה","iii; On Repentance, Laws of Teshuvah"],["מעשיות בצדיקים קדושים","iii; On Repentance, Tales of the Righteous"],["ענין התוכחות","iii; On Repentance, Reprovement"],["מעלות הענווה ומידות העניו","iv; On Humility, Its Attributes"],["הדברים המביאין לידי ענוה","iv; On Humility, Developing Humility"],["דרכי הענווה","iv; On Humility, Its Habits"],["הגאווה וכתותיה","iv; On Humility, Haughtiness and its Subclasses"],["גדולה ענוה","iv; On Humility, Great is Humility"],["יהירות","iv; On Humility, Arrogance"],["לימוד תורה","v; On Fixed Hours of Study, Torah Study"],["התורה אומן למעשה בראשית","v; On Fixed Hours of Study, Torah is an Architect of Creation"],["התורה וישראל","v; On Fixed Hours of Study, Torah and the Jewish People"],["כתר התורה","v; On Fixed Hours of Study, The Crown Torah"],["מאור התורה","v; On Fixed Hours of Study, The Light of Torah"],["רפואת התורה","v; On Fixed Hours of Study, The Healing of Torah"],["עץ החיים","v; On Fixed Hours of Study, Tree of Life"],["חייב אדם למסור את נפשו על התורה","v; On Fixed Hours of Study, Dedication to Torah"],["עניין ביטול תורה ועונשו","v; On Fixed Hours of Study, Bitul Torah"],["שכר העוסק בתורה","v; On Fixed Hours of Study, Its Reward"],["סילוקן של צדיקים","v; On Fixed Hours of Study, Death of the Righteous"],["לימוד התורה ביום ובלילה","v; On Fixed Hours of Study, Torah Study by Day and by Night"],["יפה תורה עם מלאכה","v; On Fixed Hours of Study, Excellent is Torah Combined with a Worldly Occupation"],["כוונת תלמוד תורה לשמה","v; On Fixed Hours of Study, Torah for its Own Sake"],["צריך אדם לחזר אחר התורה","v; On Fixed Hours of Study, Seeking Torah"],["תורה ודרך ארץ","v; On Fixed Hours of Study, Torah and Derekh Eretz"],["ענין ספר תורה","v; On Fixed Hours of Study, Sefer Torah"],["ענין מתן תורה","v; On Fixed Hours of Study, Giving of the Torah"],["ענין עם הארץ","v; On Fixed Hours of Study, Ignorant People"],["כל מי שיודע תורה חייב ללמדה","v; On Fixed Hours of Study, The Duty to Teach Torah"],["דרכי הרב ותלמידיו","v; On Fixed Hours of Study, Teacher Pupil Relationship"],["כבוד תלמידי חכמים ועניין נדוי","v; On Fixed Hours of Study, Honoring the Sages"],["חמש מעלות לעוסק בתורה","v; On Fixed Hours of Study, Five attributes of the Torah scholar"],["גדולה תורה","v; On Fixed Hours of Study, Great is Torah"],["לימוד המצות ע\\\"מ לעשותן וללמדן","vi; On the Commandments, Study in order to keep and teach"],["המצות וישראל","vi; On the Commandments, The commandments and Israel"],["מאהבת ישראל במצות מוסרין נפשם עליהן","vi; On the Commandments, Dedication and sacrifice"],["א' בחריצות וזריזות","vi; On the Commandments, On their fulfilment, i"],["ב' באזהרה מבטול מצות עשה","vi; On the Commandments, On their fulfilment, ii"],["ג' בזריזות להקדים למצוה בבואה","vi; On the Commandments, On their fulfilment, iii"],["ד' להגדיל ולהאדיר את המצות","vi; On the Commandments, On their fulfilment, iv"],["ה' בהידור המצוה","vi; On the Commandments, On their fulfilment, v"],["ו' לקיים המצוה באיברים ובהרגשות","vi; On the Commandments, On their fulfilment, vi"],["ז' בכוונת עשיית המצוה","vi; On the Commandments, On their fulfilment, vii"],["ח' בעשיית המצוה מממון היתר","vi; On the Commandments, On their fulfilment, viii"],["ט' במצות הנוהגות בנשים ובקטנים","vi; On the Commandments, On their fulfilment, ix"],["י' במצות שהן מדברי סופרים","vi; On the Commandments, On their fulfilment, x"],["א' בדבר שכולל כל הברכות","vi; On the Commandments, Order of blessings, i"],["ב' ברכת הלחם והזימון וברכת המזון","vi; On the Commandments, Order of blessings, ii"],["ג' בדברים שמברכין עליהם בורא מיני מזונות","vi; On the Commandments, Order of blessings, iii"],["ד' בדברים שמברכין עליהם שהכל נהיה בדברו","vi; On the Commandments, Order of blessings, iv"],["ה' בדברים שמברכין עליהם בורא פרי האדמה","vi; On the Commandments, Order of blessings, v"],["ו' בדברים שמברכין עליהם בורא פרי העץ","vi; On the Commandments, Order of blessings, vi"],["ז' בדברים שבאים בתוך הסעודה מחמת הסעודה","vi; On the Commandments, Order of blessings, vii"],["ח' בברכות שמברכין על כל ריח מיני בשמים","vi; On the Commandments, Order of blessings, viii"],["ט' בברכות שמברכין על השמועות ועל ראיות העין והשבח וההודאה","vi; On the Commandments, Order of blessings, ix"],["י' בברכות שמברכין על הדברים שאין להם זמן ידוע","vi; On the Commandments, Order of blessings, x"],["הלכות מילה","vi; On the Commandments, Laws of circumcision"],["גדולה מילה","vi; On the Commandments, Great is circumcision"],["ברכת אירוסין","vi; On the Commandments, Betrothal blessing"],["הלכות פדיון הבן","vi; On the Commandments, Laws of redeeming the firstborn"],["הלכות מזוזה","vi; On the Commandments, Laws of mezuzah"],["הלכות אונן","vi; On the Commandments, Laws of onen"],["הלכות אבל","vi; On the Commandments, Laws of mourning"],["דין ההספד","vi; On the Commandments, The eulogy"],["אין מצטערין יותר מדאי","vi; On the Commandments, Not to grieve excessively"],["עירובי חצרות ותבשילין","vi; On the Commandments, Eruvin"],["הלכות חלה","vi; On the Commandments, Laws of Challah"],["ברכת מעקה","vi; On the Commandments, Parapet blessing"],["גדולת גמילות חסדים א","vii; On Acts of Mercy, Great is Kindness I"],["ביקור חולים","vii; On Acts of Mercy, Visiting the Sick"],["תשובת החולה","vii; On Acts of Mercy, The Vidduy"],["הספד המת","vii; On Acts of Mercy, Eulogizing the dead"],["גדולה גמילות חסדים ב","vii; On Acts of Mercy, Great is Kindness II"],["שמור שבת","viii; On the Observance of Sabbath and Holy Days, Observing Shabbat"],["ברית שבת","viii; On the Observance of Sabbath and Holy Days, The covenant of Shabbat"],["עונג שבת","viii; On the Observance of Sabbath and Holy Days, Oneg Shabbat"],["כבוד שבת","viii; On the Observance of Sabbath and Holy Days, Honor the Shabbat"],["גדולה שבת","viii; On the Observance of Sabbath and Holy Days, Great is Shabbat"],["חגים","viii; On the Observance of Sabbath and Holy Days, Holidays"],["הוספה","Addendum"],["גדולת כיבוד אב ואם","ix; On the Honoring of Parents, Great is honoring one's parents"],["פרטי הכבוד","ix; On the Honoring of Parents, The ways of honoring"],["כיבוד אב ואם ולימוד המוסר","ix; On the Honoring of Parents, Morals in honoring one's parents"],["עד היכן כיבוד אב ואם","ix; On the Honoring of Parents, The extent of honoring one's parents"],["זיווגו של אדם; הכרח או בחירה","x; On Marriage, One's match; fate or choice"],["כמה טובה אשה טובה","x; On Marriage, How great is a great wife"],["מידות האשה הטובה","x; On Marriage, The virtues of great wife"],["כבוד האשה","x; On Marriage, Honoring a wife"],["לישא בת טובים","x; On Marriage, Marriage and lineage"],["המזנה על אשתו כעובד ע\\\"ז","x; On Marriage, One who commits adultery is likened to an idolater"],["קשה הוא הזנות","x; On Marriage, The severity of sexual immorality"],["לישא אשה הגונה בימי הבחרות","x; On Marriage, Marrying a suitable wife while young"],["מידות האשה הצנועה","x; On Marriage, The virtues of a modest woman"],["א' ע\\\"פ הראב\\\"ד ומקצת דעות אחרות","x; On Marriage, Communion with one's wife, i According to the Raavad"],["ב' ע\\\"פ הרמב\\\"ן","x; On Marriage, Communion with one's wife, ii According to the Ramban"],["ענין מוסר הבן","xi; On the Education of Children, Discipline a son"],["המייסר את בנו מחכימו","xi; On the Education of Children, He who disciplines his son makes him wise"],["מוסר של אהבה","xi; On the Education of Children, Chastisement of love"],["הצלת בנים לאבות","xi; On the Education of Children, Extrication of fathers by sons"],["דברים שאדם חייב לעשות לבנו","xi; On the Education of Children, Commandment a father must fulfill towards his son"],["חייב הקהל לשכור מלמדי תינוקות","xi; On the Education of Children, The community must hire teachers"],["ישתדל אדם ללמד תורה לבנו","xi; On the Education of Children, One must teach his son Torah"],["אהבת הבנים","xi; On the Education of Children, Love of a father to his sons"],["גדולת הנושא ונותן באמונה","xii; On Upright Conduct in Business, Acting in business honestly"],["להתרחק מן הגזל","xii; On Upright Conduct in Business, Keeping away from theft"],["להתרחק מן האונאה","xii; On Upright Conduct in Business, Keeping away from fraud"],["להלוות לעני בשעת דחקו","xii; On Upright Conduct in Business, To loan the poor"],["לעולם ידבק אדם באומנות חשובה ונקייה","xii; On Upright Conduct in Business, Engaging in an honorable trade"],["מעלת הצדקה והדינין","xiii; On the Proper Administration of Justice, Great is justice"],["גדול המשפט","xiii; On the Proper Administration of Justice, Great is jurisprudence"],["מידות הדיין","xiii; On the Proper Administration of Justice, The qualities of a judge"],["גנאי הדיין שאינו הגון","xiii; On the Proper Administration of Justice, The disgrace of an unfit judge"],["להתרחק מן השוחד","xiii; On the Proper Administration of Justice, Keeping away from bribery"],["לישא משאן של ישראל","xiii; On the Proper Administration of Justice, To carry the load of the people"],["לעשות דין אחד לכל","xiii; On the Proper Administration of Justice, To carry out justice to all"],["למנות דיינים זקנים","xiii; On the Proper Administration of Justice, To appoint elderly judges"],["בשבח השמח בחלקו","xiv; On Contentment, To rejoices in one's lot"],["הצדיק והספוק במועט","xiv; On Contentment, To be satisfied with a little"],["מעלת הביטחון בהקב\\\"ה","xiv; On Contentment, Trusting God"],["מעשיות בחסידים ששמחו בחלקם","xiv; On Contentment, Accounts of the pious ones"],["שכר השמח בחלקו","xiv; On Contentment, The reward of he who rejoices in his lot"],["בענין הקנאה","xiv; On Contentment, On jealousy"],["בשבח המאריך אפו ואינו כועס","xv; On Equanimity, The praise of he who is slow to anger"],["כל הכועס חכמתו מסתלקת ממנו","xv; On Equanimity, He who becomes angry his wisdom departs from him"],["המרבה לכעוס עונו רב","xv; On Equanimity, The great sin of he who becomes angry regularly"],["בענין החנופה","xvi; On Avoidance of Flattery and Deception, On flattery"],["כתות החנפים","xvi; On Avoidance of Flattery and Deception, The classes of flatterers"],["דרכי החנפים","xvi; On Avoidance of Flattery and Deception, The ways of flatterers"],["קשה החנופה","xvi; On Avoidance of Flattery and Deception, The severity of flattery"],["הליצנות והלצים","xvi; On Avoidance of Flattery and Deception, On scoffing"],["קשה הליצנות","xvi; On Avoidance of Flattery and Deception, The severity of scoffing"],["בענין אהבת חבירו","xvii; On Love of Comrades and their Considerate Treatment, Loving one's fellow"],["קשה היא המחלוקת","xvii; On Love of Comrades and their Considerate Treatment, The severity of"],["קשה היא השנאה","xvii; On Love of Comrades and their Considerate Treatment, The severity of discord"],["אהבת הבריות","xvii; On Love of Comrades and their Considerate Treatment, Love of all people"],["להתחבר לטובים ולישרים","xvii; On Love of Comrades and their Considerate Treatment, Associating with the upright"],["מידות החבר הטוב והנאמן","xvii; On Love of Comrades and their Considerate Treatment, The qualities of a good friend"],["גרי הצדק וישראל שוין באהבה","xvii; On Love of Comrades and their Considerate Treatment, Loving the converts equally"],["חביבין הגרים","xvii; On Love of Comrades and their Considerate Treatment, Beloved are the converts"],["לכבד את חבירו","xvii; On Love of Comrades and their Considerate Treatment, Honoring one's friend"],["מות וחיים ביד לשון","xviii; On Cleanness of Speech, Death and life are in the power of the tongue"],["קשה לשון הרע","xviii; On Cleanness of Speech, The severity of slander"],["עונשו של לשון הרע","xviii; On Cleanness of Speech, The punishment of slander"],["כתות מספרי לשון הרע","xviii; On Cleanness of Speech, The classes of slanderers"],["מעלת השתיקה","xviii; On Cleanness of Speech, The greatness of silence"],["בכסוי הסוד וגלויו","xix; On Keeping a Friend's Secret, Keeping and revealing a secret"],["בענין הריב","xix; On Keeping a Friend's Secret, On disputes"],["כתות אנשי שקר","xix; On Keeping a Friend's Secret, Classes of treacherous men"],["יזהר אדם בשבועה","xix; On Keeping a Friend's Secret, Being diligent on vows"],["בענין דרך ארץ","xx; On Good Manners, On etiquette"],["א' דרך ארץ של תלמידי חכמים","xx; On Good Manners, i etiquette of Torah scholars"],["ב' דרך ארץ הראויה לזקנים","xx; On Good Manners, ii etiquette of elders"],["ג' דרך ארץ של אנשים","xx; On Good Manners, iii etiquette of men"],["ד' דרך ארץ של נשים","xx; On Good Manners, iv etiquette of women"],["ה' דרך ארץ בכלל ובפרט","xx; On Good Manners, v etiquette rules"],["דברים שהם מדרכי האמורי","xx; On Good Manners, Ways of the Amorite"],["דברים בדרך ארץ","xx; On Good Manners, More on etiquette"],["פתיחה","Chupat Eliyahu Rabbah, Forward"],["שער שלשה","Chupat Eliyahu Rabbah, Gate of Three"],["שער ארבעה","Chupat Eliyahu Rabbah, Gate of Four"],["שער חמשה","Chupat Eliyahu Rabbah, Gate of Five"],["שער ששה","Chupat Eliyahu Rabbah, Gate of Six"],["שער שבעה","Chupat Eliyahu Rabbah, Gate of Seven"],["שער שמונה","Chupat Eliyahu Rabbah, Gate of Eight"],["שער תשעה","Chupat Eliyahu Rabbah, Gate of Nine"],["שער עשרה","Chupat Eliyahu Rabbah, Gate of Ten"],["שער אחד עשר","Chupat Eliyahu Rabbah, Gate of Eleven"],["שער שנים עשר","Chupat Eliyahu Rabbah, Gate of Twelve"],["שער שלשה עשר","Chupat Eliyahu Rabbah, Gate of Thirteen"],["שער ארבעה עשר","Chupat Eliyahu Rabbah, Gate of Fourteen"],["שער חמשה עשר","Chupat Eliyahu Rabbah, Gate of Fifteen"],["אור עולם","Ohr Olam"],["אור גדול","Ohr Gadol"],["גדול השלום","Great is the peace"],["א' תשובת הר\\\"ר מאיר בענין הזיווגים","Addenda, i"],["ב' דברים שמנו חכמים במנין","Addenda, ii"],["ג' מדרש לעולם","Addenda, iii"]],"likutei":[["הקדמת המחבר","Author's Introduction"],["השכמת הבוקר","Orach Chaim, Laws of Morning Conduct"],["נטילת ידיים שחרית","Orach Chaim, Laws for the Morning Washing of Hands"],["ברכות השחר","Orach Chaim, Laws for Morning Blessings"],["ציצית","Orach Chaim, Laws of Fringes"],["תפילין","Orach Chaim, Laws of Phylacteries"],["קריאת שמע","Orach Chaim, Laws of the Recitation of the Shema"],["תפילה","Orach Chaim, Laws of Prayer"],["נשיאת כפיים","Orach Chaim, Laws of the Priestly Blessing"],["קריאת התורה","Orach Chaim, Laws of the Reading of the Torah"],["בית הכנסת","Orach Chaim, Laws of the Synagogue"],["ברכת הפירות","Orach Chaim, Laws of Blessings on Fruit"],["שבת","Orach Chaim, Laws of the Sabbath"],["ראש חודש","Orach Chaim, Laws of the New Moon"],["פסח","Orach Chaim, Laws of Passover"],["שבועות","Orach Chaim, Laws of Shavuot"],["ראש השנה","Orach Chaim, Laws of Rosh Hashanah"],["יום כיפור","Orach Chaim, Laws of the Day of Atonement"],["סוכה","Orach Chaim, Laws of Sukkot"],["חנוכה","Orach Chaim, Laws of Chanukah"],["פורים","Orach Chaim, Laws of Purim"],["שחיטה","Yoreh Deah, Laws of Slaughtering"],["בשר וחלב","Yoreh Deah, Laws of Meat and Milk"],["ריבית","Yoreh Deah, Laws of Interest"],["מקוואות","Yoreh Deah, Laws of Ritual Baths"],["תלמוד תורה","Yoreh Deah, Laws of Torah Study"],["צדקה","Yoreh Deah, Laws of Charity"],["מילה","Yoreh Deah, Laws of Circumcision"],["אבילות","Yoreh Deah, Laws of Mourning"],["פריה ורביה","Even HaEzer, Laws of Being Fruitful and Multiplying"],["קידושין","Even HaEzer, Laws of Betrothal"],["כתובות","Even HaEzer, Laws of Ketubot"],["גירושין","Even HaEzer, Laws of Divorce"],["הלוואה","Choshen Mishpat, Laws of Loans"],["מקח וממכר","Choshen Mishpat, Laws of Buying and Selling"],["גזילה","Choshen Mishpat, Laws of Theft"],["נזיקין","Choshen Mishpat, Laws of Damages"],["נחלות","Choshen Mishpat, Laws of Inheritance"]],"chovot":[["הקדמת המחבר","Introduction of the Author"],["שער ייחוד","First Treatise on Unity"],["שער הבחינה","Second Treatise on Examination"],["שער עבודת האלוהים","Third Treatise on Service of God"],["שער הביטחון","Fourth Treatise on Trust"],["שער ייחוד המעשה","Fifth Treatise on Devotion"],["שער הכניעה","Sixth Treatise on Submission"],["שער התשובה","Seventh Treatise on Repentance"],["שער חשבון הנפש","Eighth Treatise on Examining the Soul"],["שער הפרישות","Ninth Treatise on Abstinence"],["שער אהבת ה׳","Tenth Treatise on Devotion to God"]],"peleHe":["אהבה להקדוש ברוך הוא","אהבת עצמו","אהבת הבנים והבנות","אהבת איש ואשה","אהבת לומדי התורה ויראי השם וחושבי שמו","אהבת רעים","אבלות","אמונה","אכילה ושתיה","אמת","אבירות לב","ארץ ישראל","אמן","אחים","אחדות","אפיקורוס","אומנות","אסופה","אורחים","אונאה","אונס","ברכות","בית הכנסת","בית המדרש","בזיון","בן","בת","בטלה","בכיה","בנין","בורח","בוחר","בחור","בשר","בשורה","בעלי חיים","בכורים","ברורים","בר לבב","ברור","בדיקה","גאולה","גאוה","גזל","גניבה","גבורה","גלות","גלגול","גר","גדול","גדר","גוי","גילה","גוף","גלוח","גירסא","גערה","דבקות","דרך","דרך ארץ","דעת","דבור","דרושים","דובב שפתי ישנים","דבר","דחיה","דינים","דפוס","דירה","דאגה","דברי חכמים","דרשן","הילול","הלבנה","הליכה","הקפדה","התבודדות","הכנה","הבטחה","הודאה","הידור","השכמה","הצלה","הסכמה","השתדלות","הנאה","הנהגה","הגדה","התעוררות","הוראה","הדלקה","הן צדק","הסח דעת","הכאה","הלבשה","הלואה","הלכה","הרשאה","השואה","ותרנות","ודוי","ויהי נועם","ועד","זכירה","זנות","זהירות","זריזות","זכיה","זווג","זוהר","זודא","זולל וסובא","זריעה","זלזול","זמירות","זקן","זכרונות","חשק וחבה","חנופה","חידוש","חלוש","חלום","חמדה","חיזוק","חינוך","חברה","חברותא","חיים","חוזק","חוכמה","חילול השם","חולה","חסד","חשדא","חסידות","חמיו וחמותו","חמץ","חשבון","חשיבות","חשוד","חתן","חוב","חוסר","חרטה","חול המועד","חורבן בית המקדש","חן","חרש","טומאה","טעם","טרדא","טבע","טרף","טורח","טענות","טעות","טיול","טהרה","יראה","ידיעה","יצר","יתרון","ירידה","יאוש","יגיעה","יין","ילדות","ימין","יונקי שדים","יסוד","יועץ","יופי","ישיבה","יוהרא","ישרות","יסורין","ימים טובים","ישוב הדעת","כבוד אב ואם","כבוד חכמים","כבוד הבריות","כעס","כוונה","כבוד","כיפור","כופה","כהן","כפוי טובה","כוויה","כלב","כניעה","כסף","כינוי","כלה בבית אביה","כתיבה","כיליות","כללות א","כללות ב","לימוד","לב","לשון הרע","ליצנות","לשמה","לווה","לעז","לויה","לבישה","מלכות","מורא","מנוחה","מצוות","מזכה","מותרות","מהירות מיתון","מעשר","מוסר","מחשבה","משא ומתן","מנהג","מידות","מחלוקת","מובחר","משפט ודין","מתן","ממשלה","מילה","מכירה","ממון","ממונה","מונה","מנחה","מניעה","מסירה","מרירות","מתיקות","מלמדי תינוקות","מיתה","נחמה","נדיבות","נקימה ונטירה","נטילת ידים","נבלות הפה","נקיות","נאמנות","נדה","נדרים","נס","נסיון","נסך","נפש","ניצוח","נשים","נפילת אפים","נפלאות","נר שבת ונר חנוכה","סבלנות","סוכה","סייג","סוד","ספר","סנגוריא","סליחות","סעודה","ספינה","ספק","סרבנות","סתר","סגולה","סיפוק","עבודת השם","ענוה","עשירות","עונה","עיון","עניה","עצלות","עצבות","עזות","עמל","עבירה","עזר","עונג","עונש","עצה","ערב","ערך","עניות","עין הרע","עריות","עדות","עצרת","פרישות","פריה ורביה","פורים","פסח","פרנסה","פחד","פרשיות","פדות","פה","צדקה","צעקה","צוואה","צניעות","ציצית","צער","צרה","ציור","צפוי","ציבור","קדושה","קימה","קריאה","קינאה","קללה","קבלה","קביעות","קביעות צדקה","קרובים","קנס","קבורה","קורבנות","קריאת שמע","קול","קרי","רחמנות","ראיה","רדיפה","ריצה","ריבית","ראש השנה","רבים","רגילות","רינה","רפואה","רופא","רחיצה","רבו","רצון","רועה","שלום","שנאה","שבת","שינה","שיחה","שקר","שתיה","שפלות","שתיקה","שמחה","שבועה","שם שמים","שקידה","שכן","שיר","שליח צבור","שמירה","שחוק","שמיעה","שק","שבח","שוגג","שופטים ושוטרים","שוחט","שמש","שכר שכיר","שכר מצוה","שכל","שם טוב","שיעור","שש","ששה","שררה","שואל","שואל כענין","תפילין","תורה","תמימות","תלמידים","תענית","תשובה","תוכחה","תיקון","תחבולות","תלמידי חכמים","תהלים","תולדות","תוספת","תוקע","תשעה באב","תשועה"],"mesillatHe":["בביאור כלל חובת האדם בעולמו","בביאור מדת הזהירות","בחלקי הזהירות","בדרך קנית הזהירות","במפסידי הזהירות וההרחקה מהם","בביאור מדת הזריזות","בחלקי הזריזות","בדרך קנית הזריזות","במפסידי הזריזות והרחקתם","בביאור מדת הנקיות","בפרטי מדת הנקיות","בדרך קנית הנקיות וההרחקה ממפסידיה","בביאור מדת הפרישות","בחלקי הפרישות","בדרך קנית הפרישות וההרחקה ממפסידיה","בביאור מדת הטהרה","בדרך קנית הטהרה וההרחקה ממפסידיה","בביאור מדת החסידות","בביאור חלקי החסידות","במשקל החסידות","בדרך קנית החסידות וההרחקה ממפסידיה","בביאור מדת הענוה וחלקיה","בדרך קנית הענוה וההרחקה ממפסידיה","ביראת החטא וחלקיה","בדרך קנית היראה","בביאור מדת הקדושה ודרך קנייתה"]};
    function namedBook(id, he, icon, min, unit, units, prefix, items) {
      return {
        id: id, he: he, icon: icon, min: min, unit: unit, units: units,
        count: items.length,
        ref: function (i) { return prefix + items[i][1]; },
        label: function (i) { return items[i][0]; }
      };
    }
    // שישה סדרי משנה — רשימה שטוחה של כל 525 הפרקים (אומת מול Sefaria)
    var MISH_FLAT = [];
    SPD.mishnah.forEach(function (t) {
      for (var c = 1; c <= t[2]; c++) MISH_FLAT.push([t[0] + " פרק " + c, t[1] + " " + c]);
    });
    // שמירת הלשון + חפץ חיים — כל הסעיפים לפי מבנה הספר באתר
    var SHMIRA = [
      ["הקדמת החפץ חיים", "Chafetz Chaim, Preface"],
      ["פתיחה — לאוין", "Chafetz Chaim, Introduction to the Laws of the Prohibition of Lashon Hara and Rechilut, Negative Commandments"],
      ["פתיחה — עשין", "Chafetz Chaim, Introduction to the Laws of the Prohibition of Lashon Hara and Rechilut, Positive Commandments"],
      ["פתיחה — ארורין", "Chafetz Chaim, Introduction to the Laws of the Prohibition of Lashon Hara and Rechilut, Curses"]
    ];
    (function () {
      var i;
      for (i = 1; i <= 10; i++) SHMIRA.push(["הלכות לשון הרע — כלל " + i, "Chafetz Chaim, Part One, The Prohibition Against Lashon Hara, Principle " + i]);
      for (i = 1; i <= 9; i++) SHMIRA.push(["הלכות רכילות — כלל " + i, "Chafetz Chaim, Part Two, The Prohibition Against Rechilut, Principle " + i]);
      SHMIRA.push(["שמירת הלשון — הקדמה", "Shemirat HaLashon, Book I, Introduction"]);
      for (i = 1; i <= 17; i++) SHMIRA.push(["שער הזכירה — פרק " + i, "Shemirat HaLashon, Book I, The Gate of Remembering." + i]);
      for (i = 1; i <= 17; i++) SHMIRA.push(["שער התבונה — פרק " + i, "Shemirat HaLashon, Book I, The Gate of Discerning." + i]);
      for (i = 1; i <= 10; i++) SHMIRA.push(["שער התורה — פרק " + i, "Shemirat HaLashon, Book I, The Gate of Torah." + i]);
      for (i = 1; i <= 30; i++) SHMIRA.push(["חלק שני — פרק " + i, "Shemirat HaLashon, Book II." + i]);
    })();
    // כף החיים: בסימני סת"ם הטקסט ב-Sefaria הוא stub שמפנה ל"קול יעקב" של אותו מחבר —
    // מפנים ישירות; יו"ד קיים רק א-קיט + ער-רפא, רפח, רצ, רצא (רפ"ב ריק בשני המקורות) → אחרת null
    var KY_OC = [32, 33, 34, 35, 36, 39, 42];
    var KY_YD = [270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 288, 290, 291];
    function kafOC(i) { var n = i + 1; return KY_OC.indexOf(n) >= 0 ? "Kol Yaakov, Orach Chayim " + n : "Kaf HaChayim on Shulchan Arukh, Orach Chayim " + n; }
    function kafYD(i) { var n = i + 1; return n <= 119 ? "Kaf HaChayim on Shulchan Arukh, Yoreh De'ah " + n : (KY_YD.indexOf(n) >= 0 ? "Kol Yaakov, Yoreh De'ah " + n : null); }
    var CATALOG = [
      { id: "tehillim", he: "תהילים", icon: "📖", count: 150, unit: "פרק", units: "פרקים", min: 3, ref: function (i) { return "Psalms " + (i + 1); },
        cm: [
          { he: "רש\"י", ref: function (i) { return "Rashi on Psalms " + (i + 1); } },
          { he: "מצודת דוד", ref: function (i) { return "Metzudat David on Psalms " + (i + 1); } }
        ] },
      { id: "bih-y1", he: "בן איש חי — שנה ראשונה", icon: "📗", count: SPD.bih1.length, unit: "פרשה", units: "פרשות", min: 25,
        ref: function (i) { return "Ben Ish Hai, Halachot 1st Year, " + SPD.bih1[i][1]; },
        label: function (i) { return SPD.bih1[i][0]; } },
      { id: "bih-y2", he: "בן איש חי — שנה שניה", icon: "📙", count: SPD.bih2.length, unit: "פרשה", units: "פרשות", min: 25,
        ref: function (i) { return "Ben Ish Hai, Halachot 2nd Year, " + SPD.bih2[i][1]; },
        label: function (i) { return SPD.bih2[i][0]; } },
      { id: "mishnah", he: "שישה סדרי משנה", icon: "📚", count: MISH_FLAT.length, unit: "פרק", units: "פרקים", min: 8,
        ref: function (i) { return MISH_FLAT[i][1]; },
        label: function (i) { return MISH_FLAT[i][0]; },
        cm: [
          { he: "ברטנורא", ref: function (i) { return "Bartenura on " + MISH_FLAT[i][1]; } },
          { he: "רמב\"ם", ref: function (i) { return "Rambam on " + MISH_FLAT[i][1]; } },
          { he: "עיקר תוספות יום טוב", ref: function (i) { return "Ikar Tosafot Yom Tov on " + MISH_FLAT[i][1]; } }
        ] },
      { id: "pirkei-avot", he: "פרקי אבות", icon: "🕊️", count: 6, unit: "פרק", units: "פרקים", min: 10, ref: function (i) { return "Pirkei Avot " + (i + 1); },
        cm: [
          { he: "ברטנורא", ref: function (i) { return "Bartenura on Pirkei Avot " + (i + 1); } }
        ] },
      { id: "mishlei", he: "משלי", icon: "🦉", count: 31, unit: "פרק", units: "פרקים", min: 5, ref: function (i) { return "Proverbs " + (i + 1); },
        cm: [
          { he: "רש\"י", ref: function (i) { return "Rashi on Proverbs " + (i + 1); } },
          { he: "מצודת דוד", ref: function (i) { return "Metzudat David on Proverbs " + (i + 1); } }
        ] },
      { id: "mesillat", he: "מסילת ישרים", icon: "🛤️", count: 26, unit: "פרק", units: "פרקים", min: 12,
        ref: function (i) { return "Mesillat Yesharim " + (i + 1); },
        label: function (i) { return "פרק " + (i + 1) + " — " + SPD.mesillatHe[i]; } },
      namedBook("chovot", "חובות הלבבות", "❤️", 40, "שער", "שערים", "Duties of the Heart, ", SPD.chovot),
      namedBook("midot", "ספר המידות", "🌿", 5, "ערך", "ערכים", "Sefer HaMiddot, ", SPD.midot),
      { id: "pele", he: "פלא יועץ", icon: "💎", count: SPD.peleHe.length, unit: "ערך", units: "ערכים", min: 6,
        ref: function (i) { return "Pele Yoetz " + (i + 1); },
        label: function (i) { return SPD.peleHe[i]; } },
      { id: "tomer", he: "תומר דבורה", icon: "🌳", count: 10, unit: "פרק", units: "פרקים", min: 12, ref: function (i) { return "Tomer Devorah " + (i + 1); } },
      { id: "tanya-la", he: "תניא — ליקוטי אמרים", icon: "📘", count: 53, unit: "פרק", units: "פרקים", min: 10, ref: function (i) { return "Tanya, Part I; Likutei Amarim, Chapter " + (i + 1); } },
      { id: "orchot", he: "אורחות צדיקים", icon: "🌿", count: 28, unit: "שער", units: "שערים", min: 15, ref: function (i) { return i === 0 ? "Orchot Tzadikim, Introduction" : "Orchot Tzadikim " + i; } },
      { id: "shmirat", he: "שמירת הלשון וחפץ חיים", icon: "🗣️", count: SHMIRA.length, unit: "סעיף", units: "סעיפים", min: 12,
        ref: function (i) { return SHMIRA[i][1]; },
        label: function (i) { return SHMIRA[i][0]; } },
      namedBook("likutei", "ליקוטי הלכות", "🌊", 20, "הלכה", "הלכות", "Likutei Halakhot, ", SPD.likutei),
      { id: "moharan", he: "ליקוטי מוהר\"ן", icon: "🔥", count: 411, unit: "תורה", units: "תורות", min: 10,
        ref: function (i) { return i < 286 ? "Likutei Moharan " + (i + 1) : "Likutei Moharan, Tinyana " + (i - 285); },
        label: function (i) { return i < 286 ? "תורה " + (i + 1) + " (קמא)" : "תורה " + (i - 285) + " (תניינא)"; } },
      namedBook("kedushat", "קדושת לוי", "🕎", 20, "פרשה", "פרשות", "Kedushat Levi, ", SPD.kedushat),
      namedBook("noam", "נועם אלימלך", "✨", 25, "פרשה", "פרשות", "Noam Elimelekh, ", SPD.noam),
      namedBook("menorat", "מנורת המאור", "🕯️", 12, "פרק", "פרקים", "Menorat HaMaor, ", SPD.menorat),
      // ⚠ ה-cm נשמרים לפי אינדקס (lux_plan_cm) — מוסיפים תמיד בסוף המערך, לא באמצע
      { id: "sa-oc", he: "שולחן ערוך — אורח חיים", icon: "📜", count: 697, unit: "סימן", units: "סימנים", min: 6, ref: function (i) { return "Shulchan Arukh, Orach Chayim " + (i + 1); },
        cm: [
          { he: "משנה ברורה", ref: function (i) { return "Mishnah Berurah " + (i + 1); } },
          { he: "באר היטב", ref: function (i) { return "Ba'er Hetev on Shulchan Arukh, Orach Chayim " + (i + 1); } },
          { he: "ביאור הלכה", ref: function (i) { return "Biur Halacha " + (i + 1); } },
          { he: "כף החיים", ref: kafOC }
        ] },
      { id: "sa-yd", he: "שולחן ערוך — יורה דעה", icon: "📜", count: 403, unit: "סימן", units: "סימנים", min: 6, ref: function (i) { return "Shulchan Arukh, Yoreh Deah " + (i + 1); },
        cm: [
          { he: "באר היטב", ref: function (i) { return "Ba'er Hetev on Shulchan Arukh, Yoreh Deah " + (i + 1); } },
          { he: "כף החיים", ref: kafYD }
        ] },
      { id: "sa-eh", he: "שולחן ערוך — אבן העזר", icon: "📜", count: 178, unit: "סימן", units: "סימנים", min: 6, ref: function (i) { return "Shulchan Arukh, Even HaEzer " + (i + 1); },
        cm: [
          { he: "באר היטב", ref: function (i) { return "Ba'er Hetev on Shulchan Arukh, Even HaEzer " + (i + 1); } }
        ] },
      { id: "sa-cm", he: "שולחן ערוך — חושן משפט", icon: "📜", count: 427, unit: "סימן", units: "סימנים", min: 6, ref: function (i) { return "Shulchan Arukh, Choshen Mishpat " + (i + 1); },
        cm: [
          { he: "באר היטב", ref: function (i) { return "Ba'er Hetev on Shulchan Arukh, Choshen Mishpat " + (i + 1); } }
        ] },
      { id: "mb", he: "משנה ברורה", icon: "📖", count: 697, unit: "סימן", units: "סימנים", min: 8, ref: function (i) { return "Mishnah Berurah " + (i + 1); },
        cm: [
          { he: "שולחן ערוך", ref: function (i) { return "Shulchan Arukh, Orach Chayim " + (i + 1); } },
          { he: "ביאור הלכה", ref: function (i) { return "Biur Halacha " + (i + 1); } },
          { he: "באר היטב", ref: function (i) { return "Ba'er Hetev on Shulchan Arukh, Orach Chayim " + (i + 1); } },
          { he: "כף החיים", ref: kafOC }
        ] }
    ];
    function unitsOf(bk) { return bk.units || bk.unit + "ים"; }
    function bookOf(id) {
      for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
      return null;
    }
    function plans() { return jget(KEY, []); }
    function savePlans(p) { jset(KEY, p); }
    // תאריך מקומי (לא UTC) — כדי ש"היום" יתחלף בחצות המקומית
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    function daysLeft(pl, bk) { return Math.max(0, Math.ceil((bk.count - pl.done) / pl.perDay)); }
    function flatParas(src) {
      var flat = [];
      (function walk(x) {
        if (x == null) return;
        if (typeof x === "string") { if (x.trim()) flat.push(x); return; }
        if (Array.isArray(x)) x.forEach(walk);
      })(src);
      return flat;
    }
    function fetchRefText(ref, cb) {
      fetch("https://www.sefaria.org/api/v3/texts/" + encodeURIComponent(ref) + "?version=hebrew")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var flat = flatParas(data && data.versions && data.versions[0] ? data.versions[0].text : null);
          if (flat.length) return cb(flat);
          // חלק מהספרים (בן איש חי) חוזרים ריקים ב-v3 — ננסה את ה-API הישן
          return fetch("https://www.sefaria.org/api/texts/" + encodeURIComponent(ref) + "?pad=0&lang=he")
            .then(function (r2) { return r2.json(); })
            .then(function (d2) {
              var f2 = flatParas(d2 && d2.he);
              cb(f2.length ? f2 : null);
            });
        })
        .catch(function () { cb(null); });
    }

    /* ── קורא הלימוד היומי ── */
    function openPlanReader(planId) {
      var old = document.getElementById("lux-plan-reader");
      if (old) {
        // ghost-tap בנייד: נגיעה כפולה מיד אחרי הפתיחה נסגרה מיידית ונראתה כהבהוב
        if (Date.now() - (old.__luxOpenedAt || 0) < 600) return;
        luxModalClose("lux-plan-reader");
        return;
      }
      var pl = null;
      plans().forEach(function (p) { if (p.id === planId) pl = p; });
      if (!pl) return;
      var bk = bookOf(pl.bookId);
      if (!bk) return;
      var from = pl.done;
      var to = Math.min(bk.count, pl.done + pl.perDay);
      var doneToday = pl.lastDone === todayStr() && pl.done > 0;
      // אם כבר סיים היום — מציגים את המנה של היום (שכבר הושלמה)
      if (doneToday) { from = Math.max(0, pl.done - pl.perDay); to = pl.done; }
      var dayNum = Math.floor(from / pl.perDay) + 1;
      var totalDays = Math.ceil(bk.count / pl.perDay);
      var ov = document.createElement("div");
      ov.id = "lux-plan-reader";
      ov.__luxOpenedAt = Date.now();
      ov.innerHTML =
        '<div class="lux-sel-head">' +
          '<button type="button" class="lux-sel-close" aria-label="סגור">✕</button>' +
          '<div class="lux-sel-titles">' +
            '<h2>' + bk.icon + " " + esc(bk.he) + "</h2>" +
            '<p>יום ' + dayNum + " מתוך " + totalDays + " · " + esc(bk.unit) + " " + (from + 1) + (to > from + 1 ? "–" + to : "") + "</p>" +
          "</div>" +
        "</div>" +
        '<div id="lux-pl-area" class="lux-sel-area holy-text-style"><p style="text-align:center;color:#94a3b8;padding:2rem;">טוען את הלימוד של היום...</p></div>' +
        '<div class="lux-sel-foot">' +
          '<button type="button" id="lux-pl-fminus" class="lux-sel-fbtn" aria-label="הקטן כתב">−</button>' +
          '<button type="button" id="lux-pl-fplus" class="lux-sel-fbtn" aria-label="הגדל כתב">+</button>' +
          '<span class="lux-sel-foot-sep"></span>' +
          '<button type="button" class="lux-sel-scroll-btn" onclick="window._toggleAutoScroll(\'#lux-pl-area\', this)" aria-label="התחל גלילה אוטומטית">▶</button>' +
          '<button type="button" class="auto-scroll-speed-btn lux-sel-speed" onclick="window._cycleAutoScrollSpeed(this)" aria-label="מהירות גלילה">1x</button>' +
          '<button type="button" id="lux-pl-done" class="lux-tr-done">' + (doneToday ? "✓ הושלם היום" : "✓ למדתי — עברו ליום הבא") + "</button>" +
        "</div>";
      document.body.appendChild(ov);
      luxModalOpen("lux-plan-reader");
      var area = ov.querySelector("#lux-pl-area");
      // גודל אחיד לכל האתר — אותו מפתח ואותו בסיס (25px ב-100%) כמו בכל הקוראים
      var fs = parseInt(localStorage.getItem("moadim_prayer_font_size") || "100", 10) || 100;
      if (fs < 60 || fs > 200) fs = 100;
      function applyFs() { area.style.setProperty("font-size", (fs / 100) * 25 + "px", "important"); try { localStorage.setItem("moadim_prayer_font_size", fs); } catch (_) {} if (window._btnToastVal && applyFs._user) window._btnToastVal("גודל כתב: " + fs + "%"); applyFs._user = false; }
      applyFs();
      ov.querySelector("#lux-pl-fplus").addEventListener("click", function () { fs = Math.min(200, fs + 10); applyFs._user = true; applyFs(); });
      ov.querySelector("#lux-pl-fminus").addEventListener("click", function () { fs = Math.max(60, fs - 10); applyFs._user = true; applyFs(); });
      ov.querySelector(".lux-sel-close").addEventListener("click", function () { luxModalClose("lux-plan-reader"); });
      var doneBtn = ov.querySelector("#lux-pl-done");
      if (doneToday) doneBtn.classList.add("lux-tr-done-on");
      doneBtn.addEventListener("click", function () {
        var all = plans();
        var cur = null;
        all.forEach(function (p) { if (p.id === planId) cur = p; });
        if (!cur) return;
        // לחיצה שנייה — ביטול הסימון של היום וחזרה למצב הקודם
        if (cur.lastDone === todayStr() && cur.done > 0) {
          cur.done = (typeof cur.prevDone === "number") ? cur.prevDone : Math.max(0, cur.done - cur.perDay);
          cur.streak = Math.max(0, (cur.streak || 0) - 1);
          cur.lastDone = null;
          delete cur.prevDone;
          savePlans(all);
          unrecordStudyDay();
          doneBtn.classList.remove("lux-tr-done-on");
          doneBtn.textContent = "✓ למדתי — עברו ליום הבא";
          if (typeof window.showToast === "function") {
            window.showToast("הסימון בוטל — המנה של היום מחכה לכם", "info", 2400);
          }
          renderRow();
          return;
        }
        cur.prevDone = cur.done;
        cur.done = Math.min(bk.count, cur.done + cur.perDay);
        cur.lastDone = todayStr();
        cur.streak = (cur.streak || 0) + 1;
        savePlans(all);
        recordStudyDay();
        doneBtn.classList.add("lux-tr-done-on");
        doneBtn.textContent = "✓ הושלם היום";
        luxConfetti();
        if (typeof window.showToast === "function") {
          if (cur.done >= bk.count) window.showToast("🎉 מזל טוב! סיימתם את " + bk.he + " כולו!", "success", 4000);
          else window.showToast("🎯 כל הכבוד! נותרו " + daysLeft(cur, bk) + " ימים לסיום " + bk.he, "success", 3000);
        }
        renderRow();
      });
      // ── נושאי כלים — צ'יפים להדלקה/כיבוי, כמו בקורא הספרים הרגיל ──
      var CM_KEY = "lux_plan_cm";
      var cmAll = jget(CM_KEY, {});
      var cmOn = (cmAll[bk.id] || []).slice();
      if (bk.cm && bk.cm.length) {
        var cmBar = document.createElement("div");
        cmBar.className = "lux-pl-cmbar";
        cmBar.innerHTML = '<span class="lux-pl-cmbar-lbl">נושאי כלים:</span>' +
          bk.cm.map(function (c, ci) {
            return '<button type="button" class="lux-pl-cmchip' + (cmOn.indexOf(ci) >= 0 ? " lux-pl-cmchip-on" : "") + '" data-ci="' + ci + '">' + esc(c.he) + "</button>";
          }).join("");
        area.insertAdjacentElement("beforebegin", cmBar);
        cmBar.addEventListener("click", function (e) {
          var b = e.target.closest("[data-ci]");
          if (!b) return;
          var ci = parseInt(b.getAttribute("data-ci"), 10);
          var at = cmOn.indexOf(ci);
          if (at >= 0) cmOn.splice(at, 1); else cmOn.push(ci);
          b.classList.toggle("lux-pl-cmchip-on", at < 0);
          cmAll[bk.id] = cmOn;
          jset(CM_KEY, cmAll);
          renderContent();
        });
      }

      // טעינת היחידות של היום — ברצף, עם כותרת לכל יחידה + נושאי כלים פעילים
      var loadToken = 0;
      function renderContent() {
        var token = ++loadToken;
        var html = "";
        var idx = from;
        area.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:2rem;">טוען את הלימוד של היום...</p>';
        function loadCms(i, doneCb) {
          var list = [];
          (bk.cm || []).forEach(function (c, k) { if (cmOn.indexOf(k) >= 0) list.push(c); });
          (function next(k) {
            if (token !== loadToken) return;
            if (k >= list.length) return doneCb();
            var cmRef = list[k].ref(i);
            if (!cmRef) return next(k + 1);   // אין כיסוי לסימן זה (כף החיים יו"ד מעבר לקי"ט)
            fetchRefText(cmRef, function (paras) {
              if (token !== loadToken) return;
              if (paras && paras.length) {
                html += '<div class="lux-pl-cm"><div class="lux-pl-cm-t">' + esc(list[k].he) + "</div>" +
                  paras.map(function (p) { return '<p class="lux-pl-cm-p">' + p + "</p>"; }).join("") + "</div>";
              }
              next(k + 1);
            });
          })(0);
        }
        function loadNext() {
          if (token !== loadToken) return;
          if (idx >= to) {
            area.innerHTML = html + '<div class="lux-sel-credit">✦<br>המקור: ספריית Sefaria.org (רישיון פתוח)<br>לימוד פורה! 🙌</div>';
            area.scrollTop = 0;
            return;
          }
          var i = idx++;
          fetchRefText(bk.ref(i), function (paras) {
            if (token !== loadToken) return;
            html += '<h3 class="lux-pl-unit">' + esc(bk.label ? bk.label(i) : bk.unit + " " + (i + 1)) + "</h3>";
            if (paras) html += paras.map(function (p) { return '<p class="lux-sel-para">' + p + "</p>"; }).join("");
            else html += '<p style="color:#b45309;text-align:center;">לא הצלחנו לטעון חלק זה — בדקו את החיבור.</p>';
            loadCms(i, loadNext);
          });
        }
        loadNext();
      }
      renderContent();
    }
    window.luxOpenPlanReader = openPlanReader;

    /* סולם משכי סיום — מדרגות נדיבות, משבוע ועד 3 שנים */
    var DUR = [7, 10, 14, 21, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 182, 210, 240, 270, 300, 330, 365, 425, 485, 545, 605, 665, 730, 790, 850, 910, 1000, 1095];
    function fmtMin(m) {
      if (m < 60) return m + " דקות";
      if (m === 60) return "שעה";
      if (m === 90) return "שעה וחצי";
      if (m === 120) return "שעתיים";
      if (m === 180) return "3 שעות";
      if (m < 120) return "שעה ו־" + (m - 60) + " דק'";
      return "שעתיים ו־" + (m - 120) + " דק'";
    }
    function fmtDur(d) {
      if (d === 7) return "שבוע";
      if (d === 14) return "שבועיים";
      if (d === 21) return "3 שבועות";
      if (d < 30) return d + " ימים";
      if (d === 30) return "חודש";
      if (d === 45) return "חודש וחצי";
      if (d === 60) return "חודשיים";
      if (d === 182) return "חצי שנה";
      if (d === 365) return "שנה";
      if (d === 545) return "שנה וחצי";
      if (d === 730) return "שנתיים";
      if (d === 1095) return "3 שנים";
      if (d < 360) return Math.round(d / 30.4) + " חודשים";
      var months = Math.round((d - 365) / 30.4);
      if (d < 700) return months > 0 ? "שנה ו־" + months + " חודשים" : "שנה";
      var m2 = Math.round((d - 730) / 30.4);
      return m2 > 0 ? "שנתיים ו־" + m2 + " חודשים" : "שנתיים";
    }
    /* ── תגי התמדה בלימוד — רצף יומי; מתאפסים בכל תחילת חצי שנה ── */
    var STREAK_KEY = "lux_plan_streak_v1";
    function halfYearId() {
      var d = new Date();
      return d.getFullYear() + (d.getMonth() < 6 ? "H1" : "H2");
    }
    function planStreak() {
      var s = jget(STREAK_KEY, { last: null, count: 0, period: halfYearId() });
      if (s.period !== halfYearId()) s = { last: null, count: 0, period: halfYearId() };
      return s;
    }
    var STUDY_BADGES = [
      { at: 3, i: "🎯", t: "3 ימי התמדה בלימוד" },
      { at: 7, i: "🥉", t: "שבוע התמדה בלימוד" },
      { at: 14, i: "🏅", t: "שבועיים התמדה בלימוד" },
      { at: 30, i: "🥈", t: "חודש התמדה בלימוד" },
      { at: 60, i: "🥇", t: "חודשיים התמדה בלימוד" },
      { at: 100, i: "🏆", t: "100 ימי התמדה בלימוד" },
      { at: 150, i: "💎", t: "150 ימי התמדה בלימוד" }
    ];
    // נצרך גם למסך ההישגים (סעיף 31) — לכן נחשף על window
    window._luxStudyBadges = function () {
      var c = planStreak().count;
      return STUDY_BADGES.map(function (b) { return { i: b.i, t: b.t + " (החצי־שנה הנוכחי)", on: c >= b.at }; });
    };
    function badgePopup(b) {
      var el = document.createElement("div");
      el.className = "lux-badge-pop";
      el.innerHTML =
        '<div class="lux-badge-pop-in">' +
          '<span class="lux-badge-ico">' + b.i + "</span>" +
          "<h3>🎉 תג חדש נפתח!</h3>" +
          "<p>" + b.t + "</p>" +
          '<small>התגים מתאפסים בכל תחילת חצי שנה — המשיכו להתמיד 💪</small>' +
        "</div>";
      document.body.appendChild(el);
      try { if (typeof luxConfetti === "function") luxConfetti(); } catch (e) {}
      setTimeout(function () {
        el.classList.add("lux-badge-pop-out");
        setTimeout(function () { el.remove(); }, 500);
      }, 4200);
      el.addEventListener("click", function () { el.remove(); });
    }
    function recordStudyDay() {
      var s = planStreak();
      var today = todayStr();
      if (s.last === today) return;
      var y = new Date(Date.now() - 86400000);
      var yst = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
      var before = s.count;
      s.count = (s.last === yst) ? s.count + 1 : 1;
      s.last = today;
      s.period = halfYearId();
      jset(STREAK_KEY, s);
      STUDY_BADGES.forEach(function (b) {
        if (before < b.at && s.count >= b.at) setTimeout(function () { badgePopup(b); }, 800);
      });
    }
    // ביטול יום הלימוד של היום (לחיצה שנייה על "למדתי") — מחזיר את הרצף לאחור
    function unrecordStudyDay() {
      var s = planStreak();
      if (s.last !== todayStr()) return;
      var y = new Date(Date.now() - 86400000);
      var yst = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
      s.count = Math.max(0, s.count - 1);
      s.last = s.count > 0 ? yst : null;
      jset(STREAK_KEY, s);
    }

    /* ── אשף הוספת סדר לימוד ── */
    function openWizard() {
      var selBook = null, mode = "minutes", minutes = 10, targetDays = 30;
      var ov = luxSheet("lux-plan-wizard",
        '<h3 class="lux-sheet-title">🎯 סדר לימוד אישי חדש</h3>' +
        '<p class="lux-sheet-note">בחרו ספר, קבעו קצב — והאתר יחלק לכם אותו לימים ויעקוב אחרי ההתקדמות</p>' +
        '<h4 class="lux-pw-step">1️⃣ באיזה ספר נלמד?</h4>' +
        '<div class="lux-pw-books">' + CATALOG.map(function (b) {
          return '<button type="button" class="lux-pw-book" data-id="' + b.id + '">' + b.icon + " " + esc(b.he) + '<small>' + b.count + " " + esc(unitsOf(b)) + "</small></button>";
        }).join("") + "</div>" +
        '<h4 class="lux-pw-step">2️⃣ באיזה קצב?</h4>' +
        '<div style="display:flex;gap:0.4rem;margin-bottom:0.5rem;">' +
          '<button type="button" id="lux-pw-m-min" class="lux-sheet-secondary lux-pw-mode lux-pw-mode-on" style="flex:1;">⏱️ לפי דקות ביום</button>' +
          '<button type="button" id="lux-pw-m-days" class="lux-sheet-secondary lux-pw-mode" style="flex:1;">🗓️ לפי תאריך יעד</button>' +
        "</div>" +
        '<div id="lux-pw-min-box">' +
          '<label class="lux-dt-lbl">כמה דקות ביום נוח לכם ללמוד? <span style="font-weight:400;">(החליקו לבחירה — עד 3 שעות)</span></label>' +
          '<div class="lux-pw-slider-row">' +
            '<input type="range" id="lux-pw-min" min="5" max="180" step="5" value="10" class="lux-pw-range" aria-label="דקות לימוד ביום">' +
            '<span id="lux-pw-min-lbl" class="lux-pw-slider-val">10 דקות</span>' +
          "</div>" +
        "</div>" +
        '<div id="lux-pw-days-box" style="display:none;">' +
          '<label class="lux-dt-lbl">תוך כמה זמן תרצו לסיים? <span style="font-weight:400;">(החליקו לבחירה — עד 3 שנים)</span></label>' +
          '<div class="lux-pw-slider-row">' +
            '<input type="range" id="lux-pw-days" min="0" max="' + (DUR.length - 1) + '" step="1" value="4" class="lux-pw-range" aria-label="משך הלימוד עד הסיום">' +
            '<span id="lux-pw-days-lbl" class="lux-pw-slider-val">' + fmtDur(DUR[4]) + "</span>" +
          "</div>" +
        "</div>" +
        '<div id="lux-pw-summary" class="lux-dt-out" style="display:none;"></div>' +
        '<div class="lux-sheet-actions">' +
          '<button type="button" class="lux-sheet-primary" id="lux-pw-create" disabled style="opacity:0.5;">✨ צרו לי סדר לימוד</button>' +
          '<button type="button" class="lux-sheet-cancel">ביטול</button>' +
        "</div>");
      if (!ov) return;
      function calc() {
        if (!selBook) return null;
        var perDay, total;
        if (mode === "minutes") {
          perDay = Math.max(1, Math.round(minutes / selBook.min));
          total = Math.ceil(selBook.count / perDay);
        } else {
          perDay = Math.max(1, Math.ceil(selBook.count / targetDays));
          total = Math.ceil(selBook.count / perDay);
        }
        return { perDay: perDay, totalDays: total, estMin: perDay * selBook.min };
      }
      function repaint() {
        var sum = ov.querySelector("#lux-pw-summary");
        var btn = ov.querySelector("#lux-pw-create");
        var c = calc();
        if (!c) { sum.style.display = "none"; btn.disabled = true; btn.style.opacity = "0.5"; return; }
        var end = new Date(Date.now() + c.totalDays * 86400000);
        sum.style.display = "block";
        sum.innerHTML =
          '<div class="lux-dt-big">📋 התוכנית שלכם</div>' +
          "בכל יום: <b>" + c.perDay + " " + esc(c.perDay > 1 ? unitsOf(selBook) : selBook.unit) + "</b> (כ־" + c.estMin + " דקות)<br>" +
          "סיום בעוד: <b>" + c.totalDays + " ימים</b> — בסביבות " + end.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }) + " בע\"ה";
        btn.disabled = false;
        btn.style.opacity = "1";
      }
      ov.querySelectorAll(".lux-pw-book").forEach(function (b) {
        b.addEventListener("click", function () {
          selBook = bookOf(b.getAttribute("data-id"));
          ov.querySelectorAll(".lux-pw-book").forEach(function (x) { x.classList.toggle("lux-pw-book-on", x === b); });
          repaint();
        });
      });
      function setMode(m) {
        mode = m;
        ov.querySelector("#lux-pw-m-min").classList.toggle("lux-pw-mode-on", m === "minutes");
        ov.querySelector("#lux-pw-m-days").classList.toggle("lux-pw-mode-on", m === "days");
        ov.querySelector("#lux-pw-min-box").style.display = m === "minutes" ? "block" : "none";
        ov.querySelector("#lux-pw-days-box").style.display = m === "days" ? "block" : "none";
        repaint();
      }
      ov.querySelector("#lux-pw-m-min").addEventListener("click", function () { setMode("minutes"); });
      ov.querySelector("#lux-pw-m-days").addEventListener("click", function () { setMode("days"); });
      ov.querySelector("#lux-pw-min").addEventListener("input", function () {
        minutes = parseInt(this.value, 10);
        ov.querySelector("#lux-pw-min-lbl").textContent = fmtMin(minutes);
        repaint();
      });
      ov.querySelector("#lux-pw-days").addEventListener("input", function () {
        targetDays = DUR[parseInt(this.value, 10)] || 30;
        ov.querySelector("#lux-pw-days-lbl").textContent = fmtDur(targetDays);
        repaint();
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-plan-wizard"); });
      ov.querySelector("#lux-pw-create").addEventListener("click", function () {
        var c = calc();
        if (!c || !selBook) return;
        var all = plans();
        var pl = {
          id: "pl" + Date.now(),
          bookId: selBook.id,
          perDay: c.perDay,
          done: 0,
          lastDone: null,
          streak: 0,
          created: todayStr()
        };
        all.push(pl);
        savePlans(all);
        // מוודאים שהשמירה באמת הצליחה (אחסון מלא = כישלון שקט) לפני שמבשרים
        var persisted = plans().some(function (p) { return p.id === pl.id; });
        if (!persisted) {
          if (typeof window.showToast === "function") window.showToast("⚠️ השמירה נכשלה — האחסון המקומי מלא. נקו מטמון ונסו שוב", "error", 4000);
          return;
        }
        luxModalClose("lux-plan-wizard");
        renderRow();
        if (typeof window.showToast === "function") window.showToast("🎯 סדר הלימוד נוצר! הלימוד הראשון מחכה לכם", "success", 3000);
        setTimeout(function () { openPlanReader(pl.id); }, 600);
      });
    }
    window.luxOpenPlanWizard = openWizard;

    /* ── הכרטיס בדף הראשי ── */
    function renderRow() {
      var row = document.getElementById("lux-plan-row");
      if (!row) return;
      var all = plans();
      var _st = planStreak().count;
      var inner = '<h3 class="lux-tracks-title">🎯 סדר הלימוד האישי שלי' +
        (_st >= 2 ? ' <span class="lux-plan-streak" title="רצף ימי לימוד — מתאפס כל חצי שנה">🔥 ' + _st + "</span>" : "") + "</h3>";
      if (!all.length) {
        inner += '<button type="button" class="lux-plan-empty" id="lux-plan-add">' +
          '<span class="lux-plan-plus">+</span>' +
          '<span><b>בניית סדר לימוד אישי</b><br><small>בחרו ספר וקצב — והאתר יחלק לכם אותו לימים, יציג בכל יום את הקטע שלכם ויעקוב אחרי ההתקדמות</small></span>' +
        "</button>";
      } else {
        inner += all.map(function (pl) {
          var bk = bookOf(pl.bookId);
          if (!bk) return "";
          var pct = Math.min(100, Math.round((pl.done / bk.count) * 100));
          var left = daysLeft(pl, bk);
          var finished = pl.done >= bk.count;
          var doneToday = pl.lastDone === todayStr();
          return '<div class="lux-plan-card" data-pl="' + pl.id + '">' +
            '<div class="lux-plan-top">' +
              '<span class="lux-plan-name">' + bk.icon + " " + esc(bk.he) + "</span>" +
              '<button type="button" class="lux-plan-del" data-del="' + pl.id + '" title="מחיקת הסדר" aria-label="מחיקה">✕</button>' +
            "</div>" +
            '<div class="lux-plan-bar"><div class="lux-plan-fill" style="width:' + pct + '%;"></div></div>' +
            '<div class="lux-plan-stats">' +
              "<span>" + pl.done + "/" + bk.count + " " + esc(unitsOf(bk)) + " · " + pct + "%</span>" +
              "<span>" + (finished ? "🎉 הושלם!" : "נותרו כ־" + left + " ימים") + "</span>" +
            "</div>" +
            (finished
              ? '<button type="button" class="lux-plan-open" data-open="' + pl.id + '">📖 עיון חוזר</button>'
              : '<button type="button" class="lux-plan-open' + (doneToday ? " lux-plan-open-done" : "") + '" data-open="' + pl.id + '">' + (doneToday ? "✓ הלימוד של היום הושלם" : "📖 ללימוד של היום") + "</button>") +
          "</div>";
        }).join("");
        inner += '<button type="button" class="lux-plan-more" id="lux-plan-add">+ הוספת סדר לימוד נוסף</button>';
      }
      row.innerHTML = inner;
      var add = row.querySelector("#lux-plan-add");
      if (add) add.addEventListener("click", openWizard);
      row.querySelectorAll("[data-open]").forEach(function (b) {
        b.addEventListener("click", function () { openPlanReader(b.getAttribute("data-open")); });
      });
      row.querySelectorAll("[data-del]").forEach(function (b) {
        b.addEventListener("click", function (ev) {
          ev.stopPropagation();
          var id = b.getAttribute("data-del");
          var pl = null;
          plans().forEach(function (p) { if (p.id === id) pl = p; });
          var bk = pl ? bookOf(pl.bookId) : null;
          var ov = luxSheet("lux-plan-delconfirm",
            '<h3 class="lux-sheet-title">🗑️ מחיקת סדר לימוד</h3>' +
            '<p class="lux-sheet-note">האם למחוק את הסדר <b>' + esc(bk ? bk.he : "הזה") + "</b>?" +
              (pl && pl.done
                ? "<br>ההתקדמות שנצברה (" + pl.done + " " + esc(bk ? unitsOf(bk) : "") + ") תימחק לצמיתות."
                : "<br>הפעולה אינה ניתנת לביטול.") + "</p>" +
            '<div class="lux-sheet-actions">' +
              '<button type="button" class="lux-plan-del-yes">🗑️ כן, למחוק</button>' +
              '<button type="button" class="lux-sheet-cancel">ביטול</button>' +
            "</div>");
          if (!ov) return;
          ov.querySelector(".lux-plan-del-yes").addEventListener("click", function () {
            savePlans(plans().filter(function (p) { return p.id !== id; }));
            luxModalClose("lux-plan-delconfirm");
            renderRow();
            if (typeof window.showToast === "function") window.showToast("🗑️ סדר הלימוד נמחק", "info", 2200);
          });
          ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-plan-delconfirm"); });
        });
      });
    }
    function injectRow2() {
      if (document.getElementById("lux-plan-row")) return;
      var anchor = document.getElementById("lux-tracks-row");
      var main = document.getElementById("main-content");
      var nav = main ? main.querySelector("nav") : null;
      if (!anchor && !nav) return;
      var row = document.createElement("section");
      row.id = "lux-plan-row";
      if (anchor) anchor.insertAdjacentElement("afterend", row);
      else nav.insertAdjacentElement("beforebegin", row);
      renderRow();
    }
    // הקורא החדש מקבל גם פס התקדמות
    try { READER_IDS.push("lux-plan-reader"); } catch (e) {}
    injectRow2();
    setTimeout(injectRow2, 2600);
    setTimeout(injectRow2, 4500);
  });

  /* ── 45. הזמנה לסיור מודרך — קופצת פעם אחת בלבד, בכניסה הראשונה ── */
  safe("tourInvite", function () {
    var KEY = "lux_tour_invite_shown";
    try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (tries > 20) { clearInterval(t); return; }
      // מחכים שהדשבורד ייטען, שהסיור יהיה זמין ושאף פופאפ אחר לא פתוח
      var ds = document.getElementById("dashboard-state");
      if (!ds || ds.classList.contains("hidden")) return;
      if (typeof window.luxStartTour !== "function") return;
      if (document.body.style.position === "fixed") return;
      if (document.documentElement.classList.contains("lux-modal-open")) return;
      if (document.querySelector(".lux-sheet-overlay")) return;
      clearInterval(t);
      // מסומן כ"הוצג" ברגע ההצגה — הפופאפ לעולם לא יקפוץ שוב
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      var ov = luxSheet("lux-tour-invite",
        '<h3 class="lux-sheet-title">🧭 נעים להכיר!</h3>' +
        '<p class="lux-sheet-note">זו הפעם הראשונה שלכם כאן — רוצים סיור קצר ומודרך שמראה את כל מה שהאתר יודע לעשות? זמנים, תפילות, ספרים, סדרי לימוד ועוד.</p>' +
        '<div class="lux-sheet-actions">' +
          '<button type="button" class="lux-sheet-primary" id="lux-ti-yes">🧭 כן, קחו אותי לסיור</button>' +
          '<button type="button" class="lux-sheet-cancel" id="lux-ti-no">לא עכשיו</button>' +
        "</div>");
      if (!ov) return;
      ov.querySelector("#lux-ti-yes").addEventListener("click", function () {
        luxModalClose("lux-tour-invite");
        setTimeout(function () {
          try { window.luxStartTour(); } catch (e) {}
        }, 250);
      });
      ov.querySelector("#lux-ti-no").addEventListener("click", function () {
        luxModalClose("lux-tour-invite");
        if (typeof window.showToast === "function") {
          window.showToast('💡 אפשר תמיד לצאת לסיור דרך ⚙️ ההגדרות — "סיור מודרך באתר"', "info", 4800);
        }
      });
    }, 1500);
  });

  /* ── 46. כפתור סגירה עליון בכל פופאפ — ערובה אוניברסלית ──────────
     כל שכבת-על שנפתחת (מודאל, יריעה, קורא) חייבת כפתור X נגיש בחלק
     העליון. פופאפ שכבר יש לו כפתור סגירה עליון משלו — לא נוגעים בו;
     לכל השאר מוזרק X קבוע בפינה השמאלית-עליונה של המסך (מעל הרקע
     המוחשך — לא דורס תוכן), שסוגר דרך מנגנון הסגירה המקורי של הפופאפ. */
  safe("universalCloseX", function () {
    var SEL = '[id$="-modal"], .lux-sheet-overlay, #lux-year-wheel, #lux-nav-editor, ' +
      "#lux-selichot-reader, #lux-track-reader, #lux-plan-reader, #lux-tour-overlay";
    /* שני סטים של זיהוי:
       STRICT — רק כפתור X/חזור מובהק. כפתור כזה בחלק העליון פוטר מהזרקה.
         "סגור"/"ביטול" בתחתית היריעה בכוונה לא כאן — לפי דרישת המשתמש
         חייב X עליון גם כשיש כפתור סגירה תחתון.
       PRIORITY — רשימה רחבה, משמשת רק לבחירת מה ללחוץ כשה-X שלנו נלחץ. */
    var STRICT = '[aria-label*="סגירה"], [aria-label*="סגור"], [aria-label*="חזרה"], [aria-label*="חזור"], ' +
      '[id$="-close"], [class*="-close"], [class*="close-btn"]';
    var STRICT_TEXT = { "✕": 1, "×": 1, "✖": 1, "✖️": 1, "X": 1, "x": 1, "←": 1, "→": 1, "‹": 1, "❮": 1 };
    var PRIORITY = [
      '[aria-label*="סגירה"]', '[aria-label*="סגור"]', '[aria-label*="חזרה"]', '[aria-label*="חזור"]',
      ".lux-sheet-cancel", '[id$="-close"]', '[id*="close"]', '[class*="close"]', '[onclick*="lose"]'
    ];
    var XTEXT = { "✕": 1, "×": 1, "✖": 1, "✖️": 1, "X": 1, "x": 1, "←": 1, "→": 1, "חזור": 1, "חזרה": 1, "סגור": 1, "סגירה": 1, "ביטול": 1 };
    function isVisible(el) {
      if (!el || !el.isConnected) return false;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      var cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity || "1") > 0.05;
    }
    // כל מועמדי הסגירה הנראים בתוך הפופאפ (בלי ה-X שהזרקנו בעצמנו)
    function closeCandidates(modal) {
      var out = [];
      function push(el) {
        if (el.classList.contains("lux-ux")) return;
        if (out.indexOf(el) === -1 && isVisible(el)) out.push(el);
      }
      PRIORITY.forEach(function (sel) {
        try { modal.querySelectorAll(sel).forEach(push); } catch (e) {}
      });
      modal.querySelectorAll("button").forEach(function (b) {
        var t = (b.textContent || "").trim();
        if (XTEXT[t]) push(b);
      });
      return out;
    }
    // כפתור X/חזור מובהק שנמצא כרגע בפועל בחלק העליון של המסך — רק כזה פוטר
    // מהזרקת X. כפתורי "סגור"/"ביטול" בתחתית לא נספרים, וגם כפתור עליון
    // שנגלל החוצה עם התוכן מפסיק להיחשב (ואז מוזרק X קבוע במקומו).
    function inTopBand(el, modal) {
      var panel = modal.firstElementChild || modal;
      var off = el.getBoundingClientRect().top - panel.getBoundingClientRect().top;
      var r = el.getBoundingClientRect();
      // צמוד לראש הפאנל (עד 110px), לא נגלל החוצה מעליו, ונמצא בפועל על המסך
      return off > -10 && off < 110 && r.top >= -5 && r.top < innerHeight;
    }
    function topStrictClose(modal) {
      var found = [];
      try { modal.querySelectorAll(STRICT).forEach(function (el) { found.push(el); }); } catch (e) {}
      modal.querySelectorAll("button, a").forEach(function (b) {
        var t = (b.textContent || "").trim();
        if (STRICT_TEXT[t] && found.indexOf(b) === -1) found.push(b);
      });
      for (var i = 0; i < found.length; i++) {
        var el = found[i];
        if (el.classList.contains("lux-ux") || !isVisible(el)) continue;
        if (inTopBand(el, modal)) return el;
      }
      return null;
    }
    function inject(modal) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lux-ux";
      btn.setAttribute("aria-label", "סגירת החלון");
      btn.textContent = "✕";
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        // הגנת נגיעה-כפולה: שתי לחיצות לפני שה-popstate הגיע היו מורידות שתי רמות
        // (או סוגרות את המודול כולו דרך ה-✕ של רשימת הספרים)
        if (Date.now() - (modal.__luxXAt || 0) < 600) return;
        modal.__luxXAt = Date.now();
        // ה-X מתנהג כמו "חזור" — צעד אחד אחורה בלבד, לא סגירת הכל.
        // אם לפופאפ יש כפתור חזרה נראה (תצוגת-משנה כמו קורא ספרים) — מפעילים
        // אותו: זהו מסלול הצעד-האחד המקורי של הפופאפ עצמו.
        var backBtn = null;
        try {
          modal.querySelectorAll("button, a").forEach(function (b) {
            if (backBtn || b.classList.contains("lux-ux") || !isVisible(b)) return;
            var t = (b.textContent || "").trim();
            if (/^[←→‹❮\s]*(חזרה|חזור)$/.test(t)) backBtn = b;
          });
        } catch (e) {}
        if (backBtn) { backBtn.click(); return; }
        // תצוגת-משנה בלי כפתור חזרה (כפתורי "← חזרה" הוסרו — ה-X הוא ה"חזור"):
        // script.js יודע אם ראש המחסנית הוא תת-תצוגה של המודול וחוזר צעד אחד
        try {
          if (modal.id && typeof window._luxModalStepBack === "function" && window._luxModalStepBack(modal.id)) return;
        } catch (e) {}
        // אין תצוגת-משנה — מנגנון הסגירה המקורי של הפופאפ (משחרר נעילות/היסטוריה)
        var own = closeCandidates(modal)[0];
        if (own) { own.click(); return; }
        if (modal.id && typeof window._closePopupViaBack === "function") { window._closePopupViaBack(modal.id); return; }
        if (modal.id) { luxModalClose(modal.id); return; }
        modal.remove();
        try { if (typeof window.unlockBodyScroll === "function") window.unlockBodyScroll(); } catch (e) {}
      });
      // מעוגן ל-body ולא לתוך המודאל: transform/backdrop-filter על המודאל היו
      // הופכים fixed ל-absolute וה-X היה נגלל עם התוכן. ב-body הוא חסין.
      btn.__luxFor = modal;
      document.body.appendChild(btn);
      ensureRoomForX(modal, btn);
      return btn;
    }
    // ה-X תמיד נשאר בפינה השמאלית-העליונה — לא זז לעולם. אם הוא מכסה כפתור
    // אמיתי של הפופאפ (חיפוש, סימניות וכו') — מפנים לו מקום: מוסיפים ריפוד
    // שמאלי לשורת-הכותרת שמכילה את הכפתור החופף, כך שכל כפתורי השורה זזים
    // מעט ימינה יחד (פריסת flex מסדרת אותם מחדש ואיש אינו נדרס).
    function ensureRoomForX(modal, btn) {
      if (!btn || !btn.isConnected || !modal || !modal.isConnected) return;
      var xr = btn.getBoundingClientRect();
      if (!xr.width) return;
      var clearLeft = xr.right + 8;
      try {
        var mr = modal.getBoundingClientRect();
        modal.querySelectorAll("button, a, input, select").forEach(function (el) {
          if (el === btn || el.classList.contains("lux-ux") || !isVisible(el)) return;
          var r = el.getBoundingClientRect();
          // רק רצועת הראש רלוונטית — אלמנטים שנגללים למטה אינם מוסתרים דרך קבע
          if (r.top > innerHeight * 0.4) return;
          var overlap = !(r.right < xr.left - 4 || r.left > xr.right + 4 ||
                          r.bottom < xr.top - 4 || r.top > xr.bottom + 4);
          if (!overlap) return;
          // מיכל השורה: העלייה הראשונה במעלה העץ שרוחבה קרוב לרוחב הפופאפ
          var cont = el.parentElement;
          while (cont && cont !== modal && cont.getBoundingClientRect().width < mr.width * 0.7) cont = cont.parentElement;
          if (!cont || cont === modal || cont === document.body) cont = el.parentElement;
          if (!cont) return;
          var need = Math.round(clearLeft - cont.getBoundingClientRect().left);
          var cur = parseFloat(cont.dataset.luxPadFix || "0");
          if (need > cur) {
            cont.style.paddingLeft = need + "px";
            cont.dataset.luxPadFix = need;
          }
        });
      } catch (e) {}
    }
    function tick() {
      if (document.hidden) return;
      // ניקוי X יתומים — הפופאפ שלהם נסגר או הוסתר
      document.querySelectorAll("body > .lux-ux").forEach(function (x) {
        var m = x.__luxFor;
        if (!m || !m.isConnected || m.classList.contains("hidden") || !isVisible(m)) x.remove();
      });
      document.querySelectorAll(SEL).forEach(function (modal) {
        if (modal.classList.contains("hidden") || !isVisible(modal)) { modal.__luxUx = null; modal.__luxUxOwn = null; return; }
        // רק שכבות-על אמיתיות (מכסות את רוב המסך) — פופאפים קטנים עם X משלהם לא רלוונטיים
        var cs = getComputedStyle(modal);
        if (cs.position !== "fixed") return;
        var r = modal.getBoundingClientRect();
        if (r.width < innerWidth * 0.55 || r.height < innerHeight * 0.55) return;
        // לפופאפ יש כרגע כפתור X/חזור עליון מובהק משלו? נבדק מחדש בכל סבב,
        // כי תצוגות-משנה (קורא/רשימת סעיפים) מתחלפות בתוך אותו פופאפ.
        var ownX = null;
        if (modal.__luxUxOwn && modal.contains(modal.__luxUxOwn) && isVisible(modal.__luxUxOwn) && inTopBand(modal.__luxUxOwn, modal)) {
          ownX = modal.__luxUxOwn;
        } else {
          modal.__luxUxOwn = topStrictClose(modal);
          ownX = modal.__luxUxOwn;
        }
        if (ownX) {
          // יש X עצמי — אם קודם הוזרק X (בתצוגת-משנה בלי X עצמי) מסירים אותו,
          // אחרת מתקבלים שני כפתורי X זה לצד זה
          if (modal.__luxUx && modal.__luxUx.parentElement === document.body && modal.__luxUx.__luxFor === modal) {
            modal.__luxUx.remove();
          }
          modal.__luxUx = null;
          return;
        }
        // X קיים — מוזרק על body (משויך למודאל הזה) או מובנה בתוך יריעת luxSheet
        if (modal.__luxUx && modal.__luxUx.isConnected && modal.__luxUx.__luxFor === modal) {
          // בכל סבב מוודאים שיש ל-X מקום פנוי (התוכן/הכותרת השתנו)
          ensureRoomForX(modal, modal.__luxUx);
          return;
        }
        var builtin = modal.querySelector(".lux-ux");
        if (builtin) { modal.__luxUx = builtin; return; }
        modal.__luxUx = inject(modal);
      });
    }
    // סריקה מיד כשמתווסף/נגרע פופאפ + קצב קבוע כרשת ביטחון (זול: רק כשיש שכבה פתוחה)
    var pend = null;
    window.__luxUxTick = function () { try { schedTick(); } catch (e) {} };
    function schedTick() {
      if (pend) return;
      pend = setTimeout(function () { pend = null; tick(); }, 120);
    }
    try { new MutationObserver(schedTick).observe(document.body, { childList: true }); } catch (e) {}
    setInterval(tick, 900);
    setTimeout(tick, 1200);
  });
})();
