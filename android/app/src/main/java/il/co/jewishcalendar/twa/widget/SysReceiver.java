package il.co.jewishcalendar.twa.widget;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * מעיר את הווידג'טים: האזעקה שתוזמנה (Updater.ACTION_TICK), הפעלה מחדש של הטלפון,
 * שינוי שעה/אזור זמן/שפה, עדכון האפליקציה, ואישור/ביטול הרשאת "שעונים ותזכורות".
 */
public class SysReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        final PendingResult pr = goAsync();
        final Context app = c.getApplicationContext();
        final boolean step = Updater.ACTION_LADDER.equals(intent.getAction());
        new Thread(() -> {
            try {
                if (step) Updater.ladder(app);
                else Updater.updateAll(app);
            } finally {
                pr.finish();
            }
        }, "jc-widgets").start();
    }
}
