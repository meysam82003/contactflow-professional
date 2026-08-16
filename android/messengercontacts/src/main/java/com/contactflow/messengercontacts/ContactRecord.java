package com.contactflow.messengercontacts;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

final class ContactRecord {
    final long contactId;
    String name;
    final Set<String> phones = new LinkedHashSet<>();
    final Set<String> appIds = new LinkedHashSet<>();
    final Set<String> evidence = new LinkedHashSet<>();

    ContactRecord(long contactId, String name) {
        this.contactId = contactId;
        this.name = name == null ? "" : name.trim();
    }

    String displayName() {
        if (!name.isEmpty()) return name;
        return phones.isEmpty() ? "مخاطب بدون نام" : phones.iterator().next();
    }

    String joinedPhones() { return String.join("، ", phones); }

    String joinedApps() {
        LinkedHashSet<String> labels = new LinkedHashSet<>();
        for (String id : appIds) labels.add(MessengerCatalog.label(id));
        return String.join(" • ", labels);
    }

    boolean matchesQuery(String query) {
        if (query == null || query.trim().isEmpty()) return true;
        String needle = ContactScanner.foldDigits(query).toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        String haystack = ContactScanner.foldDigits(displayName() + joinedPhones() + joinedApps()).toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
        return haystack.contains(needle);
    }
}
