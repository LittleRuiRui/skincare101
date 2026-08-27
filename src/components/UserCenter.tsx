import React,{useEffect,useState}from"react";
import{ArrowLeft,ChevronRight,LogIn,UserRound}from"lucide-react";
import type{SkinProfileRecord}from"../lib/skinProfile";
import{useLanguage}from"../lib/i18n";
import EmailAccountPanel from"./EmailAccountPanel";

const INK="#263027",PAPER="#F7F3EC",CARD="#FBF6EA",LINE="#D9D0BC",SAGE="#2F5A40",MUTE="#6F6A5F",ROSE="#A96F68";
const SANS="'IBM Plex Sans','PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,sans-serif";

export default function UserCenter({profile,profiles,onBack,onChooseProfile,onCreateProfile,onRenameProfile,onDeleteProfile,onReplayOnboarding}:{profile:SkinProfileRecord|null;profiles:SkinProfileRecord[];onBack:()=>void;onChooseProfile:(id:string)=>void;onCreateProfile:()=>void;onRenameProfile:(id:string,name:string)=>Promise<void>;onDeleteProfile:(id:string)=>Promise<void>;onReplayOnboarding?:()=>void}){
 const{t}=useLanguage();
 const[accountOpen,setAccountOpen]=useState(false);
 const[renaming,setRenaming]=useState(false);
 const[draftName,setDraftName]=useState(profile?.name||"");
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState("");
 useEffect(()=>{setDraftName(profile?.name||"");setRenaming(false);setError("")},[profile?.id]);
 async function rename(){if(!profile)return;setBusy(true);setError("");try{await onRenameProfile(profile.id,draftName);setRenaming(false)}catch(e){setError(e instanceof Error?e.message:t("无法重命名，请稍后重试","Unable to rename. Please try again."))}finally{setBusy(false)}}
 async function remove(){if(!profile)return;const ok=window.confirm(t(`确定删除「${profile.name}」吗？删除后无法恢复。`,`Delete “${profile.name}”? This cannot be undone.`));if(!ok)return;setBusy(true);setError("");try{await onDeleteProfile(profile.id)}catch(e){setError(e instanceof Error?e.message:t("无法删除，请稍后重试","Unable to delete. Please try again."))}finally{setBusy(false)}}
 if(accountOpen)return <EmailAccountPanel profile={profile} onBack={()=>setAccountOpen(false)} onReplayOnboarding={onReplayOnboarding}/>;
 return <div style={{minHeight:"100vh",background:PAPER,color:INK,padding:"22px 16px 48px",fontFamily:SANS}}><div style={{width:"100%",maxWidth:540,margin:"0 auto"}}>
  <button onClick={onBack} style={{border:0,padding:0,background:"transparent",display:"inline-flex",alignItems:"center",gap:6,color:MUTE,fontSize:12,cursor:"pointer",marginBottom:28}}><ArrowLeft size={14}/>{t("返回首页","Back to home")}</button>
  <div style={{fontSize:10,letterSpacing:".1em",color:SAGE,marginBottom:8}}>PROFILE & ACCOUNT</div>
  <h1 style={{fontSize:32,fontWeight:650,lineHeight:1.12,letterSpacing:"-.03em",margin:"0 0 8px"}}>{t("我的个人中心","My profile center")}</h1>
  <p style={{fontSize:13,color:MUTE,lineHeight:1.65,margin:"0 0 22px"}}>{t("肤质档案放在这里管理；首页只负责探索、推荐和日常使用。","Manage skin profiles here; the home page stays focused on discovery and daily use.")}</p>

  <section style={{border:`1px solid ${LINE}`,borderRadius:22,padding:17,background:CARD,marginBottom:14,boxShadow:"0 6px 20px rgba(40,55,42,.045)"}}>
   <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}><div style={{width:38,height:38,borderRadius:13,background:"#E9EFE7",display:"grid",placeItems:"center",color:SAGE}}><UserRound size={18}/></div><div><div style={{fontSize:11,color:SAGE,fontWeight:700,letterSpacing:".05em"}}>{t("肤质档案","SKIN PROFILES")}</div><div style={{fontSize:12,color:MUTE,marginTop:2}}>{profiles.length?t(`${profiles.length} 份已保存档案`,`${profiles.length} saved profile${profiles.length===1?"":"s"}`):t("还没有保存档案","No saved profiles yet")}</div></div></div>
   {profile?renaming?<div style={{display:"grid",gap:8}}><input value={draftName} onChange={e=>setDraftName(e.target.value)} maxLength={60} autoFocus style={{width:"100%",boxSizing:"border-box",border:`1px solid ${LINE}`,borderRadius:13,padding:"11px 12px",background:"#fff",color:INK,fontFamily:SANS,fontSize:14}}/><div style={{display:"flex",gap:8}}><button disabled={busy} onClick={()=>void rename()} style={{flex:1,border:0,borderRadius:12,padding:"10px 12px",background:SAGE,color:"white",fontSize:13,cursor:"pointer"}}>{t("保存名称","Save name")}</button><button disabled={busy} onClick={()=>{setRenaming(false);setDraftName(profile.name||"")}} style={{flex:1,border:`1px solid ${LINE}`,borderRadius:12,padding:"10px 12px",background:"white",color:MUTE,fontSize:13,cursor:"pointer"}}>{t("取消","Cancel")}</button></div></div>:<><div style={{display:"flex",gap:8}}><select value={profile.id} onChange={e=>onChooseProfile(e.target.value)} style={{minWidth:0,flex:1,border:`1px solid ${LINE}`,borderRadius:13,padding:"11px 12px",background:"#fff",color:INK,fontSize:14}}>{profiles.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={onCreateProfile} style={{border:0,borderRadius:13,padding:"10px 14px",background:SAGE,color:"white",fontSize:13,cursor:"pointer"}}>＋ {t("新建","New")}</button></div><div style={{display:"flex",gap:8,marginTop:9}}><button disabled={busy} onClick={()=>setRenaming(true)} style={{flex:1,border:`1px solid ${LINE}`,borderRadius:11,padding:"9px 10px",background:"white",color:MUTE,fontSize:12.5,cursor:"pointer"}}>{t("重命名","Rename")}</button><button disabled={busy} onClick={()=>void remove()} style={{flex:1,border:"1px solid #E8D3CF",borderRadius:11,padding:"9px 10px",background:"#FFF9F7",color:ROSE,fontSize:12.5,cursor:"pointer"}}>{t("删除档案","Delete profile")}</button></div></>:<button onClick={onCreateProfile} style={{width:"100%",border:0,borderRadius:13,padding:"11px 13px",background:SAGE,color:"white",fontWeight:700,cursor:"pointer"}}>＋ {t("建立第一份肤质档案","Create your first skin profile")}</button>}
   {error&&<div style={{fontSize:12,color:ROSE,marginTop:9,lineHeight:1.55}}>{error}</div>}
   <div style={{fontSize:11.5,color:MUTE,marginTop:12,lineHeight:1.6}}>{t("只有皮肤状态明显变化时才需要新建档案，不需要频繁更新。","Create a new profile only when your skin state meaningfully changes; frequent updates are unnecessary.")}</div>
  </section>

  <button onClick={()=>setAccountOpen(true)} style={{width:"100%",border:`1px solid ${LINE}`,borderRadius:20,padding:"16px 15px",background:"white",display:"flex",alignItems:"center",gap:12,textAlign:"left",cursor:"pointer",color:INK}}><div style={{width:38,height:38,borderRadius:13,background:"#F0EADF",display:"grid",placeItems:"center",color:SAGE}}><LogIn size={18}/></div><div style={{minWidth:0,flex:1}}><div style={{fontSize:14,fontWeight:700}}>{t("账号、登录与使用记录","Account, sign-in & history")}</div><div style={{fontSize:11.5,color:MUTE,marginTop:3}}>{t("登录、切换账号、退出、产品反馈记录和账号管理","Sign in, switch accounts, history, and account settings")}</div></div><ChevronRight size={17} color={MUTE}/></button>
 </div></div>
}
