package com.contactflow.messengercontacts;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.text.Editable;
import android.text.TextWatcher;
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

import java.io.OutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private static final int CONTACTS_PERMISSION = 361;
    private static final int SAVE_DOCUMENT = 362;
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
    private String currentFilter = "has_any";
    private byte[] pendingBytes;
    private String pendingName;
    private String pendingMime;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        if (Build.VERSION.SDK_INT >= 23) getWindow().getDecorView().setSystemUiVisibility(0);
        currentFilter = getPreferences(MODE_PRIVATE).getString("messenger_filter", "has_any");
        buildInterface();
        if (hasContactsPermission()) scanContacts(); else showPermissionState();
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

    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != CONTACTS_PERMISSION) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) scanContacts();
        else {
            statusText.setText("مجوز مخاطبین داده نشد.");
            resultText.setText("بدون READ_CONTACTS امکان تشخیص اکشن‌های تلگرام، واتساپ و سایر برنامه‌ها وجود ندارد.");
            emptyText.setText("مجوز رد شده است؛ برای تلاش دوباره روی دکمهٔ دسترسی بزنید.");
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
                List<ContactRecord> result = ContactScanner.scan(getContentResolver());
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

    private void finishScan(List<ContactRecord> result) {
        allContacts.clear();
        allContacts.addAll(result);
        progress.setVisibility(View.GONE);
        scanButton.setEnabled(true);
        scanButton.setText("اسکن مجدد");
        int withApps = 0, appSignals = 0;
        for (ContactRecord row : allContacts) { if (!row.appIds.isEmpty()) withApps++; appSignals += row.appIds.size(); }
        statusText.setText(String.format(new Locale("fa", "IR"), "%d مخاطب دارای شماره خوانده شد", allContacts.size()));
        resultText.setText(String.format(new Locale("fa", "IR"), "%d مخاطب دارای اکشن پیام‌رسان • %d اتصال تشخیص‌داده‌شده", withApps, appSignals));
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
    private String localNumber(int value) { return String.format(new Locale("fa", "IR"), "%d", value); }

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
