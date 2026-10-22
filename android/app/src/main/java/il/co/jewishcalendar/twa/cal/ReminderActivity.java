package il.co.jewishcalendar.twa.cal;

import android.Manifest;
import android.app.Activity;
import android.app.TimePickerDialog;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.text.InputType;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.res.ResourcesCompat;

import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.R;

/**
 * "תזכורת ביומן הטלפון" (10/2026, גרסה 1.1.9) — במקום ההערות של הלוח החודשי באתר.
 * התזכורת נכתבת כאירוע עם התראה ליומן שהסנכרון כותב אליו (CalSync.targetCalendar — הראשי של
 * הטלפון), וההתראה עצמה מגיעה מאפליקציית היומן של הטלפון, לא מאיתנו. האירוע לא מסומן
 * ב-CalSync.MARK: הסנכרון לא נוגע בו (לא "יתום"), והוא מופיע בווידג'ט "לוח שנה" כאירוע שלי.
 *
 * נפתח משני מקומות:
 *  · מהאתר — חלון היום בלוח החודשי (script.js _calReminderSubmit):
 *    intent://reminder?d=2026-10-25&t=…&h=09:00&a=0&r=10&go=1#Intent;scheme=jewishcalendar;package=…;end
 *    go=1 = הטופס כבר מולא באתר — נשמר מיד (אחרי הרשאה, אם צריך), הודעה קצרה, וחוזרים.
 *  · מחלון היום של הווידג'ט (DayActivity) — עם התאריך בלבד, והטופס כאן.
 */
public class ReminderActivity extends Activity {
    private static final String TAG = "JcReminder";
    private static final int NAVY = 0xFF0F172A, GOLD = 0xFFF2D98A, MUTED = 0xFF94A3B8;
    private static final int REQ_PERM = 43;
    // [דקות לפני, תווית] — אירוע עם שעה / אירוע של כל היום (ביומן: לפני חצות של אותו יום)
    static final int[] TIMED_MIN = {0, 10, 30, 60, 1440};
    static final String[] TIMED_LBL = {"בזמן", "10 דק׳ לפני", "חצי שעה לפני", "שעה לפני", "יום לפני"};
    static final int[] ALLDAY_MIN = {0, 240, 900};
    static final String[] ALLDAY_LBL = {"בתחילת היום", "בערב שלפני (20:00)", "יום לפני (09:00)"};

    private int y, m, d, hour = 9, minute = 0, remindIdx = 1;
    private boolean allDay;
    private EditText titleIn;
    private TextView timeBtn, status;
    private LinearLayout chips;
    private boolean pendingSave;

    /** פתיחה מחלון היום של הווידג'ט. */
    public static Intent forDay(Context c, int y, int m, int d) {
        String iso = String.format(Locale.US, "%04d-%02d-%02d", y, m, d);
        return new Intent(c, ReminderActivity.class).setData(Uri.parse("jewishcalendar://reminder?d=" + iso));
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Calendar now = Calendar.getInstance();
        y = now.get(Calendar.YEAR);
        m = now.get(Calendar.MONTH) + 1;
        d = now.get(Calendar.DAY_OF_MONTH);
        String title = "";
        boolean go = false;
        Uri u = getIntent().getData();
        if (u != null) {
            try {
                String ds = u.getQueryParameter("d");
                if (ds != null && ds.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    y = Integer.parseInt(ds.substring(0, 4));
                    m = Integer.parseInt(ds.substring(5, 7));
                    d = Integer.parseInt(ds.substring(8, 10));
                }
                String t = u.getQueryParameter("t");
                if (t != null) title = t.trim();
                String h = u.getQueryParameter("h");
                if (h != null && h.matches("\\d{1,2}:\\d{2}")) {
                    hour = Math.min(23, Integer.parseInt(h.substring(0, h.indexOf(':'))));
                    minute = Math.min(59, Integer.parseInt(h.substring(h.indexOf(':') + 1)));
                }
                allDay = "1".equals(u.getQueryParameter("a"));
                String r = u.getQueryParameter("r");
                if (r != null) {
                    int rm = Integer.parseInt(r);
                    int[] opts = allDay ? ALLDAY_MIN : TIMED_MIN;
                    for (int i = 0; i < opts.length; i++) if (opts[i] == rm) remindIdx = i;
                } else if (allDay) remindIdx = 1;
                go = "1".equals(u.getQueryParameter("go"));
            } catch (Exception e) {
                Log.w(TAG, "bad uri " + u, e);
            }
        }
        if (title.length() > 200) title = title.substring(0, 200);

        setFinishOnTouchOutside(!go);
        setContentView(buildUi(title));
        int sw = getResources().getDisplayMetrics().widthPixels;
        getWindow().setLayout(Math.min(Math.round(sw * 0.92f), dp(460)), ViewGroup.LayoutParams.WRAP_CONTENT);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(NAVY);
        bg.setCornerRadius(dp(24));
        bg.setStroke(dp(1), 0x55F2D98A);
        getWindow().setBackgroundDrawable(bg);

        // מהאתר, כשהטופס מלא — שומרים מיד
        if (go && !title.isEmpty()) save();
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

    private View buildUi(String title) {
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        col.setPadding(dp(20), dp(20), dp(20), dp(18));

        col.addView(text("🔔 תזכורת ביומן הטלפון", 20, Color.WHITE, R.font.frl_bold, Gravity.CENTER));
        col.addView(text(String.format(Locale.US, "%d.%d.%d", d, m, y), 15, GOLD, R.font.assistant_extrabold, Gravity.CENTER), lp(-1, -2, 2));

        titleIn = new EditText(this);
        titleIn.setText(title);
        titleIn.setHint("על מה להזכיר?");
        titleIn.setHintTextColor(0x99FFFFFF);
        titleIn.setTextColor(Color.WHITE);
        titleIn.setTextSize(16);
        titleIn.setTypeface(font(R.font.assistant_semibold));
        titleIn.setTextDirection(View.TEXT_DIRECTION_ANY_RTL);
        titleIn.setSingleLine(true);
        titleIn.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        titleIn.setImeOptions(EditorInfo.IME_ACTION_DONE);
        GradientDrawable ib = new GradientDrawable();
        ib.setCornerRadius(dp(14));
        ib.setColor(0x14FFFFFF);
        ib.setStroke(dp(1), 0x55F2D98A);
        titleIn.setBackground(ib);
        titleIn.setPadding(dp(14), dp(10), dp(14), dp(10));
        col.addView(titleIn, lp(-1, -2, 14));

        Switch sw = new Switch(this);
        sw.setText("כל היום");
        sw.setTextSize(15);
        sw.setTextColor(Color.WHITE);
        sw.setTypeface(font(R.font.assistant_semibold));
        sw.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        sw.setTextDirection(View.TEXT_DIRECTION_RTL);
        int[][] states = {{android.R.attr.state_checked}, {}};
        sw.setThumbTintList(new ColorStateList(states, new int[]{GOLD, 0xFF94A3B8}));
        sw.setTrackTintList(new ColorStateList(states, new int[]{0x99F2D98A, 0x33FFFFFF}));
        sw.setChecked(allDay);
        sw.setOnCheckedChangeListener((btn, on) -> {
            allDay = on;
            remindIdx = 1;
            timeBtn.setVisibility(on ? View.GONE : View.VISIBLE);
            buildChips();
        });
        col.addView(sw, lp(-1, -2, 12));

        timeBtn = button("", false);
        timeBtn.setOnClickListener(v -> new TimePickerDialog(this, (tp, h, mi) -> {
            hour = h;
            minute = mi;
            updateTime();
        }, hour, minute, true).show());
        timeBtn.setVisibility(allDay ? View.GONE : View.VISIBLE);
        col.addView(timeBtn, lp(-1, dp(44), 10));
        updateTime();

        col.addView(text("מתי להזכיר", 14, MUTED, R.font.assistant_extrabold, Gravity.START), lp(-1, -2, 14));
        chips = new LinearLayout(this);
        chips.setOrientation(LinearLayout.VERTICAL);
        col.addView(chips, lp(-1, -2, 6));
        buildChips();

        status = text("", 13.5f, 0xFFFCA5A5, R.font.assistant_bold, Gravity.CENTER);
        status.setVisibility(View.GONE);
        col.addView(status, lp(-1, -2, 10));

        TextView save = button("הוספה ליומן", true);
        save.setOnClickListener(v -> save());
        col.addView(save, lp(-1, dp(50), 16));
        TextView cancel = text("ביטול", 15, GOLD, R.font.assistant_bold, Gravity.CENTER);
        cancel.setPadding(0, dp(10), 0, dp(2));
        cancel.setOnClickListener(v -> finish());
        col.addView(cancel, lp(-1, -2, 4));
        col.addView(text("ההתראה תגיע מאפליקציית היומן של הטלפון.", 12.5f, MUTED, R.font.assistant_regular, Gravity.CENTER), lp(-1, -2, 8));
        return col;
    }

    private void updateTime() {
        timeBtn.setText(String.format(Locale.US, "שעה: %02d:%02d  ✎", hour, minute));
    }

    private void buildChips() {
        chips.removeAllViews();
        String[] lbl = allDay ? ALLDAY_LBL : TIMED_LBL;
        LinearLayout row = null;
        for (int i = 0; i < lbl.length; i++) {
            if (i % 3 == 0) {
                row = new LinearLayout(this);
                row.setOrientation(LinearLayout.HORIZONTAL);
                row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
                chips.addView(row, lp(-1, -2, i == 0 ? 0 : 6));
            }
            final int idx = i;
            TextView c = text(lbl[i], 13.5f, i == remindIdx ? 0xFF211603 : Color.WHITE, R.font.assistant_bold, Gravity.CENTER);
            GradientDrawable bg = new GradientDrawable();
            bg.setCornerRadius(dp(999));
            if (i == remindIdx) bg.setColors(new int[]{0xFFFDE68A, 0xFFE0B74F});
            else {
                bg.setColor(0x14FFFFFF);
                bg.setStroke(dp(1), 0x55F2D98A);
            }
            c.setBackground(bg);
            c.setPadding(dp(6), dp(8), dp(6), dp(8));
            c.setOnClickListener(v -> {
                remindIdx = idx;
                buildChips();
            });
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
            p.setMarginEnd(dp(6));
            row.addView(c, p);
        }
    }

    private boolean hasWrite() {
        return checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == android.content.pm.PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.READ_CALENDAR) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private void save() {
        String t = titleIn.getText().toString().trim();
        if (t.isEmpty()) {
            showError("כתבו על מה להזכיר");
            return;
        }
        if (!hasWrite()) {
            pendingSave = true;
            requestPermissions(new String[]{Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR}, REQ_PERM);
            return;
        }
        final int rem = (allDay ? ALLDAY_MIN : TIMED_MIN)[Math.min(remindIdx, (allDay ? ALLDAY_MIN : TIMED_MIN).length - 1)];
        new Thread(() -> {
            String cal = insert(getApplicationContext(), t, y, m, d, allDay, hour, minute, rem);
            runOnUiThread(() -> {
                if (isFinishing()) return;
                if (cal == null) {
                    showError("לא הצלחנו להוסיף ליומן — נסו שוב");
                    return;
                }
                Toast.makeText(this, "✓ התזכורת נוספה ליומן " + cal, Toast.LENGTH_LONG).show();
                finish();
            });
        }, "jc-reminder").start();
    }

    private void showError(String s) {
        status.setText(s);
        status.setVisibility(View.VISIBLE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != REQ_PERM) return;
        if (hasWrite()) {
            if (pendingSave) save();
        } else {
            setFinishOnTouchOutside(true);
            showError("בלי הרשאה ליומן אי אפשר להוסיף אליו תזכורת. אפשר לאשר בהגדרות האפליקציה ← הרשאות ← יומן.");
        }
        pendingSave = false;
    }

    /**
     * כותב את האירוע + התראה ליומן היעד. מחזיר את שם היומן, או null בכישלון.
     * כל היום — חצות UTC (כך דורש ספק היומן); עם שעה — לפי שעון הטלפון, חצי שעה.
     */
    static String insert(Context c, String title, int y, int m, int d, boolean allDay, int hour, int minute, int remindMin) {
        try {
            CalSync.Cal k = CalSync.targetCalendar(c);
            if (k == null) return null;
            ContentResolver cr = c.getContentResolver();
            ContentValues v = new ContentValues();
            v.put(CalendarContract.Events.CALENDAR_ID, k.id);
            v.put(CalendarContract.Events.TITLE, title);
            v.put(CalendarContract.Events.DESCRIPTION, "תזכורת שנוספה מהלוח היהודי");
            long start, end;
            if (allDay) {
                Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
                u.clear();
                u.set(y, m - 1, d, 0, 0, 0);
                start = u.getTimeInMillis();
                end = start + 86400000L;
                v.put(CalendarContract.Events.ALL_DAY, 1);
                v.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");
            } else {
                Calendar l = Calendar.getInstance();
                l.clear();
                l.set(y, m - 1, d, hour, minute, 0);
                start = l.getTimeInMillis();
                end = start + 30 * 60000L;
                v.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
            }
            v.put(CalendarContract.Events.DTSTART, start);
            v.put(CalendarContract.Events.DTEND, end);
            v.put(CalendarContract.Events.HAS_ALARM, 1);
            Uri ev = cr.insert(CalendarContract.Events.CONTENT_URI, v);
            if (ev == null) return null;
            long id = ContentUris.parseId(ev);
            ContentValues r = new ContentValues();
            r.put(CalendarContract.Reminders.EVENT_ID, id);
            r.put(CalendarContract.Reminders.MINUTES, remindMin);
            r.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
            cr.insert(CalendarContract.Reminders.CONTENT_URI, r);
            Log.i(TAG, "reminder " + id + " in calendar " + k.id);
            return k.label();
        } catch (Throwable t) {
            Log.w(TAG, "insert", t);
            return null;
        }
    }
}
