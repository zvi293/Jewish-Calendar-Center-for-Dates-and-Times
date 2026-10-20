package il.co.jewishcalendar.twa;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.ActivityInfo;
import android.graphics.Insets;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;
import android.widget.FrameLayout;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/*
 * ── מצב טלפונים כשרים (10/2026) ──
 * בטלפון בלי כרום (נטספארק/רימון חוסמים אותו) אין TWA, והספרייה נופלת ל-WebView.
 * ה-WebViewFallbackActivity של androidbrowserhelper לא מאפשר לשנות את ה-WebViewClient (מתודות פרטיות),
 * ולכן LauncherActivity.getFallbackStrategy() פותח את המסך הזה במקומו.
 *
 * מה שונה מהספרייה:
 * - האתר ארוז בתוך האפליקציה (assets/site/, משימת copySiteAssets ב-build.gradle). כשאין חיבור מאומת,
 *   או שהטעינה של הדף נכשלה (למשל מסנן שעוד לא אישר את הדומיין), בקשות GET ל-jewishcalendar.co.il
 *   מוגשות מהנכסים — גם בפתיחה הראשונה בלי אינטרנט. כשיש רשת — רגיל (null), וה-Service Worker של האתר
 *   ממשיך לעבוד כרגיל.
 * - בקשות שה-Service Worker של האתר שולח (ServiceWorkerClient): מוגשים מהנכסים רק קבצים בלי ?v= או
 *   עם אותה גרסה בדיוק כמו בנכסים (versions.txt), ולעולם לא HTML — אחרת עותק ישן מהאפליקציה היה נכנס
 *   למטמון של ה-SW תחת גרסה חדשה (הרעלת מטמון).
 * - קישור שלא ל-jewishcalendar.co.il נפתח מחוץ לאפליקציה (אין גלישה חופשית בתוכה).
 * - Referer כמו בספרייה (android-app://il.co.jewishcalendar.twa/) — כך האתר מזהה את האפליקציה (html.jc-app),
 *   וה-User-Agent של WebView (עם "; wv)") — כך הוא מזהה את המצב הזה (html.jc-wv).
 * בלי הרשאת מיקום (כמו ב-WebView של הספרייה).
 */
public class KosherWebActivity extends Activity {

    private static final String TAG = "JcKosherWeb";
    static final String HOST = "jewishcalendar.co.il";
    private static final String ORIGIN = "https://" + HOST;
    private static final int NAVY = 0xFF0F172A;

    private WebView web;
    private FrameLayout root;
    private Uri launchUrl;
    private Map<String, String> headers;

    /** חיבור מאומת — מתעדכן מ-NetworkCallback (בלי קריאת מערכת בכל בקשה). */
    private static volatile boolean online = true;
    /** הטעינה הראשית נכשלה למרות שיש חיבור — מעכשיו מגישים מהנכסים עד סוף החיים של המסך. */
    private volatile boolean forceAssets;
    private ConnectivityManager.NetworkCallback netCallback;

    private static Set<String> bundledVersions;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        getWindow().setStatusBarColor(getColor(R.color.colorPrimary));
        getWindow().setNavigationBarColor(getColor(R.color.navigationColor));

        if (debuggable()) {
            WebView.setWebContentsDebuggingEnabled(true); // chrome://inspect — רק בגרסת debug
        }

        online = LauncherActivity.hasInternet(this);
        // רשת מסוננת שאנדרואיד לא אימת — בודקים בעצמנו שהאתר עונה (אחרת היינו מגישים מהנכסים)
        if (!online && LauncherActivity.hasUnvalidatedNetwork(this)) online = LauncherActivity.probeSiteBlocking(3000);
        watchNetwork();
        installServiceWorkerClient(getApplicationContext());

        launchUrl = resolve(getIntent() != null ? getIntent().getData() : null);
        headers = new HashMap<>();
        headers.put("Referer", "android-app://" + getPackageName() + "/");

        root = new FrameLayout(this);
        root.setBackgroundColor(NAVY);
        setContentView(root);
        edgeToEdge();
        createWebView();
        if (Build.VERSION.SDK_INT >= 33) {
            // targetSdk 36: באנדרואיד 16 onBackPressed לא נקרא יותר (חזרה חזויה) — רק דרך הקריאה הזאת
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBackOrFinish);
        }
        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(launchUrl.toString(), headers);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // קיצור דרך / ווידג'ט כשהמסך כבר פתוח — אותו WebView, הכתובת החדשה
        launchUrl = resolve(intent.getData());
        web.loadUrl(launchUrl.toString(), headers);
    }

    /** כתובת יחסית (קיצורי הדרך: "/?open=zmanim") או חסרה — אל האתר. */
    static Uri resolve(Uri u) {
        if (u == null) return Uri.parse(ORIGIN + "/");
        if (u.getScheme() == null) {
            String s = u.toString();
            return Uri.parse(ORIGIN + (s.startsWith("/") ? s : "/" + s));
        }
        return u;
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void createWebView() {
        web = new WebView(this);
        web.setBackgroundColor(NAVY);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false); // target=_blank / window.open — דרך shouldOverrideUrlLoading
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new WebChromeClient());
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    /* מאנדרואיד 15 (targetSdk 35+) החלון תמיד מקצה לקצה וצבעי הסרגלים לא חלים — מרפדים לפי הסרגלים
       והמקלדת, והרקע הכחול-לילה של root נראה מאחוריהם. לפני אנדרואיד 11 — המערכת מטפלת (adjustResize). */
    private void edgeToEdge() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        getWindow().setDecorFitsSystemWindows(false);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            Insets b = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsets.CONSUMED;
        });
    }

    private final class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return openOutsideIfExternal(request.getUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (online && !forceAssets) return null;
            return fromAssets(KosherWebActivity.this, request, false);
        }

        /* WebView לא מעביר Referer בסכמה android-app:// (רק כרום רושם אותה כסכמת referrer), כך שבדף
           document.referrer ריק והזיהוי בראש index.html לא נדלק. לכן מסמנים את האפליקציה בדרך השנייה שהדף
           מכיר: sessionStorage.moadim_in_app (נקרא בטעינה) + __jcMarkApp() אם הסקריפט כבר רץ. */
        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            markApp(view, url);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            markApp(view, url);
            if (debuggable()) {
                view.evaluateJavascript("JSON.stringify({ref:document.referrer,cls:document.documentElement.className,"
                        + "app:!!window.__jcInApp,wv:!!window.__jcWebView,online:navigator.onLine,url:location.href,"
                        + "sw:!!(navigator.serviceWorker&&navigator.serviceWorker.controller),"
                        + "hosts:[...new Set(performance.getEntriesByType('resource').map(e=>new URL(e.name).host))]})",
                        v -> Log.d(TAG, "page " + v));
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            mainFrameFailed(request);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (response != null && response.getStatusCode() >= 400) mainFrameFailed(request);
        }

        @Override
        public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            // תהליך הרינדור נפל (זיכרון) — בונים WebView חדש באותה כתובת במקום לקרוס
            Log.w(TAG, "render process gone, crash=" + detail.didCrash());
            root.removeView(web);
            web.destroy();
            createWebView();
            web.loadUrl(launchUrl.toString(), headers);
            return true;
        }
    }

    private static void markApp(WebView view, String url) {
        if (url == null || !isSite(Uri.parse(url))) return;
        view.evaluateJavascript("try{sessionStorage.setItem('moadim_in_app','1')}catch(e){}"
                + "if(window.__jcMarkApp)window.__jcMarkApp();", null);
    }

    private boolean debuggable() {
        return (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    /** הדף הראשי של האתר לא נטען (אין שרת, מסנן חוסם, שגיאת רשת) — טוענים אותו מהנכסים. */
    private void mainFrameFailed(WebResourceRequest request) {
        if (!request.isForMainFrame() || forceAssets) return;
        Uri u = request.getUrl();
        if (!isSite(u) || !"GET".equalsIgnoreCase(request.getMethod())) return;
        String path = assetPath(u);
        if (path == null) return;
        try {
            getAssets().open(path).close();
        } catch (IOException e) {
            return; // דף שלא ארוז באפליקציה — שגיאת הרשת הרגילה
        }
        Log.i(TAG, "main frame failed, serving bundled site: " + u);
        forceAssets = true;
        web.post(() -> web.loadUrl(u.toString(), headers));
    }

    private boolean openOutsideIfExternal(Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme().toLowerCase();
        if (("https".equals(scheme) || "http".equals(scheme)) && isSite(u)) return false;
        if ("about".equals(scheme) || "data".equals(scheme) || "blob".equals(scheme) || "javascript".equals(scheme)) return false;
        try {
            Intent i;
            if ("intent".equals(scheme)) {
                i = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME);
                i.addCategory(Intent.CATEGORY_BROWSABLE);
                i.setComponent(null);
                i.setSelector(null);
            } else {
                i = new Intent(Intent.ACTION_VIEW, u);
            }
            startActivity(i);
        } catch (ActivityNotFoundException | java.net.URISyntaxException e) {
            Log.w(TAG, "no app for " + u); // בטלפון כשר אולי אין דפדפן — פשוט לא נפתח
        } catch (Throwable t) {
            Log.w(TAG, "open outside", t);
        }
        return true;
    }

    static boolean isSite(Uri u) {
        String h = u.getHost();
        return h != null && (h.equalsIgnoreCase(HOST) || h.equalsIgnoreCase("www." + HOST));
    }

    /** הנתיב בתוך assets/site/ ("/" → index.html), או null אם זו לא בקשה לאתר. */
    static String assetPath(Uri u) {
        if (!isSite(u) || !"https".equalsIgnoreCase(u.getScheme())) return null;
        String p = u.getPath();
        if (p == null || p.isEmpty() || p.endsWith("/")) p = (p == null ? "" : p) + "index.html";
        if (p.startsWith("/")) p = p.substring(1);
        if (p.contains("..")) return null;
        return "site/" + p;
    }

    /**
     * תשובה מהנכסים, או null (רשת רגילה). fromServiceWorker — בקשה שה-SW של האתר שולח לרשת:
     * בלי HTML, ורק קובץ בלי ?v= או עם אותה גרסה כמו בנכסים.
     */
    static WebResourceResponse fromAssets(Context c, WebResourceRequest request, boolean fromServiceWorker) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) return null;
        Uri u = request.getUrl();
        String path = assetPath(u);
        if (path == null) return null;
        String mime = mime(path);
        if (fromServiceWorker) {
            if (mime.startsWith("text/html")) return null;
            String v = u.getQueryParameter("v");
            if (v != null && !versions(c).contains(path.substring(5) + "?v=" + v)) return null;
        }
        try {
            InputStream in = c.getAssets().open(path);
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "no-cache");
            h.put("Access-Control-Allow-Origin", "*");
            boolean text = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") || mime.contains("manifest") || mime.contains("svg");
            return new WebResourceResponse(mime, text ? "utf-8" : null, 200, "OK", h, in);
        } catch (IOException e) {
            return null; // אין כזה קובץ בנכסים
        }
    }

    /** "path?v=N" לכל קובץ שהאתר הארוז מפנה אליו עם גרסה (נכתב ב-copySiteAssets). */
    private static synchronized Set<String> versions(Context c) {
        if (bundledVersions != null) return bundledVersions;
        Set<String> s = new HashSet<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getAssets().open("site/versions.txt"), StandardCharsets.UTF_8))) {
            String line;
            while ((line = r.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty()) s.add(line);
            }
        } catch (IOException e) {
            Log.w(TAG, "no versions.txt");
        }
        bundledVersions = s;
        return s;
    }

    private static String mime(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".ttf")) return "font/ttf";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    private static boolean swClientInstalled;

    /* בקשות שה-Service Worker של האתר שולח לרשת לא עוברות ב-WebViewClient — רק כאן.
       ServiceWorkerController של הפלטפורמה (API 24 = minSdk) — בלי תלות ב-androidx.webkit. */
    private static void installServiceWorkerClient(Context app) {
        if (swClientInstalled) return;
        swClientInstalled = true;
        try {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    if (online) return null;
                    return fromAssets(app, request, true);
                }
            });
        } catch (Throwable t) {
            Log.w(TAG, "service worker client", t);
        }
    }

    private void watchNetwork() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            netCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onCapabilitiesChanged(Network network, NetworkCapabilities nc) {
                    if (!nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) { online = false; return; }
                    if (nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) { online = true; return; }
                    // רשת מסוננת — VALIDATED לא יידלק; האתר ענה לאחרונה או עונה עכשיו = יש חיבור
                    online = LauncherActivity.hasInternet(KosherWebActivity.this);
                    if (!online) LauncherActivity.probeSiteAsync(() -> online = true);
                }

                @Override
                public void onLost(Network network) {
                    online = false;
                }
            };
            cm.registerDefaultNetworkCallback(netCallback);
        } catch (Throwable t) {
            Log.w(TAG, "network callback", t);
        }
    }

    @Override
    public void onBackPressed() {
        goBackOrFinish();
    }

    /** חלונות האתר נסגרים ב-history.back() (pushState בפתיחה) — כמו כפתור החזרה בכרום. */
    private void goBackOrFinish() {
        if (web != null && web.canGoBack()) web.goBack();
        else finish();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (netCallback != null) {
            try {
                ((ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE)).unregisterNetworkCallback(netCallback);
            } catch (Throwable ignored) {
            }
        }
        if (web != null) {
            root.removeView(web);
            web.destroy();
        }
        super.onDestroy();
    }
}
