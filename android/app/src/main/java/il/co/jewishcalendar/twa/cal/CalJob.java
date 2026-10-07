package il.co.jewishcalendar.twa.cal;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.util.Log;

/**
 * עבודה יומית של המערכת (JobScheduler, נשמרת גם אחרי הפעלה מחדש): מגלגלת את חלון האירועים
 * ביומן קדימה, כך שהיומן מתעדכן לבד — גם בלי לפתוח את האפליקציה.
 */
public class CalJob extends JobService {
    @Override
    public boolean onStartJob(JobParameters params) {
        if (!CalSync.enabled(this)) {
            CalSync.cancelJob(this);
            return false;
        }
        new Thread(() -> {
            try {
                CalSync.run(getApplicationContext());
            } catch (Throwable t) {
                Log.w(CalSync.TAG, "job", t);
            } finally {
                jobFinished(params, false);
            }
        }, "jc-cal-job").start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true; // ננסה שוב
    }
}
