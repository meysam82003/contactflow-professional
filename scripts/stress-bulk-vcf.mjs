import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const bulk=require('../web/bulk-vcf-export.js');
const total=bulk.MAX_TOTAL;
const chunk=10_000;
const plan=bulk.planParts(total,chunk);
let built=0,bytes=0;

for(let part=0;part<plan.parts;part++){
  const count=Math.min(chunk,total-built);
  const rows=Array.from({length:count},(_,index)=>{
    const number=built+index;
    return {name:`تهران ${number+1}`,phone:`+989${String(number).padStart(9,'0').slice(-9)}`,city:'تهران',source:'Stress Test'};
  });
  const blob=bulk.makeVcfBlob(rows);
  if(blob.size<=count*70)throw new Error(`VCF part ${part+1} is unexpectedly small`);
  bytes+=blob.size;built+=count;
}

if(built!==1_000_000||plan.parts!==100)throw new Error(`Million-contact contract failed: ${built}/${plan.parts}`);
console.log(JSON.stringify({contacts:built,parts:plan.parts,chunk,bytes}));
