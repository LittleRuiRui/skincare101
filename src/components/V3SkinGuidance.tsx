import React from "react";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import type { SkinProfileRecord } from "../lib/skinProfile";
import { summarizeSkinProfile } from "../lib/skinProfile";
import { localizeSkinSummary, useLanguage } from "../lib/i18n";

const INK="#252724",BG="#F6F4EF",CARD="#FCFBF8",LINE="#DEDCD5",SAGE="#667A6C",MUTE="#777870";
const sans="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";

export default function V3SkinGuidance({profile,onBack,onProducts,onIngredientCheck}:{profile:SkinProfileRecord|null;onBack:()=>void;onProducts:()=>void;onIngredientCheck:()=>void}){
 const{t,language}=useLanguage(); const summary=localizeSkinSummary(summarizeSkinProfile(profile),language); const priority=summary.concerns[0]||t("屏障稳定","Barrier stability");
 return <div style={{minHeight:"100vh",background:BG,color:INK,padding:"22px 18px 54px",fontFamily:sans}}><div style={{maxWidth:580,margin:"0 auto"}}>
 <button onClick={onBack} style={{border:0,background:"transparent",padding:0,color:MUTE,fontSize:13,cursor:"pointer",marginBottom:30,display:"flex",gap:7,alignItems:"center",fontFamily:sans}}><ArrowLeft size={15}/>{t("返回我的肤质","Back to My Skin")}</button>
 <div style={{fontSize:11,letterSpacing:".12em",color:SAGE,fontWeight:700,marginBottom:10}}>{t("你的肌肤分析","YOUR SKIN ANALYSIS")} · {priority}</div>
 <h1 style={{fontSize:32,fontWeight:650,lineHeight:1.2,letterSpacing:"-.035em",margin:"0 0 22px"}}>{t("先做这三件事","Start with these three things")}</h1>
 <section style={{border:`1px solid ${SAGE}`,borderRadius:20,padding:18,background:"#E9EEE9",marginBottom:14}}><div style={{fontSize:15,fontWeight:700,color:SAGE,marginBottom:16}}>{t("当前优先方向：","Current priority: ")}{priority}</div>{[[t("1 · 先简化","1 · Simplify first"),t("暂停近期新增、明显刺激或与你当前方向冲突的产品。","Pause recently added, clearly irritating, or conflicting products.")],[t("2 · 保留基础","2 · Keep the basics"),t("温和清洁、合适的保湿与白天防晒先保持稳定。","Keep gentle cleansing, suitable moisturization, and daytime sunscreen stable.")],[t("3 · 再做选择","3 · Choose next"),t("先看产品匹配，再决定下一件真正值得加入的产品。","Check product fit before deciding what is actually worth adding next.")]].map(([a,b])=><div key={a} style={{marginBottom:16}}><div style={{fontWeight:700,fontSize:14,marginBottom:5}}>{a}</div><div style={{fontSize:13,color:MUTE,lineHeight:1.65}}>{b}</div></div>)}<div style={{borderTop:`1px solid ${LINE}`,paddingTop:13,fontSize:12,color:MUTE,lineHeight:1.6}}>{t("建议观察 2–4 周；若持续加重、疼痛或出现异常皮损，请及时就医。","Observe for 2–4 weeks. Seek medical care if symptoms keep worsening, become painful, or unusual lesions appear.")}</div></section>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={onIngredientCheck} style={{border:`1px solid ${LINE}`,borderRadius:16,padding:"13px 14px",background:CARD,color:INK,fontFamily:sans,fontWeight:650,fontSize:13,cursor:"pointer",display:"flex",gap:7,justifyContent:"center",alignItems:"center"}}><Sparkles size={15}/>{t("查成分","Check ingredients")}</button><button onClick={onProducts} style={{border:0,borderRadius:16,padding:"13px 14px",background:SAGE,color:"white",fontFamily:sans,fontWeight:650,fontSize:13,cursor:"pointer",display:"flex",gap:7,justifyContent:"center",alignItems:"center"}}><Search size={15}/>{t("看产品匹配","See product matches")}</button></div>
 </div></div>;
}
