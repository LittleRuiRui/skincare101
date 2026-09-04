import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { articles, art, sources } from '../data/blog-articles.mjs';

test('PDRN safety update is paired, dated and linked to the exact cream',async()=>{
 const slug='pdrn-serum-vs-skin-booster-evidence';
 const product='medicube-pdrn-pink-collagen-capsule-cream-dca76bbb-9cd0-4995-9f0f-258ade4f043a';
 const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
 for(const en of [false,true]){
  const route=`${en?'/en':''}/blog/${slug}/`;
  const html=await fs.readFile(path.join('dist',route,'index.html'),'utf8');
  for(const batch of ['2E122I.2E117I','2E191G.2E193G'])assert.ok(html.includes(batch));
  assert.ok(html.includes(sources.hsaMedicube.url));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.datePublished,'2026-09-02');
  assert.equal(schema.dateModified,'2026-09-04');
  assert.ok(sitemap.includes(`<loc>https://peacedskin.com${route}</loc><lastmod>2026-09-04</lastmod>`));
  const productRoute=`${en?'':'/zh'}/product/${product}/`;
  assert.ok(html.includes(productRoute));
  const p=await fs.readFile(path.join('dist',productRoute,'index.html'),'utf8');
  assert.ok(p.includes(route));
  assert.ok(p.includes('2026-09-04'));
  assert.ok(p.includes('product=dca76bbb-9cd0-4995-9f0f-258ade4f043a'));
  assert.ok(p.includes(sources.hsaMedicube.url));
 }
});

test('fifteen complete, distinct articles with sources and related articles', () => {
  assert.equal(articles.length,15);
  assert.equal(new Set(articles.map(a=>a.slug)).size,15);
  assert.equal(new Set(articles.map(a=>a.title)).size,15);
  for(const a of articles) {
    assert.match(a.slug,/^[a-z0-9-]+$/);
    assert.ok(a.sections.length>=4,a.slug);
    const body=a.sections.map(s=>[s.heading,...s.paragraphs||[],...s.bullets||[],...(s.table?.rows.flat()||[])].join('')).join('');
    assert.ok(body.length>=550,`${a.slug}: too short (${body.length})`);
    const citations=a.sections.flatMap(s=>s.sources||[]);
    assert.ok(citations.length>0,a.slug);
    for(const key of citations) assert.ok(sources[key]?.url.startsWith('https://'));
    for(const slug of a.related) assert.ok(articles.some(other=>other.slug===slug&&other.slug!==a.slug));
  }
});

test('published article HTML has metadata, source disclosure, working anchors and real assets', async()=>{
  const sitemap=await fs.readFile('dist/sitemap.xml','utf8');
  for(const a of articles) {
    const route=`/blog/${a.slug}/`;
    const html=await fs.readFile(path.join('dist',route,'index.html'),'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.ok(html.includes(`https://peacedskin.com${route}`));
    assert.ok(html.includes('AI 辅助撰写'));
    assert.ok(html.includes('不是产品实拍'));
    assert.ok(html.includes('不构成诊断或治疗建议'));
    const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(schema['@type'],'BlogPosting');
    assert.equal(schema.headline,a.title);
    assert.ok(schema.citation.length>0);
    assert.ok(sitemap.includes(`<loc>https://peacedskin.com${route}</loc>`));
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target=match[1];
      if(target.startsWith('#')) assert.ok(html.includes(`id="${target.slice(1)}"`));
      else if(target.startsWith('/')&&!target.startsWith('/?')) {
        const file=target.endsWith('/')?`${target}index.html`:target;
        await fs.access(path.join('dist',file));
      }
    }
  }
  for(const item of Object.values(art)) {
    const bytes=await fs.readFile(`dist/illustrations/blog/${item.file}`);
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.ok(bytes.length<400000,'Article illustration should be web-sized');
  }
});

test('blog hub exposes all fifteen articles and no articles require JavaScript',async()=>{
  const html=await fs.readFile('dist/blog/index.html','utf8');
  for(const a of articles) assert.ok(html.includes(`/blog/${a.slug}/`));
  assert.equal((html.match(/class="card"/g)||[]).length,15);
  // Optional comparison loads progressively; the full guide remains static HTML.
  assert.match(html,/<script src="\/reading.js" defer><\/script>/);
  assert.ok(html.includes('data-pair='));
  const home=await fs.readFile('dist/index.html','utf8');
  assert.ok(home.includes('href="/blog/"'));
});
