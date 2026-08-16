package com.contactflow.messengercontacts;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

final class ExportWriter {
    static final class ExportDocument {
        final byte[] bytes;
        final String mime;
        final String fileName;

        ExportDocument(byte[] bytes, String mime, String fileName) {
            this.bytes = bytes;
            this.mime = mime;
            this.fileName = fileName;
        }
    }

    static ExportDocument create(String format, List<ContactRecord> rows, String filterLabel) throws IOException {
        String suffix = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        String safeFilter = filterLabel.replaceAll("[^\\p{L}\\p{N}_-]+", "_").replaceAll("_+", "_");
        String base = "ContactFlow_" + (safeFilter.isEmpty() ? "Contacts" : safeFilter) + "_" + suffix;
        if ("vcf".equals(format)) return new ExportDocument(vcf(rows).getBytes(StandardCharsets.UTF_8), "text/vcard", base + ".vcf");
        if ("xlsx".equals(format)) return new ExportDocument(xlsx(rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base + ".xlsx");
        if ("txt".equals(format)) return new ExportDocument(withBom(txt(rows)), "text/plain", base + ".txt");
        return new ExportDocument(withBom(csv(rows)), "text/csv", base + ".csv");
    }

    private static byte[] withBom(String value) {
        byte[] content = value.getBytes(StandardCharsets.UTF_8), result = new byte[content.length + 3];
        result[0] = (byte) 0xEF; result[1] = (byte) 0xBB; result[2] = (byte) 0xBF;
        System.arraycopy(content, 0, result, 3, content.length);
        return result;
    }

    private static String txt(List<ContactRecord> rows) {
        StringBuilder output = new StringBuilder();
        for (ContactRecord row : rows) output.append(row.displayName()).append('\t').append(row.joinedPhones()).append('\t').append(row.joinedApps()).append("\r\n");
        return output.toString();
    }

    private static String csv(List<ContactRecord> rows) {
        StringBuilder output = new StringBuilder("name,phones,apps,contact_id\r\n");
        for (ContactRecord row : rows) output.append(csvCell(row.displayName())).append(',').append(csvCell(row.joinedPhones())).append(',').append(csvCell(row.joinedApps())).append(',').append(row.contactId).append("\r\n");
        return output.toString();
    }

    private static String csvCell(String value) { return '"' + value.replace("\"", "\"\"").replace("\r", " ").replace("\n", " ") + '"'; }

    private static String vcf(List<ContactRecord> rows) {
        StringBuilder output = new StringBuilder();
        for (ContactRecord row : rows) {
            output.append("BEGIN:VCARD\r\nVERSION:3.0\r\nFN:").append(vcfCell(row.displayName())).append("\r\n");
            for (String phone : row.phones) output.append("TEL;TYPE=CELL:").append(vcfCell(phone)).append("\r\n");
            if (!row.appIds.isEmpty()) output.append("NOTE:").append(vcfCell("ContactFlow Apps: " + row.joinedApps())).append("\r\n");
            output.append("X-CONTACTFLOW-APPS:").append(vcfCell(String.join(",", row.appIds))).append("\r\nEND:VCARD\r\n");
        }
        return output.toString();
    }

    private static String vcfCell(String value) {
        return value.replace("\\", "\\\\").replace("\r", "").replace("\n", "\\n").replace(";", "\\;").replace(",", "\\,");
    }

    private static byte[] xlsx(List<ContactRecord> rows) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            put(zip, "[Content_Types].xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/></Types>");
            put(zip, "_rels/.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
            put(zip, "xl/workbook.xml", "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Contacts\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
            put(zip, "xl/_rels/workbook.xml.rels", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/></Relationships>");
            put(zip, "xl/styles.xml", styles());
            put(zip, "xl/worksheets/sheet1.xml", worksheet(rows));
        }
        return bytes.toByteArray();
    }

    private static String styles() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Arial\"/></font><font><b/><color rgb=\"FFFFFFFF\"/><sz val=\"11\"/><name val=\"Arial\"/></font></fonts><fills count=\"3\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill><fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF26334D\"/><bgColor indexed=\"64\"/></patternFill></fill></fills><borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"2\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\"/></cellXfs></styleSheet>";
    }

    private static String worksheet(List<ContactRecord> rows) {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetViews><sheetView rightToLeft=\"1\" workbookViewId=\"0\"/></sheetViews><cols><col min=\"1\" max=\"1\" width=\"28\" customWidth=\"1\"/><col min=\"2\" max=\"2\" width=\"34\" customWidth=\"1\"/><col min=\"3\" max=\"3\" width=\"32\" customWidth=\"1\"/><col min=\"4\" max=\"4\" width=\"14\" customWidth=\"1\"/></cols><sheetData>");
        xml.append(rowXml(1, new String[]{"نام", "شماره‌ها", "پیام‌رسان‌ها", "Contact ID"}, true));
        int index = 2;
        for (ContactRecord row : rows) xml.append(rowXml(index++, new String[]{row.displayName(), row.joinedPhones(), row.joinedApps(), Long.toString(row.contactId)}, false));
        return xml.append("</sheetData><autoFilter ref=\"A1:D").append(Math.max(1, rows.size() + 1)).append("\"/></worksheet>").toString();
    }

    private static String rowXml(int rowNumber, String[] values, boolean header) {
        StringBuilder row = new StringBuilder("<row r=\"").append(rowNumber).append("\">");
        for (int index = 0; index < values.length; index++) row.append("<c r=\"").append(column(index)).append(rowNumber).append("\" t=\"inlineStr\"").append(header ? " s=\"1\"" : "").append("><is><t xml:space=\"preserve\">").append(xml(values[index])).append("</t></is></c>");
        return row.append("</row>").toString();
    }

    private static String column(int index) { return Character.toString((char) ('A' + index)); }
    private static String xml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;"); }

    private static void put(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private ExportWriter() { }
}
