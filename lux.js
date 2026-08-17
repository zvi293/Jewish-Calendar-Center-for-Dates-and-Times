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
    function shoot() {
      if (!hero.classList.contains("gradient-bg")) return schedule();
      var star = document.createElement("div");
      star.className = "lux-shooting-star";
      star.style.top = (5 + Math.random() * 35) + "%";
      star.style.right = (Math.random() * 40) + "%";
      hero.appendChild(star);
      setTimeout(function () { star.remove(); }, 1400);
      schedule();
    }
    function schedule() { setTimeout(shoot, 18000 + Math.random() * 26000); }
    setTimeout(shoot, 6000 + Math.random() * 8000);
  });

  /* ── 3. ירח חי — פאזת הירח האמיתית, בלחיצה נפתחת ברכת הלבנה ───── */
  safe("moonPhase", function () {
    var hero = document.getElementById("hero-section");
    if (!hero) return;
    var SYNODIC = 29.53058867;
    var ref = Date.UTC(2000, 0, 6, 18, 14); // מולד ידוע
    var age = ((Date.now() - ref) / 86400000) % SYNODIC;
    if (age < 0) age += SYNODIC;
    var idx = Math.round(age / (SYNODIC / 8)) % 8;
    var faces = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    var dayNum = Math.floor(age) + 1;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "lux-moon";
    btn.setAttribute("aria-label", "ברכת הלבנה");
    btn.title = "יום " + dayNum + " למולד · לחץ לברכת הלבנה";
    btn.textContent = faces[idx];
    btn.addEventListener("click", function () {
      if (typeof window.openPrayer === "function")
        window.openPrayer("kiddush-levana", "ברכת לבנה", "Kiddush Levana");
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
        grid.querySelectorAll(".event-card:not(.lux-in)").forEach(function (c) {
          if (c.getBoundingClientRect().top < window.innerHeight * 0.95)
            c.classList.add("lux-in");
        });
      }, 120);
    }, { passive: true });
    // רשת ביטחון אחרונה: סריקה מחזורית — שום כרטיס (והכפתורים שבו) לא
    // נשאר שקוף אחרי גלילה מעלה/מטה, גם אם אף אחד מהמנגנונים לא ירה.
    setInterval(function () {
      grid.querySelectorAll(".event-card:not(.lux-in)").forEach(function (c) {
        var r = c.getBoundingClientRect();
        // כל כרטיס שנמצא בתחום המסך או מעליו — נחשף מיד
        if (r.top < window.innerHeight * 1.05) c.classList.add("lux-in");
      });
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
        luxConfetti();
        return out;
      };
    }
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".levana-blessed-btn")) luxConfetti();
    }, { passive: true });
  });

  /* ── 7. פס התקדמות קריאה + כפתורי מצב לימוד/לילה בקוראי הספרים ── */
  var READER_IDS = [
    "sefaria-modal", "chok-israel-modal", "tehillim-modal", "sn-modal",
    "ben-ish-hai-modal", "shir-hashirim-modal",
    // כל שאר הקוראים והתפילות — פס ההתקדמות מופיע בכולם
    "prayer-modal", "omer-modal", "motzei-shabbat-modal",
    "moad-torah-modal", "hilulot-modal", "lux-selichot-reader"
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
    // כפתורי לימוד/לילה — מוזרקים לסרגל הגופן אם קיים
    var label = modal.querySelector(".font-size-label");
    var hostBar = label ? label.parentElement : null;
    if (hostBar) {
      hostBar.classList.add("lux-font-bar");
      var mk = function (icon, title, cls, storeKey) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "lux-reader-toggle";
        b.title = title;
        b.setAttribute("aria-label", title);
        b.textContent = icon;
        b.addEventListener("click", function () {
          var on = modal.classList.toggle(cls);
          b.classList.toggle("lux-on", on);
          try { localStorage.setItem(storeKey, on ? "1" : "0"); } catch (_) {}
        });
        hostBar.appendChild(b);
        return b;
      };
      var bStudy = mk("📜", "מצב לימוד — תצוגת לימוד מוגדלת, ממורכזת ומרווחת", "lux-study", "lux_reader_study");
      var bNight = mk("🌙", "קריאת לילה — קלף כהה", "lux-night", "lux_reader_night");
      // פופאפ הסבר קצר בהפעלה הראשונה של מצב לימוד + חיווי בכל הפעלה
      bStudy.addEventListener("click", function () {
        var on = modal.classList.contains("lux-study");
        if (on) {
          var seen = "";
          try { seen = localStorage.getItem("lux_study_info_seen") || ""; } catch (e) {}
          if (!seen) {
            try { localStorage.setItem("lux_study_info_seen", "1"); } catch (e) {}
            showStudyInfoSheet();
          } else if (typeof window.showToast === "function") {
            window.showToast("📜 מצב לימוד הופעל — טקסט מוגדל, ממורכז ומרווח", "success", 2600);
          }
        } else if (typeof window.showToast === "function") {
          window.showToast("מצב לימוד כובה", "info", 1800);
        }
      });
      try {
        if (localStorage.getItem("lux_reader_study") === "1") { modal.classList.add("lux-study"); bStudy.classList.add("lux-on"); }
        if (localStorage.getItem("lux_reader_night") === "1") { modal.classList.add("lux-night"); bNight.classList.add("lux-on"); }
      } catch (_) {}
    }
  }

  /* הסבר "מצב לימוד" — מוצג פעם אחת בהפעלה הראשונה */
  function showStudyInfoSheet() {
    var ov = luxSheet("lux-study-info",
      '<div style="font-size:2.4rem;margin-bottom:0.4rem;">📜</div>' +
      '<h3 class="lux-sheet-title">מצב לימוד</h3>' +
      '<p class="lux-sheet-note" style="text-align:right;line-height:1.9;">' +
        'תצוגה מיוחדת שנועדה ללימוד וקריאה רצופה ונינוחה:<br>' +
        '✦ <b>הטקסט מוגדל</b> וממורכז בשורות נוחות לעין<br>' +
        '✦ <b>ריווח שורות מוגבר</b> — קל יותר לעקוב אחרי הקריאה<br>' +
        '✦ <b>עימוד רגוע</b> שמסתיר הסחות דעת מסביב לטקסט<br><br>' +
        'לחיצה נוספת על הכפתור 📜 מחזירה לתצוגה הרגילה.' +
      '</p>' +
      '<div class="lux-sheet-actions">' +
        '<button type="button" class="lux-sheet-primary" id="lux-study-ok">הבנתי, ללימוד נעים 🙌</button>' +
      "</div>");
    if (!ov) return;
    ov.querySelector("#lux-study-ok").addEventListener("click", function () { luxModalClose("lux-study-info"); });
  }

  safe("readers", function () {
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
    ["light", "dark", "blue"].forEach(function (t) {
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
      { id: "tefilot", icon: "🙏", label: "תפילות", run: function () { if (typeof window.openTefilotNosafotPage === "function") window.openTefilotNosafotPage(); } },
      { id: "tehillim", icon: "📖", label: "תהילים", run: function () { if (typeof window.openTehillimPage === "function") window.openTehillimPage(); } },
      { id: "zmanim", icon: "🕰️", label: "זמנים", run: function () { var z = document.getElementById("halacha-banner"); if (z) z.scrollIntoView({ behavior: "smooth", block: "center" }); } },
      { id: "settings", icon: "⚙️", label: "הגדרות", run: function () { if (typeof window.toggleSettings === "function") window.toggleSettings(); } },
      { id: "shul", icon: "🕍", label: "בתי כנסת", run: function () { location.href = "synagogues.html"; } },
      { id: "shir", icon: "🌹", label: "שיר השירים", run: function () { if (typeof window.openShirHashirimPage === "function") window.openShirHashirimPage(); } },
      { id: "benish", icon: "📗", label: "בן איש חי", run: function () { if (typeof window.openBenIshHaiPage === "function") window.openBenIshHaiPage(); } },
      { id: "hilulot", icon: "🕯️", label: "הילולות", run: function () { if (typeof window.openHilulotModal === "function") window.openHilulotModal(); } },
      { id: "search", icon: "🔍", label: "חיפוש", run: function () { if (typeof window.openGlobalSmartSearch === "function") window.openGlobalSmartSearch(); } },
      { id: "compass", icon: "🧭", label: "מצפן", run: function () { if (typeof window.openCompass === "function") window.openCompass(); } }
    ];
    var DEFAULT_SEL = ["calendar", "sefarim", "tehillim", "zmanim", "settings"];
    var MAX_ITEMS = 5;
    var STORE_KEY = "lux_bottom_nav";

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
      if (existing) { luxModalClose("lux-nav-editor"); return; }
      var working = getSel();
      var overlay = document.createElement("div");
      overlay.id = "lux-nav-editor";
      overlay.innerHTML =
        "<div class='lux-ne-inner'>" +
          "<h3 class='lux-ne-title'>📱 עריכת סרגל הניווט</h3>" +
          "<p class='lux-ne-note'>בחר עד " + MAX_ITEMS + " פריטים — הסדר בסרגל לפי סדר הבחירה</p>" +
          "<div class='lux-ne-grid'></div>" +
          "<div class='lux-ne-actions'>" +
            "<button type='button' class='lux-ne-save'>שמור</button>" +
            "<button type='button' class='lux-ne-reset'>ברירת מחדל</button>" +
            "<button type='button' class='lux-ne-cancel'>ביטול</button>" +
          "</div>" +
        "</div>";
      var grid = overlay.querySelector(".lux-ne-grid");

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
            drawChips();
          });
          grid.appendChild(chip);
        });
      }
      drawChips();

      overlay.querySelector(".lux-ne-save").addEventListener("click", function () {
        if (working.length) saveSel(working);
        renderNav();
        luxModalClose("lux-nav-editor");
      });
      overlay.querySelector(".lux-ne-reset").addEventListener("click", function () {
        working = DEFAULT_SEL.slice();
        drawChips();
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
          '<span class="text-slate-400 text-xs">עד ' + MAX_ITEMS + " פריטים</span>" +
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
      var s = JSON.parse(localStorage.getItem("moadim_cached_events_v2") || "null");
      if (Array.isArray(s)) return s;
    } catch (e) {}
    return null;
  }

  /* ── 12. "הזמן הבא" — שורה קומפקטית מעל פס היום ────────────────── */
  safe("nextZman", function () {
    // כל זמני היום — הקרוב ביותר נבחר מתוך כולם (כולל זמני לילה)
    var KEYS = [
      { k: "alotHaShachar", l: "עלות השחר" },
      { k: "misheyakir", l: "משיכיר" },
      { k: "sunrise", l: "הנץ החמה" },
      { k: "sofZmanShmaMGA", l: "סו\"ז ק\"ש (מג\"א)" },
      { k: "sofZmanShma", l: "סו\"ז ק\"ש" },
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
        el.innerHTML = "⏳ <b>" + next.l + " · " + fmtTime(next.iso) + "</b> · עוד " + rem;
      } else {
        el.textContent = "";
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
      if (old) { luxModalClose("lux-year-wheel"); return; }
      var events = (getCachedEvents() || []).filter(function (e) {
        if (e.type !== "major") return false;
        var d = new Date(e.date);
        var diff = (d - new Date()) / 86400000;
        return diff > -2 && diff < 358;
      });
      var hebYear = "";
      try {
        var yNum = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(new Date()), 10);
        if (yNum) {
          // גימטריה ללא האלפים: 5786 → תשפ"ו
          var n = yNum % 1000;
          var tbl = [[400, "ת"], [300, "ש"], [200, "ר"], [100, "ק"], [90, "צ"], [80, "פ"], [70, "ע"], [60, "ס"], [50, "נ"], [40, "מ"], [30, "ל"], [20, "כ"], [16, "טז"], [15, "טו"], [10, "י"], [9, "ט"], [8, "ח"], [7, "ז"], [6, "ו"], [5, "ה"], [4, "ד"], [3, "ג"], [2, "ב"], [1, "א"]];
          var out = "";
          tbl.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
          hebYear = out.length > 1 ? out.slice(0, -1) + '"' + out.slice(-1) : out;
        }
      } catch (e) {}
      var overlay = document.createElement("div");
      overlay.id = "lux-year-wheel";
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
      var monthBounds = [];   // אינדקסי ימים שבהם מתחיל חודש חדש
      var monthNames = [heMonthOf(new Date())];
      var prevM = monthNames[0];
      for (var day = 1; day <= 364; day++) {
        var d = new Date(Date.now() + day * 86400000);
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
      // חגים — אייקון אמיתי של כל חג על הטבעת, עם הילה זהב
      events.forEach(function (ev, i) {
        var diff = (new Date(ev.date) - new Date()) / 86400000;
        var ang = (Math.max(0, diff) / 365) * 2 * Math.PI - Math.PI / 2;
        var x = CX + R * Math.cos(ang), y = CY + R * Math.sin(ang);
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "lux-yw-evt");
        g.innerHTML =
          '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="11" class="lux-yw-halo"/>' +
          '<text x="' + x.toFixed(1) + '" y="' + (y + 4.2).toFixed(1) + '" text-anchor="middle" font-size="12">' + (ev.icon || "✨") + "</text>";
        var c = g;
        c.addEventListener("click", function () {
          var info = overlay.querySelector("#lux-yw-info");
          var dateStr = new Date(ev.date).toLocaleDateString("he-IL", { day: "numeric", month: "long" });
          var heb = "";
          try { heb = typeof window.getHebrewDateString === "function" ? window.getHebrewDateString(new Date(ev.date)) : ""; } catch (e) {}
          info.innerHTML =
            '<div class="lux-yw-evname">' + (ev.icon || "✨") + " " + ev.name + "</div>" +
            '<div style="color:rgba(191,219,254,0.8);font-size:0.8rem;">' + dateStr + (heb ? " · " + heb : "") + " · בעוד " + Math.round(diff) + ' ימים</div>' +
            '<button type="button" id="lux-yw-goto">פתח בלוח המועדים ↓</button>';
          info.querySelector("#lux-yw-goto").addEventListener("click", function () {
            luxModalClose("lux-year-wheel");
            setTimeout(function () {
              var cards = document.querySelectorAll("#resultsGrid .event-card h3");
              for (var j = 0; j < cards.length; j++) {
                if (cards[j].textContent.trim() === ev.name) {
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
      overlay.addEventListener("click", function (e) { if (e.target === overlay) luxModalClose("lux-year-wheel"); });
      document.body.appendChild(overlay);
      // כפתור "חזור" בטלפון סוגר את הגלגל במקום לצאת מהאפליקציה
      luxModalOpen("lux-year-wheel");
    }
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
    function paint() {
      var heb = luxHebDateStr();
      el.innerHTML = greet + (heb ? ' · <span class="lux-greet-date">' + heb + "</span>" : "");
      // עיטור השם האישי מוחל אחרי כל ציור מחדש (מוגדר בפיצ'ר personalName)
      if (window.__luxNameDecorate) window.__luxNameDecorate(el);
    }
    paint();
    h1.insertAdjacentElement("beforebegin", el);
    window.addEventListener("lux-name-changed", paint);
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
      ctx.fillText("jewishcalendar.netlify.app", W / 2, H - 85);

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
        '<div class="lux-pr-foot">הופק ע"י הלוח היהודי · jewishcalendar.netlify.app</div>';
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

  /* עזרי מודאל: שילוב עם ניהול כפתור "חזור" של האתר */
  function luxModalOpen(id) {
    try { if (typeof window.pushModalState === "function") window.pushModalState(id); } catch (e) {}
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
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  /* מודאל קלף גנרי — נסגר גם בכפתור "חזור" בטלפון */
  function luxSheet(id, innerHtml) {
    var old = document.getElementById(id);
    if (old) { luxModalClose(id); return null; }
    var overlay = document.createElement("div");
    overlay.id = id;
    overlay.className = "lux-sheet-overlay";
    overlay.innerHTML = '<div class="lux-sheet">' + innerHtml + "</div>";
    overlay.addEventListener("click", function (e) { if (e.target === overlay) luxModalClose(id); });
    document.body.appendChild(overlay);
    luxModalOpen(id);
    return overlay;
  }

  /* ── 24. שם אישי בברכה ─────────────────────────────────────────── */
  safe("personalName", function () {
    // מעטר את שורת הברכה — נקרא מתוך paint() של הברכה אחרי כל ציור מחדש
    window.__luxNameDecorate = function (el) {
      if (el.querySelector(".lux-name-add, .lux-name-edit")) return;
      var name = "";
      try { name = localStorage.getItem("lux_user_name") || ""; } catch (e) {}
      if (name) {
        var html = el.innerHTML;
        var sep = html.indexOf(" · ");
        var withName = sep !== -1
          ? html.slice(0, sep) + ", <b>" + esc(name) + "</b>" + html.slice(sep)
          : html + ", <b>" + esc(name) + "</b>";
        el.innerHTML = withName + ' <button type="button" class="lux-name-edit" title="שינוי שם">✎</button>';
      } else {
        el.innerHTML += ' <button type="button" class="lux-name-add">👋 מה שמך?</button>';
      }
      var btn = el.querySelector(".lux-name-add, .lux-name-edit");
      if (btn) btn.addEventListener("click", askName);
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
        try { if (v) localStorage.setItem("lux_user_name", v); } catch (e) {}
        luxModalClose("lux-name-modal");
        setTimeout(function () { window.dispatchEvent(new Event("lux-name-changed")); }, 150);
      });
      var clr = ov.querySelector("#lux-name-clear");
      if (clr) clr.addEventListener("click", function () {
        try { localStorage.removeItem("lux_user_name"); } catch (e) {}
        luxModalClose("lux-name-modal");
        setTimeout(function () { window.dispatchEvent(new Event("lux-name-changed")); }, 150);
      });
      ov.querySelector(".lux-sheet-cancel").addEventListener("click", function () { luxModalClose("lux-name-modal"); });
    }
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
      { t: "הגדרות", i: "⚙️", run: function () { window.toggleSettings && window.toggleSettings(); } }
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
      { k: "sofZmanTfilla", l: "סוף זמן תפילה" }
    ];
    function check() {
      var z = window._lastZData;
      if (!z || !z.times) return;
      var now = Date.now();
      var show = null;
      CRIT.forEach(function (c) {
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
      el.querySelector(".lux-crit-txt").textContent = "⏰ " + show.l + " בעוד " + mins + " דק' (" + fmtTime(show.iso) + ")";
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
          // סנכרון מצב תצוגה אם הפרק צויר מחדש
          var on0 = isRead(n);
          existing.classList.toggle("lux-on", on0);
          existing.textContent = on0 ? "✓ נקרא" : "◯ סמן שנקרא";
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
      ];
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
      }
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
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
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
      { sel: "#lux-greeting", t: "ברכה אישית 👋", d: "ברכה לפי שעת היום עם התאריך העברי. לחצו על \"מה שמך?\" כדי שהאתר יברך אתכם בשמכם." },
      { sel: "#prayer-grid-wrap", t: "תפילות בלחיצה 🙏", d: "תפילת הדרך, ברכת המזון, תיקון הכללי ועוד — לחיצה אחת פותחת את הנוסח המלא. בכפתור \"תפילות נוספות\" מסתתרות עוד הרבה." },
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
      { sel: ".nav-action-btn", t: "הגדרות ⚙️", d: "נוסח התפילה, שיטת הזמנים, עיצוב, התראות, יארצייטים, הישגים ועוד — הכל מתאים את האתר בדיוק אליכם. סיור נעים! 🙌" }
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
      }).join("");
      area.scrollTop = 0;
    }

    function openReader() {
      var old = document.getElementById("lux-selichot-reader");
      if (old) { luxModalClose("lux-selichot-reader"); return; }
      var nus = currentNusach();
      var ov = document.createElement("div");
      ov.id = "lux-selichot-reader";
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
            '<p>נוסח ' + esc(nus.label) + ' · הטקסט מ-Sefaria.org</p>' +
          "</div>" +
          '<div class="lux-sel-font">' +
            '<button type="button" id="lux-sel-fminus" aria-label="הקטן כתב">−</button>' +
            '<button type="button" id="lux-sel-fplus" aria-label="הגדל כתב">+</button>' +
          "</div>" +
        "</div>" +
        chipsHtml +
        '<div class="lux-sel-area holy-text-style"><p style="text-align:center;color:#94a3b8;padding:2rem;">טוען את הסליחות...</p></div>';
      document.body.appendChild(ov);
      luxModalOpen("lux-selichot-reader");
      var area = ov.querySelector(".lux-sel-area");
      // גודל גופן
      var fs = parseInt(jget("lux_sel_font", 100), 10) || 100;
      function applyFs() { area.style.fontSize = fs + "%"; jset("lux_sel_font", fs); }
      applyFs();
      ov.querySelector("#lux-sel-fplus").addEventListener("click", function () { fs = Math.min(180, fs + 10); applyFs(); });
      ov.querySelector("#lux-sel-fminus").addEventListener("click", function () { fs = Math.max(70, fs - 10); applyFs(); });
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
})();
