'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const bulk=require('../web/bulk-vcf-export.js');

test('keeps Persian spaces, suffix and numeric part in deterministic filenames',()=>{
  assert.equal(bulk.cleanToken('  ابرکوه   یزد  '),'ابرکوه یزد');
  assert.equal(bulk.composeBaseName('contacts','تهران','ایرانسل',true),'تهران ایرانسل');
  assert.equal(bulk.partName('تهران ایرانسل',1,'vcf'),'تهران ایرانسل_0001.vcf');
  assert.equal(bulk.partName(bulk.composeBaseName('contacts','قم','جدید',true),27,'vcf'),'قم جدید_0027.vcf');
});

test('plans at most one million contacts without allocating the full dataset',()=>{
  assert.equal(bulk.MAX_TOTAL,1_000_000);
  assert.deepEqual(bulk.planParts(1_000_000,100_000),{requested:1_000_000,total:1_000_000,chunk:100_000,parts:10,truncated:false});
  assert.deepEqual(bulk.planParts(1_500_000,100_000),{requested:1_500_000,total:1_000_000,chunk:100_000,parts:10,truncated:true});
});

test('builds UTF-8 VCF in bounded text blocks and escapes contact fields',async()=>{
  const rows=Array.from({length:5_000},(_,index)=>({name:`آبادان ${index+1}`,phone:`+9891200${String(index).padStart(4,'0')}`,city:'آبادان',section:'جدید',source:'ایرانسل, تست'}));
  const blob=bulk.makeVcfBlob(rows,{blockSize:500});
  const text=await blob.text();
  assert.equal(blob.type,'text/vcard;charset=utf-8');
  assert.equal((text.match(/BEGIN:VCARD/g)||[]).length,5_000);
  assert.match(text,/FN:آبادان 1/);
  assert.match(text,/NOTE:آبادان \| جدید \| ایرانسل\\, تست/);
  assert.ok(blob.size>250_000);
});

test('selects offline first and exposes the compatible fallback contract',()=>{
  assert.equal(bulk.resolveEngine({offline:true,compatible:true,moduleAvailable:true}),'offline');
  assert.equal(bulk.resolveEngine({offline:true,compatible:true,moduleAvailable:false}),'fallback');
  assert.equal(bulk.resolveEngine({offline:false,compatible:true,moduleAvailable:false}),'compatible');
  assert.throws(()=>bulk.resolveEngine({offline:false,compatible:false,moduleAvailable:true}),/هیچ موتور/);
});

test('Mini App build excludes the million-contact module and advanced controls',()=>{
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'contactflow-miniapp-'));
  try{
    const result=spawnSync(process.execPath,['scripts/build-miniapp.mjs','web',output],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
    assert.equal(result.status,0,result.stderr||result.stdout);
    const html=fs.readFileSync(path.join(output,'miniapp.html'),'utf8');
    const sw=fs.readFileSync(path.join(output,'sw.js'),'utf8');
    assert.doesNotMatch(html,/bulk-vcf-export\.js|export-max-total|export-offline|cancel-export/);
    assert.doesNotMatch(sw,/bulk-vcf-export\.js/);
    assert.match(html,/contactflowMiniapp="true"/);
    assert.equal(fs.existsSync(path.join(output,'bulk-vcf-export.js')),false);
  }finally{fs.rmSync(output,{recursive:true,force:true});}
});

