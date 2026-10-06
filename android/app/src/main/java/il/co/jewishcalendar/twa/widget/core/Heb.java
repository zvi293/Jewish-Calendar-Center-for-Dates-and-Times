package il.co.jewishcalendar.twa.widget.core;

import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;
import com.kosherjava.zmanim.hebrewcalendar.JewishDate;

import java.util.Calendar;
import java.util.TimeZone;

/** עיצוב עברי: גימטריה עם גרש/גרשיים, שמות חודשים (באיות של האתר), ימי השבוע, שעות. */
public final class Heb {
    private Heb() {}

    public static final char GERESH = '׳';
    public static final char GERSHAYIM = '״';

    private static final String[] ONES = {"", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"};
    private static final String[] TENS = {"", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"};
    private static final String[] HUNDREDS = {"", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"};

    /** 25 → כ״ה, 15 → ט״ו, 5787 → תשפ״ז (בלי האלפים). */
    public static String num(int n) {
        n = n % 1000;
        if (n <= 0) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(HUNDREDS[n / 100]);
        int r = n % 100;
        if (r == 15) sb.append("טו");
        else if (r == 16) sb.append("טז");
        else {
            sb.append(TENS[r / 10]);
            sb.append(ONES[r % 10]);
        }
        String s = sb.toString();
        if (s.length() == 1) return s + GERESH;
        return s.substring(0, s.length() - 1) + GERSHAYIM + s.substring(s.length() - 1);
    }

    /** בלי גרשיים — לשמות קצרים כמו "דף יח". */
    public static String numPlain(int n) {
        return num(n).replace(String.valueOf(GERSHAYIM), "").replace(String.valueOf(GERESH), "");
    }

    /** שם החודש באיות של האתר (Intl he-u-ca-hebrew): חשוון, סיוון, אדר א׳/ב׳. */
    public static String month(JewishDate jd) {
        int mo = jd.getJewishMonth();
        boolean leap = jd.isJewishLeapYear();
        switch (mo) {
            case JewishDate.NISSAN: return "ניסן";
            case JewishDate.IYAR: return "אייר";
            case JewishDate.SIVAN: return "סיוון";
            case JewishDate.TAMMUZ: return "תמוז";
            case JewishDate.AV: return "אב";
            case JewishDate.ELUL: return "אלול";
            case JewishDate.TISHREI: return "תשרי";
            case JewishDate.CHESHVAN: return "חשוון";
            case JewishDate.KISLEV: return "כסלו";
            case JewishDate.TEVES: return "טבת";
            case JewishDate.SHEVAT: return "שבט";
            case JewishDate.ADAR: return leap ? "אדר א" + GERESH : "אדר";
            case JewishDate.ADAR_II: return "אדר ב" + GERESH;
            default: return "";
        }
    }

    /** מפתח החודש בטבלת ההילולות של האתר (_hilMonthKey): אדר ב׳ → "אדר", אדר א׳ → "אדר א". */
    public static String hilulaMonthKey(JewishDate jd) {
        int mo = jd.getJewishMonth();
        if (mo == JewishDate.ADAR_II) return "אדר";
        if (mo == JewishDate.ADAR && jd.isJewishLeapYear()) return "אדר א";
        return month(jd);
    }

    /** "כ״ה תשרי" */
    public static String dayMonth(JewishDate jd) {
        return num(jd.getJewishDayOfMonth()) + " " + month(jd);
    }

    /** "כ״ה בתשרי" */
    public static String dayOfMonth(JewishDate jd) {
        return num(jd.getJewishDayOfMonth()) + " ב" + month(jd);
    }

    public static String year(JewishDate jd) {
        return num(jd.getJewishYear());
    }

    private static final String[] WD = {"", "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"};
    private static final String[] WD_LETTER = {"", "א" + GERESH, "ב" + GERESH, "ג" + GERESH, "ד" + GERESH, "ה" + GERESH, "ו" + GERESH, "ש" + GERESH};

    /** 1=ראשון … 7=שבת (Calendar.DAY_OF_WEEK). */
    public static String weekday(int dow) {
        return dow == 7 ? "שבת קודש" : "יום " + WD[dow];
    }

    public static String weekdayShort(int dow) {
        return dow == 7 ? "שבת" : "יום " + WD_LETTER[dow];
    }

    public static String weekdayLetter(int dow) {
        return WD_LETTER[dow];
    }

    public static String weekdayName(int dow) {
        return WD[dow];
    }

    private static final String[] GREG_MONTH = {"ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"};

    /** "6 באוקטובר 2026" */
    public static String greg(int y, int m, int d) {
        return d + " ב" + GREG_MONTH[m - 1] + " " + y;
    }

    public static String gregShort(int m, int d) {
        return d + "." + m;
    }

    /** HH:mm באזור הזמן של המיקום. */
    public static String time(long ms, TimeZone tz) {
        Calendar c = Calendar.getInstance(tz);
        c.setTimeInMillis(ms);
        int h = c.get(Calendar.HOUR_OF_DAY), mi = c.get(Calendar.MINUTE);
        return (h < 10 ? "0" : "") + h + ":" + (mi < 10 ? "0" : "") + mi;
    }

    /** משך כטקסט: "26 דק׳", "3:05 שע׳", "2 ימים". */
    public static String duration(long msLeft) {
        long min = Math.max(0, (msLeft + 59999) / 60000);
        if (min < 60) return min + " דק" + GERESH;
        long h = min / 60, mm = min % 60;
        if (h < 24) return h + ":" + (mm < 10 ? "0" : "") + mm + " שע" + GERESH;
        long days = h / 24;
        return days == 1 ? "יום אחד" : days + " ימים";
    }

    public static String days(long n) {
        if (n == 1) return "יום אחד";
        if (n == 2) return "יומיים";
        return n + " ימים";
    }

    public static boolean isLeap(JewishCalendar jc) {
        return jc.isJewishLeapYear();
    }
}
