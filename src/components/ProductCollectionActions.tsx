import React,{useEffect,useMemo,useState}from"react";
import{Check,Heart,Star,X}from"lucide-react";
import{useLanguage}from"../lib/i18n";
import{useAppRuntime}from"../lib/appRuntime";
import{readProductPreferences,updateProductPreference,type ProductPreferenceMap}from"../lib/productLibrary";
import{loadProductExperience,saveProductExperience,type ProductReaction}from"../lib/productFeedback";
import{loadPublicProductExperiences,savePublicProductExperience}from"../lib/supabase";
import{summarizeSkinProfile}from"../lib/skinProfile";

export default function ProductCollectionActions(){
 const{t}=useLanguage();
 const{viewContext,currentProduct:current,profile}=useAppRuntime();
 const[prefs,setPrefs]=useState<ProductPreferenceMap>(()=>readProductPreferences());
 const[feedbackOpen,setFeedbackOpen]=useState(false);
 const[reaction,setReaction]=useState<ProductReaction>("neutral"),[texture,setTexture]=useState<"love"|"okay"|"dislike">("okay"),[repurchase,setRepurchase]=useState<"yes"|"maybe"|"no">("maybe"),[note,setNote]=useState("");
 const[feedbackStatus,setFeedbackStatus]=useState<"idle"|"saving"|"saved"|"error">("idle"),[feedbackMessage,setFeedbackMessage]=useState("");
 useEffect(()=>{const sync=()=>setPrefs(readProductPreferences());window.addEventListener("storage",sync);window.addEventListener("skincare101:product-preferences-changed",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("skincare101:product-preferences-changed",sync)}},[]);
 useEffect(()=>{if(!current)return;const x=loadProductExperience(current.id);setReaction(x?.reaction||"neutral");setTexture(x?.texture||"okay");setRepurchase(x?.repurchase||"maybe");setNote(x?.note||"");setFeedbackStatus("idle");setFeedbackMessage("")},[current?.id]);
 const pref=useMemo(()=>current?prefs[current.id]||{liked:false,watchlist:false,tried:null}:{liked:false,watchlist:false,tried:null},[current,prefs]);
 const hasTried=useMemo(()=>current?Boolean(loadProductExperience(current.id))||pref.tried!==null:false,[current,pref.tried,feedbackStatus]);
 if(viewContext!=="product"||!current)return null;
 function update(patch:Partial<typeof pref>){updateProductPreference(current.id,patch);setPrefs(readProductPreferences())}
 const iconBtn=(active:boolean)=>({border:`1px solid ${active?"#2F5A40":"#D7CDB8"}`,borderRadius:999,width:42,height:42,padding:0,background:active?"#EAF2E9":"rgba(255,255,255,.96)",color:active?"#244B35":"#6F6A5F",cursor:"pointer",display:"inline-grid",placeItems:"center",boxShadow:"0 2px 10px rgba(66,55,39,.06)"});
 const selectStyle={width:"100%",boxSizing:"border-box" as const,border:"1px solid #DDD6CA",borderRadius:10,padding:"10px 11px",background:"white",fontSize:12,color:"#211F1B"};
 const profileSummary=summarizeSkinProfile(profile);
 async function submitExperience(){
  if(!profileSummary.isComplete){setFeedbackStatus("error");setFeedbackMessage(t("请先建立肤质档案，这样别人才能理解这条体验来自什么肤质。","Create a skin profile first so other users can understand the context of your experience."));return}
  setFeedbackStatus("saving");setFeedbackMessage("");
  try{
   await savePublicProductExperience({productKey:current.id,skinType:profileSummary.skinType,sensitivity:profileSummary.sensitivity,concerns:profileSummary.concerns,reaction,texture,repurchase,note});
   saveProductExperience({productId:current.id,reaction,texture,repurchase,note:note.trim()});
   await loadPublicProductExperiences(current.id);
   const negative=reaction==="irritated"||texture==="dislike"||repurchase==="no";
   update({tried:negative?"disliked":"liked"});
   setFeedbackStatus("saved");setFeedbackMessage(t("已保存。这里和产品页的使用反馈是同一条记录。","Saved. This is the same experience record used on the product page."));
  }catch(e){setFeedbackStatus("error");setFeedbackMessage(e instanceof Error?e.message:t("暂时无法提交，请稍后重试。","Unable to submit right now. Please try again later."))}
 }
 return <>
  <div style={{position:"fixed",right:14,bottom:"calc(env(safe-area-inset-bottom, 0px) + 68px)",zIndex:125,display:"flex",gap:7,justifyContent:"flex-end"}}>
   <button onClick={()=>update({liked:!pref.liked})} style={iconBtn(pref.liked)} aria-label={pref.liked?t("取消喜欢","Unlike"):t("喜欢","Like")} title={t("喜欢","Like")} aria-pressed={pref.liked}><Heart size={19} fill={pref.liked?"currentColor":"none"}/></button>
   <button onClick={()=>update({watchlist:!pref.watchlist})} style={iconBtn(pref.watchlist)} aria-label={pref.watchlist?t("移出收藏","Remove from watchlist"):t("收藏","Watchlist")} title={t("收藏","Watchlist")} aria-pressed={pref.watchlist}><Star size={19} fill={pref.watchlist?"currentColor":"none"}/></button>
   <button onClick={()=>setFeedbackOpen(true)} style={iconBtn(hasTried)} aria-label={t("用过 / 使用反馈","Tried / feedback")} title={t("用过","Tried")} aria-pressed={hasTried}><Check size={20} strokeWidth={2.4}/></button>
  </div>
  {feedbackOpen&&<div onMouseDown={e=>{if(e.currentTarget===e.target)setFeedbackOpen(false)}} style={{position:"fixed",inset:0,zIndex:220,background:"rgba(33,31,27,.38)",display:"grid",placeItems:"center",padding:"20px 16px"}}>
   <section role="dialog" aria-modal="true" aria-label={t("使用反馈","Product feedback")} style={{width:"min(100%,430px)",maxHeight:"min(82vh,680px)",overflowY:"auto",boxSizing:"border-box",border:"1px solid #DDD6CA",borderRadius:20,background:"#F7F3EC",padding:18,boxShadow:"0 18px 55px rgba(30,25,20,.22)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:5}}><div style={{fontSize:11,color:"#718276",letterSpacing:".08em"}}>{t("使用反馈","PRODUCT FEEDBACK")}</div><button onClick={()=>setFeedbackOpen(false)} aria-label={t("关闭","Close")} style={{border:0,background:"transparent",padding:4,color:"#777065",cursor:"pointer"}}><X size={18}/></button></div>
    <div style={{fontSize:18,fontWeight:650,color:"#211F1B",marginBottom:4,overflowWrap:"anywhere"}}>{current.productLocalName||current.productEnglishName||current.name}</div>
    <div style={{fontSize:10.5,color:"#777065",lineHeight:1.5,marginBottom:14}}>{t("与产品页的“分享你的使用体验”共用同一套记录；已经评价过的话，这里会直接编辑原记录。","This uses the same record as the product-page experience form. Existing feedback is edited rather than duplicated.")}</div>
    <div style={{display:"grid",gap:8,marginBottom:9}}>
     <select aria-label={t("使用后的皮肤变化","Skin response")} value={reaction} onChange={e=>setReaction(e.target.value as ProductReaction)} style={selectStyle}><option value="better">{t("皮肤有改善","Skin improved")}</option><option value="neutral">{t("没有明显变化","No clear change")}</option><option value="irritated">{t("出现刺激或不适","Irritation or discomfort")}</option></select>
     <select aria-label={t("产品肤感","Texture")} value={texture} onChange={e=>setTexture(e.target.value as typeof texture)} style={selectStyle}><option value="love">{t("喜欢肤感","Liked the texture")}</option><option value="okay">{t("肤感一般","Texture was okay")}</option><option value="dislike">{t("不喜欢肤感","Disliked the texture")}</option></select>
     <select aria-label={t("是否回购","Repurchase")} value={repurchase} onChange={e=>setRepurchase(e.target.value as typeof repurchase)} style={selectStyle}><option value="yes">{t("会回购","Would repurchase")}</option><option value="maybe">{t("可能回购","Might repurchase")}</option><option value="no">{t("不会回购","Would not repurchase")}</option></select>
    </div>
    <textarea maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder={t("例如：用了多久、什么天气、是否闷痘或刺痛……","For example: how long you used it, climate, breakouts, stinging or other reactions…")} style={{width:"100%",boxSizing:"border-box",minHeight:88,resize:"vertical",border:"1px solid #DDD6CA",borderRadius:10,padding:10,fontSize:12,marginBottom:9,background:"white"}}/>
    <button disabled={feedbackStatus==="saving"} onClick={submitExperience} style={{width:"100%",border:0,borderRadius:999,padding:11,background:"#718276",color:"white",fontSize:12,fontWeight:650,cursor:feedbackStatus==="saving"?"wait":"pointer",opacity:feedbackStatus==="saving"?.65:1}}>{feedbackStatus==="saving"?t("正在提交…","Submitting…"):feedbackStatus==="saved"?t("已保存，可继续修改","Saved — you can still edit it"):t("保存使用反馈","Save feedback")}</button>
    {feedbackMessage&&<div style={{fontSize:10,color:feedbackStatus==="error"?"#A8503A":"#4E6254",marginTop:8,lineHeight:1.45}}>{feedbackMessage}</div>}
   </section>
  </div>}
 </>;
}
