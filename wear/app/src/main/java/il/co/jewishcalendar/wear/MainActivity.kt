package il.co.jewishcalendar.wear

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import il.co.jewishcalendar.wear.data.Settings
import il.co.jewishcalendar.wear.ui.BrachaScreen
import il.co.jewishcalendar.wear.ui.BrachotScreen
import il.co.jewishcalendar.wear.ui.CitiesScreen
import il.co.jewishcalendar.wear.ui.CompassScreen
import il.co.jewishcalendar.wear.ui.HomeScreen
import il.co.jewishcalendar.wear.ui.MeeinPickScreen
import il.co.jewishcalendar.wear.ui.MeeinScreen
import il.co.jewishcalendar.wear.ui.JcTheme
import il.co.jewishcalendar.wear.ui.OmerScreen
import il.co.jewishcalendar.wear.ui.SettingsScreen
import il.co.jewishcalendar.wear.ui.ShabbatScreen
import il.co.jewishcalendar.wear.ui.ZmanimScreen
import il.co.jewishcalendar.wear.ui.save

/**
 * האפליקציה בשעון. ניווט ב-SwipeDismissableNavHost (החלקה ימינה = חזרה, כמו בכל אפליקציית Wear).
 * יעד פתיחה מ-Tile/Complication: extra "open" (zmanim / shabbat / omer).
 */
class MainActivity : ComponentActivity() {
    private var afterGps: (() -> Unit)? = null

    private val askLocation = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { r ->
        if (r.values.any { it }) useWatchLocation() else Toast.makeText(this, "בלי הרשאת מיקום — בחרו עיר מהרשימה", Toast.LENGTH_LONG).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val open = intent?.getStringExtra("open")
        setContent {
            JcTheme {
                AppScaffold {
                    val nav = rememberSwipeDismissableNavController()
                    SwipeDismissableNavHost(navController = nav, startDestination = "home") {
                        composable("home") { HomeScreen { nav.navigate(it) } }
                        composable("zmanim") { ZmanimScreen() }
                        composable("shabbat") { ShabbatScreen() }
                        composable("omer") { OmerScreen() }
                        composable("brachot") { BrachotScreen { nav.navigate(it) } }
                        composable("bracha/{key}") { BrachaScreen(it.arguments?.getString("key") ?: "") }
                        composable("meein") { MeeinPickScreen { nav.navigate(it) } }
                        composable("meein/{type}") { MeeinScreen(it.arguments?.getString("type") ?: "mezonot") }
                        composable("compass") { CompassScreen() }
                        composable("settings") { SettingsScreen { nav.navigate(it) } }
                        composable("cities") {
                            CitiesScreen(back = { nav.popBackStack() }, askGps = {
                                afterGps = { nav.popBackStack() }
                                requestWatchLocation()
                            })
                        }
                    }
                    if (open != null && open != "home" && savedInstanceState == null) {
                        androidx.compose.runtime.LaunchedEffect(Unit) { nav.navigate(open) }
                    }
                }
            }
        }
    }

    private fun requestWatchLocation() {
        val fine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (fine || coarse) useWatchLocation()
        else askLocation.launch(arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION))
    }

    @SuppressLint("MissingPermission")
    private fun useWatchLocation() {
        val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val last = lm.getProviders(true).mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }.maxByOrNull { it.time }
        if (last != null) {
            store(last.latitude, last.longitude)
            return
        }
        val provider = lm.getProviders(true).firstOrNull()
        if (provider == null) {
            Toast.makeText(this, "המיקום כבוי בשעון — בחרו עיר מהרשימה", Toast.LENGTH_LONG).show()
            return
        }
        Toast.makeText(this, "מאתר מיקום…", Toast.LENGTH_SHORT).show()
        lm.getCurrentLocation(provider, null, mainExecutor) { l ->
            if (l != null) store(l.latitude, l.longitude)
            else Toast.makeText(this, "לא נמצא מיקום — בחרו עיר מהרשימה", Toast.LENGTH_LONG).show()
        }
    }

    private fun store(lat: Double, lon: Double) {
        save(this) {
            putInt(Settings.K_CITY, 0)
            putFloat(Settings.K_GPS_LAT, lat.toFloat())
            putFloat(Settings.K_GPS_LON, lon.toFloat())
        }
        afterGps?.invoke()
        afterGps = null
    }
}
