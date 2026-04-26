      // --- Caching Logic for API Calls (Offline-First Strategy) ---
      const API_INFLIGHT_CACHE = new Map();
      async function fetchHebcalWithCache(url) {
        const cacheKey = "hebcal_cache_" + url;
        const cachedStr = localStorage.getItem(cacheKey);
        const now = Date.now();

        if (cachedStr) {
          try {
            const cachedData = JSON.parse(cachedStr);
            // Valid for 12 hours
            if (now - cachedData.timestamp < 12 * 60 * 60 * 1000) {
              // Stale-while-revalidate background update
              if (navigator.onLine) {
                fetch(url, { signal: AbortSignal.timeout(8000) })
                  .then((r) => r.json())
                  .then((data) => {
                    localStorage.setItem(
                      cacheKey,
                      JSON.stringify({ timestamp: Date.now(), data }),
                    );
                  })
                  .catch(() => {});
              }
              return cachedData.data;
            }
          } catch (e) {}
        }

        try {
          if (API_INFLIGHT_CACHE.has(url)) {
            return API_INFLIGHT_CACHE.get(url);
          }
          const request = fetch(url, { signal: AbortSignal.timeout(10000) })
            .then((res) => res.json())
            .then((data) => {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({ timestamp: now, data }),
              );
              return data;
            })
            .finally(() => {
              API_INFLIGHT_CACHE.delete(url);
            });
          API_INFLIGHT_CACHE.set(url, request);
          return await request;
        } catch (err) {
          if (cachedStr) return JSON.parse(cachedStr).data;
          throw err;
        }
      }

      // --- Translations (i18n) ---
      const i18nDict = {
        he: {
          app_title_1: "הלוח",
          app_title_2: "היהודי",
          loading: "מסנכרן נתונים...",
          today_date: "התאריך היום",
          moon_close: "ברכת הלבנה הקרובה",
          next_event: "המועד הבא",
          upcoming_shab: "שבת קרובה",
          zmanim: "זמני היום",
          cal_btn: "פתח לוח שנה חודשי",
          search_place: "חפש חג, צום או זמן...",
          filter_all: "הכל",
          filter_holidays: "חגים",
          filter_fasts: "צומות",
          filter_rosh: "ראשי חודשים",
          filter_moon: "קידוש לבנה",
          omer_title: "ספירת העומר",
          omer_btn: "לנוסח הברכה והספירה המלא",
          sync_all: "סנכרן את הלוח ליומן שלך",
          sync_mobile: "סנכרן ליומן",
          settings_title: "הגדרות אישיות",
          compass: "מצפן כיוון תפילה",
          settings_language: "שפה",
          language_switch: "החלף שפה",
          notif_settings_title: "התראות דפדפן (פוש)",
          notif_enable: "הפעל",
          notif_shab: "כניסת שבת (חצי שעה לפני)",
          notif_hol: "כניסת חג (חצי שעה לפני)",
          notif_fast: "סיום צום (חצי שעה לפני)",
          notif_omer: "ספירת העומר (בצאת הכוכבים)",
          notif_levana: "ברכת הלבנה (תחילת/סוף זמן)",
          notif_daf: "הדף היומי (תזכורת בוקר 08:00)",
          notif_tefillin: "תזכורת להניח תפילין (08:30)",
        },
        en: {
          app_title_1: "Jewish",
          app_title_2: "Calendar",
          loading: "Syncing data...",
          today_date: "Today's Date",
          moon_close: "Upcoming Kiddush Levana",
          next_event: "Next Event",
          upcoming_shab: "Upcoming Shabbat",
          zmanim: "Daily Zmanim",
          cal_btn: "Open Monthly Calendar",
          search_place: "Search holiday, fast...",
          filter_all: "All",
          filter_holidays: "Holidays",
          filter_fasts: "Fasts",
          filter_rosh: "Rosh Chodesh",
          filter_moon: "Levana",
          omer_title: "Omer Count",
          omer_btn: "Full Blessing Text",
          sync_all: "Sync Calendar to Device",
          sync_mobile: "Sync Cal",
          settings_title: "Settings",
          compass: "Prayer Direction Compass",
          settings_language: "Language",
          language_switch: "Change Language",
          notif_settings_title: "Push Notifications",
          notif_enable: "Enable",
          notif_shab: "Shabbat (30 mins before)",
          notif_hol: "Holiday (30 mins before)",
          notif_fast: "Fast Ends (30 mins before)",
          notif_omer: "Omer Count (At Nightfall)",
          notif_levana: "Kiddush Levana (Start/End)",
          notif_daf: "Daf Yomi (Morning at 08:00)",
          notif_tefillin: "Put on Tefillin Reminder (08:30)",
        },
        fr: {
          app_title_1: "Calendrier",
          app_title_2: "Juif",
          loading: "Synchronisation...",
          today_date: "Date du Jour",
          moon_close: "Prochain Kiddouch Levana",
          next_event: "Prochain Événement",
          upcoming_shab: "Prochain Chabbat",
          zmanim: "Zmanim du Jour",
          cal_btn: "Ouvrir le Calendrier",
          search_place: "Rechercher une fête...",
          filter_all: "Tout",
          filter_holidays: "Fêtes",
          filter_fasts: "Jeûnes",
          filter_rosh: "Roch Hodech",
          filter_moon: "Levana",
          omer_title: "Compte du Omer",
          omer_btn: "Texte Complet",
          sync_all: "Synchroniser avec l'agenda",
          sync_mobile: "Sync",
          settings_title: "Paramètres",
          compass: "Boussole de Priere",
          settings_language: "Langue",
          language_switch: "Changer de langue",
          notif_settings_title: "Notifications Push",
          notif_enable: "Activer",
          notif_shab: "Chabbat (30 min avant)",
          notif_hol: "Fête (30 min avant)",
          notif_fast: "Fin du Jeûne (30 min avant)",
          notif_omer: "Compte du Omer (À la nuit)",
          notif_levana: "Kiddouch Levana (Début/Fin)",
          notif_daf: "Daf Yomi (Matin à 08:00)",
          notif_tefillin: "Rappel pour mettre les Téfilines (08:30)",
        },
      };

      Object.assign(i18nDict.he, {
        settings_city_label: "׳׳™׳§׳•׳ ׳׳—׳™׳©׳•׳‘ ׳–׳׳ ׳™׳ ׳•׳©׳‘׳×",
        settings_city_placeholder:
          "׳”׳§׳׳“ ׳©׳ ׳¢׳™׳¨ (׳‘׳׳ ׳’׳׳™׳× ׳׳• ׳¢׳‘׳¨׳™׳×)...",
        settings_current_city_label: "׳¢׳™׳¨ ׳ ׳•׳›׳—׳™׳×:",
        settings_use_gps: "נ“ ׳”׳©׳×׳׳© ׳‘׳׳™׳§׳•׳ ׳©׳׳™ (GPS)",
        settings_method_label: "׳©׳™׳˜׳× ׳—׳™׳©׳•׳‘ ׳–׳׳ ׳™ ׳”׳™׳•׳",
        calendar_today_btn: "׳”׳™׳•׳",
        footer_credits: "׳§׳¨׳“׳™׳˜׳™׳",
      });
      Object.assign(i18nDict.en, {
        settings_city_label: "City for zmanim and Shabbat",
        settings_city_placeholder: "Type a city name (English or Hebrew)...",
        settings_current_city_label: "Current city:",
        settings_use_gps: "Use my location (GPS)",
        settings_method_label: "Daily zmanim calculation method",
        calendar_today_btn: "Today",
        footer_credits: "Credits",
      });
      Object.assign(i18nDict.fr, {
        settings_city_label: "Ville pour les zmanim et le Chabbat",
        settings_city_placeholder:
          "Tapez un nom de ville (anglais ou hֳ©breu)...",
        settings_current_city_label: "Ville actuelle :",
        settings_use_gps: "Utiliser ma position (GPS)",
        settings_method_label: "Mֳ©thode de calcul des zmanim",
        calendar_today_btn: "Aujourd'hui",
        footer_credits: "Crֳ©dits",
      });

      Object.assign(i18nDict.he, {
        settings_city_label: "מיקום לחישוב זמנים ושבת",
        settings_city_placeholder: "הקלד שם עיר (באנגלית או בעברית)...",
        settings_current_city_label: "עיר נוכחית:",
        settings_use_gps: "השתמש במיקום שלי (GPS)📍",
        settings_method_label: "שיטת חישוב זמני היום",
        calendar_today_btn: "היום",
        footer_credits: "קרדיטים",
      });
      Object.assign(i18nDict.fr, {
        footer_credits: "Crédits",
      });

      const dynamicUiDict = {
        he: {
          locale: "he-IL",
          calendarLocale: "he-IL",
          hebrewCalendarLocale: "he-IL-u-ca-hebrew",
          weekdayHeaders: ["׳'", "׳‘'", "׳’'", "׳“'", "׳”'", "׳•'", "׳©'"],
          weekdayNames: [
            "׳¨׳׳©׳•׳",
            "׳©׳ ׳™",
            "׳©׳׳™׳©׳™",
            "׳¨׳‘׳™׳¢׳™",
            "׳—׳׳™׳©׳™",
            "׳©׳™׳©׳™",
            "׳©׳‘׳×",
          ],
          today: "׳”׳™׳•׳",
          inDays: (days) => `׳‘׳¢׳•׳“ ${days} ׳™׳׳™׳`,
          noResults: "׳׳ ׳ ׳׳¦׳׳• ׳׳•׳¢׳“׳™׳ ׳×׳•׳׳׳™׳.",
          shabbatEnter: "׳›׳ ׳™׳¡׳× ׳©׳‘׳×",
          shabbatExit: "׳™׳¦׳™׳׳× ׳©׳‘׳×",
          holidayEnter: "׳›׳ ׳™׳¡׳× ׳—׳’",
          holidayExit: "׳™׳¦׳™׳׳× ׳—׳’",
          fastStart: "׳×׳—׳™׳׳× ׳¦׳•׳",
          fastEnd: "׳¡׳™׳•׳ ׳¦׳•׳",
          currentCityLabel: "׳¢׳™׳¨ ׳ ׳•׳›׳—׳™׳×:",
          gpsCity: "׳׳™׳§׳•׳ ׳ ׳•׳›׳—׳™ (GPS)",
          gpsError:
            "׳׳ ׳”׳¦׳׳—׳ ׳• ׳׳׳×׳¨ ׳׳™׳§׳•׳, ׳ ׳—׳–׳•׳¨ ׳׳”׳’׳“׳¨׳” ׳”׳§׳•׳“׳׳×.",
          loadingFastTimes: "׳׳—׳©׳‘ ׳–׳׳ ׳™ ׳¦׳•׳...",
          loadingHolidayTimes: "׳׳—׳©׳‘ ׳–׳׳ ׳™ ׳—׳’...",
          noDataError:
            "׳׳ ׳ ׳™׳×׳ ׳׳׳©׳•׳ ׳ ׳×׳•׳ ׳™׳ ׳›׳¢׳×. ׳‘׳“׳•׳§ ׳—׳™׳‘׳•׳¨ ׳׳™׳ ׳˜׳¨׳ ׳˜.",
          syncEmpty: "׳׳™׳ ׳׳™׳¨׳•׳¢׳™׳ ׳׳¡׳ ׳›׳¨׳•׳.",
          compassPermission: "׳ ׳“׳¨׳© ׳׳™׳©׳•׳¨ ׳—׳™׳™׳©׳ ׳™׳",
          compassLocating: "׳׳׳×׳¨ ׳›׳™׳•׳•׳ ׳”׳×׳₪׳™׳׳”...",
          compassRotate: "׳¡׳•׳‘׳‘ ׳׳× ׳”׳׳›׳©׳™׳¨...",
          compassButton: "׳׳©׳¨ ׳’׳™׳©׳” ׳׳—׳™׳™׳©׳ ׳™ ׳›׳™׳•׳•׳",
          compassTargetJerusalem: "׳™׳¨׳•׳©׳׳™׳",
          compassTargetWall: "׳”׳›׳•׳×׳",
          compassTargetIsrael: "׳׳¨׳¥ ׳™׳©׳¨׳׳",
          compassAligned: (label) => `׳׳›׳•׳•׳ ׳${label}! ג¨`,
          sefariaLoading: "׳˜׳•׳¢׳ ׳˜׳§׳¡׳˜ ׳׳׳¡׳“ ׳”׳ ׳×׳•׳ ׳™׳...",
          sefariaMissing:
            "׳׳ ׳ ׳׳¦׳ ׳˜׳§׳¡׳˜ ׳¢׳‘׳•׳¨ ׳׳•׳¢׳“ ׳–׳” ׳‘׳׳׳’׳¨ ׳”׳₪׳×׳•׳—.",
          sefariaError:
            "׳©׳’׳™׳׳” ׳‘׳˜׳¢׳™׳ ׳× ׳”׳˜׳§׳¡׳˜. ׳׳ ׳ ׳‘׳“׳•׳§ ׳—׳™׳‘׳•׳¨ ׳׳׳™׳ ׳˜׳¨׳ ׳˜.",
          sefariaCredit:
            "׳”׳˜׳§׳¡׳˜ ׳‘׳׳“׳™׳‘׳•׳× Sefaria.org (׳‘׳¨׳™׳©׳™׳•׳ ׳₪׳×׳•׳—)",
          zmanimLabels: [
            "׳¢׳׳•׳× ׳”׳©׳—׳¨",
            "׳”׳ ׳¥ ׳”׳—׳׳”",
            '׳¡׳•׳£ ׳§"׳©',
            "׳¡׳•׳£ ׳×׳₪׳™׳׳”",
            "׳—׳¦׳•׳× ׳™׳•׳ / ׳׳™׳׳”",
            "׳׳ ׳—׳” ׳’׳“׳•׳׳”",
            "׳׳ ׳—׳” ׳§׳˜׳ ׳”",
            "׳₪׳׳’ ׳”׳׳ ׳—׳”",
            "׳©׳§׳™׳¢׳”",
            "׳¦׳׳× ׳”׳›׳•׳›׳‘׳™׳",
          ],
        },
        en: {
          locale: "en-US",
          calendarLocale: "en-US",
          hebrewCalendarLocale: "en-US-u-ca-hebrew",
          weekdayHeaders: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
          weekdayNames: [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Shabbat",
          ],
          today: "Today",
          inDays: (days) => `In ${days} Days`,
          noResults: "No matching events found.",
          shabbatEnter: "Shabbat begins",
          shabbatExit: "Shabbat ends",
          holidayEnter: "Holiday begins",
          holidayExit: "Holiday ends",
          fastStart: "Fast begins",
          fastEnd: "Fast ends",
          currentCityLabel: "Current city:",
          gpsCity: "Current location (GPS)",
          gpsError:
            "Unable to detect location. Restoring the previous setting.",
          loadingFastTimes: "Calculating fast times...",
          loadingHolidayTimes: "Calculating holiday times...",
          noDataError:
            "Unable to load data right now. Check your internet connection.",
          syncEmpty: "No events available to sync.",
          compassPermission: "Sensor permission is required",
          compassLocating: "Finding prayer direction...",
          compassRotate: "Rotate the device...",
          compassButton: "Grant compass sensor access",
          compassTargetJerusalem: "Jerusalem",
          compassTargetWall: "Western Wall",
          compassTargetIsrael: "Land of Israel",
          compassAligned: (label) => `Aligned to ${label}!`,
          sefariaLoading: "Loading text from the database...",
          sefariaMissing:
            "No text was found for this item in the open database.",
          sefariaError:
            "Failed to load the text. Please check your internet connection.",
          sefariaCredit: "Text courtesy of Sefaria.org (open license)",
          zmanimLabels: [
            "Alot HaShachar",
            "Sunrise",
            "Latest Shema",
            "Latest Tefillah",
            "Chatzot",
            "Mincha Gedola",
            "Mincha Ketana",
            "Plag HaMincha",
            "Sunset",
            "Tzeit HaKochavim",
          ],
        },
        fr: {
          locale: "fr-FR",
          calendarLocale: "fr-FR",
          hebrewCalendarLocale: "fr-FR-u-ca-hebrew",
          weekdayHeaders: [
            "dim.",
            "lun.",
            "mar.",
            "mer.",
            "jeu.",
            "ven.",
            "sam.",
          ],
          weekdayNames: [
            "dimanche",
            "lundi",
            "mardi",
            "mercredi",
            "jeudi",
            "vendredi",
            "Chabbat",
          ],
          today: "Aujourd'hui",
          inDays: (days) => `Dans ${days} jours`,
          noResults: "Aucun ֳ©vֳ©nement correspondant.",
          shabbatEnter: "Entrֳ©e de Chabbat",
          shabbatExit: "Sortie de Chabbat",
          holidayEnter: "Entrֳ©e de la fֳ×te",
          holidayExit: "Sortie de la fֳ×te",
          fastStart: "Dֳ©but du jeֳ»ne",
          fastEnd: "Fin du jeֳ»ne",
          currentCityLabel: "Ville actuelle :",
          gpsCity: "Position actuelle (GPS)",
          gpsError:
            "Impossible de dֳ©tecter la position. Retour au rֳ©glage prֳ©cֳ©dent.",
          loadingFastTimes: "Calcul des horaires du jeֳ»ne...",
          loadingHolidayTimes: "Calcul des horaires de la fֳ×te...",
          noDataError:
            "Impossible de charger les donnֳ©es pour le moment. Vֳ©rifiez votre connexion Internet.",
          syncEmpty: "Aucun ֳ©vֳ©nement ֳ  synchroniser.",
          compassPermission: "L'autorisation des capteurs est requise",
          compassLocating: "Recherche de la direction de priֳ¨re...",
          compassRotate: "Tournez l'appareil...",
          compassButton: "Autoriser l'accֳ¨s aux capteurs",
          compassTargetJerusalem: "Jֳ©rusalem",
          compassTargetWall: "Mur occidental",
          compassTargetIsrael: "Terre d'Israֳ«l",
          compassAligned: (label) => `Alignֳ© vers ${label} !`,
          sefariaLoading: "Chargement du texte depuis la base de donnֳ©es...",
          sefariaMissing:
            "Aucun texte n'a ֳ©tֳ© trouvֳ© pour cet ֳ©lֳ©ment dans la base ouverte.",
          sefariaError:
            "Le chargement du texte a ֳ©chouֳ©. Veuillez vֳ©rifier votre connexion Internet.",
          sefariaCredit: "Texte fourni par Sefaria.org (licence ouverte)",
          zmanimLabels: [
            "Alot HaShachar",
            "Lever du soleil",
            "Fin du Chema",
            "Fin de la Tefila",
            "Hatsot",
            "Minha Gedola",
            "Minha Ketana",
            "Plag HaMinha",
            "Coucher du soleil",
            "Sortie des ֳ©toiles",
          ],
        },
      };

      Object.assign(dynamicUiDict.he, {
        weekdayHeaders: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"],
        weekdayNames: [
          "ראשון",
          "שני",
          "שלישי",
          "רביעי",
          "חמישי",
          "שישי",
          "שבת",
        ],
        today: "היום",
        inDays: (days) => `בעוד ${days} ימים`,
        noResults: "לא נמצאו מועדים תואמים.",
        shabbatEnter: "כניסת שבת",
        shabbatExit: "יציאת שבת",
        holidayEnter: "כניסת חג",
        holidayExit: "יציאת חג",
        fastStart: "תחילת צום",
        fastEnd: "סיום צום",
        currentCityLabel: "עיר נוכחית:",
        gpsCity: "מיקום נוכחי (GPS)",
        gpsError: "לא הצלחנו לאתר מיקום, נחזור להגדרה הקודמת.",
        loadingFastTimes: "מחשב זמני צום...",
        loadingHolidayTimes: "מחשב זמני חג...",
        noDataError: "לא ניתן למשוך נתונים כעת. בדוק חיבור אינטרנט.",
        syncEmpty: "אין אירועים לסנכרון.",
        compassPermission: "נדרש אישור חיישנים",
        compassLocating: "מאתר כיוון התפילה...",
        compassRotate: "סובב את המכשיר...",
        compassButton: "אשר גישה לחיישני כיוון",
        compassTargetJerusalem: "ירושלים",
        compassTargetWall: "הכותל",
        compassTargetIsrael: "ארץ ישראל",
        compassAligned: (label) => `מכוון ל${label}!`,
        sefariaLoading: "טוען טקסט ממסד הנתונים...",
        sefariaMissing: "לא נמצא טקסט עבור מועד זה במאגר הפתוח.",
        sefariaError: "שגיאה בטעינת הטקסט. אנא בדוק חיבור לאינטרנט.",
        sefariaCredit: "הטקסט באדיבות Sefaria.org (ברישיון פתוח)",
        zmanimLabels: [
          "עלות השחר",
          "הנץ החמה",
          'סוף ק"ש',
          "סוף תפילה",
          "חצות יום / לילה",
          "מנחה גדולה",
          "מנחה קטנה",
          "פלג המנחה",
          "שקיעה",
          "צאת הכוכבים",
        ],
      });

      function getDynamicUiText() {
        return dynamicUiDict[CURRENT_LANG] || dynamicUiDict.he;
      }

      function getCurrentLocale() {
        return getDynamicUiText().locale;
      }

      function formatLocalizedDate(date, options) {
        return new Intl.DateTimeFormat(getCurrentLocale(), options).format(
          date,
        );
      }

      function formatLocalizedTime(value) {
        const date = value instanceof Date ? value : new Date(value);
        return isNaN(date)
          ? "--:--"
          : date.toLocaleTimeString(getCurrentLocale(), {
              hour: "2-digit",
              minute: "2-digit",
            });
      }

      function formatDaysUntilText(days) {
        const ui = getDynamicUiText();
        return days <= 0 ? ui.today : ui.inDays(days);
      }

      function updateCalendarWeekdayHeaders() {
        const headers = document.querySelectorAll(".cal-grid .cal-header");
        const labels = getDynamicUiText().weekdayHeaders;
        headers.forEach((header, index) => {
          if (labels[index]) header.textContent = labels[index];
        });
      }

      function updateCurrentCityLabel() {
        const cityNameEl = document.getElementById("current-city-name");
        if (!cityNameEl || !cityNameEl.parentElement) return;
        const ui = getDynamicUiText();
        if (GEO_LOCATION === "GPS") cityNameEl.textContent = ui.gpsCity;
        cityNameEl.parentElement.childNodes[0].nodeValue = `${ui.currentCityLabel} `;
      }

      function updateCompassStatusText() {
        const modal = document.getElementById("compass-modal");
        const status = document.getElementById("compass-status");
        const button = document.getElementById("btn-compass-permission");
        if (!modal || modal.classList.contains("hidden") || !status || !button)
          return;

        const ui = getDynamicUiText();
        button.textContent = ui.compassButton;
        if (!button.classList.contains("hidden")) {
          status.textContent = ui.compassPermission;
          return;
        }

        if (status.classList.contains("text-emerald-400")) {
          let targetLabel = ui.compassTargetJerusalem;
          if (GPS_COORDS) {
            if (isInJerusalem(GPS_COORDS.lat, GPS_COORDS.lon)) {
              targetLabel = ui.compassTargetWall;
            } else if (!isInIsrael(GPS_COORDS.lat, GPS_COORDS.lon)) {
              targetLabel = ui.compassTargetIsrael;
            }
          }
          status.textContent = ui.compassAligned(targetLabel);
          return;
        }

        status.textContent = compassListener
          ? ui.compassRotate
          : ui.compassLocating;
      }

      function refreshLiveLanguageUI() {
        document.getElementById("lang-indicator").textContent =
          CURRENT_LANG.toUpperCase();
        document.documentElement.lang = CURRENT_LANG;
        document.documentElement.dir = CURRENT_LANG === "he" ? "rtl" : "ltr";
        applyTranslations();
        updateCompassDirectionLabels();
        updateCalendarWeekdayHeaders();
        updateCurrentCityLabel();
        updateNotifStatusUI();
        updateCompassStatusText();

        const omerModal = document.getElementById("omer-modal");
        if (omerModal && !omerModal.classList.contains("hidden")) {
          document.getElementById("omer-modal-text").textContent =
            generateOmerText(CURRENT_OMER_DAY);
        }

        const calendarModal = document.getElementById("calendar-modal");
        if (calendarModal && !calendarModal.classList.contains("hidden")) {
          buildMonthCalendar();
        }

        const sefariaContent = document.getElementById("sefaria-modal-content");
        const sefariaTitle = document.getElementById("sefaria-modal-title");
        if (sefariaContent) {
          sefariaContent.classList.toggle("text-left", CURRENT_LANG !== "he");
          sefariaContent.dir = CURRENT_LANG === "he" ? "rtl" : "ltr";
        }
        if (sefariaTitle) {
          sefariaTitle.classList.toggle("text-right", CURRENT_LANG === "he");
          sefariaTitle.classList.toggle("text-left", CURRENT_LANG !== "he");
        }
      }

      function bindModalBackdropClose(modalId, closeHandler) {
        const modal = document.getElementById(modalId);
        if (!modal || modal.dataset.backdropCloseBound === "true") return;
        modal.addEventListener("click", (event) => {
          if (event.target === modal) closeHandler();
        });
        modal.dataset.backdropCloseBound = "true";
      }

      function setupModalBackdropClose() {
        bindModalBackdropClose("settings-modal", () => {
          const modal = document.getElementById("settings-modal");
          if (modal && !modal.classList.contains("hidden")) toggleSettings();
        });
        bindModalBackdropClose("omer-modal", closeOmerModal);
        bindModalBackdropClose("sefaria-modal", closeSefariaModal);
        bindModalBackdropClose("compass-modal", closeCompass);
        bindModalBackdropClose("calendar-modal", closeCalendar);
      }

      // --- Navbar Scroll Logic ---
      window.addEventListener("scroll", () => {
        const navButtons = document.querySelectorAll(".nav-action-btn");
        const isBlueTheme = document.documentElement.classList.contains("theme-blue");
        if (window.scrollY > 50) {
          navButtons.forEach((btn) => {
            btn.classList.remove(
              "bg-white/10",
              "text-white",
              "border-white/20",
              "hover:bg-white/20",
            );
            if (isBlueTheme) {
              // Blue theme scrolled: dark blue buttons visible on light content
              btn.classList.remove("bg-white/90", "text-slate-800", "border-slate-200", "hover:bg-slate-100");
              btn.classList.add(
                "bg-blue-700/90",
                "text-white",
                "border-blue-600",
                "hover:bg-blue-800",
              );
            } else {
              btn.classList.remove("bg-blue-700/90", "border-blue-600", "hover:bg-blue-800");
              btn.classList.add(
                "bg-white/90",
                "text-slate-800",
                "border-slate-200",
                "hover:bg-slate-100",
                "dark:bg-slate-800",
                "dark:text-white",
                "dark:border-slate-700",
                "dark:hover:bg-slate-700",
              );
            }
          });
        } else {
          navButtons.forEach((btn) => {
            btn.classList.add(
              "bg-white/10",
              "text-white",
              "border-white/20",
              "hover:bg-white/20",
            );
            btn.classList.remove(
              "bg-white/90",
              "text-slate-800",
              "border-slate-200",
              "hover:bg-slate-100",
              "dark:bg-slate-800",
              "dark:text-white",
              "dark:border-slate-700",
              "dark:hover:bg-slate-700",
              "bg-blue-700/90",
              "border-blue-600",
              "hover:bg-blue-800",
            );
          });
        }
      });

      // --- Modal Scroll Lock & History Management ---
      let _modalScrollLockCount = 0;
      function lockBodyScroll() {
        _modalScrollLockCount++;
        if (_modalScrollLockCount === 1) {
          document.body.style.overflow = 'hidden';
          document.body.style.touchAction = 'none';
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
          document.body.style.top = `-${window.scrollY}px`;
          document.body.dataset.scrollY = window.scrollY;
        }
      }
      function unlockBodyScroll() {
        _modalScrollLockCount = Math.max(0, _modalScrollLockCount - 1);
        if (_modalScrollLockCount === 0) {
          const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          window.scrollTo(0, scrollY);
        }
      }
      // History-based back button: push state when modal opens, pop to close
      let _activeModals = [];
      function pushModalState(modalId) {
        _activeModals.push(modalId);
        history.pushState({ modal: modalId }, '');
      }
      function removeModalById(modalId) {
        const el = document.getElementById(modalId);
        if (el) {
          if (el.classList.contains('hidden')) return;
          if (el.remove) el.remove();
          else el.classList.add('hidden');
        }
        unlockBodyScroll();
      }
      window.addEventListener('popstate', function(e) {
        if (_activeModals.length > 0) {
          const modalId = _activeModals.pop();
          // Close the specific modal
          if (modalId === 'prayer-modal' || modalId === 'tehillim-modal' || modalId === 'calendar-day-modal' || modalId === 'zman-opinions-modal') {
            const el = document.getElementById(modalId);
            if (el) el.remove();
            unlockBodyScroll();
          } else if (modalId === 'sefaria-modal') {
            closeSefariaModal();
            unlockBodyScroll();
          } else if (modalId === 'calendar-modal') {
            closeCalendar();
            unlockBodyScroll();
          } else if (modalId === 'settings-modal') {
            toggleSettings();
          } else if (modalId === 'compass-modal') {
            closeCompass();
            unlockBodyScroll();
          } else if (modalId === 'omer-modal') {
            const el = document.getElementById(modalId);
            if (el) { el.classList.add('opacity-0'); setTimeout(() => el.classList.add('hidden'), 300); }
            unlockBodyScroll();
          } else {
            removeModalById(modalId);
          }
        }
      });

      // --- Core Variables & Setup ---
      const SITE_URL = "https://jewishcalendar.netlify.app/";
      const SITE_NAME = "הלוח היהודי";
      const SITE_SHARE_TEXT =
        "מערכת חכמה לניהול זמן יהודי, זמני הלכה וסנכרון ליומן. כנס לראות:";

      const TODAY = new Date();
      let ALL_EVENTS = [];
      let CURRENT_OMER_DAY = 0;
      let GEO_LOCATION = localStorage.getItem("moadim_city") || "293918";
      let ZMANIM_METHOD = localStorage.getItem("moadim_method") || "MGA";
      let GPS_COORDS = JSON.parse(localStorage.getItem("moadim_gps")) || null;
      let compassListener = null;
      let CALENDAR_DISPLAY_DATE = new Date();
      let CURRENT_THEME = ["light", "blue"].includes(localStorage.getItem("moadim_theme"))
        ? localStorage.getItem("moadim_theme")
        : "light";
      let CURRENT_LANG = localStorage.getItem("moadim_lang") || "he";
      let CURRENT_NUSACH = localStorage.getItem("moadim_nusach") || "mizrahi";
      const DAY_NOTES_STORAGE_KEY = "moadim_day_notes";
      const FS_LABELS = ['רגיל', 'גדול', 'גדול מאוד'];

      const daysOfWeek = [
        "ראשון",
        "שני",
        "שלישי",
        "רביעי",
        "חמישי",
        "שישי",
        "שבת",
      ];
      const hebDaysLetters = [
        "",
        "א'",
        "ב'",
        "ג'",
        "ד'",
        "ה'",
        "ו'",
        "ז'",
        "ח'",
        "ט'",
        "י'",
        'י"א',
        'י"ב',
        'י"ג',
        'י"ד',
        'ט"ו',
        'ט"ז',
        'י"ז',
        'י"ח',
        'י"ט',
        "כ'",
        'כ"א',
        'כ"ב',
        'כ"ג',
        'כ"ד',
        'כ"ה',
        'כ"ו',
        'כ"ז',
        'כ"ח',
        'כ"ט',
        "ל'",
      ];
      const hebDateFormatter = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
        day: "numeric",
        month: "long",
      });

      const omerDaysWords = [
        "",
        "יוֹם אֶחָד",
        "שְׁנֵי יָמִים",
        "שְׁלֹשָׁה יָמִים",
        "אַרְבָּעָה יָמִים",
        "חֲמִשָּׁה יָמִים",
        "שִׁשָּׁה יָמִים",
        "שִׁבְעָה יָמִים",
        "שְׁמוֹנָה יָמִים",
        "תִּשְׁעָה יָמִים",
        "עֲשָׂרָה יָמִים",
        "אַחַד עָשָׂר יוֹם",
        "שְׁנֵים עָשָׂר יוֹם",
        "שְׁלֹשָׁה עָשָׂר יוֹם",
        "אַרְבָּעָה עָשָׂר יוֹם",
        "חֲמִשָּׁה עָשָׂר יוֹם",
        "שִׁשָּׁה עָשָׂר יוֹם",
        "שִׁבְעָה עָשָׂר יוֹם",
        "שְׁמוֹנָה עָשָׂר יוֹם",
        "תִּשְׁעָה עָשָׂר יוֹם",
        "עֶשְׂרִים יוֹם",
        "אֶחָד וְעֶשְׂרִים יוֹם",
        "שְׁנַיִם וְעֶשְׂרִים יוֹם",
        "שְׁלֹשָׁה וְעֶשְׂרִים יוֹם",
        "אַרְבָּעָה וְעֶשְׂרִים יוֹם",
        "חֲמִשָּׁה וְעֶשְׂרִים יוֹם",
        "שִׁשָּׁה וְעֶשְׂרִים יוֹם",
        "שִׁבְעָה וְעֶשְׂרִים יוֹם",
        "שְׁמוֹנָה וְעֶשְׂרִים יוֹם",
        "תִּשְׁעָה וְעֶשְׂרִים יוֹם",
        "שְׁלֹשִׁים יוֹם",
        "אֶחָד וּשְׁלֹשִׁים יוֹם",
        "שְׁנַיִם וּשְׁלֹשִׁים יוֹם",
        "שְׁלֹשָׁה וּשְׁלֹשִׁים יוֹם",
        "אַרְבָּעָה וּשְׁלֹשִׁים יוֹם",
        "חֲמִשָּׁה וּשְׁלֹשִׁים יוֹם",
        "שִׁשָּׁה וּשְׁלֹשִׁים יוֹם",
        "שִׁבְעָה וּשְׁלֹשִׁים יוֹם",
        "שְׁמוֹנָה וּשְׁלֹשִׁים יוֹם",
        "תִּשְׁעָה וּשְׁלֹשִׁים יוֹם",
        "אַרְבָּעִים יוֹם",
        "אֶחָד וְאַרְבָּעִים יוֹם",
        "שְׁנַיִם וְאַרְבָּעִים יוֹם",
        "שְׁלֹשָׁה וְאַרְבָּעִים יוֹם",
        "אַרְבָּעָה וְאַרְבָּעִים יוֹם",
        "חֲמִשָּׁה וְאַרְבָּעִים יוֹם",
        "שִׁשָּׁה וְאַרְבָּעִים יוֹם",
        "שִׁבְעָה וְאַרְבָּעִים יוֹם",
        "שְׁמוֹנָה וְאַרְבָּעִים יוֹם",
        "תִּשְׁעָה וְאַרְבָּעִים יוֹם",
      ];

      const omerWeeksWords = [
        "",
        "שָׁבוּעַ אֶחָד",
        "שְׁנֵי שָׁבוּעוֹת",
        "שְׁלֹשָׁה שָׁבוּעוֹת",
        "אַרְבָּעָה שָׁבוּעוֹת",
        "חֲמִשָּׁה שָׁבוּעוֹת",
        "שִׁשָּׁה שָׁבוּעוֹת",
        "שִׁבְעָה שָׁבוּעוֹת",
      ];

      const omerDaysRemainder = [
        "",
        "וְיוֹם אֶחָד",
        "וּשְׁנֵי יָמִים",
        "וּשְׁלֹשָׁה יָמִים",
        "וְאַרְבָּעָה יָמִים",
        "וַחֲמִשָּׁה יָמִים",
        "וְשִׁשָּׁה יָמִים",
      ];

      function generateOmerText(day) {
        if (day < 1 || day > 49) return "";
        let text = `הַיּוֹם ${omerDaysWords[day]} לָעֹמֶר`;
        if (day >= 7) {
          const w = Math.floor(day / 7);
          const d = day % 7;
          text = `הַיּוֹם ${omerDaysWords[day]} לָעֹמֶר, שֶׁהֵם ${omerWeeksWords[w]}`;
          if (d > 0) text += ` ${omerDaysRemainder[d]}`;
        }
        return text + ".";
      }

      function shareApp() {
        if (navigator.share) {
          navigator
            .share({ title: SITE_NAME, text: SITE_SHARE_TEXT, url: SITE_URL })
            .catch(console.error);
        } else {
          navigator.clipboard
            .writeText(`${SITE_SHARE_TEXT} ${SITE_URL}`)
            .then(() => {
              alert("הקישור הועתק ללוח בצירוף טקסט קצר. אפשר להדביק בוואטסאפ!");
            });
        }
      }

      function applyTranslations() {
        const t = i18nDict[CURRENT_LANG] || i18nDict["he"];
        document.querySelectorAll("[data-i18n-key]").forEach((el) => {
          const key = el.getAttribute("data-i18n-key");
          if (t[key]) {
            if (el.tagName === "INPUT") el.placeholder = t[key];
            else el.textContent = t[key];
          }
          return;
          // stripped stray alert
          /*
            alert("ההתראות חסומות בדפדפן. אפשר לשנות זאת בהגדרות הדפדפן.");
          */
        });
        updateCompassDirectionLabels();
      }

      async function cycleLanguage() {
        if (CURRENT_LANG === "he") CURRENT_LANG = "en";
        else if (CURRENT_LANG === "en") CURRENT_LANG = "fr";
        else CURRENT_LANG = "he";

        localStorage.setItem("moadim_lang", CURRENT_LANG);
        refreshLiveLanguageUI();
        render(
          document.querySelector(".chip.active")?.id?.replace("btn-", "") ||
            "all",
          document.getElementById("mainSearch").value,
        );
        buildMonthCalendar();
        await fetchLiveCalendarData();
      }

      function updateCompassDirectionLabels() {
        const labels =
          CURRENT_LANG === "en"
            ? { n: "N", e: "E", s: "S", w: "W" }
            : CURRENT_LANG === "fr"
              ? { n: "N", e: "E", s: "S", w: "O" }
              : { n: "צפון", e: "מזרח", s: "דרום", w: "מערב" };

        const north = document.getElementById("compass-dir-n");
        const east = document.getElementById("compass-dir-e");
        const south = document.getElementById("compass-dir-s");
        const west = document.getElementById("compass-dir-w");
        if (north) north.textContent = labels.n;
        if (east) east.textContent = labels.e;
        if (south) south.textContent = labels.s;
        if (west) west.textContent = labels.w;
      }

      function applyTheme(theme) {
        const html    = document.documentElement;
        const header  = document.getElementById("hero-section");
        const iconMoon = document.getElementById("theme-icon-moon");
        const iconSun  = document.getElementById("theme-icon-sun");
        const iconWave = document.getElementById("theme-icon-wave");
        const glowWrap = header ? header.querySelector('.absolute.inset-0.z-0') : null;
        const wavePath = document.querySelector('.wave-divider path');
        const themeMetaTag = document.querySelector('meta[name="theme-color"]');
        const nextTheme = theme === "blue" ? "blue" : "light";

        // Hide all icons
        [iconMoon, iconSun, iconWave].forEach(el => el && el.classList.add("hidden"));
        CURRENT_THEME = nextTheme;
        localStorage.setItem("moadim_theme", nextTheme);
        html.classList.remove("dark");

        if (nextTheme === "blue") {
          html.classList.add("theme-blue");
          header.classList.remove("gradient-bg");
          header.classList.add("bg-ocean-readable");
          // CSS rule `.bg-ocean-readable #stars-canvas { opacity:0 }` hides stars automatically
          if (glowWrap) glowWrap.style.opacity = '0';
          if (wavePath) wavePath.style.fill = 'rgb(248 250 252)';
          if (themeMetaTag) themeMetaTag.content = '#0284c7';
          if (iconMoon) iconMoon.classList.remove("hidden");
        } else {
          // light — default stars background
          html.classList.remove("theme-blue");
          header.classList.remove("bg-ocean-readable");
          header.classList.add("gradient-bg");
          if (glowWrap) glowWrap.style.opacity = '1';
          if (wavePath) wavePath.style.fill = 'rgb(248 250 252)';
          if (themeMetaTag) themeMetaTag.content = '#0f172a';
          if (iconWave) iconWave.classList.remove("hidden");
        }
      }

      function toggleTheme() {
        if (CURRENT_THEME === "light") CURRENT_THEME = "blue";
        else CURRENT_THEME = "light";

        localStorage.setItem("moadim_theme", CURRENT_THEME);
        applyTheme(CURRENT_THEME);
      }

      function initApp() {
        applyTheme(CURRENT_THEME);
        refreshLiveLanguageUI();
        setupModalBackdropClose();

        document.getElementById("settings-method").value = ZMANIM_METHOD;
        document.getElementById("current-city-name").textContent =
          localStorage.getItem("moadim_city_name") || "פתח תקווה";

        // ── Restore nusach ──
        const nusachEl = document.getElementById("settings-nusach");
        if (nusachEl) nusachEl.value = CURRENT_NUSACH;

        // ── Restore font size ──
        const savedFs = parseInt(localStorage.getItem("moadim_fontsize") || "0");
        applyFontSize(savedFs);
        const fsEl = document.getElementById("settings-font-size");
        if (fsEl) {
          fsEl.value = savedFs;
          const lbl = document.getElementById("font-size-label");
          if (lbl) lbl.textContent = FS_LABELS[savedFs] || "רגיל";
        }

        updateCurrentCityLabel();
        updateNotifStatusUI();

        const cachedEvents = localStorage.getItem("moadim_cached_events_v2");
        if (cachedEvents) {
          ALL_EVENTS = JSON.parse(cachedEvents);
          const cachedFull = localStorage.getItem("moadim_cached_events_full_v2");
          window.ALL_EVENTS_FULL = cachedFull ? JSON.parse(cachedFull) : null;
          const _todayY = new Date().getFullYear();
          window.FETCHED_YEARS = window.FETCHED_YEARS || new Set([_todayY - 1, _todayY, _todayY + 1]);
          showDashboard();
          render();
        }
        fetchLiveCalendarData();

        // Safety fallback: if after 14s the loading screen is still visible,
        // show the dashboard with whatever we have (avoids infinite spinner)
        setTimeout(() => {
          const ls = document.getElementById("loading-state");
          if (ls && !ls.classList.contains("hidden")) {
            console.warn("⏱ Load timeout — forcing dashboard");
            if (typeof showDashboard === "function") showDashboard();
          }
        }, 14000);
      }

      function getHebrewDateString(date) {
        try {
          return hebDateFormatter
            .format(date)
            .replace(/\d+/, (m) => hebDaysLetters[parseInt(m)] || m);
        } catch (e) {
          return "";
        }
      }

      function getApproxZmanim(date) {
        const m = date.getMonth() + 1;
        const zmanim = {
          1: { s: "17:15", e: "05:20" },
          2: { s: "17:40", e: "05:00" },
          3: { s: "18:00", e: "04:30" },
          4: { s: "19:20", e: "04:50" },
          5: { s: "19:45", e: "04:30" },
          6: { s: "20:10", e: "04:15" },
          7: { s: "20:10", e: "04:30" },
          8: { s: "19:40", e: "04:50" },
          9: { s: "18:50", e: "05:10" },
          10: { s: "18:10", e: "05:30" },
          11: { s: "17:00", e: "05:00" },
          12: { s: "16:50", e: "05:10" },
        };
        return zmanim[m] || { s: "18:00", e: "05:00" };
      }

      function getGeoParams() {
        if (GEO_LOCATION === "GPS" && GPS_COORDS)
          return `geo=pos&latitude=${GPS_COORDS.lat}&longitude=${GPS_COORDS.lon}&tzid=Asia/Jerusalem`;
        return `geonameid=${GEO_LOCATION}`;
      }

      function openOmerModal() {
        document.getElementById("omer-modal-text").textContent =
          generateOmerText(CURRENT_OMER_DAY);
        const m = document.getElementById("omer-modal");
        m.classList.remove("hidden");
        setTimeout(() => m.classList.remove("opacity-0"), 10);
      }

      function closeOmerModal() {
        const m = document.getElementById("omer-modal");
        m.classList.add("opacity-0");
        setTimeout(() => m.classList.add("hidden"), 300);
      }

      // --- Sefaria Modal Logic ---
      async function openSefariaModal(hebTitle, enRef) {
        if (!enRef) return;
        // Remove shmikra toggles if present (from previous Shnayim Mikra use)
        const existingToggles = document.getElementById("shmikra-toggles");
        if (existingToggles) existingToggles.remove();
        const ui = getDynamicUiText();
        let cleanRef = enRef.replace("Parashat ", "").replace(/ /g, "_");
        if (/\d/.test(cleanRef)) cleanRef = cleanRef.replace("_", "."); // For Daf Yomi

        const m = document.getElementById("sefaria-modal");
        document.getElementById("sefaria-modal-title").textContent =
          CURRENT_LANG === "he" ? hebTitle : enRef;
        document.getElementById("sefaria-modal-content").innerHTML =
          '<div class="animate-pulse text-center mt-10">טוען טקסט ממסד הנתונים...</div>';
        document.getElementById("sefaria-credit-link").href =
          `https://www.sefaria.org.il/${cleanRef}?lang=he`;
        document.getElementById("sefaria-modal-content").innerHTML =
          `<div class="animate-pulse text-center mt-10">${ui.sefariaLoading}</div>`;
        document.getElementById("sefaria-credit-link").textContent =
          ui.sefariaCredit;

        m.classList.remove("hidden");
        setTimeout(() => m.classList.remove("opacity-0"), 10);
        lockBodyScroll();
        pushModalState('sefaria-modal');
        // Sync font size
        applyPrayerFontSize('#sefaria-modal-content');
        document.querySelectorAll('#sefaria-font-bar .font-size-label').forEach(el => { el.textContent = _prayerFontSize + '%'; });

        try {
          const data = await fetchHebcalWithCache(
            `https://www.sefaria.org/api/texts/${cleanRef}?context=0`,
          );
          let textHtml = "";
          if (data.he && data.he.length > 0) {
            textHtml = data.he.map((p) => `<p>${p}</p>`).join("");
          } else if (data.text && data.text.length > 0) {
            textHtml = data.text
              .map((p) => `<p class="text-left" dir="ltr">${p}</p>`)
              .join("");
          } else {
            textHtml =
              "<p class='text-center text-rose-500 font-bold mt-10'>לא נמצא טקסט עבור מועד זה במאגר הפתוח.</p>";
          }
          document.getElementById("sefaria-modal-content").innerHTML = textHtml;
          applyPrayerFontSize('#sefaria-modal-content');
        } catch (e) {
          document.getElementById("sefaria-modal-content").innerHTML =
            "<p class='text-center text-rose-500 font-bold mt-10'>שגיאה בטעינת הטקסט. אנא בדוק חיבור לאינטרנט.</p>";
        }
      }

      /* ── שניים מקרא ואחד תרגום – modal with Torah + Onkelos ── */
      // Shnayim Mikra state
      let _shmikraData = { torahVerses: [], onkelosVerses: [], rashiVerses: [], parshaName: "", torahRef: "" };
      const SHMIKRA_DOUBLE_KEY = "moadim_shmikra_double";
      const SHMIKRA_RASHI_KEY = "moadim_shmikra_rashi";

      function getShmikraDouble() { return localStorage.getItem(SHMIKRA_DOUBLE_KEY) !== "false"; } // default ON
      function getShmikraRashi() { return localStorage.getItem(SHMIKRA_RASHI_KEY) === "true"; } // default OFF

      function toggleShmikraDouble() {
        const newVal = !getShmikraDouble();
        localStorage.setItem(SHMIKRA_DOUBLE_KEY, newVal ? "true" : "false");
        renderShmikraContent();
      }
      function toggleShmikraRashi() {
        const newVal = !getShmikraRashi();
        localStorage.setItem(SHMIKRA_RASHI_KEY, newVal ? "true" : "false");
        renderShmikraContent();
        // Fetch Rashi if toggled on and not yet loaded
        if (newVal && _shmikraData.rashiVerses.length === 0 && _shmikraData.parshaName) {
          fetchRashiForShmikra(_shmikraData.parshaName);
        }
      }

      async function fetchRashiForShmikra(parshaName) {
        try {
          // Use the stored Torah ref to construct proper Rashi URL
          const torahRef = _shmikraData.torahRef;
          let rashiData = null;

          if (torahRef) {
            // Try using the Torah reference directly: "Rashi on Genesis 1:1-6:8"
            const rashiRef = `Rashi on ${torahRef}`.replace(/ /g, '_');
            rashiData = await fetchHebcalWithCache(
              `https://www.sefaria.org/api/texts/${encodeURIComponent(rashiRef.replace(/_/g, ' '))}?context=0`
            );
          }

          // Fallback: try parsha name format
          if (!rashiData || !rashiData.he) {
            rashiData = await fetchHebcalWithCache(
              `https://www.sefaria.org/api/texts/Rashi_on_Parashat_${parshaName}?context=0`
            );
          }

          if (rashiData && rashiData.he) {
            // Rashi data structure: deeply nested arrays
            // [chapter][verse][comment] where comments are strings or arrays of strings
            // We need to flatten to one entry per Torah verse
            const rashiPerVerse = [];

            const processItem = (item) => {
              if (typeof item === 'string') {
                return [item];
              }
              if (Array.isArray(item)) {
                // Check if all elements are strings = this is one verse's comments
                if (item.length > 0 && item.every(x => typeof x === 'string')) {
                  return item;
                }
                // Check if this is an array of arrays (verse level or chapter level)
                if (item.length > 0 && Array.isArray(item[0])) {
                  // Check depth: is item[0][0] a string? Then item = [verse_comments, verse_comments, ...]
                  if (item[0].length > 0 && typeof item[0][0] === 'string') {
                    // Each sub-array is one verse's comments
                    item.forEach(verseComments => {
                      if (Array.isArray(verseComments)) {
                        rashiPerVerse.push(verseComments.flat(Infinity).filter(x => typeof x === 'string'));
                      } else if (typeof verseComments === 'string') {
                        rashiPerVerse.push([verseComments]);
                      } else {
                        rashiPerVerse.push([]);
                      }
                    });
                    return null; // already pushed
                  }
                  // Deeper nesting - recurse into each chapter
                  item.forEach(chapter => processItem(chapter));
                  return null;
                }
                // Mixed array - flatten strings
                const strings = item.flat(Infinity).filter(x => typeof x === 'string');
                if (strings.length > 0) return strings;
                return [];
              }
              return [];
            };

            const heData = rashiData.he;
            if (Array.isArray(heData)) {
              // Check if top level is chapters (array of arrays of arrays)
              if (heData.length > 0 && Array.isArray(heData[0]) && heData[0].length > 0 && Array.isArray(heData[0][0])) {
                // Structure: [chapter][verse][comments]
                heData.forEach(chapter => {
                  if (Array.isArray(chapter)) {
                    chapter.forEach(verse => {
                      if (Array.isArray(verse)) {
                        rashiPerVerse.push(verse.flat(Infinity).filter(x => typeof x === 'string'));
                      } else if (typeof verse === 'string') {
                        rashiPerVerse.push([verse]);
                      } else {
                        rashiPerVerse.push([]);
                      }
                    });
                  }
                });
              } else if (heData.length > 0 && Array.isArray(heData[0])) {
                // Structure: [verse][comments]
                heData.forEach(verse => {
                  if (Array.isArray(verse)) {
                    rashiPerVerse.push(verse.flat(Infinity).filter(x => typeof x === 'string'));
                  } else if (typeof verse === 'string') {
                    rashiPerVerse.push([verse]);
                  } else {
                    rashiPerVerse.push([]);
                  }
                });
              } else {
                // Flat array of strings
                rashiPerVerse.push(heData.filter(x => typeof x === 'string'));
              }
            }
            _shmikraData.rashiVerses = rashiPerVerse;
          }
          renderShmikraContent();
        } catch (e) {
          console.warn("Rashi fetch error:", e);
        }
      }

      function renderShmikraContent() {
        const el = document.getElementById("sefaria-modal-content");
        if (!el) return;
        const showDouble = getShmikraDouble();
        const showRashi = getShmikraRashi();
        const { torahVerses, onkelosVerses, rashiVerses } = _shmikraData;

        let textHtml = "";
        // Toggle bar moved to bottom (inside sefaria-font-bar area)
        const toggleBarHtml = `<div id="shmikra-toggles" style="display:flex;flex-wrap:nowrap;gap:0.5rem;align-items:center;">
          <label style="display:flex;align-items:center;gap:0.25rem;cursor:pointer;font-size:0.7rem;font-weight:700;color:#1e40af;user-select:none;white-space:nowrap;">
            <input type="checkbox" onchange="toggleShmikraDouble()" ${showDouble ? "checked" : ""} style="width:0.9rem;height:0.9rem;accent-color:#2563eb;cursor:pointer;">
            פסוק פעמיים
          </label>
          <label style="display:flex;align-items:center;gap:0.25rem;cursor:pointer;font-size:0.7rem;font-weight:700;color:#7c3aed;user-select:none;white-space:nowrap;">
            <input type="checkbox" onchange="toggleShmikraRashi()" ${showRashi ? "checked" : ""} style="width:0.9rem;height:0.9rem;accent-color:#7c3aed;cursor:pointer;">
            פירוש רש״י
          </label>
        </div>`;
        // Inject toggle bar above font bar
        const fontBar = document.getElementById("sefaria-font-bar");
        if (fontBar) {
          let existingToggles = document.getElementById("shmikra-toggles");
          if (existingToggles) existingToggles.remove();
          fontBar.insertAdjacentHTML('afterbegin', toggleBarHtml);
          fontBar.style.flexWrap = 'nowrap';
          fontBar.style.gap = '0.5rem';
          fontBar.style.justifyContent = 'center';
          fontBar.style.alignItems = 'center';
        }

        if (torahVerses.length > 0) {
          for (let i = 0; i < torahVerses.length; i++) {
            const verseNum = i + 1;
            const torahText = torahVerses[i] || "";
            const onkelosText = onkelosVerses[i] || "";

            textHtml += `<div class="shmikra-verse" style="margin-bottom:1.2em;padding:0.8em;border-radius:0.5em;border:1px solid rgba(0,0,0,0.06);background:rgba(0,0,0,0.02);">`;
            textHtml += `<div style="font-size:0.7em;color:#2563eb;margin-bottom:0.3em;font-weight:bold;">פסוק ${verseNum}</div>`;
            // Torah text - first reading
            textHtml += `<p style="line-height:1.9;margin:0 0 0.4em 0;color:#1a1a1a;font-size:1.2em;">${torahText}</p>`;
            // Torah text - second reading (shnayim mikra)
            if (showDouble) {
              textHtml += `<p style="line-height:1.9;margin:0 0 0.4em 0;color:#374151;font-size:1.2em;opacity:0.75;">${torahText}</p>`;
            }
            // Targum Onkelos
            if (onkelosText) {
              textHtml += `<p style="line-height:1.9;margin:0;color:#92400e;font-size:1.1em;padding-right:0.5em;border-right:3px solid rgba(146,64,14,0.3);">
                <span style="font-size:0.7em;color:#b45309;font-weight:bold;">תרגום אונקלוס: </span>${onkelosText}
              </p>`;
            }
            // Rashi commentary
            if (showRashi && rashiVerses && rashiVerses[i] && rashiVerses[i].length > 0) {
              const rashiComments = rashiVerses[i];
              textHtml += `<div style="margin-top:0.5em;padding:0.6em 0.7em;border-radius:0.5em;background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.12);">
                <div style="font-size:0.65em;color:#7c3aed;font-weight:bold;margin-bottom:0.3em;">רש״י:</div>
                ${rashiComments.map(c => `<p style="line-height:1.8;margin:0 0 0.3em 0;color:#4c1d95;font-size:0.95em;">${c}</p>`).join("")}
              </div>`;
            } else if (showRashi && rashiVerses.length === 0) {
              if (i === 0) {
                textHtml += `<div style="margin-top:0.4rem;font-size:0.75rem;color:#7c3aed;font-style:italic;">טוען פירוש רש״י...</div>`;
              }
            }
            textHtml += `</div>`;
          }
        } else {
          textHtml += "<p class='text-center text-rose-500 font-bold mt-10'>לא נמצא טקסט עבור פרשה זו.</p>";
        }
        el.innerHTML = textHtml;
        // Re-apply font size after content render
        applyPrayerFontSize('#sefaria-modal-content');
      }

      async function openShnayimMikraModal(hebTitle, enRef) {
        if (!enRef) return;
        const parshaName = enRef.replace(/^Parashat\s+/, "").replace(/ /g, "_");

        const m = document.getElementById("sefaria-modal");
        document.getElementById("sefaria-modal-title").textContent =
          CURRENT_LANG === "he" ? `שניים מקרא ואחד תרגום – ${hebTitle}` : `Shnayim Mikra – ${enRef}`;
        document.getElementById("sefaria-modal-content").innerHTML =
          '<div class="animate-pulse text-center mt-10">טוען מקרא ותרגום אונקלוס...</div>';
        document.getElementById("sefaria-credit-link").href =
          `https://www.sefaria.org.il/Parashat_${parshaName}?lang=he`;
        document.getElementById("sefaria-credit-link").textContent =
          CURRENT_LANG === "he" ? "הטקסט באדיבות Sefaria.org (ברישיון פתוח)" : "View on Sefaria";

        m.classList.remove("hidden");
        setTimeout(() => m.classList.remove("opacity-0"), 10);
        lockBodyScroll();
        pushModalState('sefaria-modal');
        // Sync font size
        applyPrayerFontSize('#sefaria-modal-content');
        document.querySelectorAll('#sefaria-font-bar .font-size-label').forEach(el => { el.textContent = _prayerFontSize + '%'; });

        try {
          const torahData = await fetchHebcalWithCache(
            `https://www.sefaria.org/api/texts/Parashat_${parshaName}?context=0`
          );
          if (!torahData || !torahData.ref) throw new Error("No parsha data");

          const bookName = torahData.ref.split(" ")[0];
          const onkelosRef = `Onkelos_${bookName},_${parshaName}`;
          const onkelosData = await fetchHebcalWithCache(
            `https://www.sefaria.org/api/texts/${onkelosRef}?context=0`
          );

          const flattenVerses = (arr) => {
            if (!arr) return [];
            const result = [];
            const flatten = (a) => { if (Array.isArray(a)) { a.forEach(v => flatten(v)); } else { result.push(a); } };
            flatten(arr);
            return result;
          };

          _shmikraData = {
            torahVerses: flattenVerses(torahData.he),
            onkelosVerses: flattenVerses(onkelosData?.he),
            rashiVerses: [],
            parshaName: parshaName,
            torahRef: torahData.ref || ""
          };

          renderShmikraContent();

          // If Rashi is enabled, fetch it
          if (getShmikraRashi()) {
            fetchRashiForShmikra(parshaName);
          }
        } catch (e) {
          console.error("Shnayim Mikra error:", e);
          document.getElementById("sefaria-modal-content").innerHTML =
            "<p class='text-center text-rose-500 font-bold mt-10'>שגיאה בטעינת המקרא והתרגום. אנא בדוק חיבור לאינטרנט.</p>";
        }
      }

      function closeSefariaModal() {
        const m = document.getElementById("sefaria-modal");
        if (!m) return;
        m.classList.add("opacity-0");
        setTimeout(() => m.classList.add("hidden"), 300);
        unlockBodyScroll();
        if (_activeModals[_activeModals.length - 1] === 'sefaria-modal') {
          _activeModals.pop();
          history.back();
        }
      }

      /* ── KosherZmanim helper ─────────────────────────────────── */
      function getLocationCoords() {
        // Try GPS first
        if (GEO_LOCATION === "GPS" && GPS_COORDS) {
          return { lat: GPS_COORDS.lat, lon: GPS_COORDS.lon, tzid: "Asia/Jerusalem", elevation: GPS_COORDS.elevation || 0 };
        }
        // Try cached city coords
        const cached = window._cityCoords || (localStorage.getItem("moadim_city_coords") ? JSON.parse(localStorage.getItem("moadim_city_coords")) : null);
        if (cached) {
          window._cityCoords = cached;
          return cached;
        }
        // Default: Petach Tikva (geonameid 293918) — elevation 54m per KosherJava reference
        return { lat: 32.08707, lon: 34.88747, tzid: "Asia/Jerusalem", elevation: 54 };
      }

      function computeKosherZmanim(dateObj) {
        const coords = getLocationCoords();
        const KZ = window.KosherZmanim;
        if (!KZ) { console.warn("KosherZmanim library not loaded"); return null; }

        try {
          // Use ComplexZmanimCalendar for all opinion variants
          const geoLoc = new KZ.GeoLocation(
            "UserLocation",
            coords.lat,
            coords.lon,
            coords.elevation || 0,
            coords.tzid || "Asia/Jerusalem"
          );
          const cal = new KZ.ComplexZmanimCalendar(geoLoc);

          // setDate accepts native Date, ISO string, Luxon DateTime, or timestamp
          const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,"0")}-${String(dateObj.getDate()).padStart(2,"0")}`;
          cal.setDate(dateStr);

          const toIso = (d) => {
            if (!d) return null;
            try {
              if (d instanceof Date) return d.toISOString();
              if (typeof d.toJSDate === "function") return d.toJSDate().toISOString();
              if (typeof d.toDate === "function") return d.toDate().toISOString();
              const s = String(d);
              const p = new Date(s);
              return isNaN(p) ? null : p.toISOString();
            } catch(e) { return null; }
          };

          // Build times object matching HebCal field names
          const times = {};
          try { times.alotHaShachar = toIso(cal.getAlos72()); } catch(e) {}
          try { times.misheyakir = toIso(cal.getMisheyakir11Point5Degrees()); } catch(e) {}
          try { times.misheyakirMachmir = toIso(cal.getMisheyakir11Degrees()); } catch(e) {}
          try { times.misheyakir10_2 = toIso(cal.getMisheyakir10Point2Degrees()); } catch(e) {}
          // Use elevation-adjusted sunrise if elevation > 0
          try {
            if (coords.elevation > 0 && typeof cal.getSunriseOffsetByDegrees === 'function') {
              // getElevationAdjustedSunrise is available in newer versions
              const seaLevelSunrise = cal.getSeaLevelSunrise ? toIso(cal.getSeaLevelSunrise()) : null;
              times.sunrise = toIso(cal.getSunrise());
              times.seaLevelSunrise = seaLevelSunrise;
            } else {
              times.sunrise = toIso(cal.getSunrise());
            }
          } catch(e) { try { times.sunrise = toIso(cal.getSunrise()); } catch(e2) {} }
          try { times.sofZmanShmaMGA = toIso(cal.getSofZmanShmaMGA()); } catch(e) {}
          try { times.sofZmanShma = toIso(cal.getSofZmanShmaGRA()); } catch(e) {}
          try { times.sofZmanTfillaMGA = toIso(cal.getSofZmanTfilaMGA()); } catch(e) {}
          try { times.sofZmanTfilla = toIso(cal.getSofZmanTfilaGRA()); } catch(e) {}
          try { times.chatzot = toIso(cal.getChatzos()); } catch(e) {}
          try { times.minchaGedola = toIso(cal.getMinchaGedola()); } catch(e) {}
          try { times.minchaGedola72Min = toIso(cal.getMinchaGedola72Minutes()); } catch(e) {}
          try { times.minchaKetana = toIso(cal.getMinchaKetana()); } catch(e) {}
          try { times.plagHaMincha = toIso(cal.getPlagHamincha()); } catch(e) {}
          try {
            times.plagHaMinchaGRA = toIso(cal.getPlagHaminchaBaalHatanya()) || times.plagHaMincha;
          } catch(e) { times.plagHaMinchaGRA = times.plagHaMincha; }
          try { times.sunset = toIso(cal.getSunset()); } catch(e) {}
          try { times.seaLevelSunset = toIso(cal.getSeaLevelSunset()); } catch(e) { times.seaLevelSunset = times.sunset; }
          try { times.tzeit7083deg = toIso(cal.getTzaisGeonim7Point083Degrees()); } catch(e) {}
          try { if (!times.tzeit7083deg) times.tzeit7083deg = toIso(cal.getTzais72()); } catch(e) {}
          try { times.tzeit50min = toIso(cal.getTzais50()); } catch(e) {}
          // tzeit 13.5 zmanit minutes: sunset + 13.5/60 of a shaah zmanit
          try {
            if (times.sunrise && times.sunset) {
              const srMs = new Date(times.sunrise).getTime();
              const ssMs = new Date(times.sunset).getTime();
              const shaahZmanit = (ssMs - srMs) / 12;
              times.tzeit13Point5MinutesZmanis = new Date(ssMs + (13.5 / 60) * shaahZmanit).toISOString();
            }
          } catch(e) {}
          try { times.chatzotNight = toIso(cal.getSolarMidnight()); } catch(e) {}
          // Bein HaShmashos: RT 2 stars (matches KosherJava app)
          try { times.beinHaShmashos = toIso(cal.getBainHashmashosRT2Stars()); } catch(e) {
            try { times.beinHaShmashos = toIso(cal.getBainHashmashosRT13Point24Degrees()); } catch(e2) {}
          }
          // Tzeit at 8.5° = Lailah (night per KosherJava app)
          try { times.tzeit8_5deg = toIso(cal.getTzaisGeonim8Point5Degrees()); } catch(e) {
            try { times.tzeit8_5deg = toIso(cal.getSunsetOffsetByDegrees(98.5)); } catch(e2) {}
          }

          // Candle lighting: per KosherJava, uses SEA-LEVEL sunset (not elevation-adjusted)
          // Offset: 40 min Jerusalem, 20 min Israel, 18 min abroad
          const isJerusalem = typeof isInJerusalem === "function" && isInJerusalem(coords.lat, coords.lon);
          const isIsrael = coords.lat >= 29.4 && coords.lat <= 33.5 && coords.lon >= 34.2 && coords.lon <= 35.9;
          const candleOffset = isJerusalem ? 40 : (isIsrael ? 20 : 18);
          const candleSunset = times.seaLevelSunset || times.sunset;
          if (candleSunset) {
            const sunsetMs = new Date(candleSunset).getTime();
            times.candleLighting = new Date(sunsetMs - candleOffset * 60000).toISOString();
          }

          return { times };
        } catch(e) {
          console.warn("computeKosherZmanim error:", e);
          return null;
        }
      }

      /* Resolve coordinates from GeoNameId if not yet cached */
      async function ensureCityCoords() {
        if (GEO_LOCATION === "GPS" && GPS_COORDS) return;
        if (window._cityCoords) return;
        const cached = localStorage.getItem("moadim_city_coords");
        if (cached) { window._cityCoords = JSON.parse(cached); return; }

        // Fetch from HebCal to get coordinates for the geonameid
        try {
          const now = new Date();
          const todayIso = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
          const res = await fetch(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${GEO_LOCATION}&date=${todayIso}`, { signal: AbortSignal.timeout(8000) });
          const data = await res.json();
          if (data.location) {
            const cityCoords = {
              lat: data.location.latitude,
              lon: data.location.longitude,
              tzid: data.location.timezone || "Asia/Jerusalem",
              elevation: data.location.elevation || 0
            };
            localStorage.setItem("moadim_city_coords", JSON.stringify(cityCoords));
            window._cityCoords = cityCoords;
          }
        } catch(e) {
          console.warn("Could not resolve city coords:", e);
        }
      }

      async function fetchLiveCalendarData() {
        try {
          const now = new Date();
          const ui = getDynamicUiText();

          const todayDateUI = new Date();
          const gy = todayDateUI.getFullYear();
          const gm = String(todayDateUI.getMonth() + 1).padStart(2, "0");
          const gd = String(todayDateUI.getDate()).padStart(2, "0");
          const todayLocalIso = `${gy}-${gm}-${gd}`;

          const prevDate = new Date(todayDateUI);
          prevDate.setDate(prevDate.getDate() - 1);
          const nextDate = new Date(todayDateUI);
          nextDate.setDate(nextDate.getDate() + 1);
          const prevIso = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
          const nextIso = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;

          // Compute zmanim locally via KosherZmanim (primary source)
          await ensureCityCoords();
          let zData, prevZData, nextZData;
          let zmanimSource = "hebcal";
          const kzToday = computeKosherZmanim(todayDateUI);
          const kzPrev  = computeKosherZmanim(prevDate);
          const kzNext  = computeKosherZmanim(nextDate);

          if (kzToday && kzToday.times && kzToday.times.sunrise) {
            zData = kzToday;
            prevZData = kzPrev || { times: {} };
            nextZData = kzNext || { times: {} };
            zmanimSource = "kosher-zmanim";
            /* KosherZmanim computed successfully — silent in production */
          } else {
            // Fallback to HebCal API only if kosher-zmanim library failed to load
            console.warn("⚠ KosherZmanim library not available, falling back to HebCal API. KZ loaded:", !!window.KosherZmanim);
            [zData, prevZData, nextZData] = await Promise.all([
              fetchHebcalWithCache(
                `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${todayLocalIso}`,
              ),
              fetchHebcalWithCache(
                `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${prevIso}`,
              ),
              fetchHebcalWithCache(
                `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${nextIso}`,
              ),
            ]);
          }
          window._zmanimSource = zmanimSource;
          const srcBadge = document.getElementById("zmanim-source-badge");
          if (srcBadge) srcBadge.textContent = zmanimSource === "kosher-zmanim" ? "KosherJava" : "HebCal";
          zData._prevDay = prevZData;
          zData._nextDay = nextZData;
          zData._dateIso = todayLocalIso;
          const tzeitStr = zData.times.tzeit7083deg;

          let isAfterTzeit = false;
          if (tzeitStr && now >= new Date(tzeitStr)) {
            isAfterTzeit = true;
          }

          let hebrewDateFetchIso = todayLocalIso;
          let dateForHebcal = new Date();
          dateForHebcal.setHours(0, 0, 0, 0);

          if (isAfterTzeit) {
            dateForHebcal.setDate(dateForHebcal.getDate() + 1);
            const ty = dateForHebcal.getFullYear();
            const tm = String(dateForHebcal.getMonth() + 1).padStart(2, "0");
            const td = String(dateForHebcal.getDate()).padStart(2, "0");
            hebrewDateFetchIso = `${ty}-${tm}-${td}`;
          }

          const dateData = await fetchHebcalWithCache(
            `https://www.hebcal.com/converter?cfg=json&date=${hebrewDateFetchIso}&g2h=1&strict=1`,
          );
          window._livePrayerContextData = {
            dateData,
            hebrewDateFetchIso,
            todayLocalIso,
            displayDate: new Date(dateForHebcal),
          };

          document.getElementById("stat-today").textContent =
            CURRENT_LANG === "he"
              ? dateData.hebrew
              : getHebrewDateString(dateForHebcal) || dateData.hebrew;

          document.getElementById("stat-today-gregorian").textContent =
            todayDateUI.toLocaleDateString(getCurrentLocale(), {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

          CURRENT_OMER_DAY = 0;
          (dateData.events || []).forEach((e) => {
            if (e.includes("Omer")) {
              const match = e.match(/(\d+)/);
              if (match && !isNaN(parseInt(match[1]))) {
                CURRENT_OMER_DAY = parseInt(match[1]);
              }
            }
          });

          const omerContainer = document.getElementById("omer-container");
          if (CURRENT_OMER_DAY > 0 && CURRENT_OMER_DAY <= 49) {
            omerContainer.classList.remove("hidden");
            omerContainer.classList.add("flex");
            document.getElementById("omer-day-num").textContent =
              CURRENT_OMER_DAY;
            if (typeof updateOmerRing === 'function') updateOmerRing(CURRENT_OMER_DAY);
            document.getElementById("omer-full-text").textContent =
              `היום ${omerDaysWords[CURRENT_OMER_DAY]} לעומר`;

            let desc = "";
            if (CURRENT_OMER_DAY >= 7) {
              const w = Math.floor(CURRENT_OMER_DAY / 7);
              const d = CURRENT_OMER_DAY % 7;
              desc = `שהם ${omerWeeksWords[w]}`;
              if (d > 0) desc += ` ${omerDaysRemainder[d]}`;
              desc += ".";
            }
            document.getElementById("omer-weeks").textContent = desc;
          } else {
            omerContainer.classList.add("hidden");
            omerContainer.classList.remove("flex");
          }

          const dafData = await fetchHebcalWithCache(
            `https://www.hebcal.com/hebcal?v=1&cfg=json&F=on&start=${hebrewDateFetchIso}&end=${hebrewDateFetchIso}`,
          );
          const dafEvent = (dafData.items || []).find(
            (i) => i.category === "dafyomi",
          );
          if (dafEvent) {
            const displayDaf =
              CURRENT_LANG === "he"
                ? dafEvent.hebrew.replace("דף יומי: ", "")
                : dafEvent.title;
            document.getElementById("daf-yomi-text").textContent = displayDaf;
            document.getElementById("daf-yomi-link").onclick = (e) => {
              e.preventDefault();
              openSefariaModal(displayDaf, dafEvent.title);
            };
          }

          renderZmanimGrid(zData);

          const sData = await fetchHebcalWithCache(
            `https://www.hebcal.com/shabbat?cfg=json&${getGeoParams()}&m=50&date=${todayLocalIso}`,
          );
          let p = CURRENT_LANG === "he" ? "שבת" : "Shabbat",
            c = "--:--",
            h = "--:--",
            eTitle = "";

          const formatTimeStr = (iso) => {
            if (!iso) return "--:--";
            const d = new Date(iso);
            return isNaN(d)
              ? "--:--"
              : d.toLocaleTimeString(getCurrentLocale(), {
                  hour: "2-digit",
                  minute: "2-digit",
                });
          };

          if (sData && sData.items) {
            sData.items.forEach((i) => {
              if (i.category === "parashat") {
                p = CURRENT_LANG === "he" ? i.hebrew : i.title;
                eTitle = i.title;
              }
              if (
                i.category === "candles" &&
                i.title &&
                i.title.includes("Candle")
              ) {
                window.SHABBAT_CANDLES_TIME = new Date(i.date);
                c = formatTimeStr(i.date);
              }
              if (i.category === "havdalah") h = formatTimeStr(i.date);
            });
          }

          // Override candle lighting & havdalah with KosherZmanim if available
          try {
            const today = new Date(todayDateUI);
            const dow = today.getDay(); // 0=Sun
            // Find this week's Friday (for candle lighting)
            const friday = new Date(today);
            friday.setDate(today.getDate() + ((5 - dow + 7) % 7));
            const kzFriday = computeKosherZmanim(friday);
            if (kzFriday && kzFriday.times && kzFriday.times.candleLighting) {
              c = formatTimeStr(kzFriday.times.candleLighting);
              window.SHABBAT_CANDLES_TIME = new Date(kzFriday.times.candleLighting);
            }
            // Havdalah: Saturday tzeit
            const saturday = new Date(friday);
            saturday.setDate(friday.getDate() + 1);
            const kzSat = computeKosherZmanim(saturday);
            if (kzSat && kzSat.times && kzSat.times.tzeit7083deg) {
              h = formatTimeStr(kzSat.times.tzeit7083deg);
            }
          } catch(e) { console.warn("KZ Shabbat times:", e); }
          document.getElementById("stat-parasha").textContent = p;
          window._openShabbatParasha = () => openSefariaModal(p, eTitle);
          // Store for Shabbat info popup
          window.SHABBAT_CANDLES_STR  = c;
          window.SHABBAT_HAVDALAH_STR = h;
          window.SHABBAT_PARASHA_NAME  = p;
          window.SHABBAT_PARASHA_ETITLE = eTitle;

          /* ── שניים מקרא ואחד תרגום ── */
          const smEl = document.getElementById("shnayim-mikra-text");
          const smBtn = document.getElementById("shnayim-mikra-link");
          if (smEl && eTitle) {
            const smDisplay = CURRENT_LANG === "he" ? p : eTitle;
            smEl.textContent = smDisplay;
            if (smBtn) {
              smBtn.onclick = (e) => {
                e.preventDefault();
                openShnayimMikraModal(smDisplay, eTitle);
              };
            }
          } else if (smEl) {
            smEl.textContent = p;
          }
          const shabbatWrap = document.getElementById("stat-shabbat-times");
          if (shabbatWrap) {
            shabbatWrap.innerHTML = `
              <div class="dashboard-shabbat-line">
                <span class="dashboard-shabbat-label">כניסת שבת</span>
                <span id="shabbat-enter" class="dashboard-shabbat-value" dir="ltr">${c}</span>
              </div>
              <div class="dashboard-shabbat-line">
                <span class="dashboard-shabbat-label">יציאת שבת</span>
                <span id="shabbat-exit" class="dashboard-shabbat-value" dir="ltr">${h}</span>
              </div>
            `;
          }

          const cy = dateForHebcal.getFullYear();
          const [y0, y1, y2] = await Promise.all([
            fetchHebcalWithCache(
              `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${cy - 1}&i=on&maj=on&min=on&nx=on&mf=on&ss=on&mod=on&s=on`,
            ),
            fetchHebcalWithCache(
              `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${cy}&i=on&maj=on&min=on&nx=on&mf=on&ss=on&mod=on&s=on`,
            ),
            fetchHebcalWithCache(
              `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${cy + 1}&i=on&maj=on&min=on&nx=on&mf=on&ss=on&mod=on&s=on`,
            ),
          ]);

          let newEvents = [];
          const rcCounts = {};
          [...(y0.items||[]), ...y1.items, ...y2.items].forEach((ev) => {
            if (ev.category === "roshchodesh") {
              const _rcKey = ev.hebrew + '_' + ev.date.substring(0, 7);
              rcCounts[_rcKey] = (rcCounts[_rcKey] || 0) + 1;
            }
          });

          [...(y0.items||[]), ...y1.items, ...y2.items].forEach((ev) => {
            const eventDate = new Date(ev.date);
            eventDate.setHours(0, 0, 0, 0);

            const forbidden = [
              // Removed from display: political/minor national figures
              "Herzl",
              "Rabin",
              "Aliyah",
              "Family",        // חג הבנות
              "Sigd",
              "Zionism",
              "Jabotinsky",
              "Ben-Gurion",    // יום בן-גוריון
              "Ben Gurion",
              "הרצל",
              "רבין",
              "סיגד",
              "ז'בוטינסקי",
              "בן-גוריון",
              "חג הבנות",
            ];
            if (
              forbidden.some(
                (w) =>
                  (ev.title && ev.title.includes(w)) ||
                  (ev.hebrew && ev.hebrew.includes(w)),
              )
            )
              return;

            let type = "minor",
              icon = "📅";

            // Identify Holiday Candles for Push Notifications
            if (
              ev.category === "candles" &&
              ev.date.startsWith(todayLocalIso)
            ) {
              if (new Date(ev.date).getDay() !== 5) {
                window.HOLIDAY_CANDLES_TIME = new Date(ev.date);
              }
            }

            if (ev.category === "roshchodesh") {
              const _rcMonthName = ev.hebrew.replace("ראש חודש ", "").split(" (")[0].trim();
              let rcName = CURRENT_LANG === "he" ? `ראש חודש ${_rcMonthName}` : ev.title;
              const _rcKeyCheck = ev.hebrew + '_' + ev.date.substring(0, 7);
              if (rcCounts[_rcKeyCheck] > 1) {
                const countSoFar = newEvents.filter(
                  (x) => x.originalName === ev.hebrew && x.date.substring(0, 7) === ev.date.substring(0, 7),
                ).length;
                rcName =
                  CURRENT_LANG === "he"
                    ? `${countSoFar === 0 ? "א'" : "ב'"} ראש חודש ${_rcMonthName}`
                    : `${ev.title} Day ${countSoFar + 1}`;
              }

              if (
                !newEvents.some((x) => x.name === rcName && x.date === ev.date)
              ) {
                newEvents.push({
                  name: rcName,
                  originalName: ev.hebrew,
                  date: ev.date,
                  type: "rosh-chodesh",
                  heb: rcName,
                  icon: "🌑",
                });
              }

              {
                const startL = new Date(ev.date);
                startL.setDate(startL.getDate() + 7);
                const endL = new Date(ev.date);
                endL.setDate(endL.getDate() + 14);

                if (endL >= dateForHebcal) {
                  const name =
                    CURRENT_LANG === "he"
                      ? `קידוש לבנה - ${ev.hebrew.replace("ראש חודש ", "").split(" (")[0].trim()}`
                      : `Kiddush Levana - ${ev.title}`;
                  // Helper: local YYYY-MM-DD (avoids UTC-offset date-shift bug)
                  const toLocalISO = (d) => {
                    const y = d.getFullYear();
                    const mo = String(d.getMonth() + 1).padStart(2, '0');
                    const dy = String(d.getDate()).padStart(2, '0');
                    return `${y}-${mo}-${dy}`;
                  };
                  const dStr =
                    startL > dateForHebcal
                      ? toLocalISO(startL)
                      : toLocalISO(dateForHebcal);

                  if (
                    !newEvents.some((x) => x.name === name && x.type === "moon")
                  ) {
                    const startZman = getApproxZmanim(startL).s;
                    const endZman = getApproxZmanim(endL).e;
                    window.LEVANA_START_DATE = toLocalISO(startL);
                    window.LEVANA_END_DATE = toLocalISO(endL);

                    const levanaHTML = `
                        <div class="mt-2.5 flex flex-col gap-1.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-emerald-400"></div><span class="font-bold text-slate-700 dark:text-slate-300">תחילת זמן:</span> ${daysOfWeek[startL.getDay()]} | ${getHebrewDateString(startL)}</div><span class="font-black text-emerald-600 dark:text-emerald-400 ml-2 text-left" dir="ltr">${startZman}</span></div>
                            <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-rose-400"></div><span class="font-bold text-slate-700 dark:text-slate-300">סוף זמן:</span> ${daysOfWeek[endL.getDay()]} | ${getHebrewDateString(endL)}</div><span class="font-black text-rose-600 dark:text-rose-400 ml-2 text-left" dir="ltr">${endZman}</span></div>
                        </div>`;

                    newEvents.push({
                      name: name,
                      date: dStr,
                      endDate: toLocalISO(endL),
                      type: "moon",
                      heb:
                        startL > dateForHebcal
                          ? "זמן הברכה יתחיל בקרוב"
                          : "ניתן לברך כעת",
                      icon: "🌙",
                      levanaString: levanaHTML,
                    });
                  }
                }
              }
              return;
            }

            if (ev.category === "fast" || /Tzom|Ta'anit|Tisha/.test(ev.title)) {
              type = "fast";
              icon = "⚖️";
            } else if (ev.category === "holiday") {
              type = ev.subcat === "major" ? "major" : "minor";
              if (ev.title.includes("Pesach")) icon = "🍷";
              else if (ev.title.includes("Rosh Hashana")) icon = "🍎";
              else if (ev.title.includes("Yom Kippur")) {
                icon = "🕊️";
                type = "fast";
              } else if (ev.title.includes("Sukkot")) icon = "🌿";
              else if (ev.title.includes("Hanukkah")) icon = "🕎";
              else if (ev.title.includes("Purim")) icon = "🎭";
              else if (ev.title.includes("Shavuot")) icon = "📜";
              else if (ev.title.includes("Lag B'Omer")) icon = "🔥";
              else if (ev.title.includes("Tu B'Av")) icon = "💖";
              else if (ev.title.includes("Tu BiShvat")) icon = "🌳";
            } else if (ev.category === "modern" || ev.category === "israel") {
              // ימי זיכרון ואירועים לאומיים
              type = "minor";
              if (ev.title.includes("Shoah") || (ev.hebrew && ev.hebrew.includes("שואה"))) {
                icon = "🕯️"; type = "fast";
              } else if (ev.title.includes("Zikaron") || (ev.hebrew && ev.hebrew.includes("זיכרון"))) {
                icon = "🪖"; type = "fast";
              } else if (ev.title.includes("Atzmaut") || (ev.hebrew && ev.hebrew.includes("עצמאות"))) {
                icon = "🇮🇱"; type = "major";
              } else {
                icon = "📅";
              }
            } else if (ev.category === "parashat") {
              type = "parashat";
              icon = "📖";
            } else return;

            const evName = CURRENT_LANG === "he" ? ev.hebrew : ev.title;
            if (
              !newEvents.some((x) => x.name === evName && x.date === ev.date)
            ) {
              newEvents.push({
                name: evName,
                date: ev.date,
                type: type,
                heb: ev.hebrew,
                icon: icon,
                titleStr: ev.title,
              });
            }
          });

          ALL_EVENTS = newEvents
            .filter((e) => {
              // For moon events keep them visible until the window *closes* (endDate),
              // not just until it opens (date). For all other events use date as usual.
              const compareDate = (e.type === "moon" && e.endDate) ? e.endDate : e.date;
              return new Date(compareDate).setHours(0, 0, 0, 0) >= dateForHebcal.getTime();
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          window.ALL_EVENTS_FULL = [...newEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
          window.FETCHED_YEARS = new Set([cy - 1, cy, cy + 1]);
          localStorage.setItem(
            "moadim_cached_events_v2",
            JSON.stringify(ALL_EVENTS),
          );
          localStorage.setItem(
            "moadim_cached_events_full_v2",
            JSON.stringify(window.ALL_EVENTS_FULL),
          );

          showDashboard();

          const nextH = ALL_EVENTS.find(
            (e) => e.type === "major" || e.type === "fast",
          );
          if (nextH) {
            window._nextMoadName = nextH.name;
            document.getElementById("stat-next").innerHTML =
              `${nextH.name} <br><span class="text-sm font-normal opacity-80">(בעוד ${getDaysDiff(nextH.date)} ימים)</span>`;
          }

          const nextM = ALL_EVENTS.find((e) => e.type === "moon");
          if (nextM) {
            const moonWindowOpen = nextM.heb === "ניתן לברך כעת";
            if (moonWindowOpen && nextM.endDate) {
              const daysToEnd = getDaysDiff(nextM.endDate);
              document.getElementById("stat-moon").innerHTML =
                `${nextM.name.replace("קידוש לבנה - ", "")} <br><span class="text-sm font-normal opacity-80" style="color:#fbbf24">(סוף זמן בעוד ${daysToEnd} ימים)</span>`;
            } else {
              document.getElementById("stat-moon").innerHTML =
                `${nextM.name.replace("קידוש לבנה - ", "")} <br><span class="text-sm font-normal opacity-80">(בעוד ${getDaysDiff(nextM.date)} ימים)</span>`;
            }
          }

          if (nextH && CURRENT_LANG !== "he") {
            document.getElementById("stat-next").innerHTML =
              `${nextH.name} <br><span class="text-sm font-normal opacity-80">(${formatDaysUntilText(getDaysDiff(nextH.date))})</span>`;
          }
          if (nextM && CURRENT_LANG !== "he") {
            const moonWindowOpen2 = nextM.heb === "ניתן לברך כעת";
            if (moonWindowOpen2 && nextM.endDate) {
              const daysToEnd2 = getDaysDiff(nextM.endDate);
              document.getElementById("stat-moon").innerHTML =
                `${nextM.name.replace("Kiddush Levana - ", "")} <br><span class="text-sm font-normal opacity-80" style="color:#fbbf24">(End of window in ${daysToEnd2} days)</span>`;
            } else {
              document.getElementById("stat-moon").innerHTML =
                `${nextM.name.replace("Kiddush Levana - ", "")} <br><span class="text-sm font-normal opacity-80">(${formatDaysUntilText(getDaysDiff(nextM.date))})</span>`;
            }
          }
          render();
          buildMonthCalendar();
        } catch (err) {
          console.error(err);
          if (ALL_EVENTS.length === 0)
            document.getElementById("loading-state").innerHTML =
              '<p class="text-red-400 font-bold">לא ניתן למשוך נתונים כעת. בדוק חיבור אינטרנט.</p>';
        }
      }

      function showDashboard() {
        document.getElementById("loading-state").classList.add("hidden");
        const dash = document.getElementById("dashboard-state");
        const banner = document.getElementById("halacha-banner");
        const btn = document.getElementById("btn-open-calendar");
        const prayerWrap = document.getElementById("prayer-grid-wrap");
        dash.classList.remove("hidden");
        banner.classList.remove("hidden");
        banner.classList.add("flex");
        btn.classList.remove("hidden");
        btn.classList.add("flex");
        if (prayerWrap) { prayerWrap.classList.remove("hidden"); }
        setTimeout(() => {
          dash.classList.remove("opacity-0");
          banner.classList.remove("opacity-0");
          btn.classList.remove("opacity-0");
          if (prayerWrap) prayerWrap.classList.remove("opacity-0");
        }, 50);
      }

      // ══════════════════════════════════════════════════
      // ✦  PRAYER GRID — EMBEDDED TEXTS + SEASON AWARE
      // ══════════════════════════════════════════════════

      // ── Detect current Hebrew season ──────────────────
      function getHebrewSeasonInfo() {
        const now = new Date();
        const heb = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long', day: 'numeric' }).format(now);
        const month = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(now);
        const day   = parseInt(new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(now));
        const dow   = now.getDay(); // 0=Sun … 6=Sat

        // Detect season flags
        const isShabbat   = dow === 6;
        const isRoshChodesh = heb.includes('א׳') || heb.includes('ב׳') || day === 1 || day === 30;
        const isChanukah  = month.includes('כסלו') || month.includes('טבת');
        const isPurim     = month.includes('אדר') && (day === 13 || day === 14 || day === 15);
        const isPesach    = month.includes('ניסן') && day >= 15 && day <= 22;
        const isShavuot   = month.includes('סיון') && (day === 6 || day === 7);
        const isSukkot    = month.includes('תשרי') && day >= 15 && day <= 23;
        const isYomKippur = month.includes('תשרי') && day === 10;
        const isRoshHaShana = month.includes('תשרי') && (day === 1 || day === 2);
        const isOmer     = month.includes('ניסן') && day >= 16 || month.includes('אייר') || (month.includes('סיון') && day < 6);
        const isYamimNoraim = month.includes('תשרי') && day >= 1 && day <= 10;

        return { isShabbat, isRoshChodesh, isChanukah, isPurim, isPesach, isShavuot, isSukkot, isYomKippur, isRoshHaShana, isOmer, isYamimNoraim, month, day, dow };
      }

      // ── Prayer texts database ─────────────────────────
      const PRAYER_DB = {

        'tefillat-haderech': {
          title: 'תפילת הדרך',
          nusach: {
            mizrahi: `יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם, וְתַצְעִידֵנוּ לְשָׁלוֹם, וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְשָׁלוֹם: <span style="font-size:0.78em;color:#94a3b8;">(אִם חוֹזֵר בּוֹ בַּיּוֹם מוֹסִיף: וְתַחֲזִירֵנוּ לְשָׁלוֹם)</span>, וְתַצִּילֵנוּ מִכַּף כָּל-אוֹיֵב וְאוֹרֵב בַּדֶּרֶךְ, וְתִשְׁלַח בְּרָכָה בְּמַעֲשֵׂי יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל-רוֹאֵינוּ, וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ. כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה. בָּרוּךְ אַתָּה יְהֹוָה שׁוֹמֵעַ תְּפִלָּה:\n\nוַיַּעֲקֹב הָלַךְ לְדַרְכּוֹ, וַיִּפְגְּעוּ בוֹ מַלְאֲכֵי אֱלֹהִים: וַיֹּאמֶר יַעֲקֹב כַּאֲשֶׁר רָאָם, מַחֲנֵה אֱלֹהִים זֶה, וַיִּקְרָא שֵׁם הַמָּקוֹם הַהוּא מַחֲנָיִם:\n\n(ג' פעמים) וַיִּסָּעוּ, וַיְהִי חִתַּת אֱלֹהִים עַל הֶעָרִים אֲשֶׁר סְבִיבוֹתֵיהֶם, וְלֹא רָדְפוּ אַחֲרֵי בְּנֵי יַעֲקֹב:\n\nלִישׁוּעָתְךָ קִוִּיתִי יְהֹוָה (ג' פעמים)\n\nיְבָרֶכְךָ יְהֹוָה וְיִשְׁמְרֶךָ: | יָאֵר יְהֹוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ: | יִשָּׂא יְהֹוָה פָּנָיו אֵלֶיךָ, וְיָשֵׂם לְךָ שָׁלוֹם: (ג' פעמים)`,
            ashkenaz: `יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם וְתַצְעִידֵנוּ לְשָׁלוֹם וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתִסְמְכֵנוּ לְשָׁלוֹם וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם. וְתַצִּילֵנוּ מִכַּף כָּל אוֹיֵב וְאוֹרֵב וְלִסְטִים וְחַיּוֹת רָעוֹת בַּדֶּרֶךְ, וּמִכָּל מִינֵי פֻּרְעָנֻיּוֹת הַמִּתְרַגְּשׁוֹת לָבוֹא לָעוֹלָם. וְתִשְׁלַח בְּרָכָה בְּכָל מַעֲשֵׂה יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ. וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ, כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה.\n\nבָּרוּךְ אַתָּה יְהֹוָה, שׁוֹמֵעַ תְּפִלָּה.`
          },
          seasonal: () => ''
        },

        'shema': {
          title: 'קריאת שמע',
          nusach: {
            all: `שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵינוּ יְהֹוָה אֶחָד:\nבָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:\n\nוְאָהַבְתָּ אֵת יְהֹוָה אֱלֹהֶיךָ בְּכָל לְבָבְךָ וּבְכָל נַפְשְׁךָ וּבְכָל מְאֹדֶךָ. וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ. וְשִׁנַּנְתָּם לְבָנֶיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ. וּקְשַׁרְתָּם לְאוֹת עַל יָדֶךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶיךָ. וּכְתַבְתָּם עַל מְזוּזֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ:\n\nוְהָיָה אִם שָׁמֹעַ תִּשְׁמְעוּ אֶל מִצְוֹתַי אֲשֶׁר אָנֹכִי מְצַוֶּה אֶתְכֶם הַיּוֹם לְאַהֲבָה אֶת יְהֹוָה אֱלֹהֵיכֶם וּלְעָבְדוֹ בְּכָל לְבַבְכֶם וּבְכָל נַפְשְׁכֶם. וְנָתַתִּי מְטַר אַרְצְכֶם בְּעִתּוֹ יוֹרֶה וּמַלְקוֹשׁ וְאָסַפְתָּ דְגָנֶךָ וְתִירֹשְׁךָ וְיִצְהָרֶךָ. וְנָתַתִּי עֵשֶׂב בְּשָׂדְךָ לִבְהֶמְתֶּךָ וְאָכַלְתָּ וְשָׂבָעְתָּ. הִשָּׁמְרוּ לָכֶם פֶּן יִפְתֶּה לְבַבְכֶם וְסַרְתֶּם וַעֲבַדְתֶּם אֱלֹהִים אֲחֵרִים וְהִשְׁתַּחֲוִיתֶם לָהֶם. וְחָרָה אַף יְהֹוָה בָּכֶם וְעָצַר אֶת הַשָּׁמַיִם וְלֹא יִהְיֶה מָטָר וְהָאֲדָמָה לֹא תִתֵּן אֶת יְבוּלָהּ וַאֲבַדְתֶּם מְהֵרָה מֵעַל הָאָרֶץ הַטֹּבָה אֲשֶׁר יְהֹוָה נֹתֵן לָכֶם. וְשַׂמְתֶּם אֶת דְּבָרַי אֵלֶּה עַל לְבַבְכֶם וְעַל נַפְשְׁכֶם וּקְשַׁרְתֶּם אֹתָם לְאוֹת עַל יֶדְכֶם וְהָיוּ לְטוֹטָפֹת בֵּין עֵינֵיכֶם. וְלִמַּדְתֶּם אֹתָם אֶת בְּנֵיכֶם לְדַבֵּר בָּם בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ. וּכְתַבְתָּם עַל מְזוּזוֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ. לְמַעַן יִרְבּוּ יְמֵיכֶם וִימֵי בְנֵיכֶם עַל הָאֲדָמָה אֲשֶׁר נִשְׁבַּע יְהֹוָה לַאֲבֹתֵיכֶם לָתֵת לָהֶם כִּימֵי הַשָּׁמַיִם עַל הָאָרֶץ:\n\nוַיֹּאמֶר יְהֹוָה אֶל מֹשֶׁה לֵּאמֹר: דַּבֵּר אֶל בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם וְעָשׂוּ לָהֶם צִיצִת עַל כַּנְפֵי בִגְדֵיהֶם לְדֹרֹתָם וְנָתְנוּ עַל צִיצִת הַכָּנָף פְּתִיל תְּכֵלֶת. וְהָיָה לָכֶם לְצִיצִת וּרְאִיתֶם אֹתוֹ וּזְכַרְתֶּם אֶת כָּל מִצְוֹת יְהֹוָה וַעֲשִׂיתֶם אֹתָם וְלֹא תָתוּרוּ אַחֲרֵי לְבַבְכֶם וְאַחֲרֵי עֵינֵיכֶם אֲשֶׁר אַתֶּם זֹנִים אַחֲרֵיהֶם. לְמַעַן תִּזְכְּרוּ וַעֲשִׂיתֶם אֶת כָּל מִצְוֹתָי וִהְיִיתֶם קְדֹשִׁים לֵאלֹהֵיכֶם. אֲנִי יְהֹוָה אֱלֹהֵיכֶם אֲשֶׁר הוֹצֵאתִי אֶתְכֶם מֵאֶרֶץ מִצְרַיִם לִהְיוֹת לָכֶם לֵאלֹהִים אֲנִי יְהֹוָה אֱלֹהֵיכֶם:\n\nיְהוָה אֱלֹהֵיכֶם אֱמֶת.`
          },
          seasonal: () => ''
        },

        'birchot-hashachar': {
          title: 'ברכות השחר',
          nusach: {
            all: `מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.\n\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן לַשֶּׂכְוִי בִינָה לְהַבְחִין בֵּין יוֹם וּבֵין לָיְלָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי גוֹי.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי עֶבֶד.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי אִשָּׁה. [לאישה: שֶׁעָשַׂנִי כִּרְצוֹנוֹ]\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, פּוֹקֵחַ עִוְרִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מַלְבִּישׁ עֲרֻמִּים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מַתִּיר אֲסוּרִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, זוֹקֵף כְּפוּפִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, רוֹקַע הָאָרֶץ עַל הַמָּיִם.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה לִי כָּל צָרְכִּי.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמֵּכִין מִצְעֲדֵי גָבֶר.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַנּוֹתֵן לַיָּעֵף כֹּחַ.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּעֲבִיר שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי.\n\nיְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתַּרְגִּילֵנוּ בְּתוֹרָתֶךָ וְדַבְּקֵנוּ בְּמִצְוֹתֶיךָ, וְאַל תְּבִיאֵנוּ לֹא לִידֵי חֵטְא וְלֹא לִידֵי עֲבֵרָה וְעָוֹן, וְלֹא לִידֵי נִסָּיוֹן וְלֹא לִידֵי בִזָּיוֹן. וְאַל יִשְׁלֹט בָּנוּ יֵצֶר הָרָע. וְהַרְחִיקֵנוּ מֵאָדָם רָע וּמֵחָבֵר רָע. וְדַבְּקֵנוּ בְּיֵצֶר הַטּוֹב וּבְמַעֲשִׂים טוֹבִים. וְכֹף אֶת יִצְרֵנוּ לְהִשְׁתַּעְבֶּד לָךְ. וּתְנֵנוּ הַיּוֹם וּבְכָל יוֹם לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ, וְתִגְמְלֵנוּ חֲסָדִים טוֹבִים. בָּרוּךְ אַתָּה יְהֹוָה, הַגּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל.`
          },
          seasonal: () => ''
        },

        'al-hamichya': {
          title: 'ברכת מעין שלוש',
          nusach: {
            all: `עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכֹל מִפִּרְיָהּ וְלִשְׂבֹּעַ מִטּוּבָהּ. רַחֵם נָא יְהֹוָה אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֲךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ. וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה.\n\n[בשבת] וּרְצֵה וְהַחֲלִיצֵנוּ בְּיוֹם הַשַּׁבָּת הַזֶּה.\n[בראש חודש] וְזָכְרֵנוּ לְטוֹבָה בְּיוֹם רֹאשׁ הַחֹדֶשׁ הַזֶּה.\n[ביום טוב] וְשַׂמְּחֵנוּ בְּיוֹם חַג... הַזֶּה.\n\nכִּי אַתָּה יְהֹוָה טוֹב וּמֵטִיב לַכֹּל וְנוֹדֶה לְּךָ עַל הָאָרֶץ וְעַל הַמִּחְיָה.\nבָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָרֶץ וְעַל הַמִּחְיָה.`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isShabbat)   parts.push('📌 שבת: אומרים "וּרְצֵה וְהַחֲלִיצֵנוּ בְּיוֹם הַשַּׁבָּת הַזֶּה"');
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: אומרים "וְזָכְרֵנוּ לְטוֹבָה בְּיוֹם רֹאשׁ הַחֹדֶשׁ הַזֶּה"');
            if (s.isChanukah)  parts.push('📌 חנוכה: לדעות רבות אין שינוי בברכת מעין שלוש');
            return parts.join('\n');
          }
        },

        'kiddush-levana': {
          title: 'ברכת הלבנה / קידוש לבנה',
          nusach: {
            all: `בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בְּמַאֲמָרוֹ בָּרָא שְׁחָקִים, וּבְרוּחַ פִּיו כָּל צְבָאָם. חֹק וּזְמַן נָתַן לָהֶם שֶׁלֹּא יְשַׁנּוּ אֶת תַּפְקִידָם. שָׂשִׂים וּשְׂמֵחִים לַעֲשׂוֹת רְצוֹן קוֹנָם, פּוֹעַל אֱמֶת שֶׁפְּעֻלָּתוֹ אֱמֶת. וְלַלְּבָנָה אָמַר שֶׁתִּתְחַדֵּשׁ עֲטֶרֶת תִּפְאֶרֶת לַעֲמוּסֵי בָטֶן שֶׁהֵם עֲתִידִים לְהִתְחַדֵּשׁ כְּמוֹתָהּ, וּלְפָאֵר לְיוֹצְרָם עַל שֵׁם כְּבוֹד מַלְכוּתוֹ.\n\nבָּרוּךְ אַתָּה יְהֹוָה, מְחַדֵּשׁ חֳדָשִׁים.\n\n[אומרים שלוש פעמים:] שָׁלוֹם עֲלֵיכֶם! (ג' פעמים)\n\nסִימָן טוֹב וּמַזָּל טוֹב יְהֵא לָנוּ וּלְכָל יִשְׂרָאֵל. (ג' פעמים)\n\n[עדות המזרח / ספרד — אחר הברכה:] תהלים קמח`
          },
          seasonal: () => ''
        },

        'birkat-hamazon': {
          title: 'ברכת המזון',
          nusach: {
            mizrahi: `שִׁיר הַמַּעֲלוֹת, בְּשׁוּב יְהֹוָה אֶת שִׁיבַת צִיּוֹן הָיִינוּ כְּחֹלְמִים. אָז יִמָּלֵא שְׂחוֹק פִּינוּ וּלְשׁוֹנֵנוּ רִנָּה...\n\nרַבּוֹתַי נְבָרֵךְ!\n[עונים:] יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד עוֹלָם!\n[אומר:] יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד עוֹלָם. בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי, נְבָרֵךְ (אֱלֹהֵינוּ) שֶׁאָכַלְנוּ מִשֶּׁלּוֹ.\n\n**בְּרָכָה רִאשׁוֹנָה — הַזָּן:**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ בְּחֵן בְּחֶסֶד וּבְרַחֲמִים. הוּא נוֹתֵן לֶחֶם לְכָל בָּשָׂר כִּי לְעוֹלָם חַסְדּוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָסַר לָנוּ וְאַל יֶחְסַר לָנוּ מָזוֹן לְעוֹלָם וָעֶד. בַּעֲבוּר שְׁמוֹ הַגָּדוֹל כִּי הוּא זָן וּמְפַרְנֵס לַכֹּל וּמֵטִיב לַכֹּל וּמֵכִין מָזוֹן לְכָל בְּרִיּוֹתָיו אֲשֶׁר בָּרָא. בָּרוּךְ אַתָּה יְהֹוָה, הַזָּן אֶת הַכֹּל.\n\n**בְּרָכָה שְׁנִיָּה — הָאָרֶץ:**\nנוֹדֶה לְּךָ יְהֹוָה אֱלֹהֵינוּ עַל שֶׁהִנְחַלְתָּ לַאֲבוֹתֵינוּ אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, וְעַל שֶׁהוֹצֵאתָנוּ יְהֹוָה אֱלֹהֵינוּ מֵאֶרֶץ מִצְרַיִם וּפְדִיתָנוּ מִבֵּית עֲבָדִים, וְעַל בְּרִיתְךָ שֶׁחָתַמְתָּ בִּבְשָׂרֵנוּ, וְעַל תּוֹרָתְךָ שֶׁלִּמַּדְתָּנוּ, וְעַל חֻקֶּיךָ שֶׁהוֹדַעְתָּנוּ, וְעַל חַיִּים חֵן וָחֶסֶד שֶׁחוֹנַנְתָּנוּ, וְעַל אֲכִילַת מָזוֹן שָׁאַתָּה זָן וּמְפַרְנֵס אוֹתָנוּ תָּמִיד בְּכָל יוֹם וּבְכָל עֵת וּבְכָל שָׁעָה.\n\nוְעַל הַכֹּל יְהֹוָה אֱלֹהֵינוּ אֲנַחְנוּ מוֹדִים לָךְ וּמְבָרְכִים אוֹתָךְ יִתְבָּרַךְ שִׁמְךָ בְּפִי כָּל חַי תָּמִיד לְעוֹלָם וָעֶד.\nבָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָרֶץ וְעַל הַמָּזוֹן.\n\n**בְּרָכָה שְׁלִישִׁית — יְרוּשָׁלַיִם:**\nרַחֵם נָא יְהֹוָה אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מַלְכוּת בֵּית דָּוִד מְשִׁיחֶךָ וְעַל הַבַּיִת הַגָּדוֹל וְהַקָּדוֹשׁ שֶׁנִּקְרָא שִׁמְךָ עָלָיו. אֱלֹהֵינוּ אָבִינוּ רְעֵנוּ זוּנֵנוּ פַּרְנְסֵנוּ וְכַלְכְּלֵנוּ וְהַרְוִיחֵנוּ וְהַרְוַח לָנוּ יְהֹוָה אֱלֹהֵינוּ מְהֵרָה מִכָּל צָרוֹתֵינוּ. וְנָא אַל תַּצְרִיכֵנוּ יְהֹוָה אֱלֹהֵינוּ לֹא לִידֵי מַתְּנַת בָּשָׂר וָדָם וְלֹא לִידֵי הַלְוָאָתָם כִּי אִם לְיָדְךָ הַמְּלֵאָה הַפְּתוּחָה הַקְּדוֹשָׁה וְהָרְחָבָה שֶׁלֹּא נֵבוֹשׁ וְלֹא נִכָּלֵם לְעוֹלָם וָעֶד.\n\n**בְּרָכָה רְבִיעִית — הַטּוֹב וְהַמֵּטִיב:**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָאֵל אָבִינוּ מַלְכֵּנוּ אַדִּירֵנוּ בּוֹרְאֵנוּ גֹּאֲלֵנוּ יוֹצְרֵנוּ קְדוֹשֵׁנוּ קְדוֹשׁ יַעֲקֹב הַטּוֹב וְהַמֵּטִיב לַכֹּל שֶׁבְּכָל יוֹם וָיוֹם הוּא הֵטִיב הוּא מֵטִיב הוּא יֵיטִיב לָנוּ. הוּא גְמָלָנוּ הוּא גוֹמְלֵנוּ הוּא יִגְמְלֵנוּ לָעַד לְחֵן וּלְחֶסֶד וּלְרַחֲמִים וְלִרְוַח הַצָּלָה וְהַצְלָחָה בְּרָכָה וִישׁוּעָה נֶחָמָה פַּרְנָסָה וְכַלְכָּלָה וְרַחֲמִים וְחַיִּים וְשָׁלוֹם וְכָל טוֹב, וּמִכָּל טוּב לְעוֹלָם אַל יְחַסְּרֵנוּ.`,
            ashkenaz: `[נוסח אשכנז — ההבדל העיקרי: "בִּרְשׁוּת מוֹרַי וְרַבּוֹתַי" במקום "מָרָנָן וְרַבָּנָן"]\n\n[שאר הנוסח דומה לעיקר כנ"ל]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isShabbat)     parts.push('📌 שבת: מוסיפים "רְצֵה וְהַחֲלִיצֵנוּ" בברכת ירושלים');
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: מוסיפים "יַעֲלֶה וְיָבֹא"');
            if (s.isChanukah || s.isPurim) parts.push('📌 חנוכה/פורים: מוסיפים "עַל הַנִּסִּים"');
            if (s.isPesach)      parts.push('📌 פסח: מוסיפים "יַעֲלֶה וְיָבֹא"');
            if (s.isYamimNoraim) parts.push('📌 ימים נוראים: אפשר להוסיף "זָכְרֵנוּ לְחַיִּים"');
            return parts.join('\n');
          }
        },

        'tikkun-haklali': {
          title: 'תיקון הכללי (י׳ מזמורים)',
          nusach: {
            all: `תיקון הכללי של רבינו נחמן מברסלב — עשרה מזמורי תהלים:\n\nטז • לב • מא • מב • נט • עז • צ • קה • קלז • קנ\n\n**תהלים טז**\nמִכְתָּם לְדָוִד שָׁמְרֵנִי אֵל כִּי חָסִיתִי בָּךְ: אָמַרְתְּ לַיהֹוָה אֲדֹנָי אָתָּה טוֹבָתִי בַּל עָלֶיךָ: לִקְדוֹשִׁים אֲשֶׁר בָּאָרֶץ הֵמָּה וְאַדִּירֵי כָּל חֶפְצִי בָם: יִרְבּוּ עַצְּבוֹתָם אַחֵר מָהָרוּ בַּל אַסִּיךְ נִסְכֵּיהֶם מִדָּם וּבַל אֶשָּׂא אֶת שְׁמוֹתָם עַל שְׂפָתָי: יְהֹוָה מְנָת חֶלְקִי וְכוֹסִי אַתָּה תּוֹמִיךְ גּוֹרָלִי: חֲבָלִים נָפְלוּ לִי בַּנְּעִמִים אַף נַחֲלָת שָׁפְרָה עָלָי: אֲבָרֵךְ אֶת יְהֹוָה אֲשֶׁר יְעָצָנִי אַף לֵילוֹת יִסְּרוּנִי כִלְיוֹתָי: שִׁוִּיתִי יְהֹוָה לְנֶגְדִּי תָמִיד כִּי מִימִינִי בַּל אֶמּוֹט: לָכֵן שָׂמַח לִבִּי וַיָּגֶל כְּבוֹדִי אַף בְּשָׂרִי יִשְׁכֹּן לָבֶטַח: כִּי לֹא תַעֲזֹב נַפְשִׁי לִשְׁאוֹל לֹא תִתֵּן חֲסִידְךָ לִרְאוֹת שָׁחַת: תּוֹדִיעֵנִי אֹרַח חַיִּים שֹׂבַע שְׂמָחוֹת אֶת פָּנֶיךָ נְעִמוֹת בִּימִינְךָ נֶצַח:\n\n**תהלים לב**\nלְדָוִד מַשְׂכִּיל אַשְׁרֵי נְשׂוּי פֶּשַׁע כְּסוּי חֲטָאָה: אַשְׁרֵי אָדָם לֹא יַחְשֹׁב יְהֹוָה לוֹ עָוֹן וְאֵין בְּרוּחוֹ רְמִיָּה: כִּי הֶחֱרַשְׁתִּי בָּלוּ עֲצָמָי בְּשַׁאֲגָתִי כָּל הַיּוֹם: כִּי יוֹמָם וָלַיְלָה תִּכְבַּד עָלַי יָדֶךָ נֶהְפַּךְ לְשַׁדִּי בְּחַרְבֹנֵי קָיִץ סֶלָה: חַטָּאתִי אוֹדִיעֲךָ וַעֲוֹנִי לֹא כִסִּיתִי אָמַרְתִּי אוֹדֶה עֲלֵי פְשָׁעַי לַיהֹוָה וְאַתָּה נָשָׂאתָ עֲוֹן חַטָּאתִי סֶלָה: עַל זֹאת יִתְפַּלֵּל כָּל חָסִיד אֵלֶיךָ לְעֵת מְצֹא רַק לְשֵׁטֶף מַיִם רַבִּים אֵלָיו לֹא יַגִּיעוּ: אַתָּה סֵתֶר לִי מִצַּר תִּצְּרֵנִי רָנֵּי פַלֵּט תְּסוֹבְבֵנִי סֶלָה: אַשְׂכִּילְךָ וְאוֹרְךָ בְּדֶרֶךְ זוּ תֵלֵךְ אִיעֲצָה עָלֶיךָ עֵינִי: אַל תִּהְיוּ כְּסוּס כְּפֶרֶד אֵין הָבִין בְּמֶתֶג וָרֶסֶן עֶדְיוֹ לִבְלוֹם בַּל קְרֹב אֵלֶיךָ: רַבִּים מַכְאוֹבִים לָרָשָׁע וְהַבּוֹטֵחַ בַּיהֹוָה חֶסֶד יְסוֹבְבֶנּוּ: שִׂמְחוּ בַיהֹוָה וְגִילוּ צַדִּיקִים וְהַרְנִינוּ כָּל יִשְׁרֵי לֵב:\n\n**תהלים מא**\nלַמְנַצֵּחַ מִזְמוֹר לְדָוִד: אַשְׁרֵי מַשְׂכִּיל אֶל דָּל בְּיוֹם רָעָה יְמַלְּטֵהוּ יְהֹוָה: יְהֹוָה יִשְׁמְרֵהוּ וִיחַיֵּהוּ וְאֻשַּׁר בָּאָרֶץ וְאַל תִּתְּנֵהוּ בְּנֶפֶשׁ אֹיְבָיו: יְהֹוָה יִסְעָדֶנּוּ עַל עֶרֶשׂ דְּוָי כָּל מִשְׁכָּבוֹ הָפַכְתָּ בְחָלְיוֹ: אֲנִי אָמַרְתִּי יְהֹוָה חָנֵּנִי רְפָאָה נַפְשִׁי כִּי חָטָאתִי לָךְ: אוֹיְבַי יֹאמְרוּ רַע לִי מָתַי יָמוּת וְאָבַד שְׁמוֹ: וְאִם בָּא לִרְאוֹת שָׁוְא יְדַבֵּר לִבּוֹ יִקְבָּץ אָוֶן לוֹ יֵצֵא לַחוּץ יְדַבֵּר: יַחַד עָלַי יִתְלַחֲשׁוּ כָּל שֹׂנְאַי עָלַי יַחְשְׁבוּ רָעָה לִי: דְּבַר בְּלִיַּעַל יָצוּק בּוֹ וַאֲשֶׁר שָׁכַב לֹא יוֹסִיף לָקוּם: גַּם אִישׁ שְׁלוֹמִי אֲשֶׁר בָּטַחְתִּי בוֹ אוֹכֵל לַחְמִי הִגְדִּיל עָלַי עָקֵב: וְאַתָּה יְהֹוָה חָנֵּנִי וַהֲקִימֵנִי וַאֲשַׁלְּמָה לָהֶם: בְּזֹאת יָדַעְתִּי כִּי חָפַצְתָּ בִּי כִּי לֹא יָרִיעַ אֹיְבִי עָלָי: וַאֲנִי בְּתֻמִּי תָּמַכְתָּ בִּי וַתַּצִּיבֵנִי לְפָנֶיךָ לְעוֹלָם: בָּרוּךְ יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל מֵהָעוֹלָם וְעַד הָעוֹלָם אָמֵן וְאָמֵן:\n\n**תהלים מב**\nלַמְנַצֵּחַ מַשְׂכִּיל לִבְנֵי קֹרַח: כְּאַיָּל תַּעֲרֹג עַל אֲפִיקֵי מָיִם כֵּן נַפְשִׁי תַעֲרֹג אֵלֶיךָ אֱלֹהִים: צָמְאָה נַפְשִׁי לֵאלֹהִים לְאֵל חָי מָתַי אָבוֹא וְאֵרָאֶה פְּנֵי אֱלֹהִים: הָיְתָה לִּי דִמְעָתִי לֶחֶם יוֹמָם וָלָיְלָה בֶּאֱמֹר אֵלַי כָּל הַיּוֹם אַיֵּה אֱלֹהֶיךָ: אֵלֶּה אֶזְכְּרָה וְאֶשְׁפְּכָה עָלַי נַפְשִׁי כִּי אֶעֱבֹר בַּסָּךְ אֶדַּדֵּם עַד בֵּית אֱלֹהִים בְּקוֹל רִנָּה וְתוֹדָה הָמוֹן חוֹגֵג: מַה תִּשְׁתּוֹחֲחִי נַפְשִׁי וַתֶּהֱמִי עָלָי הוֹחִילִי לֵאלֹהִים כִּי עוֹד אוֹדֶנּוּ יְשׁוּעוֹת פָּנָיו:\n\n**תהלים נט** (ראשיתו)\nלַמְנַצֵּחַ אַל תַּשְׁחֵת לְדָוִד מִכְתָּם בִּשְׁלֹחַ שָׁאוּל וַיִּשְׁמְרוּ אֶת הַבַּיִת לַהֲמִיתוֹ: הַצִּילֵנִי מֵאֹיְבַי אֱלֹהָי מִמִּתְקוֹמְמַי תְּשַׂגְּבֵנִי: הַצִּילֵנִי מִפֹּעֲלֵי אָוֶן וּמֵאַנְשֵׁי דָמִים הוֹשִׁיעֵנִי: כִּי הִנֵּה אָרְבוּ לְנַפְשִׁי יָגוּרוּ עָלַי עַזִּים לֹא פִשְׁעִי וְלֹא חַטָּאתִי יְהֹוָה: בְּלִי עָוֹן יְרוּצוּן וְיִכּוֹנָנוּ עוּרָה לִקְרָאתִי וּרְאֵה: וְאַתָּה יְהֹוָה אֱלֹהִים צְבָאוֹת אֱלֹהֵי יִשְׂרָאֵל הָקִיצָה לִפְקֹד כָּל הַגּוֹיִם אַל תָּחֹן כָּל בֹּגְדֵי אָוֶן סֶלָה:\n\n**תהלים עז** (ראשיתו)\nלַמְנַצֵּחַ עַל יְדוּתוּן לְאָסָף מִזְמוֹר: קוֹלִי אֶל אֱלֹהִים וְאֶצְעָקָה קוֹלִי אֶל אֱלֹהִים וְהַאֲזִין אֵלָי: בְּיוֹם צָרָתִי אֲדֹנָי דָּרָשְׁתִּי יָדִי לַיְלָה נִגְּרָה וְלֹא תָפוּג מֵאֲנָה הִנָּחֵם נַפְשִׁי: אֶזְכְּרָה אֱלֹהִים וְאֶהֱמָיָה אָשִׂיחָה וְתִתְעַטֵּף רוּחִי סֶלָה: אָחַזְתָּ שְׁמֻרוֹת עֵינָי נִפְעַמְתִּי וְלֹא אֲדַבֵּר:\n\n**תהלים צ**\nתְּפִלָּה לְמֹשֶׁה אִישׁ הָאֱלֹהִים: אֲדֹנָי מָעוֹן אַתָּה הָיִיתָ לָּנוּ בְּדֹר וָדֹר: בְּטֶרֶם הָרִים יֻלָּדוּ וַתְּחוֹלֵל אֶרֶץ וְתֵבֵל וּמֵעוֹלָם עַד עוֹלָם אַתָּה אֵל: תָּשֵׁב אֱנוֹשׁ עַד דַּכָּא וַתֹּאמֶר שׁוּבוּ בְנֵי אָדָם: כִּי אֶלֶף שָׁנִים בְּעֵינֶיךָ כְּיוֹם אֶתְמוֹל כִּי יַעֲבֹר וְאַשְׁמוּרָה בַלָּיְלָה:\n\n**תהלים קה** (ראשיתו)\nהוֹדוּ לַיהֹוָה קִרְאוּ בִשְׁמוֹ הוֹדִיעוּ בָעַמִּים עֲלִילוֹתָיו: שִׁירוּ לוֹ זַמְּרוּ לוֹ שִׂיחוּ בְּכָל נִפְלְאוֹתָיו: הִתְהַלְלוּ בְּשֵׁם קָדְשׁוֹ יִשְׂמַח לֵב מְבַקְשֵׁי יְהֹוָה: דִּרְשׁוּ יְהֹוָה וְעֻזּוֹ בַּקְּשׁוּ פָנָיו תָּמִיד:\n\n**תהלים קלז**\nעַל נַהֲרוֹת בָּבֶל שָׁם יָשַׁבְנוּ גַּם בָּכִינוּ בְּזָכְרֵנוּ אֶת צִיּוֹן: עַל עֲרָבִים בְּתוֹכָהּ תָּלִינוּ כִּנֹּרוֹתֵינוּ: כִּי שָׁם שְׁאֵלוּנוּ שׁוֹבֵינוּ דִּבְרֵי שִׁיר וְתוֹלָלֵינוּ שִׂמְחָה שִׁירוּ לָנוּ מִשִּׁיר צִיּוֹן: אֵיךְ נָשִׁיר אֶת שִׁיר יְהֹוָה עַל אַדְמַת נֵכָר: אִם אֶשְׁכָּחֵךְ יְרוּשָׁלָיִם תִּשְׁכַּח יְמִינִי: תִּדְבַּק לְשׁוֹנִי לְחִכִּי אִם לֹא אֶזְכְּרֵכִי אִם לֹא אַעֲלֶה אֶת יְרוּשָׁלַיִם עַל רֹאשׁ שִׂמְחָתִי: זְכֹר יְהֹוָה לִבְנֵי אֱדוֹם אֵת יוֹם יְרוּשָׁלָיִם הָאֹמְרִים עָרוּ עָרוּ עַד הַיְסוֹד בָּהּ: בַּת בָּבֶל הַשְּׁדוּדָה אַשְׁרֵי שֶׁיְשַׁלֶּם לָךְ אֶת גְּמוּלֵךְ שֶׁגָּמַלְתְּ לָנוּ: אַשְׁרֵי שֶׁיֹּאחֵז וְנִפֵּץ אֶת עֹלָלַיִךְ אֶל הַסָּלַע:\n\n**תהלים קנ**\nהַלְלוּיָהּ הַלְלוּ אֵל בְּקָדְשׁוֹ הַלְלוּהוּ בִּרְקִיעַ עֻזּוֹ: הַלְלוּהוּ בִגְבוּרֹתָיו הַלְלוּהוּ כְּרֹב גֻּדְלוֹ: הַלְלוּהוּ בְּתֵקַע שׁוֹפָר הַלְלוּהוּ בְּנֵבֶל וְכִנּוֹר: הַלְלוּהוּ בְתֹף וּמָחוֹל הַלְלוּהוּ בְּמִנִּים וְעֻגָב: הַלְלוּהוּ בְצִלְצְלֵי שָׁמַע הַלְלוּהוּ בְּצִלְצְלֵי תְרוּעָה: כֹּל הַנְּשָׁמָה תְּהַלֵּל יָהּ הַלְלוּיָהּ:`
          },
          seasonal: () => ''
        },

        'shacharit': {
          title: 'תפילת שחרית',
          nusach: {
            mizrahi: `**מודה אני**\nמוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.\n\n**ברכות השחר** — [ראה פרק ברכות השחר]\n\n**פסוקי דזמרה**\nבָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם... [עד] יִשְׁתַּבַּח שִׁמְךָ לָעַד מַלְכֵּנוּ...\n\n**קריאת שמע** — [ראה פרק שמע ישראל]\n\n**עמידה — שמונה עשרה**\n\nאֲדֹנָי שְׂפָתַי תִּפְתָּח וּפִי יַגִּיד תְּהִלָּתֶךָ:\n\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, אֱלֹהֵי אַבְרָהָם אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב, הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא אֵל עֶלְיוֹן, גּוֹמֵל חֲסָדִים טוֹבִים וְקֹנֵה הַכֹּל וְזוֹכֵר חַסְדֵּי אָבוֹת וּמֵבִיא גוֹאֵל לִבְנֵי בְנֵיהֶם לְמַעַן שְׁמוֹ בְּאַהֲבָה:\nמֶלֶךְ עוֹזֵר וּמוֹשִׁיעַ וּמָגֵן. בָּרוּךְ אַתָּה יְהֹוָה, מָגֵן אַבְרָהָם.\n\nאַתָּה גִּבּוֹר לְעוֹלָם אֲדֹנָי, מְחַיֵּה מֵתִים אַתָּה, רַב לְהוֹשִׁיעַ.\n[קיץ:] מוֹרִיד הַטַּל\n[חורף:] מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם\nמְכַלְכֵּל חַיִּים בְּחֶסֶד, מְחַיֵּה מֵתִים בְּרַחֲמִים רַבִּים... בָּרוּךְ אַתָּה יְהֹוָה, מְחַיֵּה הַמֵּתִים.\n\n[המשך — קדושה, ברכות אמצעיות י"ג, ברכות אחרונות, עלינו]`,
            ashkenaz: `[נוסח אשכנז — הבדלים עיקריים:\n• "אֲשֶׁר יָצַר" בנוסח שונה מעט\n• "לְעוֹלַם יְהֵא אָדָם" — נוסח שונה\n• "יִשְׁמַח מֹשֶׁה" בשבת — נוסח שונה\n\nהעמידה דומה לנוסח ספרד לרוב]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: מוסיפים "יַעֲלֶה וְיָבֹא" בעמידה ובברכת המזון; אומרים הלל (חצי הלל)');
            if (s.isChanukah)    parts.push('📌 חנוכה: מוסיפים "עַל הַנִּסִּים" בעמידה; אומרים הלל שלם ח׳ ימים ראשונים');
            if (s.isPurim)       parts.push('📌 פורים: מוסיפים "עַל הַנִּסִּים" בעמידה ובברכת המזון');
            if (s.isPesach)      parts.push('📌 פסח: "יַעֲלֶה וְיָבֹא" בעמידה; הלל שלם ב׳ ראשונים, חצי הלל בשאר; מוסף');
            if (s.isShavuot)     parts.push('📌 שבועות: הלל שלם; מוסף; אקדמות ואזהרות (לנוסחים מסוימים)');
            if (s.isSukkot)      parts.push('📌 סוכות: הלל שלם; מוסף; ד׳ מינים');
            if (s.isYamimNoraim) parts.push('📌 ימים נוראים: "זָכְרֵנוּ לְחַיִּים" ו"מִי כָמוֹךָ" בעמידה; "הָמֶלֶךְ הַקָּדוֹשׁ"');
            if (s.isShabbat)     parts.push('📌 שבת: תפילת שחרית של שבת — ישתבח, נשמת, קדישים, קריאת התורה, מוסף שבת');
            return parts.join('\n');
          }
        },

        'mincha': {
          title: 'תפילת מנחה',
          nusach: {
            mizrahi: `אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ עוֹד יְהַלְלוּךָ סֶּלָה:\nאַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְּהֹוָה אֱלֹהָיו:\n\nתְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּלֶךְ...\n[מזמור קמה עד סופו]\n\n**חצי קדיש**\n\n**עמידה — שמונה עשרה** [כמו שחרית — ראה שם]\n\n[ביום חול שיש מנין: חזרת הש"צ, קדיש תתקבל]\n\n**עלינו לשבח**\nעָלֵינוּ לְשַׁבֵּחַ לַאֲדוֹן הַכֹּל, לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית, שֶׁלֹּא עָשָׂנוּ כְּגוֹיֵי הָאֲרָצוֹת וְלֹא שָׂמָנוּ כְּמִשְׁפְּחוֹת הָאֲדָמָה. שֶׁלֹּא שָׂם חֶלְקֵנוּ כָּהֶם וְגֹרָלֵנוּ כְּכָל הֲמוֹנָם.\nוַאֲנַחְנוּ כֹּרְעִים וּמִשְׁתַּחֲוִים וּמוֹדִים לִפְנֵי מֶלֶךְ מַלְכֵי הַמְּלָכִים הַקָּדוֹשׁ בָּרוּךְ הוּא.\nשֶׁהוּא נוֹטֶה שָׁמַיִם וְיֹסֵד אָרֶץ, וּמוֹשַׁב יְקָרוֹ בַּשָּׁמַיִם מִמַּעַל, וּשְׁכִינַת עֻזּוֹ בְּגָבְהֵי מְרוֹמִים. הוּא אֱלֹהֵינוּ אֵין עוֹד. אֱמֶת מַלְכֵּנוּ אֶפֶס זוּלָתוֹ, כַּכָּתוּב בְּתוֹרָתוֹ: וְיָדַעְתָּ הַיּוֹם וַהֲשֵׁבֹתָ אֶל לְבָבֶךָ כִּי יְהֹוָה הוּא הָאֱלֹהִים בַּשָּׁמַיִם מִמַּעַל וְעַל הָאָרֶץ מִתָּחַת אֵין עוֹד:\n\nקַדִּישׁ יָתוֹם`,
            ashkenaz: `[נוסח אשכנז — מנחה דומה לנוסח ספרד בעיקרה. הבדל: נוסח "עלינו" שונה מעט]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isShabbat)     parts.push('📌 שבת: מנחת שבת — קריאת התורה (בגולה: מתחילים פרשת שבת הבאה); תפילת מנחה בנוסח שבת');
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: "יַעֲלֶה וְיָבֹא" בעמידה');
            if (s.isChanukah)    parts.push('📌 חנוכה: "עַל הַנִּסִּים" בעמידה');
            if (s.isPesach || s.isShavuot || s.isSukkot) parts.push('📌 יום טוב: "יַעֲלֶה וְיָבֹא" בעמידה; מוסף נאמר בשחרית בלבד');
            return parts.join('\n');
          }
        },

        'maariv': {
          title: 'תפילת ערבית',
          nusach: {
            mizrahi: `**ברכו**\nבָּרְכוּ אֶת יְהֹוָה הַמְּבֹרָךְ!\n[עונים:] בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֶד!\n\n**ברכות קריאת שמע של ערבית**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בִּדְבָרוֹ מַעֲרִיב עֲרָבִים, בְּחָכְמָה פּוֹתֵחַ שְׁעָרִים... בָּרוּךְ אַתָּה יְהֹוָה, הַמַּעֲרִיב עֲרָבִים.\n\nאַהֲבַת עוֹלָם בֵּית יִשְׂרָאֵל עַמְּךָ אָהָבְתָּ... בָּרוּךְ אַתָּה יְהֹוָה, אוֹהֵב עַמּוֹ יִשְׂרָאֵל.\n\n**קריאת שמע** — [ראה פרק שמע ישראל]\n\nוֶאֱמֶת וֶאֱמוּנָה כָּל זֹאת... יְהֹוָה אֱלֹהֵיכֶם אֱמֶת.\n\nהַשְׁכִּיבֵנוּ יְהֹוָה אֱלֹהֵינוּ לְשָׁלוֹם... בָּרוּךְ אַתָּה יְהֹוָה, הַפּוֹרֵשׂ סֻכַּת שָׁלוֹם עָלֵינוּ...\n\n**עמידה — שמונה עשרה** [כמו שחרית]\n\n**קדיש תתקבל, עלינו, קדיש יתום**`,
            ashkenaz: `[נוסח אשכנז — הבדל בנוסח "אהבת עולם"/"אהבה רבה"; שאר התפילה דומה]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isShabbat)     parts.push('📌 מוצאי שבת: הבדלה — "הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחֹל..."');
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: "יַעֲלֶה וְיָבֹא" בעמידה; "קִדּוּשׁ לְבָנָה" — ראו פרק ברכת לבנה');
            if (s.isChanukah)    parts.push('📌 חנוכה: "עַל הַנִּסִּים" בעמידה; הדלקת נרות חנוכה אחר ערבית');
            if (s.isPurim)       parts.push('📌 פורים: "עַל הַנִּסִּים" בעמידה; מגילת אסתר בלילה');
            if (s.isYamimNoraim) parts.push('📌 ערב יום כיפור: "כָּל נִדְרֵי" לפני ערבית; "זָכְרֵנוּ לְחַיִּים" בעמידה');
            return parts.join('\n');
          }
        },

        'tehillim': {
          title: 'תהילים',
          nusach: {
            all: `**תהלים א׳**\nאַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד וּבְמוֹשַׁב לֵצִים לֹא יָשָׁב:\nכִּי אִם בְּתוֹרַת יְהֹוָה חֶפְצוֹ וּבְתוֹרָתוֹ יֶהְגֶּה יוֹמָם וָלָיְלָה:\nוְהָיָה כְּעֵץ שָׁתוּל עַל פַּלְגֵי מָיִם אֲשֶׁר פִּרְיוֹ יִתֵּן בְּעִתּוֹ וְעָלֵהוּ לֹא יִבּוֹל וְכֹל אֲשֶׁר יַעֲשֶׂה יַצְלִיחַ:\nלֹא כֵן הָרְשָׁעִים כִּי אִם כַּמֹּץ אֲשֶׁר תִּדְּפֶנּוּ רוּחַ:\nעַל כֵּן לֹא יָקֻמוּ רְשָׁעִים בַּמִּשְׁפָּט וְחַטָּאִים בַּעֲדַת צַדִּיקִים:\nכִּי יוֹדֵעַ יְהֹוָה דֶּרֶךְ צַדִּיקִים וְדֶרֶךְ רְשָׁעִים תֹּאבֵד:\n\n**לחץ לפתיחת ספר תהילים המלא ב-Sefaria ←**\n[כפתור קישור מופיע למטה]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isRoshChodesh) parts.push('📌 ראש חודש: נהוג לומר תהלים קד (או מנהגים שונים לפי קהילה)');
            if (s.isShabbat)     parts.push('📌 שבת: ספר תהלים בין מנחה למעריב; "בֹּאוּ נְרַנְּנָה" (צ"ה) בקבלת שבת');
            if (s.isYamimNoraim) parts.push('📌 ימים נוראים: תהלים כ"ז — "לְדָוִד יְהֹוָה אוֹרִי" מרה"ש עד שמחת תורה');
            return parts.join('\n');
          },
          extraLink: 'https://www.sefaria.org/Psalms?lang=bi'
        },

        'tikkun-chatzot': {
          title: 'תיקון חצות',
          nusach: {
            all: `**תיקון רחל** (אחר חצות הלילה, בימות החול בלבד)\n\nיֵשֵׁב בָּדָד וְיִדֹּם כִּי נָטַל עָלָיו:\n\nיְרוּשָׁלַיִם חָטְאָה חֵטְא עַל כֵּן לְנִידָה הָיָתָה כָּל מְכַבְּדֶיהָ הִזִּילוּהָ כִּי רָאוּ עֶרְוָתָהּ גַּם הִיא נֶאֱנָחָה וַתָּשָׁב אָחוֹר: (איכה א:ח)\n\n[תהלים עט, קב, קלז]\n\nעַל נַהֲרוֹת בָּבֶל שָׁם יָשַׁבְנוּ גַּם בָּכִינוּ בְּזָכְרֵנוּ אֶת צִיּוֹן:\nעַל עֲרָבִים בְּתוֹכָהּ תָּלִינוּ כִּנֹּרוֹתֵינוּ:\nכִּי שָׁם שְׁאֵלוּנוּ שׁוֹבֵינוּ דִּבְרֵי שִׁיר וְתוֹלָלֵינוּ שִׂמְחָה, שִׁירוּ לָנוּ מִשִּׁיר צִיּוֹן:\nאֵיךְ נָשִׁיר אֶת שִׁיר יְהֹוָה עַל אַדְמַת נֵכָר:\nאִם אֶשְׁכָּחֵךְ יְרוּשָׁלָיִם תִּשְׁכַּח יְמִינִי:\nתִּדְבַּק לְשׁוֹנִי לְחִכִּי אִם לֹא אֶזְכְּרֵכִי אִם לֹא אַעֲלֶה אֶת יְרוּשָׁלַיִם עַל רֹאשׁ שִׂמְחָתִי:\n(תהלים קלז, א–ו)\n\n**תיקון לאה** (לאחר תיקון רחל)\n[תהלים כ, כא, כד, סז, עב, צ, צא, קמ, קמא, קמב]`
          },
          seasonal: (s) => {
            const parts = [];
            if (s.isShabbat || s.isRoshHaShana || s.isYomKippur || s.isPesach || s.isShavuot || s.isSukkot)
              parts.push('⚠️ תיקון חצות לא נאמר בשבת, ראש השנה, יום כיפור, ימים טובים, ימי חנוכה ופורים');
            return parts.join('\n');
          }
        }

      }; // end PRAYER_DB

      const TIKKUN_HAKLALI_TEXT = `לפני אמירת תיקון הכללי אומרים:

לְכוּ נְרננה לַאֲדֹנָי, נָריעה לְצוּר יִשָׁעֲנוּ. נְקַדְמָה פָנָיו בְּתוֹדָה בִּזְמִירוֹת נָריעַ לוֹ. כִּי אֵל גָּדוֹל אֲדֹנָי וּמֶלך גָּדוֹל עַל כָּל אֱלֹהִים.

הֲרֵינִי מְזַמֵּן אֶת פִּי לְהוֹדוֹת וּלְהַלֵּל וּלְשַׁבֵּחַ אֶת בּוֹרְאִי. לְשֵׁם יִחוּד קוּדְשָׁא בְּרִיךְ הוּא ושׁכִינְתֵּיה, בִּדְחִילוּ וּרְחִימוּ, עַל יְדֵי הַהוּא טָמִיר וְנֶעֶלָם, בְּשֵּׁם כָּל יִשְׂרָאֵל.

הֲרֵינִי מְקַשֵׁר עַצְמִי בַּאֲמִירַת הָעֲשָׂרָה מִזְמוֹרִים אֵלּוּ לְכָל הַצַּדִּיקִים הָאֲמִתִּיִּים שֶׁבְּדוֹרֵנוּ. וּלְכָל הַצַּדִּיקִים הָאֲמִתִּים שׁוֹכְנֵי עָפָר. קְדוֹשִׁים אָשֵׁר בָּאָרֶץ הֵמָּה. וּבִפְרָט לְרַבֵּנוּ הַקָּדוֹשׁ צַדִּיק יְסוֹד עוֹלָם נַחַל נוֹבֵעַ מְקוֹר חָכְמָה רַבֵּנוּ נַחְמָן בֶּן פֵיגֶא זְכוּתָם יָגֵן עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל אָמֵן.
פרק ט"ז
א מִכְתָּ֥ם לְדָוִ֑ד שָֽׁמְרֵ֥נִי אֵ֝֗ל כִּֽי-חָסִ֥יתִי בָֽךְ: ב אָמַ֣רְתְּ לַֽ֭יהוָה אֲדֹנָ֣י אָ֑תָּה ט֝וֹבָתִ֗י בַּל-עָלֶֽיךָ: ג לִ֭קְדוֹשִׁים אֲשֶׁר-בָּאָ֣רֶץ הֵ֑מָּה וְ֝אַדִּירֵ֗י כָּל-חֶפְצִי-בָֽם: ד יִרְבּ֥וּ עַצְּבוֹתָם֮ אַחֵ֪ר מָ֫הָ֥רוּ בַּל-אַסִּ֣יךְ נִסְכֵּיהֶ֣ם מִדָּ֑ם וּֽבַל-אֶשָּׂ֥א אֶת-שְׁ֝מוֹתָ֗ם עַל-שְׂפָתָֽי: ה יְֽהוָ֗ה מְנָת-חֶלְקִ֥י וְכוֹסִ֑י אַ֝תָּ֗ה תּוֹמִ֥יךְ גּוֹרָלִֽי: ו חֲבָלִ֣ים נָֽפְלוּ-לִ֭י בַּנְּעִמִ֑ים אַף-נַ֝חֲלָ֗ת שָֽׁפְרָ֥ה עָלָֽי: ז אֲבָרֵ֗ךְ אֶת-יְ֭הוָה אֲשֶׁ֣ר יְעָצָ֑נִי אַף-לֵ֝יל֗וֹת יִסְּר֥וּנִי כִלְיוֹתָֽי: ח שִׁוִּ֬יתִי יְהוָ֣ה לְנֶגְדִּ֣י תָמִ֑יד כִּ֥י מִֽ֝ימִינִ֗י בַּל-אֶמּֽוֹט: ט לָכֵ֤ן | שָׂמַ֣ח לִ֭בִּי וַיָּ֣גֶל כְּבוֹדִ֑י אַף-בְּ֝שָׂרִ֗י יִשְׁכֹּ֥ן לָבֶֽטַח: י כִּ֤י | לֹא-תַעֲזֹ֣ב נַפְשִׁ֣י לִשְׁא֑וֹל לֹֽא-תִתֵּ֥ן חֲ֝סִידְךָ֗ לִרְא֥וֹת שָֽׁחַת: יא תּֽוֹדִיעֵנִי֮ אֹ֤רַח חַ֫יִּ֥ים שֹׂ֣בַע שְׂ֭מָחוֹת אֶת-פָּנֶ֑יךָ נְעִמ֖וֹת בִּימִינְךָ֣ נֶֽצַח:

פרק ל"ב
א לְדָוִ֗ד מַ֫שְׂכִּ֥יל אַשְׁרֵ֥י נְֽשׂוּי-פֶּ֗שַׁע כְּס֣וּי חֲטָאָֽה: ב אַ֥שְֽׁרֵי אָדָ֗ם לֹ֤א יַחְשֹׁ֬ב יְהוָ֣ה ל֣וֹ עָוֹ֑ן וְאֵ֖ין בְּרוּח֣וֹ רְמִיָּה: ג כִּֽי-הֶ֭חֱרַשְׁתִּי בָּל֣וּ עֲצָמָ֑י בְּ֝שַׁאֲגָתִ֗י כָּל-הַיּֽוֹם: ד כִּ֤י | יוֹמָ֣ם וָלַיְלָה֮ תִּכְבַּ֥ד עָלַ֗י יָ֫דֶ֥ךָ נֶהְפַּ֥ךְ לְשַׁדִּ֑י בְּחַרְבֹ֖נֵי קַ֣יִץ סֶֽלָה: ה חַטָּאתִ֨י אוֹדִ֪יעֲךָ֡ וַעֲוֹ֘נִ֤י לֹֽא-כִסִּ֗יתִי אָמַ֗רְתִּי אוֹדֶ֤ה עֲלֵ֣י פְ֭שָׁעַי לַיהוָ֑ה וְאַתָּ֨ה נָ֘שָׂ֤אתָ עֲוֹ֖ן חַטָּאתִ֣י סֶֽלָה: ו עַל-זֹ֡את יִתְפַּלֵּ֬ל כָּל-חָסִ֨יד | אֵלֶיךָ֮ לְעֵ֪ת מְ֫צֹ֥א רַ֗ק לְ֭שֵׁטֶף מַ֣יִם רַבִּ֑ים אֵ֝לָ֗יו לֹ֣א יַגִּֽיעוּ: ז אַתָּ֤ה | סֵ֥תֶר לִי֮ מִצַּ֪ר תִּ֫צְּרֵ֥נִי רָנֵּ֥י פַלֵּ֑ט תְּס֖וֹבְבֵ֣נִי סֶֽלָה: ח אַשְׂכִּֽילְךָ֨ | וְֽאוֹרְךָ֗ בְּדֶֽרֶךְ-ז֥וּ תֵלֵ֑ךְ אִֽיעֲצָ֖ה עָלֶ֣יךָ עֵינִֽי: ט אַל-תִּֽהְי֤וּ | כְּס֥וּס כְּפֶרֶד֮ אֵ֤ין הָ֫בִ֥ין בְּמֶֽתֶג-וָרֶ֣סֶן עֶדְי֣וֹ לִבְל֑וֹם בַּ֝֗ל קְרֹ֣ב אֵלֶֽיךָ: י רַבִּ֥ים מַכְאוֹבִ֗ים לָרָ֫שָׁ֥ע וְהַבּוֹטֵ֥חַ בַּיהוָ֑ה חֶ֝֗סֶד יְסוֹבְבֶֽנּוּ: יא שִׂמְח֬וּ בַֽיהוָ֣ה וְ֭גִילוּ צַדִּיקִ֑ים וְ֝הַרְנִ֗ינוּ כָּל-יִשְׁרֵי-לֵֽב:

פרק מ"א
א לַמְנַצֵּ֗חַ מִזְמ֥וֹר לְדָוִֽד: ב אַ֭שְׁרֵי מַשְׂכִּ֣יל אֶל-דָּ֑ל בְּי֥וֹם רָ֝עָ֗ה יְֽמַלְּטֵ֥הוּ יְהוָֽה: ג יְהוָ֤ה | יִשְׁמְרֵ֣הוּ וִֽ֭יחַיֵּהוּ (יאשר) וְאֻשַּׁ֣ר בָּאָ֑רֶץ וְאַֽל-תִּ֝תְּנֵ֗הוּ בְּנֶ֣פֶשׁ אֹיְבָֽיו: ד יְֽהוָ֗ה יִ֭סְעָדֶנּוּ עַל-עֶ֣רֶשׂ דְּוָ֑י כָּל-מִ֝שְׁכָּב֗וֹ הָפַ֥כְתָּ בְחָלְיֽוֹ: ה אֲֽנִי-אָ֭מַרְתִּי יְהוָ֣ה חָנֵּ֑נִי רְפָאָ֥ה נַ֝פְשִׁ֗י כִּי-חָטָ֥אתִי לָֽךְ: ו אוֹיְבַ֗י יֹאמְר֣וּ רַ֣ע לִ֑י מָתַ֥י יָ֝מ֗וּת וְאָבַ֥ד שְׁמֽוֹ: ז וְאִם-בָּ֤א לִרְא֨וֹת | שָׁ֤וְא יְדַבֵּ֗ר לִבּ֗וֹ יִקְבָּץ-אָ֥וֶן ל֑וֹ יֵצֵ֖א לַח֣וּץ יְדַבֵּֽר: ח יַ֗חַד עָלַ֣י יִ֭תְלַחֲשׁוּ כָּל-שֹׂנְאָ֑י עָלַ֓י | יַחְשְׁב֖וּ רָעָ֣ה לִֽי: ט דְּֽבַר-בְּ֭לִיַּעַל יָצ֣וּק בּ֑וֹ וַאֲשֶׁ֥ר שָׁ֝כַ֗ב לֹא-יוֹסִ֥יף לָקֽוּם: י גַּם-אִ֤ישׁ שְׁלוֹמִ֨י | אֲשֶׁר-בָּטַ֣חְתִּי ב֖וֹ אוֹכֵ֣ל לַחְמִ֑י הִגְדִּ֖יל עָלַ֣י עָקֵֽב: יא וְאַתָּ֤ה יְהוָ֗ה חָנֵּ֥נִי וַהֲקִימֵ֑נִי וַֽאֲשַׁלְּמָ֥ה לָהֶֽם: יב בְּזֹ֣את יָ֭דַעְתִּי כִּֽי-חָפַ֣צְתָּ בִּ֑י כִּ֤י לֹֽא-יָרִ֖יעַ אֹיְבִ֣י עָלָֽי: יג וַאֲנִ֗י בְּ֭תֻמִּי תָּמַ֣כְתָּ בִּ֑י וַתַּצִּיבֵ֖נִי לְפָנֶ֣יךָ לְעוֹלָֽם: יד בָּ֘ר֤וּךְ יְהוָ֨ה | אֱלֹ֘הֵ֤י יִשְׂרָאֵ֗ל מֵֽ֭הָעוֹלָם וְעַ֥ד הָעוֹלָ֗ם אָ֘מֵ֥ן | וְאָמֵֽן:

פרק מ"ב
א לַמְנַצֵּ֗חַ מַשְׂכִּ֥יל לִבְנֵי-קֹֽרַח: ב כְּאַיָּ֗ל תַּעֲרֹ֥ג עַל-אֲפִֽיקֵי-מָ֑יִם כֵּ֤ן נַפְשִׁ֨י תַעֲרֹ֖ג אֵלֶ֣יךָ אֱלֹהִֽים: ג צָמְאָ֬ה נַפְשִׁ֨י | לֵאלֹהִים֮ לְאֵ֪ל חָ֥י מָתַ֥י אָב֑וֹא וְ֝אֵרָאֶ֗ה פְּנֵ֣י אֱלֹהִֽים: ד הָֽיְתָה-לִּ֬י דִמְעָתִ֣י לֶ֭חֶם יוֹמָ֣ם וָלָ֑יְלָה בֶּאֱמֹ֥ר אֵלַ֥י כָּל-הַ֝יּ֗וֹם אַיֵּ֥ה אֱלֹהֶֽיךָ: ה אֵ֤לֶּה אֶזְכְּרָ֨ה | וְאֶשְׁפְּכָ֬ה עָלַ֨י | נַפְשִׁ֗י כִּ֤י אֶֽעֱבֹ֨ר | בַּסָּךְ֮ אֶדַּדֵּ֗ם עַד-בֵּ֥ית אֱלֹ֫הִ֥ים בְּקוֹל-רִנָּ֥ה וְתוֹדָ֗ה הָמ֥וֹן חוֹגֵֽג: ו מַה-תִּשְׁתּ֬וֹחֲחִ֨י | נַפְשִׁי֮ וַתֶּהֱמִ֪י עָ֫לָ֥י הוֹחִ֣ילִי לֵֽ֭אלֹהִים כִּי-ע֥וֹד אוֹדֶ֗נּוּ יְשׁוּע֥וֹת פָּנָֽיו: ז אֱֽלֹהַ֗י עָלַי֮ נַפְשִׁ֪י תִשְׁתּ֫וֹחָ֥ח עַל-כֵּ֗ן אֶ֭זְכָּרְךָ מֵאֶ֣רֶץ יַרְדֵּ֑ן וְ֝חֶרְמוֹנִ֗ים מֵהַ֥ר מִצְעָֽר: ח תְּהֽוֹם-אֶל-תְּה֣וֹם ק֭וֹרֵא לְק֣וֹל צִנּוֹרֶ֑יךָ כָּֽל-מִשְׁבָּרֶ֥יךָ וְ֝גַלֶּ֗יךָ עָלַ֥י עָבָֽרוּ: ט יוֹמָ֤ם | יְצַוֶּ֬ה יְהוָ֨ה | חַסְדּ֗וֹ וּ֭בַלַּיְלָה (שירה) שִׁיר֣וֹ עִמִּ֑י תְּ֝פִלָּ֗ה לְאֵ֣ל חַיָּֽי: י אוֹמְרָ֤ה | לְאֵ֥ל סַלְעִי֮ לָמָ֪ה שְׁכַ֫חְתָּ֥נִי לָֽמָּה-קֹדֵ֥ר אֵלֵ֗ךְ בְּלַ֣חַץ אוֹיֵֽב: יא בְּרֶ֤צַח | בְּֽעַצְמוֹתַ֗י חֵרְפ֥וּנִי צוֹרְרָ֑י בְּאָמְרָ֥ם אֵלַ֥י כָּל-הַ֝יּ֗וֹם אַיֵּ֥ה אֱלֹהֶֽיךָ: יב מַה-תִּשְׁתּ֬וֹחֲחִ֨י | נַפְשִׁי֮ וּֽמַה-תֶּהֱמִ֪י עָ֫לָ֥י הוֹחִ֣ילִי לֵֽ֭אלֹהִים כִּי-ע֣וֹד אוֹדֶ֑נּוּ יְשׁוּעֹ֥ת פָּ֝נַ֗י וֵֽאלֹהָֽי:

פרק נ"ט
א לַמְנַצֵּ֣חַ אַל-תַּשְׁחֵת֮ לְדָוִ֪ד מִ֫כְתָּ֥ם בִּשְׁלֹ֥חַ שָׁא֑וּל וַֽיִּשְׁמְר֥וּ אֶת-הַ֝בַּ֗יִת לַהֲמִיתֽוֹ: ב הַצִּילֵ֖נִי מֵאֹיְבַ֥י | אֱלֹהָ֑י מִּמִתְקוֹמְמַ֥י תְּשַׂגְּבֵֽנִי: ג הַ֭צִּילֵנִי מִפֹּ֣עֲלֵי אָ֑וֶן וּֽמֵאַנְשֵׁ֥י דָ֝מִ֗ים הוֹשִׁיעֵֽנִי: ד כִּ֤י הִנֵּ֪ה אָֽרְב֡וּ לְנַפְשִׁ֗י יָג֣וּרוּ עָלַ֣י עַזִ֑ים לֹא-פִשְׁעִ֖י וְלֹא-חַטָּאתִ֣י יְהוָֽה: ה בְּֽלִי-עָ֭וֹן יְרוּצ֣וּן וְיִכּוֹנָ֑נוּ ע֖וּרָה לִקְרָאתִ֣י וּרְאֵה: ו וְאַתָּ֤ה יְהוָֽה-אֱלֹהִ֥ים | צְבָא֡וֹת אֱלֹ֘הֵ֤י יִשְׂרָאֵ֗ל הָקִ֗יצָה לִפְקֹ֥ד כָּֽל-הַגּוֹיִ֑ם אַל-תָּחֹ֨ן כָּל-בֹּ֖גְדֵי אָ֣וֶן סֶֽלָה: ז יָשׁ֣וּבוּ לָ֭עֶרֶב יֶהֱמ֥וּ כַכָּ֗לֶב וִיס֥וֹבְבוּ עִֽיר: ח הִנֵּ֤ה | יַבִּ֘יע֤וּן בְּפִיהֶ֗ם חֲ֭רָבוֹת בְּשִׂפְתוֹתֵיהֶ֑ם כִּי-מִ֥י שֹׁמֵֽעַ: ט וְאַתָּ֣ה יְ֭הוָה תִּשְׂחַק-לָ֑מוֹ תִּ֝לְעַ֗ג לְכָל-גּוֹיִֽם: י עֻ֭זּוֹ אֵלֶ֣יךָ אֶשְׁמֹ֑רָה כִּֽי-אֱ֝לֹהִ֗ים מִשְׂגַּבִּֽי: יא אֱלֹהֵ֣י (חסדו) חַסְדִּ֣י יְקַדְּמֵ֑נִי אֱ֝לֹהִ֗ים יַרְאֵ֥נִי בְשֹׁרְרָֽי: יב אַל-תַּהַרְגֵ֤ם | פֶּֽן-יִשְׁכְּח֬וּ עַמִּ֗י הֲנִיעֵ֣מוֹ בְ֭חֵילְךָ וְהוֹרִידֵ֑מוֹ מָֽגִנֵּ֣נוּ אֲדֹנָֽי: יג חַטַּאת-פִּ֗ימוֹ דְּֽבַר-שְׂפָ֫תֵ֥ימוֹ וְיִלָּכְד֥וּ בִגְאוֹנָ֑ם וּמֵאָלָ֖ה וּמִכַּ֣חַשׁ יְסַפֵּֽרוּ: יד כַּלֵּ֥ה בְחֵמָה֮ כַּלֵּ֪ה וְֽאֵ֫ינֵ֥מוֹ וְֽיֵדְע֗וּ כִּֽי-אֱ֭לֹהִים מֹשֵׁ֣ל בְּיַעֲקֹ֑ב לְאַפְסֵ֖י הָאָ֣רֶץ סֶֽלָה: טו וְיָשׁ֣וּבוּ לָ֭עֶרֶב יֶהֱמ֥וּ כַכָּ֗לֶב וִיס֥וֹבְבוּ עִֽיר: טז הֵ֭מָּה (ינועון) יְנִיע֣וּן לֶאֱכֹ֑ל אִם-לֹ֥א יִ֝שְׂבְּע֗וּ וַיָּלִֽינוּ: יז וַאֲנִ֤י | אָשִׁ֣יר עֻזֶּךָ֮ וַאֲרַנֵּ֥ן לַבֹּ֗קֶר חַ֫סְדֶּ֥ךָ כִּֽי-הָיִ֣יתָ מִשְׂגָּ֣ב לִ֑י וּ֝מָנ֗וֹס בְּי֣וֹם צַר-לִֽי: יח עֻ֭זִּי אֵלֶ֣יךָ אֲזַמֵּ֑רָה כִּֽי-אֱלֹהִ֥ים מִ֝שְׂגַּבִּ֗י אֱלֹהֵ֥י חַסְדִּֽי:

פרק ע"ז
א לַמְנַצֵּ֥חַ עַֽל-(ידיתון) יְדוּת֗וּן לְאָסָ֥ף מִזְמֽוֹר: ב קוֹלִ֣י אֶל-אֱלֹהִ֣ים וְאֶצְעָ֑קָה קוֹלִ֥י אֶל-אֶ֝לֹהִ֗ים וְהַאֲזִ֥ין אֵלָֽי: ג בְּי֥וֹם צָרָתִי֮ אֲדֹנָ֪י דָּ֫רָ֥שְׁתִּי יָדִ֤י | לַ֣יְלָה נִ֭גְּרָה וְלֹ֣א תָפ֑וּג מֵאֲנָ֖ה הִנָּחֵ֣ם נַפְשִֽׁי: ד אֶזְכְּרָ֣ה אֱלֹהִ֣ים וְאֶֽהֱמָיָ֑ה אָשִׂ֓יחָה | וְתִתְעַטֵּ֖ף רוּחִ֣י סֶֽלָה: ה אָ֭חַזְתָּ שְׁמֻר֣וֹת עֵינָ֑י נִ֝פְעַ֗מְתִּי וְלֹ֣א אֲדַבֵּֽר: ו חִשַּׁ֣בְתִּי יָמִ֣ים מִקֶּ֑דֶם שְׁ֝נ֗וֹת עוֹלָמִֽים: ז אֶֽזְכְּרָ֥ה נְגִינָתִ֗י בַּ֫לָּ֥יְלָה עִם-לְבָבִ֥י אָשִׂ֑יחָה וַיְחַפֵּ֥שׂ רוּחִֽי: ח הַֽ֭לְעוֹלָמִים יִזְנַ֥ח | אֲדֹנָ֑י וְלֹֽא-יֹסִ֖יף לִרְצ֣וֹת עֽוֹד: ט הֶאָפֵ֣ס לָנֶ֣צַח חַסְדּ֑וֹ גָּ֥מַר אֹ֝֗מֶר לְדֹ֣ר וָדֹֽר: י הֲשָׁכַ֣ח חַנּ֣וֹת אֵ֑ל אִם-קָפַ֥ץ בְּ֝אַ֗ף רַחֲמָ֥יו סֶֽלָה: יא וָ֭אֹמַר חַלּ֣וֹתִי הִ֑יא שְׁ֝נ֗וֹת יְמִ֣ין עֶלְיֽוֹן: יב (אזכיר) אֶזְכּ֥וֹר מַֽעַלְלֵי-יָ֑הּ כִּֽי-אֶזְכְּרָ֖ה מִקֶּ֣דֶם פִּלְאֶֽךָ: יג וְהָגִ֥יתִי בְכָל-פָּעֳלֶ֑ךָ וּֽבַעֲלִ֖ילוֹתֶ֣יךָ אָשִֽׂיחָה: יד אֱ֭לֹהִים בַּקֹּ֣דֶשׁ דַּרְכֶּ֑ךָ מִי-אֵ֥ל גָּ֝ד֗וֹל כֵּֽאלֹהִֽים: טו אַתָּ֣ה הָ֭אֵל עֹ֣שֵׂה פֶ֑לֶא הוֹדַ֖עְתָּ בָעַמִּ֣ים עֻזֶּֽךָ: טז גָּאַ֣לְתָּ בִּזְר֣וֹעַ עַמֶּ֑ךָ בְּנֵי-יַעֲקֹ֖ב וְיוֹסֵ֣ף סֶֽלָה: יז רָ֘א֤וּךָ מַּ֨יִם | אֱֽלֹהִ֗ים רָא֣וּךָ מַּ֣יִם יָחִ֑ילוּ אַ֝֗ף יִרְגְּז֥וּ תְהֹמֽוֹת: יח זֹ֤רְמוּ מַ֨יִם | עָב֗וֹת ק֖וֹל נָתְנ֣וּ שְׁחָקִ֑ים אַף-חֲ֝צָצֶ֗יךָ יִתְהַלָּֽכוּ: יט ק֤וֹל רַעַמְךָ֨ | בַּגַּלְגַּ֗ל הֵאִ֣ירוּ בְרָקִ֣ים תֵּבֵ֑ל רָגְזָ֖ה וַתִּרְעַ֣שׁ הָאָֽרֶץ: כ בַּיָּ֤ם דַּרְכֶּ֗ךָ (ושביליך) וּֽ֭שְׁבִֽילְךָ בְּמַ֣יִם רַבִּ֑ים וְ֝עִקְּבוֹתֶ֗יךָ לֹ֣א נֹדָֽעוּ: כא נָחִ֣יתָ כַצֹּ֣אן עַמֶּ֑ךָ בְּֽיַד-מֹשֶׁ֥ה וְאַהֲרֹֽן:

פרק צ'
א תְּפִלָּה֮ לְמֹשֶׁ֪ה אִֽישׁ-הָאֱלֹהִ֫ים אֲֽדֹנָ֗י מָע֣וֹן אַ֭תָּה הָיִ֥יתָ לָּ֗נוּ בְּדֹ֣ר וָדֹֽר: ב בְּטֶ֤רֶם | הָ֘רִ֤ים יֻלָּ֗דוּ וַתְּח֣וֹלֵֽל אֶ֣רֶץ וְתֵבֵ֑ל וּֽמֵעוֹלָ֥ם עַד-ע֝וֹלָ֗ם אַתָּ֥ה אֵֽל: ג תָּשֵׁ֣ב אֱנוֹשׁ עַד-דַּכָּ֑א וַ֝תֹּ֗אמֶר שׁ֣וּבוּ בְנֵי-אָדָֽם: ד כִּ֤י אֶ֪לֶף שָׁנִ֡ים בְּֽעֵינֶ֗יךָ כְּי֣וֹם אֶ֭תְמוֹל כִּ֣י יַעֲבֹ֑ר וְאַשְׁמוּרָ֥ה בַלָּֽיְלָה: ה זְ֭רַמְתָּם שֵׁנָ֣ה יִהְי֑וּ בַּ֝בֹּ֗קֶר כֶּחָצִ֥יר יַחֲלֹֽף: ו בַּ֭בֹּקֶר יָצִ֣יץ וְחָלָ֑ף לָ֝עֶ֗רֶב יְמוֹלֵ֥ל וְיָבֵֽשׁ: ז כִּֽי-כָלִ֥ינוּ בְאַפֶּ֑ךָ וּֽבַחֲמָתְךָ֥ נִבְהָֽלְנוּ: ח (שת) שַׁתָּ֣ה עֲוֹנֹתֵ֣ינוּ לְנֶגְדֶּ֑ךָ עֲ֝לֻמֵ֗נוּ לִמְא֥וֹר פָּנֶֽיךָ: ט כִּ֣י כָל-יָ֭מֵינוּ פָּנ֣וּ בְעֶבְרָתֶ֑ךָ כִּלִּ֖ינוּ שָׁנֵ֣ינוּ כְמוֹ-הֶֽגֶה: י יְמֵֽי-שְׁנוֹתֵ֨ינוּ בָהֶ֥ם שִׁבְעִ֪ים שָׁנָ֡ה וְאִ֤ם בִּגְבוּרֹ֨ת | שְׁמ֘וֹנִ֤ים שָׁנָ֗ה וְ֭רָהְבָּם עָמָ֣ל וָאָ֑וֶן כִּי-גָ֥ז חִ֝֗ישׁ וַנָּעֻֽפָה: יא מִֽי-י֭וֹדֵעַ עֹ֣ז אַפֶּ֑ךָ וּ֝כְיִרְאָתְךָ֗ עֶבְרָתֶֽךָ: יב לִמְנ֣וֹת יָ֭מֵינוּ כֵּ֣ן הוֹדַ֑ע וְ֝נָבִ֗א לְבַ֣ב חָכְמָֽה: יג שׁוּבָ֣ה יְ֭הוָה עַד-מָתָ֑י וְ֝הִנָּחֵ֗ם עַל-עֲבָדֶֽיךָ: יד שַׂבְּעֵ֣נוּ בַבֹּ֣קֶר חַסְדֶּ֑ךָ וּֽנְרַנְּנָ֥ה וְ֝נִשְׂמְחָ֗ה בְּכָל-יָמֵֽינוּ: טו שַׂ֭מְּחֵנוּ כִּימ֣וֹת עִנִּיתָ֑נוּ שְׁ֝נ֗וֹת רָאִ֥ינוּ רָעָֽה: טז יֵרָאֶ֣ה אֶל-עֲבָדֶ֣יךָ פָעֳלֶ֑ךָ וַ֝הֲדָרְךָ֗ עַל-בְּנֵיהֶֽם: יז וִיהִ֤י | נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ:

פרק ק"ה
א הוֹד֣וּ לַ֭יהוָה קִרְא֣וּ בִּשְׁמ֑וֹ הוֹדִ֥יעוּ בָ֝עַמִּ֗ים עֲלִילוֹתָֽיו: ב שִֽׁירוּ-ל֖וֹ זַמְּרוּ-ל֑וֹ שִׂ֝֗יחוּ בְּכָל-נִפְלְאוֹתָֽיו: ג הִֽ֭תְהַלְלוּ בְּשֵׁ֣ם קָדְשׁ֑וֹ יִ֝שְׂמַ֗ח לֵ֤ב | מְבַקְשֵׁ֬י יְהוָֽה: ד דִּרְשׁ֣וּ יְהוָ֣ה וְעֻזּ֑וֹ בַּקְּשׁ֖וּ פָנָ֣יו תָּמִֽיד: ה זִכְר֗וּ נִפְלְאוֹתָ֥יו אֲשֶׁר-עָשָׂ֑ה מֹ֝פְתָ֗יו וּמִשְׁפְּטֵי-פִֽיו: ו זֶ֭רַע אַבְרָהָ֣ם עַבְדּ֑וֹ בְּנֵ֖י יַעֲקֹ֣ב בְּחִירָֽיו: ז ה֭וּא יְהוָ֣ה אֱלֹהֵ֑ינוּ בְּכָל-הָ֝אָ֗רֶץ מִשְׁפָּטָֽיו: ח זָכַ֣ר לְעוֹלָ֣ם בְּרִית֑וֹ דָּבָ֥ר צִ֝וָּ֗ה לְאֶ֣לֶף דּֽוֹר: ט אֲשֶׁ֣ר כָּ֭רַת אֶת-אַבְרָהָ֑ם וּשְׁב֖וּעָת֣וֹ לְיִשְׂחָֽק: י וַיַּֽעֲמִידֶ֣הָ לְיַעֲקֹ֣ב לְחֹ֑ק לְ֝יִשְׂרָאֵ֗ל בְּרִ֣ית עוֹלָֽם: יא לֵאמֹ֗ר לְךָ֗ אֶתֵּ֥ן אֶת-אֶֽרֶץ-כְּנָ֑עַן חֶ֝֗בֶל נַחֲלַתְכֶֽם: יב בִּֽ֭הְיוֹתָם מְתֵ֣י מִסְפָּ֑ר כִּ֝מְעַ֗ט וְגָרִ֥ים בָּֽהּ: יג וַֽ֭יִּתְהַלְּכוּ מִגּ֣וֹי אֶל-גּ֑וֹי מִ֝מַּמְלָכָ֗ה אֶל-עַ֥ם אַחֵֽר: יד לֹֽא-הִנִּ֣יחַ אָדָ֣ם לְעָשְׁקָ֑ם וַיּ֖וֹכַח עֲלֵיהֶ֣ם מְלָכִֽים: טו אַֽל-תִּגְּע֥וּ בִמְשִׁיחָ֑י וְ֝לִנְבִיאַי אַל-תָּרֵֽעוּ: טז וַיִּקְרָ֣א רָ֭עָב עַל-הָאָ֑רֶץ כָּֽל-מַטֵּה-לֶ֥חֶם שָׁבָֽר: יז שָׁלַ֣ח לִפְנֵיהֶ֣ם אִ֑ישׁ לְ֝עֶ֗בֶד נִמְכַּ֥ר יוֹסֵֽף: יח עִנּ֣וּ בַכֶּ֣בֶל (רגליו) רַגְל֑וֹ בַּ֝רְזֶ֗ל בָּ֣אָה נַפְשֽׁוֹ: יט עַד-עֵ֥ת בֹּֽא-דְבָר֑וֹ אִמְרַ֖ת יְהוָ֣ה צְרָפָֽתְהוּ: כ שָׁ֣לַח מֶ֭לֶךְ וַיַּתִּירֵ֑הוּ מֹשֵׁ֥ל עַ֝מִּ֗ים וַֽיְפַתְּחֵֽהוּ: כא שָׂמ֣וֹ אָד֣וֹן לְבֵית֑וֹ וּ֝מֹשֵׁ֗ל בְּכָל-קִנְיָנֽוֹ: כב לֶאְסֹ֣ר שָׂרָ֣יו בְּנַפְשׁ֑וֹ וּזְקֵנָ֥יו יְחַכֵּֽם: כג וַיָּבֹ֣א יִשְׂרָאֵ֣ל מִצְרָ֑יִם וְ֝יַעֲקֹ֗ב גָּ֣ר בְּאֶֽרֶץ-חָֽם: כד וַיֶּ֣פֶר אֶת-עַמּ֣וֹ מְאֹ֑ד וַ֝יַּֽעֲצִמֵהוּ מִצָּרָֽיו: כה הָפַ֣ךְ לִ֭בָּם לִשְׂנֹ֣א עַמּ֑וֹ לְ֝הִתְנַכֵּ֗ל בַּעֲבָדָֽיו: כו שָׁ֭לַח מֹשֶׁ֣ה עַבְדּ֑וֹ אַ֝הֲרֹ֗ן אֲשֶׁ֣ר בָּֽחַר-בּֽוֹ: כז שָֽׂמוּ-בָ֭ם דִּבְרֵ֣י אֹתוֹתָ֑יו וּ֝מֹפְתִ֗ים בְּאֶ֣רֶץ חָֽם: כח שָׁ֣לַֽח חֹ֭שֶׁךְ וַיַּחְשִׁ֑ךְ וְלֹֽא-מָ֝ר֗וּ אֶת-(דבריו) דְּבָרֽוֹ: כט הָפַ֣ךְ אֶת-מֵימֵיהֶ֣ם לְדָ֑ם וַ֝יָּ֗מֶת אֶת-דְּגָתָֽם: ל שָׁרַ֣ץ אַרְצָ֣ם צְפַרְדְּעִ֑ים בְּ֝חַדְרֵ֗י מַלְכֵיהֶֽם: לא אָ֭מַר וַיָּבֹ֣א עָרֹ֑ב כִּ֝נִּ֗ים בְּכָל-גְּבוּלָֽם: לב נָתַ֣ן גִּשְׁמֵיהֶ֣ם בָּרָ֑ד אֵ֖שׁ לֶהָב֣וֹת בְּאַרְצָֽם: לג וַיַּ֣ךְ גַּ֭פְנָם וּתְאֵנָתָ֑ם וַ֝יְשַׁבֵּ֗ר עֵ֣ץ גְּבוּלָֽם: לד אָ֭מַר וַיָּבֹ֣א אַרְבֶּ֑ה וְ֝יֶ֗לֶק וְאֵ֣ין מִסְפָּֽר: לה וַיֹּ֣אכַל כָּל-עֵ֣שֶׂב בְּאַרְצָ֑ם וַ֝יֹּ֗אכַל פְּרִ֣י אַדְמָתָֽם: לו וַיַּ֣ךְ כָּל-בְּכ֣וֹר בְּאַרְצָ֑ם רֵ֝אשִׁ֗ית לְכָל-אוֹנָֽם: לז וַֽ֭יּוֹצִיאֵם בְּכֶ֣סֶף וְזָהָ֑ב וְאֵ֖ין בִּשְׁבָטָ֣יו כּוֹשֵֽׁל: לח שָׂמַ֣ח מִצְרַ֣יִם בְּצֵאתָ֑ם כִּֽי-נָפַ֖ל פַּחְדָּ֣ם עֲלֵיהֶֽם: לט פָּרַ֣שׂ עָנָ֣ן לְמָסָ֑ךְ וְ֝אֵ֗שׁ לְהָאִ֥יר לָֽיְלָה: מ שָׁאַ֣ל וַיָּבֵ֣א שְׂלָ֑ו וְלֶ֥חֶם שָׁ֝מַ֗יִם יַשְׂבִּיעֵֽם: מא פָּ֣תַח צ֭וּר וַיָּז֣וּבוּ מָ֑יִם הָ֝לְכ֗וּ בַּצִּיּ֥וֹת נָהָֽר: מב כִּֽי-זָ֭כַר אֶת-דְּבַ֣ר קָדְשׁ֑וֹ אֶֽת-אַבְרָהָ֥ם עַבְדּֽוֹ: מג וַיּוֹצִ֣א עַמּ֣וֹ בְשָׂשׂ֑וֹן בְּ֝רִנָּ֗ה אֶת-בְּחִירָֽיו: מד וַיִּתֵּ֣ן לָ֭הֶם אַרְצ֣וֹת גּוֹיִ֑ם וַעֲמַ֖ל לְאֻמִּ֣ים יִירָֽשׁוּ: מה בַּעֲב֤וּר | יִשְׁמְר֣וּ חֻ֭קָּיו וְתוֹרֹתָ֥יו יִנְצֹ֗רוּ הַֽלְלוּיָֽהּ:

פרק קל"ז
א עַ֥ל נַהֲר֨וֹת | בָּבֶ֗ל שָׁ֣ם יָ֭שַׁבְנוּ גַּם-בָּכִ֑ינוּ בְּ֝זָכְרֵ֗נוּ אֶת-צִיּֽוֹן: ב עַֽל-עֲרָבִ֥ים בְּתוֹכָ֑הּ תָּ֝לִ֗ינוּ כִּנֹּרוֹתֵֽינוּ: ג כִּ֤י שָׁ֨ם שְֽׁאֵל֪וּנוּ שׁוֹבֵ֡ינוּ דִּבְרֵי-שִׁ֭יר וְתוֹלָלֵ֣ינוּ שִׂמְחָ֑ה שִׁ֥ירוּ לָ֝֗נוּ מִשִּׁ֥יר צִיּֽוֹן: ד אֵ֗יךְ נָשִׁ֥יר אֶת-שִׁיר-יְהוָ֑ה עַ֝֗ל אַדְמַ֥ת נֵכָֽר: ה אִֽם-אֶשְׁכָּחֵ֥ךְ יְֽרוּשָׁלִָ֗ם תִּשְׁכַּ֥ח יְמִינִֽי: ו תִּדְבַּ֥ק-לְשׁוֹנִ֨י | לְחִכִּי֮ אִם-לֹ֪א אֶ֫זְכְּרֵ֥כִי אִם-לֹ֣א אַ֭עֲלֶה אֶת-יְרוּשָׁלִַ֑ם עַ֝֗ל רֹ֣אשׁ שִׂמְחָתִֽי: ז זְכֹ֤ר יְהוָ֨ה | לִבְנֵ֬י אֱד֗וֹם אֵת֮ י֤וֹם יְֽרוּשָׁ֫לִָ֥ם הָ֭אֹ֣מְרִים עָ֤רוּ | עָ֑רוּ עַ֝֗ד הַיְס֥וֹד בָּֽהּ: ח בַּת-בָּבֶ֗ל הַשְּׁד֫וּדָ֥ה אַשְׁרֵ֥י שֶׁיְשַׁלֶּם-לָ֑ךְ אֶת-גְּ֝מוּלֵ֗ךְ שֶׁגָּמַ֥לְתְּ לָֽנוּ: ט אַשְׁרֵ֤י | שֶׁיֹּאחֵ֓ז וְנִפֵּ֬ץ אֶֽת-עֹ֝לָלַ֗יִךְ אֶל-הַסָּֽלַע:

פרק ק"נ
א הַ֥לְלוּיָ֨הּ | הַֽלְלוּ-אֵ֥ל בְּקָדְשׁ֑וֹ הַֽ֝לְל֗וּהוּ בִּרְקִ֥יעַ עֻזּֽוֹ: ב הַֽלְל֥וּהוּ בִגְבוּרֹתָ֑יו הַֽ֝לְל֗וּהוּ כְּרֹ֣ב גֻּדְלֽוֹ: ג הַֽ֭לְלוּהוּ בְּתֵ֣קַע שׁוֹפָ֑ר הַֽ֝לְל֗וּהוּ בְּנֵ֣בֶל וְכִנּֽוֹר: ד הַֽ֭לְלוּהוּ בְתֹ֣ף וּמָח֑וֹל הַֽ֝לְל֗וּהוּ בְּמִנִּ֥ים וְעוּגָֽב: ה הַֽלְל֥וּהוּ בְצִלְצְלֵי-שָׁ֑מַע הַֽ֝לְל֗וּהוּ בְּֽצִלְצְלֵ֥י תְרוּעָֽה: ו כֹּ֣ל הַ֭נְּשָׁמָה תְּהַלֵּ֥ל יָ֗הּ הַֽלְלוּיָֽהּ:
לאחר אמירת תהלים אומרים את הפסוקים:

מִי יִתֵּן מִצִּיּוֹן יְשׁוּעַת יִשְׂרָאֵל, בְּשּׁוּב אֲדֹנָי שְׁבוּת עַמּוֹ – יָגֵל יַעֲקֹב, יִשְׂמַח יִשְׂרָאֵל. וּתְשׁוּעַת צַדִּיקִים מֵאֲדֹנָי מָעוּזָּם בְּעֵת צָרָה. וַיַּעְזְרֵם אֲדֹנָי וַיְפַלְּטֵם, יְפַלְּטֵם מֵרְשָׁעִים וְיוֹשִׁיעֵם כִּי חָסוּ בּוֹ.

תפילה קצרה לאמרה אחר אמירת תיקון הכללי:
רִבּוֹנוֹ שֶׁל עוֹלָם, עִלַּת הָעִלּוֹת וְסִבַּת כָּל הַסִּבּוֹת, אַנְתְּ לְעֵלָּא, לְעֵלָּא מִן כֹּלָּא, וְלֵית לְעֵלָּא מִנָּךְ, דְלֵית מַחֲשָׁבָה תְּפִיסָא בָּךְ כְּלָל. וּלְךָ דּוּמִיָּה תְהִלָּה; וּמְרוֹמָם עַל כָּל בְּרָכָה וּתְהִלָּה. אוֹתְךָ אֶדְרֹשׁ, אוֹתְךָ אֲבַקֵּשׁ, שֶׁתַּחְתֹּר חֲתִירָה דֶּרֶךְ כְּבוּשָׁה מֵאִתְּךָ, דֶּרֶךְ כָּל הָעוֹלָמוֹת עַד הַהִשְׁתַּלְשְׁלוּת שֶׁלִּי, בַּמָּקוֹם שֶׁאֲנִי עוֹמֵד, כְּפִי אֲשֶׁר נִגְלֶה לְךָ, יוֹדֵעַ תַּעֲלוּמוֹת. וּבַדֶּרֶךְ וְנָתִיב הַזֶּה תָּאִיר עָלַי אוֹרְךָ, לְהַחֲזִירֵנִי בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶיךָ בֶּאֱמֶת, כְּפִי רְצוֹנְךָ בֶּאֱמֶת; כְּפִי רְצוֹן מִבְחַר הַבְּרוּאִים: לִבְלִי לַחְשֹׁב בְּמַחֲשַׁבְתִּי שׁוּם מַחֲשֶּׁבֶת חוּץ וְשׁוּם מַחֲשָׁבָה וּבִלְבּוּל שֶׁהוּא נֶגֶד רְצוֹנֶךָ. רַק לְדַבֵּק בְּמַחֲשָׁבוֹת זַכּוֹת, צַחוֹת וּקְדוֹשׁוֹת בַּעֲבוֹדָתְך בֶּאֱמֶת, בְּהַשָּׂגָתְךָ וּבְתוֹרָתֶךָ. הַט לִבִּי אֶל עֵדְוֹתֶיך וְתַן לִי לֵב טָהוֹר לְעָבְדְּךָ בֶּאֱמֶת. וּמִמְּצוּלוֹת יָם תּוֹצִיאֵנִי לְאוֹר גָּדוֹל חִישׁ קַל מְהֵרָה, תְּשׁוּעַת אֲדֹנָי כְּהֶרֶף עַיִן, לֵאוֹר בְּאוֹר הַחַיִּים, כָּל יְמֵי הֱיוֹתִי עַל פְּנֵי הָאֲדָמָה; וְאֶזְכֶּה לְחַדֵּש נְעוּרָי, הַיָּמִים שֶׁעָבְרוּ בַּחֹשֶׁךְ לְהַחֲזִירָם אֶל הַקְּדֻשָּׁה. וְתִהְיֶה יְצִיאָתִי מִן הָעוֹלָם כְּבִיאָתִי: בְּלֹא חֵטְא. וְאֶזְכֶּה לַחֲזוֹת בְּנֹעַם אֲדֹנָי וּלְבַקֵּר בְּהֵיכָלוֹ, כֻּלּוֹ אוֹמֵר כָּבוֹד. אָמֵן נֶצַח סֶלָה וָעֶד.`;

      PRAYER_DB["tikkun-haklali"] = {
        title: "תיקון הכללי (י׳ מזמורים)",
        nusach: {
          all: TIKKUN_HAKLALI_TEXT,
        },
        seasonal: () => "",
      };

      // ── Build prayer modal HTML ───────────────────────
      function openPrayer(key, heLabel, enLabel) {
        const entry = PRAYER_DB[key];

        // Fallback: open Sefaria if prayer not in local DB
        if (!entry) {
          const refs = {
            'tehillim': 'https://www.sefaria.org/Psalms?lang=bi',
            'birkat-hamazon': 'https://www.sefaria.org/Birkat_Hamazon?lang=bi',
          };
          const url = refs[key] || `https://www.sefaria.org/search?q=${encodeURIComponent(heLabel)}&lang=he`;
          window.open(url, '_blank');
          return;
        }

        const season = getHebrewSeasonInfo();
        const seasonNote = entry.seasonal ? entry.seasonal(season) : '';

        // Pick nusach-specific text
        const nusachTexts = entry.nusach;
        let text = nusachTexts[CURRENT_NUSACH] || nusachTexts.mizrahi || nusachTexts.all || '';

        // Format text: bold headers, line breaks
        const formatText = (t) => t
          .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#93c5fd;display:block;margin:1rem 0 0.3rem;">$1</strong>')
          .replace(/\n/g, '<br>');

        const nusachNames = {
          mizrahi: 'עדות המזרח', sfard: 'ספרד', ashkenaz: 'אשכנז',
          temani_shami: 'תימן שאמי', temani_baladi: 'תימן בלאדי'
        };

        let existing = document.getElementById('prayer-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'prayer-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(2,6,23,0.92);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;';
        modal.innerHTML = `
          <div class="modal-inner" style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:600px;margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.6);text-align:center;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <h3 class="modal-title" style="color:#f1f5f9;font-size:1.4rem;font-weight:900;margin:0;">${entry.title}</h3>
              <button class="modal-close" onclick="closePrayerModal()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
            </div>
            <div class="modal-nusach" style="color:#64748b;font-size:0.75rem;margin-bottom:1.2rem;">נוסח: <strong style="color:#818cf8;">${nusachNames[CURRENT_NUSACH] || CURRENT_NUSACH}</strong> &nbsp;|&nbsp; ניתן לשנות בהגדרות</div>
            ${seasonNote ? `<div class="modal-season" style="background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.3);border-radius:1rem;padding:0.85rem 1rem;margin-bottom:1rem;font-size:0.82rem;color:#fde047;line-height:1.7;">${seasonNote.replace(/\n/g,'<br>')}</div>` : ''}
            <div class="modal-body" style="background:rgba(255,255,255,0.04);border-radius:1rem;padding:1.25rem;font-size:1rem;line-height:2;color:#e2e8f0;font-family:'David Libre','Frank Ruhl Libre',serif;max-height:60vh;overflow-y:auto;">
              ${formatText(text)}
              ${entry.extraLink ? `<br><br><a href="${entry.extraLink}" target="_blank" style="color:#60a5fa;font-size:0.85rem;">📖 פתח טקסט מלא ב-Sefaria.org ←</a>` : ''}
            </div>
            <p class="modal-credit" style="color:#334155;font-size:0.68rem;margin-top:1rem;text-align:center;">המקור: נוסחי תפילה מסורתיים | ספריית ספריא.org (CC-BY-SA) | מחבר: הלוח היהודי</p>
          </div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
      }

      // ── Dedicated Tehillim Page ───────────────────────────────
      function openTehillimPage() {
        const DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
        const DAY_PSALMS = [
          { day: 'ראשון',  range: [1,29],   chapters: Array.from({length:29},  (_,i)=>i+1)   },
          { day: 'שני',    range: [30,50],  chapters: Array.from({length:21},  (_,i)=>i+30)  },
          { day: 'שלישי',  range: [51,72],  chapters: Array.from({length:22},  (_,i)=>i+51)  },
          { day: 'רביעי',  range: [73,89],  chapters: Array.from({length:17},  (_,i)=>i+73)  },
          { day: 'חמישי',  range: [90,106], chapters: Array.from({length:17},  (_,i)=>i+90)  },
          { day: 'שישי',   range: [107,119],chapters: Array.from({length:13},  (_,i)=>i+107) },
          { day: 'שבת',    range: [120,150],chapters: Array.from({length:31},  (_,i)=>i+120) },
        ];

        // Today's day (0=Sun … 6=Sat)
        const todayDow = new Date().getDay();
        let activeDayIdx = todayDow; // 0=ראשון, 6=שבת

        const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];

        let existing = document.getElementById('tehillim-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'tehillim-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(2,6,23,0.95);backdrop-filter:blur(8px);display:flex;flex-direction:column;overflow:hidden;';

        function buildPage(dayIdx) {
          activeDayIdx = dayIdx;
          const dayData = DAY_PSALMS[dayIdx];
          const color   = colors[dayIdx];

          const tabsHTML = DAY_PSALMS.map((d,i) => `
            <button onclick="window._tehillimSwitchDay(${i})"
              style="padding:0.35rem 0.7rem;border-radius:999px;font-size:0.75rem;font-weight:700;border:1px solid ${i===dayIdx ? color : 'rgba(255,255,255,0.12)'};
                     background:${i===dayIdx ? color : 'transparent'};color:${i===dayIdx ? '#fff' : '#94a3b8'};cursor:pointer;white-space:nowrap;transition:all 0.15s;">
              ${d.day}
            </button>`).join('');

          const chaptersHTML = dayData.chapters.map(n => `
            <button onclick="window._tehillimOpenPsalm(${n})"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;
                     padding:0.55rem;font-size:0.85rem;font-weight:700;color:#e2e8f0;cursor:pointer;
                     transition:all 0.15s;text-align:center;"
              onmouseover="this.style.background='${color}33';this.style.borderColor='${color}66';"
              onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.1)';">
              ${n}
            </button>`).join('');

          modal.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem 0.75rem;border-bottom:1px solid rgba(255,255,255,0.08);flex-shrink:0;">
              <div>
                <h2 style="color:#f1f5f9;font-size:1.3rem;font-weight:900;margin:0;">ספר תהילים</h2>
                <p style="color:${color};font-size:0.78rem;font-weight:700;margin:0.15rem 0 0;">יום ${dayData.day} — תהלים ${dayData.range[0]}–${dayData.range[1]}</p>
              </div>
              <button onclick="closeTehillimModal()"
                style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.1rem;flex-shrink:0;">✕</button>
            </div>

            <!-- Day tabs -->
            <div style="display:flex;gap:0.4rem;padding:0.75rem 1.25rem;overflow-x:auto;flex-shrink:0;scrollbar-width:none;">
              ${tabsHTML}
            </div>

            <!-- Psalm grid -->
            <div style="padding:0 1.25rem;overflow-y:auto;flex:1;">
              <p style="color:#64748b;font-size:0.72rem;margin:0 0 0.75rem;">לחץ על מספר פרק לקריאת הטקסט המלא</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:0.5rem;padding-bottom:1.5rem;">
                ${chaptersHTML}
              </div>
            </div>

            <!-- Psalm content pane (hidden initially) -->
            <div id="psalm-content-pane" style="display:none;position:absolute;inset:0;background:rgba(2,6,23,0.98);z-index:10;flex-direction:column;overflow:hidden;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.08);">
                <button id="psalm-back-btn" onclick="document.getElementById('psalm-content-pane').style.display='none';"
                  style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;padding:0.4rem 0.8rem;border-radius:999px;cursor:pointer;font-size:0.8rem;font-weight:700;">
                  ← חזרה
                </button>
                <h3 id="psalm-title" style="color:#f1f5f9;font-size:1rem;font-weight:900;margin:0;">תהלים א</h3>
                <div style="width:60px;"></div>
              </div>
              <div id="psalm-text-area" style="padding:1.25rem;overflow-y:auto;flex:1;font-family:'David Libre','Frank Ruhl Libre',serif;font-size:1.05rem;line-height:2;color:#e2e8f0;text-align:center;direction:rtl;">
                <div style="text-align:center;padding:2rem;">
                  <div style="width:36px;height:36px;border:3px solid ${color};border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div>
                  <p style="color:#64748b;">טוען...</p>
                </div>
              </div>
              <p style="color:#1e293b;font-size:0.65rem;text-align:center;padding:0.5rem;flex-shrink:0;">מקור: Sefaria.org (CC-BY-SA) | תנ"ך על-פי כתב יד אלפי"א</p>
            </div>`;
        }

        window._tehillimSwitchDay = (idx) => buildPage(idx);

        window._tehillimOpenPsalm = async (num) => {
          const pane = document.getElementById('psalm-content-pane');
          const title = document.getElementById('psalm-title');
          const area  = document.getElementById('psalm-text-area');
          const color = colors[activeDayIdx];

          if (!pane || !title || !area) return;
          pane.style.display = 'flex';
          pane.style.flexDirection = 'column';
          title.textContent = `תהלים פרק ${num}`;
          area.innerHTML = `<div style="text-align:center;padding:2rem;"><div style="width:36px;height:36px;border:3px solid ${color};border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div><p style="color:#64748b;">טוען פרק ${num}...</p></div>`;

          try {
            const url = `https://www.sefaria.org/api/texts/Psalms.${num}?lang=he&context=0`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json();
            const heTexts = data.he || [];
            if (!heTexts.length) throw new Error('no text');

            const verses = heTexts.map((v, i) => {
              const clean = typeof v === 'string' ? v : (Array.isArray(v) ? v.join('') : String(v));
              return `<span style="color:${color};font-size:0.75rem;font-weight:700;margin-left:0.3rem;">(${i+1})</span>${clean}`;
            }).join(' &nbsp;');

            area.innerHTML = `
              <p style="color:#64748b;font-size:0.72rem;margin-bottom:1rem;">תהלים פרק ${num} | ${heTexts.length} פסוקים</p>
              <div style="line-height:2.2;">${verses}</div>
              <br>
              <a href="https://www.sefaria.org/Psalms.${num}?lang=bi" target="_blank"
                style="color:#60a5fa;font-size:0.8rem;display:block;text-align:center;margin-top:1rem;">
                📖 פתח ב-Sefaria ←
              </a>`;
          } catch(err) {
            area.innerHTML = `
              <p style="color:#ef4444;text-align:center;margin-bottom:1rem;">לא ניתן לטעון את הטקסט כעת.</p>
              <div style="text-align:center;">
                <a href="https://www.sefaria.org/Psalms.${num}?lang=bi" target="_blank"
                  style="background:${color};color:#fff;padding:0.6rem 1.5rem;border-radius:999px;text-decoration:none;font-weight:700;font-size:0.9rem;">
                  📖 פתח פרק ${num} ב-Sefaria
                </a>
              </div>`;
          }
        };

        buildPage(activeDayIdx);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeTehillimModal(); });
        document.body.appendChild(modal);
        lockBodyScroll();
        pushModalState('tehillim-modal');
      }

      function toggleMorePrayers() {
        const grid = document.getElementById('prayer-more-grid');
        const chevron = document.getElementById('prayer-more-chevron');
        const label = document.getElementById('prayer-more-label');
        const isOpen = !grid.classList.contains('hidden');
        grid.classList.toggle('hidden', isOpen);
        chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
        label.textContent = isOpen ? 'תפילות נוספות' : 'פחות';
      }

      // Store last zData globally for opinions popup
      window._lastZData = null;

      function renderZmanimGrid(zData) {
        window._lastZData = zData;
        const ft = (iso) =>
          iso
            ? new Date(iso).toLocaleTimeString(getCurrentLocale(), {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--:--";

        // Save Tzeit for Omer Push Notifications
        if (zData.times.tzeit7083deg)
          window.TZEIT_TIME = new Date(zData.times.tzeit7083deg);

        // ── Build zmanim array with all opinions ──────────────────
        const now = new Date();

        // ── Compute night-watch times ─────────────────────────────
        const _sunMs  = zData.times.sunset      ? new Date(zData.times.sunset).getTime()      : null;
        const _chnMs  = zData.times.chatzotNight? new Date(zData.times.chatzotNight).getTime(): null;
        // Night = sunset → alot (tomorrow); midpoint = chatzotNight
        // Full night ≈ 2*(chatzotNight − sunset)
        // 1/3 of night = 2*(chn−sun)/3; 2/3 = 4*(chn−sun)/3
        // אשמורת התיכונה starts at sunset + 2*(chn−sun)/3
        // אשמורת הבוקר  starts at sunset + 4*(chn−sun)/3 = chn + (chn−sun)/3
        const _ashTMs  = (_sunMs && _chnMs) ? Math.round(_sunMs + 2*(_chnMs-_sunMs)/3) : null;
        const _ashBMs  = (_sunMs && _chnMs) ? Math.round(_chnMs + (_chnMs-_sunMs)/3)   : null;
        const _ashTIso = _ashTMs ? new Date(_ashTMs).toISOString() : null;
        const _ashBIso = _ashBMs ? new Date(_ashBMs).toISOString() : null;

        // ── Bein HaShmashos: API or calculated (sunset + 13.5 min) ─
        const _beinRaw = zData.times.beinHaShmashos || zData.times.beinHashmashos || null;
        const _beinIso = _beinRaw || (_sunMs ? new Date(_sunMs + 13.5*60000).toISOString() : null);

        const zmanimList = [
          {
            key: "alot",       label: "עלות השחר",
            iso: zData.times.alotHaShachar,
            opinions: [{ name: "מגן אברהם / גר\"א", val: ft(zData.times.alotHaShachar) }]
          },
          {
            key: "talit",      label: "זמן טלית ותפילין",
            iso: zData.times.misheyakir || zData.times.misheyakirMachmir,
            opinions: [
              { name: "משיכיר (11.5° מתחת לאופק)", val: ft(zData.times.misheyakir) },
              { name: "משיכיר 11° מתחת לאופק", val: ft(zData.times.misheyakirMachmir) },
              ...(zData.times.misheyakir10_2 ? [{ name: "משיכיר 10.2° מתחת לאופק", val: ft(zData.times.misheyakir10_2) }] : []),
            ]
          },
          {
            key: "netz",       label: "הנץ החמה",
            iso: zData.times.sunrise,
            opinions: [
              { name: "מותאם לגובה", val: ft(zData.times.sunrise) },
              ...(zData.times.seaLevelSunrise ? [{ name: "גובה פני הים", val: ft(zData.times.seaLevelSunrise) }] : []),
            ]
          },
          {
            key: "shma",       label: 'סוף ק"ש',
            iso: ZMANIM_METHOD === "MGA" ? zData.times.sofZmanShmaMGA : zData.times.sofZmanShma,
            opinions: [
              { name: "מגן אברהם (עלות–צאת)", val: ft(zData.times.sofZmanShmaMGA) },
              { name: "גר\"א / בעל התניא (הנץ–שקיעה)", val: ft(zData.times.sofZmanShma) },
            ]
          },
          {
            key: "tfilla",     label: "סוף זמן תפילה",
            iso: ZMANIM_METHOD === "MGA" ? zData.times.sofZmanTfillaMGA : zData.times.sofZmanTfilla,
            opinions: [
              { name: "מגן אברהם", val: ft(zData.times.sofZmanTfillaMGA) },
              { name: "גר\"א / בעל התניא", val: ft(zData.times.sofZmanTfilla) },
            ]
          },
          {
            key: "chatzot",    label: "חצות היום",
            iso: zData.times.chatzot,
            opinions: [
              { name: "חצות היום (מחצית היום ההלכתי)", val: ft(zData.times.chatzot) },
            ]
          },
          {
            key: "mincha_g",   label: "מנחה גדולה",
            iso: zData.times.minchaGedola,
            opinions: [
              { name: "מגן אברהם / גר\"א (חצי שעה אחר חצות)", val: ft(zData.times.minchaGedola) },
              { name: "רפ\"ב (30 דק׳ שעות זמניות)", val: ft(zData.times.minchaGedola72Min) },
            ]
          },
          {
            key: "mincha_k",   label: "מנחה קטנה",
            iso: zData.times.minchaKetana,
            opinions: [{ name: "כל השיטות (9.5 שעות זמניות)", val: ft(zData.times.minchaKetana) }]
          },
          {
            key: "plag",       label: "פלג המנחה",
            iso: zData.times.plagHaMincha,
            opinions: [
              { name: "מגן אברהם", val: ft(zData.times.plagHaMincha) },
              { name: "גר\"א / שו\"ע הרב", val: ft(zData.times.plagHaMinchaGRA) },
            ]
          },
          {
            key: "shkia",      label: "שקיעה",
            iso: zData.times.sunset,
            opinions: [{ name: "מותאם לגובה", val: ft(zData.times.sunset) }]
          },
          {
            key: "bein_hashmashot", label: "בין השמשות",
            iso: zData.times.beinHaShmashos || _beinIso,
            opinions: [
              { name: "רבנו תם — 2 כוכבים", val: ft(zData.times.beinHaShmashos) },
              { name: "שו\"ע (כ-13.5 דק׳ אחר שקיעה)", val: ft(_beinIso) },
            ]
          },
          {
            key: "tzeit",      label: "צאת הכוכבים",
            iso: zData.times.tzeit7083deg,
            opinions: [
              { name: "תצ\"ה — 7.083° (שלוש כוכבים בינוניים)", val: ft(zData.times.tzeit7083deg) },
              { name: "לילה — 8.5° מתחת לאופק", val: ft(zData.times.tzeit8_5deg) },
              { name: "בעל התניא — 50 דקות", val: ft(zData.times.tzeit50min) },
              { name: "ג׳ כוכבים קטנים (13.5 דק׳ זמניות)", val: ft(zData.times.tzeit13Point5MinutesZmanis) },
            ]
          },
          {
            key: "ashmeret_tkona", label: "אשמורת התיכונה",
            iso: _ashTIso,
            opinions: [
              { name: "תחילת משמרת שנייה של הלילה", val: ft(_ashTIso) },
              { name: "שליש שני (= שני שלישים מהשקיעה)", val: ft(_ashTIso) },
            ]
          },
          {
            key: "ashmeret_boker", label: "אשמורת הבוקר",
            iso: _ashBIso,
            opinions: [
              { name: "תחילת אשמורת הבוקר (לפני עלות השחר)", val: ft(_ashBIso) },
              { name: "שני שלישים מהלילה (4/6 מהשקיעה)", val: ft(_ashBIso) },
            ]
          },
        ];

        // ── FIFO: next upcoming first, past times at end ──────────
        zmanimList.forEach(z => {
          z._ms = z.iso ? new Date(z.iso).getTime() : null;
        });
        const nowMs = now.getTime();
        const future = zmanimList.filter(z => z._ms && z._ms >= nowMs).sort((a,b) => a._ms - b._ms);
        const past   = zmanimList.filter(z => z._ms && z._ms <  nowMs).sort((a,b) => a._ms - b._ms);
        const noTime = zmanimList.filter(z => !z._ms);
        const sorted = [...future, ...past, ...noTime];

        // ── Render ────────────────────────────────────────────────
        const cardClass = "zman-card bg-gradient-to-br from-indigo-900/50 to-blue-900/30 border border-blue-400/15 rounded-2xl p-3 hover:border-blue-400/35 hover:from-indigo-900/70 transition-all cursor-pointer zman-clickable";
        const isPast = (z) => z._ms && z._ms < nowMs;

        document.getElementById("zmanim-details").innerHTML = sorted.map(z => `
          <div class="${cardClass}${isPast(z) ? ' opacity-50' : ''}" data-zman-key="${z.key}" onclick="showZmanOpinions('${z.key}')">
            <span class="text-blue-300/80 text-xs md:text-sm block mb-1.5 font-semibold">${z.label}</span>
            <span class="font-black text-lg md:text-xl text-white tracking-tight" dir="ltr">${z._displayVal !== undefined ? z._displayVal : ft(z.iso)}</span>
          </div>`).join('');

        // Apply i18n labels
        const ui = getDynamicUiText();
        const labels = ui.zmanimLabels || [];
        // Keep labels synced if i18n has overrides (legacy support)
        const rendered = document.querySelectorAll("#zmanim-details > div");
        rendered.forEach((card, i) => {
          const key = card.dataset.zmanKey;
          const zItem = zmanimList.find(z => z.key === key);
          // i18n override by position only if label matches
          const firstSpan = card.querySelector("span");
          if (labels[i] && firstSpan) firstSpan.textContent = labels[i];
        });
      }

      // ── Zman Opinions Popup ───────────────────────────────────
      function showZmanOpinions(key) {
        const zData = window._lastZData;
        if (!zData) return;

        const ft = (iso) => iso
          ? new Date(iso).toLocaleTimeString(getCurrentLocale(), { hour: "2-digit", minute: "2-digit" })
          : "—";

        // Re-compute night-watch ISO for opinions popup (mirrors renderZmanimGrid logic)
        const _opSunMs = zData.times.sunset       ? new Date(zData.times.sunset).getTime()       : null;
        const _opChnMs = zData.times.chatzotNight ? new Date(zData.times.chatzotNight).getTime() : null;
        const _opAshTMs = (_opSunMs && _opChnMs) ? Math.round(_opSunMs + 2*(_opChnMs-_opSunMs)/3) : null;
        const _opAshBMs = (_opSunMs && _opChnMs) ? Math.round(_opChnMs + (_opChnMs-_opSunMs)/3)   : null;
        const _opBeinRaw = zData.times.beinHaShmashos || zData.times.beinHashmashos || null;
        const _opBeinIso = _opBeinRaw || (_opSunMs ? new Date(_opSunMs + 13.5*60000).toISOString() : null);

        const opinionsMap = {
          alot:     { label: "עלות השחר",        rows: [{ name: "מגן אברהם / גר\"א", val: ft(zData.times.alotHaShachar) }] },
          talit:    { label: "זמן טלית ותפילין",  rows: [
                       { name: "משיכיר (50 דק׳ לפני הנץ)", val: ft(zData.times.misheyakir) },
                       { name: "משיכיר מחמיר (60 דק׳ לפני הנץ)", val: ft(zData.times.misheyakirMachmir) },
                     ]},
          netz:     { label: "הנץ החמה",          rows: [{ name: "כל השיטות", val: ft(zData.times.sunrise) }] },
          shma:     { label: 'סוף זמן קריאת שמע', rows: [
                       { name: "מגן אברהם (עלות–צאת)",        val: ft(zData.times.sofZmanShmaMGA) },
                       { name: "גר\"א / בעל התניא (הנץ–שקיעה)", val: ft(zData.times.sofZmanShma) },
                     ]},
          tfilla:   { label: "סוף זמן תפילה",    rows: [
                       { name: "מגן אברהם",           val: ft(zData.times.sofZmanTfillaMGA) },
                       { name: "גר\"א / בעל התניא",   val: ft(zData.times.sofZmanTfilla) },
                     ]},
          chatzot:  { label: "חצות היום",         rows: [
                       { name: "חצות היום (מחצית היום ההלכתי)", val: ft(zData.times.chatzot) },
                       { name: "חצות הלילה (לעיון)", val: ft(zData.times.chatzotNight) },
                     ]},
          mincha_g: { label: "מנחה גדולה",       rows: [
                       { name: "מגן אברהם / גר\"א (חצי שעה אחר חצות)", val: ft(zData.times.minchaGedola) },
                       { name: "רפ\"ב (30 דק׳ שעות זמניות)", val: ft(zData.times.minchaGedola72Min) },
                     ]},
          mincha_k: { label: "מנחה קטנה",        rows: [{ name: "כל השיטות (9.5 שעות זמניות)", val: ft(zData.times.minchaKetana) }] },
          plag:     { label: "פלג המנחה",         rows: [
                       { name: "מגן אברהם (שעות זמניות)", val: ft(zData.times.plagHaMincha) },
                       { name: "גר\"א / שו\"ע הרב",           val: ft(zData.times.plagHaMinchaGRA) },
                     ]},
          shkia:    { label: "שקיעה",              rows: [{ name: "כל השיטות", val: ft(zData.times.sunset) }] },
          bein_hashmashot: { label: "בין השמשות", rows: [
                       { name: "שו\"ע (כ-13.5 דק׳ אחר שקיעה)", val: ft(_opBeinIso) },
                       { name: "הגדרה: ספק יום ספק לילה (ר׳ יוסף קארו)", val: "—" },
                     ]},
          tzeit:    { label: "צאת הכוכבים",        rows: [
                       { name: "תצ\"ה — 7.083° (שלושה כוכבים בינוניים)", val: ft(zData.times.tzeit7083deg) },
                       { name: "בעל התניא — 50 דקות אחר שקיעה",          val: ft(zData.times.tzeit50min) },
                       { name: "שלושה כוכבים קטנים — 13.5 דק׳ זמניות",  val: ft(zData.times.tzeit13Point5MinutesZmanis) },
                     ]},
          ashmeret_tkona: { label: "אשמורת התיכונה", rows: [
                       { name: "תחילת משמרת שנייה של הלילה", val: ft(_opAshTMs ? new Date(_opAshTMs).toISOString() : null) },
                       { name: "חישוב: 2/3 מהשקיעה עד עלות השחר", val: ft(_opAshTMs ? new Date(_opAshTMs).toISOString() : null) },
                     ]},
          ashmeret_boker: { label: "אשמורת הבוקר", rows: [
                       { name: "תחילת אשמורת הבוקר (לפני עלות)", val: ft(_opAshBMs ? new Date(_opAshBMs).toISOString() : null) },
                       { name: "חישוב: 4/3 מהשקיעה (= חצות + 1/3 לילה)", val: ft(_opAshBMs ? new Date(_opAshBMs).toISOString() : null) },
                     ]},
        };

        const entry = opinionsMap[key];
        if (!entry) return;

        // Build and show modal
        let existing = document.getElementById('zman-opinions-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'zman-opinions-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;';
        modal.innerHTML = `
          <div style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:360px;box-shadow:0 25px 60px rgba(0,0,0,0.5);text-align:right;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
              <h3 style="color:#e2e8f0;font-size:1.25rem;font-weight:900;margin:0;">${entry.label}</h3>
              <button onclick="document.getElementById('zman-opinions-modal').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
            <p style="color:#64748b;font-size:0.75rem;margin-bottom:1rem;">כל הדעות וחישובי השיטות</p>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${entry.rows.map(r => `
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:1rem;padding:0.75rem 1rem;">
                  <span style="color:#93c5fd;font-size:0.8rem;font-weight:600;">${r.name}</span>
                  <span style="color:#f8fafc;font-size:1.1rem;font-weight:900;direction:ltr;">${r.val}</span>
                </div>`).join('')}
            </div>
          </div>`;
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
      }

      async function fetchFastTimes(name, dateStr, elementId) {
        try {
          const ui = getDynamicUiText();
          let isMajorFast =
            name.includes("Kippur") ||
            name.includes("Av") ||
            name.includes("כיפור") ||
            name.includes("באב");
          let startStr = "",
            endStr = "";

          await ensureCityCoords();

          if (isMajorFast) {
            let prevDay = new Date(dateStr);
            prevDay.setDate(prevDay.getDate() - 1);
            const kzPrev = computeKosherZmanim(prevDay);
            const kzCurr = computeKosherZmanim(new Date(dateStr));
            let resPrev, resCurr;
            if (kzPrev && kzPrev.times && kzPrev.times.sunset && kzCurr && kzCurr.times) {
              resPrev = kzPrev; resCurr = kzCurr;
            } else {
              let prevIso = prevDay.toISOString().split("T")[0];
              [resPrev, resCurr] = await Promise.all([
                fetchHebcalWithCache(`https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${prevIso}`),
                fetchHebcalWithCache(`https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`),
              ]);
            }
            startStr = formatLocalizedTime(resPrev.times.sunset);
            window.FAST_END_TIME = new Date(resCurr.times.tzeit7083deg);
            endStr = formatLocalizedTime(window.FAST_END_TIME);
          } else {
            const kzRes = computeKosherZmanim(new Date(dateStr));
            let res;
            if (kzRes && kzRes.times && kzRes.times.alotHaShachar) {
              res = kzRes;
            } else {
              res = await fetchHebcalWithCache(`https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`);
            }
            startStr = formatLocalizedTime(res.times.alotHaShachar);
            window.FAST_END_TIME = new Date(res.times.tzeit7083deg);
            endStr = formatLocalizedTime(window.FAST_END_TIME);
          }

          const el = document.getElementById(elementId);
          if (el) {
            if (CURRENT_LANG !== "he") {
              el.innerHTML = `<span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">${ui.fastStart}: <strong dir="ltr">${startStr}</strong></span> <span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">${ui.fastEnd}: <strong dir="ltr">${endStr}</strong></span>`;
              return;
            }
            el.innerHTML = `<span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">תחילת צום: <strong dir="ltr">${startStr}</strong></span> <span class="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">סיום צום: <strong dir="ltr">${endStr}</strong></span>`;
          }
        } catch (err) {
          const el = document.getElementById(elementId);
          if (el) el.innerHTML = "";
        }
      }

      async function fetchHolidayTimes(name, dateStr, elementId) {
        try {
          const ui = getDynamicUiText();
          let prevDay = new Date(dateStr);
          prevDay.setDate(prevDay.getDate() - 1);
          await ensureCityCoords();
          const kzPrev = computeKosherZmanim(prevDay);
          const kzCurr = computeKosherZmanim(new Date(dateStr));
          let resPrev, resCurr;
          if (kzPrev && kzPrev.times && kzPrev.times.sunset && kzCurr && kzCurr.times) {
            resPrev = kzPrev; resCurr = kzCurr;
          } else {
            let prevIso = prevDay.toISOString().split("T")[0];
            [resPrev, resCurr] = await Promise.all([
              fetchHebcalWithCache(`https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${prevIso}`),
              fetchHebcalWithCache(`https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`),
            ]);
          }
          let startStr = formatLocalizedTime(resPrev.times.sunset);
          let endStr = formatLocalizedTime(resCurr.times.tzeit7083deg);

          const el = document.getElementById(elementId);
          if (el) {
            if (CURRENT_LANG !== "he") {
              el.innerHTML = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">${ui.holidayEnter}: <strong dir="ltr">${startStr}</strong></span> <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">${ui.holidayExit}: <strong dir="ltr">${endStr}</strong></span>`;
              return;
            }
            el.innerHTML = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">כניסת חג: <strong dir="ltr">${startStr}</strong></span> <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800">יציאת חג: <strong dir="ltr">${endStr}</strong></span>`;
          }
        } catch (err) {
          const el = document.getElementById(elementId);
          if (el) el.innerHTML = "";
        }
      }

      // --- Global City Search ---
      let citySearchTimeout;
      async function handleCitySearch(e) {
        const q = e.target.value;
        const ul = document.getElementById("city-search-results");
        if (q.length < 2) {
          ul.classList.add("hidden");
          return;
        }
        clearTimeout(citySearchTimeout);
        citySearchTimeout = setTimeout(async () => {
          try {
            const res = await fetch(
              `https://www.hebcal.com/complete?q=${encodeURIComponent(q)}`,
            );
            const data = await res.json();
            ul.innerHTML = "";
            data.forEach((item) => {
              const li = document.createElement("li");
              li.className =
                "p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 text-sm transition-colors text-right";
              li.textContent = item.value;
              li.onclick = () => {
                GEO_LOCATION = item.id;
                localStorage.setItem("moadim_city", GEO_LOCATION);
                localStorage.setItem("moadim_city_name", item.value);
                // Store coordinates for kosher-zmanim
                if (item.latitude !== undefined && item.longitude !== undefined) {
                  const cityCoords = { lat: item.latitude, lon: item.longitude, tzid: item.timezone || "Asia/Jerusalem", elevation: item.elevation || 0 };
                  localStorage.setItem("moadim_city_coords", JSON.stringify(cityCoords));
                  window._cityCoords = cityCoords;
                }
                document.getElementById("current-city-name").textContent =
                  item.value;
                ul.classList.add("hidden");
                e.target.value = "";
              };
              ul.appendChild(li);
            });
            ul.classList.remove("hidden");
          } catch (err) {
            console.error(err);
          }
        }, 400);
      }

      function useGPS() {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              GPS_COORDS = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
              };
              localStorage.setItem("moadim_gps", JSON.stringify(GPS_COORDS));
              GEO_LOCATION = "GPS";
              localStorage.setItem("moadim_city", "GPS");
              localStorage.setItem("moadim_city_name", "מיקום נוכחי (GPS)");
              document.getElementById("current-city-name").textContent =
                "מיקום נוכחי (GPS)";
              document
                .getElementById("city-search-results")
                .classList.add("hidden");
            },
            (err) => {
              alert("לא הצלחנו לאתר מיקום, נחזור להגדרה הקודמת.");
            },
          );
        }
      }

      function toggleSettings() {
        const m = document.getElementById("settings-modal");
        if (m.classList.contains("hidden")) {
          updateNotifStatusUI();
          m.classList.remove("hidden");
          setTimeout(() => {
            m.classList.remove("opacity-0");
            m.children[0].classList.remove("scale-95");
          }, 10);
        } else {
          m.classList.add("opacity-0");
          m.children[0].classList.add("scale-95");
          setTimeout(() => m.classList.add("hidden"), 300);
        }
      }

      function saveNotifPrefs() {
        const prefs = {};
        [
          "shabbat",
          "holiday",
          "fast",
          "omer",
          "levana",
          "daf",
          "tefillin",
        ].forEach((id) => {
          const el = document.getElementById("notif_" + id);
          if (el) prefs[id] = el.checked;
        });
        localStorage.setItem("moadim_notif_prefs", JSON.stringify(prefs));
      }

      function shouldShowHolidayTimes(eventItem) {
        if (!eventItem || eventItem.type !== "major") return false;

        const combined = [
          eventItem.name || "",
          eventItem.heb || "",
          eventItem.titleStr || "",
        ].join(" | ");
        const normalized = combined.toLowerCase();

        const isCholHamoed =
          normalized.includes("chol hamoed") ||
          combined.includes("חול המועד") ||
          combined.includes('חוה"מ') ||
          combined.includes("חוה׳מ");

        const isLightHoliday =
          normalized.includes("hanukkah") ||
          normalized.includes("chanukah") ||
          normalized.includes("purim") ||
          combined.includes("חנוכה") ||
          combined.includes("פורים");

        return !isCholHamoed && !isLightHoliday;
      }

      async function saveSettings() {
        ZMANIM_METHOD = document.getElementById("settings-method").value;
        localStorage.setItem("moadim_method", ZMANIM_METHOD);

        // Save nusach
        const nusachEl = document.getElementById("settings-nusach");
        if (nusachEl) {
          CURRENT_NUSACH = nusachEl.value;
          localStorage.setItem("moadim_nusach", CURRENT_NUSACH);
        }

        // Save font size
        const fsEl = document.getElementById("settings-font-size");
        if (fsEl) {
          applyFontSize(parseInt(fsEl.value));
          localStorage.setItem("moadim_fontsize", fsEl.value);
        }

        fetchLiveCalendarData();
        toggleSettings();
      }

      // ── Font size ─────────────────────────────────────────────
      function applyFontSize(level) {
        document.documentElement.classList.remove('fs-1', 'fs-2');
        if (level === 1) document.documentElement.classList.add('fs-1');
        if (level === 2) document.documentElement.classList.add('fs-2');
      }
      function previewFontSize(val) {
        applyFontSize(parseInt(val));
        const lbl = document.getElementById('font-size-label');
        if (lbl) lbl.textContent = FS_LABELS[parseInt(val)] || 'רגיל';
      }

      function getBearing(lat1, lon1, lat2, lon2) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const toDeg = (rad) => (rad * 180) / Math.PI;
        const dLon = toRad(lon2 - lon1);
        lat1 = toRad(lat1);
        lat2 = toRad(lat2);
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x =
          Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        return (toDeg(Math.atan2(y, x)) + 360) % 360;
      }

      const COMPASS_JERUSALEM_TARGET = { lat: 31.771959, lon: 35.217018 };
      const COMPASS_WESTERN_WALL_TARGET = { lat: 31.776221, lon: 35.234464 };

      function getDistanceKm(lat1, lon1, lat2, lon2) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const r = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }

      function isInJerusalem(lat, lon) {
        return getDistanceKm(lat, lon, 31.778, 35.235) <= 10;
      }

      function isInIsrael(lat, lon) {
        return lat >= 29.4 && lat <= 33.5 && lon >= 34.2 && lon <= 35.9;
      }

      function getCompassTarget(lat, lon) {
        const ui = getDynamicUiText();
        if (typeof lat !== "number" || typeof lon !== "number") {
          return {
            ...COMPASS_JERUSALEM_TARGET,
            label: "ירושלים",
          };
        }

        if (isInJerusalem(lat, lon)) {
          return {
            ...COMPASS_WESTERN_WALL_TARGET,
            label: "הכותל",
          };
        }

        if (isInIsrael(lat, lon)) {
          return {
            ...COMPASS_JERUSALEM_TARGET,
            label: "ירושלים",
          };
        }

        return {
          ...COMPASS_JERUSALEM_TARGET,
          label: "ארץ ישראל",
        };
      }

      function openCompass() {
        const m = document.getElementById("compass-modal");
        m.classList.remove("hidden");
        setTimeout(() => m.classList.remove("opacity-0"), 10);
        startCompass();
      }

      function closeCompass() {
        const m = document.getElementById("compass-modal");
        m.classList.add("opacity-0");
        setTimeout(() => m.classList.add("hidden"), 300);
        if (compassListener) {
          window.removeEventListener(
            "deviceorientationabsolute",
            compassListener,
          );
          window.removeEventListener("deviceorientation", compassListener);
        }
      }

      function startCompass() {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          document
            .getElementById("btn-compass-permission")
            .classList.remove("hidden");
          document.getElementById("compass-status").textContent =
            "נדרש אישור חיישנים";
        } else {
          bindCompass();
        }
      }

      function requestCompassPermission() {
        DeviceOrientationEvent.requestPermission()
          .then((res) => {
            if (res === "granted") {
              document
                .getElementById("btn-compass-permission")
                .classList.add("hidden");
              bindCompass();
            }
          })
          .catch(console.error);
      }

      function bindCompass() {
        const setCompassStatus = (text) => {
          document.getElementById("compass-status").textContent = text;
        };
        setCompassStatus("מאתר כיוון התפילה...");
        const handler = (e) => {
          let alpha = e.webkitCompassHeading != null
            ? e.webkitCompassHeading
            : (e.absolute && e.alpha != null ? (360 - e.alpha) % 360 : null);
          if (alpha == null) alpha = Math.abs((e.alpha || 0) - 360);
          if (alpha != null) {
            const lat1 = GPS_COORDS ? GPS_COORDS.lat : 32.084;
            const lon1 = GPS_COORDS ? GPS_COORDS.lon : 34.8878;
            const target = getCompassTarget(lat1, lon1);
            const bearing = getBearing(lat1, lon1, target.lat, target.lon);
            const rotation = bearing - alpha;

            // Rotate compass rose (N/E/S/W labels) with device heading
            document.getElementById("compass-ring").style.transform =
              `rotate(${-alpha}deg)`;
            // Counter-rotate each label to keep text upright
            const counterRot = `rotate(${alpha}deg)`;
            document.getElementById("compass-dir-n").style.transform = `translateX(-50%) ${counterRot}`;
            document.getElementById("compass-dir-s").style.transform = `translateX(-50%) ${counterRot}`;
            document.getElementById("compass-dir-e").style.transform = `translateY(-50%) ${counterRot}`;
            document.getElementById("compass-dir-w").style.transform = `translateY(-50%) ${counterRot}`;
            // Prayer direction arrow
            document.getElementById("compass-arrow").style.transform =
              `rotate(${rotation}deg)`;

            const normalizedRot = Math.abs(rotation % 360);
            if (normalizedRot < 15 || normalizedRot > 345) {
              document.getElementById("compass-status").textContent =
                `מכוון ל${target.label}! ✨`;
              document
                .getElementById("compass-status")
                .classList.replace("text-blue-300", "text-emerald-400");
              document
                .getElementById("compass-arrow")
                .children[0].classList.replace(
                  "text-rose-500",
                  "text-emerald-500",
                );
            } else {
              document.getElementById("compass-status").textContent =
                "סובב את המכשיר...";
              document
                .getElementById("compass-status")
                .classList.replace("text-emerald-400", "text-blue-300");
              document
                .getElementById("compass-arrow")
                .children[0].classList.replace(
                  "text-emerald-500",
                  "text-rose-500",
                );
            }
          }
        };
        if ("ondeviceorientationabsolute" in window)
          window.addEventListener("deviceorientationabsolute", handler, true);
        else window.addEventListener("deviceorientation", handler, true);
        compassListener = handler;
      }

      function getDaysDiff(d) {
        const t = new Date(d);
        t.setHours(0, 0, 0, 0);
        const todayNoTime = new Date();
        todayNoTime.setHours(0, 0, 0, 0);
        return Math.ceil((t - todayNoTime) / 86400000);
      }

      function escapeIcsText(value) {
        return String(value || "")
          .replace(/\r?\n/g, "\\n")
          .replace(/,/g, "\\,")
          .replace(/;/g, "\\;");
      }

      function buildIcsContent(events) {
        let lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Jewish Moadim App//HE",
          "CALSCALE:GREGORIAN",
        ];
        events.forEach((e) => {
          const d = new Date(e.date);
          const dateStr = d
            .toISOString()
            .replace(/-|:|\.\d+/g, "")
            .slice(0, 8);
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDateStr = nextDay
            .toISOString()
            .replace(/-|:|\.\d+/g, "")
            .slice(0, 8);
          const summary = escapeIcsText(e.name);
          const description = escapeIcsText(e.description || "Synced from the Jewish Moadim calendar");
          lines.push(
            "BEGIN:VEVENT",
            `UID:${Date.now()}_${Math.random().toString(36).substring(2)}@moadim.app`,
            `DTSTAMP:${dateStr}T000000Z`,
            `DTSTART;VALUE=DATE:${dateStr}`,
            `DTEND;VALUE=DATE:${nextDateStr}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:סונכרן ממרכז המועדים והזמנים`,
            "BEGIN:VALARM",
            "TRIGGER:-PT24H",
            "ACTION:DISPLAY",
            `DESCRIPTION:תזכורת: מחר ${e.name}`,
            "END:VALARM",
            "END:VEVENT",
          );
        });
        lines.push("END:VCALENDAR");
        return lines.join("\r\n");
      }

      function downloadBulkICS() {
        const toSync = ALL_EVENTS.filter(
          (e) => e.type === "major" || e.type === "fast" || e.type === "minor",
        );
        if (!toSync.length) return alert("אין אירועים לסנכרון.");
        triggerDownload(buildIcsContent(toSync), `לוח_ישראל_מלא.ics`);
      }

      function downloadICS(eventStr) {
        const e = JSON.parse(decodeURIComponent(eventStr));
        triggerDownload(buildIcsContent([e]), `${e.name}.ics`);
      }

      function triggerDownload(content, filename) {
        if (navigator.vibrate) navigator.vibrate(50);
        const blob = new Blob([content], {
          type: "text/calendar;charset=utf-8",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }

      buildIcsContent = function(events) {
        let lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Jewish Moadim App//HE",
          "CALSCALE:GREGORIAN",
        ];
        events.forEach((e) => {
          const d = new Date(e.date);
          const dateStr = d
            .toISOString()
            .replace(/-|:|\.\d+/g, "")
            .slice(0, 8);
          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDateStr = nextDay
            .toISOString()
            .replace(/-|:|\.\d+/g, "")
            .slice(0, 8);
          const summary = escapeIcsText(e.name);
          const description = escapeIcsText(
            e.description || "Synced from the Jewish Moadim calendar",
          );
          lines.push(
            "BEGIN:VEVENT",
            `UID:${Date.now()}_${Math.random().toString(36).substring(2)}@moadim.app`,
            `DTSTAMP:${dateStr}T000000Z`,
            `DTSTART;VALUE=DATE:${dateStr}`,
            `DTEND;VALUE=DATE:${nextDateStr}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            "BEGIN:VALARM",
            "TRIGGER:-PT24H",
            "ACTION:DISPLAY",
            `DESCRIPTION:${escapeIcsText(`Reminder: Tomorrow ${e.name}`)}`,
            "END:VALARM",
            "END:VEVENT",
          );
        });
        lines.push("END:VCALENDAR");
        return lines.join("\r\n");
      };

      function getDayStorageKey(dateStr) {
        return dateStr;
      }

      function getAllDayNotes() {
        try {
          return JSON.parse(localStorage.getItem(DAY_NOTES_STORAGE_KEY) || "{}");
        } catch (error) {
          return {};
        }
      }

      function getDayNotes(dateStr) {
        const allNotes = getAllDayNotes();
        return allNotes[getDayStorageKey(dateStr)] || "";
      }

      function saveDayNotes(dateStr, value) {
        const allNotes = getAllDayNotes();
        const noteKey = getDayStorageKey(dateStr);
        const nextValue = value.trim();
        if (nextValue) allNotes[noteKey] = nextValue;
        else delete allNotes[noteKey];
        localStorage.setItem(DAY_NOTES_STORAGE_KEY, JSON.stringify(allNotes));
      }

      function collectDayEvents(dateStr) {
        return ALL_EVENTS.filter((eventItem) => eventItem.date === dateStr);
      }

      function closeCalendarDay() {
        const modal = document.getElementById("calendar-day-modal");
        if (modal) {
          modal.remove();
          unlockBodyScroll();
          if (_activeModals[_activeModals.length - 1] === 'calendar-day-modal') {
            _activeModals.pop();
            // replaceState instead of history.back() — avoids triggering popstate
            // which would incorrectly close the calendar behind the day popup.
            history.replaceState({ modal: 'calendar-modal' }, '');
          }
        }
      }

      function saveCalendarDayNotes(dateStr) {
        const textarea = document.getElementById("calendar-day-notes");
        if (!textarea) return;
        saveDayNotes(dateStr, textarea.value);
        if (typeof showToast === "function") {
          showToast("ההערה נשמרה", "success", 2200);
        }
        // Refresh calendar grid to show/hide note indicator
        if (typeof buildMonthCalendar === "function") buildMonthCalendar();
        // Close the popup and return to the calendar
        closeCalendarDay();
      }

      function syncSingleDayToCalendar(dateStr) {
        const dateObj = new Date(`${dateStr}T12:00:00`);
        const hebrewDate = getHebrewDateString(dateObj);
        const note = getDayNotes(dateStr).trim();
        const events = collectDayEvents(dateStr).map((eventItem) => ({
          ...eventItem,
          description: [hebrewDate, eventItem.titleStr || eventItem.heb || eventItem.name]
            .filter(Boolean)
            .join(" • "),
        }));
        if (note) {
          events.push({
            name: `הערה אישית - ${hebrewDate || dateStr}`,
            date: dateStr,
            description: note,
          });
        }
        if (!events.length) {
          events.push({
            name: `פרטי היום - ${hebrewDate || dateStr}`,
            date: dateStr,
            description: hebrewDate || dateStr,
          });
        }
        triggerDownload(buildIcsContent(events), `calendar-day-${dateStr}.ics`);
      }

      function handleCalendarDayKeydown(event, dateStr) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openCalendarDay(dateStr);
      }

      function openCalendarDay(dateStr) {
        closeCalendarDay();
        const dateObj = new Date(`${dateStr}T12:00:00`);
        const hebrewDate = getHebrewDateString(dateObj);
        const existingNote = getDayNotes(dateStr);
        const dayEvents = collectDayEvents(dateStr);
        const gregorianDate = formatLocalizedDate(dateObj, {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        // Build Shabbat times section for Friday/Shabbat
        let shabbatHtml = "";
        const dow = dateObj.getDay();
        if (dow === 5 || dow === 6) {
          try {
            const friday = new Date(dateObj);
            if (dow === 6) friday.setDate(friday.getDate() - 1);
            const saturday = new Date(friday);
            saturday.setDate(friday.getDate() + 1);
            const kzFriday = computeKosherZmanim(friday);
            const kzSaturday = computeKosherZmanim(saturday);
            const fmtTime = (iso) => {
              if (!iso) return "--:--";
              const d = new Date(iso);
              return isNaN(d) ? "--:--" : d.toLocaleTimeString(getCurrentLocale(), { hour: "2-digit", minute: "2-digit" });
            };
            const candleTime = kzFriday && kzFriday.times && kzFriday.times.candleLighting ? fmtTime(kzFriday.times.candleLighting) : null;
            const havdalahTime = kzSaturday && kzSaturday.times && kzSaturday.times.tzeit7083deg ? fmtTime(kzSaturday.times.tzeit7083deg) : null;
            // Find parsha for this Shabbat
            const satStr = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
            const parshaEvent = ALL_EVENTS.find((e) => e.type === "parashat" && e.date === satStr);
            if (candleTime || havdalahTime || parshaEvent) {
              shabbatHtml = `<div style="margin-bottom:1rem;padding:0.85rem 1rem;border-radius:1rem;background:linear-gradient(135deg,#eff6ff,#faf5ff);border:1px solid rgba(99,102,241,0.18);">
                <h4 style="margin:0 0 0.55rem;font-size:0.95rem;font-weight:800;color:#312e81;">🕯️ זמני שבת</h4>
                ${parshaEvent ? `<div style="font-size:0.9rem;font-weight:700;color:#4338ca;margin-bottom:0.5rem;">📖 פרשת ${parshaEvent.name.replace("Parashat ", "").replace("פרשת ", "")}</div>` : ""}
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
                  ${candleTime ? `<div style="font-size:0.88rem;color:#334155;"><span style="font-weight:700;">הדלקת נרות:</span> <span style="font-weight:800;color:#2563eb;" dir="ltr">${candleTime}</span></div>` : ""}
                  ${havdalahTime ? `<div style="font-size:0.88rem;color:#334155;"><span style="font-weight:700;">הבדלה:</span> <span style="font-weight:800;color:#7c3aed;" dir="ltr">${havdalahTime}</span></div>` : ""}
                </div>
              </div>`;
            }
          } catch (e) { console.warn("Shabbat times error:", e); }
        }

        const nonParshaEvents = dayEvents.filter((e) => e.type !== "parashat");
        const eventsHtml = nonParshaEvents.length
          ? `<ul style="display:flex;flex-direction:column;gap:0.6rem;margin:0;padding:0;list-style:none;">${nonParshaEvents.map((eventItem) => `<li style="padding:0.8rem 0.9rem;border:1px solid rgba(59,130,246,0.14);border-radius:0.9rem;background:rgba(255,255,255,0.78);"><strong style="display:block;color:#0f172a;">${eventItem.name}</strong><span style="display:block;color:#475569;font-size:0.86rem;margin-top:0.25rem;">${eventItem.titleStr || eventItem.heb || ""}</span></li>`).join("")}</ul>`
          : `<p style="margin:0;color:#64748b;">אין אירועים מובנים ביום זה.</p>`;

        const modal = document.createElement("div");
        modal.id = "calendar-day-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:210;background:rgba(15,23,42,0.58);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
        modal.innerHTML = `
          <div style="width:min(100%,560px);max-height:min(88vh,820px);overflow:auto;background:#faf9f6;border-radius:1.75rem;border:1px solid rgba(148,163,184,0.22);box-shadow:0 25px 60px rgba(15,23,42,0.28);padding:1.2rem 1.2rem 1rem;text-align:right;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem;">
              <div>
                <h3 style="margin:0;font-size:1.2rem;font-weight:900;color:#0f172a;">פרטי היום</h3>
                <div style="margin-top:0.35rem;color:#334155;font-size:0.94rem;">${gregorianDate}</div>
                <div style="margin-top:0.2rem;color:#2563eb;font-weight:800;">${hebrewDate || ""}</div>
              </div>
              <button type="button" onclick="closeCalendarDay()" style="width:2.35rem;height:2.35rem;border:none;border-radius:999px;background:rgba(15,23,42,0.06);color:#475569;font-size:1.1rem;cursor:pointer;">✕</button>
            </div>
            ${shabbatHtml}
            <div style="margin-bottom:1rem;">
              <h4 style="margin:0 0 0.55rem;font-size:0.95rem;font-weight:800;color:#0f172a;">אירועי היום</h4>
              ${eventsHtml}
            </div>
            <label for="calendar-day-notes" style="display:block;margin-bottom:0.45rem;font-size:0.92rem;font-weight:800;color:#0f172a;">הערות ליום זה</label>
            <textarea id="calendar-day-notes" style="width:100%;min-height:120px;border:1px solid rgba(148,163,184,0.4);border-radius:1rem;padding:0.85rem 1rem;resize:vertical;background:#fff;color:#0f172a;font:inherit;line-height:1.7;" placeholder="אפשר להוסיף כאן פרטים והערות משלך...">${existingNote}</textarea>
            <div style="display:flex;gap:0.65rem;justify-content:flex-start;flex-wrap:wrap;margin-top:1rem;">
              <button type="button" onclick="saveCalendarDayNotes('${dateStr}')" style="border:none;border-radius:999px;background:#2563eb;color:#fff;padding:0.72rem 1.15rem;font-weight:800;cursor:pointer;">שמור הערה</button>
              <button type="button" onclick="syncSingleDayToCalendar('${dateStr}')" style="border:none;border-radius:999px;background:#0f766e;color:#fff;padding:0.72rem 1.15rem;font-weight:800;cursor:pointer;">סנכרן ליומן</button>
            </div>
          </div>`;
        modal.addEventListener("click", (event) => {
          if (event.target === modal) closeCalendarDay();
        });
        document.body.appendChild(modal);
        lockBodyScroll();
        pushModalState('calendar-day-modal');
        const textarea = document.getElementById("calendar-day-notes");
        if (textarea) textarea.focus();
      }

      function render(filter = "all", search = "") {
        const c = document.getElementById("resultsGrid");
        const ui = getDynamicUiText();
        c.innerHTML = "";
        const filtered = ALL_EVENTS.filter(
          (e) =>
            e.type !== "parashat" &&
            (filter === "all" || e.type === filter) &&
            (e.name.includes(search) ||
              (e.titleStr && e.titleStr.includes(search))),
        );

        filtered.forEach((e) => {
          const diff = getDaysDiff(e.date),
            color =
              {
                major: "blue",
                fast: "rose",
                moon: "purple",
                "rosh-chodesh": "emerald",
                minor: "slate",
              }[e.type] || "slate";
          const str = encodeURIComponent(JSON.stringify(e)).replace(/'/g, '%27');

          const dateDisplay = `${ui.weekdayNames[new Date(e.date).getDay()]} | ${formatLocalizedDate(new Date(e.date), { day: "2-digit", month: "2-digit", year: "numeric" })} | <span class="text-slate-800 dark:text-slate-200 font-bold">${getHebrewDateString(new Date(e.date))}</span>`;

          let extraTimesHtml = "";
          if (e.type === "fast") {
            const elId = `fast-times-${e.date}`;
            extraTimesHtml = `<div id="${elId}" class="mt-3 flex flex-wrap gap-2 text-xs" aria-live="polite">מחשב זמני צום...</div>`;
            fetchFastTimes(e.name, e.date, elId);
          } else if (e.type === "major" && shouldShowHolidayTimes(e)) {
            const isExclude =
              e.name.includes("חוה") ||
              e.name.includes("חול המועד") ||
              e.name.includes("חנוכה") ||
              e.name.includes("פורים") ||
              (e.titleStr &&
                (e.titleStr.includes("Chol Hamoed") ||
                  e.titleStr.includes("Hanukkah") ||
                  e.titleStr.includes("Chanukah") ||
                  e.titleStr.includes("Purim")));
            if (!isExclude) {
              const elId = `holiday-times-${e.date}`;
              extraTimesHtml = `<div id="${elId}" class="mt-3 flex flex-wrap gap-2 text-xs" aria-live="polite">מחשב זמני חג...</div>`;
              fetchHolidayTimes(e.name, e.date, elId);
            }
          }

          const gradientMap = {
            major: 'from-blue-50 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10',
            fast: 'from-rose-50 to-pink-50/60 dark:from-rose-900/20 dark:to-pink-900/10',
            moon: 'from-purple-50 to-violet-50/60 dark:from-purple-900/20 dark:to-violet-900/10',
            'rosh-chodesh': 'from-emerald-50 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10',
            minor: 'from-slate-50 to-gray-50/60 dark:from-slate-800/40 dark:to-slate-800/20',
          };
          const cardGradient = gradientMap[e.type] || gradientMap.minor;
          const isToday = diff <= 0;
          // Moon window open: show end-of-window countdown
          const isMoonOpen = e.type === "moon" && e.heb === "ניתן לברך כעת" && e.endDate;
          const moonDaysLeft = isMoonOpen ? getDaysDiff(e.endDate) : 0;
          const badgeText = isMoonOpen
            ? (CURRENT_LANG === "he" ? `סוף הזמן: ${moonDaysLeft} ימים` : `Closes in ${moonDaysLeft} days`)
            : isToday
              ? (CURRENT_LANG === "he" ? "✨ היום" : "✨ Today")
              : (CURRENT_LANG === "he" ? `בעוד ${diff} ימים` : `In ${diff} Days`);

          c.innerHTML += `
                    <article class="event-card card-${e.type} bg-gradient-to-br ${cardGradient} border border-slate-100 dark:border-slate-700/50 p-5 md:p-7 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" tabindex="0">
                        <div class="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                            <div class="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-white dark:bg-slate-700/50 text-2xl md:text-3xl flex items-center justify-center rounded-2xl md:rounded-3xl shadow-md border border-${color}-100 dark:border-${color}-500/20" style="box-shadow:0 4px 15px rgba(0,0,0,0.06);" aria-hidden="true">${e.icon}</div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-black text-slate-900 dark:text-white text-xl md:text-2xl mb-1 cursor-pointer hover:text-${color}-600 dark:hover:text-${color}-400 transition-colors truncate" onclick="openSefariaModal('${e.name}', '${e.titleStr || e.name}')">${e.name}</h3>
                                <div class="text-slate-500 dark:text-slate-400 font-medium text-sm">${dateDisplay}</div>
                                ${extraTimesHtml}
                                ${e.levanaString ? `${e.levanaString}` : ""}
                            </div>
                        </div>
                        <div class="flex md:flex-col items-center justify-between w-full md:w-auto md:items-end md:justify-center border-t border-slate-100/80 dark:border-slate-700/50 md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0 gap-2 md:gap-2">
                            <div class="${(isToday && !isMoonOpen) ? `bg-${color}-600 text-white shadow-lg` : isMoonOpen ? `bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300` : `bg-${color}-50 dark:bg-${color}-500/15 text-${color}-700 dark:text-${color}-300`} px-4 py-2 rounded-xl text-sm font-black md:mb-1 transition-all" aria-label="זמן נותר">${badgeText}</div>
                            <button onclick="downloadICS('${str}')" class="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-${color}-600 dark:hover:text-${color}-400 font-bold uppercase tracking-wider transition-all bg-white/70 dark:bg-slate-900/40 hover:bg-${color}-50 dark:hover:bg-${color}-900/20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-${color}-200 dark:hover:border-${color}-700">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> <span data-i18n-key="sync_mobile">סנכרן</span>
                            </button>
                            ${(window._matchMoad && window._matchMoad(e.name) && window._DT[window._matchMoad(e.name)]) ? `<button data-moad-name="${e.name.replace(/"/g, '&quot;')}" onclick="window._openMoadByName(this.dataset.moadName);event.stopPropagation();" class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700">📖 דבר תורה</button>` : ""}
                        </div>
                    </article>`;
          const latestCard = c.lastElementChild;
          const countdownEl = latestCard?.querySelector("[aria-label]");
          if (countdownEl && !isMoonOpen) countdownEl.textContent = formatDaysUntilText(diff);
        });
        if (!filtered.length)
          c.innerHTML = `<div class="text-center py-10 text-slate-400 font-bold text-lg" role="alert">לא נמצאו מועדים תואמים.</div>`;
        if (!filtered.length && CURRENT_LANG !== "he") {
          c.innerHTML = `<div class="text-center py-10 text-slate-400 font-bold text-lg" role="alert">${ui.noResults}</div>`;
        }
        applyTranslations(); // Re-apply dynamically rendered text
      }

      function applyFilter(t) {
        if (navigator.vibrate) navigator.vibrate(20);
        document.querySelectorAll(".chip").forEach((c) => {
          c.classList.remove(
            "active",
            "bg-blue-600",
            "text-white",
            "border-blue-600",
          );
          c.setAttribute("aria-pressed", "false");
        });
        const btn = document.getElementById(`btn-${t}`);
        btn.classList.add(
          "active",
          "bg-blue-600",
          "text-white",
          "border-blue-600",
        );
        btn.setAttribute("aria-pressed", "true");
        render(t, document.getElementById("mainSearch").value);
      }
      document
        .getElementById("mainSearch")
        .addEventListener("input", (e) => {
          render("all", e.target.value);
          if (e.target.value.trim().length > 0) {
            const grid = document.getElementById("resultsGrid");
            if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });

      function openCalendar() {
        if (navigator.vibrate) navigator.vibrate(20);
        CALENDAR_DISPLAY_DATE = new Date();
        buildMonthCalendar();
        const m = document.getElementById("calendar-modal");
        m.classList.remove("hidden");
        setTimeout(() => {
          m.classList.remove("opacity-0");
          m.querySelector("div").classList.remove("scale-95");
        }, 10);
        lockBodyScroll();
        pushModalState('calendar-modal');
      }
      function closeCalendar() {
        closeCalendarDay();
        const m = document.getElementById("calendar-modal");
        m.classList.add("opacity-0");
        m.querySelector("div").classList.add("scale-95");
        setTimeout(() => {
          m.classList.add("hidden");
        }, 300);
        unlockBodyScroll();
        if (_activeModals[_activeModals.length - 1] === 'calendar-modal') {
          _activeModals.pop();
          history.back();
        }
      }

      async function changeMonth(offset) {
        CALENDAR_DISPLAY_DATE.setMonth(
          CALENDAR_DISPLAY_DATE.getMonth() + offset,
        );
        await ensureYearFetched(CALENDAR_DISPLAY_DATE.getFullYear());
        buildMonthCalendar();
      }

      function resetMonth() {
        CALENDAR_DISPLAY_DATE = new Date();
        buildMonthCalendar();
      }

      async function ensureYearFetched(year) {
        if (!window.FETCHED_YEARS) window.FETCHED_YEARS = new Set();
        if (window.FETCHED_YEARS.has(year)) return;
        window.FETCHED_YEARS.add(year);
        const grid = document.getElementById("cal-days-grid");
        if (grid) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94a3b8;font-size:0.9rem;direction:rtl;">טוען נתונים...</div>';
        try {
          const data = await fetchHebcalWithCache(
            `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&i=on&maj=on&min=on&nx=on&mf=on&ss=on&mod=on&s=on`
          );
          if (!data || !data.items) return;
          const parsed = [];
          data.items.forEach(function(ev) {
            if (!ev.date || !ev.category) return;
            if (ev.category === "candles" || ev.category === "havdalah") return;
            var type = "minor", icon = "📅";
            var name = ev.hebrew || ev.title || "";
            if (ev.category === "roshchodesh") {
              type = "rosh-chodesh"; icon = "🌙";
            } else if (ev.category === "parashat") {
              type = "parashat"; icon = "📖";
              name = "פרשת " + (ev.hebrew || ev.title || "");
            } else if (ev.category === "holiday") {
              var lc = (ev.title || "").toLowerCase();
              if (lc.includes("fast") || lc.includes("tzom")) { type = "fast"; icon = "⚡"; }
              else if (ev.yomtov) { type = "major"; icon = "✨"; }
            }
            parsed.push({ name: name, date: ev.date, type: type, heb: ev.hebrew || "", icon: icon });
          });
          if (!window.ALL_EVENTS_FULL) window.ALL_EVENTS_FULL = [];
          window.ALL_EVENTS_FULL = window.ALL_EVENTS_FULL
            .filter(function(e) { return !e.date.startsWith(year + "-"); })
            .concat(parsed)
            .sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
        } catch(err) {
          window.FETCHED_YEARS.delete(year);
        }
      }

      function openMonthYearPicker() {
        const existing = document.getElementById("cal-month-year-picker");
        if (existing) { existing.remove(); return; }

        const todayY = new Date().getFullYear();
        const selY = CALENDAR_DISPLAY_DATE.getFullYear();
        const selM = CALENDAR_DISPLAY_DATE.getMonth();
        const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
        const minYear = todayY - 30;
        const maxYear = todayY + 5;

        const picker = document.createElement("div");
        picker.id = "cal-month-year-picker";
        picker.style.cssText = [
          "position:fixed;z-index:99999;",
          "background:#1e293b;border:1px solid rgba(255,255,255,0.18);",
          "border-radius:1rem;padding:1rem 0.85rem 0.85rem;",
          "box-shadow:0 12px 40px rgba(0,0,0,0.6);min-width:250px;",
          "direction:rtl;"
        ].join("");

        const titleEl = document.getElementById("cal-month-title");
        if (titleEl) {
          const r = titleEl.getBoundingClientRect();
          picker.style.top = (r.bottom + 8) + "px";
          picker.style.left = Math.max(8, r.left - 40) + "px";
        }

        // Year select
        let yearOpts = "";
        for (let yr = maxYear; yr >= minYear; yr--) {
          yearOpts += `<option value="${yr}" ${yr === selY ? "selected" : ""}>${yr}</option>`;
        }
        let html = `<div style="margin-bottom:0.7rem;text-align:center;">
          <select id="cal-year-select" onchange="window._calPickerYear(parseInt(this.value))"
            style="background:#0f172a;color:#c4b5fd;border:1px solid rgba(139,92,246,0.5);
            border-radius:0.5rem;padding:0.3rem 0.6rem;font-size:0.95rem;font-weight:700;
            cursor:pointer;width:100%;">${yearOpts}</select>
        </div>`;

        // Month grid
        html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.35rem;">';
        HE_MONTHS.forEach(function(mn, idx) {
          const act = idx === selM && selY === CALENDAR_DISPLAY_DATE.getFullYear();
          html += `<button onclick="window._calPickerMonth(${idx})" style="padding:0.35rem 0.1rem;border-radius:0.5rem;border:none;cursor:pointer;font-size:0.78rem;font-weight:600;${act ? "background:#3b82f6;color:#fff;" : "background:rgba(255,255,255,0.08);color:#cbd5e1;"}">${mn}</button>`;
        });
        html += '</div>';
        picker.innerHTML = html;
        document.body.appendChild(picker);

        window._calPickerYear = async function(yr) {
          CALENDAR_DISPLAY_DATE.setFullYear(yr);
          await ensureYearFetched(yr);
          buildMonthCalendar();
          const pk = document.getElementById("cal-month-year-picker");
          if (pk) pk.remove();
          openMonthYearPicker();
        };
        window._calPickerMonth = async function(mIdx) {
          CALENDAR_DISPLAY_DATE.setMonth(mIdx);
          await ensureYearFetched(CALENDAR_DISPLAY_DATE.getFullYear());
          buildMonthCalendar();
          const pk = document.getElementById("cal-month-year-picker");
          if (pk) pk.remove();
        };

        setTimeout(function() {
          document.addEventListener("click", function _closePicker(e) {
            const pk = document.getElementById("cal-month-year-picker");
            if (!pk) { document.removeEventListener("click", _closePicker); return; }
            const sel = document.getElementById("cal-year-select");
            if (!pk.contains(e.target) && e.target.id !== "cal-month-title" && e.target.id !== "cal-month-heb") {
              pk.remove();
              document.removeEventListener("click", _closePicker);
            }
          });
        }, 60);
      }

      function buildMonthCalendar() {
        const ui = getDynamicUiText();
        const d = CALENDAR_DISPLAY_DATE,
          y = d.getFullYear(),
          m = d.getMonth();
        updateCalendarWeekdayHeaders();
        document.getElementById("cal-month-title").textContent =
          d.toLocaleDateString(ui.calendarLocale, {
            month: "long",
            year: "numeric",
          });
        try {
          document.getElementById("cal-month-heb").textContent =
            new Intl.DateTimeFormat(ui.hebrewCalendarLocale, {
              month: "long",
              year: "numeric",
            }).format(d);
        } catch (e) {}
        const lastDay = new Date(y, m + 1, 0),
          grid = document.getElementById("cal-days-grid");
        grid.innerHTML = "";
        for (let i = 0; i < new Date(y, m, 1).getDay(); i++)
          grid.innerHTML += `<div class="min-h-[4.5rem] sm:h-20 md:h-28 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg md:rounded-xl border border-transparent" aria-hidden="true"></div>`;

        for (let i = 1; i <= lastDay.getDate(); i++) {
          const cDate = new Date(y, m, i),
            dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
            hebrewDate = getHebrewDateString(cDate),
            isToday =
              i === TODAY.getDate() &&
              m === TODAY.getMonth() &&
              y === TODAY.getFullYear();
          let hebDayStr = "";
          try {
            const parts = new Intl.DateTimeFormat("en-US-u-ca-hebrew", {
              day: "numeric",
            }).formatToParts(cDate);
            const dp = parts.find((p) => p.type === "day");
            if (dp && !isNaN(parseInt(dp.value)))
              hebDayStr = hebDaysLetters[parseInt(dp.value)] || dp.value;
          } catch (e) {}

          const evs = (window.ALL_EVENTS_FULL || ALL_EVENTS).filter((e) => e.date === dStr);
          let evHtml = "";
          // Show parsha on Shabbat cells
          const parshaEv = evs.find((e) => e.type === "parashat");
          if (parshaEv) {
            evHtml += `<div class="bg-amber-600 text-white text-[9px] md:text-xs px-1 py-0.5 rounded-md shadow-sm w-full font-bold leading-tight break-words" title="${parshaEv.name}">📖 ${parshaEv.name.replace("Parashat ", "")}</div>`;
          }
          evs.forEach((e) => {
            if (e.type === "parashat") return; // already shown above
            const c =
              {
                major: "bg-blue-500",
                fast: "bg-rose-500",
                moon: "bg-purple-500",
                "rosh-chodesh": "bg-emerald-500",
                minor: "bg-slate-500",
              }[e.type] || "bg-slate-500";
            evHtml += `<div class="${c} text-white text-[9px] md:text-xs px-1 py-0.5 rounded-md shadow-sm w-full font-medium leading-tight break-words" title="${e.name}">${e.name.replace("קידוש לבנה - ", "")}</div>`;
          });
          // Show note indicator if there's a saved note for this day
          const dayNote = getDayNotes(dStr);
          if (dayNote) {
            evHtml += `<div class="bg-yellow-400 text-yellow-900 text-[9px] md:text-xs px-1 py-0.5 rounded-md shadow-sm w-full font-bold leading-tight break-words" title="${dayNote.substring(0, 80)}">📝 ${dayNote.substring(0, 14)}${dayNote.length > 14 ? '…' : ''}</div>`;
          }
          const ariaLabel = `${formatLocalizedDate(cDate, { day: "2-digit", month: "long", year: "numeric" })}${hebrewDate ? ` | ${hebrewDate}` : ""}`;

          grid.innerHTML += `
                    <div class="min-h-[4.5rem] sm:h-20 md:h-28 p-1 sm:p-1.5 md:p-2.5 bg-white dark:bg-slate-800 rounded-lg md:rounded-xl border ${isToday ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" : "border-slate-200 dark:border-slate-700"} flex flex-col transition-all md:overflow-hidden" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${ariaLabel}" onclick="openCalendarDay('${dStr}')" onkeydown="handleCalendarDayKeydown(event, '${dStr}')">
                        <div class="flex justify-between items-start mb-0.5 sm:mb-1 px-0.5 sm:px-1">
                            <span class="text-[10px] sm:text-xs md:text-sm font-bold text-blue-800 dark:text-blue-400" aria-label="תאריך עברי ${hebDayStr}">${hebDayStr}</span>
                            <span class="text-xs sm:text-sm md:text-base font-black ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}" aria-label="תאריך לועזי ${i}">${i}</span>
                        </div>
                        <div class="flex-1 overflow-y-auto flex flex-col gap-0.5 sm:gap-1 scrollbar-hide px-0.5 pb-0.5">${evHtml}</div>
                    </div>`;
        }
      }

      // --- Web Notifications Logic ---
      const NOTIF_MASTER_KEY = "moadim_notifications_enabled";

      function getNotifMasterPreference() {
        return localStorage.getItem(NOTIF_MASTER_KEY) === "true";
      }

      function setNotifMasterPreference(enabled) {
        localStorage.setItem(NOTIF_MASTER_KEY, enabled ? "true" : "false");
      }

      function getNotifStatusLabel(enabled) {
        if (CURRENT_LANG === "en") return enabled ? "On" : "Off";
        if (CURRENT_LANG === "fr") return enabled ? "Actif" : "Inactif";
        return enabled ? "פעיל" : "כבוי";
      }

      function isNotifMasterActive() {
        return (
          getNotifMasterPreference() &&
          "Notification" in window &&
          Notification.permission === "granted"
        );
      }

      function toggleNotificationsMaster() {
        if (isNotifMasterActive()) {
          setNotifMasterPreference(false);
          updateNotifStatusUI();
          return;
        }

        if (!("Notification" in window)) {
          setNotifMasterPreference(false);
          updateNotifStatusUI();
          alert("הדפדפן שלך אינו תומך בהתראות פוש.");
          return;
        }

        if (Notification.permission === "granted") {
          setNotifMasterPreference(true);
          updateNotifStatusUI();
          return;
        }

        if (Notification.permission === "denied") {
          setNotifMasterPreference(false);
          updateNotifStatusUI();
          alert("ההתראות חסומות בדפדפן. אפשר לשנות זאת בהגדרות הדפדפן.");
          return;
        }

        requestNotificationPermission();
      }

      function requestNotificationPermission() {
        if (!("Notification" in window)) {
          setNotifMasterPreference(false);
          updateNotifStatusUI();
          alert("הדפדפן שלך אינו תומך בהתראות פוש.");
          return;
        }
        Notification.requestPermission().then((permission) => {
          setNotifMasterPreference(permission === "granted");
          updateNotifStatusUI();
          if (permission === "granted") {
            new Notification(SITE_NAME, {
              body: "התראות זמנים הופעלו בהצלחה!",
              icon: "/icon-192.png",
            });
          }
        });
      }

      function updateNotifStatusUI() {
        const enabled = isNotifMasterActive();
        const btn = document.getElementById("notif-master-toggle");
        const knob = document.getElementById("notif-master-toggle-knob");
        const status = document.getElementById("notif-master-status");
        const control = document.getElementById("notif-master-control");
        const options = document.getElementById("notif-options");
        if (!btn || !knob || !status || !control || !options) return;

        btn.className =
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/30";
        btn.classList.remove(
          "bg-slate-300",
          "bg-green-500",
          "dark:bg-slate-600",
        );
        knob.className =
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200";
        knob.classList.remove("translate-x-0.5", "translate-x-5");
        btn.setAttribute("aria-checked", enabled ? "true" : "false");
        control.className = "notification-toggle-row";

        if (enabled) {
          btn.classList.add("bg-green-500");
          knob.classList.add("translate-x-5");
          status.textContent = getNotifStatusLabel(true);
          options.classList.remove("opacity-50", "pointer-events-none");
        } else {
          btn.classList.add("bg-slate-300", "dark:bg-slate-600");
          knob.classList.add("translate-x-0.5");
          status.textContent = getNotifStatusLabel(false);
          options.classList.add("opacity-50", "pointer-events-none");
        }

        const prefs = JSON.parse(
          localStorage.getItem("moadim_notif_prefs") || "{}",
        );
        [
          "shabbat",
          "holiday",
          "fast",
          "omer",
          "levana",
          "daf",
          "tefillin",
        ].forEach((id) => {
          const el = document.getElementById("notif_" + id);
          if (el) {
            el.checked = prefs[id] !== false;
            el.disabled = !enabled;
          }
        });
        return;
      }

      // ─── Notification Scheduler (fires every 45s for better accuracy) ─────────
      setInterval(() => {
        try {
          if (!("Notification" in window)) return;
          if (Notification.permission !== "granted") return;
          if (!getNotifMasterPreference()) return;

          const prefs = JSON.parse(localStorage.getItem("moadim_notif_prefs") || "{}");
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const h = now.getHours(), m = now.getMinutes();

          // Helper: fire only once per calendar-day per event ID
          const fireNotif = (id, title, body, tag) => {
            const key = `notif_fired_${id}_${todayStr}`;
            if (localStorage.getItem(key)) return;
            try {
              new Notification(title, {
                body,
                icon: "/icon-192.png",
                badge: "/favicon.svg",
                tag: tag || id,
                renotify: false,
                lang: CURRENT_LANG,
              });
              localStorage.setItem(key, "1");
            } catch(e) { console.warn("Notification failed:", e); }
          };

          // minutes remaining until target (positive = future)
          const minsUntil = (t) => t ? (t - now) / 60000 : null;
          // minutes elapsed since target (positive = past)
          const minsSince = (t) => t ? (now - t) / 60000 : null;

          // ── 🕯️ Shabbat candle lighting (30 min warning) ──
          if (prefs.shabbat !== false && window.SHABBAT_CANDLES_TIME) {
            const d = minsUntil(window.SHABBAT_CANDLES_TIME);
            // Window: 32-25 minutes before (generous range for timer drift)
            if (d !== null && d >= 25 && d <= 32)
              fireNotif("shabbat", "🕯️ " + SITE_NAME, "הדלקת נרות שבת בעוד כ-30 דקות!", "shabbat");
          }

          // ── 🎊 Holiday candle lighting (30 min warning) ──
          if (prefs.holiday !== false && window.HOLIDAY_CANDLES_TIME) {
            const d = minsUntil(window.HOLIDAY_CANDLES_TIME);
            if (d !== null && d >= 25 && d <= 32)
              fireNotif("holiday", "🎊 " + SITE_NAME, "כניסת החג בעוד כ-30 דקות!", "holiday");
          }

          // ── ⚖️ Fast ending (30 min warning) ──
          if (prefs.fast !== false && window.FAST_END_TIME) {
            const d = minsUntil(window.FAST_END_TIME);
            if (d !== null && d >= 25 && d <= 32)
              fireNotif("fast", "⚖️ " + SITE_NAME, "הצום מסתיים בעוד כ-30 דקות!", "fast");
          }

          // ── ✨ Omer count (at nightfall / within 20 min after tzeit) ──
          if (prefs.omer !== false && window.TZEIT_TIME && CURRENT_OMER_DAY > 0 && CURRENT_OMER_DAY < 49) {
            const d = minsSince(window.TZEIT_TIME);
            if (d !== null && d >= 0 && d <= 20) {
              const omerBody = `היום ${omerDaysWords[CURRENT_OMER_DAY]} לעומר` +
                (typeof getOmerSefirotText === 'function' ? ` — ${getOmerSefirotText(CURRENT_OMER_DAY)}` : '');
              fireNotif("omer", "✨ ספירת העומר", omerBody, "omer");
            }
          }

          // ── 📖 Daf Yomi (8:00 AM — fires anytime during 8:00-8:09) ──
          if (prefs.daf !== false && h === 8 && m >= 0 && m <= 9) {
            const dafEl = document.getElementById("daf-yomi-text");
            const dafName = dafEl ? dafEl.textContent.trim() : "";
            if (dafName && !["מחשב...", "Loading...", "Calcul..."].includes(dafName))
              fireNotif("daf", "📖 הדף היומי", `הדף היומי להיום: ${dafName}`, "daf");
          }

          // ── 🧿 Tefillin reminder (8:30 AM — fires in 8:28-8:33 window) ──
          if (prefs.tefillin !== false && h === 8 && m >= 28 && m <= 33)
            fireNotif("tefillin", "🧿 תזכורת תפילין", "הגיע הזמן להניח תפילין!", "tefillin");

          // ── 🌙 Kiddush Levana — window opens (at first nightfall of window) ──
          if (prefs.levana !== false && window.TZEIT_TIME) {
            const d = minsSince(window.TZEIT_TIME);
            if (d !== null && d >= 0 && d <= 20) {
              if (window.LEVANA_START_DATE === todayStr)
                fireNotif("levana_start", "🌙 קידוש לבנה", "החל מהערב ניתן לברך ברכת הלבנה!", "levana_start");
              if (window.LEVANA_END_DATE === todayStr)
                fireNotif("levana_end", "🌙 קידוש לבנה", "⚠️ הלילה הוא ההזדמנות האחרונה לברך!", "levana_end");
            }
            // 2-day warning before levana ends
            if (window.LEVANA_END_DATE) {
              const endDate = new Date(window.LEVANA_END_DATE);
              const daysUntilEnd = Math.ceil((endDate - new Date(todayStr)) / 86400000);
              if (daysUntilEnd === 2 && d !== null && d >= 0 && d <= 20)
                fireNotif("levana_warn", "🌙 קידוש לבנה", "⏰ נותרו 2 ימים לברכת הלבנה!", "levana_warn");
            }
          }
        } catch(err) {
          console.warn("Notification scheduler error:", err);
        }
      }, 45000); // Every 45 seconds for better accuracy than 60s

      initApp();

      // ═══════════════════════════════════════════════════════
      // ✦  STARS CANVAS ANIMATION
      // ═══════════════════════════════════════════════════════
      (function initStars() {
        const canvas = document.getElementById('stars-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let stars = [], W, H;

        function resize() {
          const hero = document.getElementById('hero-section');
          W = canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
          H = canvas.height = hero ? hero.offsetHeight : 400;
          buildStars();
        }

        function buildStars() {
          stars = [];
          const isMobile = W < 640;
          // More stars on mobile (smaller canvas), brighter + faster
          const density = isMobile ? 3500 : 5000;
          const count = Math.max(60, Math.floor((W * H) / density));
          // Speed scale: mobile needs more relative drift to look alive
          const speedScale = isMobile ? (W / 320) : (W / 900);
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Base drift: noticeably faster than before, scaled to screen
            const driftSpeed = (Math.random() * 0.16 + 0.05) * speedScale;
            // Bigger stars on mobile (higher DPI, else they vanish)
            const baseR = isMobile
              ? Math.random() * 1.8 + 0.5
              : Math.random() * 1.6 + 0.35;
            stars.push({
              x: Math.random() * W,
              y: Math.random() * H,
              r: baseR,
              alpha: Math.random() * 0.6 + (isMobile ? 0.35 : 0.25),
              twinkleSpeed: Math.random() * 0.015 + 0.004,   // faster twinkle
              phase: Math.random() * Math.PI * 2,
              vx: Math.cos(angle) * driftSpeed,
              vy: Math.sin(angle) * driftSpeed,
              sparkle: 0,
              sparklePeak: 0,
              // ~20% of stars get a cross/spike shape when sparkling
              crossStar: Math.random() < 0.20,
            });
          }
        }

        let t = 0;
        function draw() {
          // Skip drawing when tab hidden (saves CPU), CSS handles visibility per theme
          if (!document.hidden) {
            ctx.clearRect(0, 0, W, H);
            t += 0.016;

            // Sparkle trigger — more frequent (~5-6/sec)
            if (Math.random() < 0.09 && stars.length) {
              const s = stars[Math.floor(Math.random() * stars.length)];
              if (!s.sparkle) {
                s.sparkle     = 60 + Math.random() * 50;
                s.sparklePeak = 0.65 + Math.random() * 0.35;
              }
            }

            stars.forEach(s => {
              // Drift movement
              s.x += s.vx;
              s.y += s.vy;
              if (s.x < -2)    s.x = W + 2;
              if (s.x > W + 2) s.x = -2;
              if (s.y < -2)    s.y = H + 2;
              if (s.y > H + 2) s.y = -2;

              // Ambient twinkle — deeper oscillation so it reads on mobile
              let a = s.alpha * (0.38 + 0.62 * Math.sin(t * s.twinkleSpeed * 60 + s.phase));

              // Sparkle burst
              if (s.sparkle > 0) {
                const progress = s.sparkle / 80;
                const boost = s.sparklePeak * Math.sin(progress * Math.PI);
                a = Math.min(1, a + boost);
                s.sparkle--;

                // Glow halo
                if (boost > 0.1) {
                  const haloR = s.r * (s.crossStar ? 7 : 5);
                  const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
                  grd.addColorStop(0, 'rgba(210,225,255,' + (boost * 0.65).toFixed(3) + ')');
                  grd.addColorStop(1, 'rgba(210,225,255,0)');
                  ctx.beginPath();
                  ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
                  ctx.fillStyle = grd;
                  ctx.fill();

                  // Cross/spike effect for designated sparkle stars
                  if (s.crossStar && boost > 0.25) {
                    const spikeLen = s.r * 6 * boost;
                    const spikeAlpha = (boost * 0.7).toFixed(3);
                    ctx.strokeStyle = 'rgba(230,240,255,' + spikeAlpha + ')';
                    ctx.lineWidth = Math.max(0.5, s.r * 0.5);
                    ctx.lineCap = 'round';
                    // Horizontal spike
                    ctx.beginPath();
                    ctx.moveTo(s.x - spikeLen, s.y);
                    ctx.lineTo(s.x + spikeLen, s.y);
                    ctx.stroke();
                    // Vertical spike
                    ctx.beginPath();
                    ctx.moveTo(s.x, s.y - spikeLen);
                    ctx.lineTo(s.x, s.y + spikeLen);
                    ctx.stroke();
                    // Diagonal spikes (shorter)
                    const diagLen = spikeLen * 0.55;
                    ctx.lineWidth = Math.max(0.4, s.r * 0.35);
                    ctx.beginPath();
                    ctx.moveTo(s.x - diagLen, s.y - diagLen);
                    ctx.lineTo(s.x + diagLen, s.y + diagLen);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(s.x + diagLen, s.y - diagLen);
                    ctx.lineTo(s.x - diagLen, s.y + diagLen);
                    ctx.stroke();
                  }
                }
              }

              ctx.beginPath();
              ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
              ctx.fill();
            });
          }
          requestAnimationFrame(draw);
        }

        window.addEventListener('resize', () => {
          clearTimeout(window._starResizeTimer);
          window._starResizeTimer = setTimeout(resize, 200);
        }, { passive: true });

        resize();
        draw();
      })();

      // ═══════════════════════════════════════════════════════
      // ✦  TOAST NOTIFICATION SYSTEM
      // ═══════════════════════════════════════════════════════
      function showToast(message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => toast.classList.add('show'));
        });
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 350);
        }, duration);
      }

      // ═══════════════════════════════════════════════════════
      // ✦  CARD VISIBILITY (no entrance animation)
      // ═══════════════════════════════════════════════════════
      function setupCardObserver() {
        // Cards are visible immediately — just mark them all as .visible
        document.querySelectorAll('.event-card').forEach(card => card.classList.add('visible'));
      }

      // ═══════════════════════════════════════════════════════
      // ✦  LIVE SHABBAT COUNTDOWN
      // ═══════════════════════════════════════════════════════
      // ✦  SHABBAT INFO POPUP (opened by clicking the countdown bar)
      // ═══════════════════════════════════════════════════════
      function openShabbatInfoModal() {
        document.getElementById('shabbat-info-modal')?.remove();

        const candles  = window.SHABBAT_CANDLES_STR  || '--:--';
        const havdalah = window.SHABBAT_HAVDALAH_STR || '--:--';
        const parasha  = window.SHABBAT_PARASHA_NAME  || '';
        const eTitle   = window.SHABBAT_PARASHA_ETITLE || '';

        const overlay = document.createElement('div');
        overlay.id = 'shabbat-info-modal';
        overlay.style.cssText = [
          'position:fixed','inset:0','z-index:500',
          'display:flex','align-items:center','justify-content:center',
          'background:rgba(0,0,0,0.55)','backdrop-filter:blur(4px)'
        ].join(';');

        const parshaBtn = parasha ? `
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
              <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);margin-bottom:8px;">פרשת השבוע</div>
              <button onclick="document.getElementById('shabbat-info-modal').remove();${eTitle ? `openSefariaModal('${parasha.replace(/'/g,"\'")}','${eTitle.replace(/'/g,"\'")}')` : `(window._openShabbatParasha||function(){})();`}"
                style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:12px;padding:10px 20px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;">
                <span>📖</span><span>${parasha}</span>
              </button>
            </div>` : '';

        overlay.innerHTML = `
          <div style="background:linear-gradient(145deg,#1e3a5f,#0f2742);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:28px 32px 24px;min-width:260px;max-width:340px;width:90vw;text-align:center;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.5);position:relative;">
            <button onclick="document.getElementById('shabbat-info-modal').remove();unlockBodyScroll();"
              style="position:absolute;top:12px;left:14px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.4rem;cursor:pointer;line-height:1;" aria-label="סגור">×</button>
            <div style="font-size:1.6rem;margin-bottom:6px;">🕯️</div>
            <div style="font-size:1.15rem;font-weight:800;letter-spacing:.5px;margin-bottom:20px;color:#fde68a;">שבת שלום</div>
            <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
              <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.88rem;color:rgba(255,255,255,0.7);">כניסת שבת</span>
                <span style="font-size:1.25rem;font-weight:900;color:#fde68a;direction:ltr;" dir="ltr">${candles}</span>
              </div>
              <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.88rem;color:rgba(255,255,255,0.7);">יציאת שבת</span>
                <span style="font-size:1.25rem;font-weight:900;color:#c4b5fd;direction:ltr;" dir="ltr">${havdalah}</span>
              </div>
            </div>
            ${parshaBtn}
          </div>`;

        overlay.addEventListener('click', e => {
          if (e.target === overlay) { overlay.remove(); unlockBodyScroll(); }
        });
        document.body.appendChild(overlay);
        lockBodyScroll();
      }

      // ═══════════════════════════════════════════════════════
      let countdownInterval;
      function startShabbatCountdown() {
        const wrap = document.getElementById('shabbat-countdown-wrap');
        const display = document.getElementById('countdown-display');
        const eventLabel = document.getElementById('countdown-event-type');
        if (!wrap || !display) return;

        // Determine which candle-lighting to count down to
        const now = new Date();
        const isFriday = now.getDay() === 5;
        const hasHolidayCandles = !!window.HOLIDAY_CANDLES_TIME && window.HOLIDAY_CANDLES_TIME > now;
        const hasShabbatCandles = !!window.SHABBAT_CANDLES_TIME && window.SHABBAT_CANDLES_TIME > now;

        let target = null;
        let label = '';

        if (isFriday && hasShabbatCandles) {
          target = window.SHABBAT_CANDLES_TIME;
          label = 'כניסת שבת';
        } else if (hasHolidayCandles) {
          target = window.HOLIDAY_CANDLES_TIME;
          label = 'כניסת החג';
        } else if (isFriday && hasShabbatCandles) {
          target = window.SHABBAT_CANDLES_TIME;
          label = 'כניסת שבת';
        }

        if (!target) { wrap.classList.add('hidden'); return; }
        if (eventLabel) eventLabel.textContent = label;

        function tick() {
          const diff = target - new Date();
          if (diff <= 0) {
            clearInterval(countdownInterval);
            wrap.classList.add('hidden');
            return;
          }
          const totalSecs = Math.floor(diff / 1000);
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);
          const s = totalSecs % 60;
          const pad = n => String(n).padStart(2, '0');
          if (h > 48) { wrap.classList.add('hidden'); return; }
          display.textContent = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
          wrap.classList.remove('hidden');
          wrap.style.opacity = '1';
        }

        clearInterval(countdownInterval);
        tick();
        countdownInterval = setInterval(tick, 1000);
      }

      // ═══════════════════════════════════════════════════════
      // ✦  OMER PROGRESS RING UPDATE
      // ═══════════════════════════════════════════════════════
      function updateOmerRing(day) {
        const ring = document.getElementById('omer-ring-progress');
        const bar = document.getElementById('omer-bar-fill');
        if (!ring || !bar || day < 1) return;
        const circumference = 263.9;
        const pct = day / 49;
        const offset = circumference * (1 - pct);
        setTimeout(() => {
          ring.style.strokeDashoffset = offset.toFixed(2);
          bar.style.width = (pct * 100).toFixed(1) + '%';
        }, 400);
      }

      // ═══════════════════════════════════════════════════════
      // ✦  ZMANIM DAY PROGRESS BAR
      // ═══════════════════════════════════════════════════════
      function updateDayProgressBar(sunriseTime, sunsetTime) {
        const fill = document.getElementById('zmanim-day-bar-fill');
        if (!fill) return;
        const now = new Date();
        if (!sunriseTime || !sunsetTime) return;
        const rise = new Date(sunriseTime);
        const set = new Date(sunsetTime);
        if (isNaN(rise) || isNaN(set)) return;
        const total = set - rise;
        const elapsed = now - rise;
        const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
        fill.style.width = pct.toFixed(1) + '%';
        fill.title = `${pct.toFixed(0)}% מהיום עבר`;
      }

      // ═══════════════════════════════════════════════════════
      // ✦  PATCH: hook into existing functions
      // ═══════════════════════════════════════════════════════

      const ZMANIM_FALLBACK_ORDER = [
        "alot",
        "talit",
        "netz",
        "shma",
        "tfilla",
        "chatzot",
        "mincha_g",
        "mincha_k",
        "plag",
        "shkia",
        "bein_hashmashot",
        "tzeit",
        "ashmeret_tichona",
        "ashmeret_haboker",
      ];

      function formatZmanTime(iso) {
        return iso
          ? new Date(iso).toLocaleTimeString(getCurrentLocale(), {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--:--";
      }

      function toIso(ms) {
        return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
      }

      function getZmanimMethodKey() {
        return String(ZMANIM_METHOD || "MGA").toUpperCase() === "GRA" ? "GRA" : "MGA";
      }

      function getZmanimBundle(zData) {
        return {
          prev: zData?._prevDay || null,
          today: zData || null,
          next: zData?._nextDay || null,
          nowMs: Date.now(),
        };
      }

      function pushCandidate(target, iso, extra = {}) {
        if (!iso) return;
        const ms = new Date(iso).getTime();
        if (!Number.isFinite(ms)) return;
        target.push({ iso, ms, ...extra });
      }

      function getFieldCandidates(bundle, field, order = ["prev", "today", "next"]) {
        const out = [];
        order.forEach((bucket) => {
          const data = bundle[bucket];
          pushCandidate(out, data?.times?.[field] || null, {
            field,
            bucket,
            dayOffset: bucket === "prev" ? -1 : bucket === "next" ? 1 : 0,
          });
        });
        return out;
      }

      function getNightSegments(bundle) {
        return [
          {
            key: "prevNight",
            bucket: "prev",
            dayOffset: 0,
            sunsetIso: bundle.prev?.times?.sunset || null,
            alotIso: bundle.today?.times?.alotHaShachar || null,
            chatzotIso: bundle.prev?.times?.chatzotNight || null,
            beinIso: bundle.prev?.times?.beinHaShmashos || bundle.prev?.times?.beinHashmashos || null,
          },
          {
            key: "todayNight",
            bucket: "today",
            dayOffset: 1,
            sunsetIso: bundle.today?.times?.sunset || null,
            alotIso: bundle.next?.times?.alotHaShachar || null,
            chatzotIso: bundle.today?.times?.chatzotNight || null,
            beinIso: bundle.today?.times?.beinHaShmashos || bundle.today?.times?.beinHashmashos || null,
          },
        ];
      }

      function buildNightDerivedCandidates(bundle, type) {
        const out = [];
        getNightSegments(bundle).forEach((segment) => {
          const sunsetMs = segment.sunsetIso ? new Date(segment.sunsetIso).getTime() : null;
          const alotMs = segment.alotIso ? new Date(segment.alotIso).getTime() : null;
          const chatzotMs = segment.chatzotIso ? new Date(segment.chatzotIso).getTime() : null;
          if (!sunsetMs || !(alotMs || chatzotMs)) return;

          let iso = null;
          if (type === "chatzot") {
            iso = segment.chatzotIso || toIso(sunsetMs + ((alotMs - sunsetMs) / 2));
          } else if (type === "ashmeret") {
            const endMs = alotMs || (chatzotMs ? sunsetMs + ((chatzotMs - sunsetMs) * 2) : null);
            if (endMs) iso = toIso(sunsetMs + ((endMs - sunsetMs) / 3));
          } else if (type === "bein") {
            iso = segment.beinIso || toIso(sunsetMs + (13.5 * 60 * 1000));
          }

          pushCandidate(out, iso, {
            bucket: segment.bucket,
            dayOffset: segment.dayOffset,
            segment: segment.key,
            type,
          });
        });
        return out;
      }

      function selectRelevantCandidate(candidates, nowMs) {
        if (!candidates.length) return null;
        const future = candidates.filter((candidate) => candidate.ms >= nowMs).sort((a, b) => a.ms - b.ms);
        if (future.length) return future[0];
        return candidates.slice().sort((a, b) => b.ms - a.ms)[0];
      }

      function enrichOpinion(base, bundle, nowMs) {
        const candidate = selectRelevantCandidate(base.candidates || [], nowMs);
        return {
          ...base,
          iso: candidate?.iso || null,
          ms: candidate?.ms || null,
          bucket: candidate?.bucket || null,
          dayOffset: candidate?.dayOffset || 0,
          segment: candidate?.segment || null,
        };
      }

      function getPrimaryOpinion(itemKey, opinions, methodKey, nowMs) {
        const valid = opinions.filter((opinion) => opinion.iso);
        if (!valid.length) return null;
        if (itemKey === "shma" || itemKey === "tfilla" || itemKey === "plag") {
          return valid.find((opinion) => opinion.method === methodKey) || valid[0];
        }
        if (itemKey === "chatzot") {
          return valid.filter((opinion) => opinion.ms >= nowMs).sort((a, b) => a.ms - b.ms)[0] || valid.sort((a, b) => b.ms - a.ms)[0];
        }
        return valid[0];
      }

      function buildOccurrenceHint(opinion) {
        if (!opinion?.iso) return "לא זמין כעת";
        if (opinion.dayOffset > 0) return `${opinion.shortLabel} · מחר`;
        if (opinion.bucket === "prev" || opinion.segment === "prevNight") return `${opinion.shortLabel} · כבר עבר`;
        return opinion.shortLabel;
      }

      function buildZmanDefinitionList(bundle) {
        const methodKey = getZmanimMethodKey();
        const nowMs = bundle.nowMs;
        return [
          {
            key: "alot",
            label: "עלות השחר",
            opinions: [
              enrichOpinion({ id: "alotHaShachar", label: "עלות השחר", shortLabel: "עלות השחר", method: "ALL", candidates: getFieldCandidates(bundle, "alotHaShachar", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "talit",
            label: "זמן טלית ותפילין",
            opinions: [
              enrichOpinion({ id: "misheyakir", label: "משיכיר", shortLabel: "משיכיר", method: "ALL", candidates: getFieldCandidates(bundle, "misheyakir", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "misheyakirMachmir", label: "משיכיר מחמיר", shortLabel: "משיכיר מחמיר", method: "ALL", candidates: getFieldCandidates(bundle, "misheyakirMachmir", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "netz",
            label: "הנץ החמה",
            opinions: [
              enrichOpinion({ id: "sunrise", label: "הנץ החמה", shortLabel: "הנץ", method: "ALL", candidates: getFieldCandidates(bundle, "sunrise", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "shma",
            label: "סוף ק\"ש",
            opinions: [
              enrichOpinion({ id: "sofZmanShmaMGA", label: "מגן אברהם", shortLabel: "מגן אברהם", method: "MGA", candidates: getFieldCandidates(bundle, "sofZmanShmaMGA", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "sofZmanShma", label: "הגר\"א", shortLabel: "הגר\"א", method: "GRA", candidates: getFieldCandidates(bundle, "sofZmanShma", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "tfilla",
            label: "סוף תפילה",
            opinions: [
              enrichOpinion({ id: "sofZmanTfillaMGA", label: "מגן אברהם", shortLabel: "מגן אברהם", method: "MGA", candidates: getFieldCandidates(bundle, "sofZmanTfillaMGA", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "sofZmanTfilla", label: "הגר\"א", shortLabel: "הגר\"א", method: "GRA", candidates: getFieldCandidates(bundle, "sofZmanTfilla", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "chatzot",
            label: "חצות יום / לילה",
            opinions: [
              enrichOpinion({ id: "chatzotDay", label: "חצות יום", shortLabel: "חצות יום", method: "ALL", candidates: getFieldCandidates(bundle, "chatzot", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "chatzotNight", label: "חצות לילה", shortLabel: "חצות לילה", method: "ALL", candidates: buildNightDerivedCandidates(bundle, "chatzot") }, bundle, nowMs),
            ],
          },
          {
            key: "mincha_g",
            label: "מנחה גדולה",
            opinions: [
              enrichOpinion({ id: "minchaGedola", label: "מנחה גדולה", shortLabel: "מנחה גדולה", method: "ALL", candidates: getFieldCandidates(bundle, "minchaGedola", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "minchaGedola72Min", label: "72 דקות", shortLabel: "72 דקות", method: "ALL", candidates: getFieldCandidates(bundle, "minchaGedola72Min", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "mincha_k",
            label: "מנחה קטנה",
            opinions: [
              enrichOpinion({ id: "minchaKetana", label: "מנחה קטנה", shortLabel: "מנחה קטנה", method: "ALL", candidates: getFieldCandidates(bundle, "minchaKetana", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "plag",
            label: "פלג המנחה",
            opinions: [
              enrichOpinion({ id: "plagHaMincha", label: "מגן אברהם", shortLabel: "מגן אברהם", method: "MGA", candidates: getFieldCandidates(bundle, "plagHaMincha", ["today", "next"]) }, bundle, nowMs),
              enrichOpinion({ id: "plagHaMinchaGRA", label: "הגר\"א", shortLabel: "הגר\"א", method: "GRA", candidates: getFieldCandidates(bundle, "plagHaMinchaGRA", ["today", "next"]) }, bundle, nowMs),
            ],
          },
          {
            key: "shkia",
            label: "שקיעה",
            opinions: [
              enrichOpinion({ id: "sunset", label: "שקיעה", shortLabel: "שקיעה", method: "ALL", candidates: getFieldCandidates(bundle, "sunset") }, bundle, nowMs),
            ],
          },
          {
            key: "bein_hashmashot",
            label: "בין השמשות",
            opinions: [
              enrichOpinion({ id: "beinHashmashot", label: "בין השמשות", shortLabel: "בין השמשות", method: "ALL", candidates: buildNightDerivedCandidates(bundle, "bein") }, bundle, nowMs),
            ],
          },
          {
            key: "tzeit",
            label: "צאת הכוכבים",
            opinions: [
              enrichOpinion({ id: "tzeit7083deg", label: "7.083°", shortLabel: "7.083°", method: methodKey, candidates: getFieldCandidates(bundle, "tzeit7083deg") }, bundle, nowMs),
              enrichOpinion({ id: "tzeit50min", label: "50 דקות", shortLabel: "50 דקות", method: "ALL", candidates: getFieldCandidates(bundle, "tzeit50min") }, bundle, nowMs),
              enrichOpinion({ id: "tzeit13Point5MinutesZmanis", label: "13.5 דקות זמניות", shortLabel: "13.5 דקות", method: "ALL", candidates: getFieldCandidates(bundle, "tzeit13Point5MinutesZmanis") }, bundle, nowMs),
            ],
          },
          {
            key: "ashmeret_tichona",
            label: "אשמורת התיכונה",
            opinions: [
              enrichOpinion({ id: "ashmeretMiddle", label: "אשמורת התיכונה", shortLabel: "אשמורת תיכונה", method: "ALL", candidates: buildNightDerivedCandidates(bundle, "ashmeret") }, bundle, nowMs),
            ],
          },
          {
            key: "ashmeret_haboker",
            label: "אשמורת הבוקר",
            opinions: [
              enrichOpinion({
                id: "ashmeretMorning",
                label: "אשמורת הבוקר",
                shortLabel: "אשמורת הבוקר",
                method: "ALL",
                candidates: getNightSegments(bundle).flatMap((segment) => {
                  const sunsetMs = segment.sunsetIso ? new Date(segment.sunsetIso).getTime() : null;
                  const alotMs = segment.alotIso ? new Date(segment.alotIso).getTime() : null;
                  const chatzotMs = segment.chatzotIso ? new Date(segment.chatzotIso).getTime() : null;
                  if (!sunsetMs || !(alotMs || chatzotMs)) return [];
                  const endMs = alotMs || (chatzotMs ? sunsetMs + ((chatzotMs - sunsetMs) * 2) : null);
                  if (!endMs) return [];
                  return [{
                    iso: toIso(sunsetMs + (((endMs - sunsetMs) * 2) / 3)),
                    ms: sunsetMs + (((endMs - sunsetMs) * 2) / 3),
                    bucket: segment.bucket,
                    dayOffset: segment.dayOffset,
                    segment: segment.key,
                  }];
                }),
              }, bundle, nowMs),
            ],
          },
        ].map((definition, index) => {
          const primary = getPrimaryOpinion(definition.key, definition.opinions, methodKey, nowMs);
          return {
            ...definition,
            orderIndex: ZMANIM_FALLBACK_ORDER.indexOf(definition.key) >= 0 ? ZMANIM_FALLBACK_ORDER.indexOf(definition.key) : index,
            primary,
            sortMs: primary?.ms || null,
            displayValue: primary?.iso ? formatZmanTime(primary.iso) : "--:--",
            meta: buildOccurrenceHint(primary),
          };
        });
      }

      function orderZmanimByCurrentRelevance(items) {
        const nowMs = Date.now();
        return items.slice().sort((left, right) => {
          const leftFuture = Number.isFinite(left.sortMs) && left.sortMs >= nowMs;
          const rightFuture = Number.isFinite(right.sortMs) && right.sortMs >= nowMs;
          if (leftFuture && rightFuture) return left.sortMs - right.sortMs;
          if (leftFuture) return -1;
          if (rightFuture) return 1;
          return left.orderIndex - right.orderIndex;
        });
      }

      function normalizeZmanim(zData) {
        const bundle = getZmanimBundle(zData);
        const items = buildZmanDefinitionList(bundle);
        return {
          bundle,
          items,
          orderedItems: orderZmanimByCurrentRelevance(items),
          byKey: Object.fromEntries(items.map((item) => [item.key, item])),
        };
      }

      function buildZmanimOpinionsPayload(key) {
        const normalized = window._lastNormalizedZmanim;
        const item = normalized?.byKey?.[key];
        if (!item) return null;
        const rows = item.opinions
          .filter((opinion) => opinion.iso)
          .map((opinion) => ({
            label: opinion.label,
            value: formatZmanTime(opinion.iso),
            isSelected: opinion.method === getZmanimMethodKey() || (item.primary && opinion.id === item.primary.id),
          }));
        return {
          label: item.label,
          rows: rows.length ? rows : [{ label: "אין זמן זמין כרגע", value: "--:--", isSelected: false }],
        };
      }

      renderZmanimGrid = function(zData) {
        window._lastZData = zData;
        const normalized = normalizeZmanim(zData);
        window._lastNormalizedZmanim = normalized;

        const activeTzeit = normalized.byKey?.tzeit?.primary?.iso || zData?.times?.tzeit7083deg;
        if (activeTzeit) window.TZEIT_TIME = new Date(activeTzeit);

        const cardClass = "zman-card bg-gradient-to-br from-indigo-900/50 to-blue-900/30 border border-blue-400/15 rounded-2xl p-3 hover:border-blue-400/35 hover:from-indigo-900/70 transition-all cursor-pointer zman-clickable";
        document.getElementById("zmanim-details").innerHTML = normalized.orderedItems
          .map((item) => `
            <div class="${cardClass}" data-zman-key="${item.key}" onclick="showZmanOpinions('${item.key}')">
              <span class="text-blue-300/80 text-xs md:text-sm block mb-1.5 font-semibold">${item.label}</span>
              <span class="font-black text-lg md:text-xl text-white tracking-tight" dir="ltr">${item.displayValue}</span>
              <span class="zman-meta">${item.meta}</span>
            </div>
          `)
          .join("");
      };

      showZmanOpinions = function(key) {
        const payload = buildZmanimOpinionsPayload(key);
        if (!payload) return;

        let existing = document.getElementById("zman-opinions-modal");
        if (existing) existing.remove();

        const modal = document.createElement("div");
        modal.id = "zman-opinions-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:200;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
        modal.innerHTML = `
          <div style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:380px;box-shadow:0 25px 60px rgba(0,0,0,0.5);text-align:right;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
              <h3 style="color:#e2e8f0;font-size:1.25rem;font-weight:900;margin:0;">${payload.label}</h3>
              <button onclick="document.getElementById('zman-opinions-modal').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
            <p style="color:#64748b;font-size:0.75rem;margin-bottom:1rem;">כל השיטות הזמינות לזמן זה. השיטה הפעילה מסומנת.</p>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${payload.rows.map((row) => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.8rem;background:${row.isSelected ? "rgba(59,130,246,0.18)" : "rgba(99,102,241,0.12)"};border:1px solid ${row.isSelected ? "rgba(96,165,250,0.42)" : "rgba(99,102,241,0.2)"};border-radius:1rem;padding:0.85rem 1rem;">
                  <span style="color:${row.isSelected ? "#dbeafe" : "#93c5fd"};font-size:0.83rem;font-weight:700;">${row.label}${row.isSelected ? " · נבחר" : ""}</span>
                  <span style="color:#f8fafc;font-size:1.05rem;font-weight:900;direction:ltr;">${row.value}</span>
                </div>
              `).join("")}
            </div>
          </div>`;
        modal.addEventListener("click", (event) => {
          if (event.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
      };

      const PRAYER_HTML_CACHE = new Map();
      const NUSACH_LABELS = {
        mizrahi: "עדות המזרח",
        sfard: "ספרד",
        ashkenaz: "אשכנז",
        temani_shami: "תימן שאמי",
        temani_baladi: "תימן בלדי",
      };

      const PRAYER_QUERY_DEFS = {
        shacharit: { weekday: "שחרית לחול", shabbat: "שחרית לשבת" },
        mincha: { weekday: "מנחה לחול", shabbat: "מנחה לשבת" },
        maariv: { weekday: "ערבית לחול", shabbat: "ערבית לשבת" },
        "birchot-hashachar": { weekday: "ברכות השחר" },
        shema: { weekday: "קריאת שמע" },
        "birkat-hamazon": { weekday: "ברכת המזון" },
        "al-hamichya": { weekday: "ברכת מעין שלוש" },
        "kiddush-levana": { weekday: "ברכת הלבנה" },
        "tikkun-chatzot": { weekday: "תיקון חצות" },
      };

      const SEFARIA_PRAYER_REFS = {
        shacharit: {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Weekday_Shacharit"] },
          sfard: { weekday: ["Siddur_Sefard,_Weekday_Shacharit"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_Weekday,_Shacharit"] },
        },
        mincha: {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Weekday_Mincha"] },
          sfard: { weekday: ["Siddur_Sefard,_Weekday_Mincha"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_Weekday,_Mincha"] },
        },
        maariv: {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Weekday_Arvit", "Siddur_Edot_HaMizrach,_Weekday_Maariv"] },
          sfard: { weekday: ["Siddur_Sefard,_Weekday_Maariv"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_Weekday,_Maariv"] },
        },
        "birchot-hashachar": {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Birchot_HaShachar"] },
          sfard: { weekday: ["Siddur_Sefard,_Birchot_HaShachar"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_Birkhot_HaShachar"] },
        },
        shema: {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Kriat_Shema_Sheal_HaMitah", "The_Shema"] },
          sfard: { weekday: ["Siddur_Sefard,_Kriat_Shema", "The_Shema"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_The_Shema", "The_Shema"] },
        },
        "birkat-hamazon": {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Post_Meal_Blessing"] },
          sfard: { weekday: ["Siddur_Sefard,_Birchat_HaMazon,_Birchat_HaMazon"] },
          ashkenaz: { weekday: ["Siddur_Ashkenaz,_Berachot,_Birkat_HaMazon"] },
        },
        "al-hamichya": {
          mizrahi: { weekday: ["Al_HaMichya"] },
          sfard: { weekday: ["Al_HaMichya"] },
          ashkenaz: { weekday: ["Al_HaMichya"] },
        },
        "kiddush-levana": {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Blessing_of_the_Moon"] },
          sfard: { weekday: ["Siddur_Edot_HaMizrach,_Blessing_of_the_Moon"] },
          ashkenaz: { weekday: ["Siddur_Edot_HaMizrach,_Blessing_of_the_Moon"] },
        },
        "tikkun-chatzot": {
          mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel", "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah"] },
          sfard: { weekday: ["Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel", "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah"] },
          ashkenaz: { weekday: ["Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel", "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah"] },
        },
      };

      const PRAYER_SOURCE_PRIORITY = {
        shacharit: "full-sefaria-compose",
        maariv: "full-sefaria-compose",
        mincha: "full-sefaria-compose",
        "birchot-hashachar": "full-sefaria-compose",
        shema: "local-first",
        "al-hamichya": "composite-local",
        "kiddush-levana": "full-sefaria-compose",
        "tikkun-haklali": "local-first",
        "tikkun-chatzot": "full-sefaria-compose",
        "birkat-hamazon": "full-sefaria-compose",
      };

      const FULL_PRAYER_SECTION_REFS = {
        shacharit: {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Modeh_Ani",
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Morning_Blessings",
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Torah_Blessings",
            "Siddur_Edot_HaMizrach,_Weekday_Shacharit,_Morning_Prayer",
            "Siddur_Edot_HaMizrach,_Weekday_Shacharit,_Pesukei_D'Zimra",
            "Siddur_Edot_HaMizrach,_Weekday_Shacharit,_The_Shema",
            "Siddur_Edot_HaMizrach,_Weekday_Shacharit,_Amida",
            "Siddur_Edot_HaMizrach,_Weekday_Shacharit,_Alenu",
          ],
          sfard: [
            "Siddur_Sefard,_Upon_Arising,_Modeh_Ani",
            "Siddur_Sefard,_Weekday_Shacharit,_Morning_Blessings",
            "Siddur_Sefard,_Weekday_Shacharit,_Blessings_on_Torah",
            "Siddur_Sefard,_Weekday_Shacharit,_Morning_Prayer",
            "Siddur_Sefard,_Weekday_Shacharit,_Korbanot",
            "Siddur_Sefard,_Weekday_Shacharit,_Hodu",
            "Siddur_Sefard,_Weekday_Shacharit,_Yishtabach",
            "Siddur_Sefard,_Weekday_Shacharit,_The_Shema",
            "Siddur_Sefard,_Weekday_Shacharit,_Amidah",
            "Siddur_Sefard,_Weekday_Shacharit,_Tachanun",
            "Siddur_Sefard,_Weekday_Shacharit,_Ashrei",
            "Siddur_Sefard,_Weekday_Shacharit,_Song_of_the_Day",
            "Siddur_Sefard,_Weekday_Shacharit,_Kaveh",
            "Siddur_Sefard,_Weekday_Shacharit,_Aleinu",
          ],
          ashkenaz: [
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Modeh_Ani",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Netilat_Yadayim",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Asher_Yatzar",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Elokai_Neshama",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Torah_Blessings",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Morning_Blessings",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Barukh_She'amar",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Hodu",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Ashrei",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Az_Yashir",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Pesukei_Dezimra,_Yishtabach",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_First_Blessing_before_Shema",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_Second_Blessing_before_Shema",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_Shema",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Blessings_of_the_Shema,_Blessing_after_Shema",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Patriarchs",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Divine_Might",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Holiness_of_God",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Keduasha",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Knowledge",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Repentance",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Forgiveness",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Redemption",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Healing",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Prosperity",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Gathering_the_Exiles",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Justice",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Against_Enemies",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_The_Righteous",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Rebuilding_Jerusalem",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Kingdom_of_David",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Response_to_Prayer",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Temple_Service",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Thanksgiving",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Birkat_Kohanim",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Peace",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Amidah,_Concluding_Passage",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Concluding_Prayers,_Ashrei",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Concluding_Prayers,_Uva_Letzion",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Concluding_Prayers,_Kaddish_Shalem",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Concluding_Prayers,_Song_of_the_Day",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Concluding_Prayers,_Alenu",
          ],
        },
        maariv: {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Weekday_Arvit,_Barchu",
            "Siddur_Edot_HaMizrach,_Weekday_Arvit,_The_Shema",
            "Siddur_Edot_HaMizrach,_Weekday_Arvit,_Amidah",
            "Siddur_Edot_HaMizrach,_Weekday_Arvit,_Alenu",
          ],
          sfard: [
            "Siddur_Sefard,_Weekday_Maariv,_The_Shema",
            "Siddur_Sefard,_Weekday_Maariv,_Amidah",
            "Siddur_Sefard,_Weekday_Shacharit,_Aleinu",
          ],
          ashkenaz: [
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Barchu",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Blessings_of_the_Shema,_First_Blessing_before_Shema",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Blessings_of_the_Shema,_Second_Blessing_before_Shema",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Blessings_of_the_Shema,_Shema",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Blessings_of_the_Shema,_First_Blessing_after_Shema",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Blessings_of_the_Shema,_Second_Blessing_after_Shema",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Patriarchs",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Divine_Might",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Holiness_of_God",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Knowledge",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Repentance",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Forgiveness",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Redemption",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Healing",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Prosperity",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Gathering_the_Exiles",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Justice",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Against_Enemies",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_The_Righteous",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Rebuilding_Jerusalem",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Kingdom_of_David",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Response_to_Prayer",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Temple_Service",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Thanksgiving",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Peace",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Amidah,_Concluding_Passage",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Kaddish_Shalem",
            "Siddur_Ashkenaz,_Weekday,_Maariv,_Alenu",
          ],
        },
        mincha: {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Weekday_Mincha,_Offerings",
            "Siddur_Edot_HaMizrach,_Weekday_Mincha,_Amida",
            "Siddur_Edot_HaMizrach,_Weekday_Mincha,_Vidui",
            "Siddur_Edot_HaMizrach,_Weekday_Mincha,_Alenu",
          ],
          sfard: [
            "Siddur_Sefard,_Weekday_Mincha,_Korbanot",
            "Siddur_Sefard,_Weekday_Mincha,_Amidah",
            "Siddur_Sefard,_Weekday_Mincha,_Tachanun",
            "Siddur_Sefard,_Weekday_Mincha,_Avinu_Malkeinu",
          ],
          ashkenaz: [
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Ashrei",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Patriarchs",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Divine_Might",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Holiness_of_God",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Keduasha",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Knowledge",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Repentance",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Forgiveness",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Redemption",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Healing",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Prosperity",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Gathering_the_Exiles",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Justice",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Against_Enemies",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_The_Righteous",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Rebuilding_Jerusalem",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Kingdom_of_David",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Response_to_Prayer",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Temple_Service",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Thanksgiving",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Birkat_Kohanim",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Peace",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Amida,_Concluding_Passage",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Post_Amidah,_Avinu_Malkenu",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Post_Amidah,_Tachanun,_Nefilat_Appayim",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Post_Amidah,_Tachanun,_Shomer_Yisrael",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Post_Amidah,_Kaddish_Shalem",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Concluding_Prayers,_Alenu",
            "Siddur_Ashkenaz,_Weekday,_Minchah,_Concluding_Prayers,_Mourner's_Kaddish",
          ],
        },
        "birchot-hashachar": {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Modeh_Ani",
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Morning_Blessings",
            "Siddur_Edot_HaMizrach,_Preparatory_Prayers,_Torah_Blessings",
          ],
          sfard: [
            "Siddur_Sefard,_Upon_Arising,_Modeh_Ani",
            "Siddur_Sefard,_Weekday_Shacharit,_Morning_Blessings",
            "Siddur_Sefard,_Weekday_Shacharit,_Blessings_on_Torah",
          ],
          ashkenaz: [
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Modeh_Ani",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Netilat_Yadayim",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Asher_Yatzar",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Elokai_Neshama",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Morning_Blessings",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Torah_Blessings",
            "Siddur_Ashkenaz,_Weekday,_Shacharit,_Preparatory_Prayers,_Torah_Study",
          ],
        },
        "kiddush-levana": {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Blessing_of_the_Moon",
          ],
        },
        "tikkun-chatzot": {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_LeShem_Yichud",
            "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel",
            "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah",
          ],
        },
        "birkat-hamazon": {
          mizrahi: [
            "Siddur_Edot_HaMizrach,_Post_Meal_Blessing",
          ],
          sfard: [
            "Siddur_Sefard,_Birchat_HaMazon,_Birchat_HaMazon",
          ],
          ashkenaz: [
            "Siddur_Ashkenaz,_Berachot,_Birkat_HaMazon",
          ],
        },
      };

      function resolveSelectedNusach() {
        return {
          key: CURRENT_NUSACH in NUSACH_LABELS ? CURRENT_NUSACH : "mizrahi",
          label: NUSACH_LABELS[CURRENT_NUSACH] || NUSACH_LABELS.mizrahi,
        };
      }

      function resolveSeasonalPrayerContext() {
        const cached = window._livePrayerContextData?.dateData || {};
        const displayDate = window._livePrayerContextData?.displayDate || new Date();
        const liveNow = new Date();
        const liveSunset = window._lastZData?.times?.sunset ? new Date(window._lastZData.times.sunset) : null;
        const events = cached.events || [];
        const joined = [cached.hebrew || "", ...events].join(" | ");
        const includesAny = (patterns) => patterns.some((pattern) => joined.includes(pattern));
        return {
          displayDate,
          events,
          isShabbat: displayDate.getDay() === 6 || includesAny(["Shabbat", "שבת"]) || (liveNow.getDay() === 5 && liveSunset && liveNow >= liveSunset),
          isRoshChodesh: includesAny(["Rosh Chodesh", "ראש חודש"]),
          isChanukah: includesAny(["Chanukah", "Hanukkah", "חנוכה"]),
          isPurim: includesAny(["Purim", "פורים"]),
          isPesach: includesAny(["Pesach", "Passover", "פסח"]),
          isShavuot: includesAny(["Shavuot", "שבועות"]),
          isSukkot: includesAny(["Sukkot", "סוכות", "Shemini Atzeret", "שמיני עצרת", "Simchat Torah", "שמחת תורה"]),
          isYomKippur: includesAny(["Yom Kippur", "יום כיפור"]),
          isRoshHaShana: includesAny(["Rosh Hashana", "ראש השנה"]),
          isYamimNoraim: includesAny(["Rosh Hashana", "ראש השנה", "Yom Kippur", "יום כיפור"]),
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
       * Supplements include: instructions in [...], zimun, section headers/directions,
       * "leshem yichud", introductions, and seasonal insertion notes.
       */
      function markPrayerSupplements(html, key) {
        if (!html) return html;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        // Process paragraphs
        const paragraphs = wrapper.querySelectorAll('p');
        paragraphs.forEach(p => {
          const text = p.textContent.trim();
          // Already wrapped in supplement
          if (p.closest('.prayer-supplement') || p.closest('.seasonal-block')) return;
          const isSupplement =
            // Bracket instructions [בשבת], [עונים], [נוסח אשכנז...], etc.
            /^\[/.test(text) ||
            // Zimun call-and-response markers
            /^רבותי נברך|^\[עונים|^\[אומר|^בירשות|^ברשות|^יהי שם/.test(text) ||
            // Leshem Yichud / preparation text
            /^לשם י[יי]חוד|^הנני מוכן|^לפני אמירת|^לאחר אמירת|^תפילה קצרה לאמרה/.test(text) ||
            // "Shir Hamaalot" before birkat hamazon is a preamble
            (key === 'birkat-hamazon' && /^שִׁיר הַמַּעֲלוֹת|^שיר המעלות/.test(text)) ||
            // Zimun section in birkat hamazon
            (key === 'birkat-hamazon' && /^רַבּוֹתַי נְבָרֵךְ/.test(text)) ||
            // Direction lines like "אומרים שלוש פעמים"
            /^אומרים|^ג['׳] פעמים|^סימן טוב/.test(text) ||
            // Section heading markers that are bold descriptions, not prayer
            /^📌/.test(text) ||
            // Bold section titles like **ברכה ראשונה**
            (p.querySelector('strong') && !p.querySelector('strong').nextSibling && /^ברכה\s|^חצי קדיש|^עמידה|^קדיש|^פסוקי דזמרה|^קריאת שמע|^ברכו|^ברכות קריאת/.test(text)) ||
            // Explanatory notes
            /^נוסח אשכנז|^ההבדל|^שאר הנוסח|^המשך —|^\[המשך/.test(text) ||
            // Instructions with colons that describe what to say
            /^(בשבת|בראש חודש|ביום טוב|בחנוכה|בפורים|קיץ|חורף):/.test(text) ||
            // "Lechu neranena" and "lecho" style introductions in tikkun chatzot
            /^לכו נרננה/.test(text);
          if (isSupplement) {
            p.classList.add('prayer-supplement');
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
          html: markPrayerSupplements(result.html, key),
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
        // Base font size is 25px for all text areas that use this function
        // (holy-text-style class = 25px, psalm-text-area = explicitly set to 25px)
        const BASE_PX = 25;
        const targets = document.querySelectorAll(targetSelector);
        targets.forEach(el => {
          el.style.fontSize = ((_prayerFontSize / 100) * BASE_PX) + 'px';
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
            <div class="modal-inner" style="background:#faf9f6;border:1px solid rgba(0,0,0,0.1);border-radius:2rem;padding:1.5rem;width:100%;max-width:760px;max-height:min(88vh,980px);margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.2);text-align:center;direction:rtl;display:flex;flex-direction:column;overflow:hidden;">
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
            <div id="prayer-modal-body" class="prayer-modal-body-mobile" style="flex:1;overflow-y:auto;background:#faf9f6;text-align:center;direction:rtl;">
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
                  <div class="holy-text-style" style="flex:1;min-height:0;overflow-y:auto;padding-inline-end:0.35rem;padding-bottom:0.35rem;direction:rtl;text-align:center;">
                    ${content.seasonalHtml}
                    ${content.html}
                  </div>
                  <div style="border-top:1px solid rgba(0,0,0,0.08);margin-top:0.85rem;padding-top:0.75rem;color:#94a3b8;font-size:0.72rem;text-align:center;">
                    מקור התוכן: <strong>${content.sourceLabel}</strong>${content.sourceUrl ? ` · <a href="${content.sourceUrl}" target="_blank" style="color:#1d4ed8;">קישור למקור</a>` : ""}
                  </div>
                </div>`;
            } else {
              body.innerHTML = `
                <div class="holy-text-style" style="direction:rtl;text-align:center;">
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
              <div id="psalm-text-area" class="holy-text-style" style="padding:1.25rem;overflow-y:auto;flex:1;text-align:center;direction:rtl;"></div>
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
          area.style.cssText = "padding:1.25rem;overflow-y:auto;flex:1;font-family:'Frank Ruhl Libre','David Libre',serif;font-size:25px;font-weight:700;line-height:1.7;color:#000000;text-align:center;direction:rtl;";
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
            waBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.75a.375.375 0 00.459.459l5.895-1.468A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.679-.528-5.192-1.443l-.372-.221-3.863.963.981-3.763-.242-.389A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> שתף בוואצאפ`;
            waBtn.onclick = () => shareEventWhatsApp(e.name, e.date, e.heb || e.name);
            btnRow.appendChild(waBtn);
          } catch(_) {}
        });
        requestAnimationFrame(setupCardObserver);
      };

      // ═══════════════════════════════════════════════════════
      // ✦  SCROLL-TO-TOP FAB
      // ═══════════════════════════════════════════════════════
      (function setupScrollTop() {
        const fab = document.getElementById('fab-top');
        if (!fab) return;
        window.addEventListener('scroll', () => {
          if (window.scrollY > 400) {
            fab.style.opacity = '1';
            fab.style.transform = 'translateY(0) scale(1)';
            fab.style.pointerEvents = 'auto';
          } else {
            fab.style.opacity = '0';
            fab.style.transform = 'translateY(12px) scale(0.9)';
            fab.style.pointerEvents = 'none';
          }
        }, { passive: true });
        fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      })();

      // ═══════════════════════════════════════════════════════
      // ✦  KEYBOARD SHORTCUT: Ctrl+K / ⌘+K → focus search
      // ═══════════════════════════════════════════════════════
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('calendar-day-modal')) {
          closeCalendarDay();
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const search = document.getElementById('mainSearch');
          if (search) {
            search.focus();
            search.select();
            search.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        if (e.key === 'Escape') {
          const search = document.getElementById('mainSearch');
          if (document.activeElement === search) {
            search.blur();
            search.value = '';
            if (typeof render === 'function') render('all', '');
          }
        }
      });

      // ═══════════════════════════════════════════════════════
      // ✦  IMPROVED EMPTY STATE in render()
      // ═══════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════
      // ✦  PWA INSTALL PROMPT
      // ═══════════════════════════════════════════════════════
      (function initPWAInstall() {
        // Don't show if already running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        // Don't show if dismissed recently (within 7 days)
        const dismissed = parseInt(localStorage.getItem('pwa_install_dismissed') || '0');
        if (dismissed && Date.now() - dismissed < 7 * 86400000) return;

        let deferredPrompt = null;
        const banner  = document.getElementById('pwa-install-banner');
        const installBtn  = document.getElementById('pwa-install-btn');
        const dismissBtn  = document.getElementById('pwa-install-dismiss');

        const showBanner = () => {
          if (!banner || !deferredPrompt) return;
          banner.style.display = 'block';
          requestAnimationFrame(() => {
            banner.style.opacity = '1';
            banner.style.transform = 'translateX(-50%) translateY(0)';
          });
        };

        const hideBanner = () => {
          if (!banner) return;
          banner.style.opacity = '0';
          banner.style.transform = 'translateX(-50%) translateY(20px)';
          setTimeout(() => { banner.style.display = 'none'; }, 400);
        };

        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          deferredPrompt = e;
          // Show after 4s so it doesn't interrupt initial load
          setTimeout(showBanner, 4000);
        });

        installBtn && installBtn.addEventListener('click', async () => {
          if (!deferredPrompt) return;
          hideBanner();
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            showToast('🎉 האפליקציה הותקנה בהצלחה!', 'success', 4000);
          }
          deferredPrompt = null;
        });

        dismissBtn && dismissBtn.addEventListener('click', () => {
          hideBanner();
          localStorage.setItem('pwa_install_dismissed', String(Date.now()));
        });

        // iOS Safari — show a manual guide since beforeinstallprompt not supported
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isInStandalone = window.navigator.standalone === true;
        if (isIOS && !isInStandalone && !dismissed) {
          // Wait until page is interacted with
          const handler = () => {
            document.removeEventListener('touchend', handler);
            setTimeout(() => showToast('להוסיף למסך הבית: לחץ "שתף" ← "הוסף למסך הבית"', 'info', 6000), 5000);
          };
          document.addEventListener('touchend', handler, { once: true });
        }
      })();

      // ═══════════════════════════════════════════════════════
      // ✦  IMPROVED EMPTY STATE in render()
      // ═══════════════════════════════════════════════════════
      (function patchRenderEmptyState() {
        const _prev = window.render;
        window.render = function(filter = 'all', search = '') {
          _prev(filter, search);
          const c = document.getElementById('resultsGrid');
          if (!c) return;
          if (c.querySelectorAll('.event-card').length === 0 && !c.querySelector('[role="alert"]')) {
            const noResultIcon = `<svg class="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
            const msg = (typeof getDynamicUiText === 'function' && getDynamicUiText().noResults) || 'לא נמצאו מועדים תואמים.';
            c.innerHTML = `<div class="text-center py-16 text-slate-400 dark:text-slate-500" role="alert">${noResultIcon}<p class="font-bold text-lg">${msg}</p><p class="text-sm mt-2 opacity-70">נסה לחפש מילה אחרת או בחר "הכל"</p></div>`;
          }
        };
      })();

// ═══════════════════════════════════════════════════════
// ✦  HILULOT DATA & MODAL  (v3 – fixes + expanded data)
// ═══════════════════════════════════════════════════════
(function () {

  var HD = {
    // ── תשרי ──
    "תשרי-1":  [{ name: "ראש השנה", title: "יום הדין – ראש השנה לכל המצוות", icon: "🎺" }],
    "תשרי-3":  [{ name: "צום גדליה", title: "זכר לגדליה בן אחיקם", icon: "✨" }],
    "תשרי-10": [{ name: "יום הכיפורים", title: "יום הכפרות והסליחות הגדול", icon: "✨" }],
    "תשרי-13": [
      { name: 'רבי עקיבא איגר', title: "גדול פוסקי אשכנז, פוזנא", icon: "🕯️" },
      { name: 'המהר"ש מלובביץ', title: "רבי שמואל שניאורסון, אדמו\"ר הרביעי של חב\"ד", icon: "🕯️" }
    ],
    "תשרי-14": [{ name: "המגיד מקוז'ניץ", title: "רבי ישראל הופשטיין, בעל עבודת ישראל", icon: "🕯️" }],
    "תשרי-18": [{ name: "רבי נחמן מברסלב", title: 'בעל ספר ליקוטי מוהר"ן, אוּמַן', icon: "🕯️" }],
    "תשרי-19": [{ name: "היהודי הקדוש מפשיסחא", title: "רבי יעקב יצחק רבינוביץ", icon: "🕯️" }],
    "תשרי-25": [
      { name: "רבי לוי יצחק מברדיצ'ב", title: "בעל קדושת לוי", icon: "🕯️" },
      { name: "החתם סופר", title: "רבי משה סופר, גדול פוסקי אשכנז", icon: "🕯️" }
    ],
    // ── חשוון ──
    "חשוון-3": [
      { name: "רבי ישראל מרוז'ין", title: "מייסד שושלת רוז'ין, בעל עבודת ישראל", icon: "🕯️" },
      { name: "מרן רבי עובדיה יוסף", title: "הראשון לציון, בעל ספרי יביע אומר", icon: "🕯️" }
    ],
    "חשוון-11": [
      { name: "רחל אמנו עליה השלום", title: "אמנו רחל, קבורה בבית לחם", icon: "🕯️" },
      { name: "רבי מנחם נחום מצ'רנוביל", title: "בעל מאור עיניים, מגדולי תלמידי הבעש\"ט", icon: "🕯️" }
    ],
    // ── כסלו ──
    "כסלו-19": [
      { name: "המגיד הגדול ממזריטש", title: "רבי דב בער, ממשיך הבעש\"ט", icon: "🕯️" },
      { name: 'י"ט כסלו – חג הגאולה', title: "גאולת אדמו\"ר הזקן ורבי לוי יצחק, חב\"ד", icon: "✨" }
    ],
    // ── טבת ──
    "טבת-10":  [
      { name: "עשרה בטבת", title: "צום – תחילת מצור נבוכדנאצר על ירושלים", icon: "✨" },
      { name: "רבי נתן מברסלב", title: "תלמיד רבי נחמן, בעל ליקוטי הלכות", icon: "🕯️" }
    ],
    "טבת-18":  [{ name: 'הבני יששכר', title: "רבי צבי אלימלך שפירא מדינוב, בעל בני יששכר", icon: "🕯️" }],
    "טבת-20":  [{ name: 'הרמב"ם', title: "רבי משה בן מיימון, גדול הפוסקים", icon: "🕯️" }],
    "טבת-24":  [{ name: "רבי שניאור זלמן מליאדי", title: "בעל התניא, מייסד חסידות חב\"ד", icon: "🕯️" }],
    // ── שבט ──
    "שבט-2":   [{ name: "רבי זושא מאניפולי", title: "אחי רבי אלימלך, מגדולי החסידות", icon: "🕯️" }],
    "שבט-4":   [{ name: "רבי משה לייב מסאסוב", title: "בעל ליקוטי שושנה, עמוד האהבה", icon: "🕯️" }],
    "שבט-5":   [{ name: "רבי מנחם מנדל מויטבסק", title: "מנהיג החסידות בארץ ישראל, פתח תקווה", icon: "🕯️" }],
    "שבט-10":  [{ name: 'כ"ק אדמו"ר הריי"צ', title: "רבי יוסף יצחק שניאורסון, אדמו\"ר השישי מחב\"ד", icon: "🕯️" }],
    "שבט-15":  [{ name: 'ט"ו בשבט', title: "ראש השנה לאילנות", icon: "🌳" }],
    "שבט-22":  [{ name: "רבי מנחם מנדל מקוצק", title: "הקוצקר, בעל אמת ועוז", icon: "🕯️" }],
    "שבט-25":  [{ name: "רבי ישראל סלנטר", title: "מייסד תנועת המוסר", icon: "🕯️" }],
    // ── אדר ──
    "אדר-5":   [{ name: 'השפת אמת', title: "רבי יהודה אריה ליב אלתר, אדמו\"ר גור", icon: "🕯️" }],
    "אדר-7":   [{ name: "משה רבנו עליו השלום", title: "גדול הנביאים, מקבל התורה מסיני", icon: "🕯️" }],
    "אדר-11":  [{ name: 'החיד"א', title: "רבי חיים יוסף דוד אזולאי, גדול הספרדים", icon: "🕯️" }],
    "אדר-13":  [{ name: "רבי משה פיינשטיין", title: 'גדול פוסקי הדור, בעל שו"ת אגרות משה', icon: "🕯️" }],
    "אדר-21":  [{ name: "רבי אלימלך מליז'נסק", title: "בעל נועם אלימלך, עמוד החסידות", icon: "🕯️" }],
    "אדר-23":  [{ name: 'החידושי הרי"ם', title: "רבי יצחק מאיר אלתר, מייסד שושלת גור", icon: "🕯️" }],
    // ── ניסן ──
    "ניסן-2":  [{ name: 'הרש"ב', title: "רבי שלום דובער שניאורסון, אדמו\"ר החמישי מחב\"ד", icon: "🕯️" }],
    "ניסן-5":  [{ name: "האוהב ישראל מאפטא", title: "רבי אברהם יהושע העשיל מאפטא", icon: "🕯️" }],
    "ניסן-13": [
      { name: "מרן רבי יוסף קארו", title: "בעל השולחן ערוך והבית יוסף", icon: "🕯️" },
      { name: "הצמח צדק", title: "רבי מנחם מנדל שניאורסון, אדמו\"ר השלישי מחב\"ד", icon: "🕯️" }
    ],
    "ניסן-27": [{ name: "יום הזיכרון לשואה ולגבורה", title: "זכר ועדות לשואת יהודי אירופה", icon: "🕯️" }],
    // ── אייר ──
    "אייר-1":  [{ name: "רבי שמלקה מניקלשבורג", title: "תלמיד המגיד ממזריטש, בעל דברי שמואל", icon: "🕯️" }],
    "אייר-11": [{ name: "רבי נפתלי מרופשיץ", title: "בעל זרע קודש", icon: "🕯️" }],
    "אייר-14": [{ name: "רבי מאיר בעל הנס", title: "תנא קדוש, תלמיד רבי עקיבא", icon: "🕯️" }],
    "אייר-17": [{ name: 'הנודע ביהודה', title: "רבי יחזקאל לנדא מפראג, גדול פוסקי אשכנז", icon: "🕯️" }],
    "אייר-18": [
      { name: 'רבי שמעון בר יוחאי – הרשב"י', title: "בעל הזוהר הקדוש, לג בעומר", icon: "🕯️" },
      { name: "הרמ\"א", title: "רבי משה איסרליש, בעל המפה על השולחן ערוך", icon: "🕯️" }
    ],
    "אייר-22": [{ name: "רבי אורי מסטרעליסק", title: "השרף הקדוש, בעל אמרי קודש", icon: "🕯️" }],
    "אייר-26": [{ name: 'רבי משה חיים לוצאטו – רמח"ל', title: "בעל מסילת ישרים ודרך ה'", icon: "🕯️" }],
    "אייר-29": [{ name: "רבי מאיר מפרמישלאן", title: "בעל בת עין, נכד הבעש\"ט", icon: "🕯️" }],
    // ── סיוון ──
    "סיוון-6": [
      { name: "דוד המלך עליו השלום", title: "מלך ישראל, כותב תהלים", icon: "🕯️" },
      { name: "הבעל שם טוב", title: "רבי ישראל בעל שם טוב, מייסד תנועת החסידות", icon: "🕯️" }
    ],
    "סיוון-10": [{ name: "רבי יצחק אייזיק מקאמרנא", title: "בעל הֵיכל הברכה, מגדולי קאמרנא", icon: "🕯️" }],
    "סיוון-14": [{ name: "רבי חיים מוולוז'ין", title: "תלמיד הגר\"א, מייסד ישיבת וולוז'ין", icon: "🕯️" }],
    // ── תמוז ──
    "תמוז-3":  [{ name: 'כ"ק אדמו"ר מחב"ד', title: "רבי מנחם מנדל שניאורסון, נשיא חב\"ד", icon: "🕯️" }],
    "תמוז-14": [{ name: "הפלאה", title: "רבי פינחס הורוביץ, בעל ספר הפלאה", icon: "🕯️" }],
    "תמוז-15": [{ name: 'האור החיים הקדוש', title: "רבי חיים בן עטר, בעל אור החיים על התורה", icon: "🕯️" }],
    "תמוז-19": [{ name: "רבי אהרן הגדול מקרלין", title: "מגדולי תלמידי המגיד, קרלין", icon: "🕯️" }],
    "תמוז-22": [{ name: "רבי שלמה מקרלין", title: "בעל שבחי הר\"ש, עמוד החסידות", icon: "🕯️" }],
    "תמוז-29": [{ name: 'רש"י', title: "רבי שלמה יצחקי, פרשן התורה והתלמוד לדורות", icon: "🕯️" }],
    // ── אב ──
    "אב-1":    [{ name: "אהרן הכהן הגדול", title: "אח משה רבנו, ראשון הכהנים הגדולים", icon: "🕯️" }],
    "אב-5":    [{ name: 'האר"י הקדוש', title: "רבי יצחק לוריא אשכנזי, אבי קבלת צפת", icon: "🕯️" }],
    "אב-9":    [{ name: "תשעה באב", title: "יום אבל על חורבן בית המקדש", icon: "✨" }],
    "אב-10":   [{ name: "המי השילוח", title: "רבי מרדכי יוסף ליינר מאיזביצא", icon: "🕯️" }],
    "אב-16":   [{ name: "רבי יהושע מבעלזא", title: "אדמו\"ר הרביעי מבעלז", icon: "🕯️" }],
    "אב-20":   [{ name: "רבי לוי יצחק שניאורסון", title: "אביו של הרבי מחב\"ד, אלמא-אטה", icon: "🕯️" }],
    "אב-21":   [{ name: "רבי אהרן רוקח מבעלזא", title: "אדמו\"ר הרביעי מבעלז", icon: "🕯️" }],
    // ── אלול ──
    "אלול-9":  [{ name: "רבי צדוק הכהן מלובלין", title: "בעל פרי צדיק ולוב ישראל", icon: "🕯️" }],
    "אלול-10": [{ name: "רבי פינחס מקוריץ", title: "מגדולי תלמידי הבעש\"ט", icon: "🕯️" }],
    "אלול-12": [{ name: "רבי שמחה בונם מפשיסחא", title: "מגדולי אדמו\"רי הפשיסחא", icon: "🕯️" }],
    "אלול-18": [{ name: 'חי אלול', title: "יום הולדת הבעש\"ט ואדמו\"ר הזקן", icon: "✨" }],
    "אלול-27": [{ name: "רבי שלום רוקח מבעלזא", title: "מייסד שושלת בעלז", icon: "🕯️" }]
  };

  var _dayOffset = 0;
  var _calRefDate = null;

  function getHebInfo(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    var fmtM = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });
    var fmtD = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });
    var fmtY = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { year: "numeric" });
    var month = fmtM.format(d);
    var dayNum = parseInt(fmtD.format(d).replace(/[^0-9]/g, ""), 10);
    var year = fmtY.format(d);
    var fmtGreg = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" });
    var gregStr = fmtGreg.format(d);
    return { month: month, day: dayNum, year: year, key: month + "-" + dayNum, date: d, gregStr: gregStr };
  }

  function getFirstOfHebMonth(refDate) {
    var fmtD = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });
    var dn = parseInt(fmtD.format(refDate).replace(/[^0-9]/g, ""), 10);
    var first = new Date(refDate);
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() - (dn - 1));
    first.setHours(0, 0, 0, 0);
    return first;
  }

  function getHebMonthLength(firstOfMonth) {
    var fmtD = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });
    var len = 0;
    var probe = new Date(firstOfMonth);
    for (var i = 0; i < 32; i++) {
      probe.setDate(probe.getDate() + 1);
      var d2 = parseInt(fmtD.format(probe).replace(/[^0-9]/g, ""), 10);
      if (d2 === 1) { len = i + 1; break; }
    }
    return len || 30;
  }

  function buildHilulotList(tzaddikim, key) {
    if (!tzaddikim || tzaddikim.length === 0) {
      return '<div style="text-align:center;padding:2rem 0;color:#94a3b8;">' +
        '<div style="font-size:2.5rem;margin-bottom:0.75rem;">🌙</div>' +
        '<p style="font-size:1rem;font-weight:600;">אין הילולות ידועות להיום</p>' +
        '<p style="font-size:0.8rem;margin-top:0.5rem;opacity:0.7;">(' + (key || "") + ')</p>' +
        '</div>';
    }
    return tzaddikim.map(function (t) {
      return '<div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.85rem 1rem;' +
        'background:rgba(255,255,255,0.06);border-radius:1rem;margin-bottom:0.65rem;' +
        'border:1px solid rgba(255,255,255,0.1);">' +
        '<span style="font-size:1.6rem;flex-shrink:0;">' + (t.icon || "🕯️") + '</span>' +
        '<div style="direction:rtl;text-align:right;">' +
        '<div style="font-weight:700;font-size:1rem;color:#e2e8f0;margin-bottom:0.2rem;">' + t.name + '</div>' +
        '<div style="font-size:0.78rem;color:#94a3b8;line-height:1.4;">' + t.title + '</div>' +
        '</div></div>';
    }).join("");
  }

  function refreshMainModal(offset) {
    var info = getHebInfo(offset);
    var tzaddikim = HD[info.key] || [];
    var titleEl = document.getElementById("hil-title");
    var bodyEl = document.getElementById("hilulot-body");
    if (titleEl) titleEl.textContent = "הילולות – " + info.day + " " + info.month + " " + info.year;
    var gregEl = document.getElementById("hil-greg-date");
    if (gregEl) gregEl.textContent = info.gregStr;
    if (bodyEl) bodyEl.innerHTML = buildHilulotList(tzaddikim, info.key);
    var prevBtn = document.getElementById("hil-prev");
    var nextBtn = document.getElementById("hil-next");
    if (prevBtn) prevBtn.setAttribute("data-offset", offset - 1);
    if (nextBtn) nextBtn.setAttribute("data-offset", offset + 1);
    var dateLabel = document.getElementById("hil-datelabel");
    if (dateLabel) {
      if (offset === 0) dateLabel.textContent = "היום";
      else if (offset === -1) dateLabel.textContent = "אתמול";
      else if (offset === 1) dateLabel.textContent = "מחר";
      else dateLabel.textContent = info.day + " " + info.month;
    }
    var todayBtn = document.getElementById("hil-today-btn");
    if (todayBtn) todayBtn.style.display = (offset !== 0) ? "block" : "none";
  }

  window.openHilulotModal = function (initOffset) {
    _dayOffset = (typeof initOffset === "number") ? initOffset : 0;
    var info = getHebInfo(_dayOffset);
    var tzaddikim = HD[info.key] || [];

    var old = document.getElementById("hilulot-modal");
    if (old) old.remove();

    var modal = document.createElement("div");
    modal.id = "hilulot-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);padding:1rem;";

    var dateLabel;
    if (_dayOffset === 0) dateLabel = "היום";
    else if (_dayOffset === -1) dateLabel = "אתמול";
    else if (_dayOffset === 1) dateLabel = "מחר";
    else dateLabel = info.day + " " + info.month;

    modal.innerHTML =
      '<div id="hilulot-inner" style="' +
        'background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);' +
        'border:1px solid rgba(139,92,246,0.35);border-radius:1.5rem;' +
        'padding:1.75rem 1.5rem 1.25rem;max-width:420px;width:100%;' +
        'max-height:85vh;overflow-y:auto;position:relative;' +
        'box-shadow:0 25px 60px rgba(0,0,0,0.6);">' +
        '<button id="hilulot-close" ' +
          'style="position:absolute;top:1rem;left:1rem;background:rgba(255,255,255,0.1);' +
          'border:none;border-radius:50%;width:2rem;height:2rem;cursor:pointer;' +
          'color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"' +
          ' aria-label="סגור">✕</button>' +
        '<div style="text-align:center;margin-bottom:1rem;">' +
          '<div style="font-size:1.8rem;margin-bottom:0.4rem;">🕯️</div>' +
          '<h2 id="hil-title" style="font-size:1.1rem;font-weight:700;color:#c4b5fd;margin:0 0 0.2rem;">' +
            'הילולות – ' + info.day + ' ' + info.month + ' ' + info.year +
          '</h2>' +
          '<p style="font-size:0.78rem;color:#64748b;margin:0 0 0.15rem;">יארצייט ויום הסתלקות צדיקים</p>' +
          '<p id="hil-greg-date" style="font-size:0.78rem;color:#475569;margin:0;direction:ltr;">' + info.gregStr + '</p>' +
        '</div>' +
        // Navigation arrows
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
          'margin-bottom:1rem;direction:ltr;">' +
          '<button id="hil-prev" data-offset="' + (_dayOffset - 1) + '" ' +
            'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
            'color:#c4b5fd;border-radius:0.75rem;padding:0.4rem 0.9rem;cursor:pointer;font-size:1.2rem;" ' +
            'title="יום קודם">‹</button>' +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">' +
            '<span id="hil-datelabel" style="color:#94a3b8;font-size:0.85rem;">' + dateLabel + '</span>' +
            '<button id="hil-today-btn" style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);color:#fbbf24;border-radius:0.5rem;padding:0.1rem 0.7rem;cursor:pointer;font-size:0.72rem;font-weight:700;display:' + (_dayOffset !== 0 ? 'block' : 'none') + ';">היום</button>' +
          '</div>' +
          '<button id="hil-next" data-offset="' + (_dayOffset + 1) + '" ' +
            'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
            'color:#c4b5fd;border-radius:0.75rem;padding:0.4rem 0.9rem;cursor:pointer;font-size:1.2rem;" ' +
            'title="יום הבא">›</button>' +
        '</div>' +
        '<div id="hilulot-body">' + buildHilulotList(tzaddikim, info.key) + '</div>' +
        // Calendar button
        '<div style="text-align:center;margin-top:1.1rem;">' +
          '<button id="hil-cal-btn" ' +
            'style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
            'color:#c4b5fd;border-radius:1rem;padding:0.5rem 1.2rem;cursor:pointer;font-size:0.85rem;">' +
            '📅 לוח הילולות חודשי' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    function navTo(newOffset) {
      _dayOffset = newOffset;
      refreshMainModal(_dayOffset);
    }

    modal.querySelector("#hil-prev").addEventListener("click", function () { navTo(_dayOffset - 1); });
    modal.querySelector("#hil-next").addEventListener("click", function () { navTo(_dayOffset + 1); });
    var todayBtnEl = modal.querySelector("#hil-today-btn");
    if (todayBtnEl) todayBtnEl.addEventListener("click", function () { navTo(0); });
    modal.querySelector("#hil-cal-btn").addEventListener("click", function () {
      modal.remove();
      window.openHilulotCalendar();
    });
    modal.querySelector("#hilulot-close").addEventListener("click", function () { modal.remove(); });
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.remove(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { modal.remove(); document.removeEventListener("keydown", esc); }
    });
    modal.querySelector("#hilulot-close").focus();
  };

  // ── Calendar popup ──

  var HIL_HEB_DAYS = ["","א'","ב'","ג'","ד'","ה'","ו'","ז'","ח'","ט'","י'",
    'י"א','י"ב','י"ג','י"ד','ט"ו','ט"ז','י"ז','י"ח','י"ט',"כ'",
    'כ"א','כ"ב','כ"ג','כ"ד','כ"ה','כ"ו','כ"ז','כ"ח','כ"ט',"ל'"];

  function buildCalendarGrid(refDate) {
    var fmtM = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });
    var fmtY = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { year: "numeric" });
    var fmtD = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });

    var first = getFirstOfHebMonth(refDate);
    var len = getHebMonthLength(first);
    var monthName = fmtM.format(first);
    var yearName = fmtY.format(first);

    // Day-of-week offset (Sunday=0 in JS)
    var dow = first.getDay();

    // Today for highlighting
    var todayStr = new Date().toDateString();

    var cells = [];
    // Build date→offset map for today comparison
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 0; i < len; i++) {
      var cellDate = new Date(first);
      cellDate.setDate(first.getDate() + i);
      cellDate.setHours(0, 0, 0, 0);
      var dayNum = parseInt(fmtD.format(cellDate).replace(/[^0-9]/g, ""), 10);
      var key = monthName + "-" + dayNum;
      var haH = !!(HD[key] && HD[key].length > 0);
      var diffMs = cellDate.getTime() - today.getTime();
      var offset = Math.round(diffMs / 86400000);
      var isToday = cellDate.toDateString() === todayStr;
      cells.push({ dayNum: dayNum, hebLetter: HIL_HEB_DAYS[dayNum] || String(dayNum), key: key, haH: haH, offset: offset, isToday: isToday, gregDay: cellDate.getDate() });
    }

    return { monthName: monthName, yearName: yearName, dow: dow, cells: cells, len: len, first: first };
  }

  function renderCalendarBody(refDate) {
    _calRefDate = new Date(refDate);
    var g = buildCalendarGrid(refDate);

    var titleEl = document.getElementById("hil-cal-month-title");
    if (titleEl) titleEl.textContent = g.monthName + " " + g.yearName;
    var gregMonthEl = document.getElementById("hil-cal-greg-month");
    if (gregMonthEl) {
      var lastDate = new Date(g.first);
      lastDate.setDate(g.first.getDate() + g.len - 1);
      var fmtGM = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });
      var startG = fmtGM.format(g.first);
      var endG = fmtGM.format(lastDate);
      gregMonthEl.textContent = startG === endG ? startG : startG + " – " + endG;
    }

    var gridEl = document.getElementById("hil-cal-grid");
    if (!gridEl) return;

    var html = "";
    // Empty cells before first day
    for (var e = 0; e < g.dow; e++) {
      html += '<div></div>';
    }
    g.cells.forEach(function (c) {
      var bg = c.isToday
        ? "background:rgba(251,191,36,0.25);border:1px solid rgba(251,191,36,0.6);"
        : c.haH
          ? "background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);"
          : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);";
      var cursor = c.haH ? "cursor:pointer;" : "";
      var onCl = c.haH ? ' onclick="window._hilOpenFromCal(' + c.offset + ')"' : '';
      var dot = c.haH ? '<div style="width:5px;height:5px;border-radius:50%;background:#a78bfa;margin:1px auto 0;"></div>' : '<div style="height:6px;"></div>';
      html += '<div' + onCl + ' style="' + bg + cursor +
        'border-radius:0.5rem;padding:0.25rem 0;text-align:center;min-height:2.6rem;" ' +
        'title="' + (c.haH ? c.key : "") + '">' +
        '<div style="font-size:0.75rem;color:' + (c.isToday ? "#fbbf24" : c.haH ? "#c4b5fd" : "#94a3b8") + ';font-weight:' + (c.haH || c.isToday ? "700" : "400") + ';line-height:1.2;">' + c.hebLetter + '</div>' +
        '<div style="font-size:0.6rem;color:#475569;line-height:1;margin-bottom:1px;">' + c.gregDay + '</div>' +
        dot +
        '</div>';
    });

    gridEl.innerHTML = html;
  }

  window._hilOpenFromCal = function (offset) {
    var cm = document.getElementById("hilulot-cal-modal");
    if (cm) cm.remove();
    window.openHilulotModal(offset);
  };

  window.openHilulotCalendar = function () {
    var old = document.getElementById("hilulot-cal-modal");
    if (old) old.remove();

    if (!_calRefDate) _calRefDate = new Date();

    var modal = document.createElement("div");
    modal.id = "hilulot-cal-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText = "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);padding:1rem;";

    var DOW_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

    var dowHtml = DOW_LABELS.map(function (l) {
      return '<div style="text-align:center;font-size:0.72rem;color:#64748b;font-weight:600;">' + l + '</div>';
    }).join("");

    modal.innerHTML =
      '<div style="' +
        'background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);' +
        'border:1px solid rgba(139,92,246,0.35);border-radius:1.5rem;' +
        'padding:1.5rem;max-width:380px;width:100%;' +
        'max-height:90vh;overflow-y:auto;position:relative;' +
        'box-shadow:0 25px 60px rgba(0,0,0,0.6);">' +
        '<button id="hil-cal-close" ' +
          'style="position:absolute;top:1rem;left:1rem;background:rgba(255,255,255,0.1);' +
          'border:none;border-radius:50%;width:2rem;height:2rem;cursor:pointer;' +
          'color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"' +
          ' aria-label="סגור">✕</button>' +
        '<div style="text-align:center;margin-bottom:1rem;">' +
          '<div style="font-size:1.5rem;margin-bottom:0.3rem;">📅</div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;color:#e2e8f0;margin:0 0 0.2rem;letter-spacing:0.01em;">לוח הילולות</h2>' +
          '<p style="font-size:0.75rem;color:#64748b;margin:0;">לחץ על יום מסומן לצפייה בהילולות</p>' +
        '</div>' +
        // Month nav — direction:ltr so ‹ is left (prev), › is right (next)
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
          'margin-bottom:0.4rem;direction:ltr;">' +
          '<button onclick="window._hilCalNav(-1)" ' +
            'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
            'color:#c4b5fd;border-radius:0.6rem;padding:0.3rem 0.8rem;cursor:pointer;font-size:1.2rem;" ' +
            'title="חודש קודם">‹</button>' +
          '<div id="hil-cal-month-title" style="color:#c4b5fd;font-weight:700;font-size:1rem;direction:rtl;"></div>' +
          '<button onclick="window._hilCalNav(1)" ' +
            'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
            'color:#c4b5fd;border-radius:0.6rem;padding:0.3rem 0.8rem;cursor:pointer;font-size:1.2rem;" ' +
            'title="חודש הבא">›</button>' +
        '</div>' +
        '<div style="text-align:center;margin-bottom:0.45rem;">' +
          '<button onclick="window._hilCalToday()" ' +
            'style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);' +
            'color:#fbbf24;border-radius:0.6rem;padding:0.18rem 0.9rem;cursor:pointer;' +
            'font-size:0.78rem;font-weight:600;" title="חזור להיום">היום</button>' +
        '</div>' +
        '<p id="hil-cal-greg-month" style="text-align:center;font-size:0.72rem;color:#475569;' +
          'margin:0 0 0.6rem;direction:ltr;"></p>' +
        // Day-of-week header
        '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px;">' +
          dowHtml +
        '</div>' +
        // Grid
        '<div id="hil-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;"></div>' +
        // Legend
        '<div style="display:flex;gap:1rem;justify-content:center;margin-top:0.85rem;flex-wrap:wrap;">' +
          '<div style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:#94a3b8;">' +
            '<div style="width:10px;height:10px;border-radius:2px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);"></div>' +
            'יום הילולה' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:#94a3b8;">' +
            '<div style="width:10px;height:10px;border-radius:2px;background:rgba(251,191,36,0.25);border:1px solid rgba(251,191,36,0.6);"></div>' +
            'היום' +
          '</div>' +
        '</div>' +
        // Back button
        '<div style="text-align:center;margin-top:1rem;">' +
          '<button id="hil-cal-back" ' +
            'style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);' +
            'color:#94a3b8;border-radius:0.75rem;padding:0.4rem 1rem;cursor:pointer;font-size:0.82rem;">' +
            '← חזרה להילולות' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    renderCalendarBody(_calRefDate);

    window._hilCalToday = function () {
      _calRefDate = new Date();
      renderCalendarBody(_calRefDate);
    };

    window._hilCalNav = function (delta) {
      var first = getFirstOfHebMonth(_calRefDate);
      if (delta > 0) {
        var len = getHebMonthLength(first);
        var next = new Date(first);
        next.setDate(first.getDate() + len);
        next.setHours(0, 0, 0, 0);
        _calRefDate = next;
      } else {
        var prev = new Date(first);
        prev.setDate(first.getDate() - 1);
        prev.setHours(0, 0, 0, 0);
        _calRefDate = prev;
      }
      renderCalendarBody(_calRefDate);
    };

    modal.querySelector("#hil-cal-close").addEventListener("click", function () { modal.remove(); });
    modal.querySelector("#hil-cal-back").addEventListener("click", function () {
      modal.remove();
      window.openHilulotModal(_dayOffset);
    });
    modal.addEventListener("click", function (e) { if (e.target === modal) modal.remove(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { modal.remove(); document.removeEventListener("keydown", esc); }
    });
    modal.querySelector("#hil-cal-close").focus();
  };

})();


// ═══════════════════════════════════════════════════════
// ✦  DIVREI TORAH – מועד הבא פופ-אפ
// ═══════════════════════════════════════════════════════
(function () {

  var DT = {
    "שבועות": [
      [
        {title:"נעשה ונשמע – קבלת התורה",source:"הבעל שם טוב",text:"כשאמרו ישראל 'נעשה ונשמע' הקדימו עשייה להבנה, ולימדונו שהדרך לחכמה היא דווקא על ידי המעשה. האדם שמקיים מצוות בשמחה ובאהבה, עוד לפני שהבין אותן לגמרי – זוכה אחר כך להבין אותן מבפנים. כמו שאמר שלמה המלך: 'לב חכם לימינו' – הלב מוביל אל החכמה.",icon:"📜"},
        {title:"מגילת רות ותיקון הנשמה",source:"הגאון מווילנא",text:"מנהג ישראל לקרוא מגילת רות בחג השבועות. רות המואבייה שאמרה 'עמך עמי ואלוהיך אלוהי', מלמדת שקבלת התורה אינה רק מחויבות – היא בחירה מאהבה. כשם שרות בחרה בעמה של נעמי, כך כל יהודי בחג השבועות מחדש את בחירתו בתורה ובה' מתוך אהבה עמוקה ואמיתית.",icon:"🌾"},
        {title:"הספירה – הכנה למתן תורה",source:"הרמח\"ל",text:"ארבעים ותשעה ימי ספירת העומר הם מסע של תיקון המידות. כל שבוע מייצג מידה: אהבה, גבורה, תפארת, נצח, הוד, יסוד, ומלכות. כשמגיע חג השבועות, האדם שעמל על עצמו כל שבעת השבועות – מוכן לקבל את התורה בטהרה וקדושה, כפי שהיה במעמד הר סיני.",icon:"✨"}
      ],
      [
        {title:"הר סיני – למה דווקא מדבר?",source:"חז\"ל – מסכת סוטה",text:"אמרו חז\"ל: 'למה ניתנה תורה במדבר סיני?' – כדי ללמדנו שהתורה ניתנת לאדם שמפנה את עצמו ועושה עצמו כמדבר, הפקר לכל. מי שמגביה עצמו אינו יכול לקבל. אך מי שמשפיל עצמו ומפנה לבו – אליו שורה השכינה ועליו ניתנת התורה.",icon:"⛰️"},
        {title:"מתן תורה – חתונה בין ה' לישראל",source:"רש\"י",text:"בפסוק 'ויצא משה לקראת האלוהים' – פירש רש\"י שמשה יצא כשושבין לקראת חתן. הר סיני הוא כחופה, ישראל כלה וה' כחתן. ממעמד זה נולד קשר נצחי בין ה' לעמו. כל שנה בשבועות אנחנו מחדשים את ה'חתונה' הזאת – קבלת עול מלכות שמים מתוך אהבה.",icon:"💍"},
        {title:"תלמוד תורה כנגד כולם",source:"הרמב\"ם",text:"כתב הרמב\"ם: 'תלמוד תורה כנגד כולם' – לימוד התורה שקול כנגד כל שאר המצוות. ובחג השבועות, שהוא זמן מתן תורתנו, מקבלים כוח מיוחד ללמוד. הלילה הראשון – ליל שבועות – מסורת ישראל ללמוד כל הלילה, לא לישון, מתוך שמחה וציפייה לקבלת התורה.",icon:"📚"}
      ]
    ],
    "ראש השנה": [
      [
        {title:"יום הדין – יום הרחמים",source:"הרב קוק זצ\"ל",text:"ראש השנה הוא יום הדין, אך גדולי ישראל לימדונו שהדין הוא חסד עמוק. כשהקדוש ברוך הוא שופט את האדם, הוא מביט על מלוא ערכו ועל כל הטוב שבו. תקיעת השופר מעוררת את הנשמה משנת חיי השגרה ומזכירה לנו: אנחנו בנים לה' אלוהינו.",icon:"🎺"},
        {title:"זכרנו לחיים – מהות החיים",source:"השפת אמת",text:"אנחנו מבקשים 'זכרנו לחיים, מלך חפץ בחיים'. מהם אותם חיים? לא רק חיי הגוף, אלא חיי הנשמה. החיים האמיתיים הם חיים של משמעות, של קשר לה', של קיום מצוות מאהבה. ראש השנה הוא הזמן לשאול: האם אני חי חיים של אמת? האם המעשים שלי מביאים חיים לעולם?",icon:"📖"},
        {title:"תשובה – חזרה אל עצמנו",source:"רבי נחמן מברסלב",text:"אמר רבי נחמן: 'אם אתה מאמין שיכולים לקלקל, תאמין שיכולים לתקן'. ראש השנה הוא ראש – ראש כל השנה. כמו שהראש מנהל את הגוף, כך ימים אלה מגדירים את כל השנה. כל תשובה שנעשה עכשיו, כל החלטה טובה – תשפיע על כל ימות השנה.",icon:"🕯️"}
      ],
      [
        {title:"מלוך על כל העולם",source:"תפילת ראש השנה – מוסף",text:"בתפילת ראש השנה אנחנו מבקשים 'מלוך על כל העולם כולו בכבודך'. ראש השנה הוא יום הכתרת המלך. כשם שמלך בשר ודם מולך בהסכמת העם – כך ה' ממתין לנו שנכתיר אותו. כל תקיעת שופר היא הכרזה: 'ה' מלך, ה' מלך, ה' ימלוך לעולם ועד'.",icon:"👑"},
        {title:"עקידת יצחק – כוח הסרבנות לרע",source:"בעל התניא",text:"בראש השנה קוראים בתורה את עקידת יצחק. אברהם אבינו הגיע לדרגה שהיה מוכן לוותר על הכי יקר לו. ה' לא רצה שישחט – הוא רצה לראות את הנכונות. כך כל אחד מאתנו בראש השנה: לא צריכים להקריב הכל – צריכים לשאול את עצמנו: האם אני מוכן?",icon:"🔥"},
        {title:"שופר – קול הנשמה",source:"הרמב\"ם",text:"כתב הרמב\"ם: 'אף על פי שתקיעת שופר גזירת הכתוב – יש בה רמז. כלומר: עורו ישנים משנתכם ונרדמים הקיצו מתרדמתכם'. השופר אינו רק מצווה – הוא קול הנשמה הפנימית שצועקת: חזור! התעורר! השנה הזאת יכולה להיות שונה.",icon:"🎺"}
      ]
    ],
    "יום כיפור": [
      [
        {title:"כוח הוידוי",source:"הרמב\"ם",text:"כתב הרמב\"ם שעיקר התשובה היא הוידוי בפה. 'אנא ה' חטאתי, עויתי, פשעתי לפניך'. כשאדם מוציא את החטא מלבו ומדבר אותו בפיו, הוא מתפרד ממנו. הוידוי הוא לא רק הכרה בעבר – הוא הצהרת כוונה לעתיד. 'ולא אשוב לדבר הזה עוד' – אלו המילים שמשנות את האדם.",icon:"✨"},
        {title:"נשמה טהורה",source:"הבעל שם טוב",text:"ביום הכיפורים כולנו כמו מלאכים. אין אכילה, אין שתייה – הגוף נדחק לצד והנשמה מאירה. הבעל שם טוב לימד שגם בחוטא הגדול ביותר יש ניצוץ קדוש שלא ניתן לכבותו לעולם. יום כיפור הוא היום שאותו הניצוץ מתגלה, וכולנו – גדולים וקטנים – עומדים לפני ה' בטהרת הנשמה.",icon:"🌟"},
        {title:"ה' מוחל – לא רק סולח",source:"הספורנו",text:"יש הבדל בין 'סליחה' ל'מחילה'. הסולח מוותר על עונש אך הפגיעה נשארת בלב. המוחל – מוחה לגמרי, כאילו לא היה. הקדוש ברוך הוא ביום הכיפורים לא רק סולח – הוא מוחל. 'כי ביום הזה יכפר עליכם לטהר אתכם, מכל חטאתיכם לפני ה' תטהרו'. הטהרה היא מחיקה מוחלטת.",icon:"💫"}
      ],
      [
        {title:"נעילה – שעת הדחיפות",source:"השפת אמת",text:"תפילת נעילה היא השעה האחרונה של יום כיפור – שעה שבה שערי שמים נסגרים. 'נעילה' מלשון נעילת השערים. אמר השפת אמת: דווקא בדקה האחרונה, כשהאדם מרגיש שהזמן נגמר – הוא מתפלל מעמקי הלב. לפעמים הצעקה האחרונה חזקה מכל שאר התפילות.",icon:"🚪"},
        {title:"חמישה עינויים – חמש דרגות",source:"הרב סולובייצ'יק",text:"חמישה עינויים ביום כיפור: איסור אכילה, שתייה, רחיצה, סיכה, נעילת הסנדל ותשמיש המיטה. כל עינוי מנתק אותנו מדרגה אחת של גשמיות. יום כיפור הוא יום שבו אנחנו חיים כנשמות טהורות. בכך מדמים אנחנו את עצמנו למלאכים ומתחברים לטהרת הבריאה.",icon:"⚪"},
        {title:"כל נדרי – שחרור הנפש",source:"הרב עובדיה יוסף זצ\"ל",text:"'כל נדרי' – נוסח עתיק שבו אנחנו מבקשים להשתחרר מנדרים שלא קיימנו. הכוונה הפנימית עמוקה יותר: כל הכבלים שכבלנו את נשמתנו בשנה שעברה – אנחנו מבקשים להשתחרר מהם. יום כיפור פותח בשחרור, כדי שנוכל להתחיל ברורים ונקיים.",icon:"🌿"}
      ]
    ],
    "סוכות": [
      [
        {title:"ארבעת המינים – אחדות ישראל",source:"ספר הזוהר",text:"ארבעת המינים מסמלים ארבעה סוגי יהודים. האתרוג – טעם וריח, תורה ומעשים. הלולב – טעם בלי ריח, תורה בלי מעשים. ההדס – ריח בלי טעם, מעשים בלי תורה. הערבה – בלי טעם ובלי ריח. כשמחברים אותם יחד, אנחנו אומרים: 'כולנו יחד, עם כל ההבדלים ביננו – אנחנו אחד לפני ה''.",icon:"🌿"},
        {title:"הסוכה – צל האמונה",source:"רבי שלמה קרליבך",text:"הסוכה היא הבית הקדוש ביותר. לא כי היא חזקה – היא שברירית. לא כי היא בטוחה – הכוכבים נראים דרך גגה. הסוכה מלמדת שהביטחון האמיתי אינו בקירות עבים אלא באמונה. כשיושבים בסוכה, אנחנו אומרים: 'ה', אני בוטח בך, לא בחומות שלי'.",icon:"🍂"},
        {title:"זמן שמחתנו",source:"החיי אדם",text:"סוכות נקרא 'זמן שמחתנו' יותר מכל חג אחר. כי אחרי ראש השנה ויום כיפור – ימי הדין והכפרה – אנחנו יוצאים זכאים ושמחים. השמחה של סוכות היא שמחת הזיכוי. אדם שיצא מבית הדין זכאי – כמה הוא שמח! כך ישראל אחרי הימים הנוראים – שמחים בידיעה שה' מחל להם.",icon:"🎊"}
      ],
      [
        {title:"ושמחת בחגך – שמחה שלמה",source:"הרמב\"ם",text:"כתב הרמב\"ם שמצוות שמחה בחג כוללת גם לשמח עניים, יתומים ואלמנות. שמחה שהיא רק עבור עצמנו – אינה שלמה. הקדוש ברוך הוא שמח כשרואה שכל ברואיו שמחים. סוכות מלמד: השמחה האמיתית היא שמחה משותפת, שמחה שמכלילה את כולם.",icon:"🎉"},
        {title:"שבעה אושפיזין – אורחים עליונים",source:"הזוהר הקדוש",text:"מסורת הקבלה: בכל יום מסוכות נכנס לסוכה אורח עליון אחד – אברהם, יצחק, יעקב, משה, אהרן, יוסף, דוד. האושפיזין מלמדים אותנו שהסוכה אינה רק בית גשמי – היא מחברת אותנו לנשמות הגדולות של ישראל. כשיושבים בסוכה – יושבים בחברת אבות האומה.",icon:"⭐"},
        {title:"ניסוך המים – שמחת בית השואבה",source:"גמרא סוכה",text:"'מי שלא ראה שמחת בית השואבה לא ראה שמחה מימיו' – כך אמרו חז\"ל. בבית המקדש היו שופכים מים על המזבח בסוכות. המים מסמלים את רוח הקודש שיורדת מלמעלה. כשאדם שמח בחג מתוך אמונה ואהבה – הוא מושך עליו שפע רוחני מלמעלה.",icon:"💧"}
      ]
    ],
    "שמחת תורה": [
      [
        {title:"הסוף הוא ההתחלה",source:"בעל התניא",text:"ביום שמחת תורה מסיימים את הפרשה האחרונה – 'וזאת הברכה' – ומיד מתחילים 'בראשית'. התורה אין לה סוף. ברגע שגומרים – מתחילים שוב. הרב מלובביץ לימד: 'תורה היא כמו מעגל, ואין לה ראש ואין לה סוף, כי היא עצמותו של ה' שהוא אין סוף'.",icon:"📜"},
        {title:"הריקוד עם התורה",source:"רבי לוי יצחק מברדיצ'ב",text:"כל השנה אנחנו לומדים תורה. בשמחת תורה – אנחנו רוקדים איתה. אמר רבי לוי יצחק: כשלומדים תורה, השכל מתחבר לתורה. אבל כשרוקדים עם ספר התורה – כל הגוף, כל הנשמה מתחברים. הריקוד הוא דרגת אחדות עמוקה אפילו יותר מהלימוד עצמו.",icon:"🎊"}
      ],
      [
        {title:"חתן תורה וחתן בראשית",source:"מנהג ישראל",text:"שני חתנים מרכזיים בשמחת תורה: 'חתן תורה' – המסיים את הסיום, ו'חתן בראשית' – המתחיל מחדש. שניהם מכובדים ברוב עם. יש בזה מסר עמוק: הן הסיום והן ההתחלה הם כבוד. בחיים – גם להגיע לסוף שלב, וגם לפתוח דף חדש – שניהם ראויים לחגיגה.",icon:"🎉"},
        {title:"כל הנערים – ילדי ישראל ותורה",source:"חז\"ל",text:"בשמחת תורה נהוג להעלות לתורה 'כל הנערים' – כל הילדים יחד, תחת טלית אחת. זה נוהג ייחודי ונדיר. הוא מסמל שהתורה שייכת לכולם, גדולים כקטנים. 'מורשה קהילת יעקב' – התורה היא ירושת כל קהילות ישראל, ובכל הדורות. הילדים הם ערבאי ישראל.",icon:"👶"}
      ]
    ],
    "חנוכה": [
      [
        {title:"פך השמן – אור שאינו כבה",source:"השפת אמת",text:"בפך השמן הקטן היה חתום חותם כהן גדול. גם כשכל השמן טמא – נשאר פך קטן, חתום וטהור. כך בכל יהודי: גם בתוך הגלות, גם בתוך הטומאה – יש נקודה פנימית חתומה, שלא ניתן לגעת בה לעולם. חנוכה מגלה את אותה הנקודה הקדושה שבפנים.",icon:"🕎"},
        {title:"פרסומי ניסא – להאיר את החושך",source:"הרמב\"ם",text:"מצוות החנוכה היא 'פרסומי ניסא'. לכן מדליקים בפתח הבית, מבחוץ, במקום הגבוה ביותר. האור של ישראל אינו רק לנו – הוא לכל העולם. כל אחד מאיר בנקודה שלו, ויחד אנחנו מאירים את החשכה. 'נר ה' נשמת אדם' – כל נשמה היא נר.",icon:"🕯️"},
        {title:"מעטים מול רבים",source:"הבעל שם טוב",text:"הנס של חנוכה: מעטים נגד רבים, טמאים נגד טהורים. אמר הבעל שם טוב: 'חנוכה' מלשון 'חינוך' ו'חנוכת הבית'. כל יהודי יכול לחנוך את סביבתו, להדליק נרות אמונה אפילו בחשכה הגדולה ביותר. נר קטן אחד מבטל חשכה גדולה.",icon:"✨"}
      ],
      [
        {title:"מוסיף והולך – צמיחה מתמדת",source:"בית הלל ובית שמאי",text:"בית שמאי ובית הלל נחלקו: האם להתחיל מ-8 נרות ולחסר, או מ-1 ולהוסיף? הלכה כבית הלל – 'מוסיף והולך'. האור גדל בכל יום. הלמידה: בחיי הרוח אין עמידה במקום. כל יום צריך להוסיף עוד קצת אור, עוד קצת ידע, עוד קצת אהבה.",icon:"📈"},
        {title:"הנרות הללו קודש הם",source:"מסכת סופרים",text:"'הנרות הללו קודש הם ואין לנו רשות להשתמש בהם'. נרות חנוכה אינם לשימוש – הם לראייה בלבד. זו מסירת מסר: יש דברים בחיים שאינם כלים לצרכינו – הם קדושים בפני עצמם. אמונה, תפילה, קשר לה' – אלה אינם אמצעים, הם ערכים בפני עצמם.",icon:"🌟"},
        {title:"אנטיוכוס והיוונות",source:"הרב סולובייצ'יק",text:"יוון לא ניסתה להרוג יהודים גופנית – היא ניסתה להפוך אותם ליוונים. 'להשכיחם תורתך ולהעבירם מחוקי רצונך'. הסכנה הייתה תרבותית. חנוכה מציין את ניצחון הזהות היהודית על ההתבוללות. בכל דור שבו התרבות החיצונית מאיימת על ייחודנו – אנחנו מדליקים שוב.",icon:"🛡️"}
      ]
    ],
    "פורים": [
      [
        {title:"נהפוך הוא – הסתר פנים",source:"הגר\"א",text:"שם 'אסתר' מלשון 'הסתר'. כל המגילה – ה' לא מוזכר בה אפילו פעם אחת. זה לא במקרה: נס פורים הוא נס נסתר, טבעי לכאורה. ה' מנהל את ההיסטוריה מאחורי הקלעים. גם כשאיננו רואים את ה' – הוא שם. גם בחשכה הגדולה ביותר ישנו הסיפור האלוקי שמתרחש.",icon:"👑"},
        {title:"מחיית עמלק – מחיית הספקות",source:"הבעל שם טוב",text:"עמלק מסמל את הספקנות – גימטריה של 'עמלק' שווה ל'ספק'. מלחמת עמלק היא המלחמה בפנימיות, נגד הקרירות ונגד 'מה זה משנה'. פורים הוא היום שנלחמים בספקות ומתחברים לאמונה שלמה: 'קיימו וקבלו היהודים' – קיבלו מחדש, מרצון, את מה שקיבלו בהר סיני.",icon:"🎭"},
        {title:"משתה ושמחה",source:"רבי נחמן מברסלב",text:"מצווה לשתות בפורים עד שלא ידע. אמר רבי נחמן: בדרגה הגבוהה ביותר, האדם רואה שהכל – אפילו ה'ארור' – הוא חלק מהתכנית האלוקית. 'ונהפוך הוא' – מה שנראה כרע, נהפך לטוב. השמחה של פורים היא שמחת האמת: הכל בסדר, הכל מנוהל מלמעלה.",icon:"🎉"}
      ],
      [
        {title:"ארבע מצוות פורים",source:"הרמב\"ם",text:"ארבע מצוות ייחודיות לפורים: מקרא מגילה, משלוח מנות, מתנות לאביונים, ומשתה ושמחה. שלוש מהן מכוונות כלפי אחרים – לתת, לשתף, לשמח. רק אחת כלפי עצמנו. פורים מלמד: השמחה שלמה רק כשהיא משותפת. 'ושלוח מנות איש לרעהו' – אחד לאחד.",icon:"🎁"},
        {title:"אסתר המלכה – כוח הנשמה הנסתרת",source:"הרב מרדכי אלון",text:"אסתר הסתירה את מוצאה בהוראת מרדכי. אך בשעת האמת, כשהסכנה גדלה, היא גילתה: 'אשר אני יהודייה'. הנסתר לא נעלם – הוא שמור עמוק בפנים. בפורים אנחנו לומדים: גם כשאנחנו נראים כחלק מהסביבה החיצונית – הזהות הפנימית שמורה וקיימת.",icon:"⭐"},
        {title:"הפיל גורל – בחירה אלוקית",source:"מגילת אסתר",text:"המן הפיל גורל ('פור') לבחור את יום ההשמדה. הוא חשב שהמזל מנהל הכל. אך הגורל שהפיל הפך לרעתו. זהו לקח פורים: מי שמאמין שהכל מקרה – טועה. מאחורי 'המקרה' עומדת השגחה אלוקית. לכן נקרא 'פורים' – על שם הגורל שנהפך.",icon:"🎲"}
      ]
    ],
    "פסח": [
      [
        {title:"יציאת מצרים – לידה מחדש",source:"הרמח\"ל",text:"'מצרים' מלשון 'מצר' – צרות ומגבלות. יציאת מצרים אינה רק אירוע היסטורי – היא דרך חיים. 'בכל דור ודור חייב אדם לראות את עצמו כאילו יצא ממצרים'. בכל ליל הסדר אנחנו שוב יוצאים – מהמגבלות שלנו, מהפחדים שלנו, מהמצרים הפנימי שלנו.",icon:"🌊"},
        {title:"המצה – לחם החירות",source:"הגדה של פסח",text:"המצה נקראת 'לחם עוני' – לחם הצרות, וגם לחם החירות. אותה מצה, שני שמות הפוכים. זה סוד הגאולה: מתוך העוני הגדול ביותר יוצאת הגאולה הגדולה ביותר. 'ממעמקים קראתיך ה'' – ככל שהמקום עמוק יותר, כך הקריאה מגיעה גבוה יותר. חירות אמיתית נולדת מתוך הכבלים.",icon:"🍞"},
        {title:"ארבעת הבנים",source:"הבעל שם טוב",text:"אמר הבעל שם טוב: ארבעת הבנים אינם ארבעה ילדים שונים – הם ארבעה מצבים שכל אחד מאתנו עובר. יש בנו חכם, רשע, תם ושאינו יודע לשאול. הגדה מלמדת: ענה לכל בן – לכל חלק שבתוכך. גם לרשע שבתוכך – אל תכחיד אותו. הגאולה כוללת את כל חלקי הנפש.",icon:"📖"}
      ],
      [
        {title:"עשר מכות – שבירת גאוות פרעה",source:"הרב שמשון רפאל הירש",text:"עשר המכות לא באו רק לשחרר את ישראל – באו לשבור את האמונה המצרית שפרעה הוא אל. כל מכה כוונה לאל מצרי אחד. 'ובכל אלהי מצרים אעשה שפטים' – ה' הראה שאין עוד מלבדו. פסח הוא חג של הכרה: ה' הוא השולט בטבע, בהיסטוריה, בכל.",icon:"🌿"},
        {title:"ספר ההגדה – חובת הסיפור",source:"גמרא פסחים",text:"'מצווה לספר ביציאת מצרים'. לא רק לזכור – לספר. לא רק לדעת – לחוות. ההגדה בנויה כסיפור דרמטי: עבדים היינו, ועכשיו בני חורין. כל פסח מחדש אנחנו עוברים מעבדות לחירות, לא כסיפור של עבר אלא כחוויה של ההווה. 'כאילו הוא יצא'.",icon:"📜"},
        {title:"ארבע כוסות – כנגד ארבע לשונות גאולה",source:"ירושלמי פסחים",text:"ארבע כוסות של יין כנגד ארבע לשונות גאולה: 'והוצאתי, והצלתי, וגאלתי, ולקחתי'. כל כוס – שלב אחר בדרך לחירות. אין קפיצה לסוף. הגאולה היא תהליך: יציאה ממצב הרע, הצלה מהסכנה, גאולה ממהות העבדות, ולבסוף – לקיחה להיות עם ה'. כך גם בחיינו.",icon:"🍷"}
      ]
    ],
    "לג בעומר": [
      [
        {title:"רשב\"י והזוהר הקדוש",source:"הזוהר הקדוש",text:"ביום הסתלקותו גילה רבי שמעון בר יוחאי את סודות הקבלה לתלמידיו. אמר: 'בחיי לא נתתי לכם – במותי אני נותן לכם'. יום ל\"ג בעומר הוא היום שבו הפנימיות של התורה ירדה לעולם. מדורות האש שמדליקים מסמלים את אור האמת שאינו כבה לעולם.",icon:"🔥"},
        {title:"עצירת המגיפה – כוח האהבה",source:"המשנה ברורה",text:"תלמידי רבי עקיבא מתו בימי הספירה כי לא נהגו כבוד זה בזה. ביום ל\"ג בעומר פסקה המגיפה. מדוע בדיוק ביום הזה? כי ביום הזה התחילו לנהוג כבוד זה בזה. הלמידה הגדולה: לא הידע הוא העיקר – אלא היחס לאחר. 'ואהבת לרעך כמוך' – כלל גדול בתורה.",icon:"🕯️"}
      ],
      [
        {title:"ל\"ג בעומר – יום שמחה בספירה",source:"הרמ\"א",text:"ימי הספירה הם ימי חצי אבל, אך ל\"ג בעומר הוא הפסקה של שמחה. פוסקים רבים סוברים שכאן פסקה מגיפת תלמידי רבי עקיבא. לכן נוהגים שמחה, קשתות, יציאה לטבע. יש בזה מסר: גם בתוך תקופות קשות, יש מקום לנקודת אור, לנשימה של שמחה.",icon:"🌿"},
        {title:"רבי שמעון – גיבור הפנימיות",source:"מאמר הזוהר",text:"רבי שמעון בר יוחאי ותלמידיו הסתתרו במערה שנים עשר שנה ולמדו תורה. יצאו פעם אחת ושרפו בעיניהם כל מה שראו – חזרו למערה. יצאו שנית ויכלו לסבול את העולם. הלמידה: אחרי עומק הקדושה, האדם יכול לחיות בעולם ולהאיר אותו – לא לברוח ממנו.",icon:"🕯️"}
      ]
    ],
    "ראש חודש": [
      [
        {title:"חידוש הלבנה – חידוש הנשמה",source:"הבעל שם טוב",text:"הלבנה מתחדשת בכל חודש. היא פוחתת עד שנעלמת לגמרי – ואז מתחדשת. כך נשמת האדם. יש ימים שהאור בה כהה, שהיא מרגישה ריקה. אבל ראש חודש מלמד: זה לא סוף – זה תחילת חידוש. 'עתידים ישראל שיתחדשו כמותה' – הבטחת הנצח.",icon:"🌙"},
        {title:"ראש חודש – חג לנשים",source:"הפרי מגדים",text:"ראש חודש נקרא 'חג הנשים'. כשחטאו ישראל בעגל הזהב, הנשים לא נתנו תכשיטיהן. בשכר זה קיבלו את ראש חודש כחצי יום טוב. הנשים מייצגות את הקשר הפנימי לה', שאינו נשבר לעולם. ראש חודש הוא חידוש הקשר, חידוש האמונה.",icon:"✨"}
      ],
      [
        {title:"קידוש הלבנה – עדות לאמונה",source:"גמרא סנהדרין",text:"'מי שמברך על הלבנה בזמנה – כאילו מקבל פני שכינה'. קידוש לבנה הוא מצווה שנעשית בלילה, בחוץ, תחת שמי הלילה. האדם עומד מול השמים ומכריז: אני מאמין שיש מי שמנהל את העולם. הלבנה היא שעון הקדוש ברוך הוא – מחזורית, נאמנה, מדויקת.",icon:"🌙"},
        {title:"ראש חודש – ראש לחידוש",source:"הרב אברהם יצחק הכהן קוק",text:"אמר הרב קוק: הלבנה מסמלת את כנסת ישראל – שגם כשהיא בשפל, היא יודעת שתתחדש. העם היהודי חי לפי הלוח העברי, לפי הלבנה. בכל ראש חודש אנחנו חוגגים את הנצח של ישראל: 'לא יכחד שם ישראל' – כמו הלבנה שאף פעם לא נעלמת לצמיתות.",icon:"✡️"}
      ]
    ],
    "שבת": [
      [
        {title:"השבת – מעין עולם הבא",source:"הרמח\"ל",text:"שבת היא 'מעין עולם הבא'. ששת ימי השבוע אנחנו עמלים ובונים. בשבת אנחנו שובתים ומקבלים נשמה יתרה. הנשמה היתרה של שבת היא טעם של שלמות, של שלווה, של 'ויכולו'. אדם שמכניס שבת כהלכתה – טועם בפה מה שלא ניתן לתאר במילים.",icon:"🕯️"}
      ],
      [
        {title:"שמור וזכור – שני עמודי השבת",source:"ספר החינוך",text:"בלוחות הראשונות נכתב 'זכור את יום השבת' ובשניות 'שמור את יום השבת'. 'זכור' – המצוות העשה, קידוש, הבדלה, שמחה. 'שמור' – המצוות לא תעשה, השביתה. שני הצדדים יחד יוצרים שלמות. לא רק להימנע מלאכה – אלא למלא את השבת בקדושה ושמחה פנימית.",icon:"🕯️"}
      ]
    ],
    "תשעה באב": [
      [
        {title:"חורבן הבית – מה חסר לנו",source:"הנצי\"ב מוולוז'ין",text:"הנצי\"ב אמר שבית המקדש נחרב בגלל שנאת חינם – שנאה בין יהודים שהיא 'חינם', ללא סיבה אמיתית. לכן הגאולה תבוא על ידי אהבת חינם. בתשעה באב אנחנו לא רק בוכים על מה שאבד – אנחנו שואלים: מה אני יכול לתקן ביחסי עם האחר?",icon:"🏛️"},
        {title:"קינות – שפת האבל",source:"ספר איכה",text:"'איכה ישבה בדד העיר רבתי עם'. ירמיהו הנביא בכה על חורבן ירושלים. הקינות שקוראים בתשעה באב הן שיר האבל של ישראל. אבל אמיתי אינו ייאוש – הוא הכרה שמשהו יקר אבד, ותשוקה לשיבה. 'שובנו ה' אליך ונשובה' – אחרי האבל בא הגעגוע לתיקון.",icon:"😢"}
      ],
      [
        {title:"לידת המשיח בתשעה באב",source:"גמרא ירושלמית",text:"מסורת ישראל: המשיח נולד בתשעה באב, ביום החורבן. מתוך האפלה הגדולה ביותר – נולד האור הגדול ביותר. בית המקדש נחרב, וביום אותו יום מונחת הגאולה. זהו סוד ישראל: אנחנו לא מסיימים באסון – אנחנו מתחילים ממנו. מן המצר קראתי – ואז: ענני במרחב יה.",icon:"🌅"},
        {title:"חמישה חורבנות ביום אחד",source:"משנה תענית",text:"חמישה דברים קרו לאבותינו בשבעה עשר בתמוז ובתשעה באב. חז\"ל אמרו: 'ייקבע יום זה לדורות'. מדוע לזכור? כי זכרון הכאב שומר אותנו מחזרה על הטעויות. כל דור שלומד מה גרם לחורבן – ומתקן את עצמו – הוא דור שמקרב את הגאולה.",icon:"📜"}
      ]
    ],
    "צום גדליה": [
      [
        {title:"מות גדליה – שרידי ישראל",source:"ספר מלכים ב' / ירמיהו",text:"אחרי חורבן בית ראשון, נשאר גדליה בן אחיקם כנציג יהודי בארץ. הוא נרצח בידי יהודים אחרים. חז\"ל קבעו צום כי מותו הוא כחורבן בית המקדש – כיוון שכיבה את האחרית שנשארה. הלמידה: שנאת אחים, גם אחרי חורבן, ממשיכה להחריב. אחדות ישראל היא עמוד חיינו.",icon:"🕯️"}
      ],
      [
        {title:"צום גדליה – אזהרה לדורות",source:"הרמב\"ם",text:"כתב הרמב\"ם שצום גדליה מלמד שאבדן נפשות ישראל חמור כאבדן בית המקדש. כשגדליה נהרג – גלו השאריות לגלות ונגמר כל שריד מיהודה. הצום הוא תזכורת שחיי אדם מישראל יקרים עד אין ערוך. 'כל המציל נפש אחת מישראל – מעלה עליו הכתוב כאילו קיים עולם מלא'.",icon:"💧"}
      ]
    ],
    "צום אסתר": [
      [
        {title:"תענית אסתר – עם שמתאחד בסכנה",source:"מגילת אסתר",text:"'לכי כנסי את כל היהודים... וצומו עלי'. אסתר ביקשה שכל העם יצום עבורה לפני שתכנס לפגוש את המלך. הצום המשותף הפך את העם לגוף אחד. כשישראל מאוחדים – הם חזקים. צום אסתר מלמד: תפילה ועמידה לשעת הסכנה – לא לבד, אלא כעם שלם.",icon:"👑"}
      ],
      [
        {title:"לפני הנס – ההכנה",source:"הרב שמשון רפאל הירש",text:"צום אסתר הוא הכנה לפורים. לפני השמחה הגדולה – יש רגע של כובד, של חשבון נפש, של תפילה. זה לימוד גדול: שמחה אמיתית אינה ניתנת לאדם שלא עמד מולה ברצינות. אסתר לא נכנסה למלך בקלות ראש – היא התכוננה. כך אנחנו: לפני שמחת פורים – כובד הצום.",icon:"✡️"}
      ]
    ],
    "שבעה עשר בתמוז": [
      [
        {title:"פרצה בחומה – תחילת הסוף",source:"משנה תענית",text:"בשבעה עשר בתמוז נפרצה חומת ירושלים בידי האויב. מאותו רגע החל הקץ – שלושה שבועות שהסתיימו בחורבן. הצום מציין את 'תחילת הסוף'. יש בזה לימוד: כשחומה נפרצת – גם רוחנית – צריך להזדרז ולתקן. הפרצה הקטנה היום היא החורבן הגדול של מחר.",icon:"🏛️"}
      ],
      [
        {title:"חמישה אסונות ביום אחד",source:"גמרא תענית",text:"חמישה דברים קרו בי\"ז בתמוז: נשתברו הלוחות, בוטל התמיד, הועמד צלם בהיכל, נשרפה תורה, נפרצה החומה. כל אחד מהם הוא פגיעה ברובד אחר: בתורה, בעבודה, בטוהר, בביטחון. כולם ביום אחד. הצום הוא הזמן להתבונן: באיזה רובד אנחנו זקוקים לתיקון?",icon:"📜"}
      ]
    ],
    "עשרה בטבת": [
      [
        {title:"תחילת המצור – ראשית הצרה",source:"מלכים ב' כה",text:"בעשרה בטבת החל נבוכדנצר מלך בבל את מצורו על ירושלים. זהו היום שבו הסיר את החירות מעל ירושלים לראשונה. החורבן לא בא ביום אחד – הוא התחיל בצעד קטן: מצור, בידוד, ניתוק. הצום מלמד: לשים לב לסימנים הראשונים של הסכנה, ולא לחכות עד שיהיה מאוחר.",icon:"❄️"}
      ],
      [
        {title:"יום קדיש כללי",source:"הרבנות הראשית לישראל",text:"הרבנות הראשית לישראל קבעה את עשרה בטבת כ'יום הקדיש הכללי' לקדושי השואה שאין יודעים את תאריך פטירתם. כך נקשר יום קדום של אבל לאסון המודרני הגדול ביותר. הצום הוא תזכורת: אנחנו עם שזוכר. הזכרון הוא חלק מהיותנו ישראל – 'זכור ואל תשכח'.",icon:"🕯️"}
      ]
    ]
  };

  var MONTH_DT = {
    "תשרי":   [{title:"תשרי – חודש המלכת ה'",source:"הרב קוק",text:"תשרי הוא החודש הכי עמוס במועדים: ראש השנה, יום כיפור, סוכות, שמיני עצרת. כולם סובבים סביב נושא אחד – מלכות ה'. בתשרי אנחנו מכתירים את הקדוש ברוך הוא כמלך, מתכפרים, ושמחים. חודש שלם של עבודת ה' מתוך אהבה ויראה.",icon:"🎺"},{title:"תשרי – ראש לחודשים",source:"בעל התניא",text:"אף שניסן נקרא 'ראש חודשים', תשרי הוא ראש השנה. תשרי הוא ראש הלב, ניסן הוא ראש הדעת. תשרי מסמל את שורש הקיום – הרצון לחיות ולהיות, להיות מחובר לה'. כל מה שמתחדש בשנה – שרשו בתשרי.",icon:"🌟"}],
    "חשון":   [{title:"חשון – חודש ללא מועד",source:"מדרש",text:"חשון הוא החודש היחיד בשנה ללא שום חג או צום. יש מדרש שאומר: 'חשון חייב' ויקבל שכרו – כי בו ייבנה בית המקדש השלישי. החודש הריק הוא גם חודש של הכנה. אחרי הרעש של תשרי – חשון הוא שקט, חזרה לשגרה, ובינוי פנימי שקט.",icon:"🌧️"},{title:"חשון – חודש המים",source:"חז\"ל",text:"בחשון מתחילים לבקש גשמים בתפילה ('ותן טל ומטר לברכה'). המים מסמלים תורה – 'אין מים אלא תורה'. אחרי ההתעוררות הגדולה של תשרי, חשון הוא הזמן שבו הלמידה מתיישבת, כמו שמים חודרים לאדמה ומשקים אותה לאט לאט.",icon:"💧"}],
    "כסלו":   [{title:"כסלו – אור בחשכה",source:"השפת אמת",text:"כסלו הוא חודש חנוכה – חודש שבו ימי החורף הקצרים ביותר, והחשכה הגדולה ביותר. ודווקא בו מדליקים נרות חנוכה. אור בחשכה חזק יותר מאור ביום. כסלו מלמד: דווקא כשהמצב קשה, כשהחשכה גדולה – זה הזמן להדליק, להאיר, להחזיק בטוב.",icon:"🕎"},{title:"חודש הגאולה",source:"מנהג חב\"ד",text:"בחסידות חב\"ד נקרא כסלו 'חודש הגאולה' – כי ב-י\"ט כסלו שוחרר אדמו\"ר הזקן מהכלא ברוסיה, ומסירת חסידות חב\"ד נמשכה. כל שנה חוגגים זאת ב'חג הגאולה'. כסלו מבשר: גם בתוך הגלות, יש רגעים של שחרור, של אור, של נצחון הנשמה על הגוף.",icon:"✨"}],
    "טבת":    [{title:"טבת – חשכה ואור נסתר",source:"ספר יצירה",text:"טבת הוא החודש הקר ביותר, חשוך ביותר. עשרה בטבת – צום. ואף על פי כן, בתוך כסלו וטבת מאירים נרות חנוכה. הניגוד הזה הוא מסר עמוק: גם בשפל הרוחני, האור קיים. אל תחפש את ה' רק בהרים – מצא אותו גם בעמקים.",icon:"❄️"},{title:"טבת – חודש החזרה בתשובה",source:"הרב אברהם פאלאג'י",text:"טבת בא אחרי שמחת חנוכה. אחרי הנרות, החשכה חוזרת. כאן נבחן האדם: האם האור שקיבל בחנוכה נשאר איתו? טבת הוא חודש של עיבוד פנימי, של הפיכת הנרות החיצוניים לאור פנימי שאינו כבה גם כשהחורף ארוך.",icon:"🕯️"}],
    "שבט":    [{title:"שבט – חודש ההתעוררות",source:"מנהג ישראל",text:"ט\"ו בשבט הוא ראש השנה לאילנות. בשבט האילנות מתחילים לינוק שוב מן הקרקע, אפילו שבחוץ עדיין חורף. הנשמה גם היא כך: לפעמים ההתחדשות מתחילה בפנים, הרבה לפני שהיא נראית מבחוץ. שבט מלמד: אמון בתהליכים שקטים שמתנהלים מתחת לפני השטח.",icon:"🌳"},{title:"פרי העץ – שמחת הטבע",source:"הרב קוק",text:"ט\"ו בשבט הוא יום שמחה על פירות הארץ. הרב קוק ראה בקדושת הטבע ביטוי לאלוקות. כל אילן, כל פרי – הוא יצירה אלוקית. בט\"ו בשבט אנחנו מכירים תודה לה' על הטבע. 'מלוא כל הארץ כבודו' – הכבוד מתגלה גם בפרח, גם בעץ, גם בפרי.",icon:"🍎"}],
    "אדר":    [{title:"אדר – חודש השמחה",source:"גמרא תענית",text:"'משנכנס אדר מרבים בשמחה'. הגמרא אומרת: כשם שמשנכנס אב ממעטים בשמחה, כשנכנס אדר מרבים. אדר הוא ה'אנטי-אב'. בחודש שבו נגזר הכלייה על ישראל – ונהפך לנס – אנחנו חוגגים את היכולת האלוקית להפוך רע לטוב.",icon:"🎉"},{title:"מזל אדר",source:"בעל התניא",text:"מזל אדר הוא דגים. 'כדגים הרבים שאין עין הרע שולטת בהם'. כמו דגים שחיים מתחת לפני המים, מחוץ לראייה של עין הרע – כך ישראל בפורים ניצחו כי זכות מיוחדת הגנה עליהם. אדר מבשר: יש הגנה עליונה שמתגלה ברגע האמת.",icon:"🐟"}],
    "אדר א":  [{title:"אדר ראשון – שמחה מוכפלת",source:"הרמ\"א",text:"בשנת עיבור יש שני חודשי אדר. אמרו חז\"ל: 'מרבים שמחה בשני האדרים'. יש מחלוקת איזה אדר הוא הפורים האמיתי – הלכה שהוא אדר שני. אך אדר ראשון גם הוא זמן שמחה. 'אדר א' מלמד: כשיש הזדמנות שנייה – שמח בה לא פחות מהראשונה.",icon:"🎊"},{title:"שנת העיבור – הוספה לשלמות",source:"ספר הזוהר",text:"השנה המעוברת נוספת כדי לאזן בין הלוח הירחי לשמשי. השנה המעוברת היא שנה עמוקה יותר – שנה שבה יש זמן נוסף לתיקון ולעמקות. אדר ראשון הוא מתנה – חודש שלם נוסף של עבודה, של הכנה, של שמחה.",icon:"🌙"}],
    "אדר ב":  [{title:"אדר שני – עת הנס",source:"גמרא מגילה",text:"פורים חל באדר שני – הסמוך לניסן, חודש הגאולה. 'הסמך גאולה לגאולה' – נס פורים קרוב לנס יציאת מצרים. אדר שני הוא שיא שמחת אדר, הזמן שבו כל הפוטנציאל של חודש השמחה מתממש. 'ונהפוך הוא' – ההיפוך הגדול קורה כאן.",icon:"🎭"},{title:"גאולה בצינעה",source:"הגר\"א",text:"נס פורים הוא נס נסתר – שם ה' לא מוזכר במגילה. אדר שני מלמד: הגאולה לא תמיד באה בקולות ובברקים. לפעמים היא מתרחשת בשקט, בצינעה, ורק בסוף מבינים: 'כי לא בחזקה ולא בגבורה'. זהו עומק פורים – לזהות את יד ה' בתוך המציאות הטבעית.",icon:"✡️"}],
    "ניסן":   [{title:"ניסן – ראש לחודשים",source:"שמות יב",text:"'החודש הזה לכם ראש חודשים, ראשון הוא לכם לחודשי השנה'. ניסן הוא ראש החודשים לפי מצות התורה. בניסן יצאנו ממצרים, בניסן נגאל. ניסן הוא חודש ה'ראשוניות' – של התחלות חדשות, של קפיצות אל הלא נודע, של בטחון שה' עמנו.",icon:"🌊"},{title:"ניסן – חודש האביב",source:"שמות יג",text:"נקרא גם 'חודש האביב'. בניסן הטבע מתחדש – הצמחים פורחים, האוויר מתחמם. חז\"ל ראו בחידוש הטבע בניסן רמז לגאולת ישראל. 'עורי צפון ובואי תימן' – רוחות האביב הן קול הגאולה. ניסן מלמד: חידוש תמיד אפשרי, אפילו אחרי חורף ארוך.",icon:"🌸"}],
    "אייר":   [{title:"אייר – חודש הרפואה",source:"חז\"ל",text:"ראשי תיבות של 'אייר': א-נוכי י-הוה ר-ופאך. חודש אייר הוא חודש הרפואה. בו קיבלו ישראל את מצוות מרה, בו ירד המן. אייר הוא חודש של מעבר – בין פסח לשבועות, בין גאולה לקבלת תורה. מסע הספירה שבו הוא מסע ריפוי מידות.",icon:"💊"},{title:"ספירת העומר – מסע של 49 יום",source:"הרמח\"ל",text:"כל ימי אייר נמצאים בתוך ספירת העומר. ה-49 ימים הם תיקון שבע המידות. בכל שבוע עובדים על מידה אחרת: חסד, גבורה, תפארת, נצח, הוד, יסוד, מלכות. אייר הוא חודש של עבודה פנימית שקטה – להכין את עצמנו לקבלת תורה בשבועות.",icon:"✨"}],
    "סיון":   [{title:"סיון – זמן מתן תורתנו",source:"שמות יט",text:"בסיון ניתנה תורה. 'בחודש השלישי לצאת בני ישראל מארץ מצרים, ביום הזה באו מדבר סיני'. סיון הוא חודש ה'שלישי' – שלוש אבות, שלוש כיתות (כוהנים לויים ישראלים), שלושה ימי הגבלה. הכל מתכנס לנקודה אחת: קבלת התורה.",icon:"📜"},{title:"סיון – חודש השמחה הרוחנית",source:"ספר החינוך",text:"שבועות בסיון הוא 'זמן מתן תורתנו'. שמחת סיון היא שמחה רוחנית – שמחת החכמה, שמחת הידיעה ש ה' בחר בנו ונתן לנו את תורתו. 'אשרינו מה טוב חלקנו' – חלקנו לדעת, ללמוד, לחיות לפי התורה.",icon:"🌿"}],
    "תמוז":   [{title:"תמוז – חודש של עמידה במסה",source:"רש\"י",text:"בתמוז נשברו הלוחות, הוקם העגל הזהב. תמוז הוא חודש של ניסיון – כשמשה עיכב, ישראל לא החזיקו. אבל הנפילה של תמוז מלמדת: אל תיבנה את אמונתך רק על הנהגה חיצונית. הביטחון צריך להיות פנימי, עמוק, שאינו נשבר כשהמדריך נעלם.",icon:"☀️"},{title:"בין המצרים – שלושה שבועות",source:"ספר מלכים",text:"מי\"ז בתמוז עד ט' באב הם 'שלושת השבועות' – ימי אבל על חורבן הבית. תמוז נכנס לתקופה של ירידה. אך חז\"ל הבטיחו: 'כל המתאבל על ירושלים זוכה ורואה בשמחתה'. האבל של תמוז הוא הכנה לנחמה.",icon:"😢"}],
    "אב":     [{title:"אב – מאבל לנחמה",source:"ישעיהו",text:"חודש אב מתחיל בשלושת השבועות ומגיע לשיאם בט' באב. אבל אחרי ט' באב מגיע שבת נחמו – 'נחמו נחמו עמי'. אב הוא חודש של קאתרזיס – שחרור הכאב, ואז פתיחה לנחמה. 'הצי לך מזרחה ומצפונה ומנגבה ותאכלי חיל גויים' – אחרי החורבן, הבטחת הגאולה.",icon:"😢"},{title:"חמישה עשר באב – חג האהבה",source:"גמרא תענית",text:"'לא היו ימים טובים לישראל כחמישה עשר באב'. ט\"ו באב – שבועות ספורות אחרי ט' באב – הוא חג האהבה. בנות ירושלים יצאו לכרמים. האופן שבו הכאב הגדול ביותר הופך לשמחה גדולה – תוך שבועות – מגלה את כוח ישראל: לצאת מהעמקים ולשמוח שוב.",icon:"💕"}],
    "אלול":   [{title:"אלול – חודש התשובה",source:"הרמב\"ם",text:"'אני לדודי ודודי לי' – ראשי תיבות: א-ל-ו-ל. חודש אלול הוא חודש שבו ה' קרוב אלינו במיוחד. 'המלך בשדה' – הקדוש ברוך הוא יוצא לקראתנו. כל יום בחודש זה תוקעים בשופר כדי לעורר את הלבבות. אלול הוא חודש הרחמים והסליחות – הכנה לראש השנה.",icon:"🌙"},{title:"ארבעים יום של רצון",source:"שמות לד",text:"משה עלה שנית להר סיני בראש חודש אלול וירד ביום הכיפורים – ארבעים יום של רצון אלוקי לסליחה. מאז, ארבעים הימים שבין ראש חודש אלול לכיפור הם 'עת רצון'. בכל שנה חוזר חלון הזמן הזה. זה הזמן שבו התשובה 'קלה' יותר, שבו שערי שמים פתוחים לרווחה.",icon:"✨"}]
  };

  var PARSHA_DT = {
    "בראשית":    [[{title:"בראשית – בשביל מי?",source:"רש\"י",text:"'בשביל התורה שנקראת ראשית ובשביל ישראל שנקראו ראשית'. רש\"י שואל: מדוע התורה מתחילה בבריאה ולא במצווה הראשונה? כדי שנדע שארץ ישראל שלנו, כי ה' ברא הכל ויכול לתת לכל מה שרצה. הבריאה כולה היא ביסוס זכותנו.",icon:"🌍"}],[{title:"ויאמר אלוהים – כוח הדיבור",source:"הרב קוק",text:"'ויאמר אלוהים יהי אור' – העולם נברא בדיבור. גם לאדם הנברא בצלם אלוהים יש כוח דיבור יוצר. מילים יוצרות מציאות. לכן התורה מקפידה כל כך על לשון הרע, על שבועה שווא, על אמת. כל מילה שלנו היא יצירה – לטוב ולרע.",icon:"💬"}]],
    "נח":        [[{title:"נח איש צדיק",source:"רש\"י – גמרא סנהדרין",text:"'נח איש צדיק תמים היה בדורותיו' – רש\"י מביא שתי דעות: יש שאומרים 'בדורותיו' לשבח – שבדורו היה צדיק ובדור אברהם אף הוא היה נחשב. ויש שאומרים לגנאי. נח הוא אדם שניצל אך לא הציל. לאחר שיצא מהתיבה – שתה. הצדיקות חייבת להיות אקטיבית.",icon:"🕊️"}],[{title:"קשת בענן – ברית עולם",source:"בראשית ט",text:"'את קשתי נתתי בענן' – ה' נתן קשת כסימן לברית שלא יהיה מבול שוב. הקשת מופיעה דווקא אחרי הסערה. היא נוצרת מחיבור השמש והגשם. כך גם בחיי האדם: אחרי הסערה הגדולה ביותר – מופיע הסימן שה' לא עזב. הברית נצחית.",icon:"🌈"}]],
    "לך לך":     [[{title:"לך לך – צא מנחמת אזורך",source:"הבעל שם טוב",text:"'לך לך מארצך ומולדתך ומבית אביך'. ה' מצווה אברהם לצאת משלושה דברים: ארץ, מולדת, בית אב – שלושה עיגונים של הנוחות. הדרך הרוחנית מתחילה ביציאה. כל אחד מאתנו מקבל 'לך לך' – לצאת מהנוחות המוכרת אל ייעודו האמיתי.",icon:"🚶"}],[{title:"אברהם אבינו – פורץ דרך",source:"הרמב\"ם",text:"אברהם הגיע לאמונה בה' בכוח עצמו, ללא מסורת, ללא הורים מאמינים. 'אברהם איש גדול' – גדולתו שגילה את ה' בתוך עולם שכחתו. כל אדם שמחפש אמת ולא מסתפק בנוחות הדת המוכרת – עוקב אחרי נתיב אברהם.",icon:"⭐"}]],
    "וירא":      [[{title:"הכנסת אורחים מעל הכל",source:"גמרא שבת",text:"'ה' נראה אליו' – ואברהם ישב בפתח האוהל. רש\"י: ביקר את החולה. גם כשהשכינה עמו – כשראה אברהם אורחים, עזב את השכינה לכבד אותם. 'גדולה הכנסת אורחים מקבלת פני שכינה'. לשרת אנשים בצרכיהם – זה עצמו קבלת פני שכינה.",icon:"🏕️"}],[{title:"עקדת יצחק – מבחן הנכונות",source:"הרמב\"ן",text:"עקידת יצחק לא נועדה לשחוט – ה' לא רצה קורבן אדם. נועדה להוציא את פוטנציאל אברהם מכח לפועל. מה שהיה אפשרי – נעשה ממשי. 'עתה ידעתי כי ירא אלוהים אתה' – לא ידע קודם, כי עד שנבחן, הפוטנציאל נסתר. הנסיונות מגלים מי אנחנו.",icon:"🔥"}]],
    "חיי שרה":   [[{title:"אחרי המוות – חיים ממשיכים",source:"השפת אמת",text:"הפרשה נקראת 'חיי שרה' אך מתחילה במותה. חייה של שרה ממשיכים אחרי מותה: דרך יצחק שמצא אשה, דרך האמונה שהשאירה. 'חיי שרה' הם החיים שהיא הותירה. אנחנו חיים בזכות מה שהורינו ואבותינו נטעו בנו.",icon:"🌹"}],[{title:"ריבקה – הכרת טובה",source:"בראשית כד",text:"כשאליעזר ביקש סימן ל'הכרת הנבחרת', ריבקה הציעה מים לנסיכים, לאנשים, ולגמלים. אחד שמשקה גמלים – הרבה יותר ממה שנדרש ממנו – מגלה נפש נדיבה. הבחירה של ריבקה הייתה בגלל מידותיה, לא רק מוצאה. כך בכל בחירה חשובה בחיים.",icon:"💧"}]],
    "תולדות":    [[{title:"יעקב ועשו – שתי דרכים",source:"הרמב\"ן",text:"'שני גויים בבטנך' – שתי אומות, שתי גישות לחיים. עשו – האדמוני, הציד, חיי הרגע. יעקב – ישב אוהלים, חיי עומק. הבכורה שנמכרה: עשו מכר את עתידו בעד נזיד עדשים. כל אחד מאתנו בוחר: האם לחיות לרגע, או לבנות עתיד?",icon:"🏕️"}],[{title:"'קול קול יעקב' – כוח ישראל",source:"חז\"ל",text:"'הקול קול יעקב' – כוחו של יעקב הוא בקול, בתפילה, בתורה. 'הידיים ידי עשו' – כוחו של עשו בידיים, בחרב. ישראל מנצחים כשהם נאמנים לקולם – לתורה, לתפילה. כשישראל מחקים את 'ידי עשו', הם מאבדים את מקור כוחם.",icon:"🎤"}]],
    "ויצא":      [[{title:"יעקב חולם – הסולם",source:"בעל התניא",text:"'סולם מוצב ארצה וראשו מגיע השמימה'. הסולם מסמל את הקשר בין שמים לארץ. כל מעשה של אדם – גם הגשמי ביותר – יכול להגיע לשמים. 'ומלאכי אלוהים עולים ויורדים' – המלאכים עולים תחילה: הם נבנים מהמעשים הארציים שלנו.",icon:"🪜"}],[{title:"אהבת רחל – ויהיו בעיניו כימים אחדים",source:"בראשית כט",text:"'ויעבוד יעקב ברחל שבע שנים ויהיו בעיניו כימים אחדים באהבתו אותה'. שבע שנות עבודה כימים אחדים – כי האהבה מקצרת הכל. מה שנעשה מאהבה – לא נחשב לעמל. כשאנחנו עושים מה שאנחנו אוהבים ומאמינים בו – הזמן טס.",icon:"❤️"}]],
    "וישלח":     [[{title:"מאבק יעקב עם המלאך",source:"הזוהר הקדוש",text:"'ויאבק איש עמו עד עלות השחר'. יעקב נאבק כל הלילה ויצא ממנו פגוע אך ניצח. 'כי שרית עם אלוהים ועם אנשים ותוכל' – השם ישראל נולד מהנצחון הזה. המאבק הפנימי, הקשה, הלילי – הוא שיוצר את הזהות העמוקה ביותר.",icon:"⚔️"}],[{title:"שלום עם עשו",source:"רש\"י – בראשית לג",text:"'וירץ עשו לקראתו ויחבקהו'. לאחר עשרים שנה של פחד, יעקב ועשו מתפייסים. יעקב שלח מנחה גדולה לפני המפגש. 'כבוד הבריות דוחה לא תעשה'. גם עם מי שאנחנו חוששים ממנו – ניתן לבנות שלום. כבוד כלפי האחר פותח דלתות.",icon:"🤝"}]],
    "וישב":      [[{title:"יוסף וחלומותיו",source:"הרמב\"ם",text:"יוסף חלם חלומות ושיתף – ואחיו שנאוהו. לפעמים הנבואה מוקדמת לזמנה, ויש שאינם יכולים לשאת אותה. יוסף הצדיק לא הפסיק לחלום גם בבור, גם בבית האסורים. הצדיק שומר על חזונו גם כשהמציאות סותרת אותו.",icon:"⭐"}],[{title:"מבור לאסרים – ה' עם יוסף",source:"בראשית לט",text:"'ויהי ה' את יוסף' – שלוש פעמים הפסוק חוזר על כך. בבית פוטיפר, בבית הסוהר – 'ה' עמו'. ההצלחה החיצונית לא הייתה ביד יוסף, אבל הנוכחות האלוקית תמיד הייתה. הצדיק שנמצא ב'בור' – לא לבד. ה' שם.",icon:"🌟"}]],
    "מקץ":       [[{title:"מגדול ופרעה – מהצינוק לשלטון",source:"בראשית מא",text:"תוך יום אחד עלה יוסף מהכלא לביצוע פרעה. 'אין נבון וחכם כמוך'. הגאולה יכולה לבוא מהר מאוד. 'ברגע אחד' כתב רב יהודה. מי שמתאמץ ומכין את עצמו – ברגע שה' פותח את הדלת, הוא מוכן לכניסה.",icon:"👑"}],[{title:"הקץ – 'קץ שם לחושך'",source:"איוב כח",text:"'מקץ שנתיים ימים' – אחרי שנתיים בכלא, מגיע הסוף לחושך. שם הפרשה 'מקץ' – הקץ לסבל. ה' קובע קץ לכל צרה. 'זכרוני נא' – יוסף ביקש שישכחוהו אך ה' לא שכח. מי שסובל ועמד באמונתו – בא הקץ לסבלו.",icon:"⏰"}]],
    "ויגש":      [[{title:"ויגש אליו יהודה",source:"רש\"י – בראשית מד",text:"'ויגש אליו יהודה' – יהודה לא ביקש, לא התחנן. הוא ניגש עם עמדה. הגישה היא צורת עמידה: לא כנועה, לא תוקפנית – אלא ישירה ואחראית. יהודה נכשל בתחילה (יוסף ותמר) ועכשיו מתקן. הוא מציע את עצמו תמורת בנימין – נפש תחת נפש.",icon:"💪"}],[{title:"גילוי יוסף – מחילה שלמה",source:"בראשית מה",text:"'אני יוסף אחיכם' – ויהודה לא יכל לענות כי נבהלו. רש\"י: אוי לנו מיום הדין. כשיוסף נגלה – האחים בושו. אך יוסף אמר: 'ועתה אל תעצבו ואל יחר בעיניכם'. המחילה האמיתית כוללת שחרור האחר מבושתו. 'כי למחיה שלחני אלוהים'.",icon:"🤗"}]],
    "ויחי":      [[{title:"ברכת יעקב – מורשת לדורות",source:"בראשית מט",text:"לפני מותו בירך יעקב את בניו – כל אחד בברכה ייחודית. הוא ראה את הטוב שבכל אחד, גם אם היה בו גם פגם. כך כל הורה: הברכה הגדולה היא לראות את ייחוד ילדך ולאמץ אותו. 'ויברך אותם, איש אשר כברכתו ברך אותם'.",icon:"✋"}],[{title:"ויחי יעקב – חיים שממשיכים",source:"גמרא תענית",text:"'ויחי יעקב' – 'יעקב אבינו לא מת'. פרשה זו 'סתומה' – אין רווח לפניה. מדוע? כי עם מות יעקב – גלה ישראל. אך יעקב לא מת באמת – הוא חי בתוך בניו, בתורתו, בזרעו. כך כל אדם גדול: רוחו ממשיכה לחיות בתוך אלה שחינך.",icon:"🌟"}]],
    "שמות":      [[{title:"שם – הזהות ששומרת",source:"מדרש שמות",text:"'ואלה שמות בני ישראל'. חז\"ל אמרו: ישראל לא שינו את שמותיהם במצרים. בתוך הגלות הקשה – שמרו על שמותיהם, לשונם, מלבושם. הזהות ששמרו – היא שהצילה אותם. 'כשם שנכנסו, כך יצאו'. לשמר את השם שלך – לשמר את עצמך.",icon:"📜"}],[{title:"משה – גדול ממשפחה שקטה",source:"שמות ב",text:"משה גדל בבית פרעה – אך לא שכח שהוא עברי. 'ויגדל משה ויצא אל אחיו וירא בסבלותם'. הוא ראה, הוא השגיח. גדולתו של משה לא בשכלו או בכוחו בלבד – אלא בכך שלא התעלם מסבל אחרים. הנהגה מתחילה בראייה.",icon:"👁️"}]],
    "וארא":      [[{title:"שש עשר שמות ה'",source:"שמות ו",text:"'וארא אל אברהם אל יצחק ואל יעקב באל שדי ושמי ה' לא נודעתי להם'. לאבות נגלה ה' בשם אחד; למשה – בשם ה', שם הנצחיות. כל דור מגלה פן חדש של אלוקות. כל אחד מאתנו פוגש את ה' בצורה שמתאימה לו ולדורו.",icon:"✨"}],[{title:"עשר המכות – שבירת אמונת המצרים",source:"הרב שמשון רפאל הירש",text:"כל מכה כוונה לאל מצרי ספציפי: הנילוס, הצפרדעים, השמש. ה' הוכיח שאלוהי מצרים אינם אלוהים – רק הוא הוא. הלמידה: לפעמים צריך להפריך עבודה זרה לפני שאפשר לקבל אמת. פינוי השקר הוא ההכנה לאמת.",icon:"🌿"}]],
    "בא":        [[{title:"קידוש הזמן – מצווה ראשונה",source:"שמות יב",text:"'החודש הזה לכם ראש חודשים' – מצווה ראשונה שנצטוו ישראל כעם. לא מצווה מוסרית, אלא קידוש הזמן. ישראל מקדשים זמן לפני שמקדשים מקום. הזמן קודם למרחב. כל ימי חייך – כל רגע – ניתן לקדש. זה הלמידה הראשונה של חירות.",icon:"📅"}],[{title:"קרבן פסח – ביטול האל המצרי",source:"שמות יב",text:"'ושחטו את הפסח' – הכבש היה אל מצרי. ישראל נצטוו לשחוט אותו ולמרוח דמו על המשקוף. זה לא רק מצווה – זה הצהרה: אנחנו לא מפחדים מאלוהיכם. השחיטה בגלוי נדרשה בגלל האמירה החזקה שהיא מבטאת: יש רק אלוהים אחד.",icon:"🌙"}]],
    "בשלח":      [[{title:"שירת הים – שיר הנשמה",source:"מכילתא",text:"אחרי קריעת ים סוף – ישראל שרו שירה. 'אז ישיר משה' – אז: כשראו את הנס לגמרי. שירה נולדת ממלאות. לא מדברים שירה – שרים אותה. כשהאדם רואה את גדולת ה' בחייו – הוא פורץ בשירה. 'אשירה לה' כי גאה גאה'.",icon:"🎵"}],[{title:"מן – לחם מן השמים",source:"שמות טז",text:"'הנני ממטיר לכם לחם מן השמים'. המן ירד כל יום מחדש. לא ניתן לשמור ליום המחרת. ה' לא רצה שנאגור – רצה שנסמוך עליו יום יום. הביטחון האמיתי: לא לדאוג למחר, אלא לבטוח שמה שנצטרך – יהיה. 'כיום הזה' – כל יום חדש.",icon:"🍞"}]],
    "יתרו":      [[{title:"מעמד הר סיני",source:"שמות יט",text:"'ויחרד כל ההר מאוד' – ה' ירד על ההר. 600,000 נשמות עמדו שם, ולפי חז\"ל גם כל נשמות ישראל לדורות. 'לא עם אלה בלבד אנוכי כורת את הברית' – כל אחד מאתנו היה בהר סיני. הברית אינה עניין היסטורי בלבד – היא ברית אישית שכל אחד מאתנו חלק ממנה.",icon:"⛰️"}],[{title:"כבד את אביך ואמך",source:"עשרת הדיברות",text:"בין מצוות 'בין אדם למקום' לבין מצוות 'בין אדם לחברו' עומד 'כבד אביך ואמך'. ההורים הם הגשר: דרכם קיבלנו את החיים, את הערכים, את הזהות. לכבד הורים הוא לכבד את שרשרת הדורות – את כל מי שעמד לפנינו כדי שנוכל לעמוד.",icon:"👪"}]],
    "משפטים":    [[{title:"וספר הברית",source:"שמות כד",text:"'ויכתוב משה את כל דברי ה'' – אחרי מעמד הר סיני, הדברים נכתבו. הכתיבה מחייבת. המחויבות לא נשארת בלב בלבד – היא מוצאת ביטוי ממשי, ניתנת לקריאה, לחינוך, להעברה. 'ויאמרו כל אשר דיבר ה' נעשה ונשמע'.",icon:"📜"}],[{title:"עין תחת עין – משפט אמיתי",source:"הרמב\"ם",text:"'עין תחת עין' – לא פשוטו כמשמעו. חז\"ל פירשו: תשלום ממוני. הצדק אינו נקמה – הוא השבת המשוות. פגעת בי כלכלית – שלם. פגעת בי גופנית – שלם. המשפט העברי לא מחפש סבל – מחפש תיקון.",icon:"⚖️"}]],
    "תרומה":     [[{title:"ועשו לי מקדש",source:"שמות כה",text:"'ועשו לי מקדש ושכנתי בתוכם' – לא 'בתוכו' אלא 'בתוכם'. ה' לא שוכן בבניין – הוא שוכן בתוך כל אחד מאתנו. המשכן הוא מודל – לנו ללמוד כיצד לעשות את עצמנו 'דירה לה''. כל אחד יכול להפוך את לבו למקדש פנימי.",icon:"🏛️"}],[{title:"נדבת הלב",source:"שמות כה",text:"'מאת כל איש אשר ידבנו לבו תקחו את תרומתי'. התרומה לא הייתה חובה – הייתה נדבת לב. כשאנחנו נותנים מרצון, מאהבה, בלי חובה – הנתינה שלמה אחרת. 'כפרה בנדבה' – נדבה מכפרת כי היא מבטאת את הפנימיות.",icon:"❤️"}]],
    "תצוה":      [[{title:"בגדי הכהן – לכבוד ולתפארת",source:"שמות כח",text:"'ועשית בגדי קודש לאהרן אחיך לכבוד ולתפארת'. הכהן לובש בגדים מיוחדים לא כדי להתגאות – אלא כדי לייצג. הבגד הוא ממשק בין האדם הפנימי לעולם החיצוני. גם בחיי יום יום: מה שלובשים, כיצד מציגים את עצמנו – זה חלק מהקדושה.",icon:"👘"}],[{title:"נר תמיד – אור שאינו כבה",source:"שמות כז",text:"'להעלות נר תמיד' – בבית המקדש הנר לא כבה לעולם. כנגד כל חשכה – אור. כנגד כל ספק – אמונה. 'נר תמיד' הוא לא רק פיזי – הוא מסמל שישנו עיקר שאינו נכבה. האמונה הפנימית של ישראל היא נר שלא יכבה.",icon:"🕯️"}]],
    "כי תשא":    [[{title:"חטא העגל – הנפילה הגדולה",source:"שמות לב",text:"'וירא העם כי בשש משה לרדת' – עיכוב של שש שעות הוביל לחטא הגדול ביותר. ישראל לא יכלו לחכות. הנסיון הגדול ביותר הוא לפעמים הסבלנות. המתנה לה', למנהיג, לתשובה – זה דורש כוח רצון גדול מהנפילה המיידית.",icon:"🐂"}],[{title:"משה מבקש לראות את ה'",source:"שמות לג",text:"'הראני נא את כבודך' – אחרי חטא העגל, משה מבקש חיבור עמוק לה'. 'לא תוכל לראות את פני' – אבל 'וראית את אחורי'. ה' מסביר: האדם רואה את ה' מאחור – בדיעבד, בהיסטוריה. רק לאחר שהמאורע עבר, רואים כיצד ה' היה שם.",icon:"✨"}]],
    "ויקהל":     [[{title:"שבת לפני המשכן",source:"שמות לה",text:"לפני ציווי בניין המשכן – משה מזכיר את השבת. ה' מלמד: גם בנין הקודש אינו דוחה שבת. 'אל יצא איש ממקומו'. השבת היא גדולה מהמשכן. העיקרון: גם המצווה הגדולה ביותר מוגבלת ע\"י ערכים עליונים. אין 'מטרה מקדשת אמצעים'.",icon:"🕯️"}],[{title:"נדבת הנשים",source:"שמות לה",text:"'ויבואו האנשים על הנשים, כל נדיב לב' – גברים ונשים יחד תרמו למשכן. הנשים הביאו ראי נחושת שתרמו לכיור. הדבר שאנחנו מחשיבים כחיצוני – הראי – הופך לחלק מהקדושה. כל מה שבנינו בחיינו, כולל הגשמי, יכול להיות תרומה לשכינה.",icon:"🪞"}]],
    "פקודי":     [[{title:"ויכל משה את המלאכה",source:"שמות מ",text:"'ויכל משה את המלאכה' – ו'וימלא הכבוד את המשכן'. כשמשה סיים – השכינה ירדה. מסר: עשה את שלך עד הסוף. אל תחשוב שה' יסיים את מה שאתה לא סיימת. 'כלה מלאכתך ואחר כך בקש ממנו ברכה'. הסיום של האדם פותח את הברכה האלוקית.",icon:"🏛️"}],[{title:"כאשר צוה ה' את משה",source:"שמות לח-מ",text:"חמישה עשר פעמים בפרשה חוזרת הביטוי 'כאשר צוה ה' את משה'. כל חלק נבנה בדיוק לפי הציווי. הצייתנות הזו אינה עבדות – היא שלמות. כשכל חלק תואם לתכנון האלוקי – הכל מתאחד ליצירה שלמה. הדיוק יוצר קדושה.",icon:"✅"}]],
    "ויקרא":     [[{title:"ויקרא – הקריאה האלוקית",source:"ויקרא א",text:"'ויקרא אל משה וידבר ה' אליו'. 'ויקרא' – בקריאה, לא רק בדיבור. ה' לא רק מדבר אל משה – הוא קורא לו. יש הבדל: דיבור הוא מידע, קריאה היא זימון. ה' מזמן כל אחד מאתנו לתפקיד מיוחד. הלמידה: כדאי לשאול – לאיזה תפקיד ה' קורא לי?",icon:"📢"}],[{title:"קרבן – קירוב",source:"הרמב\"ן",text:"'קרבן' מלשון 'קרוב'. הקרבן אינו מזון לה' – הוא דרך להתקרב. בזמן שהביאו קרבן, האדם נתן מן הבהמה שבתוכו. 'האיש הוא השור', פירש הרמב\"ן. הקרבן הוא סמל לוויתור על האנוכיות.",icon:"🔥"}]],
    "צו":        [[{title:"אש תמיד תוקד",source:"ויקרא ו",text:"'אש תמיד תוקד על המזבח, לא תכבה'. הכהן היה אחראי לשמור על האש שתבער. כך בחיי הרוח: האש הפנימית – ההתלהבות, האמונה, האהבה לה' – אינה נשמרת מעצמה. יש להוסיף עצים בכל יום. 'לא תכבה' – זו מצווה אקטיבית.",icon:"🔥"}],[{title:"כהן שעובד – כהן שלומד",source:"ויקרא ז",text:"הכהן לא רק מקריב – הוא גם לומד ומלמד. 'כי שפתי כהן ישמרו דעת ותורה יבקשו מפיהו'. הדמות הדתית שמנהיגה את העם חייבת להיות גם חכמה. מנהיג שרק מבצע – לא מדריך. מנהיג שגם לומד וחושב – הוא שמוביל.",icon:"📚"}]],
    "שמיני":     [[{title:"יום השמיני – יום ייחודי",source:"ויקרא ט",text:"'ויהי ביום השמיני' – שמיני ימי המילואים, היום הראשון לעבודת המשכן. שבעה ימים הם המחזור הטבעי. השמיני הוא מעבר לטבע – קדושה עליונה. 'שמיני עצרת' גם הוא שמיני, יום ייחודי. המספר שמונה מסמל בקבלה את הנצח שמעל לטבע.",icon:"8️⃣"}],[{title:"מות נדב ואביהו – אש זרה",source:"ויקרא י",text:"'ויקריבו אש זרה אשר לא ציוה אותם'. נדב ואביהו קרבו מה שלא נצטוו. הם אהבו את ה' – אך לא הסתפקו בגבולות שנקבעו. הלמידה: גם בקדושה ובאהבה – יש גבולות. הרצון הפרטי, אפילו מתוך מסירות, אינו יכול לדחות את הציווי.",icon:"🔥"}]],
    "תזריע":     [[{title:"לידה וטהרה",source:"ויקרא יב",text:"לאחר לידה, האשה טמאה לימים מסוימים. 'טומאה' בתורה אינה לכלוך – היא מצב של עוצמה גבוהה מדי לקדושת המקדש. כוח הלידה – יצירת חיים – הוא עוצמה אדירה. אחרי מגע עם עוצמה כזו, האדם צריך תהליך של 'התכוונות מחדש' לפני כניסה לקדש.",icon:"👶"}],[{title:"צרעת – מחלת הנפש",source:"חז\"ל – מסכת ערכין",text:"חז\"ל אמרו שצרעת באה בעיקר על לשון הרע. הגוף מתנגד לרע שיצא מהפה. 'ויצעק העם ויצא מחוץ למחנה' – המצורע יושב לבד. הבדידות מאפשרת לו להכיר בנזק שגרם. לשון הרע פוגע בחיבור בין אנשים – הפרידה היא תיקון.",icon:"🔇"}]],
    "מצורע":     [[{title:"טהרת המצורע – חזרה",source:"ויקרא יד",text:"טהרת המצורע היא תהליך ארוך ומפורט. שתי ציפורים, ארז, שני, אזוב. הציפור השחוטה כנגד הלשון שגרמה נזק. הציפור המשוחררת – כנגד דיבור חדש, חופשי וטהור. כשאדם חוזר בתשובה מלשון הרע – הוא משתחרר כציפור מן הכלוב.",icon:"🐦"}],[{title:"נגע הבית – שיקוף של הנפש",source:"רמב\"ן",text:"נגע שבא על הבית מביא לבדיקה ולהריסה אם לא מרפא. הרמב\"ן: 'זו מדה כנגד מדה'. הבית הוא ביטוי של בעליו. כשהאדם רקוב מבפנים – זה מתגלה גם בחיצוני. תיקון הפנימי מרפא גם החיצוני.",icon:"🏠"}]],
    "אחרי מות":  [[{title:"עבודת יום הכיפורים",source:"ויקרא טז",text:"'בזאת יבוא אהרן אל הקודש' – 'בזאת', לא בדרך אחרת. יש סדר מדויק לעבודת כהן גדול ביום כיפור. מה שנראה כפורמליזם הוא לאמת הכנסת המחשבה לסדר. הטקס מסדר את הפנימיות. כשאנחנו עושים דברים בסדר – גם לבנו מסתדר.",icon:"🏛️"}],[{title:"ואהבת לרעך כמוך",source:"ויקרא יח-יט",text:"פרשת אחרי מות מסתיימת בפרשת קדושים. קדושת ישראל מבוססת על מוסר. לא רק 'לא תגנוב', לא רק 'לא תרצח' – אלא 'ואהבת לרעך כמוך'. רבי עקיבא: כלל גדול בתורה. הקדושה האמיתית באה לידי ביטוי ביחס לאחר.",icon:"❤️"}]],
    "קדושים":    [[{title:"קדושים תהיו",source:"ויקרא יט",text:"'קדושים תהיו כי קדוש אני ה' אלוהיכם'. הפקודה להיות קדושים היא תמוהה – האם ניתן לצוות על קדושה? אמר הרמב\"ן: 'קדש עצמך במותר לך'. גם מה שמותר – יש להשתמש בו בצניעות. הקדושה היא מידה של ריסון עצמי מתוך אהבה.",icon:"✨"}],[{title:"מפני שיבה תקום",source:"ויקרא יט",text:"'מפני שיבה תקום' – לקום לפני זקן. כבוד הזיקנה אינו רק נימוס – הוא הכרת ערכה של ניסיון. הזקן הביא את עצמו עד לגיל הזה – הוא ראה, חווה, ולמד. לכבד אותו הוא ללמוד מחייו. 'שאל אביך ויגדך, זקניך ויאמרו לך'.",icon:"👴"}]],
    "אמור":      [[{title:"מועדי ה'",source:"ויקרא כג",text:"פרשת אמור כוללת את רשימת המועדות. 'אלה מועדי ה' מקראי קודש אשר תקראו אותם במועדם'. המועדים אינם חגים לאומיים בלבד – הם 'מועדי ה''. פגישות שה' קובע. בכל חג, ה' מחכה לנו. אנחנו קובעים את הזמן – ה' ממלא אותו בנוכחות.",icon:"📅"}],[{title:"כי קציר הוא – לא תכלה",source:"ויקרא כג",text:"'ובקוצרכם את קציר ארצכם, לא תכלה פאת שדך לקצור... לעני ולגר תעזוב אותם'. ממש בתוך תיאור המועדות, מוכנסת מצווה חברתית. הקשר: שמחת החג אינה שלמה בלי שיתוף. לא ניתן לחגוג בעושר בזמן שהסביבה עוני. הזיכרון לדאוג לאחר הוא חלק מהקדושה.",icon:"🌾"}]],
    "בהר":       [[{title:"שמיטה – שבת לאדמה",source:"ויקרא כה",text:"'כי תבואו אל הארץ... ושבתה הארץ שבת לה''. הארץ גם צריכה שבת. בשנה השביעית – לא עובדים, לא קוצרים למכירה, הכל הפקר. הקדוש ברוך הוא אומר: הארץ שלי, לא שלכם. הטעמת הנתינה לה' – כשמניחים לאדמה לנוח, מכירים בכך שהכל מה'.",icon:"🌿"}],[{title:"יובל – שחרור מוחלט",source:"ויקרא כה",text:"כל חמישים שנה – שנת יובל. עבדים משתחררים, קרקעות חוזרות לבעליהן המקוריים. יובל מבטל עצמה את כל העיוותים הכלכליים שנצטברו. זהו 'reset' חברתי. הרעיון: אין עוני נצחי, אין עשירות נצחית. ה' שומר על שוויון בסיסי.",icon:"🔔"}]],
    "בחקותי":    [[{title:"אם בחקותי תלכו",source:"ויקרא כו",text:"'אם בחקותי תלכו ואת מצוותי תשמרו' – ואז: גשמים בעתם, פרי האדמה, שלום בארץ. 'בחקותי' – בחוקים, גם אלה שאינם מובנים. ה' מבקש אמון: לא להבין הכל, אלא ללכת. ה'הליכה' עצמה – בלי שאלות – מביאה את הברכה.",icon:"🌧️"}],[{title:"אם לא תשמעו – הנבואה לא פסימיסטית",source:"הרב קוק",text:"פרשת 'תוכחה' נראית קשה. אבל היא מסתיימת: 'ואף גם זאת... לא מאסתים ולא גיחלתים לכלותם'. גם אחרי כל הצרות – ה' לא עוזב. הברית נצחית. התוכחה היא לא עונש – היא אזהרה מאב. ואהבת האב אינה מסתיימת לעולם.",icon:"❤️"}]],
    "במדבר":     [[{title:"מנין ישראל – כל אחד נחשב",source:"במדבר א",text:"'שאו את ראש כל עדת בני ישראל' – לספור כל אחד. חז\"ל: 'מרוב חיבתם לפניו מונה אותם תמיד'. כשסופרים כל אחד – אומרים שכל אחד חשוב. אין ישראל גוש אנונימי – כל נשמה ספורה ונזכרת. 'אף על פי שחטא, ישראל הוא'.",icon:"🔢"}],[{title:"ארבעת המחנות – סדר בתנועה",source:"במדבר ב",text:"ישראל חנו במדבר לפי סדר: כל שבט בדגלו, כל מחנה בכיוונו. 'כדגלו' – לכל שבט דגל, זהות. גם בתנועה – יש סדר. גם כשנוסעים ממקום למקום – השייכות לשבט, למשפחה, לזהות – נשמרת. הסדר הוא שומר הזהות.",icon:"🏕️"}]],
    "נשא":       [[{title:"ברכת כוהנים – שלושה שלבים",source:"במדבר ו",text:"'יברכך ה' וישמרך. יאר ה' פניו אליך ויחונך. ישא ה' פניו אליך וישם לך שלום'. שלושה פסוקים: הגנה, אהבה, שלום. ה'שלום' האמיתי בא בסוף, כשמרגישים שה' פונה אלינו. השלום אינו רק היעדר מלחמה – הוא מלאות, שלמות.",icon:"🙏"}],[{title:"סוטה – קנאת הבעל",source:"במדבר ה",text:"פרשת סוטה, בין ברכת כוהנים לנדרי הנזיר, נראית לא במקומה. אבל יש קשר: שלושתם עוסקים ביחסים – בין אדם לה', בין בני זוג, בין האדם לעצמו. האמון הוא ערך מרכזי. כשמשהו נשבר – ה' מרפא. ה' עצמו גרם למחיקת שמו כדי לשים שלום.",icon:"⚖️"}]],
    "בהעלותך":   [[{title:"בהעלותך את הנרות",source:"במדבר ח",text:"'בהעלותך את הנרות' – האיר לפני המנורה. אהרן לא עבד מכנית – הוא 'העלה' את הנרות, בנשמה. הרמב\"ן: 'להדליק שיהיה הלהב עולה מאליו'. מנהיג טוב לא רק מפעיל – הוא מדליק, ממריץ, מחיה. הדלקת הנרות היא אמנות ההנהגה.",icon:"🕯️"}],[{title:"אספה שבעים זקנים",source:"במדבר יא",text:"'אספה לי שבעים איש מזקני ישראל'. ה' מצווה על ייסוד מוסד: סנהדרין. ההנהגה אינה יכולה להיות יחידה – היא צריכה להישען על קולקטיב של חכמה. 'ונשאו אתך במשא העם ולא תישא אתה לבדך'. הנהגה שיתופית היא בריאות לאומית.",icon:"👨‍⚖️"}]],
    "שלח":       [[{title:"המרגלים – פחד הגדולה",source:"במדבר יג",text:"המרגלים ראו את הארץ הטובה – ובכל זאת אמרו 'לא נוכל'. הם ראו את הענקים ואמרו: 'ונהי בעינינו כחגבים'. הבעיה לא הייתה במציאות – הייתה בתפיסה העצמית. כשאדם רואה את עצמו כחגב – הוא פועל כחגב. כלב ויהושע ראו אותו דבר ובטחו בה'.",icon:"🕵️"}],[{title:"חלה – ראשית לה'",source:"במדבר טו",text:"'מראשית עריסותיכם תרימו חלה תרומה'. מהלחם הראשון – תנו לה'. הקדמת ה' לפני עצמנו. 'כבד את ה' מהונך ומראשית כל תבואתך'. עיקרון ה'ראשית': לא מה שנשאר נותנים – אלא מהראשון, מהטוב ביותר. זה מה שמקדש את השאר.",icon:"🍞"}]],
    "קרח":       [[{title:"מחלוקת שלא לשם שמים",source:"אבות ה",text:"'כל מחלוקת שהיא לשם שמים סופה להתקיים. שלא לשם שמים – אין סופה להתקיים'. מחלוקת קרח לא הייתה לשם שמים – הייתה לשם כבוד עצמי. 'כי כל העדה כולם קדושים' – טענה שנראית כדמוקרטיה אבל היא רק כיסוי לשאיפת שלטון.",icon:"⚡"}],[{title:"עץ השקדים – נצחון השירות",source:"במדבר יז",text:"אחרי מחלוקת קרח, ה' הוכיח את בחירת אהרן: מטהו הצמיח שקדים. השקד פורח לפני כולם – 'שקד' גם מלשון 'לשקוד', עבודה שקדנית. אהרן זכה לא בגלל כוח אלא בגלל שרות. ה'ראיה' לנבחר האמיתי היא פרי עבודתו.",icon:"🌸"}]],
    "חקת":       [[{title:"פרה אדומה – חוק שמעל הדעת",source:"במדבר יט",text:"פרה אדומה היא 'חוק' – חוק שאין לו טעם מובן. אותה פרה מטהרת את הטמאים ומטמאת את הטהורים. שלמה המלך אמר שזה הכי רחוק מהבנתו. יש בתורה דברים שמעל לשכל. כשאנחנו מקיימים גם את מה שלא מבינים – זה ביטוי עמוק של אמונה.",icon:"🐄"}],[{title:"מי מריבה – כוח וחולשה",source:"במדבר כ",text:"'ויך את הסלע' – משה הוכה בסלע במקום לדבר אליו. ה' אמר לו 'לא הקדשתם אותי'. משה, הגדול שבנביאים, נענש על פעולה קטנה. ממי שניתן לו הרבה – נדרש הרבה. 'נאמן ביתי הוא' – ממנהיג נאמן מצפים לדיוק מוחלט.",icon:"💧"}]],
    "בלק":       [[{title:"בלעם – נביא שלא שינה",source:"במדבר כב",text:"בלעם היה נביא אמיתי. ה' דיבר איתו. אך הוא ביקש לקלל את ישראל. ה' הפך את הקללה לברכה. בלעם ניסה שלוש פעמים – ושלוש פעמים בירך. המסר: ה' שומר על ישראל גם ממי שניסה לפגוע בהם.",icon:"🐴"}],[{title:"מה טובו אוהליך יעקב",source:"במדבר כד",text:"'מה טובו אוהליך יעקב, משכנותיך ישראל' – בלעם, בניסיונו לקלל, פתח בברכה יפה שאנחנו אומרים עד היום בתפילה. אירוני: הגדול ביותר בברכת ישראל בא מאויב. הקדוש ברוך הוא יכול להוציא ברכה ממי שלא ציפינו לה.",icon:"🌟"}]],
    "פינחס":     [[{title:"קנאות לשם שמים",source:"במדבר כה",text:"פינחס עצר מגפה בגלל מעשה קנאי. הוא לא חיכה לאישור – הוא פעל. חז\"ל הסבירו: קנאות לשם שמים – כשהיא במקומה – עוצרת חורבן. אבל גם הוסיפו: אם שאל, לא היו מורים לו כן. יש פעולות שנכונות בדיעבד, אך אין להמליץ עליהן.",icon:"⚔️"}],[{title:"בנות צלופחד – דין לפני משה",source:"במדבר כז",text:"'בנות צלופחד... ותקרבנה לפני משה'. הן תבעו ירושת אביהן. משה לא ידע – שאל את ה'. ה' אמר: 'כן בנות צלופחד דוברות'. לשתוק מול עוול – גם כשהמסגרת לא מכירה בך – זה אומץ. ה' מכיר בצדקתך גם כשהמערכת לא.",icon:"⚖️"}]],
    "מטות":      [[{title:"נדר – כוח הדיבור",source:"במדבר ל",text:"'כל הנודר נדר לה' לא יחל דברו'. הנדר מחייב. 'כל היוצא מפיו יעשה'. הדיבור יוצר מציאות. לכן תורה מקפידה כל כך: אל תינדר, ואם נדרת – קיים. 'טוב אשר לא תידור משתידור ולא תשלם'. כוח הדיבור הוא כוח של בריאה – ויש להשתמש בו בזהירות.",icon:"🗣️"}],[{title:"מלחמת מדין – גמול וסיום",source:"במדבר לא",text:"ישראל נאבקו במדין שהיה אחראי לחטא בעל פעור. בסיום המלחמה, חזרו עם שלל גדול. אך משה כועס: מדוע החיתם את הנשים שגרמו לחטא? הניצחון הצבאי אינו מספיק – צריך לסיים גם את מה שגרם לנפילה הרוחנית.",icon:"⚔️"}]],
    "מסעי":      [[{title:"42 מסעות – מסע הנשמה",source:"ספר הזוהר",text:"42 מסעות של ישראל במדבר. הבעל שם טוב לימד שה-42 מסעות הם 42 תחנות בחיי כל אדם, מלידה עד מוות. בכל תחנה, ה' עמנו. גם כשחונים במקומות קשים – אלה הם 'מסעי בני ישראל אשר יצאו מארץ מצרים' – עדיין במסלול היציאה.",icon:"🗺️"}],[{title:"ערי המקלט – כי יכה אדם",source:"במדבר לה",text:"ערי מקלט נועדו למי שהרג בשגגה. לא לרוצח במזיד. ה' מבחין: יש הבדל בין מזיד לשוגג. המשפט האלוקי מדויק. אדם שפגע בלי כוונה – מוגן. ה'מקלט' הוא לא בריחה מאחריות – הוא הגנה מנקמה עיוורת. ה' אוהב צדק מדויק.",icon:"🏙️"}]],
    "דברים":     [[{title:"אלה הדברים – שפת הנהגה",source:"דברים א",text:"'אלה הדברים אשר דיבר משה'. ספר דברים הוא נאום פרידה של משה. 40 שנה עמד לפני ה' – ועכשיו מדבר אל העם. הנהגה שלמה מסתיימת בהעברת המסר. לא רק לעשות – גם לסכם, לחנך, להדגיש. 'אלה הדברים' – הכל מסתכם בדיבור.",icon:"🎤"}],[{title:"ראה נתתי לפניך",source:"דברים א",text:"'ראה נתתי לפניך את הארץ, בוא ורש'. ה' נתן – אבל ישראל צריכים לקחת. גם ארץ ישראל, גם כל ברכה בחיים – ה' נותן לנו את ה'לפני', אבל אנחנו צריכים לפסוע. הנסכיות מה' אינן פאסיביות – הן זימון לפעולה.",icon:"🌍"}]],
    "ואתחנן":    [[{title:"שמע ישראל – אחדות ה'",source:"דברים ו",text:"'שמע ישראל ה' אלוהינו ה' אחד' – יסוד האמונה. לא רק שה' קיים – הוא אחד. אחד: לא מחולק, לא מורכב, לא מוגבל. כשמכירים בזה – מבינים שאין 'מחוץ לה'' ואין 'בלי ה''. כל מה שקיים – קיים בתוכו. זה שינוי תפיסה מהותי.",icon:"☝️"}],[{title:"ואהבת – מצוות האהבה",source:"דברים ו",text:"'ואהבת את ה' אלוהיך בכל לבבך ובכל נפשך ובכל מאודך'. איך מצווים על אהבה? ה'אהבה' כאן היא לא רגש בלבד – היא כיוון חיים. 'בכל לבבך' – בשני יצריך, טוב ורע. 'בכל מאודך' – אפילו בנסיבות שקשה לאהוב.",icon:"❤️"}]],
    "עקב":       [[{title:"מה ה' שואל מעמך",source:"דברים י",text:"'ועתה ישראל מה ה' אלוהיך שואל מעמך כי אם ליראה' – 'מה' מלשון מעט? רש\"י: גדול הוא אצל ה'. אמר חז\"ל: 'הכל בידי שמים חוץ מיראת שמים'. הבחירה החופשית הגדולה ביותר שניתנה לאדם היא: האם לירא מה' – לבחור בו.",icon:"🙏"}],[{title:"ארץ זבת חלב ודבש",source:"דברים יא",text:"'ארץ אשר ה' אלוהיך דורש אותה תמיד, עיני ה' אלוהיך בה מראשית השנה ועד אחרית שנה'. ה' 'דורש' את הארץ – מסתכל בה, עוקב אחריה. ארץ ישראל היא לא רק גיאוגרפיה – היא נחלת ה' המיוחדת. לחיות בה היא קיום מצווה.",icon:"🌿"}]],
    "ראה":       [[{title:"ראה – בחירה אישית",source:"דברים יא",text:"'ראה אנוכי נותן לפניכם ברכה וקללה' – 'ראה' בלשון יחיד, 'לפניכם' בלשון רבים. כל אחד לחוד, אבל כולם יחד. הבחירה בטוב ובחיים היא אחריות אישית – אף אחד לא יכול לבחור בשבילך. אבל ההשלכות הן על הכלל.",icon:"👁️"}],[{title:"שופטים ושוטרים – מוסדות הצדק",source:"דברים טז",text:"'שופטים ושוטרים תיתן לך בכל שעריך'. שני מוסדות: השופטים – קובעים את הדין. השוטרים – אוכפים אותו. חברה צודקת צריכה שניהם. לא מספיק לדעת מה נכון – צריך גם לאכוף. 'צדק צדק תרדוף' – רדוף, אל תשב ותחכה.",icon:"⚖️"}]],
    "שופטים":    [[{title:"לא תסור – סמכות המסורת",source:"דברים יז",text:"'לא תסור מן הדבר אשר יגידו לך ימין ושמאל'. גם אם נראה לך שהם אומרים ימין שזה שמאל – שמע להם. זה נראה מוקצן, אבל הרעיון: מסורת ומחויבות למוסדות הדת יוצרת רצף. בלי מסגרת – כל אחד עושה מה שנראה בעיניו.",icon:"⚖️"}],[{title:"מלך ישראל – גבולות הכוח",source:"דברים יז",text:"'שום תשים עליך מלך' – מותר למנות מלך. אבל: 'לא ירבה לו סוסים... ולא ירבה לו נשים... וכסף וזהב לא ירבה'. המלך – הכוח הגדול ביותר – חייב בגבולות. ריכוז כוח ועושר מושחת. ה' מגביל את המלך מראש. זה עיקרון דמוקרטי שהקדים את זמנו.",icon:"👑"}]],
    "כי תצא":    [[{title:"כי תצא למלחמה",source:"דברים כא",text:"פרשת כי תצא פותחת במלחמה ובאסיר המלחמה. אפילו בשעת מלחמה – ה' אומר: יש גבולות. יש חוקים. אסיר אינו הפקר. כבוד האדם חל גם על אויב. מלחמה כשרה מבחינה מוסרית אינה מלחמה ללא גבולות.",icon:"⚔️"}],[{title:"שילוח הקן",source:"דברים כב",text:"'שלח תשלח את האם' – מצוות שילוח הקן. לפני שלוקחים ביצים מקן – שלח את האם. 'למען ייטב לך והארכת ימים'. מצווה קטנה, שכר גדול. הרמב\"ן: מלמדת רחמים. כשמורגלים ברחמים על חיות – קל יותר להרגיל לרחמים על אנשים.",icon:"🐦"}]],
    "כי תבוא":   [[{title:"ביכורים – הכרת הטוב",source:"דברים כו",text:"'ולקחת מראשית כל פרי האדמה' – מביאים ביכורים לה'. ואומרים: 'ארמי אובד אבי...' – מספרים את ההיסטוריה. ההכרה בטוב אינה מחשבה פנימית – היא אמירה בפה, בקהל, בקול. 'לפני ה' אלוהיך' – בנוכחות. הביכורים הם תרגיל בהכרת הטוב.",icon:"🍇"}],[{title:"הברכות והקללות",source:"דברים כח",text:"פרשת ברכות וקללות ארוכה מאוד, הקללות ארוכות מהברכות. מדוע? כי ה' ממש רוצה שנבחר בברכה – אז הוא מפרט את הקללה בהרחבה. כהורה שמסביר לילד בפירוט מה יקרה אם לא יישמע – לא מתוך כוונה לקלל, אלא מתוך אהבה שרוצה שנבחר נכון.",icon:"📜"}]],
    "נצבים":     [[{title:"אתם נצבים היום",source:"דברים כט",text:"'אתם נצבים היום כולכם לפני ה' אלוהיכם'. 'כולכם' – ראשיכם, זקניכם, שופטיכם, טפכם, נשיכם, גר. כולם. ברית ה' כוללת את כולם – אין יוצא מן הכלל. 'גם את אשר איננו פה עמנו היום' – גם הדורות הבאים שם. אנחנו שם.",icon:"🤲"}],[{title:"קרובה היא – לא בשמים",source:"דברים ל",text:"'כי קרוב אליך הדבר מאוד בפיך ובלבבך לעשותו'. התורה אינה רחוקה. לא בשמים, לא מעבר לים. היא בפה ובלב. המעשה – 'לעשותו'. אין תירוץ. ה' לא ביקש ממך את האפשרי-אולי – ביקש את המצוי, את מה שקרוב ממש.",icon:"💛"}]],
    "וילך":      [[{title:"כתבו לכם את השירה",source:"דברים לא",text:"'ועתה כתבו לכם את השירה הזאת'. לפני מותו, ה' מצווה את משה לכתוב שירה. מה מתחנך דור לאחר דור? לא רק מצוות – גם שירה. הרגש, הנשמה, ה'שיר' של ישראל. עם ישראל חי לא רק כי יש לו חוקים – אלא כי יש לו שיר.",icon:"🎵"}],[{title:"הסתר פנים ואגנוז",source:"דברים לא",text:"'ואנוכי הסתר אסתיר פני' – ה' מכריז שיסתיר פניו. זה לא נטישה – זה ניסיון. כשה' 'מסתיר', הוא בודק: האם עמך ישמרו אמונתם גם בלי ראייה ברורה? ישראל שרדו גלות ארוכה גם כשה' 'הסתיר'. זה כוחנו.",icon:"🌑"}]],
    "האזינו":    [[{title:"שירת האזינו – עד הסוף",source:"דברים לב",text:"'האזינו השמים ואדברה ותשמע הארץ אמרי פי' – שמים וארץ כעדים. שירת האזינו היא שיר היסטוריה – מהתחלה ועד הסוף. ה' מספר מראש את כל מה שיקרה. ומסיים: 'ראו עתה כי אני אני הוא'. ההיסטוריה כולה – מאז ועד עתה – היא אחת.",icon:"🎶"}],[{title:"יעקב חבל נחלתו",source:"דברים לב",text:"'כי חלק ה' עמו, יעקב חבל נחלתו'. ישראל הם 'חבל' – חבל מדידה, נחלה. ה' 'מדד' לו את ישראל. הגויים הם 'גורלם' – גורל מזדמן. אבל ישראל הם 'חבל' – מדויק, מכוון, מתוכנן. אנחנו לא תוצאת מקרה – אנחנו חלקו המדויק של ה'.",icon:"⭐"}]],
    "וזאת הברכה":[[{title:"ברכת משה – ברכת אב",source:"דברים לג",text:"'וזאת הברכה אשר בירך משה' – הברכה האחרונה. כל שבט מבורך על פי ייחודו. לא ברכה אחת לכולם – ברכה מותאמת. גדולת משה: ידע את ייחוד כל שבט ובירך בהתאם. לברך אחר – צריך להכיר אותו. אהבה היא ראייה.",icon:"✋"}],[{title:"וימת שם משה",source:"דברים לד",text:"'וימת שם משה עבד ה' בארץ מואב על פי ה''. 'על פי ה'' – נשיקת ה'. המוות הגדול ביותר – עם קדושה. 'ולא ידע איש את קבורתו עד היום'. קבורת משה נסתרת – כי הוא שייך לנצח. הגדולה האמיתית אינה צריכה מצבה. היא חיה בתוך הלבבות.",icon:"🌅"}]]
  };

  // ── Hebrew year index: 0=even year (5786,5788…), 1=odd (5787,5789…) ──
  var YR = (function(){
    try{ return parseInt(new Intl.DateTimeFormat('en-u-ca-hebrew',{year:'numeric'}).format(new Date())) % 2; }
    catch(e){ return 0; }
  })();

  function stripNikud(s){ return (s||'').replace(/־/g,'-').replace(/[֑-ׇ]/g,''); }

  function matchMoad(name) {
    if (!name) return null;
    if (name.indexOf("שבועות") >= 0) return "שבועות";
    if (name.indexOf("ראש השנה") >= 0) return "ראש השנה";
    if (name.indexOf("שמחת תורה") >= 0) return "שמחת תורה";
    if (name.indexOf("יום כיפור") >= 0 || name.indexOf("כיפור") >= 0) return "יום כיפור";
    if (name.indexOf("הושענא רבה") >= 0 || name.indexOf("סוכות") >= 0) return "סוכות";
    if (name.indexOf("חנוכה") >= 0) return "חנוכה";
    if (name.indexOf("פורים") >= 0) return "פורים";
    if (name.indexOf("פסח") >= 0) return "פסח";
    if (name.indexOf("בעומר") >= 0) return "לג בעומר";
    if (name.indexOf("תשעה באב") >= 0 || name.indexOf("תשעא") >= 0) return "תשעה באב";
    if (name.indexOf("צום גדליה") >= 0) return "צום גדליה";
    if (name.indexOf("תענית אסתר") >= 0 || name.indexOf("צום אסתר") >= 0) return "צום אסתר";
    if (name.indexOf("שבעה עשר") >= 0 || name.indexOf("י\"ז בתמוז") >= 0) return "שבעה עשר בתמוז";
    if (name.indexOf("עשרה בטבת") >= 0 || name.indexOf("י' בטבת") >= 0) return "עשרה בטבת";
    if (name.indexOf("ראש חודש") >= 0) return "ראש חודש";
    if (name.indexOf("שבת") >= 0) return "שבת";
    return null;
  }

  // ── Generic popup: items[], displayName, prefixLabel ──
  function openTorahPopup(items, displayName, prefixLabel) {
    var idx = 0;
    var old = document.getElementById("moad-torah-modal");
    if (old) old.remove();
    if (!items || !items.length) items = [{title:displayName,source:"",text:"דברי תורה על "+displayName+" יתווספו בקרוב.",icon:"📖"}];
    var modal = document.createElement("div");
    modal.id = "moad-torah-modal";
    modal.setAttribute("role","dialog"); modal.setAttribute("aria-modal","true");
    modal.style.cssText="position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);padding:1rem;";
    function buildCard(i){
      var t=items[i];
      var dots=items.map(function(_,j){return '<div style="width:'+(j===i?'20px':'8px')+';height:8px;border-radius:4px;background:'+(j===i?'#c4b5fd':'rgba(196,181,253,0.3)')+';transition:all 0.3s;margin:0 3px;"></div>';}).join("");
      return '<div style="background:linear-gradient(145deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);border:1px solid rgba(139,92,246,0.4);border-radius:2rem;padding:2rem 1.75rem 1.5rem;max-width:480px;width:100%;max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.05);">'+
        '<button id="moad-close" style="position:absolute;top:1.1rem;left:1.1rem;background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:2.1rem;height:2.1rem;cursor:pointer;color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;" aria-label="סגור">✕</button>'+
        '<div style="text-align:center;margin-bottom:1.5rem;">'+
          '<div style="font-size:2.2rem;margin-bottom:0.5rem;">'+t.icon+'</div>'+
          '<div style="font-size:0.7rem;letter-spacing:0.12em;color:#7c3aed;font-weight:700;text-transform:uppercase;margin-bottom:0.3rem;">'+(prefixLabel||"דבר תורה ל")+displayName+'</div>'+
          (t.source?'<p style="font-size:0.78rem;color:#7c3aed;margin:0;font-weight:600;">— '+t.source+'</p>':'')+
        '</div>'+
        '<div style="height:1px;background:linear-gradient(to right,transparent,rgba(139,92,246,0.4),transparent);margin-bottom:1.25rem;"></div>'+
        '<p style="font-size:0.95rem;line-height:1.85;color:#cbd5e1;direction:rtl;text-align:right;margin:0 0 1.5rem;">'+t.text+'</p>'+
        (items.length>1?
          '<div style="display:flex;align-items:center;justify-content:space-between;direction:ltr;margin-bottom:1rem;">'+
            '<button id="moad-prev" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);color:#c4b5fd;border-radius:0.75rem;padding:0.45rem 1rem;cursor:pointer;font-size:1.1rem;opacity:'+(i===0?'0.3':'1')+';'+(i===0?'pointer-events:none;':'')+'">‹</button>'+
            '<div style="display:flex;align-items:center;">'+dots+'</div>'+
            '<button id="moad-next" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);color:#c4b5fd;border-radius:0.75rem;padding:0.45rem 1rem;cursor:pointer;font-size:1.1rem;opacity:'+(i===items.length-1?'0.3':'1')+';'+(i===items.length-1?'pointer-events:none;':'')+'">›</button>'+
          '</div>'+
          '<p style="text-align:center;font-size:0.72rem;color:#475569;margin:0;">'+(i+1)+' / '+items.length+'</p>'
        :'')+
        '</div>';
    }
    function render(i){
      modal.innerHTML=buildCard(i);
      modal.querySelector("#moad-close").addEventListener("click",function(){modal.remove();});
      if(items.length>1){
        var prev=modal.querySelector("#moad-prev"), next=modal.querySelector("#moad-next");
        if(prev) prev.addEventListener("click",function(){if(idx>0){idx--;render(idx);}});
        if(next) next.addEventListener("click",function(){if(idx<items.length-1){idx++;render(idx);}});
      }
      modal.addEventListener("click",function(e){if(e.target===modal)modal.remove();});
    }
    document.body.appendChild(modal);
    modal.setAttribute("tabindex","-1"); modal.focus();
    render(idx);
    modal.addEventListener("keydown",function(e){
      if(e.key==="Escape") modal.remove();
      if(e.key==="ArrowLeft"&&idx<items.length-1){idx++;render(idx);}
      if(e.key==="ArrowRight"&&idx>0){idx--;render(idx);}
    });
  }

  window._matchMoad = matchMoad;
  window._DT = DT;
  window._openMoadByName = function(name){ window._nextMoadName=name; window.openMoadModal(); };

  window.openMoadModal = function() {
    var moadName = window._nextMoadName || (document.getElementById("stat-next")||{}).textContent || "";
    var key = matchMoad(moadName);
    var allV = key ? (DT[key]||null) : null;
    var items = allV ? (allV[YR]||allV[0]||[]) : [];
    openTorahPopup(items, key||moadName||"החג הקרוב", "דבר תורה ל");
  };

  window.openMonthTorahModal = function() {
    var month = stripNikud(new Intl.DateTimeFormat("he-IL-u-ca-hebrew",{month:"long"}).format(new Date())).trim();
    var variants = MONTH_DT[month]||null;
    var item = variants ? (variants[YR]||variants[0]) : null;
    if(!item) item={title:"חודש "+month,source:"",text:"דברי תורה על חודש "+month+" יתווספו בקרוב.",icon:"🌙"};
    openTorahPopup([item],"חודש "+month,"דבר תורה לחודש ");
  };

  window.openParshaTorahModal = function() {
    var raw = stripNikud(window.SHABBAT_PARASHA_NAME||"").replace(/^פרשת\s+/,"").replace(/^שבת\s+/,"").trim();
    var variants = PARSHA_DT[raw] || null;
    var displayName = raw;
    if (!variants && raw.indexOf('-') >= 0) {
      var parts = raw.split('-');
      for (var pi = 0; pi < parts.length; pi++) {
        variants = PARSHA_DT[parts[pi].trim()] || null;
        if (variants) break;
      }
    }
    var items = variants ? (variants[YR]||variants[0]||[]) : [];
    if (!items || !items.length) items = [{title:"פרשת "+displayName,source:"",text:"דברי תורה על פרשת "+displayName+" יתווספו בקרוב.",icon:"📖"}];
    openTorahPopup(items,"פרשת "+displayName,"דבר תורה ל");
  };

})();
