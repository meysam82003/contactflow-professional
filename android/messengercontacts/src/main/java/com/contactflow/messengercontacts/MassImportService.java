package com.contactflow.messengercontacts;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentProviderOperation;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.content.OperationApplicationException;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.RemoteException;
import android.provider.ContactsContract;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/** Foreground, resumable and bounded-memory VCF import pipeline. */
public final class MassImportService extends Service {
    static final String ACTION_START = "com.contactflow.messengercontacts.action.START_IMPORT";
    static final String ACTION_PAUSE = "com.contactflow.messengercontacts.action.PAUSE_IMPORT";
    static final String ACTION_PROGRESS = "com.contactflow.messengercontacts.action.IMPORT_PROGRESS";
    static final String EXTRA_JOB_ID = "job_id";
    static final String TOKEN_MIME = "vnd.android.cursor.item/vnd.com.contactflow.import";

    private static final String CHANNEL_ID = "contactflow_mass_import";
    private static final int NOTIFICATION_ID = 3_603_600;
    private static final int SYSTEM_BATCH_CARDS = 80;
    private static final int VAULT_BATCH_CARDS = 1_000;
    private static final int MAX_PROVIDER_OPERATIONS = 350;
    private static final AtomicLong PROCESS_ACTIVE_JOB = new AtomicLong(-1L);

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private volatile boolean pauseRequested;
    private volatile boolean timedOut;
    private volatile boolean destroyed;
    private volatile long activeJobId = -1L;
    private volatile long activeGroupId = -1L;
    private MassContactStore store;

    @Override public void onCreate() {
        super.onCreate();
        store = new MassContactStore(this);
        createNotificationChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? "" : intent.getAction();
        long jobId = intent == null ? -1L : intent.getLongExtra(EXTRA_JOB_ID, -1L);
        if (ACTION_PAUSE.equals(action)) {
            if (jobId < 0 || jobId == activeJobId) {
                pauseRequested = true;
                markPaused("توقف توسط کاربر؛ از همین نقطه قابل ادامه است.");
            } else if (!running.get() && jobId > 0) {
                store.setState(jobId, MassContactStore.STATE_PAUSED, "اجرای قبلی بسته شده بود؛ Checkpoint آمادهٔ ادامه است.");
                sendBroadcast(new Intent(ACTION_PROGRESS).setPackage(getPackageName()).putExtra(EXTRA_JOB_ID, jobId));
                stopSelf();
            }
            return START_NOT_STICKY;
        }
        if (!ACTION_START.equals(action) || jobId < 0) return START_NOT_STICKY;
        MassContactStore.JobSnapshot job = store.readJob(jobId);
        if (job == null) return START_NOT_STICKY;
        if (!running.compareAndSet(false, true)) return START_NOT_STICKY;
        startForeground(NOTIFICATION_ID, buildNotification(job, "آماده‌سازی ورود…", false));
        activeJobId = jobId;
        PROCESS_ACTIVE_JOB.set(jobId);
        activeGroupId = -1L;
        pauseRequested = false;
        timedOut = false;
        worker.execute(() -> runImport(jobId));
        return START_NOT_STICKY;
    }

    private void runImport(long jobId) {
        MassContactStore.JobSnapshot job = store.readJob(jobId);
        if (job == null) { finishService(); return; }
        MassContactStore.JobUpdate progress = new MassContactStore.JobUpdate(job);
        progress.state = MassContactStore.STATE_RUNNING;
        progress.message = "در حال آماده‌سازی فایل…";
        store.saveProgress(progress);
        publish(progress, job);
        try {
            if (job.targetSystem) {
                requireContactWritePermissions();
                progress.message = "در حال ساخت شاخص شماره‌های موجود گوشی…";
                store.saveProgress(progress);
                publish(progress, job);
                long indexed = store.rebuildDevicePhoneIndex(getContentResolver());
                activeGroupId = ensureImportGroup(job);
                progress.message = local(indexed) + " شمارهٔ موجود گوشی بررسی شد" + (activeGroupId > 0 ? "؛ گروه فایل هم ساخته شد." : "؛ گروه محلی روی این گوشی پشتیبانی نشد.");
                store.saveProgress(progress);
                publish(progress, job);
            }

            Uri sourceUri = Uri.parse(job.sourceUri);
            try (InputStream input = getContentResolver().openInputStream(sourceUri)) {
                if (input == null) throw new IllegalStateException("فایل انتخاب‌شده دیگر قابل خواندن نیست.");
                ArrayList<PendingCard> batch = new ArrayList<>(job.targetSystem ? SYSTEM_BATCH_CARDS : VAULT_BATCH_CARDS);
                VCardStreamParser.ParseSummary summary = VCardStreamParser.parse(input, progress.checkpointCard, VCardStreamParser.MAX_CARDS_PER_FILE, (card, cardIndex, bytesRead) -> {
                    if (pauseRequested) return false;
                    batch.add(new PendingCard(card, cardIndex, bytesRead));
                    int batchLimit = job.targetSystem ? SYSTEM_BATCH_CARDS : VAULT_BATCH_CARDS;
                    if (batch.size() >= batchLimit) flushBatch(batch, progress, job);
                    return !pauseRequested;
                });
                if (!batch.isEmpty()) flushBatch(batch, progress, job);
                progress.invalidCards += summary.malformedCards;
                progress.bytesRead = Math.max(progress.bytesRead, summary.bytesRead);
                if (pauseRequested || summary.stopped) {
                    progress.state = MassContactStore.STATE_PAUSED;
                    progress.message = timedOut ? "Android زمان سرویس را محدود کرد؛ ورود امن متوقف شد و قابل ادامه است." : "ورود متوقف شد؛ ادامه از کارت " + local(progress.checkpointCard + 1) + ".";
                } else if (summary.limitExceeded) {
                    progress.state = MassContactStore.STATE_LIMIT;
                    progress.message = "سقف امن یک‌میلیون کارت این فایل تکمیل شد؛ رکوردهای بیشتر وارد نشدند.";
                } else {
                    progress.state = MassContactStore.STATE_COMPLETED;
                    progress.message = "ورود و راستی‌آزمایی فایل کامل شد.";
                }
                store.saveProgress(progress);
                publish(progress, job);
                showFinalNotification(progress, job);
            }
        } catch (Exception error) {
            progress.state = pauseRequested ? MassContactStore.STATE_PAUSED : MassContactStore.STATE_FAILED;
            progress.message = friendlyError(error);
            store.saveProgress(progress);
            publish(progress, job);
            showFinalNotification(progress, job);
        } finally { finishService(); }
    }

    private void flushBatch(ArrayList<PendingCard> batch, MassContactStore.JobUpdate progress, MassContactStore.JobSnapshot job) throws Exception {
        if (batch.isEmpty()) return;
        SQLiteDatabase db = store.writableDatabase();
        db.beginTransaction();
        try {
            for (PendingCard item : batch) {
                VCardContact card = item.card;
                progress.phonesSeen += card.rawPhoneCount;
                progress.invalidPhones += card.invalidPhoneCount;
                progress.duplicatePhones += card.duplicatePhoneCount;
                if (card.phones.isEmpty()) {
                    progress.invalidCards++;
                    continue;
                }
                progress.acceptedCards++;
                item.storeResult = store.storeCard(db, job.id, item.cardIndex, card, job.targetSystem);
                progress.vaultInserted += item.storeResult.newPhones;
                progress.duplicatePhones += item.storeResult.duplicatePhones;
            }
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }

        if (job.targetSystem) insertSystemBatch(batch, progress, job.id);
        PendingCard last = batch.get(batch.size() - 1);
        progress.cardsSeen = last.cardIndex;
        progress.checkpointCard = last.cardIndex;
        progress.bytesRead = Math.max(progress.bytesRead, last.bytesRead);
        progress.state = MassContactStore.STATE_RUNNING;
        progress.message = "ورود کارت " + local(progress.checkpointCard) + " • " + local(progress.vaultInserted) + " شمارهٔ تازه در مخزن";
        store.saveProgress(progress);
        publish(progress, job);
        batch.clear();
    }

    private void insertSystemBatch(List<PendingCard> batch, MassContactStore.JobUpdate progress, long jobId) throws Exception {
        ArrayList<SystemCard> candidates = new ArrayList<>();
        for (PendingCard item : batch) {
            MassContactStore.CardStoreResult result = item.storeResult;
            if (result == null) continue;
            if (result.pendingSystemPhones.isEmpty()) {
                if (result.recoveredSystemPhones > 0) progress.systemInserted++;
                else if (result.existingDevicePhones + result.alreadySystemPhones > 0) progress.systemExisting++;
                continue;
            }
            candidates.add(new SystemCard(item.card, item.cardIndex, new ArrayList<>(result.pendingSystemPhones), token(jobId, item.cardIndex)));
        }
        if (candidates.isEmpty()) return;

        Set<String> existingTokens = findExistingTokens(candidates);
        SQLiteDatabase db = store.writableDatabase();
        ArrayList<SystemCard> toInsert = new ArrayList<>();
        db.beginTransaction();
        try {
            for (SystemCard card : candidates) {
                if (!existingTokens.contains(card.token)) {
                    toInsert.add(card);
                    continue;
                }
                for (String phone : card.phones) store.markPhoneState(db, phone, 2);
                store.addDevicePhones(db, card.phones);
                card.success = true;
                card.recovered = true;
            }
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }

        applyPartitioned(toInsert);
        db.beginTransaction();
        try {
            for (SystemCard card : candidates) {
                if (card.success) {
                    for (String phone : card.phones) store.markPhoneState(db, phone, 2);
                    store.addDevicePhones(db, card.phones);
                    progress.systemInserted++;
                } else {
                    for (String phone : card.phones) store.markPhoneState(db, phone, 4);
                    progress.systemFailed++;
                }
            }
            db.setTransactionSuccessful();
        } finally { db.endTransaction(); }
    }

    private Set<String> findExistingTokens(List<SystemCard> cards) {
        HashSet<String> tokens = new HashSet<>();
        if (cards.isEmpty()) return tokens;
        StringBuilder selection = new StringBuilder(ContactsContract.Data.MIMETYPE + "=? AND " + ContactsContract.Data.DATA1 + " IN (");
        String[] arguments = new String[cards.size() + 1];
        arguments[0] = TOKEN_MIME;
        for (int index = 0; index < cards.size(); index++) {
            if (index > 0) selection.append(',');
            selection.append('?');
            arguments[index + 1] = cards.get(index).token;
        }
        selection.append(')');
        try (Cursor cursor = getContentResolver().query(ContactsContract.Data.CONTENT_URI, new String[]{ContactsContract.Data.DATA1}, selection.toString(), arguments, null)) {
            if (cursor != null) while (cursor.moveToNext()) tokens.add(cursor.getString(0));
        }
        return tokens;
    }

    private void applyPartitioned(List<SystemCard> cards) {
        ArrayList<SystemCard> group = new ArrayList<>();
        int operations = 0;
        for (SystemCard card : cards) {
            int estimate = estimatedOperations(card);
            if (!group.isEmpty() && operations + estimate > MAX_PROVIDER_OPERATIONS) {
                applyWithFallback(group);
                group = new ArrayList<>();
                operations = 0;
            }
            group.add(card);
            operations += estimate;
        }
        if (!group.isEmpty()) applyWithFallback(group);
    }

    private void applyWithFallback(List<SystemCard> cards) {
        if (cards.isEmpty()) return;
        try {
            ArrayList<ContentProviderOperation> operations = new ArrayList<>();
            for (SystemCard card : cards) appendOperations(operations, card);
            getContentResolver().applyBatch(ContactsContract.AUTHORITY, operations);
            for (SystemCard card : cards) card.success = true;
        } catch (RemoteException | OperationApplicationException | RuntimeException error) {
            if (cards.size() == 1) {
                cards.get(0).error = friendlyError(error);
                return;
            }
            int middle = cards.size() / 2;
            applyWithFallback(new ArrayList<>(cards.subList(0, middle)));
            applyWithFallback(new ArrayList<>(cards.subList(middle, cards.size())));
        }
    }

    private void appendOperations(ArrayList<ContentProviderOperation> operations, SystemCard card) {
        int rawContactBackReference = operations.size();
        ContentProviderOperation.Builder raw = ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
            .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
            .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
            .withYieldAllowed(true);
        operations.add(raw.build());
        operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, card.contact.displayName()).build());
        for (String phone : card.phones) operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, phone)
            .withValue(ContactsContract.CommonDataKinds.Phone.TYPE, ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE).build());
        for (String email : card.contact.emails) operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.Email.ADDRESS, email)
            .withValue(ContactsContract.CommonDataKinds.Email.TYPE, ContactsContract.CommonDataKinds.Email.TYPE_OTHER).build());
        if (!card.contact.organization.isEmpty()) operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.Organization.COMPANY, card.contact.organization).build());
        if (!card.contact.note.isEmpty()) operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Note.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.Note.NOTE, card.contact.note).build());
        if (activeGroupId > 0) operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.GroupMembership.CONTENT_ITEM_TYPE)
            .withValue(ContactsContract.CommonDataKinds.GroupMembership.GROUP_ROW_ID, activeGroupId).build());
        operations.add(dataInsert(rawContactBackReference)
            .withValue(ContactsContract.Data.MIMETYPE, TOKEN_MIME)
            .withValue(ContactsContract.Data.DATA1, card.token).build());
    }

    private ContentProviderOperation.Builder dataInsert(int rawContactBackReference) {
        return ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, rawContactBackReference);
    }

    private int estimatedOperations(SystemCard card) {
        return 3 + card.phones.size() + card.contact.emails.size() + (card.contact.organization.isEmpty() ? 0 : 1) + (card.contact.note.isEmpty() ? 0 : 1) + (activeGroupId > 0 ? 1 : 0);
    }

    private long ensureImportGroup(MassContactStore.JobSnapshot job) {
        String base = job.displayName.replaceFirst("(?i)\\.vcf$", "").replaceAll("[\\r\\n\\t]+", " ").trim();
        if (base.length() > 70) base = base.substring(0, 70).trim();
        String title = "ContactFlow • " + (base.isEmpty() ? "VCF" : base) + " • " + job.id;
        String selection = ContactsContract.Groups.DELETED + "=0 AND " + ContactsContract.Groups.TITLE + "=?";
        try (Cursor cursor = getContentResolver().query(ContactsContract.Groups.CONTENT_URI, new String[]{ContactsContract.Groups._ID}, selection, new String[]{title}, null)) {
            if (cursor != null && cursor.moveToFirst()) return cursor.getLong(0);
        } catch (Exception ignored) { }
        try {
            ContentValues values = new ContentValues();
            values.putNull(ContactsContract.Groups.ACCOUNT_NAME);
            values.putNull(ContactsContract.Groups.ACCOUNT_TYPE);
            values.put(ContactsContract.Groups.TITLE, title);
            values.put(ContactsContract.Groups.GROUP_VISIBLE, 1);
            Uri created = getContentResolver().insert(ContactsContract.Groups.CONTENT_URI, values);
            return created == null ? -1L : ContentUris.parseId(created);
        } catch (Exception ignored) { return -1L; }
    }

    private void requireContactWritePermissions() {
        if (Build.VERSION.SDK_INT < 23) return;
        if (checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED || checkSelfPermission(Manifest.permission.WRITE_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            throw new SecurityException("برای ورود به دفترچهٔ گوشی، مجوز خواندن و نوشتن مخاطبین لازم است.");
        }
    }

    private void publish(MassContactStore.JobUpdate update, MassContactStore.JobSnapshot job) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification(job, update.message, MassContactStore.STATE_RUNNING.equals(update.state)));
        Intent broadcast = new Intent(ACTION_PROGRESS).setPackage(getPackageName());
        broadcast.putExtra(EXTRA_JOB_ID, update.id);
        sendBroadcast(broadcast);
    }

    private Notification buildNotification(MassContactStore.JobSnapshot job, String message, boolean runningNow) {
        Intent openIntent = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open = PendingIntent.getActivity(this, 0, openIntent, pendingFlags());
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        builder.setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("ContactFlow • ورود VCF")
            .setContentText(message)
            .setStyle(new Notification.BigTextStyle().bigText(job.displayName + "\n" + message))
            .setContentIntent(open)
            .setOnlyAlertOnce(true)
            .setOngoing(runningNow)
            .setCategory(Notification.CATEGORY_PROGRESS);
        if (job.sourceSize > 0) {
            MassContactStore.JobSnapshot current = store.readJob(job.id);
            long read = current == null ? 0 : current.bytesRead;
            int value = (int) Math.min(1000L, read * 1000L / Math.max(1L, job.sourceSize));
            builder.setProgress(1000, value, false);
        } else builder.setProgress(0, 0, runningNow);
        if (runningNow) {
            Intent pause = new Intent(this, MassImportService.class).setAction(ACTION_PAUSE).putExtra(EXTRA_JOB_ID, job.id);
            PendingIntent pendingPause = PendingIntent.getService(this, 1, pause, pendingFlags());
            builder.addAction(new Notification.Action.Builder(android.R.drawable.ic_media_pause, "توقف امن", pendingPause).build());
        }
        return builder.build();
    }

    private void showFinalNotification(MassContactStore.JobUpdate update, MassContactStore.JobSnapshot job) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, buildNotification(job, update.message, false));
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "ورود حجیم مخاطبین", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("پیشرفت ورود استریم و قابل‌ادامهٔ فایل‌های VCF");
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(channel);
    }

    private void markPaused(String message) {
        long jobId = activeJobId;
        if (jobId > 0) {
            store.setState(jobId, MassContactStore.STATE_PAUSED, message);
            sendBroadcast(new Intent(ACTION_PROGRESS).setPackage(getPackageName()).putExtra(EXTRA_JOB_ID, jobId));
        }
    }

    @Override public void onTimeout(int startId, int fgsType) {
        timedOut = true;
        pauseRequested = true;
        markPaused("محدودیت زمانی سرویس Android؛ پیشرفت ذخیره شد.");
        stopSelf(startId);
    }

    private void finishService() {
        running.set(false);
        PROCESS_ACTIVE_JOB.compareAndSet(activeJobId, -1L);
        activeJobId = -1L;
        activeGroupId = -1L;
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_DETACH); else stopForeground(false);
        stopSelf();
        if (destroyed && store != null) store.close();
    }

    @Override public void onDestroy() {
        destroyed = true;
        pauseRequested = true;
        worker.shutdownNow();
        if (!running.get() && store != null) store.close();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    static boolean isJobActiveInProcess(long jobId) { return jobId > 0 && PROCESS_ACTIVE_JOB.get() == jobId; }

    private int pendingFlags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
    }

    private static String token(long jobId, long cardIndex) { return "cf36:" + jobId + ":" + cardIndex; }
    private static String local(long value) { return String.format(new Locale("fa", "IR"), "%d", value); }

    private static String friendlyError(Throwable error) {
        if (error instanceof SecurityException) return error.getMessage() == null ? "مجوز مخاطبین داده نشده است." : error.getMessage();
        String message = error.getMessage();
        if (message == null || message.trim().isEmpty()) message = error.getClass().getSimpleName();
        return "ورود متوقف شد: " + VCardContact.cleanText(message);
    }

    private static final class PendingCard {
        final VCardContact card;
        final long cardIndex;
        final long bytesRead;
        MassContactStore.CardStoreResult storeResult;
        PendingCard(VCardContact card, long cardIndex, long bytesRead) { this.card = card; this.cardIndex = cardIndex; this.bytesRead = bytesRead; }
    }

    private static final class SystemCard {
        final VCardContact contact;
        final long cardIndex;
        final ArrayList<String> phones;
        final String token;
        boolean success;
        boolean recovered;
        String error = "";
        SystemCard(VCardContact contact, long cardIndex, ArrayList<String> phones, String token) {
            this.contact = contact;
            this.cardIndex = cardIndex;
            this.phones = phones;
            this.token = token;
        }
    }
}
