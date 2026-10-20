package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

import il.co.jewishcalendar.twa.widget.core.Day;
import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * כלי בדיקה (גרסת debug בלבד): מחלץ את זמני המנוע של הווידג'טים (core/Day) לכל
 * עיר ותאריך שמועברים, ושומר JSON ב-files/zdump.json — להשוואה צולבת מול האתר,
 * מול hebcal ומול חישוב עצמאי. הפעלה:
 * adb shell am start -n il.co.jewishcalendar.twa/.widget.ZDumpActivity \
 *   --es spec "ירושלים|31.76904|35.21633|0|Asia/Jerusalem;..." --es dates "2026-01-15,..."
 */
public class ZDumpActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        // הערים והתאריכים קבועים בקוד — העברתם ב-adb דורשת escaping של | ושל ; בשל
        String[] CITIES = {
            "ירושלים,31.76904,35.21633,0,Asia/Jerusalem",
            "פתח תקווה,32.0888,34.88666,0,Asia/Jerusalem",
            "אילת,29.55805,34.94821,0,Asia/Jerusalem",
            "צפת,32.96464,35.49624,0,Asia/Jerusalem",
            "ניו יורק,40.71427,-74.00597,0,America/New_York",
            "לונדון,51.50853,-0.12574,0,Europe/London"
        };
        String dates = getIntent().getStringExtra("dates");
        if (dates == null || dates.isEmpty())
            dates = "2026-01-15 2026-03-21 2026-06-21 2026-09-23 2026-10-20 2026-12-21";
        JSONArray out = new JSONArray();
        try {
            for (String cityStr : CITIES) {
                String[] p = cityStr.split(",");
                Loc loc = new Loc(p[0], Double.parseDouble(p[1]), Double.parseDouble(p[2]),
                        Double.parseDouble(p[3]), p[4], 20, "mizrahi", "MGA", true);
                for (String d : dates.split(" ")) {
                    String[] ymd = d.split("-");
                    Day z = Day.compute(loc, Integer.parseInt(ymd[0]), Integer.parseInt(ymd[1]), Integer.parseInt(ymd[2]));
                    JSONObject o = new JSONObject();
                    o.put("city", p[0]);
                    o.put("date", d);
                    put(o, "alot", z.alot);
                    put(o, "misheyakir", z.misheyakir);
                    put(o, "sunrise", z.sunrise);
                    put(o, "shmaMGA", z.shmaMGA);
                    put(o, "shmaGRA", z.shmaGRA);
                    put(o, "tfilaMGA", z.tfilaMGA);
                    put(o, "tfilaGRA", z.tfilaGRA);
                    put(o, "chatzot", z.chatzot);
                    put(o, "minchaGedola", z.minchaGedola);
                    put(o, "minchaKetana", z.minchaKetana);
                    put(o, "plag", z.plag);
                    put(o, "plagGRA", z.plagGRA);
                    put(o, "sunset", z.sunset);
                    put(o, "bein", z.bein);
                    put(o, "tzeit", z.tzeit);
                    put(o, "chatzotNight", z.chatzotNight);
                    put(o, "candle", z.candle);
                    out.put(o);
                }
            }
            File f = new File(getExternalFilesDir(null), "zdump.json");
            FileOutputStream fo = new FileOutputStream(f);
            fo.write(out.toString().getBytes(StandardCharsets.UTF_8));
            fo.close();
            Log.i("ZDump", "wrote " + out.length() + " rows to " + f);
        } catch (Exception e) {
            Log.e("ZDump", "fail", e);
        }
        finish();
    }

    private static void put(JSONObject o, String k, Long v) throws Exception {
        o.put(k, v == null ? JSONObject.NULL : v);
    }
}
