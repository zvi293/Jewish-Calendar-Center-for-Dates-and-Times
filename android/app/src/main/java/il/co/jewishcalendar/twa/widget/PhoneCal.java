package il.co.jewishcalendar.twa.widget;

import android.Manifest;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract;
import android.util.Log;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;

import il.co.jewishcalendar.twa.cal.CalSync;
import il.co.jewishcalendar.twa.widget.core.Heb;

/**
 * האירועים האישיים של המשתמש מיומן הטלפון — בווידג'ט "לוח שנה" (10/2026).
 * הכיוון ההפוך לסנכרון ליומן (cal/CalSync): כאן רק קוראים (READ_CALENDAR), והנתונים
 * לא יוצאים מהטלפון. מה שהאפליקציה עצמה כתבה ליומן (כל תיאור שמסתיים ב-CalSync.MARK,
 * וגם היומן המקומי "הלוח היהודי") לא מוצג — אחרת כל חג היה מופיע פעמיים.
 * ההגדרה אחת לכל ווידג'טי החודש: מתג + רשימת יומנים שכובו (ConfigActivity).
 * כשהיומן משתנה (אירוע חדש, סנכרון מגוגל) — Job עם TriggerContentUri מצייר מחדש.
 */
public final class PhoneCal {
    private PhoneCal() {}

    static final String TAG = "JcPhoneCal";
    private static final int JOB_ID = 7302;
    private static final String LOCAL_ACCOUNT = "הלוח היהודי";

    static final class Cal {
        long id;
        String name, account;
        int color;
    }

    static final class Ev {
        long eventId, begin, end, calId;
        String title, where;
        boolean allDay;
        int color;
        /** ימים מאז 1970 (לפי לוח השנה המקומי) — היום הראשון והאחרון של האירוע. */
        long day0, day1;
    }

    // ── הגדרות ──

    static boolean enabled(Context c) {
        return Prefs.sp(c).getBoolean("pc_on", false);
    }

    static void setEnabled(Context c, boolean on) {
        Prefs.sp(c).edit().putBoolean("pc_on", on).apply();
    }

    static boolean hasPermission(Context c) {
        return c.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    /** פעיל = המשתמש הדליק וגם אישר גישה ליומן. */
    static boolean active(Context c) {
        return enabled(c) && hasPermission(c);
    }

    static Set<Long> hidden(Context c) {
        Set<Long> out = new HashSet<>();
        for (String s : Prefs.sp(c).getString("pc_off", "").split(",")) {
            try {
                if (!s.isEmpty()) out.add(Long.parseLong(s));
            } catch (NumberFormatException ignored) {
            }
        }
        return out;
    }

    static void setHidden(Context c, Set<Long> ids) {
        StringBuilder b = new StringBuilder();
        for (long id : ids) b.append(b.length() == 0 ? "" : ",").append(id);
        Prefs.sp(c).edit().putString("pc_off", b.toString()).apply();
    }

    // ── קריאה מהיומן ──

    /** כל היומנים הגלויים בטלפון, בלי היומן המקומי שהאפליקציה יצרה. */
    static List<Cal> calendars(Context c) {
        List<Cal> out = new ArrayList<>();
        if (!hasPermission(c)) return out;
        String[] proj = {CalendarContract.Calendars._ID, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
                CalendarContract.Calendars.ACCOUNT_NAME, CalendarContract.Calendars.ACCOUNT_TYPE,
                CalendarContract.Calendars.CALENDAR_COLOR};
        try (Cursor q = c.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, proj,
                CalendarContract.Calendars.VISIBLE + "=1", null, CalendarContract.Calendars.ACCOUNT_NAME)) {
            if (q == null) return out;
            while (q.moveToNext()) {
                if (CalendarContract.ACCOUNT_TYPE_LOCAL.equals(q.getString(3)) && LOCAL_ACCOUNT.equals(q.getString(2))) continue;
                Cal k = new Cal();
                k.id = q.getLong(0);
                k.name = q.getString(1) == null ? "" : q.getString(1);
                k.account = q.getString(2) == null ? "" : q.getString(2);
                k.color = 0xFF000000 | q.getInt(4);
                out.add(k);
            }
        } catch (Throwable t) {
            Log.w(TAG, "calendars", t);
        }
        return out;
    }

    static long epochDayLocal(long ms, TimeZone tz) {
        return Math.floorDiv(ms + tz.getOffset(ms), 86400000L);
    }

    /**
     * האירועים בטווח [from, to) — כולל אירועים חוזרים (Instances), ממוינים לפי שעת התחלה,
     * אירועי "כל היום" לפני אירועים עם שעה באותו יום.
     */
    static List<Ev> load(Context c, long from, long to) {
        List<Ev> out = new ArrayList<>();
        if (!active(c)) return out;
        Set<Long> off = hidden(c), allowed = new HashSet<>();
        for (Cal k : calendars(c)) if (!off.contains(k.id)) allowed.add(k.id);
        if (allowed.isEmpty()) return out;
        Uri.Builder u = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(u, from);
        ContentUris.appendId(u, to);
        String[] proj = {CalendarContract.Instances.EVENT_ID, CalendarContract.Instances.TITLE,
                CalendarContract.Instances.BEGIN, CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY,
                CalendarContract.Instances.DISPLAY_COLOR, CalendarContract.Instances.CALENDAR_ID,
                CalendarContract.Instances.EVENT_LOCATION, CalendarContract.Instances.DESCRIPTION,
                CalendarContract.Instances.STATUS};
        TimeZone tz = TimeZone.getDefault(), utc = TimeZone.getTimeZone("UTC");
        try (Cursor q = c.getContentResolver().query(u.build(), proj, null, null,
                CalendarContract.Instances.BEGIN + " ASC")) {
            if (q == null) return out;
            while (q.moveToNext()) {
                if (!allowed.contains(q.getLong(6))) continue;
                if (!q.isNull(9) && q.getInt(9) == CalendarContract.Instances.STATUS_CANCELED) continue;
                String desc = q.getString(8);
                if (desc != null && desc.contains(CalSync.MARK)) continue;
                Ev v = new Ev();
                v.eventId = q.getLong(0);
                v.title = q.getString(1) == null || q.getString(1).trim().isEmpty() ? "(ללא כותרת)" : q.getString(1).trim();
                v.begin = q.getLong(2);
                v.end = Math.max(v.begin, q.getLong(3));
                v.allDay = q.getInt(4) == 1;
                v.color = 0xFF000000 | q.getInt(5);
                v.calId = q.getLong(6);
                v.where = q.getString(7) == null ? "" : q.getString(7).trim();
                // "כל היום" נשמר בחצות UTC; אירוע עם שעה — לפי השעון של הטלפון (כמו באפליקציית היומן)
                TimeZone z = v.allDay ? utc : tz;
                v.day0 = epochDayLocal(v.begin, z);
                v.day1 = Math.max(v.day0, epochDayLocal(v.end > v.begin ? v.end - 1 : v.begin, z));
                out.add(v);
            }
        } catch (Throwable t) {
            Log.w(TAG, "load", t);
        }
        // "כל היום" ראשון באותו יום
        out.sort((a, b) -> a.day0 != b.day0 ? Long.compare(a.day0, b.day0)
                : a.allDay != b.allDay ? (a.allDay ? -1 : 1) : Long.compare(a.begin, b.begin));
        return out;
    }

    /** תחילת היום המקומי (ms) של תאריך לועזי. */
    static long dayStart(int y, int m, int d) {
        Calendar k = Calendar.getInstance();
        k.clear();
        k.set(y, m - 1, d, 0, 0, 0);
        return k.getTimeInMillis();
    }

    /** ימים מאז 1970 של תאריך לועזי (בלי תלות באזור זמן). */
    static long epochDay(int y, int m, int d) {
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.clear();
        u.set(y, m - 1, d, 0, 0, 0);
        return Math.floorDiv(u.getTimeInMillis(), 86400000L);
    }

    /** [שנה, חודש, יום, יום בשבוע] של ימים-מאז-1970. */
    static int[] ymdOf(long epochDay) {
        Calendar u = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        u.setTimeInMillis(epochDay * 86400000L);
        return new int[]{u.get(Calendar.YEAR), u.get(Calendar.MONTH) + 1, u.get(Calendar.DAY_OF_MONTH), u.get(Calendar.DAY_OF_WEEK)};
    }

    static long dayStartOf(long epochDay) {
        int[] d = ymdOf(epochDay);
        return dayStart(d[0], d[1], d[2]);
    }

    /** "היום" / "מחר" / "יום ד׳ 22.10". */
    static String dayLabel(long ed, long edToday) {
        if (ed == edToday) return "היום";
        if (ed == edToday + 1) return "מחר";
        int[] d = ymdOf(ed);
        return Heb.weekdayShort(d[3]) + " " + Heb.gregShort(d[1], d[2]);
    }

    /** מתי — לרשימה בווידג'ט: "14:30" (היום), "מחר 09:00", "יום ה׳ 23.10 · כל היום". */
    static String when(Ev v, long edToday, long now, TimeZone tz) {
        long ed = v.day0 < edToday && v.day1 >= edToday ? edToday : v.day0;
        String day = dayLabel(ed, edToday);
        if (v.allDay) return ed == edToday || ed == edToday + 1 ? day : day + " · כל היום";
        // אירוע שהתחיל לפני היום — מציגים עד מתי
        if (v.day0 < ed) return day + " עד " + Heb.time(v.end, tz);
        String at = Heb.time(v.begin, tz);
        return ed == edToday ? at : day + " " + at;
    }

    // ── פתיחה ביומן של הטלפון ──

    static Intent openDay(long dayStartMs) {
        Uri u = CalendarContract.CONTENT_URI.buildUpon().appendPath("time").appendPath(String.valueOf(dayStartMs + 12 * 3600000L)).build();
        return new Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    static Intent openEvent(Ev v) {
        Intent i = new Intent(Intent.ACTION_VIEW, ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, v.eventId));
        i.putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, v.begin);
        i.putExtra(CalendarContract.EXTRA_EVENT_END_TIME, v.end);
        return i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    // ── עדכון כשהיומן משתנה ──

    static void watch(Context c) {
        try {
            JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
            if (js == null) return;
            if (!active(c) || Updater.ids(c, W.Kind.MONTH).isEmpty()) {
                js.cancel(JOB_ID);
                return;
            }
            if (js.getPendingJob(JOB_ID) != null) return;
            js.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(c, Job.class))
                    .addTriggerContentUri(new JobInfo.TriggerContentUri(CalendarContract.CONTENT_URI,
                            JobInfo.TriggerContentUri.FLAG_NOTIFY_FOR_DESCENDANTS))
                    .setTriggerContentUpdateDelay(3000)
                    .setTriggerContentMaxDelay(20000)
                    .build());
        } catch (Throwable t) {
            Log.w(TAG, "watch", t);
        }
    }

    /** שינוי ביומן ← ציור מחדש של ווידג'טי החודש, ושוב מאזינים (Job של תוכן חד-פעמי). */
    public static class Job extends JobService {
        @Override
        public boolean onStartJob(JobParameters params) {
            Context app = getApplicationContext();
            new Thread(() -> {
                try {
                    android.appwidget.AppWidgetManager m = android.appwidget.AppWidgetManager.getInstance(app);
                    for (int id : Updater.ids(app, W.Kind.MONTH)) Updater.update(app, m, W.Kind.MONTH, id);
                } catch (Throwable t) {
                    Log.w(TAG, "job", t);
                } finally {
                    jobFinished(params, false);
                    watch(app);
                }
            }, "jc-phonecal").start();
            return true;
        }

        @Override
        public boolean onStopJob(JobParameters params) {
            return false;
        }
    }
}
