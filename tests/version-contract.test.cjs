'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('all canonical version markers are 3.3.0',()=>{
  assert.equal(read('VERSION').trim(),'3.3.0');
  assert.equal(JSON.parse(read('package.json')).version,'3.3.0');
  assert.match(read('web/app.js'),/APP_VERSION = '3\.3\.0'/);
  assert.match(read('web/runtime-patch.js'),/VERSION='3\.3\.0'/);
  assert.match(read('web/sw.js'),/v3\.3\.0/);
  assert.match(read('desktop/main.go'),/appVersion = "3\.3\.0"/);
  assert.match(read('android/app/build.gradle'),/versionName '3\.3\.0'/);
  assert.match(read('telegram-miniapp/lib.php'),/CF_VERSION = '3\.3\.0'/);
});

test('shared web core includes Telegram contacts and export modules',()=>{
  const html=read('web/index.html');
  for(const asset of ['contact-export.js','telegram-web.bundle.js','runtime-patch.js','v33.js','v33.css'])assert.match(html,new RegExp(asset.replace('.','\\.')));
  const extension=read('web/v33.js');
  assert.match(extension,/data-page="telegram-contacts"/);
  assert.match(extension,/FEATURES=\[/);
  assert.match(read('enhancements/telegram-web-entry.js'),/Api\.contacts\.GetContacts/);
});

test('3.3 publishes more than twenty shared feature contracts',()=>{
  const extension=read('web/v33.js');
  const entries=[...extension.matchAll(/^\s*\['[a-z0-9-]+','/gm)];
  assert.ok(entries.length>=20,`expected at least 20 features, found ${entries.length}`);
  for(const marker of ['listTelegramContacts','getCachedContacts','clearContactCache','exportTelegramContacts'])assert.match(extension,new RegExp(marker));
});

test('release workflow builds all supported device artifacts',()=>{
  const workflow=read('.github/workflows/release-all.yml');
  for(const marker of ['_PWA.zip','_Windows_Portable.exe','_Windows_Setup.exe','_Linux_x64','_macOS_Intel','_macOS_AppleSilicon','_Android.apk','_Telegram_MiniApp_cPanel.zip','_Source.zip'])assert.match(workflow,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(workflow,/tag_name: v3\.3\.0/);
});
