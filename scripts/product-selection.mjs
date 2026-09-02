import fs from 'node:fs';
export const routeAliases=JSON.parse(fs.readFileSync(new URL('../data/product-route-aliases.json',import.meta.url),'utf8'));
export const slugify=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100).replace(/-+$/g,'');
// Published pilot routes stay unchanged. New records include their stable UUID:
// same-name / different-market products must not overwrite or hide one another.
export function selectAllProducts(rows){
 const ids=new Set(),slugs=new Set();
 return rows.map(row=>{
  if(!row?.id||!row?.brand||!row?.name)throw new Error('Public product is missing its identity; refusing a partial export.');
  if(!/^[0-9a-f-]{36}$/i.test(row.id)||ids.has(row.id))throw new Error('Invalid or duplicate public product ID: '+row.id);
  ids.add(row.id);
  const slug=routeAliases[row.id]||((slugify(row.brand+'-'+row.name)||'product')+'-'+row.id.toLowerCase());
  if(slugs.has(slug))throw new Error('Duplicate product route: '+slug);
  slugs.add(slug);
  return {...row,__slug:slug};
 }).sort((a,b)=>a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}

