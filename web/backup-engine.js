(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ContactFlowBackupEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='3.6.0';
  const FORMAT='ContactFlowBackup';
  const SCHEMA_VERSION=9;
  const MIME='application/x-contactflow-backup';
  const DEFAULT_STORES=['contacts','imports','meta','settings','artifacts','contact_flags','campaigns','ad_requests','telegram_accounts','templates','activity','merge_runs','contact_images','watch_state'];
  const TYPE_KEY='__contactFlowBackupType';

  function fail(message){throw new Error(message)}
  function emit(fn,detail){try{fn?.(detail)}catch{}}
  function requestValue(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));})}
  function transactionDone(transaction){return new Promise((resolve,reject)=>{transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(transaction.error||new Error('تراکنش Backup لغو شد.'));transaction.onerror=()=>reject(transaction.error||new Error('تراکنش Backup ناموفق بود.'));})}

  function bytesToBase64(bytes){
    if(typeof btoa==='function'){
      let output='';
      const size=0x6000;
      for(let offset=0;offset<bytes.length;offset+=size)output+=btoa(String.fromCharCode(...bytes.subarray(offset,Math.min(bytes.length,offset+size))));
      return output;
    }
    if(typeof Buffer!=='undefined')return Buffer.from(bytes).toString('base64');
    fail('Base64 encoder در این اجرا در دسترس نیست.');
  }

  function base64ToBytes(value){
    if(typeof atob==='function'){
      const binary=atob(value),bytes=new Uint8Array(binary.length);
      for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);
      return bytes;
    }
    if(typeof Buffer!=='undefined')return new Uint8Array(Buffer.from(value,'base64'));
    fail('Base64 decoder در این اجرا در دسترس نیست.');
  }

  async function sha256(text){
    if(!root.crypto?.subtle)fail('WebCrypto برای راستی‌آزمایی Backup در دسترس نیست.');
    const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest),item=>item.toString(16).padStart(2,'0')).join('');
  }

  async function encodeValue(value,tracker,seen){
    if(value===undefined)return {[TYPE_KEY]:'Undefined'};
    if(value===null||typeof value==='string'||typeof value==='boolean')return value;
    if(typeof value==='number')return Number.isFinite(value)?value:{[TYPE_KEY]:'Number',value:String(value)};
    if(typeof value==='bigint')return {[TYPE_KEY]:'BigInt',value:String(value)};
    if(typeof value!=='object')fail('نوع دادهٔ پشتیبانی‌نشده در Backup: '+typeof value);
    if(seen.has(value))fail('ساختار حلقه‌ای در دادهٔ محلی پیدا شد؛ Backup متوقف شد تا فایل ناقص ساخته نشود.');
    seen.add(value);
    try{
      if(typeof Blob!=='undefined'&&value instanceof Blob){
        const bytes=new Uint8Array(await value.arrayBuffer());
        tracker.blobCount++;
        tracker.blobBytes+=bytes.length;
        return {[TYPE_KEY]:'Blob',mime:value.type||'',name:typeof value.name==='string'?value.name:'',lastModified:Number(value.lastModified)||0,size:bytes.length,data:bytesToBase64(bytes)};
      }
      if(value instanceof Date)return {[TYPE_KEY]:'Date',value:value.toISOString()};
      if(value instanceof ArrayBuffer){
        const bytes=new Uint8Array(value);tracker.binaryCount++;tracker.binaryBytes+=bytes.length;
        return {[TYPE_KEY]:'ArrayBuffer',data:bytesToBase64(bytes)};
      }
      if(ArrayBuffer.isView(value)){
        const bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);tracker.binaryCount++;tracker.binaryBytes+=bytes.length;
        return {[TYPE_KEY]:'TypedArray',kind:value.constructor?.name||'Uint8Array',data:bytesToBase64(bytes)};
      }
      if(Array.isArray(value)){
        const output=[];
        for(const item of value)output.push(await encodeValue(item,tracker,seen));
        return output;
      }
      const output={};
      for(const key of Object.keys(value))output[key]=await encodeValue(value[key],tracker,seen);
      return output;
    }finally{seen.delete(value)}
  }

  function decodeValue(value,warnings){
    if(value===null||typeof value!=='object')return value;
    if(value.__blob===true){
      if(typeof value.data==='string')return new Blob([base64ToBytes(value.data)],{type:value.type||''});
      warnings.push('رسانهٔ یک Backup قدیمی بدون محتوای باینری بود و قابل بازیابی نیست.');
      return null;
    }
    const type=value[TYPE_KEY];
    if(type==='Undefined')return undefined;
    if(type==='Number')return value.value==='NaN'?NaN:value.value==='Infinity'?Infinity:-Infinity;
    if(type==='BigInt')return BigInt(value.value);
    if(type==='Date')return new Date(value.value);
    if(type==='Blob'){
      const bytes=base64ToBytes(String(value.data||''));
      if(Number(value.size)!==bytes.length)fail('اندازهٔ یکی از فایل‌های داخلی Backup با Manifest یکسان نیست.');
      if(value.name&&typeof File!=='undefined')return new File([bytes],value.name,{type:value.mime||'',lastModified:Number(value.lastModified)||0});
      return new Blob([bytes],{type:value.mime||''});
    }
    if(type==='ArrayBuffer')return base64ToBytes(String(value.data||'')).buffer;
    if(type==='TypedArray'){
      const bytes=base64ToBytes(String(value.data||'')),ctor=root[value.kind];
      if(typeof ctor==='function'&&ctor.BYTES_PER_ELEMENT)return new ctor(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
      return bytes;
    }
    if(Array.isArray(value))return value.map(item=>decodeValue(item,warnings));
    const output={};
    for(const key of Object.keys(value))output[key]=decodeValue(value[key],warnings);
    return output;
  }

  function backupBasis(data){return {format:data.format,version:data.version,appVersion:data.appVersion,createdAt:data.createdAt,note:data.note||'',stores:data.stores,connectors:data.connectors||{}}}

  async function createBackupFromStores(stores,{appVersion=VERSION,note='',connectors={},onProgress}={}){
    const tracker={blobCount:0,blobBytes:0,binaryCount:0,binaryBytes:0},encoded={},names=Object.keys(stores),counts={};
    let completed=0,totalRecords=0;
    for(const name of names){
      const rows=stores[name];
      if(!Array.isArray(rows))fail(`مخزن ${name} آرایه نیست.`);
      encoded[name]=[];counts[name]=rows.length;totalRecords+=rows.length;
      for(let index=0;index<rows.length;index++){
        encoded[name].push(await encodeValue(rows[index],tracker,new WeakSet()));
        if(index%250===0)emit(onProgress,{phase:'encoding',store:name,done:index,total:rows.length,completedStores:completed,totalStores:names.length});
      }
      completed++;
      emit(onProgress,{phase:'encoding',store:name,done:rows.length,total:rows.length,completedStores:completed,totalStores:names.length});
    }
    const encodedConnectors=await encodeValue(connectors,tracker,new WeakSet());
    const data={format:FORMAT,version:SCHEMA_VERSION,appVersion,createdAt:new Date().toISOString(),note:String(note||''),stores:encoded,connectors:encodedConnectors};
    const hash=await sha256(JSON.stringify(backupBasis(data)));
    data.integrity={algorithm:'SHA-256',sha256:hash,counts,totalRecords,blobCount:tracker.blobCount,blobBytes:tracker.blobBytes,binaryCount:tracker.binaryCount,binaryBytes:tracker.binaryBytes};
    return data;
  }

  async function parseBackup(input){
    if(typeof input==='string')return JSON.parse(input);
    if(input&&typeof input.text==='function')return JSON.parse(await input.text());
    if(input&&typeof input==='object')return input;
    fail('فایل Backup قابل خواندن نیست.');
  }

  async function inspect(input,{requiredStores=DEFAULT_STORES}={}){
    const data=await parseBackup(input),warnings=[];
    if(data?.format!==FORMAT)fail('فرمت فایل Backup معتبر نیست.');
    if(!data.stores||typeof data.stores!=='object'||Array.isArray(data.stores))fail('بخش مخزن‌های Backup وجود ندارد.');
    const names=Object.keys(data.stores),counts={};let totalRecords=0;
    for(const name of names){if(!Array.isArray(data.stores[name]))fail(`مخزن ${name} خراب است.`);counts[name]=data.stores[name].length;totalRecords+=counts[name];}
    if(Number(data.version)>=SCHEMA_VERSION){
      if(data.integrity?.algorithm!=='SHA-256'||!data.integrity.sha256)fail('امضای راستی‌آزمایی Backup وجود ندارد.');
      const actual=await sha256(JSON.stringify(backupBasis(data)));
      if(actual!==data.integrity.sha256)fail('Checksum فایل Backup یکسان نیست؛ فایل ناقص یا دستکاری شده است.');
      for(const [name,count] of Object.entries(data.integrity.counts||{}))if(counts[name]!==count)fail(`تعداد رکوردهای مخزن ${name} با Manifest یکسان نیست.`);
      if(Number(data.integrity.totalRecords)!==totalRecords)fail('تعداد کل رکوردهای Backup با Manifest یکسان نیست.');
      for(const name of requiredStores)if(!Object.prototype.hasOwnProperty.call(data.stores,name))fail(`Backup کامل نیست؛ مخزن ${name} وجود ندارد.`);
    }else{
      warnings.push('این Backup مربوط به موتور قدیمی است؛ Checksum ندارد و محتوای Blobهای قدیمی قابل تضمین نیست.');
    }
    return {data,version:Number(data.version)||0,appVersion:String(data.appVersion||''),createdAt:String(data.createdAt||''),note:String(data.note||''),counts,totalRecords,storeCount:names.length,blobCount:Number(data.integrity?.blobCount)||0,blobBytes:Number(data.integrity?.blobBytes)||0,warnings};
  }

  async function readDatabase(db,storeNames,onProgress){
    const available=new Set(Array.from(db.objectStoreNames||[])),stores={};
    for(let index=0;index<storeNames.length;index++){
      const name=storeNames[index];
      if(!available.has(name))fail(`مخزن ${name} در دیتابیس فعلی وجود ندارد.`);
      const tx=db.transaction(name,'readonly'),done=transactionDone(tx),request=tx.objectStore(name).getAll();
      stores[name]=await requestValue(request);await done;
      emit(onProgress,{phase:'reading',store:name,done:index+1,total:storeNames.length,records:stores[name].length});
    }
    return stores;
  }

  async function restoreDatabase(db,report,{storeNames=DEFAULT_STORES,onProgress}={}){
    const warnings=report.warnings.slice(),available=new Set(Array.from(db.objectStoreNames||[]));
    const requested=Number(report.version)>=SCHEMA_VERSION?storeNames:Object.keys(report.data.stores);
    const names=requested.filter(name=>Object.prototype.hasOwnProperty.call(report.data.stores,name)&&available.has(name));
    if(!names.length)fail('هیچ مخزن سازگاری برای بازیابی پیدا نشد.');
    if(Number(report.version)>=SCHEMA_VERSION&&names.length!==requested.length)fail('ساختار دیتابیس فعلی با Backup کامل سازگار نیست؛ هیچ داده‌ای تغییر نکرد.');
    const decoded={};
    for(let storeIndex=0;storeIndex<names.length;storeIndex++){
      const name=names[storeIndex],rows=report.data.stores[name];decoded[name]=[];
      for(let index=0;index<rows.length;index++){
        decoded[name].push(decodeValue(rows[index],warnings));
        if(index%250===0)emit(onProgress,{phase:'decoding',store:name,done:index,total:rows.length,completedStores:storeIndex,totalStores:names.length});
      }
      emit(onProgress,{phase:'decoding',store:name,done:rows.length,total:rows.length,completedStores:storeIndex+1,totalStores:names.length});
    }
    let transaction;
    try{transaction=db.transaction(names,'readwrite',{durability:'strict'});}catch{transaction=db.transaction(names,'readwrite');}
    const done=transactionDone(transaction);
    for(let storeIndex=0;storeIndex<names.length;storeIndex++){
      const name=names[storeIndex],store=transaction.objectStore(name);store.clear();
      for(const row of decoded[name])store.put(row);
      emit(onProgress,{phase:'writing',store:name,done:storeIndex+1,total:names.length,records:decoded[name].length});
    }
    await done;
    const verified={};
    for(let index=0;index<names.length;index++){
      const name=names[index],tx=db.transaction(name,'readonly'),txDone=transactionDone(tx);verified[name]=await requestValue(tx.objectStore(name).count());await txDone;
      if(verified[name]!==decoded[name].length)fail(`راستی‌آزمایی پس از Restore برای مخزن ${name} ناموفق بود.`);
      emit(onProgress,{phase:'verifying',store:name,done:index+1,total:names.length,records:verified[name]});
    }
    return {restored:true,counts:verified,totalRecords:Object.values(verified).reduce((sum,count)=>sum+count,0),warnings};
  }

  function createController({getDatabase,storeNames=DEFAULT_STORES,appVersion=VERSION,getConnectors,restoreConnectors}={}){
    if(typeof getDatabase!=='function')fail('getDatabase برای موتور Backup لازم است.');
    const names=Array.from(storeNames);
    async function create({note='',onProgress}={}){
      const db=await getDatabase(),stores=await readDatabase(db,names,onProgress),connectors=typeof getConnectors==='function'?await getConnectors():{};
      return createBackupFromStores(stores,{appVersion,note,connectors,onProgress});
    }
    async function createBlob(options={}){
      const data=await create(options),blob=new Blob([JSON.stringify(data)],{type:MIME});
      const name=`ContactFlow_${new Date().toISOString().replace(/[:.]/g,'-')}.cfbackup`;
      return {data,blob,name,summary:{totalRecords:data.integrity.totalRecords,storeCount:Object.keys(data.stores).length,blobCount:data.integrity.blobCount,blobBytes:data.integrity.blobBytes,sha256:data.integrity.sha256}};
    }
    async function restoreBlob(blob,{confirm:confirmRestore,onProgress}={}){
      const report=await inspect(blob,{requiredStores:names});
      if(typeof confirmRestore==='function'&&!await confirmRestore(report))return {restored:false,cancelled:true,report};
      const result=await restoreDatabase(await getDatabase(),report,{storeNames:names,onProgress});
      if(typeof restoreConnectors==='function'&&report.data.connectors){
        try{await restoreConnectors(decodeValue(report.data.connectors,result.warnings));}
        catch(error){result.warnings.push('بخش Connector بازیابی نشد: '+(error?.message||error));}
      }
      return {...result,report};
    }
    async function download(options={}){
      const output=await createBlob(options);
      if(!root.ContactFlowFileSave?.save)fail('مسیر ذخیره فایل آماده نیست.');
      const saveResult=await root.ContactFlowFileSave.save(output.blob,output.name,{description:'ContactFlow full backup'});
      return {...output,saveResult};
    }
    return {VERSION,FORMAT,SCHEMA_VERSION,MIME,storeNames:names,create,createBlob,inspect:input=>inspect(input,{requiredStores:names}),restoreBlob,download};
  }

  return {VERSION,FORMAT,SCHEMA_VERSION,MIME,DEFAULT_STORES,createBackupFromStores,parseBackup,inspect,decodeValue,restoreDatabase,createController,sha256};
});
