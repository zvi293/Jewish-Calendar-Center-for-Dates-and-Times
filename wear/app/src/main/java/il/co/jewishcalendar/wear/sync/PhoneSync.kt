package il.co.jewishcalendar.wear.sync

import android.content.Context
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataMap
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import il.co.jewishcalendar.wear.Refresh
import il.co.jewishcalendar.wear.data.Settings
import java.util.concurrent.TimeUnit

/**
 * סנכרון ההגדרות מהטלפון (Wear Data Layer). אפליקציית הטלפון (android/.../widget/WearSync.java,
 * מגרסה 1.1.4) כותבת DataItem בנתיב PATH אחרי כל סנכרון מהאתר: שם העיר, קואורדינטות, גובה, אזור זמן,
 * דקות ההדלקה, נוסח ושיטה — אותם ערכים שהווידג'טים בטלפון מקבלים. Google Play Services מעביר אותו
 * לשעון (שתי האפליקציות באותו applicationId ובאותה חתימה), וגם לשעון שמתחבר מאוחר יותר.
 *
 * "הטלפון קובע" (הכרעת המשתמש 16/10/2026): הודעה חדשה מחליפה את המיקום, הנוסח, השיטה והדקות;
 * בחירה בשעון נשמרת עד השינוי הבא בטלפון (אותה הודעה שוב — לפי החתימה — לא דורסת).
 */
object PhoneSync {
    const val PATH = "/jc/settings"
    private const val TAG = "JcWearSync"

    /** מחיל הודעה מהטלפון. מחזיר true אם משהו הוחל. */
    fun apply(c: Context, m: DataMap): Boolean {
        val lat = m.getDouble("lat", Double.NaN)
        val lon = m.getDouble("lon", Double.NaN)
        if (lat.isNaN() || lon.isNaN() || kotlin.math.abs(lat) > 90 || kotlin.math.abs(lon) > 180) return false
        val name = m.getString("name", "").trim()
        val elev = m.getDouble("elev", 0.0).coerceIn(-500.0, 9000.0)
        val tz = m.getString("tz", "Asia/Jerusalem").ifBlank { "Asia/Jerusalem" }
        val candle = m.getInt("candle", 20).let { if (it in 0..90) it else 20 }
        val nusach = m.getString("nusach", "mizrahi").let { if (it in Settings.NUSACH_NAMES) it else "mizrahi" }
        val method = if (m.getString("method", "MGA") == "GRA") "GRA" else "MGA"
        val sig = listOf(name, lat, lon, elev, tz, candle, nusach, method).joinToString("|")
        val p = Settings.prefs(c)
        if (p.getString(Settings.K_PH_SIG, null) == sig) return false
        p.edit()
            .putString(Settings.K_PH_NAME, name)
            .putFloat(Settings.K_PH_LAT, lat.toFloat())
            .putFloat(Settings.K_PH_LON, lon.toFloat())
            .putFloat(Settings.K_PH_ELEV, elev.toFloat())
            .putString(Settings.K_PH_TZ, tz)
            .putInt(Settings.K_PH_CANDLE, candle)
            .putInt(Settings.K_CITY, Settings.PHONE)
            .putString(Settings.K_NUSACH, nusach)
            .putString(Settings.K_METHOD, method)
            .putInt(Settings.K_CANDLE, 0)
            .putString(Settings.K_PH_SIG, sig)
            .commit()
        Log.i(TAG, "applied: $sig")
        Refresh.all(c)
        return true
    }

    /** בפתיחת האפליקציה — למקרה שהשירות לא הופעל (למשל אחרי התקנה): קורא את ה-DataItem השמור. */
    fun pull(c: Context) {
        val app = c.applicationContext
        Thread({
            try {
                val items = Tasks.await(Wearable.getDataClient(app).dataItems, 10, TimeUnit.SECONDS)
                try {
                    items.filter { it.uri.path == PATH }.forEach { apply(app, DataMapItem.fromDataItem(it).dataMap) }
                } finally {
                    items.release()
                }
            } catch (t: Throwable) {
                Log.d(TAG, "pull failed: $t")
            }
        }, "jc-wear-pull").start()
    }
}

/** מקבל את ההודעות מהטלפון גם כשהאפליקציה סגורה. */
class PhoneSyncService : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        events.forEach { e ->
            if (e.type == DataEvent.TYPE_CHANGED && e.dataItem.uri.path == PhoneSync.PATH) {
                runCatching { PhoneSync.apply(this, DataMapItem.fromDataItem(e.dataItem).dataMap) }
            }
        }
    }
}
