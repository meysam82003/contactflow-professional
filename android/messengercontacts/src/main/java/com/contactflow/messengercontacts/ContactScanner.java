package com.contactflow.messengercontacts;

import android.content.ContentResolver;
import android.database.Cursor;
import android.provider.ContactsContract;

import java.text.Collator;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

final class ContactScanner {
    static List<ContactRecord> scan(ContentResolver resolver) {
        LinkedHashMap<Long, ContactRecord> records = new LinkedHashMap<>();
        readPhones(resolver, records);
        Map<Long, String> rawAccounts = readRawAccounts(resolver, records);
        readMessengerData(resolver, records, rawAccounts);
        ArrayList<ContactRecord> result = new ArrayList<>();
        for (ContactRecord record : records.values()) if (!record.phones.isEmpty()) result.add(record);
        Collator collator = Collator.getInstance(new Locale("fa", "IR"));
        Collections.sort(result, (left, right) -> collator.compare(left.displayName(), right.displayName()));
        return result;
    }

    private static void readPhones(ContentResolver resolver, Map<Long, ContactRecord> records) {
        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER
        };
        try (Cursor cursor = resolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, projection, null, null, null)) {
            if (cursor == null) return;
            int idColumn = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
            int nameColumn = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME_PRIMARY);
            int numberColumn = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER);
            int normalizedColumn = cursor.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER);
            while (cursor.moveToNext()) {
                long id = cursor.getLong(idColumn);
                String name = cursor.getString(nameColumn);
                ContactRecord record = records.get(id);
                if (record == null) { record = new ContactRecord(id, name); records.put(id, record); }
                else if (record.name.isEmpty() && name != null) record.name = name.trim();
                String normalized = cursor.getString(normalizedColumn);
                String phone = normalizePhone(normalized == null || normalized.trim().isEmpty() ? cursor.getString(numberColumn) : normalized);
                if (!phone.isEmpty()) record.phones.add(phone);
            }
        }
    }

    private static Map<Long, String> readRawAccounts(ContentResolver resolver, Map<Long, ContactRecord> records) {
        HashMap<Long, String> accountByRawId = new HashMap<>();
        String[] projection = { ContactsContract.RawContacts._ID, ContactsContract.RawContacts.CONTACT_ID, ContactsContract.RawContacts.ACCOUNT_TYPE };
        String selection = ContactsContract.RawContacts.DELETED + "=0";
        try (Cursor cursor = resolver.query(ContactsContract.RawContacts.CONTENT_URI, projection, selection, null, null)) {
            if (cursor == null) return accountByRawId;
            int rawColumn = cursor.getColumnIndexOrThrow(ContactsContract.RawContacts._ID);
            int contactColumn = cursor.getColumnIndexOrThrow(ContactsContract.RawContacts.CONTACT_ID);
            int accountColumn = cursor.getColumnIndexOrThrow(ContactsContract.RawContacts.ACCOUNT_TYPE);
            while (cursor.moveToNext()) {
                long rawId = cursor.getLong(rawColumn), contactId = cursor.getLong(contactColumn);
                String account = cursor.getString(accountColumn);
                accountByRawId.put(rawId, account == null ? "" : account);
                ContactRecord record = records.get(contactId);
                String appId = MessengerCatalog.detect(account);
                if (record != null && appId != null) { record.appIds.add(appId); record.evidence.add("account:" + account); }
            }
        }
        return accountByRawId;
    }

    private static void readMessengerData(ContentResolver resolver, Map<Long, ContactRecord> records, Map<Long, String> rawAccounts) {
        String[] projection = {
            ContactsContract.Data.CONTACT_ID,
            ContactsContract.Data.RAW_CONTACT_ID,
            ContactsContract.Data.MIMETYPE,
            ContactsContract.Data.DATA1,
            ContactsContract.Data.DATA2,
            ContactsContract.Data.DATA3
        };
        try (Cursor cursor = resolver.query(ContactsContract.Data.CONTENT_URI, projection, null, null, null)) {
            if (cursor == null) return;
            int contactColumn = cursor.getColumnIndexOrThrow(ContactsContract.Data.CONTACT_ID);
            int rawColumn = cursor.getColumnIndexOrThrow(ContactsContract.Data.RAW_CONTACT_ID);
            int mimeColumn = cursor.getColumnIndexOrThrow(ContactsContract.Data.MIMETYPE);
            int data1Column = cursor.getColumnIndexOrThrow(ContactsContract.Data.DATA1);
            int data2Column = cursor.getColumnIndexOrThrow(ContactsContract.Data.DATA2);
            int data3Column = cursor.getColumnIndexOrThrow(ContactsContract.Data.DATA3);
            while (cursor.moveToNext()) {
                long contactId = cursor.getLong(contactColumn), rawId = cursor.getLong(rawColumn);
                ContactRecord record = records.get(contactId);
                if (record == null) continue;
                String mime = cursor.getString(mimeColumn), account = rawAccounts.get(rawId), data1 = cursor.getString(data1Column), data2 = cursor.getString(data2Column), data3 = cursor.getString(data3Column);
                String appId = MessengerCatalog.detect(account, mime, data1, data2, data3);
                if (appId != null) {
                    record.appIds.add(appId);
                    if (mime != null) record.evidence.add("mime:" + mime);
                    if (account != null && !account.isEmpty()) record.evidence.add("account:" + account);
                }
            }
        }
    }

    static String normalizePhone(String value) {
        String input = foldDigits(value == null ? "" : value).trim();
        if (input.isEmpty()) return "";
        boolean plus = input.startsWith("+");
        String digits = input.replaceAll("\\D", "");
        if (digits.startsWith("0098")) return "+98" + digits.substring(4);
        if (digits.startsWith("98") && digits.length() >= 12) return "+" + digits;
        if (digits.startsWith("09") && digits.length() == 11) return "+98" + digits.substring(1);
        if (plus && digits.length() >= 8) return "+" + digits;
        return digits;
    }

    static String foldDigits(String value) {
        return value
            .replace('۰', '0').replace('۱', '1').replace('۲', '2').replace('۳', '3').replace('۴', '4')
            .replace('۵', '5').replace('۶', '6').replace('۷', '7').replace('۸', '8').replace('۹', '9')
            .replace('٠', '0').replace('١', '1').replace('٢', '2').replace('٣', '3').replace('٤', '4')
            .replace('٥', '5').replace('٦', '6').replace('٧', '7').replace('٨', '8').replace('٩', '9');
    }

    private ContactScanner() { }
}
