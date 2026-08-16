'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const Backup=require('../web/backup-engine.js');

test('backup v9 preserves Blob and structured values and verifies SHA-256',async()=>{
  const stores={contacts:[{
    phone:'+989121234567',name:'تهران ایرانسل',createdAt:new Date('2026-08-17T00:00:00.000Z'),
    media:new Blob([new Uint8Array([0,1,2,250,255])],{type:'application/octet-stream'}),
    bytes:new Uint16Array([12,65530]),large:12345678901234567890n,optional:undefined,score:NaN
  }],settings:[]};
  const data=await Backup.createBackupFromStores(stores,{note:'قبل از ورود'});
  const report=await Backup.inspect(data,{requiredStores:['contacts','settings']});
  assert.equal(report.totalRecords,1);
  assert.equal(report.blobCount,1);
  assert.match(data.integrity.sha256,/^[a-f0-9]{64}$/);
  const warnings=[];
  const row=Backup.decodeValue(data.stores.contacts[0],warnings);
  assert.equal(row.name,'تهران ایرانسل');
  assert.equal(row.createdAt.toISOString(),'2026-08-17T00:00:00.000Z');
  assert.deepEqual([...new Uint8Array(await row.media.arrayBuffer())],[0,1,2,250,255]);
  assert.deepEqual([...row.bytes],[12,65530]);
  assert.equal(row.large,12345678901234567890n);
  assert.ok('optional' in row);
  assert.ok(Number.isNaN(row.score));
  assert.deepEqual(warnings,[]);
});

test('backup inspection rejects a changed payload before restore',async()=>{
  const data=await Backup.createBackupFromStores({contacts:[{phone:'+989121234567'}]});
  data.stores.contacts[0].phone='+989999999999';
  await assert.rejects(()=>Backup.inspect(data,{requiredStores:['contacts']}),/Checksum/);
});

test('binary backup round-trip stays exact across Base64 chunk boundaries',async()=>{
  const source=new Uint8Array(100000);for(let index=0;index<source.length;index++)source[index]=(index*131+17)&255;
  const data=await Backup.createBackupFromStores({artifacts:[{payload:new Blob([source])}]});
  const restored=new Uint8Array(await Backup.decodeValue(data.stores.artifacts[0],[]).payload.arrayBuffer());
  assert.deepEqual(restored,source);
});

test('legacy backup is readable with an explicit binary-data warning',async()=>{
  const legacy={format:'ContactFlowBackup',version:8,appVersion:'3.6.0',createdAt:'2026-08-17T00:00:00.000Z',stores:{contacts:[{phone:'+989121234567',avatar:{__blob:true,type:'image/png',size:20}}]}};
  const report=await Backup.inspect(legacy,{requiredStores:['contacts']});
  assert.equal(report.totalRecords,1);
  assert.ok(report.warnings.some(item=>item.includes('قدیمی')));
  const warnings=[];
  const decoded=Backup.decodeValue(legacy.stores.contacts[0],warnings);
  assert.equal(decoded.avatar,null);
  assert.ok(warnings.some(item=>item.includes('قابل بازیابی نیست')));
});
