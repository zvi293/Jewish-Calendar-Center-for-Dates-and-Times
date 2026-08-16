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
  var READER_IDS = ["sefaria-modal", "chok-israel-modal", "tehillim-modal", "sn-modal", "ben-ish-hai-modal", "shir-hashirim-modal"];

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
      if (!t || !t.scrollHeight || t === modal) return;
      var max = t.scrollHeight - t.clientHeight;
      if (max < 40) return;
      fill.style.width = Math.min(100, (t.scrollTop / max) * 100) + "%";
    }, true);
    // כפתורי לימוד/לילה — מוזרקים לסרגל הגופן אם קיים
    var label = modal.querySelector(".font-size-label");
    var hostBar = label ? label.parentElement : null;
    if (hostBar) {
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
      var bStudy = mk("📜", "מצב לימוד — טקסט ממורכז ומרווח", "lux-study", "lux_reader_study");
      var bNight = mk("🌙", "קריאת לילה — קלף כהה", "lux-night", "lux_reader_night");
      try {
        if (localStorage.getItem("lux_reader_study") === "1") { modal.classList.add("lux-study"); bStudy.classList.add("lux-on"); }
        if (localStorage.getItem("lux_reader_night") === "1") { modal.classList.add("lux-night"); bNight.classList.add("lux-on"); }
      } catch (_) {}
    }
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
    var row = document.getElementById("theme-circle-blue");
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
      if (existing) { existing.remove(); return; }
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
        overlay.remove();
      });
      overlay.querySelector(".lux-ne-reset").addEventListener("click", function () {
        working = DEFAULT_SEL.slice();
        drawChips();
      });
      overlay.querySelector(".lux-ne-cancel").addEventListener("click", function () {
        overlay.remove();
      });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
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
})();
