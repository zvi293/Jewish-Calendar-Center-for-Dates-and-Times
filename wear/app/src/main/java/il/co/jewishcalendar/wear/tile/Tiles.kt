package il.co.jewishcalendar.wear.tile

import android.content.Context
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DeviceParametersBuilders.DeviceParameters
import androidx.wear.protolayout.DimensionBuilders.dp
import androidx.wear.protolayout.DimensionBuilders.expand
import androidx.wear.protolayout.DimensionBuilders.sp
import androidx.wear.protolayout.DimensionBuilders.wrap
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.LayoutElementBuilders.Box
import androidx.wear.protolayout.LayoutElementBuilders.Column
import androidx.wear.protolayout.LayoutElementBuilders.FontStyle
import androidx.wear.protolayout.LayoutElementBuilders.LayoutElement
import androidx.wear.protolayout.LayoutElementBuilders.Spacer
import androidx.wear.protolayout.LayoutElementBuilders.Text
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import java.util.concurrent.Executors
import il.co.jewishcalendar.wear.MainActivity
import il.co.jewishcalendar.wear.core.Engine
import il.co.jewishcalendar.wear.core.Heb
import il.co.jewishcalendar.wear.data.Settings
import il.co.jewishcalendar.wear.data.Zm

/**
 * בסיס משותף ל-Tiles: ציר זמן (Timeline) עם רשומה לכל גבול תצוגה ב-24 השעות הקרובות —
 * כך ה-Tile מתחלף בדיוק בזמן (הזמן הבא, שקיעה, צאת) בלי להעיר את האפליקציה.
 * יישור: שורות "תווית ··· שעה" בנויות משתי שכבות עם יישור מוחלט (LEFT/RIGHT), כדי שהשעה
 * תהיה משמאל והתווית מימין גם כששפת השעון אנגלית (LTR) וגם כשהיא עברית (RTL).
 */
abstract class BaseTile : TileService() {
    abstract val open: String
    abstract fun body(c: Context, e: Engine, at: Long, d: DeviceParameters): List<LayoutElement>

    override fun onTileRequest(req: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> =
        // החישוב מחוץ לתהליך הראשי — המערכת ממתינה לתשובה רק כמה שניות
        WORK.submit<TileBuilders.Tile> { build(req) }

    private fun build(req: RequestBuilders.TileRequest): TileBuilders.Tile {
        val now = System.currentTimeMillis()
        val times = listOf(now) + Zm.boundaries(this, now, 18)
        val tl = TimelineBuilders.Timeline.Builder()
        for (i in times.indices) {
            val at = times[i]
            val e = Settings.engine(this, at + 1000)
            val v = TimelineBuilders.TimeInterval.Builder().setStartMillis(if (i == 0) 0 else at)
            times.getOrNull(i + 1)?.let { v.setEndMillis(it) }
            tl.addTimelineEntry(
                TimelineBuilders.TimelineEntry.Builder()
                    .setValidity(v.build())
                    .setLayout(LayoutElementBuilders.Layout.Builder().setRoot(root(e, at + 1000, req.deviceConfiguration)).build())
                    .build()
            )
        }
        return TileBuilders.Tile.Builder()
            .setResourcesVersion(RES_VER)
            .setTileTimeline(tl.build())
            .setFreshnessIntervalMillis(6 * Engine.HOUR)
            .build()
    }

    override fun onTileResourcesRequest(req: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
        Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion(RES_VER).build())

    private fun root(e: Engine, at: Long, d: DeviceParameters): LayoutElement {
        val col = Column.Builder().setWidth(expand()).setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
        body(this, e, at, d).forEach { col.addContent(it) }
        // שוליים פנימיים לפי גודל המסך — במסך עגול הפינות נחתכות
        val side = (d.screenWidthDp * 0.12f)
        return Box.Builder()
            .setWidth(expand()).setHeight(expand())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(openApp(this, open))
                    .setPadding(ModifiersBuilders.Padding.Builder().setStart(dp(side)).setEnd(dp(side)).build())
                    .build()
            )
            .addContent(col.build())
            .build()
    }

    companion object {
        const val RES_VER = "1"
        private val WORK = MoreExecutors.listeningDecorator(Executors.newSingleThreadExecutor())
    }
}

// ═══════════════════════ רכיבים ═══════════════════════

private const val GOLD = 0xFFE2BE5A.toInt()
private const val GOLD_INK = 0xFFFCE7A8.toInt()
private const val GOLD_CARD = 0xFF3A2E10.toInt()
private const val INK = 0xFFF1F5F9.toInt()
private const val MUTED = 0xFFA7B3C4.toInt()
private const val CARD = 0xFF1B2438.toInt()

fun openApp(c: Context, open: String): ModifiersBuilders.Clickable =
    ModifiersBuilders.Clickable.Builder()
        .setId("open-$open")
        .setOnClick(
            ActionBuilders.LaunchAction.Builder()
                .setAndroidActivity(
                    ActionBuilders.AndroidActivity.Builder()
                        .setPackageName(c.packageName)
                        .setClassName(MainActivity::class.java.name)
                        .addKeyToExtraMapping("open", ActionBuilders.AndroidStringExtra.Builder().setValue(open).build())
                        .build()
                )
                .build()
        )
        .build()

fun txt(s: String, size: Float, color: Int = INK, bold: Boolean = false, lines: Int = 1): LayoutElement =
    Text.Builder()
        .setText(s)
        .setMaxLines(lines)
        .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
        .setFontStyle(
            FontStyle.Builder()
                .setSize(sp(size))
                .setColor(argb(color))
                .setWeight(if (bold) LayoutElementBuilders.FONT_WEIGHT_BOLD else LayoutElementBuilders.FONT_WEIGHT_NORMAL)
                .build()
        )
        .build()

fun gap(h: Float): LayoutElement = Spacer.Builder().setHeight(dp(h)).build()

/** שורה מעוגלת: התווית מימין, השעה משמאל — יישור מוחלט, לא תלוי בשפת השעון. */
fun row(label: String, value: String, highlight: Boolean = false, size: Float = 14f): LayoutElement {
    val fg = if (highlight) GOLD_INK else INK
    fun side(el: LayoutElement, align: Int) =
        Box.Builder().setWidth(expand()).setHeight(wrap()).setHorizontalAlignment(align).addContent(el).build()
    return Box.Builder()
        .setWidth(expand()).setHeight(wrap())
        .setModifiers(
            ModifiersBuilders.Modifiers.Builder()
                .setBackground(
                    ModifiersBuilders.Background.Builder()
                        .setColor(argb(if (highlight) GOLD_CARD else CARD))
                        .setCorner(ModifiersBuilders.Corner.Builder().setRadius(dp(16f)).build())
                        .build()
                )
                .setPadding(ModifiersBuilders.Padding.Builder().setStart(dp(11f)).setEnd(dp(11f)).setTop(dp(4f)).setBottom(dp(4f)).build())
                .build()
        )
        .addContent(side(txt(label, size, fg), LayoutElementBuilders.HORIZONTAL_ALIGN_RIGHT))
        .addContent(side(txt(value, size, fg, bold = true), LayoutElementBuilders.HORIZONTAL_ALIGN_LEFT))
        .build()
}

/** גודל בסיס לפי רוחב המסך: 192dp (40 מ"מ) ← 1.0, מסכים גדולים עד 1.15. */
fun scale(d: DeviceParameters) = (d.screenWidthDp / 192f).coerceIn(0.9f, 1.15f)

// ═══════════════════════ זמני היום ═══════════════════════

class ZmanimTile : BaseTile() {
    override val open = "zmanim"
    override fun body(c: Context, e: Engine, at: Long, d: DeviceParameters): List<LayoutElement> {
        val k = scale(d)
        val rows = Zm.upcoming(e, 4)
        val n = rows.firstOrNull() ?: return listOf(txt("אין זמנים", 14f * k))
        val out = mutableListOf(
            txt(Zm.hebDate(e), 12f * k, MUTED),
            gap(2f),
            txt(n.label, 15f * k, GOLD, bold = true),
            txt(Zm.rowTime(e, n), 34f * k, INK, bold = true),
            gap(5f),
        )
        rows.drop(1).take(2).forEach {
            out.add(row(it.label, Zm.rowTime(e, it), size = 13f * k))
            out.add(gap(3f))
        }
        return out
    }
}

// ═══════════════════════ שבת וחג ═══════════════════════

class ShabbatTile : BaseTile() {
    override val open = "shabbat"
    override fun body(c: Context, e: Engine, at: Long, d: DeviceParameters): List<LayoutElement> {
        val k = scale(d)
        val s = e.shabbat()
        val out = mutableListOf<LayoutElement>(txt(s.title, 17f * k, GOLD, bold = true, lines = 2))
        out.add(txt(if (s.special.isNotEmpty()) s.special else Zm.hebDate(e), 12f * k, MUTED, lines = 2))
        out.add(gap(6f))
        s.candle?.let { out.add(row("הדלקת נרות", Zm.time(e, it), highlight = !s.now, size = 13.5f * k)); out.add(gap(3f)) }
        s.havdala?.let { out.add(row("צאת השבת", Zm.time(e, it), highlight = s.now, size = 13.5f * k)) }
        // "בעוד…" לא מוצג ב-Tile: הרשומה מתחלפת רק בגבולות, והספירה הייתה מתיישנת בין גבול לגבול
        return out
    }
}

// ═══════════════════════ ספירת העומר ═══════════════════════

class OmerTile : BaseTile() {
    override val open = "omer"
    override fun body(c: Context, e: Engine, at: Long, d: DeviceParameters): List<LayoutElement> {
        val k = scale(d)
        val day = e.omerDay()
        if (day <= 0) {
            val n = e.daysToOmer()
            return listOf(
                txt("ספירת העומר", 16f * k, GOLD, bold = true),
                gap(4f),
                txt(if (n >= 0) "מתחילים בעוד " + Heb.days(n.toLong()) else "", 13f * k, MUTED, lines = 2),
            )
        }
        return listOf(
            txt(if (e.omerTonight()) "הלילה סופרים" else "היום", 12f * k, MUTED),
            txt(Heb.num(day), 38f * k, GOLD, bold = true),
            txt("לעומר", 15f * k, INK, bold = true),
            gap(4f),
            txt(Engine.omerText(day, e.loc.nusach), 12.5f * k, INK, lines = 3),
        )
    }
}
