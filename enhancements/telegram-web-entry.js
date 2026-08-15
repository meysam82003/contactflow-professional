import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/StringSession';
import bigInt from 'big-integer';
import QRCode from 'qrcode';

const DB_NAME = 'contactflow_telegram_web_v1';
const DB_VERSION = 2;
const MAX_ACCOUNTS = 10;
const clients = new Map();
let dbPromise;
let qrCancelToken = null;

function now(){ return Date.now(); }
function id(){ return (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`); }
function asString(v){ return v == null ? '' : String(v); }
function cfg(){ return window.CONTACTFLOW_CONFIG || {}; }
function validCredentials(apiId,apiHash){return Number.isInteger(Number(apiId))&&Number(apiId)>0&&/^[a-f0-9]{32}$/i.test(String(apiHash||''))}
function storedCredentials(){
  try{return {apiId:Number(localStorage.getItem('cf_tg_api_id')||0),apiHash:String(localStorage.getItem('cf_tg_api_hash')||'')}}catch{return {apiId:0,apiHash:''}}
}
function credentialStatus(){
  const local=storedCredentials(),build={apiId:Number(cfg().telegramApiId||0),apiHash:String(cfg().telegramApiHash||'')};
  const source=validCredentials(local.apiId,local.apiHash)?'local':validCredentials(build.apiId,build.apiHash)?'build':'none',active=source==='local'?local:source==='build'?build:{apiId:0,apiHash:''};
  return {configured:source!=='none',source,apiId:active.apiId||0};
}
function configureCredentials(apiId,apiHash,{persist=true}={}){
  apiId=Number(apiId);apiHash=String(apiHash||'').trim();
  if(!validCredentials(apiId,apiHash))throw new Error('API ID یا API Hash معتبر نیست؛ API Hash باید ۳۲ نویسه hexadecimal باشد.');
  if(persist){localStorage.setItem('cf_tg_api_id',String(apiId));localStorage.setItem('cf_tg_api_hash',apiHash)}
  return credentialStatus();
}
function clearCredentials(){try{localStorage.removeItem('cf_tg_api_id');localStorage.removeItem('cf_tg_api_hash')}catch{}return credentialStatus()}
function credentials(){
  const local=storedCredentials();
  const apiId = Number(local.apiId || cfg().telegramApiId || 0);
  const apiHash = String(local.apiHash || cfg().telegramApiHash || '');
  if(!validCredentials(apiId,apiHash)) throw new Error('برای User Session باید API ID و API Hash رسمی Telegram را در همین دستگاه تنظیم کنید.');
  return { apiId, apiHash };
}
function openDB(){
  if(dbPromise) return dbPromise;
  dbPromise = new Promise((resolve,reject)=>{
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if(!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts',{keyPath:'id'});
      if(!db.objectStoreNames.contains('keys')) db.createObjectStore('keys',{keyPath:'id'});
      if(!db.objectStoreNames.contains('checks')) {
        const s=db.createObjectStore('checks',{keyPath:'phone'}); s.createIndex('status','status',{unique:false}); s.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('history')) {
        const s=db.createObjectStore('history',{keyPath:'id'}); s.createIndex('createdAt','createdAt',{unique:false}); s.createIndex('campaignId','campaignId',{unique:false});
      }
      if(!db.objectStoreNames.contains('contacts')) {
        const s=db.createObjectStore('contacts',{keyPath:'key'}); s.createIndex('accountId','accountId',{unique:false}); s.createIndex('updatedAt','updatedAt',{unique:false});
      }
      if(!db.objectStoreNames.contains('meta')) db.createObjectStore('meta',{keyPath:'key'});
    };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
  return dbPromise;
}
async function req(store, mode, op){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,mode), s=tx.objectStore(store), r=op(s);
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
const get=(s,k)=>req(s,'readonly',x=>x.get(k));
const put=(s,v)=>req(s,'readwrite',x=>x.put(v));
const del=(s,k)=>req(s,'readwrite',x=>x.delete(k));
const all=(s)=>req(s,'readonly',x=>x.getAll()).then(x=>x||[]);

async function vaultKey(){
  let row=await get('keys','session-key');
  if(row?.key) return row.key;
  if(!crypto?.subtle) throw new Error('WebCrypto برای نگهداری امن Session در این دستگاه در دسترس نیست.');
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  await put('keys',{id:'session-key',key});
  return key;
}
function b64(u8){ return Buffer.from(u8).toString('base64'); }
function unb64(s){ return new Uint8Array(Buffer.from(s,'base64')); }
async function seal(text){
  const key=await vaultKey(), iv=crypto.getRandomValues(new Uint8Array(12));
  const data=new TextEncoder().encode(text);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data);
  return {iv:b64(iv),ct:b64(new Uint8Array(ct))};
}
async function unseal(box){
  const key=await vaultKey();
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv)},key,unb64(box.ct));
  return new TextDecoder().decode(pt);
}
function publicAccount(a){
  if(!a) return null;
  const {sessionBox,...x}=a;
  return x;
}
async function listAccounts(){ return (await all('accounts')).sort((a,b)=>(b.lastUsedAt||0)-(a.lastUsedAt||0)).map(publicAccount); }
async function activeAccountId(){ return (await get('meta','activeAccount'))?.value || null; }
async function setActiveAccount(accountId){
  if(accountId && !(await get('accounts',accountId))) throw new Error('حساب پیدا نشد.');
  await put('meta',{key:'activeAccount',value:accountId});
  return accountId;
}
async function createClientFromRecord(rec){
  if(clients.has(rec.id)) return clients.get(rec.id);
  const {apiId,apiHash}=credentials();
  const session = new StringSession(await unseal(rec.sessionBox));
  const client = new TelegramClient(session,apiId,apiHash,{connectionRetries:5,useWSS:true});
  await client.connect();
  if(!(await client.checkAuthorization())) throw new Error('Session منقضی یا از Telegram خارج شده است.');
  clients.set(rec.id,client);
  return client;
}
async function getClient(accountId){
  accountId = accountId || await activeAccountId();
  if(!accountId) throw new Error('ابتدا یک حساب Telegram را انتخاب کنید.');
  const rec=await get('accounts',accountId); if(!rec) throw new Error('حساب Telegram پیدا نشد.');
  rec.lastUsedAt=now(); await put('accounts',rec);
  return createClientFromRecord(rec);
}
async function renderQr(url, target){
  if(!target) return;
  target.innerHTML='';
  const canvas=document.createElement('canvas');
  await QRCode.toCanvas(canvas,url,{width:240,margin:2,errorCorrectionLevel:'M'});
  target.appendChild(canvas);
}
async function connectQr({onQr,onState,onPassword}={}){
  const existing=await all('accounts');
  if(existing.length>=MAX_ACCOUNTS) throw new Error(`حداکثر ${MAX_ACCOUNTS} حساب قابل اتصال است.`);
  const {apiId,apiHash}=credentials();
  const session=new StringSession('');
  const client=new TelegramClient(session,apiId,apiHash,{connectionRetries:5,useWSS:true});
  await client.connect();
  const token={cancelled:false}; qrCancelToken=token;
  onState?.('در حال دریافت QR رسمی از Telegram…');
  const user=await client.signInUserWithQrCode({apiId,apiHash},{
    qrCode: async code => {
      if(token.cancelled) throw new Error('QR login cancelled');
      const loginUrl=`tg://login?token=${Buffer.from(code.token).toString('base64url')}`;
      onState?.('QR آماده است؛ Telegram → Settings → Devices → Link Desktop Device');
      await onQr?.(loginUrl,code.expires);
    },
    password: async hint => {
      const fn=onPassword || (async h=>window.prompt(`رمز دومرحله‌ای Telegram${h?` (${h})`:''}:`)||'');
      return fn(hint||'');
    },
    onError: async err => {
      onState?.(`Telegram: ${err?.message||err}`);
      if(token.cancelled) return true;
      return false;
    }
  });
  if(token.cancelled) { try{await client.disconnect()}catch{}; throw new Error('اتصال لغو شد.'); }
  const me=user || await client.getMe();
  const sessionText=client.session.save();
  const rec={
    id:id(), telegramId:asString(me.id), username:me.username||'', firstName:me.firstName||'', lastName:me.lastName||'', phone:me.phone||'',
    sessionBox:await seal(sessionText), createdAt:now(), lastUsedAt:now(), status:'connected'
  };
  await put('accounts',rec); await setActiveAccount(rec.id); clients.set(rec.id,client); qrCancelToken=null;
  return publicAccount(rec);
}
function cancelQr(){ if(qrCancelToken) qrCancelToken.cancelled=true; }
async function disconnectAccount(accountId,{logout=false}={}){
  const c=clients.get(accountId);
  if(c){ try{ if(logout) await c.invoke(new Api.auth.LogOut()); else await c.disconnect(); }catch{} clients.delete(accountId); }
  await del('accounts',accountId);
  await clearContactCache(accountId);
  if(await activeAccountId()===accountId) await setActiveAccount(null);
}
async function accountHealth(accountId){
  try{const c=await getClient(accountId), me=await c.getMe();return {ok:true,id:accountId,telegramId:asString(me.id),username:me.username||''};}
  catch(e){return {ok:false,id:accountId,error:e.message};}
}

async function getCachedContacts(accountId){
  accountId=accountId||await activeAccountId();
  if(!accountId)return [];
  return (await req('contacts','readonly',store=>store.index('accountId').getAll(accountId))||[]).sort((a,b)=>(a.name||'').localeCompare(b.name||'','fa',{sensitivity:'base'}));
}
async function clearContactCache(accountId){
  accountId=accountId||await activeAccountId();
  if(!accountId)return 0;const db=await openDB();let count=0;
  await new Promise((resolve,reject)=>{const tx=db.transaction('contacts','readwrite'),index=tx.objectStore('contacts').index('accountId'),cursor=index.openCursor(IDBKeyRange.only(accountId));cursor.onsuccess=()=>{const item=cursor.result;if(!item)return;item.delete();count++;item.continue()};cursor.onerror=()=>reject(cursor.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  await del('meta',`contacts-sync:${accountId}`);return count;
}
async function replaceContactCache(accountId,rows){
  const db=await openDB();
  await new Promise((resolve,reject)=>{const tx=db.transaction('contacts','readwrite'),store=tx.objectStore('contacts'),cursor=store.index('accountId').openCursor(IDBKeyRange.only(accountId));cursor.onsuccess=()=>{const item=cursor.result;if(item){item.delete();item.continue();return}for(const row of rows)store.put(row)};cursor.onerror=()=>reject(cursor.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
}
async function listTelegramContacts(accountId,{force=false,maxAgeMs=300000,onProgress}={}){
  accountId=accountId||await activeAccountId();
  if(!accountId)throw new Error('ابتدا یک حساب Telegram را انتخاب کنید.');
  const sync=await get('meta',`contacts-sync:${accountId}`),cached=await getCachedContacts(accountId);
  if(!force&&cached.length&&sync?.value?.updatedAt&&now()-sync.value.updatedAt<Math.max(0,Number(maxAgeMs)||0))return {contacts:cached,cached:true,updatedAt:sync.value.updatedAt};
  const client=await getClient(accountId);onProgress?.({state:'loading',done:0,total:0});
  const response=await client.invoke(new Api.contacts.GetContacts({hash:bigInt(0)}));
  if(response instanceof Api.contacts.ContactsNotModified||response?.className==='ContactsNotModified')return {contacts:cached,cached:true,updatedAt:sync?.value?.updatedAt||0};
  const allowed=new Set((response.contacts||[]).map(item=>toKey(item.userId)));
  const users=(response.users||[]).filter(user=>!allowed.size||allowed.has(toKey(user.id)));
  const updatedAt=now(),rows=[];
  for(let i=0;i<users.length;i++){
    const user=users[i],telegramId=toKey(user.id),firstName=user.firstName||'',lastName=user.lastName||'',name=[firstName,lastName].filter(Boolean).join(' ')||user.username||user.phone||telegramId;
    const row={key:`${accountId}:${telegramId}`,accountId,telegramId,userId:telegramId,accessHash:user.accessHash?toKey(user.accessHash):'',name,firstName,lastName,phone:user.phone?`+${String(user.phone).replace(/^\+/, '')}`:'',username:user.username||'',isMutual:!!user.mutualContact,isPremium:!!user.premium,isBot:!!user.bot,isDeleted:!!user.deleted,source:'telegram-contacts',updatedAt};
    rows.push(row);if(i%100===0)onProgress?.({state:'preparing',done:i,total:users.length});
  }
  onProgress?.({state:'saving',done:0,total:rows.length});await replaceContactCache(accountId,rows);
  await put('meta',{key:`contacts-sync:${accountId}`,value:{updatedAt,count:rows.length,savedCount:Number(response.savedCount||0)}});
  onProgress?.({state:'done',done:rows.length,total:rows.length});
  return {contacts:rows,cached:false,updatedAt,savedCount:Number(response.savedCount||0)};
}

function normalizePhoneLocal(v){
  if(typeof window.normalizePhone==='function') return window.normalizePhone(v);
  let s=String(v||'').replace(/[^\d+]/g,''); if(s.startsWith('0098'))s=s.slice(4); else if(s.startsWith('+98'))s=s.slice(3); else if(s.startsWith('98')&&s.length>=12)s=s.slice(2); else if(s.startsWith('0'))s=s.slice(1);
  return /^9\d{9}$/.test(s)?'+98'+s:null;
}
function toKey(v){ try{return bigInt(v).toString();}catch{return String(v)} }
async function checkContacts(accountId,phones,{batchSize=200,onProgress,cleanup=true}={}){
  const client=await getClient(accountId);
  const clean=[...new Set((phones||[]).map(normalizePhoneLocal).filter(Boolean))];
  const results=[]; let done=0;
  for(let off=0;off<clean.length;off+=Math.max(10,Math.min(500,batchSize))){
    const batch=clean.slice(off,off+Math.max(10,Math.min(500,batchSize)));
    const contacts=batch.map((phone,i)=>new Api.InputPhoneContact({clientId:bigInt(off+i+1),phone,firstName:'ContactFlow',lastName:''}));
    let res;
    try{res=await client.invoke(new Api.contacts.ImportContacts({contacts}));}
    catch(e){
      const msg=String(e?.message||e);
      if(/FLOOD_WAIT/i.test(msg)) throw new Error('Telegram درخواست توقف داده است. Checker متوقف شد؛ بعداً دوباره ادامه دهید.');
      throw e;
    }
    const users=new Map((res.users||[]).map(u=>[toKey(u.id),u]));
    const imported=new Map((res.imported||[]).map(x=>[toKey(x.clientId),toKey(x.userId)]));
    const retry=new Set((res.retryContacts||[]).map(toKey));
    for(let i=0;i<batch.length;i++){
      const clientId=toKey(off+i+1), phone=batch[i], userId=imported.get(clientId), u=userId?users.get(userId):null;
      const status=retry.has(clientId)?'retry':userId?'matched':'not_returned';
      const row={phone,status,userId:userId||'',accessHash:u?.accessHash?toKey(u.accessHash):'',username:u?.username||'',firstName:u?.firstName||'',lastName:u?.lastName||'',accountId,updatedAt:now()};
      await put('checks',row); results.push(row);
    }
    if(cleanup){try{await client.invoke(new Api.contacts.DeleteByPhones({phones:batch}));}catch(e){console.warn('Contact cleanup',e)}}
    done+=batch.length; onProgress?.({done,total:clean.length,matched:results.filter(x=>x.status==='matched').length,retry:results.filter(x=>x.status==='retry').length});
    await new Promise(r=>setTimeout(r,450));
  }
  return results;
}
async function listChecks(status=''){const xs=await all('checks');return xs.filter(x=>!status||x.status===status).sort((a,b)=>b.updatedAt-a.updatedAt);}
async function clearChecks(){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction('checks','readwrite');tx.objectStore('checks').clear();tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function loadDialogs(accountId,limit=100){
  const c=await getClient(accountId); const ds=await c.getDialogs({limit:Math.max(1,Math.min(500,limit))});
  return ds.filter(d=>d.isUser || d.entity?.className==='User').map(d=>({id:asString(d.entity?.id||d.id),name:d.name||[d.entity?.firstName,d.entity?.lastName].filter(Boolean).join(' '),username:d.entity?.username||'',unreadCount:d.unreadCount||0}));
}
function inputPeerFromCheck(row){
  if(!row?.userId || !row?.accessHash) throw new Error('Peer access اطلاعات کافی ندارد؛ Checker را دوباره اجرا کنید.');
  return new Api.InputPeerUser({userId:bigInt(row.userId),accessHash:bigInt(row.accessHash)});
}
function refParts(url){const m=String(url||'').match(/^https?:\/\/t\.me\/(?:s\/)?([A-Za-z0-9_]+)\/(\d+)/i);return m?{username:m[1],msgId:Number(m[2])}:null;}
function campaignText(c){
  const lines=[c.text||''];
  if(c.main)lines.push(`🔗 ${c.main}`);
  if(c.stop)lines.push(`🚫 دیگه تبلیغ نبینم\n${c.stop}`);
  if(c.on)lines.push(`✅ تبلیغ ببینم\n${c.on}`);
  if(c.request)lines.push(`📣 می‌خوام برام تبلیغ کنی\n${c.request}`);
  return lines.filter(Boolean).join('\n\n');
}
async function alreadySent(campaignId,phone){return (await all('history')).some(x=>x.campaignId===campaignId&&x.phone===phone&&x.status==='sent');}
async function sendCampaign(accountId,phones,campaign,{delayMs=1800,dailyCap=80,onProgress,stopSignal}={}){
  const client=await getClient(accountId); const checks=new Map((await all('checks')).map(x=>[x.phone,x]));
  const unique=[...new Set((phones||[]).map(normalizePhoneLocal).filter(Boolean))];
  const cap=Math.max(1,Math.min(500,Number(dailyCap)||80)); let sent=0,failed=0,skipped=0;
  const campaignId=campaign.id||id();
  for(const phone of unique){
    if(stopSignal?.stopped) break;
    if(sent>=cap) break;
    if(await alreadySent(campaignId,phone)){skipped++;continue;}
    const row=checks.get(phone); if(!row||row.status!=='matched'){skipped++;continue;}
    try{
      const peer=inputPeerFromCheck(row), ref=refParts(campaign.ref);
      if(ref){const source=await client.getInputEntity(ref.username);await client.forwardMessages(peer,{messages:[ref.msgId],fromPeer:source});}
      else await client.sendMessage(peer,{message:campaignText(campaign),linkPreview:false});
      sent++; await put('history',{id:id(),campaignId,accountId,phone,status:'sent',createdAt:now()});
    }catch(e){
      const msg=String(e?.message||e); failed++; await put('history',{id:id(),campaignId,accountId,phone,status:'failed',error:msg,createdAt:now()});
      const m=msg.match(/FLOOD_WAIT_?(\d+)/i); if(m){onProgress?.({sent,failed,skipped,total:unique.length,state:'flood_wait',waitSeconds:Number(m[1])});break;}
      if(/PEER_FLOOD|USER_RESTRICTED|FROZEN/i.test(msg)){onProgress?.({sent,failed,skipped,total:unique.length,state:'restricted',error:msg});break;}
    }
    onProgress?.({sent,failed,skipped,total:unique.length,state:'running'});
    await new Promise(r=>setTimeout(r,Math.max(1200,Number(delayMs)||1800)));
  }
  return {campaignId,sent,failed,skipped,total:unique.length};
}
async function exportState(){return {accounts:await listAccounts(),checks:await all('checks'),history:await all('history'),contacts:await all('contacts'),activeAccountId:await activeAccountId()};}
async function diagnostics(){
  const a=await listAccounts(), active=await activeAccountId();
  const creds=credentialStatus(),contacts=await all('contacts');
  return {version:'3.3.0',mode:'browser-mtproto-user-session',maxAccounts:MAX_ACCOUNTS,configured:creds.configured,credentialSource:creds.source,secureContext:window.isSecureContext,accounts:a.length,activeAccountId:active,checks:(await all('checks')).length,cachedContacts:contacts.length,userAgent:navigator.userAgent};
}

window.ContactFlowTelegramWeb={MAX_ACCOUNTS,renderQr,connectQr,cancelQr,listAccounts,setActiveAccount,activeAccountId,disconnectAccount,accountHealth,configureCredentials,clearCredentials,credentialStatus,listTelegramContacts,getCachedContacts,clearContactCache,checkContacts,listChecks,clearChecks,loadDialogs,sendCampaign,exportState,diagnostics};
window.dispatchEvent(new CustomEvent('contactflow:telegram-web-ready'));
