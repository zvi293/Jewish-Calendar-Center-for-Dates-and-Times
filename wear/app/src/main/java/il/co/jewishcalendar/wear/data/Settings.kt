package il.co.jewishcalendar.wear.data

import android.content.Context
import android.content.SharedPreferences
import il.co.jewishcalendar.wear.core.Engine
import il.co.jewishcalendar.wear.core.Loc
import java.util.TimeZone
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * ההגדרות של השעון — נשמרות בשעון עצמו (בלי סנכרון מהטלפון בשלב הזה).
 * ברירת המחדל כמו באתר: פתח תקווה, עדות המזרח, מג"א.
 */
object Settings {
    private const val FILE = "jc_wear"
    const val K_CITY = "city"          // geonameid מתוך Cities, או 0 = מיקום השעון
    const val K_GPS_LAT = "gps_lat"
    const val K_GPS_LON = "gps_lon"
    const val K_NUSACH = "nusach"      // mizrahi | sfard | ashkenaz — המפתחות של האתר
    const val K_METHOD = "method"      // MGA | GRA
    const val K_CANDLE = "candle"      // 0 = לפי העיר (40/20/18)

    val NUSACH_NAMES = linkedMapOf("mizrahi" to "עדות המזרח", "sfard" to "ספרד", "ashkenaz" to "אשכנז")
    val METHOD_NAMES = linkedMapOf("MGA" to "מגן אברהם", "GRA" to "הגר״א")
    val CANDLE_OPTIONS = listOf(0, 18, 20, 30, 40)

    fun prefs(c: Context): SharedPreferences = c.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun cityId(c: Context) = prefs(c).getInt(K_CITY, Cities.DEFAULT_ID)
    fun nusach(c: Context) = prefs(c).getString(K_NUSACH, "mizrahi") ?: "mizrahi"
    fun method(c: Context) = prefs(c).getString(K_METHOD, "MGA") ?: "MGA"
    fun candleSetting(c: Context) = prefs(c).getInt(K_CANDLE, 0)

    fun usesGps(c: Context) = cityId(c) == 0 && prefs(c).contains(K_GPS_LAT)

    fun locationName(c: Context): String =
        if (usesGps(c)) "מיקום השעון" else (Cities.byId(cityId(c)) ?: Cities.byId(Cities.DEFAULT_ID)!!).name

    /** המיקום והשיטה לחישוב — אותו מבנה כמו בווידג'טים של הטלפון (Loc). */
    fun loc(c: Context): Loc {
        val p = prefs(c)
        val nusach = nusach(c)
        val method = method(c)
        val candleSet = candleSetting(c)
        if (usesGps(c)) {
            val lat = p.getFloat(K_GPS_LAT, 0f).toDouble()
            val lon = p.getFloat(K_GPS_LON, 0f).toDouble()
            // כמו באתר: בירושלים (עד 10 ק"מ מהמרכז) 40 דק', בארץ 20, בחו"ל 18
            val auto = when {
                km(lat, lon, 31.778, 35.235) <= 10 -> 40
                lat in 29.4..33.5 && lon in 34.2..35.9 -> 20
                else -> 18
            }
            val tz = if (lat in 29.4..33.5 && lon in 34.2..35.9) "Asia/Jerusalem" else TimeZone.getDefault().id
            return Loc("מיקום השעון", lat, lon, 0.0, tz, if (candleSet > 0) candleSet else auto, nusach, method, true)
        }
        val city = Cities.byId(cityId(c)) ?: Cities.byId(Cities.DEFAULT_ID)!!
        return Loc(city.name, city.lat, city.lon, city.elev, city.tz, if (candleSet > 0) candleSet else city.candle, nusach, method, true)
    }

    fun engine(c: Context, now: Long = System.currentTimeMillis()) = Engine(loc(c), now)

    private fun km(a: Double, b: Double, c: Double, d: Double): Double {
        val r = 6371.0
        val p1 = Math.toRadians(a)
        val p2 = Math.toRadians(c)
        val dp = Math.toRadians(c - a)
        val dl = Math.toRadians(d - b)
        val h = sin(dp / 2).pow(2) + cos(p1) * cos(p2) * sin(dl / 2).pow(2)
        return 2 * r * asin(sqrt(h))
    }
}
