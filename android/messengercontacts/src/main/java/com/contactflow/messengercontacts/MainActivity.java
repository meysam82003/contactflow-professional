package com.contactflow.messengercontacts;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.provider.OpenableColumns;
import android.text.Editable;
import android.text.TextWatcher;
import android.text.format.Formatter;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final int CONTACTS_PERMISSION = 361;
    private static final int SAVE_DOCUMENT = 362;
    private static final int OPEN_VCF_DOCUMENT = 363;
    private static final int IMPORT_CONTACTS_PERMISSION = 364;
    private static final int BG = Color.rgb(8, 12, 21);
    private static final int PANEL = Color.rgb(20, 27, 42);
    private static final int PANEL_SOFT = Color.rgb(29, 39, 59);
    private static final int TEXT = Color.rgb(238, 244, 255);
    private static final int MUTED = Color.rgb(157, 170, 195);
    private static final int ACCENT = Color.rgb(83, 218, 190);
    private static final int ACCENT_2 = Color.rgb(101, 134, 255);
    private static final int DANGER = Color.rgb(255, 104, 123);

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ArrayList<ContactRecord> allContacts = new ArrayList<>();
    private final ArrayList<ContactRecord> visibleContacts = new ArrayList<>();
    private final ContactAdapter adapter = new ContactAdapter();
    private TextView statusText;
    private TextView resultText;
    private TextView emptyText;
    private EditText searchBox;
    private LinearLayout filterBar;
    private ListView contactList;
    private ProgressBar progress;
    private Button scanButton;
    private Button exportButton;
    private Button importVcfButton;
    private Button resumeImportButton;
    private Button pauseImportButton;
    private Button reportImportButton;
    private TextView vaultText;
    private TextView massStatusText;
    private ProgressBar massProgress;
    private String currentFilter = "has_any";
    private byte[] pendingBytes;
    private String pendingName;
    private String pendingMime;
    private Uri pendingImportUri;
    private String pendingImportName;
    private long pendingImportSize = -1L;
    private long pendingResumeJobId = -1L;
    private MassContactStore.JobSnapshot latestImportJob;
    private boolean receiverRegistered;

    private final BroadcastReceiver importProgressReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { refreshMassImportState(); }
    };

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        if (Build.VERSION.SDK_INT >= 23) getWindow().getDecorView().setSystemUiVisibility(0);
        currentFilter = getPreferences(MODE_PRIVATE).getString("messenger_filter", "has_any");
        buildInterface();
        refreshMassImportState();
        if (hasContactsPermission()) scanContacts(); else showPermissionState();
    }

    @Override protected void onStart() {
        super.onStart();
        IntentFilter filter = new IntentFilter(MassImportService.ACTION_PROGRESS);
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(importProgressReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(importProgressReceiver, filter);
        receiverRegistered = true;
        refreshMassImportState();
    }

    @Override protected void onStop() {
        if (receiverRegistered) {
            unregisterReceiver(importProgressReceiver);
            receiverRegistered = false;
        }
        super.onStop();
    }

    private void buildInterface() {
        LinearLayout root = vertical();
        root.setPadding(dp(16), dp(16), dp(16), dp(10));
        root.setBackgroundColor(BG);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        setContentView(root);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        LinearLayout titleWrap = vertical();
        TextView title = text("مخاطبین پیام‌رسان‌ها", 24, TEXT, true);
        TextView subtitle = text("تفکیک واقعی اکشن‌های ثبت‌شده در دفترچهٔ Android", 13, MUTED, false);
        titleWrap.addView(title);
        titleWrap.addView(subtitle);
        header.addView(titleWrap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        scanButton = button("اسکن مجدد", PANEL_SOFT, TEXT);
        exportButton = button("خروجی", ACCENT, Color.rgb(7, 26, 24));
        exportButton.setEnabled(false);
        header.addView(scanButton);
        header.addView(exportButton);
        root.addView(header);

        LinearLayout massCard = vertical();
        massCard.setPadding(dp(14), dp(12), dp(14), dp(12));
        massCard.setBackground(rounded(Color.rgb(17, 36, 48), 16));
        LinearLayout.LayoutParams massParams = matchWrap();
        massParams.setMargins(0, dp(14), 0, 0);
        TextView massTitle = text("ورود فوق‌حجیم VCF", 16, ACCENT, true);
        TextView massHint = text("استریم تا ۱٬۰۰۰٬۰۰۰ کارت در هر فایل • مخزن کل فقط به فضای دستگاه محدود است", 11, MUTED, false);
        massCard.addView(massTitle);
        massCard.addView(massHint);
        LinearLayout massActions = new LinearLayout(this);
        massActions.setOrientation(LinearLayout.HORIZONTAL);
        massActions.setGravity(Gravity.END);
        massActions.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        importVcfButton = button("انتخاب VCF", ACCENT, Color.rgb(7, 26, 24));
        resumeImportButton = button("ادامه", ACCENT_2, Color.WHITE);
        pauseImportButton = button("توقف امن", DANGER, Color.WHITE);
        reportImportButton = button("گزارش", PANEL_SOFT, TEXT);
        resumeImportButton.setVisibility(View.GONE);
        pauseImportButton.setVisibility(View.GONE);
        reportImportButton.setEnabled(false);
        massActions.addView(importVcfButton);
        massActions.addView(resumeImportButton);
        massActions.addView(pauseImportButton);
        massActions.addView(reportImportButton);
        massCard.addView(massActions);
        massProgress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        massProgress.setMax(1000);
        massProgress.setProgress(0);
        LinearLayout.LayoutParams massProgressParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(5));
        massProgressParams.setMargins(0, dp(7), 0, dp(5));
        massCard.addView(massProgress, massProgressParams);
        vaultText = text("مخزن محلی در حال محاسبه…", 12, TEXT, true);
        massStatusText = text("فایلی برای ورود انتخاب نشده است.", 11, MUTED, false);
        massCard.addView(vaultText);
        massCard.addView(massStatusText);
        root.addView(massCard, massParams);

        LinearLayout statusCard = vertical();
        statusCard.setPadding(dp(14), dp(12), dp(14), dp(12));
        statusCard.setBackground(rounded(PANEL, 16));
        LinearLayout.LayoutParams statusParams = matchWrap();
        statusParams.setMargins(0, dp(16), 0, dp(12));
        statusText = text("در انتظار مجوز مخاطبین…", 14, TEXT, true);
        resultText = text("هیچ داده‌ای خوانده نشده است.", 12, MUTED, false);
        statusCard.addView(statusText);
        statusCard.addView(resultText);
        root.addView(statusCard, statusParams);

        searchBox = new EditText(this);
        searchBox.setSingleLine(true);
        searchBox.setHint("جستجو در نام، شماره یا پیام‌رسان…");
        searchBox.setHintTextColor(MUTED);
        searchBox.setTextColor(TEXT);
        searchBox.setTextSize(15);
        searchBox.setPadding(dp(14), dp(10), dp(14), dp(10));
        searchBox.setBackground(rounded(PANEL_SOFT, 14));
        searchBox.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        root.addView(searchBox, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));

        HorizontalScrollView scroll = new HorizontalScrollView(this);
        scroll.setHorizontalScrollBarEnabled(false);
        scroll.setFillViewport(false);
        filterBar = new LinearLayout(this);
        filterBar.setOrientation(LinearLayout.HORIZONTAL);
        filterBar.setGravity(Gravity.END);
        filterBar.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        filterBar.setPadding(0, dp(10), 0, dp(8));
        scroll.addView(filterBar, new HorizontalScrollView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(scroll);

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setIndeterminate(true);
        progress.setVisibility(View.GONE);
        root.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(4)));

        contactList = new ListView(this);
        contactList.setAdapter(adapter);
        contactList.setDividerHeight(dp(9));
        contactList.setDivider(null);
        contactList.setBackgroundColor(BG);
        contactList.setClipToPadding(false);
        contactList.setPadding(0, dp(5), 0, dp(10));
        emptyText = text("بعد از اسکن، مخاطبین اینجا نمایش داده می‌شوند.", 14, MUTED, false);
        emptyText.setGravity(Gravity.CENTER);
        root.addView(contactList, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        root.addView(emptyText, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView privacy = text("کاملاً آفلاین • بدون مجوز اینترنت • خروجی فقط در محل انتخاب‌شدهٔ شما ذخیره می‌شود", 11, MUTED, false);
        privacy.setGravity(Gravity.CENTER);
        root.addView(privacy);

        scanButton.setOnClickListener(view -> { if (hasContactsPermission()) scanContacts(); else requestContactsPermission(); });
        exportButton.setOnClickListener(view -> chooseExportFormat());
        importVcfButton.setOnClickListener(view -> openVcfPicker());
        resumeImportButton.setOnClickListener(view -> resumeLatestImport());
        pauseImportButton.setOnClickListener(view -> pauseCurrentImport());
        reportImportButton.setOnClickListener(view -> showImportReport());
        searchBox.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence value, int start, int count, int after) { }
            @Override public void onTextChanged(CharSequence value, int start, int before, int count) { applyFilter(); }
            @Override public void afterTextChanged(Editable value) { }
        });
        contactList.setOnItemClickListener((parent, view, position, id) -> openNativeContact(visibleContacts.get(position)));
        contactList.setOnItemLongClickListener((parent, view, position, id) -> { showDetectionDetails(visibleContacts.get(position)); return true; });
    }

    private void showPermissionState() {
        statusText.setText("برای اسکن، دسترسی فقط‌خواندنی مخاطبین لازم است.");
        resultText.setText("برنامه اینترنت ندارد و هیچ شماره‌ای از دستگاه خارج نمی‌شود.");
        emptyText.setText("روی «دادن دسترسی» بزنید؛ هر زمان بخواهید می‌توانید مجوز را از تنظیمات Android پس بگیرید.");
        scanButton.setText("دادن دسترسی");
        emptyText.setVisibility(View.VISIBLE);
    }

    private boolean hasContactsPermission() { return Build.VERSION.SDK_INT < 23 || checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED; }
    private void requestContactsPermission() { if (Build.VERSION.SDK_INT >= 23) requestPermissions(new String[]{Manifest.permission.READ_CONTACTS}, CONTACTS_PERMISSION); else scanContacts(); }

    private boolean hasImportContactsPermission() {
        return Build.VERSION.SDK_INT < 23 || (checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED && checkSelfPermission(Manifest.permission.WRITE_CONTACTS) == PackageManager.PERMISSION_GRANTED);
    }

    private void requestImportContactsPermission() {
        if (Build.VERSION.SDK_INT >= 23) requestPermissions(new String[]{Manifest.permission.READ_CONTACTS, Manifest.permission.WRITE_CONTACTS}, IMPORT_CONTACTS_PERMISSION);
    }

    private void openVcfPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/vcard");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/vcard", "text/x-vcard", "text/directory", "application/octet-stream"});
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try { startActivityForResult(intent, OPEN_VCF_DOCUMENT); }
        catch (Exception error) {
            intent.setType("*/*");
            startActivityForResult(intent, OPEN_VCF_DOCUMENT);
        }
    }

    private void handleVcfSelection(Intent data) {
        Uri uri = data.getData();
        if (uri == null) { massStatusText.setText("فایلی انتخاب نشد."); return; }
        try {
            int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getContentResolver().takePersistableUriPermission(uri, flags & Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) { }
        pendingImportUri = uri;
        pendingImportName = "contacts.vcf";
        pendingImportSize = -1L;
        try (Cursor cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                String name = cursor.getString(0);
                if (name != null && !name.trim().isEmpty()) pendingImportName = name.trim();
                if (!cursor.isNull(1)) pendingImportSize = cursor.getLong(1);
            }
        } catch (Exception ignored) { }
        importVcfButton.setEnabled(false);
        massProgress.setIndeterminate(true);
        massStatusText.setText("فایل انتخاب شد؛ در حال بررسی دسترسی و سربرگ VCF…");
        worker.execute(() -> {
            try {
                verifyVcfSource(uri);
                runOnUiThread(this::showImportModeDialog);
            } catch (Exception error) {
                runOnUiThread(() -> {
                    clearPendingImport();
                    importVcfButton.setEnabled(true);
                    massProgress.setIndeterminate(false);
                    massProgress.setProgress(0);
                    massStatusText.setText("فایل خوانده نشد: " + friendlyMessage(error));
                    Toast.makeText(this, "VCF معتبر/قابل‌خواندن نیست: " + friendlyMessage(error), Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void verifyVcfSource(Uri uri) throws Exception {
        try (InputStream raw = getContentResolver().openInputStream(uri)) {
            if (raw == null) throw new IllegalStateException("ارائه‌دهندهٔ فایل اجازهٔ خواندن نداد.");
            BufferedInputStream input = new BufferedInputStream(raw, 64 * 1024);
            ByteArrayOutputStream sample = new ByteArrayOutputStream(128 * 1024);
            byte[] buffer = new byte[16 * 1024];
            int read, remaining = 256 * 1024;
            while (remaining > 0 && (read = input.read(buffer, 0, Math.min(buffer.length, remaining))) > 0) {
                sample.write(buffer, 0, read);
                remaining -= read;
            }
            if (sample.size() == 0) throw new IllegalArgumentException("فایل خالی است.");
            String header = new String(sample.toByteArray(), StandardCharsets.UTF_8).replace("\u0000", "").toUpperCase(Locale.ROOT);
            if (!header.contains("BEGIN:VCARD")) throw new IllegalArgumentException("سربرگ BEGIN:VCARD در ابتدای فایل پیدا نشد.");
        }
    }

    private void showImportModeDialog() {
        if (pendingImportUri == null) return;
        importVcfButton.setEnabled(true);
        massProgress.setIndeterminate(false);
        massProgress.setProgress(0);
        String size = pendingImportSize > 0 ? Formatter.formatFileSize(this, pendingImportSize) : "حجم نامشخص";
        massStatusText.setText("VCF بررسی شد؛ یکی از دو مقصد ورود را انتخاب کنید.");
        AlertDialog dialog = new AlertDialog.Builder(this)
            .setTitle(pendingImportName)
            .setMessage(size + " • فایل قابل‌خواندن است\n\n«ورود سریع» شماره‌ها را در مخزن دیسکی ContactFlow نگه می‌دارد. «ورود به گوشی» علاوه بر مخزن، مخاطبین را دسته‌ای در دفترچه Android ثبت می‌کند و سرعتش به Contacts Provider گوشی وابسته است.")
            .setPositiveButton("ورود سریع", (item, which) -> createAndStartImport(false))
            .setNeutralButton("ورود به گوشی", (item, which) -> {
                if (hasImportContactsPermission()) createAndStartImport(true);
                else requestImportContactsPermission();
            })
            .setNegativeButton("لغو", (item, which) -> {
                clearPendingImport();
                massStatusText.setText("ورود لغو شد؛ فایل دیگری انتخاب کنید.");
            })
            .create();
        dialog.setOnCancelListener(item -> {
            clearPendingImport();
            massStatusText.setText("ورود لغو شد؛ فایل دیگری انتخاب کنید.");
        });
        dialog.show();
    }

    private void clearPendingImport() {
        pendingImportUri = null;
        pendingImportName = null;
        pendingImportSize = -1L;
    }

    private void createAndStartImport(boolean targetSystem) {
        if (pendingImportUri == null) return;
        Uri uri = pendingImportUri;
        String name = pendingImportName;
        long size = pendingImportSize;
        clearPendingImport();
        importVcfButton.setEnabled(false);
        massStatusText.setText("در حال ساخت کار ورود…");
        worker.execute(() -> {
            MassContactStore database = new MassContactStore(this);
            try {
                long jobId = database.createJob(uri.toString(), name == null ? "contacts.vcf" : name, size, targetSystem);
                runOnUiThread(() -> {
                    importVcfButton.setEnabled(true);
                    startImportService(jobId);
                    refreshMassImportState();
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    importVcfButton.setEnabled(true);
                    Toast.makeText(this, "ساخت کار ورود ناموفق: " + error.getMessage(), Toast.LENGTH_LONG).show();
                });
            } finally { database.close(); }
        });
    }

    private void startImportService(long jobId) {
        Intent intent = new Intent(this, MassImportService.class).setAction(MassImportService.ACTION_START).putExtra(MassImportService.EXTRA_JOB_ID, jobId);
        try {
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent); else startService(intent);
            massStatusText.setText("سرویس ورود شروع شد؛ می‌توانید برنامه را در پیش‌زمینه نگه دارید یا بعداً ادامه دهید.");
        } catch (Exception error) { Toast.makeText(this, "شروع سرویس ناموفق: " + error.getMessage(), Toast.LENGTH_LONG).show(); }
    }

    private void resumeLatestImport() {
        MassContactStore.JobSnapshot job = latestImportJob;
        if (job == null || !job.canResume()) return;
        if (job.targetSystem && !hasImportContactsPermission()) {
            pendingResumeJobId = job.id;
            requestImportContactsPermission();
        } else startImportService(job.id);
    }

    private void pauseCurrentImport() {
        MassContactStore.JobSnapshot job = latestImportJob;
        if (job == null) return;
        Intent intent = new Intent(this, MassImportService.class).setAction(MassImportService.ACTION_PAUSE).putExtra(MassImportService.EXTRA_JOB_ID, job.id);
        startService(intent);
        massStatusText.setText("درخواست توقف امن ارسال شد؛ دستهٔ جاری کامل و نقطهٔ ادامه ذخیره می‌شود.");
    }

    private void refreshMassImportState() {
        if (worker.isShutdown()) return;
        worker.execute(() -> {
            MassContactStore database = new MassContactStore(this);
            try {
                long count = database.vaultCount();
                long bytes = database.databaseBytes();
                MassContactStore.JobSnapshot job = database.latestJob();
                if (job != null && MassContactStore.STATE_RUNNING.equals(job.state) && !MassImportService.isJobActiveInProcess(job.id)) {
                    database.setState(job.id, MassContactStore.STATE_PAUSED, "اجرای قبلی بسته شده بود؛ Checkpoint سالم است و با «ادامه» از همان نقطه شروع می‌شود.");
                    job = database.readJob(job.id);
                }
                MassContactStore.JobSnapshot currentJob = job;
                runOnUiThread(() -> renderMassImportState(count, bytes, currentJob));
            } catch (Exception ignored) { }
            finally { database.close(); }
        });
    }

    private void renderMassImportState(long vaultCount, long databaseBytes, MassContactStore.JobSnapshot job) {
        latestImportJob = job;
        vaultText.setText("مخزن دیسکی: " + localNumber(vaultCount) + " شمارهٔ یکتا • " + Formatter.formatFileSize(this, databaseBytes));
        reportImportButton.setEnabled(job != null);
        boolean running = job != null && MassContactStore.STATE_RUNNING.equals(job.state);
        importVcfButton.setEnabled(!running);
        pauseImportButton.setVisibility(running ? View.VISIBLE : View.GONE);
        resumeImportButton.setVisibility(job != null && job.canResume() && !running ? View.VISIBLE : View.GONE);
        if (job == null) {
            massStatusText.setText("فایلی برای ورود انتخاب نشده است.");
            massProgress.setIndeterminate(false);
            massProgress.setProgress(0);
            return;
        }
        String destination = job.targetSystem ? "مخزن + گوشی" : "فقط مخزن";
        massStatusText.setText(stateLabel(job.state) + " • " + job.displayName + " • " + destination + "\n" + job.message + "\n" + localNumber(job.acceptedCards) + " کارت معتبر، " + localNumber(job.vaultInserted) + " شمارهٔ تازه، " + localNumber(job.duplicatePhones) + " تکراری");
        if (job.sourceSize > 0) {
            massProgress.setIndeterminate(false);
            massProgress.setProgress((int) Math.min(1000L, job.bytesRead * 1000L / Math.max(1L, job.sourceSize)));
        } else {
            massProgress.setIndeterminate(running);
            if (!running) massProgress.setProgress(MassContactStore.STATE_COMPLETED.equals(job.state) ? 1000 : 0);
        }
    }

    private void showImportReport() {
        MassContactStore.JobSnapshot job = latestImportJob;
        if (job == null) return;
        String report = importReportText(job);
        new AlertDialog.Builder(this)
            .setTitle("گزارش جامع آخرین VCF")
            .setMessage(report)
            .setPositiveButton("ذخیره CSV", (dialog, which) -> saveImportReport(job))
            .setNegativeButton("بستن", null)
            .show();
    }

    private String importReportText(MassContactStore.JobSnapshot job) {
        return "فایل: " + job.displayName +
            "\nوضعیت: " + stateLabel(job.state) +
            "\nمقصد: " + (job.targetSystem ? "مخزن و دفترچه گوشی" : "مخزن دیسکی") +
            "\nکارت پردازش‌شده: " + localNumber(job.cardsSeen) +
            "\nکارت معتبر: " + localNumber(job.acceptedCards) +
            "\nکارت خراب/بدون شماره: " + localNumber(job.invalidCards) +
            "\nمقدار TEL بررسی‌شده: " + localNumber(job.phonesSeen) +
            "\nشماره نامعتبر: " + localNumber(job.invalidPhones) +
            "\nشماره تکراری: " + localNumber(job.duplicatePhones) +
            "\nشماره تازه در مخزن: " + localNumber(job.vaultInserted) +
            "\nمخاطب افزوده‌شده به گوشی: " + localNumber(job.systemInserted) +
            "\nاز قبل در گوشی: " + localNumber(job.systemExisting) +
            "\nخطای ثبت گوشی: " + localNumber(job.systemFailed) +
            "\nنقطه ادامه: کارت " + localNumber(job.checkpointCard + 1) +
            "\n\nنکته: تشخیص پیام‌رسان فقط از اکشن واقعی ثبت‌شده در ContactsContract انجام می‌شود، نه حدس عضویت سروری.";
    }

    private void saveImportReport(MassContactStore.JobSnapshot job) {
        String header = "file,state,target,cards_seen,accepted_cards,invalid_cards,phones_seen,invalid_phones,duplicate_phones,vault_inserted,system_inserted,system_existing,system_failed,checkpoint,message\r\n";
        String row = csv(job.displayName) + ',' + csv(job.state) + ',' + csv(job.targetSystem ? "vault+android" : "vault") + ',' + job.cardsSeen + ',' + job.acceptedCards + ',' + job.invalidCards + ',' + job.phonesSeen + ',' + job.invalidPhones + ',' + job.duplicatePhones + ',' + job.vaultInserted + ',' + job.systemInserted + ',' + job.systemExisting + ',' + job.systemFailed + ',' + job.checkpointCard + ',' + csv(job.message) + "\r\n";
        byte[] content = ("\uFEFF" + header + row).getBytes(StandardCharsets.UTF_8);
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        launchSaveDocument(new ExportWriter.ExportDocument(content, "text/csv", "ContactFlow_VCF_Import_Report_" + timestamp + ".csv"));
    }

    private static String csv(String value) { return "\"" + (value == null ? "" : value.replace("\"", "\"\"").replace('\r', ' ').replace('\n', ' ')) + "\""; }

    private static String stateLabel(String state) {
        if (MassContactStore.STATE_RUNNING.equals(state)) return "در حال اجرا";
        if (MassContactStore.STATE_PAUSED.equals(state)) return "متوقف و قابل ادامه";
        if (MassContactStore.STATE_COMPLETED.equals(state)) return "کامل";
        if (MassContactStore.STATE_LIMIT.equals(state)) return "سقف یک‌میلیون تکمیل شد";
        if (MassContactStore.STATE_FAILED.equals(state)) return "ناموفق و قابل تلاش مجدد";
        return "در صف";
    }

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CONTACTS_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) scanContacts();
            else {
                statusText.setText("مجوز مخاطبین داده نشد.");
                resultText.setText("بدون READ_CONTACTS امکان تشخیص اکشن‌های تلگرام، واتساپ و سایر برنامه‌ها وجود ندارد.");
                emptyText.setText("مجوز رد شده است؛ برای تلاش دوباره روی دکمهٔ دسترسی بزنید.");
            }
            return;
        }
        if (requestCode == IMPORT_CONTACTS_PERMISSION) {
            if (hasImportContactsPermission()) {
                if (pendingResumeJobId > 0) {
                    long jobId = pendingResumeJobId;
                    pendingResumeJobId = -1L;
                    startImportService(jobId);
                } else if (pendingImportUri != null) createAndStartImport(true);
            } else {
                pendingResumeJobId = -1L;
                Toast.makeText(this, "مجوز نوشتن مخاطبین داده نشد؛ حالت «فقط مخزن سریع» بدون این مجوز کار می‌کند.", Toast.LENGTH_LONG).show();
            }
        }
    }

    private void scanContacts() {
        if (!hasContactsPermission()) { requestContactsPermission(); return; }
        scanButton.setEnabled(false);
        exportButton.setEnabled(false);
        scanButton.setText("در حال اسکن…");
        progress.setVisibility(View.VISIBLE);
        statusText.setText("در حال خواندن دفترچه و اکشن‌های ثبت‌شدهٔ پیام‌رسان‌ها…");
        resultText.setText("پردازش فقط روی همین دستگاه انجام می‌شود.");
        worker.execute(() -> {
            try {
                ContactScanner.ScanResult result = ContactScanner.scan(getContentResolver());
                runOnUiThread(() -> finishScan(result));
            } catch (Exception error) {
                runOnUiThread(() -> {
                    progress.setVisibility(View.GONE);
                    scanButton.setEnabled(true);
                    scanButton.setText("اسکن مجدد");
                    statusText.setText("اسکن مخاطبین ناموفق بود.");
                    resultText.setText(error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage());
                });
            }
        });
    }

    private void finishScan(ContactScanner.ScanResult scanResult) {
        allContacts.clear();
        allContacts.addAll(scanResult.contacts);
        progress.setVisibility(View.GONE);
        scanButton.setEnabled(true);
        scanButton.setText("اسکن مجدد");
        int withApps = 0, appSignals = 0;
        for (ContactRecord row : allContacts) { if (!row.appIds.isEmpty()) withApps++; appSignals += row.appIds.size(); }
        statusText.setText(String.format(new Locale("fa", "IR"), "%d مخاطب دارای شماره خوانده شد%s", allContacts.size(), scanResult.truncated ? " (پیش‌نمایش امن)" : ""));
        resultText.setText(String.format(new Locale("fa", "IR"), "%d مخاطب دارای اکشن پیام‌رسان • %d اتصال تشخیص‌داده‌شده%s", withApps, appSignals, scanResult.truncated ? " • نمایش روی ۲۵هزار مخاطب نخست محدود شده تا حافظه پر نشود" : ""));
        buildFilters();
        applyFilter();
    }

    private void buildFilters() {
        filterBar.removeAllViews();
        Map<String, Integer> counts = new LinkedHashMap<>();
        int any = 0, none = 0;
        for (ContactRecord row : allContacts) {
            if (row.appIds.isEmpty()) none++; else any++;
            for (String id : row.appIds) counts.put(id, counts.containsKey(id) ? counts.get(id) + 1 : 1);
        }
        addFilter("has_any", "دارای پیام‌رسان", any, null);
        for (MessengerCatalog.Messenger item : MessengerCatalog.ALL) {
            int count = counts.containsKey(item.id) ? counts.get(item.id) : 0;
            Drawable icon = MessengerCatalog.icon(getPackageManager(), item.id);
            if (count > 0 || icon != null) addFilter(item.id, item.label, count, icon);
        }
        if (counts.containsKey("other")) addFilter("other", MessengerCatalog.label("other"), counts.get("other"), null);
        addFilter("none", "بدون تشخیص", none, null);
        addFilter("all", "کل دفترچه", allContacts.size(), null);
        boolean valid = "has_any".equals(currentFilter) || "none".equals(currentFilter) || "all".equals(currentFilter) || counts.containsKey(currentFilter);
        if (!valid) currentFilter = "has_any";
        refreshFilterStyles();
    }

    private void addFilter(String id, String label, int count, Drawable icon) {
        Button button = button(label + "  " + localNumber(count), PANEL_SOFT, TEXT);
        button.setTag(id);
        button.setTextSize(12);
        button.setMinHeight(dp(42));
        button.setMinimumWidth(0);
        if (icon != null) {
            icon.setBounds(0, 0, dp(22), dp(22));
            button.setCompoundDrawablesRelative(icon, null, null, null);
            button.setCompoundDrawablePadding(dp(6));
        }
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(42));
        params.setMargins(dp(4), 0, dp(4), 0);
        filterBar.addView(button, params);
        button.setOnClickListener(view -> {
            currentFilter = (String) view.getTag();
            getPreferences(MODE_PRIVATE).edit().putString("messenger_filter", currentFilter).apply();
            refreshFilterStyles();
            applyFilter();
        });
    }

    private void refreshFilterStyles() {
        for (int index = 0; index < filterBar.getChildCount(); index++) {
            View view = filterBar.getChildAt(index);
            if (!(view instanceof Button)) continue;
            boolean selected = currentFilter.equals(view.getTag());
            view.setBackground(rounded(selected ? ACCENT : PANEL_SOFT, 14));
            ((Button) view).setTextColor(selected ? Color.rgb(7, 26, 24) : TEXT);
        }
    }

    private void applyFilter() {
        if (searchBox == null) return;
        String query = searchBox.getText().toString();
        visibleContacts.clear();
        for (ContactRecord row : allContacts) {
            boolean filterMatch;
            if ("all".equals(currentFilter)) filterMatch = true;
            else if ("has_any".equals(currentFilter)) filterMatch = !row.appIds.isEmpty();
            else if ("none".equals(currentFilter)) filterMatch = row.appIds.isEmpty();
            else filterMatch = row.appIds.contains(currentFilter);
            if (filterMatch && row.matchesQuery(query)) visibleContacts.add(row);
        }
        adapter.notifyDataSetChanged();
        exportButton.setEnabled(!visibleContacts.isEmpty());
        boolean empty = visibleContacts.isEmpty();
        emptyText.setVisibility(empty ? View.VISIBLE : View.GONE);
        if (empty) emptyText.setText("برای این فیلتر مخاطبی پیدا نشد. بعضی پیام‌رسان‌ها در نسخه‌های جدید Android اکشن مخاطب ثبت نمی‌کنند.");
        resultText.setText(localNumber(visibleContacts.size()) + " نتیجه در فیلتر «" + filterLabel() + "»");
    }

    private String filterLabel() {
        if ("all".equals(currentFilter)) return "کل دفترچه";
        if ("has_any".equals(currentFilter)) return "دارای پیام‌رسان";
        if ("none".equals(currentFilter)) return "بدون تشخیص";
        return MessengerCatalog.label(currentFilter);
    }

    private void openNativeContact(ContactRecord row) {
        try {
            Uri uri = Uri.withAppendedPath(ContactsContract.Contacts.CONTENT_URI, Long.toString(row.contactId));
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception error) { Toast.makeText(this, "بازکردن کارت مخاطب ناموفق بود.", Toast.LENGTH_LONG).show(); }
    }

    private void showDetectionDetails(ContactRecord row) {
        String evidence = row.evidence.isEmpty() ? "ردیف اختصاصی پیدا نشد." : String.join("\n", row.evidence);
        new AlertDialog.Builder(this)
            .setTitle(row.displayName())
            .setMessage("شماره‌ها:\n" + row.joinedPhones() + "\n\nپیام‌رسان‌ها:\n" + (row.appIds.isEmpty() ? "بدون تشخیص" : row.joinedApps()) + "\n\nنشانهٔ فنی ثبت‌شده در ContactsContract:\n" + evidence)
            .setPositiveButton("بازکردن کارت مخاطب", (dialog, which) -> openNativeContact(row))
            .setNegativeButton("بستن", null)
            .show();
    }

    private void chooseExportFormat() {
        if (visibleContacts.isEmpty()) return;
        String[] labels = { "VCF / vCard", "CSV", "Excel واقعی XLSX", "TXT" };
        String[] formats = { "vcf", "csv", "xlsx", "txt" };
        new AlertDialog.Builder(this).setTitle("فرمت خروجی " + filterLabel()).setItems(labels, (dialog, index) -> prepareExport(formats[index])).setNegativeButton("لغو", null).show();
    }

    private void prepareExport(String format) {
        ArrayList<ContactRecord> snapshot = new ArrayList<>(visibleContacts);
        exportButton.setEnabled(false);
        progress.setVisibility(View.VISIBLE);
        statusText.setText("در حال ساخت خروجی " + format.toUpperCase(Locale.ROOT) + "…");
        worker.execute(() -> {
            try {
                ExportWriter.ExportDocument document = ExportWriter.create(format, snapshot, filterLabel());
                runOnUiThread(() -> launchSaveDocument(document));
            } catch (Exception error) {
                runOnUiThread(() -> {
                    progress.setVisibility(View.GONE);
                    exportButton.setEnabled(true);
                    Toast.makeText(this, "ساخت خروجی ناموفق: " + error.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    private void launchSaveDocument(ExportWriter.ExportDocument document) {
        progress.setVisibility(View.GONE);
        exportButton.setEnabled(true);
        pendingBytes = document.bytes;
        pendingName = document.fileName;
        pendingMime = document.mime;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(document.mime);
        intent.putExtra(Intent.EXTRA_TITLE, document.fileName);
        startActivityForResult(intent, SAVE_DOCUMENT);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OPEN_VCF_DOCUMENT) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) handleVcfSelection(data);
            else massStatusText.setText("انتخاب فایل لغو شد؛ داده‌ای تغییر نکرد.");
            return;
        }
        if (requestCode != SAVE_DOCUMENT) return;
        if (resultCode != RESULT_OK || data == null || data.getData() == null || pendingBytes == null) {
            pendingBytes = null;
            pendingName = null;
            pendingMime = null;
            return;
        }
        Uri target = data.getData();
        try (OutputStream output = getContentResolver().openOutputStream(target, "w")) {
            if (output == null) throw new IllegalStateException("مسیر خروجی باز نشد.");
            output.write(pendingBytes);
            output.flush();
            statusText.setText("خروجی ذخیره شد: " + pendingName);
            Toast.makeText(this, "فایل با موفقیت ذخیره شد.", Toast.LENGTH_LONG).show();
        } catch (Exception error) {
            Toast.makeText(this, "ذخیره ناموفق: " + error.getMessage(), Toast.LENGTH_LONG).show();
        } finally {
            pendingBytes = null;
            pendingName = null;
            pendingMime = null;
        }
    }

    private LinearLayout vertical() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }

    private TextView text(String value, float size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setGravity(Gravity.RIGHT);
        view.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private Button button(String value, int background, int foreground) {
        Button button = new Button(this);
        button.setText(value);
        button.setTextColor(foreground);
        button.setTextSize(12);
        button.setAllCaps(false);
        button.setGravity(Gravity.CENTER);
        button.setPadding(dp(12), 0, dp(12), 0);
        button.setBackground(rounded(background, 14));
        button.setMinHeight(dp(44));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(44));
        params.setMargins(dp(4), 0, dp(4), 0);
        button.setLayoutParams(params);
        return button;
    }

    private GradientDrawable rounded(int color, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radiusDp));
        return drawable;
    }

    private GradientDrawable circle(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.OVAL);
        drawable.setColor(color);
        return drawable;
    }

    private LinearLayout.LayoutParams matchWrap() { return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT); }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private String localNumber(int value) { return localNumber((long) value); }
    private String localNumber(long value) { return String.format(new Locale("fa", "IR"), "%d", value); }
    private static String friendlyMessage(Throwable error) {
        String message = error.getMessage();
        return message == null || message.trim().isEmpty() ? error.getClass().getSimpleName() : VCardContact.cleanText(message);
    }

    @Override protected void onDestroy() {
        worker.shutdownNow();
        super.onDestroy();
    }

    private final class ContactAdapter extends BaseAdapter {
        @Override public int getCount() { return visibleContacts.size(); }
        @Override public ContactRecord getItem(int position) { return visibleContacts.get(position); }
        @Override public long getItemId(int position) { return getItem(position).contactId; }

        @Override public View getView(int position, View convertView, ViewGroup parent) {
            RowHolder holder;
            if (convertView == null) {
                LinearLayout card = new LinearLayout(MainActivity.this);
                card.setOrientation(LinearLayout.HORIZONTAL);
                card.setGravity(Gravity.CENTER_VERTICAL);
                card.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
                card.setPadding(dp(14), dp(12), dp(14), dp(12));
                card.setBackground(rounded(PANEL, 16));

                TextView avatar = text("؟", 18, Color.rgb(7, 26, 24), true);
                avatar.setGravity(Gravity.CENTER);
                avatar.setBackground(circle(ACCENT));
                card.addView(avatar, new LinearLayout.LayoutParams(dp(46), dp(46)));

                LinearLayout info = vertical();
                info.setPadding(dp(12), 0, dp(12), 0);
                TextView name = text("", 17, TEXT, true);
                TextView phone = text("", 13, MUTED, false);
                phone.setTextDirection(View.TEXT_DIRECTION_LTR);
                phone.setGravity(Gravity.RIGHT);
                TextView apps = text("", 12, ACCENT, false);
                info.addView(name);
                info.addView(phone);
                info.addView(apps);
                card.addView(info, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

                TextView arrow = text("‹", 28, ACCENT_2, false);
                arrow.setGravity(Gravity.CENTER);
                card.addView(arrow, new LinearLayout.LayoutParams(dp(28), dp(48)));
                holder = new RowHolder(avatar, name, phone, apps);
                card.setTag(holder);
                convertView = card;
            } else holder = (RowHolder) convertView.getTag();

            ContactRecord row = getItem(position);
            String name = row.displayName();
            holder.avatar.setText(name.isEmpty() ? "؟" : name.substring(0, 1).toUpperCase(new Locale("fa", "IR")));
            holder.name.setText(name);
            holder.phone.setText(row.joinedPhones());
            holder.apps.setText(row.appIds.isEmpty() ? "بدون اکشن پیام‌رسان ثبت‌شده" : row.joinedApps());
            holder.apps.setTextColor(row.appIds.isEmpty() ? MUTED : ACCENT);
            return convertView;
        }
    }

    private static final class RowHolder {
        final TextView avatar;
        final TextView name;
        final TextView phone;
        final TextView apps;
        RowHolder(TextView avatar, TextView name, TextView phone, TextView apps) { this.avatar = avatar; this.name = name; this.phone = phone; this.apps = apps; }
    }
}
