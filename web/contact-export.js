(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ContactFlowContactExport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FORMATS = Object.freeze(['csv', 'vcf', 'txt', 'json', 'xls']);
  const DEFAULT_FIELDS = Object.freeze(['name', 'phone', 'username', 'telegramId', 'city', 'section', 'source']);
  const EXTRA_FIELDS = Object.freeze(['firstName', 'lastName', 'email', 'province', 'country', 'countryCode', 'phoneType', 'operator', 'company', 'note', 'importNote', 'telegramStatus', 'telegramUsername', 'rowNumber']);

  const text = value => String(value == null ? '' : value).trim();
  const lower = value => text(value).toLocaleLowerCase('fa-IR');
  const csvCell = value => {
    const raw = String(value == null ? '' : value);
    const v = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const spreadsheetCell = value => {
    const v = String(value == null ? '' : value);
    return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  };
  const xml = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const vcard = value => String(value == null ? '' : value)
    .replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

  function safeFilename(value, fallback = 'contacts') {
    const cleaned = text(value).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, '_');
    return cleaned || fallback;
  }

  function normalizeRecord(input, source = 'contactflow') {
    const firstName = text(input.firstName || input.first_name);
    const lastName = text(input.lastName || input.last_name);
    const name = text(input.name) || [firstName, lastName].filter(Boolean).join(' ') || text(input.username) || text(input.phone) || 'بدون نام';
    const phone = text(input.phone || input.mobile || input.tel);
    const username = text(input.username).replace(/^@/, '');
    const telegramId = text(input.telegramId || input.telegram_id || input.userId || input.user_id || input.id);
    return {
      key: text(input.key) || (telegramId ? `tg:${telegramId}` : phone ? `phone:${phone}` : username ? `user:${lower(username)}` : `name:${lower(name)}`),
      name, firstName, lastName, phone, username, telegramId,
      city: text(input.city), province: text(input.province), section: text(input.section), source: text(input.source) || source,
      email: text(input.email), country: text(input.country), countryCode: text(input.countryCode), phoneType: text(input.phoneType),
      operator:text(input.operator),company: text(input.company), note: text(input.note), importNote: text(input.importNote),telegramStatus:text(input.telegramStatus),telegramUsername:text(input.telegramUsername),rowNumber:Number(input.rowNumber)||'',
      isMutual: Boolean(input.isMutual || input.mutualContact || input.mutual_contact),
      isPremium: Boolean(input.isPremium || input.premium),
      isBot: Boolean(input.isBot || input.bot),
      isDeleted: Boolean(input.isDeleted || input.deleted),
      updatedAt: Number(input.updatedAt || input.updated_at || Date.now()),
      raw: input.raw || null
    };
  }

  function dedupeRecords(records) {
    const out = [], seen = new Set();
    for (const item of records || []) {
      const row = normalizeRecord(item, item && item.source);
      const keys = [row.telegramId && `tg:${row.telegramId}`, row.phone && `phone:${row.phone}`, row.username && `user:${lower(row.username)}`, row.key].filter(Boolean);
      if (keys.some(key => seen.has(key))) continue;
      keys.forEach(key => seen.add(key));
      out.push(row);
    }
    return out;
  }

  function filterRecords(records, options = {}) {
    const query = lower(options.query);
    return dedupeRecords(records).filter(row => {
      if (!options.includeWithoutPhone && !row.phone) return false;
      if (!options.includeBots && row.isBot) return false;
      if (!options.includeDeleted && row.isDeleted) return false;
      if (options.mutualOnly && !row.isMutual) return false;
      if (!query) return true;
      return [row.name, row.phone, row.username, row.telegramId, row.city, row.section, row.source].some(value => lower(value).includes(query));
    });
  }

  function sortRecords(records, field = 'name', direction = 'asc') {
    const dir = direction === 'desc' ? -1 : 1;
    const allowed = new Set(['name', 'phone', 'username', 'telegramId', 'updatedAt', 'city', 'country', 'source', 'rowNumber']);
    const key = allowed.has(field) ? field : 'name';
    return [...(records || [])].sort((a, b) => {
      if (key === 'updatedAt') return ((Number(a[key]) || 0) - (Number(b[key]) || 0)) * dir;
      return text(a[key]).localeCompare(text(b[key]), 'fa', { numeric: true, sensitivity: 'base' }) * dir;
    });
  }

  function chunkRecords(records, chunkSize) {
    const size = Math.max(1, Math.min(100000, Number(chunkSize) || records.length || 1));
    const chunks = [];
    for (let index = 0; index < records.length; index += size) chunks.push(records.slice(index, index + size));
    return chunks;
  }

  function selectedFields(fields) {
    const list = Array.isArray(fields) && fields.length ? fields : DEFAULT_FIELDS;
    const allowed=new Set([...DEFAULT_FIELDS,...EXTRA_FIELDS]);
    return list.filter((field, index) => allowed.has(field) && list.indexOf(field) === index);
  }

  function serializeCSV(records, options = {}) {
    const fields = selectedFields(options.fields);
    return '\ufeff' + [fields.join(','), ...(records || []).map(row => fields.map(field => csvCell(row[field])).join(','))].join('\r\n');
  }

  function serializeTXT(records, options = {}) {
    const fields = selectedFields(options.fields);
    const delimiter = options.delimiter || '\t';
    return (records || []).map(row => fields.map(field => text(row[field])).join(delimiter)).join('\r\n');
  }

  function serializeJSON(records, options = {}) {
    const fields = selectedFields(options.fields);
    return JSON.stringify((records || []).map(row => Object.fromEntries(fields.map(field => [field, row[field] == null ? '' : row[field]]))), null, options.compact ? 0 : 2);
  }

  function serializeVCF(records) {
    return (records || []).map(row => {
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${vcard(row.name)}`];
      if (row.firstName || row.lastName) lines.push(`N:${vcard(row.lastName)};${vcard(row.firstName)};;;`);
      if (row.phone) lines.push(`TEL;TYPE=CELL:${vcard(row.phone)}`);
      if (row.username) {
        lines.push(`X-TELEGRAM-USERNAME:${vcard(row.username)}`);
        lines.push(`URL:https://t.me/${encodeURIComponent(row.username)}`);
      }
      if (row.telegramId) lines.push(`X-TELEGRAM-ID:${vcard(row.telegramId)}`);
      const note = [row.city, row.section, row.source, row.isMutual ? 'mutual' : ''].filter(Boolean).join(' | ');
      if (note) lines.push(`NOTE:${vcard(note)}`);
      lines.push('END:VCARD');
      return lines.join('\r\n');
    }).join('\r\n') + ((records || []).length ? '\r\n' : '');
  }

  function serializeXLS(records, options = {}) {
    const fields = selectedFields(options.fields);
    const head = fields.map(field => `<th>${xml(field)}</th>`).join('');
    const body = (records || []).map(row => `<tr>${fields.map(field => `<td>${xml(spreadsheetCell(row[field]))}</td>`).join('')}</tr>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  }

  function serialize(format, records, options = {}) {
    if (!FORMATS.includes(format)) throw new Error(`Unsupported export format: ${format}`);
    if (format === 'csv') return serializeCSV(records, options);
    if (format === 'vcf') return serializeVCF(records, options);
    if (format === 'txt') return serializeTXT(records, options);
    if (format === 'json') return serializeJSON(records, options);
    return serializeXLS(records, options);
  }

  function mimeFor(format) {
    return ({ csv: 'text/csv;charset=utf-8', vcf: 'text/vcard;charset=utf-8', txt: 'text/plain;charset=utf-8', json: 'application/json;charset=utf-8', xls: 'application/vnd.ms-excel;charset=utf-8' })[format];
  }

  function buildExportPlan(records, options = {}) {
    const format = FORMATS.includes(options.format) ? options.format : 'csv';
    const clean = sortRecords(filterRecords(records, {
      query: options.query,
      includeWithoutPhone: options.includeWithoutPhone !== false,
      includeBots: Boolean(options.includeBots),
      includeDeleted: Boolean(options.includeDeleted),
      mutualOnly: Boolean(options.mutualOnly)
    }), options.sortBy || 'name', options.sortDirection || 'asc');
    const chunks = chunkRecords(clean, options.chunkSize || clean.length || 1);
    const base = safeFilename(options.baseName, 'telegram_contacts');
    return chunks.map((chunk, index) => {
      const suffix = chunks.length > 1 ? `_${String(index + 1).padStart(4, '0')}` : '';
      const content = serialize(format, chunk, options);
      return { name: `${base}${suffix}.${format}`, count: chunk.length, blob: new Blob([content], { type: mimeFor(format) }), records: chunk };
    });
  }

  return {
    FORMATS, DEFAULT_FIELDS, EXTRA_FIELDS, safeFilename, normalizeRecord, dedupeRecords, filterRecords,
    sortRecords, chunkRecords, serializeCSV, serializeTXT, serializeJSON, serializeVCF,
    serializeXLS, serialize, mimeFor, buildExportPlan
  };
});
