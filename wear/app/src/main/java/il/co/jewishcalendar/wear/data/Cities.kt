package il.co.jewishcalendar.wear.data

/**
 * רשימת הערים לבחירה בשעון. הקואורדינטות, אזור הזמן והגובה — בדיוק מה ש-hebcal מחזיר לאתר
 * לאותו geonameid (נמשך 16/10/2026), כך שהזמנים בשעון זהים לאתר כשנבחרה אותה עיר.
 * הדלקת נרות: ירושלים 40 דק', שאר הארץ 20, חו"ל 18 — כמו computeKosherZmanim באתר.
 */
data class City(val id: Int, val name: String, val lat: Double, val lon: Double, val elev: Double, val tz: String, val israel: Boolean) {
    val candle: Int get() = if (id == 281184) 40 else if (israel) 20 else 18
}

object Cities {
    val ALL: List<City> = listOf(
        City(281184, "ירושלים", 31.76904, 35.21633, 0.0, "Asia/Jerusalem", true),
        City(295514, "בני ברק", 32.08074, 34.8338, 0.0, "Asia/Jerusalem", true),
        City(293918, "פתח תקווה", 32.0888, 34.88666, 0.0, "Asia/Jerusalem", true),
        City(293397, "תל אביב", 32.08088, 34.78057, 0.0, "Asia/Jerusalem", true),
        City(294801, "חיפה", 32.81303, 34.99928, 0.0, "Asia/Jerusalem", true),
        City(295530, "באר שבע", 31.25181, 34.7913, 0.0, "Asia/Jerusalem", true),
        City(295629, "אשדוד", 31.79213, 34.64966, 0.0, "Asia/Jerusalem", true),
        City(294071, "נתניה", 32.33294, 34.85917, 0.0, "Asia/Jerusalem", true),
        City(293703, "ראשון לציון", 31.97102, 34.78939, 0.0, "Asia/Jerusalem", true),
        City(294751, "חולון", 32.01034, 34.77918, 0.0, "Asia/Jerusalem", true),
        City(293788, "רמת גן", 32.08227, 34.81065, 0.0, "Asia/Jerusalem", true),
        City(293725, "רחובות", 31.89421, 34.81199, 0.0, "Asia/Jerusalem", true),
        City(295432, "בית שמש", 31.73072, 34.99293, 0.0, "Asia/Jerusalem", true),
        City(295620, "אשקלון", 31.66926, 34.57149, 0.0, "Asia/Jerusalem", true),
        City(295548, "בת ים", 32.02379, 34.75185, 0.0, "Asia/Jerusalem", true),
        City(294778, "הרצליה", 32.16627, 34.82536, 0.0, "Asia/Jerusalem", true),
        City(294514, "כפר סבא", 32.175, 34.90694, 0.0, "Asia/Jerusalem", true),
        City(293807, "רעננה", 32.1836, 34.87386, 0.0, "Asia/Jerusalem", true),
        City(282926, "מודיעין", 31.89385, 35.01504, 0.0, "Asia/Jerusalem", true),
        City(8199378, "מודיעין עילית", 31.93221, 35.04416, 0.0, "Asia/Jerusalem", true),
        City(8428480, "אלעד", 32.05108, 34.95704, 0.0, "Asia/Jerusalem", true),
        City(293322, "טבריה", 32.79396, 35.53152, 0.0, "Asia/Jerusalem", true),
        City(293100, "צפת", 32.96465, 35.496, 0.0, "Asia/Jerusalem", true),
        City(294097, "נוף הגליל", 32.70816, 35.32469, 0.0, "Asia/Jerusalem", true),
        City(295740, "עפולה", 32.60907, 35.2892, 0.0, "Asia/Jerusalem", true),
        City(294577, "כרמיאל", 32.90951, 35.29768, 0.0, "Asia/Jerusalem", true),
        City(294117, "נהריה", 33.00892, 35.09814, 0.0, "Asia/Jerusalem", true),
        City(295721, "עכו", 32.92814, 35.07647, 0.0, "Asia/Jerusalem", true),
        City(293842, "קריית גת", 31.60998, 34.76422, 0.0, "Asia/Jerusalem", true),
        City(293825, "קריית שמונה", 33.21204, 35.57044, 0.0, "Asia/Jerusalem", true),
        City(295277, "אילת", 29.55805, 34.94821, 0.0, "Asia/Jerusalem", true),
        City(295328, "דימונה", 31.07079, 35.03269, 0.0, "Asia/Jerusalem", true),
        City(295657, "ערד", 31.25882, 35.21282, 0.0, "Asia/Jerusalem", true),
        City(293992, "אופקים", 31.3141, 34.62025, 0.0, "Asia/Jerusalem", true),
        City(294068, "נתיבות", 31.42305, 34.58911, 0.0, "Asia/Jerusalem", true),
        City(293619, "שדרות", 31.525, 34.59693, 0.0, "Asia/Jerusalem", true),
        City(293835, "קריית מלאכי", 31.72888, 34.74632, 0.0, "Asia/Jerusalem", true),
        City(293222, "יבנה", 31.87808, 34.73983, 0.0, "Asia/Jerusalem", true),
        City(294421, "לוד", 31.9467, 34.8903, 0.0, "Asia/Jerusalem", true),
        City(293768, "רמלה", 31.92624, 34.8635, 0.0, "Asia/Jerusalem", true),
        City(294760, "הוד השרון", 32.15934, 34.8932, 0.0, "Asia/Jerusalem", true),
        City(293690, "ראש העין", 32.09556, 34.95664, 0.0, "Asia/Jerusalem", true),
        City(294981, "גבעת שמואל", 32.07817, 34.84858, 0.0, "Asia/Jerusalem", true),
        City(293845, "קריית אתא", 32.81149, 35.11323, 0.0, "Asia/Jerusalem", true),
        City(294946, "חדרה", 32.44192, 34.9039, 0.0, "Asia/Jerusalem", true),
        City(293067, "זכרון יעקב", 32.56883, 34.95427, 0.0, "Asia/Jerusalem", true),
        City(8199394, "אריאל", 32.1065, 35.18449, 0.0, "Asia/Jerusalem", true),
        City(282993, "מעלה אדומים", 31.7774, 35.29875, 0.0, "Asia/Jerusalem", true),
        City(293721, "רכסים", 32.74958, 35.10057, 0.0, "Asia/Jerusalem", true),
        City(293821, "קריית יערים", 31.803, 35.102, 0.0, "Asia/Jerusalem", true),
        City(294999, "גבעתיים", 32.07225, 34.81253, 0.0, "Asia/Jerusalem", true),
        City(293831, "קריית מוצקין", 32.83706, 35.0776, 0.0, "Asia/Jerusalem", true),
        City(5128581, "ניו יורק", 40.71427, -74.00597, 0.0, "America/New_York", false),
        City(5110302, "ברוקלין", 40.6501, -73.94958, 0.0, "America/New_York", false),
        City(5368361, "לוס אנג'לס", 34.05223, -118.24368, 0.0, "America/Los_Angeles", false),
        City(4164138, "מיאמי", 25.77427, -80.19366, 0.0, "America/New_York", false),
        City(5100280, "לייקווד", 40.09789, -74.21764, 0.0, "America/New_York", false),
        City(6167865, "טורונטו", 43.70643, -79.39864, 0.0, "America/Toronto", false),
        City(6077243, "מונטריאול", 45.50884, -73.58781, 0.0, "America/Toronto", false),
        City(2643743, "לונדון", 51.50853, -0.12574, 0.0, "Europe/London", false),
        City(2643123, "מנצ'סטר", 53.48095, -2.23743, 0.0, "Europe/London", false),
        City(2988507, "פריז", 48.85341, 2.3488, 0.0, "Europe/Paris", false),
        City(2803138, "אנטוורפן", 51.22047, 4.40026, 0.0, "Europe/Brussels", false),
        City(524901, "מוסקבה", 55.75204, 37.61781, 0.0, "Europe/Moscow", false),
        City(3435910, "בואנוס איירס", -34.61315, -58.37723, 0.0, "America/Argentina/Buenos_Aires", false),
        City(993800, "יוהנסבורג", -26.20227, 28.04363, 0.0, "Africa/Johannesburg", false),
        City(2158177, "מלבורן", -37.814, 144.96332, 0.0, "Australia/Melbourne", false)
    )

    /** ברירת המחדל של האתר — פתח תקווה (293918). */
    const val DEFAULT_ID = 293918

    fun byId(id: Int): City? = ALL.firstOrNull { it.id == id }
}
