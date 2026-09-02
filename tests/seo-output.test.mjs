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
  const products = JSON.parse(await read('seo-pilot-products.json'));
  const directory = await read('products/index.html');
  assert.ok(products.length > 0 && products.length <= 50);
  for (const product of products) {
    assert.ok(directory.includes(`/product/${product.slug}/`));
    const html = await read(`product/${product.slug}/index.html`);
    assert.match(html, /href="\/products\/"/);
    assert.ok(html.includes(`/?view=product&amp;product=${encodeURIComponent(product.id)}`));
    assert.match(html, /<title>[^<]*Peacedskin<\/title>/);
    assert.doesNotMatch(html, /PEACED SKIN|Skincare101/);
    for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      assert.ok(JSON.parse(match[1])['@type']);
    }
  }
});
