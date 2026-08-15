/* ContactFlow 3.5 consent-aware handoff/export engine. It never bypasses messenger sessions. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ContactFlowChannelHandoff=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='3.5.0';
const CHANNELS=Object.freeze({
  telegram:{label:'تلگرام',supportsDirectPhone:false,officialShare:true,home:'https://web.telegram.org/'},
  whatsapp:{label:'واتساپ',supportsDirectPhone:true,officialShare:true,home:'https://web.whatsapp.com/'},
  rubika:{label:'روبیکا',supportsDirectPhone:false,officialShare:false,home:'https://web.rubika.ir/'},
  bale:{label:'بله',supportsDirectPhone:false,officialShare:false,home:'https://web.bale.ai/'},
  soroush:{label:'سروش پلاس',supportsDirectPhone:false,officialShare:false,home:'https://web.splus.ir/'}
});
function clean(value){return String(value??'').trim()}
function digits(phone){return clean(phone).replace(/\D/g,'').replace(/^00/,'')}
function renderTemplate(template,row={}){return clean(template).replace(/\{(name|phone|city|province|operator|source)\}/g,(_,key)=>clean(row[key]))}
function buildHandoff(channel,row,message,settings={}){
  const item=CHANNELS[channel];if(!item)throw new Error('کانال ناشناخته است.');const text=renderTemplate(message,row),phone=digits(row?.phone),custom=clean(settings.urlTemplate);
  if(custom){const url=custom.replace(/\{phone\}/g,encodeURIComponent(phone)).replace(/\{text\}/g,encodeURIComponent(text));return {channel,url,text,mode:'configured-template',requiresConfirmation:true}}
  if(channel==='whatsapp'&&phone)return {channel,url:`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,text,mode:'official-click-to-chat',requiresConfirmation:true};
  if(channel==='telegram')return {channel,url:`https://t.me/share/url?url=${encodeURIComponent(clean(settings.shareUrl))}&text=${encodeURIComponent(text)}`,text,mode:'official-share-picker',requiresConfirmation:true};
  return {channel,url:item.home,text,mode:'copy-and-open',requiresConfirmation:true};
}
function eligibleContacts(contacts,flags,{purpose='promotional'}={}){const map=new Map((flags||[]).map(x=>[x.phone,x.status]));return (contacts||[]).filter(row=>{const status=map.get(row.phone);return purpose==='promotional'?status==='optin':status==='optin'||status==='existing_chat'}).map(row=>({...row,consentStatus:map.get(row.phone)}))}
function csvCell(value){const raw=clean(value),safe=/^[=+\-@\t\r]/.test(raw)?`'${raw}`:raw;return /[",\r\n]/.test(safe)?`"${safe.replace(/"/g,'""')}"`:safe}
function queueCsv(rows,channel,template){const header=['channel','phone','name','city','province','operator','consent_status','message','status'];return '\ufeff'+[header,...rows.map(row=>[channel,row.phone,row.name,row.city,row.province,row.operator,row.consentStatus,renderTemplate(template,row),'pending_manual_confirmation'])].map(row=>row.map(csvCell).join(',')).join('\r\n')}
return {VERSION,CHANNELS,clean,digits,renderTemplate,buildHandoff,eligibleContacts,queueCsv};
});
