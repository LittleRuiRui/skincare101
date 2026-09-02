import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAllProducts,routeAliases} from '../scripts/product-selection.mjs';
const row=(n,extra={})=>({id:'aaaaaaaa-aaaa-aaaa-aaaa-'+String(n).padStart(12,'0'),brand:'Same brand',name:'Same name',...extra});
test('all products survive without score, brand or total limits',()=>{
 const rows=Array.from({length:1205},(_,i)=>row(i));
 const selected=selectAllProducts(rows);
 assert.equal(selected.length,1205);
 assert.equal(new Set(selected.map(p=>p.__slug)).size,1205);
 const reversed=selectAllProducts([...rows].reverse());
 assert.deepEqual(selected.map(p=>p.__slug),reversed.map(p=>p.__slug));
});
test('published routes stay stable and all new variants get distinct routes',()=>{
 for(const [id,slug] of Object.entries(routeAliases))assert.equal(selectAllProducts([row(0,{id})])[0].__slug,slug);
 const before=selectAllProducts([row(1)])[0].__slug;
 const after=selectAllProducts([row(2),row(1)])[0].__slug;
 assert.equal(before,after);
 assert.match(selectAllProducts([row(3,{brand:'品牌',name:'产品'})])[0].__slug,/^product-/);
});
test('bad or duplicate identities fail instead of silently dropping products',()=>{
 assert.throws(()=>selectAllProducts([row(1),row(1)]),/duplicate/i);
 assert.throws(()=>selectAllProducts([row(1,{name:''})]),/identity/i);
});

