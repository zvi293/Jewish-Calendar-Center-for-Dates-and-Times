package il.co.jewishcalendar.twa.widget;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.util.SizeF;
import android.widget.RemoteViews;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import il.co.jewishcalendar.twa.widget.core.Engine;
import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * עדכון הווידג'טים ותזמון העדכון הבא: הרגע הבא שבו משהו משתנה (זמן הלכתי, שקיעה,
 * חצות, שלב השמיים, ברכת הלבנה, כניסת/יציאת מועד).
 * עם הרשאת "שעונים ותזכורות" (באנדרואיד 12–13 ניתנת מראש) — אזעקה מדויקת אחת.
 * בלעדיה (ברירת המחדל באנדרואיד 14+) — "סולם": אזעקה לא מדויקת נדחית עד 75% מזמן
 * ההמתנה (נמדד: אזעקה ל-19 דק' — חלון של 14 דק'), ולכן מתעוררים בחצי הדרך לבדיקה קלה
 * בלי לצייר (ACTION_LADDER) ומתקרבים ליעד; כשנשארות פחות מ-30 שנ' — אזעקה ליעד עצמו
 * (איחור של עד ~20 שנ'). המשתמש לא צריך לאשר כלום.
 * אזעקות מסוג RTC (לא WAKEUP): כשהמסך כבוי לא מעירים את הטלפון — מה שהתאחר נמסר ברגע
 * שמדליקים אותו, והווידג'טים מתעדכנים מיד.
 */
final class Updater {
    private Updater() {}

    static final String ACTION_TICK = "il.co.jewishcalendar.twa.WIDGET_TICK";
    static final String ACTION_LADDER = "il.co.jewishcalendar.twa.WIDGET_LADDER";
    private static final long LADDER_FINAL = 30000L;
    private static final String TAG = "JcWidgets";
    private static final long MAX_SLEEP = 60 * 60000L;

    static void updateAll(Context c) {
        if (Log.isLoggable(TAG, Log.DEBUG)) Log.d(TAG, "updateAll");
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (W.Kind k : W.Kind.values()) {
            int[] ids = m.getAppWidgetIds(new ComponentName(c, W.classOf(k)));
            for (int id : ids) update(c, m, k, id);
        }
        schedule(c);
    }

    static void update(Context c, AppWidgetManager m, W.Kind k, int id) {
        try {
            Engine e = new Engine(Prefs.loc(c), System.currentTimeMillis());
            m.updateAppWidget(id, build(c, k, id, m.getAppWidgetOptions(id), e));
        } catch (Throwable t) {
            Log.e(TAG, "update " + k + " failed", t);
        }
    }

    static RemoteViews build(Context c, W.Kind k, int id, Bundle o, Engine e) {
        if (o != null && Log.isLoggable(TAG, Log.DEBUG)) {
            Log.d(TAG, k + " min=" + o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH) + "x" + o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)
                    + " max=" + o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH) + "x" + o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT)
                    + (Build.VERSION.SDK_INT >= 31 ? " sizes=" + o.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES) : ""));
        }
        if (Build.VERSION.SDK_INT >= 31 && o != null) {
            ArrayList<SizeF> sizes = o.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
            if (sizes != null && !sizes.isEmpty()) {
                if (sizes.size() == 1) return Render.build(c, k, id, sizes.get(0).getWidth(), sizes.get(0).getHeight(), e);
                Map<SizeF, RemoteViews> map = new HashMap<>();
                // לוח שנה: 42 תאים עם לחיצה לכל יום — עד שני גדלים, שהעדכון לא יעבור את מגבלת הגודל של המערכת
                int maxSizes = k == W.Kind.MONTH ? 2 : 4;
                for (SizeF s : sizes) {
                    if (map.size() >= maxSizes) break;
                    map.put(s, Render.build(c, k, id, s.getWidth(), s.getHeight(), e));
                }
                return new RemoteViews(map);
            }
        }
        float[] wh = portrait(o, k);
        return Render.build(c, k, id, wh[0], wh[1], e);
    }

    /** בטלפון לאורך: הרוחב המינימלי והגובה המקסימלי. */
    static float[] portrait(Bundle o, W.Kind k) {
        int w = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH);
        int h = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT);
        if (w <= 0 || h <= 0) {
            int[] cells = defaultCells(k);
            w = cells[0] * 90 - 8;
            h = cells[1] * 120 - 8;
        }
        return new float[]{w, h};
    }

    static int[] defaultCells(W.Kind k) {
        switch (k) {
            case ZMANIM: return new int[]{4, 3};
            case MONTH: return new int[]{4, 4};
            case ALL: return new int[]{4, 2};
            case STUDY: case PRAYERS: return new int[]{4, 1};
            case DAF: case BENTCHING: case LEVANA_SIMPLE: return new int[]{2, 1};
            default: return new int[]{2, 2};
        }
    }

    static boolean anyWidgets(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (W.Kind k : W.Kind.values()) {
            if (m.getAppWidgetIds(new ComponentName(c, W.classOf(k))).length > 0) return true;
        }
        return false;
    }

    private static PendingIntent tickIntent(Context c, String action) {
        Intent i = new Intent(c, SysReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(c, ACTION_TICK.equals(action) ? 4242 : 4243, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        if (!anyWidgets(c)) {
            am.cancel(tickIntent(c, ACTION_TICK));
            am.cancel(tickIntent(c, ACTION_LADDER));
            return;
        }
        long now = System.currentTimeMillis();
        long at;
        try {
            Loc loc = Prefs.loc(c);
            at = new Engine(loc, now).nextBoundary() + 1000;
        } catch (Throwable t) {
            Log.e(TAG, "nextBoundary failed", t);
            at = now + 15 * 60000L;
        }
        at = Math.max(now + 5000, Math.min(at, now + MAX_SLEEP));
        Prefs.sp(c).edit().putLong("next_target", at).apply();
        arm(c, am, now, at);
    }

    /** שלב בסולם: אם הגיע הזמן — עדכון מלא; אחרת רק מתקרבים (בלי לצייר). */
    static void ladder(Context c) {
        long target = Prefs.sp(c).getLong("next_target", 0);
        long now = System.currentTimeMillis();
        if (target == 0 || now >= target - 1500) {
            updateAll(c);
            return;
        }
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) arm(c, am, now, target);
    }

    private static void arm(Context c, AlarmManager am, long now, long target) {
        PendingIntent tick = tickIntent(c, ACTION_TICK), step = tickIntent(c, ACTION_LADDER);
        am.cancel(tick);
        am.cancel(step);
        try {
            if (Ui.exactOk(c)) {
                if (Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC, target, tick);
                else am.setExact(AlarmManager.RTC, target, tick);
                return;
            }
            long left = target - now;
            if (left <= LADDER_FINAL) setInexact(am, target, tick);
            else setInexact(am, now + left / 2, step);
            if (Log.isLoggable(TAG, Log.DEBUG)) Log.d(TAG, "ladder left=" + left / 1000 + "s");
        } catch (SecurityException se) {
            am.set(AlarmManager.RTC, target, tick);
        }
    }

    private static void setInexact(AlarmManager am, long at, PendingIntent pi) {
        if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi);
        else am.set(AlarmManager.RTC, at, pi);
    }

    static List<Integer> ids(Context c, W.Kind k) {
        List<Integer> out = new ArrayList<>();
        for (int id : AppWidgetManager.getInstance(c).getAppWidgetIds(new ComponentName(c, W.classOf(k)))) out.add(id);
        return out;
    }
}
