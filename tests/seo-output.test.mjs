import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const read = file => fs.readFile(path.join('dist', file), 'utf8');

test('homepage has brand metadata, canonical, readable content and directory link', async () => {
  const html = await read('index.html');
  assert.match(html, /<title>Peacedskin/);
  assert.doesNotMatch(html, /Skincare101/);
  assert.match(html, /rel="canonical" href="https:\/\/peacedskin\.com\/"/);
  assert.match(html, /<h1>Peacedskin/);
  assert.match(html, /href="\/products\/"/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema.name, 'Peacedskin');
});

test('every sitemap URL has an actual static HTML file', async () => {
  const sitemap = await read('sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]));
  assert.equal(new Set(urls.map(url => url.href)).size, urls.length);
  assert.ok(urls.some(url => url.pathname === '/products/'));
  for (const url of urls) {
    assert.equal(url.origin, 'https://peacedskin.com');
    assert.ok((await read(path.join(url.pathname.slice(1), 'index.html'))).includes('<html'));
  }
});

test('directory links to all generated product pages and product links return to working routes', async () => {
  const products = JSON.parse(await read('seo-products.json'));
  const directory = await read('products/index.html');
  const sitemap=await read('sitemap.xml');
  const coverage=JSON.parse(await read('seo-product-coverage.json'));
  assert.equal(products.length,coverage.catalogCount);
  assert.equal(coverage.languagePages,products.length*2);
  assert.ok(products.length>50,'Full export must exceed the former pilot cap');
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
  assert.deepEqual(JSON.parse(await read('seo-pilot-products.json')),products,'Cached clients keep full coverage');
  const aliases=JSON.parse(await fs.readFile('data/product-route-aliases.json','utf8'));
  for(const p of products)if(aliases[p.id])assert.equal(p.slug,aliases[p.id]);
  for (const product of products) {
    assert.ok(directory.includes(`/product/${product.slug}/`));
    const html = await read(`product/${product.slug}/index.html`);
    assert.match(html, /href="\/en\/products\/"/);
    assert.ok(html.includes(`/?view=product&amp;product=${encodeURIComponent(product.id)}`));
    assert.equal(html.includes('content="noindex,follow"'),!product.indexable,product.slug);
    assert.equal(sitemap.includes(`<loc>https://peacedskin.com/product/${product.slug}/</loc>`),product.indexable,product.slug);
    assert.equal(sitemap.includes(`<loc>https://peacedskin.com/zh/product/${product.slug}/</loc>`),product.indexable,product.slug);
    assert.match(html, /<title>[^<]*Peacedskin<\/title>/);
    assert.doesNotMatch(html, /PEACED SKIN|Skincare101/);
    for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      assert.ok(JSON.parse(match[1])['@type']);
    }
  }
});
