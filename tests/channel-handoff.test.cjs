'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const handoff=require('../web/channel-handoff.js');

const contacts=[{name:'علی',phone:'+989121234567',city:'تهران',province:'تهران',operator:'همراه اول'}];

test('promotional queue contains only explicit opt-in contacts',()=>{
  const flags=[{phone:'+989121234567',status:'optin'},{phone:'+989351234567',status:'existing_chat'}];
  assert.equal(handoff.eligibleContacts(contacts,flags,{purpose:'promotional'}).length,1);
  assert.equal(handoff.eligibleContacts(contacts,flags,{purpose:'service'})[0].consentStatus,'optin');
});

test('builds official WhatsApp click-to-chat and Telegram share handoffs',()=>{
  const wa=handoff.buildHandoff('whatsapp',contacts[0],'سلام {name}');
  assert.match(wa.url,/^https:\/\/wa\.me\/989121234567\?text=/);
  assert.equal(wa.requiresConfirmation,true);
  const tg=handoff.buildHandoff('telegram',contacts[0],'سلام',{shareUrl:'https://example.test'});
  assert.match(tg.url,/^https:\/\/t\.me\/share\/url\?/);
});

test('unknown messenger uses configured template or copy-and-open fallback',()=>{
  const configured=handoff.buildHandoff('bale',contacts[0],'پیام',{urlTemplate:'https://example.test/{phone}?text={text}'});
  assert.equal(configured.mode,'configured-template');
  assert.match(handoff.buildHandoff('rubika',contacts[0],'پیام').url,/rubika/);
});

test('queue export prevents spreadsheet formula injection',()=>{
  const rows=[{...contacts[0],name:'=cmd',consentStatus:'optin'}];
  const csv=handoff.queueCsv(rows,'whatsapp','سلام {name}');
  assert.match(csv,/'=cmd/);
  assert.match(csv,/pending_manual_confirmation/);
});
