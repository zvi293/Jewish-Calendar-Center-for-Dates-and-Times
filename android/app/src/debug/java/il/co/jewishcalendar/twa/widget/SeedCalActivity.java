package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.util.Log;

import java.util.Calendar;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.cal.CalSync;

/**
 * בדיקה בלבד: יוצר ביומן של האמולטור שני יומנים מקומיים ("אישי", "עבודה") עם אירועים
 * לדוגמה — אירוע עם שעה היום, "כל היום" מחר, אירוע של שלושה ימים, אירוע שבועי חוזר,
 * ואירוע עם הסימן של האפליקציה (CalSync.MARK) שאסור שיוצג בווידג'ט.
 * הרצה: adb shell pm grant il.co.jewishcalendar.twa android.permission.WRITE_CALENDAR
 * ואז am start -n il.co.jewishcalendar.twa/.widget.SeedCalActivity (‏--ez clear true — מחיקה).
 */
public class SeedCalActivity extends Activity {
    private static final String ACC = "jc-test";

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        try {
            ContentResolver cr = getContentResolver();
            Uri calUri = asSync(CalendarContract.Calendars.CONTENT_URI);
            cr.delete(calUri, CalendarContract.Calendars.ACCOUNT_NAME + "=?", new String[]{ACC});
            if (getIntent().getBooleanExtra("clear", false)) {
                Log.i("SeedCal", "cleared");
                finish();
                return;
            }
            long personal = calendar(cr, "אישי", 0xFF0EA5E9);
            long work = calendar(cr, "עבודה", 0xFFF97316);
            TimeZone tz = TimeZone.getDefault();
            Calendar k = Calendar.getInstance(tz);
            int y = k.get(Calendar.YEAR), m = k.get(Calendar.MONTH), d = k.get(Calendar.DAY_OF_MONTH);
            timed(cr, personal, "תור לרופא שיניים", "קופת חולים, פתח תקווה", at(y, m, d, 21, 30), at(y, m, d, 22, 15), null);
            timed(cr, work, "פגישת צוות", "", at(y, m, d + 2, 10, 0), at(y, m, d + 2, 11, 0), null);
            allDay(cr, personal, "יום ההולדת של אמא", y, m, d + 1, 1);
            allDay(cr, work, "כנס בירושלים", y, m, d + 5, 3);
            timed(cr, personal, "שיעור גמרא", "בית הכנסת", at(y, m, d + 3, 20, 0), at(y, m, d + 3, 21, 0), "FREQ=WEEKLY;COUNT=8");
            timed(cr, work, "חג (מהאפליקציה)", "", at(y, m, d + 4, 9, 0), at(y, m, d + 4, 10, 0), null, "בדיקה\n" + CalSync.MARK);
            Log.i("SeedCal", "seeded " + personal + "," + work);
        } catch (Throwable t) {
            Log.e("SeedCal", "seed", t);
        }
        finish();
    }

    private static Uri asSync(Uri u) {
        return u.buildUpon().appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, ACC)
                .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL).build();
    }

    private long calendar(ContentResolver cr, String name, int color) {
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Calendars.ACCOUNT_NAME, ACC);
        v.put(CalendarContract.Calendars.ACCOUNT_TYPE, CalendarContract.ACCOUNT_TYPE_LOCAL);
        v.put(CalendarContract.Calendars.NAME, name);
        v.put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, name);
        v.put(CalendarContract.Calendars.CALENDAR_COLOR, color);
        v.put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, CalendarContract.Calendars.CAL_ACCESS_OWNER);
        v.put(CalendarContract.Calendars.OWNER_ACCOUNT, ACC);
        v.put(CalendarContract.Calendars.VISIBLE, 1);
        v.put(CalendarContract.Calendars.SYNC_EVENTS, 1);
        v.put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, TimeZone.getDefault().getID());
        Uri u = cr.insert(asSync(CalendarContract.Calendars.CONTENT_URI), v);
        return Long.parseLong(u.getLastPathSegment());
    }

    private static long at(int y, int m, int d, int h, int mi) {
        Calendar k = Calendar.getInstance();
        k.clear();
        k.set(y, m, d, h, mi, 0);
        return k.getTimeInMillis();
    }

    private void timed(ContentResolver cr, long cal, String title, String where, long st, long en, String rrule) {
        timed(cr, cal, title, where, st, en, rrule, "");
    }

    private void timed(ContentResolver cr, long cal, String title, String where, long st, long en, String rrule, String desc) {
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Events.CALENDAR_ID, cal);
        v.put(CalendarContract.Events.TITLE, title);
        v.put(CalendarContract.Events.EVENT_LOCATION, where);
        v.put(CalendarContract.Events.DESCRIPTION, desc);
        v.put(CalendarContract.Events.DTSTART, st);
        if (rrule != null) {
            v.put(CalendarContract.Events.RRULE, rrule);
            v.put(CalendarContract.Events.DURATION, "PT" + ((en - st) / 60000) + "M");
        } else {
            v.put(CalendarContract.Events.DTEND, en);
        }
        v.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().getID());
        cr.insert(CalendarContract.Events.CONTENT_URI, v);
    }

    private void allDay(ContentResolver cr, long cal, String title, int y, int m, int d, int days) {
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.clear();
        u.set(y, m, d, 0, 0, 0);
        long st = u.getTimeInMillis();
        ContentValues v = new ContentValues();
        v.put(CalendarContract.Events.CALENDAR_ID, cal);
        v.put(CalendarContract.Events.TITLE, title);
        v.put(CalendarContract.Events.DTSTART, st);
        v.put(CalendarContract.Events.DTEND, st + days * 86400000L);
        v.put(CalendarContract.Events.ALL_DAY, 1);
        v.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");
        cr.insert(CalendarContract.Events.CONTENT_URI, v);
    }
}
