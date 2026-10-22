package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.RemoteViews;
import android.widget.CheckBox;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.Switch;
import android.widget.TextView;

import android.Manifest;
import android.content.res.ColorStateList;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import androidx.core.content.res.ResourcesCompat;

import il.co.jewishcalendar.twa.R;
import il.co.jewishcalendar.twa.widget.core.Engine;

/**
 * הגדרות ווידג'ט: נפתח בהוספה (ובאנדרואיד 12+ גם בלחיצה ארוכה ← הגדרות הווידג'ט).
 * תצוגה מקדימה אמיתית של הווידג'ט בשני הסגנונות — שמיים חיים (ברירת המחדל) וזכוכית.
 */
public class ConfigActivity extends Activity {
    private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private W.Kind kind = W.Kind.DATE;
    private String chosen = Prefs.STYLE_SKY;
    private FrameLayout cardSky, cardGlass;
    // סליידר השקיפות (10/2026): אטימות הרקע 0–100, לשני הסגנונות; התצוגות המקדימות נבנות מחדש בכל שינוי
    private int opacity = 100;
    private FrameLayout pvSky, pvGlass;
    private TextView opLabel;
    // ווידג'ט "לוח שנה": האירועים שלי מיומן הטלפון (PhoneCal) — נשמר רק ב"שמירה"
    private boolean pcOn;
    private final Set<Long> pcHidden = new HashSet<>();
    private Switch pcSwitch;
    private LinearLayout pcList;
    private TextView pcNote;
    private static final int REQ_CAL = 52;

    private static final int NAVY = 0xFF0F172A, GOLD = 0xFFF2D98A;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        setResult(RESULT_CANCELED);
        Bundle ex = getIntent().getExtras();
        if (ex != null) widgetId = ex.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }
        AppWidgetProviderInfo info = AppWidgetManager.getInstance(this).getAppWidgetInfo(widgetId);
        if (info != null) {
            for (W.Kind k : W.Kind.values()) {
                if (W.classOf(k).getName().equals(info.provider.getClassName())) kind = k;
            }
        }
        chosen = Prefs.hasStyle(this, widgetId) ? Prefs.style(this, widgetId) : Prefs.sp(this).getString("style_default", Prefs.STYLE_SKY);
        opacity = Prefs.opacity(this, widgetId);
        getWindow().setStatusBarColor(NAVY);
        getWindow().setNavigationBarColor(NAVY);
        setContentView(buildUi());
        select(chosen);
    }

    private int dp(float v) {
        return Ui.px(this, v);
    }

    private Typeface font(int res) {
        try {
            return ResourcesCompat.getFont(this, res);
        } catch (Exception e) {
            return Typeface.DEFAULT_BOLD;
        }
    }

    private TextView text(String s, float sp, int color, int fontRes) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTypeface(font(fontRes));
        t.setGravity(Gravity.CENTER);
        return t;
    }

    private View buildUi() {
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(NAVY);
        sv.setFillViewport(true);
        // אנדרואיד 15: התצוגה מקצה לקצה — ריפוד לפי שורת הסטטוס והניווט
        sv.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        col.setPadding(dp(20), dp(28), dp(20), dp(24));
        sv.addView(col, new ViewGroup.LayoutParams(-1, -2));

        col.addView(text("הלוח היהודי", 14, GOLD, R.font.frl_bold));
        TextView title = text("בחרו סגנון לווידג'ט", 24, Color.WHITE, R.font.frl_black);
        title.setPadding(0, dp(4), 0, dp(4));
        col.addView(title);
        col.addView(text("אפשר לשנות בכל עת בלחיצה ארוכה על הווידג'ט", 13, 0xFF94A3B8, R.font.assistant_regular));

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        row.setPadding(0, dp(20), 0, dp(8));
        cardSky = previewCard(Prefs.STYLE_SKY, "שמיים חיים", "הרקע מתחלף לפי השעה ההלכתית — כמו באתר");
        cardGlass = previewCard(Prefs.STYLE_GLASS, "זכוכית", "שקוף למחצה — משתלב בטפט שלכם");
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1);
        row.addView(cardSky, lp);
        View g = new View(this);
        row.addView(g, new LinearLayout.LayoutParams(dp(12), 1));
        row.addView(cardGlass, new LinearLayout.LayoutParams(0, -2, 1));
        col.addView(row);
        col.addView(opacityCard(), new LinearLayout.LayoutParams(-1, -2));
        if (kind == W.Kind.MONTH) col.addView(phoneCalCard(), new LinearLayout.LayoutParams(-1, -2));

        View sp = new View(this);
        col.addView(sp, new LinearLayout.LayoutParams(1, 0, 1));

        TextView done = button("שמירה", true);
        done.setOnClickListener(v -> finishOk());
        LinearLayout.LayoutParams dpm = new LinearLayout.LayoutParams(-1, dp(54));
        dpm.topMargin = dp(20);
        col.addView(done, dpm);
        return sv;
    }

    private TextView button(String s, boolean primary) {
        TextView t = text(s, 16, primary ? 0xFF211603 : GOLD, R.font.assistant_extrabold);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(999));
        if (primary) bg.setColors(new int[]{0xFFFDE68A, 0xFFE0B74F});
        else {
            bg.setColor(0x14FFFFFF);
            bg.setStroke(dp(1), 0x99F2D98A);
        }
        t.setBackground(bg);
        t.setClickable(true);
        return t;
    }

    private FrameLayout previewCard(String style, String name, String desc) {
        FrameLayout card = new FrameLayout(this);
        LinearLayout inner = new LinearLayout(this);
        inner.setOrientation(LinearLayout.VERTICAL);
        inner.setPadding(dp(10), dp(10), dp(10), dp(12));
        // תצוגה מקדימה אמיתית — אותו RemoteViews שיוצג במסך הבית
        FrameLayout pv = new FrameLayout(this);
        GradientDrawable wall = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{0xFFC98B5A, 0xFF6D8C7C, 0xFF2F5C6E, 0xFF1D3550});
        wall.setCornerRadius(dp(14));
        pv.setBackground(wall);
        pv.setPadding(dp(8), dp(8), dp(8), dp(8));
        if (Prefs.STYLE_SKY.equals(style)) pvSky = pv; else pvGlass = pv;
        float[] wh = fillPreview(pv, style, name);
        // גובה קבוע: בגובה wrap_content התצוגה של "לוח שנה" נמדדה פי 2 מהווידג'ט (נמדד 10/2026)
        // ודחפה את שם הסגנון, את הגדרות היומן ואת כפתור השמירה אל מחוץ למסך
        inner.addView(pv, new LinearLayout.LayoutParams(-1, dp(wh[1] + 16)));
        TextView n = text(name, 17, Color.WHITE, R.font.assistant_extrabold);
        n.setPadding(0, dp(10), 0, dp(2));
        inner.addView(n);
        inner.addView(text(desc, 12, 0xFF94A3B8, R.font.assistant_regular));
        card.addView(inner);
        card.setTag(style);
        card.setOnClickListener(v -> select(style));
        card.setClickable(true);
        return card;
    }

    /** התצוגה המקדימה עצמה (ה-RemoteViews האמיתי) — נבנית מחדש גם כשהשקיפות משתנה. */
    private float[] fillPreview(FrameLayout pv, String style, String name) {
        pv.removeAllViews();
        float[] wh = previewSize();
        // "לוח שנה": 7 עמודות לא נכנסות ברוחב של חצי מסך — המספרים הדו-ספרתיים נחתכו ("1" במקום "12").
        // לכן הוא נבנה בגודל האמיתי שלו (4×4) ומוקטן כתמונה — מיניאטורה נאמנה של מה שיופיע במסך הבית.
        float rw = wh[0], rh = wh[1], scale = 1f;
        if (kind == W.Kind.MONTH) {
            int[] cells = Updater.defaultCells(kind);
            rw = cells[0] * 90 - 8;
            rh = cells[1] * 120 - 8;
            scale = Math.min(1f, wh[0] / rw);
            wh[1] = rh * scale;
        }
        try {
            Engine e = new Engine(Prefs.loc(this), System.currentTimeMillis());
            RemoteViews rv = Render.build(this, kind, widgetId, rw, rh, e, style, opacity);
            View v = rv.apply(this, pv);
            if (scale < 1f) {
                FrameLayout box = new FrameLayout(this);
                box.addView(v, new FrameLayout.LayoutParams(dp(rw), dp(rh), Gravity.TOP | Gravity.LEFT));
                v.setPivotX(0);
                v.setPivotY(0);
                v.setScaleX(scale);
                v.setScaleY(scale);
                pv.addView(box, new FrameLayout.LayoutParams(dp(rw * scale), dp(rh * scale), Gravity.CENTER));
            } else {
                pv.addView(v, new FrameLayout.LayoutParams(dp(wh[0]), dp(wh[1]), Gravity.CENTER));
            }
            // 10/2026: התצוגה המקדימה היא ה-RemoteViews האמיתי, וה-PendingIntent שבתוכו
            // פתח את האפליקציה במקום לבחור סגנון. שכבה שקופה מעליה בולעת את המגע
            // ומעבירה אותו לכרטיס — כך לחיצה על התצוגה בוחרת את הסגנון.
            View shield = new View(this);
            shield.setOnClickListener(x -> select(style));
            pv.addView(shield, new FrameLayout.LayoutParams(-1, -1));
        } catch (Throwable t) {
            pv.addView(text(name, 16, Color.WHITE, R.font.frl_bold), new FrameLayout.LayoutParams(-1, dp(140)));
        }
        return wh;
    }

    /** "שקיפות הרקע" — 0% = הרקע הרגיל, 100% = רק הכיתוב על הטפט. */
    private View opacityCard() {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        card.setPadding(dp(16), dp(12), dp(16), dp(10));
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(18));
        bg.setColor(0x0FFFFFFF);
        bg.setStroke(dp(1), 0x33F2D98A);
        card.setBackground(bg);
        LinearLayout.LayoutParams top = new LinearLayout.LayoutParams(-1, -2);
        top.topMargin = dp(4);
        card.setLayoutParams(top);
        opLabel = text("", 16, Color.WHITE, R.font.assistant_extrabold);
        opLabel.setGravity(Gravity.START);
        card.addView(opLabel);
        SeekBar sb = new SeekBar(this);
        sb.setMax(100);
        sb.setProgress(100 - opacity);
        sb.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        sb.setThumbTintList(ColorStateList.valueOf(GOLD));
        sb.setProgressTintList(ColorStateList.valueOf(0xFFE0B74F));
        sb.setProgressBackgroundTintList(ColorStateList.valueOf(0x4DFFFFFF));
        sb.setContentDescription("שקיפות הרקע של הווידג'ט");
        sb.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar s, int p, boolean fromUser) {
                opacity = 100 - p;
                updateOpLabel();
                if (pvSky != null) fillPreview(pvSky, Prefs.STYLE_SKY, "שמיים חיים");
                if (pvGlass != null) fillPreview(pvGlass, Prefs.STYLE_GLASS, "זכוכית");
            }
            @Override public void onStartTrackingTouch(SeekBar s) {}
            @Override public void onStopTrackingTouch(SeekBar s) {}
        });
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, dp(40));
        sp.topMargin = dp(4);
        card.addView(sb, sp);
        TextView d = text("גוררים כדי לראות יותר מהטפט מאחורי הווידג'ט — הכיתוב נשאר כמו שהוא", 12.5f, 0xFF94A3B8, R.font.assistant_regular);
        d.setGravity(Gravity.START);
        card.addView(d);
        updateOpLabel();
        return card;
    }

    private void updateOpLabel() {
        if (opLabel != null) opLabel.setText("שקיפות הרקע: " + (100 - opacity) + "%");
    }

    /** גודל התצוגה המקדימה (dp) — מוקטן כך ששני כרטיסים ייכנסו זה ליד זה. */
    private float[] previewSize() {
        int[] cells = Updater.defaultCells(kind);
        float w = cells[0] * 90 - 8, h = cells[1] * 120 - 8;
        float maxW = (getResources().getDisplayMetrics().widthPixels / getResources().getDisplayMetrics().density - 40 - 12) / 2f - 36;
        if (w > maxW) {
            float r = maxW / w;
            w = maxW;
            h = Math.max(90, h * Math.max(r, 0.75f));
        }
        return new float[]{w, h};
    }

    private void select(String style) {
        chosen = style;
        styleCard(cardSky, Prefs.STYLE_SKY.equals(style));
        styleCard(cardGlass, Prefs.STYLE_GLASS.equals(style));
    }

    private void styleCard(FrameLayout card, boolean on) {
        if (card == null) return;
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(20));
        bg.setColor(on ? 0x24F2D98A : 0x0FFFFFFF);
        bg.setStroke(dp(on ? 2 : 1), on ? GOLD : 0x33FFFFFF);
        card.setBackground(bg);
    }

    // ── האירועים שלי מיומן הטלפון (רק בווידג'ט "לוח שנה") ──

    private View phoneCalCard() {
        pcOn = PhoneCal.active(this);
        pcHidden.addAll(PhoneCal.hidden(this));
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        card.setPadding(dp(16), dp(14), dp(16), dp(14));
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(18));
        bg.setColor(0x0FFFFFFF);
        bg.setStroke(dp(1), 0x33F2D98A);
        card.setBackground(bg);
        LinearLayout.LayoutParams top = new LinearLayout.LayoutParams(-1, -2);
        top.topMargin = dp(12);
        card.setLayoutParams(top);

        LinearLayout head = new LinearLayout(this);
        head.setOrientation(LinearLayout.HORIZONTAL);
        head.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        head.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout tc = new LinearLayout(this);
        tc.setOrientation(LinearLayout.VERTICAL);
        TextView t = text("האירועים שלי מיומן הטלפון", 16, Color.WHITE, R.font.assistant_extrabold);
        t.setGravity(Gravity.START);
        tc.addView(t);
        TextView d = text("הפגישות, ימי ההולדת והתזכורות שלכם — בתוך לוח השנה. נקודה בכל יום שיש בו אירוע, ורשימת האירועים הקרובים. הנתונים לא יוצאים מהטלפון.", 12.5f, 0xFF94A3B8, R.font.assistant_regular);
        d.setGravity(Gravity.START);
        d.setPadding(0, dp(2), 0, 0);
        tc.addView(d);
        head.addView(tc, new LinearLayout.LayoutParams(0, -2, 1));
        pcSwitch = new Switch(this);
        pcSwitch.setChecked(pcOn);
        ColorStateList thumb = new ColorStateList(new int[][]{{android.R.attr.state_checked}, {}}, new int[]{GOLD, 0xFFCBD5E1});
        ColorStateList track = new ColorStateList(new int[][]{{android.R.attr.state_checked}, {}}, new int[]{0x99E0B74F, 0x4DFFFFFF});
        pcSwitch.setThumbTintList(thumb);
        pcSwitch.setTrackTintList(track);
        pcSwitch.setContentDescription("הצגת האירועים שלי מיומן הטלפון");
        pcSwitch.setOnCheckedChangeListener((v, on) -> {
            if (on && !PhoneCal.hasPermission(this)) {
                requestPermissions(new String[]{Manifest.permission.READ_CALENDAR}, REQ_CAL);
                return;
            }
            pcOn = on;
            fillCalendars();
        });
        LinearLayout.LayoutParams swp = new LinearLayout.LayoutParams(-2, -2);
        swp.setMarginStart(dp(10));
        head.addView(pcSwitch, swp);
        card.addView(head);

        pcNote = text("", 12.5f, 0xFFFCA5A5, R.font.assistant_regular);
        pcNote.setGravity(Gravity.START);
        pcNote.setVisibility(View.GONE);
        card.addView(pcNote);
        pcList = new LinearLayout(this);
        pcList.setOrientation(LinearLayout.VERTICAL);
        card.addView(pcList);
        fillCalendars();
        return card;
    }

    /** רשימת היומנים בטלפון — כל אחד עם תיבת סימון (מסומן = מוצג). */
    private void fillCalendars() {
        if (pcList == null) return;
        pcList.removeAllViews();
        if (!pcOn) return;
        List<PhoneCal.Cal> cals = PhoneCal.calendars(this);
        TextView h = text(cals.isEmpty() ? "לא נמצאו יומנים בטלפון" : "אילו יומנים להציג", 13, GOLD, R.font.assistant_extrabold);
        h.setGravity(Gravity.START);
        h.setPadding(0, dp(12), 0, dp(2));
        pcList.addView(h);
        for (PhoneCal.Cal k : cals) {
            CheckBox cb = new CheckBox(this);
            cb.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
            cb.setText(k.name + (k.account.isEmpty() || k.account.equals(k.name) ? "" : "  ·  " + k.account));
            cb.setTextColor(Color.WHITE);
            cb.setTextSize(14);
            cb.setTypeface(font(R.font.assistant_regular));
            cb.setTextDirection(View.TEXT_DIRECTION_ANY_RTL);
            cb.setButtonTintList(ColorStateList.valueOf(k.color));
            cb.setChecked(!pcHidden.contains(k.id));
            cb.setOnCheckedChangeListener((v, on) -> {
                if (on) pcHidden.remove(k.id);
                else pcHidden.add(k.id);
            });
            pcList.addView(cb, new LinearLayout.LayoutParams(-1, dp(44)));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode != REQ_CAL) return;
        boolean ok = PhoneCal.hasPermission(this);
        pcOn = ok;
        if (pcSwitch != null) pcSwitch.setChecked(ok);
        if (pcNote != null) {
            pcNote.setText(ok ? "" : "בלי גישה ליומן אי אפשר להציג את האירועים. אפשר לאשר בהגדרות האפליקציה ← הרשאות ← יומן.");
            pcNote.setVisibility(ok ? View.GONE : View.VISIBLE);
        }
        fillCalendars();
    }

    private void finishOk() {
        if (kind == W.Kind.MONTH) {
            PhoneCal.setEnabled(this, pcOn);
            PhoneCal.setHidden(this, pcHidden);
        }
        Prefs.setStyle(this, widgetId, chosen);
        Prefs.setOpacity(this, widgetId, opacity);
        // ההגדרה של האירועים אחת לכל ווידג'טי החודש — מעדכנים את כולם
        if (kind == W.Kind.MONTH) {
            for (int other : Updater.ids(this, W.Kind.MONTH)) Updater.update(this, AppWidgetManager.getInstance(this), kind, other);
        }
        Updater.update(this, AppWidgetManager.getInstance(this), kind, widgetId);
        Updater.schedule(this);
        Intent r = new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        setResult(RESULT_OK, r);
        finish();
    }
}
