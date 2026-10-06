package il.co.jewishcalendar.twa.widget.core;

import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;
import com.kosherjava.zmanim.hebrewcalendar.JewishDate;

import java.util.Calendar;

/**
 * ברכת הלבנה — העתק של _levanaMoladMs/_levanaWindow/_levanaStatus באתר:
 * המולד לפי החשבון (כ"ט י"ב תשצ"ג) בשעון ירושלים הממוצע; תחילה — 3 ימים
 * מהמולד באשכנז, 7 בספרד ובעדות המזרח; סוף — חצי כ"ט י"ב תשצ"ג (רמ"א), ולעדות
 * המזרח עד ט"ו יום שלמים ("לדעת מרן"); בתשרי — לא לפני מוצאי יום הכיפורים, באב —
 * לא לפני מוצאי תשעה באב (נדחה — ביום ראשון).
 */
public final class Levana {
    private Levana() {}

    static final long DAY = 86400000L;
    static final long PARTS_DAY = 25920L;
    static final long MONTH_PARTS = 765433L;
    static final double MONTH_MS = MONTH_PARTS * (double) DAY / PARTS_DAY;
    static final double JLMT_MS = 35.2354 * 4 * 60000;

    public static double moladMs(long n) {
        long parts = -876 + n * MONTH_PARTS;
        long days = Math.floorDiv(parts, PARTS_DAY);
        long rem = parts - days * PARTS_DAY;
        return (days - 2092590L) * (double) DAY + rem * (double) DAY / PARTS_DAY - JLMT_MS;
    }

    public static long moladIndexAt(long ms) {
        long n = (long) Math.floor((ms - moladMs(0)) / MONTH_MS);
        while (moladMs(n + 1) <= ms) n++;
        while (moladMs(n) > ms) n--;
        return n;
    }

    public static final class Window {
        public long n;
        public long molad, start3, start7, end, end15, start, fin;
        public String special; // tishrei | av | null
        public String month = ""; // החודש (לפי ז' ימים אחרי המולד)
    }

    public static final class Status {
        public Window w;
        public String state; // before | open | grace
        public long target;
        /** תחילת ההמתנה (לפס ההתקדמות): סוף הזמן הקודם, או המולד. */
        public long from;
    }

    public static Window window(Engine e, long n) {
        String nusach = e.loc.nusach;
        Window w = new Window();
        w.n = n;
        double mol = moladMs(n);
        w.molad = Math.round(mol);
        w.start3 = Math.round(mol + 3 * DAY);
        w.start7 = Math.round(mol + 7 * DAY);
        w.end = Math.round(mol + MONTH_MS / 2);
        w.end15 = Math.round(mol + 15 * DAY);
        w.start = "ashkenaz".equals(nusach) ? w.start3 : w.start7;
        w.fin = "mizrahi".equals(nusach) ? w.end15 : w.end;
        JewishCalendar jc = jcAt(e, w.start7);
        w.month = Heb.month(jc);
        int mo = jc.getJewishMonth();
        if (mo == JewishDate.TISHREI || mo == JewishDate.AV) {
            w.special = mo == JewishDate.TISHREI ? "tishrei" : "av";
            Long fe = fastEnd(e, w.start7, mo == JewishDate.TISHREI ? 10 : 9, mo == JewishDate.AV);
            if (fe != null && fe > w.start) w.start = fe;
        }
        return w;
    }

    private static JewishCalendar jcAt(Engine e, long ms) {
        Calendar c = e.cal();
        c.setTimeInMillis(ms);
        return Day.jewish(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /** צאת הכוכבים של יום הצום (י' תשרי / ט' באב, שבת → ראשון). */
    private static Long fastEnd(Engine e, long probeMs, int hebDay, boolean satToSun) {
        Calendar c = e.cal();
        c.setTimeInMillis(probeMs);
        c.set(Calendar.HOUR_OF_DAY, 12);
        int cur = Day.jewish(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH)).getJewishDayOfMonth();
        c.add(Calendar.DAY_OF_MONTH, hebDay - cur);
        if (satToSun && c.get(Calendar.DAY_OF_WEEK) == Calendar.SATURDAY) c.add(Calendar.DAY_OF_MONTH, 1);
        Day z = Day.compute(e.loc, c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
        return z.tzeit;
    }

    public static Status status(Engine e) {
        long n = moladIndexAt(e.now);
        Window w = window(e, n);
        long from = w.molad;
        if (e.now >= w.fin) {
            from = w.fin;
            w = window(e, n + 1);
        }
        Status s = new Status();
        s.from = from;
        s.w = w;
        s.state = e.now < w.start ? "before" : e.now < w.end ? "open" : "grace";
        s.target = "before".equals(s.state) ? w.start : "open".equals(s.state) ? w.end : w.fin;
        return s;
    }

    /** גיל הירח בימים מהמולד האחרון, ושבר ההארה (0..1). */
    public static double ageDays(long now) {
        long n = moladIndexAt(now);
        return (now - moladMs(n)) / DAY;
    }

    public static double illumination(double age) {
        return (1 - Math.cos(2 * Math.PI * age / 29.530588)) / 2;
    }
}
