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
    var KEYS = [
      { k: "alotHaShachar", l: "עלות השחר" },
      { k: "sunrise", l: "הנץ החמה" },
      { k: "sofZmanShma", l: "סו\"ז ק\"ש" },
      { k: "chatzot", l: "חצות" },
      { k: "minchaGedola", l: "מנחה גדולה" },
      { k: "plagHaMincha", l: "פלג המנחה" },
      { k: "sunset", l: "שקיעה" },
      { k: "tzeit7083deg", l: "צאת הכוכבים" }
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
      if (next) {
        var d = next.ms - now;
        var hh = Math.floor(d / 3600000), mm = Math.floor((d % 3600000) / 60000);
        el.innerHTML = "⏳ הזמן הבא: <b>" + next.l + " · " + fmtTime(next.iso) + "</b> — בעוד " +
          (hh > 0 ? hh + " שע' ו־" : "") + mm + " דק'";
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
      if (old) { old.remove(); return; }
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
      // חודשי השנה העבריים — קווים מפרידים + תוויות
      var prevM = heMonthOf(new Date());
      for (var day = 1; day <= 364; day++) {
        var d = new Date(Date.now() + day * 86400000);
        var m = heMonthOf(d);
        if (m && m !== prevM) {
          var ang = (day / 365) * 2 * Math.PI - Math.PI / 2;
          var x1 = CX + 86 * Math.cos(ang), y1 = CY + 86 * Math.sin(ang);
          var x2 = CX + (R + 4) * Math.cos(ang), y2 = CY + (R + 4) * Math.sin(ang);
          parts.push('<line class="lux-yw-tick" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>');
          var mid = ((day + 14) / 365) * 2 * Math.PI - Math.PI / 2;
          var lx = CX + RL * Math.cos(mid), ly = CY + RL * Math.sin(mid);
          parts.push('<text class="lux-yw-monthlabel" x="' + lx.toFixed(1) + '" y="' + (ly + 3.5).toFixed(1) + '" text-anchor="middle">' + m + "</text>");
          prevM = m;
        }
      }
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
            overlay.remove();
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
          });
        });
        svg.appendChild(c);
      });
      overlay.querySelector(".lux-yw-close").addEventListener("click", function () { overlay.remove(); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
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
    }
    paint();
    h1.insertAdjacentElement("beforebegin", el);
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
    document.addEventListener("touchstart", function (e) {
      if (window.scrollY <= 0 && !document.body.classList.contains("lux-modal-open")) {
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

  /* ── 23. סיור היכרות ראשון ─────────────────────────────────────── */
  safe("tour", function () {
    try { if (localStorage.getItem("lux_tour_done")) return; } catch (e) {}
    var isMobile = window.innerWidth < 768;
    function steps() {
      return [
        { el: document.getElementById("dashboard-state"), t: "הכל במבט אחד", p: "התאריך העברי, זמני השבת, ברכת הלבנה והמועד הבא — מתעדכנים לפי המיקום שלך." },
        { el: document.getElementById("prayer-grid-wrap"), t: "תפילות וספרים", p: "תפילת הדרך, ברכת המזון, תהילים ועוד — הכל בלחיצה אחת." },
        { el: document.getElementById("lux-moon"), t: "הירח החי", p: "מציג את מולד הלבנה האמיתי — לחיצה פותחת את ברכת הלבנה." },
        isMobile
          ? { el: document.getElementById("lux-bottom-nav"), t: "הניווט שלך", p: "קיצורים מהירים לכל האתר. אפשר להתאים אישית בהגדרות!" }
          : { el: document.querySelector('div[role="toolbar"] button[aria-label="הגדרות"]'), t: "הגדרות אישיות", p: "עיר, נוסח, גודל כתב ותמות — הכל מותאם אליך." }
      ].filter(function (s) {
        // getClientRects ולא offsetParent — אלמנטים fixed (ניווט תחתון) מוחזרים כ-null ב-offsetParent
        return s.el && s.el.getClientRects().length > 0;
      });
    }
    function begin() {
      var list = steps();
      if (list.length < 2) { done(); return; }
      var i = 0;
      var tour = document.createElement("div");
      tour.id = "lux-tour";
      tour.innerHTML =
        '<div class="lux-tour-ring"></div>' +
        '<div class="lux-tour-card">' +
          '<div class="lux-tour-step"></div><h4></h4><p></p>' +
          '<div class="lux-tour-actions">' +
            '<button type="button" class="lux-tour-next">הבא ←</button>' +
            '<button type="button" class="lux-tour-skip">דלג</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(tour);
      var ring = tour.querySelector(".lux-tour-ring");
      var card = tour.querySelector(".lux-tour-card");
      function show() {
        var s = list[i];
        if (!s || !s.el) { finish(); return; }
        s.el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () {
          var r = s.el.getBoundingClientRect();
          ring.style.top = (r.top - 8) + "px";
          ring.style.left = (r.left - 8) + "px";
          ring.style.width = (r.width + 16) + "px";
          ring.style.height = (r.height + 16) + "px";
          tour.querySelector(".lux-tour-step").textContent = (i + 1) + " / " + list.length;
          tour.querySelector("h4").textContent = s.t;
          tour.querySelector("p").textContent = s.p;
          tour.querySelector(".lux-tour-next").textContent = i === list.length - 1 ? "סיימנו ✨" : "הבא ←";
          var below = r.bottom + 190 < window.innerHeight;
          card.style.top = below ? (r.bottom + 16) + "px" : "";
          card.style.bottom = below ? "" : (window.innerHeight - r.top + 16) + "px";
          card.style.left = "50%";
          card.style.transform = "translateX(-50%)";
        }, 450);
      }
      function finish() { tour.remove(); done(); }
      tour.querySelector(".lux-tour-next").addEventListener("click", function () {
        i++;
        if (i >= list.length) finish(); else show();
      });
      tour.querySelector(".lux-tour-skip").addEventListener("click", finish);
      show();
    }
    function done() {
      try { localStorage.setItem("lux_tour_done", "1"); } catch (e) {}
    }
    // ממתינים שהדשבורד ייטען + שהפתיח ייעלם
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (tries > 25) { clearInterval(t); return; }
      var dash = document.getElementById("dashboard-state");
      if (dash && !dash.classList.contains("hidden") && !document.getElementById("lux-splash")) {
        clearInterval(t);
        setTimeout(begin, 900);
      }
    }, 700);
  });
})();
