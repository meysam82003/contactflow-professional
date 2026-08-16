package com.contactflow.sequentialrenamer;

import android.content.Context;
import android.util.AtomicFile;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

final class SessionStore {
    private static final String FILE_NAME = "sequential-renamer-session.json";

    static final class Session {
        final ArrayList<RenameEntry> entries;
        final int currentIndex;

        Session(ArrayList<RenameEntry> entries, int currentIndex) {
            this.entries = entries;
            this.currentIndex = currentIndex;
        }
    }

    private SessionStore() { }

    static Session load(Context context) {
        AtomicFile file = new AtomicFile(new File(context.getFilesDir(), FILE_NAME));
        if (!file.getBaseFile().isFile()) return new Session(new ArrayList<>(), -1);
        try (FileInputStream input = file.openRead(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[16 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            JSONObject root = new JSONObject(output.toString(StandardCharsets.UTF_8.name()));
            JSONArray array = root.optJSONArray("entries");
            ArrayList<RenameEntry> entries = new ArrayList<>();
            if (array != null) {
                for (int index = 0; index < array.length(); index++) {
                    try { entries.add(RenameEntry.fromJson(array.getJSONObject(index))); }
                    catch (Exception ignored) { }
                }
            }
            return new Session(entries, root.optInt("currentIndex", entries.isEmpty() ? -1 : 0));
        } catch (Exception ignored) {
            return new Session(new ArrayList<>(), -1);
        }
    }

    static void save(Context context, List<RenameEntry> entries, int currentIndex) {
        AtomicFile file = new AtomicFile(new File(context.getFilesDir(), FILE_NAME));
        FileOutputStream output = null;
        try {
            JSONArray array = new JSONArray();
            for (RenameEntry entry : entries) array.put(entry.toJson());
            byte[] bytes = new JSONObject().put("currentIndex", currentIndex).put("entries", array)
                    .toString().getBytes(StandardCharsets.UTF_8);
            output = file.startWrite();
            output.write(bytes);
            file.finishWrite(output);
        } catch (Exception ignored) {
            if (output != null) file.failWrite(output);
        }
    }

    static void clear(Context context) {
        new AtomicFile(new File(context.getFilesDir(), FILE_NAME)).delete();
    }
}
