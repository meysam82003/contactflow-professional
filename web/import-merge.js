/* ContactFlow 3.4 shared smart import/merge engine (browser + Node tests). */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ContactFlowImportMerge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='3.4.0';
const DIGITS={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
const FA_DIGITS=['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
const CITY_ALIASES={
  qom:'قم',ghom:'قم',tehran:'تهران',theran:'تهران',karaj:'کرج',mashhad:'مشهد',mashad:'مشهد',
  esfahan:'اصفهان',isfahan:'اصفهان',shiraz:'شیراز',tabriz:'تبریز',ahvaz:'اهواز',rasht:'رشت',
  urmia:'ارومیه',orumiyeh:'ارومیه',kerman:'کرمان',yazd:'یزد',arak:'اراک',hamedan:'همدان',hamadan:'همدان',
  bandarabbas:'بندرعباس','bandar-abbas':'بندرعباس',qazvin:'قزوین',ghazvin:'قزوین',kermanshah:'کرمانشاه',
  sari:'ساری',gorgan:'گرگان',sanandaj:'سنندج',zanjan:'زنجان',ardabil:'اردبیل',khorramabad:'خرم‌آباد',
  bushehr:'بوشهر',birjand:'بیرجند',ilam:'ایلام',semnan:'سمنان',shahrkord:'شهرکرد',bojnurd:'بجنورد',
  kish:'کیش',qeshm:'قشم',dezful:'دزفول',abadan:'آبادان',saveh:'ساوه',kashan:'کاشان',
  rey:'ری',varamin:'ورامین',damavand:'دماوند',malayer:'ملایر',maragheh:'مراغه',sabzevar:'سبزوار'
};
const IRAN_AREA_CODES={
  '11':['مازندران','landline'],'13':['گیلان','landline'],'17':['گلستان','landline'],'21':['تهران','landline'],
  '23':['سمنان','landline'],'24':['زنجان','landline'],'25':['قم','landline'],'26':['البرز','landline'],
  '28':['قزوین','landline'],'31':['اصفهان','landline'],'34':['کرمان','landline'],'35':['یزد','landline'],
  '38':['چهارمحال و بختیاری','landline'],'41':['آذربایجان شرقی','landline'],'44':['آذربایجان غربی','landline'],
  '45':['اردبیل','landline'],'51':['خراسان رضوی','landline'],'54':['سیستان و بلوچستان','landline'],
  '56':['خراسان جنوبی','landline'],'58':['خراسان شمالی','landline'],'61':['خوزستان','landline'],
  '66':['لرستان','landline'],'71':['فارس','landline'],'74':['کهگیلویه و بویراحمد','landline'],
  '76':['هرمزگان','landline'],'77':['بوشهر','landline'],'81':['همدان','landline'],'83':['کرمانشاه','landline'],
  '84':['ایلام','landline'],'86':['مرکزی','landline'],'87':['کردستان','landline']
};
const COUNTRIES=[
  ['98','ایران','IR',10,10],['971','امارات','AE',9,9],['964','عراق','IQ',9,10],['963','سوریه','SY',8,9],
  ['966','عربستان','SA',9,9],['974','قطر','QA',8,8],['965','کویت','KW',8,8],['968','عمان','OM',8,8],
  ['973','بحرین','BH',8,8],['90','ترکیه','TR',10,10],['93','افغانستان','AF',9,9],['92','پاکستان','PK',10,10],
  ['44','بریتانیا','GB',9,10],['49','آلمان','DE',7,12],['33','فرانسه','FR',9,9],['39','ایتالیا','IT',6,11],
  ['34','اسپانیا','ES',9,9],['31','هلند','NL',9,9],['46','سوئد','SE',7,10],['47','نروژ','NO',8,8],
  ['7','روسیه/قزاقستان','RU',10,10],['86','چین','CN',11,11],['91','هند','IN',10,10],['81','ژاپن','JP',9,10],
  ['82','کره جنوبی','KR',8,10],['61','استرالیا','AU',9,9],['64','نیوزیلند','NZ',8,10],['1','آمریکا/کانادا','US',10,10]
].sort((a,b)=>b[0].length-a[0].length);
const HEADER_ALIASES={
  phone:['phone','mobile','tel','telephone','number','شماره','موبایل','تلفن','همراه','شماره تماس','شماره موبایل'],
  name:['name','full name','fullname','contact','نام','نام کامل','نام مخاطب'],
  firstName:['first name','firstname','given name','نام کوچک'],
  lastName:['last name','lastname','surname','family','نام خانوادگی','فامیل'],
  email:['email','e-mail','mail','ایمیل','رایانامه'],city:['city','town','شهر'],country:['country','کشور'],
  company:['company','organization','organisation','business','شرکت','سازمان'],section:['section','group','category','بخش','گروه'],
  note:['note','notes','description','یادداشت','توضیحات']
};

function latinDigits(value){return String(value??'').replace(/[۰-۹٠-٩]/g,c=>DIGITS[c]||c)}
function persianDigits(value){return latinDigits(value).replace(/\d/g,d=>FA_DIGITS[Number(d)])}
function cleanText(value){return String(value??'').replace(/[\u200c\u200e\u200f\ufeff]/g,' ').replace(/\s+/g,' ').trim()}
function keyText(value){return latinDigits(cleanText(value)).toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک')}
function hasPersian(value){return /[\u0600-\u06ff]/.test(String(value??''))}
function onlyLatinName(value){const s=cleanText(value);return !!s&&/[a-z]/i.test(s)&&!hasPersian(s)&&!/[\d@]/.test(s)}
function stem(filename){return cleanText(String(filename||'').replace(/^.*[\\/]/,'').replace(/\.[^.]+$/,''))}

function cityFromAlias(value){
  const raw=keyText(value).replace(/[_\s]+/g,'-');
  if(CITY_ALIASES[raw])return CITY_ALIASES[raw];
  const joined=raw.replace(/-/g,'');if(CITY_ALIASES[joined])return CITY_ALIASES[joined];
  for(const token of raw.split(/[^a-z]+/).filter(Boolean)){if(CITY_ALIASES[token])return CITY_ALIASES[token]}
  return hasPersian(value)?cleanText(value):'';
}
function inferCityFromFilename(filename){return cityFromAlias(stem(filename))}

const WORDS={ali:'علی',reza:'رضا',mohammad:'محمد',mohamed:'محمد',muhammad:'محمد',hossein:'حسین',hussein:'حسین',
  hasan:'حسن',hassan:'حسن',zahra:'زهرا',fatemeh:'فاطمه',maryam:'مریم',meysam:'میثم',meisam:'میثم',mahdi:'مهدی',
  mehdi:'مهدی',sara:'سارا',nima:'نیما',amir:'امیر',saeed:'سعید',navid:'نوید',parsa:'پارسا',leila:'لیلا'};
function transliterateWord(word){
  const lower=String(word||'').toLowerCase();if(WORDS[lower])return WORDS[lower];
  const pairs=[['kh','خ'],['gh','غ'],['q','ق'],['ch','چ'],['sh','ش'],['zh','ژ'],['ph','ف'],['th','ت'],['oo','و'],['ou','و'],['ee','ی'],['ei','ی'],['ey','ی'],['ai','ای'],['ay','ای']];
  let s=lower;for(const [a,b] of pairs)s=s.split(a).join(b);
  const one={a:'ا',b:'ب',c:'ک',d:'د',e:'ِ',f:'ف',g:'گ',h:'ه',i:'ی',j:'ج',k:'ک',l:'ل',m:'م',n:'ن',o:'و',p:'پ',r:'ر',s:'س',t:'ت',u:'و',v:'و',w:'و',x:'کس',y:'ی',z:'ز'};
  s=[...s].map(c=>one[c]??c).join('').replace(/ِ+/g,'').replace(/ا{2,}/g,'ا').replace(/ی{2,}/g,'ی');
  return s||word;
}
function transliterateToPersian(value){return cleanText(value).split(/(\s+|[-_])/).map(part=>/^[a-z]+$/i.test(part)?transliterateWord(part):part).join('').replace(/\s+/g,' ').trim()}
function persianize(value,{knownOnly=false}={}){
  const s=cleanText(value);if(!onlyLatinName(s))return {value:s,changed:false,method:'none'};
  const city=cityFromAlias(s);if(city)return {value:city,changed:true,method:'dictionary'};
  if(knownOnly)return {value:s,changed:false,method:'none'};
  const out=transliterateToPersian(s);return {value:out,changed:out!==s,method:'phonetic'};
}

function countryForPhone(phone){
  const digits=String(phone||'').replace(/^\+/,'');const item=COUNTRIES.find(x=>digits.startsWith(x[0]));
  if(!item)return {callingCode:'',country:'نامشخص',countryCode:'',nationalNumber:digits,min:8,max:15};
  return {callingCode:'+'+item[0],country:item[1],countryCode:item[2],nationalNumber:digits.slice(item[0].length),min:item[3],max:item[4]};
}
function normalizePhone(raw,{defaultCountry='IR'}={}){
  const original=latinDigits(raw);let s=original.replace(/(?:ext\.?|extension|داخلی)\s*\d+$/i,'').trim();if(!s)return null;
  const explicitlyInternational=/^\s*(?:\+|00)/.test(s);s=s.replace(/[^\d+]/g,'');if(s.startsWith('00'))s='+'+s.slice(2);s=s.replace(/(?!^)\+/g,'');
  if(defaultCountry==='IR'&&!s.startsWith('+')){
    if(s.startsWith('0098'))s='+'+s.slice(2);
    else if(s.startsWith('98')&&s.length>=12)s='+'+s;
    else{s=s.replace(/^0+/,'');if(/^\d{10}$/.test(s))s='+98'+s}
  }
  if(!s.startsWith('+')&&explicitlyInternational)s='+'+s;
  if(!/^\+[1-9]\d{7,14}$/.test(s))return null;
  const c=countryForPhone(s),valid=c.nationalNumber.length>=c.min&&c.nationalNumber.length<=c.max;
  return {e164:s,raw:cleanText(raw),country:c.country,countryCode:c.countryCode,callingCode:c.callingCode,nationalNumber:c.nationalNumber,valid};
}
function classifyPhone(phone){
  const p=typeof phone==='string'?normalizePhone(phone):phone;if(!p)return {phoneType:'invalid',city:''};
  if(p.countryCode==='IR'){
    if(/^9\d{9}$/.test(p.nationalNumber))return {phoneType:'mobile',city:''};
    const area=IRAN_AREA_CODES[p.nationalNumber.slice(0,2)];if(area)return {phoneType:'landline',city:area[0]};
  }
  return {phoneType:'unknown',city:''};
}
function validatePhone(phone){const p=typeof phone==='string'?normalizePhone(phone):phone;return {valid:!!p?.valid,reason:!p?'فرمت نامعتبر':p.valid?'':'طول شماره با کشور سازگار نیست',country:p?.country||'نامشخص'}}
function cleanEmail(value){const s=cleanText(value).toLowerCase().replace(/^mailto:/,'');return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:''}
function emailDomain(value){const email=cleanEmail(value);return email?email.split('@')[1]:''}
function surnameOf(record){const explicit=cleanText(record?.lastName);if(explicit)return explicit;const parts=cleanText(record?.name).split(' ').filter(Boolean);return parts.length>1?parts[parts.length-1]:''}
function companyFromName(value){const name=cleanText(value),isCompany=/(^|\s)(شرکت|گروه|فروشگاه|موسسه|مؤسسه|صنایع|کارخانه|company|corp\.?|co\.?|ltd\.?|llc|inc\.?)(\s|$)/i.test(name);return {name,isCompany,company:isCompany?name:''}}

function normalizeHeader(value){return keyText(value).replace(/[_-]+/g,' ')}
function resolveColumns(headers){
  const out={};headers.forEach((header,index)=>{const h=normalizeHeader(header);for(const [field,aliases] of Object.entries(HEADER_ALIASES)){if(out[field]===undefined&&aliases.some(a=>h===normalizeHeader(a)||h.includes(normalizeHeader(a))))out[field]=index}});return out;
}
function rowToObject(headers,row){const columns=resolveColumns(headers),out={};for(const [field,index] of Object.entries(columns))out[field]=row[index]??'';return out}

function normalizeRecord(raw,context={}){
  const info=normalizePhone(raw.phone??raw.mobile??raw.tel,{defaultCountry:context.defaultCountry===undefined?'IR':context.defaultCountry}),phone=info?.e164||'';
  const typed=classifyPhone(info),fileCity=inferCityFromFilename(context.filename||''),rawCity=cityFromAlias(raw.city)||cleanText(raw.city),city=rawCity||cleanText(context.city)||typed.city||fileCity||'بدون عنوان';
  const rawName=cleanText(raw.name||[raw.firstName,raw.lastName].filter(Boolean).join(' ')),nameFa=persianize(rawName),cityFa=persianize(city,{knownOnly:false}),company=cleanText(raw.company)||companyFromName(rawName).company;
  const now=context.now||Date.now(),source=cleanText(context.source||raw.source||context.filename||'Import'),importId=cleanText(context.importId||'');
  const sourceFiles=[...new Set([...(Array.isArray(raw.sourceFiles)?raw.sourceFiles:[]),context.filename].filter(Boolean).map(cleanText))];
  const importIds=[...new Set([...(Array.isArray(raw.importIds)?raw.importIds:[]),importId].filter(Boolean))];
  return {
    phone,name:nameFa.value||phone,firstName:cleanText(raw.firstName),lastName:cleanText(raw.lastName),email:cleanEmail(raw.email),
    city:cityFa.value,country:cleanText(raw.country)||info?.country||'نامشخص',countryCode:info?.countryCode||'',phoneType:typed.phoneType,
    phoneValid:!!info?.valid,section:cleanText(raw.section||context.section),company,note:cleanText(raw.note),source,sourceFiles,importIds,
    importNote:`${new Date(now).toLocaleString('fa-IR')} • ${context.filename||source}`,rawPhone:cleanText(raw.phone),rowNumber:Number(context.rowNumber)||0,
    telegramStatus:raw.telegramStatus||'unchecked',telegramCheckedAt:raw.telegramCheckedAt||0,createdAt:raw.createdAt||now,updatedAt:now,
    _persianized:Number(nameFa.changed)+Number(cityFa.changed),_persianMethod:nameFa.method,_valid:!!phone&&!!info?.valid
  };
}

function union(a,b){return [...new Set([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].filter(Boolean))]}
function smartMerge(oldRow,newRow,mode='smart'){
  if(mode==='old')return {...oldRow};
  if(mode==='new'){
    const result={...oldRow};for(const [k,v] of Object.entries(newRow))if(v!==''&&v!==null&&v!==undefined)result[k]=v;
    result.createdAt=oldRow.createdAt||newRow.createdAt;result.sourceFiles=union(oldRow.sourceFiles,newRow.sourceFiles);result.importIds=union(oldRow.importIds,newRow.importIds);return result;
  }
  const result={...oldRow};let changed=false;for(const [k,v] of Object.entries(newRow)){if(k.startsWith('_')||['createdAt','updatedAt'].includes(k))continue;if((result[k]===''||result[k]===null||result[k]===undefined||result[k]==='نامشخص'||result[k]==='unchecked')&&v!==''&&v!==null&&v!==undefined){result[k]=v;changed=true}}
  const sourceFiles=union(oldRow.sourceFiles,newRow.sourceFiles),importIds=union(oldRow.importIds,newRow.importIds);if(JSON.stringify(sourceFiles)!==JSON.stringify(oldRow.sourceFiles||[])){result.sourceFiles=sourceFiles;changed=true}if(JSON.stringify(importIds)!==JSON.stringify(oldRow.importIds||[])){result.importIds=importIds;changed=true}if(changed)result.updatedAt=Date.now();return result;
}
function inc(obj,key,n=1){key=cleanText(key)||'نامشخص';obj[key]=(obj[key]||0)+n}
function sourceStats(report,source){const key=source||'نامشخص';return report.bySource[key]||(report.bySource[key]={rows:0,added:0,updated:0,duplicates:0,invalid:0})}
function decisionFor(decisions,incoming,index){return decisions?.[incoming.phone]||decisions?.[String(index)]||''}
function planMerge(existing,incoming,options={}){
  const defaultMode=['old','new','smart'].includes(options.defaultMode)?options.defaultMode:'smart',work=new Map(),emailMap=new Map();
  for(const row of existing||[]){if(row.phone)work.set(row.phone,{...row});if(row.email)emailMap.set(cleanEmail(row.email),row.phone)}
  const actions=[],report={total:(incoming||[]).length,added:0,updated:0,duplicates:0,invalid:0,persianized:0,bySource:{},duplicatesByCity:{},duplicatesBySurname:{},duplicatesByEmailDomain:{},phoneTypes:{mobile:0,landline:0,unknown:0},countries:{}};
  (incoming||[]).forEach((row,index)=>{
    const src=sourceStats(report,row.source);src.rows++;report.persianized+=Number(row._persianized||0);inc(report.phoneTypes,row.phoneType||'unknown');inc(report.countries,row.country||'نامشخص');
    if(!row._valid||!row.phone){report.invalid++;src.invalid++;actions.push({type:'invalid',incoming:row,index});return}
    const exact=work.get(row.phone),emailOwner=row.email&&emailMap.get(cleanEmail(row.email)),old=exact||(emailOwner&&work.get(emailOwner));
    if(!old){const added={...row,isNew:true};work.set(added.phone,added);if(added.email)emailMap.set(cleanEmail(added.email),added.phone);report.added++;src.added++;actions.push({type:'add',incoming:row,after:added,index});return}
    report.duplicates++;src.duplicates++;inc(report.duplicatesByCity,row.city);inc(report.duplicatesBySurname,surnameOf(row));inc(report.duplicatesByEmailDomain,emailDomain(row.email));
    const mode=decisionFor(options.decisions,row,index)||defaultMode,after=smartMerge(old,row,mode),changed=JSON.stringify(old)!==JSON.stringify(after);
    if(changed&&mode!=='old'){report.updated++;src.updated++;work.delete(old.phone);work.set(after.phone,after);if(after.email)emailMap.set(cleanEmail(after.email),after.phone);actions.push({type:'update',mode,before:old,incoming:row,after,index})}
    else actions.push({type:'skip',mode,before:old,incoming:row,after:old,index});
  });
  const records=[...work.values()].sort((a,b)=>String(a.city||'').localeCompare(String(b.city||''),'fa')||String(a.name||'').localeCompare(String(b.name||''),'fa')).map((row,index)=>({...row,rowNumber:index+1}));
  return {version:VERSION,dryRun:!!options.dryRun,actions,records,newRecords:actions.filter(a=>a.type==='add').map(a=>a.after),report};
}
function compareRecords(oldRows,newRows){
  const oldMap=new Map((oldRows||[]).map(x=>[x.phone,x])),added=[],duplicates=[],changed=[];
  for(const row of newRows||[]){const old=oldMap.get(row.phone);if(!old)added.push(row);else{duplicates.push(row);if(JSON.stringify(old)!==JSON.stringify(smartMerge(old,row,'new')))changed.push({before:old,after:row})}}
  return {added,duplicates,changed,summary:{old:(oldRows||[]).length,incoming:(newRows||[]).length,added:added.length,duplicates:duplicates.length,changed:changed.length}};
}
function renumber(rows){return (rows||[]).map((row,index)=>({...row,rowNumber:index+1}))}
function parseVCard(text){
  const unfolded=String(text||'').replace(/\r?\n[ \t]/g,''),cards=unfolded.split(/END:VCARD/i),out=[];
  for(const card of cards){if(!/BEGIN:VCARD/i.test(card))continue;const pick=name=>{const m=card.match(new RegExp('^'+name+'(?:;[^:]*)?:(.*)$','im'));return cleanText(m?.[1]||'').replace(/\\n/g,' ')};const name=pick('FN')||pick('N').split(';').filter(Boolean).reverse().join(' '),phones=[...card.matchAll(/^TEL(?:;[^:]*)?:(.*)$/gim)].map(m=>cleanText(m[1]));for(const phone of phones)out.push({name,phone,email:pick('EMAIL'),company:pick('ORG'),note:pick('NOTE')})}
  return out;
}
function xmlDecode(s){return String(s??'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'")}
function parseSpreadsheetXml(text){
  const rows=[];for(const row of String(text||'').matchAll(/<Row\b[^>]*>([\s\S]*?)<\/Row>/gi)){const cells=[];let cursor=0;for(const cell of row[1].matchAll(/<Cell\b([^>]*)>([\s\S]*?)<\/Cell>/gi)){const index=cell[1].match(/(?:ss:)?Index="(\d+)"/i);if(index)cursor=Number(index[1])-1;const data=cell[2].match(/<Data\b[^>]*>([\s\S]*?)<\/Data>/i);cells[cursor++]=xmlDecode(data?.[1]||'').replace(/<[^>]+>/g,'')}rows.push(cells)}return rows;
}
function csvCell(value){const raw=String(value??''),s=/^[=+\-@\t\r]/.test(raw)?`'${raw}`:raw;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function reportRows(report){
  const rows=[['شاخص','مقدار'],['کل ورودی',report.total],['جدید',report.added],['بروزرسانی',report.updated],['تکراری',report.duplicates],['نامعتبر',report.invalid],['فارسی‌سازی',report.persianized]];
  for(const [source,s] of Object.entries(report.bySource||{}))rows.push([`منبع: ${source}`,`جدید ${s.added} | بروزرسانی ${s.updated} | تکراری ${s.duplicates} | نامعتبر ${s.invalid}`]);
  for(const [city,count] of Object.entries(report.duplicatesByCity||{}))rows.push([`تکراری شهر: ${city}`,count]);
  for(const [surname,count] of Object.entries(report.duplicatesBySurname||{}))rows.push([`تکراری نام خانوادگی: ${surname}`,count]);
  for(const [domain,count] of Object.entries(report.duplicatesByEmailDomain||{}))rows.push([`تکراری دامنه: ${domain}`,count]);return rows;
}
function reportCsv(report){return '\ufeff'+reportRows(report).map(row=>row.map(csvCell).join(',')).join('\r\n')}

return {VERSION,CITY_ALIASES,IRAN_AREA_CODES,COUNTRIES,latinDigits,persianDigits,cleanText,keyText,cityFromAlias,inferCityFromFilename,transliterateToPersian,persianize,countryForPhone,normalizePhone,classifyPhone,validatePhone,cleanEmail,emailDomain,surnameOf,companyFromName,resolveColumns,rowToObject,normalizeRecord,smartMerge,planMerge,compareRecords,renumber,parseVCard,parseSpreadsheetXml,reportRows,reportCsv};
});
