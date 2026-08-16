/* ContactFlow 3.5 offline Iran location and original mobile-network inference. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ContactFlowLocationOperator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='3.5.0';
const DIGITS={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
const PROVINCES={
  'آذربایجان شرقی':['تبریز:tabriz','مراغه:maragheh,maragha','مرند:marand','اهر:ahar','میانه:mianeh,miyaneh','بناب:bonab','شبستر:shabestar'],
  'آذربایجان غربی':['ارومیه:urmia,orumiyeh,urumiyeh','خوی:khoy','مهاباد:mahabad','بوکان:bukan,bookan','میاندوآب:miandoab,miyandoab','سلماس:salmas','نقده:naghadeh,naqadeh'],
  'اردبیل':['اردبیل:ardabil,ardebil','مشگین‌شهر:meshginshahr,meshkinshahr','پارس‌آباد:parsabad','خلخال:khalkhal'],
  'اصفهان':['اصفهان:isfahan,esfahan','کاشان:kashan','نجف‌آباد:najafabad','خمینی‌شهر:khomeinishahr','شاهین‌شهر:shahinshahr','فولادشهر:fooladshahr','گلپایگان:golpayegan','نطنز:natanz'],
  'البرز':['کرج:karaj','فردیس:fardis','نظرآباد:nazarabad','هشتگرد:hashtgerd','محمدشهر:mohammadshahr'],
  'ایلام':['ایلام:ilam','دهلران:dehloran','ایوان:eyvan','آبدانان:abdanan'],
  'بوشهر':['بوشهر:bushehr,boushehr','برازجان:borazjan','گناوه:genaveh','کنگان:kangan','عسلویه:asalouyeh,assaluyeh'],
  'تهران':['تهران:tehran,theran','ری:rey,ray','ورامین:varamin','شهریار:shahriar','اسلامشهر:eslamshahr,islamshahr','پردیس:pardis','دماوند:damavand','رباط‌کریم:robatkarim','قدس:qods,ghods'],
  'چهارمحال و بختیاری':['شهرکرد:shahrekord,shahrkord','بروجن:borujen','فارسان:farsan','لردگان:lordegan'],
  'خراسان جنوبی':['بیرجند:birjand','قائن:qaen,ghain','طبس:tabas','فردوس:ferdows'],
  'خراسان رضوی':['مشهد:mashhad,mashad','نیشابور:neyshabur,nishapur','سبزوار:sabzevar','تربت حیدریه:torbatheydarieh','قوچان:quchan,ghuchan','کاشمر:kashmar'],
  'خراسان شمالی':['بجنورد:bojnurd','شیروان:shirvan','اسفراین:esfarayen','جاجرم:jajarm'],
  'خوزستان':['اهواز:ahvaz','آبادان:abadan','خرمشهر:khorramshahr','دزفول:dezful','اندیمشک:andimeshk','ماهشهر:mahshahr','شوشتر:shushtar','بهبهان:behbahan','ایذه:izeh'],
  'زنجان':['زنجان:zanjan','ابهر:abhar','خرمدره:khorramdarreh','قیدار:qeydar'],
  'سمنان':['سمنان:semnan','شاهرود:shahroud','دامغان:damghan','گرمسار:garmsar'],
  'سیستان و بلوچستان':['زاهدان:zahedan','چابهار:chabahar','ایرانشهر:iranshahr','زابل:zabol','سراوان:saravan','خاش:khash'],
  'فارس':['شیراز:shiraz','مرودشت:marvdasht','جهرم:jahrom','فسا:fasa','کازرون:kazerun','لار:lar','داراب:darab','صدرا:sadra'],
  'قزوین':['قزوین:qazvin,ghazvin','تاکستان:takestan','آبیک:abyek','الوند:alvand'],
  'قم':['قم:qom,ghom'],
  'کردستان':['سنندج:sanandaj','سقز:saqqez,saghez','مریوان:marivan','بانه:baneh','قروه:ghorveh,qorveh'],
  'کرمان':['کرمان:kerman','رفسنجان:rafsanjan','سیرجان:sirjan','جیرفت:jiroft','بم:bam','زرند:zarand'],
  'کرمانشاه':['کرمانشاه:kermanshah','اسلام‌آباد غرب:eslamabadgharb','پاوه:paveh','جوانرود:javanrud'],
  'کهگیلویه و بویراحمد':['یاسوج:yasuj','دوگنبدان:dogonbadan','دهدشت:dehdasht'],
  'گلستان':['گرگان:gorgan','گنبد کاووس:gonbadkavus,gonbad','علی‌آباد کتول:alikotul','آق‌قلا:aqqala'],
  'گیلان':['رشت:rasht','انزلی:anzali,bandaranzali','لاهیجان:lahijan','لنگرود:langarud','رودسر:rudsar','تالش:talesh','فومن:fuman'],
  'لرستان':['خرم‌آباد:khorramabad','بروجرد:borujerd','دورود:dorud','الیگودرز:aligudarz','کوهدشت:kuhdasht'],
  'مازندران':['ساری:sari','بابل:babol','آمل:amol','قائم‌شهر:qaemshahr,ghaemshahr','چالوس:chalus','نوشهر:noshahr','تنکابن:tonkabon','رامسر:ramsar','بابلسر:babolsar'],
  'مرکزی':['اراک:arak','ساوه:saveh','خمین:khomein','محلات:mahalat','دلیجان:delijan'],
  'هرمزگان':['بندرعباس:bandarabbas','قشم:qeshm','کیش:kish','میناب:minab','بندرلنگه:bandarlangeh','جاسک:jask'],
  'همدان':['همدان:hamedan,hamadan','ملایر:malayer','نهاوند:nahavand','تویسرکان:tuyserkan','کبودرآهنگ:kabudarahang'],
  'یزد':['یزد:yazd','میبد:maybod','اردکان:ardakan','بافق:bafq','ابرکوه:abarkuh']
};

function text(value){return String(value??'').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200e\u200f\ufeff]/g,' ').replace(/\s+/g,' ').trim()}
function latin(value){return text(value).replace(/[۰-۹٠-٩]/g,c=>DIGITS[c]||c).toLowerCase().replace(/[^a-z0-9]+/g,'')}
function persianKey(value){return text(value).replace(/[^\u0600-\u06ff0-9]+/g,'')}
const LOCATIONS=[];
for(const [province,items] of Object.entries(PROVINCES))for(const item of items){const [city,raw='']=item.split(':');const aliases=[city,...raw.split(',').filter(Boolean)];LOCATIONS.push({city,province,aliases,latinAliases:aliases.map(latin).filter(Boolean),persianAliases:aliases.map(persianKey).filter(Boolean)})}
const PROVINCE_ALIASES={
  tehran:'تهران',alborz:'البرز',qom:'قم',fars:'فارس',esfahan:'اصفهان',isfahan:'اصفهان',khuzestan:'خوزستان',mazandaran:'مازندران',gilan:'گیلان',golestan:'گلستان',kerman:'کرمان',kermanshah:'کرمانشاه',yazd:'یزد',semnan:'سمنان',zanjan:'زنجان',qazvin:'قزوین',ardabil:'اردبیل',bushehr:'بوشهر',hormozgan:'هرمزگان',lorestan:'لرستان',kordestan:'کردستان',kurdistan:'کردستان',hamedan:'همدان',hamadan:'همدان',markazi:'مرکزی',ilam:'ایلام'
};

function inferLocation(value){
  const raw=text(value),lk=latin(raw),pk=persianKey(raw);if(!raw)return {city:'',province:'',confidence:0,matchedAlias:''};
  let best=null;
  for(const row of LOCATIONS){for(const alias of row.latinAliases){if(!alias)continue;const exact=lk===alias,contains=!exact&&lk.includes(alias);if(exact||contains){const score=(exact?100:75)+Math.min(alias.length,20);if(!best||score>best.score)best={...row,score,matchedAlias:alias}}}for(const alias of row.persianAliases){if(!alias)continue;const exact=pk===alias,contains=!exact&&pk.includes(alias);if(exact||contains){const score=(exact?105:80)+Math.min(alias.length,20);if(!best||score>best.score)best={...row,score,matchedAlias:alias}}}}
  if(best)return {city:best.city,province:best.province,confidence:best.score>=100?1:.82,matchedAlias:best.matchedAlias};
  const province=Object.entries(PROVINCE_ALIASES).find(([alias])=>lk.includes(alias))?.[1]||Object.keys(PROVINCES).find(p=>pk.includes(persianKey(p)))||'';
  return {city:'',province,confidence:province?0.8:0,matchedAlias:province};
}
function provinceForCity(value){return inferLocation(value).province}

const PREFIX_RULES=[
  {operator:'همراه اول',prefixes:['910','911','912','913','914','915','916','917','918','919','990','991','992','993','994']},
  {operator:'ایرانسل',prefixes:['900','901','902','903','904','905','930','933','935','936','937','938','939']},
  {operator:'رایتل',prefixes:['920','921','922']},
  {operator:'شاتل موبایل',prefixes:['998']}
];
function nationalMobile(phone){let d=String(phone??'').replace(/[۰-۹٠-٩]/g,c=>DIGITS[c]||c).replace(/\D/g,'');if(d.startsWith('0098'))d=d.slice(4);else if(d.startsWith('98'))d=d.slice(2);else if(d.startsWith('0'))d=d.slice(1);return /^9\d{9}$/.test(d)?d:''}
function detectOperator(phone){const mobile=nationalMobile(phone);if(!mobile)return {operator:'نامشخص',prefix:'',confidence:0,note:'شماره موبایل ایران نیست'};const prefix=mobile.slice(0,3),rule=PREFIX_RULES.find(item=>item.prefixes.includes(prefix));return {operator:rule?.operator||'سایر اپراتورها',prefix:'0'+prefix,confidence:rule?0.9:0.45,note:'اپراتور اولیه پیش‌شماره؛ به‌دلیل ترابردپذیری ممکن است اپراتور فعلی متفاوت باشد'} }
function resolveSource(phone,policy={}){const mode=policy.mode||'auto';if(mode==='fixed')return text(policy.fixedSource)||'نامشخص';if(mode==='keep')return text(policy.existing)||text(policy.fallback)||'Import';const detected=detectOperator(phone);return detected.operator==='نامشخص'?(text(policy.fallback)||'نامشخص'):detected.operator}

return {VERSION,PROVINCES,LOCATIONS,PREFIX_RULES,text,latin,persianKey,inferLocation,provinceForCity,nationalMobile,detectOperator,resolveSource};
});
