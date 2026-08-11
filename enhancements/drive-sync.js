(() => {
'use strict';
const SYNC_NAME='ContactFlow-Ultimate-sync.cfbackup';
const VISIBLE_PREFIX='ContactFlow-Ultimate-Backup';
const S={token:null,expiresAt:0,autoTimer:null,lastMeta:null};
const q=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cfg(){return window.CONTACTFLOW_CONFIG||{}}
function stateText(s){const e=q('drive-state');if(e)e.textContent=s;const m=q('cf-drive-meta');if(m)m.textContent=s}
function pill(ok,text){const e=q('drive-pill');if(e){e.textContent=text|| (ok?'Connected':'Drive');e.className='pill '+(ok?'active':'queued')}}
async function loadGIS(){if(window.google?.accounts?.oauth2)return;await new Promise((res,rej)=>{const old=document.querySelector('script[data-cf-gis]');if(old){old.addEventListener('load',res,{once:true});return}const s=document.createElement('script');s.dataset.cfGis='1';s.src='https://accounts.google.com/gsi/client';s.async=true;s.defer=true;s.onload=res;s.onerror=()=>rej(new Error('Google Identity Services بارگذاری نشد.'));document.head.appendChild(s)})}
function clientId(){const x=String(cfg().googleClientId||'');if(!x)throw new Error('GOOGLE_CLIENT_ID در Build تنظیم نشده است.');return x}
async function connect(interactive=true){
  if(window.ContactFlowAndroid?.saveDocument){pill(true,'System Drive');stateText('Android از System Document Picker استفاده می‌کند؛ Google Drive را از Providerهای سیستم انتخاب کنید.');return {native:true}}
  if(S.token&&Date.now()<S.expiresAt-60000)return {token:S.token};
  await loadGIS();const cid=clientId();
  return new Promise((res,rej)=>{const c=google.accounts.oauth2.initTokenClient({client_id:cid,scope:'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file',include_granted_scopes:true,callback:r=>{if(r.error)return rej(new Error(r.error_description||r.error));S.token=r.access_token;S.expiresAt=Date.now()+(Number(r.expires_in)||3600)*1000;pill(true,'Drive Connected');stateText('Google Drive متصل است.');res({token:S.token})}});c.requestAccessToken({prompt:interactive?'consent':''})})
}
async function token(){if(S.token&&Date.now()<S.expiresAt-60000)return S.token;throw new Error('Google Drive نیاز به اتصال مجدد دارد. روی «اتصال Google» بزنید.');}
async function driveFetch(url,opts={}){const t=await token();const r=await fetch(url,{...opts,headers:{...(opts.headers||{}),Authorization:`Bearer ${t}`}});if(r.status===401){S.token=null;S.expiresAt=0;pill(false,'Reconnect');throw new Error('مجوز Google منقضی شد؛ دوباره «اتصال Google» را بزنید.')}return r}
async function sha256(blob){const b=await blob.arrayBuffer(),d=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function backupBlob(){for(let i=0;i<100;i++){if(window.ContactFlowFullBackup?.create){const d=await window.ContactFlowFullBackup.create();return new Blob([JSON.stringify(d)],{type:'application/x-contactflow-backup'})}await sleep(50)}throw new Error('Backup engine آماده نشد.')}
async function listAppData(){
  const params=new URLSearchParams({spaces:'appDataFolder',q:`name='${SYNC_NAME}' and trashed=false`,fields:'files(id,name,modifiedTime,size,version,appProperties)',orderBy:'modifiedTime desc',pageSize:'10'});
  const r=await driveFetch('https://www.googleapis.com/drive/v3/files?'+params);if(!r.ok)throw new Error(`Drive list HTTP ${r.status}`);const j=await r.json();S.lastMeta=j.files?.[0]||null;return j.files||[]
}
function multipart(meta,blob){const boundary='cf_'+crypto.getRandomValues(new Uint32Array(2)).join('_');return {body:new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${blob.type||'application/octet-stream'}\r\n\r\n`,blob,`\r\n--${boundary}--`]),type:`multipart/related; boundary=${boundary}`}}
async function upload(blob,{appData=false,visible=false,existingId=null}={}){
  const hash=await sha256(blob),meta={name:appData?SYNC_NAME:`${VISIBLE_PREFIX}-${new Date().toISOString().replace(/[:.]/g,'-')}.cfbackup`,mimeType:'application/x-contactflow-backup',appProperties:{cfSha256:hash,cfVersion:'3.1.0-alpha.1'}};if(appData&&!existingId)meta.parents=['appDataFolder'];
  const mp=multipart(meta,blob),url=existingId?`https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart&fields=id,name,modifiedTime,size,version,appProperties`:'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size,version,appProperties';
  const r=await driveFetch(url,{method:existingId?'PATCH':'POST',headers:{'Content-Type':mp.type},body:mp.body});if(!r.ok)throw new Error(`Drive upload HTTP ${r.status}: ${(await r.text()).slice(0,160)}`);const out=await r.json();localStorage.setItem('cf_drive_last_hash',hash);localStorage.setItem('cf_drive_last_modified',out.modifiedTime||'');S.lastMeta=out;return out
}
async function syncNow(){
  if(window.ContactFlowAndroid?.saveDocument){const blob=await backupBlob();const buf=new Uint8Array(await blob.arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode(...buf.subarray(i,i+0x8000));window.ContactFlowAndroid.saveDocument(`${VISIBLE_PREFIX}-${Date.now()}.cfbackup`,blob.type,btoa(bin));stateText('پنجره ذخیره باز شد؛ Google Drive را به‌عنوان مقصد انتخاب کنید.');return}
  await connect(false).catch(()=>{});if(!S.token)throw new Error('ابتدا «اتصال Google» را بزنید.');stateText('در حال مقایسه Backup محلی و Cloud…');
  const blob=await backupBlob(),hash=await sha256(blob),files=await listAppData(),cloud=files[0]||null,lastHash=localStorage.getItem('cf_drive_last_hash')||'';
  if(cloud?.appProperties?.cfSha256===hash){stateText(`Sync کامل است • ${cloud.modifiedTime||''}`);pill(true,'Synced');return cloud}
  if(cloud&&lastHash&&lastHash!==hash&&cloud.appProperties?.cfSha256!==lastHash){stateText('Conflict: هم Backup محلی و هم Cloud تغییر کرده‌اند. برای جلوگیری از overwrite، Restore/Upload را دستی انتخاب کنید.');pill(false,'Conflict');throw new Error('Drive conflict detected')}
  const out=await upload(blob,{appData:true,existingId:cloud?.id||null});stateText(`Sync شد • ${out.modifiedTime||''}`);pill(true,'Synced');return out
}
async function backupVisible(){
  if(window.ContactFlowAndroid?.saveDocument)return syncNow();await connect(false).catch(()=>{});if(!S.token)throw new Error('ابتدا Google را متصل کنید.');const blob=await backupBlob(),out=await upload(blob,{visible:true});stateText(`Backup قابل‌مشاهده در Drive ذخیره شد: ${out.name}`);return out
}
async function restoreLatest(){
  if(window.ContactFlowAndroid?.openBackupDocument){window.ContactFlowAndroid.openBackupDocument();stateText('یک .cfbackup را از Google Drive یا حافظه انتخاب کنید.');return}
  await connect(false).catch(()=>{});if(!S.token)throw new Error('ابتدا Google را متصل کنید.');const files=await listAppData(),f=files[0];if(!f)throw new Error('Backup در appDataFolder پیدا نشد.');const r=await driveFetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`);if(!r.ok)throw new Error(`Drive download HTTP ${r.status}`);const blob=await r.blob();await window.ContactFlowFullBackup.restoreBlob(blob)
}
async function inspectCloud(){await connect(false).catch(()=>{});if(!S.token)throw new Error('ابتدا Google را متصل کنید.');const xs=await listAppData();stateText(xs.length?`Cloud: ${xs[0].modifiedTime} • ${xs[0].size||'?'} bytes • SHA ${(xs[0].appProperties?.cfSha256||'').slice(0,12)}…`:'Cloud Backup پیدا نشد.');return xs}
function auto(on){localStorage.setItem('cf_drive_auto',on?'1':'0');clearInterval(S.autoTimer);S.autoTimer=null;if(on)S.autoTimer=setInterval(()=>{if(S.token)syncNow().catch(e=>stateText('Auto Sync: '+e.message))},15*60*1000)}
function diagnostics(){return {configured:!!cfg().googleClientId,connected:!!S.token,expiresAt:S.expiresAt||0,auto:localStorage.getItem('cf_drive_auto')==='1',mode:window.ContactFlowAndroid?'android-system-picker':'gis-drive-rest',lastCloud:S.lastMeta}}
function bind(){
  const c=q('drive-connect');if(c)c.onclick=()=>connect(true).catch(e=>stateText(e.message));const b=q('drive-backup');if(b)b.onclick=()=>backupVisible().catch(e=>stateText(e.message));const r=q('drive-restore');if(r)r.onclick=()=>restoreLatest().catch(e=>stateText(e.message));
  const s=q('cf-drive-auto');if(s)s.onclick=()=>syncNow().catch(e=>stateText(e.message));const cr=q('cf-drive-cloud-restore');if(cr)cr.onclick=()=>restoreLatest().catch(e=>stateText(e.message));const l=q('cf-drive-list');if(l)l.onclick=()=>inspectCloud().catch(e=>stateText(e.message));const t=q('cf-drive-auto-toggle');if(t){t.checked=localStorage.getItem('cf_drive_auto')==='1';t.onchange=()=>auto(t.checked);if(t.checked)auto(true)}
}
window.ContactFlowDrive={connect,syncNow,backupVisible,restoreLatest,inspectCloud,diagnostics};
window.ContactFlowDriveNative={onRestoreFile:async(name,mime,base64)=>{try{const bin=atob(base64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);await window.ContactFlowFullBackup.restoreBlob(new Blob([u8],{type:mime||'application/x-contactflow-backup'}));}catch(e){stateText(e.message)}}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,300));else setTimeout(bind,300);
})();
