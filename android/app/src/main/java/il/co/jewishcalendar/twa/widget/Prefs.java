package il.co.jewishcalendar.twa.widget;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * ההגדרות של הווידג'טים: מה שהאתר שלח בסנכרון האחרון (lux.js appBridge) והסגנון
 * של כל ווידג'ט (שמיים חיים — ברירת המחדל, או זכוכית).
 */
final class Prefs {
    private Prefs() {}

    private static final String FILE = "jc_widgets";
    static final String STYLE_SKY = "sky", STYLE_GLASS = "glass";

    static SharedPreferences sp(Context c) {
        return c.getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    // ── סנכרון מהאתר ──

    /** שומר הודעת סנכרון מהאתר. מחזיר true אם משהו השתנה. */
    static boolean saveSync(Context c, JSONObject j) {
        JSONObject loc = j.optJSONObject("loc");
        if (loc == null) return false;
        double lat = loc.optDouble("lat", Double.NaN), lon = loc.optDouble("lon", Double.NaN);
        if (Double.isNaN(lat) || Double.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
        SharedPreferences.Editor e = sp(c).edit();
        String before = sp(c).getString("sync", "");
        JSONObject keep = new JSONObject();
        try {
            // במיקום GPS האתר מציג "ירושלים (GPS)" — בכותרת הווידג'ט רק שם העיר
            keep.put("name", loc.optString("name", "").replaceAll("\\s*\\(GPS\\)\\s*$", "").trim());
            keep.put("lat", lat);
            keep.put("lon", lon);
            keep.put("elev", Math.max(-500, Math.min(9000, loc.optDouble("elev", 0))));
            keep.put("tz", loc.optString("tz", "Asia/Jerusalem"));
            int candle = j.optInt("candle", 20);
            keep.put("candle", candle >= 0 && candle <= 90 ? candle : 20);
            // המפתחות של האתר (NUSACH_LABELS): mizrahi | sfard | ashkenaz
            String nusach = j.optString("nusach", "mizrahi");
            keep.put("nusach", "ashkenaz".equals(nusach) ? "ashkenaz"
                    : "sfard".equals(nusach) || "sefard".equals(nusach) ? "sfard" : "mizrahi");
            keep.put("method", "GRA".equals(j.optString("method")) ? "GRA" : "MGA");
            JSONArray plans = j.optJSONArray("plans");
            keep.put("plans", plans == null ? new JSONArray() : plans);
        } catch (Exception ex) {
            return false;
        }
        String now = keep.toString();
        e.putString("sync", now);
        // האתר שולח את אותן הגדרות כמה פעמים בכל פתיחה — מציירים מחדש רק כשמשהו השתנה
        boolean changed = !now.equals(before);
        JSONObject hil = j.optJSONObject("hil");
        if (hil != null && hil.length() > 0) {
            String h = hil.toString();
            if (!h.equals(sp(c).getString("hil", ""))) {
                e.putString("hil", h);
                hilCache = null;
                changed = true;
            }
        }
        e.putLong("synced_at", System.currentTimeMillis());
        e.apply();
        return changed;
    }

    static Loc loc(Context c) {
        String s = sp(c).getString("sync", null);
        if (s == null) return Loc.defaults();
        try {
            JSONObject j = new JSONObject(s);
            return new Loc(j.optString("name"), j.getDouble("lat"), j.getDouble("lon"), j.optDouble("elev", 0),
                    j.optString("tz", "Asia/Jerusalem"), j.optInt("candle", 20), j.optString("nusach", "mizrahi"),
                    j.optString("method", "MGA"), true);
        } catch (Exception ex) {
            return Loc.defaults();
        }
    }

    static final class Plan {
        String id, name, unit;
        int done, count, perDay;
        boolean doneToday;
    }

    static List<Plan> plans(Context c) {
        List<Plan> out = new ArrayList<>();
        String s = sp(c).getString("sync", null);
        if (s == null) return out;
        // "בוצע היום" באתר = התאריך האזרחי של הסנכרון (todayStr ב-lux.js) — מחצות הוא כבר לא נכון
        java.util.Calendar synced = java.util.Calendar.getInstance(), today = java.util.Calendar.getInstance();
        synced.setTimeInMillis(sp(c).getLong("synced_at", 0));
        boolean sameDay = synced.get(java.util.Calendar.YEAR) == today.get(java.util.Calendar.YEAR)
                && synced.get(java.util.Calendar.DAY_OF_YEAR) == today.get(java.util.Calendar.DAY_OF_YEAR);
        try {
            JSONArray a = new JSONObject(s).optJSONArray("plans");
            if (a == null) return out;
            for (int i = 0; i < a.length(); i++) {
                JSONObject p = a.getJSONObject(i);
                Plan pl = new Plan();
                pl.id = p.optString("id");
                pl.name = p.optString("he");
                pl.unit = p.optString("unit");
                pl.done = p.optInt("done");
                pl.count = p.optInt("count");
                pl.perDay = p.optInt("perDay", 1);
                pl.doneToday = sameDay && p.optBoolean("doneToday");
                if (!pl.name.isEmpty()) out.add(pl);
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    private static JSONObject hilCache;

    static boolean hasHilulot(Context c) {
        return sp(c).contains("hil");
    }

    /** ההילולות של "חודש-יום" (מפתח כמו באתר) — [שם, תיאור]. */
    static List<String[]> hilulot(Context c, String key) {
        List<String[]> out = new ArrayList<>();
        try {
            if (hilCache == null) {
                String s = sp(c).getString("hil", null);
                if (s == null) return out;
                hilCache = new JSONObject(s);
            }
            JSONArray a = hilCache.optJSONArray(key);
            if (a == null) return out;
            for (int i = 0; i < a.length(); i++) {
                JSONObject h = a.getJSONObject(i);
                out.add(new String[]{h.optString("n"), h.optString("t")});
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    // ── סגנון ──

    static String style(Context c, int widgetId) {
        return sp(c).getString("style_" + widgetId, sp(c).getString("style_default", STYLE_SKY));
    }

    static void setStyle(Context c, int widgetId, String style) {
        sp(c).edit().putString("style_" + widgetId, style).putString("style_default", style).apply();
    }

    static boolean hasStyle(Context c, int widgetId) {
        return sp(c).contains("style_" + widgetId);
    }

    static void forget(Context c, int widgetId) {
        sp(c).edit().remove("style_" + widgetId).remove("mon_off_" + widgetId).remove("mon_at_" + widgetId).apply();
    }

    // ── ווידג'ט "לוח שנה": החודש שמוצג (ביחס לחודש הנוכחי) ──
    // אחרי רבע שעה בלי לחיצה על החיצים — חוזר לחודש הנוכחי (בעדכון הבא של הווידג'ט)

    static int monthOffset(Context c, int widgetId) {
        if (System.currentTimeMillis() - sp(c).getLong("mon_at_" + widgetId, 0) > 15 * 60000L) return 0;
        return sp(c).getInt("mon_off_" + widgetId, 0);
    }

    static void shiftMonth(Context c, int widgetId, int delta) {
        int off = delta == 0 ? 0 : Math.max(-24, Math.min(24, monthOffset(c, widgetId) + delta));
        sp(c).edit().putInt("mon_off_" + widgetId, off).putLong("mon_at_" + widgetId, System.currentTimeMillis()).apply();
    }
}
