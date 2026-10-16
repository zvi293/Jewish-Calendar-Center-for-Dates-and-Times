package il.co.jewishcalendar.wear.data

import com.kosherjava.zmanim.hebrewcalendar.JewishCalendar

/**
 * ברכת מעין שלוש בשעון — הנוסח והתוספות מועתקים מהאתר (script.js: buildAlHamichyaPayload,
 * _meeinShaloshAdds), כולל ההבדלים בין הנוסחים. בשעון בוחרים קודם מה אכלו (מזונות / יין / פירות),
 * ומקבלים ברכה אחת רציפה במקום שלוש חלופות על המסך הקטן.
 * היום לתוספות — לפי התאריך העברי שמתחלף בשקיעה (כמו "isShabbat" באתר: מהשקיעה של יום שישי).
 * שינוי בנוסח באתר ⇒ להעתיק מחדש לכאן.
 */
object MeeinShalosh {
    enum class Kind { TEXT, ADD, NOTE }
    data class Seg(val text: String, val kind: Kind = Kind.TEXT, val label: String = "")

    val TYPES = linkedMapOf("mezonot" to "מזונות", "yayin" to "יין", "perot" to "פירות")

    private const val BODY_ASHKENAZ = "וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, שֶׁרָצִיתָ וְהִנְחַלְתָּ לַאֲבוֹתֵינוּ, לֶאֱכוֹל מִפִּרְיָהּ וְלִשְׂבּוֹעַ מִטּוּבָהּ. רַחֵם נָא יְהֹוָה אֱלֹהֵינוּ עַל יִשְׂרָאֵל עַמֶּךָ, וְעַל יְרוּשָׁלַיִם עִירֶךָ, וְעַל צִיּוֹן מִשְׁכַּן כְּבוֹדֶךָ, וְעַל מִזְבְּחֶךָ וְעַל הֵיכָלֶךָ. וּבְנֵה יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ בִּמְהֵרָה בְיָמֵינוּ, וְהַעֲלֵנוּ לְתוֹכָהּ וְשַׂמְּחֵנוּ בְּבִנְיָנָהּ, וְנֹאכַל מִפִּרְיָהּ וְנִשְׂבַּע מִטּוּבָהּ וּנְבָרֶכְךָ עָלֶיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה:"
    private const val BODY_OTHER = "וְעַל תְּנוּבַת הַשָּׂדֶה, וְעַל אֶֽרֶץ חֶמְדָּה טוֹבָה וּרְחָבָה, שֶׁרָצִֽיתָ וְהִנְחַֽלְתָּ לַאֲבוֹתֵֽינוּ, לֶאֱכֹל מִפִּרְיָהּ וְלִשְׂבֹּֽעַ מִטּוּבָהּ. רַחֵם יְהֹוָה אֱלֹהֵֽינוּ עָלֵֽינוּ וְעַל יִשְׂרָאֵל עַמָּךְ, וְעַל יְרוּשָׁלַֽיִם עִירָךְ, וְעַל הַר צִיּוֹן מִשְׁכַּן כְּבוֹדָךְ, וְעַל מִזְבָּחָךְ וְעַל הֵיכָלָךְ. וּבְנֵה יְרוּשָׁלַֽיִם עִיר הַקֹּֽדֶשׁ בִּמְהֵרָה בְיָמֵֽינוּ, וְהַעֲלֵֽנוּ לְתוֹכָהּ, וְשַׂמְּחֵֽנוּ בְּבִנְיָנָהּ, וּנְבָֽרְכָֽךְ עָלֶֽיהָ בִּקְדֻשָּׁה וּבְטָהֳרָה:"

    fun build(type: String, nusach: String, jc: JewishCalendar): List<Seg> {
        val ashk = nusach == "ashkenaz"
        val out = ArrayList<Seg>()
        val open = when (type) {
            "yayin" -> "עַל הַגֶּֽפֶן וְעַל פְּרִי הַגֶּֽפֶן"
            "perot" -> "עַל הָעֵץ וְעַל פְּרִי הָעֵץ"
            else -> "עַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה"
        }
        out.add(Seg("בָּרוּךְ אַתָּה יְהֹוָה, אֱלֹהֵֽינוּ מֶֽלֶךְ הָעוֹלָם, $open"))
        out.add(Seg(if (ashk) BODY_ASHKENAZ else BODY_OTHER))
        adds(jc, nusach).forEach { out.add(Seg(it.second, Kind.ADD, it.first)) }

        // חתימה — לפי סוג, כמו באתר; "של ארץ ישראל" כהערה מתחת
        val sof = if (ashk) "כִּי אַתָּה יְהֹוָה טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ עַל הָאָֽרֶץ"
        else "כִּי אַתָּה טוֹב וּמֵטִיב לַכֹּל, וְנוֹדֶה לְךָ יְהֹוָה אֱלֹהֵינוּ עַל הָאָֽרֶץ"
        val (mid, midIL) = when (type) {
            "yayin" -> "וְעַל פְּרִי הַגֶּֽפֶן" to (if (ashk) "וְעַל פְּרִי גַפְנוֹ" else "וְעַל פְּרִי גַפְנָהּ")
            "perot" -> "וְעַל הַפֵּרוֹת" to (if (ashk) "וְעַל פֵּרוֹתָיו" else "וְעַל פֵּרוֹתֶֽיהָ")
            else -> (if (ashk) "וְעַל הַמִּחְיָה" else "וְעַל הַמִּחְיָה וְעַל הַכַּלְכָּלָה") to
                (if (ashk) "וְעַל מִחְיָתוֹ" else "וְעַל מִחְיָתָהּ וְעַל כַּלְכָּלָתָהּ")
        }
        out.add(Seg("$sof $mid"))
        val (end, endIL) = when (type) {
            "yayin" -> "פְּרִי הַגֶּֽפֶן:" to (if (ashk) "פְּרִי גַפְנוֹ:" else "פְּרִי גַפְנָהּ:")
            "perot" -> "הַפֵּרוֹת:" to (if (ashk) "פֵּרוֹתָיו:" else "פֵּרוֹתֶֽיהָ:")
            else -> (if (ashk) "הַמִּחְיָה:" else "הַמִּחְיָה וְעַל הַכַּלְכָּלָה:") to
                (if (ashk) "מִחְיָתוֹ:" else "מִחְיָתָהּ וְעַל כַּלְכָּלָתָהּ:")
        }
        out.add(Seg("בָּרוּךְ אַתָּה יְהֹוָה, עַל הָאָֽרֶץ וְעַל $end"))
        out.add(Seg("${TYPES[type]} של ארץ ישראל: \"$midIL\" ובחתימה \"$endIL\"", Kind.NOTE))
        return out
    }

    /** העתק של _meeinShaloshAdds באתר: [תווית, נוסח] לפי היום. */
    fun adds(jc: JewishCalendar, nusach: String): List<Pair<String, String>> {
        val out = ArrayList<Pair<String, String>>()
        val yt = jc.yomTovIndex
        val chol = jc.isCholHamoed
        val isYT = jc.isYomTovAssurBemelacha && yt != JewishCalendar.YOM_KIPPUR
        val shmini = yt == JewishCalendar.SHEMINI_ATZERES || yt == JewishCalendar.SIMCHAS_TORAH
        val pesach = yt == JewishCalendar.PESACH || yt == JewishCalendar.CHOL_HAMOED_PESACH
        val shavuot = yt == JewishCalendar.SHAVUOS
        val sukkot = yt == JewishCalendar.SUCCOS || yt == JewishCalendar.CHOL_HAMOED_SUCCOS || yt == JewishCalendar.HOSHANA_RABBA || shmini
        val regel = (pesach || shavuot || sukkot) && (isYT || chol)

        if (jc.dayOfWeek == 7) out.add("בשבת" to "וּרְצֵה וְהַחֲלִיצֵֽנוּ בְּיוֹם הַשַּׁבָּת הַזֶּה.")
        if (jc.isRoshChodesh) {
            out.add("בראש חודש" to "וְזָכְרֵֽנוּ לְטוֹבָה בְּיוֹם " + (if (nusach == "mizrahi") "רֹאשׁ חֹֽדֶשׁ" else "רֹאשׁ הַחֹֽדֶשׁ") + " הַזֶּה.")
        }
        if (yt == JewishCalendar.ROSH_HASHANA && isYT) out.add("בראש השנה" to "וְזָכְרֵֽנוּ לְטוֹבָה בְּיוֹם הַזִּכָּרוֹן הַזֶּה.")
        if (regel) {
            val chag = when {
                shmini -> if (nusach == "mizrahi") "שְׁמִינִי חַג עֲצֶֽרֶת" else if (nusach == "sfard") "הַשְּׁמִינִי עֲצֶֽרֶת הַחַג" else "הַשְּׁמִינִי חַג הָעֲצֶֽרֶת"
                pesach -> "חַג הַמַּצּוֹת"
                shavuot -> "חַג הַשָּׁבוּעוֹת"
                else -> "חַג הַסֻּכּוֹת"
            }
            val lbl = when {
                chol -> if (pesach) "בחוה\"מ פסח" else "בחוה\"מ סוכות"
                shmini -> "בשמיני עצרת"
                pesach -> "ביום טוב של פסח"
                shavuot -> "בשבועות"
                else -> "ביום טוב של סוכות"
            }
            val mikra = if (nusach == "mizrahi") (if (isYT) ", בְּיוֹם טוֹב מִקְרָא קֹֽדֶשׁ הַזֶּה" else ", בְּיוֹם מִקְרָא קֹֽדֶשׁ הַזֶּה") else ""
            out.add(lbl to "וְשַׂמְּחֵֽנוּ בְּיוֹם $chag הַזֶּה$mikra.")
        }
        return out
    }
}
