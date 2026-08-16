package com.contactflow.sequentialrenamer;

import android.net.Uri;

import org.json.JSONException;
import org.json.JSONObject;

final class RenameEntry {
    final String originalUri;
    final String originalName;
    String currentUri;
    String currentName;
    String draftName = "";
    String status = "در انتظار";
    String lastError = "";
    long size = -1L;
    boolean renameSupported = true;

    RenameEntry(Uri uri, String displayName, long size, boolean renameSupported) {
        this.originalUri = uri.toString();
        this.currentUri = uri.toString();
        this.originalName = displayName;
        this.currentName = displayName;
        this.size = size;
        this.renameSupported = renameSupported;
    }

    private RenameEntry(JSONObject json) throws JSONException {
        originalUri = json.getString("originalUri");
        currentUri = json.optString("currentUri", originalUri);
        originalName = json.getString("originalName");
        currentName = json.optString("currentName", originalName);
        draftName = json.optString("draftName", "");
        status = json.optString("status", "در انتظار");
        lastError = json.optString("lastError", "");
        size = json.optLong("size", -1L);
        renameSupported = json.optBoolean("renameSupported", true);
    }

    Uri uri() { return Uri.parse(currentUri); }

    JSONObject toJson() throws JSONException {
        return new JSONObject()
                .put("originalUri", originalUri)
                .put("currentUri", currentUri)
                .put("originalName", originalName)
                .put("currentName", currentName)
                .put("draftName", draftName)
                .put("status", status)
                .put("lastError", lastError)
                .put("size", size)
                .put("renameSupported", renameSupported);
    }

    static RenameEntry fromJson(JSONObject json) throws JSONException { return new RenameEntry(json); }
}
