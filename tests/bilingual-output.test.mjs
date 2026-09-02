import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {articles} from '../data/blog-articles.mjs';
import {translations} from '../data/blog-articles-en.mjs';
const origin='https://peacedskin.com';
const read=route=>fs.readFile(path.join('dist',route,'index.html'),'utf8');
const pairs=html=>[...html.matchAll(/data-pair="([^"]+)"/g)].map(m=>m[1]).sort();
test('all language pairs are self-canonical, reciprocally linked, and aligned for comparison',async()=>{
 const products=JSON.parse(await fs.readFile('dist/seo-products.json','utf8'));
 const routes=[['/products/','/en/products/'],['/blog/','/en/blog/'],...products.map(p=>[`/zh/product/${p.slug}/`,`/product/${p.slug}/`]),...articles.map(a=>[`/blog/${a.slug}/`,`/en/blog/${a.slug}/`])];
 for(const [zh,en] of routes){
  const pages=await Promise.all([read(zh),read(en)]);
  assert.deepEqual(pairs(pages[0]),pairs(pages[1]),zh);
  assert.equal(new Set(pairs(pages[0])).size,pairs(pages[0]).length,zh);
  for(const [i,html] of pages.entries()){
   assert.ok(html.includes(`rel="canonical" href="${origin}${i?en:zh}"`));
   assert.ok(html.includes(`hreflang="zh-Hans" href="${origin}${zh}"`));
   assert.ok(html.includes(`hreflang="en" href="${origin}${en}"`));
   assert.ok(html.includes(`data-alternate="${i?zh:en}"`));
   assert.ok(html.includes('<html lang="'+(i?'en':'zh-CN')+'">'));
   for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=new URL(m[1].replaceAll('&amp;','&'),origin+(i?en:zh));
    if(url.origin!==origin||url.search)continue;
    const file=path.join('dist',url.pathname,url.pathname.endsWith('/')?'index.html':'');
    await fs.access(file);
    if(url.hash){const target=await fs.readFile(file,'utf8');assert.ok(target.includes(`id="${url.hash.slice(1)}"`));}
   }
  }
 }
});
test('English articles retain full sections, translated prose and evidence',async()=>{
 assert.equal(translations.length,articles.length);
 for(const [i,a] of articles.entries()){
  const e=translations[i],html=await read(`/en/blog/${a.slug}/`);
  assert.equal(e.sections.length,a.sections.length);
  assert.ok(e.answer&&e.excerpt&&e.next);
  assert.doesNotMatch(JSON.stringify(e),/[\u3400-\u9fff]/);
  assert.ok(html.includes('AI-assisted writing and translation'));
  assert.ok(html.includes('not individually medically reviewed'));
  for(const section of e.sections){assert.ok(html.includes(section.heading.replaceAll('&','&amp;').replaceAll("'",'&#39;')));}
 }
});
test('Chinese product pages use the stored dictionary, while keeping unmatched originals',async()=>{
 const html=await read('/zh/product/la-roche-posay-cicaplast-baume-b5/');
 assert.ok(html.includes('甘油')||html.includes('泛醇'),'Expected existing dictionary translations');
 assert.ok(html.includes('成分词典'));
 const app=await fs.readFile('src/AppShell.tsx','utf8');
 assert.equal((app.match(/matchesProductRouteId\(p.id,id\)/g)||[]).length,2,'Both initial and back/forward routing must resolve raw catalog IDs');
});
