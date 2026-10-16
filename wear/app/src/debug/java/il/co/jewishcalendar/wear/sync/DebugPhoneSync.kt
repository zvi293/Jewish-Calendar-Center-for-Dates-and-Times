package il.co.jewishcalendar.wear.sync

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

/**
 * כלי בדיקה (רק debug): כותב בשעון עצמו את אותו DataItem שהטלפון כותב, דרך ה-Data Layer האמיתי —
 * כך בודקים באמולטור בלי טלפון מצומד את כל המסלול: DataClient → PhoneSyncService → Settings → Refresh.
 * adb shell am broadcast -n il.co.jewishcalendar.twa/il.co.jewishcalendar.wear.sync.DebugPhoneSync
 *   --es name ירושלים --ed lat 31.76904 --ed lon 35.21633 --ei candle 40 --es nusach ashkenaz --es method GRA
 */
class DebugPhoneSync : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        val r = PutDataMapRequest.create(PhoneSync.PATH)
        val m = r.dataMap
        m.putString("name", i.getStringExtra("name") ?: "")
        m.putDouble("lat", i.getDoubleExtra("lat", 31.76904))
        m.putDouble("lon", i.getDoubleExtra("lon", 35.21633))
        m.putDouble("elev", i.getDoubleExtra("elev", 0.0))
        m.putString("tz", i.getStringExtra("tz") ?: "Asia/Jerusalem")
        m.putInt("candle", i.getIntExtra("candle", 20))
        m.putString("nusach", i.getStringExtra("nusach") ?: "mizrahi")
        m.putString("method", i.getStringExtra("method") ?: "MGA")
        Wearable.getDataClient(c).putDataItem(r.asPutDataRequest().setUrgent())
    }
}
