package il.co.jewishcalendar.wear.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.ui.text.TextStyle
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListScope
import androidx.wear.compose.foundation.lazy.rememberScalingLazyListState
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import kotlinx.coroutines.delay

/** "עכשיו" שמתעדכן כל 20 שנ' — כל המסכים מחושבים מחדש לפיו. */
@Composable
fun rememberNow(): Long {
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(20_000)
            now = System.currentTimeMillis()
        }
    }
    return now
}

/** מסך רשימה נגלל (טבעת/כתר/מגע), עם השעה בראש ומחוון גלילה — דפוס Wear הסטנדרטי. */
@Composable
fun ListScreen(content: ScalingLazyListScope.() -> Unit) {
    val state = rememberScalingLazyListState(initialCenterItemIndex = 0)
    // הרשימה מתחילה מתחת לשעה שבראש המסך (בלי מרכוז אוטומטי של הפריט הראשון), ושוליים
    // יחסיים לגודל המסך — אותו מראה בשעון 40 מ"מ וב-47 מ"מ
    val h = LocalConfiguration.current.screenHeightDp
    val w = LocalConfiguration.current.screenWidthDp
    ScreenScaffold(scrollState = state) { _ ->
        Rtl {
            ScalingLazyColumn(
                state = state,
                modifier = Modifier.fillMaxWidth(),
                autoCentering = null,
                contentPadding = PaddingValues(top = (h * 0.15f).dp, bottom = (h * 0.22f).dp, start = (w * 0.06f).dp, end = (w * 0.06f).dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp),
                content = content,
            )
        }
    }
}

@Composable
fun T(
    text: String,
    size: TextUnit = 15.sp,
    color: Color = JC.Ink,
    weight: FontWeight = FontWeight.Normal,
    family: FontFamily = JC.Sans,
    modifier: Modifier = Modifier,
    align: TextAlign = TextAlign.Center,
    lineHeight: TextUnit = TextUnit.Unspecified,
) {
    Text(
        text = text,
        modifier = modifier,
        style = TextStyle(
            fontFamily = family,
            fontWeight = weight,
            fontSize = size,
            color = color,
            textAlign = align,
            lineHeight = lineHeight,
            textDirection = TextDirection.Rtl,
        ),
    )
}

/** שורת "תווית ··· שעה" בכרטיס מעוגל. הזמן הבא מודגש בזהב. */
@Composable
fun ZRow(label: String, value: String, highlight: Boolean = false, sub: String = "", onClick: (() -> Unit)? = null) {
    val bg = if (highlight) JC.GoldCard else JC.Card
    val fg = if (highlight) JC.GoldInk else JC.Ink
    // מסך צר (שעון מרובע/קטן, פחות מ-190dp) — כתב קטן מעט, כדי שתווית רגילה תישאר בשורה אחת
    val fs = if (LocalConfiguration.current.screenWidthDp < 190) 13.5.sp else 15.sp
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(bg)
            .let { if (onClick != null) it.clickable(onClick = onClick) else it }
            .padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            T(label, size = fs, color = fg, weight = FontWeight.SemiBold, align = TextAlign.Start)
            if (sub.isNotEmpty()) T(sub, size = 12.sp, color = if (highlight) JC.Gold else JC.Muted, align = TextAlign.Start)
        }
        Spacer(Modifier.width(6.dp))
        // השעה תמיד משמאל לימין (17:23), גם בתוך שורה עברית
        androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            T(value, size = fs, color = fg, weight = FontWeight.ExtraBold)
        }
    }
}

/** כפתור ניווט ברשימה הראשית. */
@Composable
fun NavRow(icon: String, label: String, value: String = "", onClick: () -> Unit) {
    ZRow(label = "$icon  $label", value = if (value.isEmpty()) "‹" else value, onClick = onClick)
}

@Composable
fun Header(text: String, color: Color = JC.Gold, size: TextUnit = 18.sp) {
    T(text, size = size, color = color, weight = FontWeight.Bold, family = JC.Serif, modifier = Modifier.padding(top = 2.dp, bottom = 2.dp))
}

val ScreenPad = PaddingValues(horizontal = 10.dp)
