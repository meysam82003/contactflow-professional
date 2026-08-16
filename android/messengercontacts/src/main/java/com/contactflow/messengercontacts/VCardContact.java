package com.contactflow.messengercontacts;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** One bounded in-memory vCard. Large files are never represented as a list of these objects. */
final class VCardContact {
    private static final int MAX_TEXT = 16_384;
    private static final int MAX_PHONE_VALUES = 64;
    private static final int MAX_EMAIL_VALUES = 32;

    String formattedName = "";
    String familyName = "";
    String givenName = "";
    String additionalName = "";
    String prefix = "";
    String suffix = "";
    String organization = "";
    String note = "";
    final Set<String> phones = new LinkedHashSet<>();
    final Set<String> emails = new LinkedHashSet<>();
    int rawPhoneCount;
    int invalidPhoneCount;
    int duplicatePhoneCount;
    boolean truncated;

    void addPhone(String rawValue) {
        rawPhoneCount++;
        if (phones.size() >= MAX_PHONE_VALUES) {
            invalidPhoneCount++;
            truncated = true;
            return;
        }
        String normalized = ContactScanner.normalizePhone(rawValue);
        if (!isValidPhone(normalized)) {
            invalidPhoneCount++;
            return;
        }
        if (!phones.add(normalized)) duplicatePhoneCount++;
    }

    void addEmail(String value) {
        String clean = cleanText(value).toLowerCase(Locale.ROOT);
        if (clean.length() > 254 || clean.indexOf('@') <= 0 || clean.endsWith("@")) return;
        if (emails.size() < MAX_EMAIL_VALUES) emails.add(clean); else truncated = true;
    }

    String displayName() {
        String formatted = cleanText(formattedName);
        String structured = joinName(prefix, givenName, additionalName, familyName, suffix);
        // Some exporters concatenate FN while keeping the N fields separate. Prefer the spaced form.
        if (!structured.isEmpty() && (!formatted.contains(" ") && wordCount(structured) > 1)) return structured;
        if (!formatted.isEmpty()) return formatted;
        if (!structured.isEmpty()) return structured;
        if (!phones.isEmpty()) return phones.iterator().next();
        return "مخاطب بدون نام";
    }

    List<String> phoneList() { return new ArrayList<>(phones); }

    String joinedEmails() { return String.join("\u001F", emails); }

    static String cleanText(String value) {
        if (value == null) return "";
        String clean = value.replace('\u0000', ' ').replace('\r', ' ').replace('\n', ' ').trim().replaceAll("\\s+", " ");
        return clean.length() <= MAX_TEXT ? clean : clean.substring(0, MAX_TEXT).trim();
    }

    private static String joinName(String... values) {
        StringBuilder result = new StringBuilder();
        for (String value : values) {
            String clean = cleanText(value);
            if (clean.isEmpty()) continue;
            if (result.length() > 0) result.append(' ');
            result.append(clean);
        }
        return result.toString();
    }

    private static int wordCount(String value) {
        String clean = cleanText(value);
        return clean.isEmpty() ? 0 : clean.split(" ").length;
    }

    private static boolean isValidPhone(String normalized) {
        if (normalized == null || normalized.isEmpty()) return false;
        String digits = normalized.replaceAll("\\D", "");
        if (digits.length() < 7 || digits.length() > 15) return false;
        return !normalized.startsWith("+98") || digits.length() == 12;
    }
}
