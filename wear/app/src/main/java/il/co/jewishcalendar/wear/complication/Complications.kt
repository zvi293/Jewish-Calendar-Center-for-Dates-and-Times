package il.co.jewishcalendar.wear.complication

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationText
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.LongTextComplicationData
import androidx.wear.watchface.complications.data.MonochromaticImage
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationDataTimeline
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingTimelineComplicationDataSourceService
import androidx.wear.watchface.complications.datasource.TimeInterval
import androidx.wear.watchface.complications.datasource.TimelineEntry
import il.co.jewishcalendar.wear.MainActivity
import il.co.jewishcalendar.wear.R
import il.co.jewishcalendar.wear.core.Engine
import il.co.jewishcalendar.wear.core.Heb
import il.co.jewishcalendar.wear.data.Settings
import il.co.jewishcalendar.wear.data.Zm
import java.time.Instant

/**
 * בסיס ל-Complications: ציר זמן לכל גבול תצוגה ב-24 השעות הקרובות (כמו ב-Tiles), כך שהמשבצת
 * על פני השעון מתחלפת בדיוק בזמן גם כשהאפליקציה לא רצה. המערכת מבקשת רענון כל שעה (מניפסט).
 */
abstract class BaseComplication : SuspendingTimelineComplicationDataSourceService() {
    abstract val open: String
    abstract fun data(c: Context, e: Engine, at: Long, type: ComplicationType): ComplicationData?

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationDataTimeline? {
        val now = System.currentTimeMillis()
        val type = request.complicationType
        val first = data(this, Settings.engine(this, now), now, type) ?: return null
        val bs = Zm.boundaries(this, now, 24)
        val entries = ArrayList<TimelineEntry>()
        for (i in bs.indices) {
            val start = bs[i]
            val end = bs.getOrNull(i + 1) ?: (start + Engine.HOUR)
            val d = data(this, Settings.engine(this, start + 1000), start + 1000, type) ?: continue
            entries.add(TimelineEntry(TimeInterval(Instant.ofEpochMilli(start), Instant.ofEpochMilli(end)), d))
        }
        return ComplicationDataTimeline(first, entries)
    }

    override fun getPreviewData(type: ComplicationType): ComplicationData? =
        data(this, Settings.engine(this, System.currentTimeMillis()), System.currentTimeMillis(), type)

    protected fun tap(c: Context): PendingIntent =
        PendingIntent.getActivity(
            c, open.hashCode(),
            Intent(c, MainActivity::class.java).putExtra("open", open).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

    protected fun icon(c: Context) = MonochromaticImage.Builder(Icon.createWithResource(c, R.drawable.ic_jc)).build()

    protected fun plain(s: String): ComplicationText = PlainComplicationText.Builder(s).build()

    protected fun shortText(c: Context, text: String, title: String?, desc: String): ComplicationData {
        val b = ShortTextComplicationData.Builder(plain(text), plain(desc)).setTapAction(tap(c)).setMonochromaticImage(icon(c))
        if (title != null) b.setTitle(plain(title))
        return b.build()
    }

    protected fun longText(c: Context, text: String, title: String?, desc: String): ComplicationData {
        val b = LongTextComplicationData.Builder(plain(text), plain(desc)).setTapAction(tap(c)).setMonochromaticImage(icon(c))
        if (title != null) b.setTitle(plain(title))
        return b.build()
    }
}

/** כינוי קצר לכותרת המשבצת (עד ~7 תווים). */
fun shortLabel(r: Engine.Row): String = when {
    r.key == "alot" -> "עלות"
    r.key == "talit" -> "טלית"
    r.key == "netz" -> "הנץ"
    r.key.startsWith("shma") -> "סוף ק״ש"
    r.key.startsWith("tfila") -> "תפילה"
    r.key == "chatzot" -> "חצות"
    r.key == "minchaG" -> "מ׳ גדולה"
    r.key == "minchaK" -> "מ׳ קטנה"
    r.key.startsWith("plag") -> "פלג"
    r.key == "candle" -> "הדלקה"
    r.key == "shkia" -> "שקיעה"
    r.key == "bein" -> "בין השמ׳"
    r.key == "tzeit" -> "צאת"
    r.key == "chatzotN" -> "חצות"
    r.key.startsWith("ashm") -> "אשמורת"
    else -> r.label.take(7)
}

// ═══════════════════════ הזמן הבא ═══════════════════════

class NextZmanComplication : BaseComplication() {
    override val open = "zmanim"
    override fun data(c: Context, e: Engine, at: Long, type: ComplicationType): ComplicationData? {
        val n = Zm.next(e) ?: return null
        val t = Zm.time(e, n.ms)
        return when (type) {
            ComplicationType.SHORT_TEXT -> shortText(c, t, shortLabel(n), n.label + " " + t)
            ComplicationType.LONG_TEXT -> {
                val after = Zm.upcoming(e, 2).getOrNull(1)
                val text = n.label + " " + t + (if (after != null) " · " + shortLabel(after) + " " + Zm.time(e, after.ms) else "")
                longText(c, text, "הזמן הבא", text)
            }
            else -> null
        }
    }
}

// ═══════════════════════ תאריך עברי ═══════════════════════

class HebDateComplication : BaseComplication() {
    override val open = "home"
    override fun data(c: Context, e: Engine, at: Long, type: ComplicationType): ComplicationData? {
        val h = e.hebNow()
        return when (type) {
            ComplicationType.SHORT_TEXT -> shortText(c, Heb.num(h.jewishDayOfMonth), Heb.month(h), Heb.dayMonth(h))
            ComplicationType.LONG_TEXT -> {
                val sp = e.specialToday()
                longText(c, Heb.dayMonth(h) + " " + Heb.year(h), if (sp.isNotEmpty()) sp else Heb.weekday(e.dow), Heb.dayMonth(h) + " " + Heb.year(h))
            }
            else -> null
        }
    }
}

// ═══════════════════════ ספירת העומר ═══════════════════════

class OmerComplication : BaseComplication() {
    override val open = "omer"
    override fun data(c: Context, e: Engine, at: Long, type: ComplicationType): ComplicationData? {
        val d = e.omerDay()
        return when (type) {
            ComplicationType.SHORT_TEXT ->
                if (d > 0) shortText(c, Heb.num(d), "לעומר", Heb.num(d) + " לעומר")
                else shortText(c, "—", "עומר", "מחוץ לימי הספירה")
            ComplicationType.LONG_TEXT ->
                if (d > 0) longText(c, Engine.omerText(d, e.loc.nusach), "ספירת העומר", Heb.num(d) + " לעומר")
                else longText(c, "בעוד " + Heb.days(e.daysToOmer().toLong()), "ספירת העומר", "ספירת העומר")
            else -> null
        }
    }
}

// ═══════════════════════ שבת ═══════════════════════

class ShabbatComplication : BaseComplication() {
    override val open = "shabbat"
    override fun data(c: Context, e: Engine, at: Long, type: ComplicationType): ComplicationData? {
        val s = e.shabbat()
        val candle = s.candle?.let { Zm.time(e, it) } ?: ""
        val hav = s.havdala?.let { Zm.time(e, it) } ?: ""
        return when (type) {
            ComplicationType.SHORT_TEXT ->
                if (s.now) shortText(c, hav, "צאת", "צאת השבת $hav") else shortText(c, candle, "הדלקה", "הדלקת נרות $candle")
            ComplicationType.LONG_TEXT ->
                longText(c, "הדלקה $candle · צאת $hav", s.title, s.title + " · הדלקה " + candle + " · צאת " + hav)
            else -> null
        }
    }
}
