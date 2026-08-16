package com.contactflow.messengercontacts;

import android.util.Base64;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Streaming vCard 2.1/3.0/4.0 reader with bounded per-line and per-card memory. */
final class VCardStreamParser {
    static final long MAX_CARDS_PER_FILE = 1_000_000L;
    private static final int MAX_LOGICAL_LINE = 65_536;

    interface CardHandler {
        /** Return false to stop after the current committed checkpoint. */
        boolean onCard(VCardContact card, long cardIndex, long bytesRead) throws Exception;
    }

    static final class ParseSummary {
        long cardsSeen;
        long malformedCards;
        long bytesRead;
        boolean stopped;
        boolean limitExceeded;
    }

    static ParseSummary parse(InputStream source, long skipCards, long fileLimit, CardHandler handler) throws Exception {
        CountingInputStream counting = new CountingInputStream(source);
        ParseSummary summary = new ParseSummary();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(counting, StandardCharsets.UTF_8), 128 * 1024)) {
            VCardContact current = null;
            String logical = null;
            boolean discardOversized = false;
            String physical;
            while ((physical = reader.readLine()) != null) {
                if (logical != null && isQuotedPrintable(logical) && logical.endsWith("=")) {
                    if (!discardOversized) {
                        String continuation = physical.startsWith(" ") || physical.startsWith("\t") ? physical.substring(1) : physical;
                        if (logical.length() + continuation.length() <= MAX_LOGICAL_LINE) logical = logical.substring(0, logical.length() - 1) + continuation;
                        else discardOversized = true;
                    }
                    continue;
                }
                if (physical.startsWith(" ") || physical.startsWith("\t")) {
                    if (logical != null && !discardOversized) {
                        String continuation = physical.substring(1);
                        if (logical.length() + continuation.length() <= MAX_LOGICAL_LINE) logical += continuation;
                        else discardOversized = true;
                    }
                    continue;
                }
                if (logical != null && !discardOversized) {
                    current = consumeLine(logical, current, summary, skipCards, fileLimit, handler, counting.count);
                    if (summary.stopped || summary.limitExceeded) break;
                }
                logical = stripBom(physical);
                discardOversized = logical.length() > MAX_LOGICAL_LINE;
                if (discardOversized) logical = "";
            }
            if (!summary.stopped && !summary.limitExceeded && logical != null && !discardOversized) {
                current = consumeLine(logical, current, summary, skipCards, fileLimit, handler, counting.count);
            }
            if (current != null && !summary.stopped && !summary.limitExceeded) summary.malformedCards++;
        }
        summary.bytesRead = counting.count;
        return summary;
    }

    private static VCardContact consumeLine(String line, VCardContact current, ParseSummary summary, long skipCards, long fileLimit, CardHandler handler, long bytesRead) throws Exception {
        String trimmed = line.trim();
        if ("BEGIN:VCARD".equalsIgnoreCase(trimmed)) {
            if (current != null) summary.malformedCards++;
            return new VCardContact();
        }
        if ("END:VCARD".equalsIgnoreCase(trimmed)) {
            if (current == null) {
                summary.malformedCards++;
                return null;
            }
            summary.cardsSeen++;
            if (summary.cardsSeen > fileLimit) {
                summary.limitExceeded = true;
                return null;
            }
            if (summary.cardsSeen > skipCards && !handler.onCard(current, summary.cardsSeen, bytesRead)) summary.stopped = true;
            return null;
        }
        if (current != null) applyProperty(current, line);
        return current;
    }

    private static void applyProperty(VCardContact card, String line) {
        int colon = line.indexOf(':');
        if (colon <= 0) return;
        String header = line.substring(0, colon);
        String value = line.substring(colon + 1);
        String property = header;
        int semicolon = property.indexOf(';');
        if (semicolon >= 0) property = property.substring(0, semicolon);
        int group = property.lastIndexOf('.');
        if (group >= 0) property = property.substring(group + 1);
        property = property.toUpperCase(Locale.ROOT);
        if (!(property.equals("FN") || property.equals("N") || property.equals("TEL") || property.equals("EMAIL") || property.equals("ORG") || property.equals("NOTE"))) return;
        String decoded = decodeValue(header, value);
        if (property.equals("FN")) card.formattedName = unescape(decoded);
        else if (property.equals("N")) applyStructuredName(card, decoded);
        else if (property.equals("TEL")) card.addPhone(unescape(decoded).replaceFirst("(?i)^tel:", ""));
        else if (property.equals("EMAIL")) card.addEmail(unescape(decoded).replaceFirst("(?i)^mailto:", ""));
        else if (property.equals("ORG")) card.organization = VCardContact.cleanText(joinComponents(decoded));
        else card.note = VCardContact.cleanText(unescape(decoded));
    }

    private static void applyStructuredName(VCardContact card, String value) {
        List<String> parts = splitEscaped(value, ';');
        card.familyName = part(parts, 0);
        card.givenName = part(parts, 1);
        card.additionalName = part(parts, 2);
        card.prefix = part(parts, 3);
        card.suffix = part(parts, 4);
    }

    private static String joinComponents(String value) {
        StringBuilder output = new StringBuilder();
        for (String part : splitEscaped(value, ';')) {
            String clean = VCardContact.cleanText(unescape(part));
            if (clean.isEmpty()) continue;
            if (output.length() > 0) output.append(' ');
            output.append(clean);
        }
        return output.toString();
    }

    private static String part(List<String> values, int index) {
        return index >= values.size() ? "" : VCardContact.cleanText(unescape(values.get(index)));
    }

    private static List<String> splitEscaped(String value, char delimiter) {
        ArrayList<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean escaped = false;
        for (int i = 0; i < value.length(); i++) {
            char item = value.charAt(i);
            if (escaped) {
                current.append('\\').append(item);
                escaped = false;
            } else if (item == '\\') escaped = true;
            else if (item == delimiter) {
                parts.add(current.toString());
                current.setLength(0);
            } else current.append(item);
        }
        if (escaped) current.append('\\');
        parts.add(current.toString());
        return parts;
    }

    private static String decodeValue(String header, String value) {
        String upper = header.toUpperCase(Locale.ROOT);
        try {
            if (upper.contains("ENCODING=QUOTED-PRINTABLE")) {
                String charsetName = parameter(header, "CHARSET");
                Charset charset = charsetName.isEmpty() ? StandardCharsets.UTF_8 : Charset.forName(charsetName);
                return new String(decodeQuotedPrintable(value), charset);
            }
            if (upper.contains("ENCODING=B") || upper.contains("ENCODING=BASE64")) {
                byte[] bytes = Base64.decode(value, Base64.DEFAULT);
                String charsetName = parameter(header, "CHARSET");
                return new String(bytes, charsetName.isEmpty() ? StandardCharsets.UTF_8 : Charset.forName(charsetName));
            }
        } catch (Exception ignored) { }
        return value;
    }

    private static byte[] decodeQuotedPrintable(String value) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(Math.min(value.length(), MAX_LOGICAL_LINE));
        for (int i = 0; i < value.length(); i++) {
            char item = value.charAt(i);
            if (item == '=' && i + 2 < value.length()) {
                int high = Character.digit(value.charAt(i + 1), 16), low = Character.digit(value.charAt(i + 2), 16);
                if (high >= 0 && low >= 0) {
                    bytes.write((high << 4) + low);
                    i += 2;
                    continue;
                }
            }
            byte[] literal = String.valueOf(item).getBytes(StandardCharsets.UTF_8);
            bytes.write(literal);
        }
        return bytes.toByteArray();
    }

    private static String parameter(String header, String name) {
        String prefix = name.toUpperCase(Locale.ROOT) + "=";
        for (String item : header.split(";")) {
            String trimmed = item.trim();
            if (trimmed.toUpperCase(Locale.ROOT).startsWith(prefix)) return trimmed.substring(prefix.length()).replace("\"", "");
        }
        return "";
    }

    private static boolean isQuotedPrintable(String line) {
        int colon = line.indexOf(':');
        return colon > 0 && line.substring(0, colon).toUpperCase(Locale.ROOT).contains("ENCODING=QUOTED-PRINTABLE");
    }

    private static String unescape(String value) {
        StringBuilder output = new StringBuilder(value.length());
        boolean escaped = false;
        for (int i = 0; i < value.length(); i++) {
            char item = value.charAt(i);
            if (!escaped && item == '\\') {
                escaped = true;
                continue;
            }
            if (escaped && (item == 'n' || item == 'N')) output.append(' ');
            else output.append(item);
            escaped = false;
        }
        if (escaped) output.append('\\');
        return VCardContact.cleanText(output.toString());
    }

    private static String stripBom(String value) { return value.startsWith("\uFEFF") ? value.substring(1) : value; }

    private static final class CountingInputStream extends InputStream {
        private final InputStream source;
        long count;
        CountingInputStream(InputStream source) { this.source = source; }
        @Override public int read() throws IOException {
            int value = source.read();
            if (value >= 0) count++;
            return value;
        }
        @Override public int read(byte[] buffer, int offset, int length) throws IOException {
            int read = source.read(buffer, offset, length);
            if (read > 0) count += read;
            return read;
        }
        @Override public void close() throws IOException { source.close(); }
    }

    private VCardStreamParser() { }
}
