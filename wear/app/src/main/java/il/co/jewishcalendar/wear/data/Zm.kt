package il.co.jewishcalendar.wear.data

import il.co.jewishcalendar.wear.core.Engine
import il.co.jewishcalendar.wear.core.Heb

/** עזרי תצוגה משותפים לאפליקציה, ל-Tiles ול-Complications. */
object Zm {
    /** הזמנים הבאים לפי השיטה שנבחרה (מג"א או הגר"א — לא שניהם). */
    fun upcoming(e: Engine, max: Int): List<Engine.Row> {
        val skip = if (e.loc.method == "GRA") "MGA" else "GRA"
        return e.upcoming(max * 2 + 4).filter { !it.key.endsWith(skip) }.take(max)
    }

    fun next(e: Engine): Engine.Row? = upcoming(e, 1).firstOrNull()

    fun time(e: Engine, ms: Long): String = Heb.time(ms, e.tz)

    /** "בעוד 3 שעות ו-11 דק׳" — לתצוגה (מתעדכן בכל ציור). */
    fun inText(msLeft: Long): String {
        val min = ((msLeft + 59_999) / 60_000).coerceAtLeast(0)
        if (min < 60) return "בעוד $min דק׳"
        val h = min / 60
        val m = min % 60
        val hs = if (h == 1L) "שעה" else if (h == 2L) "שעתיים" else "$h שעות"
        if (h >= 24) return "בעוד " + Heb.days(h / 24)
        return if (m == 0L) "בעוד $hs" else "בעוד $hs ו-$m דק׳"
    }

    /** "17:23 · מחר" — תגית ליום אחר. */
    fun rowTime(e: Engine, r: Engine.Row): String = time(e, r.ms) + if (r.tag.isNotEmpty()) " · " + r.tag else ""

    fun hebDate(e: Engine): String {
        val h = e.hebNow()
        return Heb.dayMonth(h) + " " + Heb.year(h)
    }

    /**
     * הרגעים הבאים שבהם משהו בתצוגה משתנה — לציר הזמן של Tiles ו-Complications.
     * מחושב ממנוע אחד: כל זמן שעובר (כולל שקיעה = החלפת התאריך העברי, וצאת = עומר/הבדלה)
     * ועוד חצות. לא דרך nextBoundary בלולאה — שם כל צעד סורק לוח של שנה (מועד הבא),
     * ובשעון איטי הבקשה חרגה מזמן ההמתנה של המערכת (Tile ריק, נמדד באמולטור 16/10).
     */
    fun boundaries(c: android.content.Context, from: Long, hours: Int): List<Long> {
        val e = Settings.engine(c, from)
        val end = from + hours * Engine.HOUR
        val s = java.util.TreeSet<Long>()
        e.upcoming(40).forEach { if (it.ms > from + 500 && it.ms < end) s.add(it.ms) }
        for (off in 1..3) {
            val m = e.midnightOf(off)
            if (m > from && m < end) s.add(m)
        }
        return s.take(24)
    }
}
