package com.contactflow.pro;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.*;
import android.widget.Toast;
import android.util.Base64;
import java.io.*;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER = 4201;
    private static final int STORAGE_PERMISSION = 4202;
    private static final String APP_URL = "file:///android_asset/index.html";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingName, pendingMime, pendingBase64;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        configureWebView();
        webView.loadUrl(APP_URL);
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            s.setAllowFileAccessFromFileURLs(false);
            s.setAllowUniversalAccessFromFileURLs(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " ContactFlowPersonalUltimate/3.0");
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
        if (uri == null) return false;
        String scheme = uri.getScheme();
        if (scheme == null || "file".equalsIgnoreCase(scheme)) return false;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        } catch(Exception e) {
            Toast.makeText(this,"امکان باز کردن لینک وجود ندارد.",Toast.LENGTH_SHORT).show();
            return true;
        }
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

    private void saveFile(String name,String mime,String base64) {
        if(Build.VERSION.SDK_INT>=29){saveModern(name,mime,base64);return;}
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED){
            pendingName=name;pendingMime=mime;pendingBase64=base64;requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},STORAGE_PERMISSION);return;
        }
        saveLegacy(name,mime,base64);
    }

    public class AndroidBridge {
        @JavascriptInterface public String nativeCapabilities() {
            return "{\"ok\":true,\"connector\":true,\"telegramQr\":false,\"reason\":\"tdlib_not_configured\",\"filePicker\":true,\"platform\":\"android\",\"version\":\"3.0.0-alpha.1\"}";
        }

        @JavascriptInterface public String startTelegramQr() {
            return "{\"ok\":false,\"code\":\"not_configured\",\"error\":\"TDLib Native Connector / Telegram App credentials are not configured in this build. No fake QR is generated.\"}";
        }

        @JavascriptInterface public void saveFile(final String name,final String mime,final String base64) {
            runOnUiThread(() -> MainActivity.this.saveFile(name,mime,base64));
        }

        @JavascriptInterface public void saveDocument(final String name,final String mime,final String base64) {
            runOnUiThread(() -> MainActivity.this.saveFile(name,mime,base64));
        }
    }
}
