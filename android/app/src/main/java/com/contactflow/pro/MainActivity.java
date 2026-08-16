package com.contactflow.pro;

import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.ContactsContract;
import android.content.*;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.webkit.*;
import android.widget.Toast;
import android.util.Base64;
import androidx.webkit.WebViewAssetLoader;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.util.HashSet;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER = 4201;
    private static final int STORAGE_PERMISSION = 4202;
    private static final int SAVE_DOCUMENT = 4203;
    private static final int OPEN_BACKUP = 4204;
    private static final int OCR_IMAGE = 4205;
    private static final int CONTACTS_PERMISSION = 4206;
    private static final int SAVE_DOCUMENT_STREAM = 4207;
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/index.html";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingName, pendingMime, pendingBase64;
    private final Object streamSaveLock = new Object();
    private String pendingStreamToken, pendingStreamName;
    private Uri pendingStreamUri;
    private OutputStream pendingStreamOutput;
    private long pendingStreamExpected = -1L, pendingStreamWritten = 0L;
    private WebViewAssetLoader assetLoader;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
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
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            s.setAllowFileAccessFromFileURLs(false);
            s.setAllowUniversalAccessFromFileURLs(false);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " ContactFlowPersonalUltimate/3.6");
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.addJavascriptInterface(new AndroidBridge(), "ContactFlowAndroid");
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override @SuppressWarnings("deprecation") public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return handleUrl(request.getUrl()); }
            @Override @SuppressWarnings("deprecation") public boolean shouldOverrideUrlLoading(WebView view, String url) { return handleUrl(Uri.parse(url)); }
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
        String host = uri.getHost();
        if (("https".equalsIgnoreCase(scheme) && "appassets.androidplatform.net".equalsIgnoreCase(host))) return false;
        if (scheme == null) return false;
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
            fileCallback=null; return;
        }
        if(requestCode==SAVE_DOCUMENT) {
            if(resultCode==RESULT_OK && data!=null && data.getData()!=null && pendingBase64!=null) writePendingDocument(data.getData());
            pendingName=pendingMime=pendingBase64=null; return;
        }
        if(requestCode==SAVE_DOCUMENT_STREAM) {
            handleStreamDocumentResult(resultCode,data);
            return;
        }
        if(requestCode==OPEN_BACKUP && resultCode==RESULT_OK && data!=null && data.getData()!=null) readBackupDocument(data.getData());
        if(requestCode==OCR_IMAGE && resultCode==RESULT_OK && data!=null && data.getData()!=null) recognizeImage(data.getData());
    }

    private void writePendingDocument(Uri uri) {
        try {
            byte[] bytes=Base64.decode(pendingBase64,Base64.DEFAULT);
            OutputStream out=getContentResolver().openOutputStream(uri,"w");
            if(out==null)throw new IOException("Cannot open destination");
            out.write(bytes);out.close();
            Toast.makeText(this,"فایل ذخیره شد.",Toast.LENGTH_LONG).show();
        } catch(Exception e) { Toast.makeText(this,"ذخیره ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show(); }
    }

    private void chooseStreamDocument(String name,String mime,String token,String expectedBytes) {
        String replacedToken=pendingStreamToken;
        abortStreamDocument(null,false);
        if(replacedToken!=null)notifyStreamDocumentReady(replacedToken,false,"یک ذخیرهٔ جدید جایگزین عملیات قبلی شد.");
        pendingStreamToken=token;
        pendingStreamName=safeFileName(name);
        pendingMime=(mime==null||mime.length()==0)?"application/octet-stream":mime;
        try {pendingStreamExpected=Long.parseLong(expectedBytes);} catch(Exception ignored) {pendingStreamExpected=-1L;}
        pendingStreamWritten=0L;
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(pendingMime);
        intent.putExtra(Intent.EXTRA_TITLE,pendingStreamName);
        try {startActivityForResult(intent,SAVE_DOCUMENT_STREAM);}
        catch(Exception error) {
            String failedToken=pendingStreamToken;
            clearStreamDocument(false);
            notifyStreamDocumentReady(failedToken,false,"پنجره ذخیره در دسترس نیست: "+error.getMessage());
        }
    }

    private void handleStreamDocumentResult(int resultCode,Intent data) {
        String token=pendingStreamToken;
        if(token==null)return;
        if(resultCode!=RESULT_OK||data==null||data.getData()==null) {
            clearStreamDocument(false);
            notifyStreamDocumentReady(token,false,"ذخیره توسط کاربر لغو شد.");
            return;
        }
        synchronized(streamSaveLock) {
            try {
                pendingStreamUri=data.getData();
                OutputStream raw=getContentResolver().openOutputStream(pendingStreamUri,"w");
                if(raw==null)throw new IOException("مسیر خروجی باز نشد.");
                pendingStreamOutput=new BufferedOutputStream(raw,256*1024);
            } catch(Exception error) {
                clearStreamDocument(true);
                notifyStreamDocumentReady(token,false,"بازکردن مقصد ناموفق: "+error.getMessage());
                return;
            }
        }
        notifyStreamDocumentReady(token,true,"");
    }

    private String appendStreamDocument(String token,String base64) {
        synchronized(streamSaveLock) {
            if(token==null||!token.equals(pendingStreamToken)||pendingStreamOutput==null)return "نشست ذخیره منقضی شده است.";
            try {
                byte[] bytes=Base64.decode(base64,Base64.DEFAULT);
                pendingStreamOutput.write(bytes);
                pendingStreamWritten+=bytes.length;
                if(pendingStreamExpected>=0&&pendingStreamWritten>pendingStreamExpected)throw new IOException("حجم داده از اندازه اعلام‌شده بیشتر شد.");
                return "";
            } catch(Exception error) {return "نوشتن Backup ناموفق: "+error.getMessage();}
        }
    }

    private String finishStreamDocument(String token) {
        synchronized(streamSaveLock) {
            if(token==null||!token.equals(pendingStreamToken)||pendingStreamOutput==null)return "نشست ذخیره منقضی شده است.";
            try {
                if(pendingStreamExpected>=0&&pendingStreamWritten!=pendingStreamExpected)throw new IOException("اندازه فایل کامل نیست: "+pendingStreamWritten+" از "+pendingStreamExpected+" بایت");
                pendingStreamOutput.flush();
                pendingStreamOutput.close();
                String name=pendingStreamName;
                clearStreamDocument(false);
                runOnUiThread(() -> Toast.makeText(this,"فایل کامل ذخیره شد: "+name,Toast.LENGTH_LONG).show());
                return "";
            } catch(Exception error) {
                String message="نهایی‌سازی Backup ناموفق: "+error.getMessage();
                clearStreamDocument(true);
                return message;
            }
        }
    }

    private void abortStreamDocument(String token,boolean showToast) {
        synchronized(streamSaveLock) {
            if(token!=null&&!token.equals(pendingStreamToken))return;
            boolean hadSession=pendingStreamToken!=null;
            clearStreamDocument(true);
            if(showToast&&hadSession)runOnUiThread(() -> Toast.makeText(this,"ذخیره ناقص پاک شد.",Toast.LENGTH_SHORT).show());
        }
    }

    private void clearStreamDocument(boolean deletePartial) {
        try {if(pendingStreamOutput!=null)pendingStreamOutput.close();} catch(Exception ignored) {}
        if(deletePartial&&pendingStreamUri!=null)try {getContentResolver().delete(pendingStreamUri,null,null);} catch(Exception ignored) {}
        pendingStreamOutput=null;pendingStreamUri=null;pendingStreamToken=null;pendingStreamName=null;pendingStreamExpected=-1L;pendingStreamWritten=0L;
    }

    private void notifyStreamDocumentReady(String token,boolean ok,String message) {
        if(token==null)return;
        final String js="window.ContactFlowFileSave&&window.ContactFlowFileSave.onAndroidDocumentReady("+jsString(token)+","+(ok?"true":"false")+","+jsString(message==null?"":message)+")";
        webView.post(() -> webView.evaluateJavascript(js,null));
    }

    private void readBackupDocument(Uri uri) {
        try {
            InputStream in=getContentResolver().openInputStream(uri);if(in==null)throw new IOException("Cannot open backup");
            ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[65536];int n,total=0;
            while((n=in.read(buf))>0){total+=n;if(total>100*1024*1024)throw new IOException("Backup is larger than 100 MB");out.write(buf,0,n);}in.close();
            String b64=Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);
            String name="backup.cfbackup";String mime=getContentResolver().getType(uri);if(mime==null)mime="application/x-contactflow-backup";
            final String js="window.ContactFlowDriveNative&&window.ContactFlowDriveNative.onRestoreFile("+jsString(name)+","+jsString(mime)+","+jsString(b64)+")";
            webView.evaluateJavascript(js,null);
        } catch(Exception e) { Toast.makeText(this,"خواندن Backup ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show(); }
    }

    private String jsString(String s){return "\""+s.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r").replace("\u2028","\\u2028").replace("\u2029","\\u2029")+"\"";}

    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results) {
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==STORAGE_PERMISSION && pendingBase64!=null) {
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) saveLegacy(pendingName,pendingMime,pendingBase64);
            else Toast.makeText(this,"مجوز ذخیره فایل داده نشد.",Toast.LENGTH_LONG).show();
            pendingName=pendingMime=pendingBase64=null;
        }
        if(requestCode==CONTACTS_PERMISSION) {
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED) deliverDeviceContacts();
            else Toast.makeText(this,"مجوز خواندن مخاطبین داده نشد.",Toast.LENGTH_LONG).show();
        }
    }

    @Override public void onBackPressed() { if (webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() {abortStreamDocument(null,false);if(webView!=null)webView.destroy();super.onDestroy();}
    private String safeFileName(String name) {String n=(name==null||name.trim().length()==0)?"contactflow.bin":name.trim();return n.replaceAll("[\\\\/:*?\"<>|]","_");}

    private void saveLegacy(String name,String mime,String b64) {
        try {byte[] data=Base64.decode(b64,Base64.DEFAULT);File dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);if(!dir.exists())dir.mkdirs();File f=new File(dir,safeFileName(name));FileOutputStream out=new FileOutputStream(f);out.write(data);out.close();sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE,Uri.fromFile(f)));Toast.makeText(this,"ذخیره شد: "+f.getName(),Toast.LENGTH_LONG).show();} catch(Exception e) {Toast.makeText(this,"ذخیره ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show();}
    }
    private void saveModern(String name,String mime,String b64) {
        try {byte[] data=Base64.decode(b64,Base64.DEFAULT);ContentValues v=new ContentValues();v.put(MediaStore.Downloads.DISPLAY_NAME,safeFileName(name));v.put(MediaStore.Downloads.MIME_TYPE,(mime==null||mime.length()==0)?"application/octet-stream":mime);v.put(MediaStore.Downloads.IS_PENDING,1);Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,v);if(uri==null)throw new IOException("Cannot create download");OutputStream out=getContentResolver().openOutputStream(uri);if(out==null)throw new IOException("Cannot open download");out.write(data);out.close();v.clear();v.put(MediaStore.Downloads.IS_PENDING,0);getContentResolver().update(uri,v,null,null);Toast.makeText(this,"فایل در Downloads ذخیره شد.",Toast.LENGTH_LONG).show();} catch(Exception e) {Toast.makeText(this,"ذخیره ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show();}
    }
    private void saveFile(String name,String mime,String base64) {if(Build.VERSION.SDK_INT>=29){saveModern(name,mime,base64);return;}if(Build.VERSION.SDK_INT>=23&&checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)!=PackageManager.PERMISSION_GRANTED){pendingName=name;pendingMime=mime;pendingBase64=base64;requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE},STORAGE_PERMISSION);return;}saveLegacy(name,mime,base64);}
    private void chooseSaveDocument(String name,String mime,String base64) {pendingName=safeFileName(name);pendingMime=(mime==null||mime.length()==0)?"application/octet-stream":mime;pendingBase64=base64;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(pendingMime);i.putExtra(Intent.EXTRA_TITLE,pendingName);startActivityForResult(i,SAVE_DOCUMENT);}
    private void chooseOpenBackup() {Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");startActivityForResult(i,OPEN_BACKUP);}
    private void triggerBackupFileInput() {webView.evaluateJavascript("(function(){var e=document.getElementById('backup-restore-file')||document.getElementById('drive-restore-file');if(e)e.click()})()",null);}

    private void requestContactsAccess() {
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.READ_CONTACTS)!=PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.READ_CONTACTS},CONTACTS_PERMISSION);
            return;
        }
        deliverDeviceContacts();
    }

    private void deliverDeviceContacts() {
        JSONArray rows=new JSONArray();HashSet<String> seen=new HashSet<>();
        String[] projection={ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,ContactsContract.CommonDataKinds.Phone.NUMBER};
        try(Cursor cursor=getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,projection,null,null,ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME+" COLLATE LOCALIZED ASC")) {
            if(cursor!=null)while(cursor.moveToNext()) {
                String name=cursor.getString(0),phone=cursor.getString(1);if(phone==null||phone.trim().length()==0||!seen.add(phone))continue;
                JSONObject row=new JSONObject();row.put("name",name==null?"":name);row.put("phone",phone);row.put("source","دفترچه Android");rows.put(row);
            }
            final String js="window.ContactFlow34&&window.ContactFlow34.onDeviceContacts(JSON.parse("+jsString(rows.toString())+"))";
            webView.post(() -> webView.evaluateJavascript(js,null));
        } catch(Exception e) {Toast.makeText(this,"خواندن مخاطبین ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show();}
    }

    private void chooseBusinessCard() {
        Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("image/*");startActivityForResult(i,OCR_IMAGE);
    }

    private void recognizeImage(Uri uri) {
        try {
            InputImage image=InputImage.fromFilePath(this,uri);
            TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).process(image)
                .addOnSuccessListener(result -> {String text=result.getText();String js="window.ContactFlow34&&window.ContactFlow34.onOcrText("+jsString(text)+")";webView.post(() -> webView.evaluateJavascript(js,null));})
                .addOnFailureListener(error -> Toast.makeText(this,"OCR ناموفق: "+error.getMessage(),Toast.LENGTH_LONG).show());
        } catch(Exception e) {Toast.makeText(this,"خواندن تصویر ناموفق: "+e.getMessage(),Toast.LENGTH_LONG).show();}
    }

    public class AndroidBridge {
        @JavascriptInterface public String nativeCapabilities() {return "{\"ok\":true,\"connector\":true,\"telegramQr\":false,\"telegramContacts\":true,\"deviceContacts\":true,\"businessCardOcr\":true,\"telegramMode\":\"desktop_export_offline\",\"secureAssetOrigin\":true,\"systemDrivePicker\":true,\"filePicker\":true,\"offlineAssets\":true,\"platform\":\"android\",\"version\":\"3.6.0\"}";}
        @JavascriptInterface public String startTelegramQr() {return "{\"ok\":false,\"mode\":\"desktop_export_offline\",\"message\":\"Use Telegram Desktop result.json; API ID/hash is not required\"}";}
        @JavascriptInterface public void saveFile(final String name,final String mime,final String base64) {runOnUiThread(() -> MainActivity.this.saveFile(name,mime,base64));}
        @JavascriptInterface public void saveDocument(final String name,final String mime,final String base64) {runOnUiThread(() -> MainActivity.this.chooseSaveDocument(name,mime,base64));}
        @JavascriptInterface public void beginDocumentSave(final String name,final String mime,final String token,final String expectedBytes) {runOnUiThread(() -> MainActivity.this.chooseStreamDocument(name,mime,token,expectedBytes));}
        @JavascriptInterface public String appendDocumentChunk(final String token,final String base64) {return MainActivity.this.appendStreamDocument(token,base64);}
        @JavascriptInterface public String finishDocumentSave(final String token) {return MainActivity.this.finishStreamDocument(token);}
        @JavascriptInterface public void abortDocumentSave(final String token) {MainActivity.this.abortStreamDocument(token,false);}
        @JavascriptInterface public void openBackupDocument() {runOnUiThread(() -> MainActivity.this.triggerBackupFileInput());}
        @JavascriptInterface public void requestDeviceContacts() {runOnUiThread(() -> MainActivity.this.requestContactsAccess());}
        @JavascriptInterface public void recognizeBusinessCard() {runOnUiThread(() -> MainActivity.this.chooseBusinessCard());}
    }
}
