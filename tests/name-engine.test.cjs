'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const names=require('../web/name-engine.js');

test('name engine renames the exact requested count, not only the first row',()=>{
  const rows=Array.from({length:12},(_,index)=>({phone:`+989120000${String(index).padStart(3,'0')}`,name:`قدیمی ${index}`,city:'تهران',province:'تهران',operator:'همراه اول',source:'Import'}));
  const plan=names.planNames(rows,{template:'{city} {operator} {n:0000}',start:7,limit:10});
  assert.equal(plan.changed,10);
  assert.equal(plan.total,12);
  assert.equal(plan.changes[0].name,'تهران همراه اول 0007');
  assert.equal(plan.changes[9].name,'تهران همراه اول 0016');
  assert.equal(new Set(plan.changes.map(change=>change.name)).size,10);
});

test('name templates support old names, source and phone suffix',()=>{
  const value=names.renderTemplate('{old} • {source} • {phone:last4}',{name:'علی رضایی',source:'ایرانسل',phone:'+989351234567'},1);
  assert.equal(value,'علی رضایی • ایرانسل • 4567');
});

test('adjacent template tokens always receive a readable word boundary',()=>{
  assert.equal(names.renderTemplate('{city}{province}',{city:'ابرکوه',province:'یزد'},1),'ابرکوه یزد');
  assert.equal(names.renderTemplate('{city}\u200c{n:000}',{city:'ابرکوه'},7),'ابرکوه 007');
});
