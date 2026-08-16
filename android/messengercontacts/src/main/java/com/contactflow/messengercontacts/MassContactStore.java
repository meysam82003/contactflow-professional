package com.contactflow.messengercontacts;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.DatabaseUtils;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteStatement;
import android.provider.ContactsContract;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

/** Disk-backed contact vault and durable import checkpoints. */
final class MassContactStore extends SQLiteOpenHelper {
    static final String STATE_QUEUED = "QUEUED";
    static final String STATE_RUNNING = "RUNNING";
    static final String STATE_PAUSED = "PAUSED";
    static final String STATE_COMPLETED = "COMPLETED";
    static final String STATE_LIMIT = "LIMIT_REACHED";
    static final String STATE_FAILED = "FAILED";

    private static final String DATABASE_NAME = "contactflow_mass_contacts.db";
    private static final int DATABASE_VERSION = 1;
    private final Context context;

    MassContactStore(Context context) {
        super(context.getApplicationContext(), DATABASE_NAME, null, DATABASE_VERSION);
        this.context = context.getApplicationContext();
        setWriteAheadLoggingEnabled(true);
    }

    @Override public void onConfigure(SQLiteDatabase db) {
        super.onConfigure(db);
        db.setForeignKeyConstraintsEnabled(true);
        db.rawQuery("PRAGMA synchronous=NORMAL", null).close();
    }

    @Override public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE import_jobs (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "source_uri TEXT NOT NULL,display_name TEXT NOT NULL,source_size INTEGER NOT NULL DEFAULT -1," +
            "target_system INTEGER NOT NULL DEFAULT 0,state TEXT NOT NULL,message TEXT NOT NULL DEFAULT ''," +
            "cards_seen INTEGER NOT NULL DEFAULT 0,accepted_cards INTEGER NOT NULL DEFAULT 0,invalid_cards INTEGER NOT NULL DEFAULT 0," +
            "phones_seen INTEGER NOT NULL DEFAULT 0,invalid_phones INTEGER NOT NULL DEFAULT 0,duplicate_phones INTEGER NOT NULL DEFAULT 0," +
            "vault_inserted INTEGER NOT NULL DEFAULT 0,system_inserted INTEGER NOT NULL DEFAULT 0," +
            "system_existing INTEGER NOT NULL DEFAULT 0,system_failed INTEGER NOT NULL DEFAULT 0," +
            "checkpoint_card INTEGER NOT NULL DEFAULT 0,bytes_read INTEGER NOT NULL DEFAULT 0," +
            "created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)");
        db.execSQL("CREATE INDEX import_jobs_state_idx ON import_jobs(state,updated_at)");
        db.execSQL("CREATE TABLE vault_contacts (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT,normalized_phone TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL," +
            "emails TEXT NOT NULL DEFAULT '',organization TEXT NOT NULL DEFAULT '',note TEXT NOT NULL DEFAULT ''," +
            "source_job_id INTEGER NOT NULL,source_card_index INTEGER NOT NULL,system_state INTEGER NOT NULL DEFAULT 0," +
            "created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL," +
            "FOREIGN KEY(source_job_id) REFERENCES import_jobs(id) ON DELETE RESTRICT)");
        db.execSQL("CREATE INDEX vault_contacts_name_idx ON vault_contacts(display_name)");
        db.execSQL("CREATE INDEX vault_contacts_source_idx ON vault_contacts(source_job_id,source_card_index)");
        db.execSQL("CREATE INDEX vault_contacts_system_idx ON vault_contacts(system_state)");
        db.execSQL("CREATE TABLE device_phone_index (normalized_phone TEXT PRIMARY KEY)");
    }

    @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) { }

    long createJob(String uri, String displayName, long sourceSize, boolean targetSystem) {
        long now = System.currentTimeMillis();
        ContentValues values = new ContentValues();
        values.put("source_uri", uri);
        values.put("display_name", VCardContact.cleanText(displayName));
        values.put("source_size", sourceSize);
        values.put("target_system", targetSystem ? 1 : 0);
        values.put("state", STATE_QUEUED);
        values.put("created_at", now);
        values.put("updated_at", now);
        return getWritableDatabase().insertOrThrow("import_jobs", null, values);
    }

    JobSnapshot readJob(long id) {
        try (Cursor cursor = getReadableDatabase().query("import_jobs", null, "id=?", new String[]{Long.toString(id)}, null, null, null, "1")) {
            return cursor.moveToFirst() ? JobSnapshot.from(cursor) : null;
        }
    }

    JobSnapshot latestJob() {
        try (Cursor cursor = getReadableDatabase().query("import_jobs", null, null, null, null, null, "id DESC", "1")) {
            return cursor.moveToFirst() ? JobSnapshot.from(cursor) : null;
        }
    }

    long vaultCount() { return DatabaseUtils.queryNumEntries(getReadableDatabase(), "vault_contacts"); }

    long databaseBytes() {
        File database = context.getDatabasePath(DATABASE_NAME);
        File wal = new File(database.getPath() + "-wal");
        return (database.exists() ? database.length() : 0L) + (wal.exists() ? wal.length() : 0L);
    }

    void saveProgress(JobUpdate update) {
        ContentValues values = new ContentValues();
        values.put("state", update.state);
        values.put("message", VCardContact.cleanText(update.message));
        values.put("cards_seen", update.cardsSeen);
        values.put("accepted_cards", update.acceptedCards);
        values.put("invalid_cards", update.invalidCards);
        values.put("phones_seen", update.phonesSeen);
        values.put("invalid_phones", update.invalidPhones);
        values.put("duplicate_phones", update.duplicatePhones);
        values.put("vault_inserted", update.vaultInserted);
        values.put("system_inserted", update.systemInserted);
        values.put("system_existing", update.systemExisting);
        values.put("system_failed", update.systemFailed);
        values.put("checkpoint_card", update.checkpointCard);
        values.put("bytes_read", update.bytesRead);
        values.put("updated_at", System.currentTimeMillis());
        getWritableDatabase().update("import_jobs", values, "id=?", new String[]{Long.toString(update.id)});
    }

    void setState(long id, String state, String message) {
        ContentValues values = new ContentValues();
        values.put("state", state);
        values.put("message", VCardContact.cleanText(message));
        values.put("updated_at", System.currentTimeMillis());
        getWritableDatabase().update("import_jobs", values, "id=?", new String[]{Long.toString(id)});
    }

    SQLiteDatabase writableDatabase() { return getWritableDatabase(); }

    CardStoreResult storeCard(SQLiteDatabase db, long jobId, long cardIndex, VCardContact card, boolean targetSystem) {
        CardStoreResult result = new CardStoreResult();
        long now = System.currentTimeMillis();
        for (String phone : card.phones) {
            ContentValues values = new ContentValues();
            values.put("normalized_phone", phone);
            values.put("display_name", card.displayName());
            values.put("emails", card.joinedEmails());
            values.put("organization", card.organization);
            values.put("note", card.note);
            values.put("source_job_id", jobId);
            values.put("source_card_index", cardIndex);
            values.put("system_state", targetSystem ? 1 : 0);
            values.put("created_at", now);
            values.put("updated_at", now);
            long inserted = db.insertWithOnConflict("vault_contacts", null, values, SQLiteDatabase.CONFLICT_IGNORE);
            long sourceJob = jobId, sourceCard = cardIndex;
            int systemState = targetSystem ? 1 : 0;
            if (inserted < 0) {
                try (Cursor cursor = db.query("vault_contacts", new String[]{"source_job_id", "source_card_index", "system_state", "display_name"}, "normalized_phone=?", new String[]{phone}, null, null, null, "1")) {
                    if (cursor.moveToFirst()) {
                        sourceJob = cursor.getLong(0);
                        sourceCard = cursor.getLong(1);
                        systemState = cursor.getInt(2);
                        String oldName = cursor.getString(3);
                        if (targetSystem && systemState == 0) {
                            ContentValues pending = new ContentValues();
                            pending.put("system_state", 1);
                            pending.put("updated_at", now);
                            db.update("vault_contacts", pending, "normalized_phone=?", new String[]{phone});
                            systemState = 1;
                        }
                        if ((oldName == null || oldName.isEmpty() || oldName.equals(phone)) && !card.displayName().equals(phone)) {
                            ContentValues better = new ContentValues();
                            better.put("display_name", card.displayName());
                            better.put("updated_at", now);
                            db.update("vault_contacts", better, "normalized_phone=?", new String[]{phone});
                        }
                    }
                }
                if (sourceJob == jobId && sourceCard == cardIndex) result.newPhones++; else result.duplicatePhones++;
            } else result.newPhones++;

            if (!targetSystem) continue;
            if (systemState == 2) {
                if (sourceJob == jobId && sourceCard == cardIndex) result.recoveredSystemPhones++;
                else result.alreadySystemPhones++;
            } else if (systemState == 3) result.existingDevicePhones++;
            else if (deviceHasPhone(db, phone)) {
                markPhoneState(db, phone, 3);
                result.existingDevicePhones++;
            } else result.pendingSystemPhones.add(phone);
        }
        return result;
    }

    void markPhoneState(SQLiteDatabase db, String phone, int state) {
        ContentValues values = new ContentValues();
        values.put("system_state", state);
        values.put("updated_at", System.currentTimeMillis());
        db.update("vault_contacts", values, "normalized_phone=?", new String[]{phone});
    }

    void addDevicePhones(SQLiteDatabase db, List<String> phones) {
        SQLiteStatement insert = db.compileStatement("INSERT OR IGNORE INTO device_phone_index(normalized_phone) VALUES(?)");
        for (String phone : phones) {
            insert.clearBindings();
            insert.bindString(1, phone);
            insert.executeInsert();
        }
        insert.close();
    }

    long rebuildDevicePhoneIndex(ContentResolver resolver) {
        SQLiteDatabase db = getWritableDatabase();
        db.beginTransaction();
        try {
            db.delete("device_phone_index", null, null);
            SQLiteStatement insert = db.compileStatement("INSERT OR IGNORE INTO device_phone_index(normalized_phone) VALUES(?)");
            String[] projection = {ContactsContract.CommonDataKinds.Phone.NUMBER, ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER};
            try (Cursor cursor = resolver.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, projection, null, null, null)) {
                if (cursor != null) while (cursor.moveToNext()) {
                    String normalized = cursor.getString(1);
                    String phone = ContactScanner.normalizePhone(normalized == null || normalized.trim().isEmpty() ? cursor.getString(0) : normalized);
                    if (phone.isEmpty()) continue;
                    insert.clearBindings();
                    insert.bindString(1, phone);
                    insert.executeInsert();
                }
            }
            insert.close();
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
        return DatabaseUtils.queryNumEntries(db, "device_phone_index");
    }

    private boolean deviceHasPhone(SQLiteDatabase db, String phone) {
        return DatabaseUtils.longForQuery(db, "SELECT EXISTS(SELECT 1 FROM device_phone_index WHERE normalized_phone=?)", new String[]{phone}) == 1L;
    }

    static final class CardStoreResult {
        long newPhones;
        long duplicatePhones;
        long existingDevicePhones;
        long alreadySystemPhones;
        long recoveredSystemPhones;
        final ArrayList<String> pendingSystemPhones = new ArrayList<>();
    }

    static final class JobUpdate {
        final long id;
        String state;
        String message;
        long cardsSeen;
        long acceptedCards;
        long invalidCards;
        long phonesSeen;
        long invalidPhones;
        long duplicatePhones;
        long vaultInserted;
        long systemInserted;
        long systemExisting;
        long systemFailed;
        long checkpointCard;
        long bytesRead;

        JobUpdate(JobSnapshot job) {
            id = job.id;
            state = job.state;
            message = job.message;
            cardsSeen = job.cardsSeen;
            acceptedCards = job.acceptedCards;
            invalidCards = job.invalidCards;
            phonesSeen = job.phonesSeen;
            invalidPhones = job.invalidPhones;
            duplicatePhones = job.duplicatePhones;
            vaultInserted = job.vaultInserted;
            systemInserted = job.systemInserted;
            systemExisting = job.systemExisting;
            systemFailed = job.systemFailed;
            checkpointCard = job.checkpointCard;
            bytesRead = job.bytesRead;
        }
    }

    static final class JobSnapshot {
        final long id;
        final String sourceUri;
        final String displayName;
        final long sourceSize;
        final boolean targetSystem;
        final String state;
        final String message;
        final long cardsSeen;
        final long acceptedCards;
        final long invalidCards;
        final long phonesSeen;
        final long invalidPhones;
        final long duplicatePhones;
        final long vaultInserted;
        final long systemInserted;
        final long systemExisting;
        final long systemFailed;
        final long checkpointCard;
        final long bytesRead;
        final long updatedAt;

        private JobSnapshot(Cursor cursor) {
            id = value(cursor, "id");
            sourceUri = text(cursor, "source_uri");
            displayName = text(cursor, "display_name");
            sourceSize = value(cursor, "source_size");
            targetSystem = value(cursor, "target_system") == 1L;
            state = text(cursor, "state");
            message = text(cursor, "message");
            cardsSeen = value(cursor, "cards_seen");
            acceptedCards = value(cursor, "accepted_cards");
            invalidCards = value(cursor, "invalid_cards");
            phonesSeen = value(cursor, "phones_seen");
            invalidPhones = value(cursor, "invalid_phones");
            duplicatePhones = value(cursor, "duplicate_phones");
            vaultInserted = value(cursor, "vault_inserted");
            systemInserted = value(cursor, "system_inserted");
            systemExisting = value(cursor, "system_existing");
            systemFailed = value(cursor, "system_failed");
            checkpointCard = value(cursor, "checkpoint_card");
            bytesRead = value(cursor, "bytes_read");
            updatedAt = value(cursor, "updated_at");
        }

        static JobSnapshot from(Cursor cursor) { return new JobSnapshot(cursor); }
        boolean canResume() { return STATE_PAUSED.equals(state) || STATE_FAILED.equals(state) || STATE_RUNNING.equals(state) || STATE_QUEUED.equals(state); }
        private static long value(Cursor cursor, String column) { return cursor.getLong(cursor.getColumnIndexOrThrow(column)); }
        private static String text(Cursor cursor, String column) { String value = cursor.getString(cursor.getColumnIndexOrThrow(column)); return value == null ? "" : value; }
    }
}
