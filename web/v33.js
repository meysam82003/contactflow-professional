(() => {
'use strict';

const VERSION='3.4.0';
const PAGE_SIZE_DEFAULT=50;
const FIELDS=['name','phone','username','telegramId','city','section','source'];
const FEATURES=[
  ['shared-core','هسته یکسان Mini App، PWA، Android و Desktop'],
  ['telegram-user-session','اتصال رسمی User Session با QR'],
  ['telegram-contacts','دریافت فهرست واقعی Telegram Contacts'],
  ['credential-choice','API credentials در Build یا فقط روی دستگاه'],
  ['encrypted-session','Session رمزگذاری‌شده در IndexedDB محلی'],
  ['offline-snapshot','Snapshot آفلاین مخاطبین تلگرام'],
  ['force-refresh','بروزرسانی اجباری از Telegram'],
  ['contact-search','جستجوی نام، شماره، Username و ID'],
  ['contact-sort','مرتب‌سازی چندفیلدی دوطرفه'],
  ['mutual-filter','فیلتر مخاطب دوطرفه'],
  ['privacy-filter','حذف Bot و حساب Deleted از خروجی پیش‌فرض'],
  ['no-phone-filter','کنترل مخاطبین فاقد شماره'],
  ['bulk-selection','انتخاب صفحه یا همه نتایج'],
  ['export-fields','انتخاب ستون‌های خروجی'],
  ['export-five','CSV، VCF، TXT، JSON و XLS'],
  ['chunk-export','تقسیم خروجی به قطعات'],
  ['zip-export','بسته ZIP چندبخشی'],
  ['saved-profiles','پروفایل ذخیره‌شده خروجی'],
  ['formula-guard','محافظت CSV/XLS در برابر Formula Injection'],
  ['native-save','ذخیره بومی Android و Desktop'],
  ['mobile-share','اشتراک فایل از Share Sheet'],
  ['telegram-theme','هماهنگی پوسته با Telegram'],
  ['telegram-safe-area','رعایت Safe Area و Viewport Mini App'],
  ['telegram-fullscreen','Fullscreen و Home Screen در نسخه‌های پشتیبانی‌شده'],
  ['local-import','ورود مخاطبین Telegram به دیتابیس ContactFlow'],
  ['safe-undo','بازگردانی فقط مخاطبین جدید آخرین Import'],
  ['duplicate-guard','حذف تکراری بر پایه Telegram ID، شماره و Username'],
  ['cache-cleanup','پاک‌سازی Snapshot محلی بدون حذف حساب Telegram'],
  ['account-health','Health Check و انتخاب حساب فعال'],
  ['keyboard-shortcuts','میان‌بر جستجو، خروجی و لغو انتخاب'],
  ['audit-log','ثبت Refresh، Export، Import و Cleanup در Activity Log'],
  ['diagnostics','Diagnostics قابل خروجی برای همه پوسته‌ها'],
  ['offline-aware','نمایش وضعیت Offline و استفاده از کش'],
  ['accessible-table','جدول واکنش‌گرا با Label و وضعیت انتخاب'],
  ['installable','PWA install و Mini App home shortcut']
];

const S={rows:[],filtered:[],selected:new Set(),page:1,pageSize:PAGE_SIZE_DEFAULT,entries:[],lastImported:[],lastSync:0,loading:false};
const q=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const fmt=new Intl.NumberFormat('fa-IR');

function notify(message,type='good'){
  try{if(typeof toast==='function')return toast(message,type,5000)}catch{}
  console[type==='bad'?'error':'info'](message);
}
async function waitCore(){for(let i=0;i<240;i++){try{if(state?.db&&window.ContactFlowContactExport)return}catch{}await sleep(50)}throw new Error('هسته ContactFlow آماده نشد.');}
async function telegram(){for(let i=0;i<240;i++){if(window.ContactFlowTelegramWeb)return window.ContactFlowTelegramWeb;await sleep(50)}throw new Error('Connector تلگرام بارگذاری نشد.');}
function runtimeKind(){if(window.Telegram?.WebApp?.initData)return 'telegram-miniapp';if(window.ContactFlowAndroid)return 'android';if(location.hostname==='127.0.0.1'||location.hostname==='localhost')return 'desktop';return matchMedia('(display-mode: standalone)').matches?'pwa':'web';}
function logActivity(type,message,meta={}){try{if(typeof log==='function')return log(type,message,meta)}catch{}return Promise.resolve();}

async function blobBase64(blob){
  const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';
  for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
}
async function deliver(entry,{share=false}={}){
  const file=typeof File==='function'?new File([entry.blob],entry.name,{type:entry.blob.type||'application/octet-stream'}):entry.blob;
  if(share&&typeof File==='function'&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:entry.name});return 'share';}
  if(window.ContactFlowAndroid?.saveDocument){window.ContactFlowAndroid.saveDocument(entry.name,file.type,await blobBase64(entry.blob));return 'android';}
  const url=URL.createObjectURL(entry.blob),a=document.createElement('a');a.href=url;a.download=entry.name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);return 'download';
}

function applyTelegramTheme(){
  const app=window.Telegram?.WebApp;if(!app)return;
  const theme=app.themeParams||{},root=document.documentElement;
  const map={bg_color:'--tg-bg',text_color:'--tg-text',hint_color:'--tg-hint',link_color:'--tg-link',button_color:'--tg-button',button_text_color:'--tg-button-text',secondary_bg_color:'--tg-secondary'};
  Object.entries(map).forEach(([key,css])=>theme[key]&&root.style.setProperty(css,theme[key]));
  root.classList.toggle('light',app.colorScheme==='light');
}
function initTelegramHost(){
  const app=window.Telegram?.WebApp;if(!app)return;
  document.body.dataset.telegramMiniapp='true';app.ready();app.expand();applyTelegramTheme();
  try{app.setHeaderColor('secondary_bg_color');app.setBackgroundColor('bg_color');app.enableClosingConfirmation();}catch{}
  app.onEvent?.('themeChanged',applyTelegramTheme);
  app.onEvent?.('safeAreaChanged',()=>document.documentElement.style.setProperty('--cf-safe-bottom',`${app.safeAreaInset?.bottom||0}px`));
  document.documentElement.style.setProperty('--cf-safe-bottom',`${app.safeAreaInset?.bottom||0}px`);
}

function addNavigation(){
  const nav=q('nav');if(nav&&!q('cf33-tg-contacts-nav')){
    const button=document.createElement('button');button.id='cf33-tg-contacts-nav';button.className='nav-item';button.dataset.page='telegram-contacts';button.innerHTML='◉ <span>مخاطبین تلگرام</span>';
    const before=nav.querySelector('[data-page="campaign"]');nav.insertBefore(button,before||null);
  }
  const bottom=q('bottom-nav');if(bottom&&!bottom.querySelector('[data-page="telegram-contacts"]')){
    const button=document.createElement('button');button.dataset.page='telegram-contacts';button.innerHTML='◉<span>تلگرام</span>';bottom.appendChild(button);
  }
  try{pageMeta['telegram-contacts']=['مخاطبین تلگرام','مشاهده و خروجی رسمی از User Session همین دستگاه']}catch{}
}

function pageMarkup(){return `
<section class="page cf33-page" data-page="telegram-contacts">
  <article class="panel callout cf33-callout"><div><strong>دسترسی واقعی، نه دسترسی ساختگی Mini App</strong><p>Telegram.WebApp به‌تنهایی فهرست مخاطبین حساب را نمی‌دهد. این بخش پس از ورود QR به User API رسمی وصل می‌شود؛ Snapshot و Session فقط در همین Origin/دستگاه نگه‌داری می‌شوند.</p></div><span id="cf33-runtime" class="pill active">${esc(runtimeKind())}</span></article>
  <div class="layout-2">
    <article class="panel form-panel"><div class="panel-head"><div><h2>اتصال User API</h2><p>API ID/Hash شخصی یا تنظیم Build</p></div><span id="cf33-credential-state" class="pill queued">بررسی…</span></div>
      <div class="form-grid"><label><span>API ID</span><input id="cf33-api-id" inputmode="numeric" dir="ltr" autocomplete="off"></label><label><span>API Hash</span><input id="cf33-api-hash" type="password" dir="ltr" autocomplete="off"></label></div>
      <div class="button-row"><button id="cf33-save-credentials" class="primary-soft">ذخیره فقط روی دستگاه</button><button id="cf33-clear-credentials" class="danger-btn">حذف تنظیم محلی</button><button id="cf33-api-help" class="ghost-btn">ساخت API در Telegram</button></div>
      <p class="hint">Session داخلی اپ Telegram به JavaScript داده نمی‌شود. ورود QR مستقل لازم است و برای اسکن QR روی موبایل معمولاً به دستگاه دوم نیاز دارید.</p>
    </article>
    <article class="panel form-panel"><div class="panel-head"><div><h2>حساب و Snapshot</h2><p id="cf33-sync-state">هنوز بارگذاری نشده</p></div><span id="cf33-offline" class="pill queued">Online</span></div>
      <label><span>حساب فعال</span><select id="cf33-account"><option value="">حسابی متصل نیست</option></select></label>
      <div class="button-row"><button id="cf33-connect" class="primary-btn">اتصال/مدیریت QR</button><button id="cf33-refresh" class="primary-soft">دریافت از Telegram</button><button id="cf33-cache" class="ghost-btn">نمایش Snapshot</button><button id="cf33-clear-cache" class="danger-btn">پاک کردن Snapshot</button></div>
      <div class="button-row cf33-mini-actions"><button id="cf33-fullscreen" class="ghost-btn">تمام‌صفحه</button><button id="cf33-home" class="ghost-btn">افزودن به صفحه اصلی</button><button id="cf33-request-own" class="ghost-btn">درخواست شماره خودم</button></div>
    </article>
  </div>
  <div class="metrics-grid cf33-metrics"><article class="metric-card"><span>کل</span><strong id="cf33-total">0</strong></article><article class="metric-card"><span>دارای شماره</span><strong id="cf33-phone-count">0</strong></article><article class="metric-card"><span>دارای Username</span><strong id="cf33-user-count">0</strong></article><article class="metric-card"><span>دوطرفه</span><strong id="cf33-mutual-count">0</strong></article></div>
  <article class="panel"><div class="panel-head responsive"><div><h2>فهرست مخاطبین Telegram</h2><p id="cf33-result-count">0 نتیجه</p></div><div class="filters cf33-filters"><input id="cf33-search" placeholder="نام، شماره، Username یا ID" aria-label="جستجوی مخاطبین تلگرام"><select id="cf33-sort" aria-label="مرتب‌سازی"><option value="name">نام</option><option value="phone">شماره</option><option value="username">Username</option><option value="telegramId">Telegram ID</option><option value="updatedAt">آخرین Sync</option></select><select id="cf33-direction" aria-label="جهت مرتب‌سازی"><option value="asc">صعودی</option><option value="desc">نزولی</option></select><select id="cf33-page-size" aria-label="تعداد صفحه"><option>25</option><option selected>50</option><option>100</option><option>250</option></select></div></div>
    <div class="cf33-filter-row"><label><input id="cf33-mutual" type="checkbox"> فقط مخاطب دوطرفه</label><label><input id="cf33-without-phone" type="checkbox" checked> نمایش بدون شماره</label><button id="cf33-select-page" class="ghost-btn">انتخاب این صفحه</button><button id="cf33-select-all" class="ghost-btn">انتخاب همه نتایج</button><button id="cf33-clear-selection" class="ghost-btn">لغو انتخاب</button><span id="cf33-selection" class="pill queued">0 انتخاب</span></div>
    <div class="table-wrap cf33-table"><table><thead><tr><th><input id="cf33-head-check" type="checkbox" aria-label="انتخاب صفحه"></th><th>نام</th><th>شماره</th><th>Username</th><th>Telegram ID</th><th>وضعیت</th></tr></thead><tbody id="cf33-table"><tr><td colspan="6">ابتدا حساب را متصل و فهرست را دریافت کنید.</td></tr></tbody></table></div>
    <div class="pagination"><button id="cf33-prev" class="ghost-btn">قبلی</button><span id="cf33-page-indicator">صفحه ۱</span><button id="cf33-next" class="ghost-btn">بعدی</button></div>
  </article>
  <div class="layout-2 wide-left">
    <article class="panel form-panel"><div class="panel-head"><div><h2>تنظیمات خروجی</h2><p>برای همه نتایج فیلترشده یا فقط انتخاب‌ها</p></div><span class="pill active">همان موتور همه دستگاه‌ها</span></div>
      <div class="form-grid"><label><span>فرمت</span><select id="cf33-format"><option value="csv">CSV</option><option value="vcf">VCF / vCard</option><option value="txt">TXT</option><option value="json">JSON</option><option value="xls">Excel / XLS</option></select></label><label><span>تعداد هر فایل</span><input id="cf33-chunk" type="number" min="1" max="100000" value="10000"></label><label><span>نام فایل</span><input id="cf33-base" value="telegram_contacts"></label><label><span>پروفایل خروجی</span><select id="cf33-profile"><option value="">بدون پروفایل</option></select></label></div>
      <div class="cf33-field-grid">${FIELDS.map(field=>`<label><input data-cf33-field="${field}" type="checkbox" checked> ${field}</label>`).join('')}</div>
      <label class="switch-row"><input id="cf33-selected-only" type="checkbox"><span class="switch"></span><div><strong>فقط مخاطبین انتخاب‌شده</strong><small>اگر انتخاب خالی باشد خروجی ساخته نمی‌شود.</small></div></label>
      <label class="switch-row"><input id="cf33-zip" type="checkbox"><span class="switch"></span><div><strong>ZIP برای خروجی چندبخشی</strong><small>نام و Chunk مطابق تنظیمات بالا.</small></div></label>
      <div class="button-row"><button id="cf33-export" class="primary-btn">ساخت خروجی</button><button id="cf33-share" class="primary-soft">ساخت و اشتراک</button><button id="cf33-save-profile" class="ghost-btn">ذخیره پروفایل</button></div>
      <div class="button-row"><button id="cf33-import-local" class="primary-soft">افزودن شماره‌ها به ContactFlow</button><button id="cf33-undo-import" class="danger-btn" disabled>بازگردانی آخرین ورود</button></div>
    </article>
    <article class="panel"><div class="panel-head"><div><h2>فایل‌های آماده</h2><p id="cf33-export-state">هنوز خروجی ساخته نشده.</p></div></div><div id="cf33-files" class="exports-list"><div class="empty-state compact">خروجی اینجا نمایش داده می‌شود.</div></div></article>
  </div>
  <details class="panel cf33-feature-panel"><summary>قابلیت‌های فعال نسخه ۳.۳ (${FEATURES.length})</summary><div class="feature-grid">${FEATURES.map(([,name])=>`<div class="feature-item"><span>✓</span><div><strong>${esc(name)}</strong><small>فعال در هسته مشترک</small></div></div>`).join('')}</div></details>
</section>`}

function addPage(){
  if(document.querySelector('.page[data-page="telegram-contacts"]'))return;
  document.querySelector('main.main')?.insertAdjacentHTML('beforeend',pageMarkup());
}

function patchRouting(){
  const old=window.setPage;if(typeof old!=='function'||old.__cf33)return;
  const wrapped=function(page){old(page);document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',el.dataset.page===page));document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===page));if(page==='telegram-contacts'){S.page=1;refreshAccounts().then(()=>loadCached()).catch(error=>notify(error.message,'bad'));q('cf33-search')?.focus({preventScroll:true})}try{localStorage.setItem('cf33_last_page',page)}catch{}};
  wrapped.__cf33=true;window.setPage=wrapped;
  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-page="telegram-contacts"]');if(button){event.preventDefault();window.setPage('telegram-contacts')}});
}

function credentialUI(status){
  const el=q('cf33-credential-state');if(!el)return;el.textContent=status.configured?`${status.source==='local'?'روی دستگاه':'داخل Build'} • ${status.apiId}`:'تنظیم نشده';el.className=`pill ${status.configured?'active':'queued'}`;
  if(status.source==='local'&&status.apiId)q('cf33-api-id').value=String(status.apiId);
}
async function refreshAccounts(){
  const tg=await telegram(),status=tg.credentialStatus();credentialUI(status);
  const accounts=await tg.listAccounts(),active=await tg.activeAccountId(),select=q('cf33-account');
  select.innerHTML=accounts.length?accounts.map(account=>`<option value="${esc(account.id)}" ${account.id===active?'selected':''}>${esc(account.username?'@'+account.username:[account.firstName,account.lastName].filter(Boolean).join(' ')||account.telegramId)}</option>`).join(''):'<option value="">حسابی متصل نیست</option>';
  if(accounts.length&&!active){await tg.setActiveAccount(accounts[0].id);select.value=accounts[0].id}
}
function activeAccount(){return q('cf33-account')?.value||'';}

function updateMetrics(){
  q('cf33-total').textContent=fmt.format(S.rows.length);q('cf33-phone-count').textContent=fmt.format(S.rows.filter(row=>row.phone).length);q('cf33-user-count').textContent=fmt.format(S.rows.filter(row=>row.username).length);q('cf33-mutual-count').textContent=fmt.format(S.rows.filter(row=>row.isMutual).length);
}
function filteredRows(){
  const api=window.ContactFlowContactExport;
  const rows=api.filterRecords(S.rows,{query:q('cf33-search').value,includeWithoutPhone:q('cf33-without-phone').checked,includeBots:false,includeDeleted:false,mutualOnly:q('cf33-mutual').checked});
  return api.sortRecords(rows,q('cf33-sort').value,q('cf33-direction').value);
}
function renderRows(){
  S.filtered=filteredRows();S.pageSize=Math.max(1,Number(q('cf33-page-size').value)||PAGE_SIZE_DEFAULT);
  const pages=Math.max(1,Math.ceil(S.filtered.length/S.pageSize));S.page=Math.min(Math.max(1,S.page),pages);
  const start=(S.page-1)*S.pageSize,rows=S.filtered.slice(start,start+S.pageSize);
  q('cf33-result-count').textContent=`${fmt.format(S.filtered.length)} نتیجه از ${fmt.format(S.rows.length)}`;
  q('cf33-table').innerHTML=rows.length?rows.map(row=>`<tr><td><input class="cf33-row-check" type="checkbox" data-key="${esc(row.key)}" ${S.selected.has(row.key)?'checked':''} aria-label="انتخاب ${esc(row.name)}"></td><td><strong>${esc(row.name)}</strong>${row.isPremium?'<small class="cf33-badge">Premium</small>':''}</td><td dir="ltr">${esc(row.phone||'—')}</td><td dir="ltr">${row.username?'@'+esc(row.username):'—'}</td><td dir="ltr">${esc(row.telegramId)}</td><td>${row.isMutual?'<span class="pill active">دوطرفه</span>':'<span class="pill queued">Contact</span>'}</td></tr>`).join(''):'<tr><td colspan="6">موردی با این فیلتر پیدا نشد.</td></tr>';
  q('cf33-page-indicator').textContent=`صفحه ${fmt.format(S.page)} از ${fmt.format(pages)}`;q('cf33-prev').disabled=S.page<=1;q('cf33-next').disabled=S.page>=pages;
  q('cf33-head-check').checked=rows.length>0&&rows.every(row=>S.selected.has(row.key));updateSelection();persistFilters();
}
function updateSelection(){q('cf33-selection').textContent=`${fmt.format(S.selected.size)} انتخاب`;}
function currentPageRows(){const start=(S.page-1)*S.pageSize;return S.filtered.slice(start,start+S.pageSize);}

async function loadCached(){
  const account=activeAccount();if(!account){S.rows=[];updateMetrics();renderRows();return}
  const tg=await telegram(),rows=await tg.getCachedContacts(account);S.rows=window.ContactFlowContactExport.dedupeRecords(rows);S.lastSync=rows.reduce((max,row)=>Math.max(max,row.updatedAt||0),0);updateMetrics();renderRows();q('cf33-sync-state').textContent=rows.length?`Snapshot محلی • ${new Date(S.lastSync).toLocaleString('fa-IR')}`:'Snapshot خالی است';
}
async function loadRemote(){
  if(S.loading)return;const account=activeAccount();if(!account)return notify('ابتدا حساب Telegram را متصل و انتخاب کنید.','bad');if(!navigator.onLine)return notify('Offline هستید؛ Snapshot محلی را نمایش دهید.','bad');
  S.loading=true;q('cf33-refresh').disabled=true;q('cf33-sync-state').textContent='در حال اتصال به Telegram…';
  try{const tg=await telegram(),out=await tg.listTelegramContacts(account,{force:true,onProgress:p=>{q('cf33-sync-state').textContent=p.state==='saving'?`ذخیره ${fmt.format(p.done)} از ${fmt.format(p.total)}`:'دریافت از Telegram…'}});S.rows=window.ContactFlowContactExport.dedupeRecords(out.contacts);S.lastSync=out.updatedAt||Date.now();S.selected.clear();S.page=1;updateMetrics();renderRows();q('cf33-sync-state').textContent=`${fmt.format(S.rows.length)} مخاطب • ${out.cached?'Snapshot':'Telegram'} • ${new Date(S.lastSync).toLocaleString('fa-IR')}`;await logActivity('telegram-contacts','فهرست مخاطبین Telegram بروزرسانی شد',{count:S.rows.length,accountId:account});notify(`${fmt.format(S.rows.length)} مخاطب Telegram دریافت شد.`)}catch(error){q('cf33-sync-state').textContent=error.message;notify(error.message,'bad')}finally{S.loading=false;q('cf33-refresh').disabled=false}
}
async function clearCache(){
  const account=activeAccount();if(!account)return;const count=await (await telegram()).clearContactCache(account);S.rows=[];S.selected.clear();updateMetrics();renderRows();q('cf33-sync-state').textContent='Snapshot پاک شد';await logActivity('telegram-contacts','Snapshot مخاطبین Telegram پاک شد',{count,accountId:account});notify(`${fmt.format(count)} رکورد Snapshot پاک شد.`);
}

function exportOptions(){return {format:q('cf33-format').value,chunkSize:Math.max(1,Math.min(100000,Number(q('cf33-chunk').value)||10000)),baseName:q('cf33-base').value,zip:q('cf33-zip').checked,fields:[...document.querySelectorAll('[data-cf33-field]:checked')].map(el=>el.dataset.cf33Field),includeWithoutPhone:q('cf33-without-phone').checked,includeBots:false,includeDeleted:false,mutualOnly:q('cf33-mutual').checked,query:q('cf33-search').value,sortBy:q('cf33-sort').value,sortDirection:q('cf33-direction').value};}
function rowsForExport(){if(!q('cf33-selected-only').checked)return S.filtered;const rows=S.rows.filter(row=>S.selected.has(row.key));if(!rows.length)throw new Error('هیچ مخاطبی انتخاب نشده است.');return rows;}
async function makeEntries(){
  const options=exportOptions(),rows=rowsForExport(),plan=window.ContactFlowContactExport.buildExportPlan(rows,{...options,query:'',mutualOnly:false,includeWithoutPhone:true});if(!plan.length)throw new Error('خروجی با فیلتر فعلی خالی است.');
  if(options.zip&&plan.length>1&&typeof makeZip==='function'){const blob=await makeZip(plan);return [{name:`${window.ContactFlowContactExport.safeFilename(options.baseName,'telegram_contacts')}_${String(plan.length).padStart(2,'0')}_parts.zip`,count:plan.reduce((sum,row)=>sum+row.count,0),blob}]}
  return plan;
}
function renderEntries(entries){
  S.entries=entries;q('cf33-export-state').textContent=`${fmt.format(entries.reduce((sum,item)=>sum+item.count,0))} رکورد در ${fmt.format(entries.length)} فایل`;
  q('cf33-files').innerHTML=entries.map((entry,index)=>`<div class="export-row"><div><strong>${esc(entry.name)}</strong><small>${fmt.format(entry.count)} رکورد • ${fmt.format(entry.blob.size)} بایت</small></div><div class="button-row"><button class="download-btn" data-cf33-download="${index}">ذخیره</button><button class="ghost-btn" data-cf33-share="${index}">اشتراک</button></div></div>`).join('');
}
async function buildAndDeliver(share=false){
  try{const entries=await makeEntries();renderEntries(entries);await deliver(entries[0],{share});await logActivity('telegram-export','خروجی مخاطبین Telegram ساخته شد',{files:entries.length,count:entries.reduce((sum,item)=>sum+item.count,0),format:q('cf33-format').value});notify(entries.length>1&&!q('cf33-zip').checked?'فایل اول ذخیره شد؛ بقیه از فهرست قابل ذخیره‌اند.':'خروجی آماده شد.')}catch(error){notify(error.message,'bad')}
}

async function missingRows(rows){
  const candidates=rows.filter(row=>row.phone),missing=[];if(!candidates.length)return missing;
  await new Promise((resolve,reject)=>{const tx=state.db.transaction('contacts','readonly'),store=tx.objectStore('contacts');for(const row of candidates){const request=store.get(row.phone);request.onsuccess=()=>{if(!request.result)missing.push(row)};request.onerror=()=>reject(request.error)}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});return missing;
}
async function importLocal(){
  try{const source=rowsForExport(),fresh=await missingRows(source);if(!fresh.length)return notify('شماره جدیدی برای افزودن وجود ندارد.','bad');const records=fresh.map(row=>({phone:row.phone,name:row.name||row.username||row.phone,city:'Telegram',section:row.isMutual?'Mutual':'Contacts',source:'Telegram Contacts 3.4',sourceFiles:['Telegram Contacts'],telegramStatus:'matched',telegramId:row.telegramId,username:row.username,createdAt:Date.now()}));let added=0;for(let i=0;i<records.length;i+=1000){const result=await addContactsBatch(records.slice(i,i+1000));added+=result.added}S.lastImported=records.slice(0,added).map(row=>row.phone);q('cf33-undo-import').disabled=!S.lastImported.length;await rebuildStats();await fillCitySelects();await addArtifact({type:'telegram-contacts-import',name:'Telegram Contacts',city:'Telegram',count:added});await logActivity('telegram-contacts','مخاطبین Telegram به ContactFlow افزوده شدند',{added});notify(`${fmt.format(added)} مخاطب جدید افزوده شد.`)}catch(error){notify(error.message,'bad')}
}
async function undoImport(){
  if(!S.lastImported.length||!confirm(`فقط ${S.lastImported.length} مخاطب جدید آخرین ورود حذف شود؟`))return;
  const phones=[...S.lastImported];await new Promise((resolve,reject)=>{const tx=state.db.transaction('contacts','readwrite'),store=tx.objectStore('contacts');phones.forEach(phone=>store.delete(phone));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});S.lastImported=[];q('cf33-undo-import').disabled=true;await rebuildStats();await fillCitySelects();await logActivity('telegram-contacts','آخرین Import مخاطبین Telegram بازگردانی شد',{removed:phones.length});notify(`${fmt.format(phones.length)} مخاطب آخرین ورود حذف شد.`);
}

function profiles(){try{return JSON.parse(localStorage.getItem('cf33_export_profiles')||'[]')}catch{return []}}
function renderProfiles(){const list=profiles(),select=q('cf33-profile');select.innerHTML='<option value="">بدون پروفایل</option>'+list.map((profile,index)=>`<option value="${index}">${esc(profile.name)}</option>`).join('')}
function saveProfile(){const name=prompt('نام پروفایل خروجی:');if(!name)return;const list=profiles();list.push({name:String(name).trim(),options:exportOptions(),selectedOnly:q('cf33-selected-only').checked});localStorage.setItem('cf33_export_profiles',JSON.stringify(list.slice(-20)));renderProfiles();q('cf33-profile').value=String(Math.min(list.length,20)-1);notify('پروفایل خروجی ذخیره شد.')}
function loadProfile(index){const profile=profiles()[Number(index)];if(!profile)return;const o=profile.options||{};q('cf33-format').value=o.format||'csv';q('cf33-chunk').value=o.chunkSize||10000;q('cf33-base').value=o.baseName||'telegram_contacts';q('cf33-zip').checked=!!o.zip;q('cf33-selected-only').checked=!!profile.selectedOnly;document.querySelectorAll('[data-cf33-field]').forEach(el=>el.checked=(o.fields||FIELDS).includes(el.dataset.cf33Field));}

function persistFilters(){try{localStorage.setItem('cf33_tg_filters',JSON.stringify({sort:q('cf33-sort').value,direction:q('cf33-direction').value,pageSize:q('cf33-page-size').value,mutual:q('cf33-mutual').checked,withoutPhone:q('cf33-without-phone').checked}))}catch{}}
function restoreFilters(){try{const f=JSON.parse(localStorage.getItem('cf33_tg_filters')||'{}');if(f.sort)q('cf33-sort').value=f.sort;if(f.direction)q('cf33-direction').value=f.direction;if(f.pageSize)q('cf33-page-size').value=f.pageSize;q('cf33-mutual').checked=!!f.mutual;if(f.withoutPhone!==undefined)q('cf33-without-phone').checked=!!f.withoutPhone}catch{}}
function updateOnline(){const online=navigator.onLine;q('cf33-offline').textContent=online?'Online':'Offline • Snapshot';q('cf33-offline').className=`pill ${online?'active':'danger'}`;q('cf33-refresh').disabled=!online||S.loading}

function bind(){
  q('cf33-save-credentials').onclick=async()=>{try{const status=(await telegram()).configureCredentials(q('cf33-api-id').value,q('cf33-api-hash').value);q('cf33-api-hash').value='';credentialUI(status);notify('تنظیم Telegram فقط در همین دستگاه ذخیره شد.')}catch(error){notify(error.message,'bad')}};
  q('cf33-clear-credentials').onclick=async()=>{if(!confirm('تنظیم محلی API حذف شود؟ Sessionها حذف نمی‌شوند اما بدون همان credentials باز نمی‌شوند.'))return;credentialUI((await telegram()).clearCredentials());q('cf33-api-id').value='';q('cf33-api-hash').value=''};
  q('cf33-api-help').onclick=()=>{const url='https://my.telegram.org/apps';window.Telegram?.WebApp?.openLink?window.Telegram.WebApp.openLink(url):window.open(url,'_blank','noopener')};
  q('cf33-connect').onclick=()=>window.setPage('telegram');q('cf33-refresh').onclick=loadRemote;q('cf33-cache').onclick=loadCached;q('cf33-clear-cache').onclick=()=>confirm('Snapshot محلی مخاطبین تلگرام پاک شود؟')&&clearCache();
  q('cf33-account').onchange=async event=>{await (await telegram()).setActiveAccount(event.target.value||null);S.selected.clear();S.page=1;await loadCached()};
  ['cf33-search','cf33-sort','cf33-direction','cf33-page-size','cf33-mutual','cf33-without-phone'].forEach(id=>{const el=q(id);el.addEventListener(id==='cf33-search'?'input':'change',()=>{S.page=1;renderRows()})});
  q('cf33-prev').onclick=()=>{if(S.page>1){S.page--;renderRows()}};q('cf33-next').onclick=()=>{if(S.page*S.pageSize<S.filtered.length){S.page++;renderRows()}};
  q('cf33-table').onclick=event=>{const input=event.target.closest?.('.cf33-row-check');if(!input)return;input.checked?S.selected.add(input.dataset.key):S.selected.delete(input.dataset.key);updateSelection()};
  q('cf33-head-check').onchange=event=>{currentPageRows().forEach(row=>event.target.checked?S.selected.add(row.key):S.selected.delete(row.key));renderRows()};
  q('cf33-select-page').onclick=()=>{currentPageRows().forEach(row=>S.selected.add(row.key));renderRows()};q('cf33-select-all').onclick=()=>{S.filtered.forEach(row=>S.selected.add(row.key));renderRows()};q('cf33-clear-selection').onclick=()=>{S.selected.clear();renderRows()};
  q('cf33-export').onclick=()=>buildAndDeliver(false);q('cf33-share').onclick=()=>buildAndDeliver(true);q('cf33-files').onclick=event=>{const down=event.target.dataset.cf33Download,share=event.target.dataset.cf33Share;if(down!==undefined)deliver(S.entries[Number(down)]).catch(error=>notify(error.message,'bad'));if(share!==undefined)deliver(S.entries[Number(share)],{share:true}).catch(error=>notify(error.message,'bad'))};
  q('cf33-import-local').onclick=importLocal;q('cf33-undo-import').onclick=undoImport;q('cf33-save-profile').onclick=saveProfile;q('cf33-profile').onchange=event=>loadProfile(event.target.value);
  q('cf33-fullscreen').onclick=()=>{const app=window.Telegram?.WebApp;if(app?.requestFullscreen)app.requestFullscreen();else document.documentElement.requestFullscreen?.()};q('cf33-home').onclick=()=>window.Telegram?.WebApp?.addToHomeScreen?.();q('cf33-request-own').onclick=()=>{const app=window.Telegram?.WebApp;if(!app?.requestContact)return notify('این قابلیت فقط داخل Telegram Mini App در دسترس است.','bad');app.requestContact(ok=>notify(ok?'درخواست شماره به Bot ارسال شد؛ WebApp فهرست مخاطبین را از این مسیر دریافت نمی‌کند.':'درخواست شماره لغو شد.',ok?'good':'bad'))};
  addEventListener('online',updateOnline);addEventListener('offline',updateOnline);
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();window.setPage('telegram-contacts');q('cf33-search').focus()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='e'&&document.querySelector('.page[data-page="telegram-contacts"]')?.classList.contains('active')){event.preventDefault();buildAndDeliver(false)}if(event.key==='Escape'&&S.selected.size){S.selected.clear();renderRows()}});
}

function updateVersion(){
  document.title='ContactFlow Personal Ultimate 3.4';document.body.dataset.runtime=runtimeKind();
  document.querySelectorAll('.brand span,.setting-box code,.callout strong').forEach(el=>{el.textContent=el.textContent.replace(/3\.[013](?:\.0(?:-alpha\.1)?)?/g,'3.4.0')});
  let meta=document.querySelector('meta[name="application-name"]');if(!meta){meta=document.createElement('meta');meta.name='application-name';document.head.appendChild(meta)}meta.content='ContactFlow 3.4';
}
async function diagnostics(){
  const tg=await telegram().catch(()=>null),td=tg?await tg.diagnostics():null;
  return {version:VERSION,runtime:runtimeKind(),online:navigator.onLine,secureContext:isSecureContext,telegramHost:!!window.Telegram?.WebApp,telegram:td,contactSnapshot:S.rows.length,selected:S.selected.size,features:Object.fromEntries(FEATURES.map(([id])=>[id,true]))};
}

async function init(){
  await waitCore();initTelegramHost();addNavigation();addPage();patchRouting();updateVersion();restoreFilters();renderProfiles();bind();updateOnline();await refreshAccounts();await loadCached();
  window.ContactFlow33={VERSION,FEATURES,diagnostics,loadTelegramContacts:loadRemote,exportTelegramContacts:makeEntries};
  window.dispatchEvent(new CustomEvent('contactflow:3.3-ready',{detail:{version:VERSION,runtime:runtimeKind()}}));
  const last=localStorage.getItem('cf33_last_page');if(location.hash==='#telegram-contacts'||last==='telegram-contacts')window.setPage('telegram-contacts');
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init().catch(error=>{console.error(error);notify(error.message,'bad')}));else init().catch(error=>{console.error(error);notify(error.message,'bad')});
})();
