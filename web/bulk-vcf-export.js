(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ContactFlowBulkVcf=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='3.6.0';
  const MAX_TOTAL=1_000_000;
  const MAX_CHUNK=100_000;
  const DEFAULT_CHUNK=10_000;
  const BLOCK_SIZE=2_000;

  function clampInteger(value,min,max,fallback){
    const number=Number(value);
    if(!Number.isFinite(number))return fallback;
    return Math.max(min,Math.min(max,Math.trunc(number)));
  }

  function cleanToken(value,fallback=''){
    const normalized=String(value??'').normalize('NFKC')
      .replace(/[\u0000-\u001f\u007f]/g,' ')
      .replace(/[\\/:*?"<>|]+/g,'_')
      .replace(/[\s\u200e\u200f]+/g,' ')
      .trim();
    return normalized||fallback;
  }

  function composeBaseName(baseName,city,extra,useCityName=false){
    const base=cleanToken(useCityName&&city?city:baseName,'contacts');
    const suffix=cleanToken(extra);
    return cleanToken([base,suffix].filter(Boolean).join(' '),'contacts');
  }

  function partName(baseName,part,extension='vcf'){
    const base=cleanToken(baseName,'contacts');
    const safePart=clampInteger(part,1,999999,1);
    const ext=String(extension||'vcf').replace(/[^a-z0-9]/gi,'').toLowerCase()||'vcf';
    return `${base}_${String(safePart).padStart(4,'0')}.${ext}`;
  }

  function planParts(total,chunkSize=DEFAULT_CHUNK){
    const capped=clampInteger(total,0,MAX_TOTAL,0);
    const chunk=clampInteger(chunkSize,100,MAX_CHUNK,DEFAULT_CHUNK);
    return {requested:Math.max(0,Number(total)||0),total:capped,chunk,parts:Math.ceil(capped/chunk),truncated:Number(total)>MAX_TOTAL};
  }

  function escapeVcard(value){
    return String(value??'')
      .replace(/\\/g,'\\\\')
      .replace(/\r\n|\r|\n/g,'\\n')
      .replace(/;/g,'\\;')
      .replace(/,/g,'\\,');
  }

  function vcardLine(contact){
    const name=contact?.name||contact?.phone||'Contact';
    const note=[contact?.city,contact?.section,contact?.source].filter(Boolean).join(' | ');
    return `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${escapeVcard(name)}\r\nTEL;TYPE=CELL:${escapeVcard(contact?.phone)}\r\nNOTE:${escapeVcard(note)}\r\nEND:VCARD\r\n`;
  }

  function makeVcfBlob(rows,options={}){
    if(!Array.isArray(rows))throw new TypeError('rows must be an array');
    const blockSize=clampInteger(options.blockSize,100,10_000,BLOCK_SIZE);
    const blocks=[];
    for(let offset=0;offset<rows.length;offset+=blockSize){
      let text='';
      const end=Math.min(rows.length,offset+blockSize);
      for(let index=offset;index<end;index++)text+=vcardLine(rows[index]);
      blocks.push(text);
    }
    return new Blob(blocks,{type:'text/vcard;charset=utf-8'});
  }

  function resolveEngine({offline=true,compatible=true,moduleAvailable=true}={}){
    if(offline&&moduleAvailable)return 'offline';
    if(compatible)return offline?'fallback':'compatible';
    throw new Error('هیچ موتور خروجی VCF فعال نیست.');
  }

  return Object.freeze({VERSION,MAX_TOTAL,MAX_CHUNK,DEFAULT_CHUNK,BLOCK_SIZE,clampInteger,cleanToken,composeBaseName,partName,planParts,escapeVcard,vcardLine,makeVcfBlob,resolveEngine});
});
