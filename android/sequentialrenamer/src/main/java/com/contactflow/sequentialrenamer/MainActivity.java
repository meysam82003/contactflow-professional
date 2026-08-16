package com.contactflow.sequentialrenamer;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.format.Formatter;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final int OPEN_FILES = 621;
    private static final int OPEN_FOLDER = 622;
    private static final int SAVE_REPORT = 623;
    private static final int BG = Color.rgb(8, 12, 21);
    private static final int PANEL = Color.rgb(20, 27, 42);
    private static final int PANEL_SOFT = Color.rgb(29, 39, 59);
    private static final int TEXT = Color.rgb(238, 244, 255);
    private static final int MUTED = Color.rgb(157, 170, 195);
    private static final int ACCENT = Color.rgb(83, 218, 190);
    private static final int ACCENT_2 = Color.rgb(101, 134, 255);
    private static final int DANGER = Color.rgb(255, 104, 123);

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ArrayList<RenameEntry> entries = new ArrayList<>();
    private final ArrayDeque<RenameAction> history = new ArrayDeque<>();
    private final QueueAdapter adapter = new QueueAdapter();
    private final ArrayList<Button> actionButtons = new ArrayList<>();

    private TextView currentNameText;
    private TextView detailText;
    private TextView statusText;
    private TextView progressText;
    private EditText nameBox;
    private CheckBox preserveExtension;
    private ListView queueList;
    private ProgressBar progress;
    private Button renameButton;
    private Button skipButton;
    private Button undoButton;
    private Button moveUpButton;
    private Button moveDownButton;
    private Button removeButton;
    private Button templateButton;
    private Button reportButton;
    private Button clearDoneButton;
    private int currentIndex = -1;
    private boolean suppressTextEvents;
    private boolean operationInProgress;
    private byte[] pendingReport;
    private String pendingReportName;

    private final Runnable deferredSave = () -> SessionStore.save(this, entries, currentIndex);

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        SessionStore.Session session = SessionStore.load(this);
        entries.addAll(session.entries);
        currentIndex = session.currentIndex;
        buildInterface();
        if (entries.isEmpty()) {
            showEmptyState();
            setStatus("فایل‌ها را انتخاب کن؛ برنامه بدون دسترسی کلی به حافظه کار می‌کند.", false);
        } else {
            selectIndex(Math.max(0, Math.min(currentIndex, entries.size() - 1)));
            setStatus("صف قبلی بازیابی شد؛ دسترسی فایل‌ها هنگام تغییرنام بررسی می‌شود.", false);
        }
    }

    @Override protected void onStop() {
        mainHandler.removeCallbacks(deferredSave);
        SessionStore.save(this, entries, currentIndex);
        super.onStop();
    }

    @Override protected void onDestroy() {
        mainHandler.removeCallbacks(deferredSave);
        worker.shutdownNow();
        super.onDestroy();
    }

    private void buildInterface() {
        LinearLayout root = vertical();
        root.setPadding(dp(14), dp(13), dp(14), dp(9));
        root.setBackgroundColor(BG);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        setContentView(root);

        LinearLayout header = horizontal();
        header.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout titleWrap = vertical();
        titleWrap.addView(text("تغییرنام ترتیبی فایل‌ها", 23, TEXT, true));
        titleWrap.addView(text("ContactFlow 3.6 • برنامهٔ بومی Android", 12, MUTED, false));
        header.addView(titleWrap, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        Button addFilesButton = trackedButton("انتخاب فایل‌ها", ACCENT_2, Color.WHITE);
        addFilesButton.setOnClickListener(view -> openFilePicker());
        header.addView(addFilesButton);
        root.addView(header);

        LinearLayout statusCard = vertical();
        statusCard.setPadding(dp(13), dp(10), dp(13), dp(10));
        statusCard.setBackground(rounded(PANEL, 15));
        LinearLayout.LayoutParams statusParams = matchWrap();
        statusParams.setMargins(0, dp(11), 0, dp(10));
        statusText = text("", 12, MUTED, false);
        statusCard.addView(statusText);
        root.addView(statusCard, statusParams);

        LinearLayout editorCard = vertical();
        editorCard.setPadding(dp(13), dp(11), dp(13), dp(10));
        editorCard.setBackground(rounded(PANEL, 16));
        currentNameText = text("هنوز فایلی انتخاب نشده", 17, TEXT, true);
        currentNameText.setSingleLine(true);
        currentNameText.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
        detailText = text("", 11, MUTED, false);
        editorCard.addView(currentNameText);
        editorCard.addView(detailText);

        nameBox = new EditText(this);
        nameBox.setSingleLine(true);
        nameBox.setHint("نام جدید را بنویس…");
        nameBox.setHintTextColor(MUTED);
        nameBox.setTextColor(TEXT);
        nameBox.setTextSize(18);
        nameBox.setSelectAllOnFocus(false);
        nameBox.setPadding(dp(13), dp(8), dp(13), dp(8));
        nameBox.setBackground(rounded(PANEL_SOFT, 12));
        nameBox.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        nameBox.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG_RTL);
        nameBox.setImeOptions(EditorInfo.IME_ACTION_NEXT);
        LinearLayout.LayoutParams nameParams = matchWrap();
        nameParams.setMargins(0, dp(9), 0, 0);
        editorCard.addView(nameBox, nameParams);

        preserveExtension = new CheckBox(this);
        preserveExtension.setText("پسوند اصلی حفظ شود");
        preserveExtension.setTextColor(TEXT);
        preserveExtension.setChecked(true);
        preserveExtension.setButtonTintList(new ColorStateList(new int[][]{new int[]{android.R.attr.state_checked}, new int[]{}}, new int[]{ACCENT, MUTED}));
        editorCard.addView(preserveExtension);

        LinearLayout primaryActions = horizontal();
        primaryActions.setGravity(Gravity.END);
        renameButton = trackedButton("ثبت و بعدی", ACCENT, Color.rgb(7, 26, 24));
        skipButton = trackedButton("رد کردن", PANEL_SOFT, TEXT);
        undoButton = trackedButton("برگرداندن", PANEL_SOFT, TEXT);
        primaryActions.addView(renameButton);
        primaryActions.addView(skipButton);
        primaryActions.addView(undoButton);
        editorCard.addView(primaryActions);
        root.addView(editorCard);

        HorizontalScrollView actionScroll = new HorizontalScrollView(this);
        actionScroll.setHorizontalScrollBarEnabled(false);
        LinearLayout secondaryActions = horizontal();
        secondaryActions.setPadding(0, dp(7), 0, dp(5));
        Button folderButton = trackedButton("افزودن پوشه", PANEL_SOFT, TEXT);
        templateButton = trackedButton("الگوی ترتیبی", PANEL_SOFT, TEXT);
        moveUpButton = trackedButton("بالا", PANEL_SOFT, TEXT);
        moveDownButton = trackedButton("پایین", PANEL_SOFT, TEXT);
        removeButton = trackedButton("حذف از صف", PANEL_SOFT, TEXT);
        clearDoneButton = trackedButton("پاک‌کردن انجام‌شده‌ها", PANEL_SOFT, TEXT);
        reportButton = trackedButton("گزارش CSV", PANEL_SOFT, TEXT);
        secondaryActions.addView(folderButton);
        secondaryActions.addView(templateButton);
        secondaryActions.addView(moveUpButton);
        secondaryActions.addView(moveDownButton);
        secondaryActions.addView(removeButton);
        secondaryActions.addView(clearDoneButton);
        secondaryActions.addView(reportButton);
        actionScroll.addView(secondaryActions, new HorizontalScrollView.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(actionScroll);

        LinearLayout progressRow = horizontal();
        progressText = text("صف خالی است", 11, MUTED, true);
        progressRow.addView(progressText, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        root.addView(progressRow);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(1);
        progress.setProgress(0);
        root.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(5)));

        queueList = new ListView(this);
        queueList.setAdapter(adapter);
        queueList.setDivider(null);
        queueList.setDividerHeight(dp(7));
        queueList.setBackgroundColor(BG);
        queueList.setPadding(0, dp(7), 0, dp(7));
        queueList.setClipToPadding(false);
        root.addView(queueList, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        TextView privacy = text("آفلاین • بدون مجوز اینترنت و حافظه • ذخیره فقط در محل انتخابی شما", 10, MUTED, false);
        privacy.setGravity(Gravity.CENTER);
        root.addView(privacy);

        renameButton.setOnClickListener(view -> renameCurrent());
        skipButton.setOnClickListener(view -> skipCurrent());
        undoButton.setOnClickListener(view -> undoLast());
        folderButton.setOnClickListener(view -> openFolderPicker());
        templateButton.setOnClickListener(view -> showTemplateDialog());
        moveUpButton.setOnClickListener(view -> moveCurrent(-1));
        moveDownButton.setOnClickListener(view -> moveCurrent(1));
        removeButton.setOnClickListener(view -> removeCurrent());
        clearDoneButton.setOnClickListener(view -> clearCompleted());
        reportButton.setOnClickListener(view -> saveReport());
        queueList.setOnItemClickListener((parent, view, position, id) -> { if (!operationInProgress) selectIndex(position); });
        nameBox.setOnEditorActionListener((view, actionId, event) -> {
            boolean keyboardNext = actionId == EditorInfo.IME_ACTION_NEXT;
            boolean hardwareEnter = event != null && event.getKeyCode() == android.view.KeyEvent.KEYCODE_ENTER
                    && event.getAction() == android.view.KeyEvent.ACTION_DOWN;
            if (keyboardNext || hardwareEnter) {
                renameCurrent();
                return true;
            }
            return false;
        });
        nameBox.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence value, int start, int count, int after) { }
            @Override public void onTextChanged(CharSequence value, int start, int before, int count) {
                if (suppressTextEvents || currentIndex < 0 || currentIndex >= entries.size()) return;
                entries.get(currentIndex).draftName = value.toString();
                adapter.notifyDataSetChanged();
                updateControls();
                scheduleSave();
            }
            @Override public void afterTextChanged(Editable value) { }
        });
        updateControls();
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try { startActivityForResult(intent, OPEN_FILES); }
        catch (Exception first) {
            Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
            fallback.addCategory(Intent.CATEGORY_OPENABLE);
            fallback.setType("*/*");
            fallback.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            fallback.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            try { startActivityForResult(Intent.createChooser(fallback, "انتخاب فایل‌ها"), OPEN_FILES); }
            catch (Exception second) { setStatus("انتخاب‌گر فایل در این دستگاه در دسترس نیست: " + second.getMessage(), true); }
        }
    }

    private void openFolderPicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(intent, OPEN_FOLDER);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null) {
            if (requestCode == OPEN_FILES || requestCode == OPEN_FOLDER) setStatus("انتخاب لغو شد؛ صف قبلی دست‌نخورده ماند.", false);
            return;
        }
        if (requestCode == OPEN_FILES) {
            LinkedHashSet<Uri> selected = new LinkedHashSet<>();
            ClipData clip = data.getClipData();
            if (clip != null) {
                for (int index = 0; index < clip.getItemCount(); index++) if (clip.getItemAt(index).getUri() != null) selected.add(clip.getItemAt(index).getUri());
            }
            if (data.getData() != null) selected.add(data.getData());
            ArrayList<Uri> uris = new ArrayList<>(selected);
            persistPermissions(data, uris);
            boolean writeGranted = (data.getFlags() & Intent.FLAG_GRANT_WRITE_URI_PERMISSION) != 0;
            addUris(uris, false, writeGranted);
        } else if (requestCode == OPEN_FOLDER && data.getData() != null) {
            Uri treeUri = data.getData();
            persistPermissions(data, Collections.singletonList(treeUri));
            addTree(treeUri);
        } else if (requestCode == SAVE_REPORT && data.getData() != null && pendingReport != null) {
            writeReport(data.getData(), pendingReport, pendingReportName);
            pendingReport = null;
            pendingReportName = null;
        }
    }

    private void persistPermissions(Intent data, List<Uri> uris) {
        int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        for (Uri uri : uris) {
            try { getContentResolver().takePersistableUriPermission(uri, flags); }
            catch (RuntimeException ignored) { }
        }
    }

    private void addTree(Uri treeUri) {
        if (operationInProgress) return;
        setBusy(true, "در حال خواندن فایل‌های پوشه…");
        worker.execute(() -> {
            try {
                List<Uri> uris = SafFileRepository.listTreeFiles(getContentResolver(), treeUri);
                runOnUiThread(() -> addUrisAfterBusy(uris, true));
            } catch (Exception exception) {
                runOnUiThread(() -> { setBusy(false, errorMessage(exception)); });
            }
        });
    }

    private void addUrisAfterBusy(List<Uri> uris, boolean naturalSort) {
        operationInProgress = false;
        addUris(uris, naturalSort, true);
    }

    private void addUris(List<Uri> uris, boolean naturalSort, boolean writeGranted) {
        if (uris.isEmpty()) { setBusy(false, "فایلی انتخاب نشد."); return; }
        if (operationInProgress) return;
        setBusy(true, "در حال آماده‌کردن " + formatNumber(uris.size()) + " فایل…");
        HashSet<String> existing = new HashSet<>();
        for (RenameEntry entry : entries) { existing.add(entry.originalUri); existing.add(entry.currentUri); }
        worker.execute(() -> {
            ArrayList<RenameEntry> added = new ArrayList<>();
            int failed = 0;
            String firstFailure = "";
            for (int index = 0; index < uris.size(); index++) {
                Uri uri = uris.get(index);
                if (uri == null || existing.contains(uri.toString())) continue;
                try {
                    RenameEntry entry = SafFileRepository.describe(getContentResolver(), uri);
                    if (!writeGranted) entry.renameSupported = false;
                    added.add(entry);
                    existing.add(uri.toString());
                } catch (Exception error) {
                    failed++;
                    if (firstFailure.isEmpty()) firstFailure = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
                }
                int processed = index + 1;
                if (processed % 10 == 0 || processed == uris.size()) runOnUiThread(() -> setStatus("در حال خواندن مشخصات فایل‌ها: " + formatNumber(processed) + " از " + formatNumber(uris.size()), false));
            }
            if (naturalSort) Collections.sort(added, (left, right) -> RenameRules.naturalCompare(left.currentName, right.currentName));
            int failedCount = failed;
            String failureDetail = firstFailure;
            runOnUiThread(() -> {
                int oldSize = entries.size();
                entries.addAll(added);
                operationInProgress = false;
                if (!entries.isEmpty() && currentIndex < 0) selectIndex(0);
                else refreshUi();
                String message = formatNumber(added.size()) + " فایل اضافه شد";
                if (failedCount > 0) message += "؛ " + formatNumber(failedCount) + " فایل بدون دسترسی رد شد";
                if (added.isEmpty() && failedCount > 0 && !failureDetail.isEmpty()) message += " • " + failureDetail;
                if (added.isEmpty() && failedCount == 0) message = "فایل تازه‌ای به صف اضافه نشد.";
                if (!writeGranted && !added.isEmpty()) message += "؛ این انتخاب‌گر فقط دسترسی خواندن داد، برای Rename از «افزودن پوشه» استفاده کن";
                setBusy(false, message + (entries.size() > oldSize ? "؛ ترتیب قابل جابه‌جایی است." : ""));
                scheduleSave();
            });
        });
    }

    private void selectIndex(int index) {
        if (entries.isEmpty()) { showEmptyState(); return; }
        currentIndex = Math.max(0, Math.min(index, entries.size() - 1));
        RenameEntry entry = entries.get(currentIndex);
        if (entry.draftName.trim().isEmpty()) entry.draftName = RenameRules.baseName(entry.currentName);
        currentNameText.setText(entry.currentName);
        String support = entry.renameSupported ? "قابل تغییرنام" : "ارائه‌دهنده Rename را اعلام نکرده";
        detailText.setText(formatNumber(currentIndex + 1) + " از " + formatNumber(entries.size()) + " • " + support + sizeLabel(entry.size));
        suppressTextEvents = true;
        nameBox.setText(entry.draftName);
        nameBox.setSelection(0, nameBox.length());
        suppressTextEvents = false;
        nameBox.requestFocus();
        queueList.setSelection(currentIndex);
        refreshUi();
        scheduleSave();
    }

    private void renameCurrent() {
        if (operationInProgress || currentIndex < 0 || currentIndex >= entries.size()) return;
        RenameEntry entry = entries.get(currentIndex);
        if (!entry.renameSupported) {
            entry.status = "پشتیبانی‌نشده";
            entry.lastError = "ارائه‌دهندهٔ این فایل FLAG_SUPPORTS_RENAME را ارائه نکرده است.";
            refreshUi();
            setStatus("این محل ذخیره‌سازی اجازهٔ تغییرنام به برنامه نمی‌دهد؛ فایل را به حافظهٔ داخلی یا SD منتقل کن.", true);
            scheduleSave();
            return;
        }
        final String destinationName;
        try {
            destinationName = RenameRules.destinationName(entry.currentName, nameBox.getText().toString(), preserveExtension.isChecked());
        } catch (Exception exception) {
            setStatus(errorMessage(exception), true);
            return;
        }
        if (destinationName.equals(entry.currentName)) {
            entry.status = "بدون تغییر";
            entry.lastError = "";
            refreshUi();
            setStatus("نام همین است؛ رفتیم فایل بعدی.", false);
            moveToNext();
            return;
        }
        int renameIndex = currentIndex;
        String beforeUri = entry.currentUri;
        String beforeName = entry.currentName;
        setBusy(true, "در حال تغییرنام «" + beforeName + "»…");
        worker.execute(() -> {
            try {
                Uri resultUri = SafFileRepository.rename(getContentResolver(), Uri.parse(beforeUri), destinationName);
                String actualName = SafFileRepository.displayName(getContentResolver(), resultUri, destinationName);
                boolean canRenameAgain = SafFileRepository.supportsRename(getContentResolver(), resultUri);
                runOnUiThread(() -> completeRename(entry, renameIndex, beforeUri, beforeName, resultUri, actualName, canRenameAgain));
            } catch (Exception exception) {
                runOnUiThread(() -> failOperation(entry, exception));
            }
        });
    }

    private void completeRename(RenameEntry entry, int renameIndex, String beforeUri, String beforeName, Uri resultUri, String actualName, boolean canRenameAgain) {
        entry.currentUri = resultUri.toString();
        entry.currentName = actualName;
        entry.draftName = RenameRules.baseName(actualName);
        entry.status = "انجام شد";
        entry.lastError = "";
        entry.renameSupported = canRenameAgain;
        history.push(new RenameAction(entry, beforeUri, resultUri.toString(), beforeName, actualName));
        operationInProgress = false;
        refreshUi();
        setBusy(false, "ثبت شد: " + actualName);
        if (currentIndex == renameIndex) moveToNext();
        scheduleSave();
    }

    private void failOperation(RenameEntry entry, Exception exception) {
        operationInProgress = false;
        entry.status = "خطا";
        entry.lastError = errorMessage(exception);
        refreshUi();
        setBusy(false, entry.lastError);
        scheduleSave();
    }

    private void skipCurrent() {
        if (operationInProgress || currentIndex < 0 || currentIndex >= entries.size()) return;
        RenameEntry entry = entries.get(currentIndex);
        entry.status = "رد شد";
        entry.lastError = "";
        refreshUi();
        setStatus("فایل رد شد؛ رفتیم بعدی.", false);
        moveToNext();
    }

    private void moveToNext() {
        if (currentIndex + 1 < entries.size()) selectIndex(currentIndex + 1);
        else {
            refreshUi();
            nameBox.requestFocus();
            nameBox.setSelection(0, nameBox.length());
            setStatus("به انتهای صف رسیدی؛ ردیف خطادار یا ردشده را می‌توانی دوباره انتخاب کنی.", false);
        }
    }

    private void undoLast() {
        if (operationInProgress || history.isEmpty()) return;
        RenameAction action = history.pop();
        setBusy(true, "در حال برگرداندن «" + action.afterName + "»…");
        worker.execute(() -> {
            try {
                Uri resultUri = SafFileRepository.rename(getContentResolver(), Uri.parse(action.afterUri), action.beforeName);
                String actualName = SafFileRepository.displayName(getContentResolver(), resultUri, action.beforeName);
                boolean canRenameAgain = SafFileRepository.supportsRename(getContentResolver(), resultUri);
                runOnUiThread(() -> {
                    action.entry.currentUri = resultUri.toString();
                    action.entry.currentName = actualName;
                    action.entry.draftName = RenameRules.baseName(actualName);
                    action.entry.status = "برگردانده شد";
                    action.entry.lastError = "";
                    action.entry.renameSupported = canRenameAgain;
                    operationInProgress = false;
                    int index = entries.indexOf(action.entry);
                    if (index >= 0) selectIndex(index); else refreshUi();
                    setBusy(false, "آخرین تغییرنام برگردانده شد.");
                    scheduleSave();
                });
            } catch (Exception exception) {
                runOnUiThread(() -> {
                    history.push(action);
                    operationInProgress = false;
                    setBusy(false, errorMessage(exception));
                });
            }
        });
    }

    private void moveCurrent(int offset) {
        if (operationInProgress || currentIndex < 0) return;
        int target = currentIndex + offset;
        if (target < 0 || target >= entries.size()) return;
        RenameEntry value = entries.remove(currentIndex);
        entries.add(target, value);
        selectIndex(target);
        setStatus("ترتیب صف تغییر کرد.", false);
    }

    private void removeCurrent() {
        if (operationInProgress || currentIndex < 0 || currentIndex >= entries.size()) return;
        RenameEntry removed = entries.remove(currentIndex);
        removeHistoryForMissingEntry(removed);
        if (entries.isEmpty()) {
            currentIndex = -1;
            SessionStore.clear(this);
            showEmptyState();
            setStatus("فایل فقط از صف حذف شد؛ خود فایل پاک نشده است.", false);
        } else {
            selectIndex(Math.min(currentIndex, entries.size() - 1));
            setStatus("فایل فقط از صف حذف شد؛ خود فایل پاک نشده است.", false);
        }
    }

    private void clearCompleted() {
        if (operationInProgress || entries.isEmpty()) return;
        int before = entries.size();
        for (int index = entries.size() - 1; index >= 0; index--) {
            RenameEntry entry = entries.get(index);
            if (entry.status.equals("انجام شد") || entry.status.equals("بدون تغییر") || entry.status.equals("رد شد")) entries.remove(index);
        }
        Iterator<RenameAction> actions = history.iterator();
        while (actions.hasNext()) if (!entries.contains(actions.next().entry)) actions.remove();
        int removed = before - entries.size();
        if (entries.isEmpty()) {
            currentIndex = -1;
            showEmptyState();
        } else selectIndex(Math.min(Math.max(currentIndex, 0), entries.size() - 1));
        setStatus(removed == 0 ? "ردیف انجام‌شده‌ای برای پاک‌کردن نبود." : formatNumber(removed) + " ردیف از صف پاک شد؛ فایل‌ها سر جایشان هستند.", false);
        scheduleSave();
    }

    private void removeHistoryForMissingEntry(RenameEntry removed) {
        Iterator<RenameAction> actions = history.iterator();
        while (actions.hasNext()) if (actions.next().entry == removed) actions.remove();
    }

    private void showTemplateDialog() {
        if (operationInProgress || entries.isEmpty()) return;
        LinearLayout box = vertical();
        box.setPadding(dp(20), dp(8), dp(20), 0);
        EditText template = new EditText(this);
        template.setHint("مثلاً عکس {n:000}");
        template.setText("فایل {n:000}");
        template.setSingleLine(true);
        template.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        EditText start = new EditText(this);
        start.setHint("شمارهٔ شروع");
        start.setText("1");
        start.setSingleLine(true);
        start.setInputType(InputType.TYPE_CLASS_NUMBER);
        box.addView(template);
        box.addView(start);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("نام پیشنهادی برای باقی صف")
                .setMessage("{n} شمارهٔ ساده و {n:000} شمارهٔ سه‌رقمی می‌سازد؛ هر فایل همچنان جداگانه تأیید می‌شود.")
                .setView(box)
                .setNegativeButton("انصراف", null)
                .setPositiveButton("ساخت پیشنهادها", null)
                .create();
        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(view -> {
            int number;
            try { number = Integer.parseInt(start.getText().toString().trim()); }
            catch (Exception exception) { start.setError("عدد معتبر وارد کن"); return; }
            for (int index = Math.max(currentIndex, 0); index < entries.size(); index++) {
                entries.get(index).draftName = RenameRules.applySequenceTemplate(template.getText().toString(), number++);
            }
            dialog.dismiss();
            selectIndex(Math.max(currentIndex, 0));
            setStatus("نام‌های پیشنهادی ساخته شد؛ با «ثبت و بعدی» هر فایل را تأیید کن.", false);
        }));
        dialog.show();
    }

    private void saveReport() {
        if (operationInProgress || entries.isEmpty()) return;
        pendingReportName = "ContactFlow_Rename_Report_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.ROOT).format(new Date()) + ".csv";
        pendingReport = buildReport();
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/csv");
        intent.putExtra(Intent.EXTRA_TITLE, pendingReportName);
        startActivityForResult(intent, SAVE_REPORT);
    }

    private byte[] buildReport() {
        StringBuilder csv = new StringBuilder("\uFEFFrow,original_name,current_name,status,error,original_uri,current_uri\r\n");
        for (int index = 0; index < entries.size(); index++) {
            RenameEntry entry = entries.get(index);
            csv.append(index + 1).append(',').append(csvCell(entry.originalName)).append(',').append(csvCell(entry.currentName)).append(',')
                    .append(csvCell(entry.status)).append(',').append(csvCell(entry.lastError)).append(',')
                    .append(csvCell(entry.originalUri)).append(',').append(csvCell(entry.currentUri)).append("\r\n");
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void writeReport(Uri uri, byte[] bytes, String name) {
        setBusy(true, "در حال ذخیرهٔ گزارش…");
        worker.execute(() -> {
            try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("مسیر خروجی باز نشد.");
                output.write(bytes);
                output.flush();
                runOnUiThread(() -> { operationInProgress = false; setBusy(false, "گزارش ذخیره شد: " + name); });
            } catch (Exception exception) {
                runOnUiThread(() -> { operationInProgress = false; setBusy(false, errorMessage(exception)); });
            }
        });
    }

    private static String csvCell(String value) {
        String safe = value == null ? "" : value;
        int first = 0;
        while (first < safe.length() && Character.isWhitespace(safe.charAt(first))) first++;
        String trimmed = safe.substring(first);
        if (!trimmed.isEmpty() && "=+-@".indexOf(trimmed.charAt(0)) >= 0) safe = "'" + safe;
        return '"' + safe.replace("\"", "\"\"") + '"';
    }

    private void refreshUi() {
        adapter.notifyDataSetChanged();
        int completed = 0;
        for (RenameEntry entry : entries) if (entry.status.equals("انجام شد") || entry.status.equals("بدون تغییر")) completed++;
        progress.setMax(Math.max(1, entries.size()));
        progress.setProgress(completed);
        progressText.setText(entries.isEmpty() ? "صف خالی است" : formatNumber(completed) + " انجام‌شده از " + formatNumber(entries.size()) + " فایل");
        updateControls();
    }

    private void showEmptyState() {
        currentNameText.setText("هنوز فایلی انتخاب نشده");
        detailText.setText("چند فایل یا یک پوشه انتخاب کن");
        suppressTextEvents = true;
        nameBox.setText("");
        suppressTextEvents = false;
        adapter.notifyDataSetChanged();
        progress.setMax(1);
        progress.setProgress(0);
        progressText.setText("صف خالی است");
        updateControls();
    }

    private void setBusy(boolean busy, String message) {
        operationInProgress = busy;
        nameBox.setEnabled(!busy && currentIndex >= 0);
        preserveExtension.setEnabled(!busy && currentIndex >= 0);
        queueList.setEnabled(!busy);
        for (Button button : actionButtons) button.setEnabled(!busy);
        setStatus(message, busy ? false : messageLooksLikeError(message));
        updateControls();
    }

    private void updateControls() {
        boolean hasCurrent = currentIndex >= 0 && currentIndex < entries.size();
        if (operationInProgress) {
            for (Button button : actionButtons) button.setEnabled(false);
            return;
        }
        nameBox.setEnabled(hasCurrent);
        preserveExtension.setEnabled(hasCurrent);
        queueList.setEnabled(true);
        for (Button button : actionButtons) button.setEnabled(true);
        renameButton.setEnabled(hasCurrent && !nameBox.getText().toString().trim().isEmpty());
        skipButton.setEnabled(hasCurrent);
        undoButton.setEnabled(!history.isEmpty());
        moveUpButton.setEnabled(hasCurrent && currentIndex > 0);
        moveDownButton.setEnabled(hasCurrent && currentIndex + 1 < entries.size());
        removeButton.setEnabled(hasCurrent);
        templateButton.setEnabled(!entries.isEmpty());
        reportButton.setEnabled(!entries.isEmpty());
        clearDoneButton.setEnabled(!entries.isEmpty());
    }

    private void setStatus(String message, boolean error) {
        statusText.setText(message);
        statusText.setTextColor(error ? DANGER : MUTED);
    }

    private void scheduleSave() {
        mainHandler.removeCallbacks(deferredSave);
        mainHandler.postDelayed(deferredSave, 250L);
    }

    private Button trackedButton(String label, int background, int foreground) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(foreground);
        button.setTextSize(12);
        button.setAllCaps(false);
        button.setMinHeight(dp(38));
        button.setMinWidth(dp(82));
        button.setPadding(dp(10), 0, dp(10), 0);
        button.setBackground(rounded(background, 11));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(42));
        params.setMargins(dp(4), dp(3), dp(4), dp(3));
        button.setLayoutParams(params);
        actionButtons.add(button);
        return button;
    }

    private LinearLayout vertical() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        return layout;
    }

    private LinearLayout horizontal() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.HORIZONTAL);
        layout.setGravity(Gravity.END);
        layout.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        return layout;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG_RTL);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radius));
        return drawable;
    }

    private LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    }

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private String sizeLabel(long size) {
        return size < 0 ? "" : " • " + Formatter.formatShortFileSize(this, size);
    }

    private static String formatNumber(long value) { return String.format(new Locale("fa"), "%,d", value); }

    private static String errorMessage(Exception exception) {
        String value = exception.getMessage();
        if (value == null || value.trim().isEmpty()) value = exception.getClass().getSimpleName();
        return "تغییر انجام نشد: " + value;
    }

    private static boolean messageLooksLikeError(String message) {
        return message.startsWith("تغییر انجام نشد") || message.contains("دسترسی") || message.contains("معتبر نیست");
    }

    private final class QueueAdapter extends BaseAdapter {
        @Override public int getCount() { return entries.size(); }
        @Override public RenameEntry getItem(int position) { return entries.get(position); }
        @Override public long getItemId(int position) { return position; }

        @Override public View getView(int position, View convertView, ViewGroup parent) {
            RowHolder holder;
            if (convertView == null) {
                LinearLayout card = vertical();
                card.setPadding(dp(12), dp(8), dp(12), dp(8));
                TextView title = text("", 14, TEXT, true);
                TextView draft = text("", 12, ACCENT, false);
                TextView meta = text("", 10, MUTED, false);
                card.addView(title);
                card.addView(draft);
                card.addView(meta);
                holder = new RowHolder(card, title, draft, meta);
                card.setTag(holder);
                convertView = card;
            } else holder = (RowHolder) convertView.getTag();
            RenameEntry entry = getItem(position);
            holder.card.setBackground(rounded(position == currentIndex ? Color.rgb(31, 55, 64) : PANEL, 13));
            holder.title.setText(formatNumber(position + 1) + ".  " + entry.currentName);
            holder.draft.setText(entry.draftName.trim().isEmpty() ? "نام پیشنهادی: —" : "نام پیشنهادی: " + entry.draftName);
            int statusColor = entry.status.equals("انجام شد") ? ACCENT : (entry.status.equals("خطا") || entry.status.equals("پشتیبانی‌نشده")) ? DANGER : MUTED;
            holder.meta.setTextColor(statusColor);
            String meta = entry.status + sizeLabel(entry.size);
            if (!entry.renameSupported) meta += " • Rename پشتیبانی نمی‌شود";
            if (!entry.lastError.isEmpty()) meta += " • " + entry.lastError;
            holder.meta.setText(meta);
            return convertView;
        }
    }

    private static final class RowHolder {
        final LinearLayout card;
        final TextView title;
        final TextView draft;
        final TextView meta;

        RowHolder(LinearLayout card, TextView title, TextView draft, TextView meta) {
            this.card = card;
            this.title = title;
            this.draft = draft;
            this.meta = meta;
        }
    }
}
