package il.co.jewishcalendar.twa;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/*
 * ── מעבר לאפליקציה החדשה (1.2.1, 11/2026) ──
 * האפליקציה החדשה (React Native, אותה חבילה — עדכון רגיל ב-Play) לא יכולה לקרוא את ה-localStorage של כרום או של
 * ה-WebView. לכן גרסה זו שומרת בכל פתיחה עותק מלא שלו בקובץ files/jc-migrate.json (שנשאר אחרי העדכון), והגרסה
 * החדשה מייבאת אותו פעם אחת ומוחקת. בכרום — הדף שולח את העותק בערוץ ה-PostMessage (lux.js appBridge, "export-req");
 * במצב כשר — KosherWebActivity קורא את ה-localStorage של ה-WebView בעצמו. השם והמבנה ({"t":"export","ls":{…}}) —
 * החוזה עם האפליקציה החדשה (modules/jc-native/…/migrate/Migration.kt בריפו האפליקציה).
 */
public final class Migrate {
    private Migrate() {}

    public static final String FILE = "jc-migrate.json";
    /** הבקשה שהאפליקציה שולחת לדף בערוץ (אחרי HELLO ו-CAPS). */
    public static final String REQUEST = "{\"t\":\"export-req\"}";

    /** סקריפט שמחזיר את העותק (מצב כשר, evaluateJavascript) — אותו מבנה כמו בדף */
    public static final String DUMP_JS = "(function(){try{var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);"
            + "o[k]=localStorage.getItem(k);}return JSON.stringify({t:'export',v:1,src:'kosher',at:Date.now(),ls:o});}catch(e){return ''}})()";

    /** הודעת ייצוא תקינה → הקובץ (כתיבה אטומית). אחרת — כלום. */
    public static void save(Context c, String msg) {
        if (msg == null || msg.length() > 8_000_000) return;
        try {
            JSONObject j = new JSONObject(msg);
            if (!"export".equals(j.optString("t")) || j.optJSONObject("ls") == null) return;
            File dir = c.getApplicationContext().getFilesDir();
            File tmp = new File(dir, FILE + ".tmp");
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                out.write(msg.getBytes(StandardCharsets.UTF_8));
            }
            File dst = new File(dir, FILE);
            if (!tmp.renameTo(dst)) {
                try (FileOutputStream out = new FileOutputStream(dst)) {
                    out.write(msg.getBytes(StandardCharsets.UTF_8));
                }
                //noinspection ResultOfMethodCallIgnored
                tmp.delete();
            }
            Log.i("JcMigrate", "saved " + j.getJSONObject("ls").length() + " keys (" + j.optString("src") + ")");
        } catch (Throwable t) {
            Log.w("JcMigrate", "save", t);
        }
    }
}
