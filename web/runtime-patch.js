(() => {
'use strict';
const VERSION='3.6.0';
const E={stopSignal:{stopped:false},lastCheckResults:[],selectedCampaignId:null};
const q=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function note(msg,type='good'){ if(typeof toast==='function')toast(msg,type,5000); else console.log(msg); }
async function waitCore(){for(let i=0;i<200;i++){try{if(state?.db)return}catch{}await sleep(50)}throw new Error('هسته Local DB آماده نشد.');}
function coreReq(store,mode,fn){return new Promise((res,rej)=>{try{const tx=state.db.transaction(store,mode),r=fn(tx.objectStore(store));r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})}
const coreGet=(s,k)=>coreReq(s,'readonly',x=>x.get(k));
const coreAll=s=>coreReq(s,'readonly',x=>x.getAll()).then(x=>x||[]);
const corePut=(s,v)=>coreReq(s,'readwrite',x=>x.put(v));
function csv(v){v=String(v??'');return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function dl(name,blob){
  if(window.ContactFlowFileSave)return window.ContactFlowFileSave.save(blob,name).catch(error=>console.error('Save As failed',error));
  if(window.ContactFlowAndroid?.saveDocument){blob.arrayBuffer().then(buf=>{const u8=new Uint8Array(buf);let b='';for(let i=0;i<u8.length;i+=0x8000)b+=String.fromCharCode(...u8.subarray(i,i+0x8000));window.ContactFlowAndroid.saveDocument(name,blob.type||'application/octet-stream',btoa(b));});return;}
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2500);
}
async function connector(){
  for(let i=0;i<200;i++){if(window.ContactFlowTelegramWeb)return window.ContactFlowTelegramWeb;await sleep(50)}
  throw new Error('Telegram Web connector بارگذاری نشد.');
}
function insertStyles(){
  if(document.querySelector('link[href="./enhancements.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='./enhancements.css';document.head.appendChild(l);
}
function featureRegistry(){return [
  ['multi10','مدیریت حداکثر ۱۰ حساب Telegram','active'],['qr','QR Login واقعی Web‑MTProto','active'],['qrrefresh','نوسازی خودکار QR','active'],['twofa','پشتیبانی 2FA بعد از QR','active'],['vault','Session Vault رمزگذاری‌شده محلی','active'],['manualaccount','انتخاب دستی حساب هر کمپین','active'],['health','Health Check حساب‌ها','active'],['authorizedcheck','Checker فقط لیست مجاز','active'],['3state','Matched / Not returned / Retry','active'],['cleanup','پاک‌سازی Contact Import موقت','active'],['exportcheck','خروجی جداگانه نتیجه Checker','active'],['dialogs','نمایش چت‌های موجود','active'],['consent','Consent Ledger','active'],['suppression','Suppression Enforcement','active'],['purpose','تفکیک Promotional / Service','active'],['forward','Forward پیام مرجع کانال','active'],['dedupe','Duplicate Send Guard','active'],['cap','سقف روزانه هر اجرا','active'],['delay','فاصله محافظه‌کارانه ارسال','active'],['flood','توقف روی FloodWait','active'],['restricted','توقف روی محدودیت حساب','active'],['progress','پیشرفت لحظه‌ای کمپین','active'],['stop','Pause/Stop دستی','active'],['dryrun','Dry Run قبل از ارسال','active'],['driveapp','Google Drive appData Sync','active'],['drivevisible','Backup دستی قابل‌مشاهده Drive','active'],['checksum','SHA‑256 Backup','active'],['conflict','تشخیص نسخه/تعارض Backup','active'],['miniapp','Telegram Mini App','active'],['botconsent','Opt‑in/Opt‑out ربات','active'],['adrequest','درخواست تبلیغ و تعرفه','active'],['membership','Membership Gate','active'],['diagnostics','Diagnostics Export','active'],['activity','Activity/Audit Log','active'],['nativepicker','Android System Drive Picker','active']
];}
function addNavPage(){
  const nav=q('nav'); if(nav&&!q('cf-miniapp-nav')){
    const mini=document.createElement('button');mini.id='cf-miniapp-nav';mini.className='nav-item';mini.dataset.page='miniapp';mini.innerHTML='▣ <span>Mini App</span>';nav.appendChild(mini);
    const diag=document.createElement('button');diag.id='cf-diagnostics-nav';diag.className='nav-item';diag.dataset.page='diagnostics';diag.innerHTML='⌁ <span>Diagnostics</span>';nav.appendChild(diag);
  }
  const main=document.querySelector('main.main'); if(!main)return;
  if(!document.querySelector('.page[data-page="miniapp"]')){
    const s=document.createElement('section');s.className='page';s.dataset.page='miniapp';s.innerHTML=`
      <div class="layout-2"><article class="panel form-panel"><div class="panel-head"><div><h2>Telegram Mini App</h2><p>پنل درخواست تبلیغ، رضایت، تعرفه و وضعیت</p></div><span class="pill active">RESTORED</span></div>
      <label><span>Mini App URL</span><input id="cf-mini-url" dir="ltr" placeholder="https://your-domain/telegram-miniapp/miniapp/"></label>
      <label><span>Bot Username</span><input id="cf-bot-user" dir="ltr" placeholder="@YourBot"></label>
      <div class="button-row"><button id="cf-mini-save" class="primary-btn">ذخیره تنظیمات</button><button id="cf-mini-open" class="ghost-btn">باز کردن Mini App</button><button id="cf-mini-bot" class="ghost-btn">باز کردن Bot</button></div><div id="cf-mini-state" class="hint"></div></article>
      <article class="panel"><div class="panel-head"><div><h2>وظایف Mini App / Bot</h2><p>Bot فرستنده تبلیغات خصوصی نیست</p></div></div><ul class="security-list"><li><b>Opt‑in / Opt‑out</b><span>ثبت رضایت و Suppression</span></li><li><b>Pricing</b><span>نمایش تعرفه‌ها</span></li><li><b>Ad Request</b><span>ثبت درخواست روی Numeric ID</span></li><li><b>Progress</b><span>نمایش requested / done / remaining</span></li><li><b>Membership Gate</b><span>کانال‌های الزامی قابل مدیریت</span></li></ul></article></div>`;main.appendChild(s);
  }
  if(!document.querySelector('.page[data-page="diagnostics"]')){
    const s=document.createElement('section');s.className='page';s.dataset.page='diagnostics';s.innerHTML=`<article class="panel"><div class="panel-head"><div><h2>Diagnostics & Feature Matrix</h2><p>ContactFlow ${VERSION}</p></div><div class="button-row"><button id="cf-diag-refresh" class="ghost-btn">بررسی</button><button id="cf-diag-export" class="primary-soft">Export JSON</button></div></div><div id="cf-diag-summary" class="stats-grid"></div><div id="cf-features" class="feature-grid"></div><pre id="cf-diag-json" class="code-sample"></pre></article>`;main.appendChild(s);
  }
}
function patchSetPage(){
  const old=window.setPage;
  if(typeof old==='function'&&!old.__cf31){
    const f=function(p){old(p);document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===p));document.querySelectorAll('.nav-item[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===p));if(p==='telegram')refreshTelegram();if(p==='miniapp')loadMiniSettings();if(p==='diagnostics')refreshDiagnostics();};f.__cf31=true;window.setPage=f;
  }
  document.addEventListener('click',e=>{const b=e.target.closest?.('.nav-item[data-page]');if(b&&['miniapp','diagnostics'].includes(b.dataset.page)){e.preventDefault();window.setPage(b.dataset.page)}});
}
function upgradeTelegramUI(){
  const p=document.querySelector('.page[data-page="telegram"]');if(!p)return;
  const call=p.querySelector('.callout'); if(call)call.innerHTML=`<div><strong>Telegram Web‑MTProto — QR واقعی</strong><p>اتصال مستقیم WebSocket/MTProto در همین Web Core. حداکثر ۱۰ Session مستقل، انتخاب دستی حساب و Session Vault محلی. برای تبلیغات فقط Opt‑in صریح پذیرفته می‌شود.</p></div><span id="tg-native-pill" class="pill active">Web MTProto</span>`;
  const caps=q('tg-native-caps'); if(caps)caps.innerHTML='<li><b>✓ Web‑MTProto QR</b><span>در حال آماده‌سازی…</span></li>';
  const nativePanel=caps?.closest('article');if(nativePanel){nativePanel.querySelector('h2').textContent='وضعیت Web Connector';nativePanel.querySelector('p').textContent='PWA / Windows / Android / macOS / Linux';const hint=nativePanel.querySelector('.hint');if(hint)hint.textContent='Session هر حساب در Vault محلی همان دستگاه ذخیره می‌شود؛ هیچ ContactFlow Account Server وجود ندارد.';}
  const checkerPanel=q('tg-check-preview')?.closest('article');
  if(checkerPanel&&!q('cf-tg-run-check')){
    const d=document.createElement('div');d.className='cf-extension';d.innerHTML=`<div class="button-row"><button id="cf-tg-run-check" class="primary-soft">شروع Checker واقعی</button><button id="cf-tg-clear-check" class="danger-btn">پاک کردن نتایج</button></div><div class="progress-block"><div class="progress-line"><span id="cf-check-state">آماده</span><strong id="cf-check-pct">0%</strong></div><div class="progress-track"><i id="cf-check-bar"></i></div></div><div class="button-row"><button data-cf-check-export="matched" class="ghost-btn">Matched CSV</button><button data-cf-check-export="not_returned" class="ghost-btn">Not returned CSV</button><button data-cf-check-export="retry" class="ghost-btn">Retry CSV</button></div><p class="hint">Not returned یعنی Telegram آن شماره را در این Import برنگردانده؛ به‌دلیل Privacy اثبات «تلگرام ندارد» نیست.</p><div id="cf-check-summary" class="stats-grid"></div>`;checkerPanel.appendChild(d);
  }
  const chats=q('tg-chat-list')?.closest('article');if(chats&&!q('cf-load-dialogs')){const b=document.createElement('button');b.id='cf-load-dialogs';b.className='ghost-btn';b.textContent='بارگذاری چت‌های موجود';chats.querySelector('.panel-head')?.appendChild(b);}
  if(!q('cf-account-toolbar')){
    const list=q('tg-account-list');const toolbar=document.createElement('div');toolbar.id='cf-account-toolbar';toolbar.className='button-row';toolbar.innerHTML='<span class="pill active">حداکثر ۱۰ حساب</span><button id="cf-account-refresh" class="ghost-btn">بروزرسانی</button>';list?.parentElement?.insertBefore(toolbar,list);
  }
}
function upgradeCampaignUI(){
  const p=document.querySelector('.page[data-page="campaign"]');if(!p||q('cf-camp-controls'))return;
  const panel=p.querySelector('.form-panel');const d=document.createElement('div');d.id='cf-camp-controls';d.className='cf-extension';d.innerHTML=`<hr><h3>اجرای امن کمپین</h3><div class="form-grid"><label><span>نوع کمپین</span><select id="cf-camp-purpose"><option value="promotional">تبلیغاتی — فقط Opt‑in</option><option value="service">خدماتی — Opt‑in / Existing Chat</option></select></label><label><span>حساب Telegram</span><select id="cf-camp-account"></select></label><label><span>سقف این اجرا</span><input id="cf-camp-cap" type="number" min="1" max="500" value="80"></label><label><span>فاصله پیام (ms)</span><input id="cf-camp-delay" type="number" min="1200" value="1800"></label></div><div class="button-row"><button id="cf-camp-dry" class="ghost-btn">Dry Run</button><button id="cf-camp-send" class="primary-btn">شروع ارسال به Opt‑in</button><button id="cf-camp-stop" class="danger-btn">توقف</button></div><div id="cf-camp-run-state" class="hint">هیچ ارسالی شروع نشده.</div><div class="progress-track"><i id="cf-camp-run-bar"></i></div>`;panel.appendChild(d);
}
function upgradeBackupUI(){
  const p=document.querySelector('.page[data-page="backup"]');if(!p||q('cf-drive-auto'))return;
  const stateEl=q('drive-state');const box=stateEl?.parentElement;if(!box)return;
  const d=document.createElement('div');d.className='cf-extension';d.innerHTML=`<hr><h3>Drive Sync 2.0</h3><div class="button-row"><button id="cf-drive-auto" class="primary-soft">Sync Now (appData)</button><button id="cf-drive-cloud-restore" class="ghost-btn">Restore Latest Cloud</button><button id="cf-drive-list" class="ghost-btn">بررسی Cloud</button></div><label class="switch-row"><input id="cf-drive-auto-toggle" type="checkbox"><span class="switch"></span><div><strong>Auto Sync در زمان باز بودن برنامه</strong><small>اگر OAuth منقضی شود، اتصال مجدد یک‌کلیک لازم است.</small></div></label><div id="cf-drive-meta" class="hint"></div>`;box.appendChild(d);
}
async function renderAccounts(){
  const tg=await connector(),xs=await tg.listAccounts(),active=await tg.activeAccountId(),list=q('tg-account-list');
  if(list)list.innerHTML=xs.map(a=>`<div class="export-row ${a.id===active?'active-row':''}"><div><strong>${esc([a.firstName,a.lastName].filter(Boolean).join(' ')||'Telegram')}</strong><small dir="ltr">${a.username?'@'+esc(a.username)+' • ':''}${esc(a.telegramId)} • ${a.id===active?'ACTIVE':'connected'}</small></div><div class="button-row"><button class="ghost-btn" data-cf-active="${a.id}">انتخاب</button><button class="ghost-btn" data-cf-health="${a.id}">تست</button><button class="danger-btn" data-cf-remove="${a.id}">حذف Session</button></div></div>`).join('')||'<div class="empty-state compact">حسابی متصل نشده است.</div>';
  const sel=q('cf-camp-account');if(sel)sel.innerHTML=xs.map(a=>`<option value="${a.id}" ${a.id===active?'selected':''}>${esc(a.username?'@'+a.username:(a.firstName||a.telegramId))}</option>`).join('');
  const caps=q('tg-native-caps');if(caps)caps.innerHTML=`<li><b>✓ QR Login واقعی</b><span>Web‑MTProto / WebSocket</span></li><li><b>✓ Session Vault</b><span>${xs.length}/10 حساب</span></li><li><b>✓ انتخاب دستی حساب</b><span>${active?'فعال':'حساب انتخاب نشده'}</span></li><li><b>✓ Checker مجاز</b><span>ImportContacts + Cleanup</span></li>`;
}
async function beginQr(){
  const tg=await connector(),wrap=q('tg-qr-wrap'),box=q('tg-qr-box'),st=q('tg-qr-state');wrap?.classList.remove('hidden');if(box)box.innerHTML='<div class="qr-placeholder">در حال دریافت QR…</div>';
  try{const a=await tg.connectQr({onQr:async url=>tg.renderQr(url,box),onState:s=>{if(st)st.textContent=s}});if(st)st.textContent=`متصل شد: ${a.username?'@'+a.username:a.telegramId}`;await renderAccounts();note('حساب Telegram با موفقیت متصل شد.');setTimeout(()=>wrap?.classList.add('hidden'),1200)}catch(e){if(st)st.textContent=e.message;note(e.message,'bad')}
}
async function eligiblePhones(purpose){
  const xs=await coreAll('contact_flags');
  if(purpose==='promotional')return xs.filter(x=>x.status==='optin').map(x=>x.phone);
  return xs.filter(x=>x.status==='optin'||x.status==='existing_chat').map(x=>x.phone);
}
async function runChecker(){
  const tg=await connector(),active=await tg.activeAccountId();if(!active)return note('ابتدا حساب Telegram را انتخاب کنید.','bad');
  const mode=q('tg-check-source').value,flags=await coreAll('contact_flags');const phones=flags.filter(x=>mode==='allowed'?(x.status==='optin'||x.status==='existing_chat'):x.status===mode).map(x=>x.phone);
  if(!phones.length)return note('در Audience شماره مجاز وجود ندارد.','bad');
  const batch=Math.max(10,Math.min(500,+q('tg-check-batch').value||200));q('cf-check-state').textContent=`شروع ${phones.length} شماره…`;
  try{const rs=await tg.checkContacts(active,phones,{batchSize:batch,cleanup:true,onProgress:p=>{const pct=p.total?Math.round(p.done/p.total*100):0;q('cf-check-pct').textContent=pct+'%';q('cf-check-bar').style.width=pct+'%';q('cf-check-state').textContent=`${p.done}/${p.total} • Matched ${p.matched} • Retry ${p.retry}`;}});E.lastCheckResults=rs;renderCheckSummary(rs);note('Checker تمام شد.');}catch(e){q('cf-check-state').textContent=e.message;note(e.message,'bad')}
}
function renderCheckSummary(rs){const m=rs.filter(x=>x.status==='matched').length,n=rs.filter(x=>x.status==='not_returned').length,r=rs.filter(x=>x.status==='retry').length;q('cf-check-summary').innerHTML=`<div><small>Matched</small><strong>${m}</strong></div><div><small>Not returned</small><strong>${n}</strong></div><div><small>Retry</small><strong>${r}</strong></div>`;}
async function exportChecks(status){const tg=await connector(),xs=await tg.listChecks(status);dl(`telegram_${status}.csv`,new Blob(['\ufeffphone,status,user_id,username,updated_at\r\n'+xs.map(x=>[x.phone,x.status,x.userId,x.username,new Date(x.updatedAt).toISOString()].map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));}
async function loadDialogsUI(){const tg=await connector(),a=await tg.activeAccountId();if(!a)return note('ابتدا حساب را انتخاب کنید.','bad');try{const ds=await tg.loadDialogs(a,150);q('tg-chat-list').innerHTML=ds.map(d=>`<div class="export-row"><div><strong>${esc(d.name||'Chat')}</strong><small dir="ltr">${d.username?'@'+esc(d.username)+' • ':''}${esc(d.id)}</small></div></div>`).join('')||'<div class="empty-state compact">چت خصوصی پیدا نشد.</div>'}catch(e){note(e.message,'bad')}}
function currentCampaign(){return {id:E.selectedCampaignId||`run-${Date.now()}`,title:q('camp-title').value.trim(),text:q('camp-text').value,ref:q('camp-ref').value.trim(),main:q('camp-main').value.trim(),stop:q('camp-stop').value.trim(),on:q('camp-on').value.trim(),request:q('camp-request').value.trim()};}
async function dryRun(){const tg=await connector(),purpose=q('cf-camp-purpose').value,phones=await eligiblePhones(purpose),checks=new Map((await tg.listChecks('matched')).map(x=>[x.phone,x]));const matched=phones.filter(p=>checks.has(p));q('cf-camp-run-state').textContent=`Dry Run: Audience مجاز ${phones.length} • Telegram Matched ${matched.length} • قابل ارسال فعلی ${matched.length}`;}
async function sendCampaignUI(){
  const tg=await connector(),account=q('cf-camp-account').value;if(!account)return note('حساب Telegram انتخاب نشده.','bad');const purpose=q('cf-camp-purpose').value,phones=await eligiblePhones(purpose);if(!phones.length)return note('Audience مجاز خالی است.','bad');
  if(purpose==='promotional'&&!confirm(`ارسال تبلیغاتی فقط به ${phones.length} مخاطب Opt‑in انجام شود؟`))return;
  E.stopSignal={stopped:false};q('cf-camp-run-state').textContent='کمپین شروع شد…';q('cf-camp-run-bar').style.width='0%';
  try{const out=await tg.sendCampaign(account,phones,currentCampaign(),{dailyCap:+q('cf-camp-cap').value||80,delayMs:+q('cf-camp-delay').value||1800,stopSignal:E.stopSignal,onProgress:p=>{const n=p.sent+p.failed+p.skipped,pct=p.total?Math.min(100,Math.round(n/p.total*100)):0;q('cf-camp-run-bar').style.width=pct+'%';q('cf-camp-run-state').textContent=`${p.state} • موفق ${p.sent} • خطا ${p.failed} • ردشده/نامچ ${p.skipped}${p.waitSeconds?' • FloodWait '+p.waitSeconds+'s':''}`;}});q('cf-camp-run-state').textContent=`پایان اجرا • موفق ${out.sent} • خطا ${out.failed} • Skip ${out.skipped}`;note('اجرای کمپین پایان یافت.');}catch(e){q('cf-camp-run-state').textContent=e.message;note(e.message,'bad')}
}
async function saveMiniSettings(){const u=q('cf-mini-url').value.trim(),b=q('cf-bot-user').value.trim().replace(/^@/,'');localStorage.setItem('cf_mini_url',u);localStorage.setItem('cf_bot_user',b);q('cf-mini-state').textContent='تنظیمات محلی ذخیره شد.';}
function loadMiniSettings(){q('cf-mini-url')&&(q('cf-mini-url').value=localStorage.getItem('cf_mini_url')||window.CONTACTFLOW_CONFIG?.miniAppUrl||'');q('cf-bot-user')&&(q('cf-bot-user').value=localStorage.getItem('cf_bot_user')||window.CONTACTFLOW_CONFIG?.botUsername||'');}
async function refreshDiagnostics(){
  const tg=await connector().catch(()=>null),d=tg?await tg.diagnostics():{configured:false,error:'connector unavailable'},features=featureRegistry();
  q('cf-diag-summary').innerHTML=`<div><small>نسخه</small><strong>${VERSION}</strong></div><div><small>Telegram Accounts</small><strong>${d.accounts||0}/10</strong></div><div><small>Secure Context</small><strong>${window.isSecureContext?'YES':'NO'}</strong></div><div><small>Features</small><strong>${features.length}</strong></div>`;
  q('cf-features').innerHTML=features.map(([,name,status])=>`<div class="feature-item"><span>✓</span><div><strong>${esc(name)}</strong><small>${status}</small></div></div>`).join('');
  const out={appVersion:VERSION,time:new Date().toISOString(),location:location.href,online:navigator.onLine,secureContext:window.isSecureContext,telegram:d,drive:window.ContactFlowDrive?.diagnostics?.()||null,features:features.map(x=>x[1])};q('cf-diag-json').textContent=JSON.stringify(out,null,2);return out;
}
async function fullBackup(){
  const stores=['contacts','imports','meta','settings','artifacts','contact_flags','campaigns','ad_requests','telegram_accounts','templates','activity','merge_runs','contact_images','watch_state'],data={format:'ContactFlowBackup',version:7,appVersion:VERSION,createdAt:new Date().toISOString(),stores:{},connectors:{}};
  for(const s of stores){try{data.stores[s]=await coreAll(s)}catch{data.stores[s]=[]}}
  const tg=await connector().catch(()=>null);if(tg)data.connectors.telegram=await tg.exportState();return data;
}
async function restoreFullBlob(blob){const data=JSON.parse(await blob.text());if(data.format!=='ContactFlowBackup')throw new Error('Backup معتبر نیست.');if(!confirm('Backup روی داده محلی بازیابی شود؟'))return;for(const [s,rows] of Object.entries(data.stores||{})){try{const tx=state.db.transaction(s,'readwrite'),st=tx.objectStore(s);st.clear();for(const r of rows)st.put(r)}catch(e){console.warn('restore',s,e)}}location.reload();}
window.ContactFlowFullBackup={create:fullBackup,restoreBlob:restoreFullBlob,download:async()=>{const d=await fullBackup(),blob=new Blob([JSON.stringify(d)],{type:'application/x-contactflow-backup'});dl(`ContactFlow_${new Date().toISOString().replace(/[:.]/g,'-')}.cfbackup`,blob);return blob;}};
async function refreshTelegram(){if(window.CONTACTFLOW_CONFIG?.telegramMode==='desktop_export_offline')return;await renderAccounts().catch(e=>console.warn(e));}
function bind(){
  q('tg-add-account')&&(q('tg-add-account').onclick=beginQr);q('tg-native-check')&&(q('tg-native-check').onclick=refreshTelegram);q('tg-qr-cancel')&&(q('tg-qr-cancel').onclick=async()=>{(await connector()).cancelQr();q('tg-qr-wrap').classList.add('hidden')});
  q('cf-account-refresh')&&(q('cf-account-refresh').onclick=refreshTelegram);q('tg-account-list')&&(q('tg-account-list').onclick=async e=>{const tg=await connector();if(e.target.dataset.cfActive){await tg.setActiveAccount(e.target.dataset.cfActive);await renderAccounts()}if(e.target.dataset.cfHealth){const r=await tg.accountHealth(e.target.dataset.cfHealth);note(r.ok?'حساب سالم و متصل است.':r.error,r.ok?'good':'bad')}if(e.target.dataset.cfRemove&&confirm('Session این حساب از این دستگاه حذف شود؟')){await tg.disconnectAccount(e.target.dataset.cfRemove);await renderAccounts()}});
  q('cf-tg-run-check')&&(q('cf-tg-run-check').onclick=runChecker);q('cf-tg-clear-check')&&(q('cf-tg-clear-check').onclick=async()=>{await (await connector()).clearChecks();renderCheckSummary([])});document.querySelectorAll('[data-cf-check-export]').forEach(b=>b.onclick=()=>exportChecks(b.dataset.cfCheckExport));q('cf-load-dialogs')&&(q('cf-load-dialogs').onclick=loadDialogsUI);
  q('cf-camp-dry')&&(q('cf-camp-dry').onclick=dryRun);q('cf-camp-send')&&(q('cf-camp-send').onclick=sendCampaignUI);q('cf-camp-stop')&&(q('cf-camp-stop').onclick=()=>{E.stopSignal.stopped=true;q('cf-camp-run-state').textContent='درخواست توقف ثبت شد.'});
  q('cf-mini-save')&&(q('cf-mini-save').onclick=saveMiniSettings);q('cf-mini-open')&&(q('cf-mini-open').onclick=()=>{const u=q('cf-mini-url').value.trim();if(u)window.open(u,'_blank')});q('cf-mini-bot')&&(q('cf-mini-bot').onclick=()=>{const b=q('cf-bot-user').value.trim().replace(/^@/,'');if(b)window.open('https://t.me/'+b,'_blank')});
  q('cf-diag-refresh')&&(q('cf-diag-refresh').onclick=refreshDiagnostics);q('cf-diag-export')&&(q('cf-diag-export').onclick=async()=>{const x=await refreshDiagnostics();dl('contactflow-diagnostics.json',new Blob([JSON.stringify(x,null,2)],{type:'application/json'}))});
  q('backup-create')&&(q('backup-create').onclick=()=>window.ContactFlowFullBackup.download().catch(e=>note(e.message,'bad')));
}
async function init(){await waitCore();insertStyles();addNavPage();patchSetPage();upgradeTelegramUI();upgradeCampaignUI();upgradeBackupUI();bind();loadMiniSettings();await refreshTelegram();console.info(`ContactFlow enhancements ${VERSION} ready`);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>init().catch(console.error),0));else setTimeout(()=>init().catch(console.error),0);
})();
