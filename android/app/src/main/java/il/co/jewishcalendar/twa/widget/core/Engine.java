package il.co.jewishcalendar.twa.widget.core;

import com.kosherjava.zmanim.hebrewcalendar.HebrewDateFormatter;
import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;
import com.kosherjava.zmanim.hebrewcalendar.JewishDate;
import com.kosherjava.zmanim.hebrewcalendar.YomiCalculator;
import com.kosherjava.zmanim.hebrewcalendar.Daf;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

/**
 * מנוע הווידג'טים: כל מה שמוצג במסך הבית מחושב כאן מתוך המיקום וההגדרות (Loc)
 * והרגע הנוכחי — בלי רשת ובלי האתר. Java טהורה (בלי אנדרואיד), כך שאפשר לבדוק
 * אותה מול האתר במחשב (ראו android/widget-tests).
 *
 * כללי היום העברי (בקשת המשתמש): התאריך העברי מתחלף בשקיעה; ספירת העומר
 * וההילולות — בצאת הכוכבים (כמו באתר); הדף היומי והתהילים — לפי היום האזרחי
 * (כמו באתר).
 */
public final class Engine {
    public static final long MIN = 60000L, HOUR = 3600000L, DAY = 86400000L;

    public final Loc loc;
    public final long now;
    public final TimeZone tz;
    private final Map<String, Day> cache = new HashMap<>();
    /** התאריך האזרחי של "עכשיו" במיקום. */
    public final int y, m, d, dow;

    public Engine(Loc loc, long now) {
        this.loc = loc;
        this.now = now;
        this.tz = loc.timeZone();
        Calendar c = cal();
        c.setTimeInMillis(now);
        y = c.get(Calendar.YEAR);
        m = c.get(Calendar.MONTH) + 1;
        d = c.get(Calendar.DAY_OF_MONTH);
        dow = c.get(Calendar.DAY_OF_WEEK);
    }

    public Calendar cal() {
        return Calendar.getInstance(tz);
    }

    /** היום האזרחי today+offset. */
    public Day day(int offset) {
        Calendar c = cal();
        c.clear();
        c.set(y, m - 1, d, 12, 0, 0);
        c.add(Calendar.DAY_OF_MONTH, offset);
        int yy = c.get(Calendar.YEAR), mm = c.get(Calendar.MONTH) + 1, dd = c.get(Calendar.DAY_OF_MONTH);
        String k = yy + "-" + mm + "-" + dd;
        Day z = cache.get(k);
        if (z == null) {
            z = Day.compute(loc, yy, mm, dd);
            cache.put(k, z);
        }
        return z;
    }

    private final Map<Integer, JewishCalendar> jcCache = new HashMap<>();

    /** התאריך העברי של היום האזרחי today+offset — בלי חישוב זמנים (לסריקות ארוכות). */
    public JewishCalendar jcOf(int offset) {
        JewishCalendar jc = jcCache.get(offset);
        if (jc == null) {
            Calendar c = cal();
            c.clear();
            c.set(y, m - 1, d, 12, 0, 0);
            c.add(Calendar.DAY_OF_MONTH, offset);
            jc = Day.jewish(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
            jcCache.put(offset, jc);
        }
        return jc;
    }

    /** "4.12" של היום האזרחי today+offset. */
    public String gregOf(int offset) {
        Calendar c = cal();
        c.clear();
        c.set(y, m - 1, d, 12, 0, 0);
        c.add(Calendar.DAY_OF_MONTH, offset);
        return Heb.gregShort(c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    public int dowOf(int offset) {
        return ((dow - 1 + offset) % 7 + 7) % 7 + 1;
    }

    /** חצות האזרחית הבאה. */
    public long nextMidnight() {
        Calendar c = cal();
        c.clear();
        c.set(y, m - 1, d, 0, 0, 0);
        c.add(Calendar.DAY_OF_MONTH, 1);
        return c.getTimeInMillis();
    }

    public long midnightOf(int offset) {
        Calendar c = cal();
        c.clear();
        c.set(y, m - 1, d, 0, 0, 0);
        c.add(Calendar.DAY_OF_MONTH, offset);
        return c.getTimeInMillis();
    }

    private static long or(Long v, long def) {
        return v == null ? def : v;
    }

    /** אחרי השקיעה — כבר היום העברי הבא. */
    public boolean afterSunset() {
        return now >= or(day(0).sunset, Long.MAX_VALUE);
    }

    public boolean afterTzeit() {
        return now >= or(day(0).tzeit, Long.MAX_VALUE);
    }

    /** התאריך העברי עכשיו — מתחלף בשקיעה. */
    public JewishCalendar hebNow() {
        return afterSunset() ? day(1).jc : day(0).jc;
    }

    /** ההיסט האזרחי של היום העברי הנוכחי (0 או 1). */
    public int hebOffset() {
        return afterSunset() ? 1 : 0;
    }

    // ═══════════════════════ שמות ימים מיוחדים ═══════════════════════

    public static String yomTovName(JewishCalendar jc) {
        int i = jc.getYomTovIndex();
        switch (i) {
            case JewishCalendar.EREV_PESACH: return "ערב פסח";
            case JewishCalendar.PESACH: return jc.getJewishDayOfMonth() == 21 ? "שביעי של פסח" : "פסח";
            case JewishCalendar.CHOL_HAMOED_PESACH: return "חול המועד פסח";
            case JewishCalendar.PESACH_SHENI: return "פסח שני";
            case JewishCalendar.EREV_SHAVUOS: return "ערב שבועות";
            case JewishCalendar.SHAVUOS: return "שבועות";
            case JewishCalendar.SEVENTEEN_OF_TAMMUZ: return "י״ז בתמוז";
            case JewishCalendar.TISHA_BEAV: return "תשעה באב";
            case JewishCalendar.TU_BEAV: return "ט״ו באב";
            case JewishCalendar.EREV_ROSH_HASHANA: return "ערב ראש השנה";
            case JewishCalendar.ROSH_HASHANA: return jc.getJewishDayOfMonth() == 2 ? "ראש השנה ב׳" : "ראש השנה";
            case JewishCalendar.FAST_OF_GEDALYAH: return "צום גדליה";
            case JewishCalendar.EREV_YOM_KIPPUR: return "ערב יום כיפור";
            case JewishCalendar.YOM_KIPPUR: return "יום כיפור";
            case JewishCalendar.EREV_SUCCOS: return "ערב סוכות";
            case JewishCalendar.SUCCOS: return "סוכות";
            case JewishCalendar.CHOL_HAMOED_SUCCOS: return "חול המועד סוכות";
            case JewishCalendar.HOSHANA_RABBA: return "הושענא רבה";
            case JewishCalendar.SHEMINI_ATZERES: return "שמיני עצרת · שמחת תורה";
            case JewishCalendar.SIMCHAS_TORAH: return "שמחת תורה";
            case JewishCalendar.CHANUKAH: return "חנוכה";
            case JewishCalendar.TENTH_OF_TEVES: return "עשרה בטבת";
            case JewishCalendar.TU_BESHVAT: return "ט״ו בשבט";
            case JewishCalendar.FAST_OF_ESTHER: return "תענית אסתר";
            case JewishCalendar.PURIM: return "פורים";
            case JewishCalendar.SHUSHAN_PURIM: return "שושן פורים";
            case JewishCalendar.PURIM_KATAN: return "פורים קטן";
            case JewishCalendar.SHUSHAN_PURIM_KATAN: return "שושן פורים קטן";
            case JewishCalendar.YOM_HASHOAH: return "יום השואה";
            case JewishCalendar.YOM_HAZIKARON: return "יום הזיכרון";
            case JewishCalendar.YOM_HAATZMAUT: return "יום העצמאות";
            case JewishCalendar.YOM_YERUSHALAYIM: return "יום ירושלים";
            case JewishCalendar.LAG_BAOMER: return "ל״ג בעומר";
            default: return null;
        }
    }

    public static boolean isFastDay(JewishCalendar jc) {
        int i = jc.getYomTovIndex();
        return i == JewishCalendar.FAST_OF_GEDALYAH || i == JewishCalendar.TENTH_OF_TEVES
                || i == JewishCalendar.FAST_OF_ESTHER || i == JewishCalendar.SEVENTEEN_OF_TAMMUZ
                || i == JewishCalendar.TISHA_BEAV || i == JewishCalendar.YOM_KIPPUR;
    }

    /** שבת או יום טוב שאסור במלאכה. */
    public static boolean isHoly(JewishCalendar jc) {
        return jc.getDayOfWeek() == 7 || jc.isYomTovAssurBemelacha();
    }

    /** "מה מיוחד היום" — שורה קצרה מתחת לתאריך (עד שני פריטים). */
    public String specialToday() {
        JewishCalendar h = hebNow();
        List<String> parts = new ArrayList<>();
        String yt = yomTovName(h);
        if (yt != null) parts.add(yt);
        if (h.isRoshChodesh()) parts.add("ראש חודש " + Heb.month(rcMonth(h)));
        if (h.isChanukah()) {
            parts.remove("חנוכה");
            parts.add("חנוכה · נר " + Heb.num(h.getDayOfChanukah()));
        }
        int dowH = h.getDayOfWeek();
        if (dowH == 7) {
            String p = shabbatTitle(h);
            if (p != null && !parts.contains(p)) parts.add(0, p);
        } else if (dowH == 6 && parts.isEmpty()) {
            JewishCalendar sat = afterSunset() ? day(2).jc : day(1).jc;
            String p = shabbatTitle(sat);
            parts.add("ערב שבת" + (p != null ? " · " + p : ""));
        }
        int omer = omerDay();
        if (omer > 0 && parts.size() < 2) parts.add(Heb.num(omer) + " לעומר");
        if (parts.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.size() && i < 2; i++) {
            if (i > 0) sb.append(" · ");
            sb.append(parts.get(i));
        }
        return sb.toString();
    }

    /** החודש שראש החודש שלו (ל' בחודש הקודם → החודש הבא). */
    private static JewishDate rcMonth(JewishCalendar h) {
        if (h.getJewishDayOfMonth() == 30) {
            JewishCalendar n = (JewishCalendar) h.clone();
            n.forward(Calendar.DATE, 1);
            return n;
        }
        return h;
    }

    // ═══════════════════════ זמני היום (פיפו) ═══════════════════════

    public static final class Row {
        public final String label, sub, key;
        public final long ms;
        public final boolean special;
        public String tag = ""; // "מחר" / שם יום
        public Row(String key, String label, String sub, long ms, boolean special) {
            this.key = key;
            this.label = label;
            this.sub = sub == null ? "" : sub;
            this.ms = ms;
            this.special = special;
        }
    }

    private void add(List<Row> out, String key, String label, String sub, Long ms, boolean special) {
        if (ms != null) out.add(new Row(key, label, sub, ms, special));
    }

    /** כל זמני "היום ההלכתי" של היום האזרחי offset (כולל הלילה שאחריו). */
    private List<Row> rowsOf(int off) {
        Day z = day(off), next = day(off + 1);
        JewishCalendar jc = z.jc, jcNext = next.jc;
        List<Row> r = new ArrayList<>();
        boolean fastMinor = isFastDay(jc) && jc.getYomTovIndex() != JewishCalendar.YOM_KIPPUR && jc.getYomTovIndex() != JewishCalendar.TISHA_BEAV;
        add(r, "alot", fastMinor ? "עלות השחר · תחילת הצום" : "עלות השחר", null, z.alot, fastMinor);
        add(r, "talit", "טלית ותפילין", null, z.misheyakir, false);
        add(r, "netz", "הנץ החמה", null, z.sunrise, false);
        add(r, "shmaMGA", "סוף ק״ש", "מג״א", z.shmaMGA, false);
        add(r, "shmaGRA", "סוף ק״ש", "הגר״א", z.shmaGRA, false);
        add(r, "tfilaMGA", "סוף תפילה", "מג״א", z.tfilaMGA, false);
        add(r, "tfilaGRA", "סוף תפילה", "הגר״א", z.tfilaGRA, false);
        add(r, "chatzot", "חצות היום", null, z.chatzot, false);
        add(r, "minchaG", "מנחה גדולה", null, z.minchaGedola, false);
        add(r, "minchaK", "מנחה קטנה", null, z.minchaKetana, false);
        add(r, "plagMGA", "פלג המנחה", "מג״א", z.plag, false);
        add(r, "plagGRA", "פלג המנחה", "הגר״א", z.plagGRA, false);

        boolean holyToday = isHoly(jc), holyTomorrow = isHoly(jcNext);
        boolean ykTomorrow = jcNext.getYomTovIndex() == JewishCalendar.YOM_KIPPUR;
        boolean av9Tomorrow = jcNext.getYomTovIndex() == JewishCalendar.TISHA_BEAV;
        // ערב שבת שהוא יום טוב — נרות שבת לפני השקיעה (מאש קיימת), לא בצאת הכוכבים (תוקן 10/2026)
        boolean shabbatTomorrow = jcNext.getDayOfWeek() == 7;
        // הדלקת נרות — ערב שבת או ערב יו"ט שאינו שבת/יו"ט בעצמו
        if (holyTomorrow && (!holyToday || shabbatTomorrow)) {
            add(r, "candle", ykTomorrow ? "הדלקת נרות · כניסת הצום" : holyToday ? "הדלקת נרות · מאש קיימת" : "הדלקת נרות", null, z.candle, true);
        }
        add(r, "shkia", av9Tomorrow ? "שקיעה · תחילת הצום" : "שקיעה", null, z.sunset, av9Tomorrow);
        add(r, "bein", "בין השמשות", null, z.bein, false);

        String tzLabel = "צאת הכוכבים";
        boolean tzSpecial = false;
        if (holyToday && holyTomorrow) {
            // יום טוב שני / יו"ט במוצאי שבת — מדליקים בצאת הכוכבים; ליל שבת — כבר הודלק לפני השקיעה
            tzLabel = shabbatTomorrow ? "צאת הכוכבים" : "צאת הכוכבים · הדלקת נרות";
            tzSpecial = !shabbatTomorrow;
        } else if (holyToday) {
            boolean sh = jc.getDayOfWeek() == 7, yt = jc.isYomTovAssurBemelacha();
            tzLabel = sh && yt ? "צאת השבת והחג" : sh ? "צאת השבת" : "צאת החג";
            if (jc.getYomTovIndex() == JewishCalendar.YOM_KIPPUR) tzLabel = "צאת החג · סוף הצום";
            tzSpecial = true;
        } else if (isFastDay(jc)) {
            tzLabel = "צאת הכוכבים · סוף הצום";
            tzSpecial = true;
        }
        add(r, "tzeit", tzLabel, null, z.tzeit, tzSpecial);
        add(r, "chatzotN", "חצות הלילה", null, z.chatzotNight, false);
        if (z.sunset != null && next.alot != null) {
            long span = next.alot - z.sunset;
            add(r, "ashm1", "אשמורת התיכונה", null, z.sunset + span / 3, false);
            add(r, "ashm2", "אשמורת הבוקר", null, z.sunset + span * 2 / 3, false);
        }
        return r;
    }

    /** הזמנים הבאים לפי הסדר — הקרוב ראשון (זמנים שעברו יורדים). */
    public List<Row> upcoming(int max) {
        List<Row> all = new ArrayList<>();
        for (int off = -1; off <= 2; off++) {
            List<Row> rs = rowsOf(off);
            for (Row r : rs) {
                if (r.ms <= now) continue;
                // הלילה של היום (חצות, אשמורות) שייך ליום שלו גם אחרי 00:00 — רק ימים הבאים מתויגים
                if (off == 1) r.tag = "מחר";
                else if (off == 2) r.tag = Heb.weekdayShort(dowOf(2));
                all.add(r);
            }
        }
        Collections.sort(all, (a, b) -> Long.compare(a.ms, b.ms));
        if (all.size() > max) return new ArrayList<>(all.subList(0, max));
        return all;
    }

    public Row nextZman() {
        List<Row> u = upcoming(2);
        return u.isEmpty() ? null : u.get(0);
    }

    public Row zmanAfterNext() {
        List<Row> u = upcoming(2);
        return u.size() < 2 ? null : u.get(1);
    }

    /** תפילה של עכשיו: שחרית מעלות השחר עד חצות, מנחה עד השקיעה, ערבית בלילה. */
    public String currentPrayer() {
        Day z = day(0);
        if (z.alot != null && now >= z.alot && z.chatzot != null && now < z.chatzot) return "shacharit";
        if (z.chatzot != null && now >= z.chatzot && z.sunset != null && now < z.sunset) return "mincha";
        return "maariv";
    }

    // ═══════════════════════ דף יומי, תהילים, עומר ═══════════════════════

    /** "בכורות דף י״ח" — כמו בתצוגה של hebcal/האתר. */
    public String dafYomi() {
        Daf daf = YomiCalculator.getDafYomiBavli(day(0).jc);
        return daf.getMasechta() + " דף " + Heb.num(daf.getDaf());
    }

    public String dafMasechet() {
        return YomiCalculator.getDafYomiBavli(day(0).jc).getMasechta();
    }

    public String dafNum() {
        return Heb.num(YomiCalculator.getDafYomiBavli(day(0).jc).getDaf());
    }

    private static final int[] TEH_FIRST = {0, 1, 10, 18, 23, 29, 35, 39, 44, 49, 55, 60, 66, 69, 72, 77, 79, 83, 88, 90, 97, 104, 106, 108, 113, 119, 119, 120, 135, 140, 145};
    private static final int[] TEH_LAST = {0, 9, 17, 22, 28, 34, 38, 43, 48, 54, 59, 65, 68, 71, 76, 78, 82, 87, 89, 96, 103, 105, 107, 112, 118, 119, 119, 134, 139, 144, 150};

    public int tehillimDay() {
        return Math.min(30, day(0).jc.getJewishDayOfMonth());
    }

    /** "קו-קז" — החלוקה החודשית (באתר); בחודש חסר ביום כ"ט קוראים גם את של ל'. */
    public String tehillimLabel() {
        int hd = tehillimDay();
        JewishCalendar jc = day(0).jc;
        if (hd == 29 && jc.getDaysInJewishMonth() == 29) return "קמ-קנ";
        return Texts.TEHILLIM_MONTHLY_LABEL[hd];
    }

    public int tehillimFirstChapter() {
        return TEH_FIRST[tehillimDay()];
    }

    /** פסוק התחלה (קיט מפסוק צ"ז ביום כ"ו). */
    public int tehillimFirstVerse() {
        return tehillimDay() == 26 ? 97 : 1;
    }

    public int tehillimCount() {
        int hd = tehillimDay();
        JewishCalendar jc = day(0).jc;
        int last = (hd == 29 && jc.getDaysInJewishMonth() == 29) ? 150 : TEH_LAST[hd];
        if (hd == 25 || hd == 26) return 1;
        return last - TEH_FIRST[hd] + 1;
    }

    /** יום הספירה — הלילה כבר סופרים מצאת הכוכבים (כמו באתר). 0 מחוץ לעומר. */
    public int omerDay() {
        return (afterTzeit() ? day(1).jc : day(0).jc).getDayOfOmer();
    }

    /** האם כבר צאת הכוכבים והספירה של הלילה כבר "פתוחה". */
    public boolean omerTonight() {
        return afterTzeit();
    }

    /** נוסח הספירה לפי הנוסח — העתק של _maarivOmerText באתר. */
    public static String omerText(int day, String nusach) {
        if (day < 1 || day > 49) return "";
        String t;
        if (day < 7) t = "הַיּוֹם " + Texts.OMER_DAYS[day] + " לָעֹמֶר";
        else {
            int w = day / 7, dd = day % 7;
            t = "הַיּוֹם " + Texts.OMER_DAYS[day] + " לָעֹמֶר, שֶׁהֵם " + Texts.OMER_WEEKS[w];
            if (dd > 0) t += " " + Texts.OMER_REMAINDER[dd];
        }
        if ("mizrahi".equals(nusach)) return t + ".";
        t = t.replaceFirst("\\s*ל[\\u0591-\\u05C7]*ע[\\u0591-\\u05C7]*מ[\\u0591-\\u05C7]*ר[\\u0591-\\u05C7]*,?", "");
        return t + " " + ("ashkenaz".equals(nusach) ? "בָּעֹמֶר" : "לָעֹמֶר") + ".";
    }

    /** ימים עד ליל ט"ז בניסן (תחילת הספירה) — מחוץ לעונה. */
    public int daysToOmer() {
        for (int i = 0; i < 400; i++) {
            JewishCalendar jc = jcOf(hebOffset() + i);
            if (jc.getJewishMonth() == JewishDate.NISSAN && jc.getJewishDayOfMonth() == 16) return i;
        }
        return -1;
    }

    // ═══════════════════════ פרשה ושבת ═══════════════════════

    /** "פרשת בראשית" / שם החג כשחל בשבת. */
    public static String shabbatTitle(JewishCalendar sat) {
        HebrewDateFormatter f = new HebrewDateFormatter();
        f.setHebrewFormat(true);
        JewishCalendar.Parsha p = sat.getParshah();
        if (p != null && p != JewishCalendar.Parsha.NONE) return "פרשת " + f.formatParsha(sat);
        String yt = yomTovName(sat);
        if (yt != null) return "שבת " + yt;
        return null;
    }

    /** השבת הקרובה (או השבת של עכשיו — עד צאת השבת). */
    public int shabbatOffset() {
        if (dow == 7) return afterTzeit() ? 7 : 0;
        return 7 - dow;
    }

    public static final class ShabbatInfo {
        public String title = "", special = "";
        public Long candle, havdala;
        public int daysUntil;
        public boolean now;
        public String candleDay = "", havdalaDay = "";
    }

    public ShabbatInfo shabbat() {
        int off = shabbatOffset();
        Day sat = day(off), fri = day(off - 1);
        ShabbatInfo s = new ShabbatInfo();
        String t = shabbatTitle(sat.jc);
        s.title = t == null ? "שבת קודש" : t;
        s.special = specialShabbat(sat.jc, off);
        // ערב שבת שהוא יו"ט — הדלקה מאש קיים באותה שעה; אחרת הדלקה רגילה ביום שישי
        s.candle = fri.candle;
        s.havdala = sat.tzeit;
        s.candleDay = Heb.weekdayLetter(6);
        s.havdalaDay = Heb.weekdayLetter(7);
        s.now = (s.candle != null && now >= s.candle) && (s.havdala != null && now < s.havdala);
        s.daysUntil = Math.max(0, off - 1);
        return s;
    }

    /** שבת מיוחדת: שקלים/זכור/פרה/החודש/הגדול/שובה/שירה/חזון/נחמו, מברכים, ר"ח, חנוכה. */
    public String specialShabbat(JewishCalendar sat, int satOffset) {
        List<String> out = new ArrayList<>();
        JewishCalendar.Parsha sp = sat.getSpecialShabbos();
        if (sp != null && sp != JewishCalendar.Parsha.NONE) {
            HebrewDateFormatter f = new HebrewDateFormatter();
            f.setHebrewFormat(true);
            String n = f.formatSpecialParsha(sat);
            if (n != null && !n.isEmpty()) {
                n = n.replace("החדש", "החודש");
                out.add(n.startsWith("שבת") ? n : "שבת " + n);
            }
        }
        if (sat.isRoshChodesh()) out.add("שבת ראש חודש");
        else if (sat.isChanukah()) out.add("שבת חנוכה");
        else {
            // מברכים: ראש חודש בשבוע שאחרי (לא לפני תשרי)
            for (int i = 1; i <= 7; i++) {
                JewishCalendar n = jcOf(satOffset + i);
                if (n.isRoshChodesh()) {
                    JewishDate mo = rcMonth(n);
                    if (mo.getJewishMonth() != JewishDate.TISHREI) out.add("שבת מברכים " + Heb.month(mo));
                    break;
                }
            }
        }
        if (out.isEmpty()) return "";
        return out.size() == 1 ? out.get(0) : out.get(0) + " · " + out.get(1);
    }

    // ═══════════════════════ חגים, מועדים ותעניות ═══════════════════════

    public static final int K_YT = 1, K_FAST = 2, K_DAY = 3;

    public static final class Occasion {
        public String name;
        public int kind;
        public int offset; // היום האזרחי הראשון (ביחס להיום)
        public Long start, end;
        public String startLabel = "", endLabel = "", note = "";
        public String startDay = "", endDay = "";
        public String dateLabel = ""; // "יום שישי · כ״ה בכסלו · 4.12"
    }

    private static boolean isOccasionStart(JewishCalendar jc, JewishCalendar prev) {
        int i = jc.getYomTovIndex();
        switch (i) {
            case JewishCalendar.ROSH_HASHANA:
                return jc.getJewishDayOfMonth() == 1;
            case JewishCalendar.CHANUKAH:
                return prev.getYomTovIndex() != JewishCalendar.CHANUKAH;
            case JewishCalendar.FAST_OF_GEDALYAH: case JewishCalendar.YOM_KIPPUR: case JewishCalendar.SUCCOS:
            case JewishCalendar.SHEMINI_ATZERES: case JewishCalendar.TENTH_OF_TEVES: case JewishCalendar.TU_BESHVAT:
            case JewishCalendar.FAST_OF_ESTHER: case JewishCalendar.PURIM: case JewishCalendar.SHUSHAN_PURIM:
            case JewishCalendar.PURIM_KATAN: case JewishCalendar.PESACH: case JewishCalendar.PESACH_SHENI:
            case JewishCalendar.YOM_HASHOAH: case JewishCalendar.YOM_HAZIKARON: case JewishCalendar.YOM_HAATZMAUT:
            case JewishCalendar.YOM_YERUSHALAYIM: case JewishCalendar.LAG_BAOMER: case JewishCalendar.SHAVUOS:
            case JewishCalendar.SEVENTEEN_OF_TAMMUZ: case JewishCalendar.TISHA_BEAV: case JewishCalendar.TU_BEAV:
                return true;
            default:
                return false;
        }
    }

    /** המועד הבא (או המועד שבעיצומו). */
    private Occasion occMemo;
    private boolean occDone;

    public Occasion nextOccasion() {
        if (occDone) return occMemo;
        occDone = true;
        for (int off = -8; off < 420; off++) {
            if (!isOccasionStart(jcOf(off), jcOf(off - 1))) continue;
            Occasion o = occasionAt(off);
            long endMs = o.end != null ? o.end : Long.MAX_VALUE;
            if (endMs > now) return occMemo = o;
        }
        return null;
    }

    private Occasion occasionAt(int off) {
        JewishCalendar jc = day(off).jc;
        int i = jc.getYomTovIndex();
        Occasion o = new Occasion();
        o.offset = off;
        o.dateLabel = Heb.weekday(dowOf(off)) + " · " + Heb.dayOfMonth(jc) + " · " + gregOf(off);
        o.name = yomTovName(jc);
        if (i == JewishCalendar.SHEMINI_ATZERES) o.name = "שמחת תורה";
        Day prev = day(off - 1), first = day(off);
        if (i == JewishCalendar.YOM_KIPPUR) {
            o.kind = K_FAST;
            o.start = prev.candle;
            o.startLabel = "כניסת הצום";
            o.end = first.tzeit;
            o.endLabel = "צאת הצום";
            o.startDay = Heb.weekdayLetter(dowOf(off - 1));
            o.endDay = Heb.weekdayLetter(dowOf(off));
        } else if (jc.isYomTovAssurBemelacha()) {
            o.kind = K_YT;
            int last = off;
            while (isHoly(jcOf(last + 1))) last++;
            if (prev.jc.getDayOfWeek() == 7 || prev.jc.isYomTovAssurBemelacha()) {
                o.start = prev.tzeit;
                o.startLabel = "הדלקת נרות";
                o.note = "מאש קיימת, בצאת הכוכבים";
            } else {
                o.start = prev.candle;
                o.startLabel = "הדלקת נרות";
            }
            o.startDay = Heb.weekdayLetter(dowOf(off - 1));
            o.end = day(last).tzeit;
            o.endLabel = day(last).jc.getDayOfWeek() == 7 ? "צאת השבת והחג" : "צאת החג";
            o.endDay = Heb.weekdayLetter(dowOf(last));
        } else if (isFastDay(jc)) {
            o.kind = K_FAST;
            if (i == JewishCalendar.TISHA_BEAV) {
                o.start = prev.sunset;
                o.startDay = Heb.weekdayLetter(dowOf(off - 1));
            } else {
                o.start = first.alot;
                o.startDay = Heb.weekdayLetter(dowOf(off));
            }
            o.startLabel = "תחילת הצום";
            o.end = first.tzeit;
            o.endLabel = "סוף הצום";
            o.endDay = Heb.weekdayLetter(dowOf(off));
        } else {
            o.kind = K_DAY;
            o.start = prev.sunset;
            int lastOff = off;
            if (i == JewishCalendar.CHANUKAH) {
                lastOff = off + 7;
                o.note = "נר ראשון: " + Heb.weekday(dowOf(off - 1)) + " בערב · " + Heb.gregShort(prev.m, prev.d);
            } else if (i == JewishCalendar.PURIM || i == JewishCalendar.SHUSHAN_PURIM) {
                o.note = "קריאת המגילה: " + Heb.weekday(dowOf(off - 1)) + " בערב ולמחרת בבוקר";
            } else {
                o.note = "";
            }
            o.end = day(lastOff).sunset;
        }
        return o;
    }

    /** ימים עד המועד — לפי היום העברי (מתחלף בשקיעה). */
    public int daysUntil(Occasion o) {
        return o.offset - hebOffset();
    }

    // ═══════════════════════ שעון הלכתי ═══════════════════════

    public static final class Clock {
        public boolean day;
        public int hour;       // 1..12
        public int minuteInHour; // 0..59 (דקות זמניות)
        public double progress; // 0..1 של היום/הלילה
        public long shaahMs;
        public long hourStart, hourEnd;
    }

    public Clock clock() {
        Day z = day(0);
        Clock c = new Clock();
        long sr = or(z.seaLevelSunrise, now), ss = or(z.seaLevelSunset, now + 1);
        long from, to;
        if (now >= sr && now < ss) {
            c.day = true;
            from = sr;
            to = ss;
        } else if (now >= ss) {
            from = ss;
            to = or(day(1).seaLevelSunrise, ss + 12 * HOUR);
        } else {
            from = or(day(-1).seaLevelSunset, sr - 12 * HOUR);
            to = sr;
        }
        c.shaahMs = Math.max(1, (to - from) / 12);
        double pos = (now - from) / (double) c.shaahMs;
        c.hour = Math.min(12, (int) Math.floor(pos) + 1);
        c.minuteInHour = (int) Math.floor((pos - Math.floor(pos)) * 60);
        c.progress = Math.max(0, Math.min(1, (now - from) / (double) (to - from)));
        c.hourStart = from + (long) (c.hour - 1) * c.shaahMs;
        c.hourEnd = c.hourStart + c.shaahMs;
        return c;
    }

    // ═══════════════════════ הילולות ═══════════════════════

    /** מפתח הילולת היום בטבלת האתר ("תשרי-1") — מתחלף בצאת הכוכבים כמו באתר. */
    public String hilulaKey() {
        JewishCalendar jc = afterTzeit() ? day(1).jc : day(0).jc;
        return Heb.hilulaMonthKey(jc) + "-" + jc.getJewishDayOfMonth();
    }

    public String hilulaDateLabel() {
        JewishCalendar jc = afterTzeit() ? day(1).jc : day(0).jc;
        return Heb.dayOfMonth(jc);
    }

    // ═══════════════════════ שלב השמיים (רקע הווידג'טים) ═══════════════════════

    public String skyPhase() {
        Day z = day(0);
        if (z.skyDawn == null || z.skyNight == null) return now >= or(z.sunrise, 0) && now < or(z.sunset, 0) ? "day" : "night";
        if (now < z.skyDawn) return "night";
        if (now < or(z.skyDay, z.skyDawn)) return "dawn";
        if (now < or(z.skyDusk, z.skyNight)) return "day";
        if (now < z.skyNight) return "dusk";
        return "night";
    }

    // ═══════════════════════ גבול העדכון הבא ═══════════════════════

    /** הרגע הבא שבו משהו בווידג'טים משתנה (זמן, שקיעה, חצות, לבנה, מועד). */
    public long nextBoundary() {
        long best = nextMidnight();
        for (int off = -1; off <= 1; off++) {
            for (Row r : rowsOf(off)) if (r.ms > now + 500 && r.ms < best) best = r.ms;
            Day z = day(off);
            Long[] extra = {z.candle, z.sunset, z.tzeit, z.alot, z.chatzot, z.seaLevelSunrise, z.seaLevelSunset, z.skyDawn, z.skyDay, z.skyDusk, z.skyNight};
            for (Long e : extra) if (e != null && e > now + 500 && e < best) best = e;
        }
        Levana.Status lv = Levana.status(this);
        if (lv != null && lv.target > now + 500 && lv.target < best) best = lv.target;
        Occasion o = nextOccasion();
        if (o != null) {
            if (o.start != null && o.start > now + 500 && o.start < best) best = o.start;
            if (o.end != null && o.end > now + 500 && o.end < best) best = o.end;
        }
        Clock c = clock();
        if (c.hourEnd > now + 500 && c.hourEnd < best) best = c.hourEnd;
        return best;
    }
}
