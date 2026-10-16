package il.co.jewishcalendar.wear.ui

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import il.co.jewishcalendar.wear.core.Engine
import il.co.jewishcalendar.wear.core.Heb
import il.co.jewishcalendar.wear.core.Levana
import il.co.jewishcalendar.wear.data.BirkatLevana
import il.co.jewishcalendar.wear.data.Brachot
import il.co.jewishcalendar.wear.data.Cities
import il.co.jewishcalendar.wear.data.MeeinShalosh
import il.co.jewishcalendar.wear.data.Settings
import il.co.jewishcalendar.wear.data.Zm
import il.co.jewishcalendar.wear.Refresh

// ═══════════════════════ ראשי ═══════════════════════

@Composable
fun HomeScreen(go: (String) -> Unit) {
    val c = LocalContext.current
    val now = rememberNow()
    val e = remember(now, Settings.prefs(c).all.hashCode()) { Settings.engine(c, now) }
    val next = Zm.next(e)
    val special = e.specialToday()
    val sh = e.shabbat()
    val occ = e.nextOccasion()
    val omer = e.omerDay()

    ListScreen {
        item {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(top = 6.dp)) {
                Header(Zm.hebDate(e), size = 21.sp)
                T(Heb.weekday(e.dow) + " · " + Settings.locationName(c), size = 12.sp, color = JC.Muted)
                if (special.isNotEmpty()) T(special, size = 13.sp, color = JC.GoldInk, weight = FontWeight.SemiBold)
            }
        }
        if (next != null) {
            item { ZRow(next.label + (if (next.sub.isNotEmpty()) " · " + next.sub else ""), Zm.rowTime(e, next), highlight = true, sub = Zm.inText(next.ms - now), onClick = { go("zmanim") }) }
        }
        item { NavRow("⏱", "זמני היום", onClick = { go("zmanim") }) }
        item {
            val v = sh.candle?.let { if (sh.now) "צאת " + Zm.time(e, sh.havdala ?: it) else Zm.time(e, it) } ?: ""
            NavRow("🕯", sh.title, v, onClick = { go("shabbat") })
        }
        if (occ != null && occ.name != null) {
            val d = e.daysUntil(occ)
            item { NavRow("✡", occ.name, if (d <= 0) "היום" else "בעוד " + Heb.days(d.toLong()), onClick = { go("shabbat") }) }
        }
        if (omer > 0) item { NavRow("🌾", "ספירת העומר", Heb.num(omer), onClick = { go("omer") }) }
        item { ZRow("📖  דף יומי", e.dafMasechet() + " " + e.dafNum()) }
        item { ZRow("📜  תהילים", e.tehillimLabel()) }
        item { NavRow("🌙", "ברכת הלבנה", levanaShort(e), onClick = { go("levana") }) }
        item { NavRow("🙏", "ברכות קצרות", onClick = { go("brachot") }) }
        item { NavRow("🧭", "כיוון התפילה", onClick = { go("compass") }) }
        item { NavRow("⚙", "הגדרות", onClick = { go("settings") }) }
    }
}

// ═══════════════════════ זמני היום ═══════════════════════

@Composable
fun ZmanimScreen() {
    val c = LocalContext.current
    val now = rememberNow()
    val e = remember(now) { Settings.engine(c, now) }
    val rows = Zm.upcoming(e, 18)
    ListScreen {
        item { Header("זמני היום") }
        item { T(Settings.locationName(c) + " · " + Settings.METHOD_NAMES[e.loc.method], size = 12.sp, color = JC.Muted) }
        rows.forEachIndexed { i, r ->
            item { ZRow(r.label, Zm.rowTime(e, r), highlight = i == 0, sub = if (i == 0) Zm.inText(r.ms - now) else "") }
        }
    }
}

// ═══════════════════════ שבת וחג ═══════════════════════

@Composable
fun ShabbatScreen() {
    val c = LocalContext.current
    val now = rememberNow()
    val e = remember(now) { Settings.engine(c, now) }
    val s = e.shabbat()
    val o = e.nextOccasion()
    ListScreen {
        item { Header(s.title, size = 19.sp) }
        if (s.special.isNotEmpty()) item { T(s.special, size = 13.sp, color = JC.GoldInk) }
        s.candle?.let { item { ZRow("הדלקת נרות · " + s.candleDay, Zm.time(e, it), highlight = !s.now) } }
        s.havdala?.let { item { ZRow("צאת השבת · " + s.havdalaDay, Zm.time(e, it), highlight = s.now) } }
        item {
            val t = if (s.now) s.havdala else s.candle
            if (t != null && t > now) T(Zm.inText(t - now), size = 13.sp, color = JC.Muted)
        }
        if (o?.name != null) {
            item { Header(o.name, size = 17.sp) }
            item { T(o.dateLabel, size = 12.sp, color = JC.Muted) }
            o.start?.let { st -> if (o.startLabel.isNotEmpty()) item { ZRow(o.startLabel + (if (o.startDay.isNotEmpty()) " · " + o.startDay else ""), Zm.time(e, st)) } }
            o.end?.let { en -> if (o.endLabel.isNotEmpty()) item { ZRow(o.endLabel + (if (o.endDay.isNotEmpty()) " · " + o.endDay else ""), Zm.time(e, en)) } }
            if (o.note.isNotEmpty()) item { T(o.note, size = 12.sp, color = JC.Muted) }
        }
    }
}

// ═══════════════════════ ספירת העומר ═══════════════════════

private const val OMER_BRACHA = "בָּרוּךְ אַתָּה יְהֹוָה אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל סְפִירַת הָעֹמֶר:"
private const val OMER_HARACHAMAN = "הָרַחֲמָן הוּא יַחֲזִיר לָנוּ עֲבוֹדַת בֵּית הַמִּקְדָּשׁ לִמְקוֹמָהּ בִּמְהֵרָה בְיָמֵינוּ, אָמֵן סֶלָה:"

@Composable
fun OmerScreen() {
    val c = LocalContext.current
    val now = rememberNow()
    val e = remember(now) { Settings.engine(c, now) }
    val d = e.omerDay()
    ListScreen {
        if (d <= 0) {
            val n = e.daysToOmer()
            item { Header("ספירת העומר") }
            item { T(if (n >= 0) "מתחילים לספור בעוד " + Heb.days(n.toLong()) else "", size = 14.sp, color = JC.Muted) }
            return@ListScreen
        }
        item { T(if (e.omerTonight()) "הלילה סופרים" else "היום", size = 13.sp, color = JC.Muted) }
        item { Header(Heb.num(d), size = 40.sp) }
        item { T("לעומר", size = 17.sp, weight = FontWeight.Bold) }
        item { T(OMER_BRACHA, size = 16.sp, lineHeight = 26.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) }
        item { T(Engine.omerText(d, e.loc.nusach), size = 17.sp, weight = FontWeight.SemiBold, color = JC.GoldInk, lineHeight = 28.sp, modifier = Modifier.padding(horizontal = 12.dp)) }
        item { T(OMER_HARACHAMAN, size = 16.sp, lineHeight = 26.sp, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) }
    }
}

// ═══════════════════════ ברכות קצרות ═══════════════════════

@Composable
fun BrachotScreen(go: (String) -> Unit) {
    val c = LocalContext.current
    ListScreen {
        item { Header("ברכות קצרות") }
        item { NavRow("", "מעין שלוש", onClick = { go("meein") }) }
        Brachot.all(Settings.nusach(c)).forEach { b ->
            item { NavRow("", b.title, onClick = { go("bracha/" + b.key) }) }
        }
    }
}

@Composable
fun BrachaScreen(key: String) {
    val c = LocalContext.current
    val b = Brachot.all(Settings.nusach(c)).firstOrNull { it.key == key } ?: return
    ListScreen {
        item { Header(b.title, size = 20.sp) }
        b.paras.forEach { p ->
            val note = p.startsWith("(") || !p.any { it in 'ְ'..'ׇ' }
            item {
                T(
                    p,
                    size = if (note) 12.sp else 16.sp,
                    color = if (note) JC.Muted else JC.Ink,
                    weight = if (note && !p.startsWith("(")) FontWeight.Bold else FontWeight.Normal,
                    lineHeight = if (note) 18.sp else 27.sp,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp, vertical = 4.dp),
                )
            }
        }
    }
}

// ═══════════════════════ הגדרות ═══════════════════════

@Composable
fun SettingsScreen(go: (String) -> Unit) {
    val c = LocalContext.current
    var v by remember { mutableIntStateOf(0) }
    v.let { }
    ListScreen {
        item { Header("הגדרות") }
        item { NavRow("📍", "מיקום", Settings.locationName(c), onClick = { go("cities") }) }
        item {
            NavRow("📖", "נוסח", Settings.NUSACH_NAMES[Settings.nusach(c)] ?: "", onClick = {
                val keys = Settings.NUSACH_NAMES.keys.toList()
                val n = keys[(keys.indexOf(Settings.nusach(c)) + 1) % keys.size]
                save(c) { putString(Settings.K_NUSACH, n) }; v++
            })
        }
        item {
            NavRow("⏱", "שיטה", Settings.METHOD_NAMES[Settings.method(c)] ?: "", onClick = {
                save(c) { putString(Settings.K_METHOD, if (Settings.method(c) == "MGA") "GRA" else "MGA") }; v++
            })
        }
        item {
            val cs = Settings.candleSetting(c)
            NavRow("🕯", "הדלקת נרות", if (cs == 0) (if (Settings.usesPhone(c)) "כמו בטלפון (" else "לפי העיר (") + Settings.loc(c).candle + ")" else "$cs דק׳", onClick = {
                val o = Settings.CANDLE_OPTIONS
                save(c) { putInt(Settings.K_CANDLE, o[(o.indexOf(cs) + 1) % o.size]) }; v++
            })
        }
        item { T("לחיצה על שורה מחליפה את הבחירה", size = 11.sp, color = JC.Muted, modifier = Modifier.padding(top = 4.dp)) }
        item {
            T(if (Settings.hasPhone(c)) "📱 מסונכרן עם אפליקציית הטלפון: שינוי בטלפון מתעדכן כאן"
              else "📱 עם אפליקציית \"הלוח היהודי\" בטלפון — ההגדרות של האתר יגיעו לכאן לבד",
              size = 11.sp, color = JC.Muted, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
fun CitiesScreen(back: () -> Unit, askGps: () -> Unit) {
    val c = LocalContext.current
    val cur = Settings.cityId(c)
    ListScreen {
        item { Header("מיקום") }
        if (Settings.hasPhone(c)) {
            val on = cur == Settings.PHONE
            item {
                ZRow("📱  " + Settings.phoneName(c), if (on) "✓" else "", highlight = on, onClick = {
                    save(c) { putInt(Settings.K_CITY, Settings.PHONE) }
                    back()
                })
            }
        }
        item { ZRow("📡  מיקום השעון", if (cur == 0) "✓" else "", highlight = cur == 0, onClick = askGps) }
        Cities.ALL.forEach { city ->
            item {
                ZRow(city.name, if (city.id == cur) "✓" else "", highlight = city.id == cur, onClick = {
                    save(c) { putInt(Settings.K_CITY, city.id) }
                    back()
                })
            }
        }
    }
}

fun save(c: Context, f: android.content.SharedPreferences.Editor.() -> Unit) {
    Settings.prefs(c).edit().apply(f).apply()
    Refresh.all(c)
}

// ═══════════════════════ מעין שלוש ═══════════════════════

@Composable
fun MeeinPickScreen(go: (String) -> Unit) {
    val c = LocalContext.current
    val now = rememberNow()
    val adds = remember(now) { MeeinShalosh.adds(Settings.engine(c, now).hebNow(), Settings.nusach(c)) }
    ListScreen {
        item { Header("מעין שלוש") }
        item { T("מה אכלתם?", size = 13.sp, color = JC.Muted) }
        MeeinShalosh.TYPES.forEach { (k, v) -> item { NavRow("", v, onClick = { go("meein/$k") }) } }
        if (adds.isNotEmpty()) item { T("היום מוסיפים: " + adds.joinToString(" · ") { it.first.removePrefix("ב") }, size = 12.sp, color = JC.Add, modifier = Modifier.padding(top = 4.dp)) }
    }
}

@Composable
fun MeeinScreen(type: String) {
    val c = LocalContext.current
    val now = rememberNow()
    val segs = remember(now, type) { MeeinShalosh.build(type, Settings.nusach(c), Settings.engine(c, now).hebNow()) }
    ListScreen {
        item { Header("מעין שלוש · " + (MeeinShalosh.TYPES[type] ?: ""), size = 18.sp) }
        segs.forEach { sg ->
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp, vertical = 4.dp)) {
                    if (sg.label.isNotEmpty()) T(sg.label, size = 12.sp, color = JC.Muted)
                    when (sg.kind) {
                        MeeinShalosh.Kind.NOTE -> T(sg.text, size = 12.sp, color = JC.Muted, lineHeight = 18.sp)
                        // תוספת לפי היום — בבורדו ובאותו גודל כמו שאר הטקסט, כמו באתר
                        MeeinShalosh.Kind.ADD -> T(sg.text, size = 16.sp, color = JC.Add, lineHeight = 27.sp)
                        else -> T(sg.text, size = 16.sp, lineHeight = 27.sp)
                    }
                }
            }
        }
    }
}

// ═══════════════════════ ברכת הלבנה ═══════════════════════

/** "יום ג׳ 20/10 · 19:42" — מתי מתחיל / עד מתי (כמו whenShort בווידג'ט של הטלפון). */
private fun whenShort(e: Engine, ms: Long): String {
    val cal = java.util.Calendar.getInstance(e.tz)
    cal.timeInMillis = ms
    return Heb.weekdayShort(cal.get(java.util.Calendar.DAY_OF_WEEK)) + " " +
        Heb.gregShort(cal.get(java.util.Calendar.MONTH) + 1, cal.get(java.util.Calendar.DAY_OF_MONTH)) + " · " + Zm.time(e, ms)
}

/** שורת המצב בדף הבית: "אפשר לברך" / "בעוד 3 ימים". */
fun levanaShort(e: Engine): String {
    val st = Levana.status(e)
    return if (st.state == "before") Zm.inText(st.target - e.now) else "אפשר לברך"
}

@Composable
fun LevanaScreen() {
    val c = LocalContext.current
    val now = rememberNow()
    val e = remember(now) { Settings.engine(c, now) }
    val st = remember(now) { Levana.status(e) }
    val w = st.w
    val head = when (st.state) {
        "before" -> "אפשר לברך בעוד"
        "open" -> "✓ אפשר לברך עוד"
        else -> "לדעת מרן אפשר עוד"
    }
    ListScreen {
        item { Header("ברכת הלבנה" + (if (w.month.isNotEmpty()) " · " + w.month else ""), size = 18.sp) }
        item { ZRow(head, "", highlight = st.state != "before", sub = Zm.inText(st.target - now).removePrefix("בעוד ")) }
        item { ZRow("מתחילים", "", sub = whenShort(e, w.start)) }
        item { ZRow("אפשר עד", "", sub = whenShort(e, w.end)) }
        if (Settings.nusach(c) == "mizrahi") item { ZRow("לדעת מרן עד", "", sub = whenShort(e, w.end15)) }
        item { T("מברכים כשהלבנה נראית, ובמנהג רוב הקהילות לא בשבת ויום טוב", size = 12.sp, color = JC.Muted, modifier = Modifier.padding(vertical = 4.dp)) }
        BirkatLevana.TEXT.forEach { sg ->
            item {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp, vertical = 4.dp)) {
                    if (sg.kind == MeeinShalosh.Kind.NOTE) T(sg.text, size = 12.sp, color = JC.Muted, lineHeight = 18.sp)
                    else T(sg.text, size = 16.sp, lineHeight = 27.sp)
                }
            }
        }
    }
}
