package com.contactflow.sequentialrenamer;

import android.content.ContentResolver;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;

import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.List;

final class SafFileRepository {
    private SafFileRepository() { }

    static RenameEntry describe(ContentResolver resolver, Uri uri) throws FileNotFoundException {
        String name = null;
        long size = -1L;
        try (Cursor cursor = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (nameIndex >= 0 && !cursor.isNull(nameIndex)) name = cursor.getString(nameIndex);
                if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) size = cursor.getLong(sizeIndex);
            }
        } catch (SecurityException exception) {
            throw new FileNotFoundException("دسترسی فایل منقضی شده است: " + exception.getMessage());
        }
        if (name == null || name.trim().isEmpty()) name = uri.getLastPathSegment();
        if (name == null || name.trim().isEmpty()) throw new FileNotFoundException("نام فایل از ارائه‌دهندهٔ حافظه دریافت نشد.");
        return new RenameEntry(uri, name, size, supportsRename(resolver, uri));
    }

    static String displayName(ContentResolver resolver, Uri uri, String fallback) {
        try (Cursor cursor = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0 && !cursor.isNull(index)) {
                    String value = cursor.getString(index);
                    if (value != null && !value.trim().isEmpty()) return value;
                }
            }
        } catch (RuntimeException ignored) { }
        return fallback;
    }

    static boolean supportsRename(ContentResolver resolver, Uri uri) {
        try (Cursor cursor = resolver.query(uri, new String[]{DocumentsContract.Document.COLUMN_FLAGS}, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_FLAGS);
                if (index >= 0 && !cursor.isNull(index)) {
                    return (cursor.getInt(index) & DocumentsContract.Document.FLAG_SUPPORTS_RENAME) != 0;
                }
            }
        } catch (RuntimeException ignored) { }
        return true;
    }

    static Uri rename(ContentResolver resolver, Uri uri, String newDisplayName) throws FileNotFoundException {
        Uri result;
        try {
            result = DocumentsContract.renameDocument(resolver, uri, newDisplayName);
        } catch (IllegalArgumentException exception) {
            throw new FileNotFoundException("این ارائه‌دهنده URI قابل تغییرنام در اختیار برنامه نگذاشته است.");
        }
        if (result == null) throw new FileNotFoundException("ارائه‌دهندهٔ حافظه تغییرنام را نپذیرفت.");
        return result;
    }

    static List<Uri> listTreeFiles(ContentResolver resolver, Uri treeUri) throws FileNotFoundException {
        String documentId;
        try {
            documentId = DocumentsContract.getTreeDocumentId(treeUri);
        } catch (RuntimeException exception) {
            throw new FileNotFoundException("پوشهٔ انتخاب‌شده معتبر نیست.");
        }
        Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, documentId);
        ArrayList<Uri> files = new ArrayList<>();
        String[] columns = {DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_MIME_TYPE};
        try (Cursor cursor = resolver.query(childrenUri, columns, null, null, null)) {
            if (cursor == null) throw new FileNotFoundException("فهرست فایل‌های پوشه خوانده نشد.");
            int idIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_DOCUMENT_ID);
            int mimeIndex = cursor.getColumnIndexOrThrow(DocumentsContract.Document.COLUMN_MIME_TYPE);
            while (cursor.moveToNext()) {
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(mimeIndex))) continue;
                files.add(DocumentsContract.buildDocumentUriUsingTree(treeUri, cursor.getString(idIndex)));
            }
        } catch (SecurityException exception) {
            throw new FileNotFoundException("اجازهٔ خواندن پوشه در دسترس نیست: " + exception.getMessage());
        }
        return files;
    }
}
