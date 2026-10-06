package il.co.jewishcalendar.twa.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

/** ציור מופע הירח האמיתי (לפי גיל הירח מהמולד) — מולד בצד ימין, מתמלא, ומתמעט משמאל. */
final class MoonArt {
    private MoonArt() {}

    static Bitmap draw(int sizePx, double ageDays) {
        Bitmap b = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(b);
        float pad = sizePx * 0.06f;
        float r = sizePx / 2f - pad, cx = sizePx / 2f, cy = sizePx / 2f;

        // הילה עדינה + הדיסקה החשוכה
        Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
        glow.setShader(new RadialGradient(cx, cy, sizePx / 2f, Color.argb(70, 255, 236, 180), Color.argb(0, 255, 236, 180), Shader.TileMode.CLAMP));
        cv.drawCircle(cx, cy, sizePx / 2f, glow);
        Paint dark = new Paint(Paint.ANTI_ALIAS_FLAG);
        dark.setColor(Color.argb(40, 255, 255, 255));
        cv.drawCircle(cx, cy, r, dark);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(Math.max(1f, sizePx / 90f));
        ring.setColor(Color.argb(70, 255, 255, 255));
        cv.drawCircle(cx, cy, r, ring);

        double p = ((ageDays / 29.530588) % 1 + 1) % 1; // 0 מולד, 0.5 מלא
        if (p < 0.015 || p > 0.985) return b;
        boolean waxing = p < 0.5;
        double k = Math.cos(2 * Math.PI * p); // 1 → מולד, ‎-1 → מלא
        float rx = (float) (r * Math.abs(k));
        boolean gibbous = k < 0;

        Path path = new Path();
        RectF disc = new RectF(cx - r, cy - r, cx + r, cy + r);
        RectF ell = new RectF(cx - rx, cy - r, cx + rx, cy + r);
        // חצי העיגול המואר: ימין כשמתמלא, שמאל כשמתמעט
        path.arcTo(disc, -90, waxing ? 180 : -180, true);
        // קו הגבול חוזר מלמטה למעלה — בצד המואר (סהר) או בצד החשוך (גיבוס)
        boolean bulgeLit = !gibbous;
        // מ-90° (למטה) ל-270° (למעלה): דרך 0° (ימין) = ‎-180, דרך 180° (שמאל) = ‎+180
        float sweep = (waxing == bulgeLit) ? -180 : 180;
        path.arcTo(ell, 90, sweep, false);
        path.close();
        Paint lit = new Paint(Paint.ANTI_ALIAS_FLAG);
        lit.setShader(new LinearGradient(cx - r, cy - r, cx + r, cy + r, Color.rgb(255, 251, 232), Color.rgb(233, 217, 166), Shader.TileMode.CLAMP));
        cv.drawPath(path, lit);
        return b;
    }
}
