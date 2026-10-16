package il.co.jewishcalendar.twa.widget;

import android.content.Context;
import android.util.Log;

import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.Wearable;

import il.co.jewishcalendar.twa.widget.core.Loc;

/**
 * סנכרון ההגדרות לאפליקציית השעון (Wear OS, ‏wear/ — אותו applicationId ואותה חתימה), מגרסה 1.1.4.
 * אחרי כל סנכרון מהאתר כותבים DataItem בנתיב PATH עם מה שהווידג'טים מקבלים: עיר, קואורדינטות, גובה,
 * אזור זמן, דקות הדלקה, נוסח ושיטה. Google Play Services מעביר אותו לשעון המצומד (וגם לשעון שיתחבר
 * מאוחר יותר). אותם ערכים שוב — לא נוצר שינוי ולא נשלח כלום. בטלפון בלי Play Services / בלי שעון — הקריאה
 * נכשלת בשקט. הצד המקבל: wear/.../sync/PhoneSync.kt ("הטלפון קובע", בחירה בשעון נשמרת עד השינוי הבא).
 */
final class WearSync {
    private WearSync() {}

    static final String PATH = "/jc/settings";

    static void push(Context c) {
        if (!Prefs.sp(c).contains("sync")) return;
        try {
            Loc l = Prefs.loc(c);
            PutDataMapRequest r = PutDataMapRequest.create(PATH);
            DataMap m = r.getDataMap();
            m.putString("name", l.name == null ? "" : l.name);
            m.putDouble("lat", l.lat);
            m.putDouble("lon", l.lon);
            m.putDouble("elev", l.elev);
            m.putString("tz", l.tz);
            m.putInt("candle", l.candle);
            m.putString("nusach", l.nusach);
            m.putString("method", l.method);
            Wearable.getDataClient(c).putDataItem(r.asPutDataRequest().setUrgent())
                    .addOnFailureListener(e -> Log.d("JcWearSync", "no wear: " + e));
        } catch (Throwable t) {
            Log.d("JcWearSync", "push failed: " + t);
        }
    }
}
