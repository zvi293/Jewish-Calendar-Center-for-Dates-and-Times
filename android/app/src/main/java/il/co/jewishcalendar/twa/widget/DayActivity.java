package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.res.ResourcesCompat;

import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar;

import java.util.List;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.LauncherActivity;
import il.co.jewishcalendar.twa.R;
import il.co.jewishcalendar.twa.widget.core.Engine;
import il.co.jewishcalendar.twa.widget.core.Heb;

/**
 * חלון היום (10/2026): נפתח בלחיצה על יום בווידג'ט "לוח שנה" כשהאירועים מיומן הטלפון
 * מוצגים בו (PhoneCal). התאריך הלועזי והעברי, המועד, האירועים שלי באותו יום (לחיצה —
 * פתיחת האירוע ביומן), ושני כפתורים: פתיחת היום ביומן של הטלפון, או בלוח השנה באתר.
 */
public class DayActivity extends Activity {
    private static final int NAVY = 0xFF0F172A, GOLD = 0xFFF2D98A, MUTED = 0xFF94A3B8;

    static PendingIntent pending(Context c, int widgetId, int y, int m, int d) {
        Intent i = new Intent(c, DayActivity.class).putExtra("y", y).putExtra("m", m).putExtra("d", d)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        int req = (int) ((widgetId * 100003L + y * 400L + m * 32L + d) & 0x7fffffff);
        return PendingIntent.getActivity(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private int y, m, d;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Engine e = new Engine(Prefs.loc(this), System.currentTimeMillis());
        y = getIntent().getIntExtra("y", e.y);
        m = getIntent().getIntExtra("m", e.m);
        d = getIntent().getIntExtra("d", e.d);
        setFinishOnTouchOutside(true);
        setContentView(buildUi(e));
        int sw = getResources().getDisplayMetrics().widthPixels;
        getWindow().setLayout(Math.min(Math.round(sw * 0.92f), dp(460)), ViewGroup.LayoutParams.WRAP_CONTENT);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(NAVY);
        bg.setCornerRadius(dp(24));
        bg.setStroke(dp(1), 0x55F2D98A);
        getWindow().setBackgroundDrawable(bg);
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private Typeface font(int res) {
        try {
            return ResourcesCompat.getFont(this, res);
        } catch (Exception ex) {
            return Typeface.DEFAULT_BOLD;
        }
    }

    private TextView text(String s, float sp, int color, int fontRes, int gravity) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTypeface(font(fontRes));
        t.setGravity(gravity);
        t.setTextDirection(View.TEXT_DIRECTION_RTL);
        t.setLineSpacing(0, 1.12f);
        return t;
    }

    private TextView button(String s, boolean primary) {
        TextView t = text(s, 15, primary ? 0xFF211603 : GOLD, R.font.assistant_extrabold, Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(999));
        if (primary) bg.setColors(new int[]{0xFFFDE68A, 0xFFE0B74F});
        else {
            bg.setColor(0x14FFFFFF);
            bg.setStroke(dp(1), 0x99F2D98A);
        }
        t.setBackground(bg);
        t.setClickable(true);
        t.setPadding(dp(14), 0, dp(14), 0);
        return t;
    }

    private LinearLayout.LayoutParams lp(int w, int h, int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w, h);
        p.topMargin = dp(top);
        return p;
    }

    private View buildUi(Engine e) {
        long ed = PhoneCal.epochDay(y, m, d), edToday = PhoneCal.epochDay(e.y, e.m, e.d);
        JewishCalendar jc = e.jcOf((int) (ed - edToday));
        int[] ymd = PhoneCal.ymdOf(ed);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        col.setPadding(dp(20), dp(20), dp(20), dp(18));

        String dayName = (ed == edToday ? "היום · " : ed == edToday + 1 ? "מחר · " : "") + Heb.weekday(ymd[3]);
        col.addView(text(dayName, 13, GOLD, R.font.assistant_extrabold, Gravity.CENTER));
        TextView title = text(Heb.greg(y, m, d), 22, Color.WHITE, R.font.frl_bold, Gravity.CENTER);
        title.setPadding(0, dp(2), 0, 0);
        col.addView(title);
        col.addView(text(Heb.dayOfMonth(jc) + " " + Heb.year(jc), 15, GOLD, R.font.frl_bold, Gravity.CENTER));
        String label = Render.monthCellLabel(jc);
        if (label != null) {
            TextView chip = text(label, 13, GOLD, R.font.assistant_extrabold, Gravity.CENTER);
            GradientDrawable cb = new GradientDrawable();
            cb.setCornerRadius(dp(999));
            cb.setColor(0x24F2D98A);
            chip.setBackground(cb);
            chip.setPadding(dp(12), dp(3), dp(12), dp(4));
            LinearLayout.LayoutParams cp = lp(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, 8);
            cp.gravity = Gravity.CENTER_HORIZONTAL;
            col.addView(chip, cp);
        }

        View line = new View(this);
        line.setBackgroundColor(0x33F2D98A);
        col.addView(line, lp(ViewGroup.LayoutParams.MATCH_PARENT, dp(1), 16));

        col.addView(text("האירועים שלי", 14, MUTED, R.font.assistant_extrabold, Gravity.START), lp(-1, -2, 12));
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        long start = PhoneCal.dayStart(y, m, d);
        List<PhoneCal.Ev> evs = PhoneCal.load(this, start - Engine.DAY, start + 2 * Engine.DAY);
        int n = 0;
        TimeZone tz = TimeZone.getDefault();
        for (PhoneCal.Ev v : evs) {
            if (v.day0 > ed || v.day1 < ed) continue;
            list.addView(eventRow(v, ed, tz), lp(-1, -2, n == 0 ? 6 : 8));
            n++;
        }
        if (n == 0) {
            String msg = PhoneCal.hasPermission(this) ? "אין אירועים ביום הזה" : "אין גישה ליומן — אפשר לאשר בהגדרות הווידג'ט";
            list.addView(text(msg, 14, Color.WHITE, R.font.assistant_regular, Gravity.START), lp(-1, -2, 6));
        }
        ScrollView sv = new ScrollView(this);
        sv.addView(list, new ViewGroup.LayoutParams(-1, -2));
        // עד כ-55% מהמסך — אחרת נגלל בתוך החלון
        int maxH = Math.round(getResources().getDisplayMetrics().heightPixels * 0.55f);
        list.measure(View.MeasureSpec.makeMeasureSpec(dp(400), View.MeasureSpec.AT_MOST), View.MeasureSpec.UNSPECIFIED);
        col.addView(sv, new LinearLayout.LayoutParams(-1, Math.min(maxH, Math.max(list.getMeasuredHeight(), dp(24)))));

        // תזכורת חדשה ליום הזה — נכתבת ליומן הטלפון עם התראה (ReminderActivity, 1.1.9)
        TextView rem = button("🔔 הוספת תזכורת ליום הזה", false);
        rem.setOnClickListener(v -> launch(il.co.jewishcalendar.twa.cal.ReminderActivity.forDay(this, y, m, d)));
        col.addView(rem, lp(-1, dp(44), 16));
        TextView open = button("פתיחה ביומן הטלפון", true);
        open.setOnClickListener(v -> launch(PhoneCal.openDay(start)));
        col.addView(open, lp(-1, dp(48), 10));
        TextView site = button("בלוח השנה של הלוח היהודי", false);
        site.setOnClickListener(v -> {
            String iso = y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(Ui.SITE + "?open=calendar&d=" + iso + "&src=widget"));
            i.setComponent(new ComponentName(this, LauncherActivity.class));
            launch(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        });
        col.addView(site, lp(-1, dp(44), 10));
        return col;
    }

    private View eventRow(PhoneCal.Ev v, long ed, TimeZone tz) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        row.setPadding(dp(12), dp(10), dp(12), dp(10));
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(14));
        bg.setColor(0x0FFFFFFF);
        row.setBackground(bg);
        View bar = new View(this);
        GradientDrawable bb = new GradientDrawable();
        bb.setCornerRadius(dp(3));
        bb.setColor(v.color);
        bar.setBackground(bb);
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(dp(5), ViewGroup.LayoutParams.MATCH_PARENT);
        bp.setMarginEnd(dp(10));
        row.addView(bar, bp);
        LinearLayout txt = new LinearLayout(this);
        txt.setOrientation(LinearLayout.VERTICAL);
        TextView t = text(v.title, 16, Color.WHITE, R.font.assistant_extrabold, Gravity.START);
        t.setTextDirection(View.TEXT_DIRECTION_ANY_RTL);
        txt.addView(t);
        String sub = range(v, ed, tz) + (v.where.isEmpty() ? "" : " · " + v.where);
        txt.addView(text(sub, 13, MUTED, R.font.assistant_regular, Gravity.START));
        row.addView(txt, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        row.setClickable(true);
        row.setOnClickListener(x -> launch(PhoneCal.openEvent(v)));
        row.setContentDescription(v.title + " · " + sub);
        return row;
    }

    /** "כל היום", "14:30–15:30", "עד 10:00" (התחיל אתמול), "מ-22:00" (נגמר מחר). */
    private static String range(PhoneCal.Ev v, long ed, TimeZone tz) {
        if (v.allDay) {
            if (v.day1 > v.day0) {
                int[] e = PhoneCal.ymdOf(v.day1);
                return "כל היום · עד " + Heb.gregShort(e[1], e[2]);
            }
            return "כל היום";
        }
        boolean startsBefore = v.day0 < ed, endsAfter = v.day1 > ed;
        if (startsBefore && endsAfter) return "כל היום";
        if (startsBefore) return "עד " + Heb.time(v.end, tz);
        if (endsAfter) return "מ-" + Heb.time(v.begin, tz);
        if (v.end <= v.begin) return Heb.time(v.begin, tz);
        // בכיוון ימין-לשמאל "14:30–15:30" מתהפך ל-"15:30–14:30" — עוטפים כשורה משמאל לימין
        return Ui.ltr(Heb.time(v.begin, tz) + "–" + Heb.time(v.end, tz));
    }

    private void launch(Intent i) {
        try {
            startActivity(i);
            finish();
        } catch (Exception ex) {
            Toast.makeText(this, "לא נמצאה אפליקציית יומן בטלפון", Toast.LENGTH_SHORT).show();
        }
    }
}
