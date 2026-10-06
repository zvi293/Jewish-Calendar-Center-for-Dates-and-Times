package il.co.jewishcalendar.twa.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextDirectionHeuristics;
import android.text.TextPaint;
import android.text.TextUtils;
import android.util.DisplayMetrics;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.RemoteViews;

import il.co.jewishcalendar.twa.LauncherActivity;
import il.co.jewishcalendar.twa.R;

/**
 * אבני בניין לווידג'טים: כל ווידג'ט מורכב בקוד מבלוקים קטנים (res/layout/wt_*, wb_*)
 * דרך RemoteViews.addView — כך כל גודל מקבל פריסה משלו בלי עשרות קובצי XML.
 */
final class Ui {
    private Ui() {}

    static final int WHITE = 0xFFFFFFFF;
    static final int MUTED = 0xD9FFFFFF;
    static final int DIM = 0xB3FFFFFF;
    static final int GOLD_DAY = 0xFFFDE68A;
    static final int GOLD_NIGHT = 0xFFF2D98A;

    static final String R_ = "r", SB = "sb", B = "b", XB = "xb", FRL = "frl", FRLB = "frlb";

    final static class Theme {
        final String style;   // sky | glass
        final String phase;   // night | dawn | day | dusk
        final int gold;
        Theme(String style, String phase) {
            this.style = style;
            this.phase = phase;
            this.gold = "night".equals(phase) || "dusk".equals(phase) ? GOLD_NIGHT : GOLD_DAY;
        }
        boolean sky() {
            return !"glass".equals(style);
        }
    }

    // ── שורש ──

    static RemoteViews root(Context c, Theme t, boolean hills) {
        RemoteViews rv = new RemoteViews(c.getPackageName(), R.layout.w_root);
        // המשגר מחיל עדכון על התצוגה הקיימת (reapply) — בלי הניקוי addView מכפיל את התוכן
        rv.removeAllViews(R.id.w_content);
        rv.setViewVisibility(R.id.w_hills, View.GONE);
        int bg;
        if (!t.sky()) bg = R.drawable.wbg_glass;
        else if ("day".equals(t.phase)) bg = R.drawable.wbg_sky_day;
        else if ("dawn".equals(t.phase)) bg = R.drawable.wbg_sky_dawn;
        else if ("dusk".equals(t.phase)) bg = R.drawable.wbg_sky_dusk;
        else bg = R.drawable.wbg_sky_night;
        // הרקע על השורש עצמו: המתאר המעוגל שלו חותך את הכוכבים והגבעות (clipToOutline, אנדרואיד 12+)
        rv.setInt(android.R.id.background, "setBackgroundResource", bg);
        boolean stars = t.sky() && !"day".equals(t.phase);
        rv.setViewVisibility(R.id.w_stars, stars ? View.VISIBLE : View.GONE);
        if (stars) rv.setInt(R.id.w_stars, "setImageAlpha", "night".equals(t.phase) ? 200 : 90);
        // באנדרואיד 11 ומטה אין חיתוך לפינות בווידג'טים — הגבעות היו יוצאות מרובעות
        if (t.sky() && hills && Build.VERSION.SDK_INT >= 31) {
            int h;
            if ("day".equals(t.phase)) h = R.drawable.whills_day;
            else if ("dawn".equals(t.phase)) h = R.drawable.whills_dawn;
            else if ("dusk".equals(t.phase)) h = R.drawable.whills_dusk;
            else h = R.drawable.whills_night;
            rv.setImageViewResource(R.id.w_hills, h);
            rv.setViewVisibility(R.id.w_hills, View.VISIBLE);
        }
        return rv;
    }

    static void pad(RemoteViews rv, int viewId, Context c, float l, float t, float r, float b) {
        rv.setViewPadding(viewId, px(c, l), px(c, t), px(c, r), px(c, b));
    }

    static int px(Context c, float dp) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, c.getResources().getDisplayMetrics()));
    }

    // ── טקסט ──

    private static int textLayout(String font, int kind) {
        // kind: 0 = רוחב מלא, 1 = רוחב תוכן, 2 = ממלא את השורה
        switch (font) {
            case "r": return kind == 0 ? R.layout.wt_r : kind == 1 ? R.layout.wtw_r : R.layout.wtf_r;
            case "sb": return kind == 0 ? R.layout.wt_sb : kind == 1 ? R.layout.wtw_sb : R.layout.wtf_sb;
            case "b": return kind == 0 ? R.layout.wt_b : kind == 1 ? R.layout.wtw_b : R.layout.wtf_b;
            case "xb": return kind == 0 ? R.layout.wt_xb : kind == 1 ? R.layout.wtw_xb : R.layout.wtf_xb;
            case "frl": return kind == 0 ? R.layout.wt_frl : kind == 1 ? R.layout.wtw_frl : R.layout.wtf_frl;
            default: return kind == 0 ? R.layout.wt_frlb : kind == 1 ? R.layout.wtw_frlb : R.layout.wtf_frlb;
        }
    }

    static RemoteViews text(Context c, String font, CharSequence s, float sp, int color, int gravity, int maxLines, int kind) {
        if (FRL.equals(font) || FRLB.equals(font)) return serif(c, FRLB.equals(font), s, sp, color, gravity, maxLines);
        // שורה אחת ברוחב מלא — מתכווצת לרוחב הווידג'ט במקום להיחתך (גופן המערכת רחב יחסית)
        if (maxLines == 1 && kind != 1) sp = fitSans(s, sp, widthHint);
        RemoteViews t = new RemoteViews(c.getPackageName(), textLayout(font, kind));
        t.setTextViewText(R.id.t, s);
        t.setTextViewTextSize(R.id.t, TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(R.id.t, color);
        if (gravity != 0) t.setInt(R.id.t, "setGravity", gravity);
        if (maxLines != 1) t.setInt(R.id.t, "setMaxLines", maxLines);
        return t;
    }

    // ── כותרות בגופן של האתר ──
    // RemoteViews לא טוען גופנים מהאפליקציה (המשגר מציג במקומם גופן מערכת) — לכן הכותרות בגופן
    // Frank Ruhl Libre מצוירות כתמונה חדה ברזולוציית המסך. רוחב מקסימלי: widthHint (dp) של
    // הווידג'ט שנבנה עכשיו; תמונה רחבה מהמקום שלה מוקטנת באופן יחסי (fitCenter + adjustViewBounds).

    /** גודל כתב (sp) שנכנס ברוחב availDp בגופן המערכת (הערכה זהירה: 0.6 מגובה הכתב לתו). */
    static float fitSans(CharSequence s, float sp, float availDp) {
        if (s == null || s.length() == 0 || availDp <= 0) return sp;
        float need = s.length() * 0.6f * sp;
        return need <= availDp ? sp : Math.max(9f, sp * availDp / need);
    }

    /** הרוחב הפנימי (dp) של הווידג'ט שנבנה כרגע — Render.base() קובע אותו. */
    static float widthHint = 300f;
    private static Typeface frlBold, frlBlack;

    private static Typeface serifFace(Context c, boolean black) {
        try {
            if (black) {
                if (frlBlack == null) frlBlack = androidx.core.content.res.ResourcesCompat.getFont(c, R.font.frl_black);
                return frlBlack;
            }
            if (frlBold == null) frlBold = androidx.core.content.res.ResourcesCompat.getFont(c, R.font.frl_bold);
            return frlBold;
        } catch (Exception e) {
            return Typeface.create(Typeface.SERIF, Typeface.BOLD);
        }
    }

    static RemoteViews serif(Context c, boolean black, CharSequence s, float sp, int color, int gravity, int maxLines) {
        DisplayMetrics dm = c.getResources().getDisplayMetrics();
        TextPaint p = new TextPaint(TextPaint.ANTI_ALIAS_FLAG | TextPaint.SUBPIXEL_TEXT_FLAG);
        p.setTypeface(serifFace(c, black));
        p.setTextSize(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, sp, dm));
        p.setColor(color);
        p.setShadowLayer(3 * dm.density, 0, 1 * dm.density, 0x73000A28);
        String str = s == null ? "" : s.toString();
        int maxW = Math.max(40, Math.round(widthHint * dm.density));
        int textW = (int) Math.ceil(Layout.getDesiredWidth(str, p)) + 2;
        boolean center = (gravity & Gravity.HORIZONTAL_GRAVITY_MASK) == Gravity.CENTER_HORIZONTAL;
        int lines = Math.max(1, maxLines);
        int w = lines == 1 ? textW : Math.min(textW, maxW);
        Layout.Alignment al = center ? Layout.Alignment.ALIGN_CENTER : Layout.Alignment.ALIGN_NORMAL;
        StaticLayout lay;
        if (Build.VERSION.SDK_INT >= 23) {
            lay = StaticLayout.Builder.obtain(str, 0, str.length(), p, w)
                    .setAlignment(al)
                    .setTextDirection(TextDirectionHeuristics.RTL)
                    .setLineSpacing(0, 1.12f)
                    .setIncludePad(true)
                    .setMaxLines(lines)
                    .setEllipsize(TextUtils.TruncateAt.END)
                    .build();
        } else {
            lay = new StaticLayout(str, p, w, al, 1.12f, 0, true);
        }
        int pad = Math.round(4 * dm.density);
        int bw = lay.getWidth() + 2 * pad, bh = lay.getHeight() + 2 * pad;
        Bitmap b = Bitmap.createBitmap(Math.max(1, bw), Math.max(1, bh), Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(b);
        cv.translate(pad, pad);
        lay.draw(cv);
        RemoteViews v = new RemoteViews(c.getPackageName(), center ? R.layout.wb_bmp_c : R.layout.wb_bmp);
        v.setImageViewBitmap(R.id.img, b);
        v.setContentDescription(R.id.img, str);
        return v;
    }

    /** שורת טקסט ברוחב מלא. */
    static RemoteViews line(Context c, String font, CharSequence s, float sp, int color) {
        return text(c, font, s, sp, color, 0, 1, 0);
    }

    static RemoteViews center(Context c, String font, CharSequence s, float sp, int color) {
        return text(c, font, s, sp, color, Gravity.CENTER, 1, 0);
    }

    static RemoteViews centerMulti(Context c, String font, CharSequence s, float sp, int color, int lines) {
        return text(c, font, s, sp, color, Gravity.CENTER, lines, 0);
    }

    /** טקסט ברוחב התוכן (בתוך שורה אופקית). */
    static RemoteViews word(Context c, String font, CharSequence s, float sp, int color) {
        return text(c, font, s, sp, color, 0, 1, 1);
    }

    /** טקסט שתופס את מה שנשאר בשורה. */
    static RemoteViews fill(Context c, String font, CharSequence s, float sp, int color) {
        return text(c, font, s, sp, color, 0, 1, 2);
    }

    /** טקסט מימין לשמאל — מספרים ושעות בתוך טקסט עברי. */
    static String ltr(String s) {
        return "⁦" + s + "⁩";
    }

    // ── מבנה ──

    static RemoteViews vbox(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_vbox);
    }

    /** עמודה ברוחב התוכן — לצד עמודה עם משקל בשורה אופקית. */
    static RemoteViews vboxWrap(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_vbox_wrap);
    }

    static RemoteViews vboxFill(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_vbox_fill);
    }

    static RemoteViews vboxW(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_vbox_w);
    }

    static RemoteViews vboxWFill(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_vbox_wfill);
    }

    static RemoteViews hbox(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_hbox);
    }

    static RemoteViews hboxFill(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_hbox_fill);
    }

    static RemoteViews space(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_space);
    }

    static RemoteViews hspace(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_hspace);
    }

    static RemoteViews gap(Context c, int dp) {
        int id = dp <= 2 ? R.layout.wb_gap2 : dp <= 4 ? R.layout.wb_gap4 : dp <= 6 ? R.layout.wb_gap6 : dp <= 8 ? R.layout.wb_gap8 : R.layout.wb_gap12;
        return new RemoteViews(c.getPackageName(), id);
    }

    static RemoteViews div(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_div);
    }

    static RemoteViews goldLine(Context c) {
        return new RemoteViews(c.getPackageName(), R.layout.wb_golddiv);
    }

    static RemoteViews image(Context c, int res) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.wb_img);
        v.setImageViewResource(R.id.img, res);
        return v;
    }

    static RemoteViews image(Context c, Bitmap b) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.wb_img);
        v.setImageViewBitmap(R.id.img, b);
        return v;
    }

    static RemoteViews chip(Context c, CharSequence s, float sp, Theme t, boolean gold) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.wb_chip);
        v.setTextViewText(R.id.t, s);
        v.setTextViewTextSize(R.id.t, TypedValue.COMPLEX_UNIT_SP, fitSans(s, sp, widthHint - 22));
        if (gold) {
            v.setInt(R.id.t, "setBackgroundResource", R.drawable.wpill_gold);
            v.setTextColor(R.id.t, t.gold);
        }
        return v;
    }

    static RemoteViews progress(Context c, double frac) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.wb_progress);
        v.setProgressBar(R.id.pb, 1000, (int) Math.round(Math.max(0, Math.min(1, frac)) * 1000), false);
        return v;
    }

    // ── ספירה לאחור ──

    /** האם מותר למערכת להעיר אותנו בדקה המדויקת (אנדרואיד 12+ — הרשאת "שעונים ותזכורות"). */
    static boolean exactOk(Context c) {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    /** ספירה חיה שהשעון של המערכת מקדם (בלי עדכונים מהאפליקציה). העדכון ביעד מגיע בזמן —
     *  באזעקה מדויקת, או בסולם של Updater (עד ~20 שנ' איחור) — ולכן גם בלי הרשאה. */
    static boolean liveCountdown(Context c) {
        return Build.VERSION.SDK_INT >= 24;
    }

    static RemoteViews countdown(Context c, long now, long targetMs, String pre, float sp, Theme t, boolean gold) {
        long left = targetMs - now;
        if (liveCountdown(c) && left < 24 * 3600000L && left > 0) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.wb_chrono);
            v.setTextViewText(R.id.pre, pre);
            v.setTextViewTextSize(R.id.pre, TypedValue.COMPLEX_UNIT_SP, sp);
            v.setTextViewTextSize(R.id.ch, TypedValue.COMPLEX_UNIT_SP, sp);
            v.setChronometer(R.id.ch, SystemClock.elapsedRealtime() + left, null, true);
            v.setChronometerCountDown(R.id.ch, true);
            if (gold) {
                v.setInt(R.id.box, "setBackgroundResource", R.drawable.wpill_gold);
                v.setTextColor(R.id.pre, t.gold);
                v.setTextColor(R.id.ch, t.gold);
            }
            return v;
        }
        return chip(c, pre + " " + il.co.jewishcalendar.twa.widget.core.Heb.duration(left), sp, t, gold);
    }

    // ── לחיצות ──

    static final String SITE = "https://jewishcalendar.co.il/";

    /** פותח את האפליקציה בכתובת /?open=<יעד> (lux.js §22). */
    static PendingIntent open(Context c, int widgetId, String target) {
        Uri uri = Uri.parse(SITE + (target == null ? "" : "?open=" + target + "&src=widget"));
        Intent i = new Intent(Intent.ACTION_VIEW, uri);
        i.setComponent(new ComponentName(c, LauncherActivity.class));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int req = (widgetId * 31 + (target == null ? 0 : target.hashCode())) & 0x7fffffff;
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
