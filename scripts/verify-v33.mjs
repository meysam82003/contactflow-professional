import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const required=['web/index.html','web/app.js','web/ultimate.js','web/contact-export.js','web/runtime-patch.js','web/v33.js','web/v33.css','enhancements/telegram-web-entry.js','.github/workflows/release-all.yml'];
for(const file of required)if(!fs.existsSync(path.join(root,file)))throw new Error(`missing ${file}`);
const html=read('web/index.html');
for(const asset of ['contact-export.js','telegram-web.bundle.js','runtime-patch.js','v33.js','v33.css'])if(!html.includes(asset))throw new Error(`index missing ${asset}`);
for(const page of ['generator','import','contacts','exports','audience','telegram','campaign','requests','backup','activity'])if(!html.includes(`data-page="${page}"`))throw new Error(`base page missing ${page}`);
if(!read('web/v33.js').includes('data-page="telegram-contacts"'))throw new Error('Telegram contacts page missing');
if(!read('enhancements/telegram-web-entry.js').includes('Api.contacts.GetContacts'))throw new Error('contacts.getContacts connector missing');
if(read('telegram-miniapp/miniapp.html').includes('Workspace اصلی ContactFlow</p>'))throw new Error('placeholder Mini App still present');
if(read('VERSION').trim()!=='3.3.0')throw new Error('VERSION must be 3.3.0');
for(const [file,marker] of [['desktop/main.go','appVersion = "3.3.0"'],['android/app/build.gradle',"versionName '3.3.0'"],['telegram-miniapp/lib.php',"CF_VERSION = '3.3.0'"],['.github/workflows/release-all.yml','tag_name: v3.3.0']])if(!read(file).includes(marker))throw new Error(`${file} is not on 3.3.0`);
const featureCount=[...read('web/v33.js').matchAll(/^\s*\['[a-z0-9-]+','/gm)].length;
if(featureCount<20)throw new Error(`expected at least 20 shared features, found ${featureCount}`);
console.log('ContactFlow 3.3 source verification PASS');
