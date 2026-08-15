'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const location=require('../web/location-operator.js');
const engine=require('../web/import-merge.js');

test('detects Iranian city and province from English filename and free text',()=>{
  assert.deepEqual(location.inferLocation('customers_BandarAbbas_02.csv'),{city:'بندرعباس',province:'هرمزگان',confidence:.82,matchedAlias:'bandarabbas'});
  assert.equal(location.inferLocation('Address: Mashhad, Iran').province,'خراسان رضوی');
  assert.equal(location.provinceForCity('نجف آباد'),'اصفهان');
});

test('normalization fills city, province and original prefix operator',()=>{
  const row=engine.normalizeRecord({name:'Ali',phone:'09121234567',address:'Tehran'},{filename:'unknown.csv',source:'legacy'});
  assert.equal(row.city,'تهران');
  assert.equal(row.province,'تهران');
  assert.equal(row.operator,'همراه اول');
  assert.equal(row.source,'legacy');
});

test('saved source policy applies fixed or automatic source to every row',()=>{
  const auto=engine.normalizeRecord({phone:'09351234567'},{source:'file.csv',sourcePolicy:{mode:'auto'}});
  const fixed=engine.normalizeRecord({phone:'09121234567'},{source:'file.csv',sourcePolicy:{mode:'fixed',fixedSource:'ایرانسل'}});
  assert.equal(auto.source,'ایرانسل');
  assert.equal(fixed.source,'ایرانسل');
});

test('operator result warns that mobile number portability can change current network',()=>{
  const result=location.detectOperator('+989121234567');
  assert.equal(result.operator,'همراه اول');
  assert.match(result.note,/ترابردپذیری/);
});
