'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('native Windows sequential renamer keeps the requested one-by-one workflow',()=>{
  const form=read('extensions/sequential-file-renamer/MainForm.cs');
  const rules=read('extensions/sequential-file-renamer/RenameRules.cs');
  for(const marker of ['Multiselect = true','Keys.Enter','MoveToNext','UndoLast','File.Move','preserveExtension','ApplyTemplateToRemaining','SaveReport'])assert.ok(form.includes(marker),`renamer missing ${marker}`);
  for(const marker of ['suppressUiEvents','RefreshDraftCell','RenameCurrentAsync','MoveFileWithRetryAsync','operationInProgress','ReportUnexpectedError'])assert.ok(form.includes(marker),`renamer regression guard missing ${marker}`);
  assert.doesNotMatch(form,/queue\.Items\[index\]\s*=\s*ItemFor/,'typing must not replace the selected ListView row');
  assert.match(read('extensions/sequential-file-renamer/Program.cs'),/SetUnhandledExceptionMode\(UnhandledExceptionMode\.CatchException\)/);
  assert.match(read('extensions/sequential-file-renamer/RenameRules.cs'),/NormalizationForm\.FormC/);
  assert.match(read('extensions/sequential-file-renamer/SequentialFileRenamer.csproj'),/<FileVersion>3\.6\.0\.2<\/FileVersion>/);
  for(const marker of ['DestinationFor','File.Exists','ApplySequenceTemplate','GetInvalidFileNameChars'])assert.ok(rules.includes(marker),`rename rules missing ${marker}`);
  assert.match(read('extensions/sequential-file-renamer/SequentialFileRenamer.csproj'),/<UseWindowsForms>true<\/UseWindowsForms>/);
});

test('Android messenger contacts extension is offline, permission-scoped and multi-format',()=>{
  const manifest=read('android/messengercontacts/src/main/AndroidManifest.xml');
  assert.match(manifest,/android\.permission\.READ_CONTACTS/);
  assert.match(manifest,/android\.permission\.WRITE_CONTACTS/);
  assert.match(manifest,/android\.permission\.FOREGROUND_SERVICE_DATA_SYNC/);
  assert.match(manifest,/android:foregroundServiceType="dataSync"/);
  assert.doesNotMatch(manifest,/android\.permission\.INTERNET/);
  assert.doesNotMatch(manifest,/QUERY_ALL_PACKAGES/);
  const main=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MainActivity.java');
  for(const marker of ['ContactsContract.Contacts.CONTENT_URI','Intent.ACTION_VIEW','Intent.ACTION_CREATE_DOCUMENT','Intent.ACTION_OPEN_DOCUMENT','takePersistableUriPermission','chooseExportFormat','showDetectionDetails','showImportReport'])assert.ok(main.includes(marker),`Android contact utility missing ${marker}`);
  const catalog=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MessengerCatalog.java');
  for(const id of ['telegram','whatsapp','rubika','eitaa','bale','soroush','gap','igap','shad'])assert.match(catalog,new RegExp(`"${id}"`));
  const exporter=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/ExportWriter.java');
  for(const marker of ['.vcf','text/csv','.xlsx','ZipOutputStream','sheet1.xml'])assert.ok(exporter.includes(marker),`exporter missing ${marker}`);
});

test('Android million-card VCF pipeline is streaming, durable and resumable',()=>{
  const parser=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/VCardStreamParser.java');
  for(const marker of ['MAX_CARDS_PER_FILE = 1_000_000L','BufferedReader','CardHandler','ENCODING=QUOTED-PRINTABLE','CountingInputStream'])assert.ok(parser.includes(marker),`streaming VCF parser missing ${marker}`);
  assert.doesNotMatch(parser,/readAllBytes|Files\.readAll/);
  const store=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MassContactStore.java');
  for(const marker of ['setWriteAheadLoggingEnabled(true)','normalized_phone TEXT NOT NULL UNIQUE','checkpoint_card','device_phone_index','STATE_PAUSED','STATE_LIMIT'])assert.ok(store.includes(marker),`mass contact store missing ${marker}`);
  const service=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MassImportService.java');
  for(const marker of ['startForeground','applyBatch(ContactsContract.AUTHORITY','withYieldAllowed(true)','GroupMembership.CONTENT_ITEM_TYPE','ACTION_PAUSE','onTimeout(int startId, int fgsType)','MAX_PROVIDER_OPERATIONS','findExistingTokens'])assert.ok(service.includes(marker),`mass import service missing ${marker}`);
  assert.doesNotMatch(service,/HttpURLConnection|OkHttp|Socket|https?:\/\//);
  const scanner=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/ContactScanner.java');
  assert.match(scanner,/UI_PREVIEW_LIMIT = 25_000/);
  assert.match(scanner,/QUERY_CHUNK = 400/);
});

test('native Android sequential renamer uses SAF and keeps Persian input stable',()=>{
  const manifest=read('android/sequentialrenamer/src/main/AndroidManifest.xml');
  assert.doesNotMatch(manifest,/android\.permission\.INTERNET|MANAGE_EXTERNAL_STORAGE|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE/);
  const main=read('android/sequentialrenamer/src/main/java/com/contactflow/sequentialrenamer/MainActivity.java');
  for(const marker of ['Intent.ACTION_OPEN_DOCUMENT','Intent.ACTION_OPEN_DOCUMENT_TREE','Intent.ACTION_CREATE_DOCUMENT','EditorInfo.IME_ACTION_NEXT','suppressTextEvents','undoLast','showTemplateDialog','SessionStore.save'])assert.ok(main.includes(marker),`Android renamer missing ${marker}`);
  const repository=read('android/sequentialrenamer/src/main/java/com/contactflow/sequentialrenamer/SafFileRepository.java');
  for(const marker of ['DocumentsContract.renameDocument','FLAG_SUPPORTS_RENAME','buildChildDocumentsUriUsingTree'])assert.ok(repository.includes(marker),`Android SAF repository missing ${marker}`);
  assert.match(read('android/sequentialrenamer/src/main/java/com/contactflow/sequentialrenamer/SessionStore.java'),/AtomicFile/);
  assert.match(read('android/sequentialrenamer/src/main/java/com/contactflow/sequentialrenamer/RenameRules.java'),/Normalizer\.Form\.NFC/);
  assert.match(read('android/sequentialrenamer/build.gradle'),/applicationId 'com\.contactflow\.sequentialrenamer'/);
});

test('release workflow publishes all essential extension binaries on v3.6.0',()=>{
  const workflow=read('.github/workflows/release-all.yml');
  assert.match(workflow,/ContactFlow_3\.6_Sequential_File_Renamer_Windows_x64\.exe/);
  assert.match(workflow,/ContactFlow_3\.6_Sequential_File_Renamer_Android\.apk/);
  assert.match(workflow,/ContactFlow_3\.6_Messenger_Contacts_Android\.apk/);
  assert.match(workflow,/:messengercontacts:assembleDebug/);
  assert.match(workflow,/:sequentialrenamer:assembleDebug/);
  assert.match(workflow,/desktop_extensions/);
});
