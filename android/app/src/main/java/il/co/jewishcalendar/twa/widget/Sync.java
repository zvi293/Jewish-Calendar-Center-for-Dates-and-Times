package il.co.jewishcalendar.twa.widget;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

/**
 * הודעות מהאתר דרך ערוץ ה-PostMessage של ה-TWA (LauncherActivity ↔ lux.js appBridge).
 * ההודעה היחידה: {"t":"sync", ...} — עיר, נוסח, שיטה, סדרי לימוד וטבלת ההילולות.
 */
public final class Sync {
    private Sync() {}

    /** הודעת הפתיחה שהאפליקציה שולחת לדף עם ה-port. */
    public static final String HELLO = "jc-widgets-hello";

    public static void onMessage(Context c, String msg) {
        if (msg == null || msg.length() > 2_000_000 || !msg.startsWith("{")) return;
        final Context app = c.getApplicationContext();
        new Thread(() -> {
            try {
                JSONObject j = new JSONObject(msg);
                if (!"sync".equals(j.optString("t"))) return;
                if (Prefs.saveSync(app, j)) Updater.updateAll(app);
            } catch (Throwable t) {
                Log.w("JcWidgets", "bad sync message", t);
            }
        }, "jc-sync").start();
    }
}
