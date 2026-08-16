(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ContactFlowNameEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='3.6.0';
  const digits={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
  const text=value=>String(value??'').replace(/[\u200c\u200e\u200f\u202a-\u202e]/g,' ').replace(/\s+/g,' ').trim();
  const latin=value=>text(value).replace(/[۰-۹٠-٩]/g,char=>digits[char]||char);
  function parts(name){const value=text(name),items=value.split(' ').filter(Boolean);return {first:items[0]||'',last:items.slice(1).join(' ')}}
  function renderTemplate(template,row={},number=1){
    const nameParts=parts(row.oldName??row.name);
    const values={
      city:text(row.city),province:text(row.province),operator:text(row.operator),source:text(row.source),
      phone:text(row.phone),old:text(row.oldName??row.name),first:text(row.firstName||nameParts.first),last:text(row.lastName||nameParts.last),
      section:text(row.section),company:text(row.company)
    };
    let out=String(template||'{city} {n:000000}');
    out=out.replace(/\{n:(0+)\}/g,(_,zeroes)=>String(number).padStart(zeroes.length,'0'));
    out=out.replace(/\{n\}/g,String(number));
    out=out.replace(/\{phone:last(\d+)\}/g,(_,count)=>values.phone.replace(/\D/g,'').slice(-Math.max(0,Number(count)||0)));
    out=out.replace(/\{(city|province|operator|source|phone|old|first|last|section|company)\}/g,(_,key)=>values[key]);
    return text(out).slice(0,160);
  }
  function planNames(records,options={}){
    const start=Math.max(1,Number(latin(options.start))||1),limit=Math.max(0,Number(latin(options.limit))||0);
    const template=text(options.template)||'{city} {n:000000}',preserve=options.preserveExisting===true;
    const source=Array.from(records||[]),selected=limit?source.slice(0,limit):source;
    const used=new Set(),changes=[];
    selected.forEach((record,index)=>{
      const number=start+index,base=preserve&&text(record.name)?text(record.name):renderTemplate(template,{...record,oldName:record.name},number);
      let name=base||`مخاطب ${number}`,suffix=2;
      while(used.has(name.toLocaleLowerCase('fa-IR')))name=`${base||'مخاطب'} ${suffix++}`;
      used.add(name.toLocaleLowerCase('fa-IR'));
      changes.push({phone:record.phone,oldName:text(record.name),name,number,record:{...record,name,updatedAt:Date.now()}});
    });
    return {version:VERSION,total:source.length,changed:changes.length,start,next:start+changes.length,changes};
  }
  return {VERSION,text,latin,renderTemplate,planNames};
});
