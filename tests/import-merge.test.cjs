'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../web/import-merge.js');

test('filename city inference and Persian phonetic fallback are deterministic',()=>{
  assert.equal(engine.inferCityFromFilename('Qom.txt'),'قم');
  assert.equal(engine.inferCityFromFilename('customers_isfahan_02.csv'),'اصفهان');
  assert.deepEqual(engine.persianize('Qom'),{value:'قم',changed:true,method:'dictionary'});
  assert.equal(engine.persianize('Meysam').value,'میثم');
});

test('phone cleanup returns E.164, country, type and Iranian fixed-line city',()=>{
  const mobile=engine.normalizePhone('۰۹۱۲ ۱۲۳-۴۵۶۷');
  assert.equal(mobile.e164,'+989121234567');
  assert.equal(mobile.country,'ایران');
  assert.deepEqual(engine.classifyPhone(mobile),{phoneType:'mobile',city:''});
  const qom=engine.normalizePhone('(025) ۳۷۷۷ ۱۲۳۴');
  assert.equal(qom.e164,'+982537771234');
  assert.deepEqual(engine.classifyPhone(qom),{phoneType:'landline',city:'قم'});
  const uk=engine.normalizePhone('+44 20 7946 0958');
  assert.equal(uk.countryCode,'GB');
  assert.equal(engine.validatePhone(uk).valid,true);
});

test('record normalization tags source, import, company and automatic note',()=>{
  const row=engine.normalizeRecord({name:'شرکت Example LLC',phone:'09121234567',email:'TEST@EXAMPLE.COM'},
    {filename:'Qom.txt',source:'Qom.txt',importId:'import-1',now:1700000000000});
  assert.equal(row.city,'قم');
  assert.equal(row.company,'شرکت Example LLC');
  assert.equal(row.email,'test@example.com');
  assert.deepEqual(row.sourceFiles,['Qom.txt']);
  assert.deepEqual(row.importIds,['import-1']);
  assert.match(row.importNote,/Qom\.txt/);
  assert.equal(row._valid,true);
});

test('smart merge fills blanks without overwriting old populated values',()=>{
  const existing=[{phone:'+989121234567',name:'علی',city:'تهران',email:'',source:'old.csv',sourceFiles:['old.csv'],importIds:['old'],telegramStatus:'unchecked',createdAt:1,updatedAt:1}];
  const incoming=[engine.normalizeRecord({name:'Ali New',phone:'0912 123 4567',email:'ali@example.com',city:'Qom'},
    {filename:'new.csv',source:'new.csv',importId:'new',now:2})];
  const plan=engine.planMerge(existing,incoming,{defaultMode:'smart',dryRun:true});
  assert.equal(plan.report.added,0);
  assert.equal(plan.report.duplicates,1);
  assert.equal(plan.report.updated,1);
  assert.equal(plan.records[0].name,'علی');
  assert.equal(plan.records[0].city,'تهران');
  assert.equal(plan.records[0].email,'ali@example.com');
  assert.deepEqual(plan.records[0].sourceFiles,['old.csv','new.csv']);
  assert.equal(plan.report.duplicatesByCity['قم'],1);
  assert.equal(plan.report.duplicatesByEmailDomain['example.com'],1);
});

test('manual old/new decision and new-only export contract work',()=>{
  const old=[{phone:'+989121234567',name:'قدیمی',city:'تهران',source:'a',createdAt:1,updatedAt:1}];
  const incoming=[engine.normalizeRecord({name:'جدید',phone:'09121234567',city:'قم'},{filename:'b.csv',source:'b',importId:'b',now:2})];
  assert.equal(engine.planMerge(old,incoming,{defaultMode:'old'}).records[0].name,'قدیمی');
  assert.equal(engine.planMerge(old,incoming,{defaultMode:'new'}).records[0].name,'جدید');
  const added=engine.normalizeRecord({name:'سارا',phone:'09351234567'},{filename:'c.csv',source:'c',importId:'c'});
  const plan=engine.planMerge(old,[...incoming,added],{defaultMode:'smart'});
  assert.equal(plan.newRecords.length,1);
  assert.equal(plan.newRecords[0].phone,'+989351234567');
});

test('VCF and SpreadsheetML XLS parsers read supported local formats',()=>{
  const vcf='BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Sara Test\r\nTEL;TYPE=CELL:09121234567\r\nEMAIL:sara@example.com\r\nEND:VCARD\r\n';
  assert.deepEqual(engine.parseVCard(vcf),[{name:'Sara Test',phone:'09121234567',email:'sara@example.com',company:'',note:''}]);
  const xml='<Workbook><Worksheet><Table><Row><Cell><Data>name</Data></Cell><Cell><Data>phone</Data></Cell></Row><Row><Cell><Data>Ali</Data></Cell><Cell><Data>0912</Data></Cell></Row></Table></Worksheet></Workbook>';
  assert.deepEqual(engine.parseSpreadsheetXml(xml),[['name','phone'],['Ali','0912']]);
});

test('report includes per-source and duplicate dimensions',()=>{
  const report={total:2,added:1,updated:0,duplicates:1,invalid:0,persianized:1,bySource:{'Qom.txt':{added:1,updated:0,duplicates:1,invalid:0}},duplicatesByCity:{قم:1},duplicatesBySurname:{احمدی:1},duplicatesByEmailDomain:{'example.com':1}};
  const csv=engine.reportCsv(report);
  for(const marker of ['Qom.txt','تکراری شهر: قم','احمدی','example.com'])assert.ok(csv.includes(marker));
});
