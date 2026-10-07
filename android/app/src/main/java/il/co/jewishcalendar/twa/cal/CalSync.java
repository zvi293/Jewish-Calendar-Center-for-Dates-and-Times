package il.co.jewishcalendar.twa.cal;

import android.Manifest;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.util.Log;

import com.kosherjava.zmanim.hebrewcalendar.Daf;
import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;
import com.kosherjava.zmanim.hebrewcalendar.JewishDate;
import com.kosherjava.zmanim.hebrewcalendar.YomiCalculator;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.widget.Sync;
import il.co.jewishcalendar.twa.widget.core.Day;
import il.co.jewishcalendar.twa.widget.core.Engine;
import il.co.jewishcalendar.twa.widget.core.Heb;
import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * סנכרון אוטומטי של הלוח היהודי ליומן הראשי של הטלפון (10/2026, גרסה 1.1.3).
 *
 * הכול מחושב בטלפון — אותו מנוע כמו הווידג'טים (widget/core: KosherJava באותן שיטות כמו
 * האתר, לוח ארץ ישראל): חגים ומועדים, צומות עם שעות התחלה וסיום, ראשי חודשים, הדלקת נרות
 * וצאת שבת וחג לפי העיר שנבחרה באתר, פרשת השבוע, ספירת העומר והדף היומי. חלון מתגלגל של
 * שבוע אחורה ו-400 יום קדימה; עבודה יומית (CalJob) מגלגלת אותו, ושינוי עיר/נוסח באתר
 * מעדכן מיד (Sync.onMessage → onSettingsChanged).
 *
 * הסנכרון לפי הבדלים: כל אירוע מקבל מפתח קבוע ("cand:2026-10-09") ונשמרים מזהה השורה ביומן
 * וחתימת התוכן — מוסיפים מה שחסר, מעדכנים מה שהשתנה ומוחקים מה שכבר לא רלוונטי, כך שאין
 * כפילויות. כל אירוע נושא בתיאור את הסימן MARK — כך גם אחרי מחיקת נתוני האפליקציה (המפה
 * אבדה) מוצאים את האירועים הישנים ומוחקים אותם לפני שמוסיפים מחדש, וכיבוי מנקה הכול.
 */
public final class CalSync {
    private CalSync() {}

    static final String TAG = "JcCal";
    private static final String FILE = "jc_calendar";
    private static final int DAYS_BACK = 7, DAYS_AHEAD = 400;
    static final int JOB_ID = 7301;
    /** הסימן שבסוף התיאור של כל אירוע שלנו. */
    static final String MARK = "— הלוח היהודי · jewishcalendar.co.il";

    /** הקטגוריות — מפתח ותווית (מסך ההגדרות). כולן פעילות כברירת מחדל (בקשת המשתמש). */
    static final String[][] CATS = {
            {"holidays", "חגים, מועדים וימים מיוחדים"},
            {"shabbat", "הדלקת נרות וצאת שבת וחג"},
            {"fasts", "צומות — שעת התחלה וסיום"},
            {"rc", "ראש חודש"},
            {"parasha", "פרשת השבוע"},
            {"omer", "ספירת העומר"},
            {"daf", "הדף היומי"},
    };

    static SharedPreferences sp(Context c) {
        return c.getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    public static boolean enabled(Context c) {
        return sp(c).getBoolean("on", false);
    }

    static boolean cat(Context c, String k) {
        return sp(c).getBoolean("cat_" + k, true);
    }

    static void setCat(Context c, String k, boolean on) {
        sp(c).edit().putBoolean("cat_" + k, on).apply();
    }

    static boolean hasPermission(Context c) {
        return c.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED
                && c.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    // ═══════════════════════ היומנים בטלפון ═══════════════════════

    static final class Cal {
        long id;
        String name = "", account = "", type = "", owner = "";
        boolean primary, visible;

        String label() {
            String acc = account == null ? "" : account;
            if (name == null || name.isEmpty() || name.equals(acc)) return acc;
            return acc.isEmpty() ? name : name + " · " + acc;
        }
    }

    /** כל היומנים שמותר לכתוב אליהם. */
    static List<Cal> writable(Context c) {
        List<Cal> out = new ArrayList<>();
        String[] proj = {
                CalendarContract.Calendars._ID, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
                CalendarContract.Calendars.ACCOUNT_NAME, CalendarContract.Calendars.ACCOUNT_TYPE,
                CalendarContract.Calendars.IS_PRIMARY, CalendarContract.Calendars.VISIBLE,
                CalendarContract.Calendars.OWNER_ACCOUNT};
        try (Cursor q = c.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, proj,
                CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + ">=" + CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR,
                null, null)) {
            while (q != null && q.moveToNext()) {
                Cal k = new Cal();
                k.id = q.getLong(0);
                k.name = q.getString(1);
                k.account = q.getString(2);
                k.type = q.getString(3);
                k.primary = !q.isNull(4) && q.getInt(4) == 1;
                k.visible = q.isNull(5) || q.getInt(5) == 1;
                k.owner = q.getString(6);
                out.add(k);
            }
        } catch (Throwable t) {
            Log.w(TAG, "calendars", t);
        }
        return out;
    }

    /**
     * "היומן הראשי" (בקשת המשתמש): היומן הראשי של חשבון Google; אחריו של Samsung / Xiaomi;
     * אחריו כל יומן ראשי אחר — ותמיד יומן גלוי לפני מוסתר.
     */
    static Cal pickMain(List<Cal> list) {
        Cal best = null;
        int bestScore = Integer.MIN_VALUE;
        for (Cal k : list) {
            int s = 0;
            String type = k.type == null ? "" : k.type;
            boolean own = k.owner != null && k.owner.equalsIgnoreCase(k.account);
            if ("com.google".equals(type)) s += 100;
            else if (type.contains("samsung") || "com.osp.app.signin".equals(type)) s += 60;
            else if (type.contains("xiaomi")) s += 60;
            else if (CalendarContract.ACCOUNT_TYPE_LOCAL.equals(type)) s += 30;
            if (k.primary) s += 50;
            if (own) s += 25;
            if (k.visible) s += 10;
            if (s > bestScore) {
                bestScore = s;
                best = k;
            }
        }
        return best;
    }

    static Cal byId(List<Cal> list, long id) {
        for (Cal k : list) if (k.id == id) return k;
        return null;
    }

    /** אין אף יומן שאפשר לכתוב אליו (טלפון בלי חשבון) — יוצרים יומן מקומי "הלוח היהודי". */
    static long createLocal(Context c) {
        Uri u = CalendarContract.Calendars.CONTENT_URI.buildUpon()
                .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, "הלוח היהודי")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL)
                .build();
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Calendars.ACCOUNT_NAME, "הלוח היהודי");
        v.put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
        v.put(CalendarContract.Calendars.NAME, "jewishcalendar");
        v.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, "הלוח היהודי");
        v.put(CalendarContract.Calendars.CALENDAR_COLOR, 0xFFD4AF37);
        v.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        v.put(CalendarContract.Calendars.OWNER_ACCOUNT, "הלוח היהודי");
        v.put(CalendarContract.Calendars.VISIBLE, 1);
        v.put(CalendarContract.Calendars.SYNC_EVENTS, 1);
        v.put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, TimeZone.getDefault().getID());
        Uri r = c.getContentResolver().insert(u, v);
        return r == null ? -1 : ContentUris.parseId(r);
    }

    /** היומן שנבחר — ואם אין (או שנמחק מהטלפון) בוחרים את הראשי מחדש. */
    static Cal targetCalendar(Context c) {
        List<Cal> list = writable(c);
        Cal k = byId(list, sp(c).getLong("cal_id", -1));
        if (k == null) {
            k = pickMain(list);
            if (k == null) {
                long id = createLocal(c);
                if (id < 0) return null;
                list = writable(c);
                k = byId(list, id);
                if (k == null) return null;
            }
            sp(c).edit().putLong("cal_id", k.id).apply();
        }
        return k;
    }

    // ═══════════════════════ האירועים ═══════════════════════

    static final class Ev {
        String key, title, desc, where = "";
        long start, end;
        boolean allDay;

        String sig() {
            return Integer.toHexString((title + "|" + desc + "|" + where + "|" + start + "|" + end + "|" + allDay).hashCode());
        }
    }

    private static Ev allDay(String key, String title, String desc, int[] ymd) {
        Ev v = new Ev();
        v.key = key;
        v.title = title;
        v.desc = desc;
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.clear();
        u.set(ymd[0], ymd[1] - 1, ymd[2], 0, 0, 0);
        v.start = u.getTimeInMillis();
        v.end = v.start + Engine.DAY;
        v.allDay = true;
        return v;
    }

    private static Ev timed(String key, String title, String desc, String where, long start, long end) {
        Ev v = new Ev();
        v.key = key;
        v.title = title;
        v.desc = desc;
        v.where = where == null ? "" : where;
        v.start = start;
        v.end = Math.max(start, end);
        return v;
    }

    private static int[] ymd(Engine e, int off) {
        Calendar k = e.cal();
        k.clear();
        k.set(e.y, e.m - 1, e.d, 12, 0, 0);
        k.add(Calendar.DAY_OF_MONTH, off);
        return new int[]{k.get(Calendar.YEAR), k.get(Calendar.MONTH) + 1, k.get(Calendar.DAY_OF_MONTH)};
    }

    private static String iso(int[] d) {
        return d[0] + "-" + (d[1] < 10 ? "0" : "") + d[1] + "-" + (d[2] < 10 ? "0" : "") + d[2];
    }

    private static String hebDate(JewishCalendar jc) {
        return Heb.dayOfMonth(jc) + " " + Heb.year(jc);
    }

    /** "ראש חודש" ביום ל' — של החודש הבא. */
    private static String rcName(JewishCalendar jc) {
        if (jc.getJewishDayOfMonth() == 30) {
            JewishCalendar n = (JewishCalendar) jc.clone();
            n.forward(Calendar.DATE, 1);
            return Heb.month(n);
        }
        return Heb.month(jc);
    }

    /** שם היום הקדוש שנכנס (לכותרת הדלקת הנרות). */
    private static String enteringName(Engine e, JewishCalendar jc, int off, boolean withParasha) {
        boolean sh = jc.getDayOfWeek() == 7, yt = jc.isYomTovAssurBemelacha();
        if (jc.getYomTovIndex() == JewishCalendar.YOM_KIPPUR) return sh ? "שבת · יום כיפור" : "יום כיפור";
        String name = yt ? Engine.yomTovName(jc) : null;
        if (sh && name != null) return "שבת · " + name;
        if (name != null) return name;
        String p = withParasha ? noShabbatPrefix(Engine.shabbatTitle(jc)) : null;
        return p != null ? "שבת · " + p : "שבת";
    }

    /** "שבת חול המועד פסח" → "חול המועד פסח" (בכותרת כבר כתוב "שבת"). */
    private static String noShabbatPrefix(String p) {
        return p == null ? null : p.startsWith("שבת ") ? p.substring(4) : p;
    }

    private static String exitName(JewishCalendar last, boolean withParasha) {
        boolean sh = last.getDayOfWeek() == 7, yt = last.isYomTovAssurBemelacha();
        if (last.getYomTovIndex() == JewishCalendar.YOM_KIPPUR) return "צאת יום כיפור · סוף הצום";
        if (sh && yt) return "צאת השבת והחג";
        if (yt) {
            String n = Engine.yomTovName(last);
            return "צאת החג" + (n != null ? " · " + n : "");
        }
        String p = withParasha ? noShabbatPrefix(Engine.shabbatTitle(last)) : null;
        return "צאת השבת" + (p != null ? " · " + p : "");
    }

    /** כל האירועים של החלון לפי הקטגוריות שנבחרו — לפי הסדר, מפתח ייחודי לכל אחד. */
    static Map<String, Ev> build(Context c, Loc loc, long now) {
        Engine e = new Engine(loc, now);
        TimeZone tz = e.tz;
        Map<String, Ev> out = new LinkedHashMap<>();
        boolean hol = cat(c, "holidays"), sh = cat(c, "shabbat"), fa = cat(c, "fasts"), rc = cat(c, "rc"),
                par = cat(c, "parasha"), om = cat(c, "omer"), daf = cat(c, "daf");
        String city = loc.name == null ? "" : loc.name;
        String at = city.isEmpty() ? "" : " ב" + city;
        for (int off = -DAYS_BACK; off <= DAYS_AHEAD; off++) {
            JewishCalendar jc = e.jcOf(off), next = e.jcOf(off + 1);
            int[] d = ymd(e, off);
            String iso = iso(d);
            String hd = hebDate(jc);
            String yt = Engine.yomTovName(jc);
            boolean fast = Engine.isFastDay(jc);
            int idx = jc.getYomTovIndex();

            // 1. חגים ומועדים (כל היום). צום — כאירוע עם שעות (סעיף 3); יום כיפור — גם כאן
            if (hol && yt != null && (!fast || idx == JewishCalendar.YOM_KIPPUR)) {
                String t = yt;
                if (idx == JewishCalendar.CHANUKAH) t = "חנוכה · יום " + Heb.num(jc.getDayOfChanukah());
                put(out, allDay("hol:" + iso, t, hd + "\n" + MARK, d));
            }

            // 2. הדלקת נרות וצאת שבת וחג — לפי העיר
            boolean holyT = Engine.isHoly(jc), holyN = Engine.isHoly(next);
            if (sh && (holyN || holyT)) {
                Day z = e.day(off);
                if (holyN) {
                    // ערב שבת — תמיד לפני השקיעה, גם כשהוא יום טוב (מאש קיימת, בעירוב תבשילין);
                    // יום טוב שנכנס במוצאי שבת / ביום טוב שני — מאש קיימת אחרי צאת הכוכבים
                    boolean beforeSunset = !holyT || next.getDayOfWeek() == 7;
                    Long t = beforeSunset ? z.candle : z.tzeit;
                    String how = !holyT ? loc.candle + " דק׳ לפני השקיעה"
                            : beforeSunset ? "מאש קיימת, לפני השקיעה" : "מאש קיימת, אחרי צאת הכוכבים";
                    if (t != null) {
                        put(out, timed("cand:" + iso, "🕯️ הדלקת נרות · " + enteringName(e, next, off + 1, true),
                                how + at + " · " + hd + "\n" + MARK, city, t, t));
                    }
                }
                if (holyT && !holyN && z.tzeit != null) {
                    put(out, timed("hav:" + iso, "✨ " + exitName(jc, true),
                            "צאת הכוכבים" + at + " · " + hd + "\n" + MARK, city, z.tzeit, z.tzeit));
                }
            }

            // 3. צומות — מעלות השחר (תשעה באב: מהשקיעה של אמש) עד צאת הכוכבים
            if (fa && fast && idx != JewishCalendar.YOM_KIPPUR) {
                Day z = e.day(off);
                Long st = idx == JewishCalendar.TISHA_BEAV ? e.day(off - 1).sunset : z.alot;
                Long en = z.tzeit;
                if (st != null && en != null) {
                    String nm = yt == null ? "צום" : (yt.startsWith("צום") || yt.startsWith("תענית")) ? yt : "צום " + yt;
                    put(out, timed("fast:" + iso, "⏳ " + nm,
                            "תחילת הצום " + Heb.time(st, tz) + " · סוף הצום " + Heb.time(en, tz) + at + " · " + hd + "\n" + MARK,
                            city, st, en));
                }
            }

            // 4. ראש חודש
            if (rc && jc.isRoshChodesh()) {
                put(out, allDay("rc:" + iso, "🌙 ראש חודש " + rcName(jc), hd + "\n" + MARK, d));
            }

            // 5. פרשת השבוע — בשבת, כל היום (+ שבת מיוחדת / מברכים)
            if (par && jc.getDayOfWeek() == 7) {
                String t = Engine.shabbatTitle(jc);
                if (t != null) {
                    String special = e.specialShabbat(jc, off);
                    put(out, allDay("par:" + iso, "📜 " + t + (special.isEmpty() ? "" : " · " + special), hd + "\n" + MARK, d));
                }
            }

            // 6. ספירת העומר — בצאת הכוכבים, הספירה של הלילה (היום העברי הבא)
            int omer = next.getDayOfOmer();
            if (om && omer > 0) {
                Day z = e.day(off);
                if (z.tzeit != null) {
                    put(out, timed("omer:" + iso, "🌾 ספירת העומר · " + Heb.num(omer) + " לעומר",
                            Engine.omerText(omer, loc.nusach) + "\n" + MARK, "", z.tzeit, z.tzeit));
                }
            }

            // 7. הדף היומי
            if (daf) {
                try {
                    Daf df = YomiCalculator.getDafYomiBavli(jc);
                    put(out, allDay("daf:" + iso, "📖 דף יומי · " + df.getMasechta() + " " + Heb.num(df.getDaf()), hd + "\n" + MARK, d));
                } catch (Throwable ignored) {
                }
            }
        }
        return out;
    }

    private static void put(Map<String, Ev> out, Ev v) {
        out.put(v.key, v);
    }

    // ═══════════════════════ כתיבה ליומן ═══════════════════════

    public static final class Result {
        public boolean ok;
        public String error = "";
        public int total, added, updated, removed;
        public String calendar = "";
    }

    private static ContentValues values(Ev v, long calId, String pkgTz) {
        ContentValues cv = new ContentValues();
        cv.put(CalendarContract.Events.CALENDAR_ID, calId);
        cv.put(CalendarContract.Events.TITLE, v.title);
        cv.put(CalendarContract.Events.DESCRIPTION, v.desc);
        cv.put(CalendarContract.Events.EVENT_LOCATION, v.where);
        cv.put(CalendarContract.Events.DTSTART, v.start);
        cv.put(CalendarContract.Events.DTEND, v.end);
        cv.put(CalendarContract.Events.ALL_DAY, v.allDay ? 1 : 0);
        cv.put(CalendarContract.Events.EVENT_TIMEZONE, v.allDay ? "UTC" : pkgTz);
        cv.put(CalendarContract.Events.AVAILABILITY, CalendarContract.Events.AVAILABILITY_FREE);
        cv.put(CalendarContract.Events.HAS_ALARM, 0);
        return cv;
    }

    /** המפה השמורה: מפתח → [מזהה שורה, חתימה]. */
    private static Map<String, String[]> loadMap(Context c) {
        Map<String, String[]> m = new HashMap<>();
        try {
            JSONObject j = new JSONObject(sp(c).getString("map", "{}"));
            Iterator<String> it = j.keys();
            while (it.hasNext()) {
                String k = it.next();
                JSONArray a = j.getJSONArray(k);
                m.put(k, new String[]{a.getString(0), a.getString(1)});
            }
        } catch (Throwable ignored) {
        }
        return m;
    }

    private static void saveMap(Context c, Map<String, String[]> m) {
        JSONObject j = new JSONObject();
        try {
            for (Map.Entry<String, String[]> en : m.entrySet()) {
                JSONArray a = new JSONArray();
                a.put(en.getValue()[0]);
                a.put(en.getValue()[1]);
                j.put(en.getKey(), a);
            }
        } catch (Throwable ignored) {
        }
        sp(c).edit().putString("map", j.toString()).apply();
    }

    /** אילו מהמזהים עדיין קיימים ביומן (לא נמחקו ע"י המשתמש / היומן). */
    private static Set<Long> existing(ContentResolver cr, List<Long> ids) {
        Set<Long> out = new HashSet<>();
        for (int i = 0; i < ids.size(); i += 400) {
            StringBuilder in = new StringBuilder();
            for (int j = i; j < Math.min(ids.size(), i + 400); j++) {
                if (in.length() > 0) in.append(',');
                in.append(ids.get(j));
            }
            try (Cursor q = cr.query(CalendarContract.Events.CONTENT_URI, new String[]{CalendarContract.Events._ID},
                    CalendarContract.Events._ID + " IN (" + in + ") AND " + CalendarContract.Events.DELETED + "=0", null, null)) {
                while (q != null && q.moveToNext()) out.add(q.getLong(0));
            }
        }
        return out;
    }

    /** אירועים שלנו ביומן שאינם במפה (נתוני האפליקציה נמחקו / יומן שהוחלף) — לפי הסימן בתיאור. */
    private static List<Long> orphans(ContentResolver cr, long calId, Set<Long> known) {
        List<Long> out = new ArrayList<>();
        try (Cursor q = cr.query(CalendarContract.Events.CONTENT_URI, new String[]{CalendarContract.Events._ID},
                CalendarContract.Events.CALENDAR_ID + "=? AND " + CalendarContract.Events.DELETED + "=0 AND "
                        + CalendarContract.Events.DESCRIPTION + " LIKE ?",
                new String[]{String.valueOf(calId), "%" + MARK}, null)) {
            while (q != null && q.moveToNext()) {
                long id = q.getLong(0);
                if (!known.contains(id)) out.add(id);
            }
        } catch (Throwable t) {
            Log.w(TAG, "orphans", t);
        }
        return out;
    }

    private static void apply(ContentResolver cr, List<ContentProviderOperation> ops, List<String> keysForInserts,
                              Map<String, String[]> map, List<String> sigs) throws Exception {
        for (int i = 0; i < ops.size(); i += 120) {
            ArrayList<ContentProviderOperation> chunk = new ArrayList<>(ops.subList(i, Math.min(ops.size(), i + 120)));
            ContentProviderResult[] res = cr.applyBatch(CalendarContract.AUTHORITY, chunk);
            for (int j = 0; j < res.length; j++) {
                String key = keysForInserts.get(i + j);
                if (key != null && res[j].uri != null) {
                    map.put(key, new String[]{String.valueOf(ContentUris.parseId(res[j].uri)), sigs.get(i + j)});
                }
            }
        }
    }

    /**
     * חתימת ההגדרות שמשפיעות על הזמנים ביומן — שינוי בה (מיקום, דקות הדלקה, נוסח) = סנכרון מחדש.
     * בלי שם העיר: בזמן טעינת הדף השם מתחלף לפעמים (ריק ← שם), וזה לא משנה אף שעה; התיאורים
     * מתעדכנים ממילא בסנכרון היומי.
     */
    private static String settingsSig(Loc l) {
        return l.lat + "," + l.lon + "," + l.elev + "," + l.tz + "," + l.candle + "," + l.nusach;
    }

    /** הסנכרון עצמו (חוסם — לא על ה-UI thread). */
    public static synchronized Result run(Context c) {
        Result r = new Result();
        if (!hasPermission(c)) {
            r.error = "perm";
            return r;
        }
        ContentResolver cr = c.getContentResolver();
        try {
            Cal k = targetCalendar(c);
            if (k == null) {
                r.error = "nocal";
                return r;
            }
            r.calendar = k.label();
            Loc loc = Sync.loc(c);
            Map<String, Ev> want = build(c, loc, System.currentTimeMillis());
            Map<String, String[]> map = loadMap(c);
            long mapCal = sp(c).getLong("map_cal", k.id);
            List<ContentProviderOperation> ops = new ArrayList<>();
            List<String> opKeys = new ArrayList<>(), opSigs = new ArrayList<>();
            // יומן שהוחלף — מוחקים את כל האירועים מהקודם ומתחילים מאפס ביומן החדש
            if (mapCal != k.id) {
                for (String[] v : map.values()) {
                    ops.add(ContentProviderOperation.newDelete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(v[0]))).build());
                    opKeys.add(null);
                    opSigs.add(null);
                    r.removed++;
                }
                map.clear();
            }
            List<Long> ids = new ArrayList<>();
            for (String[] v : map.values()) ids.add(Long.parseLong(v[0]));
            Set<Long> alive = existing(cr, ids);
            // אירועים שלנו שלא במפה (למשל אחרי מחיקת נתוני האפליקציה) — מוחקים, שלא יוכפלו
            for (long id : orphans(cr, k.id, new HashSet<>(ids))) {
                ops.add(ContentProviderOperation.newDelete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id)).build());
                opKeys.add(null);
                opSigs.add(null);
                r.removed++;
            }
            String tz = loc.tz;
            // מה שכבר לא נדרש (עבר מהחלון / קטגוריה שכובתה)
            Iterator<Map.Entry<String, String[]>> it = map.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<String, String[]> en = it.next();
                if (want.containsKey(en.getKey())) continue;
                long id = Long.parseLong(en.getValue()[0]);
                if (alive.contains(id)) {
                    ops.add(ContentProviderOperation.newDelete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id)).build());
                    opKeys.add(null);
                    opSigs.add(null);
                    r.removed++;
                }
                it.remove();
            }
            for (Ev v : want.values()) {
                String sig = v.sig();
                String[] have = map.get(v.key);
                if (have != null && alive.contains(Long.parseLong(have[0]))) {
                    if (sig.equals(have[1])) continue;
                    ops.add(ContentProviderOperation.newUpdate(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(have[0])))
                            .withValues(values(v, k.id, tz)).build());
                    opKeys.add(null);
                    opSigs.add(null);
                    map.put(v.key, new String[]{have[0], sig});
                    r.updated++;
                } else {
                    ops.add(ContentProviderOperation.newInsert(CalendarContract.Events.CONTENT_URI).withValues(values(v, k.id, tz)).build());
                    opKeys.add(v.key);
                    opSigs.add(sig);
                    map.remove(v.key);
                    r.added++;
                }
            }
            apply(cr, ops, opKeys, map, opSigs);
            saveMap(c, map);
            r.total = map.size();
            sp(c).edit().putLong("map_cal", k.id).putLong("last_run", System.currentTimeMillis())
                    .putInt("last_total", r.total).putString("sig", settingsSig(loc)).apply();
            r.ok = true;
            if (Log.isLoggable(TAG, Log.DEBUG))
                Log.d(TAG, "sync ok total=" + r.total + " +" + r.added + " ~" + r.updated + " -" + r.removed + " cal=" + k.id);
        } catch (Throwable t) {
            Log.e(TAG, "sync failed", t);
            r.error = String.valueOf(t.getMessage());
        }
        return r;
    }

    /** כיבוי: מוחקים את כל האירועים שלנו מהיומן ומבטלים את העבודה היומית. */
    public static synchronized Result disable(Context c) {
        Result r = new Result();
        sp(c).edit().putBoolean("on", false).apply();
        cancelJob(c);
        if (!hasPermission(c)) {
            r.error = "perm";
            return r;
        }
        ContentResolver cr = c.getContentResolver();
        try {
            Map<String, String[]> map = loadMap(c);
            Set<Long> ids = new HashSet<>();
            for (String[] v : map.values()) ids.add(Long.parseLong(v[0]));
            long calId = sp(c).getLong("map_cal", sp(c).getLong("cal_id", -1));
            if (calId >= 0) ids.addAll(orphans(cr, calId, new HashSet<>()));
            List<ContentProviderOperation> ops = new ArrayList<>();
            List<String> keys = new ArrayList<>(), sigs = new ArrayList<>();
            for (long id : ids) {
                ops.add(ContentProviderOperation.newDelete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id)).build());
                keys.add(null);
                sigs.add(null);
            }
            apply(cr, ops, keys, new HashMap<>(), sigs);
            r.removed = ids.size();
            sp(c).edit().remove("map").remove("map_cal").remove("sig").putInt("last_total", 0).apply();
            r.ok = true;
        } catch (Throwable t) {
            Log.e(TAG, "disable failed", t);
            r.error = String.valueOf(t.getMessage());
        }
        return r;
    }

    // ═══════════════════════ עדכון אוטומטי ═══════════════════════

    /** עבודה יומית (נשמרת גם אחרי הפעלה מחדש של הטלפון) שמגלגלת את החלון קדימה. */
    static void scheduleJob(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null) return;
            for (JobInfo j : js.getAllPendingJobs()) if (j.getId() == JOB_ID) return;
            js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, CalJob.class))
                    .setPeriodic(24 * 3600000L)
                    .setPersisted(true)
                    .setRequiresBatteryNotLow(true)
                    .build());
        } catch (Throwable t) {
            Log.w(TAG, "schedule", t);
        }
    }

    static void cancelJob(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js != null) js.cancel(JOB_ID);
        } catch (Throwable ignored) {
        }
    }

    /** הגדרות חדשות מהאתר (עיר, דקות הדלקה, נוסח) — מסנכרנים מחדש רק אם משהו מהן השתנה. */
    public static void onSettingsChanged(Context c) {
        if (!enabled(c) || !hasPermission(c)) return;
        Loc loc = Sync.loc(c);
        if (settingsSig(loc).equals(sp(c).getString("sig", ""))) return;
        run(c);
    }
}
