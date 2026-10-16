package il.co.jewishcalendar.wear.ui

import android.content.Context
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.ScreenScaffold
import il.co.jewishcalendar.wear.data.Settings
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * כיוון התפילה — כמו המצפן באתר: יעד אחד, קודש הקדשים (31.7781, 35.2354), אזימוט של קו גדול
 * מהמיקום. החיישן מחזיר כיוון ביחס לצפון המגנטי, ולכן מוסיפים את הסטייה (GeomagneticField) פעם אחת.
 */
private const val T_LAT = 31.7781
private const val T_LON = 35.2354

fun bearingTo(lat: Double, lon: Double): Double {
    val p1 = Math.toRadians(lat)
    val p2 = Math.toRadians(T_LAT)
    val dl = Math.toRadians(T_LON - lon)
    val y = sin(dl) * cos(p2)
    val x = cos(p1) * sin(p2) - sin(p1) * cos(p2) * cos(dl)
    return (Math.toDegrees(atan2(y, x)) + 360) % 360
}

fun distanceKm(lat: Double, lon: Double): Double {
    val r = 6371.0
    val dp = Math.toRadians(T_LAT - lat)
    val dl = Math.toRadians(T_LON - lon)
    val a = sin(dp / 2) * sin(dp / 2) + cos(Math.toRadians(lat)) * cos(Math.toRadians(T_LAT)) * sin(dl / 2) * sin(dl / 2)
    return 2 * r * kotlin.math.asin(kotlin.math.sqrt(a))
}

@Composable
fun CompassScreen() {
    val c = LocalContext.current
    val loc = remember { Settings.loc(c) }
    val target = remember { bearingTo(loc.lat, loc.lon).toFloat() }
    val km = remember { distanceKm(loc.lat, loc.lon) }
    var heading by remember { mutableFloatStateOf(0f) }
    var hasSensor by remember { mutableStateOf(true) }

    DisposableEffect(Unit) {
        val sm = c.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val sensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) ?: sm.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR)
        val decl = GeomagneticField(loc.lat.toFloat(), loc.lon.toFloat(), 0f, System.currentTimeMillis()).declination
        val rot = FloatArray(9)
        val ori = FloatArray(3)
        val l = object : SensorEventListener {
            override fun onSensorChanged(ev: SensorEvent) {
                SensorManager.getRotationMatrixFromVector(rot, ev.values)
                SensorManager.getOrientation(rot, ori)
                val h = ((Math.toDegrees(ori[0].toDouble()).toFloat() + decl) + 360f) % 360f
                // החלקה קלה — בלי קפיצה במעבר 359°→0°
                var d = h - heading
                if (d > 180) d -= 360
                if (d < -180) d += 360
                heading = (heading + d * 0.25f + 360f) % 360f
            }
            override fun onAccuracyChanged(s: Sensor?, a: Int) {}
        }
        if (sensor == null) hasSensor = false else sm.registerListener(l, sensor, SensorManager.SENSOR_DELAY_UI)
        onDispose { sm.unregisterListener(l) }
    }

    val needle = target - heading
    var off = ((needle % 360) + 360) % 360
    if (off > 180) off -= 360
    val aligned = hasSensor && abs(off) < 8

    ScreenScaffold {
        Rtl {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Header(if (aligned) "מכוון לירושלים ✓" else "כיוון התפילה", size = 17.sp)
                    Canvas(Modifier.size(118.dp).padding(4.dp)) {
                        val r = size.minDimension / 2
                        drawCircle(JC.Card2, radius = r, style = Stroke(width = 3.dp.toPx()))
                        // סימון הצפון על הטבעת
                        rotate(-heading) {
                            drawLine(JC.Muted, Offset(center.x, center.y - r), Offset(center.x, center.y - r + 10.dp.toPx()), strokeWidth = 3.dp.toPx(), cap = StrokeCap.Round)
                        }
                        rotate(needle) {
                            val p = Path().apply {
                                moveTo(center.x, center.y - r + 6.dp.toPx())
                                lineTo(center.x + 7.dp.toPx(), center.y)
                                lineTo(center.x - 7.dp.toPx(), center.y)
                                close()
                            }
                            drawPath(p, Brush.verticalGradient(listOf(if (aligned) JC.GoldInk else JC.Gold, JC.GoldDeep)))
                        }
                        drawCircle(JC.Gold, radius = 6.dp.toPx())
                    }
                    T(if (hasSensor) "ירושלים · " + km.roundToInt() + " ק״מ" else "אין חיישן מצפן · " + target.roundToInt() + "° מהצפון", size = 12.sp, color = JC.Muted, weight = FontWeight.SemiBold)
                }
            }
        }
    }
}
