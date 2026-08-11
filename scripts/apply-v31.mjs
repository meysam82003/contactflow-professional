import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];
if(!root)throw new Error('usage: node apply-v31.mjs <web-root>');
const file=f=>path.join(root,f),read=f=>fs.readFileSync(file(f),'utf8'),write=(f,s)=>fs.writeFileSync(file(f),s);
let html=read('index.html');
html=html.replaceAll('Personal Ultimate 3.0','Personal Ultimate 3.1').replaceAll('3.0.0 Ultimate','3.1.0 Ultimate').replaceAll('ContactFlow 3.0','ContactFlow 3.1');
const inject='<link rel="stylesheet" href="./enhancements.css"><script src="./telegram-web.bundle.js" defer></script><script src="./runtime-patch.js" defer></script><script src="./drive-sync.js" defer></script><script src="./business-connect.js" defer></script>';
html=html.replace(/<link rel="stylesheet" href="\.\/enhancements\.css"><script src="\.\/telegram-web\.bundle\.js" defer><\/script><script src="\.\/runtime-patch\.js" defer><\/script><script src="\.\/drive-sync\.js" defer><\/script>(?:<script src="\.\/business-connect\.js" defer><\/script>)?/g,'');
if(!html.includes('business-connect.js'))html=html.replace('</body>',inject+'</body>');
write('index.html',html);
let ultimate=read('ultimate.js');
ultimate=ultimate.replace(/function pseudoQR\(text\)\{[^\n]*\}\nasync function startQR\(\)\{[^\n]*\}\n/,`function pseudoQR(){throw new Error('Legacy QR is not used in Business Bot mode');}\nasync function startQR(){const s=document.getElementById('tg-qr-state');if(s)s.textContent='اتصال اصلی این نسخه از Bot Pair + Telegram Business انجام می‌شود؛ API ID/Hash لازم نیست.';if(window.ContactFlowBusiness?.render)await window.ContactFlowBusiness.render();}\n`);
ultimate=ultimate
 .replaceAll('QR Connector not configured in this build','Telegram Business Bot Connector')
 .replaceAll('TDLib/Credential رسمی Telegram App در این Build تنظیم نشده است. QR ساختگی نمایش داده نمی‌شود.','این نسخه از Bot Pair و Telegram Business Connection استفاده می‌کند و به API ID/Hash نیاز ندارد.')
 .replaceAll('Google OAuth Client ID داخلی این Build تنظیم نشده است. Backup دستی فعال است؛ در Android انتخاب Google Drive از File Picker انجام می‌شود.','Backup بدون Client ID فعال است؛ از System Picker، پوشه Sync یا فایل Backup استفاده کنید.')
 .replaceAll('Google OAuth Client ID داخلی Build تنظیم نشده.','Backup بدون Client ID آماده است؛ پوشه Drive/Backup یا System Picker را انتخاب کنید.');
write('ultimate.js',ultimate);
let runtime=read('runtime-patch.js');
runtime=runtime
 .replaceAll('QR Login واقعی Web‑MTProto','Bot Pair + Business Connection')
 .replaceAll('Web‑MTProto / WebSocket','Telegram Business Bot')
 .replaceAll('Telegram Web‑MTProto — QR واقعی','Telegram Business Bot — Pair رسمی')
 .replaceAll('Web MTProto','Business Bot')
 .replaceAll('اتصال مستقیم WebSocket/MTProto در همین Web Core. حداکثر ۱۰ Session مستقل، انتخاب دستی حساب و Session Vault محلی. برای تبلیغات فقط Opt‑in صریح پذیرفته می‌شود.','اتصال از طریق Bot Pair و Telegram Business Connection. تا ۱۰ Pair محلی، انتخاب دستی حساب فرستنده و ارسال تبلیغاتی فقط برای Opt-in صریح.')
 .replaceAll('Session Vault','Pair Vault')
 .replaceAll('Web‑MTProto QR','Bot Pair / Business')
 .replaceAll('QR Login واقعی','Business Connection')
 .replaceAll('ImportContacts + Cleanup','VCF + Contacts Sync')
 .replaceAll('Google Drive appData Sync','Backup: OAuth اختیاری / Sync Folder')
 .replaceAll('Backup دستی قابل‌مشاهده Drive','Backup فایل / System Picker / Drive Folder');
write('runtime-patch.js',runtime);
const apiId=String(process.env.TELEGRAM_API_ID||'').trim();
const apiHash=String(process.env.TELEGRAM_API_HASH||'').trim();
const google=String(process.env.GOOGLE_CLIENT_ID||'').trim();
const mini=String(process.env.MINIAPP_URL||'').trim();
const bot=String(process.env.TELEGRAM_BOT_USERNAME||'').trim();
const config={edition:'Personal Ultimate 3.1',telegramApiId:apiId?Number(apiId):0,telegramApiHash:apiHash,googleClientId:google,miniAppUrl:mini,botUsername:bot,telegramMode:'business_bot',telegramLegacyMtprotoOptional:!!(apiId&&apiHash),googleMode:'oauth_or_system_folder',googleOAuthOptional:true,miniAppMode:'hosted_runtime_url'};
write('config.js',`window.CONTACTFLOW_CONFIG=${JSON.stringify(config)};\n`);
let manifest=JSON.parse(read('manifest.webmanifest'));
manifest.name='ContactFlow Personal Ultimate 3.1';
manifest.description='Local-First ContactFlow — Telegram Business Bot pairing, hosted Mini App, VCF contact workflow and backup without required build secrets';
write('manifest.webmanifest',JSON.stringify(manifest,null,2));
write('sw.js',`const CACHE='contactflow-ultimate-v3.1.0-alpha.1-business-hotfix';\nconst ASSETS=['./','./index.html','./styles.css','./enhancements.css','./app.js','./ultimate.js','./telegram-web.bundle.js','./runtime-patch.js','./drive-sync.js','./business-connect.js','./config.js','./manifest.webmanifest','./icons/icon.svg'];\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});\n`);
console.log(JSON.stringify({root,version:'3.1.0-alpha.1',telegramConfigured:true,googleConfigured:true,miniAppConfigured:true,telegramMode:'business_bot',googleMode:'oauth_or_system_folder',miniAppMode:'hosted_runtime_url',legacyMtprotoOptional:!!(apiId&&apiHash),googleOAuthOptional:!!google},null,2));
