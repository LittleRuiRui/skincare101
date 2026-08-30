import React,{useEffect,useMemo,useState}from"react";
import{ArrowLeft,RefreshCw,ShieldCheck}from"lucide-react";
import{supabase}from"../lib/supabase";
import{useLanguage}from"../lib/i18n";

const BG="#F6F0E3",CARD="#FBF6EA",INK="#283027",LINE="#D7CDB8",SAGE="#2F5A40",MUTE="#6F6A5F",ROSE="#A96F68";
type Summary={registered_users_total:number;registered_users_7d:number;registered_users_30d:number};
type EventRow={session_id:string|null;user_id:string|null;event_name:string;page_name:string|null;search_query:string|null;search_result_count:number|null;metadata:Record<string,unknown>|null;created_at:string};
type Period=1|7|30;
type FunnelStep={key:string;labelZh:string;labelEn:string;value:number};

function metaText(e:EventRow,key:string){const v=e.metadata?.[key];return typeof v==="string"&&v.trim()?v.trim():""}
function dayKey(x:string){return x.slice(0,10)}
function identity(e:EventRow){return metaText(e,"visitor_id")||e.session_id||""}
function actionName(e:EventRow){return metaText(e,"action")}
function errorText(err:unknown){if(err instanceof Error)return err.message;if(err&&typeof err==="object"){const x=err as Record<string,unknown>;return [x.message,x.details,x.hint,x.code].filter(Boolean).map(String).join(" / ")||"Analytics request failed"}return String(err)}
function pageLabel(name:string,t:(zh:string,en:string)=>string){const labels:Record<string,[string,string]>={home:["首页","Home"],mySkin:["我的肤质","My Skin"],explore:["发现","Discover"],routine:["护肤 Routine","Routine"],account:["我的","Me"],product:["产品库","Products"],product_detail:["产品详情","Product detail"],profileBuilder:["肤质建档","Skin profile builder"],onboardingComplete:["建档完成","Profile complete"],ingredientCheck:["成分检查","Ingredient check"],play_niuma:["牛马测试","Play / Niuma"]};const hit=labels[name];return hit?t(hit[0],hit[1]):name}
async function loadEvents(days:number){const since=new Date(Date.now()-days*86400000).toISOString();const out:EventRow[]=[];for(let page=0;page<10;page++){const from=page*1000,to=from+999;const{data,error}=await supabase.from("analytics_events").select("session_id,user_id,event_name,page_name,search_query,search_result_count,metadata,created_at").gte("created_at",since).order("created_at",{ascending:false}).range(from,to);if(error)throw error;const rows=(data||[]) as EventRow[];out.push(...rows);if(rows.length<1000)break}return out}

export default function AdminAnalyticsPanel({onBack}:{onBack:()=>void}){
 const{t}=useLanguage();
 const[allowed,setAllowed]=useState<boolean|null>(null);
 const[summary,setSummary]=useState<Summary|null>(null);
 const[events,setEvents]=useState<EventRow[]>([]);
 const[period,setPeriod]=useState<Period>(7);
 const[busy,setBusy]=useState(false);
 const[msg,setMsg]=useState("");
 const[loadedAt,setLoadedAt]=useState<Date|null>(null);

 async function refresh(){
  setBusy(true);setMsg("");
  try{
   const{data:isAdmin,error:a}=await supabase.rpc("is_admin");if(a)throw a;
   setAllowed(Boolean(isAdmin));if(!isAdmin)return;
   const[e,userSummary]=await Promise.all([
    loadEvents(30),
    supabase.functions.invoke("admin-console",{body:{action:"analyticsSummary"}})
   ]);
   setEvents(e);setLoadedAt(new Date());
   if(userSummary.error)throw userSummary.error;
   setSummary(userSummary.data as Summary);
  }catch(err){setMsg(errorText(err))}finally{setBusy(false)}
 }
 useEffect(()=>{void refresh()},[]);

 const data=useMemo(()=>{const cut=Date.now()-period*86400000;return events.filter(e=>new Date(e.created_at).getTime()>=cut)},[events,period]);
 const metrics=useMemo(()=>{
  const sessions=new Set(data.map(e=>e.session_id).filter(Boolean));
  const visitorIds=new Set(data.map(e=>metaText(e,"visitor_id")).filter(Boolean));
  const users=new Set(data.map(e=>e.user_id).filter(Boolean));
  const pv=data.filter(e=>e.event_name==="journey_page_view"||e.event_name==="play_page_view").length;
  const product=data.filter(e=>e.event_name==="product_detail_view").length;
  const search=data.filter(e=>e.event_name==="search").length;
  const zeroSearch=data.filter(e=>e.event_name==="search"&&e.search_result_count===0).length;
  const legacySessions=new Set(data.filter(e=>!metaText(e,"visitor_id")).map(e=>e.session_id).filter(Boolean));
  const daysByVisitor=new Map<string,Set<string>>();
  data.forEach(e=>{const id=metaText(e,"visitor_id");if(!id)return;const set=daysByVisitor.get(id)||new Set<string>();set.add(dayKey(e.created_at));daysByVisitor.set(id,set)});
  const returning=[...daysByVisitor.values()].filter(x=>x.size>=2).length;
  return{sessions:sessions.size,visitors:visitorIds.size,legacySessions:legacySessions.size,loggedIn:users.size,pv,product,search,zeroSearch,returning,pagesPerSession:sessions.size?Math.round(pv/sessions.size*10)/10:0,productRate:pv?Math.round(product/pv*100):0}
 },[data]);

 const funnel=useMemo(()=>{
  const byPerson=new Map<string,EventRow[]>();
  data.forEach(e=>{const id=identity(e);if(!id)return;const rows=byPerson.get(id)||[];rows.push(e);byPerson.set(id,rows)});
  const counts=[0,0,0,0,0];
  for(const rows of byPerson.values()){
   rows.sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
   let stage=1;
   for(const e of rows){
    if(stage===1&&(e.page_name==="profileBuilder"||actionName(e)==="start_profile"))stage=2;
    if(stage===2&&e.page_name==="onboardingComplete")stage=3;
    if(stage===3&&(e.page_name==="explore"||e.page_name==="product"||e.event_name==="product_detail_view"))stage=4;
    if(stage===4&&e.page_name==="routine")stage=5;
   }
   for(let i=0;i<stage;i++)counts[i]++;
  }
  const steps:FunnelStep[]=[
   {key:"visit",labelZh:"进入网站",labelEn:"Visited site",value:counts[0]},
   {key:"profile_start",labelZh:"开始肤质建档",labelEn:"Started skin profile",value:counts[1]},
   {key:"profile_complete",labelZh:"完成肤质建档",labelEn:"Completed skin profile",value:counts[2]},
   {key:"discover",labelZh:"进入产品发现",labelEn:"Reached product discovery",value:counts[3]},
   {key:"routine",labelZh:"进入 Routine",labelEn:"Reached Routine",value:counts[4]}
  ];
  const drops=steps.slice(1).map((step,i)=>{const prev=steps[i];const lost=Math.max(0,prev.value-step.value);const dropRate=prev.value?Math.round(lost/prev.value*100):0;return{from:prev,to:step,lost,dropRate}});
  const biggest=[...drops].filter(x=>x.from.value>=3).sort((a,b)=>b.dropRate-a.dropRate)[0]||null;
  return{steps,biggest,sample:steps[0].value};
 },[data]);

 const sources=useMemo(()=>{const map=new Map<string,Set<string>>();data.filter(e=>e.event_name==="session_start"||e.event_name==="play_page_view").forEach(e=>{const src=metaText(e,"traffic_source")||metaText(e,"utm_source")||"unknown / legacy";const id=identity(e)||"unknown";const set=map.get(src)||new Set<string>();set.add(id);map.set(src,set)});const rows=[...map.entries()].map(([source,set])=>({source,n:set.size})).sort((a,b)=>b.n-a.n).slice(0,12);const total=rows.reduce((s,x)=>s+x.n,0);return rows.map(x=>({...x,pct:total?Math.round(x.n/total*100):0}))},[data]);
 const pages=useMemo(()=>{const map=new Map<string,number>();data.filter(e=>e.event_name==="journey_page_view"||e.event_name==="product_detail_view"||e.event_name==="play_page_view").forEach(e=>{const name=e.page_name||metaText(e,"route")||e.event_name;map.set(name,(map.get(name)||0)+1)});return[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12)},[data]);
 const searches=useMemo(()=>{const map=new Map<string,{n:number,zero:number}>();data.filter(e=>e.event_name==="search"&&e.search_query?.trim()).forEach(e=>{const key=e.search_query!.trim();const row=map.get(key)||{n:0,zero:0};row.n++;if(e.search_result_count===0)row.zero++;map.set(key,row)});return[...map.entries()].map(([q,v])=>({q,...v})).sort((a,b)=>b.n-a.n).slice(0,12)},[data]);
 const trend=useMemo(()=>{const count=Math.min(period,14);const days:Array<{key:string,label:string,pv:number;sessions:Set<string>}>=[];for(let i=count-1;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString(undefined,{month:"numeric",day:"numeric"}),pv:0,sessions:new Set()})}const map=new Map(days.map(x=>[x.key,x]));data.forEach(e=>{const d=map.get(dayKey(e.created_at));if(!d)return;if(e.event_name==="journey_page_view"||e.event_name==="play_page_view")d.pv++;if(e.session_id)d.sessions.add(e.session_id)});return days},[data,period]);
 const lastEvent=events[0]?.created_at?new Date(events[0].created_at):null;

 if(allowed===false)return <Page><button onClick={onBack} style={back}><ArrowLeft size={14}/>{t("返回","Back")}</button><h1>{t("无管理权限","Admin access required")}</h1></Page>;
 return <Page>
  <button onClick={onBack} style={back}><ArrowLeft size={14}/>{t("返回管理后台","Back to admin")}</button>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div style={{fontSize:10,letterSpacing:".12em",color:SAGE,fontWeight:800}}>PEACED SKIN ANALYTICS</div><h1 style={{fontSize:32,margin:"7px 0 4px"}}>{t("经营数据","Growth dashboard")}</h1><div style={{fontSize:12,color:MUTE}}>{t("先看用户和漏斗，再看流量细节。","Users and funnel first, traffic details second.")}</div></div><button onClick={()=>void refresh()} disabled={busy} style={icon} aria-label={t("刷新","Refresh")}><RefreshCw size={16}/></button></div>
  <div style={{display:"flex",gap:7,margin:"16px 0 8px"}}>{([1,7,30] as Period[]).map(x=><button key={x} onClick={()=>setPeriod(x)} style={{...pill,background:period===x?"#E8EFE7":"white",borderColor:period===x?SAGE:LINE,color:period===x?SAGE:MUTE}}>{x===1?t("近24小时","24H"):x+"D"}</button>)}</div>
  <div style={{fontSize:10.5,color:MUTE,marginBottom:14}}>{lastEvent?t(`最近事件：${lastEvent.toLocaleString()}`,`Latest event: ${lastEvent.toLocaleString()}`):t("暂无事件","No events yet")}{loadedAt?` / ${t("刷新","refreshed")} ${loadedAt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`:""}</div>
  {msg&&<div style={{...card,color:ROSE}}>{msg}</div>}

  <section style={card}><Title>{t("用户概览","User overview")}</Title><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9}}><M label={t("注册用户总数","Registered users")} v={summary?.registered_users_total??"—"}/><M label={t("近7天新增注册","New registrations / 7d")} v={summary?.registered_users_7d??"—"}/><M label={t("近30天新增注册","New registrations / 30d")} v={summary?.registered_users_30d??"—"}/><M label={t("本周期登录活跃","Signed-in active")} v={metrics.loggedIn}/><M label={t("独立访客","Unique visitors")} v={metrics.visitors}/><M label={t("回访访客","Returning visitors")} v={metrics.returning}/></div></section>

  <section style={card}><Title>{t("标准化用户漏斗","Standardized user funnel")}</Title><div style={{fontSize:11,color:MUTE,lineHeight:1.55,marginBottom:7}}>{t("按同一个 visitor/session 的实际先后顺序计算，后一步必须发生在前一步之后，所以可以直接看哪里掉人。","Calculated in actual sequence for the same visitor/session. Each later step must occur after the previous one, so drop-off is interpretable.")}</div>{funnel.steps.map((step,i)=>{const prev=i?funnel.steps[i-1]:null;const conversion=prev&&prev.value?Math.round(step.value/prev.value*100):100;const lost=prev?Math.max(0,prev.value-step.value):0;return <div key={step.key} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:10,padding:"11px 0",borderTop:`1px solid ${LINE}`}}><div><b style={{fontSize:12}}>{t(step.labelZh,step.labelEn)}</b>{prev&&<div style={{fontSize:10.5,color:MUTE,marginTop:3}}>{t(`上一步→本步 ${conversion}%；掉队 ${lost} 人`,`Step conversion ${conversion}% / ${lost} dropped`)}</div>}</div><div style={{fontSize:22,fontWeight:760}}>{step.value}</div></div>})}</section>

  <section style={{...card,borderColor:funnel.biggest&&funnel.biggest.dropRate>=50?"#C79B84":LINE}}><Title>{t("卡点诊断","Drop-off diagnosis")}</Title>{funnel.biggest?<><div style={{fontSize:13,fontWeight:760,lineHeight:1.55}}>{t(`最大卡点：${funnel.biggest.from.labelZh} → ${funnel.biggest.to.labelZh}`,`Largest drop: ${funnel.biggest.from.labelEn} → ${funnel.biggest.to.labelEn}`)}</div><div style={{fontSize:12,color:funnel.biggest.dropRate>=50?ROSE:MUTE,marginTop:5}}>{t(`流失 ${funnel.biggest.lost} 人，掉队率 ${funnel.biggest.dropRate}%`,`Lost ${funnel.biggest.lost} users / ${funnel.biggest.dropRate}% drop-off`)}</div><div style={{fontSize:11,color:MUTE,lineHeight:1.55,marginTop:8}}>{funnel.sample<10?t("当前样本很小，只当方向提示，不要据此改产品。","Sample is still small; treat this as directional, not a product decision yet."):t("优先检查这一跳的页面理解成本、CTA 可见性、加载/登录阻力和是否存在功能错误。","Prioritize this transition: comprehension, CTA visibility, loading/login friction and possible functional errors.")}</div></>:<Empty>{t("当前样本不足以判断稳定卡点。","Not enough data to identify a stable bottleneck yet.")}</Empty>}</section>

  {metrics.legacySessions>0&&<div style={{...card,fontSize:11.5,color:MUTE,lineHeight:1.6}}>{t(`另有 ${metrics.legacySessions} 个旧会话发生在 visitor ID 埋点完善前，因此不会硬算成独立访客。`,`There are ${metrics.legacySessions} legacy sessions from before visitor-ID tracking was complete; they are not forced into the unique-visitor count.`)}</div>}

  <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:9,marginBottom:12}}><M label={t("会话","Sessions")} v={metrics.sessions}/><M label={t("页面浏览","Page views")} v={metrics.pv}/><M label={t("每会话页面","Pages / session")} v={metrics.pagesPerSession}/><M label={t("产品详情","Product views")} v={metrics.product}/><M label={t("产品浏览率","Product engagement")} v={metrics.productRate} suffix="%"/><M label={t("搜索","Searches")} v={metrics.search}/></div>

  <section style={card}><Title>{t("访问趋势","Traffic trend")}</Title><div style={{display:"grid",gap:8}}>{trend.map(x=>{const max=Math.max(1,...trend.map(y=>y.pv));return <div key={x.key} style={{display:"grid",gridTemplateColumns:"42px 1fr 58px",gap:8,alignItems:"center",fontSize:10.5}}><span style={{color:MUTE}}>{x.label}</span><div style={{height:8,borderRadius:999,background:"#ECE5D8",overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(x.pv?4:0,x.pv/max*100)}%`,background:SAGE,borderRadius:999}}/></div><span style={{textAlign:"right",color:MUTE}}>{x.pv} PV</span></div>})}</div></section>
  <section style={card}><Title>{t("来源","Traffic sources")}</Title>{sources.length?sources.map(x=><Row key={x.source}><b>{x.source}</b><span>{x.n} / {x.pct}%</span></Row>):<Empty>{t("新来源埋点上线后会从这里开始累计。","Traffic-source tracking will accumulate here.")}</Empty>}</section>
  <section style={card}><Title>{t("最常访问页面","Top pages")}</Title>{pages.length?pages.map(([name,n])=><Row key={name}><b>{pageLabel(name,t)}</b><span>{n}</span></Row>):<Empty>{t("暂无页面浏览。","No page views yet.")}</Empty>}</section>
  <section style={card}><Title>{t("搜索质量","Search quality")}</Title><Row><b>{t("零结果搜索","Zero-result searches")}</b><span>{metrics.zeroSearch}</span></Row>{searches.length?searches.map(x=><Row key={x.q}><b>{x.q}</b><span>{x.n}{x.zero?` / ${x.zero} zero`:""}</span></Row>):<Empty>{t("暂无搜索。","No searches yet.")}</Empty>}</section>
  <div style={{...card,fontSize:11.5,color:MUTE,lineHeight:1.65}}><ShieldCheck size={14} style={{verticalAlign:"-2px",marginRight:6}}/>{t("注册用户数量通过受保护的 admin Edge Function 读取；Analytics 仍只对 is_admin() 通过的账号开放。匿名 visitor ID 用于漏斗与回访统计，不记录完整 IP。","Registration counts are read through the protected admin Edge Function. Analytics remains restricted to accounts passing is_admin(). Anonymous visitor IDs are used for funnel/returning analysis; full IP addresses are not stored.")}</div>
 </Page>
}

function Page({children}:{children:React.ReactNode}){return <div style={{minHeight:"100vh",background:BG,color:INK,padding:"22px 16px 64px"}}><div style={{maxWidth:820,margin:"0 auto"}}>{children}</div></div>}
function M({label,v,suffix=""}:{label:string;v:React.ReactNode;suffix?:string}){return <div style={{...card,marginBottom:0,padding:14}}><div style={{fontSize:10.5,color:MUTE}}>{label}</div><div style={{fontSize:26,fontWeight:750,marginTop:3}}>{v}{suffix}</div></div>}
function Title({children}:{children:React.ReactNode}){return <div style={{fontSize:11,fontWeight:750,color:SAGE,letterSpacing:".06em",marginBottom:8}}>{children}</div>}
function Row({children}:{children:React.ReactNode}){return <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,padding:"9px 0",borderTop:`1px solid ${LINE}`,fontSize:11.5}}>{children}</div>}
function Empty({children}:{children:React.ReactNode}){return <div style={{fontSize:11.5,color:MUTE,padding:"8px 0"}}>{children}</div>}
const card:React.CSSProperties={border:`1px solid ${LINE}`,borderRadius:18,padding:15,background:CARD,marginBottom:12};
const back:React.CSSProperties={border:0,background:"transparent",padding:0,color:MUTE,fontSize:12,display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:22};
const icon:React.CSSProperties={border:`1px solid ${LINE}`,borderRadius:12,padding:9,background:"white",color:SAGE,cursor:"pointer"};
const pill:React.CSSProperties={border:"1px solid",borderRadius:999,padding:"8px 12px",fontSize:11,fontWeight:750,cursor:"pointer"};