'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../web/contact-export.js');

const rows=[
  {telegramId:'2',name:'بهار',phone:'+989121111111',username:'bahar',isMutual:true,source:'telegram-contacts'},
  {telegramId:'1',name:'آرمان',phone:'+989122222222',username:'arman',source:'telegram-contacts'},
  {telegramId:'2',name:'Duplicate',phone:'+989121111111',username:'bahar'},
  {telegramId:'3',name:'No Phone',phone:'',username:'nophone'}
];

test('deduplicates by Telegram ID and phone',()=>{
  const out=api.dedupeRecords(rows);
  assert.equal(out.length,3);
  assert.deepEqual(out.map(row=>row.telegramId),['2','1','3']);
});

test('filters, searches and sorts records',()=>{
  const filtered=api.filterRecords(rows,{query:'arman',includeWithoutPhone:true});
  assert.equal(filtered.length,1);
  assert.equal(filtered[0].telegramId,'1');
  const sorted=api.sortRecords(api.dedupeRecords(rows),'telegramId','asc');
  assert.deepEqual(sorted.map(row=>row.telegramId),['1','2','3']);
});

test('excludes missing phones when requested',()=>{
  assert.equal(api.filterRecords(rows,{includeWithoutPhone:false}).length,2);
});

test('CSV escapes cells and VCF contains Telegram fields',()=>{
  const record=api.normalizeRecord({telegramId:'9',name:'نام، نمونه',phone:'+989123456789',username:'sample'});
  const csv=api.serializeCSV([{...record,name:'A, "B"'}],{fields:['name','phone']});
  assert.match(csv,/"A, ""B"""/);
  const vcf=api.serializeVCF([record]);
  assert.match(vcf,/X-TELEGRAM-ID:9/);
  assert.match(vcf,/URL:https:\/\/t\.me\/sample/);
});

test('neutralizes spreadsheet formulas in CSV and XLS exports',()=>{
  const record=api.normalizeRecord({telegramId:'10',name:'=HYPERLINK("https://example.test")',phone:'+989123456789'});
  const csv=api.serializeCSV([record],{fields:['name','phone']});
  assert.match(csv,/"'=HYPERLINK/);
  assert.match(csv,/'\+989123456789/);
  const xls=api.serializeXLS([record],{fields:['name']});
  assert.match(xls,/&#39;=HYPERLINK/);
});

test('builds deterministic chunked export plan',()=>{
  const plan=api.buildExportPlan(rows,{format:'json',chunkSize:2,baseName:'telegram / contacts',includeWithoutPhone:true});
  assert.equal(plan.length,2);
  assert.equal(plan[0].name,'telegram___contacts_0001.json');
  assert.equal(plan[0].count,2);
  assert.equal(plan[1].count,1);
});
