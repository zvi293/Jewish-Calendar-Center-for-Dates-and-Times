package il.co.jewishcalendar.twa.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Bundle;

/** גרסת בדיקה בלבד: מבקש מהמשגר להצמיד ווידג'ט למסך הבית (--es kind ZMANIM). */
public class PinActivity extends Activity {
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        String kind = getIntent().getStringExtra("kind");
        try {
            W.Kind k = W.Kind.valueOf(kind);
            AppWidgetManager m = AppWidgetManager.getInstance(this);
            if (m.isRequestPinAppWidgetSupported()) m.requestPinAppWidget(new ComponentName(this, W.classOf(k)), null, null);
        } catch (Exception ignored) {
        }
        finish();
    }
}
