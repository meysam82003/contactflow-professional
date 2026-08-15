(() => {
'use strict';
const U={generated:null,media:null,driveToken:null};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitDB(){for(let i=0;i<100;i++){if(typeof state!=='undefined'&&state.db)return state.db;await sleep(50)}throw new Error('Local DB آماده نشد');}
function uStore(n,m='readonly'){return state.db.transaction(n,m).objectStore(n)}
function uReq(r){return new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function uAll(n){return uReq(uStore(n).getAll()).then(x=>x||[])}
function uPut(n,o){return uReq(uStore(n,'readwrite').put(o))}
function uDel(n,k){return uReq(uStore(n,'readwrite').delete(k))}
function uClear(n){return uReq(uStore(n,'readwrite').clear())}
function uId(){return crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function csv(v){v=String(v??'');return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function dl(name,blob){if(window.ContactFlowAndroid?.saveDocument){blob.arrayBuffer().then(buf=>{const u8=new Uint8Array(buf);let bin='';for(let i=0;i<u8.length;i+=0x8000)bin+=String.fromCharCode(...u8.subarray(i,i+0x8000));window.ContactFlowAndroid.saveDocument(name,blob.type||'application/octet-stream',btoa(bin));});return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2500)}
async function log(type,message,meta={}){try{await uPut('activity',{id:uId(),type,message,meta,createdAt:Date.now()});}catch{} }

// ---------- Generator ----------
function genPlan(){return {prefix:$('gen-prefix').value,count:Math.min(1e6,Math.max(1,+$('gen-count').value||1)),start:Math.max(0,+$('gen-start').value||0),mode:$('gen-mode').value,city:$('gen-city').value.trim()||'بدون عنوان',section:$('gen-section').value.trim(),source:$('gen-source').value.trim()||'generator',template:$('gen-template').value.trim()||'{city} {n:000000}'}}
function genAt(p,i,seen){let n;if(p.mode==='seq')n=(p.start+i)%10000000;else{do n=Math.floor(Math.random()*10000000);while(seen&&seen.has(n));seen?.add(n)}return '+98'+p.prefix.slice(1)+String(n).padStart(7,'0')}
function previewGenerator(){const p=genPlan(),seen=new Set(),arr=[];for(let i=0;i<Math.min(500,p.count);i++)arr.push(genAt(p,i,seen));U.generated=p;$('gen-preview').value=arr.join('\n');$('gen-progress').textContent=`${fmt.format(p.count)} شماره آماده ساخت است.`}
async function addGenerator(){const p=genPlan();U.generated=p;const seen=new Set(),B=2000;let added=0,dup=0;for(let off=0;off<p.count;off+=B){const rows=[];for(let i=off;i<Math.min(off+B,p.count);i++){const phone=genAt(p,i,seen);rows.push({phone,name:templateName(p.template,{city:p.city,n:i+1,phone,source:p.source}),city:p.city,section:p.section,source:p.source,createdAt:Date.now()})}const r=await addContactsBatch(rows);added+=r.added;dup+=r.duplicates;$('gen-progress').textContent=`${fmt.format(Math.min(off+B,p.count))}/${fmt.format(p.count)} • جدید ${fmt.format(added)} • تکراری ${fmt.format(dup)}`;await sleep(0)}let stats=await getStats();stats.total=(stats.total||0)+added;stats.cityCounts=stats.cityCounts||{};stats.cityCounts[p.city]=(stats.cityCounts[p.city]||0)+added;await saveStats(stats);await addArtifact({type:'generator',name:p.prefix,city:p.city,section:p.section,count:added});await log('generator','ساخت شماره',{...p,added,duplicates:dup});toast(`${fmt.format(added)} شماره افزوده شد.`);refreshDashboard();fillCitySelects();}
function exportGenerated(kind){const p=U.generated||genPlan(),seen=new Set(),lines=[];if(kind==='csv')lines.push('phone');for(let i=0;i<p.count;i++)lines.push(genAt(p,i,seen));const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:kind==='csv'?'text/csv;charset=utf-8':'text/plain;charset=utf-8'});dl(`generated_${p.prefix}_${p.count}.${kind}`,blob)}

// ---------- Audience ----------
async function setFlag(phone,status,source='manual'){phone=normalizePhone(phone);if(!phone)return toast('شماره معتبر نیست.','bad');await uPut('contact_flags',{phone,status,source,updatedAt:Date.now()});await log('audience',`وضعیت ${phone} → ${status}`);refreshAudience();}
async function flagsMap(){return new Map((await uAll('contact_flags')).map(x=>[x.phone,x]))}
async function refreshAudience(){const list=await uAll('contact_flags'),f=$('aud-filter')?.value||'',rows=list.filter(x=>!f||x.status===f).sort((a,b)=>b.updatedAt-a.updatedAt);$('aud-opt').textContent=fmt.format(list.filter(x=>x.status==='optin').length);$('aud-chat').textContent=fmt.format(list.filter(x=>x.status==='existing_chat').length);$('aud-sup').textContent=fmt.format(list.filter(x=>x.status==='suppressed').length);$('aud-count').textContent=`${fmt.format(rows.length)} رکورد`;$('aud-table').innerHTML=rows.slice(0,1000).map(x=>`<tr><td dir="ltr">${escapeHtml(x.phone)}</td><td><span class="tag">${escapeHtml(x.status)}</span></td><td>${escapeHtml(x.source||'')}</td><td>${new Date(x.updatedAt).toLocaleString('fa-IR')}</td><td><button class="ghost-btn" data-aud-sup="${escapeHtml(x.phone)}">Suppress</button></td></tr>`).join('')||'<tr><td colspan="5">داده‌ای نیست.</td></tr>'}
async function importOptIn(file){const text=await file.text(),seen=new Set();let n=0;for(const line of text.split(/\r?\n/)){for(const part of line.split(/[,;\t]/)){const p=normalizePhone(part);if(p&&!seen.has(p)){seen.add(p);await uPut('contact_flags',{phone:p,status:'optin',source:file.name,updatedAt:Date.now()});n++;break}}}await log('audience','Import Opt-in',{file:file.name,count:n});toast(`${fmt.format(n)} Opt‑in ثبت شد.`);refreshAudience()}
async function exportSuppression(){const rows=(await uAll('contact_flags')).filter(x=>x.status==='suppressed');dl('suppression.csv',new Blob(['\ufeffphone,status,updatedAt\r\n'+rows.map(x=>[x.phone,x.status,new Date(x.updatedAt).toISOString()].map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}))}
async function allowedPhones(mode='allowed'){const flags=await uAll('contact_flags');return flags.filter(x=>mode==='allowed'?(x.status==='optin'||x.status==='existing_chat'):x.status===mode).map(x=>x.phone)}

// ---------- Telegram native / QR ----------
async function nativeFetch(path,opts){try{const r=await fetch(path,{cache:'no-store',...(opts||{})});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}catch(e){return {ok:false,error:e.message,connector:false}}}
async function checkNative(){let c;if(window.ContactFlowAndroid?.nativeCapabilities){try{c=JSON.parse(window.ContactFlowAndroid.nativeCapabilities())}catch{}}else c=await nativeFetch('/native/capabilities');c=c||{};$('tg-native-pill').textContent=c.telegramQr?'QR Ready':'QR Setup';$('tg-native-pill').className='pill '+(c.telegramQr?'active':'queued');$('tg-native-caps').innerHTML=`<li><b>${c.telegramQr?'✓':'○'} QR Login</b><span>${escapeHtml(c.telegramQr?'Connector آماده است':'برای ورود واقعی، API credentials رسمی Telegram را در Build یا تنظیم محلی همین دستگاه قرار دهید.')}</span></li><li><b>${c.filePicker?'✓':'○'} System File Picker</b><span>${c.filePicker?'فعال':'مرورگر/PWA'}</span></li><li><b>${c.platform||navigator.platform}</b><span>${escapeHtml(c.version||'ContactFlow 3.3.0')}</span></li>`;return c}
function renderNativeQr(out){
  const box=$('tg-qr-box');
  box.innerHTML='';
  if(out?.qrDataUrl){
    const img=document.createElement('img');img.src=out.qrDataUrl;img.alt='Telegram QR';img.className='native-qr-image';box.appendChild(img);return true;
  }
  if(out?.qrSvg){box.innerHTML=out.qrSvg;return true;}
  if(out?.url){
    box.innerHTML='<div class="qr-placeholder">Native Connector باید QR واقعی را به‌صورت qrDataUrl یا qrSvg برگرداند.</div>';
    return false;
  }
  return false;
}
async function startQR(){
  const c=await checkNative();
  $('tg-qr-wrap').classList.remove('hidden');
  $('tg-qr-box').innerHTML='<div class="qr-placeholder">در حال درخواست QR رسمی…</div>';
  let out={ok:false,error:'Connector آماده نیست.'};
  try{
    if(window.ContactFlowAndroid?.startTelegramQr) out=JSON.parse(window.ContactFlowAndroid.startTelegramQr());
    else out=await nativeFetch('/native/telegram/qr',{method:'POST'});
  }catch(e){out={ok:false,error:e.message};}
  if(renderNativeQr(out)){
    $('tg-qr-state').textContent='Telegram → Settings → Devices → Link Desktop Device / Scan QR';
  }else{
    $('tg-qr-box').innerHTML='<div class="qr-placeholder">QR Connector not configured in this build</div>';
    $('tg-qr-state').textContent=out?.error||'TDLib/Credential رسمی Telegram App در این Build تنظیم نشده است. QR ساختگی نمایش داده نمی‌شود.';
  }
}
async function prepareCheck(){const mode=$('tg-check-source').value,phones=await allowedPhones(mode);$('tg-check-preview').value=phones.slice(0,5000).join('\n')+(phones.length>5000?'\n…':'');await log('telegram-check','آماده‌سازی Checker مجاز',{mode,count:phones.length});toast(`${fmt.format(phones.length)} شماره مجاز آماده شد.`)}
async function exportAllowed(){const p=await allowedPhones($('tg-check-source').value);dl('telegram_allowed_contacts.csv',new Blob(['\ufeffphone\r\n'+p.join('\r\n')],{type:'text/csv;charset=utf-8'}))}

// ---------- Campaign ----------
function campaignPreview(){const parts=[$('camp-text').value];if($('camp-ref').value)parts.push('📨 پیام مرجع: '+$('camp-ref').value);if($('camp-main').value)parts.push('🔗 '+$('camp-main').value);if($('camp-stop').value)parts.push('🚫 دیگه تبلیغ نبینم\n'+$('camp-stop').value);if($('camp-on').value)parts.push('✅ تبلیغ ببینم\n'+$('camp-on').value);if($('camp-request').value)parts.push('📣 می‌خوام برام تبلیغ کنی\n'+$('camp-request').value);$('camp-preview').textContent=parts.filter(Boolean).join('\n\n')||'هنوز چیزی وارد نشده.';const f=$('camp-media').files?.[0];if(f&&f!==U.media){U.media=f;const u=URL.createObjectURL(f);$('camp-media-preview').innerHTML=f.type.startsWith('image/')?`<img class="media-thumb" src="${u}">`:f.type.startsWith('video/')?`<video class="media-thumb" controls src="${u}"></video>`:`<div class="setting-box"><span>${escapeHtml(f.name)}</span><code>${formatBytes(f.size)}</code></div>`}}
async function saveCampaign(){const f=$('camp-media').files?.[0]||null,c={id:uId(),title:$('camp-title').value.trim()||'بدون عنوان',audience:$('camp-audience').value,text:$('camp-text').value,ref:$('camp-ref').value.trim(),main:$('camp-main').value.trim(),stop:$('camp-stop').value.trim(),on:$('camp-on').value.trim(),request:$('camp-request').value.trim(),media:f?{name:f.name,type:f.type,size:f.size,blob:f}:null,status:'draft',sent:0,failed:0,createdAt:Date.now()};await uPut('campaigns',c);await log('campaign','کمپین ذخیره شد',{id:c.id,title:c.title});toast('کمپین ذخیره شد.');renderCampaigns()}
async function saveTemplate(){const t={id:uId(),title:$('camp-title').value.trim()||'Template',text:$('camp-text').value,main:$('camp-main').value,stop:$('camp-stop').value,on:$('camp-on').value,request:$('camp-request').value,createdAt:Date.now()};await uPut('templates',t);toast('Template ذخیره شد.');renderTemplates()}
async function renderCampaigns(){const cs=(await uAll('campaigns')).sort((a,b)=>b.createdAt-a.createdAt);$('campaign-list').innerHTML=cs.map(c=>`<div class="export-row"><div><strong>${escapeHtml(c.title)}</strong><small>${escapeHtml(c.audience)} • ${escapeHtml(c.status)} • ${new Date(c.createdAt).toLocaleString('fa-IR')}</small></div><div class="button-row"><button class="ghost-btn" data-camp-load="${c.id}">بارگذاری</button><button class="danger-btn" data-camp-del="${c.id}">حذف</button></div></div>`).join('')||'<div class="empty-state compact">کمپینی نیست.</div>'}
async function renderTemplates(){const ts=(await uAll('templates')).sort((a,b)=>b.createdAt-a.createdAt);$('template-list').innerHTML=ts.map(t=>`<div class="export-row"><div><strong>${escapeHtml(t.title)}</strong><small>${new Date(t.createdAt).toLocaleString('fa-IR')}</small></div><button class="ghost-btn" data-tpl-load="${t.id}">استفاده</button></div>`).join('')||'<div class="empty-state compact">Template ندارید.</div>'}
async function loadCampaign(id){const c=await uReq(uStore('campaigns').get(id));if(!c)return;[['camp-title','title'],['camp-text','text'],['camp-ref','ref'],['camp-main','main'],['camp-stop','stop'],['camp-on','on'],['camp-request','request']].forEach(([i,k])=>$(i).value=c[k]||'');$('camp-audience').value=c.audience||'optin';campaignPreview();setPage('campaign')}
async function loadTemplate(id){const t=await uReq(uStore('templates').get(id));if(!t)return;[['camp-title','title'],['camp-text','text'],['camp-main','main'],['camp-stop','stop'],['camp-on','on'],['camp-request','request']].forEach(([i,k])=>$(i).value=t[k]||'');campaignPreview();setPage('campaign')}

// ---------- Requests ----------
async function addRequest(){const tgid=$('req-tgid').value.trim();if(!/^\d{5,20}$/.test(tgid))return toast('Numeric ID معتبر وارد کنید.','bad');const r={id:uId(),telegramId:tgid,username:$('req-user').value.trim().replace(/^@/,''),title:$('req-title').value.trim()||'بدون عنوان',count:Math.max(1,+$('req-count').value||1),done:0,status:'pending',createdAt:Date.now()};await uPut('ad_requests',r);await log('ad-request','درخواست تبلیغ ثبت شد',{telegramId:tgid,count:r.count});renderRequests()}
async function renderRequests(){const rs=(await uAll('ad_requests')).sort((a,b)=>b.createdAt-a.createdAt);$('req-table').innerHTML=rs.map(r=>{const left=Math.max(0,r.count-r.done);return `<tr><td>${r.telegramId}</td><td>@${escapeHtml(r.username||'—')}</td><td>${escapeHtml(r.title)}</td><td>${fmt.format(r.count)}</td><td>${fmt.format(r.done)}</td><td>${fmt.format(left)}</td><td>${escapeHtml(r.status)}</td><td><button data-req-inc="${r.id}" class="ghost-btn">+1</button> <button data-req-run="${r.id}" class="primary-soft">Running</button></td></tr>`}).join('')||'<tr><td colspan="8">درخواستی نیست.</td></tr>';const total=rs.reduce((s,x)=>s+x.count,0),done=rs.reduce((s,x)=>s+x.done,0);$('req-summary').innerHTML=`<div><small>کل درخواست</small><strong>${fmt.format(total)}</strong></div><div><small>انجام‌شده</small><strong>${fmt.format(done)}</strong></div>`}

// ---------- Backup ----------
const backupStores=['contacts','imports','meta','settings','artifacts','contact_flags','campaigns','ad_requests','telegram_accounts','templates','activity'];
function ser(v){if(v instanceof Blob)return {__blob:true,type:v.type,name:v.name||'',data:null};return v}
async function makeBackupObject(note=''){const data={format:'ContactFlowBackup',version:5,appVersion:'3.3.0',createdAt:new Date().toISOString(),note,stores:{}};for(const s of backupStores){try{const rows=await uAll(s);data.stores[s]=rows.map(r=>JSON.parse(JSON.stringify(r,(k,v)=>v instanceof Blob?{__blob:true,type:v.type,size:v.size}:v)))}catch{data.stores[s]=[]}}return data}
async function createBackup(returnBlob=false){const data=await makeBackupObject($('backup-note').value.trim()),blob=new Blob([JSON.stringify(data)],{type:'application/x-contactflow-backup'}),name=`ContactFlow_${new Date().toISOString().replace(/[:.]/g,'-')}.cfbackup`;await log('backup','Backup ساخته شد',{name,size:blob.size});$('backup-state').textContent=`${name} • ${formatBytes(blob.size)}`;renderBackupHistory();if(returnBlob)return {blob,name};dl(name,blob);return {blob,name}}
async function restoreBackup(file){const data=JSON.parse(await file.text());if(data.format!=='ContactFlowBackup')throw new Error('فرمت Backup معتبر نیست');if(!confirm('داده‌های محلی با Backup جایگزین شوند؟'))return;for(const s of backupStores){try{await uClear(s);for(const r of data.stores?.[s]||[])await uPut(s,r)}catch(e){console.warn(s,e)}}toast('Backup بازیابی شد.');await log('backup','Backup بازیابی شد',{file:file.name});location.reload()}
async function renderBackupHistory(){const logs=(await uAll('activity')).filter(x=>x.type==='backup').sort((a,b)=>b.createdAt-a.createdAt).slice(0,30);$('backup-history').innerHTML=logs.map(x=>`<div class="export-row"><div><strong>${escapeHtml(x.message)}</strong><small>${new Date(x.createdAt).toLocaleString('fa-IR')}</small></div></div>`).join('')||'<div class="empty-state compact">هنوز Backup ساخته نشده.</div>'}
async function driveBackup(){const o=await createBackup(true);if(window.ContactFlowAndroid?.saveDocument){const b=await o.blob.arrayBuffer(),u8=new Uint8Array(b);let bin='';for(let i=0;i<u8.length;i+=0x8000)bin+=String.fromCharCode(...u8.subarray(i,i+0x8000));window.ContactFlowAndroid.saveDocument(o.name,o.blob.type,btoa(bin));$('drive-state').textContent='File Picker سیستم باز شد؛ Google Drive را به‌عنوان مقصد انتخاب کنید.';return}const cid=window.CONTACTFLOW_CONFIG?.googleClientId;if(!cid){$('drive-state').textContent='Google OAuth Client ID داخلی این Build تنظیم نشده است. Backup دستی فعال است؛ در Android انتخاب Google Drive از File Picker انجام می‌شود.';return}await googleUpload(o.blob,o.name,cid)}
function loadGIS(){return new Promise((res,rej)=>{if(window.google?.accounts?.oauth2)return res();const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=res;s.onerror=()=>rej(new Error('Google Identity Services بارگذاری نشد'));document.head.appendChild(s)})}
async function googleToken(cid){await loadGIS();return new Promise((res,rej)=>{const c=google.accounts.oauth2.initTokenClient({client_id:cid,scope:'https://www.googleapis.com/auth/drive.file',callback:r=>r.error?rej(new Error(r.error)):res(r.access_token)});c.requestAccessToken({prompt:''})})}
async function googleUpload(blob,name,cid){try{const tok=U.driveToken||await googleToken(cid);U.driveToken=tok;const meta={name,mimeType:blob.type||'application/octet-stream'};const boundary='cf'+Date.now();const head=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${blob.type}\r\n\r\n`;const body=new Blob([head,blob,`\r\n--${boundary}--`]);const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:`Bearer ${tok}`,'Content-Type':`multipart/related; boundary=${boundary}`},body});if(!r.ok)throw new Error(`Drive HTTP ${r.status}`);$('drive-state').textContent='Backup در Google Drive ذخیره شد.';$('drive-pill').textContent='Connected';$('drive-pill').className='pill active';}catch(e){$('drive-state').textContent=e.message}}

// ---------- Activity ----------
async function renderActivity(){const xs=(await uAll('activity')).sort((a,b)=>b.createdAt-a.createdAt).slice(0,500);$('activity-list').innerHTML=xs.map(x=>`<div class="export-row"><div><strong>${escapeHtml(x.message)}</strong><small>${escapeHtml(x.type)} • ${new Date(x.createdAt).toLocaleString('fa-IR')}</small></div></div>`).join('')||'<div class="empty-state compact">Log خالی است.</div>'}
async function exportActivity(){const xs=await uAll('activity');dl('activity.csv',new Blob(['\ufefftype,message,createdAt\r\n'+xs.map(x=>[x.type,x.message,new Date(x.createdAt).toISOString()].map(csv).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}))}

// ---------- Hooks ----------
async function init(){await waitDB();
  // Extend page refresh behavior
  const oldSet=window.setPage;window.setPage=function(p){oldSet(p);setTimeout(()=>{if(p==='audience')refreshAudience();if(p==='telegram')checkNative();if(p==='campaign'){renderCampaigns();renderTemplates()}if(p==='requests')renderRequests();if(p==='backup')renderBackupHistory();if(p==='activity')renderActivity()},0)};
  // bindings
  $('gen-preview-btn').onclick=previewGenerator;$('gen-add-btn').onclick=()=>addGenerator().catch(e=>toast(e.message,'bad'));$('gen-csv-btn').onclick=()=>exportGenerated('csv');$('gen-txt-btn').onclick=()=>exportGenerated('txt');
  $('aud-set').onclick=()=>setFlag($('aud-phone').value,$('aud-status').value);$('aud-refresh').onclick=refreshAudience;$('aud-filter').onchange=refreshAudience;$('aud-import-optin').onclick=()=>$('aud-file').click();$('aud-file').onchange=e=>e.target.files[0]&&importOptIn(e.target.files[0]);$('aud-export-suppressed').onclick=exportSuppression;$('aud-table').onclick=e=>e.target.dataset.audSup&&setFlag(e.target.dataset.audSup,'suppressed','table');
  $('tg-native-check').onclick=checkNative;$('tg-add-account').onclick=startQR;$('tg-qr-cancel').onclick=()=>$('tg-qr-wrap').classList.add('hidden');$('tg-prepare-check').onclick=prepareCheck;$('tg-export-check').onclick=exportAllowed;
  ['camp-title','camp-text','camp-ref','camp-main','camp-stop','camp-on','camp-request'].forEach(id=>$(id).oninput=campaignPreview);$('camp-media').onchange=campaignPreview;$('camp-preview-btn').onclick=campaignPreview;$('camp-save-btn').onclick=saveCampaign;$('camp-template-save').onclick=saveTemplate;$('campaign-list').onclick=e=>{if(e.target.dataset.campLoad)loadCampaign(e.target.dataset.campLoad);if(e.target.dataset.campDel)uDel('campaigns',e.target.dataset.campDel).then(renderCampaigns)};$('template-list').onclick=e=>e.target.dataset.tplLoad&&loadTemplate(e.target.dataset.tplLoad);
  $('req-add').onclick=addRequest;$('req-table').onclick=async e=>{const id=e.target.dataset.reqInc||e.target.dataset.reqRun;if(!id)return;const r=await uReq(uStore('ad_requests').get(id));if(!r)return;if(e.target.dataset.reqInc){r.done=Math.min(r.count,r.done+1);r.status=r.done>=r.count?'completed':'running'}else r.status='running';await uPut('ad_requests',r);renderRequests()};
  $('backup-create').onclick=()=>createBackup();$('backup-restore-file').onchange=e=>e.target.files[0]&&restoreBackup(e.target.files[0]).catch(x=>toast(x.message,'bad'));$('drive-backup').onclick=driveBackup;$('drive-connect').onclick=async()=>{const cid=window.CONTACTFLOW_CONFIG?.googleClientId;if(!cid)return $('drive-state').textContent='Google OAuth Client ID داخلی Build تنظیم نشده.';try{U.driveToken=await googleToken(cid);$('drive-pill').textContent='Connected';$('drive-pill').className='pill active';$('drive-state').textContent='Google Drive متصل شد.'}catch(e){$('drive-state').textContent=e.message}};$('drive-restore').onclick=()=>$('drive-restore-file').click();$('drive-restore-file').onchange=e=>e.target.files[0]&&restoreBackup(e.target.files[0]).catch(x=>toast(x.message,'bad'));
  $('activity-export').onclick=exportActivity;$('activity-clear').onclick=()=>confirm('Log پاک شود؟')&&uClear('activity').then(renderActivity);
  // initial
  previewGenerator();refreshAudience();renderCampaigns();renderTemplates();renderRequests();renderBackupHistory();checkNative();
  // Log startup once per session
  if(!sessionStorage.getItem('cf3_started')){sessionStorage.setItem('cf3_started','1');log('system','ContactFlow Personal Ultimate 3.3 اجرا شد');}
}
init().catch(e=>{console.error(e);toast('Ultimate module: '+e.message,'bad',8000)});
})();
