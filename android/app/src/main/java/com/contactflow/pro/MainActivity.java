package com.contactflow.pro;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.*;
import android.widget.EditText;
import android.widget.Toast;
import android.util.Base64;
import java.io.*;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER = 4201;
    private static final int STORAGE_PERMISSION = 4202;
    private static final String PREFS = "contactflow";
    private static final String KEY_URL = "server_url";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingName, pendingMime, pendingBase64;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        String url = getServerUrl();
        if (url.length() == 0) showServerDialog(true); else loadServer(url);
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " ContactFlowAndroid/1.3");
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.addJavascriptInterface(new AndroidBridge(), "ContactFlowAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }
            @Override @SuppressWarnings("deprecation") public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (Build.VERSION.SDK_INT >= 23 && req.isForMainFrame()) Toast.makeText(MainActivity.this, "اتصال به ContactFlow برقرار نشد.", Toast.LENGTH_LONG).show();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try { startActivityForResult(params.createIntent(), FILE_CHOOSER); return true; }
                catch (Exception e) { fileCallback=null; Toast.makeText(MainActivity.this,"File picker unavailable",Toast.LENGTH_LONG).show(); return false; }
            }
        });
    }

    private boolean handleUrl(Uri uri) {
        String base = getServerUrl();
        try {
            Uri b = Uri.parse(base);
            if ("https".equalsIgnoreCase(uri.getScheme()) && b.getHost()!=null && b.getHost().equalsIgnoreCase(uri.getHost())) return false;
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch(Exception e) { return false; }
    }

    private String normalizeUrl(String raw) {
        String x = raw == null ? "" : raw.trim();
        while (x.endsWith("/")) x=x.substring(0,x.length()-1);
        Uri u=Uri.parse(x);
        if (!"https".equalsIgnoreCase(u.getScheme()) || u.getHost()==null || u.getHost().length()==0) return "";
        return x;
    }

    private String getServerUrl() { return getSharedPreferences(PREFS,MODE_PRIVATE).getString(KEY_URL,""); }
    private void setServerUrl(String url) { getSharedPreferences(PREFS,MODE_PRIVATE).edit().putString(KEY_URL,url).apply(); }
    private void loadServer(String url) { webView.loadUrl(url + "/"); }

    private void showServerDialog(final boolean required) {
        final EditText input = new EditText(this);
        input.setHint("https://example.ir/contactflow");
        input.setSingleLine(true);
        input.setText(getServerUrl());
        AlertDialog.Builder b = new AlertDialog.Builder(this)
            .setTitle("آدرس ContactFlow")
            .setMessage("همان آدرسی را وارد کنید که install.php بعد از نصب نشان می‌دهد.")
            .setView(input)
            .setPositiveButton("ذخیره", null);
        if (!required) b.setNegativeButton("انصراف", null);
        final AlertDialog d=b.create();
        d.setOnShowListener(v -> d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v2 -> {
            String url=normalizeUrl(input.getText().toString());
            if(url.length()==0){input.setError("آدرس باید HTTPS معتبر باشد");return;}
            setServerUrl(url);d.dismiss();loadServer(url);
        }));
        d.setCancelable(!required);
        d.show();
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
        super.onActivityResult(requestCode,resultCode,data);
        if (requestCode==FILE_CHOOSER && fileCallback!=null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
            fileCallback=null;
        }
    }

    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==STORAGE_PERMISSION && pendingBase64!=null) {
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) saveLegacy(pendingName,pendingMime,pendingBase64);
            else Toast.makeText(this,"مجوز ذخیره فایل داده نشد.",Toast.LENGTH_LONG).show();
            pendingName=pendingMime=pendingBase64=null;
        }
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }

    private String safeFileName(String name) {
        String n=(name==null||name.trim().length()==0)?"contactflow.bin":name.trim();
        return n.replaceAll("[\\\\/:*?\"<>|]","_");
    }

    private void saveLegacy(String name,String mime,String b64) {
        try {
            byte[] data=Base64.decode(b64,Base64.DEFAULT);
            File dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if(!dir.exists()) dir.mkdirs();
            File f=new File(dir,safeFileName(name));
            FileOutputStream out=new FileOutputStream(f);out.write(data);out.close();
            sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE,Uri.fromFile(f)));
            Toast.makeText(this,"ذخیره شد: "+f.getName(),Toast.LENGTH_LONG).show();
        } catch(Exception e) { Toast.makeText(this,"ذخیره ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show(); }
    }

    private void saveModern(String name,String mime,String b64) {
        try {
            byte[] data=Base64.decode(b64,Base64.DEFAULT);
            ContentValues v=new ContentValues();
            v.put(MediaStore.Downloads.DISPLAY_NAME,safeFileName(name));
            v.put(MediaStore.Downloads.MIME_TYPE,(mime==null||mime.length()==0)?"application/octet-stream":mime);
            v.put(MediaStore.Downloads.IS_PENDING,1);
            Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,v);
            if(uri==null)throw new IOException("Cannot create download");
            OutputStream out=getContentResolver().openOutputStream(uri); if(out==null)throw new IOException("Cannot open download");
            out.write(data);out.close();v.clear();v.put(MediaStore.Downloads.IS_PENDING,0);getContentResolver().update(uri,v,null,null);
            Toast.makeText(this,"فایل در Downloads ذخیره شد.",Toast.LENGTH_LONG).show();
        } catch(Exception e) { Toast.makeText(this,"ذخیره ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show(); }
    }

    public class AndroidBridge {
        @JavascriptInterface public String getServerUrl() { return MainActivity.this.getServerUrl(); }
        @JavascriptInterface public void openServerSettings() { runOnUiThread(() -> showServerDialog(false)); }
        @JavascriptInterface public void saveFile(final String name,final String mime,final String base64) {
            runOnUiThread(() -> {
                if(Build.VERSION.SDK_INT>=29){saveModern(name,mime,base64);return;}
                if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED){
                    pendingName=name;pendingMime=mime;pendingBase64=base64;requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},STORAGE_PERMISSION);return;
                }
                saveLegacy(name,mime,base64);
            });
        }
    }
}
