/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package il.co.jewishcalendar.twa;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.res.ResourcesCompat;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import androidx.core.content.FileProvider;

import java.io.File;
import java.lang.reflect.Field;

import il.co.jewishcalendar.twa.widget.Sync;

import com.google.androidbrowserhelper.trusted.SessionStore;
import com.google.androidbrowserhelper.trusted.SharedPreferencesTokenStore;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.splashscreens.SplashScreenStrategy;



public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    /** המקור של האתר — מאומת מול delegate_permission/common.use_as_origin ב-assetlinks.json. */
    private static final Uri SITE_ORIGIN = Uri.parse("https://jewishcalendar.co.il");
    private TwaLauncher launcher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        grantSplashUriPermission(); // חייב לפני super.onCreate — שם מתחילה העברת תמונת הפתיחה לכרום
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
        // ערוץ PostMessage דורש warmup של הדפדפן לפני אימות הקשר (validateRelationship)
        try {
            String pkg = CustomTabsClient.getPackageName(this, null);
            if (pkg != null) CustomTabsClient.connectAndInitialize(getApplicationContext(), pkg);
        } catch (Throwable ignored) {
        }
        if (offlineGate) showOfflineGate();
    }

    /*
     * ── פתיחה ראשונה בלי אינטרנט (10/2026) ──
     * אחרי פתיחה אחת עם חיבור כרום שומר את האתר (Service Worker), והאפליקציה נפתחת גם בלי
     * אינטרנט. בפתיחה הראשונה עוד אין עותק, וכרום היה מציג דף שגיאה משלו. במקום זה — מסך של
     * האפליקציה שמסביר מה קורה, עם "נסו שוב", והאתר נפתח לבד ברגע שהחיבור חוזר.
     * "נטען פעם" = אירוע NAVIGATION_FINISHED ראשון, או הגדרות שכבר הגיעו מהאתר בגרסה קודמת.
     */
    private boolean offlineGate;
    private ConnectivityManager.NetworkCallback netCallback;
    private TextView gateStatus;

    @Override
    protected boolean shouldLaunchImmediately() {
        if (Sync.siteLoaded(this) || hasInternet(this)) return true;
        offlineGate = true;
        return false;
    }

    /** חיבור שעובד בפועל (כולל אימות של המערכת — לא רק Wi-Fi בלי אינטרנט). */
    static boolean hasInternet(Context c) {
        try {
            ConnectivityManager cm = (ConnectivityManager) c.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            Network n = cm.getActiveNetwork();
            if (n == null) return false;
            NetworkCapabilities nc = cm.getNetworkCapabilities(n);
            return nc != null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        } catch (Throwable t) {
            return true; // בספק — פותחים כרגיל
        }
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private Typeface font(int res) {
        try {
            return ResourcesCompat.getFont(this, res);
        } catch (Throwable t) {
            return Typeface.DEFAULT_BOLD;
        }
    }

    private TextView gateText(String s, float sp, int color, int fontRes) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTypeface(font(fontRes));
        t.setGravity(Gravity.CENTER);
        t.setTextDirection(View.TEXT_DIRECTION_RTL);
        t.setLineSpacing(0, 1.15f);
        return t;
    }

    private void showOfflineGate() {
        final int navy = 0xFF0F172A, gold = 0xFFF2D98A;
        getWindow().setBackgroundDrawable(new ColorDrawable(navy));
        getWindow().setStatusBarColor(navy);
        getWindow().setNavigationBarColor(navy);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        box.setBackgroundColor(navy);
        box.setPadding(dp(28), dp(24), dp(28), dp(24));

        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.splash_icon);
        icon.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        box.addView(icon, new LinearLayout.LayoutParams(dp(132), dp(132)));

        TextView title = gateText("צריך אינטרנט בפתיחה הראשונה", 23, gold, R.font.frl_bold);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(18);
        box.addView(title, lp);

        TextView body = gateText("בפתיחה הראשונה הלוח היהודי שומר במכשיר את הלוח, הזמנים והתפילות. "
                + "מאותו רגע האפליקציה נפתחת גם בלי אינטרנט.", 16, 0xE6FFFFFF, R.font.assistant_regular);
        lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(12);
        box.addView(body, lp);

        TextView retry = gateText("נסו שוב", 17, 0xFF1E1B4B, R.font.assistant_extrabold);
        GradientDrawable pill = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xFFF6E3A1, 0xFFD4AF37});
        pill.setCornerRadius(dp(999));
        retry.setBackground(pill);
        retry.setPadding(dp(36), dp(12), dp(36), dp(12));
        retry.setOnClickListener(v -> {
            if (hasInternet(this)) leaveOfflineGate();
            else gateStatus.setText("עדיין אין חיבור — האפליקציה תיפתח לבד כשהחיבור יחזור.");
        });
        lp = new LinearLayout.LayoutParams(-2, -2);
        lp.topMargin = dp(26);
        box.addView(retry, lp);

        gateStatus = gateText("כשהחיבור יחזור, האפליקציה תיפתח מעצמה.", 13, 0xB3FFFFFF, R.font.assistant_regular);
        lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(14);
        box.addView(gateStatus, lp);
        setContentView(box);

        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            netCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onCapabilitiesChanged(Network network, NetworkCapabilities nc) {
                    if (nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                            && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                        runOnUiThread(() -> leaveOfflineGate());
                    }
                }
            };
            cm.registerNetworkCallback(new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET).build(), netCallback);
        } catch (Throwable t) {
            Log.w("JcOffline", "network callback", t);
        }
    }

    private void leaveOfflineGate() {
        if (!offlineGate || isFinishing()) return;
        offlineGate = false;
        stopNetCallback();
        launchTwa();
    }

    private void stopNetCallback() {
        if (netCallback == null) return;
        try {
            ((ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCallback);
        } catch (Throwable ignored) {
        }
        netCallback = null;
    }

    @Override
    protected void onDestroy() {
        stopNetCallback();
        super.onDestroy();
    }

    /*
     * ── גשר לווידג'טים (10/2026) ──
     * הווידג'טים במסך הבית מחושבים בטלפון, אבל העיר, הנוסח וסדרי הלימוד נבחרים באתר
     * (localStorage של כרום). אחרי כל טעינת דף ב-TWA מבקשים ערוץ PostMessage, שולחים
     * לדף "jc-widgets-hello" עם port, והדף (lux.js appBridge) מחזיר דרכו את ההגדרות —
     * Sync שומר ומעדכן את הווידג'טים. כרום 115+; ב-WebView fallback אין ערוץ.
     * ה-CustomTabsSession של ה-TWA פרטי ב-TwaLauncher — נקרא ברפלקציה (כלל keep ב-proguard-rules.pro).
     */
    @Override
    protected CustomTabsCallback getCustomTabsCallback() {
        final CustomTabsCallback base = super.getCustomTabsCallback();
        return new CustomTabsCallback() {
            @Override
            public void onNavigationEvent(int navigationEvent, Bundle extras) {
                if (base != null) base.onNavigationEvent(navigationEvent, extras);
                dbg("navigation " + navigationEvent);
                if (navigationEvent == NAVIGATION_FINISHED) {
                    // האתר נטען פעם — מעכשיו יש לכרום עותק, ופתיחה בלי אינטרנט לא צריכה את המסך שלנו
                    Sync.markSiteLoaded(getApplicationContext());
                    CustomTabsSession s = twaSession();
                    if (s != null) {
                        try {
                            dbg("requestPostMessageChannel=" + s.requestPostMessageChannel(SITE_ORIGIN, SITE_ORIGIN, new Bundle()));
                        } catch (Throwable t) {
                            Log.w("JcBridge", "requestPostMessageChannel", t);
                        }
                    }
                }
            }

            @Override
            public void onMessageChannelReady(Bundle extras) {
                if (base != null) base.onMessageChannelReady(extras);
                CustomTabsSession s = twaSession();
                if (s != null) {
                    dbg("channel ready, postMessage=" + s.postMessage(Sync.HELLO, null));
                    // היכולות של הגרסה (סנכרון ליומן) — הדף מציג לפיהן את כפתור "ליומן הטלפון"
                    dbg("caps=" + s.postMessage(Sync.CAPS, null));
                }
            }

            @Override
            public void onPostMessage(String message, Bundle extras) {
                if (base != null) base.onPostMessage(message, extras);
                dbg("message " + (message == null ? 0 : message.length()) + " chars");
                Sync.onMessage(getApplicationContext(), message);
            }

            @Override
            public void extraCallback(String callbackName, Bundle args) {
                if (base != null) base.extraCallback(callbackName, args);
            }

            @Override
            public Bundle extraCallbackWithResult(String callbackName, Bundle args) {
                return base != null ? base.extraCallbackWithResult(callbackName, args) : null;
            }

            @Override
            public void onRelationshipValidationResult(int relation, Uri requestedOrigin, boolean result, Bundle extras) {
                if (base != null) base.onRelationshipValidationResult(relation, requestedOrigin, result, extras);
                dbg("relationship " + relation + " " + requestedOrigin + " = " + result);
            }
        };
    }

    private static void dbg(String m) {
        if (Log.isLoggable("JcBridge", Log.DEBUG)) Log.d("JcBridge", m);
    }

    private CustomTabsSession twaSession() {
        if (launcher == null) {
            dbg("no launcher");
            return null;
        }
        try {
            Field f = TwaLauncher.class.getDeclaredField("mSession");
            f.setAccessible(true);
            return (CustomTabsSession) f.get(launcher);
        } catch (Throwable t) {
            Log.w("JcBridge", "no TWA session", t);
            return null;
        }
    }

    /**
     * הבהוב לבן בפתיחה — שורש (06/10/2026, נמדד בטלפון אחרי עדכון כרום 154): מכרום 152 receiveFile בודק
     * שלאפליקציה השולחת יש הרשאת קריאה לכתובת של תמונת הפתיחה. לבעלת ה-FileProvider אין רשומת הרשאה
     * (AOSP מדלג על הענקה "בסיסית" לבעלים), אז ההעברה נכשלת ("Failed to transfer splash image") וכרום
     * פותח את החלון שלו בלבן באנימציית הפתיחה. הענקה עצמית עם PERSISTABLE יוצרת את הרשומה
     * (בזיכרון בלבד — takePersistableUriPermission לא נקרא); בכרום ישן יותר אין בדיקה כזו ואין השפעה.
     * העקיפה מהדיון ב-android-browser-helper #623 (אומתה שם ב-S24 Ultra). התיקייה והקובץ — של הספרייה.
     */
    private void grantSplashUriPermission() {
        try {
            File splash = new File(new File(getFilesDir(), "twa_splash"), "splash_image.png");
            Uri uri = FileProvider.getUriForFile(this, getString(R.string.providerAuthority), splash);
            grantUriPermission(getPackageName(), uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        } catch (Throwable t) {
            Log.w("JcSplash", "splash uri self-grant failed", t); // לעולם לא לחסום את הפתיחה בגלל מסך הפתיחה
        }
    }

    /**
     * כרום נפתח במצב כהה (10/2026). מכרום 152 העברת תמונת הפתיחה לכרום נכשלת
     * (receiveFile מחזיר false — android-browser-helper #623, "Failed to transfer splash image"),
     * וכרום מציג את החלון הריק שלו עד הציור הראשון של האתר — לבן במצב בהיר.
     * במצב כהה החלון הזה כהה ומתמזג במסך הפתיחה. האתר לא תלוי ב-prefers-color-scheme,
     * וצבעי שורת הסטטוס והניווט זהים בשני המצבים (#0F172A). אותם פרמטרים כמו createTwaLauncher של הספרייה.
     */
    @Override
    protected TwaLauncher createTwaLauncher() {
        launcher = new TwaLauncher(this, null, SessionStore.makeSessionId(getTaskId()),
                new SharedPreferencesTokenStore(this)) {
            @Override
            public void launch(TrustedWebActivityIntentBuilder twaBuilder,
                    CustomTabsCallback customTabsCallback,
                    SplashScreenStrategy splashScreenStrategy,
                    Runnable completionCallback,
                    FallbackStrategy fallbackStrategy) {
                twaBuilder.setColorScheme(CustomTabsIntent.COLOR_SCHEME_DARK);
                super.launch(twaBuilder, customTabsCallback, splashScreenStrategy,
                        completionCallback, fallbackStrategy);
            }
        };
        return launcher;
    }

    @Override
    protected Uri getLaunchingUrl() {
        // Get the original launch Url.
        Uri uri = super.getLaunchingUrl();

        

        return uri;
    }
}
