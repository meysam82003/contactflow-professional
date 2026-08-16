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
  for(const marker of ['DestinationFor','File.Exists','ApplySequenceTemplate','GetInvalidFileNameChars'])assert.ok(rules.includes(marker),`rename rules missing ${marker}`);
  assert.match(read('extensions/sequential-file-renamer/SequentialFileRenamer.csproj'),/<UseWindowsForms>true<\/UseWindowsForms>/);
});

test('Android messenger contacts extension is offline, permission-scoped and multi-format',()=>{
  const manifest=read('android/messengercontacts/src/main/AndroidManifest.xml');
  assert.match(manifest,/android\.permission\.READ_CONTACTS/);
  assert.doesNotMatch(manifest,/android\.permission\.INTERNET/);
  assert.doesNotMatch(manifest,/QUERY_ALL_PACKAGES/);
  const main=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MainActivity.java');
  for(const marker of ['ContactsContract.Contacts.CONTENT_URI','Intent.ACTION_VIEW','Intent.ACTION_CREATE_DOCUMENT','chooseExportFormat','showDetectionDetails'])assert.ok(main.includes(marker),`Android contact utility missing ${marker}`);
  const catalog=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/MessengerCatalog.java');
  for(const id of ['telegram','whatsapp','rubika','eitaa','bale','soroush','gap','igap','shad'])assert.match(catalog,new RegExp(`"${id}"`));
  const exporter=read('android/messengercontacts/src/main/java/com/contactflow/messengercontacts/ExportWriter.java');
  for(const marker of ['.vcf','text/csv','.xlsx','ZipOutputStream','sheet1.xml'])assert.ok(exporter.includes(marker),`exporter missing ${marker}`);
});

test('release workflow publishes both essential extension binaries on v3.6.0',()=>{
  const workflow=read('.github/workflows/release-all.yml');
  assert.match(workflow,/ContactFlow_3\.6_Sequential_File_Renamer_Windows_x64\.exe/);
  assert.match(workflow,/ContactFlow_3\.6_Messenger_Contacts_Android\.apk/);
  assert.match(workflow,/:messengercontacts:assembleDebug/);
  assert.match(workflow,/desktop_extensions/);
});
