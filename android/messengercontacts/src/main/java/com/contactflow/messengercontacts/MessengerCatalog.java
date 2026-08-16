package com.contactflow.messengercontacts;

import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.os.Build;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class MessengerCatalog {
    static final class Messenger {
        final String id;
        final String label;
        final List<String> needles;
        final List<String> packages;

        Messenger(String id, String label, String[] needles, String[] packages) {
            this.id = id;
            this.label = label;
            this.needles = Arrays.asList(needles);
            this.packages = Arrays.asList(packages);
        }
    }

    private static Messenger messenger(String id, String label, String[] needles, String... packages) {
        return new Messenger(id, label, needles, packages);
    }

    static final List<Messenger> ALL = Collections.unmodifiableList(Arrays.asList(
        messenger("telegram", "تلگرام", new String[]{"telegram", "org.thunderdog.challegram"}, "org.telegram.messenger", "org.telegram.messenger.beta", "org.thunderdog.challegram"),
        messenger("whatsapp", "واتساپ", new String[]{"whatsapp"}, "com.whatsapp", "com.whatsapp.w4b"),
        messenger("rubika", "روبیکا", new String[]{"rubika", "resaneh1", "rbmain"}, "ir.resaneh1.iptv", "app.rbmain.a"),
        messenger("eitaa", "ایتا", new String[]{"eitaa"}, "ir.eitaa.messenger"),
        messenger("bale", "بله", new String[]{"bale", "ir.nasim"}, "ir.nasim"),
        messenger("soroush", "سروش پلاس", new String[]{"soroush", "mmdt.ott"}, "mobi.mmdt.ottplus", "mobi.mmdt.ott"),
        messenger("gap", "گپ", new String[]{"gapafzar", "gap.im", "com.gap"}, "com.gapafzar.messenger"),
        messenger("igap", "آی‌گپ", new String[]{"igap"}, "ir.igap"),
        messenger("shad", "شاد", new String[]{"medu.shad", "shad"}, "ir.medu.shad"),
        messenger("signal", "Signal", new String[]{"thoughtcrime", "signal"}, "org.thoughtcrime.securesms"),
        messenger("viber", "Viber", new String[]{"viber"}, "com.viber.voip"),
        messenger("imo", "imo", new String[]{"imoim", "com.imo"}, "com.imo.android.imoim"),
        messenger("skype", "Skype", new String[]{"skype"}, "com.skype.raider"),
        messenger("line", "LINE", new String[]{"naver.line", "line.android"}, "jp.naver.line.android"),
        messenger("messenger", "Messenger", new String[]{"facebook.orca", "messenger"}, "com.facebook.orca")
    ));

    private static final Map<String, Messenger> BY_ID = new LinkedHashMap<>();
    static { for (Messenger item : ALL) BY_ID.put(item.id, item); }

    static String detect(String... signals) {
        StringBuilder joined = new StringBuilder();
        for (String signal : signals) if (signal != null) joined.append(' ').append(signal.toLowerCase(Locale.ROOT));
        String haystack = joined.toString();
        for (Messenger item : ALL) for (String needle : item.needles) if (haystack.contains(needle)) return item.id;
        if (isCustomContactAction(haystack)) return "other";
        return null;
    }

    static boolean isCustomContactAction(String signal) {
        if (signal == null || !signal.contains("vnd.android.cursor.item/vnd.")) return false;
        return signal.contains("profile") || signal.contains("message") || signal.contains("chat") || signal.contains("call") || signal.contains("video");
    }

    static String label(String id) {
        if ("other".equals(id)) return "سایر اکشن‌های مخاطب";
        Messenger item = BY_ID.get(id);
        return item == null ? id : item.label;
    }

    static List<String> installedPackages(PackageManager manager, String id) {
        Messenger item = BY_ID.get(id);
        if (item == null) return Collections.emptyList();
        ArrayList<String> installed = new ArrayList<>();
        for (String packageName : item.packages) if (isInstalled(manager, packageName)) installed.add(packageName);
        return installed;
    }

    static boolean isInstalled(PackageManager manager, String packageName) {
        try {
            if (Build.VERSION.SDK_INT >= 33) manager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0));
            else manager.getPackageInfo(packageName, 0);
            return true;
        } catch (PackageManager.NameNotFoundException ignored) { return false; }
    }

    static Drawable icon(PackageManager manager, String id) {
        for (String packageName : installedPackages(manager, id)) {
            try { return manager.getApplicationIcon(packageName); }
            catch (PackageManager.NameNotFoundException ignored) { }
        }
        return null;
    }

    private MessengerCatalog() { }
}
