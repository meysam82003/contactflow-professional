'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const tools=require('../web/legacy-tools.js');

test('legacy text conversion normalizes, names and removes duplicates',()=>{
  const rows=tools.parseText('Ali,09121234567\nSara;09351234567\nCopy,0098 912 123 4567',{mode:'plus98',source:'V14'});
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>row.phone),['+989121234567','+989351234567']);
  assert.equal(rows[0].name,'Ali');
});

test('legacy engine supports all prefix modes, chunks and unicode hex',()=>{
  assert.equal(tools.normalizePhone('09121234567','local0'),'09121234567');
  assert.equal(tools.normalizePhone('09121234567','0098'),'00989121234567');
  assert.equal(tools.normalizePhone('09121234567','bare98'),'989121234567');
  assert.equal(tools.chunks([1,2,3,4,5],2).length,3);
  const encoded=tools.textToHex('سلام ContactFlow');
  assert.equal(tools.hexToText(encoded),'سلام ContactFlow');
});
