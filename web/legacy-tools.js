(function(root,factory){
  const api=factory(root.ContactFlowTelegramExport);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ContactFlowLegacyTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(telegram){
  'use strict';
  const VERSION='3.6.0';
  const digits={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  const text=value=>String(value??'').replace(/\s+/g,' ').trim();
  const latin=value=>String(value??'').replace(/[۰-۹٠-٩]/g,c=>digits[c]||c);
  function normalizePhone(value,mode='plus98'){
    let phone=latin(value).trim().replace(/[^\d+]/g,'');if(phone.startsWith('00'))phone='+'+phone.slice(2);
    let local='';if(/^\+?98(?:0)?9\d{9}$/.test(phone))local='0'+phone.replace(/^\+?980?/,'');else if(/^0?9\d{9}$/.test(phone))local='0'+phone.replace(/^0/,'');else if(/^\+[1-9]\d{7,14}$/.test(phone))return phone;
    if(!local)return null;
    if(mode==='local0')return local;if(mode==='0098')return '0098'+local.slice(1);if(mode==='bare98')return '98'+local.slice(1);return '+98'+local.slice(1);
  }
  function parseText(input,options={}){
    const mode=options.mode||'plus98',lines=String(input||'').split(/\r?\n/),rows=[];
    for(const line of lines){if(!line.trim())continue;const fields=line.split(options.delimiter?options.delimiter:/[\t,;|]+/).map(text).filter(Boolean);let phone=null,phoneIndex=-1;for(let i=0;i<fields.length;i++){const found=normalizePhone(fields[i],mode);if(found){phone=found;phoneIndex=i;break}}if(!phone){const match=line.match(/(?:\+|00|0)?[\d۰-۹٠-٩][\d۰-۹٠-٩ ()\-.]{7,18}/);phone=match&&normalizePhone(match[0],mode)}if(!phone)continue;const name=text(fields.filter((_,i)=>i!==phoneIndex).join(' '))||`${options.namePrefix||'مخاطب'} ${rows.length+1}`;rows.push({phone,name,source:options.source||'Legacy Toolbox',city:options.city||'',createdAt:Date.now()})}
    return options.keepDuplicates?rows:dedupe(rows).unique;
  }
  function dedupe(rows){const map=new Map(),duplicates=[];for(const row of rows||[]){const phone=row.phone||normalizePhone(row.mobile||row.tel);if(!phone)continue;if(map.has(phone))duplicates.push({...row,phone,duplicateOf:map.get(phone).name});else map.set(phone,{...row,phone})}return {unique:[...map.values()],duplicates}}
  function chunks(rows,size=1000){const value=Math.max(1,Number(size)||1000),out=[];for(let i=0;i<rows.length;i+=value)out.push(rows.slice(i,i+value));return out}
  const vcfText=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function toVcf(rows,options={}){const type=String(options.phoneType||'CELL').toUpperCase();return rows.map(row=>`BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${vcfText(row.name)}\r\nN:${vcfText(row.lastName||'')};${vcfText(row.firstName||row.name)};;;\r\nTEL;TYPE=${type}:${row.phone}\r\n${row.email?`EMAIL:${vcfText(row.email)}\r\n`:''}${row.website?`URL:${vcfText(row.website)}\r\n`:''}${row.note||row.city||row.source?`NOTE:${vcfText([row.note,row.city,row.source].filter(Boolean).join(' | '))}\r\n`:''}END:VCARD\r\n`).join('')}
  function fromVcf(value){return telegram?.parseVcf?telegram.parseVcf(value):[]}
  const csvCell=value=>`"${String(value??'').replace(/"/g,'""')}"`;
  function toCsv(rows){return '\ufeffname,phone,email,city,source\r\n'+(rows||[]).map(row=>[row.name,row.phone,row.email,row.city,row.source].map(csvCell).join(',')).join('\r\n')}
  function textToHex(value){return Array.from(new TextEncoder().encode(String(value??'')),byte=>byte.toString(16).padStart(2,'0')).join('')}
  function hexToText(value){const clean=latin(value).replace(/(?:0x|\\x|[^\da-f])/gi,'');if(!clean||clean.length%2)throw new Error('Hex معتبر نیست.');const bytes=new Uint8Array(clean.match(/.{2}/g).map(pair=>parseInt(pair,16)));return new TextDecoder().decode(bytes)}
  function merge(groups){return dedupe((groups||[]).flat()).unique}
  return {VERSION,normalizePhone,parseText,dedupe,chunks,toVcf,fromVcf,toCsv,textToHex,hexToText,merge};
});
