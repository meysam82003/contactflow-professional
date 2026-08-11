import fs from 'node:fs';import path from 'node:path';
const root=process.argv[2];if(!root)throw new Error('usage: node apply-v31.mjs <web-root>');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
let html=read('index.html');
html=html.replaceAll('Personal Ultimate 3.0','Personal Ultimate 3.1').replaceAll('3.0.0 Ultimate','3.1.0 Ultimate').replaceAll('ContactFlow 3.0','ContactFlow 3.1');
const inject=`<link rel="stylesheet" href="./enhancements.css"><script src="./telegram-web.bundle.js" defer></script><script src="./runtime-patch.js" defer></script><script src="./drive-sync.js" defer></script>`;
if(!html.includes('telegram-web.bundle.js'))html=html.replace('</body>',inject+'</body>');
write('index.html',html);
let ultimate=read('ultimate.js');
ultimate=ultimate.replace(/function pseudoQR\(text\)\{[^\n]*\}\nasync function startQR\(\)\{[^\n]*\}\n/,`function pseudoQR(){throw new Error('Legacy pseudo QR disabled in 3.1');}
async function startQR(){const w=document.getElementById('tg-qr-wrap'),s=document.getElementById('tg-qr-state');if(w)w.classList.remove('hidden');if(s)s.textContent='Web‑MTProto QR connector در حال آماده‌سازی است…';}
`);
write('ultimate.js',ultimate);
const apiId=String(process.env.TELEGRAM_API_ID||'').trim(),apiHash=String(process.env.TELEGRAM_API_HASH||'').trim(),google=String(process.env.GOOGLE_CLIENT_ID||'').trim(),mini=String(process.env.MINIAPP_URL||'').trim(),bot=String(process.env.TELEGRAM_BOT_USERNAME||'').trim();
const config=`window.CONTACTFLOW_CONFIG=${JSON.stringify({edition:'Personal Ultimate 3.1',telegramApiId:apiId?Number(apiId):0,telegramApiHash:apiHash,googleClientId:google,miniAppUrl:mini,botUsername:bot,telegramMode:'web_mtproto'})};\n`;
write('config.js',config);
let manifest=JSON.parse(read('manifest.webmanifest'));manifest.name='ContactFlow Personal Ultimate 3.1';manifest.description='Local‑First ContactFlow — Web‑MTProto QR, authorized contact checker, campaigns, Google Drive and Telegram Mini App';write('manifest.webmanifest',JSON.stringify(manifest,null,2));
write('sw.js',`const CACHE='contactflow-ultimate-v3.1.0-alpha.1';\nconst ASSETS=['./','./index.html','./styles.css','./enhancements.css','./app.js','./ultimate.js','./telegram-web.bundle.js','./runtime-patch.js','./drive-sync.js','./config.js','./manifest.webmanifest','./icons/icon.svg'];\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(x=>x.put(e.request,copy));return r}).catch(()=>caches.match('./index.html'))))});\n`);
console.log(JSON.stringify({root,version:'3.1.0-alpha.1',telegramConfigured:!!(apiId&&apiHash),googleConfigured:!!google,miniAppConfigured:!!mini},null,2));
