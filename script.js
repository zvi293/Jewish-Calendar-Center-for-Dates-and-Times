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
  settings_city_placeholder: "Tapez un nom de ville (anglais ou hֳ©breu)...",
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
    gpsError: "Unable to detect location. Restoring the previous setting.",
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
    sefariaMissing: "No text was found for this item in the open database.",
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
    weekdayHeaders: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
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
  weekdayNames: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
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
  return new Intl.DateTimeFormat(getCurrentLocale(), options).format(date);
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

  status.textContent = compassListener ? ui.compassRotate : ui.compassLocating;
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
        btn.classList.remove(
          "bg-white/90",
          "text-slate-800",
          "border-slate-200",
          "hover:bg-slate-100",
        );
        btn.classList.add(
          "bg-blue-700/90",
          "text-white",
          "border-blue-600",
          "hover:bg-blue-800",
        );
      } else {
        btn.classList.remove(
          "bg-blue-700/90",
          "border-blue-600",
          "hover:bg-blue-800",
        );
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
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${window.scrollY}px`;
    document.body.dataset.scrollY = window.scrollY;
  }
}
function unlockBodyScroll() {
  _modalScrollLockCount = Math.max(0, _modalScrollLockCount - 1);
  if (_modalScrollLockCount === 0) {
    const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  }
}
// History-based back button: push state when modal opens, pop to close
let _activeModals = [];
function pushModalState(modalId) {
  _activeModals.push(modalId);
  history.pushState({ modal: modalId }, "");
}
function removeModalById(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    if (el.classList.contains("hidden")) return;
    if (el.remove) el.remove();
    else el.classList.add("hidden");
  }
  unlockBodyScroll();
}
window.addEventListener("popstate", function (e) {
  if (_activeModals.length > 0) {
    const modalId = _activeModals.pop();
    // Close the specific modal
    if (
      modalId === "prayer-modal" ||
      modalId === "tehillim-modal" ||
      modalId === "calendar-day-modal" ||
      modalId === "zman-opinions-modal"
    ) {
      const el = document.getElementById(modalId);
      if (el) el.remove();
      unlockBodyScroll();
    } else if (modalId === "sefaria-modal") {
      closeSefariaModal();
      unlockBodyScroll();
    } else if (modalId === "calendar-modal") {
      closeCalendar();
      unlockBodyScroll();
    } else if (modalId === "settings-modal") {
      toggleSettings();
    } else if (modalId === "compass-modal") {
      closeCompass();
      unlockBodyScroll();
    } else if (modalId === "omer-modal") {
      const el = document.getElementById(modalId);
      if (el) {
        el.classList.add("opacity-0");
        setTimeout(() => el.classList.add("hidden"), 300);
      }
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
let CURRENT_THEME = ["light", "blue"].includes(
  localStorage.getItem("moadim_theme"),
)
  ? localStorage.getItem("moadim_theme")
  : "light";
let CURRENT_LANG = localStorage.getItem("moadim_lang") || "he";
let CURRENT_NUSACH = localStorage.getItem("moadim_nusach") || "mizrahi";
const DAY_NOTES_STORAGE_KEY = "moadim_day_notes";
const FS_LABELS = ["רגיל", "גדול", "גדול מאוד"];

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
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
    navigator.clipboard.writeText(`${SITE_SHARE_TEXT} ${SITE_URL}`).then(() => {
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
    document.querySelector(".chip.active")?.id?.replace("btn-", "") || "all",
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
  const html = document.documentElement;
  const header = document.getElementById("hero-section");
  const iconMoon = document.getElementById("theme-icon-moon");
  const iconSun = document.getElementById("theme-icon-sun");
  const iconWave = document.getElementById("theme-icon-wave");
  const glowWrap = header
    ? header.querySelector(".absolute.inset-0.z-0")
    : null;
  const wavePath = document.querySelector(".wave-divider path");
  const themeMetaTag = document.querySelector('meta[name="theme-color"]');
  const nextTheme = theme === "blue" ? "blue" : "light";

  // Hide all icons
  [iconMoon, iconSun, iconWave].forEach(
    (el) => el && el.classList.add("hidden"),
  );
  CURRENT_THEME = nextTheme;
  localStorage.setItem("moadim_theme", nextTheme);
  html.classList.remove("dark");

  if (nextTheme === "blue") {
    html.classList.add("theme-blue");
    header.classList.remove("gradient-bg");
    header.classList.add("bg-ocean-readable");
    // CSS rule `.bg-ocean-readable #stars-canvas { opacity:0 }` hides stars automatically
    if (glowWrap) glowWrap.style.opacity = "0";
    if (wavePath) wavePath.style.fill = "rgb(248 250 252)";
    if (themeMetaTag) themeMetaTag.content = "#0284c7";
    if (iconMoon) iconMoon.classList.remove("hidden");
  } else {
    // light — default stars background
    html.classList.remove("theme-blue");
    header.classList.remove("bg-ocean-readable");
    header.classList.add("gradient-bg");
    if (glowWrap) glowWrap.style.opacity = "1";
    if (wavePath) wavePath.style.fill = "rgb(248 250 252)";
    if (themeMetaTag) themeMetaTag.content = "#0f172a";
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
    window.FETCHED_YEARS =
      window.FETCHED_YEARS || new Set([_todayY - 1, _todayY, _todayY + 1]);
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
  document.getElementById("sefaria-credit-link").textContent = ui.sefariaCredit;

  m.classList.remove("hidden");
  setTimeout(() => m.classList.remove("opacity-0"), 10);
  lockBodyScroll();
  pushModalState("sefaria-modal");
  // Sync font size
  applyPrayerFontSize("#sefaria-modal-content");
  document
    .querySelectorAll("#sefaria-font-bar .font-size-label")
    .forEach((el) => {
      el.textContent = _prayerFontSize + "%";
    });

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
    applyPrayerFontSize("#sefaria-modal-content");
  } catch (e) {
    document.getElementById("sefaria-modal-content").innerHTML =
      "<p class='text-center text-rose-500 font-bold mt-10'>שגיאה בטעינת הטקסט. אנא בדוק חיבור לאינטרנט.</p>";
  }
}

/* ── שניים מקרא ואחד תרגום – modal with Torah + Onkelos ── */
// Shnayim Mikra state
let _shmikraData = {
  torahVerses: [],
  onkelosVerses: [],
  rashiVerses: [],
  parshaName: "",
  torahRef: "",
};
const SHMIKRA_DOUBLE_KEY = "moadim_shmikra_double";
const SHMIKRA_RASHI_KEY = "moadim_shmikra_rashi";

function getShmikraDouble() {
  return localStorage.getItem(SHMIKRA_DOUBLE_KEY) !== "false";
} // default ON
function getShmikraRashi() {
  return localStorage.getItem(SHMIKRA_RASHI_KEY) === "true";
} // default OFF

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
  if (
    newVal &&
    _shmikraData.rashiVerses.length === 0 &&
    _shmikraData.parshaName
  ) {
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
      const rashiRef = `Rashi on ${torahRef}`.replace(/ /g, "_");
      rashiData = await fetchHebcalWithCache(
        `https://www.sefaria.org/api/texts/${encodeURIComponent(rashiRef.replace(/_/g, " "))}?context=0`,
      );
    }

    // Fallback: try parsha name format
    if (!rashiData || !rashiData.he) {
      rashiData = await fetchHebcalWithCache(
        `https://www.sefaria.org/api/texts/Rashi_on_Parashat_${parshaName}?context=0`,
      );
    }

    if (rashiData && rashiData.he) {
      // Rashi data structure: deeply nested arrays
      // [chapter][verse][comment] where comments are strings or arrays of strings
      // We need to flatten to one entry per Torah verse
      const rashiPerVerse = [];

      const processItem = (item) => {
        if (typeof item === "string") {
          return [item];
        }
        if (Array.isArray(item)) {
          // Check if all elements are strings = this is one verse's comments
          if (item.length > 0 && item.every((x) => typeof x === "string")) {
            return item;
          }
          // Check if this is an array of arrays (verse level or chapter level)
          if (item.length > 0 && Array.isArray(item[0])) {
            // Check depth: is item[0][0] a string? Then item = [verse_comments, verse_comments, ...]
            if (item[0].length > 0 && typeof item[0][0] === "string") {
              // Each sub-array is one verse's comments
              item.forEach((verseComments) => {
                if (Array.isArray(verseComments)) {
                  rashiPerVerse.push(
                    verseComments
                      .flat(Infinity)
                      .filter((x) => typeof x === "string"),
                  );
                } else if (typeof verseComments === "string") {
                  rashiPerVerse.push([verseComments]);
                } else {
                  rashiPerVerse.push([]);
                }
              });
              return null; // already pushed
            }
            // Deeper nesting - recurse into each chapter
            item.forEach((chapter) => processItem(chapter));
            return null;
          }
          // Mixed array - flatten strings
          const strings = item
            .flat(Infinity)
            .filter((x) => typeof x === "string");
          if (strings.length > 0) return strings;
          return [];
        }
        return [];
      };

      const heData = rashiData.he;
      if (Array.isArray(heData)) {
        // Check if top level is chapters (array of arrays of arrays)
        if (
          heData.length > 0 &&
          Array.isArray(heData[0]) &&
          heData[0].length > 0 &&
          Array.isArray(heData[0][0])
        ) {
          // Structure: [chapter][verse][comments]
          heData.forEach((chapter) => {
            if (Array.isArray(chapter)) {
              chapter.forEach((verse) => {
                if (Array.isArray(verse)) {
                  rashiPerVerse.push(
                    verse.flat(Infinity).filter((x) => typeof x === "string"),
                  );
                } else if (typeof verse === "string") {
                  rashiPerVerse.push([verse]);
                } else {
                  rashiPerVerse.push([]);
                }
              });
            }
          });
        } else if (heData.length > 0 && Array.isArray(heData[0])) {
          // Structure: [verse][comments]
          heData.forEach((verse) => {
            if (Array.isArray(verse)) {
              rashiPerVerse.push(
                verse.flat(Infinity).filter((x) => typeof x === "string"),
              );
            } else if (typeof verse === "string") {
              rashiPerVerse.push([verse]);
            } else {
              rashiPerVerse.push([]);
            }
          });
        } else {
          // Flat array of strings
          rashiPerVerse.push(heData.filter((x) => typeof x === "string"));
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
    fontBar.insertAdjacentHTML("afterbegin", toggleBarHtml);
    fontBar.style.flexWrap = "nowrap";
    fontBar.style.gap = "0.5rem";
    fontBar.style.justifyContent = "center";
    fontBar.style.alignItems = "center";
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
      if (
        showRashi &&
        rashiVerses &&
        rashiVerses[i] &&
        rashiVerses[i].length > 0
      ) {
        const rashiComments = rashiVerses[i];
        textHtml += `<div style="margin-top:0.5em;padding:0.6em 0.7em;border-radius:0.5em;background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.12);">
                <div style="font-size:0.65em;color:#7c3aed;font-weight:bold;margin-bottom:0.3em;">רש״י:</div>
                ${rashiComments.map((c) => `<p style="line-height:1.8;margin:0 0 0.3em 0;color:#4c1d95;font-size:0.95em;">${c}</p>`).join("")}
              </div>`;
      } else if (showRashi && rashiVerses.length === 0) {
        if (i === 0) {
          textHtml += `<div style="margin-top:0.4rem;font-size:0.75rem;color:#7c3aed;font-style:italic;">טוען פירוש רש״י...</div>`;
        }
      }
      textHtml += `</div>`;
    }
  } else {
    textHtml +=
      "<p class='text-center text-rose-500 font-bold mt-10'>לא נמצא טקסט עבור פרשה זו.</p>";
  }
  el.innerHTML = textHtml;
  // Re-apply font size after content render
  applyPrayerFontSize("#sefaria-modal-content");
}

async function openShnayimMikraModal(hebTitle, enRef) {
  if (!enRef) return;
  const parshaName = enRef.replace(/^Parashat\s+/, "").replace(/ /g, "_");

  const m = document.getElementById("sefaria-modal");
  document.getElementById("sefaria-modal-title").textContent =
    CURRENT_LANG === "he"
      ? `שניים מקרא ואחד תרגום – ${hebTitle}`
      : `Shnayim Mikra – ${enRef}`;
  document.getElementById("sefaria-modal-content").innerHTML =
    '<div class="animate-pulse text-center mt-10">טוען מקרא ותרגום אונקלוס...</div>';
  document.getElementById("sefaria-credit-link").href =
    `https://www.sefaria.org.il/Parashat_${parshaName}?lang=he`;
  document.getElementById("sefaria-credit-link").textContent =
    CURRENT_LANG === "he"
      ? "הטקסט באדיבות Sefaria.org (ברישיון פתוח)"
      : "View on Sefaria";

  m.classList.remove("hidden");
  setTimeout(() => m.classList.remove("opacity-0"), 10);
  lockBodyScroll();
  pushModalState("sefaria-modal");
  // Sync font size
  applyPrayerFontSize("#sefaria-modal-content");
  document
    .querySelectorAll("#sefaria-font-bar .font-size-label")
    .forEach((el) => {
      el.textContent = _prayerFontSize + "%";
    });

  try {
    const torahData = await fetchHebcalWithCache(
      `https://www.sefaria.org/api/texts/Parashat_${parshaName}?context=0`,
    );
    if (!torahData || !torahData.ref) throw new Error("No parsha data");

    const bookName = torahData.ref.split(" ")[0];
    const onkelosRef = `Onkelos_${bookName},_${parshaName}`;
    const onkelosData = await fetchHebcalWithCache(
      `https://www.sefaria.org/api/texts/${onkelosRef}?context=0`,
    );

    const flattenVerses = (arr) => {
      if (!arr) return [];
      const result = [];
      const flatten = (a) => {
        if (Array.isArray(a)) {
          a.forEach((v) => flatten(v));
        } else {
          result.push(a);
        }
      };
      flatten(arr);
      return result;
    };

    _shmikraData = {
      torahVerses: flattenVerses(torahData.he),
      onkelosVerses: flattenVerses(onkelosData?.he),
      rashiVerses: [],
      parshaName: parshaName,
      torahRef: torahData.ref || "",
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
  if (_activeModals[_activeModals.length - 1] === "sefaria-modal") {
    _activeModals.pop();
    history.back();
  }
}

/* ── KosherZmanim helper ─────────────────────────────────── */
function getLocationCoords() {
  // Try GPS first
  if (GEO_LOCATION === "GPS" && GPS_COORDS) {
    return {
      lat: GPS_COORDS.lat,
      lon: GPS_COORDS.lon,
      tzid: "Asia/Jerusalem",
      elevation: GPS_COORDS.elevation || 0,
    };
  }
  // Try cached city coords
  const cached =
    window._cityCoords ||
    (localStorage.getItem("moadim_city_coords")
      ? JSON.parse(localStorage.getItem("moadim_city_coords"))
      : null);
  if (cached) {
    window._cityCoords = cached;
    return cached;
  }
  // Default: Petach Tikva (geonameid 293918) — elevation 54m per KosherJava reference
  return {
    lat: 32.08707,
    lon: 34.88747,
    tzid: "Asia/Jerusalem",
    elevation: 54,
  };
}

function computeKosherZmanim(dateObj) {
  const coords = getLocationCoords();
  const KZ = window.KosherZmanim;
  if (!KZ) {
    console.warn("KosherZmanim library not loaded");
    return null;
  }

  try {
    // Use ComplexZmanimCalendar for all opinion variants
    const geoLoc = new KZ.GeoLocation(
      "UserLocation",
      coords.lat,
      coords.lon,
      coords.elevation || 0,
      coords.tzid || "Asia/Jerusalem",
    );
    const cal = new KZ.ComplexZmanimCalendar(geoLoc);

    // setDate accepts native Date, ISO string, Luxon DateTime, or timestamp
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
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
      } catch (e) {
        return null;
      }
    };

    // Build times object matching HebCal field names
    const times = {};
    try {
      times.alotHaShachar = toIso(cal.getAlos72());
    } catch (e) {}
    try {
      times.misheyakir = toIso(cal.getMisheyakir11Point5Degrees());
    } catch (e) {}
    try {
      times.misheyakirMachmir = toIso(cal.getMisheyakir11Degrees());
    } catch (e) {}
    try {
      times.misheyakir10_2 = toIso(cal.getMisheyakir10Point2Degrees());
    } catch (e) {}
    // Use elevation-adjusted sunrise if elevation > 0
    try {
      if (
        coords.elevation > 0 &&
        typeof cal.getSunriseOffsetByDegrees === "function"
      ) {
        // getElevationAdjustedSunrise is available in newer versions
        const seaLevelSunrise = cal.getSeaLevelSunrise
          ? toIso(cal.getSeaLevelSunrise())
          : null;
        times.sunrise = toIso(cal.getSunrise());
        times.seaLevelSunrise = seaLevelSunrise;
      } else {
        times.sunrise = toIso(cal.getSunrise());
      }
    } catch (e) {
      try {
        times.sunrise = toIso(cal.getSunrise());
      } catch (e2) {}
    }
    try {
      times.sofZmanShmaMGA = toIso(cal.getSofZmanShmaMGA());
    } catch (e) {}
    try {
      times.sofZmanShma = toIso(cal.getSofZmanShmaGRA());
    } catch (e) {}
    try {
      times.sofZmanTfillaMGA = toIso(cal.getSofZmanTfilaMGA());
    } catch (e) {}
    try {
      times.sofZmanTfilla = toIso(cal.getSofZmanTfilaGRA());
    } catch (e) {}
    try {
      times.chatzot = toIso(cal.getChatzos());
    } catch (e) {}
    try {
      times.minchaGedola = toIso(cal.getMinchaGedola());
    } catch (e) {}
    try {
      times.minchaGedola72Min = toIso(cal.getMinchaGedola72Minutes());
    } catch (e) {}
    try {
      times.minchaKetana = toIso(cal.getMinchaKetana());
    } catch (e) {}
    try {
      times.plagHaMincha = toIso(cal.getPlagHamincha());
    } catch (e) {}
    try {
      times.plagHaMinchaGRA =
        toIso(cal.getPlagHaminchaBaalHatanya()) || times.plagHaMincha;
    } catch (e) {
      times.plagHaMinchaGRA = times.plagHaMincha;
    }
    try {
      times.sunset = toIso(cal.getSunset());
    } catch (e) {}
    try {
      times.seaLevelSunset = toIso(cal.getSeaLevelSunset());
    } catch (e) {
      times.seaLevelSunset = times.sunset;
    }
    try {
      times.tzeit7083deg = toIso(cal.getTzaisGeonim7Point083Degrees());
    } catch (e) {}
    try {
      if (!times.tzeit7083deg) times.tzeit7083deg = toIso(cal.getTzais72());
    } catch (e) {}
    try {
      times.tzeit50min = toIso(cal.getTzais50());
    } catch (e) {}
    // tzeit 13.5 zmanit minutes: sunset + 13.5/60 of a shaah zmanit
    try {
      if (times.sunrise && times.sunset) {
        const srMs = new Date(times.sunrise).getTime();
        const ssMs = new Date(times.sunset).getTime();
        const shaahZmanit = (ssMs - srMs) / 12;
        times.tzeit13Point5MinutesZmanis = new Date(
          ssMs + (13.5 / 60) * shaahZmanit,
        ).toISOString();
      }
    } catch (e) {}
    try {
      times.chatzotNight = toIso(cal.getSolarMidnight());
    } catch (e) {}
    // Bein HaShmashos: RT 2 stars (matches KosherJava app)
    try {
      times.beinHaShmashos = toIso(cal.getBainHashmashosRT2Stars());
    } catch (e) {
      try {
        times.beinHaShmashos = toIso(cal.getBainHashmashosRT13Point24Degrees());
      } catch (e2) {}
    }
    // Tzeit at 8.5° = Lailah (night per KosherJava app)
    try {
      times.tzeit8_5deg = toIso(cal.getTzaisGeonim8Point5Degrees());
    } catch (e) {
      try {
        times.tzeit8_5deg = toIso(cal.getSunsetOffsetByDegrees(98.5));
      } catch (e2) {}
    }

    // Candle lighting: per KosherJava, uses SEA-LEVEL sunset (not elevation-adjusted)
    // Offset: 40 min Jerusalem, 20 min Israel, 18 min abroad
    const isJerusalem =
      typeof isInJerusalem === "function" &&
      isInJerusalem(coords.lat, coords.lon);
    const isIsrael =
      coords.lat >= 29.4 &&
      coords.lat <= 33.5 &&
      coords.lon >= 34.2 &&
      coords.lon <= 35.9;
    const candleOffset = isJerusalem ? 40 : isIsrael ? 20 : 18;
    const candleSunset = times.seaLevelSunset || times.sunset;
    if (candleSunset) {
      const sunsetMs = new Date(candleSunset).getTime();
      times.candleLighting = new Date(
        sunsetMs - candleOffset * 60000,
      ).toISOString();
    }

    return { times };
  } catch (e) {
    console.warn("computeKosherZmanim error:", e);
    return null;
  }
}

/* Resolve coordinates from GeoNameId if not yet cached */
async function ensureCityCoords() {
  if (GEO_LOCATION === "GPS" && GPS_COORDS) return;
  if (window._cityCoords) return;
  const cached = localStorage.getItem("moadim_city_coords");
  if (cached) {
    window._cityCoords = JSON.parse(cached);
    return;
  }

  // Fetch from HebCal to get coordinates for the geonameid
  try {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const res = await fetch(
      `https://www.hebcal.com/zmanim?cfg=json&geonameid=${GEO_LOCATION}&date=${todayIso}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const data = await res.json();
    if (data.location) {
      const cityCoords = {
        lat: data.location.latitude,
        lon: data.location.longitude,
        tzid: data.location.timezone || "Asia/Jerusalem",
        elevation: data.location.elevation || 0,
      };
      localStorage.setItem("moadim_city_coords", JSON.stringify(cityCoords));
      window._cityCoords = cityCoords;
    }
  } catch (e) {
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
    const kzPrev = computeKosherZmanim(prevDate);
    const kzNext = computeKosherZmanim(nextDate);

    if (kzToday && kzToday.times && kzToday.times.sunrise) {
      zData = kzToday;
      prevZData = kzPrev || { times: {} };
      nextZData = kzNext || { times: {} };
      zmanimSource = "kosher-zmanim";
      /* KosherZmanim computed successfully — silent in production */
    } else {
      // Fallback to HebCal API only if kosher-zmanim library failed to load
      console.warn(
        "⚠ KosherZmanim library not available, falling back to HebCal API. KZ loaded:",
        !!window.KosherZmanim,
      );
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
    if (srcBadge)
      srcBadge.textContent =
        zmanimSource === "kosher-zmanim" ? "KosherJava" : "HebCal";
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
      document.getElementById("omer-day-num").textContent = CURRENT_OMER_DAY;
      if (typeof updateOmerRing === "function")
        updateOmerRing(CURRENT_OMER_DAY);
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
        if (i.category === "candles" && i.title && i.title.includes("Candle")) {
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
    } catch (e) {
      console.warn("KZ Shabbat times:", e);
    }
    document.getElementById("stat-parasha").textContent = p;
    window._openShabbatParasha = () => openSefariaModal(p, eTitle);
    // Store for Shabbat info popup
    window.SHABBAT_CANDLES_STR = c;
    window.SHABBAT_HAVDALAH_STR = h;
    window.SHABBAT_PARASHA_NAME = p;
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
    [...(y0.items || []), ...y1.items, ...y2.items].forEach((ev) => {
      if (ev.category === "roshchodesh") {
        const _rcKey = ev.hebrew + "_" + ev.date.substring(0, 7);
        rcCounts[_rcKey] = (rcCounts[_rcKey] || 0) + 1;
      }
    });

    [...(y0.items || []), ...y1.items, ...y2.items].forEach((ev) => {
      const eventDate = new Date(ev.date);
      eventDate.setHours(0, 0, 0, 0);

      const forbidden = [
        // Removed from display: political/minor national figures
        "Herzl",
        "Rabin",
        "Aliyah",
        "Family", // חג הבנות
        "Sigd",
        "Zionism",
        "Jabotinsky",
        "Ben-Gurion", // יום בן-גוריון
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
      if (ev.category === "candles" && ev.date.startsWith(todayLocalIso)) {
        if (new Date(ev.date).getDay() !== 5) {
          window.HOLIDAY_CANDLES_TIME = new Date(ev.date);
        }
      }

      if (ev.category === "roshchodesh") {
        const _rcMonthName = ev.hebrew
          .replace("ראש חודש ", "")
          .split(" (")[0]
          .trim();
        let rcName =
          CURRENT_LANG === "he" ? `ראש חודש ${_rcMonthName}` : ev.title;
        const _rcKeyCheck = ev.hebrew + "_" + ev.date.substring(0, 7);
        if (rcCounts[_rcKeyCheck] > 1) {
          const countSoFar = newEvents.filter(
            (x) =>
              x.originalName === ev.hebrew &&
              x.date.substring(0, 7) === ev.date.substring(0, 7),
          ).length;
          rcName =
            CURRENT_LANG === "he"
              ? `${countSoFar === 0 ? "א'" : "ב'"} ראש חודש ${_rcMonthName}`
              : `${ev.title} Day ${countSoFar + 1}`;
        }

        if (!newEvents.some((x) => x.name === rcName && x.date === ev.date)) {
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
              const mo = String(d.getMonth() + 1).padStart(2, "0");
              const dy = String(d.getDate()).padStart(2, "0");
              return `${y}-${mo}-${dy}`;
            };
            const dStr =
              startL > dateForHebcal
                ? toLocalISO(startL)
                : toLocalISO(dateForHebcal);

            if (!newEvents.some((x) => x.name === name && x.type === "moon")) {
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
        if (
          ev.title.includes("Shoah") ||
          (ev.hebrew && ev.hebrew.includes("שואה"))
        ) {
          icon = "🕯️";
          type = "fast";
        } else if (
          ev.title.includes("Zikaron") ||
          (ev.hebrew && ev.hebrew.includes("זיכרון"))
        ) {
          icon = "🪖";
          type = "fast";
        } else if (
          ev.title.includes("Atzmaut") ||
          (ev.hebrew && ev.hebrew.includes("עצמאות"))
        ) {
          icon = "🇮🇱";
          type = "major";
        } else {
          icon = "📅";
        }
      } else if (ev.category === "parashat") {
        type = "parashat";
        icon = "📖";
      } else return;

      const evName = CURRENT_LANG === "he" ? ev.hebrew : ev.title;
      if (!newEvents.some((x) => x.name === evName && x.date === ev.date)) {
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
        const compareDate = e.type === "moon" && e.endDate ? e.endDate : e.date;
        return (
          new Date(compareDate).setHours(0, 0, 0, 0) >= dateForHebcal.getTime()
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    window.ALL_EVENTS_FULL = [...newEvents].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    window.FETCHED_YEARS = new Set([cy - 1, cy, cy + 1]);
    localStorage.setItem("moadim_cached_events_v2", JSON.stringify(ALL_EVENTS));
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
  if (prayerWrap) {
    prayerWrap.classList.remove("hidden");
  }
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
  const heb = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    month: "long",
    day: "numeric",
  }).format(now);
  const month = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    month: "long",
  }).format(now);
  const day = parseInt(
    new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" }).format(
      now,
    ),
  );
  const dow = now.getDay(); // 0=Sun … 6=Sat

  // Detect season flags
  const isShabbat = dow === 6;
  const isRoshChodesh =
    heb.includes("א׳") || heb.includes("ב׳") || day === 1 || day === 30;
  const isChanukah = (month.includes("כסלו") && day >= 25) || (month.includes("טבת") && day <= 3);
  const isPurim =
    month.includes("אדר") && (day === 13 || day === 14 || day === 15);
  const isPesach = month.includes("ניסן") && day >= 15 && day <= 22;
  const isShavuot = month.includes("סיון") && (day === 6 || day === 7);
  const isSukkot = month.includes("תשרי") && day >= 15 && day <= 23;
  const isYomKippur = month.includes("תשרי") && day === 10;
  const isRoshHaShana = month.includes("תשרי") && (day === 1 || day === 2);
  const isOmer =
    (month.includes("ניסן") && day >= 16) ||
    month.includes("אייר") ||
    (month.includes("סיון") && day < 6);
  const isYamimNoraim = month.includes("תשרי") && day >= 1 && day <= 10;

  return {
    isShabbat,
    isRoshChodesh,
    isChanukah,
    isPurim,
    isPesach,
    isShavuot,
    isSukkot,
    isYomKippur,
    isRoshHaShana,
    isOmer,
    isYamimNoraim,
    month,
    day,
    dow,
  };
}

// ── Prayer texts database ─────────────────────────
const PRAYER_DB = {
  "tefillat-haderech": {
    title: "תפילת הדרך",
    nusach: {
      mizrahi: `יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם, וְתַצְעִידֵנוּ לְשָׁלוֹם, וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְשָׁלוֹם: <span style="font-size:0.78em;color:#94a3b8;">(אִם חוֹזֵר בּוֹ בַּיּוֹם מוֹסִיף: וְתַחֲזִירֵנוּ לְשָׁלוֹם)</span>, וְתַצִּילֵנוּ מִכַּף כָּל-אוֹיֵב וְאוֹרֵב בַּדֶּרֶךְ, וְתִשְׁלַח בְּרָכָה בְּמַעֲשֵׂי יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל-רוֹאֵינוּ, וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ. כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה. בָּרוּךְ אַתָּה יְהֹוָה שׁוֹמֵעַ תְּפִלָּה:\n\nוַיַּעֲקֹב הָלַךְ לְדַרְכּוֹ, וַיִּפְגְּעוּ בוֹ מַלְאֲכֵי אֱלֹהִים: וַיֹּאמֶר יַעֲקֹב כַּאֲשֶׁר רָאָם, מַחֲנֵה אֱלֹהִים זֶה, וַיִּקְרָא שֵׁם הַמָּקוֹם הַהוּא מַחֲנָיִם:\n\n(ג' פעמים) וַיִּסָּעוּ, וַיְהִי חִתַּת אֱלֹהִים עַל הֶעָרִים אֲשֶׁר סְבִיבוֹתֵיהֶם, וְלֹא רָדְפוּ אַחֲרֵי בְּנֵי יַעֲקֹב:\n\nלִישׁוּעָתְךָ קִוִּיתִי יְהֹוָה (ג' פעמים)\n\nיְבָרֶכְךָ יְהֹוָה וְיִשְׁמְרֶךָ: | יָאֵר יְהֹוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ: | יִשָּׂא יְהֹוָה פָּנָיו אֵלֶיךָ, וְיָשֵׂם לְךָ שָׁלוֹם: (ג' פעמים)`,
      ashkenaz: `יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתּוֹלִיכֵנוּ לְשָׁלוֹם וְתַצְעִידֵנוּ לְשָׁלוֹם וְתַדְרִיכֵנוּ לְשָׁלוֹם, וְתִסְמְכֵנוּ לְשָׁלוֹם וְתַגִּיעֵנוּ לִמְחוֹז חֶפְצֵנוּ לְחַיִּים וּלְשִׂמְחָה וּלְשָׁלוֹם. וְתַצִּילֵנוּ מִכַּף כָּל אוֹיֵב וְאוֹרֵב וְלִסְטִים וְחַיּוֹת רָעוֹת בַּדֶּרֶךְ, וּמִכָּל מִינֵי פֻּרְעָנֻיּוֹת הַמִּתְרַגְּשׁוֹת לָבוֹא לָעוֹלָם. וְתִשְׁלַח בְּרָכָה בְּכָל מַעֲשֵׂה יָדֵינוּ, וְתִתְּנֵנוּ לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ. וְתִשְׁמַע קוֹל תַּחֲנוּנֵינוּ, כִּי אֵל שׁוֹמֵעַ תְּפִלָּה וְתַחֲנוּן אָתָּה.\n\nבָּרוּךְ אַתָּה יְהֹוָה, שׁוֹמֵעַ תְּפִלָּה.`,
    },
    seasonal: () => "",
  },

  shema: {
    title: "קריאת שמע",
    nusach: {
      all: `שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵינוּ יְהֹוָה אֶחָד:\nבָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:\n\nוְאָהַבְתָּ אֵת יְהֹוָה אֱלֹהֶיךָ בְּכָל לְבָבְךָ וּבְכָל נַפְשְׁךָ וּבְכָל מְאֹדֶךָ. וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ. וְשִׁנַּנְתָּם לְבָנֶיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ. וּקְשַׁרְתָּם לְאוֹת עַל יָדֶךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶיךָ. וּכְתַבְתָּם עַל מְזוּזֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ:\n\nוְהָיָה אִם שָׁמֹעַ תִּשְׁמְעוּ אֶל מִצְוֹתַי אֲשֶׁר אָנֹכִי מְצַוֶּה אֶתְכֶם הַיּוֹם לְאַהֲבָה אֶת יְהֹוָה אֱלֹהֵיכֶם וּלְעָבְדוֹ בְּכָל לְבַבְכֶם וּבְכָל נַפְשְׁכֶם. וְנָתַתִּי מְטַר אַרְצְכֶם בְּעִתּוֹ יוֹרֶה וּמַלְקוֹשׁ וְאָסַפְתָּ דְגָנֶךָ וְתִירֹשְׁךָ וְיִצְהָרֶךָ. וְנָתַתִּי עֵשֶׂב בְּשָׂדְךָ לִבְהֶמְתֶּךָ וְאָכַלְתָּ וְשָׂבָעְתָּ. הִשָּׁמְרוּ לָכֶם פֶּן יִפְתֶּה לְבַבְכֶם וְסַרְתֶּם וַעֲבַדְתֶּם אֱלֹהִים אֲחֵרִים וְהִשְׁתַּחֲוִיתֶם לָהֶם. וְחָרָה אַף יְהֹוָה בָּכֶם וְעָצַר אֶת הַשָּׁמַיִם וְלֹא יִהְיֶה מָטָר וְהָאֲדָמָה לֹא תִתֵּן אֶת יְבוּלָהּ וַאֲבַדְתֶּם מְהֵרָה מֵעַל הָאָרֶץ הַטֹּבָה אֲשֶׁר יְהֹוָה נֹתֵן לָכֶם. וְשַׂמְתֶּם אֶת דְּבָרַי אֵלֶּה עַל לְבַבְכֶם וְעַל נַפְשְׁכֶם וּקְשַׁרְתֶּם אֹתָם לְאוֹת עַל יֶדְכֶם וְהָיוּ לְטוֹטָפֹת בֵּין עֵינֵיכֶם. וְלִמַּדְתֶּם אֹתָם אֶת בְּנֵיכֶם לְדַבֵּר בָּם בְּשִׁבְתְּךָ בְּבֵיתֶךָ וּבְלֶכְתְּךָ בַדֶּרֶךְ וּבְשָׁכְבְּךָ וּבְקוּמֶךָ. וּכְתַבְתָּם עַל מְזוּזוֹת בֵּיתֶךָ וּבִשְׁעָרֶיךָ. לְמַעַן יִרְבּוּ יְמֵיכֶם וִימֵי בְנֵיכֶם עַל הָאֲדָמָה אֲשֶׁר נִשְׁבַּע יְהֹוָה לַאֲבֹתֵיכֶם לָתֵת לָהֶם כִּימֵי הַשָּׁמַיִם עַל הָאָרֶץ:\n\nוַיֹּאמֶר יְהֹוָה אֶל מֹשֶׁה לֵּאמֹר: דַּבֵּר אֶל בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם וְעָשׂוּ לָהֶם צִיצִת עַל כַּנְפֵי בִגְדֵיהֶם לְדֹרֹתָם וְנָתְנוּ עַל צִיצִת הַכָּנָף פְּתִיל תְּכֵלֶת. וְהָיָה לָכֶם לְצִיצִת וּרְאִיתֶם אֹתוֹ וּזְכַרְתֶּם אֶת כָּל מִצְוֹת יְהֹוָה וַעֲשִׂיתֶם אֹתָם וְלֹא תָתוּרוּ אַחֲרֵי לְבַבְכֶם וְאַחֲרֵי עֵינֵיכֶם אֲשֶׁר אַתֶּם זֹנִים אַחֲרֵיהֶם. לְמַעַן תִּזְכְּרוּ וַעֲשִׂיתֶם אֶת כָּל מִצְוֹתָי וִהְיִיתֶם קְדֹשִׁים לֵאלֹהֵיכֶם. אֲנִי יְהֹוָה אֱלֹהֵיכֶם אֲשֶׁר הוֹצֵאתִי אֶתְכֶם מֵאֶרֶץ מִצְרַיִם לִהְיוֹת לָכֶם לֵאלֹהִים אֲנִי יְהֹוָה אֱלֹהֵיכֶם:\n\nיְהוָה אֱלֹהֵיכֶם אֱמֶת.`,
    },
    seasonal: () => "",
  },

  "birchot-hashachar": {
    title: "ברכות השחר",
    nusach: {
      all: `מוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.\n\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן לַשֶּׂכְוִי בִינָה לְהַבְחִין בֵּין יוֹם וּבֵין לָיְלָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי גוֹי.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי עֶבֶד.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי אִשָּׁה. [לאישה: שֶׁעָשַׂנִי כִּרְצוֹנוֹ]\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, פּוֹקֵחַ עִוְרִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מַלְבִּישׁ עֲרֻמִּים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, מַתִּיר אֲסוּרִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, זוֹקֵף כְּפוּפִים.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, רוֹקַע הָאָרֶץ עַל הַמָּיִם.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁעָשָׂה לִי כָּל צָרְכִּי.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמֵּכִין מִצְעֲדֵי גָבֶר.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַנּוֹתֵן לַיָּעֵף כֹּחַ.\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמַּעֲבִיר שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי.\n\nיְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתַּרְגִּילֵנוּ בְּתוֹרָתֶךָ וְדַבְּקֵנוּ בְּמִצְוֹתֶיךָ, וְאַל תְּבִיאֵנוּ לֹא לִידֵי חֵטְא וְלֹא לִידֵי עֲבֵרָה וְעָוֹן, וְלֹא לִידֵי נִסָּיוֹן וְלֹא לִידֵי בִזָּיוֹן. וְאַל יִשְׁלֹט בָּנוּ יֵצֶר הָרָע. וְהַרְחִיקֵנוּ מֵאָדָם רָע וּמֵחָבֵר רָע. וְדַבְּקֵנוּ בְּיֵצֶר הַטּוֹב וּבְמַעֲשִׂים טוֹבִים. וְכֹף אֶת יִצְרֵנוּ לְהִשְׁתַּעְבֶּד לָךְ. וּתְנֵנוּ הַיּוֹם וּבְכָל יוֹם לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל רוֹאֵינוּ, וְתִגְמְלֵנוּ חֲסָדִים טוֹבִים. בָּרוּךְ אַתָּה יְהֹוָה, הַגּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל.`,
    },
    seasonal: () => "",
  },

  "al-hamichya": {
    title: "ברכת מעין שלוש",
    nusach: {
      all: `עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכֹל מִפִּרְיָהּ וְלִשְׂבֹּעַ מִטּוּבָהּ. רַחֵם נָא יְהֹוָה אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֲךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ. וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה.\n\n[בשבת] וּרְצֵה וְהַחֲלִיצֵנוּ בְּיוֹם הַשַּׁבָּת הַזֶּה.\n[בראש חודש] וְזָכְרֵנוּ לְטוֹבָה בְּיוֹם רֹאשׁ הַחֹדֶשׁ הַזֶּה.\n[ביום טוב] וְשַׂמְּחֵנוּ בְּיוֹם חַג... הַזֶּה.\n\nכִּי אַתָּה יְהֹוָה טוֹב וּמֵטִיב לַכֹּל וְנוֹדֶה לְּךָ עַל הָאָרֶץ וְעַל הַמִּחְיָה.\nבָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָרֶץ וְעַל הַמִּחְיָה.`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isShabbat)
        parts.push(
          '📌 שבת: אומרים "וּרְצֵה וְהַחֲלִיצֵנוּ בְּיוֹם הַשַּׁבָּת הַזֶּה"',
        );
      if (s.isRoshChodesh)
        parts.push(
          '📌 ראש חודש: אומרים "וְזָכְרֵנוּ לְטוֹבָה בְּיוֹם רֹאשׁ הַחֹדֶשׁ הַזֶּה"',
        );
      if (s.isChanukah)
        parts.push("📌 חנוכה: לדעות רבות אין שינוי בברכת מעין שלוש");
      return parts.join("\n");
    },
  },

  "kiddush-levana": {
    title: "ברכת הלבנה / קידוש לבנה",
    nusach: {
      all: `בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בְּמַאֲמָרוֹ בָּרָא שְׁחָקִים, וּבְרוּחַ פִּיו כָּל צְבָאָם. חֹק וּזְמַן נָתַן לָהֶם שֶׁלֹּא יְשַׁנּוּ אֶת תַּפְקִידָם. שָׂשִׂים וּשְׂמֵחִים לַעֲשׂוֹת רְצוֹן קוֹנָם, פּוֹעַל אֱמֶת שֶׁפְּעֻלָּתוֹ אֱמֶת. וְלַלְּבָנָה אָמַר שֶׁתִּתְחַדֵּשׁ עֲטֶרֶת תִּפְאֶרֶת לַעֲמוּסֵי בָטֶן שֶׁהֵם עֲתִידִים לְהִתְחַדֵּשׁ כְּמוֹתָהּ, וּלְפָאֵר לְיוֹצְרָם עַל שֵׁם כְּבוֹד מַלְכוּתוֹ.\n\nבָּרוּךְ אַתָּה יְהֹוָה, מְחַדֵּשׁ חֳדָשִׁים.\n\n[אומרים שלוש פעמים:] שָׁלוֹם עֲלֵיכֶם! (ג' פעמים)\n\nסִימָן טוֹב וּמַזָּל טוֹב יְהֵא לָנוּ וּלְכָל יִשְׂרָאֵל. (ג' פעמים)\n\n[עדות המזרח / ספרד — אחר הברכה:] תהלים קמח`,
    },
    seasonal: () => "",
  },

  "birkat-hamazon": {
    title: "ברכת המזון",
    nusach: {
      mizrahi: `שִׁיר הַמַּעֲלוֹת, בְּשׁוּב יְהֹוָה אֶת שִׁיבַת צִיּוֹן הָיִינוּ כְּחֹלְמִים. אָז יִמָּלֵא שְׂחוֹק פִּינוּ וּלְשׁוֹנֵנוּ רִנָּה...\n\nרַבּוֹתַי נְבָרֵךְ!\n[עונים:] יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד עוֹלָם!\n[אומר:] יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד עוֹלָם. בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי, נְבָרֵךְ (אֱלֹהֵינוּ) שֶׁאָכַלְנוּ מִשֶּׁלּוֹ.\n\n**בְּרָכָה רִאשׁוֹנָה — הַזָּן:**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ בְּחֵן בְּחֶסֶד וּבְרַחֲמִים. הוּא נוֹתֵן לֶחֶם לְכָל בָּשָׂר כִּי לְעוֹלָם חַסְדּוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָסַר לָנוּ וְאַל יֶחְסַר לָנוּ מָזוֹן לְעוֹלָם וָעֶד. בַּעֲבוּר שְׁמוֹ הַגָּדוֹל כִּי הוּא זָן וּמְפַרְנֵס לַכֹּל וּמֵטִיב לַכֹּל וּמֵכִין מָזוֹן לְכָל בְּרִיּוֹתָיו אֲשֶׁר בָּרָא. בָּרוּךְ אַתָּה יְהֹוָה, הַזָּן אֶת הַכֹּל.\n\n**בְּרָכָה שְׁנִיָּה — הָאָרֶץ:**\nנוֹדֶה לְּךָ יְהֹוָה אֱלֹהֵינוּ עַל שֶׁהִנְחַלְתָּ לַאֲבוֹתֵינוּ אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, וְעַל שֶׁהוֹצֵאתָנוּ יְהֹוָה אֱלֹהֵינוּ מֵאֶרֶץ מִצְרַיִם וּפְדִיתָנוּ מִבֵּית עֲבָדִים, וְעַל בְּרִיתְךָ שֶׁחָתַמְתָּ בִּבְשָׂרֵנוּ, וְעַל תּוֹרָתְךָ שֶׁלִּמַּדְתָּנוּ, וְעַל חֻקֶּיךָ שֶׁהוֹדַעְתָּנוּ, וְעַל חַיִּים חֵן וָחֶסֶד שֶׁחוֹנַנְתָּנוּ, וְעַל אֲכִילַת מָזוֹן שָׁאַתָּה זָן וּמְפַרְנֵס אוֹתָנוּ תָּמִיד בְּכָל יוֹם וּבְכָל עֵת וּבְכָל שָׁעָה.\n\nוְעַל הַכֹּל יְהֹוָה אֱלֹהֵינוּ אֲנַחְנוּ מוֹדִים לָךְ וּמְבָרְכִים אוֹתָךְ יִתְבָּרַךְ שִׁמְךָ בְּפִי כָּל חַי תָּמִיד לְעוֹלָם וָעֶד.\nבָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָרֶץ וְעַל הַמָּזוֹן.\n\n**בְּרָכָה שְׁלִישִׁית — יְרוּשָׁלַיִם:**\nרַחֵם נָא יְהֹוָה אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מַלְכוּת בֵּית דָּוִד מְשִׁיחֶךָ וְעַל הַבַּיִת הַגָּדוֹל וְהַקָּדוֹשׁ שֶׁנִּקְרָא שִׁמְךָ עָלָיו. אֱלֹהֵינוּ אָבִינוּ רְעֵנוּ זוּנֵנוּ פַּרְנְסֵנוּ וְכַלְכְּלֵנוּ וְהַרְוִיחֵנוּ וְהַרְוַח לָנוּ יְהֹוָה אֱלֹהֵינוּ מְהֵרָה מִכָּל צָרוֹתֵינוּ. וְנָא אַל תַּצְרִיכֵנוּ יְהֹוָה אֱלֹהֵינוּ לֹא לִידֵי מַתְּנַת בָּשָׂר וָדָם וְלֹא לִידֵי הַלְוָאָתָם כִּי אִם לְיָדְךָ הַמְּלֵאָה הַפְּתוּחָה הַקְּדוֹשָׁה וְהָרְחָבָה שֶׁלֹּא נֵבוֹשׁ וְלֹא נִכָּלֵם לְעוֹלָם וָעֶד.\n\n**בְּרָכָה רְבִיעִית — הַטּוֹב וְהַמֵּטִיב:**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָאֵל אָבִינוּ מַלְכֵּנוּ אַדִּירֵנוּ בּוֹרְאֵנוּ גֹּאֲלֵנוּ יוֹצְרֵנוּ קְדוֹשֵׁנוּ קְדוֹשׁ יַעֲקֹב הַטּוֹב וְהַמֵּטִיב לַכֹּל שֶׁבְּכָל יוֹם וָיוֹם הוּא הֵטִיב הוּא מֵטִיב הוּא יֵיטִיב לָנוּ. הוּא גְמָלָנוּ הוּא גוֹמְלֵנוּ הוּא יִגְמְלֵנוּ לָעַד לְחֵן וּלְחֶסֶד וּלְרַחֲמִים וְלִרְוַח הַצָּלָה וְהַצְלָחָה בְּרָכָה וִישׁוּעָה נֶחָמָה פַּרְנָסָה וְכַלְכָּלָה וְרַחֲמִים וְחַיִּים וְשָׁלוֹם וְכָל טוֹב, וּמִכָּל טוּב לְעוֹלָם אַל יְחַסְּרֵנוּ.`,
      ashkenaz: `[נוסח אשכנז — ההבדל העיקרי: "בִּרְשׁוּת מוֹרַי וְרַבּוֹתַי" במקום "מָרָנָן וְרַבָּנָן"]\n\n[שאר הנוסח דומה לעיקר כנ"ל]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isShabbat)
        parts.push('📌 שבת: מוסיפים "רְצֵה וְהַחֲלִיצֵנוּ" בברכת ירושלים');
      if (s.isRoshChodesh) parts.push('📌 ראש חודש: מוסיפים "יַעֲלֶה וְיָבֹא"');
      if (s.isChanukah || s.isPurim)
        parts.push('📌 חנוכה/פורים: מוסיפים "עַל הַנִּסִּים"');
      if (s.isPesach) parts.push('📌 פסח: מוסיפים "יַעֲלֶה וְיָבֹא"');
      if (s.isYamimNoraim)
        parts.push('📌 ימים נוראים: אפשר להוסיף "זָכְרֵנוּ לְחַיִּים"');
      return parts.join("\n");
    },
  },

  "tikkun-haklali": {
    title: "תיקון הכללי (י׳ מזמורים)",
    nusach: {
      all: `תיקון הכללי של רבינו נחמן מברסלב — עשרה מזמורי תהלים:\n\nטז • לב • מא • מב • נט • עז • צ • קה • קלז • קנ\n\n**תהלים טז**\nמִכְתָּם לְדָוִד שָׁמְרֵנִי אֵל כִּי חָסִיתִי בָּךְ: אָמַרְתְּ לַיהֹוָה אֲדֹנָי אָתָּה טוֹבָתִי בַּל עָלֶיךָ: לִקְדוֹשִׁים אֲשֶׁר בָּאָרֶץ הֵמָּה וְאַדִּירֵי כָּל חֶפְצִי בָם: יִרְבּוּ עַצְּבוֹתָם אַחֵר מָהָרוּ בַּל אַסִּיךְ נִסְכֵּיהֶם מִדָּם וּבַל אֶשָּׂא אֶת שְׁמוֹתָם עַל שְׂפָתָי: יְהֹוָה מְנָת חֶלְקִי וְכוֹסִי אַתָּה תּוֹמִיךְ גּוֹרָלִי: חֲבָלִים נָפְלוּ לִי בַּנְּעִמִים אַף נַחֲלָת שָׁפְרָה עָלָי: אֲבָרֵךְ אֶת יְהֹוָה אֲשֶׁר יְעָצָנִי אַף לֵילוֹת יִסְּרוּנִי כִלְיוֹתָי: שִׁוִּיתִי יְהֹוָה לְנֶגְדִּי תָמִיד כִּי מִימִינִי בַּל אֶמּוֹט: לָכֵן שָׂמַח לִבִּי וַיָּגֶל כְּבוֹדִי אַף בְּשָׂרִי יִשְׁכֹּן לָבֶטַח: כִּי לֹא תַעֲזֹב נַפְשִׁי לִשְׁאוֹל לֹא תִתֵּן חֲסִידְךָ לִרְאוֹת שָׁחַת: תּוֹדִיעֵנִי אֹרַח חַיִּים שֹׂבַע שְׂמָחוֹת אֶת פָּנֶיךָ נְעִמוֹת בִּימִינְךָ נֶצַח:\n\n**תהלים לב**\nלְדָוִד מַשְׂכִּיל אַשְׁרֵי נְשׂוּי פֶּשַׁע כְּסוּי חֲטָאָה: אַשְׁרֵי אָדָם לֹא יַחְשֹׁב יְהֹוָה לוֹ עָוֹן וְאֵין בְּרוּחוֹ רְמִיָּה: כִּי הֶחֱרַשְׁתִּי בָּלוּ עֲצָמָי בְּשַׁאֲגָתִי כָּל הַיּוֹם: כִּי יוֹמָם וָלַיְלָה תִּכְבַּד עָלַי יָדֶךָ נֶהְפַּךְ לְשַׁדִּי בְּחַרְבֹנֵי קָיִץ סֶלָה: חַטָּאתִי אוֹדִיעֲךָ וַעֲוֹנִי לֹא כִסִּיתִי אָמַרְתִּי אוֹדֶה עֲלֵי פְשָׁעַי לַיהֹוָה וְאַתָּה נָשָׂאתָ עֲוֹן חַטָּאתִי סֶלָה: עַל זֹאת יִתְפַּלֵּל כָּל חָסִיד אֵלֶיךָ לְעֵת מְצֹא רַק לְשֵׁטֶף מַיִם רַבִּים אֵלָיו לֹא יַגִּיעוּ: אַתָּה סֵתֶר לִי מִצַּר תִּצְּרֵנִי רָנֵּי פַלֵּט תְּסוֹבְבֵנִי סֶלָה: אַשְׂכִּילְךָ וְאוֹרְךָ בְּדֶרֶךְ זוּ תֵלֵךְ אִיעֲצָה עָלֶיךָ עֵינִי: אַל תִּהְיוּ כְּסוּס כְּפֶרֶד אֵין הָבִין בְּמֶתֶג וָרֶסֶן עֶדְיוֹ לִבְלוֹם בַּל קְרֹב אֵלֶיךָ: רַבִּים מַכְאוֹבִים לָרָשָׁע וְהַבּוֹטֵחַ בַּיהֹוָה חֶסֶד יְסוֹבְבֶנּוּ: שִׂמְחוּ בַיהֹוָה וְגִילוּ צַדִּיקִים וְהַרְנִינוּ כָּל יִשְׁרֵי לֵב:\n\n**תהלים מא**\nלַמְנַצֵּחַ מִזְמוֹר לְדָוִד: אַשְׁרֵי מַשְׂכִּיל אֶל דָּל בְּיוֹם רָעָה יְמַלְּטֵהוּ יְהֹוָה: יְהֹוָה יִשְׁמְרֵהוּ וִיחַיֵּהוּ וְאֻשַּׁר בָּאָרֶץ וְאַל תִּתְּנֵהוּ בְּנֶפֶשׁ אֹיְבָיו: יְהֹוָה יִסְעָדֶנּוּ עַל עֶרֶשׂ דְּוָי כָּל מִשְׁכָּבוֹ הָפַכְתָּ בְחָלְיוֹ: אֲנִי אָמַרְתִּי יְהֹוָה חָנֵּנִי רְפָאָה נַפְשִׁי כִּי חָטָאתִי לָךְ: אוֹיְבַי יֹאמְרוּ רַע לִי מָתַי יָמוּת וְאָבַד שְׁמוֹ: וְאִם בָּא לִרְאוֹת שָׁוְא יְדַבֵּר לִבּוֹ יִקְבָּץ אָוֶן לוֹ יֵצֵא לַחוּץ יְדַבֵּר: יַחַד עָלַי יִתְלַחֲשׁוּ כָּל שֹׂנְאַי עָלַי יַחְשְׁבוּ רָעָה לִי: דְּבַר בְּלִיַּעַל יָצוּק בּוֹ וַאֲשֶׁר שָׁכַב לֹא יוֹסִיף לָקוּם: גַּם אִישׁ שְׁלוֹמִי אֲשֶׁר בָּטַחְתִּי בוֹ אוֹכֵל לַחְמִי הִגְדִּיל עָלַי עָקֵב: וְאַתָּה יְהֹוָה חָנֵּנִי וַהֲקִימֵנִי וַאֲשַׁלְּמָה לָהֶם: בְּזֹאת יָדַעְתִּי כִּי חָפַצְתָּ בִּי כִּי לֹא יָרִיעַ אֹיְבִי עָלָי: וַאֲנִי בְּתֻמִּי תָּמַכְתָּ בִּי וַתַּצִּיבֵנִי לְפָנֶיךָ לְעוֹלָם: בָּרוּךְ יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל מֵהָעוֹלָם וְעַד הָעוֹלָם אָמֵן וְאָמֵן:\n\n**תהלים מב**\nלַמְנַצֵּחַ מַשְׂכִּיל לִבְנֵי קֹרַח: כְּאַיָּל תַּעֲרֹג עַל אֲפִיקֵי מָיִם כֵּן נַפְשִׁי תַעֲרֹג אֵלֶיךָ אֱלֹהִים: צָמְאָה נַפְשִׁי לֵאלֹהִים לְאֵל חָי מָתַי אָבוֹא וְאֵרָאֶה פְּנֵי אֱלֹהִים: הָיְתָה לִּי דִמְעָתִי לֶחֶם יוֹמָם וָלָיְלָה בֶּאֱמֹר אֵלַי כָּל הַיּוֹם אַיֵּה אֱלֹהֶיךָ: אֵלֶּה אֶזְכְּרָה וְאֶשְׁפְּכָה עָלַי נַפְשִׁי כִּי אֶעֱבֹר בַּסָּךְ אֶדַּדֵּם עַד בֵּית אֱלֹהִים בְּקוֹל רִנָּה וְתוֹדָה הָמוֹן חוֹגֵג: מַה תִּשְׁתּוֹחֲחִי נַפְשִׁי וַתֶּהֱמִי עָלָי הוֹחִילִי לֵאלֹהִים כִּי עוֹד אוֹדֶנּוּ יְשׁוּעוֹת פָּנָיו:\n\n**תהלים נט** (ראשיתו)\nלַמְנַצֵּחַ אַל תַּשְׁחֵת לְדָוִד מִכְתָּם בִּשְׁלֹחַ שָׁאוּל וַיִּשְׁמְרוּ אֶת הַבַּיִת לַהֲמִיתוֹ: הַצִּילֵנִי מֵאֹיְבַי אֱלֹהָי מִמִּתְקוֹמְמַי תְּשַׂגְּבֵנִי: הַצִּילֵנִי מִפֹּעֲלֵי אָוֶן וּמֵאַנְשֵׁי דָמִים הוֹשִׁיעֵנִי: כִּי הִנֵּה אָרְבוּ לְנַפְשִׁי יָגוּרוּ עָלַי עַזִּים לֹא פִשְׁעִי וְלֹא חַטָּאתִי יְהֹוָה: בְּלִי עָוֹן יְרוּצוּן וְיִכּוֹנָנוּ עוּרָה לִקְרָאתִי וּרְאֵה: וְאַתָּה יְהֹוָה אֱלֹהִים צְבָאוֹת אֱלֹהֵי יִשְׂרָאֵל הָקִיצָה לִפְקֹד כָּל הַגּוֹיִם אַל תָּחֹן כָּל בֹּגְדֵי אָוֶן סֶלָה:\n\n**תהלים עז** (ראשיתו)\nלַמְנַצֵּחַ עַל יְדוּתוּן לְאָסָף מִזְמוֹר: קוֹלִי אֶל אֱלֹהִים וְאֶצְעָקָה קוֹלִי אֶל אֱלֹהִים וְהַאֲזִין אֵלָי: בְּיוֹם צָרָתִי אֲדֹנָי דָּרָשְׁתִּי יָדִי לַיְלָה נִגְּרָה וְלֹא תָפוּג מֵאֲנָה הִנָּחֵם נַפְשִׁי: אֶזְכְּרָה אֱלֹהִים וְאֶהֱמָיָה אָשִׂיחָה וְתִתְעַטֵּף רוּחִי סֶלָה: אָחַזְתָּ שְׁמֻרוֹת עֵינָי נִפְעַמְתִּי וְלֹא אֲדַבֵּר:\n\n**תהלים צ**\nתְּפִלָּה לְמֹשֶׁה אִישׁ הָאֱלֹהִים: אֲדֹנָי מָעוֹן אַתָּה הָיִיתָ לָּנוּ בְּדֹר וָדֹר: בְּטֶרֶם הָרִים יֻלָּדוּ וַתְּחוֹלֵל אֶרֶץ וְתֵבֵל וּמֵעוֹלָם עַד עוֹלָם אַתָּה אֵל: תָּשֵׁב אֱנוֹשׁ עַד דַּכָּא וַתֹּאמֶר שׁוּבוּ בְנֵי אָדָם: כִּי אֶלֶף שָׁנִים בְּעֵינֶיךָ כְּיוֹם אֶתְמוֹל כִּי יַעֲבֹר וְאַשְׁמוּרָה בַלָּיְלָה:\n\n**תהלים קה** (ראשיתו)\nהוֹדוּ לַיהֹוָה קִרְאוּ בִשְׁמוֹ הוֹדִיעוּ בָעַמִּים עֲלִילוֹתָיו: שִׁירוּ לוֹ זַמְּרוּ לוֹ שִׂיחוּ בְּכָל נִפְלְאוֹתָיו: הִתְהַלְלוּ בְּשֵׁם קָדְשׁוֹ יִשְׂמַח לֵב מְבַקְשֵׁי יְהֹוָה: דִּרְשׁוּ יְהֹוָה וְעֻזּוֹ בַּקְּשׁוּ פָנָיו תָּמִיד:\n\n**תהלים קלז**\nעַל נַהֲרוֹת בָּבֶל שָׁם יָשַׁבְנוּ גַּם בָּכִינוּ בְּזָכְרֵנוּ אֶת צִיּוֹן: עַל עֲרָבִים בְּתוֹכָהּ תָּלִינוּ כִּנֹּרוֹתֵינוּ: כִּי שָׁם שְׁאֵלוּנוּ שׁוֹבֵינוּ דִּבְרֵי שִׁיר וְתוֹלָלֵינוּ שִׂמְחָה שִׁירוּ לָנוּ מִשִּׁיר צִיּוֹן: אֵיךְ נָשִׁיר אֶת שִׁיר יְהֹוָה עַל אַדְמַת נֵכָר: אִם אֶשְׁכָּחֵךְ יְרוּשָׁלָיִם תִּשְׁכַּח יְמִינִי: תִּדְבַּק לְשׁוֹנִי לְחִכִּי אִם לֹא אֶזְכְּרֵכִי אִם לֹא אַעֲלֶה אֶת יְרוּשָׁלַיִם עַל רֹאשׁ שִׂמְחָתִי: זְכֹר יְהֹוָה לִבְנֵי אֱדוֹם אֵת יוֹם יְרוּשָׁלָיִם הָאֹמְרִים עָרוּ עָרוּ עַד הַיְסוֹד בָּהּ: בַּת בָּבֶל הַשְּׁדוּדָה אַשְׁרֵי שֶׁיְשַׁלֶּם לָךְ אֶת גְּמוּלֵךְ שֶׁגָּמַלְתְּ לָנוּ: אַשְׁרֵי שֶׁיֹּאחֵז וְנִפֵּץ אֶת עֹלָלַיִךְ אֶל הַסָּלַע:\n\n**תהלים קנ**\nהַלְלוּיָהּ הַלְלוּ אֵל בְּקָדְשׁוֹ הַלְלוּהוּ בִּרְקִיעַ עֻזּוֹ: הַלְלוּהוּ בִגְבוּרֹתָיו הַלְלוּהוּ כְּרֹב גֻּדְלוֹ: הַלְלוּהוּ בְּתֵקַע שׁוֹפָר הַלְלוּהוּ בְּנֵבֶל וְכִנּוֹר: הַלְלוּהוּ בְתֹף וּמָחוֹל הַלְלוּהוּ בְּמִנִּים וְעֻגָב: הַלְלוּהוּ בְצִלְצְלֵי שָׁמַע הַלְלוּהוּ בְּצִלְצְלֵי תְרוּעָה: כֹּל הַנְּשָׁמָה תְּהַלֵּל יָהּ הַלְלוּיָהּ:`,
    },
    seasonal: () => "",
  },

  shacharit: {
    title: "תפילת שחרית",
    nusach: {
      mizrahi: `**מודה אני**\nמוֹדֶה אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם, שֶׁהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶךָ.\n\n**ברכות השחר** — [ראה פרק ברכות השחר]\n\n**פסוקי דזמרה**\nבָּרוּךְ שֶׁאָמַר וְהָיָה הָעוֹלָם... [עד] יִשְׁתַּבַּח שִׁמְךָ לָעַד מַלְכֵּנוּ...\n\n**קריאת שמע** — [ראה פרק שמע ישראל]\n\n**עמידה — שמונה עשרה**\n\nאֲדֹנָי שְׂפָתַי תִּפְתָּח וּפִי יַגִּיד תְּהִלָּתֶךָ:\n\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, אֱלֹהֵי אַבְרָהָם אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב, הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא אֵל עֶלְיוֹן, גּוֹמֵל חֲסָדִים טוֹבִים וְקֹנֵה הַכֹּל וְזוֹכֵר חַסְדֵּי אָבוֹת וּמֵבִיא גוֹאֵל לִבְנֵי בְנֵיהֶם לְמַעַן שְׁמוֹ בְּאַהֲבָה:\nמֶלֶךְ עוֹזֵר וּמוֹשִׁיעַ וּמָגֵן. בָּרוּךְ אַתָּה יְהֹוָה, מָגֵן אַבְרָהָם.\n\nאַתָּה גִּבּוֹר לְעוֹלָם אֲדֹנָי, מְחַיֵּה מֵתִים אַתָּה, רַב לְהוֹשִׁיעַ.\n[קיץ:] מוֹרִיד הַטַּל\n[חורף:] מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם\nמְכַלְכֵּל חַיִּים בְּחֶסֶד, מְחַיֵּה מֵתִים בְּרַחֲמִים רַבִּים... בָּרוּךְ אַתָּה יְהֹוָה, מְחַיֵּה הַמֵּתִים.\n\n[המשך — קדושה, ברכות אמצעיות י"ג, ברכות אחרונות, עלינו]`,
      ashkenaz: `[נוסח אשכנז — הבדלים עיקריים:\n• "אֲשֶׁר יָצַר" בנוסח שונה מעט\n• "לְעוֹלַם יְהֵא אָדָם" — נוסח שונה\n• "יִשְׁמַח מֹשֶׁה" בשבת — נוסח שונה\n\nהעמידה דומה לנוסח ספרד לרוב]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isRoshChodesh)
        parts.push(
          '📌 ראש חודש: מוסיפים "יַעֲלֶה וְיָבֹא" בעמידה ובברכת המזון; אומרים הלל (חצי הלל)',
        );
      if (s.isChanukah)
        parts.push(
          '📌 חנוכה: מוסיפים "עַל הַנִּסִּים" בעמידה; אומרים הלל שלם ח׳ ימים ראשונים',
        );
      if (s.isPurim)
        parts.push('📌 פורים: מוסיפים "עַל הַנִּסִּים" בעמידה ובברכת המזון');
      if (s.isPesach)
        parts.push(
          '📌 פסח: "יַעֲלֶה וְיָבֹא" בעמידה; הלל שלם ב׳ ראשונים, חצי הלל בשאר; מוסף',
        );
      if (s.isShavuot)
        parts.push(
          "📌 שבועות: הלל שלם; מוסף; אקדמות ואזהרות (לנוסחים מסוימים)",
        );
      if (s.isSukkot) parts.push("📌 סוכות: הלל שלם; מוסף; ד׳ מינים");
      if (s.isYamimNoraim)
        parts.push(
          '📌 ימים נוראים: "זָכְרֵנוּ לְחַיִּים" ו"מִי כָמוֹךָ" בעמידה; "הָמֶלֶךְ הַקָּדוֹשׁ"',
        );
      if (s.isShabbat)
        parts.push(
          "📌 שבת: תפילת שחרית של שבת — ישתבח, נשמת, קדישים, קריאת התורה, מוסף שבת",
        );
      return parts.join("\n");
    },
  },

  mincha: {
    title: "תפילת מנחה",
    nusach: {
      mizrahi: `אַשְׁרֵי יוֹשְׁבֵי בֵיתֶךָ עוֹד יְהַלְלוּךָ סֶּלָה:\nאַשְׁרֵי הָעָם שֶׁכָּכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְּהֹוָה אֱלֹהָיו:\n\nתְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּלֶךְ...\n[מזמור קמה עד סופו]\n\n**חצי קדיש**\n\n**עמידה — שמונה עשרה** [כמו שחרית — ראה שם]\n\n[ביום חול שיש מנין: חזרת הש"צ, קדיש תתקבל]\n\n**עלינו לשבח**\nעָלֵינוּ לְשַׁבֵּחַ לַאֲדוֹן הַכֹּל, לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית, שֶׁלֹּא עָשָׂנוּ כְּגוֹיֵי הָאֲרָצוֹת וְלֹא שָׂמָנוּ כְּמִשְׁפְּחוֹת הָאֲדָמָה. שֶׁלֹּא שָׂם חֶלְקֵנוּ כָּהֶם וְגֹרָלֵנוּ כְּכָל הֲמוֹנָם.\nוַאֲנַחְנוּ כֹּרְעִים וּמִשְׁתַּחֲוִים וּמוֹדִים לִפְנֵי מֶלֶךְ מַלְכֵי הַמְּלָכִים הַקָּדוֹשׁ בָּרוּךְ הוּא.\nשֶׁהוּא נוֹטֶה שָׁמַיִם וְיֹסֵד אָרֶץ, וּמוֹשַׁב יְקָרוֹ בַּשָּׁמַיִם מִמַּעַל, וּשְׁכִינַת עֻזּוֹ בְּגָבְהֵי מְרוֹמִים. הוּא אֱלֹהֵינוּ אֵין עוֹד. אֱמֶת מַלְכֵּנוּ אֶפֶס זוּלָתוֹ, כַּכָּתוּב בְּתוֹרָתוֹ: וְיָדַעְתָּ הַיּוֹם וַהֲשֵׁבֹתָ אֶל לְבָבֶךָ כִּי יְהֹוָה הוּא הָאֱלֹהִים בַּשָּׁמַיִם מִמַּעַל וְעַל הָאָרֶץ מִתָּחַת אֵין עוֹד:\n\nקַדִּישׁ יָתוֹם`,
      ashkenaz: `[נוסח אשכנז — מנחה דומה לנוסח ספרד בעיקרה. הבדל: נוסח "עלינו" שונה מעט]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isShabbat)
        parts.push(
          "📌 שבת: מנחת שבת — קריאת התורה (בגולה: מתחילים פרשת שבת הבאה); תפילת מנחה בנוסח שבת",
        );
      if (s.isRoshChodesh) parts.push('📌 ראש חודש: "יַעֲלֶה וְיָבֹא" בעמידה');
      if (s.isChanukah) parts.push('📌 חנוכה: "עַל הַנִּסִּים" בעמידה');
      if (s.isPesach || s.isShavuot || s.isSukkot)
        parts.push(
          '📌 יום טוב: "יַעֲלֶה וְיָבֹא" בעמידה; מוסף נאמר בשחרית בלבד',
        );
      return parts.join("\n");
    },
  },

  maariv: {
    title: "תפילת ערבית",
    nusach: {
      mizrahi: `**ברכו**\nבָּרְכוּ אֶת יְהֹוָה הַמְּבֹרָךְ!\n[עונים:] בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֶד!\n\n**ברכות קריאת שמע של ערבית**\nבָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בִּדְבָרוֹ מַעֲרִיב עֲרָבִים, בְּחָכְמָה פּוֹתֵחַ שְׁעָרִים... בָּרוּךְ אַתָּה יְהֹוָה, הַמַּעֲרִיב עֲרָבִים.\n\nאַהֲבַת עוֹלָם בֵּית יִשְׂרָאֵל עַמְּךָ אָהָבְתָּ... בָּרוּךְ אַתָּה יְהֹוָה, אוֹהֵב עַמּוֹ יִשְׂרָאֵל.\n\n**קריאת שמע** — [ראה פרק שמע ישראל]\n\nוֶאֱמֶת וֶאֱמוּנָה כָּל זֹאת... יְהֹוָה אֱלֹהֵיכֶם אֱמֶת.\n\nהַשְׁכִּיבֵנוּ יְהֹוָה אֱלֹהֵינוּ לְשָׁלוֹם... בָּרוּךְ אַתָּה יְהֹוָה, הַפּוֹרֵשׂ סֻכַּת שָׁלוֹם עָלֵינוּ...\n\n**עמידה — שמונה עשרה** [כמו שחרית]\n\n**קדיש תתקבל, עלינו, קדיש יתום**`,
      ashkenaz: `[נוסח אשכנז — הבדל בנוסח "אהבת עולם"/"אהבה רבה"; שאר התפילה דומה]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isShabbat)
        parts.push(
          '📌 מוצאי שבת: הבדלה — "הַמַּבְדִּיל בֵּין קֹדֶשׁ לְחֹל..."',
        );
      if (s.isRoshChodesh)
        parts.push(
          '📌 ראש חודש: "יַעֲלֶה וְיָבֹא" בעמידה; "קִדּוּשׁ לְבָנָה" — ראו פרק ברכת לבנה',
        );
      if (s.isChanukah)
        parts.push(
          '📌 חנוכה: "עַל הַנִּסִּים" בעמידה; הדלקת נרות חנוכה אחר ערבית',
        );
      if (s.isPurim)
        parts.push('📌 פורים: "עַל הַנִּסִּים" בעמידה; מגילת אסתר בלילה');
      if (s.isYamimNoraim)
        parts.push(
          '📌 ערב יום כיפור: "כָּל נִדְרֵי" לפני ערבית; "זָכְרֵנוּ לְחַיִּים" בעמידה',
        );
      return parts.join("\n");
    },
  },

  tehillim: {
    title: "תהילים",
    nusach: {
      all: `**תהלים א׳**\nאַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד וּבְמוֹשַׁב לֵצִים לֹא יָשָׁב:\nכִּי אִם בְּתוֹרַת יְהֹוָה חֶפְצוֹ וּבְתוֹרָתוֹ יֶהְגֶּה יוֹמָם וָלָיְלָה:\nוְהָיָה כְּעֵץ שָׁתוּל עַל פַּלְגֵי מָיִם אֲשֶׁר פִּרְיוֹ יִתֵּן בְּעִתּוֹ וְעָלֵהוּ לֹא יִבּוֹל וְכֹל אֲשֶׁר יַעֲשֶׂה יַצְלִיחַ:\nלֹא כֵן הָרְשָׁעִים כִּי אִם כַּמֹּץ אֲשֶׁר תִּדְּפֶנּוּ רוּחַ:\nעַל כֵּן לֹא יָקֻמוּ רְשָׁעִים בַּמִּשְׁפָּט וְחַטָּאִים בַּעֲדַת צַדִּיקִים:\nכִּי יוֹדֵעַ יְהֹוָה דֶּרֶךְ צַדִּיקִים וְדֶרֶךְ רְשָׁעִים תֹּאבֵד:\n\n**לחץ לפתיחת ספר תהילים המלא ב-Sefaria ←**\n[כפתור קישור מופיע למטה]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (s.isRoshChodesh)
        parts.push(
          "📌 ראש חודש: נהוג לומר תהלים קד (או מנהגים שונים לפי קהילה)",
        );
      if (s.isShabbat)
        parts.push(
          '📌 שבת: ספר תהלים בין מנחה למעריב; "בֹּאוּ נְרַנְּנָה" (צ"ה) בקבלת שבת',
        );
      if (s.isYamimNoraim)
        parts.push(
          '📌 ימים נוראים: תהלים כ"ז — "לְדָוִד יְהֹוָה אוֹרִי" מרה"ש עד שמחת תורה',
        );
      return parts.join("\n");
    },
    extraLink: "https://www.sefaria.org/Psalms?lang=bi",
  },

  "tikkun-chatzot": {
    title: "תיקון חצות",
    nusach: {
      all: `**תיקון רחל** (אחר חצות הלילה, בימות החול בלבד)\n\nיֵשֵׁב בָּדָד וְיִדֹּם כִּי נָטַל עָלָיו:\n\nיְרוּשָׁלַיִם חָטְאָה חֵטְא עַל כֵּן לְנִידָה הָיָתָה כָּל מְכַבְּדֶיהָ הִזִּילוּהָ כִּי רָאוּ עֶרְוָתָהּ גַּם הִיא נֶאֱנָחָה וַתָּשָׁב אָחוֹר: (איכה א:ח)\n\n[תהלים עט, קב, קלז]\n\nעַל נַהֲרוֹת בָּבֶל שָׁם יָשַׁבְנוּ גַּם בָּכִינוּ בְּזָכְרֵנוּ אֶת צִיּוֹן:\nעַל עֲרָבִים בְּתוֹכָהּ תָּלִינוּ כִּנֹּרוֹתֵינוּ:\nכִּי שָׁם שְׁאֵלוּנוּ שׁוֹבֵינוּ דִּבְרֵי שִׁיר וְתוֹלָלֵינוּ שִׂמְחָה, שִׁירוּ לָנוּ מִשִּׁיר צִיּוֹן:\nאֵיךְ נָשִׁיר אֶת שִׁיר יְהֹוָה עַל אַדְמַת נֵכָר:\nאִם אֶשְׁכָּחֵךְ יְרוּשָׁלָיִם תִּשְׁכַּח יְמִינִי:\nתִּדְבַּק לְשׁוֹנִי לְחִכִּי אִם לֹא אֶזְכְּרֵכִי אִם לֹא אַעֲלֶה אֶת יְרוּשָׁלַיִם עַל רֹאשׁ שִׂמְחָתִי:\n(תהלים קלז, א–ו)\n\n**תיקון לאה** (לאחר תיקון רחל)\n[תהלים כ, כא, כד, סז, עב, צ, צא, קמ, קמא, קמב]`,
    },
    seasonal: (s) => {
      const parts = [];
      if (
        s.isShabbat ||
        s.isRoshHaShana ||
        s.isYomKippur ||
        s.isPesach ||
        s.isShavuot ||
        s.isSukkot
      )
        parts.push(
          "⚠️ תיקון חצות לא נאמר בשבת, ראש השנה, יום כיפור, ימים טובים, ימי חנוכה ופורים",
        );
      return parts.join("\n");
    },
  },
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
      tehillim: "https://www.sefaria.org/Psalms?lang=bi",
      "birkat-hamazon": "https://www.sefaria.org/Birkat_Hamazon?lang=bi",
    };
    const url =
      refs[key] ||
      `https://www.sefaria.org/search?q=${encodeURIComponent(heLabel)}&lang=he`;
    window.open(url, "_blank");
    return;
  }

  const season = getHebrewSeasonInfo();
  const seasonNote = entry.seasonal ? entry.seasonal(season) : "";

  // Pick nusach-specific text
  const nusachTexts = entry.nusach;
  let text =
    nusachTexts[CURRENT_NUSACH] || nusachTexts.mizrahi || nusachTexts.all || "";

  // Format text: bold headers, line breaks
  const formatText = (t) =>
    t
      .replace(
        /\*\*([^*]+)\*\*/g,
        '<strong style="color:#93c5fd;display:block;margin:1rem 0 0.3rem;">$1</strong>',
      )
      .replace(/\n/g, "<br>");

  const nusachNames = {
    mizrahi: "עדות המזרח",
    sfard: "ספרד",
    ashkenaz: "אשכנז",
    temani_shami: "תימן שאמי",
    temani_baladi: "תימן בלאדי",
  };

  let existing = document.getElementById("prayer-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "prayer-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;background:rgba(2,6,23,0.92);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;";
  modal.innerHTML = `
          <div class="modal-inner" style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:600px;margin:auto;box-shadow:0 25px 60px rgba(0,0,0,0.6);text-align:center;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <h3 class="modal-title" style="color:#f1f5f9;font-size:1.4rem;font-weight:900;margin:0;">${entry.title}</h3>
              <button class="modal-close" onclick="closePrayerModal()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:38px;height:38px;border-radius:50%;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
            </div>
            <div class="modal-nusach" style="color:#64748b;font-size:0.75rem;margin-bottom:1.2rem;">נוסח: <strong style="color:#818cf8;">${nusachNames[CURRENT_NUSACH] || CURRENT_NUSACH}</strong> &nbsp;|&nbsp; ניתן לשנות בהגדרות</div>
            ${seasonNote ? `<div class="modal-season" style="background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.3);border-radius:1rem;padding:0.85rem 1rem;margin-bottom:1rem;font-size:0.82rem;color:#fde047;line-height:1.7;">${seasonNote.replace(/\n/g, "<br>")}</div>` : ""}
            <div class="modal-body" style="background:rgba(255,255,255,0.04);border-radius:1rem;padding:1.25rem;font-size:1rem;line-height:2;color:#e2e8f0;font-family:'David Libre','Frank Ruhl Libre',serif;max-height:60vh;overflow-y:auto;">
              ${formatText(text)}
              ${entry.extraLink ? `<br><br><a href="${entry.extraLink}" target="_blank" style="color:#60a5fa;font-size:0.85rem;">📖 פתח טקסט מלא ב-Sefaria.org ←</a>` : ""}
            </div>
            <p class="modal-credit" style="color:#334155;font-size:0.68rem;margin-top:1rem;text-align:center;">המקור: נוסחי תפילה מסורתיים | ספריית ספריא.org (CC-BY-SA) | מחבר: הלוח היהודי</p>
          </div>`;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
}

// ── Dedicated Tehillim Page ───────────────────────────────
function openTehillimPage() {
  const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const DAY_PSALMS = [
    {
      day: "ראשון",
      range: [1, 29],
      chapters: Array.from({ length: 29 }, (_, i) => i + 1),
    },
    {
      day: "שני",
      range: [30, 50],
      chapters: Array.from({ length: 21 }, (_, i) => i + 30),
    },
    {
      day: "שלישי",
      range: [51, 72],
      chapters: Array.from({ length: 22 }, (_, i) => i + 51),
    },
    {
      day: "רביעי",
      range: [73, 89],
      chapters: Array.from({ length: 17 }, (_, i) => i + 73),
    },
    {
      day: "חמישי",
      range: [90, 106],
      chapters: Array.from({ length: 17 }, (_, i) => i + 90),
    },
    {
      day: "שישי",
      range: [107, 119],
      chapters: Array.from({ length: 13 }, (_, i) => i + 107),
    },
    {
      day: "שבת",
      range: [120, 150],
      chapters: Array.from({ length: 31 }, (_, i) => i + 120),
    },
  ];

  // Today's day (0=Sun … 6=Sat)
  const todayDow = new Date().getDay();
  let activeDayIdx = todayDow; // 0=ראשון, 6=שבת

  const colors = [
    "#6366f1",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  let existing = document.getElementById("tehillim-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "tehillim-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;background:rgba(2,6,23,0.95);backdrop-filter:blur(8px);display:flex;flex-direction:column;overflow:hidden;";

  function buildPage(dayIdx) {
    activeDayIdx = dayIdx;
    const dayData = DAY_PSALMS[dayIdx];
    const color = colors[dayIdx];

    const tabsHTML = DAY_PSALMS.map(
      (d, i) => `
            <button onclick="window._tehillimSwitchDay(${i})"
              style="padding:0.35rem 0.7rem;border-radius:999px;font-size:0.75rem;font-weight:700;border:1px solid ${i === dayIdx ? color : "rgba(255,255,255,0.12)"};
                     background:${i === dayIdx ? color : "transparent"};color:${i === dayIdx ? "#fff" : "#94a3b8"};cursor:pointer;white-space:nowrap;transition:all 0.15s;">
              ${d.day}
            </button>`,
    ).join("");

    const chaptersHTML = dayData.chapters
      .map(
        (n) => `
            <button onclick="window._tehillimOpenPsalm(${n})"
              style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;
                     padding:0.55rem;font-size:0.85rem;font-weight:700;color:#e2e8f0;cursor:pointer;
                     transition:all 0.15s;text-align:center;"
              onmouseover="this.style.background='${color}33';this.style.borderColor='${color}66';"
              onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.1)';">
              ${n}
            </button>`,
      )
      .join("");

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
    const pane = document.getElementById("psalm-content-pane");
    const title = document.getElementById("psalm-title");
    const area = document.getElementById("psalm-text-area");
    const color = colors[activeDayIdx];

    if (!pane || !title || !area) return;
    pane.style.display = "flex";
    pane.style.flexDirection = "column";
    title.textContent = `תהלים פרק ${num}`;
    area.innerHTML = `<div style="text-align:center;padding:2rem;"><div style="width:36px;height:36px;border:3px solid ${color};border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 1rem;"></div><p style="color:#64748b;">טוען פרק ${num}...</p></div>`;

    try {
      const url = `https://www.sefaria.org/api/texts/Psalms.${num}?lang=he&context=0`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const heTexts = data.he || [];
      if (!heTexts.length) throw new Error("no text");

      const verses = heTexts
        .map((v, i) => {
          const clean =
            typeof v === "string"
              ? v
              : Array.isArray(v)
                ? v.join("")
                : String(v);
          return `<span style="color:${color};font-size:0.75rem;font-weight:700;margin-left:0.3rem;">(${i + 1})</span>${clean}`;
        })
        .join(" &nbsp;");

      area.innerHTML = `
              <p style="color:#64748b;font-size:0.72rem;margin-bottom:1rem;">תהלים פרק ${num} | ${heTexts.length} פסוקים</p>
              <div style="line-height:2.2;">${verses}</div>
              <br>
              <a href="https://www.sefaria.org/Psalms.${num}?lang=bi" target="_blank"
                style="color:#60a5fa;font-size:0.8rem;display:block;text-align:center;margin-top:1rem;">
                📖 פתח ב-Sefaria ←
              </a>`;
    } catch (err) {
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
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeTehillimModal();
  });
  document.body.appendChild(modal);
  lockBodyScroll();
  pushModalState("tehillim-modal");
}

function toggleMorePrayers() {
  const grid = document.getElementById("prayer-more-grid");
  const chevron = document.getElementById("prayer-more-chevron");
  const label = document.getElementById("prayer-more-label");
  const isOpen = !grid.classList.contains("hidden");
  grid.classList.toggle("hidden", isOpen);
  chevron.style.transform = isOpen ? "" : "rotate(180deg)";
  label.textContent = isOpen ? "תפילות נוספות" : "פחות";
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
  const _sunMs = zData.times.sunset
    ? new Date(zData.times.sunset).getTime()
    : null;
  const _chnMs = zData.times.chatzotNight
    ? new Date(zData.times.chatzotNight).getTime()
    : null;
  // Night = sunset → alot (tomorrow); midpoint = chatzotNight
  // Full night ≈ 2*(chatzotNight − sunset)
  // 1/3 of night = 2*(chn−sun)/3; 2/3 = 4*(chn−sun)/3
  // אשמורת התיכונה starts at sunset + 2*(chn−sun)/3
  // אשמורת הבוקר  starts at sunset + 4*(chn−sun)/3 = chn + (chn−sun)/3
  const _ashTMs =
    _sunMs && _chnMs ? Math.round(_sunMs + (2 * (_chnMs - _sunMs)) / 3) : null;
  const _ashBMs =
    _sunMs && _chnMs ? Math.round(_chnMs + (_chnMs - _sunMs) / 3) : null;
  const _ashTIso = _ashTMs ? new Date(_ashTMs).toISOString() : null;
  const _ashBIso = _ashBMs ? new Date(_ashBMs).toISOString() : null;

  // ── Bein HaShmashos: API or calculated (sunset + 13.5 min) ─
  const _beinRaw =
    zData.times.beinHaShmashos || zData.times.beinHashmashos || null;
  const _beinIso =
    _beinRaw || (_sunMs ? new Date(_sunMs + 13.5 * 60000).toISOString() : null);

  const zmanimList = [
    {
      key: "alot",
      label: "עלות השחר",
      iso: zData.times.alotHaShachar,
      opinions: [
        { name: 'מגן אברהם / גר"א', val: ft(zData.times.alotHaShachar) },
      ],
    },
    {
      key: "talit",
      label: "זמן טלית ותפילין",
      iso: zData.times.misheyakir || zData.times.misheyakirMachmir,
      opinions: [
        { name: "משיכיר (11.5° מתחת לאופק)", val: ft(zData.times.misheyakir) },
        {
          name: "משיכיר 11° מתחת לאופק",
          val: ft(zData.times.misheyakirMachmir),
        },
        ...(zData.times.misheyakir10_2
          ? [
              {
                name: "משיכיר 10.2° מתחת לאופק",
                val: ft(zData.times.misheyakir10_2),
              },
            ]
          : []),
      ],
    },
    {
      key: "netz",
      label: "הנץ החמה",
      iso: zData.times.sunrise,
      opinions: [
        { name: "מותאם לגובה", val: ft(zData.times.sunrise) },
        ...(zData.times.seaLevelSunrise
          ? [{ name: "גובה פני הים", val: ft(zData.times.seaLevelSunrise) }]
          : []),
      ],
    },
    {
      key: "shma",
      label: 'סוף ק"ש',
      iso:
        ZMANIM_METHOD === "MGA"
          ? zData.times.sofZmanShmaMGA
          : zData.times.sofZmanShma,
      opinions: [
        { name: "מגן אברהם (עלות–צאת)", val: ft(zData.times.sofZmanShmaMGA) },
        {
          name: 'גר"א / בעל התניא (הנץ–שקיעה)',
          val: ft(zData.times.sofZmanShma),
        },
      ],
    },
    {
      key: "tfilla",
      label: "סוף זמן תפילה",
      iso:
        ZMANIM_METHOD === "MGA"
          ? zData.times.sofZmanTfillaMGA
          : zData.times.sofZmanTfilla,
      opinions: [
        { name: "מגן אברהם", val: ft(zData.times.sofZmanTfillaMGA) },
        { name: 'גר"א / בעל התניא', val: ft(zData.times.sofZmanTfilla) },
      ],
    },
    {
      key: "chatzot",
      label: "חצות היום",
      iso: zData.times.chatzot,
      opinions: [
        { name: "חצות היום (מחצית היום ההלכתי)", val: ft(zData.times.chatzot) },
      ],
    },
    {
      key: "mincha_g",
      label: "מנחה גדולה",
      iso: zData.times.minchaGedola,
      opinions: [
        {
          name: 'מגן אברהם / גר"א (חצי שעה אחר חצות)',
          val: ft(zData.times.minchaGedola),
        },
        {
          name: 'רפ"ב (30 דק׳ שעות זמניות)',
          val: ft(zData.times.minchaGedola72Min),
        },
      ],
    },
    {
      key: "mincha_k",
      label: "מנחה קטנה",
      iso: zData.times.minchaKetana,
      opinions: [
        {
          name: "כל השיטות (9.5 שעות זמניות)",
          val: ft(zData.times.minchaKetana),
        },
      ],
    },
    {
      key: "plag",
      label: "פלג המנחה",
      iso: zData.times.plagHaMincha,
      opinions: [
        { name: "מגן אברהם", val: ft(zData.times.plagHaMincha) },
        { name: 'גר"א / שו"ע הרב', val: ft(zData.times.plagHaMinchaGRA) },
      ],
    },
    {
      key: "shkia",
      label: "שקיעה",
      iso: zData.times.sunset,
      opinions: [{ name: "מותאם לגובה", val: ft(zData.times.sunset) }],
    },
    {
      key: "bein_hashmashot",
      label: "בין השמשות",
      iso: zData.times.beinHaShmashos || _beinIso,
      opinions: [
        { name: "רבנו תם — 2 כוכבים", val: ft(zData.times.beinHaShmashos) },
        { name: 'שו"ע (כ-13.5 דק׳ אחר שקיעה)', val: ft(_beinIso) },
      ],
    },
    {
      key: "tzeit",
      label: "צאת הכוכבים",
      iso: zData.times.tzeit7083deg,
      opinions: [
        {
          name: 'תצ"ה — 7.083° (שלוש כוכבים בינוניים)',
          val: ft(zData.times.tzeit7083deg),
        },
        { name: "לילה — 8.5° מתחת לאופק", val: ft(zData.times.tzeit8_5deg) },
        { name: "בעל התניא — 50 דקות", val: ft(zData.times.tzeit50min) },
        {
          name: "ג׳ כוכבים קטנים (13.5 דק׳ זמניות)",
          val: ft(zData.times.tzeit13Point5MinutesZmanis),
        },
      ],
    },
    {
      key: "ashmeret_tkona",
      label: "אשמורת התיכונה",
      iso: _ashTIso,
      opinions: [
        { name: "תחילת משמרת שנייה של הלילה", val: ft(_ashTIso) },
        { name: "שליש שני (= שני שלישים מהשקיעה)", val: ft(_ashTIso) },
      ],
    },
    {
      key: "ashmeret_boker",
      label: "אשמורת הבוקר",
      iso: _ashBIso,
      opinions: [
        { name: "תחילת אשמורת הבוקר (לפני עלות השחר)", val: ft(_ashBIso) },
        { name: "שני שלישים מהלילה (4/6 מהשקיעה)", val: ft(_ashBIso) },
      ],
    },
  ];

  // ── FIFO: next upcoming first, past times at end ──────────
  zmanimList.forEach((z) => {
    z._ms = z.iso ? new Date(z.iso).getTime() : null;
  });
  const nowMs = now.getTime();
  const future = zmanimList
    .filter((z) => z._ms && z._ms >= nowMs)
    .sort((a, b) => a._ms - b._ms);
  const past = zmanimList
    .filter((z) => z._ms && z._ms < nowMs)
    .sort((a, b) => a._ms - b._ms);
  const noTime = zmanimList.filter((z) => !z._ms);
  const sorted = [...future, ...past, ...noTime];

  // ── Render ────────────────────────────────────────────────
  const cardClass =
    "zman-card bg-gradient-to-br from-indigo-900/50 to-blue-900/30 border border-blue-400/15 rounded-2xl p-3 hover:border-blue-400/35 hover:from-indigo-900/70 transition-all cursor-pointer zman-clickable";
  const isPast = (z) => z._ms && z._ms < nowMs;

  document.getElementById("zmanim-details").innerHTML = sorted
    .map(
      (z) => `
          <div class="${cardClass}${isPast(z) ? " opacity-50" : ""}" data-zman-key="${z.key}" onclick="showZmanOpinions('${z.key}')">
            <span class="text-blue-300/80 text-xs md:text-sm block mb-1.5 font-semibold">${z.label}</span>
            <span class="font-black text-lg md:text-xl text-white tracking-tight" dir="ltr">${z._displayVal !== undefined ? z._displayVal : ft(z.iso)}</span>
          </div>`,
    )
    .join("");

  // Apply i18n labels
  const ui = getDynamicUiText();
  const labels = ui.zmanimLabels || [];
  // Keep labels synced if i18n has overrides (legacy support)
  const rendered = document.querySelectorAll("#zmanim-details > div");
  rendered.forEach((card, i) => {
    const key = card.dataset.zmanKey;
    const zItem = zmanimList.find((z) => z.key === key);
    // i18n override by position only if label matches
    const firstSpan = card.querySelector("span");
    if (labels[i] && firstSpan) firstSpan.textContent = labels[i];
  });
}

// ── Zman Opinions Popup ───────────────────────────────────
function showZmanOpinions(key) {
  const zData = window._lastZData;
  if (!zData) return;

  const ft = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString(getCurrentLocale(), {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  // Re-compute night-watch ISO for opinions popup (mirrors renderZmanimGrid logic)
  const _opSunMs = zData.times.sunset
    ? new Date(zData.times.sunset).getTime()
    : null;
  const _opChnMs = zData.times.chatzotNight
    ? new Date(zData.times.chatzotNight).getTime()
    : null;
  const _opAshTMs =
    _opSunMs && _opChnMs
      ? Math.round(_opSunMs + (2 * (_opChnMs - _opSunMs)) / 3)
      : null;
  const _opAshBMs =
    _opSunMs && _opChnMs
      ? Math.round(_opChnMs + (_opChnMs - _opSunMs) / 3)
      : null;
  const _opBeinRaw =
    zData.times.beinHaShmashos || zData.times.beinHashmashos || null;
  const _opBeinIso =
    _opBeinRaw ||
    (_opSunMs ? new Date(_opSunMs + 13.5 * 60000).toISOString() : null);

  const opinionsMap = {
    alot: {
      label: "עלות השחר",
      rows: [{ name: 'מגן אברהם / גר"א', val: ft(zData.times.alotHaShachar) }],
    },
    talit: {
      label: "זמן טלית ותפילין",
      rows: [
        { name: "משיכיר (50 דק׳ לפני הנץ)", val: ft(zData.times.misheyakir) },
        {
          name: "משיכיר מחמיר (60 דק׳ לפני הנץ)",
          val: ft(zData.times.misheyakirMachmir),
        },
      ],
    },
    netz: {
      label: "הנץ החמה",
      rows: [{ name: "כל השיטות", val: ft(zData.times.sunrise) }],
    },
    shma: {
      label: "סוף זמן קריאת שמע",
      rows: [
        { name: "מגן אברהם (עלות–צאת)", val: ft(zData.times.sofZmanShmaMGA) },
        {
          name: 'גר"א / בעל התניא (הנץ–שקיעה)',
          val: ft(zData.times.sofZmanShma),
        },
      ],
    },
    tfilla: {
      label: "סוף זמן תפילה",
      rows: [
        { name: "מגן אברהם", val: ft(zData.times.sofZmanTfillaMGA) },
        { name: 'גר"א / בעל התניא', val: ft(zData.times.sofZmanTfilla) },
      ],
    },
    chatzot: {
      label: "חצות היום",
      rows: [
        { name: "חצות היום (מחצית היום ההלכתי)", val: ft(zData.times.chatzot) },
        { name: "חצות הלילה (לעיון)", val: ft(zData.times.chatzotNight) },
      ],
    },
    mincha_g: {
      label: "מנחה גדולה",
      rows: [
        {
          name: 'מגן אברהם / גר"א (חצי שעה אחר חצות)',
          val: ft(zData.times.minchaGedola),
        },
        {
          name: 'רפ"ב (30 דק׳ שעות זמניות)',
          val: ft(zData.times.minchaGedola72Min),
        },
      ],
    },
    mincha_k: {
      label: "מנחה קטנה",
      rows: [
        {
          name: "כל השיטות (9.5 שעות זמניות)",
          val: ft(zData.times.minchaKetana),
        },
      ],
    },
    plag: {
      label: "פלג המנחה",
      rows: [
        { name: "מגן אברהם (שעות זמניות)", val: ft(zData.times.plagHaMincha) },
        { name: 'גר"א / שו"ע הרב', val: ft(zData.times.plagHaMinchaGRA) },
      ],
    },
    shkia: {
      label: "שקיעה",
      rows: [{ name: "כל השיטות", val: ft(zData.times.sunset) }],
    },
    bein_hashmashot: {
      label: "בין השמשות",
      rows: [
        { name: 'שו"ע (כ-13.5 דק׳ אחר שקיעה)', val: ft(_opBeinIso) },
        { name: "הגדרה: ספק יום ספק לילה (ר׳ יוסף קארו)", val: "—" },
      ],
    },
    tzeit: {
      label: "צאת הכוכבים",
      rows: [
        {
          name: 'תצ"ה — 7.083° (שלושה כוכבים בינוניים)',
          val: ft(zData.times.tzeit7083deg),
        },
        {
          name: "בעל התניא — 50 דקות אחר שקיעה",
          val: ft(zData.times.tzeit50min),
        },
        {
          name: "שלושה כוכבים קטנים — 13.5 דק׳ זמניות",
          val: ft(zData.times.tzeit13Point5MinutesZmanis),
        },
      ],
    },
    ashmeret_tkona: {
      label: "אשמורת התיכונה",
      rows: [
        {
          name: "תחילת משמרת שנייה של הלילה",
          val: ft(_opAshTMs ? new Date(_opAshTMs).toISOString() : null),
        },
        {
          name: "חישוב: 2/3 מהשקיעה עד עלות השחר",
          val: ft(_opAshTMs ? new Date(_opAshTMs).toISOString() : null),
        },
      ],
    },
    ashmeret_boker: {
      label: "אשמורת הבוקר",
      rows: [
        {
          name: "תחילת אשמורת הבוקר (לפני עלות)",
          val: ft(_opAshBMs ? new Date(_opAshBMs).toISOString() : null),
        },
        {
          name: "חישוב: 4/3 מהשקיעה (= חצות + 1/3 לילה)",
          val: ft(_opAshBMs ? new Date(_opAshBMs).toISOString() : null),
        },
      ],
    },
  };

  const entry = opinionsMap[key];
  if (!entry) return;

  // Build and show modal
  let existing = document.getElementById("zman-opinions-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "zman-opinions-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
  modal.innerHTML = `
          <div style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:360px;box-shadow:0 25px 60px rgba(0,0,0,0.5);text-align:right;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
              <h3 style="color:#e2e8f0;font-size:1.25rem;font-weight:900;margin:0;">${entry.label}</h3>
              <button onclick="document.getElementById('zman-opinions-modal').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
            <p style="color:#64748b;font-size:0.75rem;margin-bottom:1rem;">כל הדעות וחישובי השיטות</p>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${entry.rows
                .map(
                  (r) => `
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:1rem;padding:0.75rem 1rem;">
                  <span style="color:#93c5fd;font-size:0.8rem;font-weight:600;">${r.name}</span>
                  <span style="color:#f8fafc;font-size:1.1rem;font-weight:900;direction:ltr;">${r.val}</span>
                </div>`,
                )
                .join("")}
            </div>
          </div>`;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
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
      if (
        kzPrev &&
        kzPrev.times &&
        kzPrev.times.sunset &&
        kzCurr &&
        kzCurr.times
      ) {
        resPrev = kzPrev;
        resCurr = kzCurr;
      } else {
        let prevIso = prevDay.toISOString().split("T")[0];
        [resPrev, resCurr] = await Promise.all([
          fetchHebcalWithCache(
            `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${prevIso}`,
          ),
          fetchHebcalWithCache(
            `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`,
          ),
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
        res = await fetchHebcalWithCache(
          `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`,
        );
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
    if (
      kzPrev &&
      kzPrev.times &&
      kzPrev.times.sunset &&
      kzCurr &&
      kzCurr.times
    ) {
      resPrev = kzPrev;
      resCurr = kzCurr;
    } else {
      let prevIso = prevDay.toISOString().split("T")[0];
      [resPrev, resCurr] = await Promise.all([
        fetchHebcalWithCache(
          `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${prevIso}`,
        ),
        fetchHebcalWithCache(
          `https://www.hebcal.com/zmanim?cfg=json&${getGeoParams()}&date=${dateStr}`,
        ),
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
            const cityCoords = {
              lat: item.latitude,
              lon: item.longitude,
              tzid: item.timezone || "Asia/Jerusalem",
              elevation: item.elevation || 0,
            };
            localStorage.setItem(
              "moadim_city_coords",
              JSON.stringify(cityCoords),
            );
            window._cityCoords = cityCoords;
          }
          document.getElementById("current-city-name").textContent = item.value;
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
        document.getElementById("city-search-results").classList.add("hidden");
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
  ["shabbat", "holiday", "fast", "omer", "levana", "daf", "tefillin"].forEach(
    (id) => {
      const el = document.getElementById("notif_" + id);
      if (el) prefs[id] = el.checked;
    },
  );
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
  document.documentElement.classList.remove("fs-1", "fs-2");
  if (level === 1) document.documentElement.classList.add("fs-1");
  if (level === 2) document.documentElement.classList.add("fs-2");
}
function previewFontSize(val) {
  applyFontSize(parseInt(val));
  const lbl = document.getElementById("font-size-label");
  if (lbl) lbl.textContent = FS_LABELS[parseInt(val)] || "רגיל";
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
    window.removeEventListener("deviceorientationabsolute", compassListener);
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
    let alpha =
      e.webkitCompassHeading != null
        ? e.webkitCompassHeading
        : e.absolute && e.alpha != null
          ? (360 - e.alpha) % 360
          : null;
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
      document.getElementById("compass-dir-n").style.transform =
        `translateX(-50%) ${counterRot}`;
      document.getElementById("compass-dir-s").style.transform =
        `translateX(-50%) ${counterRot}`;
      document.getElementById("compass-dir-e").style.transform =
        `translateY(-50%) ${counterRot}`;
      document.getElementById("compass-dir-w").style.transform =
        `translateY(-50%) ${counterRot}`;
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
          .children[0].classList.replace("text-rose-500", "text-emerald-500");
      } else {
        document.getElementById("compass-status").textContent =
          "סובב את המכשיר...";
        document
          .getElementById("compass-status")
          .classList.replace("text-emerald-400", "text-blue-300");
        document
          .getElementById("compass-arrow")
          .children[0].classList.replace("text-emerald-500", "text-rose-500");
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

buildIcsContent = function (events) {
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
    if (_activeModals[_activeModals.length - 1] === "calendar-day-modal") {
      _activeModals.pop();
      // replaceState instead of history.back() — avoids triggering popstate
      // which would incorrectly close the calendar behind the day popup.
      history.replaceState({ modal: "calendar-modal" }, "");
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
    description: [
      hebrewDate,
      eventItem.titleStr || eventItem.heb || eventItem.name,
    ]
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
        return isNaN(d)
          ? "--:--"
          : d.toLocaleTimeString(getCurrentLocale(), {
              hour: "2-digit",
              minute: "2-digit",
            });
      };
      const candleTime =
        kzFriday && kzFriday.times && kzFriday.times.candleLighting
          ? fmtTime(kzFriday.times.candleLighting)
          : null;
      const havdalahTime =
        kzSaturday && kzSaturday.times && kzSaturday.times.tzeit7083deg
          ? fmtTime(kzSaturday.times.tzeit7083deg)
          : null;
      // Find parsha for this Shabbat
      const satStr = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;
      const parshaEvent = ALL_EVENTS.find(
        (e) => e.type === "parashat" && e.date === satStr,
      );
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
    } catch (e) {
      console.warn("Shabbat times error:", e);
    }
  }

  const nonParshaEvents = dayEvents.filter((e) => e.type !== "parashat");
  const eventsHtml = nonParshaEvents.length
    ? `<ul style="display:flex;flex-direction:column;gap:0.6rem;margin:0;padding:0;list-style:none;">${nonParshaEvents.map((eventItem) => `<li style="padding:0.8rem 0.9rem;border:1px solid rgba(59,130,246,0.14);border-radius:0.9rem;background:rgba(255,255,255,0.78);"><strong style="display:block;color:#0f172a;">${eventItem.name}</strong><span style="display:block;color:#475569;font-size:0.86rem;margin-top:0.25rem;">${eventItem.titleStr || eventItem.heb || ""}</span></li>`).join("")}</ul>`
    : `<p style="margin:0;color:#64748b;">אין אירועים מובנים ביום זה.</p>`;

  const modal = document.createElement("div");
  modal.id = "calendar-day-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:210;background:rgba(15,23,42,0.58);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
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
  pushModalState("calendar-day-modal");
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
      (e.name.includes(search) || (e.titleStr && e.titleStr.includes(search))),
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
    const str = encodeURIComponent(JSON.stringify(e)).replace(/'/g, "%27");

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
      major:
        "from-blue-50 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/10",
      fast: "from-rose-50 to-pink-50/60 dark:from-rose-900/20 dark:to-pink-900/10",
      moon: "from-purple-50 to-violet-50/60 dark:from-purple-900/20 dark:to-violet-900/10",
      "rosh-chodesh":
        "from-emerald-50 to-teal-50/60 dark:from-emerald-900/20 dark:to-teal-900/10",
      minor:
        "from-slate-50 to-gray-50/60 dark:from-slate-800/40 dark:to-slate-800/20",
    };
    const cardGradient = gradientMap[e.type] || gradientMap.minor;
    const isToday = diff <= 0;
    // Moon window open: show end-of-window countdown
    const isMoonOpen =
      e.type === "moon" && e.heb === "ניתן לברך כעת" && e.endDate;
    const moonDaysLeft = isMoonOpen ? getDaysDiff(e.endDate) : 0;
    const badgeText = isMoonOpen
      ? CURRENT_LANG === "he"
        ? `סוף הזמן: ${moonDaysLeft} ימים`
        : `Closes in ${moonDaysLeft} days`
      : isToday
        ? CURRENT_LANG === "he"
          ? "✨ היום"
          : "✨ Today"
        : CURRENT_LANG === "he"
          ? `בעוד ${diff} ימים`
          : `In ${diff} Days`;

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
                            <div class="${isToday && !isMoonOpen ? `bg-${color}-600 text-white shadow-lg` : isMoonOpen ? `bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300` : `bg-${color}-50 dark:bg-${color}-500/15 text-${color}-700 dark:text-${color}-300`} px-4 py-2 rounded-xl text-sm font-black md:mb-1 transition-all" aria-label="זמן נותר">${badgeText}</div>
                            <button onclick="downloadICS('${str}')" class="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-${color}-600 dark:hover:text-${color}-400 font-bold uppercase tracking-wider transition-all bg-white/70 dark:bg-slate-900/40 hover:bg-${color}-50 dark:hover:bg-${color}-900/20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-${color}-200 dark:hover:border-${color}-700">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> <span data-i18n-key="sync_mobile">סנכרן</span>
                            </button>
                            ${window._matchMoad && window._matchMoad(e.name) && window._DT[window._matchMoad(e.name)] ? `<button data-moad-name="${e.name.replace(/"/g, "&quot;")}" onclick="window._openMoadByName(this.dataset.moadName);event.stopPropagation();" class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700">📖 דבר תורה</button>` : ""}
                        </div>
                    </article>`;
    const latestCard = c.lastElementChild;
    const countdownEl = latestCard?.querySelector("[aria-label]");
    if (countdownEl && !isMoonOpen)
      countdownEl.textContent = formatDaysUntilText(diff);
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
  btn.classList.add("active", "bg-blue-600", "text-white", "border-blue-600");
  btn.setAttribute("aria-pressed", "true");
  render(t, document.getElementById("mainSearch").value);
}
document.getElementById("mainSearch").addEventListener("input", (e) => {
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
  pushModalState("calendar-modal");
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
  if (_activeModals[_activeModals.length - 1] === "calendar-modal") {
    _activeModals.pop();
    history.back();
  }
}

async function changeMonth(offset) {
  CALENDAR_DISPLAY_DATE.setMonth(CALENDAR_DISPLAY_DATE.getMonth() + offset);
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
  if (grid)
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94a3b8;font-size:0.9rem;direction:rtl;">טוען נתונים...</div>';
  try {
    const data = await fetchHebcalWithCache(
      `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&i=on&maj=on&min=on&nx=on&mf=on&ss=on&mod=on&s=on`,
    );
    if (!data || !data.items) return;
    const parsed = [];
    data.items.forEach(function (ev) {
      if (!ev.date || !ev.category) return;
      if (ev.category === "candles" || ev.category === "havdalah") return;
      var type = "minor",
        icon = "📅";
      var name = ev.hebrew || ev.title || "";
      if (ev.category === "roshchodesh") {
        type = "rosh-chodesh";
        icon = "🌙";
      } else if (ev.category === "parashat") {
        type = "parashat";
        icon = "📖";
        name = "פרשת " + (ev.hebrew || ev.title || "");
      } else if (ev.category === "holiday") {
        var lc = (ev.title || "").toLowerCase();
        if (lc.includes("fast") || lc.includes("tzom")) {
          type = "fast";
          icon = "⚡";
        } else if (ev.yomtov) {
          type = "major";
          icon = "✨";
        }
      }
      parsed.push({
        name: name,
        date: ev.date,
        type: type,
        heb: ev.hebrew || "",
        icon: icon,
      });
    });
    if (!window.ALL_EVENTS_FULL) window.ALL_EVENTS_FULL = [];
    window.ALL_EVENTS_FULL = window.ALL_EVENTS_FULL.filter(function (e) {
      return !e.date.startsWith(year + "-");
    })
      .concat(parsed)
      .sort(function (a, b) {
        return new Date(a.date) - new Date(b.date);
      });
  } catch (err) {
    window.FETCHED_YEARS.delete(year);
  }
}

function openMonthYearPicker() {
  const existing = document.getElementById("cal-month-year-picker");
  if (existing) {
    existing.remove();
    return;
  }

  const todayY = new Date().getFullYear();
  const selY = CALENDAR_DISPLAY_DATE.getFullYear();
  const selM = CALENDAR_DISPLAY_DATE.getMonth();
  const HE_MONTHS = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];
  const minYear = todayY - 30;
  const maxYear = todayY + 5;

  const picker = document.createElement("div");
  picker.id = "cal-month-year-picker";
  picker.style.cssText = [
    "position:fixed;z-index:99999;",
    "background:#1e293b;border:1px solid rgba(255,255,255,0.18);",
    "border-radius:1rem;padding:1rem 0.85rem 0.85rem;",
    "box-shadow:0 12px 40px rgba(0,0,0,0.6);min-width:250px;",
    "direction:rtl;",
  ].join("");

  const titleEl = document.getElementById("cal-month-title");
  if (titleEl) {
    const r = titleEl.getBoundingClientRect();
    picker.style.top = r.bottom + 8 + "px";
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
  html +=
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.35rem;">';
  HE_MONTHS.forEach(function (mn, idx) {
    const act = idx === selM && selY === CALENDAR_DISPLAY_DATE.getFullYear();
    html += `<button onclick="window._calPickerMonth(${idx})" style="padding:0.35rem 0.1rem;border-radius:0.5rem;border:none;cursor:pointer;font-size:0.78rem;font-weight:600;${act ? "background:#3b82f6;color:#fff;" : "background:rgba(255,255,255,0.08);color:#cbd5e1;"}">${mn}</button>`;
  });
  html += "</div>";
  picker.innerHTML = html;
  document.body.appendChild(picker);

  window._calPickerYear = async function (yr) {
    CALENDAR_DISPLAY_DATE.setFullYear(yr);
    await ensureYearFetched(yr);
    buildMonthCalendar();
    const pk = document.getElementById("cal-month-year-picker");
    if (pk) pk.remove();
    openMonthYearPicker();
  };
  window._calPickerMonth = async function (mIdx) {
    CALENDAR_DISPLAY_DATE.setMonth(mIdx);
    await ensureYearFetched(CALENDAR_DISPLAY_DATE.getFullYear());
    buildMonthCalendar();
    const pk = document.getElementById("cal-month-year-picker");
    if (pk) pk.remove();
  };

  setTimeout(function () {
    document.addEventListener("click", function _closePicker(e) {
      const pk = document.getElementById("cal-month-year-picker");
      if (!pk) {
        document.removeEventListener("click", _closePicker);
        return;
      }
      const sel = document.getElementById("cal-year-select");
      if (
        !pk.contains(e.target) &&
        e.target.id !== "cal-month-title" &&
        e.target.id !== "cal-month-heb"
      ) {
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
  document.getElementById("cal-month-title").textContent = d.toLocaleDateString(
    ui.calendarLocale,
    {
      month: "long",
      year: "numeric",
    },
  );
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
      dStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
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

    const evs = (window.ALL_EVENTS_FULL || ALL_EVENTS).filter(
      (e) => e.date === dStr,
    );
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
      evHtml += `<div class="bg-yellow-400 text-yellow-900 text-[9px] md:text-xs px-1 py-0.5 rounded-md shadow-sm w-full font-bold leading-tight break-words" title="${dayNote.substring(0, 80)}">📝 ${dayNote.substring(0, 14)}${dayNote.length > 14 ? "…" : ""}</div>`;
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
  btn.classList.remove("bg-slate-300", "bg-green-500", "dark:bg-slate-600");
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

  const prefs = JSON.parse(localStorage.getItem("moadim_notif_prefs") || "{}");
  ["shabbat", "holiday", "fast", "omer", "levana", "daf", "tefillin"].forEach(
    (id) => {
      const el = document.getElementById("notif_" + id);
      if (el) {
        el.checked = prefs[id] !== false;
        el.disabled = !enabled;
      }
    },
  );
  return;
}

// ─── Notification Scheduler (fires every 45s for better accuracy) ─────────
setInterval(() => {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!getNotifMasterPreference()) return;

    const prefs = JSON.parse(
      localStorage.getItem("moadim_notif_prefs") || "{}",
    );
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const h = now.getHours(),
      m = now.getMinutes();

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
      } catch (e) {
        console.warn("Notification failed:", e);
      }
    };

    // minutes remaining until target (positive = future)
    const minsUntil = (t) => (t ? (t - now) / 60000 : null);
    // minutes elapsed since target (positive = past)
    const minsSince = (t) => (t ? (now - t) / 60000 : null);

    // ── 🕯️ Shabbat candle lighting (30 min warning) ──
    if (prefs.shabbat !== false && window.SHABBAT_CANDLES_TIME) {
      const d = minsUntil(window.SHABBAT_CANDLES_TIME);
      // Window: 32-25 minutes before (generous range for timer drift)
      if (d !== null && d >= 25 && d <= 32)
        fireNotif(
          "shabbat",
          "🕯️ " + SITE_NAME,
          "הדלקת נרות שבת בעוד כ-30 דקות!",
          "shabbat",
        );
    }

    // ── 🎊 Holiday candle lighting (30 min warning) ──
    if (prefs.holiday !== false && window.HOLIDAY_CANDLES_TIME) {
      const d = minsUntil(window.HOLIDAY_CANDLES_TIME);
      if (d !== null && d >= 25 && d <= 32)
        fireNotif(
          "holiday",
          "🎊 " + SITE_NAME,
          "כניסת החג בעוד כ-30 דקות!",
          "holiday",
        );
    }

    // ── ⚖️ Fast ending (30 min warning) ──
    if (prefs.fast !== false && window.FAST_END_TIME) {
      const d = minsUntil(window.FAST_END_TIME);
      if (d !== null && d >= 25 && d <= 32)
        fireNotif(
          "fast",
          "⚖️ " + SITE_NAME,
          "הצום מסתיים בעוד כ-30 דקות!",
          "fast",
        );
    }

    // ── ✨ Omer count (at nightfall / within 20 min after tzeit) ──
    if (
      prefs.omer !== false &&
      window.TZEIT_TIME &&
      CURRENT_OMER_DAY > 0 &&
      CURRENT_OMER_DAY < 49
    ) {
      const d = minsSince(window.TZEIT_TIME);
      if (d !== null && d >= 0 && d <= 20) {
        const omerBody =
          `היום ${omerDaysWords[CURRENT_OMER_DAY]} לעומר` +
          (typeof getOmerSefirotText === "function"
            ? ` — ${getOmerSefirotText(CURRENT_OMER_DAY)}`
            : "");
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
      fireNotif(
        "tefillin",
        "🧿 תזכורת תפילין",
        "הגיע הזמן להניח תפילין!",
        "tefillin",
      );

    // ── 🌙 Kiddush Levana — window opens (at first nightfall of window) ──
    if (prefs.levana !== false && window.TZEIT_TIME) {
      const d = minsSince(window.TZEIT_TIME);
      if (d !== null && d >= 0 && d <= 20) {
        if (window.LEVANA_START_DATE === todayStr)
          fireNotif(
            "levana_start",
            "🌙 קידוש לבנה",
            "החל מהערב ניתן לברך ברכת הלבנה!",
            "levana_start",
          );
        if (window.LEVANA_END_DATE === todayStr)
          fireNotif(
            "levana_end",
            "🌙 קידוש לבנה",
            "⚠️ הלילה הוא ההזדמנות האחרונה לברך!",
            "levana_end",
          );
      }
      // 2-day warning before levana ends
      if (window.LEVANA_END_DATE) {
        const endDate = new Date(window.LEVANA_END_DATE);
        const daysUntilEnd = Math.ceil(
          (endDate - new Date(todayStr)) / 86400000,
        );
        if (daysUntilEnd === 2 && d !== null && d >= 0 && d <= 20)
          fireNotif(
            "levana_warn",
            "🌙 קידוש לבנה",
            "⏰ נותרו 2 ימים לברכת הלבנה!",
            "levana_warn",
          );
      }
    }
  } catch (err) {
    console.warn("Notification scheduler error:", err);
  }
}, 45000); // Every 45 seconds for better accuracy than 60s

initApp();

// ═══════════════════════════════════════════════════════
// ✦  STARS CANVAS ANIMATION
// ═══════════════════════════════════════════════════════
(function initStars() {
  const canvas = document.getElementById("stars-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let stars = [],
    W,
    H;

  function resize() {
    const hero = document.getElementById("hero-section");
    W = canvas.width = hero ? hero.offsetWidth : window.innerWidth;
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
    const speedScale = isMobile ? W / 320 : W / 900;
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
        twinkleSpeed: Math.random() * 0.015 + 0.004, // faster twinkle
        phase: Math.random() * Math.PI * 2,
        vx: Math.cos(angle) * driftSpeed,
        vy: Math.sin(angle) * driftSpeed,
        sparkle: 0,
        sparklePeak: 0,
        // ~20% of stars get a cross/spike shape when sparkling
        crossStar: Math.random() < 0.2,
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
          s.sparkle = 60 + Math.random() * 50;
          s.sparklePeak = 0.65 + Math.random() * 0.35;
        }
      }

      stars.forEach((s) => {
        // Drift movement
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = W + 2;
        if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2;
        if (s.y > H + 2) s.y = -2;

        // Ambient twinkle — deeper oscillation so it reads on mobile
        let a =
          s.alpha * (0.38 + 0.62 * Math.sin(t * s.twinkleSpeed * 60 + s.phase));

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
            grd.addColorStop(
              0,
              "rgba(210,225,255," + (boost * 0.65).toFixed(3) + ")",
            );
            grd.addColorStop(1, "rgba(210,225,255,0)");
            ctx.beginPath();
            ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Cross/spike effect for designated sparkle stars
            if (s.crossStar && boost > 0.25) {
              const spikeLen = s.r * 6 * boost;
              const spikeAlpha = (boost * 0.7).toFixed(3);
              ctx.strokeStyle = "rgba(230,240,255," + spikeAlpha + ")";
              ctx.lineWidth = Math.max(0.5, s.r * 0.5);
              ctx.lineCap = "round";
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
        ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.fill();
      });
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(window._starResizeTimer);
      window._starResizeTimer = setTimeout(resize, 200);
    },
    { passive: true },
  );

  resize();
  draw();
})();

// ═══════════════════════════════════════════════════════
// ✦  TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════
function showToast(message, type = "info", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ═══════════════════════════════════════════════════════
// ✦  CARD VISIBILITY (no entrance animation)
// ═══════════════════════════════════════════════════════
function setupCardObserver() {
  // Cards are visible immediately — just mark them all as .visible
  document
    .querySelectorAll(".event-card")
    .forEach((card) => card.classList.add("visible"));
}

// ═══════════════════════════════════════════════════════
// ✦  LIVE SHABBAT COUNTDOWN
// ═══════════════════════════════════════════════════════
// ✦  SHABBAT INFO POPUP (opened by clicking the countdown bar)
// ═══════════════════════════════════════════════════════
function openShabbatInfoModal() {
  document.getElementById("shabbat-info-modal")?.remove();

  const candles = window.SHABBAT_CANDLES_STR || "--:--";
  const havdalah = window.SHABBAT_HAVDALAH_STR || "--:--";
  const parasha = window.SHABBAT_PARASHA_NAME || "";
  const eTitle = window.SHABBAT_PARASHA_ETITLE || "";

  const overlay = document.createElement("div");
  overlay.id = "shabbat-info-modal";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:500",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "background:rgba(0,0,0,0.55)",
    "backdrop-filter:blur(4px)",
  ].join(";");

  const parshaBtn = parasha
    ? `
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
              <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);margin-bottom:8px;">פרשת השבוע</div>
              <button onclick="document.getElementById('shabbat-info-modal').remove();${eTitle ? `openSefariaModal('${parasha.replace(/'/g, "\'")}','${eTitle.replace(/'/g, "\'")}')` : `(window._openShabbatParasha||function(){})();`}"
                style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;border-radius:12px;padding:10px 20px;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;">
                <span>📖</span><span>${parasha}</span>
              </button>
            </div>`
    : "";

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

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      unlockBodyScroll();
    }
  });
  document.body.appendChild(overlay);
  lockBodyScroll();
}

// ═══════════════════════════════════════════════════════
let countdownInterval;
function startShabbatCountdown() {
  const wrap = document.getElementById("shabbat-countdown-wrap");
  const display = document.getElementById("countdown-display");
  const eventLabel = document.getElementById("countdown-event-type");
  if (!wrap || !display) return;

  // Determine which candle-lighting to count down to
  const now = new Date();
  const isFriday = now.getDay() === 5;
  const hasHolidayCandles =
    !!window.HOLIDAY_CANDLES_TIME && window.HOLIDAY_CANDLES_TIME > now;
  const hasShabbatCandles =
    !!window.SHABBAT_CANDLES_TIME && window.SHABBAT_CANDLES_TIME > now;

  let target = null;
  let label = "";

  if (isFriday && hasShabbatCandles) {
    target = window.SHABBAT_CANDLES_TIME;
    label = "כניסת שבת";
  } else if (hasHolidayCandles) {
    target = window.HOLIDAY_CANDLES_TIME;
    label = "כניסת החג";
  } else if (isFriday && hasShabbatCandles) {
    target = window.SHABBAT_CANDLES_TIME;
    label = "כניסת שבת";
  }

  if (!target) {
    wrap.classList.add("hidden");
    return;
  }
  if (eventLabel) eventLabel.textContent = label;

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      clearInterval(countdownInterval);
      wrap.classList.add("hidden");
      return;
    }
    const totalSecs = Math.floor(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (h > 48) {
      wrap.classList.add("hidden");
      return;
    }
    display.textContent =
      h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    wrap.classList.remove("hidden");
    wrap.style.opacity = "1";
  }

  clearInterval(countdownInterval);
  tick();
  countdownInterval = setInterval(tick, 1000);
}

// ═══════════════════════════════════════════════════════
// ✦  OMER PROGRESS RING UPDATE
// ═══════════════════════════════════════════════════════
function updateOmerRing(day) {
  const ring = document.getElementById("omer-ring-progress");
  const bar = document.getElementById("omer-bar-fill");
  if (!ring || !bar || day < 1) return;
  const circumference = 263.9;
  const pct = day / 49;
  const offset = circumference * (1 - pct);
  setTimeout(() => {
    ring.style.strokeDashoffset = offset.toFixed(2);
    bar.style.width = (pct * 100).toFixed(1) + "%";
  }, 400);
}

// ═══════════════════════════════════════════════════════
// ✦  ZMANIM DAY PROGRESS BAR
// ═══════════════════════════════════════════════════════
function updateDayProgressBar(sunriseTime, sunsetTime) {
  const fill = document.getElementById("zmanim-day-bar-fill");
  if (!fill) return;
  const now = new Date();
  if (!sunriseTime || !sunsetTime) return;
  const rise = new Date(sunriseTime);
  const set = new Date(sunsetTime);
  if (isNaN(rise) || isNaN(set)) return;
  const total = set - rise;
  const elapsed = now - rise;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  fill.style.width = pct.toFixed(1) + "%";
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
      beinIso:
        bundle.prev?.times?.beinHaShmashos ||
        bundle.prev?.times?.beinHashmashos ||
        null,
    },
    {
      key: "todayNight",
      bucket: "today",
      dayOffset: 1,
      sunsetIso: bundle.today?.times?.sunset || null,
      alotIso: bundle.next?.times?.alotHaShachar || null,
      chatzotIso: bundle.today?.times?.chatzotNight || null,
      beinIso:
        bundle.today?.times?.beinHaShmashos ||
        bundle.today?.times?.beinHashmashos ||
        null,
    },
  ];
}

function buildNightDerivedCandidates(bundle, type) {
  const out = [];
  getNightSegments(bundle).forEach((segment) => {
    const sunsetMs = segment.sunsetIso
      ? new Date(segment.sunsetIso).getTime()
      : null;
    const alotMs = segment.alotIso ? new Date(segment.alotIso).getTime() : null;
    const chatzotMs = segment.chatzotIso
      ? new Date(segment.chatzotIso).getTime()
      : null;
    if (!sunsetMs || !(alotMs || chatzotMs)) return;

    let iso = null;
    if (type === "chatzot") {
      iso = segment.chatzotIso || toIso(sunsetMs + (alotMs - sunsetMs) / 2);
    } else if (type === "ashmeret") {
      const endMs =
        alotMs || (chatzotMs ? sunsetMs + (chatzotMs - sunsetMs) * 2 : null);
      if (endMs) iso = toIso(sunsetMs + (endMs - sunsetMs) / 3);
    } else if (type === "bein") {
      iso = segment.beinIso || toIso(sunsetMs + 13.5 * 60 * 1000);
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
  const future = candidates
    .filter((candidate) => candidate.ms >= nowMs)
    .sort((a, b) => a.ms - b.ms);
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
    return (
      valid
        .filter((opinion) => opinion.ms >= nowMs)
        .sort((a, b) => a.ms - b.ms)[0] || valid.sort((a, b) => b.ms - a.ms)[0]
    );
  }
  return valid[0];
}

function buildOccurrenceHint(opinion) {
  if (!opinion?.iso) return "לא זמין כעת";
  if (opinion.dayOffset > 0) return `${opinion.shortLabel} · מחר`;
  if (opinion.bucket === "prev" || opinion.segment === "prevNight")
    return `${opinion.shortLabel} · כבר עבר`;
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
        enrichOpinion(
          {
            id: "alotHaShachar",
            label: "עלות השחר",
            shortLabel: "עלות השחר",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "alotHaShachar", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "talit",
      label: "זמן טלית ותפילין",
      opinions: [
        enrichOpinion(
          {
            id: "misheyakir",
            label: "משיכיר",
            shortLabel: "משיכיר",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "misheyakir", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "misheyakirMachmir",
            label: "משיכיר מחמיר",
            shortLabel: "משיכיר מחמיר",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "misheyakirMachmir", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "netz",
      label: "הנץ החמה",
      opinions: [
        enrichOpinion(
          {
            id: "sunrise",
            label: "הנץ החמה",
            shortLabel: "הנץ",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "sunrise", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "shma",
      label: 'סוף ק"ש',
      opinions: [
        enrichOpinion(
          {
            id: "sofZmanShmaMGA",
            label: "מגן אברהם",
            shortLabel: "מגן אברהם",
            method: "MGA",
            candidates: getFieldCandidates(bundle, "sofZmanShmaMGA", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "sofZmanShma",
            label: 'הגר"א',
            shortLabel: 'הגר"א',
            method: "GRA",
            candidates: getFieldCandidates(bundle, "sofZmanShma", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "tfilla",
      label: "סוף תפילה",
      opinions: [
        enrichOpinion(
          {
            id: "sofZmanTfillaMGA",
            label: "מגן אברהם",
            shortLabel: "מגן אברהם",
            method: "MGA",
            candidates: getFieldCandidates(bundle, "sofZmanTfillaMGA", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "sofZmanTfilla",
            label: 'הגר"א',
            shortLabel: 'הגר"א',
            method: "GRA",
            candidates: getFieldCandidates(bundle, "sofZmanTfilla", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "chatzot",
      label: "חצות יום / לילה",
      opinions: [
        enrichOpinion(
          {
            id: "chatzotDay",
            label: "חצות יום",
            shortLabel: "חצות יום",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "chatzot", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "chatzotNight",
            label: "חצות לילה",
            shortLabel: "חצות לילה",
            method: "ALL",
            candidates: buildNightDerivedCandidates(bundle, "chatzot"),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "mincha_g",
      label: "מנחה גדולה",
      opinions: [
        enrichOpinion(
          {
            id: "minchaGedola",
            label: "מנחה גדולה",
            shortLabel: "מנחה גדולה",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "minchaGedola", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "minchaGedola72Min",
            label: "72 דקות",
            shortLabel: "72 דקות",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "minchaGedola72Min", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "mincha_k",
      label: "מנחה קטנה",
      opinions: [
        enrichOpinion(
          {
            id: "minchaKetana",
            label: "מנחה קטנה",
            shortLabel: "מנחה קטנה",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "minchaKetana", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "plag",
      label: "פלג המנחה",
      opinions: [
        enrichOpinion(
          {
            id: "plagHaMincha",
            label: "מגן אברהם",
            shortLabel: "מגן אברהם",
            method: "MGA",
            candidates: getFieldCandidates(bundle, "plagHaMincha", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "plagHaMinchaGRA",
            label: 'הגר"א',
            shortLabel: 'הגר"א',
            method: "GRA",
            candidates: getFieldCandidates(bundle, "plagHaMinchaGRA", [
              "today",
              "next",
            ]),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "shkia",
      label: "שקיעה",
      opinions: [
        enrichOpinion(
          {
            id: "sunset",
            label: "שקיעה",
            shortLabel: "שקיעה",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "sunset"),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "bein_hashmashot",
      label: "בין השמשות",
      opinions: [
        enrichOpinion(
          {
            id: "beinHashmashot",
            label: "בין השמשות",
            shortLabel: "בין השמשות",
            method: "ALL",
            candidates: buildNightDerivedCandidates(bundle, "bein"),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "tzeit",
      label: "צאת הכוכבים",
      opinions: [
        enrichOpinion(
          {
            id: "tzeit7083deg",
            label: "7.083°",
            shortLabel: "7.083°",
            method: methodKey,
            candidates: getFieldCandidates(bundle, "tzeit7083deg"),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "tzeit50min",
            label: "50 דקות",
            shortLabel: "50 דקות",
            method: "ALL",
            candidates: getFieldCandidates(bundle, "tzeit50min"),
          },
          bundle,
          nowMs,
        ),
        enrichOpinion(
          {
            id: "tzeit13Point5MinutesZmanis",
            label: "13.5 דקות זמניות",
            shortLabel: "13.5 דקות",
            method: "ALL",
            candidates: getFieldCandidates(
              bundle,
              "tzeit13Point5MinutesZmanis",
            ),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "ashmeret_tichona",
      label: "אשמורת התיכונה",
      opinions: [
        enrichOpinion(
          {
            id: "ashmeretMiddle",
            label: "אשמורת התיכונה",
            shortLabel: "אשמורת תיכונה",
            method: "ALL",
            candidates: buildNightDerivedCandidates(bundle, "ashmeret"),
          },
          bundle,
          nowMs,
        ),
      ],
    },
    {
      key: "ashmeret_haboker",
      label: "אשמורת הבוקר",
      opinions: [
        enrichOpinion(
          {
            id: "ashmeretMorning",
            label: "אשמורת הבוקר",
            shortLabel: "אשמורת הבוקר",
            method: "ALL",
            candidates: getNightSegments(bundle).flatMap((segment) => {
              const sunsetMs = segment.sunsetIso
                ? new Date(segment.sunsetIso).getTime()
                : null;
              const alotMs = segment.alotIso
                ? new Date(segment.alotIso).getTime()
                : null;
              const chatzotMs = segment.chatzotIso
                ? new Date(segment.chatzotIso).getTime()
                : null;
              if (!sunsetMs || !(alotMs || chatzotMs)) return [];
              const endMs =
                alotMs ||
                (chatzotMs ? sunsetMs + (chatzotMs - sunsetMs) * 2 : null);
              if (!endMs) return [];
              return [
                {
                  iso: toIso(sunsetMs + ((endMs - sunsetMs) * 2) / 3),
                  ms: sunsetMs + ((endMs - sunsetMs) * 2) / 3,
                  bucket: segment.bucket,
                  dayOffset: segment.dayOffset,
                  segment: segment.key,
                },
              ];
            }),
          },
          bundle,
          nowMs,
        ),
      ],
    },
  ].map((definition, index) => {
    const primary = getPrimaryOpinion(
      definition.key,
      definition.opinions,
      methodKey,
      nowMs,
    );
    return {
      ...definition,
      orderIndex:
        ZMANIM_FALLBACK_ORDER.indexOf(definition.key) >= 0
          ? ZMANIM_FALLBACK_ORDER.indexOf(definition.key)
          : index,
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
      isSelected:
        opinion.method === getZmanimMethodKey() ||
        (item.primary && opinion.id === item.primary.id),
    }));
  return {
    label: item.label,
    rows: rows.length
      ? rows
      : [{ label: "אין זמן זמין כרגע", value: "--:--", isSelected: false }],
  };
}

renderZmanimGrid = function (zData) {
  window._lastZData = zData;
  const normalized = normalizeZmanim(zData);
  window._lastNormalizedZmanim = normalized;

  const activeTzeit =
    normalized.byKey?.tzeit?.primary?.iso || zData?.times?.tzeit7083deg;
  if (activeTzeit) window.TZEIT_TIME = new Date(activeTzeit);

  const cardClass =
    "zman-card bg-gradient-to-br from-indigo-900/50 to-blue-900/30 border border-blue-400/15 rounded-2xl p-3 hover:border-blue-400/35 hover:from-indigo-900/70 transition-all cursor-pointer zman-clickable";
  document.getElementById("zmanim-details").innerHTML = normalized.orderedItems
    .map(
      (item) => `
            <div class="${cardClass}" data-zman-key="${item.key}" onclick="showZmanOpinions('${item.key}')">
              <span class="text-blue-300/80 text-xs md:text-sm block mb-1.5 font-semibold">${item.label}</span>
              <span class="font-black text-lg md:text-xl text-white tracking-tight" dir="ltr">${item.displayValue}</span>
              <span class="zman-meta">${item.meta}</span>
            </div>
          `,
    )
    .join("");
};

showZmanOpinions = function (key) {
  const payload = buildZmanimOpinionsPayload(key);
  if (!payload) return;

  let existing = document.getElementById("zman-opinions-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "zman-opinions-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
  modal.innerHTML = `
          <div style="background:linear-gradient(145deg,#1e293b,#0f172a);border:1px solid rgba(99,102,241,0.3);border-radius:2rem;padding:2rem;width:100%;max-width:380px;box-shadow:0 25px 60px rgba(0,0,0,0.5);text-align:right;direction:rtl;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
              <h3 style="color:#e2e8f0;font-size:1.25rem;font-weight:900;margin:0;">${payload.label}</h3>
              <button onclick="document.getElementById('zman-opinions-modal').remove()" style="background:rgba(255,255,255,0.08);border:none;color:#94a3b8;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
            </div>
            <p style="color:#64748b;font-size:0.75rem;margin-bottom:1rem;">כל השיטות הזמינות לזמן זה. השיטה הפעילה מסומנת.</p>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${payload.rows
                .map(
                  (row) => `
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.8rem;background:${row.isSelected ? "rgba(59,130,246,0.18)" : "rgba(99,102,241,0.12)"};border:1px solid ${row.isSelected ? "rgba(96,165,250,0.42)" : "rgba(99,102,241,0.2)"};border-radius:1rem;padding:0.85rem 1rem;">
                  <span style="color:${row.isSelected ? "#dbeafe" : "#93c5fd"};font-size:0.83rem;font-weight:700;">${row.label}${row.isSelected ? " · נבחר" : ""}</span>
                  <span style="color:#f8fafc;font-size:1.05rem;font-weight:900;direction:ltr;">${row.value}</span>
                </div>
              `,
                )
                .join("")}
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
    mizrahi: {
      weekday: [
        "Siddur_Edot_HaMizrach,_Weekday_Arvit",
        "Siddur_Edot_HaMizrach,_Weekday_Maariv",
      ],
    },
    sfard: { weekday: ["Siddur_Sefard,_Weekday_Maariv"] },
    ashkenaz: { weekday: ["Siddur_Ashkenaz,_Weekday,_Maariv"] },
  },
  "birchot-hashachar": {
    mizrahi: { weekday: ["Siddur_Edot_HaMizrach,_Birchot_HaShachar"] },
    sfard: { weekday: ["Siddur_Sefard,_Birchot_HaShachar"] },
    ashkenaz: { weekday: ["Siddur_Ashkenaz,_Birkhot_HaShachar"] },
  },
  shema: {
    mizrahi: {
      weekday: [
        "Siddur_Edot_HaMizrach,_Kriat_Shema_Sheal_HaMitah",
        "The_Shema",
      ],
    },
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
    mizrahi: {
      weekday: [
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel",
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah",
      ],
    },
    sfard: {
      weekday: [
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel",
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah",
      ],
    },
    ashkenaz: {
      weekday: [
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel",
        "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah",
      ],
    },
  },
};

const PRAYER_SOURCE_PRIORITY = {
  shacharit: "local-first",
  maariv: "full-sefaria-compose",
  mincha: "full-sefaria-compose",
  "birchot-hashachar": "full-sefaria-compose",
  shema: "local-first",
  "al-hamichya": "composite-local",
  "kiddush-levana": "full-sefaria-compose",
  "tikkun-haklali": "local-first",
  "tikkun-chatzot": "full-sefaria-compose",
  "birkat-hamazon": "local-first",
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
    mizrahi: ["Siddur_Edot_HaMizrach,_Blessing_of_the_Moon"],
  },
  "tikkun-chatzot": {
    mizrahi: [
      "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_LeShem_Yichud",
      "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Rachel",
      "Siddur_Edot_HaMizrach,_The_Midnight_Rite,_Tikkun_Leah",
    ],
  },
  "birkat-hamazon": {
    mizrahi: ["Siddur_Edot_HaMizrach,_Post_Meal_Blessing"],
    sfard: ["Siddur_Sefard,_Birchat_HaMazon,_Birchat_HaMazon"],
    ashkenaz: ["Siddur_Ashkenaz,_Berachot,_Birkat_HaMazon"],
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
  const liveSunset = window._lastZData?.times?.sunset
    ? new Date(window._lastZData.times.sunset)
    : null;
  const events = cached.events || [];
  const joined = [cached.hebrew || "", ...events].join(" | ");
  const includesAny = (patterns) =>
    patterns.some((pattern) => joined.includes(pattern));
  return {
    displayDate,
    events,
    isShabbat:
      displayDate.getDay() === 6 ||
      includesAny(["Shabbat", "שבת"]) ||
      (liveNow.getDay() === 5 && liveSunset && liveNow >= liveSunset),
    isRoshChodesh: includesAny(["Rosh Chodesh", "ראש חודש"]),
    isChanukah: includesAny(["Chanukah", "Hanukkah", "חנוכה"]),
    isPurim: includesAny(["Purim", "פורים"]),
    isPesach: includesAny(["Pesach", "Passover", "פסח"]),
    isShavuot: includesAny(["Shavuot", "שבועות"]),
    isSukkot: includesAny([
      "Sukkot",
      "סוכות",
      "Shemini Atzeret",
      "שמיני עצרת",
      "Simchat Torah",
      "שמחת תורה",
    ]),
    isYomKippur: includesAny(["Yom Kippur", "יום כיפור"]),
    isRoshHaShana: includesAny(["Rosh Hashana", "ראש השנה"]),
    isYamimNoraim: includesAny([
      "Rosh Hashana",
      "ראש השנה",
      "Yom Kippur",
      "יום כיפור",
    ]),
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
  doc
    .querySelectorAll(
      "script,style,table,.mw-editsection,.navbox,.toc,.metadata,.noprint,sup.reference,span.mw-editsection,div.sistersitebox",
    )
    .forEach((node) => node.remove());
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
    blocks.push(
      `<div class="seasonal-block"><strong>ראש חודש:</strong><div>מוסיפים בתפילת העמידה ובברכת המזון את "יעלה ויבוא", ובשחרית אומרים הלל.</div></div>`,
    );
  }
  if (tefillahLike && (context.isChanukah || context.isPurim)) {
    blocks.push(
      `<div class="seasonal-block"><strong>${context.isChanukah ? "חנוכה" : "פורים"}:</strong><div>מוסיפים "על הנסים" בהודאה. בחנוכה אומרים הלל שלם, ובפורים קוראים את המגילה במקומה.</div></div>`,
    );
  }
  if (
    tefillahLike &&
    (context.isPesach || context.isShavuot || context.isSukkot)
  ) {
    blocks.push(
      `<div class="seasonal-block"><strong>יום טוב:</strong><div>זהו יום טוב. משתמשים בנוסח יום טוב המתאים ליום ומוסיפים "יעלה ויבוא" וכן הלל/מוסף לפי המועד.</div></div>`,
    );
  }
  if (tefillahLike && context.isYamimNoraim) {
    blocks.push(
      `<div class="seasonal-block"><strong>ימים נוראים:</strong><div>מוסיפים בעמידה "זכרנו לחיים", "מי כמוך", "וכתוב לחיים" ו"בספר חיים" לפי מנהג הנוסח.</div></div>`,
    );
  }
  if (key === "birkat-hamazon" && context.isShabbat) {
    blocks.push(
      `<div class="seasonal-block"><strong>שבת:</strong><div>מוסיפים בברכת המזון "רצה והחליצנו".</div></div>`,
    );
  }
  if (key === "birkat-hamazon" && context.isRoshChodesh) {
    blocks.push(
      `<div class="seasonal-block"><strong>ראש חודש:</strong><div>מוסיפים בברכת המזון "יעלה ויבוא".</div></div>`,
    );
  }
  if (key === "al-hamichya" && context.isShabbat) {
    blocks.push(
      `<div class="seasonal-block"><strong>שבת:</strong><div>בברכת מעין שלוש מוסיפים "ורצה והחליצנו ביום השבת הזה".</div></div>`,
    );
  }
  if (key === "kiddush-levana") {
    blocks.push(
      `<div class="seasonal-block"><strong>ברכת הלבנה:</strong><div>מברכים כשהלבנה נראית ובמנהג רוב הקהילות לא בשבת ויום טוב. יש להעדיף אמירה מתוך שמחה ובלבוש מכובד.</div></div>`,
    );
  }
  if (
    key === "tikkun-chatzot" &&
    (context.isShabbat ||
      context.isRoshHaShana ||
      context.isYomKippur ||
      context.isPesach ||
      context.isShavuot ||
      context.isSukkot)
  ) {
    blocks.push(
      `<div class="seasonal-block"><strong>היום:</strong><div>ברוב הקהילות אין אומרים תיקון חצות בשבת, ימים טובים וימים שאין אומרים בהם תחנון מסוג זה.</div></div>`,
    );
  }
  return blocks.join("");
}

function buildPrayerDbPayload(key, fallbackEntry) {
  if (!fallbackEntry) return null;
  const raw =
    fallbackEntry.nusach?.[CURRENT_NUSACH] ||
    fallbackEntry.nusach?.mizrahi ||
    fallbackEntry.nusach?.all ||
    "";
  if (!raw || !raw.trim()) return null;
  if (key === "tikkun-haklali") {
    const normalized = raw.replace(/\r\n/g, "\n").trim();
    const firstChapterIndex = normalized.search(/^פרק /m);
    const afterTehillimIndex = normalized.indexOf(
      "\nלאחר אמירת תהלים אומרים את הפסוקים:",
    );
    const intro =
      firstChapterIndex >= 0
        ? normalized.slice(0, firstChapterIndex).trim()
        : normalized;
    const chaptersText =
      firstChapterIndex >= 0
        ? normalized
            .slice(
              firstChapterIndex,
              afterTehillimIndex >= 0 ? afterTehillimIndex : normalized.length,
            )
            .trim()
        : "";
    const closing =
      afterTehillimIndex >= 0
        ? normalized.slice(afterTehillimIndex).trim()
        : "";
    const renderParagraphBlocks = (text) =>
      text
        .split(/\n{2,}/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk) => `<p>${chunk.replace(/\n/g, "<br>")}</p>`)
        .join("");
    const chaptersHtml = chaptersText
      ? chaptersText
          .split(/\n(?=פרק )/g)
          .map(
            (chapter, index) =>
              `${index > 0 ? '<hr class="prayer-divider">' : ""}<p>${chapter.trim().replace(/\n/g, "<br>")}</p>`,
          )
          .join("")
      : "";
    const introHtml = intro
      ? `<div class="prayer-supplement">${renderParagraphBlocks(intro)}</div>`
      : "";
    const closingHtml = closing
      ? `<div class="prayer-supplement">${renderParagraphBlocks(closing)}</div>`
      : "";
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
      text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל הַמִּחְיָה. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל הַמִּחְיָה.`,
    },
    {
      title: "על הגפן",
      text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הַגֶּפֶן וְעַל פְּרִי הַגֶּפֶן וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל פְּרִי הַגֶּפֶן. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל פְּרִי הַגֶּפֶן.`,
    },
    {
      title: "על הפירות",
      text: `בָּרוּךְ אַתָּה יְיָ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, עַל הָעֵץ וְעַל פְּרִי הָעֵץ וְעַל תְּנוּבַת הַשָּׂדֶה וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְיָ אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ וְעַל יְרוּשָׁלַיִם עִירֶךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ וְעַל מִזְבַּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה. כִּי אַתָּה יְיָ טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָרֶץ וְעַל הַפֵּרוֹת. בָּרוּךְ אַתָּה יְיָ עַל הָאָרֶץ וְעַל הַפֵּרוֹת.`,
    },
  ];

  return {
    html: `<div class="prayer-richtext">${sections
      .map(
        (section) => `
            <section style="margin-bottom:1.25rem;padding:0.9rem 1rem;border:1px solid rgba(96,165,250,0.18);border-radius:1rem;background:rgba(255,255,255,0.6);">
              <h3 style="margin-top:0;">${section.title}</h3>
              <p>${section.text}</p>
            </section>
          `,
      )
      .join("")}</div>`,
    sourceLabel: "מאגר פנימי מורחב",
    sourceUrl: "",
  };
}

function buildBirkatHamazonPayload(context) {
  const nusach = CURRENT_NUSACH || "mizrahi";
  function p(t) {
    return "<p>" + t + "</p>";
  }
  function sup(html) {
    return '<div class="prayer-supplement">' + html + "</div>";
  }
  const hr = '<hr class="prayer-divider">';

  const needsYaaleh =
    context.isRoshChodesh ||
    context.isPesach ||
    context.isShavuot ||
    context.isSukkot ||
    context.isRoshHaShana;
  let yaalehDayInsert = "";
  if (context.isRoshChodesh) yaalehDayInsert = "רֹאשׁ הַחֹֽדֶשׁ הַזֶּה";
  else if (context.isRoshHaShana)
    yaalehDayInsert =
      "הַזִּכָּרוֹן הַזֶּה, בְּיוֹם טוֹב מִקְרָא קֹֽדֶשׁ הַזֶּה";
  else if (context.isPesach)
    yaalehDayInsert =
      "חַג הַמַּצּוֹת הַזֶּה, בְּיוֹם טוֹב מִקְרָא קֹֽדֶשׁ הַזֶּה";
  else if (context.isShavuot)
    yaalehDayInsert =
      "חַג הַשָּׁבֻעוֹת הַזֶּה, בְּיוֹם טוֹב מִקְרָא קֹֽדֶשׁ הַזֶּה";
  else if (context.isSukkot)
    yaalehDayInsert =
      "חַג הַסֻּכּוֹת הַזֶּה, בְּיוֹם טוֹב מִקְרָא קֹֽדֶשׁ הַזֶּה";

  const parts = [];

  // ─── MIZRAHI ──────────────────────────────────────────────────────────
  if (nusach === "mizrahi") {
    // Preamble – Psalm 67 (always in Mizrahi) — rendered as supplement
    parts.push(
      sup(
        p(
          "תְּהִלִּים סז — לַמְנַצֵּ֥חַ בִּנְגִינֹ֗ת מִזְמ֥וֹר שִֽׁיר׃ אֱֽלֹהִ֗ים יְחׇנֵּ֥נוּ וִיבָרְכֵ֑נוּ יָ֤אֵֽר פָּנָ֖יו אִתָּ֣נוּ סֶֽלָה׃ לָדַ֣עַת בָּאָ֣רֶץ דַּרְכֶּ֑ךָ בְּכׇל־גּ֝וֹיִ֗ם יְשׁוּעָתֶֽךָ׃ יוֹד֖וּךָ עַמִּ֥ים ׀ אֱלֹהִ֑ים י֝וֹד֗וּךָ עַמִּ֥ים כֻּלָּֽם׃ יִ֥שְׂמְח֥וּ וִירַנְּנ֗וּ לְאֻ֫מִּ֥ים כִּֽי־תִשְׁפֹּ֣ט עַמִּ֣ים מִישֹׁ֑ר וּלְאֻמִּ֓ים ׀ בָּאָ֖רֶץ תַּנְחֵ֣ם סֶֽלָה׃ יוֹד֖וּךָ עַמִּ֥ים ׀ אֱלֹהִ֑ים י֝וֹד֗וּךָ עַמִּ֥ים כֻּלָּֽם׃ אֶ֭רֶץ נָתְנָ֣ה יְבוּלָ֑הּ יְ֝בָרְכֵ֗נוּ אֱלֹהִ֥ים אֱלֹהֵֽינוּ׃ יְבָרְכֵ֥נוּ אֱלֹהִ֑ים וְיִֽירְא֥וּ א֝וֹת֗וֹ כׇּל־אַפְסֵי־אָֽרֶץ׃",
        ) +
          p(
            "אֲבָרְכָ֣ה אֶת־יְהֹוָ֣ה בְּכׇל־עֵ֑ת תָּ֝מִ֗יד תְּֽהִלָּת֥וֹ בְּפִֽי׃ ס֥וֹף דָּבָ֖ר הַכֹּ֣ל נִשְׁמָ֑ע אֶת־הָאֱלֹהִ֤ים יְרָא֙ וְאֶת־מִצְוֺתָ֣יו שְׁמ֔וֹר כִּי־זֶ֖ה כׇּל־הָאָדָֽם: תְּהִלַּ֥ת יְהֹוָ֗ה יְֽדַבֶּ֫ר פִּ֥י וִיבָרֵ֣ךְ כׇּל־בָּ֭שָׂר שֵׁ֥ם קׇדְשׁ֗וֹ לְעוֹלָ֥ם וָעֶֽד: וַאֲנַ֤חְנוּ ׀ נְבָ֘רֵ֤ךְ יָ֗הּ מֵעַתָּ֥ה וְעַד־עוֹלָ֗ם הַֽלְלוּיָֽהּ: וַיְדַבֵּ֣ר אֵלַ֔י זֶ֚ה הַשֻּׁלְחָ֔ן אֲשֶׁ֖ר לִפְנֵ֥י יְהֹוָֽה:",
          ),
      ),
    );

    // Zimun (supplement)
    parts.push(
      sup(
        p("[אִם הַמְסֻבִּים שְׁלוֹשָׁה אוֹ יוֹתֵר אוֹמְרִים:]") +
          p(
            "יֹאמַר הַמְזַמֵּן: הַב לָן וְנִבְרִיךְ לְמַלְכָּא עִלָּאָה קַדִּישָׁא:",
          ) +
          p("וְהַמְסֻבִּים עוֹנִים: שָׁמַֽיִם:") +
          p(
            "וְאוֹמֵר הַמְזַמֵּן: בִּרְשׁוּת מַלְכָּא עִלָּאָה קַדִּישָׁא (בְּשַׁבָּת: וּבִרְשׁוּת שַׁבָּת מַלְכְּתָא) וּבִרְשׁוּת מוֹרַי וְרַבּוֹתַי וּבִרְשֽׁוּתְכֶֽם — נְבָרֵךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ:",
          ) +
          p(
            "וְהַמְסֻבִּים עוֹנִים: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ:",
          ) +
          p(
            "וְהַמְזַמֵּן חוֹזֵר: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ:",
          ),
      ),
    );

    // ברכה ראשונה — הזן
    parts.push(hr);
    parts.push(
      p(
        "בָּרוּךְ אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הָאֵל הַזָּן אוֹתָֽנוּ וְאֶת־הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ, בְּחֵן בְּחֶֽסֶד בְּרֶֽוַח וּבְרַחֲמִים רַבִּים, נֹתֵ֣ן לֶ֭חֶם לְכָל־בָּשָׂ֑ר כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ. וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֹא חָֽסַר לָֽנוּ, וְאַל־יֶחְסַר לָֽנוּ מָזוֹן תָּמִיד לְעוֹלָם וָעֶד, כִּי הוּא אֵל זָן וּמְפַרְנֵס לַכֹּל וְשֻׁלְחָנוֹ עָרוּךְ לַכֹּל, וְהִתְקִין מִחְיָה וּמָזוֹן לְכָל־בְּרִיּוֹתָיו אֲשֶׁר בָּרָא בְּרַחֲמָיו וּבְרוֹב חֲסָדָיו. כָּאָמוּר, פּוֹתֵ֥חַ אֶת־יָדֶ֑ךָ וּמַשְׂבִּ֖יעַ לְכָל־חַ֣י רָצֽוֹן. בָּרוּךְ אַתָּה יְהֹוָה, הַזָּן אֶת־הַכֹּל:",
      ),
    );

    // ברכה שנייה — הארץ
    parts.push(hr);
    parts.push(
      p(
        "נוֹדֶה לְךָ יְהֹוָה אֱלֹהֵֽינוּ עַל שֶׁהִנְחַֽלְתָּ לַאֲבוֹתֵֽינוּ, אֶֽרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה בְּרִית וְתוֹרָה חַיִּים וּמָזוֹן, עַל שֶׁהוֹצֵאתָֽנוּ מֵאֶֽרֶץ מִצְרַֽיִם, וּפְדִיתָֽנוּ מִבֵּית עֲבָדִים, וְעַל בְּרִֽיתְךָֽ שֶׁחָתַֽמְתָּ בִּבְשָׂרֵֽנוּ, וְעַל תּוֹרָֽתְךָֽ שֶׁלִּמַּדְתָּֽנוּ, וְעַל חֻקֵּי רְצוֹנָךְ שֶׁהוֹדַעְתָּֽנוּ, וְעַל חַיִּים וּמָזוֹן שֶׁאַתָּה זָן וּמְפַרְנֵס אוֹתָֽנוּ:",
      ),
    );

    // על הניסים — חנוכה
    if (context.isChanukah) {
      parts.push(
        p(
          "עַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה:",
        ),
      );
      parts.push(
        p(
          "בִּימֵי מַתִּתְיָה בֶן־יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו, כְּשֶׁעָֽמְדָֽה מַלְכוּת יָוָן הָרְשָׁעָה עַל עַמְּךָ יִשְׂרָאֵל, לְשַׁכְּחָם תּוֹרָתָךְ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנָךְ, וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים עָמַֽדְתָּ לָהֶם בְּעֵת צָרָתָם, רַֽבְתָּ אֶת רִיבָם, דַּֽנְתָּ אֶת דִּינָם, נָקַֽמְתָּ אֶת נִקְמָתָם, מָסַֽרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים, וְרַבִּים בְּיַד מְעַטִּים, וּרְשָׁעִים בְּיַד צַדִּיקִים, וּטְמֵאִים בְּיַד טְהוֹרִים, וְזֵדִים בְּיַד עֽוֹסְקֵֽי תוֹרָתֶֽךָ. לְךָ עָשִֽׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמָךְ, וּלְעַמְּךָ יִשְׂרָאֵל עָשִֽׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה. וְאַחַר כָּךְ בָּֽאוּ בָנֶֽיךָ לִדְבִיר בֵּיתֶֽךָ, וּפִנּוּ אֶת־הֵיכָלֶֽךָ, וְטִהֲרוּ אֶת־מִקְדָּשֶֽׁךָ, וְהִדְלִֽיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶֽׁךָ. וְקָֽבְעֽוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵֽלּוּ בְּהַלֵּל וּבְהוֹדָאָה. וְעָשִֽׂיתָ עִמָּהֶם נִסִּים וְנִפְלָאוֹת וְנוֹדֶה לְשִׁמְךָ הַגָּדוֹל סֶֽלָה:",
        ),
      );
    }
    // על הניסים — פורים
    if (context.isPurim) {
      parts.push(
        p(
          "עַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה:",
        ),
      );
      parts.push(
        p(
          "בִּימֵי מָרְדְּכַי וְאֶסְתֵּר בְּשׁוּשַׁן הַבִּירָה, כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע, בִּקֵּשׁ לְהַשְׁמִיד לַהֲרֹג וּלְאַבֵּד אֶת־כָּל־הַיְּהוּדִים מִנַּֽעַר וְעַד זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד, בִּשְׁלֹשָׁה עָשָׂר לְחֹֽדֶשׁ שְׁנֵים עָשָׂר, הוּא חֹֽדֶשׁ אֲדָר, וּשְׁלָלָם לָבוֹז. וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים הֵפַֽרְתָּ אֶת־עֲצָתוֹ, וְקִלְקַֽלְתָּ אֶת־מַחֲשַׁבְתּוֹ, וַהֲשֵׁבֽוֹתָ לּוֹ גְּמוּלוֹ בְרֹאשׁוֹ. וְתָלוּ אוֹתוֹ וְאֶת־בָּנָיו עַל הָעֵץ. וְעָשִֽׂיתָ עִמָּהֶם נֵס וָפֶֽלֶא וְנוֹדֶה לְשִׁמְךָ הַגָּדוֹל סֶֽלָה:",
        ),
      );
    }

    // סיום ברכת הארץ
    parts.push(
      p(
        "עַל הַכֹּל יְהֹוָה אֱלֹהֵֽינוּ אֲנַֽחְנוּ מוֹדִים לָךְ, וּמְבָֽרְכִֽים אֶת־שְׁמָךְ. כָּאָמוּר, וְאָֽכַלְתָּ֖ וְשָׂבָ֑עְתָּ וּבֵֽרַכְתָּ֙ אֶת־יְהֹוָ֣ה אֱלֹהֶ֔יךָ עַל־הָאָ֥רֶץ הַטֹּבָ֖ה אֲשֶׁ֥ר נָֽתַן־לָֽךְ. בָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָֽרֶץ וְעַל הַמָּזוֹן:",
      ),
    );

    // ברכה שלישית — ירושלים
    parts.push(hr);
    parts.push(
      p(
        "רַחֵם יְהֹוָה אֱלֹהֵֽינוּ עָלֵֽינוּ וְעַל יִשְׂרָאֵל עַמָּךְ, וְעַל יְרוּשָׁלַֽיִם עִירָךְ, וְעַל הַר צִיּוֹן מִשְׁכַּן כְּבוֹדָךְ, וְעַל הֵיכָלָךְ, וְעַל מְעוֹנָךְ, וְעַל דְּבִירָךְ, וְעַל הַבַּֽיִת הַגָּדוֹל וְהַקָּדוֹשׁ שֶׁנִּקְרָא שִׁמְךָ עָלָיו. אָבִֽינוּ, רְעֵֽנוּ, זוּנֵֽנוּ, פַּרְנְסֵֽנוּ, כַּלְכְּלֵֽנוּ, הַרְוִיחֵֽנוּ הַרְוַח־לָֽנוּ מְהֵרָה מִכָּל־צָרוֹתֵֽינוּ. וְנָא, אַל תַּצְרִיכֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ, לִידֵי מַתְּנוֹת בָּשָׂר וָדָם וְלֹא לִידֵי הַלְוָאָתָם, אֶלָּא לְיָֽדְךָֽ הַמְּלֵאָה וְהָרְחָבָה, הָעֲשִׁירָה וְהַפְּתוּחָה, יְהִי רָצוֹן שֶׁלֹּא נֵבוֹשׁ בָּעוֹלָם הַזֶּה, וְלֹא נִכָּלֵם לָעוֹלָם הַבָּא, וּמַלְכוּת בֵּית דָּוִד מְשִׁיחָךְ תַּחֲזִירֶֽנָּה לִמְקוֹמָהּ בִּמְהֵרָה בְיָמֵֽינוּ:",
      ),
    );

    // רצה — שבת
    if (context.isShabbat) {
      parts.push(
        p(
          "רְצֵה וְהַחֲלִיצֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בְּמִצְוֹתֶֽיךָ וּבְמִצְוַת יוֹם הַשְּׁבִיעִי, הַשַּׁבָּת הַגָּדוֹל וְהַקָּדוֹשׁ הַזֶּה. כִּי יוֹם גָּדוֹל וְקָדוֹשׁ הוּא מִלְּפָנֶֽיךָ, נִשְׁבּוֹת בּוֹ וְנָנֽוּחַ בּוֹ וְנִתְעַנֵּג בּוֹ כְּמִצְוַת חֻקֵּי רְצוֹנָךְ, וְאַל־תְּהִי צָרָה וְיָגוֹן בְּיוֹם מְנוּחָתֵֽנוּ. וְהַרְאֵֽנוּ בְּנֶחָמַת צִיּוֹן בִּמְהֵרָה בְיָמֵֽינוּ, כִּי אַתָּה הוּא בַּֽעַל הַנֶּחָמוֹת. וַהֲגַם שֶׁאָכַֽלְנוּ וְשָׁתִֽינוּ חָרְבַּן בֵּֽיתְךָֽ הַגָּדוֹל וְהַקָּדוֹשׁ לֹא שָׁכַֽחְנוּ. אַל־תִּשְׁכָּחֵֽנוּ לָנֶֽצַח וְאַל־תִּזְנָחֵֽנוּ לָעַד כִּי אֵל מֶֽלֶךְ גָּדוֹל וְקָדוֹשׁ אָֽתָּה:",
        ),
      );
    }

    // יעלה ויבוא — ראש חודש / יו"ט / חוה"מ
    if (needsYaaleh) {
      parts.push(
        p(
          "אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, יַעֲלֶה וְיָבֹא, וְיַגִּֽיעַ וְיֵרָאֶה, וְיֵרָצֶה וְיִשָּׁמַע, וְיִפָּקֵד וְיִזָּכֵר, זִכְרוֹנֵֽנוּ וְזִכְרוֹן אֲבוֹתֵֽינוּ, זִכְרוֹן יְרוּשָׁלַֽיִם עִירָךְ, וְזִכְרוֹן מָשִֽׁיחַ בֶּן־דָּוִד עַבְדָּךְ, וְזִכְרוֹן כָּל־עַמְּךָ בֵּית יִשְׂרָאֵל לְפָנֶֽיךָ, לִפְלֵיטָה, לְטוֹבָה, לְחֵן, לְחֶֽסֶד וּלְרַחֲמִים, לְחַיִּים טוֹבִים וּלְשָׁלוֹם, בְּיוֹם " +
            yaalehDayInsert +
            ". לְרַחֵם בּוֹ עָלֵֽינוּ וּלְהוֹשִׁיעֵֽנוּ. זָכְרֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בּוֹ לְטוֹבָה, וּפָקְדֵֽנוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵֽנוּ בוֹ לְחַיִּים טוֹבִים, בִּדְבַר יְשׁוּעָה וְרַחֲמִים, חוּס וְחָנֵּֽנוּ, וַחֲמוֹל וְרַחֵם עָלֵֽינוּ, וְהוֹשִׁיעֵֽנוּ כִּי אֵלֶֽיךָ עֵינֵֽינוּ, כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה:",
        ),
      );
    }

    // וּתְבֶנֶה — בּוֹנֵה יְרוּשָׁלָיִם
    parts.push(
      p(
        "וְתִבְנֶה יְרוּשָׁלַֽיִם עִירָךְ בִּמְהֵרָה בְיָמֵֽינוּ. בָּרוּךְ אַתָּה יְהֹוָה. בּוֹנֵה יְרוּשָׁלָֽיִם — אָמֵן:",
      ),
    );

    // ברכה רביעית — הטוב והמטיב
    parts.push(hr);
    parts.push(
      p(
        "בָּרוּךְ אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, (לָעַד) הָאֵל אָבִֽינוּ, מַלְכֵּֽנוּ, אַדִּירֵֽנוּ, בּֽוֹרְאֵֽנוּ, גּוֹאֲלֵֽנוּ, קְדוֹשֵֽׁנוּ קְדוֹשׁ יַעֲקֹב, רוֹעֵֽנוּ רוֹעֵה יִשְׂרָאֵל. הַמֶּֽלֶךְ הַטּוֹב, וְהַמֵּטִיב לַכֹּל, שֶׁבְּכָל־יוֹם וָיוֹם הוּא הֵטִיב לָֽנוּ, הוּא מֵטִיב לָֽנוּ, הוּא יֵיטִיב לָֽנוּ, הוּא גְמָלָֽנוּ, הוּא גֽוֹמְלֵֽנוּ, הוּא יִגְמְלֵֽנוּ לָעַד חֵן וָחֶֽסֶד וְרַחֲמִים וְרֶֽוַח וְהַצָּלָה וְכָל־טוֹב:",
      ),
    );

    // הרחמן — תמיד (standard list)
    parts.push(
      p(
        "הָרַחֲמָן הוּא יִשְׁתַּבַּח עַל כִּסֵּא כְבוֹדוֹ: הָרַחֲמָן הוּא יִשְׁתַּבַּח בַּשָּׁמַֽיִם וּבָאָֽרֶץ: הָרַחֲמָן הוּא יִשְׁתַּבַּח בָּֽנוּ לְדוֹר דּוֹרִים: הָרַחֲמָן הוּא קֶֽרֶן לְעַמּוֹ יָרִים: הָרַחֲמָן הוּא יִתְפָּאַר בָּֽנוּ לְנֵֽצַח נְצָחִים: הָרַחֲמָן הוּא יְפַרְנְסֵֽנוּ בְּכָבוֹד וְלֹא בְבִזּוּי בְּהֶתֵּר וְלֹא בְאִסּוּר בְּנַֽחַת וְלֹא בְצַֽעַר: הָרַחֲמָן הוּא יִתֵּן שָׁלוֹם בֵּינֵֽינוּ: הָרַחֲמָן הוּא יִשְׁלַח בְּרָכָה רְוָחָה וְהַצְלָחָה בְּכָל־מַעֲשֵׂה יָדֵֽינוּ: הָרַחֲמָן הוּא יַצְלִֽיחַ אֶת־דְּרָכֵֽינוּ: הָרַחֲמָן הוּא יִשְׁבֹּר עֹל גָּלוּת מְהֵרָה מֵעַל צַוָּארֵֽינוּ: הָרַחֲמָן הוּא יוֹלִיכֵֽנוּ מְהֵרָה קוֹמְמִיּוּת לְאַרְצֵֽנוּ: הָרַחֲמָן הוּא יִרְפָּאֵֽנוּ רְפוּאָה שְׁלֵמָה, רְפוּאַת הַנֶּֽפֶשׁ וּרְפוּאַת הַגּוּף: הָרַחֲמָן הוּא יִפְתַּח לָנוּ אֶת יָדוֹ הָרְחָבָה: הָרַחֲמָן הוּא יְבָרֵךְ כָּל־אֶחָד וְאֶחָד מִמֶּֽנּוּ בִּשְׁמוֹ הַגָּדוֹל כְּמוֹ שֶׁנִּתְבָּֽרְכֽוּ אֲבוֹתֵֽינוּ אַבְרָהָם יִצְחָק וְיַעֲקֹב, בַּכֹּל מִכֹּל כֹּל, כֵּן יְבָרֵךְ אוֹתָֽנוּ יַֽחַד בְּרָכָה שְׁלֵמָה, וְכֵן יְהִי רָצוֹן וְנֹאמַר אָמֵן: הָרַחֲמָן הוּא יִפְרוֹשׂ עָלֵֽינוּ סֻכַּת שְׁלוֹמוֹ:",
      ),
    );

    // הרחמן — שבת
    if (context.isShabbat) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יַנְחִילֵֽנוּ עוֹלָם שֶׁכֻּלּוֹ שַׁבָּת וּמְנוּחָה לְחַיֵּי הָעוֹלָמִים:",
        ),
      );
    }
    // הרחמן — ראש חודש
    if (context.isRoshChodesh) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵֽינוּ אֶת הַחֹֽדֶשׁ הַזֶּה לְטוֹבָה וְלִבְרָכָה:",
        ),
      );
    }
    // הרחמן — ראש השנה
    if (context.isRoshHaShana) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵֽינוּ אֶת הַשָּׁנָה הַזֹּאת לְטוֹבָה וְלִבְרָכָה:",
        ),
      );
    }
    // הרחמן — סוכות
    if (context.isSukkot) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יְזַכֵּֽנוּ לֵישֵׁב בְּסֻכַּת עוֹרוֹ שֶׁל לִוְיָתָן: הָרַחֲמָן הוּא יַשְׁפִּֽיעַ עָלֵֽינוּ שֶֽׁפַע קְדֻשָּׁה וְטָהֳרָה מִשִּׁבְעָה אוּשְׁפִּיזִין עִלָּאִין קַדִּישִׁין, זְכוּתָם תְּהֵא מָגֵן וְצִנָּה בַּעֲדֵֽינוּ: הָרַחֲמָן הוּא יָקִים לָֽנוּ אֶת סֻכַּת דָּוִד הַנּוֹפֶֽלֶת:",
        ),
      );
    }
    // הרחמן — מועדים (יו"ט כלשהו)
    if (
      context.isPesach ||
      context.isShavuot ||
      context.isSukkot ||
      context.isRoshHaShana
    ) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יַגִּיעֵֽנוּ לְמוֹעֲדִים אֲחֵרִים הַבָּאִים לִקְרָאתֵֽנוּ לְשָׁלוֹם:",
        ),
      );
      parts.push(p("הָרַחֲמָן הוּא יַנְחִילֵֽנוּ יוֹם שֶׁכֻּלּוֹ טוֹב:"));
    }

    // הרחמן — תמיד (always at end)
    parts.push(
      p(
        "הָרַחֲמָן הוּא יִטַּע תּוֹרָתוֹ וְאַהֲבָתוֹ בְּלִבֵּֽנוּ וְתִהְיֶה יִרְאָתוֹ עַל פָּנֵֽינוּ לְבִלְתִּי נֶחֱטָא. וְיִהְיוּ כָל־מַעֲשֵֽׂינוּ לְשֵׁם שָׁמָֽיִם:",
      ),
    );

    // ברכת אורח, חתן, מילה — supplement
    parts.push(
      sup(
        p("[אוֹרֵחַ אוֹמֵר:]") +
          p(
            "הָרַחֲמָן הוּא יְבָרֵךְ אֶת הַשֻּׁלְחָן הַזֶּה שֶׁאָכַֽלְנוּ עָלָיו וִיסַדֵּר בּוֹ כָּל־מַעֲדַנֵּי עוֹלָם, וְיִהְיֶה כְּשֻׁלְחָנוֹ שֶׁל אַבְרָהָם אָבִֽינוּ, כָּל־רָעֵב מִמֶּֽנּוּ יֹאכַל וְכָל־צָמֵא מִמֶּֽנּוּ יִשְׁתֶּה, וְאַל־יֶחְסַר מִמֶּֽנּוּ כָּל־טוּב לָעַד וּלְעֽוֹלְמֵֽי עוֹלָמִים, אָמֵן. הָרַחֲמָן הוּא יְבָרֵךְ בַּֽעַל הַבַּֽיִת הַזֶּה וּבַֽעַל הַסְּעוּדָּה הַזֹּאת, הוּא וּבָנָיו וְאִשְׁתּוֹ וְכָל־אֲשֶׁר לוֹ, בְּבָנִים שֶׁיִּחְיוּ וּבִנְכָסִים שֶׁיִּרְבּוּ. בָּרֵ֤ךְ יְהֹוָה֙ חֵיל֔וֹ וּפֹ֥עַל יָדָ֖יו תִּרְצֶ֑ה. וְיִהְיוּ נְכָסָיו וּנְכָסֵֽינוּ מֻצְלָחִים וּקְרוֹבִים לָעִיר, וְאַל־יִזְדַּקֵּק לְפָנָיו וְלֹא לְפָנֵֽינוּ שׁוּם דְבַר חֵטְא וְהִרְהוּר עָוֹן. שָׂשׂ וְשָׂמֵֽחַ כָּל־הַיָּמִים, בְּעֹֽשֶׁר וְכָבוֹד, מֵעַתָּה וְעַד עוֹלָם. לֹא יֵבוֹשׁ בָּעוֹלָם הַזֶּה, וְלֹא יִכָּלֵם לָעוֹלָם הַבָּא, אָמֵן כֵּן יְהִי רָצוֹן:",
          ) +
          p(
            "[בִּסְעוּדַּת חָתָן:] הָרַחֲמָן הוּא יְבָרֵךְ אֶת הֶחָתָן וְהַכַּלָּה, בְּבָנִים זְכָרִים לַעֲבוֹדָתוֹ יִתְבָּרַךְ: הָרַחֲמָן הוּא יְבָרֵךְ אֶת כָּל־הַמְּסֻבִּין בַּשֻּׁלְחָן הַזֶּה וְיִתֵּן לָֽנוּ הַקָּדוֹשׁ בָּרוּךְ הוּא מִשְׁאֲלוֹת לִבֵּֽנוּ לְטוֹבָה:",
          ) +
          p(
            "[בִּסְעוּדַּת מִילָה:] הָרַחֲמָן הוּא יְבָרֵךְ אֶת בַּֽעַל הַבַּֽיִת הַזֶּה, אֲבִי הַבֵּן, הוּא וְאִשְׁתּוֹ הַיּוֹלֶֽדֶת, מֵעַתָּה וְעַד עוֹלָם: הָרַחֲמָן הוּא יְבָרֵךְ אֶת הַיֶּֽלֶד הַנּוֹלָד, וּכְשֵׁם שֶׁזִּכָּֽהוּ הַקָּדוֹשׁ בָּרוּךְ הוּא לַמִּילָה, כֵּן יְזַכֵּֽהוּ לְהִכָּנֵס לַתּוֹרָה וְלַחֻפָּה וְלַמִּצְוֹת וּלְמַעֲשִׂים טוֹבִים, וְכֵן יְהִי רָצוֹן וְנֹאמַר אָמֵן: הָרַחֲמָן הוּא יְבָרֵךְ אֶת מַעֲלַת הַסַּנְדָּק וְהַמּוֹהֵל וּשְׁאָר הַמִּשְׁתַּדְּלִים בַּמִּצְוָה הֵם וְכָל־אֲשֶׁר לָהֶם:",
          ),
      ),
    );

    // סיום
    parts.push(
      p(
        "הָרַחֲמָן הוּא יְחַיֵּֽנוּ וִיזַכֵּֽנוּ וִיקָֽרְבֵֽנוּ לִימוֹת הַמָּשִֽׁיחַ וּלְבִנְיַן בֵּית הַמִּקְדָּשׁ וּלְחַיֵּי הָעוֹלָם הַבָּא.",
      ),
    );
    parts.push(
      p(
        "מַגְדִּיל (וּבְמוֹצָאֵי שַׁבָּת, בְּסְעֻדַּת פּוּרִים וּסְעֻדַּת מִילָה: מִגְדּוֹל) יְשׁוּעֹת מַלְכּוֹ וְעֹֽשֶׂה־חֶסֶד לִמְשִׁיחוֹ לְדָוִד וּלְזַרְעוֹ עַד־עוֹלָם: כְּ֭פִירִים רָשׁ֣וּ וְרָעֵ֑בוּ וְדֹרְשֵׁ֥י יְ֝הֹוָ֗ה לֹא־יַחְסְרוּ כָל־טֽוֹב: נַ֤עַר ׀ הָיִ֗יתִי גַּם־זָ֫קַ֥נְתִּי וְֽלֹא־רָ֭אִיתִי צַדִּ֣יק נֶעֱזָ֑ב וְ֝זַרְעוֹ מְבַקֶּשׁ־לָֽחֶם: כָּל־הַיּוֹם חוֹנֵן וּמַלְוֶה וְזַרְעוֹ לִבְרָכָה: מַה שֶּׁאָכַֽלְנוּ יִהְיֶה לְשָׂבְעָה. וּמַה שֶּׁשָּׁתִֽינוּ יִהְיֶה לִרְפוּאָה. וּמַה שֶּׁהוֹתַֽרְנוּ יִהְיֶה לִבְרָכָה. כְּדִכְתִיב, וַיִּתֵּן לִפְנֵיהֶם וַיֹּאכְלוּ וַיּוֹתִרוּ כִּדְבַר יְהֹוָה: בְּרוּכִים אַתֶּם לַיהֹוָה עֹשֵׂה שָׁמַיִם וָאָרֶץ: בָּרוּךְ הַגֶּבֶר אֲשֶׁר יִבְטַח בַּיהֹוָה וְהָיָה יְהֹוָה מִבְטַחוֹ: יְהֹוָה עֹז לְעַמּוֹ יִתֵּן יְהֹוָה יְבָרֵךְ אֶת־עַמּוֹ בַשָּׁלוֹם: עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו, הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ. וְעַל כָּל־עַמּוֹ יִשְׂרָאֵל, וְאִמְרוּ אָמֵן:",
      ),
    );
  } else {
    // ─── SFARD & ASHKENAZ ────────────────────────────────────────────────
    // Common texts for both nusachim

    // Preamble: weekday = על נהרות בבל; שבת = שיר המעלות
    if (context.isShabbat) {
      parts.push(
        sup(
          p(
            "שִׁיר הַמַּעֲלוֹת בְּשׁוּב יְהֹוָה אֶת־שִׁיבַת צִיּוֹן הָיִֽינוּ כְּחֹלְ֒מִים: אָז יִמָּלֵא שְׂחוֹק פִּֽינוּ וּלְשׁוֹנֵֽנוּ רִנָּה, אָז יֹאמְ֒רוּ בַגּוֹיִם הִגְדִּיל יְהֹוָה לַעֲשׂוֹת עִם־אֵֽלֶּה: הִגְדִּיל יְהֹוָה לַעֲשׂוֹת עִמָּֽנוּ, הָיִֽינוּ שְׂמֵחִים: שׁוּבָה יְהֹוָה אֶת־שְׁבִיתֵֽנוּ כַּאֲפִיקִים בַּנֶּֽגֶב: הַזֹּרְ֒עִים בְּדִמְעָה, בְּרִנָּה יִקְצֹֽרוּ: הָלוֹךְ יֵלֵךְ וּבָכֹה, נֹשֵׂא מֶֽשֶׁךְ־הַזָּֽרַע, בֹּא־יָבֹא בְרִנָּה, נֹשֵׂא אֲלֻמֹּתָיו:",
          ),
        ),
      );
    } else {
      parts.push(
        sup(
          p(
            "עַל־נַהֲרוֹת בָּבֶל שָׁם יָשַֽׁבְנוּ גַּם־בָּכִֽינוּ בְּזָכְרֵֽנוּ אֶת־צִיּוֹן: עַל־עֲרָבִים בְּתוֹכָהּ תָּלִֽינוּ כִּנֹּרוֹתֵֽינוּ: כִּי שָׁם שְׁאֵלֽוּנוּ שׁוֹבֵֽינוּ דִּבְרֵי־שִׁיר וְתוֹלָלֵֽינוּ שִׂמְחָה שִֽׁירוּ לָֽנוּ מִשִּׁיר צִיּוֹן: אֵיךְ נָשִׁיר אֶת־שִׁיר־יְהֹוָה עַל אַדְמַת נֵכָר: אִם־אֶשְׁכָּחֵךְ יְרוּשָׁלָֽםִ תִּשְׁכַּח יְמִינִי: תִּדְבַּק לְשׁוֹנִי לְחִכִּי אִם־לֺא אֶזְכְּרֵֽכִי אִם־לֺא אַעֲלֶה אֶת־יְרוּשָׁלַֽםִ עַל רֹאשׁ שִׂמְחָתִי: זְכֹר יְהֹוָה לִבְנֵי אֱדוֹם אֵת יוֹם יְרוּשָׁלָֽםִ הָאֹמְ֒רִים עָֽרוּ עָֽרוּ עַד הַיְ֒סוֹד בָּהּ: בַּת־בָּבֶל הַשְּׁ֒דוּדָה אַשְׁרֵי שֶׁיְּ֒שַׁלֶּם־לָךְ אֶת־גְּמוּלֵךְ שֶׁגָּמַלְתְּ לָֽנוּ: אַשְׁרֵי שֶׁיֹּאחֵז וְנִפֵּץ אֶת־עֹלָלַֽיִךְ אֶל־הַסָּֽלַע:",
          ),
        ),
      );
    }

    // הכנה ולשם יחוד (sfard only, supplement)
    if (nusach === "sfard") {
      parts.push(
        sup(
          p(
            "הִנְנִי מוּכָן וּמְזֻמָּן לְקַיֵּם מִצְוַת עֲשֵׂה שֶׁל בִּרְכַּת הַמָּזוֹן שֶׁנֶּאֱמַר, וְאָכַלְתָּ וְשָׂבָעְתָּ וּבֵרַכְתָּ אֶת יְהֹוָה אֱלֹהֶיךָ, עַל הָאָרֶץ הַטּוֹבָה, אֲשֶׁר נָתַן לָךְ:",
          ),
        ),
      );
    }

    // Zimun (supplement)
    parts.push(
      sup(
        p("[שְׁלוֹשָׁה שֶׁאָכְלוּ כְּאַחַד חַיָּבִין בְּזִמּוּן:]") +
          p("הַמְזַמֵּן אוֹמֵר: רַבּוֹתַי נְבָרֵךְ:") +
          p(
            "הַמְסֻבִּים עוֹנִים: יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד־עוֹלָם:",
          ) +
          p(
            "חוֹזֵר הַמְזַמֵּן: יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד־עוֹלָם:",
          ) +
          p(
            "וּמְמַשִּׁיךְ: בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי נְבָרֵךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ:",
          ) +
          (nusach === "sfard"
            ? p(
                "הַמְסֻבִּים עוֹנִים: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶֽׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ: מִי שֶׁלֹּא אָכַל עוֹנֶה: בָּרוּךְ הוּא וּבָרוּךְ שְׁמוֹ:",
              )
            : p(
                "הַמְסֻבִּים עוֹנִים: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶֽׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ: מִי שֶׁלֹּא אָכַל עוֹנֶה: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵינוּ) וּמְבוֹרָךְ שְׁמוֹ תָּמִיד לְעוֹלָם וָעֶד:",
              )) +
          p(
            "חוֹזֵר הַמְזַמֵּן: בָּרוּךְ (בַּעֲשָׂרָה: אֱלֹהֵֽינוּ) שֶֽׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ:",
          ),
      ),
    );

    // ברכת הזימון לנישואין (sfard, supplement)
    if (nusach === "sfard") {
      parts.push(
        sup(
          p("[בִּרְכַּת הַזִּמּוּן לְנִשּׂוּאִין:]") +
            p("הַמְזַמֵּן אוֹמֵר: רַבּוֹתַי נְבָרֵךְ:") +
            p(
              "הַמְסֻבִּים: יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד־עוֹלָם:",
            ) +
            p(
              "וּמְמַשִּׁיךְ: דְּוַי הָסֵר וְגַם חָרוֹן, וְאָז אִלֵּם בְּשִׁיר יָרוֹן, נְחֵֽנוּ בְּמַעְגְּ֒לֵי צֶֽדֶק, שְׁעֵה בִּרְכַּת בְּנֵי אַהֲרֹן:",
            ) +
            p(
              "בִּרְשׁוּת מָרָנָן וְרַבָּנָן וְרַבּוֹתַי נְבָרֵךְ אֱלֹהֵֽינוּ שֶׁהַשִּׁמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ:",
            ) +
            p(
              "הַמְסֻבִּים: בָּרוּךְ אֱלֹהֵֽינוּ שֶׁהַשִּׁמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ:",
            ) +
            p(
              "חוֹזֵר הַמְזַמֵּן: בָּרוּךְ אֱלֹהֵֽינוּ שֶׁהַשִּׁמְחָה בִּמְעוֹנוֹ וְשֶׁאָכַֽלְנוּ מִשֶּׁלּוֹ וּבְטוּבוֹ חָיִֽינוּ:",
            ),
        ),
      );
    }

    // ברכה ראשונה — הזן
    parts.push(hr);
    parts.push(
      p(
        "בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַזָּן אֶת־הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ בְּחֵן בְּחֶֽסֶד וּבְרַחֲמִים הוּא נוֹתֵן לֶֽחֶם לְכָל־בָּשָׂר כִּי לְעוֹלָם חַסְדּוֹ וּבְטוּבוֹ הַגָּדוֹל תָּמִיד לֺא־חָסַר לָֽנוּ וְאַל־יֶחְסַר לָֽנוּ מָזוֹן לְעוֹלָם וָעֶד בַּעֲבוּר שְׁמוֹ הַגָּדוֹל כִּי הוּא אֵל זָן וּמְפַרְנֵס לַכֹּל וּמֵטִיב לַכֹּל וּמֵכִין מָזוֹן לְכָל־בְּרִיּוֹתָיו אֲשֶׁר בָּרָא. כָּאָמוּר, פּוֹתֵֽחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: בָּרוּךְ אַתָּה יְהֹוָה הַזָּן אֶת־הַכֹּל:",
      ),
    );

    // ברכה שנייה — הארץ
    parts.push(hr);
    parts.push(
      p(
        "נוֹדֶה לְּךָ יְהֹוָה אֱלֹהֵֽינוּ עַל שֶׁהִנְחַֽלְתָּ לַאֲבוֹתֵֽינוּ אֶֽרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה וְעַל שֶׁהוֹצֵאתָֽנוּ יְהֹוָה אֱלֹהֵֽינוּ מֵאֶֽרֶץ מִצְרַֽיִם וּפְדִיתָֽנוּ מִבֵּית עֲבָדִים וְעַל בְּרִיתְ֒ךָ שֶׁחָתַֽמְתָּ בִּבְשָׂרֵֽינוּ וְעַל תּוֹרָתְ֒ךָ שֶׁלִּמַּדְתָּֽנוּ וְעַל חֻקֶּֽיךָ שֶׁהוֹדַעְתָּֽנוּ וְעַל חַיִּים חֵן וָחֶֽסֶד שֶׁחוֹנַנְתָּֽנוּ וְעַל אֲכִילַת מָזוֹן שָׁאַתָּה זָן וּמְפַרְנֵס אוֹתָֽנוּ תָּמִיד בְּכָל־יוֹם וּבְכָל־עֵת וּבְכָל שָׁעָה:",
      ),
    );

    // על הניסים — חנוכה
    if (context.isChanukah) {
      parts.push(
        p(
          "וְעַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּ֒בוּרוֹת וְעַל הַתְּ֒שׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בִּזְּ֒מַן הַזֶּה:",
        ),
      );
      parts.push(
        p(
          "בִּימֵי מַתִּתְיָֽהוּ בֶּן־יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו כְּשֶׁעָמְ֒דָה מַלְכוּת יָוָן הָרְ֒שָׁעָה עַל־עַמְּ֒ךָ יִשְׂרָאֵל לְהַשְׁכִּיחָם תּוֹרָתֶֽךָ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנֶֽךָ: וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים עָמַֽדְתָּ לָהֶם בְּעֵת צָרָתָם רַֽבְתָּ אֶת־רִיבָם דַּֽנְתָּ אֶת־דִּינָם נָקַֽמְתָּ אֶת־נִקְמָתָם מָסַֽרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים וְרַבִּים בְּיַד מְעַטִּים וּטְמֵאִים בְּיַד טְהוֹרִים וּרְשָׁעִים בְּיַד צַדִּיקִים וְזֵדִים בְּיַד עוֹסְ֒קֵי תוֹרָתֶֽךָ וּלְךָ עָשִֽׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמֶֽךָ וּלְעַמְּ֒ךָ יִשְׂרָאֵל עָשִֽׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה וְאַחַר כַּךְ בָּֽאוּ בָנֶֽיךָ לִדְבִיר בֵּיתֶֽךָ וּפִנּוּ אֶת הֵיכָלֶֽךָ וְטִהֲרוּ אֶת מִקְדָּשֶֽׁךָ וְהִדְלִֽיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶֽׁךָ וְקָבְ֒עוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵֽלּוּ לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל:",
        ),
      );
    }
    // על הניסים — פורים
    if (context.isPurim) {
      parts.push(
        p(
          "וְעַל הַנִּסִּים וְעַל הַפֻּרְקָן וְעַל הַגְּ֒בוּרוֹת וְעַל הַתְּ֒שׁוּעוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בִּזְּ֒מַן הַזֶּה:",
        ),
      );
      parts.push(
        p(
          "בִּימֵי מָרְדְּכַי וְאֶסְתֵּר בְּשׁוּשַׁן הַבִּירָה כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע בִּקֵּשׁ לְהַשְׁמִיד לַהֲרוֹג וּלְאַבֵּד אֶת־כָּל־הַיְּ֒הוּדִים מִנַּֽעַר וְעַד־זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד בִּשְׁלוֹשָׁה עָשָׂר לְחֹֽדֶשׁ שְׁנֵים־עָשָׂר הוּא חֹֽדֶשׁ אֲדָר וּשְׁלָלָם לָבוֹז: וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים הֵפַֽרְתָּ אֶת־עֲצָתוֹ וְקִלְקַֽלְתָּ אֶת מַחֲשַׁבְתּוֹ וַהֲשֵׁבֽוֹתָ לּוֹ גְּמוּלוֹ בְּרֹאשׁוֹ וְתָלוּ אוֹתוֹ וְאֶת־בָּנָיו עַל־הָעֵץ:",
        ),
      );
    }

    // סיום ברכת הארץ
    parts.push(
      p(
        "וְעַל הַכֹּל יְהֹוָה אֱלֹהֵֽינוּ אֲנַֽחְנוּ מוֹדִים לָךְ וּמְבָרְ֒כִים אוֹתָךְ יִתְבָּרַךְ שִׁמְךָ בְּפִי כָּל־חַי תָּמִיד לְעוֹלָם וָעֶד כַּכָּתוּב וְאָכַלְתָּ וְשָׂבָֽעְתָּ וּבֵרַכְתָּ אֶת־יְהֹוָה אֱלֹהֶֽיךָ עַל־הָאָֽרֶץ הַטּוֹבָה אֲשֶׁר נָתַן־לָךְ בָּרוּךְ אַתָּה יְהֹוָה עַל־הָאָֽרֶץ וְעַל־הַמָּזוֹן:",
      ),
    );

    // ברכה שלישית — ירושלים
    parts.push(hr);
    parts.push(
      p(
        "רַחֵם יְהֹוָה אֱלֹהֵֽינוּ עַל־יִשְׂרָאֵל עַמֶּֽךָ וְעַל יְרוּשָׁלַֽיִם עִירֶֽךָ וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶֽךָ וְעַל מַלְכוּת בֵּית דָּוִד מְשִׁיחֶֽךָ וְעַל־הַבַּֽיִת הַגָּדוֹל וְהַקָּדוֹשׁ שֶׁנִּקְרָא שִׁמְךָ עָלָיו אֱלֹהֵֽינוּ אָבִֽינוּ רְעֵֽנוּ זוּנֵֽנוּ פַּרְנְ֒סֵֽנוּ וְכַלְכְּ֒לֵֽנוּ וְהַרְוִיחֵֽנוּ וְהַרְוַח־לָֽנוּ יְהֹוָה אֱלֹהֵֽינוּ מְהֵרָה מִכָּל־צָרוֹתֵֽינוּ וְנָא אַל־תַּצְרִיכֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ לֺא לִידֵי מַתְּ֒נַת בָּשָׂר וָדָם וְלֺא לִידֵי הַלְוָאָתָם כִּי אִם לְיָדְ֒ךָ הַמְּ֒לֵאָה הַפְּ֒תוּחָה הַקְּ֒דוֹשָׁה וְהָרְ֒חָבָה שֶׁלֺּא נֵבוֹשׁ וְלֺא נִכָּלֵם לְעוֹלָם וָעֶד:",
      ),
    );

    // רצה — שבת
    if (context.isShabbat) {
      parts.push(
        p(
          "רְצֵה וְהַחֲלִיצֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בְּמִצְוֹתֶֽיךָ וּבְמִצְוַת יוֹם הַשְּׁ֒בִיעִי הַשַּׁבָּת הַגָּדוֹל וְהַקָּדוֹשׁ הַזֶּה כִּי יוֹם זֶה גָדוֹל וְקָדוֹשׁ הוּא לְפָנֶֽיךָ לִשְׁבָּת בּוֹ וְלָנֽוּחַ בּוֹ בְּאַהֲבָה כְּמִצְוַת רְצוֹנֶֽךָ וּבִרְצוֹנְ֒ךָ הָנִֽיחַ לָֽנוּ יְהֹוָה אֱלֹהֵֽינוּ שֶׁלֺּא תְהֵא צָרָה וְיָגוֹן וַאֲנָחָה בְּיוֹם מְנוּחָתֵֽנוּ וְהַרְאֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בְּנֶחָמַת צִיּוֹן עִירֶֽךָ וּבְ֒בִנְיַן יְרוּשָׁלַֽיִם עִיר קָדְשֶֽׁךָ כִּי אַתָּה הוּא בַּעַל הַיְשׁוּעוֹת וּבַעַל הַנֶּחָמוֹת:",
        ),
      );
    }

    // יעלה ויבוא — ראש חודש / יו"ט / חוה"מ
    if (needsYaaleh) {
      parts.push(
        p(
          "אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ יַעֲלֶה וְיָבֹא וְיַגִּֽיעַ וְיֵרָאֶה וְיֵרָצֶה וְיִשָּׁמַע וְיִפָּקֵד וְיִזָּכֵר זִכְרוֹנֵֽינוּ וּפִקְדוֹנֵֽינוּ וְזִכְרוֹן אֲבוֹתֵֽינוּ וְזִכְרוֹן מָשִֽׁיחַ בֶּן־דָּוִד עַבְדֶּֽךָ וְזִכְרוֹן יְרוּשָׁלַֽיִם עִיר קָדְשֶֽׁךָ וְזִכְרוֹן כָּל־עַמְּ֒ךָ בֵּית יִשְׂרָאֵל לְפָנֶֽיךָ, לִפְלֵיטָה לְטוֹבָה לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים וּלְחַיִּים טוֹבִים וּלְשָׁלוֹם בְּיוֹם " +
            yaalehDayInsert +
            ". זָכְרֵֽינוּ יְהֹוָה אֱלֹהֵֽינוּ בּוֹ לְטוֹבָה, וּפָקְדֵֽינוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵֽנוּ בוֹ לְחַיִּים טוֹבִים, וּבִדְבַר יְשׁוּעָה וְרַחֲמִים חוּס וְחָנֵּֽינוּ, וְרַחֵם עָלֵֽינוּ וְהוֹשִׁיעֵֽינוּ, כִּי אֵלֶֽיךָ עֵינֵֽינוּ, כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה:",
        ),
      );
    }

    // וּבְנֵה — בּוֹנֵה יְרוּשָׁלַיִם
    parts.push(
      p(
        "וּבְנֵה יְרוּשָׁלַֽיִם עִיר הַקֹּֽדֶשׁ בִּמְהֵרָה בְיָמֵֽינוּ: בָּרוּךְ אַתָּה יְהֹוָה בּוֹנֵה בְרַחֲמָיו יְרוּשָׁלָֽיִם, אָמֵן:",
      ),
    );

    // ברכה רביעית — הטוב והמטיב
    parts.push(hr);
    parts.push(
      p(
        "בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הָאֵל אָבִֽינוּ, מַלְכֵּֽנוּ, אַדִּירֵֽנוּ בּוֹרְ֒אֵֽנוּ, גּוֹאֲלֵֽנוּ, יוֹצְ֒רֵֽנוּ, קְדוֹשֵֽׁנוּ קְדוֹשׁ יַעֲקֹב, רוֹעֵנוּ רוֹעֵה יִשְׂרָאֵל, הַמֶּֽלֶךְ הַטּוֹב, וְהַמֵּטִיב לַכֹּל, שֶׁבְּ֒כָל יוֹם וָיוֹם הוּא הֵטִיב, הוּא מֵטִיב, הוּא יֵיטִיב לָנוּ, הוּא גְמָלָֽנוּ, הוּא גוֹמְ֒לֵֽנוּ, הוּא יִגְמְ֒לֵֽנוּ לָעַד לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים וּלְרֶוַח הַצָּלָה וְהַצְלָחָה בְּרָכָה וִישׁוּעָה, נֶחָמָה, פַּרְנָסָה וְכַלְכָּלָה, וְרַחֲמִים, וְחַיִּים וְשָׁלוֹם, וְכָל־טוֹב, וּמִכָּל־טוּב לְעוֹלָם אַל יְחַסְּ֒רֵֽנוּ:",
      ),
    );

    // הרחמן — standard list
    parts.push(
      p(
        "הָרַחֲמָן הוּא יִמְלוֹךְ עָלֵֽינוּ לְעוֹלָם וָעֶד: הָרַחֲמָן הוּא יִתְבָּרֵךְ בַּשָּׁמַֽיִם וּבָאָֽרֶץ: הָרַחֲמָן הוּא יִשְׁתַּבַּח לְדוֹר דּוֹרִים, וְיִתְפָּאֵר בָּֽנוּ לָעַד וּלְנֵֽצַח נְצָחִים, וְיִתְהַדַּר בָּֽנוּ לָעַד וּלְעוֹלְ֒מֵי עוֹלָמִים: הָרַחֲמָן הוּא יְפַרְנְ֒סֵֽנוּ בְּכָבוֹד: הָרַחֲמָן הוּא יִשְׁבּוֹר עֻלֵּֽנוּ מֵעַל צַוָּארֵֽנוּ וְהוּא יוֹלִיכֵֽנוּ קוֹמְ֒מִיּוּת לְאַרְצֵֽנוּ: הָרַחֲמָן הוּא יִשְׁלַח לָֽנוּ בְּרָכָה מְרֻבָּה בַּבַּֽיִת הַזֶּה וְעַל־שֻׁלְחָן זֶה שֶׁאָכַֽלְנוּ עָלָיו: הָרַחֲמָן הוּא יִשְׁלַח לָֽנוּ אֶת־אֵלִיָּֽהוּ הַנָּבִיא זָכוּר לַטּוֹב, וִיבַשֶּׂר־לָֽנוּ בְּשׂוֹרוֹת טוֹבוֹת יְשׁוּעוֹת וְנֶחָמוֹת:",
      ),
    );

    // הרחמן — ברכת בעל הבית (supplement)
    parts.push(
      sup(
        p(
          "[אִם סָמוּךְ עַל שֻׁלְחַן אָבִיו יֹאמַר:] הָרַחֲמָן הוּא יְבָרֵךְ אֶת (אָבִי מוֹרִי) בַּֽעַל הַבַּֽיִת הַזֶּה, וְאֶת (אִמִּי מוֹרָתִי) בַּעֲלַת הַבַּֽיִת הַזֶּה, אוֹתָם וְאֶת בֵּיתָם וְאֶת זַרְעָם וְאֶת כָּל אֲשֶׁר לָהֶם.",
        ) +
          p(
            "[אִם סָמוּךְ עַל שֻׁלְחַן עַצְמוֹ יֹאמַר:] הָרַחֲמָן הוּא יְבָרֵךְ אוֹתִי (וְאֶת אִשְׁתִּי / בַּעֲלִי וְאֶת זַרְעִי) וְאֶת כָּל אֲשֶׁר לִי.",
          ) +
          p(
            "אוֹתָֽנוּ וְאֶת כָּל אֲשֶׁר לָֽנוּ, כְּמוֹ שֶׁנִּתְבָּרְ֒כוּ אֲבוֹתֵֽינוּ, אַבְרָהָם יִצְחָק וְיַעֲקֹב: בַּכֹּל, מִכֹּל, כֹּל, כֵּן יְבָרֵךְ אוֹתָֽנוּ כֻּלָּֽנוּ יַֽחַד, בִּבְרָכָה שְׁלֵמָה, וְנֹאמַר אָמֵן:",
          ) +
          p(
            "[אִם אוֹכֵל עַל שֻׁלְחַן אֲחֵרִים:] הָרַחֲמָן הוּא יְבָרֵךְ אֶת בַּֽעַל הַבַּֽיִת הַזֶּה, וְאֶת אִשְׁתּוֹ בַּעֲלַת הַבַּֽיִת הַזֶּה, אוֹתָם וְאֶת בֵּיתָם וְאֶת זַרְעָם וְאֶת כָּל אֲשֶׁר לָהֶם. יְהִי רָצוֹן שֶׁלֺּא יֵבוֹשׁ בַּֽעַל הַבַּֽיִת בָּעוֹלָם הַזֶּה וְלֺא יִכָּלֵם לָעוֹלָם הַבָּא וְיִצְלַח מְאֹד בְּכָל נְכָסָיו וְיִהְיוּ נְכָסָיו וּנְכָסֵֽינוּ מֻצְלָחִים וּקְרוֹבִים לָעִיר וְאַל יִשְׁלוֹט שָׂטָן לֺא בְמַעֲשֵׂי יָדָיו וְלֺא בְמַעֲשֵׂי יָדֵֽינוּ:",
          ) +
          p(
            "[בִּסְעוּדַּת חָתָן וְכַלָּה:] דְּוַי הָסֵר וְגַם חָרוֹן, וְאָז אִלֵּם בְּשִׁיר יָרוֹן, נְחֵֽנוּ בְּמַעְגְּ֒לֵי צֶֽדֶק, שְׁעֵה בִּרְכַּת בְּנֵי אַהֲרֹן. הָרַחֲמָן הוּא יְבָרֵךְ אֶת הֶחָתָן וְהַכַּלָּה.",
          ),
      ),
    );

    // בַּמָּרוֹם יְלַמְּדוּ
    parts.push(
      p(
        "בַּמָּרוֹם יְלַמְּ֒דוּ עֲלֵיהֶם וְעָלֵֽינוּ זְכוּת שֶׁתְּ֒הֵא לְמִשְׁמֶֽרֶת שָׁלוֹם, וְנִשָּׂא בְרָכָה מֵאֵת יְהֹוָה וּצְדָקָה מֵאֱלֹהֵי יִשְׁעֵֽנוּ, וְנִמְצָא חֵן וְשֵֽׂכֶל טוֹב בְּעֵינֵי אֱלֹהִים וְאָדָם:",
      ),
    );

    // הרחמן — שבת
    if (context.isShabbat) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יַנְחִילֵֽנוּ יוֹם שֶׁכֻּלּוֹ שַׁבָּת וּמְנוּחָה לְחַיֵּי הָעוֹלָמִים:",
        ),
      );
    }
    // הרחמן — ראש חודש
    if (context.isRoshChodesh) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵֽינוּ אֶת הַחֹֽדֶשׁ הַזֶּה לְטוֹבָה וְלִבְרָכָה:",
        ),
      );
    }
    // הרחמן — ראש השנה
    if (context.isRoshHaShana) {
      parts.push(
        p(
          "הָרַחֲמָן הוּא יְחַדֵּשׁ עָלֵֽינוּ אֶת הַשָּׁנָה הַזֹּאת לְטוֹבָה וְלִבְרָכָה:",
        ),
      );
    }
    // הרחמן — יו"ט
    if (
      context.isPesach ||
      context.isShavuot ||
      context.isSukkot ||
      context.isRoshHaShana
    ) {
      parts.push(p("הָרַחֲמָן הוּא יַנְחִילֵֽנוּ יוֹם שֶׁכֻּלּוֹ טוֹב:"));
    }
    // הרחמן — סוכות
    if (context.isSukkot) {
      parts.push(
        p("הָרַחֲמָן הוּא יָקִים לָֽנוּ אֶת סֻכַּת דָּוִד הַנּוֹפָֽלֶת:"),
      );
    }

    // סיום
    parts.push(
      p(
        "הָרַחֲמָן הוּא יְזַכֵּֽנוּ לִימוֹת הַמָּשִֽׁיחַ וּלְחַיֵּי הָעוֹלָם הַבָּא, מַגְדִּיל יְשׁוּעוֹת מַלְכּוֹ (בְּשַׁבָּת וּבְיוֹם טוֹב: מִגְדּוֹל יְשׁוּעוֹת מַלְכּוֹ), וְעֹֽשֶׂה חֶֽסֶד לִמְשִׁיחוֹ לְדָוִד וּלְזַרְעוֹ עַד עוֹלָם: עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו, הוּא יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל, וְאִמְרוּ אָמֵן:",
      ),
    );
    parts.push(
      p(
        "יְראוּ אֶת־יְהֹוָה קְדוֹשָׁיו, כִּי אֵין מַחְסוֹר לִירֵאָיו: כְּפִירִים רָשׁוּ וְרָעֵֽבוּ, וְדוֹרְ֒שֵׁי יְהֹוָה לֺא־יַחְסְ֒רוּ כָל־טוֹב: הוֹדוּ לַיהֹוָה כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ: פּוֹתֵֽחַ אֶת־יָדֶֽךָ, וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: בָּרוּךְ הַגֶּֽבֶר אֲשֶׁר יִבְטַח בַּיהֹוָה, וְהָיָה יְהֹוָה מִבְטַחוֹ: נַֽעַר הָיִֽיתִי גַם־זָקַֽנְתִּי וְלֺא־רָאִֽיתִי צַדִּיק נֶעֱזָב, וְזַרְעוֹ מְבַקֶּשׁ לָֽחֶם: יְהֹוָה עוֹז לְעַמּוֹ יִתֵּן, יְהֹוָה יְבָרֵךְ אֶת־עַמּוֹ בַּשָּׁלוֹם:",
      ),
    );

    // דיני שכחה (supplement)
    parts.push(
      sup(
        p(
          "[דִּינֵי שְׁכֵחָה — אִם שָׁכַח לוֹמַר רְצֵה בְּשַׁבָּת אוֹ יַעֲלֶה וְיָבֹא בְּרֹאשׁ חֹדֶשׁ / יוֹם טוֹב:]",
        ) +
          p(
            "בְּשַׁבָּת: בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָתַן שַׁבָּתוֹת לִמְנוּחָה לְעַמּוֹ יִשְׂרָאֵל בְּאַהֲבָה לְאוֹת וְלִבְרִית: בָּרוּךְ אַתָּה יְהֹוָה מְקַדֵּשׁ הַשַּׁבָּת:",
          ) +
          p(
            "בְּרֹאשׁ חֹדֶשׁ: בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָתַן רָאשֵׁי חֳדָשִׁים לְעַמּוֹ יִשְׂרָאֵל לְזִכָּרוֹן:",
          ) +
          p(
            "בְּיוֹם טוֹב: בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָתַן יָמִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל לְשָׂשׂוֹן וּלְשִׂמְחָה אֶת יוֹם חַג פלוני הַזֶּה: בָּרוּךְ אַתָּה יְהֹוָה מְקַדֵּשׁ יִשְׂרָאֵל וְהַזְּ֒מַנִּים:",
          ),
      ),
    );
  }

  return {
    html: '<div class="prayer-richtext">' + parts.join("") + "</div>",
    sourceLabel: "מאגר פנימי מלא",
    sourceUrl: "https://www.sefaria.org/Birkat_Hamazon",
  };
}

function stripPrayerHtml(html) {
  const probe = document.createElement("div");
  probe.innerHTML = html || "";
  return (probe.textContent || probe.innerText || "")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  mincha: ["אדני שפתי תפתח", "עלינו לשבח"],
  "birchot-hashachar": ["מודה אני"],
  "kiddush-levana": ["ברכת הלבנה"],
  "tikkun-chatzot": ["תיקון רחל"],
  "birkat-hamazon": ["ברוך אתה", "הזן את הכל"],
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
  const refs =
    FULL_PRAYER_SECTION_REFS[key]?.[nusachKey] ||
    FULL_PRAYER_SECTION_REFS[key]?.mizrahi ||
    [];
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
  if (!sections.length)
    throw new Error(`No composed Sefaria sections for ${key}`);
  if (failedRefs.length) {
    console.warn(`[prayer] partial compose for ${key}`, failedRefs);
  }

  const combinedHtml = `<div class="prayer-richtext">${sections
    .map((section) => {
      const inner = section.html
        .replace(/^<div class="prayer-richtext">/, "")
        .replace(/<\/div>$/, "");
      return inner;
    })
    .join("")}</div>`;

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
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  // Process paragraphs
  const paragraphs = wrapper.querySelectorAll("p");
  paragraphs.forEach((p) => {
    const text = p.textContent.trim();
    // Already wrapped in supplement
    if (p.closest(".prayer-supplement") || p.closest(".seasonal-block")) return;
    const isSupplement =
      // Bracket instructions [בשבת], [עונים], [נוסח אשכנז...], etc.
      /^\[/.test(text) ||
      // Zimun call-and-response markers
      /^רבותי נברך|^\[עונים|^\[אומר|^בירשות|^ברשות|^יהי שם/.test(text) ||
      // Leshem Yichud / preparation text
      /^לשם י[יי]חוד|^הנני מוכן|^לפני אמירת|^לאחר אמירת|^תפילה קצרה לאמרה/.test(
        text,
      ) ||
      // "Shir Hamaalot" before birkat hamazon is a preamble
      (key === "birkat-hamazon" &&
        /^שִׁיר הַמַּעֲלוֹת|^שיר המעלות/.test(text)) ||
      // Zimun section in birkat hamazon
      (key === "birkat-hamazon" && /^רַבּוֹתַי נְבָרֵךְ/.test(text)) ||
      // Direction lines like "אומרים שלוש פעמים"
      /^אומרים|^ג['׳] פעמים|^סימן טוב/.test(text) ||
      // Section heading markers that are bold descriptions, not prayer
      /^📌/.test(text) ||
      // Bold section titles like **ברכה ראשונה**
      (p.querySelector("strong") &&
        !p.querySelector("strong").nextSibling &&
        /^ברכה\s|^חצי קדיש|^עמידה|^קדיש|^פסוקי דזמרה|^קריאת שמע|^ברכו|^ברכות קריאת/.test(
          text,
        )) ||
      // Explanatory notes
      /^נוסח אשכנז|^ההבדל|^שאר הנוסח|^המשך —|^\[המשך/.test(text) ||
      // Instructions with colons that describe what to say
      /^(בשבת|בראש חודש|ביום טוב|בחנוכה|בפורים|קיץ|חורף):/.test(text) ||
      // "Lechu neranena" and "lecho" style introductions in tikkun chatzot
      /^לכו נרננה/.test(text);
    if (isSupplement) {
      p.classList.add("prayer-supplement");
    }
  });
  return wrapper.innerHTML;
}
function buildShacharitMizrahiPayload(context) {
  function p(t) { return "<p>" + t + "</p>"; }
  function sup(html) { return '<div class="prayer-supplement">' + html + "</div>"; }
  var hr = '<hr class="prayer-divider">';

  var d = context.displayDate || new Date();
  var dow = d.getDay();
  var mon = d.getMonth();
  var isMonThu = (dow === 1 || dow === 4);
  var isTachanunDay = !context.isRoshChodesh && !context.isChanukah &&
    !context.isPurim && !context.isPesach && !context.isShavuot &&
    !context.isSukkot && !context.isRoshHaShana && !context.isYomKippur &&
    !context.isShabbat;
  var isHallelDay = context.isRoshChodesh || context.isChanukah ||
    context.isPesach || context.isShavuot || context.isSukkot;
  var isFullHallel = isHallelDay && !context.isRoshChodesh;
  var isTorahReadingDay = isMonThu || context.isRoshChodesh ||
    context.isPesach || context.isShavuot || context.isSukkot ||
    context.isRoshHaShana || context.isYomKippur || context.isChanukah;
  var isSummer = context.isPesach || (mon >= 3 && mon <= 8 && !context.isSukkot);

  var parts = [];

  // ─────────────────────────── מודה אני ───────────────────────────
  parts.push(p("<big><b>סדר השכמת הבוקר</b></big>"));
  parts.push(p("<big><b>מודה אני</b></big> "));
  parts.push(p("<small>כשיעור משנתו יאמר</small> "));
  parts.push(p("<b>מוֹדֶה</b> <small>האשה אומרת: מוֹדָה</small> אֲנִי לְפָנֶיךָ מֶלֶךְ חַי וְקַיָּם שֶהֶחֱזַרְתָּ בִּי נִשְׁמָתִי בְחֶמְלָה, רַבָּה אֱמוּנָתֶךָ: "));
  parts.push(hr);

  // ─────────────────────────── ברכות השחר ───────────────────────────
  parts.push(p("<big><b>ברכות השחר</b></big>"));
  parts.push(p("<small>יעשה צרכיו תחלה, ואחר כך יברך על נטילת ידים ואשר יצר (בא\"ח ויצא ה\"ב). אחר שנטל ידיו תכף ומיד תזקיף ידיו ואצבעותיו למעלה ותגביהם עד הראש, ולפחות תגביהם עד כנגד הפנים, ותברך על נטילת ידים, <small>(בא\"ח תולדות ה\"ד) ואם היה ער כל הלילה לא יברך אלא יטול בלא ברכה (שם הי\"ג)</small></small> "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל נְטִילַת יָדָיִם: "));
  parts.push(p("<small>אם הטיל מים או עשה צרכיו יברך תוך חצי שעה (בא\"ח ויצא הי\"ב)</small> "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה, וּבָרָא בוֹ נְקָבִים נְקָבִים, חֲלוּלִים חֲלוּלִים, גָּלוּי וְיָדוּעַ לִפְנֵי כִסֵּא כְבוֹדֶךָ, שֶׁאִם יִסָּתֵם אֶחָד מֵהֶם, אוֹ אִם יִפָּתֵח אֶחָד מֵהֶם, אֵי אֶפְשָׁר לְהִתְקַיֵּם אַפִלּוּ שָׁעָה אֶחָת. בָּרוּךְ אַתָּה יְהֹוָה, רוֹפֵא כָל־בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת: "));
  parts.push(p("<small>יסמוך ברכה זו של אלהי וכו' לברכת אשר יצר (בא\"ח וישב ה\"ב)</small> "));
  parts.push(p("<b>אֱלֹהַי</b>, נְשָׁמָה שֶׁנָּתַתָּ בִּי טְהוֹרָה, אַתָּה בְרָאתָהּ, אַתָּה יְצַרְתָּהּ, אַתָּה נְפַחְתָּהּ בִּי, וְאַתָּה מְשַׁמְּרָהּ בְּקִרְבִּי, וְאַתָּה עָתִיד לִטְּלָהּ מִמֶּנִּי, וּלְהַחֲזִירָהּ בִּי לֶעָתִיד לָבוֹא, כָּל־זְמַן שֶׁהַנְּשָׁמָה בְקִרְבִּי, מוֹדֶה <small>(<small>האשה אומרת</small> מוֹדָה)</small> אֲנִי לְפָנֶיךָ יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, רִבּוֹן כָּל־הַמַּעֲשִׂים אֲדוֹן כָּל־הַנְּשָׁמוֹת. בָּרוּךְ אַתָּה יְהֹוָה, הַמַּחֲזִיר נְשָׁמוֹת לִפְגָרִים מֵתִים: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הַנוֹתֵן לַשֶּׂכְוִי בִינָה, לְהַבְחִין בֵּין יוֹם וּבֵין לָיְלָה: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, פּוֹקֵחַ עִוְרִים: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, מַתִּיר אֲסוּרִים: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, זוֹקֵף כְּפוּפִים: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, מַלְבִּישׁ עֲרֻמִּים: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הַנּוֹתֵן לַיָּעֵף כֹּחַ: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, רוֹקַע הָאָרֶץ עַל הַמָּיִם: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הַמֵּכִין מִצְעֲדֵי גָבֶר: "));
  parts.push(p("<small>בתשעה באב ויום הכיפורים אין אומרים ברכה זו <small>(בא\"ח וישב ה\"ט)</small></small> "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, שֶׁעָשָׂה לִי כָּל־צָרְכִּי: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי גוֹי: <small>האשה אומרת: <b>גּוֹיָה</b></small> "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי עָבֶד: <small>האשה אומרת: <b>שִׁפְחָה</b></small> "));
  parts.push(p("<small>האיש מברך</small> "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, שֶׁלֹּא עָשַׂנִי אִשָּׁה: "));
  parts.push(p("<small>האשה מברכת בלי שם ומלכות</small> "));
  parts.push(p("<b>בָּרוּךְ</b> שֶׁעָשַׂנִי כִּרְצוֹנוֹ: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהוָֹה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, הַמַּעֲבִיר חֶבְלֵי שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי. וִיהִי רָצוֹן מִלְפָנֶיךָ יְהֹוָה, אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתַרְגִּילֵנִי בְּתוֹרָתֶךָ, וְתַדְבִּיקֵנִי בְּמִצְוֹתֶיךָ, וְאַל תְּבִיאֵנִי לִידֵי חֵטְא, וְלֹא לִידֵי עָוֹן, וְלֹא לִידֵי נִסָיוֹן, וְלֹא לִידֵי בִזָּיוֹן, וְתַרְחִיקֵנִי מִיֵּצֶר הָרָע, וְתַדְבִּיקֵנִי בְּיֵצֶר הַטּוֹב, וְכוֹף אֶת־יִצְרִי לְהִשְׁתַּעְבֶּד לָּךְ, וּתְנֵנִי הַיּוֹם וּבְכָל־יוֹם לְחֵן וּלְחֶסֶד וּלְרַחֲמִים בְּעֵינֶיךָ וּבְעֵינֵי כָל־רוֹאַי, וְגָמְלֵנִי חֲסָדִים טוֹבִים. בָּרוּךְ אַתָּה יְהֹוָה, גּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל: "));
  parts.push(p("<b>יְהִי</b> רָצוֹן מִלְּפָנֶיךָ יְהֹוָה, אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי, שֶׁתַּצִּילֵנִי הַיּוֹם וּבְכָל יוֹם וָיוֹם, מֵעַזֵּי פָנִים, וּמֵעַזּוּת פָּנִים, מֵאָדָם רָע, מִיֵּצֶר רָע, מֵחָבֵר רָע, מִשָּׁכֵן רָע, מִפֶּגַע רָע, מֵעַיִן הָרָע, וּמִלָּשׁוֹן הָרָע, מִדִּין קָשֶׁה, וּמִבַּעַל דִּין קָשֶׁה, בֵּין שֶׁהוּא בֶן־בְּרִית, וּבֵין שֶׁאֵינוֹ בֶן־בְּרִית: "));
  parts.push(hr);

  // ─────────────────────────── ברכות התורה ───────────────────────────
  parts.push(p("<big><b>ברכות התורה</b></big>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל דִּבְרֵי תוֹרָה: "));
  parts.push(p("<b>וְהַעֲרֵב</b> נָא, יְהֹוָה אֱלֹהֵֽינוּ, אֶת־דִּבְרֵי תוֹרָתְךָ בְּפִינוּ וּבְפִיפִיּוֹת עַמְּךָ בֵּית יִשְׂרָאֵל, וְנִהְיֶה אֲנַחְנוּ וְצֶאֱצָאֵינוּ, וְצֶאֱצָאֵי צֶאֱצָאֵינוּ, כֻּלָּנוּ יוֹדְעֵי שְׁמֶךָ, וְלוֹמְדֵי תוֹרָתְךָ לִשְׁמָהּ. בָּרוּךְ אַתָּה יְהֹוָה, הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל: "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל־הָעַמִּים וְנָתַן לָנוּ אֶת־תּוֹרָתוֹ. בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה: "));
  parts.push(p("<b>וַיְדַבֵּ֥ר</b> יְהֹוָ֖ה אֶל־מֹשֶׁ֥ה לֵּאמֹֽר׃ דַּבֵּ֤ר אֶֽל־אַהֲרֹן֙ וְאֶל־בָּנָ֣יו לֵאמֹ֔ר כֹּ֥ה תְבָרְכ֖וּ אֶת־בְּנֵ֣י יִשְׂרָאֵ֑ל אָמ֖וֹר לָהֶֽם׃ יְבָרֶכְךָ֥ יְהֹוָ֖ה וְיִשְׁמְרֶֽךָ׃ יָאֵ֨ר יְהֹוָ֧ה ׀ פָּנָ֛יו אֵלֶ֖יךָ וִֽיחֻנֶּֽךָּ׃ יִשָּׂ֨א יְהֹוָ֤ה ׀ פָּנָיו֙ אֵלֶ֔יךָ וְיָשֵׂ֥ם לְךָ֖ שָׁלֽוֹם׃ וְשָׂמ֥וּ אֶת־שְׁמִ֖י עַל־בְּנֵ֣י יִשְׂרָאֵ֑ל וַאֲנִ֖י אֲבָרְכֵֽם׃ "));
  parts.push(hr);

  // ─────────────────────────── פתיחת אליהו ───────────────────────────
  parts.push(p("<big><b>תפילת שחרית לימי החול</b></big>"));
  parts.push(p("<big><b>פתיחת אליהו</b></big>"));
  parts.push(p("<small>אחר המזמורים של תיקון לאה המנהג לומר פתיחת אליהו <small>(בא\"ח וישלח הי\"ב)</small></small> "));
  parts.push(p("וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ׃"));
  parts.push(p("<b>פָּתַח אֵלִיָּֽהוּ</b> הַנָּבִיא זָכוּר לְטוֹב וְאָמַר: רִבּוֹן עָֽלְמִֽין דְּאַנְתְּ הוּא חָד וְלָא בְּחֻשְׁבָּן. אַנְתְּ הוּא עִלָּאָה עַל־כָּל־עִלָּאִין סְתִימָא עַל־כָּל־סְתִימִין. לֵית מַחֲשָׁבָה תְּפִיסָא בָךְ כְּלָל: אַנְתְּ הוּא דְאַפַּקְתְּ עֶֽשֶׂר תִּקּוּנִין וְקָרֵינָן לוֹן עֶֽשֶׂר סְפִירָן. לְאַנְהָגָא בְהוֹן עָֽלְמִֽין סְתִימִין דְּלָא אִתְגַּלְיָן וְעָֽלְמִֽין דְּאִתְגַּלְיָן. וּבְהוֹן אִתְכַּסִּיאַת מִבְּנֵי נָשָׁא. וְאַנְתְּ הוּא דְּקָשִׁיר לוֹן וּמְיַחֵד לוֹן: וּבְגִין דְּאַנְתְּ מִלְּגָאו. כָּל־מָאן דְּאַפְרִישׁ חַד מִן חַבְרֵיהּ מֵאִלֵּין עֶֽשֶׂר אִתְחַשִּׁיב לֵיהּ כְּאִלּוּ אַפְרִישׁ בָּֽךְ:  "));
  parts.push(p("וְאִלֵּין עֶֽשֶׂר סְפִירָן אִנּוּן אָֽזְלִֽין כְּסִדְרָן. חַד אָרִיךְ וְחַד קָצֵר וְחַד בֵּינוֹנִי: וְאַנְתְּ הוּא דְּאַנְהִיג לוֹן. וְלֵית מָאן דְּאַנְהִיג לָךְ. לָא לְעֵֽלָּא וְלָא לְתַֽתָּא וְלָא מִכָּל־סִטְרָא. לְבוּשִׁין תַּקַּנְתְּ לוֹן דְּמִנַּֽיְהוּ פָֽרְחִֽין נִשְׁמָתִין לִבְנֵי נָשָׁא: וְכַמָּה גוּפִין תַּקַּנְתְּ לוֹן דְּאִתְקְרִֽיאוּ גוּפָא לְגַבֵּי לְבוּשִׁין דִּמְכַסְיָן עֲלֵיהוֹן: וְאִתְקְרִֽיאוּ בְּתִקּוּנָא דָא. חֶֽסֶד דְּרוֹעָא יְמִינָא. גְּבוּרָה דְּרוֹעָא שְׂמָאלָא. תִּפְאֶֽרֶת גּוּפָא. נֶֽצַח וְהוֹד תְּרֵין שׁוֹקִין. יְסוֹד סִיּוּמָא דְגוּפָא אוֹת בְּרִית קֽוֹדֶשׁ. מַלְכוּת פֶּה תּוֹרָה שֶׁבְּעַל־פֶּה קָרֵֽינָן לָהּ. חָכְמָה מוֹחָא אִֽיהִי מַחֲשָׁבָה מִלְּגָאו. בִּינָה לִבָּא וּבָהּ הַלֵּב מֵבִין. וְעַל אִלֵּין תְּרֵין כְּתִיב הַנִּ֨סְתָּרֹ֔ת לַיהֹוָ֖ה אֱלֹהֵ֑ינוּ. כֶּֽתֶר עֶלְיוֹן אִֽיהוּ כֶּֽתֶר מַלְכוּת. וְעָלֵיהּ אִתְמַר מַגִּיד מֵרֵאשִׁית אַחֲרִית. וְאִֽיהוּ קַרְקַפְתָּא דִתְפִלֵּי: מִלְּגָאו אִֽיהוּ [אוֹת] יוֹ\"ד [וְאוֹת] הֵ\"א [וְאוֹת] וָא\"ו [וְאוֹת] הֵ\"א דְּאִֽיהוּ אֹֽרַח אֲצִילוּת. אִֽיהוּ שַׁקְיוּ דְאִילָנָא בִּדְרוֹעוֹי וְעַנְפּוֹי. כְּמַיָּא דְאַשְׁקֵי לְאִילָנָא וְאִתְרַבֵּי בְּהַהוּא שַׁקְיוּ: "));
  parts.push(p("<b>רִבּוֹן</b> עָֽלְמִֽין אַנְתְּ הוּא עִלַּת הָעִלּוֹת וְסִבַּת הַסִּבּוֹת דְּאַשְׁקֵי לְאִילָנָא בְּהַהוּא נְבִיעוּ. וְהַהוּא נְבִיעוּ אִֽיהוּ כְּנִשְׁמְתָא לְגוּפָא דְּאִֽיהִי חַיִּים לְגוּפָא: וּבָךְ לֵית דִּמְיוֹן וְלֵית דִּיּוּקְנָא (דְּגוּפָא) מִכָּל־מַה־דִּלְגַאו וּלְבַר. וּבָרָֽאתָ שְׁמַיָּא וְאַרְעָא. וְאַפַּקְתְּ מִנְּהוֹן שִׁמְשָׁא וְסִיהֲרָא וְכוֹכְבַיָּא וּמַזָּלֵי. וּבְאַרְעָא אִילָנִין וּדְשָׁאִין וְגִנְּתָא דְעֵֽדֶן וְעִשְׂבִּין וְחֵיוָן וְעוֹפִין וְנוּנִין וּבְעִירִין וּבְנֵי נָשָׁא. לְאִשְׁתְּמֽוֹדְעָֽא בְהוֹן עִלָּאִין וְאֵיךְ יִתְנַהֲגוּן בְּהוֹן עִלָּאִין וְתַתָּאִין. וְאֵיךְ אִשְׁתְּמֽוֹדְעָֽן מֵעִלָּאֵי וְתַתָּאֵי וְלֵית דְּיָדַע בָּךְ כְּלָל. וּבַר מִנָּךְ לֵית יִחוּדָא בְּעִלָּאֵי וְתַתָּאֵי. וְאַנְתְּ אִשְׁתְּמוֹדָע אָדוֹן עַל־כֹּֽלָּא: וְכָל־סְפִירָן כָּל־חַד אִית לֵיהּ שֵׁם יְדִֽיעַ. וּבְהוֹן אִתְקְרִֽיאוּ מַלְאָכַיָּא. וְאַנְתְּ לֵית לָךְ שֵׁם יְדִֽיעַ. דְּאַנְתְּ הוּא מְמַלֵּא כָּל־שְׁמָהָן וְאַנְתְּ הוּא שְׁלִֽימוּ דְּכֻלְּהוּ: וְכַד אַנְתְּ תִּסְתַּלָּק מִנְּהוֹן. אִשְׁתְּאָֽרוּ כֻּלְּהוּ שְׁמָהָן כְּגוּפָא בְלָא נִשְׁמָתָא: אַנְתְּ הוּא חַכִּים וְלָאו בְּחָכְמָה יְדִיעָא. אַנְתְּ הוּא מֵבִין וְלָאו מִבִּינָה יְדִיעָא. לֵית לָךְ אֲתָר יְדִיעָא. אֶלָּא לְאִשְׁתְּמֽוֹדְעָא תֻּקְפָךְ וְחֵילָךְ לִבְנֵי נָשָׁא. וּלְאַחְזָאָה לוֹן אֵיךְ אִתְנְהִיג עָֽלְמָא בְּדִינָא וּבְרַחֲמֵי דְּאִנּוּן צֶֽדֶק וּמִשְׁפָּט כְּפוּם עוֹבָדֵיהוֹן דִּבְנֵי נָשָׁא: דִּין אִֽיהוּ גְבוּרָה. מִשְׁפָּט עַמּוּדָא דְאֶמְצָעִיתָא. צֶֽדֶק מַלְכוּתָא קַדִּישָׁא. מֹֽאזְנֵֽי צֶֽדֶק תְּרֵין סַמְכֵי קְשׁוֹט. הִין צֶֽדֶק אוֹת בְּרִית. כֹּלָּא לְאַחְזָאָה אֵיךְ אִתְנְהִיג עָֽלְמָא: אֲבָל לָאו דְּאִית לָךְ צֶֽדֶק יְדִיעָא דְּאִֽיהוּ דִין. וְלָאו מִשְׁפָּט יְדִיעָא דְאִֽיהוּ רַחֲמֵי. וְלָאו מִכָּל־אִלֵּין מִדּוֹת כְּלָל: קוּם רִבִּי שִׁמְעוֹן וְיִתְחַדְּשׁוּן מִלִּין עַל יְדָךְ, דְּהָא רְשׁוּתָא אִית לָךְ לְגַלָּאָה רָזִין טְמִירִין עַל יְדָךְ, מַה דְּלָא אִתְיְהִב רְשׁוּ לְגַלָּאָה לָשׂוּם בַּר־נָשׁ עַד כְּעָן:"));
  parts.push(p("<b>קָם</b> רַבִּי שִׁמְעוֹן פָּתַח וְאָמַר, לְךָ֣ יְ֠הֹוָ֠ה הַגְּדֻלָּ֨ה וְהַגְּבוּרָ֤ה וְהַתִּפְאֶ֙רֶת֙ וְהַנֵּ֣צַח וְהַה֔וֹד כִּי־כֹ֖ל בַּשָּׁמַ֣יִם וּבָאָ֑רֶץ לְךָ֤ יְהֹוָה֙ הַמַּמְלָכָ֔ה וְהַמִּתְנַשֵּׂ֖א לְכֹ֥ל ׀ לְרֹֽאשׁ, עִלָּאִין שִׁמְעוּ אִינוּן דְמִיכִין דְּחֶבְרוֹן, וְרַעְיָא מְהֵימְנָא אִתְּעָרוּ מִשְּׁנַתְכוֹן, הָקִיצוּ וְרַנְּנוּ שׁוֹכְנֵי עָפָר, אִלֵּין אִינוּן צַדִּיקַיָּא דְּאִינוּן מִסִּטְרָא דְּהַהִיא דְּאִתְמַר בָּהּ אֲנִ֥י יְשֵׁנָ֖ה וְלִבִּ֣י עֵ֑ר, וְלָאו אִינוּן מֵתִים, וּבְגִין דָּא אִתְמַר בְּהוֹן הָקִיצוּ וְרַנְּנוּ וְכוּ', רַעְיָא מְהֵימְנָא, אַנְתְּ וַאֲבָהָן הָקִיצוּ וְרַנְּנוּ לְאִתְּעָרוּתָא דִּשְׁכִינְתָּא, דְּאִיהִי יְשֵׁנָהּ בְּגָלוּתָא, דְּעַד כְּעַן צַדִּיקַיָּא כֻּלְּהוּ דְמִיכִין וְשִׁנְתָּא בְּחוֹרֵיהוֹן: מִיַּד יְהִיבַת שְׁכִינְתָּא תְּלָת קָלִין לְגַבֵּי רַעְיָא מְהֵימְנָא, וְיֵימָא לֵיהּ קוּם רַעְיָא מְהֵימְנָא, דְּהָא עֲלָךְ אִתְמַר ק֣וֹל ׀ דּוֹדִ֣י דוֹפֵ֗ק לְגַבָּאי בְּאַרְבַּע אַתְוָן דִּילֵיהּ, וְיֵימָא בְּהוֹן, פִּתְחִי־לִ֞י אֲחֹתִ֤י רַעְיָתִי֙ יוֹנָתִ֣י תַמָּתִ֔י, דְּהָא תַּם־עֲוֺנֵךְ֙ בַּת־צִיּ֔וֹן, לֹ֥א יוֹסִ֖יף לְהַגְלוֹתֵ֑ךְ: שֶׁרֹּאשִׁי֙ נִמְלָא־טָ֔ל, מַאי נִמְלָא טָל, אֶלָּא אָמַר קוּדְשָׁא בְּרִיךְ הוּא, אַנְתְּ חָשַׁבְתְּ דְּמִיּוֹמָא דְאִתְחָרַב בֵּי מַקְדְּשָׁא דְּעָֽאלְנָא בְּבֵיתָא דִילִי, וְעָֽאלְנָא בְיִשּׁוּבָא, לָאו הָכִי, דְּלָא עָֽאלְנָא כָּל זִמְנָא דְּאַנְתְּ בְּגָלוּתָא, הֲרֵי לְךָ סִימָנָא, שֶׁרֹּאשִׁי֙ נִמְלָא־טָ֔ל, הֵ\"א שְׁכִינְתָּא בְּגָלוּתָא, שְׁלִימוּ דִילָהּ וְחַיִּים דִילָהּ אִיהוּ טַ\"ל, וְדָא אִיהוּ [אוֹת] יוֹ\"ד [וְאוֹת] הֵ\"א [וְאוֹת] וָא\"ו, וְהֵ\"א אִיהִי שְׁכִינְתָּא דְּלָא מֵחֻשְׁבָּן טָ\"ל, אֶלָּא [אוֹת] יוֹ\"ד [וְאוֹת] הֵ\"א [וְאוֹת] וָא\"ו, דִּסְלִיקוּ אַתְוָן לְחֻשְׁבָּן טָ\"ל, דְּאִיהִי מַלְיָא לִשְׁכִינְתָּא מִנְּבִיעוּ דְכָל־מְקוֹרִין עִלָּאִין, מִיַּד קָם רַעְיָא מְהֵימְנָא, וַאֲבָהָן קַדִּישִׁין עִמֵּיהּ, עַד כָּאן רָזָא דְיִחוּדָא. בָּר֖וּךְ יְהֹוָ֥ה לְ֝עוֹלָ֗ם אָ֘מֵ֥ן ׀ וְאָמֵֽן: "));
  parts.push(p("<small>יְהֵא רַעֲוָא מִן קֳדָם עַתִּיקָא קַדִּישָׁא דְכָל־קַדִּישִׁין. טְמִירָא דְּכָל־טְמִירִין סְתִימָא דְכֹֽלָּא דְּיִתְמְשָׁךְ טַלָּא עִלָּאָה מִנֵּיהּ לְמַלְיָא רֵישֵׁיהּ דִזְעֵיר אַנְפִּין וּלְהַטִּיל לַחֲקַל תַּפּוּחִין קַדִּישִׁין בִּנְהִֽירוּ דְּאַנְפִּין בְּרַעֲוָא וּבְחֶדְוָתָא דְכֹֽלָּא. וְיִתְמְשָָׁךְ מִן קֳדָם עַתִּיקָא קַדִּישָׁא דְכָל־קַדִּישִׁין טְמִירָא דְכָל־טְמִירִין סְתִימָא דְכֹֽלָא רְעוּתָא וְרַחֲמֵי חִנָּא וְחִסְדָּא בִּנְהִֽירוּ עִלָּאָה בִּרְעוּתָא וְחֶדְוָא עָלַי וְעַל־כָּל־בְּנֵי בֵֽיתִי וְעַל־כָּל־הַנִּלְוִים אֵלַי וְעַל־כָּל־יִשְׂרָאֵל עַמֵּיהּ. וְיִפְרְקִינָן מִכָּל־עַקְתִין בִּישִׁין דְּיֵיתוּן לְעָֽלְמָא וְיַזְמִין וְיִתְיְהִיב לָֽנָא וּלְכָל־נַפְשָׁתָֽנָא חִנָּא וְחִסְדָּא וְחַיֵּי אֲרִיכֵי וּמְזוֹנֵי רְוִיחֵי וְרַחֲמֵי מִן קֳדָמֵיהּ. אָמֵן כֵּן יְהִי רָצוֹן אָמֵן וְאָמֵן:</small>"));
  parts.push(p("<small>אחר פתיחת אליהו זכור לטוב יאמרו מאמר רבי שמעון בר יוחאי הכתוב בזוהר הקדוש פרשת נח דף ס״ה ופקודי דף רס״ה: <small>(בא״ח וישלח י״ב)</small></small>"));
  parts.push(p("<b>אָמַר</b> רִבִּי שִׁמְעוֹן: אֲרִימִית יְדָאי בִּצְלוֹתִין לְעֵֽלָא, דְּכַד רְעוּתָא עִלָּאָה לְעֵֽלָא לְעֵֽלָא קַיְמָא עַל הַהוּא רְעוּתָא דְּלָא אִתְיְדַע וְלָא אִתְפַס כְּלָל לְעָֽלְמִֽין, רֵישָׁא דְסָתִים יַתִּיר לְעֵֽלָא, וְהַהוּא רֵישָׁא אַפִּיק מָאי דְּאַפִּיק וְלָא יְדִֽיעַ, וְנָהִיר מָאי דְּנָהִיר כֹּֽלָּא בִּסְתִֽימוּ, רְעוּ דְּמַחֲשָׁבָה עִלָּאָה לְמִרְדַּף אֲבַּתְרֵיהּ וּלְאִתְנַהֲרָא מִנֵּיהּ. חָד פְּרִֽיסוּ אִתְפְּרִיס, וּמִגּוֹ הַהוּא פְרִיסָא בִּרְדִיפוּ דְּהַהִיא מַחֲשָׁבָה עִלָּאָה מָטֵי וְלָא מָטֵי, עַד הַהוּא פְרִיסָא נָהִיר מָאי דְּנָהִיר, וּכְדֵין הַהוּא מַחֲשָׁבָה עִלָּאָה נָהִיר בִּנְהִירוּ סָתִים דְּלָא יְדִֽיעַ, וְהַהוּא מַחֲשָׁבָה לָא יָדַע, כְּדֵין בָּטַשׁ הַאי נְהִֽירוּ דְמַחֲשָׁבָה דְּלָא אִתְיְדַע בִּנְהִֽירוּ דְפַרְסָא דְּקָיְמָא דְּנָהִיר מִמָּה דְלָא יְדִֽיעַ וְלָא אִתְיְדַע וְלָא אִתְגַּלְיָא, וּכְדֵין דָּא נְהִֽירוּ דְמַחֲשָׁבָה דְּלָא אִתְיְדַע בָּטַשׁ בִּנְהִֽירוּ דִפְרִסָא וְנַהֲרִין כַּחֲדָא, וְאִתְעֲבִֽידוּ תִּשְׁעָה הֵיכָלִין. וְהֵיכָלִין לָאו אִנּוּן נְהוֹרִין, וְלָאו אִנּוּן רוּחִין, וְלָאו אִנּוּן נִשְׁמָתִין, וְלָא אִית מָאן דְּקַיְמָא בְהוּ. רְעוּתָא דְכָל־תִּשְׁעָה נְהוֹרִין דְּקַיְמֵי כֻלְּהוּ בְּמַחֲשָׁבָה, דְּאִֽיהוּ חָד מִנַּֽיְהוּ בְּחוּשְׁבָּנָא, כֻלְּהוּ לְמִרְדַּף בַּתְרַֽיְהוּ, בְּשַׁעְתָּא דְקַיְמֵי בְמַחֲשָׁבָה וְלָא מִתְדַּבְּקָן וְלָא אִתְיְדָֽעוּ, וְאִלֵּין לָא קַיְמֵי לָא בִרְעוּתָא וְלָא בְמַחֲשָׁבָה עִלָּאָה תַּפְסִין בָּהּ וְלָא תַּפְסִין, בְּאִלֵּין קַיְמֵי כָּל־רָזֵי דִמְהֵימְנוּתָא. וְכָל־אִנּוּן נְהוֹרִין מֵרָזָא דְמַחֲשָׁבָה עִלָּאָה וּלְתַתָּא, כֻּלְּהוּ אִקְּרוּן אֵין סוֹף. עַד הָכָא מָטוּ נְהוֹרִין, וְלָא מָטוּן וְלָא אִתְיְדָֽעוּ, לָאו הָכָא רְעוּתָא וְלָא מַחֲשָׁבָה כַּד נָהִיר מַחֲשָׁבָה וְלָא אִתְיְדַע מִמָּאן דְּנָהִיר, כְּדֵין אִתְלַבַּשׁ וְאַסְתִּים גּוֹ בִינָה, וְנָהִיר לְמָאן דְּנָהִיר, וְאָעִיל דָּא בְדָא, עַד דְּאִתְכְּלִֽילוּ כֻּלְּהוּ כַּחֲדָא. וּבְרָזָא דְקָרְבָּנָא כַּד סָלִיק, כֹּלָּא אִתְקְשַׁר דָּא בְדָא, וְנָהִיר דָּא בְדָא, כְּדֵין קַיְמֵי כֻלְּהוּ בִּסְלִֽיקוּ וּמַחֲשָׁבָה אִתְעַטָּר בְּאֵין סוֹף. הַהוּא נְהִֽירוּ דְּאִתְנְהִיר מִנֵּיהּ מַחֲשָׁבָה עִלָּאָה (דְּלָא אִתְיְדַע בָּהּ כְּלָל) אִקְּרֵי אֵין סוֹף, דְּמִנֵּיהּ אִשְׁתַּכַּח וְקַיְמָא וְנָהִיר לְמָאן דְּנָהִיר, וְעַל דָּא כֹּֽלָּא קָאִים. זַכָּאָה חוּלָקֵיהוֹן דְּצַדִּיקַיָא בְּעָֽלְמָא דֵין וּבְעָֽלְמָא דְאָתֵי:"));
  parts.push(hr);

  // ─────────────────────────── סדר עטיפת ציצית ───────────────────────────
  parts.push(p("<big><b>סדר עטיפת ציצית</b></big>"));
  parts.push(p("<b>לְשֵׁם</b> יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִילוּ וּרְחִימוּ, וּרְחִימוּ וּדְחִילוּ, לְיַחֲדָא שֵׁם יוֹ\"ד קֵ\"י בְּוָא\"ו קֵ\"י בְּיִחוּדָא שְׁלִים (יהוה) בְּשֵׁם כָּל־יִשְׂרָאֵל. הֲרֵינִי מוּכָן לְקַיֵּם מִצְוַת עֲשֵׂה לִלְבֹּשׁ טַלִּית מְצֻיֶּצֶת כְּהִלְכָתָהּ, כְּמוֹ שֶׁצִּוָּנוּ יְהֹוָה אֱלֹהֵֽינוּ בְּתוֹרָתוֹ הַקְּדוֹשָׁה: <small>(במדבר טו לח)</small> וְעָשׂ֨וּ לָהֶ֥ם צִיצִ֛ת עַל־כַּנְפֵ֥י בִגְדֵיהֶ֖ם. כְדֵי שֶׁנִּזְכֹּר כָּל־מִצְוֹתָיו לַעֲשׂוֹתָם שֶׁנֶּאֱמַר <small>(במדבר טו לט)</small> וּרְאִיתֶ֣ם אֹת֗וֹ וּזְכַרְתֶּם֙ אֶת־כׇּל־מִצְוֺ֣ת יְהֹוָ֔ה וַעֲשִׂיתֶ֖ם אֹתָ֑ם. וַהֲרֵינִי מוּכָן לְבָרֵךְ עַל עֲטִיפַת הַטָּלִית כְּתִקּוּן רַבּוֹתֵינוּ זִכְרוֹנָם לִבְרָכָה. וַהֲרֵינִי מְכַוֵּן לִפְטֹר בִּבְרָכָה זוֹ גַּם טַלִּית הַקָּטָן שֶׁעָלַי. כְּדֵי לַעֲשׂוֹת נַֽחַת רֽוּחַ לְיֽוֹצְרֵֽנוּ וְלַעֲשׂוֹת רְצוֹן בּֽוֹרְאֵֽנוּ. וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ׃ "));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהִתְעַטֵּף בְּצִיצִית: "));
  parts.push(hr);

  // ─────────────────────────── סדר הנחת תפילין ───────────────────────────
  parts.push(p("<big><b>סדר הנחת תפילין</b></big>"));
  parts.push(p("<b>לְשֵׁם</b> יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִילוּ וּרְחִימוּ, וּרְחִימוּ וּדְחִילוּ, לְיַחֲדָא שֵׁם יוֹ\"ד קֵ\"י בְּוָא\"ו קֵ\"י בְּיִחוּדָא שְׁלִים (יהוה) בְּשֵׁם כָּל־יִשְׂרָאֵל. הֲרֵינִי מוּכָן לְקַיֵּם מִצְוַת עֲשֵׂה לְהָנִיחַ תְּפִלִּין בְּיָדִי וּבְרֹאשִׁי, כְּמוֹ שֶׁצִּוָּנוּ יְהֹוָה אֱלֹהֵֽינוּ: <small>(דברים יא יח)</small> וּקְשַׁרְתֶּ֨ם אֹתָ֤ם לְאוֹת֙ עַל־יֶדְכֶ֔ם וְהָי֥וּ לְטוֹטָפֹ֖ת בֵּ֥ין עֵינֵיכֶֽם. וְצִוָּנוּ הַקָּדוֹשׁ בָּרוּךְ הוּא לְהָנִיחַ אַרְבַּע פַּרְשִׁיּוֹת אֵלּוּ שֶׁיֵּשׁ בָּהֶם יִחוּד שְׁמוֹ וִיצִיאַת מִצְרַיִם עַל הַזְּרוֹעַ כְּנֶגֶד הַלֵּב, וְעַל הָרֹאשׁ כְּנֶגֶד הַמֹּחַ, כְּדֵי שֶׁנִּזְכֹּר נִסִּים וְנִפְלָאוֹת שֶׁעָשָׂה עִמָּנוּ. וַהֲרֵינִי מוּכָן לְבָרֵךְ הַבְּרָכָה שֶׁתִּקְנוּ רַבּוֹתֵינוּ זִכְרוֹנָם לִבְרָכָה עַל מִצְוַת הַתְּפִלִּין, וַהֲרֵינִי מְכַוֵּן לִפְטֹר בִּבְרָכָה זוֹ תְּפִלִּין שֶׁל יָד וּתְפִלִּין שֶׁל רֹאשׁ, וְיַעֲלֶה לְפָנֶיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלהֵי אֲבוֹתֵינוּ כְּאִלּוּ כִּוַּנְתִּי בְּכָל הַכַּוָּנוֹת הָרְאוּיוֹת לְכַוֵּן בַּהֲנָחַת הַתְּפִלִּין וּבַבְּרָכָה. וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ׃"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ לְהָנִיחַ תְּפִלִּין:<br><br><small><small>אם הפסיק בין תפלין של יד לתפלין של ראש בדבר דחשיב הפסק, אז יברך על תפלין של ראש (בא\"ח וירא ו')</small><br><b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָֽׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ עַל מִצְוַת תְּפִלִּין:</small>"));
  parts.push(p("<small><small>אחר שהניח תפלין של ראש, אז תכף ומיד יגמור הנחת תפלין של יד בשלש כריכות שכורך באצבע האמצעי הנקרא אמה, ויעשה כריכה אחת בפרק האמצעי של האצבע ושתי כריכות בפרק התחתון, ויאמר בעת שעושה הכריכות הנזכרות (בא\"ח וירא ט\"ז)</small></small><br>וְאֵרַשְׂתִּ֥יךְ לִ֖י לְעוֹלָ֑ם וְאֵרַשְׂתִּ֥יךְ לִי֙ בְּצֶ֣דֶק וּבְמִשְׁפָּ֔ט וּבְחֶ֖סֶד וּֽבְרַחֲמִֽים׃ וְאֵרַשְׂתִּ֥יךְ לִ֖י בֶּאֱמוּנָ֑ה וְיָדַ֖עַתְּ אֶת־יְהֹוָֽה׃"));
  parts.push(p("<small><small>אחר שיניח התפילין יאמר פרשת קדש ווהיה כי יביאך כדי להשלים ארבעת פרשיות בכל יום ואם אינו יכול לאומרם קודם תפלה יאמר אותם אחר תפלה (בא\"ח וירא כ\"ה)</small></small><br><b>וַיְדַבֵּ֥ר</b> יְהֹוָ֖ה אֶל־מֹשֶׁ֥ה לֵּאמֹֽר׃ קַדֶּשׁ־לִ֨י כׇל־בְּכ֜וֹר פֶּ֤טֶר כׇּל־רֶ֙חֶם֙ בִּבְנֵ֣י יִשְׂרָאֵ֔ל בָּאָדָ֖ם וּבַבְּהֵמָ֑ה לִ֖י הֽוּא׃ וַיֹּ֨אמֶר מֹשֶׁ֜ה אֶל־הָעָ֗ם זָכ֞וֹר אֶת־הַיּ֤וֹם הַזֶּה֙ אֲשֶׁ֨ר יְצָאתֶ֤ם מִמִּצְרַ֙יִם֙ מִבֵּ֣ית עֲבָדִ֔ים כִּ֚י בְּחֹ֣זֶק יָ֔ד הוֹצִ֧יא יְהֹוָ֛ה אֶתְכֶ֖ם מִזֶּ֑ה וְלֹ֥א יֵאָכֵ֖ל חָמֵֽץ׃ הַיּ֖וֹם אַתֶּ֣ם יֹצְאִ֑ים בְּחֹ֖דֶשׁ הָאָבִֽיב׃ וְהָיָ֣ה כִֽי־יְבִיאֲךָ֣ יְהֹוָ֡ה אֶל־אֶ֣רֶץ הַֽ֠כְּנַעֲנִ֠י וְהַחִתִּ֨י וְהָאֱמֹרִ֜י וְהַחִוִּ֣י וְהַיְבוּסִ֗י אֲשֶׁ֨ר נִשְׁבַּ֤ע לַאֲבֹתֶ֙יךָ֙ לָ֣תֶת לָ֔ךְ אֶ֛רֶץ זָבַ֥ת חָלָ֖ב וּדְבָ֑שׁ וְעָבַדְתָּ֛ אֶת־הָעֲבֹדָ֥ה הַזֹּ֖את בַּחֹ֥דֶשׁ הַזֶּֽה׃ שִׁבְעַ֥ת יָמִ֖ים תֹּאכַ֣ל מַצֹּ֑ת וּבַיּוֹם֙ הַשְּׁבִיעִ֔י חַ֖ג לַיהֹוָֽה׃ מַצּוֹת֙ יֵֽאָכֵ֔ל אֵ֖ת שִׁבְעַ֣ת הַיָּמִ֑ים וְלֹֽא־יֵרָאֶ֨ה לְךָ֜ חָמֵ֗ץ וְלֹֽא־יֵרָאֶ֥ה לְךָ֛ שְׂאֹ֖ר בְּכׇל־גְּבֻלֶֽךָ׃ וְהִגַּדְתָּ֣ לְבִנְךָ֔ בַּיּ֥וֹם הַה֖וּא לֵאמֹ֑ר בַּעֲב֣וּר זֶ֗ה עָשָׂ֤ה יְהֹוָה֙ לִ֔י בְּצֵאתִ֖י מִמִּצְרָֽיִם׃ וְהָיָה֩ לְךָ֨ לְא֜וֹת עַל־יָדְךָ֗ וּלְזִכָּרוֹן֙ בֵּ֣ין עֵינֶ֔יךָ לְמַ֗עַן תִּהְיֶ֛ה תּוֹרַ֥ת יְהֹוָ֖ה בְּפִ֑יךָ כִּ֚י בְּיָ֣ד חֲזָקָ֔ה הוֹצִֽאֲךָ֥ יְהֹוָ֖ה מִמִּצְרָֽיִם׃ וְשָׁמַרְתָּ֛ אֶת־הַחֻקָּ֥ה הַזֹּ֖את לְמוֹעֲדָ֑הּ מִיָּמִ֖ים יָמִֽימָה׃ "));
  parts.push(p("<b>וְהָיָ֞ה</b> כִּֽי־יְבִאֲךָ֤ יְהֹוָה֙ אֶל־אֶ֣רֶץ הַֽכְּנַעֲנִ֔י כַּאֲשֶׁ֛ר נִשְׁבַּ֥ע לְךָ֖ וְלַֽאֲבֹתֶ֑יךָ וּנְתָנָ֖הּ לָֽךְ׃ וְהַעֲבַרְתָּ֥ כׇל־פֶּֽטֶר־רֶ֖חֶם לַֽיהֹוָ֑ה וְכׇל־פֶּ֣טֶר ׀ שֶׁ֣גֶר בְּהֵמָ֗ה אֲשֶׁ֨ר יִהְיֶ֥ה לְךָ֛ הַזְּכָרִ֖ים לַיהֹוָֽה׃ וְכׇל־פֶּ֤טֶר חֲמֹר֙ תִּפְדֶּ֣ה בְשֶׂ֔ה וְאִם־לֹ֥א תִפְדֶּ֖ה וַעֲרַפְתּ֑וֹ וְכֹ֨ל בְּכ֥וֹר אָדָ֛ם בְּבָנֶ֖יךָ תִּפְדֶּֽה׃ וְהָיָ֞ה כִּֽי־יִשְׁאׇלְךָ֥ בִנְךָ֛ מָחָ֖ר לֵאמֹ֣ר מַה־זֹּ֑את וְאָמַרְתָּ֣ אֵלָ֔יו בְּחֹ֣זֶק יָ֗ד הוֹצִיאָ֧נוּ יְהֹוָ֛ה מִמִּצְרַ֖יִם מִבֵּ֥ית עֲבָדִֽים׃ וַיְהִ֗י כִּֽי־הִקְשָׁ֣ה פַרְעֹה֮ לְשַׁלְּחֵ֒נוּ֒ וַיַּהֲרֹ֨ג יְהֹוָ֤ה כׇּל־בְּכוֹר֙ בְּאֶ֣רֶץ מִצְרַ֔יִם מִבְּכֹ֥ר אָדָ֖ם וְעַד־בְּכ֣וֹר בְּהֵמָ֑ה עַל־כֵּן֩ אֲנִ֨י זֹבֵ֜חַ לַֽיהֹוָ֗ה כׇּל־פֶּ֤טֶר רֶ֙חֶם֙ הַזְּכָרִ֔ים וְכׇל־בְּכ֥וֹר בָּנַ֖י אֶפְדֶּֽה׃ וְהָיָ֤ה לְאוֹת֙ עַל־יָ֣דְכָ֔ה וּלְטוֹטָפֹ֖ת בֵּ֣ין עֵינֶ֑יךָ כִּ֚י בְּחֹ֣זֶק יָ֔ד הוֹצִיאָ֥נוּ יְהֹוָ֖ה מִמִּצְרָֽיִם׃"));
  parts.push(hr);

  // ─────────────────────────── תפילת שחרית ───────────────────────────
  parts.push(p("<big><b>תפילת שחרית</b></big>"));
  parts.push(p("<small><small>יזהר כל אדם לומר קודם פרשת העקידה נוסח זה, ובזה הנוסח שאומר האדם בכל יום קודם תפלה יהיה מוצל מלטותא דרבי שמעון בר יוחאי דלייט באדרא רבא דף קמ\"א עמוד ב (ח\"ג קמא, ב), וה' לא ימנע טוב להולכים בתמים (בא\"ח מקץ י\"ב)</small><br><b>רִבּוֹן</b> עָֽלְמָא יְהֵא רַעֲוָא קַמָּךְ לְמֵיהַב לָן חֵילָא לְאִתְעֲרָא בִּיקָרָךְ, וּלְמֶעְבַּד רְעוּתָךְ, וּלְסַדְּרָא כֹֽלָּא כִּדְקָא יָאוּת. וְאַף עַל גַּב דְּלֵית אֲנַן יָֽדְעִֽין לְשַׁוְּאָה רְעוּתָא וְלִבָּא לְתַקְּנָא כֹֽלָּא, יְהֵא רַעֲוָא קַמָּךְ דְּתִתְרְעֵי בְמִלִּין וּצְלוֹתָא דִּילָן, לְתַקָּנָא תִּקּוּנָא דִלְעֵֽלָּא כִּדְקָא יָאוּת, וְלֶהֱווּ הֵיכָלִין עִלָּאִין, וְרוּחִין עִלָּאִין עַיְלֵי הֵיכָלָא בְּהֵיכָלָא, וְרוּחָא בְּרוּחָא, עַד דְּמִתְחַבְּרָן בְּדוּכְתַּיְהוּ כִּדְקָא חָזֵי, שַׁיְפָא בְשַׁיְפָא, וְאִשְׁתְּלִימוּ דָּא בְדָא, וְאִתְיַחֲדוּ דָּא בְדָא עַד אִנּוּן חָד, וְנַהֲרִין דָּא בְדָא, וּכְדֵין נִשְׁמְתָא עִלָּאָה דְכֹלָּא אַתְיָא מִלְּעֵלָּא וְנָהִיר לוֹן, וְלֶהֱווּ נְהִירִין כֻּלְּהוּ בוֹצִינִין בִּשְׁלִימוּ כִּדְקָא חָזֵי, עַד דְּהַהוּא נְהוֹרָא עִלָּאָה אִתְּעַר, וְכֹלָּא אָעִיל לְגַבֵּי קֹדֶשׁ קָדָשִׁים, וְאִתְבָּרְכָא וְאִתְמַלְיָא כְּבֵירָא דְמַיִּין נָבְעִין וְלָא פָסְקִין, וְכֻלְּהוּ מִתְבָּרְכָן לְעֵלָּא וְתַתָּא, וְהַהוּא דְלָּא אִתְיְדַע וְלָא אָעִיל בְּחוּשְׁבָּנָא רְעוּתָא דְלָא אִתְּפַס לְעָלְמִין בָּסִים לְגוֹ לְגוֹ בְּגַוָּיְהוּ וְלָא אִתְיְדַע הַהוּא רְעוּתָא וְלָא אִתְּפַס לְמִנְדַּע, וּכְדֵין כֹּלָּא רְעוּתָא חֲדָא עַד אֵין סוֹף וְכֹלָּא אִיהוּ בִּשְׁלִימוּ מִלְּתַתָּא וּמִגּוֹ לְגוֹ עַד דְּאִתְעָבִיד כֹּלָּא חָד, וְאִתְמַלְיָא כֹּלָּא וְאִשְׁתְּלִים כֹּלָּא וְאִתְנְהִיר וְאִתְבַּסָּם כֹּלָּא כִּדְקָא יָאוּת:<br><b>רִבּוֹן</b> עָֽלְמָא יְהֵא רְעוּתָךְ עִם עַמָּךְ יִשְׂרָאֵל לְעָלַם, וּפֻרְקַן יְמִינָךְ אַחֲזֵי לְעַמָּךְ בְּבֵית מַקְדְּשָׁךְ, וּלְאַמְטוּיֵי לָנָא מִטּוּב נְהוֹרָךְ, וּלְקַבְּלָא צְלוֹתָנָא בְּרַחֲמֵי, יְהֵא רַעֲוָא קַמָּךְ דְּתֶהֱוֵי סָעִיד וְסָמִיךְ לָן, דְּנֵימָא מִלִּין בְּאֹרַח מֵישַׁר, בְּתִקּוּנָא דִלְעֵלָּא, בְּתִקּוּנִין דְּמַלְכָּא קַדִּישָׁא וּמַטְרוֹנִיתָא קַדִּישָׁא, וּלְמֶעְבַּד יִחוּדָא שְׁלִים, לְאַשְׁלָפָא לְהַהִיא נִשְׁמְתָה דְכָל־חַיֵי מִדַּרְגָּא לְדַרְגָּא עַד סוֹפָא דְכָל־דַּרְגִּין, בְּגִין דְּתֶהֱוֵי הַהִיא נִשְׁמְתָא מִשְׁתַּכְּחָא בְּכֹלָּא וּמִתְפַּשְּׁטָא בְּכֹלָּא, דְּהָא עֵילָּא וְתַתָּא תַּלְיָן בְּהַהִיא נִשְׁמְתָא וּמִתְקַיְּמֵי בָהּ:</small>"));
  parts.push(p("<small><b>לְשֵׁם</b> יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִֽילוּ וּרְחִֽימוּ, וּרְחִֽימוּ וּדְחִֽילוּ, לְיַחֲדָא שֵׁם יוֹ\"ד קֵ\"א בְּוָא\"ו קֵ\"א בְּיִחוּדָא שְׁלִים, בְּשֵׁם כָּל־יִשְׂרָאֵל, הִנֵּה אֲנַֽחְנוּ בָּאִים לְהִתְפַּלֵּל תְּפִלַּת שַׁחֲרִית, שֶׁתִּקֵּן אַבְרָהָם אָבִינוּ עָלָיו הַשָּׁלוֹם, עִם כָּל הַמִּצְוֹת הַכְּלוּלוֹת בָּהּ, לְתַקֵּן אֶת שָׁרְשָׁהּ בְּמָקוֹם עֶלְיוֹן, לַעֲשׂוֹת נַֽחַת רֽוּחַ לְיֽוֹצְרֵֽנוּ וְלַעֲשׂוֹת רְצוֹן בּֽוֹרְאֵֽנוּ. וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ׃<br><br><small>וַהֲרֵינִי מְקַבֵּל עָלַי מִצְוַת עֲשֵׂה שֶׁל \"וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ\" וַהֲרֵינִי אוֹהֵב כָּל אֶחָד מִבְּנֵי יִשְׂרָאֵל כְּנַפְשִׁי וּמְאוֹדִי, וַהֲרֵינִי מְזַמֵּן אֶת פִּי לְהִתְפַּלֵּל לִפְנֵי מֶלֶךְ מַלְכֵי הַמְּלָכִים, הַקָּדוֹשׁ בָּרוּךְ הוּא:</small></small>"));
  parts.push(p("<b>אֱלֹהֵינוּ</b> וֵאלֹהֵי אֲבוֹתֵינוּ, זָכְרֵנוּ בְּזִכְרוֹן טוֹב מִלְּפָנֶיךָ, וּפָקְדֵנוּ בִּפְקֻדַת יְשׁוּעָה וְרַחֲמִים מִשְּׁמֵי שְׁמֵי קֶדֶם, וּזְכֹר־לָנוּ יְהֹוָה אֱלֹהֵינוּ אַהֲבַת הַקַּדְמוֹנִים אַבְרָהָם יִצְחָק וְיִשְׂרָאֵל עֲבָדֶיךָ, אֶת הַבְּרִית וְאֶת הַחֶסֶד וְאֶת הַשְּׁבוּעָה שֶׁנִּשְׁבַּעְתָּ לְאַבְרָהָם אָבִינוּ בְּהַר הַמּוֹרִיָּה, וְאֶת הָעֲקֵדָה שֶׁעָקַד אֶת יִצְחָק בְּנוֹ עַל־גַּבֵּי הַמִּזְבֵּחַ כַּכָּתוּב בְּתוֹרָתָךְ: "));
  parts.push(p("<b>וַיְהִ֗י</b> אַחַר֙ הַדְּבָרִ֣ים הָאֵ֔לֶּה וְהָ֣אֱלֹהִ֔ים נִסָּ֖ה אֶת־אַבְרָהָ֑ם וַיֹּ֣אמֶר אֵלָ֔יו אַבְרָהָ֖ם וַיֹּ֥אמֶר הִנֵּֽנִי׃ וַיֹּ֡אמֶר קַח־נָ֠א אֶת־בִּנְךָ֨ אֶת־יְחִֽידְךָ֤ אֲשֶׁר־אָהַ֙בְתָּ֙ אֶת־יִצְחָ֔ק וְלֶ֨ךְ־לְךָ֔ אֶל־אֶ֖רֶץ הַמֹּרִיָּ֑ה וְהַעֲלֵ֤הוּ שָׁם֙ לְעֹלָ֔ה עַ֚ל אַחַ֣ד הֶֽהָרִ֔ים אֲשֶׁ֖ר אֹמַ֥ר אֵלֶֽיךָ׃ וַיַּשְׁכֵּ֨ם אַבְרָהָ֜ם בַּבֹּ֗קֶר וַֽיַּחֲבֹשׁ֙ אֶת־חֲמֹר֔וֹ וַיִּקַּ֞ח אֶת־שְׁנֵ֤י נְעָרָיו֙ אִתּ֔וֹ וְאֵ֖ת יִצְחָ֣ק בְּנ֑וֹ וַיְבַקַּע֙ עֲצֵ֣י עֹלָ֔ה וַיָּ֣קׇם וַיֵּ֔לֶךְ אֶל־הַמָּק֖וֹם אֲשֶׁר־אָֽמַר־ל֥וֹ הָאֱלֹהִֽים׃ בַּיּ֣וֹם הַשְּׁלִישִׁ֗י וַיִּשָּׂ֨א אַבְרָהָ֧ם אֶת־עֵינָ֛יו וַיַּ֥רְא אֶת־הַמָּק֖וֹם מֵרָחֹֽק׃ וַיֹּ֨אמֶר אַבְרָהָ֜ם אֶל־נְעָרָ֗יו שְׁבוּ־לָכֶ֥ם פֹּה֙ עִֽם־הַחֲמ֔וֹר וַאֲנִ֣י וְהַנַּ֔עַר נֵלְכָ֖ה עַד־כֹּ֑ה וְנִֽשְׁתַּחֲוֶ֖ה וְנָשׁ֥וּבָה אֲלֵיכֶֽם׃ וַיִּקַּ֨ח אַבְרָהָ֜ם אֶת־עֲצֵ֣י הָעֹלָ֗ה וַיָּ֙שֶׂם֙ עַל־יִצְחָ֣ק בְּנ֔וֹ וַיִּקַּ֣ח בְּיָד֔וֹ אֶת־הָאֵ֖שׁ וְאֶת־הַֽמַּאֲכֶ֑לֶת וַיֵּלְכ֥וּ שְׁנֵיהֶ֖ם יַחְדָּֽו׃ וַיֹּ֨אמֶר יִצְחָ֜ק אֶל־אַבְרָהָ֤ם אָבִיו֙ וַיֹּ֣אמֶר אָבִ֔י וַיֹּ֖אמֶר הִנֶּ֣נִּֽי בְנִ֑י וַיֹּ֗אמֶר הִנֵּ֤ה הָאֵשׁ֙ וְהָ֣עֵצִ֔ים וְאַיֵּ֥ה הַשֶּׂ֖ה לְעֹלָֽה׃ וַיֹּ֙אמֶר֙ אַבְרָהָ֔ם אֱלֹהִ֞ים יִרְאֶה־לּ֥וֹ הַשֶּׂ֛ה לְעֹלָ֖ה בְּנִ֑י וַיֵּלְכ֥וּ שְׁנֵיהֶ֖ם יַחְדָּֽו׃ וַיָּבֹ֗אוּ אֶֽל־הַמָּקוֹם֮ אֲשֶׁ֣ר אָֽמַר־ל֣וֹ הָאֱלֹהִים֒ וַיִּ֨בֶן שָׁ֤ם אַבְרָהָם֙ אֶת־הַמִּזְבֵּ֔חַ וַֽיַּעֲרֹ֖ךְ אֶת־הָעֵצִ֑ים וַֽיַּעֲקֹד֙ אֶת־יִצְחָ֣ק בְּנ֔וֹ וַיָּ֤שֶׂם אֹתוֹ֙ עַל־הַמִּזְבֵּ֔חַ מִמַּ֖עַל לָעֵצִֽים׃ וַיִּשְׁלַ֤ח אַבְרָהָם֙ אֶת־יָד֔וֹ וַיִּקַּ֖ח אֶת־הַֽמַּאֲכֶ֑לֶת לִשְׁחֹ֖ט אֶת־בְּנֽוֹ׃ וַיִּקְרָ֨א אֵלָ֜יו מַלְאַ֤ךְ יְהֹוָה֙ מִן־הַשָּׁמַ֔יִם וַיֹּ֖אמֶר אַבְרָהָ֣ם ׀ אַבְרָהָ֑ם וַיֹּ֖אמֶר הִנֵּֽנִי׃ וַיֹּ֗אמֶר אַל־תִּשְׁלַ֤ח יָֽדְךָ֙ אֶל־הַנַּ֔עַר וְאַל־תַּ֥עַשׂ ל֖וֹ מְא֑וּמָה כִּ֣י ׀ עַתָּ֣ה יָדַ֗עְתִּי כִּֽי־יְרֵ֤א אֱלֹהִים֙ אַ֔תָּה וְלֹ֥א חָשַׂ֛כְתָּ אֶת־בִּנְךָ֥ אֶת־יְחִידְךָ֖ מִמֶּֽנִּי׃ וַיִּשָּׂ֨א אַבְרָהָ֜ם אֶת־עֵינָ֗יו וַיַּרְא֙ וְהִנֵּה־אַ֔יִל אַחַ֕ר נֶאֱחַ֥ז בַּסְּבַ֖ךְ בְּקַרְנָ֑יו וַיֵּ֤לֶךְ אַבְרָהָם֙ וַיִּקַּ֣ח אֶת־הָאַ֔יִל וַיַּעֲלֵ֥הוּ לְעֹלָ֖ה תַּ֥חַת בְּנֽוֹ׃ וַיִּקְרָ֧א אַבְרָהָ֛ם שֵֽׁם־הַמָּק֥וֹם הַה֖וּא יְהֹוָ֣ה ׀ יִרְאֶ֑ה אֲשֶׁר֙ יֵאָמֵ֣ר הַיּ֔וֹם בְּהַ֥ר יְהֹוָ֖ה יֵרָאֶֽה׃ וַיִּקְרָ֛א מַלְאַ֥ךְ יְהֹוָ֖ה אֶל־אַבְרָהָ֑ם שֵׁנִ֖ית מִן־הַשָּׁמָֽיִם׃ וַיֹּ֕אמֶר בִּ֥י נִשְׁבַּ֖עְתִּי נְאֻם־יְהֹוָ֑ה כִּ֗י יַ֚עַן אֲשֶׁ֤ר עָשִׂ֙יתָ֙ אֶת־הַדָּבָ֣ר הַזֶּ֔ה וְלֹ֥א חָשַׂ֖כְתָּ אֶת־בִּנְךָ֥ אֶת־יְחִידֶֽךָ׃ כִּֽי־בָרֵ֣ךְ אֲבָרֶכְךָ֗ וְהַרְבָּ֨ה אַרְבֶּ֤ה אֶֽת־זַרְעֲךָ֙ כְּכוֹכְבֵ֣י הַשָּׁמַ֔יִם וְכַח֕וֹל אֲשֶׁ֖ר עַל־שְׂפַ֣ת הַיָּ֑ם וְיִרַ֣שׁ זַרְעֲךָ֔ אֵ֖ת שַׁ֥עַר אֹיְבָֽיו׃ וְהִתְבָּרְכ֣וּ בְזַרְעֲךָ֔ כֹּ֖ל גּוֹיֵ֣י הָאָ֑רֶץ עֵ֕קֶב אֲשֶׁ֥ר שָׁמַ֖עְתָּ בְּקֹלִֽי׃ וַיָּ֤שׇׁב אַבְרָהָם֙ אֶל־נְעָרָ֔יו וַיָּקֻ֛מוּ וַיֵּלְכ֥וּ יַחְדָּ֖ו אֶל־בְּאֵ֣ר שָׁ֑בַע וַיֵּ֥שֶׁב אַבְרָהָ֖ם בִּבְאֵ֥ר שָֽׁבַע׃ "));
  parts.push(p("<small><small>יש נוהגים לומר את הקטע הבא</small> </small>"));
  parts.push(p("וְשָׁחַ֨ט אֹת֜וֹ עַ֣ל יֶ֧רֶךְ הַמִּזְבֵּ֛חַ צָפֹ֖נָה לִפְנֵ֣י יְהֹוָ֑ה וְזָרְק֡וּ בְּנֵי֩ אַהֲרֹ֨ן הַכֹּהֲנִ֧ים אֶת־דָּמ֛וֹ עַל־הַמִּזְבֵּ֖חַ סָבִֽיב:"));
  parts.push(p("יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ, וּבְכֵן בְּרוֹב רַחֲמֶיךָ תִּזְכּוֹר לָנוּ עֲקֵדָתוֹ שֶׁל יִצְחָק אָבִינוּ בֶּן אַבְרָהָם אָבִינוּ עָלָיו הַשָּׁלוֹם, כְּאִלּוּ אֶפְרוֹ צָבוּר וּמֻנָּח עַל גַּבֵּי הַמִּזְבֵּחַ, וְתַבִּיט בְּאֶפְרוֹ לְרַחֵם עָלֵינוּ, וּלְבַטֵּל מֵעָלֵינוּ כָּל־גְּזֵירוֹת קָשׁוֹת וְרָעוֹת, וּתְזַכֵּנוּ לָשׁוּב בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶיךָ, וְתַצִּילֵנוּ מִיֵּצֶר הָרָע וּמִכָּל חֵטְא וְעָוֹן, וְתַאֲרִיךְ יָמֵינוּ בַּטּוֹב וּשְׁנוֹתֵינוּ בַּנְּעִימִים: "));
  parts.push(p("<b>רִבּוֹנוֹ</b> שֶׁל עוֹלָם, כְּמוֹ שֶׁכָּבַשׁ אַבְרָהָם אָבִינוּ אֶת רַחֲמָיו לַעֲשׂוֹת רְצוֹנְךָ בְּלֵבָב שָׁלֵם, כֵּן יִכְבְּשׁוּ רַחֲמֶיךָ אֶת כַּעַסֶֽךָ, וְיִּגֹּלוּ רַחֲמֶיךָ עַל מִדּוֹתֶיךָ, וְתִתְנַהֵג עִמָּנוּ יְהֹוָה אֱלֹהֵינוּ בְּמִדַּת הַחֶסֶד וּבְמִדַּת הָרַחֲמִים, וְתִכָּנֵס לָנוּ לִפְנִים מִשּׁוּרַת הַדִּין, וּבְטוּבְךָ הַגָּדוֹל יָשׁוּב חֲרוֹן אַפָּךְ, מֵעַמָּךְ וּמֵעִירָךְ וּמֵאַרְצָךְ וּמִנַּחֲלָתָךְ, וְקַיֵם לָנוּ יְהֹוָה אֱלֹהֵינוּ אֶת הַדָּבָר שֶׁהִבְטַחְתָּנוּ בְּתוֹרָתָךְ עַל יְדֵי מֹשֶׁה עַבְדָּךְ כָּאָמוּר: וְזָכַרְתִּ֖י אֶת־בְּרִיתִ֣י יַעֲק֑וֹב וְאַף֩ אֶת־בְּרִיתִ֨י יִצְחָ֜ק וְאַ֨ף אֶת־בְּרִיתִ֧י אַבְרָהָ֛ם אֶזְכֹּ֖ר וְהָאָ֥רֶץ אֶזְכֹּֽר: וְנֶאֱמַר: וְאַף־גַּם־זֹ֠את בִּֽהְיוֹתָ֞ם בְּאֶ֣רֶץ אֹֽיְבֵיהֶ֗ם לֹֽא־מְאַסְתִּ֤ים וְלֹֽא־גְעַלְתִּים֙ לְכַלֹּתָ֔ם לְהָפֵ֥ר בְּרִיתִ֖י אִתָּ֑ם כִּ֛י אֲנִ֥י יְהֹוָ֖ה אֱלֹהֵיהֶֽם: וְזָכַרְתִּ֥י לָהֶ֖ם בְּרִ֣ית רִאשֹׁנִ֑ים אֲשֶׁ֣ר הוֹצֵֽאתִי־אֹתָם֩ מֵאֶ֨רֶץ מִצְרַ֜יִם לְעֵינֵ֣י הַגּוֹיִ֗ם לִהְי֥וֹת לָהֶ֛ם לֵאלֹהִ֖ים אֲנִ֥י יְהֹוָֽה: וְנֶאֱמַר: וְשָׁ֨ב יְהֹוָ֧ה אֱלֹהֶ֛יךָ אֶת־שְׁבוּתְךָ֖ וְרִחֲמֶ֑ךָ וְשָׁ֗ב וְקִבֶּצְךָ֙ מִכׇּל־הָ֣עַמִּ֔ים אֲשֶׁ֧ר הֱפִֽיצְךָ֛ יְהֹוָ֥ה אֱלֹהֶ֖יךָ שָֽׁמָּה: אִם־יִהְיֶ֥ה נִֽדַּחֲךָ֖ בִּקְצֵ֣ה הַשָּׁמָ֑יִם מִשָּׁ֗ם יְקַבֶּצְךָ֙ יְהֹוָ֣ה אֱלֹהֶ֔יךָ וּמִשָּׁ֖ם יִקָּחֶֽךָ: וֶהֱבִיאֲךָ֞ יְהֹוָ֣ה אֱלֹהֶ֗יךָ אֶל־הָאָ֛רֶץ אֲשֶׁר־יָרְשׁ֥וּ אֲבֹתֶ֖יךָ וִֽירִשְׁתָּ֑הּ וְהֵיטִֽבְךָ֥ וְהִרְבְּךָ֖ מֵאֲבֹתֶֽיךָ: וְנֶאֱמַר עַל יְדֵי נְבִיאֶךָ: יְהֹוָ֥ה חׇנֵּ֖נוּ לְךָ֣ קִוִּ֑ינוּ הֱיֵ֤ה זְרֹעָם֙ לַבְּקָרִ֔ים אַף־יְשׁוּעָתֵ֖נוּ בְּעֵ֥ת צָרָֽה: וְנֶאֱמַר: וְעֵֽת־צָרָ֥ה הִיא֙ לְיַֽעֲקֹ֔ב וּמִמֶּ֖נָּה יִוָּשֵֽׁעַ: וְנֶאֱמַר: בְּֽכׇל־צָרָתָ֣ם ׀ לא [ל֣וֹ] צָ֗ר וּמַלְאַ֤ךְ פָּנָיו֙ הוֹשִׁיעָ֔ם בְּאַהֲבָת֥וֹ וּבְחֶמְלָת֖וֹ ה֣וּא גְאָלָ֑ם וַֽיְנַטְּלֵ֥ם וַֽיְנַשְּׂאֵ֖ם כׇּל־יְמֵ֥י עוֹלָֽם: וְנֶאֱמַר: <small>יכוין לי\"ג מדות</small> מִי־אֵ֣ל כָּמ֗וֹךָ <small>אל</small> נֹשֵׂ֤א עָוֺן֙ <small>רחום</small> וְעֹבֵ֣ר עַל־פֶּ֔שַׁע <small>וחנון</small> לִשְׁאֵרִ֖ית נַחֲלָת֑וֹ <small>ארך</small> לֹֽא־הֶחֱזִ֤יק לָעַד֙ אַפּ֔וֹ <small>אפים</small> כִּֽי־חָפֵ֥ץ חֶ֖סֶד הֽוּא <small>ורב חסד</small>: יָשׁ֣וּב יְרַחֲמֵ֔נוּ <small>ואמת</small> יִכְבֹּ֖שׁ עֲוֺנֹתֵ֑ינוּ <small>נצר חסד</small> וְתַשְׁלִ֛יךְ בִּמְצֻל֥וֹת יָ֖ם כׇּל־חַטֹּאותָֽם <small>לאלפים</small>: תִּתֵּ֤ן אֱמֶת֙ לְיַֽעֲקֹ֔ב <small>נושא עון</small> חֶ֖סֶד לְאַבְרָהָ֑ם <small>ופשע</small> אֲשֶׁר־נִשְׁבַּ֥עְתָּ לַאֲבֹתֵ֖ינוּ <small>וחטאה</small> מִ֥ימֵי קֶֽדֶם <small>ונקה</small>: וְנֶאֱמַר: וַהֲבִיאוֹתִ֞ים אֶל־הַ֣ר קׇדְשִׁ֗י וְשִׂמַּחְתִּים֙ בְּבֵ֣ית תְּפִלָּתִ֔י עוֹלֹתֵיהֶ֧ם וְזִבְחֵיהֶ֛ם לְרָצ֖וֹן עַֽל־מִזְבְּחִ֑י כִּ֣י בֵיתִ֔י בֵּית־תְּפִלָּ֥ה יִקָּרֵ֖א לְכׇל־הָעַמִּֽים: "));
  parts.push(p("<b>אֵלּוּ</b> דְבָרִים שֶׁאֵין לָהֶם שִׁעוּר: הַפֵּאָה, וְהַבִּכּוּרִים, וְהָרֵאָיוֹן, וּגְמִילוּת חֲסָדִים, וְתַלְמוּד תּוֹרָה: אֵלּוּ דְבָרִים שֶׁאָדָם עוֹשֶׂה אוֹתָם וְאוֹכֵל פֵּרוֹתֵיהֶם בָּעוֹלָם הַזֶּה, וְהַקֶּרֶן קַיֶּמֶת לָעוֹלָם הַבָּא: וְאֵלּוּ הֵן: כִּבּוּד אָב וָאֵם, וּגְמִילוּת חֲסָדִים, וּבִקּוּר חוֹלִים, וְהַכְנָסַת אוֹרְחִים, וְהַשְׁכָּמַת בֵּית הַכְּנֶסֶת, וַהֲבָאַת שָׁלוֹם בֵּין אָדָם לַחֲבֵרוֹ וּבֵין אִישׁ לְאִשְׁתוֹ וְתַלְמוּד תּוֹרָה כְּנֶגֶד כֻּלָּם. "));
  parts.push(p("<b>לְעוֹלָם</b> יְהֵא אָדָם יְרֵא שָׁמַיִם בַּסֵּתֶר כְּבַגָּלוּי, וּמוֹדֶה עַל הָאֱמֶת, וְדוֹבֵר אֱמֶת בִּלְבָבוֹ, וְיַשְׁכִּים וְיֹאמַר: רִבּוֹן הָעוֹלָמִים וַאֲדוֹנֵי הָאֲדוֹנִים, לֹא עַל צִּדְקוֹתֵינוּ אֲנַחְנוּ מַפִּילִים תַּחֲנוּנֵינוּ לְפָנֶיךָ כִּי עַל רַחֲמֶיךָ הָרַבִּים: אֲדֹנָ֤י ׀ שְׁמָ֙עָה֙ אֲדֹנָ֣י ׀ סְלָ֔חָה אֲדֹנָ֛י הַֽקְשִׁ֥יבָה וַעֲשֵׂ֖ה אַל־תְּאַחַ֑ר לְמַֽעַנְךָ֣ אֱלֹהַ֔י כִּֽי־שִׁמְךָ֣ נִקְרָ֔א עַל־עִירְךָ֖ וְעַל־עַמֶּֽךָ׃ מָה אֲנַחְנוּ, מַה חַיֵּינוּ, מַה חַסְדֵנוּ, מַה־צִּדְקוֹתֵינוּ, מַה־כֹּחֵנוּ, מַה־גְּבוּרָתֵנוּ. מַה נֹּאמַר לְפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, הֲלֹא כָּל־הַגִבּוֹרִים כְּאַיִן לְפָנֶיךָ, וְאַנְשֵׁי הַשֵּׁם כְּלֹא הָיוּ, וַחֲכָמִים כִּבְלִי מַדָּע, וּנְבוֹנִים כִּבְלִי הַשְׂכֵּל, כִּי כָל־מַעֲשֵֽׂינוּ תֹֽהוּ, וִימֵי חַיֵּינוּ הֶבֶֶל לְפָנֶיךָ, וּמוֹתַ֨ר הָאָדָ֤ם מִן־הַבְּהֵמָה֙ אָ֔יִן כִּ֥י הַכֹּ֖ל הָֽבֶל׃ לְבַד הַנְּשָׁמָה הַטְּהוֹרָה שֶׁהִיא עֲתִידָה לִתֵּן דִּין וְחֶשְׁבּוֹן לִפְנֵי כִסֵּא כְבוֹדֶךָ. וְכָל־הַגּוֹיִם כְּאַיִן נֶגְדֶּךָ, שֶׁנֶּאֱמַר: הֵ֤ן גּוֹיִם֙ כְּמַ֣ר מִדְּלִ֔י וּכְשַׁ֥חַק מֹאזְנַ֖יִם נֶחְשָׁ֑בוּ הֵ֥ן אִיִּ֖ים כַּדַּ֥ק יִטּֽוֹל׃ אֲבָל אֲנַחְנוּ עַמְּךָ בְּנֵי בְרִיתֶךָ, בְּנֵי אַבְרָהָם אֹהֲבֶךָ שֶׁנִּשְׁבַּעְתָּ־לוֹ בְּהַר הַמּוֹרִיָּה, זֶרַע יִצְחָק עֲקֵדֶךָ שֶׁנֶּעֱקַד עַל־גַּבֵּי הַמִּזְבֵּחַ, עֲדַת יַעֲקֹב בִּנְךָ בְכוֹרֶךָ, שֶׁמֵּאַהֲבָתְךָ שֶׁאָהַבְתָּ אוֹתוֹ, וּמִשִּׂמְחָתְךָ שֶׁשָּׂמַחְתָּ־בּוֹ, קָרָאתָ אוֹתוֹ יִשְׂרָאֵל וִישֻׁרוּן: "));
  parts.push(p("<b>לְפִיכָךְ</b> אֲנַחְנוּ חַיָּבִים לְהוֹדוֹת לָךְ, וּלְשַׁבְּחָךְ וּלְפָאֲרָךְ וּלְרוֹמְמָךְ, וְלִתֵּן שִׁיר שֶׁבַח וְהוֹדָאָה לְשִׁמְךָ הַגָּדוֹל בְּכָל יוֹם תָּמִיד. אַשְׁרֵינוּ, מַה טוֹב חֶלְקֵינוּ, וּמַה נָעִים גּוֹרָלֵנוּ, וּמַה יָפָה מְאוֹד יְרוּשָׁתֵינוּ, אַשְׁרֵינוּ כְּשֶׁאֲנַחְנוּ מַשְׁכִּימִים וּמַעֲרִיבִים בְּבָתֵּי כְּנֵסִיּוֹת וּבְבָתֵּי מִדְרָשׁוֹת וּמְיַחֲדִים שִׁמְךָ בְּכָל יוֹם תָּמִיד אוֹמְרִים פַּעֲמַיִם בְּאַהֲבָה: "));
  parts.push(p("<small>כשיגיע לקריאת שמע קודם פרשת התמיד יזהר לומר פסוקים שמע ישראל וברוך בכונה גדולה כמו קריאת שמע דיוצר <small>(בא\"ח מקץ ה\"ז)</small>, ואם רואה שזמן קריאת שמע עובר יאמר כאן קריאת שמע כולה</small> "));
  parts.push(p("<b>שְׁמַ֖<big>ע</big> יִשְׂרָאֵ֑ל יְהֹוָ֥ה אֱלֹהֵ֖ינוּ יְהֹוָ֥ה ׀ אֶחָֽ<big>ד</big></b>׃"));
  parts.push(p("<small><small>ואומר בלחש</small> בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:</small> "));
  parts.push(p("<b>אַתָּה</b> הוּא אֶחָד קוֹדֵם שֶׁבָּרָאתָ הָעוֹלָם, וְאַתָּה הוּא אֶחָד לְאַחַר שֶׁבָּרָאתָ הָעוֹלָם, אַתָּה הוּא אֵל בָּעוֹלָם הַזֶּה, וְאַתָּה הוּא אֵל בָּעוֹלָם הַבָּא, וְאַתָּה־ה֑וּא וּ֝שְׁנוֹתֶ֗יךָ לֹ֣א יִתָּֽמּוּ׃ קַדֵּשׁ שְׁמָךְ בְּעוֹלָמָךְ עַל־עַם מְקַדְּשֵׁי שְׁמֶךָ, וּבִישׁוּעָתְךָ מַלְכֵּנוּ תָּרוּם וְתַגְבִּיהַּ קַרְנֵנוּ, וְתוֹשִׁיעֵנוּ בְּקָרוֹב לְמַעַן שְׁמֶךָ, בָּרוּךְ הַמְקַדֵּשׁ שְׁמוֹ בָּרַבִּים: "));
  parts.push(p("<b>אַתָּה</b> הוּא יְהֹוָה הָאֱלֹהִים בַּשָּׁמַיִם מִמַּעַל וְעַל־הָאָרֶץ מִתַּחַת, בִּשְׁמֵי הַשָּׁמַיִם הָעֶלְיוֹנִים וְהַתַּחְתּוֹנִים, אַתָּה הוּא רִאשׁוֹן וְאַתָּה הוּא אַחֲרוֹן וּמִבַּלְעָדֶיךָ אֵין אֱלֹהִים. קַבֵּץ נְפוּצוֹת קֹוֶיךָ מֵאַרְבַּע כַּנְפוֹת הָאָרֶץ. יַכִּירוּ וְיֵדְעוּ כָּל בָּאֵי עוֹלָם כִּי אַתָּה הוּא הָאֱלֹהִים לְבַדְּךָ לְכָל מַמְלְכוֹת הָאָרֶץ, אַתָּה עָשִׂיתָ אֶת הַשָּׁמַיִם וְאֶת הָאָרֶץ, אֶת הַיָּם וְאֶת כָּל אֲשֶׁר בָּם, וּמִי בְּכָל מַעֲשֵׂה יָדֶיךָ בָּעֶלְיוֹנִים וּבַתַּחְתּוֹנִים שֶׁיֹּאמַר לָךְ מַה־תַּעֲשֶׂה וּמַה־תִּפְעָל. אָבִינוּ שֶׁבַּשָּׁמַיִם חַי וְקַיָּם, עֲשֵׂה עִמָּנוּ חֶסֶד בַּעֲבוּר כְּבוֹד שִׁמְךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא שֶׁנִּקְרָא עָלֵינוּ, וְקַיֵּם לָנוּ יְהֹוָה אֱלֹהֵינוּ אֶת הַדָּבָר שֶׁהִבְטַחְתָּנוּ עַל יְדֵי צְפַנְיָה חוֹזָךְ כָּאָמוּר: בָּעֵ֤ת הַהִיא֙ אָבִ֣יא אֶתְכֶ֔ם וּבָעֵ֖ת קַבְּצִ֣י אֶתְכֶ֑ם כִּֽי־אֶתֵּ֨ן אֶתְכֶ֜ם לְשֵׁ֣ם וְלִתְהִלָּ֗ה בְּכֹל֙ עַמֵּ֣י הָאָ֔רֶץ בְּשׁוּבִ֧י אֶת־שְׁבוּתֵיכֶ֛ם לְעֵינֵיכֶ֖ם אָמַ֥ר יְהֹוָֽה: "));
  parts.push(p("<b>יְהִי רָצוֹן</b> מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ שֶׁתְּרַחֵם עָלֵינוּ, וְתִמְחוֹל לָנוּ אֶת כָּל חַטְּאוֹתֵינוּ, וּתְכַפֵּר לָנוּ אֶת־כָּל־עֲוֹנוֹתֵינוּ, וְתִמְחוֹל וְתִסְלַח לְכָל פְּשָׁעֵינוּ, וְתִּבְנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵינוּ, וְנַקְרִיב לְפָנֶיךָ קָרְבַּן הַתָּמִיד שֶׁיְּכַפֵּר בַּעֲדֵינוּ, כְּמוֹ שֶׁכָּתַבְתָּ עָלֵינוּ בְּתוֹרָתָךְ עַל יְדֵי מֹשֶׁה עַבְדָּךְ כָּאָמוּר: "));
  parts.push(p("<b>וַיְדַבֵּ֥ר</b> יְהֹוָ֖ה אֶל־מֹשֶׁ֥ה לֵּאמֹֽר׃ צַ֚ו אֶת־בְּנֵ֣י יִשְׂרָאֵ֔ל וְאָמַרְתָּ֖ אֲלֵהֶ֑ם אֶת־קׇרְבָּנִ֨י לַחְמִ֜י לְאִשַּׁ֗י רֵ֚יחַ נִֽיחֹחִ֔י תִּשְׁמְר֕וּ לְהַקְרִ֥יב לִ֖י בְּמוֹעֲדֽוֹ׃ וְאָמַרְתָּ֣ לָהֶ֔ם זֶ֚ה הָֽאִשֶּׁ֔ה אֲשֶׁ֥ר תַּקְרִ֖יבוּ לַיהֹוָ֑ה כְּבָשִׂ֨ים בְּנֵֽי־שָׁנָ֧ה תְמִימִ֛ם שְׁנַ֥יִם לַיּ֖וֹם עֹלָ֥ה תָמִֽיד׃ אֶת־הַכֶּ֥בֶשׂ אֶחָ֖ד תַּעֲשֶׂ֣ה בַבֹּ֑קֶר וְאֵת֙ הַכֶּ֣בֶשׂ הַשֵּׁנִ֔י תַּעֲשֶׂ֖ה בֵּ֥ין הָֽעַרְבָּֽיִם׃ וַעֲשִׂירִ֧ית הָאֵיפָ֛ה סֹ֖לֶת לְמִנְחָ֑ה בְּלוּלָ֛ה בְּשֶׁ֥מֶן כָּתִ֖ית רְבִיעִ֥ת הַהִֽין׃ עֹלַ֖ת תָּמִ֑יד הָעֲשֻׂיָה֙ בְּהַ֣ר סִינַ֔י לְרֵ֣יחַ נִיחֹ֔חַ אִשֶּׁ֖ה לַֽיהֹוָֽה׃ וְנִסְכּוֹ֙ רְבִיעִ֣ת הַהִ֔ין לַכֶּ֖בֶשׂ הָאֶחָ֑ד בַּקֹּ֗דֶשׁ הַסֵּ֛ךְ נֶ֥סֶךְ שֵׁכָ֖ר לַיהֹוָֽה׃ וְאֵת֙ הַכֶּ֣בֶשׂ הַשֵּׁנִ֔י תַּעֲשֶׂ֖ה בֵּ֣ין הָֽעַרְבָּ֑יִם כְּמִנְחַ֨ת הַבֹּ֤קֶר וּכְנִסְכּוֹ֙ תַּעֲשֶׂ֔ה אִשֵּׁ֛ה רֵ֥יחַ נִיחֹ֖חַ לַיהֹוָֽה׃ "));
  parts.push(hr);

  // ─────────────────────────── פיטום הקטורת ───────────────────────────
  parts.push(p("<big><b>פטום הקטורת</b></big>"));
  parts.push(p("<b>אַתָּה</b> הוּא יְהֹוָה אֱלֹהֵֽינוּ, שֶׁהִקְטִֽירוּ אֲבוֹתֵֽינוּ לְפָנֶֽיךָ אֶת קְטֹֽרֶת הַסַּמִּים, בִּזְמַן שֶׁבֵּית הַמִּקְדָשׁ קַיָּם, כַּאֲשֶׁר צִוִּֽיתָ אוֹתָם עַל־יַד מֹשֶׁה נְבִיאָךְ, כַּכָּתוּב בְּתֽוֹרָתָךְ:"));
  parts.push(p("<b>וַיֹּ֩אמֶר֩</b> יְהֹוָ֨ה אֶל־מֹשֶׁ֜ה קַח־לְךָ֣ סַמִּ֗ים נָטָ֤ף | וּשְׁחֵ֙לֶת֙ וְחֶלְבְּנָ֔ה סַמִּ֖ים וּלְבֹנָ֣ה זַכָּ֑ה בַּ֥ד בְּבַ֖ד יִהְיֶֽה׃ וְעָשִׂ֤יתָ אֹתָהּ֙ קְטֹ֔רֶת רֹ֖קַח מַעֲשֵׂ֣ה רוֹקֵ֑חַ מְמֻלָּ֖ח טָה֥וֹר קֹֽדֶשׁ׃ וְשָֽׁחַקְתָּ֣ מִמֶּ֘נָּה֮ הָדֵק֒ וְנָתַתָּ֨ה מִמֶּ֜נָּה לִפְנֵ֤י הָעֵדֻת֙ בְּאֹ֣הֶל מוֹעֵ֔ד אֲשֶׁ֛ר אִוָּעֵ֥ד לְךָ֖ שָׁ֑מָּה קֹ֥דֶשׁ קׇֽדָשִׁ֖ים תִּהְיֶ֥ה לָכֶֽם׃ וְנֶֽאֱמַר וְהִקְטִ֥יר עָלָ֛יו אַהֲרֹ֖ן קְטֹ֣רֶת סַמִּ֑ים בַּבֹּ֣קֶר בַּבֹּ֗קֶר בְּהֵיטִיב֛וֹ אֶת־הַנֵּרֹ֖ת יַקְטִירֶֽנָּה: וּבְהַעֲלֹ֨ת אַהֲרֹ֧ן אֶת־הַנֵּרֹ֛ת בֵּ֥ין הָעַרְבַּ֖יִם יַקְטִירֶ֑נָּה קְטֹ֧רֶת תָּמִ֛יד לִפְנֵ֥י יְהֹוָ֖ה לְדֹרֹתֵיכֶֽם: "));
  parts.push(p("<b>תָּנוּ</b> רַבָּנָן: פִּטּוּם הַקְּטֹֽרֶת כֵּיצַד? שְׁלֹשׁ מֵאוֹת וְשִׁשִּׁים וּשְׁמוֹנָה מָנִים הָיוּ בָהּ. שְׁלֹשׁ מֵאוֹת וְשִׁשִּׁים וַֽחֲמִשָּׁה כְּמִנְיַן יְמוֹת הַחַמָּה, מָנֶה בְּכָל־יוֹם, מַֽחֲצִיתוֹ בַּבֹּֽקֶר וּמַֽחֲצִיתוֹ בָּעֶרֶב. וּשְׁלֹשָׁה מָנִים יְתֵרִים, שֶׁמֵּהֶם מַכְנִיס כֹּהֵן גָּדוֹל, וְנוֹטֵל מֵהֶם מְלֹא חָפְנָיו בְּיוֹם הַכִּפּוּרִים, וּמַֽחֲזִירָן לְמַכְתֶּֽשֶׁת בְּעֶֽרֶב יוֹם הַכִּפּוּרִים, כְּדֵי לְקַיֵּם מִצְוַת דַקָּה מִן הַדַּקָּה. וְאַחַד־עָשָׂר סַמָּנִים הָיוּ בָהּ, וְאֵֽלּוּ הֵן: "));
  parts.push(p("<small>א</small> הַצֳּרִי <small>ב</small> וְהַצִּפֹּֽרֶן <small>ג</small> וְהַחֶלְבְּנָה <small>ד</small> וְהַלְּבוֹנָה, מִשְׁקַל שִׁבְעִים שִׁבְעִים מָנֶה. <small>ה</small> מוֹר, <small>ו</small> וּקְצִיעָה <small>ז</small> וְשִׁבֹּֽלֶת נֵרְדְּ <small>ח</small> וְכַרְכֹּם, מִשְׁקַל שִׁשָּׁה עָשָׂר שִׁשָּׁה עָשָׂר מָנֶה. <small>ט</small> קֹשְׁטְ שְׁנֵים עָשָׂר, <small>י</small> קִלּוּפָה שְׁלֹשָׁה, <small>יא</small> קִנָּמוֹן תִּשְׁעָה, בּוֹרִית־כַּרְשִׁינָה תִּשְׁעָה קַבִּין. יֵין קַפְרִיסִין סְאִין תְּלָת וְקַבִּין תְּלָתָא. וְאִם לֹא מָצָא יֵין קַפְרִיסִין, מֵבִיא חֲמַר חִיוָר עַתִּיק. מֶֽלַח סְדוֹמִית, רֽוֹבַע. מַעֲלֶה עָשָׁן, כָּל־שֶׁהוּא. רִבִּי נָתָן הַבַּבְלִי אוֹמֵר: אַף כִּפַּת הַיַּרְדֵּן כָּל־שֶׁהִיא, אִם נָתַן בָּהּ דְּבַשׁ פְּסָלָהּ, וְאִם חִסֵּר אַחַת מִכָּל־סַמְמָנֶֽיהָ, חַיָּיב מִיתָה:"));
  parts.push(p("<b>רַבָּן</b> שִׁמְעוֹן בֶּן־גַּמְלִיאֵל אוֹמֵר: הַצֳּרִי אֵינוֹ אֶלָּא שְׁרָף, הַנּוֹטֵף מֵֽעֲצֵי הַקְּטָף. בֹּרִית כַּרְשִׁינָה, לְמָה הִיא בָֽאָה? כְּדֵי לְשַׁפּוֹת בָּהּ אֶת־הַצִּפֹּֽרֶן, כְּדֵי שֶׁתְּהֵא נָאָה. יֵין קַפְרִיסִין, לְמָה הוּא בָא? כְּדֵי לִשְׁרוֹת בּוֹ אֶת־הַצִּפֹּֽרֶן כְּדֵי שֶׁתְּהֵא עַזָּה. וַהֲלֹא מֵי רַגְלַֽיִם יָפִין לָהּ? אֶלָּא שֶׁאֵין מַכְנִיסִין מֵי רַגְלַֽיִם בַּמִּקְדָּשׁ, מִפְּנֵי הַכָּבוֹד:"));
  parts.push(p("<b>תַּנְיָא</b> רִבִּי נָתָן אוֹמֵר: כְּשֶׁהוּא שׁוֹחֵק, אוֹמֵר: הָדֵק הֵיטֵב, הֵיטֵב הָדֵק. מִפְּנֵי שֶׁהַקּוֹל יָפֶה לַבְּשָׂמִים. פִּטְּמָהּ לַֽחֲצָאִין, כְּשֵׁרָה. לְשָׁלִישׁ וּלְרָבִֽיעַ, לֹא שָׁמַֽעְנוּ. אָמַר רִבִּי יְהוּדָה: זֶה הַכְּלָל, אִם כְּמִדָּתָהּ, כְּשֵׁרָה לַֽחֲצָאִין. וְאִם חִסֵּר אַחַת מִכָּל־סַמְמָנֶֽיהָ, חַיָּיב מִיתָה:"));
  parts.push(p("<b>תָּנֵי</b> בַר־קַפָּרָא: אַחַת לְשִׁשִּׁים אוֹ לְשִׁבְעִים שָׁנָה, הָֽיְתָה בָֽאָה שֶׁל שִׁירַֽיִם לַֽחֲצָאִין. וְעוֹד תָּנֵי בַר־קַפָּרָא: אִלּוּ הָיָה נוֹתֵן בָּהּ קָרְטוֹב שֶׁל דְּבַשׁ, אֵין אָדָם יָכוֹל לַֽעֲמֹד מִפְּנֵי רֵיחָהּ. וְלָֽמָּה אֵין מְעָֽרְבִין בָּהּ דְּבַשׁ? מִפְּנֵי שֶׁהַתּוֹרָה אָֽמְרָה: כִּ֤י כָל־שְׂאֹר֙ וְכָל־דְּבַ֔שׁ לֹֽא־תַקְטִ֧ירוּ מִמֶּ֛נּוּ אִשֶּׁ֖ה לַֽיהֹוָֽה: יְהֹוָ֣ה צְבָא֣וֹת עִמָּ֑נוּ מִשְׂגָּֽב־לָ֨נוּ אֱלֹהֵ֖י יַֽעֲקֹ֣ב סֶֽלָה׃ יְהֹוָ֥ה צְבָא֑וֹת אַֽשְׁרֵ֥י אָ֝דָ֗ם בֹּטֵ֥חַ בָּֽךְ׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: וְעָֽרְבָה֙ לַֽיהֹוָ֔ה מִנְחַ֥ת יְהוּדָ֖ה וִירֽוּשָׁלָ֑‍ִם כִּימֵ֣י עוֹלָ֔ם וּכְשָׁנִ֖ים קַדְמֹנִיֹּֽת: "));
  parts.push(p("<b>אַבַּיֵּי</b> <small>יפסיק מעט</small> הֲוָה מְסַדֵּר סֵדֶר הַמַּעֲרָכָה מִשְּׁמָא דִגְמָרָא, וְאַלִבָּא דְאַבָּא שָׁאוּל. מַעֲרָכָה גְּדוֹלָה קוֹדֶמֶת לְמַעֲרָכָה שְׁנִיָּה שֶׁל קְטֹרֶת, וּמַעֲרָכָה שְׁנִיָּה שֶׁל קְטֹרֶת קוֹדֶמֶת לְסִדּוּר שְׁנֵי גְזִירֵי עֵצִים, וְסִדּוּר שְׁנֵי גְזִירֵי עֵצִים קוֹדֵם לְדִישּׁוּן מִזְבַּח הַפְּנִימִי, וְדִישּׁוּן מִזְבַּח הַפְּנִימִי קוֹדֵם לַהֲטָבַת חָמֵשׁ נֵרוֹת, וַהֲטָבַת חָמֵשׁ נֵרוֹת קוֹדֶמֶת לְדַם הַתָּמִיד, וְדַם הַתָּמִיד קוֹדֵם לַהֲטָבַת שְׁתֵּי נֵרוֹת, וַהֲטָבַת שְׁתֵּי נֵרוֹת קוֹדֶמֶת לִקְטֹרֶת, וּקְטֹרֶת לְאֵבָרִים, וְאֵבָרִים לְמִנְחָה, וּמִנְחָה לַחֲבִיתִּין, וַחֲבִיתִּין לִנְסָכִין, וּנְסָכִין לְמוּסָפִין, וּמוּסָפִין לְבָזִיכִין, וּבָזִיכִין קוֹדְמִין לְתָמִיד שֶׁל בֵּין הָעַרְבָּיִם, שֶׁנֶּאֱמַר: וְעָרַ֤ךְ עָלֶ֙יהָ֙ הָֽעֹלָ֔ה וְהִקְטִ֥יר עָלֶ֖יהָ חֶלְבֵ֥י הַשְּׁלָמִֽים: עָלֶיהָ הַשְׁלֵם כָּל הַקָּרְבָּנוֹת כֻּלָּם: "));
  parts.push(p("אָֽנָּֽא בְּכֹֽחַ. גְּדוּלַת יְמִינֶֽךָ. תַּתִּיר צְרוּרָה: <small>(אב\"ג ית\"ץ)</small>"));
  parts.push(p("קַבֵּל רִנַּת. עַמֶּֽךָ שַׂגְּבֵֽנוּ. טַהֲרֵֽנוּ נוֹרָא: <small>(קר\"ע שט\"ן)</small>"));
  parts.push(p("נָא גִבּוֹר. דּֽוֹרְשֵֽׁי יִחוּדֶֽךָ. כְּבָבַת שָׁמְרֵם: <small>(נג\"ד יכ\"ש)</small>"));
  parts.push(p("בָּֽרְכֵֽם טַהֲרֵם. רַחֲמֵי צִדְקָתֶֽךָ. תָּמִיד גָּמְלֵם: <small>(בט\"ר צת\"ג)</small>"));
  parts.push(p("חֲסִין קָדוֹשׁ. בְּרֹב טֽוּבְךָֽ. נַהֵל עֲדָתֶֽךָ: <small>(חק\"ב טנ\"ע)</small>"));
  parts.push(p("יָחִיד גֵּאֶה. לְעַמְּךָ פְנֵה. זֽוֹכְרֵֽי קְדֻשָּׁתֶֽךָ: <small>(יג\"ל פז\"ק)</small>"));
  parts.push(p("שַׁוְעָתֵֽנוּ קַבֵּל. וּשְׁמַע צַעֲקָתֵֽנוּ. יוֹדֵֽעַ תַּעֲלוּמוֹת: <small>(שק\"ו צי\"ת)</small>"));
  parts.push(p("<small>ואומר בלחש</small> "));
  parts.push(p(" בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:"));
  parts.push(p("<b>רִבּוֹן</b> הָעוֹלָמִים, אַתָּה צִוִיתָנוּ לְהַקְרִיב קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ, וְלִהְיוֹת כֹּהֲנִים בַּעֲבוֹדָתָם, וּלְוִיִּם בְּדוּכָנָם, וְיִשְׂרָאֵל בְּמַעֲמָדָם. וְעַתָּה בַּעֲווֹנוֹתֵינוּ חָרַב בֵּית הַמִּקְדָּשׁ וּבֻטַּל הַתָּמִיד, וְאֵין לָנוּ לֹא כֹּהֵן בַּעֲבוֹדָתוֹ וְלֹא לֵוִי בְּדוּכָנוֹ, וְלֹא יִשְׂרָאֵל בְּמַעֲמָדוֹ, וְאַתָּה אָמַרְתָּ: וּֽנְשַׁלְּמָ֥ה פָרִ֖ים שְׂפָתֵֽינוּ: "));
  parts.push(p("<b>לָכֵן</b> יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁיְּהֵא שִׂיחַ שִׂפְתוֹתֵינוּ זֶה חָשׁוּב וּמְקֻבָּל וּמְרוּצֶה לְפָנֶיךָ כְּאִילוּ הִקְרַבְנוּ קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ וְעָמַדְנוּ עַל מַעֲמָדוֹ, כְּמוֹ שֶׁנֶּאֱמַר: וּֽנְשַׁלְּמָ֥ה פָרִ֖ים שְׂפָתֵֽינוּ׃ וְנֶאֱמַר: וְשָׁחַ֨ט אֹת֜וֹ עַ֣ל יֶ֧רֶךְ הַמִּזְבֵּ֛חַ צָפֹ֖נָה לִפְנֵ֣י יְהֹוָ֑ה וְזָרְק֡וּ בְּנֵי֩ אַהֲרֹ֨ן הַכֹּהֲנִ֧ים אֶת־דָּמ֛וֹ עַל־הַמִּזְבֵּ֖חַ סָבִֽיב: וְנֶאֱמַר: זֹ֣את הַתּוֹרָ֗ה לָֽעֹלָה֙ לַמִּנְחָ֔ה וְלַֽחַטָּ֖את וְלָאָשָׁ֑ם וְלַ֨מִּלּוּאִ֔ים וּלְזֶ֖בַח הַשְּׁלָמִֽים: "));
  parts.push(p("<b>אֵיזֶהוּ</b> מְקוֹמָן שֶׁל זְבָחִים, קָדְשִׁי קָדָשִׁים שְׁחִיטָתָן בַּצָּפוֹן, פַּר וְשָׂעִיר שֶׁל יוֹם הַכִּפּוּרִים שְׁחִיטָתָן בַּצָּפון, וְקִבּוּל דָּמָן בִּכְלֵי שָׁרֵת בַּצָּפוֹן, וְדָמָן טָעוּן הַזָּיָה עַל בֵּין הַבַּדִּים וְעַל הַפָּרֹכֶת וְעַל מִזְבַּח הַזָּהָב. מַתָּנָה אַחַת מֵהֶן מְעַכֶּבֶת. שִׁיְּירֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד מַעֲרָבִי שֶׁל מִזְבֵּחַ הַחִיצוֹן. אִם לֹא נָתַן, לֹא עִכֵּב:"));
  parts.push(p("<b>פָּרִים</b> הַנִּשְׂרָפִים וּשְׂעִירִים הַנִּשְׂרָפִים שְׁחִיטָתָן בַּצָּפוֹן, וְקִבּוּל דָּמָן בִּכְלֵי שָׁרֵת בַּצָּפוֹן, וְדָמָן טָעוּן הַזָּיָה עַל הַפָּרֹכֶת וְעַל מִזְבַּח הַזָּהָב. מַתָּנָה אַחַת מֵהֶן מְעַכֶּבֶת. שִׁיְרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד מַעֲרָבִי שֶׁל מִזְבַּח הַחִיצוֹן. אִם לֹא נָתַן, לֹא עִכֵּב. אֵלּוּ וְאֵלּוּ נִשְׂרָפִין בְּבֵית הַדָּשֶׁן:"));
  parts.push(p("<b>חַטֹּאת</b> הַצִּבּוּר וְהַיָּחִיד. אֵלּוּ הֵן חַטֹּאת הַצִּבּוּר, שְׂעִירֵי רָאשֵׁי חֳדָשִׁים וְשֶׁל מוֹעֲדוֹת, שְׁחִיטָתָן בַּצָּפוֹן, וְקִבּוּל דָּמָן בִּכְלֵי שָׁרֵת בַּצָּפוֹן, וְדָמָן טָעוּן אַרְבַּע מַתָּנוֹת עַל אַרְבַּע קְרָנוֹת, כֵּיצַד, עָלָה בַכֶּבֶשׁ וּפָנָה לַסּוֹבֵב, וּבָא לוֹ לְקֶרֶן דְּרוֹמִית מִזְרָחִית, מִזְרָחִית צְפוֹנִית, צְפוֹנִית מַעֲרָבִית, מַעֲרָבִית דְּרוֹמִית. שְׁיָרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד דְרוֹמִי, וְנֶאֱכָלִין לִפָנִים מִן הַקְּלָעִים לְזִכְרֵי כְהֻנָּה בְּכָל מַאֲכָל לְיוֹם וָלַיְלָה עַד חֲצוֹת: "));
  parts.push(p("<b>הָעוֹלָה</b>, קֹדֶשׁ קָדָשִׁים, שְׁחִיטָתָהּ בַּצָּפוֹן, וְקִבּוּל דָּמָהּ בִּכְלֵי שָׁרֵת בַּצָּפוֹן, וְדָמָהּ טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וּטְעוּנָה הֶפְשֵׁט וְנִתּוּחַ וְכָלִיל לָאִשִּׁים: "));
  parts.push(p("<b>זִבְחֵי</b> שַׁלְמֵי צִבּוּר וַאֲשָׁמוֹת. אֵלּוּ הֵן אֲשָׁמוֹת, אָשָׁם גְּזֵלוֹת, אָשָׁם מְעִילוֹת, אָשָׁם שִׁפְחָה חֲרוּפָה, אָשָׁם נָזִיר, אָשָׁם מְצוֹרָע, אָשָׁם תָּלוּי, שְׁחִיטָתָן בַּצָּפוֹן, וְקִבּוּל דָּמָן בִּכְלִי שָׁרֵת בַּצָּפוֹן, וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין לְפָנִים מִן הַקְּלָעִים לְזִכְרֵי כְהֻנָּה בְּכָל מַאֲכָל לְיוֹם וָלַיְלָה עַד חֲצוֹת: "));
  parts.push(p("<b>הַתּוֹדָה</b> וְאֵיל נָזִיר, קָדָשִׁים קַלִּים, שְׁחִיטָתָן בְּכָל מָקוֹם בָּעֲזָרָה, וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין בְּכָל הָעִיר, לְכָל אָדָם, בְּכָל מַאֲכָל, לְיוֹם וָלַיְלָה עַד חֲצוֹת. הַמּוּרָם מֵהֶם כַּיּוֹצֵא בָהֶם, אֶלָּא שֶׁהַמּוּרָם נֶאֱכָל לַכֹּהֲנִים לִנְשֵׁיהֶם וְלִבְנֵיהֶם וּלְעַבְדֵיהֶם: "));
  parts.push(p("<b>שְׁלָמִים</b>, קָדָשִׁים קַלִּים, שְׁחִיטָתָן בְּכָל מָקוֹם בָּעֲזָרָה, וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין בְּכָל הָעִיר לְכָל אָדָם בְּכָל מַאֲכָל לִשְׁנֵי יָמִים וָלַיְלָה אֶחָד. הַמּוּרָם מֵהֶם כַּיּוֹצֵא בָּהֶם, אֶלָּא שֶׁהַמּוּרָם נֶאֱכָל לַכֹּהֲנִים, לִנְשֵׁיהֶם וְלִבְנֵיהֶם וּלְעַבְדֵיהֶם:"));
  parts.push(p("<b>הַבְּכוֹר</b> וְהַמַּעֲשֵׂר וְהַפֶּסַח, קָדָשִׁים קַלִּים, שְׁחִיטָתָן בְּכָל מָקוֹם בָּעֲזָרָה, וְדָמָן טָעוּן מַתָּנָה אַחַת, וּבִלְבָד שֶׁיִּתֵּן כְּנֶגֶד הַיְסוֹד. שִׁנָּה בַאֲכִילָתָן, הַבְּכוֹר נֶאֱכָל לַכֹּהֲנִים, וְהַמַּעֲשֵׂר לְכָל אָדָם, וְנֶאֱכָלִין בְּכָל הָעִיר בְּכָל מַאֲכָל לִשְׁנֵי יָמִים וָלַיְלָה אֶחָד. הַפֶּסַח אֵינוֹ נֶאֱכָל אֶלָּא בַלַּיְלָה, וְאֵינוֹ נֶאֱכָל אֶלָּא עַד חֲצוֹת, וְאֵינוֹ נֶאֱכָל אֶלָּא לִמְנוּיָו, וְאֵינוֹ נֶאֱכָל אֶלָּא צָלִי: "));
  parts.push(p("<b>רִבִּי</b> יִשְׁמָעֵאל אוֹמֵר: בִּשְׁלֹשׁ עֶשְׂרֵה מִדּוֹת הַתּוֹרָה נִדְרֶשֶׁת: מִקַּל וָחוֹמֶר, מִגְּזֵרָה שָׁוֶה, מִבִּנְיַן אָב וְכָתוּב אֶחָד, וּמִבִּנְיַן אָב וּשְׁנֵי כְתוּבִים, מִכְּלָל וּפְרָט, מִפְּרָט וּכְלָל, כְּלָל וּפְרָט וּכְלָל, אֵי אַתָּה דָן אֶלָּא כְּעֵין הַפְּרָט, מִכְּלָל שֶׁהוּא צָרִיךְ לִפְרָט, וּמִפְּרָט שֶׁהוּא צָרִיךְ לִכְלַל, וְכָל דָּבָר שֶׁהָיָה בִכְלָל וְיָצָא מִן הַכְּלָל לְלַמֵּד, לֹא לְלַמֵּד עַל עַצְמוֹ יָצָא, אֶלָּא לְלַמֵּד עַל הַכְּלָל כֻּלּוֹ יָצָא, וְכָל דָּבָר שֶׁהָיָה בִכְלָל, וְיָצָא לִטְעוֹן טָעוּן אַחֵר שֶׁהוּא כְעִנְיָנוֹ, יָצָא לְהָקֵל וְלֹא לְהַחְמִיר, וְכָל דָּבָר שֶׁהָיָה בִּכְלָל, וְיָצָא לִטְעֹן טָעוּן אַחֵר שֶׁלֹּא כְעִנְיָנוֹ, יָצָא לְהָקֵל וּלְהַחְמִיר, וְכָל דָּבָר שֶׁהָיָה בִּכְלָל, וְיָצָא לִדּוֹן בְּדָבָר חָדָשׁ, אֵי אַתָּה יָכוֹל לְהַחֲזִירוֹ לִכְלָלוֹ עַד שֶׁיַּחֲזִירֶנּוּ הַכָּתוּב לִכְלָלוֹ בְפֵירוּשׁ, וְדָבָר הַלָּמֵד מֵעִנְיָנוֹ, וְדָבָר הַלָּמֵד מִסּוֹפוֹ, וְכַן שְׁנֵי כְתוּבִים הַמַּכְחִישִׁים זֶה אֶת זֶה, עַד שֶׁיָּבֹא הַכָּתוּב הַשְּׁלִישִׁי וְיַכְרִיעַ בְּנֵיהֶם: "));
  parts.push(p("<b>יְהוּדָה</b> בֶּן תֵּימָא אוֹמֵר, הֱוֵי עַז כַּנָּמֵר, וְקַל כַּנֶּשֶׁר, וְרָץ כַּצְּבִי, וְגִבּוֹר כַּאֲרִי לַעֲשׂוֹת רְצוֹן אָבִיךָ שֶׁבַּשָּׁמַיִם. הוּא הָיָה אוֹמֵר, עַז פָּנִים לַגֵּיהִנָּם, וּבוֹשֶׁת פָּנִים לְגַן עֵדֶן: "));
  parts.push(p("<b>יְהִי </b> רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתִּבְנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵינוּ, וְתֵן חֶלְקֵנוּ בְּתוֹרָתָךְ, לַעֲשׂוֹת חֻקֵּי רְצוֹנָךְ, וּלְעָבְדָךְ בְּלֵבָב שָׁלֵם: "));
  parts.push(p("<small>ואומרים כאן קדיש \"על ישראל\"</small>"));
  parts.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל־בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>עַל</b> יִשְׂרָאֵל וְעַל רַבָּנָן. וְעַל תַּלְמִידֵיהוֹן וְעַל כָּל תַּלְמִידֵי תַלְמִידֵיהוֹן. דְּעָסְקִין בְּאוֹרַיְתָא קַדִּשְׁתָּא. דִּי בְאַתְרָא הָדֵין וְדִי בְכָל אֲתַר וַאֲתַר. יְהֵא לָנָא וּלְהוֹן וּלְכוֹן חִנָּא וְחִסְדָּא וְרַחֲמֵי. מִן קֳדָם מָארֵי שְׁמַיָּא וְאַרְעָא וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>יְהֵא</b> שְׁלָמָא רַבָּא מִן שְׁמַיָּא. חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה. וְשֵׁיזָבָא וּרְפוּאָה וּגְאוּלָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה לָנוּ וּלְכָל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small><br><br><b><small>עוֹשֶׂה</small></b><small> שָׁלוֹם בִּמְרוֹמָיו. הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(hr);

  // ─────────────────────────── הודו ───────────────────────────
  parts.push(p("<big><b>הודו</b></big>"));
  parts.push(p("<b>הוֹד֤וּ</b> לַֽיהֹוָה֙ קִרְא֣וּ בִשְׁמ֔וֹ\tהוֹדִ֥יעוּ בָעַמִּ֖ים עֲלִילֹתָֽיו׃ שִׁ֤ירוּ לוֹ֙ זַמְּרוּ־ל֔וֹ שִׂ֖יחוּ בְּכׇל־נִפְלְאֹתָֽיו׃ הִֽתְהַלְלוּ֙ בְּשֵׁ֣ם קׇדְשׁ֔וֹ יִשְׂמַ֕ח לֵ֖ב מְבַקְשֵׁ֥י יְהֹוָֽה׃ דִּרְשׁ֤וּ יְהֹוָה֙ וְעֻזּ֔וֹ בַּקְּשׁ֥וּ פָנָ֖יו תָּמִֽיד׃ זִכְר֗וּ נִפְלְאֹתָיו֙ אֲשֶׁ֣ר עָשָׂ֔ה מֹפְתָ֖יו וּמִשְׁפְּטֵי־פִֽיהוּ׃ זֶ֚רַע יִשְׂרָאֵ֣ל עַבְדּ֔וֹ בְּנֵ֥י יַעֲקֹ֖ב בְּחִירָֽיו: ה֚וּא יְהֹוָ֣ה אֱלֹהֵ֔ינוּ בְּכׇל־הָאָ֖רֶץ מִשְׁפָּטָֽיו׃ זִכְר֤וּ לְעוֹלָם֙ בְּרִית֔וֹ דָּבָ֥ר צִוָּ֖ה לְאֶ֥לֶף דּֽוֹר׃ אֲשֶׁ֤ר כָּרַת֙ אֶת־אַבְרָהָ֔ם וּשְׁבוּעָת֖וֹ לְיִצְחָֽק׃ וַיַּעֲמִידֶ֤הָ לְיַֽעֲקֹב֙ לְחֹ֔ק לְיִשְׂרָאֵ֖ל בְּרִ֥ית עוֹלָֽם׃ לֵאמֹ֗ר לְךָ֙ אֶתֵּ֣ן אֶֽרֶץ־כְּנָ֔עַן חֶ֖בֶל נַחֲלַתְכֶֽם׃ בִּהְיֽוֹתְכֶם֙ מְתֵ֣י מִסְפָּ֔ר כִּמְעַ֖ט וְגָרִ֥ים בָּֽהּ׃ וַיִּֽתְהַלְּכוּ֙ מִגּ֣וֹי אֶל־גּ֔וֹי וּמִמַּמְלָכָ֖ה אֶל־עַ֥ם אַחֵֽר׃ לֹֽא־הִנִּ֤יחַ לְאִישׁ֙ לְעׇשְׁקָ֔ם וַיּ֥וֹכַח עֲלֵיהֶ֖ם מְלָכִֽים׃ אַֽל־תִּגְּעוּ֙ בִּמְשִׁיחָ֔י וּבִנְבִיאַ֖י אַל־תָּרֵֽעוּ׃"));
  parts.push(p("<b>שִׁ֤ירוּ</b> לַֽיהֹוָה֙ כׇּל־הָאָ֔רֶץ בַּשְּׂר֥וּ מִיּֽוֹם־אֶל־י֖וֹם יְשׁוּעָתֽוֹ׃ סַפְּר֤וּ בַגּוֹיִם֙ אֶת־כְּבוֹד֔וֹ בְּכׇל־הָעַמִּ֖ים נִפְלְאֹתָֽיו׃ כִּי֩ גָד֨וֹל יְהֹוָ֤ה וּמְהֻלָּל֙ מְאֹ֔ד וְנוֹרָ֥א ה֖וּא עַל־כׇּל־אֱלֹהִֽים׃ כִּ֠י כׇּל־אֱלֹהֵ֤י הָֽעַמִּים֙ אֱלִילִ֔ים <small>יפסיק מעט</small> וַיהֹוָ֖ה שָׁמַ֥יִם עָשָֽׂה׃ ה֤וֹד וְהָדָר֙ לְפָנָ֔יו עֹ֥ז וְחֶדְוָ֖ה בִּמְקֹמֽוֹ׃ הָב֤וּ לַֽיהֹוָה֙ מִשְׁפְּח֣וֹת עַמִּ֔ים הָב֥וּ לַיהֹוָ֖ה כָּב֥וֹד וָעֹֽז׃ הָב֥וּ לַֽיהֹוָ֖ה כְּב֣וֹד שְׁמ֑וֹ שְׂא֤וּ מִנְחָה֙ וּבֹ֣אוּ לְפָנָ֔יו הִשְׁתַּחֲו֥וּ לַֽיהֹוָ֖ה בְּהַדְרַת־קֹֽדֶשׁ׃ חִ֤ילוּ מִלְּפָנָיו֙ כׇּל־הָאָ֔רֶץ אַף־תִּכּ֥וֹן תֵּבֵ֖ל בַּל־תִּמּֽוֹט׃ יִשְׂמְח֤וּ הַשָּׁמַ֙יִם֙ וְתָגֵ֣ל הָאָ֔רֶץ וְיֹאמְר֥וּ בַגּוֹיִ֖ם יְהֹוָ֥ה מָלָֽךְ׃ יִרְעַ֤ם הַיָּם֙ וּמְלוֹא֔וֹ יַעֲלֹ֥ץ הַשָּׂדֶ֖ה וְכׇל־אֲשֶׁר־בּֽוֹ׃ אָ֥ז יְרַנְּנ֖וּ עֲצֵ֣י הַיָּ֑עַר מִלִּפְנֵ֣י יְהֹוָ֔ה כִּי־בָ֖א לִשְׁפּ֥וֹט אֶת־הָאָֽרֶץ׃ הוֹד֤וּ לַֽיהֹוָה֙ כִּ֣י ט֔וֹב כִּ֥י לְעוֹלָ֖ם חַסְדּֽוֹ׃ וְאִמְר֕וּ הוֹשִׁיעֵ֙נוּ֙ אֱלֹהֵ֣י יִשְׁעֵ֔נוּ וְקַבְּצֵ֥נוּ וְהַצִּילֵ֖נוּ מִן־הַגּוֹיִ֑ם לְהֹדוֹת֙ לְשֵׁ֣ם קׇדְשֶׁ֔ךָ לְהִשְׁתַּבֵּ֖חַ בִּתְהִלָּתֶֽךָ׃ בָּר֤וּךְ יְהֹוָה֙ אֱלֹהֵ֣י יִשְׂרָאֵ֔ל מִן־הָעוֹלָ֖ם וְעַ֣ד הָעֹלָ֑ם וַיֹּאמְר֤וּ כׇל־הָעָם֙ אָמֵ֔ן וְהַלֵּ֖ל לַיהֹוָֽה׃ "));
  parts.push(p("<b>רוֹמְמ֡וּ</b> יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְֽ֭הִשְׁתַּחֲווּ לַהֲדֹ֥ם רַגְלָ֗יו קָד֥וֹשׁ הֽוּא: רוֹמְמ֡וּ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְֽ֭הִשְׁתַּחֲווּ לְהַ֣ר קׇדְשׁ֑וֹ כִּי־קָ֝ד֗וֹשׁ יְהֹוָ֥ה אֱלֹהֵֽינוּ: וְה֤וּא רַח֨וּם ׀ יְכַפֵּ֥ר עָוֺן֮ וְֽלֹא־יַֽ֫שְׁחִ֥ית וְ֭הִרְבָּה לְהָשִׁ֣יב אַפּ֑וֹ וְלֹא־יָ֝עִ֗יר כׇּל־חֲמָתֽוֹ׃ אַתָּ֤ה יְהֹוָ֗ה לֹֽא־תִכְלָ֣א רַחֲמֶ֣יךָ מִמֶּ֑נִּי חַסְדְּךָ֥ וַ֝אֲמִתְּךָ֗ תָּמִ֥יד יִצְּרֽוּנִי: זְכֹר־רַחֲמֶ֣יךָ יְ֭הֹוָה וַחֲסָדֶ֑יךָ כִּ֖י מֵעוֹלָ֣ם הֵֽמָּה: תְּנ֥וּ עֹ֗ז לֵאלֹ֫הִ֥ים עַֽל־יִשְׂרָאֵ֥ל גַּאֲוָת֑וֹ וְ֝עֻזּ֗וֹ בַּשְּׁחָקִֽים: נ֤וֹרָ֥א אֱלֹהִ֗ים מִֽמִּקְדָּ֫שֶׁ֥יךָ אֵ֤ל יִשְׂרָאֵ֗ל ה֤וּא נֹתֵ֨ן ׀ עֹ֖ז וְתַעֲצֻמ֥וֹת לָעָ֗ם בָּר֥וּךְ אֱלֹהִֽים:  "));
  parts.push(p("<b>אֵל־נְקָמ֥וֹת</b> יְהֹוָ֑ה אֵ֖ל נְקָמ֣וֹת הוֹפִֽיעַ: הִ֭נָּשֵׂא שֹׁפֵ֣ט הָאָ֑רֶץ הָשֵׁ֥ב גְּ֝מ֗וּל עַל־גֵּאִֽים: לַֽיהֹוָ֥ה הַיְשׁוּעָ֑ה עַֽל־עַמְּךָ֖ בִרְכָתֶ֣ךָ סֶּֽלָה: יְהֹוָ֣ה צְבָא֣וֹת עִמָּ֑נוּ מִשְׂגָּֽב־לָ֨נוּ אֱלֹהֵ֖י יַֽעֲקֹ֣ב סֶֽלָה׃ יְהֹוָ֥ה צְבָא֑וֹת אַֽשְׁרֵ֥י אָ֝דָ֗ם בֹּטֵ֥חַ בָּֽךְ׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: הוֹשִׁ֤יעָה ׀ אֶת־עַמֶּ֗ךָ וּבָרֵ֥ךְ אֶת־נַחֲלָתֶ֑ךָ וּֽרְעֵ֥ם וְ֝נַשְּׂאֵ֗ם עַד־הָעוֹלָֽם: נַ֭פְשֵׁנוּ חִכְּתָ֣ה לַֽיהֹוָ֑ה עֶזְרֵ֖נוּ וּמָגִנֵּ֣נוּ הֽוּא: כִּי־ב֭וֹ יִשְׂמַ֣ח לִבֵּ֑נוּ כִּ֤י בְשֵׁ֖ם קׇדְשׁ֣וֹ בָטָֽחְנוּ: יְהִי־חַסְדְּךָ֣ יְהֹוָ֣ה עָלֵ֑ינוּ כַּ֝אֲשֶׁ֗ר יִחַ֥לְנוּ לָֽךְ: הַרְאֵ֣נוּ יְהֹוָ֣ה חַסְדֶּ֑ךָ וְ֝יֶשְׁעֲךָ֗ תִּתֶּן־לָֽנוּ: ק֭וּמָֽה עֶזְרָ֣תָה לָּ֑נוּ וּ֝פְדֵ֗נוּ לְמַ֣עַן חַסְדֶּֽךָ: אָֽנֹכִ֨י ׀ יְהֹ֘וָ֤ה אֱלֹהֶ֗יךָ הַֽ֭מַּעַלְךָ מֵאֶ֣רֶץ מִצְרָ֑יִם הַרְחֶב־פִּ֗֝יךָ וַאֲמַלְאֵֽהוּ: אַשְׁרֵ֣י הָ֭עָם שֶׁכָּ֣כָה לּ֑וֹ אַֽשְׁרֵ֥י הָ֝עָ֗ם שֱׁיְהֹוָ֥ה אֱלֹהָֽיו: וַאֲנִ֤י ׀ בְּחַסְדְּךָ֣ בָטַחְתִּי֮ יָ֤גֵ֥ל לִבִּ֗י בִּֽישׁוּעָ֫תֶ֥ךָ אָשִׁ֥ירָה לַֽיהֹוָ֑ה כִּ֖י גָמַ֣ל עָלָֽי: "));
  parts.push(p("<b>אֲרוֹמִמְךָ֣</b> יְ֭הֹוָה כִּ֣י דִלִּיתָ֑נִי וְלֹֽא־שִׂמַּ֖חְתָּ אֹיְבַ֣י לִֽי׃ יְהֹוָ֥ה אֱלֹהָ֑י שִׁוַּ֥עְתִּי אֵ֝לֶ֗יךָ וַתִּרְפָּאֵֽנִי׃ יְֽהֹוָ֗ה הֶעֱלִ֣יתָ מִן־שְׁא֣וֹל נַפְשִׁ֑י חִ֝יִּיתַ֗נִי מיורדי [מִיׇּֽרְדִי]־בֽוֹר׃ זַמְּר֣וּ לַיהֹוָ֣ה חֲסִידָ֑יו וְ֝הוֹד֗וּ לְזֵ֣כֶר קׇדְשֽׁוֹ׃ כִּ֤י רֶ֨גַע ׀ בְּאַפּוֹ֮ חַיִּ֢ים בִּרְצ֫וֹנ֥וֹ בָּ֭עֶרֶב יָלִ֥ין בֶּ֗כִי וְלַבֹּ֥קֶר רִנָּֽה׃ וַ֭אֲנִי אָמַ֣רְתִּי בְשַׁלְוִ֑י בַּל־אֶמּ֥וֹט לְעוֹלָֽם׃ יְֽהֹוָ֗ה בִּרְצוֹנְךָ֮ הֶעֱמַ֢דְתָּה לְֽהַרְרִ֫י עֹ֥ז הִסְתַּ֥רְתָּ פָנֶ֗יךָ הָיִ֥יתִי נִבְהָֽל׃ אֵלֶ֣יךָ יְהֹוָ֣ה אֶקְרָ֑א וְאֶל־אֲ֝דֹנָ֗י אֶתְחַנָּֽן׃ מַה־בֶּ֥צַע בְּדָמִי֮ בְּרִדְתִּ֢י אֶ֫ל שָׁ֥חַת הֲיוֹדְךָ֥ עָפָ֑ר הֲיַגִּ֥יד אֲמִתֶּֽךָ׃ שְׁמַע־יְהֹוָ֥ה וְחׇנֵּ֑נִי יְ֝הֹוָ֗ה הֱֽיֵה־עֹזֵ֥ר לִֽי׃ הָפַ֣כְתָּ מִסְפְּדִי֮ לְמָח֢וֹל לִ֥י פִּתַּ֥חְתָּ שַׂקִּ֑י וַֽתְּאַזְּרֵ֥נִי שִׂמְחָֽה׃ לְמַ֤עַן ׀ יְזַמֶּרְךָ֣ כָ֭בוֹד וְלֹ֣א יִדֹּ֑ם יְהֹוָ֥ה אֱ֝לֹהַ֗י לְעוֹלָ֥ם אוֹדֶֽךָּ: "));
  parts.push(p("<small>בעשרת ימי תשובה והושענא רבה אומרים</small> "));
  parts.push(p("<small>יְהֹוָה֙ ה֣וּא הָאֱלֹהִ֔ים יְהֹוָ֖ה ה֥וּא הָאֱלֹהִֽים׃ <small>שתי פעמים</small></small> "));
  parts.push(p("<small>עומדים ואומרים <small>(בא\"ח ויגש ה\"ב)</small></small> "));
  parts.push(p("<b>יְהֹוָה מֶֽלֶךְ, יְהֹוָה מָלָֽךְ יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד:</b> <small>שתי פעמים</small> "));
  parts.push(p("<b>וְהָיָ֧ה</b> יְהֹוָ֛ה לְמֶ֖לֶךְ עַל־כׇּל־הָאָ֑רֶץ בַּיּ֣וֹם הַה֗וּא יִהְיֶ֧ה יְהֹוָ֛ה אֶחָ֖ד וּשְׁמ֥וֹ אֶחָֽד:  "));
  parts.push(p("<b>הוֹשִׁיעֵ֨נוּ</b> ׀ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְקַבְּצֵנוּ֮ מִֽן־הַגּ֫וֹיִ֥ם לְ֭הֹדוֹת לְשֵׁ֣ם קׇדְשֶׁ֑ךָ לְ֝הִשְׁתַּבֵּ֗חַ בִּתְהִלָּתֶֽךָ: בָּ֤רֽוּךְ יְהֹוָ֨ה אֱלֹהֵ֪י יִשְׂרָאֵ֡ל מִן־הָ֤עוֹלָ֨ם ׀ וְעַ֬ד הָעוֹלָ֗ם וְאָמַ֖ר כׇּל־הָעָ֥ם אָמֵ֗ן הַֽלְלוּיָֽהּ: כֹּ֣ל הַ֭נְּשָׁמָה תְּהַלֵּ֥ל יָ֗הּ הַֽלְלוּיָֽהּ: "));
  parts.push(p("<small>בשבת ממשיכים מזמור השמים מספרים</small> "));
  parts.push(p("<small>טוב לומר מזמור אלהים יחננו ויברכנו בצורת המנורה <small>(בא\"ח ויגש ה\"ד)</small></small> "));
  parts.push(p("<b>לַמְנַצֵּ֥חַ</b> <small>(תהילים ס״ז:א׳-ג׳)</small> בִּנְגִינֹ֗ת מִזְמ֥וֹר שִֽׁיר׃ אֱֽלֹהִ֗ים יְחׇנֵּ֥נוּ וִיבָרְכֵ֑נוּ יָ֤אֵֽר פָּנָ֖יו אִתָּ֣נוּ סֶֽלָה׃ לָדַ֣עַת בָּאָ֣רֶץ דַּרְכֶּ֑ךָ בְּכׇל־גּ֝וֹיִ֗ם יְשׁוּעָתֶֽךָ׃ יוֹד֖וּךָ עַמִּ֥ים ׀ אֱלֹהִ֑ים י֝וֹד֗וּךָ עַמִּ֥ים כֻּלָּֽם׃ יִ֥שְׂמְח֥וּ וִירַנְּנ֗וּ לְאֻ֫מִּ֥ים כִּֽי־תִשְׁפֹּ֣ט עַמִּ֣ים מִישֹׁ֑ר וּלְאֻמִּ֓ים ׀ בָּאָ֖רֶץ תַּנְחֵ֣ם סֶֽלָה׃ יוֹד֖וּךָ עַמִּ֥ים ׀ אֱלֹהִ֑ים י֝וֹד֗וּךָ עַמִּ֥ים כֻּלָּֽם׃ אֶ֭רֶץ נָתְנָ֣ה יְבוּלָ֑הּ יְ֝בָרְכֵ֗נוּ אֱלֹהִ֥ים אֱלֹהֵֽינוּ׃ יְבָרְכֵ֥נוּ אֱלֹהִ֑ים וְיִֽירְא֥וּ א֝וֹת֗וֹ כׇּל־אַפְסֵי־אָֽרֶץ׃ "));
  parts.push(hr);

  // ─────────────────────────── ברוך שאמר / פסוקי דזמרה ───────────────────────────
  parts.push(p("<big><b>פסוקי דזמרה</b></big>"));
  parts.push(p("<small>כיון שהתחיל לומר ברוך שאמר, יאחוז הציציות של שתי כנפות שכנגד פניו, וישארו בידו עד סוף ברוך שאמר, ואז ינשקם ויניחם <small>(בא\"ח ויגש ה\"ז)</small></small><br><b>בָּרוּךְ שֶׁאָמַר</b> וְהָיָה הָעוֹלָם, בָּרוּךְ הוּא, בָּרוּךְ אוֹמֵר וְעוֹשֶׂה, בָּרוּךְ גּוֹזֵר וּמְקַיֵּם, בָּרוּךְ עוֹשֶׂה בְרֵאשִׁית, בָּרוּךְ מְרַחֵם עַל הָאָרֶץ, בָּרוּךְ מְרַחֵם עַל הַבְּרִיּוֹת, בָּרוּךְ מְשַׁלֵּם שָׂכָר טוֹב לִירֵאָיו, בָּרוּךְ חַי לָעַד וְקַיָּם לָנֶצַח, בָּרוּךְ פּוֹדֶה וּמַצִּיל, בָּרוּךְ שְׁמוֹ. בָּרוּךְ אַתָּה יְהֹוָה, אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הָאֵל, אָב הָרַחֲמָן, הַמְהֻלָּל בְּפֶה עַמּוֹ, מְשֻׁבָּח וּמְפֹאָר בִּלְשׁוֹן חֲסִידָיו וַעֲבָדָיו, וּבְשִׁירֵי דָּוִד עַבְדָּךְ נְהַלְלָךְ יְהֹוָה אֱלֹהֵינוּ בִּשְׁבָחוֹת וּבִזְמִירוֹת, וּנְגַדְּלָךְ וּנְשַׁבְּחָךְ וּנְפָאֲרָךְ וְנַמְלִיכָךְ, וְנַזְכִּיר שִׁמְךָ מַלְכֵּנוּ אֱלֹהֵינוּ, יָחִיד חַי הָעוֹלָמִים, מֶלֶךְ מְשֻׁבָּח וּמְפֹאָר עֲדֵי עַד שְׁמוֹ הַגָּדוֹל. בָּרוּךְ אַתָּה יְהֹוָה, מֶלֶךְ מְהֻלָּל בַּתִּשְׁבָּחוֹת:<br><small>אם סיים האדם ברוך שאמר קודם שסיים החזן, יזדרז לומר תיכף מזמור לתודה, ויענה אמן על ברכת החזן <small>(בא\"ח ויגש ה\"ח)</small></small> "));
  parts.push(p("<b>מִזְמ֥וֹר</b> <small>(תהילים ק׳:א׳-ב׳)</small> לְתוֹדָ֑ה הָרִ֥יעוּ לַ֝יהֹוָ֗ה כׇּל־הָאָֽרֶץ׃ עִבְד֣וּ אֶת־יְהֹוָ֣ה בְּשִׂמְחָ֑ה בֹּ֥אוּ לְ֝פָנָ֗יו בִּרְנָנָֽה׃ דְּע֗וּ כִּֽי־יְהֹוָה֮ ה֤וּא אֱלֹ֫הִ֥ים הֽוּא־עָ֭שָׂנוּ ולא [וְל֣וֹ] אֲנַ֑חְנוּ עַ֝מּ֗וֹ וְצֹ֣אן מַרְעִיתֽוֹ׃ בֹּ֤אוּ שְׁעָרָ֨יו ׀ בְּתוֹדָ֗ה חֲצֵרֹתָ֥יו בִּתְהִלָּ֑ה הוֹדוּ־ל֗֝וֹ בָּרְכ֥וּ שְׁמֽוֹ׃ כִּי־ט֣וֹב יְ֭הֹוָה לְעוֹלָ֣ם חַסְדּ֑וֹ וְעַד־דֹּ֥ר וָ֝דֹ֗ר אֱמוּנָתֽוֹ׃ "));
  parts.push(p("<small>שמונה עשרה פסוקים של יהי כבוד, כנגד שמונה עשרה אותיות של ששה צרופי שד\"י <small>(בא\"ח ויגש הי\"א)</small></small> "));
  parts.push(p("<small>ש</small> <b>יְהִ֤י כְב֣וֹד</b> יְהֹוָ֣ה לְעוֹלָ֑ם יִשְׂמַ֖ח יְהֹוָ֣ה בְּמַעֲשָֽׂיו: <small>ד</small> יְהִ֤י שֵׁ֣ם יְהֹוָ֣ה מְבֹרָ֑ךְ מֵ֝עַתָּ֗ה וְעַד־עוֹלָֽם: <small>י</small> מִמִּזְרַח־שֶׁ֥מֶשׁ עַד־מְבוֹא֑וֹ מְ֝הֻלָּ֗ל שֵׁ֣ם יְהֹוָֽה: <small>ש</small> רָ֖ם עַל־כָּל־גּוֹיִ֥ם ׀ יְהֹוָ֑ה עַ֖ל הַשָּׁמַ֣יִם כְּבוֹדֽוֹ: <small>י</small> יְ֭הֹוָה שִׁמְךָ֣ לְעוֹלָ֑ם יְ֝הֹוָ֗ה זִכְרְךָ֥ לְדֹר־וָדֹֽר: <small>ד</small> יְֽהֹוָ֗ה בַּ֭שָּׁמַיִם הֵכִ֣ין כִּסְא֑וֹ וּ֝מַלְכוּת֗וֹ בַּכֹּ֥ל מָשָֽׁלָה: <small>ד</small> יִשְׂמְח֤וּ הַשָּׁמַ֙יִם֙ וְתָגֵ֣ל הָאָ֔רֶץ וְיֹאמְר֥וּ בַגּוֹיִ֖ם יְהֹוָ֥ה מָלָֽךְ: <small>ש</small> יְהֹוָה מֶֽלֶךְ, יְהֹוָה מָלָֽךְ, יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד: <small>י</small> יְהֹוָ֣ה מֶ֭לֶךְ עוֹלָ֣ם וָעֶ֑ד אָבְד֥וּ ג֝וֹיִ֗ם מֵאַרְצֽוֹ: <small>ד</small> יְֽהֹוָ֗ה הֵפִ֥יר עֲצַת־גּוֹיִ֑ם הֵ֝נִ֗יא מַחְשְׁב֥וֹת עַמִּֽים: <small>י</small> רַבּ֣וֹת מַחֲשָׁב֣וֹת בְּלֶב־אִ֑ישׁ וַעֲצַ֥ת יְ֝הֹוָ֗ה הִ֣יא תָקֽוּם: <small>ש</small> עֲצַ֣ת יְ֭הֹוָה לְעוֹלָ֣ם תַּעֲמֹ֑ד מַחְשְׁב֥וֹת לִ֝בּ֗וֹ לְדֹ֣ר וָדֹֽר: <small>י</small> כִּ֤י ה֣וּא אָמַ֣ר וַיֶּ֑הִי הֽוּא־צִ֝וָּ֗ה וַֽיַּעֲמֹֽד: <small>ש</small> כִּי־בָחַ֣ר יְהֹוָ֣ה בְּצִיּ֑וֹן אִ֝וָּ֗הּ לְמוֹשָׁ֥ב לֽוֹ: <small>ד</small> כִּֽי־יַעֲקֹ֗ב בָּחַ֣ר ל֣וֹ יָ֑הּ יִ֝שְׂרָאֵ֗ל לִסְגֻלָּתֽוֹ: <small>י</small> כִּ֤י ׀ לֹא־יִטֹּ֣שׁ יְהֹוָ֣ה עַמּ֑וֹ וְ֝נַחֲלָת֗וֹ לֹ֣א יַעֲזֹֽב: <small>ד</small> וְה֤וּא רַח֨וּם ׀ יְכַפֵּ֥ר עָוֺן֮ וְֽלֹא־יַֽ֫שְׁחִ֥ית וְ֭הִרְבָּה לְהָשִׁ֣יב אַפּ֑וֹ וְלֹא־יָ֝עִ֗יר כׇּל־חֲמָתֽוֹ: <small>ש</small> יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: "));
  parts.push(p("<b>אַ֭שְׁרֵי</b> יוֹשְׁבֵ֣י בֵיתֶ֑ךָ ע֝֗וֹד יְֽהַלְל֥וּךָ סֶּֽלָה: אַשְׁרֵ֣י הָ֭עָם שֶׁכָּ֣כָה לּ֑וֹ אַֽשְׁרֵ֥י הָ֝עָ֗ם שֱׁיְהֹוָ֥ה אֱלֹהָֽיו:"));
  parts.push(p("<b>תְּהִלָּ֗ה לְדָ֫וִ֥ד</b> <small>(תהילים קמ״ה:א׳-ב׳)</small> אֲרוֹמִמְךָ֣ אֱלוֹהַ֣י הַמֶּ֑לֶךְ וַאֲבָרְכָ֥ה שִׁ֝מְךָ֗ לְעוֹלָ֥ם וָעֶֽד׃ בְּכָל־י֥וֹם אֲבָֽרְכֶ֑ךָּ וַאֲהַֽלְלָ֥ה שִׁ֝מְךָ֗ לְעוֹלָ֥ם וָעֶֽד׃ גָּ֘ד֤וֹל יְהֹוָ֣ה וּמְהֻלָּ֣ל מְאֹ֑ד וְ֝לִגְדֻלָּת֗וֹ אֵ֣ין חֵֽקֶר׃ דּ֣וֹר לְ֭דוֹר יְשַׁבַּ֣ח מַעֲשֶׂ֑יךָ וּגְב֖וּרֹתֶ֣יךָ יַגִּֽידוּ׃ הֲ֭דַר כְּב֣וֹד הוֹדֶ֑ךָ וְדִבְרֵ֖י נִפְלְאֹתֶ֣יךָ אָשִֽׂיחָה׃ וֶעֱז֣וּז נֽוֹרְאֹתֶ֣יךָ יֹאמֵ֑רוּ וגדלותיך [וּגְדֻלָּתְךָ֥] אֲסַפְּרֶֽנָּה׃ זֵ֣כֶר רַב־טוּבְךָ֣ יַבִּ֑יעוּ וְצִדְקָתְךָ֥ יְרַנֵּֽנוּ׃ חַנּ֣וּן וְרַח֣וּם יְהֹוָ֑ה אֶ֥רֶךְ אַ֝פַּ֗יִם וּגְדׇל־חָֽסֶד׃ טוֹב־יְהֹוָ֥ה לַכֹּ֑ל וְ֝רַחֲמָ֗יו עַל־כׇּל־מַעֲשָֽׂיו׃ יוֹד֣וּךָ יְ֭הֹוָה כׇּל־מַעֲשֶׂ֑יךָ וַ֝חֲסִידֶ֗יךָ יְבָרְכֽוּכָה׃ כְּב֣וֹד מַלְכוּתְךָ֣ יֹאמֵ֑רוּ וּגְבוּרָתְךָ֥ יְדַבֵּֽרוּ׃ לְהוֹדִ֤יעַ ׀ לִבְנֵ֣י הָ֭אָדָם גְּבוּרֹתָ֑יו וּ֝כְב֗וֹד הֲדַ֣ר מַלְכוּתֽוֹ׃ מַֽלְכוּתְךָ֗ מַלְכ֥וּת כׇּל־עֹלָמִ֑ים וּ֝מֶֽמְשַׁלְתְּךָ֗ בְּכׇל־דּ֥וֹר וָדֹֽר׃ סוֹמֵ֣ךְ יְ֭הֹוָה לְכׇל־הַנֹּפְלִ֑ים וְ֝זוֹקֵ֗ף לְכׇל־הַכְּפוּפִֽים׃ עֵֽינֵי־כֹ֭ל אֵלֶ֣יךָ יְשַׂבֵּ֑רוּ וְאַתָּ֤ה נֽוֹתֵן־לָהֶ֖ם אֶת־אׇכְלָ֣ם בְּעִתּֽוֹ׃ פּוֹתֵ֥חַ אֶת־יָדֶ֑ךָ וּמַשְׂבִּ֖יעַ לְכׇל־חַ֣י רָצֽוֹן׃ צַדִּ֣יק יְ֭הֹוָה בְּכׇל־דְּרָכָ֑יו וְ֝חָסִ֗יד בְּכׇל־מַעֲשָֽׂיו׃ קָר֣וֹב יְ֭הֹוָה לְכׇל־קֹרְאָ֑יו לְכֹ֤ל אֲשֶׁ֖ר יִקְרָאֻ֣הוּ בֶֽאֱמֶֽת׃ רְצוֹן־יְרֵאָ֥יו יַעֲשֶׂ֑ה וְֽאֶת־שַׁוְעָתָ֥ם יִ֝שְׁמַ֗ע וְיוֹשִׁיעֵֽם׃ שׁוֹמֵ֣ר יְ֭הֹוָה אֶת־כׇּל־אֹהֲבָ֑יו וְאֵ֖ת כׇּל־הָרְשָׁעִ֣ים יַשְׁמִֽיד׃ תְּהִלַּ֥ת יְהֹוָ֗ה יְֽדַבֶּ֫ר פִּ֥י וִיבָרֵ֣ךְ כׇּל־בָּ֭שָׂר שֵׁ֥ם קׇדְשׁ֗וֹ לְעוֹלָ֥ם וָעֶֽד׃ וַאֲנַ֤חְנוּ ׀ נְבָ֘רֵ֤ךְ יָ֗הּ מֵעַתָּ֥ה וְעַד־עוֹלָ֗ם הַֽלְלוּיָֽהּ׃ "));
  parts.push(p("<b>הַֽלְלוּיָ֡הּ</b> <small>(תהילים קמ״ו:א׳-ג׳)</small> הַֽלְלִ֥י נַ֝פְשִׁ֗י אֶת־יְהֹוָֽה׃ אֲהַלְלָ֣ה יְהֹוָ֣ה בְּחַיָּ֑י אֲזַמְּרָ֖ה לֵאלֹהַ֣י בְּעוֹדִֽי׃ אַל־תִּבְטְח֥וּ בִנְדִיבִ֑ים בְּבֶן־אָדָ֓ם ׀ שֶׁ֤אֵ֖ין ל֥וֹ תְשׁוּעָֽה׃ תֵּצֵ֣א ר֭וּחוֹ יָשֻׁ֣ב לְאַדְמָת֑וֹ בַּיּ֥וֹם הַ֝ה֗וּא אָבְד֥וּ עֶשְׁתֹּֽנֹתָֽיו׃ אַשְׁרֵ֗י שֶׁ֤אֵ֣ל יַעֲקֹ֣ב בְּעֶזְר֑וֹ שִׂ֝בְר֗וֹ עַל־יְהֹוָ֥ה אֱלֹהָֽיו׃ עֹשֶׂ֤ה ׀ שָׁ֘מַ֤יִם וָאָ֗רֶץ אֶת־הַיָּ֥ם וְאֶת־כׇּל־אֲשֶׁר־בָּ֑ם הַשֹּׁמֵ֖ר אֱמֶ֣ת לְעוֹלָֽם׃ עֹשֶׂ֤ה מִשְׁפָּ֨ט ׀ לָעֲשׁוּקִ֗ים נֹתֵ֣ן לֶ֭חֶם לָרְעֵבִ֑ים יְ֝הֹוָ֗ה מַתִּ֥יר אֲסוּרִֽים׃ יְהֹוָ֤ה ׀ פֹּ֘קֵ֤חַ עִוְרִ֗ים יְ֭הֹוָה זֹקֵ֣ף כְּפוּפִ֑ים יְ֝הֹוָ֗ה אֹהֵ֥ב צַדִּיקִֽים׃ יְהֹוָ֤ה ׀ שֹׁ֘מֵ֤ר אֶת־גֵּרִ֗ים יָת֣וֹם וְאַלְמָנָ֣ה יְעוֹדֵ֑ד וְדֶ֖רֶךְ רְשָׁעִ֣ים יְעַוֵּֽת׃ יִמְלֹ֤ךְ יְהֹוָ֨ה ׀ לְעוֹלָ֗ם אֱלֹהַ֣יִךְ צִ֭יּוֹן לְדֹ֥ר וָדֹ֗ר הַֽלְלוּיָֽהּ׃ "));
  parts.push(p("<b>הַ֥לְלוּיָ֨הּ</b> ׀ <small>(תהילים קמ״ז:א׳-ב׳)</small> כִּי־ט֭וֹב זַמְּרָ֣ה אֱלֹהֵ֑ינוּ כִּי־נָ֝עִ֗ים נָאוָ֥ה תְהִלָּֽה׃ בּוֹנֵ֣ה יְרֽוּשָׁלַ֣‍ִם יְהֹוָ֑ה נִדְחֵ֖י יִשְׂרָאֵ֣ל יְכַנֵּֽס׃ הָ֭רֹפֵא לִשְׁב֣וּרֵי לֵ֑ב וּ֝מְחַבֵּ֗שׁ לְעַצְּבוֹתָֽם׃ מוֹנֶ֣ה מִ֭סְפָּר לַכּוֹכָבִ֑ים לְ֝כֻלָּ֗ם שֵׁמ֥וֹת יִקְרָֽא׃ גָּד֣וֹל אֲדוֹנֵ֣ינוּ וְרַב־כֹּ֑חַ לִ֝תְבוּנָת֗וֹ אֵ֣ין מִסְפָּֽר׃ מְעוֹדֵ֣ד עֲנָוִ֣ים יְהֹוָ֑ה מַשְׁפִּ֖יל רְשָׁעִ֣ים עֲדֵי־אָֽרֶץ׃ עֱנ֣וּ לַֽיהֹוָ֣ה בְּתוֹדָ֑ה זַמְּר֖וּ לֵאלֹהֵ֣ינוּ בְכִנּֽוֹר׃ הַֽמְכַסֶּ֬ה שָׁמַ֨יִם ׀ בְּעָבִ֗ים הַמֵּכִ֣ין לָאָ֣רֶץ מָטָ֑ר הַמַּצְמִ֖יחַ הָרִ֣ים חָצִֽיר׃ נוֹתֵ֣ן לִבְהֵמָ֣ה לַחְמָ֑הּ לִבְנֵ֥י עֹ֝רֵ֗ב אֲשֶׁ֣ר יִקְרָֽאוּ׃ לֹ֤א בִגְבוּרַ֣ת הַסּ֣וּס יֶחְפָּ֑ץ לֹא־בְשׁוֹקֵ֖י הָאִ֣ישׁ יִרְצֶֽה׃ רוֹצֶ֣ה יְ֭הֹוָה אֶת־יְרֵאָ֑יו אֶת־הַֽמְיַחֲלִ֥ים לְחַסְדּֽוֹ׃ שַׁבְּחִ֣י יְ֭רוּשָׁלַ‍ִם אֶת־יְהֹוָ֑ה הַֽלְלִ֖י אֱלֹהַ֣יִךְ צִיּֽוֹן׃ כִּֽי־חִ֭זַּק בְּרִיחֵ֣י שְׁעָרָ֑יִךְ בֵּרַ֖ךְ בָּנַ֣יִךְ בְּקִרְבֵּֽךְ׃ הַשָּׂם־גְּבוּלֵ֥ךְ שָׁל֑וֹם חֵ֥לֶב חִ֝טִּ֗ים יַשְׂבִּיעֵֽךְ׃ הַשֹּׁלֵ֣חַ אִמְרָת֣וֹ אָ֑רֶץ עַד־מְ֝הֵרָ֗ה יָר֥וּץ דְּבָרֽוֹ׃ הַנֹּתֵ֣ן שֶׁ֣לֶג כַּצָּ֑מֶר כְּ֝פ֗וֹר כָּאֵ֥פֶר יְפַזֵּֽר׃ מַשְׁלִ֣יךְ קַֽרְח֣וֹ כְפִתִּ֑ים לִפְנֵ֥י קָ֝רָת֗וֹ מִ֣י יַעֲמֹֽד׃ יִשְׁלַ֣ח דְּבָר֣וֹ וְיַמְסֵ֑ם יַשֵּׁ֥ב ר֝וּח֗וֹ יִזְּלוּ־מָֽיִם׃ מַגִּ֣יד דְּבָרָ֣ו לְיַעֲקֹ֑ב חֻקָּ֥יו וּ֝מִשְׁפָּטָ֗יו לְיִשְׂרָאֵֽל׃ לֹ֘א עָ֤שָׂה כֵ֨ן ׀ לְכׇל־גּ֗וֹי וּמִשְׁפָּטִ֥ים בַּל־יְדָע֗וּם הַֽלְלוּיָֽהּ׃ "));
  parts.push(p("<b>הַ֥לְלוּיָ֨הּ</b> ׀ <small>(תהלים קמח)</small> הַֽלְל֣וּ אֶת־יְ֭הֹוָה מִן־הַשָּׁמַ֑יִם הַֽ֝לְל֗וּהוּ בַּמְּרוֹמִֽים׃ הַֽלְל֥וּהוּ כׇל־מַלְאָכָ֑יו הַ֝לְל֗וּהוּ כׇּל־צְבָאָֽו׃ הַֽ֭לְלוּהוּ שֶׁ֣מֶשׁ וְיָרֵ֑חַ הַֽ֝לְל֗וּהוּ כׇּל־כּ֥וֹכְבֵי אֽוֹר׃ הַֽ֭לְלוּהוּ שְׁמֵ֣י הַשָּׁמָ֑יִם וְ֝הַמַּ֗יִם אֲשֶׁ֤ר ׀ מֵעַ֬ל הַשָּׁמָֽיִם׃ יְֽ֭הַלְלוּ אֶת־שֵׁ֣ם יְהֹוָ֑ה כִּ֤י ה֖וּא צִוָּ֣ה וְנִבְרָֽאוּ׃ וַיַּעֲמִידֵ֣ם לָעַ֣ד לְעוֹלָ֑ם חׇק־נָ֝תַ֗ן וְלֹ֣א יַעֲבֽוֹר׃ הַֽלְל֣וּ אֶת־יְ֭הֹוָה מִן־הָאָ֑רֶץ תַּ֝נִּינִ֗ים וְכׇל־תְּהֹמֽוֹת׃ אֵ֣שׁ וּ֭בָרָד שֶׁ֣לֶג וְקִיט֑וֹר ר֥וּחַ סְ֝עָרָ֗ה עֹשָׂ֥ה דְבָרֽוֹ׃ הֶהָרִ֥ים וְכׇל־גְּבָע֑וֹת עֵ֥ץ פְּ֝רִ֗י וְכׇל־אֲרָזִֽים׃ הַחַיָּ֥ה וְכׇל־בְּהֵמָ֑ה רֶ֗֝מֶשׂ וְצִפּ֥וֹר כָּנָֽף׃ מַלְכֵי־אֶ֭רֶץ וְכׇל־לְאֻמִּ֑ים שָׂ֝רִ֗ים וְכׇל־שֹׁ֥פְטֵי אָֽרֶץ׃ בַּחוּרִ֥ים וְגַם־בְּתוּל֑וֹת זְ֝קֵנִ֗ים עִם־נְעָרִֽים׃ יְהַלְל֤וּ ׀ אֶת־שֵׁ֬ם יְהֹוָ֗ה כִּֽי־נִשְׂגָּ֣ב שְׁמ֣וֹ לְבַדּ֑וֹ ה֝וֹד֗וֹ עַל־אֶ֥רֶץ וְשָׁמָֽיִם׃ וַיָּ֤רֶם קֶ֨רֶן ׀ לְעַמּ֡וֹ תְּהִלָּ֤ה לְֽכׇל־חֲסִידָ֗יו לִבְנֵ֣י יִ֭שְׂרָאֵל עַ֥ם קְרֹב֗וֹ הַֽלְלוּיָֽהּ׃ "));
  parts.push(p("<b>הַ֥לְלוּיָ֨הּ</b> ׀ <small>(תהילים קמ״ט:א׳-ב׳)</small> שִׁ֣ירוּ לַֽ֭יהֹוָה שִׁ֣יר חָדָ֑שׁ תְּ֝הִלָּת֗וֹ בִּקְהַ֥ל חֲסִידִֽים׃ יִשְׂמַ֣ח יִשְׂרָאֵ֣ל בְּעֹשָׂ֑יו בְּנֵֽי־צִ֝יּ֗וֹן יָגִ֥ילוּ בְמַלְכָּֽם׃ יְהַלְל֣וּ שְׁמ֣וֹ בְמָח֑וֹל בְּתֹ֥ף וְ֝כִנּ֗וֹר יְזַמְּרוּ־לֽוֹ׃ כִּֽי־רוֹצֶ֣ה יְהֹוָ֣ה בְּעַמּ֑וֹ יְפָאֵ֥ר עֲ֝נָוִ֗ים בִּישׁוּעָֽה׃ יַעְלְז֣וּ חֲסִידִ֣ים בְּכָב֑וֹד יְ֝רַנְּנ֗וּ עַל־מִשְׁכְּבוֹתָֽם׃ רוֹמְמ֣וֹת אֵ֭ל בִּגְרוֹנָ֑ם וְחֶ֖רֶב פִּיפִיּ֣וֹת בְּיָדָֽם׃ לַעֲשׂ֣וֹת נְ֭קָמָה בַּגּוֹיִ֑ם תּ֝וֹכֵח֗וֹת בַּלְאֻמִּֽים׃ לֶאְסֹ֣ר מַלְכֵיהֶ֣ם בְּזִקִּ֑ים וְ֝נִכְבְּדֵיהֶ֗ם בְּכַבְלֵ֥י בַרְזֶֽל׃ לַעֲשׂ֤וֹת בָּהֶ֨ם ׀ מִשְׁפָּ֬ט כָּת֗וּב הָדָ֣ר ה֭וּא לְכׇל־חֲסִידָ֗יו הַֽלְלוּיָֽהּ׃"));
  parts.push(p("<b>הַ֥לְלוּיָ֨הּ</b> ׀ <small>(תהילים ק״נ:א׳-ב׳)</small> הַֽלְלוּ־אֵ֥ל בְּקָדְשׁ֑וֹ הַֽ֝לְל֗וּהוּ בִּרְקִ֥יעַ עֻזּֽוֹ׃ הַלְל֥וּהוּ בִגְבוּרֹתָ֑יו הַ֝לְל֗וּהוּ כְּרֹ֣ב גֻּדְלֽוֹ׃ הַ֭לְלוּהוּ בְּתֵ֣קַע שׁוֹפָ֑ר הַ֝לְל֗וּהוּ בְּנֵ֣בֶל וְכִנּֽוֹר׃ הַ֭לְלוּהוּ בְּתֹ֣ף וּמָח֑וֹל הַֽ֝לְל֗וּהוּ בְּמִנִּ֥ים וְעֻגָֽב׃ הַלְל֥וּהוּ בְצִלְצְלֵי־שָׁ֑מַע הַֽ֝לְל֗וּהוּ בְּֽצִלְצְלֵ֥י תְרוּעָֽה׃ כֹּ֣ל הַ֭נְּשָׁמָה תְּהַלֵּ֥ל יָ֗הּ הַֽלְלוּיָֽהּ׃ כֹּ֣ל הַ֭נְּשָׁמָה תְּהַלֵּ֥ל יָ֗הּ הַֽלְלוּיָֽהּ׃"));
  parts.push(p("<b>בָּר֖וּךְ</b> יְהֹוָ֥ה לְ֝עוֹלָ֗ם אָ֘מֵ֥ן ׀ וְאָמֵֽן: בָּ֘ר֤וּךְ יְהֹוָ֨ה ׀ מִצִּיּ֗וֹן שֹׁ֘כֵ֤ן יְֽרוּשָׁלָ֗‍ִם הַֽלְלוּיָֽהּ: בָּר֤וּךְ ׀ יְהֹוָ֣ה אֱ֭לֹהִים אֱלֹהֵ֣י יִשְׂרָאֵ֑ל עֹשֵׂ֖ה נִפְלָא֣וֹת לְבַדּֽוֹ: וּבָר֤וּךְ ׀ שֵׁ֥ם כְּבוֹד֗וֹ לְע֫וֹלָ֥ם וְיִמָּלֵ֣א כְ֭בוֹדוֹ אֶת־כֹּ֥ל הָאָ֗רֶץ אָ֘מֵ֥ן ׀ וְאָמֵֽן:"));
  parts.push(p("<small>יאמר מעומד</small> "));
  parts.push(p("<b>וַיְבָ֤רֶךְ דָּוִיד֙</b> אֶת־יְהֹוָ֔ה לְעֵינֵ֖י כׇּל־הַקָּהָ֑ל וַיֹּ֣אמֶר דָּוִ֗יד בָּר֨וּךְ אַתָּ֤ה יְהֹוָה֙ אֱלֹהֵי֙ יִשְׂרָאֵ֣ל אָבִ֔ינוּ מֵעוֹלָ֖ם וְעַד־עוֹלָֽם׃ לְךָ֣ יְ֠הֹוָ֠ה הַגְּדֻלָּ֨ה וְהַגְּבוּרָ֤ה וְהַתִּפְאֶ֙רֶת֙ וְהַנֵּ֣צַח וְהַה֔וֹד כִּי־כֹ֖ל בַּשָּׁמַ֣יִם וּבָאָ֑רֶץ לְךָ֤ יְהֹוָה֙ הַמַּמְלָכָ֔ה וְהַמִּתְנַשֵּׂ֖א לְכֹ֥ל ׀ לְרֹֽאשׁ׃ וְהָעֹ֤שֶׁר וְהַכָּבוֹד֙ מִלְּפָנֶ֔יךָ וְאַתָּה֙ מוֹשֵׁ֣ל בַּכֹּ֔ל <small>יתן צדקה שלש פרוטות, וימסור השתים בבת אחת, ואחריהם השלישית <small>(בא\"ח ויגש הי\"ג)</small></small> וּבְיָדְךָ֖ כֹּ֣חַ וּגְבוּרָ֑ה וּבְיָ֣דְךָ֔ לְגַדֵּ֥ל וּלְחַזֵּ֖ק לַכֹּֽל׃ וְעַתָּ֣ה אֱלֹהֵ֔ינוּ מוֹדִ֥ים אֲנַ֖חְנוּ לָ֑ךְ וּֽמְהַלְלִ֖ים לְשֵׁ֥ם תִּפְאַרְתֶּֽךָ׃ וִיבָֽרְכוּ֙ שֵׁ֣ם כְּבֹדֶ֔ךָ וּמְרוֹמַ֥ם עַל־כׇּל־בְּרָכָ֖ה וּתְהִלָּֽה׃ אַתָּה־ה֣וּא יְהֹוָה֮ לְבַדֶּ֒ךָ֒ את [אַתָּ֣ה] עָשִׂ֡יתָ אֶֽת־הַשָּׁמַ֩יִם֩ שְׁמֵ֨י הַשָּׁמַ֜יִם וְכׇל־צְבָאָ֗ם הָאָ֜רֶץ וְכׇל־אֲשֶׁ֤ר עָלֶ֙יהָ֙ הַיַּמִּים֙ וְכׇל־אֲשֶׁ֣ר בָּהֶ֔ם וְאַתָּ֖ה מְחַיֶּ֣ה אֶת־כֻּלָּ֑ם וּצְבָ֥א הַשָּׁמַ֖יִם לְךָ֥ מִשְׁתַּחֲוִֽים׃ אַתָּה־הוּא֙ יְהֹוָ֣ה הָאֱלֹהִ֔ים <small><small>ר״ת אהיה. עד כאן מעומד (כה״ח נג:מג)</small></small> אֲשֶׁ֤ר בָּחַ֙רְתָּ֙ בְּאַבְרָ֔ם וְהוֹצֵאת֖וֹ מֵא֣וּר כַּשְׂדִּ֑ים וְשַׂ֥מְתָּ שְּׁמ֖וֹ אַבְרָהָֽם׃ וּמָצָ֣אתָ אֶת־לְבָבוֹ֮ נֶאֱמָ֣ן לְפָנֶ֒יךָ֒ וְכָר֨וֹת עִמּ֜וֹ הַבְּרִ֗ית לָתֵ֡ת אֶת־אֶ֩רֶץ֩ הַכְּנַעֲנִ֨י הַחִתִּ֜י הָאֱמֹרִ֧י וְהַפְּרִזִּ֛י וְהַיְבוּסִ֥י וְהַגִּרְגָּשִׁ֖י לָתֵ֣ת לְזַרְע֑וֹ וַתָּ֙קֶם֙ אֶת־דְּבָרֶ֔יךָ כִּ֥י צַדִּ֖יק אָֽתָּה׃ וַתֵּ֛רֶא אֶת־עֳנִ֥י אֲבֹתֵ֖ינוּ בְּמִצְרָ֑יִם וְאֶת־זַעֲקָתָ֥ם שָׁמַ֖עְתָּ עַל־יַם־סֽוּף׃ וַ֠תִּתֵּ֠ן אֹתֹ֨ת וּמֹֽפְתִ֜ים בְּפַרְעֹ֤ה וּבְכׇל־עֲבָדָיו֙ וּבְכׇל־עַ֣ם אַרְצ֔וֹ כִּ֣י יָדַ֔עְתָּ כִּ֥י הֵזִ֖ידוּ עֲלֵיהֶ֑ם וַתַּֽעַשׂ־לְךָ֥ שֵׁ֖ם כְּהַיּ֥וֹם הַזֶּֽה׃ וְהַיָּם֙ בָּקַ֣עְתָּ לִפְנֵיהֶ֔ם וַיַּֽעַבְר֥וּ בְתוֹךְ־הַיָּ֖ם בַּיַּבָּשָׁ֑ה וְֽאֶת־רֹ֨דְפֵיהֶ֜ם הִשְׁלַ֧כְתָּ בִמְצוֹלֹ֛ת כְּמוֹ־אֶ֖בֶן בְּמַ֥יִם עַזִּֽים׃ "));
  parts.push(p("<b>וַיּ֨וֹשַׁע</b> <small>(שמות יד ל)</small> יְהֹוָ֜ה בַּיּ֥וֹם הַה֛וּא אֶת־יִשְׂרָאֵ֖ל מִיַּ֣ד מִצְרָ֑יִם וַיַּ֤רְא יִשְׂרָאֵל֙ אֶת־מִצְרַ֔יִם מֵ֖ת עַל־שְׂפַ֥ת הַיָּֽם׃ וַיַּ֨רְא יִשְׂרָאֵ֜ל אֶת־הַיָּ֣ד הַגְּדֹלָ֗ה אֲשֶׁ֨ר עָשָׂ֤ה יְהֹוָה֙ בְּמִצְרַ֔יִם וַיִּֽירְא֥וּ הָעָ֖ם אֶת־יְהֹוָ֑ה וַיַּֽאֲמִ֙ינוּ֙ בַּֽיהֹוָ֔ה וּבְמֹשֶׁ֖ה עַבְדּֽוֹ׃ "));
  parts.push(p("<b>אָ֣ז</b> <small>(שמות ט״ו)</small> יָשִֽׁיר־מֹשֶׁה֩ וּבְנֵ֨י יִשְׂרָאֵ֜ל אֶת־הַשִּׁירָ֤ה הַזֹּאת֙ לַֽיהֹוָ֔ה וַיֹּאמְר֖וּ לֵאמֹ֑ר אָשִׁ֤ירָה לַֽיהֹוָה֙ כִּֽי־גָאֹ֣ה גָּאָ֔ה ס֥וּס וְרֹכְב֖וֹ רָמָ֥ה בַיָּֽם׃ עָזִּ֤י וְזִמְרָת֙ יָ֔הּ וַֽיְהִי־לִ֖י לִֽישׁוּעָ֑ה זֶ֤ה אֵלִי֙ וְאַנְוֵ֔הוּ אֱלֹהֵ֥י אָבִ֖י וַאֲרֹמְמֶֽנְהוּ׃ יְהֹוָ֖ה אִ֣ישׁ מִלְחָמָ֑ה יְהֹוָ֖ה שְׁמֽוֹ׃ מַרְכְּבֹ֥ת פַּרְעֹ֛ה וְחֵיל֖וֹ יָרָ֣ה בַיָּ֑ם וּמִבְחַ֥ר שָֽׁלִשָׁ֖יו טֻבְּע֥וּ בְיַם־סֽוּף׃ תְּהֹמֹ֖ת יְכַסְיֻ֑מוּ יָרְד֥וּ בִמְצוֹלֹ֖ת כְּמוֹ־אָֽבֶן׃ יְמִֽינְךָ֣ יְהֹוָ֔ה נֶאְדָּרִ֖י בַּכֹּ֑חַ יְמִֽינְךָ֥ יְהֹוָ֖ה תִּרְעַ֥ץ אוֹיֵֽב׃ וּבְרֹ֥ב גְּאוֹנְךָ֖ תַּהֲרֹ֣ס קָמֶ֑יךָ תְּשַׁלַּח֙ חֲרֹ֣נְךָ֔ יֹאכְלֵ֖מוֹ כַּקַּֽשׁ׃ וּבְר֤וּחַ אַפֶּ֙יךָ֙ נֶ֣עֶרְמוּ מַ֔יִם נִצְּב֥וּ כְמוֹ־נֵ֖ד נֹזְלִ֑ים קָֽפְא֥וּ תְהֹמֹ֖ת בְּלֶב־יָֽם׃ אָמַ֥ר אוֹיֵ֛ב אֶרְדֹּ֥ף אַשִּׂ֖יג אֲחַלֵּ֣ק שָׁלָ֑ל תִּמְלָאֵ֣מוֹ נַפְשִׁ֔י אָרִ֣יק חַרְבִּ֔י תּוֹרִישֵׁ֖מוֹ יָדִֽי׃ נָשַׁ֥פְתָּ בְרוּחֲךָ֖ כִּסָּ֣מוֹ יָ֑ם צָֽלְלוּ֙ כַּֽעוֹפֶ֔רֶת בְּמַ֖יִם אַדִּירִֽים׃ מִֽי־כָמֹ֤כָה בָּֽאֵלִם֙ יְהֹוָ֔ה מִ֥י כָּמֹ֖כָה נֶאְדָּ֣ר בַּקֹּ֑דֶשׁ נוֹרָ֥א תְהִלֹּ֖ת עֹ֥שֵׂה פֶֽלֶא׃ נָטִ֙יתָ֙ יְמִ֣ינְךָ֔ תִּבְלָעֵ֖מוֹ אָֽרֶץ׃ נָחִ֥יתָ בְחַסְדְּךָ֖ עַם־ז֣וּ גָּאָ֑לְתָּ נֵהַ֥לְתָּ בְעׇזְּךָ֖ אֶל־נְוֵ֥ה קׇדְשֶֽׁךָ׃ שָֽׁמְע֥וּ עַמִּ֖ים יִרְגָּז֑וּן חִ֣יל אָחַ֔ז יֹשְׁבֵ֖י פְּלָֽשֶׁת׃ אָ֤ז נִבְהֲלוּ֙ אַלּוּפֵ֣י אֱד֔וֹם אֵילֵ֣י מוֹאָ֔ב יֹֽאחֲזֵ֖מוֹ רָ֑עַד נָמֹ֕גוּ כֹּ֖ל יֹשְׁבֵ֥י כְנָֽעַן׃ תִּפֹּ֨ל עֲלֵיהֶ֤ם אֵימָ֙תָה֙ וָפַ֔חַד בִּגְדֹ֥ל זְרוֹעֲךָ֖ יִדְּמ֣וּ כָּאָ֑בֶן עַד־יַעֲבֹ֤ר עַמְּךָ֙ יְהֹוָ֔ה עַֽד־יַעֲבֹ֖ר עַם־ז֥וּ קָנִֽיתָ׃ תְּבִאֵ֗מוֹ וְתִטָּעֵ֙מוֹ֙ בְּהַ֣ר נַחֲלָֽתְךָ֔ מָכ֧וֹן לְשִׁבְתְּךָ֛ פָּעַ֖לְתָּ יְהֹוָ֑ה מִקְּדָ֕שׁ אֲדֹנָ֖י כּוֹנְנ֥וּ יָדֶֽיךָ׃ יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד׃ יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד׃ יְהֹוָה מַלְכוּתֵהּ קָאִים לְעָלַם וּלְעָלְמֵי עָלְמַיָּא: כִּ֣י בָא֩ ס֨וּס פַּרְעֹ֜ה בְּרִכְבּ֤וֹ וּבְפָרָשָׁיו֙ בַּיָּ֔ם וַיָּ֧שֶׁב יְהֹוָ֛ה עֲלֵהֶ֖ם אֶת־מֵ֣י הַיָּ֑ם וּבְנֵ֧י יִשְׂרָאֵ֛ל הָלְכ֥וּ בַיַּבָּשָׁ֖ה בְּת֥וֹךְ הַיָּֽם׃ "));
  parts.push(p("<b>כִּ֣י</b> לַ֭יהֹוָה הַמְּלוּכָ֑ה וּ֝מֹשֵׁ֗ל בַּגּוֹיִֽם׃ וְעָל֤וּ מֽוֹשִׁעִים֙ בְּהַ֣ר צִיּ֔וֹן לִשְׁפֹּ֖ט אֶת־הַ֣ר עֵשָׂ֑ו וְהָיְתָ֥ה לַֽיהֹוָ֖ה הַמְּלוּכָֽה׃ וְהָיָ֧ה יְהֹוָ֛ה לְמֶ֖לֶךְ עַל־כׇּל־הָאָ֑רֶץ בַּיּ֣וֹם הַה֗וּא יִהְיֶ֧ה יְהֹוָ֛ה אֶחָ֖ד וּשְׁמ֥וֹ אֶחָֽד׃ "));
  parts.push(p("<b>יִשְׁתַּבַּח</b> שִׁמְךָ לָעַד מַלְכֵּֽנוּ, הָאֵל הַמֶּֽלֶךְ הַגָּדוֹל וְהַקָּדוֹשׁ, בַּשָּׁמַֽיִם וּבָאָֽרֶץ. כִּי לְךָ נָאֶה יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ לְעוֹלָם וָעֶד. <small>א</small> שִׁיר, <small>ב</small> וּשְׁבָחָה, <small>ג</small> הַלֵּל, <small>ד</small> וְזִמְרָה, <small>ה</small> עֹז, <small>ו</small> וּמֶמְשָׁלָה, <small>ז</small> נֶֽצַח, <small>ח</small> גְּדֻלָּה, <small>ט</small> גְּבוּרָה, <small>י</small> תְּהִלָּה, <small>יא</small> וְתִפְאֶֽרֶת, <small>יב</small> קְדֻשָּׁה, <small>יג</small> וּמַלְכוּת. בְּרָכוֹת וְהוֹדָאוֹת, לְשִׁמְךָ הַגָּדוֹל וְהַקָּדוֹשׁ, וּמֵעוֹלָם וְעַד עוֹלָם אַתָּה אֵל. בָּרוּךְ אַתָּה יְהֹוָה, מֶֽלֶךְ גָּדוֹל וּמְהֻלָּל בַּתִּשְׁבָּחוֹת, אֵל הַהוֹדָאוֹת, אֲדוֹן הַנִּפְלָאוֹת, בּוֹרֵא כָּל־הַנְּשָׁמוֹת, רִבּוֹן כָּל־הַמַּעֲשִׂים, הַבּוֹחֵר בְּשִׁירֵי זִמְרָה, מֶֽלֶךְ אֵל חַי הָעוֹלָמִים, אָמֵן: "));
  parts.push(p("<small>בעשרת ימי תשובה מוסיפים</small> "));
  parts.push(p("<small>שִׁ֥יר הַֽמַּעֲל֑וֹת <small>(תהילים ק״ל:א׳-ב׳)</small> מִמַּעֲמַקִּ֖ים קְרָאתִ֣יךָ יְהֹוָֽה׃ אֲדֹנָי֮ שִׁמְעָ֢ה בְק֫וֹלִ֥י תִּהְיֶ֣ינָה אׇ֭זְנֶיךָ קַשֻּׁב֑וֹת לְ֝ק֗וֹל תַּחֲנוּנָֽי׃ אִם־עֲוֺנ֥וֹת תִּשְׁמׇר־יָ֑הּ אֲ֝דֹנָ֗י מִ֣י יַעֲמֹֽד׃ כִּֽי־עִמְּךָ֥ הַסְּלִיחָ֑ה לְ֝מַ֗עַן תִּוָּרֵֽא׃ קִוִּ֣יתִי יְ֭הֹוָה קִוְּתָ֣ה נַפְשִׁ֑י וְֽלִדְבָר֥וֹ הוֹחָֽלְתִּי׃ נַפְשִׁ֥י לַאדֹנָ֑י מִשֹּׁמְרִ֥ים לַ֝בֹּ֗קֶר שֹׁמְרִ֥ים לַבֹּֽקֶר׃ יַחֵ֥ל יִשְׂרָאֵ֗ל אֶל־יְהֹ֫וָ֥ה כִּֽי־עִם־יְהֹוָ֥ה הַחֶ֑סֶד וְהַרְבֵּ֖ה עִמּ֣וֹ פְדֽוּת׃ וְ֭הוּא יִפְדֶּ֣ה אֶת־יִשְׂרָאֵ֑ל מִ֝כֹּ֗ל עֲוֺנֹתָֽיו׃</small> "));
  parts.push(p("<small>ואומר החזן חצי קדיש</small> "));
  parts.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small>ואומר החזן:</small> בָּרְכוּ אֶת יְהֹוָה הַמְּבֹרָךְ: "));
  parts.push(p("<small>ועונים הקהל:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֵד: "));
  parts.push(p("<small>ואומר החזן:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֵד: "));
  parts.push(hr);

  // ─────────────────────────── קריאת שמע וברכותיה ───────────────────────────
  parts.push(p("<big><b>ק\"ש וברכותיה</b></big>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, <small>כשיתחיל יוצר אור ימשמש בתפלין של יד <small>(בא\"ח שמות ה\"א)</small></small> יוֹצֵר אוֹר וּבוֹרֵא חֹשֶׁךְ עֹשֵׂה שָׁלוֹם וּבוֹרֵא אֶת הַכֹּל. הַמֵּאִיר לָאָרֶץ וְלַדָּרִים עָלֶיהָ בְּרַחֲמִים, וּבְטוּבוֹ מְחַדֵּשׁ בְּכָל יוֹם תָּמִיד מַעֲשֵׂה בְּרֵאשִׁית. מָה רַבּוּ מַעֲשֶׂיךָ יְהֹוָה כֻּלָּם בְּחָכְמָה עָשִׂיתָ, מָלְאָה הָאָרֶץ קִנְיָנֶךָ. הַמֶּלֶךְ הַמְּרוֹמָם לְבַדּוֹ מֵאָז, הַמְּשֻׁבָּח וְהַמְּפוֹאָר וְהַמִּתְנַשֵּׂא מִימוֹת עוֹלָם. אֱלֹהַי עוֹלָם, בְּרַחֲמֶיךָ הָרַבִּים רַחֵם עָלֵינוּ, אֲדוֹן עוּזֵּנוּ, צוּר מִשְׂגַּבֵּנוּ, מָגֵן יִשְׁעֵנוּ, מִשְׂגָּב בַּעֲדֵנוּ. אֵל בָּרוּךְ גְּדוֹל דֵּעָה, הֵכִין וּפָעַל זָהֳרֵי חַמָּה. טוֹב יָצַר כָּבוֹד לִשְׁמוֹ, מְאוֹרוֹת נָתַן סְבִיבוֹת עֻזּוֹ. פִּינוֹת צִבְאוֹת קְדוֹשִׁים, רוֹמְמֵי שַׁדַּי, תָּמִיד מְסַפְּרִים כְּבוֹד אֵל וּקְדוּשָׁתוֹ. תִּתְבָּרַךְ יְהֹוָה אֱלֹהֵינוּ בַּשָּׁמַיִם מִמַּעַל וְעַל־הָאָרֶץ מִתַּחַת עַל־כָּל־שֶׁבַח מַעֲשֵׂה יָדֶיךָ וְעַל מְאוֹרֵי אוֹר שֶׁיָּצַרְתָּ הֵמָּה יְפָאֲרוּךָ סֶּלָה: "));
  parts.push(p("<b>תִּתְבָּרַךְ</b> לָנֶצַח צוּרֵנוּ מַלְכֵּנוּ וְגוֹאֲלֵנוּ בּוֹרֵא קְדוֹשִׁים, יִשְׁתַּבַּח שִׁמְךָ לָעַד מַלְכֵּנוּ יוֹצֵר מְשָׁרְתִים, וַאֲשֶׁר מְשָׁרְתָיו כֻּלָּם עוֹמְדִים בְּרוּם עוֹלָם וּמַשְׁמִיעִים בְּיִרְאָה יַחַד בְּקוֹל דִּבְרֵי אֱלֹהִים חַיִּים וּמֶלֶךְ עוֹלָם. כֻּלָּם אֲהוּבִים, כֻּלָּם בְּרוּרִים, כֻּלָּם גִּבּוֹרִים, כֻּלָּם קְדוֹשִׁים, כֻּלָּם עוֹשִׂים בְּאֵימָה וּבְיִרְאָה רָצוֹן קוֹנֵיהֶם, וְכֻלָּם פּוֹתְחִים אֶת פִּיהֶם בִּקְדוּשָׁה וּבְטָהֳרָה, בְּשִׁירָה וּבְזִמְרָה, וּמְבָרְכִין וּמְשַׁבְּחִין וּמְפָאֲרִין וּמַקְדִּישִׁין וּמַעֲרִיצִין וּמַמְלִיכִין אֶת שֵׁם הָאֵל הַמֶּלֶךְ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא קָדוֹשׁ הוּא. וְכֻלָּם מְקַבְּלִים עֲלֵיהֶם עֹל מַלְכוּת שָׁמַיִם זֶה מִזֶּה, וְנוֹתְנִים רְשׁוּת זֶה לָזֶה לְהַקְדִּישׁ לְיוֹצְרָם בְּנַחַת רוּחַ בְּשָׂפָה בְּרוּרָה וּבִנְעִימָה קְדוּשָׁה, כֻּלָּם כְּאֶחָד עוֹנִים בְּאֵימָה, וְאוֹמְרִים בְּיִרְאָה:"));
  parts.push(p("<small>קדושת יוצר צריך לאמרה מיושב ואם היה עומד צריך שישב <small>(בא\"ח שמות ה\"ב)</small></small> "));
  parts.push(p("<b>קָד֧וֹשׁ</b> ׀ קָד֛וֹשׁ קָד֖וֹשׁ יְהֹוָ֣ה צְבָא֑וֹת מְלֹ֥א כׇל־הָאָ֖רֶץ כְּבוֹדֽוֹ: וְהָאוֹפַנִּים וְחַיּוֹת הַקֹדֶשׁ בְּרַעַשׁ גָּדוֹל מִתְנַשְּׂאִים לְעֻמַּת הַשְׂרָפִים, לְעֻמָּתָם מְשַׁבְּחִים וְאוֹמְרִים: בָּר֥וּךְ כְּבוֹד־יְהֹוָ֖ה מִמְּקוֹמֽוֹ:"));
  parts.push(p("<b>לָאֵל</b> בָּרוּךְ, נְעִימוֹת יִתֵּנוּ, לַמֶּלֶךְ אֵל חַי וְקַיָּם, זְמִירוֹת יֹאמְרוּ וְתִשְׁבָּחוֹת יַשְׁמִיעוּ, כִּי הוּא לְבַדּוֹ מָרוֹם וְקָדוֹשׁ, פּוֹעֵל גְּבוּרוֹת, עוֹשֶׂה חֲדָשׁוֹת, בַּעַל מִלְחָמוֹת, זוֹרֵעַ צְדָקוֹת, מַצְמִיחַ יְשׁוּעוֹת, בּוֹרֵא רְפוּאוֹת, נוֹרָא תְהִלּוֹת, אֲדוֹן הַנִּפְלָאוֹת, הַמְחַדֵּשׁ בְּטוּבוֹ בְּכָל יוֹם תָּמִיד מַעֲשֵׂה בְרֵאשִׁית כָּאָמוּר: לְ֭עֹשֵׂה אוֹרִ֣ים גְּדֹלִ֑ים כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ בָּרוּךְ אַתָּה יְהֹוָה יוֹצֵר הַמְּאוֹרוֹת:"));
  parts.push(p("<b>אַהֲבַת</b> עוֹלָם אֲהַבְתָּנוּ יְהֹוָה אֱלֹהֵינוּ, חֶמְלָה גְּדוֹלָה וִיתֵרָה חָמַלְתָּ עָלֵינוּ. אָבִינוּ מַלְכֵּנוּ, בַּעֲבוּר שִׁמְךָ הַגָּדוֹל וּבַעֲבוּר אֲבוֹתֵינוּ שֶׁבָּטְחוּ בָּךְ וַתְּלַמְּדֵמוֹ חֻקֵּי חַיִּים לַעֲשׂוֹת רְצוֹנְךָ בְּלֵבָב שָׁלֵם, כֵּן תְּחָנֵּנוּ אָבִינוּ, אָב הָרַחֲמָן הַמְרַחֵם, רַחֵם נָא עָלֵינוּ, וְתֵן בְּלִבֵּנוּ בִינָה לְהָבִין, לְהַשְׂכִּיל, לִשְׁמֹעַ, לִלְמֹד וּלְלַמֵּד, לִשְׁמֹר וְלַעֲשׂוֹת וּלְקַיֵּם אֶת־כָּל־דִּבְרֵי תַּלְמוּד תוֹרָתְךָ בְּאַהֲבָה: "));
  parts.push(p("וְהָאֵר עֵינֵינוּ בְּתוֹרָתֶךָ וְדַבֵּק לִבֵּנוּ בְמִצְוֹתֶיךָ, וְיַחֵד לְבָבֵנוּ לְאַהֲבָה וּלְיִרְאָה אֶת־שְׁמֶךָ. לֹא נֵבוֹשׁ וְלֹא נִכָּלֵם וְלֹא נִכָּשֵׁל לְעוֹלָם וָעֶד. כִּי בְשֵׁם קָדְשְׁךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא בָּטָחְנוּ, נָגִילָה וְנִשְׂמְחָה בִּישׁוּעָתֶךָ, וְרַחֲמֶיךָ יְהֹוָה אֱלֹהֵינוּ וַחֲסָדֶיךָ הָרַבִּים, אַל יַעַזְבוּנוּ נֶצַח סֶלָה וָעֶד:"));
  parts.push(p("<small>כשיאמר מהר והבא עלינו ישים שני צדדי הטלית על כתפיו וכשיאמר ברכה ושלום מהרה מארבע כנפות כל הארץ יקבץ כל ארבע כנפות הטלית ויאחזם בידו השמאלית כנגד הלב שהוא בשמאל<br> <small>(בא\"ח שמות ה\"ה)</small></small> מַהֵר וְהָבֵא עָלֵינוּ בְּרָכָה וְשָׁלוֹם מְהֵרָה מֵאַרְבַּע כַּנְפוֹת כָּל־הָאָרֶץ, וּשְׁבֹר עֹל הַגּוֹיִם מֵעַל צַוָּארֵנוּ, וְהוֹלִיכֵנוּ מְהֵרָה קוֹמְמִיּוּת לְאַרְצֵנוּ, כִּי אֵל פּוֹעֵל יְשׁוּעוֹת אַתָּה, וּבָנוּ בָחַרְתָּ מִכָּל עַם וְלָשׁוֹן, וְקֵרַבְתָּנוּ מַלְכֵּנוּ לְשִׁמְךָ הַגָּדוֹל בְּאַהֲבָה, לְהוֹדוֹת לָךְ וּלְיַחֶדְךָ לְיִרְאָה וּלְאַהֲבָה אֶת־שִׁמְךָ, בָּרוּךְ אַתָּה יְהֹוָה, הַבּוֹחֵר בְּעַמּוֹ יִשְׂרָאֵל בְּאַהֲבָה: "));
  parts.push(p("<small>קודם שיקרא קריאת שמע יכוין לקיים מצוות עשה שנצטוינו לקרא קריאת שמע שתי פעמים ביום, וגם יכוין לקיים מצות עשה ליחד את השם, ויסגור עיניו ביד ימינו בפסוק ראשון עד שישלים ברוך שם, וכן הוא כאן אומר שמע ישראל כלומר קבל דברים אלו והבינם ותדעם שתאמין בם והוא כי ה' הוא אלהינו, ועוד הנה הוא ה' אחד, ונמצא בזה יש קבלה והודאה בשתי דברים האחד הוא קבלת מלכות שמים באומרו ה' אלהינו דמודה שקבלנו אלהותו להיות לנו לאלוה ואנחנו עבדים לו, והשני הוא ענין יחוד השם באומרו ה' אחד שהוא בלי שיתוף אחר <small>(בא\"ח וארא ה\"ו-ז)</small></small>"));
  parts.push(p("<b>שְׁמַ֖<big>ע</big> יִשְׂרָאֵ֑ל יְהֹוָ֥ה אֱלֹהֵ֖ינוּ יְהֹוָ֥ה ׀ אֶחָֽ<big>ד</big></b>׃"));
  parts.push(p("<small><small>בלחש:</small> בָּרוּךְ, שֵׁם כְּבוֹד מַלְכוּתוֹ, לְעוֹלָם וָעֶד:</small> "));
  parts.push(p("<b>וְאָ֣הַבְתָּ֔</b> <small>(דברים ו ה)</small> אֵ֖ת יְהֹוָ֣ה אֱלֹהֶ֑יךָ בְּכׇל־לְבָבְךָ֥ וּבְכׇל־נַפְשְׁךָ֖ וּבְכׇל־מְאֹדֶֽךָ׃ וְהָי֞וּ הַדְּבָרִ֣ים הָאֵ֗לֶּה אֲשֶׁ֨ר אָנֹכִ֧י מְצַוְּךָ֛ הַיּ֖וֹם עַל־לְבָבֶֽךָ׃ וְשִׁנַּנְתָּ֣ם לְבָנֶ֔יךָ וְדִבַּרְתָּ֖ בָּ֑ם בְּשִׁבְתְּךָ֤ בְּבֵיתֶ֙ךָ֙ וּבְלֶכְתְּךָ֣ בַדֶּ֔רֶךְ וּֽבְשׇׁכְבְּךָ֖ וּבְקוּמֶֽךָ׃ וּקְשַׁרְתָּ֥ם לְא֖וֹת עַל־יָדֶ֑ךָ <small>ימשמש בתפלין של יד <small>(בא\"ח וארא הכ\"א)</small></small> וְהָי֥וּ לְטֹטָפֹ֖ת <small>ימשמש בתפלין של ראש</small> בֵּ֥ין עֵינֶֽיךָ׃ וּכְתַבְתָּ֛ם עַל־מְזֻז֥וֹת בֵּיתֶ֖ךָ וּבִשְׁעָרֶֽיךָ׃"));
  parts.push(p("<b>וְהָיָ֗ה</b> <small>(דברים יא יג)</small> אִם־שָׁמֹ֤עַ תִּשְׁמְעוּ֙ אֶל־מִצְוֺתַ֔י אֲשֶׁ֧ר אָנֹכִ֛י מְצַוֶּ֥ה אֶתְכֶ֖ם הַיּ֑וֹם לְאַהֲבָ֞ה אֶת־יְהֹוָ֤ה אֱלֹֽהֵיכֶם֙ וּלְעׇבְד֔וֹ בְּכׇל־לְבַבְכֶ֖ם וּבְכׇל־נַפְשְׁכֶֽם׃ וְנָתַתִּ֧י מְטַֽר־אַרְצְכֶ֛ם בְּעִתּ֖וֹ יוֹרֶ֣ה וּמַלְק֑וֹשׁ וְאָסַפְתָּ֣ דְגָנֶ֔ךָ וְתִֽירֹשְׁךָ֖ וְיִצְהָרֶֽךָ׃ וְנָתַתִּ֛י עֵ֥שֶׂב בְּשָׂדְךָ֖ לִבְהֶמְתֶּ֑ךָ וְאָכַלְתָּ֖ וְשָׂבָֽעְתָּ׃ הִשָּֽׁמְר֣וּ לָכֶ֔ם פֶּ֥ן יִפְתֶּ֖ה לְבַבְכֶ֑ם וְסַרְתֶּ֗ם וַעֲבַדְתֶּם֙ אֱלֹהִ֣ים אֲחֵרִ֔ים וְהִשְׁתַּחֲוִיתֶ֖ם לָהֶֽם׃ וְחָרָ֨ה אַף־יְהֹוָ֜ה בָּכֶ֗ם וְעָצַ֤ר אֶת־הַשָּׁמַ֙יִם֙ וְלֹֽא־יִהְיֶ֣ה מָטָ֔ר וְהָ֣אֲדָמָ֔ה לֹ֥א תִתֵּ֖ן אֶת־יְבוּלָ֑הּ וַאֲבַדְתֶּ֣ם מְהֵרָ֗ה מֵעַל֙ הָאָ֣רֶץ הַטֹּבָ֔ה אֲשֶׁ֥ר יְהֹוָ֖ה נֹתֵ֥ן לָכֶֽם׃ וְשַׂמְתֶּם֙ אֶת־דְּבָרַ֣י אֵ֔לֶּה עַל־לְבַבְכֶ֖ם וְעַֽל־נַפְשְׁכֶ֑ם וּקְשַׁרְתֶּ֨ם אֹתָ֤ם לְאוֹת֙ עַל־יֶדְכֶ֔ם <small>ימשמש בתפלין של יד</small> וְהָי֥וּ לְטוֹטָפֹ֖ת בֵּ֥ין עֵינֵיכֶֽם <small>ימשמש בתפלין של ראש</small>׃ וְלִמַּדְתֶּ֥ם אֹתָ֛ם אֶת־בְּנֵיכֶ֖ם לְדַבֵּ֣ר בָּ֑ם בְּשִׁבְתְּךָ֤ בְּבֵיתֶ֙ךָ֙ וּבְלֶכְתְּךָ֣ בַדֶּ֔רֶךְ וּֽבְשׇׁכְבְּךָ֖ וּבְקוּמֶֽךָ׃ וּכְתַבְתָּ֛ם עַל־מְזוּז֥וֹת בֵּיתֶ֖ךָ וּבִשְׁעָרֶֽיךָ׃ לְמַ֨עַן יִרְבּ֤וּ יְמֵיכֶם֙ וִימֵ֣י בְנֵיכֶ֔ם עַ֚ל הָֽאֲדָמָ֔ה אֲשֶׁ֨ר נִשְׁבַּ֧ע יְהֹוָ֛ה לַאֲבֹתֵיכֶ֖ם לָתֵ֣ת לָהֶ֑ם כִּימֵ֥י הַשָּׁמַ֖יִם עַל־הָאָֽרֶץ׃"));
  parts.push(p("<b>וַיֹּ֥אמֶר</b> <small>(במדבר טו לז)</small> יְהֹוָ֖ה אֶל־מֹשֶׁ֥ה לֵּאמֹֽר׃ דַּבֵּ֞ר אֶל־בְּנֵ֤י יִשְׂרָאֵל֙ וְאָמַרְתָּ֣ אֲלֵהֶ֔ם וְעָשׂ֨וּ לָהֶ֥ם צִיצִ֛ת עַל־כַּנְפֵ֥י בִגְדֵיהֶ֖ם לְדֹרֹתָ֑ם וְנָ֥תְנ֛וּ עַל־צִיצִ֥ת הַכָּנָ֖ף פְּתִ֥יל תְּכֵֽלֶת׃ וְהָיָ֣ה לָכֶם֮ לְצִיצִת֒ וּרְאִיתֶ֣ם אֹת֗וֹ <small>יסתכל בציציות שבידיו, יעבירם על גבי עיניו וינשקם שתי פעמים</small> וּזְכַרְתֶּם֙ אֶת־כׇּל־מִצְוֺ֣ת יְהֹוָ֔ה וַעֲשִׂיתֶ֖ם אֹתָ֑ם וְלֹֽא־תָת֜וּרוּ אַחֲרֵ֤י לְבַבְכֶם֙ וְאַחֲרֵ֣י עֵֽינֵיכֶ֔ם <small>יעביר הציציות על גבי עיניו וינשקם</small> אֲשֶׁר־אַתֶּ֥ם זֹנִ֖ים אַחֲרֵיהֶֽם׃ לְמַ֣עַן תִּזְכְּר֔וּ וַעֲשִׂיתֶ֖ם אֶת־כׇּל־מִצְוֺתָ֑י וִהְיִיתֶ֥ם קְדֹשִׁ֖ים לֵאלֹֽהֵיכֶֽם׃ אֲנִ֞י יְהֹוָ֣ה אֱלֹֽהֵיכֶ֗ם אֲשֶׁ֨ר הוֹצֵ֤אתִי אֶתְכֶם֙ מֵאֶ֣רֶץ מִצְרַ֔יִם לִהְי֥וֹת לָכֶ֖ם לֵאלֹהִ֑ים אֲנִ֖י יְהֹוָ֥ה אֱלֹהֵיכֶֽם׃ אֱמֶת."));
  parts.push(p("<small>וחוזר החזן:</small> יְהֹוָה אֱלֹהֵיכֶם אֱמֶת: "));
  parts.push(p("<b>וְיַצִּיב</b>, וְנָכוֹן, וְקַיָּם, וְיָשָׁר, וְנֶאֱמָן, וְאָהוּב, וְחָבִיב, וְנֶחְמָד, וְנָעִים, וְנוֹרָא, וְאַדִּיר, וּמְתוּקָן, וּמְקֻבָּל, וְטוֹב, וְיָפֶה, הַדָּבָר הַזֶּה עָלֵינוּ לְעוֹלָם וָעֶד."));
  parts.push(p("אֱמֶת, אֱלֹהֵי עוֹלָם מַלְכֵּנוּ צוּר יַעֲקֹב מָגֵן יִשְׁעֵנוּ, לְדוֹר וָדוֹר הוּא קַיָּם, וּשְׁמוֹ קַיָּם, וְכִסְאוֹ נָכוֹן, וּמַלְכוּתוֹ וֶאֱמוּנָתוֹ לָעַד קַיֶּמֶת, וּדְבָרָיו חַיִּים וְקַיָּמִים, וְנֶאֱמָנִים וְנֶחֱמָדִים לָעַד <small>ינשק הציציות שהיה אוחז בהם ויעבירם על גבי עיניו ויסירם מידו <small>(בא\"ח שמות ה\"ח)</small></small> וּלְעוֹלְמֵי עוֹלָמִים. עַל אֲבוֹתֵינוּ, עָלֵינוּ וְעַל בָּנֵינוּ וְעַל דּוֹרוֹתֵינוּ וְעַל כָּל דּוֹרוֹת זֶרַע יִשְׂרָאֵל עֲבָדֶיךָ. עַל הָרִאשׁוֹנִים וְעַל הָאַחֲרוֹנִים דָּבָר טוֹב וְקַיָּם בֶּאֱמֶת וֶאֱמוּנָה חוֹק וְלֹא יַעֲבוֹר. אֱמֶת שֶׁאַתָּה הוּא יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. מַלְכֵּנוּ מֶלֶךְ אֲבוֹתֵינוּ. גּוֹאֲלֵנוּ גּוֹאֵל אֲבוֹתֵינוּ. יוֹצְרֵנוּ צוּר יְשׁוּעָתֵנוּ. פּוֹדֵנוּ וּמַצִּילֵנוּ מֵעוֹלָם הוּא שְׁמֶךָ, וְאֵין לָנוּ עוֹד אֱלֹהִים זוּלָתְךָ סֶלָה:"));
  parts.push(p("<b>עֶזְרַת</b> אֲבוֹתֵינוּ אַתָּה הוּא מֵעוֹלָם, מָגֵן וּמוֹשִׁיעַ לָהֶם וְלִבְנֵיהֶם אַחֲרֵיהֶם בְּכָל דּוֹר וָדוֹר, בְּרוּם עוֹלָם מוֹשָׁבֶךָ, וּמִשְׁפָּטֶיךָ, וְצִדְקָתְךָ עַד אַפְסֵי אָרֶץ, אֱמֶת אַשְׁרֵי אִישׁ שֶׁיִּשְׁמַע לְמִצְוֹתֶיךָ וְתוֹרָתְךָ וּדְבָרְךָ יָשִׂים עַל לִבּוֹ. אֱמֶת שֶׁאַתָּה הוּא אֲדוֹן לְעַמֶּךָ וּמֶלֶךְ גִּבּוֹר לָרִיב רִיבָם לְאָבוֹת וּבָנִים, אֱמֶת אַתָּה הוּא רִאשׁוֹן וְאַתָּה הוּא אַחֲרוֹן וּמִבַּלְעָדֶיךָ אֵין לָנוּ מֶלֶךְ גּוֹאֵל וּמוֹשִׁיעַ. אֱמֶת מִמִּצְרַיִם גְּאַלְתָּנוּ יְהֹוָה אֱלֹהֵינוּ, מִבֵּית עֲבָדִים פְּדִיתָנוּ, כָּל בְּכוֹרֵיהֶם הָרַגְתָּ, וּבְכוֹרְךָ יִשְׂרָאֵל גָּאַלְתָּ, וְיַם־סוּף לָהֶם בָּקַעְתָּ, וְזֵדִים טִבַּעְתָּ, וִידִידִים עָבְרוּ יָם. וַיְכַסּוּ מַיִם צָרֵיהֶם אֶחָד מֵהֶם לֹא נוֹתַר. עַל זֹאת שִׁבְּחוּ אֲהוּבִים, וְרוֹמְמוּ לָאֵל, וְנָתְנוּ יְדִידִים זְמִירוֹת שִׁירוֹת וְתִשְׁבָּחוֹת בְּרָכוֹת וְהוֹדָאוֹת לַמֶּלֶךְ אֶל חַי וְקַיָּם, רָם וְנִשָּׂא, גָּדוֹל וְנוֹרָא, מַשְׁפִּיל גֵּאִים עֲדֵי אָרֶץ, מַגְבִּיהַּ שְׁפָלִים עַד מָרוֹם, מוֹצִיא אֲסִירִים, פּוֹדֶה עֲנָוִים, עוֹזֵר דַּלִּים, הָעוֹנֶה לְעַמּוֹ יִשְׂרָאֵל בְּעֵת שַׁוְּעָם אֵלָיו."));
  parts.push(p("<small>תכף בתחלת מלת תהלות יקום לעמוד ויסיים מלת תהלות מעומד <small>(בא\"ח שמות ה\"ח)</small></small> "));
  parts.push(p("<b>תְהִילוֹת</b> לָאֵל עֶלְיוֹן גּוֹאֲלָם, בָּרוּךְ הוּא וּמְבוֹרָךְ, מֹשֶׁה וּבְנֵי יִשְׂרָאֵל לְךָ עָנוּ שִׁירָה בְשִׂמְחָה רַבָּה, וְאָמְרוּ כֻלָּם: מִֽי־כָמֹ֤כָה בָּֽאֵלִם֙ יְהֹוָ֔ה מִ֥י כָּמֹ֖כָה נֶאְדָּ֣ר בַּקֹּ֑דֶשׁ נוֹרָ֥א תְהִלֹּ֖ת עֹ֥שֵׂה פֶֽלֶא׃ שִׁירָה חֲדָשָׁה שִׁבְּחוּ גְאוּלִים לְשִׁמְךָ הַגָּדוֹל עַל שְׂפַת הַיָּם, יַחַד כֻלָּם הוֹדוּ וְהִמְלִיכוּ וְאָמְרוּ: יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד׃ וְנֶאֱמַר: גֹּאֲלֵ֕נוּ יְהֹוָ֥ה צְבָא֖וֹת שְׁמ֑וֹ קְד֖וֹשׁ יִשְׂרָאֵֽל׃ בָּרוּךְ אַתָּה יְהֹוָה גָּאַל יִשְׂרָאֵל: "));
  parts.push(hr);

  // ─────────────────────────── עמידה לשחרית ───────────────────────────
  parts.push(p("<big><b>עמידה לשחרית של יום חול</b></big>"));
  parts.push(p("<b>אֲ֭דֹנָי</b> שְׂפָתַ֣י תִּפְתָּ֑ח וּ֝פִ֗י יַגִּ֥יד תְּהִלָּתֶֽךָ׃"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ וֵֽאלֹהֵי אֲבוֹתֵֽינוּ, אֱלֹהֵי אַבְרָהָם, אֱלֹהֵי יִצְחָק, וֵֽאלֹהֵי יַעֲקֹב. הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא, אֵל עֶלְיוֹן, גּוֹמֵל חֲסָדִים טוֹבִים, קוֹנֵה הַכֹּל, וְזוֹכֵר חַסְדֵּי אָבוֹת, וּמֵבִיא גוֹאֵל לִבְנֵי בְנֵיהֶם לְמַֽעַן שְׁמוֹ בְּאַֽהֲבָה: <small><small>בעשרת ימי תשובה אומרים:</small> זָכְרֵנוּ לְחַיִּים, מֶלֶךְ חָפֵץ בַּחַיִּים, כָּתְבֵנוּ בְּסֵפֶר חַיִּים, לְמַעַנָךְ אֱלֹהִים חַיִּים.</small> מֶֽלֶךְ עוֹזֵר וּמוֹשִֽׁיעַ וּמָגֵן: בָּרוּךְ אַתָּה יַהַוַהַ, מָגֵן אַבְרָהָם:"));
  parts.push(p("<b>אַתָּה</b> גִבּוֹר לְעוֹלָם אֲדֹנָי, מְחַיֶּה מֵתִים אַתָּה, רַב לְהוֹשִֽׁיעַ."));
  parts.push(p("<small>בקיץ:</small> מוֹרִיד הַטָּל. <small>בחורף:</small> מַשִּׁיב הָרֽוּחַ וּמוֹרִיד הַגֶּֽשֶׁם. "));
  parts.push(p("מְכַלְכֵּל חַיִּים בְּחֶֽסֶד, מְחַיֵּה מֵתִים בְּרַֽחֲמִים רַבִּים, סוֹמֵךְ נֽוֹפְלִים, וְרוֹפֵא חוֹלִים, וּמַתִּיר אֲסוּרִים, וּמְקַיֵּם אֱמֽוּנָתוֹ לִֽישֵׁנֵי עָפָר. מִי כָמֽוֹךָ בַּֽעַל גְּבוּרוֹת, וּמִי דֽוֹמֶה לָךְ, מֶֽלֶךְ מֵמִית וּמְחַיֶּה וּמַצְמִֽיחַ יְשׁוּעָה. <small><small>בעשרת ימי תשובה אומרים:</small> מִי כָמוֹךָ אָב הָרַחֲמָן, זוֹכֵר יְצוּרָיו בְּרַחֲמִים לְחַיִּים.</small> וְנֶֽאֱמָן אַתָּה לְהַֽחֲיוֹת מֵתִים: בָּרוּךְ אַתָּה יֵהֵוֵהֵ, מְחַיֵּה הַמֵּתִים:"));
  parts.push(p("<small>קדושה</small>"));
  parts.push(p("<small>בחזרת הש\"ץ אומרים</small>"));
  parts.push(p("<small><b>נַקְדִּישָׁךְ וְנַעֲרִיצָךְ</b>, כְּנֹֽעַם שִֽׂיחַ סוֹד שַׂרְפֵי קֹֽדֶשׁ, הַמְשַׁלְּשִׁים לְךָ קְדֻשָּׁה, וְכֵן כָּתוּב עַל יַד נְבִיאָךְ: וְקָרָ֨א זֶ֤ה אֶל־זֶה֙ וְאָמַ֔ר <b>קָד֧וֹשׁ ׀ קָד֛וֹשׁ קָד֖וֹשׁ יְהֹוָ֣ה צְבָא֑וֹת מְלֹ֥א כָל־הָאָ֖רֶץ כְּבוֹדֽוֹ׃</b> לְעֻמָּתָם מְשַׁבְּחִים וְאוֹמְרִים: <b>בָּר֥וּךְ כְּבוֹד־יְהֹוָ֖ה מִמְּקוֹמֽוֹ׃</b> וּבְדִבְרֵי קָדְשָׁךְ כָּתוּב לֵאמֹר: <b>יִמְלֹ֤ךְ יְהֹוָ֨ה ׀ לְעוֹלָ֗ם אֱלֹהַ֣יִךְ צִ֭יּוֹן לְדֹ֥ר וָדֹ֗ר הַֽלְלוּיָֽהּ:</b> </small>"));
  parts.push(p("<b>אַתָּה</b> קָדוֹשׁ וְשִׁמְךָ קָדוֹשׁ, וּקְדוֹשִׁים בְּכָל־יוֹם יְהַֽלְלֽוּךָ סֶּֽלָה: בָּרוּךְ אַתָּה יֹהֵוָהֵ, הָאֵל הַקָּדוֹשׁ: <small><small>בעשרת ימי תשובה אומרים:</small> הַמֶּלֶךְ הַקָּדוֹשׁ:</small>"));
  parts.push(p("<b>אַתָּה</b> חוֹנֵן לְאָדָם דַּֽעַת וּמְלַמֵּד לֶאֱנוֹשׁ בִּינָה. וְחָנֵּֽנוּ מֵאִתְּךָ חָכְמָה בִּינָה וָדָֽעַת: בָּרוּךְ אַתָּה יַהַוַהַ, חוֹנֵן הַדָּֽעַת:"));
  parts.push(p("<b>הֲשִׁיבֵֽנוּ</b> אָבִֽינוּ לְתֽוֹרָתֶֽךָ, וְקָֽרְבֵֽנוּ מַלְכֵּֽנוּ לַֽעֲבֽוֹדָתֶֽךָ, וְהַֽחֲזִירֵֽנוּ בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶֽיךָ: בָּרוּךְ אַתָּה יֵהֵוֵהֵ, הָרוֹצֶה בִּתְשׁוּבָה:"));
  parts.push(p("<b>סְלַח</b> לָֽנוּ אָבִֽינוּ כִּי חָטָֽאנוּ, מְחוֹל לָֽנוּ מַלְכֵּֽנוּ כִּי פָשָֽׁעְנוּ, כִּי אֵל טוֹב וְסַלָּח אָֽתָּה: בָּרוּךְ אַתָּה יֶהֶוֶהֶ, חַנּוּן הַמַּרְבֶּה לִסְלֹחַ:"));
  parts.push(p("<b>רְאֵה</b> נָא בְעָנְיֵֽנוּ, וְרִיבָֽה רִיבֵֽנוּ, וּמַהֵר לְגָאֳלֵֽנוּ גְאוּלָּה שְׁלֵמָה לְמַֽעַן שְׁמֶֽךָ, כִּי אֵל גּוֹאֵל חָזָק אָֽתָּה: בָּרוּךְ אַתָּה יְהְוְהְ, גּוֹאֵל יִשְׂרָאֵל:"));
  if (context.isFastDay) {
    parts.push(sup(p("<small>בתענית ציבור השליח ציבור אומר בחזרה</small>") + p("<small><b>עֲנֵֽנוּ</b> אָבִינוּ עֲנֵֽנוּ בְּיוֹם צוֹם הַתַּֽעֲנִית הַזֶּה, כִּי בְצָרָה גְדוֹלָה אֲנָֽחְנוּ. אַל־תֵּֽפֶן לְרִשְׁעֵֽנוּ, וְאַל־תִּתְעַלָּם מַלְכֵּֽנוּ מִבַּקָּשָׁתֵֽנוּ. הֱיֵה נָא קָרוֹב לְשַׁוְעָתֵֽנוּ, טֶֽרֶם נִקְרָא אֵלֶֽיךָ אַתָּה תַעֲנֶה, נְדַבֵּר וְאַתָּה תִשְׁמַע, כַּדָּבָר שֶׁנֶּאֱמַר: וְהָיָ֥ה טֶֽרֶם־יִקְרָ֖אוּ וַאֲנִ֣י אֶעֱנֶ֑ה ע֛וֹד הֵ֥ם מְדַבְּרִ֖ים וַאֲנִ֥י אֶשְׁמָֽע: כִּי אַתָּה יְהֹוָה פּוֹדֶה וּמַצִּיל, וְעוֹנֶה וּמְרַחֵם בְּכָל־עֵת צָרָה וְצוּקָה:</small>") + p("<small>בָּרוּךְ אַתָּה יְהֹוָה הָעוֹנֶה לְעַמּוֹ יִשְׂרָאֵל בְּעֵת צָרָה:</small>")));
  }
  parts.push(p("<b>רְפָאֵֽנוּ</b> יְהֹוָה וְנֵֽרָפֵא, הֽוֹשִׁיעֵֽנוּ וְנִוָּשֵֽׁעָה, כִּי תְהִלָּתֵֽנוּ אָֽתָּה, וְהַֽעֲלֵה אֲרוּכָה וּמַרְפֵּא לְכָל־תַּֽחֲלוּאֵֽינוּ וּלְכָל־מַכְאוֹבֵֽינוּ וּלְכָל־מַכּוֹתֵֽינוּ. כִּי אֵל רוֹפֵא רַחְמָן וְנֶֽאֱמָן אָֽתָּה: בָּרוּךְ אַתָּה יֹהֹוֹהֹ, רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל:"));
  if (isSummer) {
    parts.push(p("<small>בקיץ:</small>"));
    parts.push(p("<b>בָּֽרְכֵֽנוּ</b> יְהֹוָה אֱלֹהֵֽינוּ בְּכָל־מַֽעֲשֵׂי יָדֵֽינוּ, וּבָרֵךְ שְׁנָתֵֽנוּ בְּטַֽלְלֵי רָצוֹן בְּרָכָה וּנְדָבָה, וּתְהִי אַֽחֲרִיתָהּ חַיִּים וְשָׂבָע וְשָׁלוֹם כַּשָּׁנִים הַטּוֹבוֹת לִבְרָכָה, כִּי אֵל טוֹב וּמֵטִיב אַתָּה וּמְבָרֵךְ הַשָּׁנִים: בָּרוּךְ אַתָּה יִהִוִהִ, מְבָרֵךְ הַשָּׁנִים:"));
  } else {
    parts.push(p("<small>בחורף:</small> "));
    parts.push(p("<b>בָּרֵךְ עָלֵֽינוּ</b> יְהֹוָה אֱלֹהֵֽינוּ אֶת־הַשָּׁנָה הַזֹּאת וְאֶת־כָּל־מִינֵי תְּבוּאָתָהּ לְטוֹבָה, וְתֵן טַל וּמָטָר לִבְרָכָה עַל כָּל־פְּנֵי הָאֲדָמָה, וְרַוֵּה פְּנֵי תֵבֵל וְשַׂבַּע אֶת־הָעוֹלָם כֻּלּוֹ מִטּוּבָךְ, וּמַלֵּא יָדֵֽינוּ מִבִּרְכוֹתֶֽיךָ וּמֵעֹֽשֶׁר מַתְּנוֹת יָדֶֽיךָ. שָׁמְרָה וְהַצִּֽילָה שָׁנָה זוֹ מִכָּל־דָּבָר רָע, וּמִכָּל־מִינֵי מַשְׁחִית וּמִכָּל־מִינֵי פֻרְעָנוּת, וַעֲשֵׂה לָהּ תִּקְוָה טוֹבָה וְאַחֲרִית שָׁלוֹם. חוּס וְרַחֵם עָלֶֽיהָ וְעַל כָּל־תְּבוּאָתָהּ וּפֵירוֹתֶיהָ, וּבָֽרְכָֽהּ בְּגִשְׁמֵי רָצוֹן בְּרָכָה וּנְדָבָה, וּתְהִי אַחֲרִיתָהּ חַיִּים וְשָׂבָע וְשָׁלוֹם. כַּשָּׁנִים הַטּוֹבוֹת לִבְרָכָה, כִּי אֵל טוֹב וּמֵטִיב אַתָּה וּמְבָרֵךְ הַשָּׁנִים. בָּרוּךְ אַתָּה יִהִוִהִ, מְבָרֵךְ הַשָּׁנִים:"));
  }
  parts.push(p("<b>תְּקַע</b> בְּשׁוֹפָר גָּדוֹל לְחֵֽרוּתֵֽנוּ, וְשָׂא נֵס לְקַבֵּץ גָּֽלֻיּוֹתֵֽינוּ, וְקַבְּצֵֽנוּ יַֽחַד מֵאַרְבַּע כַּנְפוֹת הָאָֽרֶץ לְאַרְצֵֽנוּ: בָּרוּךְ אַתָּה יֻהֻוֻהֻ, מְקַבֵּץ נִדְחֵי עַמּוֹ יִשְׂרָאֵל:"));
  parts.push(p("<b>הָשִֽׁיבָה</b> שֽׁוֹפְטֵֽינוּ כְּבָרִֽאשׁוֹנָה, וְיֽוֹעֲצֵֽינוּ כְּבַתְּחִלָּה, וְהָסֵר מִמֶּֽנּוּ יָגוֹן וַֽאֲנָחָה. וּמְלוֹךְ עָלֵֽינוּ מְהֵרָה אַתָּה יְהֹוָה לְבַדְּךָ, בְּחֶֽסֶד וּבְרַֽחֲמִים, בְּצֶֽדֶק וּבְמִשְׁפָּט: בָּרוּךְ אַתָּה יוּהוּווּהוּ, מֶֽלֶךְ אוֹהֵב צְדָקָה וּמִשְׁפָּט: <small><small>בעשרת ימי תשובה אומרים:</small> הַמֶּלֶךְ הַמִּשְׁפָּט:</small> "));
  parts.push(p("<b>לַמִּינִים</b> וְלַמַּלְשִׁינִים אַל־תְּהִי תִקְוָה, וְכָל־הַזֵּדִים כְּרֶֽגַע יֹאבֵֽדוּ, וְכָל־אֽוֹיְבֶֽיךָ וְכָל־שֽׂוֹנְאֶֽיךָ מְהֵרָה יִכָּרֵֽתוּ, וּמַלְכוּת הָֽרִשְׁעָה מְהֵרָה תְעַקֵּר וּתְשַׁבֵּר וּתְכַלֵּם וְתַכְנִיעֵם בִּמְהֵרָה בְיָמֵֽינוּ: בָּרוּךְ אַתָּה יָהָוָהָ, שׁוֹבֵר אוֹיְבִים וּמַכְנִֽיעַ מִינִים:"));
  parts.push(p("<b>עַל</b> הַצַּדִּיקִים וְעַל הַֽחֲסִידִים, וְעַל שְׁאֵרִית עַמְּךָ בֵּית יִשְׂרָאֵל, וְעַל פְּלֵיטַת בֵּית סֽוֹפְרֵיהֶם, וְעַל גֵּרֵי הַצֶּֽדֶק וְעָלֵֽינוּ, יֶֽהֱמוּ נָא רַֽחֲמֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ, וְתֵן שָׂכָר טוֹב לְכָל־הַבּֽוֹטְחִים בְּשִׁמְךָ בֶּֽאֱמֶת, וְשִׂים חֶלְקֵֽנוּ עִמָּהֶם. וּלְעוֹלָם לֹא נֵבוֹשׁ כִּי בְךָ בָטָֽחְנוּ, וְעַל חַסְדְּךָ הַגָּדוֹל בֶּֽאֱמֶת נִשְׁעָֽנְנוּ: בָּרוּךְ אַתָּה יוּהוּווּהוּ, מִשְׁעָן וּמִבְטָח לַצַּדִּיקִים:"));
  parts.push(p("<b>תִּשְׁכּוֹן</b> בְּתוֹךְ יְרוּשָׁלַֽיִם עִֽירְךָ כַּאֲשֶׁר דִּבַּֽרְתָּ, וְכִסֵּא דָוִד עַבְדְּךָ מְהֵרָה בְּתוֹכָהּ תָּכִין, וּבְנֵה אוֹתָהּ בִּנְיַן עוֹלָם בִּמְהֵרָה בְיָמֵֽינוּ: בָּרוּךְ אַתָּה יֻהֻוֻהֻ, בּוֹנֵה יְרוּשָׁלָיִם: "));
  parts.push(p("<b>אֶת</b> צֶֽמַח דָּוִד עַבְדְּךָ מְהֵרָה תַצְמִֽיחַ, וְקַרְנוֹ תָּרוּם בִּישֽׁוּעָתֶֽךָ, כִּי לִֽישׁוּעָֽתְךָ קִוִּֽינוּ כָּל־הַיּוֹם: בָּרוּךְ אַתָּה יִהִוִהִ, מַצְמִֽיחַ קֶֽרֶן יְשׁוּעָה:"));
  parts.push(p("<b>שְׁמַע</b> קוֹלֵֽנוּ, יְהֹוָה אֱלֹהֵֽינוּ, אָב הָרַֽחֲמָן, רַחֵם עָלֵֽינוּ, וְקַבֵּל בְּרַֽחֲמִים וּבְרָצוֹן אֶת־תְּפִלָּתֵֽנוּ, כִּי אֵל שׁוֹמֵֽעַ תְּפִלּוֹת וְתַֽחֲנוּנִים אָֽתָּה. וּמִלְּפָנֶֽיךָ מַלְכֵּֽנוּ, רֵיקָם אַל־תְּשִׁיבֵֽנוּ, חָנֵּֽנוּ וַֽעֲנֵֽנוּ וּשְׁמַע תְּפִלָּתֵֽנוּ. "));
  parts.push(p("<small><small>בתענית אומר היחיד עננו, וכן שליח ציבור ששכח לומר בין גואל לרופא יאמר כאן עננו בלי חתימה<br><b>עֲנֵנוּ</b> אָבִינוּ עֲנֵנוּ בְּיוֹם צוֹם הַתַּֽעֲנִית הַזֶּה כִּי בְצָרָה גְדוֹלָה אֲנָֽחְנוּ. אַל־תֵּֽפֶן לְרִשְׁעֵֽנוּ, וְאַל־תִּתְעַלָּם מַלְכֵּֽנוּ מִבַּקָּשָׁתֵֽנוּ. הֱיֵה נָא קָרוֹב לְשַׁוְעָתֵֽנוּ. טֶֽרֶם נִקְרָא אֵלֶֽיךָ אַתָּה תַֽעֲנֶה, נְדַבֵּר וְאַתָּה תִשְׁמַע, כַּדָּבָר שֶׁנֶּאֱמַר: וְהָיָ֥ה טֶֽרֶם־יִקְרָ֖אוּ וַאֲנִ֣י אֶעֱנֶ֑ה ע֛וֹד הֵ֥ם מְדַבְּרִ֖ים וַאֲנִ֥י אֶשְׁמָֽע: כִּי אַתָּה יְהֹוָה פּוֹדֶה וּמַצִּיל וְעוֹנֶה וּמְרַחֵם בְּכָל־עֵת צָרָה וְצוּקָה.</small></small>"));
  parts.push(p("<small><small>נוסח עננו בג׳ צומות (סנסן ליעיר ג:ט)</small><br><b>עֲנֵֽנוּ</b> אָבִֽינוּ עֲנֵֽנוּ בְּיוֹם צוֹם הַתַּֽעֲנִית הַזֶּה כִּי בְצָרָה גְדוֹלָה אֲנָֽחְנוּ, עַל כָּל־אֲשֶׁר חָטָֽאנוּ עָוִֽינוּ פָּשַֽׁעְנוּ אֲנַֽחְנוּ וַאֲבוֹתֵֽינוּ, וְעַל יְדֵי זֶה חָֽרְבָֽה עִירֵֽנוּ וְשָׁמֵם מִקְדָּשֵֽׁנוּ, אוֹי וַאֲבוֹי לָנוּ כִּי עֲוֹנֹתֵֽינוּ הִטּוּ אֵֽלֶּה וּפְשָׁעֵֽינוּ הֶאֱרִיכוּ קִצֵּֽנוּ, אֵין לָֽנוּ פֶּה לְהָשִׁיב וְלֹא מֵֽצַח לְהָרִים רֹאשׁ, וּכְמוֹ צַֽעַר בְּנַפְשֵֽׁנוּ עַל חֻרְבַּן בֵּית הַמִּקְדָּשׁ וּבִטּוּל תּוֹרָה וַעֲבוֹדָה זֶה כַּמָּה מֵאוֹת שָׁנִים וְזֶה צַֽעַ״ר הַשָּׁמָֽיִם, אֲהָהּ עָלֵֽינוּ. לָכֵן עַתָּה שַֽׁבְנוּ אֵלֶֽיךָ בְּבֹֽשֶׁת וְחֶרְפָּה וּכְלִמָּה וּבְדֶֽמַע לֵב נְבַקְשָׁה מֵאֱלֹהֵֽינוּ מְרַחֵם, אָֽנָּֽא יְהֹוָה, יְהִי רָצוֹן מִלְּפָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁיְּהֵא מִעוּט חֶלְבֵּֽנוּ וְדָמֵֽינוּ הַמִּתְמָעֵט בְּתַעֲנִיתֵֽנוּ הַיּוֹם כַּחֵֽלֶב מֻנָּח עַל גַּבֵּי הַמִּזְבֵּֽחַ, שֶׁתְּכַפֵּר בּוֹ כָּל־חַטֹּאתֵֽינוּ עֲוֹנֹתֵֽינוּ וּפְשָׁעֵֽינוּ. הָאֵר פָּנֶֽיךָ עַל מִקְדָּֽשְׁךָֽ הַשָּׁמֵם לְמַֽעַן אֲדֹנָי, וּבָא לְצִיּוֹן גּוֹאֵל. אַל־תֵּֽפֶן לְרִשְׁעֵֽנוּ, וְאַל־תִּתְעַלָּם מַלְכֵּֽנוּ מִבַּקָּשָׁתֵֽנוּ. הֱיֵה נָא קָרוֹב לְשַׁוְעָתֵֽנוּ. טֶֽרֶם נִקְרָא אֵלֶֽיךָ אַתָּה תַֽעֲנֶה, נְדַבֵּר וְאַתָּה תִשְׁמַע, כַּדָּבָר שֶׁנֶּאֱמַר: וְהָיָ֥ה טֶֽרֶם־יִקְרָ֖אוּ וַאֲנִ֣י אֶעֱנֶ֑ה ע֛וֹד הֵ֥ם מְדַבְּרִ֖ים וַאֲנִ֥י אֶשְׁמָֽע: כִּי אַתָּה יְהֹוָה פּוֹדֶה וּמַצִּיל וְעוֹנֶה וּמְרַחֵם בְּכָל־עֵת צָרָה וְצוּקָה.</small>"));
  parts.push(p("כִּי אַתָּה שׁוֹמֵעַ תְּפִלַּת כָּל־פֶּה: בָּרוּךְ אַתָּה יֹהְוָה, שׁוֹמֵֽעַ תְּפִלָּה:"));
  parts.push(p("<b>רְצֵה</b> יְהֹוָה אֱלֹהֵֽינוּ בְּעַמְּךָ יִשְׂרָאֵל וְלִתְפִלָּתָם שְׁעֵה, וְהָשֵׁב הָֽעֲבוֹדָה לִדְבִיר בֵּיתֶֽךָ, וְאִשֵּׁי יִשְׂרָאֵל וּתְפִלָּתָם, מְהֵרָה בְּאַֽהֲבָה תְקַבֵּל בְּרָצוֹן, וּתְהִי לְרָצוֹן תָּמִיד עֲבוֹדַת יִשְׂרָאֵל עַמֶּֽךָ: "));
  if (context.isRoshChodesh || context.isPesach || context.isSukkot) {
    var yv = p("<small>בראש חודש ובחול המועד אומרים:</small>") + p("<small>אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, יַעֲלֶה וְיָבֹא, וְיַגִּֽיעַ וְיֵרָאֶה, וְיֵרָצֶה וְיִשָּׁמַע, וְיִפָּקֵד וְיִזָּכֵר, זִכְרוֹנֵֽנוּ וְזִכְרוֹן אֲבוֹתֵֽינוּ, זִכְרוֹן יְרוּשָׁלַֽיִם עִירָךְ, וְזִכְרוֹן מָשִֽׁיחַ בֶּן־דָּוִד עַבְדָּךְ, וְזִכְרוֹן כָּל־עַמְּךָ בֵּית יִשְׂרָאֵל לְפָנֶֽיךָ, לִפְלֵיטָה, לְטוֹבָה, לְחֵן, לְחֶֽסֶד וּלְרַחֲמִים, לְחַיִּים טוֹבִים וּלְשָׁלוֹם, בְּיוֹם</small> ") +
      (context.isRoshChodesh ? p("<small><small>בראש חדש:</small> רֹאשׁ חֹֽדֶשׁ הַזֶּה,</small>") : "") +
      (context.isPesach      ? p("<small><small>בחוה\"מ פסח:</small> חַג הַמַּצּוֹת הַזֶּה, בְּיוֹם מִקְרָא קֹֽדֶשׁ הַזֶּה,</small>") : "") +
      (context.isSukkot      ? p("<small><small>בחוה\"מ סוכות:</small> חַג הַסֻּכּוֹת הַזֶּה, בְּיוֹם מִקְרָא קֹֽדֶשׁ הַזֶּה,</small>") : "") +
      p("<small>לְרַחֵם בּוֹ עָלֵֽינוּ וּלְהוֹשִׁיעֵֽנוּ. זָכְרֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בּוֹ לְטוֹבָה, וּפָקְדֵֽנוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵֽנוּ בוֹ לְחַיִּים טוֹבִים, בִּדְבַר יְשׁוּעָה וְרַחֲמִים. חוּס וְחָנֵּֽנוּ, וַחֲמוֹל וְרַחֵם עָלֵֽינוּ, וְהוֹשִׁיעֵֽנוּ כִּי אֵלֶֽיךָ עֵינֵֽינוּ, כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה:</small> ");
    parts.push(sup(yv));
  }
  parts.push(p("<b>וְאַתָּה</b> בְּרַֽחֲמֶֽיךָ הָרַבִּים, תַּחְפֹּץ בָּֽנוּ וְתִרְצֵֽנוּ, וְתֶֽחֱזֶֽינָה עֵינֵֽינוּ בְּשֽׁוּבְךָ לְצִיּוֹן בְּרַֽחֲמִים: בָּרוּךְ אַתָּה יִהִוִהִ, הַמַּֽחֲזִיר שְׁכִֽינָתוֹ לְצִיּוֹן:"));
  parts.push(p("<small>בברכת \"מודים\" יכרע ב\"מודים\" ויזקוף בשם <small>(בא\"ח בשלח הכ\"א)</small></small>"));
  parts.push(p("<b>מוֹדִים</b> אֲנַֽחְנוּ לָךְ, שֶׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵֽאלֹהֵי אֲבוֹתֵֽינוּ לְעוֹלָם וָעֶד, צוּרֵֽנוּ צוּר חַיֵּֽינוּ וּמָגֵן יִשְׁעֵֽנוּ אַתָּה הוּא, לְדוֹר וָדוֹר נוֹדֶה לְךָ וּנְסַפֵּר תְּהִלָּתֶֽךָ, עַל חַיֵּֽינוּ הַמְּסוּרִים בְּיָדֶֽךָ, וְעַל נִשְׁמוֹתֵֽינוּ הַפְּקוּדוֹת לָךְ, וְעַל נִסֶּֽיךָ שֶׁבְּכָל־יוֹם עִמָּֽנוּ, וְעַל נִפְלְאוֹתֶֽיךָ וְטֽוֹבוֹתֶֽיךָ שֶׁבְּכָל־עֵת, עֶֽרֶב וָבֹֽקֶר וְצָֽהֳרָֽיִם. הַטּוֹב, כִּי לֹא כָלוּ רַחֲמֶֽיךָ, הַמְּרַחֵם, כִּי לֹא תַֽמּוּ חֲסָדֶֽיךָ, כִּי מֵֽעוֹלָם קִוִּֽינוּ לָךְ: "));
  parts.push(p("<small><b>מודים דרבנן</b></small>"));
  parts.push(p("<small>בחזרת הש\"ץ כשהחזן אומר מודים, הקהל אומרים:</small>"));
  parts.push(p("<small>מוֹדִים אֲנַחְנוּ לָךְ, שֶׁאַתָּה הוּא יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, אֱלֹהֵי כָל בָּשָׁר, יוֹצְרֵנוּ יוֹצֵר בְּרֵאשִׁית. בְּרָכוֹת וְהוֹדָאוֹת לְשִׁמְךָ הַגָּדוֹל וְהַקָּדוֹשׁ, עַל שֶׁהֶחֱיִיתָנוּ וְקִיַּמְתָּנוּ. כֵּן תְּחַיֵּנוּ וּתְחָנֵּנוּ וְתֶאֱסוֹף גָּלֻיּוֹתֵינוּ לְחַצְרוֹת קָדְשֶׁךָ, לִשְׁמֹר חֻקֶּיךָ וְלַעֲשׂוֹת רְצוֹנְךָ וּלְעָבְדְךָ בְלֵבָב שָׁלֵם, עַל שֶׁאֲנַחְנוּ מוֹדִים לָךְ, בָּרוּךְ אֵל הַהוֹדָאוֹת.</small>"));
  if (context.isChanukah || context.isPurim) {
    var han = p("<small>בחנוכה ופורים אומרים:</small>") + p("<small><b>עַל הַנִּסִּים</b> וְעַל הַפֻּרְקָן וְעַל הַגְּבוּרוֹת וְעַל הַתְּשׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בַּזְּמַן הַזֶּה:</small>") +
      (context.isChanukah ? p("<small><small>בחנוכה אומרים:</small> <b>בִּימֵי מַתִּתְיָה</b> בֶן־יוֹחָנָן כֹּהֵן גָּדוֹל. חַשְׁמוֹנָאִי וּבָנָיו כְּשֶׁעָֽמְדָֽה מַלְכוּת יָוָן הָרְשָׁעָה עַל עַמְּךָ יִשְׂרָאֵל. לְשַׁכְּחָם תּוֹרָתָךְ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנָךְ. וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים עָמַֽדְתָּ לָהֶם בְּעֵת צָרָתָם. רַֽבְתָּ אֶת רִיבָם. דַּֽנְתָּ אֶת דִּינָם. נָקַֽמְתָּ אֶת נִקְמָתָם. מָסַֽרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים. וְרַבִּים בְּיַד מְעַטִּים. וּרְשָׁעִים בְּיַד צַדִּיקִים. וּטְמֵאִים בְּיַד טְהוֹרִים. וְזֵדִים בְּיַד עֽוֹסְקֵֽי תוֹרָתֶֽךָ. לְךָ עָשִֽׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמָךְ. וּלְעַמְּךָ יִשְׂרָאֵל עָשִֽׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה. וְאַחַר כָּךְ בָּֽאוּ בָנֶֽיךָ לִדְבִיר בֵּיתֶֽךָ. וּפִנּוּ אֶת־הֵיכָלֶֽךָ. וְטִהֲרוּ אֶת־מִקְדָּשֶֽׁךָ. וְהִדְלִֽיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶֽׁךָ. וְקָֽבְעֽוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵֽלּוּ בְּהַלֵּל וּבְהוֹדָאָה. וְעָשִֽׂיתָ עִמָּהֶם נִסִּים וְנִפְלָאוֹת וְנוֹדֶה לְשִׁמְךָ הַגָּדוֹל סֶֽלָה:</small>") : p("<small><small>בפורים אומרים</small> <b>בִּימֵי מָרְדְּכַי</b> וְאֶסְתֵּר בְּשׁוּשַׁן הַבִּירָה. כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע. בִּקֵּשׁ לְהַשְׁמִיד לַהֲרֹג וּלְאַבֵּד אֶת־כָּל־הַיְּהוּדִים מִנַּֽעַר וְעַד זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד. בִּשְׁלֹשָׁה עָשָׂר לְחֹֽדֶשׁ שְׁנֵים עָשָׂר. הוּא חֹֽדֶשׁ אֲדָר. וּשְׁלָלָם לָבוֹז. וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים הֵפַֽרְתָּ אֶת־עֲצָתוֹ וְקִלְקַֽלְתָּ אֶת־מַחֲשַׁבְתּוֹ. וַהֲשֵׁבֽוֹתָ לּוֹ גְּמוּלוֹ בְרֹאשׁוֹ. וְתָלוּ אוֹתוֹ וְאֶת־בָּנָיו עַל הָעֵץ. וְעָשִֽׂיתָ עִמָּהֶם נֵס וָפֶֽלֶא וְנוֹדֶה לְשִׁמְךָ הַגָּדוֹל סֶֽלָה:</small>"));
    parts.push(sup(han));
  }
  parts.push(p("<b>וְעַל</b> כֻּלָּם יִתְבָּרַךְ, וְיִתְרוֹמָם, וְיִתְנַשֵּׂא, תָּמִיד, שִׁמְךָ מַלְכֵּֽנוּ, לְעוֹלָם וָעֶד. וְכָל־הַחַיִּים יוֹדֽוּךָ סֶּֽלָה: <small><small>בעשרת ימי תשובה אומרים:</small> וּכְתֹב לְחַיִּים טוֹבִים כָּל בְּנֵי בְרִיתֶךָ.</small> וִֽיהַֽלְלוּ וִֽיבָֽרְכוּ אֶת־שִׁמְךָ הַגָּדוֹל בֶּֽאֱמֶת לְעוֹלָם כִּי טוֹב, הָאֵל יְשֽׁוּעָתֵֽנוּ וְעֶזְרָתֵֽנוּ סֶֽלָה, הָאֵל הַטּוֹב:  בָּרוּךְ אַתָּה יֻהֻוֻהֻ, הַטּוֹב שִׁמְךָ וּלְךָ נָאֶה לְהוֹדוֹת:"));
  parts.push(p("ברכת כהנים "));
  parts.push(p("<small><small>כשעוקר הכהן רגליו לישא כפיו יאמר (בא\"ח תצוה י\"ב)</small></small><br><small>לְשֵׁם יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ. בִּדְחִֽילוּ וּרְחִֽימוּ. וּרְחִֽימוּ וּדְחִֽילוּ. לְיַחֲדָא שֵׁם יוֹ\"ד קֵ\"א בְּוָא\"ו קֵ\"א בְּיִחוּדָא שְׁלִים. בְּשֵׁם כָּל־יִשְׂרָאֵל הִנֵּה אָנֹכִי מוּכָן וּמְזוּמָן לְקַיֵּם מִצְוַת עֲשֵׂה לְבָרֵךְ אֶת יִשְׂרָאֵל בִּרְכַּת כֹּהַנִים בִּנְשִׂיאוּת כַּפַּיִם, לַעֲשׂוֹת נַֽחַת רֽוּחַ לְיֽוֹצְרֵֽנוּ וּלְהַמְשִׁיךְ שֶׁפַע וּבְרָכָה לְכָל־הָעוֹלָמוֹת וְלַעֲשׂוֹת רְצוֹן בּֽוֹרְאֵֽנוּ. וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ: </small>"));
  parts.push(p("<small><small>וכשעומדים הכהנים על הדוכן לאחר שענו \"מודים דרבנן\", אומרים</small></small><br><small>יְהִי רָצוֹן מִלְּפָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתִּהְיֶה בְּרָכָה זוֹ שֶׁצִּּוִיתָֽנוּ לְבָרֵךְ אֶת־עַמְּךָ יִשְׂרָאֵל בְּרָכָה שְׁלֵמָה וְלֹא יִהְיֶה בָהּ מִכְשׁוֹל וְעָוֹן מֵעַתָּה וְעַד עוֹלָם:</small>"));
  parts.push(p("<small>בחזרת הש\"ץ אומרים ברכת כהנים, אם יש יותר מכהן אחד קורא להם החזן: כֹּהֲנִים: הכהנים מברכים:</small><br><small>בָּרוּךְ אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָֽעוֹלָם, אֲשֶׁר קִדְּשָֽׁנוּ בִּקְדֻשָּׁתוֹ שֶׁל־אַֽהֲרֹן, וְצִוָּֽנוּ לְבָרֵךְ אֶת־עַמּוֹ יִשְׂרָאֵל בְּאַֽהֲבָה: <small>הקהל עונים</small> אָמֵן:</small>"));
  parts.push(p("<small>ואומר החזן והכהנים אחריו מילה במילה:</small>"));
  parts.push(p("<small>יְבָרֶכְךָ֥ יְהֹוָ֖ה וְיִשְׁמְרֶֽךָ׃ <small>ועונים</small> אָמֵן:</small>"));
  parts.push(p(" <small>יָאֵ֨ר יְהֹוָ֧ה ׀ פָּנָ֛יו אֵלֶ֖יךָ וִֽיחֻנֶּֽךָּ׃ <small>ועונים</small> אָמֵן:</small>"));
  parts.push(p(" <small>יִשָּׂ֨א יְהֹוָ֤ה ׀ פָּנָיו֙ אֵלֶ֔יךָ וְיָשֵׂ֥ם לְךָ֖ שָׁלֽוֹם׃ <small>ועונים</small> אָמֵן:</small>"));
  parts.push(p("<small><small>אם אין כהנים אומר החזן:</small></small>"));
  parts.push(p("<small><b>אֱלֹהֵינוּ</b> וֵאלֹהֵי אֲבוֹתֵינוּ, בָּרְכֵנוּ בַּבְּרָכָה הַמְשֻׁלֶּשֶת בַּתּוֹרָה הַכְּתוּבָה עַל יְדֵי מֹשֶׁה עַבְדֶּֽךָ, הָאֲמוּרָה מִפִּי אַהֲרֹן וּבָנָיו הַכֹּהֲנִים עַם קְדוֹשֶׁיךָ כָּאָמוּר:</small>"));
  parts.push(p("<small>יְבָרֶכְךָ֥ יְהֹוָ֖ה וְיִשְׁמְרֶֽךָ׃ <small>ועונים</small> כֵּן יְהִי רָצוֹן:</small>"));
  parts.push(p(" <small>יָאֵ֨ר יְהֹוָ֧ה ׀ פָּנָ֛יו אֵלֶ֖יךָ וִֽיחֻנֶּֽךָּ׃ <small>ועונים</small> כֵּן יְהִי רָצוֹן:</small>"));
  parts.push(p(" <small>יִשָּׂ֨א יְהֹוָ֤ה ׀ פָּנָיו֙ אֵלֶ֔יךָ וְיָשֵׂ֥ם לְךָ֖ שָׁלֽוֹם׃ <small>ועונים</small> כֵּן יְהִי רָצוֹן: וְשָׂמ֥וּ אֶת־שְׁמִ֖י עַל־בְּנֵ֣י יִשְׂרָאֵ֑ל וַאֲנִ֖י אֲבָרְכֵֽם:</small>"));
  parts.push(p("<small>כשמתחיל שליח ציבור \"שים שלום\" מחזירין כהנים פניהם כלפי ההיכל ואומרים:</small>"));
  parts.push(p("<small>רִבּוֹן הָעוֹלָמִים עָשִֽׂינוּ מַה־שֶּׁגָּזַֽרְתָּ עָלֵֽינוּ, עַשֵׂה אַתָּה מַה־שֶּׁהִבְטָחְתָּֽנוּ. הַשְׁקִ֩יפָה֩ מִמְּע֨וֹן קׇדְשְׁךָ֜ מִן־הַשָּׁמַ֗יִם וּבָרֵ֤ךְ אֶֽת־עַמְּךָ֙ אֶת־יִשְׂרָאֵ֔ל:</small>"));
  parts.push(p("<b>שִׂים</b> שָׁלוֹם טוֹבָה וּבְרָכָה, חַיִּים חֵן וָחֶֽסֶד וְרַֽחֲמִים, עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל עַמֶּֽךָ. וּבָֽרְכֵֽנוּ אָבִֽינוּ כֻּלָּֽנוּ כְּאֶחָד בְּאוֹר פָּנֶֽיךָ, כִּי בְאוֹר פָּנֶֽיךָ נָתַֽתָּ לָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ תּוֹרָה וְחַיִּים, אַֽהֲבָה וָחֶֽסֶד, צְדָקָה וְרַֽחֲמִים, בְּרָכָה וְשָׁלוֹם. וְטוֹב בְּעֵינֶֽיךָ לְבָֽרְכֵֽנוּ וּלְבָרֵךְ אֶת־כָּל־עַמְּךָ יִשְׂרָאֵל, בְּרֹב עֹז וְשָׁלוֹם: <small><small>בעשרת ימי תשובה אומרים:</small> וּבְסֵפֶר חַיִּים, בְּרָכָה וְשָׁלוֹם, וּפַרְנָסָה טוֹבָה וִישׁוּעָה וְנֶחָמָה, וּגְזֵרוֹת טוֹבוֹת, נִזָּכֵר וְנִכָּתֵב לְפָנֶיךָ, אֲנַחְנוּ וְכָל עַמְּךָ בֵּית יִשְׂרָאֵל, לְחַיִּים טוֹבִים וּלְשָׁלוֹם.</small> בָּרוּךְ אַתָּה יוּהוּווּהוּ, הַמְּבָרֵךְ אֶת עַמּוֹ יִשְׂרָאֵל בַּשָּׁלוֹם. אָמֵן: "));
  parts.push(p("<b>יִֽהְי֥וּ</b> לְרָצ֨וֹן ׀ אִמְרֵי־פִ֡י וְהֶגְי֣וֹן לִבִּ֣י לְפָנֶ֑יךָ יְ֝הֹוָ֗ה צוּרִ֥י וְגֹאֲלִֽי׃"));
  parts.push(p("<b>אֱלֹהַי</b>, נְצֹר לְשׁוֹנִי מֵרָע וְשִׂפְתוֹתַי מִדַּבֵּר מִרְמָה, וְלִמְקַלְלַי נַפְשִׁי תִדֹּם, וְנַפְשִׁי כֶּֽעָפָר לַכֹּל תִּֽהְיֶה, פְּתַח לִבִּי בְּתוֹרָתֶֽךָ, וְאַחֲרֵי מִצְוֹתֶֽיךָ תִּרְדֹּף נַפְשִׁי. וְכָל־הַקָּמִים עָלַי לְרָעָה, מְהֵרָה הָפֵר עֲצָתָם וְקַלְקֵל מַחְשְׁבוֹתָם. <small>יִֽהְי֗וּ כְּמֹ֥ץ לִפְנֵי־ר֑וּחַ וּמַלְאַ֖ךְ יְהֹוָ֣ה דּוֹחֶֽה. קַבֵּל רִנַּת עַמֶּךָ. שַׂגְּבֵנוּ טַהֲרֵנוּ נוֹרָא.</small> עֲשֵׂה לְמַֽעַן שְׁמָךְ, עֲשֵׂה לְמַֽעַן יְמִינָךְ, עֲשֵׂה לְמַֽעַן תּֽוֹרָתָךְ, עֲשֵׂה לְמַֽעַן קְדֻשָּׁתָךְ. "));
  parts.push(p("<small>סגולה לומר פסוק המתחיל וגומר באות שמתחיל וגומר שמו</small> לְ֭מַעַן יֵחָלְצ֣וּן יְדִידֶ֑יךָ הוֹשִׁ֖יעָה יְמִֽינְךָ֣ וַעֲנֵֽנִי:"));
  parts.push(p("<b>יִֽהְי֥וּ</b> לְרָצ֨וֹן ׀ אִמְרֵי־פִ֡י וְהֶגְי֣וֹן לִבִּ֣י לְפָנֶ֑יךָ יְ֝הֹוָ֗ה צוּרִ֥י וְגֹאֲלִֽי׃ <br><br><small>יש אומרים תפילת רב מגמרה ברכות ט\"ז ע\"ב שכתב החיד\"א ז\"ל בסידורו<br>יְהִי רָצוֹן מִלְּפָנֶיךָ, יְהֹוָה אֱלהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁתִתֶּן לָֽנוּ חַיִּים אֲרוּכִים, חַיִּים שֶׁל שָׁלוֹם, חַיִּים שֶׁל טוֹבָה, חַיִּים שֶׁל בְּרָכָה, חַיִּים שֶׁל פַּרְנָסָה, חַיִּים שֶׁל חִלּוּץ עֲצָמוֹת, חַיִּים שֶׁיֵשׁ בָּהֶם יִרְאַת חֵטְא, חַיִּים שֶׁאֵין בָּהֶם בּוּשָׁה וּכְלִמָּה, חַיִּים שֶׁל עֹֽשֶׁר וְכָבוֹד, חַיִּים שֶׁתְּהֵא בָֽנוּ אַהֲבַת תּוֹרָה וְיִרְאַת שָׁמַֽיִם, חַיִּים שֶׁתְּמַּלֵא אֶת־כָל־מִשְׁאֲלוֹת לִבֵּֽנוּ לְטוֹבָה:</small>"));
  parts.push(p("<b>עֹשֶׂה</b> שָׁלוֹם <small><small>בעשרת ימי תשובה אומר:</small> הַשָּׁלוֹם</small> בִּמְרוֹמָיו, הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ, וְעַל כָּל־עַמּוֹ יִשְׂרָאֵל, וְאִמְרוּ אָמֵן:"));
  parts.push(p("<small>יְהִי רָצוֹן מִלְּפָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ וֵֽאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁתִּבְנֶה בֵּית הַמִּקְדָשׁ בִּמְהֵרָה בְיָמֵֽינוּ, וְתֵן חֶלְקֵֽנוּ בְתוֹרָתָךְ לַעֲשׂוֹת חֻקֵּי רְצוֹנָךְ וּלְעָבְדָךְ בְּלֵבָב שָׁלֵם:</small>"));
  if (isHallelDay) {
    parts.push(p("<small>בראש חודש אומרים כאן הלל</small> "));
  }
  if (context.isYamimNoraim) {
    var am_parts = [];
    am_parts.push(p("<small>בעשרת ימי תשובה אומרים:</small>"));
    am_parts.push(p("<small><b>אָבִינוּ מַלְכֵּנוּ</b> חָטָאנוּ לְפָנֶיךָ רַחֵם עָלֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ אֵין לָנוּ מֶלֶךְ אֶלָּא אָתָּה:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ עֲשֵׂה עִמָּנוּ לְמַעַן שְׁמֶךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ חַדֵּשׁ עָלֵינוּ שָׁנָה טוֹבָה:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ בַּטֵּל מֵעָלֵינוּ כָּל־גְּזֵרוֹת קָשׁוֹת וְרָעוֹת:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ בַּטֵּל מַחְשְׁבוֹת שֹׂנְאֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ הָפֵר עֲצַת אוֹיְבֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כַּלֵּה כָּל צַר וּמַשְׂטִין מֵעָלֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כַּלֵּה דֶבֶר וְחֶרֶב וְרָעָה וְרָעָב וּשְׁבִי וּבִזָּה וּמַשְׁחִית וּמַגֵּפָה וְיֵצֶר הָרָע וְחוֹלָאִים רָעִים מִבְּנֵי בְרִיתֶךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ שְׁלַח רְפוּאָה שְׁלֵמָה לְכָל חוֹלֵי עַמֶּךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ מְנַע מַגֵּפָה מִנַּחֲלָתֶךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ זָכוּר כִּי עָפָר אֲנָחְנוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ מְחוֹל וּסְלַח לְכָל עֲוֹנוֹתֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ קְרַע רוֹעַ גְּזַר דִּינֵנוּ: <small>(יכוין בשם קר\"ע שט\"ן)</small></small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ מְחוֹק בְּרַחֲמֶיךָ הָרַבִּים כָּל שִׁטְרֵי חוֹבוֹתֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ מְחֵה וְהַעֲבֵר פְּשָׁעֵינוּ מִנֶּגֶד עֵינֶיךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר חַיִּים טוֹבִים:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר צַדִּיקִים וַחֲסִידִים:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר יְשָׁרִים וּתְמִימִים:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר פַּרְנָסָה וְכַלְכָּלָה טוֹבָה:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר מְחִילָה וּסְלִיחָה וְכַפָּרָה:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ כָּתְבֵנוּ בְּסֵפֶר גְּאֻלָּה וִישׁוּעָה:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ זָכְרֵנוּ בְּזִכְרוֹן טוֹב מִלְּפָנֶיךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ הַצְמַח לָנוּ יְשׁוּעָה בְּקָרוֹב:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ הָרֵם קֶרֶן יִשְׂרָאֵל עַמֶּךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ וְהָרֵם קֶרֶן מְשִׁיחֶךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ חָנֵּנוּ וַעֲנֵנוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ הַחֲזִירֵנוּ בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶיךָ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ שְׁמַע קוֹלֵנוּ חוּס וְרַחֵם עָלֵינוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ עֲשֵׂה לְמַעֲנָךְ אִם לֹא לְמַעֲנֵנוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ קַבֵּל בְּרַחֲמִים וּבְרָצוֹן אֶת תְּפִלָּתֵנוּ:</small>"));
    am_parts.push(p("<small>אָבִינוּ מַלְכֵּנוּ אַל תְּשִׁיבֵנוּ רֵיקָם מִלְּפָנֶיךָ:</small>"));
    parts.push(sup(am_parts.join('')));
  }
  if (!isTachanunDay) {
    parts.push(p("<small>בימים שאין בהם תחנון אומרים</small> "));
    parts.push(p("<b>יְהִ֤י</b> שֵׁ֣ם יְהֹוָ֣ה מְבֹרָ֑ךְ מֵ֝עַתָּ֗ה וְעַד־עוֹלָֽם׃ מִמִּזְרַח־שֶׁ֥מֶשׁ עַד־מְבוֹא֑וֹ מְ֝הֻלָּ֗ל שֵׁ֣ם יְהֹוָֽה׃ רָ֖ם עַל־כׇּל־גּוֹיִ֥ם ׀ יְהֹוָ֑ה עַ֖ל הַשָּׁמַ֣יִם כְּבוֹדֽוֹ׃ יְהֹוָ֥ה אֲדֹנֵ֑ינוּ מָה־אַדִּ֥יר שִׁ֝מְךָ֗ בְּכׇל־הָאָֽרֶץ׃<br><br><small>ואחר כך אומר הש''צ חצי קדיש</small>"));
  }
  parts.push(hr);

  // ─────────────────────────── וידוי ותחנון ───────────────────────────
  if (isTachanunDay) {
    var vd = [];
    vd.push(p("<big><b>וידוי</b></big>"));
    vd.push(p("<b>אָנָּא</b> יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. תָּבֹא לְפָנֶיךָ תְּפִלָּתֵנוּ. וְאַל־תִּתְעַלַּם מַלְכֵּנוּ מִתְּחִנָּתֵנוּ. שֶׁאֵין אֲנַחְנוּ עַזֵּי פָנִים וּקְשֵׁי עֹרֶף לוֹמַר לְפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ צַדִּיקִים אֲנַחְנוּ וְלֹא חָטָאנוּ. אֲבָל חָטָאנוּ. עָוִינוּ. פָּשַׁעְנוּ. אֲנַחְנוּ וַאֲבוֹתֵינוּ וְאַנְשֵׁי בֵיתֵנוּ: <b>אָ</b>שַׁמְנוּ. <b>בָּ</b>גַדְנוּ. <b>גָּ</b>זַלְנוּ. <b>דִּ</b>בַּרְנוּ דֹפִי וְלָשׁוֹן הָרָע. <b>הֶ</b>עֱוִינוּ. <b>וְ</b>הִרְשַׁעְנוּ. <b>זַ</b>דְנוּ. <b>חָ</b>מַסְנוּ. <b>טָ</b>פַלְנוּ שֶׁקֶר וּמִרְמָה. <b>יָ</b>עַצְנוּ עֵצוֹת רָעוֹת. <b>כִּ</b>זַּבְנוּ. כָּעַסְנוּ. <b>לַ</b>צְנוּ. <b>מָ</b>רַדְנוּ. מָרִינוּ דְבָרֶיךָ. <b>נִ</b>אַצְנוּ. נִאַפְנוּ. <b>סָ</b>רַרְנוּ. <b>עָ</b>וִינוּ. <b>פָּ</b>שַׁעְנוּ. פָּגַמְנוּ. <b>צָ</b>רַרְנוּ. צִעַרְנוּ אָב וָאֵם. <b>קִ</b>שִּׁינוּ עֹרֶף. <b>רָ</b>שַׁעְנוּ. <b>שִׁ</b>חַתְנוּ. <b>תִּ</b>עַבְנוּ. תָּעִינוּ וְתִעֲתַעְנוּ. וְסַרְנוּ מִמִּצְוֹתֶיךָ וּמִמִּשְׁפָּטֶיךָ הַטּוֹבִים וְלֹא שָׁוָה לָנוּ. וְאַתָּה צַדִּיק עַל־כָּל־הַבָּא עָלֵינוּ. כִּי אֱמֶת עָשִׂיתָ. וַאֲנַחְנוּ הִרְשָׁעְנוּ: "));
    vd.push(p("<b>אֵל</b> אֶרֶךְ אַפַּיִם אַתָּה וּבַעַל הָרַחֲמִים. גְּדֻלַּת רַחֲמֶיךָ וַחֲסָדֶיךָ הוֹדַעְתָּ לֶעָנָו מִקֶּדֶם. וְכֵן כָּתוּב בְּתוֹרָתָךְ. וַיֵּ֤רֶד יְהֹוָה֙ בֶּֽעָנָ֔ן וַיִּתְיַצֵּ֥ב עִמּ֖וֹ שָׁ֑ם וַיִּקְרָ֥א בְשֵׁ֖ם יְהֹוָֽה: וְשָׁם נֶאֱמַר:  "));
    vd.push(p("<b>וַיַּעֲבֹ֨ר</b> יְהֹוָ֥ה ׀ עַל־פָּנָיו֮ וַיִּקְרָא֒ יְהֹוָ֣ה ׀ יְהֹוָ֔ה אֵ֥ל רַח֖וּם וְחַנּ֑וּן אֶ֥רֶךְ אַפַּ֖יִם וְרַב־חֶ֥סֶד וֶאֱמֶֽת׃ נֹצֵ֥ר‏ חֶ֙סֶד֙ לָאֲלָפִ֔ים נֹשֵׂ֥א עָוֺ֛ן וָפֶ֖שַׁע וְחַטָּאָ֑ה וְנַקֵּה֙:  "));
    vd.push(p("<b>רַחוּם וְחַנּוּן</b> חָטָאנוּ לְפָנֶיךָ רַחֵם עָלֵינוּ וְהושִׁיעֵנוּ: "));
    vd.push(p("<small>ישב ויאמר</small> "));
    vd.push(p("<b>לְדָוִ֡ד</b> <small>(תהלים כה)</small> אֵלֶ֥יךָ יְ֝הֹוָ֗ה נַפְשִׁ֥י אֶשָּֽׂא׃ אֱֽלֹהַ֗י בְּךָ֣ בָ֭טַחְתִּי אַל־אֵב֑וֹשָׁה אַל־יַעַלְצ֖וּ אוֹיְבַ֣י לִֽי׃ גַּ֣ם כָּל־קֹ֭וֶיךָ לֹ֣א יֵבֹ֑שׁוּ יֵ֝בֹ֗שׁוּ הַבּוֹגְדִ֥ים רֵיקָֽם׃ דְּרָכֶ֣יךָ יְ֭הֹוָה הוֹדִיעֵ֑נִי אֹ֖רְחוֹתֶ֣יךָ לַמְּדֵֽנִי׃ הַדְרִ֘יכֵ֤נִי בַאֲמִתֶּ֨ךָ ׀ וְֽלַמְּדֵ֗נִי כִּֽי־אַ֭תָּה אֱלֹהֵ֣י יִשְׁעִ֑י אוֹתְךָ֥ קִ֝וִּ֗יתִי כׇּל־הַיּֽוֹם׃ זְכֹר־רַחֲמֶ֣יךָ יְ֭הֹוָה וַחֲסָדֶ֑יךָ כִּ֖י מֵעוֹלָ֣ם הֵֽמָּה׃ חַטֹּ֤אות נְעוּרַ֨י ׀ וּפְשָׁעַ֗י אַל־תִּ֫זְכֹּ֥ר כְּחַסְדְּךָ֥ זְכׇר־לִי־אַ֑תָּה לְמַ֖עַן טוּבְךָ֣ יְהֹוָֽה׃ טוֹב־וְיָשָׁ֥ר יְהֹוָ֑ה עַל־כֵּ֤ן יוֹרֶ֖ה חַטָּאִ֣ים בַּדָּֽרֶךְ׃ יַדְרֵ֣ךְ עֲ֭נָוִים בַּמִּשְׁפָּ֑ט וִילַמֵּ֖ד עֲנָוִ֣ים דַּרְכּֽוֹ׃ כׇּל־אׇרְח֣וֹת יְ֭הֹוָה חֶ֣סֶד וֶאֱמֶ֑ת לְנֹצְרֵ֥י בְ֝רִית֗וֹ וְעֵדֹתָֽיו׃ לְמַֽעַן־שִׁמְךָ֥ יְהֹוָ֑ה וְֽסָלַחְתָּ֥ לַ֝עֲוֺנִ֗י כִּ֣י רַב־הֽוּא׃ מִי־זֶ֣ה הָ֭אִישׁ יְרֵ֣א יְהֹוָ֑ה י֝וֹרֶ֗נּוּ בְּדֶ֣רֶךְ יִבְחָֽר׃ נַ֭פְשׁוֹ בְּט֣וֹב תָּלִ֑ין וְ֝זַרְע֗וֹ יִ֣ירַשׁ אָֽרֶץ׃ ס֣וֹד יְ֭הֹוָה לִירֵאָ֑יו וּ֝בְרִית֗וֹ לְהוֹדִיעָֽם׃ עֵינַ֣י תָּ֭מִיד אֶל־יְהֹוָ֑ה כִּ֤י הֽוּא־יוֹצִ֖יא מֵרֶ֣שֶׁת רַגְלָֽי׃ פְּנֵה־אֵלַ֥י וְחׇנֵּ֑נִי כִּֽי־יָחִ֖יד וְעָנִ֣י אָֽנִי׃ צָר֣וֹת לְבָבִ֣י הִרְחִ֑יבוּ מִ֝מְּצוּקוֹתַ֗י הוֹצִיאֵֽנִי׃ רְאֵ֣ה עׇ֭נְיִי וַעֲמָלִ֑י וְ֝שָׂ֗א לְכׇל־חַטֹּאותָֽי׃ רְאֵֽה־אֹיְבַ֥י כִּי־רָ֑בּוּ וְשִׂנְאַ֖ת חָמָ֣ס שְׂנֵאֽוּנִי׃ שׇׁמְרָ֣ה נַ֭פְשִׁי וְהַצִּילֵ֑נִי אַל־אֵ֝ב֗וֹשׁ כִּֽי־חָסִ֥יתִי בָֽךְ׃ תֹּם־וָיֹ֥שֶׁר יִצְּר֑וּנִי כִּ֝֗י קִוִּיתִֽיךָ׃ פְּדֵ֣ה אֱ֭לֹהִים אֶת־יִשְׂרָאֵ֑ל מִ֝כֹּ֗ל צָרוֹתָֽיו׃ <br>וְ֭הוּא יִפְדֶּ֣ה אֶת־יִשְׂרָאֵ֑ל מִ֝כֹּ֗ל עֲוֺנֹתָֽיו׃"));
    vd.push(p("<b>יְהֹוָה</b> אֱלֹהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּךָ. וְהִנָּחֵם עַל הָרָעָה לְעַמֶּךָ: "));
    vd.push(p("<b>אָבִינוּ מַלְכֵּנוּ</b>, אָבִינוּ אָתָּה. אָבִינוּ מַלְכֵּנוּ אֵין לָנוּ מֶלֶךְ אֶלָּא אָתָּה. אָבִינוּ מַלְכֵּנוּ רַחֵם עָלֵינוּ: אָבִינוּ מַלְכֵּנוּ חָנֵּנוּ וַעֲנֵנוּ כִּי אֵין בָּנוּ מַעֲשִׂים. עֲשֵׂה עִמָּנוּ צְדָקָה וָחֶסֶד לְמַעַן שִׁמְךָ הַגָּדוֹל וְהוֹשִׁיעֵנוּ: וַאֲנַ֗חְנוּ לֹ֤א נֵדַע֙ מַֽה־נַּעֲשֶׂ֔ה כִּ֥י עָלֶ֖יךָ עֵינֵֽינוּ׃  "));
    vd.push(p("זְכֹר־רַחֲמֶ֣יךָ יְ֭הֹוָה וַחֲסָדֶ֑יךָ כִּ֖י מֵעוֹלָ֣ם הֵֽמָּה: יְהִי־חַסְדְּךָ֣ יְהֹוָ֣ה עָלֵ֑ינוּ כַּ֝אֲשֶׁ֗ר יִחַ֥לְנוּ לָֽךְ׃ אַֽל־תִּזְכׇּר־לָנוּ֮ עֲוֺנֹ֢ת רִאשֹׁ֫נִ֥ים מַ֭הֵר יְקַדְּמ֣וּנוּ רַחֲמֶ֑יךָ כִּ֖י דַלּ֣וֹנוּ מְאֹֽד׃ עֶ֭זְרֵנוּ בְּשֵׁ֣ם יְהֹוָ֑ה עֹ֝שֵׂ֗ה שָׁמַ֥יִם וָאָֽרֶץ׃ חׇנֵּ֣נוּ יְהֹוָ֣ה חׇנֵּ֑נוּ כִּי־רַ֗֝ב שָׂבַ֥עְנוּ בֽוּז׃ בְּרֹגֶז רַחֵם תִּזְכּוֹר. בְּרֹגֶז אַהֲבָה תִּזְכּוֹר. בְּרֹגֶז עֲקֵדָה תִּזְכּוֹר. בְּרֹגֶז תְּמִימוּת תִּזְכּוֹר: יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ׃ כִּי־ה֭וּא יָדַ֣ע יִצְרֵ֑נוּ זָ֝כ֗וּר כִּי־עָפָ֥ר אֲנָֽחְנוּ׃ עׇזְרֵ֤נוּ ׀ אֱלֹ֘הֵ֤י יִשְׁעֵ֗נוּ עַֽל־דְּבַ֥ר כְּבֽוֹד־שְׁמֶ֑ךָ וְהַצִּילֵ֥נוּ וְכַפֵּ֥ר עַל־חַ֝טֹּאתֵ֗ינוּ לְמַ֣עַן שְׁמֶֽךָ׃"));
    vd.push(p("<small>בתעניות ציבור אומרים כאן תחנונים נוספים שנמצאים ב\"תעניות ואבילות\"</small> "));
    if (!isMonThu) {
      vd.push(p("<small>בימים שני וחמישי אין אומרים את הקדיש הזה וממשיכים באל מלך</small>"));
      vd.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
    } else {
      vd.push(p("<small>בימי שני וחמישי מוסיפים:</small>  "));
      vd.push(p("<b>אֶל</b> מֶלֶךְ יוֹשֵׁב עַל כִּסֵּא רַחֲמִים וּמִתְנַהֵג בַּחֲסִידוּת, מוֹחֵל עֲוֹנוֹת עַמּוֹ, מַעֲבִיר רִאשׁוֹן רִאשׁוֹן. מַרְבֶּה מְחִילָה לַחַטָּאִים, וּסְלִיחָה לַפּוֹשְׁעִים, עוֹשֶׂה צְדָקוֹת עִם כָּל בָּשָׂר וְרוּחַ, לֹא כְרָעָתָם לָהֶם גּוֹמֵל, אֶל, הוֹרֵתָנוּ לוֹמַר מִדּוֹת שְׁלֹשׁ עֶשְׂרֵה, זְכוֹר לָנוּ הַיּוֹם בְּרִית שְׁלֹשׁ עֶשְׂרֵה כְּמוֹ שֶׁהוֹדַעְתָּ לֶעָנָו מִקֶּדֶם, וְכֵן כָּתוּב בְּתוֹרָתָךְ וַיֵּ֤רֶד יְהֹוָה֙ בֶּֽעָנָ֔ן וַיִּתְיַצֵּ֥ב עִמּ֖וֹ שָׁ֑ם וַיִּקְרָ֥א בְשֵׁ֖ם יְהֹוָֽה: וְשָׁם נֶאֱמַר:  "));
      vd.push(p("<b>וַיַּעֲבֹ֨ר</b> יְהֹוָ֥ה ׀ עַל־פָּנָיו֮ וַיִּקְרָא֒ יְהֹוָ֣ה ׀ יְהֹוָ֔ה אֵ֥ל רַח֖וּם וְחַנּ֑וּן אֶ֥רֶךְ אַפַּ֖יִם וְרַב־חֶ֥סֶד וֶאֱמֶֽת׃ נֹצֵ֥ר‏ חֶ֙סֶד֙ לָאֲלָפִ֔ים נֹשֵׂ֥א עָוֺ֛ן וָפֶ֖שַׁע וְחַטָּאָ֑ה וְנַקֵּה֙:"));
      vd.push(p("<b>אַנְשֵׁי</b> אֱמוּנָה אָבָדוּ, בָּאִים בְּכֹחַ מַעֲשֵׂיהֶם: גִּבּוֹרִים לַעֲמֹד בַּפֶּרֶץ, דּוֹחִים אֶת הַגְּזֵרוֹת: הָיוּ לָנוּ לְחוֹמָה, וּלְמַחְסֶה בְּיוֹם זָעַם: זוֹעֲכִים אַף בְּלַחֲשָׁם, חֵמָה עָצְרוּ בְּשַׁוְעָם: טֶרֶם קְרָאוּךָ עֲנִיתָם, יוֹדְעִים לַעֲתֹר וּלְרַצּוֹת: כְּאָב רִחַמְתָּ לְמַעֲנָם, לֹא הֱשִׁיבוֹתָ פְנֵיהֶם רֵיקָם: מֵרֹב עֲוֹנֵינוּ אֲבַדְנוּם, נֶאֶסְפוּ מֶנּוּ בַּחֲטָאֵינוּ: סָעוּ הֵמָּה לִמְנוּחוֹת, עָזְבוּ אוֹתָנוּ לַאֲנָחוֹת: פַּסּוּ גוֹדְרֵי גָדֵר, צֻמְּתוּ מְשִׁיבֵי חֵמָה: קָמִים בַּפֶּרֶץ אַיִן, רְאוּיִים לרַצּוֹתְךָ אָפֵסוּ: שׁוֹטַטְנוּ בְּאַרְבַּע פִּנּוֹת, תְּרוּפָה לֹא מָצָאנוּ: שַׁבְנוּ אֵלֶיךָ בּבֹשֶׁת פָּנֵינוּ, לְשַׁחֲרָךְ אֵל בְּעֵת צָרוֹתֵינוּ: "));
      vd.push(p("<b>אֶל</b> מֶלֶךְ יוֹשֵׁב עַל כִּסֵּא רַחֲמִים וּמִתְנַהֵג בַּחֲסִידוּת, מוֹחֵל עֲוֹנוֹת עַמּוֹ, מַעֲבִיר רִאשׁוֹן רִאשׁוֹן. מַרְבֶּה מְחִילָה לַחַטָּאִים, וּסְלִיחָה לַפּוֹשְׁעִים, עוֹשֶׂה צְדָקוֹת עִם כָּל בָּשָׂר וְרוּחַ, לֹא כְרָעָתָם לָהֶם גּוֹמֵל, אֶל, הוֹרֵתָנוּ לוֹמַר מִדּוֹת שְׁלֹשׁ עֶשְׂרֵה, זְכוֹר לָנוּ הַיּוֹם בְּרִית שְׁלֹשׁ עֶשְׂרֵה כְּמוֹ שֶׁהוֹדַעְתָּ לֶעָנָו מִקֶּדֶם, וְכֵן כָּתוּב בְּתוֹרָתָךְ וַיֵּ֤רֶד יְהֹוָה֙ בֶּֽעָנָ֔ן וַיִּתְיַצֵּ֥ב עִמּ֖וֹ שָׁ֑ם וַיִּקְרָ֥א בְשֵׁ֖ם יְהֹוָֽה: וְשָׁם נֶאֱמַר:  "));
      vd.push(p("<b>וַיַּעֲבֹ֨ר</b> יְהֹוָ֥ה ׀ עַל־פָּנָיו֮ וַיִּקְרָא֒ יְהֹוָ֣ה ׀ יְהֹוָ֔ה אֵ֥ל רַח֖וּם וְחַנּ֑וּן אֶ֥רֶךְ אַפַּ֖יִם וְרַב־חֶ֥סֶד וֶאֱמֶֽת׃ נֹצֵ֥ר‏ חֶ֙סֶד֙ לָאֲלָפִ֔ים נֹשֵׂ֥א עָוֺ֛ן וָפֶ֖שַׁע וְחַטָּאָ֑ה וְנַקֵּה֙: "));
      vd.push(p("<b>תָּמַהְנוּ</b> מֵרָעוֹת. תָּשַׁשׁ כֹּחֵנוּ מִצָּרוֹת. שַׁחְנוּ עַד לִמְאֹד, שָׁפַלְנוּ עַד עָפָר. רַחוּם כָּךְ הִיא מִדָּתֵנוּ, קְשֵׁי עֹרֶף וּמַמְרִים אֲנָחְנוּ. צָעַקְנוּ בְּפִינוּ חָטָאנוּ, פְּתַלְתּוֹל וְעִקֵּשׁ לִבֵּנוּ. עֶלְיוֹן, רַחֲמֶיךָ מֵעוֹלָם, סְלִיחָה עִמְּךָ הִיא. נִחָם עַל הָרָעָה, מַטֵּה כְּלַפֵּי חֶסֶד. לֹא תִתְעַלַּם בְּעִתּוֹת כָּאֵל, כִּי בְּצָרָה גְדוֹלָה אֲנָחְנוּ. יִוָּדַע לְעֵינֵי הַכֹּל, טוּבְךָ וְחַסְדְּךָ עִמָּנוּ. חֲתֹם פֶּה-שָׂטָן, וְאַל יַשְׂטִין עָלֵינוּ, זְעֹם בּוֹ וְיִדֹּם. וְיַעֲמֹד מֵלִיץ טוֹב לְצַדְּקֵנוּ, הוּא יַגִּיד יָשְׁרֵנוּ. דְּרָכֶיךָ רַחוּם וְחַנּוּן גִּלִּיתָ לְנֶאֱמַן בָּיִת. בְּבַקְשׁוֹ אָז מִלְּפָנֶיךָ, אֱמוּנָתְךָ הוֹדַעְתָּ לּוֹ:"));
      vd.push(p("<b>אֶל מֶלֶךְ</b> יוֹשֵׁב עַל כִּסֵּא רַחֲמִים וּמִתְנַהֵג בַּחֲסִידוּת, מוֹחֵל עֲוֹנוֹת עַמּוֹ, מַעֲבִיר רִאשׁוֹן רִאשׁוֹן. מַרְבֶּה מְחִילָה לַחַטָּאִים, וּסְלִיחָה לַפּוֹשְׁעִים, עוֹשֶׂה צְדָקוֹת עִם כָּל בָּשָׂר וְרוּחַ, לֹא כְרָעָתָם לָהֶם גּוֹמֵל, אֶל, הוֹרֵתָנוּ לוֹמַר מִדּוֹת שְׁלֹשׁ עֶשְׂרֵה, זְכוֹר לָנוּ הַיּוֹם בְּרִית שְׁלֹשׁ עֶשְׂרֵה כְּמוֹ שֶׁהוֹדַעְתָּ לֶעָנָו מִקֶּדֶם, וְכֵן כָּתוּב בְּתוֹרָתָךְ וַיֵּ֤רֶד יְהֹוָה֙ בֶּֽעָנָ֔ן וַיִּתְיַצֵּ֥ב עִמּ֖וֹ שָׁ֑ם וַיִּקְרָ֥א בְשֵׁ֖ם יְהֹוָֽה: וְשָׁם נֶאֱמַר:  "));
      vd.push(p("<b>וַיַּעֲבֹ֨ר</b> יְהֹוָ֥ה ׀ עַל־פָּנָיו֮ וַיִּקְרָא֒ יְהֹוָ֣ה ׀ יְהֹוָ֔ה אֵ֥ל רַח֖וּם וְחַנּ֑וּן אֶ֥רֶךְ אַפַּ֖יִם וְרַב־חֶ֥סֶד וֶאֱמֶֽת׃ נֹצֵ֥ר‏ חֶ֙סֶד֙ לָאֲלָפִ֔ים נֹשֵׂ֥א עָוֺ֛ן וָפֶ֖שַׁע וְחַטָּאָ֑ה וְנַקֵּה֙: "));
      vd.push(p("<b>אֱלֹהֵינוּ</b> וֵאלֹהֵי אֲבוֹתֵינוּ. אַל תַּעַשׂ עִמָּנוּ כָּלָה, תֹּאחֵז יָדְךָ בַּמִּשְׁפָּט. בְּבֹא תוֹכֵחָה נֶגְדֶּךָ, שְׁמֵנוּ מִסִּפְרְךָ אַל תֶּמַח. גִּשְׁתְּךָ לַחֲקֹר מוּסָר, רַחֲמֶיךָ יקַדְּמוּ רָגְזֶךָ. דַּלּוּת מַעֲשִׂים בְּשׁוּרֶךָ, קָרֵב צֶדֶק מֵאֵלֶיךָ. הוֹרֵנוּ, בְּזַעֲקֵנוּ לָךְ, צַו יְשׁוּעָתֵנוּ בְּמַפְגִּיעַ. וְתָשִׁיב שְׁבוּת אָהֳלֵי תָם, פְּתָחָיו רְאֵה כִּי שָׁמֵמוּ. זְכֹר נָאַמְתָּ, עֵדוּת לֹא תִשָּׁכַח מִפִּי זַרְעוֹ. חוֹתַם תְּעוּדָה תַּתִּיר, סוֹדְךָ שִׂים בְּלִמּוּדֶיךָ. טַבּוּר אַגַּן הַסַּהַר, נָא אַל יֶחְסַר הַמָּזֶג. יָהּ, דַּע אֶת יִשְׂרָאֵל אֲשֶׁר יְדָעוּךָ, מַגֵּר אֶת הַגּוֹיִם אֲשֶׁר לֹא יְדָעוּךָ. כִּי תָשִׁיב לְבִצָּרוֹן, לְכוּדִים אֲסִירֵי הַתִּקְוָה. "));
      vd.push(p("<b>מַה</b> נֹּאמַר לְפָנֶיךָ יוֹשֵׁב מָרוֹם, וּמַה נְּסַפֵּר לְפָנֶיךָ שׁוֹכֵן שְׁחָקִים, הֲלֹא הַנִּסְתָּרוֹת וְהַנִּגְלוֹת אַתָּה יוֹדֵעַ, אַתָּה יוֹדֵעַ רָזֵי עוֹלָם, וְתַעֲלוּמוֹת סִתְרֵי כָּל חָי, אַתָּה חוֹפֵשׂ כָּל חַדְרֵי בָטֶן, רֹאֶה כְלָיוֹת וָלֵב. אֵין דָּבָר נֶעְלָם מִמָּךָּ, וְאֵין נִסְתָּר מִנֶּגֶד עֵינֶיךָ: "));
      vd.push(p("<b>יְהִי</b> רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁתִּמְחֹל לָנוּ אֶת-כָּל-חַטֹּאתֵינוּ, וּתְכַפֵּר לָנוּ אֶת-כָּל-עֲוֹנוֹתֵינוּ, וְתִמְחֹל וְתִסְלַח לְכָל פְּשָׁעֵינוּ, וְסָלַחְתָּ֛ לַעֲוֺנֵ֥נוּ וּלְחַטָּאתֵ֖נוּ וּנְחַלְתָּֽנוּ:  "));
      vd.push(p("<b>סְלַח</b> לָנוּ אָבִינוּ כִּי חָטָאנוּ, מְחֹל לָנוּ מַלְכֵּנוּ כִּי פָשָׁעְנוּ: כִּֽי־אַתָּ֣ה אֲ֭דֹנָי ט֣וֹב וְסַלָּ֑ח וְרַב־חֶ֗֝סֶד לְכׇל־קֹֽרְאֶֽיךָ׃ לְמַֽעַן־שִׁמְךָ֥ יְהֹוָ֑ה וְֽסָלַחְתָּ֥ לַ֝עֲוֺנִ֗י כִּ֣י רַב־הֽוּא׃ לְמַעַן־שִׁמְךָ֣ יְהֹוָ֣ה תְּחַיֵּ֑נִי בְּצִדְקָתְךָ֓ ׀ תּוֹצִ֖יא מִצָּרָ֣ה נַפְשִֽׁי׃ יְהֹוָ֣ה צְבָא֣וֹת עִמָּ֑נוּ מִשְׂגָּֽב־לָ֨נוּ אֱלֹהֵ֖י יַֽעֲקֹ֣ב סֶֽלָה׃ יְהֹוָ֥ה צְבָא֑וֹת אַֽשְׁרֵ֥י אָ֝דָ֗ם בֹּטֵ֥חַ בָּֽךְ׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: הֲשִׁיבֵ֨נוּ יְהֹוָ֤ה ׀ אֵלֶ֙יךָ֙ ונשוב [וְֽנָשׁ֔וּבָה] חַדֵּ֥שׁ יָמֵ֖ינוּ כְּקֶֽדֶם׃"));
      vd.push(p("<b>וְה֤וּא</b> רַח֨וּם ׀ יְכַפֵּ֥ר עָוֺן֮ וְֽלֹא־יַֽ֫שְׁחִ֥ית וְ֭הִרְבָּה לְהָשִׁ֣יב אַפּ֑וֹ וְלֹא־יָ֝עִ֗יר כׇּל־חֲמָתֽוֹ׃  אַתָּ֤ה יְהֹוָ֗ה לֹֽא־תִכְלָ֣א רַחֲמֶ֣יךָ מִמֶּ֑נִּי חַסְדְּךָ֥ וַ֝אֲמִתְּךָ֗ תָּמִ֥יד יִצְּרֽוּנִי׃ הוֹשִׁיעֵ֨נוּ ׀ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְקַבְּצֵנוּ֮ מִֽן־הַגּ֫וֹיִ֥ם לְ֭הֹדוֹת לְשֵׁ֣ם קׇדְשֶׁ֑ךָ לְ֝הִשְׁתַּבֵּ֗חַ בִּתְהִלָּתֶֽךָ: אִם־עֲוֺנ֥וֹת תִּשְׁמׇר־יָ֑הּ אֲ֝דֹנָ֗י מִ֣י יַעֲמֹֽד׃ כִּֽי־עִמְּךָ֥ הַסְּלִיחָ֑ה לְ֝מַ֗עַן תִּוָּרֵֽא׃ לֹ֣א כַ֭חֲטָאֵינוּ עָ֣שָׂה לָ֑נוּ וְלֹ֥א כַ֝עֲוֺנֹתֵ֗ינוּ גָּמַ֥ל עָלֵֽינוּ׃ אִם־עֲוֺנֵ֙ינוּ֙ עָ֣נוּ בָ֔נוּ יְהֹוָ֕ה עֲשֵׂ֖ה לְמַ֣עַן שְׁמֶ֑ךָ׃ זְכֹר־רַחֲמֶ֣יךָ יְ֭הֹוָה וַחֲסָדֶ֑יךָ כִּ֖י מֵעוֹלָ֣ם הֵֽמָּה׃ יַֽעַנְךָ֣ יְ֭הֹוָה בְּי֣וֹם צָרָ֑ה יְ֝שַׂגֶּבְךָ֗ שֵׁ֤ם ׀ אֱלֹהֵ֬י יַעֲקֹֽב׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: אָבִינוּ מַלְכֵּנוּ, חָנֵּנוּ וַעֲנֵנוּ כִּי אֵין בָּנוּ מַעֲשִׂים. עֲשֵׂה עִמָּנוּ צְדָקָה כְּרֹב רַחֲמֶיךָ, וְהוֹשִׁיעֵנוּ לְמַעַן שְׁמֶךָ: "));
      vd.push(p("<b>וְעַתָּ֣ה ׀</b> <small>(דניאל ט טו)</small> אֲדֹנָ֣י אֱלֹהֵ֗ינוּ אֲשֶׁר֩ הוֹצֵ֨אתָ אֶֽת־עַמְּךָ֜ מֵאֶ֤רֶץ מִצְרַ֙יִם֙ בְּיָ֣ד חֲזָקָ֔ה וַתַּֽעַשׂ־לְךָ֥ שֵׁ֖ם כַּיּ֣וֹם הַזֶּ֑ה חָטָ֖אנוּ רָשָֽׁעְנוּ׃ אֲדֹנָ֗י כְּכׇל־צִדְקֹתֶ֙ךָ֙ יָֽשׇׁב־נָ֤א אַפְּךָ֙ וַחֲמָ֣תְךָ֔ מֵעִֽירְךָ֥ יְרוּשָׁלַ֖‍ִם הַר־קׇדְשֶׁ֑ךָ כִּ֤י בַחֲטָאֵ֙ינוּ֙ וּבַעֲוֺנ֣וֹת אֲבֹתֵ֔ינוּ יְרוּשָׁלַ֧‍ִם וְעַמְּךָ֛ לְחֶרְפָּ֖ה לְכָל־סְבִיבֹתֵֽינוּ׃ וְעַתָּ֣ה ׀ שְׁמַ֣ע אֱלֹהֵ֗ינוּ אֶל־תְּפִלַּ֤ת עַבְדְּךָ֙ וְאֶל־תַּ֣חֲנוּנָ֔יו וְהָאֵ֣ר פָּנֶ֔יךָ עַל־מִקְדָּשְׁךָ֖ הַשָּׁמֵ֑ם לְמַ֖עַן אֲדֹנָֽי׃ הַטֵּ֨ה אֱלֹהַ֥י ׀ אׇזְנְךָ֮ וּֽשְׁמָע֒ פקחה [פְּקַ֣ח] עֵינֶ֗יךָ וּרְאֵה֙ שֹֽׁמְמֹתֵ֔ינוּ וְהָעִ֕יר אֲשֶׁר־נִקְרָ֥א שִׁמְךָ֖ עָלֶ֑יהָ כִּ֣י ׀ לֹ֣א עַל־צִדְקֹתֵ֗ינוּ אֲנַ֨חְנוּ מַפִּילִ֤ים תַּחֲנוּנֵ֙ינוּ֙ לְפָנֶ֔יךָ כִּ֖י עַל־רַחֲמֶ֥יךָ הָרַבִּֽים׃ אֲדֹנָ֤י ׀ שְׁמָ֙עָה֙ אֲדֹנָ֣י ׀ סְלָ֔חָה אֲדֹנָ֛י הַֽקְשִׁ֥יבָה וַעֲשֵׂ֖ה אַל־תְּאַחַ֑ר לְמַֽעַנְךָ֣ אֱלֹהַ֔י כִּֽי־שִׁמְךָ֣ נִקְרָ֔א עַל־עִירְךָ֖ וְעַל־עַמֶּֽךָ׃  "));
      vd.push(p("<b>אָבִינוּ</b> אָב הָרַחֲמָן, הַרְאֵנוּ אוֹת לְטוֹבָה וְקַבֵּץ נְפוּצוֹתֵינוּ מֵאַרְבַּע כַּנְפוֹת הָאָרֶץ. יַכִּירוּ וְיֵדְעוּ כָּל הַגּוֹיִם כִּי אַתָּה יְהֹוָה אָבִינוּ אָתָּה. אֲנַחְנוּ הַחֹמֶר וְאַתָּה יֹצְרֵנוּ וּמַעֲשֵׂה יָדְךָ כֻּלָּנוּ:  "));
      vd.push(p("<b>אָבִינוּ</b> מַלְכֵּנוּ, צוּרֵנוּ וְגוֹאֲלֵנוּ, ח֧וּסָה יְהֹוָ֣ה עַל־עַמֶּ֗ךָ וְאַל־תִּתֵּ֨ן נַחֲלָתְךָ֤ לְחֶרְפָּה֙ לִמְשׇׁל־בָּ֣ם גּוֹיִ֔ם לָ֚מָּה יֹאמְר֣וּ בָעַמִּ֔ים אַיֵּ֖ה אֱלֹהֵיהֶֽם׃ יָדַעְנוּ יְהֹוָה כִּי חָטָאנוּ. וְאֵין מִי יַעֲמוֹד בַּעֲדֵנוּ אֶלָּא שִׁמְךָ הַגָּדוֹל יַעֲמוֹד לָנוּ בְּעֵת צָרָה. וּכְרַחֵם אָב עַל בָּנִים רַחֵם עָלֵינוּ. חֲמֹל עַל עַמָּךְ וְרַחֵם עַל נַחֲלָתָךְ. חוּסָה נָּא כְּרֹב רַחֲמֶיךָ חָנֵּנוּ מַלְכֵּנוּ וַעֲנֵנוּ. לְךָ יְהֹוָה הַצְּדָקָה עוֹשֵׂה נִפְלָאוֹת בְּכָל עֵת וָעֵת. הַבֵּט נָא וְהוֹשִׁיעָה נָּא צֹאן מַרְעִיתֶךָ. אַל יִמְשָׁל בָּנוּ קֶצֶף כִּי לְךָ יְהֹוָה הַיְשׁוּעָה בְּךָ תוֹחַלְתֵּנוּ. אֱלוֹהַּ סְלִיחוֹת אָנָּא סְלַח נָא. כִּי אֵל טוֹב וְסַלָּח אָתָּה:  "));
      vd.push(p("<b>אָנָּא</b> מֶלֶךְ רַחוּם וְחַנּוּן, זְכוֹר וְהַבֵּט לִבְרִית בֵּין הַבְּתָרִים. וְתֵרָאֶה לְפָנֶיךָ עֲקֵדַת יָחִיד. וּלְמַעַן יִשְׂרָאֵל אָבִינוּ. אַל תַּעַזְבֵנוּ אָבִינוּ. וְאַל תִּטְּשֵׁנוּ מַלְכֵּנוּ וְאַל תִּשְׁכָּחֵנוּ יוֹצְרֵנוּ. וְאַל תַּעַשׂ עִמָּנוּ כָלָה בְּגָלוּתֵינוּ. כִּי אֵל מֶלֶךְ חַנּוּן וְרַחוּם אָתָּה:  "));
      vd.push(p("<b>אֵין כָּמוֹךָ</b> חַנּוּן וְרַחוּם אֱלֹהֵינוּ. אֵין כָּמוֹךָ אֵל אֶרֶךְ אַפַּיִם וְרַב חֶסֶד וֶאֱמֶת. הושִׁיעֵנוּ וְרַחֲמֵנוּ מֵרַעַשׁ וּמֵרֹגֶז הַצִּילֵנוּ: זְכֹר֙ לַעֲבָדֶ֔יךָ לְאַבְרָהָ֥ם לְיִצְחָ֖ק וּֽלְיַעֲקֹ֑ב אַל־תֵּ֗פֶן אֶל־קְשִׁי֙ הָעָ֣ם הַזֶּ֔ה וְאֶל־רִשְׁע֖וֹ וְאֶל־חַטָּאתֽוֹ׃ שׁ֚וּב מֵחֲר֣וֹן אַפֶּ֔ךָ וְהִנָּחֵ֥ם עַל־הָרָעָ֖ה לְעַמֶּֽךָ׃ וְהָסֵר מִמֶּנּוּ מַכַּת הַמָּוֶת כִּי רַחוּם אָתָּה. כִּי כֵן דַּרְכְּךָ לַעֲשׂוֹת חֶסֶד חִנָּם בְּכָל דּוֹר וָדוֹר: אָנָּ֣א יְ֭הֹוָה הוֹשִׁ֘יעָ֥ה נָּ֑א אָנָּ֥א יְ֝הֹוָ֗ה הַצְלִ֘יחָ֥ה נָֽא׃ אָנָּא יְהֹוָה עֲנֵנוּ בְיוֹם קָרְאֵנוּ: לְךָ יְהֹוָה קִוִּינוּ. לְךָ יְהֹוָה חִכִּינוּ. לְךָ יְהֹוָה נְיַחֵל אַל תֶּחֱשֶׁה וּתְעַנֵּנוּ. כִּי נָאֲמוּ גוֹיִם אָבְדָה תִקְוָתָם. כָּל בֶּרֶךְ לְךָ תִכְרַע וְכָל קוֹמָה לְפָנֶיךָ תִשְׁתַּחֲוֶה:  "));
      vd.push(p("<b>הַפּוֹתֵחַ</b> יָד בִּתְשׁוּבָה לְקַבֵּל פּוֹשְׁעִים וְחַטָּאִים. נִבְהֲלָה נַפְשֵׁנוּ מֵרוֹב עִצְּבוֹנֵנוּ. אַל תִּשְׁכָּחֵנוּ נֶצַח קוּמָה וְהוֹשִׁיעֵנוּ. אַל תִּשְׁפּוֹךְ חֲרוֹנְךָ עָלֵינוּ כִּי עַמְּךָ אֲנַחְנוּ בְּנֵי בְרִיתֶךָ. אֵל הַבִּיטָה. דַּל כְּבוֹדֵנוּ בַגּוֹיִם וְשִׁקְּצוּנוּ כְּטֻמְאַת הַנִּדָּה. עַד מָתַי עֻזְּךָ בַּשְּׁבִי וְתִפְאַרְתְּךָ בְּיַד צָר. הֵמָּה יִרְאוּ וְיֵבשׁוּ וְיֵחַתּוּ מִגְּבוּרָתָם. עוֹרְרָה גְבוּרָתְךָ וְהוֹשִׁיעֵנוּ לְמַעַן שְׁמֶךָ. אַל יִמְעֲטוּ לְפָנֶיךָ תְּלָאוֹתֵינוּ מַהֵר יְקַדְּמוּנוּ רַחֲמֶיךָ בְּעֵת צָרוֹתֵנוּ. לֹא לְמַעֲנֵנוּ אֶלָּא לְמַעֲנָךְ פְּעֹל וְאַל תַּשְׁחֵת אֶת זֵכֶר שְׁאֵרִיתֵנוּ. כִּי לְךָ מְיַחֲלוֹת עֵינֵינוּ כִּי אֵל מֶלֶךְ חַנּוּן וְרַחוּם אָתָּה. וּזְכוֹר עֵדוּתֵינוּ בְּכָל יוֹם תָּמִיד אוֹמְרִים פַּעֲמַיִם בְּאַהֲבָה: שְׁמַ֖ע יִשְׂרָאֵ֑ל יְהֹוָ֥ה אֱלֹהֵ֖ינוּ יְהֹוָ֥ה ׀ אֶחָֽד׃"));
    }
    vd.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
    parts.push(vd.join(''));
  }
  parts.push(hr);

  // ─────────────────────────── קריאת התורה ───────────────────────────
  if (isTorahReadingDay) {
    var tr = [];
    tr.push(p("<big><b>ספר תורה</b></big>"));
    tr.push(p("<small>לפני הוצאת ספר תורה ביום שיש בו תחנון אומרים:</small> "));
    tr.push(p("<b>אֶל</b> אֶרֶךְ אַפַּיִם וְרַב חֶסֶד וֶאֱמֶת, אֶל בְּאַפְּךָ תוֹכִיחֵנוּ, חוּסָה יְהֹוָה עַל יִשְׂרָאֵל עַמֶּךָ, וְהוֹשִׁיעֵנוּ מִכָּל רָע, חָטָאנוּ לְךָ, אָדוֹן סְלַח נָא, כְּרֹב רַחֲמֶיךָ אֶל:"));
    tr.push(p("<b>אֶל</b> אֶרֶךְ אַפַּיִם וּמַלֵּא רַחֲמִים, אֶל תַּסְתֵּר פָּנֶיךָ מִמֶּנּוּ, חוּסָה יְהֹוָה עַל שְׁאֵרִית יִשְׂרָאֵל עַמֶּךָ, וְהַצִּילֵנוּ מִכָּל רָע, חָטָאנוּ לְךָ, אֲדוֹן סְלַח נָא, כְּרֹב רַחֲמֶיךָ אֶל:  "));
    tr.push(p("<small>ביום שאין בו תחנון אומרים:</small> "));
    tr.push(p("<b>יְהִ֨י</b> יְהֹוָ֤ה אֱלֹהֵ֙ינוּ֙ עִמָּ֔נוּ כַּאֲשֶׁ֥ר הָיָ֖ה עִם־אֲבֹתֵ֑ינוּ אַל־יַעַזְבֵ֖נוּ וְאַֽל־יִטְּשֵֽׁנוּ׃ הוֹשִׁ֤יעָה ׀ אֶת־עַמֶּ֗ךָ וּבָרֵ֥ךְ אֶת־נַחֲלָתֶ֑ךָ וּֽרְעֵ֥ם וְ֝נַשְּׂאֵ֗ם עַד־הָעוֹלָֽם׃ בַּֽ֭עֲבוּר דָּוִ֣ד עַבְדֶּ֑ךָ אַל־תָּ֝שֵׁ֗ב פְּנֵ֣י מְשִׁיחֶֽךָ׃"));
    tr.push(p("<small>שמוציאים ספר תורה אומרים</small><br><b>בָּרוּךְ</b> הַמָּקוֹם שֶׁנָּתַן תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל, בָּרוּךְ הוּא: אַשְׁרֵ֣י הָ֭עָם שֶׁכָּ֣כָה לּ֑וֹ אַֽשְׁרֵ֥י הָ֝עָ֗ם שֱׁיְהֹוָ֥ה אֱלֹהָֽיו׃ גַּדְּל֣וּ לַיהֹוָ֣ה אִתִּ֑י וּנְרוֹמְמָ֖ה שְׁמ֣וֹ יַחְדָּֽו׃ רוֹמְמ֡וּ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְֽ֭הִשְׁתַּחֲווּ לַהֲדֹ֥ם רַגְלָ֗יו קָד֥וֹשׁ הֽוּא׃ רוֹמְמ֡וּ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְֽ֭הִשְׁתַּחֲווּ לְהַ֣ר קׇדְשׁ֑וֹ כִּי־קָ֝ד֗וֹשׁ יְהֹוָ֥ה אֱלֹהֵֽינוּ׃ אֵין־קָד֥וֹשׁ כַּיהֹוָ֖ה כִּ֣י אֵ֣ין בִּלְתֶּ֑ךָ וְאֵ֥ין צ֖וּר כֵּאלֹהֵֽינוּ׃ כִּ֤י מִ֣י אֱ֭לוֹהַּ מִבַּלְעֲדֵ֣י יְהֹוָ֑ה וּמִ֥י צ֝֗וּר זוּלָתִ֥י אֱלֹהֵֽינוּ׃ תּוֹרָ֥ה צִוָּה־לָ֖נוּ מֹשֶׁ֑ה מוֹרָשָׁ֖ה קְהִלַּ֥ת יַעֲקֹֽב׃ עֵץ־חַיִּ֣ים הִ֭יא לַמַּחֲזִיקִ֣ים בָּ֑הּ וְֽתֹמְכֶ֥יהָ מְאֻשָּֽׁר׃ דְּרָכֶ֥יהָ דַרְכֵי־נֹ֑עַם וְֽכׇל־נְתִ֖יבוֹתֶ֣יהָ שָׁלֽוֹם׃ שָׁל֣וֹם רָ֭ב לְאֹהֲבֵ֣י תוֹרָתֶ֑ךָ וְאֵֽין־לָ֥מוֹ מִכְשֽׁוֹל׃ יְֽהֹוָ֗ה עֹ֭ז לְעַמּ֣וֹ יִתֵּ֑ן יְהֹוָ֓ה ׀ יְבָרֵ֖ךְ אֶת־עַמּ֣וֹ בַשָּׁלֽוֹם׃ "));
    tr.push(p("<small>כשמגיע לדוכן, מגביה את ספר התורה ומראה הכתב לקהל ואומרים</small> "));
    tr.push(p("<b>וְזֹ֖את </b> הַתּוֹרָ֑ה אֲשֶׁר־שָׂ֣ם מֹשֶׁ֔ה לִפְנֵ֖י בְּנֵ֥י יִשְׂרָאֵֽל׃ תּוֹרָ֥ה צִוָּה־לָ֖נוּ מֹשֶׁ֑ה מוֹרָשָׁ֖ה קְהִלַּ֥ת יַעֲקֹֽב׃ הָאֵל֮ תָּמִ֢ים דַּ֫רְכּ֥וֹ אִמְרַֽת־יְהֹוָ֥ה צְרוּפָ֑ה מָגֵ֥ן ה֝֗וּא לְכֹ֤ל ׀ הַחֹסִ֬ים בּֽוֹ׃"));
    tr.push(p("<small>ואומר העולה: הַשֵּׁם עִמָּכֶם:</small> "));
    tr.push(p("<small>ועונים הקהל: יְבָרֶכְךָ הַשֵּׁם:</small> "));
    tr.push(p("<small>ואומר העולה:</small> בָּרְכוּ אֶת יְהֹוָה הַמְּבֹרָךְ: "));
    tr.push(p("<small>ועונים הקהל:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֶד: "));
    tr.push(p("<small>וחוזר העולה:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֶד: "));
    tr.push(p("<small>ומברך העולה לפני הקריאה</small>  "));
    tr.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵינוּ  מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל הָעַמִּים וְנָתַן לָנוּ אֶת תּוֹרָתוֹ. בָּרוּךְ אַתָּה יְהֹוָה, נוֹתֵן הַתּוֹרָה: <small>[אמן]</small> "));
    tr.push(p("<small>אחר הקריאה מברך העולה</small> "));
    tr.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵינוּ  מֶלֶךְ הָעוֹלָם, אֲשֶׁר נָתַן לָנוּ אֶת תּוֹרָתוֹ תּוֹרַת אֱמֶת, וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵנוּ. בָּרוּךְ אַתָּה יְהֹוָה, נוֹתֵן הַתּוֹרָה: <small>[אמן]</small> "));
    tr.push(p("ברכת הגומל נמצא בסדר קריאת התורה של שבת"));
    tr.push(p("<small>העולה האחרון אומר חצי קדיש</small>"));
    tr.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. [אָמֵן] בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. [אָמֵן] בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. [אָמֵן] יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. [אָמֵן] לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. [אָמֵן]</small>"));
    parts.push(sup(tr.join('')));
  }
  parts.push(hr);

  // ─────────────────────────── אשרי יושבי ביתך ───────────────────────────
  parts.push(p("<big><b>אשרי יושבי ביתך</b></big>"));
  parts.push(p("<b>יְהִי־חַסְדְּךָ֣</b> יְהֹוָ֣ה עָלֵ֑ינוּ כַּ֝אֲשֶׁ֗ר יִחַ֥לְנוּ לָֽךְ׃"));
  parts.push(p("<b>אַ֭שְׁרֵי</b> יוֹשְׁבֵ֣י בֵיתֶ֑ךָ ע֝֗וֹד יְֽהַלְל֥וּךָ סֶּֽלָה: אַשְׁרֵ֣י הָ֭עָם שֶׁכָּ֣כָה לּ֑וֹ אַֽשְׁרֵ֥י הָ֝עָ֗ם שֱׁיְהֹוָ֥ה אֱלֹהָֽיו:  "));
  parts.push(p("<b>תְּהִלָּ֗ה לְדָ֫וִ֥ד</b> <small>(תהילים קמ״ה:א׳-ב׳)</small> אֲרוֹמִמְךָ֣ אֱלוֹהַ֣י הַמֶּ֑לֶךְ וַאֲבָרְכָ֥ה שִׁ֝מְךָ֗ לְעוֹלָ֥ם וָעֶֽד׃ בְּכָל־י֥וֹם אֲבָֽרְכֶ֑ךָּ וַאֲהַֽלְלָ֥ה שִׁ֝מְךָ֗ לְעוֹלָ֥ם וָעֶֽד׃ גָּ֘ד֤וֹל יְהֹוָ֣ה וּמְהֻלָּ֣ל מְאֹ֑ד וְ֝לִגְדֻלָּת֗וֹ אֵ֣ין חֵֽקֶר׃ דּ֣וֹר לְ֭דוֹר יְשַׁבַּ֣ח מַעֲשֶׂ֑יךָ וּגְב֖וּרֹתֶ֣יךָ יַגִּֽידוּ׃ הֲ֭דַר כְּב֣וֹד הוֹדֶ֑ךָ וְדִבְרֵ֖י נִפְלְאֹתֶ֣יךָ אָשִֽׂיחָה׃ וֶעֱז֣וּז נֽוֹרְאֹתֶ֣יךָ יֹאמֵ֑רוּ וגדלותיך [וּגְדֻלָּתְךָ֥] אֲסַפְּרֶֽנָּה׃ זֵ֣כֶר רַב־טוּבְךָ֣ יַבִּ֑יעוּ וְצִדְקָתְךָ֥ יְרַנֵּֽנוּ׃ חַנּ֣וּן וְרַח֣וּם יְהֹוָ֑ה אֶ֥רֶךְ אַ֝פַּ֗יִם וּגְדׇל־חָֽסֶד׃ טוֹב־יְהֹוָ֥ה לַכֹּ֑ל וְ֝רַחֲמָ֗יו עַל־כׇּל־מַעֲשָֽׂיו׃ יוֹד֣וּךָ יְ֭הֹוָה כׇּל־מַעֲשֶׂ֑יךָ וַ֝חֲסִידֶ֗יךָ יְבָרְכֽוּכָה׃ כְּב֣וֹד מַלְכוּתְךָ֣ יֹאמֵ֑רוּ וּגְבוּרָתְךָ֥ יְדַבֵּֽרוּ׃ לְהוֹדִ֤יעַ  ׀ לִבְנֵ֣י הָ֭אָדָם גְּבוּרֹתָ֑יו וּ֝כְב֗וֹד הֲדַ֣ר מַלְכוּתֽוֹ׃ מַֽלְכוּתְךָ֗ מַלְכ֥וּת כׇּל־עֹלָמִ֑ים וּ֝מֶֽמְשַׁלְתְּךָ֗ בְּכׇל־דּ֥וֹר וָדֹֽר׃ סוֹמֵ֣ךְ יְ֭הֹוָה לְכׇל־הַנֹּפְלִ֑ים וְ֝זוֹקֵ֗ף לְכׇל־הַכְּפוּפִֽים׃ עֵֽינֵי־כֹ֭ל אֵלֶ֣יךָ יְשַׂבֵּ֑רוּ וְאַתָּ֤ה נֽוֹתֵן־לָהֶ֖ם אֶת־אׇכְלָ֣ם בְּעִתּֽוֹ׃ פּוֹתֵ֥חַ אֶת־יָדֶ֑ךָ וּמַשְׂבִּ֖יעַ לְכׇל־חַ֣י רָצֽוֹן׃ צַדִּ֣יק יְ֭הֹוָה בְּכׇל־דְּרָכָ֑יו וְ֝חָסִ֗יד בְּכׇל־מַעֲשָֽׂיו׃ קָר֣וֹב יְ֭הֹוָה לְכׇל־קֹרְאָ֑יו לְכֹ֤ל אֲשֶׁ֖ר יִקְרָאֻ֣הוּ בֶֽאֱמֶֽת׃ רְצוֹן־יְרֵאָ֥יו יַעֲשֶׂ֑ה וְֽאֶת־שַׁוְעָתָ֥ם יִ֝שְׁמַ֗ע וְיוֹשִׁיעֵֽם׃ שׁוֹמֵ֣ר יְ֭הֹוָה אֶת־כׇּל־אֹהֲבָ֑יו וְאֵ֖ת כׇּל־הָרְשָׁעִ֣ים יַשְׁמִֽיד׃ תְּהִלַּ֥ת יְהֹוָ֗ה יְֽדַבֶּ֫ר פִּ֥י וִיבָרֵ֣ךְ כׇּל־בָּ֭שָׂר שֵׁ֥ם קׇדְשׁ֗וֹ לְעוֹלָ֥ם וָעֶֽד׃ וַאֲנַ֤חְנוּ ׀ נְבָ֘רֵ֤ךְ יָ֗הּ מֵעַתָּ֥ה וְעַד־עוֹלָ֗ם הַֽלְלוּיָֽהּ׃ "));
  parts.push(p("<small>ביום שאין אומרים בו תחנון מדלגים למנצח</small> "));
  parts.push(p("<b>לַמְנַצֵּ֗חַ</b> <small>(תהילים כ׳:א׳-ג׳)</small> מִזְמ֥וֹר לְדָוִֽד׃ יַֽעַנְךָ֣ יְ֭הֹוָה בְּי֣וֹם צָרָ֑ה יְ֝שַׂגֶּבְךָ֗ שֵׁ֤ם ׀ אֱלֹהֵ֬י יַעֲקֹֽב׃ יִשְׁלַֽח־עֶזְרְךָ֥ מִקֹּ֑דֶשׁ וּ֝מִצִּיּ֗וֹן יִסְעָדֶֽךָּ׃ יִזְכֹּ֥ר כׇּל־מִנְחֹתֶ֑ךָ וְעוֹלָתְךָ֖ יְדַשְּׁנֶ֣ה סֶֽלָה׃ יִֽתֶּן־לְךָ֥ כִלְבָבֶ֑ךָ וְֽכׇל־עֲצָתְךָ֥ יְמַלֵּֽא׃ נְרַנְּנָ֤ה ׀ בִּ֘ישׁ֤וּעָתֶ֗ךָ וּבְשֵֽׁם־אֱלֹהֵ֥ינוּ נִדְגֹּ֑ל יְמַלֵּ֥א יְ֝הֹוָ֗ה כׇּל־מִשְׁאֲלוֹתֶֽיךָ׃ עַתָּ֤ה יָדַ֗עְתִּי כִּ֤י הוֹשִׁ֥יעַ ׀ יְהֹוָ֗ה מְשִׁ֫יח֥וֹ יַ֭עֲנֵהוּ מִשְּׁמֵ֣י קׇדְשׁ֑וֹ בִּ֝גְבֻר֗וֹת יֵ֣שַׁע יְמִינֽוֹ׃ אֵ֣לֶּה בָ֭רֶכֶב וְאֵ֣לֶּה בַסּוּסִ֑ים וַאֲנַ֓חְנוּ ׀ בְּשֵׁם־יְהֹוָ֖ה אֱלֹהֵ֣ינוּ נַזְכִּֽיר׃ הֵ֭מָּה כָּרְע֣וּ וְנָפָ֑לוּ וַאֲנַ֥חְנוּ קַּ֝֗מְנוּ וַנִּתְעוֹדָֽד׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ׃"));
  parts.push(hr);

  // ─────────────────────────── ובא לציון גואל ───────────────────────────
  parts.push(p("<big><b>ובא לציון גואל </b></big>"));
  parts.push(p("<b>וּבָ֤א</b> לְצִיּוֹן֙ גּוֹאֵ֔ל וּלְשָׁבֵ֥י פֶ֖שַׁע בְּיַֽעֲקֹ֑ב נְאֻ֖ם יְהֹוָֽה׃ וַאֲנִ֗י זֹ֣את בְּרִיתִ֤י אוֹתָם֙ אָמַ֣ר יְהֹוָ֔ה רוּחִי֙ אֲשֶׁ֣ר עָלֶ֔יךָ וּדְבָרַ֖י אֲשֶׁר־שַׂ֣מְתִּי בְּפִ֑יךָ לֹֽא־יָמ֡וּשׁוּ מִפִּ֩יךָ֩ וּמִפִּ֨י זַרְעֲךָ֜ וּמִפִּ֨י זֶ֤רַע זַרְעֲךָ֙ אָמַ֣ר יְהֹוָ֔ה מֵעַתָּ֖ה וְעַד־עוֹלָֽם׃ וְאַתָּ֥ה קָד֑וֹשׁ י֝וֹשֵׁ֗ב תְּהִלּ֥וֹת יִשְׂרָאֵֽל׃ וְקָרָ֨א זֶ֤ה אֶל־זֶה֙ וְאָמַ֔ר קָד֧וֹשׁ ׀ קָד֛וֹשׁ קָד֖וֹשׁ יְהֹוָ֣ה צְבָא֑וֹת מְלֹ֥א כׇל־הָאָ֖רֶץ כְּבוֹדֽוֹ׃ וּמְקַבְּלִין דֵּין מִן דֵּין וְאָֽמְרִין: קַדִּישׁ בִּשְׁמֵי מְרוֹמָא עִלָּאָה בֵּית שְׁכִינְתֵּהּ, קַדִּישׁ עַל אַרְעָא עוֹבַד גְּבוּרְתֵּהּ, קַדִּישׁ לְעָלַם וּלְעָֽלְמֵי עָֽלְמַיָּא. יְהֹוָה צְבָאוֹת מַלְיָא כָל-אַרְעָא זִיו יְקָרֵהּ: וַתִּשָּׂאֵ֣נִי ר֔וּחַ וָאֶשְׁמַ֣ע אַחֲרַ֔י ק֖וֹל רַ֣עַשׁ גָּד֑וֹל בָּר֥וּךְ כְּבוֹד־יְהֹוָ֖ה מִמְּקוֹמֽוֹ׃ וּנְטָלַֽתְנִי רוּחָא, וּשְׁמָעִית בַּתְרַי קַל זִֽיעַ שַׂגִּיא דִּמְשַׁבְּחִין וְאָֽמְרִין: בְּרִיךְ יְקָרָא דַֽיהֹוָה מֵֽאֲתַר בֵּית שְׁכִינְתֵּהּ: יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד׃ יְהֹוָה מַלְכוּתֵיהּ קָאִים לְעָלַם וּלְעָֽלְמֵי עָֽלְמַיָּא: יְהֹוָ֗ה אֱ֠לֹהֵ֠י אַבְרָהָ֞ם יִצְחָ֤ק וְיִשְׂרָאֵל֙ אֲבֹתֵ֔ינוּ שׇׁמְרָה־זֹּ֣את לְעוֹלָ֔ם לְיֵ֥צֶר מַחְשְׁב֖וֹת לְבַ֣ב עַמֶּ֑ךָ וְהָכֵ֥ן לְבָבָ֖ם אֵלֶֽיךָ׃ וְה֤וּא רַח֨וּם ׀ יְכַפֵּ֥ר עָוֺן֮ וְֽלֹא־יַֽ֫שְׁחִ֥ית וְ֭הִרְבָּה לְהָשִׁ֣יב אַפּ֑וֹ וְלֹא־יָ֝עִ֗יר כׇּל־חֲמָתֽוֹ׃ כִּֽי־אַתָּ֣ה אֲ֭דֹנָי ט֣וֹב וְסַלָּ֑ח וְרַב־חֶ֗֝סֶד לְכׇל־קֹֽרְאֶֽיךָ׃ צִדְקָתְךָ֣ צֶ֣דֶק לְעוֹלָ֑ם וְֽתוֹרָתְךָ֥ אֱמֶֽת׃ תִּתֵּ֤ן אֱמֶת֙ לְיַֽעֲקֹ֔ב חֶ֖סֶד לְאַבְרָהָ֑ם אֲשֶׁר־נִשְׁבַּ֥עְתָּ לַאֲבֹתֵ֖ינוּ מִ֥ימֵי קֶֽדֶם׃ בָּ֤ר֣וּךְ אֲדֹנָי֮ י֤וֹם ׀ י֥֫וֹם יַעֲמָס־לָ֗נוּ הָ֘אֵ֤ל יְֽשׁוּעָתֵ֬נוּ סֶֽלָה׃ יְהֹוָ֣ה צְבָא֣וֹת עִמָּ֑נוּ מִשְׂגָּֽב־לָ֨נוּ אֱלֹהֵ֖י יַֽעֲקֹ֣ב סֶֽלָה׃ יְהֹוָ֥ה צְבָא֑וֹת אַֽשְׁרֵ֥י אָ֝דָ֗ם בֹּטֵ֥חַ בָּֽךְ׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: "));
  parts.push(p("<b>בָּרוּךְ</b> אֱלֹהֵֽינוּ שֶׁבְּרָאָֽנוּ לִכְבוֹדוֹ, וְהִבְדִּילָֽנוּ מִן הַתּוֹעִים, וְנָֽתַן לָֽנוּ תּוֹרַת אֱמֶת, וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ. הוּא יִפְתַּח לִבֵּֽנוּ בְּתֽוֹרָתוֹ, וְיָשִׂים בְּלִבֵּֽנוּ אַֽהֲבָתוֹ וְיִרְאָתוֹ לַֽעֲשׂוֹת רְצוֹנוֹ, וּלְעָבְדוֹ בְּלֵבָב שָׁלֵם. לֹא נִיגַע לָרִיק, וְלֹא נֵלֵד לַבֶּֽהָלָה. יְהִי רָצוֹן מִלְּפָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ וֵֽאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁנִּשְׁמוֹר חֻקֶּֽיךָ וּמִצְוֹתֶֽיךָ בָּעוֹלָם הַזֶּה, וְנִזְכֶּה, וְנִחְיֶה, וְנִירַשׁ טוֹבָה וּבְרָכָה לְחַיֵּי הָעוֹלָם הַבָּא: לְמַ֤עַן ׀ יְזַמֶּרְךָ֣ כָ֭בוֹד וְלֹ֣א יִדֹּ֑ם יְהֹוָ֥ה אֱ֝לֹהַ֗י לְעוֹלָ֥ם אוֹדֶֽךָּ׃ יְהֹוָ֥ה חָפֵ֖ץ לְמַ֣עַן צִדְק֑וֹ יַגְדִּ֥יל תּוֹרָ֖ה וְיַאְדִּֽיר: וְיִבְטְח֣וּ בְ֭ךָ יוֹדְעֵ֣י שְׁמֶ֑ךָ כִּ֤י לֹֽא־עָזַ֖בְתָּ דֹרְשֶׁ֣יךָ יְהֹוָֽה: יְהֹוָ֥ה אֲדֹנֵ֑ינוּ מָה־אַדִּ֥יר שִׁ֝מְךָ֗ בְּכׇל־הָאָֽרֶץ׃ חִ֭זְקוּ וְיַאֲמֵ֣ץ לְבַבְכֶ֑ם כׇּל־הַ֝מְיַחֲלִ֗ים לַֽיהֹוָֽה:"));
  parts.push(p("<small>ואומר החזן קדיש תתקבל</small> "));
  parts.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>תִּתְקַבַּל</b> צְלוֹתָֽנָא וּבָֽעוּתָֽנָא, עִם צְלֽוֹתְהוֹן וּבָעֽוּתְהוֹן דְּכָל-בֵּית יִשְׂרָאֵל, קֳדָם אֲבוּנָא דְּבִשְׁמַיָּא וְאַרְעָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>  "));
  parts.push(p("<small><b>יְהֵא</b> שְׁלָמָא רַבָּא מִן שְׁמַיָּא. חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה. וְשֵׁיזָבָא וּרְפוּאָה וּגְאוּלָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה לָנוּ וּלְכָל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>  "));
  parts.push(p("<small>יפסע שלש פסיעות לאחור<br><b>עוֹשֶׂה</b> שָׁלוֹם בִּמְרוֹמָיו. הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>   "));
  parts.push(p("<small>ומחזירין את ספר התורה למקומו ואומרים יהללו</small> "));
  parts.push(p("<small><b>יְהַלְל֤וּ</b> ׀ אֶת־שֵׁ֬ם יְהֹוָ֗ה כִּֽי־נִשְׂגָּ֣ב שְׁמ֣וֹ לְבַדּ֑וֹ ה֝וֹד֗וֹ עַל־אֶ֥רֶץ וְשָׁמָֽיִם׃ וַיָּ֤רֶם קֶ֨רֶן ׀ לְעַמּ֡וֹ תְּהִלָּ֤ה לְֽכׇל־חֲסִידָ֗יו לִבְנֵ֣י יִ֭שְׂרָאֵל עַ֥ם קְרֹב֗וֹ הַֽלְלוּיָֽהּ׃ יְהֹוָה הוּא הָאֱלֹהִים, יְהֹוָה֙ ה֣וּא הָֽאֱלֹהִ֔ים בַּשָּׁמַ֣יִם מִמַּ֔עַל וְעַל־הָאָ֖רֶץ מִתָּ֑חַת אֵ֖ין עֽוֹד: אֵין־כָּמ֖וֹךָ בָאֱלֹהִ֥ים ׀ אֲדֹנָ֗י וְאֵ֣ין כְּֽמַעֲשֶֽׂיךָ׃ הֲשִׁיבֵ֨נוּ יְהֹוָ֤ה ׀ אֵלֶ֙יךָ֙ ונשוב [וְֽנָשׁ֔וּבָה] חַדֵּ֥שׁ יָמֵ֖ינוּ כְּקֶֽדֶם׃</small> "));
  parts.push(hr);

  // ─────────────────────────── בית יעקב ───────────────────────────
  parts.push(p("<big><b>בית יעקב </b></big>"));
  parts.push(p("<small>בימים שאין אומרים תחנון אין אומרים תפלה לדוד</small> "));
  parts.push(p("<b>תְּפִלָּ֗ה</b> <small>(תהלים פו)</small> לְדָ֫וִ֥ד הַטֵּֽה־יְהֹוָ֣ה אׇזְנְךָ֣ עֲנֵ֑נִי כִּֽי־עָנִ֖י וְאֶבְי֣וֹן אָֽנִי׃ שָׁ֥מְרָ֣ה נַפְשִׁי֮ כִּֽי־חָסִ֢יד אָ֥נִי הוֹשַׁ֣ע עַ֭בְדְּךָ אַתָּ֣ה אֱלֹהַ֑י הַבּוֹטֵ֥חַ אֵלֶֽיךָ׃ חׇנֵּ֥נִי אֲדֹנָ֑י כִּ֥י אֵלֶ֥יךָ אֶ֝קְרָ֗א כׇּל־הַיּֽוֹם׃ שַׂ֭מֵּחַ נֶ֣פֶשׁ עַבְדֶּ֑ךָ כִּ֥י אֵלֶ֥יךָ אֲ֝דֹנָ֗י נַפְשִׁ֥י אֶשָּֽׂא׃ כִּֽי־אַתָּ֣ה אֲ֭דֹנָי ט֣וֹב וְסַלָּ֑ח וְרַב־חֶ֗֝סֶד לְכׇל־קֹֽרְאֶֽיךָ׃ הַאֲזִ֣ינָה יְ֭הֹוָה תְּפִלָּתִ֑י וְ֝הַקְשִׁ֗יבָה בְּק֣וֹל תַּחֲנוּנוֹתָֽי׃ בְּי֣וֹם צָ֭רָתִ֥י אֶקְרָאֶ֗ךָּ כִּ֣י תַעֲנֵֽנִי׃ אֵין־כָּמ֖וֹךָ בָאֱלֹהִ֥ים ׀ אֲדֹנָ֗י וְאֵ֣ין כְּֽמַעֲשֶֽׂיךָ׃ כׇּל־גּוֹיִ֤ם ׀ אֲשֶׁ֥ר עָשִׂ֗יתָ יָב֤וֹאוּ ׀ וְיִשְׁתַּֽחֲו֣וּ לְפָנֶ֣יךָ אֲדֹנָ֑י וִ֖יכַבְּד֣וּ לִשְׁמֶֽךָ׃ כִּֽי־גָד֣וֹל אַ֭תָּה וְעֹשֵׂ֣ה נִפְלָא֑וֹת אַתָּ֖ה אֱלֹהִ֣ים לְבַדֶּֽךָ׃ ה֘וֹרֵ֤נִי יְהֹוָ֨ה ׀ דַּרְכֶּ֗ךָ אֲהַלֵּ֥ךְ בַּאֲמִתֶּ֑ךָ יַחֵ֥ד לְ֝בָבִ֗י לְיִרְאָ֥ה שְׁמֶֽךָ׃ אוֹדְךָ֤ ׀ אֲדֹנָ֣י אֱ֭לֹהַי בְּכׇל־לְבָבִ֑י וַאֲכַבְּדָ֖ה שִׁמְךָ֣ לְעוֹלָֽם׃ כִּֽי־חַ֭סְדְּךָ גָּד֣וֹל עָלָ֑י וְהִצַּ֥לְתָּ נַ֝פְשִׁ֗י מִשְּׁא֥וֹל תַּחְתִּיָּֽה׃ אֱלֹהִ֤ים ׀ זֵ֘דִ֤ים קָֽמוּ־עָלַ֗י וַעֲדַ֣ת עָ֭רִיצִים בִּקְשׁ֣וּ נַפְשִׁ֑י וְלֹ֖א שָׂמ֣וּךָ לְנֶגְדָּֽם׃ וְאַתָּ֣ה אֲ֭דֹנָי אֵל־רַח֣וּם וְחַנּ֑וּן אֶ֥רֶךְ אַ֝פַּ֗יִם וְרַב־חֶ֥סֶד וֶאֱמֶֽת׃ פְּנֵ֥ה אֵלַ֗י וְחָ֫נֵּ֥נִי תְּנָֽה־עֻזְּךָ֥ לְעַבְדֶּ֑ךָ וְ֝הוֹשִׁ֗יעָה לְבֶן־אֲמָתֶֽךָ׃ עֲשֵֽׂה־עִמִּ֥י א֗וֹת לְט֫וֹבָ֥ה וְיִרְא֣וּ שֹׂנְאַ֣י וְיֵבֹ֑שׁוּ כִּֽי־אַתָּ֥ה יְ֝הֹוָ֗ה עֲזַרְתַּ֥נִי וְנִחַמְתָּֽנִי׃ "));
  parts.push(p("<b>בֵּ֖ית</b> יַעֲקֹ֑ב לְכ֥וּ וְנֵלְכָ֖ה בְּא֥וֹר יְהֹוָֽה׃ כִּ֚י כׇּל־הָ֣עַמִּ֔ים יֵלְכ֕וּ אִ֖ישׁ בְּשֵׁ֣ם אֱלֹהָ֑יו וַאֲנַ֗חְנוּ נֵלֵ֛ךְ בְּשֵׁם־יְהֹוָ֥ה אֱלֹהֵ֖ינוּ לְעוֹלָ֥ם וָעֶֽד׃ יְהִ֨י יְהֹוָ֤ה אֱלֹהֵ֙ינוּ֙ עִמָּ֔נוּ כַּאֲשֶׁ֥ר הָיָ֖ה עִם־אֲבֹתֵ֑ינוּ אַל־יַעַזְבֵ֖נוּ וְאַֽל־יִטְּשֵֽׁנוּ׃ לְהַטּ֥וֹת לְבָבֵ֖נוּ אֵלָ֑יו לָלֶ֣כֶת בְּכׇל־דְּרָכָ֗יו וְלִשְׁמֹ֨ר מִצְוֺתָ֤יו וְחֻקָּיו֙ וּמִשְׁפָּטָ֔יו אֲשֶׁ֥ר צִוָּ֖ה אֶת־אֲבֹתֵֽינוּ׃ וְיִֽהְי֨וּ דְבָרַ֜י אֵ֗לֶּה אֲשֶׁ֤ר הִתְחַנַּ֙נְתִּי֙ לִפְנֵ֣י יְהֹוָ֔ה קְרֹבִ֛ים אֶל־יְהֹוָ֥ה אֱלֹהֵ֖ינוּ יוֹמָ֣ם וָלָ֑יְלָה לַעֲשׂ֣וֹת ׀ מִשְׁפַּ֣ט עַבְדּ֗וֹ וּמִשְׁפַּ֛ט עַמּ֥וֹ יִשְׂרָאֵ֖ל דְּבַר־י֥וֹם בְּיוֹמֽוֹ׃ לְמַ֗עַן דַּ֚עַת כׇּל־עַמֵּ֣י הָאָ֔רֶץ כִּ֥י יְהֹוָ֖ה ה֣וּא הָאֱלֹהִ֑ים אֵ֖ין עֽוֹד׃"));
  parts.push(p("<b>שִׁ֥יר</b> <small>(תהילים קכ״ד:א׳-ב׳)</small> הַֽמַּעֲל֗וֹת לְדָ֫וִ֥ד לוּלֵ֣י יְ֭הֹוָה שֶׁהָ֣יָה לָ֑נוּ יֹאמַר־נָ֗֝א יִשְׂרָאֵֽל׃ לוּלֵ֣י יְ֭הֹוָה שֶׁהָ֣יָה לָ֑נוּ בְּק֖וּם עָלֵ֣ינוּ אָדָֽם׃ אֲ֭זַי חַיִּ֣ים בְּלָע֑וּנוּ בַּחֲר֖וֹת אַפָּ֣ם בָּֽנוּ׃ אֲ֭זַי הַמַּ֣יִם שְׁטָפ֑וּנוּ נַ֗֝חְלָה עָבַ֥ר עַל־נַפְשֵֽׁנוּ׃ אֲ֭זַי עָבַ֣ר עַל־נַפְשֵׁ֑נוּ הַ֝מַּ֗יִם הַזֵּידוֹנִֽים׃ בָּר֥וּךְ יְהֹוָ֑ה שֶׁלֹּ֥א נְתָנָ֥נוּ טֶ֗֝רֶף לְשִׁנֵּיהֶֽם׃ נַפְשֵׁ֗נוּ כְּצִפּ֥וֹר נִמְלְטָה֮ מִפַּ֢ח י֫וֹקְשִׁ֥ים הַפַּ֥ח נִשְׁבָּ֗ר וַאֲנַ֥חְנוּ נִמְלָֽטְנוּ׃ עֶ֭זְרֵנוּ בְּשֵׁ֣ם יְהֹוָ֑ה עֹ֝שֵׂ֗ה שָׁמַ֥יִם וָאָֽרֶץ׃"));
  parts.push(hr);

  // ─────────────────────────── שיר של יום ───────────────────────────
  parts.push(p("<big><b>שיר של יום</b></big>"));
  parts.push(p("<small>בכל יום אומר המזמור השיך לאותו יום</small> "));
  {
    var sodArr = [
      "<small>מזמור ליום ראשון</small> הַיּוֹם יוֹם אֶחָד בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן: ",
      "<b>לְדָוִ֗ד</b> <small>(תהילים כ״ד:א׳-ב׳)</small> מִ֫זְמ֥וֹר לַֽ֭יהֹוָה הָאָ֣רֶץ וּמְלוֹאָ֑הּ תֵּ֝בֵ֗ל וְיֹ֣שְׁבֵי בָֽהּ׃ כִּי־ה֭וּא עַל־יַמִּ֣ים יְסָדָ֑הּ וְעַל־נְ֝הָר֗וֹת יְכוֹנְנֶֽהָ׃ מִֽי־יַעֲלֶ֥ה בְהַר־יְהֹוָ֑ה וּמִי־יָ֝קוּם בִּמְק֥וֹם קׇדְשֽׁוֹ׃ נְקִ֥י כַפַּ֗יִם וּֽבַר־לֵ֫בָ֥ב אֲשֶׁ֤ר ׀ לֹא־נָשָׂ֣א לַשָּׁ֣וְא נַפְשִׁ֑י וְלֹ֖א נִשְׁבַּ֣ע לְמִרְמָֽה׃ יִשָּׂ֣א בְ֭רָכָה מֵאֵ֣ת יְהֹוָ֑ה וּ֝צְדָקָ֗ה מֵאֱלֹהֵ֥י יִשְׁעֽוֹ׃ זֶ֭ה דּ֣וֹר דֹּרְשָׁ֑ו מְבַקְשֵׁ֨י פָנֶ֖יךָ יַעֲקֹ֣ב סֶֽלָה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וְֽ֭הִנָּשְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָב֗וֹא מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֥י זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְ֭הֹוָה עִזּ֣וּז וְגִבּ֑וֹר יְ֝הֹוָ֗ה גִּבּ֥וֹר מִלְחָמָֽה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וּ֭שְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָבֹ֗א מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֤י ה֣וּא זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְהֹוָ֥ה צְבָא֑וֹת ה֤וּא מֶ֖לֶךְ הַכָּב֣וֹד סֶֽלָה׃ <small>וממשיך הושיענו</small> ",
      "<small>מזמור ליום שני</small> הַיּוֹם יוֹם שֵׁנִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>שִׁ֥יר</b> <small>(תהילים מ״ח:א׳-ג׳)</small> מִ֝זְמ֗וֹר לִבְנֵי־קֹֽרַח׃ גָּ֘ד֤וֹל יְהֹוָ֣ה וּמְהֻלָּ֣ל מְאֹ֑ד בְּעִ֥יר אֱ֝לֹהֵ֗ינוּ הַר־קׇדְשֽׁוֹ׃ יְפֵ֥ה נוֹף֮ מְשׂ֢וֹשׂ כׇּל־הָ֫אָ֥רֶץ הַר־צִ֭יּוֹן יַרְכְּתֵ֣י צָפ֑וֹן קִ֝רְיַ֗ת מֶ֣לֶךְ רָֽב׃ אֱלֹהִ֥ים בְּאַרְמְנוֹתֶ֗יהָ נוֹדַ֥ע לְמִשְׂגָּֽב׃ כִּֽי־הִנֵּ֣ה הַ֭מְּלָכִים נ֥וֹעֲד֑וּ עָבְר֥וּ יַחְדָּֽו׃ הֵ֣מָּה רָ֭אוּ כֵּ֣ן תָּמָ֑הוּ נִבְהֲל֥וּ נֶחְפָּֽזוּ׃ רְ֭עָדָה אֲחָזָ֣תַם שָׁ֑ם חִ֗֝יל כַּיּוֹלֵדָֽה׃ בְּר֥וּחַ קָדִ֑ים תְּ֝שַׁבֵּ֗ר אֳנִיּ֥וֹת תַּרְשִֽׁישׁ׃ כַּאֲשֶׁ֤ר שָׁמַ֨עְנוּ ׀ כֵּ֤ן רָאִ֗ינוּ בְּעִיר־יְהֹוָ֣ה צְ֭בָאוֹת בְּעִ֣יר אֱלֹהֵ֑ינוּ אֱלֹ֘הִ֤ים יְכוֹנְנֶ֖הָ עַד־עוֹלָ֣ם סֶֽלָה׃ דִּמִּ֣ינוּ אֱלֹהִ֣ים חַסְדֶּ֑ךָ בְּ֝קֶ֗רֶב הֵיכָלֶֽךָ׃ כְּשִׁמְךָ֤ אֱלֹהִ֗ים כֵּ֣ן תְּ֭הִלָּתְךָ עַל־קַצְוֵי־אֶ֑רֶץ צֶ֗֝דֶק מָלְאָ֥ה יְמִינֶֽךָ׃ יִשְׂמַ֤ח ׀ הַר־צִיּ֗וֹן תָּ֭גֵלְנָה בְּנ֣וֹת יְהוּדָ֑ה לְ֝מַ֗עַן מִשְׁפָּטֶֽיךָ׃ סֹ֣בּוּ צִ֭יּוֹן וְהַקִּיפ֑וּהָ סִ֝פְר֗וּ מִגְדָּלֶֽיהָ׃ שִׁ֤יתוּ לִבְּכֶ֨ם ׀ לְֽחֵילָ֗ה פַּסְּג֥וּ אַרְמְנוֹתֶ֑יהָ לְמַ֥עַן תְּ֝סַפְּר֗וּ לְד֣וֹר אַֽחֲרֽוֹן׃ כִּ֤י זֶ֨ה ׀ אֱלֹהִ֣ים אֱ֭לֹהֵינוּ עוֹלָ֣ם וָעֶ֑ד ה֖וּא יְנַהֲגֵ֣נוּ עַל־מֽוּת׃ <small>וממשיך הושיענו</small> ",
      "<small>מזמור ליום שלישי</small> הַיּוֹם יוֹם שְׁלִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן: ",
      "<b>מִזְמ֗וֹר</b> <small>(תהילים פ״ב:א׳-ב׳)</small> לְאָ֫סָ֥ף אֱֽלֹהִ֗ים נִצָּ֥ב בַּעֲדַת־אֵ֑ל בְּקֶ֖רֶב אֱלֹהִ֣ים יִשְׁפֹּֽט׃ עַד־מָתַ֥י תִּשְׁפְּטוּ־עָ֑וֶל וּפְנֵ֥י רְ֝שָׁעִ֗ים תִּשְׂאוּ־סֶֽלָה׃ שִׁפְטוּ־דַ֥ל וְיָת֑וֹם עָנִ֖י וָרָ֣שׁ הַצְדִּֽיקוּ׃ פַּלְּטוּ־דַ֥ל וְאֶבְי֑וֹן מִיַּ֖ד רְשָׁעִ֣ים הַצִּֽילוּ׃ לֹ֤א יָדְע֨וּ ׀ וְלֹ֥א יָבִ֗ינוּ בַּחֲשֵׁכָ֥ה יִתְהַלָּ֑כוּ יִ֝מּ֗וֹטוּ כׇּל־מ֥וֹסְדֵי אָֽרֶץ׃ אֲֽנִי־אָ֭מַרְתִּי אֱלֹהִ֣ים אַתֶּ֑ם וּבְנֵ֖י עֶלְי֣וֹן כֻּלְּכֶֽם׃ אָ֭כֵן כְּאָדָ֣ם תְּמוּת֑וּן וּכְאַחַ֖ד הַשָּׂרִ֣ים תִּפֹּֽלוּ׃ קוּמָ֣ה אֱ֭לֹהִים שׇׁפְטָ֣ה הָאָ֑רֶץ כִּֽי־אַתָּ֥ה תִ֝נְחַ֗ל בְּכׇל־הַגּוֹיִֽם׃ <small>וממשיך הושיענו</small> ",
      "<small>מזמור ליום רביעי</small> הַיּוֹם יוֹם רְבִיעִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>אֵל־נְקָמ֥וֹת</b> <small>(תהילים צ״ד:א׳-ג׳)</small> יְהֹוָ֑ה אֵ֖ל נְקָמ֣וֹת הוֹפִֽיעַ׃ הִ֭נָּשֵׂא שֹׁפֵ֣ט הָאָ֑רֶץ הָשֵׁ֥ב גְּ֝מ֗וּל עַל־גֵּאִֽים׃ עַד־מָתַ֖י רְשָׁעִ֥ים ׀ יְהֹוָ֑ה עַד־מָ֝תַ֗י רְשָׁעִ֥ים יַעֲלֹֽזוּ׃ יַבִּ֣יעוּ יְדַבְּר֣וּ עָתָ֑ק יִ֝תְאַמְּר֗וּ כׇּל־פֹּ֥עֲלֵי אָֽוֶן׃ עַמְּךָ֣ יְהֹוָ֣ה יְדַכְּא֑וּ וְֽנַחֲלָתְךָ֥ יְעַנּֽוּ׃ אַלְמָנָ֣ה וְגֵ֣ר יַהֲרֹ֑גוּ וִ֖יתוֹמִ֣ים יְרַצֵּֽחוּ׃ וַ֭יֹּ֣אמְרוּ לֹ֣א יִרְאֶה־יָּ֑הּ וְלֹא־יָ֝בִ֗ין אֱלֹהֵ֥י יַעֲקֹֽב׃ בִּ֭ינוּ בֹּעֲרִ֣ים בָּעָ֑ם וּ֝כְסִילִ֗ים מָתַ֥י תַּשְׂכִּֽילוּ׃ הֲנֹ֣טַֽע אֹ֭זֶן הֲלֹ֣א יִשְׁמָ֑ע אִֽם־יֹ֥צֵֽר עַ֗֝יִן הֲלֹ֣א יַבִּֽיט׃ הֲיֹסֵ֣ר גּ֭וֹיִם הֲלֹ֣א יוֹכִ֑יחַ הַֽמְלַמֵּ֖ד אָדָ֣ם דָּֽעַת׃ יְֽהֹוָ֗ה יֹ֭דֵעַ מַחְשְׁב֣וֹת אָדָ֑ם כִּי־הֵ֥מָּה הָֽבֶל׃ אַשְׁרֵ֤י ׀ הַגֶּ֣בֶר אֲשֶׁר־תְּיַסְּרֶ֣נּוּ יָּ֑הּ וּֽמִתּוֹרָתְךָ֥ תְלַמְּדֶֽנּוּ׃ לְהַשְׁקִ֣יט ל֭וֹ מִ֣ימֵי רָ֑ע עַ֤ד יִכָּרֶ֖ה לָרָשָׁ֣ע שָֽׁחַת׃ כִּ֤י ׀ לֹא־יִטֹּ֣שׁ יְהֹוָ֣ה עַמּ֑וֹ וְ֝נַחֲלָת֗וֹ לֹ֣א יַעֲזֹֽב׃ כִּֽי־עַד־צֶ֭דֶק יָשׁ֣וּב מִשְׁפָּ֑ט וְ֝אַחֲרָ֗יו כׇּל־יִשְׁרֵי־לֵֽב׃ מִֽי־יָק֣וּם לִ֭י עִם־מְרֵעִ֑ים מִי־יִתְיַצֵּ֥ב לִ֗֝י עִם־פֹּ֥עֲלֵי אָֽוֶן׃ לוּלֵ֣י יְ֭הֹוָה עֶזְרָ֣תָה לִּ֑י כִּמְעַ֓ט ׀ שָׁכְנָ֖ה דוּמָ֣ה נַפְשִֽׁי׃ אִם־אָ֭מַרְתִּי מָ֣טָה רַגְלִ֑י חַסְדְּךָ֥ יְ֝הֹוָ֗ה יִסְעָדֵֽנִי׃ בְּרֹ֣ב שַׂרְעַפַּ֣י בְּקִרְבִּ֑י תַּ֝נְחוּמֶ֗יךָ יְֽשַׁעַשְׁע֥וּ נַפְשִֽׁי׃ הַֽ֭יְחׇבְרְךָ כִּסֵּ֣א הַוּ֑וֹת יֹצֵ֖ר עָמָ֣ל עֲלֵי־חֹֽק׃ יָ֭גוֹדּוּ עַל־נֶ֣פֶשׁ צַדִּ֑יק וְדָ֖ם נָקִ֣י יַרְשִֽׁיעוּ׃ וַיְהִ֬י יְהֹוָ֣ה לִ֣י לְמִשְׂגָּ֑ב וֵ֝אלֹהַ֗י לְצ֣וּר מַחְסִֽי׃ וַיָּ֤שֶׁב עֲלֵיהֶ֨ם ׀ אֶת־אוֹנָ֗ם וּבְרָעָתָ֥ם יַצְמִיתֵ֑ם יַ֝צְמִיתֵ֗ם יְהֹוָ֥ה אֱלֹהֵֽינוּ׃ <small>וממשיך הושיענו</small> ",
      "<small>מזמור ליום חמישי</small> הַיּוֹם יוֹם חֲמִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן: ",
      "<b>לַמְנַצֵּ֬חַ</b> ׀ <small>(תהילים פ״א:א׳-ג׳)</small> עַֽל־הַגִּתִּ֬ית לְאָסָֽף׃ הַ֭רְנִינוּ לֵאלֹהִ֣ים עוּזֵּ֑נוּ הָ֝רִ֗יעוּ לֵאלֹהֵ֥י יַעֲקֹֽב׃ שְֽׂאוּ־זִ֭מְרָה וּתְנוּ־תֹ֑ף כִּנּ֖וֹר נָעִ֣ים עִם־נָֽבֶל׃ תִּקְע֣וּ בַחֹ֣דֶשׁ שׁוֹפָ֑ר בַּ֝כֵּ֗סֶה לְי֣וֹם חַגֵּֽנוּ׃ כִּ֤י חֹ֣ק לְיִשְׂרָאֵ֣ל ה֑וּא מִ֝שְׁפָּ֗ט לֵאלֹהֵ֥י יַעֲקֹֽב׃ עֵ֤דוּת ׀ בִּיה֘וֹסֵ֤ף שָׂמ֗וֹ בְּ֭צֵאתוֹ עַל־אֶ֣רֶץ מִצְרָ֑יִם שְׂפַ֖ת לֹא־יָדַ֣עְתִּי אֶשְׁמָֽע׃ הֲסִיר֣וֹתִי מִסֵּ֣בֶל שִׁכְמ֑וֹ כַּ֝פָּ֗יו מִדּ֥וּד תַּעֲבֹֽרְנָה׃ בַּצָּרָ֥ה קָרָ֗אתָ וָאֲחַ֫לְּצֶ֥ךָּ אֶ֭עֶנְךָ בְּסֵ֣תֶר רַ֑עַם אֶבְחׇנְךָ֨ עַל־מֵ֖י מְרִיבָ֣ה סֶֽלָה׃ שְׁמַ֣ע עַ֭מִּי וְאָעִ֣ידָה בָּ֑ךְ יִ֝שְׂרָאֵ֗ל אִם־תִּֽשְׁמַֽע־לִֽי׃ לֹא־יִהְיֶ֣ה בְ֭ךָ אֵ֣ל זָ֑ר וְלֹ֥א תִ֝שְׁתַּחֲוֶ֗ה לְאֵ֣ל נֵכָֽר׃ אָֽנֹכִ֨י ׀ יְהֹ֘וָ֤ה אֱלֹהֶ֗יךָ הַֽ֭מַּעַלְךָ מֵאֶ֣רֶץ מִצְרָ֑יִם הַרְחֶב־פִּ֗֝יךָ וַאֲמַלְאֵֽהוּ׃ וְלֹֽא־שָׁמַ֣ע עַמִּ֣י לְקוֹלִ֑י וְ֝יִשְׂרָאֵ֗ל לֹא־אָ֥בָה לִֽי׃ וָ֭אֲשַׁלְּחֵהוּ בִּשְׁרִיר֣וּת לִבָּ֑ם יֵ֝לְכ֗וּ בְּֽמוֹעֲצ֖וֹתֵיהֶֽם׃ ל֗וּ עַ֭מִּי שֹׁמֵ֣עַֽ לִ֑י יִ֝שְׂרָאֵ֗ל בִּדְרָכַ֥י יְהַלֵּֽכוּ׃ כִּ֭מְעַט אוֹיְבֵיהֶ֣ם אַכְנִ֑יעַ וְעַ֥ל צָ֝רֵיהֶ֗ם אָשִׁ֥יב יָדִֽי׃ מְשַׂנְאֵ֣י יְ֭הֹוָה יְכַחֲשׁוּ־ל֑וֹ וִיהִ֖י עִתָּ֣ם לְעוֹלָֽם׃ וַֽ֭יַּאֲכִילֵהוּ מֵחֵ֣לֶב חִטָּ֑ה וּ֝מִצּ֗וּר דְּבַ֣שׁ אַשְׂבִּיעֶֽךָ׃ <small>וממשיך הושיענו</small> ",
      "<small>מזמור ליום ששי</small> הַיּוֹם יוֹם הַשִּׁשִּׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<small>(תהילים צ״ג:א׳-ב׳)</small> יְהֹוָ֣ה מָלָךְ֮ גֵּא֢וּת לָ֫בֵ֥שׁ לָבֵ֣שׁ יְ֭הֹוָה עֹ֣ז הִתְאַזָּ֑ר אַף־תִּכּ֥וֹן תֵּ֝בֵ֗ל בַּל־תִּמּֽוֹט׃ נָכ֣וֹן כִּסְאֲךָ֣ מֵאָ֑ז מֵעוֹלָ֣ם אָֽתָּה׃ נָשְׂא֤וּ נְהָר֨וֹת ׀  יְֽהֹוָ֗ה נָשְׂא֣וּ נְהָר֣וֹת קוֹלָ֑ם יִשְׂא֖וּ נְהָר֣וֹת דׇּכְיָֽם׃ מִקֹּל֨וֹת ׀  מַ֤יִם רַבִּ֗ים אַדִּירִ֣ים מִשְׁבְּרֵי־יָ֑ם אַדִּ֖יר בַּמָּר֣וֹם יְהֹוָֽה׃ עֵֽדֹתֶ֨יךָ ׀ נֶאֶמְנ֬וּ מְאֹ֗ד לְבֵיתְךָ֥ נַאֲוָה־קֹ֑דֶשׁ יְ֝הֹוָ֗ה לְאֹ֣רֶךְ יָמִֽים׃ <br><br><b>הוֹשִׁיעֵ֨נוּ</b> ׀ יְהֹ֘וָ֤ה אֱלֹהֵ֗ינוּ וְקַבְּצֵנוּ֮ מִֽן־הַגּ֫וֹיִ֥ם לְ֭הֹדוֹת לְשֵׁ֣ם קׇדְשֶׁ֑ךָ לְ֝הִשְׁתַּבֵּ֗חַ בִּתְהִלָּתֶֽךָ: בָּ֤רֽוּךְ יְהֹוָ֨ה אֱלֹהֵ֪י יִשְׂרָאֵ֡ל מִן־הָ֤עוֹלָ֨ם ׀ וְעַ֬ד הָעוֹלָ֗ם וְאָמַ֖ר כׇּל־הָעָ֥ם אָמֵ֗ן הַֽלְלוּיָֽהּ: בָּ֘ר֤וּךְ יְהֹוָ֨ה ׀ מִצִּיּ֗וֹן שֹׁ֘כֵ֤ן יְֽרוּשָׁלִָ֗ם הַֽלְלוּיָֽהּ: בָּר֤וּךְ ׀ יְהֹוָ֣ה אֱ֭לֹהִים אֱלֹהֵ֣י יִשְׂרָאֵ֑ל עֹשֵׂ֖ה נִפְלָא֣וֹת לְבַדּֽוֹ׃ וּבָר֤וּךְ ׀ שֵׁ֥ם כְּבוֹד֗וֹ לְע֫וֹלָ֥ם וְיִמָּלֵ֣א כְ֭בוֹדוֹ אֶת־כֹּ֥ל הָאָ֗רֶץ אָ֘מֵ֥ן ׀ וְאָמֵֽן:",
      "<small>מזמור ליום שבת</small> הַיּוֹם יוֹם שַׁבַּת קֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>מִזְמ֗וֹר</b> שִׁ֧יר לְי֣וֹם הַשַּׁבָּ֑ת <small>(תהלים צ\"ב)</small> טוֹב֗ לְהֹד֥וֹת לַ֝יהֹוָ֗ה וּלְזַמֵּ֥ר לְשִׁמְךָ֗ עֶלְיֽוֹן׃ לְהַגִּ֗יד בַּבֹּ֥קֶר חַסְדֶּ֑ךָ וֶֽ֝אֱמֽוּנָתְךָ֗ בַּלֵּילֽוֹת׃ עֲלֵ֤י עָשׂ֨וֹר ׀ וַעֲלֵי־נָ֗בֶל עֲלֵ֣י הִגָּי֣וֹן בְּכִנּֽוֹר׃ כִּ֤י שִׂמַּחְתַּ֥נִי יְהֹוָ֗ה בְּפׇעֳלֶ֑ךָ בְּֽמַעֲשֵׂ֖י יָדֶ֣יךָ אֲרַנֵּֽן׃ מַה־גָּדְל֣וּ מַ֭עֲשֶׂיךָ יְהֹוָ֑ה מְאֹ֥ד עָמְק֖וּ מַחְשְׁבֹתֶֽיךָ׃ אִ֤ישׁ בַּ֣עַר לֹ֣א יֵדָ֑ע וּ֝כְסִ֗יל לֹ֣א יָבִ֥ין אֶת־זֹֽאת׃ בִּפְרֹ֤חַ רְשָׁעִ֨ים ׀ כְּמ֥וֹ עֵ֗שֶׂב וַיָּצִ֥יצוּ כׇּל־פֹּ֫עֲלֵ֥י אָ֑וֶן לְהִשָּׁ֝מְדָ֗ם עֲדֵי־עַֽד׃ וְאַתָּ֥ה מָר֑וֹם לְעֹלָ֣ם יְהֹוָֽה׃ כִּ֤י הִנֵּ֪ה אֹיְבֶ֡יךָ ׀ יְהֹוָ֗ה כִּֽי־הִנֵּ֣ה אֹיְבֶ֣יךָ יֹאבֵ֑דוּ יִ֝תְפָּרְד֗וּ כׇּל־פֹּ֥עֲלֵי אָֽוֶן׃ וַתָּ֤רֶם כִּרְאֵ֣ים קַרְנִ֑י בַּ֝לֹּתִ֗י בְּשֶׁ֣מֶן רַעֲנָֽן׃ וַתַּבֵּ֣ט עֵינִ֣י בְשׁוּרָ֑י בַּ֝קָּמִ֗ים עָלַ֥י מְרֵעִ֗ים תִּשְׁמַ֥עְנָה אׇזְנָֽי׃ צַדִּ֡יק כַּתָּמָ֣ר יִ֭פְרָח כְּאֶ֣רֶז בַּלְּבָנ֑וֹן יִשְׂגֶּֽה׃ שְׁ֭תוּלִים בְּבֵ֣ית יְהֹוָ֑ה בְּחַצְר֥וֹת אֱ֝לֹהֵ֗ינוּ יַפְרִֽיחוּ׃ עוֹד֮ יְנוּב֢וּן בְּשֵׂ֫יבָ֥ה דְּשֵׁנִ֥ים וְרַעֲנַנִּ֗ים יִהְיֽוּ׃ לְ֭הַגִּיד כִּי־יָשָׁ֣ר יְהֹוָ֑ה צוּרִ֗֝י וְלֹא־עַוְלָ֥תָה בּֽוֹ׃ <small>וממשיך הושיענו</small>",
    ];
    var todayDowIdx = (dow === 6) ? 6 : dow;
    parts.push(p(sodArr[todayDowIdx * 2]));
    parts.push(p(sodArr[todayDowIdx * 2 + 1]));
  }
  if (context.isFastDay) {
    parts.push(sup(p("<small>בצום גדליה ובעשרה בטבת אומרים</small> ") + p("<small>שִׁ֖יר (תהילים פ״ג:א׳-ג׳) מִזְמ֣וֹר לְאָסָֽף׃ אֱלֹהִ֥ים אַל־דֳּמִי־לָ֑ךְ אַל־תֶּחֱרַ֖שׁ וְאַל־תִּשְׁקֹ֣ט אֵֽל׃ כִּֽי־הִנֵּ֣ה א֭וֹיְבֶיךָ יֶהֱמָי֑וּן וּ֝מְשַׂנְאֶ֗יךָ נָ֣שְׂאוּ רֹֽאשׁ׃ עַֽל־עַ֭מְּךָ יַעֲרִ֣ימוּ ס֑וֹד וְ֝יִתְיָעֲצ֗וּ עַל־צְפוּנֶֽיךָ׃ אָמְר֗וּ לְ֭כוּ וְנַכְחִידֵ֣ם מִגּ֑וֹי וְלֹֽא־יִזָּכֵ֖ר שֵֽׁם־יִשְׂרָאֵ֣ל עֽוֹד׃ כִּ֤י נוֹעֲצ֣וּ לֵ֣ב יַחְדָּ֑ו עָ֝לֶ֗יךָ בְּרִ֣ית יִכְרֹֽתוּ׃ אׇהֳלֵ֣י אֱ֭דוֹם וְיִשְׁמְעֵאלִ֗ים מוֹאָ֥ב וְהַגְרִֽים׃ גְּבָ֣ל וְ֭עַמּוֹן וַעֲמָלֵ֑ק פְּ֝לֶ֗שֶׁת עִם־יֹ֥שְׁבֵי צֽוֹר׃ גַּם־אַ֭שּׁוּר נִלְוָ֣ה עִמָּ֑ם הָ֤יֽוּ זְר֖וֹעַ לִבְנֵי־ל֣וֹט סֶֽלָה׃ עֲשֵֽׂה־לָהֶ֥ם כְּמִדְיָ֑ן כְּֽסִיסְרָ֥א כְ֝יָבִ֗ין בְּנַ֣חַל קִישֽׁוֹן׃ נִשְׁמְד֥וּ בְֽעֵין־דֹּ֑אר הָ֥יוּ דֹּ֗֝מֶן לָאֲדָמָֽה׃ שִׁיתֵ֣מוֹ נְ֭דִיבֵימוֹ כְּעֹרֵ֣ב וְכִזְאֵ֑ב וּֽכְזֶ֥בַח וּ֝כְצַלְמֻנָּ֗ע כׇּל־נְסִיכֵֽימוֹ׃ אֲשֶׁ֣ר אָ֭מְרוּ נִ֣ירְשָׁה לָּ֑נוּ אֵ֗֝ת נְא֣וֹת אֱלֹהִֽים׃ אֱֽלֹהַ֗י שִׁיתֵ֥מוֹ כַגַּלְגַּ֑ל כְּ֝קַ֗שׁ לִפְנֵי־רֽוּחַ׃ כְּאֵ֥שׁ תִּבְעַר־יָ֑עַר וּ֝כְלֶהָבָ֗ה תְּלַהֵ֥ט הָרִֽים׃ כֵּ֭ן תִּרְדְּפֵ֣ם בְּסַעֲרֶ֑ךָ וּבְסוּפָתְךָ֥ תְבַהֲלֵֽם׃ מַלֵּ֣א פְנֵיהֶ֣ם קָל֑וֹן וִיבַקְשׁ֖וּ שִׁמְךָ֣ יְהֹוָֽה׃ יֵבֹ֖שׁוּ וְיִבָּהֲל֥וּ עֲדֵי־עַ֗ד וְֽיַחְפְּר֥וּ וְיֹאבֵֽדוּ׃ וְֽיֵדְע֗וּ כִּֽי־אַתָּ֬ה שִׁמְךָ֣ יְהֹוָ֣ה לְבַדֶּ֑ךָ עֶ֝לְי֗וֹן עַל־כׇּל־הָאָֽרֶץ׃</small> ")));
  }
  if (context.isChanukah) {
    parts.push(sup(p("<small>בחנוכה אומרים</small> ") + p("<small>מִזְמ֡וֹר (תהילים ל׳:א׳-ב׳) שִׁיר־חֲנֻכַּ֖ת הַבַּ֣יִת לְדָוִֽד׃ אֲרוֹמִמְךָ֣ יְ֭הֹוָה כִּ֣י דִלִּיתָ֑נִי וְלֹֽא־שִׂמַּ֖חְתָּ אֹיְבַ֣י לִֽי׃ יְהֹוָ֥ה אֱלֹהָ֑י שִׁוַּ֥עְתִּי אֵ֝לֶ֗יךָ וַתִּרְפָּאֵֽנִי׃ יְֽהֹוָ֗ה הֶעֱלִ֣יתָ מִן־שְׁא֣וֹל נַפְשִׁ֑י חִ֝יִּיתַ֗נִי מיורדי [מִיׇּֽרְדִי]־בֽוֹר׃ זַמְּר֣וּ לַיהֹוָ֣ה חֲסִידָ֑יו וְ֝הוֹד֗וּ לְזֵ֣כֶר קׇדְשֽׁוֹ׃ כִּ֤י רֶ֨גַע ׀ בְּאַפּוֹ֮ חַיִּ֢ים בִּרְצ֫וֹנ֥וֹ בָּ֭עֶרֶב יָלִ֥ין בֶּ֗כִי וְלַבֹּ֥קֶר רִנָּֽה׃ וַ֭אֲנִי אָמַ֣רְתִּי בְשַׁלְוִ֑י בַּל־אֶמּ֥וֹט לְעוֹלָֽם׃ יְֽהֹוָ֗ה בִּרְצוֹנְךָ֮ הֶעֱמַ֢דְתָּה לְֽהַרְרִ֫י עֹ֥ז הִסְתַּ֥רְתָּ פָנֶ֗יךָ הָיִ֥יתִי נִבְהָֽל׃ אֵלֶ֣יךָ יְהֹוָ֣ה אֶקְרָ֑א וְאֶל־אֲ֝דֹנָ֗י אֶתְחַנָּֽן׃ מַה־בֶּ֥צַע בְּדָמִי֮ בְּרִדְתִּ֢י אֶ֫ל שָׁ֥חַת הֲיוֹדְךָ֥ עָפָ֑ר הֲיַגִּ֥יד אֲמִתֶּֽךָ׃ שְׁמַע־יְהֹוָ֥ה וְחׇנֵּ֑נִי יְ֝הֹוָ֗ה הֱֽיֵה־עֹזֵ֥ר לִֽי׃ הָפַ֣כְתָּ מִסְפְּדִי֮ לְמָח֢וֹל לִ֥י פִּתַּ֥חְתָּ שַׂקִּ֑י וַֽתְּאַזְּרֵ֥נִי שִׂמְחָֽה׃ לְמַ֤עַן ׀ יְזַמֶּרְךָ֣ כָ֭בוֹד וְלֹ֣א יִדֹּ֑ם יְהֹוָ֥ה אֱ֝לֹהַ֗י לְעוֹלָ֥ם אוֹדֶֽךָּ׃</small> ")));
  }
  if (context.isPurim) {
    parts.push(sup(p("<small>בתענית אסתר ובפורים אומרים</small> ") + p("<small>לַ֭מְנַצֵּחַ (תהילים כ״ב:א׳-ב׳) עַל־אַיֶּ֥לֶת הַשַּׁ֗חַר מִזְמ֥וֹר לְדָוִֽד׃ אֵלִ֣י אֵ֭לִי לָמָ֣ה עֲזַבְתָּ֑נִי רָח֥וֹק מִֽ֝ישׁוּעָתִ֗י דִּבְרֵ֥י שַׁאֲגָתִֽי׃ אֱֽלֹהַ֗י אֶקְרָ֣א י֭וֹמָם וְלֹ֣א תַעֲנֶ֑ה וְ֝לַ֗יְלָה וְֽלֹא־דֻֽמִיָּ֥ה לִֽי׃ וְאַתָּ֥ה קָד֑וֹשׁ י֝וֹשֵׁ֗ב תְּהִלּ֥וֹת יִשְׂרָאֵֽל׃ בְּ֭ךָ בָּטְח֣וּ אֲבֹתֵ֑ינוּ בָּ֝טְח֗וּ וַֽתְּפַלְּטֵֽמוֹ׃ אֵלֶ֣יךָ זָעֲק֣וּ וְנִמְלָ֑טוּ בְּךָ֖ בָטְח֣וּ וְלֹא־בֽוֹשׁוּ׃ וְאָנֹכִ֣י תוֹלַ֣עַת וְלֹא־אִ֑ישׁ חֶרְפַּ֥ת אָ֝דָ֗ם וּבְז֥וּי עָֽם׃ כׇּל־רֹ֭אַי יַלְעִ֣גוּ לִ֑י יַפְטִ֥ירוּ בְ֝שָׂפָ֗ה יָנִ֥יעוּ רֹֽאשׁ׃ גֹּ֣ל אֶל־יְהֹוָ֣ה יְפַלְּטֵ֑הוּ יַ֝צִּילֵ֗הוּ כִּ֘י חָ֥פֵֽץ בּֽוֹ׃ כִּֽי־אַתָּ֣ה גֹחִ֣י מִבָּ֑טֶן מַ֝בְטִיחִ֗י עַל־שְׁדֵ֥י אִמִּֽי׃ עָ֭לֶיךָ הׇשְׁלַ֣כְתִּי מֵרָ֑חֶם מִבֶּ֥טֶן אִ֝מִּ֗י אֵ֣לִי אָֽתָּה׃ אַל־תִּרְחַ֣ק מִ֭מֶּנִּי כִּי־צָרָ֣ה קְרוֹבָ֑ה כִּי־אֵ֥ין עוֹזֵֽר׃ סְ֭בָבוּנִי פָּרִ֣ים רַבִּ֑ים אַבִּירֵ֖י בָשָׁ֣ן כִּתְּרֽוּנִי׃ פָּצ֣וּ עָלַ֣י פִּיהֶ֑ם אַ֝רְיֵ֗ה טֹרֵ֥ף וְשֹׁאֵֽג׃ כַּמַּ֥יִם נִשְׁפַּכְתִּי֮ וְהִתְפָּֽרְד֗וּ כׇּֽל־עַצְמ֫וֹתָ֥י הָיָ֣ה לִ֭בִּי כַּדּוֹנָ֑ג נָ֝מֵ֗ס בְּת֣וֹךְ מֵעָֽי׃ יָ֘בֵ֤שׁ כַּחֶ֨רֶשׂ ׀ כֹּחִ֗י וּ֭לְשׁוֹנִי מֻדְבָּ֣ק מַלְקוֹחָ֑י וְֽלַעֲפַר־מָ֥וֶת תִּשְׁפְּתֵֽנִי׃ כִּ֥י סְבָב֗וּנִי כְּלָ֫בִ֥ים עֲדַ֣ת מְ֭רֵעִים הִקִּיפ֑וּנִי כָּ֝אֲרִ֗י יָדַ֥י וְרַגְלָֽי׃ אֲסַפֵּ֥ר כׇּל־עַצְמוֹתָ֑י הֵ֥מָּה יַ֝בִּ֗יטוּ יִרְאוּ־בִֽי׃ יְחַלְּק֣וּ בְגָדַ֣י לָהֶ֑ם וְעַל־לְ֝בוּשִׁ֗י יַפִּ֥ילוּ גוֹרָֽל׃ וְאַתָּ֣ה יְ֭הֹוָה אַל־תִּרְחָ֑ק אֱ֝יָלוּתִ֗י לְעֶזְרָ֥תִי חֽוּשָׁה׃ הַצִּ֣ילָה מֵחֶ֣רֶב נַפְשִׁ֑י מִיַּד־כֶּ֝֗לֶב יְחִידָתִֽי׃ ה֭וֹשִׁיעֵנִי מִפִּ֣י אַרְיֵ֑ה וּמִקַּרְנֵ֖י רֵמִ֣ים עֲנִיתָֽנִי׃ אֲסַפְּרָ֣ה שִׁמְךָ֣ לְאֶחָ֑י בְּת֖וֹךְ קָהָ֣ל אֲהַלְלֶֽךָּ׃ יִרְאֵ֤י יְהֹוָ֨ה ׀ הַֽלְל֗וּהוּ כׇּל־זֶ֣רַע יַעֲקֹ֣ב כַּבְּד֑וּהוּ וְג֥וּרוּ מִ֝מֶּ֗נּוּ כׇּל־זֶ֥רַע יִשְׂרָאֵֽל׃ כִּ֤י לֹֽא־בָזָ֨ה וְלֹ֪א שִׁקַּ֡ץ עֱנ֬וּת עָנִ֗י וְלֹא־הִסְתִּ֣יר פָּנָ֣יו מִמֶּ֑נּוּ וּֽבְשַׁוְּע֖וֹ אֵלָ֣יו שָׁמֵֽעַ׃ מֵ֥אִתְּךָ֗ תְּֽהִלָּ֫תִ֥י בְּקָהָ֥ל רָ֑ב נְדָרַ֥י אֲ֝שַׁלֵּ֗ם נֶ֣גֶד יְרֵאָֽיו׃ יֹאכְל֬וּ עֲנָוִ֨ים ׀ וְיִשְׂבָּ֗עוּ יְהַֽלְל֣וּ יְ֭הֹוָה דֹּ֣רְשָׁ֑יו יְחִ֖י לְבַבְכֶ֣ם לָעַֽד׃ יִזְכְּר֤וּ ׀ וְיָשֻׁ֣בוּ אֶל־יְ֭הֹוָה כׇּל־אַפְסֵי־אָ֑רֶץ וְיִֽשְׁתַּחֲו֥וּ לְ֝פָנֶ֗יךָ כׇּֽל־מִשְׁפְּח֥וֹת גּוֹיִֽם׃ כִּ֣י לַ֭יהֹוָה הַמְּלוּכָ֑ה וּ֝מֹשֵׁ֗ל בַּגּוֹיִֽם׃ אָכְל֬וּ וַיִּֽשְׁתַּחֲו֨וּ ׀ כׇּֽל־דִּשְׁנֵי־אֶ֗רֶץ לְפָנָ֣יו יִ֭כְרְעוּ כׇּל־יוֹרְדֵ֣י עָפָ֑ר וְ֝נַפְשׁ֗וֹ לֹ֣א חִיָּֽה׃ זֶ֥רַע יַֽעַבְדֶ֑נּוּ יְסֻפַּ֖ר לַֽאדֹנָ֣י לַדּֽוֹר׃ יָ֭בֹאוּ וְיַגִּ֣ידוּ צִדְקָת֑וֹ לְעַ֥ם נ֝וֹלָ֗ד כִּ֣י עָשָֽׂה׃</small> ")));
  }
  parts.push(p("<small>ואומרים קדיש \"יהא שלמא\"</small> "));
  parts.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>יְהֵא</b> שְׁלָמָא רַבָּא מִן שְׁמַיָּא. חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה. וְשֵׁיזָבָא וּרְפוּאָה וּגְאוּלָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה לָנוּ וּלְכָל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small><br><b>עוֹשֶׂה</b> שָׁלוֹם בִּמְרוֹמָיו. הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>   "));
  parts.push(hr);

  // ─────────────────────────── קווה / עין כאלוהינו ───────────────────────────
  parts.push(p("<big><b>קוה</b></big>"));
  parts.push(p("<b>קַוֵּ֗ה</b> אֶל־יְהֹ֫וָ֥ה חֲ֭זַק וְיַאֲמֵ֣ץ לִבֶּ֑ךָ וְ֝קַוֵּ֗ה אֶל־יְהֹוָֽה: אֵין־קָד֥וֹשׁ כַּיהֹוָ֖ה כִּ֣י אֵ֣ין בִּלְתֶּ֑ךָ וְאֵ֥ין צ֖וּר כֵּאלֹהֵֽינוּ׃ כִּ֤י מִ֣י אֱ֭לוֹהַּ מִבַּלְעֲדֵ֣י יְהֹוָ֑ה וּמִ֥י צ֝֗וּר זוּלָתִ֥י אֱלֹהֵֽינוּ׃"));
  parts.push(p("<b>אֵין</b> כֵּאלֹהֵֽינוּ, אֵין כַּאדוֹנֵֽנוּ, אֵין כְּמַלְכֵּֽנוּ, אֵין כְּמוֹשִׁיעֵֽנוּ: מִי כֵּאלֹהֵֽינוּ, מִי כַּאדוֹנֵֽנוּ, מִי כְּמַלְכֵּֽנוּ, מִי כְּמוֹשִׁיעֵֽנוּ: נוֹדֶה לֵאלֹהֵֽינוּ, נוֹדֶה לַאדוֹנֵֽנוּ, נוֹדֶה לְמַלְכֵּֽנוּ, נוֹדֶה לְמוֹשִׁיעֵֽנוּ: בָּרוּךְ אֱלֹהֵֽינוּ, בָּרוּךְ אֲדוֹנֵֽנוּ, בָּרוּךְ מַלְכֵּֽנוּ, בָּרוּךְ מוֹשִׁיעֵֽנוּ: אַתָּה הוּא אֱלֹהֵֽינוּ, אַתָּה הוּא אֲדוֹנֵֽנוּ, אַתָּה הוּא מַלְכֵּֽנוּ, אַתָּה הוּא מוֹשִׁיעֵֽנוּ: אַתָּה תוֹשִׁיעֵֽנוּ, אַתָּ֣ה תָ֭קוּם תְּרַחֵ֣ם צִיּ֑וֹן כִּי־עֵ֥ת לְ֝חֶֽנְנָ֗הּ כִּי־בָ֥א מוֹעֵֽד: "));
  parts.push(p("<big><b>פטום הקטורת</b></big>"));
  parts.push(p("<b>אַתָּה</b> הוּא יְהֹוָה אֱלֹהֵֽינוּ, שֶׁהִקְטִֽירוּ אֲבוֹתֵֽינוּ לְפָנֶֽיךָ אֶת קְטֹֽרֶת הַסַּמִּים, בִּזְמַן שֶׁבֵּית הַמִּקְדָשׁ קַיָּם, כַּאֲשֶׁר צִוִּֽיתָ אוֹתָם עַל־יַד מֹשֶׁה נְבִיאָךְ, כַּכָּתוּב בְּתֽוֹרָתָךְ:"));
  parts.push(p("<b>וַיֹּ֩אמֶר֩</b> יְהֹוָ֨ה אֶל־מֹשֶׁ֜ה קַח־לְךָ֣ סַמִּ֗ים נָטָ֤ף ׀ וּשְׁחֵ֙לֶת֙ וְחֶלְבְּנָ֔ה סַמִּ֖ים וּלְבֹנָ֣ה זַכָּ֑ה בַּ֥ד בְּבַ֖ד יִהְיֶֽה׃ וְעָשִׂ֤יתָ אֹתָהּ֙ קְטֹ֔רֶת רֹ֖קַח מַעֲשֵׂ֣ה רוֹקֵ֑חַ מְמֻלָּ֖ח טָה֥וֹר קֹֽדֶשׁ׃ וְשָֽׁחַקְתָּ֣ מִמֶּ֘נָּה֮ הָדֵק֒ וְנָתַתָּ֨ה מִמֶּ֜נָּה לִפְנֵ֤י הָעֵדֻת֙ בְּאֹ֣הֶל מוֹעֵ֔ד אֲשֶׁ֛ר אִוָּעֵ֥ד לְךָ֖ שָׁ֑מָּה קֹ֥דֶשׁ קׇֽדָשִׁ֖ים תִּהְיֶ֥ה לָכֶֽם׃ וְנֶאֱמַר: וְהִקְטִ֥יר עָלָ֛יו אַהֲרֹ֖ן קְטֹ֣רֶת סַמִּ֑ים בַּבֹּ֣קֶר בַּבֹּ֗קֶר בְּהֵיטִיב֛וֹ אֶת־הַנֵּרֹ֖ת יַקְטִירֶֽנָּה: וּבְהַעֲלֹ֨ת אַהֲרֹ֧ן אֶת־הַנֵּרֹ֛ת בֵּ֥ין הָעַרְבַּ֖יִם יַקְטִירֶ֑נָּה קְטֹ֧רֶת תָּמִ֛יד לִפְנֵ֥י יְהֹוָ֖ה לְדֹרֹתֵיכֶֽם: "));
  parts.push(p("<b>תָּנוּ</b> רַבָּנָן: פִּטּוּם הַקְּטֹֽרֶת כֵּיצַד? שְׁלֹשׁ מֵאוֹת וְשִׁשִּׁים וּשְׁמוֹנָה מָנִים הָיוּ בָהּ. שְׁלֹשׁ מֵאוֹת וְשִׁשִּׁים וַֽחֲמִשָּׁה כְּמִנְיַן יְמוֹת הַחַמָּה, מָנֶה בְּכָל־יוֹם, מַֽחֲצִיתוֹ בַּבֹּֽקֶר וּמַֽחֲצִיתוֹ בָּעֶרֶב. וּשְׁלֹשָׁה מָנִים יְתֵרִים, שֶׁמֵּהֶם מַכְנִיס כֹּהֵן גָּדוֹל, וְנוֹטֵל מֵהֶם מְלֹא חָפְנָיו בְּיוֹם הַכִּפּוּרִים, וּמַֽחֲזִירָן לְמַכְתֶּֽשֶׁת בְּעֶֽרֶב יוֹם הַכִּפּוּרִים, כְּדֵי לְקַיֵּם מִצְוַת דַקָּה מִן הַדַּקָּה. וְאַחַד־עָשָׂר סַמָּנִים הָיוּ בָהּ, וְאֵֽלּוּ הֵן: "));
  parts.push(p("<small>א</small> הַצֳּרִי <small>ב</small> וְהַצִּפֹּֽרֶן <small>ג</small> וְהַחֶלְבְּנָה <small>ד</small> וְהַלְּבוֹנָה, מִשְׁקַל שִׁבְעִים שִׁבְעִים מָנֶה. <small>ה</small> מוֹר, <small>ו</small> וּקְצִיעָה <small>ז</small> וְשִׁבֹּֽלֶת נֵרְדְּ <small>ח</small> וְכַרְכֹּם, מִשְׁקַל שִׁשָּׁה עָשָׂר שִׁשָּׁה עָשָׂר מָנֶה. <small>ט</small> קֹשְׁטְ שְׁנֵים עָשָׂר, <small>י</small> קִלּוּפָה שְׁלֹשָׁה, <small>יא</small> קִנָּמוֹן תִּשְׁעָה, בּוֹרִית־כַּרְשִׁינָה תִּשְׁעָה קַבִּין. יֵין קַפְרִיסִין סְאִין תְּלָת וְקַבִּין תְּלָתָא. וְאִם לֹא מָצָא יֵין קַפְרִיסִין, מֵבִיא חֲמַר חִיוָר עַתִּיק. מֶֽלַח סְדוֹמִית, רֽוֹבַע. מַעֲלֶה עָשָׁן, כָּל־שֶׁהוּא. רִבִּי נָתָן הַבַּבְלִי אוֹמֵר: אַף כִּפַּת הַיַּרְדֵּן כָּל־שֶׁהִיא, אִם נָתַן בָּהּ דְּבַשׁ פְּסָלָהּ, וְאִם חִסֵּר אַחַת מִכָּל־סַמְמָנֶֽיהָ, חַיָּיב מִיתָה:"));
  parts.push(p("<b>רַבָּן</b> שִׁמְעוֹן בֶּן־גַּמְלִיאֵל אוֹמֵר: הַצֳּרִי אֵינוֹ אֶלָּא שְׁרָף, הַנּוֹטֵף מֵֽעֲצֵי הַקְּטָף. בֹּרִית כַּרְשִׁינָה, לְמָה הִיא בָֽאָה? כְּדֵי לְשַׁפּוֹת בָּהּ אֶת־הַצִּפֹּֽרֶן, כְּדֵי שֶׁתְּהֵא נָאָה. יֵין קַפְרִיסִין, לְמָה הוּא בָא? כְּדֵי לִשְׁרוֹת בּוֹ אֶת־הַצִּפֹּֽרֶן כְּדֵי שֶׁתְּהֵא עַזָּה. וַהֲלֹא מֵי רַגְלַֽיִם יָפִין לָהּ? אֶלָּא שֶׁאֵין מַכְנִיסִין מֵי רַגְלַֽיִם בַּמִּקְדָּשׁ, מִפְּנֵי הַכָּבוֹד:"));
  parts.push(p("<b>תַּנְיָא</b> רִבִּי נָתָן אוֹמֵר: כְּשֶׁהוּא שׁוֹחֵק, אוֹמֵר: הָדֵק הֵיטֵב, הֵיטֵב הָדֵק. מִפְּנֵי שֶׁהַקּוֹל יָפֶה לַבְּשָׂמִים. פִּטְּמָהּ לַֽחֲצָאִין, כְּשֵׁרָה. לְשָׁלִישׁ וּלְרָבִֽיעַ, לֹא שָׁמַֽעְנוּ. אָמַר רִבִּי יְהוּדָה: זֶה הַכְּלָל, אִם כְּמִדָּתָהּ, כְּשֵׁרָה לַֽחֲצָאִין. וְאִם חִסֵּר אַחַת מִכָּל־סַמְמָנֶֽיהָ, חַיָּיב מִיתָה:"));
  parts.push(p("<b>תָּנֵי</b> בַר־קַפָּרָא: אַחַת לְשִׁשִּׁים אוֹ לְשִׁבְעִים שָׁנָה, הָֽיְתָה בָֽאָה שֶׁל שִׁירַֽיִם לַֽחֲצָאִין. וְעוֹד תָּנֵי בַר־קַפָּרָא: אִלּוּ הָיָה נוֹתֵן בָּהּ קָרְטוֹב שֶׁל דְּבַשׁ, אֵין אָדָם יָכוֹל לַֽעֲמֹד מִפְּנֵי רֵיחָהּ. וְלָֽמָּה אֵין מְעָֽרְבִין בָּהּ דְּבַשׁ? מִפְּנֵי שֶׁהַתּוֹרָה אָֽמְרָה: כִּ֤י כָל־שְׂאֹר֙ וְכָל־דְּבַ֔שׁ לֹֽא־תַקְטִ֧ירוּ מִמֶּ֛נּוּ אִשֶּׁ֖ה לַֽיהֹוָֽה: יְהֹוָ֣ה צְבָא֣וֹת עִמָּ֑נוּ מִשְׂגָּֽב־לָ֨נוּ אֱלֹהֵ֖י יַֽעֲקֹ֣ב סֶֽלָה׃ יְהֹוָ֥ה צְבָא֑וֹת אַֽשְׁרֵ֥י אָ֝דָ֗ם בֹּטֵ֥חַ בָּֽךְ׃ יְהֹוָ֥ה הוֹשִׁ֑יעָה הַ֝מֶּ֗לֶךְ יַעֲנֵ֥נוּ בְיוֹם־קׇרְאֵֽנוּ: וְעָֽרְבָה֙ לַֽיהֹוָ֔ה מִנְחַ֥ת יְהוּדָ֖ה וִירֽוּשָׁלָ֑‍ִם כִּימֵ֣י עוֹלָ֔ם וּכְשָׁנִ֖ים קַדְמֹנִיֹּֽת: "));
  parts.push(p("<b>תָּנָא</b> דְבֵי אֵלִיָּהוּ, כָּל־הַשּׁוֹנֶה הֲלָכוֹת בְּכָל־יוֹם, מֻבְטָח לוֹ שֶׁהוּא בֶן־הָעוֹלָם הַבָּא, שֶׁנֶּאֱמַר הֲלִיכ֥וֹת עוֹלָ֖ם לֽוֹ׃ אַל־תִּקְרֵי הֲלִיכוֹת, אֶלָּא הֲלָכוֹת. אָמַר רִבִּי אֶלְעָזָר אָמַר רִבִּי חֲנִינָא תַּלְמִידֵי חֲכָמִים מַרְבִּים שָׁלוֹם בָּעוֹלָם, שֶׁנֶּאֱמַר וְכׇל־בָּנַ֖יִךְ לִמּוּדֵ֣י יְהֹוָ֑ה וְרַ֖ב שְׁל֥וֹם בָּנָֽיִךְ׃ אַל־תִּקְרֵי בָנָֽיִךְ אֶלָּא בוֹנָֽיִךְ: יְהִי־שָׁל֥וֹם בְּחֵילֵ֑ךְ שַׁ֝לְוָ֗ה בְּאַרְמְנוֹתָֽיִךְ׃ לְ֭מַעַן אַחַ֣י וְרֵעָ֑י אֲדַבְּרָה־נָּ֖א שָׁל֣וֹם בָּֽךְ׃ לְ֭מַעַן בֵּית־יְהֹוָ֣ה אֱלֹהֵ֑ינוּ אֲבַקְשָׁ֖ה ט֣וֹב לָֽךְ׃ וּרְאֵֽה־בָנִ֥ים לְבָנֶ֑יךָ שָׁ֝ל֗וֹם עַל־יִשְׂרָאֵֽל׃ שָׁל֣וֹם רָ֭ב לְאֹהֲבֵ֣י תוֹרָתֶ֑ךָ וְאֵֽין־לָ֥מוֹ מִכְשֽׁוֹל׃ יְֽהֹוָ֗ה עֹ֭ז לְעַמּ֣וֹ יִתֵּ֑ן יְהֹוָ֓ה ׀ יְבָרֵ֖ךְ אֶת־עַמּ֣וֹ בַשָּׁלֽוֹם׃"));
  parts.push(p("<small>ואומרים קדיש \"על ישראל\"</small>"));
  parts.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>עַל</b> יִשְׂרָאֵל וְעַל רַבָּנָן. וְעַל תַּלְמִידֵיהוֹן וְעַל כָּל תַּלְמִידֵי תַלְמִידֵיהוֹן. דְּעָסְקִין בְּאוֹרַיְתָא קַדִּשְׁתָּא. דִּי בְאַתְרָא הָדֵין וְדִי בְכָל אֲתַר וַאֲתַר. יְהֵא לָנָא וּלְהוֹן וּלְכוֹן חִנָּא וְחִסְדָּא וְרַחֲמֵי. מִן קֳדָם מָארֵי שְׁמַיָּא וְאַרְעָא וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small><b>יְהֵא</b> שְׁלָמָא רַבָּא מִן שְׁמַיָּא. חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה. וְשֵׁיזָבָא וּרְפוּאָה וּגְאוּלָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה לָנוּ וּלְכָל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small><br><br><b>עוֹשֶׂה</b> שָׁלוֹם בִּמְרוֹמָיו. הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל־עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
  parts.push(p("<small>ואומר החזן:</small> (רַבָּנָן) בָּרְכוּ אֶת יְהֹוָה הַמְּבֹרָךְ:"));
  parts.push(p("<small>ועונים הקהל:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֵד:"));
  parts.push(p("<small>ואומר החזן:</small> בָּרוּךְ יְהֹוָה הַמְּבֹרָךְ לְעוֹלָם וָעֵד:"));
  parts.push(hr);

  // ─────────────────────────── עלינו לשבח ───────────────────────────
  parts.push(p("<big><b>עלינו לשבח</b></big>"));
  parts.push(p("<b>עָלֵֽינוּ</b> לְשַׁבֵּֽחַ לַֽאֲדוֹן הַכֹּל, לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית, שֶׁלֹּא עָשָֽׂנוּ כְּגוֹיֵי הָֽאֲרָצוֹת, וְלֹא שָׂמָֽנוּ כְּמִשְׁפְּחוֹת הָֽאֲדָמָה, שֶׁלֹּא שָׂם חֶלְקֵֽנוּ כָּהֶם וְגוֹרָלֵֽנוּ כְּכָל־הֲמוֹנָם, שֶׁהֵם מִשְׁתַּֽחֲוִים לָהֶֽבֶל וָרִיק, וּמִתְפַּלְּלִים אֶל־אֵל לֹֽא יוֹשִׁיעַ. וַֽאֲנַֽחְנוּ מִשְׁתַּחֲוִים לִפְנֵי מֶֽלֶךְ מַלְכֵי הַֽמְּלָכִים הַקָּדוֹשׁ בָּרוּךְ הוּא, שֶׁהוּא נוֹטֶה שָׁמַֽיִם וְיוֹסֵד אָֽרֶץ, וּמוֹשַׁב יְקָרוֹ בַּשָּׁמַֽיִם מִמַּֽעַל, וּשְׁכִינַת עֻזּוֹ בְּגָבְהֵי מְרוֹמִים. הוּא אֱלֹהֵֽינוּ, וְאֵין עוֹד אַחֵר, אֱמֶת מַלְכֵּֽנוּ וְאֶֽפֶס זוּלָתוֹ. כַּכָּתוּב בַּתּוֹרָה. וְיָדַעְתָּ֣ הַיּ֗וֹם וַהֲשֵׁבֹתָ֮ אֶל־לְבָבֶךָ֒ כִּ֤י יְהֹוָה֙ ה֣וּא הָֽאֱלֹהִ֔ים בַּשָּׁמַ֣יִם מִמַּ֔עַל וְעַל־הָאָ֖רֶץ מִתָּ֑חַת אֵ֖ין עֽוֹד: "));
  parts.push(p("<b>עַל</b> כֵּן נְקַוֶּה לָךְ, יְהֹוָה אֱלֹהֵֽינוּ, לִרְאוֹת מְהֵרָה בְּתִפְאֶֽרֶת עֻזָּךְ, לְהַֽעֲבִיר גִּלּוּלִים מִן הָאָֽרֶץ, וְהָֽאֱלִילִים כָּרוֹת יִכָּֽרֵתוּן, לְתַקֵּן עוֹלָם בְּמַלְכוּת שַׁדַּי, וְכָל־בְּנֵי בָשָׂר יִקְרְאוּ בִשְׁמֶֽךָ, לְהַפְנוֹת אֵלֶֽיךָ כָּל־רִשְׁעֵי אָֽרֶץ. יַכִּֽירוּ וְיֵֽדְעוּ כָּל־יֽוֹשְׁבֵי תֵבֵֽל, כִּי לְךָ תִכְרַע כָּל־בֶּֽרֶךְ, תִּשָּׁבַע כָּל־לָשׁוֹן. לְפָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ יִכְרְעוּ וְיִפֹּֽלוּ, וְלִכְבוֹד שִׁמְךָ יְקָר יִתֵּֽנוּ, וִיקַבְּלוּ כֻלָּם אֶת־עֹל מַלְכוּתֶֽךָ, וְתִמְלוֹךְ עֲלֵיהֶם מְהֵרָה לְעוֹלָם וָעֶד. כִּי הַמַּלְכוּת שֶׁלְּךָ הִיא, וּלְעֽוֹלְמֵי עַד תִּמְלוֹךְ בְּכָבוֹד. כַּכָּתוּב בְּתוֹרָתָךְ: יְהֹוָ֥ה ׀ יִמְלֹ֖ךְ לְעֹלָ֥ם וָעֶֽד׃ וְנֶאֱמַר. וְהָיָ֧ה יְהֹוָ֛ה לְמֶ֖לֶךְ עַל־כָּל־הָאָ֑רֶץ בַּיּ֣וֹם הַה֗וּא יִהְיֶ֧ה יְהֹוָ֛ה אֶחָ֖ד וּשְׁמ֥וֹ אֶחָֽד׃ "));
  parts.push(p("<small>וּבְתוֹרָתְךָ יְהֹוָה אֱלֹהֵינוּ כָּתוּב לֵּאמֹר. שְׁמַ֖ע יִשְׂרָאֵ֑ל יְהֹוָ֥ה אֱלֹהֵ֖ינוּ יְהֹוָ֥ה ׀ אֶחָֽד׃</small>"));
  parts.push(p("וַיֹּאמֶר֩ אִם־שָׁמ֨וֹעַ תִּשְׁמַ֜ע לְק֣וֹל ׀ יְהֹוָ֣ה אֱלֹהֶ֗יךָ וְהַיָּשָׁ֤ר בְּעֵינָיו֙ תַּעֲשֶׂ֔ה וְהַֽאֲזַנְתָּ֙ לְמִצְוֺתָ֔יו וְשָׁמַרְתָּ֖ כָּל־חֻקָּ֑יו כָּֽל־הַמַּֽחֲלָ֞ה אֲשֶׁר־שַׂ֤מְתִּי בְמִצְרַ֙יִם֙ לֹא־אָשִׂ֣ים עָלֶ֔יךָ כִּ֛י אֲנִ֥י יְהֹוָ֖ה רֹפְאֶֽךָ׃ עֵץ־חַיִּ֣ים הִ֭יא לַמַּחֲזִיקִ֣ים בָּ֑הּ וְֽתֹמְכֶ֥יהָ מְאֻשָּֽׁר׃ דְּרָכֶ֥יהָ דַרְכֵי־נֹ֑עַם וְֽכָל־נְתִ֖יבוֹתֶ֣יהָ שָׁלֽוֹם׃ מִגְדַּל־עֹ֭ז שֵׁ֣ם יְהֹוָ֑ה בּֽוֹ־יָר֖וּץ צַדִּ֣יק וְנִשְׂגָּֽב׃ כִּי־בִ֭י יִרְבּ֣וּ יָמֶ֑יךָ וְיוֹסִ֥יפוּ לְּ֝ךָ֗ שְׁנ֣וֹת חַיִּֽים׃"));
  parts.push(p("לְדָוִ֨ד ׀ <small>(תהילים כ״ז:א׳-ב׳)</small> יְהֹוָ֤ה ׀ אוֹרִ֣י וְ֭יִשְׁעִי מִמִּ֣י אִירָ֑א יְהֹוָ֥ה מָֽעוֹז־חַ֝יַּ֗י מִמִּ֥י אֶפְחָֽד׃ בִּקְרֹ֤ב עָלַ֨י ׀ מְרֵעִים֮ לֶאֱכֹ֪ל אֶת־בְּשָׂ֫רִ֥י צָרַ֣י וְאֹיְבַ֣י לִ֑י הֵ֖מָּה כָשְׁל֣וּ וְנָפָֽלוּ׃ אִם־תַּחֲנֶ֬ה עָלַ֨י ׀ מַחֲנֶה֮ לֹֽא־יִירָ֪א לִ֫בִּ֥י אִם־תָּק֣וּם עָ֭לַי מִלְחָמָ֑ה בְּ֝זֹ֗את אֲנִ֣י בוֹטֵֽחַ׃ אַחַ֤ת ׀ שָׁאַ֣לְתִּי מֵֽאֵת־יְהֹוָה֮ אוֹתָ֪הּ אֲבַ֫קֵּ֥שׁ שִׁבְתִּ֣י בְּבֵית־יְ֭הֹוָה כָּל־יְמֵ֣י חַיַּ֑י לַחֲז֥וֹת בְּנֹֽעַם־יְ֝הֹוָ֗ה וּלְבַקֵּ֥ר בְּהֵיכָלֽוֹ׃ כִּ֤י יִצְפְּנֵ֨נִי ׀ בְּסֻכֹּה֮ בְּי֪וֹם רָ֫עָ֥ה יַ֭סְתִּרֵנִי בְּסֵ֣תֶר אָהֳל֑וֹ בְּ֝צ֗וּר יְרוֹמְמֵֽנִי׃ וְעַתָּ֨ה יָר֪וּם רֹאשִׁ֡י עַ֤ל אֹֽיְבַ֬י סְֽבִיבוֹתַ֗י וְאֶזְבְּחָ֣ה בְ֭אָהֳלוֹ זִבְחֵ֣י תְרוּעָ֑ה אָשִׁ֥ירָה וַ֝אֲזַמְּרָ֗ה לַיהֹוָֽה׃ שְׁמַע־יְהֹוָ֖ה קוֹלִ֥י אֶקְרָ֗א וְחָנֵּ֥נִי וַעֲנֵֽנִי׃ לְךָ֤ ׀ אָמַ֣ר לִ֭בִּי בַּקְּשׁ֣וּ פָנָ֑י אֶת־פָּנֶ֖יךָ יְהֹוָ֣ה אֲבַקֵּֽשׁ׃ אַל־תַּסְתֵּ֬ר פָּנֶ֨יךָ ׀ מִמֶּנִּי֮ אַֽל־תַּט־בְּאַ֗ף עַ֫בְדֶּ֥ךָ עֶזְרָתִ֥י הָיִ֑יתָ אַֽל־תִּטְּשֵׁ֥נִי וְאַל־תַּֽ֝עַזְבֵ֗נִי אֱלֹהֵ֥י יִשְׁעִֽי׃ כִּי־אָבִ֣י וְאִמִּ֣י עֲזָב֑וּנִי וַֽיהֹוָ֣ה יַֽאַסְפֵֽנִי׃ ה֤וֹרֵ֥נִי יְהֹוָ֗ה דַּ֫רְכֶּ֥ךָ וּ֭נְחֵנִי בְּאֹ֣רַח מִישׁ֑וֹר לְ֝מַ֗עַן שׁוֹרְרָֽי׃ אַֽל־תִּ֭תְּנֵנִי בְּנֶ֣פֶשׁ צָרָ֑י כִּ֥י קָֽמוּ־בִ֥י עֵֽדֵי־שֶׁ֝֗קֶר וִיפֵ֥חַ חָמָֽס׃ לוּלֵ֗א הֶ֭אֱמַנְתִּי לִרְא֥וֹת בְּֽטוּב־יְהֹוָ֗ה בְּאֶ֣רֶץ חַיִּֽים׃ קַוֵּ֗ה אֶל־יְהֹ֫וָ֥ה חֲ֭זַק וְיַאֲמֵ֣ץ לִבֶּ֑ךָ וְ֝קַוֵּ֗ה אֶל־יְהֹוָֽה׃ "));
  parts.push(hr);

  // ─────────────────────────── שלשה עשר עיקרים ───────────────────────────
  parts.push(p("<big><b>תוספות לשחרית </b></big>"));
  parts.push(p("<big><b>שלשה עשר עיקרים </b></big>"));
  parts.push(p("הֲרֵי אֲנִי מַאֲמִין בֶּאֱמוּנָה שְׁלֵמָה בִּשְׁלֹשָׁה עָשָׂר עִקָּרִים שֶׁל הַתּוֹרָה הַקְּדוֹשָׁה: <small>א</small> שֶׁהַקָּדוֹשׁ בָּרוּךְ הוּא מָצוּי וּמַשְׁגִּיחַ, <small>ב</small> וְהוּא אֶחָד, <small>ג</small> וְאֵין לוֹ גּוּף וְאֵין לוֹ דְּמוּת הַגּוּף, <small>ד</small> וְשֶׁהוּא קַדְמוֹן לְכָל-קְדוּמִים, <small>ה</small> וְאֵין עֲבוֹדָה לְזוּלָתוֹ, <small>ו</small> וְיוֹדֵעַ מַחְשְׁבוֹת בְּנֵי אָדָם, <small>ז</small> וּנְבוּאַת מֹשֶׁה רַבֵּינוּ עָלָיו הַשָּׁלוֹם אֱמֶת, <small>ח</small> וְשֶׁהוּא אֲדוֹן לְכָל-הַנְּבִיאִים, <small>ט</small> וְשֶׁהַתּוֹרָה נְתוּנָה מִן הַשָּׁמַיִם, <small>י</small> וְשֶׁלֹּא תִשְׁתַּנֶּה בְּשׁוּם זְמָן חַס וְשָׁלוֹם, <small>יא</small> וְשֶׁהַקָּדוֹשׁ בָּרוּךְ הוּא מַעֲנִישׁ לָרְשָׁעִים וּמְשַׁלֵּם שָׂכָר טוֹב לַצַּדִּיקִים, <small>יב</small> וְשֶׁיָּבוֹא מֶלֶךְ הַמָּשִׁיחַ, <small>יג</small> וְשֶׁהַמֵּתִים עֲתִידִים לְהֵחָיוֹת, יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבֹתֵינוּ שֶׁתָּכוֹף יִצְרֵנוּ לַעֲבוֹדָתֶךָ כָּל-יְמֵי חַיֵּינוּ תָּמִיד, אָמֵן כֵּן יְהִי רָצוֹן: "));
  parts.push(hr);

  // ─────────────────────────── עשר זכירות ───────────────────────────
  parts.push(p("<big><b>עשר זכירות </b></big>"));
  parts.push(p("לְשֵׁם יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּהּ, הֲרֵי אֲנִי מְקַיֵּם מִצְוַת עֶשֶׂר זְכִירוֹת שֶׁחַיָּב כָּל־אָדָם לִזְכֹּר בְּכָל־יוֹם, וְאֵלּוּ הֵם: <small>א</small> יְצִיאַת מִצְרַיִם, <small>ב</small> וְהַשַּׁבָּת, <small>ג</small> וְהַמָּן, <small>ד</small> וּמַעֲשֵׂה עֲמָלֵק, <small>ה</small> וּמַעֲמַד הַר סִינַי, <small>ו</small> וּמַה־שֶּׁהִקְצִיפוּ אֲבוֹתֵינוּ לְהַקָּדוֹשׁ בָּרוּךְ הוּא בַּמִּדְבָּר וּבִפְרָט בָּעֵגֶל, <small>ז</small> וּמַה־שֶּׁיָּעֲצוּ בָלָק וּבִלְעָם לַעֲשׂוֹת לַאֲבוֹתֵינוּ לְמַ֕עַן דַּ֖עַת צִדְק֥וֹת יְהֹוָֽה, <small>ח</small> וּמַעֲשֵׂה מִרְיָם הַנְּבִיאָה, <small>ט</small> וּמִצְוַת וְזָֽכַרְתָּ֙ אֶת־יְהֹוָ֣ה אֱלֹהֶ֔יךָ כִּ֣י ה֗וּא הַנֹּתֵ֥ן לְךָ֛ כֹּ֖חַ לַעֲשׂ֣וֹת חָ֑יִל, <small>י</small> וּזְכִירַת יְרוּשָׁלַיִם תִּבָּנֶה וְתִכּוֹנֵן בִּמְהֵרָה בְיָמֵינוּ אָמֵן:"));
  parts.push(p("<small>יש אומרים נוסח ערוכה שכתב החיד\"א ז\"ל בספר כף אחת</small> "));
  parts.push(p("לְשֵׁם יִחוּד קֻדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּיהּ, בִּדְחִילוּ וּרְחִימוּ, וּרְחִימוּ וּדְחִילוּ, לְיַחֲדָא שֵׁם יוֹד קֵ\"י בְּוָא\"ו קֵ\"י בְּיִחוּדָא שְׁלִים, בְּשֵׁם כָּל יִשְׂרָאֵל, הֲרֵינִי בָא לְקַיֵּם מִצְוַת הַזְכִירוֹת בַּפֶּה. לְתַקֵּן שֹׁרֶשׁ מִצְוֹת אֵלּוּ בְּמָקוֹם עֶלְיוֹן, לַעֲשֹוֹת נַחַת רוּחַ לְיּוֹצְרֵנוּ. וִיהִ֤י ׀ נֹ֤עַם אֲדֹנָ֥י אֱלֹהֵ֗ינוּ עָ֫לֵ֥ינוּ וּמַעֲשֵׂ֣ה יָ֭דֵינוּ כּוֹנְנָ֥ה עָלֵ֑ינוּ וּֽמַעֲשֵׂ֥ה יָ֝דֵ֗ינוּ כּוֹנְנֵֽהוּ׃"));
  parts.push(p("(א) הֲרֵינִי זוֹכֵר יְצִיאַת מִצְרַיִם, כְּמוֹ שֶׁנֶּאֱמַר <small>(שמות יג ג)</small> זָכ֞וֹר אֶת־הַיּ֤וֹם הַזֶּה֙ אֲשֶׁ֨ר יְצָאתֶ֤ם מִמִּצְרַ֙יִם֙ מִבֵּ֣ית עֲבָדִ֔ים כִּ֚י בְּחֹ֣זֶק יָ֔ד הוֹצִ֧יא יְהֹוָ֛ה אֶתְכֶ֖ם מִזֶּ֑ה: "));
  parts.push(p("<small>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ לִכְבוֹד שְׁכִינָתְךָ. וְהָאֵ֣ר פָּנֶ֔יךָ עַל־מִקְדָּשְׁךָ֖ הַשָּׁמֵ֑ם לְמַ֖עַן אֲדֹנָֽי׃ וּכְשֵׁם שֶׁבְּחֲסָדֶּךָ הַמְרוּבִּים וְהַגְּדוֹלִים הִגְּדַלְתָּ אֶת חַסְדְּךָ עִמָּנוּ וּגְאַלְתָּנוּ וְגָאַלְתָּ אֶת אֲבוֹתֵינוּ מִמִּצְרָיִם, וְהֶעֱלִיתָ בְכֹחֲךָ כָּל־נִיצוֹצוֹת הַקְּדוּשָׁה אֲשֶׁר נָפוֹצוּ שָׁמָּה בְּמִצְרָיִם, וְלֹא נִשְׁאַר בָּהּ שׁוּם נִיצוֹץ קְדוּשָׁה. כֵּן בַּחֲסָדֶּךָ הַגְּדוֹלִים תּוֹצִיאֵנוּ מִגָּלוּת זֶה. תְּקַע בְּשׁוֹפָר גָּדוֹל לְחֵירוּתֵינוּ, וְקַבֵּץ נְפוּצוֹתֵינוּ מֵאַרְבַּע כַּנְפוֹת הָאָרֶץ, וְתוֹצִיא לָאוֹר כָּל־נִיצוֹצוֹת הַקְּדוּשָׁה אֲשֶׁר נִטְמְעוּ בֵּין הַקְלִיפּוֹת, חַיִל בָּלַע וַיְקִיאֶנּוּ מִ֝בִּטְנ֗וֹ יֹרִשֶׁ֥נּוּ אֵֽל׃ גַּלֵּה כְּבוֹד מַלְכוּתְךָ עָלֵינוּ מְהֵרָה, וּבָא לְצִיּוֹן גּוֹאֵל, וְתִבְנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵינוּ. עֲשֵׂה לְמַעַן שְׁמָךְ, עֲשֵׂה לְמַעַן יְמִינָךְ, עֲשֵׂה לְמַעַן קְדוּשָׁתָךְ, עֲשֵׂה לְמַעַן תּוֹרָתָךְ, עֲשֵׂה בִּזְכוּת אַבְרָהָם יִצְחָק וְיַעֲקֹב משֶׁה וְאַהֲרֹן יוֹסֵף וְדָּוִד. וְכִימֵי צֵאתֵנוּ מִמִּצְרַיִם הַרְאֵנוּ נִפְלָאוֹת. וְהָיָ֧ה יְהֹוָ֛ה לְמֶ֖לֶךְ עַל־כׇּל־הָאָ֑רֶץ בַּיּ֣וֹם הַה֗וּא יִהְיֶ֧ה יְהֹוָ֛ה אֶחָ֖ד וּשְׁמ֥וֹ אֶחָֽד׃ </small>"));
  parts.push(p("(ב) הֲרֵינִי זוֹכֵר אֶת הַשַּׁבָּת, כְּמוֹ שֶׁנֶּאֱמַר <small>(שמות כ ז)</small> זָכ֛וֹר אֶת־י֥וֹם הַשַּׁבָּ֖ת לְקַדְּשֽׁוֹ׃ "));
  parts.push(p("<small>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ וְעַל כָּל־יִשְׂרָאֵל. וּתְזַכֵּנוּ לִשְׁמוֹר יוֹם הַשַּׁבָּת קֹדֶשׁ כֹּל־יְמֵי חַיֵּינוּ, בְּמַחֲשָׁבָה וּבְדִבּוּר וּבְמַעֲשֶׂה. וּתְזַכֵּנוּ לְהִתְעַנֵּג בּוֹ כְּמוֹ שֶׁנֶּאֱמַר וְקָרָ֨אתָ לַשַּׁבָּ֜ת עֹ֗נֶג לִקְד֤וֹשׁ יְהֹוָה֙ מְכֻבָּ֔ד. וְיִהְיוּ כָּל־מַעֲשֵׂינוּ לְשֵׁם שָׁמַיִם. וְתַצִּילֵנוּ מִלַּחֲטוֹא. וְלִשְׁמוֹר פִינוּ וּלְשׁוֹנֵנוּ שֶׁלֹּא נְדַבֵּר בַּשַׁבָּת דִיבּוּר שֶׁל חוֹל וְשׁוּם דִבּוּר אָסוּר. וְלֹא נֶחֱטָא בְּשׁוּם מַעֲשֵׂה אִיסוּר כְּלָל. וּתְזַכֵּנוּ לְיַחֵד זָכוֹר וְשָׁמוֹר שַׁבָּ\"ת לַיהֹוָה, וּלְחַבֵּר הַדּוֹדִים יַחְדָּו. וְתַמְשִׁיךְ שֶׁפַע קְדוּשַׁת הַשַּׁבָּת, שֶׁיִמְשֹׁךְ עָלֵינוּ בִּימֵי הַחוֹל שֶׁפַע קְדוּשָׁה וְטָהֳרָה לַעֲשֹוֹת רְצוֹנְךָ כִּרְצוֹנֶךָ, וְלַעֲסוֹק בַּתּוֹרָה לִשְׁמָהּ וּבְמִצְוֹת וּגְמִילוּת חֲסָדִים. וְתִגְאָלֵנוּ גְאוּלָה שְׁלֵימָה לְמַעַן שְׁמֶ\"ךָ. בִּמְהֵרָה בְיָמֵינוּ אָמֵן: </small>"));
  parts.push(p("(ג) וַהֲרֵינִי זוֹכֵר מַעֲמַד הַר סִינַי, כְּמוֹ שֶׁנֶּאֱמַר <small>(דברים ד ט)</small> רַ֡ק הִשָּׁ֣מֶר לְךָ֩ וּשְׁמֹ֨ר נַפְשְׁךָ֜ מְאֹ֗ד פֶּן־תִּשְׁכַּ֨ח אֶת־הַדְּבָרִ֜ים אֲשֶׁר־רָא֣וּ עֵינֶ֗יךָ וּפֶן־יָס֙וּרוּ֙ מִלְּבָ֣בְךָ֔ כֹּ֖ל יְמֵ֣י חַיֶּ֑יךָ וְהוֹדַעְתָּ֥ם לְבָנֶ֖יךָ וְלִבְנֵ֥י בָנֶֽיךָ׃ י֗וֹם אֲשֶׁ֨ר עָמַ֜דְתָּ לִפְנֵ֨י יְהֹוָ֣ה אֱלֹהֶ֘יךָ֮ בְּחֹרֵב֒ בֶּאֱמֹ֨ר יְהֹוָ֜ה אֵלַ֗י הַקְהֶל־לִי֙ אֶת־הָעָ֔ם וְאַשְׁמִעֵ֖ם אֶת־דְּבָרָ֑י אֲשֶׁ֨ר יִלְמְד֜וּן לְיִרְאָ֣ה אֹתִ֗י כׇּל־הַיָּמִים֙ אֲשֶׁ֨ר הֵ֤ם חַיִּים֙ עַל־הָ֣אֲדָמָ֔ה וְאֶת־בְּנֵיהֶ֖ם יְלַמֵּדֽוּן׃"));
  parts.push(p("<small>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ, וְתִטַּע אַהֲבָה וְאַחֲוָה שָׁלוֹם וְרֵיעוּת בֵּינֵינוּ וּבֵין כָּל־יִשְׂרָאֵל, וְנִהְיֶה לַאֲחָדִים, כְּשֵׁם שֶׁבְּהַר סִינַי הָיָה שָׁלוֹם בֵּינֵינוּ, כְּדִכְתִיב, וַיִּֽחַן־שָׁ֥ם יִשְׂרָאֵ֖ל נֶ֥גֶד הָהָֽר: כְּאִישׁ אֶחָד בְּאַחְדוּת גָמוּר, כֵּן בְּרַחֲמֶיךָ הָרַבִּים תְּזַכֵּנוּ לְהַעֲבִיר מִמֶּנּוּ שִׂנְאָה וְקִנְאָה וְתַחֲרוּת, וְנִהְיֶה אוֹהֲבִים זֶה לָזֶה, וְתָשִׂים שָׁלוֹם בֵּינֵינוּ. וּכְשֵׁם שֶׁבְּמַעֲמַד הַר סִינַי פָּסְקָה זוּהֲמָא מִמֶּנּוּ, וְזִכַּכְתָּ אוֹתָנוּ וְטִהַרְתָּנוּ מִכָּל־טוּמְאָה וְחֶלְאָה וְזוּהֲמָא, וְקִדַּשְׁתָּנוּ בִּקְדוּשָׁתֶךָ, כֵּן בְּרַחֲמֶיךָ הָרַבִּים תְּטַהֲרֵנוּ מִטוּמְאָתֵינוּ וּמִזוּהֲמָתֵינוּ, וּתְקַדְּשֵׁנוּ בְּמִצְוֹתֶיךָ, וּתְטַהֵר רַעְיוֹנֵינוּ וְלִבֵּנוּ לַעֲבוֹדָתֶךָ וּלְיִרְאָתֶךָ, וְתִטַּע תּוֹרָתְךָ בְּלִבֵּנוּ, וְתִהְיֶה יִרְאָתְךָ עַל פָּנֵינוּ לְבִלְתִּי נֶחֱטָא, וּתְעוֹרֵר לִבֵּנוּ לְאַהֲבַת תּוֹרָתֶךָ, וּבְכָל יוֹם יִהְיֶה בְּעֵינֵינוּ כְּאִלּוּ אָנוּ מְקַבְּלִים תּוֹרָתְךָ בִּדְבֵיקָה וַחֲשִׁיקָה וַחֲפִיצָה. וְהָאֵר עֵינֵינוּ בְּתוֹרָתֶךָ, וּתְדַבֵּק לִבֵּנוּ בְּמִצְוֹתֶיךָ, וּתְיַּחֵד לְבָבֵנוּ לְאַהֲבָה וּלְיִרְאָה אֶת שִׁמְךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא. וְתִגְאָלֵנוּ לְמַעַן רַחֲמֶיךָ. וּתְזַכֵּנוּ לְקַבֵּל וְלִשְׁמוֹעַ תּוֹרָה מִפִּיךָ, כְּמוֹ שֶׁנֶּאֱמַר, וְכׇל־בָּנַ֖יִךְ לִמּוּדֵ֣י יְהֹוָ֑ה וְרַ֖ב שְׁל֥וֹם בָּנָֽיִךְ. בִּמְהֵרָה בְיָמֵינוּ אָמֵן כֵּן יְהִי רָצוֹן:</small>"));
  parts.push(p("(ד) וַהֲרֵינִי מְקַיֵם מִקְרָא שֶׁכָּתוּב <small>(דברים ח יח)</small> וְזָֽכַרְתָּ֙ אֶת־יְהֹוָ֣ה אֱלֹהֶ֔יךָ כִּ֣י ה֗וּא הַנֹּתֵ֥ן לְךָ֛ כֹּ֖חַ לַעֲשׂ֣וֹת חָ֑יִל:"));
  parts.push(p("<small>וַהֲרֵינִי מַאֲמִין שֶׁהַכֹּל מִמֶּנּוּ יִתְבָּרַךְ, וְכָל הַטּוֹב שֶׁיֵּשׁ לָנוּ בֵּין טוֹבַת הַגּוּף בֵּין טוֹבַת הַנֶּפֶשׁ, הַכֹּל מֵאִתּוֹ יִתְבָּרַךְ אֲשֶׁר הִגְדִּיל חַסְדּוֹ עִמָּנוּ בְּכָל־צִדְקוֹתָיו, וּכְרוֹב רַחֲמָיו יִתְבָּרַךְ וְיִתְעַלֶּה: <br>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ וְתַשְׁפִּיעַ עָלֵינוּ שֶׁפַע יְשׁוּעָה וְרַחֲמִים. וְנִהְיֶה בְּרִיאִים בְּכָל רַמַ\"ח אֵבָרֵינוּ וְשַׁסַ\"הּ גִּידֵנוּ לַעֲבוֹדָתֶיךָ וּלְיִרְאָתֶךָ. וְתַצִּילֵנוּ מִכָּל חוֹלִי וּמִכָּל כְּאֵב וּמִכָּל מֵיחוֹשׁ וּמִכָּל מִדּוֹת רָעוֹת. רְפָאֵנוּ יְהֹוָה וְנֵרָפֵא הוֹשִׁיעֵנוּ וְנִוָּשֵׁעָה כִּי תְהִלָּתֵנוּ אָתָּה. וְתַשְׁפִּיעַ טַל הָעֶלְיוֹן מִתְּרֵין מַזָלִּין נוֹצֵר וְנַקֵּה דֶּרֶךְ חֵיךְ וְגָרוֹן לְאַבָּא וְאִימָא, וּמֵאַבָּא וְאִימָא לִזְעֵיר אַנְפִּין, וּמִזְּעֵיר אַנְפִּין לַחֲקַל תַּפּוּחִין קַדִּישִׁין, וּמִשָּׁם יִשְׁתַּלְשֵׁל וְיַגִּיעַ וְיֵרָאֶה שֶׁפַע יְשׁוּעָה וְרַחֲמִים בְּכָל־הָעוֹלָמוֹת, וְרַוֵּה פְּנֵי תֵבֵל, וְשַֹבַּע אֶת הָעוֹלָם כֻּלּוֹ מִטּוּבָךְ, וּמַלֵּא יָדֵינוּ מִבִּרְכוֹתֶיךָ וּמֵעוֹשֶׁר מַתְּנוֹת יָדֶיךָ, וּתְפַרְנְסֵנוּ לָנוּ וּלְכָל־בְּנֵי בֵיתֵנוּ פַּרְנָסָה טוֹבָה וְכַלְכָּלָה מִיָדְךָ הַמְּלֵאָה וְהָרְחָבָה, בְּרֵיוַח וְהֶתֵּר וְנַחַת, בְּלִי שׁוּם עַיִן הָרָע: וּבְרוֹב רַחֲמֶיךָ תַּצִּילֵנוּ מִכָּל חֵטְא וְהִרְהוּר וְאַשְׁמָה וָרֶשַׁע. וּתְזַכֵּנוּ לַחֲזוֹר בִּתְשׁוּבָה שְׁלֵימָה וְלַעֲסוֹק בַּתּוֹרָה לִשְׁמָהּ וּבְמִצְוֹת וּגְמִילוּת חֲסָדִים. וְנַעֲשֶֹה חָיִל מִתּוֹרָה וּמִצְוֹת. וְלֹא יִמָּצֵא בָנוּ וּבְזַרְעֵינוּ וּבְזֶרַע זַרְעֵינוּ שׁוּם פְּגַם וְשׁוּם פְּסוּל. וּתְקַיֵּם בָּנוּ מִקְרָא שֶׁכָּתוּב לֹֽא־יָמ֡וּשׁוּ מִפִּ֩יךָ֩ וּמִפִּ֨י זַרְעֲךָ֜ וּמִפִּ֨י זֶ֤רַע זַרְעֲךָ֙ אָמַ֣ר יְהֹוָ֔ה מֵעַתָּ֖ה וְעַד־עוֹלָֽם׃ אָמֵן כֵּן יְהִי רָצוֹן: </small>"));
  parts.push(p("(ה) וַהֲרֵינִי זוֹכֵר בִּמְרִירוּת נֶפֶשׁ כֹּל אֲשֶׁר הִכְעִיסוּ אֲבוֹתֵינוּ לְהַקָּדוֹשׁ בָּרוּךְ הוּא בַּמִּדְבָּר וּבִפְרַט בָּעֵגֶל, כְּמוֹ שֶׁאָמַר הַכָּתוּב <small>(דברים ט ז)</small> זְכֹר֙ אַל־תִּשְׁכַּ֔ח אֵ֧ת אֲשֶׁר־הִקְצַ֛פְתָּ אֶת־יְהֹוָ֥ה אֱלֹהֶ֖יךָ בַּמִּדְבָּ֑ר לְמִן־הַיּ֞וֹם אֲשֶׁר־יָצָ֣אתָ ׀ מֵאֶ֣רֶץ מִצְרַ֗יִם עַד־בֹּֽאֲכֶם֙ עַד־הַמָּק֣וֹם הַזֶּ֔ה מַמְרִ֥ים הֱיִיתֶ֖ם עִם־יְהֹוָה׃"));
  parts.push(p("<small>וַהֲרֵי אָנוּ בּוֹשִׁים וְנִכְלָמִים מְאֹד עַל מַעֲשֵׂה אֲבוֹתֵינוּ, וְעַל מַעֲשֵׂינוּ הָרָעִים, אֲשֶׁר חָטָאנוּ עָוִינוּ וּפָשַׁעְנוּ, וְעָבַרְנוּ עַל כַּמָה מֵרַמַ\"ח מִצְוֹת עֲשֵׂה, וְעַל כַּמָה מִשַּׁסַ\"הּ לֹא תַעֲשֶׂה, וּפָגַמְנוּ בְנַפְשֵׁינוּ רוּחֵנוּ וְנִשְׁמָתֵינוּ, וּפָגַמְנוּ בַּמִּדּוֹת הָעֶלְיוֹנוֹת וּבְכָל מְסִילוֹת דֶּרֶךְ הַשְׁפָּעָה הַנִּשְׁפָּעָה לְנַפְשֵׁנוּ רוּחֵנוּ וְנִשְׁמָתֵינוּ. אוֹי וַאֲבוֹי לָנוּ, אֵין לָנוּ פֶּה לְהָשִׁיב וְלֹא מֵצַח לְהָרִים רֹאשׁ. וְעַתָּה, בְּרוּחַ נִשְׁבָּרָה וְנֶפֶשׁ נְמוּכָה וְגוּף כָּפוּף אָנוּ מוֹדִים לְפָנֶיךָ וְאוֹמְרִים חָטָאנוּ עָוִינוּ פָּשַׁעְנוּ אֲנַחְנוּ וַאֲבוֹתֵינוּ, וַהֲרֵי אָנוּ שָׁבִים בִּתְשׁוּבָה: <br>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ, וּתְזַכֵּנוּ לַחֲזוֹר אֵלֶיךָ בִּתְשׁוּבָה שְׁלֵימָה, וְתַצִּילֵנוּ מִיֵּצֶר הָרָע. וְאַתָּה בְּרוֹב רַחֲמֶיךָ תְטַהֵר אֶת כֹּל אֲשֶׁר פָּגַמְנוּ, וּתְתַקֵּן אֶת אֲשֶׁר עִוַּתְנוּ, וּתְלַקֵּט אֲשֶׁר פִּזַּרְנוּ, וּתְמַלֵּא אֶת כָּל־הַשֵּׁמוֹת שֶׁפָּגַמְנוּ בָהֶם. עׇזְרֵ֤נוּ ׀ אֱלֹ֘הֵ֤י יִשְׁעֵ֗נוּ עַֽל־דְּבַ֥\"ר כְּבֽוֹ\"ד־שְׁמֶ֑\"ךָ וְהַצִּילֵ֥נוּ וְכַפֵּ֥ר עַל־חַ֝טֹּאתֵ֗ינוּ לְמַ֣עַן שְׁמֶֽךָ׃ יִֽהְי֥וּ לְרָצ֨וֹן ׀ אִמְרֵי־פִ֡י וְהֶגְי֣וֹן לִבִּ֣י לְפָנֶ֑יךָ יְ֝הֹוָ֗ה צוּרִ֥י וְגֹאֲלִֽי: </small>"));
  parts.push(p("(ו) וַהֲרֵינִי זוֹכֵר זְכִירַת הַמָּן שֶׁהֶאֱכֵיל הַקָּדוֹשׁ בָּרוּךְ הוּא אֶת אֲבוֹתֵינוּ בַּמִּדְבָּר, כְּמוֹ שֶׁנֶּאֱמַר <small>(דברים ח ב)</small> וְזָכַרְתָּ֣ אֶת־כׇּל־הַדֶּ֗רֶךְ אֲשֶׁ֨ר הוֹלִֽיכְךָ֜ יְהֹוָ֧ה אֱלֹהֶ֛יךָ זֶ֛ה אַרְבָּעִ֥ים שָׁנָ֖ה בַּמִּדְבָּ֑ר לְמַ֨עַן עַנֹּֽתְךָ֜ לְנַסֹּֽתְךָ֗ לָדַ֜עַת אֶת־אֲשֶׁ֧ר בִּֽלְבָבְךָ֛ הֲתִשְׁמֹ֥ר מִצְוֺתָ֖ו אִם־לֹֽא׃ וַֽיְעַנְּךָ֮ וַיַּרְעִבֶ֒ךָ֒ וַיַּֽאֲכִֽלְךָ֤ אֶת־הַמָּן֙ אֲשֶׁ֣ר לֹא־יָדַ֔עְתָּ וְלֹ֥א יָדְע֖וּן אֲבֹתֶ֑יךָ לְמַ֣עַן הוֹדִֽיעֲךָ֗ כִּ֠י לֹ֣א עַל־הַלֶּ֤חֶם לְבַדּוֹ֙ יִחְיֶ֣ה הָֽאָדָ֔ם:"));
  parts.push(p("<small>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ, וּכְשֵׁם שֶׁרִחַמְתָּ עַל אֲבוֹתֵינוּ בַּמִּדְבָּר וּמַנְּךָ לֹא מָנַעְתָּ מִפִּיהֶם, וְהָיוּ פְּנוּיִים לַעֲסוֹק בַּתּוֹרָה, כֵּן בְּרַחֲמֶיךָ הָרַבִּים תַּצִילֵנוּ מִכָּל־טִרְדָּה וּמִכַּף כָּל־אוֹרֵב וְאוֹיֵב וּמִכָּל־חוֹלִי, וְנִהְיֶה פְּנוּיִים לַעֲסוֹק בְּתוֹרָתְךָ הַקְּדוֹשָׁה. וְאַתָּה בְּרוֹב רַחֲמֶיךָ תָּחוֹן וְתַחְמוֹל עָלֵינוּ, וְתִתֶּן לָנוּ וּלְכָל־בְּנֵי בֵיתֵנוּ לֶחֶם לֶאֱכוֹל וּבֶגֶד לִלְבּוֹשׁ, כְּשֵׁם שֶׁנָּתַתָּ פִּסַּת לֶחֶם לֶאֱכוֹל וּבֶגֶד לִלְבּוֹשׁ לְיַעֲקֹב אָבִינוּ הַנִּקְרָא אִישׁ תָּם, כִּי אַתָּה הָאֵל הַטּוֹב הַזָּן וּמְפַרְנֵס וּמְכַלְכֵּל בַּחֲסָדֶיךָ לְכָל־בְּרִיּוֹתֶיךָ, כְּדִכְתִיב, פּוֹתֵ֥חַ אֶת־יָדֶ֑ךָ וּמַשְׂבִּ֖יעַ לְכׇל־חַ֣י רָצֽוֹן׃ וּכְתִיב, נֹתֵ֣ן לֶ֭חֶם לְכׇל־בָּשָׂ֑ר, וּכְתִיב, טוֹב־יְהֹוָ֥ה לַכֹּ֑ל וְ֝רַחֲמָ֗יו עַל־כׇּל־מַעֲשָֽׂיו׃ וּבְכֵן יְהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, שֶׁנִּהְיֶה אֲנַחְנוּ וְכָל־בְּנֵי בֵיתֵנוּ בִּכְלַל הָרַחֲמִים וְהַחֶסֶד, שֶׁתִּתֵּן לָנוּ מְזוֹנוֹתֵינוּ בְּמִילוּי וּבְרֶוַח כִּי רַחוּם אָתָּה. יִֽהְי֥וּ לְרָצ֨וֹן ׀ אִמְרֵי־פִ֡י וְהֶגְי֣וֹן לִבִּ֣י לְפָנֶ֑יךָ יְ֝הֹוָ֗ה צוּרִ֥י וְגֹאֲלִֽי: </small>"));
  parts.push(p("(ז) וַהֲרֵינִי זוֹכֵר מַה שֶׁעָשָׂה הַקָּדוֹשׁ בָּרוּךְ הוּא לְמִרְיָם הַנְּבִיאָה, כְּמוֹ שֶׁנֶּאֱמַר <small>(דברים כד ט)</small> זָכ֕וֹר אֵ֧ת אֲשֶׁר־עָשָׂ֛ה יְהֹוָ֥ה אֱלֹהֶ֖יךָ לְמִרְיָ֑ם בַּדֶּ֖רֶךְ בְּצֵאתְכֶ֥ם מִמִּצְרָֽיִם׃ "));
  parts.push(p("<small>פֵּרוּשׁ (הרמב\"ם ז\"ל סוף הלכות טומאת צרעת פט\"ז ה\"י) הִתְבּוֹנְנוּ מָה אֵרַע לְמִרְיָם הַנְּבִיאָה שֶׁדִּבְּרָה בְּאָחִיהָ שֶׁהָיְתָה גְּדוֹלָה מִמֶּנּוּ בְּשָׁנִים וְגִּדְלַתּוּ עַל בִּרְכֶּיהָ וְסִכְּנָה בְּעַצְמָהּ לְהַצִּילוֹ מִן הַיָּם וְהִיא לֹא דִּבְּרָה בִּגְנוּתוֹ אֶלָּא טָעֲתָה שֶׁהִשְׁוַתּוּ לִשְׁאָר נְבִיאִים וְהוּא לֹא הִקְפִּיד, וְאַף עַל פִּי כֵן מִיָּד נֶעֶנְשָׁה בְּצָרַעַת: <br>וּבְכֵן יִרְאָה וָרָעַד יָבֹא בָנוּ, עַל כָּל־אֲשֶׁר חָטָאנוּ עָוִינוּ וּפָשַׁעְנוּ, וְדִיבַּרְנוּ לָשׁוֹן הָרָע עַל חֲבֵירֵינוּ, וְעַל הַגְּדוֹלִים וְטוֹבִים מִמֶּנּוּ, וְעַל חַכְמֵי יִשְׂרָאֵל. אוֹי לָנוּ, אֲהָהּ עַל נַפְשֵׁנוּ, וּפָגַמְנוּ בַּלָשׁוֹן גַּם בַּשֶׁקֶר וְכָזָב וְלֵיצָנוּת וַחֲנוּפָה, וְהָיִינוּ מִכְּלַל אַרְבַּע כִּתּוֹת שֶׁאֵינָן מְקַבְּלוֹת פְּנֵי הַשְׁכִינָה. עַל־זֶ֗ה הָיָ֤ה דָוֶה֙ לִבֵּ֔נוּ עַל־אֵ֖לֶּה חָשְׁכ֥וּ עֵינֵֽינוּ׃ וַהֲרֵי אָנוּ מִתְחַרְטִים חֲרָטָה גְּמוּרָה וְשָׁבִים בִּתְשׁוּבָה, וּמְבַקְשִׁים מְחִילָה וּסְלִיחָה וְכַפָּרָה עַל אֲשֶׁר נוֹאַלְנוּ וַאֲשֶׁר חָטָאנוּ עָוִינוּ וּפָשָׁעְנוּ: <br>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּמְחוֹל וְתִסְלַח וּתְכַפֵּר אֶת כָּל־חַטֹּאתֵינוּ וּפְשָׁעֵינוּ, וּתְזַכֵּנוּ לַחֲזוֹר אֵלֶיךָ בִּתְשׁוּבָה שְׁלֵמָה, וּתְזַכֵּנוּ לִשְׁמוֹר פִּינוּ וּלְשׁוֹנֵנוּ בַּכֹּל מִכֹּל כֹּל, וְיָשׁוּב לְאֵיתָנוֹ הָרִאשׁוֹן, וְלֹא יִדַּח מִמֶּנּוּ נִדָּח. אָמֵן כֵּן יְהִי רָצוֹן:</small>"));
  parts.push(p("(ח) וַהֲרֵי אֲנִי מְקַיֵּם מִצְוַת זְכִירַת עֲמָלֵק, כְּמוֹ שֶׁנֶּאֱמַר <small>(דברים כה יז)</small> זָכ֕וֹר אֵ֛ת אֲשֶׁר־עָשָׂ֥ה לְךָ֖ עֲמָלֵ֑ק בַּדֶּ֖רֶךְ בְּצֵאתְכֶ֥ם מִמִּצְרָֽיִם׃ אֲשֶׁ֨ר קָֽרְךָ֜ בַּדֶּ֗רֶךְ וַיְזַנֵּ֤ב בְּךָ֙ כׇּל־הַנֶּחֱשָׁלִ֣ים אַֽחֲרֶ֔יךָ וְאַתָּ֖ה עָיֵ֣ף וְיָגֵ֑עַ וְלֹ֥א יָרֵ֖א אֱלֹהִֽים׃ וְהָיָ֡ה בְּהָנִ֣יחַ יְהֹוָ֣ה אֱלֹהֶ֣יךָ ׀ לְ֠ךָ֠ מִכׇּל־אֹ֨יְבֶ֜יךָ מִסָּבִ֗יב בָּאָ֙רֶץ֙ אֲשֶׁ֣ר יְהֹוָה־אֱ֠לֹהֶ֠יךָ נֹתֵ֨ן לְךָ֤ נַחֲלָה֙ לְרִשְׁתָּ֔הּ תִּמְחֶה֙ אֶת־זֵ֣כֶר עֲמָלֵ֔ק מִתַּ֖חַת הַשָּׁמָ֑יִם לֹ֖א תִּשְׁכָּֽח׃"));
  parts.push(p("<small>רִבּוֹנוֹ שֶׁל עוֹלָם. יֶחֱרַד לִבֵּנוּ וְיִתַּר מִמְּקוֹמוֹ. אֲשֶׁר כִּבְיָכוֹל אֵין הַשֵּׁם שָׁלֵם וְאֵין כִּסְאוֹ שָׁלֵם עַד שֶׁיִּמָּחֶה זֵכֵֶר עֲמָלֵק, זֶה כַּמָה מֵאוֹת שָׁנִים. אוֹי נָא לָנוּ כִּי חָטָאנוּ, וְהֵן בְּעָוֹן חוֹלָלְנוּ, חוּלִין הוּא לָנוּ, כִּי עֲוֹנוֹתֵינוּ הִטּוּ אֵלֶּה לְעַכֵּב מְחִיַּית עֲמָלֵק, מַה נְּדַבֵּר וּמַה נִּצְטַדָּק, וּבְלֵב נִשְׁבָּר וְנִדְכֶּה אָתָאנוּ לְחַלּוֹת פָּנֶיךָ. אָנָּא יְהֹוָה עֲשֵׂה לְמַעַן שִׁמְךָ הַגָּדוֹל, וְתַכְנִיעַ וְתִמְחֶה אֶת זֵכֵֶר עֲמָלֵק, וּתְאַבֵּד כָּל־זֵכֵֶר לָמוֹ. וַֽ֭יהֹוָה לְעוֹלָ֣ם יֵשֵׁ֑ב כּוֹנֵ֖ן לַמִּשְׁפָּ֣ט כִּסְאֽוֹ׃ בִּמְהֵרָה בְיָמֵינוּ אָמֵן: </small>"));
  parts.push(p("(ט) וַהֲרֵינִי מְקַיֵּם מִצְוָה לִזְכּוֹר שֶׁהִצִּיל הַשֵׁם אֶת אֲבוֹתֵינוּ מִבָּלָק וּבִלְעָם, כְּמוֹ שֶׁנֶּאֱמַר <small>(מיכה ו ה)</small> עַמִּ֗י זְכׇר־נָא֙ מַה־יָּעַ֗ץ בָּלָק֙ מֶ֣לֶךְ מוֹאָ֔ב וּמֶה־עָנָ֥ה אֹת֖וֹ בִּלְעָ֣ם בֶּן־בְּע֑וֹר מִן־הַשִּׁטִּים֙ עַד־הַגִּלְגָּ֔ל לְמַ֕עַן דַּ֖עַת צִדְק֥וֹת יְהֹוָֽה׃"));
  parts.push(p("<small>רִבּוֹנוֹ שֶׁל עוֹלָם. מוֹדִים אֲנַחְנוּ לָךְ עַל כָּל הַטּוֹבוֹת וְהַנִּסִּים וְהַנִּפְלָאוֹת שֶׁעָשִֹיתָ עִמָּנוּ וְעִם אֲבוֹתֵינוּ, וּבִכְלַל רַחֲמֶיךָ מַה שֶׁהִפְלֵאתָ לַעֲשֹוֹת לַאֲבוֹתֵינוּ בַּמִּדְבָּר וְהִצַּלְתָּם מִבָּלָק וּבִלְעָם, וְהֵפַרְתָּ עֲצָתָם וְקִלְקַלְתָּ מַחְשְׁבוֹתָם, וְלֹא נִתְכַּעַסְתָּ בַּיָּמִים הָהֵם. וּכְתִיב, וַיַּהֲפֹךְ֩ יְהֹוָ֨ה אֱלֹהֶ֧יךָ לְּךָ֛ אֶת־הַקְּלָלָ֖ה לִבְרָכָ֑ה כִּ֥י אֲהֵֽבְךָ֖ יְהֹוָ֥ה אֱלֹהֶֽיךָ׃ וְעַל כּוּלָם יִתְבָּרֵךְ וְיִתְרוֹמֵם וְיִתְנַשֵֹּא תָּמִיד שִׁמְךָ מַלְכֵּנוּ לְעוֹלָם וָעֶד. וְכֹל הַחַיִּים יוֹדוּךָ סֶּלָה: <br>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתִּתְמַלֵּא רַחֲמִים עָלֵינוּ. יְהִֽי־חַסְדְּךָ֣ יְהֹוָ֣ה עָלֵ֑ינוּ כַּ֝אֲשֶׁ֗ר יִחַ֥לְנוּ לָֽךְ: וְתָפֵר עֲצַת אוֹיְבֵינוּ, הָפֵר עֲצָתָם וְקַלְקֵל מַחְשְׁבוֹתָם, וְהָשֵׁב גְּמוּלָם בְּרֹאשָׁם, וְלֹא תַעֲשֶֹינָה יְדֵיהֶם תּוּשִׁיָּה. וּפְצֵנוּ וְהַצִּילֵנוּ מִכָּל צָרָה, כִּי בְךָ בָטָחְנוּ, וּבְחַסְדְּךָ הַגָּדוֹל בֶּאֱמֶת נִשְׁעָנְנוּ, וּבְשִׁמְךָ נֶעֱזָרְנוּ. הַטּוֹב כִּי לֹא כָלוּ רַחֲמֶיךָ, וְהַמְרַחֵם כִּי לֹא תַמּוּ חֲסָדֶיךָ, כִּי מֵעוֹלָם קִוִּינוּ לָךְ. חוּס וְרַחֵם כִּי שִׁמְךָ נִקְרָא עָלֵינוּ. וְקַיֵּם לָנוּ מַה שֶׁהִבְטַחְתָּנוּ וְאַף־גַּם־זֹ֠את בִּֽהְיוֹתָ֞ם בְּאֶ֣רֶץ אֹֽיְבֵיהֶ֗ם לֹֽא־מְאַסְתִּ֤ים וְלֹֽא־גְעַלְתִּים֙ לְכַלֹּתָ֔ם לְהָפֵ֥ר בְּרִיתִ֖י אִתָּ֑ם כִּ֛י אֲנִ֥י יְהֹוָ֖ה אֱלֹהֵיהֶֽם׃ יִֽהְי֥וּ לְרָצ֨וֹן ׀ אִמְרֵי־פִ֡י וְהֶגְי֣וֹן לִבִּ֣י לְפָנֶ֑יךָ יְ֝הֹוָ֗ה צוּרִ֥י וְגֹאֲלִֽי:</small>"));
  parts.push(p("(י) הֲרֵינִי זוֹכֵר אֶת יְרוּשָׁלַיִם, כְּמוֹ שֶׁנֶּאֱמַר <small>(תהלים קלז ה)</small> אִֽם־אֶשְׁכָּחֵ֥ךְ יְֽרוּשָׁלָ֗‍ִם תִּשְׁכַּ֥ח יְמִינִֽי׃ תִּדְבַּֽק־לְשׁוֹנִ֨י ׀ לְחִכִּי֮ אִם־לֹ֢א אֶ֫זְכְּרֵ֥כִי אִם־לֹ֣א אַ֭עֲלֶה אֶת־יְרוּשָׁלַ֑‍ִם עַ֗֝ל רֹ֣אשׁ שִׂמְחָתִֽי׃"));
  parts.push(p("<small>וִיהִי רָצוֹן מִלְּפָנֶיךָ יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁתְּרַחֵם עַל יְרוּשָׁלַיִם עִיר הַקוֹדֶשׁ, הָעִיר אֲשֶׁר בָּחַרְתָּ, וְעַל מִקְדָּשְׁךָ בְּרַחֲמֶיךָ הָרַבִּים. וְקַיֵּם לָנוּ מַה שֶׁהִבְטַחְתָּנוּ בּוֹנֵ֣ה יְרֽוּשָׁלַ֣‍ִם יְהֹוָ֑ה נִדְחֵ֖י יִשְׂרָאֵ֣ל יְכַנֵּֽס׃ אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ, מֶלֶךְ רַחֲמָן רַחֵם עָלֵינוּ, טוֹב וּמֵטִיב הִדָּרֶשׁ לָנוּ, שׁוּבָה עָלֵינוּ בַּהֲמוֹן רַחֲמֶיךָ, בִּגְלַל אָבוֹת שֶׁעָשֹוּ רְצוֹנֶךָ, כּוֹנֵן בֵּית מִקְדָּשְׁךָ עַל מְכוֹנוֹ, הַרְאֵינוּ בְּבִנְיָנוֹ, שַֹמְּחֵנוּ בְּתִקּוּנוֹ, וְהָשֵׁב שְׁכִינָתְךָ לְתוֹכוֹ, וְהָשֵׁב כֹּהֲנִים לַעֲבוֹדָתָם, וּלְוִיִּים לְשִׁירָם וּלְזִמְרָם. בִּמְהֵרָה בְיָמֵינוּ אָמֵן: </small>"));
  parts.push(p("<small>כשיוצא מבית הכנסת אומר: <br>יְהֹוָ֤ה ׀ נְחֵ֬נִי בְצִדְקָתֶ֗ךָ לְמַ֥עַן שׁוֹרְרָ֑י הושר [הַיְשַׁ֖ר] לְפָנַ֣י דַּרְכֶּֽךָ׃ וְיַעֲקֹ֖ב הָלַ֣ךְ לְדַרְכּ֑וֹ וַיִּפְגְּעוּ־ב֖וֹ מַלְאֲכֵ֥י אֱלֹהִֽים׃ וַיֹּ֤אמֶר יַעֲקֹב֙ כַּאֲשֶׁ֣ר רָאָ֔ם מַחֲנֵ֥ה אֱלֹהִ֖ים זֶ֑ה וַיִּקְרָ֛א שֵֽׁם־הַמָּק֥וֹם הַה֖וּא מַֽחֲנָֽיִם׃</small>"));
  parts.push(hr);

  // ─────────────────────────── הלל ───────────────────────────
  if (isHallelDay) {
    var hl = [];
    hl.push(p("<big><b>הלל לראש חודש ולמועדים</b></big>"));
    hl.push(p("<small>בימים שגומרים את ההלל אומר החזן:</small>"));
    hl.push(p("<small>בִּרְשׁוּת מוֹרַי וְרַבּוֹתַי. <small>והציבור עונים:</small> שָׁמַיִם.</small>"));
    hl.push(p("<small>והחזן מברך ואחר כך הציבור מברכים</small>"));
    hl.push(p("<small><b>בָּרוּךְ</b> אַתָּה יְהֹוָה, אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ לִגְמוֹר אֶת הַהַלֵּל:</small>"));
    hl.push(p("<b>הַ֥לְלוּיָ֨הּ</b> ׀ <small>(תהילים קי״ג:א׳-ב׳)</small> הַ֭לְלוּ עַבְדֵ֣י יְהֹוָ֑ה הַֽ֝לְל֗וּ אֶת־שֵׁ֥ם יְהֹוָֽה׃ יְהִ֤י שֵׁ֣ם יְהֹוָ֣ה מְבֹרָ֑ךְ מֵ֝עַתָּ֗ה וְעַד־עוֹלָֽם׃ מִמִּזְרַח־שֶׁ֥מֶשׁ עַד־מְבוֹא֑וֹ מְ֝הֻלָּ֗ל שֵׁ֣ם יְהֹוָֽה׃ רָ֖ם עַל־כׇּל־גּוֹיִ֥ם ׀ יְהֹוָ֑ה עַ֖ל הַשָּׁמַ֣יִם כְּבוֹדֽוֹ׃ מִ֭י כַּיהֹוָ֣ה אֱלֹהֵ֑ינוּ הַֽמַּגְבִּיהִ֥י לָשָֽׁבֶת׃ הַֽמַּשְׁפִּילִ֥י לִרְא֑וֹת בַּשָּׁמַ֥יִם וּבָאָֽרֶץ׃ מְקִ֥ימִ֣י מֵעָפָ֣ר דָּ֑ל מֵ֝אַשְׁפֹּ֗ת יָרִ֥ים אֶבְיֽוֹן׃ לְהוֹשִׁיבִ֥י עִם־נְדִיבִ֑ים עִ֗֝ם נְדִיבֵ֥י עַמּֽוֹ׃ מֽוֹשִׁיבִ֨י ׀ עֲקֶ֬רֶת הַבַּ֗יִת אֵֽם־הַבָּנִ֥ים שְׂמֵחָ֗ה הַֽלְלוּיָֽהּ׃"));
    hl.push(p("<b>בְּצֵ֣את</b> <small>(תהילים קי״ד:א׳-ב׳)</small> יִ֭שְׂרָאֵל מִמִּצְרָ֑יִם בֵּ֥ית יַ֝עֲקֹ֗ב מֵעַ֥ם לֹעֵֽז׃ הָיְתָ֣ה יְהוּדָ֣ה לְקׇדְשׁ֑וֹ יִ֝שְׂרָאֵ֗ל מַמְשְׁלוֹתָֽיו׃ הַיָּ֣ם רָ֭אָה וַיָּנֹ֑ס הַ֝יַּרְדֵּ֗ן יִסֹּ֥ב לְאָחֽוֹר׃ הֶ֭הָרִים רָקְד֣וּ כְאֵילִ֑ים גְּ֝בָע֗וֹת כִּבְנֵי־צֹֽאן׃ מַה־לְּךָ֣ הַ֭יָּם כִּ֣י תָנ֑וּס הַ֝יַּרְדֵּ֗ן תִּסֹּ֥ב לְאָחֽוֹר׃ הֶ֭הָרִים תִּרְקְד֣וּ כְאֵילִ֑ים גְּ֝בָע֗וֹת כִּבְנֵי־צֹֽאן׃ מִלִּפְנֵ֣י אָ֭דוֹן ח֣וּלִי אָ֑רֶץ מִ֝לִּפְנֵ֗י אֱל֣וֹהַּ יַעֲקֹֽב׃ הַהֹפְכִ֣י הַצּ֣וּר אֲגַם־מָ֑יִם חַ֝לָּמִ֗ישׁ לְמַעְיְנוֹ־מָֽיִם׃"));
    if (!isFullHallel) {
      hl.push(p("<small>בימים שאין גומרים את ההלל מדלגים</small>"));
    } else {
      hl.push(p("<b><small>לֹ֤א</small></b><small> <small>(תהילים קט״ו:א׳-ב׳)</small> לָ֥נוּ יְהֹוָ֗ה לֹ֫א לָ֥נוּ כִּֽי־לְ֭שִׁמְךָ תֵּ֣ן כָּב֑וֹד עַל־חַ֝סְדְּךָ֗ עַל־אֲמִתֶּֽךָ׃ לָ֭מָּה יֹאמְר֣וּ הַגּוֹיִ֑ם אַיֵּה־נָ֗֝א אֱלֹהֵיהֶֽם׃ וֵאלֹהֵ֥ינוּ בַשָּׁמָ֑יִם כֹּ֖ל אֲשֶׁר־חָפֵ֣ץ עָשָֽׂה׃ עֲֽ֭צַבֵּיהֶם כֶּ֣סֶף וְזָהָ֑ב מַ֝עֲשֵׂ֗ה יְדֵ֣י אָדָֽם׃ פֶּֽה־לָ֭הֶם וְלֹ֣א יְדַבֵּ֑רוּ עֵינַ֥יִם לָ֝הֶ֗ם וְלֹ֣א יִרְאֽוּ׃ אׇזְנַ֣יִם לָ֭הֶם וְלֹ֣א יִשְׁמָ֑עוּ אַ֥ף לָ֝הֶ֗ם וְלֹ֣א יְרִיחֽוּן׃ יְדֵיהֶ֤ם ׀ וְלֹ֬א יְמִישׁ֗וּן רַ֭גְלֵיהֶם וְלֹ֣א יְהַלֵּ֑כוּ לֹא־יֶ֝הְגּ֗וּ בִּגְרוֹנָֽם׃ כְּ֭מוֹהֶם יִהְי֣וּ עֹשֵׂיהֶ֑ם כֹּ֖ל אֲשֶׁר־בֹּטֵ֣חַ בָּהֶֽם׃ יִ֭שְׂרָאֵל בְּטַ֣ח בַּיהֹוָ֑ה עֶזְרָ֖ם וּמָגִנָּ֣ם הֽוּא׃ בֵּ֣ית אַ֭הֲרֹן בִּטְח֣וּ בַיהֹוָ֑ה עֶזְרָ֖ם וּמָגִנָּ֣ם הֽוּא׃ יִרְאֵ֣י יְ֭הֹוָה בִּטְח֣וּ בַיהֹוָ֑ה עֶזְרָ֖ם וּמָגִנָּ֣ם הֽוּא׃ </small>"));
    }
    hl.push(p("<b>יְהֹוָה֮</b> זְכָרָ֢נוּ יְבָ֫רֵ֥ךְ יְ֭בָרֵךְ אֶת־בֵּ֣ית יִשְׂרָאֵ֑ל יְ֝בָרֵ֗ךְ אֶת־בֵּ֥ית אַהֲרֹֽן׃ יְ֭בָרֵךְ יִרְאֵ֣י יְהֹוָ֑ה הַ֝קְּטַנִּ֗ים עִם־הַגְּדֹלִֽים׃ יֹסֵ֣ף יְהֹוָ֣ה עֲלֵיכֶ֑ם עֲ֝לֵיכֶ֗ם וְעַל־בְּנֵיכֶֽם׃ בְּרוּכִ֣ים אַ֭תֶּם לַיהֹוָ֑ה עֹ֝שֵׂ֗ה שָׁמַ֥יִם וָאָֽרֶץ׃ הַשָּׁמַ֣יִם שָׁ֭מַיִם לַיהֹוָ֑ה וְ֝הָאָ֗רֶץ נָתַ֥ן לִבְנֵי־אָדָֽם׃ לֹ֣א הַ֭מֵּתִים יְהַֽלְלוּ־יָ֑הּ וְ֝לֹ֗א כׇּל־יֹרְדֵ֥י דוּמָֽה׃ וַאֲנַ֤חְנוּ ׀ נְבָ֘רֵ֤ךְ יָ֗הּ מֵעַתָּ֥ה וְעַד־עוֹלָ֗ם הַֽלְלוּ יָֽהּ׃"));
    if (isFullHallel) {
      hl.push(p("<b><small>אָ֭הַבְתִּי</small></b><small> <small>(תהילים קט״ז:א׳-ב׳)</small> כִּי־יִשְׁמַ֥ע ׀ יְהֹוָ֑ה אֶת־ק֝וֹלִ֗י תַּחֲנוּנָֽי׃ כִּי־הִטָּ֣ה אׇזְנ֣וֹ לִ֑י וּבְיָמַ֥י אֶקְרָֽא׃ אֲפָפ֤וּנִי ׀ חֶבְלֵי־מָ֗וֶת וּמְצָרֵ֣י שְׁא֣וֹל מְצָא֑וּנִי צָרָ֖ה וְיָג֣וֹן אֶמְצָֽא׃ וּבְשֵֽׁם־יְהֹוָ֥ה אֶקְרָ֑א אָנָּ֥ה יְ֝הֹוָ֗ה מַלְּטָ֥ה נַפְשִֽׁי׃ חַנּ֣וּן יְהֹוָ֣ה וְצַדִּ֑יק וֵ֖אלֹהֵ֣ינוּ מְרַחֵֽם׃ שֹׁמֵ֣ר פְּתָאיִ֣ם יְהֹוָ֑ה דַּ֝לֹּתִ֗י וְלִ֣י יְהוֹשִֽׁיעַ׃ שׁוּבִ֣י נַ֭פְשִׁי לִמְנוּחָ֑יְכִי כִּֽי־יְ֝הֹוָ֗ה גָּמַ֥ל עָלָֽיְכִי׃ כִּ֤י חִלַּ֥צְתָּ נַפְשִׁ֗י מִ֫מָּ֥וֶת אֶת־עֵינִ֥י מִן־דִּמְעָ֑ה אֶת־רַגְלִ֥י מִדֶּֽחִי׃ אֶ֭תְהַלֵּךְ לִפְנֵ֣י יְהֹוָ֑ה בְּ֝אַרְצ֗וֹת הַחַיִּֽים׃ הֶ֭אֱמַנְתִּי כִּ֣י אֲדַבֵּ֑ר אֲ֝נִ֗י עָנִ֥יתִי מְאֹֽד׃ אֲ֭נִי אָמַ֣רְתִּי בְחׇפְזִ֑י כׇּֽל־הָאָדָ֥ם כֹּזֵֽב׃</small>"));
    }
    hl.push(p("<b>מָה־אָשִׁ֥יב</b> לַיהֹוָ֑ה כׇּֽל־תַּגְמוּל֥וֹהִי עָלָֽי׃ כּוֹס־יְשׁוּע֥וֹת אֶשָּׂ֑א וּבְשֵׁ֖ם יְהֹוָ֣ה אֶקְרָֽא׃ נְ֭דָרַי לַיהֹוָ֣ה אֲשַׁלֵּ֑ם נֶגְדָה־נָּ֗֝א לְכׇל־עַמּֽוֹ׃ יָ֭קָר בְּעֵינֵ֣י יְהֹוָ֑ה הַ֝מָּ֗וְתָה לַחֲסִידָֽיו׃ אָנָּ֣ה יְהֹוָה֮ כִּֽי־אֲנִ֢י עַ֫בְדֶּ֥ךָ אֲנִי־עַ֭בְדְּךָ בֶּן־אֲמָתֶ֑ךָ פִּ֝תַּ֗חְתָּ לְמֽוֹסֵרָֽי׃ לְֽךָ־אֶ֭זְבַּח זֶ֣בַח תּוֹדָ֑ה וּבְשֵׁ֖ם יְהֹוָ֣ה אֶקְרָֽא׃ נְ֭דָרַי לַיהֹוָ֣ה אֲשַׁלֵּ֑ם נֶגְדָה־נָּ֗֝א לְכׇל־עַמּֽוֹ׃ בְּחַצְר֤וֹת ׀ בֵּ֤ית יְהֹוָ֗ה בְּֽת֘וֹכֵ֤כִי יְֽרוּשָׁלָ֗‍ִם הַֽלְלוּיָֽהּ׃"));
    hl.push(p("<b>הַֽלְל֣וּ</b> <small>(תהילים קי״ז:א׳-ב׳)</small> אֶת־יְ֭הֹוָה כׇּל־גּוֹיִ֑ם שַׁ֝בְּח֗וּהוּ כׇּל־הָאֻמִּֽים׃ כִּ֥י גָ֘בַ֤ר עָלֵ֨ינוּ ׀ חַסְדּ֗וֹ וֶאֱמֶת־יְהֹוָ֥ה לְעוֹלָ֗ם הַֽלְלוּיָֽהּ׃"));
    hl.push(p("<b>הוֹד֣וּ</b> <small>(תהילים קי״ח:א׳)</small> לַיהֹוָ֣ה כִּי־ט֑וֹב כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ "));
    hl.push(p("יֹאמַר־נָ֥א יִשְׂרָאֵ֑ל כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ "));
    hl.push(p("יֹאמְרוּ־נָ֥א בֵֽית־אַהֲרֹ֑ן כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ "));
    hl.push(p("יֹאמְרוּ־נָ֭א יִרְאֵ֣י יְהֹוָ֑ה כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ "));
    hl.push(p("<b>מִֽן־הַ֭מֵּצַר</b> קָרָ֣אתִי יָּ֑הּ עָנָ֖נִי בַמֶּרְחָ֣ב יָֽהּ׃ יְהֹוָ֣ה לִ֭י לֹ֣א אִירָ֑א מַה־יַּעֲשֶׂ֖ה לִ֣י אָדָֽם׃ יְהֹוָ֣ה לִ֭י בְּעֹזְרָ֑י וַ֝אֲנִ֗י אֶרְאֶ֥ה בְשֹׂנְאָֽי׃ ט֗וֹב לַחֲס֥וֹת בַּיהֹוָ֑ה מִ֝בְּטֹ֗חַ בָּאָדָֽם׃ ט֗וֹב לַחֲס֥וֹת בַּיהֹוָ֑ה מִ֝בְּטֹ֗חַ בִּנְדִיבִֽים׃ כׇּל־גּוֹיִ֥ם סְבָב֑וּנִי בְּשֵׁ֥ם יְ֝הֹוָ֗ה כִּ֣י אֲמִילַֽם׃ סַבּ֥וּנִי גַם־סְבָב֑וּנִי בְּשֵׁ֥ם יְ֝הֹוָ֗ה כִּ֣י אֲמִילַֽם׃ סַבּ֤וּנִי כִדְבוֹרִ֗ים דֹּ֭עֲכוּ כְּאֵ֣שׁ קוֹצִ֑ים בְּשֵׁ֥ם יְ֝הֹוָ֗ה כִּ֣י אֲמִילַֽם׃ דַּחֹ֣ה דְחִיתַ֣נִי לִנְפֹּ֑ל וַ֖יהֹוָ֣ה עֲזָרָֽנִי׃ עָזִּ֣י וְזִמְרָ֣ת יָ֑הּ וַֽיְהִי־לִ֗֝י לִישׁוּעָֽה׃ ק֤וֹל ׀ רִנָּ֬ה וִישׁוּעָ֗ה בְּאׇהֳלֵ֥י צַדִּיקִ֑ים יְמִ֥ין יְ֝הֹוָ֗ה עֹ֣שָׂה חָֽיִל׃ יְמִ֣ין יְ֭הֹוָה רוֹמֵמָ֑ה יְמִ֥ין יְ֝הֹוָ֗ה עֹ֣שָׂה חָֽיִל׃ לֹא־אָמ֥וּת כִּֽי־אֶחְיֶ֑ה וַ֝אֲסַפֵּ֗ר מַעֲשֵׂ֥י יָֽהּ׃ יַסֹּ֣ר יִסְּרַ֣נִּי יָּ֑הּ וְ֝לַמָּ֗וֶת לֹ֣א נְתָנָֽנִי׃ פִּתְחוּ־לִ֥י שַׁעֲרֵי־צֶ֑דֶק אָבֹא־בָ֗֝ם אוֹדֶ֥ה יָֽהּ׃ זֶה־הַשַּׁ֥עַר לַיהֹוָ֑ה צַ֝דִּיקִ֗ים יָבֹ֥אוּ בֽוֹ׃ "));
    hl.push(p("<b>א֭וֹדְךָ</b> כִּ֣י עֲנִיתָ֑נִי וַתְּהִי־לִ֗֝י לִישׁוּעָֽה׃ <small>א֭וֹדְךָ כִּ֣י עֲנִיתָ֑נִי וַתְּהִי־לִ֗֝י לִישׁוּעָֽה׃ </small> אֶ֭בֶן מָאֲס֣וּ הַבּוֹנִ֑ים הָ֝יְתָ֗ה לְרֹ֣אשׁ פִּנָּֽה׃ <small>אֶ֭בֶן מָאֲס֣וּ הַבּוֹנִ֑ים הָ֝יְתָ֗ה לְרֹ֣אשׁ פִּנָּֽה׃</small> מֵאֵ֣ת יְ֭הֹוָה הָ֣יְתָה זֹּ֑את הִ֖יא נִפְלָ֣את בְּעֵינֵֽינוּ׃ <small>מֵאֵ֣ת יְ֭הֹוָה הָ֣יְתָה זֹּ֑את הִ֖יא נִפְלָ֣את בְּעֵינֵֽינוּ׃</small> זֶה־הַ֭יּוֹם עָשָׂ֣ה יְהֹוָ֑ה נָגִ֖ילָה וְנִשְׂמְחָ֣ה בֽוֹ׃ <small>זֶה־הַ֭יּוֹם עָשָׂ֣ה יְהֹוָ֑ה נָגִ֖ילָה וְנִשְׂמְחָ֣ה בֽוֹ׃</small>"));
    hl.push(p("<b>אָנָּא</b> יְ֭הֹוָה הוֹשִׁ֘יעָ֥ה נָּ֑א, אָנָּ֣א יְ֭הֹוָה הוֹשִׁ֘יעָ֥ה נָּ֑א"));
    hl.push(p("<b>אָנָּ֥א</b> יְ֝הֹוָ֗ה הַצְלִ֘יחָ֥ה נָֽא, אָנָּ֥א יְ֝הֹוָ֗ה הַצְלִ֘יחָ֥ה נָֽא׃ "));
    hl.push(p("<b>בָּר֣וּךְ</b> הַ֭בָּא בְּשֵׁ֣ם יְהֹוָ֑ה בֵּ֝רַ֥כְנוּכֶ֗ם מִבֵּ֥ית יְהֹוָֽה׃ <small>בָּר֣וּךְ הַ֭בָּא בְּשֵׁ֣ם יְהֹוָ֑ה בֵּ֝רַ֥כְנוּכֶ֗ם מִבֵּ֥ית יְהֹוָֽה׃</small> אֵ֤ל ׀ יְהֹוָה֮ וַיָּ֢אֶ֫ר לָ֥נוּ אִסְרוּ־חַ֥ג בַּעֲבֹתִ֑ים עַד־קַ֝רְנ֗וֹת הַמִּזְבֵּֽחַ׃ <small>אֵ֤ל ׀ יְהֹוָה֮ וַיָּ֢אֶ֫ר לָ֥נוּ אִסְרוּ־חַ֥ג בַּעֲבֹתִ֑ים עַד־קַ֝רְנ֗וֹת הַמִּזְבֵּֽחַ׃</small> אֵלִ֣י אַתָּ֣ה וְאוֹדֶ֑ךָּ אֱ֝לֹהַ֗י אֲרוֹמְמֶֽךָּ׃ <small>אֵלִ֣י אַתָּ֣ה וְאוֹדֶ֑ךָּ אֱ֝לֹהַ֗י אֲרוֹמְמֶֽךָּ׃</small> הוֹד֣וּ לַיהֹוָ֣ה כִּי־ט֑וֹב כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃ <small> הוֹד֣וּ לַיהֹוָ֣ה כִּי־ט֑וֹב כִּ֖י לְעוֹלָ֣ם חַסְדּֽוֹ׃</small>"));
    if (isFullHallel) {
      hl.push(p("<small><b>יְהַלְלוּךָ</b> יְהֹוָה אֱלֹהֵינוּ כָּל מַעֲשֶׂיךָ, וַחֲסִידֶיךָ וְצַדִּיקִים עוֹשֵׂי רְצוֹנֶךָ וְעַמְּךָ בֵּית יִשְׂרָאֵל, כֻּלָּם בְּרִנָּה יוֹדוּ וִיבָרְכוּ וִישַׁבְּחוּ וִיפָאֲרוּ אֶת שֵׁם כְּבוֹדֶךָ, כִּי לְךָ טוֹב לְהוֹדוֹת, וּלְשִׁמְךָ נָעִים לְזַמֵּר. וּמֵעוֹלָם וְעַד עוֹלָם אַתָּה אֵל. בָּרוּךְ אַתָּה יְהֹוָה, מֶלֶךְ מְהֻלָּל בַּתִּשְׁבָּחוֹת. אָמֵן: </small>"));
    }
    hl.push(p("<small>ואומר החזן קדיש תתקבל, ובחנוכה אומר רק חצי קדיש:</small>"));
    hl.push(p("<small><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. <small>[אָמֵן]</small> בְּעָלְמָא דִּי בְרָא, כִּרְעוּתֵה, וְיַמְלִיךְ מַלְכוּתֵה, וְיַצְמַח פֻּרְקָנֵה, וִיקָרֵב מְשִׁיחֵהּ. <small>[אָמֵן]</small> בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small> יְהֵא שְׁמֵיהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא יִתְבָּרַךְ. וְיִשְׁתַּבַּח. וְיִתְפָּאַר. וְיִתְרוֹמַם. וְיִתְנַשֵּׂא. וְיִתְהַדָּר. וְיִתְעַלֶּה. וְיִתְהַלָּל שְׁמֵהּ דְּקֻדְשָׁא, בְּרִיךְ הוּא. <small>[אָמֵן]</small> לְעֵלָּא מִן כָּל בִּרְכָתָא שִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְמָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
    hl.push(p("<small><b>תִּתְקַבַּל</b> צְלוֹתָֽנָא וּבָֽעוּתָֽנָא, עִם צְלֽוֹתְהוֹן וּבָעֽוּתְהוֹן דְּכָל־בֵּית יִשְׂרָאֵל, קֳדָם אֲבוּנָא דְּבִשְׁמַיָּא וְאַרְעָא, וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small> "));
    hl.push(p("<small><b>יְהֵא</b> שְׁלָמָא רַבָּא מִן שְׁמַיָּא. חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה. וְשֵׁיזָבָא וּרְפוּאָה וּגְאוּלָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה לָנוּ וּלְכָל עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small> "));
    hl.push(p("<small>יפסע שלש פסיעות לאחור<br><b>עוֹשֶׂה</b> שָׁלוֹם בִּמְרוֹמָיו. הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל־עַמּוֹ יִשְׂרָאֵל. וְאִמְרוּ אָמֵן. <small>[אָמֵן]</small></small>"));
    parts.push(sup(hl.join('')));
  }

  return {
    html: '<div class="prayer-richtext">' + parts.join("") + "</div>",
    sourceLabel: "מאגר פנימי",
    sourceUrl: "",
  };
}


function buildShacharitAshkenazPayload(context) {
  function p(t) { return "<p>" + t + "</p>"; }
  function sup(html) { return '<div class="prayer-supplement">' + html + "</div>"; }
  var hr = '<hr class="prayer-divider">';

  var d = context.displayDate || new Date();
  var dow = d.getDay();
  var mon = d.getMonth();
  var isMonThu = (dow === 1 || dow === 4);
  var isTachanunDay = !context.isRoshChodesh && !context.isChanukah &&
    !context.isPurim && !context.isPesach && !context.isShavuot &&
    !context.isSukkot && !context.isRoshHaShana && !context.isYomKippur &&
    !context.isShabbat;
  var isHallelDay = context.isRoshChodesh || context.isChanukah ||
    context.isPesach || context.isShavuot || context.isSukkot;
  var isFullHallel = isHallelDay && !context.isRoshChodesh;
  var isTorahReadingDay = isMonThu || context.isShabbat || context.isRoshChodesh ||
    context.isPesach || context.isShavuot || context.isSukkot ||
    context.isRoshHaShana || context.isYomKippur;
  var parts = [];

  // ─── מודה אני ───
  parts.push(p("<big><b>מוֹדֶה אֲנִי</b></big>"));
  parts.push(p("<b>מוֹדֶה אֲנִי</b> לְפָנֶֽיךָ מֶֽלֶךְ חַי וְקַיָּם שֶׁהֶחֱזַֽרְתָּ בִּי נִשְׁמָתִי בְּחֶמְלָה, רַבָּה אֱמוּנָתֶֽךָ: <b>רֵאשִׁית חָכְמָה</b> יִרְאַת יְהֹוָה, שֵֽׂכֶל טוֹב לְכָל־עֹשֵׂיהֶם, תְּהִלָּתוֹ עוֹמֶֽדֶת לָעַד: בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:"));
  parts.push(hr);

  // ─── ברכות השחר ───
  parts.push(p("<big><b>בִּרְכּוֹת הַשַּׁחַר</b></big>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָתַן לַשֶּֽׂכְוִי בִינָה לְהַבְחִין בֵּין יוֹם וּבֵין לָֽיְלָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי גּוֹי: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי עָֽבֶד: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי אִשָּׁה: (<small>נשים אומרות:</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁעָשַֽׂנִי כִּרְצוֹנוֹ:) <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם פּוֹקֵֽחַ עִוְרִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם מַלְבִּישׁ עֲרֻמִּים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם מַתִּיר אֲסוּרִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם זוֹקֵף כְּפוּפִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם רוֹקַע הָאָֽרֶץ עַל הַמָּֽיִם: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁעָשָׂה לִי כָּל־צָרְכִּי: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַמֵּכִין מִצְעֲדֵי גָֽבֶר: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַנּוֹתֵן לַיָּעֵף כֹּֽחַ: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַמַּעֲבִיר שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי: וִיהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתַּרְגִּילֵֽנוּ בְּתוֹרָתֶֽךָ וְדַבְּ֒קֵֽנוּ בְּמִצְוֹתֶֽיךָ, וְאַל תְּבִיאֵֽנוּ לֹא לִידֵי חֵטְא וְלֹא לִידֵי עֲבֵרָה וְעָוֹן וְלֹא לִידֵי נִסָּיוֹן וְלֹא לִידֵי בִזָּיוֹן וְאַל יִשְׁלֹט בָּֽנוּ יֵֽצֶר הָרָע וְהַרְחִיקֵֽנוּ מֵאָדָם רָע וּמֵחָבֵר רָע וְדַבְּ֒קֵֽנוּ בְּיֵֽצֶר הַטּוֹב וּבְמַעֲשִׂים טוֹבִים וְכוֹף אֶת־יִצְרֵֽנוּ לְהִשְׁתַּעְבֶּד־לָךְ וּתְנֵֽנוּ הַיּוֹם וּבְכָל־יוֹם לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים בְּעֵינֶֽיךָ וּבְעֵינֵי כָל־רוֹאֵֽינוּ וְתִגְמְ֒לֵֽנוּ חֲסָדִים טוֹבִים: בָּרוּךְ אַתָּה יְהֹוָה גּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי שֶׁתַּצִּילֵֽנִי הַיּוֹם וּבְכָל־יוֹם מֵעַזֵּי פָנִים וּמֵעַזּוּת פָּנִים מֵאָדָם רָע וּמֵחָבֵר רָע וּמִשָּׁכֵן רָע וּמִפֶּֽגַע רָע וּמִשָּׂטָן הַמַּשְׁחִית מִדִּין קָשֶׁה וּמִבַּֽעַל דִּין קָשֶׁה, בֵּין שֶׁהוּא בֶן בְּרִית וּבֵין שֶׁאֵינוֹ בֶן בְּרִית:"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לַעֲסֹק בְּדִבְרֵי תוֹרָה: וְהַעֲרֶב נָא יְהֹוָה אֱלֹהֵֽינוּ אֶת־דִּבְרֵי תוֹרָתְךָ בְּפִֽינוּ וּבְפִי עַמְּךָ בֵּית יִשְׂרָאֵל. וְנִהְיֶה אֲנַֽחְנוּ וְצֶאֱצָאֵֽינוּ וְצֶאֱצָאֵי עַמְּךָ בֵּית יִשְׂרָאֵל כֻּלָּֽנוּ יוֹדְעֵי שְׁמֶֽךָ וְלוֹמְדֵי תוֹרָתֶֽךָ. (<small>י\"א</small> תוֹרָתְךָ) לִשְׁמָהּ. בָּרוּךְ אַתָּה יְהֹוָה הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל. <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר בָּֽחַר בָּֽנוּ מִכָּל הָעַמִּים וְנָֽתַן לָֽנוּ אֶת־תּוֹרָתוֹ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה:"));
  parts.push(hr);

  // ─── טלית ───
  parts.push(p("<big><b>הַלְבָּשַׁת טַלִּית</b></big>"));
  parts.push(p("<b>בָּרְ֒כִי נַפְשִׁי</b> אֶת־יְהֹוָה, יְהֹוָה אֱלֹהַי גָּדַֽלְתָּ מְאֹד, הוֹד וְהָדָר לָבָֽשְׁתָּ: עֹֽטֶה־אוֹר כַּשַּׂלְמָה, נוֹטֶה שָׁמַֽיִם כַּיְרִיעָה: לְשֵׁם יִחוּד קוּדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּהּ בִּדְחִילוּ וּרְחִימוּ לְיַחֵד שֵׁם י\"ה בו\"ה בְּיִחוּדָא שְׁלִים בְּשֵׁם כָּל־יִשְׂרָאֵל הֲרֵינִי מִתְעַטֵּף גּוּפִי בַּצִּיצִית כֵּן תִּתְעַטֵּף נִשְׁמָתִי וּרְמַ\"ח אֵיבָרַי וּשְׁסָ\"ה גִידַי בְּאוֹר הַצִּיצִית הָעוֹלֶה תַּרְיַ\"ג. וּכְשֵׁם שֶׁאֲנִי מִתְכַּסֶּה בַּטַּלִּית בָּעוֹלָם הַזֶּה כַּךְ אֶזְכֶּה לַחֲלוּקָא דְרַבָּנָן וּלְטַלִּית נָאָה לָעוֹלָם הַבָּא בְּגַן עֵֽדֶן. וְעַל יְדֵי מִצְוַת צִיצִית תִּנָּצֵל נַפְשִׁי רוּחִי וְנִשְׁמָתִי וּתְפִלָּתִי מִן הַחִיצוֹנִים וְהַטַּלִּית יִפְרֹשׂ כְּנָפָיו עֲלֵיהֶם וְיַצִּילֵם כְּנֶֽשֶׁר יָעִיר קִנּוֹ עַל גּוֹזָלָיו יְרַחֵף. וּתְהֵא חֲשׁוּבָה מִצְוַת צִיצִית לִפְנֵי הַקָּדוֹשׁ בָּרוּךְ הוּא כְּאִלּוּ קִיַּמְתִּֽיהָ בְּכָל פְּרָטֶֽיהָ וְדִקְדּוּקֶֽיהָ וְכַוָּנוֹתֶֽיהָ וְתַרְיַ\"ג מִצְווֹת הַתְּ֒לוּיִם בָּהּ אָמֵן סֶֽלָה: <small>בשעה שמניח אותו על ראשו להתעטף בו, יאמר:</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהִתְעַטֵּף בַּצִּיצִית: מַה־יָּקָר חַסְדְּ֒ךָ אֱלֹהִים וּבְנֵי אָדָם בְּצֵל כְּנָפֶֽיךָ יֶחֱסָֽיוּן: יִרְוְיֻן מִדֶּֽשֶׁן בֵּיתֶֽךָ וְנַֽחַל עֲדָנֶֽיךָ תַשְׁקֵם: כִּי־עִמְּ֒ךָ מְקוֹר חַיִּים, בְּאוֹרְ֒ךָ נִרְאֶה־אוֹר: מְשֹׁךְ חַסְדְּ֒ךָ לְיֹדְ֒עֶֽיךָ וְצִדְקָתְ֒ךָ לְיִשְׁרֵי־לֵב:"));
  parts.push(hr);

  // ─── תפילין ───
  parts.push(p("<big><b>הַנָּחַת תְּפִלִּין</b></big>"));
  parts.push(p("לְשֵׁם יִחוּד קוּדְשָׁא בְּרִיךְ הוּא וּשְׁכִינְתֵּהּ בִּדְחִילוּ וּרְחִימוּ, לְיַחֵד שֵׁם י\"ה בו\"ה בְּיִחוּדָא שְׁלִים בְּשֵׁם כָּל יִשְׂרָאֵל, הִנְנִי מְכַוֵּן בַּהֲנָחַת תְּפִלִּין לְקַיֵּם מִצְוַת בּוֹרְאִי שֶׁצִּוָּֽנוּ לְהָנִֽיחַ תְּפִלִּין כַּכָּתוּב בְּתוֹרָתוֹ וּקְשַׁרְתָּם לְאוֹת עַל־יָדֶֽךָ וְהָיוּ לְטֹטָפוֹת בֵּין עֵינֶֽיךָ וְהֵם אַרְבַּע פָּרָשִׁיּוֹת אֵֽלּוּ: שְׁמַע. וְהָיָה אִם־שָׁמֹֽעַ. קַדֶּשׁ־לִי. וְהָיָה כִּי־יְבִאֲךָ. שֶׁיֵּשׁ בָּהֶן יִחוּדוֹ וְאַחְדּוּתוֹ יִתְבָּרַךְ שְׁמוֹ בָּעוֹלָם וְשֶׁנִּזְכֹּר נִסִּים וְנִפְלָאוֹת שֶׁעָשָׂה עִמָּֽנוּ בְּהוֹצִיאָֽנוּ מִמִּצְרָֽיִם וַאֲשֶׁר־לוֹ הַכֹּֽחַ וְהַמֶּמְשָׁלָה בָּעֶלְיוֹנִים וּבַתַּחְתּוֹנִים לַעֲשׂוֹת בָּהֶם כִּרְצוֹנוֹ. וְצִוָּֽנוּ לְהָנִֽיחַ עַל־הַיָּד לְזִכְרוֹן זְרֽוֹעַ הַנְּ֒טוּיָה וְשֶׁהִיא נֶֽגֶד הַלֵּב לְשַׁעְבֵּד בָּזֶה תַּאֲווֹת וּמַחְשְׁבוֹת לִבֵּֽנוּ לַעֲבוֹדָתוֹ יִתְבָּרַךְ שְׁמוֹ. וְעַל־הָרֹאשׁ נֶֽגֶד הַמֹּֽחַ שֶׁהַנְּ֒שָׁמָה שֶׁבְּ֒מֹחִי עִם שְׁאָר חוּשַׁי וְכֹחוֹתַי כֻּלָּם יִהְיוּ מְשֻׁעְבָּדִים לַעֲבוֹדָתוֹ יִתְבָּרַךְ שְׁמוֹ. וּמִשֶּֽׁפַע מִצְוַת תְּפִלִּין יִתְמַשֵּׁךְ עָלַי לִהְיוֹת לִי חַיִּים אֲרֻכִּים וְשֶֽׁפַע קֹֽדֶשׁ וּמַחֲשָׁבוֹת קְדוֹשׁוֹת בְּלִי הִרְהוּר חֵטְא וְעָוֹן כְּלָל וְשֶׁלֹּא יְפַתֵּֽנוּ וְלֹא יִתְגָּרֶה־בָֽנוּ יֵֽצֶר הָרָע וְיַנִּיחֵֽנוּ לַעֲבֹד אֶת־יְיָ כַּאֲשֶׁר עִם־לְבָבֵֽנוּ. וִיהִי רָצוֹן לְפָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתְּהֵא חֲשׁוּבָה מִצְוַת הֲנָחַת תְּפִלִּין לִפְנֵי הַקָּדוֹשׁ בָּרוּךְ הוּא כְּאִלּוּ קִיַּמְתִּֽיהָ בְּכָל־פְּרָטֶֽיהָ וְדִקְדּוּקֶֽיהָ וְכַוָּנוֹתֶֽיהָ וְתַרְיַ\"ג מִצְוֹת הַתְּ֒לוּיוֹת בָּהּ אָמֵן סֶֽלָה: <small>יניח התפילין של יד על קיבורת ידו, וקודם שיהדק יברך:</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהָנִיחַ תְּפִלִּין: <small>ויכרוך שבע כריכות סביב זרועו, ואחר כך יניח של ראש בגובה ראשו כנגד בין עיניו, וקודם שמהדקן יברך:</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל מִצְוַת תְּפִלִּין: <small>ואחר שיהדק הרצועה על ראשו יאמר:</small> בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד: <b>וּמֵחָכְמָתְ֒ךָ</b> אֵל עֶלְיוֹן תַּאֲצִיל עָלַי וּמִבִּינָתְ֒ךָ תְּבִינֵֽנִי וּבְחַסְדְּ֒ךָ תַּגְדִּיל עָלַי וּבִגְבוּרָתְ֒ךָ תַּצְמִית אוֹיְ֒בַי וְקָמַי וְשֶׁמֶן הַטּוֹב תָּרִיק עַל שִׁבְעָה קְנֵי הַמְּ֒נוֹרָה לְהַשְׁפִּֽיעַ טוּבְ֒ךָ לִבְרִיּוֹתֶֽיךָ: פּוֹתֵחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: <small>ואח״כ כורך הרצועה של יד על אצבעו, ואומר:</small> <b>וְאֵרַשְׂתִּיךְ</b> לִי לְעוֹלָם, וְאֵרַשְׂתִּיךְ לִי בְּצֶֽדֶק וּבְמִשְׁפָּט וּבְחֶֽסֶד וּבְרַחֲמִים: וְאֵרַשְׂתִּיךְ לִי בֶּאֱמוּנָה, וְיָדַֽעַתְּ אֶת־יְהֹוָה: <small>אחר שיניח תפילין יאמר פרשיות 'קדש' 'והיה כי יביאך' כדי להשלים ד' פרשיות בכל יום:</small> <b>וַיְדַבֵּר</b> יְהֹוָה אֶל־משֶׁה לֵּאמֹר: קַדֶּשׁ־לִי כָל־בְּכוֹר פֶּֽטֶר כָּל־רֶֽחֶם בִּבְנֵי יִשְׂרָאֵל בָּאָדָם וּבַבְּ֒הֵמָה לִי הוּא: וַיֹּֽאמֶר משֶׁה אֶל־הָעָם זָכוֹר אֶת־הַיּוֹם הַזֶּה אֲשֶׁר יְצָאתֶם מִמִּצְרַֽיִם מִבֵּית עֲבָדִים כִּי בְּחֹֽזֶק יָד הוֹצִיא יְהֹוָה אֶתְכֶם מִזֶּה וְלֹא יֵאָכֵל חָמֵץ: הַיּוֹם אַתֶּם יֹצְ֒אִים בְּחֹֽדֶשׁ הָאָבִיב: וְהָיָה כִי־יְבִיאֲךָ יְהֹוָה אֶל־אֶֽרֶץ הַכְּ֒נַעֲנִי וְהַחִתִּי וְהָאֱמֹרִי וְהַחִוִּי וְהַיְבוּסִי אֲשֶׁר נִשְׁבַּע לַאֲבֹתֶֽיךָ לָֽתֶת לָךְ אֶֽרֶץ זָבַת חָלָב וּדְבָשׁ וְעָבַדְתָּ אֶת־הָעֲבֹדָה הַזֹּאת בַּחֹֽדֶשׁ הַזֶּה: שִׁבְעַת יָמִים תֹּאכַל מַצֹּת וּבַיּוֹם הַשְּׁ֒בִיעִי חַג לַיהוָֹה: מַצּוֹת יֵאָכֵל אֵת שִׁבְעַת הַיָּמִים וְלֹא־יֵרָאֶה לְךָ חָמֵץ וְלֹא־יֵרָאֶה לְךָ שְׂאֹר בְּכָל־גְּבֻלֶֽךָ: וְהִגַּדְתָּ לְבִנְךָ בַּיּוֹם הַהוּא לֵאמֹר בַּֽעֲבוּר זֶה עָשָׂה יְהֹוָה לִי בְּצֵאתִי מִמִּצְרָֽיִם: וְהָיָה לְךָ לְאוֹת עַל־יָדְ֒ךָ וּלְזִכָּרוֹן בֵּין עֵינֶֽיךָ לְמַֽעַן תִּֽהְיֶה תּוֹרַת יְהֹוָה בְּפִֽיךָ כִּי בְּיָד חֲזָקָה הוֹצִאֲךָ יְהֹוָה מִמִּצְרָֽיִם: וְשָׁמַרְתָּ אֶת־הַחֻקָּה הַזֹּאת לְמוֹעֲדָהּ מִיָּמִים יָמִֽימָה: <b>וְהָיָה כִּי־יְבִאֲךָ</b> יְהֹוָה אֶל־אֶֽרֶץ הַכְּ֒נַעֲנִי כַּאֲשֶׁר נִשְׁבַּע לְךָ וְלַאֲבֹתֶֽיךָ וּנְתָנָהּ לָךְ: וְהַעֲבַרְתָּ כָל־פֶּֽטֶר־רֶֽחֶם לַֽיהוָֹה וְכָל פֶּֽטֶר שֶֽׁגֶר בְּהֵמָה אֲשֶׁר יִהְיֶה לְךָ הַזְּ֒כָרִים לַיהוָֹה: וְכָל־פֶּֽטֶר חֲמֹר תִּפְדֶּה בְשֶׂה וְאִם־לֹא תִפְדֶּה וַעֲרַפְתּוֹ וְכֹל בְּכוֹר אָדָם בְּבָנֶֽיךָ תִּפְדֶּה: וְהָיָה כִּי־יִשְׁאָלְ֒ךָ בִנְךָ מָחָר לֵאמֹר מַה־זֹּאת וְאָמַרְתָּ אֵלָיו בְּחֹֽזֶק יָד הוֹצִיאָֽנוּ יְהֹוָה מִמִּצְרַֽיִם מִבֵּית עֲבָדִים: וַיְהִי כִּי־הִקְשָׁה פַרְעֹה לְשַׁלְּ֒חֵנוּ וַיַּהֲרֹג יְהֹוָה כָּל־בְּכוֹר בְּאֶֽרֶץ מִצְרַֽיִם מִבְּֽ֒כֹר אָדָם וְעַד־בְּכוֹר בְּהֵמָה עַל־כֵּן אֲנִי זֹבֵֽחַ לַֽיהוָֹה כָּל־פֶּֽטֶר רֶֽחֶם הַזְּ֒כָרִים וְכָל־בְּכוֹר בָּנַי אֶפְדֶּה: וְהָיָה לְאוֹת עַל־יָדְ֒כָה וּלְטוֹטָפֹת בֵּין עֵינֶֽיךָ כִּי בְּחֹֽזֶק יָד הוֹצִיאָֽנוּ יְהֹוָה מִמִּצְרָֽיִם:"));
  parts.push(hr);

  // ─── מה טובו / אדון עולם ───
  parts.push(p("<big><b>מַה טֹּבוּ</b></big>"));
  parts.push(p("<b>מַה־טֹּֽבוּ</b> אֹהָלֶֽיךָ יַעֲקֹב מִשְׁכְּ֒נֹתֶֽיךָ יִשְׂרָאֵל: וַאֲנִי בְּרֹב חַסְדְּ֒ךָ אָבוֹא בֵיתֶֽךָ אֶשְׁתַּחֲוֶה אֶל־הֵיכַל־קָדְשְׁ֒ךָ בְּיִרְאָתֶֽךָ: יְהֹוָה אָהַֽבְתִּי מְעוֹן בֵּיתֶֽךָ וּמְקוֹם מִשְׁכַּן כְּבוֹדֶֽךָ: וַאֲנִי אֶשְׁתַּחֲוֶה וְאֶכְרָֽעָה אֶבְרְ֒כָה לִפְנֵי יְהֹוָה עֹשִׂי: וַאֲנִי תְפִלָּתִי־לְךָ יְהֹוָה עֵת רָצוֹן אֱלֹהִים בְּרָב־חַסְדֶּֽךָ עֲנֵֽנִי בֶּאֱמֶת יִשְׁעֶֽךָ:"));
  parts.push(p("<big><b>אֲדוֹן עוֹלָם</b></big>"));
  parts.push(p("<b>אֲדוֹן עוֹלָם</b> אֲשֶׁר מָלַךְ, בְּטֶֽרֶם כָּל יְצִיר נִבְרָא: לְעֵת נַעֲשָׂה בְחֶפְצוֹ כֹּל, אֲזַי מֶֽלֶךְ שְׁמוֹ נִקְרָא: וְאַחֲרֵי כִּכְלוֹת הַכֹּל, לְבַדּוֹ יִמְלֹךְ נוֹרָא: וְהוּא הָיָה וְהוּא הֹוֶה, וְהוּא יִהְיֶה בְּתִפְאָרָה: וְהוּא אֶחָד וְאֵין שֵׁנִי, לְהַמְשִׁיל לוֹ לְהַחְבִּֽירָה: בְּלִי רֵאשִׁית בְּלִי תַכְלִית, וְלוֹ הָעֹז וְהַמִּשְׂרָה: וְהוּא אֵלִי וְחַי גּוֹאֲלִי, וְצוּר חֶבְלִי בְּעֵת צָרָה: וְהוּא נִסִּי וּמָנוֹס לִי, מְנָת כּוֹסִי בְּיוֹם אֶקְרָא: בְּיָדוֹ אַפְקִיד רוּחִי, בְּעֵת אִישַׁן וְאָעִֽירָה: וְעִם רוּחִי גְּוִיָּתִי, יְהֹוָה לִי וְלֹא אִירָא:"));
  parts.push(hr);

  // ─── קרבנות ───
  parts.push(p("<big><b>פָּרָשַׁת הַקָּרְבָּנוֹת</b></big>"));
  parts.push(p("<small>יש שאין אומרים 'יהי רצון' בשבת ויום טוב</small> <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁתְּ֒רַחֵם עָלֵֽינוּ וְתִמְחָל לָֽנוּ עַל כָּל חַטֹּאתֵֽינוּ וּתְכַפֶּר לָֽנוּ אֶת כָּל עֲוֹנוֹתֵֽינוּ וְתִסְלַח לָֽנוּ עַל־כָּל פְּשָׁעֵֽינוּ וְשֶׁתִּבְנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵֽינוּ וְנַקְרִיב לְפָנֶֽיךָ קָרְבַּן הַתָּמִיד שֶׁיְּ֒כַפֵּר בַּעֲדֵֽנוּ כְּמוֹ שֶׁכָּתַֽבְתָּ עָלֵֽינוּ בְּתוֹרָתֶֽךָ, עַל יְדֵי משֶׁה עַבְדֶּֽךָ, מִפִּי כְבוֹדֶֽךָ כָּאָמוּר: <b>וַיְדַבֵּר</b> יְהֹוָה אֶל־משֶׁה לֵּאמֹר: צַו אֶת־בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם אֶת־קָרְבָּנִי לַחְמִי לְאִשַּׁי רֵֽיחַ נִיחֹחִי תִּשְׁמְ֒רוּ לְהַקְרִיב לִי בְּמוֹעֲדוֹ: וְאָמַרְתָּ לָהֶם זֶה הָאִשֶּׁה אֲשֶׁר תַּקְרִֽיבוּ לַיהוָֹה כְּבָשִׂים בְּנֵי־שָׁנָה תְמִימִם שְׁנַֽיִם לַיּוֹם עֹלָה תָמִיד: אֶת־הַכֶּֽבֶשׂ אֶחָד תַּעֲשֶׂה בַבֹּֽקֶר וְאֵת הַכֶּֽבֶשׂ הַשֵּׁנִי תַּעֲשֶׂה בֵּין הָעַרְבָּֽיִם: וַֽעֲשִׂירִית הָאֵיפָה סֹֽלֶת לְמִנְחָה בְּלוּלָה בְּשֶֽׁמֶן כָּתִית רְבִיעִת הַהִין: עֹלַת תָּמִיד הָעֲשֻׂיָה בְּהַר סִינַי לְרֵֽיחַ נִיחֹֽחַ אִשֶּׁה לַיהוָֹה: וְנִסְכּוֹ רְבִיעִת הַהִין לַכֶּֽבֶשׂ הָאֶחָד בַּקֹּֽדֶשׁ הַסֵּךְ נֶֽסֶךְ שֵׁכָר לַיהוָֹה: וְאֵת הַכֶּֽבֶשׂ הַשֵּׁנִי תַּעֲשֶׂה בֵּין הָעַרְבָּֽיִם כְּמִנְחַת הַבֹּֽקֶר וּכְנִסְכּוֹ תַּעֲשֶׂה אִשֵּׁה רֵֽיחַ נִיחֹֽחַ לַיהוָֹה: <b>וְשָׁחַט</b> אֹתוֹ עַל יֶֽרֶךְ הַמִּזְבֵּֽחַ צָפֹֽנָה לִפְנֵי יְהֹוָה וְזָרְ֒קוּ בְּנֵי אַהֲרֹן הַכֹּהֲנִים אֶת־דָּמוֹ עַל־הַמִּזְבֵּֽחַ סָבִיב: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתְּ֒הֵא אֲמִירָה זוּ חֲשׁוּבָה וּמְקֻבֶּֽלֶת וּמְרֻצָּה לְפָנֶֽיךָ כְּאִלּוּ הִקְרַֽבְנוּ קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ וּבִמְקוֹמוֹ וּכְהִלְכָתוֹ:"));
  parts.push(p("<b>אַתָּה הוּא</b> יְהֹוָה אֱלֹהֵֽינוּ שֶׁהִקְטִֽירוּ אֲבוֹתֵֽינוּ לְפָנֶֽיךָ אֶת קְטֹֽרֶת הַסַּמִּים בִּזְמַן שֶׁבֵּית הַמִּקְדָּשׁ הָיָה קַיָּם כַּאֲשֶׁר צִוִּיתָ אוֹתָם עַל יְדֵי משֶׁה נְבִיאֶֽךָ כַּכָּתוּב בְּתוֹרָתֶֽךָ: <b>וַיֹּֽאמֶר</b> יְהֹוָה אֶל־משֶׁה קַח־לְךָ סַמִּים נָטָף וּשְׁחֵֽלֶת וְחֶלְבְּ֒נָה סַמִּים וּלְבֹנָה זַכָּה בַּד בְּבַד יִהְיֶה: וְעָשִֽׂיתָ אֹתָהּ קְטֹֽרֶת רֹֽקַח מַעֲשֵׂה רוֹקֵֽחַ מְמֻלָּח טָהוֹר קֹֽדֶשׁ: וְשָׁחַקְתָּ מִמֶּֽנָּה הָדֵק וְנָתַתָּה מִמֶּֽנָּה לִפְנֵי הָעֵדֻת בְּאֹֽהֶל מוֹעֵד אֲשֶׁר אִוָּעֵד לְךָ שָֽׁמָּה קֹֽדֶשׁ קָדָשִׁים תִּהְיֶה לָכֶם: וְנֶאֱמַר: <b>וְהִקְטִיר</b> עָלָיו אַהֲרֹן קְטֹֽרֶת סַמִּים בַּבֹּֽקֶר בַּבֹּֽקֶר בְּהֵיטִיבוֹ אֶת־הַנֵּרֹת יַקְטִירֶֽנָּה: וּבְהַעֲלֹת אַהֲרֹן אֶת־הַנֵּרֹת בֵּין הָֽעַרְבַּֽיִם יַקְטִירֶֽנָּה קְטֹֽרֶת תָּמִיד לִפְנֵי יְהֹוָה לְדֹרֹתֵיכֶם: <b>תָּנוּ רַבָּנָן</b> פִּטּוּם הַקְּ֒טֹֽרֶת כֵּיצַד שְׁלֹש מֵאוֹת וְשִׁשִּׁים וּשְׁמוֹנָה מָנִים הָיוּ בָהּ, שְׁלֹש מֵאוֹת וְשִׁשִּׁים וַחֲמִשָּׁה כְּמִנְיַן יְמוֹת הַחַמָּה מָנֶה לְכָל יוֹם, פְּרַס בַּשַּׁחֲרִית וּפְרַס בֵּין הָעַרְבָּֽיִם, וּשְׁלשָׁה מָנִים יְתֵרִים שֶׁמֵּהֶם מַכְנִיס כֹּהֵן גָּדוֹל מְלֹא חָפְנָיו בְּיוֹם הַכִּפּוּרִים, וּמַחֲזִירָן לְמַכְתֶּֽשֶׁת בְּעֶֽרֶב יוֹם הַכִּפּוּרִים, וְשׁוֹחֲקָן יָפֶה יָפֶה כְּדֵי שֶׁתְּ֒הֵא דַקָּה מִן הַדַּקָּה, וְאַחַד עָשָׂר סַמָּנִים הָֽיוּ בָהּ, וְאֵֽלּוּ הֵן: הַצֳּרִי וְהַצִּפֹּֽרֶן הַחֶלְבְּ֒נָה וְהַלְּ֒בוֹנָה מִשְׁקַל שִׁבְעִים שִׁבְעִים מָנֶה, מוֹר וּקְצִיעָה שִׁבֹּֽלֶת נֵרְדְּ וְכַרְכֹּם מִשְׁקַל שִׁשָּׁה עָשָׂר שִׁשָּׁה עָשָׂר מָנֶה, הַקּשְׁטְ שְׁנֵים עָשָׂר וְקִלּוּפָה שְׁלשָׁה וְקִנָּמוֹן תִּשְׁעָה, בֹּרִית כַּרְשִׁינָה תִּשְׁעָה קַבִּין, יֵין קַפְרִיסִין סְאִין תְּלָתָא וְקַבִּין תְּלָתָא, וְאִם אֵין לוֹ יֵין קַפְרִיסִין מֵבִיא חֲמַר חִוַּרְיָן עַתִּיק, מֶֽלַח סְדוֹמִית רֹֽבַע הַקָּב, מַעֲלֶה עָשָׁן כָּל שֶׁהוּא, רַבִּי נָתָן הַבַּבְלִי אוֹמֵר אַף כִּפַּת הַיַּרְדֵּן כָּל שֶׁהוּא, וְאִם נָֽתַן בָּהּ דְּבַשׁ פְּסָלָהּ וְאִם חִסַּר אַחַת מִכָּל־סַמָּנֶֽיהָ חַיָּב מִיתָה: <b>רַבָּן</b> שִׁמְעוֹן בֶּן גַּמְלִיאֵל אוֹמֵר הַצֳּרִי אֵינוֹ אֶלָּא שְׂרָף הַנּוֹטֵף מֵעֲצֵי הַקְּ֒טָף, בֹּרִית כַּרְשִׁינָה לָמָּה הִיא בָֽאָה כְּדֵי לְיַפּוֹת בָּהּ אֶת הַצִּפֹּרֶן כְּדֵי שֶׁתְּ֒הֵא נָאָה. יֵין קַפְרִיסִין לָמָּה הוּא בָא כְּדֵי לִשְׁרוֹת בּוֹ אֶת הַצִפֹּרֶן כְּדֵי שֶׁתְּ֒הֵא עַזָּה. וַהֲלֹא מֵי רַגְלַֽיִם יָפִין לָהּ אֶלָּא שֶׁאֵין מַכְנִיסִין מֵי רַגְלַֽיִם בַּמִּקְדָּשׁ מִפְּ֒נֵי הַכָּבוֹד: <b>תַּנְיָא</b> רַבִּי נָתָן אוֹמֵר כְּשֶׁהוּא שׁוֹחֵק אוֹמֵר הָדֵק הֵיטֵב הֵיטֵב הָדֵק מִפְּ֒נֵי שֶׁהַקּוֹל יָפֶה לַבְּ֒שָׂמִים, פִּטְּ֒מָהּ לַחֲצָאִין כְּשֵׁרָה לִשְׁלִישׁ וְלִרְבִֽיעַ לֹא שָׁמַֽעְנוּ: אָמַר רַבִּי יְהוּדָה זֶה הַכְּ֒לָל אִם כְּמִדָּתָהּ כְּשֵׁרָה לַחֲצָאִין וְאִם חִסַּר אַחַת מִכָּל סַמָּנֶֽיהָ חַיָּב מִיתָה: <b>תַּנְיָא</b> בַּר קַפָּרָא אוֹמֵר אַחַת לְשִׁשִּׁים אוֹ לְשִׁבְעִים שָׁנָה הָיְ֒תָה בָאָה שֶׁל שִׁירַֽיִם לַחֲצָאִין: וְעוֹד תָּנֵי בַּר קַפָּרָא אִלּוּ הָיָה נוֹתֵן בָּהּ קוֹרְ֒טוֹב שֶׁל דְּבַשׁ אֵין אָדָם יָכוֹל לַעֲמֹד מִפְּ֒נֵי רֵיחָהּ וְלָֽמָּה אֵין מְעָרְ֒בִין בָּהּ דְּבַשׁ מִפְּ֒נֵי שֶׁהַתּוֹרָה אָמְ֒רָה כִּי כָל־שְׂאֹר וְכָל־דְּבַשׁ לֹא־תַקְטִֽירוּ מִמֶּֽנּוּ אִשֶּׁה לַיהוָֹה: <small>ג\"פ:</small> יְהֹוָה צְבָאוֹת עִמָּֽנוּ מִשְׂגַּב־לָֽנוּ אֱלֹהֵי יַעֲקֹב סֶֽלָה: <small>ג\"פ:</small> יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: <small>ג\"פ:</small> יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: אַתָּה סֵֽתֶר לִי מִצַּר תִּצְּ֒רֵֽנִי רָנֵּי פַלֵּט תְּסוֹבְ֒בֵֽנִי סֶֽלָה: וְעָרְ֒בָה לַיהוָֹה מִנְחַת יְהוּדָה וִירוּשָׁלָֽםִ כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמֹנִיּוֹת:"));
  parts.push(hr);

  // ─── פסוקי דזמרה ───
  parts.push(p("<big><b>פְּסוּקֵי דְזִמְרָה</b></big>"));
  parts.push(p("<small>ברוך שאמר צריך לאומרו בניגון ובנעימה כי הוא שיר נאה ונחמד. וכתב בספר היכלות שיש בו פ\"ז תיבות וסי' ראשו כתם פז (טור או\"ח נא)</small> <b>בָּרוּךְ שֶׁאָמַר</b> וְהָיָה הָעוֹלָם. בָּרוּךְ הוּא. בָּרוּךְ עוֹשֶׂה בְרֵאשִׁית. בָּרוּךְ אוֹמֵר וְעוֹשֶׂה. בָּרוּךְ גּוֹזֵר וּמְקַיֵּם. בָּרוּךְ מְרַחֵם עַל־הָאָֽרֶץ. בָּרוּךְ מְרַחֵם עַל־הַבְּ֒רִיּוֹת. בָּרוּךְ מְשַׁלֵּם שָׂכָר טוֹב לִירֵאָיו. בָּרוּךְ חַי לָעַד וְקַיָּם לָנֶֽצַח. בָּרוּךְ פּוֹדֶה וּמַצִּיל. בָּרוּךְ שְׁמוֹ. בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הָאֵל הָאָב הָרַחֲמָן הַמְ֒הֻלָּל בְּפִי עַמּוֹ מְשֻׁבָּח וּמְפֹאָר בִּלְשׁוֹן חֲסִידָיו וַעֲבָדָיו וּבְשִׁירֵי דָוִד עַבְדֶּֽךָ. נְהַלֶּלְךָ יְהֹוָה אֱלֹהֵֽינוּ בִּשְׁבָחוֹת וּבִזְמִירוֹת נְגַדֶּלְךָ וּנְשַׁבֵּחֲךָ וּנְפָאֶרְךָ וְנַזְכִּיר שִׁמְךָ וְנַמְלִיכְ֒ךָ מַלְכֵּֽנוּ אֱלֹהֵֽינוּ. יָחִיד חֵי הָעוֹלָמִים. מֶֽלֶךְ מְשֻׁבָּח וּמְפֹאָר עֲדֵי־עַד שְׁמוֹ הַגָּדוֹל. בָּרוּךְ אַתָּה יְהֹוָה מֶֽלֶךְ מְהֻלָּל בַּתִּשְׁבָּחוֹת:"));
  parts.push(p("<b>הוֹדוּ</b> לַיהוָֹה קִרְאוּ בִשְׁמוֹ הוֹדִֽיעוּ בָעַמִּים עֲלִילֹתָיו: שִֽׁירוּ לוֹ זַמְּ֒רוּ־לוֹ שִֽׂיחוּ בְּכָל־נִפְלְ֒אוֹתָיו: הִתְהַלְּ֒לוּ בְּשֵׁם קָדְשׁוֹ יִשְׂמַח לֵב מְבַקְשֵׁי יְהֹוָה: דִּרְשׁוּ יְהֹוָה וְעֻזּוֹ בַּקְּ֒שׁוּ פָנָיו תָּמִיד: זִכְרוּ נִפְלְ֒אֹתָיו אֲשֶׁר עָשָׂה מֹפְ֒תָיו וּמִשְׁפְּ֒טֵי־פִֽיהוּ: זֶֽרַע יִשְׂרָאֵל עַבְדּוֹ בְּנֵי יַעֲקֹב בְּחִירָיו: הוּא יְהֹוָה אֱלֹהֵֽינוּ בְּכָל־הָאָֽרֶץ מִשְׁפָּטָיו: זִכְרוּ לְעוֹלָם בְּרִיתוֹ דָּבָר צִוָּה לְאֶֽלֶף דּוֹר: אֲשֶׁר כָּרַת אֶת־אַבְרָהָם וּשְׁבוּעָתוֹ לְיִצְחָק: וַיַּעֲמִידֶֽהָ לְיַעֲקֹב לְחֹק לְיִשְׂרָאֵל בְּרִית עוֹלָם: לֵאמֹר לְךָ אֶתֵּן אֶֽרֶץ־כְּנָעַן חֶֽבֶל נַחֲלַתְכֶם: בִּהְיוֹתְ֒כֶם מְתֵי מִסְפָּר כִּמְעַט וְגָרִים בָּהּ: וַיִּתְהַלְּ֒כוּ מִגּוֹי אֶל־גּוֹי וּמִמַּמְלָכָה אֶל־עַם אַחֵר: לֹא־הִנִּֽיחַ לְאִישׁ לְעָשְׁקָם וַיּֽוֹכַח עֲלֵיהֶם מְלָכִים: אַל־תִּגְּ֒עוּ בִּמְשִׁיחָי וּבִנְבִיאַי אַל־תָּרֵֽעוּ: שִֽׁירוּ לַיהוָֹה כָּל־הָאָֽרֶץ בַּשְּׂ֒רוּ מִיּוֹם־אֶל־יוֹם יְשׁוּעָתוֹ: סַפְּ֒רוּ בַגּוֹיִם אֶת־כְּבוֹדוֹ בְּכָל־הָעַמִּים נִפְלְאֹתָיו: כִּי גָדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְנוֹרָא הוּא עַל־כָּל־אֱלֹהִים: כִּי כָּל־אֱלֹהֵי הָעַמִּים אֱלִילִים וַיהוָֹה שָׁמַֽיִם עָשָׂה: <b>הוֹד וְהָדָר</b> לְפָנָיו עֹז וְחֶדְוָה בִּמְקֹמוֹ: הָבוּ לַיהוָֹה מִשְׁפְּ֒חוֹת עַמִּים הָבוּ לַיהוָֹה כָּבוֹד וָעֹז: הָבוּ לַיהוָֹה כְּבוֹד שְׁמוֹ שְׂאוּ מִנְחָה וּבֹֽאוּ לְפָנָיו הִשְׁתַּחֲווּ לַיהוָֹה בְּהַדְרַת־קֹֽדֶשׁ: חִֽילוּ מִלְּ֒פָנָיו כָּל־הָאָֽרֶץ אַף־תִּכּוֹן תֵּבֵל בַּל־תִּמּוֹט: יִשְׂמְחוּ הַשָּׁמַֽיִם וְתָגֵל הָאָֽרֶץ וְיֹאמְ֒רוּ בַגּוֹיִם יְהֹוָה מָלָךְ: יִרְעַם הַיָּם וּמְלוֹאוֹ יַעֲלֹץ הַשָּׂדֶה וְכָל־אֲשֶׁר־בּוֹ: אָז יְרַנְּ֒נוּ עֲצֵי הַיָּעַר מִלִּפְנֵי יְהֹוָה כִּי־בָא לִשְׁפּוֹט אֶת־הָאָֽרֶץ: הוֹדוּ לַיהוָֹה כִּי טוֹב כִּי לְעוֹלָם חַסְדּוֹ: וְאִמְרוּ הוֹשִׁיעֵֽנוּ אֱלֹהֵי יִשְׁעֵֽנוּ וְקַבְּ֒צֵֽנוּ וְהַצִּילֵֽנוּ מִן־הַגּוֹיִם לְהוֹדוֹת לְשֵׁם קָדְשֶֽׁךָ לְהִשְׁתַּבֵּֽחַ בִּתְהִלָּתֶֽךָ: בָּרוּךְ יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל מִן־הָעוֹלָם וְעַד הָעֹלָם וַיֹּאמְ֒רוּ כָל־הָעָם אָמֵן וְהַלֵּל לַיהוָֹה: רוֹמְ֒מוּ יְהֹוָה אֱלֹהֵֽינוּ וְהִשְׁתַּחֲווּ לַהֲדֹם רַגְלָיו קָדוֹשׁ הוּא: רוֹמְ֒מוּ יְהֹוָה אֱלֹהֵֽינוּ וְהִשְׁתַּחֲווּ לְהַר קָדְשׁוֹ כִּי קָדוֹשׁ יְהֹוָה אֱלֹהֵֽינוּ: <b>וְהוּא רַחוּם</b> יְכַפֵּר עָוֹן וְלֹא־יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֹא־יָעִיר כָּל־חֲמָתוֹ: אַתָּה יְהֹוָה לֹא־תִכְלָא רַחֲמֶֽיךָ מִמֶּֽנִּי חַסְדְּ֒ךָ וַאֲמִתְּ֒ךָ תָּמִיד יִצְּ֒רֽוּנִי: זְכֹר רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: תְּנוּ עֹז לֵאלֹהִים עַל־יִשְׂרָאֵל גַּאֲוָתוֹ וְעֻזּוֹ בַּשְּׁ֒חָקִים: נוֹרָא אֱלֹהִים מִמִּקְדָּשֶֽׁיךָ אֵל יִשְׂרָאֵל הוּא נֹתֵן עֹז וְתַעֲצֻמוֹת לָעָם בָּרוּךְ אֱלֹהִים: אֵל־נְקָמוֹת יְהֹוָה אֵל נְקָמוֹת הוֹפִֽיעַ: הִנָּשֵׂא שֹׁפֵט הָאָֽרֶץ הָשֵׁב גְּמוּל עַל־גֵּאִים: לַיהוָֹה הַיְשׁוּעָה עַל־עַמְּ֒ךָ בִרְכָתֶֽךָ סֶּֽלָה: יְהֹוָה צְבָאוֹת עִמָּנוּ מִשְׂגָּב לָֽנוּ אֱלֹהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: <b>הוֹשִֽׁיעָה</b> אֶת־עַמֶּֽךָ וּבָרֵךְ אֶת־נַחֲלָתֶֽךָ וּרְעֵם וְנַשְּׂ֒אֵם עַד־הָעוֹלָם: נַפְשֵֽׁנוּ חִכְּ֒תָה לַיהוָֹה עֶזְרֵֽנוּ וּמָגִנֵּֽנוּ הוּא: כִּי־בוֹ יִשְׂמַח לִבֵּֽנוּ כִּי בְשֵׁם קָדְשׁוֹ בָטָֽחְנוּ: יְהִי־חַסְדְּ֒ךָ יְהֹוָה עָלֵֽינוּ כַּאֲשֶׁר יִחַֽלְנוּ לָךְ: הַרְאֵֽנוּ יְהֹוָה חַסְדֶּֽךָ וְיֶשְׁעֲךָ תִּֽתֶּן־לָֽנוּ: קֽוּמָה עֶזְרָֽתָה לָּנוּ וּפְדֵֽנוּ לְמַֽעַן חַסְדֶּֽךָ: אָנֹכִי יְהֹוָה אֱלֹהֶֽיךָ הַמַּעַלְךָ מֵאֶֽרֶץ מִצְרָֽיִם הַרְחֶב־פִּֽיךָ וַאֲמַלְאֵֽהוּ: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֹהָיו: וַאֲנִי בְּחַסְדְּ֒ךָ בָטַֽחְתִּי יָגֵל לִבִּי בִּישׁוּעָתֶֽךָ אָשִֽׁירָה לַיהוָֹה כִּי גָמַל עָלָי:"));
  parts.push(p("<small>מזמור לתודה יש לאומרו בנגינה שכל השירות עתידות ליבטל חוץ ממזמור לתודה (ראה ויק\"ר ט,ז). ואין אומרים מזמור לתודה בשבת ויו\"ט, או בימי פסח שאין תודה קריבה בהם משום חמץ, ולא בערב פסח.</small> <b>מִזְמוֹר לְתוֹדָה</b> הָרִֽיעוּ לַיהוָֹה כָּל־הָאָֽרֶץ: עִבְדוּ אֶת יְהֹוָה בְּשִׂמְחָה בֹּֽאוּ לְפָנָיו בִּרְנָנָה: דְּעוּ כִּי־יְהֹוָה הוּא אֱלֹהִים הוּא עָשָֽׂנוּ וְלוֹ (וְלֹא) אֲנַֽחְנוּ עַמּוֹ וְצֹאן מַרְעִיתוֹ: בֹּֽאוּ שְׁעָרָיו בְּתוֹדָה חֲצֵרֹתָיו בִּתְהִלָּה הֽוֹדוּ לוֹ בָּרְ֒כוּ שְׁמוֹ: כִּי־טוֹב יְהֹוָה לְעוֹלָם חַסְדּוֹ וְעַד־דֹּר וָדֹר אֱמוּנָתוֹ:"));
  parts.push(p("<small>צריך לכוין בתהלה לדוד דא\"ר אלעזר כל האומר תהלה לדוד בכל יום ג\"פ מובטח לו שהוא בן העולם הבא. ויותר יכוין בפסוק פותח את ידך, שעיקר מה שקבעוהו לומר בכל יום הוא בשביל אותו פסוק, שמזכיר בו שבחו של הקב\"ה שמשגיח על בריותיו ומפרנסן. ונהגו לומר קודם לכן אשרי יושבי ביתך משום דילפינן מיניה שצריך אדם לישב שעה אחת קודם שיתפלל. ואחריו נהגו לומר ואנחנו נברך יה (טור, אורח חיים נ\"א)</small> <b>אַשְׁרֵי</b> יוֹשְׁ֒בֵי בֵיתֶֽךָ עוֹד יְהַלְלֽוּךָ סֶּֽלָה: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֹהָיו: תְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּֽלֶךְ וַאֲבָרְ֒כָה שִׁמְךָ לְעוֹלָם וָעֶד: בְּכָל־יוֹם אֲבָרְ֒כֶֽךָּ וַאֲהַלְלָה שִׁמְךָ לְעוֹלָם וָעֶד: גָּדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְלִגְדֻלָּתוֹ אֵין חֵֽקֶר: דּוֹר לְדוֹר יְשַׁבַּח מַעֲשֶׂיךָ וּגְבוּרֹתֶֽיךָ יַגִּֽידוּ: הֲדַר כְּבוֹד הוֹדֶֽךָ וְדִבְרֵי נִפְלְ֒אֹתֶֽיךָ אָשִֽׂיחָה: וֶעֱזוּז נוֹרְ֒אֹתֶֽיךָ יֹאמֵרוּ וּגְדֻלָּתְ֒ךָ אֲסַפְּ֒רֶֽנָּה: זֵֽכֶר רַב־טוּבְ֒ךָ יַבִּֽיעוּ וְצִדְקָתְ֒ךָ יְרַנֵּֽנוּ: חַנּוּן וְרַחוּם יְהֹוָה אֶֽרֶךְ אַפַּֽיִם וּגְדָל־חָֽסֶד: טוֹב־יְהֹוָה לַכֹּל וְרַחֲמָיו עַל־כָּל־מַעֲשָׂיו: יוֹדֽוּךָ יְהֹוָה כָּל־מַעֲשֶֽׂיךָ וַחֲסִידֶֽיךָ יְבָרְ֒כֽוּכָה: כְּבוֹד מַלְכוּתְ֒ךָ יֹאמֵרוּ וּגְבוּרָתְ֒ךָ יְדַבֵּֽרוּ: לְהוֹדִֽיעַ לִבְנֵי הָאָדָם גְּבוּרֹתָיו וּכְבוֹד הֲדַר מַלְכוּתוֹ: מַלְכוּתְ֒ךָ מַלְכוּת כָּל־עֹלָמִים וּמֶמְשַׁלְתְּ֒ךָ בְּכָל־דּוֹר וָדֹר: סוֹמֵךְ יְהֹוָה לְכָל־הַנֹּפְ֒לִים וְזוֹקֵף לְכָל־הַכְּ֒פוּפִים: עֵינֵי־כֹל אֵלֶֽיךָ יְשַׂבֵּֽרוּ וְאַתָּה נוֹתֵן־לָהֶם אֶת־אָכְלָם בְּעִתּוֹ: פּוֹתֵֽחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: צַדִּיק יְהֹוָה בְּכָל־דְּרָכָיו וְחָסִיד בְּכָל־מַעֲשָׂיו: קָרוֹב יְהֹוָה לְכָל־קֹרְ֒אָיו לְכֹל אֲשֶׁר יִקְרָאֻֽהוּ בֶאֱמֶת: רְצוֹן־יְרֵאָיו יַעֲשֶׂה וְאֶת־שַׁוְעָתָם יִשְׁמַע וְיוֹשִׁיעֵם: שׁוֹמֵר יְהֹוָה אֶת־כָּל־אֹהֲבָיו וְאֵת כָּל־הָרְ֒שָׁעִים יַשְׁמִיד: תְּהִלַּת יְהֹוָה יְדַבֶּר פִּי וִיבָרֵךְ כָּל־בָּשָׂר שֵׁם קָדְשׁוֹ לְעוֹלָם וָעֶד: וַאֲנַֽחְנוּ נְבָרֵךְ יָהּ מֵעַתָּה וְעַד־עוֹלָם הַלְ֒לוּיָהּ:"));
  parts.push(p("<b>הַלְ֒לוּיָהּ</b> הַלְ֒לִי נַפְשִׁי אֶת־יְהֹוָה: אֲהַלְלָה יְהֹוָה בְּחַיָּי אֲזַמְּ֒רָה לֵאלֹהַי בְּעוֹדִי: אַל־תִּבְטְחוּ בִנְדִיבִים בְּבֶן־אָדָם שֶׁאֵין לוֹ תְשׁוּעָה: תֵּצֵא רוּחוֹ יָשֻׁב לְאַדְמָתוֹ בַּיּוֹם הַהוּא אָבְ֒דוּ עֶשְׁתֹּנֹתָיו: אַשְׁרֵי שֶׁאֵל יַעֲקֹב בְּעֶזְרוֹ, שִׂבְרוֹ עַל־יְהֹוָה אֱלֹהָיו: עֹשֶׂה שָׁמַֽיִם וָאָֽרֶץ אֶת־הַיָּם וְאֶת־כָּל־אֲשֶׁר־בָּם, הַשֹּׁמֵר אֱמֶת לְעוֹלָם: עֹשֶׂה מִשְׁפָּט לַעֲשׁוּקִים נֹתֵן לֶֽחֶם לָרְ֒עֵבִים יְהֹוָה מַתִּיר אֲסוּרִים: יְהֹוָה פֹּקֵֽחַ עִוְרִים יְהֹוָה זֹקֵף כְּפוּפִים יְהֹוָה אֹהֵב צַדִּיקִים: יְהֹוָה שֹׁמֵר אֶת־גֵּרִים יָתוֹם וְאַלְמָנָה יְעוֹדֵד וְדֶֽרֶךְ רְשָׁעִים יְעַוֵּת: יִמְלֹךְ יְהֹוָה לְעוֹלָם אֱלֹהַֽיִךְ צִיּוֹן לְדֹר וָדֹר הַלְ֒לוּיָהּ:"));
  parts.push(p("<b>הַלְ֒לוּיָהּ</b> כִּי־טוֹב זַמְּ֒רָה אֱלֹהֵֽינוּ, כִּי־נָעִים נָאוָה תְהִלָּה: בּוֹנֵה יְרוּשָׁלַֽםִ יְהֹוָה נִדְחֵי יִשְׂרָאֵל יְכַנֵּס: הָרוֹפֵא לִשְׁבֽוּרֵי לֵב וּמְחַבֵּשׁ לְעַצְּ֒בוֹתָם: מוֹנֶה מִסְפָּר לַכּוֹכָבִים לְכֻלָּם שֵׁמוֹת יִקְרָא: גָּדוֹל אֲדוֹנֵֽינוּ וְרַב־כֹּֽחַ לִתְבוּנָתוֹ אֵין מִסְפָּר: מְעוֹדֵד עֲנָוִים יְהֹוָה מַשְׁפִּיל רְשָׁעִים עֲדֵי־אָֽרֶץ: עֱנוּ לַיהוָֹה בְּתוֹדָה זַמְּ֒רוּ לֵאלֹהֵֽינוּ בְכִנּוֹר: הַמְכַסֶּה שָׁמַֽיִם בְּעָבִים הַמֵּכִין לָאָֽרֶץ מָטָר הַמַּצְמִֽיחַ הָרִים חָצִיר: נוֹתֵן לִבְהֵמָה לַחְמָהּ לִבְנֵי עֹרֵב אֲשֶׁר יִקְרָֽאוּ: לֹא בִגְבוּרַת הַסּוּס יֶחְפָּץ לֹא בְשׁוֹקֵי הָאִישׁ יִרְצֶה: רוֹצֶה יְהֹוָה אֶת־יְרֵאָיו אֶת־הַמְיַחֲלִים לְחַסְדּוֹ: שַׁבְּ֒חִי יְרוּשָׁלַֽםִ אֶת יְהֹוָה הַלְ֒לִי אֱלֹהַֽיִךְ צִיּוֹן: כִּי־חִזַּק בְּרִיחֵי שְׁעָרָֽיִךְ בֵּרַךְ בָּנַֽיִךְ בְּקִרְבֵּךְ: הַשָּׂם־גְּבוּלֵךְ שָׁלוֹם חֵֽלֶב חִטִּים יַשְׂבִּיעֵךְ: הַשֹּׁלֵֽחַ אִמְרָתוֹ אָֽרֶץ עַד־מְהֵרָה יָרוּץ דְּבָרוֹ: הַנֹּתֵן שֶֽׁלֶג כַּצָּֽמֶר כְּפוֹר כָּאֵֽפֶר יְפַזֵּר: מַשְׁלִיךְ קַרְחוֹ כְפִתִּים לִפְנֵי קָרָתוֹ מִי יַעֲמֹד: יִשְׁלַח דְּבָרוֹ וְיַמְסֵם יַשֵּׁב רוּחוֹ יִזְּ֒לוּ־מָֽיִם: מַגִּיד דְּבָרָיו לְיַעֲקֹב חֻקָּיו וּמִשְׁפָּטָיו לְיִשְׂרָאֵל: לֹא עָֽשָׂה כֵן לְכָל־גּוֹי וּמִשְׁפָּטִים בַּל־יְדָעוּם הַלְ֒לוּיָהּ:"));
  parts.push(p("<b>הַלְ֒לוּיָהּ</b> הַלְ֒לוּ אֶת־יְהֹוָה מִן הַשָּׁמַֽיִם הַלְ֒לֽוּהוּ בַּמְּ֒רוֹמִים: הַלְ֒לֽוּהוּ כָּל־מַלְאָכָיו הַלְ֒לֽוּהוּ כָּל־צְבָאָיו: הַלְ֒לֽוּהוּ שֶֽׁמֶשׁ וְיָרֵֽחַ הַלְ֒לֽוּהוּ כָּל־כּֽוֹכְ֒בֵי אוֹר: הַלְ֒לֽוּהוּ שְׁמֵי הַשָּׁמָֽיִם וְהַמַּֽיִם אֲשֶׁר מֵעַל הַשָּׁמָֽיִם: יְהַלְ֒לוּ אֶת־שֵׁם יְהֹוָה כִּי הוּא צִוָּה וְנִבְרָֽאוּ: וַיַּעֲמִידֵם לָעַד לְעוֹלָם חָק־נָתַן וְלֹא יַעֲבוֹר: הַלְ֒לוּ אֶת־יְהֹוָה מִן־הָאָֽרֶץ תַּנִּינִים וְכָל־תְּהֹמוֹת: אֵשׁ וּבָרָד שֶֽׁלֶג וְקִיטוֹר רֽוּחַ סְעָרָה עֹשָׂה דְבָרוֹ: הֶהָרִים וְכָל־גְּבָעוֹת עֵץ פְּרִי וְכָל־אֲרָזִים: הַחַיָּה וְכָל־בְּהֵמָה רֶֽמֶשׂ וְצִפּוֹר כָּנָף: מַלְכֵי־אֶֽרֶץ וְכָל־לְאֻמִּים שָׂרִים וְכָל־שֹׁפְטֵי אָֽרֶץ: בַּחוּרִים וְגַם־בְּתוּלוֹת זְקֵנִים עִם־נְעָרִים: יְהַלְ֒לוּ אֶת־שֵׁם יְהֹוָה כִּי־נִשְׂגָּב שְׁמוֹ לְבַדּוֹ הוֹדוֹ עַל־אֶֽרֶץ וְשָׁמָֽיִם: וַיָּֽרֶם קֶֽרֶן לְעַמּוֹ תְּהִלָּה לְכָל־חֲסִידָיו לִבְנֵי יִשְׂרָאֵל עַם קְרֹבוֹ הַלְ֒לוּיָהּ:"));
  parts.push(p("<b>הַלְ֒לוּיָהּ</b> שִֽׁירוּ לַיהוָֹה שִׁיר חָדָשׁ תְּהִלָּתוֹ בִּקְהַל חֲסִידִים: יִשְׂמַח יִשְׂרָאֵל בְּעֹשָׂיו בְּנֵי־צִיּוֹן יָגִֽילוּ בְמַלְכָּם: יְהַלְ֒לוּ שְׁמוֹ בְמָחוֹל בְּתֹף וְכִנּוֹר יְזַמְּ֒רוּ־לוֹ: כִּי־רוֹצֶה יְהֹוָה בְּעַמּוֹ יְפָאֵר עֲנָוִים בִּישׁוּעָה: יַעְלְזוּ חֲסִידִים בְּכָבוֹד יְרַנְּנוּ עַל־מִשְׁכְּבוֹתָם: רוֹמְ֒מוֹת אֵל בִּגְרוֹנָם וְחֶֽרֶב פִּיפִיּוֹת בְּיָדָם: לַעֲשׂוֹת נְקָמָה בַגּוֹיִם תּוֹכֵחוֹת בַּלְאֻמִּים: לֶאְסֹר מַלְכֵיהֶם בְּזִקִּים וְנִכְבְּדֵיהֶם בְּכַבְלֵי בַרְזֶל: לַעֲשׂוֹת בָּהֶם מִשְׁפָּט כָּתוּב הָדָר הוּא לְכָל־חֲסִידָיו הַלְ֒לוּיָהּ:"));
  parts.push(p("<b>הַלְ֒לוּיָהּ</b> הַֽלְ֒לוּ־אֵל בְּקָדְשׁוֹ הַלְ֒לֽוּהוּ בִּרְקִֽיעַ עֻזּוֹ: הַלְ֒לֽוּהוּ בִּגְבוּרֹתָיו הַלְ֒לֽוּהוּ כְּרֹב גֻּדְלוֹ: הַלְ֒לֽוּהוּ בְּתֵֽקַע שׁוֹפָר הַלְ֒לֽוּהוּ בְּנֵֽבֶל וְכִנּוֹר: הַלְ֒לֽוּהוּ בְּתֹף וּמָחוֹל הַלְ֒לֽוּהוּ בְּמִנִּים וְעֻגָב: הַלְ֒לֽוּהוּ בְצִלְצְלֵי־שָֽׁמַע הַלְ֒לֽוּהוּ בְּצִלְצְלֵי תְרוּעָה: כֹּל הַנְּ֒שָׁמָה תְּהַלֵּל יָהּ הַלְ֒לוּיָהּ: כֹּל הַנְּ֒שָׁמָה תְּהַלֵּל יָהּ הַלְ֒לוּיָהּ:"));
  parts.push(p("<small>הטעם שנהגו לומר ויברך דוד ושירת הים לפי שכל אותם חמשה עשר לשונות של שבח הסדורין בברכת ישתבח דורש במכלתין מתוך שירת הים ומתוך פסוקים של ויברך דוד (אבודרהם).</small> <small>בויברך דויד יעמוד עד שיאמר אתה הוא ה' האלהים ועד בכלל</small> <b>וַיְבָֽרֶךְ דָּוִיד</b> אֶת־יְהֹוָה לְעֵינֵי כָּל־הַקָּהָל וַיֹּֽאמֶר דָּוִיד בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל אָבִֽינוּ, מֵעוֹלָם וְעַד־עוֹלָם: לְךָ יְהֹוָה הַגְּ֒דֻלָּה וְהַגְּ֒בוּרָה וְהַתִּפְאֶֽרֶת וְהַנֵּֽצַח וְהַהוֹד כִּי־כֹל בַּשָּׁמַֽיִם וּבָאָֽרֶץ לְךָ יְהֹוָה הַמַּמְלָכָה וְהַמִּתְנַשֵּׂא לְכֹל לְרֹאשׁ: וְהָעֽשֶׁר וְהַכָּבוֹד מִלְּ֒פָנֶֽיךָ וְאַתָּה מוֹשֵׁל בַּכֹּל, וּבְיָדְ֒ךָ כֹּֽחַ וּגְבוּרָה, וּבְיָדְ֒ךָ לְגַדֵּל וּלְחַזֵּק לַכֹּל: וְעַתָּה אֱלֹהֵֽינוּ מוֹדִים אֲנַֽחְנוּ לָךְ וּמְהַלְלִים לְשֵׁם תִּפְאַרְתֶּֽךָ:"));
  parts.push(p("<small>תקנו לומר וישע ה' ביום ההוא ושירת הים והוא זכר ליציאת מצרים. וכופלין פסוק ה' ימלוך לעולם ועד מפני שהוא סוף השירה (אבודרהם). כל האומר שירת הים בשמחה ובעצמו שיער כאלו הוא ניצול מהים ופרעה וחילו הם נטבעו ואמר שירה מכפרים לו עונותיו (צפורן שמיר)</small> <b>וַיּֽוֹשַׁע יְהֹוָה</b> בַּיּוֹם הַהוּא אֶת־יִשְׂרָאֵל מִיַּד מִצְרָֽיִם וַיַּרְא יִשְׂרָאֵל אֶת־מִצְרַֽיִם מֵת עַל־שְׂפַת הַיָּם: וַיַּרְא יִשְׂרָאֵל אֶת־הַיָּד הַגְּ֒דֹלָה אֲשֶׁר עָשָׂה יְהֹוָה בְּמִצְרַֽיִם וַיִּירְ֒אוּ הָעָם אֶת יְהֹוָה וַיַּאֲמִֽינוּ בַּיהוָֹה וּבְמשֶׁה עַבְדּוֹ: <b>אָז יָשִׁיר</b>־משֶׁה וּבְנֵי יִשְׂרָאֵל אֶת־הַשִּׁירָה הַזֹּאת לַיהוָֹה וַיֹּאמְרוּ לֵאמֹר אָשִֽׁירָה לַיהוָֹה כִּי־גָאֹה גָּאָה סוּס וְרֹכְ֒בוֹ רָמָה בַיָּם: עָזִּי וְזִמְרָת יָהּ וַיְהִי־לִי לִישׁוּעָה זֶה אֵלִי וְאַנְוֵֽהוּ אֱלֹהֵי אָבִי וַאֲרֹמְ֒מֶֽנְהוּ: יְהֹוָה אִישׁ מִלְחָמָה יְהֹוָה שְׁמוֹ: מַרְכְּבֹת פַּרְעֹה וְחֵילוֹ יָרָה בַיָּם וּמִבְחַר שָׁלִשָׁיו טֻבְּ֒עוּ בְיַם־סוּף: תְּהֹמֹת יְכַסְיֻֽמוּ יָרְ֒דוּ בִמְצוֹלֹת כְּמוֹ־אָֽבֶן: יְמִינְ֒ךָ יְהֹוָה נֶאְדָּרִי בַּכֹּֽחַ יְמִֽינְ֒ךָ יְהֹוָה תִּרְעַץ אוֹיֵב: וּבְרֹב גְּאוֹנְ֒ךָ תַּהֲרֹס קָמֶֽיךָ תְּשַׁלַּח חֲרֹנְ֒ךָ יֹֽאכְ֒לֵמוֹ כַּקַּשׁ: וּבְרֽוּחַ אַפֶּֽיךָ נֶֽעֶרְמוּ מַֽיִם נִצְּ֒בוּ כְמוֹ־נֵד נֹזְ֒לִים קָפְ֒אוּ תְהֹמֹת בְּלֶב־יָם: אָמַר אוֹיֵב אֶרְדֹּף אַשִּׂיג אֲחַלֵּק שָׁלָל תִּמְלָאֵֽמוֹ נַפְשִׁי אָרִיק חַרְבִּי תּוֹרִישֵֽׁמוֹ יָדִי: נָשַֽׁפְתָּ בְרוּחֲךָ כִּסָּֽמוֹ יָם צָלֲלוּ כַּעוֹפֶֽרֶת בְּמַֽיִם אַדִּירִים: מִי־כָמֹֽכָה בָּאֵלִם יְהֹוָה מִי כָּמֹֽכָה נֶאְדָּר בַּקֹּֽדֶשׁ נוֹרָא תְהִלֹּת עֹֽשֵׂה־פֶֽלֶא: נָטִֽיתָ יְמִינְ֒ךָ תִּבְלָעֵֽמוֹ אָֽרֶץ: נָחִֽיתָ בְחַסְדְּ֒ךָ עַם־זוּ גָּאָֽלְתָּ נֵהַֽלְתָּ בְעָזְּ֒ךָ אֶל־נְוֵה קָדְשֶֽׁךָ: שָֽׁמְ֒עוּ עַמִּים יִרְגָּזוּן חִיל אָחַז ישְׁ֒בֵי פְּלָֽשֶׁת: אָז נִבְהֲלוּ אַלּוּפֵי אֱדוֹם אֵילֵי מוֹאָב יֹֽאחֲזֵֽמוֹ רָֽעַד נָמֹֽגוּ כֹּל ישְׁ֒בֵי כְנָֽעַן: תִּפֹּל עֲלֵיהֶם אֵימָֽתָה וָפַֽחַד בִּגְדֹל זְרוֹעֲךָ יִדְּ֒מוּ כָּאָֽבֶן עַד־יַֽעֲבֹר עַמְּ֒ךָ יְהֹוָה עַד־יַֽעֲבֹר עַם־זוּ קָנִֽיתָ: תְּבִאֵֽמוֹ וְתִטָּעֵֽמוֹ בְּהַר נַחֲלָתְ֒ךָ מָכוֹן לְשִׁבְתְּ֒ךָ פָּעַֽלְתָּ יְהֹוָה מִקְּ֒דָשׁ אֲדֹנָי כּוֹנְ֒נוּ יָדֶֽיךָ: יְהֹוָה יִמְלֹךְ לְעֹלָם וָעֶד: יְהֹוָה יִמְלֹךְ לְעֹלָם וָעֶד: יְהֹוָה מַלְכוּתֵהּ קָאֵים לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא: כִּי בָא סוּס פַּרְעֹה בְּרִכְבּוֹ וּבְפָרָשָׁיו בַּיָּם וַיָּֽשֶׁב יְהֹוָה עֲלֵהֶם אֶת־מֵי הַיָּם וּבְנֵי יִשְׂרָאֵל הָלְ֒כוּ בַיַּבָּשָׁה בְּתוֹךְ הַיָּֽם: כִּי לַיהוָֹה הַמְּ֒לוּכָה וּמשֵׁל בַּגּוֹיִם: וְעָלוּ מוֹשִׁעִים בְּהַר צִיּוֹן לִשְׁפֹּט אֶת־הַר עֵשָׂו, וְהָיְ֒תָה לַיהוָֹה הַמְּ֒לוּכָה: וְהָיָה יְהֹוָה לְמֶֽלֶךְ עַל־כָּל הָאָֽרֶץ בַּיּוֹם הַהוּא יִהְיֶה יְהֹוָה אֶחָד וּשְׁמוֹ אֶחָד:"));
  parts.push(p("<b>יִשְׁתַּבַּח</b> שִׁמְךָ לָעַד מַלְכֵּנוּ. הָאֵל הַמֶּֽלֶךְ הַגָּדוֹל וְהַקָּדוֹשׁ בַּשָּׁמַֽיִם וּבָאָֽרֶץ. כִּי לְךָ נָאֶה יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ. שִׁיר וּשְׁבָחָה הַלֵּל וְזִמְרָה. עֹז וּמֶמְשָׁלָה. נֶֽצַח גְּדֻלָּה וּגְבוּרָה. תְּהִלָּה וְתִפְאֶֽרֶת. קְדֻשָּׁה וּמַלְכוּת. בְּרָכוֹת וְהוֹדָאוֹת מֵעַתָּה וְעַד־עוֹלָם. בָּרוּךְ אַתָּה יְהֹוָה אֵל מֶֽלֶךְ גָּדוֹל בַּתִּשְׁבָּחוֹת. אֵל הַהוֹדָאוֹת אֲדוֹן הַנִּפְלָאוֹת הַבּוֹחֵר בְּשִׁירֵי זִמְרָה. מֶֽלֶךְ אֵל חֵי הָעוֹלָמִים."));
  parts.push(hr);

  // ─── קריאת שמע וברכותיה ───
  parts.push(p("<big><b>קְרִיאַת שְׁמַע וּבִרְכוֹתֶיהָ</b></big>"));
  parts.push(p("<small>המנהג הפשוט בכל תפוצות ישראל לומר ברכו לפני פריסת שמע. ואין לאומרו בפחות מעשרה שכל דבר שבקדושה אינו בפחות מעשרה (אבודרהם).</small> <small>ואומר שליח צבור:</small> <b>בָּרְ֒כוּ אֶת יְהֹוָה הַמְּ֒בֹרָךְ:</b> <small>ועונין הקהל:</small> <b>בָּרוּךְ</b> יְהֹוָה הַמְּ֒בֹרָךְ לְעוֹלָם וָעֶד: <small>אין להפסיק כלל בין ברכו ליוצר אור אפילו לדבר מצוה (לבוש).</small>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם יוֹצֵר אוֹר וּבוֹרֵא חֽשֶׁךְ עֹשֶׂה שָׁלוֹם וּבוֹרֵא אֶת־הַכֹּל: <b>הַמֵּאִיר לָאָֽרֶץ</b> וְלַדָּרִים עָלֶֽיהָ בְּרַחֲמִים וּבְטוּבוֹ מְחַדֵּשׁ בְּכָל־יוֹם תָּמִיד מַעֲשֵׂה בְרֵאשִׁית: מָה־רַבּוּ מַעֲשֶׂיךָ | יְהֹוָה כֻּלָּם בְּחָכְמָה עָשִׂיתָ מָלְ֒אָה הָאָרֶץ קִנְיָנֶֽךָ: הַמֶּֽלֶךְ הַמְ֒רוֹמָם לְבַדּוֹ מֵאָז. הַמְ֒שֻׁבָּח וְהַמְ֒פֹאָר וְהַמִּתְנַשֵּׂא מִימוֹת עוֹלָם: אֱלֹהֵי עוֹלָם בְּרַחֲמֶֽיךָ הָרַבִּים רַחֵם עָלֵֽינוּ אֲדוֹן עֻזֵּֽנוּ צוּר מִשְׂגַּבֵּֽנוּ מָגֵן יִשְׁעֵֽנוּ מִשְׂגָּב בַּעֲדֵֽנוּ: אֵל בָּרוּךְ גְּדוֹל דֵּעָה הֵכִין וּפָעַל זָהֳרֵי חַמָּה: טוֹב יָצַר כָּבוֹד לִשְׁמוֹ מְאוֹרוֹת נָתַן סְבִיבוֹת עֻזּוֹ: פִּנּוֹת צְבָאָיו קְדוֹשִׁים רוֹמְ֒מֵי שַׁדַּי תָּמִיד מְסַפְּרִים כְּבוֹד־אֵל וּקְדֻשָּׁתוֹ: תִּתְבָּרַךְ יְהֹוָה אֱלֹהֵֽינוּ עַל־שֶֽׁבַח מַעֲשֵׂה יָדֶֽיךָ וְעַל־מְאֽוֹרֵי אוֹר שֶׁעָשִֽׂיתָ יְפָאֲרֽוּךָ סֶּֽלָה: <b>תִּתְבָּרַךְ צוּרֵֽנוּ </b> מַלְכֵּֽנוּ וְגוֹאֲלֵֽנוּ בּוֹרֵא קְדוֹשִׁים. יִשְׁתַּבַּח שִׁמְךָ לָעַד מַלְכֵּֽנוּ יוֹצֵר מְשָׁרְ֒תִים. וַאֲשֶׁר מְשָׁרְ֒תָיו כֻּלָּם עוֹמְ֒דִים בְּרוּם עוֹלָם וּמַשְׁמִיעִים בְּיִרְאָה יַֽחַד בְּקוֹל דִּבְרֵי אֱלֹהִים חַיִּים וּמֶֽלֶךְ עוֹלָם. כֻּלָּם אֲהוּבִים. כֻּלָּם בְּרוּרִים. כֻּלָּם גִּבּוֹרִים. וְכֻלָּם עוֹשִׂים בְּאֵימָה וּבְיִרְאָה רְצוֹן קוֹנָם. וְכֻלָּם פּוֹתְ֒חִים אֶת־פִּיהֶם בִּקְדֻשָּׁה וּבְטָהֳרָה. בְּשִׁירָה וּבְזִמְרָה. וּמְבָרְ֒כִים וּמְשַׁבְּ֒חִים וּמְפָאֲרִים וּמַעֲרִיצִים וּמַקְדִּישִׁים וּמַמְלִיכִים: <b>אֶת שֵׁם</b> הָאֵל הַמֶּֽלֶךְ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא קָדוֹשׁ הוּא. וְכֻלָּם מְקַבְּ֒לִים עֲלֵיהֶם עֹל מַלְכוּת שָׁמַֽיִם זֶה מִזֶּה. וְנוֹתְ֒נִים רְשׁוּת זֶה לָזֶה לְהַקְדִּישׁ לְיוֹצְ֒רָם בְּנַֽחַת רֽוּחַ. בְּשָׂפָה בְרוּרָה וּבִנְעִימָה. קְדֻשָּׁה כֻּלָּם כְּאֶחָד עוֹנִים וְאוֹמְ֒רִים בְּיִרְאָה: <b>קָדוֹשׁ קָדוֹשׁ, קָדוֹשׁ יְהֹוָה צְבָאוֹת. מְלֹא כָל־הָאָֽרֶץ כְּבוֹדוֹ:</b> וְהָאוֹפַנִּים וְחַיּוֹת הַקֹּֽדֶשׁ בְּרַֽעַשׁ גָּדוֹל מִתְנַשְּׂ֒אִים לְעֻמַּת שְׂרָפִים לְעֻמָּתָם מְשַׁבְּ֒חִים וְאוֹמְ֒רִים: <b>בָּרוּךְ כְּבוֹד־יְהֹוָה מִמְּ֒קוֹמוֹ:</b> <b>לְאֵל</b> בָּרוּךְ נְעִימוֹת יִתֵּֽנוּ. לְמֶֽלֶךְ אֵל חַי וְקַיָּם זְמִרוֹת יֹאמֵֽרוּ וְתִשְׁבָּחוֹת יַשְׁמִֽיעוּ. כִּי הוּא לְבַדּוֹ פּוֹעֵל גְּבוּרוֹת. עוֹשֶׂה חֲדָשׁוֹת. בַּֽעַל מִלְחָמוֹת. זוֹרֵֽעַ צְדָקוֹת. מַצְמִֽיחַ יְשׁוּעוֹת. בּוֹרֵא רְפוּאוֹת. נוֹרָא תְהִלּוֹת. אֲדוֹן הַנִּפְלָאוֹת: הַמְ֒חַדֵּשׁ בְּטוּבוֹ בְּכָל־יוֹם תָּמִיד מַעֲשֵׂה בְרֵאשִׁית: כָּאָמוּר לְעֹשֵׂה אוֹרִים גְּדֹלִים כִּי לְעוֹלָם חַסְדּֽוֹ: אוֹר חָדָשׁ עַל־צִיּוֹן תָּאִיר וְנִזְכֶּה כֻלָּֽנוּ מְהֵרָה לְאוֹרוֹ: בָּרוּךְ אַתָּה יְהֹוָה יוֹצֵר הַמְּ֒אוֹרוֹת:"));
  parts.push(p("<b>אַהֲבָה רַבָּה</b> אֲהַבְתָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ חֶמְלָה גְדוֹלָה וִיתֵרָה חָמַֽלְתָּ עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ בַּעֲבוּר אֲבוֹתֵֽינוּ שֶׁבָּטְ֒חוּ בְךָ וַתְּ֒לַמְּ֒דֵם חֻקֵּי חַיִּים כֵּן תְּחָנֵּֽנוּ וּתְלַמְּ֒דֵֽנוּ: אָבִֽינוּ הָאָב הָרַחֲמָן הַמְ֒רַחֵם רַחֵם עָלֵֽינוּ וְתֵן בְּלִבֵּֽנוּ לְהָבִין וּלְהַשְׂכִּיל לִשְׁמֹֽעַ לִלְמֹד וּלְ֒לַמֵּד לִשְׁמֹר וְלַעֲשׂוֹת וּלְקַיֵּם אֶת־כָּל־דִּבְרֵי תַלְמוּד תּוֹרָתֶֽךָ בְּאַהֲבָה: וְהָאֵר עֵינֵֽינוּ בְּתוֹרָתֶֽךָ וְדַבֵּק לִבֵּֽנוּ בְּמִצְוֹתֶֽיךָ וְיַחֵד לְבָבֵֽנוּ לְאַהֲבָה וּלְיִרְאָה אֶת־שְׁמֶֽךָ: וְלֹא נֵבוֹשׁ לְעוֹלָם וָעֶד כִּי בְשֵׁם קָדְשְׁ֒ךָ הַגָּדוֹל וְהַנּוֹרָא בָּטָֽחְנוּ נָגִֽילָה וְנִשְׂמְ֒חָה בִּישׁוּעָתֶֽךָ: וַהֲבִיאֵֽנוּ לְשָׁלוֹם מֵאַרְבַּע כַּנְפוֹת הָאָֽרֶץ וְתוֹלִיכֵֽנוּ קוֹמְ֒מִיּוּת לְאַרְצֵֽנוּ: כִּי אֵל פּוֹעֵל יְשׁוּעוֹת אָֽתָּה וּבָֽנוּ בָחַֽרְתָּ מִכָּל־עַם וְלָשׁוֹן. וְקֵרַבְתָּֽנוּ לְשִׁמְךָ הַגָּדוֹל סֶֽלָה בֶּאֱמֶת לְהוֹדוֹת לְךָ וּלְיַחֶדְךָ בְּאַהֲבָה: בָּרוּךְ אַתָּה יְהֹוָה הַבּוֹחֵר בְּעַמּוֹ יִשְׂרָאֵל בְּאַהֲבָה:"));
  parts.push(p("<small>יחיד אומר</small> אֵל מֶֽלֶךְ נֶאֱמָן: <b>שְׁמַ<big>ע</big> יִשְׂרָאֵל יְהֹוָה אֱלֹהֵֽינוּ יְהֹוָה אֶחָ<big>ד</big>:</b> <small>יש להפסיק מעט בין אחד לברוך כי עיקר קבול עול מלכות שמים היא פסוק ראשון. ויאמר בלחש:</small> <small>בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:</small> <b>וְאָהַבְתָּ</b> אֵת יְהֹוָה אֱלֹהֶֽיךָ בְּכָל֯־לְ֯בָבְ֒ךָ וּבְכָל־נַפְשְׁ֒ךָ וּבְכָל־מְאֹדֶֽךָ: וְהָיוּ הַדְּ֒בָרִים הָאֵֽלֶּה אֲשֶׁר֯ אָ֯נֹכִי מְצַוְּ֒ךָ הַיּוֹם עַל֯־לְ֯בָבֶֽךָ: וְשִׁנַּנְתָּם לְבָנֶֽיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּ֒ךָ בְּבֵיתֶֽךָ וּבְלֶכְתְּ֒ךָ בַדֶּֽרֶךְ וּבְשָׁכְבְּ֒ךָ וּבְקוּמֶֽךָ: וּקְשַׁרְתָּם לְאוֹת עַל֯־יָ֯דֶֽךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶֽיךָ: וּכְתַבְתָּם עַל־מְזֻזוֹת בֵּיתֶֽךָ וּבִשְׁעָרֶֽיךָ: <b>וְהָיָה</b> אִם־שָׁמֹֽעַ תִּשְׁמְ֒עוּ אֶל־מִצְוֹתַי אֲשֶׁר֯ אָ֯נֹכִי מְצַוֶּה אֶתְכֶם הַיּוֹם לְאַהֲבָה אֶת־יְהֹוָה אֱלֹהֵיכֶם וּלְעָבְדוֹ בְּכָל֯־לְ֯בַבְכֶם וּבְכָל־נַפְשְׁ֒כֶם: וְנָתַתִּי מְטַר֯־אַ֯רְצְ֒כֶם בְּעִתּוֹ֯ י֯וֹרֶה וּמַלְקוֹשׁ וְאָסַפְתָּ דְגָנֶֽךָ וְתִירשְׁ֒ךָ וְיִצְהָרֶֽךָ: וְנָתַתִּי עֵֽשֶׂב֯ בְּ֯שָׂדְ֒ךָ לִבְהֶמְתֶּֽךָ וְאָכַלְתָּ וְשָׂבָֽעְתָּ: הִשָּׁמְ֒רוּ לָכֶם פֶּן֯־יִ֯פְתֶּה לְבַבְכֶם וְסַרְתֶּם וַעֲבַדְתֶּם אֱלֹהִים֯ אֲ֯חֵרִים וְהִשְׁתַּחֲוִיתֶם לָהֶם: וְחָרָה אַף־יְהֹוָה בָּכֶם וְעָצַר֯ אֶ֯ת־הַשָּׁמַֽיִם וְלֹא֯־יִ֯הְיֶה מָטָר וְהָאֲדָמָה לֹא תִתֵּן אֶת֯־יְ֯בוּלָהּ וַאֲבַדְתֶּם֯ מְ֯הֵרָה מֵעַל הָאָֽרֶץ הַטֹּבָה אֲשֶׁר֯ יְ֯הֹוָה נֹתֵן לָכֶם: וְשַׂמְתֶּם֯ אֶ֯ת־דְּבָרַי֯ אֵֽ֯לֶּה עַל֯־לְ֯בַבְכֶם וְעַל־נַפְשְׁ֒כֶם וּקְשַׁרְתֶּם֯ אֹ֯תָם לְאוֹת עַל֯־יֶ֯דְכֶם וְהָיוּ לְטוֹטָפֹת בֵּין עֵינֵיכֶם: וְלִמַּדְתֶּם֯ אֹ֯תָם אֶת־בְּנֵיכֶם לְדַבֵּר בָּם בְּשִׁבְתְּ֒ךָ בְּבֵיתֶֽךָ וּבְלֶכְתְּ֒ךָ בַדֶּֽרֶךְ וּבְשָׁכְבְּ֒ךָ וּבְקוּמֶֽךָ: וּכְתַבְתָּם עַל־מְזוּזוֹת בֵּיתֶֽךָ וּבִשְׁעָרֶֽיךָ: לְמַֽעַן֯ יִ֯רְבּוּ יְמֵיכֶם וִימֵי בְנֵיכֶם עַל הָאֲדָמָה אֲשֶׁר נִשְׁבַּע יְהֹוָה לַאֲבֹתֵיכֶם לָתֵת לָהֶם כִּימֵי הַשָּׁמַֽיִם עַל־הָאָֽרֶץ: <b>וַֽיֹּאמֶר֯</b> יְ֯הֹוָה֯ אֶ֯ל־משֶׁה לֵּאמֹר: דַּבֵּר֯ אֶ֯ל־בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם וְעָשׂוּ לָהֶם צִיצִת עַל־כַּנְפֵי בִגְ֒דֵיהֶם לְדֹרֹתָם וְנָתְ֒נוּ עַל־צִיצִת הַכָּנָף֯ פְּ֯תִיל תְּכֵֽלֶת: וְהָיָה לָכֶם לְצִיצִת וּרְאִיתֶם֯ אֹ֯תוֹ וּזְכַרְתֶּם֯ אֶ֯ת־כָּל־מִצְוֹת֯ יְ֯הֹוָה וַעֲשִׂיתֶם֯ אֹ֯תָם וְלֹא תָתֽוּרוּ אַחֲרֵי לְבַבְכֶם וְאַחֲרֵי עֵינֵיכֶם אֲשֶׁר֯־אַ֯תֶּם זֹנִים֯ אַ֯חֲרֵיהֶם: לְמַֽעַן תִּזְכְּ֒רוּ וַעֲשִׂיתֶם֯ אֶ֯ת־כָּל־מִצְוֹתָי וִהְיִיתֶם קְדשִׁים לֵאלֹהֵיכֶם: אֲנִי יְהֹוָה אֱלֹהֵיכֶם֯ אֲ֯שֶׁר הוֹצֵֽאתִי אֶתְכֶם֯ מֵ֯אֶֽרֶץ מִצְרַֽיִם לִהְיוֹת לָכֶם לֵאלֹהִים֯ אֲ֯נִי יְהֹוָה אֱלֹהֵיכֶם֯: <small>יש לצרף <b>אֱלֹהֵיכֶם</b> ל<b>אֱמֶת</b></small> אֱ֯מֶת <small>שליח ציבור:</small> <b>יְהֹוָה אֱלֹהֵיכֶם֯ אֱ֯מֶת:</b>"));
  parts.push(p("<small>כל שלא אמר אמת ויציב שחרית ואמת ואמונה ערבית לא יצא ידי חובתו שנאמר (תהלים צב ג) להגיד בבקר חסדך ואמונתך בלילות (ברכות יא:) ופירש\"י שברכת אמת ויציב כלה על חסד שעשה עם אבותינו שהוציאם ממצרים ובקע להם הים והעבירם.</small> <b>וְיַצִּיב</b> וְנָכוֹן וְקַיָּם וְיָשָׁר וְנֶאֱמָן וְאָהוּב וְחָבִיב וְנֶחְמָד וְנָעִים וְנוֹרָא וְאַדִּיר וּמְתֻקָּן וּמְקֻבָּל וְטוֹב וְיָפֶה הַדָּבָר הַזֶּה עָלֵֽינוּ לְעוֹלָם וָעֶד: אֱמֶת אֱלֹהֵי עוֹלָם מַלְכֵּֽנוּ צוּר יַעֲקֹב מָגֵן יִשְׁעֵֽנוּ, לְדֹר וָדֹר הוּא קַיָּם וּשְׁמוֹ קַיָּם וְכִסְאוֹ נָכוֹן וּמַלְכוּתוֹ וֶאֱמוּנָתוֹ לָעַד קַיָּֽמֶת: וּדְבָרָיו חָיִים וְקַיָּמִים נֶאֱמָנִים וְנֶחֱמָדִים לָעַד וּלְעוֹלְ֒מֵי עוֹלָמִים, עַל אֲבוֹתֵֽינוּ וְעָלֵֽינוּ עַל בָּנֵֽינוּ וְעַל דּוֹרוֹתֵֽינוּ וְעַל כָּל דּוֹרוֹת זֶֽרַע יִשְׂרָאֵל עֲבָדֶֽיךָ: <b>עַל־הָרִאשׁוֹנִים</b> וְעַל־הָאַחֲרוֹנִים דָּבָר טוֹב וְקַיָּם לְעוֹלָם וָעֶד אֱמֶת וֶאֱמוּנָה חֹק וְלֹא יַעֲבֹר: אֱמֶת שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ. מַלְכֵּֽנוּ מֶֽלֶךְ אֲבוֹתֵֽינוּ. גּוֹאֲלֵֽנוּ גּוֹאֵל אֲבוֹתֵֽינוּ. יוֹצְ֒רֵֽנוּ צוּר יְשׁוּעָתֵֽנוּ. פּוֹדֵֽנוּ וּמַצִּילֵֽנוּ מֵעוֹלָם שְׁמֶֽךָ. אֵין אֱלֹהִים זוּלָתֶֽךָ: <b>עֶזְרַת אֲבוֹתֵֽינוּ</b> אַתָּה הוּא מֵעוֹלָם מָגֵן וּמוֹשִֽׁיעַ לִבְנֵיהֶם אַחֲרֵיהֶם בְּכָל־דּוֹר וָדוֹר: בְּרוּם עוֹלָם מוֹשָׁבֶֽךָ וּמִשְׁפָּטֶֽיךָ וְצִדְקָתְ֒ךָ עַד־אַפְסֵי־אָֽרֶץ: אַשְׁרֵי אִישׁ שֶׁיִּשְׁמַע לְמִצְוֹתֶֽיךָ וְתוֹרָתְ֒ךָ וּדְבָרְ֒ךָ יָשִׂים עַל־לִבּוֹ: אֱמֶת אַתָּה הוּא אָדוֹן לְעַמֶּֽךָ וּמֶֽלֶךְ גִּבּוֹר לָרִיב רִיבָם: אֱמֶת אַתָּה הוּא רִאשׁוֹן וְאַתָּה הוּא אַחֲרוֹן וּמִבַּלְעָדֶֽיךָ אֵין לָֽנוּ מֶֽלֶךְ גּוֹאֵל וּמוֹשִֽׁיעַ: מִמִּצְרַֽיִם גְּאַלְתָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ וּמִבֵּית עֲבָדִים פְּדִיתָֽנוּ: כָּל־בְּכוֹרֵיהֶם הָרָֽגְתָּ וּבְכוֹרְ֒ךָ גָּאָֽלְתָּ וְיַם־סוּף בָּקַֽעְתָּ וְזֵדִים טִבַּֽעְתָּ וִידִידִים הֶעֱבַֽרְתָּ וַיְכַסּוּ־מַיִם צָרֵיהֶם אֶחָד מֵהֶם לֹא נוֹתָֽר: עַל־זֹאת שִׁבְּ֒חוּ אֲהוּבִים וְרוֹמְ֒מוּ אֵל וְנָתְ֒נוּ יְדִידִים זְמִירוֹת שִׁירוֹת וְתִשְׁבָּחוֹת בְּרָכוֹת וְהוֹדָאוֹת לְמֶֽלֶךְ אֵל חַי וְקַיָּם: רָם וְנִשָּׂא גָּדוֹל וְנוֹרָא מַשְׁפִּיל גֵּאִים וּמַגְבִּֽיהַּ שְׁפָלִים מוֹצִיא אֲסִירִים וּפוֹדֶה עֲנָוִים וְעוֹזֵר דַּלִּים וְעוֹנֶה לְעַמּוֹ בְּעֵת שַׁוְּ֒עָם אֵלָיו: <b>תְּהִלּוֹת לְאֵל עֶלְיוֹן</b> בָּרוּךְ הוּא וּמְבֹרָךְ. מֹשֶׁה וּבְנֵי יִשְׂרָאֵל לְךָ עָנוּ שִׁירָה בְּשִׂמְחָה רַבָּה וְאָמְ֒רוּ כֻלָּם: <b>מִי כָמֹֽכָה</b> בָּאֵלִם יְהֹוָה מִי כָּמֹֽכָה נֶאְדָּר בַּקֹּֽדֶשׁ נוֹרָא תְהִלֹּת עֹֽשֵׂה פֶֽלֶא: <b>שִׁירָה</b> חֲדָשָׁה שִׁבְּ֒חוּ גְאוּלִים לְשִׁמְךָ עַל־שְׂפַת הַיָּם יַֽחַד כֻּלָּם הוֹדוּ וְהִמְלִֽיכוּ וְאָמְ֒רוּ: <b>יְהֹוָה יִמְלֹךְ לְעוֹלָם וָעֶד:</b> <b>צוּר יִשְׂרָאֵל</b> קֽוּמָה בְּעֶזְרַת יִשְׂרָאֵל וּפְדֵה כִנְאֻמֶֽךָ יְהוּדָה וְיִשְׂרָאֵל, גֹּאֲלֵֽנוּ יְהֹוָה צְבָאוֹת שְׁמוֹ קְדוֹשׁ יִשְׂרָאֵל: בָּרוּךְ אַתָּה יְהֹוָה גָּאַל יִשְׂרָאֵל:"));
  parts.push(hr);

  // ─── עמידה ───
  parts.push(p("<big><b>עֲמִידָה</b></big>"));
  parts.push(p("<small>המתפלל צריך שיכוין בליבו פירוש המילות שהוא מוציא בשפתיו. ואם אינו יכול לכוין פירוש המילות לכל הפחות צריך שיחשוב בשעת התפילה בדברים המכניעים את הלב ומכוונים את לבו לאביו שבשמים. יכוין רגליו זה אצל זה כאילו אינן אלא אחת. ויזהר להתפלל בלחש. ולא ירמוז בעיניו ולא יקרוץ בשפתיו ולא יראה באצבעותיו ואינו פוסק אפילו לקדיש וקדושה וברכו (קיצשו\"ע יח)</small> אֲדֹנָי שְׂפָתַי תִּפְתָּח וּפִי יַגִּיד תְּהִלָּתֶֽךָ: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אֱלֹהֵי אַבְרָהָם אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא אֵל עֶלְיוֹן גּוֹמֵל חֲסָדִים טוֹבִים וְקוֹנֵה הַכֹּל וְזוֹכֵר חַסְדֵי אָבוֹת וּמֵבִיא גוֹאֵל לִבְנֵי בְנֵיהֶם לְמַֽעַן שְׁמוֹ בְּאַהֲבָה: <small>בעשי\"ת:</small> זָכְרֵֽנוּ לְחַיִּים מֶֽלֶךְ חָפֵץ בַּחַיִּים וְכָתְבֵֽנוּ בְּסֵֽפֶר הַחַיִּים לְמַעַנְךָ אֱלֹהִים חַיִּים: <small>אם לא אמר זכרנו ונזכר לאחר שכבר אמר בא\"י אינו חוזר אבל אם נזכר קודם שאמר השם אף שאמר ברוך אתה אומר זכרנו כו' מלך עוזר כסדר. הטועה ומזכיר זכרנו בשאר ימות השנה אם נזכר קודם שאמר וכתבנו פוסק ומתחיל מלך עוזר וגו' אבל אם אמר וכתבנו חוזר לראש התפלה. (דה\"ח)</small> מֶֽלֶךְ עוֹזֵר וּמוֹשִֽׁיעַ וּמָגֵן: בָּרוּךְ אַתָּה יְהֹוָה מָגֵן אַבְרָהָם:"));
  parts.push(p("<b>אַתָּה גִבּוֹר</b> לְעוֹלָם אֲדֹנָי מְחַיֵּה מֵתִים אַתָּה רַב לְהוֹשִֽׁיעַ: <small>בקיץ:</small> מוֹרִיד הַטָּל <small>בחורף:</small>  מַשִּׁיב הָרֽוּחַ וּמוֹרִיד הַגֶּֽשֶׁם: <small>טעה ולא אמר בחורף משיב הרוח ומוריד הגשם אם נזכר קודם שאמר הברכה מחיה המתים אומרו במקום שנזכר. אבל אם לא נזכר עד לאחר שסיים הברכה מחיה המתים צריך לחזור לראש התפלה. ואם נסתפק לו אם אמר משיב הרוח או לא אמר. אם הוא לאחר שלושים יום חזקתו שגם עתה התפלל כראוי. אבל בתוך שלושים יום צריך לחזור ולהתפלל (קיצור שו\"ע יט)</small> מְכַלְכֵּל חַיִּים בְּחֶֽסֶד מְחַיֵּה מֵתִים בְּרַחֲמִים רַבִּים סוֹמֵךְ נוֹפְ֒לִים וְרוֹפֵא חוֹלִים וּמַתִּיר אֲסוּרִים וּמְקַיֵּם אֱמוּנָתוֹ לִישֵׁנֵי עָפָר, מִי כָמֽוֹךָ בַּֽעַל גְּבוּרוֹת וּמִי דּֽוֹמֶה לָּךְ מֶֽלֶךְ מֵמִית וּמְחַיֵּה וּמַצְמִֽיחַ יְשׁוּעָה: <small>בעשי\"ת:</small> מִי כָמֽוֹךָ אַב הָרַחֲמִים זוֹכֵר יְצוּרָיו לְחַיִּים בְּרַחֲמִים: <small>אם שכח לומר מי כמוך דינו כמו בזכרנו.</small> וְנֶאֱמָן אַתָּה לְהַחֲיוֹת מֵתִים: בָּרוּךְ אַתָּה יְהֹוָה מְחַיֵּה הַמֵּתִים: <small>בחזרת הש\"ץ אומרים כאן קדושה:</small>"));
  parts.push(p("<b>אַתָּה קָדוֹשׁ</b> וְשִׁמְךָ קָדוֹשׁ וּקְדוֹשִׁים בְּכָל־יוֹם יְהַלְ֒לֽוּךָ סֶּֽלָה. בָּרוּךְ אַתָּה יְהֹוָה הָאֵל הַקָּדוֹשׁ: <small>בעשי\"ת מסיים:</small> בָּרוּךְ אַתָּה יְהֹוָה הַמֶּֽלֶךְ הַקָּדוֹשׁ: <small>אם טעה וסיים האל הקדוש אם נזכר בתוך כדי דיבור ואמר המלך הקדוש יצא ואם לאו צריך לחזור לראש התפלה וה\"ה אם מסופק אם אמר צריך לחזור לראש. ובימות השנה אם אמר המלך הקדוש אינו חוזר.</small>"));
  parts.push(p("<small>קהל וחזן:</small> <b>נְקַדֵּשׁ</b> אֶת־שִׁמְךָ בָּעוֹלָם כְּשֵׁם שֶׁמַּקְדִּישִׁים אוֹתוֹ בִּשְׁמֵי מָרוֹם. כַּכָּתוּב עַל־יַד נְבִיאֶֽךָ וְקָרָא זֶה אֶל־זֶה וְאָמַר: <small>קהל וחזן:</small> <b>קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהֹוָה צְבָאוֹת מְלֹא כָל הָאָֽרֶץ כְּבוֹדוֹ:</b> <small>שליח ציבור:</small> לְעֻמָּתָם בָּרוּךְ יֹאמֵֽרוּ: <small>קהל וחזן:</small> <b>בָּרוּךְ כְּבוֹד־יְהֹוָה מִמְּ֒קוֹמוֹ:</b> <small>שליח ציבור:</small> וּבְדִבְרֵי קָדְשְׁךָ כָּתוּב לֵאמֹר: <small>קהל וחזן:</small> <b>יִמְלֹךְ</b> יְהֹוָה לְעוֹלָם אֱלֹהַֽיִךְ צִיּוֹן לְדֹר וָדֹר הַלְ֒לוּיָהּ: <small>שליח ציבור:</small> <b>לְדוֹר</b> וָדוֹר נַגִּיד גָּדְלֶֽךָ וּלְנֵֽצַח נְצָחִים קְדֻשָּׁתְךָ נַקְדִּישׁ וְשִׁבְחֲךָ אֱלֹהֵֽינוּ מִפִּֽינוּ לֹא יָמוּשׁ לְעוֹלָם וָעֶד כִּי אֵל מֶֽלֶךְ גָּדוֹל וְקָדוֹשׁ אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה הָאֵל הַקָּדוֹשׁ: <small>בעשי\"ת מסיים: בָּרוּךְ אַתָּה יְהֹוָה הַמֶּֽלֶךְ הַקָּדוֹשׁ:</small>"));
  parts.push(p("<b>אַתָּה חוֹנֵן</b> לְאָדָם דַּֽעַת וּמְלַמֵּד לֶאֱנוֹשׁ בִּינָה: חָנֵּֽנוּ מֵאִתְּ֒ךָ דֵּעָה בִּינָה וְהַשְׂכֵּל: בָּרוּךְ אַתָּה יְהֹוָה חוֹנֵן הַדָּֽעַת:"));
  parts.push(p("<b>הֲשִׁיבֵֽנוּ</b> אָבִֽינוּ לְתוֹרָתֶֽךָ וְקָרְ֒בֵֽנוּ מַלְכֵּֽנוּ לַעֲבוֹדָתֶֽךָ וְהַחֲזִירֵֽנוּ בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶֽיךָ: בָּרוּךְ אַתָּה יְהֹוָה הָרוֹצֶה בִּתְשׁוּבָה:"));
  parts.push(p("<b>סְלַח לָֽנוּ</b> אָבִֽינוּ כִּי חָטָֽאנוּ מְחַל לָֽנוּ מַלְכֵּֽנוּ כִּי פָשָֽׁעְנוּ כִּי מוֹחֵל וְסוֹלֵֽחַ אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה חַנּוּן הַמַּרְבֶּה לִסְלֽוֹחַ:"));
  parts.push(p("<b>רְאֵה</b> בְעָנְיֵֽנוּ וְרִיבָה רִיבֵֽנוּ וּגְאָלֵֽנוּ מְהֵרָה לְמַֽעַן שְׁמֶֽךָ כִּי גּוֹאֵל חָזָק אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה גּוֹאֵל יִשְׂרָאֵל: <small>(בתענית ציבור אומר כאן הש\"ץ <b>עֲנֵֽנוּ</b>)</small>"));
  parts.push(p("<b>רְפָאֵֽנוּ</b> יְהֹוָה וְנֵרָפֵא הוֹשִׁיעֵֽנוּ וְנִוָּשֵֽׁעָה כִּי תְהִלָּתֵֽנוּ אָֽתָּה וְהַעֲלֵה רְפוּאָה שְׁלֵמָה לְכָל מַכּוֹתֵֽינוּ <small>מי שרוצה להתפלל על החולה יאמר כאן תחנה זו:</small> <small>יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתִּשְׁלַח מְהֵרָה רְפוּאָה שְׁלֵמָה מִן הַשָּׁמַֽיִם, רְפוּאַת הַנֶּֽפֶשׁ וּרְפוּאַת הַגּוּף, לַחוֹלֶה (פלוני/פלונית) בֶּן/בַּת (פלונית) בְּתוֹךְ שְׁאָר חוֹלֵי יִשְׂרָאֵל:</small> כִּי אֵל מֶֽלֶךְ רוֹפֵא נֶאֱמָן וְרַחֲמָן אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל:"));
  parts.push(p("<b>בָּרֵךְ</b> עָלֵֽינוּ יְהֹוָה אֱלֹהֵֽינוּ אֶת־הַשָּׁנָה הַזֹּאת וְאֶת־כָּל־מִינֵי תְבוּאָתָהּ לְטוֹבָה, וְתֵן <small>בימות החמה:</small>  בְּרָכָה <small>בימות הגשמים:</small> טַל וּמָטָר לִבְרָכָה עַל פְּנֵי הָאֲדָמָה וְשַׂבְּ֒עֵֽנוּ מִטּוּבֶֽךָ וּבָרֵךְ שְׁנָתֵֽנוּ כַּשָּׁנִים הַטּוֹבוֹת: בָּרוּךְ אַתָּה יְהֹוָה מְבָרֵךְ הַשָּׁנִים: <small>אם שכח לומר טַל וּמָטָר ונזכר קודם שהתחיל תְּקַע אומרו במקום שנזכר. התחיל לומר תְּקַע יאמרנה בשׁוֹמֵֽעַ תְּפִלָּה. ואם לא נזכר בש\"ת יאמרנה בין ש\"ת לרְצֵה. שכח גם שם אם נזכר קודם שעקר רגליו חוזר לברכת השנים ויתחיל בָּרֵךְ עָלֵֽינוּ ויתפלל כסדר. ואם עקר רגליו חוזר לראש התפלה.</small>"));
  parts.push(p("<b>תְּקַע</b> בְּשׁוֹפָר גָּדוֹל לְחֵרוּתֵֽנוּ וְשָׂא נֵס לְקַבֵּץ גָּלֻיּוֹתֵֽינוּ וְקַבְּ֒צֵֽנוּ יַֽחַד מֵאַרְבַּע כַּנְפוֹת הָאָֽרֶץ: בָּרוּךְ אַתָּה יְהֹוָה מְקַבֵּץ נִדְחֵי עַמּוֹ יִשְׂרָאֵל:"));
  parts.push(p("<b>הָשִֽׁיבָה</b> שׁוֹפְ֒טֵֽינוּ כְּבָרִאשׁוֹנָה וְיוֹעֲצֵֽינוּ כְּבַתְּ֒חִלָּה וְהָסֵר מִמֶּֽנּוּ יָגוֹן וַאֲנָחָה וּמְלוֹךְ עָלֵֽינוּ אַתָּה יְהֹוָה לְבַדְּ֒ךָ בְּחֶֽסֶד וּבְרַחֲמִים וְצַדְּ֒קֵֽנוּ בַּמִשְׁפָּט: בָּרוּךְ אַתָּה יְהֹוָה מֶֽלֶךְ אֹהֵב צְדָקָה וּמִשְׁפָּט: <small>בעשי\"ת יסיים:</small> הַמֶּֽלֶךְ הַמִּשְׁפָּט: <small>בכל השנה אם אמר המלך המשפט יצא וא\"צ לחזור. ובעשי\"ת אם טעה ואמר מלך אוהב צדקה ומשפט אם נזכר תוך כדי דבור אומר המלך המשפט. ואם לאחר כ\"ד לא יאמר ואין מחזירין אותו.</small>"));
  parts.push(p("<b>וְלַמַּלְשִׁינִים</b> אַל תְּהִי תִקְוָה וְכָל הָרִשְׁעָה כְּרֶֽגַע תֹּאבֵד וְכָל אֹיְבֶֽיךָ מְהֵרָה יִכָּרֵֽתוּ וְהַזֵּדִים מְהֵרָה תְעַקֵּר וּתְשַׁבֵּר וּתְמַגֵּר וְתַכְנִֽיעַ בִּמְהֵרָה בְיָמֵֽינוּ: בָּרוּךְ אַתָּה יְהֹוָה שׁוֹבֵר אֹיְ֒בִים וּמַכְנִֽיעַ זֵדִים:"));
  parts.push(p("<b>עַל־הַצַּדִּיקִים</b> וְעַל־הַחֲסִידִים וְעַל־זִקְנֵי עַמְּ֒ךָ בֵּית יִשְׂרָאֵל וְעַל פְּלֵיטַת סוֹפְ֒רֵיהֶם וְעַל גֵּרֵי הַצֶּֽדֶק וְעָלֵֽינוּ יֶהֱמוּ רַחֲמֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וְתֵן שָׂכָר טוֹב לְכָל הַבּוֹטְ֒חִים בְּשִׁמְךָ בֶּאֱמֶת וְשִׂים חֶלְקֵֽנוּ עִמָּהֶם לְעוֹלָם וְלֹא נֵבוֹשׁ כִּי בְךָ בָּטָֽחְנוּ: בָּרוּךְ אַתָּה יְהֹוָה מִשְׁעָן וּמִבְטָח לַצַּדִּיקִים:"));
  parts.push(p("<b>וְלִירוּשָׁלַֽיִם</b> עִירְ֒ךָ בְּרַחֲמִים תָּשׁוּב וְתִשְׁכּוֹן בְּתוֹכָהּ כַּאֲשֶׁר דִּבַּֽרְתָּ וּבְנֵה אוֹתָהּ בְּקָרוֹב בְּיָמֵֽינוּ בִּנְיַן עוֹלָם וְכִסֵּא דָוִד מְהֵרָה לְתוֹכָהּ תָּכִין: בָּרוּךְ אַתָּה יְהֹוָה בּוֹנֵה יְרוּשָׁלָֽיִם:"));
  parts.push(p("<b>אֶת־צֶֽמַח</b> דָּוִד עַבְדְּ֒ךָ מְהֵרָה תַצְמִֽיחַ וְקַרְנוֹ תָּרוּם בִּישׁוּעָתֶֽךָ כִּי לִישׁוּעָתְ֒ךָ קִוִּֽינוּ כָּל הַיּוֹם: בָּרוּךְ אַתָּה יְהֹוָה מַצְמִֽיחַ קֶֽרֶן יְשׁוּעָה:"));
  parts.push(p("<b>שְׁמַע קוֹלֵֽנוּ</b> יְהֹוָה אֱלֹהֵֽינוּ חוּס וְרַחֵם עָלֵֽינוּ וְקַבֵּל בְּרַחֲמִים וּבְרָצוֹן אֶת־תְּפִלָּתֵֽנוּ כִּי אֵל שׁוֹמֵֽעַ תְּפִלּוֹת וְתַחֲנוּנִים אָֽתָּה וּמִלְּ֒פָנֶֽיךָ מַלְכֵּֽנוּ רֵיקָם אַל־תְּשִׁיבֵֽנוּ כִּי אַתָּה שׁוֹמֵֽעַ תְּפִלַּת עַמְּ֒ךָ יִשְׂרָאֵל בְּרַחֲמִים: בָּרוּךְ אַתָּה יְהֹוָה שׁוֹמֵֽעַ תְּפִלָּה:"));
  parts.push(p("<b>רְצֵה</b> יְהֹוָה אֱלֹהֵֽינוּ בְּעַמְּ֒ךָ יִשְׂרָאֵל וּבִתְפִלָּתָם וְהָשֵׁב אֶת הָעֲבוֹדָה לִדְבִיר בֵּיתֶֽךָ וְאִשֵּׁי יִשְׂרָאֵל וּתְפִלָּתָם בְּאַהֲבָה תְקַבֵּל בְּרָצוֹן וּתְהִי לְרָצוֹן תָּמִיד עֲבוֹדַת יִשְׂרָאֵל עַמֶּֽךָ: <small>בראש חדש ובחול המועד אומרים זה:</small> <b>אֱלֹהֵֽינוּ</b> וֵאלֹהֵי אֲבוֹתֵֽינוּ <b>יַעֲלֶה וְיָבֹא</b> וְיַגִּֽיעַ וְיֵרָאֶה וְיֵרָצֶה וְיִשָּׁמַע וְיִפָּקֵד וְיִזָּכֵר זִכְרוֹנֵֽנוּ וּפִקְדוֹנֵֽנוּ וְזִכְרוֹן אֲבוֹתֵֽינוּ. וְזִכְרוֹן מָשִֽׁיחַ בֶּן דָּוִד עַבְדֶּֽךָ. וְזִכְרוֹן יְרוּשָׁלַֽיִם עִיר קָדְשֶֽׁךָ. וְזִכְרוֹן כָּל עַמְּ֒ךָ בֵּית יִשְׂרָאֵל לְפָנֶֽיךָ. לִפְלֵיטָה לְטוֹבָה לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים לְחַיִּים וּלְשָׁלוֹם. בְּיוֹם <small>לר\"ח:</small> רֹאשׁ הַחֹֽדֶשׁ הַזֶּה: <small>לפסח:</small> חַג הַמַּצּוֹת הַזֶּה: <small>לסכות:</small> חַג הַסֻּכּוֹת הַזֶּה: זָכְרֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בּוֹ לְטוֹבָה. וּפָקְדֵֽנוּ בוֹ לִבְרָכָה. וְהוֹשִׁיעֵֽנוּ בוֹ לְחַיִּים. וּבִדְבַר יְשׁוּעָה וְרַחֲמִים חוּס וְחָנֵּֽנוּ וְרַחֵם עָלֵֽינוּ וְהוֹשִׁיעֵֽנוּ. כִּי אֵלֶֽיךָ עֵינֵֽינוּ כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה: <small>שכח ולא אמר יעלה ויבא אם נזכר קודם שאמר יהיו לרצון חוזר ומתחיל רצה. ואפלו אם נזכר קודם שהתחיל מודים כיון שסים ברכת המחזיר שכינתו לציון צריך להתחיל רצה. אך אם נזכר קודם ברכת המחזיר שכינתו לציון אומרו שם ומסים ותחזינה עינינו וכו'. ואם לא נזכר עד לאחר יהיו לרצון וגו' חוזר לראש התפלה.</small> <b>וְתֶחֱזֶֽינָה</b> עֵינֵֽינוּ בְּשׁוּבְ֒ךָ לְצִיּוֹן בְּרַחֲמִים: בָּרוּךְ אַתָּה יְהֹוָה הַמַּחֲזִיר שְׁכִינָתוֹ לְצִיּוֹן:"));
  parts.push(p("<small>כשאומר מודים כורע ראשו וגופו כאגמון עד שיתפקקו כל חוליות שבשדרה. וכשהוא כורע יכרע במהירות בפעם אחת וכשהוא זוקף זוקף בנחת ראשו תחלה ואחר כך גופו שלא תהא עליו כמשאוי (שו\"ע או\"ח סי' קיג)</small> <b>מוֹדִים</b> אֲנַֽחְנוּ לָךְ שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ לְעוֹלָם וָעֶד צוּר חַיֵּֽינוּ מָגֵן יִשְׁעֵֽנוּ אַתָּה הוּא לְדוֹר וָדוֹר נֽוֹדֶה לְּךָ וּנְסַפֵּר תְּהִלָּתֶֽךָ עַל־חַיֵּֽינוּ הַמְּ֒סוּרִים בְּיָדֶֽךָ וְעַל נִשְׁמוֹתֵֽינוּ הַפְּ֒קוּדוֹת לָךְ וְעַל נִסֶּֽיךָ שֶׁבְּכָל יוֹם עִמָּֽנוּ וְעַל נִפְלְ֒אוֹתֶֽיךָ וְטוֹבוֹתֶֽיךָ שֶׁבְּ֒כָל עֵת עֶֽרֶב וָבֹֽקֶר וְצָהֳרָֽיִם הַטּוֹב כִּי לֹא כָלוּ רַחֲמֶֽיךָ וְהַמְ֒רַחֵם כִּי לֹא תַֽמּוּ חֲסָדֶֽיךָ מֵעוֹלָם קִוִּֽינוּ לָךְ: <small>כשיגיע שליח צבור למודים וכורע כל העם שוחין ואומרין הודאה קטנה המתחלת כמו כן במודים. שאין דרך העבד להודות לרבו ולומר לו אדוני אתה על ידי שליח אלא כל אדם צריך לקבל בפיו עול מלכות שמים ואם יקבל על ידי שליח אינה קבלה גמורה שיוכל להכחיש ולומר לא שלחתיו. (אבודרהם)</small> <small><b>מוֹדִים</b> אֲנַֽחְנוּ לָךְ שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אֱלֹהֵי כָל בָּשָׂר יוֹצְ֒רֵֽנוּ יוֹצֵר בְּרֵאשִׁית בְּרָכוֹת וְהוֹדָאוֹת לְשִׁמְךָ הַגָּדוֹל וְהַקָּדוֹשׁ עַל שֶׁהֶחֱיִיתָֽנוּ וְקִיַּמְתָּֽנוּ כֵּן תְּחַיֵּֽינוּ וּתְקַיְּ֒מֵֽנוּ וְתֶאֱסוֹף גָּלֻיּוֹתֵֽינוּ לְחַצְרוֹת קָדְשֶֽׁךָ לִשְׁמוֹר חֻקֶּֽיךָ וְלַעֲשׂוֹת רְצוֹנֶֽךָ וּלְעָבְדְּ֒ךָ בְּלֵבָב שָׁלֵם עַל שֶׁאֲנַֽחְנוּ מוֹדִים לָךְ. בָּרוּךְ אֵל הַהוֹדָאוֹת:</small> <small>בחנוכה ופורים אומרים על הנסים. שכח לומר על הנסים ונזכר קודם שאמר השם מברכת הטוב שמך אפילו אמר ברוך אתה חוזר ואומר על הנסים. אבל אם כבר סיים הברכה או שאמר ברוך א\"י אינו חוזר (דה\"ח תרפ\"ב ותרצ\"ג).</small> <b>עַל הַנִּסִּים</b> וְעַל הַפֻּרְקָן וְעַל הַגְּ֒בוּרוֹת וְעַל הַתְּ֒שׁוּעוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בַּזְּ֒מַן הַזֶּה: <small>בחנוכה:</small> <b>בִּימֵי מַתִּתְיָֽהוּ</b> בֶּן יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו כְּשֶׁעָמְ֒דָה מַלְכוּת יָוָן הָרְ֒שָׁעָה עַל־עַמְּ֒ךָ יִשְׂרָאֵל לְהַשְׁכִּיחָם תּוֹרָתֶֽךָ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנֶֽךָ, וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים עָמַֽדְתָּ לָהֶם בְּעֵת צָרָתָם רַֽבְתָּ אֶת־רִיבָם דַּֽנְתָּ אֶת־דִּינָם נָקַֽמְתָּ אֶת־נִקְמָתָם מָסַֽרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים וְרַבִּים בְּיַד מְעַטִּים וּטְמֵאִים בְּיַד טְהוֹרִים וּרְשָׁעִים בְּיַד צַדִּיקִים וְזֵדִים בְּיַד עוֹסְ֒קֵי תוֹרָתֶֽךָ וּלְךָ עָשִֽׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמֶֽךָ וּלְעַמְּ֒ךָ יִשְׂרָאֵל עָשִֽׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה וְאַחַר־כֵּן בָּֽאוּ בָנֶֽיךָ לִדְבִיר בֵּיתֶֽךָ וּפִנּוּ אֶת־הֵיכָלֶֽךָ וְטִהֲרוּ אֶת־מִקְדָּשֶֽׁךָ וְהִדְלִֽיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶֽׁךָ וְקָבְ֒עוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵֽלּוּ לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל: <small>בפורים:</small> <b>בִּימֵי מָרְדְּ֒כַי וְאֶסְתֵּר</b> בְּשׁוּשַׁן הַבִּירָה כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע בִּקֵּשׁ לְהַשְׁמִיד לַהֲרוֹג וּלְאַבֵּד אֶת־כָּל־הַיְּ֒הוּדִים מִנַּֽעַר וְעַד־זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד בִּשְׁלוֹשָׁה עָשָׂר לְחֹֽדֶשׁ שְׁנֵים־עָשָׂר הוּא־חֹֽדֶשׁ אֲדָר וּשְׁלָלָם לָבוֹז: וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים הֵפַֽרְתָּ אֶת־עֲצָתוֹ וְקִלְקַֽלְתָּ אֶת־מַחֲשַׁבְתּוֹ וַהֲשֵׁבֽוֹתָ לּוֹ גְּמוּלוֹ בְּרֹאשׁוֹ וְתָלוּ אוֹתוֹ וְאֶת־בָּנָיו עַל־הָעֵץ (וְעָשִׂיתָ עִמָּהֶם נֵס וָפֶלֶא וְנוֹדֶה לְשִׁמְךָ הָגָּדוֹל סֶלָה): <b>וְעַל־כֻּלָּם</b> יִתְבָּרַךְ וְיִתְרוֹמַם שִׁמְךָ מַלְכֵּֽנוּ תָּמִיד לְעוֹלָם וָעֶד: <small>בעשי\"ת:</small> וּכְתוֹב לְחַיִּים טוֹבִים כָּל בְּנֵי בְרִיתֶֽךָ: <small>אם שכח לומר וכתוב אם נזכר קודם שאמר השם מברכת הטוב חוזר ואם לא נזכר עד לאחר שאמר השם אינו חוזר כמו שנתבאר לעיל אצל זכרנו ומי כמוך. (דה\"ח סי' תקפ\"ב)</small> <b>וְכֹל הַחַיִּים</b> יוֹדֽוּךָ סֶּֽלָה וִיהַלְ֒לוּ אֶת־שִׁמְךָ בֶּאֱמֶת הָאֵל יְשׁוּעָתֵֽנוּ וְעֶזְרָתֵֽנוּ סֶֽלָה: בָּרוּךְ אַתָּה יְהֹוָה הַטּוֹב שִׁמְךָ וּלְךָ נָאֶה לְהוֹדוֹת:"));
  parts.push(p("<b>שִׂים שָׁלוֹם</b> טוֹבָה וּבְרָכָה חֵן וָחֶֽסֶד וְרַחֲמִים עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל עַמֶּֽךָ. בָּרְ֒כֵֽנוּ אָבִֽינוּ כֻּלָּֽנוּ כְּאֶחָד בְּאוֹר פָּנֶֽיךָ. כִּי בְאוֹר פָּנֶֽיךָ נָתַֽתָּ לָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ תּוֹרַת חַיִּים וְאַהֲבַת חֶֽסֶד וּצְדָקָה וּבְרָכָה וְרַחֲמִים וְחַיִּים וְשָׁלוֹם. וְטוֹב בְּעֵינֶֽיךָ לְבָרֵךְ אֶת עַמְּ֒ךָ יִשְׂרָאֵל בְּכָל־עֵת וּבְכָל־שָׁעָה בִּשְׁלוֹמֶֽךָ: <small>בעשי\"ת:</small> בְּסֵֽפֶר חַיִּים בְּרָכָה וְשָׁלוֹם וּפַרְנָסָה טוֹבָה נִזָּכֵר וְנִכָּתֵב לְפָנֶֽיךָ אֲנַֽחְנוּ וְכָל עַמְּ֒ךָ בֵּית יִשְׂרָאֵל לְחַיִּים טוֹבִים וּלְשָׁלוֹם: <small>אם לא אמר בְּסֵֽפֶר חַיִּים כיון שסיים הברכה או רק בא\"י אינו חוזר. ונ\"ל דבזה ראוי לומר בספר תיכף כשסיים המברך את עמו ישראל בשלום קודם יהיו לרצון כיון שכבר גמר התפלה. (דהא לר\"ת לעולם אומרים בסוף ברכה אפילו בדבר שאין מחזירין אלא דהחולקים סוברים כיון דא\"צ לחזור א\"כ הוי הפסק באמצע תפלה מה שאין כן כאן.) (חיי אדם כלל כ\"ד סעי' כ\"ה)</small> בָּרוּךְ אַתָּה יְהֹוָה הַמְ֒בָרֵךְ אֶת־עַמּוֹ יִשְׂרָאֵל בַּשָּׁלוֹם:"));
  parts.push(p("יִהְיוּ לְרָצוֹן אִמְרֵי פִי וְהֶגְיוֹן לִבִּי לְפָנֶֽיךָ יְהֹוָה צוּרִי וְגוֹאֲלִי: <b>אֱלֹהַי</b> נְצוֹר לְשׁוֹנִי מֵרָע וּשְׂפָתַי מִדַּבֵּר מִרְמָה. וְלִמְקַלְ֒לַי נַפְשִׁי תִדּוֹם וְנַפְשִׁי כֶּעָפָר לַכֹּל תִּהְיֶה. פְּתַח לִבִּי בְּתוֹרָתֶֽךָ וּבְמִצְוֹתֶֽיךָ תִּרְדֹּף נַפְשִׁי. וְכֹל הַחוֹשְׁ֒בִים עָלַי רָעָה מְהֵרָה הָפֵר עֲצָתָם וְקַלְקֵל מַחֲשַׁבְתָּם: עֲשֵׂה לְמַֽעַן שְׁמֶֽךָ עֲשֵׂה לְמַֽעַן יְמִינֶֽךָ עֲשֵׂה לְמַֽעַן קְדֻשָּׁתֶֽךָ עֲשֵׂה לְמַֽעַן תּוֹרָתֶֽךָ. לְמַֽעַן יֵחָלְ֒צוּן יְדִידֶֽיךָ הוֹשִֽׁיעָה יְמִינְ֒ךָ וַעֲנֵֽנִי: יִהְיוּ לְרָצוֹן אִמְרֵי פִי וְהֶגְיוֹן לִבִּי לְפָנֶֽיךָ יְהֹוָה צוּרִי וְגוֹאֲלִי: עֹשֶׂה (<small>בעשי\"ת</small> הַשָּׁלוֹם) שָׁלוֹם בִּמְרוֹמָיו הוּא יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל וְאִמְרוּ אָמֵן: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁיִּבָּנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵֽינוּ וְתֵן חֶלְקֵֽנוּ בְּתוֹרָתֶֽךָ: וְשָׁם נַעֲבָדְךָ בְּיִרְאָה כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמוֹנִיּוֹת: וְעָרְ֒בָה לַיהוָֹה מִנְחַת יְהוּדָה וִירוּשָׁלָֽםִ כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמוֹנִיּוֹת: <small>בר\"ח וחולו של מועד וחנוכה אומרים כאן הלל לאחר חזרת הש\"ץ. בת\"צ אומרים סליחות. בימים שאין אומרים בהם תחנון יאמר הש\"ץ חצי קדיש.</small>"));
  parts.push(hr);

  // ─── וידוי ותחנון ───
  if (isTachanunDay) {
    parts.push(p("<big><b>וִידּוּי</b></big>"));
    parts.push(p("<small>טעם נכון למה נתקן הוידוי בלשון רבים כי היה צריך לומר אשמתי בגדתי וכו'. אך העניין הוא שמלבד מה שנענש האדם על חטאיו גם הוא נענש על חברו מטעם הערבות כי כל ישראל הם גוף אחד כלול מאיברים רבים. אם כן לזה ראוי לאדם שיתוודה בלשון רבים כדי שיתוודה גם על חברו. (שער הכונות)</small> <b>אֱלֺהֵֽינוּ</b> וֵאלֺהֵי אֲבוֹתֵֽינוּ תָּבֹא לְפָנֶֽיךָ תְּפִלָּֽתֵֽנוּ, וְאַל־תִּתְעַלַּם מִתְּ֒חִנָּתֵֽנוּ שֶׁאֵין אָֽנוּ עַזֵּי פָנִים וּקְשֵׁי עֹֽרֶף לוֹמַר לְפָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ וֵאלֺהֵי אֲבוֹתֵֽינוּ צַדִּיקִים אֲנַֽחְנוּ וְלֺא חָטָֽאנוּ אֲבָל אֲנַֽחְנוּ וַאֲבוֹתֵֽינוּ חָטָֽאנוּ: <b>אָשַֽׁמְנוּ.</b> בָּגַֽדְנוּ. גָּזַֽלְנוּ. דִּבַּֽרְנוּ דֹּֽפִי. הֶעֱוִֽינוּ. וְהִרְשַֽׁעְנוּ. זַֽדְנוּ. חָמַֽסְנוּ. טָפַֽלְנוּ שֶֽׁקֶר. יָעַֽצְנוּ רָע. כִּזַּֽבְנוּ. לַֽצְנוּ. מָרַֽדְנוּ. נִאַֽצְנוּ. סָרַֽרְנוּ. עָוִֽינוּ. פָּשַֽׁעְנוּ. צָרַֽרְנוּ. קִשִּֽׁינוּ עֹֽרֶף. רָשַֽׁעְנוּ. שִׁחַֽתְנוּ. תִּעַֽבְנוּ. תָּעִֽינוּ. תִּעְתָּֽעְנוּ: סַֽרְנוּ מִמִּצְוֹתֶֽיךָ וּמִמִּשְׁפָּטֶֽיךָ הַטּוֹבִים וְלֺא שָֽׁוָה לָֽנוּ. וְאַתָּה צַדִּיק עַל כָּל הַבָּא עָלֵֽינוּ. כִּי אֱמֶת עָשִֽׂיתָ וַאֲנַֽחְנוּ הִרְשָֽׁעְנוּ: אֵל אֶֽרֶךְ־אַפַּֽיִם אַתָּה. וּבַֽעַל הָרַחֲמִים נִקְרֵֽאתָ. וְדֶֽרֶךְ תְּשׁוּבָה הוֹרֵֽיתָ: גְּדֻלַּת רַחֲמֶֽיךָ וַחֲסָדֶֽיךָ. תִּזְכֺּר הַיּוֹם וּבְכָל־יוֹם לְזֶֽרַע יְדִידֶֽיךָ: תֵּֽפֶן אֵלֵֽינוּ בְּרַחֲמִים. כִּי אַתָּה הוּא בַּֽעַל הָרַחֲמִים: בְּתַחֲנוּן וּבִתְפִלָּה פָּנֶֽיךָ נְקַדֵּם. כְּהוֹדַֽעְתָּ לֶעָנָיו מִקֶּֽדֶם: מֵחֲרוֹן אַפְּ֒ךָ שׁוּב. כְּמוֹ בְּתוֹרָתְ֒ךָ כָּתוּב: וּבְצֵל כְּנָפֶֽיךָ נֶחֱסֶה וְנִתְלוֹנָן. כְּיוֹם וַיֵֽרֶד יְהֺוָה בֶּעָנָן: תַּעֲבֺר עַל־פֶּֽשַׁע וְתִמְחֶה אָשָׁם. כְּיוֹם וַַיִּתְיַצֵּב עִמּוֹ שָׁם: תַּאֲזִין שַׁוְעָתֵֽנוּ וְתַקְשִׁיב מֶֽנוּ מַאֲמַר. כְּיוֹם וַיִּקְרָא בְשֵׁם יְהֹוָה, וְשָׁם נֶאֱמַר: <small>קהל וש\"ץ:</small> וַיַּעֲבֹר יְהֺוָה עַל פָּנָיו וַיִּקְרָא: יְהֺוָה יְהֺוָה אֵל רַחוּם וְחַנּוּן אֶֽרֶךְ אַפַּֽיִם וְרַב־חֶֽסֶד וֶאֱמֶת: נֹצֵר חֶֽסֶד לָאֲלָפִים נֹשֵׂא עָוֹן וָפֶֽשַׁע וְחַטָּאָה וְנַקֵּה: וְסָלַחְתָּ לַעֲוֺנֵֽנוּ וּלְחַטָּאתֵֽנוּ וּנְחַלְתָּֽנוּ: סְלַח־לָֽנוּ אָבִֽינוּ כִּי־חָטָֽאנוּ. מְחַל־לָֽנוּ מַלְכֵּֽנוּ כִּי־פָשָֽׁעְנוּ: כִּי־אַתָּה אֲדֺנָי טוֹב וְסַלָּח וְרַב־חֶֽסֶד לְכָל־קוֹרְ֒אֶֽיךָ:"));
    parts.push(p("וַיֹּֽאמֶר דָּוִד אֶל־גָּד צַר־לִי מְאֹד נִפְּ֒לָה־נָּא בְיַד־יְהֹוָה כִּי־רַבִּים רַחֲמָיו וּבְיַד־אָדָם אַל־אֶפֹּֽלָה: <b>רַחוּם וְחַנּוּן</b> חָטָֽאתִי לְפָנֶֽיךָ יְהֹוָה מָלֵא רַחֲמִים רַחֵם עָלַי וְקַבֵּל תַּחֲנוּנָי: יְהֹוָה אַל־בְּאַפְּ֒ךָ תוֹכִיחֵֽנִי וְאַל־בַּחֲמָתְ֒ךָ תְיַסְּ֒רֵֽנִי: חָנֵּֽנִי יְהֹוָה כִּי אֻמְלַל אָֽנִי רְפָאֵֽנִי יְהֹוָה כִּי נִבְהֲלוּ עֲצָמָי: וְנַפְשִׁי נִבְהֲלָה מְאֹד וְאַתָּה יְהֹוָה עַד־מָתָי: שׁוּבָה יְהֹוָה חַלְּ֒צָה נַפְשִׁי הוֹשִׁיעֵֽנִי לְמַֽעַן חַסְדֶּֽךָ: כִּי אֵין בַּמָּֽוֶת זִכְרֶךָ בִּשְׁ֒אוֹל מִי־יוֹדֶה לָּךְ: יָגַֽעְתִּי־בְּאַנְחָתִי אַשְׂחֶה בְכָל־לַֽיְלָה מִטָּתִי בְּדִמְעָתִי עַרְשִׂי אַמְסֶה: עָשְׁ֒שָׁה מִכַּֽעַס עֵינִי עָתְ֒קָה בְּכָל־צוֹרְ֒רָי: סֽוּרוּ מִמֶּֽנִּי כָּל־פֹּֽעֲלֵי אָוֶן כִּי־שָׁמַע יְהֹוָה קוֹל בִּכְיִי: שָׁמַע יְהֹוָה תְּחִנָּתִי יְהֹוָה תְּפִלָּתִי יִקָּח: יֵבֽשׁוּ וְיִבָּהֲלוּ מְאֹד כָּל־אֹיְ֒בָי יָשֻֽׁבוּ יֵבֽשׁוּ רָֽגַע:"));
    if (isMonThu) {
      parts.push(p("<small>נוהגים להרבות בתחנונים בשני וחמישי משום דאמרינן במדרש דמרע\"ה עלה בחמישי לקבל לוחות אחרונות וירד בשני. ואומרים והוא רחום. ויש במדרש דג' זקנים תקנוהו. שתפשם מלך אחד ונתנם בג' ספינות בלא מנהיג. ושלחם לים ונתפזרו למרחקים. ולמקום שבאו הציר להם מאד ועמדו בתפלה וכל אחד יסד מקצת. ובכל חלק י\"ח שמות כנגד תפלת י\"ח. וימת אותו מלך שהציר להם בתחלואים רעים. ושלחו תפלתם בכל תפוצות ישראל לאמרה בשני וחמישי (ע\"פ מחזור מכל השנה)</small> <b>וְהוּא רַחוּם</b> יְכַפֵּר עָוֺן וְלֹא־יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֹא־יָעִיר כָּל־חֲמָתוֹ: אַתָּה יְהֹוָה לֺא תִכְלָא רַחֲמֶֽיךָ מִמֶּֽנּוּ חַסְדְּ֒ךָ וַאֲמִתְּ֒ךָ תָּמִיד יִצְ֒רֽוּנוּ: הוֹשִׁיעֵֽנוּ יְהֹוָה אֱלֺהֵֽינוּ וְקַבְּ֒צֵֽנוּ מִן־הַגּוֹיִם לְהוֹדוֹת לְשֵׁם קָדְשֶֽׁךָ לְהִשְׁתַּבֵּֽחַ בִּתְ֒הִלָּתֶֽךָ: אִם־עֲוֺנוֹת תִּשְׁמָר־יָהּ אֲדֹנָי מִי יַעֲמֹד: כִּי־עִמְּ֒ךָ הַסְּ֒לִיחָה לְמַֽעַן תִּוָּרֵא: לֺא כַחֲטָאֵֽינוּ תַּעֲשֶׂה־לָּֽנוּ וְלֹא כַעֲוֺנֹתֵֽינוּ תִּגְמֹל עָלֵֽינוּ: אִם־עֲוֺנֵֽינוּ עָֽנוּ בָֽנוּ יְהֹוָה עֲשֵׂה לְמַֽעַן שְׁמֶֽךָ: זְכָר־רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: יַעֲנֵֽנוּ יְהֹוָה בְּיוֹם צָרָה יְשַׂגְּ֒בֵֽנוּ שֵׁם אֱלֺהֵי יַעֲקֹב: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים צְדָקָה עֲשֵׂה עִמָּֽנוּ לְמַֽעַן שְׁמֶֽךָ: אֲדוֹנֵֽינוּ אֱלֺהֵֽינוּ שְׁמַע קוֹל תַּחֲנוּנֵֽינוּ וּזְכָר־לָֽנוּ אֶת־בְּרִית אֲבוֹתֵֽינוּ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: וְעַתָּה אֲדֹנָי אֱלֺהֵֽינוּ אֲשֶׁר הוֹצֵֽאתָ אֶת־עַמְּ֒ךָ מֵאֶֽרֶץ מִצְרַֽיִם בְּיָד חֲזָקָה וַתַּֽעַשׂ־לְךָ שֵׁם כַּיּוֹם הַזֶּה חָטָֽאנוּ רָשָֽׁעְנוּ: אֲדֹנָי כְּכָל־צִדְ֒קֹתֶֽיךָ יָֽשָׁב־נָא אַפְּ֒ךָ וַחֲמָתְ֒ךָ מֵעִירְ֒ךָ יְרוּשָׁלַֽםִ הַר־קָדְשֶֽׁךָ כִּי בַחֲטָאֵֽינוּ וּבַעֲוֺנוֹת אֲבֹתֵֽינוּ יְרוּשָׁלַֽםִ וְעַמְּ֒ךָ לְחֶרְפָּה לְכָל־סְבִיבֹתֵֽינוּ: וְעַתָּה שְׁמַע אֱלֺהֵֽינוּ אֶל־תְּפִלַּת עַבְדְּךָ וְאֶל־תַּחֲנוּנָיו וְהָאֵר פָּנֶֽיךָ עַל־מִקְדָּשְׁ֒ךָ הַשָּׁמֵם לְמַֽעַן אֲדֹנָי: <b>הַטֵּה</b> אֱלֺהַי אָזְנְךָ וּשְׁ֒מָע פְּקַח עֵינֶֽיךָ וּרְאֵה שֹׁמְ֒מוֹתֵֽינוּ וְהָעִיר אֲשֶׁר־נִקְרָא שִׁמְךָ עָלֶֽיהָ כִּי לֺא עַל־צִדְ֒קֹתֵֽינוּ אֲנַֽחְנוּ מַפִּילִים תַּחֲנוּנֵֽינוּ לְפָנֶֽיךָ כִּי עַל־רַחֲמֶֽיךָ הָרַבִּים: אֲדֹנָי שְׁמָֽעָה אֲדֹנָי סְלָֽחָה אֲדֹנָי הַקְשִֽׁיבָה וַעֲשֵׂה אַל־תְּאַחַר: לְמַעַנְךָ אֱלֺהַי כִּי־שִׁמְךָ נִקְרָא עַל־עִירְ֒ךָ וְעַל־עַמֶּֽךָ: אָבִֽינוּ אָב הָרַחֲמָן הַרְאֵֽנוּ אוֹת לְטוֹבָה וְקַבֵּץ נְפוּצוֹתֵֽינוּ מֵאַרְבַּע כַּנְפוֹת הָאָֽרֶץ: יַכִּֽירוּ וְיֵדְ֒עוּ כָּל־הַגּוֹיִם כִּי אַתָּה יְהֹוָה אֱלֺהֵֽינוּ: וְעַתָּה יְהֹוָה אָבִֽינוּ אָֽתָּה אֲנַֽחְנוּ הַחֹֽמֶר וְאַתָּה יֹצְ֒רֵֽנוּ וּמַעֲשֵׂה יָדְ֒ךָ כֻּלָּֽנוּ: הוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ צוּרֵֽנוּ מַלְכֵּֽנוּ וְגוֹאֲלֵֽנוּ: חֽוּסָה יְהֹוָה עַל־עַמֶּֽךָ וְאַל־תִּתֵּן נַחֲלָתְ֒ךָ לְחֶרְפָּה לִמְשָׁל־בָּם גּוֹיִם: לָֽמָּה יֹאמְ֒רוּ בָעַמִּים אַיֵּה אֱלֺהֵיהֶם: יָדַֽעְנוּ כִּי חָטָֽאנוּ וְאֵין מִי יַעֲמֹד בַּעֲדֵֽנוּ שִׁמְךָ הַגָּדוֹל יַעֲמָד־לָֽנוּ בְּעֵת צָרָה: יָדַֽעְנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים צְדָקָה עֲשֵׂה עִמָּֽנוּ לְמַֽעַן שְׁמֶֽךָ: כְּרַחֵם אָב עַל־בָּנִים כֵּן תְּרַחֵם יְהֹוָה עָלֵֽינוּ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: חֲמוֹל עַל עַמֶּֽךָ רַחֵם עַל נַחֲלָתֶֽךָ חֽוּסָה־נָּא כְּרוֹב רַחֲמֶֽיךָ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי לְךָ יְהֹוָה הַצְּ֒דָקָה עֹשֵׂה נִפְלָאוֹת בְּכָל עֵת: <b>הַבֶּט־נָא</b> רַחֶם־נָא עַל־עַמְּךָ מְהֵרָה לְמַֽ‎עַן שְׁמֶךָ: בְּרַחֲמֶֽ‎יךָ הָרַבִּים יְהֹוָה אֱלהֵֽ‎ינוּ חוּס וְרַחֵם וְהוֹשִֽׁיעָה צֹאן מַרְעִיתֶֽךָ וְאַל־יִמְשָׁל בָּֽ‎נוּ קֶצֶף כִּי לְךָ עֵינֵֽ‎ינוּ תְלוּיות: הושִׁיעֵֽ‎נוּ לְמַֽ‎עַן שְׁמֶֽ‎ךָ רַחֵם עָלֵֽינוּ לְמַעַן בְּרִיתֶֽךָ: הַבִּֽיטָה וַעֲנֵֽ‎נוּ בְּעֵת צָרָה כִּי לְךָ יְהֹוָה הַיְשׁוּעָה: בְּךָ תוֹחַלְתֵּֽ‎נוּ אֱלֽ‎וֹהַּ סְלִיחות אָנָּא סְלַח־נָא אֵל טוֹב וְסַלָּח כִּי אֵל מֶֽ‎לֶךְ חַנּוּן וְרַחוּם אָֽתָּה: <b>אָנָּא</b> מֶֽלֶךְ חַנּוּן וְרַחוּם זְכוֹר וְהַבֵּט לִבְ֒רִית בֵּין הַבְּ֒תָרִים וְתֵרָאֶה לְפָנֶֽיךָ עֲקֵדַת יָחִיד לְמַֽעַן יִשְׂרָאֵל: אָבִֽינוּ מַלְכֵּ‎ֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי שִׁמְךָ הַגָּדוֹל נִקְרָא עָלֵֽינוּ עֹשֵׂה נִפְלָאוֹת בְּכָל־עֵת עֲשֵׂה עִמָּֽנוּ כְּחַסְדֶּֽךָ: חַנּוּן וְרַחוּם הַבִּֽיטָה וַעֲנֵֽנוּ בְּעֵת צָרָה כִּי לְךָ יְהֺוָה הַיְשׁוּעָה: אָבִֽינוּ מַלְכֵּֽנוּ מַחֲסֵֽנוּ אַל־תַּֽעַשׁ עִמָּֽנוּ כְּרֹֽעַ מַעֲלָלֵֽינוּ: זְכֹר רַחֲמֶֽיךָ יְהֺוָה וַחֲסָדֶֽיךָ וּכְרוֹב טוּבְךָ הושִׁיעֵֽנוּ וַחֲמָל־נָא עָלֵֽינוּ כִּי אֵין לָֽנוּ אֱלֽוֹהַּ אַחֵר מִבַּלְעָדֶֽיךָ צוּרֵֽנוּ: אַל תַּעַזְבֵֽנוּ יְהֺוָה אֱלֹהֵֽינוּ אַל תִּרְחַק מִמֶּֽנוּ כִּי נַפְשֵֽׁנוּ קְצָרָה מֵחֶֽרֶב וּמִשְּׁבִי וּמִדֶּֽבֶר וּמִמַּגֵּפָה וּמִכָּל־צָרָה וְיָגוֹן: הַצִּילֵֽנוּ כִּי לְךָ קִוִּֽינוּ וְאַל תַּכְלִימֵֽנוּ יְהֺוָה אֱלֹהֵֽינוּ וְהָאֵר פָּנֶֽיךָ בָּֽנוּ וּזְכָר־לָֽנוּ אֶת־בְּרִית אֲבוֹתֵֽינוּ וְהושִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: רְאֵה בְצָרוֹתֵֽינוּ וּשְׁמַע קוֹל תְּפִלָּתֵֽנוּ כִּי אַתָּה שׁוֹמֵֽע תְּפִלַּת כָּל־פֶּה: <b>אֵל רַחוּם</b> וְחַנּוּן רַחֵם עָלֵֽינוּ וְעַל כָּל־מַעֲשֶֽׂיךָ כִּי אֵין כָּמֽוֹךָ יְהֺוָה אֱלֹהֵֽינוּ: אָנָּא שָׂא נָא פְשָׁעֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ צוּרֵֽנוּ וְגוֹאֲלֵֽנוּ אֵל חַי וְקַיָּם הַחֲסִין בַּכֹּֽחַ חָסִיד וָטוֹב עַל כָּל־מַעֲשֶֽׂיךָ כִּי אַתָּה הוּא יְהֺוָה אֱלֹהֵֽינוּ: אֵל אֶֽרֶךְ אַפַּֽיִם וּמָלֵא רַחֲמִים עֲשֵׂה עִמָּֽנוּ כְּרוֹב רַחֲמֶֽיךָ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: שְׁמַע מַלְכֵּֽנוּ תְּפִלָּתֵֽנוּ וּמִיַּד אוֹיְבֵֽינוּ הַצִּילֵֽנוּ: שְׁמַע מַלְכֵּֽנוּ תְּפִלָתֵֽנוּ וּמִכָּל־צָרָה וְיָגוֹן הַצִּילֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ אָֽתָּה וְשִׁמְךָ עָלֵֽינוּ נִקְרָא אַל־תַּנִּיחֵֽנוּ: אַל תַּעַזְבֵֽנוּ אָבִֽינוּ וְאַל־תִּטְּשֵֽׁנוּ בּוֹרְאֵֽנוּ וְאַל־תִּשְׁכָּחֵֽנוּ יוֹצְרֵֽנוּ כִּי אֵל מֶֽ‎לֶךְ חַנּוּן וְרַחוּם אָֽ‎תָּה: <b>אֵין כָּמֽוֹךָ</b> חַנּוּן וְרַחוּם יְהֹוָה אֱלֺהֵֽינוּ אֵין כָּמֽוֹךָ אֵל אֶֽרֶךְ אַפַּֽיִם וְרַב חֶֽסֶד וֶאֱמֶת: הוֹשִׁיעֵֽנוּ בְּרַחֲמֶֽיךָ הָרַבִּים מֵרַֽעַשׁ וּמֵרֺֽגֶז הַצִּילֵֽנוּ: זְכֺר לַעֲבָדֶֽיךָ לְאַבְרָהָם לְיִצְחָק וּלְיַעֲקֹב אַל־תֵּֽפֶן אֶל־קָשְׁיֵֽנוּ וְאֶל־רִשְׁעֵֽנוּ וְאֶל־חַטָּאתֵֽנוּ: שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ וְהָסֵר מִמֶּֽנּוּ מַכַּת הַמָּֽוֶת כִּי רַחוּם אָֽתָּה כִּי כֵן דַּרְכֶּֽךָ עֹשֶׂה חֶֽסֶד חִנָּם בְּכָל־דּוֹר וָדוֹר: חֽוּסָה יְהֹוָה עַל־עַמֶּֽךָ וְהַצִּילֵֽנוּ מִזַּעְמֶֽךָ וְהָסֵר מִמֶּֽנּוּ מַכַּת הַמַּגֵּפָה וּגְזֵרָה קָשָׁה כִּי אַתָּה שׁוֹמֵר יִשְׂרָאֵל: לְךָ אֲדֹנָי הַצְּ֒דָקָה וְלָֽנוּ בּֽשֶׁת הַפָּנִים: מַה־נִּתְאוֹנֵן מַה־נֹּאמַר מַה־נְּדַבֵּר וּמַה־נִּצְטַּדָּק: נַחְפְּשָׂה דְרָכֵֽינוּ וְנַחְקֺֽרָה וְנָשֽׁוּבָה אֵלֶֽיךָ כִּי יְמִינְ֒ךָ פְשׁוּטָה לְקַבֵּל שָׁבִים: אָֽנָּא יְהֹוָה הוֹשִֽׁיעָה נָּא: אָֽנָּא יְהֹוָה הַצְלִיחָה נָא: אָֽנָּא יְהֹוָה עֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: לְךָ יְהֹוָה חִכִּֽינוּ לְךָ יְהֹוָה קִוִּינוּ לְךָ יְהֹוָה נְיַחֵל: אַל תֶּחֱשֶׁה וּתְעַנֵּֽנוּ כִּי נָאֲמוּ גוֹיִם אָבְ֒דָה תִקְוָתָם: כָּל־בֶּֽרֶךְ וְכָל־קוֹמָה לְךָ לְבַד תִּשְׁתַּחֲוֶה: <b>הַפּוֹתֵֽחַ יָד</b> בִּתְ֒שׁוּבָה לְקַבֵּל פּוֹשְׁ֒עִים וְחַטָּאִים נִבְהֲלָה נַפְשֵֽׁנוּ מֵרוֹב עִצְּ֒בוֹנֵֽנוּ אַל־תִּשְׁכָּחֵֽנוּ נֶֽצַח: קֽוּמָה וְהוֹשִׁיעֵֽנוּ כִּי חָסִֽינוּ בָךְ: אָבִֽינוּ מַלְכֵּֽנוּ אִם אֵין בָּֽנוּ צְדָקָה וּמַעֲשִׂים טוֹבִים זְכָר־לָֽנוּ אֶת־בְּרִית אֲבוֹתֵֽינוּ וְעֵדוֹתֵֽינוּ בְּכָל־יוֹם יְהֹוָה אֶחָד: הַבִּֽיטָה בְעָנְיֵֽנוּ כִּי רַבּוּ מַכְאוֹבֵֽינוּ וְצָרוֹת לְבָבֵֽנוּ: חֽוּסָה יְהֹוָה עָלֵֽינוּ בְּאֶֽרֶץ שִׁבְיֵֽנוּ ואַל־תִּשְׁפּוֹךְ חֲרוֹנְ֒ךָ עָלֵֽינוּ כִּי אֲנַֽחְנוּ עַמְּ֒ךָ בְּנֵי בְרִיתֶֽךָ: אֵל הַבִּֽיטָה דַּל כְּבוֹדֵֽנוּ בַּגּוֹיִם וְשִׁקְּ֒צֽוּנוּ כְּטֻמְאַת הַנִּדָּה: עַד מָתַי עֻזְּ֒ךָ בַּשְּׁ֒בִי וְתִפְאַרְתְּ֒ךָ בְּיַד־צָר: עוֹרְ֒רָה גְבוּרָתְ֒ךָ וְקִנְאָתְךָ עַל־אֹיְבֶֽיךָ הֵם יֵבֽשׁוּ וְיֵחַֽתּוּ מִגְבוּרָתָם וְאַל־יִמְעֲטוּ לְפָנֶֽיךָ תְּלָאוֹתֵֽינוּ: מַהֵר יְקַדְּ֒מֽוּנוּ רַחֲמֶֽיךָ בְּיוֹם צָרָתֵֽינוּ וְאִם־לֺֹא לְמַעֲנֵֽנוּ לְמַעַנְךָ פְעַל וְאַל־תַּשְׁחִית זֵֽכֶר שְׁאֵרִיתֵֽנוּ: וְחוֹן אוֹם הַמְיַחֲדִים שִׁמְךָ פַּעֲמַֽיִם בְּכָל־יוֹם תָּמִיד בְּאַהֲבָה ואוֹמְ֒רִים: שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֺהֵֽינוּ יְהֹוָה אֶחָד:"));
    }
    parts.push(p("<b>שׁוֹמֵר</b> יִשְׂרָאֵל שְׁמוֹר שְׁאֵרִית יִשְׂרָאֵל וְאַל יֹאבַד יִשְׂרָאֵל הָאֹמְ֒רִים שְׁמַע יִשְׂרָאֵל: <b>שׁוֹמֵר</b> גּוֹי אֶחָד שְׁמוֹר שְׁאֵרִית עַם אֶחָד וְאַל יֹאבַד גּוֹי אֶחָד הַמְיַחֲדִים שִׁמְךָ יְהֹוָה אֱלֺהֵֽינוּ יְהֹוָה אֶחָד: <b>שׁוֹמֵר</b> גּוֹי קָדוֹשׁ שְׁמוֹר שְׁאֵרִית עַם קָדוֹשׁ וְאַל יֹאבַד גּוֹי קָדוֹשׁ הַמְשַׁלְּ֒שִׁים בְּשָׁלשׁ קְדֻשּׁוֹת לְקָדוֹשׁ: <b>מִתְרַצֶּה</b> בְּרַחֲמִים וּמִתְפַּיֵּס בְּתַחֲנוּנִים הִתְרַצֶּה וְהִתְפַּיֵּס לְדוֹר עָנִי כִּי אֵין עוֹזֵר: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים עֲשֵׂה עִמָּֽנוּ צְדָקָה וָחֶֽסֶד וְהוֹשִׁיעֵֽנוּ: <b>וַאֲנַֽחְנוּ</b> לֺא נֵדַע מַה נַּעֲשֶׂה כִּי עָלֶֽיךָ עֵינֵֽינוּ: זְכֹר רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: יְהִי חַסְדְּךָ יְהֹוָה עָלֵֽינוּ כַּאֲשֶׁר יִחַֽלְנוּ לָךְ: אַל תִּזְכָּר לָֽנוּ עֲוֹנוֹת רִאשׁוֹנִים מַהֵר יְקַדְּמֽוּנוּ רַחֲמֶֽיךָ כִּי דַלּֽוֹנוּ מְאֹד: חָנֵּֽנוּ יְהֹוָה חָנֵּֽנוּ כִּי־רַב שָׂבַֽעְנוּ בוּז: בְּרֺֽגֶז רַחֵם תִּזְכּוֹר: כִּי הוּא יָדַע יִצְרֵֽנוּ זָכוּר כִּי עָפָר אֲנָֽחְנוּ: עָזְרֵֽנוּ אֱלֺהֵי יִשְׁעֵֽנוּ עַל־דְּבַר כְּבוֹד־שְׁמֶֽךָ וְהַצִּילֵֽנוּ וְכַפֵּר עַל־חַטֹּאתֵֽינוּ לְמַֽעַן שְׁמֶֽךָ:"));
  }
  if (!context.isYomKippur) {
    parts.push(p("<small>בתענית ציבור ובעשי\"ת אומרים כאן אבינו מלכנו. גודל מעלת אבינו מלכנו הובא בספרים. ויסדה רבי עקיבא. ונתקן כנגד ברכות אמצעיות דתפלת י\"ח דחול. ולפי שיש בו מעין י\"ח אין אומרים בשבת.</small> <b>אָבִֽינוּ מַלְכֵּֽנוּ</b> חָטָֽאנוּ לְפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ אֵין לָֽנוּ מֶֽלֶךְ אֶלָּא אָֽתָּה: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה עִמָּֽנוּ לְמַֽעַן שְׁמֶֽךָ: <small>בעשי\"ת:</small> אָבִֽינוּ מַלְכֵּֽנוּ חַדֵּשׁ עָלֵֽינוּ שָׁנָה טוֹבָה: <small>בתענית ציבור:</small> אָבִֽינוּ מַלְכֵּֽנוּ בָּרֵךְ עָלֵֽינוּ שָׁנָה טוֹבָה: אָבִֽינוּ מַלְכֵּֽנוּ בַּטֵּל מֵעָלֵֽינוּ כָּל גְּזֵרוֹת קָשׁוֹת: אָבִֽינוּ מַלְכֵּֽנוּ בַּטֵּל מַחְשְׁ֒בוֹת שׂוֹנְ֒אֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ הָפֵר עֲצַת אוֹיְ֒בֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ כַּלֵּה כָּל צַר וּמַשְׂטִין מֵעָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ סְתוֹם פִּיּוֹת מַשְׂטִינֵֽנוּ וּמְקַטְרְ֒גֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ כַּלֵּה דֶּֽבֶר וְחֶֽרֶב וְרָעָב וּשְׁבִי וּמַשְׁחִית וְעָוֹן וּשְׁמַד מִבְּ֒נֵי בְרִיתֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ מְנַע מַגֵּפָה מִנַּחֲלָתֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ סְלַח וּמְחַל לְכָל עֲוֹנוֹתֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ מְחֵה וְהַעֲבֵר פְּשָׁעֵֽינוּ וְחַטֹּאתֵֽינוּ מִנֶּֽגֶד עֵינֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ מְחוֹק בְּרַחֲמֶֽיךָ הָרַבִּים כָּל שִׁטְרֵי חוֹבוֹתֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ הַחֲזִירֵֽנוּ בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ שְׁלַח רְפוּאָה שְׁלֵמָה לְחוֹלֵי עַמֶּֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ קְרַע רֹֽעַ גְּזַר דִּינֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ בְּזִכָּרוֹן טוֹב לְפָנֶֽיךָ: <small>בעשרת ימי תשובה:</small> אָבִֽינוּ מַלְכֵּֽנוּ כָּתְבֵֽנוּ בְּסֵֽפֶר חַיִּים טוֹבִים: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְבֵֽנוּ בְּסֵֽפֶר גְּאֻלָּה וִישׁוּעָה: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְבֵֽנוּ בְּסֵֽפֶר פַּרְנָסָה וְכַלְכָּלָה: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְבֵֽנוּ בְּסֵֽפֶר זְכֻיּוֹת: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְבֵֽנוּ בְּסֵֽפֶר סְלִיחָה וּמְחִילָה: <small>בתענית ציבור</small> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ לְחַיִּים טוֹבִים:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ לִגְאֻלָּה וִישׁוּעָה:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ לְפַרְנָסָה וְכַלְכָּלָה:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ לִזְכֻיּוֹת:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְרֵֽנוּ לִסְלִיחָה וּמְחִילָה:</b> אָבִֽינוּ מַלְכֵּֽנוּ הַצְמַח לָֽנוּ יְשׁוּעָה בְּקָרוֹב: אָבִֽינוּ מַלְכֵּֽנוּ הָרֵם קֶֽרֶן יִשְׂרָאֵל עַמֶּֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ הָרֵם קֶֽרֶן מְשִׁיחֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ מַלֵּא יָדֵֽינוּ מִבִּרְכוֹתֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ מַלֵּא אֲסָמֵֽינוּ שָׂבָע: אָבִֽינוּ מַלְכֵּֽנוּ שְׁמַע קוֹלֵֽנוּ חוּס וְרַחֵם עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ קַבֵּל בְּרַחֲמִים וּבְרָצוֹן אֶת תְּפִלָּתֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ פְּתַח שַׁעֲרֵי שָׁמַֽיִם לִתְפִלָּתֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ זָכוֹר כִּי עָפָר אֲנָֽחְנוּ: אָבִֽינוּ מַלְכֵּֽנוּ נָא אַל תְּשִׁיבֵֽנוּ רֵיקָם מִלְּפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ תְּהֵא הַשָּׁעָה הַזֹּאת שְׁעַת רַחֲמִים וְעֵת רָצוֹן מִלְּפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ חֲמוֹל עָלֵֽינוּ וְעַל עוֹלָלֵֽינוּ וְטַפֵּֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן הֲרוּגִים עַל שֵׁם קָדְשֶֽׁךָ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן טְבוּחִים עַל יִחוּדֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן בָּאֵי בָאֵשׁ וּבַמַּֽיִם עַל קִדּוּשׁ שְׁמֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ נְקוֹם לְעֵינֵֽינוּ נִקְמַת דַּם־עֲבָדֶֽיךָ הַשָּׁפוּךְ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַעַנְךָ אִם לֺא לְמַעֲנֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַעַנְךָ וְהוֹשִׁיעֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן רַחֲמֶֽיךָ הָרַבִּים: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן שִׁמְךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא שֶׁנִּקְרָא עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים עֲשֵׂה עִמָּֽנוּ צְדָקָה וָחֶֽסֶד וְהוֹשִׁיעֵֽנוּ: <small>בשני וחמישי יאמר והוא רחום. בשאר ימים שאומרים בהם תחנון יאמר שומר ישראל.</small>"));
  }
  parts.push(hr);

  // ─── קריאת התורה ───
  if (isTorahReadingDay) {
    parts.push(p("<big><b>קְרִיאַת הַתּוֹרָה</b></big>"));
    parts.push(p("<small>משה רבינו ונביאים שעמו תקנו שיהו קורין בתורה בשני וחמישי. כדי שלא ישהו ישראל שלשה ימים בלא תורה. ושני וחמישי הם ימי רצון. שבשני עלה משרע\"ה לקבל לוחות אחרונים וירד בחמישי. ומתקנת עזרא שיהו קורין תלתא גברי. וכשמוציאין ס\"ת צריך לנהוג בו כבוד הרבה ויביט בו משעה שמוציאין אותו מהארון עד שמניחין אותו במקומו. ולא ידבר דברים ושיחה בטילה. כי זה הוא ביזוי התורה. (דה\"ח)</small> <small>כשפותחין הארון הקדוש אומרים זה:</small> <b>וַיְהִי בִּנְ֒סֹֽעַ</b> הָאָרֹן וַיּֽאמֶר משֶׁה קוּמָה יְהֹוָה וְיָפֻֽצוּ אֹיְ֒בֶֽיךָ וְיָנֻֽסוּ מְשַׂנְאֶֽיךָ מִפָּנֶֽיךָ: כִּי מִצִּיּוֹן תֵּצֵא תוֹרָה וּדְבַר יְהֹוָה מִירוּשָׁלָֽםִ: בָּרוּךְ שֶׁנָּתַן תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל בִּקְ֒דֻשָּׁתוֹ:"));
    parts.push(p("<small>איתא בזהר (ויקהל דף ר\"ו.) אר\"ש כד מפקין ס\"ת בצבורא למקרי ביה מפתחי תרעי דשמיא דרחמין ומעוררין את האהבה לעילא ואיבעי ליה לבר נש למימר הכי:</small> <b>בְּרִיךְ שְׁמֵהּ</b> דְּמָרֵֽא עָלְמָֽא. בְּרִיךְ כִּתְרָךְ וְאַתְרָךְ. יְהֵא רְעוּתָךְ עִם עַמָּךְ יִשְׂרָאֵל לְעָלַם וּפֻרְקַן יְמִינָךְ אַחֲזֵי לְעַמָּךְ בְּבֵית מַקְדְּשָׁךְ וּלְאַמְטֽוּיֵי לָֽנָא מִטּוּב נְהוֹרָךְ וּלְקַבֵּל צְלוֹתָֽנָא בְּרַחֲמִין. יְהֵא רַעֲוָא קֳדָמָךְ דְּתוֹרִיךְ לָן חַיִּין בְּטִיבֽוּ וְלֶהֱוֵי אֲנָֽא פְקִידָֽא בְּגוֹ צַדִּיקַיָּֽא לְמִרְחַם עָלַי וּלְמִנְטַר יָתִי וְיַת־כָּל־דִּי־לִי וְדִי־לְעַמָּךְ יִשְׂרָאֵל. אַנְתְּ הוּא זָן לְכֹֽלָּא וּמְפַרְנֵֽס לְכֹֽלָּא. אַנְתְּ הוּא שַׁלִּיט עַל־כֹּֽלָּא אַנְתְּ הוּא דְּשַׁלִּיט עַל־מַלְכַיָּֽא וּמַלְכוּתָֽא דִּילָךְ הִיא. אֲנָֽא עַבְדָּֽא דְקֻדְשָֽׁא בְּרִיךְ הוּא דְּסָגִֽידְנָא קַמֵּהּ וּמִקַּמֵּי דִּיקַר אוֹרַיְתֵהּ בְּכָל־עִדָּן וְעִדָּן. לָא עַל־אֱנָשׁ רָחִֽיצְנָא וְלָא עַל־בַּר־אֱלָהִין סָמִֽיכְנָא. אֶלָּֽא בֵּאלָהָא דִשְׁמַיָּֽא דְּהוּא אֱלָהָא קְשׁוֹט וְאוֹרַיְתֵהּ קְשׁוֹט וּנְבִיאֽוֹהִי קְשׁוֹט וּמַסְגֵּֽא לְמֶעְבַּֽד טָבְוָן וּקְשׁוֹט. בֵּהּ אֲנָֽא רָחִיץ וְלִשְׁמֵהּ קַדִּישָֽׁא יַקִּירָֽא אֲנָֽא אֵמַֽר תֻּשְׁבְּחָן. יְהֵא רַעֲוָא קֳדָמָךְ דְּתִפְתַּח לִבָּאי בְּאוֹרַיְתָֽא וְתַשְׁלִים מִשְׁאֲלִין דְּלִבָּאי וְלִבָּא דְכָל־עַמָּךְ יִשְׂרָאֵל לְטָב וּלְחַיִּין וְלִשְׁלָם:"));
    parts.push(p("<small>כשקורין אותו לתורה יאמר זה:</small> בָּרְ֒כוּ אֶת יְהֹוָה הַמְּ֒בֹרָךְ: <small>קהל ועולה:</small> בָּרוּךְ יְהֹוָה הַמְּ֒בֹרָךְ לְעוֹלָם וָעֶד: <small>ויאמר העולה:</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר בָּֽחַר בָּֽנוּ מִכָּל הָעַמִּים וְנָֽתַן לָֽנוּ אֶת תּוֹרָתוֹ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה: <small>לאחר הקריאה מברך:</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָֽתַן לָֽנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה:"));
    parts.push(hr);
  }

  // ─── סיום התפילה ───
  parts.push(p("<big><b>אַשְׁרֵי</b></big>"));
  parts.push(p("<b>אַשְׁרֵי</b> יוֹשְׁ֒בֵי בֵיתֶֽךָ עוֹד יְהַלְלֽוּךָ סֶּֽלָה: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֺהָיו: תְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּֽלֶךְ וַאֲבָרְ֒כָה שִׁמְךָ לְעוֹלָם וָעֶד: בְּכָל־יוֹם אֲבָרְ֒כֶֽךָ וַאֲהַלְלָה שִׁמְךָ לְעוֹלָם וָעֶד: גָּדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְלִגְ֒דֻלָּתוֹ אֵין חֵֽקֶר: דּוֹר לְדוֹר יְשַׁבַּח מַעֲשֶׂיךָ וּגְבוּרֹתֶֽיךָ יַגִּֽידוּ: הֲדַר כְּבוֹד הוֹדֶֽךָ וְדִבְרֵי נִפְלְ֒אֹתֶֽיךָ אָשִֽׂיחָה: וֶעֱזוּז נוֹרְ֒אוֹתֶֽיךָ יֹאמֵֽרוּ וּגְדֻלָּתְ֒ךָ אֲסַפְּ֒רֶֽנָּה: זֵֽכֶר רַב־טוּבְ֒ךָ יַבִּֽיעוּ וְצִדְ֒קָתְ֒ךָ יְרַנֵּֽנוּ: חַנּוּן וְרַחוּם יְהֹוָה אֶֽרֶךְ אַפַּֽיִם וּגְדָל־חָֽסֶד: טוֹב־יְהֹוָה לַכֹּל וְרַחֲמָיו עַל־כָּל־מַעֲשָׂיו: יוֹדֽוּךָ יְהֹוָה כָּל־מַעֲשֶֽׂיךָ וַחֲסִידֶֽיךָ יְבָרְ֒כֽוּכָה: כְּבוֹד מַלְכוּתְ֒ךָ יֹאמֵֽרוּ וּגְבוּרָתְ֒ךָ יְדַבֵּֽרוּ: לְהוֹדִֽיעַ לִבְנֵי הָאָדָם גְּבוּרֹתָיו וּכְבוֹד הֲדַר מַלְכוּתוֹ: מַלְכוּתְ֒ךָ מַלְכוּת כָּל־עֹלָמִים וּמֶמְשַׁלְתְּ֒ךָ בְּכָל־דּוֹר וָדֹר: סוֹמֵךְ יְהֹוָה לְכָל־הַנֹּפְ֒לִים וְזוֹקֵף לְכָל־הַכְּ֒פוּפִים: עֵינֵי־כֹל אֵלֶֽיךָ יְשַׂבֵּֽרוּ וְאַתָּה נוֹתֵן־לָהֶם אֶת־אָכְלָם בְּעִתּוֹ: פּוֹתֵֽחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: צַדִּיק יְהֹוָה בְּכָל־דְּרָכָיו וְחָסִיד בְּכָל־מַעֲשָׂיו: קָרוֹב יְהֹוָה לְכָל־קֹרְ֒אָיו לְכֹל אֲשֶׁר יִקְרָאֻֽהוּ בֶאֱמֶת: רְצוֹן־יְרֵאָיו יַעֲשֶׂה וְאֶת־שַׁוְעָתָם יִשְׁמַע וְיוֹשִׁיעֵם: שׁוֹמֵר יְהֹוָה אֶת־כָּל־אֹהֲבָיו וְאֵת כָּל־הָרְ֒שָׁעִים יַשְׁמִיד: תְּהִלַּת יְהֹוָה יְדַבֶּר פִּי וִיבָרֵךְ כָּל־בָּשָׂר שֵׁם קָדְשׁוֹ לְעוֹלָם וָעֶד: וַאֲנַֽחְנוּ נְבָרֵךְ יָהּ מֵעַתָּה וְעַד־עוֹלָם הַלְ֒לוּיָהּ:"));
  parts.push(p("<small>מה שתקנו סדר קדושה בסוף התפלה בעבור עמי הארץ המאחרים לבא לתפלה שלא יפסידו שמיעת הקדושה. דאמרינן בשלהי סוטה אמאי קאי עלמא אסדרא דקדושה ואיהא שמיה רבה דאגדתא. ולכך תקנו לתרגם סדר קדושה זה כדי שיבינו עמי הארץ שאין מכירים לדבר בלשון הקדש אלא בלשון תרגום שהיו רגילין לדבר בו באותו זמן. (אבודרהם)</small> <b>וּבָא לְצִיּוֹן</b> גּוֹאֵל וּלְשָׁבֵי פֶֽשַׁע בְּיַעֲקֹב נְאֻם יְהֹוָה: וַאֲנִי זֹאת בְּרִיתִי אֹתָם אָמַר יְהֹוָה רוּחִי אֲשֶׁר עָלֶֽיךָ וּדְבָרַי אֲשֶׁר שַֽׂמְתִּי בְּפִֽיךָ לֺא יָמֽוּשׁוּ מִפִּֽיךָ וּמִפִּי זַרְעֲךָ וּמִפִּי זֶֽרַע זַרְעֲךָ אָמַר יְהֹוָה מֵעַתָּה וְעַד עוֹלָם: <b>וְאַתָּה קָדוֹשׁ</b> יוֹשֵׁב תְּהִלּוֹת יִשְׂרָאֵל: וְקָרָא זֶה אֶל זֶה וְאָמַר: <b>קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהֹוָה צְבָאוֹת מְלֺא כָל הָאָֽרֶץ כְּבוֹדוֹ</b>: וּמְ֒קַבְּ֒לִין דֵּין מִן דֵּין וְאָמְ֒רִין קַדִּישׁ בִּשְׁ֒מֵי מְרוֹמָא עִלָּאָה בֵּית שְׁכִינְתֵּהּ קַדִּישׁ עַל אַרְעָא עוֹבַד גְּבוּרְתֵּהּ קַדִּישׁ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא יְהֹוָה צְבָאוֹת, מַלְיָא כָל אַרְעָא זִיו יְקָרֵהּ: וַתִּשָּׂאֵֽנִי רֽוּחַ וָאֶשְׁמַע אַחֲרַי קוֹל רַֽעַשׁ גָּדוֹל: <b>בָּרוּךְ כְּבוֹד יְהֹוָה מִמְּ֒קוֹמוֹ</b>: וּנְ֒טָלַתְנִי רוּחָא וּשְׁמָעִית בַּתְרַי קָל זִֽיעַ סַגִּיא דִּמְ֒שַׁבְּ֒חִין וְאָמְ֒רִין בְּרִיךְ יְקָרָא דַיהוָֹה מֵאֲתַר בֵּית שְׁכִינְתֵּהּ: <b>יְהֹוָה יִמְלֺךְ לְעוֹלָם וָעֶד</b>: יְהֹוָה מַלְכוּתֵהּ קָאֵים לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא: יְהֹוָה אֱלֺהֵי אַבְרָהָם יִצְחָק וְיִשְׂרָאֵל אֲבוֹתֵֽינוּ שָׁמְ֒רָה זֹאת לְעֹלָם לְיֵֽצֶר מַחְשְׁ֒בוֹת לְבַב עַמֶּֽךָ וְהָכֵן לְבָבָם אֵלֶֽיךָ: וְהוּא רַחוּם יְכַפֵּר עָוֹן וְלֺא יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֺא יָעִיר כָּל חֲמָתוֹ: כִּי אַתָּה אֲדֹנָי טוֹב וְסַלָּח וְרַב חֶֽסֶד לְכָל קֹרְ֒אֶֽיךָ: צִדְ֒קָתְ֒ךָ צֶֽדֶק לְעוֹלָם וְתוֹרָתְ֒ךָ אֱמֶת: תִּתֵּן אֱמֶת לְיַעֲקֹב חֶֽסֶד לְאַבְרָהָם אֲשֶׁר נִשְׁבַּֽעְתָּ לַאֲבוֹתֵֽינוּ מִֽימֵי קֶֽדֶם: בָּרוּךְ אֲדֹנָי יוֹם יוֹם יַעֲמָס לָֽנוּ הָאֵל יְשׁוּעָתֵֽנוּ סֶֽלָה: יְהֹוָה צְבָאוֹת עִמָּֽנוּ מִשְׂגָּב לָֽנוּ אֱלֺהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: בָּרוּךְ הוּא אֱלֺהֵֽינוּ שֶׁבְּ֒רָאָֽנוּ לִכְ֒בוֹדוֹ וְהִבְדִּילָֽנוּ מִן הַתּוֹעִים וְנָֽתַן לָֽנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ הוּא יִפְתַּח לִבֵּֽנוּ בְּתוֹרָתוֹ וְיָשֵׂם בְּלִבֵּֽנוּ אַהֲבָתוֹ וְיִרְאָתוֹ וְלַעֲשׂוֹת רְצוֹנוֹ וּלְעָבְ֒דוֹ בְּלֵבָב שָׁלֵם לְמַֽעַן לֺא נִיגַע לָרִיק וְלֺא נֵלֵד לַבֶּהָלָה: יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ וֵאלֺהֵי אֲבוֹתֵֽינוּ שֶׁנִּשְׁמֹר חֻקֶּֽיךָ בָּעוֹלָם הַזֶּה וְנִזְכֶּה וְנִחְיֶה וְנִרְאֶה וְנִירַשׁ טוֹבָה וּבְרָכָה לִשְׁ֒נֵי יְמוֹת הַמָּשִֽׁיחַ וּלְחַיֵּי הָעוֹלָם הַבָּא: לְמַֽעַן יְזַמֶּרְ֒ךָ כָבוֹד וְלֺא יִדֹּם יְהֹוָה אֱלֺהַי לְעוֹלָם אוֹדֶֽךָּ: בָּרוּךְ הַגֶּֽבֶר אֲשֶׁר יִבְטַח בַּיהוָֹה וְהָיָה יְהֹוָה מִבְטַחוֹ: בִּטְ֒חוּ בַיהוָֹה עֲדֵי עַד כִּי בְּיָהּ יְהֹוָה צוּר עוֹלָמִים: וְיִבְטְחוּ בְךָ יוֹדְ֒עֵי שְׁמֶֽךָ כִּי לֺא עָזַֽבְתָּ דֹרְ֒שֶֽׁיךָ יְהֹוָה: יְהֹוָה חָפֵץ לְמַֽעַן צִדְקוֹ יַגְדִּיל תּוֹרָה וְיַאְדִּיר:"));
  parts.push(hr);

  // ─── הלל ───
  if (isHallelDay) {
    parts.push(p("<big><b>הַלֵּל</b></big>"));
    parts.push(p("<small>אומרים הלל שלם בחגים ובחנוכה, חצי הלל בראשי חודשים ובאחרון של פסח</small>"));
    parts.push(hr);
  }

  // ─── שיר של יום ───
  parts.push(p("<big><b>שִׁיר שֶׁל יוֹם</b></big>"));
  parts.push(p("<small>בכל יום אומר המזמור השייך לאותו יום</small>"));
  {
    var sodArr = [
      "<small>מזמור ליום ראשון</small> הַיּוֹם יוֹם אֶחָד בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>לְדָוִ֗ד</b> <small>(תהלים כ\"ד)</small> מִ֫זְמ֥וֹר לַֽ֭יהֹוָה הָאָ֣רֶץ וּמְלוֹאָ֑הּ תֵּ֝בֵ֗ל וְיֹ֣שְׁבֵי בָֽהּ׃ כִּי־ה֭וּא עַל־יַמִּ֣ים יְסָדָ֑הּ וְעַל־נְ֝הָר֗וֹת יְכוֹנְנֶֽהָ׃ מִֽי־יַעֲלֶ֥ה בְהַר־יְהֹוָ֑ה וּמִי־יָ֝קוּם בִּמְק֥וֹם קׇדְשֽׁוֹ׃ נְקִ֥י כַפַּ֗יִם וּֽבַר־לֵ֫בָ֥ב אֲשֶׁ֤ר ׀ לֹא־נָשָׂ֣א לַשָּׁ֣וְא נַפְשִׁ֑י וְלֹ֖א נִשְׁבַּ֣ע לְמִרְמָֽה׃ יִשָּׂ֣א בְ֭רָכָה מֵאֵ֣ת יְהֹוָ֑ה וּ֝צְדָקָ֗ה מֵאֱלֹהֵ֥י יִשְׁעֽוֹ׃ זֶ֭ה דּ֣וֹר דֹּרְשָׁ֑ו מְבַקְשֵׁ֨י פָנֶ֖יךָ יַעֲקֹ֣ב סֶֽלָה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וְֽ֭הִנָּשְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָב֗וֹא מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֥י זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְ֭הֹוָה עִזּ֣וּז וְגִבּ֑וֹר יְ֝הֹוָ֗ה גִּבּ֥וֹר מִלְחָמָֽה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וּ֭שְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָבֹ֗א מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֤י ה֣וּא זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְהֹוָ֥ה צְבָא֑וֹת הֽוּא מֶ֝לֶךְ הַכָּב֣וֹד סֶֽלָה׃",
      "<small>מזמור ליום שני</small> הַיּוֹם יוֹם שֵׁנִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>שִׁ֥יר</b> <small>(תהלים מ\"ח)</small> מִ֝זְמ֗וֹר לִבְנֵי־קֹֽרַח׃ גָּ֘ד֤וֹל יְהֹוָ֣ה וּמְהֻלָּ֣ל מְאֹ֑ד בְּעִ֥יר אֱ֝לֹהֵ֗ינוּ הַר־קׇדְשֽׁוֹ׃ יְפֵ֥ה נוֹף֮ מְשׂ֢וֹשׂ כׇּל־הָ֫אָ֥רֶץ הַר־צִ֭יּוֹן יַרְכְּתֵ֣י צָפ֑וֹן קִ֝רְיַ֗ת מֶ֣לֶךְ רָֽב׃ אֱלֹהִ֥ים בְּאַרְמְנוֹתֶ֗יהָ נוֹדַ֥ע לְמִשְׂגָּֽב׃ כִּ֤י זֶ֨ה ׀ אֱלֹהִ֣ים אֱ֭לֹהֵינוּ עוֹלָ֣ם וָעֶ֑ד ה֖וּא יְנַהֲגֵ֣נוּ עַל־מֽוּת׃",
      "<small>מזמור ליום שלישי</small> הַיּוֹם יוֹם שְׁלִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>מִזְמ֗וֹר</b> <small>(תהלים פ\"ב)</small> לְאָ֫סָ֥ף אֱֽלֹהִ֗ים נִצָּ֥ב בַּעֲדַת־אֵ֑ל בְּקֶ֖רֶב אֱלֹהִ֣ים יִשְׁפֹּֽט׃ עַד־מָתַ֥י תִּשְׁפְּטוּ־עָ֑וֶל וּפְנֵ֥י רְ֝שָׁעִ֗ים תִּשְׂאוּ־סֶֽלָה׃ קוּמָ֣ה אֱ֭לֹהִים שׇׁפְטָ֣ה הָאָ֑רֶץ כִּֽי־אַתָּ֥ה תִ֝נְחַ֗ל בְּכׇל־הַגּוֹיִֽם׃",
      "<small>מזמור ליום רביעי</small> הַיּוֹם יוֹם רְבִיעִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>אֵל־נְקָמ֥וֹת</b> <small>(תהלים צ\"ד)</small> יְהֹוָ֑ה אֵ֖ל נְקָמ֣וֹת הוֹפִֽיעַ׃ הִ֭נָּשֵׂא שֹׁפֵ֣ט הָאָ֑רֶץ הָשֵׁ֥ב גְּ֝מ֗וּל עַל־גֵּאִֽים׃ עַד־מָתַ֖י רְשָׁעִ֥ים ׀ יְהֹוָ֑ה עַד־מָ֝תַ֗י רְשָׁעִ֥ים יַעֲלֹֽזוּ׃ כִּ֤י ׀ לֹא־יִטֹּ֣שׁ יְהֹוָ֣ה עַמּ֑וֹ וְ֝נַחֲלָת֗וֹ לֹ֣א יַעֲזֹֽב׃ וַיְהִ֬י יְהֹוָ֣ה לִ֣י לְמִשְׂגָּ֑ב וֵ֝אלֹהַ֗י לְצ֣וּר מַחְסִֽי׃",
      "<small>מזמור ליום חמישי</small> הַיּוֹם יוֹם חֲמִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>לַמְנַצֵּ֬חַ</b> <small>(תהלים פ\"א)</small> עַֽל־הַגִּתִּ֬ית לְאָסָֽף׃ הַ֭רְנִינוּ לֵאלֹהִ֣ים עוּזֵּ֑נוּ הָ֝רִ֗יעוּ לֵאלֹהֵ֥י יַעֲקֹֽב׃ שְֽׂאוּ־זִ֭מְרָה וּתְנוּ־תֹ֑ף כִּנּ֖וֹר נָעִ֣ים עִם־נָֽבֶל׃ אָֽנֹכִ֨י ׀ יְהֹ֘וָ֤ה אֱלֹהֶ֗יךָ הַֽ֭מַּעַלְךָ מֵאֶ֣רֶץ מִצְרָ֑יִם הַרְחֶב־פִּ֗֝יךָ וַאֲמַלְאֵֽהוּ׃ לוּ עַ֭מִּי שֹׁמֵ֣עַֽ לִ֑י יִ֝שְׂרָאֵ֗ל בִּדְרָכַ֥י יְהַלֵּֽכוּ׃ וַֽ֭יַּאֲכִילֵהוּ מֵחֵ֣לֶב חִטָּ֑ה וּ֝מִצּ֗וּר דְּבַ֣שׁ אַשְׂבִּיעֶֽךָ׃",
      "<small>מזמור ליום ששי</small> הַיּוֹם יוֹם הַשִּׁשִּׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<small>(תהלים צ\"ג)</small> יְהֹוָ֣ה מָלָךְ֮ גֵּא֢וּת לָ֫בֵ֥שׁ לָבֵ֣שׁ יְ֭הֹוָה עֹ֣ז הִתְאַזָּ֑ר אַף־תִּכּ֥וֹן תֵּ֝בֵ֗ל בַּל־תִּמּֽוֹט׃ נָכ֣וֹן כִּסְאֲךָ֣ מֵאָ֑ז מֵעוֹלָ֣ם אָֽתָּה׃ עֵֽדֹתֶ֨יךָ ׀ נֶאֶמְנ֬וּ מְאֹ֗ד לְבֵיתְךָ֥ נַאֲוָה־קֹ֑דֶשׁ יְ֝הֹוָ֗ה לְאֹ֣רֶךְ יָמִֽים׃",
      "<small>מזמור ליום שבת</small> הַיּוֹם יוֹם שַׁבַּת קֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>מִזְמ֗וֹר</b> שִׁ֧יר לְי֣וֹם הַשַּׁבָּ֑ת <small>(תהלים צ\"ב)</small> טוֹב֗ לְהֹד֥וֹת לַ֝יהֹוָ֗ה וּלְזַמֵּ֥ר לְשִׁמְךָ֗ עֶלְיֽוֹן׃ לְהַגִּ֗יד בַּבֹּ֥קֶר חַסְדֶּ֑ךָ וֶֽ֝אֱמֽוּנָתְךָ֗ בַּלֵּילֽוֹת׃ כִּ֤י שִׂמַּחְתַּ֥נִי יְהֹוָ֗ה בְּפׇעֳלֶ֑ךָ בְּֽמַעֲשֵׂ֖י יָדֶ֣יךָ אֲרַנֵּֽן׃ צַדִּ֡יק כַּתָּמָ֣ר יִ֭פְרָח כְּאֶ֣רֶז בַּלְּבָנ֑וֹן יִשְׂגֶּֽה׃ שְׁ֭תוּלִים בְּבֵ֣ית יְהֹוָ֑ה בְּחַצְר֥וֹת אֱ֝לֹהֵ֗ינוּ יַפְרִֽיחוּ׃ לְ֭הַגִּיד כִּי־יָשָׁ֣ר יְהֹוָ֑ה צוּרִ֗֝י וְלֹא־עַוְלָ֥תָה בּֽוֹ׃"
    ];
    var todayDowIdx = (dow === 6) ? 6 : dow;
    parts.push(p(sodArr[todayDowIdx * 2]));
    parts.push(p(sodArr[todayDowIdx * 2 + 1]));
  }
  parts.push(hr);

  // ─── עלינו ───
  parts.push(p("<big><b>עָלֵינוּ לְשַׁבֵּחַ</b></big>"));
  parts.push(p("<b>עָלֵֽינוּ</b> לְשַׁבֵּֽחַ לַאֲדוֹן הַכֹּל לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית שֶׁלֺּא עָשָֽׂנוּ כְּגוֹיֵי הָאֲרָצוֹת וְלֺא שָׂמָֽנוּ כְּמִשְׁפְּחוֹת הָאֲדָמָה שֶׁלֺּא שָׂם חֶלְקֵֽנוּ כָּהֶם וְגוֹרָלֵֽנוּ כְּכָל הֲמוֹנָם: שֶׁהֵם מִשְׁתַּחֲוִים לָהֶֽבֶל וָרִיק וּמִתְפַּלְּ֒לִים אֶל אֵל לֹא יוֹשִֽׁיעַ, וַאֲנַֽחְנוּ כּוֹרְ֒עִים וּמִשְׁתַּחֲוִים וּמוֹדִים לִפְנֵי מֶֽלֶךְ מַלְכֵי הַמְּ֒לָכִים הַקָּדוֹשׁ בָּרוּךְ הוּא, שֶׁהוּא נוֹטֶה שָׁמַֽיִם וְיוֹסֵד אָֽרֶץ, וּמוֹשַׁב יְקָרוֹ בַּשָּׁמַֽיִם מִמַּֽעַל, וּשְׁ֒כִינַת עֻזּוֹ בְּגָבְ֒הֵי מְרוֹמִים, הוּא אֱלֺהֵֽינוּ אֵין עוֹד, אֱמֶת מַלְכֵּֽנוּ אֶֽפֶס זוּלָתוֹ כַּכָּתוּב בְּתוֹרָתוֹ וְיָדַעְתָּ הַיּוֹם וַהֲשֵׁבֹתָ אֶל לְבָבֶֽךָ כִּי יְהֹוָה הוּא הָאֱלֺהִים בַּשָּׁמַֽיִם מִמַּֽעַל וְעַל הָאָֽרֶץ מִתָּֽחַת אֵין עוֹד: <b>עַל כֵּן</b> נְקַוֶּה לְךָ יְהֹוָה אֱלֺהֵֽינוּ לִרְאוֹת מְהֵרָה בְּתִפְאֶֽרֶת עֻזֶּֽךָ לְהַעֲבִיר גִּלּוּלִים מִן הָאָֽרֶץ וְהָאֱלִילִים כָּרוֹת יִכָּרֵתוּן לְתַקֵּן עוֹלָם בְּמַלְכוּת שַׁדַּי וְכָל בְּנֵי בָשָׂר יִקְרְאוּ בִשְׁ֒מֶֽךָ, לְהַפְנוֹת אֵלֶֽיךָ כָּל רִשְׁ֒עֵי אָֽרֶץ, יַכִּֽירוּ וְיֵדְ֒עוּ כָּל יוֹשְׁ֒בֵי תֵבֵל כִּי לְךָ תִכְרַע כָּל בֶּֽרֶךְ תִּשָּׁבַע כָּל לָשׁוֹן: לְפָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ יִכְרְעוּ וְיִפֹּֽלוּ, וְלִכְ֒בוֹד שִׁמְךָ יְקָר יִתֵּֽנוּ, וִיקַבְּ֒לוּ כֻלָּם אֶת עֹל מַלְכוּתֶֽךָ, וְתִמְלֺךְ עֲלֵיהֶם מְהֵרָה לְעוֹלָם וָעֶד, כִּי הַמַּלְכוּת שֶׁלְּ֒ךָ הִיא וּלְעֽוֹלְ֒מֵי עַד תִּמְלוֹךְ בְּכָבוֹד, כַּכָּתוּב בְּתוֹרָתֶֽךָ יְהֹוָה יִמְלֺךְ לְעֹלָם וָעֶד: וְנֶאֱמַר וְהָיָה יְהֹוָה לְמֶֽלֶךְ עַל כָּל הָאָֽרֶץ בַּיּוֹם הַהוּא יִהְיֶה יְהֹוָה אֶחָד וּשְׁמוֹ אֶחָד:"));
  parts.push(hr);

  return {
    html: '<div class="prayer-richtext">' + parts.join("") + "</div>",
    sourceLabel: "מאגר פנימי – נוסח אשכנז",
    sourceUrl: "",
  };
}


function buildShacharitSfaradPayload(context) {
  function p(t) { return "<p>" + t + "</p>"; }
  function sup(html) { return '<div class="prayer-supplement">' + html + "</div>"; }
  var hr = '<hr class="prayer-divider">';

  var context2 = context || {};
  var displayDate = context2.displayDate || new Date();
  var dow = displayDate.getDay();
  var isMonThu = (dow === 1 || dow === 4);
  var isTachanunDay = !context2.isRoshChodesh && !context2.isChanukah &&
    !context2.isPurim && !context2.isPesach && !context2.isShavuot &&
    !context2.isSukkot && !context2.isRoshHaShana && !context2.isYomKippur &&
    !context2.isShabbat;
  var isHallelDay = context2.isRoshChodesh || context2.isChanukah ||
    context2.isPesach || context2.isShavuot || context2.isSukkot;
  var isTorahReadingDay = isMonThu || context2.isShabbat || context2.isRoshChodesh ||
    context2.isPesach || context2.isShavuot || context2.isSukkot ||
    context2.isRoshHaShana || context2.isYomKippur;
  var isRoshChodeshOrShabbat = context2.isRoshChodesh || context2.isShabbat;
  var isFallSeason = (function() {
    var m = displayDate.getMonth(); // 0=Jan
    // Elul (Aug-Sep) through Hoshana Raba (Oct) — approx month 7-9
    return (m >= 7 && m <= 9);
  })();
  var parts = [];

  // ─── ברכות השחר ───
  parts.push(p("<big><b>בִּרְכּוֹת הַשַּׁחַר</b></big>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל נְטִילַת יָדָֽיִם: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר יָצַר אֶת הָאָדָם בְּחָכְמָה וּבָֽרָא בוֹ נְקָבִים נְקָבִים חֲלוּלִים חֲלוּלִים גָּלוּי וְיָדֽוּעַ לִפְנֵי כִסֵּא כְבוֹדֶֽךָ שֶׁאִם יִפָּתֵֽחַ אֶחָד מֵהֶם אוֹ יִסָּתֵם אֶחָד מֵהֶם אִי אֶפְשַׁר לְהִתְקַיֵּם וְלַעֲמֹד לְפָנֶֽיךָ אֲפִילוּ שָׁעָה אֶחָת. בָּרוּךְ אַתָּה יְהֹוָה רוֹפֵא כָל בָּשָׂר וּמַפְלִיא לַעֲשׂוֹת: אֱלֹהַי, נְשָׁמָה שֶׁנָּתַֽתָּ בִּי טְהוֹרָה הִיא אַתָּה בְרָאתָהּ אַתָּה יְצַרְתָּהּ אַתָּה נְפַחְתָּהּ בִּי וְאַתָּה מְשַׁמְּ֒רָהּ בְּקִרְבִּי וְאַתָּה עָתִיד לִטְּ֒לָהּ מִמֶּֽנִּי וּלְהַחֲזִירָהּ בִּי לֶעָתִיד לָבֹא, כָּל זְמַן שֶׁהַנְּ֒שָׁמָה בְקִרְבִּי מוֹדֶה אֲנִי לְפָנֶֽיךָ יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי רִבּוֹן כָּל הַמַּעֲשִׂים אֲדוֹן כָּל הַנְּ֒שָׁמוֹת: בָּרוּךְ אַתָּה יְהֹוָה הַמַּחֲזִיר נְשָׁמוֹת לִפְגָרִים מֵתִים:"));
  parts.push(hr);

  // ─── ברכות התורה ───
  parts.push(p("<big><b>בִּרְכּוֹת הַתּוֹרָה</b></big>"));
  parts.push(p("<b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר קִדְּ֒שָֽׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לַעֲסֹק בְּדִבְרֵי תוֹרָה: וְהַעֲרֶב נָא יְהֹוָה אֱלֹהֵֽינוּ אֶת דִּבְרֵי תוֹרָתְ֒ךָ בְּפִֽינוּ וּבְפִי עַמְּ֒ךָ בֵּית יִשְׂרָאֵל וְנִהְיֶה אֲנַחְנוּ וְצֶאֱצָאֵינוּ וְצֶאֱצָאֵי צֶאֱצָאֵינוּ עַמְּ֒ךָ בֵּית יִשְׂרָאֵל כֻּלָּֽנוּ יוֹדְ֒עֵי שְׁמֶֽךָ וְלוֹמְ֒דֵי תוֹרָתֶֽךָ לִשְׁמָהּ: בָּרוּךְ אַתָּה יְהֹוָה הַמְלַמֵּד תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר בָּֽחַר בָּֽנוּ מִכָּל הָעַמִּים וְנָֽתַן לָֽנוּ אֶת תּוֹרָתוֹ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה: <b>וַיְדַבֵּר</b> יְהֹוָה אֶל מֹשֶׁה לֵאמֹר דַבֵּר אֶל אַהֲרֹן וְאֶל בָּנָיו לֵאמֹר כֹּה תְבָרְכוּ אֶת בְּנֵי יִשְׂרָאֵל אָמוֹר לָהֶם: <b>יְבָרֶכְ֒ךָ</b> יְהֹוָה וְיִשְׁמְרֶֽךָ: יָאֵר יְהֹוָה פָּנָיו אֵלֶֽיךָ וִיחֻנֶּֽךָּ: יִשָּׂא יְהֹוָה פָּנָיו אֵלֶֽיךָ וְיָשֵׂם לְךָ שָׁלוֹם: <b>וְשָׂמוּ</b> אֶת שְׁמִי עַל בְּנֵי יִשְׂרָאֵל וַאֲנִי אַבָרְכֵם: <b>אֵֽלּוּ דְבָרִים</b> שֶׁאֵין לָהֶם שִׁעוּר הַפֵּאָה וְהַבִּכּוּרִים וְהָרְ֒אָיוֹן וּגְמִילוּת חֲסָדִים וְתַלְמוּד תּוֹרָה: אֵֽלּוּ דְבָרִים שֶׁאָדָם אוֹכֵל פֵּרוֹתֵיהֶם בָּעוֹלָם הַזֶּה וְהַקֶּֽרֶן קַיֶּֽמֶת לָעוֹלָם הַבָּא, וְאֵֽלּוּ הֵן כִּבּוּד אָב וָאֵם וּגְמִילוּת חֲסָדִים וְהַשְׁכָּמַת בֵּית הַמִּדְרָשׁ שַׁחֲרִית וְעַרְבִית וְהַכְנָסַת אוֹרְ֒חִים וּבִקּוּר חוֹלִים וְהַכְנָסַת כַּלָּה וּלְוָיַת הַמֵּת וְעִיּוּן תְּפִלָּה וַהֲבָאַת שָׁלוֹם בֵּין אָדָם לַחֲבֵרוֹ ובֵין אִישׁ לְאִשְׁתּוֹ וְתַלְמוּד תּוֹרָה כְּנֶֽגֶד כֻּלָּם: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַּנוֹתֵן לַשֶּֽׂכְוִי בִינָה לְהַבְחִין בֵּין יוֹם וּבֵין לָֽיְלָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי גּוֹי: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי עָֽבֶד: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁלֹּא עָשַֽׂנִי אִשָּׁה: <small>נשים אומרות:</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁעָשַֽׂנִי כִּרְצוֹנוֹ: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם פּוֹקֵֽחַ עִוְרִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם מַלְבִּישׁ עֲרֻמִּים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם מַתִּיר אֲסוּרִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם זוֹקֵף כְּפוּפִים: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם רוֹקַע הָאָֽרֶץ עַל הַמָּֽיִם: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַמֵּכִין מִצְעֲדֵי גָֽבֶר: <small>בט' אב ויוה\"כ אין אומרים ברכה זו:</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם שֶׁעָשָׂה לִי כָּל צָרְכִּי: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אוֹזֵר יִשְׂרָאֵל בִּגְבוּרָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם עוֹטֵר יִשְׂרָאֵל בְּתִפְאָרָה: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַנּוֹתֵן לַיָּעֵף כֹּֽחַ: <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַמַּעֲבִיר שֵׁנָה מֵעֵינָי וּתְנוּמָה מֵעַפְעַפָּי: וִיהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתַּרְגִּילֵֽנוּ בְּתוֹרָתֶֽךָ וְדַבְּ֒קֵֽנוּ בְּמִצְוֹתֶֽיךָ, וְאַל תְּבִיאֵֽנוּ לֹא לִידֵי חֵטְא וְלֹא לִידֵי עֲבֵרָה וְעָוֹן וְלֹא לִידֵי נִסָּיוֹן וְלֹא לִידֵי בִזָּיוֹן וְאַל יִשְׁלֹט בָּֽנוּ יֵֽצֶר הָרָע וְהַרְחִיקֵֽנוּ מֵאָדָם רָע וּמֵחָבֵר רָע וְדַבְּ֒קֵֽנוּ בְּיֵֽצֶר הַטּוֹב וּבְמַעֲשִׂים טוֹבִים וְכוֹף אֶת יִצְרֵֽנוּ לְהִשְׁתַּעְבֶּד־לָךְ וּתְנֵֽנוּ הַיּוֹם וּבְכָל יוֹם לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים בְּעֵינֶֽיךָ וּבְעֵינֵי כָל רוֹאֵֽינוּ וְתִגְמְ֒לֵֽנוּ חֲסָדִים טוֹבִים: בָּרוּךְ אַתָּה יְהֹוָה הַגּוֹמֵל חֲסָדִים טוֹבִים לְעַמּוֹ יִשְׂרָאֵל: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי שֶׁתַּצִּילֵֽנִי הַיּוֹם וּבְכָל יוֹם מֵעַזֵּי פָנִים וּמֵעַזּוּת פָּנִים מֵאָדָם רָע וּמֵחָבֵר רָע וּמִשָּׁכֵן רָע וּמִפֶּֽגַע רָע מֵעַֽיִן הָרָע, מִלָּשׁוֹן הָרָע, מִמַּלְשִׁינוּת.  מֵעֵדוּת שֶֽׁקֶר, מִשִּׂנְאַת הַבְּ֒רִיּוֹת, מֵעֲלִילָה, מִמִּיתָה מְשׁוּנָה, מֵחֳלָיִם רָעִים, וּמִמִּקְרִים רָעִים  וּמִשָּׂטָן הַמַּשְׁחִית מִדִּין קָשֶׁה וּמִבַּֽעַל דִּין קָשֶׁה, בֵּין שֶׁהוּא בֶן בְּרִית וּבֵין שֶׁאֵינוֹ בֶן בְּרִית, וּמִדִּינָהּ שֶׁל גֵּיהִנֺּם:"));
  parts.push(hr);

  // ─── תפילות הבוקר ───
  parts.push(p("<big><b>תְּפִלּוֹת הַבֹּקֶר</b></big>"));
  parts.push(p("<b>אֱלֹהֵֽינוּ</b> וֵאלֹהֵי אֲבוֹתֵֽינוּ זָכְ֒רֵֽנוּ בְּזִכָּרוֹן טוֹב לְפָנֶֽיךָ וּפָקְ֒דֵֽנוּ בִּפְקֻדַּת יְשׁוּעָה וְרַחֲמִים מִשְּׁ֒מֵי שְׁמֵי קֶֽדֶם וּזְכָר לָֽנוּ יְהֹוָה אֱלֹהֵֽינוּ אַהֲבַת הַקַּדְמוֹנִים אַבְרָהָם יִצְחָק וְיִשְׂרָאֵל עֲבָדֶֽיךָ אֶת הַבְּ֒רִית וְאֶת הַחֶֽסֶד וְאֶת הַשְּׁ֒בוּעָה שֶׁנִּשְׁבַּֽעְתָּ לְאַבְרָהָם אָבִֽינוּ בְּהַר הַמֹּרִיָּה וְאֶת הָעֲקֵדָה שֶׁעָקַד אֶת יִצְחָק בְּנוֹ עַל גַּבֵּי הַמִּזְבֵּֽחַ כַּכָּתוּב בְּתוֹרָתֶֽךָ: <b>וַיְהִי</b> אַחַר הַדְּ֒בָרִים הָאֵֽלֶּה וְהָאֱלֹהִים נִסָּה אֶת־אַבְרָהָם וַיֹּֽאמֶר אֵלָיו אַבְרָהָם וַיֹּֽאמֶר הִנֵּֽנִי: וַיֹּֽאמֶר קַח־נָא אֶת־בִּנְךָ אֶת־יְחִידְ֒ךָ אֲשֶׁר־אָהַֽבְתָּ אֶת־יִצְחָק וְלֶךְ־לְךָ אֶל־אֶֽרֶץ הַמֹּרִיָּה וְהַעֲלֵֽהוּ שָׁם לְעֹלָה עַל אַחַד הֶהָרִים אֲשֶׁר אֹמַר אֵלֶֽיךָ: וַיַּשְׁכֵּם אַבְרָהָם בַּבֹּֽקֶר וַיַּחֲבשׁ אֶת־חֲמֹרוֹ וַיִּקַּח אֶת־שְׁנֵי נְעָרָיו אִתּוֹ וְאֵת יִצְחָק בְּנוֹ וַיְבַקַּע עֲצֵי עֹלָה וַיָּֽקָם וַיֵּֽלֶךְ אֶל־הַמָּקוֹם אֲשֶׁר־אָֽמַר־לוֹ הָאֱלֹהִֽים: בַּיּוֹם הַשְּׁ֒לִישִׁי וַיִּשָּׂא אַבְרָהָם אֶת־עֵינָיו וַיַּרְא אֶת־הַמָּקוֹם מֵרָחֹק: וַיֹּֽאמֶר אַבְרָהָם אֶל־נְעָרָיו שְׁבוּ־לָכֶם פֹּה עִם־הַחֲמוֹר וַאֲנִי וְהַנַּֽעַר נֵלְ֒כָה עַד־כֹּה וְנִשְׁתַּחֲוֶה וְנָשֽׁוּבָה אֲלֵיכֶם: וַיִּקַּח אַבְרָהָם אֶת־עֲצֵי הָעֹלָה וַיָּֽשֶׂם עַל־יִצְחָק בְּנוֹ וַיִּקַּח בְּיָדוֹ אֶת־הָאֵשׁ וְאֶת־הַמַּאֲכֶֽלֶת וַיֵּלְ֒כוּ שְׁנֵיהֶם יַחְדָּו: וַיֹּֽאמֶר יִצְחָק אֶל־אַבְרָהָם אָבִיו וַיֹּֽאמֶר אָבִי וַיֹּֽאמֶר הִנֶּֽנִּי בְנִי וַיֹּֽאמֶר הִנֵּה הָאֵשׁ וְהָעֵצִים וְאַיֵּה הַשֶּׂה לְעֹלָֽה: וַיֹּֽאמֶר אַבְרָהָם אֱלֹהִים יִרְאֶה־לּוֹ הַשֶּׂה לְעֹלָה בְּנִי וַיֵּלְ֒כוּ שְׁנֵיהֶם יַחְדָּו: וַיָּבֹֽאוּ אֶל־הַמָּקוֹם אֲשֶׁר אָֽמַר־לוֹ הָאֱלֹהִים וַיִּֽבֶן שָׁם אַבְרָהָם אֶת־הַמִּזְבֵּֽחַ וַיַּעֲרֹךְ אֶת־הָעֵצִים וַיַּעֲקֹד אֶת־יִצְחָק בְּנוֹ וַיָּֽשֶׂם אֹתוֹ עַל־הַמִּזְבֵּֽחַ מִמַּֽעַל לָעֵצִים: וַיִּשְׁלַח אַבְרָהָם אֶת־יָדוֹ וַיִּקַּח אֶת־הַמַּאֲכֶֽלֶת לִשְׁחֹט אֶת־בְּנוֹ: וַיִּקְרָא אֵלָיו מַלְאַךְ יְהֹוָה מִן־הַשָּׁמַֽיִם וַיֹּֽאמֶר אַבְרָהָם אַבְרָהָם וַיֹּֽאמֶר הִנֵּֽנִי: וַיֹּֽאמֶר אַל־תִּשְׁלַח יָֽדְ֒ךָ אֶל־הַנַּֽעַר וְאַל־תַּֽעַשׂ לוֹ מְאוּמָה כִּי עַתָּה יָדַֽעְתִּי כִּי־יְרֵא אֱלֹהִים אַֽתָּה וְלֹא חָשַֽׂכְתָּ אֶת־בִּנְךָ אֶת־יְחִידְ֒ךָ מִמֶּֽנִּי: וַיִּשָּׂא אַבְרָהָם אֶת־עֵינָיו וַיַּרְא וְהִנֵּה־אַֽיִל אַחַר נֶאֱחַז בַּסְּ֒בַךְ בְּקַרְנָיו וַיֵּֽלֶךְ אַבְרָהָם וַיִּקַּח אֶת־הָאַֽיִל וַיַּעֲלֵֽהוּ לְעֹלָה תַּֽחַת בְּנוֹ: וַיִּקְרָא אַבְרָהָם שֵׁם־הַמָּקוֹם הַהוּא יְהֹוָה יִרְאֶה אֲשֶׁר יֵאָמֵר הַיּוֹם בְּהַר יְהֹוָה יֵרָאֶה: וַיִּקְרָא מַלְאַךְ יְהֹוָה אֶל־אַבְרָהָם שֵׁנִית מִן־הַשָּׁמָֽיִם: וַיֹּאמֶר בִּי נִשְׁבַּֽעְתִּי נְאֻם־יְהֹוָה כִּי יַֽעַן אֲשֶׁר עָשִֽׂיתָ אֶת־הַדָּבָר הַזֶּה וְלֹא חָשַֽׂכְתָּ אֶת־בִּנְךָ אֶת־יְחִידֶֽךָ: כִּי־בָרֵךְ אֲבָרֶכְ֒ךָ וְהַרְבָּה אַרְבֶּה אֶת־זַרְעֲךָ כְּכוֹכְ֒בֵי הַשָּׁמַֽיִם וְכַחוֹל אֲשֶׁר עַל־שְׂפַת הַיָּם וְיִרַשׁ זַרְעֲךָ אֵת שַֽׁעַר אֹיְ֒בָיו: וְהִתְבָּרְ֒כוּ בְזַרְעֲךָ כֹּל גּוֹיֵי הָאָֽרֶץ עֵֽקֶב אֲשֶׁר שָׁמַֽעְתָּ בְּקֹלִי: וַיָּֽשָׁב אַבְרָהָם אֶל־נְעָרָיו וַיָּקֻֽמוּ וַיֵּלְ֒כוּ יַחְדָּו אֶל־בְּאֵר שָֽׁבַע וַיֵּֽשֶׁב אַבְרָהָם בִּבְאֵר שָֽׁבַע: <small>ביום שאין אומרים תחנון אין אומרים זה:</small> <b>רִבּוֹנוֹ שֶׁל עוֹלָם</b> כְּמוֹ שֶׁכָּבַשׁ אַבְרָהָם אָבִינוּ אֶת רַחֲמָיו לַעֲשׂוֹת רְצוֹנְ֒ךָ בְּלֵבָב שָׁלֵם, כֵּן יִכְבְּ֒שׁוּ רַחֲמֶיךָ אֶת כַּעַסְךָ מֵעָלֵינוּ, וְיָגֺֽלּוֹ רַחֲמֶֽיךָ עַל מִדּוֹתֶֽיךָ: וְתִתְנַהֵג עִמָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בְּמִדַּת הַחֶֽסֶד וּבְמִדַּת הָרַחֲמִים, וּבְטוּבְ֒ךָ הַגָּדוֹל יָשׁוּב חֲרוֹן אַפְּ֒ךָ מֵעַמְּ֒ךָ וּמֵעִירְ֒ךָ וּמֵאַרְצְ֒ךָ וּמִנַחֲלָתֶֽךָ: וְקַיֶם לָֽנוּ יְהֹוָה אֱלֹהֵֽינוּ אֶת הַדָּבָר שֶׁהִבְטַחְתָּֽנוּ בְּתוֹרָתֶֽךָ, עַל יְדֵי משֶׁה עַבְדֶּֽךָ כָּאָמוּר. וְזָכַרְתִּי אֶת בְּרִיתִי יַעֲקוֹב וְאַף אֶת בְּרִיתִי יִצְחָק, וְאַף אֶת בְּרִיתִי אַבְרָהָם אֶזְכֹּר וְהָאָֽרֶץ אֶזְכֹּר: וְנֶאֱמַר, וְאַף גַּם זֹאת  בִּהְיוֹתָם בְּאֶֽרֶץ אֹיְ֒בֵיהֶם לֹא מְאַסְתִּים וְלֹא גְעַלְתִּים לְכַלּוֹתָם לְהָפֵר בְּרִיתִי אִתָּם כִּי אֲנִי יְהֹוָה אֱלֹהֵיהֶם: וְנֶאֱמַר וְזָכַרְתִּי לָהֶם בְּרִית רִאשֺׁנִים אֲשֶׁר הוֹצֵֽאתִי אֹתָם מֵאֶֽרֶץ מִצְרַֽיִם, לְעֵינֵי הַגּוֹיִם לִהְיוֹת לָהֶם לֵאלֹהִים, אֲנִי יְהֹוָה.  וְנֶאֶמַר וְשָׁב יְהֹוָה אֱלֹהֶֽיךָ אֶת שְׁבוּתְ֒ךָ וְרִחֲמֶֽךָ, וְשָׁב וְקִבֶּצְךָ מִכָּל הָעַמִּים, אֲשֶׁר הֱפִיצְ֒ךָ יְהֹוָה אֱלֹהֶֽיךָ שָֽׁמָּה. אִם יִהְיֶה נִדַּחֲךָ בִּקְצֵה הַשָּׁמָֽיִם מִשָּׁם יְקַבֶּצְךָ יְהֹוָה אֶלֹהֶֽיךָ וּמִשָּׁם יִקָּחֶֽךָ: וְנֶאֶמַר וֶהֱבִיאֲךָ יְהֹוָה אֱלֹהֶֽיךָ אֶל הָאָֽרֶץ אֲשֶׁר יָרְ֒שׁוּ אֲבֹתֶֽיךָ וִירִשְׁתָּהּ וְהֵיטִבְ֒ךָ וְהִרְבְּ֒ךָ מֵאֲבֹתֶֽיךָ: וְנֶאֱמַר עַל יְדֵי נְבִיאֶֽךָ, יְהֹוָה חָנֵֽנוּ, לְךָ קִוִּֽינוּ הֱיֵה זְרוֹעָם לַבְּ֒קָרִים, אַף יְשׁוּעָתֵֽנוּ בְּעֵת צָרָה: וְנֶאֱמַר, וְעֵת צָרָה הִיא לְיַעֲקֹב וּמִמֶּֽנָּה יִוָּשֵֽׁעַ: וְנֶאֱמַר בְּכָל־צָרָתָם לוֹ צָר וּמַלְאַךְ פָּנָיו הוֹשִׁיעָם, בְּאַהֲבָתוֹ וּבְחֶמְלָתוֹ הוּא גְאָלָם וַיְנַטְּ֒לֵם וַיְנַשְּׂ֒אֵם כָּל־יְמֵי עוֹלָם: וְנֶאֱמַר, מִי אֵל כָּמֽוֹךָ נֹשֵׂא עָוֺן וְעֹבֵר עַל־פֶּֽשַׁע, לִשְׁאֵרִית נַחֲלָתוֹ לֹא־הֶחֱזִיק לָעַד אַפּוֹ, כִּי חָפֵץ חֶֽסֶד הוּא: יָשׁוּב יְרַחְמֵֽנוּ יִכְבּוֹשׁ עֲוֺנוֹתֵֽינוּ, וְתַשְׁלִיךְ בִּמְצוּלוֹת יָם כָּל־חַטֹּאתָם: תִּתֵּן אֱמֶת לְיַעֲקֹב חֶֽסֶד לְאַבְרָהָם אֲשֶׁר נִשְׁבַּֽעְתָּ לַאֲבוֹתֵֽינוּ מִֽימֵי קֶֽדֶם: וְנֶאֱמַר, וַהֲבִיאוֹתִים אֶל־הַר קָדְשִׁי וְשִׂמַּחְתִּים בְּבֵית תְּפִלָּתִי עוֹלוֹתֵיהֶם וְזִבְחֵיהֶם לְרָצוֹן עַל מִזְבְּחִי, כִּי בֵיתִי בֵּית־תְּפִלָּה, יִקָּרֵא  לְכָל הָעַמִּים: <b>לְעוֹלָם</b> יְהֵא אָדָם יְרֵא שָׁמַֽיִם בַּסֵּֽתֶר וּבַגָּלוּי וּמוֹדֶה עַל הָאֱמֶת וְדוֹבֵר אֱמֶת בִּלְבָבוֹ וְיַשְׁכֵּם וְיֹאמַר: <b>רִבּוֹן</b> כָּל הָעוֹלָמִים וַאֲדוֹנֵי הָאֲדוֹנִים, לֹא עַל צִדְקוֹתֵֽינוּ אֲנַֽחְנוּ מַפִּילִים תַּחֲנוּנֵֽינוּ לְפָנֶֽיךָ כִּי עַל רַחֲמֶֽיךָ הָרַבִּים, מָה אָֽנוּ מֶה חַיֵּֽינוּ מֶה חַסְדֵּֽנוּ, מַה צִּדְקוֹתֵֽינוּ, מַה יְּשׁוּעָתֵֽנוּ, מַה כֹּחֵֽנוּ מַה גְּבוּרָתֵֽנוּ, מַה נֹּאמַר לְפָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ הֲלֹא כָּל הַגִּבּוֹרִים כְּאַֽיִן לְפָנֶֽיךָ וְאַנְשֵׁי הַשֵּׁם כְּלֹא הָיוּ וַחֲכָמִים כִּבְלִי מַדָּע וּנְבוֹנִים כִּבְלִי הַשְׂכֵּל כִּי רוֹב מַעֲשֵׂיהֶם תֹּֽהוּ וִימֵי חַיֵּיהֶם הֶֽבֶל לְפָנֶֽיךָ, וּמוֹתַר הָאָדָם מִן הַבְּ֒הֵמָה אָֽיִן כִּי הַכֹּל הָֽבֶל: לְבַד הַנְשָׁמָה הַטְּ֒הוֹרָה שֶׁהִיא עֲתִידָה לִתֵּן דִּין וְחֶשְׁבּוֹן לִפְנֵי כִסֵּא כְבוֹדֶֽךָ וְכָל הַגּוֹיִם כְּאַֽיִן נֶגְדֶּֽךָ שֶׁנֶּאֶמַר הֵן גּוֹיִם כְּמַר מִדְּ֒לִי וּכְשַֽׁחַק מֹאזְ֒נַֽיִם נֶחְשָֽׁבוּ הֵן אִיִּים כַּדַּק יִטּוֹל: <b>אֲבָל</b> אֲנַֽחְנוּ עַמְּ֒ךָ בְּנֵי בְרִיתֶֽךָ, בְּנֵי אַבְרָהָם אֹהַבְךָ שֶׁנִּשְׁבַּֽעְתָּ לּוֹ בְּהַר הַמֹּרִיָּה, זֶֽרַע יִצְחָק יְחִידוֹ שֶׁנֶּעֱקַד עַל גַּבֵּי הַמִּזְבֵּֽחַ, עֲדַת יַעֲקֹב בִּנְךָ בְּכוֹרֶֽךָ שֶׁמֵּאַהֲבָתְ֒ךָ שֶׁאָהַֽבְתָּ אוֹתוֹ וּמִשִּׂמְחָתְ֒ךָ שֶׁשָּׂמַֽחְתָּ בּוֹ קָרָֽאתָ אֶת שְׁמוֹ יִשְׂרָאֵל וִישֻׁרוּן: <b>לְפִיכָךְ</b> אֲנַֽחְנוּ חַיָּבִים לְהוֹדוֹת לְךָ וּלְשַׁבֵּחֲךָ וּלְפָאֶרְךָ וּלְבָרֵךְ וּלְקַדֵּשׁ וְלִתֵּן שֶֽׁבַח וְהוֹדָיָה לִשְׁמֶֽךָ: אַשְׁרֵֽינוּ מַה טּוֹב חֶלְקֵֽנוּ וּמַה נָּעִים גּוֹרָלֵֽנוּ וּמַה יָּפָה יְרֻשָּׁתֵֽנוּ: אַשְׁרֵֽינוּ כְּשֶׁאָֽנוּ מַשְׁכִּימִים וּמַעֲרִיבִים בְּבָתֵּי כְנֵסִיּוֹת וּבְבָתֵּי מִדְרָשׁוֹת וּמְיַחֲדִים שִׁמְךָ בְּכָל־יוֹם תָּמִיד וְאוֹמְ֒רִים פַּעֲמַֽיִם בְּאַהֲבָה: <b>שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵֽינוּ יְהֹוָה אֶחָד:</b> <small>ויאמר בלחש:</small> בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד: וְאָהַבְתָּ אֵת יְהֹוָה אֱלֹהֶֽיךָ בְּכָל֯־לְ֯בָבְךָ וּבְכָל־נַפְשְׁךָ וּבְכָל־מְאֹדֶֽךָ: וְהָיוּ הַדְּ֒בָרִים הָאֵֽלֶּה אֲשֶׁר֯ אָ֯נֹכִי מְצַוְּךָ הַיּוֹם עַל֯־לְ֯בָבֶֽךָ: וְשִׁנַּנְתָּם לְבָנֶֽיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּ֒ךָ בְּבֵיתֶֽךָ וּבְלֶכְתְּ֒ךָ בַדֶּֽרֶךְ וּבְשָׁכְבְּ֒ךָ וּבְקוּמֶֽךָ: וּקְשַׁרְתָּם לְאוֹת עַל֯־יָ֯דֶֽךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶֽיךָ: וּכְתַבְתָּם עַל־מְזֻזוֹת בֵּיתֶֽךָ וּבִשְׁעָרֶֽיךָ: <b>אַתָּה הוּא</b> עַד שֶׁלֹּא נִבְרָא הָעוֹלָם, אַתָּה הוּא מִשֶּׁנִּבְרָא הָעוֹלָם, אַתָּה הוּא בָּעוֹלָם הַזֶּה וְאַתָּה הוּא לָעוֹלָם הַבָּא, קַדֵּשׁ אֶת שִׁמְךָ עַל מַקְדִּישֵׁי שְׁמֶֽךָ וְקַדֵּשׁ אֶת שִׁמְךָ בְּעֺלָמֶֽךָ, וּבִישׁוּעָתְ֒ךָ תָּרוּם וְתַגְבִּֽיהַּ קַרְנֵֽנוּ לְמַֽעְלָה, וְהוֹשִׁיעֵֽנוּ בְּקָרוֹב לְמַֽעַן שְׁמֶֽךָ. בָּרוּךְ הַמְקַדֵּשׁ שְׁמוֹ בָּרַבִּים: <b>אַתָּה הוּא</b> יְהֹוָה אֱלֹהֵֽינוּ בַּשָּׁמַֽיִם וּבָאָֽרֶץ וּבִשְׁמֵי הַשָּׁמַֽיִם הָעֶלְיוֹנִים, אֱמֶת אַתָּה הוּא רִאשׁוֹן וְאַתָּה הוּא אַחֲרוֹן וּמִבַּלְעָדֶֽיךָ אֵין אֱלֹהִים: קַבֵּץ נְפוּצוֹת קֺוֶֽיךָ מֵאַרְבַּע כַּנְ֒פוֹת הָאָֽרֶץ, יַכִּֽירוּ וְיֵדְ֒עוּ כָּל בָּאֵי עוֹלָם כִּי אַתָּה הוּא הָאֱלֹהִים לְבַדְּ֒ךָ עֶלְיוֹן לְכֹל מַמְלְ֒כוֹת הָאָֽרֶץ, אַתָּה עָשִֽׂיתָ אֶת הַשָּׁמַֽיִם וְאֶת הָאָֽרֶץ אֶת הַיָּם וְאֶת כָּל אֲשֶׁר בָּם וּמִי בְּכָל מַעֲשֵׂה יָדֶֽיךָ בָּעֶלְיוֹנִים אוֹ בַתַּחְתּוֹנִים שֶׁיֹּאמַר לְךָ מַה תַּעֲשֶׂה, ומַה תִּפְעָל אָבִינוּ שֶׁבַּשָּׁמַֽיִם חַי וְקַיָם עֲשֵׂה עִמָּֽנוּ צְדָקָה וָחֶֽסֶד בַּעֲבוּר שִׁמְךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא שֶׁנִּקְרָא עָלֵֽינוּ וְקַיֶּם־לָֽנוּ יְהֺוָה אֶלֹהֵֽינוּ מַה־שֶּׁכָּתוּב, אֶת הַדָבָר שֶׁהִבְטַחְתָּֽנוּ עַל יְדֵי צְפַנְיָה חוֹזָךְ כָּאָמוּר, בָּעֵת הַהִיא אָבִיא אֶתְכֶם וּבָעֵת קַבְּ֒צִי אֶתְכֶם כִּי־אֶתֵּן אֶתְכֶם לְשֵׁם וְלִתְהִלָּה בְּכֹל עַמֵּי הָאָֽרֶץ בְּשׁוּבִי אֶת־שְׁבוּתֵיכֶם לְעֵינֵיכֶם אָמַר יְהֹוָה:"));
  parts.push(hr);

  // ─── קרבנות ───
  parts.push(p("<big><b>פָּרָשַׁת הַקָּרְבָּנוֹת</b></big>"));
  parts.push(p("<small>אמרו חכמים (מנחות קי.) מאי דכתיב זאת תורת החטאת וזאת תורת האשם. כל העוסק בתורת חטאת כאילו הקריב חטאת וכל העוסק בתורת אשם כאילו הקריב אשם. ולכן אין די באמירת הפסוקים לבד אלא יתבונן בטעמי הקרבנות ובדיניהם כפי השגתו.</small> <b>וַיְדַבֵּר</b> יְהֹוָה אֶל־משֶׁה לֵּאמֹר: וְעָשִֽׂיתָ כִּיּוֹר נְחֽשֶׁת וְכַנּוֹ נְחֽשֶׁת לְרָחְצָה וְנָתַתָּ אֹתוֹ בֵּין־אֹֽהֶל מוֹעֵד וּבֵין הַמִּזְבֵּֽחַ וְנָתַתָּ שָֽׁמָּה מָֽיִם: וְרָחֲצוּ אַהֲרֹן וּבָנָיו מִמֶּֽנּוּ אֶת־יְדֵיהֶם וְאֶת־רַגְלֵיהֶם: בְּבֹאָם אֶל־אֹֽהֶל מוֹעֵד יִרְחֲצוּ־מַֽיִם וְלֹא יָמֻֽתוּ אוֹ בְגִשְׁתָּם אֶל־הַמִּזְבֵּֽחַ לְשָׁרֵת לְהַקְטִיר אִשֶּׁה לַיהוָֹה: וְרָחֲצוּ יְדֵיהֶם וְרַגְלֵיהֶם וְלֹא יָמֻֽתוּ וְהָיְ֒תָה לָהֶם חָק־עוֹלָם לוֹ וּלְזַרְעוֹ לְדֹרֹתָם: <small>תרומת הדשן קודמת לכל עבודות לפיכך יאמר פרשת תרומת הדשן קודם פרשת התמיד. ואומרה אף שלא האיר היום.</small> <b>וַיְדַבֵּר</b> יְהֹוָה אֶל־משֶׁה לֵּאמֹר: צַו אֶת־אַהֲרֹן וְאֶת־בָּנָיו לֵאמֹר זֹאת תּוֹרַת הָעֹלָה הִוא הָעֹלָה עַל מוֹקְ֒דָה עַל־הַמִּזְבֵּֽחַ כָּל־הַלַּֽיְלָה עַד־הַבֹּֽקֶר וְאֵשׁ הַמִּזְבֵּֽחַ תּוּקַד בּוֹ: וְלָבַשׁ הַכֹּהֵן מִדּוֹ בַד וּמִכְנְ֒סֵי־בַד יִלְבַּשׁ עַל־בְּשָׂרוֹ וְהֵרִים אֶת־הַדֶּֽשֶׁן אֲשֶׁר תֹּאכַל הָאֵשׁ אֶת הָעֹלָה עַל־הַמִּזְבֵּֽחַ וְשָׂמוֹ אֵֽצֶל הַמִּזְבֵּֽחַ: וּפָשַׁט אֶת־בְּגָדָיו וְלָבַשׁ בְּגָדִים אֲחֵרִים וְהוֹצִיא אֶת־הַדֶּֽשֶׁן אֶל־מִחוּץ לַמַּחֲנֶה אֶל־מָקוֹם טָהוֹר: וְהָאֵשׁ עַל־הַמִּזְבֵּֽחַ תּֽוּקַד־בּוֹ לֹא תִכְבֶּה וּבִעֵר עָלֶֽיהָ הַכֹּהֵן עֵצִים בַּבֹּֽקֶר בַּבֹּֽקֶר וְעָרַךְ עָלֶֽיהָ הָעֹלָה וְהִקְטִיר עָלֶֽיהָ חֶלְבֵי הַשְּׁ֒לָמִים: אֵשׁ תָּמִיד תּוּקַד עַל־הַמִּזְבֵּֽחַ לֹא תִכְבֶּה: <small>אומרים פרשת התמיד. ואם אי אפשר לאומרה בצבור יכול לאומרה בביתו ולחזור לקרותה עם הצבור. ויכוין בפעם השנייה כקורא בתורה (טור). יש מי שמצריך לעמוד בשעת אמירת הקרבנות, דהקרבת קרבן אינו אלא בעמידה (מגן אברהם).</small> <small>יש שאין אומרים 'יהי רצון' בשבת ויום טוב</small> <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁתְּ֒רַחֵם עָלֵֽינוּ וְתִמְחָל לָֽנוּ עַל כָּל חַטֹּאתֵֽינוּ וּתְכַפֶּר לָֽנוּ אֶת כָּל עֲוֹנוֹתֵֽינוּ וְתִסְלַח לָֽנוּ עַל־כָּל פְּשָׁעֵֽינוּ וְשֶׁתִּבְנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵֽינוּ וְנַקְרִיב לְפָנֶֽיךָ קָרְבַּן הַתָּמִיד שֶׁיְּ֒כַפֵּר בַּעֲדֵֽנוּ כְּמוֹ שֶׁכָּתַֽבְתָּ עָלֵֽינוּ בְּתוֹרָתֶֽךָ, עַל יְדֵי משֶׁה עַבְדֶּֽךָ, מִפִּי כְבוֹדֶֽךָ כָּאָמוּר: <b>וַיְדַבֵּר</b> יְהֹוָה אֶל־משֶׁה לֵּאמֹר: צַו אֶת־בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם אֶת־קָרְבָּנִי לַחְמִי לְאִשַּׁי רֵֽיחַ נִיחֹחִי תִּשְׁמְ֒רוּ לְהַקְרִיב לִי בְּמוֹעֲדוֹ: וְאָמַרְתָּ לָהֶם זֶה הָאִשֶּׁה אֲשֶׁר תַּקְרִֽיבוּ לַיהוָֹה כְּבָשִׂים בְּנֵי־שָׁנָה תְמִימִם שְׁנַֽיִם לַיּוֹם עֹלָה תָמִיד: אֶת־הַכֶּֽבֶשׂ אֶחָד תַּעֲשֶׂה בַבֹּֽקֶר וְאֵת הַכֶּֽבֶשׂ הַשֵּׁנִי תַּעֲשֶׂה בֵּין הָעַרְבָּֽיִם: וַֽעֲשִׂירִית הָאֵיפָה סֹֽלֶת לְמִנְחָה בְּלוּלָה בְּשֶֽׁמֶן כָּתִית רְבִיעִת הַהִין: עֹלַת תָּמִיד הָעֲשֻׂיָה בְּהַר סִינַי לְרֵֽיחַ נִיחֹֽחַ אִשֶּׁה לַיהוָֹה: וְנִסְכּוֹ רְבִיעִת הַהִין לַכֶּֽבֶשׂ הָאֶחָד בַּקֹּֽדֶשׁ הַסֵּךְ נֶֽסֶךְ שֵׁכָר לַיהוָֹה: וְאֵת הַכֶּֽבֶשׂ הַשֵּׁנִי תַּעֲשֶׂה בֵּין הָעַרְבָּֽיִם כְּמִנְחַת הַבֹּֽקֶר וּכְנִסְכּוֹ תַּעֲשֶׂה אִשֵּׁה רֵֽיחַ נִיחֹֽחַ לַיהוָֹה: <b>וְשָׁחַט</b> אֹתוֹ עַל יֶֽרֶךְ הַמִּזְבֵּֽחַ צָפֹֽנָה לִפְנֵי יְהֹוָה וְזָרְקוּ בְּנֵי אַהֲרֹן הַכֹּהֲנִים אֶת־דָּמוֹ עַל־הַמִּזְבֵּֽחַ סָבִיב: יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ, יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ, שֶׁתְּ֒הֵא אֲמִירָה זוּ, חֲשׁוּבָה וּמְקֻבֶּֽלֶת, וּמְרֻצָּה לְפָנֶֽיךָ, כְּאִלּוּ הִקְרַֽבְנוּ קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ, וּבִמְ֒קוֹמוֹ וּכְהִלְכָתוֹ: <b>אַתָּה הוּא</b> יְהֹוָה אֱלֹהֵֽינוּ שֶׁהִקְטִֽירוּ אֲבוֹתֵֽינוּ לְפָנֶֽיךָ אֶת קְטֹֽרֶת הַסַּמִּים בִּזְמַן שֶׁבֵּית הַמִּקְדָּשׁ הָיָה קַיָּם כַּאֲשֶׁר צִוִּיתָ אוֹתָם עַל יְדֵי משֶׁה נְבִיאֶֽךָ כַּכָּתוּב בְּתוֹרָתֶֽךָ: <b>וַיֹּֽאמֶר</b> יְהֹוָה אֶל־משֶׁה קַח־לְךָ סַמִּים נָטָף וּשְׁחֵֽלֶת וְחֶלְבְּנָה סַמִּים וּלְבֹנָה זַכָּה בַּד בְּבַד יִהְיֶה: וְעָשִֽׂיתָ אֹתָהּ קְטֹֽרֶת רֹֽקַח מַעֲשֵׂה רוֹקֵֽחַ מְמֻלָּח טָהוֹר קֹֽדֶשׁ: וְשָׁחַקְתָּ מִמֶּֽנָּה הָדֵק וְנָתַתָּה מִמֶּֽנָּה לִפְנֵי הָעֵדֻת בְּאֹֽהֶל מוֹעֵד אֲשֶׁר אִוָּעֵד לְךָ שָֽׁמָּה קֹֽדֶשׁ קָדָשִׁים תִּהְיֶה לָכֶם: וְנֶאֱמַר <b>וְהִקְטִיר</b> עָלָיו אַהֲרֹן קְטֹֽרֶת סַמִּים בַּבֹּֽקֶר בַּבֹּֽקֶר בְּהֵיטִיבוֹ אֶת־הַנֵּרֹת יַקְטִירֶֽנָּה: וּבְהַעֲלֹת אַהֲרֹן אֶת־הַנֵּרֹת בֵּין הָֽעַרְבַּֽיִם יַקְטִירֶֽנָּה קְטֹֽרֶת תָּמִיד לִפְנֵי יְהֹוָה לְדֹרֹתֵיכֶם: <b>תָּנוּ רַבָּנָן</b> פִּטּוּם הַקְּ֒טֹֽרֶת כֵּיצַד שְׁלֹש מֵאוֹת וְשִׁשִּׁים וּשְׁמוֹנָה מָנִים הָיוּ בָהּ, שְׁלֹש מֵאוֹת וְשִׁשִּׁים וַחֲמִשָּׁה כְּמִנְיַן יְמוֹת הַחַמָּה מָנֶה לְכָל יוֹם, פְּרַס בַּשַּׁחֲרִית וּפְרַס בֵּין הָעַרְבָּֽיִם, וּשְׁלשָׁה מָנִים יְתֵרִים שֶׁמֵּהֶם מַכְנִיס כֹּהֵן גָּדוֹל מְלֹא חָפְנָיו בְּיוֹם הַכִּפּוּרִים, וּמַחֲזִירָן לְמַכְתֶּֽשֶׁת בְּעֶֽרֶב יוֹם הַכִּפּוּרִים, וְשׁוֹחֲקָן יָפֶה יָפֶה כְּדֵי שֶׁתְּ֒הֵא דַקָּה מִן הַדַּקָּה, וְאַחַד עָשָׂר סַמָּנִים הָֽיוּ בָהּ, וְאֵֽלּוּ הֵן הַצֳּרִי וְהַצִּפֹּֽרֶן הַחֶלְבְּנָה וְהַלְּ֒בוֹנָה מִשְׁקַל שִׁבְעִים שִׁבְעִים מָנֶה, מוֹר וּקְצִיעָה שִׁבֹּֽלֶת נֵרְדְּ וְכַרְכֹּם מִשְׁקַל שִׁשָּׁה עָשָׂר שִׁשָּׁה עָשָׂר מָנֶה, הַקּשְׁטְ שְׁנֵים עָשָׂר וְקִלּוּפָה שְׁלשָׁה וְקִנָּמוֹן תִּשְׁעָה, בֹּרִית כַּרְשִׁינָה תִּשְׁעָה קַבִּין, יֵין קַפְרִיסִין סְאִין תְּלָתָא וְקַבִּין תְּלָתָא, וְאִם אֵין לוֹ יֵין קַפְרִיסִין מֵבִיא חֲמַר חִוַּרְיָן עַתִּיק, מֶֽלַח סְדוֹמִית רֹֽבַע הַקָּב, מַעֲלֶה עָשָׁן כָּל שֶׁהוּא, רַבִּי נָתָן הַבַּבְלִי אוֹמֵר אַף כִּפַּת הַיַּרְדֵּן כָּל שֶׁהוּא, וְאִם נָֽתַן בָּהּ דְּבַשׁ פְּסָלָהּ וְאִם חִסַּר אַחַת מִכָּל סַמָּנֶֽיהָ חַיָּב מִיתָה: <b>רַבָּן</b> שִׁמְעוֹן בֶּן גַּמְלִיאֵל אוֹמֵר הַצֳּרִי אֵינוֹ אֶלָּא שְׂרָף הַנּוֹטֵף מֵעֲצֵי הַקְּ֒טָף, בֹּרִית כַּרְשִׁינָה שֶׁשָׁפִין בָּה אֶת הַצִפֹּרֶן כִּדֵי שֶׁתְּ֒הֵא נָאָה יֵין קַפְרִיסִין שֶׁשׁוֹרִין בּוֹ אֶת הַצִפֹּרֶן כְּדֵי שֶׁתְּ֒הֵא עַזָּה, וַהֲלֹא מֵי רַגְלַֽיִם יָפִין לָהּ אֶלָּא שֶׁאֵין מַכְנִיסִין מֵי רַגְלַֽיִם בַּמִּקְדָּשׁ מִפְּנֵי הַכָּבוֹד: <b>תַּנְיָא</b> רַבִּי נָתָן אוֹמֵר כְּשֶׁהוּא שׁוֹחֵק אוֹמֵר הָדֵק הֵיטֵב הֵיטֵב הָדֵק מִפְּ֒נֵי שֶׁהַקּוֹל יָפֶה לַבְּ֒שָׂמִים, פִּטְּ֒מָהּ לַחֲצָאִין כְּשֵׁרָה לִשְׁלִישׁ וְלִרְבִֽיעַ לֹא שָׁמַֽעְנוּ: אָמַר רַבִּי יְהוּדָה זֶה הַכְּ֒לָל אִם כְּמִדָּתָהּ כְּשֵׁרָה לַחֲצָאִין וְאִם חִסַּר אַחַת מִכָּל סַמָּנֶֽיהָ חַיָּב מִיתָה: <b>תַּנְיָא</b> בַּר קַפָּרָא אוֹמֵר אַחַת לְשִׁשִּׁים אוֹ לְשִׁבְעִים שָׁנָה הָיְ֒תָה בָאָה שֶׁל שִׁירַֽיִם לַחֲצָאִין: וְעוֹד תָּנֵי בַּר קַפָּרָא אִלּוּ הָיָה נוֹתֵן בָּהּ קוֹרְ֒טוֹב שֶׁל דְּבַשׁ אֵין אָדָם יָכוֹל לַעֲמֹד מִפְּ֒נֵי רֵיחָהּ וְלָֽמָּה אֵין מְעָרְ֒בִין בָּהּ דְּבַשׁ מִפְּ֒נֵי שֶׁהַתּוֹרָה אָמְ֒רָה כִּי כָל־שְׂאֹר וְכָל־דְּבַשׁ לֹא־תַקְטִֽירוּ מִמֶּֽנּוּ אִשֶּׁה לַיהוָֹה: <small>אומר ג' פעמים:</small> יְהֹוָה צְבָאוֹת עִמָּֽנוּ מִשְׂגַּב־לָֽנוּ אֱלֹהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: אַתָּה סֵֽתֶר לִי מִצַּר תִּצְּ֒רֵֽנִי רָנֵּי פַלֵּט תְּסוֹבְ֒בֵֽנִי סֶֽלָה: וְעָרְ֒בָה לַיהוָֹה מִנְחַת יְהוּדָה וִירוּשָׁלָֽםִ כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמֹנִיּוֹת: <b>אַבַּיֵּי</b> הֲוָה מְסַדֵּר סֵֽדֶר הַמַּעֲרָכָה מִשְּׁ֒מָא דִגְמָרָא וְאַלִּבָּא דְאַבָּא שָׁאוּל, מַעֲרָכָה גְדוֹלָה קוֹדֶֽמֶת לְמַעֲרָכָה שְׁנִיָּה שֶׁל קְטֹֽרֶת, וּמַעֲרָכָה שְׁנִיָּה שֶׁל קְטֹֽרֶת קוֹדֶֽמֶת לְסִדּוּר שְׁנֵי גִזְרֵי עֵצִים, וְסִדּוּר שְׁנֵי גִזְרֵי עֵצִים קֽוֹדֶם לְדִשּׁוּן מִזְבֵּֽחַ הַפְּ֒נִימִי, וְדִשּׁוּן מִזְבֵּֽחַ הַפְּ֒נִימִי קֽוֹדֶם לְהַטָּבַת חָמֵשׁ נֵרוֹת, וְהַטָּבַת חָמֵשׁ נֵרוֹת קוֹדֶֽמֶת לְדַם הַתָּמִיד, וְדַם הַתָּמִיד קֽוֹדֶם לְהַטָּבַת שְׁתֵּי נֵרוֹת, וְהַטָּבַת שְׁתֵּי נֵרוֹת קוֹדֶֽמֶת לִקְטֹֽרֶת, וּקְטֹֽרֶת קוֹדֶֽמֶת לְאֵבָרִים, וְאֵבָרִים לְמִנְחָה, וּמִנְחָה לַחֲבִתִּין, וַחֲבִתִּין לִנְסָכִין, וּנְסָכִין לְמוּסָפִין, וּמוּסָפִין לְבָזִיכִין, וּבָזִיכִין קוֹדְ֒מִין לְתָמִיד שֶׁל בֵּין הָעַרְבָּֽיִם, שֶׁנֶּאֱמַר וְעָרַךְ עָלֶֽיהָ הָעֹלָה וְהִקְטִיר עָלֶֽיהָ חֶלְבֵי הַשְּׁ֒לָמִים, עָלֶֽיהָ הַשְׁלֵם כָּל הַקָּרְבָּנוֹת כֻּלָּם: <small>ואח\"כ יאמר תפלת רבי נחוניא בן הקנה:</small> <b>אָֽנָּא</b> בְּכֹֽחַ גְּדֻלַּת יְמִינְ֒ךָ תַּתִּיר צְרוּרָה: קַבֵּל רִנַּת עַמְּ֒ךָ שַׂגְּ֒בֵֽנוּ טַהֲרֵֽנוּ נוֹרָא: נָא גִבּוֹר דּוֹרְ֒שֵׁי יִחוּדְ֒ךָ כְּבָבַת שָׁמְ֒רֵם: בָּרְ֒כֵם טַהֲרֵם רַחֲמֵם צִדְקָתְ֒ךָ תָּמִיד גָּמְ֒לֵם: חֲסִין קָדוֹשׁ בְּרֹב טוּבְ֒ךָ נַהֵל עֲדָתֶֽךָ: יָחִיד גֵּאֶה לְעַמְּ֒ךָ פְּנֵה, זוֹכְ֒רֵי קְדֻשָּׁתֶֽךָ: שַׁוְעָתֵֽנוּ קַבֵּל וּשְׁמַע צַעֲקָתֵֽנוּ יוֹדֵֽעַ תַּעֲלוּמוֹת: בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד: <b>רִבּוֹן הָעוֹלָמִים</b> אַתָּה צִוִּיתָֽנוּ לְהַקְרִיב קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ וְלִהְיוֹת כֹּהֲנִים בַּעֲבוֹדָתָם וּלְוִיִּם בְּדוּכָנָם וְיִשְׂרָאֵל בְּמַעֲמָדָם, וְעַתָּה בַּעֲוֹנוֹתֵֽינוּ חָרַב בֵּית הַמִּקְדָּשׁ וּבֻטַּל הַתָּמִיד וְאֵין לָֽנוּ לֹא כֹהֵן בַּעֲבוֹדָתוֹ וְלֹא לֵוִי בְּדוּכָנוֹ וְלֹא יִשְׂרָאֵל בְּמַעֲמָדוֹ. לָכֵן יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁיְּ֒הֵא שִֽׂיחַ שִׂפְתוֹתֵֽינוּ חָשׁוּב וּמְקֻבָּל וּמְרֻצֶּה לְפָנֶֽיךָ כְּאִלּוּ הִקְרַֽבְנוּ קָרְבַּן הַתָּמִיד בְּמוֹעֲדוֹ וְעָמַֽדְנוּ עַל מַעֲמָדוֹ. כְּמָה שֶׁנֶּאֱמַר וּנְשַׁלְּ֒מָה פָרִים שְׂפָתֵֽינוּ: וְנֶאֶמַר וְשָׁחַט אֹתוֹ עַל יֶֽרֶךְ הַמִּזְבֵּֽחַ צָפֹֽנָה לִפְנֵי יְהֹוָה וְזָרְ֒קוּ בְּנֵי אַהֲרֹן הַכֹּהֲנִים אֶת־דָּמוֹ עַל־הַמִּזְבֵּֽחַ סָבִיב: וְנֶאֱמַר זֹאת הַתּוֹרָה לָעֹלָה לַמִּנְחָה וְלַחַטָּאת וְלָאָשָׁם וְלַמִּלּוּאִים וּלְזֶֽבַח הַשְּׁ֒לָמִים: <small>בראש חודש מוסיפים:</small> <b>וּבְרָאשֵׁי חָדְשֵׁיכֶם</b> תַּקְרִֽיבוּ עֹלָה לַיהוָֹה פָּרִים בְּנֵי־בָקָר שְׁנַֽיִם וְאַֽיִל אֶחָד כְּבָשִׂים בְּנֵי־שָׁנָה שִׁבְעָה תְּמִימִם: וּשְׁלשָׁה עֶשְׂרֹנִים סֹֽלֶת מִנְחָה בְּלוּלָה בַשֶּֽׁמֶן לַפָּר הָאֶחָד וּשְׁ֒נֵי עֶשְׂרֹנִים סֹֽלֶת מִנְחָה בְּלוּלָה בַשֶּֽׁמֶן לָאַֽיִל הָאֶחָד: וְעִשָּׂרֹן עִשָּׂרוֹן סֹֽלֶת מִנְחָה בְּלוּלָה בַשֶּֽׁמֶן לַכֶּֽבֶשׂ הָאֶחָד עֹלָה רֵֽיחַ נִיחֹֽחַ אִשֶּׁה לַיהוָֹה: וְנִסְכֵּיהֶם חֲצִי הַהִין יִהְיֶה לַפָּר וּשְׁלִישִׁת הַהִין לָאַֽיִל וּרְבִיעִת הַהִין לַכֶּֽבֶשׂ יָֽיִן זֹאת עֹלַת חֹֽדֶשׁ בְּחָדְשׁוֹ לְחָדְשֵׁי הַשָּׁנָה: וּשְׂעִיר עִזִּים אֶחָד לְחַטָּאת לַיהוָֹה עַל עֹלַת הַתָּמִיד יֵעָשֶׂה וְנִסְכּוֹ: <small>קבעו לשנות אחר פרשת התמיד פרק איזהו מקומן וברייתא דרבי ישמעאל כדי שיזכה כל אדם ללמוד בכל יום מקרא משנה וגמרא. דברייתא דרבי ישמעאל הוי במקום גמרא, שהמדרש כגמרא: (שו\"ע או\"ח נ, א)</small> <small>הא דתקינו לשנות פרק 'איזהו מקומן', לפי שאין בכל אותו פרק מחלוקת והיא משנה ברורה למשה מסיני. (ב\"י)</small> <small>משנה א</small> <b>אֵיזֶהוּ מְקוֹמָן</b> שֶׁל זְבָחִים קָדְשֵׁי קָדָשִׁים שְׁחִיטָתָן בַּצָּפוֹן פָּר וְשָׂעִיר שֶׁל יוֹם הַכִּפּוּרִים שְׁחִיטָתָן בַּצָּפוֹן וְקִבּוּל דָּמָן בִּכְלִי שָׁרֵת בַּצָּפוֹן וְדָמָן טָעוּן הַזָּיָה עַל בֵּין הַבַּדִּים וְעַל הַפָּרֹֽכֶת וְעַל מִזְבַּח הַזָּהָב מַתָּנָה אַחַת מֵהֶן מְעַכָּֽבֶת: שְׁיָרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד מַעֲרָבִי שֶׁל מִזְבֵּֽחַ הַחִיצוֹן אִם לֹא נָתַן לֹא עִכֵּב: <small>משנה ב</small> <b>פָּרִים</b> הַנִּשְׂרָפִים וּשְׂעִירִים הַנִּשְׂרָפִים שְׁחִיטָתָן בַּצָּפוֹן וְקִבּוּל דָּמָן בִּכְלִי שָׁרֵת בַּצָּפוֹן וְדָמָן טָעוּן הַזָּיָה עַל הַפָּרֹֽכֶת וְעַל מִזְבַּח הַזָּהָב מַתָּנָה אַחַת מֵהֶן מְעַכָּֽבֶת: שְׁיָרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד מַעֲרָבִי שֶׁל מִזְבֵּֽחַ הַחִיצוֹן אִם לֹא נָתַן לֹא עִכֵּב אֵֽלּוּ וָאֵֽלּוּ נִשְׂרָפִין בְּבֵית הַדָּֽשֶׁן: <small>משנה ג</small> <b>חַטֹּאת</b> הַצִּבּוּר וְהַיָּחִיד אֵֽלּוּ הֵן חַטֹּאת הַצִּבּוּר שְׂעִירֵי רָאשֵׁי חֳדָשִׁים וְשֶׁל מוֹעֲדוֹת שְׁחִיטָתָן בַּצָּפוֹן וְקִבּוּל דָּמָן בִּכְלִי שָׁרֵת בַּצָּפוֹן וְדָמָן טָעוּן אַרְבַּע מַתָּנוֹת עַל אַרְבַּע קְרָנוֹת, כֵּיצַד עָלָה בַכֶּֽבֶשׁ וּפָנָה לַסּוֹבֵב וּבָא לוֹ לְקֶֽרֶן דְּרוֹמִית מִזְרָחִית, מִזְרָחִית צְפוֹנִית, צְפוֹנִית מַעֲרָבִית, מַעֲרָבִית דְּרוֹמִית, שְׁיָרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד דְּרוֹמִי וְנֶאֱכָלִין לִפְנִים מִן הַקְּ֒לָעִים לְזִכְרֵי כְהֻנָּה בְּכָל מַאֲכָל לְיוֹם וָלַֽיְלָה עַד חֲצוֹת: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אִם נִתְחַיַּֽבְתִּי חַטָּאת שֶּׁתְּ֒הֵא אֲמִֽירָה זוּ מְרֻצָּה לְפָנֶֽיךָ כְּאִֽלּוּ הִקְרַֽבְתִּי חַטָּאת: <small>משנה ד</small> <b>הָעוֹלָה</b> קֹֽדֶשׁ קָדָשִׁים שְׁחִיטָתָהּ בַּצָּפוֹן וְקִבּוּל דָּמָהּ בִּכְלִי שָׁרֵת בַּצָּפוֹן וְדָמָהּ טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע וּטְעוּנָה הֶפְשֵׁט וְנִתּֽוּחַ וְכָלִיל לָאִשִּׁים: <b>יְהִי רָצוֹן</b> כְּאִֽלּוּ הִקְרַֽבְתִּי עוֹלָה: <small>משנה ה</small> <b>זִבְחֵי</b> שַׁלְמֵי צִבּוּר וַאֲשָׁמוֹת, אֵֽלּוּ הֵן אֲשָׁמוֹת אֲשַׁם גְּזֵלוֹת אֲשַׁם מְעִילוֹת אֲשַׁם שִׁפְחָה חֲרוּפָה אֲשַׁם נָזִיר אֲשַׁם מְצוֹרָע אָשָׁם תָּלוּי, שְׁחִיטָתָן בַּצָּפוֹן וְקִבּוּל דָּמָן בִּכְלִי שָׁרֵת בַּצָּפוֹן, וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין לִפְנִים מִן הַקְּ֒לָעִים לְזִכְרֵי כְהֻנָּה בְּכָל מַאֲכָל לְיוֹם וָלַֽיְלָה עַד חֲצוֹת: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אִם נִתְחַיַּֽבְתִּי אָשָׁם שֶּׁתְּ֒הֵא אֲמִֽירָה זוּ מְרֻצָּה לְפָנֶֽיךָ כְּאִֽלּוּ הִקְרַֽבְתִּי אָשָׁם: <small>משנה ו</small> <b>הַתּוֹדָה</b> וְאֵיל נָזִיר קָדָשִׁים קַלִּים שְׁחִיטָתָן בְּכָל־מָקוֹם בָּעֲזָרָה וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין בְּכָל־הָעִיר לְכָל־אָדָם בְּכָל־מַאֲכָל לְיוֹם וָלַֽיְלָה עַד־חֲצוֹת, הַמּוּרָם מֵהֶם כַּיּוֹצֵא בָהֶם אֶלָּא שֶׁהַמּוּרָם נֶאֱכָל לַכֹּהֲנִים לִנְשֵׁיהֶם וְלִבְנֵיהֶם וּלְעַבְדֵיהֶם: <b>יְהִי רָצוֹן</b> כְּאִֽלּוּ הִקְרַֽבְתִּי תּוֹדָה: <small>משנה ז</small> <b>שְׁלָמִים</b> קָדָשִׁים קַלִּים שְׁחִיטָתָן בְּכָל מָקוֹם בָּעֲזָרָה וְדָמָן טָעוּן שְׁתֵּי מַתָּנוֹת שֶׁהֵן אַרְבַּע, וְנֶאֱכָלִין בְּכָל הָעִיר לְכָל אָדָם בְּכָל מַאֲכָל לִשְׁנֵי יָמִים וְלַֽיְלָה אֶחָד: הַמּוּרָם מֵהֶם כַּיּוֹצֵא בָהֶם אֶלָּא שֶׁהַמּוּרָם נֶאֱכָל לַכֹּהֲנִים לִנְשֵׁיהֶם וְלִבְנֵיהֶם וּלְעַבְדֵיהֶם: <b>יְהִי רָצוֹן</b> כְּאִֽלּוּ הִקְרַֽבְתִּי שְׁלָמִים: <small>משנה ח</small> <b>הַבְּ֒כוֹר</b> וְהַמַּעֲשֵׂר וְהַפֶּֽסַח קָדָשִׁים קַלִּים שְׁחִיטָתָן בְּכָל מָקוֹם בָּעֲזָרָה וְדָמָן טָעוּן מַתָּנָה אֶחָת וּבִלְבָד שֶׁיִּתֵּן כְּנֶֽגֶד הַיְסוֹד, שִׁנָּה בַאֲכִילָתָן הַבְּ֒כוֹר נֶאֱכָל לַכֹּהֲנִים וְהַמַּעֲשֵׂר לְכָל אָדָם, וְנֶאֱכָלִין בְּכָל הָעִיר בְּכָל מַאֲכָל לִשְׁנֵי יָמִים וְלַֽיְלָה אֶחָד: הַפֶּֽסַח אֵינוֹ נֶאֱכָל אֶלָּא בַלַּֽיְלָה וְאֵינוֹ נֶאֱכָל אֶלָּא עַד חֲצוֹת וְאֵינוֹ נֶאֱכָל אֶלָּא לִמְנוּיָו וְאֵינוֹ נֶאֱכָל אֶלָּא צָלִי:"));
  parts.push(p("<b>רַבִּי יִשְׁמָעֵאל</b> אוֹמֵר בִּשְׁלשׁ עֶשְׂרֵה מִדּוֹת הַתּוֹרָה נִדְרֶֽשֶׁת בָּהֵן: מִקַּל וָחֹֽמֶר, וּמִגְּ֒זֵרָה שָׁוָה, מִבִּנְיַן אָב מִכָּתוּב אֶחָד, וּמִבִּנְיַן אָב מִשְּׁ֒נֵי כְתוּבִים, מִכְּ֒לָל וּפְרָט, וּמִפְּ֒רָט וּכְלָל, כְּלָל וּפְרָט וּכְלָל אִי אַתָּה דָן אֶלָּא כְּעֵין הַפְּ֒רָט, מִכְּ֒לָל שֶׁהוּא צָרִיךְ לִפְרָט וּמִפְּ֒רָט שֶׁהוּא צָרִיךְ לִכְלָל, כָּל דָּבָר שֶׁהָיָה בִּכְלָל וְיָצָא מִן הַכְּ֒לָל לְלַמֵּד לֹא לְלַמֵּד עַל עַצְמוֹ יָצָא אֶלָּא לְלַמֵּד עַל הַכְּ֒לָל כֻּלּוֹ יָצָא, כָּל דָּבָר שֶׁהָיָה בִּכְלָל וְיָצָא לִטְעֹן טֹֽעַן אֶחָד שֶׁהוּא כְעִנְיָנוֹ יָצָא לְהָקֵל וְלֹא לְהַחֲמִיר, כָּל דָּבָר שֶׁהָיָה בִּכְלָל וְיָצָא לִטְעֹן טֹֽעַן אַחֵר שֶׁלֹּא כְעִנְיָנוֹ יָצָא לְהָקֵל וּלְהַחֲמִיר, כָּל דָּבָר שֶׁהָיָה בִּכְלָל וְיָצָא לִדּוֹן בַּדָּבָר הֶחָדָשׁ אִי אַתָּה יָכוֹל לְהַחֲזִירוֹ לִכְלָלוֹ עַד שֶׁיַּחֲזִירֶֽנּוּ הַכָּתוּב לִכְלָלוֹ בְּפֵרוּשׁ, דָּבָר הַלָּמֵד מֵעִנְיָנוֹ וְדָבָר הַלָּמֵד מִסּוֹפוֹ, וְכֵן שְׁנֵי כְתוּבִים הַמַּכְחִישִׁים זֶה אֶת זֶה עַד שֶׁיָּבֹא הַכָּתוּב הַשְּׁ֒לִישִׁי וְיַכְרִֽיעַ בֵּינֵיהֶם: <b>יְהִי רָצוֹן</b> מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁיִּבָּנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵֽינוּ וְתֵן חֶלְקֵֽנוּ בְּתוֹרָתֶֽךָ: וְשָׁם נַעֲבָדְךָ בְּיִרְאָה כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמוֹנִיּוֹת: <small>מה שאנו אומרין הקדיש בלשון תרגום, יש אומרים מפני המלאכים שלא יתקנאו בנו שאנו משבחים שבח נאה כזה ואם יבינו המלאכים זה יקטרגו עלינו, על כן אומרים אותו בלשון שלא יבינו, שאינן מכירין ארמית. ויש מפרשים הטעם לפי שהיו רגילין לומר אותו אחר הדרשה והיו שם עמי הארץ שאינן מכירין אלא ארמית שהוא לשונם לכן נהגו לאומרו בלשון שהכל מבינין בו (ע\"פ טור או\"ח נו)</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְקָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ. בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b> יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא  לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְעֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן: עַל יִשְׂרָאֵל וְעַל רַבָּנָן וְעַל תַלְמִידֵיהוֹן וְעַל כָּל תַּלְמִידֵי תַלְמִידֵיהוֹן, וְעַל כָּל מָאן דְּעָסְ֒קִין בְּאוֹרַיְתָא, דִּי בְאַתְרָא הָדֵין וְדִי בְכָל אֲתַר וַאֲתַר, יְהֵא לְהוֹן וּלְכוֹן שְׁלָמָא רַבָּא חִנָּא וְחִסְדָּא וְרַחֲמִין וְחַיִּין אֲרִיכִין וּמְזוֹנָא רְוִיחֵי וּפוּרְקָנָא מִן קֳדָם אֲבוּהוֹן דְבִשְׁמַיָּא וְאַרְעָא וְאִמְרוּ אָמֵן: יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים טוֹבִים עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן: עוֹשֶׂה שָׁלוֹם (<small>בעשי\"ת</small> הַשָּׁלוֹם) בִּמְרוֹמָיו הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן:"));
  parts.push(hr);

  // ─── פסוקי דזמרה ───
  parts.push(p("<big><b>פְּסוּקֵי דְזִמְרָה</b></big>"));
  parts.push(p("<small>דרש ר' שמלאי לעולם יסדר אדם שבחו של מקום ואחרי כן יתפלל. לפיכך תקנו לומר 'פסוקי דזמרה' קודם תפלה. וקבעו ברכה אחת לפניהם ואחת לאחריהם, והן ברכות 'ברוך שאמר' ו'ישתבח'. וצריך ליזהר שלא להפסיק ביניהם בדיבור. ויש מקומות שנוהגין לומר 'הודו לה' קראו בשמו' כאשר הוא כתוב בדברי הימים, לפי שדוד קבעו לאומרו בכל יום לפני הארון. ויש שמוסיפים עוד פסוקים אחרים, וכל מקום ומקום כמנהגו (ע\"פ טור או\"ח נ\"א)</small> <b>הוֹדוּ</b> לַיהוָֹה קִרְאוּ בִשְׁמוֹ הוֹדִֽיעוּ בָעַמִּים עֲלִילֹתָיו: שִֽׁירוּ לוֹ זַמְּ֒רוּ־לוֹ שִֽׂיחוּ בְּכָל־נִפְלְ֒אוֹתָיו: הִתְהַלְּ֒לוּ בְּשֵׁם קָדְשׁוֹ יִשְׂמַח לֵב מְבַקְשֵׁי יְהֹוָה: דִּרְשׁוּ יְהֹוָה וְעֻזּוֹ בַּקְּ֒שׁוּ פָנָיו תָּמִיד: זִכְרוּ נִפְלְ֒אֹתָיו אֲשֶׁר עָשָׂה מֹפְ֒תָיו וּמִשְׁפְּ֒טֵי־פִֽיהוּ: זֶֽרַע יִשְׂרָאֵל עַבְדּוֹ בְּנֵי יַעֲקֹב בְּחִירָיו: הוּא יְהֹוָה אֱלֹהֵֽינוּ בְּכָל־הָאָֽרֶץ מִשְׁפָּטָיו: זִכְרוּ לְעוֹלָם בְּרִיתוֹ דָּבָר צִוָּה לְאֶֽלֶף דּוֹר: אֲשֶׁר כָּרַת אֶת־אַבְרָהָם וּשְׁבוּעָתוֹ לְיִצְחָק: וַיַּעֲמִידֶֽהָ לְיַעֲקֹב לְחֹק לְיִשְׂרָאֵל בְּרִית עוֹלָם: לֵאמֹר לְךָ אֶתֵּן אֶֽרֶץ־כְּנָעַן חֶֽבֶל נַחֲלַתְכֶם: בִּהְיוֹתְ֒כֶם מְתֵי מִסְפָּר כִּמְעַט וְגָרִים בָּהּ: וַיִּתְהַלְּ֒כוּ מִגּוֹי אֶל־גּוֹי וּמִמַּמְלָכָה אֶל־עַם אַחֵר: לֹא־הִנִּֽיחַ לְאִישׁ לְעָשְׁקָם וַיּֽוֹכַח עֲלֵיהֶם מְלָכִים: אַל־תִּגְּ֒עוּ בִּמְשִׁיחָי וּבִנְבִיאַי אַל־תָּרֵֽעוּ: שִֽׁירוּ לַיהוָֹה כָּל־הָאָֽרֶץ בַּשְּׂ֒רוּ מִיּוֹם־אֶל־יוֹם יְשׁוּעָתוֹ: סַפְּ֒רוּ בַגּוֹיִם אֶת־כְּבוֹדוֹ בְּכָל־הָעַמִּים נִפְלְאֹתָיו: כִּי גָדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְנוֹרָא הוּא עַל־כָּל־אֱלֹהִים: כִּי כָּל־אֱלֹהֵי הָעַמִּים אֱלִילִים וַיהוָֹה שָׁמַֽיִם עָשָׂה: הוֹד וְהָדָר לְפָנָיו עֹז וְחֶדְוָה בִּמְקֹמוֹ: הָבוּ לַיהוָֹה מִשְׁפְּ֒חוֹת עַמִּים הָבוּ לַיהוָֹה כָּבוֹד וָעֹז: הָבוּ לַיהוָֹה כְּבוֹד שְׁמוֹ שְׂאוּ מִנְחָה וּבֹֽאוּ לְפָנָיו הִשְׁתַּחֲווּ לַיהוָֹה בְּהַדְרַת־קֹֽדֶשׁ: חִֽילוּ מִלְּ֒פָנָיו כָּל־הָאָֽרֶץ אַף־תִּכּוֹן תֵּבֵל בַּל־תִּמּוֹט: יִשְׂמְחוּ הַשָּׁמַֽיִם וְתָגֵל הָאָֽרֶץ וְיֹאמְ֒רוּ בַגּוֹיִם יְהֹוָה מָלָךְ: יִרְעַם הַיָּם וּמְלוֹאוֹ יַעֲלֹץ הַשָּׂדֶה וְכָל־אֲשֶׁר־בּוֹ: אָז יְרַנְּ֒נוּ עֲצֵי הַיָּעַר מִלִּפְנֵי יְהֹוָה כִּי־בָא לִשְׁפּוֹט אֶת־הָאָֽרֶץ: הוֹדוּ לַיהוָֹה כִּי טוֹב כִּי לְעוֹלָם חַסְדּוֹ: וְאִמְרוּ הוֹשִׁיעֵֽנוּ אֱלֹהֵי יִשְׁעֵֽנוּ וְקַבְּ֒צֵֽנוּ וְהַצִּילֵֽנוּ מִן־הַגּוֹיִם לְהוֹדוֹת לְשֵׁם קָדְשֶֽׁךָ לְהִשְׁתַּבֵּֽחַ בִּתְהִלָּתֶֽךָ: בָּרוּךְ יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל מִן־הָעוֹלָם וְעַד הָעֹלָם וַיֹּאמְ֒רוּ כָל־הָעָם אָמֵן וְהַלֵּל לַיהוָֹה: רוֹמְ֒מוּ יְהֹוָה אֱלֹהֵֽינוּ וְהִשְׁתַּחֲווּ לַהֲדֹם רַגְלָיו קָדוֹשׁ הוּא: רוֹמְ֒מוּ יְהֹוָה אֱלֹהֵֽינוּ וְהִשְׁתַּחֲווּ לְהַר קָדְשׁוֹ כִּי קָדוֹשׁ יְהֹוָה אֱלֹהֵֽינוּ: וְהוּא רַחוּם יְכַפֵּר עָוֹן וְלֹא־יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֹא־יָעִיר כָּל־חֲמָתוֹ: אַתָּה יְהֹוָה לֹא־תִכְלָא רַחֲמֶֽיךָ מִמֶּֽנִּי חַסְדְּ֒ךָ וַאֲמִתְּ֒ךָ תָּמִיד יִצְּ֒רֽוּנִי: זְכֹר רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: תְּנוּ עֹז לֵאלֹהִים עַל־יִשְׂרָאֵל גַּאֲוָתוֹ וְעֻזּוֹ בַּשְּׁ֒חָקִים: נוֹרָא אֱלֹהִים מִמִּקְדָּשֶֽׁיךָ אֵל יִשְׂרָאֵל הוּא נֹתֵן עֹז וְתַעֲצֻמוֹת לָעָם בָּרוּךְ אֱלֹהִים: אֵל־נְקָמוֹת יְהֹוָה אֵל נְקָמוֹת הוֹפִֽיעַ: הִנָּשֵׂא שֹׁפֵט הָאָֽרֶץ הָשֵׁב גְּמוּל עַל־גֵּאִים: לַיהוָֹה הַיְשׁוּעָה עַל־עַמְּ֒ךָ בִרְכָתֶֽךָ סֶּֽלָה: יְהֹוָה צְבָאוֹת עִמָּנוּ מִשְׂגָּב לָֽנוּ אֱלֹהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: הוֹשִֽׁיעָה אֶת־עַמֶּֽךָ וּבָרֵךְ אֶת־נַחֲלָתֶֽךָ וּרְעֵם וְנַשְּׂ֒אֵם עַד־הָעוֹלָם: נַפְשֵֽׁנוּ חִכְּ֒תָה לַיהוָֹה עֶזְרֵֽנוּ וּמָגִנֵּֽנוּ הוּא: כִּי־בוֹ יִשְׂמַח לִבֵּֽנוּ כִּי בְשֵׁם קָדְשׁוֹ בָטָֽחְנוּ: יְהִי־חַסְדְּ֒ךָ יְהֹוָה עָלֵֽינוּ כַּאֲשֶׁר יִחַֽלְנוּ לָךְ: הַרְאֵֽנוּ יְהֹוָה חַסְדֶּֽךָ וְיֶשְׁעֲךָ תִּֽתֶּן־לָֽנוּ: קֽוּמָה עֶזְרָֽתָה לָּנוּ וּפְ֒דֵֽנוּ לְמַֽעַן חַסְדֶּֽךָ: אָנֹכִי יְהֹוָה אֱלֹהֶֽיךָ הַמַּעַלְךָ מֵאֶֽרֶץ מִצְרָֽיִם הַרְחֶב־פִּֽיךָ וַאֲמַלְאֵֽהוּ: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֹהָיו: וַאֲנִי בְּחַסְדְּ֒ךָ בָטַֽחְתִּי יָגֵל לִבִּי בִּישׁוּעָתֶֽךָ אָשִֽׁירָה לַיהוָֹה כִּי גָמַל עָלָי: <small>מזמור זה אמרו שלמה בשעה שהכניס הארון לבית קודש הקודשים, ולא נענה עד שהזכיר זכות דוד. ולפי שכל פסוקי דזמרה הם פסוקי דוד המלך, לפיכך הקדימו מקודם מזמור זה שבו נגלה צדקתו (ערוה\"ש נ, ד)</small> <b>מִזְמוֹר</b> שִׁיר־חֲנֻכַּת הַבַּֽיִת לְדָוִד: אֲרוֹמִמְךָ יְהֹוָה כִּי דִלִּיתָֽנִי וְלֹא־שִׂמַּֽחְתָּ אֹיְ֒בַי לִי: יְהֹוָה אֱלֹהָי שִׁוַּעְתִּי אֵלֶֽיךָ וַתִּרְפָּאֵֽנִי: יְהֹוָה הֶעֱלִֽיתָ מִן־שְׁאוֹל נַפְשִׁי חִיִּיתַֽנִי מִיָּרְ֒דִי־בוֹר: זַמְּ֒רוּ לַיהוָֹה חֲסִידָיו וְהוֹדוּ לְזֵֽכֶר קָדְשׁוֹ: כִּי רֶֽגַע בְּאַפּוֹ חַיִּים בִּרְצוֹנוֹ בָּעֶֽרֶב יָלִין בֶּֽכִי וְלַבֹּֽקֶר רִנָּה: וַאֲנִי אָמַֽרְתִּי בְשַׁלְוִי בַּל־אֶמּוֹט לְעוֹלָם: יְהֹוָה בִּרְצוֹנְ֒ךָ הֶעֱמַֽדְתָּה לְהַרְרִי עֹז הִסְתַּֽרְתָּ פָנֶֽיךָ הָיִֽיתִי נִבְהָל: אֵלֶֽיךָ יְהֹוָה אֶקְרָא וְאֶל־אֲדֹנָי אֶתְחַנָּן: מַה־בֶּֽצַע בְּדָמִי בְּרִדְתִּי אֶל שָֽׁחַת הֲיוֹדְ֒ךָ עָפָר הֲיַגִּיד אֲמִתֶּֽךָ: שְׁמַע יְהֹוָה וְחָנֵּֽנִי יְהֹוָה הֱיֵה־עֹזֵר לִי: הָפַֽכְתָּ מִסְפְּדִי לְמָחוֹל לִי פִּתַּחְתָּ שַׂקִּי וַתְּ֒אַזְּ֒רֵֽנִי שִׂמְחָה: לְמַֽעַן יְזַמֶּרְךָ כָבוֹד וְלֹא יִדֹּם יְהֹוָה אֱלֹהַי לְעוֹלָם אוֹדֶֽךָּ: <b>יְהוָֹה מֶֽלֶךְ, יְהוָֹה מָלָֽךְ, יְהוָֹה יִמְלֹךְ, לְעֹלָם וָעֶד: יְהוָֹה מֶֽלֶךְ, יְהוָֹה מָלָֽךְ, יְהוָֹה יִמְלֹךְ, לְעֹלָם וָעֶד:</b> וְהָיָה יְהוָֹה לְמֶֽלֶךְ עַל־כָּל־הָאָֽרֶץ, בַּיּוֹם הַהוּא יִהְיֶה יְהוָֹה אֶחָד, וּשְׁמוֹ אֶחָד: <b>הֽוֹשִׁיעֵֽנוּ</b> יְהוָֹה אֱלֹהֵֽינוּ, וְקַבְּ֒צֵֽנוּ מִן־הַגּוֹיִם לְהוֹדוֹת לְשֵׁם קָדְשֶֽׁךָ, לְהִשְׁתַּבֵּֽחַ בִּתְהִלָּתֶֽךָ: בָּרוּךְ יְהוָֹה אֱלֹהֵי יִשְׂרָאֵל, מִן־הָֽעוֹלָם וְעַד הָֽעוֹלָם, וְאָמַר כָּל־הָעָם אָמֵן, הַֽלְ֒לוּיָהּ: כֹּל הַנְּ֒שָׁמָה תְּהַלֵּל יָהּ, הַֽלְ֒לוּיָהּ: <b>לַמְנַצֵּֽחַ</b> בִּנְגִינֹת מִזְמוֹר שִׁיר: אֱלֹהִים יְחָנֵּֽנוּ וִיבָרְ֒כֵֽנוּ יָאֵר פָּנָיו אִתָּֽנוּ סֶֽלָה: לָדַֽעַת בָּאָֽרֶץ דַּרְכֶּֽךָ בְּכָל־גּוֹיִם יְשׁוּעָתֶֽךָ: יוֹדֽוּךָ עַמִּים אֱלֹהִים יוֹדֽוּךָ עַמִּים כֻּלָּם: יִשְׂמְחוּ וִירַנְּ֒נוּ לְאֻמִּים כִּי־תִשְׁפֹּט עַמִּים מִישֹׁר וּלְאֻמִּים בָּאָֽרֶץ תַּנְחֵם סֶֽלָה: יוֹדֽוּךָ עַמִּים אֱלֹהִים יוֹדוּךָ עַמִּים כֻּלָּם: אֶֽרֶץ נָתְ֒נָה יְבוּלָהּ יְבָרְ֒כֵֽנוּ אֱלֹהִים אֱלֹהֵֽינוּ: יְבָֽרְ֒כֵֽנוּ אֱלֹהִים וְיִירְ֒אוּ אוֹתוֹ כָּל־אַפְסֵי־אָֽרֶץ: <small>ברוך שאמר צריך לאומרו בניגון ובנעימה כי הוא שיר נאה ונחמד. וכתב בספר היכלות שיש בו פ\"ז תיבות וסי' ראשו כתם פז (טור או\"ח נא)</small> <b>בָּרוּךְ שֶׁאָמַר</b> וְהָיָה הָעוֹלָם, בָּרוּךְ הוּא, בָּרוּךְ עֹשֶׂה בְרֵאשִׁית, בָּרוּךְ אוֹמֵר וְעוֹשֶׂה, בָּרוּךְ גּוֹזֵר וּמְקַיֵּם, בָּרוּךְ מְרַחֵם עַל הָאָֽרֶץ, בָּרוּךְ מְרַחֵם עַל הַבְּ֒רִיּוֹת, בָּרוּךְ מְשַׁלֵּם שָׂכָר טוֹב לִירֵאָיו, בָּרוּךְ חַי לָעַד וְקַיָּם לָנֶֽצַח, בָּרוּךְ פּוֹדֶה וּמַצִּיל, בָּרוּךְ שְׁמוֹ: בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הָאֵל הָאָב הָרַחֲמָן הַמְּ֒הֻלָּל בְּפֶה עַמּוֹ מְשֻׁבָּח וּמְפֹאָר בִּלְשׁוֹן חֲסִידָיו וַעֲבָדָיו וּבְשִׁירֵי דָוִד עַבְדֶּֽךָ, נְהַלֶּלְךָ יְהֹוָה אֱלֹהֵֽינוּ בִּשְׁבָחוֹת וּבִזְמִירוֹת נְגַדֶּלְךָ וּנְשַׁבֵּחֲךָ וּנְפָאֶרְךָ וְנַזְכִּיר שִׁמְךָ וְנַמְלִיכְךָ מַלְכֵּֽנוּ אֱלֹהֵֽינוּ, יָחִיד, חֵי הָעוֹלָמִים מֶֽלֶךְ  מְשֻׁבָּח וּמְפֹאָר עֲדֵי עַד שְׁמוֹ הַגָּדוֹל: בָּרוּךְ אַתָּה יְהֹוָה מֶֽלֶךְ מְהֻלָּל בַּתִּשְׁבָּחוֹת: <small>מזמור לתודה יש לאומרו בנגינה שכל השירות עתידות ליבטל חוץ ממזמור לתודה (ראה ויק\"ר ט,ז). ואין אומרים מזמור לתודה בשבת ויו\"ט, או בימי פסח שאין תודה קריבה בהם משום חמץ, ולא בערב פסח.</small> <b>מִזְמוֹר לְתוֹדָה</b> הָרִֽיעוּ לַיהוָֹה כָּל־הָאָֽרֶץ: עִבְדוּ אֶת יְהֹוָה בְּשִׂמְחָה בֹּֽאוּ לְפָנָיו בִּרְנָנָה: דְּעוּ כִּי־יְהֹוָה הוּא אֱלֹהִים הוּא עָשָֽׂנוּ וְלוֹ (וְלֹא) אֲנַֽחְנוּ עַמּוֹ וְצֹאן מַרְעִיתוֹ: בֹּֽאוּ שְׁעָרָיו בְּתוֹדָה חֲצֵרֹתָיו בִּתְהִלָּה הֽוֹדוּ לוֹ בָּרְ֒כוּ שְׁמוֹ: כִּי־טוֹב יְהֹוָה לְעוֹלָם חַסְדּוֹ וְעַד־דֹּר וָדֹר אֱמוּנָתוֹ: <small>שמונה עשר פסוקי יהי כבוד כנגד שמונה עשרה ברכות דשמונה עשרה. ולפיכך הכניסום בתוך פסוקי דזמרה. (ערוך השולחן, אורח חיים נ, ד)</small> <b>יְהִי כְבוֹד</b> יְהֹוָה לְעוֹלָם יִשְׂמַח יְהֹוָה בְּמַעֲשָׂיו: יְהִי שֵׁם יְהֹוָה מְבֹרָךְ מֵעַתָּה וְעַד־עוֹלָם: מִמִּזְרַח־שֶֽׁמֶשׁ עַד־מְבוֹאוֹ מְהֻלָּל שֵׁם יְהֹוָה: רָם עַל־כָּל־גּוֹיִם יְהֹוָה עַל הַשָּׁמַֽיִם כְּבוֹדוֹ: יְהֹוָה שִׁמְךָ לְעוֹלָם יְהֹוָה זִכְרְ֒ךָ לְדֹר־וָדֹר: יְהֹוָה בַּשָּׁמַֽיִם הֵכִין כִּסְאוֹ וּמַלְכוּתוֹ בַּכֹּל מָשָֽׁלָה: יִשְׂמְחוּ הַשָּׁמַֽיִם וְתָגֵל הָאָֽרֶץ וְיֹאמְ֒רוּ בַגּוֹיִם יְהֹוָה מָלָךְ: יְהֹוָה מֶֽלֶךְ יְהֹוָה מָלָךְ יְהֹוָה יִמְלֹךְ לְעֹלָם וָעֶד: יְהֹוָה מֶֽלֶךְ עוֹלָם וָעֶד אָבְ֒דוּ גוֹיִם מֵאַרְצוֹ: יְהֹוָה הֵפִיר עֲצַת־גּוֹיִם הֵנִיא מַחְשְׁבוֹת עַמִּים: רַבּוֹת מַחֲשָׁבוֹת בְּלֶב־אִישׁ וַעֲצַת יְהֹוָה הִיא תָקוּם: עֲצַת יְהֹוָה לְעוֹלָם תַּעֲמֹד מַחְשְׁבוֹת לִבּוֹ לְדֹר וָדֹר: כִּי הוּא אָמַר וַיֶּֽהִי הוּא־צִוָּה וַיַּעֲמֹד: כִּי בָחַר יְהֹוָה בְּצִיּוֹן אִוָּהּ לְמוֹשָׁב לוֹ: כִּי־יַעֲקֹב בָּחַר לוֹ יָהּ יִשְׂרָאֵל לִסְגֻלָּתוֹ: כִּי לֹא יִטּשׁ יְהֹוָה עַמּוֹ וְנַחֲלָתוֹ לֹא יַעֲזֹב: וְהוּא רַחוּם יְכַפֵּר עָוֹן וְלֹא־יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֹא־יָעִיר כָּל־חֲמָתוֹ: יְהֹוָה הוֹשִׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: <small>צריך לכוין בתהלה לדוד דא\"ר אלעזר כל האומר תהלה לדוד בכל יום ג\"פ מובטח לו שהוא בן העולם הבא. ויותר יכוין בפסוק פותח את ידך, שעיקר מה שקבעוהו לומר בכל יום הוא בשביל אותו פסוק, שמזכיר בו שבחו של הקב\"ה שמשגיח על בריותיו ומפרנסן. ונהגו לומר קודם לכן אשרי יושבי ביתך משום דילפינן מיניה שצריך אדם לישב שעה אחת קודם שיתפלל. ואחריו נהגו לומר ואנחנו נברך יה (טור, אורח חיים נ\"א)</small> <b>אַשְׁרֵי</b> יוֹשְׁ֒בֵי בֵיתֶֽךָ עוֹד יְהַלְ֒לֽוּךָ סֶּֽלָה: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֹהָיו: תְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּֽלֶךְ וַאֲבָרְ֒כָה שִׁמְךָ לְעוֹלָם וָעֶד: בְּכָל־יוֹם אֲבָרְ֒כֶֽךָּ וַאֲהַלְ֒לָה שִׁמְךָ לְעוֹלָם וָעֶד: גָּדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְלִגְדֻלָּתוֹ אֵין חֵֽקֶר: דּוֹר לְדוֹר יְשַׁבַּח מַעֲשֶׂיךָ וּגְבוּרֹתֶֽיךָ יַגִּֽידוּ: הֲדַר כְּבוֹד הוֹדֶֽךָ וְדִבְרֵי נִפְלְ֒אֹתֶֽיךָ אָשִֽׂיחָה: וֶעֱזוּז נוֹרְ֒אֹתֶֽיךָ יֹאמֵרוּ וּגְדֻלָּתְ֒ךָ אֲסַפְּ֒רֶֽנָּה: זֵֽכֶר רַב־טוּבְ֒ךָ יַבִּֽיעוּ וְצִדְקָתְ֒ךָ יְרַנֵּֽנוּ: חַנּוּן וְרַחוּם יְהֹוָה אֶֽרֶךְ אַפַּֽיִם וּגְדָל־חָֽסֶד: טוֹב־יְהֹוָה לַכֹּל וְרַחֲמָיו עַל־כָּל־מַעֲשָׂיו: יוֹדֽוּךָ יְהֹוָה כָּל־מַעֲשֶֽׂיךָ וַחֲסִידֶֽיךָ יְבָרְ֒כֽוּכָה: כְּבוֹד מַלְכוּתְ֒ךָ יֹאמֵרוּ וּגְבוּרָתְ֒ךָ יְדַבֵּֽרוּ: לְהוֹדִֽיעַ לִבְנֵי הָאָדָם גְּבוּרֹתָיו וּכְבוֹד הֲדַר מַלְכוּתוֹ: מַלְכוּתְ֒ךָ מַלְכוּת כָּל־עֹלָמִים וּמֶמְשַׁלְתְּ֒ךָ בְּכָל־דּוֹר וָדֹר: סוֹמֵךְ יְהֹוָה לְכָל־הַנֹּפְ֒לִים וְזוֹקֵף לְכָל־הַכְּ֒פוּפִים: עֵינֵי־כֹל אֵלֶֽיךָ יְשַׂבֵּֽרוּ וְאַתָּה נוֹתֵן־לָהֶם אֶת־אָכְלָם בְּעִתּוֹ: פּוֹתֵֽחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: צַדִּיק יְהֹוָה בְּכָל־דְּרָכָיו וְחָסִיד בְּכָל־מַעֲשָׂיו: קָרוֹב יְהֹוָה לְכָל־קֹרְ֒אָיו לְכֹל אֲשֶׁר יִקְרָאֻֽהוּ בֶאֱמֶת: רְצוֹן־יְרֵאָיו יַעֲשֶׂה וְאֶת־שַׁוְעָתָם יִשְׁמַע וְיוֹשִׁיעֵם: שׁוֹמֵר יְהֹוָה אֶת־כָּל־אֹהֲבָיו וְאֵת כָּל־הָרְ֒שָׁעִים יַשְׁמִיד: תְּהִלַּת יְהֹוָה יְדַבֶּר פִּי וִיבָרֵךְ כָּל־בָּשָׂר שֵׁם קָדְשׁוֹ לְעוֹלָם וָעֶד: וַאֲנַֽחְנוּ נְבָרֵךְ יָהּ מֵעַתָּה וְעַד־עוֹלָם הַלְ֒לוּיָהּ: <small>זה המזמור מעורר לאדם לעשות תשובה ומעשים טובים בחיים חיותו בעוד שיש נשמתו בו ואל יבטח בבני אדם שאינם יכולים להושיע לעצמם כי בפתע פתאום תצא רוחם מהם לכך מן הראוי לבטוח בהקב\"ה שבידו לקיים מה שרוצה לעשות.</small> <b>הַלְ֒לוּיָהּ</b> הַלְ֒לִי נַפְשִׁי אֶת־יְהֹוָה: אֲהַלְ֒לָה יְהֹוָה בְּחַיָּי אֲזַמְּ֒רָה לֵאלֹהַי בְּעוֹדִי: אַל־תִּבְטְחוּ בִנְדִיבִים בְּבֶן־אָדָם שֶׁאֵין לוֹ תְשׁוּעָה: תֵּצֵא רוּחוֹ יָשֻׁב לְאַדְמָתוֹ בַּיּוֹם הַהוּא אָבְ֒דוּ עֶשְׁתֹּנֹתָיו: אַשְׁרֵי שֶׁאֵל יַעֲקֹב בְּעֶזְרוֹ, שִׂבְרוֹ עַל־יְהֹוָה אֱלֹהָיו: עֹשֶׂה שָׁמַֽיִם וָאָֽרֶץ אֶת־הַיָּם וְאֶת־כָּל־אֲשֶׁר־בָּם, הַשֹּׁמֵר אֱמֶת לְעוֹלָם: עֹשֶׂה מִשְׁפָּט לַעֲשׁוּקִים נֹתֵן לֶֽחֶם לָרְ֒עֵבִים יְהֹוָה מַתִּיר אֲסוּרִים: יְהֹוָה פֹּקֵֽחַ עִוְרִים יְהֹוָה זֹקֵף כְּפוּפִים יְהֹוָה אֹהֵב צַדִּיקִים: יְהֹוָה שֹׁמֵר אֶת־גֵּרִים יָתוֹם וְאַלְמָנָה יְעוֹדֵד וְדֶֽרֶךְ רְשָׁעִים יְעַוֵּת: יִמְלֹךְ יְהֹוָה לְעוֹלָם אֱלֹהַֽיִךְ צִיּוֹן לְדֹר וָדֹר הַלְ֒לוּיָהּ: <small>המזמור הזה מדבר מן הגאולה העתידה במהרה בימינו</small> <b>הַלְ֒לוּיָהּ</b> כִּי־טוֹב זַמְּ֒רָה אֱלֹהֵֽינוּ, כִּי־נָעִים נָאוָה תְהִלָּה: בּוֹנֵה יְרוּשָׁלַֽםִ יְהֹוָה נִדְחֵי יִשְׂרָאֵל יְכַנֵּס: הָרוֹפֵא לִשְׁבֽוּרֵי לֵב וּמְחַבֵּשׁ לְעַצְּ֒בוֹתָם: מוֹנֶה מִסְפָּר לַכּוֹכָבִים לְכֻלָּם שֵׁמוֹת יִקְרָא: גָּדוֹל אֲדוֹנֵֽינוּ וְרַב־כֹּֽחַ לִתְבוּנָתוֹ אֵין מִסְפָּר: מְעוֹדֵד עֲנָוִים יְהֹוָה מַשְׁפִּיל רְשָׁעִים עֲדֵי־אָֽרֶץ: עֱנוּ לַיהוָֹה בְּתוֹדָה זַמְּ֒רוּ לֵאלֹהֵֽינוּ בְכִנּוֹר: הַמְכַסֶּה שָׁמַֽיִם בְּעָבִים הַמֵּכִין לָאָֽרֶץ מָטָר הַמַּצְמִֽיחַ הָרִים חָצִיר: נוֹתֵן לִבְהֵמָה לַחְמָהּ לִבְנֵי עֹרֵב אֲשֶׁר יִקְרָֽאוּ: לֹא בִגְבוּרַת הַסּוּס יֶחְפָּץ לֹא בְשׁוֹקֵי הָאִישׁ יִרְצֶה: רוֹצֶה יְהֹוָה אֶת־יְרֵאָיו אֶת־הַמְ֒יַחֲלִים לְחַסְדּוֹ: שַׁבְּ֒חִי יְרוּשָׁלַֽםִ אֶת יְהֹוָה הַלְ֒לִי אֱלֹהַֽיִךְ צִיּוֹן: כִּי־חִזַּק בְּרִיחֵי שְׁעָרָֽיִךְ בֵּרַךְ בָּנַֽיִךְ בְּקִרְבֵּךְ: הַשָּׂם־גְּבוּלֵךְ שָׁלוֹם חֵֽלֶב חִטִּים יַשְׂבִּיעֵךְ: הַשֹּׁלֵֽחַ אִמְרָתוֹ אָֽרֶץ עַד־מְהֵרָה יָרוּץ דְּבָרוֹ: הַנֹּתֵן שֶֽׁלֶג כַּצָּֽמֶר כְּפוֹר כָּאֵֽפֶר יְפַזֵּר: מַשְׁלִיךְ קַרְחוֹ כְפִתִּים לִפְנֵי קָרָתוֹ מִי יַעֲמֹד: יִשְׁלַח דְּבָרוֹ וְיַמְסֵם יַשֵּׁב רוּחוֹ יִזְּ֒לוּ־מָֽיִם: מַגִּיד דְּבָרָיו לְיַעֲקֹב חֻקָּיו וּמִשְׁפָּטָיו לְיִשְׂרָאֵל: לֹא עָֽשָׂה כֵן לְכָל־גּוֹי וּמִשְׁפָּטִים בַּל־יְדָעוּם הַלְ֒לוּיָהּ: <small>בפרק זה התחיל המשורר מעולם הגדול ועד עולם הקטן עיין נוראים מבריאת הקב\"ה העליונים והתחתונים כולם עומדים בכוחו</small> <b>הַלְ֒לוּיָהּ</b> הַלְ֒לוּ אֶת־יְהֹוָה מִן הַשָּׁמַֽיִם הַלְ֒לֽוּהוּ בַּמְּ֒רוֹמִים: הַלְ֒לֽוּהוּ כָּל־מַלְאָכָיו הַלְ֒לֽוּהוּ כָּל־צְבָאָיו: הַלְ֒לֽוּהוּ שֶֽׁמֶשׁ וְיָרֵֽחַ הַלְ֒לֽוּהוּ כָּל־כּֽוֹכְ֒בֵי אוֹר: הַלְ֒לֽוּהוּ שְׁמֵי הַשָּׁמָֽיִם וְהַמַּֽיִם אֲשֶׁר מֵעַל הַשָּׁמָֽיִם: יְהַלְ֒לוּ אֶת־שֵׁם יְהֹוָה כִּי הוּא צִוָּה וְנִבְרָֽאוּ: וַיַּעֲמִידֵם לָעַד לְעוֹלָם חָק־נָתַן וְלֹא יַעֲבוֹר: הַלְ֒לוּ אֶת־יְהֹוָה מִן־הָאָֽרֶץ תַּנִּינִים וְכָל־תְּהֹמוֹת: אֵשׁ וּבָרָד שֶֽׁלֶג וְקִיטוֹר רֽוּחַ סְעָרָה עֹשָׂה דְבָרוֹ: הֶהָרִים וְכָל־גְּבָעוֹת עֵץ פְּרִי וְכָל־אֲרָזִים: הַחַיָּה וְכָל־בְּהֵמָה רֶֽמֶשׂ וְצִפּוֹר כָּנָף: מַלְכֵי־אֶֽרֶץ וְכָל־לְאֻמִּים שָׂרִים וְכָל־שֹׁפְטֵי אָֽרֶץ: בַּחוּרִים וְגַם־בְּתוּלוֹת זְקֵנִים עִם־נְעָרִים: יְהַלְ֒לוּ אֶת־שֵׁם יְהֹוָה כִּי־נִשְׂגָּב שְׁמוֹ לְבַדּוֹ הוֹדוֹ עַל־אֶֽרֶץ וְשָׁמָֽיִם: וַיָּֽרֶם קֶֽרֶן לְעַמּוֹ תְּהִלָּה לְכָל־חֲסִידָיו לִבְנֵי יִשְׂרָאֵל עַם קְרֹבוֹ הַלְ֒לוּיָהּ: <small>המזמור הזה מדבר לעתיד בביאת משיחנו</small> <b>הַלְ֒לוּיָהּ</b> שִֽׁירוּ לַיהוָֹה שִׁיר חָדָשׁ תְּהִלָּתוֹ בִּקְהַל חֲסִידִים: יִשְׂמַח יִשְׂרָאֵל בְּעֹשָׂיו בְּנֵי־צִיּוֹן יָגִֽילוּ בְמַלְכָּם: יְהַלְ֒לוּ שְׁמוֹ בְמָחוֹל בְּתֹף וְכִנּוֹר יְזַמְּ֒רוּ־לוֹ: כִּי־רוֹצֶה יְהֹוָה בְּעַמּוֹ יְפָאֵר עֲנָוִים בִּישׁוּעָה: יַעְלְזוּ חֲסִידִים בְּכָבוֹד יְרַנְּ֒נוּ עַל־מִשְׁכְּבוֹתָם: רוֹמְ֒מוֹת אֵל בִּגְרוֹנָם וְחֶֽרֶב פִּיפִיּוֹת בְּיָדָם: לַעֲשׂוֹת נְקָמָה בַגּוֹיִם תּוֹכֵחוֹת בַּלְאֻמִּים: לֶאְסֹר מַלְכֵיהֶם בְּזִקִּים וְנִכְבְּדֵיהֶם בְּכַבְלֵי בַרְזֶל: לַעֲשׂוֹת בָּהֶם מִשְׁפָּט כָּתוּב הָדָר הוּא לְכָל־חֲסִידָיו הַלְ֒לוּיָהּ: <small>במזמור הזה יש שלשה עשר הלולים. רמז לי\"ג מדות.</small> <b>הַלְ֒לוּיָהּ</b> הַֽלְ֒לוּ־אֵל בְּקָדְשׁוֹ הַלְ֒לֽוּהוּ בִּרְקִֽיעַ עֻזּוֹ: הַלְ֒לֽוּהוּ בִּגְבוּרֹתָיו הַלְ֒לֽוּהוּ כְּרֹב גֻּדְלוֹ: הַלְ֒לֽוּהוּ בְּתֵֽקַע שׁוֹפָר הַלְ֒לֽוּהוּ בְּנֵֽבֶל וְכִנּוֹר: הַלְ֒לֽוּהוּ בְּתֹף וּמָחוֹל הַלְ֒לֽוּהוּ בְּמִנִּים וְעֻגָב: הַלְ֒לֽוּהוּ בְצִלְצְלֵי־שָֽׁמַע הַלְ֒לֽוּהוּ בְּצִלְצְלֵי תְרוּעָה: כֹּל הַנְּ֒שָׁמָה תְּהַלֵּל יָהּ הַלְ֒לוּיָהּ: כֹּל הַנְּ֒שָׁמָה תְּהַלֵּל יָהּ הַלְ֒לוּיָהּ: <small>קבעו פסוקים אלו אחר כל הנשמה משום שאלו הכתובים מצינו אותם כתובים בסוף ספרי תהלים. לכן תקנו לאמרם בהשלמת פסוקי דזמרה (א\"ר סי' נ\"א)</small> <b>בָּרוּךְ יְהֹוָה</b> לְעוֹלָם אָמֵן וְאָמֵן: בָּרוּךְ יְהֹוָה מִצִּיּוֹן שֹׁכֵן יְרוּשָׁלָֽםִ הַלְ֒לוּיָהּ: בָּרוּךְ יְהֹוָה אֱלֹהִים אֱלֹהֵי יִשְׂרָאֵל עֹשֵׂה נִפְלָאוֹת לְבַדּוֹ: וּבָרוּךְ שֵׁם כְּבוֹדוֹ לְעוֹלָם וְיִמָּלֵא כְבוֹדוֹ אֶת־כָּל־הָאָֽרֶץ אָמֵן וְאָמֵן: <small>הטעם שנהגו לומר ויברך דוד ושירת הים לפי שכל אותם חמשה עשר לשונות של שבח הסדורין בברכת ישתבח דורש במכלתין מתוך שירת הים ומתוך פסוקים של ויברך דוד (אבודרהם). כשמגיע לואתה מושל בכל יתן ג' פרוטות לצדקה הב׳ בבת אחת ואח״כ השלישית וסודם נשגב (צפורן שמיר)</small> <small>בויברך דויד יעמוד עד שיאמר אתה הוא ה' האלהים ועד בכלל</small> <b>וַיְבָֽרֶךְ דָּוִיד</b> אֶת־יְהֹוָה לְעֵינֵי כָּל־הַקָּהָל וַיֹּֽאמֶר דָּוִיד בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵי יִשְׂרָאֵל אָבִֽינוּ, מֵעוֹלָם וְעַד־עוֹלָם: לְךָ יְהֹוָה הַגְּ֒דֻלָּה וְהַגְּ֒בוּרָה וְהַתִּפְאֶֽרֶת וְהַנֵּֽצַח וְהַהוֹד כִּי־כֹל בַּשָּׁמַֽיִם וּבָאָֽרֶץ לְךָ יְהֹוָה הַמַּמְלָכָה וְהַמִּתְנַשֵּׂא לְכֹל לְרֹאשׁ: וְהָעֽשֶׁר וְהַכָּבוֹד מִלְּ֒פָנֶֽיךָ וְאַתָּה מוֹשֵׁל בַּכֹּל, וּבְיָדְ֒ךָ כֹּֽחַ וּגְבוּרָה, וּבְיָדְ֒ךָ לְגַדֵּל וּלְחַזֵּק לַכֹּל: וְעַתָּה אֱלֹהֵֽינוּ מוֹדִים אֲנַֽחְנוּ לָךְ וּמְהַלְ֒לִים לְשֵׁם תִּפְאַרְתֶּֽךָ: אַתָּה־הוּא יְהֹוָה לְבַדֶּֽךָ, אַתָּה עָשִֽׂיתָ אֶת־הַשָּׁמַֽיִם שְׁמֵי הַשָּׁמַֽיִם וְכָל־צְבָאָם, הָאָֽרֶץ וְכָל־אֲשֶׁר עָלֶֽיהָ הַיַּמִּים וְכָל־אֲשֶׁר בָּהֶם, וְאַתָּה מְחַיֶּה אֶת־כֻּלָּם וּצְ֒בָא הַשָּׁמַֽיִם לְךָ מִשְׁתַּחֲוִים: אַתָּה הוּא יְהֹוָה הָאֱלֹהִים אֲשֶׁר בָּחַֽרְתָּ בְּאַבְרָם וְהוֹצֵאתוֹ מֵאוּר כַּשְׂדִּים וְשַֽׂמְתָּ שְׁמוֹ אַבְרָהָם: וּמָצָֽאתָ אֶת־לְבָבוֹ נֶאֱמָן לְפָנֶֽיךָ <b>וְכָרוֹת</b> עִמּוֹ הַבְּ֒רִית לָתֵת אֶת־אֶֽרֶץ הַכְּ֒נַעֲנִי הַחִתִּי הָאֱמֹרִי וְהַפְּ֒רִזִּי וְהַיְבוּסִי וְהַגִּרְגָּשִׁי לָתֵת לְזַרְעוֹ וַתָּֽקֶם אֶת־דְּבָרֶֽיךָ כִּי צַדִּיק אָֽתָּה: וַתֵּֽרֶא אֶת־עֳנִי אֲבֹתֵֽינוּ בְּמִצְרָֽיִם וְאֶת־זַעֲקָתָם שָׁמַֽעְתָּ עַל־יַם־סוּף: וַתִּתֵּן אֹתֹת וּמֹפְ֒תִים בְּפַרְעֹה וּבְכָל־עֲבָדָיו וּבְכָל־עַם אַרְצוֹ כִּי יָדַֽעְתָּ כִּי הֵזִֽידוּ עֲלֵיהֶם וַתַּֽעַשׂ־לְךָ שֵׁם כְּהַיּוֹם הַזֶּה: וְהַיָּם בָּקַֽעְתָּ לִפְנֵיהֶם וַיַּעַבְרוּ בְתוֹךְ־הַיָּם בַּיַּבָּשָׁה וְאֶת־רֹדְ֒פֵיהֶם הִשְׁלַֽכְתָּ בִמְצוֹלֹת כְּמוֹ־אֶֽבֶן בְּמַֽיִם עַזִּים: <small>תקנו לומר וישע ה' ביום ההוא ושירת הים והוא זכר ליציאת מצרים. וכופלין פסוק ה' ימלוך לעולם ועד מפני שהוא סוף השירה (אבודרהם). כל האומר שירת הים בשמחה ובעצמו שיער כאלו הוא ניצול מהים ופרעה וחילו הם נטבעו ואמר שירה מכפרים לו עונותיו (צפורן שמיר)</small> <b>וַיּֽוֹשַׁע יְהֹוָה</b> בַּיּוֹם הַהוּא אֶת־יִשְׂרָאֵל מִיַּד מִצְרָֽיִם וַיַּרְא יִשְׂרָאֵל אֶת־מִצְרַֽיִם מֵת עַל־שְׂפַת הַיָּם: וַיַּרְא יִשְׂרָאֵל אֶת־הַיָּד הַגְּ֒דֹלָה אֲשֶׁר עָשָׂה יְהֹוָה בְּמִצְרַֽיִם וַיִּירְ֒אוּ הָעָם אֶת יְהֹוָה וַיַּאֲמִֽינוּ בַּיהוָֹה וּבְמשֶׁה עַבְדּוֹ: <b>אָז יָשִׁיר</b> משֶׁה וּבְנֵי יִשְׂרָאֵל אֶת־הַשִּׁירָה הַזֹּאת לַיהוָֹה וַיֹּאמְרוּ לֵאמֹר אָשִֽׁירָה לַיהוָֹה כִּי־גָאֹה גָּאָה סוּס וְרֹכְ֒בוֹ רָמָה בַיָּם: עָזִּי וְזִמְרָת יָהּ וַיְ֒הִי־לִי לִישׁוּעָה זֶה אֵלִי וְאַנְוֵֽהוּ אֱלֹהֵי אָבִי וַאֲרֹמְ֒מֶֽנְהוּ: יְהֹוָה אִישׁ מִלְחָמָה יְהֹוָה שְׁמוֹ: מַרְכְּבֹת פַּרְעֹה וְחֵילוֹ יָרָה בַיָּם וּמִבְחַר שָׁלִשָׁיו טֻבְּ֒עוּ בְיַם־סוּף: תְּהֹמֹת יְכַסְיֻֽמוּ יָרְ֒דוּ בִמְצוֹלֹת כְּמוֹ־אָֽבֶן: יְמִינְ֒ךָ יְהֹוָה נֶאְדָּרִי בַּכֹּֽחַ יְמִֽינְ֒ךָ יְהֹוָה תִּרְעַץ אוֹיֵב: וּבְרֹב גְּאוֹנְ֒ךָ תַּהֲרֹס קָמֶֽיךָ תְּשַׁלַּח חֲרֹנְ֒ךָ יֹֽאכְ֒לֵמוֹ כַּקַּשׁ: וּבְרֽוּחַ אַפֶּֽיךָ נֶֽעֶרְמוּ מַֽיִם נִצְּ֒בוּ כְמוֹ־נֵד נֹזְ֒לִים קָפְ֒אוּ תְהֹמֹת בְּלֶב־יָם: אָמַר אוֹיֵב אֶרְדֹּף אַשִּׂיג אֲחַלֵּק שָׁלָל תִּמְלָאֵֽמוֹ נַפְשִׁי אָרִיק חַרְבִּי תּוֹרִישֵֽׁמוֹ יָדִי: נָשַֽׁפְתָּ בְרוּחֲךָ כִּסָּֽמוֹ יָם צָלֲלוּ כַּעוֹפֶֽרֶת בְּמַֽיִם אַדִּירִים: מִי־כָמֹֽכָה בָּאֵלִם יְהֹוָה מִי כָּמֹֽכָה נֶאְדָּר בַּקֹּֽדֶשׁ נוֹרָא תְהִלֹּת עֹֽשֵׂה־פֶֽלֶא: נָטִֽיתָ יְמִינְ֒ךָ תִּבְלָעֵֽמוֹ אָֽרֶץ: נָחִֽיתָ בְחַסְדְּ֒ךָ עַם־זוּ גָּאָֽלְתָּ נֵהַֽלְתָּ בְעָזְּ֒ךָ אֶל־נְוֵה קָדְשֶֽׁךָ: שָֽׁמְ֒עוּ עַמִּים יִרְגָּזוּן חִיל אָחַז ישְׁ֒בֵי פְּלָֽשֶׁת: אָז נִבְהֲלוּ אַלּוּפֵי אֱדוֹם אֵילֵי מוֹאָב יֹֽאחֲזֵֽמוֹ רָֽעַד נָמֹֽגוּ כֹּל ישְׁ֒בֵי כְנָֽעַן: תִּפֹּל עֲלֵיהֶם אֵימָֽתָה וָפַֽחַד בִּגְדֹל זְרוֹעֲךָ יִדְּ֒מוּ כָּאָֽבֶן עַד־יַֽעֲבֹר עַמְּ֒ךָ יְהֹוָה עַד־יַֽעֲבֹר עַם־זוּ קָנִֽיתָ: תְּבִאֵֽמוֹ וְתִטָּעֵֽמוֹ בְּהַר נַחֲלָתְ֒ךָ מָכוֹן לְשִׁבְתְּ֒ךָ פָּעַֽלְתָּ יְהֹוָה מִקְּ֒דָשׁ אֲדֹנָי כּוֹנְ֒נוּ יָדֶֽיךָ: יְהֹוָה יִמְלֹךְ לְעֹלָם וָעֶד: יְהֹוָה יִמְלֹךְ לְעֹלָם וָעֶד: יְהֹוָה מַלְכוּתֵהּ קָאֵים לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא: כִּי בָא סוּס פַּרְעֹה בְּרִכְבּוֹ וּבְפָרָשָׁיו בַּיָּם וַיָּֽשֶׁב יְהֹוָה עֲלֵהֶם אֶת־מֵי הַיָּם וּבְנֵי יִשְׂרָאֵל הָלְ֒כוּ בַיַּבָּשָׁה בְּתוֹךְ הַיָּֽם: כִּי לַיהוָֹה הַמְּ֒לוּכָה וּמשֵׁל בַּגּוֹיִם: וְעָלוּ מוֹשִׁעִים בְּהַר צִיּוֹן לִשְׁפֹּט אֶת־הַר עֵשָׂו, וְהָיְ֒תָה לַיהוָֹה הַמְּ֒לוּכָה: וְהָיָה יְהֹוָה לְמֶֽלֶךְ עַל־כָּל הָאָֽרֶץ בַּיּוֹם הַהוּא יִהְיֶה יְהֹוָה אֶחָד וּשְׁמוֹ אֶחָד:"));
  parts.push(p("<small>ברכה זו אינה פותחת בברוך מפני שסמוכה היא לברוך שאמר. ופסוקים שבנתים לא הוו הפסק. (אבודרהם)</small> <b>יִשְׁתַּבַּח</b> שִׁמְךָ לָעַד מַלְכֵּֽנוּ הָאֵל הַמֶּֽלֶךְ הַגָּדוֹל וְהַקָּדוֹשׁ בַּשָּׁמַֽיִם וּבָאָֽרֶץ, כִּי לְךָ נָאֶה יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ (לְעוֹלָם וָעֶד) שִׁיר וּשְׁבָחָה הַלֵּל וְזִמְרָה עֹז וּמֶמְשָׁלָה נֶֽצַח גְּדֻלָּה וּגְבוּרָה תְּהִלָּה וְתִפְאֶֽרֶת קְדֻשָּׁה וּמַלְכוּת, בְּרָכוֹת וְהוֹדָאוֹת לְשִׁמְךָ הַגָּדוֹל וְהַקָּדוֹשׁ וּמֵעוֹלָם וְעַד עוֹלָם אַתָּה אֵל: בָּרוּךְ אַתָּה יְהֹוָה אֵל מֶֽלֶךְ גָּדוֹל וּמְהֻלָּל בַּתִּשְׁבָּחוֹת אֵל הַהוֹדָאוֹת אֲדוֹן הַנִּפְלָאוֹת בּוֹרֵא כָּל הַנְּ֒שָׁמוֹת רִבּוֹן כָּל הַמַעֲשִׂים הַבּוֹחֵר בְּשִׁירֵי זִמְרָה מֶֽלֶךְ יָחִיד אֵל חֵי הָעוֹלָמִים: <small>בעשרת ימי תשובה מוסיפין:</small> <b>שִׁיר הַמַּעֲלוֹת</b> מִמַּעֲמַקִּים קְרָאתִֽיךָ יְהֹוָה: אֲדֹנָי שִׁמְעָה בְקוֹלִי תִּהְיֶֽינָה אָזְנֶֽיךָ קַשֻּׁבוֹת לְקוֹל תַּחֲנוּנָי: אִם־עֲוֹנוֹת תִּשְׁמָר־יָהּ אֲדֹנָי מִי יַעֲמֹד: כִּי־עִמְּ֒ךָ הַסְּ֒לִיחָה לְמַֽעַן תִּוָּרֵא: קִוִּיתִי יְהֹוָה קִוְּתָה נַפְשִׁי וְלִדְ֒בָרוֹ הוֹחָֽלְתִּי: נַפְשִׁי לַאדֹנָי מִשֹּׁמְ֒רִים לַבֹּֽקֶר שֹׁמְ֒רִים לַבֹּֽקֶר: יַחֵל יִשְׂרָאֵל אֶל־יְהֹוָה כִּי־עִם־יְהֹוָה הַחֶֽסֶד וְהַרְבֵּה עִמּוֹ פְדוּת: וְהוּא יִפְדֶּה אֶת־יִשְׂרָאֵל מִכֹּל עֲוֹנוֹתָיו: <small>ואומר החזן חצי קדיש:</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְקָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן: <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b>: יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן,"));
  parts.push(hr);

  // ─── שמע ותפלות ───
  parts.push(p("<big><b>שְׁמַע וּתְפִלּוֹת</b></big>"));
  parts.push(p("<small>המנהג הפשוט בכל תפוצות ישראל לומר ברכו לפני פריסת שמע. ואין לאומרו בפחות מעשרה שכל דבר שבקדושה אינו בפחות מעשרה (אבודרהם).</small> <small>ואומר שליח צבור:</small> <b>בָּרְ֒כוּ אֶת יְהֹוָה הַמְּ֒בֹרָךְ:</b> <small>ועונין הקהל:</small> <b>בָּרוּךְ</b> יְהֹוָה הַמְּ֒בֹרָךְ לְעוֹלָם וָעֶד: <small>אין להפסיק כלל בין ברכו ליוצר אור אפילו לדבר מצוה (לבוש). איתא בכתבים בתחלת יוצר אור צריך למשמש בתפילין. לכן כשיאמר יוצר אור ימשמש בשל יד. ובורא חושך ימשמש בשל ראש (פע\"ח).</small> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם יוֹצֵר אוֹר וּבוֹרֵא חֽשֶׁךְ עֹשֶׂה שָׁלוֹם וּבוֹרֵא אֶת הַכֹּל: <b>הַמֵּאִיר</b> לָאָֽרֶץ וְלַדָּרִים עָלֶֽיהָ בְּרַחֲמִים, וּבְטוּבוֹ מְחַדֵּשׁ בְּכָל יוֹם תָּמִיד מַעֲשֵׂה בְרֵאשִׁית: מָה־רַבּוּ מַעֲשֶֽׂיךָ יְהֹוָה, כֻּלָּם בְּחָכְמָה עָשִֽׂיתָ, מָלְ֒אָה הָאָֽרֶץ קִנְיָנֶֽךָ: הַמֶּֽלֶךְ הַמְּ֒רוֹמָם לְבַדּוֹ מֵאָז, הַמְּ֒שֻׁבָּח וְהַמְּ֒פֹאָר וְהַמִּתְנַשֵּׂא מִימוֹת עוֹלָם: אֱלֹהֵי עוֹלָם בְּרַחֲמֶֽיךָ הָרַבִּים רַחֵם עָלֵֽינוּ אֲדוֹן עֻזֵּֽנוּ צוּר מִשְׂגַּבֵּֽנוּ מָגֵן יִשְׁעֵֽנוּ מִשְׂגָּב בַּעֲדֵֽנוּ: אֵל בָּרוּךְ גְּדוֹל דֵּעָה, הֵכִין וּפָעַל זָהֳרֵי חַמָּה, טוֹב יָצַר כָּבוֹד לִשְׁמוֹ, מְאוֹרוֹת נָתַן סְבִיבוֹת עֻזּוֹ, פִּנּוֹת צְבָאָיו קְדוֹשִׁים רוֹמְ֒מֵי שַׁדַּי, תָּמִיד מְסַפְּ֒רִים כְּבוֹד אֵל וּקְ֒דֻשָּׁתוֹ: תִּתְבָּרֵךְ יְהֹוָה אֱלֹהֵֽינוּ בַּשָּׁמַֽיִם מִמַּֽעַל וְעַל הַאָֽרֶץ מִתָּֽחַת עַל כָּל שֶֽׁבַח מַעֲשֵׂה יָדֶֽיךָ וְעַל מְאֽוֹרֵי אוֹר שֶׁעָשִֽׂיתָ הֵֽמָּה יְפָאֲרֽוּךָ סֶּֽלָה: <b>תִּתְבָּרֵךְ</b> לָנֶצַח צוּרֵֽנוּ מַלְכֵּֽנוּ וְגוֹאֲלֵֽנוּ, בּוֹרֵא קְדוֹשִׁים  יִשְׁתַּבַּח שִׁמְךָ לָעַד מַלְכֵּֽנוּ, יוֹצֵר מְשָׁרְ֒תִים, וַאֲשֶׁר מְשָׁרְ֒תָיו כֻּלָּם עוֹמְ֒דִים בְּרוּם עוֹלָם וּמַשְׁמִיעִים בְּיִרְאָה יַֽחַד בְּקוֹל דִּבְרֵי אֱלֹהִים חַיִּים וּמֶֽלֶךְ עוֹלָם: כֻּלָם אֲהוּבִים כֻּלָּם בְּרוּרִים כֻּלָּם גִּבּוֹרִים כֻּלָּם קְדוֹשִׁים וְכֻלָּם עֹשִׂים בְּאֵימָה וּבְיִרְאָה רְצוֹן קוֹנָם: וְכֻלָּם פּוֹתְ֒חִים אֶת פִּיהֶם בִּקְדֻשָּׁה וּבְטָהֳרָה בְּשִׁירָה וּבְזִמְרָה וּמְבָרְ֒כִין וּמְשַׁבְּ֒חִין וּמְפָאֲרִין וּמַעֲרִיצִין וּמַקְדִּישִׁין וּמַמְלִיכִין: <b>אֶת שֵׁם</b> הָאֵל הַמֶּֽלֶךְ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא קָדוֹשׁ הוּא: וְכֻלָּם מְקַבְּ֒לִים עֲלֵיהֶם עֹל מַלְכוּת שָׁמַֽיִם זֶה מִזֶּה, וְנוֹתְ֒נִים בְּאַהֲבָה רְשׁוּת זֶה לָזֶה לְהַקְדִּישׁ לְיוֹצְ֒רָם בְּנַֽחַת רֽוּחַ בְּשָׂפָה בְרוּרָה וּבִנְעִימָה, קְדֻשָּׁה כֻּלָּם כְּאֶחָד עוֹנִים בְּאֵימָה וְאוֹמְ֒רִים בְּיִרְאָה <b>קָדוֹשׁ קָדוֹשׁ, קָדוֹשׁ יְהֹוָה צְבָאוֹת. מְלֹא כָל־הָאָֽרֶץ כְּבוֹדוֹ:</b> וְהָאוֹפַנִּים וְחַיּוֹת הַקֹּֽדֶשׁ בְּרַֽעַשׁ גָּדוֹל מִתְנַשְּׂ֒אִים לְעֻמַּת שְׂרָפִים לְעֻמָּתָם מְשַׁבְּ֒חִים וְאוֹמְ֒רִים: <b>בָּרוּךְ כְּבוֹד־יְהֹוָה מִמְּ֒קוֹמוֹ:</b> <b>לָאֵל</b> בָּרוּךְ נְעִימוֹת יִתֵּֽנוּ, לַמֶּֽלֶךְ אֵל חַי וְקַיָּם זְמִירוֹת יֹאמֵֽרוּ וְתִשְׁבָּחוֹת יַשְׁמִֽיעוּ, כִּי הוּא לְבַדּוֹ מָרוֹם וְקָדוֹשׁ פּוֹעֵל גְּבוּרוֹת עֹשֶׂה חֲדָשׁוֹת בַּֽעַל מִלְחָמוֹת זוֹרֵֽעַ צְדָקוֹת מַצְמִֽיחַ יְשׁוּעוֹת בּוֹרֵא רְפוּאוֹת נוֹרָא תְהִלּוֹת אֲדוֹן הַנִּפְלָאוֹת: הַמְ֒חַדֵּשׁ בְּטוּבוֹ בְּכָל יוֹם תָּמִיד מַעֲשֵׂה בְרֵאשִׁית: כָּאָמוּר לְעֹשֵׂה אוֹרִים גְּדֹלִים כִּי לְעוֹלָם חַסְדּוֹ: (וְהִתְקִין מְאוֹרוֹת מְשַׂמֵּֽחַ עוֹלָמוֹ אֲשֶׁר בָּרָא.) אוֹר חָדָשׁ עַל צִיּוֹן תָּאִיר וְנִזְכֶּה כֻלָּֽנוּ בִּמְהֵרָה לְאוֹרוֹ: בָּרוּךְ אַתָּה יְהֹוָה יוֹצֵר הַמְּ֒אוֹרוֹת: <small>בברכה זו נכללים דברים רבים כי השם אהב אותנו מכל האומות ונתן לנו תורה ולהאמין בייחודו ושהוא אדון הכל. וכתב בעל המנהגות מה שסמכו אהבת עולם ליוצר המאורות לפי שבה מזכיר יחוד שמו של הקב\"ה ונתינת התורה המאירה מכל המאורות. שהשמש אינו מאיר אלא ביום והתורה ביום ובלילה (אבודרהם).</small> <b>אַהֲבַת עוֹלָם</b> אֲהַבְתָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ חֶמְלָה גְדוֹלָה וִיתֵרָה חָמַֽלְתָּ עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ בַּעֲבוּר שִׁמְךָ הַגָּדוֹל וּבַעֲבוּר אֲבוֹתֵֽינוּ שֶׁבָּטְ֒חוּ בְךָ וַתְּ֒לַמְּ֒דֵם חֻקֵּי חַיִּים לַעֲשׂוֹת רְצוֹנְ֒ךָ בְּלֵבָב שָׁלֵם כֵּן תְּחָנֵּֽנוּ וּתְלַמְּ֒דֵֽנוּ: אָבִֽינוּ אָב הָרַחֲמָן הַמְרַחֵם רַחֵם עָלֵֽינוּ וְתֵן בְּלִבֵּֽנוּ בִּינָה לְהָבִין וּלְהַשְׂכִּיל לִשְׁמֹֽעַ לִלְמוֹד וּלְ֒לַמֵּד לִשְׁמֹר וְלַעֲשׂוֹת וּלְקַיֵּם אֶת־כָּל דִּבְרֵי־תַלְמוּד תּוֹרָתֶֽךָ בְּאַהֲבָה: וְהָאֵר עֵינֵֽינוּ בְּתוֹרָתֶֽךָ וְדַבֵּק לִבֵּֽנוּ בְּמִצְוֹתֶֽיךָ וְיַחֵד לְבָבֵֽנוּ לְאַהֲבָה וּלְיִרְאָה אֶת שְׁמֶֽךָ, לְמַֽעַן לֹא נֵבוֹשׁ וְלֹא נִכָּלֵם וְלֹא נִכָּשֵׁל לְעוֹלָם וָעֶד, כִּי בְשֵׁם קָדְשְׁ֒ךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא בָּטָֽחְנוּ נָגִֽילָה וְנִשְׂמְ֒חָה בִּישׁוּעָתֶֽךָ: וְרַחֲמֶֽיךָ יְהֹוָה אֶלֹהֵֽינוּ וַחֲסָדֶֽיךָ הָרַבִּים אַל יַעַזְבֽוּנוּ נֶֽצַח סֶֽלָה וָעֶד: מַהֵר וְהָבֵא עָלֵֽינוּ בְּרָכָה וְשָׁלוֹם מְהֵרָה מֵאַרְבַּע כַּנְפוֹת כָּל הָאָֽרֶץ וּשְׁבוֹר עוֹל הַגּוֹיִם מֵעַל צַוָּארֵֽנוּ וְתוֹלִיכֵֽנוּ מְהֵרָה קוֹמְ֒מִיּוּת לְאַרְצֵֽנוּ: כִּי אֵל פּוֹעֵל יְשׁוּעוֹת אָֽתָּה וּבָֽנוּ בָחַֽרְתָּ מִכָּל־עַם וְלָשׁוֹן וְקֵרַבְתָּֽנוּ מַלְכֵּֽנוּ לְשִׁמְךָ הַגָּדוֹל סֶֽלָה בֶּאֱמֶת בְּאַהֲבָה לְהוֹדוֹת לְךָ וּלְיַחֶדְךָ בְּאַהֲבָה וּלְאַהֲבָה אֶת שְׁמֶֽךָ: בָּרוּךְ אַתָּה יְהֹוָה הַבּוֹחֵר בְּעַמּוֹ יִשְׂרָאֵל בְּאַהֲבָה: <small>ואומר שמע ישראל. ונהגו לאומרו בקול רם כדי לעורר הכוונה בפסוק הראשון שבו עיקר הכוונה. ולא יאריך באל\"ף של אחד ולא יחטוף בחי\"ת. ויאריך בדל\"ת כשיעור שימליכהו בארבע רוחות העולם (אבודרהם). כל מקום שנרשם עגול כזה (°) הוא כדי להורות לתת ריוח בכל תיבה שתחלתה כסוף האות שלפניה.</small> <small>יחיד אומר</small> אֵל מֶֽלֶךְ נֶאֱמָן: <b>שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֹהֵֽינוּ יְהֹוָה אֶחָד:</b> <small>יש להפסיק מעט בין אחד לברוך כי עיקר קבול עול מלכות שמים היא פסוק ראשון. ויאמר בלחש:</small> <small>בָּרוּךְ שֵׁם כְּבוֹד מַלְכוּתוֹ לְעוֹלָם וָעֶד:</small> וְאָהַבְתָּ אֵת יְהֹוָה אֱלֹהֶֽיךָ בְּכָל֯־לְ֯בָבְךָ וּבְכָל־נַפְשְׁךָ וּבְכָל־מְאֹדֶֽךָ: וְהָיוּ הַדְּ֒בָרִים הָאֵֽלֶּה אֲשֶׁר֯ אָ֯נֹכִי מְצַוְּךָ הַיּוֹם עַל֯־לְ֯בָבֶֽךָ: וְשִׁנַּנְתָּם לְבָנֶֽיךָ וְדִבַּרְתָּ בָּם בְּשִׁבְתְּ֒ךָ בְּבֵיתֶֽךָ וּבְלֶכְתְּ֒ךָ בַדֶּֽרֶךְ וּבְשָׁכְבְּ֒ךָ וּבְקוּמֶֽךָ: וּקְשַׁרְתָּם לְאוֹת עַל֯־יָ֯דֶֽךָ וְהָיוּ לְטֹטָפֹת בֵּין עֵינֶֽיךָ: וּכְתַבְתָּם עַל־מְזֻזוֹת בֵּיתֶֽךָ וּבִשְׁעָרֶֽיךָ: <b>וְהָיָה</b> אִם־שָׁמֹֽעַ תִּשְׁמְ֒עוּ אֶל־מִצְוֹתַי אֲשֶׁר֯ אָ֯נֹכִי מְצַוֶּה אֶתְכֶם הַיּוֹם לְאַהֲבָה אֶת־יְהֹוָה אֱלֹהֵיכֶם וּלְעָבְדוֹ בְּכָל֯־לְ֯בַבְכֶם וּבְכָל־נַפְשְׁ֒כֶם: וְנָתַתִּי מְטַר֯־אַ֯רְצְ֒כֶם בְּעִתּוֹ֯ י֯וֹרֶה וּמַלְקוֹשׁ וְאָסַפְתָּ דְגָנֶֽךָ וְתִירשְׁ֒ךָ וְיִצְהָרֶֽךָ: וְנָתַתִּי עֵֽשֶׂב֯ בְּ֯שָׂדְ֒ךָ לִבְהֶמְתֶּֽךָ וְאָכַלְתָּ וְשָׂבָֽעְתָּ: הִשָּׁמְ֒רוּ לָכֶם פֶּן֯־יִ֯פְתֶּה לְבַבְכֶם וְסַרְתֶּם וַעֲבַדְתֶּם אֱלֹהִים֯ אֲ֯חֵרִים וְהִשְׁתַּחֲוִיתֶם לָהֶם: וְחָרָה אַף־יְהֹוָה בָּכֶם וְעָצַר֯ אֶ֯ת־הַשָּׁמַֽיִם וְלֹּא֯־יִ֯הְיֶה מָטָר וְהָאֲדָמָה לֹא תִתֵּן אֶת֯־יְ֯בוּלָהּ וַאֲבַדְתֶּם֯ מְ֯הֵרָה מֵעַל הָאָֽרֶץ הַטֹּבָה אֲשֶׁר֯ יְ֯הֹוָה נֹתֵן לָכֶם: וְשַׂמְתֶּם֯ אֶ֯ת־דְּבָרַי֯ אֵֽ֯לֶּה עַל֯־לְ֯בַבְכֶם וְעַל־נַפְשְׁ֒כֶם וּקְשַׁרְתֶּם֯ אֹ֯תָם לְאוֹת עַל֯־יֶ֯דְכֶם וְהָיוּ לְטוֹטָפֹת בֵּין עֵינֵיכֶם: וְלִמַּדְתֶּם֯ אֹ֯תָם אֶת־בְּנֵיכֶם לְדַבֵּר בָּם בְּשִׁבְתְּ֒ךָ בְּבֵיתֶֽךָ וּבְלֶכְתְּ֒ךָ בַדֶּֽרֶךְ וּבְשָׁכְבְּ֒ךָ וּבְקוּמֶֽךָ: וּכְתַבְתָּם עַל־מְזוּזוֹת בֵּיתֶֽךָ וּבִשְׁעָרֶֽיךָ: לְמַֽעַן֯ יִ֯רְבּוּ יְמֵיכֶם וִימֵי בְנֵיכֶם עַל הָאֲדָמָה אֲשֶׁר נִשְׁבַּע יְהֹוָה לַאֲבֹתֵיכֶם לָתֵת לָהֶם כִּימֵי הַשָּׁמַֽיִם עַל־הָאָֽרֶץ: <b>וַֽיֹּאמֶר֯</b> יְ֯הֹוָה֯ אֶ֯ל־משֶׁה לֵּאמֹר: דַּבֵּר֯ אֶ֯ל־בְּנֵי יִשְׂרָאֵל וְאָמַרְתָּ אֲלֵהֶם וְעָשׂוּ לָהֶם צִיצִת עַל־כַּנְ֒פֵי בִגְ֒דֵיהֶם לְדֹרֹתָם וְנָתְ֒נוּ עַל־צִיצִת הַכָּנָף֯ פְּ֯תִיל תְּכֵֽלֶת: וְהָיָה לָכֶם לְצִיצִת וּרְאִיתֶם֯ אֹ֯תוֹ וּזְכַרְתֶּם֯ אֶ֯ת־כָּל־מִצְוֹת֯ יְ֯הֹוָה וַעֲשִׂיתֶם֯ אֹ֯תָם וְלֹא תָתֽוּרוּ אַחֲרֵי לְבַבְכֶם וְאַחֲרֵי עֵינֵיכֶם אֲשֶׁר֯־אַ֯תֶּם זֹנִים֯ אַ֯חֲרֵיהֶם: לְמַֽעַן תִּזְכְּ֒רוּ וַעֲשִׂיתֶם֯ אֶ֯ת־כָּל־מִצְוֹתָי וִהְיִיתֶם קְדשִׁים לֵאלֹהֵיכֶם: אֲנִי יְהֹוָה אֱלֹהֵיכֶם֯ אֲ֯שֶׁר הוֹצֵֽאתִי אֶתְכֶם֯ מֵ֯אֶֽרֶץ מִצְרַֽיִם לִהְיוֹת לָכֶם לֵאלֹהִים֯ אֲ֯נִי יְהֹוָה אֱלֹהֵיכֶם֯: <small>יש לצרף <b>אֱלֹהֵיכֶם</b> ל<b>אֱמֶת</b></small> אֱ֯מֶת <small>שליח ציבור:</small> <b>יְהֹוָה אֱלֹהֵיכֶם֯ אֱ֯מֶת:</b> <small>כל שלא אמר אמת ויציב שחרית ואמת ואמונה ערבית לא יצא ידי חובתו שנאמר (תהלים צב ג) להגיד בבקר חסדך ואמונתך בלילות (ברכות יב.) ופירש\"י שברכת אמת ויציב כלה על חסד שעשה עם אבותינו שהוציאם ממצרים ובקע להם הים והעבירם.</small> <b>וְיַצִּיב</b> וְנָכוֹן וְקַיָּם וְיָשָׁר וְנֶאֱמָן וְאָהוּב וְחָבִיב וְנֶחְמָד וְנָעִים וְנוֹרָא וְאַדִּיר וּמְתֻקָּן וּמְקֻבָּל וְטוֹב וְיָפֶה הַדָּבָר הַזֶּה עָלֵֽינוּ לְעוֹלָם וָעֶד: אֱמֶת אֱלֹהֵי עוֹלָם מַלְכֵּֽנוּ צוּר יַעֲקֹב מָגֵן יִשְׁעֵֽנוּ, לְדֹר וָדֹר הוּא קַיָּם וּשְׁמוֹ קַיָּם וְכִסְאוֹ נָכוֹן וּמַלְכוּתוֹ וֶאֱמוּנָתוֹ לָעַד קַיָּֽמֶת: וּדְבָרָיו חָיִים וְקַיָּמִים נֶאֱמָנִים וְנֶחֱמָדִים לָעַד וּלְעוֹלְ֒מֵי עוֹלָמִים, עַל אֲבוֹתֵֽינוּ וְעָלֵֽינוּ עַל בָּנֵֽינוּ וְעַל דּוֹרוֹתֵֽינוּ וְעַל כָּל דּוֹרוֹת זֶֽרַע יִשְׂרָאֵל עֲבָדֶֽיךָ: <b>עַל הָרִאשׁוֹנִים</b> וְעַל הָאַחֲרוֹנִים דָּבָר טוֹב וְקַיָּם לְעוֹלָם וָעֶד, אֱמֶת וֶאֱמוּנָה חוֹק וְלֹא יַעֲבֹר: אֱמֶת שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ מַלְכֵּֽנוּ מֶֽלֶךְ אֲבוֹתֵֽינוּ גֹּאֲלֵֽנוּ גֹּאֵל אֲבוֹתֵֽינוּ יוֹצְ֒רֵֽנוּ צוּר יְשׁוּעָתֵֽנוּ פּוֹדֵֽנוּ וּמַצִּילֵֽנוּ מֵעוֹלָם הוּא שְׁמֶֽךָ וְאֵין לָֽנוּ עוֹד אֱלֹהִים זוּלָתֶֽךָ סֶֽלָה: <b>עֶזְרַת</b> אֲבוֹתֵֽינוּ אַתָּה הוּא מֵעוֹלָם מָגֵן וּמוֹשִֽׁיעַ לָהֶם וְלִבְנֵיהֶם אַחֲרֵיהֶם בְּכָל דּוֹר וָדוֹר: בְּרוּם עוֹלָם מוֹשָׁבֶֽךָ וּמִשְׁפָּטֶֽיךָ וְצִדְקָתְךָ עַד אַפְסֵי אָֽרֶץ: אֶמֶת אַשְׁרֵי אִישׁ שֶׁיִּשְׁמַע לְמִצְוֹתֶֽיךָ וְתוֹרָתְ֒ךָ וּדְבָרְ֒ךָ יָשִׂים עַל לִבּוֹ: אֱמֶת אַתָּה הוּא אָדוֹן לְעַמֶּֽךָ וּמֶֽלֶךְ גִּבּוֹר לָרִיב רִיבָם לאָבוֹת וּבָנִים: אֱמֶת אַתָּה הוּא רִאשׁוֹן וְאַתָּה הוּא אַחֲרוֹן וּמִבַּלְעָדֶֽיךָ אֵין לָֽנוּ מֶֽלֶךְ גּוֹאֵל וּמוֹשִֽׁיעַ: אֱמֶת מִמִּצְרַֽיִם גְּאַלְתָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ וּמִבֵּית עֲבָדִים פְּדִיתָֽנוּ: כָּל בְּכוֹרֵיהֶם הָרָֽגְתָּ וּבְכוֹרְ֒ךָ יִשְׂרָאֵל גָּאָֽלְתָּ וְיַם סוּף בָּקַֽעְתָּ וְזֵדִים טִבַּֽעְתָּ וִידִידִים הֶעֱבַֽרְתָּ וַיְכַסּוּ מַֽיִם צָרֵיהֶם אֶחָד מֵהֶם לֹא נוֹתָר: עַל זֹאת שִׁבְּ֒חוּ אֲהוּבִים וְרוֹמְ֒מוּ לָאֵל וְנָתְ֒נוּ יְדִידִים זְמִירוֹת שִׁירוֹת וְתִשְׁבָּחוֹת בְּרָכוֹת וְהוֹדָאוֹת לְמֶּֽלֶךְ אֵל חַי וְקַיָּם: רָם וְנִשָּׂא גָּדוֹל וְנוֹרָא מַשְׁפִּיל גֵּאִים עֲדֵי אָֽרֶץ וּמַגְבִּֽיהַּ שְׁפָלִים עֲדֵי מָרוֹם מוֹצִיא אֲסִירִים וּפוֹדֶה עֲנָוִים וְעוֹזֵר דַּלִּים וְעוֹנֶה לְעַמּוֹ יִשְׂרָאֵל בְּעֵת שַׁוְּ֒עָם אֵלָיו: תְּהִלּוֹת לְאֵל עֶלְיוֹן גֹּאֲלָם בָּרוּךְ הוּא וּמְבֹרָךְ, משֶׁה וּבְנֵי יִשְׂרָאֵל לְךָ עָנוּ שִׁירָה בְּשִׂמְחָה רַבָּה וְאָמְ֒רוּ כֻלָּם: <b>מִי כָמֹֽכָה</b> בָּאֵלִם יְהֹוָה מִי כָּמֹֽכָה נֶאְדָּר בַּקֹּֽדֶשׁ נוֹרָא תְהִלֹּת עֹֽשֵׂה פֶֽלֶא: <b>שִׁירָה</b> חֲדָשָׁה שִׁבְּ֒חוּ גְאוּלִים לְשִׁמְךָ הַגָּדוֹל עַל שְׂפַת הַיָּם יַֽחַד כֻּלָּם הוֹדוּ וְהִמְלִֽיכוּ וְאָמְרוּ: יְהֹוָה יִמְלֹךְ לְעוֹלָם וָעֶד: צוּר יִשְׂרָאֵל קֽוּמָה בְּעֶזְרַת יִשְׂרָאֵל וּפְדֵה כִנְאֻמֶֽךָ יְהוּדָה וְיִשְׂרָאֵל, גֹּאֲלֵֽנוּ יְהֹוָה צְבָאוֹת שְׁמוֹ קְדוֹשׁ יִשְׂרָאֵל: בָּרוּךְ אַתָּה יְהֹוָה גָּאַל יִשְׂרָאֵל: <small>המתפלל צריך שיכוין בליבו פירוש המילות שהוא מוציא בשפתיו. ואם אינו יכול לכוין פירוש המילות לכל הפחות צריך שיחשוב בשעת התפילה בדברים המכניעים את הלב ומכוונים את לבו לאביו שבשמים. יכוין רגליו זה אצל זה כאילו אינן אלא אחת. ויזהר להתפלל בלחש. ולא ירמוז בעיניו ולא יקרוץ בשפתיו ולא יראה באצבעותיו ואינו פוסק אפילו לקדיש וקדושה וברכו (קיצשו\"ע יח)</small>"));
  parts.push(hr);

  // ─── עמידה ───
  parts.push(p("<big><b>תְּפִלַּת הָעֲמִידָה</b></big>"));
  parts.push(p("אֲדֹנָי שְׂפָתַי תִּפְתָּח וּפִי יַגִּיד תְּהִלָּתֶֽךָ: <b>אבות</b> <b>בָּרוּךְ</b> אַתָּה יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אֱלֹהֵי אַבְרָהָם אֱלֹהֵי יִצְחָק וֵאלֹהֵי יַעֲקֹב הָאֵל הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא אֵל עֶלְיוֹן גּוֹמֵל חֲסָדִים טוֹבִים וְקוֹנֵה הַכֹּל וְזוֹכֵר חַסְדֵי אָבוֹת וּמֵבִיא גוֹאֵל לִבְנֵי בְנֵיהֶם לְמַֽעַן שְׁמוֹ בְּאַהֲבָה: <small>בעשי\"ת:</small> <small>זָכְרֵֽנוּ לְחַיִּים מֶֽלֶךְ חָפֵץ בַּחַיִּים וְכָתְבֵֽנוּ בְּסֵֽפֶר הַחַיִּים לְמַעַנְךָ אֱלֹהִים חַיִּים:</small> <small>אם לא אמר זכרנו ונזכר לאחר שכבר אמר בא\"י אינו חוזר אבל אם נזכר קודם שאמר השם אף שאמר ברוך אתה אומר זכרנו כו' מלך עוזר כסדר. הטועה ומזכיר זכרנו בשאר ימות השנה אם נזכר קודם שאמר וכתבנו פוסק ומתחיל מלך עוזר וגו' אבל אם אמר וכתבנו חוזר לראש התפלה. (דה\"ח)</small> מֶֽלֶךְ עוֹזֵר וּמוֹשִֽׁיעַ וּמָגֵן: בָּרוּךְ אַתָּה יְהֹוָה מָגֵן אַבְרָהָם: <b>גבורות</b> <b>אַתָּה גִבּוֹר</b> לְעוֹלָם אֲדֹנָי מְחַיֶּה מֵתִים אַתָּה רַב לְהוֹשִֽׁיעַ: <small>בקיץ:</small> מוֹרִיד הַטָּל <small>בחורף:</small> מַשִּׁיב הָרֽוּחַ וּמוֹרִיד הַגֶּֽשֶׁם: <small>טעה ולא אמר בחורף משיב הרוח ומוריד הגשם אם נזכר קודם שאמר הברכה מחיה המתים אומרו במקום שנזכר. אבל אם לא נזכר עד לאחר שסיים הברכה מחיה המתים צריך לחזור לראש התפלה. ואם נסתפק לו אם אמר משיב הרוח או לא אמר. אם הוא לאחר שלושים יום חזקתו שגם עתה התפלל כראוי. אבל בתוך שלושים יום צריך לחזור ולהתפלל (קיצור שו\"ע יט)</small> מְכַלְכֵּל חַיִּים בְּחֶֽסֶד מְחַיֵּה מֵתִים בְּרַחֲמִים רַבִּים סוֹמֵךְ נוֹפְ֒לִים וְרוֹפֵא חוֹלִים וּמַתִּיר אֲסוּרִים וּמְקַיֵּם אֱמוּנָתוֹ לִישֵׁנֵי עָפָר, מִי כָמֽוֹךָ בַּֽעַל גְּבוּרוֹת וּמִי דּֽוֹמֶה לָּךְ מֶֽלֶךְ מֵמִית וּמְחַיֶּה וּמַצְמִֽיחַ יְשׁוּעָה: <small>בעשי\"ת:</small> <small>מִי כָמֽוֹךָ אָב הָרַחַמָן זוֹכֵר יְצוּרָיו לְחַיִּים בְּרַחֲמִים:</small> <small>אם שכח לומר מי כמוך דינו כמו בזכרנו.</small> וְנֶאֱמָן אַתָּה לְהַחֲיוֹת מֵתִים: בָּרוּךְ אַתָּה יְהֹוָה מְחַיֵּה הַמֵּתִים: <small>בחזרת הש\"ץ אומרים כאן קדושה:</small> <b>קדושה</b> <small>קהל וחזן:</small> <b>נַקְדִישָׁךְ</b> וְנַעֲרִיצָךְ כְּנֹֽעַם שִֽׂיחַ סוֹד שַׂרְפֵי קֽוֹדֶשׁ הַמְּ֒שַׁלְּ֒שִׁים לְךָ קְדֻשָּׁה כַּכָּתוּב עַל יַד נְבִיאֶֽךָ וְקָרָא זֶה אֶל זֶה וְאָמַר: <small>קהל וחזן:</small> <b>קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהֹוָה צְבָאוֹת מְלֹא כָל הָאָֽרֶץ כְּבוֹדוֹ:</b> <small>שליח ציבור:</small> לְעֻמָּתָם מְשַׁבְּ֒חִים וְאוֹמְ֒רִים: <small>קהל וחזן:</small> <b>בָּרוּךְ כְּבוֹד יְהֹוָה מִמְּ֒קוֹמוֹ:</b> <small>שליח ציבור:</small> וּבְדִבְרֵי קָדְשְׁךָ כָּתוּב לֵאמֹר: <small>קהל וחזן:</small> <b>יִמְלֹךְ יְהֹוָה לְעוֹלָם אֱלֹהַֽיִךְ צִיּוֹן לְדֹר וָדֹר:</b> הַלְ֒לוּיָהּ: <b>קדושת השם</b> <b>אַתָּה קָדוֹשׁ</b> וְשִׁמְךָ קָדוֹשׁ וּקְדוֹשִׁים בְּכָל יוֹם יְהַלְ֒לֽוּךָ סֶּֽלָה: כִּי אֵל מֶֽלֶךְ גָּדוֹל וְקָדוֹשׁ אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה הָאֵל הַקָּדוֹשׁ: <small>בעשי\"ת מסיים:</small> <small>בָּרוּךְ אַתָּה יְהֹוָה הַמֶּֽלֶךְ הַקָּדוֹשׁ:</small> <small>אם טעה וסיים האל הקדוש אם נזכר בתוך כדי דיבור ואמר המלך הקדוש יצא ואם לאו צריך לחזור לראש התפלה וה\"ה אם מסופק אם אמר צריך לחזור לראש. ובימות השנה אם אמר המלך הקדוש אינו חוזר.</small> <b>בינה</b> <b>אַתָּה חוֹנֵן</b> לְאָדָם דַּֽעַת וּמְלַמֵּד לֶאֱנוֹשׁ בִּינָה: חָנֵּֽנוּ מֵאִתְּ֒ךָ חָכְמָה בִּינָה וָדָּעַת: בָּרוּךְ אַתָּה יְהֹוָה חוֹנֵן הַדָּֽעַת: <b>תשובה</b> <b>הֲשִׁיבֵֽנוּ</b> אָבִֽינוּ לְתוֹרָתֶֽךָ וְקָרְ֒בֵֽנוּ מַלְכֵּֽנוּ לַעֲבוֹדָתֶֽךָ וְהַחֲזִירֵֽנוּ בִּתְשׁוּבָה שְׁלֵמָה לְפָנֶֽיךָ: בָּרוּךְ אַתָּה יְהֹוָה הָרוֹצֶה בִּתְשׁוּבָה: <b>סליחה</b> <b>סְלַח לָֽנוּ</b> אָבִֽינוּ כִּי חָטָֽאנוּ מְחַל לָֽנוּ מַלְכֵּֽנוּ כִּי פָשָֽׁעְנוּ כִּי אֵל טוֹב וְסַלָח אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה חַנּוּן הַמַּרְבֶּה לִסְלֽוֹחַ: <b>גאולה</b> <b>רְאֵה</b> נָא בְעָנְיֵֽנוּ וְרִֽיבָה רִיבֵֽנוּ וּגְאָלֵֽנוּ גְאוּלָה שְׁלֵמָה מְהֵרָה לְמַֽעַן שְׁמֶֽךָ כִּי אֵל גּוֹאֵל חָזָק אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה גּוֹאֵל יִשְׂרָאֵל: <small>(בתענית ציבור אומר כאן הש\"ץ <b>עֲנֵֽנוּ</b>)</small> <b>רפואה</b> <b>רְפָאֵֽנוּ</b> יְהֹוָה וְנֵרָפֵא הוֹשִׁיעֵֽנוּ וְנִוָּשֵֽׁעָה כִּי תְהִלָּתֵֽנוּ אָֽתָּה וְהַעֲלֵה אֲרוּכָה וּמַרְפֵּא לְכָל תַּחֲלוּאֵֽינוּ וּלְכָל מַכְאוֹבֵֽינוּ וּלְכָל מַכּוֹתֵֽינוּ <small>מי שרוצה להתפלל על החולה יאמר כאן תחנה זו:</small> <small>יְהִי רָצוֹן מִלְפָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁתִּשְׁלַח מְהֵרָה רְפוּאָה שְׁלֵמָה מִן הַשָּׁמַֽיִם, רְפוּאַת הַנֶּֽפֶשׁ וּרְפוּאַת הַגּוּף, לַחוֹלֶה (פלוני/פלונית) בֶּן/בַּת (פלונית) בְּתוֹךְ שְׁאָר חוֹלֵי יִשְׂרָאֵל:</small> כִּי אֵל מֶֽלֶךְ רוֹפֵא נֶאֱמָן וְרַחֲמָן אָֽתָּה: בָּרוּךְ אַתָּה יְהֹוָה רוֹפֵא חוֹלֵי עַמּוֹ יִשְׂרָאֵל: <b>ברכת השנים</b> <b>בָּרֵךְ</b> עָלֵֽינוּ יְהֹוָה אֱלֹהֵֽינוּ אֶת־הַשָּׁנָה הַזֹּאת וְאֶת־כָּל־מִינֵי תְבוּאָתָהּ לְטוֹבָה, וְתֵן <small>בימות החמה:</small> בְּרָכָה <small>בימות הגשמים:</small> טַל וּמָטָר לִבְרָכָה עַל־פְּנֵי הָאֲדָמָה וְשַׂבְּ֒עֵֽנוּ מִטּוּבֶֽךָ וּבָרֵךְ שְׁנוֹתֵנוּ כַּשָּׁנִים הַטּוֹבוֹת לִבְרָכָה כִּי אֵל טוֹב וּמֵטִיב אַתָּה וּמְבָרֵךְ הַשָּׁנִים: בָּרוּךְ אַתָּה יְהֹוָה מְבָרֵךְ הַשָּׁנִים: <small>אם שכח לומר טַל וּמָטָר ונזכר קודם שהתחיל תְּקַע אומרו במקום שנזכר. התחיל לומר תְּקַע יאמרנה בשׁוֹמֵֽעַ תְּפִלָּה. ואם לא נזכר בש\"ת יאמרנה בין ש\"ת לרְצֵה. שכח גם שם אם נזכר קודם שעקר רגליו חוזר לברכת השנים ויתחיל בָּרֵךְ עָלֵֽינוּ ויתפלל כסדר. ואם עקר רגליו חוזר לראש התפלה.</small> <b>קיבוץ גליות</b> <b>תְּקַע</b> בְּשׁוֹפָר גָּדוֹל לְחֵרוּתֵֽנוּ וְשָׂא נֵס לְקַבֵּץ גָּלֻיּוֹתֵֽינוּ וְקַבְּ֒צֵֽנוּ יַֽחַד מְהֵרָה מֵאַרְבַּע כַּנְפוֹת הָאָֽרֶץ לְאַרְצֵֽנוּ: בָּרוּךְ אַתָּה יְהֹוָה מְקַבֵּץ נִדְחֵי עַמּוֹ יִשְׂרָאֵל: <b>דין</b> <b>הָשִֽׁיבָה</b> שׁוֹפְ֒טֵֽינוּ כְּבָרִאשׁוֹנָה וְיוֹעֲצֵֽינוּ כְּבַתְּ֒חִלָּה וְהָסֵר מִמֶּֽנּוּ יָגוֹן וַאֲנָחָה וּמְלוֹךְ עָלֵֽינוּ מְהֵרָה אַתָּה יְהֹוָה לְבַדְּ֒ךָ בְּחֶֽסֶד וּבְרַחֲמִים וְצַדְּ֒קֵֽנוּ בְּצֶֽדֶק וּבְמִשְׁפָּט: בָּרוּךְ אַתָּה יְהֹוָה מֶֽלֶךְ אֹהֵב צְדָקָה וּמִשְׁפָּט: <small>בעשי\"ת יסיים:</small> <small>בָּרוּךְ אַתָּה יְהֹוָה הַמֶּֽלֶךְ הַמִּשְׁפָּט:</small> <small>בכל השנה אם אמר המלך המשפט יצא וא\"צ לחזור. ובעשי\"ת אם טעה ואמר מלך אוהב צדקה ומשפט אם נזכר תוך כדי דבור אומר המלך המשפט. ואם לאחר כ\"ד לא יאמר ואין מחזירין אותו.</small> <b>ברכת המינים</b> <b>וְלַמַּלְשִׁינִים</b> אַל תְּהִי תִקְוָה וְכָל הָרִשְׁעָה כְּרֶגַע תֺּאבֵד וְכָל־אֹיְ֒בֶֽיךָ מְהֵרָה יִכָּרֵֽתוּ, וְהַזֵּדִים מְהֵרָה תְעַקֵּר וּתְשַׁבֵּר וּתְמַגֵּר וּתְכַלֵם וְתַשְׁפִּילֵם וְתַכְנִיעֵם בִּמְהֵרָה בְיָמֵֽינוּ: בָּרוּךְ אַתָּה יְהֹוָה שׁוֹבֵר אֹיְ֒בִים וּמַכְנִֽיעַ זֵדִים: <b>צדיקים</b> <b>עַל־הַצַּדִּיקִים</b> וְעַל־הַחֲסִידִים וְעַל־זִקְנֵי עַמְּ֒ךָ בֵּית יִשְׂרָאֵל וְעַל־פְּלֵיטַת (בֵּית) סוֹפְ֒רֵיהֶם וְעַל־גֵּרֵי הַצֶּֽדֶק וְעָלֵֽינוּ יֶהֱמוּ נָא רַחֲמֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וְתֵן שָׂכָר טוֹב לְכָל־הַבּוֹטְ֒חִים בְּשִׁמְךָ בֶּאֱמֶת וְשִׂים חֶלְקֵֽנוּ עִמָּהֶם וּלְעוֹלָם לֹא נֵבוֹשׁ כִּי בְךָ בָטָֽחְנוּ: בָּרוּךְ אַתָּה יְהֹוָה מִשְׁעָן וּמִבְטָח לַצַּדִּיקִים: <b>בנין ירושלים</b> <b>וְלִירוּשָׁלַֽיִם</b> עִירְ֒ךָ בְּרַחֲמִים תָּשׁוּב וְתִשְׁכּוֹן בְּתוֹכָהּ כַּאֲשֶׁר דִּבַּֽרְתָּ וּבְנֵה אוֹתָהּ בְּקָרוֹב בְּיָמֵֽינוּ בִּנְיַן עוֹלָם וְכִסֵּא דָוִד עַבְדֶּךָ, מְהֵרָה לְתוֹכָהּ תָּכִין: בָּרוּךְ אַתָּה יְהֹוָה בּוֹנֵה יְרוּשָׁלָֽיִם: <b>מלכות בית דוד</b> <b>אֶת־צֶֽמַח</b> דָּוִד עַבְדְּ֒ךָ מְהֵרָה תַצְמִֽיחַ וְקַרְנוֹ תָּרוּם בִּישׁוּעָתֶֽךָ, כִּי לִישׁוּעָתְ֒ךָ קִוִּינוּ כָּל הַיּוֹם וּמְצַפִּים לִישׁוּעָה: בָּרוּךְ אַתָּה יְהֹוָה מַצְמִֽיחַ קֶֽרֶן יְשׁוּעָה: <b>קבלת תפלה</b> <b>אָב הָרַחֲמָן</b> שְׁמַע קוֹלֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ חוּס וְרַחֵם עָלֵֽינוּ וְקַבֵּל בְּרַחֲמִים וּבְרָצוֹן אֶת תְּפִלָּתֵֽנוּ, כִּי אֵל שׁוֹמֵֽעַ תְּפִלּוֹת וְתַחֲנוּנִים אָֽתָּה וּמִלְּ֒פָנֶֽיךָ מַלְכֵּֽנוּ רֵיקָם אַל תְּשִׁיבֵֽנוּ, חָנֵּֽנוּ וַעֲנֵֽנוּ וּשְׁמַע תְּפִלָתֵֽנוּ* כִּי אַתָּה שׁוֹמֵֽעַ תְּפִלַּת כָּל פֶּה עַמְּ֒ךָ יִשְׂרָאֵל בְּרַחֲמִים: בָּרוּךְ אַתָּה יְהֹוָה שׁוֹמֵֽעַ תְּפִלָּה: <small>* תפלה שיתפלל על מזונו קודם כִּי אַתָּה:</small> <small>אַתָּה הוּא יְהֺוָה הָאֱלֹהִים הַזָּן וּמְפַרְנֵס וּמְכַלְכֵּל מִקַּרְנֵי רְאֵמִים עַד בֵּיצֵי כִנִּים. הַטְרִפֵֽנִי לֶֽחֶם חֻקִּי וְהַמְצֵא לִי וּלְכָל בְּנֵי בֵיתִי מְזוֹנוֹתַי קֽוֹדֶם שֶׁאֶצְטָרֵךְ לָהֶם, בְּנַֽחַת וְלֹא בְצַֽעַר, בְּהֶתֵּר וְלֹא בְּאִסּוּר, בְּכָבוֹד וְלֹא בְּבִזָּיוֹן, לְחַיִּים וּלְשָׁלוֹם, מִשֶּֽׁפַע בְּרָכָה וְהַצְלָחָה, וּמִשֶּֽׁפַע בְּרֵכָה עֶלְיוֹנָה, כְּדֵי שֶׁאוּכַל לַעֲשׂוֹת רְצוֹנֶֽךָ וְלַעֲסוֹק בְּתוֹרָתֶֽךָ וּלְקַיֵּם מִצְוֺתֶֽיךָ. וְאַל תַּצְרִיכֵֽנִי לִידֵי מַתְּ֒נַת בָּשָׂר וָדָם. וִיקֻיַּם בִּי מִקְרָא שֶׁכָּתוּב פּוֹתֵֽחַ אֶת יָדֶֽךָ וּמַשְׂבִּיעַ לְכָל חַי רָצוֹן. וְכָתוּב הַשְׁלֵךְ עַל יְהֺוָה יְהָבְ֒ךָ וְהוּא יְכַלכְּךָ:</small> <b>עבודה</b> <b>רְצֵה</b> יְהֹוָה אֱלֹהֵֽינוּ בְּעַמְּ֒ךָ יִשְׂרָאֵל וְלִתְפִלָּתָם שְׁעֵה, וְהָשֵׁב אֶת הָעֲבוֹדָה לִדְבִיר בֵּיתֶֽךָ וְאִשֵּׁי יִשְׂרָאֵל, וּתְפִלָּתָם בְּאַהֲבָה תְקַבֵּל בְּרָצוֹן וּתְהִי לְרָצוֹן תָּמִיד עֲבוֹדַת יִשְׂרָאֵל עַמֶּֽךָ: <small>בראש חדש ובחול המועד אומרים זה:</small> <b>אֱלֹהֵֽינוּ</b> וֵאלֹהֵי אֲבוֹתֵֽינוּ יַעֲלֶה וְיָבֹא וְיַגִּֽיעַ וְיֵרָאֶה וְיֵרָצֶה וְיִשָּׁמַע וְיִפָּקֵד וְיִזָּכֵר זִכְרוֹנֵֽנוּ וּפִקְדוֹנֵֽנוּ וְזִכְרוֹן אֲבוֹתֵֽינוּ וְזִכְרוֹן מָשִֽׁיחַ בֶּן דָּוִד עַבְדֶּֽךָ וְזִכְרוֹן יְרוּשָׁלַֽיִם עִיר קָדְשֶֽׁךָ וְזִכְרוֹן כָּל עַמְּ֒ךָ בֵּית יִשְׂרָאֵל לְפָנֶֽיךָ, לִפְלֵיטָה לְטוֹבָה לְחֵן וּלְחֶֽסֶד וּלְרַחֲמִים וּלְחַיִּים טוֹבִים וּלְשָׁלוֹם בְּיוֹם <small>לר\"ח:</small> רֹאשׁ הַחֹֽדֶשׁ הַזֶּה <small>לפסח:</small> חַג הַמַּצּוֹת הַזֶּה <small>לסכות:</small> חַג הַסֻּכּוֹת הַזֶּה זָכְרֵֽנוּ יְהֹוָה אֱלֹהֵֽינוּ בּוֹ לְטוֹבָה, וּפָקְדֵֽנוּ בוֹ לִבְרָכָה, וְהוֹשִׁיעֵֽנוּ בוֹ לְחַיִּים טוֹבִים, וּבִדְבַר יְשׁוּעָה וְרַחֲמִים חוּס וְחָנֵּֽנוּ, וְרַחֵם עָלֵֽינוּ וְהוֹשִׁיעֵֽנוּ, כִּי אֵלֶֽיךָ עֵינֵֽינוּ, כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה: <small>שכח ולא אמר יעלה ויבא אם נזכר קודם שאמר יהיו לרצון חוזר ומתחיל רצה. ואפלו אם נזכר קודם שהתחיל מודים כיון שסים ברכת המחזיר שכינתו לציון צריך להתחיל רצה. אך אם נזכר קודם ברכת המחזיר שכינתו לציון אומרו שם ומסים ותחזינה עינינו וכו'. ואם לא נזכר עד לאחר יהיו לרצון וגו' חוזר לראש התפלה.</small> <b>וְתֶחֱזֶֽינָה</b> עֵינֵֽינוּ בְּשׁוּבְ֒ךָ לְצִיּוֹן בְּרַחֲמִים: בָּרוּךְ אַתָּה יְהֹוָה הַמַּחֲזִיר שְׁכִינָתוֹ לְצִיּוֹן: <b>הודאה</b> <small>כשאומר מודים כורע ראשו וגופו כאגמון עד שיתפקקו כל חוליות שבשדרה. וכשהוא כורע יכרע במהירות בפעם אחת וכשהוא זוקף זוקף בנחת ראשו תחלה ואחר כך גופו שלא תהא עליו כמשאוי (שו\"ע או\"ח סי' קיג)</small> <b>מוֹדִים</b> אֲנַֽחְנוּ לָךְ שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ לְעוֹלָם וָעֶד צוּר חַיֵּֽינוּ מָגֵן יִשְׁעֵֽנוּ אַתָּה הוּא לְדוֹר וָדוֹר נוֹדֶה לְּךָ וּנְסַפֵּר תְּהִלָּתֶֽךָ עַל חַיֵּֽינוּ הַמְּ֒סוּרִים בְּיָדֶֽךָ וְעַל־נִשְׁמוֹתֵֽינוּ הַפְּ֒קוּדוֹת לָךְ וְעַל־נִסֶּֽיךָ שֶׁבְּ֒כָל־יוֹם עִמָּֽנוּ וְעַל־נִפְלְ֒אוֹתֶֽיךָ וְטוֹבוֹתֶֽיךָ שֶׁבְּ֒כָל־עֵת, עֶֽרֶב וָבֹֽקֶר וְצָהֳרָֽיִם, הַטּוֹב כִּי לֹא־כָלוּ רַחֲמֶֽיךָ וְהַמְרַחֵם כִּי לֹא־תַֽמּוּ חֲסָדֶֽיךָ, כִּי מֵעוֹלָם קִוִּינוּ לָךְ: <small>כשיגיע שליח צבור למודים וכורע כל העם שוחין ואומרין הודאה קטנה המתחלת כמו כן במודים. שאין דרך העבד להודות לרבו ולומר לו אדוני אתה על ידי שליח אלא כל אדם צריך לקבל בפיו עול מלכות שמים ואם יקבל על ידי שליח אינה קבלה גמורה שיוכל להכחיש ולומר לא שלחתיו. (אבודרהם)</small> <small><b>מוֹדִים</b> אֲנַֽחְנוּ לָךְ שָׁאַתָּה הוּא יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ אֱלֹהֵי כָל בָּשָׂר יוֹצְ֒רֵֽנוּ יוֹצֵר בְּרֵאשִׁית בְּרָכוֹת וְהוֹדָאוֹת לְשִׁמְךָ הַגָּדוֹל וְהַקָּדוֹשׁ עַל שֶׁהֶחֱיִיתָֽנוּ וְקִיַּמְתָּֽנוּ כֵּן תְּחַיֵּֽינוּ וּתְקַיְּ֒מֵֽנוּ וְתֶאֱסוֹף גָּלֻיּוֹתֵֽינוּ לְחַצְרוֹת קָדְשֶֽׁךָ לִשְׁמוֹר חֻקֶּֽיךָ וְלַעֲשׂוֹת רְצוֹנֶֽךָ וּלְעָבְדְּ֒ךָ בְּלֵבָב שָׁלֵם עַל שֶׁאָֽנוּ מוֹדִים לָךְ, בָּרוּךְ אֵל הַהוֹדָאוֹת:</small> <small>בחנוכה ופורים אומרים על הנסים. שכח לומר על הנסים ונזכר קודם שאמר השם מברכת הטוב שמך אפילו אמר ברוך אתה חוזר ואומר על הנסים. אבל אם כבר סיים הברכה או שאמר ברוך א\"י אינו חוזר (דה\"ח תרפ\"ב ותרצ\"ג).</small> <b>וְעַל הַנִּסִּים</b> וְעַל הַפֻּרְקָן וְעַל הַגְּ֒בוּרוֹת וְעַל הַתְּ֒שׁוּעוֹת וְעַל הַנִּפְלָאוֹת וְעַל הַנֶּחָמוֹת וְעַל הַמִּלְחָמוֹת שֶׁעָשִֽׂיתָ לַאֲבוֹתֵֽינוּ בַּיָּמִים הָהֵם בִּזְּ֒מַן הַזֶּה: <small>בחנוכה:</small> <b>בִּימֵי מַתִּתְיָֽהוּ</b> בֶּן יוֹחָנָן כֹּהֵן גָּדוֹל חַשְׁמוֹנָאִי וּבָנָיו כְּשֶׁעָמְ֒דָה מַלְכוּת יָוָן הָרְ֒שָׁעָה עַל־עַמְּ֒ךָ יִשְׂרָאֵל לְהַשְׁכִּיחָם תּוֹרָתֶֽךָ וּלְהַעֲבִירָם מֵחֻקֵּי רְצוֹנֶֽךָ, וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים עָמַֽדְתָּ לָהֶם בְּעֵת צָרָתָם רַֽבְתָּ אֶת־רִיבָם דַּֽנְתָּ אֶת־דִּינָם נָקַֽמְתָּ אֶת־נִקְמָתָם מָסַֽרְתָּ גִבּוֹרִים בְּיַד חַלָּשִׁים וְרַבִּים בְּיַד מְעַטִּים וּטְמֵאִים בְּיַד טְהוֹרִים וּרְשָׁעִים בְּיַד צַדִּיקִים וְזֵדִים בְּיַד עוֹסְ֒קֵי תוֹרָתֶֽךָ וּלְךָ עָשִֽׂיתָ שֵׁם גָּדוֹל וְקָדוֹשׁ בְּעוֹלָמֶֽךָ וּלְעַמְּ֒ךָ יִשְׂרָאֵל עָשִֽׂיתָ תְּשׁוּעָה גְדוֹלָה וּפֻרְקָן כְּהַיּוֹם הַזֶּה וְאַחַר־כַּךְ בָּֽאוּ בָנֶֽיךָ לִדְבִיר בֵּיתֶֽךָ וּפִנּוּ אֶת־הֵיכָלֶֽךָ וְטִהֲרוּ אֶת־מִקְדָּשֶֽׁךָ וְהִדְלִֽיקוּ נֵרוֹת בְּחַצְרוֹת קָדְשֶֽׁךָ וְקָבְ֒עוּ שְׁמוֹנַת יְמֵי חֲנֻכָּה אֵֽלּוּ לְהוֹדוֹת וּלְהַלֵּל לְשִׁמְךָ הַגָּדוֹל: <small>בפורים:</small> <b>בִּימֵי מָרְדְּ֒כַי וְאֶסְתֵּר</b> בְּשׁוּשַׁן הַבִּירָה כְּשֶׁעָמַד עֲלֵיהֶם הָמָן הָרָשָׁע בִּקֵּשׁ לְהַשְׁמִיד לַהֲרוֹג וּלְאַבֵּד אֶת־כָּל־הַיְּ֒הוּדִים מִנַּֽעַר וְעַד־זָקֵן טַף וְנָשִׁים בְּיוֹם אֶחָד בִּשְׁלוֹשָׁה עָשָׂר לְחֹֽדֶשׁ שְׁנֵים־עָשָׂר הוּא־חֹֽדֶשׁ אֲדָר וּשְׁלָלָם לָבוֹז: וְאַתָּה בְּרַחֲמֶֽיךָ הָרַבִּים הֵפַֽרְתָּ אֶת־עֲצָתוֹ וְקִלְקַֽלְתָּ אֶת־מַחֲשַׁבְתּוֹ וַהֲשֵׁבֽוֹתָ לּוֹ גְּמוּלוֹ בְּרֹאשׁוֹ וְתָלוּ אוֹתוֹ וְאֶת־בָּנָיו עַל־הָעֵץ: <b>וְעַל־כֻּלָּם</b> יִתְבָּרַךְ וְיִתְרוֹמַם וְיִתְנַשֵׂא שִׁמְךָ מַלְכֵּֽנוּ תָּמִיד לְעוֹלָם וָעֶד: <small>בעשי\"ת:</small> <small>וּכְתוֹב לְחַיִּים טוֹבִים כָּל בְּנֵי בְרִיתֶֽךָ:</small> <small>אם שכח לומר וכתוב אם נזכר קודם שאמר השם מברכת הטוב חוזר ואם לא נזכר עד לאחר שאמר השם אינו חוזר כמו שנתבאר לעיל אצל זכרנו ומי כמוך. (דה\"ח סי' תקפ\"ב)</small> <b>וְכֹל הַחַיִּים</b> יוֹדֽוּךָ סֶּֽלָה וִיהַלְ֒לוּ וְיבָרְ֒כוּ אֶת־שִׁמְךָ הַגָּדוֹל בְּאֱמֶת לְעוֹלָם כִּי טוֹב הָאֵל יְשׁוּעָתֵֽנוּ וְעֶזְרָתֵֽנוּ סֶֽלָה הָאֵל הַטּוֹב: בָּרוּךְ אַתָּה יְהֹוָה הַטּוֹב שִׁמְךָ וּלְךָ נָאֶה לְהוֹדוֹת: <small>ברכת כהנים</small> <small>שליח ציבור:</small> אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ בָּרְ֒כֵֽנוּ בַבְּ֒רָכָה הַמְּ֒שֻׁלֶּֽשֶׁת בַּתּוֹרָה הַכְּ֒תוּבָה עַל יְדֵי משֶׁה עַבְדֶּֽךָ, הָאֲמוּרָה מִפִּי אַהֲרֹן וּבָנָיו כֹּהֲנִים עַם קְדוֹשֶֽׁךָ כָּאָמוּר: יְבָרֶכְ֒ךָ יְהֹוָה וְיִשְׁמְ֒רֶֽךָ: יָאֵר יְהֹוָה פָּנָיו אֵלֶֽיךָ וִיחֻנֶּֽךָּ: יִשָּׂא יְהֹוָה פָּנָיו אֵלֶֽיךָ וְיָשֵׂם לְךָ שָׁלוֹם: <small>לאחר ברכת כהנים יאמרו הציבור:</small> <small>אַדִּיר בַּמָּרוֹם שׁוֹכֵן בִּגְ֒בוּרָה, אַתָּה שָׁלוֹם וְשִׁמְךָ שָׁלוֹם. יְהִי רָצוֹן שֶׁתָּשִׂים עָלֵֽינוּ וְעַל כָּל עַמְּ֒ךָ בֵּית יִשְׂרָאֵל חַיִּים וּבְרָכָה לְמִשְׁמֶֽרֶת שָׁלוֹם:</small> <b>שלום</b> <b>שִׂים שָׁלוֹם</b> טוֹבָה וּבְרָכָה חַיִים חֵן וָחֶֽסֶד וְרַחֲמִים עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל עַמֶּֽךָ, בָּרְ֒כֵֽנוּ אָבִֽינוּ כֻּלָּֽנוּ כְּאֶחָד בְּאוֹר פָּנֶֽיךָ כִּי בְאוֹר פָּנֶֽיךָ נָתַֽתָּ לָּֽנוּ יְהֹוָה אֱלֹהֵֽינוּ תּוֹרַת חַיִּים וְאַהֲבַת חֶֽסֶד וּצְדָקָה וּבְרָכָה וְרַחֲמִים וְחַיִּים וְשָׁלוֹם, וְטוֹב יִהְיֶה בְּעֵינֶֽיךָ לְבָרְ֒כֵֽנוּ וּלְבָרֵךְ אֶת־כָּל־עַמְּ֒ךָ יִשְׂרָאֵל בְּכָל־עֵת וּבְכָל־שָׁעָה בִּשְׁלוֹמֶֽךָ (בְּרוֹב עוֹז וְשָׁלוֹם). <small>בעשי\"ת:</small> <small>בְּסֵֽפֶר חַיִּים בְּרָכָה וְשָׁלוֹם וּפַרְנָסָה טוֹבָה וּגְזֵרוֹת טוֹבוֹת, יְשׁוּעוֹת וְנֶחָמוֹת, נִזָּכֵר וְנִכָּתֵב לְפָנֶֽיךָ אֲנַֽחְנוּ וְכָל עַמְּ֒ךָ בֵּית־יִשְׂרָאֵל לְחַיִּים טוֹבִים וּלְשָׁלוֹם:</small> <small>בעשי\"ת אומרים בספר חיים. ואם לא אמר כיון שסיים הברכה או רק בא\"י אינו חוזר. ונ\"ל דבזה ראוי לומר בספר תיכף כשסיים המברך את עמו ישראל בשלום קודם יהיו לרצון כיון שכבר גמר התפלה. (דהא לר\"ת לעולם אומרים בסוף ברכה אפילו בדבר שאין מחזירין אלא דהחולקים סוברים כיון דא\"צ לחזור א\"כ הוי הפסק באמצע תפלה מה שאין כן כאן.) (חיי אדם כלל כ\"ד סעי' כ\"ה)</small> בָּרוּךְ אַתָּה יְהֹוָה הַמְבָרֵךְ אֶת־עַמּוֹ יִשְׂרָאֵל בַּשָּׁלוֹם: יִהְיוּ לְרָצוֹן אִמְ֒רֵי פִי וְהֶגְיוֹן לִבִּי לְפָנֶֽיךָ יְהֹוָה צוּרִי וְגוֹאֲלִי: <b>אֱלֹהַי</b> נְצוֹר לְשׁוֹנִי מֵרָע וּשְׂפָתַי מִדַּבֵּר מִרְמָה וְלִמְקַלְ֒לַי נַפְשִׁי תִדּוֹם וְנַפְשִׁי כֶּעָפָר לַכֹּל תִּהְיֶה פְּתַח לִבִּי בְּתוֹרָתֶֽךָ וְאַחֲרֵי מִצְוֹתֶֽיךָ תִּרְדּוֹף נַפְשִׁי וְכָל הַקָמִים וְהַחוֹשְׁ֒בִים עָלַי רָעָה מְהֵרָה הָפֵר עֲצָתָם וְקַלְקֵל מַחֲשַׁבְתָּם: (יְהִי רָצוֹן מִלְפָנֶיךָ יְהֹוָה אֱלֹהַי וֵאלֹהֵי אֲבוֹתַי שֶׁלֹּא תַעֲלֶה קִנְאַת אָדָם עָלַי וְלֹא קִנְאָתִי עַל אֲחֵרִים וְשֶׁלֹּא אֶכְעֺס הַיּוֹם וְשֶׁלֹּא אַכְעִיסֶֽךָ וְתַצִּילֵנִי מִיֵּֽצֶר הָרָע וְתֵן בְּלִבִּי הַכְנָעָה וַעֲנָוָה. מַלְכֵּֽנוּ וֵאלֹהֵֽינוּ יַחֵד שִׁמְךָ בְּעוֹלָמֶֽךָ, בְּנֵה עִירְ֒ךָ, יַסֵּד בֵּיתֶֽךָ, וְשַׁכְלֵל הֵיכָלֶֽךָ. וְקַבֵּץ קִבּוּץ גָּלֻיּוֹת, וּפְדֵה צֺאנֶֽךָ וְשַׂמַּח עֲדָתֶֽךָ.) עֲשֵׂה לְמַֽעַן שְׁמֶֽךָ, עֲשֵׂה לְמַֽעַן יְמִינֶֽךָ, עֲשֵׂה לְמַֽעַן תּוֹרָתֶֽךָ, עֲשֵׂה לְמַֽעַן קְדֻשָּׁתֶֽךָ. לְמַֽעַן יֵחָלְ֒צוּן יְדִידֶֽיךָ הוֹשִֽׁיעָה יְמִינְ֒ךָ וַעֲנֵֽנִי: יִהְיוּ לְרָצוֹן אִמְרֵי פִי וְהֶגְיוֹן לִבִּי לְפָנֶֽיךָ יְהֹוָה צוּרִי וְגוֹאֲלִי: עֹשֶׂה (<small>בעשי\"ת</small> הַשָּׁלוֹם) שָׁלוֹם בִּמְרוֹמָיו  הוּא יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ וְעַל כָּל־יִשְׂרָאֵל וְאִמְרוּ אָמֵן: יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֹהֵֽינוּ וֵאלֹהֵי אֲבוֹתֵֽינוּ שֶׁיִּבָּנֶה בֵּית הַמִּקְדָּשׁ בִּמְהֵרָה בְיָמֵֽינוּ וְתֵן חֶלְקֵֽנוּ בְּתוֹרָתֶֽךָ: וְשָׁם נַעֲבָדְ֒ךָ בְּיִרְאָה כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמוֹנִיּוֹת: וְעָרְ֒בָה לַיהוָֹה מִנְחַת יְהוּדָה וִירוּשָׁלָֽםִ כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמוֹנִיּוֹת:"));
  parts.push(hr);

  // ─── תחנון ───
  if (isTachanunDay) {
    parts.push(p("<big><b>תַּחֲנוּן</b></big>"));
    parts.push(p("<small>בר\"ח וחולו של מועד וחנוכה אומרים כאן הלל לאחר חזרת הש\"ץ. בת\"צ אומרים סליחות. בימים שאין אומרים בהם תחנון יאמר הש\"ץ חצי קדיש.</small> <small>טעם נכון למה נתקן הוידוי בלשון רבים כי היה צריך לומר אשמתי בגדתי וכו'. אך העניין הוא שמלבד מה שנענש האדם על חטאיו גם הוא נענש על חברו מטעם הערבות כי כל ישראל הם גוף אחד כלול מאיברים רבים. אם כן לזה ראוי לאדם שיתוודה בלשון רבים כדי שיתוודה גם על חברו. (שער הכונות)</small> <b>אֱלֺהֵֽינוּ</b> וֵאלֺהֵי אֲבוֹתֵֽינוּ תָּבֹא לְפָנֶֽיךָ תְּפִלָּֽתֵֽנוּ, וְאַל־תִּתְעַלַּם מִתְּ֒חִנָּתֵֽנוּ שֶׁאֵין אָֽנוּ עַזֵּי פָנִים וּקְשֵׁי עֹֽרֶף לוֹמַר לְפָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ וֵאלֺהֵי אֲבוֹתֵֽינוּ צַדִּיקִים אֲנַֽחְנוּ וְלֺא חָטָֽאנוּ אֲבָל אֲנַֽחְנוּ וַאֲבוֹתֵֽינוּ חָטָֽאנוּ: <b>אָשַֽׁמְנוּ.</b> בָּגַֽדְנוּ. גָּזַֽלְנוּ. דִּבַּֽרְנוּ דֹּֽפִי. הֶעֱוִֽינוּ. וְהִרְשַֽׁעְנוּ. זַֽדְנוּ. חָמַֽסְנוּ. טָפַֽלְנוּ שֶֽׁקֶר. יָעַֽצְנוּ רָע. כִּזַּֽבְנוּ. לַֽצְנוּ. מָרַֽדְנוּ. נִאַֽצְנוּ. סָרַֽרְנוּ. עָוִֽינוּ. פָּשַֽׁעְנוּ. צָרַֽרְנוּ. קִשִּֽׁינוּ עֹֽרֶף. רָשַֽׁעְנוּ. שִׁחַֽתְנוּ. תִּעַֽבְנוּ. תָּעִֽינוּ. תִּעְתָּֽעְנוּ: סַֽרְנוּ מִמִּצְוֹתֶֽיךָ וּמִמִּשְׁפָּטֶֽיךָ הַטּוֹבִים וְלֺא שָֽׁוָה לָֽנוּ. וְאַתָּה צַדִּיק עַל כָּל הַבָּא עָלֵֽינוּ. כִּי אֱמֶת עָשִֽׂיתָ וַאֲנַֽחְנוּ הִרְשָֽׁעְנוּ: אֵל אֶֽרֶךְ־אַפַּֽיִם אַתָּה. וּבַֽעַל הָרַחֲמִים נִקְרֵֽאתָ. וְדֶֽרֶךְ תְּשׁוּבָה הוֹרֵֽיתָ: גְּדֻלַּת רַחֲמֶֽיךָ וַחֲסָדֶֽיךָ. תִּזְכֺּר הַיּוֹם וּבְכָל־יוֹם לְזֶֽרַע יְדִידֶֽיךָ: תֵּֽפֶן אֵלֵֽינוּ בְּרַחֲמִים. כִּי אַתָּה הוּא בַּֽעַל הָרַחֲמִים: בְּתַחֲנוּן וּבִתְ֒פִלָּה פָּנֶֽיךָ נְקַדֵּם. כְּהוֹדַֽעְתָּ לֶעָנָיו מִקֶּֽדֶם: מֵחֲרוֹן אַפְּ֒ךָ שׁוּב. כְּמוֹ בְּתוֹרָתְ֒ךָ כָּתוּב: וּבְ֒צֵל כְּנָפֶֽיךָ נֶחֱסֶה וְנִתְלוֹנָן. כְּיוֹם וַיֵֽרֶד יְהֺוָה בֶּעָנָן: תַּעֲבֺר עַל־פֶּֽשַׁע וְתִמְחֶה אָשָׁם. כְּיוֹם וַַיִּתְיַצֵּב עִמּוֹ שָׁם: תַּאֲזִין שַׁוְעָתֵֽנוּ וְתַקְשִׁיב מֶֽנוּ מַאֲמַר. כְּיוֹם וַיִּקְרָא בְשֵׁם יְהֹוָה, וְשָׁם נֶאֱמַר: <small>קהל וש\"ץ:</small> וַיַּעֲבֹר יְהֺוָה עַל פָּנָיו וַיִּקְרָא: יְהֺוָה יְהֺוָה אֵל רַחוּם וְחַנּוּן אֶֽרֶךְ אַפַּֽיִם וְרַב־חֶֽסֶד וֶאֱמֶת: נֹצֵר חֶֽסֶד לָאֲלָפִים נֹשֵׂא עָוֹן וָפֶֽשַׁע וְחַטָּאָה וְנַקֵּה: וְסָלַחְתָּ לַעֲוֺנֵֽנוּ וּלְ֒חַטָּאתֵֽנוּ וּנְ֒חַלְתָּֽנוּ: סְלַח־לָֽנוּ אָבִֽינוּ כִּי־חָטָֽאנוּ. מְחַל־לָֽנוּ מַלְכֵּֽנוּ כִּי־פָשָֽׁעְנוּ: כִּי־אַתָּה אֲדֺנָי טוֹב וְסַלָּח וְרַב־חֶֽסֶד לְכָל־קוֹרְ֒אֶֽיךָ: <small>כשנופל על פניו יש נוהגים להטות על צד ימין משום דכתיב שויתי ה' לנגדי תמיד. ויש נוהגים להטות על צד שמאל משום דהסבת שמאל שמה הסבה הלכך באותו צד שהוא נראה כבן מלך צריך ליכנע לפני המקום. וכבר נהגו ליפול בשחרית על צד ימין ובמנחה על צד שמאל.</small> וַיֹּֽאמֶר דָּוִד אֶל־גָּד צַר־לִי מְאֹד נִפְּ֒לָה־נָּא בְיַד־יְהֹוָה כִּי־רַבִּים רַחֲמָיו וּבְ֒יַד־אָדָם אַל־אֶפֹּֽלָה: רַחוּם וְחַנּוּן חָטָֽאתִי לְפָנֶֽיךָ יְהֹוָה מָלֵא רַחֲמִים רַחֵם עָלַי וְקַבֵּל תַּחֲנוּנָי: יְהֹוָה אַל־בְּאַפְּ֒ךָ תוֹכִיחֵֽנִי וְאַל־בַּחֲמָתְ֒ךָ תְיַסְּ֒רֵֽנִי: חָנֵּֽנִי יְהֹוָה כִּי אֻמְלַל אָֽנִי רְפָאֵֽנִי יְהֹוָה כִּי נִבְהֲלוּ עֲצָמָי: וְנַפְשִׁי נִבְהֲלָה מְאֹד וְאַתָּה יְהֹוָה עַד־מָתָי: שׁוּבָה יְהֹוָה חַלְּ֒צָה נַפְשִׁי הוֹשִׁיעֵֽנִי לְמַֽעַן חַסְדֶּֽךָ: כִּי אֵין בַּמָּֽוֶת זִכְרֶךָ בִּשְׁ֒אוֹל מִי־יוֹדֶה לָּךְ: יָגַֽעְתִּי־בְּאַנְחָתִי אַשְׂחֶה בְכָל־לַֽיְלָה מִטָּתִי בְּדִמְעָתִי עַרְשִׂי אַמְסֶה: עָשְׁ֒שָׁה מִכַּֽעַס עֵינִי עָתְ֒קָה בְּכָל־צוֹרְ֒רָי: סֽוּרוּ מִמֶּֽנִּי כָּל־פֹּֽעֲלֵי אָוֶן כִּי־שָׁמַע יְהֹוָה קוֹל בִּכְיִי: שָׁמַע יְהֹוָה תְּחִנָּתִי יְהֹוָה תְּפִלָּתִי יִקָּח: יֵבֽשׁוּ וְיִבָּהֲלוּ מְאֹד כָּל־אֹיְ֒בָי יָשֻֽׁבוּ יֵבֽשׁוּ רָֽגַע:"));
    parts.push(hr);
  }

  // ─── אבינו מלכנו ───
  if (isTachanunDay) {
    parts.push(p("<big><b>אָבִינוּ מַלְכֵּנוּ</b></big>"));
    parts.push(p("<small>בתענית ציבור ובעשי\"ת אומרים כאן אבינו מלכנו. גודל מעלת אבינו מלכנו הובא בספרים. ויסדה רבי עקיבא. ונתקן כנגד ברכות אמצעיות דתפלת י\"ח דחול. ולפי שיש בו מעין י\"ח אין אומרים בשבת.</small> אָבִֽינוּ מַלְכֵּֽנוּ חָטָֽאנוּ לְפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ אֵין לָֽנוּ מֶֽלֶךְ אֶלָּא אָֽתָּה: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה עִמָּֽנוּ לְמַֽעַן שְׁמֶֽךָ: <small>בעשי\"ת:</small> אָבִֽינוּ מַלְכֵּֽנוּ חַדֵּשׁ עָלֵֽינוּ שָׁנָה טוֹבָה: <small>בתענית ציבור:</small> אָבִֽינוּ מַלְכֵּֽנוּ בָּרֵךְ עָלֵֽינוּ שָׁנָה טוֹבָה: אָבִֽינוּ מַלְכֵּֽנוּ בַּטֵּל מֵעָלֵֽינוּ כָּל גְּזֵרוֹת קָשׁוֹת: אָבִֽינוּ מַלְכֵּֽנוּ בַּטֵּל מַחְשְׁ֒בוֹת שׂוֹנְ֒אֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ הָפֵר עֲצַת אוֹיְ֒בֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ כַּלֵּה כָּל צַר וּמַשְׂטִין מֵעָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ סְתוֹם פִּיּוֹת מַשְׂטִינֵֽנוּ וּמְ֒קַטְרִיגֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ כַּלֵּה דֶּֽבֶר וְחֶֽרֶב וְרָעָב וּשְׁ֒בִי וּמַשְׁחִית וְעָוֹן וּשְׁ֒מַד מִבְּ֒נֵי בְרִיתֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ מְנַע מַגֵּפָה מִנַּחֲלָתֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ סְלַח וּמְ֒חַל לְכָל עֲוֹנוֹתֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ מְחֵה וְהַעֲבֵר פְּשָׁעֵֽינוּ וְחַטֹּאתֵֽינוּ מִנֶּֽגֶד עֵינֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ מְחוֹק בְּרַחֲמֶֽיךָ הָרַבִּים כָּל שִׁטְ֒רֵי חוֹבוֹתֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ הַחֲזִירֵֽנוּ בִּתְ֒שׁוּבָה שְׁלֵמָה לְפָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ שְׁלַח רְפוּאָה שְׁלֵמָה לְחוֹלֵי עַמֶּֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ קְרַע רֹֽעַ גְּזַר דִּינֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ בְּזִכָּרוֹן טוֹב לְפָנֶֽיךָ: <small>בעשרת ימי תשובה:</small> אָבִֽינוּ מַלְכֵּֽנוּ כָּתְ֒בֵֽנוּ בְּסֵֽפֶר חַיִּים טוֹבִים: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְ֒בֵֽנוּ בְּסֵֽפֶר גְּאֻלָּה וִישׁוּעָה: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְ֒בֵֽנוּ בְּסֵֽפֶר פַּרְנָסָה וְכַלְכָּלָה: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְ֒בֵֽנוּ בְּסֵֽפֶר זְכֻיּוֹת: אָבִֽינוּ מַלְכֵּֽנוּ כָּתְ֒בֵֽנוּ בְּסֵֽפֶר סְלִיחָה וּמְ֒חִילָה: <small>בתענית ציבור</small> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ לְחַיִּים טוֹבִים:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ לִגְ֒אֻלָּה וִישׁוּעָה:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ לְפַרְנָסָה וְכַלְכָּלָה:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ לִזְ֒כֻיּוֹת:</b> <b>אָבִֽינוּ מַלְכֵּֽנוּ זָכְ֒רֵֽנוּ לִסְ֒לִיחָה וּמְ֒חִילָה:</b> אָבִֽינוּ מַלְכֵּֽנוּ הַצְמַח לָֽנוּ יְשׁוּעָה בְּקָרוֹב: אָבִֽינוּ מַלְכֵּֽנוּ הָרֵם קֶֽרֶן יִשְׂרָאֵל עַמֶּֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ הָרֵם קֶֽרֶן מְשִׁיחֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ מַלֵּא יָדֵֽינוּ מִבִּרְ֒כוֹתֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ מַלֵּא אֲסָמֵֽינוּ שָׂבָע: אָבִֽינוּ מַלְכֵּֽנוּ שְׁמַע קוֹלֵֽנוּ חוּס וְרַחֵם עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ קַבֵּל בְּרַחֲמִים וּבְ֒רָצוֹן אֶת תְּפִלָּתֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ פְּתַח שַׁעֲרֵי שָׁמַֽיִם לִתְ֒פִלָּתֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ זָכוֹר כִּי עָפָר אֲנָֽחְנוּ: אָבִֽינוּ מַלְכֵּֽנוּ נָא אַל תְּשִׁיבֵֽנוּ רֵיקָם מִלְּ֒פָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ תְּהֵא הַשָּׁעָה הַזֹּאת שְׁעַת רַחֲמִים וְעֵת רָצוֹן מִלְּ֒פָנֶֽיךָ: אָבִֽינוּ מַלְכֵּֽנוּ חֲמוֹל עָלֵֽינוּ וְעַל עוֹלָלֵֽינוּ וְטַפֵּֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן הֲרוּגִים עַל שֵׁם קָדְשֶֽׁךָ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן טְבוּחִים עַל יִחוּדֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן בָּאֵי בָאֵשׁ וּבַמַּֽיִם עַל קִדּוּשׁ שְׁמֶֽךָ: אָבִֽינוּ מַלְכֵּֽנוּ נְקוֹם לְעֵינֵֽינוּ נִקְ֒מַת דַּם עֲבָדֶֽיךָ הַשָּׁפוּךְ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַעַנְ֒ךָ אִם לֺא לְמַעֲנֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַעַנְ֒ךָ וְהוֹשִׁיעֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן רַחֲמֶֽיךָ הָרַבִּים: אָבִֽינוּ מַלְכֵּֽנוּ עֲשֵׂה לְמַֽעַן שִׁמְךָ הַגָּדוֹל הַגִּבּוֹר וְהַנּוֹרָא שֶׁנִּקְרָא עָלֵֽינוּ: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים עֲשֵׂה עִמָּֽנוּ צְדָקָה וָחֶֽסֶד וְהוֹשִׁיעֵֽנוּ:"));
    parts.push(hr);
  }

  // ─── שני וחמישי ───
  if (isMonThu) {
    parts.push(p("<big><b>תְּפִלַּת שֵׁנִי וַחֲמִישִׁי</b></big>"));
    parts.push(p("<small>בשני וחמישי יאמר והוא רחום. בשאר ימים שאומרים בהם תחנון יאמר שומר ישראל.</small> <small>נוהגים להרבות בתחנונים בשני וחמישי משום דאמרינן במדרש דמרע\"ה עלה בחמישי לקבל לוחות אחרונות וירד בשני. ואומרים והוא רחום. ויש במדרש דג' זקנים תקנוהו. שתפשם מלך אחד ונתנם בג' ספינות בלא מנהיג. ושלחם לים ונתפזרו למרחקים. ולמקום שבאו הציר להם מאד ועמדו בתפלה וכל אחד יסד מקצת. ובכל חלק י\"ח שמות כנגד תפלת י\"ח. וימת אותו מלך שהציר להם בתחלואים רעים. ושלחו תפלתם בכל תפוצות ישראל לאמרה בשני וחמישי (ע\"פ מחזור מכל השנה)</small> וְהוּא רַחוּם יְכַפֵּר עָוֺן וְלֹא־יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֹא־יָעִיר כָּל־חֲמָתוֹ: אַתָּה יְהֹוָה לֺא תִכְלָא רַחֲמֶֽיךָ מִמֶּֽנּוּ חַסְדְּ֒ךָ וַאֲמִתְּ֒ךָ תָּמִיד יִצְ֒רֽוּנוּ: הוֹשִׁיעֵֽנוּ יְהֹוָה אֱלֺהֵֽינוּ וְקַבְּ֒צֵֽנוּ מִן־הַגּוֹיִם לְהוֹדוֹת לְשֵׁם קָדְשֶֽׁךָ לְהִשְׁתַּבֵּֽחַ בִּתְ֒הִלָּתֶֽךָ: אִם־עֲוֺנוֹת תִּשְׁמָר־יָהּ אֲדֹנָי מִי יַעֲמֹד: כִּי־עִמְּ֒ךָ הַסְּ֒לִיחָה לְמַֽעַן תִּוָּרֵא: לֺא כַחֲטָאֵֽינוּ תַּעֲשֶׂה־לָּֽנוּ וְלֹא כַעֲוֺנֹתֵֽינוּ תִּגְמֹל עָלֵֽינוּ: אִם־עֲוֺנֵֽינוּ עָֽנוּ בָֽנוּ יְהֹוָה עֲשֵׂה לְמַֽעַן שְׁמֶֽךָ: זְכָר־רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: יַעֲנֵֽנוּ יְהֹוָה בְּיוֹם צָרָה יְשַׂגְּ֒בֵֽנוּ שֵׁם אֱלֺהֵי יַעֲקֹב: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים עֲשֵׂה עִמָּֽנוּ צְדָקָה כְּרוֹב רַחֲמֶֽיךָ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: אֲדוֹנֵֽינוּ אֱלֺהֵֽינוּ שְׁמַע קוֹל תַּחֲנוּנֵֽינוּ וּזְ֒כָר־לָֽנוּ אֶת־בְּרִית אֲבוֹתֵֽינוּ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: וְעַתָּה אֲדֹנָי אֱלֺהֵֽינוּ אֲשֶׁר הוֹצֵֽאתָ אֶת־עַמְּ֒ךָ מֵאֶֽרֶץ מִצְרַֽיִם בְּיָד חֲזָקָה וַתַּֽעַשׂ־לְךָ שֵׁם כַּיּוֹם הַזֶּה חָטָֽאנוּ רָשָֽׁעְנוּ: אֲדֹנָי כְּכָל־צִדְ֒קֹתֶֽיךָ יָֽשָׁב־נָא אַפְּ֒ךָ וַחֲמָתְ֒ךָ מֵעִירְ֒ךָ יְרוּשָׁלַֽםִ הַר־קָדְשֶֽׁךָ כִּי בַחֲטָאֵֽינוּ וּבַעֲוֺנוֹת אֲבֹתֵֽינוּ יְרוּשָׁלַֽםִ וְעַמְּ֒ךָ לְחֶרְפָּה לְכָל־סְבִיבֹתֵֽינוּ: וְעַתָּה שְׁמַע אֱלֺהֵֽינוּ אֶל־תְּפִלַּת עַבְדְּךָ וְאֶל־תַּחֲנוּנָיו וְהָאֵר פָּנֶֽיךָ עַל־מִקְדָּשְׁ֒ךָ הַשָּׁמֵם לְמַֽעַן אֲדֹנָי: הַטֵּה אֱלֺהַי אָזְנְךָ וּשְׁ֒מָע פְּקַח עֵינֶֽיךָ וּרְ֒אֵה שֹׁמְ֒מוֹתֵֽינוּ וְהָעִיר אֲשֶׁר־נִקְרָא שִׁמְךָ עָלֶֽיהָ כִּי לֺא עַל־צִדְ֒קֹתֵֽינוּ אֲנַֽחְנוּ מַפִּילִים תַּחֲנוּנֵֽינוּ לְפָנֶֽיךָ כִּי עַל־רַחֲמֶֽיךָ הָרַבִּים: אֲדֹנָי שְׁמָֽעָה אֲדֹנָי סְלָֽחָה אֲדֹנָי הַקְשִֽׁיבָה וַעֲשֵׂה אַל־תְּאַחַר: לְמַעַנְ֒ךָ אֱלֺהַי כִּי־שִׁמְךָ נִקְרָא עַל־עִירְ֒ךָ וְעַל־עַמֶּֽךָ: אָבִֽינוּ אָב הָרַחֲמָן הַרְאֵֽנוּ אוֹת לְטוֹבָה וְקַבֵּץ נְפוּצוֹתֵֽינוּ מֵאַרְבַּע כַּנְ֒פוֹת הָאָֽרֶץ: יַכִּֽירוּ וְיֵדְ֒עוּ כָּל־הַגּוֹיִם כִּי אַתָּה יְהֹוָה אֱלֺהֵֽינוּ: וְעַתָּה יְהֹוָה אָבִֽינוּ אָֽתָּה אֲנַֽחְנוּ הַחֹֽמֶר וְאַתָּה יֹצְ֒רֵֽנוּ וּמַעֲשֵׂה יָדְ֒ךָ כֻּלָּֽנוּ: הוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ אָבִֽינוּ מַלְכֵּֽנוּ צוּרֵֽנוּ וְגוֹאֲלֵֽנוּ: חֽוּסָה יְהֹוָה עַל־עַמֶּֽךָ וְאַל־תִּתֵּן נַחֲלָתְ֒ךָ לְחֶרְפָּה לִמְשָׁל־בָּם גּוֹיִם: לָֽמָּה יֹאמְ֒רוּ בָעַמִּים אַיֵּה (נָא) אֱלֺהֵיהֶם: יָדַֽעְנוּ יְהֺוָה כִּי חָטָֽאנוּ וְאֵין מִי יַעֲמֹד בַּעֲדֵֽנוּ אֶלָּא שִׁמְךָ הַגָּדוֹל יַעֲמָד־לָֽנוּ בְּעֵת צָרָה: יָדַֽעְנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים צְדָקָה עֲשֵׂה עִמָּֽנוּ לְמַֽעַן שְׁמֶֽךָ: כְּרַחֵם אָב עַל־בָּנִים כֵּן תְּרַחֵם יְהֹוָה עָלֵֽינוּ וְהוֹשִׁיעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: חֲמוֹל עַל עַמֶּֽךָ רַחֵם עַל נַחֲלָתֶֽךָ חֽוּסָה־נָּא כְּרוֹב רַחֲמֶֽיךָ חָנֵּֽנוּ מַלְכֵּֽנוּ וַעֲנֵֽנוּ כִּי לְךָ יְהֹוָה הַצְּ֒דָקָה עֹשֵׂה נִפְלָאוֹת בְּכָל עֵת: הַבֶּט־נָא רַחֶם־נָא וְהוֹשִֽׁיעָה־נָא צֹאן מַרְעִיתֶֽךָ וְאַל יִמְשָׁל־בָּֽנוּ קֶֽצֶף כִּי לְךָ יְהֹוָה הַיְ֒שׁוּעָה: בְּךָ תוֹחַלְתֵּֽנוּ אֱלֽוֹהַּ סְלִיחוֹת אָנָּא סְלַח־נָא כִּי אֵל טוֹב וְסַלָּח אָֽתָּה: אָנָּא מֶֽלֶךְ חַנוּן וְרַחוּם זְכוֹר וְהַבֵּט לִבְ֒רִית בֵּין הַבְּ֒תָרִים וְתֵרָאֶה לְפָנֶֽיךָ עֲקֵדַת יָחִיד וּלְ֒מַֽעַן יִשְׂרָאֵל אָבִֽינוּ: אַל־תַּעַזְ֒בֵֽנוּ אָבִֽינוּ וְאַל־תִּטְּ֒שֵֽׁנוּ מַלְכֵּֽנוּ וְאַל־תִּשְׁכָּחֵֽנוּ יוֹצְ֒רֵֽנוּ וְאַל־תַּֽעַשׁ עִמָּֽנוּ כָּלָה בְּגָלוּתֵֽנוּ כִּי אֵל מֶֽלֶךְ חַנּוּן וְרַחוּם אָֽתָּה: אֵין כָּמֽוֹךָ חַנּוּן וְרַחוּם יְהֹוָה אֱלֺהֵֽינוּ אֵין כָּמֽוֹךָ אֵל אֶֽרֶךְ אַפַּֽיִם וְרַב חֶֽסֶד וֶאֱמֶת: הוֹשִׁיעֵֽנוּ וְרַחֲמֵֽנוּ בְּרַחֲמֶֽיךָ הָרַבִּים מֵרַֽעַשׁ וּמֵרֺֽגֶז הַצִּילֵֽנוּ: זְכֺר לַעֲבָדֶֽיךָ לְאַבְרָהָם לְיִצְחָק וּלְ֒יַעֲקֹב אַל־תֵּֽפֶן אֶל־קְשִׁי הָעָם הַזֶּה וְאֶל־רִשְׁעוֹ וְאֶל־חַטָּאתוֹ: שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: וְהָסֵר מִמֶּֽנּוּ מַכַּת הַמָּֽוֶת כִּי רַחוּם אָֽתָּה: כִּי כֵן דַּרְכֶּֽךָ עֹשֶׂה חֶֽסֶד חִנָּם בְּכָל־דּוֹר וָדוֹר: חֽוּסָה יְהֹוָה עַל־עַמֶּֽךָ וְהַצִּילֵֽנוּ מִזַּעְמֶֽךָ: וְהָסֵר מִמֶּֽנּוּ מַכַּת הַמַּגֵּפָה וּגְ֒זֵרָה קָשָׁה כִּי אַתָּה שׁוֹמֵר יִשְׂרָאֵל: לְךָ אֲדֹנָי הַצְּ֒דָקָה וְלָֽנוּ בּֽשֶׁת הַפָּנִים: מַה־נִּתְאוֹנֵן וּמַה־נֹּאמַר מַה־נְּדַבֵּר וּמַה־נִּצְטַּדָּק: נַחְפְּשָׂה דְרָכֵֽינוּ וְנַחְקֺֽרָה וְנָשֽׁוּבָה אֵלֶֽיךָ כִּי יְמִינְ֒ךָ פְשׁוּטָה לְקַבֵּל שָׁבִים: אָֽנָּא יְהֹוָה הוֹשִֽׁיעָה נָּא אָֽנָּא יְהֹוָה הַצְלִיחָה נָא: אָֽנָּא יְהֹוָה עֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: לְךָ יְהֹוָה חִכִּֽינוּ לְךָ יְהֹוָה קִוִּינוּ לְךָ יְהֹוָה נְיַחֵל אַל תֶּחֱשֶׁה וּתְ֒עַנֵּֽנוּ כִּי נָאֲמוּ גוֹיִם אָבְ֒דָה תִקְוָתָם: כָּל־בֶּֽרֶךְ לְךָ תִכְרַע וְכָל־קוֹמָה לְפָנֶֽיךָ לְבַד תִּשְׁתַּחֲוֶה: הַפּוֹתֵֽחַ יָד בִּתְ֒שׁוּבָה לְקַבֵּל פּוֹשְׁ֒עִים וְחַטָּאִים נִבְהֲלָה נַפְשֵֽׁנוּ מֵרוֹב עִצְּ֒בוֹנֵֽנוּ אַל־תִּשְׁכָּחֵֽנוּ נֶֽצַח קֽוּמָה וְהוֹשִׁיעֵֽנוּ: אַל־תִּשְׁפּוֹךְ חֲרוֹנְ֒ךָ עָלֵֽינוּ כִּי אֲנַֽחְנוּ עַמְּ֒ךָ בְּנֵי בְרִיתֶֽךָ: אֵל הַבִּֽיטָה דַּל כְּבוֹדֵֽנוּ בַּגּוֹיִם וְשִׁקְּ֒צֽוּנוּ כְּטֻמְאַת הַנִּדָּה: עַד־מָתַי עֻזְּ֒ךָ בַּשְּׁ֒בִי וְתִפְאַרְתְּ֒ךָ בְּיַד־צָר: עוֹרְ֒רָה גְבוּרָתְ֒ךָ וְהוֹשִׁעֵֽנוּ לְמַֽעַן שְׁמֶֽךָ: אַל־יִמְעֲטוּ לְפָנֶֽיךָ תְּלָאוֹתֵֽינוּ: מַהֵר יְקַדְּ֒מֽוּנוּ רַחֲמֶֽיךָ בְּעֵת צָרוֹתֵֽינוּ, לֺא לְמַעֲנֵֽנוּ אֶלָּא לְמַעַנְ֒ךָ פְעַל, וְאַל תַּשְׁחִית אֶת־זֵֽכֶר שְׁאֵרִיתֵֽנוּ, כִּי לְךָ מְיַחֲלוֹת עֵינֵֽינוּ כִּי אֵל מֶֽלֶךְ חַנוּן וְרַחוּם אָֽתָּה: וּזְ֒כוֹר עֵדוּתֵֽנוּ בְּכָל־יוֹם תָּמִיד אוֹמְ֒רִים פַּעֲמַֽיִם בְּאַהֲבָה: שְׁמַע יִשְׂרָאֵל יְהֹוָה אֱלֺהֵֽינוּ יְהֹוָה אֶחָד: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: הַבֵּט מִשָּׁמַֽיִם וּרְ֒אֵה כִּי הָיִֽינוּ לַֽעַג וָקֶֽלֶס בַּגּוֹיִם: נֶחְשַֽׁבְנוּ כַּצֹּאן לָטֶֽבַח יוּבָל, לַהֲרוֹג וּלְ֒אַבֵּד וּלְ֒מַכָּה וּלְ֒חֶרְפָּה: וּבְכָל־זֹאת שִׁמְךָ לֺא שָׁכָֽחְנוּ נָא אַל־תִּשְׁכָּחֵֽנוּ: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: זָרִים אוֹמְ֒רִים אֵין תּוֹחֶֽלֶת וְתִקְוָה: חוֹן אוֹם לְשִׁמְךָ מְקַוֶּה: טָהוֹר, יְשׁוּעָתֵֽנוּ קָרְ֒בָה, יָגַֽעְנוּ וְלֺא הֽוּנַח־לָֽנוּ: רַחֲמֶֽיךָ יִכְבְּ֒שׁוּ אֶת־כַּעַסְ֒ךָ מֵעָלֵֽינוּ: אָנָּא שׁוּב מֵחֲרוֹנְ֒ךָ וְרַחֵם סְגֻלָּה אֲשֶׁר בָּחָֽרְתָּ: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: חֽוּסָה יְהֹוָה עָלֵֽינוּ בְּרַחֲמֶֽיךָ, וְאַל תִּתְּ֒נֵֽנוּ בִּידֵי אַכְזָרִים: לָֽמָּה יֹאמְ֒רוּ הַגּוֹיִם אַיֵּה־נָא אֱלֺהֵיהֶם לְמַעַנְ֒ךָ עֲשֵׂה עִמָּֽנוּ חֶֽסֶד וְאַל תְּאַחַר: אָנָּא שׁוּב מֵחֲרוֹנְ֒ךָ וְרַחֵם סְגֻלָּה אֲשֶׁר בָּחָֽרְתָּ: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: קוֹלֵֽנוּ תִשְׁמַע וְתָחוֹן וְאַל־תִּטְּ֒שֵֽׁנוּ בְּיַד אֹיְ֒בֵֽינוּ לִמְחוֹת אֶת־שְׁמֵֽנוּ: זְכוֹר אֲשֶׁר נִשְׁבַּֽעְתָּ לַאֲבוֹתֵֽינוּ, כְּכוֹכְ֒בֵי הַשָּׁמַֽיִם אַרְבֶּה אֶת־זַרְעֲכֶם וְעַתָּה נִשְׁאַֽרְנוּ מְעַט מֵהַרְבֵּה: וּבְכָל־זֹאת שִׁמְךָ לֺא שָׁכָֽחְנוּ נָא אַל תִּשְׁכָּחֵֽנוּ: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: עָזְ֒רֵֽנוּ אֱלֺהֵי יִשְׁעֵֽנוּ עַל־דְּבַר כְּבוֹד־שְׁמֶֽךָ וְהַצִּילֵֽנוּ וְכַפֵּר עַל־חַטֹּאתֵֽינוּ לְמַֽעַן שְׁמֶֽךָ: יְהֹוָה אֱלֺהֵי יִשְׂרָאֵל שׁוּב מֵחֲרוֹן אַפֶּֽךָ וְהִנָּחֵם עַל־הָרָעָה לְעַמֶּֽךָ: שׁוֹמֵר יִשְׂרָאֵל שְׁמוֹר שְׁאֵרִית יִשְׂרָאֵל וְאַל יֹאבַד יִשְׂרָאֵל הָאֹמְ֒רִים שְׁמַע יִשְׂרָאֵל: שׁוֹמֵר גּוֹי אֶחָד שְׁמוֹר שְׁאֵרִית עַם אֶחָד וְאַל יֹאבַד גּוֹי אֶחָד הַמְ֒יַחֲדִים שִׁמְךָ יְהֹוָה אֱלֺהֵֽינוּ יְהֹוָה אֶחָד: שׁוֹמֵר גּוֹי קָדוֹשׁ שְׁמוֹר שְׁאֵרִית עַם קָדוֹשׁ וְאַל יֹאבַד גּוֹי קָדוֹשׁ הַמְ֒שַׁלְּ֒שִׁים בְּשָׁלשׁ קְדֻשּׁוֹת לְקָדוֹשׁ: מִתְרַצֶּה בְּרַחֲמִים וּמִתְפַּיֵּס בְּתַחֲנוּנִים הִתְרַצֶּה וְהִתְפַּיֵּס לְדוֹר עָנִי כִּי אֵין עוֹזֵר: אָבִֽינוּ מַלְכֵּֽנוּ חָנֵּֽנוּ וַעֲנֵֽנוּ כִּי אֵין בָּֽנוּ מַעֲשִׂים עֲשֵׂה עִמָּֽנוּ צְדָקָה וָחֶֽסֶד וְהוֹשִׁיעֵֽנוּ: וַאֲנַֽחְנוּ לֺא נֵדַע מַה נַּעֲשֶׂה כִּי עָלֶֽיךָ עֵינֵֽינוּ: זְכֹר רַחֲמֶֽיךָ יְהֹוָה וַחֲסָדֶֽיךָ כִּי מֵעוֹלָם הֵֽמָּה: יְהִי חַסְדְּ֒ךָ יְהֹוָה עָלֵֽינוּ כַּאֲשֶׁר יִחַֽלְנוּ לָךְ: אַל תִּזְכָּר לָֽנוּ עֲוֹנוֹת רִאשׁוֹנִים מַהֵר יְקַדְּ֒מֽוּנוּ רַחֲמֶֽיךָ כִּי דַלּֽוֹנוּ מְאֹד: עֶזְרֵֽנוּ בְּשֵׁם יְהֹוָה עֹשֵׂה שָׁמַֽיִם וְאָֽרֶץ: חָנֵּֽנוּ יְהֹוָה חָנֵּֽנוּ כִּי־רַב שָׂבַֽעְנוּ בוּז: בְּרֺֽגֶז רַחֵם תִּזְכּוֹר: בְּרֹֽגֶז עַקֵדָה תִּזְכּוֹר, בְּרֹֽגֶז תְּמִימוֹת תִּזְכּוֹר: יְהֹוָה הוֹשִֽׁיעָה, הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: כִּי הוּא יָדַע יִצְרֵֽנוּ זָכוּר כִּי עָפָר אֲנָֽחְנוּ: עָזְ֒רֵֽנוּ אֱלֺהֵי יִשְׁעֵֽנוּ עַל־דְּבַר כְּבוֹד־שְׁמֶֽךָ וְהַצִּילֵֽנוּ וְכַפֵּר עַל־חַטֹּאתֵֽינוּ לְמַֽעַן שְׁמֶֽךָ: <small>ש\"ץ אומר חצי קדיש:</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְקָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן: <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ</b> לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא: יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן: <small>אשרי ובא לציון. כשמכריזים דבר יש להכריז קודם שיתחיל החזן אשרי (מגן אברהם סי' קלב)</small>"));
    parts.push(hr);
  }

  // ─── קריאת התורה ───
  if (isTorahReadingDay) {
    parts.push(p("<big><b>קְרִיאַת הַתּוֹרָה</b></big>"));
    parts.push(p("<small>אין אומרים אא\"א לא בר\"ח ולא בע\"פ ולא בערב יו\"כ ולא בחנוכה ולא בשני ימים של פורים קטן וגדול. ויש נוהגים שאין אומרים אותו בכל יום שאין אומרים בו תחנון. אין אומרים אא\"א בבית האבל. וצריך לאומרו מעומד.</small> אֵל אֶֽרֶךְ אַפַּֽיִם וּמָלֵא רַחֲמִים, אַל־תַּסְתֵּר פָּנֶֽיךָ מִמֶּֽנוּ: חֽוּסָה יְהֹוָה עַל־יִשְׂרָאֵל עַמֶּֽךָ וְהַצִּילֵֽנוּ מִכָּל־רָע: חָטָֽאנוּ לְךָ אָדוֹן, סְלַח נָא כְּרוֹב רַחֲמֶֽיךָ אֵל: <small>משה רבינו ונביאים שעמו תקנו שיהו קורין בתורה בשני וחמישי. כדי שלא ישהו ישראל שלשה ימים בלא תורה. ושני וחמישי הם ימי רצון. שבשני עלה משרע\"ה לקבל לוחות אחרונים וירד בחמישי. ומתקנת עזרא שיהו קורין תלתא גברי. וכשמוציאין ס\"ת צריך לנהוג בו כבוד הרבה ויביט בו משעה שמוציאין אותו מהארון עד שמניחין אותו במקומו. ולא ידבר דברים ושיחה בטילה. כי זה הוא ביזוי התורה. (דה\"ח)</small> <small>כשפותחין הארון הקדוש אומרים זה:</small> וַיְהִי בִּנְ֒סֹֽעַ הָאָרֹן וַיּֽאמֶר משֶׁה קוּמָה יְהֹוָה וְיָפֻֽצוּ אֹיְ֒בֶֽיךָ וְיָנֻֽסוּ מְשַׂנְאֶֽיךָ מִפָּנֶֽיךָ: כִּי מִצִּיּוֹן תֵּצֵא תוֹרָה וּדְ֒בַר יְהֹוָה מִירוּשָׁלָֽםִ: בָּרוּךְ שֶׁנָּתַן תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל בִּקְ֒דֻשָּׁתוֹ: <small>איתא בזהר (ויקהל דף ר\"ו.) אר\"ש כד מפקין ס\"ת בצבורא למקרי ביה מפתחי תרעי דשמיא דרחמין ומעוררין את האהבה לעילא ואיבעי ליה לבר נש למימר הכי:</small> בְּרִיךְ שְׁמֵהּ דְּמָרֵא עָלְ֒מָא בְּרִיךְ כִּתְרָךְ וְאַתְרָךְ, יְהֵא רְעוּתָךְ עִם עַמָּךְ יִשְׂרָאֵל לְעָלָם, וּפֻרְקַן יְמִינָךְ אַחֲזֵי לְעַמָּךְ בְּבֵית מַקְדְּ֒שָׁךְ וּלְ֒אַמְטוּיֵי לָנָא מִטּוּב נְהוֹרָךְ וּלְ֒קַבֵּל צְלוֹתָֽנָא בְּרַחֲמִין, יְהֵא רַעֲוָא קֳדָמָךְ דְּתוֹרִיךְ לָן חַיִּין בְּטִיבוּתָא, וְלֶהֱוֵי אֲנָא פְקִידָא בְּגוֹ צַדִּיקַיָּא, לְמִרְחַם עָלַי וּלְ֒מִנְטַר יָתִי וְיַת כָּל דִּי לִי וְדִי לְעַמָּךְ יִשְׂרָאֵל, אַנְתְּ הוּא זָן לְכֹלָּא וּמְ֒פַרְנֵס לְכֹלָּא, אַנְתְּ הוּא שַׁלִּיט עַל כֹּלָּא, אַנְתְּ הוּא דְּשַׁלִּיט עַל מַלְ֒כַיָּא וּמַלְכוּתָא דִּילָךְ הִיא, אֲנָא עַבְדָּא דְקוּדְשָׁא בְּרִיךְ הוּא דְּסָגִֽידְנָא קַמֵּהּ וּמִקַּמֵּהּ דִּיקַר אוֹרַיְ֒תֵהּ בְּכָל עִדָּן וְעִדָּן, לָא עַל אֱנָשׁ רָחִיצְנָא, וְלָא עַל בַּר אֱלָהִין סָמִיכְנָא, אֶלָּא בֶּאֱלָהָא דִשְׁ֒מַיָּא, דְּהוּא אֱלָהָא קְשׁוֹט, וְאוֹרַיְ֒תֵהּ קְשׁוֹט, וּנְ֒בִיאוֹהִי קְשׁוֹט, וּמַסְגֵּא לְמֶעְבַּד טַבְוָן וּקְ֒שׁוֹט, בֵּהּ אֲנָא רָחִיץ וְלִשְׁ֒מֵהּ קַדִּישָׁא יַקִּירָא אֲנָא אֵמַר תֻּשְׁבְּחָן, יְהֵא רַעֲוָא קֳדָמָךְ דְּתִפְתַּח לִבָּאִי בְּאוֹרַיְתָא, וְתַשְׁלִים מִשְׁאֲלִין דְּלִבָּאִי, וְלִבָּא דְכָל עַמָּךְ יִשְׂרָאֵל, לְטַב וּלְ֒חַיִּין וְלִשְׁ֒לָם: <small>שליח ציבור:</small> <b>גַּדְּ֒לוּ לַיהוָֹה אִתִּי וּנְ֒רוֹמְ֒מָה שְׁמוֹ יַחְדָּו:</b> <small>והקהל עונים:</small> לְךָ יְהֹוָה הַגְּ֒דֻלָּה וְהַגְּ֒בוּרָה וְהַתִּפְאֶֽרֶת וְהַנֵּֽצַח וְהַהוֹד כִּי כֹל בַּשָּׁמַֽיִם וּבָאָֽרֶץ לְךָ יְהֹוָה הַמַּמְלָכָה וְהַמִּתְנַשֵּׂא לְכֹל לְרֹאשׁ: רוֹמְ֒מוּ יְהֹוָה אֱלֺהֵֽינוּ וְהִשְׁתַּחֲווּ לַהֲדֹם רַגְלָיו קָדוֹשׁ הוּא: רוֹמְ֒מוּ יְהֹוָה אֱלֺהֵֽינוּ וְהִשְׁתַּחֲווּ לְהַר קָדְשׁוֹ כִּי קָדוֹשׁ יְהֹוָה אֱלֺהֵֽינוּ: אָב הָרַחֲמִים הוּא יְרַחֵם עַם עֲמוּסִים, וְיִזְכֹּר בְּרִית אֵיתָנִים, וְיַצִּיל נַפְ֒שׁוֹתֵֽינוּ מִן הַשָּׁעוֹת הָרָעוֹת, וְיִגְעַר בְּיֵֽצֶר הָרָע מִן הַנְּ֒שׂוּאִים, וְיָחוֹן אוֹתָֽנוּ לִפְ֒לֵטַת עוֹלָמִים, וִימַלֵּא מִשְׁאֲלוֹתֵֽינוּ בְּמִדָּה טוֹבָה יְשׁוּעָה וְרַחֲמִים: <small>חזן:</small> וְתִגָּלֶה וְתֵרָאֶה מַלְכוּתוֹ עָלֵֽינוּ בִּזְ֒מַן קָרוֹב וְיָחוֹן פְּלֵטָתֵֽנוּ וּפְ֒לֵטַת עַמּוֹ בֵּית יִשְׂרָאֵל לְחֵן וּלְ֒חֶֽסֶד וּלְ֒רַחֲמִים וּלְ֒רָצוֹן וְנֹאמַר אָמֵן, הַכֹּל הָבוּ גֹֽדֶל לֵאלֺהֵֽינוּ וּתְ֒נוּ כָבוֹד לַתּוֹרָה, כֹּהֵן קְרָב, יַעֲמֹד (פב\"פ) הַכֹּהֵן, בָּרוּךְ שֶׁנָּתַן תּוֹרָה לְעַמּוֹ יִשְׂרָאֵל בִּקְ֒דֻשָּׁתוֹ: <small>והקהל עונים:</small> וְאַתֶּם הַדְּ֒בֵקִים בַּיהוָֹה אֱלֺהֵיכֶם חַיִּים כֻּלְּ֒כֶם הַיּוֹם: <small>כשקורין אותו לתורה יאמר זה:</small> בָּרְ֒כוּ אֶת יְהֹוָה הַמְּ֒בֹרָךְ: <small>קהל ועולה:</small> בָּרוּךְ יְהֹוָה הַמְּ֒בֹרָךְ לְעוֹלָם וָעֶד: <small>ויאמר העולה:</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר בָּֽחַר בָּֽנוּ מִכָּל הָעַמִּים וְנָֽתַן לָֽנוּ אֶת תּוֹרָתוֹ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה: <small>לאחר הקריאה מברך:</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם אֲשֶׁר נָֽתַן לָֽנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ: בָּרוּךְ אַתָּה יְהֹוָה נוֹתֵן הַתּוֹרָה: <small>ארבעה צריכים להודות יורדי הים כשעלו ממנה והולכי מדברות כשיגיעו ליישוב ומי שהיה חולה ונתרפא ומי שהיה חבוש בבית האסורים ויצא. ואומרה על הס\"ת לאחר ברכה אחרונה. אם איחר יש לו תשלומין לברך כל זמן שירצה ונכון שלא לאחר שלשה ימים (שו\"ע או\"ח ריט).</small> בָּרוּךְ אַתָּה יְהֹוָה אֱלֺהֵֽינוּ מֶֽלֶךְ הָעוֹלָם הַגּוֹמֵל לְחַיָּבִים טוֹבוֹת שֶׁגְּ֒מָלַֽנִי כָּל טוֹב: <small>והקהל עונים:</small> מִי שֶׁגְּ֒מָלְ֒ךָ טוֹב הוּא יִגְמָלְ֒ךָ כָּל־טוֹב סֶֽלָה: <b>ברכת ברוך שפטרני</b> <small>מי שהגיע בנו לבן י\"ג שנה ויום אחד יברך האב בשעה שבנו עולה לתורה פעם ראשונה ברכה זו בלא שם ומלכות:</small> בָּרוּךְ שֶׁפְּ֒טָרַֽנִי מֵעָנְשׁוֹ שֶׁל זֶה: <small>בעת הגבהת ס\"ת לאחר הקריאה היה האר\"י ז\"ל מסתכל באותיות היטב עד שהיה מכירם לקרות והיה אומר שנמשך אור גדול על האדם ע\"י הסתכלות התורה מקרוב עד שיוכל לקרות האותיות היטב. לכן המגביה הס\"ת גולל הס\"ת על ג' דפין ומגביה ומראה כתיבתה לעם. ובעת ראייתם יש לכרוע ולומר וזאת התורה. ואין לומר וזאת התורה רק נגד הכתב של הס\"ת:</small> וְזֹאת הַתּוֹרָה אֲשֶׁר שָׂם משֶׁה לִפְנֵי בְּנֵי יִשְׂרָאֵל עַל פִּי יְהֹוָה בְּיַד משֶׁה: עֵץ חַיִּים הִיא לַמַּחֲזִיקִים בָּהּ וְתוֹמְ֒כֶֽיהָ מְאֻשָּׁר: דְּרָכֶֽיהָ דַּרְ֒כֵי נֹֽעַם וְכָל נְתִיבוֹתֶֽיהָ שָׁלוֹם: אֹֽרֶךְ יָמִים בִּימִינָהּ בִּשְׂ֒מֹאלָהּ עֽשֶׁר וְכָבוֹד: יְהֹוָה חָפֵץ לְמַֽעַן צִדְקוֹ יַגְדִּיל תּוֹרָה וְיַאְדִּיר: <small>בשני וחמישי כשאומרים תחנון בשעה שהגולל גולל הס\"ת קודם שמכניסין הס\"ת להיכל יאמר הש\"ץ <b>יְהִי רָצוֹן</b> כו'. וראוי ונכון להזהיר לעם שיאמרו אמן אחר כל יהי רצון כי בקשות גדולות הם:</small> יְהִי רָצוֹן מִלִּפְנֵי אָבִֽינוּ שֶׁבַּשָּׁמַֽיִם לְכוֹנֵן אֶת בֵּית חַיֵּֽינוּ וּלְ֒הָשִׁיב אֶת שְׁכִינָתוֹ בְּתוֹכֵֽנוּ בִּמְ֒הֵרָה בְיָמֵֽינוּ וְנֹאמַר אָמֵן: יְהִי רָצוֹן מִלִּפְנֵי אָבִֽינוּ שֶׁבַּשָּׁמַֽיִם לְרַחֵם עָלֵֽינוּ וְעַל פְּלֵטָתֵֽנוּ וְלִמְנֹֽעַ מַשְׁחִית וּמַגֵּפָה מֵעָלֵֽינוּ וּמֵעַל כָּל עַמּוֹ בֵּית יִשְׂרָאֵל וְנֹאמַר אָמֵן: יְהִי רָצוֹן מִלִּפְנֵי אָבִֽינוּ שֶׁבַּשָּׁמַֽיִם לְקַיֵּם בָּֽנוּ חַכְ֒מֵי יִשְׂרָאֵל הֵם וּנְ֒שֵׁיהֶם וּבְ֒נֵיהֶם וּבְ֒נוֹתֵיהֶם וְתַלְמִידֵיהֶם וְתַלְמִידֵי תַלְמִידֵיהֶם בְּכָל מְקוֹמוֹת מֹושְׁ֒בוֹתֵיהֶם וְנֹאמַר אָמֵן: יְהִי רָצוֹן מִלִּפְנֵי אָבִֽינוּ שֶׁבַּשָּׁמַֽיִם שֶׁנִּשְׁמַע וְנִתְבַּשֵּׂר בְּשׂוֹרוֹת טוֹבוֹת יְשׁוּעוֹת וְנֶחָמוֹת וִיקַבֵּץ נִדָּחֵֽינוּ מֵאַרְבַּע כַּנְ֒פוֹת הָאָֽרֶץ וְנֹאמַר אָמֵן: אַחֵֽינוּ כָּל בֵּית יִשְׂרָאֵל הַנְּ֒תוּנִים בַּצָּרָה וּבַשִּׁבְיָה הָעוֹמְ֒דִים בֵּין בַּיָּם וּבֵין בַּיַּבָּשָׁה הַמָּקוֹם יְרַחֵם עֲלֵיהֶם וְיוֹצִיאֵם מִצָּרָה לִרְ֒וָחָה וּמֵאֲפֵלָה לְאוֹרָה וּמִשִּׁעְבּוּד לִגְ֒אֻלָּה הַשְׁתָּא בַּעֲגָלָא וּבִזְמַן קָרִיב וְנֹאמַר אָמֵן:"));
    parts.push(hr);
  }

  // ─── הלל ───
  if (isHallelDay) {
    parts.push(p("<big><b>הַלֵּל</b></big>"));
    parts.push(p("<small>אומרים הלל שלם בחגים ובחנוכה, חצי הלל בראשי חודשים ובאחרון של פסח</small>"));
    parts.push(hr);
  }

  // ─── אשרי ───
  parts.push(p("<big><b>אַשְׁרֵי</b></big>"));
  parts.push(p("אַשְׁרֵי יוֹשְׁ֒בֵי בֵיתֶֽךָ עוֹד יְהַלְ֒לֽוּךָ סֶּֽלָה: אַשְׁרֵי הָעָם שֶׁכָּֽכָה לּוֹ אַשְׁרֵי הָעָם שֶׁיְהֹוָה אֱלֺהָיו: תְּהִלָּה לְדָוִד אֲרוֹמִמְךָ אֱלוֹהַי הַמֶּֽלֶךְ וַאֲבָרְ֒כָה שִׁמְךָ לְעוֹלָם וָעֶד: בְּכָל־יוֹם אֲבָרְ֒כֶֽךָ וַאֲהַלְ֒לָה שִׁמְךָ לְעוֹלָם וָעֶד: גָּדוֹל יְהֹוָה וּמְהֻלָּל מְאֹד וְלִגְ֒דֻלָּתוֹ אֵין חֵֽקֶר: דּוֹר לְדוֹר יְשַׁבַּח מַעֲשֶׂיךָ וּגְ֒בוּרֹתֶֽיךָ יַגִּֽידוּ: הֲדַר כְּבוֹד הוֹדֶֽךָ וְדִבְרֵי נִפְלְ֒אֹתֶֽיךָ אָשִֽׂיחָה: וֶעֱזוּז נוֹרְ֒אוֹתֶֽיךָ יֹאמֵֽרוּ וּגְ֒דֻלָּתְ֒ךָ אֲסַפְּ֒רֶֽנָּה: זֵֽכֶר רַב־טוּבְ֒ךָ יַבִּֽיעוּ וְצִדְ֒קָתְ֒ךָ יְרַנֵּֽנוּ: חַנּוּן וְרַחוּם יְהֹוָה אֶֽרֶךְ אַפַּֽיִם וּגְ֒דָל־חָֽסֶד: טוֹב־יְהֹוָה לַכֹּל וְרַחֲמָיו עַל־כָּל־מַעֲשָׂיו: יוֹדֽוּךָ יְהֹוָה כָּל־מַעֲשֶֽׂיךָ וַחֲסִידֶֽיךָ יְבָרְ֒כֽוּכָה: כְּבוֹד מַלְכוּתְ֒ךָ יֹאמֵֽרוּ וּגְ֒בוּרָתְ֒ךָ יְדַבֵּֽרוּ: לְהוֹדִֽיעַ לִבְנֵי הָאָדָם גְּבוּרֹתָיו וּכְ֒בוֹד הֲדַר מַלְכוּתוֹ: מַלְכוּתְ֒ךָ מַלְכוּת כָּל־עֹלָמִים וּמֶמְשַׁלְתְּ֒ךָ בְּכָל־דּוֹר וָדֹר: סוֹמֵךְ יְהֹוָה לְכָל־הַנֹּפְ֒לִים וְזוֹקֵף לְכָל־הַכְּ֒פוּפִים: עֵינֵי־כֹל אֵלֶֽיךָ יְשַׂבֵּֽרוּ וְאַתָּה נוֹתֵן־לָהֶם אֶת־אָכְלָם בְּעִתּוֹ: פּוֹתֵֽחַ אֶת־יָדֶֽךָ וּמַשְׂבִּֽיעַ לְכָל־חַי רָצוֹן: צַדִּיק יְהֹוָה בְּכָל־דְּרָכָיו וְחָסִיד בְּכָל־מַעֲשָׂיו: קָרוֹב יְהֹוָה לְכָל־קֹרְ֒אָיו לְכֹל אֲשֶׁר יִקְרָאֻֽהוּ בֶאֱמֶת: רְצוֹן־יְרֵאָיו יַעֲשֶׂה וְאֶת־שַׁוְעָתָם יִשְׁמַע וְיוֹשִׁיעֵם: שׁוֹמֵר יְהֹוָה אֶת־כָּל־אֹהֲבָיו וְאֵת כָּל־הָרְ֒שָׁעִים יַשְׁמִיד: תְּהִלַּת יְהֹוָה יְדַבֶּר פִּי וִיבָרֵךְ כָּל־בָּשָׂר שֵׁם קָדְשׁוֹ לְעוֹלָם וָעֶד: וַאֲנַֽחְנוּ נְבָרֵךְ יָהּ מֵעַתָּה וְעַד־עוֹלָם הַלְ֒לוּיָהּ: <small>אלו ימים שאין אומרים בהם למנצח ואל ארך אפים. ר\"ח חנוכה ופורים ערב פסח וערב יו\"כ ותשעה באב. והוא הדין ביום י\"ד וט\"ו באדר ראשון. גם אין אומרים אותם בבית האבל דכללא הוא דאא\"א ולמנצח דינם שוה. (דה\"ח)</small> <small>מה שתקנו לאומרו בסוף התפלה מפני שאומר במדרש תלים אמר ר' שמעון בר אבא אתה מוצא י\"ח מזמורים מראש הספר ועד פסוק זה ואשרי האיש ולמה רגשו גוים חד הוא כנגד י\"ח ברכות שאדם מתפלל בכל יום. אדם אומר לחבירו תתעני צלותך כך דוד המלך לאחר ששר י\"ח שירות ותושבחות אמר יענך ה' ביום צרה והכי איתא בירושלמי. ובשבתות ובימים טובים אין אומרים אותו מפני שהוא מזמור של תחנה וגם הוא מתחיל יענך ה' ביום צרה ושבתות וימים טובים אינם ימי צרה אלא ימי שמחה. (אבודרהם)</small> לַמְנַצֵּֽחַ מִזְמוֹר לְדָוִד: יַעַנְ֒ךָ יְהֹוָה בְּיוֹם צָרָה יְשַׂגֶּבְ֒ךָ שֵׁם אֱלֺהֵי יַעֲקֹב: יִשְׁלַח עֶזְרְךָ מִקֹּֽדֶשׁ וּמִצִּיּוֹן יִסְעָדֶֽךָּ: יִזְכֹּר כָּל מִנְחֹתֶֽיךָ וְעוֹלָתְ֒ךָ יְדַשְּׁ֒נֶה סֶּֽלָה: יִתֶּן לְךָ כִלְ֒בָבֶֽךָ וְכָל עֲצָתְ֒ךָ יְמַלֵּא: נְרַנְּ֒נָה בִּישׁוּעָתֶֽךָ וּבְ֒שֵׁם אֱלֺהֵֽינוּ נִדְגֹּל יְמַלֵּא יְהֹוָה כָּל מִשְׁאֲלוֹתֶֽיךָ: עַתָּה יָדַֽעְתִּי כִּי הוֹשִֽׁיעַ יְהֹוָה מְשִׁיחוֹ יַעֲנֵֽהוּ מִשְּׁ֒מֵי קָדְשׁוֹ בִּגְ֒בוּרוֹת יֵֽשַׁע יְמִינוֹ: אֵֽלֶּה בָרֶֽכֶב וְאֵֽלֶּה בַסּוּסִים וַאֲנַֽחְנוּ בְּשֵׁם יְהֹוָה אֱלֺהֵֽינוּ נַזְכִּיר: הֵֽמָּה כָּרְ֒עוּ וְנָפָֽלוּ וַאֲנַֽחְנוּ קַֽמְנוּ וַנִּתְעוֹדָד: יְהֹוָה הוֹשִׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: <small>מה שתקנו סדר קדושה בסוף התפלה בעבור עמי הארץ המאחרים לבא לתפלה שלא יפסידו שמיעת הקדושה. דאמרינן בשלהי סוטה אמאי קאי עלמא אסדרא דקדושה ואיהא שמיה רבה דאגדתא. ולכך תקנו לתרגם סדר קדושה זה כדי שיבינו עמי הארץ שאין מכירים לדבר בלשון הקדש אלא בלשון תרגום שהיו רגילין לדבר בו באותו זמן. (אבודרהם)</small> וּבָא לְצִיּוֹן גּוֹאֵל וּלְ֒שָׁבֵי פֶֽשַׁע בְּיַעֲקֹב נְאֻם יְהֹוָה: וַאֲנִי זֹאת בְּרִיתִי אֹתָם אָמַר יְהֹוָה רוּחִי אֲשֶׁר עָלֶֽיךָ וּדְ֒בָרַי אֲשֶׁר שַֽׂמְתִּי בְּפִֽיךָ לֺא יָמֽוּשׁוּ מִפִּֽיךָ וּמִפִּי זַרְעֲךָ וּמִפִּי זֶֽרַע זַרְעֲךָ אָמַר יְהֹוָה מֵעַתָּה וְעַד עוֹלָם: וְאַתָּה קָדוֹשׁ יוֹשֵׁב תְּהִלּוֹת יִשְׂרָאֵל: וְקָרָא זֶה אֶל זֶה וְאָמַר קָדוֹשׁ קָדוֹשׁ קָדוֹשׁ יְהֹוָה צְבָאוֹת מְלֺא כָל הָאָֽרֶץ כְּבוֹדוֹ: וּמְ֒קַבְּ֒לִין דֵּין מִן דֵּין וְאָמְ֒רִין קַדִּישׁ בִּשְׁ֒מֵי מְרוֹמָא עִלָּאָה בֵּית שְׁכִינְתֵּהּ קַדִּישׁ עַל אַרְעָא עוֹבַד גְּבוּרְתֵּהּ קַדִּישׁ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא יְהֹוָה צְבָאוֹת, מַלְיָא כָל אַרְעָא זִיו יְקָרֵהּ: וַתִּשָּׂאֵֽנִי רֽוּחַ וָאֶשְׁמַע אַחֲרַי קוֹל רַֽעַשׁ גָּדוֹל בָּרוּךְ כְּבוֹד יְהֹוָה מִמְּ֒קוֹמוֹ: וּנְ֒טָלַתְנִי רוּחָא וּשְׁמָעִית בַּתְרַי קָל זִֽיעַ סַגִּיא דִּמְ֒שַׁבְּ֒חִין וְאָמְ֒רִין בְּרִיךְ יְקָרָא דַיהוָֹה מֵאֲתַר בֵּית שְׁכִינְתֵּהּ: יְהֹוָה יִמְלֺךְ לְעוֹלָם וָעֶד: יְהֹוָה מַלְכוּתֵהּ קָאֵים לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא: יְהֹוָה אֱלֺהֵי אַבְרָהָם יִצְחָק וְיִשְׂרָאֵל אֲבוֹתֵֽינוּ שָׁמְ֒רָה זֹאת לְעֹלָם לְיֵֽצֶר מַחְשְׁ֒בוֹת לְבַב עַמֶּֽךָ וְהָכֵן לְבָבָם אֵלֶֽיךָ: וְהוּא רַחוּם יְכַפֵּר עָוֹן וְלֺא יַשְׁחִית וְהִרְבָּה לְהָשִׁיב אַפּוֹ וְלֺא יָעִיר כָּל חֲמָתוֹ: כִּי אַתָּה אֲדֹנָי טוֹב וְסַלָּח וְרַב חֶֽסֶד לְכָל קֹרְ֒אֶֽיךָ: צִדְ֒קָתְ֒ךָ צֶֽדֶק לְעוֹלָם וְתוֹרָתְ֒ךָ אֱמֶת: תִּתֵּן אֱמֶת לְיַעֲקֹב חֶֽסֶד לְאַבְרָהָם אֲשֶׁר נִשְׁבַּֽעְתָּ לַאֲבוֹתֵֽינוּ מִֽימֵי קֶֽדֶם: בָּרוּךְ אֲדֹנָי יוֹם יוֹם יַעֲמָס לָֽנוּ הָאֵל יְשׁוּעָתֵֽנוּ סֶֽלָה: יְהֹוָה צְבָאוֹת עִמָּֽנוּ מִשְׂגָּב לָֽנוּ אֱלֺהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם קָרְאֵֽנוּ: בָּרוּךְ הוּא אֱלֺהֵֽינוּ שֶׁבְּ֒רָאָֽנוּ לִכְ֒בוֹדוֹ וְהִבְדִּילָֽנוּ מִן הַתּוֹעִים וְנָֽתַן לָֽנוּ תּוֹרַת אֱמֶת וְחַיֵּי עוֹלָם נָטַע בְּתוֹכֵֽנוּ הוּא יִפְתַּח לִבֵּֽנוּ בְּתוֹרָתוֹ וְיָשֵׂם בְּלִבֵּֽנוּ אַהֲבָתוֹ וְיִרְאָתוֹ וְלַעֲשׂוֹת רְצוֹנוֹ וּלְ֒עָבְ֒דוֹ בְּלֵבָב שָׁלֵם לְמַֽעַן לֺא נִיגַע לָרִיק וְלֺא נֵלֵד לַבֶּהָלָה: יְהִי רָצוֹן מִלְּ֒פָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ וֵאלֺהֵי אֲבוֹתֵֽינוּ שֶׁנִּשְׁמֹר חֻקֶּֽיךָ בָּעוֹלָם הַזֶּה וְנִזְכֶּה וְנִחְיֶה וְנִרְאֶה וְנִירַשׁ טוֹבָה וּבְ֒רָכָה לִשְׁ֒נֵי יְמוֹת הַמָּשִֽׁיחַ וּלְ֒חַיֵּי הָעוֹלָם הַבָּא: לְמַֽעַן יְזַמֶּרְ֒ךָ כָבוֹד וְלֺא יִדֹּם יְהֹוָה אֱלֺהַי לְעוֹלָם אוֹדֶֽךָּ: בָּרוּךְ הַגֶּֽבֶר אֲשֶׁר יִבְטַח בַּיהוָֹה וְהָיָה יְהֹוָה מִבְטַחוֹ: בִּטְ֒חוּ בַיהוָֹה עֲדֵי עַד כִּי בְּיָהּ יְהֹוָה צוּר עוֹלָמִים: וְיִבְטְחוּ בְךָ יוֹדְ֒עֵי שְׁמֶֽךָ כִּי לֺא עָזַֽבְתָּ דֹרְ֒שֶֽׁיךָ יְהֹוָה: יְהֹוָה חָפֵץ לְמַֽעַן צִדְקוֹ יַגְדִּיל תּוֹרָה וְיַאְדִּיר: (יְהֺוָה אֲדוֹנֵֽינוּ, מָה אַדִּיר שִׁמְךָ בְּכָל הָאָֽרֶץ: חִזְ֒קוּ וְיַאֲמֵץ לְבַבְ֒כֶם כָּל הַמְ֒יַחֲלִים לַיהֹוָה:) <small>כל ימות השנה כשאין מוסף אומר הש\"ץ קדיש תתקבל אחר ובא לציון. אבל כשיש מוסף אומר הש\"ץ רק חצי קדיש על סדר קדושה ומתפללין מוסף. ובר\"ח חולצין התפילין קודם תפלת מוסף.</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְ֒קָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן: <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b>: יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא  לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן, תִּתְקַבֵּל צְלוֹתְ֒הוֹן וּבָעוּתְ֒הוֹן דְּכָל בֵּית יִשְׂרָאֵל קֳדָם אֲבוּהוֹן דִּי בִשְׁ֒מַיָּא וְאִמְרוּ אָמֵן: יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן: עוֹשֶׂה שָׁלוֹם (<small>בעשי\"ת</small> הַשָּׁלוֹם) בִּמְרוֹמָיו הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן <small>בשני ובחמישי ושאר ימים שמוציאין ספר תורה אומרים יהללו כשמחזירים הס\"ת למקומו. ואומר החזן:</small> <b>יְהַלְ֒לוּ אֶת־שֵׁם יְהֹוָה כִּי־נִשְׂגָּב שְׁמוֹ לְבַדּוֹ:</b> <small>קהל:</small> הוֹדוֹ עַל־אֶֽרֶץ וְשָׁמָֽיִם: וַיָּֽרֶם קֶֽרֶן לְעַמּוֹ תְּהִלָּה לְכָל־חֲסִידָיו לִבְנֵי יִשְׂרָאֵל עַם קְרֹבוֹ הַלְ֒לוּיָהּ: לְדָוִד מִזְמוֹר לַיהוָֹה הָאָֽרֶץ וּמְ֒לוֹאָהּ תֵּבֵל וְיֽשְׁ֒בֵי בָהּ: כִּי־הוּא עַל־יַמִּים יְסָדָהּ וְעַל־נְהָרוֹת יְכוֹנְ֒נֶֽהָ: מִי־יַעֲלֶה בְהַר־יְהֹוָה וּמִי יָקוּם בִּמְ֒קוֹם קָדְשׁוֹ: נְקִי כַפַּֽיִם וּבַר־לֵבָב אֲשֶׁר לֺא־נָשָׂא לַשָּׁוְא נַפְשִׁי וְלֺא נִשְׁבַּע לְמִרְמָה: יִשָּׂא בְרָכָה מֵאֵת יְהֹוָה וּצְ֒דָקָה מֵאֱלֺהֵי יִשְׁעוֹ: זֶה דּוֹר דּוֹרְ֒שָׁיו מְבַקְ֒שֵׁי פָנֶֽיךָ יַעֲקֹב סֶֽלָה: שְׂאוּ שְׁעָרִים רָאשֵׁיכֶם וְהִנָּשְׂ֒אוּ פִּתְ֒חֵי עוֹלָם וְיָבוֹא מֶֽלֶךְ הַכָּבוֹד: מִי זֶה מֶֽלֶךְ הַכָּבוֹד יְהֹוָה עִזּוּז וְגִבּוֹר יְהֹוָה גִּבּוֹר מִלְחָמָה: שְׂאוּ שְׁעָרִים רָאשֵׁיכֶם וּשְׂ֒אוּ פִּתְ֒חֵי עוֹלָם וְיָבוֹא מֶֽלֶךְ הַכָּבוֹד: מִי הוּא זֶה מֶֽלֶךְ הַכָּבוֹד יְהֹוָה צְבָאוֹת הוּא מֶֽלֶךְ הַכָּבוֹד סֶֽלָה: <small>בשעת הכנסת ס\"ת להיכל אומרים זה:</small> וּבְ֒נֻחֹה יֹאמַר שׁוּבָה יְהֹוָה רִבְ֒בוֹת אַלְ֒פֵי יִשְׂרָאֵל: קוּמָה יְהֹוָה לִמְ֒נוּחָתֶֽךָ אַתָּה וַאֲרוֹן עֻזֶּֽךָ: כֹּהֲנֶֽיךָ יִלְבְּ֒שׁוּ צֶֽדֶק וַחֲסִידֶֽיךָ יְרַנֵּֽנוּ: בַּעֲבוּר דָּוִד עַבְדֶּֽךָ אַל תָּשֵׁב פְּנֵי מְשִׁיחֶֽךָ: כִּי לֶֽקַח טוֹב נָתַֽתִּי לָכֶם תּוֹרָתִי אַל תַּעֲזֹֽבוּ: עֵץ חַיִּים הִיא לַמַּחֲזִיקִים בָּהּ וְתוֹמְ֒כֶֽיהָ מְאֻשָּׁר: דְּרָכֶֽיהָ דַּרְ֒כֵי נֹֽעַם וְכָל נְתִיבוֹתֶֽיהָ שָׁלוֹם: הֲשִׁיבֵֽנוּ יְהֹוָה אֵלֶֽיךָ וְנָשׁוּבָה חַדֵּשׁ יָמֵֽינוּ כְּקֶֽדֶם:"));
  parts.push(hr);

  // ─── בית יעקב ───
  if (isRoshChodeshOrShabbat) {
    parts.push(p("<big><b>בֵּית יַעֲקֹב</b></big>"));
    parts.push(p("<small>בימים שאין אומרים תחנון אין אומרים <b>תְּפִלָּה לְדָוִד</b> רק מתחילים מן <b>בֵּית יַעֲקֹב</b> וכו'. ובימים שאין אומרים גם אל ארך אפים גם בית יעקב אין אומרים רק מתחילים שיר של יום.</small> תְּפִלָּה לְדָוִד הַטֵּה־יְהֺוָה אָזְנְךָ עֲנֵֽנִי כִּי־עָנִי וְאֶבְיוֹן אָֽנִי: שָׁמְ֒רָה נַפְשִׁי כִּי־חָסִיד אָֽנִי הוֹשַׁע עַבְדְּךָ אַתָּה אֱלֹהַי הַבּוֹטֵֽחַ אֵלֶֽיךָ: חָנֵּֽנִי אֲדֹנָי כִּי־אֵלֶֽיךָ אֶקְרָא כָּל־הַיּוֹם: שַׂמֵּֽחַ נֶֽפֶשׁ עַבְדֶּֽךָ כִּי־אֵלֶֽיךָ אֲדֹנָי נַפְשִׁי אֶשָּׂא: כִּי־אַתָּה אֲדֹנָי טוֹב וְסַלָּח וְרַב־חֶֽסֶד לְכָל־קֹרְ֒אֶֽיךָ: הַאֲזִֽינָה יְהֺוָה תְּפִלָּתִי וְהַקְשִֽׁיבָה בְּקוֹל תַּחֲנוּנוֹתָי: בְּיוֹם צָרָתִי אֶקְרָאֶֽךָּ כִּי תַעֲנֵֽנִי: אֵין־כָּמֽוֹךָ בָאֱלֹהִים | אֲדֹנָי וְאֵין כְּמַעֲשֶֽׂיךָ: כָּל־גּוֹיִם אֲשֶׁר עָשִֽׂיתָ יָבֽוֹאוּ וְיִשְׁתַּחֲווּ לְפָנֶֽיךָ אֲדֹנָי וִיכַבְּ֒דוּ לִשְׁמֶֽךָ: כִּי־גָדוֹל אַתָּה וְעֹשֵׂה נִפְלָאוֹת אַתָּה אֱלֹהִים לְבַדֶּֽךָ: הוֹרֵֽנִי יְהֺוָה דַּרְכֶּֽךָ אֲהַלֵּךְ בַּאֲמִתֶּֽךָ יַחֵד לְבָבִי לְיִרְאָה שְׁמֶֽךָ: אוֹדְ֒ךָ אֲדֹנָי אֱלֹהַי בְּכָל־לְבָבִי וַאֲכַבְּ֒דָה שִׁמְךָ לְעוֹלָם: כִּי־חַסְדְּ֒ךָ גָּדוֹל עָלָי וְהִצַּֽלְתָּ נַפְשִׁי מִשְּׁ֒אוֹל תַּחְתִּיָּה: אֱלֹהִים זֵדִים קָֽמוּ־עָלַי וַעֲדַת עָרִיצִים בִּקְ֒שׁוּ נַפְשִׁי וְלֹא שָׂמֽוּךָ לְנֶגְדָּם: וְאַתָּה אֲדֹנָי אֵל־רַחוּם וְחַנּוּן אֶֽרֶךְ אַפַּֽיִם וְרַב־חֶֽסֶד וֶאֱמֶת: פְּנֵה אֵלַי וְחָנֵּֽנִי תְּנָה־עֻזְּ֒ךָ לְעַבְדֶּֽךָ וְהוֹשִֽׁיעָה לְבֶן־אֲמָתֶֽךָ: עֲשֵׂה־עִמִּי אוֹת לְטוֹבָה וְיִרְאוּ שׂנְ֒אַי וְיֵבֽשׁוּ כִּי־אַתָּה יְהֺוָה עֲזַרְתַּֽנִי וְנִחַמְתָּֽנִי: בֵּית יַעֲקֹב לְכוּ וְנֵלְ֒כָה בְּאוֹר יְהוָֹה: כִּי כָּל־הָעַמִּים יֵֽלְ֒כוּ אִישׁ בְּשֵׁם אֱלֺֽהָיו, וַֽאֲנַֽחְנוּ נֵלֵךְ בְּשֵׁם־יְהוָֹה אֱלֹהֵֽינוּ לְעוֹלָם וָעֶד: יְהִי יְהוָֹה אֱלֹהֵֽינוּ עִמָּֽנוּ כַּֽאֲשֶׁר הָיָה עִם־אֲבוֹתֵֽינוּ, אַל־יַֽעַזְ֒בֵֽנוּ וְאַל־יִטְּ֒שֵֽׁנוּ: לְהַטּוֹת לְבָבֵֽנוּ אֵלָיו, לָלֶֽכֶת בְּכָל־דְּרָכָיו, וְלִשְׁמֹר מִצְוֹתָיו, וְחֻקָּיו, וּמִשְׁפָּטָיו, אֲשֶׁר צִוָּה אֶת־אֲבֹתֵֽינוּ: וְיִהְיוּ דְבָרַי אֵֽלֶּה אֲשֶׁר הִתְחַנַּֽנְתִּי לִפְנֵי יְהוָֹה, קְרֹבִים אֶל יְהוָֹה אֱלֹהֵֽינוּ יוֹמָם וָלָֽיְלָה, לַעֲשׂוֹת מִשְׁפַּט עַבְדּוֹ, וּמִשְׁפַּט עַמּוֹ יִשְׂרָאֵל דְּבַר־יוֹם בְּיוֹמוֹ: לְמַֽעַן דַּֽעַת כָּל־עַמֵּי הָאָֽרֶץ, כִּי יְהוָֹה הוּא הָֽאֱלֹהִים, אֵין עוֹד: שִׁיר הַמַּעֲלוֹת לְדָוִד לוּלֵי יְהֺוָה שֶׁהָֽיָה לָֽנוּ יֹֽאמַר־נָא יִשְׂרָאֵל: לוּלֵי יְהֺוָה שֶׁהָֽיָה לָֽנוּ בְּקוּם עָלֵֽינוּ אָדָם: אֲזַי חַיִּים בְּלָעֽוּנוּ בַּחֲרוֹת אַפָּם בָּֽנוּ: אֲזַי הַמַּֽיִם שְׁטָפֽוּנוּ נַֽחְלָה עָבַר עַל־נַפְשֵֽׁנוּ: אֲזַי עָבַר עַל־נַפְשֵֽׁנוּ הַמַּֽיִם הַזֵּידוֹנִים: בָּרוּךְ יְהֺוָה שֶׁלֹּא נְתָנָֽנוּ טֶֽרֶף לְשִׁנֵּיהֶם: נַפְשֵֽׁנוּ כְּצִפּוֹר נִמְלְטָה מִפַּח יוֹקְ֒שִׁים הַפַּח נִשְׁבָּר וַאֲנַֽחְנוּ נִמְלָֽטְ֒נוּ: עֶזְרֵֽנוּ בְּשֵׁם יְהֺוָה עֹשֵׂה שָׁמַֽיִם וָאָֽרֶץ:"));
    parts.push(hr);
  }

  // ─── שיר של יום ───
  parts.push(p("<big><b>שִׁיר שֶׁל יוֹם</b></big>"));
  {
    var sodArr = [
      "<small>מזמור ליום ראשון</small> הַיּוֹם יוֹם אֶחָד בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>לְדָוִ֗ד</b> <small>(תהלים כ\"ד)</small> מִ֫זְמ֥וֹר לַֽ֭יהֹוָה הָאָ֣רֶץ וּמְלוֹאָ֑הּ תֵּ֝בֵ֗ל וְיֹ֣שְׁבֵי בָֽהּ׃ כִּי־ה֭וּא עַל־יַמִּ֣ים יְסָדָ֑הּ וְעַל־נְ֝הָר֗וֹת יְכוֹנְנֶֽהָ׃ מִֽי־יַעֲלֶ֥ה בְהַר־יְהֹוָ֑ה וּמִי־יָ֝קוּם בִּמְק֥וֹם קׇדְשֽׁוֹ׃ נְקִ֥י כַפַּ֗יִם וּֽבַר־לֵ֫בָ֥ב אֲשֶׁ֤ר ׀ לֹא־נָשָׂ֣א לַשָּׁ֣וְא נַפְשִׁ֑י וְלֹ֖א נִשְׁבַּ֣ע לְמִרְמָֽה׃ יִשָּׂ֣א בְ֭רָכָה מֵאֵ֣ת יְהֹוָ֑ה וּ֝צְדָקָ֗ה מֵאֱלֹהֵ֥י יִשְׁעֽוֹ׃ זֶ֭ה דּ֣וֹר דֹּרְשָׁ֑ו מְבַקְשֵׁ֨י פָנֶ֖יךָ יַעֲקֹ֣ב סֶֽלָה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וְֽ֭הִנָּשְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָב֗וֹא מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֥י זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְ֭הֹוָה עִזּ֣וּז וְגִבּ֑וֹר יְ֝הֹוָ֗ה גִּבּ֥וֹר מִלְחָמָֽה׃ שְׂא֤וּ שְׁעָרִ֨ים ׀ רָֽאשֵׁיכֶ֗ם וּ֭שְׂאוּ פִּתְחֵ֣י עוֹלָ֑ם וְ֝יָבֹ֗א מֶ֣לֶךְ הַכָּבֽוֹד׃ מִ֤י ה֣וּא זֶה֮ מֶ֤לֶךְ הַכָּ֫ב֥וֹד יְהֹוָ֥ה צְבָא֑וֹת הֽוּא מֶ֝לֶךְ הַכָּב֣וֹד סֶֽלָה׃",
      "<small>מזמור ליום שני</small> הַיּוֹם יוֹם שֵׁנִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>שִׁ֥יר</b> <small>(תהלים מ\"ח)</small> מִ֝זְמ֗וֹר לִבְנֵי־קֹֽרַח׃ גָּ֘ד֤וֹל יְהֹוָ֣ה וּמְהֻלָּ֣ל מְאֹ֑ד בְּעִ֥יר אֱ֝לֹהֵ֗ינוּ הַר־קׇדְשֽׁוֹ׃ יְפֵ֥ה נוֹף֮ מְשׂ֢וֹשׂ כׇּל־הָ֫אָ֥רֶץ הַר־צִ֭יּוֹן יַרְכְּתֵ֣י צָפ֑וֹן קִ֝רְיַ֗ת מֶ֣לֶךְ רָֽב׃ אֱלֹהִ֥ים בְּאַרְמְנוֹתֶ֗יהָ נוֹדַ֥ע לְמִשְׂגָּֽב׃ כִּ֤י זֶ֨ה ׀ אֱלֹהִ֣ים אֱ֭לֹהֵינוּ עוֹלָ֣ם וָעֶ֑ד ה֖וּא יְנַהֲגֵ֣נוּ עַל־מֽוּת׃",
      "<small>מזמור ליום שלישי</small> הַיּוֹם יוֹם שְׁלִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>מִזְמ֗וֹר</b> <small>(תהלים פ\"ב)</small> לְאָ֫סָ֥ף אֱֽלֹהִ֗ים נִצָּ֥ב בַּעֲדַת־אֵ֑ל בְּקֶ֖רֶב אֱלֹהִ֣ים יִשְׁפֹּֽט׃ עַד־מָתַ֥י תִּשְׁפְּטוּ־עָ֑וֶל וּפְנֵ֥י רְ֝שָׁעִ֗ים תִּשְׂאוּ־סֶֽלָה׃ קוּמָ֣ה אֱ֭לֹהִים שׇׁפְטָ֣ה הָאָ֑רֶץ כִּֽי־אַתָּ֥ה תִ֝נְחַ֗ל בְּכׇל־הַגּוֹיִֽם׃",
      "<small>מזמור ליום רביעי</small> הַיּוֹם יוֹם רְבִיעִי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>אֵל־נְקָמ֥וֹת</b> <small>(תהלים צ\"ד)</small> יְהֹוָ֑ה אֵ֖ל נְקָמ֣וֹת הוֹפִֽיעַ׃ הִ֭נָּשֵׂא שֹׁפֵ֣ט הָאָ֑רֶץ הָשֵׁ֥ב גְּ֝מ֗וּל עַל־גֵּאִֽים׃ עַד־מָתַ֖י רְשָׁעִ֥ים ׀ יְהֹוָ֑ה עַד־מָ֝תַ֗י רְשָׁעִ֥ים יַעֲלֹֽזוּ׃ כִּ֤י ׀ לֹא־יִטֹּ֣שׁ יְהֹוָ֣ה עַמּ֑וֹ וְ֝נַחֲלָת֗וֹ לֹ֣א יַעֲזֹֽב׃ וַיְהִ֬י יְהֹוָ֣ה לִ֣י לְמִשְׂגָּ֑ב וֵ֝אלֹהַ֗י לְצ֣וּר מַחְסִֽי׃",
      "<small>מזמור ליום חמישי</small> הַיּוֹם יוֹם חֲמִישִׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>לַמְנַצֵּ֬חַ</b> <small>(תהלים פ\"א)</small> עַֽל־הַגִּתִּ֬ית לְאָסָֽף׃ הַ֭רְנִינוּ לֵאלֹהִ֣ים עוּזֵּ֑נוּ הָ֝רִ֗יעוּ לֵאלֹהֵ֥י יַעֲקֹֽב׃ שְֽׂאוּ־זִ֭מְרָה וּתְנוּ־תֹ֑ף כִּנּ֖וֹר נָעִ֣ים עִם־נָֽבֶל׃ אָֽנֹכִ֨י ׀ יְהֹ֘וָ֤ה אֱלֹהֶ֗יךָ הַֽ֭מַּעַלְךָ מֵאֶ֣רֶץ מִצְרָ֑יִם הַרְחֶב־פִּ֗֝יךָ וַאֲמַלְאֵֽהוּ׃ לוּ עַ֭מִּי שֹׁמֵ֣עַֽ לִ֑י יִ֝שְׂרָאֵ֗ל בִּדְרָכַ֥י יְהַלֵּֽכוּ׃ וַֽ֭יַּאֲכִילֵהוּ מֵחֵ֣לֶב חִטָּ֑ה וּ֝מִצּ֗וּר דְּבַ֣שׁ אַשְׂבִּיעֶֽךָ׃",
      "<small>מזמור ליום ששי</small> הַיּוֹם יוֹם הַשִּׁשִּׁי בְּשַׁבַּת קוֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<small>(תהלים צ\"ג)</small> יְהֹוָ֣ה מָלָךְ֮ גֵּא֢וּת לָ֫בֵ֥שׁ לָבֵ֣שׁ יְ֭הֹוָה עֹ֣ז הִתְאַזָּ֑ר אַף־תִּכּ֥וֹן תֵּ֝בֵ֗ל בַּל־תִּמּֽוֹט׃ נָכ֣וֹן כִּסְאֲךָ֣ מֵאָ֑ז מֵעוֹלָ֣ם אָֽתָּה׃ עֵֽדֹתֶ֨יךָ ׀ נֶאֶמְנ֬וּ מְאֹ֗ד לְבֵיתְךָ֥ נַאֲוָה־קֹ֑דֶשׁ יְ֝הֹוָ֗ה לְאֹ֣רֶךְ יָמִֽים׃",
      "<small>מזמור ליום שבת</small> הַיּוֹם יוֹם שַׁבַּת קֹדֶשׁ, הַשִּׁיר שֶׁהָיוּ הַלְוִיִּם אוֹמְרִים עַל הַדּוּכָן:",
      "<b>מִזְמ֗וֹר</b> שִׁ֧יר לְי֣וֹם הַשַּׁבָּ֑ת <small>(תהלים צ\"ב)</small> טוֹב֗ לְהֹד֥וֹת לַ֝יהֹוָ֗ה וּלְזַמֵּ֥ר לְשִׁמְךָ֗ עֶלְיֽוֹן׃ לְהַגִּ֗יד בַּבֹּ֥קֶר חַסְדֶּ֑ךָ וֶֽ֝אֱמֽוּנָתְךָ֗ בַּלֵּילֽוֹת׃ כִּ֤י שִׂמַּחְתַּ֥נִי יְהֹוָ֗ה בְּפׇעֳלֶ֑ךָ בְּֽמַעֲשֵׂ֖י יָדֶ֣יךָ אֲרַנֵּֽן׃ צַדִּ֡יק כַּתָּמָ֣ר יִ֭פְרָח כְּאֶ֣רֶז בַּלְּבָנ֑וֹן יִשְׂגֶּֽה׃ שְׁ֭תוּלִים בְּבֵ֣ית יְהֹוָ֑ה בְּחַצְר֥וֹת אֱ֝לֹהֵ֗ינוּ יַפְרִֽיחוּ׃ לְ֭הַגִּיד כִּי־יָשָׁ֣ר יְהֹוָ֑ה צוּרִ֗֝י וְלֹא־עַוְלָ֥תָה בּֽוֹ׃"
    ];
    var todayDowIdx = (dow === 6) ? 6 : dow;
    parts.push(p(sodArr[todayDowIdx * 2]));
    parts.push(p(sodArr[todayDowIdx * 2 + 1]));
  }
  parts.push(hr);

  // ─── ברכי נפשי ───
  if (isRoshChodeshOrShabbat) {
    parts.push(p("<big><b>בָּרְכִי נַפְשִׁי</b></big>"));
    parts.push(p("<small>נוהגין בספרד לומר מזמור ברכי נפשי בראש חדש לפי שיש בו עשה ירח למועדים (טור אורח חיים תכג)</small> בָּרְ֒כִי נַפְשִׁי אֶת־יְהֹוָה יְהֹוָה אֱלֺהַי גָּדַֽלְתָּ מְאֹד, הוֹד וְהָדָר לָבָֽשְׁתָּ: עֹֽטֶה אוֹר כַּשַּׂלְמָה, נוֹטֶה שָׁמַֽיִם כַּיְ֒רִיעָה: הַמְ֒קָרֶה בַמַּֽיִם עֲלִיּוֹתָיו הַשָּׂם־עָבִים רְכוּבוֹ, הַמְ֒הַלֵּךְ עַל־כַּנְ֒פֵי־רֽוּחַ: עֹשֶׂה מַלְאָכָיו רוּחוֹת, מְשָׁרְ֒תָיו אֵשׁ לֺהֵט: יָסַד אֶֽרֶץ עַל־מְכוֹנֶֽיהָ, בַּל־תִּמּוֹט עוֹלָם וָעֶד: תְּהוֹם כַּלְּ֒בוּשׁ כִּסִּיתוֹ, עַל־הָרִים יַֽעַמְ֒דוּ מָֽיִם: מִן־גַּעֲרָתְ֒ךָ יְנוּסוּן, מִן־קוֹל רַעַמְ֒ךָ יֵחָפֵזוּן: יַעֲלוּ הָרִים יֵרְ֒דוּ בְקָעוֹת, אֶל־מְקוֹם זֶה יָסַֽדְתָּ לָהֶם: גְּבוּל־שַֽׂמְתָּ בַּל־יַעֲבֹרוּן, בַּל־יְשֻׁבוּן לְכַסּוֹת הָאָֽרֶץ: הַמְ֒שַׁלֵּֽחַ מַעְיָנִים בַּנְּ֒חָלִים, בֵּין הָרִים יְהַלֵּכוּן: יַשְׁקוּ כָּל־חַיְ֒תוֹ שָׂדָי, יִשְׁבְּרוּ פְרָאִים צְמָאָם: עֲלֵיהֶם עוֹף־הַשָּׁמַֽיִם יִשְׁכּוֹן, מִבֵּין עֳפָאִים יִתְּ֒נוּ־קוֹל: מַשְׁקֶה הָרִים מֵעֲלִיּוֹתָיו, מִפְּ֒רִי מַעֲשֶֽׂיךָ תִּשְׂבַּע הָאָֽרֶץ: מַצְמִֽיחַ חָצִיר לַבְּ֒הֵמָה וְעֵֽשֶׂב לַעֲבֹדַת הָאָדָם, לְהוֹצִיא לֶֽחֶם מִן־הָאָֽרֶץ: וְיַֽיִן יְשַׂמַּח לְבַב־אֱנוֹשׁ לְהַצְהִיל פָּנִים מִשָּֽׁמֶן, וְלֶֽחֶם לְבַב־אֱנוֹשׁ יִסְעָד: יִשְׂבְּ֒עוּ עֲצֵי יְהֹוָה אַרְ֒זֵי לְבָנוֹן אֲשֶׁר נָטָע: אֲשֶׁר־שָׁם צִפֳּרִים יְקַנֵּֽנוּ, חֲסִידָה בְּרוֹשִׁים בֵּיתָהּ: הָרִים הַגְּ֒בֹהִים לַיְּ֒עֵלִים, סְלָעִים מַחְסֶה לַשְּׁ֒פַנִּים: עָשָׂה יָרֵֽחַ לְמוֹעֲדִים שֶֽׁמֶשׁ יָדַע מְבוֹאוֹ: תָּֽשֶׁת חֽשֶׁךְ וִיהִי לָֽיְלָה, בּוֹ־תִרְמֹשׂ כָּל־חַֽיְ֒תוֹ־יָֽעַר: הַכְּ֒פִירִים שֹׁאֲגִים לַטָּֽרֶף, וּלְ֒בַקֵּשׁ מֵאֵל אָכְלָם: תִּזְרַח הַשֶּֽׁמֶשׁ יֵאָסֵפוּן, וְאֶל־מְעוֹנֹתָם יִרְבָּצוּן: יֵצֵא אָדָם לְפָעֳלוֹ, וְלַעֲבֹדָתוֹ עֲדֵי־עָֽרֶב: מָה־רַבּוּ מַעֲשֶֽׂיךָ יְהֹוָה כֻּלָּם בְּחָכְמָה עָשִֽׂיתָ, מָלְ֒אָה הָאָֽרֶץ קִנְיָנֶֽךָ: זֶה הַיָּם גָּדוֹל וּרְ֒חַב יָדָֽיִם שָׁם־רֶֽמֶשׂ וְאֵין מִסְפָּר, חַיּוֹת קְטַנּוֹת עִם־גְּדֹלוֹת: שָׁם אֳנִיּוֹת יְהַלֵּכוּן, לִוְיָתָן זֶה יָצַֽרְתָּ לְשַֽׂחֶק־בּוֹ: כֻּלָּם אֵלֶֽיךָ יְשַׂבֵּרוּן, לָתֵת אָכְלָם בְּעִתּוֹ: תִּתֵּן לָהֶם יִלְקֹטוּן, תִּפְתַּח יָדְ֒ךָ יִשְׂבְּעוּן טוֹב: תַּסְתִּיר פָּנֶֽיךָ יִבָּהֵלוּן תֹּסֵף רוּחָם יִגְוָעוּן, וְאֶל־עֲפָרָם יְשׁוּבוּן: תְּשַׁלַּח רוּחֲךָ יִבָּרֵאוּן, וּתְ֒חַדֵּשׁ פְּנֵי אֲדָמָה: יְהִי כְבוֹד יְהֹוָה לְעוֹלָם, יִשְׂמַח יְהֹוָה בְּמַעֲשָׂיו: הַמַּבִּיט לָאָֽרֶץ וַתִּרְעָד, יִגַּע בֶּהָרִים וְיֶעֱשָֽׁנוּ: אָשִֽׁירָה לַּיהוָֹה בְּחַיָּי, אֲזַמְּ֒רָה לֵאלֺהַי בְּעוֹדִי: יֶעֱרַב עָלָיו שִׂיחִי, אָנֹכִי אֶשְׂמַח בַּיהוָֹה: יִתַּֽמּוּ חַטָּאִים מִן־הָאָֽרֶץ וּרְ֒שָׁעִים עוֹד אֵינָם בָּרְ֒כִי נַפְשִׁי אֶת־יְהֹוָה הַלְ֒לוּיָהּ: <small>(הושיענו וכו'. קדיש יתום.)</small>"));
    parts.push(hr);
  }

  // ─── לדוד ה' אורי וישעי ───
  if (isFallSeason) {
    parts.push(p("<big><b>לְדָוִד יְהֹוָה אוֹרִי וְיִשְׁעִי</b></big>"));
    parts.push(p("<small>מנהג טוב לומר אחר כל תפלה מזמור לדוד ה׳‬ אורי וישעי. ובפרט מר״ח אלול עד הושענא רבא (מורה באצבע סי' לז).</small> לְדָוִד יְהֹוָה אוֹרִי וְיִשְׁעִי מִמִּי אִירָא יְהֹוָה מָעוֹז חַיַּי מִמִּי אֶפְחָד: בִּקְ֒רֹב עָלַי מְרֵעִים לֶאֱכֹל אֶת בְּשָׂרִי צָרַי וְאֹיְ֒בַי לִי הֵֽמָּה כָשְׁ֒לוּ וְנָפָֽלוּ: אִם תַּחֲנֶה עָלַי מַחֲנֶה לֺא יִירָא לִבִּי אִם תָּקוּם עָלַי מִלְחָמָה בְּזֹאת אֲנִי בוֹטֵֽחַ: אַחַת שָׁאַֽלְתִּי מֵאֵת יְהֹוָה אוֹתָהּ אֲבַקֵּשׁ שִׁבְתִּי בְּבֵית יְהֹוָה כָּל יְמֵי חַיַּי לַחֲזוֹת בְּנֹֽעַם יְהֹוָה וּלְ֒בַקֵּר בְּהֵיכָלוֹ: כִּי יִצְפְּ֒נֵֽנִי בְּסֻכֹּה בְּיוֹם רָעָה יַסְתִּרֵֽנִי בְּסֵֽתֶר אָהֳלוֹ בְּצוּר יְרוֹמְ֒מֵֽנִי: וְעַתָּה יָרוּם רֹאשִׁי עַל אֹיְ֒בַי סְבִיבוֹתָי וְאֶזְבְּחָה בְאָהֳלוֹ זִבְחֵי תְרוּעָה אָשִֽׁירָה וַאֲזַמְּ֒רָה לַיהוָֹה: שְׁמַע יְהֹוָה קוֹלִי אֶקְרָא וְחָנֵּֽנִי וַעֲנֵֽנִי: לְךָ אָמַר לִבִּי בַּקְּ֒שׁוּ פָנָי אֶת פָּנֶֽיךָ יְהֹוָה אֲבַקֵּשׁ: אַל תַּסְתֵּר פָּנֶֽיךָ מִמֶּֽנִּי אַל תַּט בְּאַף עַבְדֶּֽךָ עֶזְרָתִי הָיִֽיתָ אַל תִּטְּ֒שֵֽׁנִי וְאַל תַּעַזְ֒בֵֽנִי אֱלֺהֵי יִשְׁעִי: כִּי אָבִי וְאִמִּי עֲזָבֽוּנִי וַיהוָֹה יַאַסְ֒פֵֽנִי: הוֹרֵֽנִי יְהֹוָה דַּרְכֶּֽךָ וּנְ֒חֵֽנִי בְּאֹֽרַח מִישׁוֹר לְמַֽעַן שׁוֹרְ֒רָי: אַל תִּתְּ֒נֵֽנִי בְּנֶֽפֶשׁ צָרָי כִּי קָֽמוּ בִי עֵֽדֵי שֶֽׁקֶר וִיפֵֽחַ חָמָס: לוּלֵא הֶאֱמַֽנְתִּי לִרְאוֹת בְּטוּב יְהֹוָה בְּאֶֽרֶץ חַיִּים: קַוֵּה אֶל יְהֹוָה חֲזַק וְיַאֲמֵץ לִבֶּךָ וְקַוֵּה אֶל יְהֹוָה: <small>(קדיש יתום)</small> <small>בבית האבל בבוקר אחר שיר של יום ואחר מנחה בימים שיש בהם תחנון אומרים זה:</small> לַמְנַצֵּֽחַ לִבְנֵי קֹֽרַח מִזְמוֹר: שִׁמְ֒עוּ זֹאת כָּל־הָעַמִּים הַאֲזִֽינוּ כָּל יֽשְׁ֒בֵי חָֽלֶד: גַּם בְּנֵי אָדָם גַּם בְּנֵי אִישׁ יַֽחַד עָשִׁיר וְאֶבְיוֹן: פִּי יְדַבֵּר חָכְמוֹת וְהָגוּת לִבִּי תְבוּנוֹת: אַטֶּה לְמָשָׁל אָזְנִי אֶפְתַּח בְּכִנּוֹר חִידָתִי: לָֽמָּה אִירָא בִּֽימֵי רָע עֲוֹן עֲקֵבַי יְסוּבֵּֽנִי: הַבֹּטְ֒חִים עַל חֵילָם וּבְ֒רֹב עָשְׁרָם יִתְהַלָּֽלוּ: אָח לֺא פָדֹה יִפְדֶּה אִישׁ לֺא יִתֵּן לֵאלֺהִים כָּפְרוֹ: וְיֵקַר פִּדְיוֹן נַפְשָׁם וְחָדַל לְעוֹלָם: וִיחִי עוֹד לָנֶֽצַח לֺא יִרְאֶה הַשָּֽׁחַת: כִּי יִרְאֶה חֲכָמִים יָמֽוּתוּ יַֽחַד כְּסִיל וָבַֽעַר יֹאבֵֽדוּ וְעָזְ֒בוּ לַאֲחֵרִים חֵילָם: קִרְבָּם בָּתֵּֽימוֹ לְעוֹלָם מִשְׁכְּ֒נֹתָם לְדוֹר וָדֹר קָרְ֒אוּ בִשְׁמוֹתָם עֲלֵי אֲדָמוֹת: וְאָדָם בִּיקָר בַּל־יָלִין נִמְשַׁל כַּבְּ֒הֵמוֹת נִדְמוּ: זֶה דַרְכָּם כֶּֽסֶל לָֽמוֹ וְאַחֲרֵיהֶם בְּפִיהֶם יִרְצוּ סֶֽלָה: כַּצֹּאן לִשְׁ֒אוֹל שַׁתּוּ מָֽוֶת יִרְעֵם וַיִּרְדּוּ בָם יְשָׁרִים לַבֹּֽקֶר וְצוּרָם לְבַלּוֹת שְׁאוֹל מִזְּ֒בֻל לוֹ: אַךְ־אֱלֺהִים יִפְדֶּה נַפְשִׁי מִיַּד שְׁאוֹל כִּי יִקָּחֵֽנִי סֶֽלָה: אַל־תִּירָא כִּי־יַעֲשִׁר אִישׁ כִּי־יִרְבֶּה כְּבוֹד בֵּיתוֹ: כִּי לֺא בְמוֹתוֹ יִקַּח הַכֹּל לֺא־יֵרֵד אַחֲרָיו כְּבוֹדוֹ: כִּי־נַפְשׁוֹ בְּחַיָּיו יְבָרֵךְ וְיוֹדֻֽךָ כִּי־תֵיטִיב לָךְ: תָּבוֹא עַד־דּוֹר אֲבוֹתָיו עַד־נֵֽצַח לֺא יִרְאוּ אוֹר: אָדָם בִּיקָר וְלֺא־יָבִין נִמְשַׁל כַּבְּ֒הֵמוֹת נִדְמוּ: <small>(קדיש יתום)</small> <small>ובימים שאין בהם תחנון אומרים זה:</small> מִכְתָּם לְדָוִד שָׁמְרֵֽנִי אֵל כִּי־חָסִֽיתִי בָךְ: אָמַֽרְתְּ לַיהֺוָה אֲדֹנָי אָֽתָּה טוֹבָתִי בַּל־עָלֶֽיךָ: לִקְדוֹשִׁים אֲשֶׁר־בָּאָֽרֶץ הֵֽמָּה וְאַדִּירֵי כָּל־חֶפְצִי־בָם: יִרְבּוּ עַצְּבוֹתָם אַחֵר מָהָֽרוּ בַּל־אַסִּיךְ נִסְכֵּיהֶם מִדָּם וּבַל־אֶשָּׂא אֶת־שְׁמוֹתָם עַל־שְׂפָתָי: יְהֺוָה מְנָת־חֶלְקִי וְכוֹסִי אַתָּה תּוֹמִיךְ גּוֹרָלִי: חֲבָלִים נָֽפְלוּ־לִי בַּנְּעִמִים אַף־נַחֲלָת שָׁפְרָה עָלָי: אֲבָרֵךְ אֶת־יְהֺוָה אֲשֶׁר יְעָצָֽנִי אַף־לֵילוֹת יִסְּרֽוּנִי כִלְיוֹתָי: שִׁוִּיתִי יְהֺוָה לְנֶגְדִּי תָמִיד כִּי מִימִינִי בַּל־אֶמּוֹט: לָכֵן שָׂמַח לִבִּי וַיָּֽגֶל כְּבוֹדִי אַף־בְּשָׂרִי יִשְׁכֹּן לָבֶֽטַח: כִּי לֹא־תַעֲזֹב נַפְשִׁי לִשְׁאוֹל לֹא־תִתֵּן חֲסִידְךָ לִרְאוֹת שָֽׁחַת: תּוֹדִיעֵֽנִי אֹֽרַח חַיִּים שֽׂבַע שְׂמָחוֹת אֶת־פָּנֶֽיךָ נְעִימוֹת בִּימִינְךָ נֶֽצַח: <small>קדיש יתום</small><br><b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְ֒קָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן: <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b>: יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא  לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן, יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן: עוֹשֶׂה שָׁלוֹם (<small>בעשי\"ת</small> הַשָּׁלוֹם) בִּמְרוֹמָיו הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן:"));
    parts.push(hr);
  }

  // ─── קוה ───
  parts.push(p("<big><b>קַוֵּה אֶל יְהֹוָה</b></big>"));
  parts.push(p("<b>קַוֵּה</b> אֶל יְהֹוָה חֲזַק וְיַאֲמֵץ לִבֶּךָ וְקַוֵּה אֶל יְהֹוָה: אֵין קָדוֹשׁ כַּיהֹוָה כִּי אֵין בִּלְתֶּךָ וְאֵין צוּר כֵּאלֹהֵינוּ: כִּי מִי אֱלוֹהַּ מִבַּלְעֲדֵי יְהֹוָה וּמִי צוּר זוּלָתִי אֱלֹהֵינוּ: <b>אֵין כֵּאלֹהֵינוּ.</b> אֵין כַּאדוֹנֵנוּ. אֵין כְּמַלְכֵּנוּ. אֵין כְּמוֹשִׁיעֵנוּ: מִי כֵאלֹהֵינוּ. מִי כַאדוֹנֵנוּ. מִי כְמַלְכֵּנוּ. מִי כְמוֹשִׁיעֵנוּ: נוֹדֶה לֵאלֹהֵינוּ. נוֹדֶה לַאדוֹנֵנוּ. נוֹדֶה לְמַלְכֵּנוּ. נוֹדֶה לְמוֹשִׁיעֵנוּ: בָּרוּךְ אֱלֹהֵינוּ. בָּרוּךְ אֲדוֹנֵנוּ. בָּרוּךְ מַלְכֵּנוּ. בָּרוּךְ מוֹשִׁיעֵנוּ: אַתָּה הוּא אֱלֹהֵינוּ. אַתָּה הוּא אֲדוֹנֵנוּ. אַתָּה הוּא מַלְכֵּנוּ. אַתָּה הוּא מוֹשִׁיעֵנוּ. אַתָּה תוֹשִׁיעֵנוּ אַתָּה תָקוּם תְּרַחֵם צִיוֹן כִּי עֵת לְחֶנְנָה כִּי בָא מוֹעֵד <b>אַתָּה</b> הוּא יְהֹוָה אֱלֹהֵינוּ וֵאלֹהֵי אֲבוֹתֵינוּ. שֶׁהִקְטִרוּ אֲבוֹתֵינוּ לְפָנֶיךָ אֶת קְטֹרֶת הַסַּמִּים: פִּטּוּם הַקְּ֒טֺרֶת הַצֳּרִי וְהַצִּפֹּרֶן הַחֶלְ֒בְּנָה וְהַלְּבוֹנָה מִשְׁקַל שִׁבְעִים שִׁבְעִים מָנָה. מוֹר וּקְ֒צִיעָה שִׁבֹּלֶת נֵרְדְּ וְכַרְכֹּם מִשְׁקַל שִׁשָּׁה עָשָׂר שִׁשָּׁה עָשָׂר מָנֶה. הַקּשְׁטְ שְׁנֵים עָשָׂר וְקִלּוּפָה שְׁלֹשָׁה וְקִנָּמוֹן תִּשְׁעָה. בֹּרִית כַּרְשִׁינָה תִּשְׁעָה קַבִּין. יֵין קַפְרִיסִין סְאִין תְּלָתָא וְקַבִּין תְּלָתָא. וְאִם אֵין לוֹ יֵין קַפְרִיסִין מֵבִיא חֲמַר חִוַּרְיָן עַתִּיק. מֶלַח סְדוֹמִית רֹבַע הַקָב. מַעֲלֶה עָשָׁן כָּל שֶׁהוּא. רַבִּי נָתָן הַבַּבְלִי אוֹמֵר אַף כִּפַּת הַיַּרְדֵּן כָּל שֶׁהוּא. וְאִם נָתַן בָּהּ דְּבַשׁ פְּסָלָהּ וְאִם חִסַּר אַחַת מִכָּל סַמָּנֶיהָ חַיָּב מִיתָה: <b>רַבָּן</b> שִׁמְעוֹן בֶּן גַּמְלִיאֵל אוֹמֵר הַצֳּרִי אֵינוֹ אֶלָּא שְׂרָף הַנּוֹטֵף מֵעֲצֵי הַקְּ֒טָף. בֹּרִית כַּרְשִׁינָה לָמָּה הִיא בָאָה כְּדֵי לְיַפּוֹת בָּהּ אֶת הַצִּפֹּרֶן כְּדֵי שֶׁתְּ֒הֵא נָאָה. יֵין קַפְרִיסִין לָמָּה הוּא בָא כְּדֵי לִשְׁרוֹת בּוֹ אֶת הַצִּפֹּרֶן כְּדֵי שֶׁתְּ֒הֵא עַזָּה. וַהֲלֹא מֵי רַגְלַיִם יָפִין לָהּ אֶלָּא שֶׁאֵין מַכְנִיסִין מֵי רַגְלַיִם בַּמִּקְדָּשׁ מִפְּ֒נֵי הַכָּבוֹד: <b>תַּנְיָא</b> רַבִּי נָתָן אוֹמֵר כְּשֶׁהוּא שׁוֹחֵק אוֹמֵר הָדֵק הֵיטֵב הֵיטֵב הָדֵק מִפְּ֒נֵי שֶׁהַקּוֹל יָפֶה לַבְּ֒שָׂמִים, פִּטְּ֒מָהּ לַחֲצָאִין כְּשֵׁרָה לִשְׁלִישׁ וְלִרְבִֽיעַ לֹא שָׁמַֽעְנוּ: אָמַר רַבִּי יְהוּדָה זֶה הַכְּ֒לָל אִם כְּמִדָּתָהּ כְּשֵׁרָה לַחֲצָאִין וְאִם חִסַּר אַחַת מִכָּל סַמָּנֶֽיהָ חַיָּב מִיתָה: <b>תַּנְיָא</b> בַּר קַפָּרָא אוֹמֵר אַחַת לְשִׁשִּׁים אוֹ לְשִׁבְעִים שָׁנָה הָיְ֒תָה בָאָה שֶׁל שִׁירַֽיִם לַחֲצָאִין: וְעוֹד תָּנֵי בַּר קַפָּרָא אִלּוּ הָיָה נוֹתֵן בָּהּ קוֹרְ֒טוֹב שֶׁל דְּבַשׁ אֵין אָדָם יָכוֹל לַעֲמֹד מִפְּ֒נֵי רֵיחָהּ וְלָֽמָּה אֵין מְעָרְ֒בִין בָּהּ דְּבַשׁ מִפְּ֒נֵי שֶׁהַתּוֹרָה אָמְ֒רָה כִּי כָל־שְׂאֹר וְכָל־דְּבַשׁ לֹא־תַקְטִֽירוּ מִמֶּֽנּוּ אִשֶּׁה לַיהוָֹה: <small>אומר ג' פעמים:</small> יְהֹוָה צְבָאוֹת עִמָּֽנוּ מִשְׂגַּב־לָֽנוּ אֱלֹהֵי יַעֲקֹב סֶֽלָה: יְהֹוָה צְבָאוֹת אַשְׁרֵי אָדָם בֹּטֵֽחַ בָּךְ: יְהֹוָה הוֹשִֽׁיעָה הַמֶּֽלֶךְ יַעֲנֵֽנוּ בְיוֹם־קָרְאֵֽנוּ: אַתָּה סֵֽתֶר לִי מִצַּר תִּצְּ֒רֵֽנִי רָנֵּי פַלֵּט תְּסוֹבְ֒בֵֽנִי סֶֽלָה: וְעָרְ֒בָה לַיהוָֹה מִנְחַת יְהוּדָה וִירוּשָׁלָֽםִ כִּימֵי עוֹלָם וּכְשָׁנִים קַדְמֹנִיּוֹת: תָּנָא דְבֵי אֵלִיָּֽהוּ כָּל הַשּׁוֹנֶה הֲלָכוֹת בְּכָל יוֹם מֻבְטָח לוֹ שֶׁהוּא בֶּן עוֹלָם הַבָּא שֶׁנֶּאֱמַר הֲלִיכוֹת עוֹלָם לוֹ אַל תִּקְרֵי הֲלִיכוֹת אֶלָּא הֲלָכוֹת: <b>אָמַר</b> רַבִּי אֶלְעָזָר אָמַר רַבִּי חֲנִינָא. תַּלְמִידֵי חֲכָמִים מַרְבִּים שָׁלוֹם בָּעוֹלָם. שֶׁנֶּאֱמַר וְכָל בָּנַֽיִךְ לִמּוּדֵי יְהֹוָה וְרַב שְׁלוֹם בָּנָֽיךְ: אַל תִּקְרֵי בָּנָֽיךְ אֶלָּא בּוֹנָֽיךְ: שָׁלוֹם רָב לְאֹהֲבֵי תוֹרָתֶֽךָ וְאֵין לָֽמוֹ מִכְשׁוֹל: יְהִי שָׁלוֹם בְּחֵילֵךְ שַׁלְוָה בְּאַרְמְּנוֹתָֽיךְ לְמַֽעַן אַחַי וְרֵעָי אֲדַבְּרָה נָא שָׁלוֹם בָּךְ: לְמַֽעַן בֵּית יְהֹוָה אֱלֹהֵֽינוּ אֲבַקְ֒שָׁה טוֹב לָךְ: <small>קדיש דרבנן:</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְ֒קָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ. בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b> יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא  לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן: עַל יִשְׂרָאֵל וְעַל רַבָּנָן וְעַל תַלְמִידֵיהוֹן וְעַל כָּל תַּלְמִידֵי תַלְמִידֵיהוֹן, וְעַל כָּל מָאן דְּעָסְ֒קִין בְּאוֹרַיְתָא, דִּי בְאַתְרָא הָדֵין וְדִי בְכָל אֲתַר וַאֲתַר, יְהֵא לְהוֹן וּלְכוֹן שְׁלָמָא רַבָּא חִנָּא וְחִסְדָּא וְרַחֲמִין וְחַיִּין אֲרִיכִין וּמְזוֹנָא רְוִיחֵי וּפוּרְקָנָא מִן קֳדָם אֲבוּהוֹן דְבִשְׁמַיָּא וְאַרְעָא וְאִמְרוּ אָמֵן: יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים טוֹבִים עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן: עוֹשֶׂה שָׁלוֹם (<small>בעשי\"ת</small> הַשָּׁלוֹם) בִּמְרוֹמָיו הוּא בְּרַחֲמָיו יַעֲשֶׂה שָׁלוֹם עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן:"));
  parts.push(hr);

  // ─── עלינו ───
  parts.push(p("<big><b>עָלֵינוּ לְשַׁבֵּחַ</b></big>"));
  parts.push(p("<small>אחר כל התפלות אומר עלינו לשבח. בפרק ר׳ אליעזר אומר שבח גדול יש בעלינו לשבח על כן צריך לאומרו מעומד ותמצא עלינו עולה בגימטריא ומעומד. ושמעתי שיהושע תקנו בשעה שכבש יריחו וחתם בו שם קטנותו למפרע. (כל בו)</small> עָלֵֽינוּ לְשַׁבֵּֽחַ לַאֲדוֹן הַכֹּל לָתֵת גְּדֻלָּה לְיוֹצֵר בְּרֵאשִׁית שֶׁלֺּא עָשָֽׂנוּ כְּגוֹיֵי הָאֲרָצוֹת וְלֺא שָׂמָֽנוּ כְּמִשְׁפְּחוֹת הָאֲדָמָה שֶׁלֺּא שָׂם חֶלְקֵֽנוּ כָּהֶם וְגוֹרָלֵֽנוּ כְּכָל הֲמוֹנָם: שֶׁהֵם מִשְׁתַּחֲוִים לָהֶֽבֶל וָרִיק וּמִתְפַּלְּ֒לִים אֶל אֵל לֹא יוֹשִֽׁיעַ, וַאֲנַֽחְנוּ כּוֹרְ֒עִים וּמִשְׁתַּחֲוִים וּמוֹדִים לִפְנֵי מֶֽלֶךְ מַלְ֒כֵי הַמְּ֒לָכִים הַקָּדוֹשׁ בָּרוּךְ הוּא, שֶׁהוּא נוֹטֶה שָׁמַֽיִם וְיוֹסֵד אָֽרֶץ, וּמוֹשַׁב יְקָרוֹ בַּשָּׁמַֽיִם מִמַּֽעַל, וּשְׁ֒כִינַת עֻזּוֹ בְּגָבְ֒הֵי מְרוֹמִים, הוּא אֱלֺהֵֽינוּ אֵין עוֹד, אֱמֶת מַלְכֵּֽנוּ אֶֽפֶס זוּלָתוֹ כַּכָּתוּב בְּתוֹרָתוֹ וְיָדַעְתָּ הַיּוֹם וַהֲשֵׁבֹתָ אֶל לְבָבֶֽךָ כִּי יְהֹוָה הוּא הָאֱלֺהִים בַּשָּׁמַֽיִם מִמַּֽעַל וְעַל הָאָֽרֶץ מִתָּֽחַת אֵין עוֹד: (וְ)עַל כֵּן נְקַוֶּה לְךָ יְהֹוָה אֱלֺהֵֽינוּ לִרְאוֹת מְהֵרָה בְּתִפְאֶֽרֶת עֻזֶּֽךָ לְהַעֲבִיר גִּלּוּלִים מִן הָאָֽרֶץ וְהָאֱלִילִים כָּרוֹת יִכָּרֵתוּן לְתַקֵּן עוֹלָם בְּמַלְכוּת שַׁדַּי וְכָל בְּנֵי בָשָׂר יִקְרְאוּ בִשְׁ֒מֶֽךָ, לְהַפְנוֹת אֵלֶֽיךָ כָּל רִשְׁ֒עֵי אָֽרֶץ, יַכִּֽירוּ וְיֵדְ֒עוּ כָּל יוֹשְׁ֒בֵי תֵבֵל כִּי לְךָ תִכְרַע כָּל בֶּֽרֶךְ תִּשָּׁבַע כָּל לָשׁוֹן: לְפָנֶֽיךָ יְהֹוָה אֱלֺהֵֽינוּ יִכְרְעוּ וְיִפֹּֽלוּ, וְלִכְ֒בוֹד שִׁמְךָ יְקָר יִתֵּֽנוּ, וִיקַבְּ֒לוּ כֻלָּם אֶת עֹל מַלְכוּתֶֽךָ, וְתִמְלֺךְ עֲלֵיהֶם מְהֵרָה לְעוֹלָם וָעֶד, כִּי הַמַּלְ֒כוּת שֶׁלְּ֒ךָ הִיא וּלְ֒עֽוֹלְ֒מֵי עַד תִּמְלוֹךְ בְּכָבוֹד, כַּכָּתוּב בְּתוֹרָתֶֽךָ יְהֹוָה יִמְלֺךְ לְעֹלָם וָעֶד: וְנֶאֱמַר וְהָיָה יְהֹוָה לְמֶֽלֶךְ עַל כָּל הָאָֽרֶץ בַּיּוֹם הַהוּא יִהְיֶה יְהֹוָה אֶחָד וּשְׁמוֹ אֶחָד: אַל תִּירָא מִפַּחַד פִּתאֹם וּמִשֹׁאַת רְשָׁעִים כִּי תָבֹא עֻֽצוּ עֵצָה וְתֻפָר דַּבְּ֒רוּ דָבָר וְלֹא יָקוּם כִּי עִמָּנוּ אֵל: וְעַד זִקְנָה אֲנִי הוּא וְעַד שֵׂיבָה אֲנִי אֶסְבֹּל: אֲנִי עָשִֽׂיתִי וַאֲנִי אֶשָׂא וַאֲנִי אֶסְבֹּל וַאֲמַלֵּט: <small>כתב הלבוש בסי קל\"ג אחר עלינו אומרים קדיש יתום. ואפילו אין יתום של תוך י\"ב חודש בבית הכנסת יאמר אותו אחר מי שאין לו אב ואם. והטעם שהרי לעולם צריכין לומר קדיש אחר שאמרו פסוקים. ובעלינו יש גם כן פסוקים וצריכים קדיש אחריו. אלא שנהגו בקדיש זה להניחו ליתום שמת אביו ואמו תוך שנה זו. מפני שיש יתומים קטנים או אפילו גדולים שאינם יכולין להיות שלוחי ציבור ולומר קדיש וברכו אחר אביו ואמו. וכבר ידענו ממעשה דרבי עקיבא [במס' כלה רבתי פ\"ב] תועלת הגדולה שיש למתים כשיש להם בן האומר קדיש וברכו ויותר בתוך שנה ראשונה. לכך תקנו והניחו קדיש זה. שאין צריך שום דבר יותר ליתומים הן קטנים הן גדולים. ומפני שתקנוהו ליתומים אין נוהגין לאמרו כלל מי שיש לו אב או אם שמא אביו או אמו יקפידו בכך משום אל יפתח אדם פיו לשטן ויאמר אתה מקוה למיתתנו. לפיכך אם אין אביו או אמו מקפידין בכך יכול לאומרו אפילו מי שיש לו אב ואם. ע\"כ.</small> <b>יִתְגַּדַּל</b> וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא בְּעָלְ֒מָא דִּי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ וְיַצְמַח פּוּרְ֒קָנֵהּ וִיקָרֵב (קֵץ) מְשִׁיחֵהּ בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל, בַּעֲגָלָא וּבִזְמַן קָרִיב וְאִמְרוּ אָמֵן: <b>יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְ֒מֵי עָלְ֒מַיָּא</b>: יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל שְׁמֵהּ דְקוּדְשָׁא, בְּרִיךְ הוּא  לְעֵֽלָּא (<small>בעשי\"ת</small> וּלְ֒עֵֽלָּא מִכָּל)  מִן כָּל בִּרְכָתָא וְשִׁירָתָא, תֻּשְׁבְּחָתָא וְנֶחֱמָתָא, דַּאֲמִירָן בְּעָלְ֒מָא, וְאִמְרוּ אָמֵן, יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא וְחַיִּים עָלֵֽינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן: עוֹשֶׂה שָׁלוֹם (<small>בעשי\"ת</small> הַשָּׁלוֹם) בִּמְרוֹמָיו הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל וְאִמְרוּ אָמֵן"));
  parts.push(hr);

  return {
    html: '<div class="prayer-richtext">' + parts.join("") + "</div>",
    sourceLabel: "מאגר פנימי – נוסח ספרד",
    sourceUrl: "",
  };
}


async function getFullPrayerContent(key) {
  const nusach = resolveSelectedNusach();
  const context = resolveSeasonalPrayerContext();
  const cacheKey = JSON.stringify({
    key,
    nusach: nusach.key,
    shabbat: context.isShabbat,
    flags: context.events,
  });
  if (PRAYER_HTML_CACHE.has(cacheKey)) return PRAYER_HTML_CACHE.get(cacheKey);

  const fallbackEntry = PRAYER_DB[key];
  const sourcePriority = PRAYER_SOURCE_PRIORITY[key] || "wikisource-first";
  const attempts = [];
  if (key === "al-hamichya") {
    attempts.push(() => buildAlHamichyaPayload());
  }
  if (key === "birkat-hamazon") {
    attempts.push(() => buildBirkatHamazonPayload(context));
  }
  if (key === "shacharit") {
    if (nusach.key === "ashkenaz") {
      attempts.push(() => buildShacharitAshkenazPayload(context));
    } else if (nusach.key === "sfard") {
      attempts.push(() => buildShacharitSfaradPayload(context));
    } else {
      attempts.push(() => buildShacharitMizrahiPayload(context));
    }
  }
  if (sourcePriority === "full-sefaria-compose") {
    attempts.push(() => fetchComposedSefariaPrayer(key, nusach.key));
  }
  if (sourcePriority === "local-first") {
    attempts.push(() => buildPrayerDbPayload(key, fallbackEntry));
  }

  const refs =
    SEFARIA_PRAYER_REFS[key]?.[nusach.key]?.weekday ||
    SEFARIA_PRAYER_REFS[key]?.mizrahi?.weekday ||
    [];
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
        if (
          (key === "shacharit" || key === "maariv") &&
          !prayerHasRequiredFlow(key, result.html)
        ) {
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
const FONT_SIZE_KEY = "moadim_prayer_font_size";
let _prayerFontSize = parseInt(
  localStorage.getItem(FONT_SIZE_KEY) || "100",
  10,
);

function createFontSizeBar(targetSelector) {
  const bar = document.createElement("div");
  bar.className = "font-size-bar";
  bar.style.cssText =
    "position:sticky;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:0.75rem;padding:0.6rem 1rem;background:rgba(250,249,246,0.95);backdrop-filter:blur(8px);border-top:1px solid rgba(0,0,0,0.08);z-index:10;flex-shrink:0;";
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
  document.querySelectorAll(".font-size-label").forEach((el) => {
    el.textContent = _prayerFontSize + "%";
  });
}

function applyPrayerFontSize(targetSelector) {
  // Base font size is 25px for all text areas that use this function
  // (holy-text-style class = 25px, psalm-text-area = explicitly set to 25px)
  const BASE_PX = 25;
  const targets = document.querySelectorAll(targetSelector);
  targets.forEach((el) => {
    el.style.fontSize = (_prayerFontSize / 100) * BASE_PX + "px";
  });
}

function closePrayerModal() {
  const el = document.getElementById("prayer-modal");
  if (el) el.remove();
  unlockBodyScroll();
  if (_activeModals[_activeModals.length - 1] === "prayer-modal") {
    _activeModals.pop();
    history.back();
  }
}
function closeTehillimModal() {
  const el = document.getElementById("tehillim-modal");
  if (el) el.remove();
  unlockBodyScroll();
  if (_activeModals[_activeModals.length - 1] === "tehillim-modal") {
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
    modal.style.cssText =
      "position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;";
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
    modal.style.cssText =
      "position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;overflow:hidden;background:#faf9f6;";
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
    modal.appendChild(createFontSizeBar(".holy-text-style"));
    applyPrayerFontSize(".holy-text-style");
  }
  return modal;
}

// --- First-time Nusach Selection ---
const NUSACH_CHOSEN_KEY = "moadim_nusach_chosen";
function showNusachSelectionPopup(callback) {
  let existing = document.getElementById("nusach-selection-modal");
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = "nusach-selection-modal";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:250;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";
  const nusachOptions = Object.entries(NUSACH_LABELS)
    .map(
      ([k, v]) =>
        `<button onclick="window._selectNusachAndContinue('${k}')" style="width:100%;padding:0.85rem 1rem;border-radius:0.9rem;border:2px solid ${k === CURRENT_NUSACH ? "#2563eb" : "rgba(0,0,0,0.1)"};background:${k === CURRENT_NUSACH ? "rgba(37,99,235,0.08)" : "rgba(0,0,0,0.02)"};color:#1a1a1a;font-size:1.05rem;font-weight:800;cursor:pointer;transition:all 0.15s;">${v}</button>`,
    )
    .join("");
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

openPrayer = async function (key, heLabel, enLabel) {
  const doOpen = async () => {
    const entry = PRAYER_DB[key] || { title: heLabel || enLabel || key };
    const isPopup = false;
    renderPrayerModalShell(entry.title || heLabel || enLabel || key, isPopup);
    lockBodyScroll();
    pushModalState("prayer-modal");
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
                  ${content.seasonalHtml ? '<div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.18);border-radius:0.75rem;padding:0.7rem 0.85rem;margin-bottom:1.25rem;font-size:0.82em;color:#1e40af;line-height:1.65;border-right:3px solid rgba(37,99,235,0.4);">' + content.seasonalHtml + "</div>" : ""}
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
    [400, "ת"],
    [300, "ש"],
    [200, "ר"],
    [100, "ק"],
    [90, "צ"],
    [80, "פ"],
    [70, "ע"],
    [60, "ס"],
    [50, "נ"],
    [40, "מ"],
    [30, "ל"],
    [20, "כ"],
    [10, "י"],
    [9, "ט"],
    [8, "ח"],
    [7, "ז"],
    [6, "ו"],
    [5, "ה"],
    [4, "ד"],
    [3, "ג"],
    [2, "ב"],
    [1, "א"],
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

openTehillimPage = function () {
  const dayPlans = [
    {
      day: "ראשון",
      chapters: Array.from({ length: 29 }, (_, index) => index + 1),
    },
    {
      day: "שני",
      chapters: Array.from({ length: 21 }, (_, index) => index + 30),
    },
    {
      day: "שלישי",
      chapters: Array.from({ length: 22 }, (_, index) => index + 51),
    },
    {
      day: "רביעי",
      chapters: Array.from({ length: 17 }, (_, index) => index + 73),
    },
    {
      day: "חמישי",
      chapters: Array.from({ length: 17 }, (_, index) => index + 90),
    },
    {
      day: "שישי",
      chapters: Array.from({ length: 13 }, (_, index) => index + 107),
    },
    {
      day: "שבת",
      chapters: Array.from({ length: 31 }, (_, index) => index + 120),
    },
  ];
  const todayIndex = new Date().getDay();
  let activeIndex = todayIndex;
  let existing = document.getElementById("tehillim-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "tehillim-modal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;background:#faf9f6;display:flex;flex-direction:column;overflow:hidden;";

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
              ${dayPlans
                .map((item, itemIndex) => {
                  const itemRange = `${toHebrewPsalmNumber(item.chapters[0])}-${toHebrewPsalmNumber(item.chapters[item.chapters.length - 1])}`;
                  return `<button onclick="window._tehillimSwitchDay(${itemIndex})" style="padding:0.38rem 0.72rem;border-radius:999px;font-size:0.75rem;font-weight:700;border:1px solid ${itemIndex === index ? "#2563eb" : "rgba(0,0,0,0.12)"};background:${itemIndex === index ? "#2563eb" : "transparent"};color:${itemIndex === index ? "#fff" : "#64748b"};cursor:pointer;white-space:nowrap;">${item.day} · ${itemRange}</button>`;
                })
                .join("")}
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
    if (
      chapter < 1 ||
      chapter > 150 ||
      window._tehillimLoadedChapters.has(chapter)
    )
      return;
    window._tehillimLoadedChapters.add(chapter);
    const chapterDiv = document.createElement("div");
    chapterDiv.id = `psalm-chapter-${chapter}`;
    chapterDiv.style.cssText =
      "margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(0,0,0,0.08);";
    chapterDiv.innerHTML = `<h4 style="color:#1e40af;font-size:1.1rem;font-weight:900;margin-bottom:0.75rem;text-align:center;">תהילים פרק ${toHebrewPsalmNumber(chapter)}</h4><p style="color:#94a3b8;text-align:center;">טוען...</p>`;
    if (prepend && area.firstChild) {
      area.insertBefore(chapterDiv, area.firstChild);
    } else {
      area.appendChild(chapterDiv);
    }
    try {
      const response = await fetch(
        `https://www.sefaria.org/api/texts/Psalms.${chapter}?lang=he&context=0`,
      );
      const data = await response.json();
      const verses = (data.he || [])
        .map(
          (verse, index) =>
            `<p style="margin:0.3rem 0;color:#000000;"><strong style="color:#1d4ed8;font-size:0.75rem;">(${index + 1})</strong> ${verse}</p>`,
        )
        .join("");
      chapterDiv.innerHTML = `<h4 style="color:#1e40af;font-size:1.1rem;font-weight:900;margin-bottom:0.75rem;text-align:center;">תהילים פרק ${toHebrewPsalmNumber(chapter)}</h4>${verses || "<p>לא נמצא טקסט.</p>"}`;
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
    area.style.cssText =
      "padding:1.25rem;overflow-y:auto;flex:1;font-family:'Frank Ruhl Libre','David Libre',serif;font-size:25px;font-weight:700;line-height:1.7;color:#000000;text-align:center;direction:rtl;";
    applyPrayerFontSize("#psalm-text-area");
    // Load current chapter and neighbors
    if (chapter > 1) await loadPsalmChapter(chapter - 1, area, false);
    await loadPsalmChapter(chapter, area, false);
    if (chapter < 150) await loadPsalmChapter(chapter + 1, area, false);
    // Scroll to current chapter
    const currentEl = document.getElementById(`psalm-chapter-${chapter}`);
    if (currentEl) currentEl.scrollIntoView({ block: "start" });
    // Infinite scroll: load more chapters on scroll
    area.onscroll = async function () {
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
          area.scrollTop += area.scrollHeight - prevScrollHeight;
        }
      }
      // Update title based on visible chapter
      const chapters = area.querySelectorAll("[id^='psalm-chapter-']");
      for (const ch of chapters) {
        const rect = ch.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();
        if (rect.top >= areaRect.top - 50 && rect.top < areaRect.top + 150) {
          const num = parseInt(ch.id.replace("psalm-chapter-", ""));
          if (num && title)
            title.textContent = `תהילים פרק ${toHebrewPsalmNumber(num)}`;
          break;
        }
      }
    };
  };

  renderDay(activeIndex);
  document.body.appendChild(modal);
  lockBodyScroll();
  pushModalState("tehillim-modal");
};

// Patch render() to trigger animations after render
const _origRender = render;
window.render = function (filter, search) {
  _origRender(filter, search);
  requestAnimationFrame(setupCardObserver);
};

// Patch showDashboard to start countdown once data is ready
const _origShowDashboard = showDashboard;
window.showDashboard = function () {
  _origShowDashboard();
  setTimeout(() => {
    startShabbatCountdown();
    if (CURRENT_OMER_DAY > 0) updateOmerRing(CURRENT_OMER_DAY);
  }, 600);
};

// Patch renderZmanimGrid to update day bar
const _origRenderZmanim = renderZmanimGrid;
window.renderZmanimGrid = function (zData) {
  _origRenderZmanim(zData);
  if (zData && zData.times) {
    updateDayProgressBar(zData.times.sunrise, zData.times.sunset);
  }
};

// Replace native alerts with toasts
const _nativeAlert = window.alert.bind(window);
window.alert = function (msg) {
  if (typeof msg === "string") {
    const isError =
      msg.includes("חסומות") ||
      msg.includes("אינו תומך") ||
      msg.includes("לא הצלחנו") ||
      msg.includes("אינטרנט");
    showToast(msg, isError ? "error" : "info");
  } else {
    _nativeAlert(msg);
  }
};

// Kick off card observer on initial load via idle callback for better perf
window.addEventListener(
  "load",
  () => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => setupCardObserver(), { timeout: 800 });
    } else {
      setTimeout(() => setupCardObserver(), 800);
    }
  },
  { once: true },
);

// ═══════════════════════════════════════════════════════
// ✦  OMER SEFIROT (Kabbalistic attribute for each day)
// ═══════════════════════════════════════════════════════
const sefirotHeb = ["חסד", "גבורה", "תפארת", "נצח", "הוד", "יסוד", "מלכות"];
const sefirotColors = [
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
];

function getOmerSefirotText(day) {
  if (!day || day < 1 || day > 49) return "";
  const weekIdx = Math.floor((day - 1) / 7);
  const dayIdx = (day - 1) % 7;
  const daySefirah = sefirotHeb[dayIdx];
  const weekSefirah = sefirotHeb[weekIdx];
  return `${daySefirah} שב${weekSefirah}`;
}

function updateOmerSefirot(day) {
  const el = document.getElementById("omer-sefirot-text");
  if (!el || !day) return;
  const weekIdx = Math.floor((day - 1) / 7);
  const dayIdx = (day - 1) % 7;
  el.textContent = getOmerSefirotText(day);
  el.style.color = sefirotColors[dayIdx];
  el.style.background = sefirotColors[dayIdx] + "20";
}

// Patch the omer display to include sefirot
const _origFetchLive = fetchLiveCalendarData;
// We hook into the DOM update instead — after omer-day-num is set
const _origUpdateOmerRing = updateOmerRing;
window.updateOmerRing = function (day) {
  _origUpdateOmerRing(day);
  updateOmerSefirot(day);
};

// ═══════════════════════════════════════════════════════
// ✦  WHATSAPP SHARE
// ═══════════════════════════════════════════════════════
function shareEventWhatsApp(name, dateStr, heb) {
  const d = new Date(dateStr);
  const dateFmt = d.toLocaleDateString(getCurrentLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const text = `${name}\n📅 ${dateFmt}\n🗓️ ${heb}\n\nסנכרן מהלוח היהודי: ${SITE_URL}`;
  if (navigator.share && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    navigator.share({ title: name, text, url: SITE_URL }).catch(() => {
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
    });
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }
}

// Patch render() to inject WhatsApp button into each card
const _origRenderForWA = window.render;
window.render = function (filter, search) {
  _origRenderForWA(filter, search);
  // Inject WhatsApp button into each card after render
  document.querySelectorAll(".event-card").forEach((card) => {
    if (card.querySelector(".wa-btn")) return; // already added
    const btnRow = card.querySelector(".flex.md\\:flex-col");
    if (!btnRow) return;
    const downloadBtn = btnRow.querySelector('button[onclick^="downloadICS"]');
    if (!downloadBtn) return;
    // Extract event data from the ICS button's onclick attribute
    const match = downloadBtn
      .getAttribute("onclick")
      .match(/downloadICS\('(.+)'\)/);
    if (!match) return;
    try {
      const e = JSON.parse(decodeURIComponent(match[1]));
      const waBtn = document.createElement("button");
      waBtn.className =
        "wa-btn flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold uppercase tracking-wider transition-all bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700/50 mt-1 w-full justify-center";
      waBtn.innerHTML = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.847L.057 23.75a.375.375 0 00.459.459l5.895-1.468A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.679-.528-5.192-1.443l-.372-.221-3.863.963.981-3.763-.242-.389A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg> שתף בוואצאפ`;
      waBtn.onclick = () => shareEventWhatsApp(e.name, e.date, e.heb || e.name);
      btnRow.appendChild(waBtn);
    } catch (_) {}
  });
  requestAnimationFrame(setupCardObserver);
};

// ═══════════════════════════════════════════════════════
// ✦  SCROLL-TO-TOP FAB
// ═══════════════════════════════════════════════════════
(function setupScrollTop() {
  const fab = document.getElementById("fab-top");
  if (!fab) return;
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 400) {
        fab.style.opacity = "1";
        fab.style.transform = "translateY(0) scale(1)";
        fab.style.pointerEvents = "auto";
      } else {
        fab.style.opacity = "0";
        fab.style.transform = "translateY(12px) scale(0.9)";
        fab.style.pointerEvents = "none";
      }
    },
    { passive: true },
  );
  fab.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
})();

// ═══════════════════════════════════════════════════════
// ✦  KEYBOARD SHORTCUT: Ctrl+K / ⌘+K → focus search
// ═══════════════════════════════════════════════════════
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.getElementById("calendar-day-modal")) {
    closeCalendarDay();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    const search = document.getElementById("mainSearch");
    if (search) {
      search.focus();
      search.select();
      search.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  if (e.key === "Escape") {
    const search = document.getElementById("mainSearch");
    if (document.activeElement === search) {
      search.blur();
      search.value = "";
      if (typeof render === "function") render("all", "");
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
  if (window.matchMedia("(display-mode: standalone)").matches) return;
  // Don't show if dismissed recently (within 7 days)
  const dismissed = parseInt(
    localStorage.getItem("pwa_install_dismissed") || "0",
  );
  if (dismissed && Date.now() - dismissed < 7 * 86400000) return;

  let deferredPrompt = null;
  const banner = document.getElementById("pwa-install-banner");
  const installBtn = document.getElementById("pwa-install-btn");
  const dismissBtn = document.getElementById("pwa-install-dismiss");

  const showBanner = () => {
    if (!banner || !deferredPrompt) return;
    banner.style.display = "block";
    requestAnimationFrame(() => {
      banner.style.opacity = "1";
      banner.style.transform = "translateX(-50%) translateY(0)";
    });
  };

  const hideBanner = () => {
    if (!banner) return;
    banner.style.opacity = "0";
    banner.style.transform = "translateX(-50%) translateY(20px)";
    setTimeout(() => {
      banner.style.display = "none";
    }, 400);
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show after 4s so it doesn't interrupt initial load
    setTimeout(showBanner, 4000);
  });

  installBtn &&
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      hideBanner();
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        showToast("🎉 האפליקציה הותקנה בהצלחה!", "success", 4000);
      }
      deferredPrompt = null;
    });

  dismissBtn &&
    dismissBtn.addEventListener("click", () => {
      hideBanner();
      localStorage.setItem("pwa_install_dismissed", String(Date.now()));
    });

  // iOS Safari — show a manual guide since beforeinstallprompt not supported
  const isIOS =
    /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandalone = window.navigator.standalone === true;
  if (isIOS && !isInStandalone && !dismissed) {
    // Wait until page is interacted with
    const handler = () => {
      document.removeEventListener("touchend", handler);
      setTimeout(
        () =>
          showToast(
            'להוסיף למסך הבית: לחץ "שתף" ← "הוסף למסך הבית"',
            "info",
            6000,
          ),
        5000,
      );
    };
    document.addEventListener("touchend", handler, { once: true });
  }
})();

// ═══════════════════════════════════════════════════════
// ✦  IMPROVED EMPTY STATE in render()
// ═══════════════════════════════════════════════════════
(function patchRenderEmptyState() {
  const _prev = window.render;
  window.render = function (filter = "all", search = "") {
    _prev(filter, search);
    const c = document.getElementById("resultsGrid");
    if (!c) return;
    if (
      c.querySelectorAll(".event-card").length === 0 &&
      !c.querySelector('[role="alert"]')
    ) {
      const noResultIcon = `<svg class="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
      const msg =
        (typeof getDynamicUiText === "function" &&
          getDynamicUiText().noResults) ||
        "לא נמצאו מועדים תואמים.";
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
    "תשרי-1": [
      { name: "ראש השנה", title: "יום הדין – ראש השנה לכל המצוות", icon: "🎺" },
    ],
    "תשרי-3": [{ name: "צום גדליה", title: "זכר לגדליה בן אחיקם", icon: "✨" }],
    "תשרי-10": [
      { name: "יום הכיפורים", title: "יום הכפרות והסליחות הגדול", icon: "✨" },
    ],
    "תשרי-13": [
      { name: "רבי עקיבא איגר", title: "גדול פוסקי אשכנז, פוזנא", icon: "🕯️" },
      {
        name: 'המהר"ש מלובביץ',
        title: 'רבי שמואל שניאורסון, אדמו"ר הרביעי של חב"ד',
        icon: "🕯️",
      },
    ],
    "תשרי-14": [
      {
        name: "המגיד מקוז'ניץ",
        title: "רבי ישראל הופשטיין, בעל עבודת ישראל",
        icon: "🕯️",
      },
    ],
    "תשרי-18": [
      {
        name: "רבי נחמן מברסלב",
        title: 'בעל ספר ליקוטי מוהר"ן, אוּמַן',
        icon: "🕯️",
      },
    ],
    "תשרי-19": [
      {
        name: "היהודי הקדוש מפשיסחא",
        title: "רבי יעקב יצחק רבינוביץ",
        icon: "🕯️",
      },
    ],
    "תשרי-25": [
      { name: "רבי לוי יצחק מברדיצ'ב", title: "בעל קדושת לוי", icon: "🕯️" },
      {
        name: "החתם סופר",
        title: "רבי משה סופר, גדול פוסקי אשכנז",
        icon: "🕯️",
      },
    ],
    // ── חשוון ──
    "חשוון-3": [
      {
        name: "רבי ישראל מרוז'ין",
        title: "מייסד שושלת רוז'ין, בעל עבודת ישראל",
        icon: "🕯️",
      },
      {
        name: "מרן רבי עובדיה יוסף",
        title: "הראשון לציון, בעל ספרי יביע אומר",
        icon: "🕯️",
      },
    ],
    "חשוון-11": [
      {
        name: "רחל אמנו עליה השלום",
        title: "אמנו רחל, קבורה בבית לחם",
        icon: "🕯️",
      },
      {
        name: "רבי מנחם נחום מצ'רנוביל",
        title: 'בעל מאור עיניים, מגדולי תלמידי הבעש"ט',
        icon: "🕯️",
      },
    ],
    // ── כסלו ──
    "כסלו-19": [
      {
        name: "המגיד הגדול ממזריטש",
        title: 'רבי דב בער, ממשיך הבעש"ט',
        icon: "🕯️",
      },
      {
        name: 'י"ט כסלו – חג הגאולה',
        title: 'גאולת אדמו"ר הזקן ורבי לוי יצחק, חב"ד',
        icon: "✨",
      },
    ],
    // ── טבת ──
    "טבת-10": [
      {
        name: "עשרה בטבת",
        title: "צום – תחילת מצור נבוכדנאצר על ירושלים",
        icon: "✨",
      },
      {
        name: "רבי נתן מברסלב",
        title: "תלמיד רבי נחמן, בעל ליקוטי הלכות",
        icon: "🕯️",
      },
    ],
    "טבת-18": [
      {
        name: "הבני יששכר",
        title: "רבי צבי אלימלך שפירא מדינוב, בעל בני יששכר",
        icon: "🕯️",
      },
    ],
    "טבת-20": [
      { name: 'הרמב"ם', title: "רבי משה בן מיימון, גדול הפוסקים", icon: "🕯️" },
    ],
    "טבת-24": [
      {
        name: "רבי שניאור זלמן מליאדי",
        title: 'בעל התניא, מייסד חסידות חב"ד',
        icon: "🕯️",
      },
    ],
    // ── שבט ──
    "שבט-2": [
      {
        name: "רבי זושא מאניפולי",
        title: "אחי רבי אלימלך, מגדולי החסידות",
        icon: "🕯️",
      },
    ],
    "שבט-4": [
      {
        name: "רבי משה לייב מסאסוב",
        title: "בעל ליקוטי שושנה, עמוד האהבה",
        icon: "🕯️",
      },
    ],
    "שבט-5": [
      {
        name: "רבי מנחם מנדל מויטבסק",
        title: "מנהיג החסידות בארץ ישראל, פתח תקווה",
        icon: "🕯️",
      },
    ],
    "שבט-10": [
      {
        name: 'כ"ק אדמו"ר הריי"צ',
        title: 'רבי יוסף יצחק שניאורסון, אדמו"ר השישי מחב"ד',
        icon: "🕯️",
      },
    ],
    "שבט-15": [{ name: 'ט"ו בשבט', title: "ראש השנה לאילנות", icon: "🌳" }],
    "שבט-22": [
      {
        name: "רבי מנחם מנדל מקוצק",
        title: "הקוצקר, בעל אמת ועוז",
        icon: "🕯️",
      },
    ],
    "שבט-25": [
      { name: "רבי ישראל סלנטר", title: "מייסד תנועת המוסר", icon: "🕯️" },
    ],
    // ── אדר ──
    "אדר-5": [
      {
        name: "השפת אמת",
        title: 'רבי יהודה אריה ליב אלתר, אדמו"ר גור',
        icon: "🕯️",
      },
    ],
    "אדר-7": [
      {
        name: "משה רבנו עליו השלום",
        title: "גדול הנביאים, מקבל התורה מסיני",
        icon: "🕯️",
      },
    ],
    "אדר-11": [
      {
        name: 'החיד"א',
        title: "רבי חיים יוסף דוד אזולאי, גדול הספרדים",
        icon: "🕯️",
      },
    ],
    "אדר-13": [
      {
        name: "רבי משה פיינשטיין",
        title: 'גדול פוסקי הדור, בעל שו"ת אגרות משה',
        icon: "🕯️",
      },
    ],
    "אדר-21": [
      {
        name: "רבי אלימלך מליז'נסק",
        title: "בעל נועם אלימלך, עמוד החסידות",
        icon: "🕯️",
      },
    ],
    "אדר-23": [
      {
        name: 'החידושי הרי"ם',
        title: "רבי יצחק מאיר אלתר, מייסד שושלת גור",
        icon: "🕯️",
      },
    ],
    // ── ניסן ──
    "ניסן-2": [
      {
        name: 'הרש"ב',
        title: 'רבי שלום דובער שניאורסון, אדמו"ר החמישי מחב"ד',
        icon: "🕯️",
      },
    ],
    "ניסן-5": [
      {
        name: "האוהב ישראל מאפטא",
        title: "רבי אברהם יהושע העשיל מאפטא",
        icon: "🕯️",
      },
    ],
    "ניסן-13": [
      {
        name: "מרן רבי יוסף קארו",
        title: "בעל השולחן ערוך והבית יוסף",
        icon: "🕯️",
      },
      {
        name: "הצמח צדק",
        title: 'רבי מנחם מנדל שניאורסון, אדמו"ר השלישי מחב"ד',
        icon: "🕯️",
      },
    ],
    "ניסן-27": [
      {
        name: "יום הזיכרון לשואה ולגבורה",
        title: "זכר ועדות לשואת יהודי אירופה",
        icon: "🕯️",
      },
    ],
    // ── אייר ──
    "אייר-1": [
      {
        name: "רבי שמלקה מניקלשבורג",
        title: "תלמיד המגיד ממזריטש, בעל דברי שמואל",
        icon: "🕯️",
      },
    ],
    "אייר-11": [
      { name: "רבי נפתלי מרופשיץ", title: "בעל זרע קודש", icon: "🕯️" },
    ],
    "אייר-14": [
      {
        name: "רבי מאיר בעל הנס",
        title: "תנא קדוש, תלמיד רבי עקיבא",
        icon: "🕯️",
      },
    ],
    "אייר-17": [
      {
        name: "הנודע ביהודה",
        title: "רבי יחזקאל לנדא מפראג, גדול פוסקי אשכנז",
        icon: "🕯️",
      },
    ],
    "אייר-18": [
      {
        name: 'רבי שמעון בר יוחאי – הרשב"י',
        title: "בעל הזוהר הקדוש, לג בעומר",
        icon: "🕯️",
      },
      {
        name: 'הרמ"א',
        title: "רבי משה איסרליש, בעל המפה על השולחן ערוך",
        icon: "🕯️",
      },
    ],
    "אייר-22": [
      {
        name: "רבי אורי מסטרעליסק",
        title: "השרף הקדוש, בעל אמרי קודש",
        icon: "🕯️",
      },
    ],
    "אייר-26": [
      {
        name: 'רבי משה חיים לוצאטו – רמח"ל',
        title: "בעל מסילת ישרים ודרך ה'",
        icon: "🕯️",
      },
    ],
    "אייר-29": [
      {
        name: "רבי מאיר מפרמישלאן",
        title: 'בעל בת עין, נכד הבעש"ט',
        icon: "🕯️",
      },
    ],
    // ── סיוון ──
    "סיוון-6": [
      {
        name: "דוד המלך עליו השלום",
        title: "מלך ישראל, כותב תהלים",
        icon: "🕯️",
      },
      {
        name: "הבעל שם טוב",
        title: "רבי ישראל בעל שם טוב, מייסד תנועת החסידות",
        icon: "🕯️",
      },
    ],
    "סיוון-10": [
      {
        name: "רבי יצחק אייזיק מקאמרנא",
        title: "בעל הֵיכל הברכה, מגדולי קאמרנא",
        icon: "🕯️",
      },
    ],
    "סיוון-14": [
      {
        name: "רבי חיים מוולוז'ין",
        title: "תלמיד הגר\"א, מייסד ישיבת וולוז'ין",
        icon: "🕯️",
      },
    ],
    // ── תמוז ──
    "תמוז-3": [
      {
        name: 'כ"ק אדמו"ר מחב"ד',
        title: 'רבי מנחם מנדל שניאורסון, נשיא חב"ד',
        icon: "🕯️",
      },
    ],
    "תמוז-14": [
      { name: "הפלאה", title: "רבי פינחס הורוביץ, בעל ספר הפלאה", icon: "🕯️" },
    ],
    "תמוז-15": [
      {
        name: "האור החיים הקדוש",
        title: "רבי חיים בן עטר, בעל אור החיים על התורה",
        icon: "🕯️",
      },
    ],
    "תמוז-19": [
      {
        name: "רבי אהרן הגדול מקרלין",
        title: "מגדולי תלמידי המגיד, קרלין",
        icon: "🕯️",
      },
    ],
    "תמוז-22": [
      {
        name: "רבי שלמה מקרלין",
        title: 'בעל שבחי הר"ש, עמוד החסידות',
        icon: "🕯️",
      },
    ],
    "תמוז-29": [
      {
        name: 'רש"י',
        title: "רבי שלמה יצחקי, פרשן התורה והתלמוד לדורות",
        icon: "🕯️",
      },
    ],
    // ── אב ──
    "אב-1": [
      {
        name: "אהרן הכהן הגדול",
        title: "אח משה רבנו, ראשון הכהנים הגדולים",
        icon: "🕯️",
      },
    ],
    "אב-5": [
      {
        name: 'האר"י הקדוש',
        title: "רבי יצחק לוריא אשכנזי, אבי קבלת צפת",
        icon: "🕯️",
      },
    ],
    "אב-9": [
      { name: "תשעה באב", title: "יום אבל על חורבן בית המקדש", icon: "✨" },
    ],
    "אב-10": [
      {
        name: "המי השילוח",
        title: "רבי מרדכי יוסף ליינר מאיזביצא",
        icon: "🕯️",
      },
    ],
    "אב-16": [
      { name: "רבי יהושע מבעלזא", title: 'אדמו"ר הרביעי מבעלז', icon: "🕯️" },
    ],
    "אב-20": [
      {
        name: "רבי לוי יצחק שניאורסון",
        title: 'אביו של הרבי מחב"ד, אלמא-אטה',
        icon: "🕯️",
      },
    ],
    "אב-21": [
      {
        name: "רבי אהרן רוקח מבעלזא",
        title: 'אדמו"ר הרביעי מבעלז',
        icon: "🕯️",
      },
    ],
    // ── אלול ──
    "אלול-9": [
      {
        name: "רבי צדוק הכהן מלובלין",
        title: "בעל פרי צדיק ולוב ישראל",
        icon: "🕯️",
      },
    ],
    "אלול-10": [
      { name: "רבי פינחס מקוריץ", title: 'מגדולי תלמידי הבעש"ט', icon: "🕯️" },
    ],
    "אלול-12": [
      {
        name: "רבי שמחה בונם מפשיסחא",
        title: 'מגדולי אדמו"רי הפשיסחא',
        icon: "🕯️",
      },
    ],
    "אלול-18": [
      { name: "חי אלול", title: 'יום הולדת הבעש"ט ואדמו"ר הזקן', icon: "✨" },
    ],
    "אלול-27": [
      { name: "רבי שלום רוקח מבעלזא", title: "מייסד שושלת בעלז", icon: "🕯️" },
    ],
  };

  var _dayOffset = 0;
  var _calRefDate = null;

  function getHebInfo(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    var fmtM = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });
    var fmtD = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { day: "numeric" });
    var fmtY = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      year: "numeric",
    });
    var month = fmtM.format(d);
    var dayNum = parseInt(fmtD.format(d).replace(/[^0-9]/g, ""), 10);
    var year = fmtY.format(d);
    var fmtGreg = new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    var gregStr = fmtGreg.format(d);
    return {
      month: month,
      day: dayNum,
      year: year,
      key: month + "-" + dayNum,
      date: d,
      gregStr: gregStr,
    };
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
      if (d2 === 1) {
        len = i + 1;
        break;
      }
    }
    return len || 30;
  }

  function buildHilulotList(tzaddikim, key) {
    if (!tzaddikim || tzaddikim.length === 0) {
      return (
        '<div style="text-align:center;padding:2rem 0;color:#94a3b8;">' +
        '<div style="font-size:2.5rem;margin-bottom:0.75rem;">🌙</div>' +
        '<p style="font-size:1rem;font-weight:600;">אין הילולות ידועות להיום</p>' +
        '<p style="font-size:0.8rem;margin-top:0.5rem;opacity:0.7;">(' +
        (key || "") +
        ")</p>" +
        "</div>"
      );
    }
    return tzaddikim
      .map(function (t) {
        return (
          '<div style="display:flex;align-items:flex-start;gap:0.75rem;padding:0.85rem 1rem;' +
          "background:rgba(255,255,255,0.06);border-radius:1rem;margin-bottom:0.65rem;" +
          'border:1px solid rgba(255,255,255,0.1);">' +
          '<span style="font-size:1.6rem;flex-shrink:0;">' +
          (t.icon || "🕯️") +
          "</span>" +
          '<div style="direction:rtl;text-align:right;">' +
          '<div style="font-weight:700;font-size:1rem;color:#e2e8f0;margin-bottom:0.2rem;">' +
          t.name +
          "</div>" +
          '<div style="font-size:0.78rem;color:#94a3b8;line-height:1.4;">' +
          t.title +
          "</div>" +
          "</div></div>"
        );
      })
      .join("");
  }

  function refreshMainModal(offset) {
    var info = getHebInfo(offset);
    var tzaddikim = HD[info.key] || [];
    var titleEl = document.getElementById("hil-title");
    var bodyEl = document.getElementById("hilulot-body");
    if (titleEl)
      titleEl.textContent =
        "הילולות – " + info.day + " " + info.month + " " + info.year;
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
    if (todayBtn) todayBtn.style.display = offset !== 0 ? "block" : "none";
  }

  window.openHilulotModal = function (initOffset) {
    _dayOffset = typeof initOffset === "number" ? initOffset : 0;
    var info = getHebInfo(_dayOffset);
    var tzaddikim = HD[info.key] || [];

    var old = document.getElementById("hilulot-modal");
    if (old) old.remove();

    var modal = document.createElement("div");
    modal.id = "hilulot-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText =
      "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);padding:1rem;";

    var dateLabel;
    if (_dayOffset === 0) dateLabel = "היום";
    else if (_dayOffset === -1) dateLabel = "אתמול";
    else if (_dayOffset === 1) dateLabel = "מחר";
    else dateLabel = info.day + " " + info.month;

    modal.innerHTML =
      '<div id="hilulot-inner" style="' +
      "background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);" +
      "border:1px solid rgba(139,92,246,0.35);border-radius:1.5rem;" +
      "padding:1.75rem 1.5rem 1.25rem;max-width:420px;width:100%;" +
      "max-height:85vh;overflow-y:auto;position:relative;" +
      'box-shadow:0 25px 60px rgba(0,0,0,0.6);">' +
      '<button id="hilulot-close" ' +
      'style="position:absolute;top:1rem;left:1rem;background:rgba(255,255,255,0.1);' +
      "border:none;border-radius:50%;width:2rem;height:2rem;cursor:pointer;" +
      'color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"' +
      ' aria-label="סגור">✕</button>' +
      '<div style="text-align:center;margin-bottom:1rem;">' +
      '<div style="font-size:1.8rem;margin-bottom:0.4rem;">🕯️</div>' +
      '<h2 id="hil-title" style="font-size:1.1rem;font-weight:700;color:#c4b5fd;margin:0 0 0.2rem;">' +
      "הילולות – " +
      info.day +
      " " +
      info.month +
      " " +
      info.year +
      "</h2>" +
      '<p style="font-size:0.78rem;color:#64748b;margin:0 0 0.15rem;">יארצייט ויום הסתלקות צדיקים</p>' +
      '<p id="hil-greg-date" style="font-size:0.78rem;color:#475569;margin:0;direction:ltr;">' +
      info.gregStr +
      "</p>" +
      "</div>" +
      // Navigation arrows
      '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'margin-bottom:1rem;direction:ltr;">' +
      '<button id="hil-prev" data-offset="' +
      (_dayOffset - 1) +
      '" ' +
      'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
      'color:#c4b5fd;border-radius:0.75rem;padding:0.4rem 0.9rem;cursor:pointer;font-size:1.2rem;" ' +
      'title="יום קודם">‹</button>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;">' +
      '<span id="hil-datelabel" style="color:#94a3b8;font-size:0.85rem;">' +
      dateLabel +
      "</span>" +
      '<button id="hil-today-btn" style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);color:#fbbf24;border-radius:0.5rem;padding:0.1rem 0.7rem;cursor:pointer;font-size:0.72rem;font-weight:700;display:' +
      (_dayOffset !== 0 ? "block" : "none") +
      ';">היום</button>' +
      "</div>" +
      '<button id="hil-next" data-offset="' +
      (_dayOffset + 1) +
      '" ' +
      'style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);' +
      'color:#c4b5fd;border-radius:0.75rem;padding:0.4rem 0.9rem;cursor:pointer;font-size:1.2rem;" ' +
      'title="יום הבא">›</button>' +
      "</div>" +
      '<div id="hilulot-body">' +
      buildHilulotList(tzaddikim, info.key) +
      "</div>" +
      // Calendar button
      '<div style="text-align:center;margin-top:1.1rem;">' +
      '<button id="hil-cal-btn" ' +
      'style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
      'color:#c4b5fd;border-radius:1rem;padding:0.5rem 1.2rem;cursor:pointer;font-size:0.85rem;">' +
      "📅 לוח הילולות חודשי" +
      "</button>" +
      "</div>" +
      "</div>";

    document.body.appendChild(modal);

    function navTo(newOffset) {
      _dayOffset = newOffset;
      refreshMainModal(_dayOffset);
    }

    modal.querySelector("#hil-prev").addEventListener("click", function () {
      navTo(_dayOffset - 1);
    });
    modal.querySelector("#hil-next").addEventListener("click", function () {
      navTo(_dayOffset + 1);
    });
    var todayBtnEl = modal.querySelector("#hil-today-btn");
    if (todayBtnEl)
      todayBtnEl.addEventListener("click", function () {
        navTo(0);
      });
    modal.querySelector("#hil-cal-btn").addEventListener("click", function () {
      modal.remove();
      window.openHilulotCalendar();
    });
    modal
      .querySelector("#hilulot-close")
      .addEventListener("click", function () {
        modal.remove();
      });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", esc);
      }
    });
    modal.querySelector("#hilulot-close").focus();
  };

  // ── Calendar popup ──

  var HIL_HEB_DAYS = [
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

  function buildCalendarGrid(refDate) {
    var fmtM = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });
    var fmtY = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      year: "numeric",
    });
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
      cells.push({
        dayNum: dayNum,
        hebLetter: HIL_HEB_DAYS[dayNum] || String(dayNum),
        key: key,
        haH: haH,
        offset: offset,
        isToday: isToday,
        gregDay: cellDate.getDate(),
      });
    }

    return {
      monthName: monthName,
      yearName: yearName,
      dow: dow,
      cells: cells,
      len: len,
      first: first,
    };
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
      var fmtGM = new Intl.DateTimeFormat("he-IL", {
        month: "long",
        year: "numeric",
      });
      var startG = fmtGM.format(g.first);
      var endG = fmtGM.format(lastDate);
      gregMonthEl.textContent =
        startG === endG ? startG : startG + " – " + endG;
    }

    var gridEl = document.getElementById("hil-cal-grid");
    if (!gridEl) return;

    var html = "";
    // Empty cells before first day
    for (var e = 0; e < g.dow; e++) {
      html += "<div></div>";
    }
    g.cells.forEach(function (c) {
      var bg = c.isToday
        ? "background:rgba(251,191,36,0.25);border:1px solid rgba(251,191,36,0.6);"
        : c.haH
          ? "background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);"
          : "background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);";
      var cursor = c.haH ? "cursor:pointer;" : "";
      var onCl = c.haH
        ? ' onclick="window._hilOpenFromCal(' + c.offset + ')"'
        : "";
      var dot = c.haH
        ? '<div style="width:5px;height:5px;border-radius:50%;background:#a78bfa;margin:1px auto 0;"></div>'
        : '<div style="height:6px;"></div>';
      html +=
        "<div" +
        onCl +
        ' style="' +
        bg +
        cursor +
        'border-radius:0.5rem;padding:0.25rem 0;text-align:center;min-height:2.6rem;" ' +
        'title="' +
        (c.haH ? c.key : "") +
        '">' +
        '<div style="font-size:0.75rem;color:' +
        (c.isToday ? "#fbbf24" : c.haH ? "#c4b5fd" : "#94a3b8") +
        ";font-weight:" +
        (c.haH || c.isToday ? "700" : "400") +
        ';line-height:1.2;">' +
        c.hebLetter +
        "</div>" +
        '<div style="font-size:0.6rem;color:#475569;line-height:1;margin-bottom:1px;">' +
        c.gregDay +
        "</div>" +
        dot +
        "</div>";
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
    modal.style.cssText =
      "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);padding:1rem;";

    var DOW_LABELS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

    var dowHtml = DOW_LABELS.map(function (l) {
      return (
        '<div style="text-align:center;font-size:0.72rem;color:#64748b;font-weight:600;">' +
        l +
        "</div>"
      );
    }).join("");

    modal.innerHTML =
      '<div style="' +
      "background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);" +
      "border:1px solid rgba(139,92,246,0.35);border-radius:1.5rem;" +
      "padding:1.5rem;max-width:380px;width:100%;" +
      "max-height:90vh;overflow-y:auto;position:relative;" +
      'box-shadow:0 25px 60px rgba(0,0,0,0.6);">' +
      '<button id="hil-cal-close" ' +
      'style="position:absolute;top:1rem;left:1rem;background:rgba(255,255,255,0.1);' +
      "border:none;border-radius:50%;width:2rem;height:2rem;cursor:pointer;" +
      'color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"' +
      ' aria-label="סגור">✕</button>' +
      '<div style="text-align:center;margin-bottom:1rem;">' +
      '<div style="font-size:1.5rem;margin-bottom:0.3rem;">📅</div>' +
      '<h2 style="font-size:1.3rem;font-weight:700;color:#e2e8f0;margin:0 0 0.2rem;letter-spacing:0.01em;">לוח הילולות</h2>' +
      '<p style="font-size:0.75rem;color:#64748b;margin:0;">לחץ על יום מסומן לצפייה בהילולות</p>' +
      "</div>" +
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
      "</div>" +
      '<div style="text-align:center;margin-bottom:0.45rem;">' +
      '<button onclick="window._hilCalToday()" ' +
      'style="background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.45);' +
      "color:#fbbf24;border-radius:0.6rem;padding:0.18rem 0.9rem;cursor:pointer;" +
      'font-size:0.78rem;font-weight:600;" title="חזור להיום">היום</button>' +
      "</div>" +
      '<p id="hil-cal-greg-month" style="text-align:center;font-size:0.72rem;color:#475569;' +
      'margin:0 0 0.6rem;direction:ltr;"></p>' +
      // Day-of-week header
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px;">' +
      dowHtml +
      "</div>" +
      // Grid
      '<div id="hil-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;"></div>' +
      // Legend
      '<div style="display:flex;gap:1rem;justify-content:center;margin-top:0.85rem;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:#94a3b8;">' +
      '<div style="width:10px;height:10px;border-radius:2px;background:rgba(139,92,246,0.18);border:1px solid rgba(139,92,246,0.4);"></div>' +
      "יום הילולה" +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:#94a3b8;">' +
      '<div style="width:10px;height:10px;border-radius:2px;background:rgba(251,191,36,0.25);border:1px solid rgba(251,191,36,0.6);"></div>' +
      "היום" +
      "</div>" +
      "</div>" +
      // Back button
      '<div style="text-align:center;margin-top:1rem;">' +
      '<button id="hil-cal-back" ' +
      'style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);' +
      'color:#94a3b8;border-radius:0.75rem;padding:0.4rem 1rem;cursor:pointer;font-size:0.82rem;">' +
      "← חזרה להילולות" +
      "</button>" +
      "</div>" +
      "</div>";

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

    modal
      .querySelector("#hil-cal-close")
      .addEventListener("click", function () {
        modal.remove();
      });
    modal.querySelector("#hil-cal-back").addEventListener("click", function () {
      modal.remove();
      window.openHilulotModal(_dayOffset);
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") {
        modal.remove();
        document.removeEventListener("keydown", esc);
      }
    });
    modal.querySelector("#hil-cal-close").focus();
  };
})();

// ═══════════════════════════════════════════════════════
// ✦  DIVREI TORAH – מועד הבא פופ-אפ
// ═══════════════════════════════════════════════════════
(function () {
  var DT = {
    שבועות: [
      [
        {
          title: "נעשה ונשמע – קבלת התורה",
          source: "הבעל שם טוב",
          text: "כשאמרו ישראל 'נעשה ונשמע' הקדימו עשייה להבנה, ולימדונו שהדרך לחכמה היא דווקא על ידי המעשה. האדם שמקיים מצוות בשמחה ובאהבה, עוד לפני שהבין אותן לגמרי – זוכה אחר כך להבין אותן מבפנים. כמו שאמר שלמה המלך: 'לב חכם לימינו' – הלב מוביל אל החכמה.",
          icon: "📜",
        },
        {
          title: "מגילת רות ותיקון הנשמה",
          source: "הגאון מווילנא",
          text: "מנהג ישראל לקרוא מגילת רות בחג השבועות. רות המואבייה שאמרה 'עמך עמי ואלוהיך אלוהי', מלמדת שקבלת התורה אינה רק מחויבות – היא בחירה מאהבה. כשם שרות בחרה בעמה של נעמי, כך כל יהודי בחג השבועות מחדש את בחירתו בתורה ובה' מתוך אהבה עמוקה ואמיתית.",
          icon: "🌾",
        },
        {
          title: "הספירה – הכנה למתן תורה",
          source: 'הרמח"ל',
          text: "ארבעים ותשעה ימי ספירת העומר הם מסע של תיקון המידות. כל שבוע מייצג מידה: אהבה, גבורה, תפארת, נצח, הוד, יסוד, ומלכות. כשמגיע חג השבועות, האדם שעמל על עצמו כל שבעת השבועות – מוכן לקבל את התורה בטהרה וקדושה, כפי שהיה במעמד הר סיני.",
          icon: "✨",
        },
      ],
      [
        {
          title: "הר סיני – למה דווקא מדבר?",
          source: 'חז"ל – מסכת סוטה',
          text: "אמרו חז\"ל: 'למה ניתנה תורה במדבר סיני?' – כדי ללמדנו שהתורה ניתנת לאדם שמפנה את עצמו ועושה עצמו כמדבר, הפקר לכל. מי שמגביה עצמו אינו יכול לקבל. אך מי שמשפיל עצמו ומפנה לבו – אליו שורה השכינה ועליו ניתנת התורה.",
          icon: "⛰️",
        },
        {
          title: "מתן תורה – חתונה בין ה' לישראל",
          source: 'רש"י',
          text: "בפסוק 'ויצא משה לקראת האלוהים' – פירש רש\"י שמשה יצא כשושבין לקראת חתן. הר סיני הוא כחופה, ישראל כלה וה' כחתן. ממעמד זה נולד קשר נצחי בין ה' לעמו. כל שנה בשבועות אנחנו מחדשים את ה'חתונה' הזאת – קבלת עול מלכות שמים מתוך אהבה.",
          icon: "💍",
        },
        {
          title: "תלמוד תורה כנגד כולם",
          source: 'הרמב"ם',
          text: "כתב הרמב\"ם: 'תלמוד תורה כנגד כולם' – לימוד התורה שקול כנגד כל שאר המצוות. ובחג השבועות, שהוא זמן מתן תורתנו, מקבלים כוח מיוחד ללמוד. הלילה הראשון – ליל שבועות – מסורת ישראל ללמוד כל הלילה, לא לישון, מתוך שמחה וציפייה לקבלת התורה.",
          icon: "📚",
        },
      ],
    ],
    "ראש השנה": [
      [
        {
          title: "יום הדין – יום הרחמים",
          source: 'הרב קוק זצ"ל',
          text: "ראש השנה הוא יום הדין, אך גדולי ישראל לימדונו שהדין הוא חסד עמוק. כשהקדוש ברוך הוא שופט את האדם, הוא מביט על מלוא ערכו ועל כל הטוב שבו. תקיעת השופר מעוררת את הנשמה משנת חיי השגרה ומזכירה לנו: אנחנו בנים לה' אלוהינו.",
          icon: "🎺",
        },
        {
          title: "זכרנו לחיים – מהות החיים",
          source: "השפת אמת",
          text: "אנחנו מבקשים 'זכרנו לחיים, מלך חפץ בחיים'. מהם אותם חיים? לא רק חיי הגוף, אלא חיי הנשמה. החיים האמיתיים הם חיים של משמעות, של קשר לה', של קיום מצוות מאהבה. ראש השנה הוא הזמן לשאול: האם אני חי חיים של אמת? האם המעשים שלי מביאים חיים לעולם?",
          icon: "📖",
        },
        {
          title: "תשובה – חזרה אל עצמנו",
          source: "רבי נחמן מברסלב",
          text: "אמר רבי נחמן: 'אם אתה מאמין שיכולים לקלקל, תאמין שיכולים לתקן'. ראש השנה הוא ראש – ראש כל השנה. כמו שהראש מנהל את הגוף, כך ימים אלה מגדירים את כל השנה. כל תשובה שנעשה עכשיו, כל החלטה טובה – תשפיע על כל ימות השנה.",
          icon: "🕯️",
        },
      ],
      [
        {
          title: "מלוך על כל העולם",
          source: "תפילת ראש השנה – מוסף",
          text: "בתפילת ראש השנה אנחנו מבקשים 'מלוך על כל העולם כולו בכבודך'. ראש השנה הוא יום הכתרת המלך. כשם שמלך בשר ודם מולך בהסכמת העם – כך ה' ממתין לנו שנכתיר אותו. כל תקיעת שופר היא הכרזה: 'ה' מלך, ה' מלך, ה' ימלוך לעולם ועד'.",
          icon: "👑",
        },
        {
          title: "עקידת יצחק – כוח הסרבנות לרע",
          source: "בעל התניא",
          text: "בראש השנה קוראים בתורה את עקידת יצחק. אברהם אבינו הגיע לדרגה שהיה מוכן לוותר על הכי יקר לו. ה' לא רצה שישחט – הוא רצה לראות את הנכונות. כך כל אחד מאתנו בראש השנה: לא צריכים להקריב הכל – צריכים לשאול את עצמנו: האם אני מוכן?",
          icon: "🔥",
        },
        {
          title: "שופר – קול הנשמה",
          source: 'הרמב"ם',
          text: "כתב הרמב\"ם: 'אף על פי שתקיעת שופר גזירת הכתוב – יש בה רמז. כלומר: עורו ישנים משנתכם ונרדמים הקיצו מתרדמתכם'. השופר אינו רק מצווה – הוא קול הנשמה הפנימית שצועקת: חזור! התעורר! השנה הזאת יכולה להיות שונה.",
          icon: "🎺",
        },
      ],
    ],
    "יום כיפור": [
      [
        {
          title: "כוח הוידוי",
          source: 'הרמב"ם',
          text: "כתב הרמב\"ם שעיקר התשובה היא הוידוי בפה. 'אנא ה' חטאתי, עויתי, פשעתי לפניך'. כשאדם מוציא את החטא מלבו ומדבר אותו בפיו, הוא מתפרד ממנו. הוידוי הוא לא רק הכרה בעבר – הוא הצהרת כוונה לעתיד. 'ולא אשוב לדבר הזה עוד' – אלו המילים שמשנות את האדם.",
          icon: "✨",
        },
        {
          title: "נשמה טהורה",
          source: "הבעל שם טוב",
          text: "ביום הכיפורים כולנו כמו מלאכים. אין אכילה, אין שתייה – הגוף נדחק לצד והנשמה מאירה. הבעל שם טוב לימד שגם בחוטא הגדול ביותר יש ניצוץ קדוש שלא ניתן לכבותו לעולם. יום כיפור הוא היום שאותו הניצוץ מתגלה, וכולנו – גדולים וקטנים – עומדים לפני ה' בטהרת הנשמה.",
          icon: "🌟",
        },
        {
          title: "ה' מוחל – לא רק סולח",
          source: "הספורנו",
          text: "יש הבדל בין 'סליחה' ל'מחילה'. הסולח מוותר על עונש אך הפגיעה נשארת בלב. המוחל – מוחה לגמרי, כאילו לא היה. הקדוש ברוך הוא ביום הכיפורים לא רק סולח – הוא מוחל. 'כי ביום הזה יכפר עליכם לטהר אתכם, מכל חטאתיכם לפני ה' תטהרו'. הטהרה היא מחיקה מוחלטת.",
          icon: "💫",
        },
      ],
      [
        {
          title: "נעילה – שעת הדחיפות",
          source: "השפת אמת",
          text: "תפילת נעילה היא השעה האחרונה של יום כיפור – שעה שבה שערי שמים נסגרים. 'נעילה' מלשון נעילת השערים. אמר השפת אמת: דווקא בדקה האחרונה, כשהאדם מרגיש שהזמן נגמר – הוא מתפלל מעמקי הלב. לפעמים הצעקה האחרונה חזקה מכל שאר התפילות.",
          icon: "🚪",
        },
        {
          title: "חמישה עינויים – חמש דרגות",
          source: "הרב סולובייצ'יק",
          text: "חמישה עינויים ביום כיפור: איסור אכילה, שתייה, רחיצה, סיכה, נעילת הסנדל ותשמיש המיטה. כל עינוי מנתק אותנו מדרגה אחת של גשמיות. יום כיפור הוא יום שבו אנחנו חיים כנשמות טהורות. בכך מדמים אנחנו את עצמנו למלאכים ומתחברים לטהרת הבריאה.",
          icon: "⚪",
        },
        {
          title: "כל נדרי – שחרור הנפש",
          source: 'הרב עובדיה יוסף זצ"ל',
          text: "'כל נדרי' – נוסח עתיק שבו אנחנו מבקשים להשתחרר מנדרים שלא קיימנו. הכוונה הפנימית עמוקה יותר: כל הכבלים שכבלנו את נשמתנו בשנה שעברה – אנחנו מבקשים להשתחרר מהם. יום כיפור פותח בשחרור, כדי שנוכל להתחיל ברורים ונקיים.",
          icon: "🌿",
        },
      ],
    ],
    סוכות: [
      [
        {
          title: "ארבעת המינים – אחדות ישראל",
          source: "ספר הזוהר",
          text: "ארבעת המינים מסמלים ארבעה סוגי יהודים. האתרוג – טעם וריח, תורה ומעשים. הלולב – טעם בלי ריח, תורה בלי מעשים. ההדס – ריח בלי טעם, מעשים בלי תורה. הערבה – בלי טעם ובלי ריח. כשמחברים אותם יחד, אנחנו אומרים: 'כולנו יחד, עם כל ההבדלים ביננו – אנחנו אחד לפני ה''.",
          icon: "🌿",
        },
        {
          title: "הסוכה – צל האמונה",
          source: "רבי שלמה קרליבך",
          text: "הסוכה היא הבית הקדוש ביותר. לא כי היא חזקה – היא שברירית. לא כי היא בטוחה – הכוכבים נראים דרך גגה. הסוכה מלמדת שהביטחון האמיתי אינו בקירות עבים אלא באמונה. כשיושבים בסוכה, אנחנו אומרים: 'ה', אני בוטח בך, לא בחומות שלי'.",
          icon: "🍂",
        },
        {
          title: "זמן שמחתנו",
          source: "החיי אדם",
          text: "סוכות נקרא 'זמן שמחתנו' יותר מכל חג אחר. כי אחרי ראש השנה ויום כיפור – ימי הדין והכפרה – אנחנו יוצאים זכאים ושמחים. השמחה של סוכות היא שמחת הזיכוי. אדם שיצא מבית הדין זכאי – כמה הוא שמח! כך ישראל אחרי הימים הנוראים – שמחים בידיעה שה' מחל להם.",
          icon: "🎊",
        },
      ],
      [
        {
          title: "ושמחת בחגך – שמחה שלמה",
          source: 'הרמב"ם',
          text: 'כתב הרמב"ם שמצוות שמחה בחג כוללת גם לשמח עניים, יתומים ואלמנות. שמחה שהיא רק עבור עצמנו – אינה שלמה. הקדוש ברוך הוא שמח כשרואה שכל ברואיו שמחים. סוכות מלמד: השמחה האמיתית היא שמחה משותפת, שמחה שמכלילה את כולם.',
          icon: "🎉",
        },
        {
          title: "שבעה אושפיזין – אורחים עליונים",
          source: "הזוהר הקדוש",
          text: "מסורת הקבלה: בכל יום מסוכות נכנס לסוכה אורח עליון אחד – אברהם, יצחק, יעקב, משה, אהרן, יוסף, דוד. האושפיזין מלמדים אותנו שהסוכה אינה רק בית גשמי – היא מחברת אותנו לנשמות הגדולות של ישראל. כשיושבים בסוכה – יושבים בחברת אבות האומה.",
          icon: "⭐",
        },
        {
          title: "ניסוך המים – שמחת בית השואבה",
          source: "גמרא סוכה",
          text: "'מי שלא ראה שמחת בית השואבה לא ראה שמחה מימיו' – כך אמרו חז\"ל. בבית המקדש היו שופכים מים על המזבח בסוכות. המים מסמלים את רוח הקודש שיורדת מלמעלה. כשאדם שמח בחג מתוך אמונה ואהבה – הוא מושך עליו שפע רוחני מלמעלה.",
          icon: "💧",
        },
      ],
    ],
    "שמחת תורה": [
      [
        {
          title: "הסוף הוא ההתחלה",
          source: "בעל התניא",
          text: "ביום שמחת תורה מסיימים את הפרשה האחרונה – 'וזאת הברכה' – ומיד מתחילים 'בראשית'. התורה אין לה סוף. ברגע שגומרים – מתחילים שוב. הרב מלובביץ לימד: 'תורה היא כמו מעגל, ואין לה ראש ואין לה סוף, כי היא עצמותו של ה' שהוא אין סוף'.",
          icon: "📜",
        },
        {
          title: "הריקוד עם התורה",
          source: "רבי לוי יצחק מברדיצ'ב",
          text: "כל השנה אנחנו לומדים תורה. בשמחת תורה – אנחנו רוקדים איתה. אמר רבי לוי יצחק: כשלומדים תורה, השכל מתחבר לתורה. אבל כשרוקדים עם ספר התורה – כל הגוף, כל הנשמה מתחברים. הריקוד הוא דרגת אחדות עמוקה אפילו יותר מהלימוד עצמו.",
          icon: "🎊",
        },
      ],
      [
        {
          title: "חתן תורה וחתן בראשית",
          source: "מנהג ישראל",
          text: "שני חתנים מרכזיים בשמחת תורה: 'חתן תורה' – המסיים את הסיום, ו'חתן בראשית' – המתחיל מחדש. שניהם מכובדים ברוב עם. יש בזה מסר עמוק: הן הסיום והן ההתחלה הם כבוד. בחיים – גם להגיע לסוף שלב, וגם לפתוח דף חדש – שניהם ראויים לחגיגה.",
          icon: "🎉",
        },
        {
          title: "כל הנערים – ילדי ישראל ותורה",
          source: 'חז"ל',
          text: "בשמחת תורה נהוג להעלות לתורה 'כל הנערים' – כל הילדים יחד, תחת טלית אחת. זה נוהג ייחודי ונדיר. הוא מסמל שהתורה שייכת לכולם, גדולים כקטנים. 'מורשה קהילת יעקב' – התורה היא ירושת כל קהילות ישראל, ובכל הדורות. הילדים הם ערבאי ישראל.",
          icon: "👶",
        },
      ],
    ],
    חנוכה: [
      [
        {
          title: "פך השמן – אור שאינו כבה",
          source: "השפת אמת",
          text: "בפך השמן הקטן היה חתום חותם כהן גדול. גם כשכל השמן טמא – נשאר פך קטן, חתום וטהור. כך בכל יהודי: גם בתוך הגלות, גם בתוך הטומאה – יש נקודה פנימית חתומה, שלא ניתן לגעת בה לעולם. חנוכה מגלה את אותה הנקודה הקדושה שבפנים.",
          icon: "🕎",
        },
        {
          title: "פרסומי ניסא – להאיר את החושך",
          source: 'הרמב"ם',
          text: "מצוות החנוכה היא 'פרסומי ניסא'. לכן מדליקים בפתח הבית, מבחוץ, במקום הגבוה ביותר. האור של ישראל אינו רק לנו – הוא לכל העולם. כל אחד מאיר בנקודה שלו, ויחד אנחנו מאירים את החשכה. 'נר ה' נשמת אדם' – כל נשמה היא נר.",
          icon: "🕯️",
        },
        {
          title: "מעטים מול רבים",
          source: "הבעל שם טוב",
          text: "הנס של חנוכה: מעטים נגד רבים, טמאים נגד טהורים. אמר הבעל שם טוב: 'חנוכה' מלשון 'חינוך' ו'חנוכת הבית'. כל יהודי יכול לחנוך את סביבתו, להדליק נרות אמונה אפילו בחשכה הגדולה ביותר. נר קטן אחד מבטל חשכה גדולה.",
          icon: "✨",
        },
      ],
      [
        {
          title: "מוסיף והולך – צמיחה מתמדת",
          source: "בית הלל ובית שמאי",
          text: "בית שמאי ובית הלל נחלקו: האם להתחיל מ-8 נרות ולחסר, או מ-1 ולהוסיף? הלכה כבית הלל – 'מוסיף והולך'. האור גדל בכל יום. הלמידה: בחיי הרוח אין עמידה במקום. כל יום צריך להוסיף עוד קצת אור, עוד קצת ידע, עוד קצת אהבה.",
          icon: "📈",
        },
        {
          title: "הנרות הללו קודש הם",
          source: "מסכת סופרים",
          text: "'הנרות הללו קודש הם ואין לנו רשות להשתמש בהם'. נרות חנוכה אינם לשימוש – הם לראייה בלבד. זו מסירת מסר: יש דברים בחיים שאינם כלים לצרכינו – הם קדושים בפני עצמם. אמונה, תפילה, קשר לה' – אלה אינם אמצעים, הם ערכים בפני עצמם.",
          icon: "🌟",
        },
        {
          title: "אנטיוכוס והיוונות",
          source: "הרב סולובייצ'יק",
          text: "יוון לא ניסתה להרוג יהודים גופנית – היא ניסתה להפוך אותם ליוונים. 'להשכיחם תורתך ולהעבירם מחוקי רצונך'. הסכנה הייתה תרבותית. חנוכה מציין את ניצחון הזהות היהודית על ההתבוללות. בכל דור שבו התרבות החיצונית מאיימת על ייחודנו – אנחנו מדליקים שוב.",
          icon: "🛡️",
        },
      ],
    ],
    פורים: [
      [
        {
          title: "נהפוך הוא – הסתר פנים",
          source: 'הגר"א',
          text: "שם 'אסתר' מלשון 'הסתר'. כל המגילה – ה' לא מוזכר בה אפילו פעם אחת. זה לא במקרה: נס פורים הוא נס נסתר, טבעי לכאורה. ה' מנהל את ההיסטוריה מאחורי הקלעים. גם כשאיננו רואים את ה' – הוא שם. גם בחשכה הגדולה ביותר ישנו הסיפור האלוקי שמתרחש.",
          icon: "👑",
        },
        {
          title: "מחיית עמלק – מחיית הספקות",
          source: "הבעל שם טוב",
          text: "עמלק מסמל את הספקנות – גימטריה של 'עמלק' שווה ל'ספק'. מלחמת עמלק היא המלחמה בפנימיות, נגד הקרירות ונגד 'מה זה משנה'. פורים הוא היום שנלחמים בספקות ומתחברים לאמונה שלמה: 'קיימו וקבלו היהודים' – קיבלו מחדש, מרצון, את מה שקיבלו בהר סיני.",
          icon: "🎭",
        },
        {
          title: "משתה ושמחה",
          source: "רבי נחמן מברסלב",
          text: "מצווה לשתות בפורים עד שלא ידע. אמר רבי נחמן: בדרגה הגבוהה ביותר, האדם רואה שהכל – אפילו ה'ארור' – הוא חלק מהתכנית האלוקית. 'ונהפוך הוא' – מה שנראה כרע, נהפך לטוב. השמחה של פורים היא שמחת האמת: הכל בסדר, הכל מנוהל מלמעלה.",
          icon: "🎉",
        },
      ],
      [
        {
          title: "ארבע מצוות פורים",
          source: 'הרמב"ם',
          text: "ארבע מצוות ייחודיות לפורים: מקרא מגילה, משלוח מנות, מתנות לאביונים, ומשתה ושמחה. שלוש מהן מכוונות כלפי אחרים – לתת, לשתף, לשמח. רק אחת כלפי עצמנו. פורים מלמד: השמחה שלמה רק כשהיא משותפת. 'ושלוח מנות איש לרעהו' – אחד לאחד.",
          icon: "🎁",
        },
        {
          title: "אסתר המלכה – כוח הנשמה הנסתרת",
          source: "הרב מרדכי אלון",
          text: "אסתר הסתירה את מוצאה בהוראת מרדכי. אך בשעת האמת, כשהסכנה גדלה, היא גילתה: 'אשר אני יהודייה'. הנסתר לא נעלם – הוא שמור עמוק בפנים. בפורים אנחנו לומדים: גם כשאנחנו נראים כחלק מהסביבה החיצונית – הזהות הפנימית שמורה וקיימת.",
          icon: "⭐",
        },
        {
          title: "הפיל גורל – בחירה אלוקית",
          source: "מגילת אסתר",
          text: "המן הפיל גורל ('פור') לבחור את יום ההשמדה. הוא חשב שהמזל מנהל הכל. אך הגורל שהפיל הפך לרעתו. זהו לקח פורים: מי שמאמין שהכל מקרה – טועה. מאחורי 'המקרה' עומדת השגחה אלוקית. לכן נקרא 'פורים' – על שם הגורל שנהפך.",
          icon: "🎲",
        },
      ],
    ],
    פסח: [
      [
        {
          title: "יציאת מצרים – לידה מחדש",
          source: 'הרמח"ל',
          text: "'מצרים' מלשון 'מצר' – צרות ומגבלות. יציאת מצרים אינה רק אירוע היסטורי – היא דרך חיים. 'בכל דור ודור חייב אדם לראות את עצמו כאילו יצא ממצרים'. בכל ליל הסדר אנחנו שוב יוצאים – מהמגבלות שלנו, מהפחדים שלנו, מהמצרים הפנימי שלנו.",
          icon: "🌊",
        },
        {
          title: "המצה – לחם החירות",
          source: "הגדה של פסח",
          text: "המצה נקראת 'לחם עוני' – לחם הצרות, וגם לחם החירות. אותה מצה, שני שמות הפוכים. זה סוד הגאולה: מתוך העוני הגדול ביותר יוצאת הגאולה הגדולה ביותר. 'ממעמקים קראתיך ה'' – ככל שהמקום עמוק יותר, כך הקריאה מגיעה גבוה יותר. חירות אמיתית נולדת מתוך הכבלים.",
          icon: "🍞",
        },
        {
          title: "ארבעת הבנים",
          source: "הבעל שם טוב",
          text: "אמר הבעל שם טוב: ארבעת הבנים אינם ארבעה ילדים שונים – הם ארבעה מצבים שכל אחד מאתנו עובר. יש בנו חכם, רשע, תם ושאינו יודע לשאול. הגדה מלמדת: ענה לכל בן – לכל חלק שבתוכך. גם לרשע שבתוכך – אל תכחיד אותו. הגאולה כוללת את כל חלקי הנפש.",
          icon: "📖",
        },
      ],
      [
        {
          title: "עשר מכות – שבירת גאוות פרעה",
          source: "הרב שמשון רפאל הירש",
          text: "עשר המכות לא באו רק לשחרר את ישראל – באו לשבור את האמונה המצרית שפרעה הוא אל. כל מכה כוונה לאל מצרי אחד. 'ובכל אלהי מצרים אעשה שפטים' – ה' הראה שאין עוד מלבדו. פסח הוא חג של הכרה: ה' הוא השולט בטבע, בהיסטוריה, בכל.",
          icon: "🌿",
        },
        {
          title: "ספר ההגדה – חובת הסיפור",
          source: "גמרא פסחים",
          text: "'מצווה לספר ביציאת מצרים'. לא רק לזכור – לספר. לא רק לדעת – לחוות. ההגדה בנויה כסיפור דרמטי: עבדים היינו, ועכשיו בני חורין. כל פסח מחדש אנחנו עוברים מעבדות לחירות, לא כסיפור של עבר אלא כחוויה של ההווה. 'כאילו הוא יצא'.",
          icon: "📜",
        },
        {
          title: "ארבע כוסות – כנגד ארבע לשונות גאולה",
          source: "ירושלמי פסחים",
          text: "ארבע כוסות של יין כנגד ארבע לשונות גאולה: 'והוצאתי, והצלתי, וגאלתי, ולקחתי'. כל כוס – שלב אחר בדרך לחירות. אין קפיצה לסוף. הגאולה היא תהליך: יציאה ממצב הרע, הצלה מהסכנה, גאולה ממהות העבדות, ולבסוף – לקיחה להיות עם ה'. כך גם בחיינו.",
          icon: "🍷",
        },
      ],
    ],
    "לג בעומר": [
      [
        {
          title: 'רשב"י והזוהר הקדוש',
          source: "הזוהר הקדוש",
          text: "ביום הסתלקותו גילה רבי שמעון בר יוחאי את סודות הקבלה לתלמידיו. אמר: 'בחיי לא נתתי לכם – במותי אני נותן לכם'. יום ל\"ג בעומר הוא היום שבו הפנימיות של התורה ירדה לעולם. מדורות האש שמדליקים מסמלים את אור האמת שאינו כבה לעולם.",
          icon: "🔥",
        },
        {
          title: "עצירת המגיפה – כוח האהבה",
          source: "המשנה ברורה",
          text: "תלמידי רבי עקיבא מתו בימי הספירה כי לא נהגו כבוד זה בזה. ביום ל\"ג בעומר פסקה המגיפה. מדוע בדיוק ביום הזה? כי ביום הזה התחילו לנהוג כבוד זה בזה. הלמידה הגדולה: לא הידע הוא העיקר – אלא היחס לאחר. 'ואהבת לרעך כמוך' – כלל גדול בתורה.",
          icon: "🕯️",
        },
      ],
      [
        {
          title: 'ל"ג בעומר – יום שמחה בספירה',
          source: 'הרמ"א',
          text: 'ימי הספירה הם ימי חצי אבל, אך ל"ג בעומר הוא הפסקה של שמחה. פוסקים רבים סוברים שכאן פסקה מגיפת תלמידי רבי עקיבא. לכן נוהגים שמחה, קשתות, יציאה לטבע. יש בזה מסר: גם בתוך תקופות קשות, יש מקום לנקודת אור, לנשימה של שמחה.',
          icon: "🌿",
        },
        {
          title: "רבי שמעון – גיבור הפנימיות",
          source: "מאמר הזוהר",
          text: "רבי שמעון בר יוחאי ותלמידיו הסתתרו במערה שנים עשר שנה ולמדו תורה. יצאו פעם אחת ושרפו בעיניהם כל מה שראו – חזרו למערה. יצאו שנית ויכלו לסבול את העולם. הלמידה: אחרי עומק הקדושה, האדם יכול לחיות בעולם ולהאיר אותו – לא לברוח ממנו.",
          icon: "🕯️",
        },
      ],
    ],
    "ראש חודש": [
      [
        {
          title: "חידוש הלבנה – חידוש הנשמה",
          source: "הבעל שם טוב",
          text: "הלבנה מתחדשת בכל חודש. היא פוחתת עד שנעלמת לגמרי – ואז מתחדשת. כך נשמת האדם. יש ימים שהאור בה כהה, שהיא מרגישה ריקה. אבל ראש חודש מלמד: זה לא סוף – זה תחילת חידוש. 'עתידים ישראל שיתחדשו כמותה' – הבטחת הנצח.",
          icon: "🌙",
        },
        {
          title: "ראש חודש – חג לנשים",
          source: "הפרי מגדים",
          text: "ראש חודש נקרא 'חג הנשים'. כשחטאו ישראל בעגל הזהב, הנשים לא נתנו תכשיטיהן. בשכר זה קיבלו את ראש חודש כחצי יום טוב. הנשים מייצגות את הקשר הפנימי לה', שאינו נשבר לעולם. ראש חודש הוא חידוש הקשר, חידוש האמונה.",
          icon: "✨",
        },
      ],
      [
        {
          title: "קידוש הלבנה – עדות לאמונה",
          source: "גמרא סנהדרין",
          text: "'מי שמברך על הלבנה בזמנה – כאילו מקבל פני שכינה'. קידוש לבנה הוא מצווה שנעשית בלילה, בחוץ, תחת שמי הלילה. האדם עומד מול השמים ומכריז: אני מאמין שיש מי שמנהל את העולם. הלבנה היא שעון הקדוש ברוך הוא – מחזורית, נאמנה, מדויקת.",
          icon: "🌙",
        },
        {
          title: "ראש חודש – ראש לחידוש",
          source: "הרב אברהם יצחק הכהן קוק",
          text: "אמר הרב קוק: הלבנה מסמלת את כנסת ישראל – שגם כשהיא בשפל, היא יודעת שתתחדש. העם היהודי חי לפי הלוח העברי, לפי הלבנה. בכל ראש חודש אנחנו חוגגים את הנצח של ישראל: 'לא יכחד שם ישראל' – כמו הלבנה שאף פעם לא נעלמת לצמיתות.",
          icon: "✡️",
        },
      ],
    ],
    שבת: [
      [
        {
          title: "השבת – מעין עולם הבא",
          source: 'הרמח"ל',
          text: "שבת היא 'מעין עולם הבא'. ששת ימי השבוע אנחנו עמלים ובונים. בשבת אנחנו שובתים ומקבלים נשמה יתרה. הנשמה היתרה של שבת היא טעם של שלמות, של שלווה, של 'ויכולו'. אדם שמכניס שבת כהלכתה – טועם בפה מה שלא ניתן לתאר במילים.",
          icon: "🕯️",
        },
      ],
      [
        {
          title: "שמור וזכור – שני עמודי השבת",
          source: "ספר החינוך",
          text: "בלוחות הראשונות נכתב 'זכור את יום השבת' ובשניות 'שמור את יום השבת'. 'זכור' – המצוות העשה, קידוש, הבדלה, שמחה. 'שמור' – המצוות לא תעשה, השביתה. שני הצדדים יחד יוצרים שלמות. לא רק להימנע מלאכה – אלא למלא את השבת בקדושה ושמחה פנימית.",
          icon: "🕯️",
        },
      ],
    ],
    "תשעה באב": [
      [
        {
          title: "חורבן הבית – מה חסר לנו",
          source: "הנצי\"ב מוולוז'ין",
          text: "הנצי\"ב אמר שבית המקדש נחרב בגלל שנאת חינם – שנאה בין יהודים שהיא 'חינם', ללא סיבה אמיתית. לכן הגאולה תבוא על ידי אהבת חינם. בתשעה באב אנחנו לא רק בוכים על מה שאבד – אנחנו שואלים: מה אני יכול לתקן ביחסי עם האחר?",
          icon: "🏛️",
        },
        {
          title: "קינות – שפת האבל",
          source: "ספר איכה",
          text: "'איכה ישבה בדד העיר רבתי עם'. ירמיהו הנביא בכה על חורבן ירושלים. הקינות שקוראים בתשעה באב הן שיר האבל של ישראל. אבל אמיתי אינו ייאוש – הוא הכרה שמשהו יקר אבד, ותשוקה לשיבה. 'שובנו ה' אליך ונשובה' – אחרי האבל בא הגעגוע לתיקון.",
          icon: "😢",
        },
      ],
      [
        {
          title: "לידת המשיח בתשעה באב",
          source: "גמרא ירושלמית",
          text: "מסורת ישראל: המשיח נולד בתשעה באב, ביום החורבן. מתוך האפלה הגדולה ביותר – נולד האור הגדול ביותר. בית המקדש נחרב, וביום אותו יום מונחת הגאולה. זהו סוד ישראל: אנחנו לא מסיימים באסון – אנחנו מתחילים ממנו. מן המצר קראתי – ואז: ענני במרחב יה.",
          icon: "🌅",
        },
        {
          title: "חמישה חורבנות ביום אחד",
          source: "משנה תענית",
          text: "חמישה דברים קרו לאבותינו בשבעה עשר בתמוז ובתשעה באב. חז\"ל אמרו: 'ייקבע יום זה לדורות'. מדוע לזכור? כי זכרון הכאב שומר אותנו מחזרה על הטעויות. כל דור שלומד מה גרם לחורבן – ומתקן את עצמו – הוא דור שמקרב את הגאולה.",
          icon: "📜",
        },
      ],
    ],
    "צום גדליה": [
      [
        {
          title: "מות גדליה – שרידי ישראל",
          source: "ספר מלכים ב' / ירמיהו",
          text: 'אחרי חורבן בית ראשון, נשאר גדליה בן אחיקם כנציג יהודי בארץ. הוא נרצח בידי יהודים אחרים. חז"ל קבעו צום כי מותו הוא כחורבן בית המקדש – כיוון שכיבה את האחרית שנשארה. הלמידה: שנאת אחים, גם אחרי חורבן, ממשיכה להחריב. אחדות ישראל היא עמוד חיינו.',
          icon: "🕯️",
        },
      ],
      [
        {
          title: "צום גדליה – אזהרה לדורות",
          source: 'הרמב"ם',
          text: "כתב הרמב\"ם שצום גדליה מלמד שאבדן נפשות ישראל חמור כאבדן בית המקדש. כשגדליה נהרג – גלו השאריות לגלות ונגמר כל שריד מיהודה. הצום הוא תזכורת שחיי אדם מישראל יקרים עד אין ערוך. 'כל המציל נפש אחת מישראל – מעלה עליו הכתוב כאילו קיים עולם מלא'.",
          icon: "💧",
        },
      ],
    ],
    "צום אסתר": [
      [
        {
          title: "תענית אסתר – עם שמתאחד בסכנה",
          source: "מגילת אסתר",
          text: "'לכי כנסי את כל היהודים... וצומו עלי'. אסתר ביקשה שכל העם יצום עבורה לפני שתכנס לפגוש את המלך. הצום המשותף הפך את העם לגוף אחד. כשישראל מאוחדים – הם חזקים. צום אסתר מלמד: תפילה ועמידה לשעת הסכנה – לא לבד, אלא כעם שלם.",
          icon: "👑",
        },
      ],
      [
        {
          title: "לפני הנס – ההכנה",
          source: "הרב שמשון רפאל הירש",
          text: "צום אסתר הוא הכנה לפורים. לפני השמחה הגדולה – יש רגע של כובד, של חשבון נפש, של תפילה. זה לימוד גדול: שמחה אמיתית אינה ניתנת לאדם שלא עמד מולה ברצינות. אסתר לא נכנסה למלך בקלות ראש – היא התכוננה. כך אנחנו: לפני שמחת פורים – כובד הצום.",
          icon: "✡️",
        },
      ],
    ],
    "שבעה עשר בתמוז": [
      [
        {
          title: "פרצה בחומה – תחילת הסוף",
          source: "משנה תענית",
          text: "בשבעה עשר בתמוז נפרצה חומת ירושלים בידי האויב. מאותו רגע החל הקץ – שלושה שבועות שהסתיימו בחורבן. הצום מציין את 'תחילת הסוף'. יש בזה לימוד: כשחומה נפרצת – גם רוחנית – צריך להזדרז ולתקן. הפרצה הקטנה היום היא החורבן הגדול של מחר.",
          icon: "🏛️",
        },
      ],
      [
        {
          title: "חמישה אסונות ביום אחד",
          source: "גמרא תענית",
          text: 'חמישה דברים קרו בי"ז בתמוז: נשתברו הלוחות, בוטל התמיד, הועמד צלם בהיכל, נשרפה תורה, נפרצה החומה. כל אחד מהם הוא פגיעה ברובד אחר: בתורה, בעבודה, בטוהר, בביטחון. כולם ביום אחד. הצום הוא הזמן להתבונן: באיזה רובד אנחנו זקוקים לתיקון?',
          icon: "📜",
        },
      ],
    ],
    "עשרה בטבת": [
      [
        {
          title: "תחילת המצור – ראשית הצרה",
          source: "מלכים ב' כה",
          text: "בעשרה בטבת החל נבוכדנצר מלך בבל את מצורו על ירושלים. זהו היום שבו הסיר את החירות מעל ירושלים לראשונה. החורבן לא בא ביום אחד – הוא התחיל בצעד קטן: מצור, בידוד, ניתוק. הצום מלמד: לשים לב לסימנים הראשונים של הסכנה, ולא לחכות עד שיהיה מאוחר.",
          icon: "❄️",
        },
      ],
      [
        {
          title: "יום קדיש כללי",
          source: "הרבנות הראשית לישראל",
          text: "הרבנות הראשית לישראל קבעה את עשרה בטבת כ'יום הקדיש הכללי' לקדושי השואה שאין יודעים את תאריך פטירתם. כך נקשר יום קדום של אבל לאסון המודרני הגדול ביותר. הצום הוא תזכורת: אנחנו עם שזוכר. הזכרון הוא חלק מהיותנו ישראל – 'זכור ואל תשכח'.",
          icon: "🕯️",
        },
      ],
    ],
  };

  var MONTH_DT = {
    תשרי: [
      {
        title: "תשרי – חודש המלכת ה'",
        source: "הרב קוק",
        text: "תשרי הוא החודש הכי עמוס במועדים: ראש השנה, יום כיפור, סוכות, שמיני עצרת. כולם סובבים סביב נושא אחד – מלכות ה'. בתשרי אנחנו מכתירים את הקדוש ברוך הוא כמלך, מתכפרים, ושמחים. חודש שלם של עבודת ה' מתוך אהבה ויראה.",
        icon: "🎺",
      },
      {
        title: "תשרי – ראש לחודשים",
        source: "בעל התניא",
        text: "אף שניסן נקרא 'ראש חודשים', תשרי הוא ראש השנה. תשרי הוא ראש הלב, ניסן הוא ראש הדעת. תשרי מסמל את שורש הקיום – הרצון לחיות ולהיות, להיות מחובר לה'. כל מה שמתחדש בשנה – שרשו בתשרי.",
        icon: "🌟",
      },
    ],
    חשון: [
      {
        title: "חשון – חודש ללא מועד",
        source: "מדרש",
        text: "חשון הוא החודש היחיד בשנה ללא שום חג או צום. יש מדרש שאומר: 'חשון חייב' ויקבל שכרו – כי בו ייבנה בית המקדש השלישי. החודש הריק הוא גם חודש של הכנה. אחרי הרעש של תשרי – חשון הוא שקט, חזרה לשגרה, ובינוי פנימי שקט.",
        icon: "🌧️",
      },
      {
        title: "חשון – חודש המים",
        source: 'חז"ל',
        text: "בחשון מתחילים לבקש גשמים בתפילה ('ותן טל ומטר לברכה'). המים מסמלים תורה – 'אין מים אלא תורה'. אחרי ההתעוררות הגדולה של תשרי, חשון הוא הזמן שבו הלמידה מתיישבת, כמו שמים חודרים לאדמה ומשקים אותה לאט לאט.",
        icon: "💧",
      },
    ],
    כסלו: [
      {
        title: "כסלו – אור בחשכה",
        source: "השפת אמת",
        text: "כסלו הוא חודש חנוכה – חודש שבו ימי החורף הקצרים ביותר, והחשכה הגדולה ביותר. ודווקא בו מדליקים נרות חנוכה. אור בחשכה חזק יותר מאור ביום. כסלו מלמד: דווקא כשהמצב קשה, כשהחשכה גדולה – זה הזמן להדליק, להאיר, להחזיק בטוב.",
        icon: "🕎",
      },
      {
        title: "חודש הגאולה",
        source: 'מנהג חב"ד',
        text: "בחסידות חב\"ד נקרא כסלו 'חודש הגאולה' – כי ב-י\"ט כסלו שוחרר אדמו\"ר הזקן מהכלא ברוסיה, ומסירת חסידות חב\"ד נמשכה. כל שנה חוגגים זאת ב'חג הגאולה'. כסלו מבשר: גם בתוך הגלות, יש רגעים של שחרור, של אור, של נצחון הנשמה על הגוף.",
        icon: "✨",
      },
    ],
    טבת: [
      {
        title: "טבת – חשכה ואור נסתר",
        source: "ספר יצירה",
        text: "טבת הוא החודש הקר ביותר, חשוך ביותר. עשרה בטבת – צום. ואף על פי כן, בתוך כסלו וטבת מאירים נרות חנוכה. הניגוד הזה הוא מסר עמוק: גם בשפל הרוחני, האור קיים. אל תחפש את ה' רק בהרים – מצא אותו גם בעמקים.",
        icon: "❄️",
      },
      {
        title: "טבת – חודש החזרה בתשובה",
        source: "הרב אברהם פאלאג'י",
        text: "טבת בא אחרי שמחת חנוכה. אחרי הנרות, החשכה חוזרת. כאן נבחן האדם: האם האור שקיבל בחנוכה נשאר איתו? טבת הוא חודש של עיבוד פנימי, של הפיכת הנרות החיצוניים לאור פנימי שאינו כבה גם כשהחורף ארוך.",
        icon: "🕯️",
      },
    ],
    שבט: [
      {
        title: "שבט – חודש ההתעוררות",
        source: "מנהג ישראל",
        text: 'ט"ו בשבט הוא ראש השנה לאילנות. בשבט האילנות מתחילים לינוק שוב מן הקרקע, אפילו שבחוץ עדיין חורף. הנשמה גם היא כך: לפעמים ההתחדשות מתחילה בפנים, הרבה לפני שהיא נראית מבחוץ. שבט מלמד: אמון בתהליכים שקטים שמתנהלים מתחת לפני השטח.',
        icon: "🌳",
      },
      {
        title: "פרי העץ – שמחת הטבע",
        source: "הרב קוק",
        text: "ט\"ו בשבט הוא יום שמחה על פירות הארץ. הרב קוק ראה בקדושת הטבע ביטוי לאלוקות. כל אילן, כל פרי – הוא יצירה אלוקית. בט\"ו בשבט אנחנו מכירים תודה לה' על הטבע. 'מלוא כל הארץ כבודו' – הכבוד מתגלה גם בפרח, גם בעץ, גם בפרי.",
        icon: "🍎",
      },
    ],
    אדר: [
      {
        title: "אדר – חודש השמחה",
        source: "גמרא תענית",
        text: "'משנכנס אדר מרבים בשמחה'. הגמרא אומרת: כשם שמשנכנס אב ממעטים בשמחה, כשנכנס אדר מרבים. אדר הוא ה'אנטי-אב'. בחודש שבו נגזר הכלייה על ישראל – ונהפך לנס – אנחנו חוגגים את היכולת האלוקית להפוך רע לטוב.",
        icon: "🎉",
      },
      {
        title: "מזל אדר",
        source: "בעל התניא",
        text: "מזל אדר הוא דגים. 'כדגים הרבים שאין עין הרע שולטת בהם'. כמו דגים שחיים מתחת לפני המים, מחוץ לראייה של עין הרע – כך ישראל בפורים ניצחו כי זכות מיוחדת הגנה עליהם. אדר מבשר: יש הגנה עליונה שמתגלה ברגע האמת.",
        icon: "🐟",
      },
    ],
    "אדר א": [
      {
        title: "אדר ראשון – שמחה מוכפלת",
        source: 'הרמ"א',
        text: "בשנת עיבור יש שני חודשי אדר. אמרו חז\"ל: 'מרבים שמחה בשני האדרים'. יש מחלוקת איזה אדר הוא הפורים האמיתי – הלכה שהוא אדר שני. אך אדר ראשון גם הוא זמן שמחה. 'אדר א' מלמד: כשיש הזדמנות שנייה – שמח בה לא פחות מהראשונה.",
        icon: "🎊",
      },
      {
        title: "שנת העיבור – הוספה לשלמות",
        source: "ספר הזוהר",
        text: "השנה המעוברת נוספת כדי לאזן בין הלוח הירחי לשמשי. השנה המעוברת היא שנה עמוקה יותר – שנה שבה יש זמן נוסף לתיקון ולעמקות. אדר ראשון הוא מתנה – חודש שלם נוסף של עבודה, של הכנה, של שמחה.",
        icon: "🌙",
      },
    ],
    "אדר ב": [
      {
        title: "אדר שני – עת הנס",
        source: "גמרא מגילה",
        text: "פורים חל באדר שני – הסמוך לניסן, חודש הגאולה. 'הסמך גאולה לגאולה' – נס פורים קרוב לנס יציאת מצרים. אדר שני הוא שיא שמחת אדר, הזמן שבו כל הפוטנציאל של חודש השמחה מתממש. 'ונהפוך הוא' – ההיפוך הגדול קורה כאן.",
        icon: "🎭",
      },
      {
        title: "גאולה בצינעה",
        source: 'הגר"א',
        text: "נס פורים הוא נס נסתר – שם ה' לא מוזכר במגילה. אדר שני מלמד: הגאולה לא תמיד באה בקולות ובברקים. לפעמים היא מתרחשת בשקט, בצינעה, ורק בסוף מבינים: 'כי לא בחזקה ולא בגבורה'. זהו עומק פורים – לזהות את יד ה' בתוך המציאות הטבעית.",
        icon: "✡️",
      },
    ],
    ניסן: [
      {
        title: "ניסן – ראש לחודשים",
        source: "שמות יב",
        text: "'החודש הזה לכם ראש חודשים, ראשון הוא לכם לחודשי השנה'. ניסן הוא ראש החודשים לפי מצות התורה. בניסן יצאנו ממצרים, בניסן נגאל. ניסן הוא חודש ה'ראשוניות' – של התחלות חדשות, של קפיצות אל הלא נודע, של בטחון שה' עמנו.",
        icon: "🌊",
      },
      {
        title: "ניסן – חודש האביב",
        source: "שמות יג",
        text: "נקרא גם 'חודש האביב'. בניסן הטבע מתחדש – הצמחים פורחים, האוויר מתחמם. חז\"ל ראו בחידוש הטבע בניסן רמז לגאולת ישראל. 'עורי צפון ובואי תימן' – רוחות האביב הן קול הגאולה. ניסן מלמד: חידוש תמיד אפשרי, אפילו אחרי חורף ארוך.",
        icon: "🌸",
      },
    ],
    אייר: [
      {
        title: "אייר – חודש הרפואה",
        source: 'חז"ל',
        text: "ראשי תיבות של 'אייר': א-נוכי י-הוה ר-ופאך. חודש אייר הוא חודש הרפואה. בו קיבלו ישראל את מצוות מרה, בו ירד המן. אייר הוא חודש של מעבר – בין פסח לשבועות, בין גאולה לקבלת תורה. מסע הספירה שבו הוא מסע ריפוי מידות.",
        icon: "💊",
      },
      {
        title: "ספירת העומר – מסע של 49 יום",
        source: 'הרמח"ל',
        text: "כל ימי אייר נמצאים בתוך ספירת העומר. ה-49 ימים הם תיקון שבע המידות. בכל שבוע עובדים על מידה אחרת: חסד, גבורה, תפארת, נצח, הוד, יסוד, מלכות. אייר הוא חודש של עבודה פנימית שקטה – להכין את עצמנו לקבלת תורה בשבועות.",
        icon: "✨",
      },
    ],
    סיון: [
      {
        title: "סיון – זמן מתן תורתנו",
        source: "שמות יט",
        text: "בסיון ניתנה תורה. 'בחודש השלישי לצאת בני ישראל מארץ מצרים, ביום הזה באו מדבר סיני'. סיון הוא חודש ה'שלישי' – שלוש אבות, שלוש כיתות (כוהנים לויים ישראלים), שלושה ימי הגבלה. הכל מתכנס לנקודה אחת: קבלת התורה.",
        icon: "📜",
      },
      {
        title: "סיון – חודש השמחה הרוחנית",
        source: "ספר החינוך",
        text: "שבועות בסיון הוא 'זמן מתן תורתנו'. שמחת סיון היא שמחה רוחנית – שמחת החכמה, שמחת הידיעה ש ה' בחר בנו ונתן לנו את תורתו. 'אשרינו מה טוב חלקנו' – חלקנו לדעת, ללמוד, לחיות לפי התורה.",
        icon: "🌿",
      },
    ],
    תמוז: [
      {
        title: "תמוז – חודש של עמידה במסה",
        source: 'רש"י',
        text: "בתמוז נשברו הלוחות, הוקם העגל הזהב. תמוז הוא חודש של ניסיון – כשמשה עיכב, ישראל לא החזיקו. אבל הנפילה של תמוז מלמדת: אל תיבנה את אמונתך רק על הנהגה חיצונית. הביטחון צריך להיות פנימי, עמוק, שאינו נשבר כשהמדריך נעלם.",
        icon: "☀️",
      },
      {
        title: "בין המצרים – שלושה שבועות",
        source: "ספר מלכים",
        text: "מי\"ז בתמוז עד ט' באב הם 'שלושת השבועות' – ימי אבל על חורבן הבית. תמוז נכנס לתקופה של ירידה. אך חז\"ל הבטיחו: 'כל המתאבל על ירושלים זוכה ורואה בשמחתה'. האבל של תמוז הוא הכנה לנחמה.",
        icon: "😢",
      },
    ],
    אב: [
      {
        title: "אב – מאבל לנחמה",
        source: "ישעיהו",
        text: "חודש אב מתחיל בשלושת השבועות ומגיע לשיאם בט' באב. אבל אחרי ט' באב מגיע שבת נחמו – 'נחמו נחמו עמי'. אב הוא חודש של קאתרזיס – שחרור הכאב, ואז פתיחה לנחמה. 'הצי לך מזרחה ומצפונה ומנגבה ותאכלי חיל גויים' – אחרי החורבן, הבטחת הגאולה.",
        icon: "😢",
      },
      {
        title: "חמישה עשר באב – חג האהבה",
        source: "גמרא תענית",
        text: "'לא היו ימים טובים לישראל כחמישה עשר באב'. ט\"ו באב – שבועות ספורות אחרי ט' באב – הוא חג האהבה. בנות ירושלים יצאו לכרמים. האופן שבו הכאב הגדול ביותר הופך לשמחה גדולה – תוך שבועות – מגלה את כוח ישראל: לצאת מהעמקים ולשמוח שוב.",
        icon: "💕",
      },
    ],
    אלול: [
      {
        title: "אלול – חודש התשובה",
        source: 'הרמב"ם',
        text: "'אני לדודי ודודי לי' – ראשי תיבות: א-ל-ו-ל. חודש אלול הוא חודש שבו ה' קרוב אלינו במיוחד. 'המלך בשדה' – הקדוש ברוך הוא יוצא לקראתנו. כל יום בחודש זה תוקעים בשופר כדי לעורר את הלבבות. אלול הוא חודש הרחמים והסליחות – הכנה לראש השנה.",
        icon: "🌙",
      },
      {
        title: "ארבעים יום של רצון",
        source: "שמות לד",
        text: "משה עלה שנית להר סיני בראש חודש אלול וירד ביום הכיפורים – ארבעים יום של רצון אלוקי לסליחה. מאז, ארבעים הימים שבין ראש חודש אלול לכיפור הם 'עת רצון'. בכל שנה חוזר חלון הזמן הזה. זה הזמן שבו התשובה 'קלה' יותר, שבו שערי שמים פתוחים לרווחה.",
        icon: "✨",
      },
    ],
  };

  var PARSHA_DT = {
    בראשית: [
      [
        {
          title: "בראשית – בשביל מי?",
          source: 'רש"י',
          text: "'בשביל התורה שנקראת ראשית ובשביל ישראל שנקראו ראשית'. רש\"י שואל: מדוע התורה מתחילה בבריאה ולא במצווה הראשונה? כדי שנדע שארץ ישראל שלנו, כי ה' ברא הכל ויכול לתת לכל מה שרצה. הבריאה כולה היא ביסוס זכותנו.",
          icon: "🌍",
        },
      ],
      [
        {
          title: "ויאמר אלוהים – כוח הדיבור",
          source: "הרב קוק",
          text: "'ויאמר אלוהים יהי אור' – העולם נברא בדיבור. גם לאדם הנברא בצלם אלוהים יש כוח דיבור יוצר. מילים יוצרות מציאות. לכן התורה מקפידה כל כך על לשון הרע, על שבועה שווא, על אמת. כל מילה שלנו היא יצירה – לטוב ולרע.",
          icon: "💬",
        },
      ],
    ],
    נח: [
      [
        {
          title: "נח איש צדיק",
          source: 'רש"י – גמרא סנהדרין',
          text: "'נח איש צדיק תמים היה בדורותיו' – רש\"י מביא שתי דעות: יש שאומרים 'בדורותיו' לשבח – שבדורו היה צדיק ובדור אברהם אף הוא היה נחשב. ויש שאומרים לגנאי. נח הוא אדם שניצל אך לא הציל. לאחר שיצא מהתיבה – שתה. הצדיקות חייבת להיות אקטיבית.",
          icon: "🕊️",
        },
      ],
      [
        {
          title: "קשת בענן – ברית עולם",
          source: "בראשית ט",
          text: "'את קשתי נתתי בענן' – ה' נתן קשת כסימן לברית שלא יהיה מבול שוב. הקשת מופיעה דווקא אחרי הסערה. היא נוצרת מחיבור השמש והגשם. כך גם בחיי האדם: אחרי הסערה הגדולה ביותר – מופיע הסימן שה' לא עזב. הברית נצחית.",
          icon: "🌈",
        },
      ],
    ],
    "לך לך": [
      [
        {
          title: "לך לך – צא מנחמת אזורך",
          source: "הבעל שם טוב",
          text: "'לך לך מארצך ומולדתך ומבית אביך'. ה' מצווה אברהם לצאת משלושה דברים: ארץ, מולדת, בית אב – שלושה עיגונים של הנוחות. הדרך הרוחנית מתחילה ביציאה. כל אחד מאתנו מקבל 'לך לך' – לצאת מהנוחות המוכרת אל ייעודו האמיתי.",
          icon: "🚶",
        },
      ],
      [
        {
          title: "אברהם אבינו – פורץ דרך",
          source: 'הרמב"ם',
          text: "אברהם הגיע לאמונה בה' בכוח עצמו, ללא מסורת, ללא הורים מאמינים. 'אברהם איש גדול' – גדולתו שגילה את ה' בתוך עולם שכחתו. כל אדם שמחפש אמת ולא מסתפק בנוחות הדת המוכרת – עוקב אחרי נתיב אברהם.",
          icon: "⭐",
        },
      ],
    ],
    וירא: [
      [
        {
          title: "הכנסת אורחים מעל הכל",
          source: "גמרא שבת",
          text: "'ה' נראה אליו' – ואברהם ישב בפתח האוהל. רש\"י: ביקר את החולה. גם כשהשכינה עמו – כשראה אברהם אורחים, עזב את השכינה לכבד אותם. 'גדולה הכנסת אורחים מקבלת פני שכינה'. לשרת אנשים בצרכיהם – זה עצמו קבלת פני שכינה.",
          icon: "🏕️",
        },
      ],
      [
        {
          title: "עקדת יצחק – מבחן הנכונות",
          source: 'הרמב"ן',
          text: "עקידת יצחק לא נועדה לשחוט – ה' לא רצה קורבן אדם. נועדה להוציא את פוטנציאל אברהם מכח לפועל. מה שהיה אפשרי – נעשה ממשי. 'עתה ידעתי כי ירא אלוהים אתה' – לא ידע קודם, כי עד שנבחן, הפוטנציאל נסתר. הנסיונות מגלים מי אנחנו.",
          icon: "🔥",
        },
      ],
    ],
    "חיי שרה": [
      [
        {
          title: "אחרי המוות – חיים ממשיכים",
          source: "השפת אמת",
          text: "הפרשה נקראת 'חיי שרה' אך מתחילה במותה. חייה של שרה ממשיכים אחרי מותה: דרך יצחק שמצא אשה, דרך האמונה שהשאירה. 'חיי שרה' הם החיים שהיא הותירה. אנחנו חיים בזכות מה שהורינו ואבותינו נטעו בנו.",
          icon: "🌹",
        },
      ],
      [
        {
          title: "ריבקה – הכרת טובה",
          source: "בראשית כד",
          text: "כשאליעזר ביקש סימן ל'הכרת הנבחרת', ריבקה הציעה מים לנסיכים, לאנשים, ולגמלים. אחד שמשקה גמלים – הרבה יותר ממה שנדרש ממנו – מגלה נפש נדיבה. הבחירה של ריבקה הייתה בגלל מידותיה, לא רק מוצאה. כך בכל בחירה חשובה בחיים.",
          icon: "💧",
        },
      ],
    ],
    תולדות: [
      [
        {
          title: "יעקב ועשו – שתי דרכים",
          source: 'הרמב"ן',
          text: "'שני גויים בבטנך' – שתי אומות, שתי גישות לחיים. עשו – האדמוני, הציד, חיי הרגע. יעקב – ישב אוהלים, חיי עומק. הבכורה שנמכרה: עשו מכר את עתידו בעד נזיד עדשים. כל אחד מאתנו בוחר: האם לחיות לרגע, או לבנות עתיד?",
          icon: "🏕️",
        },
      ],
      [
        {
          title: "'קול קול יעקב' – כוח ישראל",
          source: 'חז"ל',
          text: "'הקול קול יעקב' – כוחו של יעקב הוא בקול, בתפילה, בתורה. 'הידיים ידי עשו' – כוחו של עשו בידיים, בחרב. ישראל מנצחים כשהם נאמנים לקולם – לתורה, לתפילה. כשישראל מחקים את 'ידי עשו', הם מאבדים את מקור כוחם.",
          icon: "🎤",
        },
      ],
    ],
    ויצא: [
      [
        {
          title: "יעקב חולם – הסולם",
          source: "בעל התניא",
          text: "'סולם מוצב ארצה וראשו מגיע השמימה'. הסולם מסמל את הקשר בין שמים לארץ. כל מעשה של אדם – גם הגשמי ביותר – יכול להגיע לשמים. 'ומלאכי אלוהים עולים ויורדים' – המלאכים עולים תחילה: הם נבנים מהמעשים הארציים שלנו.",
          icon: "🪜",
        },
      ],
      [
        {
          title: "אהבת רחל – ויהיו בעיניו כימים אחדים",
          source: "בראשית כט",
          text: "'ויעבוד יעקב ברחל שבע שנים ויהיו בעיניו כימים אחדים באהבתו אותה'. שבע שנות עבודה כימים אחדים – כי האהבה מקצרת הכל. מה שנעשה מאהבה – לא נחשב לעמל. כשאנחנו עושים מה שאנחנו אוהבים ומאמינים בו – הזמן טס.",
          icon: "❤️",
        },
      ],
    ],
    וישלח: [
      [
        {
          title: "מאבק יעקב עם המלאך",
          source: "הזוהר הקדוש",
          text: "'ויאבק איש עמו עד עלות השחר'. יעקב נאבק כל הלילה ויצא ממנו פגוע אך ניצח. 'כי שרית עם אלוהים ועם אנשים ותוכל' – השם ישראל נולד מהנצחון הזה. המאבק הפנימי, הקשה, הלילי – הוא שיוצר את הזהות העמוקה ביותר.",
          icon: "⚔️",
        },
      ],
      [
        {
          title: "שלום עם עשו",
          source: 'רש"י – בראשית לג',
          text: "'וירץ עשו לקראתו ויחבקהו'. לאחר עשרים שנה של פחד, יעקב ועשו מתפייסים. יעקב שלח מנחה גדולה לפני המפגש. 'כבוד הבריות דוחה לא תעשה'. גם עם מי שאנחנו חוששים ממנו – ניתן לבנות שלום. כבוד כלפי האחר פותח דלתות.",
          icon: "🤝",
        },
      ],
    ],
    וישב: [
      [
        {
          title: "יוסף וחלומותיו",
          source: 'הרמב"ם',
          text: "יוסף חלם חלומות ושיתף – ואחיו שנאוהו. לפעמים הנבואה מוקדמת לזמנה, ויש שאינם יכולים לשאת אותה. יוסף הצדיק לא הפסיק לחלום גם בבור, גם בבית האסורים. הצדיק שומר על חזונו גם כשהמציאות סותרת אותו.",
          icon: "⭐",
        },
      ],
      [
        {
          title: "מבור לאסרים – ה' עם יוסף",
          source: "בראשית לט",
          text: "'ויהי ה' את יוסף' – שלוש פעמים הפסוק חוזר על כך. בבית פוטיפר, בבית הסוהר – 'ה' עמו'. ההצלחה החיצונית לא הייתה ביד יוסף, אבל הנוכחות האלוקית תמיד הייתה. הצדיק שנמצא ב'בור' – לא לבד. ה' שם.",
          icon: "🌟",
        },
      ],
    ],
    מקץ: [
      [
        {
          title: "מגדול ופרעה – מהצינוק לשלטון",
          source: "בראשית מא",
          text: "תוך יום אחד עלה יוסף מהכלא לביצוע פרעה. 'אין נבון וחכם כמוך'. הגאולה יכולה לבוא מהר מאוד. 'ברגע אחד' כתב רב יהודה. מי שמתאמץ ומכין את עצמו – ברגע שה' פותח את הדלת, הוא מוכן לכניסה.",
          icon: "👑",
        },
      ],
      [
        {
          title: "הקץ – 'קץ שם לחושך'",
          source: "איוב כח",
          text: "'מקץ שנתיים ימים' – אחרי שנתיים בכלא, מגיע הסוף לחושך. שם הפרשה 'מקץ' – הקץ לסבל. ה' קובע קץ לכל צרה. 'זכרוני נא' – יוסף ביקש שישכחוהו אך ה' לא שכח. מי שסובל ועמד באמונתו – בא הקץ לסבלו.",
          icon: "⏰",
        },
      ],
    ],
    ויגש: [
      [
        {
          title: "ויגש אליו יהודה",
          source: 'רש"י – בראשית מד',
          text: "'ויגש אליו יהודה' – יהודה לא ביקש, לא התחנן. הוא ניגש עם עמדה. הגישה היא צורת עמידה: לא כנועה, לא תוקפנית – אלא ישירה ואחראית. יהודה נכשל בתחילה (יוסף ותמר) ועכשיו מתקן. הוא מציע את עצמו תמורת בנימין – נפש תחת נפש.",
          icon: "💪",
        },
      ],
      [
        {
          title: "גילוי יוסף – מחילה שלמה",
          source: "בראשית מה",
          text: "'אני יוסף אחיכם' – ויהודה לא יכל לענות כי נבהלו. רש\"י: אוי לנו מיום הדין. כשיוסף נגלה – האחים בושו. אך יוסף אמר: 'ועתה אל תעצבו ואל יחר בעיניכם'. המחילה האמיתית כוללת שחרור האחר מבושתו. 'כי למחיה שלחני אלוהים'.",
          icon: "🤗",
        },
      ],
    ],
    ויחי: [
      [
        {
          title: "ברכת יעקב – מורשת לדורות",
          source: "בראשית מט",
          text: "לפני מותו בירך יעקב את בניו – כל אחד בברכה ייחודית. הוא ראה את הטוב שבכל אחד, גם אם היה בו גם פגם. כך כל הורה: הברכה הגדולה היא לראות את ייחוד ילדך ולאמץ אותו. 'ויברך אותם, איש אשר כברכתו ברך אותם'.",
          icon: "✋",
        },
      ],
      [
        {
          title: "ויחי יעקב – חיים שממשיכים",
          source: "גמרא תענית",
          text: "'ויחי יעקב' – 'יעקב אבינו לא מת'. פרשה זו 'סתומה' – אין רווח לפניה. מדוע? כי עם מות יעקב – גלה ישראל. אך יעקב לא מת באמת – הוא חי בתוך בניו, בתורתו, בזרעו. כך כל אדם גדול: רוחו ממשיכה לחיות בתוך אלה שחינך.",
          icon: "🌟",
        },
      ],
    ],
    שמות: [
      [
        {
          title: "שם – הזהות ששומרת",
          source: "מדרש שמות",
          text: "'ואלה שמות בני ישראל'. חז\"ל אמרו: ישראל לא שינו את שמותיהם במצרים. בתוך הגלות הקשה – שמרו על שמותיהם, לשונם, מלבושם. הזהות ששמרו – היא שהצילה אותם. 'כשם שנכנסו, כך יצאו'. לשמר את השם שלך – לשמר את עצמך.",
          icon: "📜",
        },
      ],
      [
        {
          title: "משה – גדול ממשפחה שקטה",
          source: "שמות ב",
          text: "משה גדל בבית פרעה – אך לא שכח שהוא עברי. 'ויגדל משה ויצא אל אחיו וירא בסבלותם'. הוא ראה, הוא השגיח. גדולתו של משה לא בשכלו או בכוחו בלבד – אלא בכך שלא התעלם מסבל אחרים. הנהגה מתחילה בראייה.",
          icon: "👁️",
        },
      ],
    ],
    וארא: [
      [
        {
          title: "שש עשר שמות ה'",
          source: "שמות ו",
          text: "'וארא אל אברהם אל יצחק ואל יעקב באל שדי ושמי ה' לא נודעתי להם'. לאבות נגלה ה' בשם אחד; למשה – בשם ה', שם הנצחיות. כל דור מגלה פן חדש של אלוקות. כל אחד מאתנו פוגש את ה' בצורה שמתאימה לו ולדורו.",
          icon: "✨",
        },
      ],
      [
        {
          title: "עשר המכות – שבירת אמונת המצרים",
          source: "הרב שמשון רפאל הירש",
          text: "כל מכה כוונה לאל מצרי ספציפי: הנילוס, הצפרדעים, השמש. ה' הוכיח שאלוהי מצרים אינם אלוהים – רק הוא הוא. הלמידה: לפעמים צריך להפריך עבודה זרה לפני שאפשר לקבל אמת. פינוי השקר הוא ההכנה לאמת.",
          icon: "🌿",
        },
      ],
    ],
    בא: [
      [
        {
          title: "קידוש הזמן – מצווה ראשונה",
          source: "שמות יב",
          text: "'החודש הזה לכם ראש חודשים' – מצווה ראשונה שנצטוו ישראל כעם. לא מצווה מוסרית, אלא קידוש הזמן. ישראל מקדשים זמן לפני שמקדשים מקום. הזמן קודם למרחב. כל ימי חייך – כל רגע – ניתן לקדש. זה הלמידה הראשונה של חירות.",
          icon: "📅",
        },
      ],
      [
        {
          title: "קרבן פסח – ביטול האל המצרי",
          source: "שמות יב",
          text: "'ושחטו את הפסח' – הכבש היה אל מצרי. ישראל נצטוו לשחוט אותו ולמרוח דמו על המשקוף. זה לא רק מצווה – זה הצהרה: אנחנו לא מפחדים מאלוהיכם. השחיטה בגלוי נדרשה בגלל האמירה החזקה שהיא מבטאת: יש רק אלוהים אחד.",
          icon: "🌙",
        },
      ],
    ],
    בשלח: [
      [
        {
          title: "שירת הים – שיר הנשמה",
          source: "מכילתא",
          text: "אחרי קריעת ים סוף – ישראל שרו שירה. 'אז ישיר משה' – אז: כשראו את הנס לגמרי. שירה נולדת ממלאות. לא מדברים שירה – שרים אותה. כשהאדם רואה את גדולת ה' בחייו – הוא פורץ בשירה. 'אשירה לה' כי גאה גאה'.",
          icon: "🎵",
        },
      ],
      [
        {
          title: "מן – לחם מן השמים",
          source: "שמות טז",
          text: "'הנני ממטיר לכם לחם מן השמים'. המן ירד כל יום מחדש. לא ניתן לשמור ליום המחרת. ה' לא רצה שנאגור – רצה שנסמוך עליו יום יום. הביטחון האמיתי: לא לדאוג למחר, אלא לבטוח שמה שנצטרך – יהיה. 'כיום הזה' – כל יום חדש.",
          icon: "🍞",
        },
      ],
    ],
    יתרו: [
      [
        {
          title: "מעמד הר סיני",
          source: "שמות יט",
          text: "'ויחרד כל ההר מאוד' – ה' ירד על ההר. 600,000 נשמות עמדו שם, ולפי חז\"ל גם כל נשמות ישראל לדורות. 'לא עם אלה בלבד אנוכי כורת את הברית' – כל אחד מאתנו היה בהר סיני. הברית אינה עניין היסטורי בלבד – היא ברית אישית שכל אחד מאתנו חלק ממנה.",
          icon: "⛰️",
        },
      ],
      [
        {
          title: "כבד את אביך ואמך",
          source: "עשרת הדיברות",
          text: "בין מצוות 'בין אדם למקום' לבין מצוות 'בין אדם לחברו' עומד 'כבד אביך ואמך'. ההורים הם הגשר: דרכם קיבלנו את החיים, את הערכים, את הזהות. לכבד הורים הוא לכבד את שרשרת הדורות – את כל מי שעמד לפנינו כדי שנוכל לעמוד.",
          icon: "👪",
        },
      ],
    ],
    משפטים: [
      [
        {
          title: "וספר הברית",
          source: "שמות כד",
          text: "'ויכתוב משה את כל דברי ה'' – אחרי מעמד הר סיני, הדברים נכתבו. הכתיבה מחייבת. המחויבות לא נשארת בלב בלבד – היא מוצאת ביטוי ממשי, ניתנת לקריאה, לחינוך, להעברה. 'ויאמרו כל אשר דיבר ה' נעשה ונשמע'.",
          icon: "📜",
        },
      ],
      [
        {
          title: "עין תחת עין – משפט אמיתי",
          source: 'הרמב"ם',
          text: "'עין תחת עין' – לא פשוטו כמשמעו. חז\"ל פירשו: תשלום ממוני. הצדק אינו נקמה – הוא השבת המשוות. פגעת בי כלכלית – שלם. פגעת בי גופנית – שלם. המשפט העברי לא מחפש סבל – מחפש תיקון.",
          icon: "⚖️",
        },
      ],
    ],
    תרומה: [
      [
        {
          title: "ועשו לי מקדש",
          source: "שמות כה",
          text: "'ועשו לי מקדש ושכנתי בתוכם' – לא 'בתוכו' אלא 'בתוכם'. ה' לא שוכן בבניין – הוא שוכן בתוך כל אחד מאתנו. המשכן הוא מודל – לנו ללמוד כיצד לעשות את עצמנו 'דירה לה''. כל אחד יכול להפוך את לבו למקדש פנימי.",
          icon: "🏛️",
        },
      ],
      [
        {
          title: "נדבת הלב",
          source: "שמות כה",
          text: "'מאת כל איש אשר ידבנו לבו תקחו את תרומתי'. התרומה לא הייתה חובה – הייתה נדבת לב. כשאנחנו נותנים מרצון, מאהבה, בלי חובה – הנתינה שלמה אחרת. 'כפרה בנדבה' – נדבה מכפרת כי היא מבטאת את הפנימיות.",
          icon: "❤️",
        },
      ],
    ],
    תצוה: [
      [
        {
          title: "בגדי הכהן – לכבוד ולתפארת",
          source: "שמות כח",
          text: "'ועשית בגדי קודש לאהרן אחיך לכבוד ולתפארת'. הכהן לובש בגדים מיוחדים לא כדי להתגאות – אלא כדי לייצג. הבגד הוא ממשק בין האדם הפנימי לעולם החיצוני. גם בחיי יום יום: מה שלובשים, כיצד מציגים את עצמנו – זה חלק מהקדושה.",
          icon: "👘",
        },
      ],
      [
        {
          title: "נר תמיד – אור שאינו כבה",
          source: "שמות כז",
          text: "'להעלות נר תמיד' – בבית המקדש הנר לא כבה לעולם. כנגד כל חשכה – אור. כנגד כל ספק – אמונה. 'נר תמיד' הוא לא רק פיזי – הוא מסמל שישנו עיקר שאינו נכבה. האמונה הפנימית של ישראל היא נר שלא יכבה.",
          icon: "🕯️",
        },
      ],
    ],
    "כי תשא": [
      [
        {
          title: "חטא העגל – הנפילה הגדולה",
          source: "שמות לב",
          text: "'וירא העם כי בשש משה לרדת' – עיכוב של שש שעות הוביל לחטא הגדול ביותר. ישראל לא יכלו לחכות. הנסיון הגדול ביותר הוא לפעמים הסבלנות. המתנה לה', למנהיג, לתשובה – זה דורש כוח רצון גדול מהנפילה המיידית.",
          icon: "🐂",
        },
      ],
      [
        {
          title: "משה מבקש לראות את ה'",
          source: "שמות לג",
          text: "'הראני נא את כבודך' – אחרי חטא העגל, משה מבקש חיבור עמוק לה'. 'לא תוכל לראות את פני' – אבל 'וראית את אחורי'. ה' מסביר: האדם רואה את ה' מאחור – בדיעבד, בהיסטוריה. רק לאחר שהמאורע עבר, רואים כיצד ה' היה שם.",
          icon: "✨",
        },
      ],
    ],
    ויקהל: [
      [
        {
          title: "שבת לפני המשכן",
          source: "שמות לה",
          text: "לפני ציווי בניין המשכן – משה מזכיר את השבת. ה' מלמד: גם בנין הקודש אינו דוחה שבת. 'אל יצא איש ממקומו'. השבת היא גדולה מהמשכן. העיקרון: גם המצווה הגדולה ביותר מוגבלת ע\"י ערכים עליונים. אין 'מטרה מקדשת אמצעים'.",
          icon: "🕯️",
        },
      ],
      [
        {
          title: "נדבת הנשים",
          source: "שמות לה",
          text: "'ויבואו האנשים על הנשים, כל נדיב לב' – גברים ונשים יחד תרמו למשכן. הנשים הביאו ראי נחושת שתרמו לכיור. הדבר שאנחנו מחשיבים כחיצוני – הראי – הופך לחלק מהקדושה. כל מה שבנינו בחיינו, כולל הגשמי, יכול להיות תרומה לשכינה.",
          icon: "🪞",
        },
      ],
    ],
    פקודי: [
      [
        {
          title: "ויכל משה את המלאכה",
          source: "שמות מ",
          text: "'ויכל משה את המלאכה' – ו'וימלא הכבוד את המשכן'. כשמשה סיים – השכינה ירדה. מסר: עשה את שלך עד הסוף. אל תחשוב שה' יסיים את מה שאתה לא סיימת. 'כלה מלאכתך ואחר כך בקש ממנו ברכה'. הסיום של האדם פותח את הברכה האלוקית.",
          icon: "🏛️",
        },
      ],
      [
        {
          title: "כאשר צוה ה' את משה",
          source: "שמות לח-מ",
          text: "חמישה עשר פעמים בפרשה חוזרת הביטוי 'כאשר צוה ה' את משה'. כל חלק נבנה בדיוק לפי הציווי. הצייתנות הזו אינה עבדות – היא שלמות. כשכל חלק תואם לתכנון האלוקי – הכל מתאחד ליצירה שלמה. הדיוק יוצר קדושה.",
          icon: "✅",
        },
      ],
    ],
    ויקרא: [
      [
        {
          title: "ויקרא – הקריאה האלוקית",
          source: "ויקרא א",
          text: "'ויקרא אל משה וידבר ה' אליו'. 'ויקרא' – בקריאה, לא רק בדיבור. ה' לא רק מדבר אל משה – הוא קורא לו. יש הבדל: דיבור הוא מידע, קריאה היא זימון. ה' מזמן כל אחד מאתנו לתפקיד מיוחד. הלמידה: כדאי לשאול – לאיזה תפקיד ה' קורא לי?",
          icon: "📢",
        },
      ],
      [
        {
          title: "קרבן – קירוב",
          source: 'הרמב"ן',
          text: "'קרבן' מלשון 'קרוב'. הקרבן אינו מזון לה' – הוא דרך להתקרב. בזמן שהביאו קרבן, האדם נתן מן הבהמה שבתוכו. 'האיש הוא השור', פירש הרמב\"ן. הקרבן הוא סמל לוויתור על האנוכיות.",
          icon: "🔥",
        },
      ],
    ],
    צו: [
      [
        {
          title: "אש תמיד תוקד",
          source: "ויקרא ו",
          text: "'אש תמיד תוקד על המזבח, לא תכבה'. הכהן היה אחראי לשמור על האש שתבער. כך בחיי הרוח: האש הפנימית – ההתלהבות, האמונה, האהבה לה' – אינה נשמרת מעצמה. יש להוסיף עצים בכל יום. 'לא תכבה' – זו מצווה אקטיבית.",
          icon: "🔥",
        },
      ],
      [
        {
          title: "כהן שעובד – כהן שלומד",
          source: "ויקרא ז",
          text: "הכהן לא רק מקריב – הוא גם לומד ומלמד. 'כי שפתי כהן ישמרו דעת ותורה יבקשו מפיהו'. הדמות הדתית שמנהיגה את העם חייבת להיות גם חכמה. מנהיג שרק מבצע – לא מדריך. מנהיג שגם לומד וחושב – הוא שמוביל.",
          icon: "📚",
        },
      ],
    ],
    שמיני: [
      [
        {
          title: "יום השמיני – יום ייחודי",
          source: "ויקרא ט",
          text: "'ויהי ביום השמיני' – שמיני ימי המילואים, היום הראשון לעבודת המשכן. שבעה ימים הם המחזור הטבעי. השמיני הוא מעבר לטבע – קדושה עליונה. 'שמיני עצרת' גם הוא שמיני, יום ייחודי. המספר שמונה מסמל בקבלה את הנצח שמעל לטבע.",
          icon: "8️⃣",
        },
      ],
      [
        {
          title: "מות נדב ואביהו – אש זרה",
          source: "ויקרא י",
          text: "'ויקריבו אש זרה אשר לא ציוה אותם'. נדב ואביהו קרבו מה שלא נצטוו. הם אהבו את ה' – אך לא הסתפקו בגבולות שנקבעו. הלמידה: גם בקדושה ובאהבה – יש גבולות. הרצון הפרטי, אפילו מתוך מסירות, אינו יכול לדחות את הציווי.",
          icon: "🔥",
        },
      ],
    ],
    תזריע: [
      [
        {
          title: "לידה וטהרה",
          source: "ויקרא יב",
          text: "לאחר לידה, האשה טמאה לימים מסוימים. 'טומאה' בתורה אינה לכלוך – היא מצב של עוצמה גבוהה מדי לקדושת המקדש. כוח הלידה – יצירת חיים – הוא עוצמה אדירה. אחרי מגע עם עוצמה כזו, האדם צריך תהליך של 'התכוונות מחדש' לפני כניסה לקדש.",
          icon: "👶",
        },
      ],
      [
        {
          title: "צרעת – מחלת הנפש",
          source: 'חז"ל – מסכת ערכין',
          text: "חז\"ל אמרו שצרעת באה בעיקר על לשון הרע. הגוף מתנגד לרע שיצא מהפה. 'ויצעק העם ויצא מחוץ למחנה' – המצורע יושב לבד. הבדידות מאפשרת לו להכיר בנזק שגרם. לשון הרע פוגע בחיבור בין אנשים – הפרידה היא תיקון.",
          icon: "🔇",
        },
      ],
    ],
    מצורע: [
      [
        {
          title: "טהרת המצורע – חזרה",
          source: "ויקרא יד",
          text: "טהרת המצורע היא תהליך ארוך ומפורט. שתי ציפורים, ארז, שני, אזוב. הציפור השחוטה כנגד הלשון שגרמה נזק. הציפור המשוחררת – כנגד דיבור חדש, חופשי וטהור. כשאדם חוזר בתשובה מלשון הרע – הוא משתחרר כציפור מן הכלוב.",
          icon: "🐦",
        },
      ],
      [
        {
          title: "נגע הבית – שיקוף של הנפש",
          source: 'רמב"ן',
          text: "נגע שבא על הבית מביא לבדיקה ולהריסה אם לא מרפא. הרמב\"ן: 'זו מדה כנגד מדה'. הבית הוא ביטוי של בעליו. כשהאדם רקוב מבפנים – זה מתגלה גם בחיצוני. תיקון הפנימי מרפא גם החיצוני.",
          icon: "🏠",
        },
      ],
    ],
    "אחרי מות": [
      [
        {
          title: "עבודת יום הכיפורים",
          source: "ויקרא טז",
          text: "'בזאת יבוא אהרן אל הקודש' – 'בזאת', לא בדרך אחרת. יש סדר מדויק לעבודת כהן גדול ביום כיפור. מה שנראה כפורמליזם הוא לאמת הכנסת המחשבה לסדר. הטקס מסדר את הפנימיות. כשאנחנו עושים דברים בסדר – גם לבנו מסתדר.",
          icon: "🏛️",
        },
      ],
      [
        {
          title: "ואהבת לרעך כמוך",
          source: "ויקרא יח-יט",
          text: "פרשת אחרי מות מסתיימת בפרשת קדושים. קדושת ישראל מבוססת על מוסר. לא רק 'לא תגנוב', לא רק 'לא תרצח' – אלא 'ואהבת לרעך כמוך'. רבי עקיבא: כלל גדול בתורה. הקדושה האמיתית באה לידי ביטוי ביחס לאחר.",
          icon: "❤️",
        },
      ],
    ],
    קדושים: [
      [
        {
          title: "קדושים תהיו",
          source: "ויקרא יט",
          text: "'קדושים תהיו כי קדוש אני ה' אלוהיכם'. הפקודה להיות קדושים היא תמוהה – האם ניתן לצוות על קדושה? אמר הרמב\"ן: 'קדש עצמך במותר לך'. גם מה שמותר – יש להשתמש בו בצניעות. הקדושה היא מידה של ריסון עצמי מתוך אהבה.",
          icon: "✨",
        },
      ],
      [
        {
          title: "מפני שיבה תקום",
          source: "ויקרא יט",
          text: "'מפני שיבה תקום' – לקום לפני זקן. כבוד הזיקנה אינו רק נימוס – הוא הכרת ערכה של ניסיון. הזקן הביא את עצמו עד לגיל הזה – הוא ראה, חווה, ולמד. לכבד אותו הוא ללמוד מחייו. 'שאל אביך ויגדך, זקניך ויאמרו לך'.",
          icon: "👴",
        },
      ],
    ],
    אמור: [
      [
        {
          title: "מועדי ה'",
          source: "ויקרא כג",
          text: "פרשת אמור כוללת את רשימת המועדות. 'אלה מועדי ה' מקראי קודש אשר תקראו אותם במועדם'. המועדים אינם חגים לאומיים בלבד – הם 'מועדי ה''. פגישות שה' קובע. בכל חג, ה' מחכה לנו. אנחנו קובעים את הזמן – ה' ממלא אותו בנוכחות.",
          icon: "📅",
        },
      ],
      [
        {
          title: "כי קציר הוא – לא תכלה",
          source: "ויקרא כג",
          text: "'ובקוצרכם את קציר ארצכם, לא תכלה פאת שדך לקצור... לעני ולגר תעזוב אותם'. ממש בתוך תיאור המועדות, מוכנסת מצווה חברתית. הקשר: שמחת החג אינה שלמה בלי שיתוף. לא ניתן לחגוג בעושר בזמן שהסביבה עוני. הזיכרון לדאוג לאחר הוא חלק מהקדושה.",
          icon: "🌾",
        },
      ],
    ],
    בהר: [
      [
        {
          title: "שמיטה – שבת לאדמה",
          source: "ויקרא כה",
          text: "'כי תבואו אל הארץ... ושבתה הארץ שבת לה''. הארץ גם צריכה שבת. בשנה השביעית – לא עובדים, לא קוצרים למכירה, הכל הפקר. הקדוש ברוך הוא אומר: הארץ שלי, לא שלכם. הטעמת הנתינה לה' – כשמניחים לאדמה לנוח, מכירים בכך שהכל מה'.",
          icon: "🌿",
        },
      ],
      [
        {
          title: "יובל – שחרור מוחלט",
          source: "ויקרא כה",
          text: "כל חמישים שנה – שנת יובל. עבדים משתחררים, קרקעות חוזרות לבעליהן המקוריים. יובל מבטל עצמה את כל העיוותים הכלכליים שנצטברו. זהו 'reset' חברתי. הרעיון: אין עוני נצחי, אין עשירות נצחית. ה' שומר על שוויון בסיסי.",
          icon: "🔔",
        },
      ],
    ],
    בחקותי: [
      [
        {
          title: "אם בחקותי תלכו",
          source: "ויקרא כו",
          text: "'אם בחקותי תלכו ואת מצוותי תשמרו' – ואז: גשמים בעתם, פרי האדמה, שלום בארץ. 'בחקותי' – בחוקים, גם אלה שאינם מובנים. ה' מבקש אמון: לא להבין הכל, אלא ללכת. ה'הליכה' עצמה – בלי שאלות – מביאה את הברכה.",
          icon: "🌧️",
        },
      ],
      [
        {
          title: "אם לא תשמעו – הנבואה לא פסימיסטית",
          source: "הרב קוק",
          text: "פרשת 'תוכחה' נראית קשה. אבל היא מסתיימת: 'ואף גם זאת... לא מאסתים ולא גיחלתים לכלותם'. גם אחרי כל הצרות – ה' לא עוזב. הברית נצחית. התוכחה היא לא עונש – היא אזהרה מאב. ואהבת האב אינה מסתיימת לעולם.",
          icon: "❤️",
        },
      ],
    ],
    במדבר: [
      [
        {
          title: "מנין ישראל – כל אחד נחשב",
          source: "במדבר א",
          text: "'שאו את ראש כל עדת בני ישראל' – לספור כל אחד. חז\"ל: 'מרוב חיבתם לפניו מונה אותם תמיד'. כשסופרים כל אחד – אומרים שכל אחד חשוב. אין ישראל גוש אנונימי – כל נשמה ספורה ונזכרת. 'אף על פי שחטא, ישראל הוא'.",
          icon: "🔢",
        },
      ],
      [
        {
          title: "ארבעת המחנות – סדר בתנועה",
          source: "במדבר ב",
          text: "ישראל חנו במדבר לפי סדר: כל שבט בדגלו, כל מחנה בכיוונו. 'כדגלו' – לכל שבט דגל, זהות. גם בתנועה – יש סדר. גם כשנוסעים ממקום למקום – השייכות לשבט, למשפחה, לזהות – נשמרת. הסדר הוא שומר הזהות.",
          icon: "🏕️",
        },
      ],
    ],
    נשא: [
      [
        {
          title: "ברכת כוהנים – שלושה שלבים",
          source: "במדבר ו",
          text: "'יברכך ה' וישמרך. יאר ה' פניו אליך ויחונך. ישא ה' פניו אליך וישם לך שלום'. שלושה פסוקים: הגנה, אהבה, שלום. ה'שלום' האמיתי בא בסוף, כשמרגישים שה' פונה אלינו. השלום אינו רק היעדר מלחמה – הוא מלאות, שלמות.",
          icon: "🙏",
        },
      ],
      [
        {
          title: "סוטה – קנאת הבעל",
          source: "במדבר ה",
          text: "פרשת סוטה, בין ברכת כוהנים לנדרי הנזיר, נראית לא במקומה. אבל יש קשר: שלושתם עוסקים ביחסים – בין אדם לה', בין בני זוג, בין האדם לעצמו. האמון הוא ערך מרכזי. כשמשהו נשבר – ה' מרפא. ה' עצמו גרם למחיקת שמו כדי לשים שלום.",
          icon: "⚖️",
        },
      ],
    ],
    בהעלותך: [
      [
        {
          title: "בהעלותך את הנרות",
          source: "במדבר ח",
          text: "'בהעלותך את הנרות' – האיר לפני המנורה. אהרן לא עבד מכנית – הוא 'העלה' את הנרות, בנשמה. הרמב\"ן: 'להדליק שיהיה הלהב עולה מאליו'. מנהיג טוב לא רק מפעיל – הוא מדליק, ממריץ, מחיה. הדלקת הנרות היא אמנות ההנהגה.",
          icon: "🕯️",
        },
      ],
      [
        {
          title: "אספה שבעים זקנים",
          source: "במדבר יא",
          text: "'אספה לי שבעים איש מזקני ישראל'. ה' מצווה על ייסוד מוסד: סנהדרין. ההנהגה אינה יכולה להיות יחידה – היא צריכה להישען על קולקטיב של חכמה. 'ונשאו אתך במשא העם ולא תישא אתה לבדך'. הנהגה שיתופית היא בריאות לאומית.",
          icon: "👨‍⚖️",
        },
      ],
    ],
    שלח: [
      [
        {
          title: "המרגלים – פחד הגדולה",
          source: "במדבר יג",
          text: "המרגלים ראו את הארץ הטובה – ובכל זאת אמרו 'לא נוכל'. הם ראו את הענקים ואמרו: 'ונהי בעינינו כחגבים'. הבעיה לא הייתה במציאות – הייתה בתפיסה העצמית. כשאדם רואה את עצמו כחגב – הוא פועל כחגב. כלב ויהושע ראו אותו דבר ובטחו בה'.",
          icon: "🕵️",
        },
      ],
      [
        {
          title: "חלה – ראשית לה'",
          source: "במדבר טו",
          text: "'מראשית עריסותיכם תרימו חלה תרומה'. מהלחם הראשון – תנו לה'. הקדמת ה' לפני עצמנו. 'כבד את ה' מהונך ומראשית כל תבואתך'. עיקרון ה'ראשית': לא מה שנשאר נותנים – אלא מהראשון, מהטוב ביותר. זה מה שמקדש את השאר.",
          icon: "🍞",
        },
      ],
    ],
    קרח: [
      [
        {
          title: "מחלוקת שלא לשם שמים",
          source: "אבות ה",
          text: "'כל מחלוקת שהיא לשם שמים סופה להתקיים. שלא לשם שמים – אין סופה להתקיים'. מחלוקת קרח לא הייתה לשם שמים – הייתה לשם כבוד עצמי. 'כי כל העדה כולם קדושים' – טענה שנראית כדמוקרטיה אבל היא רק כיסוי לשאיפת שלטון.",
          icon: "⚡",
        },
      ],
      [
        {
          title: "עץ השקדים – נצחון השירות",
          source: "במדבר יז",
          text: "אחרי מחלוקת קרח, ה' הוכיח את בחירת אהרן: מטהו הצמיח שקדים. השקד פורח לפני כולם – 'שקד' גם מלשון 'לשקוד', עבודה שקדנית. אהרן זכה לא בגלל כוח אלא בגלל שרות. ה'ראיה' לנבחר האמיתי היא פרי עבודתו.",
          icon: "🌸",
        },
      ],
    ],
    חקת: [
      [
        {
          title: "פרה אדומה – חוק שמעל הדעת",
          source: "במדבר יט",
          text: "פרה אדומה היא 'חוק' – חוק שאין לו טעם מובן. אותה פרה מטהרת את הטמאים ומטמאת את הטהורים. שלמה המלך אמר שזה הכי רחוק מהבנתו. יש בתורה דברים שמעל לשכל. כשאנחנו מקיימים גם את מה שלא מבינים – זה ביטוי עמוק של אמונה.",
          icon: "🐄",
        },
      ],
      [
        {
          title: "מי מריבה – כוח וחולשה",
          source: "במדבר כ",
          text: "'ויך את הסלע' – משה הוכה בסלע במקום לדבר אליו. ה' אמר לו 'לא הקדשתם אותי'. משה, הגדול שבנביאים, נענש על פעולה קטנה. ממי שניתן לו הרבה – נדרש הרבה. 'נאמן ביתי הוא' – ממנהיג נאמן מצפים לדיוק מוחלט.",
          icon: "💧",
        },
      ],
    ],
    בלק: [
      [
        {
          title: "בלעם – נביא שלא שינה",
          source: "במדבר כב",
          text: "בלעם היה נביא אמיתי. ה' דיבר איתו. אך הוא ביקש לקלל את ישראל. ה' הפך את הקללה לברכה. בלעם ניסה שלוש פעמים – ושלוש פעמים בירך. המסר: ה' שומר על ישראל גם ממי שניסה לפגוע בהם.",
          icon: "🐴",
        },
      ],
      [
        {
          title: "מה טובו אוהליך יעקב",
          source: "במדבר כד",
          text: "'מה טובו אוהליך יעקב, משכנותיך ישראל' – בלעם, בניסיונו לקלל, פתח בברכה יפה שאנחנו אומרים עד היום בתפילה. אירוני: הגדול ביותר בברכת ישראל בא מאויב. הקדוש ברוך הוא יכול להוציא ברכה ממי שלא ציפינו לה.",
          icon: "🌟",
        },
      ],
    ],
    פינחס: [
      [
        {
          title: "קנאות לשם שמים",
          source: "במדבר כה",
          text: 'פינחס עצר מגפה בגלל מעשה קנאי. הוא לא חיכה לאישור – הוא פעל. חז"ל הסבירו: קנאות לשם שמים – כשהיא במקומה – עוצרת חורבן. אבל גם הוסיפו: אם שאל, לא היו מורים לו כן. יש פעולות שנכונות בדיעבד, אך אין להמליץ עליהן.',
          icon: "⚔️",
        },
      ],
      [
        {
          title: "בנות צלופחד – דין לפני משה",
          source: "במדבר כז",
          text: "'בנות צלופחד... ותקרבנה לפני משה'. הן תבעו ירושת אביהן. משה לא ידע – שאל את ה'. ה' אמר: 'כן בנות צלופחד דוברות'. לשתוק מול עוול – גם כשהמסגרת לא מכירה בך – זה אומץ. ה' מכיר בצדקתך גם כשהמערכת לא.",
          icon: "⚖️",
        },
      ],
    ],
    מטות: [
      [
        {
          title: "נדר – כוח הדיבור",
          source: "במדבר ל",
          text: "'כל הנודר נדר לה' לא יחל דברו'. הנדר מחייב. 'כל היוצא מפיו יעשה'. הדיבור יוצר מציאות. לכן תורה מקפידה כל כך: אל תינדר, ואם נדרת – קיים. 'טוב אשר לא תידור משתידור ולא תשלם'. כוח הדיבור הוא כוח של בריאה – ויש להשתמש בו בזהירות.",
          icon: "🗣️",
        },
      ],
      [
        {
          title: "מלחמת מדין – גמול וסיום",
          source: "במדבר לא",
          text: "ישראל נאבקו במדין שהיה אחראי לחטא בעל פעור. בסיום המלחמה, חזרו עם שלל גדול. אך משה כועס: מדוע החיתם את הנשים שגרמו לחטא? הניצחון הצבאי אינו מספיק – צריך לסיים גם את מה שגרם לנפילה הרוחנית.",
          icon: "⚔️",
        },
      ],
    ],
    מסעי: [
      [
        {
          title: "42 מסעות – מסע הנשמה",
          source: "ספר הזוהר",
          text: "42 מסעות של ישראל במדבר. הבעל שם טוב לימד שה-42 מסעות הם 42 תחנות בחיי כל אדם, מלידה עד מוות. בכל תחנה, ה' עמנו. גם כשחונים במקומות קשים – אלה הם 'מסעי בני ישראל אשר יצאו מארץ מצרים' – עדיין במסלול היציאה.",
          icon: "🗺️",
        },
      ],
      [
        {
          title: "ערי המקלט – כי יכה אדם",
          source: "במדבר לה",
          text: "ערי מקלט נועדו למי שהרג בשגגה. לא לרוצח במזיד. ה' מבחין: יש הבדל בין מזיד לשוגג. המשפט האלוקי מדויק. אדם שפגע בלי כוונה – מוגן. ה'מקלט' הוא לא בריחה מאחריות – הוא הגנה מנקמה עיוורת. ה' אוהב צדק מדויק.",
          icon: "🏙️",
        },
      ],
    ],
    דברים: [
      [
        {
          title: "אלה הדברים – שפת הנהגה",
          source: "דברים א",
          text: "'אלה הדברים אשר דיבר משה'. ספר דברים הוא נאום פרידה של משה. 40 שנה עמד לפני ה' – ועכשיו מדבר אל העם. הנהגה שלמה מסתיימת בהעברת המסר. לא רק לעשות – גם לסכם, לחנך, להדגיש. 'אלה הדברים' – הכל מסתכם בדיבור.",
          icon: "🎤",
        },
      ],
      [
        {
          title: "ראה נתתי לפניך",
          source: "דברים א",
          text: "'ראה נתתי לפניך את הארץ, בוא ורש'. ה' נתן – אבל ישראל צריכים לקחת. גם ארץ ישראל, גם כל ברכה בחיים – ה' נותן לנו את ה'לפני', אבל אנחנו צריכים לפסוע. הנסכיות מה' אינן פאסיביות – הן זימון לפעולה.",
          icon: "🌍",
        },
      ],
    ],
    ואתחנן: [
      [
        {
          title: "שמע ישראל – אחדות ה'",
          source: "דברים ו",
          text: "'שמע ישראל ה' אלוהינו ה' אחד' – יסוד האמונה. לא רק שה' קיים – הוא אחד. אחד: לא מחולק, לא מורכב, לא מוגבל. כשמכירים בזה – מבינים שאין 'מחוץ לה'' ואין 'בלי ה''. כל מה שקיים – קיים בתוכו. זה שינוי תפיסה מהותי.",
          icon: "☝️",
        },
      ],
      [
        {
          title: "ואהבת – מצוות האהבה",
          source: "דברים ו",
          text: "'ואהבת את ה' אלוהיך בכל לבבך ובכל נפשך ובכל מאודך'. איך מצווים על אהבה? ה'אהבה' כאן היא לא רגש בלבד – היא כיוון חיים. 'בכל לבבך' – בשני יצריך, טוב ורע. 'בכל מאודך' – אפילו בנסיבות שקשה לאהוב.",
          icon: "❤️",
        },
      ],
    ],
    עקב: [
      [
        {
          title: "מה ה' שואל מעמך",
          source: "דברים י",
          text: "'ועתה ישראל מה ה' אלוהיך שואל מעמך כי אם ליראה' – 'מה' מלשון מעט? רש\"י: גדול הוא אצל ה'. אמר חז\"ל: 'הכל בידי שמים חוץ מיראת שמים'. הבחירה החופשית הגדולה ביותר שניתנה לאדם היא: האם לירא מה' – לבחור בו.",
          icon: "🙏",
        },
      ],
      [
        {
          title: "ארץ זבת חלב ודבש",
          source: "דברים יא",
          text: "'ארץ אשר ה' אלוהיך דורש אותה תמיד, עיני ה' אלוהיך בה מראשית השנה ועד אחרית שנה'. ה' 'דורש' את הארץ – מסתכל בה, עוקב אחריה. ארץ ישראל היא לא רק גיאוגרפיה – היא נחלת ה' המיוחדת. לחיות בה היא קיום מצווה.",
          icon: "🌿",
        },
      ],
    ],
    ראה: [
      [
        {
          title: "ראה – בחירה אישית",
          source: "דברים יא",
          text: "'ראה אנוכי נותן לפניכם ברכה וקללה' – 'ראה' בלשון יחיד, 'לפניכם' בלשון רבים. כל אחד לחוד, אבל כולם יחד. הבחירה בטוב ובחיים היא אחריות אישית – אף אחד לא יכול לבחור בשבילך. אבל ההשלכות הן על הכלל.",
          icon: "👁️",
        },
      ],
      [
        {
          title: "שופטים ושוטרים – מוסדות הצדק",
          source: "דברים טז",
          text: "'שופטים ושוטרים תיתן לך בכל שעריך'. שני מוסדות: השופטים – קובעים את הדין. השוטרים – אוכפים אותו. חברה צודקת צריכה שניהם. לא מספיק לדעת מה נכון – צריך גם לאכוף. 'צדק צדק תרדוף' – רדוף, אל תשב ותחכה.",
          icon: "⚖️",
        },
      ],
    ],
    שופטים: [
      [
        {
          title: "לא תסור – סמכות המסורת",
          source: "דברים יז",
          text: "'לא תסור מן הדבר אשר יגידו לך ימין ושמאל'. גם אם נראה לך שהם אומרים ימין שזה שמאל – שמע להם. זה נראה מוקצן, אבל הרעיון: מסורת ומחויבות למוסדות הדת יוצרת רצף. בלי מסגרת – כל אחד עושה מה שנראה בעיניו.",
          icon: "⚖️",
        },
      ],
      [
        {
          title: "מלך ישראל – גבולות הכוח",
          source: "דברים יז",
          text: "'שום תשים עליך מלך' – מותר למנות מלך. אבל: 'לא ירבה לו סוסים... ולא ירבה לו נשים... וכסף וזהב לא ירבה'. המלך – הכוח הגדול ביותר – חייב בגבולות. ריכוז כוח ועושר מושחת. ה' מגביל את המלך מראש. זה עיקרון דמוקרטי שהקדים את זמנו.",
          icon: "👑",
        },
      ],
    ],
    "כי תצא": [
      [
        {
          title: "כי תצא למלחמה",
          source: "דברים כא",
          text: "פרשת כי תצא פותחת במלחמה ובאסיר המלחמה. אפילו בשעת מלחמה – ה' אומר: יש גבולות. יש חוקים. אסיר אינו הפקר. כבוד האדם חל גם על אויב. מלחמה כשרה מבחינה מוסרית אינה מלחמה ללא גבולות.",
          icon: "⚔️",
        },
      ],
      [
        {
          title: "שילוח הקן",
          source: "דברים כב",
          text: "'שלח תשלח את האם' – מצוות שילוח הקן. לפני שלוקחים ביצים מקן – שלח את האם. 'למען ייטב לך והארכת ימים'. מצווה קטנה, שכר גדול. הרמב\"ן: מלמדת רחמים. כשמורגלים ברחמים על חיות – קל יותר להרגיל לרחמים על אנשים.",
          icon: "🐦",
        },
      ],
    ],
    "כי תבוא": [
      [
        {
          title: "ביכורים – הכרת הטוב",
          source: "דברים כו",
          text: "'ולקחת מראשית כל פרי האדמה' – מביאים ביכורים לה'. ואומרים: 'ארמי אובד אבי...' – מספרים את ההיסטוריה. ההכרה בטוב אינה מחשבה פנימית – היא אמירה בפה, בקהל, בקול. 'לפני ה' אלוהיך' – בנוכחות. הביכורים הם תרגיל בהכרת הטוב.",
          icon: "🍇",
        },
      ],
      [
        {
          title: "הברכות והקללות",
          source: "דברים כח",
          text: "פרשת ברכות וקללות ארוכה מאוד, הקללות ארוכות מהברכות. מדוע? כי ה' ממש רוצה שנבחר בברכה – אז הוא מפרט את הקללה בהרחבה. כהורה שמסביר לילד בפירוט מה יקרה אם לא יישמע – לא מתוך כוונה לקלל, אלא מתוך אהבה שרוצה שנבחר נכון.",
          icon: "📜",
        },
      ],
    ],
    נצבים: [
      [
        {
          title: "אתם נצבים היום",
          source: "דברים כט",
          text: "'אתם נצבים היום כולכם לפני ה' אלוהיכם'. 'כולכם' – ראשיכם, זקניכם, שופטיכם, טפכם, נשיכם, גר. כולם. ברית ה' כוללת את כולם – אין יוצא מן הכלל. 'גם את אשר איננו פה עמנו היום' – גם הדורות הבאים שם. אנחנו שם.",
          icon: "🤲",
        },
      ],
      [
        {
          title: "קרובה היא – לא בשמים",
          source: "דברים ל",
          text: "'כי קרוב אליך הדבר מאוד בפיך ובלבבך לעשותו'. התורה אינה רחוקה. לא בשמים, לא מעבר לים. היא בפה ובלב. המעשה – 'לעשותו'. אין תירוץ. ה' לא ביקש ממך את האפשרי-אולי – ביקש את המצוי, את מה שקרוב ממש.",
          icon: "💛",
        },
      ],
    ],
    וילך: [
      [
        {
          title: "כתבו לכם את השירה",
          source: "דברים לא",
          text: "'ועתה כתבו לכם את השירה הזאת'. לפני מותו, ה' מצווה את משה לכתוב שירה. מה מתחנך דור לאחר דור? לא רק מצוות – גם שירה. הרגש, הנשמה, ה'שיר' של ישראל. עם ישראל חי לא רק כי יש לו חוקים – אלא כי יש לו שיר.",
          icon: "🎵",
        },
      ],
      [
        {
          title: "הסתר פנים ואגנוז",
          source: "דברים לא",
          text: "'ואנוכי הסתר אסתיר פני' – ה' מכריז שיסתיר פניו. זה לא נטישה – זה ניסיון. כשה' 'מסתיר', הוא בודק: האם עמך ישמרו אמונתם גם בלי ראייה ברורה? ישראל שרדו גלות ארוכה גם כשה' 'הסתיר'. זה כוחנו.",
          icon: "🌑",
        },
      ],
    ],
    האזינו: [
      [
        {
          title: "שירת האזינו – עד הסוף",
          source: "דברים לב",
          text: "'האזינו השמים ואדברה ותשמע הארץ אמרי פי' – שמים וארץ כעדים. שירת האזינו היא שיר היסטוריה – מהתחלה ועד הסוף. ה' מספר מראש את כל מה שיקרה. ומסיים: 'ראו עתה כי אני אני הוא'. ההיסטוריה כולה – מאז ועד עתה – היא אחת.",
          icon: "🎶",
        },
      ],
      [
        {
          title: "יעקב חבל נחלתו",
          source: "דברים לב",
          text: "'כי חלק ה' עמו, יעקב חבל נחלתו'. ישראל הם 'חבל' – חבל מדידה, נחלה. ה' 'מדד' לו את ישראל. הגויים הם 'גורלם' – גורל מזדמן. אבל ישראל הם 'חבל' – מדויק, מכוון, מתוכנן. אנחנו לא תוצאת מקרה – אנחנו חלקו המדויק של ה'.",
          icon: "⭐",
        },
      ],
    ],
    "וזאת הברכה": [
      [
        {
          title: "ברכת משה – ברכת אב",
          source: "דברים לג",
          text: "'וזאת הברכה אשר בירך משה' – הברכה האחרונה. כל שבט מבורך על פי ייחודו. לא ברכה אחת לכולם – ברכה מותאמת. גדולת משה: ידע את ייחוד כל שבט ובירך בהתאם. לברך אחר – צריך להכיר אותו. אהבה היא ראייה.",
          icon: "✋",
        },
      ],
      [
        {
          title: "וימת שם משה",
          source: "דברים לד",
          text: "'וימת שם משה עבד ה' בארץ מואב על פי ה''. 'על פי ה'' – נשיקת ה'. המוות הגדול ביותר – עם קדושה. 'ולא ידע איש את קבורתו עד היום'. קבורת משה נסתרת – כי הוא שייך לנצח. הגדולה האמיתית אינה צריכה מצבה. היא חיה בתוך הלבבות.",
          icon: "🌅",
        },
      ],
    ],
  };

  // ── Hebrew year index: 0=even year (5786,5788…), 1=odd (5787,5789…) ──
  var YR = (function () {
    try {
      return (
        parseInt(
          new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(
            new Date(),
          ),
        ) % 2
      );
    } catch (e) {
      return 0;
    }
  })();

  function stripNikud(s) {
    return (s || "").replace(/־/g, "-").replace(/[֑-ׇ]/g, "");
  }

  function matchMoad(name) {
    if (!name) return null;
    if (name.indexOf("שבועות") >= 0) return "שבועות";
    if (name.indexOf("ראש השנה") >= 0) return "ראש השנה";
    if (name.indexOf("שמחת תורה") >= 0) return "שמחת תורה";
    if (name.indexOf("יום כיפור") >= 0 || name.indexOf("כיפור") >= 0)
      return "יום כיפור";
    if (name.indexOf("הושענא רבה") >= 0 || name.indexOf("סוכות") >= 0)
      return "סוכות";
    if (name.indexOf("חנוכה") >= 0) return "חנוכה";
    if (name.indexOf("פורים") >= 0) return "פורים";
    if (name.indexOf("פסח") >= 0) return "פסח";
    if (name.indexOf("בעומר") >= 0) return "לג בעומר";
    if (name.indexOf("תשעה באב") >= 0 || name.indexOf("תשעא") >= 0)
      return "תשעה באב";
    if (name.indexOf("צום גדליה") >= 0) return "צום גדליה";
    if (name.indexOf("תענית אסתר") >= 0 || name.indexOf("צום אסתר") >= 0)
      return "צום אסתר";
    if (name.indexOf("שבעה עשר") >= 0 || name.indexOf('י"ז בתמוז') >= 0)
      return "שבעה עשר בתמוז";
    if (name.indexOf("עשרה בטבת") >= 0 || name.indexOf("י' בטבת") >= 0)
      return "עשרה בטבת";
    if (name.indexOf("ראש חודש") >= 0) return "ראש חודש";
    if (name.indexOf("שבת") >= 0) return "שבת";
    return null;
  }

  // ── Generic popup: items[], displayName, prefixLabel ──
  function openTorahPopup(items, displayName, prefixLabel) {
    var idx = 0;
    var old = document.getElementById("moad-torah-modal");
    if (old) old.remove();
    if (!items || !items.length)
      items = [
        {
          title: displayName,
          source: "",
          text: "דברי תורה על " + displayName + " יתווספו בקרוב.",
          icon: "📖",
        },
      ];
    var modal = document.createElement("div");
    modal.id = "moad-torah-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText =
      "position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);padding:1rem;";
    function buildCard(i) {
      var t = items[i];
      var dots = items
        .map(function (_, j) {
          return (
            '<div style="width:' +
            (j === i ? "20px" : "8px") +
            ";height:8px;border-radius:4px;background:" +
            (j === i ? "#c4b5fd" : "rgba(196,181,253,0.3)") +
            ';transition:all 0.3s;margin:0 3px;"></div>'
          );
        })
        .join("");
      return (
        '<div style="background:linear-gradient(145deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%);border:1px solid rgba(139,92,246,0.4);border-radius:2rem;padding:2rem 1.75rem 1.5rem;max-width:480px;width:100%;max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 30px 80px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.05);">' +
        '<button id="moad-close" style="position:absolute;top:1.1rem;left:1.1rem;background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:2.1rem;height:2.1rem;cursor:pointer;color:#e2e8f0;font-size:1.1rem;display:flex;align-items:center;justify-content:center;" aria-label="סגור">✕</button>' +
        '<div style="text-align:center;margin-bottom:1.5rem;">' +
        '<div style="font-size:2.2rem;margin-bottom:0.5rem;">' +
        t.icon +
        "</div>" +
        '<div style="font-size:0.7rem;letter-spacing:0.12em;color:#7c3aed;font-weight:700;text-transform:uppercase;margin-bottom:0.3rem;">' +
        (prefixLabel || "דבר תורה ל") +
        displayName +
        "</div>" +
        (t.source
          ? '<p style="font-size:0.78rem;color:#7c3aed;margin:0;font-weight:600;">— ' +
            t.source +
            "</p>"
          : "") +
        "</div>" +
        '<div style="height:1px;background:linear-gradient(to right,transparent,rgba(139,92,246,0.4),transparent);margin-bottom:1.25rem;"></div>' +
        '<p style="font-size:0.95rem;line-height:1.85;color:#cbd5e1;direction:rtl;text-align:right;margin:0 0 1.5rem;">' +
        t.text +
        "</p>" +
        (items.length > 1
          ? '<div style="display:flex;align-items:center;justify-content:space-between;direction:ltr;margin-bottom:1rem;">' +
            '<button id="moad-prev" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);color:#c4b5fd;border-radius:0.75rem;padding:0.45rem 1rem;cursor:pointer;font-size:1.1rem;opacity:' +
            (i === 0 ? "0.3" : "1") +
            ";" +
            (i === 0 ? "pointer-events:none;" : "") +
            '">‹</button>' +
            '<div style="display:flex;align-items:center;">' +
            dots +
            "</div>" +
            '<button id="moad-next" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.4);color:#c4b5fd;border-radius:0.75rem;padding:0.45rem 1rem;cursor:pointer;font-size:1.1rem;opacity:' +
            (i === items.length - 1 ? "0.3" : "1") +
            ";" +
            (i === items.length - 1 ? "pointer-events:none;" : "") +
            '">›</button>' +
            "</div>" +
            '<p style="text-align:center;font-size:0.72rem;color:#475569;margin:0;">' +
            (i + 1) +
            " / " +
            items.length +
            "</p>"
          : "") +
        "</div>"
      );
    }
    function render(i) {
      modal.innerHTML = buildCard(i);
      modal.querySelector("#moad-close").addEventListener("click", function () {
        modal.remove();
      });
      if (items.length > 1) {
        var prev = modal.querySelector("#moad-prev"),
          next = modal.querySelector("#moad-next");
        if (prev)
          prev.addEventListener("click", function () {
            if (idx > 0) {
              idx--;
              render(idx);
            }
          });
        if (next)
          next.addEventListener("click", function () {
            if (idx < items.length - 1) {
              idx++;
              render(idx);
            }
          });
      }
      modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.remove();
      });
    }
    document.body.appendChild(modal);
    modal.setAttribute("tabindex", "-1");
    modal.focus();
    render(idx);
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Escape") modal.remove();
      if (e.key === "ArrowLeft" && idx < items.length - 1) {
        idx++;
        render(idx);
      }
      if (e.key === "ArrowRight" && idx > 0) {
        idx--;
        render(idx);
      }
    });
  }

  window._matchMoad = matchMoad;
  window._DT = DT;
  window._openMoadByName = function (name) {
    window._nextMoadName = name;
    window.openMoadModal();
  };

  window.openMoadModal = function () {
    var moadName =
      window._nextMoadName ||
      (document.getElementById("stat-next") || {}).textContent ||
      "";
    var key = matchMoad(moadName);
    var allV = key ? DT[key] || null : null;
    var items = allV ? allV[YR] || allV[0] || [] : [];
    openTorahPopup(items, key || moadName || "החג הקרוב", "דבר תורה ל");
  };

  window.openMonthTorahModal = function () {
    var month = stripNikud(
      new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" }).format(
        new Date(),
      ),
    ).trim();
    var variants = MONTH_DT[month] || null;
    var item = variants ? variants[YR] || variants[0] : null;
    if (!item)
      item = {
        title: "חודש " + month,
        source: "",
        text: "דברי תורה על חודש " + month + " יתווספו בקרוב.",
        icon: "🌙",
      };
    openTorahPopup([item], "חודש " + month, "דבר תורה לחודש ");
  };

  window.openParshaTorahModal = function () {
    var raw = stripNikud(window.SHABBAT_PARASHA_NAME || "")
      .replace(/^פרשת\s+/, "")
      .replace(/^שבת\s+/, "")
      .trim();
    var variants = PARSHA_DT[raw] || null;
    var displayName = raw;
    if (!variants && raw.indexOf("-") >= 0) {
      var parts = raw.split("-");
      for (var pi = 0; pi < parts.length; pi++) {
        variants = PARSHA_DT[parts[pi].trim()] || null;
        if (variants) break;
      }
    }
    var items = variants ? variants[YR] || variants[0] || [] : [];
    if (!items || !items.length)
      items = [
        {
          title: "פרשת " + displayName,
          source: "",
          text: "דברי תורה על פרשת " + displayName + " יתווספו בקרוב.",
          icon: "📖",
        },
      ];
    openTorahPopup(items, "פרשת " + displayName, "דבר תורה ל");
  };
})();
