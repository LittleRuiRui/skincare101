import React,{useEffect,useState}from"react";
import V4App from"./V4App";
import MyShelf from"./components/MyShelf";
import{loadSharedProductCatalog,type SharedProductRecord}from"./lib/supabase";
import{LanguageProvider}from"./lib/i18n";

export default function V5App(){const[shelfOpen,setShelfOpen]=useState(false);const[products,setProducts]=useState<SharedProductRecord[]>([]);useEffect(()=>{let active=true;loadSharedProductCatalog().then(rows=>{if(active)setProducts(rows)}).catch(()=>{});return()=>{active=false}},[]);if(shelfOpen)return <LanguageProvider><MyShelf products={products} onBack={()=>setShelfOpen(false)}/></LanguageProvider>;return <><V4App/><button onClick={()=>setShelfOpen(true)} aria-label="My Shelf / 我的护肤柜" style={{position:"fixed",left:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 16px)",zIndex:120,border:"1px solid #D7CDB8",borderRadius:999,padding:"10px 13px",background:"rgba(251,246,234,.96)",color:"#2F5A40",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px rgba(40,55,42,.12)",cursor:"pointer",backdropFilter:"blur(8px)"}}>我的护肤柜 · My Shelf</button></>}
