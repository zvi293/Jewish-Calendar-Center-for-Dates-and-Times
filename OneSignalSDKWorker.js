// ── worker משותף: התראות OneSignal + מנגנון האופליין של האתר (10/2026) ──
// הדשבורד של OneSignal מוגדר "Typical Site", ובמצב הזה ה-SDK רושם את הקובץ הזה תמיד על
// ההיקף "/" ומתעלם מ-serviceWorkerParam שבקוד — כלומר הוא מחליף את sw.js אצל כל מי
// שהפעיל התראות. עד 10/2026 הקובץ הכיל רק את OneSignal, ולכן מי שהפעיל התראות (למשל
// באפליקציה) קיבל "אין חיבור" בפתיחה בלי אינטרנט: ה-worker הפעיל לא טיפל בבקשות בכלל
// (נמצא בטלפון: controller = הקובץ הזה, workerStart = 0).
// עכשיו הוא טוען גם את sw.js — אותו מטמון ואותה לוגיקת רשת — ו-index.html לא רושם את sw.js
// מעליו. שינוי ב-sw.js מגיע גם לכאן: בדיקת העדכון של הדפדפן משווה גם קבצים מיובאים.
self.__jcOneSignal = true; // sw.js משאיר ל-OneSignal את הלחיצה על התראה
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts("/sw.js");
