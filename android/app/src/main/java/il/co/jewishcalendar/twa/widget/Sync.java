package il.co.jewishcalendar.twa.widget;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import il.co.jewishcalendar.twa.cal.CalSync;
import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * הודעות מהאתר דרך ערוץ ה-PostMessage של ה-TWA (LauncherActivity ↔ lux.js appBridge).
 * ההודעה היחידה: {"t":"sync", ...} — עיר, נוסח, שיטה, סדרי לימוד וטבלת ההילולות.
 */
public final class Sync {
    private Sync() {}

    /** הודעת הפתיחה שהאפליקציה שולחת לדף עם ה-port. */
    public static final String HELLO = "jc-widgets-hello";

    /**
     * היכולות של גרסת האפליקציה הזו (1.1.3+) — נשלחת אחרי HELLO. cal = סנכרון אוטומטי ליומן
     * הטלפון: בלוח החודשי של האתר כפתור "ליומן הטלפון" מחליף את הורדת הקובץ (index.html: jc-cal-sync).
     */
    public static final String CAPS = "{\"t\":\"caps\",\"cal\":1}";

    public static void onMessage(Context c, String msg) {
        if (msg == null || msg.length() > 2_000_000 || !msg.startsWith("{")) return;
        final Context app = c.getApplicationContext();
        new Thread(() -> {
            try {
                JSONObject j = new JSONObject(msg);
                if (!"sync".equals(j.optString("t"))) return;
                if (Prefs.saveSync(app, j)) Updater.updateAll(app);
                // עיר/דקות הדלקה/נוסח חדשים — גם היומן מתעדכן (רק אם משהו שמשפיע עליו השתנה)
                CalSync.onSettingsChanged(app);
            } catch (Throwable t) {
                Log.w("JcWidgets", "bad sync message", t);
            }
        }, "jc-sync").start();
    }

    /** ההגדרות שהאתר שלח (או ברירת המחדל) — לסנכרון היומן. */
    public static Loc loc(Context c) {
        return Prefs.loc(c);
    }

    /**
     * האם האתר כבר נטען פעם אחת באפליקציה (= יש לכרום עותק אופליין). מי שכבר קיבל סנכרון
     * הגדרות מגרסה קודמת — נחשב כמי שנטען.
     */
    public static boolean siteLoaded(Context c) {
        return Prefs.sp(c).getBoolean("site_loaded", false) || Prefs.sp(c).contains("sync");
    }

    public static void markSiteLoaded(Context c) {
        if (!Prefs.sp(c).getBoolean("site_loaded", false)) Prefs.sp(c).edit().putBoolean("site_loaded", true).apply();
    }
}
