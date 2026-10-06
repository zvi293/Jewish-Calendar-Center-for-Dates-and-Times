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

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

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
                if (s != null) dbg("channel ready, postMessage=" + s.postMessage(Sync.HELLO, null));
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
