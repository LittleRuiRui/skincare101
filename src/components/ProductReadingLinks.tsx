import React,{useEffect,useState} from 'react';
import {useLanguage} from '../lib/i18n';
type Entry={id:string;slug:string};
let manifest:Promise<Entry[]>|undefined;
function loadManifest(){
  if(!manifest)manifest=fetch('/seo-products.json').then(async r=>{
    if(!r.ok)throw new Error('Reading index unavailable');
    const rows:unknown=await r.json();
    if(!Array.isArray(rows))throw new Error('Invalid reading index');
    return rows.filter((row):row is Entry=>typeof row.id==='string'&&typeof row.slug==='string'&&/^[a-z0-9-]+$/.test(row.slug));
  }).catch(():Entry[]=>{manifest=undefined;return []});
  return manifest;
}
export default function ProductReadingLinks({productId}:{productId:string}){
  const {language,t}=useLanguage();
  const [entries,setEntries]=useState<Entry[]>([]);
  useEffect(()=>{let active=true;loadManifest().then(rows=>{if(active)setEntries(rows)});return()=>{active=false}},[]);
  const entry=entries.find(row=>row.id===productId.replace(/^shared-/,''));
  const en=language==='en';
  return <nav aria-label={t('产品资料与护肤指南','Product reading and skincare guides')} style={{fontSize:14,lineHeight:1.8,display:'flex',flexWrap:'wrap',gap:'6px 14px',margin:'16px 0',color:'#2f5a40'}}>
    {entry?<a href={`${en?'':'/zh'}/product/${entry.slug}/#ingredients`} style={{color:'inherit'}}>{t('同款成分页 · 支持中英对照','This product’s ingredients · bilingual reading')}</a>:<a href={en?'/en/products/':'/products/'} style={{color:'inherit'}}>{t('浏览公开成分目录','Browse the public ingredient directory')}</a>}
    <a href={`${en?'/en':''}/blog/ingredient-list-how-to-read/`} style={{color:'inherit'}}>{t('成分表怎么看','How to read an ingredient list')}</a>
    <a href={`${en?'/en':''}/blog/`} style={{color:'inherit'}}>{t('全部护肤指南','All skincare guides')}</a>
  </nav>;
}
