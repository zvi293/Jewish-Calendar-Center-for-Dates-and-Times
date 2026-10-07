package il.co.jewishcalendar.twa.cal;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

import androidx.core.content.res.ResourcesCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import il.co.jewishcalendar.twa.R;
import il.co.jewishcalendar.twa.widget.Sync;
import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * מסך "סנכרון ליומן הטלפון" (10/2026, גרסה 1.1.3). נפתח מהאתר — כפתור "ליומן הטלפון" בלוח
 * החודשי (script.js openPhoneCalendarSync → intent://calendar-sync, scheme jewishcalendar).
 * הפעלה: הרשאת יומן (פעם אחת) → בחירה אוטומטית של היומן הראשי (Google / Samsung / Xiaomi,
 * אפשר להחליף) → כל האירועים נכתבים, ומשם מתעדכנים לבד (CalJob + שינוי עיר באתר).
 * כיבוי מוחק את כל האירועים שהוספנו. כל הכתיבה ליומן — ב-CalSync.
 */
public class CalendarSyncActivity extends Activity {
    private static final int NAVY = 0xFF0F172A, GOLD = 0xFFF2D98A, MUTED = 0xFF94A3B8;
    private static final int REQ_PERM = 41;

    private TextView status, calRow, cityRow, primary, secondary, settingsBtn;
    private boolean busy;
    private boolean pendingCatResync;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        setContentView(buildUi());
        refresh();
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private Typeface font(int res) {
        try {
            return ResourcesCompat.getFont(this, res);
        } catch (Exception e) {
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
        t.setLineSpacing(0, 1.15f);
        return t;
    }

    private TextView button(String s, boolean primary) {
        TextView t = text(s, 16, primary ? 0xFF211603 : GOLD, R.font.assistant_extrabold, Gravity.CENTER);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(999));
        if (primary) bg.setColors(new int[]{0xFFFDE68A, 0xFFE0B74F});
        else {
            bg.setColor(0x14FFFFFF);
            bg.setStroke(dp(1), 0x99F2D98A);
        }
        t.setBackground(bg);
        t.setClickable(true);
        t.setPadding(dp(16), 0, dp(16), 0);
        return t;
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        c.setPadding(dp(16), dp(14), dp(16), dp(14));
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(18));
        bg.setColor(0x0FFFFFFF);
        bg.setStroke(dp(1), 0x33F2D98A);
        c.setBackground(bg);
        return c;
    }

    private LinearLayout.LayoutParams lp(int w, int h, int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(w, h);
        p.topMargin = dp(top);
        return p;
    }

    private View buildUi() {
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(NAVY);
        sv.setFillViewport(true);
        sv.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        col.setPadding(dp(20), dp(26), dp(20), dp(24));
        sv.addView(col, new ViewGroup.LayoutParams(-1, -2));

        col.addView(text("הלוח היהודי", 14, GOLD, R.font.frl_bold, Gravity.START));
        TextView title = text("סנכרון ליומן הטלפון", 25, Color.WHITE, R.font.frl_black, Gravity.START);
        title.setPadding(0, dp(4), 0, dp(6));
        col.addView(title);
        col.addView(text("כל החגים, הצומות, ראשי החודשים וזמני כניסת השבת והחג — ביומן הראשי של הטלפון. "
                + "היומן מתעדכן לבד, גם בלי לפתוח את האפליקציה.", 15, 0xE6FFFFFF, R.font.assistant_regular, Gravity.START));

        // מצב
        LinearLayout st = card();
        status = text("", 15.5f, Color.WHITE, R.font.assistant_bold, Gravity.START);
        st.addView(status);
        calRow = text("", 14, 0xE6FFFFFF, R.font.assistant_regular, Gravity.START);
        st.addView(calRow, lp(-1, -2, 8));
        TextView change = text("החלפת יומן ←", 14, GOLD, R.font.assistant_bold, Gravity.START);
        change.setPadding(0, dp(6), 0, dp(2));
        change.setOnClickListener(v -> chooseCalendar());
        st.addView(change);
        cityRow = text("", 13.5f, MUTED, R.font.assistant_regular, Gravity.START);
        st.addView(cityRow, lp(-1, -2, 8));
        col.addView(st, lp(-1, -2, 18));

        // מה יופיע ביומן
        col.addView(text("מה יופיע ביומן", 16, GOLD, R.font.assistant_extrabold, Gravity.START), lp(-1, -2, 20));
        LinearLayout cats = card();
        for (int i = 0; i < CalSync.CATS.length; i++) {
            final String key = CalSync.CATS[i][0];
            Switch sw = new Switch(this);
            sw.setText(CalSync.CATS[i][1]);
            sw.setTextSize(15);
            sw.setTextColor(Color.WHITE);
            sw.setTypeface(font(R.font.assistant_semibold));
            sw.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
            sw.setTextDirection(View.TEXT_DIRECTION_RTL);
            sw.setChecked(CalSync.cat(this, key));
            sw.setPadding(0, dp(9), 0, dp(9));
            // זהב כשפעיל, אפור כשכבוי — בצבעי ברירת המחדל לא היה ברור על הכרטיס הכהה מה פעיל
            int[][] states = {{android.R.attr.state_checked}, {}};
            sw.setThumbTintList(new ColorStateList(states, new int[]{GOLD, 0xFF94A3B8}));
            sw.setTrackTintList(new ColorStateList(states, new int[]{0x99F2D98A, 0x33FFFFFF}));
            sw.setOnCheckedChangeListener((CompoundButton btn, boolean on) -> {
                CalSync.setCat(this, key, on);
                // מסונכרן — מוסיפים/מוחקים את הקטגוריה מיד (אחרי שהמשתמש סיים ללחוץ)
                if (CalSync.enabled(this) && CalSync.hasPermission(this)) {
                    pendingCatResync = true;
                    status.removeCallbacks(catResync);
                    status.postDelayed(catResync, 1200);
                }
            });
            cats.addView(sw, new LinearLayout.LayoutParams(-1, -2));
        }
        col.addView(cats, lp(-1, -2, 8));

        primary = button("הפעלת הסנכרון", true);
        primary.setOnClickListener(v -> onPrimary());
        col.addView(primary, lp(-1, dp(54), 22));

        secondary = button("כיבוי ומחיקת האירועים מהיומן", false);
        secondary.setOnClickListener(v -> confirmDisable());
        col.addView(secondary, lp(-1, dp(48), 10));

        settingsBtn = button("פתיחת הגדרות ההרשאות של האפליקציה", false);
        settingsBtn.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.fromParts("package", getPackageName(), null))));
        col.addView(settingsBtn, lp(-1, dp(48), 10));

        TextView note = text("האירועים נכתבים ליומן שנבחר ומסונכרנים איתו (למשל לחשבון Google — וכך מופיעים גם במחשב). "
                + "הזמנים לפי העיר שנבחרה באתר. אפשר לכבות בכל רגע — וכל האירועים שהוספנו יימחקו.", 12.5f, MUTED, R.font.assistant_regular, Gravity.START);
        col.addView(note, lp(-1, -2, 18));

        TextView back = text("חזרה ללוח ←", 15, GOLD, R.font.assistant_bold, Gravity.CENTER);
        back.setPadding(0, dp(12), 0, dp(6));
        back.setOnClickListener(v -> finish());
        col.addView(back, lp(-1, -2, 8));
        return sv;
    }

    private final Runnable catResync = () -> {
        if (pendingCatResync && !busy) {
            pendingCatResync = false;
            runSync(false);
        }
    };

    /** מעדכן את הטקסטים והכפתורים לפי המצב. */
    private void refresh() {
        boolean on = CalSync.enabled(this), perm = CalSync.hasPermission(this);
        Loc loc = Sync.loc(this);
        cityRow.setText("הזמנים לפי: " + (loc.name.isEmpty() ? "פתח תקווה" : loc.name)
                + (loc.synced ? " (כמו באתר)" : " — אפשר לבחור עיר בהגדרות האתר"));
        if (perm) {
            List<CalSync.Cal> list = CalSync.writable(this);
            CalSync.Cal k = CalSync.byId(list, CalSync.sp(this).getLong("cal_id", -1));
            if (k == null) k = CalSync.pickMain(list);
            calRow.setText("היומן: " + (k == null ? "יומן מקומי \"הלוח היהודי\"" : k.label()));
        } else {
            calRow.setText("היומן: היומן הראשי של הטלפון (Google / Samsung / Xiaomi)");
        }
        if (busy) return;
        if (on && perm) {
            long last = CalSync.sp(this).getLong("last_run", 0);
            int n = CalSync.sp(this).getInt("last_total", 0);
            String when = last == 0 ? "" : " · עודכן " + new SimpleDateFormat("d.M HH:mm", Locale.US).format(new Date(last));
            status.setText("✓ הסנכרון פעיל — " + n + " אירועים ביומן" + when);
            status.setTextColor(0xFF86EFAC);
            primary.setText("עדכון עכשיו");
            secondary.setVisibility(View.VISIBLE);
        } else if (on) {
            status.setText("אין הרשאה ליומן — הסנכרון מושהה");
            status.setTextColor(0xFFFCA5A5);
            primary.setText("אישור גישה ליומן");
            secondary.setVisibility(View.VISIBLE);
        } else {
            status.setText("הסנכרון כבוי");
            status.setTextColor(Color.WHITE);
            primary.setText("הפעלת הסנכרון");
            secondary.setVisibility(View.GONE);
        }
        settingsBtn.setVisibility(View.GONE);
    }

    private void onPrimary() {
        if (busy) return;
        if (!CalSync.hasPermission(this)) {
            requestPermissions(new String[]{Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR}, REQ_PERM);
            return;
        }
        runSync(true);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != REQ_PERM) return;
        if (CalSync.hasPermission(this)) {
            runSync(true);
        } else {
            refresh();
            status.setText("בלי הרשאה ליומן אי אפשר להוסיף אליו את האירועים. אפשר לאשר בהגדרות האפליקציה ← הרשאות ← יומן.");
            status.setTextColor(0xFFFCA5A5);
            settingsBtn.setVisibility(View.VISIBLE);
        }
    }

    private void setBusy(boolean b, String msg) {
        busy = b;
        primary.setEnabled(!b);
        secondary.setEnabled(!b);
        primary.setAlpha(b ? 0.6f : 1f);
        secondary.setAlpha(b ? 0.6f : 1f);
        if (msg != null) {
            status.setText(msg);
            status.setTextColor(Color.WHITE);
        }
    }

    /** הפעלה / עדכון — ברקע. enable=true מפעיל את הסנכרון ואת העבודה היומית. */
    private void runSync(boolean enable) {
        setBusy(true, CalSync.enabled(this) ? "מעדכן את היומן…" : "מוסיף את האירועים ליומן…");
        new Thread(() -> {
            if (enable) CalSync.sp(this).edit().putBoolean("on", true).apply();
            CalSync.Result r = CalSync.run(getApplicationContext());
            if (r.ok) CalSync.scheduleJob(getApplicationContext());
            runOnUiThread(() -> {
                if (isFinishing()) return;
                busy = false;
                setBusy(false, null);
                refresh();
                if (r.ok) {
                    String delta = r.added > 0 ? "נוספו " + r.added + " אירועים" : "הכול מעודכן";
                    if (r.updated > 0) delta += " · עודכנו " + r.updated;
                    if (r.removed > 0) delta += " · הוסרו " + r.removed;
                    status.setText("✓ " + delta + "\nבסך הכול " + r.total + " אירועים ביומן " + r.calendar);
                    status.setTextColor(0xFF86EFAC);
                } else if ("nocal".equals(r.error)) {
                    status.setText("לא נמצא יומן בטלפון שאפשר להוסיף אליו אירועים.");
                    status.setTextColor(0xFFFCA5A5);
                } else if (!"perm".equals(r.error)) {
                    status.setText("הסנכרון נכשל — נסו שוב בעוד רגע.");
                    status.setTextColor(0xFFFCA5A5);
                }
            });
        }, "jc-cal-ui").start();
    }

    private void confirmDisable() {
        if (busy) return;
        new AlertDialog.Builder(this)
                .setTitle("כיבוי הסנכרון")
                .setMessage("כל האירועים שהלוח היהודי הוסיף ליומן יימחקו. להמשיך?")
                .setPositiveButton("כיבוי ומחיקה", (d, w) -> {
                    setBusy(true, "מוחק את האירועים מהיומן…");
                    new Thread(() -> {
                        CalSync.Result r = CalSync.disable(getApplicationContext());
                        runOnUiThread(() -> {
                            if (isFinishing()) return;
                            setBusy(false, null);
                            refresh();
                            if (r.ok) status.setText("הסנכרון כובה — נמחקו " + r.removed + " אירועים מהיומן");
                        });
                    }, "jc-cal-off").start();
                })
                .setNegativeButton("ביטול", null)
                .show();
    }

    private void chooseCalendar() {
        if (busy) return;
        if (!CalSync.hasPermission(this)) {
            requestPermissions(new String[]{Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR}, REQ_PERM);
            return;
        }
        List<CalSync.Cal> list = CalSync.writable(this);
        if (list.isEmpty()) {
            status.setText("לא נמצאו יומנים בטלפון — ייווצר יומן מקומי \"הלוח היהודי\".");
            return;
        }
        String[] names = new String[list.size()];
        long cur = CalSync.sp(this).getLong("cal_id", -1);
        int sel = -1;
        for (int i = 0; i < list.size(); i++) {
            names[i] = list.get(i).label();
            if (list.get(i).id == cur) sel = i;
        }
        new AlertDialog.Builder(this)
                .setTitle("לאיזה יומן להוסיף?")
                .setSingleChoiceItems(names, sel, (d, which) -> {
                    CalSync.sp(this).edit().putLong("cal_id", list.get(which).id).apply();
                    d.dismiss();
                    refresh();
                    // מסונכרן — עוברים ליומן החדש (CalSync מוחק מהקודם)
                    if (CalSync.enabled(this)) runSync(false);
                })
                .setNegativeButton("ביטול", null)
                .show();
    }
}
