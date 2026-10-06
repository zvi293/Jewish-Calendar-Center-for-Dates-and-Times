# גשר הווידג'טים (LauncherActivity.twaSession) — השדה הפרטי של ה-TWA נקרא ברפלקציה
-keepclassmembers class com.google.androidbrowserhelper.trusted.TwaLauncher {
    androidx.browser.customtabs.CustomTabsSession mSession;
}
# הספקים, מסך ההגדרות והמקלט — שמות מהמניפסט
-keep class il.co.jewishcalendar.twa.widget.** { *; }
