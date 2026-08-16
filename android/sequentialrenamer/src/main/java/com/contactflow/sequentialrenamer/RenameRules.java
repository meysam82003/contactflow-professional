package com.contactflow.sequentialrenamer;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class RenameRules {
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern NUMBER_TOKEN = Pattern.compile("\\{n:(0+)\\}", Pattern.CASE_INSENSITIVE);
    private static final Pattern INVALID = Pattern.compile("[\\u0000-\\u001f<>:\"/\\\\|?*]");

    private RenameRules() { }

    static String cleanName(String value) {
        String cleaned = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFC).trim();
        cleaned = INVALID.matcher(cleaned).replaceAll("_");
        cleaned = WHITESPACE.matcher(cleaned).replaceAll(" ").trim();
        while (cleaned.endsWith(".") || cleaned.endsWith(" ")) cleaned = cleaned.substring(0, cleaned.length() - 1);
        return cleaned;
    }

    static String destinationName(String currentName, String typedName, boolean preserveExtension) {
        String cleaned = cleanName(typedName);
        if (cleaned.isEmpty()) throw new IllegalArgumentException("نام جدید نمی‌تواند خالی باشد.");
        if (!preserveExtension) return cleaned;
        String extension = extensionOf(currentName);
        if (extension.isEmpty()) return cleaned;
        if (cleaned.toLowerCase(Locale.ROOT).endsWith(extension.toLowerCase(Locale.ROOT))) {
            cleaned = cleanName(cleaned.substring(0, cleaned.length() - extension.length()));
        }
        if (cleaned.isEmpty()) throw new IllegalArgumentException("نام فایل بدون پسوند نمی‌تواند خالی باشد.");
        return cleaned + extension;
    }

    static String baseName(String name) {
        String extension = extensionOf(name);
        return extension.isEmpty() ? name : name.substring(0, name.length() - extension.length());
    }

    static String extensionOf(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        return dot > 0 && dot < name.length() - 1 ? name.substring(dot) : "";
    }

    static String applySequenceTemplate(String template, int number) {
        String value = template == null || template.trim().isEmpty() ? "فایل {n:000}" : template.trim();
        Matcher matcher = NUMBER_TOKEN.matcher(value);
        StringBuffer output = new StringBuffer();
        while (matcher.find()) {
            String replacement = String.format(Locale.ROOT, "%0" + matcher.group(1).length() + "d", number);
            matcher.appendReplacement(output, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(output);
        value = output.toString().replaceAll("(?i)\\{n\\}", Integer.toString(number));
        return cleanName(value);
    }

    static int naturalCompare(String left, String right) {
        int a = 0, b = 0;
        while (a < left.length() && b < right.length()) {
            char ca = left.charAt(a), cb = right.charAt(b);
            if (Character.isDigit(ca) && Character.isDigit(cb)) {
                int a0 = a, b0 = b;
                while (a < left.length() && Character.isDigit(left.charAt(a))) a++;
                while (b < right.length() && Character.isDigit(right.charAt(b))) b++;
                String an = left.substring(a0, a).replaceFirst("^0+(?!$)", "");
                String bn = right.substring(b0, b).replaceFirst("^0+(?!$)", "");
                if (an.length() != bn.length()) return Integer.compare(an.length(), bn.length());
                int numeric = an.compareTo(bn);
                if (numeric != 0) return numeric;
                continue;
            }
            int compared = Character.compare(Character.toLowerCase(ca), Character.toLowerCase(cb));
            if (compared != 0) return compared;
            a++;
            b++;
        }
        return Integer.compare(left.length(), right.length());
    }
}
