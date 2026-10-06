package il.co.jewishcalendar.twa.widget.core;

import com.kosherjava.zmanim.ComplexZmanimCalendar;
import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;
import com.kosherjava.zmanim.util.GeoLocation;

import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

/**
 * זמני יום אזרחי אחד — העתק נאמן של computeKosherZmanim ב-script.js (אותן מתודות
 * של KosherJava שממנה הועתקה KosherZmanim של האתר, ואותה הכרעה בכל שדה):
 * עלות 72 דק', משיכיר 11.5°/11°, ק"ש, תפילה ופלג המנחה מג"א/גר"א, צאת 7.083°, בין השמשות ר"ת 2 כוכבים, הדלקת נרות
 * לפי שקיעה בגובה פני הים פחות 40/20/18 דק'. useElevation=false כמו באתר — הזמנים
 * ההלכתיים לפי גובה פני הים, הנץ והשקיעה המוצגים מותאמים לגובה.
 * כל הערכים במילישניות (UTC); null כשאין (למשל באזורים קוטביים).
 */
public final class Day {
    public final int y, m, d; // תאריך אזרחי, m = 1..12
    public final JewishCalendar jc; // התאריך העברי של היום (בשעות היום)
    public Long alot, misheyakir, misheyakirMachmir, sunrise, seaLevelSunrise;
    public Long shmaMGA, shmaGRA, tfilaMGA, tfilaGRA, chatzot;
    public Long minchaGedola, minchaGedola72, minchaKetana, plag, plagGRA;
    public Long sunset, seaLevelSunset, tzeit, tzeit50, tzeit13z, bein, chatzotNight, candle;
    /** שלבי השמיים כמו ב-sky.js (phaseOf): השמש מעל 8° — יום, מעל ‎-7° — שחר/דמדומים, אחרת לילה. */
    public Long skyDawn, skyDay, skyDusk, skyNight;

    private Day(int y, int m, int d, JewishCalendar jc) {
        this.y = y;
        this.m = m;
        this.d = d;
        this.jc = jc;
    }

    private static Long ms(Date x) {
        return x == null ? null : x.getTime();
    }

    public static JewishCalendar jewish(int y, int m, int d) {
        JewishCalendar jc = new JewishCalendar();
        jc.setGregorianDate(y, m - 1, d);
        // לוח ארץ ישראל תמיד — כמו באתר (i=on בכל בקשות hebcal)
        jc.setInIsrael(true);
        jc.setUseModernHolidays(true);
        return jc;
    }

    public static Day compute(Loc loc, int y, int m, int d) {
        TimeZone tz = loc.timeZone();
        GeoLocation geo = new GeoLocation("loc", loc.lat, loc.lon, loc.elev, tz);
        ComplexZmanimCalendar c = new ComplexZmanimCalendar(geo);
        Calendar cal = Calendar.getInstance(tz);
        cal.clear();
        cal.set(y, m - 1, d, 12, 0, 0);
        c.setCalendar(cal);
        c.setUseElevation(false);

        Day z = new Day(y, m, d, jewish(y, m, d));
        z.alot = ms(c.getAlos72());
        z.misheyakir = ms(c.getMisheyakir11Point5Degrees());
        z.misheyakirMachmir = ms(c.getMisheyakir11Degrees());
        z.sunrise = ms(c.getSunrise());
        z.seaLevelSunrise = ms(c.getSeaLevelSunrise());
        z.shmaMGA = ms(c.getSofZmanShmaMGA());
        z.shmaGRA = ms(c.getSofZmanShmaGRA());
        z.tfilaMGA = ms(c.getSofZmanTfilaMGA());
        z.tfilaGRA = ms(c.getSofZmanTfilaGRA());
        z.chatzot = ms(c.getChatzos());
        z.minchaGedola = ms(c.getMinchaGedola());
        z.minchaGedola72 = ms(c.getMinchaGedola72Minutes());
        z.minchaKetana = ms(c.getMinchaKetana());
        // פלג המנחה — כמו באתר (10/2026): מג"א לפי עלות–צאת 72 דק', הגר"א לפי הנץ–שקיעה
        z.plag = ms(c.getPlagHamincha72Minutes());
        z.plagGRA = ms(c.getPlagHamincha());
        z.sunset = ms(c.getSunset());
        z.seaLevelSunset = ms(c.getSeaLevelSunset());
        z.tzeit = ms(c.getTzaisGeonim7Point083Degrees());
        if (z.tzeit == null) z.tzeit = ms(c.getTzais72());
        z.tzeit50 = ms(c.getTzais50());
        if (z.sunrise != null && z.sunset != null) {
            double shaah = (z.sunset - z.sunrise) / 12.0;
            z.tzeit13z = z.sunset + Math.round(13.5 / 60.0 * shaah);
        }
        z.chatzotNight = ms(c.getSolarMidnight());
        z.bein = ms(c.getBainHashmashosRT2Stars());
        if (z.bein == null) z.bein = ms(c.getBainHashmashosRT13Point24Degrees());
        Long cs = z.seaLevelSunset != null ? z.seaLevelSunset : z.sunset;
        if (cs != null) z.candle = cs - loc.candle * 60000L;
        z.skyDawn = ms(c.getSunriseOffsetByDegrees(97));
        z.skyDay = ms(c.getSunriseOffsetByDegrees(82));
        z.skyDusk = ms(c.getSunsetOffsetByDegrees(82));
        z.skyNight = ms(c.getSunsetOffsetByDegrees(97));
        return z;
    }

    /** שעה זמנית לפי הגר"א בגובה פני הים (כמו ק"ש/תפילה של האתר). */
    public long shaahZmanitGra() {
        if (seaLevelSunrise == null || seaLevelSunset == null) return 3600000L;
        return (seaLevelSunset - seaLevelSunrise) / 12;
    }
}
