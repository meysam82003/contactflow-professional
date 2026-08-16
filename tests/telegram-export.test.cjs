'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const telegram=require('../web/telegram-export.js');

test('official Telegram Desktop result.json contacts are parsed without API credentials',()=>{
  const result=telegram.parseJson({about:'Telegram Desktop',contacts:{about:'Contacts',list:[
    {first_name:'Ali',last_name:'Ahmadi',phone_number:'+98 912 123 4567',date:'2026-01-01'},
    {first_name:'Sara',last_name:'Karimi',phone_number:'0935-111-2233'},
    {first_name:'Duplicate',phone_number:'0098 912 123 4567'}
  ]}});
  assert.equal(result.length,2);
  assert.deepEqual(result.map(row=>row.phone),['+989121234567','+989351112233']);
  assert.equal(result[0].telegramStatus,'exported');
  assert.equal(result[0].source,'Telegram Desktop Export');
});

test('Telegram contacts can be emitted as portable CSV and VCF',()=>{
  const rows=[{name:'Ali, Test',phone:'+989121234567',username:'ali'}];
  assert.match(telegram.toCsv(rows),/"Ali, Test"/);
  assert.match(telegram.toVcf(rows),/BEGIN:VCARD\r\nVERSION:3\.0/);
  assert.match(telegram.toVcf(rows),/TEL;TYPE=CELL:\+989121234567/);
});
