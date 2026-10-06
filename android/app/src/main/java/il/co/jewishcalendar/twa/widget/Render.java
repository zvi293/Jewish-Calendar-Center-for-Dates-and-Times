package il.co.jewishcalendar.twa.widget;

import android.content.Context;
import android.graphics.Typeface;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.text.style.RelativeSizeSpan;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.RemoteViews;

import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;

import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.R;
import il.co.jewishcalendar.twa.widget.core.Engine;
import il.co.jewishcalendar.twa.widget.core.Heb;
import il.co.jewishcalendar.twa.widget.core.Levana;

/**
 * הפריסה של כל ווידג'ט לפי הגודל שלו (dp). כל ווידג'ט נבנה מאבני בניין (Ui) —
 * בגודל קטן מוצג העיקר, ובגדול עוד פרטים. הטקסט גדל עם הווידג'ט.
 */
final class Render {
    private Render() {}

    static RemoteViews build(Context c, W.Kind k, int id, float w, float h, Engine e) {
        return build(c, k, id, w, h, e, Prefs.style(c, id));
    }

    static RemoteViews build(Context c, W.Kind k, int id, float w, float h, Engine e, String style) {
        Ui.Theme t = new Ui.Theme(style, e.skyPhase());
        switch (k) {
            case ZMANIM: return zmanim(c, id, w, h, e, t);
            case NEXT: return next(c, id, w, h, e, t);
            case DATE: return date(c, id, w, h, e, t);
            case HOLIDAY: return holiday(c, id, w, h, e, t);
            case SHABBAT: return shabbat(c, id, w, h, e, t);
            case TEHILLIM: return tehillim(c, id, w, h, e, t);
            case DAF: return daf(c, id, w, h, e, t);
            case LEVANA: return levana(c, id, w, h, e, t);
            case LEVANA_SIMPLE: return levanaSimple(c, id, w, h, e, t);
            case STUDY: return study(c, id, w, h, e, t);
            case PRAYERS: return prayers(c, id, w, h, e, t);
            case BENTCHING: return bentching(c, id, w, h, e, t);
            case PLAN: return plan(c, id, w, h, e, t);
            case OMER: return omer(c, id, w, h, e, t);
            case ALL: return all(c, id, w, h, e, t);
            case CLOCK: return clock(c, id, w, h, e, t);
            default: return hilula(c, id, w, h, e, t);
        }
    }

    // ═══════════════════════ עזרים ═══════════════════════

    private static final int C = R.id.w_content, BOX = R.id.box;

    private static float clamp(float v, float lo, float hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    /** קנה מידה ביחס לגודל הבסיס של הווידג'ט. */
    private static float sc(float w, float h, float bw, float bh) {
        return clamp(Math.min(w / bw, h / bh), 0.78f, 1.5f);
    }

    private static RemoteViews base(Context c, Ui.Theme t, float w, float h, boolean hills, int id, String target) {
        RemoteViews root = Ui.root(c, t, hills && h >= 150 && w >= 150);
        float ph = w < 140 ? 10 : 14, pv = h < 100 ? 7 : 12;
        Ui.widthHint = w - 2 * ph;
        // בפריסה המקוצרת (שורה אחת) הטקסט חולק את השורה עם סמל/שעה בצד
        if (h < 130) Ui.widthHint -= 44;
        Ui.pad(root, C, c, ph, pv, ph, pv);
        if (target != null) root.setOnClickPendingIntent(android.R.id.background, Ui.open(c, id, target));
        return root;
    }

    /** רוחב התוכן (dp) אחרי הריפוד של base(). */
    private static float inner(float w) {
        return w - 2 * (w < 140 ? 10 : 14);
    }

    /**
     * גודל כתב שנכנס ברוחב הנתון: הערכת רוחב לפי מספר התווים (עברית בגופני האתר ≈ 0.56 מגובה הכתב,
     * עם מרווח ביטחון) — כותרת לא נחתכת גם בטלפון צר או בווידג'ט שהוקטן.
     */
    static float fit(String text, float sp, float availDp, int lines) {
        if (text == null || text.isEmpty()) return sp;
        float need = text.length() * 0.6f * sp / Math.max(1, lines);
        return need <= availDp ? sp : Math.max(9f, sp * availDp / need);
    }

    private static RemoteViews icon(Context c, int res, int size) {
        RemoteViews v = new RemoteViews(c.getPackageName(), size <= 14 ? R.layout.wb_icon14 : size <= 18 ? R.layout.wb_icon18 : R.layout.wb_icon24);
        v.setImageViewResource(R.id.img, res);
        return v;
    }

    /** כותרת קטנה בזהב עם סמל. */
    private static RemoteViews header(Context c, Ui.Theme t, int iconRes, String text, float sp) {
        RemoteViews hb = Ui.hbox(c);
        if (iconRes != 0) {
            hb.addView(BOX, icon(c, iconRes, sp >= 14 ? 18 : 14));
            hb.addView(BOX, Ui.gap(c, 4));
        }
        hb.addView(BOX, Ui.fill(c, Ui.B, text, Ui.fitSans(text, sp, Ui.widthHint - (iconRes != 0 ? 24 : 0)), t.gold));
        return hb;
    }

    private static String time(Engine e, long ms) {
        return Heb.time(ms, e.tz);
    }

    private static String whenShort(Engine e, long ms) {
        Calendar cal = Calendar.getInstance(e.tz);
        cal.setTimeInMillis(ms);
        int dw = cal.get(Calendar.DAY_OF_WEEK);
        return Heb.weekdayShort(dw) + " " + Heb.gregShort(cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH)) + " · " + Ui.ltr(time(e, ms));
    }

    /** שורת "תווית ........ שעה" (למשל הדלקת נרות / צאת השבת). */
    private static RemoteViews kv(Context c, Ui.Theme t, String k, String day, String v, float sp) {
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.fill(c, Ui.SB, k, sp, Ui.WHITE));
        hb.addView(BOX, Ui.gap(c, 6));
        if (day != null && !day.isEmpty()) {
            hb.addView(BOX, Ui.word(c, Ui.SB, day, sp * 0.78f, Ui.DIM));
            hb.addView(BOX, Ui.gap(c, 4));
        }
        hb.addView(BOX, Ui.word(c, Ui.XB, v, sp * 1.22f, Ui.WHITE));
        return hb;
    }

    private static CharSequence twoLine(String a, String b, float rel, int subColor) {
        SpannableStringBuilder sb = new SpannableStringBuilder(a);
        if (b != null && !b.isEmpty()) {
            sb.append('\n');
            int st = sb.length();
            sb.append(b);
            sb.setSpan(new RelativeSizeSpan(rel), st, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            sb.setSpan(new ForegroundColorSpan(subColor), st, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            sb.setSpan(new StyleSpan(Typeface.NORMAL), st, sb.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
        return sb;
    }

    private static String opinion(String sub) {
        if (sub == null || sub.isEmpty()) return "";
        if ("מג״א".equals(sub)) return "לפי מגן אברהם";
        if ("הגר״א".equals(sub)) return "לפי הגר״א";
        return sub;
    }

    private static String rowName(Engine.Row r) {
        return r.label + (r.sub.isEmpty() ? "" : " (" + r.sub + ")");
    }

    /** "בעוד 3 ימים" / "מחר" / "היום" — ימים שלמים. */
    private static String daysText(int n) {
        if (n <= 0) return "היום";
        if (n == 1) return "מחר";
        return "בעוד " + Heb.days(n);
    }

    // ═══════════════════════ 1. זמני היום ═══════════════════════

    static RemoteViews zmanim(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "zmanim");
        boolean compact = w < 230;
        float s = clamp(w / 340f, 0.85f, 1.15f);
        // כותרת
        RemoteViews hd = Ui.hbox(c);
        hd.addView(BOX, Ui.word(c, Ui.FRLB, "זמני היום", 17 * s, t.gold));
        hd.addView(BOX, Ui.hspace(c));
        JewishCalendar hj = e.hebNow();
        String city = e.loc.name.isEmpty() ? "" : e.loc.name;
        String sub = (compact ? "" : (city.isEmpty() ? "" : city + " · ")) + (e.afterSunset() ? "ליל " : "") + Heb.dayMonth(hj);
        hd.addView(BOX, Ui.word(c, Ui.R_, sub, 11.5f * s, Ui.MUTED));
        root.addView(C, hd);
        root.addView(C, Ui.gap(c, 6));

        float avail = h - 24 - 24 * s - 6 - (e.loc.synced ? 0 : 18);
        // גובה שורה בפועל גדל עם גודל הגופן שנבחר בהגדרות הטלפון — שלא תיחתך שורה בתחתית
        float fs = Math.max(1f, c.getResources().getConfiguration().fontScale);
        float rowH = (28 * s + 1) * fs, firstH = 36 * s * fs;
        int rows = Math.max(1, 1 + (int) Math.floor((avail - firstH) / rowH));
        List<Engine.Row> list = e.upcoming(Math.min(rows, 16));
        boolean live = Ui.liveCountdown(c);
        for (int i = 0; i < list.size(); i++) {
            Engine.Row r = list.get(i);
            RemoteViews row = new RemoteViews(c.getPackageName(), R.layout.wb_zrow);
            row.setTextViewText(R.id.lbl, r.label);
            row.setTextViewTextSize(R.id.lbl, android.util.TypedValue.COMPLEX_UNIT_SP, (i == 0 ? 15f : 14f) * s);
            row.setTextViewText(R.id.sub, compact ? "" : r.sub);
            row.setTextViewText(R.id.tag, r.tag);
            row.setTextViewText(R.id.time, time(e, r.ms));
            row.setTextViewTextSize(R.id.time, android.util.TypedValue.COMPLEX_UNIT_SP, (i == 0 ? 17f : 15f) * s);
            if (r.special) row.setTextColor(R.id.lbl, t.gold);
            if (i == 0) {
                row.setInt(R.id.row, "setBackgroundResource", R.drawable.wrow_next);
                row.setTextColor(R.id.lbl, t.gold);
                long left = r.ms - e.now;
                if (!compact || w >= 190) {
                    if (live && left < 24 * Engine.HOUR) {
                        row.setViewVisibility(R.id.cdbox, View.VISIBLE);
                        row.setChronometer(R.id.cd, android.os.SystemClock.elapsedRealtime() + left, null, true);
                        row.setChronometerCountDown(R.id.cd, true);
                    } else {
                        row.setViewVisibility(R.id.cdtxt, View.VISIBLE);
                        row.setTextViewText(R.id.cdtxt, "בעוד " + Heb.duration(left));
                    }
                }
            } else {
                Ui.pad(row, R.id.row, c, 10, 4, 10, 4);
            }
            root.addView(C, row);
            if (i > 0 && i < list.size() - 1) root.addView(C, Ui.div(c));
        }
        root.addView(C, Ui.space(c));
        if (!e.loc.synced) root.addView(C, Ui.center(c, Ui.R_, "לפי פתח תקווה · לבחירת העיר — פתחו את האפליקציה", 10.5f, Ui.DIM));
        return root;
    }

    // ═══════════════════════ 2. הזמן הבא ═══════════════════════

    static RemoteViews next(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, "zmanim");
        List<Engine.Row> up = e.upcoming(5);
        if (up.isEmpty()) {
            root.addView(C, Ui.center(c, Ui.B, "אין זמנים להיום", 14, Ui.WHITE));
            return root;
        }
        Engine.Row n = up.get(0);
        if (h < 130) { // שורה אחת
            RemoteViews hb = Ui.hboxFill(c);
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "הזמן הבא" + (n.tag.isEmpty() ? "" : " · " + n.tag) + (n.sub.isEmpty() ? "" : " · " + n.sub), 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.XB, n.label, fit(n.label, w < 200 ? 14.5f : 16, inner(w) - (w < 200 ? 70 : 84), 1), Ui.WHITE));
            hb.addView(BOX, col);
            hb.addView(BOX, Ui.gap(c, 6));
            RemoteViews tcol = Ui.vboxWrap(c);
            tcol.addView(BOX, Ui.text(c, Ui.XB, time(e, n.ms), w < 200 ? 22 : 26, Ui.WHITE, android.view.Gravity.END, 1, 1));
            if (w >= 230) tcol.addView(BOX, Ui.countdown(c, e.now, n.ms, "בעוד", 11, t, false));
            hb.addView(BOX, tcol);
            root.addView(C, hb);
            return root;
        }
        float s = sc(w, h, 180, 190);
        boolean wide = w >= 260;
        RemoteViews main = wide ? Ui.vboxWFill(c) : Ui.vboxFill(c);
        main.addView(BOX, header(c, t, R.drawable.wic_clock, "הזמן הבא" + (n.tag.isEmpty() ? "" : " · " + n.tag), 12.5f * s));
        main.addView(BOX, Ui.gap(c, 4));
        main.addView(BOX, Ui.line(c, Ui.XB, n.label, fit(n.label, 18 * s, wide ? inner(w) / 2 - 6 : inner(w), 1), Ui.WHITE));
        String op = opinion(n.sub);
        if (!op.isEmpty()) main.addView(BOX, Ui.line(c, Ui.R_, op, 12 * s, Ui.MUTED));
        main.addView(BOX, Ui.gap(c, 4));
        main.addView(BOX, Ui.line(c, Ui.XB, time(e, n.ms), 40 * s, Ui.WHITE));
        main.addView(BOX, Ui.gap(c, 6));
        main.addView(BOX, Ui.countdown(c, e.now, n.ms, "בעוד", 12.5f * s, t, false));
        main.addView(BOX, Ui.space(c));
        if (!wide && up.size() > 1 && h >= 170) {
            Engine.Row a = up.get(1);
            main.addView(BOX, Ui.line(c, Ui.R_, "אחריו: " + rowName(a) + " · " + Ui.ltr(time(e, a.ms)), 11.5f * s, Ui.MUTED));
        }
        if (!wide) {
            root.addView(C, main);
            return root;
        }
        RemoteViews hb = Ui.hboxFill(c);
        hb.addView(BOX, main);
        hb.addView(BOX, Ui.gap(c, 12));
        RemoteViews side = Ui.vboxWFill(c);
        side.addView(BOX, Ui.line(c, Ui.B, "ואחריו", 11.5f * s, t.gold));
        side.addView(BOX, Ui.gap(c, 4));
        int maxRows = Math.max(1, (int) ((h - 60) / (30 * s)));
        for (int i = 1; i < up.size() && i <= maxRows; i++) {
            Engine.Row r = up.get(i);
            side.addView(BOX, kv(c, t, rowName(r), r.tag, time(e, r.ms), 12.5f * s));
            if (i < up.size() - 1 && i < maxRows) side.addView(BOX, Ui.gap(c, 6));
        }
        hb.addView(BOX, side);
        root.addView(C, hb);
        return root;
    }

    // ═══════════════════════ 3. תאריך עברי ═══════════════════════

    static String weekdayLabel(Engine e) {
        if (!e.afterSunset()) return Heb.weekday(e.dow);
        if (e.dow == 7) return "מוצאי שבת קודש";
        if (e.dow == 6) return "ליל שבת קודש";
        return "ליל " + Heb.weekdayName(e.dowOf(1));
    }

    static RemoteViews date(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "calendar");
        JewishCalendar hj = e.hebNow();
        String special = e.specialToday();
        if (h < 130) {
            RemoteViews col = Ui.vboxFill(c);
            col.addView(BOX, Ui.space(c));
            String dl = Heb.dayMonth(hj) + " " + Heb.year(hj);
            col.addView(BOX, Ui.center(c, Ui.FRLB, dl, fit(dl, w < 160 ? 17 : 22, inner(w), 1), Ui.WHITE));
            col.addView(BOX, Ui.center(c, Ui.SB, special.isEmpty() ? Heb.greg(e.y, e.m, e.d) : special, 11.5f, special.isEmpty() ? Ui.MUTED : t.gold));
            col.addView(BOX, Ui.space(c));
            root.addView(C, col);
            return root;
        }
        float s = sc(w, h, 180, 190);
        RemoteViews col = Ui.vboxFill(c);
        col.addView(BOX, Ui.space(c));
        col.addView(BOX, Ui.center(c, Ui.SB, weekdayLabel(e), 13.5f * s, Ui.MUTED));
        col.addView(BOX, Ui.gap(c, 6));
        col.addView(BOX, Ui.center(c, Ui.FRLB, Heb.dayMonth(hj), fit(Heb.dayMonth(hj), 36 * s, inner(w), 1), Ui.WHITE));
        col.addView(BOX, Ui.center(c, Ui.FRL, Heb.year(hj), 21 * s, t.gold));
        col.addView(BOX, Ui.gap(c, 8));
        col.addView(BOX, Ui.goldLine(c));
        col.addView(BOX, Ui.gap(c, 8));
        col.addView(BOX, Ui.center(c, Ui.R_, Heb.greg(e.y, e.m, e.d), 12.5f * s, Ui.MUTED));
        if (!special.isEmpty()) {
            col.addView(BOX, Ui.gap(c, 4));
            col.addView(BOX, Ui.centerMulti(c, Ui.B, special, 12 * s, t.gold, 2));
        }
        col.addView(BOX, Ui.space(c));
        root.addView(C, col);
        return root;
    }

    // ═══════════════════════ 4. החג הקרוב ═══════════════════════

    static RemoteViews holiday(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "holiday");
        Engine.Occasion o = e.nextOccasion();
        if (o == null) {
            root.addView(C, Ui.center(c, Ui.B, "—", 14, Ui.WHITE));
            return root;
        }
        boolean fast = o.kind == Engine.K_FAST;
        boolean inProg = o.start != null && e.now >= o.start && (o.end == null || e.now < o.end);
        int days = e.daysUntil(o);
        String lbl = inProg ? (fast ? "צום קל ומועיל" : o.name.contains("חנוכה") ? "חנוכה שמח" : o.name.contains("פורים") ? "פורים שמח" : o.kind == Engine.K_YT ? "חג שמח" : "היום") : "המועד הקרוב";
        float s = sc(w, h, 180, 190);
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, lbl, 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.FRLB, o.name, w < 200 ? 16 : 19, Ui.WHITE));
            hb.addView(BOX, col);
            hb.addView(BOX, Ui.gap(c, 6));
            hb.addView(BOX, countdownOrDays(c, e, o, inProg, days, 11.5f, t));
            root.addView(C, hb);
            return root;
        }
        root.addView(C, header(c, t, fast ? R.drawable.wic_moon : R.drawable.wic_star, lbl, 12.5f * s));
        root.addView(C, Ui.gap(c, 4));
        root.addView(C, Ui.text(c, Ui.FRLB, o.name, fit(o.name, 24 * s, inner(w), 2), Ui.WHITE, 0, 2, 0));
        String sub = o.dateLabel;
        if (inProg && o.name.contains("חנוכה")) {
            int n = e.hebNow().getDayOfChanukah();
            if (n > 0) sub = (e.afterSunset() ? "הלילה מדליקים נר " : "היום נר ") + Heb.num(n) + (n == 8 ? " — זאת חנוכה" : "");
        }
        root.addView(C, Ui.line(c, Ui.R_, sub, 12 * s, inProg ? t.gold : Ui.MUTED));
        root.addView(C, Ui.gap(c, 8));
        if (!inProg && !(o.start != null && o.start - e.now < 24 * Engine.HOUR) && days >= 2) {
            RemoteViews hb = Ui.hbox(c);
            hb.addView(BOX, Ui.word(c, Ui.R_, "בעוד ", 13 * s, Ui.MUTED));
            hb.addView(BOX, Ui.word(c, Ui.XB, String.valueOf(days), 30 * s, Ui.WHITE));
            hb.addView(BOX, Ui.word(c, Ui.B, " ימים", 15 * s, Ui.WHITE));
            root.addView(C, hb);
        } else {
            root.addView(C, countdownOrDays(c, e, o, inProg, days, 12.5f * s, t));
        }
        root.addView(C, Ui.space(c));
        if (o.kind == Engine.K_YT || o.kind == Engine.K_FAST) {
            if (o.start != null && !inProg) root.addView(C, kv(c, t, o.startLabel, o.startDay, time(e, o.start), 13 * s));
            if (o.start != null && !inProg && o.end != null) root.addView(C, Ui.gap(c, 4));
            if (o.end != null) root.addView(C, kv(c, t, o.endLabel, o.endDay, time(e, o.end), 13 * s));
            if (!o.note.isEmpty() && h >= 200) root.addView(C, Ui.line(c, Ui.R_, o.note, 11 * s, Ui.DIM));
        } else if (!o.note.isEmpty() && !inProg) {
            root.addView(C, Ui.text(c, Ui.SB, o.note, 12 * s, Ui.MUTED, 0, 2, 0));
        }
        return root;
    }

    private static RemoteViews countdownOrDays(Context c, Engine e, Engine.Occasion o, boolean inProg, int days, float sp, Ui.Theme t) {
        boolean fast = o.kind == Engine.K_FAST;
        if (inProg) {
            if (o.end != null && o.end - e.now < 24 * Engine.HOUR)
                return Ui.countdown(c, e.now, o.end, fast ? "הצום נגמר בעוד" : "יוצא בעוד", sp, t, true);
            return Ui.chip(c, "עד " + Heb.weekdayShort(dowAt(e, o.end)), sp, t, true);
        }
        if (o.start != null && o.start - e.now < 24 * Engine.HOUR)
            return Ui.countdown(c, e.now, o.start, fast ? "הצום מתחיל בעוד" : "נכנס בעוד", sp, t, true);
        return Ui.chip(c, daysText(days), sp, t, true);
    }

    private static int dowAt(Engine e, long ms) {
        Calendar cal = Calendar.getInstance(e.tz);
        cal.setTimeInMillis(ms);
        return cal.get(Calendar.DAY_OF_WEEK);
    }

    // ═══════════════════════ 5. פרשת השבוע ═══════════════════════

    static RemoteViews shabbat(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "shabbat");
        Engine.ShabbatInfo s = e.shabbat();
        String when = s.now ? "שבת שלום" : "שבת קודש · " + (s.daysUntil == 0 ? "היום" : daysText(s.daysUntil));
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            RemoteViews col = Ui.vboxW(c);
            String whenShort = s.now ? "שבת שלום" : s.daysUntil == 0 ? "שבת היום" : "שבת " + daysText(s.daysUntil);
            col.addView(BOX, Ui.line(c, Ui.B, whenShort, 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.FRLB, s.title, fit(s.title, w < 200 ? 15 : 18, inner(w) - 76, 1), Ui.WHITE));
            hb.addView(BOX, col);
            RemoteViews tc = Ui.vboxWrap(c);
            if (s.candle != null) tc.addView(BOX, Ui.text(c, Ui.B, "נרות " + Ui.ltr(time(e, s.candle)), 12, Ui.WHITE, android.view.Gravity.END, 1, 1));
            if (s.havdala != null) tc.addView(BOX, Ui.text(c, Ui.B, "צאת " + Ui.ltr(time(e, s.havdala)), 12, Ui.WHITE, android.view.Gravity.END, 1, 1));
            hb.addView(BOX, tc);
            root.addView(C, hb);
            return root;
        }
        float sc = sc(w, h, 180, 190);
        root.addView(C, header(c, t, R.drawable.wic_candle, when, 12.5f * sc));
        root.addView(C, Ui.gap(c, 4));
        root.addView(C, Ui.text(c, Ui.FRLB, s.title, fit(s.title, 24 * sc, inner(w), 2), Ui.WHITE, 0, 2, 0));
        root.addView(C, Ui.gap(c, 8));
        if (s.candle != null && !s.now) {
            root.addView(C, kv(c, t, "הדלקת נרות", s.candleDay, time(e, s.candle), 13.5f * sc));
            root.addView(C, Ui.gap(c, 4));
            root.addView(C, Ui.div(c));
            root.addView(C, Ui.gap(c, 4));
        }
        if (s.havdala != null) root.addView(C, kv(c, t, "צאת השבת", s.havdalaDay, time(e, s.havdala), 13.5f * sc));
        if (s.now && s.havdala != null && s.havdala - e.now < 24 * Engine.HOUR) {
            root.addView(C, Ui.gap(c, 6));
            root.addView(C, Ui.countdown(c, e.now, s.havdala, "השבת יוצאת בעוד", 12 * sc, t, true));
        }
        root.addView(C, Ui.space(c));
        if (!s.special.isEmpty()) root.addView(C, Ui.chip(c, s.special, 12 * sc, t, true));
        return root;
    }

    // ═══════════════════════ 6. תהילים היומי ═══════════════════════

    static RemoteViews tehillim(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        String target = "tehillim&ch=" + e.tehillimFirstChapter() + (e.tehillimFirstVerse() > 1 ? "&v=" + e.tehillimFirstVerse() : "");
        RemoteViews root = base(c, t, w, h, true, id, target);
        int hd = e.tehillimDay();
        boolean single = hd == 25 || hd == 26;
        String range = single ? "פרק קיט" : "פרקים " + e.tehillimLabel();
        String verses = hd == 25 ? "פסוקים א–צו" : hd == 26 ? "פסוקים צז–קעו" : "";
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, icon(c, R.drawable.wic_tehillim, 24));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "תהילים היומי", 11.5f, t.gold));
            col.addView(BOX, Ui.line(c, Ui.FRLB, range, w < 200 ? 16 : 19, Ui.WHITE));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        float s = sc(w, h, 180, 190);
        root.addView(C, header(c, t, R.drawable.wic_tehillim, "תהילים היומי", 12.5f * s));
        root.addView(C, Ui.space(c));
        root.addView(C, Ui.center(c, Ui.FRLB, range, fit(range, 26 * s, inner(w), 1), Ui.WHITE));
        root.addView(C, Ui.gap(c, 4));
        String sub = "יום " + Heb.num(hd) + " בחודש · " + (single ? verses : e.tehillimCount() + " פרקים");
        root.addView(C, Ui.center(c, Ui.R_, sub, 12 * s, Ui.MUTED));
        root.addView(C, Ui.space(c));
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.hspace(c));
        hb.addView(BOX, Ui.chip(c, "לפרק הראשון ←", 12 * s, t, true));
        hb.addView(BOX, Ui.hspace(c));
        root.addView(C, hb);
        return root;
    }

    // ═══════════════════════ 7. הדף היומי ═══════════════════════

    static RemoteViews daf(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "daf");
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, icon(c, R.drawable.wic_daf, 24));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "הדף היומי", 11.5f, t.gold));
            col.addView(BOX, Ui.line(c, Ui.FRLB, e.dafMasechet() + " " + e.dafNum(), w < 200 ? 16 : 19, Ui.WHITE));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        float s = sc(w, h, 180, 190);
        root.addView(C, header(c, t, R.drawable.wic_daf, "הדף היומי", 12.5f * s));
        root.addView(C, Ui.space(c));
        root.addView(C, Ui.center(c, Ui.FRLB, e.dafMasechet(), fit(e.dafMasechet(), 28 * s, inner(w), 1), Ui.WHITE));
        root.addView(C, Ui.center(c, Ui.XB, "דף " + e.dafNum(), 20 * s, t.gold));
        root.addView(C, Ui.space(c));
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.hspace(c));
        hb.addView(BOX, Ui.chip(c, "ללימוד הדף ←", 12 * s, t, true));
        hb.addView(BOX, Ui.hspace(c));
        root.addView(C, hb);
        return root;
    }

    // ═══════════════════════ 8. ברכת הלבנה ═══════════════════════

    private static String leftText(long ms) {
        if (ms >= 48 * Engine.HOUR) return Heb.days(ms / Engine.DAY);
        return Heb.duration(ms);
    }

    static RemoteViews levana(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, "levana");
        Levana.Status st = Levana.status(e);
        Levana.Window lw = st.w;
        long left = st.target - e.now;
        String k = "before".equals(st.state) ? "אפשר לברך בעוד" : "open".equals(st.state) ? "אפשר לברך עוד" : "לדעת מרן אפשר עוד";
        float s = sc(w, h, 180, 190);
        int moonPx = Ui.px(c, h < 130 ? 44 : 62 * s);
        android.graphics.Bitmap moon = MoonArt.draw(moonPx, Levana.ageDays(e.now));
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, Ui.image(c, moon));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "ברכת הלבנה", 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.XB, leftText(left), w < 200 ? 17 : 20, Ui.WHITE));
            col.addView(BOX, Ui.line(c, Ui.R_, k, 10.5f, Ui.MUTED));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        root.addView(C, header(c, t, R.drawable.wic_moon, "ברכת הלבנה" + (lw.month.isEmpty() ? "" : " · " + lw.month), 12.5f * s));
        root.addView(C, Ui.gap(c, 6));
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.image(c, moon));
        hb.addView(BOX, Ui.gap(c, 10));
        RemoteViews col = Ui.vboxW(c);
        float full = Ui.widthHint;
        Ui.widthHint = full - moonPx / c.getResources().getDisplayMetrics().density - 10;
        col.addView(BOX, Ui.text(c, Ui.R_, k, 12.5f * s, Ui.MUTED, 0, 2, 0));
        if (left < 24 * Engine.HOUR && Ui.liveCountdown(c)) col.addView(BOX, Ui.countdown(c, e.now, st.target, "", 15 * s, t, true));
        else col.addView(BOX, Ui.line(c, Ui.XB, leftText(left), 24 * s, Ui.WHITE));
        Ui.widthHint = full;
        hb.addView(BOX, col);
        root.addView(C, hb);
        root.addView(C, Ui.gap(c, 8));
        double frac = "before".equals(st.state)
                ? (e.now - st.from) / (double) Math.max(1, lw.start - st.from)
                : (e.now - lw.start) / (double) Math.max(1, lw.fin - lw.start);
        root.addView(C, Ui.progress(c, frac));
        root.addView(C, Ui.space(c));
        if (h >= 215) root.addView(C, Ui.line(c, Ui.R_, "המולד: " + whenShort(e, lw.molad), 11.5f * s, Ui.DIM));
        root.addView(C, Ui.line(c, Ui.R_, "מתחילים: " + whenShort(e, lw.start), 11.5f * s, Ui.MUTED));
        root.addView(C, Ui.line(c, Ui.R_, "אפשר עד: " + whenShort(e, lw.end), 11.5f * s, Ui.MUTED));
        if ("mizrahi".equals(e.loc.nusach) && h >= 200)
            root.addView(C, Ui.line(c, Ui.R_, "לדעת מרן עד: " + whenShort(e, lw.end15), 11 * s, Ui.DIM));
        return root;
    }

    static RemoteViews levanaSimple(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, "levana");
        Levana.Status st = Levana.status(e);
        long left = st.target - e.now;
        boolean open = !"before".equals(st.state);
        String top = open ? "✓ אפשר לברך עכשיו" : "ברכת הלבנה";
        String pre = open ? ("grace".equals(st.state) ? "לדעת מרן עוד" : "אפשר לברך עוד") : "אפשר לברך בעוד";
        float s = clamp(Math.min(w / 180f, h / 100f), 0.8f, 1.5f);
        RemoteViews col = Ui.vboxFill(c);
        col.addView(BOX, Ui.space(c));
        col.addView(BOX, Ui.center(c, Ui.B, top, 11.5f * s, t.gold));
        col.addView(BOX, Ui.gap(c, 2));
        col.addView(BOX, Ui.center(c, Ui.R_, pre, 11.5f * s, Ui.MUTED));
        if (left < 24 * Engine.HOUR && Ui.liveCountdown(c)) {
            RemoteViews hb = Ui.hbox(c);
            hb.addView(BOX, Ui.hspace(c));
            hb.addView(BOX, Ui.countdown(c, e.now, st.target, "", 14 * s, t, true));
            hb.addView(BOX, Ui.hspace(c));
            col.addView(BOX, hb);
        } else {
            col.addView(BOX, Ui.center(c, Ui.XB, leftText(left), 22 * s, Ui.WHITE));
        }
        col.addView(BOX, Ui.space(c));
        root.addView(C, col);
        return root;
    }

    // ═══════════════════════ 9–11. כפתורים ═══════════════════════

    private static RemoteViews button(Context c, int id, Ui.Theme t, int iconRes, CharSequence label, float sp, String target, boolean on, boolean vertical, boolean showIcon) {
        RemoteViews b = new RemoteViews(c.getPackageName(), vertical ? R.layout.wb_btn : R.layout.wb_btn_h);
        b.setImageViewResource(R.id.ic, iconRes);
        if (!showIcon) {
            b.setViewVisibility(R.id.ic, View.GONE);
            if (vertical) b.setViewVisibility(R.id.icgap, View.GONE);
        }
        b.setTextViewText(R.id.t, label);
        b.setTextViewTextSize(R.id.t, android.util.TypedValue.COMPLEX_UNIT_SP, sp);
        if (label.toString().contains("\n")) b.setInt(R.id.t, "setMaxLines", 2);
        if (on) {
            b.setInt(R.id.btn, "setBackgroundResource", R.drawable.wbtn_on);
            b.setTextColor(R.id.t, 0xFFFFF7D6);
        }
        b.setOnClickPendingIntent(R.id.btn, Ui.open(c, id, target));
        return b;
    }

    static RemoteViews study(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, null);
        Ui.pad(root, C, c, 8, 8, 8, 8);
        boolean vertical = h >= 96;
        float sp = clamp(w / 340f * 13.5f, 11.5f, 16);
        Engine.ShabbatInfo sh = e.shabbat();
        String parsha = sh.title.startsWith("פרשת ") ? sh.title.substring(5) : sh.title;
        boolean subs = vertical && h >= 120;
        RemoteViews row = Ui.hboxFill(c);
        row.addView(BOX, button(c, id, t, R.drawable.wic_daf, subs ? twoLine("דף יומי", e.dafMasechet() + " " + e.dafNum(), 0.82f, 0xD9FFFFFF) : "דף יומי", sp, "daf", false, vertical, true));
        row.addView(BOX, Ui.gap(c, 6));
        row.addView(BOX, button(c, id, t, R.drawable.wic_chok, subs ? twoLine("חוק לישראל", "יום " + Heb.weekdayName(e.dow), 0.82f, 0xD9FFFFFF) : "חוק לישראל", sp, "chok", false, vertical, true));
        row.addView(BOX, Ui.gap(c, 6));
        row.addView(BOX, button(c, id, t, R.drawable.wic_shnayim, subs ? twoLine("שניים מקרא", parsha, 0.82f, 0xD9FFFFFF) : "שניים מקרא", sp, "shnayim", false, vertical, true));
        root.addView(C, row);
        return root;
    }

    static RemoteViews prayers(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, null);
        Ui.pad(root, C, c, 8, 8, 8, 8);
        String cur = e.currentPrayer();
        boolean twoRows = h >= 170 && w < 300;
        boolean vertical = h >= 90;
        boolean showIcon = h >= 70;
        float sp = clamp((twoRows ? w / 3f : w / 5f) / 70f * 12.5f, 10.5f, 15f);
        String[][] items = {
                {"shacharit", "שחרית"}, {"mincha", "מנחה"}, {"maariv", "ערבית"},
                {"bentching", "ברכת המזון"}, {"meein", "מעין שלוש"}};
        int[] icons = {R.drawable.wic_shacharit, R.drawable.wic_mincha, R.drawable.wic_maariv, R.drawable.wic_bentching, R.drawable.wic_meein};
        RemoteViews row = Ui.hboxFill(c);
        for (int i = 0; i < 5; i++) {
            if (twoRows && i == 3) {
                root.addView(C, row);
                root.addView(C, Ui.gap(c, 6));
                row = Ui.hboxFill(c);
            }
            if (i > 0 && !(twoRows && i == 3)) row.addView(BOX, Ui.gap(c, 5));
            float bw = (w - 16 - 5 * 4) / (twoRows ? (i < 3 ? 3f : 2f) : 5f);
            String label = items[i][1];
            if (vertical && bw < label.length() * sp * 0.62f && label.contains(" ")) label = label.replace(" ", "\n");
            row.addView(BOX, button(c, id, t, icons[i], label, sp, items[i][0], items[i][0].equals(cur), vertical, showIcon));
        }
        root.addView(C, row);
        return root;
    }

    static RemoteViews bentching(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, false, id, null);
        Ui.pad(root, C, c, 8, 8, 8, 8);
        boolean vertical = h >= 88;
        float sp = clamp(w / 180f * 13f, 12f, 18f);
        RemoteViews row = Ui.hboxFill(c);
        row.addView(BOX, button(c, id, t, R.drawable.wic_bentching, "ברכת המזון", sp, "bentching", false, vertical, true));
        row.addView(BOX, Ui.gap(c, 6));
        row.addView(BOX, button(c, id, t, R.drawable.wic_meein, "מעין שלוש", sp, "meein", false, vertical, true));
        root.addView(C, row);
        return root;
    }

    // ═══════════════════════ 12. סדר הלימוד האישי ═══════════════════════

    static RemoteViews plan(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "plans");
        List<Prefs.Plan> plans = Prefs.plans(c);
        float s = sc(w, h, 180, 190);
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, icon(c, R.drawable.wic_plan, 24));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "סדר הלימוד שלי", 11.5f, t.gold));
            String l = plans.isEmpty() ? "לבניית סדר לימוד ←" : plans.get(0).name + (plans.get(0).doneToday ? " ✓" : "");
            col.addView(BOX, Ui.line(c, Ui.FRLB, l, w < 200 ? 15 : 18, Ui.WHITE));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        root.addView(C, header(c, t, R.drawable.wic_plan, "סדר הלימוד שלי", 12.5f * s));
        root.addView(C, Ui.gap(c, 6));
        if (plans.isEmpty()) {
            root.addView(C, Ui.space(c));
            root.addView(C, Ui.centerMulti(c, Ui.SB, Prefs.sp(c).contains("sync") ? "עוד לא בניתם סדר לימוד אישי" : "פתחו את האפליקציה כדי לראות כאן את הסדרים שלכם", 13.5f * s, Ui.WHITE, 2));
            root.addView(C, Ui.gap(c, 8));
            RemoteViews hb = Ui.hbox(c);
            hb.addView(BOX, Ui.hspace(c));
            hb.addView(BOX, Ui.chip(c, "לסדר הלימוד ←", 12 * s, t, true));
            hb.addView(BOX, Ui.hspace(c));
            root.addView(C, hb);
            root.addView(C, Ui.space(c));
            return root;
        }
        int fit = Math.max(1, (int) ((h - 50) / (46 * s)));
        for (int i = 0; i < plans.size() && i < fit; i++) {
            Prefs.Plan p = plans.get(i);
            RemoteViews hb = Ui.hbox(c);
            hb.addView(BOX, Ui.fill(c, Ui.B, p.name, 14 * s, Ui.WHITE));
            hb.addView(BOX, Ui.word(c, Ui.SB, p.doneToday ? "✓ היום" : p.done + "/" + p.count, 11.5f * s, p.doneToday ? t.gold : Ui.MUTED));
            root.addView(C, hb);
            root.addView(C, Ui.gap(c, 4));
            root.addView(C, Ui.progress(c, p.count > 0 ? p.done / (double) p.count : 0));
            if (i < plans.size() - 1 && i < fit - 1) root.addView(C, Ui.gap(c, 10));
        }
        root.addView(C, Ui.space(c));
        root.addView(C, Ui.line(c, Ui.R_, "הקישו לבחירת סדר ולהתחלת הלימוד", 11 * s, Ui.DIM));
        return root;
    }

    // ═══════════════════════ 13. ספירת העומר ═══════════════════════

    static RemoteViews omer(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "omer");
        int day = e.omerDay();
        float s = sc(w, h, 180, 190);
        if (day < 1) {
            int n = e.daysToOmer();
            RemoteViews col = Ui.vboxFill(c);
            col.addView(BOX, header(c, t, R.drawable.wic_omer, "ספירת העומר", 12.5f * s));
            col.addView(BOX, Ui.space(c));
            col.addView(BOX, Ui.center(c, Ui.R_, "מתחילים לספור בליל ט״ז בניסן", 12 * s, Ui.MUTED));
            col.addView(BOX, Ui.center(c, Ui.XB, n <= 0 ? "הלילה" : daysText(n), 22 * s, Ui.WHITE));
            if (n > 0) col.addView(BOX, Ui.center(c, Ui.R_, Heb.weekday(e.dowOf(e.hebOffset() + n - 1)) + " בערב · " + e.gregOf(e.hebOffset() + n - 1), 11.5f * s, Ui.DIM));
            col.addView(BOX, Ui.space(c));
            root.addView(C, col);
            return root;
        }
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, Ui.word(c, Ui.FRLB, Heb.num(day), 28, t.gold));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, (e.omerTonight() ? "הלילה" : "היום") + " · ספירת העומר", 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.FRL, Engine.omerText(day, e.loc.nusach), 13, Ui.WHITE));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        root.addView(C, header(c, t, R.drawable.wic_omer, (e.omerTonight() ? "הלילה" : "היום") + " · ספירת העומר", 12.5f * s));
        root.addView(C, Ui.space(c));
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.hspace(c));
        hb.addView(BOX, Ui.word(c, Ui.FRLB, Heb.num(day), Math.min(34 * s, inner(w) / 5f), t.gold));
        hb.addView(BOX, Ui.gap(c, 6));
        hb.addView(BOX, Ui.word(c, Ui.FRL, "לָעֹמֶר", 17 * s, Ui.WHITE));
        hb.addView(BOX, Ui.hspace(c));
        root.addView(C, hb);
        root.addView(C, Ui.gap(c, 6));
        root.addView(C, Ui.centerMulti(c, Ui.FRL, Engine.omerText(day, e.loc.nusach), 13.5f * s, Ui.WHITE, h >= 200 ? 4 : 3));
        root.addView(C, Ui.space(c));
        if (!e.omerTonight()) {
            Long tz = e.day(0).tzeit;
            int tonight = e.day(1).jc.getDayOfOmer();
            if (tz != null && tonight > 0)
                root.addView(C, Ui.centerMulti(c, Ui.R_, "הלילה " + Heb.num(tonight) + " לעומר · בצאת הכוכבים " + Ui.ltr(time(e, tz)), 11 * s, Ui.MUTED, 2));
        }
        return root;
    }

    // ═══════════════════════ 14. הכול במבט אחד ═══════════════════════

    static RemoteViews all(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, null);
        root.setOnClickPendingIntent(android.R.id.background, Ui.open(c, id, null));
        float s = clamp(Math.min(w / 340f, h / 210f), 0.82f, 1.3f);
        JewishCalendar hj = e.hebNow();
        RemoteViews top = Ui.hboxFill(c);
        // ימין: התאריך
        RemoteViews dcol = Ui.vboxWFill(c);
        dcol.addView(BOX, Ui.space(c));
        dcol.addView(BOX, Ui.line(c, Ui.SB, weekdayLabel(e), 12.5f * s, Ui.MUTED));
        dcol.addView(BOX, Ui.line(c, Ui.FRLB, Heb.dayMonth(hj), fit(Heb.dayMonth(hj), 27 * s, inner(w) / 2 - 6, 1), Ui.WHITE));
        dcol.addView(BOX, Ui.line(c, Ui.R_, Heb.year(hj) + " · " + Heb.greg(e.y, e.m, e.d), 11.5f * s, Ui.MUTED));
        String sp = e.specialToday();
        if (!sp.isEmpty()) dcol.addView(BOX, Ui.line(c, Ui.B, sp, 11.5f * s, t.gold));
        dcol.addView(BOX, Ui.space(c));
        dcol.setOnClickPendingIntent(BOX, Ui.open(c, id, "calendar"));
        top.addView(BOX, dcol);
        top.addView(BOX, Ui.gap(c, 12));
        // שמאל: הזמן הבא
        Engine.Row n = e.nextZman();
        RemoteViews ncol = Ui.vboxWFill(c);
        ncol.addView(BOX, Ui.space(c));
        if (n != null) {
            ncol.addView(BOX, Ui.line(c, Ui.B, "הזמן הבא" + (n.tag.isEmpty() ? "" : " · " + n.tag), 11.5f * s, t.gold));
            ncol.addView(BOX, Ui.line(c, Ui.XB, rowName(n), fit(rowName(n), 14 * s, inner(w) / 2 - 6, 1), Ui.WHITE));
            ncol.addView(BOX, Ui.line(c, Ui.XB, time(e, n.ms), 27 * s, Ui.WHITE));
            ncol.addView(BOX, Ui.gap(c, 2));
            ncol.addView(BOX, Ui.countdown(c, e.now, n.ms, "בעוד", 11.5f * s, t, false));
        }
        ncol.addView(BOX, Ui.space(c));
        ncol.setOnClickPendingIntent(BOX, Ui.open(c, id, "zmanim"));
        top.addView(BOX, ncol);
        root.addView(C, top);
        root.addView(C, Ui.gap(c, 6));
        root.addView(C, Ui.div(c));
        root.addView(C, Ui.gap(c, 6));
        // שורות תחתונות: שבת, דף יומי, המועד הקרוב
        Engine.ShabbatInfo sh = e.shabbat();
        RemoteViews r1 = Ui.hbox(c);
        r1.addView(BOX, icon(c, R.drawable.wic_candle, 14));
        r1.addView(BOX, Ui.gap(c, 4));
        r1.addView(BOX, Ui.fill(c, Ui.B, sh.title, 12.5f * s, Ui.WHITE));
        String times = (sh.candle != null && !sh.now ? "נרות " + Ui.ltr(time(e, sh.candle)) + "  " : "") + (sh.havdala != null ? "צאת " + Ui.ltr(time(e, sh.havdala)) : "");
        r1.addView(BOX, Ui.word(c, Ui.SB, times, 12 * s, Ui.MUTED));
        r1.setOnClickPendingIntent(BOX, Ui.open(c, id, "shabbat"));
        root.addView(C, r1);
        root.addView(C, Ui.gap(c, 4));
        RemoteViews r2 = Ui.hbox(c);
        r2.addView(BOX, icon(c, R.drawable.wic_daf, 14));
        r2.addView(BOX, Ui.gap(c, 4));
        r2.addView(BOX, Ui.fill(c, Ui.SB, "דף יומי: " + e.dafMasechet() + " " + e.dafNum(), 12 * s, Ui.WHITE));
        Engine.Occasion o = e.nextOccasion();
        if (o != null) {
            int d = e.daysUntil(o);
            boolean inProg = o.start != null && e.now >= o.start;
            r2.addView(BOX, Ui.word(c, Ui.SB, o.name + " · " + (inProg ? "היום" : daysText(d)), 12 * s, t.gold));
        }
        r2.setOnClickPendingIntent(BOX, Ui.open(c, id, "daf"));
        root.addView(C, r2);
        if (h >= 280) {
            root.addView(C, Ui.gap(c, 8));
            root.addView(C, Ui.div(c));
            root.addView(C, Ui.gap(c, 4));
            int fit = (int) ((h - 230) / (24 * s));
            List<Engine.Row> up = e.upcoming(fit + 1);
            for (int i = 1; i < up.size(); i++) {
                Engine.Row r = up.get(i);
                root.addView(C, kv(c, t, rowName(r), r.tag, time(e, r.ms), 12 * s));
            }
        }
        return root;
    }

    // ═══════════════════════ 15. שעון הלכתי ═══════════════════════

    static RemoteViews clock(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "zmanim");
        Engine.Clock k = e.clock();
        String part = k.day ? "שעות היום" : "שעות הלילה";
        long shaahMin = Math.round(k.shaahMs / 60000.0);
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, Ui.word(c, Ui.XB, String.valueOf(k.hour), 30, t.gold));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "שעון הלכתי", 11, t.gold));
            col.addView(BOX, Ui.line(c, Ui.SB, "מתוך 12 · " + (k.day ? "ביום" : "בלילה"), 12.5f, Ui.WHITE));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        float s = sc(w, h, 180, 190);
        root.addView(C, header(c, t, R.drawable.wic_clock, "שעון הלכתי", 12.5f * s));
        root.addView(C, Ui.space(c));
        RemoteViews hb = Ui.hbox(c);
        hb.addView(BOX, Ui.word(c, Ui.XB, String.valueOf(k.hour), 46 * s, Ui.WHITE));
        hb.addView(BOX, Ui.gap(c, 8));
        RemoteViews col = Ui.vboxW(c);
        col.addView(BOX, Ui.line(c, Ui.B, "מתוך 12 " + part, 13.5f * s, t.gold));
        col.addView(BOX, Ui.line(c, Ui.R_, k.minuteInHour == 0 ? "תחילת השעה" : "ו-" + k.minuteInHour + " דקות זמניות", 12 * s, Ui.MUTED));
        hb.addView(BOX, col);
        root.addView(C, hb);
        root.addView(C, Ui.gap(c, 8));
        root.addView(C, Ui.progress(c, k.progress));
        root.addView(C, Ui.space(c));
        root.addView(C, Ui.line(c, Ui.R_, "שעה זמנית " + (k.day ? "היום" : "הלילה") + ": " + shaahMin + " דקות", 11.5f * s, Ui.MUTED));
        root.addView(C, Ui.gap(c, 4));
        root.addView(C, Ui.countdown(c, e.now, k.hourEnd, k.hour < 12 ? "השעה הבאה בעוד" : (k.day ? "השקיעה בעוד" : "הנץ בעוד"), 11.5f * s, t, false));
        return root;
    }

    // ═══════════════════════ 16. הילולת היום ═══════════════════════

    static RemoteViews hilula(Context c, int id, float w, float h, Engine e, Ui.Theme t) {
        RemoteViews root = base(c, t, w, h, true, id, "hilula");
        float s = sc(w, h, 180, 190);
        String dl = e.hilulaDateLabel();
        if (!Prefs.hasHilulot(c)) {
            root.addView(C, header(c, t, R.drawable.wic_hilula, "הילולת היום · " + dl, 12.5f * s));
            root.addView(C, Ui.space(c));
            root.addView(C, Ui.centerMulti(c, Ui.SB, "פתחו את האפליקציה פעם אחת כדי לטעון את רשימת ההילולות", 13 * s, Ui.WHITE, 3));
            root.addView(C, Ui.space(c));
            return root;
        }
        List<String[]> list = Prefs.hilulot(c, e.hilulaKey());
        if (h < 130) {
            RemoteViews hb = Ui.hboxFill(c);
            hb.addView(BOX, icon(c, R.drawable.wic_hilula, 24));
            hb.addView(BOX, Ui.gap(c, 8));
            RemoteViews col = Ui.vboxW(c);
            col.addView(BOX, Ui.line(c, Ui.B, "הילולת היום · " + dl, 11, t.gold));
            String nm = list.isEmpty() ? "אין הילולה רשומה" : list.get(0)[0];
            col.addView(BOX, Ui.text(c, Ui.FRLB, nm, fit(nm, w < 200 ? 14 : 16, inner(w) - 34, 2), Ui.WHITE, 0, 2, 0));
            hb.addView(BOX, col);
            root.addView(C, hb);
            return root;
        }
        root.addView(C, header(c, t, R.drawable.wic_hilula, "הילולת היום · " + dl, 12.5f * s));
        root.addView(C, Ui.gap(c, 6));
        if (list.isEmpty()) {
            root.addView(C, Ui.space(c));
            root.addView(C, Ui.center(c, Ui.SB, "אין הילולה רשומה להיום", 14 * s, Ui.WHITE));
            root.addView(C, Ui.space(c));
            return root;
        }
        int fit = Math.max(1, (int) ((h - 46) / (38 * s)));
        for (int i = 0; i < list.size() && i < fit; i++) {
            String[] hl = list.get(i);
            root.addView(C, Ui.line(c, Ui.FRL, hl[0], fit(hl[0], 15.5f * s, inner(w), 1), Ui.WHITE));
            if (!hl[1].isEmpty()) root.addView(C, Ui.line(c, Ui.R_, hl[1], 11.5f * s, Ui.MUTED));
            if (i < list.size() - 1 && i < fit - 1) root.addView(C, Ui.gap(c, 6));
        }
        if (list.size() > fit) root.addView(C, Ui.line(c, Ui.SB, "ועוד " + (list.size() - fit) + " — הקישו לרשימה המלאה", 11 * s, t.gold));
        root.addView(C, Ui.space(c));
        return root;
    }
}
