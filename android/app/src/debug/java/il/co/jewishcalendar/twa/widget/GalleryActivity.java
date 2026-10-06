package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

import il.co.jewishcalendar.twa.widget.core.Engine;

/**
 * כלי צילום (גרסת בדיקה בלבד): מצייר כל ווידג'ט בגודל נתון, בסגנון נתון וברגע מדומה,
 * ושומר PNG ב-files/gallery. הפעלה:
 * adb shell am start -n il.co.jewishcalendar.twa/.widget.GalleryActivity --el now <ms> --es style sky --es tag x --es spec "ZMANIM:4x3,NEXT:2x2"
 * אם יש files/sync.json — נטען כאילו הגיע מהאתר.
 */
public class GalleryActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Bundle x = getIntent().getExtras() == null ? new Bundle() : getIntent().getExtras();
        final long now = x.getLong("now", System.currentTimeMillis());
        final String style = x.getString("style", "sky");
        final String tag = x.getString("tag", "t");
        final String spec = x.getString("spec", "");
        // גודל תא כמו שמשגר הפיקסל מדווח (2×2 = 172×232dp)
        final float cellW = x.getFloat("cw", 90f), cellH = x.getFloat("ch", 120f);
        File dir = new File(getExternalFilesDir(null), "gallery");
        dir.mkdirs();
        try {
            File sj = new File(getExternalFilesDir(null), "sync.json");
            if (sj.exists()) {
                byte[] buf = new byte[(int) sj.length()];
                FileInputStream in = new FileInputStream(sj);
                int off = 0;
                while (off < buf.length) {
                    int r = in.read(buf, off, buf.length - off);
                    if (r < 0) break;
                    off += r;
                }
                in.close();
                Prefs.saveSync(this, new JSONObject(new String(buf, StandardCharsets.UTF_8)));
            }
        } catch (Exception e) {
            Log.e("Gallery", "sync.json", e);
        }
        FrameLayout host = new FrameLayout(this);
        setContentView(host);
        host.post(() -> {
            for (String item : spec.split(",")) {
                item = item.trim();
                if (item.isEmpty()) continue;
                try {
                    String[] p = item.split(":");
                    W.Kind k = W.Kind.valueOf(p[0]);
                    String[] wh = p[1].split("x");
                    float w, h;
                    if (p.length > 2 && "dp".equals(p[2])) {
                        w = Float.parseFloat(wh[0]);
                        h = Float.parseFloat(wh[1]);
                    } else {
                        w = Float.parseFloat(wh[0]) * cellW - 8;
                        h = Float.parseFloat(wh[1]) * cellH - 8;
                    }
                    Engine e = new Engine(Prefs.loc(this), now);
                    RemoteViews rv = Render.build(this, k, 900000 + k.ordinal(), w, h, e, style);
                    View v = rv.apply(this, host);
                    int pw = Ui.px(this, w), ph = Ui.px(this, h);
                    v.measure(View.MeasureSpec.makeMeasureSpec(pw, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(ph, View.MeasureSpec.EXACTLY));
                    v.layout(0, 0, pw, ph);
                    Bitmap bm = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888);
                    Canvas cv = new Canvas(bm);
                    // ציור תוכנה לא מכבד clipToOutline — חיתוך הפינות כמו במשגר (24dp)
                    android.graphics.Path clip = new android.graphics.Path();
                    float rad = Ui.px(this, 24);
                    clip.addRoundRect(new android.graphics.RectF(0, 0, pw, ph), rad, rad, android.graphics.Path.Direction.CW);
                    cv.clipPath(clip);
                    v.draw(cv);
                    String name = tag + "_" + k.name().toLowerCase() + "_" + p[1] + "_" + style + ".png";
                    FileOutputStream out = new FileOutputStream(new File(dir, name));
                    bm.compress(Bitmap.CompressFormat.PNG, 100, out);
                    out.close();
                } catch (Throwable t) {
                    Log.e("Gallery", "render " + item, t);
                }
            }
            try {
                new File(dir, tag + ".done").createNewFile();
            } catch (Exception ignored) {
            }
            finish();
        });
    }
}
