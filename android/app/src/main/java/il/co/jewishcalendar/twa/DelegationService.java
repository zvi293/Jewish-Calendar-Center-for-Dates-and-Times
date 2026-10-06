package il.co.jewishcalendar.twa;

import com.google.androidbrowserhelper.playbilling.digitalgoods.DigitalGoodsRequestHandler;

public class DelegationService extends
        com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();

        // תרומה באפליקציה: Digital Goods API של הדף (getDetails/listPurchases/consume) עובר דרך כאן ל-Google Play Billing
        registerExtraCommandHandler(new DigitalGoodsRequestHandler(getApplicationContext()));
    }
}
