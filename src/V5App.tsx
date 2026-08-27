import React,{useEffect,useMemo,useState}from"react";
import V4App from"./V4App";
import MyShelf from"./components/MyShelf";
import{loadSharedProductCatalog,type SharedProductRecord}from"./lib/supabase";
import{doINeedThis,loadShelf}from"./lib/myShelf";
import{LanguageProvider}from"./lib/i18n";

function norm(v:string){return v.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,"").trim()}

export default function V5App(){
 const[shelfOpen,setShelfOpen]=useState(false);
 const[products,setProducts]=useState<SharedProductRecord[]>([]);
 const[context,setContext]=useState<"home"|"routine"|"product"|"other">("home");
 const[currentProduct,setCurrentProduct]=useState<SharedProductRecord|null>(null);
 const[needOpen,setNeedOpen]=useState(false);
 useEffect(()=>{let active=true;loadSharedProductCatalog().then(rows=>{if(active)setProducts(rows)}).catch(()=>{});return()=>{active=false}},[]);
 useEffect(()=>{const scan=()=>{const page=document.querySelector<HTMLElement>(".site-content");if(!page)return;const cls=page.className;if(cls.includes("page-routine")){setContext("routine");setCurrentProduct(null);return}if(cls.includes("page-product")){setContext("product");const h1=page.querySelector("h1")?.textContent||"";const eyebrow=page.querySelector("h1")?.previousElementSibling?.textContent||"";const h=norm(h1),e=norm(eyebrow);const match=products.find(p=>norm(p.productLocalName||p.name)===h||norm(p.productEnglishName||p.name)===h)||products.find(p=>h&&norm(`${p.brand}${p.name}${p.productLocalName||""}${p.productEnglishName||""}`).includes(h)&&(!e||e.includes(norm(p.brand))));setCurrentProduct(match||null);return}if(cls.includes("page-home")){setContext("home");setCurrentProduct(null);return}setContext("other");setCurrentProduct(null)};scan();const obs=new MutationObserver(scan);obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});return()=>obs.disconnect()},[products]);
 useEffect(()=>{const open=()=>setShelfOpen(true);window.addEventListener("skincare101:open-shelf",open as EventListener);return()=>window.removeEventListener("skincare101:open-shelf",open as EventListener)},[]);
 const owned=useMemo(()=>{const ids=new Set(loadShelf().map(e=>e.productId));return products.filter(p=>ids.has(p.id))},[products,shelfOpen,needOpen]);
 const verdict=currentProduct?doINeedThis(currentProduct,owned):null;
 if(shelfOpen)return <LanguageProvider><MyShelf products={products} onBack={()=>setShelfOpen(false)}/></LanguageProvider>;
 const label=context==="product"?"我需要买吗？ · Do I need this?":context==="routine"?"用我的护肤柜搭配 · Use My Shelf":"我的护肤柜 · My Shelf";
 function action(){if(context==="product"&&currentProduct){setNeedOpen(true);return}setShelfOpen(true)}
 return <><V4App/><button onClick={action} aria-label={label} style={{position:"fixed",left:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 13px",background:"rgba(251,246,234,.96)",color:"#2F5A40",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px rgba(40,55,42,.12)",cursor:"pointer",backdropFilter:"blur(8px)"}}>{label}</button>{needOpen&&currentProduct&&verdict&&<div onClick={()=>setNeedOpen(false)} style={{position:"fixed",inset:0,zIndex:160,background:"rgba(27,34,28,.32)",display:"grid",placeItems:"end center",padding:"20px 14px"}}><div onClick={e=>e.stopPropagation()} style={{width:"min(560px,100%)",boxSizing:"border-box",border:"1px solid #D7CDB8",borderRadius:22,padding:18,background:"#FBF6EA",boxShadow:"0 20px 50px rgba(30,40,31,.2)"}}><div style={{fontSize:10.5,fontWeight:700,letterSpacing:".1em",color:"#2F5A40",marginBottom:8}}>DO I NEED THIS?</div><div style={{fontSize:13,color:"#6F6A5F",marginBottom:5}}>{currentProduct.brand} · {currentProduct.productLocalName||currentProduct.name}</div><div style={{fontSize:23,fontWeight:700,color:verdict.level==="not-recommended"?"#A96F68":"#283027",marginBottom:7}}>{verdict.labelZh} · {verdict.labelEn}</div><div style={{fontSize:13,lineHeight:1.65,color:"#6F6A5F"}}>{verdict.reasonZh}</div><div style={{fontSize:12,lineHeight:1.6,color:"#777870",marginTop:8}}>{verdict.reasonEn}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:15}}><button onClick={()=>{setNeedOpen(false);setShelfOpen(true)}} style={{border:"1px solid #D7CDB8",borderRadius:13,padding:"10px 11px",background:"white",color:"#2F5A40",fontWeight:700,cursor:"pointer"}}>查看我的护肤柜</button><button onClick={()=>setNeedOpen(false)} style={{border:0,borderRadius:13,padding:"10px 11px",background:"#2F5A40",color:"white",fontWeight:700,cursor:"pointer"}}>知道了</button></div></div></div>}</>}
