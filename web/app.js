'use strict';

const APP_VERSION = '3.3.0';
const DB_NAME = 'contactflow_pwa_v2';
const DB_VERSION = 3;
const PAGE_SIZE = 50;
const $ = (id) => document.getElementById(id);
const fmt = new Intl.NumberFormat('fa-IR');
const state = { db:null, file:null, page:1, exports:[], importQueue:[], exportQueue:[], deferredInstall:null, busy:false };

// ---------- UI ----------
const pageMeta = {
  dashboard:['داشبورد','مدیریت مخاطبین روی همین دستگاه'],
  import:['ورود فایل','پردازش Excel / CSV بدون Python'],
  contacts:['مخاطبین','جستجو و مرور دیتابیس محلی'],
  rename:['نام‌ساز','نام‌گذاری سریالی و گروهی'],
  exports:['خروجی','ساخت VCF و CSV قطعه‌ای'],
  generator:['شماره‌ساز','تولید و مدیریت رنج شماره'],
  telegram:['تلگرام','اتصال حساب با QR و مدیریت چت‌های مجاز'],
  campaign:['کمپین','Composer، پیام مرجع و صف مجاز'],
  audience:['Audience','رضایت، Suppression و سگمنت‌ها'],
  requests:['درخواست تبلیغ','پیگیری درخواست و پیشرفت'],
  backup:['Backup','Backup دستی و Google Drive'],
  activity:['گزارش فعالیت','Audit Log محلی'],
  guide:['راهنمای نصب','آموزش نصب PWA روی گوشی و کامپیوتر'],
  settings:['تنظیمات','داده محلی و قابلیت دستگاه']
};
function toast(msg, type='good', timeout=3800){
  const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; $('toast-root').appendChild(el);
  setTimeout(()=>el.remove(), timeout);
}
function setPage(page){
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  document.querySelectorAll('[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  $('page-title').textContent=pageMeta[page]?.[0]||''; $('page-subtitle').textContent=pageMeta[page]?.[1]||'';
  $('sidebar').classList.remove('open');
  if(page==='dashboard') refreshDashboard();
  if(page==='contacts'){state.page=1; refreshContacts();}
  if(page==='import') refreshImports();
  if(page==='rename') updateRenamePreview();
  if(page==='settings') refreshCapabilities();
}
function setBusy(b){state.busy=b; ['start-import','start-rename','start-export'].forEach(id=>{const e=$(id);if(e)e.disabled=b;});}
function progress(pct,label,stats=''){
  $('upload-progress-wrap').classList.remove('hidden'); $('upload-pct').textContent=`${Math.max(0,Math.min(100,Math.round(pct)))}%`;
  $('upload-bar').style.width=`${Math.max(0,Math.min(100,pct))}%`; $('upload-label').textContent=label; $('live-stats').textContent=stats;
}
function formatBytes(bytes){
  if(bytes==null) return '—'; const units=['B','KB','MB','GB','TB']; let i=0,n=bytes; while(n>=1024&&i<units.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${units[i]}`;
}
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":"&#39;"}[m]));}

// ---------- IndexedDB ----------
function openDB(){return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
    const db=req.result;
    let contacts;
    if(!db.objectStoreNames.contains('contacts')) contacts=db.createObjectStore('contacts',{keyPath:'phone'});
    else contacts=req.transaction.objectStore('contacts');
    for(const [name,key] of [['city','city'],['section','section'],['name','name'],['createdAt','createdAt']]){if(!contacts.indexNames.contains(name))contacts.createIndex(name,key,{unique:false});}
    if(!db.objectStoreNames.contains('imports')){const imports=db.createObjectStore('imports',{keyPath:'id',autoIncrement:true});imports.createIndex('createdAt','createdAt',{unique:false});}
    if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
    if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
    if(!db.objectStoreNames.contains('artifacts')){const artifacts=db.createObjectStore('artifacts',{keyPath:'id',autoIncrement:true});artifacts.createIndex('createdAt','createdAt',{unique:false});artifacts.createIndex('type','type',{unique:false});}
    if(!db.objectStoreNames.contains('contact_flags'))db.createObjectStore('contact_flags',{keyPath:'phone'});
    if(!db.objectStoreNames.contains('campaigns'))db.createObjectStore('campaigns',{keyPath:'id'});
    if(!db.objectStoreNames.contains('ad_requests'))db.createObjectStore('ad_requests',{keyPath:'id'});
    if(!db.objectStoreNames.contains('telegram_accounts'))db.createObjectStore('telegram_accounts',{keyPath:'id'});
    if(!db.objectStoreNames.contains('templates'))db.createObjectStore('templates',{keyPath:'id'});
    if(!db.objectStoreNames.contains('activity')){const a=db.createObjectStore('activity',{keyPath:'id'});a.createIndex('createdAt','createdAt',{unique:false});}
  };
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
});}
function reqP(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function txDone(tx){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Transaction aborted'));});}
async function getStats(){
  const tx=state.db.transaction('meta','readonly'); const row=await reqP(tx.objectStore('meta').get('stats'));
  return row?.value || {total:0,cityCounts:{},sequences:{}};
}
async function saveStats(stats){const tx=state.db.transaction('meta','readwrite'); tx.objectStore('meta').put({key:'stats',value:stats}); await txDone(tx);}
async function addContactsBatch(records){
  if(!records.length) return {added:0,duplicates:0};
  return new Promise((resolve,reject)=>{
    const tx=state.db.transaction('contacts','readwrite'); const store=tx.objectStore('contacts'); let added=0,duplicates=0, fatal=null;
    for(const rec of records){
      const r=store.add(rec);
      r.onsuccess=()=>{added++;};
      r.onerror=(ev)=>{
        if(r.error?.name==='ConstraintError'){duplicates++; ev.preventDefault(); ev.stopPropagation();}
        else {fatal=r.error;}
      };
    }
    tx.oncomplete=()=> fatal?reject(fatal):resolve({added,duplicates});
    tx.onerror=()=>reject(tx.error||fatal); tx.onabort=()=>reject(tx.error||fatal||new Error('Import transaction aborted'));
  });
}
async function addImportHistory(row){const tx=state.db.transaction('imports','readwrite'); tx.objectStore('imports').add(row); await txDone(tx);}
async function listImports(limit=20){
  const tx=state.db.transaction('imports','readonly'); const idx=tx.objectStore('imports').index('createdAt'); const out=[];
  return new Promise((resolve,reject)=>{const r=idx.openCursor(null,'prev');r.onsuccess=()=>{const c=r.result;if(!c||out.length>=limit)return resolve(out);out.push(c.value);c.continue();};r.onerror=()=>reject(r.error);});
}
async function addArtifact(row){const tx=state.db.transaction('artifacts','readwrite');tx.objectStore('artifacts').add({...row,createdAt:row.createdAt||Date.now()});await txDone(tx);}
async function listArtifacts(limit=100){const tx=state.db.transaction('artifacts','readonly'),idx=tx.objectStore('artifacts').index('createdAt'),out=[];return new Promise((resolve,reject)=>{const r=idx.openCursor(null,'prev');r.onsuccess=()=>{const c=r.result;if(!c||out.length>=limit)return resolve(out);out.push(c.value);c.continue();};r.onerror=()=>reject(r.error);});}

// ---------- Phone & naming ----------
const digitMap={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
function latinDigits(v){return String(v??'').replace(/[۰-۹٠-٩]/g,c=>digitMap[c]||c);}
function normalizePhone(raw){
  let s=latinDigits(raw).trim(); if(!s) return null;
  s=s.replace(/[^\d+]/g,''); if(s.startsWith('00')) s='+'+s.slice(2);
  if(s.startsWith('+98')) s=s.slice(3); else if(s.startsWith('98')&&s.length>=12) s=s.slice(2); else if(s.startsWith('0')) s=s.slice(1);
  if(/^9\d{9}$/.test(s)) return '+98'+s;
  // Generic international number only when user supplied + / 00 originally.
  const orig=latinDigits(raw).trim();
  let intl=orig.replace(/[^\d+]/g,''); if(intl.startsWith('00')) intl='+'+intl.slice(2);
  if(/^\+[1-9]\d{7,14}$/.test(intl)) return intl;
  return null;
}
function templateName(template,{city,n,phone,source}){
  let out=String(template||'{city} {n}');
  out=out.replace(/\{n:(0+)\}/g,(_,z)=>String(n).padStart(z.length,'0'));
  out=out.replace(/\{n\}/g,String(n)).replace(/\{city\}/g,city||'').replace(/\{phone\}/g,phone||'').replace(/\{source\}/g,source||'');
  return out.replace(/\s+/g,' ').trim();
}
function safeName(s){return String(s||'contacts').replace(/[\\/:*?"<>|]+/g,'_').trim()||'contacts';}

// ---------- Streaming delimited parser ----------
async function detectDelimiter(file){
  const txt=await file.slice(0,65536).text(); const line=txt.split(/\r?\n/).find(x=>x.trim())||''; const candidates=[',','\t',';','|'];
  let best=',',score=-1; for(const d of candidates){let n=0,q=false;for(let i=0;i<line.length;i++){if(line[i]==='"')q=!q;else if(!q&&line[i]===d)n++;}if(n>score){score=n;best=d;}}
  return best;
}
async function* parseDelimited(file,delimiter,onProgress){
  const reader=file.stream().getReader(); const decoder=new TextDecoder('utf-8'); let field='',row=[],inQuotes=false,quotePending=false,read=0;
  const emitOutside=async function* (ch){
    if(ch===delimiter){row.push(field);field='';}
    else if(ch==='\n'){row.push(field.endsWith('\r')?field.slice(0,-1):field);field='';const out=row;row=[];yield out;}
    else if(ch==='"'&&field===''){inQuotes=true;}
    else field+=ch;
  };
  while(true){const {value,done}=await reader.read();if(done)break;read+=value.byteLength;const text=decoder.decode(value,{stream:true});
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(quotePending){
        if(ch==='"'){field+='"';quotePending=false;continue;}
        inQuotes=false;quotePending=false; for await(const r of emitOutside(ch)) yield r; continue;
      }
      if(inQuotes){if(ch==='"')quotePending=true;else field+=ch;}
      else {for await(const r of emitOutside(ch)) yield r;}
    }
    onProgress?.(read/file.size*100,read);
  }
  const rest=decoder.decode(); if(rest) field+=rest; if(quotePending) inQuotes=false;
  if(field.length||row.length){row.push(field.endsWith('\r')?field.slice(0,-1):field);yield row;}
}
function cleanHeaders(row){return row.map((x,i)=>(String(x??'').trim()||`col${i+1}`));}
function looksLikeHeader(row){
  const keys=['phone','mobile','tel','telephone','number','شماره','موبایل','تلفن','همراه'];
  if(row.some(x=>keys.some(k=>latinDigits(x).toLowerCase().includes(k)))) return true;
  const phoneish=row.filter(x=>normalizePhone(x)).length; return phoneish===0;
}
function resolvePhoneIndex(headers,explicit,sample){
  const ex=String(explicit||'').trim();
  if(ex){if(/^\d+$/.test(latinDigits(ex))){const i=Number(latinDigits(ex))-1;if(i>=0&&i<headers.length)return i;}const i=headers.findIndex(h=>h.trim().toLowerCase()===ex.toLowerCase());if(i>=0)return i;}
  const keys=['phone','mobile','tel','telephone','number','شماره','موبایل','تلفن','همراه','شماره موبایل','شماره تماس'];
  let i=headers.findIndex(h=>keys.some(k=>latinDigits(h).trim().toLowerCase().includes(k))); if(i>=0)return i;
  if(sample){for(let j=0;j<sample.length;j++)if(normalizePhone(sample[j]))return j;}
  return 0;
}

// ---------- Minimal XLSX reader (ZIP + XML, no external library) ----------
function u16(dv,o){return dv.getUint16(o,true)} function u32(dv,o){return dv.getUint32(o,true)}
async function openZip(file){
  if(!('DecompressionStream' in window)) throw new Error('مرورگر شما DecompressionStream ندارد؛ فایل را به CSV تبدیل کنید.');
  const buf=await file.arrayBuffer(); const dv=new DataView(buf); const bytes=new Uint8Array(buf); let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-70000);i--){if(u32(dv,i)===0x06054b50){eocd=i;break;}}
  if(eocd<0) throw new Error('ساختار ZIP/XLSX معتبر نیست.');
  const count=u16(dv,eocd+10), cdOffset=u32(dv,eocd+16); const entries=[]; let p=cdOffset;
  for(let n=0;n<count;n++){
    if(u32(dv,p)!==0x02014b50)break; const method=u16(dv,p+10),comp=u32(dv,p+20),uncomp=u32(dv,p+24),fnl=u16(dv,p+28),exl=u16(dv,p+30),col=u16(dv,p+32),local=u32(dv,p+42);
    const name=new TextDecoder().decode(bytes.slice(p+46,p+46+fnl)); entries.push({name,method,comp,uncomp,local}); p+=46+fnl+exl+col;
  }
  function streamEntry(entry){
    const lo=entry.local;if(u32(dv,lo)!==0x04034b50)throw new Error('Local ZIP header invalid'); const fnl=u16(dv,lo+26),exl=u16(dv,lo+28),start=lo+30+fnl+exl;
    const blob=new Blob([bytes.slice(start,start+entry.comp)]); if(entry.method===0)return blob.stream(); if(entry.method===8)return blob.stream().pipeThrough(new DecompressionStream('deflate-raw')); throw new Error(`ZIP compression ${entry.method} پشتیبانی نمی‌شود.`);
  }
  return {entries,streamEntry};
}
function xmlDecode(s){return String(s??'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));}
async function readStreamText(stream){const reader=stream.getReader(),dec=new TextDecoder();let out='';while(true){const {value,done}=await reader.read();if(done)break;out+=dec.decode(value,{stream:true});}out+=dec.decode();return out;}
async function parseSharedStrings(zip){
  const e=zip.entries.find(x=>x.name==='xl/sharedStrings.xml'); if(!e)return [];
  const reader=zip.streamEntry(e).getReader(),dec=new TextDecoder();let buf='',out=[];
  while(true){const {value,done}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});let end;
    while((end=buf.indexOf('</si>'))>=0){const start=buf.indexOf('<si');if(start<0){buf=buf.slice(end+5);continue;}const block=buf.slice(start,end+5);const ts=[...block.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m=>xmlDecode(m[1])).join('');out.push(ts);buf=buf.slice(end+5);}
  }
  return out;
}
function colIndex(ref){const m=String(ref).match(/^([A-Z]+)/i);if(!m)return 0;let n=0;for(const c of m[1].toUpperCase())n=n*26+(c.charCodeAt(0)-64);return n-1;}
function parseXlsxRow(block,shared){
  const row=[]; const re=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let m;
  while((m=re.exec(block))){const attrs=m[1]||'',body=m[2]||'';const rr=attrs.match(/\br="([A-Z]+\d+)"/i);const idx=rr?colIndex(rr[1]):row.length;const tm=attrs.match(/\bt="([^"]+)"/);const t=tm?.[1]||'';let v='';
    if(t==='inlineStr'){v=[...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x=>xmlDecode(x[1])).join('');}
    else {const vm=body.match(/<v>([\s\S]*?)<\/v>/);v=vm?xmlDecode(vm[1]):''; if(t==='s'&&v!=='')v=shared[Number(v)]??''; if(t==='b')v=v==='1'?'TRUE':'FALSE';}
    row[idx]=v;
  }
  for(let i=0;i<row.length;i++)if(row[i]==null)row[i]=''; return row;
}
async function* parseXlsx(file,onProgress){
  onProgress?.(3,0); const zip=await openZip(file); onProgress?.(10,0); const shared=await parseSharedStrings(zip); onProgress?.(28,0);
  const sheets=zip.entries.filter(x=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(x.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})); if(!sheets.length)throw new Error('Worksheet پیدا نشد.');
  const reader=zip.streamEntry(sheets[0]).getReader(),dec=new TextDecoder();let buf='',rows=0;
  while(true){const {value,done}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});let end;
    while((end=buf.indexOf('</row>'))>=0){const start=buf.lastIndexOf('<row',end); if(start<0){buf=buf.slice(end+6);continue;} const block=buf.slice(start,end+6);buf=buf.slice(end+6);rows++; if(rows%5000===0)onProgress?.(Math.min(92,28+Math.log10(rows+10)*12),rows); yield parseXlsxRow(block,shared);}
  }
  onProgress?.(94,rows);
}

// ---------- Import queue ----------
function currentImportConfig(file){return {id:(crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`),file,city:$('import-city').value.trim()||'بدون عنوان',section:$('import-section')?.value.trim()||'',source:$('import-source').value.trim(),template:$('import-template').value.trim()||'{city} {n}',start:Math.max(1,Number($('import-start').value)||1),phoneColumn:$('import-phone-column').value.trim(),cont:$('import-continue').checked,status:'queued',result:null,error:''};}
function enqueueImportFiles(files){for(const file of [...(files||[])])state.importQueue.push(currentImportConfig(file));renderImportQueue();}
function renderImportQueue(){const el=$('import-queue');if(!el)return;if(!state.importQueue.length){el.innerHTML='<div class="empty-state compact">فایلی در صف نیست.</div>';return;}el.innerHTML=state.importQueue.map(j=>`<div class="queue-card" data-id="${escapeHtml(j.id)}"><div class="queue-head"><div><strong>${escapeHtml(j.file.name)}</strong><small>${formatBytes(j.file.size)}</small></div><span class="pill ${j.status==='done'?'active':j.status==='error'?'danger':'queued'}">${escapeHtml(j.status)}</span><button class="danger-btn queue-remove" ${j.status==='running'?'disabled':''}>حذف</button></div><div class="form-grid queue-grid"><label><span>شهر</span><input data-field="city" value="${escapeHtml(j.city)}"></label><label><span>بخش</span><input data-field="section" value="${escapeHtml(j.section)}"></label><label><span>منبع</span><input data-field="source" value="${escapeHtml(j.source)}"></label><label><span>شروع</span><input data-field="start" type="number" min="1" value="${j.start}"></label><label class="full"><span>قالب نام</span><input data-field="template" dir="ltr" value="${escapeHtml(j.template)}"></label><label><span>ستون شماره</span><input data-field="phoneColumn" value="${escapeHtml(j.phoneColumn)}" placeholder="خودکار"></label><label class="switch-row compact-switch"><input data-field="cont" type="checkbox" ${j.cont?'checked':''}><span class="switch"></span><div><strong>ادامه Sequence</strong></div></label></div>${j.result?`<small class="queue-result">جدید ${fmt.format(j.result.added)} • تکراری ${fmt.format(j.result.duplicates)} • نامعتبر ${fmt.format(j.result.invalid)}</small>`:''}${j.error?`<small class="queue-error">${escapeHtml(j.error)}</small>`:''}</div>`).join('');
  el.querySelectorAll('.queue-card').forEach(card=>{const job=state.importQueue.find(x=>x.id===card.dataset.id);card.querySelectorAll('[data-field]').forEach(inp=>{const apply=()=>{const f=inp.dataset.field;if(f==='cont')job[f]=inp.checked;else if(f==='start')job[f]=Math.max(1,Number(inp.value)||1);else job[f]=inp.value;};inp.addEventListener('input',apply);inp.addEventListener('change',apply);});card.querySelector('.queue-remove')?.addEventListener('click',()=>{state.importQueue=state.importQueue.filter(x=>x.id!==job.id);renderImportQueue();});});
}
async function processImportJob(job,position,totalJobs){const file=job.file,city=String(job.city||'').trim()||'بدون عنوان',section=String(job.section||'').trim(),source=String(job.source||'').trim(),template=String(job.template||'').trim()||'{city} {n}',explicit=String(job.phoneColumn||'').trim(),start=Math.max(1,Number(job.start)||1),cont=!!job.cont;let stats=await getStats(),n=cont?Math.max(start,(stats.sequences[city]||0)+1):start,rows=0,invalid=0,duplicates=0,added=0,batch=[],headers=null,phoneIndex=0;const started=Date.now(),prefix=`${position}/${totalJobs} • ${file.name}`;
  let gen;if(file.name.toLowerCase().endsWith('.xlsx')){if(file.size>220*1024*1024)toast('Excel بسیار بزرگ است؛ CSV کم‌حافظه‌تر است.','bad',5000);gen=parseXlsx(file,(pct,r)=>progress(pct,`${prefix} • خواندن Excel…`,`rows: ${fmt.format(r||rows)} | new: ${fmt.format(added)} | dup: ${fmt.format(duplicates)} | invalid: ${fmt.format(invalid)}`));}else{const delimiter=await detectDelimiter(file);gen=parseDelimited(file,delimiter,pct=>progress(Math.min(90,pct*.9),`${prefix} • خواندن فایل…`,`rows: ${fmt.format(rows)} | new: ${fmt.format(added)} | dup: ${fmt.format(duplicates)} | invalid: ${fmt.format(invalid)}`));}
  const it=gen[Symbol.asyncIterator](),first=await it.next();if(first.done)throw new Error('فایل خالی است.');const second=await it.next(),firstIsHeader=looksLikeHeader(first.value);headers=firstIsHeader?cleanHeaders(first.value):first.value.map((_,i)=>`col${i+1}`);phoneIndex=resolvePhoneIndex(headers,explicit,firstIsHeader?(second.done?[]:second.value):first.value);
  async function consume(row){rows++;const phone=normalizePhone(row[phoneIndex]);if(!phone){invalid++;return;}const current=n++;batch.push({phone,name:templateName(template,{city,n:current,phone,source}),city,section,source,createdAt:Date.now()});if(batch.length>=2000){const result=await addContactsBatch(batch);added+=result.added;duplicates+=result.duplicates;batch=[];progress(Math.min(94,5+Math.log10(rows+10)*16),`${prefix} • ذخیره…`,`rows: ${fmt.format(rows)} | new: ${fmt.format(added)} | dup: ${fmt.format(duplicates)} | invalid: ${fmt.format(invalid)}`);await new Promise(r=>setTimeout(r,0));}}
  if(!firstIsHeader)await consume(first.value);if(!second.done)await consume(second.value);while(true){const x=await it.next();if(x.done)break;await consume(x.value);}if(batch.length){const result=await addContactsBatch(batch);added+=result.added;duplicates+=result.duplicates;}
  stats.total+=added;stats.cityCounts[city]=(stats.cityCounts[city]||0)+added;stats.sequences[city]=Math.max(stats.sequences[city]||0,n-1);await saveStats(stats);const result={filename:file.name,city,section,source,rows,added,duplicates,invalid,createdAt:Date.now(),durationMs:Date.now()-started};await addImportHistory(result);await addArtifact({type:'import',name:file.name,city,section,source,count:added,size:file.size});touchRevision();if(window.ContactFlowProArchiveFile)window.ContactFlowProArchiveFile(file,'import',file.name);return result;
}
async function startImport(){if(state.busy)return;if(!state.importQueue.length){const files=$('import-file').files;if(files?.length)enqueueImportFiles(files);else if(state.file)enqueueImportFiles([state.file]);}if(!state.importQueue.length){toast('ابتدا یک یا چند فایل را به صف اضافه کنید.','bad');return;}setBusy(true);const jobs=state.importQueue.filter(j=>j.status!=='done');let ok=0,fail=0;try{for(let i=0;i<jobs.length;i++){const j=jobs[i];j.status='running';j.error='';renderImportQueue();try{j.result=await processImportJob(j,i+1,jobs.length);j.status='done';ok++;}catch(e){console.error(e);j.status='error';j.error=e.message||String(e);fail++;toast(`${j.file.name}: ${j.error}`,'bad',7000);}renderImportQueue();}progress(100,'صف Import تمام شد',`${ok} موفق • ${fail} خطا`);await refreshDashboard();await refreshImports();await fillCitySelects();toast(`صف Import تمام شد: ${fmt.format(ok)} فایل موفق${fail?` • ${fmt.format(fail)} خطا`:''}.`);}finally{setBusy(false);}}

// ---------- Dashboard/import history ----------
async function refreshDashboard(){
  const stats=await getStats(); $('metric-total').textContent=fmt.format(stats.total); $('metric-cities').textContent=fmt.format(Object.keys(stats.cityCounts).length);
  const imports=await listImports(1); const tx=state.db.transaction('imports','readonly'); $('metric-imports').textContent=fmt.format(await reqP(tx.objectStore('imports').count()));
  try{const est=await navigator.storage?.estimate?.();$('metric-storage').textContent=est?.usage!=null?formatBytes(est.usage):'—';}catch{$('metric-storage').textContent='—';}
  const cities=Object.entries(stats.cityCounts).sort((a,b)=>b[1]-a[1]).slice(0,8); const max=cities[0]?.[1]||1;
  $('segment-list').innerHTML=cities.length?cities.map(([c,n])=>`<div class="segment-row"><span class="name">${escapeHtml(c)}</span><div class="segment-bar"><i style="width:${Math.max(3,n/max*100)}%"></i></div><b>${fmt.format(n)}</b></div>`).join(''):'<div class="empty-state compact">هنوز داده‌ای ندارید.</div>';
  const last=imports[0]; $('last-import').innerHTML=last?`<div class="import-file-name">${escapeHtml(last.filename)}</div><div class="import-summary"><div class="summary-stat good"><span>جدید</span><strong>${fmt.format(last.added)}</strong></div><div class="summary-stat warn"><span>تکراری</span><strong>${fmt.format(last.duplicates)}</strong></div><div class="summary-stat bad"><span>نامعتبر</span><strong>${fmt.format(last.invalid)}</strong></div></div>`:'هنوز فایلی وارد نشده است.';
}
async function refreshImports(){
  const rows=await listImports(30); $('imports-table').innerHTML=rows.length?rows.map(r=>`<tr><td>${escapeHtml(r.filename)}</td><td>${escapeHtml(r.city)}</td><td>${fmt.format(r.added)}</td><td>${fmt.format(r.duplicates)}</td><td>${fmt.format(r.invalid)}</td><td>${new Date(r.createdAt).toLocaleString('fa-IR')}</td></tr>`).join(''):'<tr><td colspan="6">هنوز Import ثبت نشده است.</td></tr>';
}
async function fillCitySelects(){
  const stats=await getStats(); const cities=Object.keys(stats.cityCounts).sort((a,b)=>a.localeCompare(b,'fa')); for(const id of ['contact-city','rename-city','export-city','edit-city-from']){const el=$(id);if(!el)continue;const cur=el.value;el.innerHTML='<option value="">همه شهرها</option>'+cities.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');el.value=cities.includes(cur)?cur:'';}
  const sections=new Set();const tx=state.db.transaction('contacts','readonly'),st=tx.objectStore('contacts');await new Promise((resolve,reject)=>{const r=st.openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return resolve();if(c.value.section)sections.add(c.value.section);c.continue();};r.onerror=()=>reject(r.error);});
  const vals=[...sections].sort((a,b)=>a.localeCompare(b,'fa'));for(const id of ['contact-section','export-section','edit-section-from']){const el=$(id);if(!el)continue;const cur=el.value;el.innerHTML='<option value="">همه بخش‌ها</option>'+vals.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');el.value=vals.includes(cur)?cur:'';}
}

// ---------- Contacts ----------
async function getContactPage(city,section,search,page,size){
  const offset=(page-1)*size, out=[]; let seen=0; const tx=state.db.transaction('contacts','readonly'),store=tx.objectStore('contacts'); let source=store,range=null;
  const q=latinDigits(search||'').trim();
  if(q){if(q.startsWith('+')||/^\d/.test(q)){source=store;const normalized=q.startsWith('+')?q:(q.startsWith('0')?'+98'+q.slice(1):q);range=IDBKeyRange.bound(normalized,normalized+'\uffff');}
    else {source=store.index('name');range=IDBKeyRange.bound(q,q+'\uffff');}}
  else if(city){source=store.index('city');range=IDBKeyRange.only(city);} else if(section){source=store.index('section');range=IDBKeyRange.only(section);}
  return new Promise((resolve,reject)=>{const r=source.openCursor(range);r.onsuccess=()=>{const c=r.result;if(!c)return resolve(out);const v=c.value;if((!city||v.city===city)&&(!section||v.section===section)){if(seen>=offset&&out.length<size)out.push(v);seen++;if(out.length>=size)return resolve(out);}c.continue();};r.onerror=()=>reject(r.error);});
}
async function refreshContacts(){
  const city=$('contact-city').value,section=$('contact-section')?.value||'',search=$('contact-search').value;const rows=await getContactPage(city,section,search,state.page,PAGE_SIZE);const stats=await getStats();const total=search?'نتایج جستجو':city?`${fmt.format(stats.cityCounts[city]||0)} مخاطب`:`${fmt.format(stats.total)} مخاطب`;
  $('contacts-count').textContent=total; $('contacts-table').innerHTML=rows.length?rows.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td dir="ltr">${escapeHtml(r.phone)}</td><td>${escapeHtml(r.city)}</td><td>${escapeHtml(r.section||'—')}</td><td>${escapeHtml(r.source||'—')}</td></tr>`).join(''):'<tr><td colspan="5">موردی پیدا نشد.</td></tr>';
  $('page-indicator').textContent=`صفحه ${fmt.format(state.page)}`;$('prev-page').disabled=state.page<=1;$('next-page').disabled=rows.length<PAGE_SIZE;
}

// ---------- Rename ----------
function updateRenamePreview(){
  const city=$('rename-city')?.value||'تهران',start=Math.max(1,Number($('rename-start')?.value)||1),tpl=$('rename-template')?.value||'{city} {n:000000}';
  $('rename-preview').innerHTML=Array.from({length:7},(_,i)=>`<div class="preview-item"><span>${escapeHtml(templateName(tpl,{city:city||'تهران',n:start+i,phone:'+989121234567',source:''}))}</span><span>#${start+i}</span></div>`).join('');
}
async function startRename(){
  if(state.busy)return;const city=$('rename-city').value,start=Math.max(1,Number($('rename-start').value)||1),tpl=$('rename-template').value||'{city} {n}';setBusy(true);let n=start,count=0;
  try{await new Promise((resolve,reject)=>{const tx=state.db.transaction('contacts','readwrite'),store=tx.objectStore('contacts'),src=city?store.index('city'):store,range=city?IDBKeyRange.only(city):null;const r=src.openCursor(range);r.onsuccess=()=>{const c=r.result;if(!c)return;const v=c.value;v.name=templateName(tpl,{city:v.city,n:n++,phone:v.phone,source:v.source});c.update(v);count++;if(count%5000===0)toast(`${fmt.format(count)} نام بروزرسانی شد…`,'good',1000);c.continue();};r.onerror=()=>reject(r.error);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});touchRevision();toast(`${fmt.format(count)} مخاطب تغییر نام داده شد.`);await refreshContacts();}
  catch(e){toast(e.message||'خطا در تغییر نام','bad');}finally{setBusy(false);}
}

// ---------- Bulk city / section / name edit ----------
async function rebuildStats(){
  const stats={total:0,cityCounts:{},sequences:(await getStats()).sequences||{}};const tx=state.db.transaction('contacts','readonly'),st=tx.objectStore('contacts');
  await new Promise((resolve,reject)=>{const r=st.openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return resolve();const v=c.value;stats.total++;stats.cityCounts[v.city||'بدون عنوان']=(stats.cityCounts[v.city||'بدون عنوان']||0)+1;c.continue();};r.onerror=()=>reject(r.error);});await saveStats(stats);
}
async function bulkEditContacts(){
  if(state.busy)return;const fromCity=$('edit-city-from')?.value||'',toCity=$('edit-city-to')?.value.trim()||'',fromSection=$('edit-section-from')?.value||'',toSection=$('edit-section-to')?.value.trim()||'',tpl=$('edit-name-template')?.value.trim()||'',start=Math.max(1,Number($('edit-name-start')?.value)||1);
  if(!toCity&&!toSection&&!tpl){toast('حداقل یک تغییر: شهر، بخش یا نام وارد کنید.','bad');return;}setBusy(true);let count=0,n=start;
  try{const tx=state.db.transaction('contacts','readwrite'),st=tx.objectStore('contacts');await new Promise((resolve,reject)=>{const r=st.openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return resolve();const v=c.value;if((!fromCity||v.city===fromCity)&&(!fromSection||v.section===fromSection)){if(toCity)v.city=toCity;if(toSection)v.section=toSection;if(tpl)v.name=templateName(tpl,{city:v.city,n:n++,phone:v.phone,source:v.source});c.update(v);count++;}c.continue();};r.onerror=()=>reject(r.error);});await txDone(tx);await rebuildStats();await addArtifact({type:'bulk-edit',name:'ویرایش گروهی',city:toCity||fromCity,section:toSection||fromSection,count});touchRevision();await fillCitySelects();await refreshContacts();toast(`${fmt.format(count)} مخاطب ویرایش شد.`);}catch(e){toast(`ویرایش ناموفق: ${e.message}`,'bad');}finally{setBusy(false);}
}

// ---------- Export queue + ZIP ----------
function vcfLine(v){const esc=s=>String(s??'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${esc(v.name)}\r\nTEL;TYPE=CELL:${v.phone}\r\nNOTE:${esc([v.city,v.section,v.source].filter(Boolean).join(' | '))}\r\nEND:VCARD\r\n`;}
function csvCell(s){s=String(s??'');return /[",\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function makeExportBlob(format,rows){
  if(format==='vcf')return new Blob([rows.map(vcfLine).join('')],{type:'text/vcard;charset=utf-8'});
  if(format==='txt')return new Blob(['\ufeff'+rows.map(v=>v.phone).join('\r\n')],{type:'text/plain;charset=utf-8'});
  if(format==='xls'){
    const xe=s=>escapeHtml(String(s??''));
    const head='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Contacts"><Table>';
    const row=r=>'<Row>'+r.map(v=>'<Cell><Data ss:Type="String">'+xe(v)+'</Data></Cell>').join('')+'</Row>';
    const body=row(['name','phone','city','section','source'])+rows.map(v=>row([v.name,v.phone,v.city,v.section||'',v.source])).join('');
    return new Blob(['\ufeff'+head+body+'</Table></Worksheet></Workbook>'],{type:'application/vnd.ms-excel'});
  }
  return new Blob(['\ufeffname,phone,city,section,source\r\n'+rows.map(v=>[v.name,v.phone,v.city,v.section||'',v.source].map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
}
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function le16(n){return new Uint8Array([n&255,(n>>>8)&255]);}function le32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);}
function dosDateTime(d=new Date()){let y=Math.max(1980,d.getFullYear());return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}
async function makeZip(entries){let total=entries.reduce((a,e)=>a+e.blob.size,0);if(total>512*1024*1024)throw new Error('برای ZIP مرورگری مجموع فایل‌ها باید کمتر از 512MB باشد؛ فایل‌های جداگانه آماده شده‌اند.');const enc=new TextEncoder(),parts=[],central=[];let offset=0;const dt=dosDateTime();for(const e of entries){const name=enc.encode(e.name),data=new Uint8Array(await e.blob.arrayBuffer()),crc=crc32(data),local=new Blob([le32(0x04034b50),le16(20),le16(0x0800),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name,data]);parts.push(local);central.push(new Blob([le32(0x02014b50),le16(20),le16(20),le16(0x0800),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]));offset+=local.size;}const centralSize=central.reduce((a,b)=>a+b.size,0),end=new Blob([le32(0x06054b50),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(centralSize),le32(offset),le16(0)]);return new Blob([...parts,...central,end],{type:'application/zip'});}
function currentExportJob(){return {id:(crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`),format:$('export-format').value,city:$('export-city').value,section:$('export-section')?.value||'',chunk:Math.max(100,Math.min(100000,Number($('export-chunk').value)||10000)),base:safeName($('export-name').value),zip:!!$('export-zip')?.checked,status:'queued',result:null,error:''};}
function renderExportQueue(){const el=$('export-queue');if(!el)return;if(!state.exportQueue.length){el.innerHTML='<div class="empty-state compact">خروجی‌ای در صف نیست.</div>';return;}el.innerHTML=state.exportQueue.map(j=>`<div class="export-row"><div><strong>${escapeHtml(j.base)}</strong><small>${escapeHtml(j.format.toUpperCase())} • ${escapeHtml(j.city||'همه شهرها')} • ${escapeHtml(j.section||'همه بخش‌ها')} • هر فایل ${fmt.format(j.chunk)}${j.zip?' • ZIP':''}</small>${j.error?`<small class="queue-error">${escapeHtml(j.error)}</small>`:''}</div><span class="pill ${j.status==='done'?'active':j.status==='error'?'danger':'queued'}">${escapeHtml(j.status)}</span><button class="danger-btn export-queue-remove" data-id="${escapeHtml(j.id)}" ${j.status==='running'?'disabled':''}>حذف</button></div>`).join('');el.querySelectorAll('.export-queue-remove').forEach(b=>b.onclick=()=>{state.exportQueue=state.exportQueue.filter(x=>x.id!==b.dataset.id);renderExportQueue();});}
function addExportQueue(){state.exportQueue.push(currentExportJob());renderExportQueue();toast('تنظیمات خروجی به صف اضافه شد.');}
async function executeExportJob(job){const {format,city,section,chunk,base}=job,ext=({vcf:'vcf',csv:'csv',txt:'txt',xls:'xls'}[format]||'csv'),entries=[];let batch=[],part=1,total=0;await new Promise((resolve,reject)=>{const tx=state.db.transaction('contacts','readonly'),store=tx.objectStore('contacts'),src=city?store.index('city'):store,range=city?IDBKeyRange.only(city):null,r=src.openCursor(range);r.onsuccess=()=>{const c=r.result;if(!c)return resolve();if(section&&c.value.section!==section){c.continue();return;}batch.push(c.value);total++;if(batch.length>=chunk){entries.push({blob:makeExportBlob(format,batch),name:`${base}_${String(part++).padStart(4,'0')}.${ext}`,count:batch.length});batch=[];}c.continue();};r.onerror=()=>reject(r.error);});if(batch.length)entries.push({blob:makeExportBlob(format,batch),name:`${base}_${String(part++).padStart(4,'0')}.${ext}`,count:batch.length});if(!total)throw new Error('مخاطبی برای خروجی وجود ندارد.');for(const e of entries)appendExport(e.blob,e.name,e.count);if(job.zip){const zip=await makeZip(entries),zipName=`${base}_${String(entries.length).padStart(2,'0')}_parts.zip`;appendExport(zip,zipName,total,'export-zip');}await addArtifact({type:'export',name:base,format,city,section,count:total,parts:entries.length,zipped:job.zip});touchRevision();return {total,parts:entries.length};}
async function startExport(){if(state.busy)return;setBusy(true);clearExports();const job=currentExportJob();try{job.result=await executeExportJob(job);toast(`${fmt.format(job.result.total)} مخاطب در ${fmt.format(job.result.parts)} فایل آماده شد${job.zip?' + ZIP':''}.`);}catch(e){toast(e.message||'خطا در خروجی','bad');}finally{setBusy(false);}}
async function runExportQueue(){if(state.busy)return;if(!state.exportQueue.length)return toast('ابتدا یک یا چند خروجی به صف اضافه کنید.','bad');setBusy(true);clearExports();let ok=0,fail=0;try{for(const job of state.exportQueue){if(job.status==='done')continue;job.status='running';job.error='';renderExportQueue();try{job.result=await executeExportJob(job);job.status='done';ok++;}catch(e){job.status='error';job.error=e.message||String(e);fail++;}renderExportQueue();}toast(`صف خروجی تمام شد: ${fmt.format(ok)} موفق${fail?` • ${fmt.format(fail)} خطا`:''}.`);}finally{setBusy(false);}}
function appendExport(blob,name,count,kind='export'){if(window.ContactFlowProArchiveFile)window.ContactFlowProArchiveFile(blob,kind,name);const url=URL.createObjectURL(blob);state.exports.push(url);const row=document.createElement('div');row.className='export-row';const android=!!window.ContactFlowAndroid?.saveFile;row.innerHTML=`<div><strong>${escapeHtml(name)}</strong><small>${fmt.format(count)} رکورد • ${formatBytes(blob.size)}</small></div>${android?'<button class="download-btn android-save">ذخیره در Downloads</button>':`<a class="download-btn" href="${url}" download="${escapeHtml(name)}">دانلود</a>`}`;if(android){row.querySelector('.android-save').addEventListener('click',async()=>{try{const u8=new Uint8Array(await blob.arrayBuffer());let bin='';for(let i=0;i<u8.length;i+=0x8000)bin+=String.fromCharCode(...u8.subarray(i,i+0x8000));window.ContactFlowAndroid.saveFile(name,blob.type||'application/octet-stream',btoa(bin));}catch(e){toast(`ذخیره Android ناموفق: ${e.message}`,'bad');}});}if($('exports-list').querySelector('.empty-state'))$('exports-list').innerHTML='';$('exports-list').appendChild(row);}
function clearExports(){state.exports.forEach(URL.revokeObjectURL);state.exports=[];$('exports-list').innerHTML='<div class="empty-state compact">هنوز خروجی ساخته نشده است.</div>';}

// ---------- Settings / Telegram gateway ----------
function refreshCapabilities(){
  const caps=[['IndexedDB','indexedDB'in window,'دیتابیس محلی مخاطبین'],['File Streams',!!Blob.prototype.stream,'پردازش CSV بدون بارگذاری کامل'],['XLSX Decompression','DecompressionStream'in window,'خواندن ZIP داخلی Excel'],['Service Worker','serviceWorker'in navigator,'نصب و Offline PWA'],['Storage Estimate',!!navigator.storage?.estimate,'نمایش مصرف فضای محلی']];
  $('capability-list').innerHTML=caps.map(([n,ok,d])=>`<li><b>${ok?'✓':'✕'} ${n}</b><span>${escapeHtml(d)} — ${ok?'فعال':'در این مرورگر موجود نیست'}</span></li>`).join('');
}
async function wipeDB(){if(!confirm('همه مخاطبین و تاریخچه این دستگاه حذف شود؟'))return;state.db.close();await new Promise((res,rej)=>{const r=indexedDB.deleteDatabase(DB_NAME);r.onsuccess=res;r.onerror=()=>rej(r.error);r.onblocked=()=>toast('یک تب دیگر برنامه باز است؛ آن را ببندید.','bad');});state.db=await openDB();touchRevision();await initData();toast('دیتابیس محلی پاک شد.');}
function backupSettings(){const data={version:APP_VERSION,telegramGateway:localStorage.getItem('cf_tg_gateway')||'',createdAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='contactflow-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function saveGateway(){localStorage.setItem('cf_tg_gateway',$('tg-gateway').value.trim());sessionStorage.setItem('cf_tg_key',$('tg-key').value);toast('Gateway ذخیره شد؛ Access Key فقط در Session نگه داشته شد.');}
async function testGateway(){const url=$('tg-gateway').value.trim().replace(/\/$/,'');if(!url){toast('Gateway URL را وارد کنید.','bad');return;}try{const headers={};const key=$('tg-key').value;if(key)headers.Authorization=`Bearer ${key}`;const r=await fetch(url+'/health',{headers});if(!r.ok)throw new Error(`HTTP ${r.status}`);toast('اتصال Gateway موفق بود.');}catch(e){toast(`اتصال ناموفق: ${e.message}`,'bad',6000);}}

// ---------- Init ----------
async function initData(){await refreshDashboard();await refreshImports();await fillCitySelects();refreshCapabilities();renderImportQueue();renderExportQueue();if($('tg-gateway'))$('tg-gateway').value=localStorage.getItem('cf_tg_gateway')||'';if($('tg-key'))$('tg-key').value=sessionStorage.getItem('cf_tg_key')||'';}
function bind(){
  document.querySelectorAll('.nav-item,[data-go],#bottom-nav button').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page||b.dataset.go)));
  $('mobile-menu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('theme-toggle').addEventListener('click',()=>{document.documentElement.classList.toggle('light');localStorage.setItem('cf_theme',document.documentElement.classList.contains('light')?'light':'dark');});
  const fileInput=$('import-file'),drop=$('dropzone');fileInput.addEventListener('change',()=>{const files=[...fileInput.files];if(files.length){state.file=files[0];selectFile(files[0]);enqueueImportFiles(files);}});drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag')});drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');const files=[...e.dataTransfer.files];if(files.length){state.file=files[0];selectFile(files[0]);enqueueImportFiles(files);}});
  $('start-import').addEventListener('click',startImport);$('refresh-contacts').addEventListener('click',()=>{state.page=1;refreshContacts()});$('contact-search').addEventListener('keydown',e=>{if(e.key==='Enter'){state.page=1;refreshContacts()}});$('contact-city').addEventListener('change',()=>{state.page=1;refreshContacts()});$('contact-section')?.addEventListener('change',()=>{state.page=1;refreshContacts()});$('prev-page').addEventListener('click',()=>{if(state.page>1){state.page--;refreshContacts()}});$('next-page').addEventListener('click',()=>{state.page++;refreshContacts()});
  ['rename-city','rename-start','rename-template'].forEach(id=>$(id).addEventListener('input',updateRenamePreview));$('start-rename').addEventListener('click',startRename);$('apply-bulk-edit')?.addEventListener('click',bulkEditContacts);$('start-export').addEventListener('click',startExport);$('add-export-queue')?.addEventListener('click',addExportQueue);$('run-export-queue')?.addEventListener('click',runExportQueue);$('clear-exports').addEventListener('click',clearExports);$('wipe-db').addEventListener('click',wipeDB);$('backup-json').addEventListener('click',backupSettings);
  window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredInstall=e;$('install-app').classList.remove('hidden')});$('install-app').addEventListener('click',async()=>{if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;$('install-app').classList.add('hidden')});
}
function selectFile(f){if(!f)return;state.file=f;$('file-meta').textContent=`${f.name} • ${formatBytes(f.size)}`;}
function updateOnline(){const online=navigator.onLine;$('online-badge').classList.toggle('offline',!online);$('online-badge').querySelector('span').textContent=online?'Online':'Offline';}

(async function(){
  try{if(localStorage.getItem('cf_theme')==='light')document.documentElement.classList.add('light');bind();updateOnline();state.db=await openDB();await initData();updateRenamePreview();
    if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }catch(e){console.error(e);toast(`راه‌اندازی ناموفق: ${e.message}`,'bad',10000);}
})();
