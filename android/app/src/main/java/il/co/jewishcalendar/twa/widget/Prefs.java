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
            keep.put("name", loc.optString("name", ""));
            keep.put("lat", lat);
            keep.put("lon", lon);
            keep.put("elev", Math.max(-500, Math.min(9000, loc.optDouble("elev", 0))));
            keep.put("tz", loc.optString("tz", "Asia/Jerusalem"));
            int candle = j.optInt("candle", 20);
            keep.put("candle", candle >= 0 && candle <= 90 ? candle : 20);
            String nusach = j.optString("nusach", "mizrahi");
            keep.put("nusach", "ashkenaz".equals(nusach) || "sefard".equals(nusach) ? nusach : "mizrahi");
            keep.put("method", "GRA".equals(j.optString("method")) ? "GRA" : "MGA");
            JSONArray plans = j.optJSONArray("plans");
            keep.put("plans", plans == null ? new JSONArray() : plans);
        } catch (Exception ex) {
            return false;
        }
        String now = keep.toString();
        e.putString("sync", now);
        JSONObject hil = j.optJSONObject("hil");
        if (hil != null && hil.length() > 0) e.putString("hil", hil.toString());
        e.putLong("synced_at", System.currentTimeMillis());
        e.apply();
        hilCache = null;
        return !now.equals(before) || hil != null;
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
                pl.doneToday = p.optBoolean("doneToday");
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
        sp(c).edit().remove("style_" + widgetId).apply();
    }
}
