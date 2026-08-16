(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ContactFlowTelegramExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='3.6.0';
  const digits={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  const text=value=>String(value??'').replace(/[\u200e\u200f\u202a-\u202e]/g,'').replace(/\s+/g,' ').trim();
  const latin=value=>text(value).replace(/[۰-۹٠-٩]/g,char=>digits[char]||char);
  function normalizePhone(value){
    const original=latin(value),hadPlus=/^\s*(?:\+|00)/.test(original);let phone=original.replace(/[^\d+]/g,'');
    if(phone.startsWith('00'))phone='+'+phone.slice(2);
    if(/^0?9\d{9}$/.test(phone))return '+98'+phone.replace(/^0/,'');
    if(/^98(?:0)?9\d{9}$/.test(phone))return '+'+phone.replace(/^980/,'98');
    if(/^\+98(?:0)?9\d{9}$/.test(phone))return phone.replace('+980','+98');
    if(hadPlus&&/^\+[1-9]\d{7,14}$/.test(phone))return phone;
    return null;
  }
  function candidateLists(root){
    const data=root?.data||root||{},lists=[];
    for(const value of [data?.contacts?.list,data?.contacts,data?.saved_contacts?.list,data?.saved_contacts,data?.people?.list,data?.people])if(Array.isArray(value))lists.push(value);
    if(Array.isArray(data))lists.push(data);
    if(!lists.length){
      const seen=new Set();
      const visit=(value,depth=0)=>{if(!value||depth>5||seen.has(value))return;seen.add(value);if(Array.isArray(value)){if(value.some(item=>item&&typeof item==='object'&&('phone_number'in item||'phone'in item||'telephone'in item)))lists.push(value);else value.forEach(item=>visit(item,depth+1));return}if(typeof value==='object')Object.values(value).forEach(item=>visit(item,depth+1))};
      visit(data);
    }
    return lists;
  }
  function normalizeRecord(item,index=0){
    const phone=normalizePhone(item?.phone_number??item?.phone??item?.mobile??item?.telephone??item?.tel);
    if(!phone)return null;
    const firstName=text(item?.first_name??item?.firstName),lastName=text(item?.last_name??item?.lastName),name=text(item?.name??item?.display_name??[firstName,lastName].filter(Boolean).join(' '))||`Telegram ${index+1}`;
    return {phone,name,firstName,lastName,username:text(item?.username),telegramUserId:text(item?.id??item?.user_id),telegramStatus:'exported',source:'Telegram Desktop Export',sourceFiles:['Telegram Desktop Export'],city:text(item?.city),province:text(item?.province),createdAt:Date.now()};
  }
  function dedupe(rows){const map=new Map();for(const row of rows){if(!row?.phone)continue;const old=map.get(row.phone);map.set(row.phone,old?{...old,...Object.fromEntries(Object.entries(row).filter(([,v])=>v!==''&&v!=null))}:row)}return [...map.values()]}
  function parseJson(input){const root=typeof input==='string'?JSON.parse(input):input,rows=[];for(const list of candidateLists(root))list.forEach((item,index)=>{const row=normalizeRecord(item,index);if(row)rows.push(row)});return dedupe(rows)}
  function decodeHtml(value){return text(String(value??'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>') )}
  function parseHtml(html){
    const rows=[];
    if(typeof DOMParser!=='undefined'){
      const doc=new DOMParser().parseFromString(String(html||''),'text/html');
      const blocks=doc.querySelectorAll('.contact, .entry, .details, .body, .page_body');
      blocks.forEach((block,index)=>{const raw=block.textContent||'',match=raw.match(/(?:\+|00|0)?[\d۰-۹٠-٩][\d۰-۹٠-٩ ()\-.]{7,18}/);if(!match)return;const name=block.querySelector('.name,.title,.contact_name')?.textContent||raw.split(/\r?\n/).map(text).find(line=>line&&!line.includes(match[0]))||'';const row=normalizeRecord({name,phone_number:match[0]},index);if(row)rows.push(row)});
    }
    if(!rows.length){const plain=decodeHtml(html),matches=plain.match(/(?:\+|00|0)?[\d۰-۹٠-٩][\d۰-۹٠-٩ ()\-.]{7,18}/g)||[];matches.forEach((phone,index)=>{const row=normalizeRecord({name:`Telegram ${index+1}`,phone_number:phone},index);if(row)rows.push(row)})}
    return dedupe(rows);
  }
  function parseVcf(value){const cards=String(value||'').split(/END:VCARD/i),rows=[];cards.forEach((card,index)=>{const unfolded=card.replace(/\r?\n[ \t]/g,''),phone=unfolded.match(/^TEL[^:]*:(.*)$/im)?.[1],name=unfolded.match(/^FN[^:]*:(.*)$/im)?.[1];const row=normalizeRecord({name:name?.replace(/\\([,;nN\\])/g,(_,x)=>x.toLowerCase()==='n'?' ':x),phone_number:phone},index);if(row)rows.push(row)});return dedupe(rows)}
  const csvCell=value=>`"${String(value??'').replace(/"/g,'""')}"`;
  function toCsv(rows){return '\ufeffname,phone,username,telegram_user_id,source\r\n'+rows.map(row=>[row.name,row.phone,row.username,row.telegramUserId,row.source].map(csvCell).join(',')).join('\r\n')}
  const vcfText=value=>String(value??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  function toVcf(rows){return rows.map(row=>`BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${vcfText(row.name)}\r\nTEL;TYPE=CELL:${row.phone}\r\nNOTE:${vcfText('Telegram Desktop Export')}\r\nEND:VCARD\r\n`).join('')}
  return {VERSION,normalizePhone,parseJson,parseHtml,parseVcf,dedupe,toCsv,toVcf};
});
