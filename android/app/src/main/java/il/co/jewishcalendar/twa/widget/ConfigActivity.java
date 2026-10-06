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
import android.widget.ScrollView;
import android.widget.TextView;

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
        float[] wh = previewSize();
        try {
            Engine e = new Engine(Prefs.loc(this), System.currentTimeMillis());
            RemoteViews rv = Render.build(this, kind, widgetId, wh[0], wh[1], e, style);
            View v = rv.apply(this, pv);
            pv.addView(v, new FrameLayout.LayoutParams(dp(wh[0]), dp(wh[1]), Gravity.CENTER));
        } catch (Throwable t) {
            pv.addView(text(name, 16, Color.WHITE, R.font.frl_bold), new FrameLayout.LayoutParams(-1, dp(140)));
        }
        inner.addView(pv, new LinearLayout.LayoutParams(-1, -2));
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

    private void finishOk() {
        Prefs.setStyle(this, widgetId, chosen);
        Updater.update(this, AppWidgetManager.getInstance(this), kind, widgetId);
        Updater.schedule(this);
        Intent r = new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        setResult(RESULT_OK, r);
        finish();
    }
}
