package il.co.jewishcalendar.wear

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import il.co.jewishcalendar.wear.complication.HebDateComplication
import il.co.jewishcalendar.wear.complication.NextZmanComplication
import il.co.jewishcalendar.wear.complication.OmerComplication
import il.co.jewishcalendar.wear.complication.ShabbatComplication
import il.co.jewishcalendar.wear.tile.OmerTile
import il.co.jewishcalendar.wear.tile.ShabbatTile
import il.co.jewishcalendar.wear.tile.ZmanimTile

/** אחרי שינוי הגדרה (עיר, נוסח, שיטה, דקות) — לבנות מחדש את כל ה-Tiles וה-Complications. */
object Refresh {
    fun all(c: Context) {
        val app = c.applicationContext
        runCatching {
            val up = TileService.getUpdater(app)
            listOf(ZmanimTile::class.java, ShabbatTile::class.java, OmerTile::class.java).forEach { up.requestUpdate(it) }
        }
        listOf(NextZmanComplication::class.java, HebDateComplication::class.java, OmerComplication::class.java, ShabbatComplication::class.java).forEach {
            runCatching { ComplicationDataSourceUpdateRequester.create(app, ComponentName(app, it)).requestUpdateAll() }
        }
    }
}
