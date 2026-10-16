package il.co.jewishcalendar.wear.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.MaterialTheme
import il.co.jewishcalendar.wear.R

/** הצבעים של האתר והווידג'טים: זהב על רקע שחור (OLED — חוסך סוללה). */
object JC {
    val Gold = Color(0xFFE2BE5A)
    val GoldDeep = Color(0xFFB8902E)
    val GoldInk = Color(0xFFFCE7A8)
    val GoldCard = Color(0xFF3A2E10)
    val Ink = Color(0xFFF1F5F9)
    val Muted = Color(0xFFA7B3C4)
    val Card = Color(0xFF1B2438)
    val Card2 = Color(0xFF232F49)
    val Bg = Color(0xFF000000)
    /** תוספת לפי היום בתפילה — הבורדו של האתר במצב כהה (.pr-add: #fda4af) */
    val Add = Color(0xFFFDA4AF)

    val Sans = FontFamily(
        Font(R.font.assistant_regular, FontWeight.Normal),
        Font(R.font.assistant_semibold, FontWeight.SemiBold),
        Font(R.font.assistant_bold, FontWeight.Bold),
        Font(R.font.assistant_extrabold, FontWeight.ExtraBold),
    )
    val Serif = FontFamily(
        Font(R.font.frl_bold, FontWeight.Bold),
        Font(R.font.frl_black, FontWeight.Black),
    )
}

@Composable
fun JcTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ColorScheme(
            primary = JC.Gold,
            onPrimary = Color(0xFF1A1405),
            primaryContainer = JC.GoldCard,
            onPrimaryContainer = JC.GoldInk,
            surfaceContainer = JC.Card,
            surfaceContainerLow = JC.Card,
            surfaceContainerHigh = JC.Card2,
            onSurface = JC.Ink,
            onSurfaceVariant = JC.Muted,
            background = JC.Bg,
            onBackground = JC.Ink,
        ),
        content = content,
    )
}

/** כל מסך בעברית מימין לשמאל — גם כששפת השעון אנגלית. */
@Composable
fun Rtl(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl, content = content)
}
