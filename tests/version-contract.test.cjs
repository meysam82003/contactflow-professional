'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('all canonical version markers are 3.6.0',()=>{
  assert.equal(read('VERSION').trim(),'3.6.0');
  assert.equal(JSON.parse(read('package.json')).version,'3.6.0');
  assert.match(read('web/app.js'),/APP_VERSION = '3\.6\.0'/);
  assert.match(read('web/runtime-patch.js'),/VERSION='3\.6\.0'/);
  assert.match(read('web/sw.js'),/v3\.6\.0/);
  assert.match(read('desktop/main.go'),/appVersion = "3\.6\.0"/);
  assert.match(read('android/app/build.gradle'),/versionName '3\.6\.0'/);
  assert.match(read('telegram-miniapp/lib.php'),/CF_VERSION = '3\.6\.0'/);
});

test('shared web core includes smart merge and Telegram contact modules',()=>{
  const html=read('web/index.html');
  for(const asset of ['contact-export.js','runtime-patch.js','import-merge.js','location-operator.js','channel-handoff.js','name-engine.js','telegram-export.js','legacy-tools.js','file-save.js','v34.js','v34.css','v35.js','v35.css','v36.js','v36.css'])assert.ok(html.includes(asset),`index missing ${asset}`);
  assert.match(read('web/v33.js'),/data-page="telegram-contacts"/);
  assert.match(read('web/v34.js'),/data-page="smart-import"/);
  assert.match(read('enhancements/telegram-web-entry.js'),/Api\.contacts\.GetContacts/);
  assert.match(read('enhancements/telegram-web-entry.js'),/ContactFlowSpreadsheet/);
  assert.match(JSON.parse(read('enhancements/package.json')).dependencies.xlsx,/cdn\.sheetjs\.com\/xlsx-0\.20\.3/);
  assert.match(read('enhancements/webpack.config.cjs'),/process\/browser\$/);
  assert.match(read('enhancements/webpack.config.cjs'),/fullySpecified: false/);
});

test('3.6 preserves more than fifty 3.4 shared feature contracts',()=>{
  const extension=read('web/v34.js'),block=extension.match(/const FEATURES=\[([\s\S]*?)\];/)[1];
  const entries=block.match(/'[^']+'/g)||[];
  assert.ok(entries.length>=50,`expected at least 50 features, found ${entries.length}`);
  for(const marker of ['planMerge','rollbackLast','undoImport','checkTelegram','showDirectoryPicker','requestDeviceContacts'])assert.match(extension,new RegExp(marker));
});

test('release workflow builds all supported device artifacts and essential extensions',()=>{
  const workflow=read('.github/workflows/release-all.yml');
  for(const marker of ['_PWA.zip','_Windows_Portable.exe','_Windows_Setup.exe','_Linux_x64','_macOS_Intel','_macOS_AppleSilicon','_Android.apk','_Telegram_MiniApp_cPanel.zip','_Source.zip','ContactFlow_3.6_Sequential_File_Renamer_Windows_x64.exe','ContactFlow_3.6_Sequential_File_Renamer_Android.apk','ContactFlow_3.6_Messenger_Contacts_Android.apk'])assert.ok(workflow.includes(marker),`workflow missing ${marker}`);
  assert.match(workflow,/tag_name: v3\.6\.0/);
});

test('Android capabilities require explicit contacts permission and include local OCR',()=>{
  assert.match(read('android/app/src/main/AndroidManifest.xml'),/android\.permission\.READ_CONTACTS/);
  assert.match(read('android/app/build.gradle'),/minSdk 23/);
  const main=read('android/app/src/main/java/com/contactflow/pro/MainActivity.java');
  for(const marker of ['requestDeviceContacts','CONTACTS_PERMISSION','TextRecognition','recognizeBusinessCard'])assert.match(main,new RegExp(marker));
});
