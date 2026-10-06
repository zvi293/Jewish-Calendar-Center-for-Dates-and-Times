package il.co.jewishcalendar.twa.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;

/**
 * ספק אחד לכל ווידג'ט (17). כל המחלקות הפנימיות רק מצהירות על הסוג — העבודה עצמה
 * ב-Updater (חישוב ובנייה) וב-Render (הפריסה לפי גודל).
 */
public abstract class W extends AppWidgetProvider {

    public enum Kind {
        ZMANIM, NEXT, DATE, HOLIDAY, SHABBAT, TEHILLIM, DAF, LEVANA, LEVANA_SIMPLE,
        STUDY, PRAYERS, BENTCHING, PLAN, OMER, ALL, CLOCK, HILULA
    }

    abstract Kind kind();

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) Updater.update(c, m, kind(), id);
        Updater.schedule(c);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) {
        Updater.update(c, m, kind(), id);
    }

    @Override
    public void onDeleted(Context c, int[] ids) {
        for (int id : ids) Prefs.forget(c, id);
    }

    @Override
    public void onEnabled(Context c) {
        Updater.schedule(c);
    }

    @Override
    public void onDisabled(Context c) {
        Updater.schedule(c);
    }

    static Class<? extends W> classOf(Kind k) {
        switch (k) {
            case ZMANIM: return Zmanim.class;
            case NEXT: return Next.class;
            case DATE: return HebDate.class;
            case HOLIDAY: return Holiday.class;
            case SHABBAT: return Shabbat.class;
            case TEHILLIM: return Tehillim.class;
            case DAF: return Daf.class;
            case LEVANA: return Levana.class;
            case LEVANA_SIMPLE: return LevanaSimple.class;
            case STUDY: return Study.class;
            case PRAYERS: return Prayers.class;
            case BENTCHING: return Bentching.class;
            case PLAN: return Plan.class;
            case OMER: return Omer.class;
            case ALL: return All.class;
            case CLOCK: return Clock.class;
            default: return Hilula.class;
        }
    }

    public static class Zmanim extends W { Kind kind() { return Kind.ZMANIM; } }
    public static class Next extends W { Kind kind() { return Kind.NEXT; } }
    public static class HebDate extends W { Kind kind() { return Kind.DATE; } }
    public static class Holiday extends W { Kind kind() { return Kind.HOLIDAY; } }
    public static class Shabbat extends W { Kind kind() { return Kind.SHABBAT; } }
    public static class Tehillim extends W { Kind kind() { return Kind.TEHILLIM; } }
    public static class Daf extends W { Kind kind() { return Kind.DAF; } }
    public static class Levana extends W { Kind kind() { return Kind.LEVANA; } }
    public static class LevanaSimple extends W { Kind kind() { return Kind.LEVANA_SIMPLE; } }
    public static class Study extends W { Kind kind() { return Kind.STUDY; } }
    public static class Prayers extends W { Kind kind() { return Kind.PRAYERS; } }
    public static class Bentching extends W { Kind kind() { return Kind.BENTCHING; } }
    public static class Plan extends W { Kind kind() { return Kind.PLAN; } }
    public static class Omer extends W { Kind kind() { return Kind.OMER; } }
    public static class All extends W { Kind kind() { return Kind.ALL; } }
    public static class Clock extends W { Kind kind() { return Kind.CLOCK; } }
    public static class Hilula extends W { Kind kind() { return Kind.HILULA; } }
}
