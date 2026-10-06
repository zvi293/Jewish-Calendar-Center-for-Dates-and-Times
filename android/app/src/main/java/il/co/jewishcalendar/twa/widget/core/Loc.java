package il.co.jewishcalendar.twa.widget.core;

import java.util.TimeZone;

/**
 * ההגדרות שהווידג'טים מחשבים לפיהן — מגיעות מהאתר בסנכרון (lux.js appBridge):
 * מיקום, דקות הדלקת הנרות (40 בירושלים / 20 בארץ / 18 בחו"ל — אותה הכרעה כמו
 * computeKosherZmanim), נוסח ושיטת הזמנים (מג"א/גר"א). עד הסנכרון הראשון —
 * ברירת המחדל של האתר: פתח תקווה, עדות המזרח, מג"א.
 */
public final class Loc {
    public final String name;
    public final double lat, lon, elev;
    public final String tz;
    public final int candle;
    public final String nusach;   // mizrahi | sefard | ashkenaz
    public final String method;   // MGA | GRA
    public final boolean synced;

    public Loc(String name, double lat, double lon, double elev, String tz, int candle,
               String nusach, String method, boolean synced) {
        this.name = name == null ? "" : name;
        this.lat = lat;
        this.lon = lon;
        this.elev = elev;
        this.tz = tz == null || tz.isEmpty() ? "Asia/Jerusalem" : tz;
        this.candle = candle > 0 ? candle : 20;
        this.nusach = nusach == null ? "mizrahi" : nusach;
        this.method = "GRA".equals(method) ? "GRA" : "MGA";
        this.synced = synced;
    }

    /** ברירת המחדל של האתר (עיר 293918 — אותן קואורדינטות שהאתר שומר, גובה 0). */
    public static Loc defaults() {
        return new Loc("פתח תקווה", 32.08707, 34.88747, 0, "Asia/Jerusalem", 20, "mizrahi", "MGA", false);
    }

    public TimeZone timeZone() {
        return TimeZone.getTimeZone(tz);
    }
}
